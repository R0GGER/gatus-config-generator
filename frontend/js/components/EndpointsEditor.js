import { defineComponent, ref, computed } from 'vue'
import { store, config } from '../store.js'
import EndpointForm from './EndpointForm.js'

export default defineComponent({
  name: 'EndpointsEditor',
  components: { EndpointForm },
  setup() {
    const search = ref('')
    const filterGroup = ref('')
    const dragId = ref(null)
    const dragOverId = ref(null)

    const groups = computed(() => {
      const gs = new Set(config.endpoints.map(e => e.group).filter(Boolean))
      return Array.from(gs).sort()
    })

    const filtered = computed(() => {
      return config.endpoints.filter(ep => {
        const matchSearch = !search.value ||
          ep.name.toLowerCase().includes(search.value.toLowerCase()) ||
          ep.url.toLowerCase().includes(search.value.toLowerCase())
        const matchGroup = !filterGroup.value || ep.group === filterGroup.value
        return matchSearch && matchGroup
      })
    })

    function importTemplate(template) {
      store.addEndpoint()
      const ep = config.endpoints[config.endpoints.length - 1]
      const { label, ...fields } = template
      Object.assign(ep, fields)
    }

    function onDragStart(event, id) {
      dragId.value = id
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', id)
    }

    function onDragOver(event, id) {
      if (!dragId.value || dragId.value === id) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      dragOverId.value = id
    }

    function onDrop(event, targetId) {
      event.preventDefault()
      if (dragId.value && dragId.value !== targetId) {
        store.reorderEndpoint(dragId.value, targetId)
      }
      dragId.value = null
      dragOverId.value = null
    }

    function onDragEnd() {
      dragId.value = null
      dragOverId.value = null
    }

    const defaultClient = () => ({
      insecure: false, ignoreRedirect: false, timeout: '10s', dnsResolver: '', proxyUrl: '',
      network: '', tunnel: '',
      oauth2: { tokenUrl: '', clientId: '', clientSecret: '', scopes: '' },
      identityAwareProxy: { audience: '' },
      tls: { certificateFile: '', privateKeyFile: '', renegotiation: 'never' },
    })

    const TEMPLATES = [
      {
        label: 'HTTP Health Check',
        url: 'https://example.com/health',
        interval: '60s',
        conditions: [
          { _id: 't1', useRaw: false, fn: '', placeholder: '[STATUS]', operator: '==', value: '200' },
          { _id: 't2', useRaw: false, fn: '', placeholder: '[RESPONSE_TIME]', operator: '<', value: '500' },
        ],
        headers: [], alerts: [], client: defaultClient(),
        ui: { hideConditions: false, hideHostname: false, hidePort: false, hideUrl: false, hideErrors: false },
      },
      {
        label: 'TCP Port Check',
        url: 'tcp://redis:6379',
        interval: '30s',
        conditions: [
          { _id: 't3', useRaw: false, fn: '', placeholder: '[CONNECTED]', operator: '==', value: 'true' },
        ],
        headers: [], alerts: [], client: defaultClient(),
        ui: { hideConditions: false, hideHostname: false, hidePort: false, hideUrl: false, hideErrors: false },
      },
      {
        label: 'ICMP Ping',
        url: 'icmp://example.com',
        interval: '60s',
        conditions: [
          { _id: 't4', useRaw: false, fn: '', placeholder: '[CONNECTED]', operator: '==', value: 'true' },
        ],
        headers: [], alerts: [], client: defaultClient(),
        ui: { hideConditions: false, hideHostname: false, hidePort: false, hideUrl: false, hideErrors: false },
      },
      {
        label: 'SSH Check',
        url: 'ssh://example.com:22',
        interval: '60s',
        conditions: [
          { _id: 't7', useRaw: false, fn: '', placeholder: '[CONNECTED]', operator: '==', value: 'true' },
          { _id: 't8', useRaw: false, fn: '', placeholder: '[STATUS]', operator: '==', value: '0' },
        ],
        ssh: { username: 'username', password: 'password' },
        headers: [], alerts: [], client: defaultClient(),
        ui: { hideConditions: false, hideHostname: false, hidePort: false, hideUrl: false, hideErrors: false },
      },
      {
        label: 'Certificate check',
        url: 'https://example.com',
        interval: '1h',
        conditions: [
          { _id: 't5', useRaw: false, fn: '', placeholder: '[CERTIFICATE_EXPIRATION]', operator: '>', value: '48h' },
          { _id: 't6', useRaw: false, fn: '', placeholder: '[STATUS]', operator: '==', value: '200' },
        ],
        headers: [], alerts: [], client: defaultClient(),
        ui: { hideConditions: false, hideHostname: false, hidePort: false, hideUrl: false, hideErrors: false },
      },
    ]

    return {
      store, config, search, filterGroup, groups, filtered,
      importTemplate, TEMPLATES,
      dragId, dragOverId,
      onDragStart, onDragOver, onDrop, onDragEnd,
    }
  },
  template: `
    <div class="section-container">
      <div class="section-header">
        <div>
          <h2 class="section-title">Endpoints</h2>
          <p class="section-desc">Define the services Gatus should monitor.</p>
        </div>
        <button class="btn-primary" @click="store.addEndpoint()">+ Add endpoint</button>
      </div>

      <!-- Templates -->
      <div class="template-bar">
        <span class="template-label">Add from template:</span>
        <button
          v-for="tmpl in TEMPLATES"
          :key="tmpl.label"
          class="btn-preset"
          @click="importTemplate(tmpl)"
        >{{ tmpl.label }}</button>
      </div>

      <!-- Filter & Sort bar -->
      <div v-if="config.endpoints.length > 0" class="filter-bar">
        <input v-model="search" type="text" class="input-field input-sm" placeholder="Search by name or URL…" />
        <select v-model="filterGroup" class="input-select input-sm">
          <option value="">All groups</option>
          <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
        </select>
        <div class="sort-controls">
          <span class="sort-label">Sort:</span>
          <button class="btn-sort" @click="store.sortEndpoints('name-asc')" title="Sort by name A → Z">Name ↑</button>
          <button class="btn-sort" @click="store.sortEndpoints('name-desc')" title="Sort by name Z → A">Name ↓</button>
          <button class="btn-sort" @click="store.sortEndpoints('type')" title="Sort by protocol type">Type</button>
        </div>
        <span class="filter-count">{{ filtered.length }} / {{ config.endpoints.length }} endpoints</span>
      </div>

      <div v-if="filtered.length === 0 && config.endpoints.length > 0" class="empty-hint">
        No endpoints found for this filter.
      </div>

      <div class="endpoint-list">
        <div
          v-for="ep in filtered"
          :key="ep._id"
          class="endpoint-drag-wrapper"
          :class="{ 'is-dragging': dragId === ep._id, 'drag-over': dragOverId === ep._id }"
          draggable="true"
          @dragstart="onDragStart($event, ep._id)"
          @dragover="onDragOver($event, ep._id)"
          @drop="onDrop($event, ep._id)"
          @dragend="onDragEnd"
        >
          <EndpointForm :endpoint="ep" />
        </div>
      </div>

      <div v-if="config.endpoints.length === 0" class="empty-state">
        <div class="empty-icon">⬡</div>
        <p>No endpoints yet. Click "+ Add endpoint" or pick a template above.</p>
      </div>
    </div>
  `,
})
