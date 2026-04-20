<template>
  <div class="numpad-container select-none max-w-sm mx-auto">
    <div v-if="showDisplay" class="flex justify-center gap-3 mb-8">
      <div
        v-for="i in maxLength"
        :key="i"
        class="w-4 h-4 rounded-full border-2 transition-all duration-200"
        :class="[
          modelValue.length >= i
            ? 'bg-emerald-500 border-emerald-500 scale-125'
            : 'bg-transparent border-gray-300',
        ]"
      ></div>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <button
        v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
        :key="num"
        @click="press(num.toString())"
        class="h-16 w-full flex items-center justify-center bg-white text-2xl font-bold rounded-2xl border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 active:bg-gray-50 transition-all duration-75 shadow-sm text-gray-700"
      >
        {{ num }}
      </button>

      <button
        @click="backspace"
        class="h-16 w-full flex items-center justify-center bg-white text-2xl rounded-2xl border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 active:bg-gray-50 transition-all duration-75 shadow-sm text-gray-400"
      >
        ⌫
      </button>

      <button
        @click="press('0')"
        class="h-16 w-full flex items-center justify-center bg-white text-2xl font-bold rounded-2xl border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 active:bg-gray-50 transition-all duration-75 shadow-sm text-gray-700"
      >
        0
      </button>

      <button
        @click="submit"
        :disabled="modelValue.length < 4"
        class="h-16 w-full flex items-center justify-center rounded-2xl border-b-4 transition-all duration-75 shadow-sm text-white font-bold"
        :class="[
          modelValue.length < 4
            ? 'bg-gray-200 border-gray-300 opacity-50 cursor-not-allowed'
            : 'bg-emerald-500 border-emerald-600 active:border-b-0 active:translate-y-1',
        ]"
      >
        OK
      </button>
    </div>

    <button
      @click="clear"
      class="w-full mt-6 text-xs text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
    >
      Eingabe zurücksetzen
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  maxLength: { type: Number, default: 6 },
  showDisplay: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'complete'])

const hapticFeedback = (intensity = 40) => {
  if ('vibrate' in navigator) navigator.vibrate(intensity)
}

const press = (val: string) => {
  if (props.modelValue.length < props.maxLength) {
    hapticFeedback()
    const newValue = props.modelValue + val
    emit('update:modelValue', newValue)

    // AUTO-SUBMIT bei Erreichen der Maximallänge
    if (newValue.length === props.maxLength) {
      setTimeout(() => submit(), 150) // Kleiner Delay für visuelles Feedback der letzten Ziffer
    }
  }
}

const backspace = () => {
  if (props.modelValue.length > 0) {
    hapticFeedback(20)
    emit('update:modelValue', props.modelValue.slice(0, -1))
  }
}

const clear = () => {
  hapticFeedback(60)
  emit('update:modelValue', '')
}

const submit = () => {
  if (props.modelValue.length >= 4) {
    hapticFeedback(80)
    emit('complete', props.modelValue)
  }
}

// TASTATUR-STEUERUNG
const handleKeyDown = (e: KeyboardEvent) => {
  // Verhindern, dass wir Eingaben abfangen, wenn der User in einem echten Input-Feld tippt
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

  if (e.key >= '0' && e.key <= '9') {
    press(e.key)
  } else if (e.key === 'Backspace') {
    backspace()
  } else if (e.key === 'Enter') {
    submit()
  } else if (e.key === 'Escape') {
    clear()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
</script>
