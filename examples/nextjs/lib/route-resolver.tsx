"use client";

import { RouteRenderer } from "@btst/stack/client/components"
import { getStackClient } from "@/lib/better-stack-client"
import { QueryClient } from "@tanstack/react-query"
import { getOrCreateQueryClient } from "./query-client";

export function ClientRouteResolver({ path, }: { path: string}) {
    const stackClient = getStackClient(getOrCreateQueryClient())
    return <RouteRenderer router={stackClient.router} path={path} />
}

