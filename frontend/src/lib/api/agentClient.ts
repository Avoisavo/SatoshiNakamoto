/**
 * API Client for Hedera Agent System
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AgentStatus {
  telegram: {
    running: boolean;
    activeChats: Record<string, unknown>[];
    pendingNotifications: Record<string, unknown>[];
  };
  aiDecision: {
    running: boolean;
  };
  bridgeExecutor: {
    running: boolean;
    pendingExecutions: Record<string, unknown>[];
    executionHistory: Record<string, unknown>[];
  };
  timestamp: string;
}

export interface TelegramMessage {
  text: string;
  chatId: string;
  userId: string;
}

export interface Notification {
  correlationId: string;
  type: string;
  chatId: string;
  message: string;
  level?: string;
  shouldExecuteBridge?: boolean;
  bridgeParams?: Record<string, unknown>;
  timestamp: string;
}

export interface BridgeExecution {
  correlationId: string;
  sourceChain: string;
  targetChain: string;
  token: string;
  amount: number;
  recipient?: string;
  requestedAt: string;
  requestedBy: string;
  status: "pending" | "executing" | "success" | "failed";
  transactionHash?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

/**
 * Get agent system status
 */
export async function getAgentStatus(): Promise<AgentStatus> {
  const response = await fetch(`${API_URL}/api/agents/status`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get agent status");
  }

  return response.json();
}

/**
 * Start all agents
 */
export async function startAgents(): Promise<{ message: string; agents: Record<string, unknown> }> {
  const response = await fetch(`${API_URL}/api/agents/start`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start agents");
  }

  return response.json();
}

/**
 * Stop all agents
 */
export async function stopAgents(): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/agents/stop`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to stop agents");
  }

  return response.json();
}

/**
 * Send message from Telegram/User
 */
export async function sendTelegramMessage(
  message: TelegramMessage
): Promise<{ message: string; correlationId: string; chatId: string }> {
  const response = await fetch(`${API_URL}/api/agents/telegram/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  return response.json();
}

/**
 * Get Telegram notifications
 */
export async function getNotifications(
  chatId?: string
): Promise<{ notifications: Notification[]; count: number }> {
  const url = chatId
    ? `${API_URL}/api/agents/telegram/notifications?chatId=${chatId}`
    : `${API_URL}/api/agents/telegram/notifications`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get notifications");
  }

  return response.json();
}

/**
 * Clear notifications
 */
export async function clearNotifications(
  correlationId: string
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_URL}/api/agents/telegram/notifications/${correlationId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to clear notifications");
  }

  return response.json();
}

/**
 * Get pending bridge executions
 */
export async function getPendingBridges(): Promise<{
  executions: BridgeExecution[];
  count: number;
}> {
  const response = await fetch(`${API_URL}/api/agents/bridge/pending`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get pending bridges");
  }

  return response.json();
}

/**
 * Get bridge execution by correlation ID
 */
export async function getBridgeExecution(
  correlationId: string
): Promise<BridgeExecution> {
  const response = await fetch(
    `${API_URL}/api/agents/bridge/execution/${correlationId}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get bridge execution");
  }

  return response.json();
}

/**
 * Mark bridge execution as started
 */
export async function markBridgeStarted(
  correlationId: string,
  transactionHash: string
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_URL}/api/agents/bridge/execution/${correlationId}/start`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transactionHash }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to mark bridge started");
  }

  return response.json();
}

/**
 * Complete bridge execution
 */
export async function completeBridge(
  correlationId: string,
  transactionHash: string,
  status: "success" | "failed",
  error?: string
): Promise<{ message: string; success: boolean }> {
  const response = await fetch(
    `${API_URL}/api/agents/bridge/execution/${correlationId}/complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transactionHash, status, error }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to complete bridge");
  }

  return response.json();
}

/**
 * Simulate bridge execution (for testing)
 */
export async function simulateBridge(
  correlationId: string
): Promise<{ message: string; success: boolean }> {
  const response = await fetch(
    `${API_URL}/api/agents/bridge/execution/${correlationId}/simulate`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to simulate bridge");
  }

  return response.json();
}

/**
 * Get bridge execution history
 */
export async function getBridgeHistory(
  limit: number = 20
): Promise<{ executions: BridgeExecution[]; count: number }> {
  const response = await fetch(
    `${API_URL}/api/agents/bridge/history?limit=${limit}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get bridge history");
  }

  return response.json();
}

/**
 * Poll for notifications until response received
 */
export async function pollForNotifications(
  chatId: string,
  timeout: number = 30000,
  interval: number = 2000
): Promise<Notification[]> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const { notifications } = await getNotifications(chatId);

    if (notifications.length > 0) {
      return notifications;
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error("Timeout waiting for notifications");
}

/**
 * Poll for pending bridge executions
 */
export async function pollForPendingBridge(
  timeout: number = 30000,
  interval: number = 2000
): Promise<BridgeExecution | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const { executions } = await getPendingBridges();

    if (executions.length > 0) {
      return executions[0]; // Return first pending
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return null;
}
