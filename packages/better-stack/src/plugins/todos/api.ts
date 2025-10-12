import { createEndpoint } from "better-call";
import { z } from "zod";
import type { BackendPlugin } from "../../types";
import type { Adapter } from "@better-db/core";
import { todosSchema } from "./schema";

const createTodoSchema = z.object({
	title: z.string().min(1, "Title is required"),
	completed: z.boolean().optional().default(false),
});

const updateTodoSchema = z.object({
	title: z.string().min(1).optional(),
	completed: z.boolean().optional(),
});

/**
 * Creates the todos API routes
 * Separated as a function to enable type inference
 */
function createTodosRoutes(adapter: Adapter) {
	const listTodos = createEndpoint(
		"/todos",
		{
			method: "GET",
		},
		async (ctx) => {
			const todos = await adapter.findMany({
				model: "todo",
				sortBy: {
					field: "createdAt",
					direction: "desc",
				},
			});
			return todos || [];
		},
	);

	const createTodo = createEndpoint(
		"/todos",
		{
			method: "POST",
			body: createTodoSchema,
		},
		async (ctx) => {
			const { title, completed } = ctx.body;
			const newTodo = await adapter.create({
				model: "todo",
				data: {
					title,
					completed: completed ?? false,
				},
			});
			return newTodo;
		},
	);

	const updateTodo = createEndpoint(
		"/todos/:id",
		{
			method: "PUT",
			body: updateTodoSchema,
		},
		async (ctx) => {
			const updated = await adapter.update({
				model: "todo",
				where: [{ field: "id", value: ctx.params.id }],
				update: ctx.body,
			});

			if (!updated) {
				throw new Error("Todo not found");
			}

			return updated;
		},
	);

	const deleteTodo = createEndpoint(
		"/todos/:id",
		{
			method: "DELETE",
		},
		async (ctx) => {
			await adapter.delete({
				model: "todo",
				where: [{ field: "id", value: ctx.params.id }],
			});
			return { success: true };
		},
	);

	return {
		listTodos,
		createTodo,
		updateTodo,
		deleteTodo,
	};
}

/**
 * Type representing the todos API routes
 */
export type TodosApiRoutes = ReturnType<typeof createTodosRoutes>;

/**
 * Todos backend plugin
 * Provides API endpoints for managing todos
 * Uses better-db adapter for database operations
 */
export const todosBackendPlugin: BackendPlugin = {
	name: "todos",

	dbPlugin: todosSchema,

	routes: createTodosRoutes,
};
