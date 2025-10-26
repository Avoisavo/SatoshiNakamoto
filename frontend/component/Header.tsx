"use client";

import { useRouter } from "next/navigation";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect } from "wagmi";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export default function Header({
  title = "LinkedOut",
  showBackButton = false,
}: HeaderProps) {
  const router = useRouter();
  const { disconnectAsync } = useDisconnect();

  const handleDisconnect = async () => {
    try {
      await disconnectAsync();
    } catch (error) {
      console.error("Failed to disconnect wallet", error);
    }
  };

  return (
    <div
      className="relative z-20 h-16 flex items-center justify-between px-6 border-b"
      style={{
        background: "rgba(20, 20, 25, 0.95)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Left Side */}
      <div className="flex items-center gap-4">
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg transition-all hover:scale-110"
            style={{
              background: "rgba(60, 60, 70, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="#e0e8f0"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <h1
          className="text-xl font-bold cursor-pointer transition-all hover:scale-105"
          onClick={() => router.push("/land")}
          style={{
            fontFamily: "'Orbitron', sans-serif",
            background:
              "linear-gradient(to bottom, #ffffff 0%, #e0e8f0 50%, #9fb5cc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "0.1em",
          }}
        >
          {title}
        </h1>
      </div>

      {/* Center - Navigation Links */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => router.push("/workflow")}
          className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            background: "rgba(60, 60, 70, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#e0e8f0",
            fontSize: "14px",
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
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          My Workflow
        </button>
        <button
          className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            background: "rgba(60, 60, 70, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#e0e8f0",
            fontSize: "14px",
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
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          Credential
        </button>
      </div>

      {/* Right Side - Connect Wallet */}
      <div className="flex items-center gap-4">
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            const isConnected = mounted && account && chain;
            const address = account?.address;
            const show = openAccountModal || openConnectModal;
            return (
            <>
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={show}
                    className="px-6 py-2.5 rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-2"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      background:
                        "linear-gradient(135deg, rgba(80, 200, 120, 0.5), rgba(60, 180, 100, 0.6))",
                      border: "1px solid rgba(120, 220, 150, 0.4)",
                      color: "#ffffff",
                      backdropFilter: "blur(15px)",
                      boxShadow: `0 8px 24px rgba(80, 200, 120, 0.3),
                         inset 0 1px 2px rgba(255, 255, 255, 0.2),
                         0 0 30px rgba(100, 200, 150, 0.25)`,
                      letterSpacing: "0.05em",
                      fontSize: "14px",
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: "#4ade80" }}
                    />
                    <span>
                      {address
                        ? `${address.slice(0, 6)}...${address.slice(-4)}`
                        : "Connected"}
                    </span>
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2.5 rounded-lg font-semibold transition-all hover:scale-105"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      background:
                        "linear-gradient(135deg, rgba(200, 80, 80, 0.5), rgba(180, 60, 60, 0.6))",
                      border: "1px solid rgba(220, 100, 100, 0.4)",
                      color: "#ffffff",
                      backdropFilter: "blur(15px)",
                      boxShadow: `0 4px 12px rgba(200, 80, 80, 0.3)`,
                      letterSpacing: "0.05em",
                      fontSize: "14px",
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={openConnectModal}
                  className="px-6 py-2.5 rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-2"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    background:
                      "linear-gradient(135deg, rgba(100, 150, 200, 0.5), rgba(80, 120, 180, 0.6))",
                    border: "1px solid rgba(150, 180, 220, 0.4)",
                    color: "#ffffff",
                    backdropFilter: "blur(15px)",
                    boxShadow: `0 8px 24px rgba(80, 120, 180, 0.3),
                       inset 0 1px 2px rgba(255, 255, 255, 0.2),
                       0 0 30px rgba(100, 150, 200, 0.25)`,
                    letterSpacing: "0.05em",
                    fontSize: "14px",
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
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  Connect Wallet
                </button>
              )}
            </>
            );
          }}
        </ConnectButton.Custom>
      </div>

      {/* Fonts */}
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap");
      `}</style>
    </div>
  );
}