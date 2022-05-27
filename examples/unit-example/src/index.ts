#!/usr/bin/env ts-node-script

import * as sandbar from "sandbar"
import { program } from "commander"

class Example {
  constructor(
    private client = new sandbar.Client({ url: "http://localhost:10000" })
  ) { }

  async main(): Promise<void> {
    console.log("Creating Customer")

    const customerRequest = {
      "type": "businessCustomer",
      "id": "8",
      "attributes": {
        "createdAt": "2020-05-10T12:28:37.698Z",
        "name": "Pied Piper",
        "address": {
          "street": "5230 Newell Rd",
          "city": "Palo Alto",
          "state": "CA",
          "postalCode": "94303",
          "country": "US"
        },
        "phone": {
          "countryCode": "1",
          "number": "1555555578"
        },
        "stateOfIncorporation": "DE",
        "ein": "123456789",
        "entityType": "Corporation",
        "contact": {
          "fullName": {
            "first": "Richard",
            "last": "Hendricks"
          },
          "email": "richard@piedpiper.com",
          "phone": {
            "countryCode": "1",
            "number": "1555555578"
          }
        },
        "authorizedUsers": [
          {
            "fullName": {
              "first": "Jared",
              "last": "Dunn"
            },
            "email": "jared@piedpiper.com",
            "phone": {
              "countryCode": "1",
              "number": "1555555590"
            }
          }
        ],
        "status": "Active",
        "tags": {
          "userId": "106a75e9-de77-4e25-9561-faffe59d7814"
        }
      },
      "relationships": {
        "org": {
          "data": {
            "type": "org",
            "id": "1"
          }
        },
        "application": {
          "data": {
            "type": "businessApplication",
            "id": "1"
          }
        }
      }
    }

    const createCustomerResponse = await this.client.createUnitCustomer(customerRequest);
    console.log(
      `create customer response: ${JSON.stringify(createCustomerResponse, undefined, 2)}`
    )

    const depositAccountRequest = {
      "type": "depositAccount",
      "id": "1",
      "attributes": {
        "createdAt": "2000-05-11T10:19:30.409Z",
        "name": "Peter Parker",
        "status": "Open",
        "depositProduct": "checking",
        "routingNumber": "812345678",
        "accountNumber": "1000000002",
        "currency": "USD",
        "balance": 10000,
        "hold": 0,
        "available": 10000,
        "tags": {
          "purpose": "checking"
        }
      },
      "relationships": {
        "customer": {
          "data": {
            "type": "customer",
            "id": "8"
          }
        }
      }
    }

    const createDepositAccountResponse = await this.client.createUnitDepositAccount(depositAccountRequest);
    console.log(
      `create deposit account response: ${JSON.stringify(createDepositAccountResponse, undefined, 2)}`
    )

    const pendingAchPaymentRequest = {
      "type": "achPayment",
      "id": "50",
      "attributes": {
        "createdAt": "2020-01-13T16:01:19.346Z",
        "status": "Pending",
        "counterparty": {
          "routingNumber": "812345678",
          "accountNumber": "12345569",
          "accountType": "Checking",
          "name": "Jane Doe"
        },
        "description": "Funding",
        "direction": "Credit",
        "amount": 10000
      },
      "relationships": {
        "account": {
          "data": {
            "type": "depositAccount",
            "id": "1"
          }
        },
        "customer": {
          "data": {
            "type": "individualCustomer",
            "id": "8"
          }
        },
        "counterparty": {
          "data": {
            "type": "counterparty",
            "id": "4567"
          }
        },
        "transaction": {
          "data": {
            "type": "transaction",
            "id": "4003"
          }
        }
      }
    }

    const createPaymentResponse = await this.client.createUnitPayment(pendingAchPaymentRequest);
    console.log(
      `create ach payment response: ${JSON.stringify(createPaymentResponse, undefined, 2)}`
    )

    const sentAchPaymentRequest = {
      "type": "achPayment",
      "id": "50",
      "attributes": {
        "createdAt": "2020-01-13T16:01:19.346Z",
        "status": "Sent",
        "counterparty": {
          "routingNumber": "812345678",
          "accountNumber": "12345569",
          "accountType": "Checking",
          "name": "Jane Doe"
        },
        "description": "Funding",
        "direction": "Credit",
        "amount": 10000
      },
      "relationships": {
        "account": {
          "data": {
            "type": "depositAccount",
            "id": "1"
          }
        },
        "customer": {
          "data": {
            "type": "individualCustomer",
            "id": "8"
          }
        },
        "counterparty": {
          "data": {
            "type": "counterparty",
            "id": "4567"
          }
        },
        "transaction": {
          "data": {
            "type": "transaction",
            "id": "4003"
          }
        }
      }
    }

    const updatePaymentResponse = await this.client.updateUnitPayment(sentAchPaymentRequest);
    console.log(
      `update ach payment response: ${JSON.stringify(updatePaymentResponse, undefined, 2)}`
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
