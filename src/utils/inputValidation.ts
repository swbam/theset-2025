// Input validation utilities for security

/**
 * Sanitize search input to prevent XSS and injection attacks
 */
export const sanitizeSearchInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove HTML tags and dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 100); // Limit length
};

/**
 * Validate artist name input
 */
export const validateArtistName = (name: string): boolean => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const sanitized = sanitizeSearchInput(name);
  return sanitized.length > 0 && sanitized.length <= 100;
};

/**
 * Sanitize song name for display
 */
export const sanitizeSongName = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return 'Unknown Song';
  }
  
  return name
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
    .trim()
    .slice(0, 200); // Limit length
};

/**
 * Rate limiting for guest users (simple in-memory implementation)
 */
class GuestRateLimit {
  private requests = new Map<string, number[]>();
  private readonly maxRequests = 10;
  private readonly windowMs = 60000; // 1 minute

  isAllowed(ip: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(ip) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(ip, validRequests);
    
    return true;
  }
}

export const guestRateLimit = new GuestRateLimit();