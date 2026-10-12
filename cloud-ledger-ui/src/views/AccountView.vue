<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { listAccounts, createAccount, updateAccount, deleteAccount } from '@/api/account'
import { formatMoney } from '@/utils/format'

const userStore = useUserStore()
const accounts = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const dialogMode = ref('create') // create | edit
const currentAccount = ref(null)

const form = ref({
  account_id: '',
  name: '',
  type: '现金',
  balance: 0
})

const accountTypes = ['现金', '银行卡', '信用卡', '电子账户', '其他']

async function load() {
  loading.value = true
  try {
    const res = await listAccounts(userStore.userId)
    accounts.value = res.data.accounts || []
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialogMode.value = 'create'
  form.value = { account_id: '', name: '', type: '现金', balance: 0 }
  dialogVisible.value = true
}

function openEdit(row) {
  dialogMode.value = 'edit'
  currentAccount.value = row
  form.value = { account_id: row.account_id, name: row.name, type: row.type, balance: Number(row.balance) }
  dialogVisible.value = true
}

async function submit() {
  try {
    if (dialogMode.value === 'create') {
      await createAccount({
        user_id: userStore.userId,
        name: form.value.name,
        type: form.value.type,
        balance: form.value.balance
      })
      ElMessage.success('账户创建成功')
    } else {
      await updateAccount(form.value.account_id, {
        name: form.value.name,
        balance: form.value.balance
      })
      ElMessage.success('账户更新成功')
    }
    dialogVisible.value = false
    load()
  } catch (e) {
    // 拦截器已提示
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`删除账户「${row.name}」将级联删除其下所有账单，且不可恢复，确认删除？`, '警告', {
    type: 'warning'
  })
  try {
    await deleteAccount(row.account_id)
    ElMessage.success('账户已删除')
    load()
  } catch (e) {
    // 拦截器已提示
  }
}

onMounted(load)
</script>

<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <div class="header-row">
          <span>账户管理</span>
          <el-button type="primary" @click="openCreate">新增账户</el-button>
        </div>
      </template>

      <el-table :data="accounts" stripe v-loading="loading">
        <el-table-column prop="name" label="账户名称" />
        <el-table-column prop="type" label="类型" />
        <el-table-column label="余额">
          <template #default="{ row }">¥{{ formatMoney(row.balance) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增账户' : '编辑账户'"
      width="420px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="账户名称">
          <el-input v-model="form.name" placeholder="如：建设银行储蓄卡" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option v-for="t in accountTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="余额">
          <el-input-number v-model="form.balance" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
