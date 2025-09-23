# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Doot is a data feed oracle for Mina Protocol that provides price updates every 10 minutes with aggregation proofs. The application tracks 10 cryptocurrency tokens (MINA, BTC, ETH, SOL, XRP, ADA, AVAX, MATIC, LINK, DOGE) and is built as a Next.js web application with blockchain integration.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:fast` - Fast build for development (sets FAST_BUILD=1)
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
- **Historical Data**: Updated every 10 minutes (5-59/10 schedule), stores 1 year of data
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
  - Historical data: Every 10 minutes starting at 5 minutes (`5-59/10 * * * *`)
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

## Professional Price Chart System

### Timeframe Aggregation Architecture
The application implements professional-grade timeframe aggregation following industry standards (TradingView, CoinGecko, Binance patterns).

#### **Core Aggregation Logic**
- **Base Interval**: 10-minute price data collection
- **Aggregation Method**: Mathematical point selection (every Nth data point)
- **Pure Functions**: Stateless, testable aggregation algorithms

#### **Timeframe Configuration (`utils/helper/TimeframeConfig.js`)**
```javascript
const TIMEFRAME_INTERVALS = {
  '10min': 10,    // No aggregation - all data points
  '30min': 30,    // Every 3rd point (30 ÷ 10 = 3)
  '1h': 60,       // Every 6th point (60 ÷ 10 = 6)
  '6h': 360,      // Every 36th point (360 ÷ 10 = 36)
  '24h': 1440,    // Every 144th point (1440 ÷ 10 = 144)
  'all': null     // No aggregation - complete dataset
};
```

#### **Data Flow Pipeline**
```
Raw 10min Data → Timeframe Selection → Aggregation Logic → Chart Rendering
     ↓                    ↓                    ↓               ↓
   144 points        User clicks "1h"    Every 6th point   25 points displayed
```

#### **Aggregation Engine (`utils/helper/AggregateTimeframeData.js`)**
- **Statistical Processing**: Maintains chronological order with defensive sorting
- **Edge Case Handling**: Single data points, invalid intervals, empty datasets
- **Performance**: O(n) time complexity with single-pass processing
- **Precision**: Preserves first/last data points for accurate time boundaries

### X-Axis Time Label System

#### **Timezone-Aware Formatting (`utils/helper/TimeAxisFormatter.js`)**
- **Universal Compatibility**: Auto-detects timestamp format (milliseconds vs seconds)
- **Locale Support**: Uses `Intl.DateTimeFormat` for international users
- **No Hardcoded Timezones**: Respects user's browser/system timezone

#### **Intelligent Label Density Control**
**Timeframe-Based Format Selection**:
```javascript
// Short timeframes (10min-6h): Hour:Minute format + High density
'10min': { format: { hour: '2-digit', minute: '2-digit' }, maxLabels: 14 }

// Medium timeframes (12h-24h): Day/Month Hour:Minute format
'12h': { format: 'dayNumericMonthTime', maxLabels: 6 } // "23/09 14:30"

// Large timeframes (7d+): Day/Month format
'7d': { format: 'dayNumericMonth', maxLabels: 8 } // "23/09"
```

#### **Recharts Integration**
- **Explicit Tick Control**: Generates precise tick positions to override Recharts defaults
- **Gap Prevention**: Fixed algorithm ensures continuous time progression
- **Visual Spacing**: 10px offset (`dy: 10`) for optimal label readability

#### **Label Format Examples**
- **10MIN**: `14:30, 15:40, 16:50` (14+ time labels)
- **30MIN**: `14:30, 16:00, 17:30` (12+ time labels)
- **12H/24H**: `22/09 14:30, 23/09 02:15` (date + time)
- **7D+**: `22/09, 25/09, 28/09` (date only)

### Chart Component Architecture (`pages/components/feeds/PriceGraph.js`)

#### **Integration Pattern**
```javascript
// Timeframe-aware aggregation
const interval = getIntervalForTimeframe(timeframe);
const data = interval ? aggregateDataByTimeframe(graphData, interval) : graphData;

// Timezone-aware time formatting
const timeFormatter = createXAxisTickFormatter(data, timeframe);
const smartLabels = generateSmartTimeLabels(data, timeframe);
const explicitTicks = smartLabels.ticks.map(tick => tick.timestamp);

// Recharts configuration
<XAxis ticks={explicitTicks} tickFormatter={timeFormatter} />
```

#### **Performance Optimizations**
- **Cached Calculations**: Min/max price calculations during aggregation
- **Efficient Rendering**: Only specified tick positions rendered
- **Memory Management**: Pure functions prevent memory leaks in chart updates

### Data Consistency & Validation

#### **Timestamp Handling**
- **Format Detection**: Automatic millisecond vs second timestamp detection
- **Timezone Conversion**: Backend US-East → User local timezone
- **Chronological Integrity**: Defensive sorting ensures proper time sequence

#### **Price Data Integrity**
- **Aggregation Validation**: Preserves statistical properties (min/max ranges)
- **Outlier Handling**: MAD-based statistical filtering at provider level
- **Precision Maintenance**: Proper decimal handling for sub-dollar cryptocurrencies

## Recent Major Enhancements (September 2025)

### **Professional Timeframe Aggregation System**
**Problem Solved**: Replaced broken time-range filtering with industry-standard aggregation
**Files Created/Modified**:
- `utils/helper/AggregateTimeframeData.js` - Pure aggregation engine
- `utils/helper/TimeframeConfig.js` - Timeframe-to-interval mappings
- `utils/helper/TimeAxisFormatter.js` - Timezone-aware time formatting
- `pages/components/feeds/PriceGraph.js` - Chart integration
- `pages/components/feeds/IndividualAsset.js` - Data flow integration

**Key Technical Decisions**:
- Mathematical point selection vs time-range filtering
- Pure, stateless functions for testability
- Timezone-agnostic design for global users
- Recharts explicit tick control to prevent UI framework overrides

### **Critical Implementation Notes**

#### **Timestamp Format Handling**
```javascript
// CRITICAL: Backend uses Date.now() (milliseconds), not Unix seconds
const aggregatedAt = Date.now(); // in GetPriceOf.js line 389

// TimeAxisFormatter auto-detects format:
const isMilliseconds = timestamp > 1e12;
return new Date(isMilliseconds ? timestamp : timestamp * 1000);
```

#### **Recharts Override Prevention**
```javascript
// CRITICAL: Must use explicit ticks to prevent Recharts interval override
const explicitTicks = smartLabels.ticks.map(tick => tick.timestamp);
<XAxis ticks={explicitTicks} tickFormatter={timeFormatter} />
// DO NOT use interval="preserveStartEnd" - it overrides our tick logic
```

#### **Aggregation Algorithm Fix**
```javascript
// FIXED: Previous gap issue in tick positioning
// OLD (buggy): for (let i = step; i < data.length - step; i += step)
// NEW (fixed): for (let i = step; i < data.length - 1; i += step)
```

### **Development Workflow Recommendations**

#### **When Modifying Chart System**
1. **Test aggregation**: Run `node -e "require('./utils/helper/AggregateTimeframeData.js')..."`
2. **Test time formatting**: Check all timeframes with realistic data spans
3. **Verify timezone handling**: Test with different browser timezone settings
4. **Check Recharts integration**: Ensure explicit ticks override default intervals

#### **Common Pitfalls to Avoid**
- **Never hardcode timezones** - use `Intl.DateTimeFormat` with `timeZone: undefined`
- **Never assume Unix seconds** - timestamps may be milliseconds or seconds
- **Never rely on Recharts auto-intervals** - always provide explicit ticks
- **Never break aggregation purity** - keep functions stateless and testable

### **Key File Relationships**

#### **Data Flow Chain**
```
API (GetPriceOf.js) → Redis Cache → IndividualAsset.js → TimeframeConfig.js →
AggregateTimeframeData.js → PriceGraph.js → TimeAxisFormatter.js → Recharts
```

#### **Import Dependencies**
- `PriceGraph.js` requires: `TimeAxisFormatter.js`
- `IndividualAsset.js` requires: `TimeframeConfig.js`, `AggregateTimeframeData.js`
- All modules are pure functions - no circular dependencies

### **Testing & Verification Commands**
```bash
# Essential verification commands
npm run check-types  # TypeScript validation
npm run lint         # Code quality

# Manual testing pattern for chart changes
node -e "const { aggregateDataByTimeframe } = require('./utils/helper/AggregateTimeframeData.js'); /* test code */"
```

## Complete Technical Dependency Analysis (DFS-Style Investigation)

### API Endpoint Architecture Overview

**Total Endpoints**: 22 files across 5 functional categories with comprehensive dependency tracing
**Analysis Method**: Depth-First Search (DFS) through import chains to map complete technical dependencies

### Core Dependency Clusters (Shared Infrastructure)

#### 1. **Core Infrastructure Cluster** (Universal Dependencies)
- **Primary Components**: `InitRedis.js`, `info.js`
- **Usage Pattern**: Required by all 22 endpoints
- **Dependency Chain**:
  ```
  All API Endpoints → InitRedis.js → @upstash/redis → Redis Cloud Instance
                   → info.js → symbols.js → Provider Symbol Mappings
  ```
- **Critical Constants**: 40+ cache keys, 16 provider symbol mappings, multiplication factor (10^10)

#### 2. **Authentication & User Management Cluster**
- **Primary Components**: `InitSupabase.js`, `IncrementCallCounter.js`, `InitSignatureClient.js`
- **Usage Pattern**: 6 endpoints (user endpoints + rate-limited public endpoints)
- **Dependency Chain**:
  ```
  User Endpoints → InitSupabase.js → @supabase/supabase-js → Database
                → IncrementCallCounter.js → Redis Counter → Rate Limiting
                → InitSignatureClient.js → mina-signer → Signature Verification
  ```
- **Security Layer**: API key validation + signature verification + call counting

#### 3. **Price Aggregation & Statistical Processing Cluster**
- **Primary Components**: `GetPriceOf.js`, `CallAndSignAPICalls.js`, `GenerateGraphData.js`
- **Usage Pattern**: 3 core update endpoints
- **Deep Dependency Analysis**:
  ```
  UpdateAllPrices → GetPriceOf.js → CallAndSignAPICalls.js → axios + lodash
                                  → symbols.js → 16 Provider Mappings
                                  → InitSignatureClient.js → o1js (CircuitString)
                                  → Statistical Functions (median, MAD)
                  → GenerateGraphData.js → Mathematical Processing
  ```
- **Data Flow**: 16 providers → parallel API calls → outlier removal (MAD 2.5σ) → median calculation → signature generation

#### 4. **Zero-Knowledge Proof Generation Cluster**
- **Primary Components**: `AggregationModule.ts`, `GenerateAggregationProof.js`, `LoadCache.ts`
- **Usage Pattern**: 2 endpoints (proof generation + verification)
- **Complex Dependency Chain**:
  ```
  UpdateAggregationProof → GenerateAggregationProof.js → AggregationModule.ts
                                                        → o1js (ZkProgram, verify)
                                                        → LoadCache.ts → FileSystem cache
                                                        → PriceAggregationArray20 structure
  ```
- **Technical Specifics**: Recursive ZK proofs, max 20 prices per proof, base + step proof architecture

#### 5. **IPFS & Blockchain Integration Cluster**
- **Primary Components**: `PinMinaObject.ts`, `PinHistorical.js`, `SendMinaTxn.ts`
- **Usage Pattern**: 4 endpoints (IPFS operations + blockchain transactions)
- **Interconnected Dependencies**:
  ```
  IPFS Updates → PinMinaObject.ts → o1js (MerkleMap, Field) → Commitment Generation
                                  → Unpin.js → Automatic Cleanup
               → PinHistorical.js → 1-year retention logic → Old data unpinning

  Blockchain → SendMinaTxn.ts → GetMinaInfo.ts → o1js (PrivateKey, PublicKey)
                             → Doot.js (Smart Contract) → Account Management
  ```

### Critical Dependency Paths & Data Flow Patterns

#### **Path 1: Price Update Flow** (Every 10 minutes)
```
Vercel CRON → UpdateAllPrices.js
           → GetPriceOf.js → 16 Parallel API Calls
                          → CallAndSignAPICalls.js → Provider-specific auth
                                                   → axios HTTP requests
                                                   → Signature generation (4-field)
           → Statistical Processing → Median + MAD outlier removal
           → Redis Cache Storage → Multiple cache keys per token
           → GenerateGraphData.js → Historical analysis + percentage calculations
```

#### **Path 2: ZK Proof Generation Flow** (On-demand)
```
UpdateAggregationProof.js → Redis Cache Retrieval
                         → Price Validation (BigInt conversion)
                         → AggregationModule.ts → FileSystem cache loading
                                                → o1js program compilation
                                                → Base/Step proof generation
                                                → Verification against VK
                         → Redis Proof Storage → JSON-compatible format
```

#### **Path 3: IPFS Pinning Flow** (Every 10 minutes)
```
UpdateMina.js → Cache Aggregation → All token data retrieval
             → PinMinaObject.ts → MerkleMap construction
                               → Commitment calculation
                               → Pinata API upload
                               → Previous CID unpinning
             → Redis CID Update → New commitment storage
```

#### **Path 4: Blockchain Transaction Flow** (Manual trigger)
```
SendMinaTxn.js → GetMinaInfo.ts → IPFS data correlation
              → Account fetching → Nonce management
              → Doot.js contract → Update method call
              → Transaction signing → Private key usage
              → Broadcast to Mina network
```

#### **Path 5: User Authentication Flow**
```
User Endpoints → InitSupabase.js → Database connection
              → Signature verification → Timestamp validation (60min window)
                                     → Public key validation
              → IncrementCallCounter.js → Rate limiting logic
              → API key generation → UUID-based keys
```

### Advanced Technical Implementation Details

#### **Statistical Processing Pipeline**
- **Algorithm**: Median Absolute Deviation (MAD) with 2.5σ threshold
- **Implementation**: Single-pass array processing for performance
- **Outlier Logic**: `|value - median| <= 2.5 * MAD(array)`
- **Performance**: Parallel Promise.all() for 16 provider calls

#### **ZK Proof Architecture**
- **Structure**: `PriceAggregationArray20` with fixed 20-element array
- **Padding**: Automatic zero-padding for arrays < 20 elements
- **Recursion**: Base proofs + step proofs for scalable aggregation
- **Verification**: On-chain verification key validation

#### **IPFS Data Management**
- **MerkleMap**: 10 assets mapped to commitment root
- **Witness Generation**: Parallel witness creation for all assets
- **Lifecycle**: Automatic unpinning with 1-year retention
- **Metadata**: Timestamp-based naming for version tracking

#### **Signature Generation System**
- **Multi-field**: URL hash + price + decimals + timestamp
- **Circuit Integration**: o1js CircuitString for hash generation
- **Key Management**: Environment-based private key storage
- **Format**: JSON-compatible BigInt serialization

### Authentication & Authorization Patterns

#### **Pattern 1: CRON Protection** (8 endpoints)
```
Bearer Token → CRON_SECRET validation → Update operations
```

#### **Pattern 2: API Key Validation** (2 endpoints)
```
Supabase Query → API key existence check → Call counter increment
```

#### **Pattern 3: Interface Authentication** (4 endpoints)
```
Bearer Token → NEXT_PUBLIC_API_INTERFACE_KEY → Interface access
```

#### **Pattern 4: Signature Verification** (1 endpoint)
```
Bearer + Signature → Mina signature validation → Timestamp verification → User data access
```

#### **Pattern 5: Public Access** (7 endpoints)
```
No authentication → Direct data access → Cached responses
```

### Performance & Optimization Strategies

#### **Caching Strategy**
- **Multi-layer**: Redis primary + FileSystem secondary (ZK cache)
- **Key Separation**: Prices, proofs, graph data, CIDs use distinct keys
- **TTL Management**: Automatic expiration + manual cleanup

#### **Parallel Processing**
- **API Calls**: Promise.all() for 16 concurrent provider requests
- **Array Operations**: Single-pass processing with reduce()
- **IPFS Operations**: Parallel upload + unpinning

#### **Error Handling**
- **Graceful Degradation**: Default "0" values for failed providers
- **Retry Logic**: Built into individual provider calls
- **Validation**: BigInt type checking + NaN filtering

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