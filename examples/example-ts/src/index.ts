import * as sandbar from "sandbar"

async function main() {
  const client = new sandbar.Client()

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
  ])
}

if (require.main == module) {
  main()
}
