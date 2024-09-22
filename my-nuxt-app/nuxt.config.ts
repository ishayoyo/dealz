// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:5000/api/v1' // Your backend API URL
    }
  },

  compatibilityDate: '2024-09-22'
})