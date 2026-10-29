# ==============================================================================
# STAGE 1: DEPENDENCY RESOLVER & CACHING
# Uses Chainguard Node.js dev image with package manager and compilers
# ==============================================================================
FROM cgr.dev/chainguard/node:latest-dev AS deps

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install exact production & dev dependencies required for build
RUN npm ci

# ==============================================================================
# STAGE 2: APPLICATION BUILDER
# ==============================================================================
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time optimization flags
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Compile static pages and standalone server bundle
RUN npm run build

# ==============================================================================
# STAGE 3: DISTROLESS PRODUCTION RUNTIME
# Minimal Chainguard Node.js runtime: 0 CVEs, nonroot (65532), no shell/package manager
# ==============================================================================
FROM cgr.dev/chainguard/node:latest AS runner

LABEL maintainer="Mettu Karl Referral Hospital ICT <ict-support@mettukarl.gov.et>"
LABEL security.hardened="chainguard-wolfi"
LABEL org.opencontainers.image.source="https://github.com/endus2512/Mettu_karl_HMIS"
LABEL org.opencontainers.image.description="Mettu Karl HMIS Frontend Next.js Client"

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Copy standalone web assets and public directory with nonroot ownership
COPY --from=builder --chown=65532:65532 /app/public ./public
COPY --from=builder --chown=65532:65532 /app/.next/standalone ./
COPY --from=builder --chown=65532:65532 /app/.next/static ./.next/static

# Run as Chainguard nonroot user (UID 65532)
USER 65532

EXPOSE 3000

# Native Node.js HTTP probe for healthcheck (no curl or shell required)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) process.exit(1)}).on('error', () => process.exit(1))"]

# Directly execute the standalone Next.js server
ENTRYPOINT ["node", "server.js"]
