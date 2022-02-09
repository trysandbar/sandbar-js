# Contributing

This document is meant for maintainers.

## Building the dist bundle

```sh
# we use pnpm to build
npm install --global pnpm
pnpm install  # if you haven't already
pnpm build    # built to `./dist` dir
```

## Publishing the dist bundle

Ask someone to add your npm account to the list of "Collaborators" for the
package [in npm](https://www.npmjs.com/package/sandbar/access).

Ensure the version in the `package.json` is updated to what you want it to be.
We should not overwrite an existing previous release with newer code.

```sh
# in ./packages/sandbar
npm adduser  # login as yourself
npm publish
```
