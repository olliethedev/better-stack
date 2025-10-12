"use client";
import { useTodos, useToggleTodo, useDeleteTodo, useCreateTodo } from "./hooks";
import { usePluginOverrides } from "../../context";
import type { TodosPluginOverrides } from "./overrides";

export function TodosListPage() {
	const { data: todos, isLoading } = useTodos();
	const toggleTodoMutation = useToggleTodo();
	const deleteTodoMutation = useDeleteTodo();
	const { Link } = usePluginOverrides<TodosPluginOverrides>("todos");

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-6">Todos</h1>

			<div className="mb-6">
				<Link
					href="/example/todos/add"
					className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
				>
					Add Todo
				</Link>
			</div>

			<div className="space-y-2">
				{isLoading && <div className="text-gray-500">Loading todos...</div>}

				{todos?.map((todo) => (
					<div
						key={todo.id}
						className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
					>
						<input
							type="checkbox"
							checked={todo.completed}
							onChange={() =>
								toggleTodoMutation.mutate({
									id: todo.id,
									completed: !todo.completed,
								})
							}
							className="w-5 h-5"
						/>
						<span
							className={`flex-1 ${todo.completed ? "line-through text-gray-400" : ""}`}
						>
							{todo.title}
						</span>
						<button
							onClick={() => deleteTodoMutation.mutate(todo.id)}
							className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
						>
							Delete
						</button>
					</div>
				))}

				{todos?.length === 0 && (
					<div className="text-gray-500 text-center py-8">
						No todos yet. <Link href="/example/todos/add">Add a todo</Link>
					</div>
				)}
			</div>
		</div>
	);
}

export function AddTodoPage() {
	const createTodoMutation = useCreateTodo();
	const { Link } = usePluginOverrides<TodosPluginOverrides>("todos");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.currentTarget;
		const formData = new FormData(form);
		const title = formData.get("title") as string;

		await createTodoMutation.mutateAsync({ title });

		// Reset form (stored reference before async operation)
		form.reset();
	};

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-6">Add Todo</h1>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label htmlFor="title" className="block text-sm font-medium mb-1">
						Title
					</label>
					<input
						type="text"
						id="title"
						name="title"
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-md"
					/>
				</div>

				<div className="flex gap-2">
					<button
						type="submit"
						disabled={createTodoMutation.isPending}
						className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
					>
						{createTodoMutation.isPending ? "Adding..." : "Add Todo"}
					</button>

					<Link
						href="/example/todos"
						className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
					>
						Cancel
					</Link>
				</div>

				{createTodoMutation.isError && (
					<div className="text-red-500 text-sm">
						Error: {createTodoMutation.error.message}
					</div>
				)}

				{createTodoMutation.isSuccess && (
					<div className="text-green-500 text-sm">Todo added successfully!</div>
				)}
			</form>
		</div>
	);
}
