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
              class="relative ml-2 dropdown-container"
              @mouseenter="isAdminMenuOpen = true"
              @mouseleave="isAdminMenuOpen = false"
            >
              <button
                class="nav-link flex items-center space-x-1 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-md transition-colors"
              >
                <span>Verwaltung</span>
                <span
                  class="text-[10px] opacity-60 transition-transform duration-200"
                  :class="{ 'rotate-180': isAdminMenuOpen }"
                  >▼</span
                >
              </button>

              <div
                class="dropdown-menu right-0 w-56 bg-white rounded-lg shadow-xl py-2 text-gray-800 border border-gray-100"
                :class="{ 'is-active': isAdminMenuOpen }"
              >
                <router-link
                  v-if="authStore.hasAuthority('WRITE_CATEGORY')"
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
                  v-if="authStore.hasAuthority('WRITE_OUS')"
                  to="/admin/ous"
                  class="drop-item"
                  @click="isAdminMenuOpen = false"
                  >Benutzerorganisation</router-link
                >
                <router-link
                  v-if="authStore.hasAuthority('WRITE_PRODUCT')"
                  to="/admin/products"
                  class="drop-item"
                  @click="isAdminMenuOpen = false"
                  >Produkte</router-link
                >
                <router-link
                  v-if="authStore.hasAuthority('WRITE_BILLING_GROUP')"
                  to="/admin/billinggroups"
                  class="drop-item"
                  @click="isAdminMenuOpen = false"
                  >Abrechnungsgruppen</router-link
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
                  >⚙️ Einstellungen</router-link
                >
              </div>
            </div>

            <div
              class="relative ml-2 dropdown-container"
              @mouseenter="isUserMenuOpen = true"
              @mouseleave="isUserMenuOpen = false"
            >
              <button
                class="flex items-center space-x-3 bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full border border-white/10 transition-colors"
              >
                <div class="flex flex-col items-end leading-tight hidden sm:flex">
                  <span class="text-[10px] font-bold opacity-70 uppercase tracking-widest"
                    >Saldo</span
                  >
                  <span class="text-sm font-mono font-bold">{{
                    formatCurrency(authStore.user?.balance ?? 0)
                  }}</span>
                </div>
                <div
                  class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg border border-white/20"
                >
                  👤
                </div>
              </button>

              <div
                class="dropdown-menu right-0 w-48 bg-white rounded-lg shadow-xl py-2 text-gray-800 border border-gray-100"
                :class="{ 'is-active': isUserMenuOpen }"
              >
                <div class="px-4 py-2 border-b mb-1">
                  <p class="text-xs text-gray-400 font-semibold uppercase">User</p>
                  <p class="text-sm font-bold truncate">{{ authStore.user?.username }}</p>
                </div>
                <router-link
                  to="/profile"
                  class="drop-item flex items-center space-x-2"
                  @click="isUserMenuOpen = false"
                >
                  <span>⚙️</span>
                  <span>Mein Profil</span>
                </router-link>
              </div>
            </div>

            <button
              @click="handleLogout"
              class="ml-2 p-2.5 bg-red-500/20 hover:bg-red-600 text-white rounded-full transition-all duration-200 border border-white/10 group"
              title="Sofort abmelden"
            >
              <span class="group-hover:scale-110 block transition-transform">🚪</span>
            </button>
          </template>

          <template v-else>
            <router-link to="/login" class="nav-link bg-white/10">Login</router-link>
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
      <p class="text-gray-500 text-xs tracking-wide">
        &copy; 2026 {{ settings.vereinName }} | <span class="font-semibold">Vereinskasse v2.0</span>
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

const settings = ref({
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  navTextColor: '#ffffff',
  vereinName: 'Vereinskasse',
  logoPath: '',
})

const isAdminMenuOpen = ref(false)
const isUserMenuOpen = ref(false)

const logoUrl = computed(() => {
  if (!settings.value.logoPath) return ''
  const baseUrl = apiClient.defaults.baseURL?.replace(/\/$/, '') || ''
  return `${baseUrl}/api/media/${settings.value.logoPath}?width=100`
})

const fetchSettings = async () => {
  try {
    const { data } = await apiClient.get('/api/settings')
    settings.value = data
    const root = document.documentElement
    root.style.setProperty('--primary-color', data.primaryColor)
    root.style.setProperty('--secondary-color', data.secondaryColor)
    root.style.setProperty('--nav-text-color', data.navTextColor)
    document.title = data.vereinName
  } catch (error) {
    console.error('Settings load fail', error)
  }
}

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

const handleLogout = () => {
  isUserMenuOpen.value = false
  isAdminMenuOpen.value = false
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
/* CSS VARIABLEN */
:root {
  --primary-color: #2563eb;
  --secondary-color: #1e40af;
  --nav-text-color: #ffffff;
}

/* NAVBAR BASIS */
.custom-nav {
  background-color: var(--primary-color);
}

/* DROPDOWN LOGIK */
.dropdown-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  margin-top: 0.5rem;
  z-index: 100;
  display: none;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.2s ease-out;
  pointer-events: none;
}

.dropdown-menu.is-active {
  display: block;
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* Brücke für Hover-Stabilität */
.dropdown-container::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  height: 0.6rem;
}

/* ITEMS */
.nav-link {
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--nav-text-color);
  transition: background 0.2s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.nav-link-active {
  background-color: rgba(0, 0, 0, 0.2) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.drop-item {
  display: block;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #374151;
  text-decoration: none;
  transition: all 0.15s;
}

.drop-item:hover {
  background-color: #f8fafc;
  color: var(--primary-color);
  padding-left: 1.25rem;
}

/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* SCROLLBAR FIX */
body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
