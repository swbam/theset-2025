import type { PlatformIdentifier } from './sync';

export interface Venue {
  id: string;
  name: string;
  metadata?: Record<string, any>;
  created_at?: string;
  platform_identifiers?: PlatformIdentifier[];
}
