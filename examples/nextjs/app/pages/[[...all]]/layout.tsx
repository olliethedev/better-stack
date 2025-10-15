"use client"
import { BetterStackProvider } from "@btst/stack/context"
import { QueryClientProvider } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { TodosPluginOverrides } from "@/lib/plugins/todo/client/overrides"
import { makeQueryClient } from "@/lib/query-client"

// Define the shape of all plugin overrides
type PluginOverrides = {
    todos: TodosPluginOverrides
}

export default function ExampleLayout({
    children
}: {
    children: React.ReactNode
}) {
    // Create a stable QueryClient instance for the client-side
    const [queryClient] = useState(() => makeQueryClient())
    const router = useRouter()

    return (
        <QueryClientProvider client={queryClient}>
            <BetterStackProvider<PluginOverrides>
                basePath="/pages"
                overrides={{
                    todos: {
                        Link: LinkComponent,
                        navigate: (path) => router.push(path)
                    }
                }}
            >
                {children}
            </BetterStackProvider>
        </QueryClientProvider>
    )
}

const LinkComponent = (props: React.ComponentProps<typeof Link>) => {
    return <Link data-testid="link" {...props} />
}
