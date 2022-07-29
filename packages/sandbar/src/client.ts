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
} from "./translators/translate-entity"
import { IMessageType } from "@protobuf-ts/runtime"
import { translateRuleOutput } from "./translators/translate-rule-output"
import { translateEvent } from "./translators/translate-event"

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

type CreateUnitDepositAccountResponse = Omit<
  publicapi.CreateUnitDepositAccountResponse,
  "accountResponse" | "accountEntityLinkResponse"
> & {
  accountResponse: EventResponse
  accountEntityLinkResponse: EventResponse
}

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
    const { responses: grpcResponses, ...remainder } = await this.callMethod(
      methods.SubmitEvents,
      {
        events,
      }
    )
    const responses = grpcResponses.map(translateEventResponse)
    return {
      responses,
      ...remainder,
    }
  }

  async submitEventSync(
    event: Event
  ): Promise<publicapi.SubmitEventAndGetRuleOutputsResponse> {
    const {
      ruleOutputs: grpcRuleOutputs,
      request: grpcEvent,
      ...remainder
    } = await this.callMethod(methods.SubmitEventAndGetRuleOutputs, {
      event,
    })
    const ruleOutputs = grpcRuleOutputs.map(translateRuleOutput)
    const request = translateEvent(grpcEvent)
    return {
      ruleOutputs,
      request,
      ...remainder,
    }
  }

  async createUnitCustomer(
    customer: publicapi.UnitCustomer
  ): Promise<publicapi.CreateUnitCustomerResponse> {
    const { request: grpcEvent, ...remainder } = await this.callMethod(
      methods.CreateUnitCustomer,
      {
        customer,
      }
    )
    const request = translateEvent(grpcEvent)
    return { request, ...remainder }
  }

  async updateUnitCustomer(
    customer: publicapi.UnitCustomer
  ): Promise<publicapi.UpdateUnitCustomerResponse> {
    const { request: grpcEvent, ...remainder } = await this.callMethod(
      methods.UpdateUnitCustomer,
      {
        customer,
      }
    )
    const request = translateEvent(grpcEvent)
    return { request, ...remainder }
  }

  async createUnitDepositAccount(
    depositAccount: publicapi.UnitDepositAccount
  ): Promise<CreateUnitDepositAccountResponse> {
    const {
      status,
      accountResponse: grpcAccountResponse,
      accountEntityLinkResponse: grpcAccountEntityLinkResponse,
    } = await this.callMethod(methods.CreateUnitDepositAccount, {
      depositAccount,
    })
    if (!grpcAccountResponse) {
      throw new TypeError("Missing account response, status " + status)
    }
    if (!grpcAccountEntityLinkResponse) {
      throw new TypeError(
        "Missing account entity link response, status " + status
      )
    }
    const accountResponse = translateEventResponse(grpcAccountResponse)
    const accountEntityLinkResponse = translateEventResponse(
      grpcAccountEntityLinkResponse
    )
    return { status, accountResponse, accountEntityLinkResponse }
  }

  async updateUnitDepositAccount(
    depositAccount: publicapi.UnitDepositAccount
  ): Promise<publicapi.UpdateUnitDepositAccountResponse> {
    const { request: grpcEvent, ...remainder } = await this.callMethod(
      methods.UpdateUnitDepositAccount,
      {
        depositAccount,
      }
    )
    const request = translateEvent(grpcEvent)
    return { request, ...remainder }
  }

  async createUnitPayment(
    payment: publicapi.UnitPayment
  ): Promise<publicapi.CreateUnitPaymentResponse> {
    const { request: grpcEvent, ...remainder } = await this.callMethod(
      methods.CreateUnitPayment,
      {
        payment,
      }
    )
    const request = translateEvent(grpcEvent)
    return { request, ...remainder }
  }

  async updateUnitPayment(
    payment: publicapi.UnitPayment
  ): Promise<publicapi.UpdateUnitPaymentResponse> {
    const { request: grpcEvent, ...remainder } = await this.callMethod(
      methods.UpdateUnitPayment,
      {
        payment,
      }
    )
    const request = translateEvent(grpcEvent)
    return { request, ...remainder }
  }

  async createUnitTransaction(
    transaction: publicapi.UnitTransaction
  ): Promise<publicapi.CreateUnitTransactionResponse> {
    const { request: grpcEvent, ...remainder } = await this.callMethod(
      methods.CreateUnitTransaction,
      {
        transaction,
      }
    )
    const request = translateEvent(grpcEvent)
    return { request, ...remainder }
  }

  async createUnitCheckDeposit(
    checkDeposit: publicapi.UnitCheckDeposit
  ): Promise<publicapi.CreateUnitCheckDepositResponse> {
    const { request: grpcEvent, ...remainder } = await this.callMethod(
      methods.CreateUnitCheckDeposit,
      {
        checkDeposit,
      }
    )
    const request = translateEvent(grpcEvent)
    return { request, ...remainder }
  }

  async updateUnitCheckDeposit(
    checkDeposit: publicapi.UnitCheckDeposit
  ): Promise<publicapi.UpdateUnitCheckDepositResponse> {
    const { request: grpcEvent, ...remainder } = await this.callMethod(
      methods.UpdateUnitCheckDeposit,
      {
        checkDeposit,
      }
    )
    const request = translateEvent(grpcEvent)
    return { request, ...remainder }
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
