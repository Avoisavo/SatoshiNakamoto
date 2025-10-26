import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

/**
 * Deploy ConditionalBridge contract
 * 
 * Usage:
 * npx hardhat deploy --network base-sepolia --tags ConditionalBridge
 */
const deployConditionalBridge: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`\n🚀 Deploying ConditionalBridge on ${network.name}...`);

  // Get existing MyOFT deployment
  let myOFTAddress: string;
  try {
    const myOFT = await get('MyOFT');
    myOFTAddress = myOFT.address;
    console.log(`✅ Found existing MyOFT at: ${myOFTAddress}`);
  } catch (e) {
    throw new Error('❌ MyOFT not deployed yet. Please deploy MyOFT first.');
  }

  // Pyth contract addresses per network
  // See: https://docs.pyth.network/price-feeds/contract-addresses/evm
  const pythAddresses: { [key: string]: string } = {
    'base-sepolia': '0xA2aa501b19aff244D90cc15a4Cf739D2725B5729',
    'base': '0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a',
    'hedera-testnet': '0xa2aa501b19aff244d90cc15a4cf739d2725b5729', // Check if available
    'ethereum': '0x4305FB66699C3B2702D4d05CF36551390A4c69C6',
    'arbitrum': '0xff1a0f4744e8582DF1aE09D5611b887B6a12925C',
    'optimism': '0xff1a0f4744e8582DF1aE09D5611b887B6a12925C',
    'polygon': '0xff1a0f4744e8582DF1aE09D5611b887B6a12925C',
  };

  const pythAddress = pythAddresses[network.name];
  if (!pythAddress) {
    throw new Error(`❌ Pyth contract address not configured for ${network.name}`);
  }

  console.log(`📊 Using Pyth contract: ${pythAddress}`);

  // Deploy ConditionalBridge
  const conditionalBridge = await deploy('ConditionalBridge', {
    from: deployer,
    args: [
      pythAddress,      // Pyth contract
      myOFTAddress,     // MyOFT contract
      deployer,         // Owner
    ],
    log: true,
    waitConfirmations: 1,
  });

  console.log(`✅ ConditionalBridge deployed at: ${conditionalBridge.address}`);
  
  // Grant approval for ConditionalBridge to spend MyOFT tokens (optional, users can do this themselves)
  console.log('\n📝 Note: Users need to approve ConditionalBridge to spend their MyOFT tokens');
  console.log(`   Call: MyOFT.approve("${conditionalBridge.address}", amount)`);

  console.log('\n🎉 Deployment complete!');
  console.log(`\n📋 Contract addresses:`);
  console.log(`   MyOFT: ${myOFTAddress}`);
  console.log(`   ConditionalBridge: ${conditionalBridge.address}`);
  console.log(`   Pyth: ${pythAddress}`);
  
  return true;
};

export default deployConditionalBridge;
deployConditionalBridge.tags = ['ConditionalBridge'];
deployConditionalBridge.dependencies = ['MyOFT'];
deployConditionalBridge.id = 'deploy_conditional_bridge';

