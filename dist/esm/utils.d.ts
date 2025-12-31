/**
 * NanoPy SDK Utilities
 * Common utility functions for blockchain operations
 */
/**
 * Convert NPY to Wei
 * @param npy - Amount in NPY (e.g., "1.5")
 * @returns Amount in Wei as BigInt
 */
export declare function toWei(npy: string | number): bigint;
/**
 * Convert Wei to NPY
 * @param wei - Amount in Wei
 * @returns Amount in NPY as string
 */
export declare function fromWei(wei: bigint | string): string;
/**
 * Format balance for display with symbol
 * @param wei - Balance in Wei
 * @param symbol - Token symbol (default: NPY)
 * @returns Formatted balance string
 */
export declare function formatBalance(wei: bigint | string, symbol?: string): string;
/**
 * Convert hex string to number
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Number value
 */
export declare function hexToNumber(hex: string): number;
/**
 * Convert hex string to BigInt
 * @param hex - Hex string (with or without 0x prefix)
 * @returns BigInt value
 */
export declare function hexToBigInt(hex: string): bigint;
/**
 * Convert number to hex string
 * @param num - Number or BigInt
 * @returns Hex string with 0x prefix
 */
export declare function numberToHex(num: number | bigint): string;
/**
 * Pad hex to specific byte length
 * @param hex - Hex string
 * @param bytes - Target byte length (default: 32)
 * @returns Padded hex string
 */
export declare function padHex(hex: string, bytes?: number): string;
/**
 * Convert bytes to hex string
 * @param bytes - Uint8Array
 * @returns Hex string with 0x prefix
 */
export declare function bytesToHex(bytes: Uint8Array): string;
/**
 * Convert hex string to bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Uint8Array
 */
export declare function hexToBytes(hex: string): Uint8Array;
/**
 * Keccak256 hash
 * @param data - Data to hash (string or bytes)
 * @returns Hash as hex string with 0x prefix
 */
export declare function keccak(data: string | Uint8Array): string;
/**
 * Check if string is valid Ethereum address
 * @param address - Address to validate
 * @returns True if valid
 */
export declare function isAddress(address: string): boolean;
/**
 * Convert address to checksum format (EIP-55)
 * @param address - Address to convert
 * @returns Checksummed address
 */
export declare function toChecksumAddress(address: string): string;
/**
 * Validate checksum address
 * @param address - Address to validate
 * @returns True if checksum is valid
 */
export declare function isChecksumAddress(address: string): boolean;
/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Encode string to hex
 * @param str - String to encode
 * @returns Hex string with 0x prefix
 */
export declare function stringToHex(str: string): string;
/**
 * Decode hex to string
 * @param hex - Hex string to decode
 * @returns Decoded string
 */
export declare function hexToString(hex: string): string;
/**
 * Shorten address for display
 * @param address - Full address
 * @param chars - Characters to show on each side (default: 4)
 * @returns Shortened address (e.g., 0x1234...5678)
 */
export declare function shortenAddress(address: string, chars?: number): string;
/**
 * Calculate function selector (first 4 bytes of keccak256)
 * @param signature - Function signature (e.g., "transfer(address,uint256)")
 * @returns Function selector (e.g., "0xa9059cbb")
 */
export declare function functionSelector(signature: string): string;
/**
 * Calculate event topic (keccak256 of signature)
 * @param signature - Event signature (e.g., "Transfer(address,address,uint256)")
 * @returns Event topic hash
 */
export declare function eventTopic(signature: string): string;
//# sourceMappingURL=utils.d.ts.map