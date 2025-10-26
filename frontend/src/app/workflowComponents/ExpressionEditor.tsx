"use client";

import { useState } from "react";

interface ExpressionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expression: string) => void;
}

export default function ExpressionEditor({
  isOpen,
  onClose,
  onSave,
}: ExpressionEditorProps) {
  const [expression, setExpression] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(expression);
    setExpression("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        className="w-full max-w-2xl p-6 rounded-xl"
        style={{
          background: "rgba(30, 30, 36, 0.98)",
          border: "2px solid rgba(150, 180, 220, 0.4)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
        }}
      >
        <h2 className="text-2xl font-bold text-white mb-4">Expression Editor</h2>
        <textarea
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Enter expression..."
          className="w-full h-40 px-4 py-3 rounded-lg font-mono text-sm"
          style={{
            background: "rgba(20, 20, 24, 0.8)",
            border: "1px solid rgba(150, 180, 220, 0.3)",
            color: "#e0e8f0",
          }}
        />
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-lg font-semibold transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, rgba(100, 200, 100, 0.5), rgba(80, 180, 80, 0.6))",
              border: "1px solid rgba(120, 220, 120, 0.4)",
              color: "#ffffff",
            }}
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg font-semibold transition-all hover:scale-105"
            style={{
              background: "rgba(100, 100, 100, 0.3)",
              border: "1px solid rgba(150, 150, 150, 0.4)",
              color: "#e0e8f0",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

