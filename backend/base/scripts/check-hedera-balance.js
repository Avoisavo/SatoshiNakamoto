const { ethers } = require("hardhat");

async function main() {
    const HEDERA_TESTNET_OFT = "0xAd9C65E6F4BD584A77bA942B7a5f4BEc67520181";
    const RECIPIENT_ADDRESS = "0xfEC6BB7506B4c06ddA315c8C12ED030eb05bdE28";
    
    console.log("\n🔍 Checking Hedera Testnet Balance");
    console.log("━".repeat(60));
    console.log("Address:", RECIPIENT_ADDRESS);
    console.log("━".repeat(60));
    
    // Check if we're on Hedera Testnet
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 296) {
        console.error("\n❌ Error: Please run this script on Hedera Testnet network");
        console.error("Use: npx hardhat run scripts/check-hedera-balance.js --network hedera-testnet");
        process.exit(1);
    }
    
    try {
        const hederaOFT = await ethers.getContractAt("MyOFT", HEDERA_TESTNET_OFT);
        
        // Get balances
        const balance = await hederaOFT.balanceOf(RECIPIENT_ADDRESS);
        const totalSupply = await hederaOFT.totalSupply();
        const hbarBalance = await ethers.provider.getBalance(RECIPIENT_ADDRESS);
        
        console.log("\n🟣 Hedera Testnet Network");
        console.log("  MyOFT Balance:", ethers.utils.formatEther(balance), "MyOFT");
        console.log("  Total Supply:", ethers.utils.formatEther(totalSupply), "MyOFT");
        console.log("  HBAR Balance:", ethers.utils.formatEther(hbarBalance), "HBAR");
        
        console.log("\n" + "━".repeat(60));
        console.log("✅ Balance check completed!\n");
        
    } catch (error) {
        console.error("\n❌ Error checking balance:");
        console.error(error.message);
        throw error;
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
