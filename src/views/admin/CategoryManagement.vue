<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800">Kategorien verwalten</h1>
      <button
        v-if="authStore.hasAuthority('WRITE_CATEGORY')"
        @click="openModal()"
        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow"
      >
        + Neue Kategorie
      </button>
    </div>

    <div class="bg-white shadow rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bild</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="cat in categories" :key="cat.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <img
                :src="mediaApi.getImageUrl(cat.imagePath, 100)"
                alt="Category"
                class="h-10 w-10 rounded-full object-cover border bg-gray-100"
              />
            </td>
            <td class="px-6 py-4 font-medium text-gray-900">{{ cat.name }}</td>
            <td class="px-6 py-4 text-right space-x-2">
              <button
                v-if="authStore.hasAuthority('WRITE_CATEGORY')"
                @click="openModal(cat)"
                class="text-blue-600 hover:text-blue-900 text-sm font-semibold"
              >
                Bearbeiten
              </button>
              <button
                v-if="authStore.hasAuthority('DELETE_CATEGORY')"
                @click="confirmDelete(cat)"
                class="text-red-600 hover:text-red-900 text-sm font-semibold"
              >
                Löschen
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">
          {{ editingId ? 'Kategorie bearbeiten' : 'Neue Kategorie' }}
        </h2>

        <form @submit.prevent="saveCategory">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Name der Kategorie</label>
            <input
              v-model="form.name"
              type="text"
              :class="[
                'mt-1 block w-full border rounded-md shadow-sm p-2 focus:ring-blue-500',
                apiErrors.name ? 'border-red-500' : 'border-gray-300',
              ]"
              required
            />
            <p v-if="apiErrors.name" class="text-red-500 text-xs mt-1">
              {{ apiErrors.name }}
            </p>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700">Kategorie-Bild (Optional)</label>
            <input
              type="file"
              @change="onFileSelected"
              accept="image/*"
              class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/client'
import { mediaApi } from '@/api/mediaApi'

const authStore = useAuthStore()
const categories = ref<any[]>([])
const showModal = ref(false)
const editingId = ref<number | null>(null)
const form = ref<{ name: string; imagePath?: string }>({
  name: '',
  imagePath: '',
})
const apiErrors = ref<Record<string, string>>({})
const selectedFile = ref<File | null>(null)

const fetchCategories = async () => {
  try {
    const { data } = await apiClient.get('/api/categories')
    categories.value = data
  } catch (e) {
    console.error('Fehler beim Laden', e)
  }
}

const onFileSelected = (event: any) => {
  selectedFile.value = event.target.files[0]
}

const openModal = (cat: any = null) => {
  apiErrors.value = {}
  selectedFile.value = null

  if (cat) {
    editingId.value = cat.id

    form.value = {
      name: cat.name,
      imagePath: cat.imagePath || '',
    }
  } else {
    editingId.value = null
    form.value = {
      name: '',
      imagePath: '',
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  apiErrors.value = {}
  selectedFile.value = null
}

const saveCategory = async () => {
  apiErrors.value = {}

  try {
    // 1. Wenn ein neues Bild ausgewählt wurde, laden wir es ZUERST hoch
    if (selectedFile.value) {
      try {
        // Der Service liefert uns den reinen Dateinamen zurück
        const uploadedFilename = await mediaApi.uploadImage(selectedFile.value)
        // Wir setzen ihn in unser Formular-Objekt
        form.value.imagePath = uploadedFilename
      } catch (imageError) {
        console.error('Bild-Upload fehlgeschlagen:', imageError)
        alert('Bild konnte nicht hochgeladen werden.')
        return // Abbrechen, da Bild fehlerhaft
      }
    }

    // 2. Jetzt einfach die Kategorie als normales JSON speichern (Create oder Update)
    if (editingId.value) {
      await apiClient.put(`/api/categories/${editingId.value}`, form.value)
    } else {
      await apiClient.post('/api/categories', form.value)
    }

    closeModal()
    await fetchCategories()
  } catch (error: any) {
    if (error.response && error.response.status === 400) {
      apiErrors.value = error.response.data
    } else {
      console.error('Speicherfehler:', error)
      alert('Speichern der Kategorie fehlgeschlagen.')
    }
  }
}

const confirmDelete = async (cat: any) => {
  if (confirm(`Soll die Kategorie "${cat.name}" wirklich gelöscht werden?`)) {
    try {
      await apiClient.delete(`/api/categories/${cat.id}`)
      await fetchCategories()
    } catch (e) {
      alert('Löschen fehlgeschlagen. Vielleicht sind noch Produkte zugeordnet?')
    }
  }
}

onMounted(fetchCategories)
</script>
