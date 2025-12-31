/**
 * NanoPy SDK RPC Client
 * HTTP JSON-RPC client for blockchain interaction
 */

import { RPCRequest, RPCResponse, Block, Transaction, TransactionReceipt, Log } from './types';
import { sleep, hexToNumber } from './utils';

export class RPCClient {
  private url: string;
  private timeout: number;
  private requestId: number = 0;

  constructor(url: string, timeout: number = 30000) {
    this.url = url;
    this.timeout = timeout;
  }

  /**
   * Make RPC call
   */
  async call<T = any>(method: string, params: any[] = []): Promise<T> {
    const request: RPCRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      const data = await response.json() as RPCResponse<T>;

      if (data.error) {
        throw new Error(`RPC Error ${data.error.code}: ${data.error.message}`);
      }

      return data.result as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Batch RPC calls
   */
  async batch<T = any>(calls: Array<{ method: string; params?: any[] }>): Promise<T[]> {
    const requests: RPCRequest[] = calls.map((call, i) => ({
      jsonrpc: '2.0',
      id: i + 1,
      method: call.method,
      params: call.params || []
    }));

    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requests)
    });

    const results = await response.json() as RPCResponse<T>[];

    return results.sort((a, b) => a.id - b.id).map(r => {
      if (r.error) throw new Error(`RPC Error ${r.error.code}: ${r.error.message}`);
      return r.result as T;
    });
  }

  // ============ Chain Methods ============

  async getChainId(): Promise<string> {
    return this.call('eth_chainId');
  }

  async getBlockNumber(): Promise<string> {
    return this.call('eth_blockNumber');
  }

  async getGasPrice(): Promise<string> {
    return this.call('eth_gasPrice');
  }

  async isSyncing(): Promise<boolean | object> {
    return this.call('eth_syncing');
  }

  async getPeerCount(): Promise<string> {
    return this.call('net_peerCount');
  }

  async getNetworkId(): Promise<string> {
    return this.call('net_version');
  }

  // ============ Account Methods ============

  async getBalance(address: string, block: string = 'latest'): Promise<string> {
    return this.call('eth_getBalance', [address, block]);
  }

  async getTransactionCount(address: string, block: string = 'latest'): Promise<string> {
    return this.call('eth_getTransactionCount', [address, block]);
  }

  async getCode(address: string, block: string = 'latest'): Promise<string> {
    return this.call('eth_getCode', [address, block]);
  }

  async getStorageAt(address: string, slot: string, block: string = 'latest'): Promise<string> {
    return this.call('eth_getStorageAt', [address, slot, block]);
  }

  // ============ Block Methods ============

  async getBlockByNumber(number: number | string, fullTx: boolean = false): Promise<Block | null> {
    const blockNum = typeof number === 'number' ? '0x' + number.toString(16) : number;
    return this.call('eth_getBlockByNumber', [blockNum, fullTx]);
  }

  async getBlockByHash(hash: string, fullTx: boolean = false): Promise<Block | null> {
    return this.call('eth_getBlockByHash', [hash, fullTx]);
  }

  // ============ Transaction Methods ============

  async getTransactionByHash(hash: string): Promise<Transaction | null> {
    return this.call('eth_getTransactionByHash', [hash]);
  }

  async getTransactionReceipt(hash: string): Promise<TransactionReceipt | null> {
    return this.call('eth_getTransactionReceipt', [hash]);
  }

  async sendRawTransaction(signedTx: string): Promise<string> {
    return this.call('eth_sendRawTransaction', [signedTx]);
  }

  async estimateGas(tx: object): Promise<string> {
    return this.call('eth_estimateGas', [tx]);
  }

  async ethCall(tx: object, block: string = 'latest'): Promise<string> {
    return this.call('eth_call', [tx, block]);
  }

  // ============ Log Methods ============

  async getLogs(filter: {
    fromBlock?: string | number;
    toBlock?: string | number;
    address?: string | string[];
    topics?: (string | string[] | null)[];
  }): Promise<Log[]> {
    const params: any = {};
    if (filter.fromBlock !== undefined) {
      params.fromBlock = typeof filter.fromBlock === 'number'
        ? '0x' + filter.fromBlock.toString(16)
        : filter.fromBlock;
    }
    if (filter.toBlock !== undefined) {
      params.toBlock = typeof filter.toBlock === 'number'
        ? '0x' + filter.toBlock.toString(16)
        : filter.toBlock;
    }
    if (filter.address) params.address = filter.address;
    if (filter.topics) params.topics = filter.topics;

    return this.call('eth_getLogs', [params]);
  }

  // ============ Helper Methods ============

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations: number = 1, timeout: number = 60000): Promise<TransactionReceipt> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const receipt = await this.getTransactionReceipt(txHash);

      if (receipt && receipt.blockNumber) {
        if (confirmations <= 1) {
          return receipt;
        }

        const currentBlock = hexToNumber(await this.getBlockNumber());
        const txBlock = typeof receipt.blockNumber === 'string'
          ? hexToNumber(receipt.blockNumber)
          : receipt.blockNumber;

        if (currentBlock - txBlock + 1 >= confirmations) {
          return receipt;
        }
      }

      await sleep(1000);
    }

    throw new Error(`Transaction ${txHash} not confirmed within ${timeout}ms`);
  }

  /**
   * Get multiple balances in one call
   */
  async getBalances(addresses: string[]): Promise<Map<string, bigint>> {
    const results = await this.batch<string>(
      addresses.map(addr => ({ method: 'eth_getBalance', params: [addr, 'latest'] }))
    );

    const balances = new Map<string, bigint>();
    addresses.forEach((addr, i) => {
      balances.set(addr, BigInt(results[i]));
    });

    return balances;
  }
}
