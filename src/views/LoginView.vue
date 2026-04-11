<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const error = ref('')

const form = reactive({
  username: '',
  password: '',
})

async function submit() {
  try {
    await authStore.login(form)
    router.push('/')
  } catch (e) {
    error.value = 'Anmeldung fehlgeschlagen'
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Willkommen</h1>
      <p class="subtitle">Bitte melde dich an, um fortzufahren</p>

      <form @submit.prevent="submit" class="login-form">
        <div class="input-group">
          <label>Nutzername</label>
          <input v-model="form.username" placeholder="Dein Name" required />
        </div>

        <div class="input-group">
          <label>Passwort</label>
          <input v-model="form.password" type="password" placeholder="••••••••" required />
        </div>

        <button type="submit" :disabled="authStore.isLoading" class="btn-login">
          {{ authStore.isLoading ? 'Verbindung...' : 'Login' }}
        </button>

        <p v-if="error" class="error-msg">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Das Geheimnis der Zentrierung */
.login-container {
  display: flex;
  justify-content: center; /* Horizontal zentrieren */
  align-items: center; /* Vertikal zentrieren */
  min-height: 20vh; /* Gesamte Bildschirmhöhe */
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

h1 {
  margin-bottom: 0.5rem;
  color: #2d3748;
}

.subtitle {
  color: #718096;
  margin-bottom: 2rem;
  font-size: 0.9rem;
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
  transition: border-color 0.2s;
}

input:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.btn-login {
  background: #3182ce;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-login:hover {
  background: #2b6cb0;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #e53e3e;
  background: #fff5f5;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
}
</style>