<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { logout as apiLogout, changePassword } from '@/api/user'
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const collapsed = ref(false)

// ==================== 修改密码弹窗 ====================
const pwdDialogVisible = ref(false)
const pwdSubmitting = ref(false)
const pwdFormRef = ref()
const pwdForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const validatePwdConfirm = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
  } else if (value !== pwdForm.value.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 64, message: '密码长度须为 8-64 位', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: '密码须同时包含字母和数字', trigger: 'blur' }
  ],
  confirm_password: [{ required: true, validator: validatePwdConfirm, trigger: 'blur' }]
}

function openPwdDialog() {
  pwdDialogVisible.value = true
}

function resetPwdForm() {
  pwdForm.value = { old_password: '', new_password: '', confirm_password: '' }
  pwdFormRef.value?.clearValidate()
}

async function submitPwdChange() {
  await pwdFormRef.value.validate()
  pwdSubmitting.value = true
  try {
    await changePassword({ ...pwdForm.value })
    ElMessage.success('密码修改成功，请重新登录')
    pwdDialogVisible.value = false
    // 后端已将当前 Token 拉黑并清除会话，前端同步清理并跳转登录
    userStore.clear()
    router.push({ name: 'login' })
  } catch (e) {
    // 原密码错误等提示已由请求拦截器统一弹出，保留弹窗供修正
  } finally {
    pwdSubmitting.value = false
  }
}

const menus = [
  { path: '/dashboard', title: '首页概览', icon: 'HomeFilled' },
  { path: '/account', title: '账户管理', icon: 'Wallet' },
  { path: '/bill', title: '账单管理', icon: 'Tickets' },
  { path: '/category', title: '分类管理', icon: 'Menu' },
  { path: '/budget', title: '预算管理', icon: 'PieChart' },
  { path: '/report', title: '统计分析', icon: 'TrendCharts' },
  { path: '/transaction', title: '交易流水', icon: 'List' },
  { path: '/feedback', title: '意见反馈', icon: 'ChatDotRound' }
]

const activeMenu = computed(() => route.path)

function handleSelect(path) {
  router.push(path)
}

async function handleLogout() {
  await ElMessageBox.confirm('确认退出登录吗？', '提示', { type: 'warning' })
  try {
    await apiLogout()
  } catch (e) {
    // 登出接口失败不阻塞本地清理
  }
  userStore.clear()
  router.push({ name: 'login' })
}
</script>

<template>
  <el-container class="layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="aside">
      <div class="logo">
        <span v-if="!collapsed">Cloud-Ledger</span>
        <span v-else>CL</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        background-color="#001529"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        @select="handleSelect"
      >
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <el-icon><component :is="m.icon" /></el-icon>
          <template #title>{{ m.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <el-icon class="collapse-btn" @click="collapsed = !collapsed">
          <Expand v-if="collapsed" />
          <Fold v-else />
        </el-icon>
        <div class="header-title">{{ route.meta.title || '' }}</div>
        <el-dropdown>
          <span class="user-info">
            <el-icon><UserFilled /></el-icon>
            {{ userStore.userName || '用户' }}
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="openPwdDialog">修改密码</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="pwdDialogVisible"
      title="修改密码"
      width="420px"
      :close-on-click-modal="false"
      @closed="resetPwdForm"
    >
      <el-form
        ref="pwdFormRef"
        :model="pwdForm"
        :rules="pwdRules"
        label-position="top"
        @keyup.enter="submitPwdChange"
      >
        <el-form-item label="原密码" prop="old_password">
          <el-input
            v-model="pwdForm.old_password"
            type="password"
            show-password
            placeholder="请输入当前密码"
            maxlength="64"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input
            v-model="pwdForm.new_password"
            type="password"
            show-password
            placeholder="8-64 位，须包含字母和数字"
            maxlength="64"
          />
        </el-form-item>
        <PasswordStrengthMeter :password="pwdForm.new_password" />
        <el-form-item label="确认新密码" prop="confirm_password" class="pwd-confirm">
          <el-input
            v-model="pwdForm.confirm_password"
            type="password"
            show-password
            placeholder="请再次输入新密码"
            maxlength="64"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdSubmitting" @click="submitPwdChange">确认修改</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100%;
}
.aside {
  background: #001529;
  transition: width 0.2s;
  overflow-x: hidden;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  white-space: nowrap;
}
.aside :deep(.el-menu) {
  border-right: none;
}
.header {
  background: #fff;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
}
.header-title {
  flex: 1;
  font-weight: 600;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #303133;
}
.main {
  padding: 16px;
  background: var(--cl-bg);
}
.pwd-confirm {
  margin-top: 4px;
}

/* 响应式：窄屏折叠侧栏 */
@media (max-width: 768px) {
  .aside {
    width: 64px !important;
  }
}
</style>
