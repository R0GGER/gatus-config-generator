import { createApp, defineComponent, computed } from 'vue'
import { store } from './store.js'

import Sidebar from './components/Sidebar.js'
import EndpointsEditor from './components/EndpointsEditor.js'
import AlertingSection from './components/AlertingSection.js'
import StorageSection from './components/StorageSection.js'
import SecuritySection from './components/SecuritySection.js'
import MaintenanceSection from './components/MaintenanceSection.js'
import UISection from './components/UISection.js'
import AdvancedSection from './components/AdvancedSection.js'
import BadgeChartSection from './components/BadgeChartSection.js'
import YamlPreview from './components/YamlPreview.js'
import SavedImport from './components/SavedImport.js'

const App = defineComponent({
  name: 'GatusGenerator',
  components: {
    Sidebar,
    EndpointsEditor,
    AlertingSection,
    StorageSection,
    SecuritySection,
    MaintenanceSection,
    UISection,
    AdvancedSection,
    BadgeChartSection,
    YamlPreview,
    SavedImport,
  },
  setup() {
    const activeSection = computed(() => store.state.activeSection)
    return { activeSection }
  },
  template: `
    <div class="app-layout">
      <Sidebar />

      <main class="main-content">
        <div class="editor-area">
          <EndpointsEditor v-if="activeSection === 'endpoints'" />
          <AlertingSection v-if="activeSection === 'alerting'" />
          <StorageSection v-if="activeSection === 'storage'" />
          <SecuritySection v-if="activeSection === 'security'" />
          <MaintenanceSection v-if="activeSection === 'maintenance'" />
          <UISection v-if="activeSection === 'ui'" />
          <AdvancedSection v-if="activeSection === 'advanced'" />
          <BadgeChartSection v-if="activeSection === 'badges'" />
          <SavedImport v-if="activeSection === 'saved'" />
        </div>

        <aside class="preview-area">
          <YamlPreview />
        </aside>
      </main>
    </div>
  `,
})

const app = createApp(App)
app.mount('#app')
store.init()
