<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { submitFeedback } from '@/api/feedback'

const formRef = ref(null)
const loading = ref(false)

const form = ref({
  type: '建议',
  contact: '',
  content: ''
})

const typeOptions = ['建议', '问题', 'Bug', '其他']

const rules = {
  content: [{ required: true, message: '请输入反馈内容', trigger: 'blur' }]
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await submitFeedback({
      type: form.value.type,
      contact: form.value.contact,
      content: form.value.content
    })
    ElMessage.success('反馈提交成功，感谢您的意见')
    form.value = { type: '建议', contact: '', content: '' }
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <el-card class="page-card feedback-card">
      <template #header>
        <span>意见反馈</span>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        style="max-width: 560px"
      >
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="form.contact" placeholder="邮箱 / 手机号（可选）" />
        </el-form-item>
        <el-form-item label="反馈内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请描述你遇到的问题或建议"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submit">提交反馈</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.feedback-card {
  max-width: 720px;
}
</style>
