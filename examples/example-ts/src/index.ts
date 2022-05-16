#!/usr/bin/env ts-node-script

import * as sandbar from "sandbar"
import humanizeDuration from "humanize-duration"
import { program } from "commander"

const snooze = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

class Example {
  constructor(
    private client = new sandbar.Client({ url: "http://localhost:10000" })
  ) {}

  async main(): Promise<void> {
    console.log("creating entity")

    // Send data to sandbar
    const submitEventsRes = await this.client.submitEvents([
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
      ...[
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
          oneofKind: "transaction" as const,
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
      })),
    ])

    console.log(
      `submit events response: ${JSON.stringify(submitEventsRes, undefined, 2)}`
    )

    const sendSyncRes = await this.client.submitEventSync({
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
    })

    console.log(
      `send sync response: ${JSON.stringify(sendSyncRes, undefined, 2)}`
    )
  }
}

async function main() {
  program.option(
    "--url <url>",
    "base url of the api endpoint; " +
      "defaults to http://localhost:10000; " +
      "only one of url or subdomain must be set"
  )
  program.option(
    "--subdomain <subdomain>",
    "subdomain of the sandbar api endpoint; " +
      "only one of hostname or subdomain must be set"
  )
  program.option(
    "--username <username>",
    "username for basic auth; if set, password must also be set"
  )
  program.option(
    "--password <password>",
    "password for basic auth; if set, username must also be set"
  )
  program.parse(process.argv)
  const { url, subdomain, username, password } = program.opts() as {
    url?: string
    subdomain?: string
    username?: string
    password?: string
  }

  // auth: if username is set, pw should be set, vice versa.
  const auth =
    username !== undefined && password !== undefined
      ? { username, password }
      : undefined
  if (
    auth === undefined &&
    (username !== undefined || password !== undefined)
  ) {
    program.help({ error: true })
  }

  // exactly one of url or subdomain should be set
  const hostSpec =
    url !== undefined
      ? { url }
      : subdomain !== undefined
      ? { subdomain }
      : undefined
  if (
    hostSpec === undefined ||
    (url !== undefined && subdomain !== undefined)
  ) {
    program.help({ error: true })
  }

  const client = new sandbar.Client({ auth, ...hostSpec })
  const example = new Example(client)
  await example.main()
}

if (require.main == module) {
  main()
}
