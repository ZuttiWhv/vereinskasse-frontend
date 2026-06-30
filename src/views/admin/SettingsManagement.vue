<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-gray-800">Design & Einstellungen</h1>
      <p class="text-sm text-gray-500">Passe das Erscheinungsbild deiner Vereinskasse an.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-2 space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 class="text-lg font-semibold border-b pb-2 text-emerald-700">Login & Struktur</h2>

          <div class="space-y-6">
            <div class="flex items-center justify-between group">
              <div class="flex flex-col grow">
                <span class="font-medium text-gray-700">Vereinfachtes Login (Quick-Login)</span>
                <p class="text-xs text-gray-500">Schnellauswahl von Abteilungen und Namen.</p>
              </div>
              <button
                type="button"
                aria-label="Quick-Login umschalten"
                @click="settings.quickLogin = !settings.quickLogin"
                :class="settings.quickLogin ? 'bg-emerald-500' : 'bg-gray-300'"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              >
                <span
                  :class="settings.quickLogin ? 'translate-x-6' : 'translate-x-1'"
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                />
              </button>
            </div>

            <div
              v-if="settings.quickLogin"
              class="pl-4 border-l-2 border-emerald-500/30 space-y-3 animate-fade-in"
            >
              <label for="fontsizeInput" class="block text-sm font-medium text-gray-700">
                Schriftgröße im Quick-Login
              </label>
              <div class="flex items-center gap-3">
                <select
                  id="fontsizeSelect"
                  aria-label="Vordefinierte Schriftgröße wählen"
                  :value="
                    [16, 24, 32].includes(settings.fontsizeQuickLogin)
                      ? settings.fontsizeQuickLogin
                      : 'custom'
                  "
                  @change="
                    ($event) => {
                      const val = ($event.target as HTMLSelectElement).value
                      if (val !== 'custom') settings.fontsizeQuickLogin = parseInt(val)
                    }
                  "
                  class="px-3 py-2 border rounded-lg bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option :value="16">Normal (16px)</option>
                  <option :value="24">Groß (24px)</option>
                  <option :value="32">Extra Groß (32px)</option>
                  <option value="custom">Eigener Wert...</option>
                </select>

                <div class="flex items-center gap-1.5">
                  <input
                    id="fontsizeInput"
                    v-model.number="settings.fontsizeQuickLogin"
                    :class="{ 'input-keyboard-active': kbStore.activeInputId === 'fontsizeInput' }"
                    @focus="
                      kbStore.open('fontsizeInput', String(settings.fontsizeQuickLogin), 'default')
                    "
                    type="number"
                    min="12"
                    max="100"
                    class="w-20 px-3 py-2 border rounded-lg text-sm text-center font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span class="text-sm text-gray-500 font-medium">px</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex flex-col grow">
                <span class="font-medium text-gray-700">PIN-Login erlauben</span>
                <p class="text-xs text-gray-500">Identifikation via 4- bis 6-stelliger PIN.</p>
              </div>
              <button
                type="button"
                aria-label="PIN-Login umschalten"
                @click="settings.pinLogin = !settings.pinLogin"
                :class="settings.pinLogin ? 'bg-emerald-500' : 'bg-gray-300'"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              >
                <span
                  :class="settings.pinLogin ? 'translate-x-6' : 'translate-x-1'"
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                />
              </button>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex flex-col grow">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-700">Barcode-Scanner Login</span>
                  <span
                    class="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                    >Neu</span
                  >
                </div>
                <p class="text-xs text-gray-500">Erlaubt Login via Barcode oder RFID-Chip.</p>
              </div>
              <button
                type="button"
                aria-label="Barcode-Login umschalten"
                @click="settings.allowBarcodeLogin = !settings.allowBarcodeLogin"
                :class="settings.allowBarcodeLogin ? 'bg-emerald-500' : 'bg-gray-300'"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              >
                <span
                  :class="settings.allowBarcodeLogin ? 'translate-x-6' : 'translate-x-1'"
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                />
              </button>
            </div>

            <div class="pt-4 border-t border-gray-50">
              <div class="flex items-center justify-between">
                <div class="flex flex-col grow">
                  <span class="font-medium text-gray-700">User ohne Gruppe (OU)</span>
                  <p class="text-xs text-gray-500">
                    {{
                      settings.showUserWithoutOuAsUser
                        ? 'Als einzelne Benutzer anzeigen'
                        : 'In Sammel-OU anzeigen'
                    }}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Darstellung User ohne Gruppe umschalten"
                  @click="settings.showUserWithoutOuAsUser = !settings.showUserWithoutOuAsUser"
                  :class="settings.showUserWithoutOuAsUser ? 'bg-emerald-500' : 'bg-gray-300'"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                >
                  <span
                    :class="settings.showUserWithoutOuAsUser ? 'translate-x-6' : 'translate-x-1'"
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  />
                </button>
              </div>
            </div>

            <div class="pt-4 border-t border-gray-50">
              <div class="flex items-center justify-between">
                <div class="flex flex-col grow">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">Passwortloser Login (mTLS)</span>
                    <span
                      class="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                      >Sicherheitskritisch</span
                    >
                  </div>
                  <p class="text-xs text-gray-500">Login rein über Zertifikat ohne Abfrage.</p>
                </div>
                <button
                  type="button"
                  aria-label="Passwortloser Login umschalten"
                  @click="settings.passwordlessLogin = !settings.passwordlessLogin"
                  :class="settings.passwordlessLogin ? 'bg-emerald-500' : 'bg-gray-300'"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                >
                  <span
                    :class="settings.passwordlessLogin ? 'translate-x-6' : 'translate-x-1'"
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  />
                </button>
              </div>
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
            <div class="grow space-y-2">
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
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 class="text-lg font-semibold border-b pb-2 text-emerald-700">Branding & Farben</h2>
          <div>
            <label for="nameInput" class="block text-sm font-medium text-gray-700 mb-1"
              >Vereinsname</label
            >
            <input
              id="nameInput"
              v-model="settings.vereinName"
              :class="{ 'input-keyboard-active': kbStore.activeInputId === 'nameInput' }"
              @focus="kbStore.open('nameInput', settings.vereinName, 'default')"
              type="text"
              class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label for="primaryColorPicker" class="block text-sm font-medium text-gray-700 mb-1"
                >Primärfarbe</label
              >
              <div class="flex gap-2">
                <input
                  id="primaryColorPicker"
                  v-model="settings.primaryColor"
                  type="color"
                  class="h-10 w-12 cursor-pointer border-none rounded"
                />
                <input
                  id="primaryColortxt"
                  v-model="settings.primaryColor"
                  @focus="kbStore.open('primaryColortxt', settings.primaryColor, 'default')"
                  :class="{ 'input-keyboard-active': kbStore.activeInputId === 'primaryColortxt' }"
                  type="text"
                  class="grow px-2 py-2 border rounded-lg text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <label for="secondaryColorPicker" class="block text-sm font-medium text-gray-700 mb-1"
                >Sekundärfarbe</label
              >
              <div class="flex gap-2">
                <input
                  id="secondaryColorPicker"
                  v-model="settings.secondaryColor"
                  type="color"
                  class="h-10 w-12 cursor-pointer border-none rounded"
                />
                <input
                  id="secondaryColortxt"
                  v-model="settings.secondaryColor"
                  @focus="kbStore.open('secondaryColortxt', settings.secondaryColor)"
                  :class="{
                    'input-keyboard-active': kbStore.activeInputId === 'secondaryColortxt',
                  }"
                  type="text"
                  class="grow px-2 py-2 border rounded-lg text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <label for="navTextColorPicker" class="block text-sm font-medium text-gray-700 mb-1"
                >Nav Textfarbe</label
              >
              <div class="flex gap-2">
                <input
                  id="navTextColorPicker"
                  v-model="settings.navTextColor"
                  type="color"
                  class="h-10 w-12 cursor-pointer border-none rounded"
                />
                <input
                  id="navTextColor"
                  v-model="settings.navTextColor"
                  @focus="kbStore.open('navTextColor', settings.navTextColor)"
                  :class="{ 'input-keyboard-active': kbStore.activeInputId === 'navTextColor' }"
                  type="text"
                  class="grow px-2 py-2 border rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="saveSettings"
            :disabled="isSaving || uploading"
            class="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold shadow-md disabled:opacity-50"
          >
            {{ isSaving ? 'Speichert...' : 'Design speichern' }}
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-800 sticky top-4">Live-Vorschau</h2>
        <div
          class="bg-gray-50 border rounded-xl p-4 pointer-events-none border-dashed border-gray-300 sticky top-14"
        >
          <!-- Header der App -->
          <div
            :style="{ backgroundColor: settings.primaryColor, color: settings.navTextColor }"
            class="h-12 rounded-t-lg flex items-center px-3 shadow-sm transition-all duration-500"
          >
            <img
              v-if="settings.logoPath"
              :src="getFullLogoUrl(settings.logoPath)"
              class="h-6 mr-2"
              alt="Logo Vorschau"
            />
            <div v-else class="w-6 h-6 bg-white/20 rounded-full mr-2"></div>
            <div class="text-xs font-bold truncate">{{ settings.vereinName }}</div>
          </div>

          <!-- Hauptinhalt der App-Vorschau -->
          <div class="bg-white p-4 space-y-4 rounded-b-lg border-x border-b">
            <!-- FALL A: Quick-Login ist AKTIV -> Zeige die Kacheln mit der konfigurierten Schriftgröße -->
            <div v-if="settings.quickLogin" class="space-y-2">
              <span class="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider"
                >Quick-Login Auswahl</span
              >
              <div class="grid grid-cols-2 gap-2">
                <div
                  :style="{
                    borderColor: settings.primaryColor + '30',
                    fontSize: settings.fontsizeQuickLogin + 'px',
                  }"
                  class="border-2 rounded-lg p-3 text-center font-bold text-gray-800 bg-gray-50/50 shadow-sm transition-all duration-200 line-clamp-1 flex items-center justify-center min-h-[4rem]"
                >
                  Abteilung 1
                </div>
                <div
                  :style="{
                    borderColor: settings.primaryColor + '30',
                    fontSize: settings.fontsizeQuickLogin + 'px',
                  }"
                  class="border-2 rounded-lg p-3 text-center font-bold text-gray-800 bg-gray-50/50 shadow-sm transition-all duration-200 line-clamp-1 flex items-center justify-center min-h-[4rem]"
                >
                  Mustermann
                </div>
              </div>
            </div>

            <!-- FALL B: Quick-Login ist DEAKTIVIERT -> Zeige das Standard-Layout -->
            <div v-else class="space-y-2">
              <div class="h-3 w-3/4 bg-gray-100 rounded"></div>
              <div class="h-3 w-1/2 bg-gray-100 rounded"></div>
            </div>

            <!-- Globaler Button (nutzt die Primärfarbe) -->
            <div
              :style="{ backgroundColor: settings.primaryColor, color: settings.navTextColor }"
              class="h-8 w-full rounded shadow-sm flex items-center justify-center text-[10px] font-bold"
            >
              Beispiel Button
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '@/api/client'
import { useKeyboardStore } from '@/stores/keyboard'

const kbStore = useKeyboardStore()
const isSaving = ref(false)
const uploading = ref(false)

const settings = ref({
  vereinName: 'Vereinskasse',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  navTextColor: '#ffffff',
  logoPath: '',
  quickLogin: false,
  pinLogin: false,
  passwordlessLogin: false,
  allowBarcodeLogin: false,
  showUserWithoutOuAsUser: true,
  fontsizeQuickLogin: 24, // NEU: Entspricht dem DB-Default-Wert 24
})

const fetchSettings = async () => {
  try {
    const { data } = await apiClient.get('/api/settings')
    settings.value = data
  } catch (error) {
    console.error('Settings laden fehlgeschlagen:', error)
  }
}

const getFullLogoUrl = (filename: string) => {
  if (!filename) return ''
  return `${apiClient.defaults.baseURL}/api/media/${filename}?width=200`
}

const handleLogoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)
  uploading.value = true
  try {
    const { data } = await apiClient.post('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    settings.value.logoPath = data.filename
  } catch (error) {
    console.error('Upload Error:', error)
    alert('Upload fehlgeschlagen.')
  } finally {
    uploading.value = false
    target.value = ''
  }
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    await apiClient.put('/api/settings', settings.value)
    globalThis.location.reload()
  } catch (error) {
    console.error('Save Error:', error)
    alert('Fehler beim Speichern.')
  } finally {
    isSaving.value = false
  }
}

onMounted(fetchSettings)
</script>

<style scoped>
/* Kleine Animation beim Einblenden der Schriftgrößenoption */
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
