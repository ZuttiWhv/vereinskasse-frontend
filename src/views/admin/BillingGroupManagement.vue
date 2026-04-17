<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Abrechnungsgruppen</h1>
        <p class="text-sm text-gray-500">Definiere Limits und Regeln für Benutzergruppen.</p>
      </div>

      <div class="flex flex-col sm:flex-row w-full md:w-auto gap-3">
        <button
          v-if="authStore.hasAuthority('WRITE_BILLING_GROUP')"
          @click="openModal()"
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition shadow-md font-semibold whitespace-nowrap"
        >
          + Neue Gruppe
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase font-bold"
            >
              <th class="px-6 py-4">Name / Beschreibung</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Kreditlimit</th>
              <th class="px-6 py-4 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="group in groups" :key="group.id" class="hover:bg-gray-50/50 transition">
              <td class="px-6 py-4">
                <div class="font-bold text-gray-900">{{ group.name }}</div>
                <div class="text-xs text-gray-500">
                  {{ group.description || 'Keine Beschreibung' }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-2">
                  <span
                    v-if="group.isDefault"
                    class="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-xs font-medium"
                  >
                    Standard
                  </span>
                  <span
                    v-if="group.allowNegativeBalance"
                    class="px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded text-xs font-medium"
                  >
                    Dispo aktiv
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded text-xs font-medium"
                  >
                    Nur Guthaben
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <span
                  :class="[
                    'font-mono font-bold',
                    group.allowNegativeBalance ? 'text-red-500' : 'text-gray-400',
                  ]"
                >
                  {{
                    group.allowNegativeBalance ? '-' + formatCurrency(group.creditLimit) : '0,00 €'
                  }}
                </span>
              </td>
              <td class="px-6 py-4 text-right space-x-3">
                <button
                  v-if="authStore.hasAuthority('WRITE_BILLING_GROUP')"
                  @click="openModal(group)"
                  class="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Bearbeiten
                </button>
                <button
                  v-if="authStore.hasAuthority('DELETE_BILLING_GROUP')"
                  @click="deleteGroup(group)"
                  :disabled="group.isDefault"
                  class="text-red-400 hover:text-red-600 font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Löschen
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-800">
            {{ isEditing ? 'Gruppe bearbeiten' : 'Neue Abrechnungsgruppe' }}
          </h2>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 text-2xl">
            &times;
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name der Gruppe</label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="z.B. Vorstand, Gäste..."
              class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <textarea
              v-model="formData.description"
              rows="2"
              class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div class="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <label class="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                v-model="formData.allowNegativeBalance"
                class="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span class="text-sm font-medium text-gray-700"
                >Negatives Guthaben (Dispo) erlauben</span
              >
            </label>

            <div
              v-if="formData.allowNegativeBalance"
              class="mt-2 pl-7 animate-in slide-in-from-top-2"
            >
              <label class="block text-xs font-semibold text-gray-500 uppercase mb-1"
                >Maximaler Dispo (€)</label
              >
              <div class="relative">
                <input
                  v-model="displayLimit"
                  type="number"
                  step="0.01"
                  class="w-full pl-3 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-mono font-bold"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              </div>
            </div>
          </div>

          <label class="flex items-center space-x-3 cursor-pointer p-3">
            <input
              type="checkbox"
              v-model="formData.isDefault"
              class="h-4 w-4 text-emerald-600 border-gray-300 rounded"
            />
            <span class="text-sm font-medium text-gray-700">Als Standard-Gruppe für neue User</span>
          </label>
        </div>

        <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            @click="showModal = false"
            class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
          >
            Abbrechen
          </button>
          <button
            @click="saveGroup"
            :disabled="!formData.name"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50"
          >
            {{ isEditing ? 'Aktualisieren' : 'Speichern' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiClient from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// --- STATE ---
const groups = ref<any[]>([])
const showModal = ref(false)
const isEditing = ref(false)

const formData = ref({
  id: null as number | null,
  name: '',
  description: '',
  allowNegativeBalance: false,
  creditLimit: 0, // In Cent
  isDefault: false,
})

// --- COMPUTED ---
// Rechnet Cent im State in Euro für das Input-Feld um
const displayLimit = computed({
  get: () => formData.value.creditLimit / 100,
  set: (val) => {
    formData.value.creditLimit = Math.round(val * 100)
  },
})

// --- AKTIONEN ---
const fetchGroups = async () => {
  try {
    const { data } = await apiClient.get('/api/billing-groups')
    groups.value = data
  } catch (error) {
    console.error('Fehler beim Laden der Gruppen', error)
  }
}

const openModal = (group: any = null) => {
  if (group) {
    isEditing.value = true
    formData.value = { ...group }
  } else {
    isEditing.value = false
    formData.value = {
      id: null,
      name: '',
      description: '',
      allowNegativeBalance: false,
      creditLimit: 0,
      isDefault: false,
    }
  }
  showModal.value = true
}

const saveGroup = async () => {
  try {
    if (isEditing.value && formData.value.id) {
      await apiClient.put(`/api/billing-groups/${formData.value.id}`, formData.value)
    } else {
      await apiClient.post('/api/billing-groups', formData.value)
    }
    await fetchGroups()
    showModal.value = false
  } catch (error: any) {
    alert(error.response?.data?.message || 'Fehler beim Speichern der Gruppe.')
  }
}

const deleteGroup = async (group: any) => {
  if (group.isDefault) return

  if (confirm(`Abrechnungsgruppe "${group.name}" wirklich löschen?`)) {
    try {
      await apiClient.delete(`/api/billing-groups/${group.id}`)
      await fetchGroups()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Löschen fehlgeschlagen. Sind noch User zugeordnet?')
    }
  }
}

const formatCurrency = (cents: number) => {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

onMounted(() => {
  fetchGroups()
})
</script>
