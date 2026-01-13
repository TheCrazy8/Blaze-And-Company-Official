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
import ToastNotification from './components/ToastNotification.vue'; // NEW

import './styles/main.css';

export default {
  extends: VPLTheme,

  Layout: () => {
    return h(VPLTheme.Layout, null, {
      // Top of page
      'layout-top': () => [
        h(AnnouncementBanner),
        h(ProgressBar),
        h(ToastNotification) // NEW - Add toast system
      ],
      
      // Navbar additions
      'nav-bar-content-after': () => [
        h(NolebaseEnhancedReadabilitiesMenu),
        h(ThemeSwitcher)
      ],
      
      // Mobile menu
      'nav-screen-content-after': () => h(NolebaseEnhancedReadabilitiesScreenMenu),
      
      // Before document content
      'doc-before':   () => h(Breadcrumbs),
      
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

  enhanceApp(ctx) {
    ctx.app.use(NolebaseEnhancedReadabilitiesPlugin);
    
    if (VPLTheme.enhanceApp) {
      VPLTheme.enhanceApp(ctx);
    }
    
    ctx.app.component('vImageViewer', vImageViewer);
    vitepressBackToTop({ threshold: 300 });
  },

  setup() {
    const route = useRoute();
    imageViewer(route);
  },
};
