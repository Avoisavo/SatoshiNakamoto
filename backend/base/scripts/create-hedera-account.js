
/**
 * Create a Hedera ECDSA account from your existing Ethereum private key
 * This allows you to use the same address on both Base Sepolia and Hedera
 */

const {
    Client,
    AccountCreateTransaction,
    PrivateKey,
    Hbar,
    AccountId
} = require("@hashgraph/sdk");
require('dotenv').config();

async function createHederaAccount() {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║     Creating Hedera Account from Ethereum Key         ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    // Get your Ethereum private key from .env
    const ethPrivateKey = process.env.PRIVATE_KEY;
    if (!ethPrivateKey) {
        console.error("❌ Error: PRIVATE_KEY not found in .env file");
        process.exit(1);
    }

    // Remove 0x prefix if present
    const cleanKey = ethPrivateKey.replace('0x', '');

    try {
        // Convert Ethereum key to Hedera format
        const hederaPrivateKey = PrivateKey.fromStringECDSA(cleanKey);
        const hederaPublicKey = hederaPrivateKey.publicKey;

        console.log("🔑 Your Ethereum/Hedera Private Key Details:");
        console.log("   Public Key:", hederaPublicKey.toString());
        console.log("   EVM Address:", hederaPublicKey.toEvmAddress());
        console.log();

        // Create client with a temporary account (using Hedera testnet portal)
        // You'll need to fund this first time from the portal
        console.log("📝 IMPORTANT: To create your Hedera account, you need an existing");
        console.log("   funded account to pay the creation fee (~1 HBAR).\n");
        console.log("🎯 Two ways to proceed:\n");
        
        console.log("METHOD 1: Use Hedera Portal (Easiest)");
        console.log("   1. Go to: https://portal.hedera.com/");
        console.log("   2. Create a free testnet account");
        console.log("   3. Get your Account ID (e.g., 0.0.12345)");
        console.log("   4. Get your private key from the portal");
        console.log("   5. Add to .env:");
        console.log("      HEDERA_OPERATOR_ID=0.0.12345");
        console.log("      HEDERA_OPERATOR_KEY=your_portal_key");
        console.log("   6. Run this script again\n");

        console.log("METHOD 2: Use Existing Account");
        if (process.env.HEDERA_OPERATOR_ID && process.env.HEDERA_OPERATOR_KEY) {
            console.log("   ✅ Found operator credentials in .env\n");

            const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
            const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);

            const client = Client.forTestnet();
            client.setOperator(operatorId, operatorKey);

            console.log("🚀 Creating your Hedera account...");

            const transaction = new AccountCreateTransaction()
                .setKey(hederaPublicKey)
                .setInitialBalance(new Hbar(10)) // 10 HBAR initial balance
                .setMaxAutomaticTokenAssociations(10);

            const response = await transaction.execute(client);
            const receipt = await response.getReceipt(client);
            const newAccountId = receipt.accountId;

            console.log("\n✅ SUCCESS! Your Hedera account has been created!");
            console.log("┌─────────────────────────────────────────────────────┐");
            console.log("│  Hedera Account ID:", newAccountId.toString().padEnd(30), "│");
            console.log("│  EVM Address:", hederaPublicKey.toEvmAddress().padEnd(34), "│");
            console.log("│  Initial Balance: 10 HBAR                           │");
            console.log("└─────────────────────────────────────────────────────┘\n");

            console.log("🔗 View your account:");
            console.log("   https://hashscan.io/testnet/account/" + newAccountId.toString());
            console.log();

            console.log("✨ Next steps:");
            console.log("   1. Now you can deploy to Hedera:");
            console.log("      npx hardhat lz:deploy --network hedera-testnet");
            console.log();

            client.close();
        } else {
            console.log("   ❌ No operator credentials found in .env");
            console.log("   Please follow METHOD 1 above to get started\n");
        }

        console.log("📚 Learn more:");
        console.log("   - Hedera Portal: https://portal.hedera.com/");
        console.log("   - Hedera Docs: https://docs.hedera.com/hedera/getting-started/introduction");

    } catch (error) {
        console.error("\n❌ Error:", error.message);
        if (error.message.includes("INSUFFICIENT_PAYER_BALANCE")) {
            console.error("\n💡 The operator account doesn't have enough HBAR.");
            console.error("   Get testnet HBAR from: https://portal.hedera.com/");
        }
        process.exit(1);
    }
}

createHederaAccount();

