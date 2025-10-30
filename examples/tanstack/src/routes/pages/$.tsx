import { createFileRoute, notFound } from "@tanstack/react-router";
import { RouteRenderer } from "@btst/stack/client/components";
import { getStackClient } from "@/lib/better-stack-client";

export const Route = createFileRoute("/pages/$")({
  ssr: true,
  component: Page,
  loader: async ({ params, context }) => {
    const routePath = normalizePath(params._splat);

    const stackClient = getStackClient(context.queryClient);

    const route = stackClient.router.getRoute(routePath);

    if (!route) {
        console.log("Route not found:", routePath);
        throw notFound()
    }

    // Load data server-side if loader exists
    if (route?.loader) {
      await route.loader();
    }
    const meta = await route?.meta?.();
    return { meta };
  },
  head: ({ loaderData }) => {
    const meta = loaderData?.meta;

    if (!meta || !Array.isArray(meta)) {
      return {
        meta: [
            {
                title: "No Meta"
            }
        ],
        title: "No Meta",
      };
    }

    // Transform meta array: convert { name: 'title', content: 'value' } to { title: 'value' }
    const transformedMeta = meta.map((m) => {
      if (m.name === "title" && m.content) {
        return { title: m.content };
      }
      return m;
    });

    return {
      meta: transformedMeta,
    };
  },
  notFoundComponent: () => {
    return <p>This page doesn't exist!</p>
  },
});

function Page() {
  const context = Route.useRouteContext();
  const { _splat } = Route.useParams();
  const stackClient = getStackClient(context.queryClient);
  const normalizedPath = normalizePath(_splat);
  return (
    <RouteRenderer 
      key={normalizedPath} 
      router={stackClient.router} 
      path={normalizedPath} 
    />
  );
}

function normalizePath(splat?: string): string {
  const pathSegments = splat?.split("/").filter(Boolean) || [];
  return pathSegments.length ? `/${pathSegments.join("/")}` : "/";
}
