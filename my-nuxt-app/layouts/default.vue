<template>
  <div>
    <Header />
    <main class="pt-16"> <!-- Add padding-top to account for fixed header -->
      <slot />
    </main>
  </div>
</template>

<script setup>
import Header from '~/components/Header.vue'
</script>