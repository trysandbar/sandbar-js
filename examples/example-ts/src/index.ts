import * as sandbar from "sandbar"
import humanizeDuration from "humanize-duration"

const snooze = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

class Example {
  constructor(
    private client = new sandbar.Client({ url: "http://localhost:10000" })
  ) {}

  async getEntity(sandbarId: string): Promise<void> {
    const result = await this.client.getEntities([
      { oneofKind: "sandbarEntityId", sandbarEntityId: sandbarId },
    ])
    console.log(`get entity response: ${JSON.stringify(result, undefined, 2)}`)
  }

  async getAllInvestigations(waitMs?: number): Promise<void> {
    if (waitMs !== undefined) {
      console.log(`waiting ${humanizeDuration(waitMs)} for rule calc to finish`)
      await snooze(waitMs)
    }
    const investigations = await this.client.getAllInvestigations()
    console.log(
      `investigations: ${JSON.stringify(investigations, undefined, 2)}`
    )
  }

  async main(): Promise<void> {
    console.log("creating entity")

    // Send data to sandbar
    const sendEntityRes = await this.client.submitEvents([
      {
        type: sandbar.EventType.CREATE,
        payload: {
          oneofKind: "entity",
          entity: {
            sourceEntityId: "HelloJerry",
            name: "Jerry Seinfeld",
            primaryAddress: {
              streetAddressLine1: "129 W 81st St",
              streetAddressLine2: "Apt 5a",
              city: "New York",
              stateOrProvince: "NY",
              zip: "10024",
              country: "US",
            },
            email: "jerry@seinfeld.com",
            websiteUrl: "https://www.seinfeld.com",
            birthIncorporationDate: "1954-04-29",
          },
        },
        incomplete: false,
      },
    ])

    console.log(
      `submit entity response: ${JSON.stringify(sendEntityRes, undefined, 2)}`
    )

    await this.getEntity("1")

    // TODO: get accounts for entity

    const sendAcctRes = await this.client.submitEvents([
      {
        type: sandbar.EventType.CREATE,
        payload: {
          oneofKind: "account",
          account: {
            accountType: sandbar.AccountType.CHECKING,
            accountIdentifier: {
              bankName: "Chemical Bank",
              accountNumber: "123456789",
            },
          },
        },
        incomplete: false,
      },
    ])

    console.log(
      `submit account response: ${JSON.stringify(sendAcctRes, undefined, 2)}`
    )

    // TODO: get accounts for entity

    const sendLinkRes = await this.client.submitEvents([
      {
        type: sandbar.EventType.CREATE,
        payload: {
          oneofKind: "accountEntityLink",
          accountEntityLink: {
            accountId: {
              oneofKind: "sourceAccountIdentifier",
              sourceAccountIdentifier: {
                bankName: "Chemical Bank",
                accountNumber: "123456789",
              },
            },
            entityId: {
              entityId: {
                oneofKind: "sourceEntityId",
                sourceEntityId: "HelloJerry",
              },
            },
            startDate: "2021-12-01T01:01:01.000Z",
          },
        },
        incomplete: false,
      },
    ])

    console.log(
      `submit link response: ${JSON.stringify(sendLinkRes, undefined, 2)}`
    )

    const sendTxnsRes = await this.client.submitEvents(
      [
        {
          sourceTransactionId: "321654",
          transactionAmount: 1607.48,
          productType: sandbar.ProductType.CREDIT_CARD,
          description: "Costanza and son computers",
          executeTransactionDateTime: "2021-12-01T00:00:00.001Z",
          isCredit: false,
        },
        {
          sourceTransactionId: "654321",
          transactionAmount: 2900,
          productType: sandbar.ProductType.US_CURRENCY,
          description: "Deposit from cash paid for standup gig",
          executeTransactionDateTime: "2021-12-02T00:00:00.001Z",
          isCredit: true,
        },
        {
          sourceTransactionId: "765432",
          isCredit: true,
          transactionAmount: 2800,
          productType: sandbar.ProductType.US_CURRENCY,
          description: "Deposit from cash paid for standup gig",
          executeTransactionDateTime: "2021-12-03T00:00:00.001Z",
        },
        {
          sourceTransactionId: "876543",
          isCredit: true,
          transactionAmount: 2700,
          productType: sandbar.ProductType.US_CURRENCY,
          description: "Deposit from cash paid for standup gig",
          executeTransactionDateTime: "2021-12-04T00:00:00.001Z",
        },
        {
          sourceTransactionId: "987654",
          isCredit: true,
          transactionAmount: 2800,
          productType: sandbar.ProductType.US_CURRENCY,
          description: "Deposit from cash paid for standup gig",
          executeTransactionDateTime: "2021-12-05T00:00:00.001Z",
        },
        {
          sourceTransactionId: "098765",
          isCredit: true,
          transactionAmount: 2700,
          productType: sandbar.ProductType.US_CURRENCY,
          description: "Deposit from cash paid for standup gig",
          executeTransactionDateTime: "2021-12-08T00:00:00.001Z",
        },
      ].map((rest) => ({
        type: sandbar.EventType.CREATE,
        payload: {
          oneofKind: "transaction",
          transaction: {
            transactionType: sandbar.TransactionType.DEPOSIT,
            transactionSourceEntityId: "HelloJerry",
            transactionCurrency: "USD",
            accountIdentifier: {
              bankName: "Chemical Bank",
              accountNumber: "123456789",
            },
            transactionSourceRoutingNumber: 1111,
            ...rest,
          },
        },
        incomplete: false,
      }))
    )

    console.log(
      `send txns response: ${JSON.stringify(sendTxnsRes, undefined, 2)}`
    )

    await this.getAllInvestigations(3000)

    const sendLastTxnRes = await this.client.submitEvents([
      {
        type: sandbar.EventType.CREATE,
        payload: {
          oneofKind: "transaction",
          transaction: {
            transactionType: sandbar.TransactionType.DEPOSIT,
            transactionSourceEntityId: "HelloJerry",
            transactionCurrency: "USD",
            accountIdentifier: {
              bankName: "Chemical Bank",
              accountNumber: "123456789",
            },
            transactionSourceRoutingNumber: 1111,
            sourceTransactionId: "109876",
            isCredit: true,
            transactionAmount: 15000,
            productType: sandbar.ProductType.US_CURRENCY,
            description: "Deposit from selling sitcom <Jerry> to NBC.",
            executeTransactionDateTime: "2021-12-10T00:00:00.001Z",
          },
        },
        incomplete: false,
      },
    ])

    console.log(
      `send last txn response: ${JSON.stringify(sendLastTxnRes, undefined, 2)}`
    )

    await this.getAllInvestigations(3000)
  }
}

async function main() {
  const example = new Example()
  await example.main()
}

if (require.main == module) {
  main()
}
