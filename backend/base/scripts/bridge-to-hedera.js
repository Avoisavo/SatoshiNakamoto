const { ethers } = require("hardhat");
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function main() {
    const [signer] = await ethers.getSigners();
    
    const BASE_OFT_ADDRESS = "0x612F53C77972F2ACaD4Bfc2D9b64cD255326aE3a";
    const HEDERA_RECIPIENT = "0xfEC6BB7506B4c06ddA315c8C12ED030eb05bdE28";
    const AMOUNT = "0.0001";
    
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║   BRIDGE: Base Sepolia → Hedera        ║");
    console.log("╚════════════════════════════════════════╝\n");
    
    console.log("From (Base):", signer.address);
    console.log("To (Hedera):", HEDERA_RECIPIENT);
    console.log("Amount:", AMOUNT, "MyOFT\n");
    
    // Check network
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 84532) {
        console.error("❌ Error: Must run on Base Sepolia network");
        console.error("Use: npx hardhat run scripts/bridge-to-hedera.js --network base-sepolia");
        process.exit(1);
    }
    
    const oft = await ethers.getContractAt("MyOFT", BASE_OFT_ADDRESS);
    
    // Check balance before
    const balanceBefore = await oft.balanceOf(signer.address);
    const ethBefore = await ethers.provider.getBalance(signer.address);
    
    console.log("📊 BEFORE BRIDGE");
    console.log("═══════════════════════════════");
    console.log("MyOFT Balance:", ethers.utils.formatEther(balanceBefore), "MyOFT");
    console.log("ETH Balance:", ethers.utils.formatEther(ethBefore), "ETH\n");
    
    // Execute bridge
    console.log("🌉 Executing Bridge Transaction...\n");
    
    try {
        const { stdout, stderr } = await execPromise(
            `npx hardhat lz:oft:send --src-eid 40245 --dst-eid 40285 --to ${HEDERA_RECIPIENT} --amount ${AMOUNT} --network base-sepolia`
        );
        console.log(stdout);
        if (stderr && !stderr.includes('info')) {
            console.error(stderr);
        }
    } catch (error) {
        console.error("❌ Bridge failed:", error.message);
        if (error.stdout) console.log(error.stdout);
        if (error.stderr) console.error(error.stderr);
        process.exit(1);
    }
    
    // Wait and check balance after
    console.log("\n⏳ Waiting 5 seconds...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const balanceAfter = await oft.balanceOf(signer.address);
    const ethAfter = await ethers.provider.getBalance(signer.address);
    
    console.log("\n📊 AFTER BRIDGE");
    console.log("═══════════════════════════════");
    console.log("MyOFT Balance:", ethers.utils.formatEther(balanceAfter), "MyOFT");
    console.log("ETH Balance:", ethers.utils.formatEther(ethAfter), "ETH");
    console.log("\n📉 MyOFT Sent:", ethers.utils.formatEther(balanceBefore.sub(balanceAfter)), "MyOFT");
    console.log("💰 Gas Used:", ethers.utils.formatEther(ethBefore.sub(ethAfter)), "ETH");
    
    console.log("\n✅ Bridge Transaction Completed!");
    console.log("\n📊 Next Steps:");
    console.log("  1. Wait 2-5 minutes for cross-chain delivery");
    console.log("  2. Run: npx hardhat run scripts/check-balances.js --network hedera-testnet");
    console.log("  3. Track: https://testnet.layerzeroscan.com/\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

