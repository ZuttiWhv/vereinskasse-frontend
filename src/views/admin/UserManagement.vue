<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Benutzerverwaltung</h1>
        <p class="text-sm text-gray-500">Verwalte Mitglieder, Rollen und Guthaben.</p>
      </div>

      <div class="flex flex-col sm:flex-row w-full md:w-auto gap-3">
        <div class="relative flex-grow">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"> 🔍 </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Benutzer suchen..."
            class="pl-10 pr-4 py-2 border rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <button
          v-if="authStore.hasAuthority('WRITE_USER')"
          @click="openModal()"
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition shadow-md font-semibold whitespace-nowrap"
        >
          + Neuer Benutzer
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
              <th class="px-6 py-4">Benutzername</th>
              <th class="px-6 py-4">Rollen</th>
              <th class="px-6 py-4 text-right">Guthaben</th>
              <th class="px-6 py-4 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50/50 transition">
              <td class="px-6 py-4">
                <div class="font-bold text-gray-900">{{ user.username }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="roleName in user.roles"
                    :key="roleName"
                    class="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-xs font-medium"
                  >
                    {{ roleName }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <span
                  :class="[
                    'font-mono font-bold',
                    user.balance < 0 ? 'text-red-500' : 'text-emerald-600',
                  ]"
                >
                  {{ formatCurrency(user.balance) }}
                </span>
              </td>
              <td class="px-6 py-4 text-right space-x-3">
                <button
                  v-if="authStore.hasAuthority('WRITE_USER')"
                  @click="openDepositModal(user)"
                  class="text-emerald-600 hover:text-emerald-800 font-medium text-sm"
                >
                  Einzahlen
                </button>
                <button
                  v-if="authStore.hasAuthority('WRITE_USER')"
                  @click="openModal(user)"
                  class="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Bearbeiten
                </button>
                <button
                  v-if="authStore.hasAuthority('DELETE_USER')"
                  @click="deleteUser(user)"
                  class="text-red-400 hover:text-red-600 font-medium text-sm"
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
            {{ isEditing ? 'Benutzer bearbeiten' : 'Neuen Benutzer anlegen' }}
          </h2>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 text-2xl">
            &times;
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Benutzername</label>
            <input
              v-model="formData.username"
              type="text"
              class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{
              isEditing ? 'Neues Passwort (optional)' : 'Passwort'
            }}</label>
            <input
              v-model="formData.password"
              type="password"
              class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rollen zuweisen</label>
            <div
              class="grid grid-cols-1 gap-2 p-3 border rounded-lg bg-gray-50 max-h-48 overflow-y-auto"
            >
              <div
                v-for="role in roles"
                :key="role.id"
                class="flex items-center space-x-3 p-2 hover:bg-white rounded transition border border-transparent hover:border-gray-200"
              >
                <input
                  type="checkbox"
                  :id="'role-' + role.id"
                  :value="role.id"
                  v-model="formData.roleIds"
                  class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label
                  :for="'role-' + role.id"
                  class="text-sm text-gray-700 cursor-pointer flex-grow select-none"
                  >{{ role.name }}</label
                >
              </div>
            </div>
          </div>
        </div>
        <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            @click="showModal = false"
            class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
          >
            Abbrechen
          </button>
          <button
            @click="saveUser"
            :disabled="!isFormValid"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50"
          >
            {{ isEditing ? 'Aktualisieren' : 'Speichern' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDepositModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-xl font-bold text-gray-800">Guthaben aufladen</h2>
          <p class="text-sm text-gray-500">Für {{ selectedUserForDeposit?.username }}</p>
        </div>

        <div class="p-6">
          <label class="block text-sm font-medium text-gray-700 mb-2 text-center"
            >Betrag in Euro</label
          >
          <div class="relative">
            <input
              v-model="depositAmount"
              type="number"
              step="0.01"
              min="0.01"
              class="w-full pl-4 pr-10 py-4 border-2 border-emerald-100 rounded-xl text-3xl font-bold text-center outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="0,00"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400"
              >€</span
            >
          </div>
        </div>

        <div class="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
          <button
            @click="handleDeposit"
            :disabled="depositAmount <= 0"
            class="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold disabled:opacity-50"
          >
            Einzahlung bestätigen
          </button>
          <button
            @click="showDepositModal = false"
            class="w-full py-2 text-gray-500 hover:text-gray-700 font-medium transition"
          >
            Abbrechen
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

// --- ZUSTAND (STATE) ---
const users = ref<any[]>([])
const roles = ref<any[]>([])
const searchQuery = ref('')
const showModal = ref(false)
const isEditing = ref(false)

// NEU: Deposit State
const showDepositModal = ref(false)
const depositAmount = ref<number>(0)
const selectedUserForDeposit = ref<any>(null)

const formData = ref({
  id: null as number | null,
  username: '',
  password: '',
  roleIds: [] as number[],
})

// --- COMPUTED (SORTIERUNG & SUCHE) ---
const filteredUsers = computed(() => {
  const filtered = users.value.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
  return filtered.sort((a, b) =>
    a.username.localeCompare(b.username, 'de', { sensitivity: 'base' }),
  )
})

const isFormValid = computed(() => {
  const basic = formData.value.username.length >= 3 && formData.value.roleIds.length > 0
  return isEditing.value ? basic : basic && formData.value.password.length >= 4
})

// --- AKTIONEN (LOGIK) ---
const fetchUsers = async () => {
  try {
    const { data } = await apiClient.get('/api/users')
    users.value = Object.values(data)
  } catch (error) {
    console.error('Fehler beim Laden der Benutzer', error)
  }
}

const fetchRoles = async () => {
  try {
    const { data } = await apiClient.get('/api/roles')
    roles.value = Object.values(data).sort((a: any, b: any) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Fehler beim Laden der Rollen', error)
  }
}

// NEU: Einzahlungs-Logik
const openDepositModal = (user: any) => {
  selectedUserForDeposit.value = user
  depositAmount.value = 0
  showDepositModal.value = true
}

const handleDeposit = async () => {
  if (depositAmount.value <= 0 || !selectedUserForDeposit.value) return

  try {
    const amountInCents = Math.round(depositAmount.value * 100)
    await apiClient.post(`/api/users/${selectedUserForDeposit.value.id}/deposit`, amountInCents)

    // 1. Die Liste der User in der Tabelle aktualisieren (damit der Kassenwart sieht, dass es geklappt hat)
    await fetchUsers()

    // 2. NEU: Wenn der Kassenwart für SICH SELBST eingezahlt hat, die Menüleiste updaten
    if (selectedUserForDeposit.value.id === authStore.user?.id) {
      await authStore.fetchProfile()
    }

    showDepositModal.value = false
    depositAmount.value = 0
  } catch (error: any) {
    alert(error.response?.data?.message || 'Fehler bei der Einzahlung.')
  }
}

const openModal = (user: any = null) => {
  if (user) {
    isEditing.value = true
    const userRoleIds = roles.value.filter((r) => user.roles.includes(r.name)).map((r) => r.id)
    formData.value = {
      id: user.id,
      username: user.username,
      password: '',
      roleIds: userRoleIds,
    }
  } else {
    isEditing.value = false
    formData.value = { id: null, username: '', password: '', roleIds: [] }
  }
  showModal.value = true
}

const saveUser = async () => {
  try {
    const payload = {
      username: formData.value.username,
      roleIds: formData.value.roleIds,
      ...(formData.value.password && { password: formData.value.password }),
    }

    if (isEditing.value && formData.value.id) {
      await apiClient.put(`/api/users/${formData.value.id}`, payload)
    } else {
      await apiClient.post('/api/users', payload)
    }

    await fetchUsers()
    showModal.value = false
  } catch (error: any) {
    alert(error.response?.data?.message || 'Fehler beim Speichern.')
  }
}

const deleteUser = async (user: any) => {
  if (confirm(`Benutzer "${user.username}" wirklich löschen?`)) {
    try {
      await apiClient.delete(`/api/users/${user.id}`)
      await fetchUsers()
    } catch (error) {
      alert('Löschen fehlgeschlagen.')
    }
  }
}

const formatCurrency = (cents: number) => {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

onMounted(() => {
  fetchUsers()
  fetchRoles()
})
</script>
