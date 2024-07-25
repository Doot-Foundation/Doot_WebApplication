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
export class PriceAggregationArray extends Struct({
  pricesArray: Provable.Array(UInt64, 10),
}) {}
export const AggregationProgram = ZkProgram({
  name: "doot-prices-aggregation-program",
  publicInput: PriceAggregationArray,
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
          .div(10);
      },
    },
  },
});
export class AggregationProof extends ZkProgram.Proof(AggregationProgram) {}
export class VerifyAggregationProofGenerated extends SmartContract {
  init() {
    super.init();
  }
  async verifyAggregationProof(proof) {
    proof.verify();
  }
}
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AggregationProof]),
    __metadata("design:returntype", Promise),
  ],
  VerifyAggregationProofGenerated.prototype,
  "verifyAggregationProof",
  null
);
//# sourceMappingURL=Aggregation.js.map
