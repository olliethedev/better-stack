import type { Route } from "@olliethedev/yar";
import type { Adapter, DatabaseDefinition, DbPlugin } from "@better-db/core";

/**
 * Backend plugin definition
 * Defines API routes and data access for a feature
 *
 * Note: Schema is defined separately in db.ts using defineDb()
 * Better DB follows a schema-first approach where tables are defined
 * upfront rather than dynamically at runtime
 */
export interface BackendPlugin {
	name: string;

	/**
	 * Create API endpoints for this plugin
	 * Returns an object with named endpoints that will be composed into the router
	 *
	 * @param adapter - Better DB adapter instance with methods:
	 *   create, update, updateMany, delete, deleteMany, findOne, findMany, count
	 */
	routes: (adapter: Adapter) => Record<string, any>; // Better-call endpoints
	dbPlugin: DbPlugin;
}

/**
 * Frontend plugin definition
 * Defines pages, components, loaders, and React Query hooks for a feature
 *
 * @template TOverrides - The shape of overridable components/functions this plugin requires
 * Example: { Link: ComponentType<{href: string}>, navigate: (path: string) => void }
 */
export interface ClientPlugin<TOverrides = Record<string, never>> {
	name: string;

	/**
	 * Define routes (pages) for this plugin
	 * Returns yar routes that will be composed into the router
	 */
	routes: () => Record<string, Route>;

	/**
	 * Optional: Create React Query hooks for this plugin
	 * These can be used directly in components without the loader
	 */
	hooks?: () => Record<string, (...args: any[]) => any>;

	/**
	 * Optional: Default implementations for overridable components/functions
	 * These will be used if no override is provided in BetterStackContext
	 */
	defaultOverrides?: Partial<TOverrides>;
}

/**
 * Full-stack plugin definition
 * A plugin can define both backend and frontend functionality
 *
 * @template TOverrides - The shape of overridable components/functions for the client plugin
 */
export interface Plugin<TOverrides = any> {
	name: string;
	backend: BackendPlugin;
	client: ClientPlugin<TOverrides>;
}

/**
 * Configuration for creating the backend library
 */
export interface BackendLibConfig {
	dbSchema?: DatabaseDefinition;
	plugins: Record<string, BackendPlugin>;
	adapter: (db: DatabaseDefinition) => Adapter;
}

/**
 * Configuration for creating the client library
 */
export interface ClientLibConfig<
	TPlugins extends Record<string, ClientPlugin<any>> = Record<
		string,
		ClientPlugin<any>
	>,
> {
	plugins: TPlugins;
	baseURL?: string;
	basePath?: string;
}

/**
 * Utility type to extract override types from plugins
 * Maps plugin names to their override types
 */
export type InferPluginOverrides<
	TPlugins extends Record<string, ClientPlugin<any>>,
> = {
	[K in keyof TPlugins]: TPlugins[K] extends ClientPlugin<infer TOverrides>
		? TOverrides
		: never;
};

/**
 * Type for the pluginOverrides prop in BetterStackContext
 * Allows partial overrides per plugin
 */
export type PluginOverrides<
	TPlugins extends Record<string, ClientPlugin<any>>,
> = {
	[K in keyof TPlugins]?: Partial<InferPluginOverrides<TPlugins>[K]>;
};

/**
 * Result of creating the backend library
 */
export interface BackendLib {
	handler: any; // Next.js route handler
	router: any; // Better-call router
	dbSchema: DatabaseDefinition; // Better-db schema
}

/**
 * Result of creating the client library
 */
export interface ClientLib {
	router: any; // Yar router
	hooks: Record<string, Record<string, any>>; // Plugin hooks organized by plugin name
}
