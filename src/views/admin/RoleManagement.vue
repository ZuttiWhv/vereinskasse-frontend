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
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition flex flex-col relative overflow-hidden"
      >
        <div
          v-if="role.forcePasswordLogin"
          class="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1"
        >
          <span class="text-[10px] font-bold uppercase tracking-wider">Secure</span>
          <span class="text-xs">🔒</span>
        </div>

        <div class="mb-4">
          <h3 class="text-lg font-bold text-gray-900 truncate pr-16" :title="role.name">
            {{ role.name }}
          </h3>
        </div>

        <div class="flex-grow">
          <p class="text-[11px] uppercase tracking-wider text-gray-400 mb-2 font-bold">
            Zugewiesene Rechte
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="perm in role.permissions"
              :key="perm.id"
              class="bg-slate-50 text-slate-600 border border-slate-200 text-[11px] px-2.5 py-0.5 rounded-md font-medium"
            >
              {{ perm.name }}
            </span>
            <span v-if="role.permissions.length === 0" class="text-sm text-gray-400 italic">
              Keine Rechte zugewiesen
            </span>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-50 flex justify-end gap-4">
          <button
            v-if="authStore.hasAuthority('WRITE_ROLE')"
            @click="openModal(role)"
            class="text-blue-600 hover:text-blue-800 text-sm font-semibold transition"
          >
            Bearbeiten
          </button>
          <button
            v-if="authStore.hasAuthority('DELETE_ROLE')"
            @click="deleteRole(role.id)"
            class="text-red-400 hover:text-red-600 text-sm font-medium transition"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-800">
            {{ isEditing ? 'Rolle bearbeiten' : 'Neue Rolle erstellen' }}
          </h2>
          <span v-if="isEditing" class="text-xs font-mono text-gray-400">#{{ formData.id }}</span>
        </div>

        <div class="p-6 overflow-y-auto flex-grow space-y-6">
          <div>
            <label class="block text-sm font-semibold text-gray-600 mb-1">Anzeigename</label>
            <input
              v-model="formData.name"
              id="role-name"
              @focus="kbStore.open('role-name', 'default', formData.name)"
              type="text"
              placeholder="z.B. ROLE_ADMIN"
              class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
            />
          </div>

          <div
            class="p-4 rounded-xl border transition-colors"
            :class="
              formData.forcePasswordLogin
                ? 'bg-amber-50 border-amber-200'
                : 'bg-gray-50 border-gray-200'
            "
          >
            <div class="flex items-center justify-between">
              <div>
                <span
                  class="block text-sm font-bold"
                  :class="formData.forcePasswordLogin ? 'text-amber-900' : 'text-gray-800'"
                >
                  Sicherheits-Login erzwingen
                </span>
                <span class="text-xs text-gray-500">Inaktiviert Barcode- & Schnell-Login</span>
              </div>
              <button
                @click="formData.forcePasswordLogin = !formData.forcePasswordLogin"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                :class="formData.forcePasswordLogin ? 'bg-amber-500' : 'bg-gray-300'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                  :class="formData.forcePasswordLogin ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-600 mb-3">Berechtigungen</label>
            <div
              class="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100"
            >
              <label
                v-for="perm in allPermissions"
                :key="perm.id"
                class="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white hover:shadow-sm rounded-lg transition"
              >
                <input
                  type="checkbox"
                  :value="perm.id"
                  v-model="selectedPermissionIds"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span class="text-xs text-gray-700 font-medium">{{ perm.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            @click="closeModal"
            class="px-5 py-2 text-gray-500 font-semibold hover:text-gray-700 transition"
          >
            Abbrechen
          </button>
          <button
            @click="saveRole"
            :disabled="!formData.name"
            class="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold shadow-md disabled:opacity-30"
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

// --- TypeScript Interfaces ---
interface Permission {
  id: number
  name: string
}

interface Role {
  id: number
  name: string
  permissions: Permission[]
  forcePasswordLogin: boolean // Neu hinzugefügt
}

// --- State ---
const roles = ref<Role[]>([])
const allPermissions = ref<Permission[]>([])
const showModal = ref(false)
const isEditing = ref(false)

// Formular-Daten erweitert
const formData = ref({
  id: null as number | null,
  name: '',
  forcePasswordLogin: false,
})
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
    // Wir setzen die Werte einzeln, um sicherzugehen, dass die Reaktivität greift
    formData.value.id = role.id
    formData.value.name = role.name
    // WICHTIG: Explizite Konvertierung zu Boolean (!! erzwingt true/false)
    formData.value.forcePasswordLogin = role.forcePasswordLogin

    selectedPermissionIds.value = role.permissions.map((p) => p.id)
  } else {
    isEditing.value = false
    formData.value = { id: null, name: '', forcePasswordLogin: false }
    selectedPermissionIds.value = []
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

// --- Speichern ---
const saveRole = async () => {
  try {
    const payload = {
      name: formData.value.name,
      forcePasswordLogin: formData.value.forcePasswordLogin,
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
    console.error('Fehler beim Speichern:', error)
    alert('Speichern fehlgeschlagen.')
  }
}

const deleteRole = async (id: number) => {
  if (!confirm('Rolle wirklich löschen?')) return
  try {
    await apiClient.delete(`/api/roles/${id}`)
    await fetchRoles()
  } catch (error) {
    console.error('Fehler beim Löschen:', error)
  }
}

onMounted(() => {
  fetchRoles()
  fetchPermissions()
})
</script>
