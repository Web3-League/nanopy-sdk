/**
 * NanoPy SDK - TypeScript SDK for NanoPy Blockchain
 *
 * Gaming-focused L1 blockchain with EVM compatibility
 *
 * @example
 * ```typescript
 * import { NanoPy, NETWORKS } from 'nanopy-sdk';
 *
 * // Connect to testnet
 * const client = new NanoPy(NETWORKS.testnet);
 *
 * // Or connect to mainnet
 * const mainnet = new NanoPy(NETWORKS.mainnet);
 *
 * // Create wallet
 * const wallet = client.createWallet();
 * console.log('Address:', wallet.address);
 *
 * // Check balance
 * const balance = await client.getBalance(wallet.address);
 * console.log('Balance:', client.formatBalance(balance));
 *
 * // Send NPY
 * const tx = await client.send(wallet, '0x...', '1.5');
 * console.log('TX Hash:', tx.transactionHash);
 *
 * // ERC20 Token
 * const token = client.erc20('0x...');
 * const tokenBalance = await token.getBalance(wallet.address);
 *
 * // NFT Collection
 * const nft = client.erc721('0x...');
 * const owned = await nft.getOwnedTokens(wallet.address);
 * ```
 */
import { RPCClient } from './rpc';
import { WSClient } from './ws';
import { Wallet } from './wallet';
import { Contract } from './contract';
import { ERC20 } from './erc20';
import { ERC721 } from './erc721';
import { GameItems, Leaderboard, Achievements, Rewards, GameSession } from './gaming';
import { NetworkConfig, NanoPyOptions, TransactionRequest, TransactionReceipt, Block, NetworkInfo, ABI } from './types';
export declare class NanoPy {
    readonly rpc: RPCClient;
    readonly ws: WSClient;
    readonly chainId: number;
    readonly network: NetworkConfig;
    private gasPrice;
    /**
     * Create NanoPy client
     *
     * @example
     * ```typescript
     * // Using network preset
     * const client = new NanoPy(NETWORKS.testnet);
     *
     * // Using custom URL
     * const custom = new NanoPy('http://localhost:8545');
     *
     * // With options
     * const withOpts = new NanoPy('http://node.example.com:8545', {
     *   chainId: 1337,
     *   timeout: 30000
     * });
     * ```
     */
    constructor(urlOrNetwork: string | NetworkConfig, options?: NanoPyOptions);
    /**
     * Connect to mainnet
     */
    static mainnet(options?: NanoPyOptions): NanoPy;
    /**
     * Connect to testnet
     */
    static testnet(options?: NanoPyOptions): NanoPy;
    /**
     * Connect to local development node
     */
    static local(options?: NanoPyOptions): NanoPy;
    /**
     * Create new wallet
     */
    createWallet(): Wallet;
    /**
     * Load wallet from private key
     */
    loadWallet(privateKey: string): Wallet;
    /**
     * Get balance of address
     */
    getBalance(address: string): Promise<bigint>;
    /**
     * Get formatted balance
     */
    getBalanceFormatted(address: string): Promise<string>;
    /**
     * Format balance for display
     */
    formatBalance(wei: bigint | string): string;
    /**
     * Send native currency
     *
     * @example
     * ```typescript
     * const tx = await client.send(wallet, '0x...recipient', '1.5');
     * console.log('Sent 1.5 NPY, TX:', tx.transactionHash);
     * ```
     */
    send(wallet: Wallet, to: string, amount: string | number, options?: {
        gasLimit?: string;
        gasPrice?: string;
        data?: string;
    }): Promise<TransactionReceipt>;
    /**
     * Send raw transaction
     */
    sendTransaction(wallet: Wallet, tx: TransactionRequest): Promise<TransactionReceipt>;
    /**
     * Estimate gas for transaction
     */
    estimateGas(tx: TransactionRequest): Promise<number>;
    private _getGasPrice;
    /**
     * Create contract instance
     */
    contract(address: string, abi: ABI): Contract;
    /**
     * Deploy contract
     *
     * @example
     * ```typescript
     * const result = await client.deployContract(
     *   wallet,
     *   bytecode,
     *   abi,
     *   ['Constructor Arg 1', 100]
     * );
     * console.log('Contract deployed at:', result.address);
     * ```
     */
    deployContract(wallet: Wallet, bytecode: string, abi?: ABI, constructorArgs?: any[], options?: {
        value?: string;
        gasLimit?: string;
        gasPrice?: string;
    }): Promise<{
        address: string;
        transactionHash: string;
        receipt: TransactionReceipt;
        contract: Contract | null;
    }>;
    /**
     * Create ERC20 token instance
     *
     * @example
     * ```typescript
     * const token = client.erc20('0x...');
     * const balance = await token.getBalance(address);
     * await token.transfer(wallet, recipient, '100');
     * ```
     */
    erc20(address: string): ERC20;
    /**
     * Create ERC721 NFT instance
     *
     * @example
     * ```typescript
     * const nft = client.erc721('0x...');
     * const owned = await nft.getOwnedTokens(address);
     * await nft.transfer(wallet, recipient, tokenId);
     * ```
     */
    erc721(address: string): ERC721;
    /**
     * Create game items (ERC1155) instance
     */
    gameItems(address: string): GameItems;
    /**
     * Create leaderboard instance
     */
    leaderboard(address: string): Leaderboard;
    /**
     * Create achievements instance
     */
    achievements(address: string): Achievements;
    /**
     * Create rewards instance
     */
    rewards(address: string): Rewards;
    /**
     * Create game session for signed actions
     */
    createGameSession(wallet: Wallet, gameContract: string): GameSession;
    /**
     * Get current block number
     */
    getBlockNumber(): Promise<number>;
    /**
     * Get block by number
     */
    getBlock(number: number | string, fullTx?: boolean): Promise<Block | null>;
    /**
     * Get block by hash
     */
    getBlockByHash(hash: string, fullTx?: boolean): Promise<Block | null>;
    /**
     * Get network information
     */
    getNetworkInfo(): Promise<NetworkInfo>;
    /**
     * Check connection
     */
    isConnected(): Promise<boolean>;
    /**
     * Subscribe to new blocks
     *
     * @example
     * ```typescript
     * await client.ws.connect();
     * await client.subscribeBlocks((block) => {
     *   console.log('New block:', block.number);
     * });
     * ```
     */
    subscribeBlocks(callback: (block: any) => void): Promise<string>;
    /**
     * Subscribe to pending transactions
     */
    subscribePendingTx(callback: (txHash: string) => void): Promise<string>;
    /**
     * Subscribe to contract logs
     */
    subscribeLogs(options: {
        address?: string;
        topics?: string[];
    }, callback: (log: any) => void): Promise<string>;
}
export { Wallet } from './wallet';
export { RPCClient } from './rpc';
export { WSClient } from './ws';
export { Contract, ContractMethod, EventDecoder } from './contract';
export { ERC20 } from './erc20';
export { ERC721 } from './erc721';
export { GameItems, Leaderboard, Achievements, Rewards, GameRandom, GameSession } from './gaming';
export { BrowserProvider } from './browser';
export * as utils from './utils';
export * from './types';
export default NanoPy;
//# sourceMappingURL=index.d.ts.map