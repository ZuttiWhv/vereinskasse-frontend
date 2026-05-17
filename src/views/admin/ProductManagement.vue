<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Produkte verwalten</h1>
        <p class="text-sm text-gray-500">Preise, Bilder, Kategorien und Barcodes deiner Artikel</p>
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
              <th class="px-6 py-4 font-semibold">Barcodes</th>
              <th class="px-6 py-4 font-semibold">Status</th>
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
              :class="{ 'opacity-60 bg-gray-50': !product.active }"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <img
                  :src="mediaApi.getImageUrl(product.imagePath, 100)"
                  class="h-12 w-12 rounded-lg object-cover border bg-gray-50"
                  :class="{ grayscale: !product.active }"
                  alt="Produkt"
                />
              </td>
              <td class="px-6 py-4">
                <div class="font-bold text-gray-900">{{ product.anzeigename || product.name }}</div>
                <div class="text-xs text-gray-400 font-mono">{{ product.name }}</div>
              </td>
              <td class="px-6 py-4">
                <div
                  v-if="product.barcodes && product.barcodes.length > 0"
                  class="flex flex-wrap gap-1 max-w-[220px]"
                >
                  <div
                    v-for="code in product.barcodes"
                    :key="code"
                    class="flex items-center gap-1 text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded font-mono text-[11px]"
                  >
                    <span>🏷️</span>
                    <span>{{ code }}</span>
                  </div>
                </div>
                <span v-else class="text-gray-300 text-xs italic">Keine Barcodes</span>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="product.active"
                  class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold"
                >
                  Auf Vorrat
                </span>
                <span v-else class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                  Leer / Inaktiv
                </span>
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
              <label for="product-name" class="block text-sm font-medium text-gray-700 mb-1"
                >Interner Name (eindeutig)</label
              >
              <input
                id="product-name"
                :class="{ 'input-keyboard-active': kbStore.activeInputId === 'product-name' }"
                @focus="kbStore.open('product-name', formData.name)"
                v-model="formData.name"
                type="text"
                class="w-full px-4 py-2 border rounded-lg outline-none"
                placeholder="z.B. pils_033"
              />
            </div>
            <div>
              <label for="product-showname" class="block text-sm font-medium text-gray-700 mb-1">Anzeigename</label>
              <input
                v-model="formData.anzeigename"
                id="product-showname"
                @focus="kbStore.open('product-showname', formData.anzeigename)"
                :class="{ 'input-keyboard-active': kbStore.activeInputId === 'product-showname' }"
                type="text"
                class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. Pils 0,33l"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="product-price" class="block text-sm font-medium text-gray-700 mb-1">Preis (€)</label>
              <input
                v-model="displayPrice"
                id="product-price"
                @focus="kbStore.open('product-price', String(displayPrice), 'numeric')"
                :class="{ 'input-keyboard-active': kbStore.activeInputId === 'product-price' }"
                type="text"
                inputmode="decimal"
                class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="category-selection" class="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <select
                id="category-selection"
                v-model="formData.categoryId"
                class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 bg-white"
              >
                <option :value="null" disabled>Bitte wählen...</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="p-4 bg-blue-50/50 border border-blue-100 rounded-lg space-y-3">
            <label class="block text-sm font-bold text-blue-800">Produkt-Barcodes (EAN)</label>
            <div class="flex gap-2">
              <input
                id="product-barcode"
                v-model="newBarcode"
                @focus="kbStore.open('product-barcode', newBarcode, 'numeric')"
                :class="{ 'input-keyboard-active': kbStore.activeInputId === 'product-barcode' }"
                type="text"
                class="flex-1 px-4 py-2 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                placeholder="Barcode scannen oder eingeben..."
                @keydown.enter.prevent="addBarcode"
              />
              <button
                type="button"
                @click="addBarcode"
                class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-xl flex items-center justify-center shadow-sm"
                title="Barcode hinzufügen"
              >
                +
              </button>
            </div>
            <p class="text-[10px] text-blue-600">
              Tipp: Klicke in das Feld und scanne. Drücke das „+“ oder Enter, um den Code an dieses
              Produkt zu binden.
            </p>

            <div
              v-if="formData.barcodes.length > 0"
              class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2"
            >
              <div
                v-for="code in formData.barcodes"
                :key="code"
                class="flex items-center justify-between bg-white border border-blue-100 rounded-lg px-3 py-1.5 shadow-sm animate-in fade-in duration-150"
              >
                <span class="font-mono text-xs text-gray-700 font-bold">🏷️ {{ code }}</span>
                <button
                  type="button"
                  @click="removeBarcode(code)"
                  class="text-gray-400 hover:text-red-500 p-1 transition"
                  title="Barcode löschen"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400 italic text-center py-1">
              Noch keine Barcodes für dieses Produkt hinterlegt.
            </p>
          </div>

          <div
            class="p-4 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-bold text-gray-800">Auf Vorrat (Aktiv)</p>
              <p class="text-xs text-gray-500">
                Wenn deaktiviert, können User das Produkt nicht mehr kaufen.
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="formData.active" class="sr-only peer" />
              <div
                class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"
              ></div>
            </label>
          </div>

          <div>
            <label for="product-image" class="block text-sm font-medium text-gray-700 mb-1">Produktbild</label>
            <div
              class="flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-lg"
            >
              <img
                id="product-image"
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
  barcodes: string[] // GEÄNDERT: Array statt einzelner String
  imagePath: string
  category: Category
  active: boolean
}

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const showModal = ref(false)
const isEditing = ref(false)

// GEÄNDERT: Für temporäre Eingaben im Modal-Feld
const newBarcode = ref('')

const formData = ref({
  id: null as number | null,
  name: '',
  anzeigename: '',
  price: 0,
  barcodes: [] as string[], // GEÄNDERT: Array statt String | null
  categoryId: null as number | null,
  imagePath: '',
  active: true,
})

const displayPrice = ref(0)
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')

const isFormValid = computed(() => {
  return formData.value.name && formData.value.categoryId && displayPrice.value >= 0
})

// NEU: Fügt einen Barcode aus dem Eingabefeld der Liste hinzu
const addBarcode = () => {
  const code = newBarcode.value.trim()
  if (code && !formData.value.barcodes.includes(code)) {
    formData.value.barcodes.push(code)
    newBarcode.value = ''
    // Virtuelles Keyboard zurücksetzen, falls offen
    if (kbStore.activeInputId === 'product-barcode') {
      kbStore.open('product-barcode', '', 'numeric')
    }
  }
}

// NEU: Entfernt einen Barcode aus der Liste (Mülltonnen-Aktion)
const removeBarcode = (codeToRemove: string) => {
  formData.value.barcodes = formData.value.barcodes.filter((code) => code !== codeToRemove)
}

const fetchProducts = async () => {
  const { data } = await apiClient.get('/api/products')
  products.value = data
}

const fetchCategories = async () => {
  const { data } = await apiClient.get('/api/categories')
  categories.value = data
}

const openModal = (product?: Product) => {
  newBarcode.value = '' // Eingabefeld leeren
  if (product) {
    isEditing.value = true
    formData.value = {
      id: product.id,
      name: product.name,
      anzeigename: product.anzeigename,
      price: product.price,
      barcodes: product.barcodes ? [...product.barcodes] : [], // GEÄNDERT: Array klonen
      categoryId: product.category?.id || null,
      imagePath: product.imagePath,
      active: product.active,
    }
    displayPrice.value = product.price / 100
  } else {
    isEditing.value = false
    formData.value = {
      id: null,
      name: '',
      anzeigename: '',
      price: 0,
      barcodes: [], // GEÄNDERT: Array initial leer
      categoryId: null,
      imagePath: '',
      active: true,
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
    // Bevor wir speichern, prüfen wir ob noch ungespeicherter Text im Barcodefeld steht
    if (newBarcode.value.trim()) {
      addBarcode()
    }

    if (selectedFile.value) {
      try {
        const uploadedFilename = await mediaApi.uploadImage(selectedFile.value)
        formData.value.imagePath = uploadedFilename
      } catch (imageError) {
        alert('Bild-Upload fehlgeschlagen.')
        return
      }
    }

    const finalPriceInCents = Math.round(displayPrice.value * 100)

    const payload = {
      name: formData.value.name,
      anzeigename: formData.value.anzeigename,
      price: finalPriceInCents,
      barcodes: formData.value.barcodes, // GEÄNDERT: Sendet das vollständige Array
      imagePath: formData.value.imagePath,
      categoryId: formData.value.categoryId,
      active: formData.value.active,
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
  if (
    confirm(
      'Dieses Produkt wirklich löschen? Es wird ausgeblendet und steht für den Verkauf nicht mehr zur Verfügung.',
    )
  ) {
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
