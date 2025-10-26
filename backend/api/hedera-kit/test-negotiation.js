/**
 * Test Hedera Agent Kit A2A Negotiation
 *
 * Tests agents built with Hedera Agent Kit performing A2A communication
 */

import { BuyerKitAgent } from "../hedera-kit/buyer-kit-agent.js";
import { SellerKitAgent } from "../hedera-kit/seller-kit-agent.js";
import { PaymentKitAgent } from "../hedera-kit/payment-kit-agent.js";
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
for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✅ Loaded environment from: ${envPath}\n`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.error("❌ Could not load .env file");
  process.exit(1);
}

/**
 * Scenario 1: Happy Path
 * Buyer offers good price → Seller accepts → Payment
 */
async function testHappyPath() {
  console.log("\n🎯 Scenario 1: Happy Path (Hedera Agent Kit)");
  console.log("=========================================");
  console.log("Buyer offers good price → Seller accepts → Payment\n");

  const seller = new SellerKitAgent({
    accountId: process.env.HEDERA_SELLER_ACCOUNT_ID,
    privateKey: process.env.HEDERA_SELLER_PRIVATE_KEY,
    topicId: process.env.HCS_TOPIC_ID,
    minPrice: 50,
    idealPrice: 80,
    inventory: { widgets: 100 },
  });

  const buyer = new BuyerKitAgent({
    accountId: process.env.HEDERA_BUYER_ACCOUNT_ID,
    privateKey: process.env.HEDERA_BUYER_PRIVATE_KEY,
    topicId: process.env.HCS_TOPIC_ID,
    maxPrice: 90,
    paymentTokenId: process.env.HTS_TOKEN_ID,
    sellerAccountId: process.env.HEDERA_SELLER_ACCOUNT_ID,
  });

  const payment = new PaymentKitAgent({
    accountId: process.env.HEDERA_PAYMENT_ACCOUNT_ID,
    privateKey: process.env.HEDERA_PAYMENT_PRIVATE_KEY,
    topicId: process.env.HCS_TOPIC_ID,
  });

  await Promise.all([seller.start(), buyer.start(), payment.start()]);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  let paymentSuccess = false;
  let transactionId = null;

  buyer.on("paymentSuccess", (data) => {
    paymentSuccess = true;
    transactionId = data.transactionId;
  });

  // Buyer makes offer
  console.log("👤 Buyer: Making offer for 10 widgets at 75 HBAR each\n");

  await buyer.makeOffer({
    item: "widgets",
    qty: 10,
    unitPrice: 75,
    currency: "HBAR",
  });

  // Wait for negotiation and payment
  console.log("⏳ Waiting for negotiation to complete...\n");

  const timeout = 60000; // Increased timeout for Agent Kit
  const startTime = Date.now();

  while (!paymentSuccess && Date.now() - startTime < timeout) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (paymentSuccess && transactionId) {
    console.log(`\n✅ Payment successful! Tx: ${transactionId}`);
    console.log("\n✅ Scenario 1: PASSED");
    console.log("   Deal accepted and payment executed successfully\n");
  } else {
    console.log("\n❌ Scenario 1: FAILED");
    console.log("   Payment not completed within timeout\n");
  }

  await Promise.all([seller.stop(), buyer.stop(), payment.stop()]);

  return paymentSuccess;
}

/**
 * Scenario 2: Multi-Round Negotiation
 * Buyer offers low → Seller counters → Buyer accepts
 */
async function testNegotiation() {
  console.log("\n🎯 Scenario 2: Multi-Round Negotiation (Hedera Agent Kit)");
  console.log("=========================================");
  console.log("Buyer offers low → Seller counters → Buyer accepts\n");

  const seller = new SellerKitAgent({
    accountId: process.env.HEDERA_SELLER_ACCOUNT_ID,
    privateKey: process.env.HEDERA_SELLER_PRIVATE_KEY,
    topicId: process.env.HCS_TOPIC_ID,
    minPrice: 60,
    idealPrice: 90,
    inventory: { gadgets: 50 },
  });

  const buyer = new BuyerKitAgent({
    accountId: process.env.HEDERA_BUYER_ACCOUNT_ID,
    privateKey: process.env.HEDERA_BUYER_PRIVATE_KEY,
    topicId: process.env.HCS_TOPIC_ID,
    maxPrice: 85,
    paymentTokenId: process.env.HTS_TOKEN_ID,
    sellerAccountId: process.env.HEDERA_SELLER_ACCOUNT_ID,
  });

  const payment = new PaymentKitAgent({
    accountId: process.env.HEDERA_PAYMENT_ACCOUNT_ID,
    privateKey: process.env.HEDERA_PAYMENT_PRIVATE_KEY,
    topicId: process.env.HCS_TOPIC_ID,
  });

  await Promise.all([seller.start(), buyer.start(), payment.start()]);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  let counterReceived = false;
  let paymentSuccess = false;

  buyer.on("message", (msg) => {
    if (msg.type === "COUNTER") {
      counterReceived = true;
    }
  });

  buyer.on("paymentSuccess", () => {
    paymentSuccess = true;
  });

  // Buyer makes low offer
  console.log("👤 Buyer: Making low offer for 5 gadgets at 65 HBAR each\n");

  await buyer.makeOffer({
    item: "gadgets",
    qty: 5,
    unitPrice: 65,
    currency: "HBAR",
  });

  // Wait for negotiation
  console.log("⏳ Waiting for negotiation rounds...\n");

  const timeout = 60000;
  const startTime = Date.now();

  while (!paymentSuccess && Date.now() - startTime < timeout) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (counterReceived && paymentSuccess) {
    console.log("\n✅ Scenario 2: PASSED");
    console.log("   Negotiation occurred and deal was reached\n");
  } else {
    console.log("\n❌ Scenario 2: FAILED");
    console.log(
      `   Counter received: ${counterReceived}, Payment: ${paymentSuccess}\n`
    );
  }

  await Promise.all([seller.stop(), buyer.stop(), payment.stop()]);

  return counterReceived && paymentSuccess;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log("\n🧪 Running All Test Scenarios with Hedera Agent Kit");
  console.log("==========================================\n");

  const results = {
    happyPath: await testHappyPath(),
  };

  // Wait between tests
  await new Promise((resolve) => setTimeout(resolve, 5000));

  results.negotiation = await testNegotiation();

  console.log("\n📊 Test Results Summary");
  console.log("==========================================");
  console.log(`✅ Happy Path:      ${results.happyPath ? "PASSED" : "FAILED"}`);
  console.log(
    `✅ Negotiation:     ${results.negotiation ? "PASSED" : "FAILED"}`
  );

  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  console.log(`\n${passedCount}/${totalCount} tests passed\n`);

  if (passedCount === totalCount) {
    console.log("🎉 All tests passed with Hedera Agent Kit!\n");
  } else {
    console.log("⚠️  Some tests failed. Check logs above.\n");
  }
}

// Parse command line arguments
const scenario = process.argv[2] || "all";

switch (scenario) {
  case "happy":
    testHappyPath()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
    break;
  case "negotiate":
    testNegotiation()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
    break;
  case "all":
  default:
    runAllTests()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
}
