import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DEFAULT_API_URL = 'https://sabbirbookworld.onrender.com/api'

function slugify(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80)
        .replace(/-+$/g, '')
}

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

interface BookDto {
    bookId: number
    title: string
    createdAt?: string
    updatedAt?: string
}

interface CategoryDto {
    name: string
}

interface CreatorDto {
    authorId?: number
    publisherId?: number
    name: string
}

interface PagedDto<T> {
    items: T[]
    totalPages: number
}

interface SitemapEntry {
    path: string
    changefreq: string
    priority: string
    lastmod?: string
}

async function fetchJson<T>(url: string): Promise<T> {
    let lastError: unknown
    for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(30_000),
            })
            if (!response.ok) throw new Error(`${url} responded ${response.status}`)
            return (await response.json()) as T
        } catch (error) {
            lastError = error
            if (attempt === 1) await new Promise((done) => setTimeout(done, 1_500))
        }
    }
    throw lastError
}

async function fetchAllCreators(
    apiUrl: string,
    endpoint: 'author' | 'publisher'
): Promise<CreatorDto[]> {
    const all: CreatorDto[] = []
    for (let page = 1; page <= 50; page += 1) {
        const data = await fetchJson<PagedDto<CreatorDto>>(
            `${apiUrl}/${endpoint}?page=${page}&pageSize=60`
        )
        all.push(...data.items)
        if (page >= (data.totalPages || 1)) break
    }
    return all
}

/**
 * Emits robots.txt and a dynamic sitemap.xml at build time.
 * SITE_URL (or VITE_SITE_URL) sets the production origin; on Vercel it is
 * derived automatically. SITEMAP_API_URL overrides the catalog API used to
 * enumerate books, categories, authors and publishers.
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

    const readApiUrl = () => {
        const explicit = (process.env.SITEMAP_API_URL || process.env.VITE_API_BASE_URL || '').trim()
        return (explicit || DEFAULT_API_URL).replace(/\/+$/, '')
    }

    const collectDynamicEntries = async (): Promise<SitemapEntry[]> => {
        const api = readApiUrl()
        const entries: SitemapEntry[] = []

        const [books, categories, authors, publishers] = await Promise.allSettled([
            fetchJson<BookDto[]>(`${api}/book`),
            fetchJson<CategoryDto[]>(`${api}/category`),
            fetchAllCreators(api, 'author'),
            fetchAllCreators(api, 'publisher'),
        ])

        if (books.status === 'fulfilled') {
            for (const book of books.value) {
                const slug = slugify(book.title)
                const stamp = book.updatedAt || book.createdAt
                const parsed = stamp ? new Date(stamp) : null
                entries.push({
                    path: slug ? `/books/${book.bookId}/${slug}` : `/books/${book.bookId}`,
                    changefreq: 'weekly',
                    priority: '0.8',
                    lastmod: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : undefined,
                })
            }
        } else {
            console.warn(`[seo] Books could not be fetched for sitemap: ${books.reason}`)
        }

        if (categories.status === 'fulfilled') {
            for (const category of categories.value) {
                const slug = slugify(category.name)
                if (!slug) continue
                entries.push({
                    path: `/category/${slug}`,
                    changefreq: 'weekly',
                    priority: '0.7',
                })
            }
        } else {
            console.warn(`[seo] Categories could not be fetched for sitemap: ${categories.reason}`)
        }

        if (authors.status === 'fulfilled') {
            for (const author of authors.value) {
                if (!author.authorId) continue
                const slug = slugify(author.name)
                entries.push({
                    path: slug
                        ? `/authors/${author.authorId}/${slug}`
                        : `/authors/${author.authorId}`,
                    changefreq: 'monthly',
                    priority: '0.6',
                })
            }
        } else {
            console.warn(`[seo] Authors could not be fetched for sitemap: ${authors.reason}`)
        }

        if (publishers.status === 'fulfilled') {
            for (const publisher of publishers.value) {
                if (!publisher.publisherId) continue
                const slug = slugify(publisher.name)
                entries.push({
                    path: slug
                        ? `/publishers/${publisher.publisherId}/${slug}`
                        : `/publishers/${publisher.publisherId}`,
                    changefreq: 'monthly',
                    priority: '0.6',
                })
            }
        } else {
            console.warn(`[seo] Publishers could not be fetched for sitemap: ${publishers.reason}`)
        }

        return entries
    }

    return {
        name: 'bookmall-seo-files',
        apply: 'build',
        async writeBundle(options) {
            const outDir = options.dir ?? 'dist'
            const site = readSiteUrl()

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

            const staticEntries: SitemapEntry[] = [
                { path: '/', changefreq: 'daily', priority: '1.0' },
                { path: '/books', changefreq: 'daily', priority: '0.9' },
                { path: '/authors', changefreq: 'weekly', priority: '0.7' },
                { path: '/publishers', changefreq: 'weekly', priority: '0.7' },
                { path: '/membership', changefreq: 'monthly', priority: '0.5' },
            ]

            let dynamicEntries: SitemapEntry[] = []
            try {
                dynamicEntries = await collectDynamicEntries()
            } catch (error) {
                console.warn(`[seo] Dynamic sitemap generation failed: ${error}`)
            }

            const seen = new Set<string>()
            const entries = [...staticEntries, ...dynamicEntries].filter((entry) => {
                if (seen.has(entry.path)) return false
                seen.add(entry.path)
                return true
            })

            if (entries.length > 50_000) {
                console.warn(`[seo] Sitemap capped at 50,000 URLs (had ${entries.length}).`)
                entries.length = 50_000
            }

            const urls = entries
                .map((entry) => {
                    const lastmod = entry.lastmod
                        ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>`
                        : ''
                    return `  <url><loc>${site}${escapeXml(entry.path)}</loc>${lastmod}<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
                })
                .join('\n')

            const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
            writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap)
            console.log(`[seo] sitemap.xml written with ${entries.length} URLs.`)
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
