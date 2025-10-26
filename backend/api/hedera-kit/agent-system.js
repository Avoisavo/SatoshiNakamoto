/**
 * Agent System Manager
 *
 * Manages lifecycle of all Hedera agents
 */

import dotenv from "dotenv";
import { TelegramKitAgent } from "./telegram-kit-agent.js";
import { AIDecisionKitAgent } from "./ai-decision-kit-agent.js";
import { BridgeExecutorKitAgent } from "./bridge-executor-kit-agent.js";

dotenv.config();

export class AgentSystem {
  constructor() {
    this.telegramAgent = null;
    this.aiAgent = null;
    this.bridgeAgent = null;
    this.isRunning = false;
  }

  /**
   * Initialize all agents
   */
  async initialize() {
    console.log("\n🤖 Initializing Agent System...");

    // Validate environment variables
    const requiredEnvVars = [
      "HEDERA_TELEGRAM_ACCOUNT_ID",
      "HEDERA_TELEGRAM_PRIVATE_KEY",
      "HEDERA_AI_ACCOUNT_ID",
      "HEDERA_AI_PRIVATE_KEY",
      "HEDERA_BRIDGE_ACCOUNT_ID",
      "HEDERA_BRIDGE_PRIVATE_KEY",
      "HCS_TOPIC_ID",
    ];

    const missing = requiredEnvVars.filter((v) => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }

    const topicId = process.env.HCS_TOPIC_ID;

    // Initialize Telegram Agent
    this.telegramAgent = new TelegramKitAgent({
      accountId: process.env.HEDERA_TELEGRAM_ACCOUNT_ID,
      privateKey: process.env.HEDERA_TELEGRAM_PRIVATE_KEY,
      topicId,
    });

    // Initialize AI Decision Agent
    this.aiAgent = new AIDecisionKitAgent({
      accountId: process.env.HEDERA_AI_ACCOUNT_ID,
      privateKey: process.env.HEDERA_AI_PRIVATE_KEY,
      topicId,
    });

    // Initialize Bridge Executor Agent
    this.bridgeAgent = new BridgeExecutorKitAgent({
      accountId: process.env.HEDERA_BRIDGE_ACCOUNT_ID,
      privateKey: process.env.HEDERA_BRIDGE_PRIVATE_KEY,
      topicId,
    });

    console.log("✅ Agents initialized");
  }

  /**
   * Start all agents
   */
  async start() {
    if (this.isRunning) {
      console.log("⚠️  Agent system already running");
      return;
    }

    console.log("\n🚀 Starting Agent System...");

    try {
      // Start all agents
      await Promise.all([
        this.telegramAgent.start(),
        this.aiAgent.start(),
        this.bridgeAgent.start(),
      ]);

      this.isRunning = true;

      console.log("\n✅ Agent System Started");
      console.log("   📱 Telegram Agent: READY");
      console.log("   🧠 AI Decision Agent: READY");
      console.log("   🌉 Bridge Executor Agent: READY");
      console.log(`   📡 HCS Topic: ${process.env.HCS_TOPIC_ID}\n`);

      // Setup event listeners for logging
      this._setupEventListeners();
    } catch (error) {
      console.error("❌ Failed to start agent system:", error);
      throw error;
    }
  }

  /**
   * Stop all agents
   */
  async stop() {
    if (!this.isRunning) {
      console.log("⚠️  Agent system not running");
      return;
    }

    console.log("\n🛑 Stopping Agent System...");

    try {
      await Promise.all([
        this.telegramAgent.stop(),
        this.aiAgent.stop(),
        this.bridgeAgent.stop(),
      ]);

      this.isRunning = false;
      console.log("✅ Agent System Stopped\n");
    } catch (error) {
      console.error("❌ Error stopping agent system:", error);
      throw error;
    }
  }

  /**
   * Setup event listeners for inter-agent communication logging
   */
  _setupEventListeners() {
    // Telegram Agent Events
    this.telegramAgent.on("messageForwarded", (data) => {
      console.log(
        `[SYSTEM] 📱→🧠 Message forwarded to AI (${data.correlationId})`
      );
    });

    this.telegramAgent.on("aiDecisionReceived", (data) => {
      console.log(
        `[SYSTEM] 🧠→📱 AI decision received: ${data.decision} (${data.correlationId})`
      );
    });

    this.telegramAgent.on("notification", (data) => {
      console.log(
        `[SYSTEM] 📢 Notification for chat ${data.chatId}: ${data.message}`
      );
    });

    // AI Agent Events
    this.aiAgent.on("decisionMade", (data) => {
      console.log(
        `[SYSTEM] 🧠 Decision made: ${data.decision}, Bridge: ${data.shouldExecuteBridge} (${data.correlationId})`
      );
    });

    this.aiAgent.on("bridgeCompleted", (data) => {
      console.log(
        `[SYSTEM] 🌉 Bridge completed: ${data.status} (${data.correlationId})`
      );
    });

    // Bridge Agent Events
    this.bridgeAgent.on("bridgeRequested", (data) => {
      console.log(
        `[SYSTEM] 🌉 Bridge requested: ${data.amount} ${data.token} ${data.sourceChain}→${data.targetChain}`
      );
    });

    this.bridgeAgent.on("bridgeCompleted", (data) => {
      console.log(
        `[SYSTEM] ✅ Bridge execution ${data.status}: ${data.transactionHash}`
      );
    });
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      agents: {
        telegram: {
          running: this.telegramAgent?.isRunning || false,
          activeChats: this.telegramAgent?.getActiveChats() || [],
        },
        aiDecision: {
          running: this.aiAgent?.isRunning || false,
        },
        bridgeExecutor: {
          running: this.bridgeAgent?.isRunning || false,
          pendingExecutions: this.bridgeAgent?.getPendingExecutions() || [],
        },
      },
      topicId: process.env.HCS_TOPIC_ID,
    };
  }
}

export default AgentSystem;
