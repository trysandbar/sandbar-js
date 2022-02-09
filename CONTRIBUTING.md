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
# from repo root
pnpm adduser   # login as yourself
lerna publish  # tag the next release version and publish to npm
```

If you already updated the version and pushed a tag, and just want to release:

```sh
lerna publish from-git
```

See the
[`from-git` docs](https://github.com/lerna/lerna/tree/main/commands/publish#bump-from-git)
for more info
