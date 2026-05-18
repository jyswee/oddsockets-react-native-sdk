/**
 * Configuration options for OddSockets client
 */
export interface OddSocketsConfig {
  /** Your OddSockets API key */
  apiKey: string;
  /** User ID (defaults to API key's user) */
  userId?: string;
  /** Additional connection options */
  options?: {
    /** Custom timeout for connections */
    timeout?: number;
    /** Custom transports to use */
    transports?: string[];
    /** Whether to auto-connect on instantiation */
    autoConnect?: boolean;
    /** Custom reconnection settings */
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    [key: string]: any;
  };
  /** Whether to auto-connect (defaults to true) */
  autoConnect?: boolean;
}

/**
 * Message data structure
 */
export interface MessageData {
  /** Channel name */
  channel: string;
  /** Message content */
  message: any;
  /** Message timestamp */
  timestamp: string;
  /** Message ID */
  messageId: string;
  /** Publisher information */
  publisher?: {
    userId: string;
    [key: string]: any;
  };
  /** Message metadata */
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Channel subscription options
 */
export interface SubscriptionOptions {
  /** Maximum history messages to retain */
  maxHistory?: number;
  /** Whether to retain message history */
  retainHistory?: boolean;
  /** Whether to enable presence tracking */
  enablePresence?: boolean;
  /** Additional subscription options */
  [key: string]: any;
}

/**
 * Publishing options
 */
export interface PublishOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Additional message metadata */
  metadata?: {
    [key: string]: any;
  };
  /** Store message in history */
  storeInHistory?: boolean;
  /** Additional publishing options */
  [key: string]: any;
}

/**
 * History request options
 */
export interface HistoryOptions {
  /** Number of messages to retrieve */
  count?: number;
  /** Start time (ISO string) */
  start?: string;
  /** End time (ISO string) */
  end?: string;
  /** Include message metadata */
  includeMetadata?: boolean;
}

/**
 * Presence information
 */
export interface PresenceInfo {
  /** Channel name */
  channel: string;
  /** Number of occupants */
  occupancy: number;
  /** List of occupants */
  occupants: Array<{
    userId: string;
    state?: any;
    joinedAt: string;
    [key: string]: any;
  }>;
}

/**
 * Presence change event
 */
export interface PresenceChangeEvent {
  /** Action type */
  action: 'join' | 'leave' | 'state_change';
  /** Channel name */
  channel: string;
  /** User information */
  user: {
    userId: string;
    state?: any;
    [key: string]: any;
  };
  /** Timestamp */
  timestamp: string;
}

/**
 * Connection states
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * Worker assignment information
 */
export interface WorkerInfo {
  /** Worker ID */
  workerId: string;
  /** Worker URL */
  workerUrl: string;
  /** Session information */
  session?: any;
  /** Client identifier */
  clientIdentifier?: string;
  /** Manager URL used for assignment */
  managerUrl?: string;
}

/**
 * Reconnection event data
 */
export interface ReconnectionEvent {
  /** Current attempt number */
  attempt: number;
  /** Maximum attempts allowed */
  maxAttempts: number;
  /** Delay before next attempt */
  delay: number;
}

/**
 * Bulk publish message structure
 */
export interface BulkMessage {
  /** Channel name */
  channel: string;
  /** Message content */
  message: any;
  /** Publishing options */
  options?: PublishOptions;
}

/**
 * Bulk publish result
 */
export interface BulkPublishResult {
  /** Whether the publish was successful */
  success: boolean;
  /** Result data if successful */
  result?: any;
  /** Error message if failed */
  error?: string;
}

/**
 * Message size limits
 */
export const MESSAGE_SIZE_LIMITS = {
  MAX_MESSAGE_SIZE: 32768, // 32KB in bytes
  MAX_MESSAGE_SIZE_KB: 32
} as const;

/**
 * Event types emitted by OddSockets client
 */
export interface OddSocketsEvents {
  connecting: () => void;
  connected: () => void;
  disconnected: (reason?: string) => void;
  reconnecting: (event: ReconnectionEvent) => void;
  worker_assigned: (info: WorkerInfo) => void;
  max_reconnect_attempts_reached: () => void;
  error: (error: Error) => void;
}

/**
 * Event types emitted by Channel
 */
export interface ChannelEvents {
  message: (data: MessageData) => void;
  subscribed: (data: any) => void;
  unsubscribed: (data: any) => void;
  published: (data: any) => void;
  presence: (data: PresenceInfo) => void;
  presence_change: (data: PresenceChangeEvent) => void;
  history: (data: any) => void;
}
