"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanUrl = scanUrl;
const db_1 = require("../lib/db");
const punycode_1 = __importDefault(require("punycode"));
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../lib/config");
async function scanUrl(inputUrl) {
    const normalizedUrl = normalizeUrl(inputUrl);
    const reasons = [];
    let score = 0;
    const matchedThreatIds = [];
    // Rule-based checks
    const ruleScore = await ruleBasedChecks(normalizedUrl, matchedThreatIds, reasons);
    score += ruleScore;
    // External Intel
    const intel = await externalIntelChecks(normalizedUrl, reasons);
    score += intel.scoreDelta;
    // Optional ML hook (placeholder)
    // const ml = await mlPrediction(normalizedUrl); score += ml.scoreDelta; reasons.push(...ml.reasons);
    // Clamp score
    score = Math.max(0, Math.min(100, score));
    let verdict = "safe";
    if (score >= 70)
        verdict = "unsafe";
    else if (score >= 35)
        verdict = "suspicious";
    return { verdict, score, reasons, matchedThreatIds: matchedThreatIds.length ? matchedThreatIds : undefined };
}
function normalizeUrl(url) {
    try {
        const u = new URL(url);
        u.hash = "";
        return u.toString();
    }
    catch {
        return url;
    }
}
async function ruleBasedChecks(url, matchedThreatIds, reasons) {
    let score = 0;
    const u = new URL(url);
    const hostname = u.hostname;
    const asciiHostname = punycode_1.default.toASCII(hostname);
    // 1) Threat DB direct match
    const threats = await db_1.prisma.threatEntry.findMany();
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
    // 2) Suspicious patterns
    if (hostname.split(".").length > 4) {
        reasons.push("Long subdomain chain");
        score += 10;
    }
    if (hostname.length > 50) {
        reasons.push("Very long hostname");
        score += 8;
    }
    if (/[0-9]{5,}/.test(url)) {
        reasons.push("Long digit sequences in URL");
        score += 5;
    }
    if (/[\-_.]{3,}/.test(hostname)) {
        reasons.push("Repeated separators in hostname");
        score += 6;
    }
    if (/[\p{Cc}\p{Cs}]/u.test(url)) {
        reasons.push("Control/surrogate characters");
        score += 10;
    }
    if (/[\u0400-\u04FF]/.test(hostname) && /[a-zA-Z]/.test(hostname)) {
        reasons.push("Mixed script hostname (possible homograph)");
        score += 25;
    }
    // 3) Typosquatting heuristics
    const brandWords = ["apple", "google", "microsoft", "paypal", "bank", "login", "secure", "wallet"];
    for (const brand of brandWords) {
        if (asciiHostname.includes(brand) && !asciiHostname.endsWith(`${brand}.com`) && !asciiHostname.endsWith(`${brand}.net`)) {
            reasons.push(`Brand keyword present: ${brand}`);
            score += 12;
        }
    }
    // 4) Protocol check
    if (u.protocol !== "https:") {
        reasons.push("Non-HTTPS protocol");
        score += 20;
    }
    return score;
}
async function externalIntelChecks(url, reasons) {
    let score = 0;
    const { safeBrowsingApiKey, virusTotalApiKey } = config_1.config;
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
            const resp = await axios_1.default.post(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${safeBrowsingApiKey}`, body, { timeout: 4000 });
            if (resp.data && resp.data.matches && resp.data.matches.length > 0) {
                reasons.push("Google Safe Browsing hit");
                score += 60;
            }
        }
        catch (e) {
            reasons.push("Safe Browsing check failed (ignored)");
        }
    }
    // VirusTotal URL scan
    if (virusTotalApiKey) {
        try {
            const submit = await axios_1.default.post("https://www.virustotal.com/api/v3/urls", new URLSearchParams({ url }).toString(), { headers: { "x-apikey": virusTotalApiKey, "content-type": "application/x-www-form-urlencoded" }, timeout: 4000 });
            const id = submit.data?.data?.id;
            if (id) {
                const analysis = await axios_1.default.get(`https://www.virustotal.com/api/v3/analyses/${id}`, { headers: { "x-apikey": virusTotalApiKey }, timeout: 4000 });
                const stats = analysis.data?.data?.attributes?.stats;
                const malicious = Number(stats?.malicious || 0) + Number(stats?.suspicious || 0);
                if (malicious > 0) {
                    reasons.push(`VirusTotal detections: ${malicious}`);
                    score += Math.min(40, malicious * 5);
                }
            }
        }
        catch (e) {
            reasons.push("VirusTotal check failed (ignored)");
        }
    }
    return { scoreDelta: score };
}
