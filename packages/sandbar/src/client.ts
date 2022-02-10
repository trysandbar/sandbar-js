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
  return Buffer.from(input, "utf8").toString("base64")
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

/**
 * Response from a call to submit events endpoint.
 *
 * Based on protobuf message sandbar.v0.SubmitEventsResponse
 */
export type SubmitEventsResponse = Omit<
  publicapi.SubmitEventsResponse,
  "responses"
> & {
  /**
   * Collection of event responses
   */
  responses: EventResponse[]
}

/**
 * A response containing requested entity information.
 *
 * Based on protobuf message sandbar.v0.GetEntityResponse
 */
export type GetEntityResponse = Omit<publicapi.GetEntityResponse, "entity"> & {
  /**
   * Collection of entity responses
   */
  entities: Entity[]
}

type Method<I extends object, O extends object> = {
  path: string
  input: IMessageType<I>
  output: IMessageType<O>
}

type HostSpecifier =
  | {
      subdomain: string
    }
  | {
      url: string
    }

type Auth = {
  username: string
  password: string
}

/**
 * Sandbar client instance used to interact with the sandbar API.
 */
export class Client {
  private base: URL
  private auth: Auth | undefined

  /**
   * Instantiate a new instance of a sandbar client.
   *
   * @param options
   * @param options.subdomain Subdomain of the sandbar API hostname, e.g. "mycompany" will send requests to "https://mycompany.sandbar.ai"
   * @param options.url Full base URL of the sandbar API, e.g. "http://localhost:10000"
   */
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

  /**
   * This endpoint takes in events and processes them based on the metadata
   * associated with them.
   *
   * Based on protobuf rpc: SubmitEvents
   *
   * @param events Events to send to the sandbar API
   * @returns collection of results for each event received by API server
   */
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

  /**
   * This simple endpoint just takes in and returns entities.
   *
   * Based on protobuf rpc: GetEntity
   *
   * @param entityIds IDs of the entities to query for
   * @returns Collection of entities specified by the parameter
   */
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

  /**
   * This end point is used to get information about the given accounts.
   *
   * @param accountIds IDs of the accounts to query for
   * @returns Collection of accounts specified by the parameter
   */
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

  /**
   * This endpoint will return all the transactions for a given entity.
   *
   * Basede on protobuf rpc: GetTransactionsForEntity
   *
   * @param entityId ID of entity to get the transactions for
   * @returns Collection of transactions associated with the given entity
   */
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

  /**
   * This query will return all investigations for an entity.
   *
   * Based on protobuf rpc: GetAllInvestigations
   *
   * @param options
   * @param options.includeClosed If set to true, include closed investigations in the result. Defaults to false
   * @returns Collection of investigations specified by the options
   */
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
    const text = await response.text()
    if (!response.ok) {
      throw new Error(
        "Request failed with status " + response.status + ": " + text
      )
    }
    return text
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
