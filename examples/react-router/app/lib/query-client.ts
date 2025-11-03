import {
    QueryClient,
    defaultShouldDehydrateQuery,
    isServer
} from "@tanstack/react-query"

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Use a longer staleTime to prevent immediate refetches after hydration
                staleTime: 1000 * 60 * 5, // 5 minutes
                // Don't refetch on mount if we have data (prevents loading state after hydration)
                refetchOnMount: false,
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
                retry: false
            },
            dehydrate: {
                // include pending queries in dehydration
                shouldDehydrateQuery: (query) =>
                    defaultShouldDehydrateQuery(query) ||
                    query.state.status === "pending"
            }
        }
    })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getOrCreateQueryClient() {
    if (isServer) {
        // Server: always make a new query client
        return makeQueryClient()
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