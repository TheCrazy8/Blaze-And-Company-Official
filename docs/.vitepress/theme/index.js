import { h } from 'vue';
import VPLTheme from '@lando/vitepress-theme-default-plus';
import 'viewerjs/dist/viewer. min.css';
import imageViewer from 'vitepress-plugin-image-viewer';
import vImageViewer from 'vitepress-plugin-image-viewer/lib/vImageViewer. vue';
import { useRoute } from 'vitepress';
import vitepressBackToTop from 'vitepress-plugin-back-to-top';
import 'vitepress-plugin-back-to-top/dist/style.css';
import '@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css';
import { 
  LayoutMode,
  NolebaseEnhancedReadabilitiesPlugin,
  InjectionKey as NolebaseEnhancedReadabilitiesInjectionKey 
} from '@nolebase/vitepress-plugin-enhanced-readabilities/client';
import './styles/main. css';

export default {
  extends: VPLTheme,

  enhanceApp(ctx) {
    // Configure enhanced readabilities with all options
    ctx.app.provide(NolebaseEnhancedReadabilitiesInjectionKey, {
      layoutSwitch: {
        defaultMode: LayoutMode.SidebarWidthAdjustableOnly,
        contentLayoutMaxWidth:  {
          defaultMaxWidth: 100,
        },
      },
      spotlight: {
        defaultToggle: false,
        defaultToggledOn: false,
      },
    });
    
    // Register the plugin FIRST
    ctx.app.use(NolebaseEnhancedReadabilitiesPlugin);
    
    // Then call parent theme's enhanceApp
    if (VPLTheme.enhanceApp) {
      VPLTheme.enhanceApp(ctx);
    }
    
    // Register other components
    ctx.app.component('vImageViewer', vImageViewer);
    vitepressBackToTop({ threshold: 300 });
  },

  setup() {
    const route = useRoute();
    imageViewer(route);
  },
};
