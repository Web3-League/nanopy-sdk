/**
 * NanoPy SDK Contract
 * Smart contract interaction with ABI encoding/decoding
 */
import { ABI, ABIFunction, ABIParameter, CallOptions, TransactionReceipt, Log } from './types';
import { Wallet } from './wallet';
export declare class Contract {
    readonly address: string;
    readonly abi: ABI;
    private client;
    readonly methods: Record<string, ContractMethod>;
    readonly events: Record<string, EventDecoder>;
    constructor(address: string, abi: ABI, client: any);
    /**
     * Call view/pure function
     */
    call(method: string, args?: any[], options?: CallOptions): Promise<any>;
    /**
     * Send transaction to contract
     */
    send(wallet: Wallet, method: string, args?: any[], options?: CallOptions): Promise<TransactionReceipt>;
    /**
     * Estimate gas for method call
     */
    estimateGas(method: string, args?: any[], options?: CallOptions): Promise<number>;
    /**
     * Get past events
     */
    getPastEvents(eventName: string, options?: {
        fromBlock?: number | string;
        toBlock?: number | string;
        filter?: Record<string, any>;
    }): Promise<DecodedLog[]>;
    /**
     * Encode function call data
     */
    encodeCall(abiItem: ABIFunction, args: any[]): string;
    /**
     * Get function selector (4 bytes)
     */
    functionSelector(abiItem: ABIFunction): string;
    /**
     * Decode function result
     */
    decodeResult(abiItem: ABIFunction, data: string): any;
    /**
     * Static method to encode constructor/function arguments
     */
    static encodeArguments(inputs: ABIParameter[], args: any[]): string;
    /**
     * Static method to decode arguments from data
     */
    static decodeArguments(outputs: ABIParameter[], data: string): any[];
    /**
     * Encode single parameter
     */
    private encodeParameter;
    static encodeParameter(type: string, value: any): string;
    /**
     * Decode single parameter
     */
    static decodeParameter(type: string, data: string, offset?: number): [any, number];
}
/**
 * Contract method wrapper for fluent API
 */
export declare class ContractMethod {
    private contract;
    private abiItem;
    constructor(contract: Contract, abiItem: ABIFunction);
    /**
     * Encode function call
     */
    encodeABI(...args: any[]): string;
    /**
     * Call view/pure function
     */
    call(...args: any[]): Promise<any>;
    /**
     * Send transaction
     */
    send(wallet: Wallet, options?: CallOptions, ...args: any[]): Promise<TransactionReceipt>;
    /**
     * Estimate gas
     */
    estimateGas(...args: any[]): Promise<number>;
}
/**
 * Event decoder
 */
export declare class EventDecoder {
    readonly name: string;
    readonly topic: string;
    private inputs;
    constructor(abiItem: ABIFunction);
    /**
     * Decode log to event object
     */
    decode(log: Log): DecodedLog;
}
export interface DecodedLog {
    event: string;
    args: Record<string, any>;
    log: Log;
}
//# sourceMappingURL=contract.d.ts.map