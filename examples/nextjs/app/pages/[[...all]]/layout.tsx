"use client"
import { BetterStackProvider } from "@btst/stack/context"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { TodosPluginOverrides } from "@/lib/plugins/todo/client/overrides"
import { getOrCreateQueryClient } from "@/lib/query-client"
import { BlogPluginOverrides } from "@btst/stack/plugins/blog/client"

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
    // fresh instance to avoid stale client cache overriding hydrated data
    const [queryClient] = useState(() => getOrCreateQueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            <BetterStackProvider<PluginOverrides>
                basePath="/pages"
                overrides={{
                    todos: {
                        Link: (props: React.ComponentProps<typeof Link>) => {
                            return <Link data-testid="link" {...props} />
                        },
                        navigate: (path) => router.push(path)
                    },
                    blog: {
                        navigate: (path) => router.push(path),
                        refresh: () => router.refresh(),
                        uploadImage: async (file) => {
                            console.log("uploadImage", file)
                            return "https://placehold.co/400/png"
                        },
                        Image: (props) => {
                            const { alt = "", src = "" } = props as React.ImgHTMLAttributes<HTMLImageElement>
                            return (
                                <Image
                                    alt={alt}
                                    src={typeof src === "string" ? src : ""}
                                    width={400}
                                    height={300}
                                />
                            )
                        }
                    }
                }}
            >
                {children}
            </BetterStackProvider>
        </QueryClientProvider>
    )
}

