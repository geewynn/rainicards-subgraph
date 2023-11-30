import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  Balance,
  RainiCardsNft,
  RainiCardsRegistry,
  Transfer,
} from "../generated/schema";
import { constants } from "./constants";
import { RainiCards } from "../generated/RainiCards/RainiCards";

export function getOrCreateToken(
  registry: RainiCardsRegistry,
  id: BigInt
): RainiCardsNft {
  let tokenid = registry.id.concat("-").concat(id.toString());
  let token = RainiCardsNft.load(tokenid);
  if (!token) {
    token = new RainiCardsNft(tokenid);
    token.registry = registry.id;
    token.identifier = id;
    token.totalSupply = constants.BIGINT_ZERO;
  }
  return token as RainiCardsNft;
}

export function getOrCreateBalance(
  token: RainiCardsNft,
  account: Account
): Balance {
  let balanceid = token.id.concat("-").concat(account.id);
  let balance = Balance.load(balanceid);
  if (!balance) {
    balance = new Balance(balanceid);
    balance.cards = token.id;
    balance.account = account.id;
    balance.value = constants.BIGINT_ZERO;
  }
  return balance as Balance;
}

export function getOrCreateAccount(address: Address): Account {
  let account = new Account(address.toHexString());

  if (!account) {
    account = new Account(address.toHexString());
  }
  account.save();

  return account as Account;
}

export function getOrCreateRegistry(address: Address): RainiCardsRegistry {
  let registry = new RainiCardsRegistry(address.toHexString());
  if (!registry) {
    registry = new RainiCardsRegistry(address.toHexString());
  }
  registry.save();
  return registry as RainiCardsRegistry;
}

export function getOrCreateTransfer(
  event: ethereum.Event,
  suffix: string,
  registry: RainiCardsRegistry,
  operator: Account,
  from: Account,
  to: Account,
  id: BigInt,
  value: BigInt
): void {
  let token = getOrCreateToken(registry, id);
  let contract = RainiCards.bind(event.address);
  let event_id = event.block.number
    .toString()
    .concat("-")
    .concat(event.logIndex.toString());
  let transfer_event = new Transfer(event_id.concat(suffix));
  transfer_event.timestamp = event.block.timestamp;
  transfer_event.cards = token.id;
  transfer_event.operator = operator.id;
  transfer_event.from = from.id;
  transfer_event.to = to.id;
  transfer_event.value = value;

  if (from.id == constants.ADDRESS_ZERO) {
    token.totalSupply = token.totalSupply.plus(value);
  } else {
    let balance = getOrCreateBalance(token, from);
    balance.value = balance.value.minus(value);
    balance.save();
    transfer_event.fromBalance = balance.id;
  }

  if (to.id == constants.ADDRESS_ZERO) {
    token.totalSupply = token.totalSupply.plus(value);
  } else {
    let balance = getOrCreateBalance(token, to);
    balance.value = balance.value.minus(value);
    balance.save();
    transfer_event.toBalance = balance.id;
  }

  let callResult = contract.try_uri(id);
  if (!callResult.reverted) {
    token.URI = callResult.value;
  }

  token.save();
  transfer_event.save();
}
