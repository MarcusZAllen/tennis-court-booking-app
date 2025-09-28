// Enhanced proxy configuration for IP rotation and Cloudflare bypass
// Supports both free and premium proxy services

export const PROXY_CONFIG = {
  enabled: false, // Will be set dynamically
  proxies: [],
  currentIndex: 0,
  failedProxies: new Set(),
  proxyStats: new Map(), // Track success/failure rates
  maxFailures: 3, // Max failures before marking proxy as bad
  healthCheckInterval: 300000, // 5 minutes
  lastHealthCheck: 0
};

// Initialize proxy configuration dynamically
function initializeProxyConfig() {
  PROXY_CONFIG.enabled = process.env.USE_PROXIES === 'true' || process.env.NODE_ENV === 'production';
  PROXY_CONFIG.proxies = process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : [];
  
  // Initialize with free proxies if no premium ones are configured
  if (PROXY_CONFIG.enabled && PROXY_CONFIG.proxies.length === 0) {
    console.log('⚠️ No premium proxies configured, using free proxy list (unreliable)');
    PROXY_CONFIG.proxies = [...FREE_PROXIES];
    console.log(`📋 Loaded ${PROXY_CONFIG.proxies.length} free proxies`);
  }
  
  console.log(`🔧 Proxy system initialized: enabled=${PROXY_CONFIG.enabled}, proxies=${PROXY_CONFIG.proxies.length}`);
}

export function getNextProxy() {
  // Initialize if not already done
  if (PROXY_CONFIG.proxies.length === 0) {
    initializeProxyConfig();
  }
  
  if (!PROXY_CONFIG.enabled || PROXY_CONFIG.proxies.length === 0) {
    return null;
  }
  
  // Use best proxy instead of round-robin
  return getBestProxy();
}

export function markProxyAsFailed(proxy) {
  if (proxy) {
    recordProxyResult(proxy, false);
  }
}

export function getWorkingProxy() {
  return getNextProxy();
}

// Enhanced proxy args with better error handling
export function getProxyArgs() {
  console.log(`🔧 Proxy system status: enabled=${PROXY_CONFIG.enabled}, proxies=${PROXY_CONFIG.proxies.length}, failed=${PROXY_CONFIG.failedProxies.size}`);
  
  const proxy = getWorkingProxy();
  if (!proxy) {
    console.log('⚠️ No working proxy available, using direct connection');
    return {};
  }
  
  console.log(`🌐 Using proxy: ${proxy}`);
  
  // Parse proxy URL
  const proxyUrl = new URL(proxy);
  const proxyConfig = {
    server: `${proxyUrl.protocol}//${proxyUrl.host}`
  };
  
  // Add authentication if provided
  if (proxyUrl.username && proxyUrl.password) {
    proxyConfig.username = proxyUrl.username;
    proxyConfig.password = proxyUrl.password;
  } else if (process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD) {
    proxyConfig.username = process.env.PROXY_USERNAME;
    proxyConfig.password = process.env.PROXY_PASSWORD;
  }
  
  return { proxy: proxyConfig };
}


// Comprehensive free proxy list (updated regularly)
export const FREE_PROXIES = [
  // HTTP Proxies
  'http://103.149.162.195:80',
  'http://103.149.162.194:80',
  'http://103.149.162.193:80',
  'http://103.149.162.192:80',
  'http://103.149.162.191:80',
  'http://185.162.251.76:80',
  'http://185.162.251.77:80',
  'http://185.162.251.78:80',
  'http://185.162.251.79:80',
  'http://185.162.251.80:80',
  'http://103.149.162.200:80',
  'http://103.149.162.201:80',
  'http://103.149.162.202:80',
  'http://103.149.162.203:80',
  'http://103.149.162.204:80',
  'http://185.162.251.81:80',
  'http://185.162.251.82:80',
  'http://185.162.251.83:80',
  'http://185.162.251.84:80',
  'http://185.162.251.85:80',
  // HTTPS Proxies
  'http://103.149.162.195:8080',
  'http://103.149.162.194:8080',
  'http://103.149.162.193:8080',
  'http://103.149.162.192:8080',
  'http://103.149.162.191:8080',
  'http://185.162.251.76:8080',
  'http://185.162.251.77:8080',
  'http://185.162.251.78:8080',
  'http://185.162.251.79:8080',
  'http://185.162.251.80:8080',
  // SOCKS Proxies
  'socks5://103.149.162.195:1080',
  'socks5://103.149.162.194:1080',
  'socks5://103.149.162.193:1080',
  'socks5://103.149.162.192:1080',
  'socks5://103.149.162.191:1080',
  'socks5://185.162.251.76:1080',
  'socks5://185.162.251.77:1080',
  'socks5://185.162.251.78:1080',
  'socks5://185.162.251.79:1080',
  'socks5://185.162.251.80:1080'
];

// Premium proxy services (recommended)
export const PROXY_SERVICES = {
  BRIGHT_DATA: 'https://brightdata.com/',
  SMART_PROXY: 'https://smartproxy.com/',
  OXYLABS: 'https://oxylabs.io/',
  PROXYSCRAPE: 'https://proxyscrape.com/',
  FREE_PROXY_LIST: 'https://free-proxy-list.net/'
};

// Enhanced proxy health checking
export async function testProxy(proxy, timeout = 10000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch('http://httpbin.org/ip', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Proxy ${proxy} working - IP: ${data.origin}`);
      return { success: true, ip: data.origin, responseTime: Date.now() };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`⏰ Proxy ${proxy} timeout after ${timeout}ms`);
    } else {
      console.log(`❌ Proxy ${proxy} failed: ${error.message}`);
    }
  }
  return { success: false, error: error?.message || 'Unknown error' };
}

// Track proxy performance
export function recordProxyResult(proxy, success) {
  if (!PROXY_CONFIG.proxyStats.has(proxy)) {
    PROXY_CONFIG.proxyStats.set(proxy, { successes: 0, failures: 0, lastUsed: 0 });
  }
  
  const stats = PROXY_CONFIG.proxyStats.get(proxy);
  if (success) {
    stats.successes++;
  } else {
    stats.failures++;
  }
  stats.lastUsed = Date.now();
  
  // Mark as failed if too many failures
  if (stats.failures >= PROXY_CONFIG.maxFailures) {
    PROXY_CONFIG.failedProxies.add(proxy);
    console.log(`🚫 Proxy ${proxy} marked as failed (${stats.failures} failures)`);
  }
}

// Get proxy with best performance
export function getBestProxy() {
  if (!PROXY_CONFIG.enabled || PROXY_CONFIG.proxies.length === 0) {
    return null;
  }
  
  // Filter out failed proxies
  const workingProxies = PROXY_CONFIG.proxies.filter(p => !PROXY_CONFIG.failedProxies.has(p));
  
  if (workingProxies.length === 0) {
    console.log('⚠️ All proxies failed, resetting failed list');
    PROXY_CONFIG.failedProxies.clear();
    return PROXY_CONFIG.proxies[0] || null;
  }
  
  // If no stats yet, return first working proxy
  if (PROXY_CONFIG.proxyStats.size === 0) {
    return workingProxies[0];
  }
  
  // Sort by success rate
  const sortedProxies = workingProxies.sort((a, b) => {
    const statsA = PROXY_CONFIG.proxyStats.get(a) || { successes: 0, failures: 0 };
    const statsB = PROXY_CONFIG.proxyStats.get(b) || { successes: 0, failures: 0 };
    
    const rateA = statsA.successes / (statsA.successes + statsA.failures) || 0;
    const rateB = statsB.successes / (statsB.successes + statsB.failures) || 0;
    
    return rateB - rateA;
  });
  
  return sortedProxies[0];
}

// Health check all proxies
export async function healthCheckProxies() {
  const now = Date.now();
  if (now - PROXY_CONFIG.lastHealthCheck < PROXY_CONFIG.healthCheckInterval) {
    return; // Skip if checked recently
  }
  
  console.log('🔍 Running proxy health check...');
  PROXY_CONFIG.lastHealthCheck = now;
  
  const proxiesToCheck = PROXY_CONFIG.proxies.slice(0, 10); // Check first 10 proxies
  const results = await Promise.allSettled(
    proxiesToCheck.map(proxy => testProxy(proxy, 5000))
  );
  
  let workingCount = 0;
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      workingCount++;
      recordProxyResult(proxiesToCheck[index], true);
    } else {
      recordProxyResult(proxiesToCheck[index], false);
    }
  });
  
  console.log(`📊 Health check complete: ${workingCount}/${proxiesToCheck.length} proxies working`);
}
