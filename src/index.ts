import { Event, SubmitEventsRequest } from "./generated/sandbar"
import { JsonValue } from "@protobuf-ts/runtime"
import fetch from "cross-fetch"
import methodPaths from "./generated/method-paths"

function base64encode(input: string) {
  Buffer.from(input, "utf8").toString("base64")
}

class Sandbar {
  constructor(
    private base = "https://api.sandbar.ai",
    private auth?: {
      username: string
      password: string
    }
  ) {}

  async submitEvents(events: Event[]) {
    const req: SubmitEventsRequest = {
      events,
    }
    const json = SubmitEventsRequest.toJson(req)
    const path = methodPaths.SubmitEvents
    await this.post(path, json)
  }

  private async post(path: string, json: JsonValue) {
    const url = new URL(path, this.base)
    const body = json === null ? null : JSON.stringify(json)
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
    return response.json()
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

export { Sandbar }
