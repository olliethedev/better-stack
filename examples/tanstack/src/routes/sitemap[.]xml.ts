// src/routes/sitemap[.]xml.ts
import { createFileRoute } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { getStackClient } from '@/lib/better-stack-client'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        // Create a QueryClient instance for server-side data fetching
        const queryClient = new QueryClient()
        const lib = getStackClient(queryClient)
        const entries = await lib.generateSitemap()

        // Format sitemap entries as XML
        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
          entries
            .map((entry) => {
              const url = `<loc>${entry.url}</loc>`
              const lastModified = entry.lastModified
                ? `<lastmod>${
                    entry.lastModified instanceof Date
                      ? entry.lastModified.toISOString()
                      : entry.lastModified
                  }</lastmod>`
                : ''
              const changeFrequency = entry.changeFrequency
                ? `<changefreq>${entry.changeFrequency}</changefreq>`
                : ''
              const priority = entry.priority !== undefined
                ? `<priority>${entry.priority}</priority>`
                : ''

              return `<url>${url}${lastModified}${changeFrequency}${priority}</url>`
            })
            .join('') +
          `</urlset>`

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            // Force dynamic - always fetch fresh data
            'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
          },
        })
      },
    },
  },
})

