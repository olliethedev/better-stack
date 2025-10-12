import { createRoute } from "@olliethedev/yar";
import { QueryClient } from "@tanstack/react-query";
import { createApiClient, getServerBaseURL } from "../utils";
import type { ClientPlugin } from "../../types";
import { TodosListPage, AddTodoPage } from "./components";
import { useTodos, useCreateTodo, useToggleTodo, useDeleteTodo } from "./hooks";
import type { TodosPluginOverrides } from "./overrides";
import type { TodosApiRoutes } from "./api";

// Loader for SSR prefetching
async function todosLoader(queryClient: QueryClient) {
	await queryClient.prefetchQuery({
		queryKey: ["todos"],
		queryFn: async () => {
			const client = createApiClient<TodosApiRoutes>({
				baseURL: getServerBaseURL(),
			});

			const response = await client("/todos", {
				method: "GET",
			});

			return response.data;
		},
	});
}

/**
 * Todos client plugin
 * Provides routes, components, and React Query hooks for todos
 */
export const todosClientPlugin: ClientPlugin<TodosPluginOverrides> = {
	name: "todos",

	// Default implementations
	defaultOverrides: {
		Link: (props) => <a {...props} />,
		navigate: undefined, // No default navigation function
	},

	routes: () => ({
		todos: createRoute("/todos", () => ({
			PageComponent: TodosListPage,
			loader: todosLoader,
		})),
		addTodo: createRoute("/todos/add", () => ({
			PageComponent: AddTodoPage,
		})),
	}),

	hooks: () => ({
		useTodos,
		useCreateTodo,
		useToggleTodo,
		useDeleteTodo,
	}),
};
