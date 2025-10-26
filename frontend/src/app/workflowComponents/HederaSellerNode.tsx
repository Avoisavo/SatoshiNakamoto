"use client";

import { useState } from "react";

interface HederaSellerNodeProps {
  node: {
    id: string;
    type: string;
    title: string;
    icon: string;
    position: { x: number; y: number };
    inputs?: { [key: string]: unknown };
  };
  isLast: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onUpdateInputs: (nodeId: string, inputs: Record<string, unknown>) => void;
  onAddNode: () => void;
}

export default function HederaSellerNode({
  node,
  isLast,
  onMouseDown,
  onDelete,
  onUpdateInputs,
  onAddNode,
}: HederaSellerNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleInputChange = (field: string, value: unknown) => {
    onUpdateInputs(node.id, {
      ...node.inputs,
      [field]: value,
    });
  };

  const inputs = node.inputs || {};

  return (
    <div
      className="absolute"
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        width: "380px",
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
    >
      <div
        className="rounded-xl overflow-hidden shadow-2xl transition-all"
        style={{
          background:
            "linear-gradient(135deg, rgba(180, 138, 248, 0.15), rgba(150, 100, 220, 0.15))",
          border: "2px solid rgba(180, 138, 248, 0.4)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between cursor-move"
          style={{
            background:
              "linear-gradient(135deg, rgba(180, 138, 248, 0.2), rgba(150, 100, 220, 0.25))",
            borderBottom: "1px solid rgba(180, 150, 220, 0.3)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="text-3xl flex items-center justify-center w-12 h-12 rounded-xl"
              style={{
                background: "rgba(180, 138, 248, 0.3)",
                border: "1px solid rgba(180, 150, 220, 0.5)",
              }}
            >
              🏪
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: "#e0e8f0" }}>
                Hedera Seller Agent
              </h3>
              <p className="text-xs" style={{ color: "#8a9fb5" }}>
                Respond to offers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{
                background: "rgba(150, 100, 200, 0.3)",
                border: "1px solid rgba(180, 150, 220, 0.3)",
                color: "#e0e8f0",
              }}
            >
              <svg
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{
                background: "rgba(255, 100, 100, 0.3)",
                border: "1px solid rgba(255, 120, 120, 0.3)",
                color: "#ffaaaa",
              }}
            >
              <svg
                className="w-4 h-4"
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
          </div>
        </div>

        {/* Configuration Panel */}
        {isExpanded && (
          <div className="p-5 space-y-4">
            {/* Minimum Price */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#8a9fb5" }}
              >
                Minimum Acceptable Price
              </label>
              <input
                type="number"
                value={inputs.minPrice || ""}
                onChange={(e) =>
                  handleInputChange("minPrice", parseFloat(e.target.value) || 0)
                }
                placeholder="50"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: "rgba(30, 30, 36, 0.6)",
                  border: "1px solid rgba(180, 150, 220, 0.3)",
                  color: "#e0e8f0",
                }}
              />
            </div>

            {/* Ideal Price */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#8a9fb5" }}
              >
                Ideal Selling Price
              </label>
              <input
                type="number"
                value={inputs.idealPrice || ""}
                onChange={(e) =>
                  handleInputChange(
                    "idealPrice",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="80"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: "rgba(30, 30, 36, 0.6)",
                  border: "1px solid rgba(180, 150, 220, 0.3)",
                  color: "#e0e8f0",
                }}
              />
            </div>

            {/* Inventory */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#8a9fb5" }}
              >
                Inventory (JSON format)
              </label>
              <textarea
                value={inputs.inventory || '{"widgets": 100}'}
                onChange={(e) => handleInputChange("inventory", e.target.value)}
                placeholder='{"widgets": 100, "gadgets": 50}'
                rows={3}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none font-mono"
                style={{
                  background: "rgba(30, 30, 36, 0.6)",
                  border: "1px solid rgba(180, 150, 220, 0.3)",
                  color: "#e0e8f0",
                }}
              />
            </div>

            {/* Status */}
            {inputs.status && (
              <div
                className="px-4 py-3 rounded-lg text-sm"
                style={{
                  background: "rgba(180, 138, 248, 0.2)",
                  border: "1px solid rgba(180, 138, 248, 0.4)",
                  color: "#d0c0ff",
                }}
              >
                <div className="flex items-center gap-2">
                  <span>📊</span>
                  <span className="font-semibold">Status: {inputs.status}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Next Node Button */}
        {isLast && (
          <div className="px-5 pb-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNode();
              }}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105 flex items-center justify-center gap-2"
              style={{
                background:
                  "linear-gradient(135deg, rgba(150, 100, 200, 0.3), rgba(120, 80, 180, 0.4))",
                border: "1px solid rgba(180, 150, 220, 0.4)",
                color: "#e0e8f0",
              }}
            >
              <svg
                className="w-5 h-5"
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
              Add Next Node
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
