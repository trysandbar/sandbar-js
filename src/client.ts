import * as publicapi from "./generated/sandbar"
import * as grpc from "./generated/private/sandbar"
import fetch from "cross-fetch"
import methodPaths from "./generated/private/method-paths"

function base64encode(input: string) {
  Buffer.from(input, "utf8").toString("base64")
}

type EventResponse = {
  sandbarId: string
  isSuccessful: boolean
  message: string
} & (
  | {
      responseType: "entity"
      sourceEntityId: string
      generatedId: string
    }
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

interface SubmitEventsResponse {
  message: string
  responses: EventResponse[]
}

class Client {
  constructor(
    private base = "https://api.sandbar.ai",
    private auth?: {
      username: string
      password: string
    }
  ) {}

  async submitEvents(events: publicapi.Event[]): Promise<SubmitEventsResponse> {
    const req: publicapi.SubmitEventsRequest = {
      events,
    }
    const json = grpc.SubmitEventsRequest.toJsonString(req)
    const path = methodPaths.SubmitEvents
    const response = await this.post(path, json)
    const parsedResponse = grpc.SubmitEventsResponse.fromJsonString(response)
    const { message, responses: grpcResponses } = parsedResponse
    const responses = grpcResponses.map(translateResponse)
    return {
      message,
      responses,
    }
  }

  private async post(path: string, body: string) {
    const url = new URL(path, this.base)
    const authHeaders = this.getAuthHeaders()
    const response = await fetch(url.toString(), {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body,
    })

    return response.text()
  }

  private getAuthHeaders(): { Authorization?: string } {
    if (this.auth === undefined) {
      return {}
    }

    const { username, password } = this.auth

    return {
      Authorization: `Basic ${base64encode(`${username}:${password}`)}`,
    }
  }
}

function translateResponse(response: grpc.EventResponse): EventResponse {
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

export { Client, EventResponse, SubmitEventsResponse }
