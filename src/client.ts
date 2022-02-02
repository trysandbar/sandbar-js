import * as publicapi from "./generated/sandbar"
import * as grpc from "./generated/private/sandbar"
import fetch from "cross-fetch"
import methodPaths from "./generated/private/method-paths"
import {
  EventResponse,
  translateEventResponse,
} from "./translators/translate-event-response"
import {
  Entity,
  translateEntityResponse,
} from "./translators/translate-entity-response"

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
    const { message, responses: grpcResponses } =
      grpc.SubmitEventsResponse.fromJsonString(response)
    const responses = grpcResponses.map(translateEventResponse)
    return {
      message,
      responses,
    }
  }

  async getEntity(
    entityId: publicapi.EntityQueryIdParam["entityId"]
  ): Promise<GetEntityResponse> {
    const req: publicapi.GetEntityRequest = {
      request: {
        id: { entityId },
      },
    }
    const json = grpc.GetEntityRequest.toJsonString(req)
    const path = methodPaths.GetEntity
    const response = await this.post(path, json)
    const { message, entity: grpcEntities } =
      grpc.GetEntityResponse.fromJsonString(response)
    const entities = grpcEntities.map(translateEntityResponse)
    return {
      message,
      entities,
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

export { Client, SubmitEventsResponse, GetEntityResponse }
