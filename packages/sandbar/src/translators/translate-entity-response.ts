import * as grpc from "../generated/private/sandbar"
import * as publicapi from "../generated/sandbar"

type RequireKeys<T, TKeys extends keyof T> = Omit<T, TKeys> &
  Required<Pick<T, TKeys>>

type CompleteEntity = RequireKeys<
  publicapi.Entity,
  | "sandbarEntityId"
  | "sourceEntityId"
  | "relationshipBeginDate"
  | "name"
  | "birthIncorporationDate"
>

export type Entity =
  | ({ isGenerated: false } & CompleteEntity)
  | ({ isGenerated: true } & publicapi.Entity)

export function translateEntityResponse(entityGrpc: grpc.Entity): Entity {
  const isGenerated = !isCompleteEntity(entityGrpc)
  return isGenerated
    ? { isGenerated, ...entityGrpc }
    : { isGenerated, ...entityGrpc }
}

function isCompleteEntity(entity: grpc.Entity): entity is CompleteEntity {
  const {
    sandbarEntityId,
    sourceEntityId,
    relationshipBeginDate,
    name,
    birthIncorporationDate,
  } = entity
  return (
    sandbarEntityId !== undefined &&
    sourceEntityId !== undefined &&
    relationshipBeginDate !== undefined &&
    name !== undefined &&
    birthIncorporationDate != undefined
  )
}
