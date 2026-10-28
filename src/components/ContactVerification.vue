<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { loadTurnstile, type TurnstileApi } from '@/services/turnstile'
const props = defineProps<{ sitekey: string }>()
const emit = defineEmits<{ token: [value: string] }>()
const container = ref<HTMLElement>()
const failed = ref(false)
const busy = ref(false)
let alive = true
let api: TurnstileApi | undefined
let widget: string | undefined
function dispose() { if (widget !== undefined) { api?.remove(widget); widget = undefined } }
async function load() {
  if (busy.value) return
  busy.value = true; failed.value = false; emit('token', '')
  try {
    api = await loadTurnstile()
    if (!alive || !container.value) return
    dispose()
    widget = api.render(container.value, { sitekey: props.sitekey, retry: 'never',
      callback: token => { if (alive) { failed.value = false; emit('token', token) } },
      'expired-callback': () => { if (alive) { emit('token', ''); failed.value = true } },
      'error-callback': () => { if (alive) { emit('token', ''); failed.value = true }; return true },
    })
  } catch { if (alive) failed.value = true } finally { busy.value = false }
}
onMounted(load)
onBeforeUnmount(() => { alive = false; emit('token', ''); dispose() })
</script>
<template>
  <section aria-label="Contact verification">
    <div ref="container" />
    <p v-if="busy" role="status">Loading verification…</p>
    <div v-if="failed" role="alert"><p>Verification is unavailable or has expired. Your message has been kept.</p><button type="button" class="action-button" @click="load">Retry verification</button></div>
  </section>
</template>
