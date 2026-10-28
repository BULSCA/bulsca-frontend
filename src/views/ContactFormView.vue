<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getContactConfig, submitContact } from '@/api/public'
import { normalizeFailure, type ApiFailure } from '@/api/errors'
import { useApi } from '@/composables/useApi'
import { departments } from '@/content/pages'
import { previewMode } from '@/config'
import RequestError from '@/components/RequestError.vue'
import SafeLink from '@/components/SafeLink.vue'
import ContactVerification from '@/components/ContactVerification.vue'
const route = useRoute()
const form = reactive({ name: '', email: '', department: 'chair', subject: '', message: '' })
watch(() => route.query.department, value => { form.department = departments.some(d => d.id === value) ? String(value) : 'chair' }, { immediate: true })
const config = useApi(getContactConfig)
void config.execute()
const configData = config.data
const configError = config.error
const configLoading = config.loading
const token = ref('')
const verificationKey = ref(0)
const pending = ref(false)
const submitted = ref(false)
const error = ref<ApiFailure | null>(null)
const fields = ref<Record<string, string>>({})
let controller: AbortController | undefined
let alive = true
const department = computed(() => departments.find(item => item.id === form.department) || departments[0]!)
const canSubmit = computed(() => !!configData.value?.data.accepts_submissions && (previewMode || (!!configData.value.data.turnstile_site_key && !!token.value)))
async function submit() {
  if (pending.value) return
  submitted.value = false; error.value = null
  fields.value = {}
  for (const key of ['name', 'email', 'subject', 'message'] as const) if (!form[key].trim()) fields.value[key] = 'Please complete this field.'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) fields.value.email = 'Please enter a valid email address.'
  if (form.name.length > 255) fields.value.name = 'Please use no more than 255 characters.'
  if (form.subject.length > 255) fields.value.subject = 'Please use no more than 255 characters.'
  if (form.message.length > 5000) fields.value.message = 'Please use no more than 5000 characters.'
  if (Object.keys(fields.value).length || !canSubmit.value) return
  pending.value = true; controller = new AbortController()
  try {
    await submitContact({ ...form, 'cf-turnstile-response': token.value || undefined }, controller.signal)
    if (alive) submitted.value = true
  } catch (failure) {
    if (alive && !controller.signal.aborted) {
      error.value = normalizeFailure(failure)
      for (const key of Object.keys(error.value.fieldErrors || {})) fields.value[key] = 'Please check this field.'
    }
  } finally {
    if (alive) { pending.value = false; token.value = ''; verificationKey.value++ }
  }
}
onBeforeUnmount(() => { alive = false; controller?.abort() })
</script>
<template>
  <PageLayout title="Contact BULSCA">
    <nav aria-label="Breadcrumb"><RouterLink to="/">Home</RouterLink> / <RouterLink to="/contact">Contact</RouterLink> / Form</nav>
    <p class="page-description">Choose a department and send your enquiry. Your draft stays on this page if a request fails.</p>
    <p><SafeLink :to="`mailto:${department.email}`">Email {{ department.label }} directly</SafeLink> if the form is unavailable.</p>
    <RequestError v-if="configError" :error="configError" :busy="configLoading" @retry="config.execute()" />
    <p v-if="configLoading" role="status">Checking contact service availability…</p>
    <p v-if="configData && !canSubmit && !configData.data.turnstile_site_key && !previewMode" role="status">Online submission is currently unavailable. You can still use the department email above.</p>
    <p v-if="configData && !configData.data.accepts_submissions" role="status">This contact service is not accepting messages right now. Please use email instead.</p>
    <div v-if="submitted" role="status" class="success-message">{{ previewMode ? 'Preview only: your message was not sent.' : 'Your message was accepted by the contact service.' }}</div>
    <div v-if="error" role="alert" class="error-message"><p>{{ error.message }}</p><p v-if="error.kind !== 'validation'">Delivery could not be confirmed. Your draft has been kept. Contact the department directly before sending it again.</p></div>
    <form class="contact-form" novalidate :aria-busy="pending" @submit.prevent="submit">
      <fieldset :disabled="pending">
        <legend>Your enquiry</legend>
        <label for="department">Department</label><select class="form-control" id="department" v-model="form.department"><option v-for="item in departments" :key="item.id" :value="item.id">{{ item.label }}</option></select>
        <template v-for="field in ['name', 'email', 'subject'] as const" :key="field">
          <label :for="field">{{ field === 'name' ? 'Your name' : field === 'email' ? 'Email address' : 'Subject' }}</label>
          <input class="form-control" :id="field" v-model="form[field]" :type="field === 'email' ? 'email' : 'text'" :maxlength="field === 'email' ? 320 : 255" required :autocomplete="field === 'subject' ? 'off' : field" :aria-invalid="!!fields[field]" :aria-describedby="fields[field] ? `${field}-error` : undefined" />
          <p v-if="fields[field]" :id="`${field}-error`" class="field-error">{{ fields[field] }}</p>
        </template>
        <label for="message">Message</label><textarea class="form-control" id="message" v-model="form.message" required maxlength="5000" rows="8" :aria-invalid="!!fields.message" aria-describedby="message-help message-error" />
        <small id="message-help">{{ form.message.length }} / 5000 characters</small><p id="message-error" class="field-error">{{ fields.message }}</p>
        <ContactVerification v-if="!previewMode && configData?.data.turnstile_site_key" :key="verificationKey" :sitekey="configData.data.turnstile_site_key" @token="token = $event" />
        <button type="submit" class="action-button" :disabled="pending || !canSubmit">{{ pending ? 'Sending…' : previewMode ? 'Preview submission' : 'Send message' }}</button>
      </fieldset>
    </form>
  </PageLayout>
</template>
