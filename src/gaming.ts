/**
 * NanoPy SDK Gaming Helpers
 * Tools for blockchain gaming: items, achievements, leaderboards, rewards
 */

import { Contract } from './contract';
import { ERC721 } from './erc721';
import { ERC20 } from './erc20';
import { Wallet } from './wallet';
import { TransactionReceipt, ABI } from './types';
import { keccak256 } from 'js-sha3';
import { bytesToHex } from './utils';

// ============ Game Item (ERC1155-like) ============

const GAME_ITEM_ABI: ABI = [
  // Balance
  { type: 'function', name: 'balanceOf', inputs: [{ type: 'address', name: 'account' }, { type: 'uint256', name: 'id' }], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOfBatch', inputs: [{ type: 'address[]', name: 'accounts' }, { type: 'uint256[]', name: 'ids' }], outputs: [{ type: 'uint256[]', name: '' }], stateMutability: 'view' },
  // URI
  { type: 'function', name: 'uri', inputs: [{ type: 'uint256', name: 'id' }], outputs: [{ type: 'string', name: '' }], stateMutability: 'view' },
  // Transfers
  { type: 'function', name: 'safeTransferFrom', inputs: [{ type: 'address', name: 'from' }, { type: 'address', name: 'to' }, { type: 'uint256', name: 'id' }, { type: 'uint256', name: 'amount' }, { type: 'bytes', name: 'data' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'safeBatchTransferFrom', inputs: [{ type: 'address', name: 'from' }, { type: 'address', name: 'to' }, { type: 'uint256[]', name: 'ids' }, { type: 'uint256[]', name: 'amounts' }, { type: 'bytes', name: 'data' }], outputs: [], stateMutability: 'nonpayable' },
  // Approval
  { type: 'function', name: 'setApprovalForAll', inputs: [{ type: 'address', name: 'operator' }, { type: 'bool', name: 'approved' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'isApprovedForAll', inputs: [{ type: 'address', name: 'account' }, { type: 'address', name: 'operator' }], outputs: [{ type: 'bool', name: '' }], stateMutability: 'view' },
  // Events
  { type: 'event', name: 'TransferSingle', inputs: [{ type: 'address', name: 'operator', indexed: true }, { type: 'address', name: 'from', indexed: true }, { type: 'address', name: 'to', indexed: true }, { type: 'uint256', name: 'id', indexed: false }, { type: 'uint256', name: 'value', indexed: false }] },
  { type: 'event', name: 'TransferBatch', inputs: [{ type: 'address', name: 'operator', indexed: true }, { type: 'address', name: 'from', indexed: true }, { type: 'address', name: 'to', indexed: true }, { type: 'uint256[]', name: 'ids', indexed: false }, { type: 'uint256[]', name: 'values', indexed: false }] }
];

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
  attributes?: Array<{ trait_type: string; value: any }>;
}

/**
 * ERC1155-style game items (swords, potions, etc.)
 */
export class GameItems {
  readonly address: string;
  private contract: Contract;
  private client: any;

  constructor(address: string, client: any) {
    this.address = address;
    this.client = client;
    this.contract = new Contract(address, GAME_ITEM_ABI, client);
  }

  /**
   * Get item balance
   */
  async balanceOf(address: string, itemId: bigint | number): Promise<bigint> {
    return this.contract.call('balanceOf', [address, BigInt(itemId)]);
  }

  /**
   * Get multiple item balances
   */
  async getInventory(address: string, itemIds: (bigint | number)[]): Promise<GameItem[]> {
    const items: GameItem[] = [];

    for (const id of itemIds) {
      const balance = await this.balanceOf(address, id);
      if (balance > 0n) {
        items.push({
          id: BigInt(id),
          balance
        });
      }
    }

    return items;
  }

  /**
   * Get item URI
   */
  async uri(itemId: bigint | number): Promise<string> {
    return this.contract.call('uri', [BigInt(itemId)]);
  }

  /**
   * Transfer item
   */
  async transfer(
    wallet: Wallet,
    to: string,
    itemId: bigint | number,
    amount: bigint | number
  ): Promise<TransactionReceipt> {
    return this.contract.send(wallet, 'safeTransferFrom', [
      wallet.address,
      to,
      BigInt(itemId),
      BigInt(amount),
      '0x'
    ]);
  }

  /**
   * Batch transfer items
   */
  async batchTransfer(
    wallet: Wallet,
    to: string,
    itemIds: (bigint | number)[],
    amounts: (bigint | number)[]
  ): Promise<TransactionReceipt> {
    return this.contract.send(wallet, 'safeBatchTransferFrom', [
      wallet.address,
      to,
      itemIds.map(BigInt),
      amounts.map(BigInt),
      '0x'
    ]);
  }

  /**
   * Check if approved for trading
   */
  async isApprovedForAll(owner: string, operator: string): Promise<boolean> {
    return this.contract.call('isApprovedForAll', [owner, operator]);
  }

  /**
   * Set approval for marketplace/game contract
   */
  async setApprovalForAll(wallet: Wallet, operator: string, approved: boolean): Promise<TransactionReceipt> {
    return this.contract.send(wallet, 'setApprovalForAll', [operator, approved]);
  }
}

// ============ Leaderboard ============

export interface LeaderboardEntry {
  address: string;
  score: bigint;
  rank: number;
  timestamp?: number;
}

const LEADERBOARD_ABI: ABI = [
  { type: 'function', name: 'getScore', inputs: [{ type: 'address', name: 'player' }], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'getTopPlayers', inputs: [{ type: 'uint256', name: 'count' }], outputs: [{ type: 'address[]', name: '', }, { type: 'uint256[]', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'submitScore', inputs: [{ type: 'uint256', name: 'score' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'event', name: 'ScoreSubmitted', inputs: [{ type: 'address', name: 'player', indexed: true }, { type: 'uint256', name: 'score', indexed: false }] }
];

/**
 * On-chain leaderboard
 */
export class Leaderboard {
  readonly address: string;
  private contract: Contract;
  private client: any;

  constructor(address: string, client: any) {
    this.address = address;
    this.client = client;
    this.contract = new Contract(address, LEADERBOARD_ABI, client);
  }

  /**
   * Get player score
   */
  async getScore(address: string): Promise<bigint> {
    return this.contract.call('getScore', [address]);
  }

  /**
   * Get top players
   */
  async getTopPlayers(count: number = 10): Promise<LeaderboardEntry[]> {
    const [addresses, scores] = await this.contract.call('getTopPlayers', [count]);

    return addresses.map((addr: string, i: number) => ({
      address: addr,
      score: scores[i] as bigint,
      rank: i + 1
    }));
  }

  /**
   * Submit score (signed by player)
   */
  async submitScore(wallet: Wallet, score: bigint | number): Promise<TransactionReceipt> {
    return this.contract.send(wallet, 'submitScore', [BigInt(score)]);
  }
}

// ============ Achievement System ============

export interface Achievement {
  id: bigint;
  name: string;
  description: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENT_ABI: ABI = [
  { type: 'function', name: 'hasAchievement', inputs: [{ type: 'address', name: 'player' }, { type: 'uint256', name: 'achievementId' }], outputs: [{ type: 'bool', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'getPlayerAchievements', inputs: [{ type: 'address', name: 'player' }], outputs: [{ type: 'uint256[]', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'getTotalPoints', inputs: [{ type: 'address', name: 'player' }], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' },
  { type: 'event', name: 'AchievementUnlocked', inputs: [{ type: 'address', name: 'player', indexed: true }, { type: 'uint256', name: 'achievementId', indexed: true }] }
];

/**
 * Achievement tracking system
 */
export class Achievements {
  readonly address: string;
  private contract: Contract;
  private client: any;

  constructor(address: string, client: any) {
    this.address = address;
    this.client = client;
    this.contract = new Contract(address, ACHIEVEMENT_ABI, client);
  }

  /**
   * Check if player has achievement
   */
  async hasAchievement(address: string, achievementId: bigint | number): Promise<boolean> {
    return this.contract.call('hasAchievement', [address, BigInt(achievementId)]);
  }

  /**
   * Get all unlocked achievements
   */
  async getPlayerAchievements(address: string): Promise<bigint[]> {
    return this.contract.call('getPlayerAchievements', [address]);
  }

  /**
   * Get total achievement points
   */
  async getTotalPoints(address: string): Promise<bigint> {
    return this.contract.call('getTotalPoints', [address]);
  }
}

// ============ Reward Distribution ============

export interface RewardClaim {
  amount: bigint;
  claimed: boolean;
  expiry?: number;
}

const REWARDS_ABI: ABI = [
  { type: 'function', name: 'getPendingReward', inputs: [{ type: 'address', name: 'player' }], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' },
  { type: 'function', name: 'claimReward', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'claimableAmount', inputs: [{ type: 'address', name: 'player' }], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' },
  { type: 'event', name: 'RewardClaimed', inputs: [{ type: 'address', name: 'player', indexed: true }, { type: 'uint256', name: 'amount', indexed: false }] }
];

/**
 * Reward distribution system
 */
export class Rewards {
  readonly address: string;
  private contract: Contract;
  private client: any;

  constructor(address: string, client: any) {
    this.address = address;
    this.client = client;
    this.contract = new Contract(address, REWARDS_ABI, client);
  }

  /**
   * Get pending reward
   */
  async getPendingReward(address: string): Promise<bigint> {
    return this.contract.call('getPendingReward', [address]);
  }

  /**
   * Get claimable amount
   */
  async claimableAmount(address: string): Promise<bigint> {
    return this.contract.call('claimableAmount', [address]);
  }

  /**
   * Claim reward
   */
  async claimReward(wallet: Wallet): Promise<TransactionReceipt> {
    return this.contract.send(wallet, 'claimReward', []);
  }
}

// ============ Random Number Generation ============

/**
 * Generate verifiable random numbers for games
 * Uses commit-reveal scheme or chainlink VRF
 */
export class GameRandom {
  /**
   * Generate random seed from block hash (simple, not secure for high-value)
   */
  static fromBlockHash(blockHash: string, nonce: number): bigint {
    const data = blockHash + nonce.toString(16).padStart(64, '0');
    const hash = keccak256(data);
    return BigInt('0x' + hash);
  }

  /**
   * Generate random number in range
   */
  static inRange(seed: bigint, min: number, max: number): number {
    const range = BigInt(max - min + 1);
    return min + Number(seed % range);
  }

  /**
   * Roll dice (1-6 by default)
   */
  static rollDice(seed: bigint, sides: number = 6): number {
    return this.inRange(seed, 1, sides);
  }

  /**
   * Pick random item from array
   */
  static pickRandom<T>(seed: bigint, items: T[]): T {
    const index = this.inRange(seed, 0, items.length - 1);
    return items[index];
  }

  /**
   * Shuffle array using Fisher-Yates
   */
  static shuffle<T>(seed: bigint, items: T[]): T[] {
    const result = [...items];
    let currentSeed = seed;

    for (let i = result.length - 1; i > 0; i--) {
      currentSeed = BigInt(keccak256(currentSeed.toString(16)));
      const j = this.inRange(currentSeed, 0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  /**
   * Calculate loot drop (rarity weighted)
   */
  static calculateDrop(
    seed: bigint,
    drops: Array<{ item: string; weight: number }>
  ): string {
    const totalWeight = drops.reduce((sum, d) => sum + d.weight, 0);
    const roll = this.inRange(seed, 0, totalWeight - 1);

    let cumulative = 0;
    for (const drop of drops) {
      cumulative += drop.weight;
      if (roll < cumulative) {
        return drop.item;
      }
    }

    return drops[drops.length - 1].item;
  }
}

// ============ Player Session ============

/**
 * Manage game session with signed messages
 */
export class GameSession {
  private wallet: Wallet;
  private gameContract: string;
  private sessionId: string;
  private startTime: number;

  constructor(wallet: Wallet, gameContract: string) {
    this.wallet = wallet;
    this.gameContract = gameContract;
    this.startTime = Date.now();
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    const data = `${this.wallet.address}:${this.gameContract}:${this.startTime}`;
    return '0x' + keccak256(data).slice(0, 16);
  }

  /**
   * Sign game action (for off-chain verification)
   */
  signAction(action: string, data: Record<string, any>): string {
    const message = JSON.stringify({
      sessionId: this.sessionId,
      action,
      data,
      timestamp: Date.now()
    });

    return this.wallet.sign(message);
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      player: this.wallet.address,
      gameContract: this.gameContract,
      startTime: this.startTime,
      duration: Date.now() - this.startTime
    };
  }
}
