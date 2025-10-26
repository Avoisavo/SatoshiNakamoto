"use client";

import { useState } from "react";

interface HederaPaymentNodeProps {
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

export default function HederaPaymentNode({
  node,
  isLast,
  onMouseDown,
  onDelete,
  onUpdateInputs,
  onAddNode,
}: HederaPaymentNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

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
            "linear-gradient(135deg, rgba(100, 255, 150, 0.15), rgba(80, 200, 120, 0.15))",
          border: "2px solid rgba(100, 255, 150, 0.4)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between cursor-move"
          style={{
            background:
              "linear-gradient(135deg, rgba(100, 255, 150, 0.2), rgba(80, 200, 120, 0.25))",
            borderBottom: "1px solid rgba(100, 220, 150, 0.3)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="text-3xl flex items-center justify-center w-12 h-12 rounded-xl"
              style={{
                background: "rgba(100, 255, 150, 0.3)",
                border: "1px solid rgba(100, 220, 150, 0.5)",
              }}
            >
              💳
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: "#e0e8f0" }}>
                Hedera Payment Agent
              </h3>
              <p className="text-xs" style={{ color: "#8a9fb5" }}>
                Execute HTS transfers
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
                background: "rgba(80, 200, 120, 0.3)",
                border: "1px solid rgba(100, 220, 150, 0.3)",
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

        {/* Status Display */}
        {isExpanded && (
          <div className="p-5 space-y-4">
            <div
              className="px-4 py-3 rounded-lg text-sm"
              style={{
                background: "rgba(100, 255, 150, 0.1)",
                border: "1px solid rgba(100, 220, 150, 0.3)",
                color: "#90ff90",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span>ℹ️</span>
                <span className="font-semibold">Payment Agent</span>
              </div>
              <p className="text-xs" style={{ color: "#8a9fb5" }}>
                This agent listens for payment requests and executes HTS token
                transfers. It runs automatically when the workflow is executed.
              </p>
            </div>

            {/* Payment Status */}
            {inputs.status && (
              <div
                className="px-4 py-3 rounded-lg text-sm"
                style={{
                  background:
                    inputs.status === "success"
                      ? "rgba(100, 255, 150, 0.2)"
                      : inputs.status === "failed"
                      ? "rgba(255, 100, 100, 0.2)"
                      : "rgba(255, 200, 100, 0.2)",
                  border: `1px solid ${
                    inputs.status === "success"
                      ? "rgba(100, 255, 150, 0.4)"
                      : inputs.status === "failed"
                      ? "rgba(255, 100, 100, 0.4)"
                      : "rgba(255, 200, 100, 0.4)"
                  }`,
                  color:
                    inputs.status === "success"
                      ? "#90ff90"
                      : inputs.status === "failed"
                      ? "#ff9090"
                      : "#ffcc77",
                }}
              >
                <div className="flex items-center gap-2">
                  <span>
                    {inputs.status === "success"
                      ? "✅"
                      : inputs.status === "failed"
                      ? "❌"
                      : "⏳"}
                  </span>
                  <span className="font-semibold">
                    {inputs.status === "success"
                      ? "Payment Successful"
                      : inputs.status === "failed"
                      ? "Payment Failed"
                      : "Processing Payment..."}
                  </span>
                </div>

                {inputs.transactionId && (
                  <div className="mt-2">
                    <p className="text-xs" style={{ color: "#8a9fb5" }}>
                      Transaction ID:
                    </p>
                    <p
                      className="text-xs font-mono break-all"
                      style={{ color: "#e0e8f0" }}
                    >
                      {inputs.transactionId}
                    </p>
                  </div>
                )}

                {inputs.amount && (
                  <div className="mt-2">
                    <p className="text-xs" style={{ color: "#8a9fb5" }}>
                      Amount:{" "}
                      <span style={{ color: "#e0e8f0" }}>
                        {inputs.amount} {inputs.tokenId || "HBAR"}
                      </span>
                    </p>
                  </div>
                )}

                {inputs.error && (
                  <div className="mt-2">
                    <p className="text-xs" style={{ color: "#ff9090" }}>
                      Error: {inputs.error}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Payment History */}
            {inputs.paymentHistory && inputs.paymentHistory.length > 0 && (
              <div>
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: "#8a9fb5" }}
                >
                  Payment History ({inputs.paymentHistory.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {inputs.paymentHistory.map((payment: Record<string, unknown>, idx: number) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-lg text-xs"
                      style={{
                        background: "rgba(30, 30, 36, 0.6)",
                        border: "1px solid rgba(100, 220, 150, 0.2)",
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span style={{ color: "#90ff90" }}>
                          ✅ {payment.item}
                        </span>
                        <span style={{ color: "#8a9fb5" }}>
                          {payment.amount}
                        </span>
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: "#8a9fb5" }}
                      >
                        {payment.timestamp}
                      </div>
                    </div>
                  ))}
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
                  "linear-gradient(135deg, rgba(80, 200, 120, 0.3), rgba(60, 150, 100, 0.4))",
                border: "1px solid rgba(100, 220, 150, 0.4)",
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
