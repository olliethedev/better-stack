"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Context value that provides plugin-specific overrides
 * Generic over the shape of all plugin overrides
 */
interface BetterStackContextValue<
	TPluginOverrides extends Record<string, any>,
> {
	overrides: TPluginOverrides;
}

const BetterStackContext = createContext<BetterStackContextValue<any> | null>(
	null,
);

/**
 * Provider component for BetterStack context
 * Provides type-safe access to plugin-specific overrides
 *
 * Only requires override values, not plugin objects - keeps bundle size minimal!
 *
 * @example
 * ```tsx
 * // Define the type shape (no import of plugin values needed!)
 * type MyPluginOverrides = {
 *   todos: TodosPluginOverrides;
 *   messages: MessagesPluginOverrides;
 * };
 *
 * <BetterStackProvider<MyPluginOverrides>
 *   overrides={{
 *     todos: {
 *       Link: (props) => <NextLink {...props} />,
 *       navigate: (path) => router.push(path),
 *     },
 *     messages: {
 *       MarkdownRenderer: (props) => <ReactMarkdown {...props} />,
 *     }
 *   }}
 * >
 *   {children}
 * </BetterStackProvider>
 * ```
 */
export function BetterStackProvider<
	TPluginOverrides extends Record<string, any> = Record<string, any>,
>({
	children,
	overrides,
}: {
	children: ReactNode;
	overrides: TPluginOverrides;
}) {
	const value: BetterStackContextValue<TPluginOverrides> = {
		overrides,
	};

	return (
		<BetterStackContext.Provider value={value}>
			{children}
		</BetterStackContext.Provider>
	);
}

/**
 * Hook to access the entire context
 * Useful if you need access to multiple plugins or the full context
 */
export function useBetterStack<
	TPluginOverrides extends Record<string, any> = Record<string, any>,
>() {
	const context = useContext(
		BetterStackContext,
	) as BetterStackContextValue<TPluginOverrides> | null;

	if (!context) {
		throw new Error(
			"useBetterStack must be used within BetterStackProvider. " +
				"Wrap your app with <BetterStackProvider> in your layout file.",
		);
	}

	return context;
}

/**
 * Hook to access overrides for a specific plugin
 * This is type-safe and will only expose the overrides defined by that plugin
 *
 * @example
 * ```tsx
 * // In a todos plugin component
 * function TodosList() {
 *   const { Link, navigate } = usePluginOverrides<TodosPluginOverrides>("todos");
 *
 *   return (
 *     <Link href="/todos/add">
 *       <button onClick={() => navigate("/todos")}>
 *         Add Todo
 *       </button>
 *     </Link>
 *   );
 * }
 * ```
 */
export function usePluginOverrides<TOverrides = any>(
	pluginName: string,
): TOverrides {
	const context = useBetterStack();

	const overrides = context.overrides[pluginName];

	if (!overrides) {
		throw new Error(
			`Plugin "${pluginName}" not found in BetterStackProvider. ` +
				`Available plugins: ${Object.keys(context.overrides).join(", ")}`,
		);
	}

	return overrides as TOverrides;
}

/**
 * Hook to access a specific override from a plugin
 * Provides fine-grained access with full type safety
 *
 * @example
 * ```tsx
 * function TodosList() {
 *   const Link = usePluginOverride<typeof NextLink>("todos", "Link");
 *
 *   return <Link href="/todos/add">Add Todo</Link>;
 * }
 * ```
 */
export function usePluginOverride<TOverride = any>(
	pluginName: string,
	overrideKey: string,
): TOverride {
	const overrides = usePluginOverrides<Record<string, any>>(pluginName);

	const override = overrides[overrideKey];

	if (override === undefined) {
		const availableKeys =
			overrides && typeof overrides === "object"
				? Object.keys(overrides as object).join(", ")
				: "none";
		throw new Error(
			`Override "${overrideKey}" not found for plugin "${pluginName}". ` +
				`Available overrides: ${availableKeys}`,
		);
	}

	return override as TOverride;
}
