import { createApiClient } from "@btst/stack/plugins";
import { defineClientPlugin } from "@btst/stack/plugins";
import { createRoute } from "@btst/yar";
import type { QueryClient } from "@tanstack/react-query";
import type { TodosApiRouter } from "../api/backend";
import { AddTodoPage, TodosListPage } from "./components";
import { Todo } from "../types";

/**
 * Configuration for todos client plugin
 */
export interface TodosClientConfig {
  // Required configuration
  queryClient: QueryClient;
  baseURL: string;
  basePath?: string;
  
  // Optional context to pass to loaders (for SSR)
  context?: Record<string, any>;
}

// Loader for SSR prefetching - configured once
function todosLoader(config: TodosClientConfig) {
  return async () => {
    if (typeof window === "undefined") {
      const { queryClient, baseURL, basePath = "/api" } = config;
      
      await queryClient.prefetchQuery({
        queryKey: ["todos"],
        queryFn: async () => {
          const client = createApiClient<TodosApiRouter>({
            baseURL: baseURL,
            basePath: basePath,
          });
          try {
            const response = await client("/todos", {
              method: "GET",
            });
            console.log("SSR todos", response.data);
            return response.data;
          } catch (error) {
            console.error("error", error);
          }
          return [];
        },
      });
    }
  };
}

/**
 * Todos client plugin
 * Provides routes, components, and React Query hooks for todos
 * 
 * @param config - Configuration including queryClient and baseURL
 */
export const todosClientPlugin = (config: TodosClientConfig) =>
  defineClientPlugin({
    name: "todos",

    routes: () => ({
      todos: createRoute("/todos", () => ({
        PageComponent: TodosListPage,
        loader: todosLoader(config),
      meta: (config: { url: string; todos: Todo[] }) => [
        { name: "title", content: `${config.todos.length} Todos` },
        {
          name: "description",
          content: `Track ${config.todos.length} todos. Add, toggle and delete.`,
        },
        { name: "keywords", content: "todos, tasks, productivity" },
        // Open Graph
        { property: "og:title", content: `${config.todos.length} Todos` },
        {
          property: "og:description",
          content: `Track ${config.todos.length} todos. Add, toggle and delete.`,
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: config.url },
        // Twitter
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: `${config.todos.length} Todos` },
        {
          name: "twitter:description",
          content: `Track ${config.todos.length} todos. Add, toggle and delete.`,
        },
      ],
    })),
    addTodo: createRoute("/todos/add", () => ({
      PageComponent: AddTodoPage,
      meta: (config: { url: string }) => [
        { name: "title", content: "Add Todo" },
        { name: "description", content: "Create a new todo item." },
        { name: "keywords", content: "add todo, create task" },
        // Open Graph
        { property: "og:title", content: "Add Todo" },
        { property: "og:description", content: "Create a new todo item." },
        { property: "og:type", content: "website" },
        { property: "og:url", content: config.url },
        // Twitter
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: "Add Todo" },
        { name: "twitter:description", content: "Create a new todo item." },
      ],
    })),
  }),
});
