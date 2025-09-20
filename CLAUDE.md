# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Doot is a data feed oracle for Mina Protocol that provides price updates every 10 minutes with aggregation proofs. The application tracks 10 cryptocurrency tokens (MINA, BTC, ETH, SOL, XRP, ADA, AVAX, MATIC, LINK, DOGE) and is built as a Next.js web application with blockchain integration.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run Next.js linting
- `npm run check-types` - Type check with TypeScript (uses `tsc --noEmit`)

## Architecture Overview

### Frontend Structure
- **Framework**: Next.js 14 with React 18
- **UI Library**: Chakra UI with custom dark theme (background #171717)
- **State Management**: Redux Toolkit with store in `lib/redux/`
  - Network slice manages signer and chainName state
- **Fonts**: Poppins (primary), Source Code Pro, Montserrat
- **Mobile**: Desktop-only application (mobile shows unavailable screen at <1280px width)
- **Components**: Located in `pages/components/` with dashboard, home, and common directories

### Backend API Structure
Located in `pages/api/` with organized endpoints:
- `get/` - Data retrieval endpoints
  - `user/` - User status, key status, and information
  - `pinned/` - IPFS pinned data and CID management
  - `interface/` - Price data and graph information
  - `aggregation_proof.js` - Aggregation proof endpoints
- `update/` - Data update endpoints (CRON_SECRET protected)
  - `core/updateAllPrices.js` - Main price update logic (calls 16 data providers)
  - `ipfs/` - IPFS data updates (mina and historical)
  - `user/` - User management and API key updates

### Price Feed System
- **Data Providers**: 16 providers including Binance, CoinGecko, CryptoCompare, etc.
- **Update Frequency**: Every 10 minutes via Vercel cron
- **Aggregation**: Uses median calculation with error handling
- **Historical Data**: Updated every 33 minutes, stores 31 days of data
- **Caching**: Redis-based caching with separate keys for prices, graph data, and aggregation proofs

### Zero-Knowledge Proof Integration
- **Smart Contract**: `utils/constants/Doot.js` defines the main contract
  - Manages commitment, IPFS CID, and owner state
  - Supports offchain state for token information arrays
  - Includes methods for initialization, updates, price retrieval, and settlement
- **Proof System**: Uses o1js with offchain state management
- **IPFS Integration**: Pinata gateway for decentralized data storage

### Key Integrations
- **Mina Protocol**: o1js for zero-knowledge proofs and blockchain interaction
- **IPFS**: Pinata gateway (`NEXT_PUBLIC_PINATA_GATEWAY`) for decentralized storage
- **ZKON SDK**: Provable data fetching from GitHub repository
- **Rate Limiting**: Upstash Redis with `@upstash/ratelimit`
- **Analytics**: Vercel Analytics integration

### Utility Structure
- `utils/helper/` - Core blockchain and data helpers
  - `GetMinaInfo.ts` - Mina blockchain data fetching with proper error handling
  - `AggregationModule.ts` - Proof aggregation logic
  - `SendMinaTxn.ts` - Transaction sending utilities
  - `PinMinaObject.ts` - IPFS pinning operations
  - `init/` - Initialization utilities (Redis, ZKON)
- `utils/constants/` - Application constants
  - `Doot.js` - Main smart contract definition
  - `info.js` - Token mappings, provider endpoints, cache keys
  - `symbols.js` - Exchange-specific symbol mappings

### Environment Variables Required
- `NEXT_PUBLIC_PINATA_GATEWAY` - IPFS gateway URL
- `NEXT_PUBLIC_MINA_ENDPOINT` - Mina network endpoint
- `NEXT_PUBLIC_DOOT_PUBLIC_KEY` - Doot contract public key
- `CRON_SECRET` - Secret for protected cron endpoints
- Redis configuration for caching

### Deployment Configuration
- **Vercel**: Configured with cron jobs for automated updates
  - Price updates: Every 10 minutes (`*/10 * * * *`)
  - Historical data: Every 33 minutes (`*/33 * * * *`)
- **Memory**: Update functions use 3009MB with 300s timeout
- **CORS**: Configured for Pinata IPFS gateway access
- **Rate Limiting**: Implemented on update endpoints

### Development Notes
- TypeScript configuration uses ES2020 target with strict mode enabled
- Path mapping configured with `@/*` for root imports
- Turbo.json configured for monorepo-style builds with caching
- React Strict Mode disabled in next.config.js for o1js compatibility
- ESM externals enabled for proper module resolution
- Uses mixed .js and .ts files (constants in .js, helpers in .ts)

### Testing and Quality
When making changes, ensure to run both linting and type checking:
```bash
npm run lint
npm run check-types
```

### Token Support
Currently supports 10 tokens with mapping between full names and symbols:
- mina (MINA), bitcoin (BTC), ethereum (ETH), solana (SOL), ripple (XRP)
- cardano (ADA), avalanche (AVAX), polygon (MATIC), chainlink (LINK), dogecoin (DOGE)

## Complete API Dependency Analysis

### API Endpoint Structure (22 endpoints total)

#### GET Endpoints (11 files)
1. **`pages/api/get/aggregation_proof.js`** - Returns aggregation proofs for tokens
   - **Auth**: Supabase API key validation + call counter increment
   - **Dependencies**: `InitSupabase.js`, `InitRedis.js`, `IncrementCallCounter.js`, `info.js`, `uuid`
   - **Response**: Cached aggregation proof data for requested token

2. **`pages/api/get/interface/getGraphData.js`** - Returns graph data for tokens
   - **Auth**: Bearer token with `NEXT_PUBLIC_API_INTERFACE_KEY`
   - **Dependencies**: `InitRedis.js`, `info.js` (TOKEN_TO_GRAPH_DATA, TOKEN_TO_SYMBOL)
   - **Response**: Cached graph data (timestamps, prices, min/max, percentage change)

3. **`pages/api/get/interface/getPrice.js`** - Returns price data for tokens
   - **Auth**: Bearer token with `NEXT_PUBLIC_API_INTERFACE_KEY`
   - **Dependencies**: `InitRedis.js`, `info.js` (TOKEN_TO_CACHE, TOKEN_TO_SYMBOL)
   - **Response**: Latest price data from Redis cache

4. **`pages/api/get/pinned/getLatestHistoricalPinCID.js`** - Returns latest historical IPFS CID
   - **Auth**: None (public endpoint)
   - **Dependencies**: `InitRedis.js`, `info.js` (HISTORICAL_CID_CACHE)
   - **Response**: Current historical data IPFS CID

5. **`pages/api/get/pinned/getLatestMinaPinCID.js`** - Returns latest Mina IPFS CID
   - **Auth**: None (public endpoint)
   - **Dependencies**: `InitRedis.js`, `info.js` (MINA_CID_CACHE)
   - **Response**: Current Mina data IPFS CID and commitment

6. **`pages/api/get/pinned/getPinnedHistoricalInfo.js`** - Returns historical IPFS data
   - **Auth**: None (public endpoint)
   - **Dependencies**: `InitRedis.js`, `info.js`, `GetHistoricalInfo.js`
   - **Data Flow**: Redis CID → IPFS fetch → Historical price data

7. **`pages/api/get/pinned/getPinnedMinaInfo.js`** - Returns Mina IPFS data
   - **Auth**: None (public endpoint)
   - **Dependencies**: `InitRedis.js`, `info.js`, `GetMinaInfo.ts`
   - **Data Flow**: Redis CID → Mina blockchain state → IPFS data

8. **`pages/api/get/price.js`** - Combined price + proof endpoint with rate limiting
   - **Auth**: Supabase API key validation + call counter increment
   - **Rate Limiting**: 6 requests per 60 seconds per IP
   - **Dependencies**: `InitSupabase.js`, `InitRedis.js`, `IncrementCallCounter.js`, `info.js`, `uuid`
   - **Response**: Combined price data and aggregation proof data

9. **`pages/api/get/user/getKeyStatus.js`** - Validates API keys
   - **Auth**: Bearer token validation against Supabase
   - **Dependencies**: `InitSupabase.js`
   - **Response**: API key validity status

10. **`pages/api/get/user/getUserInformation.js`** - Returns user data (signature verification)
    - **Auth**: Bearer token + signed message verification
    - **Dependencies**: `InitSupabase.js`, `InitSignatureClient.js` (testnet/mainnet)
    - **Signature Verification**: Mina wallet signature with timestamp validation (60min window)
    - **Response**: User profile data from Supabase

11. **`pages/api/get/user/getUserStatus.js`** - Checks if address exists
    - **Auth**: None (public lookup)
    - **Dependencies**: `InitSupabase.js`
    - **Response**: Boolean - whether public key exists in database

#### UPDATE Endpoints (8 files)
All update endpoints require `CRON_SECRET` authentication via Bearer token.

1. **`pages/api/update/core/updateAggregationProof.js`** - Generates ZK proofs for tokens
   - **Dependencies**: `GenerateAggregationProof.js`, `InitRedis.js`, `info.js`
   - **Process**: Cached prices → ZK proof generation → Redis storage
   - **Critical**: Creates recursive ZK proofs for price aggregation

2. **`pages/api/update/core/updateAllPrices.js`** - Updates all token prices (16 providers)
   - **Dependencies**: `InitRedis.js`, `info.js`, `GetPriceOf.js`, `GenerateGraphData.js`, `axios`
   - **Process**: 16 provider APIs → median aggregation → outlier removal → Redis cache
   - **Data Flow**:
     ```
     API Providers → Price Collection → Statistical Processing → Graph Generation → Redis Storage
     ```

3. **`pages/api/update/core/updateMinaPrice.js`** - Updates only MINA price
   - **Dependencies**: Same as updateAllPrices but MINA-only
   - **Process**: Single token price update with graph data generation

4. **`pages/api/update/ipfs/updateHistorical.js`** - Updates historical IPFS data
   - **Dependencies**: `InitRedis.js`, `info.js`, `PinHistorical.js`
   - **Process**: All cached data → Historical object assembly → IPFS pinning → CID update

5. **`pages/api/update/ipfs/updateMina.js`** - Updates Mina IPFS data
   - **Dependencies**: `InitRedis.js`, `info.js`, `PinMinaObject.ts`
   - **Process**: Current cache state → Mina object assembly → IPFS pinning → CID + commitment storage

6. **`pages/api/update/mina/sendMinaStateTxn.js`** - Sends offchain state settlement
   - **Dependencies**: `SendOffchainStateSettlementTxn.ts`
   - **Process**: Offchain state proof generation → Mina L1 settlement transaction

7. **`pages/api/update/mina/sendMinaTxn.js`** - Sends Mina blockchain transaction
   - **Dependencies**: `InitRedis.js`, `info.js`, `GetMinaInfo.ts`, `SendMinaTxn.ts`
   - **Process**: IPFS CID + commitment → Mina smart contract update transaction

8. **`pages/api/update/user/initUser.js`** - Creates new API key for address
   - **Auth**: Bearer token with `NEXT_PUBLIC_API_INTERFACE_KEY`
   - **Dependencies**: `InitSupabase.js`, `uuid`
   - **Process**: Address validation → UUID generation → Supabase insertion

9. **`pages/api/update/user/updateAPIKey.js`** - Regenerates API key
   - **Auth**: Bearer token + user information validation
   - **Dependencies**: `InitSupabase.js`, `uuid`
   - **Process**: Existing key validation → New UUID generation → Database update

#### VERIFY Endpoints (2 files)
1. **`pages/api/verify/verifyAggregated.js`** - Verifies aggregated signatures
   - **Dependencies**: `InitSignatureClient.js`, `info.js` (ORACLE_PUBLIC_KEY)
   - **Process**: Signature verification against oracle public key

2. **`pages/api/verify/verifyIndividual.js`** - Verifies individual provider signatures
   - **Dependencies**: `InitSignatureClient.js`, `o1js` (CircuitString)
   - **Process**: Multi-field signature verification (URL, price, decimals, timestamp)

#### RESET Endpoints (1 file)
1. **`pages/api/reset/resetEveryCache.js`** - Resets all cache and IPFS data
   - **Auth**: CRON_SECRET protected
   - **Dependencies**: `InitRedis.js`, `info.js`, `PinHistorical.js`, `PinMinaObject.ts`, `GetPriceOf.js`
   - **Process**: Complete system reset with fresh price fetching and IPFS pinning

### Core Helper Dependencies Deep Dive

#### **Price Aggregation System (`utils/helper/GetPriceOf.js`)**
- **16 Data Providers**: Binance, CoinGecko, CryptoCompare, CoinPaprika, Messari, CoinCap, CoinLore, CoinCodex, KuCoin, Huobi, ByBit, CexIO, SwapZone, MEXC, Gate.io, OKX, Poloniex, BTSE
- **Statistical Processing**: Median calculation with MAD (Median Absolute Deviation) outlier removal at 2.5 threshold
- **Signature Generation**: Each price signed with Mina signature client for provable data
- **Dependencies**: `CallAndSignAPICalls.js`, `info.js`, `InitSignatureClient.js`, `symbols.js`

#### **API Call System (`utils/helper/CallAndSignAPICalls.js`)**
- **Authentication**: Handles API keys for CMC, CoinAPI, CoinRanking, SwapZone
- **Data Processing**: Float normalization with `MULTIPLICATION_FACTOR` (10^10)
- **Signature Chain**: URL hash + price + decimals + timestamp → Mina signature
- **Dependencies**: `axios`, `lodash`, `o1js` (CircuitString), `InitSignatureClient.js`

#### **ZK Proof System (`utils/helper/AggregationModule.ts`)**
- **Proof Structure**: Recursive ZK proofs for price arrays (max 20 prices)
- **Programs**: Base proof generation and step proof aggregation
- **Cache System**: FileSystem cache for verification keys and compilation artifacts
- **Dependencies**: `o1js`, `LoadCache.ts`

#### **IPFS Management**
- **`PinHistorical.js`**: Historical data with 1-year retention, automatic unpinning
- **`PinMinaObject.ts`**: Current state pinning with commitment generation
- **`GetHistoricalInfo.js`**: IPFS data fetching with timeout (10s)
- **`GetMinaInfo.ts`**: Mina blockchain state + IPFS data correlation

#### **Blockchain Integration**
- **`SendMinaTxn.ts`**: Mina L1 transaction with retry logic and account fetching
- **`SendOffchainStateSettlementTxn.ts`**: Offchain state proof settlement
- **Smart Contract**: `utils/constants/Doot.js` with commitment, IPFS CID, owner state

### Complete Environment Variables Map

#### **Authentication & Security**
- `CRON_SECRET` - Protects all update endpoints
- `NEXT_PUBLIC_API_INTERFACE_KEY` - Interface endpoint authentication
- `DOOT_CALLER_KEY` - Private key for Mina transactions and signatures
- `DOOT_KEY` - Private key for Doot smart contract

#### **Database & Storage**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - Database connection
- `SUPABASE_USER`, `SUPABASE_USER_PASS` - Service account credentials
- `REDIS_REST_HOST`, `REDIS_REST_TOKEN` - Redis cache connection

#### **Blockchain & IPFS**
- `NEXT_PUBLIC_MINA_ENDPOINT` - Mina network RPC
- `NEXT_PUBLIC_DOOT_PUBLIC_KEY` - Smart contract address
- `PINATA_JWT` - IPFS pinning authentication
- `NEXT_PUBLIC_PINATA_GATEWAY` - IPFS gateway URL

#### **External API Keys**
- `CMC_KEY` - CoinMarketCap Pro API
- `COIN_API_KEY` - CoinAPI service
- `COIN_RANKING_KEY` - CoinRanking API
- `SWAP_ZONE_KEY` - SwapZone API

### Data Flow Architecture

#### **Price Update Flow (Every 10 minutes)**
```
External APIs → GetPriceOf.js → Statistical Aggregation → Signature Generation → Redis Cache → Graph Data Generation → IPFS Pinning → Mina Transaction
```

#### **User Authentication Flow**
```
Wallet Signature → Timestamp Validation → Supabase Lookup → API Key Generation → Call Counter Tracking
```

#### **ZK Proof Generation Flow**
```
Cached Prices → Proof Compatibility → AggregationModule → Recursive Proof → Verification → Redis Storage
```

#### **Historical Data Flow**
```
Current Prices → Historical Assembly → 1-Year Retention → IPFS Pinning → Old Data Unpinning → CID Update
```

### Critical Architecture Notes

1. **Rate Limiting**: 6 requests per 60 seconds per IP on public endpoints
2. **Outlier Removal**: MAD-based statistical filtering at 2.5 threshold
3. **Signature Verification**: Multi-network support (testnet/mainnet) for wallet signatures
4. **Cache Management**: Separate Redis keys for prices, proofs, graph data, and IPFS CIDs
5. **IPFS Lifecycle**: Automatic unpinning of old data with 1-year retention
6. **ZK Proof Recursion**: Base proofs + step proofs for scalable aggregation
7. **Error Handling**: Comprehensive try-catch with graceful degradation
8. **Timestamp Validation**: 60-minute window for signature freshness
9. **Data Consistency**: Atomic operations for cache updates and IPFS pinning
10. **Provider Redundancy**: 16 price providers with failure tolerance