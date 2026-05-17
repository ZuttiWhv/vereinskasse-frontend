<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import apiClient from '@/api/client'

interface VoucherStat {
  userId: number
  userName: string
  totalIssuedValue: number // Wert der spendierten Runden (in Cent)
  totalRedeemedValue: number // Wert der erhaltenen/eingelösten Waren (in Cent)
  issuedCount: number
  redeemedCount: number
}

const stats = ref<VoucherStat[]>([])
const isLoading = ref(false)

// Filter-Zeitraum (Standard: Aktueller Monat)
const dateFrom = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
)
const dateTo = ref(new Date().toISOString().split('T')[0])

const fetchStats = async () => {
  isLoading.value = true
  try {
    const { data } = await apiClient.get<VoucherStat[]>('/api/vouchers/stats', {
      params: { from: dateFrom.value, to: dateTo.value },
    })
    stats.value = data
  } catch (error) {
    console.error('Fehler beim Laden der Statistik', error)
    alert('Statistiken konnten nicht geladen werden.')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchStats)

const formatPrice = (cents: number) => {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

// Sortierung: Wer am meisten spendiert hat, steht oben
const sortedStats = computed(() => {
  return [...stats.value].sort((a, b) => b.totalIssuedValue - a.totalIssuedValue)
})
</script>

<template>
  <div class="admin-container">
    <header class="stats-header">
      <h1>Voucher-Statistik 📊</h1>
      <p>Wer ist der größte Gönner?</p>
    </header>

    <section class="filter-bar">
      <div class="input-group">
        <label for="dateFrom">Von:</label>
        <input id="dateFrom" type="date" v-model="dateFrom" @change="fetchStats" />
      </div>
      <div class="input-group">
        <label for="dateTo">Bis:</label>
        <input id="dateTo" type="date" v-model="dateTo" @change="fetchStats" />
      </div>
      <button class="btn-refresh" @click="fetchStats" :disabled="isLoading">
        {{ isLoading ? 'Lädt...' : 'Aktualisieren' }}
      </button>
    </section>

    <div v-if="isLoading" class="loader">Werte werden berechnet...</div>

    <div v-else class="table-container">
      <table class="stats-table">
        <thead>
          <tr>
            <th>Benutzer</th>
            <th>Spendiert (Wert)</th>
            <th>Spendiert (Anzahl)</th>
            <th>Erhalten (Wert)</th>
            <th>Erhalten (Anzahl)</th>
            <th>Bilanz</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in sortedStats" :key="user.userId">
            <td class="font-bold">{{ user.userName }}</td>
            <td class="text-green">{{ formatPrice(user.totalIssuedValue) }}</td>
            <td>{{ user.issuedCount }}x</td>
            <td class="text-blue">{{ formatPrice(user.totalRedeemedValue) }}</td>
            <td>{{ user.redeemedCount }}x</td>
            <td
              :class="
                user.totalIssuedValue - user.totalRedeemedValue >= 0 ? 'text-green' : 'text-red'
              "
            >
              {{ formatPrice(user.totalIssuedValue - user.totalRedeemedValue) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="stats.length === 0" class="empty-hint">
        Keine Daten für diesen Zeitraum gefunden.
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: sans-serif;
}

.stats-header {
  margin-bottom: 2rem;
}
.stats-header h1 {
  color: #2d3748;
  font-size: 2rem;
}

.filter-bar {
  display: flex;
  gap: 1.5rem;
  background: #f7fafc;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  align-items: flex-end;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4a5568;
}
.input-group input {
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.btn-refresh {
  background: #3182ce;
  color: white;
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.table-container {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.stats-table th {
  background: #edf2f7;
  padding: 1rem;
  color: #4a5568;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.stats-table td {
  padding: 1rem;
  border-bottom: 1px solid #edf2f7;
  color: #2d3748;
}

.font-bold {
  font-weight: 700;
}
.text-green {
  color: #38a169;
  font-weight: 600;
}
.text-blue {
  color: #3182ce;
  font-weight: 600;
}
.text-red {
  color: #e53e3e;
  font-weight: 600;
}

.empty-hint {
  padding: 3rem;
  text-align: center;
  color: #a0aec0;
}
.loader {
  text-align: center;
  padding: 3rem;
  color: #718096;
}
</style>
