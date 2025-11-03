

import { useQueryClient } from "@tanstack/react-query";
import { RouteRenderer } from "@btst/stack/client/components"
import { getStackClient } from "~/lib/better-stack-client"

export function ClientRouteResolver({ path }: { path: string}) {
    const queryClient = useQueryClient();
    const stackClient = getStackClient(queryClient);
    return <RouteRenderer router={stackClient.router} path={path} />
}

