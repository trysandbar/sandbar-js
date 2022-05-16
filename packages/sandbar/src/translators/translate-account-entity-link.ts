import * as publicapi from "../generated/sandbar"
import * as grpc from "../generated/private/sandbar"

function translateAccountId(
  accountId: grpc.AccountEntityLink["accountId"]
): publicapi.AccountEntityLink["accountId"] {
  const { oneofKind } = accountId
  if (oneofKind === undefined) {
    throw new TypeError(
      "Server returned an empty account id in an account entity link, that is illegal"
    )
  }

  return accountId
}

function translateEntityId(
  entityId: grpc.EntityQueryIdParam["entityId"]
): publicapi.EntityQueryIdParam["entityId"] {
  const { oneofKind } = entityId
  if (oneofKind === undefined) {
    throw new TypeError(
      "Server returned an empty entity id for an account entity link, that is illegal"
    )
  }

  return entityId
}

function translateEntityQueryIdParam(
  entityQueryIdParam?: grpc.EntityQueryIdParam
): publicapi.EntityQueryIdParam {
  if (!entityQueryIdParam) {
    throw new TypeError(
      "Server returned an empty entity id for an account entity link, that is illegal"
    )
  }

  const { entityId: grpcEntityId, ...rest } = entityQueryIdParam
  const entityId = translateEntityId(grpcEntityId)

  return {
    entityId,
    ...rest,
  }
}

export function translateAccountEntityLink(
  grpcLink: grpc.AccountEntityLink
): publicapi.AccountEntityLink {
  const {
    accountId: grpcAccountId,
    entityId: grpcEntityId,
    ...linkRest
  } = grpcLink
  const accountId = translateAccountId(grpcAccountId)
  const entityId = translateEntityQueryIdParam(grpcEntityId)
  return {
    accountId,
    entityId,
    ...linkRest,
  }
}
