/**
 * Shared two-client round-trip logic for the OddSockets React Native SDK demo.
 *
 * A genuine end-to-end round-trip using TWO independent clients:
 *   - a SUBSCRIBER (user "alice") that listens on a channel
 *   - a PUBLISHER  (user "bob")   that sends one message
 *
 * Because they are separate connections, a message reaching the subscriber can
 * ONLY have travelled through the OddSockets worker - it cannot be a local echo.
 * A matched nonce here is proof of a real round-trip. No mocks.
 *
 * Exercised surface: connect -> subscribe (+presence) -> publish -> receive
 * -> presence -> unsubscribe -> disconnect.
 *
 * All SDK calls come straight from the SDK's public API:
 *   new OddSockets({ apiKey, userId, autoConnect })
 *   client.connect()
 *   client.channel(name)
 *   channel.subscribe(callback, { enablePresence })
 *   channel.publish(message)
 *   channel.getPresence()
 *   channel.unsubscribe()
 *
 * This file is transport-agnostic and is reused by both the React Native
 * component (DemoRoundTrip.tsx) and the headless Node script (demo.ts).
 */

import OddSockets, { MessageData } from '../src';

/** The manager endpoint every SDK connects through. */
export const MANAGER_URL = 'https://connect.oddsockets.tyga.network';

/** How long to wait for the cross-client message before failing. */
export const ROUND_TRIP_TIMEOUT_MS = 15000;

export interface RoundTripResult {
  ok: boolean;
  message: string;
  channel: string;
  nonce: string;
  elapsedMs: number;
}

export interface RoundTripOptions {
  /** Your OddSockets API key. Required. */
  apiKey: string;
  /** Optional user identifier (unused; the demo uses alice/bob). */
  userId?: string;
  /** Optional logger; defaults to console.log. */
  log?: (line: string) => void;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Run a two-client publish/subscribe round-trip.
 *
 * Resolves with { ok: true } once bob's published message (matched by nonce)
 * is received on alice's separate subscription - provably through the worker.
 * Resolves with { ok: false } if the 15-second timeout elapses first, or
 * rejects if the SDK errors.
 */
export function runRoundTrip(opts: RoundTripOptions): Promise<RoundTripResult> {
  const log = opts.log || ((line: string) => console.log(line));
  const channelName = `demo-${randomId()}`;
  const nonce = randomId();
  const startedAt = Date.now();

  log(`Target manager: ${MANAGER_URL}`);
  log(`Channel: ${channelName}`);
  log(`Nonce: ${nonce}`);

  // Two independent clients on the same platform.
  const subscriber = new OddSockets({ apiKey: opts.apiKey, userId: 'alice', autoConnect: false });
  const publisher = new OddSockets({ apiKey: opts.apiKey, userId: 'bob', autoConnect: false });

  return new Promise<RoundTripResult>((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try { subscriber.disconnect(); } catch (_e) { /* ignore */ }
      try { publisher.disconnect(); } catch (_e) { /* ignore */ }
    };

    const finish = (result: RoundTripResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    subscriber.on('error', (error: Error) => log(`[alice] error: ${error.message}`));
    publisher.on('error', (error: Error) => log(`[bob]   error: ${error.message}`));

    timer = setTimeout(() => {
      log('Timed out waiting for cross-client delivery.');
      finish({
        ok: false,
        message: 'TIMEOUT - no cross-client delivery within 15s',
        channel: channelName,
        nonce,
        elapsedMs: Date.now() - startedAt,
      });
    }, ROUND_TRIP_TIMEOUT_MS);

    const run = async () => {
      log('[connect] connecting both clients...');
      await Promise.all([subscriber.connect(), publisher.connect()]);
      log(`[connect] alice = ${subscriber.getState()}, bob = ${publisher.getState()}`);

      // Subscriber joins with presence enabled.
      const inbox = subscriber.channel(channelName);
      await inbox.subscribe(async (data: MessageData) => {
        const payload: any = (data && (data as any).message) || data;
        if (payload && payload.nonce === nonce) {
          log("[alice] received bob's message (nonce matched) - real round-trip.");
          try {
            const presence = await inbox.getPresence();
            const count = presence && ((presence as any).count != null
              ? (presence as any).count
              : ((presence as any).occupants ? (presence as any).occupants.length : undefined));
            if (count !== undefined) log(`[alice] presence: ${count} user(s).`);
            await inbox.unsubscribe();
            log('[alice] unsubscribed.');
          } catch (_e) { /* best-effort; round-trip already proven */ }
          finish({
            ok: true,
            message: `OK - cross-client round-trip verified on ${channelName}`,
            channel: channelName,
            nonce,
            elapsedMs: Date.now() - startedAt,
          });
        }
      }, { enablePresence: true });
      log(`[alice] subscribed to ${channelName} (presence on)`);

      // Publisher sends from its OWN connection.
      const outbox = publisher.channel(channelName);
      const ack = await outbox.publish({ text: 'hello from bob', nonce, from: 'bob' });
      log(`[bob] published, ack = ${JSON.stringify(ack).slice(0, 160)}`);
    };

    run().catch((error: Error) => fail(error));
  });
}
