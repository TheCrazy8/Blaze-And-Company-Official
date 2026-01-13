import { h } from 'vue';
import VPLTheme from '@lando/vitepress-theme-default-plus';
import 'viewerjs/dist/viewer.min.css';
import imageViewer from 'vitepress-plugin-image-viewer';
import vImageViewer from 'vitepress-plugin-image-viewer/lib/vImageViewer.vue';
import { useRoute } from 'vitepress';
import vitepressBackToTop from 'vitepress-plugin-back-to-top';
import 'vitepress-plugin-back-to-top/dist/style.css';
import '@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css';
import { NolebaseEnhancedReadabilitiesPlugin } from '@nolebase/vitepress-plugin-enhanced-readabilities/client';
import PWAPrompt from './components/PWAPrompt.vue';
import './styles/main.css';

export default {
  extends: VPLTheme,

  Layout: () => {
    return h(VPLTheme.Layout, null, {
      'layout-bottom': () => h(PWAPrompt)
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
