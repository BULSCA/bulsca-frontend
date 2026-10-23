import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { installDiagnostics, reportError } from './services/diagnostics'

const app = createApp(App)
installDiagnostics()
app.config.errorHandler = () => reportError('component')

app.use(createPinia())
app.use(router)

app.mount('#app')
