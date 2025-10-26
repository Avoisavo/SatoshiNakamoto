/**
 * Bridge Executor Agent using Hedera Agent Kit
 *
 * Executes cross-chain bridge transactions using Avail Nexus
 */

import { BaseKitAgent } from "./base-kit-agent.js";
import {
  AgentId,
  MessageType,
  createBridgeExecuteResponse,
} from "../hedera/a2a-protocol.js";

export class BridgeExecutorKitAgent extends BaseKitAgent {
  constructor(config) {
    super({
      ...config,
      agentId: AgentId.BRIDGE_EXECUTOR,
      systemPrompt:
        "You are a bridge executor agent for cross-chain operations.",
    });

    this.pendingExecutions = new Map(); // correlationId -> execution details
    this.executionHistory = []; // Track all executions
  }

  /**
   * Handle incoming A2A messages
   */
  async handleMessage(message) {
    const { type, payload, from, correlationId } = message;

    switch (type) {
      case MessageType.BRIDGE_EXEC_REQ:
        await this.handleBridgeRequest(message);
        break;
      default:
        console.log(
          `[${this.agentId}] Received ${type} (no handler implemented)`
        );
    }
  }

  /**
   * Handle bridge execution request
   */
  async handleBridgeRequest(message) {
    const { payload, from, correlationId } = message;
    const { sourceChain, targetChain, token, amount, recipient } = payload;

    console.log(`[${this.agentId}] 🌉 Bridge execution request received`);
    console.log(`[${this.agentId}]   ${sourceChain} → ${targetChain}`);
    console.log(`[${this.agentId}]   Amount: ${amount} ${token}`);

    this.updateConversation(correlationId, {
      state: "executing",
      sourceChain,
      targetChain,
      token,
      amount,
      recipient,
    });

    // Store as pending (to be executed via API/frontend)
    this.pendingExecutions.set(correlationId, {
      correlationId,
      sourceChain,
      targetChain,
      token,
      amount,
      recipient,
      requestedAt: new Date().toISOString(),
      requestedBy: from,
      status: "pending",
    });

    console.log(
      `[${this.agentId}] ⏳ Execution pending (requires wallet interaction)`
    );
    console.log(`[${this.agentId}]   Correlation: ${correlationId}`);

    this.emit("bridgeRequested", {
      correlationId,
      sourceChain,
      targetChain,
      token,
      amount,
    });

    // Note: Actual execution happens via frontend/API when user confirms with wallet
    // This agent tracks the execution and sends response when complete
  }

  /**
   * Mark bridge execution as started (called when frontend begins execution)
   */
  markExecutionStarted(correlationId, transactionHash) {
    const execution = this.pendingExecutions.get(correlationId);
    if (execution) {
      execution.status = "executing";
      execution.transactionHash = transactionHash;
      execution.startedAt = new Date().toISOString();

      this.updateConversation(correlationId, {
        state: "in_progress",
        transactionHash,
      });

      console.log(`[${this.agentId}] 🔄 Execution started: ${transactionHash}`);
    }
  }

  /**
   * Complete bridge execution (called when transaction confirms)
   * @param {string} correlationId
   * @param {string} transactionHash
   * @param {string} status - "success" or "failed"
   * @param {string} [error] - Error message if failed
   */
  async completeBridgeExecution(correlationId, transactionHash, status, error) {
    const execution = this.pendingExecutions.get(correlationId);

    if (!execution) {
      console.error(
        `[${this.agentId}] No pending execution found for ${correlationId}`
      );
      return;
    }

    console.log(`[${this.agentId}] ✅ Bridge execution complete`);
    console.log(`[${this.agentId}]   Status: ${status}`);
    console.log(`[${this.agentId}]   Tx: ${transactionHash}`);

    // Update execution record
    execution.status = status;
    execution.transactionHash = transactionHash;
    execution.completedAt = new Date().toISOString();
    if (error) execution.error = error;

    // Move to history
    this.executionHistory.push(execution);
    this.pendingExecutions.delete(correlationId);

    // Update conversation
    this.updateConversation(correlationId, {
      state: status === "success" ? "completed" : "failed",
      transactionHash,
      error,
    });

    // Send response back to AI Decision Agent
    const response = createBridgeExecuteResponse(
      this.agentId,
      AgentId.AI_DECISION,
      status,
      transactionHash,
      error,
      correlationId
    );

    await this.sendMessage(response);

    this.emit("bridgeCompleted", {
      correlationId,
      status,
      transactionHash,
      execution,
    });

    return { success: status === "success", transactionHash, execution };
  }

  /**
   * Get pending executions
   */
  getPendingExecutions() {
    return Array.from(this.pendingExecutions.values());
  }

  /**
   * Get execution by correlation ID
   */
  getExecution(correlationId) {
    const pending = this.pendingExecutions.get(correlationId);
    if (pending) return pending;

    return this.executionHistory.find(
      (ex) => ex.correlationId === correlationId
    );
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit = 50) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Simulate bridge execution (for testing without wallet)
   */
  async simulateBridgeExecution(correlationId) {
    const execution = this.pendingExecutions.get(correlationId);

    if (!execution) {
      throw new Error(`No pending execution found for ${correlationId}`);
    }

    console.log(`[${this.agentId}] 🧪 Simulating bridge execution`);

    // Simulate transaction hash
    const mockTxHash = `0x${Date.now().toString(16)}${Math.random()
      .toString(16)
      .substr(2, 40)}`;

    // Mark as started
    this.markExecutionStarted(correlationId, mockTxHash);

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Complete with success
    return await this.completeBridgeExecution(
      correlationId,
      mockTxHash,
      "success",
      null
    );
  }
}

export default BridgeExecutorKitAgent;
