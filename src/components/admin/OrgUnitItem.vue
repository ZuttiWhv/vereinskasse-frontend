<template>
  <div class="ml-4 border-l-2 border-emerald-100 pl-4 py-1">
    <div
      class="flex items-center justify-between group bg-white p-2 rounded-lg hover:shadow-sm transition border border-transparent hover:border-emerald-200"
    >
      <div class="flex items-center gap-2">
        <span class="text-emerald-600">📁</span>
        <span class="font-medium text-gray-700">{{ unit.name }}</span>
      </div>

      <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button
          @click="$emit('add', unit)"
          class="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100"
        >
          + Untergruppe
        </button>
        <button
          @click="$emit('delete', unit.id)"
          class="text-xs text-red-500 hover:text-red-700 px-2 py-1"
        >
          Löschen
        </button>
      </div>
    </div>

    <div v-if="unit.subUnits && unit.subUnits.length > 0" class="mt-1">
      <OrgUnitItem
        v-for="sub in unit.subUnits"
        :key="sub.id"
        :unit="sub"
        @add="$emit('add', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ unit: any }>()
defineEmits(['add', 'delete'])
</script>
