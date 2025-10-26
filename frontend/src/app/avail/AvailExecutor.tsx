"use client";

import { useState, useEffect } from "react";
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
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
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
 * AvailExecutor - Handles client-side execution of workflows with Avail nodes
 */
export default function AvailExecutor() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const provider = window.ethereum;

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else if (walletConnected && accounts[0] !== walletAddress) {
          // User switched accounts
          console.log("👤 Account switched to:", accounts[0]);
          setWalletAddress(accounts[0]);
        }
      };

      provider.on("accountsChanged", handleAccountsChanged);

      return () => {
        provider.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, [walletConnected, walletAddress]);

  const connectWallet = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet");
      return false;
    }

    try {
      const provider = window.ethereum;

      // Always request accounts to show MetaMask account selector
      // This allows user to choose which wallet to connect
      console.log("📱 Requesting wallet connection...");
      console.log(
        "💡 Please select which account you want to connect in MetaMask"
      );

      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
        console.log("✅ Wallet connected:", accounts[0]);
        console.log(
          "ℹ️ Nexus SDK will initialize when you execute your first workflow"
        );
        console.log(
          "ℹ️ You will be asked to sign a message to create your Chain Abstraction account"
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect wallet";

      // Don't show alert for user rejection
      if (errorMessage.includes("User rejected")) {
        console.log("👋 Wallet connection cancelled by user");
        return false;
      }

      alert(`Wallet connection failed: ${errorMessage}`);
      return false;
    }
  };

  const disconnectWallet = async () => {
    setWalletConnected(false);
    setWalletAddress(null);

    // Deinitialize Nexus SDK if it exists
    if (isNexusClientInitialized()) {
      try {
        const { resetNexusClient } = await import(
          "../../lib/avail/nexusClient"
        );
        await resetNexusClient();
        console.log("🔌 Nexus SDK deinitialized");
      } catch (error) {
        console.log("SDK cleanup:", error);
      }
    }

    console.log(
      "👋 Wallet disconnected. Connect again to choose a different account."
    );
  };

  return {
    walletConnected,
    walletAddress,
    connectWallet,
    disconnectWallet,
    executeWorkflow: async (
      workflowId: string,
      nodes: WorkflowNode[]
    ): Promise<ExecuteResult> => {
      return executeAvailWorkflow(
        workflowId,
        nodes,
        walletConnected,
        connectWallet
      );
    },
  };
}

/**
 * Execute a workflow containing Avail nodes
 */
export async function executeAvailWorkflow(
  workflowId: string,
  nodes: WorkflowNode[],
  walletConnected: boolean,
  connectWallet: () => Promise<boolean>
): Promise<ExecuteResult> {
  const logs: LogEntry[] = [];
  const txHashes: string[] = [];

  try {
    // Ensure wallet is connected first
    if (!walletConnected) {
      console.log("🔌 Wallet not connected. Requesting connection...");
      const connected = await connectWallet();
      if (!connected) {
        throw new Error(
          "Wallet connection required to execute Avail workflow. Please connect your wallet and try again."
        );
      }
    }

    // Initialize Nexus SDK only when needed (on first execution)
    if (!isNexusClientInitialized()) {
      console.log("🔧 Initializing Nexus SDK for first time...");
      console.log(
        "⚠️ IMPORTANT: You will need to approve a signature in MetaMask"
      );
      console.log(
        "⚠️ This creates your Chain Abstraction account (one-time setup)"
      );

      if (typeof window !== "undefined" && window.ethereum) {
        try {
          await initializeNexusClient(window.ethereum);
          console.log("✅ Nexus SDK initialized successfully!");
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("User rejected")
          ) {
            throw new Error(
              "You rejected the signature request. Please try again and approve the signature to create your Chain Abstraction account."
            );
          }
          throw error;
        }
      } else {
        throw new Error("No wallet provider found. Please install MetaMask.");
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
  const { sourceChain, targetChain, token, amount } = node.inputs || {};

  if (!sourceChain || !targetChain || !token || !amount) {
    throw new Error("Missing required bridge parameters");
  }

  console.log("🌉 Executing Avail Bridge:", {
    sourceChain,
    targetChain,
    token,
    amount,
  });
  console.log(
    "ℹ️ Tokens will be sent to your connected wallet on the destination chain"
  );

  const result = await executeBridge({
    sourceChain: String(sourceChain),
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
    sourceChain,
    targetChain,
    token,
    amount,
    executeContract,
    executeFunction,
    executeFunctionParams,
    executeValue,
  } = node.inputs || {};

  if (
    !sourceChain ||
    !targetChain ||
    !token ||
    !amount ||
    !executeContract ||
    !executeFunction
  ) {
    throw new Error("Missing required bridge & execute parameters");
  }

  console.log("🚀 Executing Avail Bridge & Execute:", {
    sourceChain,
    targetChain,
    token,
    amount,
    executeContract,
    executeFunction,
  });

  // Parse function parameters if provided
  let parsedParams;
  try {
    parsedParams = executeFunctionParams
      ? JSON.parse(String(executeFunctionParams))
      : [];
  } catch {
    throw new Error("Invalid function parameters JSON");
  }

  const result = await executeBridgeAndExecute({
    sourceChain: String(sourceChain),
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

/**
 * Hook to use Avail Executor in components
 */
export function useAvailExecutor() {
  return AvailExecutor();
}
