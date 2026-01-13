import footnote from 'markdown-it-footnote'
import { defineConfig } from 'vitepress'
import { VitePWA } from 'vite-plugin-pwa'
import { generateFeeds } from './theme/rss. js'

export default defineConfig({
  ignoreDeadLinks: [
    /\/blog\/feed\.(xml|atom)$/
  ],
  markdown: {
    lineNumbers: true, // Show line numbers in code blocks
    config(md) {
      md.use(footnote)
    }
  },
  title: "B&C Official",
  description:   "The Blaze & Company official site.",
  base: "/Blaze-And-Company-Official/",
  themeConfig: {
    editLink: {
      pattern: 'https://github.com/TheCrazy8/Blaze-And-Company-Official/edit/main/docs/:path',
      text: '✏️ Edit this page'
    },

    docFooter: {
      prev:   '← Previous',
      next:   'Next →'
    },

    externalLinkIcon: false,
    siteTitle: "Blaze & Company",
    footer: {
      message: "Released under the CC BY-NC-ND 4.0 License.",
      copyright: "Copyright © 2025-present TheCrazy8",
    },
    
    // UPDATED NAV WITH DROPDOWNS (matching sidebar structure, existing pages only)
    nav: [
      { 
        text: '🏠 Getting Started',
        items: [
          { text: '🏡 Home', link: '/' },
          { text: '🔑 Key Resources', link: '/key' },
          { text: '📦 Products', link: '/products' },
        ]
      },
      { 
        text: '🔥 BrightOS',
        items:  [
          { text: '🌐 Web Interface', link: '/brightos-web' },
          { text: '📚 Script Examples', link: '/examples' },
          { text: '📥 Downloads', link: '/downloads' },
          { text: '🏗️ Build Guide', link: '/BUILD' },
        ]
      },
      { 
        text:  '👨‍💻 Development',
        items: [
          { text: '📖 Development Guide', link: '/development-guide' },
          { text: '📜 Changelog', link: '/changelog' },
        ]
      },
      { 
        text:  '🌟 Community',
        items:  [
          { text: '📝 Blog', link: '/blog/' },
          { text: '💬 GitHub Discussions', link: 'https://github.com/TheCrazy8/Blaze-And-Company-Official/discussions' },
          { text: '📡 RSS Feed', link: '/blog/feed.xml' },
          { text: '⚛️ Atom Feed', link: '/blog/feed.atom' },
        ]
      },
      { 
        text: '🏅 Competition',
        items: [
          { text: '🔥 FLARE Competition', link: '/FLARE Competition' },
        ]
      },
    ],
    
    // SIDEBAR (existing structure)
    sidebar: [
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Home', link: '/' },
          { text: 'Key Resources', link: '/key' },
          { text: 'Products', link: '/products' },
        ]
      },
      {
        text: 'BrightOS',
        collapsed: false,
        items: [
          { text: 'Web Interface', link: '/brightos-web' },
          { text: 'Script Examples', link: '/examples' },
          { text: 'Downloads', link: '/downloads' },
          { text: 'Build Guide', link: '/BUILD' },
        ]
      },
      {
        text: 'Development',
        collapsed: false,
        items: [
          { text: 'Development Guide', link:  '/development-guide' },
          { text: 'Changelog', link: '/changelog' },
        ]
      },
      {
        text: 'Community',
        collapsed: false,
        items: [
          { text: 'Blog', link: '/blog/' },
        ]
      },
      {
        text: 'Competition',
        collapsed: false,
        items: [
          { text: 'FLARE Competition', link:  '/FLARE Competition' },
        ]
      }
    ],
    
    outline: {
      level: [2, 3],
      label: 'On this page'
    },
    
    lastUpdated: {
      text: 'Updated',
      formatOptions: {
        dateStyle:  'full',
        timeStyle: 'medium',
        forceLocale: true,
      }
    },
    
    search: { 
      provider: 'local',
      options: {
        detailedView: true,
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { 
              title: 4, 
              text: 2, 
              titles: 1 
            }
          }
        }
      }
    },
    
    socialLinks: [
      { icon:  'github', link: 'https://github.com/TheCrazy8/Blaze-And-Company-Official' }
    ],
  },
  
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/Blaze-And-Company-Official/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', href: '/Blaze-And-Company-Official/icon-192x192.png' }],
    ['link', { rel:  'alternate', type: 'application/rss+xml', title: 'BrightOS Blog RSS', href: '/Blaze-And-Company-Official/blog/feed.xml' }],
    ['link', { rel: 'alternate', type: 'application/atom+xml', title: 'BrightOS Blog Atom', href: '/Blaze-And-Company-Official/blog/feed.atom' }],
    ['meta', { name: 'theme-color', content: '#ff4500' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Blaze & Company' }],
    ['meta', { property: 'og:image', content: '/Blaze-And-Company-Official/og-image.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  
  buildEnd: async (config) => {
    await generateFeeds(config)
  },
  
  vite: {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', '*.png'],
        manifest: {
          name: 'Blaze & Company Official',
          short_name: 'B&C',
          description: 'Arduino modular program - Official documentation and resources',
          theme_color:  '#ff4500',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/Blaze-And-Company-Official/',
          start_url:  '/Blaze-And-Company-Official/',
          icons: [
            {
              src: '/Blaze-And-Company-Official/icon-48x48.png',
              sizes: '48x48',
              type: 'image/png'
            },
            {
              src: '/Blaze-And-Company-Official/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png'
            },
            {
              src: '/Blaze-And-Company-Official/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png'
            },
            {
              src: '/Blaze-And-Company-Official/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png'
            },
            {
              src: '/Blaze-And-Company-Official/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png'
            },
            {
              src: '/Blaze-And-Company-Official/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png'
            },
            {
              src: '/Blaze-And-Company-Official/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/Blaze-And-Company-Official/icon-256x256.png',
              sizes: '256x256',
              type: 'image/png'
            },
            {
              src: '/Blaze-And-Company-Official/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png'
            },
            {
              src: '/Blaze-And-Company-Official/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/Blaze-And-Company-Official/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          shortcuts: [
            {
              name: 'BrightOS Web',
              short_name: 'Web Interface',
              url: '/Blaze-And-Company-Official/brightos-web',
              description: 'Run BrightOS in browser',
              icons: [{ src: '/Blaze-And-Company-Official/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Examples',
              short_name: 'Examples',
              url: '/Blaze-And-Company-Official/examples',
              description:  'View example scripts',
              icons: [{ src: '/Blaze-And-Company-Official/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Downloads',
              short_name: 'Downloads',
              url: '/Blaze-And-Company-Official/downloads',
              description: 'Download plugins and scripts',
              icons: [{ src: '/Blaze-And-Company-Official/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Blog',
              short_name: 'Blog',
              url: '/Blaze-And-Company-Official/blog/',
              description: 'Read latest updates',
              icons: [{ src:  '/Blaze-And-Company-Official/icon-192x192.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/. */i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/api\.github\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'github-api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 // 1 hour
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    optimizeDeps: { 
      exclude: [ 
        '@nolebase/vitepress-plugin-enhanced-readabilities/client', 
        'vitepress', 
        '@nolebase/ui',
      ]
    },
    ssr: {
      noExternal: [
        '@lando/vitepress-theme-default-plus',
        '@nolebase/vitepress-plugin-enhanced-readabilities', 
        '@nolebase/ui',
      ]
    },
    css: {
      preprocessorOptions: {
        scss:  {
          // Ensure scss is processed correctly
        }
      }
    }
  }
})
