<script setup lang="ts">
import { ref, useId } from 'vue'
import { previewMode } from '@/config'
const props = defineProps<{
  action?: string
  placeholder?: string
}>()

const action =
  props.action ??
  'https://bulsca.us15.list-manage.com/subscribe/post?u=1b1c9887c1e5ff377f6979e66&id=94c67a5f8d&f_id=00738de0f0'
const placeholder = props.placeholder ?? 'swimming@bulsca.co.uk'
const previewSubmitted = ref(false)
const emailId = useId()
const consentId = useId()
function submit(event: Event) {
  if (previewMode) {
    event.preventDefault()
    previewSubmitted.value = true
  }
}
</script>

<template>
  <section class="mailing-list" aria-label="Join the mailing list">
    <h2>Join the mailing list</h2>
    <form
      :action="previewMode ? undefined : action"
      method="post"
      class="mailing-form"
      @submit="submit"
    >
      <label :for="emailId" class="form-label">Email address</label>
      <input
        :id="emailId"
        name="EMAIL"
        type="email"
        required
        autocomplete="email"
        :aria-describedby="consentId"
        :placeholder="placeholder"
        class="form-control"
      />
      <input
        type="text"
        name="b_1b1c9887c1e5ff377f6979e66_94c67a5f8d"
        tabindex="-1"
        value=""
        class="hidden"
        hidden
      />
      <input
        type="checkbox"
        id="gdpr_3427"
        name="gdpr[3427]"
        value="Y"
        checked
        class="hidden"
        hidden
      />
      <small :id="consentId" class="mailing-consent">
        By clicking below I acknowledge that BULSCA will send me emails about relevant events and
        news. You may opt out anytime by clicking <strong>unsubscribe</strong> in any email!
      </small>
      <button type="submit" class="action-button">Sign me up!</button>
    </form>
    <p v-if="previewSubmitted" role="status">
      Preview only: no mailing-list subscription was submitted.
    </p>
  </section>
</template>
