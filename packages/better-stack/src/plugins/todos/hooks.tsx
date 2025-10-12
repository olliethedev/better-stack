"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient, getServerBaseURL } from "../utils";
import type { TodosApiRoutes } from "./api";

interface Todo {
	id: string;
	title: string;
	completed: boolean;
	createdAt: Date;
}

export function useTodos() {
	const client = createApiClient<TodosApiRoutes>({
		baseURL: getServerBaseURL(),
	});

	return useQuery<Todo[]>({
		queryKey: ["todos"],
		queryFn: async () => {
			const response = await client("/todos", {
				method: "GET",
			});
			return response.data as Todo[];
		},
	});
}

export function useCreateTodo() {
	const client = createApiClient<TodosApiRoutes>({
		baseURL: getServerBaseURL(),
	});
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { title: string; completed?: boolean }) => {
			const response = await client("@post/todos", {
				method: "POST",
				body: data,
			});
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["todos"] });
		},
	});
}

export function useToggleTodo() {
	const client = createApiClient<TodosApiRoutes>({
		baseURL: getServerBaseURL(),
	});
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { id: string; completed: boolean }) => {
			const response = await client("@put/todos/:id", {
				method: "PUT",
				params: { id: data.id },
				body: { completed: data.completed },
			});
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["todos"] });
		},
	});
}

export function useDeleteTodo() {
	const client = createApiClient<TodosApiRoutes>({
		baseURL: getServerBaseURL(),
	});
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const response = await client("@delete/todos/:id", {
				method: "DELETE",
				params: { id },
			});
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["todos"] });
		},
	});
}
