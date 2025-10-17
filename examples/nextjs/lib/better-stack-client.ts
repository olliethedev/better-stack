import { createStackClient } from "@btst/stack/client"
import { todosClientPlugin } from "@/lib/plugins/todo/client/client"
import { blogClientPlugin } from "@btst/stack/plugins/blog/client"

const { router } = createStackClient({
    plugins: {
        todos: todosClientPlugin,
        blog: blogClientPlugin
    }
})

export { router }