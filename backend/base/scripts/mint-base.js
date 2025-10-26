const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();
    const BASE_OFT_ADDRESS = "0x612F53C77972F2ACaD4Bfc2D9b64cD255326aE3a";
    
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     MINT MyOFT - Base Sepolia          ║");
    console.log("╚════════════════════════════════════════╝\n");
    
    console.log("Minting to:", signer.address);
    console.log("Contract:", BASE_OFT_ADDRESS);
    
    const oft = await ethers.getContractAt("MyOFT", BASE_OFT_ADDRESS);
    
    // Check balance before
    const balanceBefore = await oft.balanceOf(signer.address);
    console.log("\n📊 Balance Before:", ethers.utils.formatEther(balanceBefore), "MyOFT");
    
    // Mint 10 tokens
    const amount = ethers.utils.parseEther("10");
    console.log("\n⏳ Minting 10 MyOFT...");
    const tx = await oft.mint(signer.address, amount);
    await tx.wait();
    
    // Check balance after
    const balanceAfter = await oft.balanceOf(signer.address);
    console.log("✅ Minted Successfully!");
    console.log("\n📊 Balance After:", ethers.utils.formatEther(balanceAfter), "MyOFT");
    console.log("📈 Minted Amount:", ethers.utils.formatEther(balanceAfter.sub(balanceBefore)), "MyOFT\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

