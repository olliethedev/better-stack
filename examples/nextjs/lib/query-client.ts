import { QueryClient } from "@tanstack/react-query"

// Create a new QueryClient for each server-side request
export const makeQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000 // 1 minute
            }
        }
    })
}
