<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <header
      class="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Monatsabschluss / Saldenliste</h1>
        <p class="text-sm text-gray-500">Kontostände aller Mitglieder zum gewählten Stichtag.</p>
      </div>

      <div class="flex items-center gap-4">
        <label for="stichtag-input"  class="text-sm font-medium text-gray-600">Stichtag:</label>
        <input
          id="stichtag-input"
          v-model="stichtag"
          type="datetime-local"
          @change="fetchBalances"
          class="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          @click="exportToCSV"
          class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <span>📊</span> CSV Export
        </button>
      </div>
    </header>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Mitglied
            </th>
            <th
              class="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right"
            >
              Kontostand
            </th>
            <th
              class="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-center"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="user in balances" :key="user.userId" class="hover:bg-gray-50 transition">
            <td class="px-6 py-4 font-medium text-gray-800">{{ user.username }}</td>
            <td
              class="px-6 py-4 text-right font-mono"
              :class="user.balanceInCents < 0 ? 'text-red-600 font-bold' : 'text-emerald-600'"
            >
              {{ formatCurrency(user.balanceInCents) }}
            </td>
            <td class="px-6 py-4 text-center">
              <span
                v-if="user.balanceInCents < 0"
                class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold"
                >Zahlung fällig</span
              >
              <span
                v-else
                class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-bold"
                >Gedeckt</span
              >
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-gray-50 font-bold">
          <tr>
            <td class="px-6 py-4">Gesamtforderungen / Guthaben</td>
            <td class="px-6 py-4 text-right underline">{{ formatCurrency(totalSum) }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiClient from '@/api/client'
import type { UserBalance } from '@/types'

const stichtag = ref(new Date().toISOString().slice(0, 16))
const balances = ref<UserBalance[]>([])

const fetchBalances = async () => {
  try {
    const { data } = await apiClient.get('/api/accounting/balances', {
      params: { stichtag: stichtag.value },
    })
    balances.value = data
  } catch (error) {
    console.error('Fehler beim Laden der Salden')
  }
}

const totalSum = computed(() => {
  return balances.value.reduce((sum, item) => sum + item.balanceInCents, 0)
})

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

const exportToCSV = () => {
  let csv = 'Mitglied;Kontostand\n'
  balances.value.forEach((u) => {
    csv += `${u.username};${(u.balanceInCents / 100).toFixed(2).replace('.', ',')} €\n`
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `Saldenliste_${stichtag.value.slice(0, 10)}.csv`
  link.click()
}

onMounted(fetchBalances)
</script>
