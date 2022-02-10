# sandbar-js

node / javascript / typescript library for sandbar

## Usage example

```typescript
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
