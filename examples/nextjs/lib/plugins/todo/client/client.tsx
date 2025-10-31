import { createApiClient } from "@btst/stack/plugins";
import { defineClientPlugin } from "@btst/stack/plugins";
import { createRoute } from "@btst/yar";
import type { QueryClient } from "@tanstack/react-query";
import type { TodosApiRouter } from "../api/backend";
import { lazy } from "react";
import { Todo } from "../types";

/**
 * Configuration for todos client plugin
 * Note: queryClient is passed at runtime to both loader and meta (for SSR isolation)
 */
export interface TodosClientConfig {
  // Required configuration
  queryClient: QueryClient;
  apiBaseURL: string;
  apiBasePath: string;
  siteBaseURL: string;
  siteBasePath: string;
  
  // Optional context to pass to loaders (for SSR)
  context?: Record<string, unknown>;
}

// Loader for SSR prefetching - configured once
function todosLoader(config: TodosClientConfig) {
  return async () => {
    if (typeof window === "undefined") {
      const { queryClient, apiBasePath, apiBaseURL } = config;
      
      await queryClient.prefetchQuery({
        queryKey: ["todos"],
        queryFn: async () => {
          const client = createApiClient<TodosApiRouter>({
            baseURL: apiBaseURL,
            basePath: apiBasePath,
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
    // Use queryClient passed at runtime (same as loader!)
    const { queryClient } = config;
    const { siteBaseURL, siteBasePath } = config;
    const todos = queryClient.getQueryData<Todo[]>(["todos"]) ?? [];
    const fullUrl = `${siteBaseURL}${siteBasePath}${path}`;
    
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
    const { siteBaseURL, siteBasePath } = config;
    const fullUrl = `${siteBaseURL}${siteBasePath}${path}`;
    
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
      todos: createRoute("/todos", () => {
        const TodosListPage = lazy(() =>
          import("./components").then((m) => ({ default: m.TodosListPage }))
        );
        
        return {
          PageComponent: TodosListPage,
          loader: todosLoader(config),
          meta: createTodosMeta(config, "/todos"),
        };
      }),
      addTodo: createRoute("/todos/add", () => {
        const AddTodoPage = lazy(() =>
          import("./components").then((m) => ({ default: m.AddTodoPage }))
        );
        
        return {
          PageComponent: AddTodoPage,
          meta: createAddTodoMeta(config, "/todos/add"),
        };
      }),
    }),
    sitemap: async () => { 
      return [
        { url: `${config.siteBaseURL}${config.siteBasePath}/todos`, lastModified: new Date(), priority: 0.7 },
        { url: `${config.siteBaseURL}${config.siteBasePath}/todos/add`, lastModified: new Date(), priority: 0.6 },
      ];
    },
  });
