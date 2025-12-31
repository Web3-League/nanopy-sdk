/**
 * NanoPy SDK Utilities
 * Common utility functions for blockchain operations
 */
import { keccak256 } from 'js-sha3';
const WEI_PER_NPY = BigInt('1000000000000000000'); // 10^18
/**
 * Convert NPY to Wei
 * @param npy - Amount in NPY (e.g., "1.5")
 * @returns Amount in Wei as BigInt
 */
export function toWei(npy) {
    const str = String(npy);
    const [whole, fraction = ''] = str.split('.');
    const paddedFraction = fraction.padEnd(18, '0').slice(0, 18);
    return BigInt(whole + paddedFraction);
}
/**
 * Convert Wei to NPY
 * @param wei - Amount in Wei
 * @returns Amount in NPY as string
 */
export function fromWei(wei) {
    const weiBigInt = BigInt(wei);
    const whole = weiBigInt / WEI_PER_NPY;
    const fraction = weiBigInt % WEI_PER_NPY;
    if (fraction === 0n) {
        return whole.toString();
    }
    const fractionStr = fraction.toString().padStart(18, '0');
    const trimmed = fractionStr.replace(/0+$/, '');
    return `${whole}.${trimmed}`;
}
/**
 * Format balance for display with symbol
 * @param wei - Balance in Wei
 * @param symbol - Token symbol (default: NPY)
 * @returns Formatted balance string
 */
export function formatBalance(wei, symbol = 'NPY') {
    const npy = fromWei(wei);
    const num = parseFloat(npy);
    if (num === 0)
        return `0 ${symbol}`;
    if (num < 0.0001)
        return `<0.0001 ${symbol}`;
    if (num < 1)
        return `${num.toFixed(4)} ${symbol}`;
    if (num < 1000)
        return `${num.toFixed(2)} ${symbol}`;
    if (num < 1000000)
        return `${(num / 1000).toFixed(2)}K ${symbol}`;
    return `${(num / 1000000).toFixed(2)}M ${symbol}`;
}
/**
 * Convert hex string to number
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Number value
 */
export function hexToNumber(hex) {
    return parseInt(hex, 16);
}
/**
 * Convert hex string to BigInt
 * @param hex - Hex string (with or without 0x prefix)
 * @returns BigInt value
 */
export function hexToBigInt(hex) {
    const cleanHex = hex.startsWith('0x') ? hex : `0x${hex}`;
    return BigInt(cleanHex);
}
/**
 * Convert number to hex string
 * @param num - Number or BigInt
 * @returns Hex string with 0x prefix
 */
export function numberToHex(num) {
    return '0x' + BigInt(num).toString(16);
}
/**
 * Pad hex to specific byte length
 * @param hex - Hex string
 * @param bytes - Target byte length (default: 32)
 * @returns Padded hex string
 */
export function padHex(hex, bytes = 32) {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    return '0x' + cleanHex.padStart(bytes * 2, '0');
}
/**
 * Convert bytes to hex string
 * @param bytes - Uint8Array
 * @returns Hex string with 0x prefix
 */
export function bytesToHex(bytes) {
    return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
/**
 * Convert hex string to bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Uint8Array
 */
export function hexToBytes(hex) {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}
/**
 * Keccak256 hash
 * @param data - Data to hash (string or bytes)
 * @returns Hash as hex string with 0x prefix
 */
export function keccak(data) {
    if (typeof data === 'string') {
        const cleanData = data.startsWith('0x') ? data.slice(2) : data;
        return '0x' + keccak256(hexToBytes(cleanData));
    }
    return '0x' + keccak256(data);
}
/**
 * Check if string is valid Ethereum address
 * @param address - Address to validate
 * @returns True if valid
 */
export function isAddress(address) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        return false;
    }
    return true;
}
/**
 * Convert address to checksum format (EIP-55)
 * @param address - Address to convert
 * @returns Checksummed address
 */
export function toChecksumAddress(address) {
    if (!isAddress(address)) {
        throw new Error('Invalid address');
    }
    const addr = address.toLowerCase().slice(2);
    const hash = keccak256(addr);
    let result = '0x';
    for (let i = 0; i < 40; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            result += addr[i].toUpperCase();
        }
        else {
            result += addr[i];
        }
    }
    return result;
}
/**
 * Validate checksum address
 * @param address - Address to validate
 * @returns True if checksum is valid
 */
export function isChecksumAddress(address) {
    if (!isAddress(address))
        return false;
    try {
        return address === toChecksumAddress(address);
    }
    catch {
        return false;
    }
}
/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Encode string to hex
 * @param str - String to encode
 * @returns Hex string with 0x prefix
 */
export function stringToHex(str) {
    let hex = '0x';
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex;
}
/**
 * Decode hex to string
 * @param hex - Hex string to decode
 * @returns Decoded string
 */
export function hexToString(hex) {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    let str = '';
    for (let i = 0; i < cleanHex.length; i += 2) {
        const code = parseInt(cleanHex.slice(i, i + 2), 16);
        if (code === 0)
            break;
        str += String.fromCharCode(code);
    }
    return str;
}
/**
 * Shorten address for display
 * @param address - Full address
 * @param chars - Characters to show on each side (default: 4)
 * @returns Shortened address (e.g., 0x1234...5678)
 */
export function shortenAddress(address, chars = 4) {
    if (!address)
        return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
/**
 * Calculate function selector (first 4 bytes of keccak256)
 * @param signature - Function signature (e.g., "transfer(address,uint256)")
 * @returns Function selector (e.g., "0xa9059cbb")
 */
export function functionSelector(signature) {
    const hash = keccak256(signature);
    return '0x' + hash.slice(0, 8);
}
/**
 * Calculate event topic (keccak256 of signature)
 * @param signature - Event signature (e.g., "Transfer(address,address,uint256)")
 * @returns Event topic hash
 */
export function eventTopic(signature) {
    return '0x' + keccak256(signature);
}
//# sourceMappingURL=utils.js.map