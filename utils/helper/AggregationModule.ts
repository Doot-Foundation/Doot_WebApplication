import {
  UInt64,
  Mina,
  verify,
  JsonProof,
  Provable,
  Struct,
  ZkProgram,
  SelfProof,
} from "o1js";

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

const AggregationProgram20 = ZkProgram({
  name: "doot-prices-aggregation-program",
  publicInput: PriceAggregationArray20,
  publicOutput: UInt64,

  methods: {
    base: {
      privateInputs: [],

      async method(publicInput: PriceAggregationArray20) {
        return publicInput.pricesArray[0]
          .add(publicInput.pricesArray[1])
          .add(publicInput.pricesArray[2])
          .add(publicInput.pricesArray[3])
          .add(publicInput.pricesArray[4])
          .add(publicInput.pricesArray[5])
          .add(publicInput.pricesArray[6])
          .add(publicInput.pricesArray[7])
          .add(publicInput.pricesArray[8])
          .add(publicInput.pricesArray[9])
          .add(publicInput.pricesArray[10])
          .add(publicInput.pricesArray[11])
          .add(publicInput.pricesArray[12])
          .add(publicInput.pricesArray[13])
          .add(publicInput.pricesArray[14])
          .add(publicInput.pricesArray[15])
          .add(publicInput.pricesArray[16])
          .add(publicInput.pricesArray[17])
          .add(publicInput.pricesArray[18])
          .add(publicInput.pricesArray[19])
          .div(publicInput.count);
      },
    },
    generateAggregationProof: {
      privateInputs: [SelfProof],

      async method(
        publicInput: PriceAggregationArray20,
        privateInput: SelfProof<PriceAggregationArray20, UInt64>
      ) {
        privateInput.verify();

        return publicInput.pricesArray[0]
          .add(publicInput.pricesArray[1])
          .add(publicInput.pricesArray[2])
          .add(publicInput.pricesArray[3])
          .add(publicInput.pricesArray[4])
          .add(publicInput.pricesArray[5])
          .add(publicInput.pricesArray[6])
          .add(publicInput.pricesArray[7])
          .add(publicInput.pricesArray[8])
          .add(publicInput.pricesArray[9])
          .add(publicInput.pricesArray[10])
          .add(publicInput.pricesArray[11])
          .add(publicInput.pricesArray[12])
          .add(publicInput.pricesArray[13])
          .add(publicInput.pricesArray[14])
          .add(publicInput.pricesArray[15])
          .add(publicInput.pricesArray[16])
          .add(publicInput.pricesArray[17])
          .add(publicInput.pricesArray[18])
          .add(publicInput.pricesArray[19])
          .div(publicInput.count);
      },
    },
  },
});

class AggregationProof20 extends ZkProgram.Proof(AggregationProgram20) {}

async function generateUInt64Array(
  prices: bigint[]
): Promise<[UInt64[], UInt64]> {
  let UInt64Prices: UInt64[] = prices.map((price) => UInt64.from(price));

  while (UInt64Prices.length < 20) {
    UInt64Prices.push(UInt64.from(0));
  }
  if (UInt64Prices.length > 20) {
    UInt64Prices = UInt64Prices.slice(0, 20);
  }

  const count = UInt64.from(Math.min(prices.length, 20));

  return [UInt64Prices, count];
}

function convertToJsonProof(jsonObject: any): JsonProof {
  return {
    publicInput: jsonObject.publicInput.map(String),
    publicOutput: jsonObject.publicOutput.map(String),
    maxProofsVerified: jsonObject.maxProofsVerified as 0 | 1 | 2,
    proof: jsonObject.proof, // Assuming proof is an object
  };
}

/// AGGREGATION OF WHOLE PRICES WITHOUT PRECISION (Indirect precision of 10 by multiplying the original values by 10**10).
async function AggregationModule(
  prices: bigint[],
  lastAvailableProofStr: string,
  isBase: boolean
): Promise<[JsonProof | null, bigint]> {
  if (!prices.every((price) => typeof price === "bigint")) {
    throw new Error("All prices must be bigint");
  }

  let Local = await Mina.LocalBlockchain({ proofsEnabled: false });
  Mina.setActiveInstance(Local);
  const { verificationKey: vk20 } = await AggregationProgram20.compile();

  const lastAvailableProof: JsonProof = convertToJsonProof(
    JSON.parse(lastAvailableProofStr)
  );
  const compatibleResults = await generateUInt64Array(prices);

  const input20 = new PriceAggregationArray20({
    pricesArray: compatibleResults[0],
    count: compatibleResults[1],
  });

  if (!isBase) {
    const compatibleLastAvailableProof = await AggregationProof20.fromJSON(
      lastAvailableProof
    );
    let proof20 = await AggregationProgram20.generateAggregationProof(
      input20,
      compatibleLastAvailableProof
    );
    console.log("Step Proof20 Generated.");

    proof20 satisfies AggregationProof20;
    console.log("Step Proof20 Sanity Check.");

    const valid20 = await verify(proof20.toJSON(), vk20);

    if (!valid20) {
      console.log("\nERR! VALID 20 FAILED.\n");
      return [null, BigInt(0)];
    } else {
      console.log("Proof verified against VK.");
      return [proof20.toJSON(), proof20.publicOutput.toBigInt()];
    }
  } else {
    let proof20 = await AggregationProgram20.base(input20);
    console.log("Base Proof20 Generated.");

    proof20 satisfies AggregationProof20;
    console.log("Base Proof20 Sanity Check.");

    const valid20 = await verify(proof20.toJSON(), vk20);

    if (!valid20) {
      console.log("\nERR! VALID 20 FAILED.\n");
      return [null, BigInt(0)];
    } else {
      console.log("Proof verified against VK.");
      return [proof20.toJSON(), proof20.publicOutput.toBigInt()];
    }
  }
}

module.exports = { AggregationModule };
