/**
 * Headless smoke test for the OddSockets React Native SDK.
 *
 * The SDK core (client, channel, socket.io transport, manager discovery)
 * runs fine outside React Native, so this variant lets you verify a full
 * pub/sub round-trip from a plain terminal without Metro or a simulator.
 *
 * Run:
 *   ODDSOCKETS_API_KEY=your_key npx ts-node demo.ts
 *
 * Requires Node 18+ (for a global fetch implementation).
 */

import { runRoundTrip } from './roundTrip';

async function main(): Promise<void> {
  const apiKey = process.env.ODDSOCKETS_API_KEY;

  if (!apiKey) {
    console.error('Missing ODDSOCKETS_API_KEY environment variable.');
    console.error('Get a free key - see this folder\'s README.md.');
    process.exit(1);
    return;
  }

  const result = await runRoundTrip({
    apiKey,
    userId: 'demo-user',
    log: line => console.log(line),
  });

  console.log('');
  console.log(result.message);

  if (!result.ok) {
    process.exit(1);
  }
}

main().catch((error: Error) => {
  console.error(`FAIL - ${error.message}`);
  process.exit(1);
});
