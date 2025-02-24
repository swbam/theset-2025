
import type { PlatformIdentifier } from "./sync";

export interface Artist {
  id: string;
  name: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  platform_identifiers?: PlatformIdentifier[];
}
