import { defineComponent, ref, computed, onMounted } from 'vue'
import { store, config } from '../store.js'
import { generateGatusYaml } from '../yaml-generator.js'
import { parseGatusYaml } from '../yaml-parser.js'

export default defineComponent({
  name: 'SavedImport',
  setup() {
    const activeTab = ref('saved')

    // ── Saved configs state ──
    const configs = ref([])
    const loading = ref(false)
    const error = ref(null)
    const saveLoading = ref(false)
    const saveName = ref('')
    const saveDescription = ref('')
    const saveSuccess = ref(null)

    const hasEndpointErrors = computed(() =>
      config.endpoints.some(e => !e.name?.trim() || !e.url?.trim())
    )

    async function loadList() {
      loading.value = true
      error.value = null
      try {
        const res = await fetch('/api/configs/')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        configs.value = await res.json()
      } catch (e) {
        error.value = 'Backend unreachable. Save as file via the YAML preview.'
      } finally {
        loading.value = false
      }
    }

    async function saveConfig() {
      if (!saveName.value.trim() || hasEndpointErrors.value) return
      saveLoading.value = true
      saveSuccess.value = null
      try {
        const yaml = generateGatusYaml(config)
        const body = {
          name: saveName.value.trim(),
          description: saveDescription.value.trim(),
          yaml_content: yaml,
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
        saveSuccess.value = `"${saved.name}" saved (ID: ${saved.id})`
        await loadList()
      } catch (e) {
        saveSuccess.value = `Error: ${e.message}`
      } finally {
        saveLoading.value = false
      }
    }

    async function loadConfig(id) {
      try {
        const res = await fetch(`/api/configs/${id}`)
        const data = await res.json()
        store.loadConfig(data.config_json)
        store.setSavedConfigId(id)
        saveName.value = data.name
        saveDescription.value = data.description || ''
        store.setActiveSection('endpoints')
      } catch (e) {
        alert(`Failed to load: ${e.message}`)
      }
    }

    async function deleteConfig(id, name) {
      if (!confirm(`Delete "${name}"?`)) return
      await fetch(`/api/configs/${id}`, { method: 'DELETE' })
      if (store.state.savedConfigId === id) store.setSavedConfigId(null)
      await loadList()
    }

    function newConfig() {
      if (!confirm('Start new config? Unsaved changes will be lost.')) return
      location.reload()
    }

    // ── Import state ──
    const yamlInput = ref('')
    const dragActive = ref(false)
    const importStatus = ref(null)
    const fileName = ref('')
    const standaloneMode = computed(() => store.state.standaloneMode)
    const deployedLoading = ref(false)
    const deployedAvailable = ref(null)

    async function checkDeployed() {
      try {
        const res = await fetch('/api/deploy/current')
        deployedAvailable.value = res.ok
      } catch {
        deployedAvailable.value = false
      }
    }

    async function loadDeployed() {
      if (!confirm('Load the currently deployed config? This will overwrite your current editor state.')) return
      deployedLoading.value = true
      importStatus.value = null
      try {
        const res = await fetch('/api/deploy/current')
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.detail || `HTTP ${res.status}`)
        }
        const data = await res.json()
        doImport(data.yaml_content, 'deployed')
      } catch (e) {
        importStatus.value = { ok: false, message: `Failed to load deployed config: ${e.message}` }
      } finally {
        deployedLoading.value = false
      }
    }

    function doImport(yamlString, source) {
      importStatus.value = null
      if (!yamlString.trim()) {
        importStatus.value = { ok: false, message: 'No YAML content provided.' }
        return
      }
      try {
        const parsed = parseGatusYaml(yamlString)
        store.loadConfig(JSON.stringify(parsed))
        store.setSavedConfigId(null)

        const epCount = parsed.endpoints?.length ?? 0
        const label = source === 'deployed' ? 'Deployed configuration' : 'Configuration'
        importStatus.value = {
          ok: true,
          message: `${label} imported successfully (${epCount} endpoint${epCount !== 1 ? 's' : ''}).`,
        }

        setTimeout(() => store.setActiveSection('endpoints'), 800)
      } catch (e) {
        importStatus.value = { ok: false, message: `Parse error: ${e.message}` }
      }
    }

    function importFromPaste() {
      doImport(yamlInput.value)
    }

    function isYamlFile(name) {
      const ext = name.split('.').pop().toLowerCase()
      return ext === 'yaml' || ext === 'yml'
    }

    function handleFile(file) {
      if (!file) return
      if (!isYamlFile(file.name)) {
        importStatus.value = { ok: false, message: 'Only .yaml and .yml files are accepted.' }
        return
      }
      fileName.value = file.name
      const reader = new FileReader()
      reader.onload = () => {
        yamlInput.value = reader.result
        doImport(reader.result)
      }
      reader.onerror = () => {
        importStatus.value = { ok: false, message: `Failed to read file: ${file.name}` }
      }
      reader.readAsText(file)
    }

    function onFileChange(e) {
      handleFile(e.target.files?.[0])
      e.target.value = ''
    }

    function onDrop(e) {
      e.preventDefault()
      dragActive.value = false
      const file = e.dataTransfer?.files?.[0]
      if (file) handleFile(file)
    }

    function onDragOver(e) {
      e.preventDefault()
      dragActive.value = true
    }

    function onDragLeave() {
      dragActive.value = false
    }

    function clearInput() {
      yamlInput.value = ''
      fileName.value = ''
      importStatus.value = null
    }

    onMounted(async () => {
      await Promise.all([loadList(), checkDeployed()])
      if (store.state.savedConfigId) {
        const active = configs.value.find(c => c.id === store.state.savedConfigId)
        if (active) {
          saveName.value = active.name
          saveDescription.value = active.description || ''
        }
      }
    })

    return {
      activeTab,
      configs, loading, error, saveLoading, saveName, saveDescription, saveSuccess,
      hasEndpointErrors,
      saveConfig, loadConfig, deleteConfig, newConfig, store,
      yamlInput, dragActive, importStatus, fileName,
      standaloneMode, deployedLoading, deployedAvailable,
      importFromPaste, loadDeployed, onFileChange, onDrop, onDragOver, onDragLeave, clearInput,
    }
  },
  template: `
    <div class="section-container">
      <div class="section-header">
        <div>
          <h2 class="section-title">Saved &amp; Import</h2>
          <p class="section-desc">Save, load and import configurations.</p>
        </div>
        <button class="btn-secondary" @click="newConfig">+ New config</button>
      </div>

      <div class="tab-bar">
        <button :class="['tab-btn', { active: activeTab === 'saved' }]" @click="activeTab = 'saved'">
          💾 Saved
          <span v-if="configs.length > 0" class="tab-count">{{ configs.length }}</span>
        </button>
        <button :class="['tab-btn', { active: activeTab === 'import' }]" @click="activeTab = 'import'">
          📥 Import
        </button>
      </div>

      <!-- ═══ Saved tab ═══ -->
      <div v-if="activeTab === 'saved'" class="tab-content">
        <div class="save-form">
          <h3 class="subsection-title">{{ store.state.savedConfigId ? 'Update current config' : 'Save current config' }}</h3>
          <div class="form-grid-2">
            <div class="form-field">
              <label class="field-label">Name *</label>
              <input v-model="saveName" type="text" class="input-field" placeholder="Production config" />
            </div>
            <div class="form-field">
              <label class="field-label">Description</label>
              <input v-model="saveDescription" type="text" class="input-field" placeholder="Optional description" />
            </div>
          </div>
          <button class="btn-primary" @click="saveConfig" :disabled="saveLoading || !saveName.trim() || hasEndpointErrors">
            {{ saveLoading ? 'Saving…' : (store.state.savedConfigId ? '💾 Update' : '💾 Save') }}
          </button>
          <div v-if="hasEndpointErrors" class="save-feedback status-error">⚠ All endpoints require a name and URL before saving.</div>
          <div v-if="saveSuccess" class="save-feedback">{{ saveSuccess }}</div>
        </div>

        <div v-if="loading" class="loading-hint">Loading…</div>
        <div v-if="error" class="error-hint">{{ error }}</div>

        <div v-if="!loading && configs.length === 0 && !error" class="empty-hint">
          No saved configurations yet.
        </div>

        <div v-if="configs.length > 0" class="config-list">
          <div
            v-for="c in configs"
            :key="c.id"
            :class="['config-item', { 'is-active': store.state.savedConfigId === c.id }]"
          >
            <div class="config-item-info">
              <strong>{{ c.name }}</strong>
              <span v-if="store.state.savedConfigId === c.id" class="active-badge">Active</span>
              <span class="config-meta">{{ c.description }}</span>
              <span class="config-date">{{ new Date(c.updated_at).toLocaleString('en-US') }}</span>
            </div>
            <div class="config-item-actions">
              <button class="btn-secondary btn-sm" @click="loadConfig(c.id)">Load</button>
              <button class="btn-danger btn-sm" @click="deleteConfig(c.id, c.name)">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Import tab ═══ -->
      <div v-if="activeTab === 'import'" class="tab-content">
        <div v-if="importStatus" :class="['status-banner', 'import-status', importStatus.ok ? 'status-ok' : 'status-error']">
          {{ importStatus.ok ? '✓ ' : '✕ ' }}{{ importStatus.message }}
        </div>

        <div :class="['deployed-card', { 'deployed-card-disabled': standaloneMode }]">
          <div class="deployed-card-inner">
            <div class="deployed-card-info">
              <strong>🚀 Deployed configuration</strong>
              <span v-if="standaloneMode" class="deployed-card-desc">Unavailable in standalone mode (no Gatus instance connected).</span>
              <span v-else class="deployed-card-desc">Load the config.yaml that is currently live on the server.</span>
            </div>
            <button
              class="btn-deploy"
              @click="loadDeployed"
              :disabled="standaloneMode || deployedLoading || deployedAvailable === false"
            >
              {{ deployedLoading ? 'Loading…' : '↓ Load deployed' }}
            </button>
          </div>
          <div v-if="!standaloneMode && deployedAvailable === false" class="deployed-unavailable">
            No deployed config found on the server.
          </div>
        </div>

        <div class="import-divider">
          <span class="import-divider-text">or import from file / paste</span>
        </div>

        <div
          :class="['import-dropzone', { 'drag-active': dragActive }]"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
        >
          <div class="dropzone-content">
            <div class="dropzone-icon">📄</div>
            <p class="dropzone-text">
              Drag &amp; drop a <strong>.yaml</strong> / <strong>.yml</strong> file here
            </p>
            <span class="dropzone-or">or</span>
            <label class="btn-secondary btn-sm dropzone-btn">
              Browse file…
              <input type="file" accept=".yaml,.yml" @change="onFileChange" hidden />
            </label>
            <span v-if="fileName" class="dropzone-filename">{{ fileName }}</span>
          </div>
        </div>

        <div class="import-divider">
          <span class="import-divider-text">or paste YAML below</span>
        </div>

        <div class="import-paste-area">
          <textarea
            v-model="yamlInput"
            class="import-textarea mono"
            placeholder="Paste your Gatus config.yaml content here…"
            rows="16"
            spellcheck="false"
          ></textarea>
          <div class="import-paste-actions">
            <button class="btn-primary" @click="importFromPaste" :disabled="!yamlInput.trim()">
              ↑ Import configuration
            </button>
            <button class="btn-secondary btn-sm" @click="clearInput" v-if="yamlInput">
              Clear
            </button>
          </div>
        </div>

        <div class="info-box" style="margin-top:20px">
          <strong>Tip:</strong> The import will overwrite your current configuration.
          Conditions are imported as raw strings — you can convert them to the visual builder afterwards.
        </div>
      </div>
    </div>
  `,
})
