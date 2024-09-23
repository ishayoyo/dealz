// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  css: [
    '@/assets/css/tailwind.css',
    'vue-toastification/dist/index.css',
    '@fortawesome/fontawesome-svg-core/styles.css'
  ],

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:5000/api/v1' // Your backend API URL
    }
  },

  compatibilityDate: '2024-09-22',
  plugins: [
    '~/plugins/userAvatar.js',
    '~/plugins/toast.js',
    '~/plugins/fontawesome.js',
    '~/plugins/auth.js',
    '~/plugins/socket.js'  // Add this line
  ],
  ssr: true
})