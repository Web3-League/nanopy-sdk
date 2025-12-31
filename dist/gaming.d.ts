/**
 * NanoPy SDK Gaming Helpers
 * Tools for blockchain gaming: items, achievements, leaderboards, rewards
 */
import { Wallet } from './wallet';
import { TransactionReceipt } from './types';
export interface GameItem {
    id: bigint;
    balance: bigint;
    uri?: string;
    metadata?: ItemMetadata;
}
export interface ItemMetadata {
    name: string;
    description?: string;
    image?: string;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    stats?: Record<string, number>;
    attributes?: Array<{
        trait_type: string;
        value: any;
    }>;
}
/**
 * ERC1155-style game items (swords, potions, etc.)
 */
export declare class GameItems {
    readonly address: string;
    private contract;
    private client;
    constructor(address: string, client: any);
    /**
     * Get item balance
     */
    balanceOf(address: string, itemId: bigint | number): Promise<bigint>;
    /**
     * Get multiple item balances
     */
    getInventory(address: string, itemIds: (bigint | number)[]): Promise<GameItem[]>;
    /**
     * Get item URI
     */
    uri(itemId: bigint | number): Promise<string>;
    /**
     * Transfer item
     */
    transfer(wallet: Wallet, to: string, itemId: bigint | number, amount: bigint | number): Promise<TransactionReceipt>;
    /**
     * Batch transfer items
     */
    batchTransfer(wallet: Wallet, to: string, itemIds: (bigint | number)[], amounts: (bigint | number)[]): Promise<TransactionReceipt>;
    /**
     * Check if approved for trading
     */
    isApprovedForAll(owner: string, operator: string): Promise<boolean>;
    /**
     * Set approval for marketplace/game contract
     */
    setApprovalForAll(wallet: Wallet, operator: string, approved: boolean): Promise<TransactionReceipt>;
}
export interface LeaderboardEntry {
    address: string;
    score: bigint;
    rank: number;
    timestamp?: number;
}
/**
 * On-chain leaderboard
 */
export declare class Leaderboard {
    readonly address: string;
    private contract;
    private client;
    constructor(address: string, client: any);
    /**
     * Get player score
     */
    getScore(address: string): Promise<bigint>;
    /**
     * Get top players
     */
    getTopPlayers(count?: number): Promise<LeaderboardEntry[]>;
    /**
     * Submit score (signed by player)
     */
    submitScore(wallet: Wallet, score: bigint | number): Promise<TransactionReceipt>;
}
export interface Achievement {
    id: bigint;
    name: string;
    description: string;
    points: number;
    unlocked: boolean;
    unlockedAt?: number;
}
/**
 * Achievement tracking system
 */
export declare class Achievements {
    readonly address: string;
    private contract;
    private client;
    constructor(address: string, client: any);
    /**
     * Check if player has achievement
     */
    hasAchievement(address: string, achievementId: bigint | number): Promise<boolean>;
    /**
     * Get all unlocked achievements
     */
    getPlayerAchievements(address: string): Promise<bigint[]>;
    /**
     * Get total achievement points
     */
    getTotalPoints(address: string): Promise<bigint>;
}
export interface RewardClaim {
    amount: bigint;
    claimed: boolean;
    expiry?: number;
}
/**
 * Reward distribution system
 */
export declare class Rewards {
    readonly address: string;
    private contract;
    private client;
    constructor(address: string, client: any);
    /**
     * Get pending reward
     */
    getPendingReward(address: string): Promise<bigint>;
    /**
     * Get claimable amount
     */
    claimableAmount(address: string): Promise<bigint>;
    /**
     * Claim reward
     */
    claimReward(wallet: Wallet): Promise<TransactionReceipt>;
}
/**
 * Generate verifiable random numbers for games
 * Uses commit-reveal scheme or chainlink VRF
 */
export declare class GameRandom {
    /**
     * Generate random seed from block hash (simple, not secure for high-value)
     */
    static fromBlockHash(blockHash: string, nonce: number): bigint;
    /**
     * Generate random number in range
     */
    static inRange(seed: bigint, min: number, max: number): number;
    /**
     * Roll dice (1-6 by default)
     */
    static rollDice(seed: bigint, sides?: number): number;
    /**
     * Pick random item from array
     */
    static pickRandom<T>(seed: bigint, items: T[]): T;
    /**
     * Shuffle array using Fisher-Yates
     */
    static shuffle<T>(seed: bigint, items: T[]): T[];
    /**
     * Calculate loot drop (rarity weighted)
     */
    static calculateDrop(seed: bigint, drops: Array<{
        item: string;
        weight: number;
    }>): string;
}
/**
 * Manage game session with signed messages
 */
export declare class GameSession {
    private wallet;
    private gameContract;
    private sessionId;
    private startTime;
    constructor(wallet: Wallet, gameContract: string);
    private generateSessionId;
    /**
     * Sign game action (for off-chain verification)
     */
    signAction(action: string, data: Record<string, any>): string;
    /**
     * Get session info
     */
    getSessionInfo(): {
        sessionId: string;
        player: string;
        gameContract: string;
        startTime: number;
        duration: number;
    };
}
//# sourceMappingURL=gaming.d.ts.map