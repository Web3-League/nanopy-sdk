/**
 * NanoPy SDK Types
 * Complete TypeScript definitions for the NanoPy blockchain SDK
 */

// ============ Network Configuration ============

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  wsUrl?: string;
  explorerUrl?: string;
  symbol: string;
}

export const NETWORKS: Record<'mainnet' | 'testnet' | 'local', NetworkConfig> = {
  mainnet: {
    name: 'NanoPy',
    chainId: 7770,
    rpcUrl: 'http://51.68.125.99:8545',
    wsUrl: 'ws://51.68.125.99:8546',
    explorerUrl: 'https://scan.nanopy.dev',
    symbol: 'NPY'
  },
  testnet: {
    name: 'Pyralis Testnet',
    chainId: 77777,
    rpcUrl: 'http://51.68.125.99:8546',
    wsUrl: 'ws://51.68.125.99:8546',
    explorerUrl: 'https://testnet.scan.nanopy.dev',
    symbol: 'NPY'
  },
  local: {
    name: 'Local Development',
    chainId: 1337,
    rpcUrl: 'http://localhost:8545',
    wsUrl: 'ws://localhost:8545',
    symbol: 'NPY'
  }
};

// ============ Transaction Types ============

export interface TransactionRequest {
  to?: string | null;
  from?: string;
  nonce?: number;
  value?: string | bigint;
  data?: string;
  gasLimit?: string | number;
  gasPrice?: string | bigint;
  chainId?: number;
}

export interface SignedTransaction {
  raw: string;
  hash: string;
}

export interface TransactionReceipt {
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  from: string;
  to: string | null;
  contractAddress: string | null;
  cumulativeGasUsed: number;
  gasUsed: number;
  logs: Log[];
  status: number;
}

export interface Log {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  logIndex: number;
  removed: boolean;
}

// ============ Block Types ============

export interface Block {
  number: number;
  hash: string;
  parentHash: string;
  nonce: string;
  sha3Uncles: string;
  logsBloom: string;
  transactionsRoot: string;
  stateRoot: string;
  receiptsRoot: string;
  miner: string;
  difficulty: string;
  totalDifficulty: string;
  extraData: string;
  size: number;
  gasLimit: number;
  gasUsed: number;
  timestamp: number;
  transactions: string[] | Transaction[];
  uncles: string[];
}

export interface Transaction {
  hash: string;
  nonce: number;
  blockHash: string;
  blockNumber: number;
  transactionIndex: number;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  gas: number;
  input: string;
  v: string;
  r: string;
  s: string;
}

// ============ Contract Types ============

export interface ABIParameter {
  name: string;
  type: string;
  indexed?: boolean;
  components?: ABIParameter[];
}

export interface ABIFunction {
  type: 'function' | 'constructor' | 'event' | 'fallback' | 'receive';
  name?: string;
  inputs?: ABIParameter[];
  outputs?: ABIParameter[];
  stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';
  anonymous?: boolean;
}

export type ABI = ABIFunction[];

export interface CallOptions {
  from?: string;
  value?: string | bigint;
  gasLimit?: string | number;
  gasPrice?: string | bigint;
}

export interface DeployResult {
  address: string;
  transactionHash: string;
  receipt: TransactionReceipt;
  contract: any; // Contract instance
}

// ============ Wallet Types ============

export interface WalletData {
  address: string;
  privateKey: string;
  publicKey: string;
}

// ============ Subscription Types ============

export type SubscriptionType = 'newHeads' | 'newPendingTransactions' | 'logs';

export interface SubscriptionOptions {
  address?: string | string[];
  topics?: (string | string[] | null)[];
}

export interface NewHeadEvent {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  miner: string;
  gasUsed: number;
  gasLimit: number;
}

export interface PendingTxEvent {
  hash: string;
}

export interface LogEvent extends Log {}

// ============ RPC Types ============

export interface RPCRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: any[];
}

export interface RPCResponse<T = any> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// ============ Network Info ============

export interface NetworkInfo {
  chainId: number;
  blockNumber: number;
  peerCount: number;
  syncing: boolean | SyncStatus;
}

export interface SyncStatus {
  startingBlock: number;
  currentBlock: number;
  highestBlock: number;
}

// ============ Client Options ============

export interface NanoPyOptions {
  chainId?: number;
  gasPrice?: string | bigint;
  timeout?: number;
  network?: 'mainnet' | 'testnet' | 'local';
}
