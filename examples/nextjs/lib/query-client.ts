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
                // only dehydrate successful/error states to avoid initial suspense on the client
                shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query)
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