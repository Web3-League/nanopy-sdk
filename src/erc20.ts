/**
 * NanoPy SDK ERC20 Token Helper
 * Easy interaction with ERC20 tokens
 */

import { Contract } from './contract';
import { Wallet } from './wallet';
import { TransactionReceipt, Log } from './types';
import { toWei, fromWei, formatBalance } from './utils';

// Standard ERC20 ABI
const ERC20_ABI = [
  // Read functions
  { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOf', inputs: [{ type: 'address', name: 'account' }], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'allowance', inputs: [{ type: 'address', name: 'owner' }, { type: 'address', name: 'spender' }], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' },
  // Write functions
  { type: 'function', name: 'transfer', inputs: [{ type: 'address', name: 'to' }, { type: 'uint256', name: 'amount' }], outputs: [{ type: 'bool', name: '' }], stateMutability: 'nonpayable' },
  { type: 'function', name: 'approve', inputs: [{ type: 'address', name: 'spender' }, { type: 'uint256', name: 'amount' }], outputs: [{ type: 'bool', name: '' }], stateMutability: 'nonpayable' },
  { type: 'function', name: 'transferFrom', inputs: [{ type: 'address', name: 'from' }, { type: 'address', name: 'to' }, { type: 'uint256', name: 'amount' }], outputs: [{ type: 'bool', name: '' }], stateMutability: 'nonpayable' },
  // Events
  { type: 'event', name: 'Transfer', inputs: [{ type: 'address', name: 'from', indexed: true }, { type: 'address', name: 'to', indexed: true }, { type: 'uint256', name: 'value', indexed: false }] },
  { type: 'event', name: 'Approval', inputs: [{ type: 'address', name: 'owner', indexed: true }, { type: 'address', name: 'spender', indexed: true }, { type: 'uint256', name: 'value', indexed: false }] }
];

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

export class ERC20 {
  readonly address: string;
  private contract: Contract;
  private client: any;
  private _decimals?: number;
  private _symbol?: string;
  private _name?: string;

  constructor(address: string, client: any) {
    this.address = address;
    this.client = client;
    this.contract = new Contract(address, ERC20_ABI as any, client);
  }

  // ============ Read Methods ============

  /**
   * Get token name
   */
  async name(): Promise<string> {
    if (!this._name) {
      this._name = await this.contract.call('name');
    }
    return this._name!;
  }

  /**
   * Get token symbol
   */
  async symbol(): Promise<string> {
    if (!this._symbol) {
      this._symbol = await this.contract.call('symbol');
    }
    return this._symbol!;
  }

  /**
   * Get token decimals
   */
  async decimals(): Promise<number> {
    if (!this._decimals) {
      const dec = await this.contract.call('decimals');
      this._decimals = Number(dec);
    }
    return this._decimals;
  }

  /**
   * Get total supply
   */
  async totalSupply(): Promise<bigint> {
    return this.contract.call('totalSupply');
  }

  /**
   * Get balance of address
   */
  async balanceOf(address: string): Promise<bigint> {
    return this.contract.call('balanceOf', [address]);
  }

  /**
   * Get formatted balance
   */
  async getBalance(address: string): Promise<TokenBalance> {
    const [balance, symbol, decimals] = await Promise.all([
      this.balanceOf(address),
      this.symbol(),
      this.decimals()
    ]);

    const formatted = this.formatAmount(balance, decimals);

    return {
      address,
      symbol,
      balance,
      formatted: `${formatted} ${symbol}`
    };
  }

  /**
   * Get allowance
   */
  async allowance(owner: string, spender: string): Promise<bigint> {
    return this.contract.call('allowance', [owner, spender]);
  }

  /**
   * Get full token info
   */
  async getInfo(): Promise<TokenInfo> {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      this.name(),
      this.symbol(),
      this.decimals(),
      this.totalSupply()
    ]);

    return {
      address: this.address,
      name,
      symbol,
      decimals,
      totalSupply
    };
  }

  // ============ Write Methods ============

  /**
   * Transfer tokens
   * @param wallet - Sender wallet
   * @param to - Recipient address
   * @param amount - Amount (in token units, e.g., "100" for 100 tokens)
   */
  async transfer(wallet: Wallet, to: string, amount: string | bigint): Promise<TransactionReceipt> {
    const decimals = await this.decimals();
    const amountWei = this.parseAmount(amount, decimals);
    return this.contract.send(wallet, 'transfer', [to, amountWei]);
  }

  /**
   * Approve spender
   * @param wallet - Owner wallet
   * @param spender - Spender address
   * @param amount - Amount to approve (use "max" for unlimited)
   */
  async approve(wallet: Wallet, spender: string, amount: string | bigint): Promise<TransactionReceipt> {
    const decimals = await this.decimals();
    const amountWei = amount === 'max'
      ? BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      : this.parseAmount(amount, decimals);
    return this.contract.send(wallet, 'approve', [spender, amountWei]);
  }

  /**
   * Transfer from (requires allowance)
   */
  async transferFrom(wallet: Wallet, from: string, to: string, amount: string | bigint): Promise<TransactionReceipt> {
    const decimals = await this.decimals();
    const amountWei = this.parseAmount(amount, decimals);
    return this.contract.send(wallet, 'transferFrom', [from, to, amountWei]);
  }

  // ============ Events ============

  /**
   * Get transfer history
   */
  async getTransfers(options: {
    from?: string;
    to?: string;
    fromBlock?: number;
    toBlock?: number;
  } = {}): Promise<TransferEvent[]> {
    const filter: Record<string, any> = {};
    if (options.from) filter.from = options.from;
    if (options.to) filter.to = options.to;

    const events = await this.contract.getPastEvents('Transfer', {
      filter,
      fromBlock: options.fromBlock || 0,
      toBlock: options.toBlock || 'latest'
    });

    return events.map(e => ({
      from: e.args.from as string,
      to: e.args.to as string,
      value: e.args.value as bigint,
      blockNumber: e.log.blockNumber,
      transactionHash: e.log.transactionHash
    }));
  }

  // ============ Utility Methods ============

  /**
   * Parse human amount to token units
   */
  parseAmount(amount: string | bigint, decimals?: number): bigint {
    if (typeof amount === 'bigint') return amount;

    const dec = decimals || this._decimals || 18;
    const [whole, fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(dec, '0').slice(0, dec);
    return BigInt(whole + paddedFraction);
  }

  /**
   * Format token units to human readable
   */
  formatAmount(amount: bigint, decimals?: number): string {
    const dec = decimals || this._decimals || 18;
    const divisor = BigInt(10 ** dec);
    const whole = amount / divisor;
    const fraction = amount % divisor;

    if (fraction === 0n) return whole.toString();

    const fractionStr = fraction.toString().padStart(dec, '0');
    const trimmed = fractionStr.replace(/0+$/, '');
    return `${whole}.${trimmed}`;
  }

  /**
   * Get underlying contract
   */
  getContract(): Contract {
    return this.contract;
  }
}

export interface TransferEvent {
  from: string;
  to: string;
  value: bigint;
  blockNumber: number;
  transactionHash: string;
}
