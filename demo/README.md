# OddSockets React Native SDK - Demo

A tiny, runnable program that proves a real real-time round-trip against OddSockets
using **two independent clients**: **connect -> subscribe -> publish -> receive**.

Because the subscriber (`alice`) and the publisher (`bob`) are separate connections,
a message that reaches the subscriber can only have travelled through the OddSockets
worker - so this doubles as an honest end-to-end regression test (no mocks, no local
echo). The SDK core (client, channel, socket.io transport, manager discovery) is
plain TypeScript with no React-Native-only imports, so it runs headless under Node.

## Proof it's real

`demo/PROOF.txt` is a captured transcript of this demo running in Docker against the
live platform. Reproduce it yourself in one command (see below) - here is a real run:

```
[connect] connecting both clients...
[connect] alice = connected, bob = connected
[alice] subscribed to demo-84qcfpxu (presence on)
[bob] published, ack = {"messageId":"9343bc49-...","channel":"demo-84qcfpxu","subscriberCount":1}
[alice] received bob's message (nonce matched) - real round-trip.
[alice] presence: 1 user(s).
[alice] unsubscribed.

OK - cross-client round-trip verified on demo-84qcfpxu
```

## 1. Get a free API key

Two-step email verification (no card required):

```bash
# Step 1 - request a code
curl -X POST https://oddsockets.com/api/agent-signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","agentName":"demo","platform":"react-native"}'

# Step 2 - verify and receive your apiKey
curl -X POST https://oddsockets.com/api/agent-signup/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","code":"123456","agentName":"demo"}'
```

The verify response contains your `apiKey` (starts with `ak_`).

## 2. Run it in Docker (recommended)

No local Node/toolchain needed. Build from the repo root so the SDK's `src/` is in
context:

```bash
docker build -f demo/Dockerfile -t oddsockets-rn-demo .
docker run --rm -e ODDSOCKETS_API_KEY="ak_your_key_here" oddsockets-rn-demo
```

A successful run prints `OK - cross-client round-trip verified ...` and exits `0`.

## 2b. Run it headless with Node

Requires Node 18+ (for global `fetch`).

```bash
cd demo
npm install
export ODDSOCKETS_API_KEY="ak_your_key_here"
npx ts-node demo.ts
```

## 2c. Run it inside a React Native / Expo app

Import the `DemoRoundTrip` component and render it:

```tsx
import DemoRoundTrip from './demo/DemoRoundTrip';

export default function App() {
  return <DemoRoundTrip />;
}
```

Then start Metro / Expo as usual (`npx expo start` or `npx react-native run-ios`).

## The code, step by step

Create two clients - a subscriber and a publisher - each on its own connection:

```ts
import OddSockets from 'oddsockets-react-native';

const subscriber = new OddSockets({ apiKey, userId: 'alice', autoConnect: false });
const publisher  = new OddSockets({ apiKey, userId: 'bob',   autoConnect: false });

await Promise.all([subscriber.connect(), publisher.connect()]);
```

Subscribe on the subscriber (presence enabled):

```ts
const inbox = subscriber.channel('my-channel');
await inbox.subscribe((data) => {
  console.log('received:', data.message);
}, { enablePresence: true });
```

Publish from the *other* client - this is what makes the test honest:

```ts
const outbox = publisher.channel('my-channel');
const ack = await outbox.publish({ text: 'hello from bob' });
console.log('messageId:', ack.messageId);
```

Inspect presence, then tear down cleanly:

```ts
const presence = await inbox.getPresence(); // { channel, count, occupants }
await inbox.unsubscribe();
subscriber.disconnect();
publisher.disconnect();
```

## What it demonstrates

- Manager discovery + automatic worker assignment (fully transparent)
- `client.channel(name)` -> `channel.subscribe(cb, opts)` -> `channel.publish(msg)`
- **Cross-client delivery**: a message published by `bob` is delivered to `alice`'s
  subscription in real time - provably through the worker, not a local echo
- Presence tracking, unsubscribe, and graceful disconnect
- A 15-second timeout so a stalled round-trip is reported as a failure (non-zero exit)

## Files

- `Dockerfile` - builds and runs the headless two-client demo on `node:20-slim`.
- `PROOF.txt` - captured transcript of a real containerised run against the platform.
- `roundTrip.ts` - shared two-client round-trip logic used by both variants.
- `DemoRoundTrip.tsx` - React Native component that runs the round-trip in-app.
- `demo.ts` - headless Node entry point (plain TypeScript).
- `tsconfig.json` - ts-node config so the demo can run the SDK's `src/` directly.
