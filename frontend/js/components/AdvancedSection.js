import { defineComponent } from 'vue'
import { store, config } from '../store.js'

export default defineComponent({
  name: 'AdvancedSection',
  setup() {
    return { store, config }
  },
  template: `
    <div class="section-container">
      <div class="section-header">
        <div>
          <h2 class="section-title">Advanced settings</h2>
          <p class="section-desc">Concurrency, metrics, connectivity and other options.</p>
        </div>
      </div>

      <h3 class="subsection-title">General</h3>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="field-label">Concurrency</label>
          <input v-model.number="config.concurrency" type="number" min="0" class="input-field" placeholder="3" />
          <span class="field-hint">Max concurrent endpoint checks. 0 = unlimited. Default: 3</span>
        </div>
        <div class="form-field field-checkbox">
          <label class="checkbox-label">
            <input type="checkbox" v-model="config.metrics" />
            Enable Prometheus metrics (/metrics)
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="config.skipInvalidConfigUpdate" />
            Skip invalid config update (keep running)
          </label>
        </div>
      </div>

      <hr class="section-divider" />

      <h3 class="subsection-title">Connectivity checker</h3>
      <p class="section-desc" style="margin-bottom:16px">
        Gatus skips endpoint checks when there is no internet connection. Configure a connectivity check to detect this.
      </p>
      <div class="form-field">
        <label class="checkbox-label">
          <input type="checkbox" v-model="config.connectivity.enabled" />
          Enable connectivity checker
        </label>
      </div>
      <template v-if="config.connectivity.enabled">
        <div class="form-grid-2">
          <div class="form-field">
            <label class="field-label">Target *</label>
            <input v-model="config.connectivity.target" type="text" class="input-field" placeholder="1.1.1.1:53" />
            <span class="field-hint">host:port – e.g. 1.1.1.1:53 (Cloudflare DNS)</span>
          </div>
          <div class="form-field">
            <label class="field-label">Interval</label>
            <input v-model="config.connectivity.interval" type="text" class="input-field" placeholder="60s" />
          </div>
        </div>
      </template>

      <hr class="section-divider" />

      <h3 class="subsection-title">Tunneling (SSH)</h3>
      <p class="section-desc" style="margin-bottom:16px">
        Define SSH tunnels to monitor internal services through jump hosts or bastion servers.
        Tunnels are referenced by name in endpoint
        <a href="https://github.com/TwiN/gatus?tab=readme-ov-file#tunneling" target="_blank" rel="noopener">client configuration</a>.
      </p>

      <div v-if="config.tunneling.length === 0" class="empty-hint" style="margin-bottom:12px">
        No tunnels defined. Add one below ↓
      </div>

      <div v-for="(tunnel, idx) in config.tunneling" :key="tunnel._id" class="card" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="field-label" style="margin-bottom:0">Tunnel {{ idx + 1 }}: {{ tunnel.name || '(unnamed)' }}</span>
          <button class="btn-icon btn-icon-danger" title="Remove tunnel" @click="store.removeTunnel(tunnel._id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="form-grid-2">
          <div class="form-field">
            <label class="field-label">Tunnel name *</label>
            <input v-model="tunnel.name" type="text" class="input-field" placeholder="production" />
            <span class="field-hint">Used to reference this tunnel from endpoint client config</span>
          </div>
          <div class="form-field">
            <label class="field-label">Type</label>
            <select v-model="tunnel.type" class="input-select">
              <option value="SSH">SSH</option>
            </select>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-field">
            <label class="field-label">Host *</label>
            <input v-model="tunnel.host" type="text" class="input-field" placeholder="jumphost.example.com" />
          </div>
          <div class="form-field">
            <label class="field-label">Port</label>
            <input v-model.number="tunnel.port" type="number" min="1" max="65535" class="input-field" placeholder="22" />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-field">
            <label class="field-label">Username *</label>
            <input v-model="tunnel.username" type="text" class="input-field" placeholder="monitoring" />
          </div>
          <div class="form-field">
            <label class="field-label">Password</label>
            <input v-model="tunnel.password" type="password" class="input-field" />
            <span class="field-hint">Use either password or private key</span>
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">Private key (PEM)</label>
          <textarea v-model="tunnel.privateKey" class="input-field" rows="4" placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----" style="font-family:monospace;font-size:0.8rem"></textarea>
          <span class="field-hint">SSH private key in PEM format (use either this or password)</span>
        </div>
      </div>

      <button class="btn btn-sm" @click="store.addTunnel()">+ Add tunnel</button>

      <hr class="section-divider" />

      <h3 class="subsection-title">Remote instances
        <span style="font-size:0.75rem;font-weight:400;color:var(--color-warning, #e2a308);margin-left:8px">EXPERIMENTAL</span>
      </h3>
      <p class="section-desc" style="margin-bottom:16px">
        Retrieve endpoint statuses from remote Gatus instances and display them on a single dashboard.
        See <a href="https://github.com/TwiN/gatus?tab=readme-ov-file#remote-instances-experimental" target="_blank" rel="noopener">documentation</a>.
      </p>

      <div v-if="config.remote.instances.length === 0" class="empty-hint" style="margin-bottom:12px">
        No remote instances defined. Add one below ↓
      </div>

      <div v-for="(inst, idx) in config.remote.instances" :key="inst._id" class="card" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="field-label" style="margin-bottom:0">Instance {{ idx + 1 }}: {{ inst.endpointPrefix || '(no prefix)' }}</span>
          <button class="btn-icon btn-icon-danger" title="Remove instance" @click="store.removeRemoteInstance(inst._id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="form-grid-2">
          <div class="form-field">
            <label class="field-label">URL *</label>
            <input v-model="inst.url" type="text" class="input-field" placeholder="https://status.example.org/api/v1/endpoints/statuses" />
            <span class="field-hint">URL from which to retrieve endpoint statuses</span>
          </div>
          <div class="form-field">
            <label class="field-label">Endpoint prefix</label>
            <input v-model="inst.endpointPrefix" type="text" class="input-field" placeholder="status.example.org-" />
            <span class="field-hint">String to prefix all endpoint names from this instance</span>
          </div>
        </div>
      </div>

      <button class="btn btn-sm" @click="store.addRemoteInstance()">+ Add remote instance</button>
    </div>
  `,
})
