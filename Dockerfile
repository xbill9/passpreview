# Stage 1: Install dependencies
FROM node:20-alpine AS deps
# Alpine images may require libc6-compat for some Node.js native modules
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Copy package.json and package-lock.json (or yarn.lock, pnpm-lock.yaml)
# Ensure package-lock.json is present and up-to-date for npm ci.
COPY package.json package-lock.json ./
# Using npm ci for clean, reproducible installs from package-lock.json
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application code
COPY . .
# Build the Next.js application
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line to disable Next.js telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user and group for security
RUN addgroup -S -g 1001 nodejs
RUN adduser -S -u 1001 nextjs

# Copy necessary files from the builder stage
# Copy public assets
COPY --from=builder /app/public ./public
# .next folder contains the optimized build output
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# Copy node_modules that were used for the build (includes production dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
# Copy package.json to allow running npm start and for metadata
COPY --from=builder /app/package.json ./package.json
# Copy next.config.ts as it might be needed at runtime by Next.js
COPY --from=builder /app/next.config.ts ./next.config.ts

# Set the user to the non-root user
USER nextjs

# Expose the port the app runs on (default for next start is 3000)
EXPOSE 3000

# Set the port environment variable (Next.js respects this)
ENV PORT 3000

# Command to run the application
# "npm run start" will execute "next start" as defined in package.json
CMD ["npm", "run", "start"]
