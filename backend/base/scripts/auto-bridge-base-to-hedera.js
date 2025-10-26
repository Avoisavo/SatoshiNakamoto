const { ethers } = require("hardhat");
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function main() {
    const [signer] = await ethers.getSigners();
    
    // Configuration
    const BASE_SEPOLIA_OFT = "0x612F53C77972F2ACaD4Bfc2D9b64cD255326aE3a";
    const RECIPIENT_ADDRESS = "0xfEC6BB7506B4c06ddA315c8C12ED030eb05bdE28";
    const AMOUNT_TO_BRIDGE = "0.0001"; // 0.5 tokens
    
    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║     Automated Bridge: Base Sepolia → Hedera           ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");
    
    console.log("From account:", signer.address);
    console.log("Recipient on Hedera:", RECIPIENT_ADDRESS);
    console.log("Amount to bridge:", AMOUNT_TO_BRIDGE, "MyOFT\n");
    
    // Check if we're on Base Sepolia
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 84532) {
        console.error("❌ Error: Please run this script on Base Sepolia network");
        console.error("Use: npx hardhat run scripts/auto-bridge-base-to-hedera.js --network base-sepolia");
        process.exit(1);
    }
    
    const baseSepoliaOFT = await ethers.getContractAt("MyOFT", BASE_SEPOLIA_OFT);
    
    // ═══════════════════════════════════════════════════════
    // STEP 1: Check balances BEFORE bridge
    // ═══════════════════════════════════════════════════════
    console.log("━".repeat(60));
    console.log("📊 BALANCES BEFORE BRIDGE");
    console.log("━".repeat(60));
    
    const senderBalanceBefore = await baseSepoliaOFT.balanceOf(signer.address);
    const senderEthBefore = await ethers.provider.getBalance(signer.address);
    
    console.log("\n🔵 Base Sepolia (Source Chain):");
    console.log("  Sender:", signer.address);
    console.log("  MyOFT Balance:", ethers.utils.formatEther(senderBalanceBefore), "MyOFT");
    console.log("  ETH Balance:", ethers.utils.formatEther(senderEthBefore), "ETH");
    
    // ═══════════════════════════════════════════════════════
    // STEP 2: Execute Bridge Transaction
    // ═══════════════════════════════════════════════════════
    console.log("\n" + "━".repeat(60));
    console.log("🌉 EXECUTING BRIDGE TRANSACTION");
    console.log("━".repeat(60));
    
    console.log("\n🚀 Initiating bridge transaction...\n");
    
    try {
        const { stdout, stderr } = await execPromise(
            `npx hardhat lz:oft:send --src-eid 40245 --dst-eid 40285 --to ${RECIPIENT_ADDRESS} --amount ${AMOUNT_TO_BRIDGE} --network base-sepolia`
        );
        console.log(stdout);
        if (stderr && !stderr.includes('info')) {
            console.error(stderr);
        }
    } catch (error) {
        console.error("❌ Bridge transaction failed:", error.message);
        if (error.stdout) console.log(error.stdout);
        if (error.stderr) console.error(error.stderr);
        process.exit(1);
    }
    
    // ═══════════════════════════════════════════════════════
    // STEP 3: Check balances AFTER bridge
    // ═══════════════════════════════════════════════════════
    console.log("\n" + "━".repeat(60));
    console.log("📊 BALANCES AFTER BRIDGE (Base Sepolia)");
    console.log("━".repeat(60));
    
    console.log("\n⏳ Waiting 5 seconds for transaction to process...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const senderBalanceAfter = await baseSepoliaOFT.balanceOf(signer.address);
    const senderEthAfter = await ethers.provider.getBalance(signer.address);
    
    console.log("\n🔵 Base Sepolia (Source Chain):");
    console.log("  Sender:", signer.address);
    console.log("  MyOFT Balance:", ethers.utils.formatEther(senderBalanceAfter), "MyOFT");
    console.log("  ETH Balance:", ethers.utils.formatEther(senderEthAfter), "ETH");
    
    const balanceChange = senderBalanceBefore.sub(senderBalanceAfter);
    console.log("\n  📉 MyOFT Sent:", ethers.utils.formatEther(balanceChange), "MyOFT");
    
    const ethUsed = senderEthBefore.sub(senderEthAfter);
    console.log("  💰 Gas Used:", ethers.utils.formatEther(ethUsed), "ETH");
    
    console.log("\n" + "━".repeat(60));
    console.log("✅ BRIDGE TRANSACTION COMPLETED!");
    console.log("━".repeat(60));
    
    console.log("\n📊 Next Steps:");
    console.log("  1. Wait 2-5 minutes for cross-chain delivery");
    console.log("  2. Check Hedera balance with:");
    console.log("     npx hardhat run scripts/check-hedera-balance.js --network hedera-testnet");
    console.log("\n📊 Track on LayerZero Scan: https://testnet.layerzeroscan.com/\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
