import { EventType } from "../generated/sandbar"
import { Sandbar } from "../src"

test("id string with numeric succeeds", () => {
  const sandbar = new Sandbar()
  sandbar.submitEvents([
    {
      type: EventType.CREATE,
      incomplete: false,
      payload: {
        oneofKind: "accountEntityLink",
        accountEntityLink: {
          accountId: {
            oneofKind: "sandbarAccountId",
            sandbarAccountId: "123",
          },
          startDate: "lol",
        },
      },
    },
  ])
})

test("id string with non-numeric fails", () => {
  const sandbar = new Sandbar()
  const alphaId = "abc"
  expect(() =>
    sandbar.submitEvents([
      {
        type: EventType.CREATE,
        incomplete: false,
        payload: {
          oneofKind: "accountEntityLink",
          accountEntityLink: {
            accountId: {
              oneofKind: "sandbarAccountId",
              sandbarAccountId: alphaId,
            },
            startDate: "lol",
          },
        },
      },
    ])
  ).toThrowWithMessage(SyntaxError, `Cannot convert ${alphaId} to a BigInt`)
})
