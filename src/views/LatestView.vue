<script setup lang="ts">
import { onMounted } from 'vue'

import { useApi } from '@/composables/useApi'
import { getAssets } from '@/api/articles/articles'

import PageBanner from '@/components/PageBanner.vue';

const { data: assets, error, loading, execute } = useApi(getAssets)

onMounted(execute)

</script>

<template>
  <PageBanner
    title="Latest"
    subtitle="News 📰"
    background-image="https://bulsca.co.uk/storage/photos/DSC_0335.jpg"
    :snow-container="true"
    height="h-[40vh]"
  />


  <div class="container-responsive">

    <div v-if="loading">Loading assets…</div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="execute">Retry</button>
    </div>

    <div v-else-if="!assets?.length" class="empty-state">
      <p>No assets yet.</p>
    </div>

    <!--
    <ul v-else>
      <li v-for="asset in assets" :key="asset.id">
        {{ asset.title }}
        {{ asset.id }}
        {{ asset.slug }}
        {{ asset.title }}
        {{ asset.author }}
        {{ asset.pinned }}
        {{ asset.created_at }}
        {{ asset.updated_at }}
        {{ asset.views }}
        {{ asset.thumbs_up }}
        {{ asset.thumbs_down }}
        <br>
      </li>
    </ul>
    -->

    <div v-else class="flex flex-col pb-8">
      <a v-for="asset in assets" :key="asset.id" href="" class="no-underline py-8 first-of-type:pt-0 border-b group">
        <article class="flex flex-col">
          <div class="flex flex-row items-center">
            <div class="w-full">
              <h1 class="header ">{{ asset.title }}</h1>
              <div class="flex flex-row">
                <!--<small class="text-gray-500 font-normal">{{ asset.getDateAuthorString() }}</small>-->
                <small class="text-gray-500 font-normal">{{ asset.created_at }}</small>
                <small class="text-gray-500 font-normal ml-auto flex flex-row items-center justify-center space-x-2 mb-1">
                  <span class="pl-2">{{ asset.views }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                    <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                  </svg>
                </small>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 ml-auto text-bulsca_red transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <!--
          <p class=" text-black font-normal">
            {{ Str::of(html_entity_decode(str_replace('  ', ' ', strip_tags(str_replace('<', ' <', asset.content)))))->squish()->words() }}
          </p>
          -->
          <small class="mt-2 ml-auto group-hover:text-bulsca_red">Click to continue reading</small>
        </article>
      </a>
    </div>


  </div>
</template>
