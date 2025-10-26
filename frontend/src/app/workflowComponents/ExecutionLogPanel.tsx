interface ExecutionLog {
  nodeId: string;
  nodeTitle: string;
  timestamp: string;
  status: "success" | "error";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

interface ExecutionLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ExecutionLog[];
}

export default function ExecutionLogPanel({
  isOpen,
  onClose,
  logs,
}: ExecutionLogPanelProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 w-96 z-50 shadow-2xl overflow-y-auto"
      style={{
        background: "rgba(30, 30, 36, 0.98)",
        borderLeft: "1px solid rgba(150, 180, 220, 0.3)",
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Execution Log</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {logs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No logs yet</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="p-4 rounded-lg"
                style={{
                  background: log.status === "success" 
                    ? "rgba(100, 200, 100, 0.1)" 
                    : "rgba(255, 100, 100, 0.1)",
                  border: `1px solid ${log.status === "success" ? "rgba(100, 200, 100, 0.3)" : "rgba(255, 100, 100, 0.3)"}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{log.nodeTitle}</span>
                  <span className="text-xs text-gray-400">{log.timestamp}</span>
                </div>
                {log.error && (
                  <p className="text-red-400 text-sm mt-2">{log.error}</p>
                )}
                {log.output && (
                  <pre className="text-xs text-gray-300 mt-2 overflow-x-auto">
                    {JSON.stringify(log.output, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

