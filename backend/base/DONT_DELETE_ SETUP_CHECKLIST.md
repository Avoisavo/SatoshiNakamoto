# Setup Checklist for Base Sepolia <-> Hedera Bridge

## ✅ Pre-Deployment Checklist

- [x] Run `npm install` to install dependencies
- [ ] Create `.env` file with PRIVATE_KEY and RPC URLs
- [x] Update `hardhat.config.ts` - change 'sepolia' to 'base-sepolia'
- [x] Update `layerzero.config.ts` - change EndpointId.SEPOLIA_V2_TESTNET to EndpointId.BASESEP_V2_TESTNET
- [x] Run `npx hardhat compile` to ensure contracts compile

## 🚀 Deployment Checklist

- [ ] Deploy to Base Sepolia: `npx hardhat lz:deploy --network base-sepolia`
- [ ] Deploy to Hedera Testnet: `npx hardhat lz:deploy --network hedera-testnet`
- [ ] Wire contracts: `npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts`
- [ ] Verify configuration: `npx hardhat lz:oapp:config:get --network base-sepolia`
- [ ] Verify configuration: `npx hardhat lz:oapp:config:get --network hedera-testnet`

## 🧪 Testing Checklist

- [ ] Mint test tokens: `npx hardhat run scripts/1-mint-tokens.js --network base-sepolia`
- [ ] Check initial balances: `npx hardhat run scripts/check-balances.js --network base-sepolia`
- [ ] Send 0.0005 tokens Base Sepolia -> Hedera (see `scripts/BRIDGE_TESTING.md` for command)
- [ ] Verify tokens received on Hedera: `npx hardhat run scripts/check-balances.js --network hedera-testnet`
- [ ] Send 0.0005 tokens Hedera -> Base Sepolia (see `scripts/BRIDGE_TESTING.md` for command)
- [ ] Verify tokens received on Base Sepolia: `npx hardhat run scripts/check-balances.js --network base-sepolia`

📖 See `scripts/BRIDGE_TESTING.md` for detailed instructions
🚀 Run `./TESTING_COMMANDS.sh` to see all commands

## 📝 Important Addresses

Base Sepolia Contract: 0x612F53C77972F2ACaD4Bfc2D9b64cD255326aE3a
Hedera Testnet Contract: 0x1498FECa6fb7525616C369592440B6E8325C3D6D
Escrow contract: 0xd563d7c42f86a4d59BC5dE365BFca66EC23A8C7B

## 🔗 Useful Links

- LayerZero Scan: https://testnet.layerzeroscan.com/
- Base Sepolia Explorer: https://sepolia.basescan.org/
- Hedera Testnet Explorer: https://hashscan.io/testnet
- Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- Hedera Faucet: https://portal.hedera.com/
