// plugins/userAvatar.js
import UserAvatar from '~/components/UserAvatar.vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('UserAvatar', UserAvatar)
})