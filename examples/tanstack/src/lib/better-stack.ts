import { createMemoryAdapter } from "@btst/adapter-memory"
import { betterStack } from "@btst/stack"
import { blogBackendPlugin, type BlogBackendHooks } from "@btst/stack/plugins/blog/api"

// Define blog hooks with proper types
const blogHooks: BlogBackendHooks = {
    // Authorization hooks - check permissions before operations
    canCreatePost: async (data) => {
        // Example: Check if user is authenticated and has permission
        // const user = await getUser(context.request);
        // return user?.canCreatePost ?? false;
        console.log("canCreatePost hook called", data.title);
        return true; // Allow for now
    },
    canUpdatePost: async (postId) => {
        // Example: Check if user owns the post or is admin
        console.log("canUpdatePost hook called for post:", postId);
        return true; // Allow for now
    },
    canDeletePost: async (postId) => {
        // Example: Check if user can delete this post
        console.log("canDeletePost hook called for post:", postId);
        return true; // Allow for now
    },
    canListPosts: async (filter) => {
        // Example: Allow public posts, require auth for drafts
        if (filter.published === false) {
            // Check authentication for drafts
            console.log("canListPosts: checking auth for drafts");
        }
        return true; // Allow for now
    },

    // Lifecycle hooks - perform actions after operations
    onPostCreated: async (post) => {
        console.log("Post created:", post.id, post.title);
        // Example: Send notifications, update cache, trigger webhooks
        // await notifySubscribers(post);
        // await revalidatePath(`/blog/${post.slug}`);
    },
    onPostUpdated: async (post) => {
        console.log("Post updated:", post.id, post.title);
        // Example: Update cache, send notifications
        // await revalidatePath(`/blog/${post.slug}`);
    },
    onPostDeleted: async (postId) => {
        console.log("Post deleted:", postId);
        // Example: Clean up related data, clear cache
        // await revalidatePath("/blog");
    },
    onPostsRead: async (posts) => {
        console.log("Posts read:", posts.length, "items");
        // Example: Track analytics
    },

    // Error hooks - handle operation failures
    onCreatePostError: async (error) => {
        console.error("Failed to create post:", error.message);
        // Example: Log error, send to error tracking service
    },
    onUpdatePostError: async (error) => {
        console.error("Failed to update post:", error.message);
    },
};

const { handler, dbSchema } = betterStack({
    basePath: "/api/data",
    plugins: {
        blog: blogBackendPlugin(blogHooks)
    },
    adapter: (db) => createMemoryAdapter(db)({})
})

export { handler, dbSchema }
