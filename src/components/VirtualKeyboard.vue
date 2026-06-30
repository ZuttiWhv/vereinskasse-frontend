<template>
  <transition name="slide-up">
    <div
      v-show="kbStore.isOpen"
      :class="[
        'keyboard-container shadow-2xl',
        { 'is-numeric': kbStore.keyboardType === 'numeric' },
      ]"
    >
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
import { onMounted, watch, nextTick, onUnmounted } from 'vue'
import Keyboard from 'simple-keyboard'
import { useRoute } from 'vue-router'
import 'simple-keyboard/build/css/index.css'
import { useKeyboardStore } from '@/stores/keyboard'

const kbStore = useKeyboardStore()
const route = useRoute()
let keyboard: any = null
let isUpdatingFromOSK = false

/**
 * Hilfsfunktion: Holt das aktuell aktive HTML-Input Element aus dem DOM
 */
const getActiveInputElement = (): HTMLInputElement | HTMLTextAreaElement | null => {
  if (!kbStore.activeInputId) return null
  return document.getElementById(kbStore.activeInputId) as HTMLInputElement
}

/**
 * Passt das Scroll-Verhalten oder die Modal-Position an das OSK an
 */
const adjustScroll = async () => {
  if (!kbStore.isOpen) {
    document.body.style.paddingBottom = ''
    // Alle Modale wieder zurücksetzen, wenn die Tastatur schließt
    const modals = document.querySelectorAll(
      '.issue-modal, .modal-overlay > div',
    ) as NodeListOf<HTMLElement>
    modals.forEach((m) => {
      m.style.transform = ''
    })
    return
  }

  await nextTick()
  const keyboardEl = document.querySelector('.keyboard-container') as HTMLElement
  if (!keyboardEl) return

  const keyboardHeight = keyboardEl.offsetHeight || 300
  const paddingBuffer = 60 // Puffer erhöht für bessere Sichtbarkeit der Buttons im Modal
  const inputEl = getActiveInputElement()

  if (!inputEl) return

  // PRÜFUNG: Befindet sich das Eingabefeld in einem geöffneten Modal?
  const modalContainer = inputEl.closest('.issue-modal') as HTMLElement

  if (modalContainer) {
    // MODAL-LOGIK: Wir schieben das Modal hoch, falls die Tastatur es überlagert
    const rect = inputEl.getBoundingClientRect()
    const keyboardTop = window.innerHeight - keyboardHeight

    if (rect.bottom > keyboardTop - paddingBuffer) {
      const offset = rect.bottom - keyboardTop + paddingBuffer
      // Schiebt das Modal sanft per CSS-Translate nach oben
      modalContainer.style.transition = 'transform 0.3s ease'
      modalContainer.style.transform = `translateY(-${offset}px)`
    }
  } else {
    // STANDARD-LOGIK: Für normale Input-Felder auf der Hauptseite
    document.body.style.paddingBottom = `${keyboardHeight + paddingBuffer + 40}px`

    setTimeout(() => {
      const rect = inputEl.getBoundingClientRect()
      const visibleHeight = window.innerHeight - keyboardHeight
      const offset = rect.bottom - visibleHeight + paddingBuffer

      if (offset > 0) {
        window.scrollBy({ top: offset, behavior: 'smooth' })
      } else if (rect.top < 0) {
        window.scrollBy({ top: rect.top - 20, behavior: 'smooth' })
      }
    }, 50)
  }
}

/**
 * Synchronisiert den Wert in die Tastatur
 */
const syncToKeyboard = (value: string) => {
  if (keyboard && keyboard.getInput() !== value) {
    keyboard.setInput(value)
  }
}

/**
 * Verarbeitet die Änderung von der On-Screen-Tastatur und hält den Cursor stabil
 */
const handleOSKChange = async (input: string) => {
  const inputEl = getActiveInputElement()
  if (!inputEl) {
    kbStore.updateValue(input)
    return
  }

  const caretPos = keyboard.caretPosition ?? inputEl.selectionStart

  isUpdatingFromOSK = true
  kbStore.updateValue(input)

  await nextTick()

  if (inputEl) {
    inputEl.focus()
    inputEl.setSelectionRange(caretPos, caretPos)
  }

  isUpdatingFromOSK = false
}

const handleFocusChange = (event: FocusEvent) => {
  const target = event.target as HTMLElement
  if (!target) return

  const isWithinKeyboard = target.closest('.keyboard-container')
  const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName)
  const isSameInput = target.id === kbStore.activeInputId

  if (kbStore.isOpen && !isWithinKeyboard && (!isInput || !isSameInput)) {
    setTimeout(() => {
      const currentFocus = document.activeElement
      if (
        currentFocus &&
        !currentFocus.closest('.keyboard-container') &&
        !['INPUT', 'TEXTAREA'].includes(currentFocus.tagName)
      ) {
        kbStore.close()
      }
    }, 100)
  }
}

const handlePhysicalInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target && target.id === kbStore.activeInputId) {
    syncToKeyboard(target.value)
    if (keyboard) {
      keyboard.setCaretPosition(target.selectionStart)
    }
  }
}

const handlePointerUp = (event: PointerEvent) => {
  const target = event.target as HTMLInputElement
  if (target.id === kbStore.activeInputId && keyboard) {
    keyboard.setCaretPosition(target.selectionStart)
  }
}

const handleOutsideClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (
    kbStore.isOpen &&
    !target.closest('.keyboard-container') &&
    !['INPUT', 'TEXTAREA'].includes(target.tagName)
  ) {
    kbStore.close()
  }
}

// Beobachte das Öffnen/Schließen und Feldwechsel für das Scrolling
watch(
  () => [kbStore.isOpen, kbStore.activeInputId],
  () => {
    adjustScroll()
  },
)

watch(
  () => kbStore.keyboardType,
  (newType) => {
    if (keyboard) keyboard.setOptions({ layoutName: newType })
  },
)

// Schließt die Tastatur automatisch bei jedem Seitenwechsel / Router-Wechsel
watch(
  () => route.path,
  () => {
    if (kbStore.isOpen) {
      kbStore.close()
    }
  },
)

watch(
  () => kbStore.activeInputId,
  async (newId) => {
    if (newId && keyboard) {
      await nextTick()
      const inputEl = getActiveInputElement()
      if (inputEl) {
        keyboard.setInput(inputEl.value)
        keyboard.setCaretPosition(inputEl.selectionStart)
      }
    } else {
      syncToKeyboard(kbStore.inputValue || '')
    }
  },
)

watch(
  () => kbStore.inputValue,
  (newVal) => {
    if (!isUpdatingFromOSK) syncToKeyboard(newVal || '')
  },
)

onMounted(async () => {
  globalThis.addEventListener('mousedown', handleOutsideClick)
  globalThis.addEventListener('focusin', handleFocusChange)
  globalThis.addEventListener('input', handlePhysicalInput)
  globalThis.addEventListener('pointerup', handlePointerUp)

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
        onChange: (input: string) => handleOSKChange(input),
        onKeyPress: (button: string) => {
          if (button === '{shift}' || button === '{lock}') handleShift()
          if (button === '{ent}') kbStore.close()
        },
        preventMouseDownDefault: true,
        disableCaretPositioning: false,
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
          numeric: ['1 2 3', '4 5 6', '7 8 9', '{backspace} 0 .', '00 {ent}'],
        },
        display: {
          '{ent}': 'Fertig ✔',
          '{backspace}': '⌫',
          '{numbers}': '123',
          '{shift}': '⇧',
          '{space}': 'Leertaste',
        },
      })
      syncToKeyboard(kbStore.inputValue || '')
    } catch (err) {
      console.error('Keyboard Init fehlgeschlagen:', err)
    }
  }
})

onUnmounted(() => {
  globalThis.removeEventListener('mousedown', handleOutsideClick)
  globalThis.removeEventListener('focusin', handleFocusChange)
  globalThis.removeEventListener('input', handlePhysicalInput)
  globalThis.removeEventListener('pointerup', handlePointerUp)
  document.body.style.paddingBottom = ''
})

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
.is-numeric {
  max-width: 400px;
  left: 50% !important;
  transform: translateX(-50%);
  border-radius: 20px 20px 0 0;
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
