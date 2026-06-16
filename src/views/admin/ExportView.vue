<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-gray-800">Daten & Exporte</h1>
      <p class="text-sm text-gray-500">Erstelle und lade wichtige PDF-Listen für deinen Verein.</p>
    </header>

    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 class="text-lg font-semibold border-b pb-2 mb-6 text-emerald-700">Scanbare Listen</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExportCard
          title="Mitglieder-Barcodes"
          description="Alle Mitglieder-IDs für das Scanner-Login."
          icon="👤"
          endpoint="/api/export/user-barcodes-pdf"
          filename="mitglieder_barcodes.pdf"
        />

        <ExportCard
          title="Produktübersicht (Standard)"
          description="Produktliste mit Bildern (2 Spalten)."
          icon="📦"
          endpoint="/api/export/product-barcodes-pdf"
          filename="produktliste.pdf"
        />

        <ExportCard
          title="Produktliste (Kompakt)"
          description="Schnelle Übersicht ohne Bilder (3 Spalten)."
          icon="📋"
          endpoint="/api/export/product-barcodes-compact-pdf"
          filename="produktliste_kompakt.pdf"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ExportCard from '@/components/ExportCard.vue'
</script>
