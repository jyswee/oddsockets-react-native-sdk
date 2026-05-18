import { EventEmitter } from 'eventemitter3';
import { Socket } from 'socket.io-client';
import { validateMessageSize } from './MessageSizeValidator';
import {
  MessageData,
  SubscriptionOptions,
  PublishOptions,
  HistoryOptions,
  PresenceInfo,
  PresenceChangeEvent,
  ChannelEvents
} from './types';

/**
 * Channel class for pub/sub messaging
 * 
 * Provides methods for subscribing, publishing, and managing presence
 * on a specific channel within the OddSockets platform.
 */
class Channel extends EventEmitter<ChannelEvents> {
  private name: string;
  private client: any; // OddSockets client instance
  private subscribed: boolean = false;
  private subscribing: boolean = false;
  private options: SubscriptionOptions = {};
  private presence: Map<string, any> = new Map();
  private messageHistory: MessageData[] = [];
  private maxHistorySize: number = 100;

  /**
   * Create a Channel instance
   * @param name - Channel name
   * @param client - Parent OddSockets client
   */
  constructor(name: string, client: any) {
    super();
    
    this.name = name;
    this.client = client;
  }
  
  /**
   * Subscribe to the channel
   * @param callback - Message callback function
   * @param options - Subscription options
   * @returns Promise that resolves when subscription is complete
   */
  async subscribe(callback: (data: MessageData) => void, options: SubscriptionOptions = {}): Promise<void> {
    if (typeof callback !== 'function') {
      throw new Error('Callback function is required');
    }
    
    if (this.subscribed || this.subscribing) {
      // Add callback to existing subscription
      this.on('message', callback);
      return;
    }
    
    if (!this.client._isConnected()) {
      throw new Error('Client is not connected');
    }
    
    this.subscribing = true;
    this.options = {
      maxHistory: options.maxHistory || 100,
      retainHistory: options.retainHistory !== false,
      enablePresence: options.enablePresence || false,
      ...options
    };
    
    this.maxHistorySize = this.options.maxHistory || 100;
    
    return new Promise((resolve, reject) => {
      const socket: Socket = this.client._getSocket();
      
      // Set up one-time listeners for subscription response
      const onSubscribed = (data: any) => {
        if (data.channel === this.name) {
          this.subscribed = true;
          this.subscribing = false;
          this.on('message', callback);
          
          socket.off('subscribed', onSubscribed);
          socket.off('error', onError);
          
          this.emit('subscribed', data);
          resolve();
        }
      };
      
      const onError = (error: Error) => {
        this.subscribing = false;
        socket.off('subscribed', onSubscribed);
        socket.off('error', onError);
        reject(error);
      };
      
      socket.on('subscribed', onSubscribed);
      socket.on('error', onError);
      
      // Send subscription request
      socket.emit('subscribe', {
        channel: this.name,
        options: this.options
      });
      
      // Timeout fallback
      setTimeout(() => {
        if (this.subscribing) {
          socket.off('subscribed', onSubscribed);
          socket.off('error', onError);
          this.subscribing = false;
          reject(new Error('Subscription timeout'));
        }
      }, 10000);
    });
  }
  
  /**
   * Unsubscribe from the channel
   * @returns Promise that resolves when unsubscription is complete
   */
  async unsubscribe(): Promise<void> {
    if (!this.subscribed) {
      return;
    }
    
    if (!this.client._isConnected()) {
      throw new Error('Client is not connected');
    }
    
    return new Promise((resolve, reject) => {
      const socket: Socket = this.client._getSocket();
      
      const onUnsubscribed = (data: any) => {
        if (data.channel === this.name) {
          this.subscribed = false;
          this.removeAllListeners('message');
          
          socket.off('unsubscribed', onUnsubscribed);
          socket.off('error', onError);
          
          this.emit('unsubscribed', data);
          resolve();
        }
      };
      
      const onError = (error: Error) => {
        socket.off('unsubscribed', onUnsubscribed);
        socket.off('error', onError);
        reject(error);
      };
      
      socket.on('unsubscribed', onUnsubscribed);
      socket.on('error', onError);
      
      socket.emit('unsubscribe', {
        channel: this.name
      });
      
      // Timeout fallback
      setTimeout(() => {
        socket.off('unsubscribed', onUnsubscribed);
        socket.off('error', onError);
        reject(new Error('Unsubscription timeout'));
      }, 5000);
    });
  }
  
  /**
   * Publish a message to the channel
   * @param message - Message to publish (string, object, or array)
   * @param options - Publishing options
   * @returns Promise that resolves with publication result
   */
  async publish(message: any, options: PublishOptions = {}): Promise<any> {
    if (!this.client._isConnected()) {
      throw new Error('Client is not connected');
    }
    
    // Validate message size before publishing
    try {
      validateMessageSize(message);
    } catch (error) {
      throw error;
    }
    
    return new Promise((resolve, reject) => {
      const socket: Socket = this.client._getSocket();
      
      const onPublished = (data: any) => {
        if (data.channel === this.name) {
          socket.off('published', onPublished);
          socket.off('error', onError);
          resolve(data);
        }
      };
      
      const onError = (error: Error) => {
        socket.off('published', onPublished);
        socket.off('error', onError);
        reject(error);
      };
      
      socket.on('published', onPublished);
      socket.on('error', onError);
      
      socket.emit('publish', {
        channel: this.name,
        message: message,
        options: options
      });
      
      // Timeout fallback
      setTimeout(() => {
        socket.off('published', onPublished);
        socket.off('error', onError);
        reject(new Error('Publish timeout'));
      }, 10000);
    });
  }
  
  /**
   * Get message history for the channel
   * @param options - History options
   * @returns Promise that resolves with message history
   */
  async getHistory(options: HistoryOptions = {}): Promise<MessageData[]> {
    if (!this.client._isConnected()) {
      throw new Error('Client is not connected');
    }
    
    return new Promise((resolve, reject) => {
      const socket: Socket = this.client._getSocket();
      
      const onHistory = (data: any) => {
        if (data.channel === this.name) {
          socket.off('history', onHistory);
          socket.off('error', onError);
          resolve(data.messages || []);
        }
      };
      
      const onError = (error: Error) => {
        socket.off('history', onHistory);
        socket.off('error', onError);
        reject(error);
      };
      
      socket.on('history', onHistory);
      socket.on('error', onError);
      
      socket.emit('get_history', {
        channel: this.name,
        count: options.count || 50,
        start: options.start,
        end: options.end
      });
      
      // Timeout fallback
      setTimeout(() => {
        socket.off('history', onHistory);
        socket.off('error', onError);
        reject(new Error('History request timeout'));
      }, 10000);
    });
  }
  
  /**
   * Get current presence information
   * @returns Promise that resolves with presence information
   */
  async getPresence(): Promise<PresenceInfo> {
    if (!this.client._isConnected()) {
      throw new Error('Client is not connected');
    }
    
    return new Promise((resolve, reject) => {
      const socket: Socket = this.client._getSocket();
      
      const onPresence = (data: any) => {
        if (data.channel === this.name) {
          socket.off('presence', onPresence);
          socket.off('error', onError);
          resolve(data);
        }
      };
      
      const onError = (error: Error) => {
        socket.off('presence', onPresence);
        socket.off('error', onError);
        reject(error);
      };
      
      socket.on('presence', onPresence);
      socket.on('error', onError);
      
      socket.emit('get_presence', {
        channel: this.name
      });
      
      // Timeout fallback
      setTimeout(() => {
        socket.off('presence', onPresence);
        socket.off('error', onError);
        reject(new Error('Presence request timeout'));
      }, 5000);
    });
  }
  
  /**
   * Update user state
   * @param state - User state object
   * @returns Promise that resolves when state is updated
   */
  async updateState(state: any): Promise<any> {
    if (!this.client._isConnected()) {
      throw new Error('Client is not connected');
    }
    
    return new Promise((resolve, reject) => {
      const socket: Socket = this.client._getSocket();
      
      const onStateUpdated = (data: any) => {
        socket.off('state_updated', onStateUpdated);
        socket.off('error', onError);
        resolve(data);
      };
      
      const onError = (error: Error) => {
        socket.off('state_updated', onStateUpdated);
        socket.off('error', onError);
        reject(error);
      };
      
      socket.on('state_updated', onStateUpdated);
      socket.on('error', onError);
      
      socket.emit('update_state', {
        state: state
      });
      
      // Timeout fallback
      setTimeout(() => {
        socket.off('state_updated', onStateUpdated);
        socket.off('error', onError);
        reject(new Error('State update timeout'));
      }, 5000);
    });
  }
  
  /**
   * Get channel subscription status
   * @returns Whether channel is subscribed
   */
  isSubscribed(): boolean {
    return this.subscribed;
  }
  
  /**
   * Get channel name
   * @returns Channel name
   */
  getName(): string {
    return this.name;
  }
  
  /**
   * Get current presence map
   * @returns Presence map
   */
  getPresenceMap(): Map<string, any> {
    return new Map(this.presence);
  }
  
  /**
   * Get cached message history
   * @returns Cached messages
   */
  getCachedHistory(): MessageData[] {
    return [...this.messageHistory];
  }
  
  /**
   * Internal: Handle incoming message
   * @param data - Message data
   * @private
   */
  _handleMessage(data: MessageData): void {
    // Add to history if enabled
    if (this.options.retainHistory) {
      this.messageHistory.push(data);
      
      // Trim history if too large
      if (this.messageHistory.length > this.maxHistorySize) {
        this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
      }
    }
    
    this.emit('message', data);
  }
  
  /**
   * Internal: Handle subscription confirmation
   * @param data - Subscription data
   * @private
   */
  _handleSubscribed(data: any): void {
    this.emit('subscribed', data);
  }
  
  /**
   * Internal: Handle unsubscription confirmation
   * @param data - Unsubscription data
   * @private
   */
  _handleUnsubscribed(data: any): void {
    this.emit('unsubscribed', data);
  }
  
  /**
   * Internal: Handle publish confirmation
   * @param data - Publish confirmation data
   * @private
   */
  _handlePublished(data: any): void {
    this.emit('published', data);
  }
  
  /**
   * Internal: Handle presence information
   * @param data - Presence data
   * @private
   */
  _handlePresence(data: PresenceInfo): void {
    // Update presence map
    if (data.occupants) {
      this.presence.clear();
      data.occupants.forEach(occupant => {
        this.presence.set(occupant.userId, occupant);
      });
    }
    
    this.emit('presence', data);
  }
  
  /**
   * Internal: Handle presence changes
   * @param data - Presence change data
   * @private
   */
  _handlePresenceChange(data: PresenceChangeEvent): void {
    // Update presence map
    if (data.action === 'join') {
      this.presence.set(data.user.userId, data.user);
    } else if (data.action === 'leave') {
      this.presence.delete(data.user.userId);
    }
    
    this.emit('presence_change', data);
  }
  
  /**
   * Internal: Handle message history
   * @param data - History data
   * @private
   */
  _handleHistory(data: any): void {
    this.emit('history', data);
  }
}

export default Channel;
