<template>
  <div class="login-container">
    <div v-if="isBarcodeEnabled" class="barcode-status">
      <span class="status-dot"></span> Barcode-Scanner aktiv
    </div>

    <div class="login-card" :class="{ 'quick-login-wide': !isManualMode && hasQuickLogin }">
      <h1>Willkommen</h1>
      <p class="subtitle">{{ isManualMode ? 'Bitte melde dich an' : 'Schnellauswahl nutzen' }}</p>

      <div v-if="isLoggingIn" class="auto-login-overlay">
        <div class="spinner"></div>
        <p>Prüfe Identität...</p>
      </div>

      <div v-if="!isManualMode && hasQuickLogin && !isLoggingIn" class="quick-login-content">
        <div class="tree-nav">
          <button v-if="navigationHistory.length > 0" class="back-link" @click="goBack">
            ← Zurück
          </button>
          <span class="current-node">{{ currentLevel?.name }}</span>
        </div>

        <div class="selection-scroll-area">
          <div class="selection-grid">
            <button
              v-for="item in currentLevel?.subUnits"
              :key="item.id || item.name"
              class="grid-item"
              :class="{ 'user-item': item.isUser }"
              @click="handleItemClick(item)"
            >
              <span class="icon">{{ item.isUser ? '👤' : '📁' }}</span>
              {{ item.name }}
            </button>

            <button
              v-for="user in currentLevel?.usernames"
              :key="user"
              class="grid-item user-item"
              @click="selectUser(user)"
            >
              <span class="icon">👤</span> {{ user }}
            </button>
          </div>
        </div>
      </div>

      <form v-else-if="!isLoggingIn" class="login-form" @submit.prevent="submit">
        <div class="input-group">
          <label for="username-field">Nutzername</label>
          <input
            id="username-field"
            v-model="form.username"
            required
            :class="{ 'input-keyboard-active': kbStore.activeInputId === 'username-field' }"
            @focus="openKb('username-field', form.username)"
          />
        </div>
        <div class="input-group">
          <label for="password-field">Passwort</label>
          <input
            id="password-field"
            v-model="form.password"
            required
            type="password"
            @focus="openKb('password-field', form.password)"
            :class="{ 'input-keyboard-active': kbStore.activeInputId === 'password-field' }"
          />
        </div>
        <button :disabled="authStore.isLoading" class="btn-login" type="submit">Login</button>
      </form>

      <p v-if="error" class="error-msg">{{ error }}</p>
      <div v-if="hasQuickLogin && !isLoggingIn" class="mode-switch">
        <button class="btn-switch" @click="isManualMode = !isManualMode">
          {{ isManualMode ? 'Zur Schnellauswahl' : 'Manuelle Anmeldung' }}
        </button>
      </div>
    </div>

    <div v-if="showPinModal" class="pin-overlay">
      <div class="pin-modal animate-pop">
        <h3>Hallo {{ selectedUsername }}</h3>
        <Numpad v-model="pinValue" :maxLength="6" @complete="handlePinComplete" />
        <div class="pin-footer-actions">
          <button class="btn-abort" @click="switchToManual(selectedUsername)">
            Passwort nutzen
          </button>
          <button class="btn-close" @click="showPinModal = false">Abbrechen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import apiClient from '@/api/client'
import Numpad from '@/components/Numpad.vue'
import { useKeyboardStore } from '@/stores/keyboard'

const kbStore = useKeyboardStore()

// Typfehler-Prävention für den Store-Aufruf
const openKb = (id: string, currentVal: string) => {
  kbStore.open(id, 'default', currentVal)
}

const authStore = useAuthStore()
const router = useRouter()
const error = ref('')

const isManualMode = ref(false)
const hasQuickLogin = ref(false)
const currentLevel = ref<any>(null)
const navigationHistory = ref<any[]>([])

const showPinModal = ref(false)
const isLoggingIn = ref(false)
const pinValue = ref('')
const selectedUsername = ref('')

const isBarcodeEnabled = ref(false)
const barcodeBuffer = ref('')
const lastKeyTime = ref(0)

const handleBarcodeLogin = async (barcode: string) => {
  isLoggingIn.value = true
  error.value = ''
  try {
    const { data } = await apiClient.post('/auth/barcode/login', { barcode })
    authStore.setTokens(data)
    await authStore.fetchProfile()
    isLoggingIn.value = false
    router.push('/')
  } catch (e: any) {
    isLoggingIn.value = false
    error.value = e.response?.status === 403 ? 'Barcode-Login deaktiviert.' : 'Ungültiger Barcode.'
  }
}

const handleGlobalKeyDown = (event: KeyboardEvent) => {
  if (!isBarcodeEnabled.value) return
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
    return
  const currentTime = Date.now()
  if (currentTime - lastKeyTime.value > 50) {
    barcodeBuffer.value = ''
  }
  if (event.key === 'Enter') {
    if (barcodeBuffer.value.length > 2) {
      handleBarcodeLogin(barcodeBuffer.value)
    }
    barcodeBuffer.value = ''
  } else if (event.key.length === 1) {
    barcodeBuffer.value += event.key
  }
  lastKeyTime.value = currentTime
}

const checkQuickLogin = async () => {
  try {
    const { data: settings } = await apiClient.get('/api/settings')
    isBarcodeEnabled.value = settings.allowBarcodeLogin

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

const handleItemClick = (item: any) => {
  if (item.isUser) {
    selectUser(item.name)
  } else {
    navigationHistory.value.push({ ...currentLevel.value })
    currentLevel.value = item
  }
}

const goBack = () => {
  if (navigationHistory.value.length > 0) {
    currentLevel.value = navigationHistory.value.pop()
  }
}

const selectUser = async (username: string) => {
  selectedUsername.value = username
  error.value = ''
  isLoggingIn.value = true

  try {
    const { data: isPasswordlessPossible } = await apiClient.get(
      `/auth/passwordless/available/${username}`,
    )
    if (isPasswordlessPossible) {
      await handlePasswordlessLogin(username)
      return
    }

    const { data: isPinPossible } = await apiClient.get(`/auth/pin/available/${username}`)
    isLoggingIn.value = false
    if (isPinPossible) {
      pinValue.value = ''
      showPinModal.value = true
    } else {
      switchToManual(username)
    }
  } catch (e) {
    isLoggingIn.value = false
    switchToManual(username)
  }
}

const handlePasswordlessLogin = async (username: string) => {
  try {
    await authStore.passwordlessLogin(username)
    isLoggingIn.value = false
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
  setTimeout(() => {
    document.getElementById('password-field')?.focus()
  }, 100)
}

const handlePinComplete = async (pin: string) => {
  error.value = ''
  try {
    await authStore.pinLogin({ username: selectedUsername.value, pin })
    showPinModal.value = false
    router.push('/')
  } catch (e: any) {
    pinValue.value = ''
    error.value = e.response?.status === 429 ? 'Zu viele Versuche.' : 'PIN falsch.'
  }
}

const form = reactive({ username: '', password: '' })
async function submit() {
  try {
    await authStore.login(form)
    router.push('/')
  } catch (e) {
    error.value = 'Anmeldung fehlgeschlagen'
  }
}

// Event Listener sauber typisiert aufgesetzt
onMounted(() => {
  checkQuickLogin()
  globalThis.addEventListener('keydown', handleGlobalKeyDown)
})
onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleGlobalKeyDown)
})
</script>

<style scoped>
.user-item {
  background: #ebf8ff !important;
  border-color: #bee3f8 !important;
}

.barcode-status {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  color: #4a5568;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid #edf2f7;
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: #48bb78;
  border-radius: 50%;
  box-shadow: 0 0 0 rgba(72, 187, 120, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(72, 187, 120, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(72, 187, 120, 0);
  }
}

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
  min-height: 80vh; /* Erhöht, damit die Box vertikal besser zentriert sitzt */
  padding: 1rem;
  position: relative;
}

/* BASIS CARD DESIGN */
.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 400px;
  text-align: center;
  transition:
    max-width 0.3s ease-in-out,
    padding 0.3s ease-in-out; /* Weicher Übergang beim Modus-Wechsel */
}

/* NEU: WENN SCHNELLAUSWAHL AKTIV IST */
.login-card.quick-login-wide {
  max-width: 850px; /* Bietet massig Platz für Spalten */
  padding: 3rem;
}

/* OPTIMIERT FÜR MEHR INHALT */
.selection-scroll-area {
  max-height: 420px; /* Mehr Platz zum Scrollen auf großen Displays */
  overflow-y: auto;
  margin: 1.5rem 0;
  padding-right: 8px;
}

/* NEU: INTELLIGENTES GRID DAS SICH AN DIE BREITE ANPASST */
.selection-grid {
  display: grid;
  /* Erstellt automatisch so viele Spalten (min. 140px) wie reingehen */
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.2rem 0.8rem; /* Mehr vertikaler Platz für Icons */
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.grid-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background: #fff;
}

.icon {
  margin-bottom: 6px;
  font-size: 1.6rem; /* Größere, griffigere Icons */
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
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.back-link {
  background: none;
  border: none;
  color: #3182ce;
  cursor: pointer;
  padding: 0;
  font-weight: bold;
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
