function assertExhaustiveSwitch(switchKey: string): never {
  throw new Error(`Switch statement for "${switchKey}" was not exhaustive`)
}

export { assertExhaustiveSwitch }
