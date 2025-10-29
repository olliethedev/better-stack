// src/routes/__root.tsx
/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import globalsCss from "@/styles/globals.css?url"
import { MyRouterContext } from '@/router'

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
      // Open Graph defaults
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:title",
        content: "Better Blog",
      },
      {
        property: "og:description",
        content: "A modern blog powered by Better Blog + TanStack.",
      },
      // Twitter defaults
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: "Better Blog",
      },
      {
        name: "twitter:description",
        content: "A modern blog powered by Better Blog + TanStack.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: globalsCss,
        },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <RootDocument>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>404 - Page Not Found</h1>
          <p>This page doesn't exist!</p>
        </div>
      </RootDocument>
    )
  },
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="initial-scale=1, viewport-fit=cover, width=device-width"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="oklch(1 0 0)"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="oklch(0.145 0 0)"
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}