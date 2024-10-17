export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:finish', () => {
    const { $analytics } = useNuxtApp()
    if ($analytics && typeof $analytics.pageView === 'function') {
      $analytics.pageView(
        document.title,
        window.location.href,
        window.location.pathname
      )
    } else {
      console.warn('Analytics plugin is not properly initialized or does not have a pageView method.')
    }
  })
})
