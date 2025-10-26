/**
 * Seller Agent using Hedera Agent Kit
 *
 * Responds to offers with counteroffers or acceptance
 */

import { BaseKitAgent } from "./base-kit-agent.js";
import {
  AgentId,
  createCounterMessage,
  createAcceptMessage,
  createDeclineMessage,
} from "../hedera/a2a-protocol.js";

export class SellerKitAgent extends BaseKitAgent {
  constructor(config) {
    const systemPrompt = `You are a seller agent for ${config.accountId}.
You can:
- Submit messages to HCS topics for A2A communication  
- Receive offers and send counteroffers or accept/decline
- Manage inventory

You negotiate sales using Hedera services.`;

    super({
      ...config,
      agentId: AgentId.SELLER,
      systemPrompt,
    });

    this.minPrice = config.minPrice || 50;
    this.idealPrice = config.idealPrice || 80;
    this.autoAcceptThreshold = config.autoAcceptThreshold || 0.95;
    this.inventory = config.inventory || {};
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(message) {
    const { type } = message;

    switch (type) {
      case "OFFER":
        await this.handleOffer(message);
        break;
      case "COUNTER":
        await this.handleCounter(message);
        break;
      default:
        console.log(`[${this.agentId}] Unhandled message type: ${type}`);
    }
  }

  /**
   * Handle OFFER from buyer
   */
  async handleOffer(message) {
    console.log(`[${this.agentId}] Received OFFER from buyer`);

    const { correlationId, payload, from } = message;
    const { item, qty, unitPrice, currency } = payload;

    this.updateConversation(correlationId, {
      state: "offer_received",
      item,
      qty,
      buyerOffer: unitPrice,
      buyerId: from,
    });

    console.log(
      `[${this.agentId}] Buyer offers: ${qty} ${item} at ${unitPrice} ${currency}`
    );

    // Check inventory
    if (!this._hasInventory(item, qty)) {
      console.log(`[${this.agentId}] Insufficient inventory for ${item}`);
      await this._declineOffer(
        correlationId,
        from,
        `Insufficient inventory for ${qty} ${item}`
      );
      return;
    }

    // Evaluate offer
    const decision = this._evaluateOffer(unitPrice, item);

    if (decision.action === "accept") {
      await this._acceptOffer(
        correlationId,
        from,
        item,
        qty,
        unitPrice,
        currency
      );
    } else if (decision.action === "counter") {
      await this._sendCounteroffer(
        correlationId,
        from,
        item,
        qty,
        decision.counterPrice,
        currency,
        decision.reason
      );
    } else {
      await this._declineOffer(correlationId, from, decision.reason);
    }
  }

  /**
   * Handle COUNTER from buyer
   */
  async handleCounter(message) {
    console.log(`[${this.agentId}] Received COUNTER from buyer`);

    const { correlationId, payload, from } = message;
    const { item, qty, unitPrice, currency } = payload;

    console.log(
      `[${this.agentId}] Buyer counter: ${qty} ${item} at ${unitPrice} ${currency}`
    );

    const decision = this._evaluateOffer(unitPrice, item);

    if (decision.action === "accept") {
      await this._acceptOffer(
        correlationId,
        from,
        item,
        qty,
        unitPrice,
        currency
      );
    } else {
      console.log(`[${this.agentId}] Counter price still too low, declining`);
      await this._declineOffer(
        correlationId,
        from,
        `Price ${unitPrice} is below minimum ${this.minPrice}`
      );
    }
  }

  /**
   * Evaluate an offer
   */
  _evaluateOffer(unitPrice, item) {
    const minPrice = this.minPrice;
    const idealPrice = this.idealPrice;

    console.log(
      `[${this.agentId}] Evaluating offer: ${unitPrice} (min: ${minPrice}, ideal: ${idealPrice})`
    );

    // Too low - decline
    if (unitPrice < minPrice) {
      console.log(`[${this.agentId}] Price too low (below minimum)`);
      return {
        action: "decline",
        reason: `Price ${unitPrice} is below minimum ${minPrice}`,
      };
    }

    // At or above ideal - accept immediately
    if (unitPrice >= idealPrice) {
      console.log(
        `[${this.agentId}] Accepting immediately (at or above ideal)`
      );
      return {
        action: "accept",
      };
    }

    // Between min and ideal - counter with midpoint
    const counterPrice = (unitPrice + idealPrice) / 2;
    console.log(`[${this.agentId}] Sending counteroffer: ${counterPrice}`);

    return {
      action: "counter",
      counterPrice,
      reason: `Looking for ${idealPrice}, can offer ${counterPrice}`,
    };
  }

  /**
   * Check if we have inventory
   */
  _hasInventory(item, qty) {
    const available = this.inventory[item] || 0;
    return available >= qty;
  }

  /**
   * Reserve inventory
   */
  _reserveInventory(item, qty) {
    if (this.inventory[item]) {
      this.inventory[item] -= qty;
      console.log(
        `[${this.agentId}] Reserved ${qty} ${item} (remaining: ${this.inventory[item]})`
      );
    }
  }

  /**
   * Accept an offer
   */
  async _acceptOffer(correlationId, to, item, qty, unitPrice, currency) {
    console.log(`[${this.agentId}] Accepting offer`);

    const message = createAcceptMessage(
      this.agentId,
      to,
      item,
      qty,
      unitPrice,
      currency,
      correlationId
    );

    const totalAmount = qty * unitPrice;
    this.updateConversation(correlationId, {
      state: "accepted",
      finalPrice: unitPrice,
      totalAmount,
    });

    await this.sendMessage(message);

    console.log(`[${this.agentId}] ACCEPT sent`);
    console.log(
      `[${this.agentId}] Deal confirmed: ${qty} ${item} for ${totalAmount}`
    );

    // Reserve inventory
    this._reserveInventory(item, qty);

    this.emit("dealAccepted", {
      correlationId,
      item,
      qty,
      unitPrice,
      totalAmount,
    });
  }

  /**
   * Send a counteroffer
   */
  async _sendCounteroffer(
    correlationId,
    to,
    item,
    qty,
    unitPrice,
    currency,
    reason
  ) {
    console.log(
      `[${this.agentId}] Sending counteroffer: ${unitPrice} ${currency}`
    );

    const message = createCounterMessage(
      this.agentId,
      to,
      item,
      qty,
      unitPrice,
      currency,
      reason,
      correlationId
    );

    this.updateConversation(correlationId, {
      state: "counter_sent",
      myCounterPrice: unitPrice,
    });

    await this.sendMessage(message);
    console.log(`[${this.agentId}] COUNTER sent`);
  }

  /**
   * Decline an offer
   */
  async _declineOffer(correlationId, to, reason) {
    console.log(`[${this.agentId}] Declining offer: ${reason}`);

    const message = createDeclineMessage(
      this.agentId,
      to,
      reason,
      correlationId
    );

    this.updateConversation(correlationId, {
      state: "declined",
      declineReason: reason,
    });

    await this.sendMessage(message);
    console.log(`[${this.agentId}] DECLINE sent`);
  }
}

export default SellerKitAgent;
