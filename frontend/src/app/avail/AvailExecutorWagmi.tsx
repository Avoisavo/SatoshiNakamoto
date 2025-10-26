"use client";

import { useAccount, useWalletClient } from "wagmi";
import {
  initializeNexusClient,
  isNexusClientInitialized,
} from "../../lib/avail/nexusClient";
import {
  executeBridge,
  executeBridgeAndExecute,
} from "../../lib/avail/bridgeExecutor";
import {
  logExecutionStart,
  logExecutionSuccess,
  logExecutionError,
  addExecutionLogEntry,
} from "../../lib/api/executionLogger";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

interface NodeInput {
  [key: string]: string | number | boolean | undefined;
}

interface WorkflowNode {
  id: string;
  type: string;
  title: string;
  inputs?: NodeInput;
}

interface LogEntry {
  nodeId: string;
  nodeTitle: string;
  timestamp: string;
  status: 'success' | 'error';
  input: NodeInput;
  output?: unknown;
  txHash?: string;
  error?: string;
  [key: string]: unknown;
}

interface ExecuteResult {
  success: boolean;
  logs: LogEntry[];
  error?: string;
  txHashes?: string[];
}

/**
 * Hook to use Avail Executor with wagmi
 */
export function useAvailExecutor() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

  return {
    walletConnected: isConnected,
    walletAddress: address || null,
    executeWorkflow: async (
      workflowId: string,
      nodes: WorkflowNode[]
    ): Promise<ExecuteResult> => {
      return executeAvailWorkflow(workflowId, nodes, isConnected, walletClient || undefined);
    },
  };
}

/**
 * Execute a workflow containing Avail nodes
 */
export async function executeAvailWorkflow(
  workflowId: string,
  nodes: WorkflowNode[],
  isConnected: boolean,
  walletClient: { account: { address: string } } | undefined
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const txHashes: string[] = [];

  try {
    // Ensure wallet is connected
    if (!isConnected || !walletClient) {
      throw new Error(
        "Please connect your wallet using the Connect button in the header to execute this workflow."
      );
    }

    console.log("✅ Wallet connected:", walletClient.account.address);

    // Initialize Nexus SDK only when needed (on first execution)
    if (!isNexusClientInitialized()) {
      console.log("🔧 Initializing Nexus SDK for first time...");
      console.log(
        "⚠️ IMPORTANT: You will need to approve a signature in MetaMask"
      );
      console.log(
        "⚠️ This creates your Chain Abstraction account (one-time setup)"
      );

      try {
        // Use window.ethereum directly for better network switching support
        // This ensures the SDK always sees the current network state
        if (typeof window !== "undefined" && window.ethereum) {
          const provider = window.ethereum;
          await initializeNexusClient(provider);
          console.log("✅ Nexus SDK initialized successfully!");
        } else {
          throw new Error(
            "MetaMask or compatible wallet not found. Please install MetaMask."
          );
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("User rejected")) {
          throw new Error(
            "You rejected the signature request. Please try again and approve the signature to create your Chain Abstraction account."
          );
        }
        throw error;
      }
    }

    // Log the current chain before executing
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const currentChainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        console.log(
          "✅ Executing from chain ID:",
          parseInt(String(currentChainId), 16)
        );
      } catch {
        console.warn("Could not detect current chain");
      }
    }

    console.log("✅ Nexus SDK ready for execution");

    // Start execution logging
    let executionId: string | undefined;
    try {
      const execution = await logExecutionStart({ workflowId });
      executionId = execution.id;
    } catch (error) {
      console.warn("Failed to log execution start:", error);
    }

    // Execute each node
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const timestamp = new Date().toLocaleTimeString();

      console.log(`Executing node ${i + 1}/${nodes.length}: ${node.title}`);

      try {
        let result;

        // Handle different node types
        switch (node.type) {
          case "avail-bridge":
            result = await executeAvailBridgeNode(node);
            break;

          case "avail-bridge-execute":
            result = await executeAvailBridgeExecuteNode(node);
            break;

          case "trigger":
            // Trigger nodes don't execute anything
            result = { success: true, message: "Workflow triggered" };
            break;

          default:
            // For non-Avail nodes, simulate execution
            await new Promise((resolve) => setTimeout(resolve, 500));
            result = {
              success: true,
              message: `Executed ${node.title}`,
            };
        }

        // Add to logs
        const logEntry = {
          nodeId: node.id,
          nodeTitle: node.title,
          timestamp,
          status: "success" as const,
          input: node.inputs || {},
          output: result,
          txHash: result.txHash,
        };

        logs.push(logEntry);

        if (result.txHash) {
          txHashes.push(result.txHash);
        }

        // Update execution log in backend
        if (executionId) {
          try {
            await addExecutionLogEntry(
              executionId,
              logs.slice(0, -1),
              logEntry
            );
          } catch (error) {
            console.warn("Failed to update execution log:", error);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        const logEntry = {
          nodeId: node.id,
          nodeTitle: node.title,
          timestamp,
          status: "error" as const,
          input: node.inputs || {},
          error: errorMessage,
        };

        logs.push(logEntry);

        // Log execution error
        if (executionId) {
          try {
            await logExecutionError({
              executionId,
              logs,
              errorMessage,
            });
          } catch (err) {
            console.warn("Failed to log execution error:", err);
          }
        }

        throw error;
      }
    }

    // Log successful completion
    if (executionId) {
      try {
        await logExecutionSuccess({
          executionId,
          logs,
          txHashes,
        });
      } catch (error) {
        console.warn("Failed to log execution success:", error);
      }
    }

    return {
      success: true,
      logs,
      txHashes,
    };
  } catch (error) {
    console.error("Workflow execution failed:", error);
    return {
      success: false,
      logs,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute an Avail Bridge node
 */
async function executeAvailBridgeNode(node: WorkflowNode) {
  const { targetChain, token, amount } = node.inputs || {};

  // Validate required parameters with specific error messages
  if (!targetChain) {
    throw new Error(
      "Missing destination chain. Please select a destination chain in the Avail Bridge node configuration."
    );
  }
  if (!token) {
    throw new Error(
      "Missing token. Please select a token (ETH, USDC, or USDT) in the Avail Bridge node configuration."
    );
  }
  if (!amount) {
    throw new Error(
      "Missing amount. Please enter an amount in the Avail Bridge node configuration."
    );
  }

  console.log("🌉 Executing Avail Bridge:", {
    targetChain,
    token,
    amount,
  });
  console.log("ℹ️ Source chain: Auto-detected from your connected wallet");
  console.log(
    "ℹ️ Tokens will be sent to your connected wallet on the destination chain"
  );

  // Source chain is auto-detected from connected wallet by the SDK
  const result = await executeBridge({
    sourceChain: String(targetChain), // Placeholder - SDK ignores this and auto-detects
    targetChain: String(targetChain),
    token: String(token),
    amount: String(amount),
  });

  if (!result.success) {
    throw new Error(result.error || "Bridge execution failed");
  }

  return result;
}

/**
 * Execute an Avail Bridge & Execute node
 */
async function executeAvailBridgeExecuteNode(node: WorkflowNode) {
  const {
    targetChain,
    token,
    amount,
    executeContract,
    executeFunction,
    executeFunctionParams,
    executeValue,
  } = node.inputs || {};

  // Validate required parameters with specific error messages
  if (!targetChain) {
    throw new Error(
      "Missing destination chain. Please select a destination chain in the Bridge & Execute node configuration."
    );
  }
  if (!token) {
    throw new Error(
      "Missing token. Please select a token (ETH, USDC, or USDT) in the Bridge & Execute node configuration."
    );
  }
  if (!amount) {
    throw new Error(
      "Missing amount. Please enter an amount in the Bridge & Execute node configuration."
    );
  }
  if (!executeContract) {
    throw new Error(
      "Missing contract address. Please enter the contract address in the Bridge & Execute node configuration."
    );
  }
  if (!executeFunction) {
    throw new Error(
      "Missing function name. Please enter the function name in the Bridge & Execute node configuration."
    );
  }

  console.log("🚀 Executing Avail Bridge & Execute:", {
    targetChain,
    token,
    amount,
    executeContract,
    executeFunction,
  });
  console.log("ℹ️ Source chain: Auto-detected from your connected wallet");

  // Parse function parameters if provided
  let parsedParams;
  try {
    parsedParams = executeFunctionParams
      ? JSON.parse(String(executeFunctionParams))
      : [];
  } catch {
    throw new Error("Invalid function parameters JSON");
  }

  // Source chain is auto-detected from connected wallet by the SDK
  const result = await executeBridgeAndExecute({
    sourceChain: String(targetChain), // Placeholder - SDK ignores this and auto-detects
    targetChain: String(targetChain),
    token: String(token),
    amount: String(amount),
    executeContract: String(executeContract),
    executeFunction: String(executeFunction),
    executeFunctionParams: parsedParams,
    executeValue: executeValue ? String(executeValue) : undefined,
  });

  if (!result.success) {
    throw new Error(result.error || "Bridge & Execute failed");
  }

  return result;
}
