// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', // Remove '@nuxtjs/toast' from here
  '@pinia/nuxt', '@nuxt/image'],
  css: [
    '@/assets/css/tailwind.css',
    'vue-toastification/dist/index.css',
    '@fortawesome/fontawesome-svg-core/styles.css'
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://deals.ishay.me/api/v1' 
          : 'http://localhost:5000/api/v1'),
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 
        (process.env.NODE_ENV === 'production'
          ? 'https://deals.ishay.me'
          : 'http://localhost:5000')
    }
  },

  compatibilityDate: '2024-09-22',
  plugins: [
    '~/plugins/api.js',
    '~/plugins/auth.js',
    '~/plugins/userAvatar.js',
    '~/plugins/fontawesome.js',
    '~/plugins/socket.js',
    { src: '~/plugins/vue-toastification.js', mode: 'client' }
  ],
  ssr: true,
  build: {
    transpile: ['vue-toastification']
  }
})