import footnote from 'markdown-it-footnote'
import { defineConfig } from 'vitepress'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  markdown: {
    config(md) {
      md.use(footnote)
    }
  },
  title: "B&C Official",
  description: "The Blaze & Company official site.",
  base: "/Blaze-And-Company-Official/",
  themeConfig:  {
    siteTitle: "Blaze & Company",
    footer: {
      message: "Released under the CC BY-NC-ND 4.0 License.",
      copyright: "Copyright © 2025-present TheCrazy8",
    },
    nav: [
      { text: 'Key', link: '/key' },
      { text: 'Products', link: '/products'},
      { text: 'FLARE', link: '/FLARE Competition'},
      { text: 'BrightOS Web', link: '/brightos-web'},
      { text: 'Downloads', link: '/downloads'},
      { text: 'Dev Guide', link: '/development-guide'},
    ],
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
        collapsed:  false,
        items: [
          { text: 'Web Interface', link: '/brightos-web' },
          { text: 'Downloads', link: '/downloads' },
          { text: 'Build Guide', link: '/BUILD' },
        ]
      },
      {
        text: 'Development',
        collapsed: false,
        items: [
          { text: 'Development Guide', link: '/development-guide' },
        ]
      },
      {
        text: 'Competition',
        collapsed: false,
        items: [
          { text: 'FLARE Competition', link: '/FLARE Competition' },
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
        dateStyle: 'full',
        timeStyle: 'medium',
        forceLocale: true,
      }
    },
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/TheCrazy8/Blaze-And-Company-Official' }
    ],
  },
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/Blaze-And-Company-Official/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', href: '/Blaze-And-Company-Official/apple-touch-icon. png' }],
    ['meta', { name: 'theme-color', content: '#ff4500' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name:  'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
  ],
  vite: {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets:  ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name:  'Blaze & Company Official',
          short_name: 'B&C',
          description: 'Arduino modular program - Official documentation and resources',
          theme_color: '#ff4500',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/Blaze-And-Company-Official/',
          start_url:  '/Blaze-And-Company-Official/',
          icons: [
            {
              src: '/Blaze-And-Company-Official/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/Blaze-And-Company-Official/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/Blaze-And-Company-Official/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff2}'],
          runtimeCaching: [
            {
              urlPattern:  /^https:\/\/fonts\.googleapis\.com\/.*/i,
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
              urlPattern:  /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options:  {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
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
    }
  }
})
