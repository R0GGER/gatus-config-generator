import { defineComponent, computed, ref } from 'vue'
import { store, config } from '../store.js'
import { generateGatusYaml } from '../yaml-generator.js'

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default defineComponent({
  name: 'YamlPreview',
  setup() {
    const copied = ref(false)
    const deployStatus = ref(null)
    const deployLoading = ref(false)
    const validateStatus = ref(null)
    const saveLoading = ref(false)
    const saveStatus = ref(null)

    const standaloneMode = computed(() => store.state.standaloneMode)
    const invalidEndpoints = computed(() =>
      config.endpoints.filter(e => !e.name?.trim() || !e.url?.trim())
    )
    const hasValidationErrors = computed(() => invalidEndpoints.value.length > 0)

    const yaml = computed(() => {
      try {
        return generateGatusYaml(config)
      } catch (e) {
        return `# Error generating YAML:\n# ${e.message}`
      }
    })

    const lineCount = computed(() => yaml.value.split('\n').length)

    const highlightedYaml = computed(() => {
      if (typeof hljs !== 'undefined') {
        try {
          return hljs.highlight(yaml.value, { language: 'yaml' }).value
        } catch {
          return escapeHtml(yaml.value)
        }
      }
      return escapeHtml(yaml.value)
    })

    function copyToClipboard() {
      navigator.clipboard.writeText(yaml.value).then(() => {
        copied.value = true
        setTimeout(() => (copied.value = false), 2000)
      })
    }

    function downloadYaml() {
      if (hasValidationErrors.value) return
      const blob = new Blob([yaml.value], { type: 'text/yaml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'config.yaml'
      a.click()
      URL.revokeObjectURL(url)
    }

    async function validateYaml() {
      if (hasValidationErrors.value) return
      validateStatus.value = null
      try {
        const res = await fetch('/api/deploy/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ yaml_content: yaml.value }),
        })
        validateStatus.value = await res.json()
      } catch {
        validateStatus.value = { valid: false, warnings: ['Server unreachable'] }
      }
    }

    async function saveConfig() {
      if (hasValidationErrors.value) return
      const name = store.state.savedConfigId
        ? null
        : prompt('Configuration name:', 'My config')
      if (!store.state.savedConfigId && (!name || !name.trim())) return

      saveLoading.value = true
      saveStatus.value = null
      try {
        const body = {
          name: name ? name.trim() : undefined,
          yaml_content: yaml.value,
          config_json: JSON.stringify(config),
        }

        const method = store.state.savedConfigId ? 'PUT' : 'POST'
        const url = store.state.savedConfigId
          ? `/api/configs/${store.state.savedConfigId}`
          : '/api/configs/'

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const saved = await res.json()
        store.setSavedConfigId(saved.id)
        saveStatus.value = { ok: true, message: `Config saved (${saved.name})` }
      } catch (e) {
        saveStatus.value = { ok: false, message: `Save failed: ${e.message}` }
      } finally {
        saveLoading.value = false
        setTimeout(() => (saveStatus.value = null), 4000)
      }
    }

    async function deployYaml() {
      if (hasValidationErrors.value) return
      if (!confirm('Deploy config.yaml to the production environment?')) return
      deployLoading.value = true
      deployStatus.value = null
      try {
        const res = await fetch('/api/deploy/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ yaml_content: yaml.value }),
        })
        const data = await res.json()
        deployStatus.value = res.ok
          ? { ok: true, message: data.message }
          : { ok: false, message: data.detail || 'Deploy failed' }
      } catch {
        deployStatus.value = { ok: false, message: 'Server unreachable' }
      } finally {
        deployLoading.value = false
      }
    }

    return {
      yaml, lineCount, highlightedYaml, copied,
      deployStatus, deployLoading, validateStatus,
      saveLoading, saveStatus, standaloneMode,
      hasValidationErrors, invalidEndpoints,
      copyToClipboard, downloadYaml, validateYaml, deployYaml, saveConfig,
    }
  },
  template: `
    <div class="yaml-preview-panel">
      <div class="yaml-preview-header">
        <div class="yaml-title">
          <span>config.yaml</span>
          <span class="yaml-lines">{{ lineCount }} lines</span>
        </div>
        <div class="yaml-actions">
          <button class="btn-icon-sm" @click="validateYaml" :disabled="hasValidationErrors" title="Validate YAML">✔ Validate</button>
          <button class="btn-icon-sm" @click="copyToClipboard" title="Copy">
            {{ copied ? '✓ Copied' : '⧉ Copy' }}
          </button>
          <button class="btn-icon-sm" @click="downloadYaml" :disabled="hasValidationErrors" title="Download">↓ Download</button>
          <button class="btn-save" @click="saveConfig" :disabled="saveLoading || hasValidationErrors" title="Save config">
            {{ saveLoading ? 'Saving…' : '💾 Save' }}
          </button>
          <button
            class="btn-deploy"
            @click="deployYaml"
            :disabled="standaloneMode || deployLoading || hasValidationErrors"
            :title="standaloneMode ? 'Deploy is unavailable in standalone mode (no Gatus instance connected)' : 'Deploy config to Gatus'"
          >
            {{ deployLoading ? 'Deploying…' : '🚀 Deploy' }}
          </button>
        </div>
      </div>

      <div v-if="hasValidationErrors" class="status-banner status-error">
        ⚠ {{ invalidEndpoints.length }} endpoint(s) missing a name or URL. All endpoints require a name and URL before saving.
      </div>

      <div v-if="validateStatus" :class="['status-banner', validateStatus.valid ? 'status-ok' : 'status-warn']">
        <strong>{{ validateStatus.valid ? '✓ YAML valid' : '⚠ Warning' }}</strong>
        <ul v-if="validateStatus.warnings?.length > 0">
          <li v-for="w in validateStatus.warnings" :key="w">{{ w }}</li>
        </ul>
      </div>

      <div v-if="deployStatus" :class="['status-banner', deployStatus.ok ? 'status-ok' : 'status-error']">
        {{ deployStatus.ok ? '✓ ' : '✕ ' }}{{ deployStatus.message }}
      </div>

      <div v-if="saveStatus" :class="['status-banner', saveStatus.ok ? 'status-ok' : 'status-error']">
        {{ saveStatus.ok ? '✓ ' : '✕ ' }}{{ saveStatus.message }}
      </div>

      <pre class="yaml-code"><code v-html="highlightedYaml"></code></pre>
    </div>
  `,
})
