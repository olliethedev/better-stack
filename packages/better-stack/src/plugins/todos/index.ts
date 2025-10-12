import { todosBackendPlugin } from "./api";
import { todosClientPlugin } from "./client";
import { todosSchema } from "./schema";
import type { Plugin } from "../../types";
import type { TodosPluginOverrides } from "./overrides";

/**
 * Full-stack todos plugin
 * Combines backend, client, and schema functionality
 */
export const todosPlugin: Plugin<TodosPluginOverrides> = {
	name: "todos",
	backend: todosBackendPlugin,
	client: todosClientPlugin,
};

// Export individual parts for flexibility
export { todosBackendPlugin, todosClientPlugin, todosSchema };

// Export override types for consumers
export type { TodosPluginOverrides } from "./overrides";
