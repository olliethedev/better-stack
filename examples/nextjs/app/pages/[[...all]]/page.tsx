
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { notFound } from "next/navigation"
import { makeQueryClient } from "@/lib/query-client"
import { router } from "@/lib/better-stack-client"

const baseURL = process.env.BASE_URL ?? "http://localhost:3000"

export default async function ExamplePage({
    params
}: {
    params: Promise<{ all: string[] }>
}) {
    const pathParams = await params
    const path = pathParams?.all ? `/${pathParams.all.join("/")}` : "/"


    const route = router.getRoute(path)

    if (!route) {
        return notFound()
    }

    const { PageComponent, loader } = route
    const queryClient = makeQueryClient()

    if (loader) {
        await loader(queryClient, baseURL)
    }
    if (!PageComponent) {
        return notFound()
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <PageComponent />
        </HydrationBoundary>
    )

}
