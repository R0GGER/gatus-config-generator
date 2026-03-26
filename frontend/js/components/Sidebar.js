import { defineComponent, computed } from 'vue'
import { store } from '../store.js'

const SECTIONS = [
  { id: 'endpoints', label: 'Endpoints', icon: '⬡', badge: true },
  { id: 'alerting', label: 'Alerting', icon: '🔔' },
  { id: 'storage', label: 'Storage', icon: '🗄️' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { id: 'ui', label: 'UI & Web', icon: '🖥️' },
  { id: 'advanced', label: 'Advanced', icon: '⚙️' },
  { id: 'badges', label: 'Badges & Charts', icon: '🏷️' },
  { id: 'saved', label: 'Saved / Import', icon: '💾' },
]

export default defineComponent({
  name: 'Sidebar',
  setup() {
    const themeIcon = computed(() => {
      const icon = store.state.theme === 'light' ? 'moon' : 'sun'
      return feather.icons[icon].toSvg({ width: 16, height: 16 })
    })
    return { store, SECTIONS, themeIcon }
  },
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <img src="https://gatus.io/img/logo.png" alt="Gatus" class="brand-logo" onerror="this.style.display='none'">
        <div class="brand-text">
          <span class="brand-title">Gatus</span>
          <span class="brand-sub">Config Generator</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="section in SECTIONS"
          :key="section.id"
          :class="['nav-item', { active: store.state.activeSection === section.id }]"
          @click="store.setActiveSection(section.id)"
        >
          <span class="nav-icon">{{ section.icon }}</span>
          <span class="nav-label">{{ section.label }}</span>
          <span v-if="section.badge && store.state.config.endpoints.length > 0" class="nav-badge">
            {{ store.state.config.endpoints.length }}
          </span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <a href="https://github.com/TwiN/gatus" target="_blank" class="sidebar-link">
            Gatus docs ↗
          </a>
          <button class="theme-toggle" @click="store.toggleTheme()" :title="store.state.theme === 'light' ? 'Dark theme' : 'Light theme'">
            <span v-html="themeIcon"></span>
          </button>
        </div>
      </div>
    </aside>
  `,
})
