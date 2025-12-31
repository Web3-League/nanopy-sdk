/**
 * NanoPy SDK ERC721 NFT Helper
 * Easy interaction with NFT contracts
 */
import { Contract } from './contract';
import { Wallet } from './wallet';
import { TransactionReceipt } from './types';
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
export declare class ERC721 {
    readonly address: string;
    private contract;
    private client;
    private _name?;
    private _symbol?;
    constructor(address: string, client: any);
    /**
     * Get collection name
     */
    name(): Promise<string>;
    /**
     * Get collection symbol
     */
    symbol(): Promise<string>;
    /**
     * Get token URI
     */
    tokenURI(tokenId: bigint | number): Promise<string>;
    /**
     * Get and parse token metadata from URI
     */
    getMetadata(tokenId: bigint | number): Promise<NFTMetadata | null>;
    /**
     * Get collection info
     */
    getInfo(): Promise<NFTInfo>;
    /**
     * Get balance (number of NFTs owned)
     */
    balanceOf(address: string): Promise<bigint>;
    /**
     * Get owner of token
     */
    ownerOf(tokenId: bigint | number): Promise<string>;
    /**
     * Check if address owns token
     */
    isOwner(address: string, tokenId: bigint | number): Promise<boolean>;
    /**
     * Get total supply (if enumerable)
     */
    totalSupply(): Promise<bigint>;
    /**
     * Get all tokens owned by address (if enumerable)
     */
    getOwnedTokens(address: string, fetchMetadata?: boolean): Promise<OwnedNFT[]>;
    /**
     * Get approved address for token
     */
    getApproved(tokenId: bigint | number): Promise<string>;
    /**
     * Check if operator is approved for all
     */
    isApprovedForAll(owner: string, operator: string): Promise<boolean>;
    /**
     * Approve address for token
     */
    approve(wallet: Wallet, to: string, tokenId: bigint | number): Promise<TransactionReceipt>;
    /**
     * Set approval for all tokens
     */
    setApprovalForAll(wallet: Wallet, operator: string, approved: boolean): Promise<TransactionReceipt>;
    /**
     * Transfer NFT
     */
    transfer(wallet: Wallet, to: string, tokenId: bigint | number): Promise<TransactionReceipt>;
    /**
     * Safe transfer NFT
     */
    safeTransfer(wallet: Wallet, to: string, tokenId: bigint | number): Promise<TransactionReceipt>;
    /**
     * Transfer from (requires approval)
     */
    transferFrom(wallet: Wallet, from: string, to: string, tokenId: bigint | number): Promise<TransactionReceipt>;
    /**
     * Get transfer history for token
     */
    getTokenHistory(tokenId: bigint | number, fromBlock?: number): Promise<NFTTransferEvent[]>;
    /**
     * Get all transfers to/from address
     */
    getAddressHistory(address: string, fromBlock?: number): Promise<NFTTransferEvent[]>;
    /**
     * Get underlying contract
     */
    getContract(): Contract;
}
export interface NFTTransferEvent {
    from: string;
    to: string;
    tokenId: bigint;
    blockNumber: number;
    transactionHash: string;
}
//# sourceMappingURL=erc721.d.ts.map