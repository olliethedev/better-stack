
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { DehydratedState } from "@tanstack/react-query"
import { notFound } from "next/navigation"
import { getOrCreateQueryClient } from "@/lib/query-client"
import { getStackClient } from "@/lib/better-stack-client"
import { ClientRouteResolver } from "@/lib/route-resolver"
import { metaElementsToObject } from "@btst/stack/client"
import { Metadata } from "next"


export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ExamplePage({
    params
}: {
    params: Promise<{ all: string[] }>
}) {
    const pathParams = await params
    const path = pathParams?.all ? `/${pathParams.all.join("/")}` : "/"

    // Create a queryClient for this request
    const queryClient = getOrCreateQueryClient()

    const stackClient = getStackClient(queryClient)

    const route = stackClient.router.getRoute(path)

    // Load data server-side if loader exists
    if (route?.loader) {
        await route.loader()
    }
    
    // Dehydrate with errors included so client doesn't refetch on error
    const dehydratedState: DehydratedState = dehydrate(queryClient, {
        shouldDehydrateQuery: (query) => {
            // Include both successful and failed queries
            // This prevents refetching on the client when there's an error
            return query.state.status === 'success' || query.state.status === 'error';
        },
    })
    console.log("[SSR] Dehydrated queries:", Object.keys(dehydratedState.queries || {}).length, "queries")
    if (dehydratedState.queries && dehydratedState.queries.length > 0) {
        dehydratedState.queries.forEach((q) => {
            console.log("[SSR] - Query:", JSON.stringify(q.queryKey), "state:", q.state.status)
        })
    }

    // Pass path to client resolver which has access to router via closure
    return (
        <HydrationBoundary state={dehydratedState}>
            {route ? <ClientRouteResolver path={path} /> : notFound()}
        </HydrationBoundary>
    )

}

//meta
export async function generateMetadata({ params }: { params: Promise<{ all: string[] }> }) {
    const pathParams = await params
    const path = pathParams?.all ? `/${pathParams.all.join("/")}` : "/"
    // Create a queryClient for this request
    const queryClient = getOrCreateQueryClient()
    const stackClient = getStackClient(queryClient)
    const route = stackClient.router.getRoute(path)
    if (!route) {
        return notFound()
    }
    if (!route.meta) {
        return {
            title: "No meta for this route"
        }
    }
    
    // Load data for metadata if loader exists
    if (route?.loader) {
        await route.loader()
    }
    
    return metaElementsToObject(route.meta()) satisfies Metadata
}
