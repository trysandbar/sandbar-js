import * as publicapi from "../generated/sandbar"
import * as grpc from "../generated/private/sandbar"
import { translateEntityResponse as translateEntity } from "./translate-entity"
import { translateAccount } from "./translate-account"
import { translateTransaction } from "./translate-transaction"
import { translateAccountEntityLink } from "./translate-account-entity-link"

export function translateEvent(grpcEvent?: grpc.Event): publicapi.Event {
  if (!grpcEvent) {
    throw new TypeError(
      "Server returned an empty event in the response, that is illegal"
    )
  }

  const { payload, ...rest } = grpcEvent
  const { oneofKind } = payload
  switch (oneofKind) {
    case "entity": {
      const entity = translateEntity(payload.entity)
      return {
        payload: {
          oneofKind,
          entity,
        },
        ...rest,
      }
    }
    case "account": {
      const account = translateAccount(payload.account)
      return {
        payload: {
          oneofKind,
          account,
        },
        ...rest,
      }
    }
    case "accountEntityLink": {
      const accountEntityLink = translateAccountEntityLink(
        payload.accountEntityLink
      )
      return {
        payload: {
          oneofKind,
          accountEntityLink,
        },
        ...rest,
      }
    }
    case "transaction": {
      const transaction = translateTransaction(payload.transaction)
      return {
        payload: {
          oneofKind,
          transaction,
        },
        ...rest,
      }
    }
    case undefined: {
      throw new TypeError(
        "Server returned an empty event in the response, that is illegal"
      )
    }
  }
}
