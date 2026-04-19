<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-gray-800">Design & Einstellungen</h1>
      <p class="text-sm text-gray-500">Passe das Erscheinungsbild deiner Vereinskasse an.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-2 space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 class="text-lg font-semibold border-b pb-2 text-emerald-700">Login-Funktionen</h2>

          <div class="space-y-6">
            <div class="flex items-center justify-between group">
              <div class="flex flex-col flex-grow">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-700">Vereinfachtes Login (Quick-Login)</span>
                  <div class="relative flex items-center group/tooltip">
                    <span class="text-gray-400 cursor-help text-sm">ⓘ</span>
                    <div
                      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-64 bg-gray-800 text-white text-[11px] p-2 rounded shadow-lg z-10"
                    >
                      Erlaubt zertifizierten Geräten (mTLS), eine Liste der Abteilungen und
                      Benutzernamen zur schnellen Auswahl anzuzeigen.
                    </div>
                  </div>
                </div>
                <p class="text-xs text-gray-500">Ideal für Terminals am Verkaufsstand.</p>
              </div>
              <button
                @click="settings.quickLogin = !settings.quickLogin"
                :class="settings.quickLogin ? 'bg-emerald-500' : 'bg-gray-300'"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
              >
                <span
                  :class="settings.quickLogin ? 'translate-x-6' : 'translate-x-1'"
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                />
              </button>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex flex-col flex-grow">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-700">PIN-Login erlauben</span>
                  <div class="relative flex items-center group/tooltip">
                    <span class="text-gray-400 cursor-help text-sm">ⓘ</span>
                    <div
                      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-64 bg-gray-800 text-white text-[11px] p-2 rounded shadow-lg z-10"
                    >
                      Benutzer können optional eine 4-stellige PIN festlegen, um sich ohne Passwort
                      an angemeldeten Geräten zu identifizieren.
                    </div>
                  </div>
                </div>
                <p class="text-xs text-gray-500">
                  Muss zusätzlich vom Benutzer in seinem Profil aktiviert werden.
                </p>
              </div>
              <button
                @click="settings.pinLogin = !settings.pinLogin"
                :class="settings.pinLogin ? 'bg-emerald-500' : 'bg-gray-300'"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
              >
                <span
                  :class="settings.pinLogin ? 'translate-x-6' : 'translate-x-1'"
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                />
              </button>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 class="text-lg font-semibold border-b pb-2 text-emerald-700">Vereinslogo</h2>

          <div class="flex items-center gap-6">
            <div
              class="w-24 h-24 bg-gray-50 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="settings.logoPath"
                :src="getFullLogoUrl(settings.logoPath)"
                alt="Vorschau"
                class="max-h-full max-w-full object-contain"
              />
              <span v-else class="text-gray-400 text-xs text-center px-2">Kein Logo</span>
            </div>

            <div class="flex-grow space-y-2">
              <label for="uploadLogoPath" class="block text-sm font-medium text-gray-700"
                >Neues Logo hochladen</label
              >
              <input
                id="uploadLogoPath"
                type="file"
                @change="handleLogoUpload"
                accept="image/*"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              <p v-if="uploading" class="text-xs text-blue-500 animate-pulse">Lade hoch...</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 class="text-lg font-semibold border-b pb-2 text-emerald-700">Branding & Farben</h2>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Vereinsname</label>
            <input
              v-model="settings.vereinName"
              type="text"
              class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Primärfarbe</label>
              <div class="flex gap-2">
                <input
                  v-model="settings.primaryColor"
                  type="color"
                  class="h-10 w-12 cursor-pointer border-none rounded"
                />
                <input
                  v-model="settings.primaryColor"
                  type="text"
                  class="flex-grow px-2 py-2 border rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sekundärfarbe</label>
              <div class="flex gap-2">
                <input
                  v-model="settings.secondaryColor"
                  type="color"
                  class="h-10 w-12 cursor-pointer border-none rounded"
                />
                <input
                  v-model="settings.secondaryColor"
                  type="text"
                  class="flex-grow px-2 py-2 border rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nav Textfarbe</label>
              <div class="flex gap-2">
                <input
                  v-model="settings.navTextColor"
                  type="color"
                  class="h-10 w-12 cursor-pointer border-none rounded"
                />
                <input
                  v-model="settings.navTextColor"
                  type="text"
                  class="flex-grow px-2 py-2 border rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            @click="saveSettings"
            :disabled="isSaving || uploading"
            class="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold shadow-md disabled:opacity-50"
          >
            {{ isSaving ? 'Speichert...' : 'Design speichern' }}
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-800">Live-Vorschau</h2>
        <div
          class="bg-gray-50 border rounded-xl p-4 pointer-events-none border-dashed border-gray-300"
        >
          <div
            :style="{ backgroundColor: settings.primaryColor, color: settings.navTextColor }"
            class="h-12 rounded-t-lg flex items-center px-3 shadow-sm transition-all duration-500"
          >
            <img
              v-if="settings.logoPath"
              :src="getFullLogoUrl(settings.logoPath)"
              class="h-6 mr-2"
              alt="Logo"
            />
            <div v-else class="w-6 h-6 bg-white/20 rounded-full mr-2"></div>
            <div class="text-xs font-bold truncate">{{ settings.vereinName }}</div>
          </div>

          <div class="bg-white p-4 space-y-3 rounded-b-lg border-x border-b">
            <div class="h-3 w-3/4 bg-gray-100 rounded"></div>
            <div
              :style="{ backgroundColor: settings.primaryColor, color: settings.navTextColor }"
              class="h-8 w-full rounded shadow-sm flex items-center justify-center text-[10px] font-bold"
            >
              Beispiel Button
            </div>
          </div>
          <p
            class="text-center text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-tighter"
          >
            Vorschau
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '@/api/client'

const isSaving = ref(false)
const uploading = ref(false)

const settings = ref({
  vereinName: 'Vereinskasse',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  navTextColor: '#ffffff',
  logoPath: '',
  quickLogin: false, // Hinzugefügt
  pinLogin: false, // Hinzugefügt
})

const fetchSettings = async () => {
  try {
    const { data } = await apiClient.get('/api/settings')
    settings.value = data
  } catch (error) {
    console.error('Settings laden fehlgeschlagen')
  }
}

const getFullLogoUrl = (filename: string) => {
  if (!filename) return ''
  return `${apiClient.defaults.baseURL}/api/media/${filename}?width=200`
}

const handleLogoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  // 1. Wir holen uns die Datei in eine Konstante
  const file = target.files?.[0]

  // 2. Wir prüfen explizit: Wenn keine Datei da ist, brechen wir ab
  // TypeScript weiß ab hier: 'file' ist garantiert vom Typ 'File'
  if (!file) return

  const formData = new FormData()
  formData.append('file', file) // Jetzt ist TS zufrieden

  uploading.value = true
  try {
    const { data } = await apiClient.post('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    settings.value.logoPath = data.filename
  } catch (error) {
    alert('Upload fehlgeschlagen.')
  } finally {
    uploading.value = false
    // Optional: Input zurücksetzen, damit die gleiche Datei erneut gewählt werden kann
    target.value = ''
  }
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    await apiClient.put('/api/settings', settings.value)
    // Damit alle Navigationsleisten etc. die Änderungen sofort übernehmen
    globalThis.location.reload()
  } catch (error) {
    alert('Fehler beim Speichern.')
  } finally {
    isSaving.value = false
  }
}

onMounted(fetchSettings)
</script>

<style scoped>
/* Tooltip-Animation für weicheres Einblenden */
.group\/tooltip:hover div {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, 4px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
