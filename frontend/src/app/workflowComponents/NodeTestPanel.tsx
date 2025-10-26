"use client";

interface NodeTestPanelProps {
  isOpen: boolean;
  appName: string;
  appIcon: string;
  triggerType: string;
  credential: Record<string, unknown>;
  onComplete: () => void;
  onCancel: () => void;
}

export default function NodeTestPanel({
  isOpen,
  appName,
  appIcon,
  triggerType,
  credential,
  onComplete,
  onCancel,
}: NodeTestPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        className="w-full max-w-md p-6 rounded-xl"
        style={{
          background: "rgba(30, 30, 36, 0.98)",
          border: "2px solid rgba(150, 180, 220, 0.4)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{appIcon}</span>
          <h2 className="text-2xl font-bold text-white">
            Test {appName} Trigger
          </h2>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-lg" style={{
            background: "rgba(100, 150, 200, 0.1)",
            border: "1px solid rgba(150, 180, 220, 0.3)",
          }}>
            <p className="text-sm text-gray-300">
              <strong>Trigger Type:</strong> {triggerType}
            </p>
            <p className="text-sm text-gray-300 mt-2">
              <strong>Credential:</strong> {credential?.name || "None"}
            </p>
          </div>

          <div className="p-4 rounded-lg text-center" style={{
            background: "rgba(100, 200, 100, 0.1)",
            border: "1px solid rgba(120, 220, 120, 0.3)",
          }}>
            <p className="text-white font-semibold">✓ Connection Successful</p>
            <p className="text-sm text-gray-400 mt-2">
              Your trigger is ready to use
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onComplete}
            className="flex-1 py-3 rounded-lg font-semibold transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, rgba(100, 200, 100, 0.5), rgba(80, 180, 80, 0.6))",
              border: "1px solid rgba(120, 220, 120, 0.4)",
              color: "#ffffff",
            }}
          >
            Add to Workflow
          </button>
          <button
            onClick={onCancel}
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

