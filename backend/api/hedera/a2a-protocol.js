/**
 * A2A (Agent-to-Agent) Message Protocol
 *
 * Defines standardized message schemas for multi-agent communication
 * via Hedera Consensus Service (HCS).
 */

import crypto from "crypto";

/**
 * Agent identifier constants
 */
export const AgentId = {
  BUYER: "agent://buyer",
  SELLER: "agent://seller",
  PAYMENT: "agent://payment",
  TELEGRAM: "agent://telegram",
  AI_DECISION: "agent://ai-decision",
  BRIDGE_EXECUTOR: "agent://bridge-executor",
  BROADCAST: "broadcast",
};

/**
 * A2A Message types
 */
export const MessageType = {
  // Negotiation messages
  OFFER: "OFFER",
  COUNTER: "COUNTER",
  ACCEPT: "ACCEPT",
  DECLINE: "DECLINE",

  // Payment messages (AP2 - Agent Payment Protocol)
  PAYMENT_REQ: "PAYMENT_REQ",
  PAYMENT_ACK: "PAYMENT_ACK",

  // Workflow messages (Telegram → AI → Bridge flow)
  TELEGRAM_MSG: "TELEGRAM_MSG",
  AI_DECISION_REQ: "AI_DECISION_REQ",
  AI_DECISION_RESP: "AI_DECISION_RESP",
  BRIDGE_EXEC_REQ: "BRIDGE_EXEC_REQ",
  BRIDGE_EXEC_RESP: "BRIDGE_EXEC_RESP",
  NOTIFY: "NOTIFY",

  // Error handling
  ERROR: "ERROR",
};

/**
 * Message envelope schema
 *
 * @typedef {Object} A2AMessage
 * @property {string} id - Unique message identifier (UUID)
 * @property {string} from - Sender agent ID (e.g., "agent://buyer")
 * @property {string} to - Recipient agent ID or "broadcast"
 * @property {string} type - Message type (OFFER, COUNTER, etc.)
 * @property {string} correlationId - Links related messages in a conversation
 * @property {Object} payload - Type-specific message data
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {string} signature - Ed25519 signature (hex) of canonical JSON
 */

/**
 * Payload schemas for each message type
 */

/**
 * OFFER payload - Buyer initiates negotiation
 * @typedef {Object} OfferPayload
 * @property {string} item - Item being purchased
 * @property {number} qty - Quantity requested
 * @property {number} unitPrice - Price per unit offered
 * @property {string} currency - Currency/token (e.g., "HBAR", "USDC")
 */

/**
 * COUNTER payload - Seller proposes different terms
 * @typedef {Object} CounterPayload
 * @property {string} item - Item reference (from original OFFER)
 * @property {number} qty - Quantity (may differ from OFFER)
 * @property {number} unitPrice - Counter-proposed price
 * @property {string} currency - Currency/token
 * @property {string} reason - Optional explanation
 */

/**
 * ACCEPT payload - Agreement reached
 * @typedef {Object} AcceptPayload
 * @property {string} item - Agreed item
 * @property {number} qty - Agreed quantity
 * @property {number} unitPrice - Agreed price per unit
 * @property {string} currency - Currency/token
 * @property {number} totalAmount - Total payment amount (qty * unitPrice)
 */

/**
 * DECLINE payload - Negotiation rejected
 * @typedef {Object} DeclinePayload
 * @property {string} reason - Explanation for declining
 */

/**
 * PAYMENT_REQ payload - Request payment execution
 * @typedef {Object} PaymentReqPayload
 * @property {number} amount - Amount to transfer
 * @property {string} tokenId - Hedera token ID (e.g., "0.0.12345")
 * @property {string} toAccount - Recipient Hedera account ID
 * @property {string} memo - Payment memo/reference
 * @property {string} item - Item reference
 * @property {number} qty - Quantity purchased
 */

/**
 * PAYMENT_ACK payload - Payment confirmation
 * @typedef {Object} PaymentAckPayload
 * @property {string} transactionId - Hedera transaction ID
 * @property {string} status - "success" or "failed"
 * @property {number} amount - Amount transferred
 * @property {string} tokenId - Token used
 * @property {string} timestamp - Payment execution timestamp
 * @property {string} [error] - Error message if status is "failed"
 */

/**
 * ERROR payload - Error notification
 * @typedef {Object} ErrorPayload
 * @property {string} code - Error code
 * @property {string} message - Human-readable error message
 * @property {string} [originalMessageId] - ID of message that caused error
 */

/**
 * Create a new A2A message
 *
 * @param {Object} params
 * @param {string} params.from - Sender agent ID
 * @param {string} params.to - Recipient agent ID
 * @param {string} params.type - Message type
 * @param {Object} params.payload - Message payload
 * @param {string} [params.correlationId] - Correlation ID (auto-generated if not provided)
 * @returns {A2AMessage} Complete message envelope
 */
export function createMessage({ from, to, type, payload, correlationId }) {
  const messageId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const message = {
    id: messageId,
    from,
    to,
    type,
    correlationId: correlationId || messageId, // Use message ID as correlation if not provided
    payload,
    timestamp,
    signature: "", // Will be filled by signMessage()
  };

  return message;
}

/**
 * Sign a message using Ed25519
 *
 * @param {A2AMessage} message - Message to sign
 * @param {string} privateKey - Private key for signing (hex string)
 * @returns {string} Signature (hex string)
 */
export function signMessage(message, privateKey) {
  // Create canonical JSON representation (sorted keys)
  const canonical = createCanonicalJson(message);

  // Create signature using crypto (Node.js native)
  const keyPair = crypto.createPrivateKey({
    key: Buffer.from(privateKey, "hex"),
    format: "der",
    type: "pkcs8",
  });

  const signature = crypto.sign(null, Buffer.from(canonical), keyPair);
  return signature.toString("hex");
}

/**
 * Verify message signature
 *
 * @param {A2AMessage} message - Message to verify
 * @param {string} publicKey - Public key (hex string)
 * @returns {boolean} True if signature is valid
 */
export function verifyMessage(message, publicKey) {
  try {
    const { signature, ...messageWithoutSignature } = message;
    const canonical = createCanonicalJson(messageWithoutSignature);

    const keyObject = crypto.createPublicKey({
      key: Buffer.from(publicKey, "hex"),
      format: "der",
      type: "spki",
    });

    return crypto.verify(
      null,
      Buffer.from(canonical),
      keyObject,
      Buffer.from(signature, "hex")
    );
  } catch (error) {
    console.error("[A2A] Signature verification failed:", error.message);
    return false;
  }
}

/**
 * Create canonical JSON representation
 * (sorted keys, no whitespace)
 *
 * @param {Object} obj - Object to canonicalize
 * @returns {string} Canonical JSON string
 */
function createCanonicalJson(obj) {
  const sortedObj = sortObjectKeys(obj);
  return JSON.stringify(sortedObj);
}

/**
 * Recursively sort object keys
 *
 * @param {*} obj - Object to sort
 * @returns {*} Object with sorted keys
 */
function sortObjectKeys(obj) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return obj;
  }

  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = sortObjectKeys(obj[key]);
    });

  return sorted;
}

/**
 * Validate message structure
 *
 * @param {A2AMessage} message - Message to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMessage(message) {
  const errors = [];

  // Required fields
  if (!message.id) errors.push("Missing field: id");
  if (!message.from) errors.push("Missing field: from");
  if (!message.to) errors.push("Missing field: to");
  if (!message.type) errors.push("Missing field: type");
  if (!message.correlationId) errors.push("Missing field: correlationId");
  if (!message.payload) errors.push("Missing field: payload");
  if (!message.timestamp) errors.push("Missing field: timestamp");
  // Signature is optional - Hedera provides transaction-level authentication

  // Validate message type
  if (message.type && !Object.values(MessageType).includes(message.type)) {
    errors.push(`Invalid message type: ${message.type}`);
  }

  // Validate agent IDs (optional - allow flexible agent IDs)
  // const validAgentIds = Object.values(AgentId);
  // if (message.from && !validAgentIds.includes(message.from)) {
  //   errors.push(`Invalid from agent ID: ${message.from}`);
  // }
  // if (message.to && !validAgentIds.includes(message.to)) {
  //   errors.push(`Invalid to agent ID: ${message.to}`);
  // }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate payload for specific message type
 *
 * @param {string} type - Message type
 * @param {Object} payload - Payload to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePayload(type, payload) {
  const errors = [];

  switch (type) {
    case MessageType.OFFER:
    case MessageType.COUNTER:
      if (!payload.item) errors.push("Missing payload.item");
      if (typeof payload.qty !== "number") errors.push("Invalid payload.qty");
      if (typeof payload.unitPrice !== "number")
        errors.push("Invalid payload.unitPrice");
      if (!payload.currency) errors.push("Missing payload.currency");
      break;

    case MessageType.ACCEPT:
      if (!payload.item) errors.push("Missing payload.item");
      if (typeof payload.qty !== "number") errors.push("Invalid payload.qty");
      if (typeof payload.unitPrice !== "number")
        errors.push("Invalid payload.unitPrice");
      if (!payload.currency) errors.push("Missing payload.currency");
      if (typeof payload.totalAmount !== "number")
        errors.push("Invalid payload.totalAmount");
      break;

    case MessageType.DECLINE:
      if (!payload.reason) errors.push("Missing payload.reason");
      break;

    case MessageType.PAYMENT_REQ:
      if (typeof payload.amount !== "number")
        errors.push("Invalid payload.amount");
      if (!payload.tokenId) errors.push("Missing payload.tokenId");
      if (!payload.toAccount) errors.push("Missing payload.toAccount");
      if (!payload.memo) errors.push("Missing payload.memo");
      break;

    case MessageType.PAYMENT_ACK:
      if (!payload.transactionId) errors.push("Missing payload.transactionId");
      if (!payload.status) errors.push("Missing payload.status");
      if (typeof payload.amount !== "number")
        errors.push("Invalid payload.amount");
      if (!payload.tokenId) errors.push("Missing payload.tokenId");
      break;

    case MessageType.ERROR:
      if (!payload.code) errors.push("Missing payload.code");
      if (!payload.message) errors.push("Missing payload.message");
      break;

    default:
      errors.push(`Unknown message type: ${type}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper function to create typed messages
 */

export function createOfferMessage(
  from,
  to,
  item,
  qty,
  unitPrice,
  currency,
  correlationId
) {
  return createMessage({
    from,
    to,
    type: MessageType.OFFER,
    payload: { item, qty, unitPrice, currency },
    correlationId,
  });
}

export function createCounterMessage(
  from,
  to,
  item,
  qty,
  unitPrice,
  currency,
  reason,
  correlationId
) {
  return createMessage({
    from,
    to,
    type: MessageType.COUNTER,
    payload: { item, qty, unitPrice, currency, reason },
    correlationId,
  });
}

export function createAcceptMessage(
  from,
  to,
  item,
  qty,
  unitPrice,
  currency,
  correlationId
) {
  const totalAmount = qty * unitPrice;
  return createMessage({
    from,
    to,
    type: MessageType.ACCEPT,
    payload: { item, qty, unitPrice, currency, totalAmount },
    correlationId,
  });
}

export function createDeclineMessage(from, to, reason, correlationId) {
  return createMessage({
    from,
    to,
    type: MessageType.DECLINE,
    payload: { reason },
    correlationId,
  });
}

export function createPaymentReqMessage(
  from,
  to,
  amount,
  tokenId,
  toAccount,
  memo,
  item,
  qty,
  correlationId
) {
  return createMessage({
    from,
    to,
    type: MessageType.PAYMENT_REQ,
    payload: { amount, tokenId, toAccount, memo, item, qty },
    correlationId,
  });
}

export function createPaymentAckMessage(
  from,
  to,
  transactionId,
  status,
  amount,
  tokenId,
  error,
  correlationId
) {
  const payload = {
    transactionId,
    status,
    amount,
    tokenId,
    timestamp: new Date().toISOString(),
  };

  if (error) {
    payload.error = error;
  }

  return createMessage({
    from,
    to,
    type: MessageType.PAYMENT_ACK,
    payload,
    correlationId,
  });
}

export function createErrorMessage(
  from,
  to,
  code,
  message,
  originalMessageId,
  correlationId
) {
  return createMessage({
    from,
    to,
    type: MessageType.ERROR,
    payload: { code, message, originalMessageId },
    correlationId,
  });
}

// Workflow message helpers
export function createTelegramMessage(
  from,
  to,
  text,
  chatId,
  userId,
  correlationId
) {
  return createMessage({
    from,
    to,
    type: MessageType.TELEGRAM_MSG,
    payload: { text, chatId, userId, timestamp: new Date().toISOString() },
    correlationId,
  });
}

export function createAIDecisionRequest(
  from,
  to,
  userRequest,
  context,
  correlationId
) {
  return createMessage({
    from,
    to,
    type: MessageType.AI_DECISION_REQ,
    payload: { userRequest, context },
    correlationId,
  });
}

export function createAIDecisionResponse(
  from,
  to,
  decision,
  shouldExecuteBridge,
  reasoning,
  bridgeParams,
  correlationId
) {
  return createMessage({
    from,
    to,
    type: MessageType.AI_DECISION_RESP,
    payload: { decision, shouldExecuteBridge, reasoning, bridgeParams },
    correlationId,
  });
}

export function createBridgeExecuteRequest(
  from,
  to,
  sourceChain,
  targetChain,
  token,
  amount,
  recipient,
  correlationId
) {
  return createMessage({
    from,
    to,
    type: MessageType.BRIDGE_EXEC_REQ,
    payload: { sourceChain, targetChain, token, amount, recipient },
    correlationId,
  });
}

export function createBridgeExecuteResponse(
  from,
  to,
  status,
  transactionHash,
  error,
  correlationId
) {
  const payload = { status, timestamp: new Date().toISOString() };
  if (transactionHash) payload.transactionHash = transactionHash;
  if (error) payload.error = error;

  return createMessage({
    from,
    to,
    type: MessageType.BRIDGE_EXEC_RESP,
    payload,
    correlationId,
  });
}

export function createNotifyMessage(from, to, message, level, correlationId) {
  return createMessage({
    from,
    to,
    type: MessageType.NOTIFY,
    payload: {
      message,
      level: level || "info",
      timestamp: new Date().toISOString(),
    },
    correlationId,
  });
}
