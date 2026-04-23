<template>
  <div class="max-w-2xl mx-auto p-6 space-y-8">
    <header>
      <h1 class="text-2xl font-bold text-gray-800">Mein Profil</h1>
      <p class="text-sm text-gray-500">
        Verwalte deine Sicherheitseinstellungen und den PIN-Login.
      </p>
    </header>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-50">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>🔒</span> Passwort ändern
        </h2>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Neues Passwort</label>
          <input
            id="password"
            @focus="kbStore.open('password', formData.newPassword)"
            v-model="formData.newPassword"
            type="password"
            placeholder="Mindestens 4 Zeichen"
            class="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-50 flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>✨</span> Passwortloser Einstieg
          </h2>
          <p class="text-xs text-gray-500 mt-1">Login nur über mTLS-zertifizierte Geräte.</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="formData.passwordlessLoginEnabled" class="sr-only peer" />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
          ></div>
        </label>
      </div>

      <div
        v-if="formData.passwordlessLoginEnabled"
        class="p-6 bg-amber-50 border-t border-amber-100"
      >
        <div class="flex gap-3">
          <span class="text-xl">⚠️</span>
          <div>
            <h4 class="text-sm font-bold text-amber-900 uppercase tracking-wide">
              Sicherheitshinweis
            </h4>
            <p class="text-sm text-amber-800 mt-1 leading-relaxed">
              Durch Aktivierung dieser Funktion wird an zertifizierten Terminals
              <strong>kein Passwort mehr abgefragt</strong>. Jede Person, die physischen Zugriff auf
              ein solches Terminal hat, kann in deinem Namen Buchungen vornehmen. Nutze dies nur,
              wenn du dem Standort des Terminals vertraust.
            </p>
          </div>
        </div>
      </div>
      <div v-else class="p-6 bg-gray-50 text-sm text-gray-500 italic">
        Passwortloser Einstieg ist aktuell deaktiviert.
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-50 flex justify-between items-center">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>🔢</span> PIN-Login am Terminal
        </h2>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="formData.pinEnabled" class="sr-only peer" />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
          ></div>
        </label>
      </div>

      <div class="p-6 space-y-6">
        <div v-if="formData.pinEnabled">
          <p class="text-sm text-gray-500 mb-4">
            Gib hier deine neue PIN ein (4-6 Ziffern). Diese ersetzt das lange Passwort für den
            Schnell-Login.
          </p>

          <div class="flex flex-col items-center gap-4">
            <input
              id="pin"
              @focus="kbStore.open('pin', formData.newPin, 'numeric')"
              v-model="formData.newPin"
              type="password"
              inputmode="numeric"
              maxlength="6"
              placeholder="****"
              class="w-32 text-center text-2xl tracking-widest px-4 py-3 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 transition"
            />
            <span
              v-if="formData.newPin && !/^\d{4,6}$/.test(formData.newPin)"
              class="text-xs text-red-500"
            >
              Die PIN muss aus 4 bis 6 Ziffern bestehen.
            </span>
          </div>
        </div>

        <div v-else class="text-center py-4 text-gray-400 text-sm italic">
          PIN-Login ist aktuell deaktiviert.
        </div>
      </div>
    </section>

    <div class="flex justify-end gap-4">
      <button
        @click="loadUserData"
        class="px-6 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition"
      >
        Abbrechen
      </button>
      <button
        @click="handleUpdate"
        :disabled="!isDirty || !isValid"
        class="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition"
      >
        Änderungen speichern
      </button>
    </div>

    <div
      v-if="statusMsg"
      :class="
        statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      "
      class="p-4 rounded-xl text-center font-medium border animate-in"
    >
      {{ statusMsg.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import apiClient from '@/api/client'
import { useKeyboardStore } from '@/stores/keyboard'

const kbStore = useKeyboardStore()

const formData = ref({
  newPassword: '',
  newPin: '',
  pinEnabled: false,
  passwordlessLoginEnabled: false,
})

const originalData = ref<any>(null)
const statusMsg = ref<{ text: string; type: 'success' | 'error' } | null>(null)

// Prüfen ob Änderungen vorgenommen wurden
const isDirty = computed(() => {
  if (!originalData.value) return false
  return (
    formData.value.newPassword !== '' ||
    formData.value.newPin !== '' ||
    formData.value.pinEnabled !== originalData.value.pinEnabled ||
    formData.value.passwordlessLoginEnabled !== originalData.value.passwordlessLoginEnabled
  )
})

// Validierung der Eingaben
const isValid = computed(() => {
  const pwValid = formData.value.newPassword === '' || formData.value.newPassword.length >= 4
  const pinValid = formData.value.newPin === '' || /^\d{4,6}$/.test(formData.value.newPin)
  return pwValid && pinValid
})

const loadUserData = async () => {
  try {
    const { data } = await apiClient.get('/api/users/me')
    originalData.value = data
    formData.value.pinEnabled = data.pinEnabled
    formData.value.passwordlessLoginEnabled = data.passwordlessLoginEnabled
    formData.value.newPassword = ''
    formData.value.newPin = ''
  } catch (error) {
    showStatus('Fehler beim Laden der Daten', 'error')
  }
}

const handleUpdate = async () => {
  try {
    const payload = {
      newPassword: formData.value.newPassword || null,
      newPin: formData.value.newPin || null,
      pinEnabled: formData.value.pinEnabled,
      passwordlessLoginEnabled: formData.value.passwordlessLoginEnabled,
    }

    await apiClient.put('/api/users/me', payload)
    showStatus('Profil erfolgreich aktualisiert!', 'success')
    await loadUserData()
  } catch (error: any) {
    showStatus(error.response?.data?.message || 'Update fehlgeschlagen', 'error')
  }
}

const showStatus = (text: string, type: 'success' | 'error') => {
  statusMsg.value = { text, type }
  setTimeout(() => (statusMsg.value = null), 4000)
}

onMounted(loadUserData)
</script>

<style scoped>
.animate-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
