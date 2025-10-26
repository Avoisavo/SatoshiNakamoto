"use client";

import { useState, useEffect } from "react";
import * as AgentAPI from "../../../lib/api/agentClient";

interface HederaAgentNodeProps {
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

export default function HederaAgentNode({
  node,
  isLast,
  onMouseDown,
  onDelete,
  onUpdateInputs,
  onAddNode,
}: HederaAgentNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [userMessage, setUserMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [pendingBridges, setPendingBridges] = useState<Record<string, unknown>[]>([]);
  const [agentStatus, setAgentStatus] = useState<Record<string, unknown> | null>(null);

  const inputs = node.inputs || {};
  const chatId = inputs.chatId || `workflow-${node.id}`;

  // Poll for status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await AgentAPI.getAgentStatus();
        setAgentStatus(status);
      } catch (error) {
        console.error("Failed to get agent status:", error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll for notifications
  useEffect(() => {
    if (!processing) return;

    const checkNotifications = async () => {
      try {
        const { notifications: notes } = await AgentAPI.getNotifications(
          chatId
        );
        if (notes.length > 0) {
          setNotifications(notes);
          setProcessing(false);
        }
      } catch (error) {
        console.error("Failed to get notifications:", error);
      }
    };

    const interval = setInterval(checkNotifications, 2000);
    return () => clearInterval(interval);
  }, [processing, chatId]);

  // Poll for pending bridges
  useEffect(() => {
    const checkPending = async () => {
      try {
        const { executions } = await AgentAPI.getPendingBridges();
        setPendingBridges(executions);
      } catch (error) {
        console.error("Failed to get pending bridges:", error);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    setProcessing(true);
    setNotifications([]);

    try {
      // Ensure agents are started
      if (!agentStatus?.telegram?.running) {
        await AgentAPI.startAgents();
      }

      // Send message
      const { correlationId } = await AgentAPI.sendTelegramMessage({
        text: userMessage,
        chatId,
        userId: "workflow-user",
      });

      onUpdateInputs(node.id, {
        ...inputs,
        correlationId,
        lastMessage: userMessage,
        status: "processing",
      });

      setUserMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      onUpdateInputs(node.id, {
        ...inputs,
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      });
      setProcessing(false);
    }
  };

  const handleSimulateBridge = async (correlationId: string) => {
    try {
      await AgentAPI.simulateBridge(correlationId);
      alert("Bridge simulation completed! Check notifications.");
    } catch (error) {
      alert(`Failed to simulate bridge: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleStartAgents = async () => {
    try {
      await AgentAPI.startAgents();
      alert("Agents started successfully!");
    } catch (error) {
      alert(`Failed to start agents: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleStopAgents = async () => {
    try {
      await AgentAPI.stopAgents();
      alert("Agents stopped");
    } catch (error) {
      alert(`Failed to stop agents: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        width: "420px",
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
    >
      <div
        className="rounded-xl overflow-hidden shadow-2xl transition-all"
        style={{
          background:
            "linear-gradient(135deg, rgba(138, 180, 248, 0.15), rgba(180, 138, 248, 0.15))",
          border: "2px solid rgba(160, 160, 248, 0.4)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between cursor-move"
          style={{
            background:
              "linear-gradient(135deg, rgba(138, 180, 248, 0.2), rgba(180, 138, 248, 0.25))",
            borderBottom: "1px solid rgba(160, 160, 220, 0.3)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="text-3xl flex items-center justify-center w-12 h-12 rounded-xl"
              style={{
                background: "rgba(160, 160, 248, 0.3)",
                border: "1px solid rgba(160, 160, 220, 0.5)",
              }}
            >
              🤖
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: "#e0e8f0" }}>
                Hedera Agent System
              </h3>
              <p className="text-xs" style={{ color: "#8a9fb5" }}>
                Telegram → AI → Bridge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {agentStatus && (
              <div
                className="px-2 py-1 rounded text-xs"
                style={{
                  background: agentStatus.telegram?.running
                    ? "rgba(100, 255, 150, 0.2)"
                    : "rgba(255, 100, 100, 0.2)",
                  color: agentStatus.telegram?.running ? "#90ff90" : "#ff9090",
                }}
              >
                {agentStatus.telegram?.running ? "🟢 Online" : "🔴 Offline"}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{
                background: "rgba(120, 120, 200, 0.3)",
                border: "1px solid rgba(160, 160, 220, 0.3)",
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

        {/* Content */}
        {isExpanded && (
          <div className="p-5 space-y-4">
            {/* Agent Controls */}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartAgents();
                }}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: "rgba(100, 255, 150, 0.2)",
                  border: "1px solid rgba(100, 255, 150, 0.4)",
                  color: "#90ff90",
                }}
              >
                ▶️ Start Agents
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopAgents();
                }}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: "rgba(255, 100, 100, 0.2)",
                  border: "1px solid rgba(255, 100, 100, 0.4)",
                  color: "#ff9090",
                }}
              >
                ⏹️ Stop Agents
              </button>
            </div>

            {/* Message Input */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#8a9fb5" }}
              >
                Send Message to AI Agent
              </label>
              <textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="e.g., Bridge 100 USDC from Ethereum to Polygon"
                rows={3}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: "rgba(30, 30, 36, 0.6)",
                  border: "1px solid rgba(160, 160, 220, 0.3)",
                  color: "#e0e8f0",
                }}
                disabled={processing}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendMessage();
                }}
                disabled={processing || !userMessage.trim()}
                className="w-full mt-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: processing
                    ? "rgba(160, 160, 220, 0.2)"
                    : "rgba(138, 180, 248, 0.3)",
                  border: "1px solid rgba(160, 160, 220, 0.4)",
                  color: "#e0e8f0",
                }}
              >
                {processing ? "⏳ Processing..." : "📤 Send Message"}
              </button>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
              <div>
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: "#8a9fb5" }}
                >
                  Notifications ({notifications.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map((notif, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 rounded-lg text-sm"
                      style={{
                        background:
                          notif.level === "error"
                            ? "rgba(255, 100, 100, 0.2)"
                            : notif.level === "success"
                            ? "rgba(100, 255, 150, 0.2)"
                            : "rgba(255, 200, 100, 0.2)",
                        border: `1px solid ${
                          notif.level === "error"
                            ? "rgba(255, 100, 100, 0.4)"
                            : notif.level === "success"
                            ? "rgba(100, 255, 150, 0.4)"
                            : "rgba(255, 200, 100, 0.4)"
                        }`,
                        color:
                          notif.level === "error"
                            ? "#ff9090"
                            : notif.level === "success"
                            ? "#90ff90"
                            : "#ffcc77",
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span>
                          {notif.level === "error"
                            ? "❌"
                            : notif.level === "success"
                            ? "✅"
                            : "ℹ️"}
                        </span>
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap">{notif.message}</p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "#8a9fb5" }}
                          >
                            {new Date(notif.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Bridge Executions */}
            {pendingBridges.length > 0 && (
              <div>
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: "#8a9fb5" }}
                >
                  Pending Bridge Executions ({pendingBridges.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pendingBridges.map((bridge, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 rounded-lg text-sm"
                      style={{
                        background: "rgba(138, 180, 248, 0.2)",
                        border: "1px solid rgba(138, 180, 248, 0.4)",
                        color: "#e0e8f0",
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">
                            🌉 {bridge.sourceChain} → {bridge.targetChain}
                          </p>
                          <p className="text-xs" style={{ color: "#8a9fb5" }}>
                            {bridge.amount} {bridge.token}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimulateBridge(bridge.correlationId);
                          }}
                          className="px-3 py-1 rounded text-xs font-semibold transition-all hover:scale-105"
                          style={{
                            background: "rgba(100, 255, 150, 0.3)",
                            border: "1px solid rgba(100, 255, 150, 0.5)",
                            color: "#90ff90",
                          }}
                        >
                          Simulate
                        </button>
                      </div>
                      <p className="text-xs" style={{ color: "#8a9fb5" }}>
                        Status: {bridge.status} • Requested:{" "}
                        {new Date(bridge.requestedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div
              className="px-4 py-3 rounded-lg text-xs"
              style={{
                background: "rgba(138, 180, 248, 0.1)",
                border: "1px solid rgba(160, 160, 220, 0.3)",
                color: "#8a9fb5",
              }}
            >
              <p className="font-semibold mb-1" style={{ color: "#e0e8f0" }}>
                💡 How it works:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Send a bridge request message</li>
                <li>AI Agent analyzes using if/else logic</li>
                <li>If approved, bridge execution is queued</li>
                <li>Execute or simulate the bridge</li>
                <li>Get completion notification</li>
              </ol>
            </div>
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
                  "linear-gradient(135deg, rgba(120, 120, 200, 0.3), rgba(100, 100, 180, 0.4))",
                border: "1px solid rgba(160, 160, 220, 0.4)",
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
