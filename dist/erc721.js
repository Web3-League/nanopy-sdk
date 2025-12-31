"use strict";
/**
 * NanoPy SDK ERC721 NFT Helper
 * Easy interaction with NFT contracts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERC721 = void 0;
const contract_1 = require("./contract");
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
class ERC721 {
    constructor(address, client) {
        this.address = address;
        this.client = client;
        this.contract = new contract_1.Contract(address, ERC721_ABI, client);
    }
    // ============ Metadata ============
    /**
     * Get collection name
     */
    async name() {
        if (!this._name) {
            this._name = await this.contract.call('name');
        }
        return this._name;
    }
    /**
     * Get collection symbol
     */
    async symbol() {
        if (!this._symbol) {
            this._symbol = await this.contract.call('symbol');
        }
        return this._symbol;
    }
    /**
     * Get token URI
     */
    async tokenURI(tokenId) {
        return this.contract.call('tokenURI', [BigInt(tokenId)]);
    }
    /**
     * Get and parse token metadata from URI
     */
    async getMetadata(tokenId) {
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
            return await response.json();
        }
        catch {
            return null;
        }
    }
    /**
     * Get collection info
     */
    async getInfo() {
        const [name, symbol] = await Promise.all([
            this.name(),
            this.symbol()
        ]);
        let totalSupply;
        try {
            totalSupply = await this.totalSupply();
        }
        catch {
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
    async balanceOf(address) {
        return this.contract.call('balanceOf', [address]);
    }
    /**
     * Get owner of token
     */
    async ownerOf(tokenId) {
        return this.contract.call('ownerOf', [BigInt(tokenId)]);
    }
    /**
     * Check if address owns token
     */
    async isOwner(address, tokenId) {
        try {
            const owner = await this.ownerOf(tokenId);
            return owner.toLowerCase() === address.toLowerCase();
        }
        catch {
            return false;
        }
    }
    /**
     * Get total supply (if enumerable)
     */
    async totalSupply() {
        return this.contract.call('totalSupply');
    }
    /**
     * Get all tokens owned by address (if enumerable)
     */
    async getOwnedTokens(address, fetchMetadata = false) {
        const balance = await this.balanceOf(address);
        const tokens = [];
        for (let i = 0n; i < balance; i++) {
            try {
                const tokenId = await this.contract.call('tokenOfOwnerByIndex', [address, i]);
                const nft = { tokenId };
                if (fetchMetadata) {
                    try {
                        nft.tokenURI = await this.tokenURI(tokenId);
                        nft.metadata = await this.getMetadata(tokenId) || undefined;
                    }
                    catch {
                        // Metadata might not be available
                    }
                }
                tokens.push(nft);
            }
            catch {
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
    async getApproved(tokenId) {
        return this.contract.call('getApproved', [BigInt(tokenId)]);
    }
    /**
     * Check if operator is approved for all
     */
    async isApprovedForAll(owner, operator) {
        return this.contract.call('isApprovedForAll', [owner, operator]);
    }
    /**
     * Approve address for token
     */
    async approve(wallet, to, tokenId) {
        return this.contract.send(wallet, 'approve', [to, BigInt(tokenId)]);
    }
    /**
     * Set approval for all tokens
     */
    async setApprovalForAll(wallet, operator, approved) {
        return this.contract.send(wallet, 'setApprovalForAll', [operator, approved]);
    }
    // ============ Transfers ============
    /**
     * Transfer NFT
     */
    async transfer(wallet, to, tokenId) {
        return this.contract.send(wallet, 'transferFrom', [wallet.address, to, BigInt(tokenId)]);
    }
    /**
     * Safe transfer NFT
     */
    async safeTransfer(wallet, to, tokenId) {
        return this.contract.send(wallet, 'safeTransferFrom', [wallet.address, to, BigInt(tokenId)]);
    }
    /**
     * Transfer from (requires approval)
     */
    async transferFrom(wallet, from, to, tokenId) {
        return this.contract.send(wallet, 'transferFrom', [from, to, BigInt(tokenId)]);
    }
    // ============ Events ============
    /**
     * Get transfer history for token
     */
    async getTokenHistory(tokenId, fromBlock = 0) {
        const events = await this.contract.getPastEvents('Transfer', {
            filter: { tokenId: BigInt(tokenId) },
            fromBlock,
            toBlock: 'latest'
        });
        return events.map(e => ({
            from: e.args.from,
            to: e.args.to,
            tokenId: e.args.tokenId,
            blockNumber: e.log.blockNumber,
            transactionHash: e.log.transactionHash
        }));
    }
    /**
     * Get all transfers to/from address
     */
    async getAddressHistory(address, fromBlock = 0) {
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
            from: e.args.from,
            to: e.args.to,
            tokenId: e.args.tokenId,
            blockNumber: e.log.blockNumber,
            transactionHash: e.log.transactionHash
        }));
    }
    /**
     * Get underlying contract
     */
    getContract() {
        return this.contract;
    }
}
exports.ERC721 = ERC721;
//# sourceMappingURL=erc721.js.map