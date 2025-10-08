const API_BASE_DEFAULT = "http://localhost:4000";

// Local cache for instant blocking
const urlCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BLOCKED_DOMAINS = new Set([
  // Common phishing patterns - instant block
  'bit.ly', 'tinyurl.com', 'short.link', 't.co', 'goo.gl',
  // Suspicious TLDs
  '.tk', '.ml', '.ga', '.cf', '.click', '.download', '.exe'
]);

// Enhanced local detection rules
const PHISHING_PATTERNS = [
  /(?:secure|login|account|verify|update|confirm)\.(?:paypal|apple|google|microsoft|amazon|facebook|twitter|instagram|linkedin|netflix|spotify|dropbox|onedrive)\.(?:tk|ml|ga|cf|click|download)/i,
  /(?:www\.)?(?:paypal|apple|google|microsoft|amazon|facebook|twitter|instagram|linkedin|netflix|spotify|dropbox|onedrive)-?(?:secure|login|account|verify|update|confirm)\.(?:tk|ml|ga|cf|click|download)/i,
  /(?:secure|login|account|verify|update|confirm)-?(?:paypal|apple|google|microsoft|amazon|facebook|twitter|instagram|linkedin|netflix|spotify|dropbox|onedrive)\.(?:tk|ml|ga|cf|click|download)/i,
  /(?:bit\.ly|tinyurl\.com|short\.link|t\.co|goo\.gl)\/[a-zA-Z0-9]+/i,
  /(?:[0-9]{1,3}\.){3}[0-9]{1,3}/, // IP addresses
  /[a-zA-Z0-9-]+\.(?:tk|ml|ga|cf|click|download|exe|zip|rar|pdf|doc|docx)\.(?:tk|ml|ga|cf|click|download)/i
];

// Get API base from storage (Firefox Promise style)
async function getApiBase() {
  try {
    const items = await browser.storage.sync.get({ apiBase: API_BASE_DEFAULT });
    return items.apiBase || API_BASE_DEFAULT;
  } catch (e) {
    return API_BASE_DEFAULT;
  }
}

// Instant local URL analysis
function analyzeUrlLocally(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check blocked domains
    for (const domain of BLOCKED_DOMAINS) {
      if (hostname.includes(domain)) {
        return { verdict: 'unsafe', score: 90, reasons: [`Blocked domain: ${domain}`] };
      }
    }
    
    // Check phishing patterns
    for (const pattern of PHISHING_PATTERNS) {
      if (pattern.test(url)) {
        return { verdict: 'unsafe', score: 85, reasons: ['Suspicious URL pattern detected'] };
      }
    }
    
    // Check for suspicious characteristics
    const reasons = [];
    let score = 0;
    
    // Long subdomain chain
    if (hostname.split('.').length > 4) {
      reasons.push('Long subdomain chain');
      score += 15;
    }
    
    // Very long hostname
    if (hostname.length > 50) {
      reasons.push('Very long hostname');
      score += 10;
    }
    
    // Repeated separators
    if (/[\-_.]{3,}/.test(hostname)) {
      reasons.push('Repeated separators in hostname');
      score += 12;
    }
    
    // Mixed scripts (homograph attack)
    if (/[\u0400-\u04FF]/.test(hostname) && /[a-zA-Z]/.test(hostname)) {
      reasons.push('Mixed script hostname (possible homograph)');
      score += 30;
    }
    
    // Non-HTTPS
    if (urlObj.protocol !== 'https:') {
      reasons.push('Non-HTTPS protocol');
      score += 20;
    }
    
    // Brand keywords in suspicious domains
    const brandWords = ['paypal', 'apple', 'google', 'microsoft', 'amazon', 'facebook', 'twitter', 'instagram', 'linkedin', 'netflix', 'spotify', 'dropbox', 'onedrive'];
    for (const brand of brandWords) {
      if (hostname.includes(brand) && !hostname.endsWith(`${brand}.com`) && !hostname.endsWith(`${brand}.net`) && !hostname.endsWith(`${brand}.org`)) {
        reasons.push(`Brand keyword in suspicious domain: ${brand}`);
        score += 25;
      }
    }
    
    if (score >= 70) return { verdict: 'unsafe', score, reasons };
    if (score >= 35) return { verdict: 'suspicious', score, reasons };
    return { verdict: 'safe', score, reasons };
    
  } catch (e) {
    return { verdict: 'suspicious', score: 50, reasons: ['Invalid URL format'] };
  }
}

// Check cache first
function getCachedResult(url) {
  const cached = urlCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }
  return null;
}

// Cache result
function cacheResult(url, result) {
  urlCache.set(url, { result, timestamp: Date.now() });
}

// Helper to get the action API (browserAction for MV2, action for MV3)
function getActionApi() {
  return browser.browserAction || browser.action;
}

// Instant scan with local analysis and caching
async function scanCurrentTab(tabId) {
  try {
    const tab = await browser.tabs.get(tabId);
    if (!tab.url || !/^https?:/i.test(tab.url)) return;

    const url = tab.url;
    const actionApi = getActionApi();

    // 1. Check cache first (instant)
    let result = getCachedResult(url);
    
    // 2. If not cached, do instant local analysis
    if (!result) {
      result = analyzeUrlLocally(url);
      cacheResult(url, result);
    }

    // 3. Handle result immediately
    if (result.verdict === 'unsafe') {
      // INSTANT BLOCK - no network delay
      browser.tabs.update(tabId, {
        url: browser.runtime.getURL(`block.html?u=${encodeURIComponent(url)}&score=${result.score}&reasons=${encodeURIComponent(JSON.stringify(result.reasons))}`)
      });
      return; // Exit early for unsafe URLs
    } else if (result.verdict === 'suspicious') {
      actionApi.setBadgeText({ tabId, text: '!' });
      actionApi.setBadgeBackgroundColor({ color: '#FFA500' });
    } else {
      actionApi.setBadgeText({ tabId, text: '' });
    }

    // 4. For safe/suspicious URLs, do background server check (non-blocking)
    if (result.verdict === 'safe' || result.verdict === 'suspicious') {
      performBackgroundServerCheck(url, tabId, actionApi);
    }

  } catch (e) {
    console.error('Scan error:', e);
  }
}

// Background server check (non-blocking)
async function performBackgroundServerCheck(url, tabId, actionApi) {
  try {
    const apiBase = await getApiBase();
    const res = await fetch(`${apiBase}/scan-url`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const json = await res.json();
    
    // Update cache with server result
    cacheResult(url, json);

    // Only update UI if server result is more severe
    if (json.verdict === 'unsafe' && getCachedResult(url)?.verdict !== 'unsafe') {
      browser.tabs.update(tabId, {
        url: browser.runtime.getURL(`block.html?u=${encodeURIComponent(url)}&score=${json.score}&reasons=${encodeURIComponent(JSON.stringify(json.reasons))}`)
      });
    } else if (json.verdict === 'suspicious') {
      actionApi.setBadgeText({ tabId, text: '!' });
      actionApi.setBadgeBackgroundColor({ color: '#FFA500' });
    }
  } catch (e) {
    // Server check failed - local analysis result stands
    console.warn('Server check failed:', e);
  }
}

// Create context menu on install
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: 'scan-link',
    title: 'Scan this link',
    contexts: ['link']
  });
});

// Handle context menu click
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'scan-link' && info.linkUrl) {
    const apiBase = await getApiBase();
    try {
      const res = await fetch(`${apiBase}/scan-url`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: info.linkUrl })
      });

      const json = await res.json();
      const actionApi = getActionApi();

      if (json.verdict === 'unsafe') {
        browser.tabs.create({
          url: browser.runtime.getURL(`block.html?u=${encodeURIComponent(info.linkUrl)}&score=${json.score}`)
        });
      } else if (json.verdict === 'suspicious') {
        if (tab && tab.id) {
          actionApi.setBadgeText({ tabId: tab.id, text: '!' });
          actionApi.setBadgeBackgroundColor({ color: '#FFA500' });
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
});

// Listen for tab updates - INSTANT scanning on URL change
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Scan immediately when URL changes (before page loads)
  if (changeInfo.url && changeInfo.url !== 'about:blank') {
    scanCurrentTab(tabId);
  }
  // Also scan when page completes loading (fallback)
  else if (changeInfo.status === 'complete') {
    scanCurrentTab(tabId);
  }
});

// Listen for tab activation
browser.tabs.onActivated.addListener((activeInfo) => {
  scanCurrentTab(activeInfo.tabId);
});

// Listen for navigation events (beforeunload equivalent)
browser.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) { // Main frame only
    scanCurrentTab(details.tabId);
  }
});

// Initial scan on install
browser.runtime.onInstalled.addListener(() => {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (tabs && tabs[0] && tabs[0].id) scanCurrentTab(tabs[0].id);
  });
});
