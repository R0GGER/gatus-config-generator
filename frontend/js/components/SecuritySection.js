import { defineComponent } from 'vue'
import { config } from '../store.js'

export default defineComponent({
  name: 'SecuritySection',
  setup() {
    return { config }
  },
  template: `
    <div class="section-container">
      <div class="section-header">
        <div>
          <h2 class="section-title">Security</h2>
          <p class="section-desc">Secure the Gatus dashboard with Basic Auth or OIDC.</p>
        </div>
      </div>

      <div class="form-field">
        <label class="field-label">Security type</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="config.security.type" value="none" />
            <div class="radio-card">
              <strong>None</strong>
              <span>Dashboard is publicly accessible.</span>
            </div>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="config.security.type" value="basic" />
            <div class="radio-card">
              <strong>Basic Auth</strong>
              <span>Username + password (bcrypt).</span>
            </div>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="config.security.type" value="oidc" />
            <div class="radio-card">
              <strong>OIDC</strong>
              <span>OpenID Connect (e.g. Okta, Auth0, Keycloak).</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Basic Auth -->
      <template v-if="config.security.type === 'basic'">
        <div class="form-grid-2">
          <div class="form-field">
            <label class="field-label">Username *</label>
            <input v-model="config.security.basic.username" type="text" class="input-field" placeholder="admin" />
          </div>
          <div class="form-field">
            <label class="field-label">Password (bcrypt + base64) *</label>
            <input v-model="config.security.basic.passwordBcryptBase64" type="text" class="input-field mono" placeholder="JDJhJDEwJHR… or $2a$10$…" />
            <span class="field-hint">
              Gatus requires a bcrypt hash encoded as base64. You can paste either format - plain bcrypt hashes (starting with <code>$2</code>) are auto-encoded to base64.
            </span>
          </div>
        </div>
        <div class="field-details-content" style="margin-top: 12px;">
          <p><strong>How to generate a bcrypt + base64 password</strong></p>
          <p>Run the following Docker command:</p>
          <code class="code-block">docker run --rm ghcr.io/r0gger/bcrypt-base64-password:latest YourPassword</code>
          <p>Options:</p>
          <ul>
            <li><code>-r &lt;rounds&gt;</code> — Number of bcrypt rounds (default: 10)</li>
            <li><code>--no-base64</code> — Output the raw bcrypt hash without base64 encoding</li>
          </ul>
          <p>See <a href="https://github.com/R0GGER/bcrypt-base64-password" target="_blank" rel="noopener">bcrypt-base64-password</a> for more details.</p>
        </div>
      </template>

      <!-- OIDC -->
      <template v-if="config.security.type === 'oidc'">
        <div class="form-grid-2">
          <div class="form-field">
            <label class="field-label">Issuer URL *</label>
            <input v-model="config.security.oidc.issuerUrl" type="text" class="input-field" placeholder="https://example.okta.com" />
          </div>
          <div class="form-field">
            <label class="field-label">Redirect URL *</label>
            <input v-model="config.security.oidc.redirectUrl" type="text" class="input-field" placeholder="https://status.example.com/authorization-code/callback" />
            <span class="field-hint">Must end with /authorization-code/callback</span>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-field">
            <label class="field-label">Client ID *</label>
            <input v-model="config.security.oidc.clientId" type="text" class="input-field" />
          </div>
          <div class="form-field">
            <label class="field-label">Client Secret *</label>
            <input v-model="config.security.oidc.clientSecret" type="password" class="input-field" />
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-field">
            <label class="field-label">Scopes</label>
            <input :value="config.security.oidc.scopes.join(', ')" @input="config.security.oidc.scopes = $event.target.value.split(',').map(s => s.trim()).filter(Boolean)" type="text" class="input-field" placeholder="openid" />
            <span class="field-hint">Comma-separated. Minimum: openid</span>
          </div>
          <div class="form-field">
            <label class="field-label">Session TTL</label>
            <input v-model="config.security.oidc.sessionTtl" type="text" class="input-field" placeholder="8h" />
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">Allowed subjects (optional)</label>
          <input
            :value="config.security.oidc.allowedSubjects.join(', ')"
            @input="config.security.oidc.allowedSubjects = $event.target.value.split(',').map(s => s.trim()).filter(Boolean)"
            type="text"
            class="input-field"
            placeholder="user@example.com"
          />
          <span class="field-hint">Empty = anyone with a valid token can log in.</span>
        </div>
      </template>
    </div>
  `,
})
