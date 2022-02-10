import * as grpc from "../generated/private/sandbar"
import * as publicapi from "../generated/sandbar"

type RequireKeys<T, TKeys extends keyof T> = Omit<T, TKeys> &
  Required<Pick<T, TKeys>>

export type CompleteEntityCreate = RequireKeys<
  publicapi.Entity,
  "sourceEntityId" | "name" | "birthIncorporationDate"
>

export type CompleteEntity = RequireKeys<
  CompleteEntityCreate,
  "sandbarEntityId"
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

function isCompleteEntityCreate(
  entity: grpc.Entity
): entity is CompleteEntityCreate {
  const { sourceEntityId, name, birthIncorporationDate } = entity
  return (
    sourceEntityId !== undefined &&
    name !== undefined &&
    birthIncorporationDate != undefined
  )
}

function isCompleteEntity(entity: grpc.Entity): entity is CompleteEntity {
  const { sandbarEntityId } = entity
  return sandbarEntityId !== undefined && isCompleteEntityCreate(entity)
}
