<template>
  <nav class="custom-nav text-white shadow-md w-full relative z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex-shrink-0 flex items-center">
          <router-link to="/" class="flex items-center space-x-3 group">
            <img
              v-if="settings.logoPath"
              :src="logoUrl"
              class="h-10 w-auto object-contain"
              alt="Logo"
            />
            <span v-else class="text-2xl">🍺</span>
            <span class="font-bold text-xl tracking-tight hidden sm:block">
              {{ settings.vereinName }}
            </span>
          </router-link>
        </div>

        <div class="flex items-center space-x-2">
          <template v-if="authStore.isAuthenticated">
            <router-link to="/" class="nav-link" active-class="nav-link-active"
              >Dashboard</router-link
            >
            <router-link
              v-if="authStore.hasAuthority('READ_OWN_SALES')"
              to="/sales-history"
              class="nav-link"
              active-class="nav-link-active"
            >
              Abrechnung
            </router-link>

            <div
              v-if="isAdmin"
              class="relative ml-2"
              @mouseenter="isAdminMenuOpen = true"
              @mouseleave="isAdminMenuOpen = false"
            >
              <button
                @click="isAdminMenuOpen = !isAdminMenuOpen"
                class="nav-link flex items-center space-x-1 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-md"
              >
                <span>Verwaltung</span>
                <span
                  class="text-xs opacity-50 transition-transform"
                  :class="{ 'rotate-180': isAdminMenuOpen }"
                  >▼</span
                >
              </button>

              <div
                class="absolute right-0 w-56 bg-white rounded-lg shadow-xl py-2 text-gray-800 border border-gray-100 transition-all duration-200"
                :class="[
                  isAdminMenuOpen
                    ? 'block opacity-100 translate-y-0'
                    : 'hidden opacity-0 -translate-y-2',
                ]"
              >
                <div class="absolute -top-2 left-0 right-0 h-2"></div>

                <router-link
                  v-if="authStore.hasAuthority(['WRITE_CATEGORY'])"
                  to="/admin/categories"
                  class="drop-item"
                  @click="isAdminMenuOpen = false"
                  >Kategorien</router-link
                >
                <router-link
                  v-if="authStore.hasAuthority('WRITE_ROLE')"
                  to="/admin/roles"
                  class="drop-item"
                  @click="isAdminMenuOpen = false"
                  >Rollen & Rechte</router-link
                >
                <router-link
                  v-if="authStore.hasAuthority('WRITE_PRODUCT')"
                  to="/admin/products"
                  class="drop-item"
                  @click="isAdminMenuOpen = false"
                  >Produkte</router-link
                >
                <router-link
                  v-if="authStore.hasAuthority('WRITE_DEVICE')"
                  to="/admin/devices"
                  class="drop-item"
                  @click="isAdminMenuOpen = false"
                  >Geräteverwaltung</router-link
                >
                <router-link
                  v-if="authStore.hasAuthority('WRITE_USER')"
                  to="/admin/users"
                  class="drop-item"
                  @click="isAdminMenuOpen = false"
                  >Nutzerverwaltung</router-link
                >
                <div class="border-t my-1"></div>
                <router-link
                  v-if="authStore.hasAuthority('READ_ALL_BALANCES')"
                  to="/admin/balances"
                  class="drop-item font-semibold text-emerald-600"
                  @click="isAdminMenuOpen = false"
                  >📊 Monatsabschluss</router-link
                >
                <router-link
                  v-if="authStore.hasAuthority('WRITE_SETTINGS')"
                  to="/admin/settings"
                  class="drop-item"
                  @click="isAdminMenuOpen = false"
                  >⚙️ Design-Setup</router-link
                >
              </div>
            </div>

            <div class="flex items-center space-x-3 ml-4">
              <div class="balance-badge whitespace-nowrap">
                {{ formatCurrency(authStore.user?.balance ?? 0) }}
              </div>
              <button
                @click="handleLogout"
                class="p-2 hover:bg-red-600 rounded-full transition-colors title='Abmelden'"
              >
                🚪
              </button>
            </div>
          </template>

          <template v-else>
            <router-link to="/login" class="nav-link">Login</router-link>
          </template>
        </div>
      </div>
    </div>
  </nav>

  <main class="flex-grow w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>

  <footer class="bg-white py-6 border-t border-gray-200 mt-auto">
    <div class="max-w-7xl mx-auto px-4 text-center">
      <p class="text-gray-500 text-xs">
        &copy; 2026 {{ settings.vereinName }} via Vereinskasse | Dein Durst, dein Verein.
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import apiClient from '@/api/client'

const authStore = useAuthStore()
const router = useRouter()

// --- SETTINGS LOGIK ---
const settings = ref({
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  navTextColor: '#ffffff', // WICHTIG: Hier ergänzt
  vereinName: 'Vereinskasse',
  logoPath: '',
})

const isAdminMenuOpen = ref(false)

const logoUrl = computed(() => {
  if (!settings.value.logoPath) return ''
  // Sicherstellen, dass keine doppelten Slashes entstehen
  const baseUrl = apiClient.defaults.baseURL?.replace(/\/$/, '') || ''
  return `${baseUrl}/api/media/${settings.value.logoPath}?width=100`
})

const fetchSettings = async () => {
  try {
    const { data } = await apiClient.get('/api/settings')

    // DER ENTSCHEIDENDE FIX: Die Daten müssen in das ref geschrieben werden!
    settings.value = data

    // CSS Variablen für das globale Styling setzen
    const root = document.documentElement
    root.style.setProperty('--primary-color', data.primaryColor)
    root.style.setProperty('--secondary-color', data.secondaryColor)
    root.style.setProperty('--nav-text-color', data.navTextColor)

    // Seitentitel im Browsertab anpassen
    document.title = data.vereinName
  } catch (error) {
    console.error('Konnte Einstellungen nicht laden, nutze Defaults', error)
  }
}

// Kleine Hilfsvariable für das Template
const isAdmin = computed(() => {
  return authStore.hasAuthority([
    'WRITE_CATEGORY',
    'WRITE_ROLE',
    'WRITE_PRODUCT',
    'WRITE_USER',
    'READ_ALL_BALANCES',
    'WRITE_SETTINGS',
  ])
})

// --- STANDARD LOGIK ---
const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

onMounted(fetchSettings)
</script>

<style>
/* CSS VARIABLEN & GLOBALER RESET */
:root {
  --primary-color: #2563eb;
  --secondary-color: #1e40af;
  --nav-text-color: #ffffff;
}

.custom-nav {
  background-color: var(--primary-color);
  color: var(--nav-text-color) !important; /* Wendet die Farbe auf die Nav an */
}

body {
  margin: 0;
  padding: 0;
}

/* Ergänze diese Klassen für das Dropdown */
.drop-item {
  display: block;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #374151;
  transition: background-color 0.2s;
}

.drop-item:hover {
  background-color: #f3f4f6;
  color: var(--primary-color);
}

.nav-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-link {
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  color: var(--nav-text-color);
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link-active {
  background-color: rgba(0, 0, 0, 0.2) !important;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.balance-badge {
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.375rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
}

/* ÜBERSCHREIBEN VON TAILWIND FARBEN WO NÖTIG */
.text-blue-600 {
  color: var(--primary-color) !important;
}
.bg-blue-600 {
  background-color: var(--primary-color) !important;
}
.bg-blue-500 {
  background-color: var(--primary-color) !important;
  opacity: 0.9;
}

/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
