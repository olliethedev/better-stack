import { createApiClient } from "@btst/stack/plugins";
import { defineClientPlugin } from "@btst/stack/plugins";
import { createRoute } from "@btst/yar";
import type { QueryClient } from "@tanstack/react-query";
import type { TodosApiRouter } from "../api/backend";
import { AddTodoPage, TodosListPage } from "./components";
import { Todo } from "../types";

// Loader for SSR prefetching
async function todosLoader(queryClient: QueryClient, baseURL: string) {
  if (typeof window === "undefined") {
    await queryClient.prefetchQuery({
      queryKey: ["todos"],
      queryFn: async () => {
        const client = createApiClient<TodosApiRouter>({
          baseURL: baseURL,
          basePath: "/api",
        });
        try {
          const response = await client("/todos", {
            method: "GET",
          });
          return response.data;
        } catch (error) {
          console.error("error", error);
        }
        return [];
      },
    });
  }
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
      loader: todosLoader,
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
