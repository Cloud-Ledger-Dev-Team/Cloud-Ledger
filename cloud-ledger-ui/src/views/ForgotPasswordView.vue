<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendResetCode, resetPassword } from '@/api/user'
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter.vue'

const router = useRouter()

const activeStep = ref(0)
const emailSending = ref(false)
const submitting = ref(false)
const countdown = ref(0)
let countdownTimer = null

const emailFormRef = ref()
const resetFormRef = ref()

const emailForm = ref({ email: '' })
const resetForm = ref({
  email: '',
  code: '',
  new_password: '',
  confirm_password: ''
})

const emailRules = {
  email: [
    { required: true, message: '请输入注册邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
  } else if (value !== resetForm.value.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const resetRules = {
  code: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码为 6 位数字', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 64, message: '密码长度须为 8-64 位', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: '密码须同时包含字母和数字', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

function startCountdown(seconds) {
  countdown.value = seconds
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

async function handleSendCode() {
  await emailFormRef.value.validate()
  await doSendCode(emailForm.value.email, 60)
  // 进入第二步，回填邮箱
  resetForm.value.email = emailForm.value.email
  activeStep.value = 1
}

async function handleResendCode() {
  await doSendCode(resetForm.value.email, 60)
}

async function doSendCode(email, defaultCooldown) {
  emailSending.value = true
  try {
    const res = await sendResetCode({ email })
    ElMessage.success(res.msg || '验证码已发送，请查收邮箱')
    startCountdown(res.data?.resend_cooldown || defaultCooldown)
  } catch (e) {
    // 错误已由请求拦截器统一提示
  } finally {
    emailSending.value = false
  }
}

async function handleReset() {
  await resetFormRef.value.validate()
  submitting.value = true
  try {
    await resetPassword({ ...resetForm.value })
    activeStep.value = 2
  } catch (e) {
    // 验证码错误等场景保持在当前页，允许修正后重试
  } finally {
    submitting.value = false
  }
}

function backToLogin() {
  router.push({ name: 'login' })
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<template>
  <div class="forgot-page">
    <el-card class="forgot-card">
      <h2 class="title">找回密码</h2>

      <el-steps :active="activeStep" align-center class="steps" finish-status="success">
        <el-step title="验证邮箱" />
        <el-step title="设置新密码" />
        <el-step title="完成" />
      </el-steps>

      <!-- 第一步：输入注册邮箱并发送验证码 -->
      <el-form
        v-if="activeStep === 0"
        ref="emailFormRef"
        :model="emailForm"
        :rules="emailRules"
        label-position="top"
        @keyup.enter="handleSendCode"
      >
        <el-form-item label="注册邮箱" prop="email">
          <el-input v-model="emailForm.email" placeholder="请输入注册时使用的邮箱" maxlength="100" clearable />
        </el-form-item>
        <el-button type="primary" class="action-btn" :loading="emailSending" @click="handleSendCode">
          发送验证码
        </el-button>
      </el-form>

      <!-- 第二步：填写验证码与新密码 -->
      <el-form
        v-else-if="activeStep === 1"
        ref="resetFormRef"
        :model="resetForm"
        :rules="resetRules"
        label-position="top"
        @keyup.enter="handleReset"
      >
        <el-form-item label="邮箱">
          <el-input v-model="resetForm.email" disabled />
        </el-form-item>
        <el-form-item label="邮箱验证码" prop="code">
          <div class="code-row">
            <el-input
              v-model="resetForm.code"
              placeholder="请输入 6 位验证码"
              maxlength="6"
              class="code-input"
            />
            <el-button
              type="primary"
              plain
              :loading="emailSending"
              :disabled="countdown > 0"
              @click="handleResendCode"
            >
              {{ countdown > 0 ? `${countdown}s 后重发` : '重新发送' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input
            v-model="resetForm.new_password"
            type="password"
            show-password
            placeholder="8-64 位，须包含字母和数字"
            maxlength="64"
          />
        </el-form-item>
        <PasswordStrengthMeter :password="resetForm.new_password" />
        <el-form-item label="确认新密码" prop="confirm_password" class="confirm-item">
          <el-input
            v-model="resetForm.confirm_password"
            type="password"
            show-password
            placeholder="请再次输入新密码"
            maxlength="64"
          />
        </el-form-item>
        <el-button type="primary" class="action-btn" :loading="submitting" @click="handleReset">
          确认重置
        </el-button>
      </el-form>

      <!-- 第三步：成功 -->
      <div v-else class="result-box">
        <el-result icon="success" title="密码重置成功" sub-title="请使用新密码重新登录">
          <template #extra>
            <el-button type="primary" @click="backToLogin">返回登录</el-button>
          </template>
        </el-result>
      </div>

      <div v-if="activeStep < 2" class="footer-link">
        想起密码了？<router-link :to="{ name: 'login' }">返回登录</router-link>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.forgot-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff 0%, #001529 100%);
  padding: 16px;
}
.forgot-card {
  width: 440px;
  max-width: 96vw;
}
.title {
  text-align: center;
  margin: 0 0 20px;
}
.steps {
  margin-bottom: 24px;
}
.action-btn {
  width: 100%;
  margin-top: 4px;
}
.code-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
.code-input {
  flex: 1;
}
.confirm-item {
  margin-top: 4px;
}
.result-box {
  padding: 8px 0;
}
.footer-link {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #606266;
}
.footer-link a {
  color: #409eff;
  text-decoration: none;
}
</style>
