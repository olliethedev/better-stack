// src/router.tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { QueryClient, isServer, defaultShouldDehydrateQuery } from '@tanstack/react-query'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'


export interface MyRouterContext {
  queryClient: QueryClient
}

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // SSR: 60s staleTime allows generateMetadata and page component to share cached data
            // Client: 0 staleTime means always refetch on navigation for fresh data
            staleTime: isServer ? 60 * 1000 : 0,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: false
        },
        dehydrate: {
            // only dehydrate successful/error states to avoid initial suspense on the client
            shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query)
        }
    }
})
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: false,
    context: {
      queryClient,
    },
    notFoundMode: "root",
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    // optional:
    // handleRedirects: true,
    // wrapQueryClient: true,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}