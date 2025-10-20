"use client";

import { RouteRenderer } from "@btst/stack/client/components"
import { router } from "./better-stack-client"

export function ClientRouteResolver({ path }: { path: string }) {
    return <RouteRenderer router={router} path={path} />
}

