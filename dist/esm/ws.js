/**
 * NanoPy SDK WebSocket Client
 * Real-time subscriptions for blockchain events
 */
export class WSClient {
    constructor(url) {
        this.ws = null;
        this.subscriptions = new Map();
        this.requestId = 0;
        this.pendingRequests = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.autoReconnect = true;
        // Convert http to ws
        this.url = url.replace(/^http/, 'ws');
    }
    /**
     * Connect to WebSocket server
     */
    async connect() {
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
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
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
    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    /**
     * Subscribe to new block headers
     */
    async subscribeNewHeads(callback) {
        return this.subscribe('newHeads', {}, callback);
    }
    /**
     * Subscribe to pending transactions
     */
    async subscribePendingTransactions(callback) {
        return this.subscribe('newPendingTransactions', {}, (data) => {
            callback(data);
        });
    }
    /**
     * Subscribe to contract logs/events
     */
    async subscribeLogs(options, callback) {
        return this.subscribe('logs', options, callback);
    }
    /**
     * Subscribe to Transfer events for a token
     */
    async subscribeTransfers(tokenAddress, callback) {
        // Transfer(address,address,uint256) topic
        const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        return this.subscribeLogs({ address: tokenAddress, topics: [transferTopic] }, (log) => {
            const from = '0x' + log.topics[1].slice(26);
            const to = '0x' + log.topics[2].slice(26);
            const value = BigInt(log.data);
            callback(from, to, value, log);
        });
    }
    /**
     * Generic subscribe method
     */
    async subscribe(type, options, callback) {
        if (!this.isConnected()) {
            await this.connect();
        }
        const params = [type];
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
    async unsubscribe(subscriptionId) {
        const result = await this.send('eth_unsubscribe', [subscriptionId]);
        this.subscriptions.delete(subscriptionId);
        return result;
    }
    /**
     * Unsubscribe from all subscriptions
     */
    async unsubscribeAll() {
        const promises = Array.from(this.subscriptions.keys()).map(id => this.unsubscribe(id).catch(() => { }));
        await Promise.all(promises);
    }
    /**
     * Send RPC request over WebSocket
     */
    send(method, params = []) {
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
    handleMessage(data) {
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
                    }
                    else {
                        pending.resolve(message.result);
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }
    /**
     * Handle disconnection and attempt reconnect
     */
    async handleDisconnect() {
        if (!this.autoReconnect)
            return;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(async () => {
                try {
                    await this.connect();
                    // Resubscribe to all subscriptions
                    // Note: Subscription IDs will change, callbacks will be re-mapped
                }
                catch (error) {
                    console.error('Reconnection failed:', error);
                }
            }, delay);
        }
    }
}
//# sourceMappingURL=ws.js.map