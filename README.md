# sandbar-js

node / javascript / typescript library for sandbar

## Basic Usage Example

First, add this library to your project:

```console
$ npm add sandbar
```

Then, use it in a file somewhere:

```typescript
import * as sandbar from "sandbar";

async function foo() {
  // or "mycompany" for prod
  const client = new sandbar.Client({ subdomain: "mycompany.sandbox" });
  const submitResult = await client.submitEvents([
    {
      /* your entity / account / transaction / etc here */
    },
    {
      /* multiple events are supported */
    },
  ]);

  // pretty-print the API call result as JSON to the console
  console.log(JSON.stringify(submitResult, undefined, 2));
}
```

All client actions return a promise. If you don't like using `await`, you can
also consume the promie via the `.then()` callback.

```typescript
client
  .submitEvents([])
  .then((submitResult) =>
    console.log(JSON.stringify(submitResult, undefined, 2))
  );
```

## Detailed Example

This repo includes a more detailed example as a
[package](https://github.com/trysandbar/sandbar-js/tree/main/examples/example-ts).
The example package includes a
[README](https://github.com/trysandbar/sandbar-js/blob/main/examples/example-ts/README.md)
as well.
