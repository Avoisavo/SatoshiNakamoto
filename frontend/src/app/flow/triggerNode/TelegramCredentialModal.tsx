import React, { useState, useEffect } from 'react';

interface BotInfo {
  id?: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
  [key: string]: unknown;
}

interface TelegramCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (token: string, info: BotInfo) => void;
}

export default function TelegramCredentialModal({
  isOpen,
  onClose,
  onSubmit,
}: TelegramCredentialModalProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load saved token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('telegram_bot_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify bot token
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await response.json();

      if (data.ok) {
        // Save token to localStorage
        localStorage.setItem('telegram_bot_token', token);
        onSubmit(token, data.result);
      } else {
        setError('Invalid bot token. Please check and try again.');
      }
    } catch (err) {
      setError('Failed to verify bot token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Connect Telegram Bot
        </h2>
        <p className="text-gray-600 mb-6">
          Enter your Telegram bot token to connect
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              // Save to localStorage as user types
              localStorage.setItem('telegram_bot_token', e.target.value);
            }}
            placeholder="Enter bot token"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={loading || !token}
            >
              {loading ? 'Verifying...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

