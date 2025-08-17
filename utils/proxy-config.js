// Proxy configuration for IP rotation
// Note: You'll need to set up proxy services like Bright Data, SmartProxy, or similar

export const PROXY_CONFIG = {
  enabled: process.env.USE_PROXIES === 'true',
  proxies: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : [],
  currentIndex: 0,
  failedProxies: new Set()
};

export function getNextProxy() {
  if (!PROXY_CONFIG.enabled || PROXY_CONFIG.proxies.length === 0) {
    return null;
  }
  
  // Skip failed proxies
  let attempts = 0;
  while (attempts < PROXY_CONFIG.proxies.length) {
    const proxy = PROXY_CONFIG.proxies[PROXY_CONFIG.currentIndex];
    PROXY_CONFIG.currentIndex = (PROXY_CONFIG.currentIndex + 1) % PROXY_CONFIG.proxies.length;
    
    if (!PROXY_CONFIG.failedProxies.has(proxy)) {
      return proxy;
    }
    attempts++;
  }
  
  // If all proxies failed, reset and try again
  PROXY_CONFIG.failedProxies.clear();
  return PROXY_CONFIG.proxies[0] || null;
}

export function markProxyAsFailed(proxy) {
  if (proxy) {
    PROXY_CONFIG.failedProxies.add(proxy);
  }
}

export function getWorkingProxy() {
  return getNextProxy();
}

export function getProxyArgs() {
  const proxy = getNextProxy();
  if (!proxy) return {};
  
  return {
    proxy: {
      server: proxy,
      // Add authentication if needed
      username: process.env.PROXY_USERNAME,
      password: process.env.PROXY_PASSWORD
    }
  };
}

// Free proxy list (use with caution - these may be unreliable)
export const FREE_PROXIES = [
  // Some free proxies (these may not work - for testing only)
  'http://103.149.162.195:80',
  'http://103.149.162.194:80',
  'http://103.149.162.193:80',
  'http://103.149.162.192:80',
  'http://103.149.162.191:80'
];

// Premium proxy services (recommended)
export const PROXY_SERVICES = {
  BRIGHT_DATA: 'https://brightdata.com/',
  SMART_PROXY: 'https://smartproxy.com/',
  OXYLABS: 'https://oxylabs.io/',
  PROXYSCRAPE: 'https://proxyscrape.com/',
  FREE_PROXY_LIST: 'https://free-proxy-list.net/'
};

// Function to test proxy connectivity
export async function testProxy(proxy) {
  try {
    const response = await fetch('http://httpbin.org/ip', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      // Note: This is a simplified test - in practice you'd use a proper proxy client
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Proxy ${proxy} working - IP: ${data.origin}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Proxy ${proxy} failed: ${error.message}`);
  }
  return false;
}

// Initialize with free proxies if no premium ones are configured
if (PROXY_CONFIG.enabled && PROXY_CONFIG.proxies.length === 0) {
  console.log('⚠️ No premium proxies configured, using free proxy list (unreliable)');
  PROXY_CONFIG.proxies = FREE_PROXIES;
} 