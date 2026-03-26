import { defineComponent, ref, computed } from 'vue'
import { store, config } from '../store.js'
import ConditionBuilder from './ConditionBuilder.js'

const ALERT_TYPES = [
  'slack', 'discord', 'telegram', 'teams-workflows', 'email',
  'pagerduty', 'ntfy', 'googlechat', 'gotify', 'opsgenie',
  'mattermost', 'pushover', 'aws-ses', 'clickup', 'datadog',
  'gitea', 'github', 'gitlab', 'homeassistant', 'ifttt',
  'ilert', 'incident-io', 'line', 'matrix', 'messagebird',
  'n8n', 'newrelic', 'plivo', 'rocketchat', 'sendgrid',
  'signal', 'signl4', 'splunk', 'squadcast', 'twilio',
  'vonage', 'webex', 'zapier', 'zulip', 'custom',
]

export default defineComponent({
  name: 'EndpointForm',
  components: { ConditionBuilder },
  props: {
    endpoint: { type: Object, required: true },
  },
  setup(props) {
    const tab = ref('basic')
    const expanded = ref(true)
    const isSsh = computed(() => props.endpoint.url.trim().toLowerCase().startsWith('ssh://'))
    const isFirst = computed(() => config.endpoints[0]?._id === props.endpoint._id)
    const isLast = computed(() => config.endpoints[config.endpoints.length - 1]?._id === props.endpoint._id)

    const c = props.endpoint.client || (props.endpoint.client = {})
    if (!c.tls) c.tls = { certificateFile: '', privateKeyFile: '', renegotiation: 'never' }
    if (!c.oauth2) c.oauth2 = { tokenUrl: '', clientId: '', clientSecret: '', scopes: '' }
    if (!c.identityAwareProxy) c.identityAwareProxy = { audience: '' }
    if (c.network === undefined) c.network = ''
    if (c.tunnel === undefined) c.tunnel = ''

    function toggle() {
      expanded.value = !expanded.value
    }

    return { tab, expanded, toggle, store, ALERT_TYPES, isSsh, isFirst, isLast }
  },
  template: `
    <div class="endpoint-card" :class="{ disabled: !endpoint.enabled }">
      <div class="endpoint-header" @click="toggle">
        <div class="endpoint-title-row">
          <span class="drag-handle" @click.stop title="Drag to reorder">⠿</span>
          <span class="endpoint-toggle">{{ expanded ? '▾' : '▸' }}</span>
          <span class="endpoint-name-label">
            {{ endpoint.name || '(unnamed endpoint)' }}
          </span>
          <span v-if="endpoint.group" class="endpoint-group-badge">{{ endpoint.group }}</span>
          <span class="endpoint-url-label">{{ endpoint.url }}</span>
        </div>
        <div class="endpoint-actions" @click.stop>
          <div class="move-buttons">
            <button class="btn-move" @click="store.moveEndpoint(endpoint._id, 'up')" :disabled="isFirst" title="Move up">▲</button>
            <button class="btn-move" @click="store.moveEndpoint(endpoint._id, 'down')" :disabled="isLast" title="Move down">▼</button>
          </div>
          <label class="toggle-label">
            <input type="checkbox" v-model="endpoint.enabled" />
            Active
          </label>
          <button class="btn-icon" @click="store.duplicateEndpoint(endpoint._id)" title="Duplicate">⧉</button>
          <button class="btn-icon-danger" @click="store.removeEndpoint(endpoint._id)" title="Delete">✕</button>
        </div>
      </div>

      <div v-if="expanded" class="endpoint-body">
        <div class="tab-bar">
          <button :class="['tab-btn', { active: tab === 'basic' }]" @click="tab = 'basic'">Basic</button>
          <button :class="['tab-btn', { active: tab === 'conditions' }]" @click="tab = 'conditions'">
            Conditions <span class="tab-count">{{ endpoint.conditions.length }}</span>
          </button>
          <button :class="['tab-btn', { active: tab === 'alerts' }]" @click="tab = 'alerts'">
            Alerts <span class="tab-count">{{ endpoint.alerts.length }}</span>
          </button>
          <button :class="['tab-btn', { active: tab === 'headers' }]" @click="tab = 'headers'">
            Headers <span v-if="endpoint.headers.length" class="tab-count">{{ endpoint.headers.length }}</span>
          </button>
          <button :class="['tab-btn', { active: tab === 'client' }]" @click="tab = 'client'">Client</button>
          <button :class="['tab-btn', { active: tab === 'ui' }]" @click="tab = 'ui'">UI</button>
        </div>

        <!-- BASIC TAB -->
        <div v-if="tab === 'basic'" class="tab-content">
          <div class="form-grid-2">
            <div class="form-field">
              <label class="field-label">Name *</label>
              <input v-model="endpoint.name" type="text" class="input-field" :class="{ 'input-error': !endpoint.name.trim() }" placeholder="my-service" />
              <span v-if="!endpoint.name.trim()" class="field-error">Name is required</span>
            </div>
            <div class="form-field">
              <label class="field-label">Group</label>
              <input v-model="endpoint.group" type="text" class="input-field" placeholder="core" />
            </div>
          </div>
          <div class="form-field">
            <label class="field-label">URL *</label>
            <input v-model="endpoint.url" type="text" class="input-field" :class="{ 'input-error': !endpoint.url.trim() }" placeholder="https://example.com/health" />
            <span v-if="!endpoint.url.trim()" class="field-error">URL is required</span>
            <span v-else class="field-hint">Supports: https://, http://, tcp://, icmp://, dns://, ssh://, ws://, grpc://</span>
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label class="field-label">Method</label>
              <select v-model="endpoint.method" class="input-select">
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
                <option>HEAD</option>
                <option>OPTIONS</option>
              </select>
            </div>
            <div class="form-field">
              <label class="field-label">Interval</label>
              <input v-model="endpoint.interval" type="text" class="input-field" placeholder="60s" />
              <span class="field-hint">e.g. 30s, 5m, 1h</span>
            </div>
          </div>
          <div class="form-field">
            <label class="field-label">Body</label>
            <textarea v-model="endpoint.body" class="input-textarea" rows="3" placeholder='{"key": "value"}'></textarea>
          </div>
          <div v-if="isSsh" class="ssh-section">
            <div class="section-divider-label">SSH Authentication</div>
            <div class="form-grid-2">
              <div class="form-field">
                <label class="field-label">Username *</label>
                <input v-model="endpoint.ssh.username" type="text" class="input-field" :class="{ 'input-error': isSsh && !endpoint.ssh.username.trim() }" placeholder="root" />
                <span v-if="isSsh && !endpoint.ssh.username.trim()" class="field-error">Username is required for SSH endpoints</span>
              </div>
              <div class="form-field">
                <label class="field-label">Password *</label>
                <input v-model="endpoint.ssh.password" type="password" class="input-field" :class="{ 'input-error': isSsh && !endpoint.ssh.password.trim() }" placeholder="password" />
                <span v-if="isSsh && !endpoint.ssh.password.trim()" class="field-error">Password is required for SSH endpoints</span>
              </div>
            </div>
          </div>
        </div>

        <!-- CONDITIONS TAB -->
        <div v-if="tab === 'conditions'" class="tab-content">
          <ConditionBuilder
            :conditions="endpoint.conditions"
            :endpointId="endpoint._id"
            @add="store.addCondition(endpoint._id)"
            @remove="id => store.removeCondition(endpoint._id, id)"
          />
        </div>

        <!-- ALERTS TAB -->
        <div v-if="tab === 'alerts'" class="tab-content">
          <div v-if="endpoint.alerts.length === 0" class="empty-hint">
            No alerts configured. Alerting providers must also be set up in the Alerting section.
          </div>
          <div v-for="alert in endpoint.alerts" :key="alert._id" class="alert-row">
            <div class="form-grid-3">
              <div class="form-field">
                <label class="field-label">Type</label>
                <select v-model="alert.type" class="input-select">
                  <option v-for="t in ALERT_TYPES" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="field-label">Failure threshold</label>
                <input v-model.number="alert.failureThreshold" type="number" min="1" class="input-field" />
              </div>
              <div class="form-field">
                <label class="field-label">Success threshold</label>
                <input v-model.number="alert.successThreshold" type="number" min="1" class="input-field" />
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-field">
                <label class="field-label">Description</label>
                <input v-model="alert.description" type="text" class="input-field" placeholder="service is down" />
              </div>
              <div class="form-field field-checkbox">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="alert.sendOnResolved" />
                  Send on resolved
                </label>
              </div>
            </div>
            <button class="btn-icon-danger btn-sm" @click="store.removeEndpointAlert(endpoint._id, alert._id)">✕ Delete alert</button>
          </div>
          <button class="btn-secondary btn-sm" @click="store.addEndpointAlert(endpoint._id)">+ Add alert</button>
        </div>

        <!-- HEADERS TAB -->
        <div v-if="tab === 'headers'" class="tab-content">
          <div v-if="endpoint.headers.length === 0" class="empty-hint">No headers.</div>
          <div v-for="header in endpoint.headers" :key="header._id" class="header-row">
            <input v-model="header.key" type="text" class="input-field" placeholder="Content-Type" />
            <span class="header-sep">:</span>
            <input v-model="header.value" type="text" class="input-field" placeholder="application/json" />
            <button class="btn-icon-danger" @click="store.removeHeader(endpoint._id, header._id)">✕</button>
          </div>
          <button class="btn-secondary btn-sm" @click="store.addHeader(endpoint._id)">+ Add header</button>
        </div>

        <!-- CLIENT TAB -->
        <div v-if="tab === 'client'" class="tab-content">
          <p class="field-hint" style="margin-bottom: 8px;">
            Configure the HTTP client used for this endpoint. See the
            <a href="https://github.com/TwiN/gatus?tab=readme-ov-file#client-configuration" target="_blank" rel="noopener">Gatus client configuration documentation</a>
            for details.
          </p>
          <div class="form-grid-2">
            <div class="form-field">
              <label class="field-label">Timeout</label>
              <input v-model="endpoint.client.timeout" type="text" class="input-field" placeholder="10s" />
            </div>
            <div class="form-field">
              <label class="field-label">DNS Resolver</label>
              <input v-model="endpoint.client.dnsResolver" type="text" class="input-field" placeholder="tcp://8.8.8.8:53" />
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label class="field-label">Proxy URL</label>
              <input v-model="endpoint.client.proxyUrl" type="text" class="input-field" placeholder="http://proxy:8080" />
            </div>
            <div class="form-field">
              <label class="field-label">Network</label>
              <select v-model="endpoint.client.network" class="input-select">
                <option value="">Default (ip)</option>
                <option value="ip">ip</option>
                <option value="ip4">ip4</option>
                <option value="ip6">ip6</option>
              </select>
              <span class="field-hint">For ICMP endpoints only</span>
            </div>
          </div>
          <div class="form-field">
            <label class="field-label">Tunnel</label>
            <input v-model="endpoint.client.tunnel" type="text" class="input-field" placeholder="production" />
            <span class="field-hint">Name of an SSH tunnel defined in the tunneling section</span>
          </div>
          <div class="form-row-checks">
            <label class="checkbox-label">
              <input type="checkbox" v-model="endpoint.client.insecure" />
              Skip TLS verification (insecure)
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="endpoint.client.ignoreRedirect" />
              Ignore redirects
            </label>
          </div>

          <!-- TLS / mTLS -->
          <div class="section-divider-label">TLS (mTLS)</div>
          <div class="form-grid-2">
            <div class="form-field">
              <label class="field-label">Certificate file</label>
              <input v-model="endpoint.client.tls.certificateFile" type="text" class="input-field" placeholder="/path/to/client_cert.pem" />
            </div>
            <div class="form-field">
              <label class="field-label">Private key file</label>
              <input v-model="endpoint.client.tls.privateKeyFile" type="text" class="input-field" placeholder="/path/to/client_key.pem" />
            </div>
          </div>
          <div class="form-field" style="max-width: 300px;">
            <label class="field-label">Renegotiation</label>
            <select v-model="endpoint.client.tls.renegotiation" class="input-select">
              <option value="never">never</option>
              <option value="once">once</option>
              <option value="freely">freely</option>
            </select>
          </div>

          <!-- OAuth2 -->
          <div class="section-divider-label">OAuth2</div>
          <div class="form-grid-2">
            <div class="form-field">
              <label class="field-label">Token URL</label>
              <input v-model="endpoint.client.oauth2.tokenUrl" type="text" class="input-field" placeholder="https://your-token-server/token" />
            </div>
            <div class="form-field">
              <label class="field-label">Client ID</label>
              <input v-model="endpoint.client.oauth2.clientId" type="text" class="input-field" placeholder="00000000-0000-0000-0000-000000000000" />
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label class="field-label">Client Secret</label>
              <input v-model="endpoint.client.oauth2.clientSecret" type="password" class="input-field" />
            </div>
            <div class="form-field">
              <label class="field-label">Scopes</label>
              <input v-model="endpoint.client.oauth2.scopes" type="text" class="input-field" placeholder="https://api.example.com/.default" />
              <span class="field-hint">Comma-separated list of scopes</span>
            </div>
          </div>

          <!-- Identity-Aware Proxy -->
          <div class="section-divider-label">Identity-Aware Proxy (Google)</div>
          <div class="form-field">
            <label class="field-label">Audience</label>
            <input v-model="endpoint.client.identityAwareProxy.audience" type="text" class="input-field" placeholder="XXXXXXXX-XXXXXXXXXXXX.apps.googleusercontent.com" />
            <span class="field-hint">Client ID of the IAP OAuth2 credential. Uses gcloud default credentials.</span>
          </div>
        </div>

        <!-- UI TAB -->
        <div v-if="tab === 'ui'" class="tab-content">
          <div class="form-row-checks">
            <label class="checkbox-label"><input type="checkbox" v-model="endpoint.ui.hideConditions" /> Hide conditions</label>
            <label class="checkbox-label"><input type="checkbox" v-model="endpoint.ui.hideHostname" /> Hide hostname</label>
            <label class="checkbox-label"><input type="checkbox" v-model="endpoint.ui.hidePort" /> Hide port</label>
            <label class="checkbox-label"><input type="checkbox" v-model="endpoint.ui.hideUrl" /> Hide URL</label>
            <label class="checkbox-label"><input type="checkbox" v-model="endpoint.ui.hideErrors" /> Hide errors</label>
          </div>
        </div>
      </div>
    </div>
  `,
})
