# Contributing

This document is meant for maintainers.

## Updating Proto Definitions

If you need to update this repo's sandbar.proto file to match the main repo,
first copy the file to packages/sandbar/proto/sandbar.proto in this repo. Next,
run the following command to generate the necessary TypeScript code:

```sh
pnpm --filter sandbar codegen
```

## Building the dist Bundle

```sh
# we use pnpm to build
npm install --global pnpm
pnpm install  # if you haven't already
pnpm build    # built to `./dist` dir
```

## Versioning & publishing the dist Bundle

This section documents how to create a new version of the library and publish it
to npm for use by consumers.

### NPM permissions

Ask someone to add your npm account to the list of "Collaborators" for the
package [in npm](https://www.npmjs.com/package/sandbar/access).

### Pre-requisites

Install (`pre-commit`)[https://github.com/pre-commit/pre-commit]. You can do so
by running one of the commands below.

```sh
# via hoembrew
brew install pre-commit

# or by pip if you prefer
pip install pre-commit

# if pip points to python2, you'll need to specify pip3
pip3 install pre-commit
```

_Why do I need pre-commit to publish?_

The publishing script autofixes formatting via . Without pre-commit, the version
update script will fail, which in turn means the publish command will also fail.

### Publish

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
