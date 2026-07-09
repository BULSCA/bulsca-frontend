<template>
  <div class="container-responsive">
    <div class="flex flex-col space-y-9">
      <LandingFeature
        title="Acting Governing Body"
        text="BULSCA acts as the governing body for lifesaving sport while at University. We are an organisation overseeing the development of university lifesaving clubs, and ensure the smooth-running of an annual league."
      >
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </template>
      </LandingFeature>

      <LandingFeature
        title="By Students, For Students"
        text="The BULSCA committee is made up entirely of volunteers, either current students or graduates from higher education institutions."
        :reversed="true"
      >
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM21 10a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </template>
      </LandingFeature>

      <LandingFeature
        title="Our aims"
        text="Our aims are to promote the training and development of lifesaving skills, to promote and develop lifesaving as a sport and to oversee competitive lifesaving between Higher Education institutions."
      >
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </template>
      </LandingFeature>
    </div>
  </div>
</template>

<script setup lang="ts">
import LandingFeature from './LandingFeature.vue'
</script>