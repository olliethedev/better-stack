# @BTST - Better Stack

<div align="center">

**Composable full-stack plugin system for React frameworks**

[![npm version](https://img.shields.io/npm/v/@btst/stack.svg)](https://www.npmjs.com/package/@btst/stack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[📖 Documentation](https://www.better-stack.ai/docs) • [🐛 Issues](https://github.com/better-stack-ai/better-stack/issues)

</div>

---

## What Problem Does This Solve?

Your app needs a blog. Or a scheduling system. Or user feedback collection. Or an AI assistant. These are **horizontal features**—capabilities that cut across your entire app, not specific to your core domain.

Building them from scratch means weeks of work: routes, API endpoints, database schemas, authentication, SSR, metadata, hooks, forms, error handling...

Better Stack lets you **add these features in minutes** as composable plugins that work across any React framework.

- **Composable architecture** - Mix and match features like LEGO blocks. Add blog + scheduling + feedback + newsletters, all working together seamlessly
- **Framework agnostic** - One feature works with Next.js App Router, React Router, TanStack Router, Remix—switch frameworks without rewriting
- **Plugin overrides** - Leverage framework-specific features via overrides. Use Next.js `Image` and `Link`, React Router's `Link`, or any framework's components
- **Full-stack in one package** - Each feature includes routes, API endpoints, database schemas, React components, hooks, loaders, and metadata
- **Zero boilerplate** - No wiring up routes, API handlers, or query clients. Just configure and it works
- **First-class SSR** - Server-side rendering, data prefetching, and SEO metadata generation built-in
- **Lifecycle hooks** - Intercept at any point: authorization, data transformation, analytics, caching, webhooks
- **Horizontal features** - Perfect for blog, scheduling, feedback, newsletters, AI assistants, comments—anything reusable across apps

## What Can You Add?

**Blog** - Content management, editor, drafts, publishing, SEO, RSS feeds

**Scheduling** - Calendar views, time slot booking, availability management, reminders

**Feedback** - In-app feedback widgets, user surveys, bug reporting, feature requests

**Newsletters** - Subscriber management, email campaigns, unsubscribe handling, analytics

**AI Assistant** - Chat interfaces, prompt templates, conversation history, streaming responses

**Comments** - Threaded discussions, moderation, reactions, notifications

And any other horizontal feature your app needs. Each comes with a complete UI, backend, and data layer.

## Installation

```bash
npm install @btst/stack
```

For database schema management, install the CLI:

```bash
npm install -D @btst/cli
```

The CLI helps generate migrations, Prisma schemas, and other database artifacts from your plugin schemas.

## Quick Example: Add a Blog to Next.js

### 1. Backend API (`lib/better-stack.ts`)

```ts
import { betterStack } from "@btst/stack"
import { blogBackendPlugin } from "@btst/stack/plugins/blog/api"
import { createPrismaAdapter } from "@btst/adapter-prisma"

const { handler, dbSchema } = betterStack({
  basePath: "/api/data",
  plugins: {
    blog: blogBackendPlugin()
  },
  adapter: (db) => createPrismaAdapter(db)({})
})

export { handler, dbSchema }
```

**Note:** `betterStack()` returns both `handler` and `dbSchema`. The `dbSchema` contains all merged database schemas from your plugins. Use [@btst/cli](https://www.npmjs.com/package/@btst/cli) to generate migrations, Prisma schemas, or other database artifacts from your `dbSchema`.

For example, to generate a Prisma schema from your `dbSchema`:

```bash
npx @btst/cli generate --orm prisma --config lib/better-db.ts --output prisma/schema.prisma --filter-auth
```

This reads your `dbSchema` export and generates the corresponding Prisma schema file.

### 2. API Route (`app/api/[[...]]/route.ts`)

```ts
import { handler } from "@/lib/better-stack"

export const GET = handler
export const POST = handler
```

### 3. Client Setup (`lib/better-stack-client.tsx`)

```ts
import { createStackClient } from "@btst/stack/client"
import { blogClientPlugin } from "@btst/stack/plugins/blog/client"

export const getStackClient = (queryClient: QueryClient) => {
  return createStackClient({
    plugins: {
      blog: blogClientPlugin({
        queryClient,
        apiBaseURL: baseURL,
        apiBasePath: "/api/data",
        siteBaseURL: baseURL,
        siteBasePath: "/pages"
      })
    }
  })
}
```

### 4. Page Handler (`app/pages/[[...all]]/page.tsx`)

```ts
export default async function Page({ params }) {
  const path = `/${(await params).all?.join("/") || ""}`
  const stackClient = getStackClient(queryClient)
  const route = stackClient.router.getRoute(path)
  
  if (route?.loader) await route.loader()
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientRouteResolver path={path} />
    </HydrationBoundary>
  )
}
```

### 5. Layout Provider (`app/pages/[[...all]]/layout.tsx`)

```ts
import { BetterStackProvider } from "@btst/stack/context"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function Layout({ children }) {
  const router = useRouter()
  
  return (
    <BetterStackProvider
      basePath="/pages"
      overrides={{
        blog: {
          // Use Next.js optimized Image component
          Image: (props) => (
            <Image
              alt={props.alt || ""}
              src={props.src || ""}
              width={400}
              height={300}
            />
          ),
          // Use Next.js Link for client-side navigation
          navigate: (path) => router.push(path),
          refresh: () => router.refresh()
        }
      }}
    >
      {children}
    </BetterStackProvider>
  )
}
```

### 6. Sitemap Generation (`app/sitemap.ts`)

```ts
import type { MetadataRoute } from "next"
import { QueryClient } from "@tanstack/react-query"
import { getStackClient } from "@/lib/better-stack-client"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const queryClient = new QueryClient()
  const stackClient = getStackClient(queryClient)
  const entries = await stackClient.generateSitemap()

  return entries.map((e) => ({
    url: e.url,
    lastModified: e.lastModified,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }))
}
```

**That's it.** Your blog feature is live with:
- ✅ `/blog` - Post listing page
- ✅ `/blog/[slug]` - Individual post pages  
- ✅ `/blog/new` - Create post editor
- ✅ `/blog/[slug]/edit` - Edit post page
- ✅ Full CRUD API (`/api/data/blog/*`)
- ✅ Server-side rendering
- ✅ Automatic metadata generation
- ✅ Automatic sitemap generation
- ✅ React Query hooks (`usePosts`, `usePost`, etc.)

Now add scheduling, feedback, or newsletters the same way. Each feature is independent and composable.

## The Bigger Picture

Better Stack transforms how you think about building apps:

- **Open source** - Share complete features, not just code snippets. Someone can add a newsletter plugin to their Next.js app in minutes
- **Fast development** - Add 5 features in an afternoon instead of 5 weeks. Validate ideas faster
- **Agencies** - Create a library of reusable features. Drop scheduling into client A's app, feedback into client B's app.
- **SaaS platforms** - Offer feature plugins your customers can compose. They pick blog + scheduling + AI assistant, mix and match to build their ideal app


Each plugin is a complete, self-contained horizontal full-stack feature. No framework lock-in. Just add it and it works.

## Learn More

For complete documentation, examples, and plugin development guides, visit **[https://www.better-stack.ai](https://www.better-stack.ai)**

## Examples

- [Next.js App Router](./examples/nextjs) - Next.js App Router example
- [React Router](./examples/react-router) - React Router example
- [TanStack Router](./examples/tanstack) - TanStack Router example

## License

MIT © [olliethedev](https://github.com/olliethedev)
