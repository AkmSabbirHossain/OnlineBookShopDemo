import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Emits sitemap.xml / robots.txt at build time.
 * Set SITE_URL (or VITE_SITE_URL) to the production origin, e.g. https://your-domain.com
 */
function seoFilesPlugin(): Plugin {
    const readSiteUrl = () => {
        const explicit = (process.env.SITE_URL || process.env.VITE_SITE_URL || '').trim()
        if (explicit) return explicit.replace(/\/+$/, '')
        if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
            return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/+$/, '')
        }
        if (process.env.VERCEL_URL) {
            return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '')
        }
        if (process.env.URL) return process.env.URL.trim().replace(/\/+$/, '')
        return ''
    }

    return {
        name: 'bookmall-seo-files',
        apply: 'build',
        writeBundle(options) {
            const outDir = options.dir ?? 'dist'
            const site = readSiteUrl()
            const routes = [
                { path: '/', priority: '1.0', changefreq: 'daily' },
                { path: '/books', priority: '0.9', changefreq: 'daily' },
                { path: '/authors', priority: '0.7', changefreq: 'weekly' },
                { path: '/publishers', priority: '0.7', changefreq: 'weekly' },
            ]

            const robotsLines = [
                'User-agent: *',
                'Allow: /',
                'Disallow: /cart',
                'Disallow: /checkout',
                'Disallow: /orders',
                'Disallow: /profile',
                'Disallow: /wishlist',
                'Disallow: /auth',
                'Disallow: /vendor/',
                'Disallow: /admin/',
            ]
            if (site) {
                robotsLines.push('', `Sitemap: ${site}/sitemap.xml`)
            }
            writeFileSync(resolve(outDir, 'robots.txt'), `${robotsLines.join('\n')}\n`)

            if (!site) {
                console.warn('[seo] SITE_URL is not set — sitemap.xml was skipped.')
                return
            }

            const urls = routes
                .map(
                    (route) =>
                        `  <url><loc>${site}${route.path}</loc><changefreq>${route.changefreq}</changefreq><priority>${route.priority}</priority></url>`
                )
                .join('\n')
            const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
            writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap)
        },
    }
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), seoFilesPlugin()],

    server: {
        proxy: {
            '/api': {
                target: 'https://localhost:7032',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
