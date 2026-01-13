import { h } from 'vue';
import VPLTheme from '@lando/vitepress-theme-default-plus';
import 'viewerjs/dist/viewer.min.css';
import imageViewer from 'vitepress-plugin-image-viewer';
import vImageViewer from 'vitepress-plugin-image-viewer/lib/vImageViewer.vue';
import { useRoute } from 'vitepress';
import vitepressBackToTop from 'vitepress-plugin-back-to-top';
import 'vitepress-plugin-back-to-top/dist/style.css';
import '@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css';
import { 
  NolebaseEnhancedReadabilitiesMenu,
  NolebaseEnhancedReadabilitiesScreenMenu,
  InjectionKey as NolebaseEnhancedReadabilitiesInjectionKey,
} from '@nolebase/vitepress-plugin-enhanced-readabilities/client';
import { NolebaseEnhancedReadabilitiesPlugin } from '@nolebase/vitepress-plugin-enhanced-readabilities/client';

// Import all custom components
import PWAPrompt from './components/PWAPrompt.vue';
import FireParticles from './components/FireParticles.vue';
import CursorTrail from './components/CursorTrail.vue';
import FloatingActionButton from './components/FloatingActionButton.vue';
import ThemeSwitcher from './components/ThemeSwitcher.vue';
import AnnouncementBanner from './components/AnnouncementBanner.vue';
import ProgressBar from './components/ProgressBar.vue';
import Breadcrumbs from './components/Breadcrumbs.vue';
import FeedbackWidget from './components/FeedbackWidget.vue';
import ShareButtons from './components/ShareButtons.vue';
import CommitHistory from './components/CommitHistory.vue';
import CopyCodeButton from './components/CopyCodeButton.vue';

import './styles/main.css';

export default {
  extends: VPLTheme,

  Layout: () => {
    return h(VPLTheme.Layout, null, {
      // Top of page
      'layout-top': () => [
        h(AnnouncementBanner),
        h(ProgressBar)
      ],
      
      // Navbar additions
      'nav-bar-content-after': () => [
        h(NolebaseEnhancedReadabilitiesMenu),
        h(ThemeSwitcher)
      ],
      
      // Mobile menu
      'nav-screen-content-after': () => h(NolebaseEnhancedReadabilitiesScreenMenu),
      
      // Before document content
      'doc-before':  () => h(Breadcrumbs),
      
      // After document content
      'doc-after': () => [
        h(ShareButtons),
        h(FeedbackWidget)
      ],
      
      // Bottom of page
      'layout-bottom': () => [
        h(FireParticles),
        h(CursorTrail),
        h(FloatingActionButton),
        h(PWAPrompt)
      ]
    });
  },

  enhanceApp({ app }) {
    // Configure enhanced readabilities plugin with proper options
    app.use(NolebaseEnhancedReadabilitiesPlugin, {
      spotlight: {
        defaultToggle: false,
        hoverBlockColor: 'rgb(240 197 52 / 10%)',
      },
      layoutSwitch: {
        defaultMode: 2, // Original mode
        contentLayoutMaxWidth: {
          defaultMaxWidth: 100,
        },
        pageLayoutMaxWidth: {
          defaultMaxWidth: 100,
        },
      },
    });
    
    // Provide the injection key with configuration
    app.provide(NolebaseEnhancedReadabilitiesInjectionKey, {
      locales: {
        'en': {
          title: {
            title: 'Reading Mode',
            titleAriaLabel: 'Reading Mode',
          },
          spotlight: {
            title: 'Spotlight',
            titleAriaLabel: 'Spotlight',
            optionOn: 'On',
            optionOff: 'Off',
          },
          layoutSwitch: {
            title: 'Layout',
            titleAriaLabel: 'Layout',
            titleHelpMessage: 'Choose your preferred page layout',
            optionFullWidth: 'Full Width',
            optionSidebarWidthAdjustableOnly: 'Sidebar Adjustable',
            optionBothWidthAdjustable: 'Both Adjustable',
            optionOriginalWidth: 'Original',
            contentLayoutMaxWidth: {
              title: 'Content Max Width',
              titleAriaLabel: 'Content Max Width',
              slider: {
                ariaLabel: 'Content max width slider',
              },
            },
            pageLayoutMaxWidth: {
              title: 'Page Max Width',
              titleAriaLabel: 'Page Max Width',
              slider: {
                ariaLabel: 'Page max width slider',
              },
            },
          },
        },
      },
    });
    
    if (VPLTheme.enhanceApp) {
      VPLTheme.enhanceApp({ app });
    }
    
    // Register global components
    app.component('vImageViewer', vImageViewer);
    app.component('CommitHistory', CommitHistory);
    app.component('CopyCodeButton', CopyCodeButton);
    
    vitepressBackToTop({ threshold: 300 });
  },

  setup() {
    const route = useRoute();
    imageViewer(route);
  },
};
