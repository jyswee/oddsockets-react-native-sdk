/**
 * Enhanced Features for OddSockets React Native SDK
 * Provides methods for all 67 new Slack-like events
 */

import OddSockets from './OddSockets';

export class EnhancedFeatures {
  private client: OddSockets;

  constructor(client: OddSockets) {
    this.client = client;
  }

  /**
   * Get socket instance
   * @private
   */
  private getSocket(): any {
    if (!this.client._isConnected()) {
      throw new Error('Not connected to OddSockets');
    }
    return this.client._getSocket();
  }

  // ==================== THREAD EVENTS ====================

  /**
   * Reply to a message in a thread
   */
  async threadReply(params: {
    channel: string;
    parentMessageId: string;
    message: string;
    userId: string;
    userName: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('thread_reply', params);
      
      socket.once('thread_reply_success', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'thread_reply') reject(new Error(error.message));
      });
    });
  }

  /**
   * Get thread with all replies
   */
  async getThread(threadId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('get_thread', { threadId });
      
      socket.once('thread_data', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'get_thread') reject(new Error(error.message));
      });
    });
  }

  /**
   * Subscribe to thread updates
   */
  async subscribeThread(threadId: string, userId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('subscribe_thread', { threadId, userId });
      
      socket.once('thread_subscribed', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'subscribe_thread') reject(new Error(error.message));
      });
    });
  }

  /**
   * Mark thread as read
   */
  markThreadRead(threadId: string, userId: string): void {
    const socket = this.getSocket();
    socket.emit('mark_thread_read', { threadId, userId });
  }

  /**
   * Follow a thread
   */
  followThread(threadId: string, userId: string): void {
    const socket = this.getSocket();
    socket.emit('follow_thread', { threadId, userId });
  }

  /**
   * Unfollow a thread
   */
  unfollowThread(threadId: string, userId: string): void {
    const socket = this.getSocket();
    socket.emit('unfollow_thread', { threadId, userId });
  }

  // ==================== REACTION EVENTS ====================

  /**
   * Add reaction to a message
   */
  addReaction(params: {
    messageId: string;
    channel: string;
    emoji: string;
    userId: string;
    userName: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('add_reaction', params);
  }

  /**
   * Remove reaction from a message
   */
  removeReaction(params: {
    messageId: string;
    channel: string;
    emoji: string;
    userId: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('remove_reaction', params);
  }

  /**
   * Get all reactions for a message
   */
  async getReactions(messageId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('get_reactions', { messageId });
      
      socket.once('message_reactions', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'get_reactions') reject(new Error(error.message));
      });
    });
  }

  // ==================== READ RECEIPT EVENTS ====================

  /**
   * Mark message as read
   */
  markRead(params: {
    messageId: string;
    channel: string;
    userId: string;
    userName: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('mark_read', params);
  }

  /**
   * Get unread counts for channels
   */
  async getUnreadCounts(userId: string, channels: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('get_unread_counts', { userId, channels });
      
      socket.once('unread_counts', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'get_unread_counts') reject(new Error(error.message));
      });
    });
  }

  /**
   * Mark all messages in channel as read
   */
  markAllRead(channel: string, userId: string): void {
    const socket = this.getSocket();
    socket.emit('mark_all_read', { channel, userId });
  }

  // ==================== CHANNEL EVENTS ====================

  /**
   * Create a new channel
   */
  async createChannel(params: {
    name: string;
    type: 'public' | 'private';
    description: string;
    topic: string;
    createdBy: string;
    createdByName: string;
    members?: Array<{ userId: string; userName: string }>;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('create_channel', params);
      
      socket.once('channel_create_success', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'create_channel') reject(new Error(error.message));
      });
    });
  }

  /**
   * Update channel details
   */
  updateChannel(params: {
    channelId: string;
    updates: Record<string, any>;
    userId: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('update_channel', params);
  }

  /**
   * Archive a channel
   */
  archiveChannel(channelId: string, userId: string): void {
    const socket = this.getSocket();
    socket.emit('archive_channel', { channelId, userId });
  }

  /**
   * Invite user to channel
   */
  inviteToChannel(params: {
    channelId: string;
    invitedUserId: string;
    invitedUserName: string;
    invitedBy: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('invite_to_channel', params);
  }

  /**
   * Remove user from channel
   */
  removeFromChannel(params: {
    channelId: string;
    removedUserId: string;
    removedBy: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('remove_from_channel', params);
  }

  /**
   * Join a public channel
   */
  joinChannel(params: {
    channelId: string;
    userId: string;
    userName: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('join_channel', params);
  }

  /**
   * Leave a channel
   */
  leaveChannel(channelId: string, userId: string): void {
    const socket = this.getSocket();
    socket.emit('leave_channel', { channelId, userId });
  }

  /**
   * Get channel members
   */
  async getChannelMembers(channelId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('get_channel_members', { channelId });
      
      socket.once('channel_members', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'get_channel_members') reject(new Error(error.message));
      });
    });
  }

  // ==================== DIRECT MESSAGE EVENTS ====================

  /**
   * Create or get DM conversation
   */
  async createDM(params: {
    userIds: string[];
    type?: '1-on-1' | 'group';
    groupName?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('create_dm', params);
      
      socket.once('dm_create_success', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'create_dm') reject(new Error(error.message));
      });
    });
  }

  /**
   * Send direct message
   */
  sendDM(params: {
    conversationId: string;
    message: string;
    userId: string;
    userName: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('send_dm', params);
  }

  /**
   * Get user's DM conversations
   */
  async getDMConversations(userId: string, includeArchived: boolean = false): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('get_dm_conversations', { userId, includeArchived });
      
      socket.once('dm_conversations', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'get_dm_conversations') reject(new Error(error.message));
      });
    });
  }

  // ==================== NOTIFICATION EVENTS ====================

  /**
   * Subscribe to user notifications
   */
  subscribeNotifications(userId: string): void {
    const socket = this.getSocket();
    socket.emit('subscribe_notifications', { userId });
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId: string, userId: string): void {
    const socket = this.getSocket();
    socket.emit('mark_notification_read', { notificationId, userId });
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead(userId: string): void {
    const socket = this.getSocket();
    socket.emit('mark_all_notifications_read', { userId });
  }

  /**
   * Clear all notifications
   */
  clearNotifications(userId: string): void {
    const socket = this.getSocket();
    socket.emit('clear_notifications', { userId });
  }

  /**
   * Get user notifications
   */
  async getNotifications(params: {
    userId: string;
    limit?: number;
    status?: 'all' | 'unread' | 'read';
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('get_notifications', params);
      
      socket.once('notifications_data', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'get_notifications') reject(new Error(error.message));
      });
    });
  }

  // ==================== FILE UPLOAD EVENTS ====================

  /**
   * Start file upload
   */
  async startFileUpload(params: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    channel: string;
    userId: string;
    userName: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('start_file_upload', params);
      
      socket.once('upload_started', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'start_file_upload') reject(new Error(error.message));
      });
    });
  }

  /**
   * Update upload progress
   */
  uploadProgress(params: {
    uploadId: string;
    bytesUploaded: number;
    channel?: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('upload_progress', params);
  }

  /**
   * Complete file upload
   */
  uploadComplete(params: {
    uploadId: string;
    fileId: string;
    storageInfo: Record<string, any>;
    channel?: string;
    messageId?: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('upload_complete', params);
  }

  // ==================== PRESENCE EVENTS ====================

  /**
   * Set user status
   */
  setStatus(userId: string, status: 'online' | 'away' | 'dnd' | 'offline'): void {
    const socket = this.getSocket();
    socket.emit('set_status', { userId, status });
  }

  /**
   * Set custom status
   */
  setCustomStatus(params: {
    userId: string;
    emoji: string;
    text: string;
    expiresAt?: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('set_custom_status', params);
  }

  /**
   * Clear custom status
   */
  clearCustomStatus(userId: string): void {
    const socket = this.getSocket();
    socket.emit('clear_custom_status', { userId });
  }

  /**
   * Enable Do Not Disturb
   */
  setDND(userId: string, until?: string): void {
    const socket = this.getSocket();
    socket.emit('set_dnd', { userId, until });
  }

  /**
   * Disable Do Not Disturb
   */
  clearDND(userId: string): void {
    const socket = this.getSocket();
    socket.emit('clear_dnd', { userId });
  }

  /**
   * Start typing indicator
   */
  startTyping(userId: string, channel: string): void {
    const socket = this.getSocket();
    socket.emit('start_typing', { userId, channel });
  }

  /**
   * Stop typing indicator
   */
  stopTyping(userId: string, channel: string): void {
    const socket = this.getSocket();
    socket.emit('stop_typing', { userId, channel });
  }

  /**
   * Get user presence information
   */
  async getUserPresence(userIds: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('get_user_presence', { userIds });
      
      socket.once('user_presence_data', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'get_user_presence') reject(new Error(error.message));
      });
    });
  }

  // ==================== MESSAGE EDITING EVENTS ====================

  /**
   * Edit a message
   */
  editMessage(params: {
    messageId: string;
    channel: string;
    newContent: string;
    userId: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('edit_message', params);
  }

  /**
   * Delete a message
   */
  deleteMessage(params: {
    messageId: string;
    channel: string;
    userId: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('delete_message', params);
  }

  /**
   * Pin message to channel
   */
  pinMessage(params: {
    messageId: string;
    channel: string;
    userId: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('pin_message', params);
  }

  /**
   * Unpin message from channel
   */
  unpinMessage(params: {
    messageId: string;
    channel: string;
    userId: string;
  }): void {
    const socket = this.getSocket();
    socket.emit('unpin_message', params);
  }

  /**
   * Get pinned messages in channel
   */
  async getPinnedMessages(channel: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('get_pinned_messages', { channel });
      
      socket.once('pinned_messages', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'get_pinned_messages') reject(new Error(error.message));
      });
    });
  }

  // ==================== SEARCH EVENTS ====================

  /**
   * Search messages across all channels
   */
  async searchMessages(params: {
    query: string;
    limit?: number;
    userId: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('search_messages', params);
      
      socket.once('search_results', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'search_messages') reject(new Error(error.message));
      });
    });
  }

  /**
   * Filter messages by criteria
   */
  async filterMessages(params: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('filter_messages', params);
      
      socket.once('filter_results', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'filter_messages') reject(new Error(error.message));
      });
    });
  }

  /**
   * Search within specific channel
   */
  async searchInChannel(params: {
    channel: string;
    query: string;
    limit?: number;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('search_in_channel', params);
      
      socket.once('channel_search_results', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'search_in_channel') reject(new Error(error.message));
      });
    });
  }

  /**
   * Search messages by user
   */
  async searchByUser(params: {
    userId: string;
    query?: string;
    limit?: number;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      
      socket.emit('search_by_user', params);
      
      socket.once('user_search_results', (data: any) => resolve(data));
      socket.once('error', (error: any) => {
        if (error.event === 'search_by_user') reject(new Error(error.message));
      });
    });
  }
}
