import { Event, SubmitEventsRequest } from "../generated/sandbar"

class Sandbar {
  submitEvents(events: Event[]) {
    const req: SubmitEventsRequest = {
      events,
    }
    const json = SubmitEventsRequest.toJson(req)
  }
}

export { Sandbar }
