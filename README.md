# Better Stack

<div align="center">

**A composable, plugin-based framework for building full-stack TypeScript applications**

[![npm version](https://img.shields.io/npm/v/@olliethedev/better-stack.svg)](https://www.npmjs.com/package/@olliethedev/better-stack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## Overview

Better Stack is a modern, type-safe framework for building full-stack applications with a plugin architecture. It seamlessly integrates:

- **🔌 Plugin Architecture** - Build modular, reusable features as standalone plugins
- **🔄 Full-Stack Type Safety** - End-to-end TypeScript with automatic type inference, no casts needed
- **🗄️ Schema-First Database** - Define your data models once using Better DB with typed adapters
- **🚀 Production Ready** - Built on proven libraries (Better Call, Better DB, Yar Router)
- **⚡ Zero Config** - Works out of the box with sensible defaults
- **✨ Developer Experience** - Helper functions preserve route keys, hook names, and endpoint types

## Installation

```bash
npm install @olliethedev/better-stack
# or
pnpm add @olliethedev/better-stack
# or
yarn add @olliethedev/better-stack
```

### Dependencies

Better Stack works with your existing stack:

```bash
npm install @better-db/core @better-db/adapter-memory better-call @olliethedev/yar zod
```

## Quick Start

### 1. Create Your Backend API

```typescript
// app/api/route.ts
import { betterStack } from "@olliethedev/better-stack/api";
import { myPlugin } from "./plugins/my-plugin";
import { createMemoryAdapter } from "@better-db/adapter-memory";

const api = betterStack({
  plugins: {
    myFeature: myPlugin.backend,
  },
  adapter: createMemoryAdapter,
});

// Export for Next.js App Router
export const GET = api.handler;
export const POST = api.handler;
export const PUT = api.handler;
export const DELETE = api.handler;
export const PATCH = api.handler;
```

### 2. Create Your Client

```typescript
// app/lib/client.ts
import { createStackClient } from "@olliethedev/better-stack/client";
import { myPlugin } from "./plugins/my-plugin";

export const client = createStackClient({
  plugins: {
    myFeature: myPlugin.client,
  },
});

// Access router and hooks
export const { router, hooks } = client;
```

### 3. Use in Your Components

```tsx
// app/components/MyComponent.tsx
"use client";
import { hooks } from "../lib/client";

export function MyComponent() {
  const { useMyData } = hooks.myFeature;
  const { data, isLoading } = useMyData();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## Building Custom Plugins

Better Stack's power comes from its plugin architecture. Here's how to build your own:

### Plugin Architecture

Better Stack uses **separate backend and client plugins** to:
- ✅ Prevent SSR issues
- ✅ Enable better code splitting
- ✅ Allow independent deployment and versioning
- ✅ Improve tree-shaking

Each plugin type is completely independent:

1. **Backend Plugin** - API endpoints, database schema, and business logic
2. **Client Plugin** - Routes, components, and React hooks

### Example: Messages Plugin (Backend)

```typescript
// plugins/messages/backend.ts
import { createDbPlugin } from "@better-db/core";
import { createEndpoint } from "better-call";
import { z } from "zod";
import {
  defineBackendPlugin,
  type BetterAuthDBSchema,
} from "@olliethedev/better-stack/plugins";

// 1. Define your schema
const messagesSchema: BetterAuthDBSchema = {
  messages: {
    modelName: "Message",
    fields: {
      id: {
        type: "number",
        unique: true,
        required: true,
      },
      content: {
        type: "string",
        required: true,
      },
      userId: {
        type: "string",
        required: true,
      },
      createdAt: {
        type: "number",
        required: true,
      },
    },
  },
};

// 2. Create and export the backend plugin with full type inference
export const messagesBackendPlugin = defineBackendPlugin({
  name: "messages",
  dbPlugin: createDbPlugin("messages", messagesSchema),
  routes: (adapter) => ({
    // List messages
    list: createEndpoint(
      "/messages",
      {
        method: "GET",
        query: z.object({
          userId: z.string().optional(),
        }),
      },
      async ({ query }) => {
        const messages = await adapter.findMany({
          model: "messages",
          where: query.userId
            ? [{ field: "userId", value: query.userId, operator: "eq" }]
            : undefined,
        });
        return {
          status: 200,
          body: messages,
        };
      }
    ),

    // Create message
    create: createEndpoint(
      "/messages",
      {
        method: "POST",
        body: z.object({
          content: z.string().min(1),
          userId: z.string().min(1),
        }),
      },
      async ({ body }) => {
        const message = await adapter.create({
          model: "messages",
          data: {
            ...body,
            id: Date.now(),
            createdAt: Date.now(),
          },
        });
        return {
          status: 201,
          body: message,
        };
      }
    ),

    // Delete message
    delete: createEndpoint(
      "/messages/:id",
      {
        method: "DELETE",
        params: z.object({
          id: z.coerce.number(),
        }),
      },
      async ({ params }) => {
        await adapter.delete({
          model: "messages",
          where: [{ field: "id", value: params.id, operator: "eq" }],
        });
        return {
          status: 204,
          body: null,
        };
      }
    ),
  }),
});
```

### Example: Messages Plugin (Client)

```typescript
// plugins/messages/client.ts
import { defineClientPlugin } from "@olliethedev/better-stack/plugins";
import { createRoute } from "@olliethedev/yar";
import { useQuery } from "@tanstack/react-query";

// Components
const MessagesPage = ({ data }: { data: any }) => (
  <div>{/* Render messages */}</div>
);

// Create and export the client plugin with full type inference
export const messagesClientPlugin = defineClientPlugin({
  name: "messages",
  routes: () => ({
    // Use Yar's createRoute for proper route creation
    messagesList: createRoute(
      "/messages",
      () => ({
        PageComponent: MessagesPage,
        loader: async () => {
          const response = await fetch("/api/messages");
          return response.json();
        },
        meta: (data) => [
          { name: "title", content: "Messages" },
          { name: "description", content: `${data.length} messages` },
        ],
      })
    ),
  }),
  hooks: () => ({
    useMessages: () => {
      // Use React Query or your preferred data fetching library
      return useQuery({
        queryKey: ["messages"],
        queryFn: async () => {
          const response = await fetch("/api/messages");
          return response.json();
        },
      });
    },
  }),
});
```

> **💡 Type Safety Tip:** Using `defineClientPlugin` and `defineBackendPlugin` helpers ensures full type inference without needing type annotations or casts. Your route keys, hook names, and endpoint types are automatically preserved!

### Using Your Plugins

Backend and client plugins are used independently in their respective contexts:

#### Backend Usage

```typescript
// app/api/route.ts (Backend only)
import { betterStack } from "@olliethedev/better-stack/api";
import { messagesBackendPlugin } from "./plugins/messages/backend";
import { createMemoryAdapter } from "@better-db/adapter-memory";

const api = betterStack({
  plugins: {
    messages: messagesBackendPlugin,
  },
  adapter: createMemoryAdapter,
});

export const GET = api.handler;
export const POST = api.handler;
```

#### Client Usage

```typescript
// app/lib/client.ts (Client only)
import { createStackClient } from "@olliethedev/better-stack/client";
import { messagesClientPlugin } from "./plugins/messages/client";

const client = createStackClient({
  plugins: {
    messages: messagesClientPlugin,
  },
});

export const { router, hooks } = client;

// Use in components
// const { useMessages } = hooks.messages;
```

## Core Concepts

### 1. Plugins

Plugins are self-contained features that can be composed together. Each plugin can provide:

- **Database Schema** - Table definitions using Better DB
- **API Endpoints** - Type-safe REST endpoints using Better Call
- **Client Routes** - Page routing using Yar Router
- **React Hooks** - Data fetching and mutations

### 2. Adapters

Adapters connect your plugins to different databases:

```typescript
// Memory (for testing)
import { createMemoryAdapter } from "@better-db/adapter-memory";

// PostgreSQL
import { createPgAdapter } from "@better-db/adapter-pg";

// MongoDB
import { createMongoAdapter } from "@better-db/adapter-mongo";

const api = betterStack({
  plugins: { /* ... */ },
  adapter: createMemoryAdapter, // or createPgAdapter, createMongoAdapter
});
```

### 3. Type Safety

Better Stack provides end-to-end type safety with automatic type inference:

```typescript
// ✅ Backend: Route keys and endpoint types are preserved
const myPlugin = defineBackendPlugin({
  name: "users",
  routes: (adapter) => ({
    getUser: createEndpoint(
      "/users/:id",
      {
        method: "GET",
        params: z.object({ id: z.string() }),
      },
      async ({ params }) => {
        // params.id is typed as string
        return { status: 200, body: { id: params.id, name: "John" } };
      }
    ),
    listUsers: createEndpoint(/* ... */),
  })
});
// Type: BackendPlugin<{ getUser: Endpoint, listUsers: Endpoint }>

// ✅ Client: Route keys and hook types are preserved
const myClientPlugin = defineClientPlugin({
  name: "users",
  routes: () => ({
    userProfile: { path: "/users/:id", Component: UserProfile },
    usersList: { path: "/users", Component: UsersList },
  }),
  hooks: () => ({
    useUser: (id: string) => { /* ... */ },
    useUsers: () => { /* ... */ },
  })
});
// Routes "userProfile" and "usersList" are fully typed!
// Hooks "useUser" and "useUsers" are accessible via hooks.users.*

```

## Plugin Utilities

Better Stack exports utilities for building plugins:

```typescript
// Type-safe plugin helpers (recommended)
import {
  defineBackendPlugin,
  defineClientPlugin,
} from "@olliethedev/better-stack/plugins";

// Type definitions for backend plugins
import type {
  BackendPlugin,
  Adapter,
  DatabaseDefinition,
  Endpoint,
  Router,
} from "@olliethedev/better-stack/plugins";

// Type definitions for client plugins
import type {
  ClientPlugin,
  Route,
} from "@olliethedev/better-stack/plugins";

// Utilities (can be used in both)
import {
  createApiClient,
  getServerBaseURL,
} from "@olliethedev/better-stack/plugins";
```

### Type-Safe Plugin Helpers

Use `defineBackendPlugin` and `defineClientPlugin` for automatic type inference:

```typescript
// ✅ Recommended: Full type inference, no casts needed
const myPlugin = defineBackendPlugin({
  name: "myFeature",
  routes: (adapter) => ({
    list: endpoint(...),
    create: endpoint(...),
  })
});
// Route keys "list" and "create" are fully typed!

// ❌ Old way: Manual type annotation
const myPlugin: BackendPlugin = {
  name: "myFeature",
  routes: (adapter) => ({
    list: endpoint(...),
    create: endpoint(...),
  })
};
// Route keys are erased to generic Record<string, Endpoint>
```

### Why Separate Backend and Client Plugins?

**Traditional Approach (Unified Plugin):**
```typescript
// ❌ This can cause SSR issues and bundle bloat
export const myPlugin = {
  backend: { /* server-side code */ },
  client: { /* client-side code */ },
};
```

**Better Stack Approach (Separated Plugins):**
```typescript
// ✅ Backend stays on the server
// plugins/my-plugin/backend.ts
export const myBackendPlugin: BackendPlugin = { /* ... */ };

// ✅ Client stays on the client
// plugins/my-plugin/client.ts
export const myClientPlugin: ClientPlugin = { /* ... */ };
```

**Benefits:**
1. **No SSR Issues** - Server code never reaches the client bundle
2. **Better Code Splitting** - Frontend and backend can be deployed separately
3. **Smaller Bundles** - Client bundles don't include server dependencies
4. **Independent Versioning** - Update backend without touching frontend
5. **Type Safety** - TypeScript ensures correct usage in each context

### API Client Utility

Create a typed API client for server-side or client-side requests:

```typescript
import { createApiClient } from "@olliethedev/better-stack/plugins";

// For server-side (SSR)
const api = createApiClient({
  baseURL: "http://localhost:3000",
  basePath: "/api",
});

// For client-side (uses relative URLs)
const api = createApiClient({
  basePath: "/api",
});
```

## Testing Your Plugins

Better Stack includes comprehensive testing utilities:

```typescript
// __tests__/my-plugin.test.ts
import { describe, it, expect } from "vitest";
import { betterStack } from "@olliethedev/better-stack/api";
import { createMemoryAdapter } from "@better-db/adapter-memory";
import { myBackendPlugin } from "../plugins/my-plugin/backend";

describe("My Backend Plugin", () => {
  it("should create and retrieve items", async () => {
    // Adapter wrapper for testing
    const testAdapter = (db) => createMemoryAdapter(db)({});
    
    const api = betterStack({
      plugins: { myFeature: myBackendPlugin },
      adapter: testAdapter,
    });

    // Create an item
    const createResponse = await api.handler(
      new Request("http://localhost:3000/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Item" }),
      })
    );

    expect(createResponse.status).toBe(201);

    // Retrieve items
    const listResponse = await api.handler(
      new Request("http://localhost:3000/api/items", {
        method: "GET",
      })
    );

    const items = await listResponse.json();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Test Item");
  });
});
```

## Framework Integration

### Next.js App Router

```typescript
// app/api/[...route]/route.ts
import { betterStack } from "@olliethedev/better-stack/api";

const api = betterStack({
  plugins: { /* ... */ },
  adapter: /* ... */,
});

export const GET = api.handler;
export const POST = api.handler;
export const PUT = api.handler;
export const DELETE = api.handler;
export const PATCH = api.handler;
```

### Next.js Pages Router

```typescript
// pages/api/[...route].ts
import { betterStack } from "@olliethedev/better-stack/api";

const api = betterStack({
  plugins: { /* ... */ },
  adapter: /* ... */,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const request = new Request(
    `http://localhost:3000${req.url}`,
    {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    }
  );

  const response = await api.handler(request);
  const data = await response.json();

  res.status(response.status).json(data);
}
```

### Standalone Express/Node.js

```typescript
import express from "express";
import { betterStack } from "@olliethedev/better-stack/api";

const api = betterStack({
  plugins: { /* ... */ },
  adapter: /* ... */,
});

const app = express();

app.all("/api/*", async (req, res) => {
  const request = new Request(`http://localhost:3000${req.url}`, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
  });

  const response = await api.handler(request);
  const data = await response.json();

  res.status(response.status).json(data);
});

app.listen(3000);
```

## Architecture

Better Stack is built on top of proven libraries:

```
┌─────────────────────────────────────────┐
│           Better Stack                   │
│  (Plugin Composition & Type Safety)     │
├─────────────────────────────────────────┤
│  Better Call  │  Better DB  │  Yar      │
│  (API Layer)  │  (Database) │  (Router) │
└─────────────────────────────────────────┘
```

### Core Libraries

- **[Better Call](https://github.com/olliethedev/better-call)** - Type-safe API endpoints with automatic request/response handling
- **[Better DB](https://github.com/olliethedev/better-auth)** - Schema-first database ORM with multiple adapter support
- **[Yar Router](https://github.com/olliethedev/yar)** - Lightweight client-side router for React

## Publishing Your Plugin

Want to share your plugin with the community? Publish backend and client as separate packages for maximum flexibility.

### Publishing Backend Plugin

1. Create backend package:
```bash
mkdir my-plugin-backend
cd my-plugin-backend
npm init
```

2. Structure:
```
my-plugin-backend/
├── src/
│   └── index.ts      # Export BackendPlugin
├── package.json
└── tsconfig.json
```

3. Add peer dependencies:
```json
{
  "name": "@yourorg/my-plugin-backend",
  "peerDependencies": {
    "@olliethedev/better-stack": "^0.0.3",
    "@better-db/core": "^1.3.37",
    "better-call": "^1.0.19"
  }
}
```

### Publishing Client Plugin

1. Create client package:
```bash
mkdir my-plugin-client
cd my-plugin-client
npm init
```

2. Structure:
```
my-plugin-client/
├── src/
│   └── index.tsx     # Export ClientPlugin
├── package.json
└── tsconfig.json
```

3. Add peer dependencies:
```json
{
  "name": "@yourorg/my-plugin-client",
  "peerDependencies": {
    "@olliethedev/better-stack": "^0.0.3",
    "@olliethedev/yar": "^1.1.0",
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

4. Users can install only what they need:
```bash
# Server-only deployment
npm install @yourorg/my-plugin-backend

# Client-only deployment
npm install @yourorg/my-plugin-client

# Full-stack deployment
npm install @yourorg/my-plugin-backend @yourorg/my-plugin-client
```

## Examples

Check out example plugins and applications:

- **Messages Plugin** - See `src/__tests__/plugins.test.ts` for a complete example
- **Coming Soon**: Example applications in the `examples/` directory

## API Reference

### Backend API

```typescript
betterStack(config: BackendLibConfig): BackendLib
```

Creates a backend instance with plugins and returns an API handler.

**Parameters:**
- `plugins` - Record of plugin instances
- `adapter` - Database adapter function
- `dbSchema` - (Optional) Additional database schema

**Returns:**
- `handler` - Request handler for your framework
- `router` - Better Call router instance
- `dbSchema` - Combined database schema

### Client API

```typescript
createStackClient<TPlugins>(config: ClientLibConfig<TPlugins>): ClientLib
```

Creates a client instance with plugins and returns router and hooks.

**Parameters:**
- `plugins` - Record of plugin instances
- `baseURL` - (Optional) Base URL for API calls
- `basePath` - (Optional) API path prefix (default: "/api")

**Returns:**
- `router` - Yar router instance
- `hooks` - Plugin hooks organized by plugin name

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [olliethedev](https://github.com/olliethedev)

## Support

- 📖 [Documentation](https://github.com/olliethedev/better-stack)
- 🐛 [Issue Tracker](https://github.com/olliethedev/better-stack/issues)
- 💬 [Discussions](https://github.com/olliethedev/better-stack/discussions)

---

<div align="center">
  <strong>Built with ❤️ using Better Stack</strong>
</div>
