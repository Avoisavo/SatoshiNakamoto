/**
 * Base Agent using Hedera Agent Kit
 *
 * Uses the Hedera Agent Kit with Langchain for A2A communication
 */

import { HederaLangchainToolkit, AgentMode } from "hedera-agent-kit";
import { Client, PrivateKey, TopicMessageQuery } from "@hashgraph/sdk";
import { validateMessage } from "../hedera/a2a-protocol.js";
import EventEmitter from "events";

/**
 * Base Agent using Hedera Agent Kit
 */
export class BaseKitAgent extends EventEmitter {
  constructor(config) {
    super();

    this.agentId = config.agentId;
    this.accountId = config.accountId;
    this.privateKey = config.privateKey;
    this.topicId = config.topicId;
    this.systemPrompt =
      config.systemPrompt || "You are a helpful Hedera agent.";

    this.client = null;
    this.toolkit = null;
    this.agentExecutor = null;
    this.isRunning = false;

    // Track conversations and processed messages
    this.conversations = new Map();
    this.processedMessageIds = new Set();

    console.log(`[${this.agentId}] Agent initialized with Hedera Agent Kit`);
  }

  /**
   * Initialize the agent with Hedera Agent Kit
   */
  async start() {
    if (this.isRunning) {
      console.warn(`[${this.agentId}] Agent already running`);
      return;
    }

    try {
      // Initialize Hedera client
      this.client = Client.forTestnet().setOperator(
        this.accountId,
        PrivateKey.fromStringECDSA(this.privateKey)
      );

      console.log(`[${this.agentId}] Hedera client initialized`);
      console.log(`[${this.agentId}] Account: ${this.accountId}`);

      // Initialize Hedera Agent Kit toolkit
      this.toolkit = new HederaLangchainToolkit({
        client: this.client,
        configuration: {
          tools: [], // Load all tools
          context: {
            mode: AgentMode.AUTONOMOUS,
          },
          plugins: [],
        },
      });

      // Get tools for direct use (no LLM needed for deterministic A2A)
      this.tools = this.toolkit.getTools();

      // Map tools by name for easy access
      this.toolsMap = new Map();
      for (const tool of this.tools) {
        this.toolsMap.set(tool.name, tool);
      }

      console.log(
        `[${this.agentId}] Loaded ${this.tools.length} Hedera Agent Kit tools`
      );

      // Subscribe to HCS topic for incoming messages
      await this.subscribeToTopic();

      this.isRunning = true;
      console.log(`[${this.agentId}] Agent started with Hedera Agent Kit`);

      this.emit("started");
    } catch (error) {
      console.error(`[${this.agentId}] Failed to start agent:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to HCS topic for A2A messages
   */
  async subscribeToTopic() {
    console.log(`[${this.agentId}] Subscribing to topic ${this.topicId}...`);

    const query = new TopicMessageQuery().setTopicId(this.topicId);

    query.subscribe(
      this.client,
      (message) => this._handleIncomingMessage(message),
      (error) => {
        // Sometimes messages come through error callback
        if (error && error.contents && error.consensusTimestamp) {
          this._handleIncomingMessage(error);
        } else {
          console.error(`[${this.agentId}] Subscription error:`, error);
        }
      }
    );

    console.log(`[${this.agentId}] Subscription active`);
  }

  /**
   * Handle incoming HCS message
   */
  _handleIncomingMessage(hcsMessage) {
    try {
      // Parse message
      const messageBytes = hcsMessage.contents;
      const messageJson = messageBytes.toString("utf-8");
      const message = JSON.parse(messageJson);

      // Debug: log all received messages
      console.log(
        `[${this.agentId}] 📨 HCS message received: ${message.type} from ${message.from} to ${message.to}`
      );

      // Validate A2A message
      const validation = validateMessage(message);
      if (!validation.valid) {
        console.warn(`[${this.agentId}] Invalid message:`, validation.errors);
        return;
      }

      // Check if message is for this agent
      if (message.to !== this.agentId && message.to !== "broadcast") {
        console.log(
          `[${this.agentId}] Message not for me (for ${message.to}), skipping`
        );
        return;
      }

      // Check for duplicates
      if (this.processedMessageIds.has(message.id)) {
        return;
      }
      this.processedMessageIds.add(message.id);

      // Clean up old message IDs
      if (this.processedMessageIds.size > 100) {
        const firstId = this.processedMessageIds.values().next().value;
        this.processedMessageIds.delete(firstId);
      }

      console.log(`[${this.agentId}] Received message: ${message.type}`);
      console.log(
        `[${this.agentId}] From: ${message.from} → To: ${message.to}`
      );

      // Emit for subclasses to handle
      this.emit("message", message, {
        sequenceNumber: hcsMessage.sequenceNumber.toNumber(),
        consensusTimestamp: hcsMessage.consensusTimestamp
          .toDate()
          .toISOString(),
      });

      // Route to handler
      this.handleMessage(message).catch((err) => {
        console.error(`[${this.agentId}] Error handling message:`, err);
      });
    } catch (error) {
      console.error(`[${this.agentId}] Error processing message:`, error);
    }
  }

  /**
   * Handle message - to be implemented by subclasses
   */
  async handleMessage(message) {
    console.log(
      `[${this.agentId}] Received ${message.type} (override handleMessage to process)`
    );
  }

  /**
   * Send a message using the Hedera Agent Kit
   */
  async sendMessage(message) {
    if (!this.isRunning) {
      throw new Error("Agent is not running");
    }

    try {
      const messageJson = JSON.stringify(message);

      // Use the submit_topic_message_tool directly
      const submitTool = this.toolsMap.get("submit_topic_message_tool");

      if (!submitTool) {
        throw new Error("submit_topic_message_tool not found");
      }

      const result = await submitTool.invoke({
        topicId: this.topicId,
        message: messageJson,
      });

      if (result.raw && result.raw.error) {
        throw new Error(result.raw.error);
      }

      console.log(
        `[${this.agentId}] Message published: ${message.type} (${message.id})`
      );

      this.emit("messageSent", message);

      return { success: true, result };
    } catch (error) {
      console.error(`[${this.agentId}] Failed to send message:`, error);
      this.emit("messageError", message, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a transfer using the Hedera Agent Kit
   */
  async executeTransfer(params) {
    if (!this.isRunning) {
      throw new Error("Agent is not running");
    }

    try {
      const { toAccount, amount, tokenId, memo } = params;

      // Use the appropriate transfer tool from Hedera Agent Kit
      const transferTool =
        tokenId === "HBAR" || !tokenId
          ? this.toolsMap.get("transfer_hbar_tool")
          : this.toolsMap.get("transfer_fungible_token_with_allowance_tool");

      if (!transferTool) {
        throw new Error(`Transfer tool not found for ${tokenId || "HBAR"}`);
      }

      const transferParams =
        tokenId === "HBAR" || !tokenId
          ? {
              transfers: [
                {
                  accountId: toAccount,
                  amount: parseFloat(amount),
                },
              ],
              transactionMemo: memo,
            }
          : {
              recipientAccountId: toAccount,
              tokenId: tokenId,
              amount: amount.toString(),
              transactionMemo: memo,
            };

      const result = await transferTool.invoke(transferParams);

      if (result.raw && result.raw.error) {
        throw new Error(result.raw.error);
      }

      // Extract transaction ID from result
      const transactionId = this._extractTransactionId(result);

      console.log(`[${this.agentId}] Transfer executed successfully`);
      console.log(`[${this.agentId}]   Transaction ID: ${transactionId}`);

      return { success: true, result, transactionId };
    } catch (error) {
      console.error(`[${this.agentId}] Transfer failed:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract transaction ID from tool result
   */
  _extractTransactionId(result) {
    if (result.raw && result.raw.transactionId) {
      return result.raw.transactionId.toString();
    }

    if (result.humanMessage) {
      const match = result.humanMessage.match(
        /transaction (?:id|ID)[:\s]+([0-9.@]+)/i
      );
      if (match && match[1]) {
        return match[1];
      }
    }

    // Fallback
    return `${this.accountId}@${Date.now()}`;
  }

  /**
   * Stop the agent
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log(`[${this.agentId}] Stopping agent...`);

    if (this.client) {
      this.client.close();
    }

    this.isRunning = false;
    this.emit("stopped");

    console.log(`[${this.agentId}] Agent stopped`);
  }

  /**
   * Get or create conversation
   */
  getConversation(correlationId) {
    if (!this.conversations.has(correlationId)) {
      this.conversations.set(correlationId, {
        correlationId,
        messages: [],
        state: "initiated",
        createdAt: new Date().toISOString(),
      });
    }
    return this.conversations.get(correlationId);
  }

  /**
   * Update conversation state
   */
  updateConversation(correlationId, updates) {
    const conversation = this.getConversation(correlationId);
    Object.assign(conversation, updates);
    this.conversations.set(correlationId, conversation);
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      agentId: this.agentId,
      accountId: this.accountId,
      isRunning: this.isRunning,
      activeConversations: this.conversations.size,
    };
  }
}

export default BaseKitAgent;
