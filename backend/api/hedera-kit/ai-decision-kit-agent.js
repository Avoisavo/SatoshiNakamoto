/**
 * AI Decision Agent using Hedera Agent Kit
 *
 * Makes intelligent decisions based on user requests
 * Decides whether to execute bridge or reject
 */

import { BaseKitAgent } from "./base-kit-agent.js";
import {
  AgentId,
  MessageType,
  createAIDecisionResponse,
  createBridgeExecuteRequest,
  createNotifyMessage,
} from "../hedera/a2a-protocol.js";

export class AIDecisionKitAgent extends BaseKitAgent {
  constructor(config) {
    super({
      ...config,
      agentId: AgentId.AI_DECISION,
      systemPrompt: "You are an AI decision agent for cross-chain operations.",
    });

    // Decision rules configuration
    this.bridgeKeywords = config.bridgeKeywords || [
      "bridge",
      "transfer",
      "send",
      "cross-chain",
      "move",
      "swap",
    ];

    this.supportedChains = config.supportedChains || [
      "ethereum",
      "polygon",
      "arbitrum",
      "optimism",
      "base",
    ];

    this.supportedTokens = config.supportedTokens || [
      "ETH",
      "USDC",
      "USDT",
      "DAI",
      "WETH",
    ];
  }

  /**
   * Handle incoming A2A messages
   */
  async handleMessage(message) {
    const { type, payload, from, correlationId } = message;

    switch (type) {
      case MessageType.AI_DECISION_REQ:
        await this.handleDecisionRequest(message);
        break;
      case MessageType.BRIDGE_EXEC_RESP:
        await this.handleBridgeResponse(message);
        break;
      default:
        console.log(
          `[${this.agentId}] Received ${type} (no handler implemented)`
        );
    }
  }

  /**
   * Handle AI decision request from Telegram Agent
   */
  async handleDecisionRequest(message) {
    const { payload, from, correlationId } = message;
    const { userRequest, context } = payload;

    console.log(`[${this.agentId}] 🧠 Processing decision request`);
    console.log(`[${this.agentId}]   Request: ${userRequest}`);
    console.log(`[${this.agentId}]   Context: ${JSON.stringify(context)}`);

    this.updateConversation(correlationId, {
      state: "analyzing",
      userRequest,
      context,
    });

    // Make decision using if/else logic
    const decision = await this._makeDecision(userRequest, context);

    console.log(`[${this.agentId}] 💡 Decision: ${decision.decision}`);
    console.log(
      `[${this.agentId}]   Execute Bridge: ${decision.shouldExecuteBridge}`
    );

    this.updateConversation(correlationId, {
      state: "decision_made",
      ...decision,
    });

    // Send decision response back to Telegram
    const response = createAIDecisionResponse(
      this.agentId,
      from, // Back to Telegram agent
      decision.decision,
      decision.shouldExecuteBridge,
      decision.reasoning,
      decision.bridgeParams,
      correlationId
    );

    await this.sendMessage(response);

    // If decision is to execute bridge, forward to Bridge Executor
    if (decision.shouldExecuteBridge && decision.bridgeParams) {
      await this._requestBridgeExecution(correlationId, decision.bridgeParams);
    } else {
      // Send negative notification
      const notify = createNotifyMessage(
        this.agentId,
        AgentId.TELEGRAM,
        `Request rejected: ${decision.reasoning}`,
        "warning",
        correlationId
      );
      await this.sendMessage(notify);
    }

    this.emit("decisionMade", {
      correlationId,
      decision: decision.decision,
      shouldExecuteBridge: decision.shouldExecuteBridge,
    });
  }

  /**
   * Make decision using if/else logic
   */
  async _makeDecision(userRequest, context) {
    const requestLower = userRequest.toLowerCase();

    // Check if request contains bridge keywords
    const hasBridgeIntent = this.bridgeKeywords.some((keyword) =>
      requestLower.includes(keyword)
    );

    if (!hasBridgeIntent) {
      return {
        decision: "REJECT",
        shouldExecuteBridge: false,
        reasoning: "Request does not indicate a bridge/transfer operation.",
        bridgeParams: null,
      };
    }

    // Extract parameters from request
    const params = this._extractBridgeParams(requestLower);

    // Validate extracted parameters
    if (!params.sourceChain || !params.targetChain) {
      return {
        decision: "REJECT",
        shouldExecuteBridge: false,
        reasoning:
          "Unable to determine source and target chains. Please specify clearly (e.g., 'bridge from Ethereum to Polygon').",
        bridgeParams: null,
      };
    }

    if (
      !this.supportedChains.includes(params.sourceChain) ||
      !this.supportedChains.includes(params.targetChain)
    ) {
      return {
        decision: "REJECT",
        shouldExecuteBridge: false,
        reasoning: `Unsupported chain. Supported chains: ${this.supportedChains.join(
          ", "
        )}`,
        bridgeParams: null,
      };
    }

    if (!params.token) {
      return {
        decision: "REJECT",
        shouldExecuteBridge: false,
        reasoning:
          "Unable to determine token to bridge. Please specify (e.g., 'bridge 100 USDC').",
        bridgeParams: null,
      };
    }

    if (!this.supportedTokens.includes(params.token)) {
      return {
        decision: "REJECT",
        shouldExecuteBridge: false,
        reasoning: `Unsupported token. Supported tokens: ${this.supportedTokens.join(
          ", "
        )}`,
        bridgeParams: null,
      };
    }

    if (!params.amount || params.amount <= 0) {
      return {
        decision: "REJECT",
        shouldExecuteBridge: false,
        reasoning:
          "Invalid or missing amount. Please specify amount to bridge.",
        bridgeParams: null,
      };
    }

    // All checks passed - approve bridge
    return {
      decision: "APPROVE",
      shouldExecuteBridge: true,
      reasoning: `Approved bridge of ${params.amount} ${params.token} from ${params.sourceChain} to ${params.targetChain}`,
      bridgeParams: params,
    };
  }

  /**
   * Extract bridge parameters from natural language request
   */
  _extractBridgeParams(requestLower) {
    const params = {
      sourceChain: null,
      targetChain: null,
      token: null,
      amount: 0,
      recipient: null,
    };

    // Extract chains
    const fromMatch = requestLower.match(
      /from\s+(ethereum|polygon|arbitrum|optimism|base)/
    );
    const toMatch = requestLower.match(
      /to\s+(ethereum|polygon|arbitrum|optimism|base)/
    );

    if (fromMatch) params.sourceChain = fromMatch[1];
    if (toMatch) params.targetChain = toMatch[1];

    // Extract token
    for (const token of this.supportedTokens) {
      if (requestLower.includes(token.toLowerCase())) {
        params.token = token;
        break;
      }
    }

    // Extract amount
    const amountMatch = requestLower.match(
      /(\d+\.?\d*)\s*(usdc|usdt|dai|eth|weth|polygon|ethereum|arbitrum|optimism|base)?/
    );
    if (amountMatch) {
      params.amount = parseFloat(amountMatch[1]);
    }

    // If we couldn't find token with amount, try standalone token match
    if (!params.token) {
      for (const token of this.supportedTokens) {
        if (requestLower.includes(token.toLowerCase())) {
          params.token = token;
          break;
        }
      }
    }

    // Extract recipient if provided
    const recipientMatch = requestLower.match(/0x[a-fA-F0-9]{40}/);
    if (recipientMatch) {
      params.recipient = recipientMatch[0];
    }

    return params;
  }

  /**
   * Request bridge execution from Bridge Executor Agent
   */
  async _requestBridgeExecution(correlationId, bridgeParams) {
    console.log(`[${this.agentId}] 🌉 Requesting bridge execution`);

    this.updateConversation(correlationId, {
      state: "requesting_bridge",
      bridgeParams,
    });

    const request = createBridgeExecuteRequest(
      this.agentId,
      AgentId.BRIDGE_EXECUTOR,
      bridgeParams.sourceChain,
      bridgeParams.targetChain,
      bridgeParams.token,
      bridgeParams.amount,
      bridgeParams.recipient,
      correlationId
    );

    await this.sendMessage(request);

    console.log(`[${this.agentId}] ✅ Bridge request sent`);
  }

  /**
   * Handle bridge execution response
   */
  async handleBridgeResponse(message) {
    const { payload, correlationId } = message;
    const { status, transactionHash, error } = payload;

    console.log(`[${this.agentId}] 🌉 Bridge response received`);
    console.log(`[${this.agentId}]   Status: ${status}`);

    this.updateConversation(correlationId, {
      state: "bridge_response_received",
      bridgeStatus: status,
      transactionHash,
      error,
    });

    // Notify Telegram agent
    let notifyMsg;
    let level;

    if (status === "success") {
      notifyMsg = `✅ Bridge executed successfully!\nTransaction: ${transactionHash}`;
      level = "success";
    } else {
      notifyMsg = `❌ Bridge execution failed: ${error}`;
      level = "error";
    }

    const notify = createNotifyMessage(
      this.agentId,
      AgentId.TELEGRAM,
      notifyMsg,
      level,
      correlationId
    );

    await this.sendMessage(notify);

    this.emit("bridgeCompleted", {
      correlationId,
      status,
      transactionHash,
    });
  }
}

export default AIDecisionKitAgent;
