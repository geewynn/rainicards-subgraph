import {
  TransferBatch as TransferBatchEvent,
  TransferSingle as TransferSingleEvent,
  URI as URIEvent,
} from "../generated/RainiCards/RainiCards";
import { RainiCardsRegistry } from "../generated/schema";
import {
  getOrCreateToken,
  getOrCreateAccount,
  getOrCreateTransfer,
  getOrCreateRegistry,
} from "./helper";

export function handleTransferSingle(event: TransferSingleEvent): void {
  let registry = getOrCreateRegistry(event.address);
  let token = getOrCreateToken(registry, event.params.id);
  let operator = getOrCreateAccount(event.params.operator);
  let from = getOrCreateAccount(event.params.from);
  let to = getOrCreateAccount(event.params.to);
  token.save();
  registry.save();
  operator.save();
  from.save();
  to.save();

  getOrCreateTransfer(
    event,
    "",
    registry,
    operator,
    from,
    to,
    event.params.id,
    event.params.value
  );
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  let registry = getOrCreateRegistry(event.address);
  let operator = getOrCreateAccount(event.params.operator);
  let from = getOrCreateAccount(event.params.from);
  let to = getOrCreateAccount(event.params.to);
  registry.save();
  operator.save();
  from.save();
  to.save();

  let ids = event.params.ids;
  let values = event.params.values;
  for (let i = 0; i < ids.length; ++i) {
    getOrCreateTransfer(
      event,
      "-".concat(i.toString()),
      registry,
      operator,
      from,
      to,
      ids[i],
      values[i]
    );
  }
}

export function handleURI(event: URIEvent): void {
  let registry = new RainiCardsRegistry(event.address.toHex());
  registry.save();

  let token = getOrCreateToken(registry, event.params.id);
  token.URI = event.params.value;
  token.save();
}
