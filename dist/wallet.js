"use strict";
/**
 * NanoPy SDK Wallet
 * Secure wallet management with EIP-155 transaction signing
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const secp256k1 = __importStar(require("secp256k1"));
const js_sha3_1 = require("js-sha3");
const rlp = __importStar(require("rlp"));
const utils_1 = require("./utils");
class Wallet {
    /**
     * Create or load wallet
     * @param privateKey - Optional private key (generates new if not provided)
     */
    constructor(privateKey) {
        if (privateKey) {
            // Load from private key
            const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
            this.privateKey = '0x' + cleanKey;
            this.publicKey = this.derivePublicKey(cleanKey);
            this.address = this.deriveAddress(this.publicKey);
        }
        else {
            // Generate new wallet
            const privKey = this.generatePrivateKey();
            this.privateKey = '0x' + privKey;
            this.publicKey = this.derivePublicKey(privKey);
            this.address = this.deriveAddress(this.publicKey);
        }
    }
    /**
     * Generate random private key
     */
    generatePrivateKey() {
        const bytes = new Uint8Array(32);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(bytes);
        }
        else {
            // Node.js fallback
            const { randomBytes } = require('crypto');
            const nodeBytes = randomBytes(32);
            bytes.set(nodeBytes);
        }
        // Ensure valid secp256k1 key
        while (!secp256k1.privateKeyVerify(bytes)) {
            if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
                crypto.getRandomValues(bytes);
            }
        }
        return Buffer.from(bytes).toString('hex');
    }
    /**
     * Derive public key from private key
     */
    derivePublicKey(privateKeyHex) {
        const privateKeyBytes = (0, utils_1.hexToBytes)(privateKeyHex);
        const publicKeyBytes = secp256k1.publicKeyCreate(privateKeyBytes, false);
        // Remove the 04 prefix (uncompressed key marker)
        return (0, utils_1.bytesToHex)(publicKeyBytes.slice(1));
    }
    /**
     * Derive address from public key
     */
    deriveAddress(publicKey) {
        const pubKeyBytes = (0, utils_1.hexToBytes)(publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey);
        const hash = (0, js_sha3_1.keccak256)(pubKeyBytes);
        const address = '0x' + hash.slice(-40);
        return (0, utils_1.toChecksumAddress)(address);
    }
    /**
     * Sign a message (personal_sign compatible)
     * @param message - Message to sign (string or bytes)
     * @returns Signature as hex string
     */
    sign(message) {
        const messageBytes = typeof message === 'string'
            ? new TextEncoder().encode(message)
            : message;
        // Ethereum signed message prefix
        const prefix = `\x19Ethereum Signed Message:\n${messageBytes.length}`;
        const prefixBytes = new TextEncoder().encode(prefix);
        const fullMessage = new Uint8Array(prefixBytes.length + messageBytes.length);
        fullMessage.set(prefixBytes);
        fullMessage.set(messageBytes, prefixBytes.length);
        const hash = (0, utils_1.hexToBytes)((0, js_sha3_1.keccak256)(fullMessage));
        const privateKeyBytes = (0, utils_1.hexToBytes)(this.privateKey.slice(2));
        const { signature, recid } = secp256k1.ecdsaSign(hash, privateKeyBytes);
        // Encode as r + s + v
        const r = (0, utils_1.bytesToHex)(signature.slice(0, 32));
        const s = (0, utils_1.bytesToHex)(signature.slice(32, 64));
        const v = (recid + 27).toString(16).padStart(2, '0');
        return r + s.slice(2) + v;
    }
    /**
     * Sign typed data (EIP-712)
     * @param domain - Domain separator
     * @param types - Type definitions
     * @param value - Data to sign
     * @returns Signature
     */
    signTypedData(domain, types, value) {
        // Simplified EIP-712 - full implementation would be more complex
        const domainHash = this.hashStruct('EIP712Domain', domain, {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' }
            ]
        });
        const primaryType = Object.keys(types).find(t => t !== 'EIP712Domain') || '';
        const messageHash = this.hashStruct(primaryType, value, types);
        const hash = (0, utils_1.hexToBytes)((0, js_sha3_1.keccak256)('\x19\x01' + domainHash.slice(2) + messageHash.slice(2)));
        const privateKeyBytes = (0, utils_1.hexToBytes)(this.privateKey.slice(2));
        const { signature, recid } = secp256k1.ecdsaSign(hash, privateKeyBytes);
        const r = (0, utils_1.bytesToHex)(signature.slice(0, 32));
        const s = (0, utils_1.bytesToHex)(signature.slice(32, 64));
        const v = (recid + 27).toString(16).padStart(2, '0');
        return r + s.slice(2) + v;
    }
    hashStruct(typeName, data, types) {
        // Simplified implementation
        const typeHash = (0, js_sha3_1.keccak256)(this.encodeType(typeName, types));
        let encoded = typeHash;
        const typeFields = types[typeName] || [];
        for (const field of typeFields) {
            const value = data[field.name];
            if (value !== undefined) {
                if (field.type === 'string') {
                    encoded += (0, js_sha3_1.keccak256)(value);
                }
                else if (field.type === 'uint256' || field.type === 'uint') {
                    encoded += BigInt(value).toString(16).padStart(64, '0');
                }
                else if (field.type === 'address') {
                    encoded += value.slice(2).padStart(64, '0');
                }
            }
        }
        return '0x' + (0, js_sha3_1.keccak256)((0, utils_1.hexToBytes)(encoded));
    }
    encodeType(typeName, types) {
        const fields = types[typeName] || [];
        return `${typeName}(${fields.map(f => `${f.type} ${f.name}`).join(',')})`;
    }
    /**
     * Sign transaction (EIP-155)
     * @param tx - Transaction to sign
     * @returns Signed transaction hex
     */
    signTransaction(tx) {
        const chainId = tx.chainId || 1337;
        // Convert values to proper format
        const nonce = this.toRlpNumber(tx.nonce || 0);
        const gasPrice = this.toRlpNumber(tx.gasPrice || '0x3B9ACA00');
        const gasLimit = this.toRlpNumber(tx.gasLimit || 21000);
        const to = tx.to ? (0, utils_1.hexToBytes)(tx.to) : new Uint8Array(0);
        const value = this.toRlpNumber(tx.value || 0);
        const data = tx.data ? (0, utils_1.hexToBytes)(tx.data) : new Uint8Array(0);
        // EIP-155: include chainId in signing
        const rawTx = [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0];
        const encoded = rlp.encode(rawTx);
        const hash = (0, utils_1.hexToBytes)((0, js_sha3_1.keccak256)(encoded));
        // Sign
        const privateKeyBytes = (0, utils_1.hexToBytes)(this.privateKey.slice(2));
        const { signature, recid } = secp256k1.ecdsaSign(hash, privateKeyBytes);
        const r = signature.slice(0, 32);
        const s = signature.slice(32, 64);
        // EIP-155: v = recid + chainId * 2 + 35
        const v = recid + chainId * 2 + 35;
        // Final signed transaction
        const signedTx = [nonce, gasPrice, gasLimit, to, value, data, v, r, s];
        const signedEncoded = rlp.encode(signedTx);
        return (0, utils_1.bytesToHex)(signedEncoded);
    }
    /**
     * Convert value to RLP-compatible format
     */
    toRlpNumber(value) {
        let num;
        if (typeof value === 'string') {
            num = value.startsWith('0x') ? BigInt(value) : BigInt(value);
        }
        else {
            num = BigInt(value);
        }
        if (num === 0n) {
            return new Uint8Array(0);
        }
        const hex = num.toString(16);
        const paddedHex = hex.length % 2 ? '0' + hex : hex;
        return (0, utils_1.hexToBytes)(paddedHex);
    }
    /**
     * Export wallet data
     */
    export() {
        return {
            address: this.address,
            privateKey: this.privateKey,
            publicKey: this.publicKey
        };
    }
    /**
     * Create wallet from mnemonic (BIP-39)
     * Note: Requires additional library for full BIP-39 support
     */
    static fromMnemonic(mnemonic, path = "m/44'/60'/0'/0/0") {
        throw new Error('Mnemonic support requires bip39 library. Use: npm install bip39 hdkey');
    }
}
exports.Wallet = Wallet;
//# sourceMappingURL=wallet.js.map