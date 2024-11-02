// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/image'
  ],
  css: [
    '@/assets/css/tailwind.css',
    'vue-toastification/dist/index.css',
    '@fortawesome/fontawesome-svg-core/styles.css',
    '@/assets/css/toast.css'
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
        ? 'G-T0NCYQB1MT'
        : 'G-FC8GTR1HMP',
      // Add Google Auth config
      googleAuthCallback: process.env.NODE_ENV === 'production'
        ? 'https://saversonic.com/api/v1/users/auth/google/callback'
        : 'http://localhost:5000/api/v1/users/auth/google/callback',
      // Google OAuth Configuration
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleAuthScope: ['email', 'profile']
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

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'SaverSonic - Your Smart Shopping Companion',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#ffffff' },
        { 
          name: 'description',
          content: 'SaverSonic is a social deal shopping network that helps consumers find the best deals and savings opportunities.',
          key: 'description'
        },
        { property: 'og:site_name', content: 'SaverSonic' },
        { property: 'og:type', content: 'website', key: 'ogType' },
        { property: 'og:title', content: 'SaverSonic - Your Smart Shopping Companion', key: 'ogTitle' },
        { property: 'og:description', content: 'SaverSonic is a social deal shopping network that helps consumers find the best deals and savings opportunities.', key: 'ogDescription' },
        { property: 'og:image', content: 'https://saversonic.com/images/logo-saver-background.png', key: 'ogImage' },
        { property: 'og:url', content: 'https://saversonic.com', key: 'ogUrl' },
        { name: 'twitter:card', content: 'summary_large_image', key: 'twitterCard' },
        { name: 'twitter:title', content: 'SaverSonic - Your Smart Shopping Companion', key: 'twitterTitle' },
        { name: 'twitter:description', content: 'SaverSonic is a social deal shopping network that helps consumers find the best deals and savings opportunities.', key: 'twitterDescription' },
        { name: 'twitter:image', content: 'https://saversonic.com/images/logo-saver-background.png', key: 'twitterImage' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ],
      script: [
        {
          src: process.env.NODE_ENV === 'production'
            ? 'https://www.googletagmanager.com/gtag/js?id=G-T0NCYQB1MT'
            : 'https://www.googletagmanager.com/gtag/js?id=G-FC8GTR1HMP',
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
    }
  },
  pages: true,
})
