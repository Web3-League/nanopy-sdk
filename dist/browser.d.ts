/**
 * Browser/MetaMask integration for NanoPy SDK
 *
 * @example
 * ```typescript
 * import { BrowserProvider, NETWORKS } from 'nanopy-sdk';
 *
 * // Connect to MetaMask
 * const provider = new BrowserProvider();
 * await provider.connect();
 *
 * // Get connected account
 * console.log('Account:', provider.account);
 * console.log('Balance:', await provider.getBalance());
 *
 * // Send transaction via MetaMask
 * const txHash = await provider.send('0x...recipient', '1.5');
 *
 * // Switch to NanoPy network
 * await provider.switchToNanoPy();
 *
 * // Or switch to testnet
 * await provider.switchToNetwork('testnet');
 * ```
 */
import { NetworkConfig, TransactionRequest } from './types';
interface EthereumProvider {
    request(args: {
        method: string;
        params?: any[];
    }): Promise<any>;
    on(event: string, handler: (...args: any[]) => void): void;
    removeListener(event: string, handler: (...args: any[]) => void): void;
    isMetaMask?: boolean;
}
declare global {
    interface Window {
        ethereum?: EthereumProvider;
    }
}
export type NetworkType = 'mainnet' | 'testnet' | 'local';
export interface BrowserProviderOptions {
    autoConnect?: boolean;
    defaultNetwork?: NetworkType;
    onAccountChanged?: (account: string | null) => void;
    onChainChanged?: (chainId: number) => void;
    onDisconnect?: () => void;
}
export declare class BrowserProvider {
    private _account;
    private _chainId;
    private _network;
    private _options;
    constructor(options?: BrowserProviderOptions);
    /**
     * Check if MetaMask is available
     */
    static get isAvailable(): boolean;
    /**
     * Check if MetaMask is available (instance method)
     */
    get isAvailable(): boolean;
    /**
     * Get Ethereum provider
     */
    get ethereum(): EthereumProvider;
    /**
     * Get connected account
     */
    get account(): string | null;
    /**
     * Get current chain ID
     */
    get chainId(): number | null;
    /**
     * Get current network
     */
    get network(): NetworkType;
    /**
     * Get network config
     */
    get networkConfig(): NetworkConfig;
    /**
     * Check if connected
     */
    get isConnected(): boolean;
    /**
     * Check if on correct network
     */
    get isOnCorrectNetwork(): boolean;
    /**
     * Connect to MetaMask
     */
    connect(): Promise<string>;
    /**
     * Disconnect (clear local state)
     */
    disconnect(): void;
    /**
     * Get connected accounts (without prompting)
     */
    getAccounts(): Promise<string[]>;
    /**
     * Switch to NanoPy mainnet
     */
    switchToNanoPy(): Promise<void>;
    /**
     * Switch to NanoPy testnet
     */
    switchToTestnet(): Promise<void>;
    /**
     * Switch to specific network
     */
    switchToNetwork(network: NetworkType): Promise<void>;
    /**
     * Add NanoPy network to MetaMask
     */
    addNetwork(network?: NetworkType): Promise<void>;
    /**
     * Get balance of connected account
     */
    getBalance(address?: string): Promise<bigint>;
    /**
     * Get formatted balance
     */
    getBalanceFormatted(address?: string): Promise<string>;
    /**
     * Send native currency via MetaMask
     */
    send(to: string, amount: string | number): Promise<string>;
    /**
     * Send transaction via MetaMask
     */
    sendTransaction(tx: Partial<TransactionRequest>): Promise<string>;
    /**
     * Sign message via MetaMask
     */
    signMessage(message: string): Promise<string>;
    /**
     * Sign typed data (EIP-712) via MetaMask
     */
    signTypedData(typedData: any): Promise<string>;
    /**
     * Call contract method (read-only)
     */
    call(to: string, data: string): Promise<string>;
    /**
     * Estimate gas for transaction
     */
    estimateGas(tx: Partial<TransactionRequest>): Promise<bigint>;
    /**
     * Get current block number
     */
    getBlockNumber(): Promise<number>;
    private _setupListeners;
    private _detectNetwork;
}
export default BrowserProvider;
//# sourceMappingURL=browser.d.ts.map