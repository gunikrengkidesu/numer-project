import { ref } from 'vue'
import { LocalStore } from './LocalStore.js'
// import { ApiStore } from './ApiStore.js'

export const repository = new LocalStore() // เปลี่ยนเป็น new ApiStore() เมื่อมี backend

export const records = ref([])   // รายการประวัติ (reactive)
export const pending = ref(null) // รายการที่ถูกสั่ง "โหลด" จากหน้าประวัติ
repository.subscribe(list => (records.value = list))
