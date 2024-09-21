import { useState } from '#app'

export const useProfile = () => useState('profile', () => ({
  showProfile: false
}))

export const useProfileActions = () => {
  const profile = useProfile()

  const openProfile = () => {
    profile.value.showProfile = true
  }

  const closeProfile = () => {
    profile.value.showProfile = false
  }

  return { openProfile, closeProfile }
}