// Get the environment configuration from .env file
//
// To make use of automatic environment setup:
// - Duplicate .env.example file and name it .env
// - Fill in the environment variables
import 'dotenv/config'

import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import '@nomiclabs/hardhat-ethers'
import '@layerzerolabs/toolbox-hardhat'
import { HardhatUserConfig, HttpNetworkAccountsUserConfig } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

import './tasks/index'

// Set your preferred authentication method
//
// If you prefer using a mnemonic, set a MNEMONIC environment variable
// to a valid mnemonic
const MNEMONIC = process.env.MNEMONIC

// If you prefer to be authenticated using a private key, set a PRIVATE_KEY environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY
const PRIVATE_KEY_HEDERA = process.env.PRIVATE_KEY_HEDERA

const getAccounts = (network: string): HttpNetworkAccountsUserConfig | undefined => {
    if (network === 'hedera-testnet') {
        return PRIVATE_KEY_HEDERA ? [PRIVATE_KEY_HEDERA] : undefined
    }
    return PRIVATE_KEY ? [PRIVATE_KEY] : undefined
}

const config: HardhatUserConfig = {
    paths: {
        cache: 'cache/hardhat',
    },
    solidity: {
        compilers: [
            {
                version: '0.8.22',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        // the network you are deploying to or are already on
        // Hedera Testnet (EID=40285)
        'hedera-testnet': {
          eid: EndpointId.HEDERA_V2_TESTNET,
          url: process.env.RPC_URL_HEDERA || 'https://testnet.hashio.io/api',
          accounts: getAccounts('hedera-testnet'),
        },
        // another network you want to connect to
        'base-sepolia': {
          eid: EndpointId.BASESEP_V2_TESTNET,
          url: process.env.RPC_URL_BASE_SEPOLIA || 'https://sepolia.base.org',
          accounts: getAccounts('base-sepolia'),
          timeout: 120000,
        },
      },
    namedAccounts: {
        deployer: {
            default: 0, // wallet address of index[0], of the mnemonic in .env
        },
    },
}

export default config
