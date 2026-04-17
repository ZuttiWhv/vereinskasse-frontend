import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 1. Erweiterung der Route-Meta-Typen
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    // Wir erlauben hier einen String ODER ein Array von Strings
    requiredAuthorities?: string | string[]
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/categories',
    name: 'category-management',
    component: () => import('@/views/admin/CategoryManagement.vue'),
    // HIER WAR DER FEHLER: Name muss zu RouteMeta passen
    meta: {
      requiresAuth: true,
      requiredAuthorities: ['WRITE_CATEGORY', 'DELETE_CATEGORY', 'READ_CATEGORY'],
    },
  },
  {
    path: '/admin/roles',
    name: 'role-management',
    component: () => import('@/views/admin/RoleManagement.vue'),
    meta: { requiresAuth: true, requiredAuthorities: 'WRITE_ROLE' },
  },
  {
    path: '/admin/settings',
    name: 'settings',
    component: () => import('@/views/admin/SettingsManagement.vue'),
    meta: { requiresAuth: true, authority: 'ADMIN_SETTINGS' },
  },
  {
    path: '/admin/products',
    name: 'product-management',
    component: () => import('@/views/admin/ProductManagement.vue'),
    meta: { requiresAuth: true, requiredAuthorities: 'WRITE_PRODUCT' },
  },
  {
    path: '/admin/users',
    name: 'user-management',
    component: () => import('@/views/admin/UserManagement.vue'),
    meta: { requiresAuth: true, requiredAuthorities: 'WRITE_USER' },
  },
  {
    path: '/admin/billinggroups',
    name: 'billinggroups-management',
    component: () => import('@/views/admin/BillingGroupManagement.vue'),
    meta: { requiresAuth: true, requiredAuthorities: 'WRITE_BILLING_GROUP' },
  },
  {
    path: '/admin/devices',
    name: 'device-management',
    component: () => import('@/views/admin/CertificateManagement.vue'),
    meta: { requiresAuth: true, requiredAuthorities: 'WRITE_USER' },
  },
  {
    path: '/sales-history',
    name: 'sales-history',
    component: () => import('@/views/SalesHistory.vue'),
    meta: { requiresAuth: true, requiredAuthorities: 'READ_OWN_SALES' },
  },
  {
    path: '/admin/balances',
    name: 'AdminBalances',
    component: () => import('@/views/admin/BalancesView.vue'),
    meta: { requiresAuth: true, requiredAuthorities: 'READ_ALL_BALANCES' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 2. Der Navigation Guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // A. Public Routes
  if (to.meta.requiresAuth === false) {
    return next()
  }

  // B. Login Check
  if (!authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  // C. Authorities laden (wichtig nach Page-Refresh)
  if (authStore.isAuthenticated && authStore.authorities.length === 0) {
    try {
      await authStore.fetchAuthorities()
    } catch (error) {
      authStore.logout() // Token scheint ungültig
      return next({ name: 'login' })
    }
  }

  // D. Berechtigung prüfen
  const required = to.meta.requiredAuthorities
  if (required) {
    // Wir wandeln alles in ein Array um, um es einheitlich zu prüfen
    const requiredArray = Array.isArray(required) ? required : [required]

    // Prüfen, ob der User MINDESTENS EINE der benötigten Authorities hat
    const hasPermission = requiredArray.some((auth) => authStore.hasAuthority(auth))

    if (!hasPermission) {
      console.warn(`Zugriff verweigert auf ${to.path}. Benötigt: ${requiredArray}`)
      return next({ name: 'dashboard' }) // Umleitung zum Dashboard
    }
  }

  next()
})

export default router
