import axios from 'axios'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const api = axios.create({
    baseURL: config.public.apiBase,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true // This is crucial for sending cookies with requests
  })

  // Remove the request interceptor as it's not needed for cookie-based auth

  // Inject the api instance into the Nuxt app
  nuxtApp.provide('api', api)
})