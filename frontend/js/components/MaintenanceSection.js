import { defineComponent } from 'vue'
import { config, store } from '../store.js'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const TIMEZONES = [
  'UTC', 'Europe/Amsterdam', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
]

export default defineComponent({
  name: 'MaintenanceSection',
  setup() {
    function toggleDay(day) {
      const idx = config.maintenance.every.indexOf(day)
      if (idx >= 0) {
        config.maintenance.every.splice(idx, 1)
      } else {
        config.maintenance.every.push(day)
      }
    }

    return { config, store, DAYS, TIMEZONES, toggleDay }
  },
  template: `
    <div class="section-container">
      <div class="section-header">
        <div>
          <h2 class="section-title">Maintenance</h2>
          <p class="section-desc">Define maintenance windows during which alerts are suppressed.</p>
        </div>
      </div>

      <div class="form-field">
        <label class="checkbox-label">
          <input type="checkbox" v-model="config.maintenance.enabled" />
          Enable maintenance window
        </label>
      </div>

      <template v-if="config.maintenance.enabled">
        <div class="info-box">
          When Gatus is within the maintenance window, no alerts will be sent.
        </div>

        <div class="form-grid-3">
          <div class="form-field">
            <label class="field-label">Start time (hh:mm) *</label>
            <input v-model="config.maintenance.start" type="time" class="input-field" />
          </div>
          <div class="form-field">
            <label class="field-label">Duration *</label>
            <input v-model="config.maintenance.duration" type="text" class="input-field" placeholder="1h" />
            <span class="field-hint">e.g. 30m, 1h, 2h30m</span>
          </div>
          <div class="form-field">
            <label class="field-label">Timezone</label>
            <select v-model="config.maintenance.timezone" class="input-select">
              <option v-for="tz in TIMEZONES" :key="tz" :value="tz">{{ tz }}</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Applies to (empty = every day)</label>
          <div class="day-picker">
            <button
              v-for="day in DAYS"
              :key="day"
              :class="['day-btn', { active: config.maintenance.every.includes(day) }]"
              @click="toggleDay(day)"
            >{{ day }}</button>
          </div>
        </div>
      </template>

      <hr class="section-divider" />

      <!-- Announcements -->
      <div class="section-header">
        <div>
          <h3 class="section-title-sm">Announcements</h3>
          <p class="section-desc">Show system-wide messages at the top of the status page.</p>
        </div>
        <button class="btn-secondary" @click="store.addAnnouncement()">+ Announcement</button>
      </div>

      <div v-if="config.announcements.length === 0" class="empty-hint">
        No announcements.
      </div>

      <div v-for="ann in config.announcements" :key="ann._id" class="announcement-card" :class="ann.type">
        <div class="form-grid-2">
          <div class="form-field">
            <label class="field-label">Type</label>
            <select v-model="ann.type" class="input-select">
              <option value="none">Neutral</option>
              <option value="information">Information (blue)</option>
              <option value="warning">Warning (yellow)</option>
              <option value="outage">Outage (red)</option>
              <option value="operational">Operational (green)</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">Timestamp (UTC)</label>
            <input
              :value="ann.timestamp ? ann.timestamp.replace('Z', '') : ''"
              @input="ann.timestamp = $event.target.value ? $event.target.value + 'Z' : ''"
              type="datetime-local"
              step="1"
              class="input-field"
            />
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">Message (markdown supported)</label>
          <textarea v-model="ann.message" class="input-textarea" rows="2" placeholder="Scheduled maintenance from 14:00 to 16:00 UTC"></textarea>
        </div>
        <div class="ann-footer">
          <label class="checkbox-label">
            <input type="checkbox" v-model="ann.archived" />
            Archive (appears at bottom of page)
          </label>
          <button class="btn-icon-danger btn-sm" @click="store.removeAnnouncement(ann._id)">✕ Delete</button>
        </div>
      </div>
    </div>
  `,
})
