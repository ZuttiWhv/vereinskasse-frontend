<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ShopService } from '@/api/shop.service'
import apiClient from '@/api/client'
import type { Category, Product as BaseProduct, PrepaidVoucherDTO } from '@/types'
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
const availableVouchers = ref<PrepaidVoucherDTO[]>([])
const selectedCategory = ref<Category | null>(null)
const selectedProduct = ref<Product | null>(null)
const quantity = ref<number>(1)
const isLoading = ref(false)

// Spendier-Modus Zustand
const showIssueModal = ref(false)
const issueReason = ref('')

// --- COMPUTED ---
const voucherForSelectedProduct = computed(() => {
  if (!selectedProduct.value) return null
  return availableVouchers.value.find(
    (v: PrepaidVoucherDTO) => v.productId === selectedProduct.value!.id,
  )
})

const getVoucherCountForProduct = (productId: number) => {
  return availableVouchers.value
    .filter((v: PrepaidVoucherDTO) => v.productId === productId)
    .reduce((sum, v: PrepaidVoucherDTO) => sum + v.remainingCount, 0)
}

// --- BARCODE LOGIK ---
const barcodeBuffer = ref('')
const lastKeyTime = ref(0)

const handleBarcodeScanned = async (barcode: string) => {
  isLoading.value = true
  try {
    const { data: product } = await apiClient.get<Product>(`/api/products/barcode/${barcode}`)
    if (product && product.active) {
      selectProduct(product)
    } else {
      alert('Produkt nicht gefunden.')
    }
  } catch (e) {
    alert('Fehler beim Scannen.')
  } finally {
    isLoading.value = false
  }
}

const handleGlobalKeyDown = (event: KeyboardEvent) => {
  const currentTime = Date.now()
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
  resetInactivityTimer()
}

// --- INAKTIVITÄTS-TIMER ---
let inactivityTimer: number | null = null
const INACTIVITY_TIMEOUT_MS = 30000

const resetInactivityTimer = () => {
  if (inactivityTimer) globalThis.clearTimeout(inactivityTimer)
  inactivityTimer = globalThis.setTimeout(() => {
    authStore.logout()
    router.push('/login')
  }, INACTIVITY_TIMEOUT_MS)
}

const setupActivityListeners = () => {
  globalThis.addEventListener('mousemove', resetInactivityTimer)
  globalThis.addEventListener('touchstart', resetInactivityTimer)
  globalThis.addEventListener('click', resetInactivityTimer)
  globalThis.addEventListener('keydown', handleGlobalKeyDown)
  resetInactivityTimer()
}

const cleanupActivityListeners = () => {
  globalThis.removeEventListener('mousemove', resetInactivityTimer)
  globalThis.removeEventListener('touchstart', resetInactivityTimer)
  globalThis.removeEventListener('click', resetInactivityTimer)
  globalThis.removeEventListener('keydown', handleGlobalKeyDown)
  if (inactivityTimer) globalThis.clearTimeout(inactivityTimer)
}

// --- API LOGIK ---
const fetchVouchers = async () => {
  try {
    const { data } = await apiClient.get<PrepaidVoucherDTO[]>('/api/vouchers/available')
    availableVouchers.value = data
  } catch (e) {
    console.error('Fehler beim Laden der Voucher', e)
  }
}

onMounted(async () => {
  isLoading.value = true
  setupActivityListeners()
  try {
    const [cats] = await Promise.all([ShopService.getCategories(), fetchVouchers()])
    categories.value = cats
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

const handlePurchase = async (useVoucher: boolean = false) => {
  if (!selectedProduct.value) return

  isLoading.value = true
  try {
    await apiClient.post('/api/sales', {
      productId: selectedProduct.value.id,
      amount: useVoucher ? 1 : quantity.value,
      useVoucher: useVoucher,
    })

    authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Kauffehler:', error)
    alert(useVoucher ? 'Fehler beim Einlösen.' : 'Fehler beim Buchen. Guthaben prüfen!')
    isLoading.value = false
  }
}

const handleIssueVoucher = async () => {
  if (!selectedProduct.value) return
  isLoading.value = true
  try {
    await apiClient.post('/api/vouchers/issue', {
      productId: selectedProduct.value.id,
      quantity: quantity.value,
      reason: issueReason.value || 'Eine Runde für alle!',
    })
    authStore.logout()
    router.push('/login')
  } catch (error) {
    alert('Fehler beim Ausgeben der Runde.')
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
      <span class="icon">🔍</span> Barcode scannen
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
      <p>Verarbeite...</p>
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
      <div
        v-for="prod in products"
        :key="prod.id"
        class="card interactive"
        @click="selectProduct(prod)"
      >
        <div v-if="getVoucherCountForProduct(prod.id) > 0" class="voucher-badge">
          {{ getVoucherCountForProduct(prod.id) }}x Frei 🎁
        </div>
        <img
          v-if="prod.imagePath"
          :src="mediaApi.getImageUrl(prod.imagePath, 200)"
          alt=""
          class="card-img"
        />
        <div v-else class="card-img default-icon">📦</div>
        <div class="card-content">
          <h2>{{ prod.anzeigename || prod.name }}</h2>
          <p class="price-tag">{{ formatPrice(prod.price) }}</p>
        </div>
      </div>
    </section>

    <section v-if="selectedProduct && !isLoading" class="purchase-box">
      <div class="card purchase-card animate-pop">
        <img :src="mediaApi.getImageUrl(selectedProduct.imagePath, 300)" class="card-img" alt="" />
        <div class="card-content">
          <h2>{{ selectedProduct.anzeigename || selectedProduct.name }}</h2>

          <div v-if="voucherForSelectedProduct" class="voucher-info">
            <p class="voucher-text">
              ✨ <strong>{{ voucherForSelectedProduct.giverName }}</strong> gibt eine Runde aus!
              <span v-if="voucherForSelectedProduct.reason"
                ><br />"{{ voucherForSelectedProduct.reason }}"</span
              >
            </p>
          </div>
          <p v-else class="price-hint">{{ formatPrice(selectedProduct.price) }} pro Stück</p>

          <div class="quantity-picker" v-if="!voucherForSelectedProduct">
            <button @click="quantity > 1 ? quantity-- : null" :disabled="quantity <= 1">-</button>
            <span class="quantity-value">{{ quantity }}</span>
            <button @click="quantity++">+</button>
          </div>

          <div class="total-sum">
            {{
              voucherForSelectedProduct
                ? 'Freigetränk verfügbar'
                : 'Gesamt: ' + formatPrice(selectedProduct.price * quantity)
            }}
          </div>

          <div class="action-buttons">
            <template v-if="voucherForSelectedProduct">
              <button class="btn-voucher-redeem" @click="handlePurchase(true)">
                Gutschein einlösen
              </button>
              <button class="btn-confirm-alt" @click="handlePurchase(false)">
                Selbst bezahlen
              </button>
            </template>
            <template v-else>
              <button class="btn-confirm" @click="handlePurchase(false)">Jetzt kaufen</button>
            </template>
            <button class="btn-issue" @click="showIssueModal = true">Runde spendieren 🍻</button>

            <button class="btn-cancel-action" @click="goBack">Abbrechen</button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="showIssueModal" class="modal-overlay">
      <div class="modal-card animate-pop">
        <h3>Runde spendieren</h3>
        <p>Du gibst {{ quantity }}x {{ selectedProduct?.name }} aus.</p>
        <input v-model="issueReason" placeholder="Grund (optional)" class="modal-input" autofocus />
        <div class="modal-actions">
          <button class="btn-confirm" @click="handleIssueVoucher">Kostenpflichtig ausgeben</button>
          <button class="btn-cancel-action" @click="showIssueModal = false">Abbrechen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  position: relative;
  display: flex;
  flex-direction: column;
}
.interactive {
  cursor: pointer;
  transition: transform 0.2s;
}
.interactive:hover {
  transform: translateY(-4px);
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

.voucher-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #38a169;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: bold;
}
.voucher-info {
  background: #f0fff4;
  border: 1px solid #c6f6d5;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}
.voucher-text {
  color: #276749;
  font-size: 0.9rem;
}

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
  margin: 1.5rem 0;
}
.quantity-value {
  font-size: 2.5rem;
  font-weight: 800;
}
.total-sum {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  padding-top: 1rem;
  border-top: 2px solid #f7fafc;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* BUTTON STYLES */
.btn-confirm {
  width: 100%;
  padding: 1.25rem;
  background: #38a169;
  color: white;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-confirm:hover {
  background: #2f855a;
}

.btn-voucher-redeem {
  width: 100%;
  padding: 1.25rem;
  background: #38a169;
  color: white;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  animation: pulse 2s infinite;
}

.btn-confirm-alt {
  background: #edf2f7;
  padding: 0.85rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  color: #4a5568;
  font-weight: 600;
  cursor: pointer;
}

.btn-issue {
  width: 100%;
  padding: 1rem;
  background: #ecc94b;
  color: #744210;
  border-radius: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

/* DER NEUE ABBRECHEN BUTTON */
.btn-cancel-action {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.85rem;
  background: white;
  color: #e53e3e; /* Rot für "Abbruch" */
  border: 2px solid #fed7d7;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel-action:hover {
  background: #fff5f5;
  border-color: #feb2b2;
  transform: translateY(1px);
}

.btn-secondary {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-card {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  text-align: center;
}
.modal-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  margin: 1rem 0;
}
.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
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

.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 0;
}
.loader-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
