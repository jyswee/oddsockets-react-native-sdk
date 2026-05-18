# OddSockets React Native SDK

React Native/TypeScript SDK for real-time messaging. iOS + Android.

## Get a free API key
```bash
curl -X POST https://oddsockets.com/api/agent-signup -H "Content-Type: application/json" -d '{"email":"you@example.com","agentName":"my-agent","platform":"react-native"}'
curl -X POST https://oddsockets.com/api/agent-signup/verify -H "Content-Type: application/json" -d '{"email":"you@example.com","code":"123456","agentName":"my-agent"}'
```

## Key files
- `src/index.ts` — Entry point
- `src/OddSockets.ts` — Main client
- `src/Channel.ts` — Channel ops
- `src/ManagerDiscovery.ts` — Manager URL
- `src/PubNubCompat.ts` — PubNub drop-in

## Free tier: 100 MAU, 50 connections, 10K msg/day, 10 channels, 100MB/24h
