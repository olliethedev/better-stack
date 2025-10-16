"use client"
import {
    createApiClient,
} from "@btst/stack/client"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import type { Todo } from "../types"
import type { TodosApiRouter } from "../api/backend"



export function useTodos() {
    const client = createApiClient<TodosApiRouter>({
        baseURL: "/api"
    })

    return useSuspenseQuery({
        queryKey: ["todos"],
        queryFn: async () => {
            //fake delay
            await new Promise(resolve => setTimeout(resolve, 5000))

            const response = await client("/todos", {
                method: "GET"
            })
            return response.data
        }
    })
}

export function useCreateTodo() {
    const client = createApiClient<TodosApiRouter>({
        baseURL: "/api"
    })
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: { title: string; completed?: boolean }) => {
            
            const response = await client("@post/todos", {
                method: "POST",
                body: data
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todos"] })
        }
    })
}

export function useToggleTodo({ onSuccess, onError }: { onSuccess?: () => void, onError?: () => void } = {}) {
    const client = createApiClient<TodosApiRouter>({
        baseURL: "/api"
    })
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: { id: string; completed: boolean }) => {
            const response = await client("@put/todos/:id", {
                method: "PUT",
                params: { id: data.id },
                body: { completed: data.completed }
            })
            return response.data
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ["todos"] })

            const previousTodos = queryClient.getQueryData<Todo[]>([
                "todos"
            ])

            queryClient.setQueryData<Todo[]>(["todos"], (old) => {
                if (!old) {
                    return old
                }

                return old.map((todo) =>
                    todo.id === variables.id
                        ? { ...todo, completed: variables.completed }
                        : todo
                )
            })

            return { previousTodos }
        },
        onError: (_error, _variables, context) => {
            if (context?.previousTodos) {
                queryClient.setQueryData(["todos"], context.previousTodos)
            }
            onError?.()
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["todos"] })
            onSuccess?.()
        }
    })
}

export function useDeleteTodo({ onSuccess, onError }: { onSuccess?: () => void, onError?: () => void } = {}) {
    const client = createApiClient<TodosApiRouter>({
        baseURL: "/api"
    })
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await client("@delete/todos/:id", {
                method: "DELETE",
                params: { id }
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todos"] })
            onSuccess?.()
        },
        onError: () => {
            onError?.()
        }
    })
}
