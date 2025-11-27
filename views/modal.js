// 模态框相关功能

/**
 * 显示VS目录信息模态框
 */
export function showVsDirModal() {
    const modal = document.getElementById('vsDirModal');
    const modalContent = document.getElementById('vsDirModalContentContainer');
    if (modal && modalContent) {
        // 显示模态框但保持透明度为0
        modal.classList.remove('hidden');
        // 使用setTimeout确保下一帧执行动画
        setTimeout(() => {
            // 背景淡入
            modal.classList.remove('opacity-0');
            // 内容由小变大
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
        // 内容由大变小
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-90', 'opacity-0');
        // 背景淡出
        modal.classList.add('opacity-0');
        // 等待动画完成后隐藏
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 200);
    }
}

/**
 * 显示通用提示弹窗
 * @param {string} title - 弹窗标题
 * @param {string} message - 弹窗内容
 * @param {function|null} callback - 确认后的回调函数
 */
export function showToastModal(title, message, callback = null) {
    const modal = document.getElementById('toastModal');
    const modalTitle = document.getElementById('toastModalTitle');
    const modalContent = document.getElementById('toastModalContent');
    const modalContentContainer = document.getElementById('toastModalContentContainer');

    if (modal && modalTitle && modalContent && modalContentContainer) {
        // 设置标题和内容
        modalTitle.textContent = title || '提示信息';
        modalContent.textContent = message;

        // 存储回调函数
        modal.dataset.callback = callback ? callback.toString() : '';

        // 显示模态框但保持透明度为0
        modal.classList.remove('hidden');
        // 使用setTimeout确保下一帧执行动画
        setTimeout(() => {
            // 背景淡入
            modal.classList.remove('opacity-0');
            // 内容由小变大
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
        // 执行回调函数
        const callbackStr = modal.dataset.callback;
        if (callbackStr) {
            try {
                const callback = new Function(callbackStr);
                callback();
            } catch (e) {
                console.error('执行弹窗回调函数失败:', e);
            }
        }
        
        // 清空回调
        modal.dataset.callback = '';
        
        // 内容由大变小
        modalContentContainer.classList.remove('scale-100', 'opacity-100');
        modalContentContainer.classList.add('scale-90', 'opacity-0');
        // 背景淡出
        modal.classList.add('opacity-0');
        // 等待动画完成后隐藏
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 200);
    }
}

/**
 * 显示登录注册模态框
 */
export function showAuthModal() {
    const modal = document.getElementById('authModal');
    const modalContent = document.getElementById('authModalContentContainer');
    if (modal && modalContent) {
        // 显示模态框但保持透明度为0
        modal.classList.remove('hidden');
        // 使用setTimeout确保下一帧执行动画
        setTimeout(() => {
            // 背景淡入
            modal.classList.remove('opacity-0');
            // 内容由小变大
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
    const modalContent = document.getElementById('authModalContentContainer');
    console.log('关闭弹窗函数被调用', modal, modalContent);
    if (modal) {
        // 强制移除所有可能阻止关闭的类
        modal.classList.remove('scale-100', 'opacity-100');
        modal.classList.add('hidden');
        modal.classList.add('opacity-0');

        // 如果modalContent存在，也应用关闭动画
        if (modalContent) {
            modalContent.classList.remove('scale-100', 'opacity-100');
            modalContent.classList.add('scale-90', 'opacity-0');
        }

        // 为确保彻底隐藏，直接设置display属性
        setTimeout(() => {
            modal.style.display = 'none';
            console.log('弹窗已强制关闭');
        }, 50);
    }
}

/**
 * 显示底部小弹窗
 */
export function showBottomPopup() {
    const popup = document.getElementById('bottomPopup');
    if (popup) {
        // 移除隐藏类并添加显示动画
        popup.classList.remove('translate-y-full', 'opacity-0');
        popup.classList.add('translate-y-0', 'opacity-100');
    }
}

/**
 * 隐藏底部小弹窗
 */
export function hideBottomPopup() {
    const popup = document.getElementById('bottomPopup');
    if (popup) {
        console.log('隐藏底部弹窗');
        // 添加隐藏类并移除显示动画
        popup.classList.add('translate-y-full', 'opacity-0');
        popup.classList.remove('translate-y-0', 'opacity-100');

        // 重置表单
        const form = document.getElementById('bottomLoginForm');
        if (form) {
            form.reset();
            // 隐藏所有错误提示
            hideError('bottomLoginEmailError');
            hideError('bottomLoginPasswordError');
        }
    }
}