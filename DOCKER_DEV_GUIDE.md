# Docker Development Guide

## Auto-Reload Setup

The Docker configuration has been optimized for development with auto-reload functionality.

### Quick Start

```bash
# Start all services with auto-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Start just the web service
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up web

# Start in background
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Features

✅ **Auto-reload enabled** - File changes trigger automatic reloads
✅ **Volume mounting** - Local code changes are immediately reflected
✅ **Hot Module Replacement (HMR)** - Fast development updates
✅ **File watching** - Optimized for Docker environments

### Configuration

The following optimizations have been applied:

#### Vite Configuration (`vite.config.ts`)
```typescript
export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    watch: {
      usePolling: true,    // Required for Docker
      interval: 1000,      // Check every second
    },
    host: true,            // Allow external connections
    port: 5173,
    hmr: {
      port: 5173,          // HMR port
    },
  },
});
```

#### Docker Environment Variables
```dockerfile
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
```

#### Volume Mounting
```yaml
volumes:
  - ./web:/app                    # Source code
  - web_node_modules:/app/node_modules  # Prevent node_modules conflicts
```

### Testing Auto-Reload

1. Start the web service:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up web
   ```

2. Make a change to any `.tsx`, `.ts`, or `.css` file

3. Check the container logs for reload activity:
   ```bash
   docker-compose logs web
   ```

4. Look for messages like:
   ```
   [vite] (client) hmr update /app/components/YourComponent.tsx
   [vite] (ssr) page reload app/components/YourComponent.tsx
   ```

### Performance Tips

- **Use polling** - Required for reliable file watching in Docker
- **Exclude node_modules** - Use separate volume to avoid conflicts
- **Enable HMR** - Hot Module Replacement for faster updates
- **Use development compose** - The `docker-compose.dev.yml` provides optimized commands

### Troubleshooting

If auto-reload isn't working:

1. **Check volume mounts** - Ensure source code is properly mounted
2. **Verify polling** - Make sure `usePolling: true` is set in Vite config
3. **Check logs** - Look for file watching errors in container logs
4. **Restart containers** - Sometimes a fresh start helps
5. **Check file permissions** - Ensure Docker has read access to files

### Port Configuration

- **Web**: `localhost:5173`
- **Backend**: `localhost:8000`
- **Agent**: `localhost:2024`

All services are configured to work together with proper networking and auto-reload capabilities.