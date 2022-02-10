import * as publicapi from "./generated/sandbar"
import fetch from "cross-fetch"
import methods from "./generated/private/methods"
import {
  EventResponse,
  translateEventResponse,
} from "./translators/translate-event-response"
import {
  CompleteEntity,
  CompleteEntityCreate,
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

type EventPayloadReplacingEntityType<TEntity extends publicapi.Entity> =
  | Exclude<publicapi.Event["payload"], { oneofKind: "entity" }>
  | { oneofKind: "entity"; entity: TEntity }

type Event = Omit<publicapi.Event, "payload" | "incomplete" | "type"> &
  (
    | {
        payload: EventPayloadReplacingEntityType<CompleteEntityCreate>
        incomplete: false
        type: publicapi.EventType.CREATE
      }
    | {
        payload: EventPayloadReplacingEntityType<CompleteEntity>
        incomplete: false
        type: Exclude<publicapi.EventType, publicapi.EventType.CREATE>
      }
    | {
        payload: EventPayloadReplacingEntityType<publicapi.Entity>
        incomplete: true
        type: publicapi.EventType
      }
  )

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

export type HostSpecifier =
  | {
      subdomain: string
    }
  | {
      url: string
    }

export function toHostSpecifier({
  subdomain,
  url,
}: {
  subdomain?: string
  url?: string
}): HostSpecifier | undefined {
  if (subdomain !== undefined && url === undefined) {
    return { subdomain }
  } else if (url !== undefined && subdomain === undefined) {
    return { url }
  }
}

type Auth = {
  username: string
  password: string
}

class Client {
  private base: URL
  private auth: Auth | undefined

  constructor(
    options: {
      auth?: Auth
    } & HostSpecifier
  ) {
    const { auth } = options
    const base = new URL(
      "subdomain" in options
        ? `https://${options.subdomain}.sandbar.ai`
        : options.url
    )

    this.base = base
    this.auth = auth
  }

  async submitEvents(events: Event[]): Promise<SubmitEventsResponse> {
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
    options?: publicapi.GetAllInvestigationsRequest_Options
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
