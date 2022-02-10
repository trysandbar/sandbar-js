import * as publicapi from "../generated/sandbar"
import * as grpc from "../generated/private/sandbar"

export type EventResponse = {
  sandbarId: string
  isSuccessful: boolean
  message: string
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
  const {
    sourceId,
    isSuccessful,
    sandbarId,
    message,
    generatedId,
    eventResponseType,
  } = response
  switch (eventResponseType) {
    case publicapi.EventResponseType.ENTITY:
      return {
        responseType: "entity",
        sourceEntityId: sourceId,
        isSuccessful,
        sandbarId,
        message,
        generatedId,
      }
    case publicapi.EventResponseType.ACCOUNT: {
      const [bankName, accountNumber] = sourceId.split("|", 2)
      return {
        responseType: "account",
        sourceAccountId: {
          bankName,
          accountNumber,
        },
        isSuccessful,
        sandbarId,
        message,
      }
    }
    case publicapi.EventResponseType.ACCOUNT_ENTITY_LINK:
      return {
        responseType: "accountEntityLink",
        isSuccessful,
        sandbarId,
        message,
      }
    case publicapi.EventResponseType.TRANSACTION:
      return {
        responseType: "transaction",
        sourceTransactionId: sourceId,
        isSuccessful,
        sandbarId,
        message,
      }
    case publicapi.EventResponseType.UNSPECIFIED:
      throw new TypeError(
        "API contract violation: event response type unspecified"
      )
  }
}
