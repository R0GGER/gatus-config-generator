/* Gatus YAML parser — reverse of yaml-generator.js
   Converts a Gatus config.yaml string into the store config object format. */

function uuid() {
  return Math.random().toString(36).slice(2, 10)
}

function parseDefaultAlert(da) {
  if (!da) return { enabled: false, failureThreshold: 3, successThreshold: 2, sendOnResolved: false, description: '' }
  return {
    enabled: true,
    failureThreshold: da['failure-threshold'] ?? 3,
    successThreshold: da['success-threshold'] ?? 2,
    sendOnResolved: da['send-on-resolved'] ?? false,
    description: da.description ?? '',
  }
}

function parseEndpointAlert(a) {
  return {
    _id: uuid(),
    type: a.type ?? 'slack',
    enabled: a.enabled !== false,
    failureThreshold: a['failure-threshold'] ?? 3,
    successThreshold: a['success-threshold'] ?? 2,
    sendOnResolved: a['send-on-resolved'] ?? false,
    description: a.description ?? '',
  }
}

function parseEndpoint(ep) {
  const headers = ep.headers
    ? Object.entries(ep.headers).map(([key, value]) => ({ _id: uuid(), key, value }))
    : []

  const sshConf = ep.ssh || {}
  const client = ep.client || {}
  const uiConf = ep.ui || {}

  return {
    _id: uuid(),
    enabled: ep.enabled !== false,
    name: ep.name ?? '',
    group: ep.group ?? '',
    url: ep.url ?? '',
    method: ep.method ?? 'GET',
    interval: ep.interval ?? '60s',
    body: ep.body ?? '',
    headers,
    ssh: {
      username: sshConf.username ?? '',
      password: sshConf.password ?? '',
    },
    conditions: (ep.conditions || []).map(c => ({
      _id: uuid(),
      useRaw: true,
      rawCondition: String(c),
      placeholder: '[STATUS]',
      fn: '',
      operator: '==',
      value: '200',
    })),
    alerts: (ep.alerts || []).map(parseEndpointAlert),
    client: {
      insecure: client.insecure ?? false,
      ignoreRedirect: client['ignore-redirect'] ?? false,
      timeout: client.timeout ?? '10s',
      dnsResolver: client['dns-resolver'] ?? '',
      proxyUrl: client['proxy-url'] ?? '',
    },
    ui: {
      hideConditions: uiConf['hide-conditions'] ?? false,
      hideHostname: uiConf['hide-hostname'] ?? false,
      hidePort: uiConf['hide-port'] ?? false,
      hideUrl: uiConf['hide-url'] ?? false,
      hideErrors: uiConf['hide-errors'] ?? false,
    },
  }
}

function defaultAlertProvider() {
  return {
    enabled: false,
    defaultAlert: { enabled: false, failureThreshold: 3, successThreshold: 2, sendOnResolved: false, description: '' },
  }
}

function parseAlertingProvider(raw, extraFields) {
  if (!raw) return null
  const da = parseDefaultAlert(raw['default-alert'])
  return { enabled: true, defaultAlert: da, ...extraFields(raw) }
}

function parseAlerting(alerting) {
  if (!alerting) return null
  const out = {}

  if (alerting.slack) {
    out.slack = parseAlertingProvider(alerting.slack, p => ({
      webhookUrl: p['webhook-url'] ?? '',
      title: p.title ?? '',
    }))
  }

  if (alerting.discord) {
    out.discord = parseAlertingProvider(alerting.discord, p => ({
      webhookUrl: p['webhook-url'] ?? '',
      title: p.title ?? '',
      messageContent: p['message-content'] ?? '',
    }))
  }

  if (alerting.telegram) {
    out.telegram = parseAlertingProvider(alerting.telegram, p => ({
      token: p.token ?? '',
      id: p.id ?? '',
      topicId: p['topic-id'] ?? '',
      apiUrl: p['api-url'] ?? '',
    }))
  }

  if (alerting['teams-workflows']) {
    out.teamsWorkflows = parseAlertingProvider(alerting['teams-workflows'], p => ({
      webhookUrl: p['webhook-url'] ?? '',
      title: p.title ?? '',
    }))
  }

  if (alerting.email) {
    out.email = parseAlertingProvider(alerting.email, p => ({
      from: p.from ?? '',
      username: p.username ?? '',
      password: p.password ?? '',
      host: p.host ?? '',
      port: p.port ?? 587,
      to: p.to ?? '',
      clientInsecure: p.client?.insecure ?? false,
    }))
  }

  if (alerting.pagerduty) {
    out.pagerduty = parseAlertingProvider(alerting.pagerduty, p => ({
      integrationKey: p['integration-key'] ?? '',
    }))
  }

  if (alerting.ntfy) {
    out.ntfy = parseAlertingProvider(alerting.ntfy, p => ({
      topic: p.topic ?? '',
      url: p.url ?? 'https://ntfy.sh',
      token: p.token ?? '',
      priority: p.priority ?? 3,
      email: p.email ?? '',
      click: p.click ?? '',
    }))
  }

  if (alerting.googlechat) {
    out.googlechat = parseAlertingProvider(alerting.googlechat, p => ({
      webhookUrl: p['webhook-url'] ?? '',
    }))
  }

  if (alerting.gotify) {
    out.gotify = parseAlertingProvider(alerting.gotify, p => ({
      serverUrl: p['server-url'] ?? '',
      token: p.token ?? '',
      priority: p.priority ?? 5,
      title: p.title ?? '',
    }))
  }

  if (alerting.opsgenie) {
    out.opsgenie = parseAlertingProvider(alerting.opsgenie, p => ({
      apiKey: p['api-key'] ?? '',
      priority: p.priority ?? 'P1',
      source: p.source ?? 'gatus',
      tags: p.tags ?? [],
    }))
  }

  if (alerting.mattermost) {
    out.mattermost = parseAlertingProvider(alerting.mattermost, p => ({
      webhookUrl: p['webhook-url'] ?? '',
      channel: p.channel ?? '',
    }))
  }

  if (alerting.pushover) {
    out.pushover = parseAlertingProvider(alerting.pushover, p => ({
      applicationToken: p['application-token'] ?? '',
      userKey: p['user-key'] ?? '',
      priority: p.priority ?? 0,
      sound: p.sound ?? '',
    }))
  }

  if (alerting['aws-ses']) {
    out.awsSes = parseAlertingProvider(alerting['aws-ses'], p => ({
      accessKeyId: p['access-key-id'] ?? '',
      secretAccessKey: p['secret-access-key'] ?? '',
      region: p.region ?? '',
      from: p.from ?? '',
      to: p.to ?? '',
    }))
  }

  if (alerting.clickup) {
    out.clickup = parseAlertingProvider(alerting.clickup, p => ({
      listId: p['list-id'] ?? '',
      token: p.token ?? '',
      apiUrl: p['api-url'] ?? 'https://api.clickup.com/api/v2',
      assignees: Array.isArray(p.assignees) ? p.assignees.join(', ') : (p.assignees ?? ''),
      status: p.status ?? '',
      priority: p.priority ?? 'normal',
      notifyAll: p['notify-all'] !== false,
      name: p.name ?? '',
      content: p.content ?? '',
    }))
  }

  if (alerting.datadog) {
    out.datadog = parseAlertingProvider(alerting.datadog, p => ({
      apiKey: p['api-key'] ?? '',
      site: p.site ?? 'datadoghq.com',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags ?? ''),
    }))
  }

  if (alerting.gitea) {
    out.gitea = parseAlertingProvider(alerting.gitea, p => ({
      repositoryUrl: p['repository-url'] ?? '',
      token: p.token ?? '',
    }))
  }

  if (alerting.github) {
    out.github = parseAlertingProvider(alerting.github, p => ({
      repositoryUrl: p['repository-url'] ?? '',
      token: p.token ?? '',
    }))
  }

  if (alerting.gitlab) {
    out.gitlab = parseAlertingProvider(alerting.gitlab, p => ({
      webhookUrl: p['webhook-url'] ?? '',
      authorizationKey: p['authorization-key'] ?? '',
      severity: p.severity ?? '',
      monitoringTool: p['monitoring-tool'] ?? 'gatus',
      environmentName: p['environment-name'] ?? '',
      service: p.service ?? '',
    }))
  }

  if (alerting.homeassistant) {
    out.homeassistant = parseAlertingProvider(alerting.homeassistant, p => ({
      url: p.url ?? '',
      token: p.token ?? '',
    }))
  }

  if (alerting.ifttt) {
    out.ifttt = parseAlertingProvider(alerting.ifttt, p => ({
      webhookKey: p['webhook-key'] ?? '',
      eventName: p['event-name'] ?? '',
    }))
  }

  if (alerting.ilert) {
    out.ilert = parseAlertingProvider(alerting.ilert, p => ({
      integrationKey: p['integration-key'] ?? '',
    }))
  }

  if (alerting['incident-io']) {
    out.incidentIo = parseAlertingProvider(alerting['incident-io'], p => ({
      url: p.url ?? '',
      authToken: p['auth-token'] ?? '',
      sourceUrl: p['source-url'] ?? '',
    }))
  }

  if (alerting.line) {
    out.line = parseAlertingProvider(alerting.line, p => ({
      channelAccessToken: p['channel-access-token'] ?? '',
      userIds: Array.isArray(p['user-ids']) ? p['user-ids'].join(', ') : (p['user-ids'] ?? ''),
    }))
  }

  if (alerting.matrix) {
    out.matrix = parseAlertingProvider(alerting.matrix, p => ({
      serverUrl: p['server-url'] ?? 'https://matrix-client.matrix.org',
      accessToken: p['access-token'] ?? '',
      internalRoomId: p['internal-room-id'] ?? '',
    }))
  }

  if (alerting.messagebird) {
    out.messagebird = parseAlertingProvider(alerting.messagebird, p => ({
      accessKey: p['access-key'] ?? '',
      originator: p.originator ?? '',
      recipients: p.recipients ?? '',
    }))
  }

  if (alerting.n8n) {
    out.n8n = parseAlertingProvider(alerting.n8n, p => ({
      webhookUrl: p['webhook-url'] ?? '',
      title: p.title ?? '',
    }))
  }

  if (alerting.newrelic) {
    out.newrelic = parseAlertingProvider(alerting.newrelic, p => ({
      apiKey: p['api-key'] ?? '',
      accountId: p['account-id'] ?? '',
      region: p.region ?? 'US',
    }))
  }

  if (alerting.plivo) {
    out.plivo = parseAlertingProvider(alerting.plivo, p => ({
      authId: p['auth-id'] ?? '',
      authToken: p['auth-token'] ?? '',
      from: p.from ?? '',
      to: Array.isArray(p.to) ? p.to.join(', ') : (p.to ?? ''),
    }))
  }

  if (alerting.rocketchat) {
    out.rocketchat = parseAlertingProvider(alerting.rocketchat, p => ({
      webhookUrl: p['webhook-url'] ?? '',
      channel: p.channel ?? '',
    }))
  }

  if (alerting.sendgrid) {
    out.sendgrid = parseAlertingProvider(alerting.sendgrid, p => ({
      apiKey: p['api-key'] ?? '',
      from: p.from ?? '',
      to: p.to ?? '',
    }))
  }

  if (alerting.signal) {
    out.signal = parseAlertingProvider(alerting.signal, p => ({
      apiUrl: p['api-url'] ?? '',
      number: p.number ?? '',
      recipients: Array.isArray(p.recipients) ? p.recipients.join(', ') : (p.recipients ?? ''),
    }))
  }

  if (alerting.signl4) {
    out.signl4 = parseAlertingProvider(alerting.signl4, p => ({
      teamSecret: p['team-secret'] ?? '',
    }))
  }

  if (alerting.splunk) {
    out.splunk = parseAlertingProvider(alerting.splunk, p => ({
      hecUrl: p['hec-url'] ?? '',
      hecToken: p['hec-token'] ?? '',
      source: p.source ?? 'gatus',
      sourcetype: p.sourcetype ?? 'gatus:alert',
      index: p.index ?? '',
    }))
  }

  if (alerting.squadcast) {
    out.squadcast = parseAlertingProvider(alerting.squadcast, p => ({
      webhookUrl: p['webhook-url'] ?? '',
    }))
  }

  if (alerting.twilio) {
    out.twilio = parseAlertingProvider(alerting.twilio, p => ({
      sid: p.sid ?? '',
      token: p.token ?? '',
      from: p.from ?? '',
      to: p.to ?? '',
    }))
  }

  if (alerting.vonage) {
    out.vonage = parseAlertingProvider(alerting.vonage, p => ({
      apiKey: p['api-key'] ?? '',
      apiSecret: p['api-secret'] ?? '',
      from: p.from ?? '',
      to: p.to ?? '',
    }))
  }

  if (alerting.webex) {
    out.webex = parseAlertingProvider(alerting.webex, p => ({
      webhookUrl: p['webhook-url'] ?? '',
    }))
  }

  if (alerting.zapier) {
    out.zapier = parseAlertingProvider(alerting.zapier, p => ({
      webhookUrl: p['webhook-url'] ?? '',
    }))
  }

  if (alerting.zulip) {
    out.zulip = parseAlertingProvider(alerting.zulip, p => ({
      botEmail: p['bot-email'] ?? '',
      botApiKey: p['bot-api-key'] ?? '',
      domain: p.domain ?? '',
      channelId: p['channel-id'] ?? '',
    }))
  }

  if (alerting.custom) {
    const headers = alerting.custom.headers
      ? Object.entries(alerting.custom.headers).map(([key, value]) => ({ _id: uuid(), key, value }))
      : []
    out.custom = parseAlertingProvider(alerting.custom, p => ({
      url: p.url ?? '',
      method: p.method ?? 'GET',
      body: p.body ?? '',
      headers,
    }))
  }

  return out
}

function parseSecurity(sec) {
  if (!sec) return null
  if (sec.basic) {
    return {
      type: 'basic',
      basic: {
        username: sec.basic.username ?? '',
        passwordBcryptBase64: sec.basic['password-bcrypt-base64'] ?? '',
      },
    }
  }
  if (sec.oidc) {
    return {
      type: 'oidc',
      oidc: {
        issuerUrl: sec.oidc['issuer-url'] ?? '',
        redirectUrl: sec.oidc['redirect-url'] ?? '',
        clientId: sec.oidc['client-id'] ?? '',
        clientSecret: sec.oidc['client-secret'] ?? '',
        scopes: sec.oidc.scopes ?? ['openid'],
        allowedSubjects: sec.oidc['allowed-subjects'] ?? [],
        sessionTtl: sec.oidc['session-ttl'] ?? '8h',
      },
    }
  }
  return null
}

export function parseGatusYaml(yamlString) {
  const doc = jsyaml.load(yamlString)
  if (!doc || typeof doc !== 'object') {
    throw new Error('Invalid YAML: expected a mapping at the root level')
  }

  const cfg = {}

  cfg.metrics = doc.metrics ?? false
  cfg.concurrency = doc.concurrency ?? 3
  cfg.skipInvalidConfigUpdate = doc['skip-invalid-config-update'] ?? false

  // Web
  const web = doc.web || {}
  cfg.web = {
    address: web.address ?? '0.0.0.0',
    port: web.port ?? 8080,
    readBufferSize: web['read-buffer-size'] ?? 8192,
    tls: {
      certificateFile: web.tls?.['certificate-file'] ?? '',
      privateKeyFile: web.tls?.['private-key-file'] ?? '',
    },
  }

  // Storage
  const storage = doc.storage || {}
  cfg.storage = {
    type: storage.type ?? 'memory',
    path: storage.path ?? '',
    caching: storage.caching ?? false,
    maximumNumberOfResults: storage['maximum-number-of-results'] ?? 100,
    maximumNumberOfEvents: storage['maximum-number-of-events'] ?? 50,
  }

  // Alerting — start with defaults and merge parsed values
  const apd = defaultAlertProvider
  cfg.alerting = {
    slack: { ...apd(), webhookUrl: '', title: '' },
    discord: { ...apd(), webhookUrl: '', title: '', messageContent: '' },
    telegram: { ...apd(), token: '', id: '', topicId: '', apiUrl: '' },
    teamsWorkflows: { ...apd(), webhookUrl: '', title: '' },
    email: { ...apd(), from: '', username: '', password: '', host: '', port: 587, to: '', clientInsecure: false },
    pagerduty: { ...apd(), integrationKey: '' },
    ntfy: { ...apd(), topic: '', url: 'https://ntfy.sh', token: '', priority: 3, email: '', click: '' },
    googlechat: { ...apd(), webhookUrl: '' },
    gotify: { ...apd(), serverUrl: '', token: '', priority: 5, title: '' },
    opsgenie: { ...apd(), apiKey: '', priority: 'P1', source: 'gatus', tags: [] },
    mattermost: { ...apd(), webhookUrl: '', channel: '' },
    pushover: { ...apd(), applicationToken: '', userKey: '', priority: 0, sound: '' },
    awsSes: { ...apd(), accessKeyId: '', secretAccessKey: '', region: '', from: '', to: '' },
    clickup: { ...apd(), listId: '', token: '', apiUrl: 'https://api.clickup.com/api/v2', assignees: '', status: '', priority: 'normal', notifyAll: true, name: '', content: '' },
    datadog: { ...apd(), apiKey: '', site: 'datadoghq.com', tags: '' },
    gitea: { ...apd(), repositoryUrl: '', token: '' },
    github: { ...apd(), repositoryUrl: '', token: '' },
    gitlab: { ...apd(), webhookUrl: '', authorizationKey: '', severity: '', monitoringTool: 'gatus', environmentName: '', service: '' },
    homeassistant: { ...apd(), url: '', token: '' },
    ifttt: { ...apd(), webhookKey: '', eventName: '' },
    ilert: { ...apd(), integrationKey: '' },
    incidentIo: { ...apd(), url: '', authToken: '', sourceUrl: '' },
    line: { ...apd(), channelAccessToken: '', userIds: '' },
    matrix: { ...apd(), serverUrl: 'https://matrix-client.matrix.org', accessToken: '', internalRoomId: '' },
    messagebird: { ...apd(), accessKey: '', originator: '', recipients: '' },
    n8n: { ...apd(), webhookUrl: '', title: '' },
    newrelic: { ...apd(), apiKey: '', accountId: '', region: 'US' },
    plivo: { ...apd(), authId: '', authToken: '', from: '', to: '' },
    rocketchat: { ...apd(), webhookUrl: '', channel: '' },
    sendgrid: { ...apd(), apiKey: '', from: '', to: '' },
    signal: { ...apd(), apiUrl: '', number: '', recipients: '' },
    signl4: { ...apd(), teamSecret: '' },
    splunk: { ...apd(), hecUrl: '', hecToken: '', source: 'gatus', sourcetype: 'gatus:alert', index: '' },
    squadcast: { ...apd(), webhookUrl: '' },
    twilio: { ...apd(), sid: '', token: '', from: '', to: '' },
    vonage: { ...apd(), apiKey: '', apiSecret: '', from: '', to: '' },
    webex: { ...apd(), webhookUrl: '' },
    zapier: { ...apd(), webhookUrl: '' },
    zulip: { ...apd(), botEmail: '', botApiKey: '', domain: '', channelId: '' },
    custom: { ...apd(), url: '', method: 'GET', body: '', headers: [] },
  }
  const parsedAlerting = parseAlerting(doc.alerting)
  if (parsedAlerting) {
    Object.assign(cfg.alerting, parsedAlerting)
  }

  // Security
  const parsedSec = parseSecurity(doc.security)
  cfg.security = {
    type: 'none',
    basic: { username: '', passwordBcryptBase64: '' },
    oidc: {
      issuerUrl: '', redirectUrl: '', clientId: '', clientSecret: '',
      scopes: ['openid'], allowedSubjects: [], sessionTtl: '8h',
    },
  }
  if (parsedSec) {
    cfg.security.type = parsedSec.type
    if (parsedSec.type === 'basic') Object.assign(cfg.security.basic, parsedSec.basic)
    if (parsedSec.type === 'oidc') Object.assign(cfg.security.oidc, parsedSec.oidc)
  }

  // Maintenance
  const maint = doc.maintenance || {}
  cfg.maintenance = {
    enabled: maint.enabled !== false,
    start: maint.start ?? '',
    duration: maint.duration ?? '',
    timezone: maint.timezone ?? 'UTC',
    every: maint.every ?? [],
  }

  // Connectivity
  const conn = doc.connectivity?.checker || doc.connectivity || {}
  cfg.connectivity = {
    enabled: !!(doc.connectivity?.checker?.target || doc.connectivity?.target),
    target: conn.target ?? '1.1.1.1:53',
    interval: conn.interval ?? '60s',
  }

  // UI
  const ui = doc.ui || {}
  const favicon = ui.favicon || {}
  cfg.ui = {
    title: ui.title ?? '',
    description: ui.description ?? '',
    dashboardHeading: ui['dashboard-heading'] ?? '',
    dashboardSubheading: ui['dashboard-subheading'] ?? '',
    header: ui.header ?? '',
    logo: ui.logo ?? '',
    link: ui.link ?? '',
    darkMode: ui['dark-mode'] ?? false,
    defaultSortBy: ui['default-sort-by'] ?? 'name',
    defaultFilterBy: ui['default-filter-by'] ?? 'none',
    favicon: {
      default: favicon.default ?? '',
      size16x16: favicon.size16x16 ?? '',
      size32x32: favicon.size32x32 ?? '',
    },
    buttons: (ui.buttons || []).map(b => ({ _id: uuid(), name: b.name ?? '', link: b.link ?? '' })),
    customCss: ui['custom-css'] ?? '',
  }

  // Announcements
  cfg.announcements = (doc.announcements || []).map(a => ({
    _id: uuid(),
    timestamp: a.timestamp ?? new Date().toISOString().slice(0, 19) + 'Z',
    type: a.type ?? 'information',
    message: a.message ?? '',
    archived: a.archived ?? false,
  }))

  // Remote instances
  cfg.remote = {
    instances: (doc.remote?.instances || []).map(i => ({
      _id: uuid(),
      endpointPrefix: i['endpoint-prefix'] ?? '',
      url: i.url ?? '',
    })),
  }

  // Endpoints
  cfg.endpoints = (doc.endpoints || []).map(parseEndpoint)

  return cfg
}
