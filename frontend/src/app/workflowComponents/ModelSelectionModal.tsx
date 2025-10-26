"use client";

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (model: Record<string, unknown>) => void;
}

const AVAILABLE_MODELS = [
  {
    id: "gpt-4",
    title: "GPT-4",
    icon: "🤖",
    provider: "OpenAI",
    description: "Most capable GPT-4 model"
  },
  {
    id: "gpt-3.5-turbo",
    title: "GPT-3.5 Turbo",
    icon: "⚡",
    provider: "OpenAI",
    description: "Fast and efficient"
  },
  {
    id: "claude-3",
    title: "Claude 3",
    icon: "🧠",
    provider: "Anthropic",
    description: "Advanced reasoning capabilities"
  },
  {
    id: "llama-3",
    title: "Llama 3",
    icon: "🦙",
    provider: "Meta",
    description: "Open-source LLM"
  },
];

export default function ModelSelectionModal({
  isOpen,
  onClose,
  onSelectModel,
}: ModelSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        className="w-full max-w-2xl p-6 rounded-xl max-h-[80vh] overflow-y-auto"
        style={{
          background: "rgba(30, 30, 36, 0.98)",
          border: "2px solid rgba(150, 180, 220, 0.4)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Select AI Model</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelectModel(model)}
              className="p-4 rounded-lg text-left transition-all hover:scale-105"
              style={{
                background: "rgba(20, 25, 35, 0.8)",
                border: "2px solid rgba(150, 180, 220, 0.3)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{model.icon}</span>
                <div>
                  <h3 className="text-white font-semibold">{model.title}</h3>
                  <p className="text-xs text-gray-400">{model.provider}</p>
                </div>
              </div>
              <p className="text-sm text-gray-300">{model.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

