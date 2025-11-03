import {
    QueryClient,
    isServer
} from "@tanstack/react-query"
import { cache } from "react"

function makeQueryClient() {
    return new QueryClient({
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
                // Include both successful and error states to avoid refetching on the client
                // This prevents loading states when there's an error in prefetched data
                shouldDehydrateQuery: (query) => {
                    return query.state.status === 'success' || query.state.status === 'error';
                }
            }
        }
    })
}

let browserQueryClient: QueryClient | undefined = undefined

// Cache the QueryClient for the duration of the request on the server
// This ensures generateMetadata and the page component get the same instance
const getServerQueryClient = cache(() => makeQueryClient())

export function getOrCreateQueryClient() {
    if (isServer) {
        // Server: use cached query client for this request
        // React's cache() ensures the same instance is used for generateMetadata + page component
        return getServerQueryClient()
        // biome-ignore lint/style/noUselessElse: <explanation>
    } else {
        // Browser: make a new query client if we don't already have one
        // This is very important, so we don't re-make a new client if React
        // suspends during the initial render. This may not be needed if we
        // have a suspense boundary BELOW the creation of the query client
        if (!browserQueryClient) browserQueryClient = makeQueryClient()
        return browserQueryClient
    }
} 