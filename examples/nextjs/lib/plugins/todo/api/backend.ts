import type { Adapter } from "@btst/db"
import { defineBackendPlugin } from "@btst/stack/plugins"
import { createEndpoint } from "@btst/stack/api"
import { z } from "zod"
import { todosSchema as dbSchema } from "../schema"
import type { Todo } from "../types"

const createTodoSchema = z.object({
    title: z.string().min(1, "Title is required"),
    completed: z.boolean().optional().default(false)
})

const updateTodoSchema = z.object({
    title: z.string().min(1).optional(),
    completed: z.boolean().optional()
})

/**
 * Todos backend plugin
 * Provides API endpoints for managing todos
 * Uses better-db adapter for database operations
 */
export const todosBackendPlugin = defineBackendPlugin({
    name: "todos",

    dbPlugin: dbSchema,

    routes: (adapter: Adapter) => {
        const listTodos = createEndpoint(
            "/todos",
            {
                method: "GET"
            },
            async () => {
                const todos = await adapter.findMany<Todo>({
                    model: "todo",
                    sortBy: {
                        field: "createdAt",
                        direction: "desc"
                    }
                })
                return todos || []
            }
        )

        const createTodo = createEndpoint(
            "/todos",
            {
                method: "POST",
                body: createTodoSchema
            },
            async (ctx) => {
                const { title, completed } = ctx.body
                const newTodo = await adapter.create<Todo>({
                    model: "todo",
                    data: {
                        title,
                        completed: completed ?? false,
                        createdAt: new Date()
                    }
                })
                return newTodo
            }
        )

        const updateTodo = createEndpoint(
            "/todos/:id",
            {
                method: "PUT",
                body: updateTodoSchema
            },
            async (ctx) => {
                const updated = await adapter.update({
                    model: "todo",
                    where: [{ field: "id", value: ctx.params.id }],
                    update: ctx.body
                })

                if (!updated) {
                    throw new Error("Todo not found")
                }

                return updated
            }
        )

        const deleteTodo = createEndpoint(
            "/todos/:id",
            {
                method: "DELETE"
            },
            async (ctx) => {
                await adapter.delete({
                    model: "todo",
                    where: [{ field: "id", value: ctx.params.id }]
                })
                return { success: true }
            }
        )

        return {
            listTodos,
            createTodo,
            updateTodo,
            deleteTodo
        } as const
    }
})

export type TodosApiRouter = ReturnType<typeof todosBackendPlugin.routes>
