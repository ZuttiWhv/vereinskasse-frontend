import { defineStore } from 'pinia'

export const useKeyboardStore = defineStore('keyboard', {
  state: () => ({
    isOpen: false,
    inputValue: '',
    activeInputId: null as string | null,
    // Erkennt Android, iOS (iPhone/iPad) und Windows Phone
    isPhysicalMobile: /android|iphone|ipad|ipod|windows phone/i.test(
      navigator.userAgent.toLowerCase(),
    ),
    keyboardType: 'default',
  }),
  actions: {
    open(id: string, initialValue: string, type: 'default' | 'numeric' = 'default') {
      if (this.isPhysicalMobile) return
      this.keyboardType = type
      this.activeInputId = id
      this.inputValue = String(initialValue)
      this.isOpen = true
    },
    close() {
      this.isOpen = false
      this.activeInputId = null
    },
    updateValue(newValue: string) {
      this.inputValue = newValue
      if (this.activeInputId) {
        const el = document.getElementById(this.activeInputId) as HTMLInputElement
        if (el) {
          el.value = newValue

          el.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }
    },
  },
})
