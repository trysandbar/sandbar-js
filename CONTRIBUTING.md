# Contributing

This document is meant for maintainers.

## Building the dist Bundle

```sh
# we use pnpm to build
npm install --global pnpm
pnpm install  # if you haven't already
pnpm build    # built to `./dist` dir
```

## Versioning & publishing the dist Bundle

Ask someone to add your npm account to the list of "Collaborators" for the
package [in npm](https://www.npmjs.com/package/sandbar/access).

Running `lerna publish` or `lerna version` will:

- bump the version in all `package.json` files
- publish a tag to github

Additionally, `publish` will publish the package(s) to npm.

```sh
# from repo root
pnpm adduser   # login as yourself
lerna publish  # tag the next release version and publish to npm
```

If you already updated the version and pushed a tag, and just want to release,
use
[`from-git`](https://github.com/lerna/lerna/tree/main/commands/publish#bump-from-git):

```sh
lerna publish from-git
```

_Note: Packages in the `examples/` directory should be marked as
`private: true`. This will prevent those packages from being published to npm._
