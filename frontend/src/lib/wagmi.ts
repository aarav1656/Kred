import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { bscTestnet, bsc } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Kred",
  projectId: "kred-demo-hackathon-2026",
  chains: [bscTestnet, bsc],
  ssr: true,
});
