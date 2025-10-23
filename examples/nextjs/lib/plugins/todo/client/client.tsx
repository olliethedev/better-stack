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
  context?: Record<string, unknown>;
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

// Meta generator - configured once, accesses data via closure
function createTodosMeta(config: TodosClientConfig, path: string) {
  return () => {
    const { queryClient, baseURL } = config;
    const todos = queryClient.getQueryData<Todo[]>(["todos"]) ?? [];
    const fullUrl = `${baseURL}${path}`;
    
    return [
      { name: "title", content: `${todos.length} Todos` },
      {
        name: "description",
        content: `Track ${todos.length} todos. Add, toggle and delete.`,
      },
      { name: "keywords", content: "todos, tasks, productivity" },
      // Open Graph
      { property: "og:title", content: `${todos.length} Todos` },
      {
        property: "og:description",
        content: `Track ${todos.length} todos. Add, toggle and delete.`,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: fullUrl },
      // Twitter
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: `${todos.length} Todos` },
      {
        name: "twitter:description",
        content: `Track ${todos.length} todos. Add, toggle and delete.`,
      },
    ];
  };
}

// Meta generator for add todo page
function createAddTodoMeta(config: TodosClientConfig, path: string) {
  return () => {
    const { baseURL } = config;
    const fullUrl = `${baseURL}${path}`;
    
    return [
      { name: "title", content: "Add Todo" },
      { name: "description", content: "Create a new todo item." },
      { name: "keywords", content: "add todo, create task" },
      // Open Graph
      { property: "og:title", content: "Add Todo" },
      { property: "og:description", content: "Create a new todo item." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: fullUrl },
      // Twitter
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Add Todo" },
      { name: "twitter:description", content: "Create a new todo item." },
    ];
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
        meta: createTodosMeta(config, "/todos"),
      })),
      addTodo: createRoute("/todos/add", () => ({
        PageComponent: AddTodoPage,
        meta: createAddTodoMeta(config, "/todos/add"),
      })),
    }),
  });
