<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ShopService } from '@/api/shop.service'
import apiClient from '@/api/client' // Import für direkte Barcode-Suche
import type { Category, Product as BaseProduct } from '@/types'
import { mediaApi } from '@/api/mediaApi'

const authStore = useAuthStore()
const router = useRouter()

interface Product extends BaseProduct {
  active: boolean
  barcode?: string
}

// --- ZUSTAND (STATE) ---
const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const selectedCategory = ref<Category | null>(null)
const selectedProduct = ref<Product | null>(null)
const quantity = ref<number>(1)
const isLoading = ref(false)

// --- BARCODE LOGIK ---
const barcodeBuffer = ref('')
const lastKeyTime = ref(0)

const handleBarcodeScanned = async (barcode: string) => {
  isLoading.value = true
  try {
    // Wir suchen das Produkt direkt über den Barcode im Backend
    const { data: product } = await apiClient.get<Product>(`/api/products/barcode/${barcode}`)

    if (product && product.active) {
      // Produkt gefunden -> Direkt in die Kaufansicht springen
      selectProduct(product)
    } else {
      alert('Produkt nicht gefunden oder nicht vorrätig.')
    }
  } catch (e) {
    console.error('Barcode Fehler:', e)
    alert('Fehler beim Scannen des Barcodes.')
  } finally {
    isLoading.value = false
  }
}

const handleGlobalKeyDown = (event: KeyboardEvent) => {
  const currentTime = Date.now()

  // Zeitlicher Check (Scanner ist viel schneller als Mensch)
  if (currentTime - lastKeyTime.value > 50) {
    barcodeBuffer.value = ''
  }

  if (event.key === 'Enter') {
    if (barcodeBuffer.value.length > 2) {
      handleBarcodeScanned(barcodeBuffer.value)
    }
    barcodeBuffer.value = ''
  } else if (event.key.length === 1) {
    barcodeBuffer.value += event.key
  }

  lastKeyTime.value = currentTime
  resetInactivityTimer() // Jede Taste setzt auch den Timer zurück
}

// --- INAKTIVITÄTS-TIMER ---
let inactivityTimer: number | null = null
const INACTIVITY_TIMEOUT_MS = 30000

const resetInactivityTimer = () => {
  if (inactivityTimer) window.clearTimeout(inactivityTimer)
  inactivityTimer = window.setTimeout(() => {
    authStore.logout()
    router.push('/login')
  }, INACTIVITY_TIMEOUT_MS)
}

const setupActivityListeners = () => {
  window.addEventListener('mousemove', resetInactivityTimer)
  window.addEventListener('touchstart', resetInactivityTimer)
  window.addEventListener('click', resetInactivityTimer)
  window.addEventListener('keydown', handleGlobalKeyDown) // Hier den Barcode-Handler integriert
  resetInactivityTimer()
}

const cleanupActivityListeners = () => {
  window.removeEventListener('mousemove', resetInactivityTimer)
  window.removeEventListener('touchstart', resetInactivityTimer)
  window.removeEventListener('click', resetInactivityTimer)
  window.removeEventListener('keydown', handleGlobalKeyDown)
  if (inactivityTimer) window.clearTimeout(inactivityTimer)
}

// --- LOGIK ---

onMounted(async () => {
  isLoading.value = true
  setupActivityListeners()
  try {
    categories.value = await ShopService.getCategories()
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  cleanupActivityListeners()
})

const selectCategory = async (category: Category) => {
  selectedCategory.value = category
  isLoading.value = true
  try {
    const allProducts = await ShopService.getProductsByCategory(category.id)
    products.value = (allProducts as Product[]).filter((p) => p.active !== false)
  } finally {
    isLoading.value = false
  }
}

const selectProduct = (product: Product) => {
  selectedProduct.value = product
  quantity.value = 1
}

const goBack = () => {
  if (selectedProduct.value) {
    selectedProduct.value = null
  } else {
    selectedCategory.value = null
    products.value = []
  }
}

const handlePurchase = async () => {
  if (!selectedProduct.value) return

  isLoading.value = true
  try {
    await ShopService.createSale(selectedProduct.value.id, quantity.value)
    authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Kauffehler:', error)
    alert('Fehler beim Buchen. Ist dein Guthaben gedeckt?')
    isLoading.value = false
  }
}

const formatPrice = (cents: number) => {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}
</script>

<template>
  <div class="dashboard">
    <div class="barcode-hint" v-if="!selectedProduct">
      <span class="icon">🔍</span> Barcode scannen für Sofortauswahl
    </div>

    <header class="view-header">
      <button v-if="selectedCategory || selectedProduct" @click="goBack" class="btn-secondary">
        ← Zurück
      </button>
      <h1 v-if="!selectedCategory && !selectedProduct">Was möchtest du kaufen?</h1>
      <h1 v-else-if="selectedCategory && !selectedProduct">{{ selectedCategory.name }}</h1>
      <h1 v-else>Menge anpassen</h1>
    </header>

    <div v-if="isLoading" class="loader-container">
      <div class="loader-spinner"></div>
      <p>Prüfe Barcode...</p>
    </div>

    <section v-if="!selectedCategory && !selectedProduct && !isLoading" class="grid">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="card interactive"
        @click="selectCategory(cat)"
      >
        <img :src="mediaApi.getImageUrl(cat.imagePath, 200)" class="card-img" alt="" />
        <div class="card-content">
          <h2>{{ cat.name }}</h2>
        </div>
      </div>
    </section>

    <section v-if="selectedCategory && !selectedProduct && !isLoading" class="grid">
      <template v-if="products.length > 0">
        <div
          v-for="prod in products"
          :key="prod.id"
          class="card interactive"
          @click="selectProduct(prod)"
        >
          <img
            v-if="prod.imagePath"
            :src="mediaApi.getImageUrl(prod.imagePath, 200)"
            alt=""
            class="card-img"
          />
          <div v-else class="card-img flex items-center justify-center bg-gray-100 text-4xl">
            📦
          </div>

          <div class="card-content">
            <h2>{{ prod.anzeigename || prod.name }}</h2>
            <p class="price-tag">{{ formatPrice(prod.price) }}</p>
          </div>
        </div>
      </template>
      <div v-else class="empty-state">
        <p>In dieser Kategorie gibt es aktuell keine vorrätigen Produkte.</p>
        <button @click="goBack" class="btn-secondary mt-4">Zurück zur Übersicht</button>
      </div>
    </section>

    <section v-if="selectedProduct && !isLoading" class="purchase-box">
      <div class="card purchase-card animate-pop">
        <img :src="mediaApi.getImageUrl(selectedProduct.imagePath, 300)" class="card-img" alt="" />
        <div class="card-content">
          <h2>{{ selectedProduct.anzeigename || selectedProduct.name }}</h2>
          <p class="price-hint">{{ formatPrice(selectedProduct.price) }} pro Stück</p>

          <div class="quantity-picker">
            <button @click="quantity > 1 ? quantity-- : null" :disabled="quantity <= 1">-</button>
            <span class="quantity-value">{{ quantity }}</span>
            <button @click="quantity++">+</button>
          </div>

          <div class="total-sum">Gesamt: {{ formatPrice(selectedProduct.price * quantity) }}</div>

          <button class="btn-confirm" @click="handlePurchase">Kauf abschließen & Abmelden</button>
          <button class="btn-cancel-purchase" @click="goBack">Abbrechen</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Ergänzende Styles */
.barcode-hint {
  position: absolute;
  top: 10px;
  right: 20px;
  background: #ebf8ff;
  color: #2b6cb0;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #bee3f8;
}

.btn-cancel-purchase {
  width: 100%;
  margin-top: 1rem;
  padding: 0.8rem;
  background: transparent;
  color: #a0aec0;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.animate-pop {
  animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.dashboard {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.view-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a202c;
}

/* Lade-Zustand */
.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 0;
  color: #718096;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #edf2f7;
  border-top: 4px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Grids & Cards */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.interactive {
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.interactive:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.card-img {
  width: 100%;
  height: 160px;
  object-fit: contain;
  background: #f8fafc;
  padding: 1rem;
}

.card-content {
  padding: 1.25rem;
  text-align: center;
}

.card-content h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.price-tag {
  font-size: 1.2rem;
  font-weight: 800;
  color: #3182ce;
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 5rem 2rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #e2e8f0;
  color: #718096;
}

.mt-4 {
  margin-top: 1.5rem;
}

/* Kauf-Bereich */
.purchase-box {
  display: flex;
  justify-content: center;
}

.purchase-card {
  width: 100%;
  max-width: 450px;
}

.quantity-picker {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin: 2rem 0;
}

.quantity-picker button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  background: white;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.quantity-picker button:hover:not(:disabled) {
  border-color: #3182ce;
  color: #3182ce;
}

.quantity-picker button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.quantity-value {
  font-size: 2.5rem;
  font-weight: 800;
}

.total-sum {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 2rem;
  border-top: 2px solid #f7fafc;
  padding-top: 1.5rem;
  color: #1a202c;
}

.btn-confirm {
  width: 100%;
  padding: 1.25rem;
  background: #38a169;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-confirm:hover {
  background: #2f855a;
}

.btn-secondary {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  font-weight: 600;
  color: #4a5568;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f7fafc;
}
</style>