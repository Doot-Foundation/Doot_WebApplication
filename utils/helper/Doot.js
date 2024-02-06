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
  MerkleMapWitness,
  State,
  state,
  PublicKey,
  Signature,
  Poseidon,
} from "o1js";
import { MultiPackedStringFactory } from "o1js-pack";
export class IpfsCID extends MultiPackedStringFactory(2) {}
export class Doot extends SmartContract {
  constructor() {
    super(...arguments);
    /// @notice Merkle Map Root to make sure the values are valid.
    this.commitment = State();
    /// @notice IPFS URL of the off-chain file which holds the asset price info upto the past 2 hours.
    /// @notice The historical data and latest data is separated.
    this.ipfsCID = State();
    this.oraclePublicKey = State();
    this.secretToken = State();
  }
  init() {
    super.init();
    this.oraclePublicKey.set(this.sender);
  }
  updateIndividual(
    keyWitness,
    keyToChange,
    valueBefore,
    valueToChange,
    updatedCID,
    secret
  ) {
    this.oraclePublicKey.getAndRequireEquals();
    this.secretToken.getAndRequireEquals();
    this.commitment.getAndRequireEquals();
    this.ipfsCID.getAndRequireEquals();
    const sentSecret = Poseidon.hash([secret]);
    this.secretToken.assertEquals(sentSecret);
    const [previousCommitment, key] = keyWitness.computeRootAndKey(valueBefore);
    previousCommitment.assertEquals(this.commitment.get());
    key.assertEquals(keyToChange);
    const updatedCommitment = keyWitness.computeRootAndKey(valueToChange)[0];
    this.commitment.set(updatedCommitment);
    this.ipfsCID.set(updatedCID);
  }
  updateBase(updatedCommitment, updatedIpfsCID, secret) {
    this.oraclePublicKey.getAndRequireEquals();
    this.secretToken.getAndRequireEquals();
    this.commitment.getAndRequireEquals();
    this.ipfsCID.getAndRequireEquals();
    const sentSecret = Poseidon.hash([secret]);
    this.secretToken.requireEquals(sentSecret);
    this.commitment.set(updatedCommitment);
    this.ipfsCID.set(updatedIpfsCID);
  }
  initBase(updatedCommitment, updatedIpfsCID, updatedSecret) {
    this.oraclePublicKey.getAndRequireEquals();
    this.secretToken.getAndRequireEquals();
    this.commitment.getAndRequireEquals();
    this.ipfsCID.getAndRequireEquals();
    /// Can only be called once
    this.secretToken.requireEquals(Field.from(0));
    this.commitment.set(updatedCommitment);
    this.ipfsCID.set(updatedIpfsCID);
    this.secretToken.set(Poseidon.hash([updatedSecret]));
  }
  verify(signature, Price) {
    // Get the oracle public key from the contract state
    this.oraclePublicKey.getAndRequireEquals();
    // Evaluate whether the signature is valid for the provided data
    const validSignature = signature.verify(this.oraclePublicKey.get(), [
      Price,
    ]);
    // Check that the signature is valid
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
  "oraclePublicKey",
  void 0
);
__decorate(
  [state(Field), __metadata("design:type", Object)],
  Doot.prototype,
  "secretToken",
  void 0
);
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0),
  ],
  Doot.prototype,
  "init",
  null
);
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [
      MerkleMapWitness,
      Field,
      Field,
      Field,
      IpfsCID,
      Field,
    ]),
    __metadata("design:returntype", void 0),
  ],
  Doot.prototype,
  "updateIndividual",
  null
);
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field, IpfsCID, Field]),
    __metadata("design:returntype", void 0),
  ],
  Doot.prototype,
  "updateBase",
  null
);
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field, IpfsCID, Field]),
    __metadata("design:returntype", void 0),
  ],
  Doot.prototype,
  "initBase",
  null
);
__decorate(
  [
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Signature, Field]),
    __metadata("design:returntype", void 0),
  ],
  Doot.prototype,
  "verify",
  null
);
//# sourceMappingURL=Doot.js.map
