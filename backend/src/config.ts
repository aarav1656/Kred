import dotenv from "dotenv";
dotenv.config();

export const config = {
  bscscanApiKey: process.env.BSCSCAN_API_KEY || "",
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  port: parseInt(process.env.PORT || "3001", 10),
  bscscanBaseUrl: "https://api.bscscan.com/api",
};
