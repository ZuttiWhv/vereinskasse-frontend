<template>
  <transition name="slide-up">
    <div v-show="kbStore.isOpen" class="keyboard-container shadow-2xl">
      <div class="flex justify-between items-center bg-gray-100 px-4 py-3 border-t border-gray-300">
        <div class="flex flex-col">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
            >Eingabe-Modus</span
          >
          <span class="text-xs text-gray-600 font-medium">Auto-Detect</span>
        </div>
        <button
          type="button"
          @click="kbStore.close()"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-1.5 rounded-full text-sm font-bold shadow-md transition-colors"
        >
          Fertig ✔
        </button>
      </div>

      <div class="simple-keyboard"></div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onMounted, watch, nextTick } from 'vue'
import Keyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'
import { useKeyboardStore } from '@/stores/keyboard'

const kbStore = useKeyboardStore()
let keyboard: any = null

onMounted(async () => {
  await nextTick()

  let KeyboardClass: any = Keyboard
  if (
    KeyboardClass &&
    (KeyboardClass.__esModule || KeyboardClass[Symbol.toStringTag] === 'Module')
  ) {
    KeyboardClass = KeyboardClass.default || KeyboardClass.SimpleKeyboard
  }

  if (typeof KeyboardClass === 'function') {
    try {
      keyboard = new KeyboardClass('.simple-keyboard', {
        onChange: (input: string) => {
          kbStore.updateValue(input)
        },
        onKeyPress: (button: string) => {
          if (button === '{shift}' || button === '{lock}') {
            handleShift()
          }
          if (button === '{ent}') {
            kbStore.close()
          }
        },

        // Verhindert, dass das Eingabefeld den Fokus verliert
        preventMouseDownDefault: true,

        layout: {
          default: [
            '1 2 3 4 5 6 7 8 9 0 ß {backspace}',
            'q w e r t z u i o p ü',
            'a s d f g h j k l ö ä',
            '{shift} y x c v b n m , .',
            '{numbers} {space} {ent}',
          ],
          shift: [
            '! " § $ % & / ( ) = ? {backspace}',
            'Q W E R T Z U I O P Ü',
            'A S D F G H J K L Ö Ä',
            '{shift} Y X C V B N M ; :',
            '{numbers} {space} {ent}',
          ],
        },

        display: {
          '{ent}': 'Enter ↵',
          '{backspace}': '⌫',
          '{numbers}': '123',
          '{shift}': '⇧',
          '{space}': 'Leertaste',
        },
      })
    } catch (err) {
      console.error('Keyboard Init fehlgeschlagen:', err)
    }
  }
})

// Synchronisiert die Tastatur, wenn ein neues Feld angeklickt wird
watch(
  () => kbStore.activeInputId,
  (newId) => {
    if (newId && keyboard) {
      keyboard.setInput(kbStore.inputValue)
    }
  },
)

// Synchronisiert manuelle Änderungen (z.B. wenn Vue das Feld leert)
watch(
  () => kbStore.inputValue,
  (newVal) => {
    if (keyboard && newVal !== keyboard.getInput()) {
      keyboard.setInput(newVal)
    }
  },
)

const handleShift = () => {
  const currentLayout = keyboard.options.layoutName
  keyboard.setOptions({
    layoutName: currentLayout === 'default' ? 'shift' : 'default',
  })
}
</script>

<style scoped>
.keyboard-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: #f3f4f6;
  min-height: 280px;
  user-select: none;
}

:deep(.simple-keyboard) {
  background-color: #f3f4f6 !important;
  border-radius: 0 !important;
  padding: 10px !important;
}

:deep(.hg-button) {
  height: 52px !important;
  background: white !important;
  border-bottom: 3px solid #cbd5e1 !important;
  border-radius: 6px !important;
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  color: #1e293b !important;
}

:deep(.hg-button:active) {
  background: #e2e8f0 !important;
  transform: translateY(2px);
  border-bottom-width: 1px !important;
}

:deep(.hg-button-shift),
:deep(.hg-button-backspace),
:deep(.hg-button-numbers),
:deep(.hg-button-ent) {
  background: #e2e8f0 !important;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
