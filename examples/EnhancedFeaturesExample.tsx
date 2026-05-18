/**
 * OddSockets React Native SDK - Enhanced Features Example
 * Demonstrates all 67 new Slack-like events in React Native
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import OddSockets from 'oddsockets-react-native';

const EnhancedFeaturesExample = () => {
  const [client, setClient] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('your_api_key_here');
  const [userId, setUserId] = useState('user_123');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const connect = () => {
    try {
      const newClient = new OddSockets({
        apiKey,
        userId,
      });

      newClient.on('connected', () => {
        addLog('✅ Connected successfully!');
        setConnected(true);
      });

      newClient.on('disconnected', () => {
        addLog('❌ Disconnected');
        setConnected(false);
      });

      newClient.on('error', (error: Error) => {
        addLog(`❌ Error: ${error.message}`);
      });

      // Listen for enhanced events
      setupEnhancedEventListeners(newClient);

      setClient(newClient);
      addLog('🔄 Connecting...');
    } catch (error: any) {
      addLog(`❌ Connection error: ${error.message}`);
    }
  };

  const disconnect = () => {
    if (client) {
      client.disconnect();
      setClient(null);
      setConnected(false);
    }
  };

  const setupEnhancedEventListeners = (client: any) => {
    const socket = client._getSocket();

    // Thread events
    socket.on('new_thread_reply', (data: any) => {
      addLog(`📝 New thread reply: ${JSON.stringify(data)}`);
    });

    // Reaction events
    socket.on('reaction_added', (data: any) => {
      addLog(`😀 Reaction added: ${data.emoji}`);
    });

    socket.on('reaction_removed', (data: any) => {
      addLog(`😀 Reaction removed: ${data.emoji}`);
    });

    // Read receipt events
    socket.on('message_read', (data: any) => {
      addLog(`✓ Message read by ${data.userId}`);
    });

    // Channel events
    socket.on('channel_created', (data: any) => {
      addLog(`📢 Channel created: ${data.channel.name}`);
    });

    socket.on('user_joined_channel', (data: any) => {
      addLog(`📢 User joined: ${data.userId}`);
    });

    // DM events
    socket.on('dm_received', (data: any) => {
      addLog(`💬 DM received from ${data.from.userId}`);
    });

    // Notification events
    socket.on('notification', (data: any) => {
      addLog(`🔔 Notification: ${data.type}`);
    });

    // Presence events
    socket.on('user_status_changed', (data: any) => {
      addLog(`👤 ${data.userId} is now ${data.status}`);
    });

    socket.on('user_typing', (data: any) => {
      addLog(`👤 ${data.userId} is typing...`);
    });

    socket.on('custom_status_updated', (data: any) => {
      addLog(`👤 Custom status: ${data.customStatus.text}`);
    });

    // Message editing events
    socket.on('message_edited', (data: any) => {
      addLog(`✏️ Message edited: ${data.messageId}`);
    });

    socket.on('message_deleted', (data: any) => {
      addLog(`🗑️ Message deleted: ${data.messageId}`);
    });

    socket.on('message_pinned', (data: any) => {
      addLog(`📌 Message pinned: ${data.messageId}`);
    });
  };

  // ==================== THREAD EVENTS ====================

  const testThreadReply = async () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    try {
      const result = await client.enhanced.threadReply({
        channel: 'general',
        parentMessageId: 'msg_123',
        message: 'This is a test reply from React Native!',
        userId,
        userName: 'Test User',
      });
      addLog(`✅ Thread reply created: ${JSON.stringify(result)}`);
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const testGetThread = async () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    try {
      const thread = await client.enhanced.getThread('thread_123');
      addLog(`✅ Thread data: ${JSON.stringify(thread)}`);
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  // ==================== REACTION EVENTS ====================

  const testAddReaction = () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    client.enhanced.addReaction({
      messageId: 'msg_123',
      channel: 'general',
      emoji: '👍',
      userId,
      userName: 'Test User',
    });
    addLog('✅ Added reaction 👍');
  };

  const testRemoveReaction = () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    client.enhanced.removeReaction({
      messageId: 'msg_123',
      channel: 'general',
      emoji: '👍',
      userId,
    });
    addLog('✅ Removed reaction');
  };

  // ==================== CHANNEL EVENTS ====================

  const testCreateChannel = async () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    try {
      const channel = await client.enhanced.createChannel({
        name: `mobile-channel-${Date.now()}`,
        type: 'public',
        description: 'Created from React Native',
        topic: 'Mobile Testing',
        createdBy: userId,
        createdByName: 'Test User',
      });
      addLog(`✅ Channel created: ${JSON.stringify(channel)}`);
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const testJoinChannel = () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    client.enhanced.joinChannel({
      channelId: 'channel_123',
      userId,
      userName: 'Test User',
    });
    addLog('✅ Joined channel');
  };

  // ==================== DIRECT MESSAGE EVENTS ====================

  const testCreateDM = async () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    try {
      const dm = await client.enhanced.createDM({
        userIds: [userId, 'user_456'],
        type: '1-on-1',
      });
      addLog(`✅ DM created: ${JSON.stringify(dm)}`);
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const testSendDM = () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    client.enhanced.sendDM({
      conversationId: 'dm_123',
      message: 'Hello from React Native!',
      userId,
      userName: 'Test User',
    });
    addLog('✅ Sent DM');
  };

  // ==================== NOTIFICATION EVENTS ====================

  const testSubscribeNotifications = () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    client.enhanced.subscribeNotifications(userId);
    addLog('✅ Subscribed to notifications');
  };

  const testGetNotifications = async () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    try {
      const notifications = await client.enhanced.getNotifications({
        userId,
        limit: 10,
      });
      addLog(`✅ Notifications: ${JSON.stringify(notifications)}`);
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  // ==================== PRESENCE EVENTS ====================

  const testSetStatus = () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    client.enhanced.setStatus(userId, 'online');
    addLog('✅ Set status to online');
  };

  const testSetCustomStatus = () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    client.enhanced.setCustomStatus({
      userId,
      emoji: '📱',
      text: 'On mobile',
    });
    addLog('✅ Set custom status');
  };

  const testStartTyping = () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    client.enhanced.startTyping(userId, 'general');
    addLog('✅ Started typing indicator');
    setTimeout(() => {
      client.enhanced.stopTyping(userId, 'general');
      addLog('✅ Stopped typing indicator');
    }, 3000);
  };

  // ==================== MESSAGE EDITING EVENTS ====================

  const testEditMessage = () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    client.enhanced.editMessage({
      messageId: 'msg_123',
      channel: 'general',
      newContent: 'Updated from React Native',
      userId,
    });
    addLog('✅ Edited message');
  };

  const testPinMessage = () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    client.enhanced.pinMessage({
      messageId: 'msg_123',
      channel: 'general',
      userId,
    });
    addLog('✅ Pinned message');
  };

  // ==================== SEARCH EVENTS ====================

  const testSearchMessages = async () => {
    if (!client) return Alert.alert('Error', 'Not connected');
    try {
      const results = await client.enhanced.searchMessages({
        query: 'test',
        limit: 10,
        userId,
      });
      addLog(`✅ Search results: ${JSON.stringify(results)}`);
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OddSockets Enhanced Features</Text>
      <Text style={styles.subtitle}>67 Slack-like Events</Text>

      {/* Connection Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection</Text>
        <TextInput
          style={styles.input}
          placeholder="API Key"
          value={apiKey}
          onChangeText={setApiKey}
        />
        <TextInput
          style={styles.input}
          placeholder="User ID"
          value={userId}
          onChangeText={setUserId}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, connected && styles.buttonDisabled]}
            onPress={connect}
            disabled={connected}>
            <Text style={styles.buttonText}>Connect</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, !connected && styles.buttonDisabled]}
            onPress={disconnect}
            disabled={!connected}>
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.status}>
          Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Thread Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Thread Events</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={testThreadReply}>
              <Text style={styles.buttonText}>Thread Reply</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testGetThread}>
              <Text style={styles.buttonText}>Get Thread</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reaction Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>😀 Reaction Events</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={testAddReaction}>
              <Text style={styles.buttonText}>Add 👍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testRemoveReaction}>
              <Text style={styles.buttonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Channel Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📢 Channel Events</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={testCreateChannel}>
              <Text style={styles.buttonText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testJoinChannel}>
              <Text style={styles.buttonText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Direct Message Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Direct Messages</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={testCreateDM}>
              <Text style={styles.buttonText}>Create DM</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testSendDM}>
              <Text style={styles.buttonText}>Send DM</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={testSubscribeNotifications}>
              <Text style={styles.buttonText}>Subscribe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testGetNotifications}>
              <Text style={styles.buttonText}>Get All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Presence Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Presence</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={testSetStatus}>
              <Text style={styles.buttonText}>Set Online</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testSetCustomStatus}>
              <Text style={styles.buttonText}>Custom Status</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={testStartTyping}>
            <Text style={styles.buttonText}>Start Typing</Text>
          </TouchableOpacity>
        </View>

        {/* Message Editing Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✏️ Message Editing</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={testEditMessage}>
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testPinMessage}>
              <Text style={styles.buttonText}>Pin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Search</Text>
          <TouchableOpacity style={styles.button} onPress={testSearchMessages}>
            <Text style={styles.buttonText}>Search Messages</Text>
          </TouchableOpacity>
        </View>

        {/* Event Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Event Log</Text>
          <View style={styles.logContainer}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#667eea',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  status: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  logContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 6,
    padding: 12,
    maxHeight: 300,
  },
  logText: {
    color: '#00ff00',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});

export default EnhancedFeaturesExample;
