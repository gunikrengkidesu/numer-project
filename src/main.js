import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.config.errorHandler = (err, vm, info) => { // แสดง error บนหน้า แทนที่จะขาวโล่ง
  console.error(err)
  document.body.insertAdjacentHTML('beforeend', `<pre style="color:#b42318;padding:12px 24px;white-space:pre-wrap">Error (${info}): ${String(err.message ?? err).replace(/</g, '&lt;')}</pre>`)
}
app.mount('#app')
