export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('page:finish', () => {
      const { $analytics } = useNuxtApp()
      $analytics.pageView(
        document.title,
        window.location.href,
        window.location.pathname
      )
    })
  })