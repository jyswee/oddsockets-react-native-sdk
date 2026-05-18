import { EventEmitter } from 'eventemitter3';
import io, { Socket } from 'socket.io-client';
import Channel from './Channel';
import managerDiscovery from './ManagerDiscovery';
import { validateMessageSize } from './MessageSizeValidator';
import { EnhancedFeatures } from './EnhancedFeatures';
import {
  OddSocketsConfig,
  ConnectionState,
  WorkerInfo,
  ReconnectionEvent,
  BulkMessage,
  BulkPublishResult,
  OddSocketsEvents
} from './types';

/**
 * OddSockets React Native SDK
 * 
 * Provides a simple interface to the OddSockets real-time messaging platform.
 * Automatically handles manager discovery and Worker load balancing internally.
 */
class OddSockets extends EventEmitter<OddSocketsEvents> {
  private config: Required<Pick<OddSocketsConfig, 'apiKey'>> & Omit<OddSocketsConfig, 'apiKey'>;
  private socket: Socket | null = null;
  private workerUrl: string | null = null;
  private workerId: string | null = null;
  private channels: Map<string, Channel> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private clientIdentifier: string;
  private sessionInfo: any = null;
  
  /**
   * Enhanced features (67 new Slack-like events)
   */
  public enhanced: EnhancedFeatures;

  /**
   * Create an OddSockets client
   * @param config - Configuration options
   */
  constructor(config: OddSocketsConfig) {
    super();
    
    if (!config || !config.apiKey) {
      throw new Error('API key is required');
    }
    
    this.config = {
      apiKey: config.apiKey,
      userId: config.userId,
      options: config.options || {},
      autoConnect: config.autoConnect
    };
    
    this.clientIdentifier = this._generateClientIdentifier();
    
    // Initialize enhanced features (67 new Slack-like events)
    this.enhanced = new EnhancedFeatures(this);
    
    // Auto-connect by default
    if (config.autoConnect !== false) {
      this.connect();
    }
  }
  
  /**
   * Connect to the OddSockets platform
   * Handles the Manager → Worker assignment internally
   */
  async connect(): Promise<void> {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      return;
    }
    
    this.connectionState = 'connecting';
    this.emit('connecting');
    
    try {
      // Step 1: Get worker assignment from manager
      await this._getWorkerAssignment();
      
      // Step 2: Connect to assigned worker
      await this._connectToWorker();
      
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.emit('connected');
      
    } catch (error) {
      this.connectionState = 'disconnected';
      this.emit('error', error as Error);
      
      // Auto-reconnect with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this._scheduleReconnect();
      } else {
        this.emit('max_reconnect_attempts_reached');
      }
    }
  }
  
  /**
   * Disconnect from the platform
   */
  disconnect(): void {
    this.connectionState = 'disconnected';
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.workerUrl = null;
    this.workerId = null;
    this.emit('disconnected');
  }
  
  /**
   * Get or create a channel
   * @param channelName - Name of the channel
   * @returns Channel instance
   */
  channel(channelName: string): Channel {
    if (!channelName || typeof channelName !== 'string') {
      throw new Error('Channel name must be a non-empty string');
    }
    
    if (!this.channels.has(channelName)) {
      const channel = new Channel(channelName, this);
      this.channels.set(channelName, channel);
    }
    
    return this.channels.get(channelName)!;
  }
  
  /**
   * Get current connection state
   * @returns Connection state
   */
  getState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * Get assigned worker information
   * @returns Worker info or null
   */
  getWorkerInfo(): WorkerInfo | null {
    if (!this.workerId || !this.workerUrl) {
      return null;
    }
    
    return {
      workerId: this.workerId,
      workerUrl: this.workerUrl,
      session: this.sessionInfo,
      clientIdentifier: this.clientIdentifier
    };
  }
  
  /**
   * Publish multiple messages at once
   * @param messages - Array of message objects with {channel, message, options?} structure
   * @returns Array of publish results
   */
  async publishBulk(messages: BulkMessage[]): Promise<BulkPublishResult[]> {
    if (!Array.isArray(messages)) {
      throw new Error('Messages must be an array');
    }
    
    if (!this._isConnected()) {
      throw new Error('Not connected to OddSockets');
    }
    
    const results: BulkPublishResult[] = [];
    
    for (const msg of messages) {
      try {
        if (!msg.channel || msg.message === undefined) {
          results.push({
            success: false,
            error: 'Missing channel or message'
          });
          continue;
        }
        
        const channel = this.channel(msg.channel);
        const result = await channel.publish(msg.message, msg.options || {});
        results.push({
          success: true,
          result: result
        });
        
      } catch (error) {
        results.push({
          success: false,
          error: (error as Error).message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Internal: Get worker assignment from manager
   * @private
   */
  private async _getWorkerAssignment(): Promise<void> {
    try {
      // Discover the optimal manager URL automatically
      const managerUrl = await managerDiscovery.discoverManagerUrl(this.config.apiKey);
      
      // Use fetch API which is available in React Native
      const response = await fetch(`${managerUrl}/api/cluster/select-worker?` + new URLSearchParams({
        apiKey: this.config.apiKey,
        userId: this.config.userId || this.clientIdentifier,
        clientIdentifier: this.clientIdentifier
      }), {
        method: 'GET',
        headers: {
          'User-Agent': 'OddSockets-ReactNative-SDK/1.0.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.url) {
        throw new Error('Invalid worker assignment response');
      }
      
      this.workerUrl = data.url;
      this.workerId = data.workerId;
      this.sessionInfo = data.session;
      
      this.emit('worker_assigned', {
        workerId: this.workerId,
        workerUrl: this.workerUrl,
        session: this.sessionInfo,
        clientIdentifier: this.clientIdentifier,
        managerUrl: managerUrl // Include discovered manager URL for debugging
      });
      
    } catch (error) {
      // If manager is offline, try fallback logic
      if ((error as any).code === 'ECONNREFUSED' || (error as any).code === 'ENOTFOUND') {
        throw new Error('Manager is offline. Cannot assign worker without session stickiness.');
      }
      throw error;
    }
  }
  
  /**
   * Internal: Connect to assigned worker
   * @private
   */
  private async _connectToWorker(): Promise<void> {
    if (!this.workerUrl) {
      throw new Error('No worker URL available');
    }
    
    return new Promise((resolve, reject) => {
      const socketOptions = {
        auth: {
          apiKey: this.config.apiKey,
          userId: this.config.userId
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        ...this.config.options
      };
      
      this.socket = io(this.workerUrl, socketOptions);
      
      // Connection success
      this.socket.on('connect', () => {
        this._setupSocketEventHandlers();
        resolve();
      });
      
      // Connection error
      this.socket.on('connect_error', (error) => {
        reject(new Error(`Failed to connect to worker: ${error.message}`));
      });
      
      // Timeout fallback
      setTimeout(() => {
        if (this.connectionState === 'connecting') {
          reject(new Error('Connection timeout'));
        }
      }, 15000);
    });
  }
  
  /**
   * Internal: Setup socket event handlers
   * @private
   */
  private _setupSocketEventHandlers(): void {
    if (!this.socket) return;
    
    // Handle disconnection
    this.socket.on('disconnect', (reason) => {
      this.connectionState = 'disconnected';
      this.emit('disconnected', reason);
      
      // Auto-reconnect unless manually disconnected
      if (reason !== 'io client disconnect') {
        this._scheduleReconnect();
      }
    });
    
    // Handle errors
    this.socket.on('error', (error) => {
      this.emit('error', error);
    });
    
    // Forward channel-related events to appropriate channels
    this.socket.on('message', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        (channel as any)._handleMessage(data);
      }
    });
    
    this.socket.on('subscribed', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        (channel as any)._handleSubscribed(data);
      }
    });
    
    this.socket.on('unsubscribed', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        (channel as any)._handleUnsubscribed(data);
      }
    });
    
    this.socket.on('published', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        (channel as any)._handlePublished(data);
      }
    });
    
    this.socket.on('presence', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        (channel as any)._handlePresence(data);
      }
    });
    
    this.socket.on('presence_change', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        (channel as any)._handlePresenceChange(data);
      }
    });
    
    this.socket.on('history', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        (channel as any)._handleHistory(data);
      }
    });
  }
  
  /**
   * Internal: Schedule reconnection with exponential backoff
   * @private
   */
  private _scheduleReconnect(): void {
    if (this.connectionState === 'connected') return;
    
    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;
    
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay: delay
    });
    
    setTimeout(() => {
      if (this.connectionState === 'reconnecting') {
        this.connect();
      }
    }, delay);
  }
  
  /**
   * Internal: Get socket instance (for Channel class)
   * @private
   */
  _getSocket(): Socket | null {
    return this.socket;
  }
  
  /**
   * Internal: Check if connected (for Channel class)
   * @private
   */
  _isConnected(): boolean {
    return this.connectionState === 'connected' && this.socket && this.socket.connected;
  }
  
  /**
   * Internal: Generate consistent client identifier for session stickiness
   * @private
   */
  private _generateClientIdentifier(): string {
    // Create a consistent identifier based on API key and user ID
    const baseId = this.config.userId || 'default';
    const apiKeyHash = this._hashString(this.config.apiKey);
    return `${apiKeyHash}_${baseId}`;
  }
  
  /**
   * Internal: Simple hash function for API key
   * @private
   */
  private _hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Get client identifier used for session stickiness
   * @returns Client identifier
   */
  getClientIdentifier(): string {
    return this.clientIdentifier;
  }
  
  /**
   * Get session information
   * @returns Session info or null
   */
  getSessionInfo(): any {
    return this.sessionInfo;
  }
}

export default OddSockets;
