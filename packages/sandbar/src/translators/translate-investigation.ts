import * as publicapi from "../generated/sandbar"
import * as grpc from "../generated/private/sandbar"

function translateTarget(
  grpcTarget?: grpc.InvestigationTarget
): publicapi.InvestigationTarget {
  if (grpcTarget === undefined) {
    throw new Error(
      "Server returned a response without an investigation target, that is illegal"
    )
  }

  const { sandbarTargetId } = grpcTarget
  if (sandbarTargetId.trim().length === 0) {
    throw new Error(
      "Server responded with an empty sandbar ID string, that is illegal"
    )
  }

  return {
    sandbarTargetId,
  }
}

function translateOutput(grpcOutput: grpc.RuleOutput): publicapi.RuleOutput {
  const { investigationTarget: grpcTarget, ...outputRest } = grpcOutput
  const investigationTarget = translateTarget(grpcTarget)
  return {
    investigationTarget,
    ...outputRest,
  }
}

function translateAlert(grpcAlert: grpc.Alert): publicapi.Alert {
  const {
    investigationTarget: grpcTarget,
    outputs: grpcOutputs,
    ...alertRest
  } = grpcAlert
  const investigationTarget = translateTarget(grpcTarget)
  const outputs = grpcOutputs.map(translateOutput)
  return {
    investigationTarget,
    outputs,
    ...alertRest,
  }
}

export function translateInvestigation(
  grpcInvestigation: grpc.Investigation
): publicapi.Investigation {
  const {
    target: grpcTarget,
    alerts: grpcAlerts,
    ...investigationRest
  } = grpcInvestigation
  const target = grpcTarget.map(translateTarget)
  const alerts = grpcAlerts.map(translateAlert)
  return {
    target,
    alerts,
    ...investigationRest,
  }
}
