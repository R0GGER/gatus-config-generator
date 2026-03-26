import { reactive, readonly } from 'vue'

function uuid() {
  return Math.random().toString(36).slice(2, 10)
}

function defaultEndpoint() {
  return {
    _id: uuid(),
    enabled: true,
    name: '',
    group: '',
    url: '',
    method: 'GET',
    interval: '60s',
    body: '',
    headers: [],
    conditions: [],
    alerts: [],
    ssh: {
      username: '',
      password: '',
    },
    client: {
      insecure: false,
      ignoreRedirect: false,
      timeout: '10s',
      dnsResolver: '',
      proxyUrl: '',
      network: '',
      tunnel: '',
      oauth2: {
        tokenUrl: '',
        clientId: '',
        clientSecret: '',
        scopes: '',
      },
      identityAwareProxy: {
        audience: '',
      },
      tls: {
        certificateFile: '',
        privateKeyFile: '',
        renegotiation: 'never',
      },
    },
    ui: {
      hideConditions: false,
      hideHostname: false,
      hidePort: false,
      hideUrl: false,
      hideErrors: false,
    },
  }
}

function defaultAlertProvider() {
  return {
    enabled: false,
    defaultAlert: {
      enabled: false,
      failureThreshold: 3,
      successThreshold: 2,
      sendOnResolved: false,
      description: '',
    },
  }
}

function loadTheme() {
  const saved = localStorage.getItem('gatus-generator-theme')
  return saved === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('gatus-generator-theme', theme)
}

const initialTheme = loadTheme()
applyTheme(initialTheme)

const state = reactive({
  activeSection: 'endpoints',
  savedConfigId: null,
  standaloneMode: false,
  theme: initialTheme,

  config: {
    metrics: false,
    concurrency: 3,
    skipInvalidConfigUpdate: false,

    web: {
      address: '0.0.0.0',
      port: 8080,
      readBufferSize: 8192,
      tls: { certificateFile: '', privateKeyFile: '' },
    },

    ui: {
      title: '',
      description: '',
      dashboardHeading: '',
      dashboardSubheading: '',
      header: '',
      logo: '',
      link: '',
      darkMode: false,
      defaultSortBy: 'name',
      defaultFilterBy: 'none',
      favicon: {
        default: '',
        size16x16: '',
        size32x32: '',
      },
      buttons: [],
      customCss: '',
    },

    storage: {
      type: 'sqlite',
      path: '/data/gatus.db',
      caching: true,
      maximumNumberOfResults: 100,
      maximumNumberOfEvents: 50,
    },

    alerting: {
      slack: { ...defaultAlertProvider(), webhookUrl: '', title: '' },
      discord: { ...defaultAlertProvider(), webhookUrl: '', title: '', messageContent: '' },
      telegram: { ...defaultAlertProvider(), token: '', id: '', topicId: '', apiUrl: '' },
      teamsWorkflows: { ...defaultAlertProvider(), webhookUrl: '', title: '' },
      email: {
        ...defaultAlertProvider(),
        from: '',
        username: '',
        password: '',
        host: '',
        port: 587,
        to: '',
        clientInsecure: false,
      },
      pagerduty: { ...defaultAlertProvider(), integrationKey: '' },
      ntfy: {
        ...defaultAlertProvider(),
        topic: '',
        url: 'https://ntfy.sh',
        token: '',
        priority: 3,
        email: '',
        click: '',
      },
      googlechat: { ...defaultAlertProvider(), webhookUrl: '' },
      gotify: { ...defaultAlertProvider(), serverUrl: '', token: '', priority: 5, title: '' },
      opsgenie: { ...defaultAlertProvider(), apiKey: '', priority: 'P1', source: 'gatus', tags: [] },
      mattermost: { ...defaultAlertProvider(), webhookUrl: '', channel: '' },
      pushover: { ...defaultAlertProvider(), applicationToken: '', userKey: '', priority: 0, sound: '' },
      awsSes: { ...defaultAlertProvider(), accessKeyId: '', secretAccessKey: '', region: '', from: '', to: '' },
      clickup: { ...defaultAlertProvider(), listId: '', token: '', apiUrl: 'https://api.clickup.com/api/v2', assignees: '', status: '', priority: 'normal', notifyAll: true, name: '', content: '' },
      datadog: { ...defaultAlertProvider(), apiKey: '', site: 'datadoghq.com', tags: '' },
      gitea: { ...defaultAlertProvider(), repositoryUrl: '', token: '' },
      github: { ...defaultAlertProvider(), repositoryUrl: '', token: '' },
      gitlab: { ...defaultAlertProvider(), webhookUrl: '', authorizationKey: '', severity: '', monitoringTool: 'gatus', environmentName: '', service: '' },
      homeassistant: { ...defaultAlertProvider(), url: '', token: '' },
      ifttt: { ...defaultAlertProvider(), webhookKey: '', eventName: '' },
      ilert: { ...defaultAlertProvider(), integrationKey: '' },
      incidentIo: { ...defaultAlertProvider(), url: '', authToken: '', sourceUrl: '' },
      line: { ...defaultAlertProvider(), channelAccessToken: '', userIds: '' },
      matrix: { ...defaultAlertProvider(), serverUrl: 'https://matrix-client.matrix.org', accessToken: '', internalRoomId: '' },
      messagebird: { ...defaultAlertProvider(), accessKey: '', originator: '', recipients: '' },
      n8n: { ...defaultAlertProvider(), webhookUrl: '', title: '' },
      newrelic: { ...defaultAlertProvider(), apiKey: '', accountId: '', region: 'US' },
      plivo: { ...defaultAlertProvider(), authId: '', authToken: '', from: '', to: '' },
      rocketchat: { ...defaultAlertProvider(), webhookUrl: '', channel: '' },
      sendgrid: { ...defaultAlertProvider(), apiKey: '', from: '', to: '' },
      signal: { ...defaultAlertProvider(), apiUrl: '', number: '', recipients: '' },
      signl4: { ...defaultAlertProvider(), teamSecret: '' },
      splunk: { ...defaultAlertProvider(), hecUrl: '', hecToken: '', source: 'gatus', sourcetype: 'gatus:alert', index: '' },
      squadcast: { ...defaultAlertProvider(), webhookUrl: '' },
      twilio: { ...defaultAlertProvider(), sid: '', token: '', from: '', to: '' },
      vonage: { ...defaultAlertProvider(), apiKey: '', apiSecret: '', from: '', to: '' },
      webex: { ...defaultAlertProvider(), webhookUrl: '' },
      zapier: { ...defaultAlertProvider(), webhookUrl: '' },
      zulip: { ...defaultAlertProvider(), botEmail: '', botApiKey: '', domain: '', channelId: '' },
      custom: {
        ...defaultAlertProvider(),
        url: '',
        method: 'GET',
        body: '',
        headers: [],
      },
    },

    security: {
      type: 'none',
      basic: { username: '', passwordBcryptBase64: '' },
      oidc: {
        issuerUrl: '',
        redirectUrl: '',
        clientId: '',
        clientSecret: '',
        scopes: ['openid'],
        allowedSubjects: [],
        sessionTtl: '8h',
      },
    },

    maintenance: {
      enabled: true,
      start: '',
      duration: '',
      timezone: 'UTC',
      every: [],
    },

    connectivity: {
      enabled: false,
      target: '1.1.1.1:53',
      interval: '60s',
    },

    remote: {
      instances: [],
    },
    tunneling: [],
    announcements: [],
    endpoints: [],
  },
})

export const store = {
  state: readonly(state),

  async init() {
    try {
      const res = await fetch('/api/health')
      if (res.ok) {
        const data = await res.json()
        state.standaloneMode = !!data.standalone_mode
      }
    } catch { /* keep default false */ }
  },

  setActiveSection(section) {
    state.activeSection = section
  },

  toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light'
    applyTheme(state.theme)
  },

  setSavedConfigId(id) {
    state.savedConfigId = id
  },

  loadConfig(configJson) {
    const parsed = JSON.parse(configJson)
    Object.assign(state.config, parsed)
  },

  addEndpoint() {
    state.config.endpoints.push(defaultEndpoint())
  },

  removeEndpoint(id) {
    const idx = state.config.endpoints.findIndex(e => e._id === id)
    if (idx >= 0) state.config.endpoints.splice(idx, 1)
  },

  duplicateEndpoint(id) {
    const ep = state.config.endpoints.find(e => e._id === id)
    if (ep) {
      const copy = JSON.parse(JSON.stringify(ep))
      copy._id = uuid()
      copy.name = ep.name + ' (copy)'
      const idx = state.config.endpoints.findIndex(e => e._id === id)
      state.config.endpoints.splice(idx + 1, 0, copy)
    }
  },

  addCondition(endpointId) {
    const ep = state.config.endpoints.find(e => e._id === endpointId)
    if (ep) {
      ep.conditions.push({
        _id: uuid(),
        useRaw: false,
        rawCondition: '',
        placeholder: '[STATUS]',
        fn: '',
        operator: '==',
        value: '200',
      })
    }
  },

  removeCondition(endpointId, conditionId) {
    const ep = state.config.endpoints.find(e => e._id === endpointId)
    if (ep) {
      const idx = ep.conditions.findIndex(c => c._id === conditionId)
      if (idx >= 0) ep.conditions.splice(idx, 1)
    }
  },

  addEndpointAlert(endpointId) {
    const ep = state.config.endpoints.find(e => e._id === endpointId)
    if (ep) {
      ep.alerts.push({
        _id: uuid(),
        type: 'slack',
        enabled: true,
        failureThreshold: 3,
        successThreshold: 2,
        sendOnResolved: false,
        description: '',
      })
    }
  },

  removeEndpointAlert(endpointId, alertId) {
    const ep = state.config.endpoints.find(e => e._id === endpointId)
    if (ep) {
      const idx = ep.alerts.findIndex(a => a._id === alertId)
      if (idx >= 0) ep.alerts.splice(idx, 1)
    }
  },

  addHeader(endpointId) {
    const ep = state.config.endpoints.find(e => e._id === endpointId)
    if (ep) ep.headers.push({ _id: uuid(), key: '', value: '' })
  },

  removeHeader(endpointId, headerId) {
    const ep = state.config.endpoints.find(e => e._id === endpointId)
    if (ep) {
      const idx = ep.headers.findIndex(h => h._id === headerId)
      if (idx >= 0) ep.headers.splice(idx, 1)
    }
  },

  addUiButton() {
    state.config.ui.buttons.push({ _id: uuid(), name: '', link: '' })
  },

  removeUiButton(id) {
    const idx = state.config.ui.buttons.findIndex(b => b._id === id)
    if (idx >= 0) state.config.ui.buttons.splice(idx, 1)
  },

  addTunnel() {
    state.config.tunneling.push({
      _id: uuid(),
      name: '',
      type: 'SSH',
      host: '',
      port: 22,
      username: '',
      password: '',
      privateKey: '',
    })
  },

  removeTunnel(id) {
    const idx = state.config.tunneling.findIndex(t => t._id === id)
    if (idx >= 0) state.config.tunneling.splice(idx, 1)
  },

  addRemoteInstance() {
    state.config.remote.instances.push({
      _id: uuid(),
      endpointPrefix: '',
      url: '',
    })
  },

  removeRemoteInstance(id) {
    const idx = state.config.remote.instances.findIndex(i => i._id === id)
    if (idx >= 0) state.config.remote.instances.splice(idx, 1)
  },

  addAnnouncement() {
    state.config.announcements.push({
      _id: uuid(),
      timestamp: new Date().toISOString().slice(0, 19) + 'Z',
      type: 'information',
      message: '',
      archived: false,
    })
  },

  removeAnnouncement(id) {
    const idx = state.config.announcements.findIndex(a => a._id === id)
    if (idx >= 0) state.config.announcements.splice(idx, 1)
  },
}

export const config = state.config
