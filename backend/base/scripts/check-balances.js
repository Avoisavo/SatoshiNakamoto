const { ethers } = require("hardhat");

async function main() {
    const network = await ethers.provider.getNetwork();
    const [signer] = await ethers.getSigners();
    
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║        CHECK MyOFT BALANCES            ║");
    console.log("╚════════════════════════════════════════╝\n");
    
    if (network.chainId === 84532) {
        // Base Sepolia
        const BASE_OFT = "0x612F53C77972F2ACaD4Bfc2D9b64cD255326aE3a";
        const BASE_ACCOUNT = "0x8ADab1E200627b935ACD336FB3EDC14D63C3224f";
        
        console.log("🔵 BASE SEPOLIA");
        console.log("═══════════════════════════════════════");
        console.log("Network: Base Sepolia");
        console.log("Contract:", BASE_OFT);
        console.log("Account:", BASE_ACCOUNT);
        
        const oft = await ethers.getContractAt("MyOFT", BASE_OFT);
        const balance = await oft.balanceOf(BASE_ACCOUNT);
        const totalSupply = await oft.totalSupply();
        
        console.log("\n💰 MyOFT Balance:", ethers.utils.formatEther(balance), "MyOFT");
        console.log("📊 Total Supply:", ethers.utils.formatEther(totalSupply), "MyOFT");
        
        const ethBalance = await ethers.provider.getBalance(BASE_ACCOUNT);
        console.log("⛽ ETH Balance:", ethers.utils.formatEther(ethBalance), "ETH\n");
        
    } else if (network.chainId === 296) {
        // Hedera Testnet
        const HEDERA_OFT = "0x1498FECa6fb7525616C369592440B6E8325C3D6D";
        const METAMASK_ACCOUNT = "0xfEC6BB7506B4c06ddA315c8C12ED030eb05bdE28";
        
        console.log("🟣 HEDERA TESTNET");
        console.log("═══════════════════════════════════════");
        console.log("Network: Hedera Testnet");
        console.log("Contract:", HEDERA_OFT);
        console.log("Account:", METAMASK_ACCOUNT);
        
        const oft = await ethers.getContractAt("MyOFT", HEDERA_OFT);
        const balance = await oft.balanceOf(METAMASK_ACCOUNT);
        const totalSupply = await oft.totalSupply();
        
        console.log("\n💰 MyOFT Balance:", ethers.utils.formatEther(balance), "MyOFT");
        console.log("📊 Total Supply:", ethers.utils.formatEther(totalSupply), "MyOFT");
        
        const hbarBalance = await ethers.provider.getBalance(METAMASK_ACCOUNT);
        console.log("⛽ HBAR Balance:", ethers.utils.formatEther(hbarBalance), "HBAR\n");
        
    } else {
        console.log("❌ Unknown network. Use --network base-sepolia or --network hedera-testnet");
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

