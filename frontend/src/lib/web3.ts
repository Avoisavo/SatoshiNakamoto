// Web3 integration utilities for contract interaction using Viem
import { createPublicClient, createWalletClient, custom, http, formatUnits, parseUnits, type Address, type Abi } from 'viem';
import { baseSepolia } from 'viem/chains';
import { ContractABI } from './blockscout';

// Base Sepolia Preconf (Flashblocks) chain config
export const baseSepoliaPreconf = {
  ...baseSepolia,
  name: 'Base Sepolia (Flashblocks)',
  rpcUrls: {
    default: { http: ['https://sepolia-preconf.base.org'] },
    public: { http: ['https://sepolia-preconf.base.org'] },
  },
} as const;

// Custom chain config for Hedera Testnet
export const hederaTestnet = {
  id: 296,
  name: 'Hedera Testnet',
  network: 'hedera-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: { http: ['https://testnet.hashio.io/api'] },
    public: { http: ['https://testnet.hashio.io/api'] },
  },
  blockExplorers: {
    default: { name: 'Hashscan', url: 'https://hashscan.io/testnet' },
  },
  testnet: true,
} as const;

declare global {
  interface Window {
    ethereum?: Record<string, unknown> & { request: (args: { method: string; params?: unknown[] }) => Promise<string[]> };
  }
}

/**
 * Get the connected wallet provider
 */
export async function getWeb3Provider(network: 'base' | 'hedera' = 'base') {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  try {
    const chain = network === 'base' ? baseSepoliaPreconf : hederaTestnet;
    const client = createPublicClient({
      chain,
      transport: custom(window.ethereum),
    });
    return client;
  } catch (error) {
    console.error('Error getting web3 provider:', error);
    return null;
  }
}

export async function connectWallet(): Promise<{ address: string } | null> {
  try {
    if (!window.ethereum) {
      throw new Error('No Web3 provider found. Please install MetaMask.');
    }

    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    return {
      address: accounts[0],
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}

/**
 * Get the current connected wallet address
 */
export async function getCurrentAddress(): Promise<string | null> {
  try {
    if (!window.ethereum) return null;
    
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current address:', error);
    return null;
  }
}

/**
 * Switch network
 */
export async function switchNetwork(chainId: string): Promise<boolean> {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
    return true;
  } catch (error) {
    // If the network hasn't been added to MetaMask
    if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
      console.error('Network not added to wallet');
    }
    console.error('Error switching network:', error);
    return false;
  }
}

/**
 * Call a read-only contract function
 * @param usePending - Use 'pending' block tag for near-instant Flashblocks responses (~200ms)
 */
export async function callContractReadFunction(
  contractAddress: string,
  abi: ContractABI[],
  functionName: string,
  args: unknown[] = [],
  network: 'base' | 'hedera' = 'base',
  usePending: boolean = false
): Promise<unknown> {
  try {
    const chain = network === 'base' ? baseSepoliaPreconf : hederaTestnet;
    const client = createPublicClient({
      chain,
      transport: window.ethereum ? custom(window.ethereum) : http(),
    });

    const result = await client.readContract({
      address: contractAddress as Address,
      abi: abi as Abi,
      functionName,
      args,
      blockTag: usePending ? 'pending' : 'latest',
    });
    
    return result;
  } catch (error) {
    console.error('Error calling read function:', error);
    throw error;
  }
}

/**
 * Call a write contract function (requires transaction)
 * Note: Flashblocks automatically provides ~200ms confirmation times on Base Sepolia
 */
export async function callContractWriteFunction(
  contractAddress: string,
  abi: ContractABI[],
  functionName: string,
  args: unknown[] = [],
  value?: string, // in wei
  network: 'base' | 'hedera' = 'base'
): Promise<{ hash: string }> {
  try {
    if (!window.ethereum) {
      throw new Error('Please connect your wallet first');
    }

    const chain = network === 'base' ? baseSepoliaPreconf : hederaTestnet;
    const walletClient = createWalletClient({
      chain,
      transport: custom(window.ethereum),
    });

    const [address] = await walletClient.getAddresses();
    
    const txOptions: Record<string, unknown> = {
      address: contractAddress as Address,
      abi: abi as Abi,
      functionName,
      args,
      account: address,
    };

    if (value && value !== '0') {
      txOptions.value = BigInt(value);
    }

    const hash = await walletClient.writeContract(txOptions);
    
    return { hash };
  } catch (error) {
    console.error('Error calling write function:', error);
    throw error;
  }
}

/**
 * Parse function arguments based on their types
 */
export function parseArguments(inputs: Array<{ type: string; value: string }>): unknown[] {
  return inputs.map(({ type, value }) => {
    if (!value || value.trim() === '') {
      return undefined;
    }

    // Handle arrays
    if (type.includes('[')) {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map(v => v.trim());
      }
    }

    // Handle numeric types
    if (type.includes('uint') || type.includes('int')) {
      // Check if it's a decimal for conversion to wei
      if (value.includes('.')) {
        return parseUnits(value, 18); // Assumes 18 decimals
      }
      return BigInt(value);
    }

    // Handle boolean
    if (type === 'bool') {
      return value.toLowerCase() === 'true' || value === '1';
    }

    // Handle bytes
    if (type.includes('bytes')) {
      if (!value.startsWith('0x')) {
        return ('0x' + value) as `0x${string}`;
      }
      return value as `0x${string}`;
    }

    // Handle address
    if (type === 'address') {
      return value as Address;
    }

    // Default: return as string
    return value;
  });
}

/**
 * Format contract return value for display
 */
export function formatReturnValue(value: unknown, type?: string): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  // Handle BigInt
  if (typeof value === 'bigint') {
    // Try to format as ether if it looks like a large number
    if (value > BigInt(1e15)) {
      try {
        return `${formatUnits(value, 18)} (${value.toString()} wei)`;
      } catch {
        return value.toString();
      }
    }
    return value.toString();
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return JSON.stringify(value, (key, val) => 
      typeof val === 'bigint' ? val.toString() : val
    , 2);
  }

  // Handle objects
  if (typeof value === 'object') {
    return JSON.stringify(value, (key, val) => 
      typeof val === 'bigint' ? val.toString() : val
    , 2);
  }

  // Handle boolean
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  return value.toString();
}

/**
 * Get network information
 */
export async function getNetwork(): Promise<{ chainId: number; name: string } | null> {
  try {
    if (!window.ethereum) return null;

    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const chainIdNum = parseInt(chainId, 16);
    
    let name = 'Unknown';
    if (chainIdNum === baseSepoliaPreconf.id) {
      name = 'Base Sepolia (Flashblocks)';
    } else if (chainIdNum === hederaTestnet.id) {
      name = 'Hedera Testnet';
    }

    return { chainId: chainIdNum, name };
  } catch (error) {
    console.error('Error getting network:', error);
    return null;
  }
}

// Network configurations
export const NETWORKS = {
  'base-sepolia': {
    chainId: '0x14a34', // 84532 in decimal
    chainName: 'Base Sepolia (Flashblocks)',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://sepolia-preconf.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org']
  },
  'hedera-testnet': {
    chainId: '0x128', // 296 in decimal
    chainName: 'Hedera Testnet',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18
    },
    rpcUrls: ['https://testnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/testnet']
  }
};

/**
 * Flashblocks Utility Functions
 * Use these for near-instant responses (~200ms) on Base Sepolia
 */

/**
 * Get pending block information (Flashblocks preconfirmation)
 */
export async function getPendingBlock(network: 'base' | 'hedera' = 'base') {
  const chain = network === 'base' ? baseSepoliaPreconf : hederaTestnet;
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  return await client.getBlock({ blockTag: 'pending' });
}

/**
 * Get balance using pending block tag for instant updates
 */
export async function getPendingBalance(address: Address, network: 'base' | 'hedera' = 'base') {
  const chain = network === 'base' ? baseSepoliaPreconf : hederaTestnet;
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  return await client.getBalance({ 
    address, 
    blockTag: 'pending' 
  });
}

/**
 * Get transaction count using pending block tag
 */
export async function getPendingTransactionCount(address: Address, network: 'base' | 'hedera' = 'base') {
  const chain = network === 'base' ? baseSepoliaPreconf : hederaTestnet;
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  return await client.getTransactionCount({ 
    address, 
    blockTag: 'pending' 
  });
}
