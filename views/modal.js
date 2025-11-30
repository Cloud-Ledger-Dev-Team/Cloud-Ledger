// views/modal.js - 弹窗管理 (已修复语法错误)

/**
 * 显示VS目录信息模态框
 */
export function showVsDirModal() {
    const modal = document.getElementById('vsDirModal');
    const modalContent = document.getElementById('vsDirModalContentContainer');
    if (modal && modalContent) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalContent.classList.remove('scale-90', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
}

/**
 * 关闭VS目录信息模态框
 */
export function closeVsDirModal() {
    const modal = document.getElementById('vsDirModal');
    const modalContent = document.getElementById('vsDirModalContentContainer');
    if (modal && modalContent) {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-90', 'opacity-0');
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 200);
    }
}

/**
 * 显示通用提示弹窗
 * (修复版：使用全局变量存储回调，防止闭包丢失)
 */
export function showToastModal(title, message, callback = null) {
    const modal = document.getElementById('toastModal');
    const modalTitle = document.getElementById('toastModalTitle');
    const modalContent = document.getElementById('toastModalContent');
    const modalContentContainer = document.getElementById('toastModalContentContainer');

    if (modal && modalTitle && modalContent && modalContentContainer) {
        modalTitle.textContent = title || '提示信息';
        modalContent.textContent = message;

        // 【关键】将回调函数挂载到 window 对象，确保点击确定时能执行
        window._currentToastCallback = callback;

        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalContentContainer.classList.remove('scale-90', 'opacity-0');
            modalContentContainer.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
}

/**
 * 关闭通用提示弹窗
 */
export function closeToastModal() {
    const modal = document.getElementById('toastModal');
    const modalContentContainer = document.getElementById('toastModalContentContainer');
    if (modal && modalContentContainer) {
        // 动画效果
        modalContentContainer.classList.remove('scale-100', 'opacity-100');
        modalContentContainer.classList.add('scale-90', 'opacity-0');
        modal.classList.add('opacity-0');

        setTimeout(() => {
            modal.classList.add('hidden');
            // 【关键】执行暂存的回调函数
            if (typeof window._currentToastCallback === 'function') {
                window._currentToastCallback();
                window._currentToastCallback = null; // 执行完清空
            }
        }, 200);
    }
}

// 为了兼容部分旧代码，同时也挂载到 window
window.showToastModal = showToastModal;
window.closeToastModal = closeToastModal;

/**
 * 显示登录注册模态框
 */
export function showAuthModal() {
    const modal = document.getElementById('authModal');
    const modalContent = document.getElementById('authModalContentContainer');
    if (modal && modalContent) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalContent.classList.remove('scale-90', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
}

/**
 * 关闭登录注册模态框
 */
export function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 200);
    }
}

/**
 * 显示/隐藏 底部小弹窗
 */
export function showBottomPopup() {
    const popup = document.getElementById('bottomPopup');
    if (popup) {
        popup.classList.remove('translate-y-full', 'opacity-0');
        popup.classList.add('translate-y-0', 'opacity-100');
    }
}

export function hideBottomPopup() {
    const popup = document.getElementById('bottomPopup');
    if (popup) {
        popup.classList.add('translate-y-full', 'opacity-0');
        popup.classList.remove('translate-y-0', 'opacity-100');
    }
}

/**
 * 忘记密码弹窗函数
 */
export function showForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    const modalContent = document.getElementById('forgotPasswordModalContentContainer');
    if (modal && modalContent) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalContent.classList.remove('scale-90', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
}

export function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    const modalContent = document.getElementById('forgotPasswordModalContentContainer');
    if (modal && modalContent) {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-90', 'opacity-0');
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 200);
    }
}