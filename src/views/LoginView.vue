<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import apiClient from '@/api/client'
import Numpad from '@/components/Numpad.vue'

import { useKeyboardStore } from '@/stores/keyboard'
const kbStore = useKeyboardStore()

const openKb = (id: string, currentVal: string) => {
  kbStore.open(id, currentVal)
}

const authStore = useAuthStore()
const router = useRouter()
const error = ref('')

const isManualMode = ref(false)
const hasQuickLogin = ref(false)
const currentLevel = ref<any>(null)
const navigationHistory = ref<any[]>([])

// Auth States
const showPinModal = ref(false)
const isLoggingIn = ref(false) // Status für automatischen Passwordless-Login
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
 * Kernlogik: Der Weg des geringsten Widerstands
 * 1. Passwortlos (mTLS) ? -> Sofort Login
 * 2. PIN möglich? -> Zeige Numpad
 * 3. Sonst -> Manuelles Passwort
 */
const selectUser = async (username: string) => {
  selectedUsername.value = username
  error.value = ''
  isLoggingIn.value = true

  try {
    // SCHRITT 1: Prüfen auf Passwortlosen Login (mTLS)
    const { data: isPasswordlessPossible } = await apiClient.get(
      `/auth/passwordless/available/${username}`,
    )

    if (isPasswordlessPossible) {
      await handlePasswordlessLogin(username)
      return
    }

    // SCHRITT 2: Prüfen ob PIN-Login möglich ist
    const { data: isPinPossible } = await apiClient.get(`/auth/pin/available/${username}`)

    isLoggingIn.value = false
    if (isPinPossible) {
      pinValue.value = ''
      showPinModal.value = true
    } else {
      switchToManual(username)
    }
  } catch (e) {
    // Fallback auf Passwort bei Fehlern (z.B. 403 weil kein Trusted Device)
    isLoggingIn.value = false
    switchToManual(username)
  }
}

const handlePasswordlessLogin = async (username: string) => {
  try {
    // Ruft authStore.passwordlessLogin auf (muss dort POST /auth/passwordless/passwordless triggern)
    await authStore.passwordlessLogin(username)
    router.push('/')
  } catch (e) {
    isLoggingIn.value = false
    switchToManual(username)
  }
}

const switchToManual = (username: string) => {
  form.username = username
  isManualMode.value = true
  showPinModal.value = false
  // Kleiner Delay damit das Input-Feld gerendert ist
  setTimeout(() => {
    const el = document.getElementById('password-field')
    el?.focus()
  }, 100)
}

const handlePinComplete = async (pin: string) => {
  error.value = ''
  try {
    await authStore.pinLogin({
      username: selectedUsername.value,
      pin: pin,
    })
    showPinModal.value = false
    router.push('/')
  } catch (e: any) {
    pinValue.value = ''
    if (e.response?.status === 429) {
      error.value = 'Zu viele Versuche. Bitte warten.'
    } else {
      error.value = 'PIN falsch oder Anmeldung fehlgeschlagen.'
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

      <div v-if="isLoggingIn" class="auto-login-overlay">
        <div class="spinner"></div>
        <p>Prüfe Identität...</p>
      </div>

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

        <div class="pin-footer-actions">
          <button class="btn-abort" @click="switchToManual(selectedUsername)">
            Stattdessen mit Passwort anmelden
          </button>
          <button class="btn-close" @click="showPinModal = false">Abbrechen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ergänzende Styles für automatischen Login-Status */
.auto-login-overlay {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #4a5568;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.pin-footer-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

/* Bestehende Styles */
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
  font-size: 0.85rem;
  color: #3182ce;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.btn-close {
  padding: 0.5rem;
  color: #a0aec0;
  font-size: 0.8rem;
  background: none;
  border: none;
  cursor: pointer;
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
  min-height: 20vh;
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
}

.selection-scroll-area {
  max-height: 250px;
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
