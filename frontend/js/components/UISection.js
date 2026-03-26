import { defineComponent } from 'vue'
import { config, store } from '../store.js'

export default defineComponent({
  name: 'UISection',
  setup() {
    return { config, store }
  },
  template: `
    <div class="section-container">
      <div class="section-header">
        <div>
          <h2 class="section-title">UI & Web</h2>
          <p class="section-desc">Dashboard display and server settings.</p>
        </div>
      </div>

      <!-- Web config -->
      <h3 class="subsection-title">Web server</h3>
      <div class="form-grid-3">
        <div class="form-field">
          <label class="field-label">Port</label>
          <input v-model.number="config.web.port" type="number" class="input-field" placeholder="8080" />
        </div>
        <div class="form-field">
          <label class="field-label">Bind address</label>
          <input v-model="config.web.address" type="text" class="input-field" placeholder="0.0.0.0" />
        </div>
        <div class="form-field">
          <label class="field-label">Read buffer size</label>
          <input v-model.number="config.web.readBufferSize" type="number" class="input-field" placeholder="8192" />
          <span class="field-hint">Increase on 431 errors (e.g. 32768). <a href="https://github.com/TwiN/gatus?tab=readme-ov-file#how-to-fix-431-request-header-fields-too-large-error" target="_blank" rel="noopener noreferrer" class="hint-link">Learn more</a></span>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-field">
          <label class="field-label">TLS certificate</label>
          <input v-model="config.web.tls.certificateFile" type="text" class="input-field" placeholder="/certs/cert.pem" />
        </div>
        <div class="form-field">
          <label class="field-label">TLS private key</label>
          <input v-model="config.web.tls.privateKeyFile" type="text" class="input-field" placeholder="/certs/key.pem" />
        </div>
      </div>

      <hr class="section-divider" />

      <!-- UI config -->
      <h3 class="subsection-title">Dashboard UI</h3>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="field-label">Page title</label>
          <input v-model="config.ui.title" type="text" class="input-field" placeholder="Health Dashboard | Gatus" />
        </div>
        <div class="form-field">
          <label class="field-label">Header text</label>
          <input v-model="config.ui.header" type="text" class="input-field" placeholder="Gatus" />
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="field-label">Dashboard heading</label>
          <input v-model="config.ui.dashboardHeading" type="text" class="input-field" placeholder="Health Dashboard" />
        </div>
        <div class="form-field">
          <label class="field-label">Dashboard subheading</label>
          <input v-model="config.ui.dashboardSubheading" type="text" class="input-field" placeholder="Monitor the health of your endpoints in real-time" />
        </div>
      </div>
      <div class="form-field">
        <label class="field-label">Description (meta)</label>
        <input v-model="config.ui.description" type="text" class="input-field" />
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="field-label">Logo URL</label>
          <input v-model="config.ui.logo" type="text" class="input-field" placeholder="https://example.com/logo.png" />
        </div>
        <div class="form-field">
          <label class="field-label">Logo link</label>
          <input v-model="config.ui.link" type="text" class="input-field" placeholder="https://example.com" />
        </div>
      </div>
      <!-- Favicon -->
      <h4 class="subsection-title" style="font-size:0.95rem;">Favicon</h4>
      <div class="form-grid-3">
        <div class="form-field">
          <label class="field-label">Default</label>
          <input v-model="config.ui.favicon.default" type="text" class="input-field" placeholder="/favicon.ico or https://..." />
        </div>
        <div class="form-field">
          <label class="field-label">16×16</label>
          <input v-model="config.ui.favicon.size16x16" type="text" class="input-field" placeholder="/favicon-16x16.png or https://..." />
        </div>
        <div class="form-field">
          <label class="field-label">32×32</label>
          <input v-model="config.ui.favicon.size32x32" type="text" class="input-field" placeholder="/favicon-32x32.png or https://..." />
        </div>
      </div>

      <div class="form-grid-3">
        <div class="form-field">
          <label class="field-label">Default sort by</label>
          <select v-model="config.ui.defaultSortBy" class="input-select">
            <option value="name">Name</option>
            <option value="group">Group</option>
            <option value="health">Status</option>
          </select>
        </div>
        <div class="form-field">
          <label class="field-label">Default filter</label>
          <select v-model="config.ui.defaultFilterBy" class="input-select">
            <option value="none">No filter</option>
            <option value="failing">Failing only</option>
            <option value="unstable">Unstable only</option>
          </select>
        </div>
        <div class="form-field field-checkbox">
          <label class="checkbox-label">
            <input type="checkbox" v-model="config.ui.darkMode" />
            Dark mode
          </label>
        </div>
      </div>

      <!-- Buttons -->
      <div class="form-field">
        <label class="field-label">Dashboard buttons</label>
        <div v-if="config.ui.buttons.length === 0" class="empty-hint">No buttons.</div>
        <div v-for="btn in config.ui.buttons" :key="btn._id" class="btn-config-row">
          <input v-model="btn.name" type="text" class="input-field" placeholder="Documentation" />
          <input v-model="btn.link" type="text" class="input-field" placeholder="https://docs.example.com" />
          <button class="btn-icon-danger" @click="store.removeUiButton(btn._id)">✕</button>
        </div>
        <button class="btn-secondary btn-sm" @click="store.addUiButton()">+ Add button</button>
      </div>

      <div class="form-field">
        <label class="field-label">Custom CSS</label>
        <textarea v-model="config.ui.customCss" class="input-textarea mono" rows="5" placeholder=".endpoint-name { color: red; }"></textarea>
      </div>
    </div>
  `,
})
