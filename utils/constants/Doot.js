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
  Experimental,
  Struct,
  Provable,
} from "o1js";
const { OffchainState } = Experimental;
import { MultiPackedStringFactory } from "o1js-pack";
export class TokenInformationArray extends Struct({
  prices: Provable.Array(Field, 10),
}) {}
export const offchainState = OffchainState(
  {
    tokenInformation: OffchainState.Map(Field, TokenInformationArray),
  },
  { maxActionsPerUpdate: 2 }
);
export class TokenInformationArrayProof extends offchainState.Proof {}
export class IpfsCID extends MultiPackedStringFactory(2) {}
// Tokens is the CircuitString.hash().
export class Doot extends SmartContract {
  constructor() {
    super(...arguments);
    this.commitment = State();
    this.ipfsCID = State();
    this.owner = State();
    this.offchainStateCommitments = offchainState.emptyCommitments();
    this.offchainState = offchainState.init(this);
  }
  init() {
    super.init();
  }
  /// Can only be called once
  async initBase(updatedCommitment, updatedIpfsCID, informationArray) {
    this.commitment.getAndRequireEquals();
    this.ipfsCID.getAndRequireEquals();
    this.owner.getAndRequireEquals();
    this.owner.requireEquals(PublicKey.empty());
    this.commitment.set(updatedCommitment);
    this.ipfsCID.set(updatedIpfsCID);
    this.owner.set(this.sender.getAndRequireSignature());
    const lastPriceInformation =
      await this.offchainState.fields.tokenInformation.get(Field(0));
    this.offchainState.fields.tokenInformation.update(Field(0), {
      from: lastPriceInformation,
      to: informationArray,
    });
  }
  async update(updatedCommitment, updatedIpfsCID, informationArray) {
    this.commitment.getAndRequireEquals();
    this.ipfsCID.getAndRequireEquals();
    this.owner.getAndRequireEquals();
    this.owner.requireEquals(this.sender.getAndRequireSignature());
    this.commitment.set(updatedCommitment);
    this.ipfsCID.set(updatedIpfsCID);
    const lastPriceInformation =
      await this.offchainState.fields.tokenInformation.get(Field(0));
    this.offchainState.fields.tokenInformation.update(Field(0), {
      from: lastPriceInformation,
      to: informationArray,
    });
  }
  async getPrices() {
    return (await this.offchainState.fields.tokenInformation.get(Field(0)))
      .value;
  }
  async settle(proof) {
    await this.offchainState.settle(proof);
  }
  async verify(signature, deployer, Price) {
    const validSignature = signature.verify(deployer, [Price]);
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
  [state(IpfsCID), __metadata("design:type", Object)],
  Doot.prototype,
  "ipfsCID",
  void 0
);
__decorate(
  [state(PublicKey), __metadata("design:type", Object)],
  Doot.prototype,
  "owner",
  void 0
);
__decorate(
  [state(OffchainState.Commitments), __metadata("design:type", Object)],
  Doot.prototype,
  "offchainStateCommitments",
  void 0
);
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field, IpfsCID, TokenInformationArray]),
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
    __metadata("design:paramtypes", [Field, IpfsCID, TokenInformationArray]),
    __metadata("design:returntype", Promise),
  ],
  Doot.prototype,
  "update",
  null
);
__decorate(
  [
    method.returns(TokenInformationArray),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise),
  ],
  Doot.prototype,
  "getPrices",
  null
);
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TokenInformationArrayProof]),
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
    __metadata("design:paramtypes", [Signature, PublicKey, Field]),
    __metadata("design:returntype", Promise),
  ],
  Doot.prototype,
  "verify",
  null
);
//# sourceMappingURL=Doot.js.map
