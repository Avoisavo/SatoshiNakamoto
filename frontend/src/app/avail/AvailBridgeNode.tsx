"use client";

import { useState } from "react";
import {
  SUPPORTED_CHAINS,
  getSupportedChainNames,
} from "../../lib/avail/nexusClient";

interface AvailBridgeNodeProps {
  node: {
    id: string;
    type: string;
    title: string;
    icon: string;
    position: { x: number; y: number };
    inputs?: {
      targetChain?: string;
      token?: string;
      amount?: string;
    };
  };
  isLast: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onUpdateInputs: (nodeId: string, inputs: Record<string, string>) => void;
  onAddNode: () => void;
}

export default function AvailBridgeNode({
  node,
  isLast,
  onMouseDown,
  onDelete,
  onUpdateInputs,
  onAddNode,
}: AvailBridgeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const supportedChains = getSupportedChainNames();

  // All supported chains except Sepolia are available as destinations
  // Sepolia is typically used as a hub/source chain in testnet
  const destinationChains = supportedChains.filter(
    (chain) => chain.toLowerCase() !== "sepolia"
  );

  const tokens = ["ETH", "USDC", "USDT"];

  const handleInputChange = (field: string, value: string) => {
    onUpdateInputs(node.id, {
      ...node.inputs,
      [field]: value,
    });
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
    >
      <div
        className="px-6 py-4 rounded-xl min-w-[360px] cursor-move transition-all hover:scale-[1.02] relative group"
        style={{
          background:
            "linear-gradient(135deg, rgba(20, 25, 35, 0.98), rgba(25, 30, 40, 0.98))",
          border: "2px solid rgba(100, 220, 180, 0.6)",
          backdropFilter: "blur(20px)",
          boxShadow: `
            0 10px 30px rgba(0, 0, 0, 0.5),
            0 0 40px rgba(100, 220, 180, 0.25),
            inset 0 1px 2px rgba(100, 220, 180, 0.15)
          `,
        }}
      >
        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 80, 80, 0.9), rgba(220, 60, 60, 1))",
            border: "1px solid rgba(255, 120, 120, 0.6)",
            boxShadow: "0 2px 8px rgba(255, 80, 80, 0.4)",
            color: "#ffffff",
          }}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(100, 220, 180, 0.3), rgba(80, 200, 160, 0.4))",
              border: "2px solid rgba(100, 220, 180, 0.5)",
              boxShadow: "0 0 15px rgba(100, 220, 180, 0.3)",
            }}
          >
            {node.icon}
          </div>
          <div className="flex-1">
            <p
              className="text-base font-bold"
              style={{
                color: "#f0f8ff",
                fontFamily: "'Inter', sans-serif",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
              }}
            >
              {node.title}
            </p>
            <p className="text-xs font-medium" style={{ color: "#9dd5c0" }}>
              Avail Nexus Bridge
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "#e0e8f0" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Configuration Fields */}
        {isExpanded && (
          <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
            {/* Info */}
            <div
              className="px-3 py-2.5 rounded-lg"
              style={{
                background: "rgba(100, 180, 220, 0.15)",
                border: "1px solid rgba(100, 220, 180, 0.4)",
              }}
            >
              <p className="text-xs font-medium" style={{ color: "#a8e6cf" }}>
                💡 Source: Auto-detected from your current wallet network
              </p>
            </div>

            {/* Destination Chain */}
            <div>
              <label
                className="text-sm font-bold mb-1 block"
                style={{ color: "#d0f0e0" }}
              >
                Destination Chain
              </label>
              <select
                value={node.inputs?.targetChain || ""}
                onChange={(e) =>
                  handleInputChange("targetChain", e.target.value)
                }
                className="w-full px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "2px solid rgba(100, 220, 180, 0.4)",
                  color: "#f0f8ff",
                }}
              >
                <option value="" style={{ background: "#1a1f2e" }}>
                  Select destination...
                </option>
                {destinationChains.map((chain) => (
                  <option
                    key={chain}
                    value={chain}
                    style={{ background: "#1a1f2e" }}
                  >
                    {SUPPORTED_CHAINS[chain]?.name || chain}
                  </option>
                ))}
              </select>
              <p
                className="text-xs mt-1.5 font-medium"
                style={{ color: "#8dd3bb" }}
              >
                ⏱️ Bridge takes 10-15 minutes to complete
              </p>
            </div>

            {/* Token */}
            <div>
              <label
                className="text-sm font-bold mb-1 block"
                style={{ color: "#d0f0e0" }}
              >
                Token
              </label>
              <select
                value={node.inputs?.token || ""}
                onChange={(e) => handleInputChange("token", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "2px solid rgba(100, 220, 180, 0.4)",
                  color: "#f0f8ff",
                }}
              >
                <option value="" style={{ background: "#1a1f2e" }}>
                  Select token...
                </option>
                {tokens.map((token) => (
                  <option
                    key={token}
                    value={token}
                    style={{ background: "#1a1f2e" }}
                  >
                    {token}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label
                className="text-sm font-bold mb-1 block"
                style={{ color: "#d0f0e0" }}
              >
                Amount
              </label>
              <input
                type="text"
                value={node.inputs?.amount || ""}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="e.g., 0.01"
                className="w-full px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "2px solid rgba(100, 220, 180, 0.4)",
                  color: "#f0f8ff",
                }}
              />
              <p
                className="text-xs mt-1.5 font-medium"
                style={{ color: "#8dd3bb" }}
              >
                💡 Tokens will be sent to your connected wallet on the
                destination chain
              </p>
            </div>
          </div>
        )}

        {/* Summary when collapsed */}
        {!isExpanded && node.inputs?.targetChain && (
          <div
            className="mt-3 text-sm font-semibold"
            style={{ color: "#a8e6cf" }}
          >
            Bridge to{" "}
            {SUPPORTED_CHAINS[node.inputs.targetChain]?.name ||
              node.inputs.targetChain}
            {node.inputs.amount &&
              node.inputs.token &&
              ` | ${node.inputs.amount} ${node.inputs.token}`}
          </div>
        )}
      </div>

      {/* Add Node Button */}
      {isLast && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onAddNode}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              background:
                "linear-gradient(135deg, rgba(100, 200, 150, 0.5), rgba(80, 180, 130, 0.6))",
              border: "1px solid rgba(150, 220, 180, 0.4)",
              boxShadow: "0 4px 12px rgba(80, 180, 130, 0.3)",
            }}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
