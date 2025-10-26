"use client";
import {
  WagmiProvider,
  createConfig,
  http,
  createStorage,
  noopStorage,
} from "wagmi";
import {
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
  polygonAmoy,
  sepolia,
} from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const config = createConfig(
  getDefaultConfig({
    chains: [
      sepolia,
      baseSepolia,
      arbitrumSepolia,
      optimismSepolia,
      polygonAmoy,
    ],
    transports: {
      [sepolia.id]: http(sepolia.rpcUrls.default.http[0]),
      [baseSepolia.id]: http(baseSepolia.rpcUrls.default.http[0]),
      [arbitrumSepolia.id]: http(arbitrumSepolia.rpcUrls.default.http[0]),
      [optimismSepolia.id]: http(optimismSepolia.rpcUrls.default.http[0]),
      [polygonAmoy.id]: http(polygonAmoy.rpcUrls.default.http[0]),
    },

    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",

    // Required App Info
    appName: "LinkedOut",

    // Optional App Info
    appDescription: "LinkedOut Workflow Automation",
    appUrl:
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000",
    appIcon: "https://linkedout.app/icon.png",

    // Disable storage to prevent auto-reconnect
    storage: createStorage({ storage: noopStorage }),
  })
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="retro"
          options={{
            walletConnectCTA: "link",
            avoidLayoutShift: true,
            enforceSupportedChains: false,
            embedGoogleFonts: true,
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
