#!/usr/bin/env ts-node-script
import { program } from "commander"
import { execFile } from "child_process"
import path from "path"
import { promisify } from "util"
import { promises as fs } from "fs"

const execFileAsync = promisify(execFile)

async function main() {
  program.requiredOption("--googleapis <path>", "path to googleapi repo")
  program.parse(process.argv)
  const { googleapis } = program.opts()
  const repoRoot = path.relative(path.join(__dirname, "../.."), process.cwd())
  const protoDir = path.join(repoRoot, "proto")
  const googleapisDir = path.join(process.cwd(), googleapis)
  const outDir = path.join(repoRoot, "src/generated")

  try {
    await fs.mkdir(outDir)
  } catch (error) {
    if (!isError(error) || error.code !== "EEXIST") {
      throw error
    }
  }

  await execFileAsync("protoc", [
    `-I=${protoDir}`,
    `-I=${googleapisDir}`,
    `--ts_out=${outDir}`,
    "--ts_opt=long_type_string",
    "--ts_opt=generate_dependencies",
    "sandbar.proto",
  ])
}

function isError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error
}

if (require.main == module) {
  main()
}
