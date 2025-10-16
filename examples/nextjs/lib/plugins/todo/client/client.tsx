import {
    createApiClient
} from "@btst/stack/client"
import { defineClientPlugin } from "@btst/stack/plugins"
import { createRoute } from "@btst/yar"
import type { QueryClient } from "@tanstack/react-query"
import type { TodosApiRouter } from "../api/backend"
import { AddTodoPage, TodosListPage } from "./components"




// Loader for SSR prefetching
async function todosLoader(queryClient: QueryClient, baseURL: string) {
    await queryClient.prefetchQuery({
        queryKey: ["todos"],
        queryFn: async () => {
            const client = createApiClient<TodosApiRouter>({
                baseURL: baseURL,
                basePath: "/api"
            })
            try {
                const response = await client("/todos", {
                    method: "GET"
                })
                    return response.data
                } catch (error) {
                    console.error("error", error)
                }
                return []
        }
    })
}

/**
 * Todos client plugin
 * Provides routes, components, and React Query hooks for todos
 */
export const todosClientPlugin = defineClientPlugin({
    name: "todos",

    routes: () => ({
        todos: createRoute("/todos", () => ({
            PageComponent: TodosListPage,
            loader: todosLoader
        })),
        addTodo: createRoute("/todos/add", () => ({
            PageComponent: AddTodoPage
        }))
    }),
})
