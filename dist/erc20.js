"use strict";
/**
 * NanoPy SDK ERC20 Token Helper
 * Easy interaction with ERC20 tokens
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERC20 = void 0;
const contract_1 = require("./contract");
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
class ERC20 {
    constructor(address, client) {
        this.address = address;
        this.client = client;
        this.contract = new contract_1.Contract(address, ERC20_ABI, client);
    }
    // ============ Read Methods ============
    /**
     * Get token name
     */
    async name() {
        if (!this._name) {
            this._name = await this.contract.call('name');
        }
        return this._name;
    }
    /**
     * Get token symbol
     */
    async symbol() {
        if (!this._symbol) {
            this._symbol = await this.contract.call('symbol');
        }
        return this._symbol;
    }
    /**
     * Get token decimals
     */
    async decimals() {
        if (!this._decimals) {
            const dec = await this.contract.call('decimals');
            this._decimals = Number(dec);
        }
        return this._decimals;
    }
    /**
     * Get total supply
     */
    async totalSupply() {
        return this.contract.call('totalSupply');
    }
    /**
     * Get balance of address
     */
    async balanceOf(address) {
        return this.contract.call('balanceOf', [address]);
    }
    /**
     * Get formatted balance
     */
    async getBalance(address) {
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
    async allowance(owner, spender) {
        return this.contract.call('allowance', [owner, spender]);
    }
    /**
     * Get full token info
     */
    async getInfo() {
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
    async transfer(wallet, to, amount) {
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
    async approve(wallet, spender, amount) {
        const decimals = await this.decimals();
        const amountWei = amount === 'max'
            ? BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
            : this.parseAmount(amount, decimals);
        return this.contract.send(wallet, 'approve', [spender, amountWei]);
    }
    /**
     * Transfer from (requires allowance)
     */
    async transferFrom(wallet, from, to, amount) {
        const decimals = await this.decimals();
        const amountWei = this.parseAmount(amount, decimals);
        return this.contract.send(wallet, 'transferFrom', [from, to, amountWei]);
    }
    // ============ Events ============
    /**
     * Get transfer history
     */
    async getTransfers(options = {}) {
        const filter = {};
        if (options.from)
            filter.from = options.from;
        if (options.to)
            filter.to = options.to;
        const events = await this.contract.getPastEvents('Transfer', {
            filter,
            fromBlock: options.fromBlock || 0,
            toBlock: options.toBlock || 'latest'
        });
        return events.map(e => ({
            from: e.args.from,
            to: e.args.to,
            value: e.args.value,
            blockNumber: e.log.blockNumber,
            transactionHash: e.log.transactionHash
        }));
    }
    // ============ Utility Methods ============
    /**
     * Parse human amount to token units
     */
    parseAmount(amount, decimals) {
        if (typeof amount === 'bigint')
            return amount;
        const dec = decimals || this._decimals || 18;
        const [whole, fraction = ''] = amount.split('.');
        const paddedFraction = fraction.padEnd(dec, '0').slice(0, dec);
        return BigInt(whole + paddedFraction);
    }
    /**
     * Format token units to human readable
     */
    formatAmount(amount, decimals) {
        const dec = decimals || this._decimals || 18;
        const divisor = BigInt(10 ** dec);
        const whole = amount / divisor;
        const fraction = amount % divisor;
        if (fraction === 0n)
            return whole.toString();
        const fractionStr = fraction.toString().padStart(dec, '0');
        const trimmed = fractionStr.replace(/0+$/, '');
        return `${whole}.${trimmed}`;
    }
    /**
     * Get underlying contract
     */
    getContract() {
        return this.contract;
    }
}
exports.ERC20 = ERC20;
//# sourceMappingURL=erc20.js.map