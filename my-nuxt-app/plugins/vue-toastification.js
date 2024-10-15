import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    nuxtApp.vueApp.use(Toast, {
      // Toast options
      position: 'bottom-center',
      timeout: 3000,
      closeOnClick: true,
      pauseOnFocusLoss: false,
      pauseOnHover: false,
      draggable: false,
      draggablePercent: 0.6,
      showCloseButtonOnHover: false,
      hideProgressBar: true,
      closeButton: false,
      icon: false,
      rtl: false,
      transition: 'Vue-Toastification__fade',
      maxToasts: 2,
      newestOnTop: true
    })
  }
})
