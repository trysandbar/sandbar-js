import fetchMock from "jest-fetch-mock"
jest.setMock("cross-fetch", fetchMock)

import * as sandbar from "../generated/sandbar"
import { Sandbar } from ".."

beforeEach(() => {
  fetchMock.resetMocks()
})

test("id string with numeric succeeds", async () => {
  const api = new Sandbar()
  fetchMock.mockIf(
    /https:\/\/api\.sandbar\.ai\/v0\/submit_event\/?/,
    async (_req) => {
      return JSON.stringify({ status: "success" })
    }
  )
  await api.submitEvents([
    {
      type: sandbar.EventType.CREATE,
      incomplete: false,
      payload: {
        oneofKind: "accountEntityLink",
        accountEntityLink: {
          accountId: {
            oneofKind: "sandbarAccountId",
            sandbarAccountId: "123",
          },
          entityId: {
            entityId: {
              oneofKind: "sandbarEntityId",
              sandbarEntityId: "123",
            },
          },
          startDate: "lol",
        },
      },
    },
  ])
})

test("id string with non-numeric fails", async () => {
  const api = new Sandbar()
  const alphaId = "abc"
  await expect(
    api.submitEvents([
      {
        type: sandbar.EventType.CREATE,
        incomplete: false,
        payload: {
          oneofKind: "accountEntityLink",
          accountEntityLink: {
            accountId: {
              oneofKind: "sandbarAccountId",
              sandbarAccountId: alphaId,
            },
            entityId: {
              entityId: {
                oneofKind: "sandbarEntityId",
                sandbarEntityId: "123",
              },
            },
            startDate: "lol",
          },
        },
      },
    ])
  ).rejects.toThrowWithMessage(
    SyntaxError,
    `Cannot convert ${alphaId} to a BigInt`
  )
})
