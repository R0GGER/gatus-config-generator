import { defineComponent, ref, computed, watch } from 'vue'
import { config } from '../store.js'

function sanitizeKeyPart(str) {
  return str.toLowerCase().replace(/[ /_,.#+&]/g, '-')
}

function endpointKey(group, name) {
  const g = sanitizeKeyPart(group || '')
  const n = sanitizeKeyPart(name || '')
  return g ? `${g}_${n}` : `_${n}`
}

const BADGE_TYPES = [
  { id: 'health', label: 'Health', desc: 'Up/down status badge (SVG)' },
  { id: 'health-shields', label: 'Health (Shields.io)', desc: 'Up/down via Shields.io endpoint badge' },
  { id: 'uptime', label: 'Uptime', desc: 'Uptime percentage over a duration' },
  { id: 'response-time', label: 'Response Time', desc: 'Average response time over a duration' },
]

const CHART_TYPES = [
  { id: 'response-time-chart', label: 'Response Time Chart', desc: 'SVG line chart of response times' },
]

const BADGE_DURATIONS = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
]

const CHART_DURATIONS = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
]

export default defineComponent({
  name: 'BadgeChartSection',
  setup() {
    const baseUrl = ref(localStorage.getItem('gatus-badge-base-url') || '')
    const mode = ref('badge')
    const badgeType = ref('health')
    const chartType = ref('response-time-chart')
    const duration = ref('7d')
    const selectedEndpointId = ref('')
    const manualGroup = ref('')
    const manualName = ref('')
    const useManual = ref(false)
    const copied = ref('')

    watch(baseUrl, (v) => localStorage.setItem('gatus-badge-base-url', v))

    const endpoints = computed(() =>
      config.endpoints.filter(ep => ep.name)
    )

    const selectedEndpoint = computed(() =>
      endpoints.value.find(ep => ep._id === selectedEndpointId.value)
    )

    const currentKey = computed(() => {
      if (useManual.value) {
        return endpointKey(manualGroup.value, manualName.value)
      }
      const ep = selectedEndpoint.value
      if (!ep) return ''
      return endpointKey(ep.group, ep.name)
    })

    const needsDuration = computed(() =>
      mode.value === 'chart' || (badgeType.value !== 'health' && badgeType.value !== 'health-shields')
    )

    const availableDurations = computed(() =>
      mode.value === 'chart' ? CHART_DURATIONS : BADGE_DURATIONS
    )

    const normalizedBase = computed(() => {
      let url = baseUrl.value.trim()
      if (url && !url.startsWith('http')) url = 'https://' + url
      return url.replace(/\/+$/, '')
    })

    const generatedPath = computed(() => {
      const key = currentKey.value
      if (!key) return ''
      if (mode.value === 'chart') {
        return `/api/v1/endpoints/${key}/response-times/${duration.value}/chart.svg`
      }
      if (badgeType.value === 'health') {
        return `/api/v1/endpoints/${key}/health/badge.svg`
      }
      if (badgeType.value === 'health-shields') {
        return `/api/v1/endpoints/${key}/health/badge.shields`
      }
      if (badgeType.value === 'uptime') {
        return `/api/v1/endpoints/${key}/uptimes/${duration.value}/badge.svg`
      }
      return `/api/v1/endpoints/${key}/response-times/${duration.value}/badge.svg`
    })

    const isShieldsIo = computed(() => mode.value === 'badge' && badgeType.value === 'health-shields')

    const fullUrl = computed(() => {
      if (!normalizedBase.value || !generatedPath.value) return ''
      const gatusUrl = normalizedBase.value + generatedPath.value
      if (isShieldsIo.value) {
        return `https://img.shields.io/endpoint?url=${encodeURIComponent(gatusUrl)}`
      }
      return gatusUrl
    })

    const displayLabel = computed(() => {
      if (useManual.value) return manualName.value || 'endpoint'
      return selectedEndpoint.value?.name || 'endpoint'
    })

    const htmlEmbed = computed(() => {
      if (!fullUrl.value) return ''
      const alt = mode.value === 'chart'
        ? `Response time chart - ${displayLabel.value}`
        : `${badgeType.value} badge - ${displayLabel.value}`
      return `<img src="${fullUrl.value}" alt="${alt}" />`
    })

    const markdownEmbed = computed(() => {
      if (!fullUrl.value) return ''
      const alt = mode.value === 'chart'
        ? `Response time chart - ${displayLabel.value}`
        : `${badgeType.value} badge - ${displayLabel.value}`
      return `![${alt}](${fullUrl.value})`
    })

    function copyToClipboard(text, label) {
      navigator.clipboard.writeText(text).then(() => {
        copied.value = label
        setTimeout(() => { copied.value = '' }, 2000)
      })
    }

    return {
      config, baseUrl, mode, badgeType, chartType, duration,
      selectedEndpointId, manualGroup, manualName, useManual,
      endpoints, currentKey, needsDuration, availableDurations, fullUrl, generatedPath,
      normalizedBase, isShieldsIo, htmlEmbed, markdownEmbed, copied,
      BADGE_TYPES, CHART_TYPES,
      copyToClipboard,
    }
  },
  template: `
    <div class="section-container">
      <div class="section-header">
        <div>
          <h2 class="section-title">Badges & Charts</h2>
          <p class="section-desc">Generate embeddable badges and charts from your Gatus instance.</p>
        </div>
      </div>

      <div class="info-box">
        Gatus exposes SVG badges and charts via its API. Set your base URL below and select an endpoint to generate embed codes for use in dashboards, README files, or any webpage.
      </div>

      <!-- Base URL -->
      <div class="form-field">
        <label class="field-label">Gatus Base URL</label>
        <input
          v-model="baseUrl"
          type="text"
          class="input-field"
          placeholder="https://status.example.com"
        />
        <span class="field-hint">The public URL of your running Gatus instance. This is saved in your browser.</span>
      </div>

      <hr class="section-divider" />

      <!-- Mode: Badge / Chart -->
      <h3 class="subsection-title">Type</h3>
      <div class="radio-group" style="margin-bottom:16px">
        <label class="radio-label">
          <input type="radio" v-model="mode" value="badge" />
          <div class="radio-card">
            <strong>Badge</strong>
            <span>Health, uptime, or response time badge (SVG)</span>
          </div>
        </label>
        <label class="radio-label">
          <input type="radio" v-model="mode" value="chart" />
          <div class="radio-card">
            <strong>Chart</strong>
            <span>Response time line chart (SVG)</span>
          </div>
        </label>
      </div>

      <!-- Badge sub-type -->
      <div v-if="mode === 'badge'">
        <h3 class="subsection-title">Badge type</h3>
        <div class="badge-type-grid">
          <button
            v-for="bt in BADGE_TYPES"
            :key="bt.id"
            :class="['badge-type-card', { active: badgeType === bt.id }]"
            @click="badgeType = bt.id"
          >
            <span class="badge-type-label">{{ bt.label }}</span>
            <span class="badge-type-desc">{{ bt.desc }}</span>
          </button>
        </div>
      </div>

      <hr class="section-divider" />

      <!-- Endpoint selection -->
      <h3 class="subsection-title">Endpoint</h3>

      <div class="form-field" style="margin-bottom:8px">
        <label class="checkbox-label">
          <input type="checkbox" v-model="useManual" />
          Enter endpoint key manually
        </label>
      </div>

      <div v-if="!useManual">
        <div class="form-field" v-if="endpoints.length > 0">
          <label class="field-label">Select endpoint</label>
          <select v-model="selectedEndpointId" class="input-select">
            <option value="" disabled>Choose an endpoint...</option>
            <option v-for="ep in endpoints" :key="ep._id" :value="ep._id">
              {{ ep.group ? ep.group + ' / ' : '' }}{{ ep.name }}
            </option>
          </select>
        </div>
        <div v-else class="empty-hint">
          No endpoints configured yet. Add endpoints in the Endpoints section, or enter the key manually.
        </div>
      </div>

      <div v-if="useManual" class="form-grid-2">
        <div class="form-field">
          <label class="field-label">Group</label>
          <input v-model="manualGroup" type="text" class="input-field" placeholder="core (optional)" />
        </div>
        <div class="form-field">
          <label class="field-label">Endpoint name</label>
          <input v-model="manualName" type="text" class="input-field" placeholder="my-api" />
        </div>
      </div>

      <div v-if="currentKey" class="form-field" style="margin-top:8px">
        <label class="field-label">Resolved key</label>
        <code class="code-snippet" style="font-size:12px">{{ currentKey }}</code>
      </div>

      <!-- Duration -->
      <div v-if="needsDuration" style="margin-top:16px">
        <h3 class="subsection-title">Duration</h3>
        <div class="duration-picker">
          <button
            v-for="d in availableDurations"
            :key="d.value"
            :class="['day-btn', { active: duration === d.value }]"
            @click="duration = d.value"
          >{{ d.label }}</button>
        </div>
      </div>

      <hr class="section-divider" />

      <!-- Preview & output -->
      <h3 class="subsection-title">Preview & embed codes</h3>

      <div v-if="!fullUrl" class="empty-hint">
        Set a base URL and select an endpoint to see the preview and embed codes.
      </div>

      <div v-if="fullUrl" class="embed-output-section">
        <!-- Live preview -->
        <div class="embed-preview-card">
          <div class="embed-preview-header">
            <span class="embed-preview-title">Live preview</span>
            <span class="embed-preview-hint">Image loaded from your Gatus instance</span>
          </div>
          <div class="embed-preview-body">
            <img :src="fullUrl" :alt="mode === 'chart' ? 'Response time chart' : 'Badge'" class="embed-preview-img" @error="$event.target.style.display='none'" />
            <div class="embed-preview-fallback">
              <span>If the image doesn't load, ensure your Gatus instance is running and accessible at the configured URL.</span>
            </div>
          </div>
        </div>

        <!-- Direct URL -->
        <div class="embed-code-block">
          <div class="embed-code-header">
            <span class="embed-code-label">Direct URL</span>
            <button class="btn-icon-sm" @click="copyToClipboard(fullUrl, 'url')">
              {{ copied === 'url' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <code class="code-block">{{ fullUrl }}</code>
        </div>

        <!-- Gatus JSON endpoint (Shields.io) -->
        <div v-if="isShieldsIo" class="embed-code-block">
          <div class="embed-code-header">
            <span class="embed-code-label">Gatus JSON Endpoint</span>
            <button class="btn-icon-sm" @click="copyToClipboard(normalizedBase + generatedPath, 'json')">
              {{ copied === 'json' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <code class="code-block">{{ normalizedBase + generatedPath }}</code>
        </div>

        <!-- API path only -->
        <div class="embed-code-block">
          <div class="embed-code-header">
            <span class="embed-code-label">API Path</span>
            <button class="btn-icon-sm" @click="copyToClipboard(generatedPath, 'path')">
              {{ copied === 'path' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <code class="code-block">{{ generatedPath }}</code>
        </div>

        <!-- HTML embed -->
        <div class="embed-code-block">
          <div class="embed-code-header">
            <span class="embed-code-label">HTML</span>
            <button class="btn-icon-sm" @click="copyToClipboard(htmlEmbed, 'html')">
              {{ copied === 'html' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <code class="code-block">{{ htmlEmbed }}</code>
        </div>

        <!-- Markdown embed -->
        <div class="embed-code-block">
          <div class="embed-code-header">
            <span class="embed-code-label">Markdown</span>
            <button class="btn-icon-sm" @click="copyToClipboard(markdownEmbed, 'md')">
              {{ copied === 'md' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <code class="code-block">{{ markdownEmbed }}</code>
        </div>
      </div>
    </div>
  `,
})
