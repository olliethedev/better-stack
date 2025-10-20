import { createStackClient } from "@btst/stack/client"
import { todosClientPlugin } from "@/lib/plugins/todo/client/client"
import { blogClientPlugin } from "@btst/stack/plugins/blog/client"

// Create the client library with plugins
const lib = createStackClient({
    plugins: {
        todos: todosClientPlugin,
        blog: blogClientPlugin
    }
})

// Export router for server-side usage (loaders, metadata) and client-side component resolution
export const { router } = lib