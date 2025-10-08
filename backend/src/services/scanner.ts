import { prisma } from "../lib/db";
import punycode from "punycode";
import axios from "axios";
import { config } from "../lib/config";

// In-memory cache for performance
const urlCache = new Map<string, { result: ScanResult; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const threatCache = new Map<string, any>();
const THREAT_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export type ScanResult = {
  verdict: "safe" | "suspicious" | "unsafe";
  score: number; // 0..100 higher is more risky
  reasons: string[];
  matchedThreatIds?: string[];
};

export async function scanUrl(inputUrl: string): Promise<ScanResult> {
  const normalizedUrl = normalizeUrl(inputUrl);
  
  // Check cache first
  const cached = urlCache.get(normalizedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }

  const reasons: string[] = [];
  let score = 0;
  const matchedThreatIds: string[] = [];

  // Rule-based checks (fastest)
  const ruleScore = await ruleBasedChecks(normalizedUrl, matchedThreatIds, reasons);
  score += ruleScore;

  // If already unsafe from rules, skip external checks for speed
  if (score >= 70) {
    const result: ScanResult = { 
      verdict: "unsafe", 
      score: Math.min(100, score), 
      reasons, 
      matchedThreatIds: matchedThreatIds.length ? matchedThreatIds : undefined 
    };
    urlCache.set(normalizedUrl, { result, timestamp: Date.now() });
    return result;
  }

  // External Intel (only for suspicious/safe URLs)
  const intel = await externalIntelChecks(normalizedUrl, reasons);
  score += intel.scoreDelta;

  // Optional ML hook (placeholder)
  // const ml = await mlPrediction(normalizedUrl); score += ml.scoreDelta; reasons.push(...ml.reasons);

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  let verdict: ScanResult["verdict"] = "safe";
  if (score >= 70) verdict = "unsafe";
  else if (score >= 35) verdict = "suspicious";

  const result: ScanResult = { 
    verdict, 
    score, 
    reasons, 
    matchedThreatIds: matchedThreatIds.length ? matchedThreatIds : undefined 
  };
  
  // Cache the result
  urlCache.set(normalizedUrl, { result, timestamp: Date.now() });
  
  return result;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

async function ruleBasedChecks(url: string, matchedThreatIds: string[], reasons: string[]): Promise<number> {
  let score = 0;
  const u = new URL(url);
  const hostname = u.hostname.toLowerCase();
  const asciiHostname = punycode.toASCII(hostname);
  const pathname = u.pathname.toLowerCase();
  const searchParams = u.searchParams.toString().toLowerCase();

  // 1) Threat DB direct match (cached for performance)
  let threats = threatCache.get('threats');
  const timestamp = threatCache.get('threats_timestamp') as unknown as number;
  if (!threats || Date.now() - (timestamp || 0) > THREAT_CACHE_DURATION) {
    threats = await prisma.threatEntry.findMany();
    threatCache.set('threats', threats);
    threatCache.set('threats_timestamp', Date.now());
  }
  
  for (const t of threats) {
    const hit = t.isRegex ? new RegExp(t.pattern, "i").test(url) : url.includes(t.pattern) || asciiHostname.endsWith(t.pattern) || hostname.endsWith(t.pattern);
    if (hit) {
      matchedThreatIds.push(t.id);
      reasons.push(`Matched threat: ${t.pattern}`);
      // Make DB matches more decisive so admins can force blocking.
      // high => +80 (unsafe), medium => +60 (likely unsafe), low => +30 (suspicious)
      score += t.severity === "high" ? 80 : t.severity === "medium" ? 60 : 30;
    }
  }

  // 2) Enhanced suspicious patterns
  if (hostname.split(".").length > 4) {
    reasons.push("Long subdomain chain");
    score += 15;
  }
  if (hostname.length > 50) {
    reasons.push("Very long hostname");
    score += 12;
  }
  if (/[0-9]{5,}/.test(url)) {
    reasons.push("Long digit sequences in URL");
    score += 8;
  }
  if (/[\-_.]{3,}/.test(hostname)) {
    reasons.push("Repeated separators in hostname");
    score += 10;
  }
  if (/[\p{Cc}\p{Cs}]/u.test(url)) {
    reasons.push("Control/surrogate characters");
    score += 15;
  }
  if (/[\u0400-\u04FF]/.test(hostname) && /[a-zA-Z]/.test(hostname)) {
    reasons.push("Mixed script hostname (possible homograph)");
    score += 35;
  }

  // 3) Enhanced typosquatting and brand impersonation
  const brandWords = [
    "apple", "google", "microsoft", "paypal", "amazon", "facebook", "twitter", "instagram", 
    "linkedin", "netflix", "spotify", "dropbox", "onedrive", "bank", "login", "secure", 
    "wallet", "crypto", "bitcoin", "ethereum", "coinbase", "binance", "kraken", "robinhood",
    "chase", "wells", "bankofamerica", "citibank", "usbank", "pnc", "capitalone"
  ];
  
  for (const brand of brandWords) {
    if (asciiHostname.includes(brand) && !isLegitimateDomain(asciiHostname, brand)) {
      reasons.push(`Brand keyword in suspicious domain: ${brand}`);
      score += 20;
    }
  }

  // 4) Protocol and security checks
  if (u.protocol !== "https:") {
    reasons.push("Non-HTTPS protocol");
    score += 25;
  }

  // 5) URL shortening services (high risk)
  const shorteners = ['bit.ly', 'tinyurl.com', 'short.link', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'v.gd'];
  for (const shortener of shorteners) {
    if (hostname.includes(shortener)) {
      reasons.push(`URL shortening service: ${shortener}`);
      score += 30;
    }
  }

  // 6) Suspicious TLDs
  const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.click', '.download', '.exe', '.zip', '.rar'];
  for (const tld of suspiciousTlds) {
    if (hostname.endsWith(tld)) {
      reasons.push(`Suspicious TLD: ${tld}`);
      score += 25;
    }
  }

  // 7) IP address in URL (suspicious)
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
    reasons.push("IP address in hostname");
    score += 20;
  }

  // 8) Phishing-specific patterns
  const phishingPatterns = [
    /(?:secure|login|account|verify|update|confirm)\.(?:paypal|apple|google|microsoft|amazon|facebook|twitter|instagram|linkedin|netflix|spotify|dropbox|onedrive)\.(?:tk|ml|ga|cf|click|download)/i,
    /(?:www\.)?(?:paypal|apple|google|microsoft|amazon|facebook|twitter|instagram|linkedin|netflix|spotify|dropbox|onedrive)-?(?:secure|login|account|verify|update|confirm)\.(?:tk|ml|ga|cf|click|download)/i,
    /(?:secure|login|account|verify|update|confirm)-?(?:paypal|apple|google|microsoft|amazon|facebook|twitter|instagram|linkedin|netflix|spotify|dropbox|onedrive)\.(?:tk|ml|ga|cf|click|download)/i
  ];
  
  for (const pattern of phishingPatterns) {
    if (pattern.test(url)) {
      reasons.push("Phishing pattern detected");
      score += 40;
    }
  }

  // 9) Suspicious path patterns
  if (pathname.includes('login') || pathname.includes('signin') || pathname.includes('account')) {
    if (!isLegitimateDomain(hostname, 'login')) {
      reasons.push("Login page on suspicious domain");
      score += 15;
    }
  }

  // 10) Query parameter analysis
  const suspiciousParams = ['password', 'pin', 'ssn', 'credit', 'card', 'cvv', 'expiry'];
  for (const param of suspiciousParams) {
    if (searchParams.includes(param)) {
      reasons.push(`Suspicious parameter: ${param}`);
      score += 10;
    }
  }

  // 11) Domain age and registration (if available via WHOIS)
  // This would require additional WHOIS lookup service

  return score;
}

// Helper function to check if domain is legitimate
function isLegitimateDomain(hostname: string, brand: string): boolean {
  const legitimateDomains = [
    `${brand}.com`, `${brand}.net`, `${brand}.org`, `${brand}.co.uk`, 
    `www.${brand}.com`, `www.${brand}.net`, `www.${brand}.org`
  ];
  return legitimateDomains.some(domain => hostname.endsWith(domain));
}

async function externalIntelChecks(url: string, reasons: string[]): Promise<{ scoreDelta: number }> {
  let score = 0;
  const { safeBrowsingApiKey, virusTotalApiKey } = config;

  // Google Safe Browsing (v4)
  if (safeBrowsingApiKey) {
    try {
      const body = {
        client: { clientId: "phishing-detector", clientVersion: "0.1" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      };
      const resp = await axios.post(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${safeBrowsingApiKey}`,
        body,
        { timeout: 4000 }
      );
      if (resp.data && resp.data.matches && resp.data.matches.length > 0) {
        reasons.push("Google Safe Browsing hit");
        score += 60;
      }
    } catch (e) {
      reasons.push("Safe Browsing check failed (ignored)");
    }
  }

  // VirusTotal URL scan
  if (virusTotalApiKey) {
    try {
      const submit = await axios.post(
        "https://www.virustotal.com/api/v3/urls",
        new URLSearchParams({ url }).toString(),
        { headers: { "x-apikey": virusTotalApiKey, "content-type": "application/x-www-form-urlencoded" }, timeout: 4000 }
      );
      const id = submit.data?.data?.id;
      if (id) {
        const analysis = await axios.get(`https://www.virustotal.com/api/v3/analyses/${id}`,
          { headers: { "x-apikey": virusTotalApiKey }, timeout: 4000 });
        const stats = analysis.data?.data?.attributes?.stats;
        const malicious = Number(stats?.malicious || 0) + Number(stats?.suspicious || 0);
        if (malicious > 0) {
          reasons.push(`VirusTotal detections: ${malicious}`);
          score += Math.min(40, malicious * 5);
        }
      }
    } catch (e) {
      reasons.push("VirusTotal check failed (ignored)");
    }
  }

  return { scoreDelta: score };
}


