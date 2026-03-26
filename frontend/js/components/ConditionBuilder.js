import { defineComponent } from 'vue'

const PLACEHOLDERS = [
  { value: '[STATUS]', label: '[STATUS] – HTTP status code' },
  { value: '[RESPONSE_TIME]', label: '[RESPONSE_TIME] – response time in ms' },
  { value: '[BODY]', label: '[BODY] – response body / JSONPath' },
  { value: '[CONNECTED]', label: '[CONNECTED] – connection successful' },
  { value: '[CERTIFICATE_EXPIRATION]', label: '[CERTIFICATE_EXPIRATION] – certificate expiration' },
  { value: '[DOMAIN_EXPIRATION]', label: '[DOMAIN_EXPIRATION] – domain expiration' },
  { value: '[IP]', label: '[IP] – target IP address' },
  { value: '[DNS_RCODE]', label: '[DNS_RCODE] – DNS response code' },
]

const OPERATORS = ['==', '!=', '<', '>', '<=', '>=']

const FUNCTIONS = [
  { value: '', label: '(no function)' },
  { value: 'len', label: 'len() – length' },
  { value: 'has', label: 'has() – exists' },
  { value: 'pat', label: 'pat() – pattern match' },
  { value: 'any', label: 'any() – one of the values' },
]

const PRESETS = [
  { label: 'Status == 200', placeholder: '[STATUS]', fn: '', operator: '==', value: '200' },
  { label: 'Status < 300', placeholder: '[STATUS]', fn: '', operator: '<', value: '300' },
  { label: 'Connected == true', placeholder: '[CONNECTED]', fn: '', operator: '==', value: 'true' },
  { label: 'Response time < 500ms', placeholder: '[RESPONSE_TIME]', fn: '', operator: '<', value: '500' },
  { label: 'Cert. > 48h', placeholder: '[CERTIFICATE_EXPIRATION]', fn: '', operator: '>', value: '48h' },
  { label: 'Body.status == UP', placeholder: '[BODY].status', fn: '', operator: '==', value: 'UP' },
]

export default defineComponent({
  name: 'ConditionBuilder',
  props: {
    conditions: { type: Array, required: true },
    endpointId: { type: String, required: true },
  },
  emits: ['add', 'remove'],
  setup(props, { emit }) {
    function applyPreset(condition, preset) {
      condition.useRaw = false
      condition.placeholder = preset.placeholder
      condition.fn = preset.fn
      condition.operator = preset.operator
      condition.value = preset.value
    }

    function preview(cond) {
      if (cond.useRaw) return cond.rawCondition || '…'
      const ph = cond.fn ? `${cond.fn}(${cond.placeholder})` : cond.placeholder
      return `${ph} ${cond.operator} ${cond.value}`
    }

    return { PLACEHOLDERS, OPERATORS, FUNCTIONS, PRESETS, applyPreset, preview }
  },
  template: `
    <div class="condition-list">
      <p class="field-hint" style="margin-bottom: 8px;">
        Conditions determine endpoint health. See the
        <a href="https://github.com/TwiN/gatus?tab=readme-ov-file#conditions" target="_blank" rel="noopener">Gatus conditions documentation</a>
        for all placeholders, functions and examples.
      </p>
      <div v-if="conditions.length === 0" class="empty-hint">
        No conditions yet. Add one below ↓
      </div>

      <div v-for="cond in conditions" :key="cond._id" class="condition-row">
        <div class="condition-preview">{{ preview(cond) }}</div>

        <div class="condition-controls">
          <label class="toggle-label">
            <input type="checkbox" v-model="cond.useRaw" />
            Raw input
          </label>

          <template v-if="cond.useRaw">
            <input
              v-model="cond.rawCondition"
              type="text"
              class="input-field mono"
              placeholder="[STATUS] == 200"
            />
          </template>
          <template v-else>
            <div class="condition-builder-row">
              <select v-model="cond.fn" class="input-select input-sm">
                <option v-for="f in FUNCTIONS" :key="f.value" :value="f.value">{{ f.label }}</option>
              </select>
              <input
                v-model="cond.placeholder"
                type="text"
                class="input-field input-sm"
                placeholder="[STATUS]"
                list="placeholder-list"
              />
              <datalist id="placeholder-list">
                <option v-for="p in PLACEHOLDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
              </datalist>
              <select v-model="cond.operator" class="input-select input-sm">
                <option v-for="op in OPERATORS" :key="op" :value="op">{{ op }}</option>
              </select>
              <input v-model="cond.value" type="text" class="input-field input-sm" placeholder="200" />
            </div>
            <div class="preset-row">
              <span class="preset-label">Quick:</span>
              <button
                v-for="preset in PRESETS"
                :key="preset.label"
                class="btn-preset"
                @click="applyPreset(cond, preset)"
              >{{ preset.label }}</button>
            </div>
          </template>
        </div>

        <button class="btn-icon-danger" @click="$emit('remove', cond._id)" title="Delete condition">✕</button>
      </div>

      <button class="btn-secondary btn-sm" @click="$emit('add')">+ Add condition</button>
    </div>
  `,
})
