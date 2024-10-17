// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', // Remove '@nuxtjs/toast' from here
  '@pinia/nuxt', '@nuxt/image'],
  css: [
    '@/assets/css/tailwind.css',
    'vue-toastification/dist/index.css',
    '@fortawesome/fontawesome-svg-core/styles.css',
    '@/assets/css/toast.css' // Add this line
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://saversonic.com/api/v1' 
          : 'http://localhost:5000/api/v1'),
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 
        (process.env.NODE_ENV === 'production'
          ? 'https://saversonic.com'
          : 'http://localhost:5000'),
      googleAnalyticsId: process.env.NODE_ENV === 'production'
        ? 'G-T0NCYQB1MT'  // Production GA ID
        : 'G-FC8GTR1HMP'  // Development GA ID
    }
  },

  compatibilityDate: '2024-09-22',
  plugins: [
    '~/plugins/api.js',
    '~/plugins/auth.js',
    '~/plugins/userAvatar.js',
    '~/plugins/fontawesome.js',
    '~/plugins/socket.js',
    { src: '~/plugins/vue-toastification.js', mode: 'client' },
    '~/plugins/analytics.js',
    '~/plugins/router.client.js'
  ],
  ssr: true,
  build: {
    transpile: ['vue-toastification']
  },

  // Add this new section for error handling
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      meta: [
        { name: 'theme-color', content: '#ffffff' },
      ],
      script: [
        {
          src: process.env.NODE_ENV === 'production'
            ? `https://www.googletagmanager.com/gtag/js?id=G-T0NCYQB1MT`
            : `https://www.googletagmanager.com/gtag/js?id=G-FC8GTR1HMP`,
          async: true
        },
        {
          children: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NODE_ENV === 'production' ? 'G-T0NCYQB1MT' : 'G-FC8GTR1HMP'}');
          `,
          type: 'text/javascript'
        }
      ]
    },
  },
})
