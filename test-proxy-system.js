#!/usr/bin/env node

// Test script for the enhanced proxy system
import { 
  PROXY_CONFIG, 
  FREE_PROXIES, 
  testProxy, 
  healthCheckProxies, 
  getWorkingProxy,
  recordProxyResult 
} from './utils/proxy-config.js';

console.log('🧪 Testing Enhanced Proxy System');
console.log('================================');

// Initialize with free proxies
PROXY_CONFIG.proxies = FREE_PROXIES.slice(0, 5); // Test with first 5 proxies
console.log(`📋 Testing ${PROXY_CONFIG.proxies.length} proxies`);

async function testProxySystem() {
  console.log('\n🔍 Running proxy health check...');
  await healthCheckProxies();
  
  console.log('\n🌐 Testing individual proxies...');
  for (const proxy of PROXY_CONFIG.proxies.slice(0, 3)) {
    console.log(`\nTesting ${proxy}...`);
    const result = await testProxy(proxy, 5000);
    if (result.success) {
      console.log(`✅ ${proxy} - IP: ${result.ip}`);
      recordProxyResult(proxy, true);
    } else {
      console.log(`❌ ${proxy} - ${result.error}`);
      recordProxyResult(proxy, false);
    }
  }
  
  console.log('\n📊 Proxy Statistics:');
  for (const [proxy, stats] of PROXY_CONFIG.proxyStats) {
    const successRate = (stats.successes / (stats.successes + stats.failures) * 100).toFixed(1);
    console.log(`  ${proxy}: ${stats.successes}✅ ${stats.failures}❌ (${successRate}% success rate)`);
  }
  
  console.log('\n🏆 Best proxy:');
  const bestProxy = getWorkingProxy();
  if (bestProxy) {
    console.log(`  ${bestProxy}`);
  } else {
    console.log('  No working proxies found');
  }
  
  console.log('\n🚫 Failed proxies:');
  if (PROXY_CONFIG.failedProxies.size > 0) {
    for (const proxy of PROXY_CONFIG.failedProxies) {
      console.log(`  ${proxy}`);
    }
  } else {
    console.log('  None');
  }
}

testProxySystem().catch(console.error);
