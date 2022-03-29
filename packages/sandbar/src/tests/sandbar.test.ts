import fetchMock from "jest-fetch-mock"
jest.setMock("cross-fetch", fetchMock)

import * as sandbar from "../"
import * as grpc from "../generated/private/sandbar"

beforeEach(() => {
  fetchMock.resetMocks()
})

test("well-formed submit request succeeds", async () => {
  const api = new sandbar.Client({ subdomain: "hello.dev" })
  fetchMock.mockIf(
    /https:\/\/hello\.dev\.sandbar\.ai\/v0\/submit_event\/?/,
    async (_req) => {
      return JSON.stringify({
        message: "success",
      })
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

test("creat new entities, accounts, links, and transaction", async () => {
  const resp: grpc.SubmitEventsResponse = {
    message: "success",
    responses: [
      {
        eventResponseType: sandbar.EventResponseType.ENTITY,
        sandbarId: "1",
        sourceId: "test-person",
        isSuccessful: true,
        message: "",
        generatedId: "",
      },
      {
        eventResponseType: sandbar.EventResponseType.ACCOUNT,
        sandbarId: "1",
        sourceId: "Lendbar Bank|1234",
        isSuccessful: true,
        message: "",
        generatedId: "",
      },
      {
        eventResponseType: sandbar.EventResponseType.ACCOUNT_ENTITY_LINK,
        sandbarId: "1",
        sourceId: "",
        isSuccessful: true,
        message: "",
        generatedId: "",
      },
      {
        eventResponseType: sandbar.EventResponseType.TRANSACTION,
        sandbarId: "1",
        sourceId: "abc",
        isSuccessful: true,
        message: "",
        generatedId: "",
      },
    ],
  }
  fetchMock.mockIf(
    /https:\/\/hello\.dev\.sandbar\.ai\/v0\/submit_event\/?/,
    async (_req) => {
      return JSON.stringify(resp)
    }
  )
  const api = new sandbar.Client({ subdomain: "hello.dev" })
  const result = await api.submitEvents([
    {
      type: sandbar.EventType.CREATE,
      incomplete: false,
      payload: {
        oneofKind: "entity",
        entity: {
          sourceEntityId: "test-person",
          name: "Test Person",
          birthIncorporationDate: "01/01/1980",
        },
      },
    },
    {
      type: sandbar.EventType.CREATE,
      incomplete: false,
      payload: {
        oneofKind: "account",
        account: {
          accountIdentifier: {
            accountNumber: "1234",
            bankName: "Lendbar Bank",
          },
          accountType: sandbar.AccountType.CHECKING,
        },
      },
    },
    {
      type: sandbar.EventType.CREATE,
      incomplete: false,
      payload: {
        oneofKind: "accountEntityLink",
        accountEntityLink: {
          accountId: {
            oneofKind: "sourceAccountIdentifier",
            sourceAccountIdentifier: {
              accountNumber: "1234",
              bankName: "Lendbar Bank",
            },
          },
          entityId: {
            entityId: {
              oneofKind: "sourceEntityId",
              sourceEntityId: "test-person",
            },
          },
          startDate: "01/01/2020",
        },
      },
    },
    {
      type: sandbar.EventType.CREATE,
      incomplete: false,
      payload: {
        oneofKind: "transaction",
        transaction: {
          sourceTransactionId: "abc",
          transactionAmount: 20,
          transactionCurrency: "usd",
          accountIdentifier: {
            accountNumber: "1234",
            bankName: "Lendbar Bank",
          },
          transactionSourceEntityId: "test-person",
          transactionType: sandbar.TransactionType.DEPOSIT,
          isCredit: true,
          executeTransactionDateTime: "",
          productType: sandbar.ProductType.CREDIT_CARD,
        },
      },
    },
  ])
  const { responses } = result
  expect(responses).toHaveLength(4)
  const accountResponse = responses[1]
  expect(accountResponse.responseType).toBe("account")
  if (accountResponse.responseType === "account") {
    const { accountNumber, bankName } = accountResponse.sourceAccountId
    expect(accountNumber).toBe("1234")
    expect(bankName).toBe("Lendbar Bank")
  }
})
