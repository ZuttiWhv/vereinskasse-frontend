<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-2xl font-bold text-gray-800">Rollen & Rechte verwalten</h1>
      <button
        v-if="authStore.hasAuthority('WRITE_ROLE')"
        @click="openModal()"
        class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition shadow-md font-semibold"
      >
        + Neue Rolle
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="role in roles"
        :key="role.id"
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition flex flex-col"
      >
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-bold text-gray-900">{{ role.name }}</h3>
          <span class="text-xs text-gray-400 font-mono">ID: {{ role.id }}</span>
        </div>

        <div class="flex-grow">
          <p class="text-sm text-gray-500 mb-2 font-semibold">Zugewiesene Rechte:</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="perm in role.permissions"
              :key="perm.id"
              class="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-full font-medium"
            >
              {{ perm.name }}
            </span>
            <span v-if="role.permissions.length === 0" class="text-sm text-gray-400 italic">
              Keine Rechte zugewiesen
            </span>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-4">
          <button
            v-if="authStore.hasAuthority('WRITE_ROLE')"
            @click="openModal(role)"
            class="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
          >
            Bearbeiten
          </button>
          <button
            v-if="authStore.hasAuthority('DELETE_ROLE')"
            @click="deleteRole(role.id)"
            class="text-red-500 hover:text-red-700 text-sm font-medium transition"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-xl font-bold text-gray-800">
            {{ isEditing ? 'Rolle bearbeiten' : 'Neue Rolle erstellen' }}
          </h2>
        </div>

        <div class="p-6 overflow-y-auto flex-grow space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name der Rolle</label>
            <input
              v-model="formData.name"
              id="role-name"
              @focus="kbStore.open('role-name', formData.name)"
              type="text"
              placeholder="z.B. ROLE_KASSIERER"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Rechte zuweisen</label>
            <div
              class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200"
            >
              <label
                v-for="perm in allPermissions"
                :key="perm.id"
                class="flex items-center space-x-3 cursor-pointer p-1 hover:bg-gray-100 rounded transition"
              >
                <input
                  type="checkbox"
                  :value="perm.id"
                  v-model="selectedPermissionIds"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700 font-medium">{{ perm.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            @click="closeModal"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Abbrechen
          </button>
          <button
            @click="saveRole"
            :disabled="!formData.name"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useKeyboardStore } from '@/stores/keyboard'
const kbStore = useKeyboardStore()

const authStore = useAuthStore()

// --- TypeScript Interfaces (entsprechen deinem Backend) ---
interface Permission {
  id: number
  name: string
}

interface Role {
  id: number
  name: string
  permissions: Permission[]
}

// --- State ---
const roles = ref<Role[]>([])
const allPermissions = ref<Permission[]>([])
const showModal = ref(false)
const isEditing = ref(false)

// Formular-Daten
const formData = ref({ id: null as number | null, name: '' })
const selectedPermissionIds = ref<number[]>([])

// --- API Aufrufe ---
const fetchRoles = async () => {
  try {
    const { data } = await apiClient.get<Role[]>('/api/roles')
    roles.value = data
  } catch (error) {
    console.error('Fehler beim Laden der Rollen:', error)
  }
}

const fetchPermissions = async () => {
  try {
    const { data } = await apiClient.get<Permission[]>('/api/permissions')
    allPermissions.value = data
  } catch (error) {
    console.error('Fehler beim Laden der Rechte:', error)
  }
}

// --- Modal Logik ---
const openModal = (role?: Role) => {
  if (role) {
    isEditing.value = true
    formData.value = { id: role.id, name: role.name }
    // Mappt die zugewiesenen Rechte-Objekte auf ein Array von IDs für die Checkboxen
    selectedPermissionIds.value = role.permissions.map((p) => p.id)
  } else {
    isEditing.value = false
    formData.value = { id: null, name: '' }
    selectedPermissionIds.value = []
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

// --- Speichern (Create / Update) ---
const saveRole = async () => {
  try {
    // Backend erwartet oft eine Liste von Objekten für die Many-to-Many Beziehung
    // Wir bauen das Array von IDs wieder in ein Array von Objekten um: [{ id: 1 }, { id: 2 }]
    const payload = {
      name: formData.value.name,
      permissions: selectedPermissionIds.value.map((id) => ({ id })),
    }

    if (isEditing.value && formData.value.id) {
      await apiClient.put(`/api/roles/${formData.value.id}`, payload)
    } else {
      await apiClient.post('/api/roles', payload)
    }

    await fetchRoles()
    closeModal()
  } catch (error) {
    console.error('Fehler beim Speichern der Rolle:', error)
    alert('Fehler beim Speichern. Bitte Konsole prüfen.')
  }
}

// --- Löschen ---
const deleteRole = async (id: number) => {
  if (!confirm('Rolle wirklich löschen? Benutzer könnten ihre Rechte verlieren!')) return

  try {
    await apiClient.delete(`/api/roles/${id}`)
    await fetchRoles()
  } catch (error) {
    console.error('Fehler beim Löschen:', error)
    alert('Rolle konnte nicht gelöscht werden (wird sie noch von Usern verwendet?).')
  }
}

// --- Lifecycle ---
onMounted(() => {
  fetchRoles()
  fetchPermissions()
})
</script>
