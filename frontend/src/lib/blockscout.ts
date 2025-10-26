// Blockscout API utility functions

export interface ContractABI {
  inputs: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  name: string;
  outputs?: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  type: 'function' | 'constructor' | 'event' | 'fallback' | 'receive';
}

export interface ContractInfo {
  address: string;
  name: string;
  compiler_version: string;
  optimization_enabled: boolean;
  abi: ContractABI[];
  balance?: string;
  verified: boolean;
  source_code?: string;
}

// Blockscout API endpoints
const BLOCKSCOUT_APIS = {
  'base': 'https://base-sepolia.blockscout.com/api',
  'hedera': 'https://hashscan.io/testnet/api',
};

/**
 * Fetch contract ABI and details from Blockscout
 */
export async function fetchContractFromBlockscout(
  address: string,
  network: 'base' | 'hedera' = 'base'
): Promise<ContractInfo> {
  try {
    const baseUrl = BLOCKSCOUT_APIS[network];
    
    // For Hedera, we might need to convert address format
    let queryAddress = address;
    if (network === 'hedera' && address.startsWith('0.0.')) {
      // Convert Hedera format to EVM format if needed
      // This is a simplified conversion - you may need more complex logic
      queryAddress = address;
    }

    // Fetch contract details
    const response = await fetch(
      `${baseUrl}?module=contract&action=getsourcecode&address=${queryAddress}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch contract: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== '1' || !data.result || data.result.length === 0) {
      throw new Error('Contract not found or not verified on Blockscout');
    }

    const contractData = data.result[0];

    // Parse ABI
    let abi: ContractABI[] = [];
    try {
      abi = JSON.parse(contractData.ABI || '[]');
    } catch (error) {
      console.error('Failed to parse ABI:', error);
      throw new Error('Invalid contract ABI');
    }

    // Fetch balance
    let balance = '0';
    try {
      const balanceResponse = await fetch(
        `${baseUrl}?module=account&action=balance&address=${queryAddress}`
      );
      const balanceData = await balanceResponse.json();
      if (balanceData.status === '1') {
        // Convert from wei to ETH
        balance = (parseInt(balanceData.result) / 1e18).toFixed(4);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }

    return {
      address: queryAddress,
      name: contractData.ContractName || 'Unknown Contract',
      compiler_version: contractData.CompilerVersion || '',
      optimization_enabled: contractData.OptimizationUsed === '1',
      abi,
      balance,
      verified: true,
      source_code: contractData.SourceCode || '',
    };
  } catch (error) {
    console.error('Error fetching contract from Blockscout:', error);
    throw error;
  }
}

/**
 * Filter ABI to get only read functions (view/pure)
 */
export function getReadFunctions(abi: ContractABI[]): ContractABI[] {
  return abi.filter(
    item => 
      item.type === 'function' && 
      (item.stateMutability === 'view' || item.stateMutability === 'pure')
  );
}

/**
 * Filter ABI to get only write functions (nonpayable/payable)
 */
export function getWriteFunctions(abi: ContractABI[]): ContractABI[] {
  return abi.filter(
    item => 
      item.type === 'function' && 
      (item.stateMutability === 'nonpayable' || item.stateMutability === 'payable')
  );
}

/**
 * Get function signature for display
 */
export function getFunctionSignature(func: ContractABI): string {
  const inputs = func.inputs.map(input => `${input.type} ${input.name}`).join(', ');
  const outputs = func.outputs?.map(output => output.type).join(', ') || '';
  return `${func.name}(${inputs})${outputs ? ` returns (${outputs})` : ''}`;
}

/**
 * Format Solidity type for input placeholder
 */
export function getInputPlaceholder(type: string): string {
  if (type === 'address') return '0x...';
  if (type.includes('uint')) return '0';
  if (type.includes('int')) return '0';
  if (type === 'bool') return 'true/false';
  if (type === 'string') return 'string value';
  if (type.includes('bytes')) return '0x...';
  return type;
}

