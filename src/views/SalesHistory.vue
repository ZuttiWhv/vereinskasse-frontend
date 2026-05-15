<template>
  <div class="history-view">
    <header class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold text-gray-800">Meine Abrechnungen</h1>
      <router-link to="/" class="text-blue-600 hover:underline">← Zurück zum Shop</router-link>
    </header>

    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="start-date" class="block text-sm font-medium text-gray-700 mb-2">Von</label>
          <input
            id="start-date"
            type="date"
            v-model="startDate"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label for="end-date" class="block text-sm font-medium text-gray-700 mb-2">Bis</label>
          <input
            id="end-date"
            type="date"
            v-model="endDate"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-gray-500">
      <div
        class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full mb-4"
      ></div>
      <p>Lade Abrechnungsdaten...</p>
    </div>

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
          <div>
            <span class="text-sm opacity-80 block uppercase font-bold tracking-wider"
              >Gesamtausgaben</span
            >
            <span class="text-2xl font-bold">{{ formatPrice(totalExpenses) }}</span>
          </div>
          <span class="text-3xl">📉</span>
        </div>
        <div
          class="bg-emerald-600 text-white p-6 rounded-xl shadow-md flex justify-between items-center"
        >
          <div>
            <span class="text-sm opacity-80 block uppercase font-bold tracking-wider"
              >Einzahlungen</span
            >
            <span class="text-2xl font-bold">{{ formatPrice(totalDeposits) }}</span>
          </div>
          <span class="text-3xl">📈</span>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase tracking-wider"
              >
                <th class="px-6 py-4 font-bold">Datum</th>
                <th class="px-6 py-4 font-bold">Typ</th>
                <th class="px-6 py-4 font-bold">Beschreibung</th>
                <th class="px-6 py-4 font-bold text-center">Menge</th>
                <th class="px-6 py-4 font-bold text-right">Betrag</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="item in transactions"
                :key="item.type + item.id"
                class="hover:bg-gray-50/80 transition"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(item.date) }}
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="getTypeStyles(item.type)"
                    class="text-[10px] px-2 py-1 rounded-full font-black uppercase border"
                  >
                    {{ getTypeLabel(item.type) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <span class="font-bold text-gray-900">{{ item.description }}</span>
                    <span v-if="item.type === 'VOUCHER'" class="text-xs text-purple-600 font-medium"
                      >Spende für die Gemeinschaft</span
                    >
                    <span
                      v-if="item.type === 'REDEEM'"
                      class="text-xs text-blue-500 font-medium italic"
                      >Kostenlos eingelöst</span
                    >
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <span
                    v-if="item.type !== 'DEPOSIT'"
                    class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold"
                  >
                    {{ item.amount }}x
                  </span>
                  <span v-else class="text-gray-300">—</span>
                </td>
                <td class="px-6 py-4 text-right font-mono font-bold" :class="getAmountClass(item)">
                  {{ getAmountPrefix(item.type) }} {{ formatPrice(item.totalPrice) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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

// Gesamte Ausgaben (SALE + VOUCHER)
const totalExpenses = computed(() => {
  return transactions.value
    .filter((t) => t.type === 'SALE' || t.type === 'VOUCHER')
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
    const { data } = await apiClient.get('/api/accounting', {
      params: { start: startIso, end: endIso },
    })
    transactions.value = data
  } catch (error) {
    console.error('Historie laden fehlgeschlagen', error)
  } finally {
    isLoading.value = false
  }
}

// Hilfsfunktionen für das UI
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'DEPOSIT':
      return 'Einzahlung'
    case 'VOUCHER':
      return 'Ausgegeben'
    case 'REDEEM':
      return 'Einlösung'
    case 'SALE':
      return 'Kauf'
    default:
      return type
  }
}

const getTypeStyles = (type: string) => {
  switch (type) {
    case 'DEPOSIT':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'VOUCHER':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'REDEEM':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

const getAmountPrefix = (type: string) => {
  if (type === 'DEPOSIT') return '+'
  if (type === 'REDEEM') return '±'
  return '-'
}

const getAmountClass = (item: any) => {
  if (item.type === 'DEPOSIT') return 'text-emerald-600'
  if (item.type === 'REDEEM') return 'text-blue-500'
  if (item.type === 'VOUCHER') return 'text-purple-600'
  return 'text-gray-900'
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
