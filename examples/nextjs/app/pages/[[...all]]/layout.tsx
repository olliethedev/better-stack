"use client"
import { BetterStackProvider } from "@btst/stack/context"
import { QueryClientProvider } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { TodosPluginOverrides } from "@/lib/plugins/todo/client/overrides"
import { makeQueryClient } from "@/lib/query-client"
import { BlogPluginOverrides } from "@btst/stack/plugins/blog/client"

const queryClient = makeQueryClient()

// Define the shape of all plugin overrides
type PluginOverrides = {
    todos: TodosPluginOverrides
    blog: BlogPluginOverrides,
}

export default function ExampleLayout({
    children
}: {
    children: React.ReactNode
}) {
    const router = useRouter()

    return (
        <QueryClientProvider client={queryClient}>
            <BetterStackProvider<PluginOverrides>
                basePath="/pages"
                overrides={{
                    todos: {
                        Link: LinkComponent,
                        navigate: (path) => router.push(path)
                    },
                    blog: {
                        navigate: (path) => router.push(path),
                        uploadImage: async (file) => {
                            console.log("uploadImage", file)
                            return "https://placehold.co/400/png"
                        },
                        Image: (props) => {
                            return <img {...props} />
                        }
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
