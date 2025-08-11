const API_BASE_DEFAULT = "http://localhost:4000";

// Get API base from storage (Firefox Promise style)
async function getApiBase() {
  try {
    const items = await browser.storage.sync.get({ apiBase: API_BASE_DEFAULT });
    return items.apiBase || API_BASE_DEFAULT;
  } catch (e) {
    return API_BASE_DEFAULT;
  }
}

// Helper to get the action API (browserAction for MV2, action for MV3)
function getActionApi() {
  return browser.browserAction || browser.action;
}

// Scan the current tab
async function scanCurrentTab(tabId) {
  const apiBase = await getApiBase();
  try {
    const tab = await browser.tabs.get(tabId);
    if (!tab.url || !/^https?:/i.test(tab.url)) return;

    const res = await fetch(`${apiBase}/scan-url`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: tab.url })
    });

    const json = await res.json();
    const actionApi = getActionApi();

    if (json.verdict === 'unsafe') {
      browser.tabs.update(tabId, {
        url: browser.runtime.getURL(`block.html?u=${encodeURIComponent(tab.url)}&score=${json.score}`)
      });
    } else if (json.verdict === 'suspicious') {
      actionApi.setBadgeText({ tabId, text: '!' });
      actionApi.setBadgeBackgroundColor({ color: '#FFA500' });
    } else {
      actionApi.setBadgeText({ tabId, text: '' });
    }
  } catch (e) {
    // Ignore errors
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

// Listen for tab updates
browser.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  if (changeInfo.status === 'complete') {
    scanCurrentTab(tabId);
  }
});

// Listen for tab activation
browser.tabs.onActivated.addListener((activeInfo) => {
  scanCurrentTab(activeInfo.tabId);
});

// Initial scan on install
browser.runtime.onInstalled.addListener(() => {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (tabs && tabs[0] && tabs[0].id) scanCurrentTab(tabs[0].id);
  });
});
