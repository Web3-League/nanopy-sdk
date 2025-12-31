# NanoPy SDK

TypeScript SDK for NanoPy blockchain - Gaming focused L1 chain.

## Install

```bash
npm install nanopy-sdk
```

## Quick Start

```typescript
import { NanoPy, NETWORKS } from 'nanopy-sdk';

const client = new NanoPy(NETWORKS.testnet);
const wallet = client.createWallet();

// Balance
const balance = await client.getBalance(wallet.address);

// Send NPY
await client.send(wallet, '0x...', '1.5');

// ERC20
const token = client.erc20('0x...');
await token.transfer(wallet, '0x...', '100');

// NFT
const nft = client.erc721('0x...');
await nft.transfer(wallet, '0x...', tokenId);
```

## Features

- Wallet (create, sign, EIP-155)
- RPC + WebSocket subscriptions
- Smart contracts (deploy, call)
- ERC20 tokens
- ERC721 NFTs
- Gaming helpers (items, leaderboard, achievements)

## Networks

| Network | RPC |
|---------|-----|
| Testnet | `NETWORKS.testnet` |
| Mainnet | `NETWORKS.mainnet` |
| Local | `NETWORKS.local` |
