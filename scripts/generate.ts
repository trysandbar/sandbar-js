#!/usr/bin/env ts-node-script
import { program } from "commander"
import { execFile } from "child_process"
import path from "path"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

async function main() {
  program.requiredOption("--googleapis <path>", "path to googleapi repo")
  program.parse(process.argv)
  const { googleapis } = program.opts()
  const repoRoot = path.relative(path.join(__dirname, ".."), process.cwd())
  const protoDir = path.join(repoRoot, "proto")
  const googleapisDir = path.join(process.cwd(), googleapis)
  const outDir = path.join(repoRoot, "generated")

  await execFileAsync("protoc", [
    `-I=${protoDir}`,
    `-I=${googleapisDir}`,
    `--ts_out=${outDir}`,
    "--ts_opt=long_type_string",
    "sandbar.proto",
  ])
}

if (require.main == module) {
  main().catch(console.error)
}
