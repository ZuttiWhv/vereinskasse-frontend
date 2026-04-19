<template>
  <div class="max-w-4xl mx-auto p-6">
    <header class="mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Organisationsstruktur</h1>
        <p class="text-gray-500">Verwalte die Hierarchie deiner Abteilungen.</p>
      </div>
      <button
        @click="openModal(null)"
        class="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-emerald-700 transition"
      >
        Hauptgruppe erstellen
      </button>
    </header>

    <div class="bg-gray-50 p-6 rounded-2xl border border-gray-100 min-h-[400px]">
      <div v-if="orgTree.length === 0" class="text-center py-20 text-gray-400">
        Noch keine Einheiten angelegt. Starte mit einer Hauptgruppe.
      </div>
      <OrgUnitItem
        v-for="unit in orgTree"
        :key="unit.id"
        :unit="unit"
        @add="openModal"
        @delete="confirmDelete"
      />
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 class="text-xl font-bold mb-2">
          {{ selectedParent ? `Untergruppe für ${selectedParent.name}` : 'Neue Hauptgruppe' }}
        </h2>
        <p class="text-sm text-gray-500 mb-6">Gib einen Namen für die Organisationseinheit ein.</p>

        <input
          v-model="newUnitName"
          @keyup.enter="saveUnit"
          type="text"
          class="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-emerald-500 transition mb-6"
          placeholder="Name, z.B. Jugendfußball"
          autoFocus
        />

        <div class="flex justify-end gap-3">
          <button @click="showModal = false" class="px-4 py-2 text-gray-500 font-medium">
            Abbrechen
          </button>
          <button
            @click="saveUnit"
            :disabled="!newUnitName"
            class="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '@/api/client'
import OrgUnitItem from '@/components/admin/OrgUnitItem.vue'

const orgTree = ref([])
const showModal = ref(false)
const newUnitName = ref('')
const selectedParent = ref<any>(null)

const fetchTree = async () => {
  // Wir nutzen hier den Admin-Endpunkt, der den Baum liefert
  const { data } = await apiClient.get('/api/org-units/admin-tree')
  orgTree.value = data
}

const openModal = (parent: any = null) => {
  selectedParent.value = parent
  newUnitName.value = ''
  showModal.value = true
}

const saveUnit = async () => {
  try {
    await apiClient.post('/api/org-units', {
      name: newUnitName.value,
      parentId: selectedParent.value ? selectedParent.value.id : null,
    })
    showModal.value = false
    fetchTree()
  } catch (e) {
    alert('Fehler beim Speichern')
  }
}

const confirmDelete = async (id: number) => {
  if (
    confirm(
      'Möchtest du diese Einheit wirklich löschen? Alle Untergruppen werden ebenfalls gelöscht.',
    )
  ) {
    await apiClient.delete(`/api/org-units/${id}`)
    fetchTree()
  }
}

onMounted(fetchTree)
</script>
