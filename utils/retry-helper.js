// Retry helper with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
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
                         error.message.includes('too many requests');
      
      if (isRateLimit) {
        // Longer delay for rate limits
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 5000;
        console.log(`Rate limit hit, waiting ${Math.round(delay)}ms before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Shorter delay for other errors
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 2000;
        console.log(`Error occurred, waiting ${Math.round(delay)}ms before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

module.exports = { retryWithBackoff }; 