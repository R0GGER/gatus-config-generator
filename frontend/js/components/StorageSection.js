import { defineComponent, watch } from 'vue'
import { config } from '../store.js'

const defaultPaths = {
  sqlite: '/data/gatus.db',
  postgres: '',
  memory: '',
}

export default defineComponent({
  name: 'StorageSection',
  setup() {
    watch(() => config.storage.type, (newType) => {
      config.storage.path = defaultPaths[newType] ?? ''
    })
    return { config }
  },
  template: `
    <div class="section-container">
      <div class="section-header">
        <div>
          <h2 class="section-title">Storage</h2>
          <p class="section-desc">Where Gatus stores results, uptime data and events.</p>
        </div>
      </div>

      <div class="form-field">
        <label class="field-label">Type</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="config.storage.type" value="memory" />
            <div class="radio-card">
              <strong>memory</strong>
              <span>In-memory (default). Data is lost on restart.</span>
            </div>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="config.storage.type" value="sqlite" />
            <div class="radio-card">
              <strong>SQLite</strong>
              <span>Local file. Persistent storage, easy to configure.</span>
            </div>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="config.storage.type" value="postgres" />
            <div class="radio-card">
              <strong>PostgreSQL</strong>
              <span>External database. Suitable for production environments.</span>
            </div>
          </label>
        </div>
      </div>

      <template v-if="config.storage.type === 'sqlite'">
        <div class="form-field">
          <label class="field-label">Path *</label>
          <input v-model="config.storage.path" type="text" class="input-field" placeholder="/data/gatus.db" />
          <span class="field-hint">Relative or absolute path to the SQLite file.</span>
        </div>
      </template>

      <template v-if="config.storage.type === 'postgres'">
        <div class="form-field">
          <label class="field-label">Connection URL *</label>
          <input v-model="config.storage.path" type="text" class="input-field" placeholder="postgres://user:password@localhost:5432/gatus?sslmode=disable" />
        </div>
      </template>

      <template v-if="config.storage.type !== 'memory'">
        <div class="form-field">
          <label class="checkbox-label">
            <input type="checkbox" v-model="config.storage.caching" />
            Enable write-through caching (improves load time for large dashboards)
          </label>
        </div>
      </template>

      <div class="form-grid-2">
        <div class="form-field">
          <label class="field-label">Max results per endpoint</label>
          <input v-model.number="config.storage.maximumNumberOfResults" type="number" min="1" class="input-field" />
          <span class="field-hint">Default: 100</span>
        </div>
        <div class="form-field">
          <label class="field-label">Max events per endpoint</label>
          <input v-model.number="config.storage.maximumNumberOfEvents" type="number" min="1" class="input-field" />
          <span class="field-hint">Default: 50</span>
        </div>
      </div>
    </div>
  `,
})
