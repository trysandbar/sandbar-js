import * as grpc from "../generated/private/sandbar"
import * as publicapi from "../generated/sandbar"

export function translateAccount(grpcAccount: grpc.Account): publicapi.Account {
  const { accountIdentifier, ...optionals } = grpcAccount
  if (accountIdentifier === undefined) {
    throw new TypeError(
      "Server returned an account with no account identifier, that is illegal"
    )
  }
  return {
    accountIdentifier,
    ...optionals,
  }
}
