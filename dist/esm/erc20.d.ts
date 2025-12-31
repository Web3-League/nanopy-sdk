/**
 * NanoPy SDK ERC20 Token Helper
 * Easy interaction with ERC20 tokens
 */
import { Contract } from './contract';
import { Wallet } from './wallet';
import { TransactionReceipt } from './types';
export interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
}
export interface TokenBalance {
    address: string;
    symbol: string;
    balance: bigint;
    formatted: string;
}
export declare class ERC20 {
    readonly address: string;
    private contract;
    private client;
    private _decimals?;
    private _symbol?;
    private _name?;
    constructor(address: string, client: any);
    /**
     * Get token name
     */
    name(): Promise<string>;
    /**
     * Get token symbol
     */
    symbol(): Promise<string>;
    /**
     * Get token decimals
     */
    decimals(): Promise<number>;
    /**
     * Get total supply
     */
    totalSupply(): Promise<bigint>;
    /**
     * Get balance of address
     */
    balanceOf(address: string): Promise<bigint>;
    /**
     * Get formatted balance
     */
    getBalance(address: string): Promise<TokenBalance>;
    /**
     * Get allowance
     */
    allowance(owner: string, spender: string): Promise<bigint>;
    /**
     * Get full token info
     */
    getInfo(): Promise<TokenInfo>;
    /**
     * Transfer tokens
     * @param wallet - Sender wallet
     * @param to - Recipient address
     * @param amount - Amount (in token units, e.g., "100" for 100 tokens)
     */
    transfer(wallet: Wallet, to: string, amount: string | bigint): Promise<TransactionReceipt>;
    /**
     * Approve spender
     * @param wallet - Owner wallet
     * @param spender - Spender address
     * @param amount - Amount to approve (use "max" for unlimited)
     */
    approve(wallet: Wallet, spender: string, amount: string | bigint): Promise<TransactionReceipt>;
    /**
     * Transfer from (requires allowance)
     */
    transferFrom(wallet: Wallet, from: string, to: string, amount: string | bigint): Promise<TransactionReceipt>;
    /**
     * Get transfer history
     */
    getTransfers(options?: {
        from?: string;
        to?: string;
        fromBlock?: number;
        toBlock?: number;
    }): Promise<TransferEvent[]>;
    /**
     * Parse human amount to token units
     */
    parseAmount(amount: string | bigint, decimals?: number): bigint;
    /**
     * Format token units to human readable
     */
    formatAmount(amount: bigint, decimals?: number): string;
    /**
     * Get underlying contract
     */
    getContract(): Contract;
}
export interface TransferEvent {
    from: string;
    to: string;
    value: bigint;
    blockNumber: number;
    transactionHash: string;
}
//# sourceMappingURL=erc20.d.ts.map