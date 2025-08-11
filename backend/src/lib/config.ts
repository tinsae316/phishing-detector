export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "change-me-in-prod",
  forceHttps: String(process.env.FORCE_HTTPS || "false").toLowerCase() === "true",
  safeBrowsingApiKey: process.env.SAFE_BROWSING_API_KEY || "",
  virusTotalApiKey: process.env.VIRUSTOTAL_API_KEY || "",
};


