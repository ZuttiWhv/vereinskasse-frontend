<template>
  <div class="p-4 border rounded-lg flex items-center justify-between hover:border-emerald-200 transition">
    <div class="flex items-center gap-3">
      <span class="text-2xl">{{ icon }}</span>
      <div>
        <p class="font-semibold text-gray-800">{{ title }}</p>
        <p class="text-xs text-gray-500">{{ description }}</p>
      </div>
    </div>
    <button
      @click="download"
      :disabled="isLoading"
      class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-semibold disabled:opacity-50"
    >
      {{ isLoading ? '...' : 'Download' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import apiClient from '@/api/client'

const props = defineProps<{ title: string, description: string, icon: string, endpoint: string, filename: string }>()
const isLoading = ref(false)

const download = async () => {
  isLoading.value = true
  try {
    const response = await apiClient.get(props.endpoint, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', props.filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    alert('Download fehlgeschlagen.')
  } finally {
    isLoading.value = false
  }
}
</script>