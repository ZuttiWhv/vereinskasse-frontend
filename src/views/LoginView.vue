<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import apiClient from '@/api/client'

const authStore = useAuthStore()
const router = useRouter()
const error = ref('')

const isManualMode = ref(false)
const hasQuickLogin = ref(false)
const currentLevel = ref<any>(null)
const navigationHistory = ref<any[]>([])

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

const selectUser = (username: string) => {
  form.username = username
  isManualMode.value = true
  setTimeout(() => document.getElementById('password-field')?.focus(), 50)
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
          <button v-if="navigationHistory.length > 0" @click="goBack" class="back-link">
            ← Zurück
          </button>
          <span class="current-node">{{ currentLevel?.name }}</span>
        </div>

        <div class="selection-scroll-area">
          <div class="selection-grid">
            <button
              v-for="unit in currentLevel?.subUnits"
              :key="unit.id"
              @click="selectUnit(unit)"
              class="grid-item"
            >
              <span class="icon">📁</span> {{ unit.name }}
            </button>
            <button
              v-for="user in currentLevel?.usernames"
              :key="user"
              @click="selectUser(user)"
              class="grid-item"
            >
              <span class="icon">👤</span> {{ user }}
            </button>
          </div>
        </div>
      </div>

      <form v-else @submit.prevent="submit" class="login-form">
        <div class="input-group">
          <label>Nutzername</label>
          <input v-model="form.username" placeholder="Dein Name" required />
        </div>
        <div class="input-group">
          <label>Passwort</label>
          <input
            id="password-field"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>
        <button type="submit" :disabled="authStore.isLoading" class="btn-login">
          {{ authStore.isLoading ? 'Verbindung...' : 'Login' }}
        </button>
      </form>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div v-if="hasQuickLogin" class="mode-switch">
        <button @click="isManualMode = !isManualMode" class="btn-switch">
          {{ isManualMode ? 'Zur Schnellauswahl' : 'Manuelle Anmeldung' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Zurück zum Original: Nur Zentrierung im Content-Bereich */
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
  /* WICHTIG: Begrenzt die Höhe der Box, egal wie viel Inhalt kommt */
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
