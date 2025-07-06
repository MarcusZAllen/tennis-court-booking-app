// Retry helper with exponential backoff and rate limit handling
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Check if it's a rate limit or temporary error
      const isRateLimit = error.message.includes('rate limit') || 
                         error.message.includes('429') ||
                         error.message.includes('too many requests') ||
                         error.message.includes('Rate limit exceeded');
      
      if (isRateLimit) {
        // Longer delay for rate limits with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 10000;
        console.log(`🚫 Rate limit hit, waiting ${Math.round(delay)}ms before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Shorter delay for other errors with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 3000;
        console.log(`⚠️ Error occurred, waiting ${Math.round(delay)}ms before retry ${attempt}/${maxRetries}: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// Rate limiter utility to control request frequency
export class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) { // 10 requests per minute by default
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async waitForSlot() {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    // If we're at the limit, wait until we can make another request
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest) + 1000; // Add 1 second buffer
      console.log(`⏳ Rate limiter: Waiting ${Math.round(waitTime)}ms before next request...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Add current request
    this.requests.push(now);
  }
}

// Request throttler for more granular control
export function throttle(fn, delay = 1000) {
  let lastCall = 0;
  return async function(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall < delay) {
      const waitTime = delay - timeSinceLastCall;
      console.log(`⏳ Throttling: Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastCall = Date.now();
    return fn.apply(this, args);
  };
} 