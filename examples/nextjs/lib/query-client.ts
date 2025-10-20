import {
    QueryClient,
    defaultShouldDehydrateQuery,
    isServer
} from "@tanstack/react-query"

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 0,
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

export function getOrCreateQueryClient() {
    // Always return a new QueryClient. This avoids carrying client cache
    // across navigations, which can cause hydration mismatches when SSR data
    // differs from previously cached client data.
    return makeQueryClient()
} 