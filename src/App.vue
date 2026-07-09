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

  <PageBanner
    title="Page Title"
    subtitle="Optional subtitle"
    background-image="https://bulsca.co.uk/storage/photos/DSC_0335.jpg"
    :snow-container="true"
    height="h-[50vh]"
  />

  <!--
  <header>

    <img alt="Vue logo" class="logo" src="@/assets/blogo.png" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>

  </header>
  -->

  <LandingContent />


  <!-- Spacer for testing scroll -->
  <div class="h-screen flex items-center justify-center bg-gray-100">
    <p class="text-2xl text-gray-600">Scroll content — testing area</p>
  </div>

  <div class="h-screen flex items-center justify-center bg-gray-200">
    <p class="text-2xl text-gray-600">More scroll content</p>
  </div>

  <!-- <RouterView /> -->

  <Footer />
</template>
