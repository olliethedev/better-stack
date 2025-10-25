
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { DehydratedState } from "@tanstack/react-query"
import { notFound } from "next/navigation"
import { getOrCreateQueryClient } from "@/lib/query-client"
import { getStackClient } from "@/lib/better-stack-client"
import { ClientRouteResolver } from "@/lib/route-resolver"

const baseURL =  process.env.BASE_URL || "http://localhost:3000"

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
        // Pass SSR-specific baseURL and queryClient
        await route.loader({ baseURL })
    }
    
    const dehydratedState: DehydratedState = dehydrate(queryClient)
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
        await route.loader({ baseURL })
    }
    
    // Pass same queryClient to meta so it can read the loaded data
    return metaElementsToObject(route.meta())
}

function metaElementsToObject(
    metaElements: Array<React.JSX.IntrinsicElements["meta"] | undefined>
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata: any = { title: "" }

    // Handlers for meta name= mappings
    const nameHandlers: Record<string, (content: string) => void> = {
        title: (c) => {
            metadata.title = c
        },
        description: (c) => {
            metadata.description = c
        },
        keywords: (c) => {
            const parts = c
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean)
            metadata.keywords = parts.length > 0 ? parts : undefined
        },
        "application-name": (c) => {
            metadata.applicationName = c
        },
        generator: (c) => {
            metadata.generator = c
        },
        referrer: (c) => {
            const allowedReferrers = new Set([
                "no-referrer",
                "origin",
                "no-referrer-when-downgrade",
                "origin-when-cross-origin",
                "same-origin",
                "strict-origin",
                "strict-origin-when-cross-origin",
                "unsafe-url"
            ])
            if (allowedReferrers.has(c)) {
                metadata.referrer = c as never
            }
        },
        "theme-color": (c) => {
            metadata.themeColor = c
        },
        viewport: (c) => {
            metadata.viewport = c
        },
        creator: (c) => {
            metadata.creator = c
        },
        publisher: (c) => {
            metadata.publisher = c
        },
        author: (c) => {
            metadata.authors = [{ name: c }]
        },
        abstract: (c) => {
            metadata.abstract = c
        },
        robots: (c) => {
            metadata.robots = c
        },
        // Twitter
        "twitter:title": (c) => {
            if (!metadata.twitter) metadata.twitter = {}
            metadata.twitter.title = c
        },
        "twitter:description": (c) => {
            if (!metadata.twitter) metadata.twitter = {}
            metadata.twitter.description = c
        },
        "twitter:site": (c) => {
            if (!metadata.twitter) metadata.twitter = {}
            metadata.twitter.site = c
        },
        "twitter:creator": (c) => {
            if (!metadata.twitter) metadata.twitter = {}
            metadata.twitter.creator = c
        },
        "twitter:image": (c) => {
            if (!metadata.twitter) metadata.twitter = {}
            const currentImages = metadata.twitter.images
            if (!currentImages) {
                metadata.twitter.images = [c]
            } else if (Array.isArray(currentImages)) {
                metadata.twitter.images = [...currentImages, c]
            } else {
                metadata.twitter.images = [currentImages, c]
            }
        }
    }

    // Handlers for meta property= (Open Graph)
    const propertyHandlers: Record<string, (content: string) => void> = {
        "og:title": (c) => {
            if (!metadata.openGraph) metadata.openGraph = {}
            metadata.openGraph.title = c
        },
        "og:description": (c) => {
            if (!metadata.openGraph) metadata.openGraph = {}
            metadata.openGraph.description = c
        },
        "og:url": (c) => {
            if (!metadata.openGraph) metadata.openGraph = {}
            metadata.openGraph.url = c
            metadata.alternates = {
                ...(metadata.alternates ?? {}),
                canonical: c
            }
        },
        "og:site_name": (c) => {
            if (!metadata.openGraph) metadata.openGraph = {}
            metadata.openGraph.siteName = c
        },
        "og:locale": (c) => {
            if (!metadata.openGraph) metadata.openGraph = {}
            metadata.openGraph.locale = c
        },
        "og:image": (c) => {
            if (!metadata.openGraph) metadata.openGraph = {}
            const currentImages = metadata.openGraph.images
            if (!currentImages) {
                metadata.openGraph.images = [c]
            } else if (Array.isArray(currentImages)) {
                metadata.openGraph.images = [...currentImages, c]
            } else {
                metadata.openGraph.images = [currentImages, c]
            }
        },
        "og:video": (c) => {
            if (!metadata.openGraph) metadata.openGraph = {}
            const currentVideos = metadata.openGraph.videos
            if (!currentVideos) {
                metadata.openGraph.videos = [c]
            } else if (Array.isArray(currentVideos)) {
                metadata.openGraph.videos = [...currentVideos, c]
            } else {
                metadata.openGraph.videos = [currentVideos, c]
            }
        },
        "og:audio": (c) => {
            if (!metadata.openGraph) metadata.openGraph = {}
            const currentAudio = metadata.openGraph.audio
            if (!currentAudio) {
                metadata.openGraph.audio = [c]
            } else if (Array.isArray(currentAudio)) {
                metadata.openGraph.audio = [...currentAudio, c]
            } else {
                metadata.openGraph.audio = [currentAudio, c]
            }
        }
    }

    for (const meta of metaElements) {
        if (!meta) continue

        // name-based
        if ("name" in meta && "content" in meta) {
            const handler = nameHandlers[String(meta.name)]
            if (handler) handler(String(meta.content))
            continue
        }

        // property-based (Open Graph)
        if ("property" in meta && "content" in meta) {
            const handler = propertyHandlers[String(meta.property)]
            if (handler) handler(String(meta.content))
            continue
        }
    }

    return metadata
}
