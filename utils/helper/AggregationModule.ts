import {
  UInt64,
  Mina,
  verify,
  Provable,
  Struct,
  ZkProgram,
  SelfProof,
  JsonProof,
} from "o1js";
import { FileSystem, fetchAggregationFiles } from "@/utils/helper/LoadCache";

class PriceAggregationArray20 extends Struct({
  pricesArray: Provable.Array(UInt64, 20),
  count: UInt64,
}) {
  constructor(value: { pricesArray: UInt64[]; count: UInt64 }) {
    super(value);
    // Ensure the array has exactly 20 elements
    while (value.pricesArray.length < 20) {
      value.pricesArray.push(UInt64.from(0));
    }
    if (value.pricesArray.length > 20) {
      value.pricesArray = value.pricesArray.slice(0, 20);
    }
  }
}

export const AggregationProgram20 = ZkProgram({
  name: "doot-prices-aggregation-program20",
  publicInput: PriceAggregationArray20,
  publicOutput: UInt64,

  methods: {
    base: {
      privateInputs: [],

      async method(publicInput: PriceAggregationArray20) {
        let currentSum: UInt64 = UInt64.from(0);
        for (let i = 0; i < 20; i++) {
          currentSum = currentSum.add(publicInput.pricesArray[i]);
        }

        return { publicOutput: currentSum.div(publicInput.count) };
      },
    },
    generateAggregationProof: {
      privateInputs: [SelfProof],

      async method(
        publicInput: PriceAggregationArray20,
        privateInput: SelfProof<PriceAggregationArray20, UInt64>
      ) {
        privateInput.verify();

        let currentSum: UInt64 = UInt64.from(0);
        for (let i = 0; i < 20; i++) {
          currentSum = currentSum.add(publicInput.pricesArray[i]);
        }

        return { publicOutput: currentSum.div(publicInput.count) };
      },
    },
  },
});

export class AggregationProof20 extends ZkProgram.Proof(AggregationProgram20) {}

async function generateUInt64Array(
  prices: bigint[]
): Promise<[UInt64[], UInt64]> {
  const normalizedPrices = prices
    .slice(0, 20)
    .map((price) => UInt64.from(price));
  const paddedPrices = [
    ...normalizedPrices,
    ...Array(20 - normalizedPrices.length).fill(UInt64.from(0)),
  ];
  return [paddedPrices, UInt64.from(Math.min(prices.length, 20))];
}

function convertToJsonProof(jsonObject: any): JsonProof {
  return {
    publicInput: jsonObject.publicInput.map(String),
    publicOutput: jsonObject.publicOutput.map(String),
    maxProofsVerified: jsonObject.maxProofsVerified as 0 | 1 | 2,
    proof: jsonObject.proof,
  };
}

/// AGGREGATION OF WHOLE PRICES WITHOUT PRECISION (Indirect precision of 10 by multiplying the original values by 10**10).
async function AggregationModule(
  prices: bigint[],
  lastAvailableProofStr: string,
  isBase: boolean
): Promise<[JsonProof | null, bigint]> {
  try {
    if (!prices.every((price) => typeof price === "bigint")) {
      throw new Error("All prices must be bigint");
    }

    const [Local, cacheFiles, compatibleResults] = await Promise.all([
      Mina.LocalBlockchain({ proofsEnabled: false }),
      fetchAggregationFiles(),
      generateUInt64Array(prices),
    ]);

    Mina.setActiveInstance(Local);

    const [{ verificationKey: vk20 }, input20] = await Promise.all([
      AggregationProgram20.compile({ cache: FileSystem(cacheFiles) }),
      Promise.resolve(
        new PriceAggregationArray20({
          pricesArray: compatibleResults[0],
          count: compatibleResults[1],
        })
      ),
    ]);

    const proof20 = isBase
      ? await AggregationProgram20.base(input20)
      : await AggregationProgram20.generateAggregationProof(
          input20,
          await AggregationProof20.fromJSON(
            convertToJsonProof(JSON.parse(lastAvailableProofStr))
          )
        );

    console.log(`${isBase ? "Base" : "Step"} Proof20 Generated and checked.`);

    const valid20 = await verify(proof20.proof.toJSON(), vk20);
    if (!valid20) {
      console.error("\nERR! VALID 20 FAILED.\n");
      return [null, BigInt(0)];
    }

    console.log("Proof verified against VK.");
    return [proof20.proof.toJSON(), proof20.proof.publicOutput.toBigInt()];
  } catch (error) {
    console.error(
      "Aggregation module failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return [null, BigInt(0)];
  }
}

module.exports = { AggregationModule };
