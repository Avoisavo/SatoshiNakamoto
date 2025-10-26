import { NexusSDK } from "@avail-project/nexus-core";

let nexusClientInstance: NexusSDK | null = null;
let initializationInProgress = false;

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
}

// Supported chains configuration (Testnet)
// Based on Nexus SDK supported chains
export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  sepolia: {
    chainId: 11155111, // Ethereum Sepolia testnet (SOURCE ONLY - not a bridge destination)
    name: "Ethereum Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
  },
  base: {
    chainId: 84532, // Base Sepolia testnet
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
  },
  polygon: {
    chainId: 80002, // Polygon Amoy testnet
    name: "Polygon Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
  },
  arbitrum: {
    chainId: 421614, // Arbitrum Sepolia testnet
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  },
  optimism: {
    chainId: 11155420, // Optimism Sepolia testnet
    name: "Optimism Sepolia",
    rpcUrl: "https://sepolia.optimism.io",
  },
  monad: {
    chainId: 10143, // Monad testnet
    name: "Monad Testnet",
    rpcUrl: "https://testnet.monad.xyz",
  },
};

/**
 * Initialize Nexus SDK with wallet provider
 * @param provider - Injected wallet provider (MetaMask, WalletConnect, etc.)
 */
export async function initializeNexusClient(provider: EthereumProvider): Promise<NexusSDK> {
  if (!provider) {
    throw new Error("Wallet provider is required to initialize Nexus SDK");
  }

  // If already initialized, return existing instance
  if (nexusClientInstance && isNexusClientInitialized()) {
    console.log("✅ Nexus SDK already initialized");

    // Log current chain to help debug
    try {
      const chainId = await provider.request({ method: "eth_chainId" }) as string;
      console.log("ℹ️ Current wallet chain ID:", parseInt(chainId, 16));
    } catch (e) {
      console.warn("Could not detect current chain");
    }

    return nexusClientInstance;
  }

  // If initialization is in progress, wait and return
  if (initializationInProgress) {
    console.log("⏳ Waiting for ongoing initialization...");
    // Wait for initialization to complete (max 10 seconds)
    for (let i = 0; i < 100; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (nexusClientInstance && isNexusClientInitialized()) {
        return nexusClientInstance;
      }
    }
    throw new Error("Initialization timed out");
  }

  try {
    initializationInProgress = true;
    console.log("🔧 Initializing Nexus SDK...");
    console.log(
      "📝 Note: MetaMask will prompt for signature to create Chain Abstraction account (one-time setup)"
    );

    // Check if wallet is already connected (don't request connection)
    const accounts = await provider.request({ method: "eth_accounts" }) as string[];
    if (accounts.length === 0) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    // Get current chain ID
    const chainId = await provider.request({ method: "eth_chainId" }) as string;
    const currentChainId = parseInt(chainId, 16);
    console.log("✅ Using connected wallet:", accounts[0]);
    console.log("ℹ️ Current chain ID:", currentChainId);

    // Create Nexus SDK instance
    // NOTE: SDK will handle network switching automatically when bridging
    // DO NOT manually switch networks here - it causes conflicts
    const client = new NexusSDK({
      network: "testnet", // Use testnet for safe testing
      debug: true,
    });

    // Initialize with the wallet provider
    // This will prompt MetaMask for signature to create CA account
    console.log("🔗 Initializing Nexus SDK with wallet provider...");
    console.log(
      "⚠️ IMPORTANT: Approve the MetaMask signature request to create your Chain Abstraction account"
    );
    await client.initialize(provider);

    // Set up hooks for allowances and intents (required by SDK)
    client.setOnAllowanceHook(async (data: Record<string, unknown> & { allow?: (values: string[]) => void; sources?: unknown[] }) => {
      console.log("📋 Allowance required:", data);
      // Auto-approve with max allowance for better UX
      if (data.allow && data.sources) {
        console.log("✅ Auto-approving allowances with max values...");
        data.allow(data.sources.map(() => "max"));
      }
    });

    client.setOnIntentHook((data: Record<string, unknown> & { allow?: () => void }) => {
      console.log("📋 Intent data:", data);
      // Auto-approve intent for better UX
      if (data.allow) {
        console.log("✅ Auto-approving intent...");
        data.allow();
      }
    });

    nexusClientInstance = client;

    console.log("✅ Nexus SDK initialized successfully");
    console.log(
      "ℹ️ SDK will auto-handle network switching during transactions"
    );
    console.log(
      "ℹ️ Allowances and intents will auto-approve for smoother experience"
    );
    return client;
  } catch (error) {
    console.error("❌ Failed to initialize Nexus SDK:", error);
    console.error(
      "💡 If you rejected the signature, please try again and approve it"
    );
    nexusClientInstance = null;
    throw error;
  } finally {
    initializationInProgress = false;
  }
}

/**
 * Get the initialized Nexus SDK instance
 */
export function getNexusClient(): NexusSDK {
  if (!nexusClientInstance) {
    throw new Error(
      "Nexus SDK not initialized. Call initializeNexusClient first."
    );
  }
  return nexusClientInstance;
}

/**
 * Check if Nexus SDK is initialized
 */
export function isNexusClientInitialized(): boolean {
  if (!nexusClientInstance) {
    return false;
  }

  // Check if the SDK has the isInitialized method
  if (typeof nexusClientInstance.isInitialized === "function") {
    return nexusClientInstance.isInitialized();
  }

  // Fallback: if instance exists, consider it initialized
  return true;
}

/**
 * Reset Nexus SDK instance
 */
export async function resetNexusClient(): Promise<void> {
  if (nexusClientInstance) {
    await nexusClientInstance.deinit();
  }
  nexusClientInstance = null;
}

/**
 * Get chain configuration by name
 */
export function getChainConfig(chainName: string): ChainConfig {
  const config = SUPPORTED_CHAINS[chainName.toLowerCase()];
  if (!config) {
    throw new Error(`Unsupported chain: ${chainName}`);
  }
  return config;
}

/**
 * Get all supported chain names
 */
export function getSupportedChainNames(): string[] {
  return Object.keys(SUPPORTED_CHAINS);
}
