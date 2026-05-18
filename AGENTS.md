# Agent Integration Guide — React Native

POST https://oddsockets.com/api/agent-signup then /verify with 6-digit code.

```typescript
import { OddSockets } from '@oddsocketsai/react-native-sdk';
const client = new OddSockets({ apiKey: 'ak_...', userId: 'my-agent' });
const channel = client.channel('agent-coordination');
await channel.subscribe((msg) => console.log(msg));
await channel.publish({ task: 'summarize' });
```

Free: 100 MAU | 50 connections | 10K msg/day | 10 channels | 100MB/24h
