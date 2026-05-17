<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Benutzerverwaltung</h1>
        <p class="text-sm text-gray-500">Verwalte Mitglieder, Rollen, OUs und Guthaben.</p>
      </div>

      <div class="flex flex-col sm:flex-row w-full md:w-auto gap-3">
        <div class="relative grow">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"> 🔍 </span>
          <label for="searchBar" class="sr-only">Benutzer suchen</label>
          <input
            id="searchBar"
            v-model="searchQuery"
            type="text"
            placeholder="Benutzer suchen..."
            @focus="kbStore.open('searchBar', searchQuery)"
            :class="[
              'pl-10 pr-4 py-2 border rounded-lg w-full outline-none transition-all bg-white',
              kbStore.activeInputId === 'searchBar'
                ? 'input-keyboard-active'
                : 'focus:ring-2 focus:ring-blue-500',
            ]"
          />
        </div>

        <button
          v-if="authStore.hasAuthority('READ_USER')"
          type="button"
          @click="downloadBarcodePdf"
          class="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition shadow-sm font-semibold whitespace-nowrap"
          title="PDF Liste mit Barcodes exportieren"
        >
          <span>📄</span> PDF Export
        </button>

        <button
          v-if="allowBarcodeLogin && authStore.hasAuthority('WRITE_USER')"
          type="button"
          @click="generateAllBarcodes"
          :disabled="isGenerating"
          class="bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200 px-4 py-2 rounded-lg transition shadow-sm font-semibold whitespace-nowrap disabled:opacity-50"
        >
          {{ isGenerating ? 'Generiere...' : '🔤 Alle Barcodes neu' }}
        </button>

        <button
          v-if="authStore.hasAuthority('WRITE_USER')"
          type="button"
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
              <th class="px-6 py-4">Abrechnung / Abteilung</th>
              <th class="px-6 py-4">Rollen</th>
              <th class="px-6 py-4 text-right">Guthaben</th>
              <th class="px-6 py-4 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50/50 transition">
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-900">{{ user.username }}</span>
                  <div
                    v-if="allowBarcodeLogin"
                    class="flex items-center"
                    :title="user.hasBarcode || user.barcode ? 'Barcode zugewiesen' : 'Kein Barcode'"
                  >
                    <span
                      class="text-xs px-1.5 py-0.5 rounded border"
                      :class="
                        user.hasBarcode || user.barcode
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-gray-50 text-gray-400 border-gray-200'
                      "
                    >
                      🏷️
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col gap-1">
                  <span
                    class="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 w-fit"
                  >
                    💰 {{ user.billingGroupName || 'Keine Abrechnungsgruppe' }}
                  </span>
                  <span
                    class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit"
                  >
                    🏢 {{ user.orgUnitName || 'Keine Abteilung' }}
                  </span>
                </div>
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
                  v-if="allowBarcodeLogin && authStore.hasAuthority('WRITE_USER')"
                  type="button"
                  @click="generateBarcodeForUser(user)"
                  class="text-purple-600 hover:text-purple-800 font-medium text-sm"
                >
                  Barcode
                </button>
                <button
                  v-if="authStore.hasAuthority('WRITE_USER')"
                  type="button"
                  @click="openDepositModal(user, false)"
                  class="text-emerald-600 hover:text-emerald-800 font-medium text-sm"
                >
                  Einzahlen
                </button>
                <button
                  v-if="authStore.hasAuthority('WRITE_USER')"
                  type="button"
                  @click="openModal(user)"
                  class="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Bearbeiten
                </button>
                <button
                  v-if="authStore.hasAuthority('DELETE_USER')"
                  type="button"
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
      v-if="archivedUsers.length > 0"
      class="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6"
    >
      <h2 class="text-lg font-bold text-amber-800 mb-2">⚠️ Offene Konten ehemaliger Mitglieder</h2>
      <p class="text-sm text-amber-700 mb-4">
        Diese Benutzer wurden gelöscht/archiviert, haben aber kein ausgeglichenes Konto. Du kannst
        hier Guthaben auszahlen oder Schulden begleichen, um das Konto auf 0,00 € zu bringen.
      </p>

      <div class="bg-white rounded-lg border border-amber-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="bg-amber-100/50 text-amber-900 text-xs font-bold uppercase border-b border-amber-100"
            >
              <th class="px-6 py-3">Ehemaliger Benutzer</th>
              <th class="px-6 py-3 text-right">Offener Betrag</th>
              <th class="px-6 py-3 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-amber-50">
            <tr
              v-for="user in archivedUsers"
              :key="user.id"
              class="hover:bg-amber-50/30 transition"
            >
              <td class="px-6 py-4 font-semibold text-gray-800">{{ user.username }}</td>
              <td
                class="px-6 py-4 text-right font-mono font-bold"
                :class="user.balance < 0 ? 'text-red-500' : 'text-emerald-600'"
              >
                {{ formatCurrency(user.balance) }}
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  type="button"
                  @click="openDepositModal(user, true)"
                  class="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded transition font-semibold"
                >
                  Konto ausgleichen
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
          <button
            type="button"
            @click="showModal = false"
            class="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>
        <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label for="user-name" class="block text-sm font-medium text-gray-700 mb-1"
              >Benutzername</label
            >
            <input
              id="user-name"
              v-model="formData.username"
              type="text"
              @focus="kbStore.open('user-name', formData.username)"
              :class="[
                'w-full px-4 py-2 border rounded-lg outline-none transition-all',
                kbStore.activeInputId === 'user-name'
                  ? 'input-keyboard-active'
                  : 'focus:ring-2 focus:ring-blue-500',
              ]"
            />
          </div>
          <div>
            <label for="orgUnitId" class="block text-sm font-medium text-gray-700 mb-1"
              >Abteilung / OU</label
            >
            <select
              id="orgUnitId"
              v-model="formData.orgUnitId"
              class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option :value="null">-- Keine Abteilung --</option>
              <option v-for="unit in orgUnits" :key="unit.id" :value="unit.id">
                {{ unit.name }}
              </option>
            </select>
          </div>
          <div>
            <label for="billingGroupId" class="block text-sm font-medium text-gray-700 mb-1"
              >Abrechnungsgruppe</label
            >
            <select
              id="billingGroupId"
              v-model="formData.billingGroupId"
              class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option :value="null" disabled>Bitte Gruppe wählen...</option>
              <option v-for="group in billingGroups" :key="group.id" :value="group.id">
                {{ group.name }} {{ group.allowNegativeBalance ? '(Dispo)' : '(Nur Guthaben)' }}
              </option>
            </select>
          </div>
          <div>
            <label for="user-password" class="block text-sm font-medium text-gray-700 mb-1">{{
              isEditing ? 'Neues Passwort (optional)' : 'Passwort'
            }}</label>
            <input
              id="user-password"
              v-model="formData.password"
              type="password"
              @focus="kbStore.open('user-password', formData.password)"
              :class="[
                'w-full px-4 py-2 border rounded-lg outline-none transition-all',
                kbStore.activeInputId === 'user-password'
                  ? 'input-keyboard-active'
                  : 'focus:ring-2 focus:ring-blue-500',
              ]"
            />
          </div>
          <div>
            <span class="block text-sm font-medium text-gray-700 mb-2">Rollen zuweisen</span>
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
                  class="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                />
                <label
                  :for="'role-' + role.id"
                  class="text-sm text-gray-700 cursor-pointer grow select-none"
                  >{{ role.name }}</label
                >
              </div>
            </div>
          </div>
        </div>
        <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            @click="showModal = false"
            class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
          >
            Abbrechen
          </button>
          <button
            type="button"
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
          <h2 class="text-xl font-bold text-gray-800">
            {{ selectedUserForDeposit?.active ? 'Guthaben aufladen' : 'Konto ausgleichen' }}
          </h2>
          <p class="text-sm text-gray-500">Für {{ selectedUserForDeposit?.username }}</p>
        </div>
        <div class="p-6">
          <label for="depAmount" class="block text-sm font-medium text-gray-700 mb-2 text-center">
            {{
              !selectedUserForDeposit?.active && selectedUserForDeposit?.balance > 0
                ? 'Rückzahlungsbetrag (Auszahlung)'
                : 'Betrag in Euro'
            }}
          </label>
          <div class="relative">
            <input
              id="depAmount"
              v-model="depositAmount"
              type="number"
              step="0.01"
              :min="selectedUserForDeposit?.active ? 0.01 : -9999"
              @focus="kbStore.open('depAmount', String(depositAmount))"
              :class="[
                'w-full pl-4 pr-10 py-4 border-2 rounded-xl text-3xl font-bold text-center outline-none transition-all',
                kbStore.activeInputId === 'depAmount'
                  ? 'input-keyboard-active'
                  : 'border-emerald-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10',
              ]"
              placeholder="0,00"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400"
              >€</span
            >
          </div>

          <p v-if="depositAmount < 0" class="text-xs text-red-500 text-center mt-2 font-semibold">
            ⚠️ Negativer Betrag: Es wird eine Rückzahlung verbucht!
          </p>
        </div>
        <div class="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
          <button
            type="button"
            @click="handleDeposit"
            :disabled="selectedUserForDeposit?.active ? depositAmount <= 0 : depositAmount === 0"
            class="w-full py-3 text-white rounded-lg transition font-bold disabled:opacity-50"
            :class="
              depositAmount < 0
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            "
          >
            {{ depositAmount < 0 ? 'Rückzahlung bestätigen' : 'Einzahlung bestätigen' }}
          </button>
          <button
            type="button"
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
import { useKeyboardStore } from '@/stores/keyboard'

const kbStore = useKeyboardStore()
const authStore = useAuthStore()

// --- STATE ---
const users = ref<any[]>([])
const archivedUsers = ref<any[]>([]) // GEÄNDERT: Für gelöschte User mit offenem Saldo
const roles = ref<any[]>([])
const billingGroups = ref<any[]>([])
const orgUnits = ref<any[]>([])
const searchQuery = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const showDepositModal = ref(false)
const depositAmount = ref<number>(0)
const selectedUserForDeposit = ref<any>(null)

const allowBarcodeLogin = ref(false)
const isGenerating = ref(false)

const formData = ref({
  id: null as number | null,
  username: '',
  password: '',
  roleIds: [] as number[],
  billingGroupId: null as number | null,
  orgUnitId: null as number | null,
})

// --- COMPUTED ---
const filteredUsers = computed(() => {
  return users.value
    .filter((u) => u.username.toLowerCase().includes(searchQuery.value.toLowerCase()))
    .sort((a, b) => a.username.localeCompare(b.username, 'de'))
})

const isFormValid = computed(() => {
  const basic =
    formData.value.username.length >= 2 &&
    formData.value.roleIds.length > 0 &&
    formData.value.billingGroupId !== null
  return isEditing.value ? basic : basic && formData.value.password.length >= 4
})

// --- ACTIONS ---
const fetchSettings = async () => {
  try {
    const { data } = await apiClient.get('/api/settings')
    allowBarcodeLogin.value = data.allowBarcodeLogin || false
  } catch (error) {
    console.error('Settings-Error:', error)
  }
}

const fetchUsers = async () => {
  try {
    const { data } = await apiClient.get('/api/users')
    users.value = Object.values(data)
  } catch (error) {
    console.error('Users-Error:', error)
  }
}

// GEÄNDERT: Holt die Archiv-Daten vom Backend
const fetchArchivedUsers = async () => {
  try {
    const { data } = await apiClient.get('/api/users/archived-open-balance')
    archivedUsers.value = data
  } catch (error) {
    console.error('Archived-Users-Error:', error)
  }
}

const fetchRoles = async () => {
  try {
    const { data } = await apiClient.get('/api/roles')
    roles.value = Object.values(data).sort((a: any, b: any) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Roles-Error:', error)
  }
}

const fetchBillingGroups = async () => {
  try {
    const { data } = await apiClient.get('/api/billing-groups')
    billingGroups.value = data
  } catch (error) {
    console.error('Billing-Error:', error)
  }
}

const fetchOrgUnits = async () => {
  try {
    const { data } = await apiClient.get('/api/org-units')
    orgUnits.value = data.sort((a: any, b: any) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('OU-Error:', error)
  }
}

const downloadBarcodePdf = async () => {
  try {
    const response = await apiClient.get('/api/export/user-barcodes-pdf', { responseType: 'blob' })
    const url = globalThis.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'mitglieder_barcodes.pdf')
    document.body.appendChild(link)
    link.click()
    link.remove()
    globalThis.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF-Error:', error)
    alert('Export fehlgeschlagen.')
  }
}

const generateBarcodeForUser = async (user: any) => {
  if (confirm(`Neuen Barcode für "${user.username}" generieren?`)) {
    try {
      await apiClient.post(`/api/users/${user.id}/generate-barcode`)
      await fetchUsers()
    } catch (error: any) {
      console.error('Barcode-Error:', error)
      alert(error.response?.data?.message || 'Fehler.')
    }
  }
}

const generateAllBarcodes = async () => {
  if (confirm('Wirklich für ALLE Benutzer neue Barcodes erstellen?')) {
    isGenerating.value = true
    try {
      await apiClient.post('/api/users/generate-barcodes')
      await fetchUsers()
    } catch (error) {
      console.error('Mass-Gen-Error:', error)
      alert('Fehler.')
    } finally {
      isGenerating.value = false
    }
  }
}

// GEÄNDERT: Steuert die automatische Vorausberechnung und setzt das active-Flag
const openDepositModal = (user: any, isArchived = false) => {
  selectedUserForDeposit.value = { ...user, active: !isArchived }

  if (isArchived && user.balance !== 0) {
    // Schlägt den exakten mathematischen Kehrwert vor, um auf 0,00 € zu kommen
    depositAmount.value = (user.balance * -1) / 100
  } else {
    depositAmount.value = 0
  }
  showDepositModal.value = true
}

// GEÄNDERT: Validiert nach Aktivierungsstatus und triggert beide Listen-Refreshes
const handleDeposit = async () => {
  if (!selectedUserForDeposit.value) return

  // Harter UI-Schutzriegel vor der API-Anfrage
  if (selectedUserForDeposit.value.active && depositAmount.value <= 0) return
  if (!selectedUserForDeposit.value.active && depositAmount.value === 0) return

  try {
    const amountInCents = Math.round(depositAmount.value * 100)
    await apiClient.post(`/api/users/${selectedUserForDeposit.value.id}/deposit`, amountInCents)

    // Beide Tabellen frisch laden
    await fetchUsers()
    await fetchArchivedUsers()

    if (selectedUserForDeposit.value.id === authStore.user?.id) await authStore.fetchProfile()
    showDepositModal.value = false
  } catch (error) {
    console.error('Deposit-Error:', error)
    alert('Fehler bei der Buchung.')
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
      billingGroupId: user.billingGroupId || null,
      orgUnitId: user.orgUnitId || null,
    }
  } else {
    isEditing.value = false
    const defaultGroup = billingGroups.value.find((g) => g.isDefault)
    formData.value = {
      id: null,
      username: '',
      password: '',
      roleIds: [],
      billingGroupId: defaultGroup ? defaultGroup.id : null,
      orgUnitId: null,
    }
  }
  showModal.value = true
}

const saveUser = async () => {
  try {
    const payload = {
      username: formData.value.username,
      roleIds: formData.value.roleIds,
      billingGroupId: formData.value.billingGroupId,
      orgUnitId: formData.value.orgUnitId,
      ...(formData.value.password && { password: formData.value.password }),
    }
    if (isEditing.value && formData.value.id) {
      await apiClient.put(`/api/users/${formData.value.id}`, payload)
    } else {
      await apiClient.post('/api/users', payload)
    }
    await fetchUsers()
    showModal.value = false
  } catch (error) {
    console.error('Save-Error:', error)
    alert('Fehler beim Speichern.')
  }
}

// GEÄNDERT: Nach dem Archivieren auch die Altlasten-Liste neu laden
const deleteUser = async (user: any) => {
  if (
    confirm(
      `Benutzer "${user.username}" wirklich archivieren? Der Name wird frei, die Guthabenhistorie bleibt im System.`,
    )
  ) {
    try {
      await apiClient.delete(`/api/users/${user.id}`)
      await fetchUsers()
      await fetchArchivedUsers() // Aktualisiert die Altlasten-Box sofort
    } catch (error) {
      console.error('Delete-Error:', error)
      alert('Fehler beim Löschen.')
    }
  }
}

const formatCurrency = (cents: number) =>
  (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

onMounted(() => {
  fetchSettings()
  fetchUsers()
  fetchArchivedUsers() // GEÄNDERT: Lädt die Altlasten beim Start
  fetchRoles()
  fetchBillingGroups()
  fetchOrgUnits()
})
</script>
