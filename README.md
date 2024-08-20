# Doot

Doot is a data feed oracle for Mina Protocol.
The branch handles updates aligned with Mainnet Upgrade 04/06/24.

## Current State

1. Price Updates - Every 10 minutes.
2. Aggregation Proofs - Done.
3. Tokens Tracked - 10

## Upcoming

1.  Provable fetches - [zkNotary](https://github.com/vixuslabs/zkNotary) or [ZKON](https://github.com/ZKON-Network).
    - zkNotary works as intended and I am able to generate the proofs for fetches.
      The catch is one such proof takes about 5 minute. We call 13 data providers and for each asset that would mean `5x13 = 65 minutes` of computational time. And the total computational time required for all assets combined (per one iteration) is `10x65=650 minutes`. While this can we optimized, the cost of running such provable infrastructure is way too high and not possible at the moment.
    - ZKON - To be updated.
2.  Increase total tokens tracked to upto 20. Now if the rate limit allows, we will continue with 10 minute updates but if it doesn't we might need to increase the interval time from 10 to 20 minutes.
3.  Increase historical information to span upto 31 days.
4.  Create a separate mina module that is updated each minute without the aggregation proofs.
5.  Barter Swap.
6.  Whitepaper.
