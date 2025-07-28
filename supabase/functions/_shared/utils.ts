// Enterprise-grade utility functions for TheSet sync system

import type { 
  RateLimitConfig, 
  CircuitBreakerState, 
  SyncJobConfig,
  HealthCheckResult,
  ApiResponse 
} from './types.ts';

// Advanced Rate Limiter with Token Bucket Algorithm
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.tokens = config.maxRequests;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refillTokens();
    
    if (this.tokens < 1) {
      const waitTime = this.config.windowMs / this.config.maxRequests;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }
    
    this.tokens--;
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / this.config.windowMs) * this.config.maxRequests;
    
    this.tokens = Math.min(this.config.maxRequests, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refillTokens();
    return Math.floor(this.tokens);
  }
}

// Circuit Breaker Pattern for Fault Tolerance
export class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED'
  };
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeMs: number = 60000,
    private monitoringPeriodMs: number = 10000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.state === 'OPEN') {
      if (Date.now() - this.state.lastFailureTime > this.recoveryTimeMs) {
        this.state.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.state.failures = 0;
    this.state.state = 'CLOSED';
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    
    if (this.state.failures >= this.failureThreshold) {
      this.state.state = 'OPEN';
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }
}

// Exponential Backoff with Jitter
export class RetryHandler {
  constructor(
    private maxRetries: number = 3,
    private baseDelayMs: number = 1000,
    private maxDelayMs: number = 30000
  ) {}

  async execute<T>(
    operation: () => Promise<T>,
    retryCondition?: (error: any) => boolean
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          break;
        }
        
        if (retryCondition && !retryCondition(error)) {
          break;
        }
        
        const delay = this.calculateDelay(attempt);
        console.log(`Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(this.maxDelayMs, exponentialDelay + jitter);
  }
}

// Advanced Batch Processor with Concurrency Control
export class BatchProcessor<T, R> {
  constructor(private config: SyncJobConfig) {}

  async processBatch(
    items: T[],
    processor: (item: T) => Promise<R>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<Array<{ item: T; result?: R; error?: any }>> {
    const results: Array<{ item: T; result?: R; error?: any }> = [];
    const batches = this.createBatches(items);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await processor(item);
          return { item, result };
        } catch (error) {
          return { item, error };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      if (onProgress) {
        onProgress(results.length, items.length);
      }
      
      // Small delay between batches to prevent overwhelming the system
      if (results.length < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  private createBatches<T>(items: T[]): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += this.config.batchSize) {
      batches.push(items.slice(i, i + this.config.batchSize));
    }
    return batches;
  }
}

// Performance Monitor for Tracking Execution Metrics
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTimer(operation: string): () => number {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration);
      return duration;
    };
  }

  recordMetric(operation: string, value: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const values = this.metrics.get(operation)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getStats(operation: string): { avg: number; min: number; max: number; count: number } {
    const values = this.metrics.get(operation) || [];
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const allStats: Record<string, ReturnType<typeof this.getStats>> = {};
    for (const [operation] of this.metrics) {
      allStats[operation] = this.getStats(operation);
    }
    return allStats;
  }
}

// Health Check System
export class HealthChecker {
  async checkHealth(url: string, timeoutMs: number = 5000): Promise<HealthCheckResult> {
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        signal: controller.signal,
        method: 'HEAD'
      });
      
      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;
      
      return {
        service: url,
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        service: url,
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString()
      };
    }
  }
}

// Enhanced Logging System
export class Logger {
  private static instance: Logger;
  private context: string = '';

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setContext(context: string): Logger {
    this.context = context;
    return this;
  }

  info(message: string, data?: unknown): void {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('WARN', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('ERROR', message, data);
  }

  debug(message: string, data?: unknown): void {
    this.log('DEBUG', message, data);
  }

  private log(level: string, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const contextStr = this.context ? `[${this.context}] ` : '';
    const logMessage = `${timestamp} ${level} ${contextStr}${message}`;
    
    console.log(logMessage);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// Utility Functions
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const err = error as any; // Safe cast after type check
  
  // Network errors
  if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
    return true;
  }
  
  // HTTP errors that are retryable
  if (err.status >= 500 || err.status === 429) {
    return true;
  }
  
  return false;
}

export function sanitizeErrorForLogging(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  return error;
}

export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  metadata?: any
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    timestamp: new Date().toISOString(),
    ...metadata
  };
}

export function extractSpotifyId(url: string): string | null {
  const match = url.match(/spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function normalizeArtistName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}