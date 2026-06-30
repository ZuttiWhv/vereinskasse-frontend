<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800">Monatliche Gebühren verwalten</h1>
      <button
        v-if="authStore.hasAuthority('WRITE_JOBS')"
        @click="openModal()"
        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow"
      >
        + Neuer Job
      </button>
    </div>

    <div class="bg-white shadow rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Beschreibung
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Betrag</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Ausführung
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="job in feeJobs" :key="job.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <button
                v-if="authStore.hasAuthority('WRITE_JOBS')"
                @click="toggleStatus(job)"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition',
                  job.enabled
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-red-100 text-red-800 hover:bg-red-200',
                ]"
              >
                {{ job.enabled ? 'Aktiv' : 'Inaktiv' }}
              </button>
              <span
                v-else
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold',
                  job.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                ]"
              >
                {{ job.enabled ? 'Aktiv' : 'Inaktiv' }}
              </span>
            </td>
            <td class="px-6 py-4 font-medium text-gray-900">{{ job.description }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-700">
              {{ (job.amountInCents / 100).toFixed(2) }} €
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
              Tag {{ parseCron(job.cronExpression).day }}. um
              {{ parseCron(job.cronExpression).hour }}:00 Uhr
            </td>
            <td class="px-6 py-4 text-right space-x-3 whitespace-nowrap">
              <button
                v-if="authStore.hasAuthority('TRIGGER_JOBS')"
                @click="triggerJob(job)"
                class="text-orange-600 hover:text-orange-900 text-sm font-semibold"
              >
                Jetzt ausführen
              </button>
              <button
                v-if="authStore.hasAuthority('WRITE_JOBS')"
                @click="openModal(job)"
                class="text-blue-600 hover:text-blue-900 text-sm font-semibold"
              >
                Bearbeiten
              </button>
              <button
                v-if="authStore.hasAuthority('DELETE_JOBS')"
                @click="confirmDelete(job)"
                class="text-red-600 hover:text-red-900 text-sm font-semibold"
              >
                Löschen
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">
          {{ editingId ? 'Gebühren-Job bearbeiten' : 'Neuer Gebühren-Job' }}
        </h2>

        <form @submit.prevent="saveJob">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Beschreibung</label>
            <input
              id="jobdesc"
              @focus="kbStore.open('jobdesc', form.description)"
              v-model="form.description"
              type="text"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Betrag in Euro</label>
            <input
              v-model.number="form.amountEuro"
              type="number"
              step="0.01"
              min="0.01"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700">Tag des Monats</label>
              <select
                v-model.number="form.day"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
              >
                <option v-for="d in 28" :key="d" :value="d">{{ d }}.</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Uhrzeit</label>
              <select
                v-model.number="form.hour"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
              >
                <option v-for="h in 24" :key="h" :value="h - 1">{{ h - 1 }}:00 Uhr</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useKeyboardStore } from '@/stores/keyboard'
import apiClient from '@/api/client'

const authStore = useAuthStore()
const kbStore = useKeyboardStore()

const feeJobs = ref<any[]>([])
const showModal = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  description: '',
  amountEuro: 0,
  day: 1,
  hour: 0,
  enabled: true,
})

// Hilfsfunktion: Zerlegt den CRON-String sicher für die UI-Anzeige
const parseCron = (cron: string | undefined) => {
  if (!cron) return { day: 1, hour: 0 }

  const parts = cron.split(' ')

  // Falls der Cron-String beschädigt ist, greifen Fallback-Strings ('0' bzw. '1')
  const hourStr = parts[2] ?? '0'
  const dayStr = parts[3] ?? '1'

  return {
    hour: parseInt(hourStr, 10) || 0,
    day: parseInt(dayStr, 10) || 1,
  }
}

const fetchJobs = async () => {
  try {
    const { data } = await apiClient.get('/api/jobs')
    // Es werden nur die Gebühren-Jobs auf dieser Seite angezeigt
    feeJobs.value = data.filter(
      (j: any) => j.jobType === 'SCHEDULED_FEE' || j.type === 'SCHEDULED_FEE',
    )
  } catch (e) {
    console.error('Fehler beim Laden der Jobs', e)
  }
}

const openModal = (job: any = null) => {
  if (job) {
    editingId.value = job.id
    const cronData = parseCron(job.cronExpression)
    form.value = {
      description: job.description,
      amountEuro: job.amountInCents / 100,
      day: cronData.day,
      hour: cronData.hour,
      enabled: job.enabled,
    }
  } else {
    editingId.value = null
    form.value = {
      description: '',
      amountEuro: 0,
      day: 1,
      hour: 0,
      enabled: true,
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingId.value = null
}

const saveJob = async () => {
  const cron = `0 0 ${form.value.hour} ${form.value.day} * ?`
  const payload = {
    id: editingId.value,
    cronExpression: cron,
    enabled: form.value.enabled,
    amountInCents: Math.round(form.value.amountEuro * 100),
    description: form.value.description,
  }

  try {
    if (editingId.value) {
      await apiClient.put(`/api/jobs/fee/${editingId.value}`, payload)
    } else {
      await apiClient.post('/api/jobs/fee', payload)
    }
    closeModal() // Schließt das Modal verlässlich bei Erfolg
    await fetchJobs()
  } catch (error) {
    console.error('Fehler beim Speichern des Jobs:', error)
    alert('Der Job konnte nicht gespeichert werden.')
  }
}

const toggleStatus = async (job: any) => {
  const nextState = !job.enabled
  const payload = {
    id: job.id,
    cronExpression: job.cronExpression,
    enabled: nextState,
    amountInCents: job.amountInCents,
    description: job.description,
  }

  try {
    await apiClient.put(`/api/jobs/fee/${job.id}`, payload)
    await fetchJobs()
  } catch (e) {
    console.error('Fehler beim Ändern des Status', e)
    alert('Statusänderung fehlgeschlagen.')
  }
}

const triggerJob = async (job: any) => {
  if (confirm(`Möchtest du den Job "${job.description}" jetzt sofort einmalig manuell auslösen?`)) {
    try {
      await apiClient.post(`/api/jobs/${job.id}/trigger`)
      alert('Job wurde erfolgreich im Hintergrund angestoßen!')
    } catch (e) {
      console.error('Fehler beim Triggern des Jobs', e)
      alert('Manuelles Auslösen fehlgeschlagen.')
    }
  }
}

const confirmDelete = async (job: any) => {
  if (confirm(`Soll der Job "${job.description}" wirklich unwiderruflich gelöscht werden?`)) {
    try {
      await apiClient.delete(`/api/jobs/fee/${job.id}`)
      await fetchJobs()
    } catch (e) {
      console.error('Fehler beim Löschen des Jobs', e)
      alert('Löschen fehlgeschlagen.')
    }
  }
}

onMounted(fetchJobs)
</script>
