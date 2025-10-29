
import { BetterStackProvider } from "@btst/stack/context"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BlogPluginOverrides } from "@btst/stack/plugins/blog/client"
import { Link, useRouter, Outlet, createFileRoute } from "@tanstack/react-router"

const baseURL =  process.env.BASE_URL || "http://localhost:3000"

// Define the shape of all plugin overrides
type PluginOverrides = {
    blog: BlogPluginOverrides,
}

export const Route = createFileRoute('/pages')({
    component: Layout,
    ssr: true,
    notFoundComponent: () => {
        return <p>This page doesn't exist!</p>
    },
})

function Layout() {
    const router = useRouter()
    const context = Route.useRouteContext()

    return (
        <QueryClientProvider client={context.queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            <BetterStackProvider<PluginOverrides>
                basePath="/pages"
                overrides={{
                    blog: {
                        apiBaseURL: baseURL,
                        apiBasePath: "/api/data",
                        navigate: (href) => router.navigate({ href }),
                        uploadImage: async (file) => {
                            console.log("uploadImage", file)
                            return "https://placehold.co/400/png"
                        },
                        Link: ({ href, children, className, ...props }) => (
                            <Link to={href} className={className} {...props}>
                              {children}
                            </Link>
                          ),
                    }
                }}
            >
                <Outlet />
            </BetterStackProvider>
        </QueryClientProvider>
    )
}

