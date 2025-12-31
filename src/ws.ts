/**
 * NanoPy SDK WebSocket Client
 * Real-time subscriptions for blockchain events
 */

import { SubscriptionType, SubscriptionOptions, NewHeadEvent, LogEvent } from './types';

type EventCallback = (data: any) => void;

export class WSClient {
  private url: string;
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, EventCallback> = new Map();
  private requestId: number = 0;
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private autoReconnect: boolean = true;

  // Event handlers
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;

  constructor(url: string) {
    // Convert http to ws
    this.url = url.replace(/^http/, 'ws');
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.onConnect?.();
          resolve();
        };

        this.ws.onclose = () => {
          this.onDisconnect?.();
          this.handleDisconnect();
        };

        this.ws.onerror = (event) => {
          const error = new Error('WebSocket error');
          this.onError?.(error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.autoReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.pendingRequests.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Subscribe to new block headers
   */
  async subscribeNewHeads(callback: (block: NewHeadEvent) => void): Promise<string> {
    return this.subscribe('newHeads', {}, callback);
  }

  /**
   * Subscribe to pending transactions
   */
  async subscribePendingTransactions(callback: (txHash: string) => void): Promise<string> {
    return this.subscribe('newPendingTransactions', {}, (data) => {
      callback(data);
    });
  }

  /**
   * Subscribe to contract logs/events
   */
  async subscribeLogs(
    options: SubscriptionOptions,
    callback: (log: LogEvent) => void
  ): Promise<string> {
    return this.subscribe('logs', options, callback);
  }

  /**
   * Subscribe to Transfer events for a token
   */
  async subscribeTransfers(
    tokenAddress: string,
    callback: (from: string, to: string, value: bigint, log: LogEvent) => void
  ): Promise<string> {
    // Transfer(address,address,uint256) topic
    const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

    return this.subscribeLogs(
      { address: tokenAddress, topics: [transferTopic] },
      (log) => {
        const from = '0x' + log.topics[1].slice(26);
        const to = '0x' + log.topics[2].slice(26);
        const value = BigInt(log.data);
        callback(from, to, value, log);
      }
    );
  }

  /**
   * Generic subscribe method
   */
  async subscribe(
    type: SubscriptionType,
    options: SubscriptionOptions,
    callback: EventCallback
  ): Promise<string> {
    if (!this.isConnected()) {
      await this.connect();
    }

    const params: any[] = [type];
    if (type === 'logs' && (options.address || options.topics)) {
      params.push({
        address: options.address,
        topics: options.topics
      });
    }

    const subscriptionId = await this.send('eth_subscribe', params);
    this.subscriptions.set(subscriptionId, callback);

    return subscriptionId;
  }

  /**
   * Unsubscribe from a subscription
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    const result = await this.send('eth_unsubscribe', [subscriptionId]);
    this.subscriptions.delete(subscriptionId);
    return result;
  }

  /**
   * Unsubscribe from all subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    const promises = Array.from(this.subscriptions.keys()).map(id =>
      this.unsubscribe(id).catch(() => {})
    );
    await Promise.all(promises);
  }

  /**
   * Send RPC request over WebSocket
   */
  private send(method: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = ++this.requestId;
      this.pendingRequests.set(id, { resolve, reject });

      this.ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params
      }));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Subscription notification
      if (message.method === 'eth_subscription' && message.params) {
        const { subscription, result } = message.params;
        const callback = this.subscriptions.get(subscription);
        if (callback) {
          callback(result);
        }
        return;
      }

      // RPC response
      if (message.id !== undefined) {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          this.pendingRequests.delete(message.id);
          if (message.error) {
            pending.reject(new Error(`RPC Error: ${message.error.message}`));
          } else {
            pending.resolve(message.result);
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle disconnection and attempt reconnect
   */
  private async handleDisconnect(): Promise<void> {
    if (!this.autoReconnect) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(async () => {
        try {
          await this.connect();
          // Resubscribe to all subscriptions
          // Note: Subscription IDs will change, callbacks will be re-mapped
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }, delay);
    }
  }
}
