var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
import {
  UInt64,
  Provable,
  Struct,
  ZkProgram,
  SelfProof,
  SmartContract,
  method,
} from "o1js";
export class PriceAggregationArray20 extends Struct({
  pricesArray: Provable.Array(UInt64, 20),
  count: UInt64,
}) {
  constructor(value) {
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
      async method(publicInput) {
        return UInt64.from(0);
      },
    },
    generateAggregationProof: {
      privateInputs: [SelfProof],
      async method(publicInput, privateInput) {
        privateInput.verify();
        let currentSum = UInt64.from(0);
        for (let i = 0; i < 20; i++) {
          currentSum = currentSum.add(publicInput.pricesArray[i]);
        }
        return currentSum.div(publicInput.count);
      },
    },
  },
});
export class PriceAggregationArray100 extends Struct({
  pricesArray: Provable.Array(UInt64, 100),
  count: UInt64,
}) {}
export const AggregationProgram100 = ZkProgram({
  name: "doot-prices-aggregation-program100",
  publicInput: PriceAggregationArray100,
  publicOutput: UInt64,
  methods: {
    base: {
      privateInputs: [],
      async method(publicInput) {
        return UInt64.from(0);
      },
    },
    generateAggregationProof: {
      privateInputs: [SelfProof],
      async method(publicInput, privateInput) {
        privateInput.verify();
        let currentSum = UInt64.from(0);
        for (let i = 0; i < 100; i++) {
          currentSum = currentSum.add(publicInput.pricesArray[i]);
        }
        return currentSum.div(publicInput.count);
      },
    },
  },
});
export class AggregationProof20 extends ZkProgram.Proof(AggregationProgram20) {}
export class AggregationProof100 extends ZkProgram.Proof(
  AggregationProgram100
) {}
await AggregationProgram100.compile();
await AggregationProgram20.compile();
export class VerifyAggregationProofGenerated extends SmartContract {
  init() {
    super.init();
  }
  async verifyAggregationProof20(proof) {
    proof.verify();
  }
  async verifyAggregationProof100(proof) {
    proof.verify();
  }
}
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AggregationProof20]),
    __metadata("design:returntype", Promise),
  ],
  VerifyAggregationProofGenerated.prototype,
  "verifyAggregationProof20",
  null
);
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AggregationProof100]),
    __metadata("design:returntype", Promise),
  ],
  VerifyAggregationProofGenerated.prototype,
  "verifyAggregationProof100",
  null
);
//# sourceMappingURL=Aggregation.js.map
