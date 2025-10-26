/**
 * Buyer Agent using Hedera Agent Kit
 *
 * Initiates offers, negotiates prices, and requests payments
 */

import { BaseKitAgent } from "./base-kit-agent.js";
import {
  AgentId,
  createOfferMessage,
  createCounterMessage,
  createAcceptMessage,
  createDeclineMessage,
  createPaymentReqMessage,
} from "../hedera/a2a-protocol.js";

export class BuyerKitAgent extends BaseKitAgent {
  constructor(config) {
    const systemPrompt = `You are a buyer agent for ${config.accountId}. 
You can:
- Submit messages to HCS topics for A2A communication
- Transfer HBAR and tokens for payments
- Query account balances and transaction status

You negotiate purchases and execute payments using Hedera services.`;

    super({
      ...config,
      agentId: AgentId.BUYER,
      systemPrompt,
    });

    this.maxPrice = config.maxPrice || 100;
    this.autoAcceptThreshold = config.autoAcceptThreshold || 1.1; // Accept up to 110% of initial offer
    this.paymentTokenId = config.paymentTokenId || "HBAR";
    this.sellerAccountId = config.sellerAccountId;
  }

  /**
   * Make an offer to seller
   */
  async makeOffer({ item, qty, unitPrice, currency = "HBAR" }) {
    const correlationId = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    console.log(
      `[${this.agentId}] Making offer for ${qty} ${item} at ${unitPrice} ${currency} each`
    );

    const message = createOfferMessage(
      this.agentId,
      AgentId.SELLER,
      item,
      qty,
      unitPrice,
      currency,
      correlationId
    );

    this.updateConversation(correlationId, {
      state: "offer_sent",
      item,
      qty,
      initialOffer: unitPrice,
    });

    await this.sendMessage(message);

    console.log(`[${this.agentId}] Offer sent (correlation: ${correlationId})`);
    this.emit("offerSent", { correlationId, item, qty, unitPrice });

    return correlationId;
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(message) {
    const { type, correlationId, payload, from } = message;

    switch (type) {
      case "COUNTER":
        await this.handleCounter(message);
        break;
      case "ACCEPT":
        await this.handleAccept(message);
        break;
      case "DECLINE":
        await this.handleDecline(message);
        break;
      case "PAYMENT_ACK":
        await this.handlePaymentAck(message);
        break;
      default:
        console.log(`[${this.agentId}] Unhandled message type: ${type}`);
    }
  }

  /**
   * Handle COUNTER from seller
   */
  async handleCounter(message) {
    console.log(`[${this.agentId}] Received COUNTER from seller`);

    const { correlationId, payload } = message;
    const { item, qty, unitPrice, currency, reason } = payload;

    console.log(
      `[${this.agentId}] Seller counter: ${qty} ${item} at ${unitPrice} ${currency}`
    );
    console.log(`[${this.agentId}] Reason: ${reason}`);

    const conversation = this.getConversation(correlationId);
    const shouldAccept = this._evaluateCounteroffer(unitPrice, conversation);

    if (shouldAccept) {
      await this._acceptOffer(correlationId, item, qty, unitPrice, currency);
    } else {
      // Make a counter-offer (split the difference)
      const myLastOffer = conversation.myLastOffer || conversation.initialOffer;
      const newOffer = (myLastOffer + unitPrice) / 2;

      if (newOffer <= this.maxPrice) {
        console.log(
          `[${this.agentId}] Sending counteroffer: ${newOffer} ${currency}`
        );

        const counterMsg = createCounterMessage(
          this.agentId,
          AgentId.SELLER,
          item,
          qty,
          newOffer,
          currency,
          `Counter offer at ${newOffer}`,
          correlationId
        );

        this.updateConversation(correlationId, {
          state: "counter_sent",
          myLastOffer: newOffer,
        });

        await this.sendMessage(counterMsg);
        console.log(`[${this.agentId}] COUNTER sent`);
      } else {
        console.log(`[${this.agentId}] Price too high, declining`);
        const declineMsg = createDeclineMessage(
          this.agentId,
          AgentId.SELLER,
          `Price ${unitPrice} exceeds budget ${this.maxPrice}`,
          correlationId
        );
        await this.sendMessage(declineMsg);
      }
    }
  }

  /**
   * Handle ACCEPT from seller
   */
  async handleAccept(message) {
    console.log(`[${this.agentId}] Received ACCEPT from seller`);

    const { correlationId, payload } = message;
    const { item, qty, unitPrice, currency } = payload;
    const totalAmount = qty * unitPrice;

    this.updateConversation(correlationId, {
      state: "accepted",
      finalPrice: unitPrice,
      totalAmount,
    });

    console.log(
      `[${this.agentId}] Deal accepted: ${qty} ${item} for ${totalAmount} ${currency}`
    );
    this.emit("dealAccepted", {
      correlationId,
      item,
      qty,
      unitPrice,
      totalAmount,
    });

    // Initiate payment
    await this._initiatePayment(correlationId, totalAmount, item, qty);
  }

  /**
   * Handle DECLINE from seller
   */
  async handleDecline(message) {
    console.log(`[${this.agentId}] Received DECLINE from seller`);

    const { correlationId, payload } = message;
    console.log(`[${this.agentId}] Seller declined: ${payload.reason}`);

    this.updateConversation(correlationId, { state: "declined" });
    this.emit("offerDeclined", { correlationId, reason: payload.reason });
  }

  /**
   * Handle PAYMENT_ACK from payment agent
   */
  async handlePaymentAck(message) {
    console.log(`[${this.agentId}] Received PAYMENT_ACK`);

    const { correlationId, payload } = message;
    const { transactionId, status, amount, error } = payload;

    if (status === "success") {
      this.updateConversation(correlationId, {
        state: "paid",
        transactionId,
      });

      console.log(`[${this.agentId}] Payment successful!`);
      console.log(`[${this.agentId}] Transaction ID: ${transactionId}`);
      console.log(`[${this.agentId}] Amount: ${amount}`);

      this.emit("paymentSuccess", { correlationId, transactionId, amount });
    } else {
      this.updateConversation(correlationId, {
        state: "payment_failed",
        paymentError: error,
      });

      console.error(`[${this.agentId}] Payment failed: ${error}`);
      this.emit("paymentFailed", { correlationId, error });
    }
  }

  /**
   * Evaluate whether to accept a counteroffer
   */
  _evaluateCounteroffer(counterPrice, conversation) {
    // Accept if within threshold
    if (counterPrice <= this.maxPrice * this.autoAcceptThreshold) {
      console.log(`[${this.agentId}] Auto-accepting (within threshold)`);
      return true;
    }

    // Accept if at or below max price and we've negotiated
    if (
      counterPrice <= this.maxPrice &&
      conversation.messages &&
      conversation.messages.length > 2
    ) {
      console.log(
        `[${this.agentId}] Accepting (within budget after negotiation)`
      );
      return true;
    }

    return false;
  }

  /**
   * Accept an offer
   */
  async _acceptOffer(correlationId, item, qty, unitPrice, currency) {
    console.log(`[${this.agentId}] Accepting offer`);

    const message = createAcceptMessage(
      this.agentId,
      AgentId.SELLER,
      item,
      qty,
      unitPrice,
      currency,
      correlationId
    );

    this.updateConversation(correlationId, { state: "accepting" });

    await this.sendMessage(message);
    console.log(`[${this.agentId}] ACCEPT sent`);

    // Initiate payment after accepting
    const totalAmount = qty * unitPrice;
    await this._initiatePayment(correlationId, totalAmount, item, qty);
  }

  /**
   * Initiate payment request
   */
  async _initiatePayment(correlationId, amount, item, qty) {
    console.log(`[${this.agentId}] Initiating payment: ${amount}`);

    const message = createPaymentReqMessage(
      this.agentId,
      AgentId.PAYMENT,
      amount,
      this.paymentTokenId,
      this.sellerAccountId,
      `Payment for ${qty} ${item}`,
      item,
      qty,
      correlationId
    );

    this.updateConversation(correlationId, { state: "payment_requested" });

    const result = await this.sendMessage(message);

    if (result.success) {
      console.log(`[${this.agentId}] PAYMENT_REQ sent to payment agent`);
      this.emit("paymentRequested", { correlationId, amount });
    } else {
      console.error(
        `[${this.agentId}] Failed to send PAYMENT_REQ:`,
        result.error
      );
    }
  }
}

export default BuyerKitAgent;
