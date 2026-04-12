
import apiClient from '@/api/client'

export const mediaApi = {
  /**
   * Lädt eine Datei hoch und gibt den gespeicherten Dateinamen zurück.
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await apiClient.post('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return data.filename
  },

    /**
     * Generiert die korrekte URL für ein Thumbnail/Bild.
     */
    getImageUrl(filename: string | null | undefined, width: number = 80): string {
      if (!filename) return 'https://via.placeholder.com/100?text=Kein+Bild'

      return `/api/media/${filename}?width=${width}`
    },

}
