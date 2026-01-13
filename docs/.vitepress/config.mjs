import footnote from 'markdown-it-footnote'
import { defineConfig } from 'vitepress'

export default defineConfig({
  markdown: {
    config(md) {
      md.use(footnote)
    }
  },
  title: "B&C Official",
  description: "The Blaze & Company official site.",
  base: "/Blaze-And-Company-Official/",
  themeConfig: {
    siteTitle:  "Blaze & Company",
    footer: {
      message:  "Released under the CC BY-NC-ND 4.0 License.",
      copyright: "Copyright © 2025-present TheCrazy8",
    },
    nav: [
      { text: 'Key', link: '/key' },
      { text:  'Products', link: '/products'},
      { text: 'FLARE', link: '/FLARE Competition'},
      { text: 'BrightOS Web', link: '/brightos-web'},
      { text: 'Downloads', link: '/downloads'},
      { text: 'Dev Guide', link: '/development-guide'},
    ],
    sidebar: [
      {
        text: 'Getting Started',
        collapsed:  false,
        items: [
          { text: 'Home', link: '/' },
          { text: 'Key Resources', link: '/key' },
          { text: 'Products', link:  '/products' },
        ]
      },
      {
        text: 'BrightOS',
        collapsed: false,
        items: [
          { text:  'Web Interface', link: '/brightos-web' },
          { text: 'Downloads', link: '/downloads' },
          { text: 'Build Guide', link: '/BUILD' },
        ]
      },
      {
        text: 'Development',
        collapsed: false,
        items:  [
          { text: 'Development Guide', link: '/development-guide' },
        ]
      },
      {
        text:  'Competition',
        collapsed:  false,
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
      text:  'Updated',
      formatOptions: {
        dateStyle: 'full',
        timeStyle:  'medium',
        forceLocale: true,
      }
    },
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link:  'https://github.com/TheCrazy8/Blaze-And-Company-Official' }
    ],
  },
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: 'favicon.ico' }]
  ],
  vite: {
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
