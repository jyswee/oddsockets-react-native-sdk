/**
 * OddSockets React Native SDK - Round-trip demo component.
 *
 * Drop this component into any React Native / Expo app. On mount it runs a
 * full pub/sub round-trip against the OddSockets platform and shows the
 * result on screen.
 *
 * API key resolution order:
 *   1. process.env.ODDSOCKETS_API_KEY  (works if your bundler inlines env)
 *   2. the API_KEY_FALLBACK constant below (set it for a quick local run;
 *      NEVER commit a real key)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { runRoundTrip, MANAGER_URL } from './roundTrip';

// Fallback for React Native, where process.env may not be populated at
// runtime. Leave empty in source control and set it locally if needed.
const API_KEY_FALLBACK = '';

function resolveApiKey(): string {
  const fromEnv =
    typeof process !== 'undefined' && process.env
      ? process.env.ODDSOCKETS_API_KEY
      : undefined;
  return fromEnv || API_KEY_FALLBACK;
}

type Status = 'running' | 'ok' | 'fail';

const DemoRoundTrip = () => {
  const [status, setStatus] = useState<Status>('running');
  const [result, setResult] = useState<string>('Running round-trip...');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (line: string) => {
    setLogs(prev => [...prev, line]);
  };

  useEffect(() => {
    const apiKey = resolveApiKey();

    if (!apiKey) {
      setStatus('fail');
      setResult(
        'FAIL - no API key. Set ODDSOCKETS_API_KEY or API_KEY_FALLBACK.'
      );
      return;
    }

    let active = true;

    runRoundTrip({ apiKey, userId: 'demo-user', log: addLog })
      .then(res => {
        if (!active) {
          return;
        }
        setStatus(res.ok ? 'ok' : 'fail');
        setResult(`${res.message} (${res.elapsedMs} ms)`);
      })
      .catch((error: Error) => {
        if (!active) {
          return;
        }
        setStatus('fail');
        setResult(`FAIL - ${error.message}`);
      });

    return () => {
      active = false;
    };
  }, []);

  const resultColor =
    status === 'ok' ? '#1b7f36' : status === 'fail' ? '#b00020' : '#555';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OddSockets round-trip demo</Text>
      <Text style={styles.subtitle}>{MANAGER_URL}</Text>
      <Text style={[styles.result, { color: resultColor }]}>{result}</Text>
      <ScrollView style={styles.logs}>
        {logs.map((line, index) => (
          <Text key={index} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  result: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  logs: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  logLine: {
    fontSize: 12,
    fontFamily: 'Courier',
    color: '#333',
    marginBottom: 2,
  },
});

export default DemoRoundTrip;
