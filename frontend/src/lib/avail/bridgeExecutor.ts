import {
  getNexusClient,
  getChainConfig,
  SUPPORTED_CHAINS,
} from "./nexusClient";

// Common Contract ABIs
const WETH_ABI = [
  {
    constant: false,
    inputs: [],
    name: "deposit",
    outputs: [],
    payable: true,
    stateMutability: "payable",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "wad", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

// ERC20/USDC ABI (for approvals and transfers)
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// AAVE V3 Pool ABI (supply function for lending)
const AAVE_POOL_ABI = [
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address", name: "onBehalfOf", type: "address" },
      { internalType: "uint16", name: "referralCode", type: "uint16" },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Contract address to ABI mapping
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CONTRACT_ABI_MAP: Record<string, any[]> = {
  // WETH on Base Sepolia
  "0x4200000000000000000000000000000000000006": WETH_ABI,

  // USDC on Base Sepolia (ERC20)
  "0x036cbd53842c5426634e7929541ec2318f3dcf7e": ERC20_ABI,

  // AAVE V3 Pool on Base Mainnet (use for reference, might not be on testnet)
  "0xa238dd80c259a72e81d7e4664a9801593f98d1c5": AAVE_POOL_ABI,
};

/**
 * Get ABI for a known contract address, or return empty array
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getContractABI(contractAddress: string): any[] {
  const normalizedAddress = contractAddress.toLowerCase();
  return CONTRACT_ABI_MAP[normalizedAddress] || [];
}

export interface BridgeParams {
  sourceChain: string;
  targetChain: string;
  token: string;
  amount: string;
  // Note: Nexus bridge automatically sends to the connected wallet address
  // on the destination chain. Custom recipient addresses are not supported
  // for simple bridge operations (only for bridgeAndExecute).
}

export interface BridgeAndExecuteParams extends BridgeParams {
  recipientAddress?: string; // For bridgeAndExecute, custom recipient is supported
  executeContract: string;
  executeFunction: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeFunctionParams?: any[];
  executeValue?: string;
}

export interface BridgeResult {
  success: boolean;
  txHash?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

// Type for Ethereum provider
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

/**
 * Get current chain ID from MetaMask
 */
async function getCurrentChainId(): Promise<number> {
  if (
    typeof window === "undefined" ||
    !(window as unknown as { ethereum?: EthereumProvider }).ethereum
  ) {
    throw new Error("MetaMask not available");
  }

  const ethereum = (window as unknown as { ethereum: EthereumProvider })
    .ethereum;
  const chainIdHex = (await ethereum.request({
    method: "eth_chainId",
  })) as string;
  return parseInt(chainIdHex, 16);
}

/**
 * Execute a simple bridge operation
 */
export async function executeBridge(
  params: BridgeParams
): Promise<BridgeResult> {
  try {
    const nexusClient = getNexusClient();
    const targetChainConfig = getChainConfig(params.targetChain);

    // Validate amount
    const amountNum = parseFloat(params.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error(
        `Invalid amount: ${params.amount}. Please enter a valid positive number.`
      );
    }

    // Validate token
    const validTokens = ["ETH", "USDC", "USDT"];
    if (!validTokens.includes(params.token)) {
      throw new Error(
        `Invalid token: ${params.token}. Supported tokens: ${validTokens.join(
          ", "
        )}`
      );
    }

    // The SDK will use whatever chain you're currently on as the source
    const currentChainId = await getCurrentChainId();
    const sourceChainName =
      Object.entries(SUPPORTED_CHAINS).find(
        ([, config]) => config.chainId === currentChainId
      )?.[1]?.name || `Chain ${currentChainId}`;

    console.log("🌉 Initiating bridge transaction:");
    console.log(
      "  • From:",
      sourceChainName,
      `(Chain ID: ${currentChainId}) - Auto-detected from your wallet`
    );
    console.log(
      "  • To:",
      targetChainConfig.name,
      `(Chain ID: ${targetChainConfig.chainId})`
    );
    console.log("  • Token:", params.token);
    console.log("  • Amount:", params.amount);
    console.log(
      "  • Recipient: Your connected wallet (same address on destination chain)"
    );

    // Validate: Cannot bridge to the same chain
    if (currentChainId === targetChainConfig.chainId) {
      throw new Error(
        `Cannot bridge to the same chain. You are currently on ${sourceChainName}. Please select a different destination chain.`
      );
    }

    // Check if Nexus SDK has the bridge method
    if (typeof nexusClient.bridge !== "function") {
      throw new Error(
        "Nexus SDK bridge method not available. Please check the SDK integration."
      );
    }

    console.log("📝 Preparing bridge transaction...");
    console.log("✅ Source network detected:", sourceChainName);
    console.log(
      "ℹ️ The SDK will automatically handle any routing needed for the bridge"
    );
    console.log(
      "⚠️ Note: You may be prompted to approve network switches for optimal routing"
    );
    console.log("⚠️ Cross-chain bridges take 5-15 minutes to complete");
    console.log("ℹ️ Check your MetaMask for pending approval requests");

    // Store the original chain ID to detect if SDK switches networks
    const originalChainId = currentChainId;

    // Use Nexus SDK to execute the bridge
    // IMPORTANT: SDK auto-detects source chain from connected wallet
    // NOTE: The SDK may automatically switch networks if the current network
    // is not an optimal source for the selected destination
    const bridgeResult = await nexusClient.bridge({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chainId: targetChainConfig.chainId as any, // Destination chain ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      token: params.token as any, // ETH, USDC, or USDT
      amount: params.amount,
    });

    // Check if network was switched during bridge
    const finalChainId = await getCurrentChainId();
    if (finalChainId !== originalChainId) {
      const finalChainName =
        Object.entries(SUPPORTED_CHAINS).find(
          ([, config]) => config.chainId === finalChainId
        )?.[1]?.name || `Chain ${finalChainId}`;
      console.log(
        `ℹ️ Network switched for routing: ${sourceChainName} → ${finalChainName}`
      );
      console.log(
        `ℹ️ This is expected - the SDK automatically routes through the optimal path`
      );
      console.log(
        `ℹ️ Your tokens will still arrive at ${targetChainConfig.name} as intended`
      );
    }

    console.log("✅ Bridge transaction result:", bridgeResult);

    // Check if bridge operation failed
    if (!bridgeResult.success) {
      throw new Error(
        `Bridge operation failed: ${bridgeResult.error || "Unknown error"}`
      );
    }

    // CRITICAL: Check if the explorer URL indicates a 404 or failed intent
    if (bridgeResult.explorerUrl && bridgeResult.explorerUrl.includes("/404")) {
      console.error(
        "❌ Intent creation failed - explorer URL shows 404:",
        bridgeResult.explorerUrl
      );
      throw new Error(
        "Bridge transaction was not created. The intent failed to be registered. This may indicate: " +
          "1) Insufficient funds for gas, " +
          "2) Network connectivity issues, " +
          "3) Nexus SDK testnet is down, or " +
          "4) The bridge path is not supported"
      );
    }

    // Extract transaction hash
    const txHash =
      bridgeResult.transactionHash ||
      bridgeResult.explorerUrl?.split("/intent/")[1];

    // Validate we have some proof of transaction
    if (!txHash && !bridgeResult.explorerUrl) {
      throw new Error(
        "No transaction proof returned. The bridge may not have actually executed."
      );
    }

    return {
      success: true,
      txHash: txHash,
      message: `Bridge initiated: ${params.amount} ${
        params.token
      } from your connected chain to ${targetChainConfig.name}. ${
        bridgeResult.explorerUrl ? `Track: ${bridgeResult.explorerUrl}` : ""
      }`,
    };
  } catch (error) {
    console.error("❌ Bridge execution failed:");
    console.error("  Error type:", error?.constructor?.name);
    console.error(
      "  Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error("  Full error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Bridge operation failed. Check console for details.",
    };
  }
}

/**
 * Execute "Bridge & Execute" operation
 * This bridges tokens and executes a contract call on the destination chain
 */
export async function executeBridgeAndExecute(
  params: BridgeAndExecuteParams
): Promise<BridgeResult> {
  try {
    const nexusClient = getNexusClient();
    const targetChainConfig = getChainConfig(params.targetChain);

    // Validate amount
    const amountNum = parseFloat(params.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error(
        `Invalid amount: ${params.amount}. Please enter a valid positive number.`
      );
    }

    // The SDK will use whatever chain you're currently on as the source
    const currentChainId = await getCurrentChainId();
    const sourceChainName =
      Object.entries(SUPPORTED_CHAINS).find(
        ([, config]) => config.chainId === currentChainId
      )?.[1]?.name || `Chain ${currentChainId}`;

    console.log("🚀 Initiating Bridge & Execute transaction:");
    console.log(
      "  • From:",
      sourceChainName,
      `(Chain ID: ${currentChainId}) - Auto-detected from your wallet`
    );
    console.log(
      "  • To:",
      targetChainConfig.name,
      `(Chain ID: ${targetChainConfig.chainId})`
    );
    console.log("  • Token:", params.token);
    console.log("  • Amount:", params.amount);
    console.log("  • Contract:", params.executeContract);
    console.log("  • Function:", params.executeFunction);

    // Validate: Cannot bridge to the same chain
    if (currentChainId === targetChainConfig.chainId) {
      throw new Error(
        `Cannot bridge to the same chain. You are currently on ${sourceChainName}. Please select a different destination chain.`
      );
    }

    // Check if Nexus SDK has the bridgeAndExecute method
    if (typeof nexusClient.bridgeAndExecute !== "function") {
      throw new Error(
        "Nexus SDK bridgeAndExecute method not available. Please check the SDK integration."
      );
    }

    // Parse function parameters if provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsedParams: any[];
    try {
      parsedParams = params.executeFunctionParams || [];
    } catch {
      throw new Error("Invalid function parameters");
    }

    console.log(
      "📝 Preparing bridge & execute transaction (MetaMask will prompt for signature)..."
    );
    console.log("✅ Source network detected:", sourceChainName);
    console.log(
      "ℹ️ The SDK will automatically handle any routing needed for the bridge"
    );
    console.log(
      "⚠️ Note: You may be prompted to approve network switches for optimal routing"
    );

    // Store the original chain ID to detect if SDK switches networks
    const originalChainId = currentChainId;

    // Get contract ABI for known contracts
    const contractAbi = getContractABI(params.executeContract);

    if (contractAbi.length === 0) {
      console.warn(
        `⚠️ No ABI found for contract ${params.executeContract}. This will likely fail.`
      );
      console.warn(
        `⚠️ Currently supported contracts: ${Object.keys(CONTRACT_ABI_MAP).join(
          ", "
        )}`
      );
      throw new Error(
        `No ABI found for contract ${params.executeContract}. ` +
          `Supported contracts: ${Object.keys(CONTRACT_ABI_MAP).join(", ")}`
      );
    }

    console.log(`✅ Using ABI for contract: ${params.executeContract}`);

    // Use Nexus SDK bridgeAndExecute
    const result = await nexusClient.bridgeAndExecute({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toChainId: targetChainConfig.chainId as any, // Destination chain
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      token: params.token as any, // ETH, USDC, or USDT
      amount: params.amount,
      recipient: params.recipientAddress as `0x${string}`,
      execute: {
        contractAddress: params.executeContract,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        contractAbi: contractAbi as any,
        functionName: params.executeFunction,
        buildFunctionParams: () => ({
          functionParams: parsedParams,
          value: params.executeValue || "0",
        }),
        // IMPORTANT: Tell SDK to approve token spending on destination chain
        // This is required for ERC20 tokens (USDC, USDT) but not ETH
        tokenApproval:
          params.token !== "ETH"
            ? {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token: params.token as any,
                amount: params.amount,
              }
            : undefined,
      },
    });

    // Check if network was switched during bridge & execute
    const finalChainId = await getCurrentChainId();
    if (finalChainId !== originalChainId) {
      const finalChainName =
        Object.entries(SUPPORTED_CHAINS).find(
          ([, config]) => config.chainId === finalChainId
        )?.[1]?.name || `Chain ${finalChainId}`;
      console.log(
        `ℹ️ Network switched for routing: ${sourceChainName} → ${finalChainName}`
      );
      console.log(
        `ℹ️ This is expected - the SDK automatically routes through the optimal path`
      );
      console.log(
        `ℹ️ Your tokens and execution will complete on ${targetChainConfig.name} as intended`
      );
    }

    console.log("✅ Bridge & Execute result:", result);

    // Check if operation failed
    if (!result.success) {
      throw new Error(
        `Bridge & Execute failed: ${result.error || "Unknown error"}`
      );
    }

    // Extract transaction hashes
    const txHash =
      result.executeTransactionHash ||
      result.bridgeTransactionHash ||
      result.bridgeExplorerUrl?.split("/tx/")[1];

    return {
      success: true,
      txHash: txHash,
      message: `Successfully bridged ${params.amount} ${
        params.token
      } and executed ${params.executeFunction} on ${targetChainConfig.name}. ${
        result.executeExplorerUrl
          ? `Explorer: ${result.executeExplorerUrl}`
          : ""
      }`,
    };
  } catch (error) {
    console.error("❌ Bridge & Execute failed:");
    console.error("  Error type:", error?.constructor?.name);
    console.error(
      "  Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error("  Full error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Bridge & Execute operation failed. Check console for details.",
    };
  }
}

/**
 * Get estimated bridge time
 * Note: This functionality may not be available in current SDK version
 */
export async function estimateBridgeTime(
  sourceChain: string,
  targetChain: string
): Promise<number> {
  console.log(
    `Estimating bridge time from ${sourceChain} to ${targetChain}...`
  );

  // Note: estimateBridgeTime may not be available in SDK v0.0.1
  // Return a default estimate
  return 300; // Default 5 minutes
}
