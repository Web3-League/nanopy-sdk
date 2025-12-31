/**
 * NanoPy SDK Wallet
 * Secure wallet management with EIP-155 transaction signing
 */
import { WalletData, TransactionRequest } from './types';
export declare class Wallet {
    readonly address: string;
    readonly privateKey: string;
    readonly publicKey: string;
    /**
     * Create or load wallet
     * @param privateKey - Optional private key (generates new if not provided)
     */
    constructor(privateKey?: string);
    /**
     * Generate random private key
     */
    private generatePrivateKey;
    /**
     * Derive public key from private key
     */
    private derivePublicKey;
    /**
     * Derive address from public key
     */
    private deriveAddress;
    /**
     * Sign a message (personal_sign compatible)
     * @param message - Message to sign (string or bytes)
     * @returns Signature as hex string
     */
    sign(message: string | Uint8Array): string;
    /**
     * Sign typed data (EIP-712)
     * @param domain - Domain separator
     * @param types - Type definitions
     * @param value - Data to sign
     * @returns Signature
     */
    signTypedData(domain: {
        name?: string;
        version?: string;
        chainId?: number;
        verifyingContract?: string;
    }, types: Record<string, Array<{
        name: string;
        type: string;
    }>>, value: Record<string, any>): string;
    private hashStruct;
    private encodeType;
    /**
     * Sign transaction (EIP-155)
     * @param tx - Transaction to sign
     * @returns Signed transaction hex
     */
    signTransaction(tx: TransactionRequest): string;
    /**
     * Convert value to RLP-compatible format
     */
    private toRlpNumber;
    /**
     * Export wallet data
     */
    export(): WalletData;
    /**
     * Create wallet from mnemonic (BIP-39)
     * Note: Requires additional library for full BIP-39 support
     */
    static fromMnemonic(mnemonic: string, path?: string): Wallet;
}
//# sourceMappingURL=wallet.d.ts.map