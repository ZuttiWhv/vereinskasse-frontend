<template>
  <div class="dashboard">
    <div class="search-section" v-if="!selectedProduct">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          id="shop-search"
          placeholder="Produkt suchen..."
          class="search-input"
          @focus="kbStore.open('shop-search', searchQuery)"
        />
        <button v-if="searchQuery" @click="clearSearch" class="btn-clear-search">✕</button>
      </div>
    </div>

    <header class="view-header" v-if="!selectedProduct">
      <button v-if="selectedCategory && !searchQuery" @click="goBack" class="btn-secondary">
        ← Zurück
      </button>
      <h1 class="title-sm">
        {{
          searchQuery
            ? `Ergebnisse für "${searchQuery}"`
            : selectedCategory
              ? selectedCategory.name
              : 'Kategorien'
        }}
      </h1>
    </header>

    <div v-if="isLoading" class="loader-container">
      <div class="loader-spinner"></div>
      <p>Lade...</p>
    </div>

    <div v-if="!isLoading">
      <section v-if="!selectedProduct" class="grid">
        <template v-if="searchQuery">
          <div
            v-for="prod in searchResults"
            :key="'s' + prod.id"
            class="card interactive animate-pop"
            @click="selectProduct(prod)"
          >
            <div v-if="getVoucherCountForProduct(prod.id) > 0" class="voucher-badge">
              {{ getVoucherCountForProduct(prod.id) }}x Frei 🎁
            </div>
            <img :src="mediaApi.getImageUrl(prod.imagePath, 200)" class="card-img" alt="" />
            <div class="card-content">
              <h2 class="product-name">{{ prod.anzeigename || prod.name }}</h2>
              <p class="price-tag">{{ formatPrice(prod.price) }}</p>
            </div>
          </div>
        </template>
        <template v-else-if="!selectedCategory">
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
        </template>
        <template v-else>
          <div
            v-for="prod in products"
            :key="prod.id"
            class="card interactive"
            @click="selectProduct(prod)"
          >
            <div v-if="getVoucherCountForProduct(prod.id) > 0" class="voucher-badge">
              {{ getVoucherCountForProduct(prod.id) }}x Frei 🎁
            </div>
            <img :src="mediaApi.getImageUrl(prod.imagePath, 200)" class="card-img" alt="" />
            <div class="card-content">
              <h2 class="product-name">{{ prod.anzeigename || prod.name }}</h2>
              <p class="price-tag">{{ formatPrice(prod.price) }}</p>
            </div>
          </div>
        </template>
      </section>

      <section v-if="selectedProduct" class="purchase-container">
        <div class="purchase-card animate-pop">
          <div class="purchase-layout">
            <div class="image-section">
              <img
                :src="mediaApi.getImageUrl(selectedProduct.imagePath, 400)"
                class="purchase-img"
                alt=""
              />
            </div>
            <div class="info-section">
              <div class="header-group">
                <span class="category-label" v-if="selectedCategory">{{
                  selectedCategory.name
                }}</span>
                <h2 class="item-title">
                  {{ selectedProduct.anzeigename || selectedProduct.name }}
                </h2>
                <p class="item-unit-price">{{ formatPrice(selectedProduct.price) }} pro Stück</p>
              </div>

              <template v-if="voucherForSelectedProduct && !forceSelfPay">
                <div class="voucher-alert pulse-subtle">
                  <span class="icon">🎁</span>
                  <div>
                    <p class="giver">
                      <strong>{{ voucherForSelectedProduct.giverName }}</strong> gibt einen aus!
                    </p>
                    <p class="reason" v-if="voucherForSelectedProduct.reason">
                      "{{ voucherForSelectedProduct.reason }}"
                    </p>
                  </div>
                </div>
                <div class="price-summary">
                  <span class="summary-label">Kosten</span>
                  <span class="summary-value gratis">GRATIS</span>
                </div>
                <div class="action-stack">
                  <button class="btn-main pulse" @click="handlePurchase(true)">
                    Gutschein einlösen
                  </button>
                  <button class="btn-selfpay" @click="forceSelfPay = true">
                    Trotzdem selbst bezahlen
                  </button>
                  <div class="secondary-actions">
                    <button class="btn-alt-red full-width" @click="goBack">Abbrechen</button>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="quantity-control">
                  <button
                    class="q-btn minus"
                    @click="quantity > 1 ? quantity-- : null"
                    :disabled="quantity <= 1"
                  >
                    −
                  </button>
                  <div class="q-display">
                    <span class="q-num">{{ quantity }}</span>
                    <span class="q-label">Stück</span>
                  </div>
                  <button class="q-btn plus" @click="quantity++">+</button>
                </div>
                <div class="price-summary">
                  <span class="summary-label">Gesamtbetrag</span>
                  <span class="summary-value">{{
                    formatPrice(selectedProduct.price * quantity)
                  }}</span>
                </div>
                <div class="action-stack">
                  <button class="btn-main" @click="handlePurchase(false)">Kauf bestätigen</button>
                  <div class="secondary-actions">
                    <button class="btn-alt-yellow" @click="showIssueModal = true">
                      Spenderrunde 🍻
                    </button>
                    <button class="btn-alt-red" @click="goBack">Abbrechen</button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="showIssueModal" class="modal-overlay backdrop-blur">
      <div class="issue-modal animate-slide-up">
        <div class="issue-header">
          <div class="issue-icon-circle">🍻</div>
          <h2>Runde spendieren</h2>
        </div>
        <div class="issue-body">
          <div class="issue-summary-card">
            <div class="summary-item">
              <span>Menge:</span><strong>{{ quantity }}x {{ selectedProduct?.name }}</strong>
            </div>
            <div class="summary-item total">
              <span>Gesamtpreis:</span
              ><strong>{{ formatPrice((selectedProduct?.price || 0) * quantity) }}</strong>
            </div>
          </div>
          <div class="input-group">
            <label for="issue-reason">Anlass (optional)</label>
            <input
              v-model="issueReason"
              placeholder="z.B. Geburtstag..."
              class="modern-input"
              id="issue-reason"
              @focus="kbStore.open('issue-reason', issueReason)"
            />
          </div>
        </div>
        <div class="issue-footer">
          <button class="btn-issue-confirm" @click="handleIssueVoucher">
            Kostenpflichtig ausgeben
          </button>
          <button class="btn-issue-cancel" @click="showIssueModal = false">Abbrechen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ShopService } from '@/api/shop.service'
import apiClient from '@/api/client'
import type { Category, Product as BaseProduct, PrepaidVoucherDTO } from '@/types'
import { mediaApi } from '@/api/mediaApi'
import { useKeyboardStore } from '@/stores/keyboard'

const authStore = useAuthStore()
const router = useRouter()
const kbStore = useKeyboardStore()

interface Product extends BaseProduct {
  active: boolean
  barcodes: string[]
}

const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const allProducts = ref<Product[]>([])
const availableVouchers = ref<PrepaidVoucherDTO[]>([])
const selectedCategory = ref<Category | null>(null)
const selectedProduct = ref<Product | null>(null)
const quantity = ref<number>(1)
const isLoading = ref(false)
const searchQuery = ref('')
const showIssueModal = ref(false)
const issueReason = ref('')
const forceSelfPay = ref(false)

const searchResults = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (query.length < 2) return []
  return allProducts.value.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      (p.anzeigename && p.anzeigename.toLowerCase().includes(query)),
  )
})

const voucherForSelectedProduct = computed(() => {
  if (!selectedProduct.value) return null
  return availableVouchers.value.find((v) => v.productId === selectedProduct.value!.id)
})

const getVoucherCountForProduct = (productId: number) => {
  return availableVouchers.value
    .filter((v) => v.productId === productId)
    .reduce((sum, v) => sum + v.remainingCount, 0)
}

// BARCODE & TIMER LOGIC
const barcodeBuffer = ref('')
const lastKeyTime = ref(0)

const handleBarcodeScanned = async (barcode: string) => {
  isLoading.value = true
  try {
    const { data: product } = await apiClient.get<Product>(`/api/products/barcode/${barcode}`)
    if (product && product.active) {
      searchQuery.value = ''
      selectProduct(product)
    }
  } catch (e) {
    console.error('Scan Fehler')
  } finally {
    isLoading.value = false
  }
}

// FIXED: Expliziter Typ für das Event
const handleGlobalKeyDown = (event: KeyboardEvent) => {
  const currentTime = Date.now()
  if (currentTime - lastKeyTime.value > 50) barcodeBuffer.value = ''
  if (event.key === 'Enter') {
    if (barcodeBuffer.value.length > 2) handleBarcodeScanned(barcodeBuffer.value)
    barcodeBuffer.value = ''
  } else if (event.key.length === 1) {
    barcodeBuffer.value += event.key
  }
  lastKeyTime.value = currentTime
  resetInactivityTimer()
}

let inactivityTimer: ReturnType<typeof setTimeout> | null = null

const resetInactivityTimer = () => {
  if (inactivityTimer) clearTimeout(inactivityTimer)
  inactivityTimer = setTimeout(() => {
    authStore.logout()
    router.push('/login')
  }, 30000)
}

// FIXED: Event Listener sauber getrennt
const setupActivityListeners = () => {
  globalThis.addEventListener('keydown', handleGlobalKeyDown)
  // Wir casten die Strings zu den korrekten Event-Typen
  const interactionEvents: Array<keyof WindowEventMap> = ['mousemove', 'touchstart', 'click']
  interactionEvents.forEach((eventName) => {
    globalThis.addEventListener(eventName, resetInactivityTimer)
  })
}

const cleanupActivityListeners = () => {
  globalThis.removeEventListener('keydown', handleGlobalKeyDown)
  const interactionEvents: Array<keyof WindowEventMap> = ['mousemove', 'touchstart', 'click']
  interactionEvents.forEach((eventName) => {
    globalThis.removeEventListener(eventName, resetInactivityTimer)
  })
  if (inactivityTimer) clearTimeout(inactivityTimer)
}

onMounted(async () => {
  isLoading.value = true
  setupActivityListeners()
  resetInactivityTimer()
  try {
    const [cats] = await Promise.all([
      ShopService.getCategories(),
      apiClient
        .get<Product[]>('/api/products')
        .then((res) => (allProducts.value = res.data.filter((p) => p.active !== false))),
      apiClient
        .get<PrepaidVoucherDTO[]>('/api/vouchers/available')
        .then((res) => (availableVouchers.value = res.data)),
    ])
    categories.value = cats
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => cleanupActivityListeners())

const selectCategory = async (cat: Category) => {
  selectedCategory.value = cat
  isLoading.value = true
  try {
    products.value = ((await ShopService.getProductsByCategory(cat.id)) as Product[]).filter(
      (p) => p.active !== false,
    )
  } finally {
    isLoading.value = false
  }
}

const selectProduct = (p: Product) => {
  selectedProduct.value = p
  quantity.value = 1
  searchQuery.value = ''
  forceSelfPay.value = false
}

const goBack = () => {
  if (selectedProduct.value) {
    selectedProduct.value = null
    forceSelfPay.value = false
  } else {
    selectedCategory.value = null
    products.value = []
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  kbStore.close()
}

const handlePurchase = async (useVoucher: boolean = false) => {
  if (!selectedProduct.value) return
  isLoading.value = true
  try {
    await apiClient.post('/api/sales', {
      productId: selectedProduct.value.id,
      amount: useVoucher ? 1 : quantity.value,
      useVoucher,
    })
    authStore.logout()
    router.push('/login')
  } catch (e) {
    alert('Fehler beim Kauf')
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
      reason: issueReason.value || 'Eine Runde!',
    })
    authStore.logout()
    router.push('/login')
  } catch (e) {
    alert('Fehler beim Spendieren')
    isLoading.value = false
  }
}

const formatPrice = (c: number) =>
  (c / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
</script>

<style scoped>
/* CSS bleibt unverändert wie im letzten Schritt */
.dashboard {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  color: #2d3748;
}
.search-section {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}
.search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
}
.search-input {
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 2.8rem;
  border-radius: 1rem;
  border: 2px solid #edf2f7;
  background: #f7fafc;
  font-size: 1rem;
  outline: none;
}
.search-input:focus {
  border-color: #4299e1;
  background: #fff;
}
.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
}
.btn-clear-search {
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: #cbd5e0;
  color: #fff;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  cursor: pointer;
}
.view-header {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.title-sm {
  font-size: 1.4rem;
  font-weight: 800;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
}
.card {
  background: #fff;
  border-radius: 1.25rem;
  border: 1px solid #edf2f7;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: transform 0.2s;
}
.card:hover {
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
.product-name {
  font-size: 1.1rem;
  font-weight: 700;
}
.price-tag {
  font-weight: 600;
  color: #718096;
}
.voucher-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: #38a169;
  color: #fff;
  padding: 0.3rem 0.6rem;
  border-radius: 0.6rem;
  font-size: 0.75rem;
  font-weight: 800;
}
.purchase-container {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
}
.purchase-card {
  background: #fff;
  border-radius: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  width: 100%;
  max-width: 900px;
  border: 1px solid #edf2f7;
}
.purchase-layout {
  display: flex;
  flex-direction: row;
}
.image-section {
  flex: 1;
  min-width: 350px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.purchase-img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1));
}
.info-section {
  flex: 1.2;
  min-width: 350px;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.item-title {
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0.5rem 0;
}
.voucher-alert {
  background: #f0fff4;
  border: 1px solid #c6f6d5;
  padding: 1.25rem;
  border-radius: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}
.voucher-alert .icon {
  font-size: 2rem;
}
.quantity-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f7fafc;
  padding: 0.75rem;
  border-radius: 2rem;
  border: 1px solid #edf2f7;
}
.q-btn {
  width: 70px;
  height: 70px;
  border-radius: 1.5rem;
  border: none;
  font-size: 2rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}
.q-btn.minus {
  background: #fff;
  color: #e53e3e;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}
.q-btn.plus {
  background: #3182ce;
  color: #fff;
  box-shadow: 0 6px 12px rgba(49, 130, 206, 0.3);
}
.q-num {
  font-size: 2.5rem;
  font-weight: 900;
}
.price-summary {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 1.5rem;
  border-top: 2px dashed #edf2f7;
}
.summary-value {
  font-size: 2.5rem;
  font-weight: 900;
}
.summary-value.gratis {
  color: #38a169;
}
.action-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}
.btn-main {
  width: 100%;
  padding: 1.5rem;
  border-radius: 1.5rem;
  border: none;
  background: #38a169;
  color: #fff;
  font-size: 1.4rem;
  font-weight: 900;
  cursor: pointer;
}
.btn-selfpay {
  width: 100%;
  padding: 1.1rem;
  border-radius: 1.25rem;
  border: 2px solid #e2e8f0;
  background: #fff;
  color: #4a5568;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
}
.secondary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.secondary-actions .full-width {
  grid-column: span 2;
}
.btn-alt-yellow {
  background: #fefcbf;
  color: #b7791f;
  border: none;
  padding: 1.25rem;
  border-radius: 1.25rem;
  font-weight: 800;
  cursor: pointer;
}
.btn-alt-red {
  background: #fff5f5;
  color: #c53030;
  border: 1px solid #feb2b2;
  padding: 1.25rem;
  border-radius: 1.25rem;
  font-weight: 800;
  cursor: pointer;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 32, 44, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}
.issue-modal {
  background: #fff;
  width: 100%;
  max-width: 500px;
  border-radius: 2.5rem;
  overflow: hidden;
}
.issue-header {
  background: #fef3c7;
  padding: 2rem;
  text-align: center;
}
.issue-icon-circle {
  background: #fff;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 1rem;
}
.issue-body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.issue-summary-card {
  background: #fff9db;
  padding: 1.5rem;
  border-radius: 1.5rem;
}
.summary-item.total {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #fde68a;
  font-size: 1.25rem;
}
.modern-input {
  width: 100%;
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid #edf2f7;
  font-size: 1.1rem;
  outline: none;
}
.issue-footer {
  padding: 0 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.btn-issue-confirm {
  background: #f59e0b;
  color: #fff;
  padding: 1.25rem;
  border-radius: 1.25rem;
  border: none;
  font-size: 1.2rem;
  font-weight: 900;
  cursor: pointer;
}
.btn-issue-cancel {
  background: transparent;
  color: #718096;
  border: none;
  font-weight: 700;
  cursor: pointer;
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
.animate-slide-up {
  animation: slideUp 0.4s ease-out;
}
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.pulse {
  animation: pulse-border 2s infinite;
}
@keyframes pulse-border {
  0% {
    box-shadow: 0 0 0 0 rgba(56, 161, 105, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(56, 161, 105, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(56, 161, 105, 0);
  }
}
@media (max-width: 768px) {
  .purchase-layout {
    flex-direction: column;
  }
  .image-section,
  .info-section {
    min-width: 100%;
    padding: 1.5rem;
  }
  .item-title {
    font-size: 2rem;
  }
}
</style>
