"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createApiClient, getServerBaseURL } from "../utils";

interface Todo {
	id: string;
	title: string;
	completed: boolean;
	createdAt: Date;
}

export function useTodos() {
	const client = createApiClient({ baseURL: getServerBaseURL() });

	return useQuery<Todo[]>({
		queryKey: ["todos"],
		queryFn: async () => {
			const response = await client(
				"/todos" as any,
				{
					method: "GET",
				} as any,
			);
			return response.data;
		},
	});
}

export function useCreateTodo() {
	const client = createApiClient({ baseURL: getServerBaseURL() });
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { title: string; completed?: boolean }) => {
			const response = await client(
				"/todos" as any,
				{
					method: "POST",
					body: data,
				} as any,
			);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["todos"] });
		},
	});
}

export function useToggleTodo() {
	const client = createApiClient({ baseURL: getServerBaseURL() });
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { id: string; completed: boolean }) => {
			const response = await client(
				`/todos/${data.id}` as any,
				{
					method: "PUT",
					body: { completed: data.completed },
				} as any,
			);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["todos"] });
		},
	});
}

export function useDeleteTodo() {
	const client = createApiClient({ baseURL: getServerBaseURL() });
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const response = await client(
				`/todos/${id}` as any,
				{
					method: "DELETE",
				} as any,
			);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["todos"] });
		},
	});
}
