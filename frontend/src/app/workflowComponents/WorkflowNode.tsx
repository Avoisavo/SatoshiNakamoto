interface WorkflowNodeProps {
  node: {
    id: string;
    type: string;
    title: string;
    icon: string;
    position: { x: number; y: number };
    inputs?: { [key: string]: string };
  };
  isLast: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onAddExpression: (nodeId: string, fieldName: string) => void;
  onAddNode: () => void;
  onNodeClick: () => void;
}

export default function WorkflowNode({
  node,
  isLast,
  onMouseDown,
  onDelete,
  onAddExpression,
  onAddNode,
  onNodeClick,
}: WorkflowNodeProps) {
  return (
    <div
      className="absolute"
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onClick={onNodeClick}
    >
      <div
        className="px-6 py-4 rounded-xl min-w-[300px] cursor-move transition-all hover:scale-[1.02] relative group"
        style={{
          background:
            "linear-gradient(135deg, rgba(20, 25, 35, 0.98), rgba(25, 30, 40, 0.98))",
          border: "2px solid rgba(150, 180, 220, 0.5)",
          backdropFilter: "blur(20px)",
          boxShadow: `
            0 10px 30px rgba(0, 0, 0, 0.5),
            0 0 40px rgba(150, 180, 220, 0.2),
            inset 0 1px 2px rgba(150, 180, 220, 0.15)
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

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{node.icon}</span>
          <h3
            className="text-lg font-semibold"
            style={{ color: "#e0e8f0" }}
          >
            {node.title}
          </h3>
        </div>

        {/* Node Content */}
        <div className="space-y-2">
          {node.inputs && Object.keys(node.inputs).length > 0 && (
            <div className="text-sm text-gray-400">
              {Object.entries(node.inputs).map(([key, value]) => (
                <div key={key} className="py-1">
                  <span className="font-medium">{key}: </span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Next Node Button */}
        {isLast && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNode();
              }}
              className="w-full py-2 rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
              style={{
                background: "rgba(100, 150, 200, 0.3)",
                border: "1px solid rgba(150, 180, 220, 0.4)",
                color: "#e0e8f0",
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

