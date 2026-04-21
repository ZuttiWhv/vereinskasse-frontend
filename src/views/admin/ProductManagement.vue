<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Produkte verwalten</h1>
        <p class="text-sm text-gray-500">Preise, Bilder und Kategorien deiner Artikel</p>
      </div>
      <button
        v-if="authStore.hasAuthority('WRITE_PRODUCT')"
        @click="openModal()"
        class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition shadow-md font-semibold"
      >
        + Neues Produkt
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase">
              <th class="px-6 py-4 font-semibold">Bild</th>
              <th class="px-6 py-4 font-semibold">Name / Anzeigename</th>
              <th class="px-6 py-4 font-semibold">Kategorie</th>
              <th class="px-6 py-4 font-semibold">Preis</th>
              <th class="px-6 py-4 font-semibold text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="product in products"
              :key="product.id"
              class="hover:bg-gray-50/50 transition"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <img
                  :src="mediaApi.getImageUrl(product.imagePath, 100)"
                  class="h-12 w-12 rounded-lg object-cover border bg-gray-50"
                  alt="Produkt"
                />
              </td>
              <td class="px-6 py-4">
                <div class="font-bold text-gray-900">{{ product.anzeigename || product.name }}</div>
                <div class="text-xs text-gray-400 font-mono">{{ product.name }}</div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                  {{ product.category?.name || 'Keine Kategorie' }}
                </span>
              </td>
              <td class="px-6 py-4 font-mono font-bold text-blue-600">
                {{ formatCurrency(product.price) }}
              </td>
              <td class="px-6 py-4 text-right space-x-3">
                <button
                  v-if="authStore.hasAuthority('WRITE_PRODUCT')"
                  @click="openModal(product)"
                  class="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Bearbeiten
                </button>
                <button
                  v-if="authStore.hasAuthority('DELETE_PRODUCT')"
                  @click="deleteProduct(product.id)"
                  class="text-red-500 hover:text-red-700 font-medium text-sm"
                >
                  Löschen
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-xl font-bold text-gray-800">
            {{ isEditing ? 'Produkt bearbeiten' : 'Neues Produkt anlegen' }}
          </h2>
        </div>

        <div class="p-6 overflow-y-auto space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Interner Name (eindeutig)</label
              >
              <input
                id="product-name"
                @focus="kbStore.open('product-name', formData.name)"
                v-model="formData.name"
                type="text"
                class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. pils_033"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Anzeigename</label>
              <input
                v-model="formData.anzeigename"
                id="product-showname"
                @focus="kbStore.open('product-showname', formData.anzeigename)"
                type="text"
                class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. Pils 0,33l"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Preis (€)</label>
              <input
                v-model="displayPrice"
                id="product-price"
                @focus="kbStore.open('product-price', displayPrice)"
                type="number"
                step="0.01"
                class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <select
                v-model="formData.categoryId"
                class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option :value="null" disabled>Bitte wählen...</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Produktbild</label>
            <div
              class="flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-lg"
            >
              <img
                v-if="previewUrl || formData.imagePath"
                :src="previewUrl || mediaApi.getImageUrl(formData.imagePath, 200)"
                class="h-20 w-20 object-cover rounded-lg border shadow-sm"
              />
              <div
                v-else
                class="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl"
              >
                📸
              </div>
              <input
                type="file"
                @change="handleFileUpload"
                accept="image/*"
                class="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            @click="closeModal"
            class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
          >
            Abbrechen
          </button>
          <button
            @click="saveProduct"
            :disabled="!isFormValid"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50"
          >
            {{ isEditing ? 'Aktualisieren' : 'Speichern' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiClient from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { mediaApi } from '@/api/mediaApi'
import { useKeyboardStore } from '@/stores/keyboard'
const kbStore = useKeyboardStore()

const authStore = useAuthStore()

interface Category {
  id: number
  name: string
}
interface Product {
  id: number
  name: string
  anzeigename: string
  price: number
  imagePath: string
  category: Category
}

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const showModal = ref(false)
const isEditing = ref(false)

const formData = ref({
  id: null as number | null,
  name: '',
  anzeigename: '',
  price: 0,
  categoryId: null as number | null,
  imagePath: '',
})

const displayPrice = ref(0) // Für die Eingabe in Euro
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')

const isFormValid = computed(() => {
  return formData.value.name && formData.value.categoryId && displayPrice.value >= 0
})

const fetchProducts = async () => {
  const { data } = await apiClient.get('/api/products')
  products.value = data
}

const fetchCategories = async () => {
  const { data } = await apiClient.get('/api/categories')
  categories.value = data
}

const openModal = (product?: Product) => {
  if (product) {
    isEditing.value = true
    formData.value = {
      id: product.id,
      name: product.name,
      anzeigename: product.anzeigename,
      price: product.price,
      categoryId: product.category?.id || null,
      imagePath: product.imagePath,
    }
    displayPrice.value = product.price / 100
  } else {
    isEditing.value = false
    formData.value = {
      id: null,
      name: '',
      anzeigename: '',
      price: 0,
      categoryId: null,
      imagePath: '',
    }
    displayPrice.value = 0
  }
  selectedFile.value = null
  previewUrl.value = ''
  showModal.value = true
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
    previewUrl.value = URL.createObjectURL(target.files[0])
  }
}

const saveProduct = async () => {
  try {
    // 1. Falls ein neues Bild gewählt wurde: Über den zentralen Service hochladen
    if (selectedFile.value) {
      try {
        const uploadedFilename = await mediaApi.uploadImage(selectedFile.value)
        formData.value.imagePath = uploadedFilename // Nur den Filename speichern
      } catch (imageError) {
        alert('Bild-Upload fehlgeschlagen.')
        return
      }
    }

    // 2. Preis in Cents umrechnen
    const finalPriceInCents = Math.round(displayPrice.value * 100)

    // 3. Payload zusammenbauen (Inklusive Kategorie-Objekt für Hibernate)
    const payload = {
      name: formData.value.name,
      anzeigename: formData.value.anzeigename,
      price: finalPriceInCents,
      imagePath: formData.value.imagePath,
      category: { id: formData.value.categoryId },
    }

    if (isEditing.value && formData.value.id) {
      await apiClient.put(`/api/products/${formData.value.id}`, payload)
    } else {
      await apiClient.post('/api/products', payload)
    }

    await fetchProducts()
    closeModal()
  } catch (error) {
    console.error('Fehler beim Speichern des Produkts:', error)
    alert('Speichern fehlgeschlagen.')
  }
}

const deleteProduct = async (id: number) => {
  if (confirm('Produkt wirklich löschen?')) {
    await apiClient.delete(`/api/products/${id}`)
    fetchProducts()
  }
}

const closeModal = () => {
  showModal.value = false
}

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)

onMounted(() => {
  fetchProducts()
  fetchCategories()
})
</script>