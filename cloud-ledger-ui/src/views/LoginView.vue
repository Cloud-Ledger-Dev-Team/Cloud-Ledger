<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login, register } from '@/api/user'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const mode = ref('login') // login | register
const loading = ref(false)

const form = ref({
  name: '',
  email: '',
  password: ''
})

const rules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (mode.value === 'register' && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value)) {
          callback(new Error('密码需至少 8 位且包含字母和数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const formRef = ref()

function switchMode(m) {
  mode.value = m
  form.value.password = ''
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    if (mode.value === 'login') {
      const res = await login({ email: form.value.email, password: form.value.password })
      userStore.setLogin(res.data.token, res.data.user)
      ElMessage.success('登录成功')
      router.push(route.query.redirect || '/dashboard')
    } else {
      await register({ name: form.value.name, email: form.value.email, password: form.value.password })
      ElMessage.success('注册成功，请登录')
      switchMode('login')
    }
  } catch (e) {
    // 错误已由拦截器提示
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2 class="title">Cloud-Ledger 云记账</h2>
      <el-tabs v-model="mode" class="tabs" @tab-change="switchMode">
        <el-tab-pane label="登录" name="login" />
        <el-tab-pane label="注册" name="register" />
      </el-tabs>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
        <el-form-item v-if="mode === 'register'" label="用户名" prop="name">
          <el-input v-model="form.name" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <div v-if="mode === 'login'" class="form-extra">
          <router-link class="forgot-link" :to="{ name: 'forgot-password' }">忘记密码？</router-link>
        </div>
        <el-button type="primary" class="submit" :loading="loading" @click="submit">
          {{ mode === 'login' ? '登录' : '注册' }}
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff 0%, #001529 100%);
}
.login-card {
  width: 400px;
  max-width: 92vw;
}
.title {
  text-align: center;
  margin: 0 0 8px;
}
.tabs {
  margin-bottom: 8px;
}
.form-extra {
  display: flex;
  justify-content: flex-end;
  margin: -4px 0 12px;
}
.forgot-link {
  font-size: 13px;
  color: #409eff;
  text-decoration: none;
}
.forgot-link:hover {
  text-decoration: underline;
}
.submit {
  width: 100%;
}
</style>
