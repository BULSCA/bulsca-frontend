<template>
  <article class="card-frame">
    <div class="card-frame-body"><slot /></div>
    <footer v-if="$slots.footer" class="card-frame-footer"><slot name="footer" /></footer>
  </article>
</template>
