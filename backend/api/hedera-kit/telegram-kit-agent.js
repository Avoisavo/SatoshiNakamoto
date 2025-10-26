/**
 * Telegram Agent using Hedera Agent Kit
 *
 * Receives Telegram messages and forwards to AI Decision Agent
 * Receives notifications and sends to Telegram
 */

import { BaseKitAgent } from "./base-kit-agent.js";
import {
  AgentId,
  MessageType,
  createTelegramMessage,
  createAIDecisionRequest,
} from "../hedera/a2a-protocol.js";

export class TelegramKitAgent extends BaseKitAgent {
  constructor(config) {
    super({
      ...config,
      agentId: AgentId.TELEGRAM,
      systemPrompt: "You are a Telegram interface agent.",
    });

    this.pendingNotifications = [];
    this.activeChats = new Map(); // chatId -> user context
  }

  /**
   * Handle incoming A2A messages
   */
  async handleMessage(message) {
    const { type, payload, from, correlationId } = message;

    switch (type) {
      case MessageType.NOTIFY:
        await this.handleNotification(message);
        break;
      case MessageType.AI_DECISION_RESP:
        await this.handleAIResponse(message);
        break;
      default:
        console.log(
          `[${this.agentId}] Received ${type} (no handler implemented)`
        );
    }
  }

  /**
   * Receive message from Telegram user (triggered via API)
   * @param {Object} params
   * @param {string} params.text - User message text
   * @param {string} params.chatId - Telegram chat ID
   * @param {string} params.userId - Telegram user ID
   */
  async receiveFromTelegram({ text, chatId, userId }) {
    console.log(`[${this.agentId}] 📱 Received from Telegram`);
    console.log(`[${this.agentId}]   Chat: ${chatId}`);
    console.log(`[${this.agentId}]   Message: ${text}`);

    const correlationId = `telegram-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store chat context
    this.activeChats.set(chatId, {
      userId,
      lastMessage: text,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    this.updateConversation(correlationId, {
      state: "forwarding_to_ai",
      chatId,
      userId,
      originalMessage: text,
    });

    // Forward to AI Decision Agent
    const aiRequest = createAIDecisionRequest(
      this.agentId,
      AgentId.AI_DECISION,
      text,
      {
        chatId,
        userId,
        source: "telegram",
      },
      correlationId
    );

    await this.sendMessage(aiRequest);

    console.log(
      `[${this.agentId}] ✅ Forwarded to AI Agent (correlation: ${correlationId})`
    );

    this.emit("messageForwarded", {
      correlationId,
      chatId,
      aiAgentId: AgentId.AI_DECISION,
    });

    return correlationId;
  }

  /**
   * Handle AI decision response
   */
  async handleAIResponse(message) {
    const { payload, correlationId } = message;
    const { decision, shouldExecuteBridge, reasoning, bridgeParams } = payload;

    console.log(`[${this.agentId}] 🤖 AI Response received`);
    console.log(`[${this.agentId}]   Decision: ${decision}`);
    console.log(`[${this.agentId}]   Execute Bridge: ${shouldExecuteBridge}`);

    const conversation = this.conversations.get(correlationId);
    if (!conversation) {
      console.warn(
        `[${this.agentId}] No conversation found for ${correlationId}`
      );
      return;
    }

    this.updateConversation(correlationId, {
      state: "ai_response_received",
      decision,
      shouldExecuteBridge,
      reasoning,
    });

    // Store for retrieval via API
    this.pendingNotifications.push({
      correlationId,
      type: "ai_decision",
      chatId: conversation.chatId,
      message: `AI Decision: ${decision}\n${reasoning}`,
      shouldExecuteBridge,
      bridgeParams,
      timestamp: new Date().toISOString(),
    });

    this.emit("aiDecisionReceived", {
      correlationId,
      decision,
      shouldExecuteBridge,
      chatId: conversation.chatId,
    });
  }

  /**
   * Handle notification messages
   */
  async handleNotification(message) {
    const { payload, correlationId } = message;
    const { message: notifyMsg, level } = payload;

    console.log(`[${this.agentId}] 📢 Notification: ${notifyMsg}`);

    const conversation = this.conversations.get(correlationId);
    const chatId = conversation?.chatId;

    // Store for retrieval via API
    this.pendingNotifications.push({
      correlationId,
      type: "notification",
      chatId,
      message: notifyMsg,
      level,
      timestamp: new Date().toISOString(),
    });

    this.emit("notification", {
      correlationId,
      chatId,
      message: notifyMsg,
      level,
    });
  }

  /**
   * Get pending notifications for a chat
   */
  getPendingNotifications(chatId) {
    if (chatId) {
      return this.pendingNotifications.filter((n) => n.chatId === chatId);
    }
    return this.pendingNotifications;
  }

  /**
   * Clear notifications
   */
  clearNotifications(correlationId) {
    if (correlationId) {
      this.pendingNotifications = this.pendingNotifications.filter(
        (n) => n.correlationId !== correlationId
      );
    } else {
      this.pendingNotifications = [];
    }
  }

  /**
   * Get active chats
   */
  getActiveChats() {
    return Array.from(this.activeChats.entries()).map(([chatId, context]) => ({
      chatId,
      ...context,
    }));
  }
}

export default TelegramKitAgent;
