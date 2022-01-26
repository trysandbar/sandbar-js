import {
  Event,
  SubmitEventsRequest,
  SandbarDataService,
} from "./generated/sandbar"
import { HttpRule } from "./generated/google/api/http"
import { readMethodOption } from "@protobuf-ts/runtime-rpc"
import { JsonValue } from "@protobuf-ts/runtime"
import fetch from "cross-fetch"

const templateMarkers = [":", "*", "{", "}", "="]

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
    const path = getHttpPathForMethod("submitEvents")
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

function getHttpPathForMethod(method: string) {
  const rule = readMethodOption(
    SandbarDataService,
    method,
    "google.api.http",
    HttpRule
  )
  if (!rule) {
    throw new Error("Expected method ${methodName} to have HTTP bindings")
  }
  if (rule.body != "*") {
    throw new Error(
      "HTTP bindings with any body option other than '*' are not supported"
    )
  }
  if (rule.pattern.oneofKind !== "post") {
    throw new Error("Only POST bindings are supported")
  }

  if (rule.pattern.post.match(/[:*{}=]/)) {
    throw new Error("POST bindings with templates are not supported")
  }

  return rule.pattern.post
}

export { Sandbar }
