<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import apiClient from '@/api/client'
import Numpad from '@/components/Numpad.vue' // Pfad anpassen

import { useKeyboardStore } from '@/stores/keyboard'
const kbStore = useKeyboardStore()

// Hilfsfunktion zum Öffnen
const openKb = (id, currentVal) => {
  kbStore.open(id, currentVal)
}

const authStore = useAuthStore()
const router = useRouter()
const error = ref('')

const isManualMode = ref(false)
const hasQuickLogin = ref(false)
const currentLevel = ref<any>(null)
const navigationHistory = ref<any[]>([])

// PIN-Login States
const showPinModal = ref(false)
const pinValue = ref('')
const selectedUsername = ref('')

const form = reactive({
  username: '',
  password: '',
})

const checkQuickLogin = async () => {
  try {
    const { data: settings } = await apiClient.get('/api/settings')
    if (settings.quickLogin) {
      const { data: tree } = await apiClient.get('/api/org-units/tree')
      if (tree && tree.length > 0) {
        currentLevel.value = { subUnits: tree, usernames: [], name: 'Start' }
        hasQuickLogin.value = true
      }
    }
  } catch (e) {
    isManualMode.value = true
  }
}

const selectUnit = (unit: any) => {
  navigationHistory.value.push({ ...currentLevel.value })
  currentLevel.value = unit
}

const goBack = () => {
  if (navigationHistory.value.length > 0) {
    currentLevel.value = navigationHistory.value.pop()
  }
}

/**
 * Kernlogik: Prüfen ob PIN möglich, sonst Passwort
 */
const selectUser = async (username: string) => {
  selectedUsername.value = username
  error.value = ''

  try {
    // 1. Prüfen ob PIN-Login für diesen User & dieses Gerät möglich ist
    const { data: isPinPossible } = await apiClient.get(`/auth/pin/available/${username}`)

    if (isPinPossible) {
      pinValue.value = ''
      showPinModal.value = true
    } else {
      switchToManual(username)
    }
  } catch (e) {
    // Falls mTLS fehlt oder Endpoint nicht erreichbar -> Fallback auf Passwort
    switchToManual(username)
  }
}

const switchToManual = (username: string) => {
  form.username = username
  isManualMode.value = true
  showPinModal.value = false
  setTimeout(() => document.getElementById('password-field')?.focus(), 50)
}

/**
 * Führt den PIN-Login aus, sobald das Numpad "complete" meldet
 */
const handlePinComplete = async (pin: string) => {
  error.value = ''
  try {
    // Wir rufen die neue Methode im Store auf
    // Diese kümmert sich um: Token speichern, Header setzen, Profil laden
    await authStore.pinLogin({
      username: selectedUsername.value,
      pin: pin,
    })

    // Wenn wir hier ankommen, war alles erfolgreich (inkl. fetchProfile)
    showPinModal.value = false
    router.push('/')
  } catch (e: any) {
    pinValue.value = '' // PIN zurücksetzen bei Fehler

    if (e.response?.status === 429) {
      error.value = 'Zu viele Versuche. Bitte warten.'
    } else if (e.response?.status === 403) {
      error.value = 'Gerät nicht autorisiert oder PIN falsch.'
    } else {
      error.value = 'Anmeldung fehlgeschlagen.'
    }
  }
}
async function submit() {
  try {
    await authStore.login(form)
    router.push('/')
  } catch (e) {
    error.value = 'Anmeldung fehlgeschlagen'
  }
}

onMounted(checkQuickLogin)
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Willkommen</h1>
      <p class="subtitle">
        {{ isManualMode ? 'Bitte melde dich an' : 'Schnellauswahl nutzen' }}
      </p>

      <div v-if="!isManualMode && hasQuickLogin" class="quick-login-content">
        <div class="tree-nav">
          <button v-if="navigationHistory.length > 0" class="back-link" @click="goBack">
            ← Zurück
          </button>
          <span class="current-node">{{ currentLevel?.name }}</span>
        </div>

        <div class="selection-scroll-area">
          <div class="selection-grid">
            <button
              v-for="unit in currentLevel?.subUnits"
              :key="unit.id"
              class="grid-item"
              @click="selectUnit(unit)"
            >
              <span class="icon">📁</span> {{ unit.name }}
            </button>
            <button
              v-for="user in currentLevel?.usernames"
              :key="user"
              class="grid-item"
              @click="selectUser(user)"
            >
              <span class="icon">👤</span> {{ user }}
            </button>
          </div>
        </div>
      </div>

      <form v-else class="login-form" @submit.prevent="submit">
        <div class="input-group">
          <label>Nutzername</label>
          <input
            id="username-field"
            v-model="form.username"
            placeholder="Dein Name"
            required
            @focus="openKb('username-field', form.username)"
          />
        </div>
        <div class="input-group">
          <label>Passwort</label>
          <input
            id="password-field"
            v-model="form.password"
            placeholder="••••••••"
            required
            type="password"
            @focus="openKb('password-field', form.password)"
          />
        </div>
        <button :disabled="authStore.isLoading" class="btn-login" type="submit">
          {{ authStore.isLoading ? 'Verbindung...' : 'Login' }}
        </button>
      </form>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div v-if="hasQuickLogin" class="mode-switch">
        <button class="btn-switch" @click="isManualMode = !isManualMode">
          {{ isManualMode ? 'Zur Schnellauswahl' : 'Manuelle Anmeldung' }}
        </button>
      </div>
    </div>

    <div v-if="showPinModal" class="pin-overlay">
      <div class="pin-modal animate-pop">
        <h3>Hallo {{ selectedUsername }}</h3>
        <p>Gib deine PIN ein</p>

        <Numpad v-model="pinValue" :maxLength="6" @complete="handlePinComplete" />

        <button class="btn-abort" @click="switchToManual(selectedUsername)">
          Doch mit Passwort anmelden
        </button>
        <button class="btn-close" @click="showPinModal = false">Abbrechen</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pin-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.pin-modal {
  background: white;
  padding: 2rem;
  border-radius: 24px;
  width: 100%;
  max-width: 360px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.pin-modal h3 {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.pin-modal p {
  color: #718096;
  margin-bottom: 1.5rem;
}

.btn-abort {
  margin-top: 1.5rem;
  font-size: 0.85rem;
  color: #3182ce;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.btn-close {
  display: block;
  width: 100%;
  margin-top: 1rem;
  padding: 0.5rem;
  color: #a0aec0;
  font-size: 0.8rem;
}

.animate-pop {
  animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 20vh; /* Exakt dein Originalwert */
  padding: 1rem;
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 400px;
  text-align: center;
  display: flex;
  flex-direction: column;
}

/* Der Baum darf scrollen, damit die Karte nicht nach unten abhaut */

.selection-scroll-area {
  max-height: 250px; /* Begrenzt die Höhe der Schnellauswahl */
  overflow-y: auto;
  margin: 1rem 0;
  padding-right: 5px;
}

.selection-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
}

.icon {
  margin-bottom: 4px;
  font-size: 1.2rem;
}

/* Originale Form Styles (Unverändert) */

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  text-align: left;
}

.input-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
}

.btn-login {
  background: #3182ce;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}

/* Header & Subtitle */
h1 {
  margin-bottom: 0.5rem;
  color: #2d3748;
  font-size: 1.8rem;
}

.subtitle {
  color: #718096;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.tree-nav {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 0.85rem;
}

.back-link {
  background: none;
  border: none;
  color: #3182ce;
  cursor: pointer;
  padding: 0;
}

.mode-switch {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #edf2f7;
}

.btn-switch {
  background: none;
  border: none;
  color: #718096;
  font-size: 0.8rem;
  cursor: pointer;
  text-decoration: underline;
}

.error-msg {
  color: #e53e3e;
  background: #fff5f5;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-top: 1rem;
}
</style>
