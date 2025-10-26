/**
 * API Routes for Hedera Agent Control
 *
 * Provides REST API endpoints to control and monitor Hedera agents
 */

import express from "express";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Global agent instances (initialized by server.js)
let agentSystem = null;

/**
 * Initialize agent system (called from server.js)
 */
export function initializeAgentSystem(system) {
  agentSystem = system;
  console.log("✅ Agent system initialized in routes");
}

/**
 * Get agent system status
 */
router.get("/status", async (req, res) => {
  try {
    if (!agentSystem) {
      return res.status(503).json({ error: "Agent system not initialized" });
    }

    const status = {
      telegram: {
        running: agentSystem.telegramAgent?.isRunning || false,
        activeChats: agentSystem.telegramAgent?.getActiveChats() || [],
        pendingNotifications:
          agentSystem.telegramAgent?.getPendingNotifications() || [],
      },
      aiDecision: {
        running: agentSystem.aiAgent?.isRunning || false,
      },
      bridgeExecutor: {
        running: agentSystem.bridgeAgent?.isRunning || false,
        pendingExecutions:
          agentSystem.bridgeAgent?.getPendingExecutions() || [],
        executionHistory:
          agentSystem.bridgeAgent?.getExecutionHistory(10) || [],
      },
      timestamp: new Date().toISOString(),
    };

    res.json(status);
  } catch (error) {
    console.error("Error getting agent status:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start all agents
 */
router.post("/start", async (req, res) => {
  try {
    if (!agentSystem) {
      return res.status(503).json({ error: "Agent system not initialized" });
    }

    await agentSystem.start();

    res.json({
      message: "All agents started successfully",
      agents: {
        telegram: agentSystem.telegramAgent.isRunning,
        aiDecision: agentSystem.aiAgent.isRunning,
        bridgeExecutor: agentSystem.bridgeAgent.isRunning,
      },
    });
  } catch (error) {
    console.error("Error starting agents:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stop all agents
 */
router.post("/stop", async (req, res) => {
  try {
    if (!agentSystem) {
      return res.status(503).json({ error: "Agent system not initialized" });
    }

    await agentSystem.stop();

    res.json({
      message: "All agents stopped successfully",
    });
  } catch (error) {
    console.error("Error stopping agents:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send message from Telegram
 * POST /api/agents/telegram/message
 * Body: { text, chatId, userId }
 */
router.post("/telegram/message", async (req, res) => {
  try {
    if (!agentSystem || !agentSystem.telegramAgent) {
      return res.status(503).json({ error: "Telegram agent not available" });
    }

    const { text, chatId, userId } = req.body;

    if (!text || !chatId || !userId) {
      return res.status(400).json({
        error: "Missing required fields: text, chatId, userId",
      });
    }

    const correlationId = await agentSystem.telegramAgent.receiveFromTelegram({
      text,
      chatId,
      userId,
    });

    res.json({
      message: "Message received and forwarded to AI agent",
      correlationId,
      chatId,
    });
  } catch (error) {
    console.error("Error processing Telegram message:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Telegram notifications
 * GET /api/agents/telegram/notifications?chatId=xxx
 */
router.get("/telegram/notifications", async (req, res) => {
  try {
    if (!agentSystem || !agentSystem.telegramAgent) {
      return res.status(503).json({ error: "Telegram agent not available" });
    }

    const { chatId } = req.query;
    const notifications =
      agentSystem.telegramAgent.getPendingNotifications(chatId);

    res.json({
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear Telegram notifications
 * DELETE /api/agents/telegram/notifications/:correlationId
 */
router.delete("/telegram/notifications/:correlationId", async (req, res) => {
  try {
    if (!agentSystem || !agentSystem.telegramAgent) {
      return res.status(503).json({ error: "Telegram agent not available" });
    }

    const { correlationId } = req.params;
    agentSystem.telegramAgent.clearNotifications(correlationId);

    res.json({
      message: "Notifications cleared",
      correlationId,
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending bridge executions
 * GET /api/agents/bridge/pending
 */
router.get("/bridge/pending", async (req, res) => {
  try {
    if (!agentSystem || !agentSystem.bridgeAgent) {
      return res.status(503).json({ error: "Bridge agent not available" });
    }

    const pending = agentSystem.bridgeAgent.getPendingExecutions();

    res.json({
      executions: pending,
      count: pending.length,
    });
  } catch (error) {
    console.error("Error getting pending executions:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get bridge execution by correlation ID
 * GET /api/agents/bridge/execution/:correlationId
 */
router.get("/bridge/execution/:correlationId", async (req, res) => {
  try {
    if (!agentSystem || !agentSystem.bridgeAgent) {
      return res.status(503).json({ error: "Bridge agent not available" });
    }

    const { correlationId } = req.params;
    const execution = agentSystem.bridgeAgent.getExecution(correlationId);

    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }

    res.json(execution);
  } catch (error) {
    console.error("Error getting execution:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark bridge execution as started
 * POST /api/agents/bridge/execution/:correlationId/start
 * Body: { transactionHash }
 */
router.post("/bridge/execution/:correlationId/start", async (req, res) => {
  try {
    if (!agentSystem || !agentSystem.bridgeAgent) {
      return res.status(503).json({ error: "Bridge agent not available" });
    }

    const { correlationId } = req.params;
    const { transactionHash } = req.body;

    if (!transactionHash) {
      return res.status(400).json({ error: "Missing transactionHash" });
    }

    agentSystem.bridgeAgent.markExecutionStarted(
      correlationId,
      transactionHash
    );

    res.json({
      message: "Execution marked as started",
      correlationId,
      transactionHash,
    });
  } catch (error) {
    console.error("Error marking execution started:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Complete bridge execution
 * POST /api/agents/bridge/execution/:correlationId/complete
 * Body: { transactionHash, status, error? }
 */
router.post("/bridge/execution/:correlationId/complete", async (req, res) => {
  try {
    if (!agentSystem || !agentSystem.bridgeAgent) {
      return res.status(503).json({ error: "Bridge agent not available" });
    }

    const { correlationId } = req.params;
    const { transactionHash, status, error } = req.body;

    if (!transactionHash || !status) {
      return res.status(400).json({
        error: "Missing required fields: transactionHash, status",
      });
    }

    if (!["success", "failed"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be 'success' or 'failed'",
      });
    }

    const result = await agentSystem.bridgeAgent.completeBridgeExecution(
      correlationId,
      transactionHash,
      status,
      error
    );

    res.json({
      message: "Bridge execution completed",
      ...result,
    });
  } catch (error) {
    console.error("Error completing execution:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Simulate bridge execution (for testing)
 * POST /api/agents/bridge/execution/:correlationId/simulate
 */
router.post("/bridge/execution/:correlationId/simulate", async (req, res) => {
  try {
    if (!agentSystem || !agentSystem.bridgeAgent) {
      return res.status(503).json({ error: "Bridge agent not available" });
    }

    const { correlationId } = req.params;

    const result = await agentSystem.bridgeAgent.simulateBridgeExecution(
      correlationId
    );

    res.json({
      message: "Bridge execution simulated",
      ...result,
    });
  } catch (error) {
    console.error("Error simulating execution:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get bridge execution history
 * GET /api/agents/bridge/history?limit=20
 */
router.get("/bridge/history", async (req, res) => {
  try {
    if (!agentSystem || !agentSystem.bridgeAgent) {
      return res.status(503).json({ error: "Bridge agent not available" });
    }

    const limit = parseInt(req.query.limit) || 50;
    const history = agentSystem.bridgeAgent.getExecutionHistory(limit);

    res.json({
      executions: history,
      count: history.length,
    });
  } catch (error) {
    console.error("Error getting execution history:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
