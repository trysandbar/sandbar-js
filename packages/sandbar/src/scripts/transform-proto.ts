#!/usr/bin/env ts-node-script

/**
 * Parses the typescript output of ts-protobuf,
 * and produces a file with similar interface definitions,
 * but with required fields not marked as nullable keys.
 *
 * Specifically, `key?: value` becomes `key: value` for message types,
 * and the ` | { "oneofKind": undefined }` is removed from oneof types.
 *
 * The input is `sandbar.ts` and output is `sandbar.narrow.ts`.
 */

import ts from "typescript"
import { promises as fs } from "fs"
import { assertExhaustiveSwitch } from "../assertions"
import path from "path"

const transformConfig: { [key: string]: string[] } = {
  Account: ["accountIdentifier"],
  AccountEntityLink: ["accountId", "entityId"],
  Alert: ["investigationTarget"],
  EntityQuery: ["id"],
  EntityQueryIdParam: ["entityId"],
  Event: ["payload"],
  GetAccountRequest: ["id"],
  GetAccountsForEntityRequest: ["request"],
  GetEntityRequest: ["request"],
  GetRuleOutputHistoryForEntityRequest: ["request"],
  GetRuleOutputHistoryForEntityResponse: ["response"],
  GetTransactionsForEntityRequest: ["request"],
  InvestigationTarget: ["target"],
  RuleOutput: ["investigationTarget"],
  RuleOutputResponse: ["investigationTarget"],
  Transaction: ["accountIdentifier"],
}

function isNamePresentInConfig(interfaceName: string, propertyName: string) {
  if (!Object.keys(transformConfig).includes(interfaceName)) {
    return false
  }

  const fields = transformConfig[interfaceName]
  return fields.includes(propertyName)
}

function propertyNameString(node: ts.PropertyName): string {
  if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) {
    return node.escapedText.toString()
  } else if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text
  } else if (ts.isComputedPropertyName(node)) {
    throw new Error("unknown typescript AST node 'ComputedPropertyName'")
  } else {
    assertExhaustiveSwitch("ts.PropertyName")
  }
}

function isTypeElementWitKey(node: ts.TypeLiteralNode, key: string): boolean {
  for (const member of node.members) {
    const memberName = member.name
    if (memberName !== undefined && propertyNameString(memberName) === key) {
      return true
    }
  }
  return false
}

function isNodeConfiguredForTransform(node: ts.Node) {
  if (!ts.isPropertySignature(node)) {
    return false
  }

  const interfaceDecl = node.parent
  if (
    interfaceDecl === undefined ||
    !ts.isInterfaceDeclaration(interfaceDecl)
  ) {
    return false
  }

  if (
    interfaceDecl.parent === undefined ||
    !ts.isSourceFile(interfaceDecl.parent)
  ) {
    return false
  }

  const propertyName = propertyNameString(node.name)
  const interfaceName = interfaceDecl.name.text

  return isNamePresentInConfig(interfaceName, propertyName)
}

function importForEnum(
  node: ts.EnumDeclaration,
  factory: ts.NodeFactory,
  importPath: string
) {
  return factory.createImportDeclaration(
    undefined, // decorators
    undefined, // modifiers
    factory.createImportClause(
      false, // isTypeOnly
      undefined, // name
      factory.createNamedImports([
        // namedBindings
        factory.createImportSpecifier(
          false, // isTypeOnly
          undefined, // propertyName
          node.name // name
        ),
      ])
    ),
    factory.createStringLiteral(importPath) // module specifier
  )
}

function exportForEum(node: ts.EnumDeclaration, factory: ts.NodeFactory) {
  return factory.createExportDeclaration(
    undefined, // decorators
    undefined, // modifiers
    false, // isTypeOnly
    factory.createNamedExports([
      factory.createExportSpecifier(
        false, // isTypeOnly
        undefined, // propertyName
        node.name // name
      ),
    ]),
    undefined, // moduleSpecifier
    undefined // assertClause
  )
}

/**
 * transforms message field to be required,
 * or undefined if the node is detected to not be a message field.
 *
 * @param node AST node to transform
 * @param factory node factory to use when modifying the AST
 * @returns transformed message field AST node,
 *    or undefined if the AST node does not represent a protobuf message field
 */
function transformMessageFieldToRequired(
  node: ts.PropertySignature,
  factory: ts.NodeFactory
): ts.Node | undefined {
  // verify that the property looks like a message field,
  // i.e. the property type is a type reference.
  const type = node.type
  if (type === undefined || !ts.isTypeReferenceNode(type)) {
    return
  }

  const name = propertyNameString(node.name)
  const questionToken = node.questionToken
  if (questionToken === undefined) {
    console.warn(
      `marking required message field ${name} that is already required; noop.`
    )
    return
  }

  return factory.updatePropertySignature(
    node,
    undefined, // modifiers
    node.name,
    undefined, // question token
    node.type
  )
}

/**
 * determine whether a TypeNode node is the undefined default
 * for a protobuf oneof field.
 *
 * Note that this requires the TypeNode's parent to be a UnionTypeNode,
 * and the TypeNode's grandparent to be a PropertySignature,
 * for which the name is configured to enforce requiredness.
 *
 * @param node AST node to detect whether it's a oneof union undefined node
 * @returns true if this AST represents an unset value for a oneof union,
 *    false otherwise.
 */
function isOneofUnionUndefinedTypeNode(node: ts.TypeNode): boolean {
  if (node.parent === undefined || !ts.isUnionTypeNode(node.parent)) {
    return false
  }

  if (
    node.parent.parent === undefined ||
    !isNodeConfiguredForTransform(node.parent.parent)
  ) {
    return false
  }

  // oneofs are a union of type literals.
  // if there's a non union then skip.
  if (!ts.isTypeLiteralNode(node)) {
    return false
  }

  // if any of the type literals don't have a "oneofKind" type tag,
  // then it's not a discriminated union, so it's not a oneof.
  if (!isTypeElementWitKey(node, "oneofKind")) {
    return false
  }

  // oneof type literals elements should always have exactly 1 or 2 keys set.
  // if there are not exactly 1 or 2 members set, this is not a oneof union.
  if (![1, 2].includes(node.members.length)) {
    return false
  }

  // the type literal members should all be property signatures.
  //
  // construct `members` such that
  // it can only be the same length as type.members
  // if all members are a property signature.
  const members = node.members.flatMap((member) => {
    if (ts.isPropertySignature(member)) {
      return [member]
    }

    return []
  })

  // length mismatch means
  // there exist a mamber that is not a property signature.
  if (members.length !== node.members.length) {
    return false
  }

  // of those, assume ones with 2 keys are structured as a oneof value:
  //
  // ```
  // {
  //   oneofKind: "foo",
  //   foo: TypeOfFoo,
  // }
  // ```
  if (node.members.length !== 1) {
    return false
  }

  // type of the property (as opposed to the name) should be
  // the "undefined" keyword.
  // otherwise, this node is not a oneof union.
  //
  // ```
  // {
  //   oneofKind: undefined
  // }
  // ```
  //
  // if this node is not a oneof union, bail and return the original node.
  const member = members[0]
  const memberType = member.type
  if (memberType?.kind !== ts.SyntaxKind.UndefinedKeyword) {
    return false
  }

  return true
}

function getTransformerFactory(
  importPath: string
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const { factory } = context
    const visitor: ts.Visitor = (node) => {
      if (!ts.isSourceFile(node) && ts.isSourceFile(node.parent)) {
        // convert all top-level enum declarations to imports
        if (ts.isEnumDeclaration(node)) {
          return [
            importForEnum(node, factory, importPath),
            exportForEum(node, factory),
          ]
        }

        // remove all remaining top-level nodes except interface declarations
        if (!ts.isInterfaceDeclaration(node)) {
          return
        }
      }

      if (ts.isTypeNode(node) && isOneofUnionUndefinedTypeNode(node)) {
        // oneof unions
        return
      } else if (
        ts.isPropertySignature(node) &&
        isNodeConfiguredForTransform(node)
      ) {
        // message fields that should be required
        const transformResult = transformMessageFieldToRequired(node, factory)
        if (transformResult !== undefined) {
          return transformResult
        }
      }

      return ts.visitEachChild(node, visitor, context)
    }

    return (sourceFile) => {
      return ts.visitNode(sourceFile, visitor)
    }
  }
}

async function main() {
  const generatedDir = "src/generated"
  const src = ts.createSourceFile(
    "sandbar.ts",
    await fs.readFile(path.join(generatedDir, "private/sandbar.ts"), "utf8"),
    ts.ScriptTarget.ES2021,
    true
  )

  const transformerFactory = getTransformerFactory("./private/sandbar")
  const result = ts.transform(src, [transformerFactory])
  const files = result.transformed
  if (files.length > 1) {
    throw new Error("only expected transform result to contain 1 file")
  }

  const printer = ts.createPrinter()
  const file = files[0]
  await fs.writeFile(
    path.join(generatedDir, "sandbar.ts"),
    printer.printFile(file)
  )
}

if (require.main == module) {
  main()
}
