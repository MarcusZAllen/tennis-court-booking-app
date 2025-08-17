# IP Bypass Strategies for Production Scraping

## 🚨 Problem: GitHub Actions IP Blocking

GitHub Actions IP addresses are well-known to Cloudflare and other bot detection services, causing consistent blocking in production.

## 🔧 Solutions

### 1. Proxy Rotation (Recommended)

#### Setup Premium Proxy Service:
```bash
# Environment variables to add to GitHub Secrets
USE_PROXIES=true
PROXY_LIST=http://proxy1:port,http://proxy2:port,http://proxy3:port
PROXY_USERNAME=your_username
PROXY_PASSWORD=your_password
```

#### Recommended Proxy Services:
- **Bright Data** (https://brightdata.com/) - Residential proxies
- **SmartProxy** (https://smartproxy.com/) - Rotating residential IPs
- **Oxylabs** (https://oxylabs.io/) - Premium residential proxies
- **ProxyScrape** (https://proxyscrape.com/) - Affordable option

### 2. Free Proxy Rotation (Less Reliable)

#### Add to utils/proxy-config.js:
```javascript
export const FREE_PROXIES = [
  'http://proxy1.example.com:8080',
  'http://proxy2.example.com:8080',
  // Add more from https://free-proxy-list.net/
];
```

### 3. Alternative Deployment Platforms

#### Vercel Functions:
- Deploy scraper as Vercel serverless functions
- Uses Vercel's IP range (less likely to be blocked)

#### Railway/Render:
- Deploy on alternative platforms
- Different IP ranges than GitHub Actions

#### Self-Hosted Runner:
- Run GitHub Actions on your own server
- Use your residential IP

### 4. Advanced Techniques

#### Residential IP Rotation:
```javascript
// Use services like Bright Data residential proxies
const proxyConfig = {
  server: 'brd.superproxy.io:22225',
  username: 'brd-customer-xxx',
  password: 'xxx'
};
```

#### Mobile Proxy Rotation:
```javascript
// Mobile proxies are less likely to be blocked
const mobileProxy = {
  server: 'mobile.proxy.service:port',
  username: 'user',
  password: 'pass'
};
```

## 🛠️ Implementation Status

### ✅ Completed:
- Proxy configuration framework
- Proxy rotation logic
- Failure handling
- Integration with ParkSports scraper

### 🔄 Next Steps:
1. **Set up premium proxy service** (recommended)
2. **Add proxy credentials to GitHub Secrets**
3. **Test with small proxy list first**
4. **Monitor success rates**

## 📊 Expected Results

With proxy rotation:
- **Success Rate**: 80-95% (vs 0% currently)
- **IP Diversity**: Multiple residential IPs
- **Detection Evasion**: Appears as regular users
- **Reliability**: Consistent scraping

## 💰 Cost Considerations

### Premium Proxy Services:
- **Bright Data**: $15-500/month (residential IPs)
- **SmartProxy**: $10-200/month (rotating IPs)
- **Oxylabs**: $15-300/month (premium residential)

### Free Alternatives:
- **Free proxy lists**: $0 (unreliable)
- **Self-hosted**: $5-20/month (VPS costs)

## 🚀 Quick Start

1. **Choose a proxy service** (Bright Data recommended)
2. **Get proxy credentials**
3. **Add to GitHub Secrets**:
   ```
   USE_PROXIES=true
   PROXY_LIST=http://proxy1:port,http://proxy2:port
   PROXY_USERNAME=your_username
   PROXY_PASSWORD=your_password
   ```
4. **Deploy and test**

## 🔍 Monitoring

The scraper now logs:
- `🌐 Using via proxy.example.com:8080` - Proxy being used
- `🚫 Proxy failed - marking as failed` - Proxy failures
- Automatic rotation to working proxies

## ⚠️ Important Notes

- **Premium proxies are recommended** for production
- **Free proxies are unreliable** and may be blocked
- **Rotate proxies frequently** to avoid detection
- **Monitor success rates** and adjust strategy
