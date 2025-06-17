# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json ./
# If you have a package-lock.json, uncomment the next line
# COPY package-lock.json ./
# If you're using yarn, copy yarn.lock instead
# COPY yarn.lock ./

# Install dependencies
# Using npm ci for cleaner installs if package-lock.json exists
# Otherwise, fall back to npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Production environment (also capable of dev previews)
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Files needed for 'next dev' (source, config, dependencies)
COPY --from=builder --chown=appuser:appgroup /app/package.json ./
# COPY --from=builder --chown=appuser:appgroup /app/package-lock.json ./ # If you use it
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/public ./public
COPY --from=builder --chown=appuser:appgroup /app/src ./src
COPY --from=builder --chown=appuser:appgroup /app/components.json ./components.json
COPY --from=builder --chown=appuser:appgroup /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=appuser:appgroup /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder --chown=appuser:appgroup /app/tsconfig.json ./tsconfig.json
# If you have a postcss.config.js, copy it too:
# COPY --from=builder --chown=appuser:appgroup /app/postcss.config.js ./

# Files needed for standalone 'next start' (which is the default CMD)
# This includes the entire .next directory from the builder stage.
# It contains .next/standalone for production and other artifacts used by 'next dev'.
COPY --from=builder --chown=appuser:appgroup /app/.next ./.next

USER appuser

# Set the NODE_ENV to production (platform might override to development for previews)
ENV NODE_ENV production
# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Expose default port for Next.js (production start) and dev port
EXPOSE 3000
EXPOSE 9002

# Command to run the application for production
# This targets the server.js file within the .next/standalone directory.
CMD ["node", ".next/standalone/server.js"]
