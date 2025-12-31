/**
 * NanoPy SDK RPC Client
 * HTTP JSON-RPC client for blockchain interaction
 */
import { sleep, hexToNumber } from './utils';
export class RPCClient {
    constructor(url, timeout = 30000) {
        this.requestId = 0;
        this.url = url;
        this.timeout = timeout;
    }
    /**
     * Make RPC call
     */
    async call(method, params = []) {
        const request = {
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
            const data = await response.json();
            if (data.error) {
                throw new Error(`RPC Error ${data.error.code}: ${data.error.message}`);
            }
            return data.result;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * Batch RPC calls
     */
    async batch(calls) {
        const requests = calls.map((call, i) => ({
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
        const results = await response.json();
        return results.sort((a, b) => a.id - b.id).map(r => {
            if (r.error)
                throw new Error(`RPC Error ${r.error.code}: ${r.error.message}`);
            return r.result;
        });
    }
    // ============ Chain Methods ============
    async getChainId() {
        return this.call('eth_chainId');
    }
    async getBlockNumber() {
        return this.call('eth_blockNumber');
    }
    async getGasPrice() {
        return this.call('eth_gasPrice');
    }
    async isSyncing() {
        return this.call('eth_syncing');
    }
    async getPeerCount() {
        return this.call('net_peerCount');
    }
    async getNetworkId() {
        return this.call('net_version');
    }
    // ============ Account Methods ============
    async getBalance(address, block = 'latest') {
        return this.call('eth_getBalance', [address, block]);
    }
    async getTransactionCount(address, block = 'latest') {
        return this.call('eth_getTransactionCount', [address, block]);
    }
    async getCode(address, block = 'latest') {
        return this.call('eth_getCode', [address, block]);
    }
    async getStorageAt(address, slot, block = 'latest') {
        return this.call('eth_getStorageAt', [address, slot, block]);
    }
    // ============ Block Methods ============
    async getBlockByNumber(number, fullTx = false) {
        const blockNum = typeof number === 'number' ? '0x' + number.toString(16) : number;
        return this.call('eth_getBlockByNumber', [blockNum, fullTx]);
    }
    async getBlockByHash(hash, fullTx = false) {
        return this.call('eth_getBlockByHash', [hash, fullTx]);
    }
    // ============ Transaction Methods ============
    async getTransactionByHash(hash) {
        return this.call('eth_getTransactionByHash', [hash]);
    }
    async getTransactionReceipt(hash) {
        return this.call('eth_getTransactionReceipt', [hash]);
    }
    async sendRawTransaction(signedTx) {
        return this.call('eth_sendRawTransaction', [signedTx]);
    }
    async estimateGas(tx) {
        return this.call('eth_estimateGas', [tx]);
    }
    async ethCall(tx, block = 'latest') {
        return this.call('eth_call', [tx, block]);
    }
    // ============ Log Methods ============
    async getLogs(filter) {
        const params = {};
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
        if (filter.address)
            params.address = filter.address;
        if (filter.topics)
            params.topics = filter.topics;
        return this.call('eth_getLogs', [params]);
    }
    // ============ Helper Methods ============
    /**
     * Wait for transaction confirmation
     */
    async waitForTransaction(txHash, confirmations = 1, timeout = 60000) {
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
    async getBalances(addresses) {
        const results = await this.batch(addresses.map(addr => ({ method: 'eth_getBalance', params: [addr, 'latest'] })));
        const balances = new Map();
        addresses.forEach((addr, i) => {
            balances.set(addr, BigInt(results[i]));
        });
        return balances;
    }
}
//# sourceMappingURL=rpc.js.map