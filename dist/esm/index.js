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
import * as utils from './utils';
import { NETWORKS } from './types';
export class NanoPy {
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
    constructor(urlOrNetwork, options = {}) {
        if (typeof urlOrNetwork === 'string') {
            this.network = {
                name: 'Custom',
                chainId: options.chainId || 1337,
                rpcUrl: urlOrNetwork,
                wsUrl: urlOrNetwork.replace(/^http/, 'ws'),
                symbol: 'NPY'
            };
        }
        else {
            this.network = urlOrNetwork;
        }
        this.rpc = new RPCClient(this.network.rpcUrl, options.timeout);
        this.ws = new WSClient(this.network.wsUrl || this.network.rpcUrl);
        this.chainId = this.network.chainId;
        this.gasPrice = options.gasPrice ? utils.numberToHex(BigInt(options.gasPrice)) : null;
    }
    // ============ Static Factory Methods ============
    /**
     * Connect to mainnet
     */
    static mainnet(options) {
        return new NanoPy(NETWORKS.mainnet, options);
    }
    /**
     * Connect to testnet
     */
    static testnet(options) {
        return new NanoPy(NETWORKS.testnet, options);
    }
    /**
     * Connect to local development node
     */
    static local(options) {
        return new NanoPy(NETWORKS.local, options);
    }
    // ============ Wallet Methods ============
    /**
     * Create new wallet
     */
    createWallet() {
        return new Wallet();
    }
    /**
     * Load wallet from private key
     */
    loadWallet(privateKey) {
        return new Wallet(privateKey);
    }
    // ============ Balance Methods ============
    /**
     * Get balance of address
     */
    async getBalance(address) {
        const hex = await this.rpc.getBalance(address);
        return BigInt(hex);
    }
    /**
     * Get formatted balance
     */
    async getBalanceFormatted(address) {
        const wei = await this.getBalance(address);
        return utils.fromWei(wei) + ' ' + this.network.symbol;
    }
    /**
     * Format balance for display
     */
    formatBalance(wei) {
        return utils.formatBalance(wei, this.network.symbol);
    }
    // ============ Transaction Methods ============
    /**
     * Send native currency
     *
     * @example
     * ```typescript
     * const tx = await client.send(wallet, '0x...recipient', '1.5');
     * console.log('Sent 1.5 NPY, TX:', tx.transactionHash);
     * ```
     */
    async send(wallet, to, amount, options = {}) {
        const value = utils.toWei(amount);
        const tx = {
            to,
            value: utils.numberToHex(value),
            data: options.data || '0x',
            gasLimit: options.gasLimit || '0x5208', // 21000
            gasPrice: options.gasPrice || await this._getGasPrice()
        };
        return this.sendTransaction(wallet, tx);
    }
    /**
     * Send raw transaction
     */
    async sendTransaction(wallet, tx) {
        const nonceHex = await this.rpc.getTransactionCount(wallet.address);
        tx.nonce = utils.hexToNumber(nonceHex);
        tx.chainId = this.chainId;
        if (!tx.gasPrice) {
            tx.gasPrice = await this._getGasPrice();
        }
        const signedTx = wallet.signTransaction(tx);
        const txHash = await this.rpc.sendRawTransaction(signedTx);
        return this.rpc.waitForTransaction(txHash);
    }
    /**
     * Estimate gas for transaction
     */
    async estimateGas(tx) {
        const gasHex = await this.rpc.estimateGas(tx);
        return utils.hexToNumber(gasHex);
    }
    async _getGasPrice() {
        if (this.gasPrice)
            return this.gasPrice;
        try {
            return await this.rpc.getGasPrice();
        }
        catch {
            return '0x3B9ACA00'; // 1 Gwei
        }
    }
    // ============ Contract Methods ============
    /**
     * Create contract instance
     */
    contract(address, abi) {
        return new Contract(address, abi, this);
    }
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
    async deployContract(wallet, bytecode, abi = [], constructorArgs = [], options = {}) {
        let data = bytecode;
        if (constructorArgs.length > 0 && abi.length > 0) {
            const constructor = abi.find(item => item.type === 'constructor');
            if (constructor && constructor.inputs) {
                const encodedArgs = Contract.encodeArguments(constructor.inputs, constructorArgs);
                data = bytecode + encodedArgs;
            }
        }
        const tx = {
            to: null,
            data,
            value: options.value || '0x0',
            gasLimit: options.gasLimit || '0x4C4B40', // 5M
            gasPrice: options.gasPrice || await this._getGasPrice()
        };
        const receipt = await this.sendTransaction(wallet, tx);
        return {
            address: receipt.contractAddress,
            transactionHash: receipt.transactionHash,
            receipt,
            contract: abi.length > 0 ? this.contract(receipt.contractAddress, abi) : null
        };
    }
    // ============ Token Helpers ============
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
    erc20(address) {
        return new ERC20(address, this);
    }
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
    erc721(address) {
        return new ERC721(address, this);
    }
    // ============ Gaming Helpers ============
    /**
     * Create game items (ERC1155) instance
     */
    gameItems(address) {
        return new GameItems(address, this);
    }
    /**
     * Create leaderboard instance
     */
    leaderboard(address) {
        return new Leaderboard(address, this);
    }
    /**
     * Create achievements instance
     */
    achievements(address) {
        return new Achievements(address, this);
    }
    /**
     * Create rewards instance
     */
    rewards(address) {
        return new Rewards(address, this);
    }
    /**
     * Create game session for signed actions
     */
    createGameSession(wallet, gameContract) {
        return new GameSession(wallet, gameContract);
    }
    // ============ Block Methods ============
    /**
     * Get current block number
     */
    async getBlockNumber() {
        const hex = await this.rpc.getBlockNumber();
        return utils.hexToNumber(hex);
    }
    /**
     * Get block by number
     */
    async getBlock(number, fullTx = false) {
        return this.rpc.getBlockByNumber(number, fullTx);
    }
    /**
     * Get block by hash
     */
    async getBlockByHash(hash, fullTx = false) {
        return this.rpc.getBlockByHash(hash, fullTx);
    }
    // ============ Network Methods ============
    /**
     * Get network information
     */
    async getNetworkInfo() {
        const [chainId, blockNumber, peerCount, syncing] = await Promise.all([
            this.rpc.getChainId(),
            this.rpc.getBlockNumber(),
            this.rpc.getPeerCount().catch(() => '0x0'),
            this.rpc.isSyncing().catch(() => false)
        ]);
        return {
            chainId: utils.hexToNumber(chainId),
            blockNumber: utils.hexToNumber(blockNumber),
            peerCount: utils.hexToNumber(peerCount),
            syncing: syncing
        };
    }
    /**
     * Check connection
     */
    async isConnected() {
        try {
            await this.rpc.getBlockNumber();
            return true;
        }
        catch {
            return false;
        }
    }
    // ============ WebSocket Subscriptions ============
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
    async subscribeBlocks(callback) {
        return this.ws.subscribeNewHeads(callback);
    }
    /**
     * Subscribe to pending transactions
     */
    async subscribePendingTx(callback) {
        return this.ws.subscribePendingTransactions(callback);
    }
    /**
     * Subscribe to contract logs
     */
    async subscribeLogs(options, callback) {
        return this.ws.subscribeLogs(options, callback);
    }
}
// ============ Exports ============
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
// Default export
export default NanoPy;
//# sourceMappingURL=index.js.map