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
  UInt64,
  Option,
} from 'o1js';
const { OffchainState } = Experimental;
import { MultiPackedStringFactory } from 'o1js-pack';

// lastUpdatedAt uses wall-clock milliseconds; priceSeq is a strictly increasing counter.
export class TokenInformationArray extends Struct({
  prices: Provable.Array(Field, 10),
  lastUpdatedAt: UInt64,
  priceSeq: UInt64,
}) {}

// Input shape supplied by callers; contract derives sequence internally.
export class TokenInformationArrayInput extends Struct({
  prices: Provable.Array(Field, 10),
  lastUpdatedAt: UInt64,
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
  @state(Field) commitment = State<Field>();
  @state(IpfsCID) ipfsCID = State<IpfsCID>();
  @state(PublicKey) owner = State<PublicKey>();
  @state(OffchainState.Commitments) offchainStateCommitments =
    offchainState.emptyCommitments();

  init() {
    super.init();
  }

  offchainState = offchainState.init(this);

  /// Can only be called once
  @method async initBase(
    updatedCommitment: Field,
    updatedIpfsCID: IpfsCID,
    informationArray: TokenInformationArrayInput
  ) {
    this.commitment.getAndRequireEquals();
    this.ipfsCID.getAndRequireEquals();
    this.owner.getAndRequireEquals();

    this.owner.requireEquals(PublicKey.empty());

    this.commitment.set(updatedCommitment);
    this.ipfsCID.set(updatedIpfsCID);
    this.owner.set(this.sender.getAndRequireSignature());

    const lastPriceInformation =
      await this.offchainState.fields.tokenInformation.get(Field(0));

    const nextInformation = this.buildTokenInformation(
      informationArray,
      lastPriceInformation
    );

    this.offchainState.fields.tokenInformation.update(Field(0), {
      from: lastPriceInformation,
      to: nextInformation,
    });
  }

  @method async update(
    updatedCommitment: Field,
    updatedIpfsCID: IpfsCID,
    informationArray: TokenInformationArrayInput
  ) {
    this.commitment.getAndRequireEquals();
    this.ipfsCID.getAndRequireEquals();
    this.owner.getAndRequireEquals();

    this.owner.requireEquals(this.sender.getAndRequireSignature());

    this.commitment.set(updatedCommitment);
    this.ipfsCID.set(updatedIpfsCID);

    const lastPriceInformation =
      await this.offchainState.fields.tokenInformation.get(Field(0));

    const nextInformation = this.buildTokenInformation(
      informationArray,
      lastPriceInformation
    );

    this.offchainState.fields.tokenInformation.update(Field(0), {
      from: lastPriceInformation,
      to: nextInformation,
    });
  }

  private buildTokenInformation(
    input: TokenInformationArrayInput,
    previous: Option<TokenInformationArray>
  ) {
    const previousTimestamp = Provable.if(
      previous.isSome,
      previous.value.lastUpdatedAt,
      UInt64.zero
    );
    const previousSeq = Provable.if(
      previous.isSome,
      previous.value.priceSeq,
      UInt64.zero
    );

    input.lastUpdatedAt.assertGreaterThan(
      previousTimestamp,
      'timestamp must increase'
    );
    const nextTimestamp = input.lastUpdatedAt;
    const nextSeq = previousSeq.add(UInt64.one);

    nextSeq.assertGreaterThan(previousSeq, 'priceSeq must increase');

    return new TokenInformationArray({
      prices: input.prices,
      lastUpdatedAt: nextTimestamp,
      priceSeq: nextSeq,
    });
  }

  @method.returns(TokenInformationArray)
  async getPrices() {
    return (await this.offchainState.fields.tokenInformation.get(Field(0)))
      .value;
  }

  @method async verifyPriceBundleSignature(
    signature: Signature,
    payload: TokenInformationArray
  ) {
    const owner = this.owner.getAndRequireEquals();
    const messageFields = [
      payload.priceSeq.value,
      payload.lastUpdatedAt.value,
      ...payload.prices,
    ];
    signature.verify(owner, messageFields).assertTrue();
  }

  @method
  async settle(proof: TokenInformationArrayProof) {
    await this.offchainState.settle(proof);
  }

  @method async verify(
    signature: Signature,
    deployer: PublicKey,
    Price: Field
  ) {
    const validSignature = signature.verify(deployer, [Price]);
    validSignature.assertTrue();
  }
}
