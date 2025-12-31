/**
 * NanoPy SDK ERC721 NFT Helper
 * Easy interaction with NFT contracts
 */

import { Contract } from './contract';
import { Wallet } from './wallet';
import { TransactionReceipt } from './types';

// Standard ERC721 ABI
const ERC721_ABI = [
  // Metadata
  { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'tokenURI', inputs: [{ type: 'uint256', name: 'tokenId' }], outputs: [{ type: 'string', name: '' }], stateMutability: 'view' },
  // Ownership
  { type: 'function', name: 'balanceOf', inputs: [{ type: 'address', name: 'owner' }], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'ownerOf', inputs: [{ type: 'uint256', name: 'tokenId' }], outputs: [{ type: 'address', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' },
  // Approvals
  { type: 'function', name: 'getApproved', inputs: [{ type: 'uint256', name: 'tokenId' }], outputs: [{ type: 'address', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'isApprovedForAll', inputs: [{ type: 'address', name: 'owner' }, { type: 'address', name: 'operator' }], outputs: [{ type: 'bool', name: '' }], stateMutability: 'view' },
  // Transfers
  { type: 'function', name: 'approve', inputs: [{ type: 'address', name: 'to' }, { type: 'uint256', name: 'tokenId' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'setApprovalForAll', inputs: [{ type: 'address', name: 'operator' }, { type: 'bool', name: 'approved' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'transferFrom', inputs: [{ type: 'address', name: 'from' }, { type: 'address', name: 'to' }, { type: 'uint256', name: 'tokenId' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'safeTransferFrom', inputs: [{ type: 'address', name: 'from' }, { type: 'address', name: 'to' }, { type: 'uint256', name: 'tokenId' }], outputs: [], stateMutability: 'nonpayable' },
  // Enumerable (optional)
  { type: 'function', name: 'tokenOfOwnerByIndex', inputs: [{ type: 'address', name: 'owner' }, { type: 'uint256', name: 'index' }], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'tokenByIndex', inputs: [{ type: 'uint256', name: 'index' }], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' },
  // Events
  { type: 'event', name: 'Transfer', inputs: [{ type: 'address', name: 'from', indexed: true }, { type: 'address', name: 'to', indexed: true }, { type: 'uint256', name: 'tokenId', indexed: true }] },
  { type: 'event', name: 'Approval', inputs: [{ type: 'address', name: 'owner', indexed: true }, { type: 'address', name: 'approved', indexed: true }, { type: 'uint256', name: 'tokenId', indexed: true }] },
  { type: 'event', name: 'ApprovalForAll', inputs: [{ type: 'address', name: 'owner', indexed: true }, { type: 'address', name: 'operator', indexed: true }, { type: 'bool', name: 'approved', indexed: false }] }
];

export interface NFTInfo {
  address: string;
  name: string;
  symbol: string;
  totalSupply?: bigint;
}

export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  [key: string]: any;
}

export interface OwnedNFT {
  tokenId: bigint;
  tokenURI?: string;
  metadata?: NFTMetadata;
}

export class ERC721 {
  readonly address: string;
  private contract: Contract;
  private client: any;
  private _name?: string;
  private _symbol?: string;

  constructor(address: string, client: any) {
    this.address = address;
    this.client = client;
    this.contract = new Contract(address, ERC721_ABI as any, client);
  }

  // ============ Metadata ============

  /**
   * Get collection name
   */
  async name(): Promise<string> {
    if (!this._name) {
      this._name = await this.contract.call('name');
    }
    return this._name!;
  }

  /**
   * Get collection symbol
   */
  async symbol(): Promise<string> {
    if (!this._symbol) {
      this._symbol = await this.contract.call('symbol');
    }
    return this._symbol!;
  }

  /**
   * Get token URI
   */
  async tokenURI(tokenId: bigint | number): Promise<string> {
    return this.contract.call('tokenURI', [BigInt(tokenId)]);
  }

  /**
   * Get and parse token metadata from URI
   */
  async getMetadata(tokenId: bigint | number): Promise<NFTMetadata | null> {
    try {
      const uri = await this.tokenURI(tokenId);

      // Handle data URI
      if (uri.startsWith('data:application/json')) {
        const base64 = uri.split(',')[1];
        const json = Buffer.from(base64, 'base64').toString();
        return JSON.parse(json);
      }

      // Handle IPFS
      let fetchUri = uri;
      if (uri.startsWith('ipfs://')) {
        fetchUri = `https://ipfs.io/ipfs/${uri.slice(7)}`;
      }

      // Fetch metadata
      const response = await fetch(fetchUri);
      return await response.json() as NFTMetadata;
    } catch {
      return null;
    }
  }

  /**
   * Get collection info
   */
  async getInfo(): Promise<NFTInfo> {
    const [name, symbol] = await Promise.all([
      this.name(),
      this.symbol()
    ]);

    let totalSupply: bigint | undefined;
    try {
      totalSupply = await this.totalSupply();
    } catch {
      // totalSupply might not be available
    }

    return {
      address: this.address,
      name,
      symbol,
      totalSupply
    };
  }

  // ============ Ownership ============

  /**
   * Get balance (number of NFTs owned)
   */
  async balanceOf(address: string): Promise<bigint> {
    return this.contract.call('balanceOf', [address]);
  }

  /**
   * Get owner of token
   */
  async ownerOf(tokenId: bigint | number): Promise<string> {
    return this.contract.call('ownerOf', [BigInt(tokenId)]);
  }

  /**
   * Check if address owns token
   */
  async isOwner(address: string, tokenId: bigint | number): Promise<boolean> {
    try {
      const owner = await this.ownerOf(tokenId);
      return owner.toLowerCase() === address.toLowerCase();
    } catch {
      return false;
    }
  }

  /**
   * Get total supply (if enumerable)
   */
  async totalSupply(): Promise<bigint> {
    return this.contract.call('totalSupply');
  }

  /**
   * Get all tokens owned by address (if enumerable)
   */
  async getOwnedTokens(address: string, fetchMetadata: boolean = false): Promise<OwnedNFT[]> {
    const balance = await this.balanceOf(address);
    const tokens: OwnedNFT[] = [];

    for (let i = 0n; i < balance; i++) {
      try {
        const tokenId = await this.contract.call('tokenOfOwnerByIndex', [address, i]);
        const nft: OwnedNFT = { tokenId };

        if (fetchMetadata) {
          try {
            nft.tokenURI = await this.tokenURI(tokenId);
            nft.metadata = await this.getMetadata(tokenId) || undefined;
          } catch {
            // Metadata might not be available
          }
        }

        tokens.push(nft);
      } catch {
        // tokenOfOwnerByIndex might not be available
        break;
      }
    }

    return tokens;
  }

  // ============ Approvals ============

  /**
   * Get approved address for token
   */
  async getApproved(tokenId: bigint | number): Promise<string> {
    return this.contract.call('getApproved', [BigInt(tokenId)]);
  }

  /**
   * Check if operator is approved for all
   */
  async isApprovedForAll(owner: string, operator: string): Promise<boolean> {
    return this.contract.call('isApprovedForAll', [owner, operator]);
  }

  /**
   * Approve address for token
   */
  async approve(wallet: Wallet, to: string, tokenId: bigint | number): Promise<TransactionReceipt> {
    return this.contract.send(wallet, 'approve', [to, BigInt(tokenId)]);
  }

  /**
   * Set approval for all tokens
   */
  async setApprovalForAll(wallet: Wallet, operator: string, approved: boolean): Promise<TransactionReceipt> {
    return this.contract.send(wallet, 'setApprovalForAll', [operator, approved]);
  }

  // ============ Transfers ============

  /**
   * Transfer NFT
   */
  async transfer(wallet: Wallet, to: string, tokenId: bigint | number): Promise<TransactionReceipt> {
    return this.contract.send(wallet, 'transferFrom', [wallet.address, to, BigInt(tokenId)]);
  }

  /**
   * Safe transfer NFT
   */
  async safeTransfer(wallet: Wallet, to: string, tokenId: bigint | number): Promise<TransactionReceipt> {
    return this.contract.send(wallet, 'safeTransferFrom', [wallet.address, to, BigInt(tokenId)]);
  }

  /**
   * Transfer from (requires approval)
   */
  async transferFrom(wallet: Wallet, from: string, to: string, tokenId: bigint | number): Promise<TransactionReceipt> {
    return this.contract.send(wallet, 'transferFrom', [from, to, BigInt(tokenId)]);
  }

  // ============ Events ============

  /**
   * Get transfer history for token
   */
  async getTokenHistory(tokenId: bigint | number, fromBlock: number = 0): Promise<NFTTransferEvent[]> {
    const events = await this.contract.getPastEvents('Transfer', {
      filter: { tokenId: BigInt(tokenId) },
      fromBlock,
      toBlock: 'latest'
    });

    return events.map(e => ({
      from: e.args.from as string,
      to: e.args.to as string,
      tokenId: e.args.tokenId as bigint,
      blockNumber: e.log.blockNumber,
      transactionHash: e.log.transactionHash
    }));
  }

  /**
   * Get all transfers to/from address
   */
  async getAddressHistory(address: string, fromBlock: number = 0): Promise<NFTTransferEvent[]> {
    const [sentEvents, receivedEvents] = await Promise.all([
      this.contract.getPastEvents('Transfer', {
        filter: { from: address },
        fromBlock,
        toBlock: 'latest'
      }),
      this.contract.getPastEvents('Transfer', {
        filter: { to: address },
        fromBlock,
        toBlock: 'latest'
      })
    ]);

    const allEvents = [...sentEvents, ...receivedEvents];
    allEvents.sort((a, b) => a.log.blockNumber - b.log.blockNumber);

    return allEvents.map(e => ({
      from: e.args.from as string,
      to: e.args.to as string,
      tokenId: e.args.tokenId as bigint,
      blockNumber: e.log.blockNumber,
      transactionHash: e.log.transactionHash
    }));
  }

  /**
   * Get underlying contract
   */
  getContract(): Contract {
    return this.contract;
  }
}

export interface NFTTransferEvent {
  from: string;
  to: string;
  tokenId: bigint;
  blockNumber: number;
  transactionHash: string;
}
