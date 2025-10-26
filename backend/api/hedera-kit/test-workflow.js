/**
 * Test the Telegram → AI → Bridge workflow
 *
 * Tests the complete A2A communication flow:
 * 1. Telegram Agent receives message
 * 2. AI Agent makes decision
 * 3. Bridge Executor executes (simulated)
 * 4. Notifications sent back to Telegram
 */

import { AgentSystem } from "./agent-system.js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPaths = [
  join(__dirname, "../../../.env"),
  join(process.cwd(), ".env"),
  "/Users/edw/Desktop/LinkedOut/.env",
];

let envLoaded = false;
for (const path of envPaths) {
  const result = dotenv.config({ path });
  if (!result.error) {
    console.log(`✅ Loaded .env from: ${path}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.error("❌ Could not load .env file");
  process.exit(1);
}

/**
 * Test Scenario 1: User requests valid bridge operation
 */
async function testValidBridgeRequest() {
  console.log("\n🎯 Scenario 1: Valid Bridge Request");
  console.log("==========================================");
  console.log("User requests: 'Bridge 100 USDC from Ethereum to Polygon'\n");

  const system = new AgentSystem();
  await system.initialize();
  await system.start();

  // Wait for subscriptions to be fully established
  console.log("⏳ Waiting for subscriptions to be ready...\n");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  let aiDecision = null;
  let bridgeRequested = false;

  // Listen for AI decision
  system.telegramAgent.on("aiDecisionReceived", (data) => {
    aiDecision = data;
  });

  // Listen for bridge request
  system.bridgeAgent.on("bridgeRequested", () => {
    bridgeRequested = true;
  });

  // Simulate Telegram message
  console.log("📱 Telegram: User sends message");
  const correlationId = await system.telegramAgent.receiveFromTelegram({
    text: "Bridge 100 USDC from Ethereum to Polygon",
    chatId: "test-chat-123",
    userId: "user-456",
  });

  console.log(`   Correlation ID: ${correlationId}\n`);

  // Wait for processing
  console.log("⏳ Waiting for A2A communication...\n");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Check results
  if (aiDecision && aiDecision.decision === "APPROVE" && bridgeRequested) {
    console.log("✅ Scenario 1: PASSED");
    console.log("   ✓ AI approved the request");
    console.log("   ✓ Bridge execution requested");

    // Simulate bridge execution
    console.log("\n🌉 Simulating bridge execution...");
    await system.bridgeAgent.simulateBridgeExecution(correlationId);

    // Wait for notification
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const notifications =
      system.telegramAgent.getPendingNotifications("test-chat-123");
    console.log(`\n📢 Notifications received: ${notifications.length}`);
    notifications.forEach((n) => {
      console.log(`   ${n.level}: ${n.message}`);
    });

    await system.stop();
    return true;
  } else {
    console.log("❌ Scenario 1: FAILED");
    console.log(`   AI Decision: ${aiDecision?.decision || "none"}`);
    console.log(`   Bridge Requested: ${bridgeRequested}`);
    await system.stop();
    return false;
  }
}

/**
 * Test Scenario 2: User requests invalid operation (rejected)
 */
async function testInvalidRequest() {
  console.log("\n🎯 Scenario 2: Invalid Request (Should Reject)");
  console.log("==========================================");
  console.log("User requests: 'What is the weather today?'\n");

  const system = new AgentSystem();
  await system.initialize();
  await system.start();

  // Wait for subscriptions
  console.log("⏳ Waiting for subscriptions to be ready...\n");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  let aiDecision = null;

  system.telegramAgent.on("aiDecisionReceived", (data) => {
    aiDecision = data;
  });

  console.log("📱 Telegram: User sends non-bridge message");
  const correlationId = await system.telegramAgent.receiveFromTelegram({
    text: "What is the weather today?",
    chatId: "test-chat-456",
    userId: "user-789",
  });

  console.log(`   Correlation ID: ${correlationId}\n`);

  // Wait for processing
  console.log("⏳ Waiting for A2A communication...\n");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Check results
  if (aiDecision && aiDecision.decision === "REJECT") {
    console.log("✅ Scenario 2: PASSED");
    console.log("   ✓ AI correctly rejected non-bridge request");

    const notifications =
      system.telegramAgent.getPendingNotifications("test-chat-456");
    console.log(`\n📢 Notifications received: ${notifications.length}`);
    notifications.forEach((n) => {
      console.log(`   ${n.level}: ${n.message}`);
    });

    await system.stop();
    return true;
  } else {
    console.log("❌ Scenario 2: FAILED");
    console.log(`   AI Decision: ${aiDecision?.decision || "none"}`);
    await system.stop();
    return false;
  }
}

/**
 * Test Scenario 3: Incomplete bridge parameters
 */
async function testIncompleteRequest() {
  console.log("\n🎯 Scenario 3: Incomplete Request (Missing Parameters)");
  console.log("==========================================");
  console.log("User requests: 'Bridge some tokens please'\n");

  const system = new AgentSystem();
  await system.initialize();
  await system.start();

  // Wait for subscriptions
  console.log("⏳ Waiting for subscriptions to be ready...\n");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  let aiDecision = null;

  system.telegramAgent.on("aiDecisionReceived", (data) => {
    aiDecision = data;
  });

  console.log("📱 Telegram: User sends incomplete request");
  const correlationId = await system.telegramAgent.receiveFromTelegram({
    text: "Bridge some tokens please",
    chatId: "test-chat-789",
    userId: "user-101",
  });

  console.log(`   Correlation ID: ${correlationId}\n`);

  // Wait for processing
  console.log("⏳ Waiting for A2A communication...\n");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Check results
  if (aiDecision && aiDecision.decision === "REJECT") {
    console.log("✅ Scenario 3: PASSED");
    console.log("   ✓ AI correctly rejected incomplete request");
    console.log(
      `   ✓ Reasoning: ${
        aiDecision.shouldExecuteBridge === false ? "Missing parameters" : ""
      }`
    );

    await system.stop();
    return true;
  } else {
    console.log("❌ Scenario 3: FAILED");
    console.log(`   AI Decision: ${aiDecision?.decision || "none"}`);
    await system.stop();
    return false;
  }
}

/**
 * Run all test scenarios
 */
async function runAllTests() {
  console.log("\n🧪 Testing Telegram → AI → Bridge Workflow");
  console.log("============================================\n");

  const results = {
    validRequest: await testValidBridgeRequest(),
  };

  await new Promise((resolve) => setTimeout(resolve, 3000));

  results.invalidRequest = await testInvalidRequest();

  await new Promise((resolve) => setTimeout(resolve, 3000));

  results.incompleteRequest = await testIncompleteRequest();

  console.log("\n📊 Test Results Summary");
  console.log("==========================================");
  console.log(
    `✅ Valid Request:      ${results.validRequest ? "PASSED" : "FAILED"}`
  );
  console.log(
    `✅ Invalid Request:    ${results.invalidRequest ? "PASSED" : "FAILED"}`
  );
  console.log(
    `✅ Incomplete Request: ${results.incompleteRequest ? "PASSED" : "FAILED"}`
  );

  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  console.log(`\n${passedCount}/${totalCount} tests passed`);

  if (passedCount === totalCount) {
    console.log("🎉 All tests passed!\n");
  } else {
    console.log("⚠️  Some tests failed. Check logs above.\n");
  }

  process.exit(passedCount === totalCount ? 0 : 1);
}

// Parse command line arguments
const scenario = process.argv[2] || "all";

switch (scenario) {
  case "valid":
    testValidBridgeRequest()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Test failed:", error);
        process.exit(1);
      });
    break;
  case "invalid":
    testInvalidRequest()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Test failed:", error);
        process.exit(1);
      });
    break;
  case "incomplete":
    testIncompleteRequest()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Test failed:", error);
        process.exit(1);
      });
    break;
  case "all":
  default:
    runAllTests();
}
