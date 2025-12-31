/**
 * NanoPy SDK WebSocket Client
 * Real-time subscriptions for blockchain events
 */
import { SubscriptionType, SubscriptionOptions, NewHeadEvent, LogEvent } from './types';
type EventCallback = (data: any) => void;
export declare class WSClient {
    private url;
    private ws;
    private subscriptions;
    private requestId;
    private pendingRequests;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private autoReconnect;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
    constructor(url: string);
    /**
     * Connect to WebSocket server
     */
    connect(): Promise<void>;
    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Subscribe to new block headers
     */
    subscribeNewHeads(callback: (block: NewHeadEvent) => void): Promise<string>;
    /**
     * Subscribe to pending transactions
     */
    subscribePendingTransactions(callback: (txHash: string) => void): Promise<string>;
    /**
     * Subscribe to contract logs/events
     */
    subscribeLogs(options: SubscriptionOptions, callback: (log: LogEvent) => void): Promise<string>;
    /**
     * Subscribe to Transfer events for a token
     */
    subscribeTransfers(tokenAddress: string, callback: (from: string, to: string, value: bigint, log: LogEvent) => void): Promise<string>;
    /**
     * Generic subscribe method
     */
    subscribe(type: SubscriptionType, options: SubscriptionOptions, callback: EventCallback): Promise<string>;
    /**
     * Unsubscribe from a subscription
     */
    unsubscribe(subscriptionId: string): Promise<boolean>;
    /**
     * Unsubscribe from all subscriptions
     */
    unsubscribeAll(): Promise<void>;
    /**
     * Send RPC request over WebSocket
     */
    private send;
    /**
     * Handle incoming WebSocket message
     */
    private handleMessage;
    /**
     * Handle disconnection and attempt reconnect
     */
    private handleDisconnect;
}
export {};
//# sourceMappingURL=ws.d.ts.map