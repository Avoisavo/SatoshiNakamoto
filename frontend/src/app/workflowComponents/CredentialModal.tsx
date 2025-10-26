import { useState } from "react";

interface CredentialModalProps {
  isOpen: boolean;
  appName: string;
  appIcon: string;
  onClose: () => void;
  onCredentialSaved: (credential: Record<string, unknown>) => void;
}

export default function CredentialModal({
  isOpen,
  appName,
  appIcon,
  onClose,
  onCredentialSaved,
}: CredentialModalProps) {
  const [credentialName, setCredentialName] = useState("");
  const [apiKey, setApiKey] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    const credential = {
      id: Date.now().toString(),
      name: credentialName,
      apiKey: apiKey,
      app: appName,
    };
    onCredentialSaved(credential);
    setCredentialName("");
    setApiKey("");
  };

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
            Connect {appName}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Credential Name
            </label>
            <input
              type="text"
              value={credentialName}
              onChange={(e) => setCredentialName(e.target.value)}
              placeholder="My Credential"
              className="w-full px-4 py-3 rounded-lg"
              style={{
                background: "rgba(20, 20, 24, 0.8)",
                border: "1px solid rgba(150, 180, 220, 0.3)",
                color: "#e0e8f0",
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key / Token
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-4 py-3 rounded-lg"
              style={{
                background: "rgba(20, 20, 24, 0.8)",
                border: "1px solid rgba(150, 180, 220, 0.3)",
                color: "#e0e8f0",
              }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={!credentialName || !apiKey}
            className="flex-1 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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

