import OddSockets from './OddSockets';
import Channel from './Channel';
import { OddSocketsConfig, MessageData } from './types';

/**
 * PubNub Compatibility Layer for React Native
 * 
 * Provides a PubNub-compatible API that wraps the OddSockets SDK,
 * making it easier to migrate from PubNub to OddSockets.
 */
class PubNubCompat {
  private oddSockets: OddSockets;
  private channels: Map<string, Channel> = new Map();
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Create a PubNub-compatible client
   * @param config - Configuration options (PubNub-style)
   */
  constructor(config: any) {
    // Convert PubNub config to OddSockets config
    const oddSocketsConfig: OddSocketsConfig = {
      apiKey: config.subscribeKey || config.apiKey,
      userId: config.userId || config.uuid,
      options: {
        ...config,
        autoConnect: config.autoConnect !== false
      }
    };

    this.oddSockets = new OddSockets(oddSocketsConfig);

    // Forward OddSockets events
    this.oddSockets.on('connected', () => {
      this._notifyListeners('status', {
        category: 'PNConnectedCategory',
        operation: 'PNSubscribeOperation',
        statusCode: 200
      });
    });

    this.oddSockets.on('disconnected', () => {
      this._notifyListeners('status', {
        category: 'PNDisconnectedCategory',
        operation: 'PNSubscribeOperation',
        statusCode: 0
      });
    });

    this.oddSockets.on('error', (error) => {
      this._notifyListeners('status', {
        category: 'PNBadRequestCategory',
        operation: 'PNSubscribeOperation',
        statusCode: 400,
        errorData: error
      });
    });
  }

  /**
   * Subscribe to channels (PubNub-compatible)
   * @param params - Subscription parameters
   */
  subscribe(params: {
    channels?: string[];
    channelGroups?: string[];
    withPresence?: boolean;
    timetoken?: string;
  }): void {
    const channels = params.channels || [];
    
    channels.forEach(channelName => {
      if (!this.channels.has(channelName)) {
        const channel = this.oddSockets.channel(channelName);
        this.channels.set(channelName, channel);

        // Subscribe with message handler
        channel.subscribe((data: MessageData) => {
          this._notifyListeners('message', {
            channel: data.channel,
            message: data.message,
            timetoken: data.timestamp,
            publisher: data.publisher?.userId,
            subscription: data.channel
          });
        }, {
          enablePresence: params.withPresence || false
        });

        // Handle presence events if enabled
        if (params.withPresence) {
          channel.on('presence_change', (data) => {
            this._notifyListeners('presence', {
              channel: data.channel,
              action: data.action,
              uuid: data.user.userId,
              timestamp: data.timestamp,
              occupancy: 1 // Will be updated with actual presence info
            });
          });
        }
      }
    });
  }

  /**
   * Unsubscribe from channels (PubNub-compatible)
   * @param params - Unsubscription parameters
   */
  unsubscribe(params: {
    channels?: string[];
    channelGroups?: string[];
  }): void {
    const channels = params.channels || [];
    
    channels.forEach(channelName => {
      const channel = this.channels.get(channelName);
      if (channel) {
        channel.unsubscribe();
        this.channels.delete(channelName);
      }
    });
  }

  /**
   * Publish a message (PubNub-compatible)
   * @param params - Publishing parameters
   * @param callback - Callback function
   */
  publish(params: {
    channel: string;
    message: any;
    storeInHistory?: boolean;
    ttl?: number;
    meta?: any;
  }, callback?: (status: any, response: any) => void): void {
    const channel = this.oddSockets.channel(params.channel);
    
    channel.publish(params.message, {
      storeInHistory: params.storeInHistory,
      ttl: params.ttl,
      metadata: params.meta
    }).then(result => {
      if (callback) {
        callback(
          { error: false, statusCode: 200 },
          { timetoken: result.timestamp || Date.now() }
        );
      }
    }).catch(error => {
      if (callback) {
        callback(
          { error: true, statusCode: 400, errorData: error },
          null
        );
      }
    });
  }

  /**
   * Get message history (PubNub-compatible)
   * @param params - History parameters
   * @param callback - Callback function
   */
  history(params: {
    channel: string;
    count?: number;
    start?: string;
    end?: string;
    reverse?: boolean;
    includeTimetoken?: boolean;
    includeMeta?: boolean;
  }, callback: (status: any, response: any) => void): void {
    const channel = this.oddSockets.channel(params.channel);
    
    channel.getHistory({
      count: params.count,
      start: params.start,
      end: params.end,
      includeMetadata: params.includeMeta
    }).then(messages => {
      const formattedMessages = messages.map(msg => ({
        message: msg.message,
        timetoken: msg.timestamp,
        meta: msg.metadata
      }));

      if (params.reverse) {
        formattedMessages.reverse();
      }

      callback(
        { error: false, statusCode: 200 },
        { messages: formattedMessages }
      );
    }).catch(error => {
      callback(
        { error: true, statusCode: 400, errorData: error },
        null
      );
    });
  }

  /**
   * Get presence information (PubNub-compatible)
   * @param params - Presence parameters
   * @param callback - Callback function
   */
  hereNow(params: {
    channels?: string[];
    channelGroups?: string[];
    includeUUIDs?: boolean;
    includeState?: boolean;
  }, callback: (status: any, response: any) => void): void {
    const channels = params.channels || [];
    
    if (channels.length === 0) {
      callback(
        { error: true, statusCode: 400, errorData: 'No channels specified' },
        null
      );
      return;
    }

    const channel = this.oddSockets.channel(channels[0]);
    
    channel.getPresence().then(presence => {
      const response = {
        totalChannels: 1,
        totalOccupancy: presence.occupancy,
        channels: {
          [channels[0]]: {
            occupancy: presence.occupancy,
            occupants: params.includeUUIDs ? 
              presence.occupants.map(occ => ({
                uuid: occ.userId,
                state: params.includeState ? occ.state : undefined
              })) : []
          }
        }
      };

      callback(
        { error: false, statusCode: 200 },
        response
      );
    }).catch(error => {
      callback(
        { error: true, statusCode: 400, errorData: error },
        null
      );
    });
  }

  /**
   * Set user state (PubNub-compatible)
   * @param params - State parameters
   * @param callback - Callback function
   */
  setState(params: {
    channels?: string[];
    channelGroups?: string[];
    state: any;
    uuid?: string;
  }, callback?: (status: any, response: any) => void): void {
    const channels = params.channels || [];
    
    if (channels.length > 0) {
      const channel = this.oddSockets.channel(channels[0]);
      
      channel.updateState(params.state).then(result => {
        if (callback) {
          callback(
            { error: false, statusCode: 200 },
            { state: params.state }
          );
        }
      }).catch(error => {
        if (callback) {
          callback(
            { error: true, statusCode: 400, errorData: error },
            null
          );
        }
      });
    }
  }

  /**
   * Add listener (PubNub-compatible)
   * @param listener - Event listener object
   */
  addListener(listener: {
    message?: (messageEvent: any) => void;
    presence?: (presenceEvent: any) => void;
    status?: (statusEvent: any) => void;
    signal?: (signalEvent: any) => void;
  }): void {
    Object.keys(listener).forEach(eventType => {
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, []);
      }
      this.listeners.get(eventType)!.push(listener[eventType as keyof typeof listener]!);
    });
  }

  /**
   * Remove listener (PubNub-compatible)
   * @param listener - Event listener object to remove
   */
  removeListener(listener: any): void {
    this.listeners.forEach((listeners, eventType) => {
      const index = listeners.indexOf(listener[eventType]);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    });
  }

  /**
   * Remove all listeners (PubNub-compatible)
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Stop the client (PubNub-compatible)
   */
  stop(): void {
    this.oddSockets.disconnect();
  }

  /**
   * Destroy the client (PubNub-compatible)
   */
  destroy(): void {
    this.stop();
    this.removeAllListeners();
    this.channels.clear();
  }

  /**
   * Get the underlying OddSockets client
   * @returns OddSockets client instance
   */
  getOddSocketsClient(): OddSockets {
    return this.oddSockets;
  }

  /**
   * Internal: Notify listeners of events
   * @param eventType - Type of event
   * @param data - Event data
   * @private
   */
  private _notifyListeners(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in ${eventType} listener:`, error);
      }
    });
  }
}

export default PubNubCompat;
