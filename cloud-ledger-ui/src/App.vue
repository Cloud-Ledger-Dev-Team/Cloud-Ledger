<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// Coze WebChat SDK 配置
const COZE_BOT_ID = '7694532743732199439'
// 注意：PAT Token 不要硬编码在前端，建议通过后端接口或环境变量注入
const COZE_TOKEN = import.meta.env.VITE_COZE_TOKEN || 'pat_your_token_here'
const COZE_TITLE = '小云 - 记账助手'

onMounted(() => {
  userStore.restore()
  initCozeChat()
})

// 初始化扣子聊天组件（幂等，防止重复初始化）
function initCozeChat() {
  if (window.__cozeChatInitialized) return
  window.__cozeChatInitialized = true

  const tryInit = (attempts = 0) => {
    // Token 未配置（仍是占位符）时直接给出明确提示，避免 SDK 反复重试
    if (COZE_TOKEN === 'pat_your_token_here') {
      console.error('[Coze SDK] 未配置 VITE_COZE_TOKEN：请在 cloud-ledger-ui/.env.development 中填入扣子平台生成的 PAT（个人访问令牌），并重启 dev server。')
      return
    }
    const CozeWebSDK = window.CozeWebSDK
    if (CozeWebSDK && CozeWebSDK.WebChatClient) {
      new CozeWebSDK.WebChatClient({
        config: { bot_id: COZE_BOT_ID },
        componentProps: { title: COZE_TITLE },
        auth: {
          type: 'token',
          token: COZE_TOKEN,
          onRefreshToken: () => COZE_TOKEN
        }
      })
      return
    }
    // SDK 还没加载好，最多等 20 秒（100ms 间隔 × 200 次）
    if (attempts < 200) {
      setTimeout(() => tryInit(attempts + 1), 100)
    } else {
      console.warn('[Coze SDK] 加载超时，聊天组件未初始化')
    }
  }
  tryInit()
}
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
