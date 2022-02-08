import * as publicapi from "../generated/sandbar"
import * as grpc from "../generated/private/sandbar"

export function translateTransaction(
  grpcTransaction: grpc.Transaction
): publicapi.Transaction {
  const { accountIdentifier, ...transactionRest } = grpcTransaction
  if (accountIdentifier === undefined) {
    throw new TypeError(
      "Server returned an account with no account identifier, that is illegal"
    )
  }

  return {
    accountIdentifier,
    ...transactionRest,
  }
}
