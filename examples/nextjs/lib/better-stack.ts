import { createMemoryAdapter } from "@btst/adapter-memory"
import { betterStack } from "@btst/stack"
import { todosBackendPlugin } from "./plugins/todo/api/backend"
import { blogBackendPlugin } from "@btst/stack/plugins/blog/api"


const { handler, dbSchema } = betterStack({
    basePath: "/api",
    plugins: {
        todos: todosBackendPlugin,
        blog: blogBackendPlugin
    },
    adapter: (db) => createMemoryAdapter(db)({})
})

export { handler, dbSchema }
