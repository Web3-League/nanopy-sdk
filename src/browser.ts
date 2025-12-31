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

import { NETWORKS, NetworkConfig, TransactionRequest } from './types';
import * as utils from './utils';

// Ethereum provider interface (MetaMask)
interface EthereumProvider {
  request(args: { method: string; params?: any[] }): Promise<any>;
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

export class BrowserProvider {
  private _account: string | null = null;
  private _chainId: number | null = null;
  private _network: NetworkType = 'mainnet';
  private _options: BrowserProviderOptions;

  constructor(options: BrowserProviderOptions = {}) {
    this._options = {
      autoConnect: false,
      defaultNetwork: 'mainnet',
      ...options
    };
    this._network = this._options.defaultNetwork || 'mainnet';

    if (this.isAvailable) {
      this._setupListeners();
      if (this._options.autoConnect) {
        this.connect().catch(console.error);
      }
    }
  }

  // ============ Static Helpers ============

  /**
   * Check if MetaMask is available
   */
  static get isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum;
  }

  /**
   * Check if MetaMask is available (instance method)
   */
  get isAvailable(): boolean {
    return BrowserProvider.isAvailable;
  }

  /**
   * Get Ethereum provider
   */
  get ethereum(): EthereumProvider {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed. Please install MetaMask extension.');
    }
    return window.ethereum;
  }

  // ============ Account Methods ============

  /**
   * Get connected account
   */
  get account(): string | null {
    return this._account;
  }

  /**
   * Get current chain ID
   */
  get chainId(): number | null {
    return this._chainId;
  }

  /**
   * Get current network
   */
  get network(): NetworkType {
    return this._network;
  }

  /**
   * Get network config
   */
  get networkConfig(): NetworkConfig {
    return NETWORKS[this._network];
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this._account !== null;
  }

  /**
   * Check if on correct network
   */
  get isOnCorrectNetwork(): boolean {
    return this._chainId === this.networkConfig.chainId;
  }

  // ============ Connection Methods ============

  /**
   * Connect to MetaMask
   */
  async connect(): Promise<string> {
    const accounts = await this.ethereum.request({
      method: 'eth_requestAccounts'
    }) as string[];

    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    this._account = accounts[0];

    // Get chain ID
    const chainIdHex = await this.ethereum.request({
      method: 'eth_chainId'
    }) as string;
    this._chainId = parseInt(chainIdHex, 16);

    // Detect network from chain ID
    this._detectNetwork();

    return this._account;
  }

  /**
   * Disconnect (clear local state)
   */
  disconnect(): void {
    this._account = null;
    this._chainId = null;
    this._options.onDisconnect?.();
  }

  /**
   * Get connected accounts (without prompting)
   */
  async getAccounts(): Promise<string[]> {
    return this.ethereum.request({
      method: 'eth_accounts'
    }) as Promise<string[]>;
  }

  // ============ Network Methods ============

  /**
   * Switch to NanoPy mainnet
   */
  async switchToNanoPy(): Promise<void> {
    return this.switchToNetwork('mainnet');
  }

  /**
   * Switch to NanoPy testnet
   */
  async switchToTestnet(): Promise<void> {
    return this.switchToNetwork('testnet');
  }

  /**
   * Switch to specific network
   */
  async switchToNetwork(network: NetworkType): Promise<void> {
    const config = NETWORKS[network];
    const chainIdHex = '0x' + config.chainId.toString(16);

    try {
      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });
      this._network = network;
      this._chainId = config.chainId;
    } catch (error: any) {
      // Chain not added, add it
      if (error.code === 4902) {
        await this.addNetwork(network);
        this._network = network;
        this._chainId = config.chainId;
      } else {
        throw error;
      }
    }
  }

  /**
   * Add NanoPy network to MetaMask
   */
  async addNetwork(network: NetworkType = 'mainnet'): Promise<void> {
    const config = NETWORKS[network];
    const chainIdHex = '0x' + config.chainId.toString(16);

    await this.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: chainIdHex,
        chainName: config.name,
        nativeCurrency: {
          name: 'NanoPy',
          symbol: config.symbol,
          decimals: 18
        },
        rpcUrls: [config.rpcUrl],
        blockExplorerUrls: config.explorerUrl ? [config.explorerUrl] : undefined
      }]
    });
  }

  // ============ Balance Methods ============

  /**
   * Get balance of connected account
   */
  async getBalance(address?: string): Promise<bigint> {
    const addr = address || this._account;
    if (!addr) throw new Error('No account connected');

    const balanceHex = await this.ethereum.request({
      method: 'eth_getBalance',
      params: [addr, 'latest']
    }) as string;

    return BigInt(balanceHex);
  }

  /**
   * Get formatted balance
   */
  async getBalanceFormatted(address?: string): Promise<string> {
    const wei = await this.getBalance(address);
    return utils.formatBalance(wei, this.networkConfig.symbol);
  }

  // ============ Transaction Methods ============

  /**
   * Send native currency via MetaMask
   */
  async send(to: string, amount: string | number): Promise<string> {
    if (!this._account) throw new Error('Not connected');

    const value = utils.toWei(amount);
    const valueHex = '0x' + value.toString(16);

    const txHash = await this.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: this._account,
        to,
        value: valueHex
      }]
    }) as string;

    return txHash;
  }

  /**
   * Send transaction via MetaMask
   */
  async sendTransaction(tx: Partial<TransactionRequest>): Promise<string> {
    if (!this._account) throw new Error('Not connected');

    const txParams: any = {
      from: this._account,
      ...tx
    };

    // Convert bigint values to hex
    if (typeof txParams.value === 'bigint') {
      txParams.value = '0x' + txParams.value.toString(16);
    }
    if (typeof txParams.gasLimit === 'bigint') {
      txParams.gas = '0x' + txParams.gasLimit.toString(16);
      delete txParams.gasLimit;
    }

    const txHash = await this.ethereum.request({
      method: 'eth_sendTransaction',
      params: [txParams]
    }) as string;

    return txHash;
  }

  /**
   * Sign message via MetaMask
   */
  async signMessage(message: string): Promise<string> {
    if (!this._account) throw new Error('Not connected');

    const signature = await this.ethereum.request({
      method: 'personal_sign',
      params: [message, this._account]
    }) as string;

    return signature;
  }

  /**
   * Sign typed data (EIP-712) via MetaMask
   */
  async signTypedData(typedData: any): Promise<string> {
    if (!this._account) throw new Error('Not connected');

    const signature = await this.ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [this._account, JSON.stringify(typedData)]
    }) as string;

    return signature;
  }

  // ============ Contract Methods ============

  /**
   * Call contract method (read-only)
   */
  async call(to: string, data: string): Promise<string> {
    return this.ethereum.request({
      method: 'eth_call',
      params: [{ to, data }, 'latest']
    }) as Promise<string>;
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(tx: Partial<TransactionRequest>): Promise<bigint> {
    const txParams: any = {
      from: this._account,
      ...tx
    };

    const gasHex = await this.ethereum.request({
      method: 'eth_estimateGas',
      params: [txParams]
    }) as string;

    return BigInt(gasHex);
  }

  // ============ Block Methods ============

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    const hex = await this.ethereum.request({
      method: 'eth_blockNumber'
    }) as string;
    return parseInt(hex, 16);
  }

  // ============ Event Listeners ============

  private _setupListeners(): void {
    if (!this.isAvailable) return;

    this.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this._account = null;
        this._options.onAccountChanged?.(null);
      } else {
        this._account = accounts[0];
        this._options.onAccountChanged?.(accounts[0]);
      }
    });

    this.ethereum.on('chainChanged', (chainIdHex: string) => {
      this._chainId = parseInt(chainIdHex, 16);
      this._detectNetwork();
      this._options.onChainChanged?.(this._chainId);
    });

    this.ethereum.on('disconnect', () => {
      this._account = null;
      this._chainId = null;
      this._options.onDisconnect?.();
    });
  }

  private _detectNetwork(): void {
    if (this._chainId === NETWORKS.mainnet.chainId) {
      this._network = 'mainnet';
    } else if (this._chainId === NETWORKS.testnet.chainId) {
      this._network = 'testnet';
    } else if (this._chainId === NETWORKS.local.chainId) {
      this._network = 'local';
    }
  }
}

export default BrowserProvider;
