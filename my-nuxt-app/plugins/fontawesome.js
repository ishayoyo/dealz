import { library, config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// This is important, we are going to let Nuxt worry about the CSS
config.autoAddCss = false

// Dynamic imports for Font Awesome icons
export default defineNuxtPlugin(async (nuxtApp) => {
  const icons = await Promise.all([
    import('@fortawesome/free-solid-svg-icons/faArrowUp'),
    import('@fortawesome/free-solid-svg-icons/faArrowDown'),
    import('@fortawesome/free-solid-svg-icons/faChevronUp'),
    import('@fortawesome/free-solid-svg-icons/faChevronDown')
  ])

  icons.forEach(icon => library.add(icon.definition))

  nuxtApp.vueApp.component('font-awesome-icon', FontAwesomeIcon)
})