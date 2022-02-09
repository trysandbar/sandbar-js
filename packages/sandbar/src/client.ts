import * as publicapi from "./generated/sandbar"
import fetch from "cross-fetch"
import methods from "./generated/private/methods"
import {
  EventResponse,
  translateEventResponse,
} from "./translators/translate-event-response"
import {
  Entity,
  translateEntityResponse,
} from "./translators/translate-entity-response"
import { translateAccount } from "./translators/translate-account"
import { translateTransaction } from "./translators/translate-transaction"
import { IMessageType } from "@protobuf-ts/runtime"
import { translateInvestigation } from "./translators/translate-investigation"

function base64encode(input: string) {
  Buffer.from(input, "utf8").toString("base64")
}

interface SubmitEventsResponse {
  message: string
  responses: EventResponse[]
}

interface GetEntityResponse {
  message: string
  entities: Entity[]
}

type Method<I extends object, O extends object> = {
  path: string
  input: IMessageType<I>
  output: IMessageType<O>
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
    const { message, responses: grpcResponses } = await this.callMethod(
      methods.SubmitEvents,
      {
        events,
      }
    )
    const responses = grpcResponses.map(translateEventResponse)
    return {
      message,
      responses,
    }
  }

  async getEntities(
    entityIds: publicapi.EntityQueryIdParam["entityId"][]
  ): Promise<GetEntityResponse> {
    const { message, entity: grpcEntities } = await this.callMethod(
      methods.GetEntity,
      {
        request: {
          ids: entityIds.map((entityId) => ({ entityId })),
        },
      }
    )
    const entities = grpcEntities.map(translateEntityResponse)
    return {
      message,
      entities,
    }
  }

  async getAccounts(
    accountIds: publicapi.AccountQueryIdParam["id"][]
  ): Promise<publicapi.GetAccountResponse> {
    const { message, accounts: grpcAccounts } = await this.callMethod(
      methods.GetAccount,
      {
        id: accountIds.map((id) => ({ id })),
      }
    )
    const accounts = grpcAccounts.map(translateAccount)
    return {
      message,
      accounts,
    }
  }

  async getTransactionsForEntity(
    entityId: publicapi.EntityQueryIdParam["entityId"]
  ): Promise<publicapi.GetTransactionsForEntityResponse> {
    const { transactions: grpcTransactions, message } = await this.callMethod(
      methods.GetTransactionsForEntity,
      {
        id: { entityId },
      }
    )
    const transactions = grpcTransactions.map(translateTransaction)
    return {
      transactions,
      message,
    }
  }

  async getAllInvestigations(
    options: publicapi.GetAllInvestigationsRequest_Options
  ): Promise<publicapi.GetAllInvestigationsResponse> {
    const { investigations: grpcInvestigations, message } =
      await this.callMethod(methods.GetAllInvestigations, { options })
    const investigations = grpcInvestigations.map(translateInvestigation)
    return {
      investigations,
      message,
    }
  }

  private async callMethod<I extends object, O extends object>(
    { path, input, output }: Method<I, O>,
    req: I
  ): Promise<O> {
    const json = input.toJsonString(req)
    const response = await this.post(path, json)
    return output.fromJsonString(response)
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

export { Client, SubmitEventsResponse, GetEntityResponse }
