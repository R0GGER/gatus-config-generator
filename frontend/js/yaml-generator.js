/* Gatus YAML generator - transforms the form state to a valid Gatus config.yaml */

function omitEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )
}

function buildDefaultAlert(da) {
  if (!da || !da.enabled) return null
  const out = {}
  if (da.description) out.description = da.description
  if (da.failureThreshold !== 3) out['failure-threshold'] = da.failureThreshold
  if (da.successThreshold !== 2) out['success-threshold'] = da.successThreshold
  if (da.sendOnResolved) out['send-on-resolved'] = true
  return Object.keys(out).length > 0 ? out : null
}

function buildConditionString(cond) {
  if (cond.useRaw) return cond.rawCondition

  const { placeholder, fn, operator, value } = cond
  if (fn) {
    return `${fn}(${placeholder}) ${operator} ${value}`
  }
  return `${placeholder} ${operator} ${value}`
}

function buildEndpointAlert(alert) {
  const a = { type: alert.type }
  if (!alert.enabled) a.enabled = false
  if (alert.failureThreshold !== 3) a['failure-threshold'] = alert.failureThreshold
  if (alert.successThreshold !== 2) a['success-threshold'] = alert.successThreshold
  if (alert.sendOnResolved) a['send-on-resolved'] = true
  if (alert.description) a.description = alert.description
  return a
}

function buildEndpoint(ep) {
  const out = {}
  if (!ep.enabled) out.enabled = false
  out.name = ep.name
  if (ep.group) out.group = ep.group
  out.url = ep.url
  if (ep.method && ep.method !== 'GET') out.method = ep.method
  if (ep.interval && ep.interval !== '60s') out.interval = ep.interval
  if (ep.body) out.body = ep.body

  const ssh = ep.ssh || {}
  if (ssh.username || ssh.password) {
    out.ssh = {}
    if (ssh.username) out.ssh.username = ssh.username
    if (ssh.password) out.ssh.password = ssh.password
  }

  const headers = ep.headers?.filter(h => h.key)
  if (headers?.length > 0) {
    out.headers = Object.fromEntries(headers.map(h => [h.key, h.value]))
  }

  const client = ep.client || {}
  const clientOut = {}
  if (client.insecure) clientOut.insecure = true
  if (client.ignoreRedirect) clientOut['ignore-redirect'] = true
  if (client.timeout && client.timeout !== '10s') clientOut.timeout = client.timeout
  if (client.dnsResolver) clientOut['dns-resolver'] = client.dnsResolver
  if (client.proxyUrl) clientOut['proxy-url'] = client.proxyUrl
  if (client.network && client.network !== 'ip') clientOut.network = client.network
  if (client.tunnel) clientOut.tunnel = client.tunnel

  const tls = client.tls || {}
  if (tls.certificateFile || tls.privateKeyFile) {
    const tlsOut = {}
    if (tls.certificateFile) tlsOut['certificate-file'] = tls.certificateFile
    if (tls.privateKeyFile) tlsOut['private-key-file'] = tls.privateKeyFile
    if (tls.renegotiation && tls.renegotiation !== 'never') tlsOut.renegotiation = tls.renegotiation
    clientOut.tls = tlsOut
  }

  const oauth2 = client.oauth2 || {}
  if (oauth2.tokenUrl) {
    const o2Out = { 'token-url': oauth2.tokenUrl }
    if (oauth2.clientId) o2Out['client-id'] = oauth2.clientId
    if (oauth2.clientSecret) o2Out['client-secret'] = oauth2.clientSecret
    if (oauth2.scopes) {
      o2Out.scopes = oauth2.scopes.split(',').map(s => s.trim()).filter(Boolean)
    }
    clientOut.oauth2 = o2Out
  }

  const iap = client.identityAwareProxy || {}
  if (iap.audience) {
    clientOut['identity-aware-proxy'] = { audience: iap.audience }
  }

  if (Object.keys(clientOut).length > 0) out.client = clientOut

  const uiConf = ep.ui || {}
  const uiOut = {}
  if (uiConf.hideConditions) uiOut['hide-conditions'] = true
  if (uiConf.hideHostname) uiOut['hide-hostname'] = true
  if (uiConf.hidePort) uiOut['hide-port'] = true
  if (uiConf.hideUrl) uiOut['hide-url'] = true
  if (uiConf.hideErrors) uiOut['hide-errors'] = true
  if (Object.keys(uiOut).length > 0) out.ui = uiOut

  const conditions = ep.conditions?.map(buildConditionString).filter(Boolean)
  if (conditions?.length > 0) out.conditions = conditions

  const alerts = ep.alerts?.map(buildEndpointAlert)
  if (alerts?.length > 0) out.alerts = alerts

  return out
}

function buildAlerting(alerting) {
  const out = {}

  function addProvider(key, yamlKey, builder) {
    const p = alerting[key]
    if (!p?.enabled) return
    const built = builder(p)
    if (built) {
      const da = buildDefaultAlert(p.defaultAlert)
      if (da) built['default-alert'] = da
      out[yamlKey] = built
    }
  }

  addProvider('slack', 'slack', p => {
    const o = { 'webhook-url': p.webhookUrl }
    if (p.title) o.title = p.title
    return o
  })

  addProvider('discord', 'discord', p => {
    const o = { 'webhook-url': p.webhookUrl }
    if (p.title) o.title = p.title
    if (p.messageContent) o['message-content'] = p.messageContent
    return o
  })

  addProvider('telegram', 'telegram', p => {
    const o = { token: p.token, id: p.id }
    if (p.topicId) o['topic-id'] = p.topicId
    if (p.apiUrl && p.apiUrl !== 'https://api.telegram.org') o['api-url'] = p.apiUrl
    return o
  })

  addProvider('teamsWorkflows', 'teams-workflows', p => {
    const o = { 'webhook-url': p.webhookUrl }
    if (p.title) o.title = p.title
    return o
  })

  addProvider('email', 'email', p => {
    const o = {
      from: p.from,
      host: p.host,
      port: p.port,
      to: p.to,
    }
    if (p.username) o.username = p.username
    if (p.password) o.password = p.password
    if (p.clientInsecure) o.client = { insecure: true }
    return o
  })

  addProvider('pagerduty', 'pagerduty', p => ({
    'integration-key': p.integrationKey,
  }))

  addProvider('ntfy', 'ntfy', p => {
    const o = { topic: p.topic }
    if (p.url && p.url !== 'https://ntfy.sh') o.url = p.url
    if (p.token) o.token = p.token
    if (p.priority !== 3) o.priority = p.priority
    if (p.email) o.email = p.email
    if (p.click) o.click = p.click
    return o
  })

  addProvider('googlechat', 'googlechat', p => ({
    'webhook-url': p.webhookUrl,
  }))

  addProvider('gotify', 'gotify', p => {
    const o = { 'server-url': p.serverUrl, token: p.token }
    if (p.priority !== 5) o.priority = p.priority
    if (p.title) o.title = p.title
    return o
  })

  addProvider('opsgenie', 'opsgenie', p => {
    const o = { 'api-key': p.apiKey }
    if (p.priority !== 'P1') o.priority = p.priority
    if (p.source !== 'gatus') o.source = p.source
    if (p.tags?.length > 0) o.tags = p.tags
    return o
  })

  addProvider('mattermost', 'mattermost', p => {
    const o = { 'webhook-url': p.webhookUrl }
    if (p.channel) o.channel = p.channel
    return o
  })

  addProvider('pushover', 'pushover', p => {
    const o = { 'application-token': p.applicationToken, 'user-key': p.userKey }
    if (p.priority !== 0) o.priority = p.priority
    if (p.sound) o.sound = p.sound
    return o
  })

  addProvider('awsSes', 'aws-ses', p => {
    const o = { region: p.region, from: p.from, to: p.to }
    if (p.accessKeyId) o['access-key-id'] = p.accessKeyId
    if (p.secretAccessKey) o['secret-access-key'] = p.secretAccessKey
    return o
  })

  addProvider('clickup', 'clickup', p => {
    const o = { 'list-id': p.listId, token: p.token }
    if (p.apiUrl && p.apiUrl !== 'https://api.clickup.com/api/v2') o['api-url'] = p.apiUrl
    if (p.assignees) o.assignees = p.assignees.split(',').map(s => s.trim()).filter(Boolean)
    if (p.status) o.status = p.status
    if (p.priority !== 'normal') o.priority = p.priority
    if (!p.notifyAll) o['notify-all'] = false
    if (p.name) o.name = p.name
    if (p.content) o.content = p.content
    return o
  })

  addProvider('datadog', 'datadog', p => {
    const o = { 'api-key': p.apiKey }
    if (p.site && p.site !== 'datadoghq.com') o.site = p.site
    if (p.tags) o.tags = p.tags.split(',').map(s => s.trim()).filter(Boolean)
    return o
  })

  addProvider('gitea', 'gitea', p => ({
    'repository-url': p.repositoryUrl,
    token: p.token,
  }))

  addProvider('github', 'github', p => ({
    'repository-url': p.repositoryUrl,
    token: p.token,
  }))

  addProvider('gitlab', 'gitlab', p => {
    const o = { 'webhook-url': p.webhookUrl, 'authorization-key': p.authorizationKey }
    if (p.severity) o.severity = p.severity
    if (p.monitoringTool && p.monitoringTool !== 'gatus') o['monitoring-tool'] = p.monitoringTool
    if (p.environmentName) o['environment-name'] = p.environmentName
    if (p.service) o.service = p.service
    return o
  })

  addProvider('homeassistant', 'homeassistant', p => ({
    url: p.url,
    token: p.token,
  }))

  addProvider('ifttt', 'ifttt', p => ({
    'webhook-key': p.webhookKey,
    'event-name': p.eventName,
  }))

  addProvider('ilert', 'ilert', p => ({
    'integration-key': p.integrationKey,
  }))

  addProvider('incidentIo', 'incident-io', p => {
    const o = { url: p.url, 'auth-token': p.authToken }
    if (p.sourceUrl) o['source-url'] = p.sourceUrl
    return o
  })

  addProvider('line', 'line', p => ({
    'channel-access-token': p.channelAccessToken,
    'user-ids': p.userIds.split(',').map(s => s.trim()).filter(Boolean),
  }))

  addProvider('matrix', 'matrix', p => {
    const o = { 'access-token': p.accessToken, 'internal-room-id': p.internalRoomId }
    if (p.serverUrl && p.serverUrl !== 'https://matrix-client.matrix.org') o['server-url'] = p.serverUrl
    return o
  })

  addProvider('messagebird', 'messagebird', p => ({
    'access-key': p.accessKey,
    originator: p.originator,
    recipients: p.recipients,
  }))

  addProvider('n8n', 'n8n', p => {
    const o = { 'webhook-url': p.webhookUrl }
    if (p.title) o.title = p.title
    return o
  })

  addProvider('newrelic', 'newrelic', p => {
    const o = { 'api-key': p.apiKey, 'account-id': p.accountId }
    if (p.region && p.region !== 'US') o.region = p.region
    return o
  })

  addProvider('plivo', 'plivo', p => ({
    'auth-id': p.authId,
    'auth-token': p.authToken,
    from: p.from,
    to: p.to.split(',').map(s => s.trim()).filter(Boolean),
  }))

  addProvider('rocketchat', 'rocketchat', p => {
    const o = { 'webhook-url': p.webhookUrl }
    if (p.channel) o.channel = p.channel
    return o
  })

  addProvider('sendgrid', 'sendgrid', p => ({
    'api-key': p.apiKey,
    from: p.from,
    to: p.to,
  }))

  addProvider('signal', 'signal', p => ({
    'api-url': p.apiUrl,
    number: p.number,
    recipients: p.recipients.split(',').map(s => s.trim()).filter(Boolean),
  }))

  addProvider('signl4', 'signl4', p => ({
    'team-secret': p.teamSecret,
  }))

  addProvider('splunk', 'splunk', p => {
    const o = { 'hec-url': p.hecUrl, 'hec-token': p.hecToken }
    if (p.source && p.source !== 'gatus') o.source = p.source
    if (p.sourcetype && p.sourcetype !== 'gatus:alert') o.sourcetype = p.sourcetype
    if (p.index) o.index = p.index
    return o
  })

  addProvider('squadcast', 'squadcast', p => ({
    'webhook-url': p.webhookUrl,
  }))

  addProvider('twilio', 'twilio', p => ({
    sid: p.sid,
    token: p.token,
    from: p.from,
    to: p.to,
  }))

  addProvider('vonage', 'vonage', p => ({
    'api-key': p.apiKey,
    'api-secret': p.apiSecret,
    from: p.from,
    to: p.to,
  }))

  addProvider('webex', 'webex', p => ({
    'webhook-url': p.webhookUrl,
  }))

  addProvider('zapier', 'zapier', p => ({
    'webhook-url': p.webhookUrl,
  }))

  addProvider('zulip', 'zulip', p => ({
    'bot-email': p.botEmail,
    'bot-api-key': p.botApiKey,
    domain: p.domain,
    'channel-id': p.channelId,
  }))

  addProvider('custom', 'custom', p => {
    const o = { url: p.url }
    if (p.method && p.method !== 'GET') o.method = p.method
    if (p.body) o.body = p.body
    const headers = p.headers?.filter(h => h.key)
    if (headers?.length > 0) {
      o.headers = Object.fromEntries(headers.map(h => [h.key, h.value]))
    }
    return o
  })

  return out
}

export function generateGatusYaml(config) {
  const doc = {}

  if (config.metrics) doc.metrics = true
  if (config.concurrency !== 3) doc.concurrency = config.concurrency
  if (config.skipInvalidConfigUpdate) doc['skip-invalid-config-update'] = true

  // Web
  const web = {}
  if (config.web.port !== 8080) web.port = config.web.port
  if (config.web.address && config.web.address !== '0.0.0.0') web.address = config.web.address
  if (config.web.readBufferSize && config.web.readBufferSize !== 8192) web['read-buffer-size'] = config.web.readBufferSize
  if (config.web.tls?.certificateFile) {
    web.tls = {
      'certificate-file': config.web.tls.certificateFile,
      'private-key-file': config.web.tls.privateKeyFile,
    }
  }
  if (Object.keys(web).length > 0) doc.web = web

  // Storage
  if (config.storage.type !== 'memory') {
    const storage = { type: config.storage.type }
    if (config.storage.path) storage.path = config.storage.path
    if (config.storage.caching) storage.caching = true
    if (config.storage.maximumNumberOfResults !== 100) storage['maximum-number-of-results'] = config.storage.maximumNumberOfResults
    if (config.storage.maximumNumberOfEvents !== 50) storage['maximum-number-of-events'] = config.storage.maximumNumberOfEvents
    doc.storage = storage
  }

  // Alerting
  const alerting = buildAlerting(config.alerting)
  if (Object.keys(alerting).length > 0) doc.alerting = alerting

  // Security
  if (config.security.type === 'basic') {
    let passwordValue = config.security.basic.passwordBcryptBase64
    if (passwordValue && passwordValue.startsWith('$2')) {
      passwordValue = btoa(passwordValue)
    }
    doc.security = {
      basic: {
        username: config.security.basic.username,
        'password-bcrypt-base64': passwordValue,
      },
    }
  } else if (config.security.type === 'oidc') {
    const oidc = {
      'issuer-url': config.security.oidc.issuerUrl,
      'redirect-url': config.security.oidc.redirectUrl,
      'client-id': config.security.oidc.clientId,
      'client-secret': config.security.oidc.clientSecret,
      scopes: config.security.oidc.scopes,
    }
    if (config.security.oidc.allowedSubjects?.length > 0) {
      oidc['allowed-subjects'] = config.security.oidc.allowedSubjects
    }
    if (config.security.oidc.sessionTtl && config.security.oidc.sessionTtl !== '8h') {
      oidc['session-ttl'] = config.security.oidc.sessionTtl
    }
    doc.security = { oidc }
  }

  // Maintenance
  if (config.maintenance.start) {
    const maint = {
      start: config.maintenance.start,
      duration: config.maintenance.duration,
    }
    if (!config.maintenance.enabled) maint.enabled = false
    if (config.maintenance.timezone && config.maintenance.timezone !== 'UTC') {
      maint.timezone = config.maintenance.timezone
    }
    if (config.maintenance.every?.length > 0) maint.every = config.maintenance.every
    doc.maintenance = maint
  }

  // Connectivity
  if (config.connectivity?.enabled && config.connectivity.target) {
    doc.connectivity = {
      checker: {
        target: config.connectivity.target,
        interval: config.connectivity.interval || '60s',
      },
    }
  }

  // UI
  const ui = {}
  if (config.ui.title) ui.title = config.ui.title
  if (config.ui.description) ui.description = config.ui.description
  if (config.ui.dashboardHeading) ui['dashboard-heading'] = config.ui.dashboardHeading
  if (config.ui.dashboardSubheading) ui['dashboard-subheading'] = config.ui.dashboardSubheading
  if (config.ui.header) ui.header = config.ui.header
  if (config.ui.logo) ui.logo = config.ui.logo
  if (config.ui.link) ui.link = config.ui.link
  if (!config.ui.darkMode) ui['dark-mode'] = false
  if (config.ui.defaultSortBy && config.ui.defaultSortBy !== 'name') ui['default-sort-by'] = config.ui.defaultSortBy
  if (config.ui.defaultFilterBy && config.ui.defaultFilterBy !== 'none') ui['default-filter-by'] = config.ui.defaultFilterBy
  const buttons = config.ui.buttons?.filter(b => b.name && b.link)
  if (buttons?.length > 0) ui.buttons = buttons.map(b => ({ name: b.name, link: b.link }))
  const favicon = config.ui.favicon || {}
  const faviconOut = {}
  if (favicon.default) faviconOut.default = favicon.default
  if (favicon.size16x16) faviconOut['size16x16'] = favicon.size16x16
  if (favicon.size32x32) faviconOut['size32x32'] = favicon.size32x32
  if (Object.keys(faviconOut).length > 0) ui.favicon = faviconOut
  if (config.ui.customCss) ui['custom-css'] = config.ui.customCss
  if (Object.keys(ui).length > 0) doc.ui = ui

  // Announcements
  if (config.announcements?.length > 0) {
    doc.announcements = config.announcements.map(a => {
      const o = { timestamp: a.timestamp, message: a.message }
      if (a.type !== 'none') o.type = a.type
      if (a.archived) o.archived = true
      return o
    })
  }

  // Tunneling
  const validTunnels = config.tunneling?.filter(t => t.name && t.host)
  if (validTunnels?.length > 0) {
    const tunneling = {}
    for (const t of validTunnels) {
      const tOut = { type: t.type || 'SSH' }
      tOut.host = t.host
      if (t.port && t.port !== 22) tOut.port = t.port
      if (t.username) tOut.username = t.username
      if (t.password) tOut.password = t.password
      if (t.privateKey) tOut['private-key'] = t.privateKey
      tunneling[t.name] = tOut
    }
    doc.tunneling = tunneling
  }

  // Remote instances
  const validRemoteInstances = config.remote?.instances?.filter(i => i.url)
  if (validRemoteInstances?.length > 0) {
    doc.remote = {
      instances: validRemoteInstances.map(i => {
        const inst = {}
        if (i.endpointPrefix) inst['endpoint-prefix'] = i.endpointPrefix
        inst.url = i.url
        return inst
      }),
    }
  }

  // Endpoints
  const validEndpoints = config.endpoints.filter(e => e.name && e.url)
  if (validEndpoints.length > 0) {
    doc.endpoints = validEndpoints.map(buildEndpoint)
  }

  return jsyaml.dump(doc, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    forceQuotes: true,
    quotingType: '"',
  })
}
