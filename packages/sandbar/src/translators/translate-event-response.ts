import * as publicapi from "../generated/sandbar"
import * as grpc from "../generated/private/sandbar"
import { Status } from "../generated/private/google/rpc/status"

/**
 * Response for the event submitted to the sandbar API
 */
export type EventResponse = {
  sandbarId: string
  status?: Status
} & (
  | ({
      responseType: "entity"
    } & (
      | {
          sourceEntityId: string
          generatedId: string
        }
      | {
          sourceEntityId?: string
          generatedId: string
        }
      | {
          sourceEntityId: string
          generatedId?: string
        }
    ))
  | {
      responseType: "account"
      sourceAccountId: publicapi.AccountIdentifier
    }
  | {
      responseType: "accountEntityLink"
    }
  | {
      responseType: "transaction"
      sourceTransactionId: string
    }
)

export function translateEventResponse(
  response: grpc.EventResponse
): EventResponse {
  const { sourceId, sandbarId, generatedId, eventResponseType, status } =
    response
  switch (eventResponseType) {
    case publicapi.EventResponseType.ENTITY:
      return {
        responseType: "entity",
        sourceEntityId: sourceId,
        sandbarId,
        generatedId,
        status,
      }
    case publicapi.EventResponseType.ACCOUNT: {
      const [bankName, accountNumber] = sourceId.split("|", 2)
      return {
        responseType: "account",
        sourceAccountId: {
          bankName,
          accountNumber,
        },
        sandbarId,
        status,
      }
    }
    case publicapi.EventResponseType.ACCOUNT_ENTITY_LINK:
      return {
        responseType: "accountEntityLink",
        sandbarId,
        status,
      }
    case publicapi.EventResponseType.TRANSACTION:
      return {
        responseType: "transaction",
        sourceTransactionId: sourceId,
        sandbarId,
        status,
      }
    case publicapi.EventResponseType.UNSPECIFIED:
      throw new TypeError(
        "API contract violation: event response type unspecified"
      )
  }
}
