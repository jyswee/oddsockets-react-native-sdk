# OddSockets React Native SDK - containerised two-client demo.
#
# The SDK core (client, channel, socket.io transport, manager discovery) is
# plain TypeScript with no React-Native-only imports, so it runs headless under
# Node. This image runs the honest cross-client round-trip against the live
# OddSockets platform - proof the transport is real.
#
# Build (from the repo root, so the SDK's src/ is in context):
#   docker build -f demo/Dockerfile -t oddsockets-rn-demo .
# Run:
#   docker run --rm -e ODDSOCKETS_API_KEY="ak_..." oddsockets-rn-demo
FROM node:20-slim

WORKDIR /app
# Copy the whole SDK repo (see .dockerignore for what is excluded).
COPY . .

# Install only the SDK's runtime deps (socket.io-client, eventemitter3) at the
# repo root so Node resolves them when ts-node runs src/ directly. Then add
# ts-node/typescript as throwaway tooling to execute the TypeScript demo.
RUN npm install --omit=dev --no-audit --no-fund \
 && npm install --no-save --no-audit --no-fund ts-node@10 typescript@5

ENTRYPOINT ["npx", "ts-node", "--project", "demo/tsconfig.json", "demo/demo.ts"]
