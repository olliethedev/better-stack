import { createStackClient } from "@btst/stack/client"
import { todosClientPlugin } from "@/lib/plugins/todo/client/client"
import { blogClientPlugin } from "@btst/stack/plugins/blog/client"
import { getOrCreateQueryClient } from "@/lib/query-client"

const baseURL = process.env.BASE_URL ?? "http://localhost:3000"
const queryClient = getOrCreateQueryClient()

// Create the client library with plugins
const lib = createStackClient({
    plugins: {
        todos: todosClientPlugin({
            queryClient,
            baseURL,
            basePath: "/api",
        }),
        blog: blogClientPlugin({
            // Required config - provided once at plugin initialization
            queryClient,
            baseURL,
            basePath: "/api",
            
            // Optional: context to pass to loaders (for SSR)
            // This can be set per-request in page.tsx if needed
            context: {
                // user: await getUser(),
            },
            
            // Optional: hooks
            hooks: {
                // Route authorization hooks - called before rendering
                canViewPosts: async (context) => {
                    console.log("canViewPosts: checking access for", context.path);
                    return true;
                },
                canViewDrafts: async (context) => {
                    console.log("canViewDrafts: checking auth for", context.path);
                    // const session = await getSession();
                    // return session?.user.isAdmin ?? false;
                    return true;
                },
                canCreatePost: async (context) => {
                    console.log("canCreatePost: checking permissions for", context.path);
                    return true;
                },
                canEditPost: async (slug, context) => {
                    console.log("canEditPost: checking permissions for", slug, context.path);
                    return true;
                },

                // Loader hooks - called during data fetching (SSR)
                beforeLoadPosts: async (filter, context) => {
                    console.log(
                        `[${context.isSSR ? 'SSR' : 'CSR'}] beforeLoadPosts:`,
                        filter.published ? 'published' : 'drafts'
                    );
                    if (!filter.published) {
                        // Check auth for drafts
                    }
                    return true;
                },
                afterLoadPosts: async (posts, filter, context) => {
                    console.log(
                        `[${context.isSSR ? 'SSR' : 'CSR'}] afterLoadPosts:`,
                        filter.published ? 'published' : 'drafts',
                        posts?.length || 0,
                        'posts loaded'
                    );
                },
                beforeLoadPost: async (slug, context) => {
                    console.log(
                        `[${context.isSSR ? 'SSR' : 'CSR'}] beforeLoadPost:`,
                        slug
                    );
                    return true;
                },
                afterLoadPost: async (post, slug, context) => {
                    console.log(
                        `[${context.isSSR ? 'SSR' : 'CSR'}] afterLoadPost:`,
                        slug,
                        post?.title || 'not found'
                    );
                },
                onLoadError: async (error, context) => {
                    console.error(
                        `[${context.isSSR ? 'SSR' : 'CSR'}] Load error:`,
                        error.message
                    );
                },

                // Navigation hooks
                onNavigateToPosts: async (context) => {
                    console.log("Navigating to posts list for", context.path);
                },
                onNavigateToNewPost: async (context) => {
                    console.log("Navigating to new post form for", context.path);
                },

                // Lifecycle hooks
                onRouteRender: async (routeName, context) => {
                    console.log("Route rendered:", routeName, context.path);
                },
                onRouteError: async (routeName, error, context) => {
                    console.error("Route error:", routeName, error.message, context.path);
                },

                // Redirect handlers
                onUnauthorized: (routeName, path) => {
                    console.log("Unauthorized access to:", routeName);
                    return `/login?redirect=${encodeURIComponent(path)}`;
                },
                onNotFound: (routeName, path) => {
                    console.log("Route not found:", routeName, path);
                },
            }
        })
    }
})

// Export router for server-side usage (loaders, metadata) and client-side component resolution
export const { router } = lib