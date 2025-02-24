
export type Platform = 'spotify' | 'ticketmaster';

export interface PlatformData {
  platform: Platform;
  platformId: string;
  data?: Record<string, any>;
}
