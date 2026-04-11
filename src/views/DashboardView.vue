<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ShopService } from '@/api/shop.service'
import type { Category, Product } from '@/types'
import { mediaApi } from '@/api/mediaApi'

const authStore = useAuthStore()
const router = useRouter()

// --- ZUSTAND (STATE) ---
const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const selectedCategory = ref<Category | null>(null)
const selectedProduct = ref<Product | null>(null)

const quantity = ref<number>(1)
const isLoading = ref(false)

// --- LOGIK ---

// 1. Initial alle Kategorien laden
onMounted(async () => {
  isLoading.value = true
  try {
    categories.value = await ShopService.getCategories()
  } finally {
    isLoading.value = false
  }
})

// 2. Kategorie wählen -> Produkte laden
const selectCategory = async (category: Category) => {
  selectedCategory.value = category
  isLoading.value = true
  try {
    products.value = await ShopService.getProductsByCategory(category.id)
  } finally {
    isLoading.value = false
  }
}

// 3. Produkt wählen -> Mengenansicht öffnen
const selectProduct = (product: Product) => {
  selectedProduct.value = product
  quantity.value = 1
}

// 4. Navigation zurück
const goBack = () => {
  if (selectedProduct.value) {
    selectedProduct.value = null
  } else {
    selectedCategory.value = null
    products.value = []
  }
}

// 5. DER KAUF-PROZESS
const handlePurchase = async () => {
  if (!selectedProduct.value) return

  isLoading.value = true
  try {
    // 1. Aufruf des Services
    await ShopService.createSale(selectedProduct.value.id, quantity.value)

    // 2. Logout einleiten
    authStore.logout()

    // 3. WICHTIG: Sofort navigieren, damit das "Einen Moment bitte"
    // der Dashboard-Komponente verschwindet, da diese nun zerstört wird.
    router.push('/login')
  } catch (error) {
    console.error('Kauffehler:', error)
    alert('Fehler beim Buchen. Ist dein Guthaben gedeckt?')
    // Nur im Fehlerfall müssen wir isLoading auf false setzen,
    // da wir bei Erfolg die Seite ohnehin verlassen.
    isLoading.value = false
  }
}

// Preis-Formatierung
const formatPrice = (cents: number) => {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}
</script>

<template>
  <div class="dashboard">
    <header class="view-header">
      <button v-if="selectedCategory" @click="goBack" class="btn-secondary">← Zurück</button>
      <h1 v-if="!selectedCategory">Was möchtest du kaufen?</h1>
      <h1 v-else-if="!selectedProduct">{{ selectedCategory.name }}</h1>
      <h1 v-else>Menge anpassen</h1>
    </header>

    <div v-if="isLoading" class="loader">Einen Moment bitte...</div>

    <section v-if="!selectedCategory && !isLoading" class="grid">
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
        <img
          v-if="prod.imagePath"
          :src="mediaApi.getImageUrl(prod.imagePath, 200)"
          alt=""
          class="card-img"
        />
        <div v-else class="card-img flex items-center justify-center bg-gray-100 text-4xl">📦</div>

        <div class="card-content">
          <h2>{{ prod.anzeigename || prod.name }}</h2>
          <p class="price-tag">{{ formatPrice(prod.price) }}</p>
        </div>
      </div>
    </section>

    <section v-if="selectedProduct && !isLoading" class="purchase-box">
      <div class="card purchase-card">
        <img :src="mediaApi.getImageUrl(selectedProduct.imagePath, 300)" class="card-img" alt="" />
        <div class="card-content">
          <h2>{{ selectedProduct.anzeigename || selectedProduct.name }}</h2>
          <p class="price-hint">{{ formatPrice(selectedProduct.price) }} pro Stück</p>

          <div class="quantity-picker">
            <button @click="quantity > 1 ? quantity-- : null">-</button>
            <span class="quantity-value">{{ quantity }}</span>
            <button @click="quantity++">+</button>
          </div>

          <div class="total-sum">Gesamt: {{ formatPrice(selectedProduct.price * quantity) }}</div>

          <button class="btn-confirm" @click="handlePurchase">Kauf abschließen & Abmelden</button>
        </div>
      </div>
    </section>
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
  gap: 1rem;
  margin-bottom: 2rem;
}

/* Responsive Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

/* Card Design */
.card {
  background: white;
  border-radius: 12px;
  border: 1px solid #eee;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

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
  height: 150px;
  object-fit: contain;
  background: #f9f9f9;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem; /* Ein bisschen Padding für Luft */
}

.card-content {
  padding: 1.5rem;
  text-align: center;
}

.price-tag {
  font-size: 1.25rem;
  font-weight: bold;
  color: #2c3e50;
  margin-top: 0.5rem;
}

/* Purchase View Specifics */
.purchase-box {
  display: flex;
  justify-content: center;
}

.purchase-card {
  width: 100%;
  max-width: 400px;
}

.quantity-picker {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin: 2rem 0;
}

.quantity-picker button {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: 1px solid #ddd;
  background: white;
  font-size: 1.5rem;
  cursor: pointer;
}

.quantity-value {
  font-size: 2rem;
  font-weight: bold;
}

.total-sum {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.btn-confirm {
  width: 100%;
  padding: 1rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
}

.btn-confirm:hover {
  background: #219150;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
}
</style>
