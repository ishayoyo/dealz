<template>
  <div>
    <Header />
    <main class="pt-16"> <!-- Add padding-top to account for fixed header -->
      <slot />
    </main>
    <ProfilePage v-if="profile.showProfile" @close="closeProfile" />
  </div>
</template>

<script setup>
import Header from '~/components/Header.vue'
import ProfilePage from '~/components/ProfilePage.vue'
import { useProfile, useProfileActions } from '~/composables/useProfile'

const profile = useProfile()
const { closeProfile } = useProfileActions()
</script>