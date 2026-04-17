<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <header
      class="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Geräte-Zertifikate (mTLS)</h1>
        <p class="text-sm text-gray-500">
          Erstelle neue Zertifikate für Terminals oder lade das Root-Zertifikat herunter.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="downloadRootCA"
          class="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition"
          title="Root-CA für Browser-Vertrauen importieren"
        >
          🛡️ Root-CA laden
        </button>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="showCert"
          class="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition"
          title="Zertifikatdetails in Konsole ausgeben"
        >
          🛡️ Zertifikatdetails in Konsole ausgeben
        </button>
      </div>
    </header>

    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-end gap-4">
      <div class="flex-1">
        <label for="device-name" class="block text-sm font-medium text-gray-700 mb-1">
          Neues Terminal registrieren
        </label>
        <input
          id="device-name"
          v-model="newDeviceName"
          type="text"
          placeholder="z.B. Kasse-Foyer oder Raspberry-Pi-1"
          class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          @keyup.enter="registerDevice"
        />
      </div>
      <button
        @click="registerDevice"
        :disabled="!newDeviceName || isGenerating"
        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
      >
        <span v-if="isGenerating">⏳</span>
        <span v-else>➕</span>
        Zertifikat generieren
      </button>
    </div>

    <div
      class="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-4 text-sm text-amber-800"
    >
      <span class="text-xl">ℹ️</span>
      <div>
        <p class="font-bold">Hinweis zur Installation:</p>
        <p>
          Lade die <b>.p12-Datei</b> herunter und importiere sie auf dem Zielgerät im Browser. Das
          Passwort ist dein globales <b>SSL-Passwort</b>. Damit die Warnung im Browser verschwindet,
          muss zusätzlich die <b>Root-CA</b> als vertrauenswürdige Stammzertifizierungsstelle
          importiert werden.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import apiClient from '@/api/client'

const newDeviceName = ref('')
const isGenerating = ref(false)

/**
 * Registriert ein neues Gerät und löst sofort den Download der .p12 Datei aus
 */
const registerDevice = async () => {
  if (!newDeviceName.value) return

  isGenerating.value = true
  try {
    const response = await apiClient.post(
      '/api/devices/register',
      { name: newDeviceName.value }, // Das hier ist das JSON-Body-Objekt (DTO)
      { responseType: 'blob' }, // Die Optionen kommen erst als DRITTER Parameter
    )

    // Download-Link erzeugen
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `${newDeviceName.value}.p12`
    document.body.appendChild(link)
    link.click()
    link.remove()

    newDeviceName.value = '' // Input leeren
  } catch (error) {
    console.error('Fehler beim Generieren des Zertifikats:', error)
    alert('Das Zertifikat konnte nicht erstellt werden.')
  } finally {
    isGenerating.value = false
  }
}

const showCert = async () => {
  try {
    const response = await apiClient.get('/api/test-auth')
    console.log(response)
  } catch (e) {}
}

/**
 * Lädt den öffentlichen Teil der Root-CA herunter (.crt oder .pem)
 */
const downloadRootCA = async () => {
  try {
    const response = await apiClient.get('/api/devices/ca-public', {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `Vereinskasse_Root_CA.crt`
    link.click()
    link.remove()
  } catch (error) {
    console.error('Fehler beim Laden der Root-CA:', error)
  }
}
</script>
