
export const RATE_LIMIT = 5; // requests per second
export const QUEUE: Array<() => Promise<Response>> = [];
let processingQueue = false;
let lastRequestTime = 0;

export async function processQueue() {
  if (processingQueue || QUEUE.length === 0) return;
  
  processingQueue = true;
  while (QUEUE.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    // Ensure minimum 200ms between requests (5 requests per second)
    if (timeSinceLastRequest < 200) {
      await new Promise(resolve => setTimeout(resolve, 200 - timeSinceLastRequest));
    }
    
    const request = QUEUE.shift();
    if (request) {
      lastRequestTime = Date.now();
      await request();
    }
  }
  processingQueue = false;
}
