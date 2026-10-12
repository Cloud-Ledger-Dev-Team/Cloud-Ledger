<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { monthlyStats } from '@/api/report'
import { listAccounts } from '@/api/account'
import { formatMoney, currentMonth } from '@/utils/format'

const userStore = useUserStore()

const month = ref(currentMonth())
const stats = ref(null)
const accounts = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const [statsRes, accRes] = await Promise.all([
      monthlyStats(userStore.userId, month.value),
      listAccounts(userStore.userId)
    ])
    stats.value = statsRes.data.stats
    accounts.value = accRes.data.accounts || []
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div v-loading="loading">
    <el-card class="welcome page-card">
      <h2>你好，{{ userStore.userName || '用户' }}</h2>
      <p class="sub">这是 {{ month }} 的财务概览。</p>
    </el-card>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="stat-card">
          <div class="stat-label">账户总数</div>
          <div class="stat-value">{{ accounts.length }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="stat-card">
          <div class="stat-label">{{ month }} 收入</div>
          <div class="stat-value text-income">¥{{ formatMoney(stats?.income) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="stat-card">
          <div class="stat-label">{{ month }} 支出</div>
          <div class="stat-value text-expense">¥{{ formatMoney(stats?.expense) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card">
      <template #header>
        <span>账户一览</span>
      </template>
      <el-table :data="accounts" stripe>
        <el-table-column prop="name" label="账户名称" />
        <el-table-column prop="type" label="类型" />
        <el-table-column label="余额">
          <template #default="{ row }">¥{{ formatMoney(row.balance) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.welcome h2 {
  margin: 0 0 8px;
}
.sub {
  color: #909399;
  margin: 0;
}
.stat-card {
  text-align: center;
  margin-bottom: 16px;
}
.stat-label {
  color: #909399;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
}
</style>
