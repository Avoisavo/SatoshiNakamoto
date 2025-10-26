import {
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TokenCreateTransaction,
  TokenType,
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env file
// Try multiple paths to ensure we find the .env file
const envPaths = [
  join(__dirname, "../../../../.env"), // From scripts/ folder
  join(process.cwd(), ".env"), // From current working directory
  "/Users/edw/Desktop/LinkedOut/.env", // Absolute path
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
  console.error("⚠️  Warning: Could not load .env file");
  console.error("Tried paths:", envPaths);
  console.error("\nMake sure .env exists in project root\n");
}

async function createResources() {
  console.log("🚀 Hedera Resource Setup Script");
  console.log("================================\n");

  // Check environment
  const accountId = process.env.HEDERA_PAYMENT_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PAYMENT_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    console.error(
      "❌ Error: Missing HEDERA_PAYMENT_ACCOUNT_ID or HEDERA_PAYMENT_PRIVATE_KEY"
    );
    console.error(
      "Please create a .env file in the project root (see env.example)"
    );
    process.exit(1);
  }

  console.log(`Using account: ${accountId}\n`);

  try {
    // Initialize client
    const client = Client.forTestnet().setOperator(
      accountId,
      PrivateKey.fromStringECDSA(privateKey)
    );

    console.log("✅ Hedera client initialized\n");

    // Create HCS Topic
    console.log("📝 Creating HCS Topic for A2A messages...");
    const topicTx = await new TopicCreateTransaction()
      .setTopicMemo("LinkedOut A2A Message Bus")
      // No submit key = anyone can submit messages
      .execute(client);

    const topicReceipt = await topicTx.getReceipt(client);
    const topicId = topicReceipt.topicId.toString();

    console.log(`✅ HCS Topic created: ${topicId}\n`);

    // Optionally create HTS token (or user can use existing one)
    console.log("💰 Creating demo HTS token (optional)...");
    console.log("   (You can skip this and use existing tokens like HBAR)\n");

    try {
      const tokenTx = await new TokenCreateTransaction()
        .setTokenName("Demo Token")
        .setTokenSymbol("DEMO")
        .setDecimals(2)
        .setInitialSupply(1000000) // 1 million tokens
        .setTreasuryAccountId(accountId)
        .setTokenType(TokenType.FungibleCommon)
        .setAdminKey(client.operatorPublicKey)
        .setSupplyKey(client.operatorPublicKey)
        .execute(client);

      const tokenReceipt = await tokenTx.getReceipt(client);
      const tokenId = tokenReceipt.tokenId.toString();

      console.log(`✅ Demo token created: ${tokenId}\n`);

      // Print summary
      console.log("✅ Setup Complete!");
      console.log("===================\n");
      console.log("Add these to your root .env file:\n");
      console.log(`HCS_TOPIC_ID=${topicId}`);
      console.log(`HTS_TOKEN_ID=${tokenId} # or use HBAR for testing\n`);
      console.log(
        'Note: You can also use "HBAR" as the token ID for native transfers\n'
      );
    } catch (tokenError) {
      console.log("⚠️  Token creation skipped (you can use HBAR instead)");
      console.log("   Or create a token manually on HashScan\n");

      console.log("✅ Setup Complete!");
      console.log("===================\n");
      console.log("Add this to your root .env file:\n");
      console.log(`HCS_TOPIC_ID=${topicId}`);
      console.log(`HTS_TOKEN_ID=HBAR # using HBAR for payments\n`);
    }

    console.log("Next steps:");
    console.log("1. Update root .env file with the IDs above");
    console.log("2. Run: cd backend/api && npm install");
    console.log("3. Test: node backend/api/hedera/test-negotiation.js\n");

    client.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createResources();
