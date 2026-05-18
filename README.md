# OddSockets React Native SDK

Official React Native SDK for the OddSockets real-time messaging platform.

## Installation

```bash
npm install @oddsocketsai/react-native-sdk
# or
yarn add @oddsocketsai/react-native-sdk
```

## Quick Start

```typescript
import OddSockets from '@oddsocketsai/react-native-sdk';

// Initialize the client
const client = new OddSockets({
  apiKey: 'your-api-key-here',
  userId: 'user-123'
});

// Get a channel
const channel = client.channel('my-channel');

// Subscribe to messages
await channel.subscribe((message) => {
  console.log('Received message:', message);
});

// Publish a message
await channel.publish('Hello, World!');
```

## Features

- ✅ **Real-time messaging** - Send and receive messages instantly
- ✅ **Channel-based communication** - Organize messages into channels
- ✅ **Presence tracking** - See who's online in channels
- ✅ **Message history** - Retrieve past messages
- ✅ **Automatic reconnection** - Handles network interruptions gracefully
- ✅ **TypeScript support** - Full type definitions included
- ✅ **PubNub compatibility** - Easy migration from PubNub
- ✅ **React Native optimized** - Built specifically for React Native

## API Reference

### OddSockets Client

#### Constructor

```typescript
const client = new OddSockets({
  apiKey: string,           // Required: Your OddSockets API key
  userId?: string,          // Optional: User identifier
  autoConnect?: boolean,    // Optional: Auto-connect on instantiation (default: true)
  options?: {               // Optional: Additional connection options
    timeout?: number,
    transports?: string[],
    // ... other socket.io options
  }
});
```

#### Methods

- `connect()` - Connect to the OddSockets platform
- `disconnect()` - Disconnect from the platform
- `channel(name)` - Get or create a channel
- `getState()` - Get current connection state
- `getWorkerInfo()` - Get assigned worker information
- `publishBulk(messages)` - Publish multiple messages at once

#### Events

```typescript
client.on('connecting', () => console.log('Connecting...'));
client.on('connected', () => console.log('Connected!'));
client.on('disconnected', (reason) => console.log('Disconnected:', reason));
client.on('error', (error) => console.error('Error:', error));
client.on('reconnecting', (event) => console.log('Reconnecting...', event));
client.on('worker_assigned', (info) => console.log('Worker assigned:', info));
```

### Channel

#### Methods

- `subscribe(callback, options?)` - Subscribe to channel messages
- `unsubscribe()` - Unsubscribe from the channel
- `publish(message, options?)` - Publish a message
- `getHistory(options?)` - Get message history
- `getPresence()` - Get current presence information
- `updateState(state)` - Update user state
- `isSubscribed()` - Check subscription status
- `getName()` - Get channel name

#### Events

```typescript
channel.on('message', (data) => console.log('Message:', data));
channel.on('presence', (data) => console.log('Presence:', data));
channel.on('presence_change', (data) => console.log('Presence change:', data));
```

## Examples

### Basic Chat Application

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import OddSockets from '@oddsocketsai/react-native-sdk';

const ChatApp = () => {
  const [client] = useState(() => new OddSockets({
    apiKey: 'your-api-key',
    userId: 'user-123'
  }));
  
  const [channel] = useState(() => client.channel('general'));
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    const setupChannel = async () => {
      await channel.subscribe((message) => {
        setMessages(prev => [...prev, message]);
      });
    };

    setupChannel();

    return () => {
      channel.unsubscribe();
      client.disconnect();
    };
  }, []);

  const sendMessage = async () => {
    if (inputText.trim()) {
      await channel.publish({
        text: inputText,
        timestamp: new Date().toISOString()
      });
      setInputText('');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text>{item.message.text}</Text>
        )}
      />
      <View style={{ flexDirection: 'row' }}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          style={{ flex: 1, borderWidth: 1, padding: 10 }}
        />
        <TouchableOpacity onPress={sendMessage}>
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatApp;
```

### PubNub Migration

If you're migrating from PubNub, you can use the compatibility layer:

```typescript
import { PubNubCompat } from '@oddsocketsai/react-native-sdk';

// Replace your PubNub initialization
const pubnub = new PubNubCompat({
  subscribeKey: 'your-oddsockets-api-key', // Use your OddSockets API key
  userId: 'user-123'
});

// Your existing PubNub code should work as-is
pubnub.subscribe({
  channels: ['my-channel']
});

pubnub.addListener({
  message: (messageEvent) => {
    console.log('Message:', messageEvent);
  }
});
```

## Configuration

### Environment Setup

For React Native development, make sure you have:

1. React Native development environment set up
2. Node.js 16+ installed
3. Your OddSockets API key

### TypeScript Support

This SDK is written in TypeScript and includes full type definitions. No additional setup is required for TypeScript projects.

## Error Handling

```typescript
try {
  await channel.publish('Hello');
} catch (error) {
  console.error('Failed to publish:', error);
}

// Or using event listeners
client.on('error', (error) => {
  console.error('Client error:', error);
});
```

## Message Size Limits

Messages are limited to 32KB (32,768 bytes) to ensure optimal performance and compatibility with industry standards.

## Get a Free API Key

```bash
curl -X POST https://oddsockets.com/api/agent-signup \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "agentName": "my-agent", "platform": "react-native"}'
curl -X POST https://oddsockets.com/api/agent-signup/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "code": "123456", "agentName": "my-agent"}'
```

## Plans

| | Free | Starter | Pro |
|---|---|---|---|
| **Price** | $0/mo | $49.99/mo | $299/mo |
| **MAU** | 100 | 1,000 | 50,000 |
| **Concurrent connections** | 50 | 1,000 | Unlimited |
| **Messages/day** | 10,000 | 4,320,000 | Unlimited |
| **Channels** | 10 | Unlimited | Unlimited |
| **Storage** | 100MB (24h) | 50GB (6 months) | Unlimited |

## Support

- [Documentation](https://docs.oddsockets.com/sdks/react-native)
- [Issue Tracker](https://github.com/jyswee/oddsockets-react-native-sdk/issues)
- [Email Support](mailto:support@oddsockets.com)

## License

MIT License - Copyright (c) 2026 Joe Wee, Tyga.Cloud Ltd. See [LICENSE](LICENSE) for details.
