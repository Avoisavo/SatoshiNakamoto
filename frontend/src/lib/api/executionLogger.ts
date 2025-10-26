const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface ExecutionLog {
  id?: string;
  workflowId: string;
  status: "pending" | "running" | "success" | "error";
  startTime?: number;
  endTime?: number;
  logs?: Record<string, unknown>[];
  errorMessage?: string;
  txHashes?: string[];
}

/**
 * Log the start of a workflow execution
 */
export async function logExecutionStart(params: {
  workflowId: string;
  logs?: Record<string, unknown>[];
}): Promise<ExecutionLog> {
  const response = await fetch(`${API_URL}/api/executions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflowId: params.workflowId,
      status: "running",
      logs: params.logs || [],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to log execution");
  }

  return response.json();
}

/**
 * Update execution log with progress
 */
export async function updateExecutionLog(
  executionId: string,
  params: {
    status?: "running" | "success" | "error";
    logs?: Record<string, unknown>[];
    errorMessage?: string;
    txHashes?: string[];
    endTime?: number;
  }
): Promise<ExecutionLog> {
  const response = await fetch(`${API_URL}/api/executions/${executionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update execution log");
  }

  return response.json();
}

/**
 * Log successful workflow execution
 */
export async function logExecutionSuccess(params: {
  executionId: string;
  logs: Record<string, unknown>[];
  txHashes?: string[];
}): Promise<ExecutionLog> {
  return updateExecutionLog(params.executionId, {
    status: "success",
    logs: params.logs,
    txHashes: params.txHashes,
    endTime: Date.now(),
  });
}

/**
 * Log failed workflow execution
 */
export async function logExecutionError(params: {
  executionId: string;
  logs: Record<string, unknown>[];
  errorMessage: string;
}): Promise<ExecutionLog> {
  return updateExecutionLog(params.executionId, {
    status: "error",
    logs: params.logs,
    errorMessage: params.errorMessage,
    endTime: Date.now(),
  });
}

/**
 * Get execution history for a workflow
 */
export async function getExecutionHistory(
  workflowId: string
): Promise<ExecutionLog[]> {
  const response = await fetch(`${API_URL}/api/executions/${workflowId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch execution history");
  }

  return response.json();
}

/**
 * Add a log entry to an execution
 */
export async function addExecutionLogEntry(
  executionId: string,
  currentLogs: Record<string, unknown>[],
  newLogEntry: {
    nodeId: string;
    nodeTitle: string;
    timestamp: string;
    status: "success" | "error";
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string;
    txHash?: string;
  }
): Promise<ExecutionLog> {
  const updatedLogs = [...currentLogs, newLogEntry];

  return updateExecutionLog(executionId, {
    logs: updatedLogs,
  });
}
