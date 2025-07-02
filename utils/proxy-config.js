// Proxy configuration for IP rotation
// Note: You'll need to set up proxy services like Bright Data, SmartProxy, or similar

export const PROXY_CONFIG = {
  enabled: process.env.USE_PROXIES === 'true',
  proxies: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : [],
  currentIndex: 0
};

export function getNextProxy() {
  if (!PROXY_CONFIG.enabled || PROXY_CONFIG.proxies.length === 0) {
    return null;
  }
  
  const proxy = PROXY_CONFIG.proxies[PROXY_CONFIG.currentIndex];
  PROXY_CONFIG.currentIndex = (PROXY_CONFIG.currentIndex + 1) % PROXY_CONFIG.proxies.length;
  
  return proxy;
}

export function getProxyArgs() {
  const proxy = getNextProxy();
  if (!proxy) return {};
  
  return {
    proxy: {
      server: proxy,
      // Add authentication if needed
      // username: process.env.PROXY_USERNAME,
      // password: process.env.PROXY_PASSWORD
    }
  };
} 