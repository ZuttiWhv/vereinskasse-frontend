<template>
  <div class="history-view">
    <header class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold text-gray-800">Meine Abrechnungen</h1>
      <router-link to="/" class="text-blue-600 hover:underline">← Zurück zum Shop</router-link>
    </header>

    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Von</label>
          <input
            type="date"
            v-model="startDate"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Bis</label>
          <input
            type="date"
            v-model="endDate"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-gray-500">Lade Abrechnungsdaten...</div>

    <div
      v-else-if="transactions.length === 0"
      class="bg-gray-50 rounded-xl py-12 text-center border-2 border-dashed"
    >
      <p class="text-gray-500">In diesem Zeitraum wurden keine Transaktionen gefunden.</p>
    </div>

    <div v-else class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          class="bg-blue-600 text-white p-6 rounded-xl shadow-md flex justify-between items-center"
        >
          <span class="text-lg opacity-90">Ausgaben:</span>
          <span class="text-2xl font-bold">{{ formatPrice(totalSales) }}</span>
        </div>
        <div
          class="bg-emerald-600 text-white p-6 rounded-xl shadow-md flex justify-between items-center"
        >
          <span class="text-lg opacity-90">Einzahlungen:</span>
          <span class="text-2xl font-bold">{{ formatPrice(totalDeposits) }}</span>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase">
              <th class="px-6 py-4 font-semibold">Datum</th>
              <th class="px-6 py-4 font-semibold">Beschreibung</th>
              <th class="px-6 py-4 font-semibold text-center">Menge</th>
              <th class="px-6 py-4 font-semibold text-right">Betrag</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="item in transactions"
              :key="item.type + item.id"
              class="hover:bg-gray-50 transition"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ formatDate(item.date) }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span
                    v-if="item.type === 'DEPOSIT'"
                    class="text-emerald-500 text-xs font-bold uppercase tracking-wider"
                    >Einzahlung</span
                  >
                  <span class="font-medium text-gray-900">{{ item.description }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span v-if="item.type === 'SALE'" class="bg-gray-100 px-2 py-1 rounded text-sm"
                  >{{ item.amount }}x</span
                >
                <span v-else class="text-gray-400">—</span>
              </td>
              <td
                class="px-6 py-4 text-right font-bold"
                :class="item.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-gray-800'"
              >
                {{ item.type === 'DEPOSIT' ? '+' : '-' }} {{ formatPrice(item.totalPrice) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import apiClient from '@/api/client.ts'

const transactions = ref<any[]>([])
const isLoading = ref(false)

const toIsoDate = (date: Date) => date.toISOString().split('T')[0]
const today = new Date()
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

const startDate = ref(toIsoDate(firstDayOfMonth))
const endDate = ref(toIsoDate(today))

// Berechnete Summen
const totalSales = computed(() => {
  return transactions.value
    .filter((t) => t.type === 'SALE')
    .reduce((acc, t) => acc + t.totalPrice, 0)
})

const totalDeposits = computed(() => {
  return transactions.value
    .filter((t) => t.type === 'DEPOSIT')
    .reduce((acc, t) => acc + t.totalPrice, 0)
})

const fetchHistory = async () => {
  if (!startDate.value || !endDate.value) return
  isLoading.value = true

  try {
    const startIso = `${startDate.value}T00:00:00`
    const endIso = `${endDate.value}T23:59:59`

    // Wir rufen den neuen kombinierten Endpoint ab
    const { data } = await apiClient.get('/api/accounting', {
      params: { start: startIso, end: endIso },
    })

    // Erwartet wird ein Array von TransactionDTO:
    // { id, type, description, amount, totalPrice, date }
    transactions.value = data
  } catch (error) {
    console.error('Historie laden fehlgeschlagen', error)
  } finally {
    isLoading.value = false
  }
}

watch([startDate, endDate], () => fetchHistory())
onMounted(fetchHistory)

const formatPrice = (cents: number) => {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
