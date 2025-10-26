import { getNexusClient } from "./nexusClient";

export interface IntentStep {
  type: "bridge" | "swap" | "execute" | "transfer";
  chainId?: number;
  data: Record<string, unknown>;
}

export interface CrosschainIntent {
  id: string;
  steps: IntentStep[];
  metadata?: {
    name?: string;
    description?: string;
  };
}

/**
 * Build a complex crosschain intent with multiple steps
 */
export function buildCrosschainIntent(steps: IntentStep[]): CrosschainIntent {
  return {
    id: generateIntentId(),
    steps,
    metadata: {
      name: "Crosschain Workflow",
      description: `Multi-step crosschain operation with ${steps.length} steps`,
    },
  };
}

/**
 * Execute a crosschain intent
 */
export async function executeIntent(intent: CrosschainIntent): Promise<{
  success: boolean;
  results: Record<string, unknown>[];
  error?: string;
}> {
  try {
    const nexusClient = getNexusClient();

    console.log("🎯 Executing crosschain intent:", intent.id);
    console.log(`📋 Steps: ${intent.steps.length}`);

    const results = [];

    // Execute each step in sequence
    for (let i = 0; i < intent.steps.length; i++) {
      const step = intent.steps[i];
      console.log(
        `⚡ Executing step ${i + 1}/${intent.steps.length}: ${step.type}`
      );

      const stepResult = await executeIntentStep(nexusClient, step);
      results.push(stepResult);

      if (!stepResult.success) {
        throw new Error(`Step ${i + 1} failed: ${stepResult.error}`);
      }
    }

    console.log("✅ Intent execution completed successfully");

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error("❌ Intent execution failed:", error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute a single intent step
 */
async function executeIntentStep(
  nexusClient: Record<string, unknown>,
  step: IntentStep
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    switch (step.type) {
      case "bridge":
        return await executeBridgeStep(nexusClient, step.data);
      case "swap":
        return await executeSwapStep(nexusClient, step.data);
      case "execute":
        return await executeContractStep(nexusClient, step.data);
      case "transfer":
        return await executeTransferStep(nexusClient, step.data);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute bridge step
 */
async function executeBridgeStep(
  nexusClient: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const result = await nexusClient.bridge(data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bridge step failed",
    };
  }
}

/**
 * Execute swap step
 */
async function executeSwapStep(
  nexusClient: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const result = await nexusClient.swap(data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Swap step failed",
    };
  }
}

/**
 * Execute contract call step
 */
async function executeContractStep(
  nexusClient: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const result = await nexusClient.executeContract(data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Contract execution failed",
    };
  }
}

/**
 * Execute transfer step
 */
async function executeTransferStep(
  nexusClient: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const result = await nexusClient.transfer(data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transfer failed",
    };
  }
}

/**
 * Generate unique intent ID
 */
function generateIntentId(): string {
  return `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create Bridge & Execute intent
 * Example: Bridge USDC from Ethereum to Polygon and stake in Aave
 */
export function createBridgeAndStakeIntent(params: {
  sourceChain: number;
  targetChain: number;
  token: string;
  amount: string;
  stakingContract: string;
}): CrosschainIntent {
  return buildCrosschainIntent([
    {
      type: "bridge",
      data: {
        sourceChainId: params.sourceChain,
        targetChainId: params.targetChain,
        token: params.token,
        amount: params.amount,
      },
    },
    {
      type: "execute",
      chainId: params.targetChain,
      data: {
        target: params.stakingContract,
        functionName: "deposit",
        params: [params.amount],
      },
    },
  ]);
}

/**
 * Create Bridge, Swap, and Execute intent
 */
export function createBridgeSwapExecuteIntent(params: {
  sourceChain: number;
  targetChain: number;
  bridgeToken: string;
  bridgeAmount: string;
  swapToToken: string;
  executeContract: string;
}): CrosschainIntent {
  return buildCrosschainIntent([
    {
      type: "bridge",
      data: {
        sourceChainId: params.sourceChain,
        targetChainId: params.targetChain,
        token: params.bridgeToken,
        amount: params.bridgeAmount,
      },
    },
    {
      type: "swap",
      chainId: params.targetChain,
      data: {
        fromToken: params.bridgeToken,
        toToken: params.swapToToken,
        amount: params.bridgeAmount,
      },
    },
    {
      type: "execute",
      chainId: params.targetChain,
      data: {
        target: params.executeContract,
        functionName: "execute",
      },
    },
  ]);
}
