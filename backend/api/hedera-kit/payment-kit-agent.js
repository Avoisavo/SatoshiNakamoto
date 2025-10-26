/**
 * Payment Agent using Hedera Agent Kit
 *
 * Executes HTS token transfers in response to PAYMENT_REQ messages
 */

import { BaseKitAgent } from "./base-kit-agent.js";
import { AgentId, createPaymentAckMessage } from "../hedera/a2a-protocol.js";

export class PaymentKitAgent extends BaseKitAgent {
  constructor(config) {
    const systemPrompt = `You are a payment agent for ${config.accountId}.
You can:
- Submit messages to HCS topics for A2A communication
- Transfer HBAR and HTS tokens to settle payments
- Track transaction history

You execute payments using Hedera services.`;

    super({
      ...config,
      agentId: AgentId.PAYMENT,
      systemPrompt,
    });

    // Track processed payment requests for idempotency
    this.processedPayments = new Set();
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(message) {
    const { type } = message;

    switch (type) {
      case "PAYMENT_REQ":
        await this.handlePaymentReq(message);
        break;
      default:
        console.log(`[${this.agentId}] Unhandled message type: ${type}`);
    }
  }

  /**
   * Handle PAYMENT_REQ from buyer
   */
  async handlePaymentReq(message) {
    console.log(`[${this.agentId}] Received PAYMENT_REQ`);

    const { correlationId, payload, from } = message;
    const { amount, tokenId, toAccount, memo, item, qty } = payload;

    // Check for duplicate payment request (idempotency)
    const paymentKey = `${correlationId}-${amount}-${toAccount}`;
    if (this.processedPayments.has(paymentKey)) {
      console.log(
        `[${this.agentId}] Duplicate payment request detected, skipping`
      );
      return;
    }

    console.log(`[${this.agentId}] Payment request:`);
    console.log(`[${this.agentId}]   Amount: ${amount}`);
    console.log(`[${this.agentId}]   Token: ${tokenId}`);
    console.log(`[${this.agentId}]   To: ${toAccount}`);
    console.log(`[${this.agentId}]   Memo: ${memo}`);

    try {
      // Execute transfer using Hedera Agent Kit
      console.log(`[${this.agentId}] Executing transfer...`);

      const transferResult = await this.executeTransfer({
        toAccount,
        amount,
        tokenId,
        memo,
      });

      if (!transferResult.success) {
        throw new Error(transferResult.error);
      }

      // Mark as processed
      this.processedPayments.add(paymentKey);

      // Clean up old entries (keep last 100)
      if (this.processedPayments.size > 100) {
        const firstKey = this.processedPayments.values().next().value;
        this.processedPayments.delete(firstKey);
      }

      // Get transaction ID from result
      const transactionId = transferResult.transactionId;

      console.log(`[${this.agentId}] ✅ Payment successful!`);
      console.log(`[${this.agentId}]   Transaction ID: ${transactionId}`);

      this.updateConversation(correlationId, {
        state: "payment_complete",
        transactionId,
        amount,
      });

      // Send PAYMENT_ACK
      await this._sendPaymentAck(from, correlationId, {
        status: "success",
        transactionId,
        amount,
        tokenId,
      });

      this.emit("paymentExecuted", { correlationId, transactionId, amount });
    } catch (error) {
      console.error(`[${this.agentId}] ❌ Payment failed:`, error.message);

      this.updateConversation(correlationId, {
        state: "payment_failed",
        error: error.message,
      });

      // Send PAYMENT_ACK with error
      await this._sendPaymentAck(from, correlationId, {
        status: "failed",
        error: error.message,
        amount,
        tokenId,
      });

      this.emit("paymentFailed", { correlationId, error: error.message });
    }
  }

  /**
   * Send PAYMENT_ACK message
   */
  async _sendPaymentAck(to, correlationId, payload) {
    console.log(
      `[${this.agentId}] Sending PAYMENT_ACK (status: ${payload.status})`
    );

    const message = createPaymentAckMessage(
      this.agentId,
      to,
      payload.transactionId || "",
      payload.status,
      payload.amount,
      payload.tokenId,
      payload.error,
      correlationId
    );

    await this.sendMessage(message);
    console.log(`[${this.agentId}] PAYMENT_ACK sent`);
  }
}

export default PaymentKitAgent;
