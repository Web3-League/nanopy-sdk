/**
 * NanoPy SDK RPC Client
 * HTTP JSON-RPC client for blockchain interaction
 */
import { Block, Transaction, TransactionReceipt, Log } from './types';
export declare class RPCClient {
    private url;
    private timeout;
    private requestId;
    constructor(url: string, timeout?: number);
    /**
     * Make RPC call
     */
    call<T = any>(method: string, params?: any[]): Promise<T>;
    /**
     * Batch RPC calls
     */
    batch<T = any>(calls: Array<{
        method: string;
        params?: any[];
    }>): Promise<T[]>;
    getChainId(): Promise<string>;
    getBlockNumber(): Promise<string>;
    getGasPrice(): Promise<string>;
    isSyncing(): Promise<boolean | object>;
    getPeerCount(): Promise<string>;
    getNetworkId(): Promise<string>;
    getBalance(address: string, block?: string): Promise<string>;
    getTransactionCount(address: string, block?: string): Promise<string>;
    getCode(address: string, block?: string): Promise<string>;
    getStorageAt(address: string, slot: string, block?: string): Promise<string>;
    getBlockByNumber(number: number | string, fullTx?: boolean): Promise<Block | null>;
    getBlockByHash(hash: string, fullTx?: boolean): Promise<Block | null>;
    getTransactionByHash(hash: string): Promise<Transaction | null>;
    getTransactionReceipt(hash: string): Promise<TransactionReceipt | null>;
    sendRawTransaction(signedTx: string): Promise<string>;
    estimateGas(tx: object): Promise<string>;
    ethCall(tx: object, block?: string): Promise<string>;
    getLogs(filter: {
        fromBlock?: string | number;
        toBlock?: string | number;
        address?: string | string[];
        topics?: (string | string[] | null)[];
    }): Promise<Log[]>;
    /**
     * Wait for transaction confirmation
     */
    waitForTransaction(txHash: string, confirmations?: number, timeout?: number): Promise<TransactionReceipt>;
    /**
     * Get multiple balances in one call
     */
    getBalances(addresses: string[]): Promise<Map<string, bigint>>;
}
//# sourceMappingURL=rpc.d.ts.map