import { createStackClient } from "@btst/stack/client"
import { todosClientPlugin } from "@/lib/plugins/todo/client/client"

const { router } = createStackClient({
    plugins: {
        todos: todosClientPlugin
    }
})

export { router }