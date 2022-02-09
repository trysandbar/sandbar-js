import * as sandbar from "sandbar"

async function main() {
  const client = new sandbar.Client("hello.dev")

  // Send data to sandbar
  await client.submitEvents([
    {
      type: sandbar.EventType.CREATE,
      payload: {
        oneofKind: "entity",
        entity: {},
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
            bankName: "Some Bank",
            accountNumber: "12341234",
          },
        },
      },
      incomplete: false,
    },
  ])
}

if (require.main == module) {
  main()
}
