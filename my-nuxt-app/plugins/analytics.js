export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig()

  function gtag() {
    if (process.client) {
      window.dataLayer.push(arguments)
    }
  }

  const analytics = {
    pageView(pageTitle, pageLocation, pagePath) {
      if (process.client) {
        gtag('event', 'page_view', {
          page_title: pageTitle,
          page_location: pageLocation,
          page_path: pagePath,
          send_to: runtimeConfig.public.googleAnalyticsId
        })
      }
    },
    event(eventName, eventParams) {
      if (process.client) {
        gtag('event', eventName, {
          ...eventParams,
          send_to: runtimeConfig.public.googleAnalyticsId
        })
      }
    }
  }

  if (process.client) {
    window.dataLayer = window.dataLayer || []
    gtag('js', new Date())
    gtag('config', runtimeConfig.public.googleAnalyticsId)
  }

  return {
    provide: {
      analytics
    }
  }
})
