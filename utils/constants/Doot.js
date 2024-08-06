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
  SmartContract,
  Field,
  method,
  State,
  state,
  PublicKey,
  Signature,
  Poseidon,
  Experimental,
  CircuitString,
  Struct,
  Provable,
} from "o1js";
import { MultiPackedStringFactory } from "o1js-pack";
const { OffchainState, OffchainStateCommitments } = Experimental;
export const offchainState = OffchainState({
  prices: OffchainState.Map(Field, Field),
});
export class PriceProof extends offchainState.Proof {}
export class IpfsCID extends MultiPackedStringFactory(2) {}
export class PricesArray extends Struct({
  prices: Provable.Array(Field, 10),
}) {}
export class Doot extends SmartContract {
  constructor() {
    super(...arguments);
    this.commitment = State();
    this.secret = State();
    this.ipfsCID = State();
    this.deployerPublicKey = State();
    this.offchainState = State(OffchainStateCommitments.empty());
  }
  init() {
    super.init();
    this.deployerPublicKey.set(this.sender.getUnconstrained());
  }
  async initBase(
    updatedCommitment,
    updatedIpfsCID,
    pricesArray,
    updatedSecret
  ) {
    this.deployerPublicKey.getAndRequireEquals();
    this.secret.getAndRequireEquals();
    this.commitment.getAndRequireEquals();
    this.ipfsCID.getAndRequireEquals();
    /// Can only be called once
    this.secret.requireEquals(Field.from(0));
    this.commitment.set(updatedCommitment);
    this.ipfsCID.set(updatedIpfsCID);
    let lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Mina").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Mina").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[0],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Bitcoin").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Bitcoin").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[1],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Ethereum").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Ethereum").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[2],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Solana").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Solana").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[3],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Ripple").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Ripple").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[4],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Cardano").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Cardano").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[5],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Avalanche").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Avalanche").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[6],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Polygon").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Polygon").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[7],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Chainlink").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Chainlink").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[8],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Dogecoin").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Dogecoin").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[9],
      }
    );
    this.secret.set(Poseidon.hash([updatedSecret]));
  }
  async update(updatedCommitment, updatedIpfsCID, pricesArray, secret) {
    this.deployerPublicKey.getAndRequireEquals();
    this.secret.getAndRequireEquals();
    this.commitment.getAndRequireEquals();
    this.ipfsCID.getAndRequireEquals();
    const sentSecret = Poseidon.hash([secret]);
    this.secret.requireEquals(sentSecret);
    let lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Mina").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Mina").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[0],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Bitcoin").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Bitcoin").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[1],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Ethereum").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Ethereum").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[2],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Solana").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Solana").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[3],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Ripple").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Ripple").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[4],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Cardano").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Cardano").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[5],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Avalanche").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Avalanche").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[6],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Polygon").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Polygon").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[7],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Chainlink").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Chainlink").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[8],
      }
    );
    lastPriceOption = await offchainState.fields.prices.get(
      CircuitString.fromString("Dogecoin").hash()
    );
    offchainState.fields.prices.update(
      CircuitString.fromString("Dogecoin").hash(),
      {
        from: lastPriceOption,
        to: pricesArray.prices[9],
      }
    );
    this.commitment.set(updatedCommitment);
    this.ipfsCID.set(updatedIpfsCID);
  }
  async getPrice(token) {
    return (await offchainState.fields.prices.get(token.hash())).orElse(0n);
  }
  async settle(proof) {
    await offchainState.settle(proof);
  }
  async verify(signature, Price) {
    this.deployerPublicKey.getAndRequireEquals();
    const validSignature = signature.verify(this.deployerPublicKey.get(), [
      Price,
    ]);
    validSignature.assertTrue();
  }
}
__decorate(
  [state(Field), __metadata("design:type", Object)],
  Doot.prototype,
  "commitment",
  void 0
);
__decorate(
  [state(Field), __metadata("design:type", Object)],
  Doot.prototype,
  "secret",
  void 0
);
__decorate(
  [state(IpfsCID), __metadata("design:type", Object)],
  Doot.prototype,
  "ipfsCID",
  void 0
);
__decorate(
  [state(PublicKey), __metadata("design:type", Object)],
  Doot.prototype,
  "deployerPublicKey",
  void 0
);
__decorate(
  [state(OffchainStateCommitments), __metadata("design:type", Object)],
  Doot.prototype,
  "offchainState",
  void 0
);
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field, IpfsCID, PricesArray, Field]),
    __metadata("design:returntype", Promise),
  ],
  Doot.prototype,
  "initBase",
  null
);
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field, IpfsCID, PricesArray, Field]),
    __metadata("design:returntype", Promise),
  ],
  Doot.prototype,
  "update",
  null
);
__decorate(
  [
    method.returns(Field),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CircuitString]),
    __metadata("design:returntype", Promise),
  ],
  Doot.prototype,
  "getPrice",
  null
);
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PriceProof]),
    __metadata("design:returntype", Promise),
  ],
  Doot.prototype,
  "settle",
  null
);
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Signature, Field]),
    __metadata("design:returntype", Promise),
  ],
  Doot.prototype,
  "verify",
  null
);
//# sourceMappingURL=Doot.js.map
