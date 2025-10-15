import { createMemoryAdapter } from "@btst/adapter-memory"
import { betterStack } from "@btst/stack"
import { todosBackendPlugin } from "./plugins/todo/api/backend"


const { handler, dbSchema } = betterStack({
    basePath: "/api",
    plugins: {
        todos: todosBackendPlugin
    },
    adapter: (db) => createMemoryAdapter(db)({})
})

export { handler, dbSchema }
