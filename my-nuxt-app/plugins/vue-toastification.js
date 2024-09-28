import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    nuxtApp.vueApp.use(Toast, {
      // Toast options
    })
  }
})