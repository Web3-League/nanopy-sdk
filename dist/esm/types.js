/**
 * NanoPy SDK Types
 * Complete TypeScript definitions for the NanoPy blockchain SDK
 */
export const NETWORKS = {
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
//# sourceMappingURL=types.js.map