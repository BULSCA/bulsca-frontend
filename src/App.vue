<script setup lang="ts">
import '@/assets/main.css'
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import Header from './components/Header.vue'
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'
import LandingContent from './components/LandingContent.vue'
import PageBanner from './components/PageBanner.vue'


</script>

<template>
  <NavBar />

  <RouterView />

  <div class="wrapper">
    <nav>
      <RouterLink to="/">Landing View</RouterLink>
      <RouterLink to="/latest">Latest View</RouterLink>
    </nav>
  </div>

  <!-- Spacer for testing scroll -->
  <div class="h-screen flex items-center justify-center bg-gray-100">
    <p class="text-2xl text-gray-600">Scroll content — testing area</p>
  </div>

  <!--
  <div class="h-screen flex items-center justify-center bg-gray-200">
    <p class="text-2xl text-gray-600">More scroll content</p>
  </div>
  -->

  <Footer />
</template>
