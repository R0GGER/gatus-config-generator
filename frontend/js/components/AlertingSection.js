import { defineComponent, ref } from 'vue'
import { config } from '../store.js'

function DefaultAlertForm(provider) {
  return `
    <div class="default-alert-box">
      <label class="checkbox-label">
        <input type="checkbox" v-model="${provider}.defaultAlert.enabled" />
        Set default alert for all endpoints
      </label>
      <template v-if="${provider}.defaultAlert.enabled">
        <div class="form-grid-3">
          <div class="form-field">
            <label class="field-label">Failure threshold</label>
            <input v-model.number="${provider}.defaultAlert.failureThreshold" type="number" min="1" class="input-field" />
          </div>
          <div class="form-field">
            <label class="field-label">Success threshold</label>
            <input v-model.number="${provider}.defaultAlert.successThreshold" type="number" min="1" class="input-field" />
          </div>
          <div class="form-field field-checkbox">
            <label class="checkbox-label">
              <input type="checkbox" v-model="${provider}.defaultAlert.sendOnResolved" />
              Send on resolved
            </label>
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">Default description</label>
          <input v-model="${provider}.defaultAlert.description" type="text" class="input-field" placeholder="healthcheck failed" />
        </div>
      </template>
    </div>
  `
}

export default defineComponent({
  name: 'AlertingSection',
  setup() {
    const activeProvider = ref('slack')

    const PROVIDERS = [
      { id: 'slack', label: 'Slack' },
      { id: 'discord', label: 'Discord' },
      { id: 'telegram', label: 'Telegram' },
      { id: 'teamsWorkflows', label: 'Teams (Workflow)' },
      { id: 'email', label: 'E-mail (SMTP)' },
      { id: 'pagerduty', label: 'PagerDuty' },
      { id: 'ntfy', label: 'Ntfy' },
      { id: 'googlechat', label: 'Google Chat' },
      { id: 'gotify', label: 'Gotify' },
      { id: 'opsgenie', label: 'Opsgenie' },
      { id: 'mattermost', label: 'Mattermost' },
      { id: 'pushover', label: 'Pushover' },
      { id: 'awsSes', label: 'AWS SES' },
      { id: 'clickup', label: 'ClickUp' },
      { id: 'datadog', label: 'Datadog' },
      { id: 'gitea', label: 'Gitea' },
      { id: 'github', label: 'GitHub' },
      { id: 'gitlab', label: 'GitLab' },
      { id: 'homeassistant', label: 'HomeAssistant' },
      { id: 'ifttt', label: 'IFTTT' },
      { id: 'ilert', label: 'iLert' },
      { id: 'incidentIo', label: 'Incident.io' },
      { id: 'line', label: 'Line' },
      { id: 'matrix', label: 'Matrix' },
      { id: 'messagebird', label: 'Messagebird' },
      { id: 'n8n', label: 'n8n' },
      { id: 'newrelic', label: 'New Relic' },
      { id: 'plivo', label: 'Plivo' },
      { id: 'rocketchat', label: 'Rocket.Chat' },
      { id: 'sendgrid', label: 'SendGrid' },
      { id: 'signal', label: 'Signal' },
      { id: 'signl4', label: 'SIGNL4' },
      { id: 'splunk', label: 'Splunk' },
      { id: 'squadcast', label: 'Squadcast' },
      { id: 'twilio', label: 'Twilio' },
      { id: 'vonage', label: 'Vonage' },
      { id: 'webex', label: 'Webex' },
      { id: 'zapier', label: 'Zapier' },
      { id: 'zulip', label: 'Zulip' },
      { id: 'custom', label: 'Custom webhook' },
    ]

    const enabledCount = () => PROVIDERS.filter(p => config.alerting[p.id]?.enabled).length

    return { activeProvider, PROVIDERS, config, enabledCount }
  },
  template: `
    <div class="section-container">
      <div class="section-header">
        <div>
          <h2 class="section-title">Alerting</h2>
          <p class="section-desc">Configure notification providers. Endpoints can reference active providers.</p>
        </div>
        <span class="badge-enabled">{{ enabledCount() }} active</span>
      </div>

      <div class="provider-layout">
        <!-- Provider sidebar -->
        <div class="provider-list">
          <button
            v-for="p in PROVIDERS"
            :key="p.id"
            :class="['provider-item', { active: activeProvider === p.id, 'is-enabled': config.alerting[p.id]?.enabled }]"
            @click="activeProvider = p.id"
          >
            <span class="provider-dot" :class="{ on: config.alerting[p.id]?.enabled }"></span>
            {{ p.label }}
          </button>
        </div>

        <!-- Provider forms -->
        <div class="provider-form">

          <!-- SLACK -->
          <template v-if="activeProvider === 'slack'">
            <div class="provider-header">
              <h3>Slack</h3>
              <label class="toggle-label">
                <input type="checkbox" v-model="config.alerting.slack.enabled" />
                Enable
              </label>
            </div>
            <template v-if="config.alerting.slack.enabled">
              <div class="form-field">
                <label class="field-label">Webhook URL *</label>
                <input v-model="config.alerting.slack.webhookUrl" type="text" class="input-field" placeholder="https://hooks.slack.com/services/…" />
              </div>
              <div class="form-field">
                <label class="field-label">Title (optional)</label>
                <input v-model="config.alerting.slack.title" type="text" class="input-field" placeholder=":helmet_with_white_cross: Gatus" />
              </div>
              ${DefaultAlertForm('config.alerting.slack')}
            </template>
          </template>

          <!-- DISCORD -->
          <template v-if="activeProvider === 'discord'">
            <div class="provider-header">
              <h3>Discord</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.discord.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.discord.enabled">
              <div class="form-field">
                <label class="field-label">Webhook URL *</label>
                <input v-model="config.alerting.discord.webhookUrl" type="text" class="input-field" placeholder="https://discord.com/api/webhooks/…" />
              </div>
              <div class="form-field">
                <label class="field-label">Title</label>
                <input v-model="config.alerting.discord.title" type="text" class="input-field" />
              </div>
              <div class="form-field">
                <label class="field-label">Message content (e.g. for @mentions)</label>
                <input v-model="config.alerting.discord.messageContent" type="text" class="input-field" placeholder="<@123456789>" />
              </div>
              ${DefaultAlertForm('config.alerting.discord')}
            </template>
          </template>

          <!-- TELEGRAM -->
          <template v-if="activeProvider === 'telegram'">
            <div class="provider-header">
              <h3>Telegram</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.telegram.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.telegram.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Bot Token *</label>
                  <input v-model="config.alerting.telegram.token" type="text" class="input-field" placeholder="123456:ABC-DEF…" />
                </div>
                <div class="form-field">
                  <label class="field-label">Chat ID *</label>
                  <input v-model="config.alerting.telegram.id" type="text" class="input-field" placeholder="0123456789" />
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Topic ID (optional)</label>
                  <input v-model="config.alerting.telegram.topicId" type="text" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">API URL</label>
                  <input v-model="config.alerting.telegram.apiUrl" type="text" class="input-field" placeholder="https://api.telegram.org" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.telegram')}
            </template>
          </template>

          <!-- TEAMS WORKFLOWS -->
          <template v-if="activeProvider === 'teamsWorkflows'">
            <div class="provider-header">
              <h3>Microsoft Teams (Workflow)</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.teamsWorkflows.enabled" /> Enable</label>
            </div>
            <div class="info-box">The new Teams Workflow alerting (replaces the deprecated Connector)</div>
            <template v-if="config.alerting.teamsWorkflows.enabled">
              <div class="form-field">
                <label class="field-label">Webhook URL *</label>
                <input v-model="config.alerting.teamsWorkflows.webhookUrl" type="text" class="input-field" placeholder="https://…webhook.office.com/…" />
              </div>
              <div class="form-field">
                <label class="field-label">Title</label>
                <input v-model="config.alerting.teamsWorkflows.title" type="text" class="input-field" />
              </div>
              ${DefaultAlertForm('config.alerting.teamsWorkflows')}
            </template>
          </template>

          <!-- EMAIL -->
          <template v-if="activeProvider === 'email'">
            <div class="provider-header">
              <h3>E-mail (SMTP)</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.email.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.email.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">From *</label>
                  <input v-model="config.alerting.email.from" type="email" class="input-field" placeholder="gatus@example.com" />
                </div>
                <div class="form-field">
                  <label class="field-label">To *</label>
                  <input v-model="config.alerting.email.to" type="text" class="input-field" placeholder="ops@example.com" />
                  <span class="field-hint">Comma-separated for multiple recipients</span>
                </div>
              </div>
              <div class="form-grid-3">
                <div class="form-field">
                  <label class="field-label">SMTP host *</label>
                  <input v-model="config.alerting.email.host" type="text" class="input-field" placeholder="smtp.gmail.com" />
                </div>
                <div class="form-field">
                  <label class="field-label">Port *</label>
                  <input v-model.number="config.alerting.email.port" type="number" class="input-field" placeholder="587" />
                </div>
                <div class="form-field field-checkbox">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="config.alerting.email.clientInsecure" />
                    Skip TLS verification
                  </label>
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Username</label>
                  <input v-model="config.alerting.email.username" type="text" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">Password</label>
                  <input v-model="config.alerting.email.password" type="password" class="input-field" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.email')}
            </template>
          </template>

          <!-- PAGERDUTY -->
          <template v-if="activeProvider === 'pagerduty'">
            <div class="provider-header">
              <h3>PagerDuty</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.pagerduty.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.pagerduty.enabled">
              <div class="form-field">
                <label class="field-label">Integration Key *</label>
                <input v-model="config.alerting.pagerduty.integrationKey" type="text" class="input-field" placeholder="********************************" />
              </div>
              <div class="info-box">Recommended: set send-on-resolved on endpoints to automatically close incidents.</div>
              ${DefaultAlertForm('config.alerting.pagerduty')}
            </template>
          </template>

          <!-- NTFY -->
          <template v-if="activeProvider === 'ntfy'">
            <div class="provider-header">
              <h3>Ntfy</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.ntfy.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.ntfy.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Topic *</label>
                  <input v-model="config.alerting.ntfy.topic" type="text" class="input-field" placeholder="my-gatus-alerts" />
                </div>
                <div class="form-field">
                  <label class="field-label">Server URL</label>
                  <input v-model="config.alerting.ntfy.url" type="text" class="input-field" placeholder="https://ntfy.sh" />
                </div>
              </div>
              <div class="form-grid-3">
                <div class="form-field">
                  <label class="field-label">Token</label>
                  <input v-model="config.alerting.ntfy.token" type="text" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">Priority (1-5)</label>
                  <input v-model.number="config.alerting.ntfy.priority" type="number" min="1" max="5" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">Email (extra notif.)</label>
                  <input v-model="config.alerting.ntfy.email" type="email" class="input-field" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.ntfy')}
            </template>
          </template>

          <!-- GOOGLE CHAT -->
          <template v-if="activeProvider === 'googlechat'">
            <div class="provider-header">
              <h3>Google Chat</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.googlechat.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.googlechat.enabled">
              <div class="form-field">
                <label class="field-label">Webhook URL *</label>
                <input v-model="config.alerting.googlechat.webhookUrl" type="text" class="input-field" placeholder="https://chat.googleapis.com/v1/spaces/…" />
              </div>
              ${DefaultAlertForm('config.alerting.googlechat')}
            </template>
          </template>

          <!-- GOTIFY -->
          <template v-if="activeProvider === 'gotify'">
            <div class="provider-header">
              <h3>Gotify</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.gotify.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.gotify.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Server URL *</label>
                  <input v-model="config.alerting.gotify.serverUrl" type="text" class="input-field" placeholder="https://gotify.example.com" />
                </div>
                <div class="form-field">
                  <label class="field-label">Token *</label>
                  <input v-model="config.alerting.gotify.token" type="text" class="input-field" />
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Priority</label>
                  <input v-model.number="config.alerting.gotify.priority" type="number" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">Title</label>
                  <input v-model="config.alerting.gotify.title" type="text" class="input-field" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.gotify')}
            </template>
          </template>

          <!-- OPSGENIE -->
          <template v-if="activeProvider === 'opsgenie'">
            <div class="provider-header">
              <h3>Opsgenie</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.opsgenie.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.opsgenie.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">API Key *</label>
                  <input v-model="config.alerting.opsgenie.apiKey" type="text" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">Priority</label>
                  <select v-model="config.alerting.opsgenie.priority" class="input-select">
                    <option>P1</option><option>P2</option><option>P3</option><option>P4</option><option>P5</option>
                  </select>
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.opsgenie')}
            </template>
          </template>

          <!-- MATTERMOST -->
          <template v-if="activeProvider === 'mattermost'">
            <div class="provider-header">
              <h3>Mattermost</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.mattermost.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.mattermost.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Webhook URL *</label>
                  <input v-model="config.alerting.mattermost.webhookUrl" type="text" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">Channel (optional)</label>
                  <input v-model="config.alerting.mattermost.channel" type="text" class="input-field" placeholder="#alerts" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.mattermost')}
            </template>
          </template>

          <!-- PUSHOVER -->
          <template v-if="activeProvider === 'pushover'">
            <div class="provider-header">
              <h3>Pushover</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.pushover.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.pushover.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Application Token *</label>
                  <input v-model="config.alerting.pushover.applicationToken" type="text" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">User Key *</label>
                  <input v-model="config.alerting.pushover.userKey" type="text" class="input-field" />
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Priority (-2 to 2)</label>
                  <input v-model.number="config.alerting.pushover.priority" type="number" min="-2" max="2" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">Sound</label>
                  <input v-model="config.alerting.pushover.sound" type="text" class="input-field" placeholder="pushover" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.pushover')}
            </template>
          </template>

          <!-- AWS SES -->
          <template v-if="activeProvider === 'awsSes'">
            <div class="provider-header">
              <h3>AWS SES</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.awsSes.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.awsSes.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Region *</label>
                  <input v-model="config.alerting.awsSes.region" type="text" class="input-field" placeholder="us-east-1" />
                </div>
                <div class="form-field">
                  <label class="field-label">From *</label>
                  <input v-model="config.alerting.awsSes.from" type="email" class="input-field" placeholder="status@example.com" />
                </div>
              </div>
              <div class="form-field">
                <label class="field-label">To *</label>
                <input v-model="config.alerting.awsSes.to" type="text" class="input-field" placeholder="user@example.com" />
                <span class="field-hint">Comma-separated for multiple recipients</span>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Access Key ID</label>
                  <input v-model="config.alerting.awsSes.accessKeyId" type="text" class="input-field" />
                  <span class="field-hint">Optional — falls back to IAM authentication</span>
                </div>
                <div class="form-field">
                  <label class="field-label">Secret Access Key</label>
                  <input v-model="config.alerting.awsSes.secretAccessKey" type="password" class="input-field" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.awsSes')}
            </template>
          </template>

          <!-- CLICKUP -->
          <template v-if="activeProvider === 'clickup'">
            <div class="provider-header">
              <h3>ClickUp</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.clickup.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.clickup.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">List ID *</label>
                  <input v-model="config.alerting.clickup.listId" type="text" class="input-field" placeholder="123456789" />
                </div>
                <div class="form-field">
                  <label class="field-label">Token *</label>
                  <input v-model="config.alerting.clickup.token" type="text" class="input-field" placeholder="pk_…" />
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Assignees</label>
                  <input v-model="config.alerting.clickup.assignees" type="text" class="input-field" placeholder="12345, 67890" />
                  <span class="field-hint">Comma-separated user IDs</span>
                </div>
                <div class="form-field">
                  <label class="field-label">Priority</label>
                  <select v-model="config.alerting.clickup.priority" class="input-select">
                    <option value="urgent">urgent</option>
                    <option value="high">high</option>
                    <option value="normal">normal</option>
                    <option value="low">low</option>
                    <option value="none">none</option>
                  </select>
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Status</label>
                  <input v-model="config.alerting.clickup.status" type="text" class="input-field" placeholder="in progress" />
                </div>
                <div class="form-field">
                  <label class="field-label">API URL</label>
                  <input v-model="config.alerting.clickup.apiUrl" type="text" class="input-field" placeholder="https://api.clickup.com/api/v2" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.clickup')}
            </template>
          </template>

          <!-- DATADOG -->
          <template v-if="activeProvider === 'datadog'">
            <div class="provider-header">
              <h3>Datadog</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.datadog.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.datadog.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">API Key *</label>
                  <input v-model="config.alerting.datadog.apiKey" type="text" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">Site</label>
                  <input v-model="config.alerting.datadog.site" type="text" class="input-field" placeholder="datadoghq.com" />
                  <span class="field-hint">e.g. datadoghq.com or datadoghq.eu</span>
                </div>
              </div>
              <div class="form-field">
                <label class="field-label">Tags</label>
                <input v-model="config.alerting.datadog.tags" type="text" class="input-field" placeholder="environment:production, team:platform" />
                <span class="field-hint">Comma-separated tags</span>
              </div>
              ${DefaultAlertForm('config.alerting.datadog')}
            </template>
          </template>

          <!-- GITEA -->
          <template v-if="activeProvider === 'gitea'">
            <div class="provider-header">
              <h3>Gitea</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.gitea.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.gitea.enabled">
              <div class="form-field">
                <label class="field-label">Repository URL *</label>
                <input v-model="config.alerting.gitea.repositoryUrl" type="text" class="input-field" placeholder="https://gitea.com/user/repo" />
              </div>
              <div class="form-field">
                <label class="field-label">Token *</label>
                <input v-model="config.alerting.gitea.token" type="text" class="input-field" placeholder="Personal access token (RW issues, RO metadata)" />
              </div>
              <div class="info-box">Creates issues on alert trigger. If send-on-resolved is enabled, issues are auto-closed on resolve.</div>
              ${DefaultAlertForm('config.alerting.gitea')}
            </template>
          </template>

          <!-- GITHUB -->
          <template v-if="activeProvider === 'github'">
            <div class="provider-header">
              <h3>GitHub</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.github.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.github.enabled">
              <div class="form-field">
                <label class="field-label">Repository URL *</label>
                <input v-model="config.alerting.github.repositoryUrl" type="text" class="input-field" placeholder="https://github.com/user/repo" />
              </div>
              <div class="form-field">
                <label class="field-label">Token *</label>
                <input v-model="config.alerting.github.token" type="text" class="input-field" placeholder="github_pat_…" />
                <span class="field-hint">Personal access token with RW issues and RO metadata</span>
              </div>
              <div class="info-box">Creates issues on alert trigger. If send-on-resolved is enabled, issues are auto-closed on resolve.</div>
              ${DefaultAlertForm('config.alerting.github')}
            </template>
          </template>

          <!-- GITLAB -->
          <template v-if="activeProvider === 'gitlab'">
            <div class="provider-header">
              <h3>GitLab</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.gitlab.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.gitlab.enabled">
              <div class="form-field">
                <label class="field-label">Webhook URL *</label>
                <input v-model="config.alerting.gitlab.webhookUrl" type="text" class="input-field" placeholder="https://gitlab.com/user/repo/alerts/notify/gatus/…" />
              </div>
              <div class="form-field">
                <label class="field-label">Authorization Key *</label>
                <input v-model="config.alerting.gitlab.authorizationKey" type="text" class="input-field" />
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Severity</label>
                  <select v-model="config.alerting.gitlab.severity" class="input-select">
                    <option value="">Default (critical)</option>
                    <option>critical</option><option>high</option><option>medium</option>
                    <option>low</option><option>info</option><option>unknown</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="field-label">Monitoring Tool</label>
                  <input v-model="config.alerting.gitlab.monitoringTool" type="text" class="input-field" placeholder="gatus" />
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Environment Name</label>
                  <input v-model="config.alerting.gitlab.environmentName" type="text" class="input-field" />
                  <span class="field-hint">Required to display alerts on a GitLab dashboard</span>
                </div>
                <div class="form-field">
                  <label class="field-label">Service</label>
                  <input v-model="config.alerting.gitlab.service" type="text" class="input-field" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.gitlab')}
            </template>
          </template>

          <!-- HOMEASSISTANT -->
          <template v-if="activeProvider === 'homeassistant'">
            <div class="provider-header">
              <h3>HomeAssistant</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.homeassistant.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.homeassistant.enabled">
              <div class="form-field">
                <label class="field-label">URL *</label>
                <input v-model="config.alerting.homeassistant.url" type="text" class="input-field" placeholder="http://homeassistant:8123" />
              </div>
              <div class="form-field">
                <label class="field-label">Long-Lived Access Token *</label>
                <input v-model="config.alerting.homeassistant.token" type="text" class="input-field" />
                <span class="field-hint">Profile → Long-Lived Access Tokens → Create Token</span>
              </div>
              <div class="info-box">Sends events of type gatus_alert to HomeAssistant for use in automations.</div>
              ${DefaultAlertForm('config.alerting.homeassistant')}
            </template>
          </template>

          <!-- IFTTT -->
          <template v-if="activeProvider === 'ifttt'">
            <div class="provider-header">
              <h3>IFTTT</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.ifttt.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.ifttt.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Webhook Key *</label>
                  <input v-model="config.alerting.ifttt.webhookKey" type="text" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">Event Name *</label>
                  <input v-model="config.alerting.ifttt.eventName" type="text" class="input-field" placeholder="gatus_alert" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.ifttt')}
            </template>
          </template>

          <!-- ILERT -->
          <template v-if="activeProvider === 'ilert'">
            <div class="provider-header">
              <h3>iLert</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.ilert.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.ilert.enabled">
              <div class="form-field">
                <label class="field-label">Integration Key *</label>
                <input v-model="config.alerting.ilert.integrationKey" type="text" class="input-field" placeholder="Alert Source integration key" />
              </div>
              <div class="info-box">Recommended: set send-on-resolved on endpoints to automatically resolve alerts on iLert.</div>
              ${DefaultAlertForm('config.alerting.ilert')}
            </template>
          </template>

          <!-- INCIDENT.IO -->
          <template v-if="activeProvider === 'incidentIo'">
            <div class="provider-header">
              <h3>Incident.io</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.incidentIo.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.incidentIo.enabled">
              <div class="form-field">
                <label class="field-label">URL *</label>
                <input v-model="config.alerting.incidentIo.url" type="text" class="input-field" placeholder="https://api.incident.io/v2/alert_events/http/…" />
              </div>
              <div class="form-field">
                <label class="field-label">Auth Token *</label>
                <input v-model="config.alerting.incidentIo.authToken" type="text" class="input-field" />
              </div>
              <div class="form-field">
                <label class="field-label">Source URL</label>
                <input v-model="config.alerting.incidentIo.sourceUrl" type="text" class="input-field" />
              </div>
              ${DefaultAlertForm('config.alerting.incidentIo')}
            </template>
          </template>

          <!-- LINE -->
          <template v-if="activeProvider === 'line'">
            <div class="provider-header">
              <h3>Line</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.line.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.line.enabled">
              <div class="form-field">
                <label class="field-label">Channel Access Token *</label>
                <input v-model="config.alerting.line.channelAccessToken" type="text" class="input-field" />
              </div>
              <div class="form-field">
                <label class="field-label">User IDs *</label>
                <input v-model="config.alerting.line.userIds" type="text" class="input-field" placeholder="U1234567890abcdef, U2345678901bcdefg" />
                <span class="field-hint">Comma-separated user/group/room IDs</span>
              </div>
              ${DefaultAlertForm('config.alerting.line')}
            </template>
          </template>

          <!-- MATRIX -->
          <template v-if="activeProvider === 'matrix'">
            <div class="provider-header">
              <h3>Matrix</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.matrix.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.matrix.enabled">
              <div class="form-field">
                <label class="field-label">Server URL</label>
                <input v-model="config.alerting.matrix.serverUrl" type="text" class="input-field" placeholder="https://matrix-client.matrix.org" />
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Access Token *</label>
                  <input v-model="config.alerting.matrix.accessToken" type="text" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">Internal Room ID *</label>
                  <input v-model="config.alerting.matrix.internalRoomId" type="text" class="input-field" placeholder="!example:matrix.org" />
                  <span class="field-hint">Room Settings → Advanced</span>
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.matrix')}
            </template>
          </template>

          <!-- MESSAGEBIRD -->
          <template v-if="activeProvider === 'messagebird'">
            <div class="provider-header">
              <h3>Messagebird</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.messagebird.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.messagebird.enabled">
              <div class="form-field">
                <label class="field-label">Access Key *</label>
                <input v-model="config.alerting.messagebird.accessKey" type="text" class="input-field" />
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Originator *</label>
                  <input v-model="config.alerting.messagebird.originator" type="text" class="input-field" placeholder="31619191918" />
                </div>
                <div class="form-field">
                  <label class="field-label">Recipients *</label>
                  <input v-model="config.alerting.messagebird.recipients" type="text" class="input-field" placeholder="31619191919,31619191920" />
                  <span class="field-hint">Comma-separated phone numbers</span>
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.messagebird')}
            </template>
          </template>

          <!-- N8N -->
          <template v-if="activeProvider === 'n8n'">
            <div class="provider-header">
              <h3>n8n</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.n8n.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.n8n.enabled">
              <div class="form-field">
                <label class="field-label">Webhook URL *</label>
                <input v-model="config.alerting.n8n.webhookUrl" type="text" class="input-field" placeholder="https://your-n8n-instance.com/webhook/…" />
              </div>
              <div class="form-field">
                <label class="field-label">Title</label>
                <input v-model="config.alerting.n8n.title" type="text" class="input-field" placeholder="Gatus Monitoring" />
              </div>
              ${DefaultAlertForm('config.alerting.n8n')}
            </template>
          </template>

          <!-- NEW RELIC -->
          <template v-if="activeProvider === 'newrelic'">
            <div class="provider-header">
              <h3>New Relic</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.newrelic.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.newrelic.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">API Key *</label>
                  <input v-model="config.alerting.newrelic.apiKey" type="text" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">Account ID *</label>
                  <input v-model="config.alerting.newrelic.accountId" type="text" class="input-field" placeholder="1234567" />
                </div>
              </div>
              <div class="form-field" style="max-width: 300px;">
                <label class="field-label">Region</label>
                <select v-model="config.alerting.newrelic.region" class="input-select">
                  <option>US</option><option>EU</option>
                </select>
              </div>
              ${DefaultAlertForm('config.alerting.newrelic')}
            </template>
          </template>

          <!-- PLIVO -->
          <template v-if="activeProvider === 'plivo'">
            <div class="provider-header">
              <h3>Plivo</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.plivo.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.plivo.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Auth ID *</label>
                  <input v-model="config.alerting.plivo.authId" type="text" class="input-field" placeholder="MAXXXXXXXXXXXXXXXXXX" />
                </div>
                <div class="form-field">
                  <label class="field-label">Auth Token *</label>
                  <input v-model="config.alerting.plivo.authToken" type="text" class="input-field" />
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">From *</label>
                  <input v-model="config.alerting.plivo.from" type="text" class="input-field" placeholder="+1234567890" />
                </div>
                <div class="form-field">
                  <label class="field-label">To *</label>
                  <input v-model="config.alerting.plivo.to" type="text" class="input-field" placeholder="+0987654321, +1122334455" />
                  <span class="field-hint">Comma-separated phone numbers</span>
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.plivo')}
            </template>
          </template>

          <!-- ROCKET.CHAT -->
          <template v-if="activeProvider === 'rocketchat'">
            <div class="provider-header">
              <h3>Rocket.Chat</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.rocketchat.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.rocketchat.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Webhook URL *</label>
                  <input v-model="config.alerting.rocketchat.webhookUrl" type="text" class="input-field" placeholder="https://your-rocketchat.com/hooks/…" />
                </div>
                <div class="form-field">
                  <label class="field-label">Channel (optional)</label>
                  <input v-model="config.alerting.rocketchat.channel" type="text" class="input-field" placeholder="#alerts" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.rocketchat')}
            </template>
          </template>

          <!-- SENDGRID -->
          <template v-if="activeProvider === 'sendgrid'">
            <div class="provider-header">
              <h3>SendGrid</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.sendgrid.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.sendgrid.enabled">
              <div class="form-field">
                <label class="field-label">API Key *</label>
                <input v-model="config.alerting.sendgrid.apiKey" type="text" class="input-field" placeholder="SG.…" />
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">From *</label>
                  <input v-model="config.alerting.sendgrid.from" type="email" class="input-field" placeholder="alerts@example.com" />
                </div>
                <div class="form-field">
                  <label class="field-label">To *</label>
                  <input v-model="config.alerting.sendgrid.to" type="text" class="input-field" placeholder="admin@example.com" />
                  <span class="field-hint">Comma-separated for multiple recipients</span>
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.sendgrid')}
            </template>
          </template>

          <!-- SIGNAL -->
          <template v-if="activeProvider === 'signal'">
            <div class="provider-header">
              <h3>Signal</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.signal.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.signal.enabled">
              <div class="form-field">
                <label class="field-label">API URL *</label>
                <input v-model="config.alerting.signal.apiUrl" type="text" class="input-field" placeholder="http://localhost:8080" />
                <span class="field-hint">signal-cli-rest-api instance URL</span>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Number *</label>
                  <input v-model="config.alerting.signal.number" type="text" class="input-field" placeholder="+1234567890" />
                </div>
                <div class="form-field">
                  <label class="field-label">Recipients *</label>
                  <input v-model="config.alerting.signal.recipients" type="text" class="input-field" placeholder="+0987654321, +1122334455" />
                  <span class="field-hint">Comma-separated phone numbers</span>
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.signal')}
            </template>
          </template>

          <!-- SIGNL4 -->
          <template v-if="activeProvider === 'signl4'">
            <div class="provider-header">
              <h3>SIGNL4</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.signl4.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.signl4.enabled">
              <div class="form-field">
                <label class="field-label">Team Secret *</label>
                <input v-model="config.alerting.signl4.teamSecret" type="text" class="input-field" />
                <span class="field-hint">Part of the SIGNL4 webhook URL</span>
              </div>
              ${DefaultAlertForm('config.alerting.signl4')}
            </template>
          </template>

          <!-- SPLUNK -->
          <template v-if="activeProvider === 'splunk'">
            <div class="provider-header">
              <h3>Splunk</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.splunk.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.splunk.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">HEC URL *</label>
                  <input v-model="config.alerting.splunk.hecUrl" type="text" class="input-field" placeholder="https://splunk.example.com:8088" />
                </div>
                <div class="form-field">
                  <label class="field-label">HEC Token *</label>
                  <input v-model="config.alerting.splunk.hecToken" type="text" class="input-field" />
                </div>
              </div>
              <div class="form-grid-3">
                <div class="form-field">
                  <label class="field-label">Source</label>
                  <input v-model="config.alerting.splunk.source" type="text" class="input-field" placeholder="gatus" />
                </div>
                <div class="form-field">
                  <label class="field-label">Sourcetype</label>
                  <input v-model="config.alerting.splunk.sourcetype" type="text" class="input-field" placeholder="gatus:alert" />
                </div>
                <div class="form-field">
                  <label class="field-label">Index</label>
                  <input v-model="config.alerting.splunk.index" type="text" class="input-field" placeholder="main" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.splunk')}
            </template>
          </template>

          <!-- SQUADCAST -->
          <template v-if="activeProvider === 'squadcast'">
            <div class="provider-header">
              <h3>Squadcast</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.squadcast.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.squadcast.enabled">
              <div class="form-field">
                <label class="field-label">Webhook URL *</label>
                <input v-model="config.alerting.squadcast.webhookUrl" type="text" class="input-field" placeholder="https://api.squadcast.com/v3/incidents/api/…" />
              </div>
              ${DefaultAlertForm('config.alerting.squadcast')}
            </template>
          </template>

          <!-- TWILIO -->
          <template v-if="activeProvider === 'twilio'">
            <div class="provider-header">
              <h3>Twilio</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.twilio.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.twilio.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">SID *</label>
                  <input v-model="config.alerting.twilio.sid" type="text" class="input-field" placeholder="Account SID" />
                </div>
                <div class="form-field">
                  <label class="field-label">Token *</label>
                  <input v-model="config.alerting.twilio.token" type="text" class="input-field" placeholder="Auth token" />
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">From *</label>
                  <input v-model="config.alerting.twilio.from" type="text" class="input-field" placeholder="+1-234-567-8901" />
                </div>
                <div class="form-field">
                  <label class="field-label">To *</label>
                  <input v-model="config.alerting.twilio.to" type="text" class="input-field" placeholder="+1-234-567-8901" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.twilio')}
            </template>
          </template>

          <!-- VONAGE -->
          <template v-if="activeProvider === 'vonage'">
            <div class="provider-header">
              <h3>Vonage</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.vonage.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.vonage.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">API Key *</label>
                  <input v-model="config.alerting.vonage.apiKey" type="text" class="input-field" />
                </div>
                <div class="form-field">
                  <label class="field-label">API Secret *</label>
                  <input v-model="config.alerting.vonage.apiSecret" type="text" class="input-field" />
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">From *</label>
                  <input v-model="config.alerting.vonage.from" type="text" class="input-field" placeholder="Gatus" />
                </div>
                <div class="form-field">
                  <label class="field-label">To *</label>
                  <input v-model="config.alerting.vonage.to" type="text" class="input-field" placeholder="+1234567890" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.vonage')}
            </template>
          </template>

          <!-- WEBEX -->
          <template v-if="activeProvider === 'webex'">
            <div class="provider-header">
              <h3>Webex</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.webex.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.webex.enabled">
              <div class="form-field">
                <label class="field-label">Webhook URL *</label>
                <input v-model="config.alerting.webex.webhookUrl" type="text" class="input-field" placeholder="https://webexapis.com/v1/webhooks/incoming/…" />
              </div>
              ${DefaultAlertForm('config.alerting.webex')}
            </template>
          </template>

          <!-- ZAPIER -->
          <template v-if="activeProvider === 'zapier'">
            <div class="provider-header">
              <h3>Zapier</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.zapier.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.zapier.enabled">
              <div class="form-field">
                <label class="field-label">Webhook URL *</label>
                <input v-model="config.alerting.zapier.webhookUrl" type="text" class="input-field" placeholder="https://hooks.zapier.com/hooks/catch/…" />
              </div>
              ${DefaultAlertForm('config.alerting.zapier')}
            </template>
          </template>

          <!-- ZULIP -->
          <template v-if="activeProvider === 'zulip'">
            <div class="provider-header">
              <h3>Zulip</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.zulip.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.zulip.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Bot Email *</label>
                  <input v-model="config.alerting.zulip.botEmail" type="email" class="input-field" placeholder="gatus-bot@some.zulip.org" />
                </div>
                <div class="form-field">
                  <label class="field-label">Bot API Key *</label>
                  <input v-model="config.alerting.zulip.botApiKey" type="text" class="input-field" />
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">Domain *</label>
                  <input v-model="config.alerting.zulip.domain" type="text" class="input-field" placeholder="some.zulip.org" />
                </div>
                <div class="form-field">
                  <label class="field-label">Channel ID *</label>
                  <input v-model="config.alerting.zulip.channelId" type="text" class="input-field" placeholder="123456" />
                </div>
              </div>
              ${DefaultAlertForm('config.alerting.zulip')}
            </template>
          </template>

          <!-- CUSTOM -->
          <template v-if="activeProvider === 'custom'">
            <div class="provider-header">
              <h3>Custom Webhook</h3>
              <label class="toggle-label"><input type="checkbox" v-model="config.alerting.custom.enabled" /> Enable</label>
            </div>
            <template v-if="config.alerting.custom.enabled">
              <div class="form-grid-2">
                <div class="form-field">
                  <label class="field-label">URL *</label>
                  <input v-model="config.alerting.custom.url" type="text" class="input-field" placeholder="https://hooks.example.com/…" />
                  <span class="field-hint">Supports placeholders: [ALERT_DESCRIPTION], [ENDPOINT_NAME], [ENDPOINT_GROUP], [RESULT_ERRORS]</span>
                </div>
                <div class="form-field">
                  <label class="field-label">Method</label>
                  <select v-model="config.alerting.custom.method" class="input-select">
                    <option>GET</option><option>POST</option><option>PUT</option>
                  </select>
                </div>
              </div>
              <div class="form-field">
                <label class="field-label">Body</label>
                <textarea v-model="config.alerting.custom.body" class="input-textarea" rows="4" placeholder='{"text": "[ALERT_TRIGGERED_OR_RESOLVED]: [ENDPOINT_NAME]"}'></textarea>
              </div>
              ${DefaultAlertForm('config.alerting.custom')}
            </template>
          </template>

        </div>
      </div>
    </div>
  `,
})
