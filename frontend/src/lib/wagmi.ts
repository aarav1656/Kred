import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { bscTestnet, bsc } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Kred",
  projectId: "58d56eceb2c351f538934b05b790c6c3",
  chains: [bscTestnet, bsc],
  ssr: true,
});
