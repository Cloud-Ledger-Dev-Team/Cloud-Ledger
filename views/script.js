// 显示/隐藏密码功能
// 通用工具函数

// 密码显示切换功能
function setupPasswordToggle(toggleId, passwordFieldId) {
    document.getElementById(toggleId)?.addEventListener('click', function () {
        const passwordInput = document.getElementById(passwordFieldId);
        const icon = this.querySelector('i');

        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

// 初始化密码显示切换功能
function initPasswordToggles() {
    // 登录表单密码切换
    if (document.getElementById('toggleLoginPassword') && document.getElementById('loginPassword')) {
        setupPasswordToggle('toggleLoginPassword', 'loginPassword');
    }
    // 注册表单密码切换
    if (document.getElementById('toggleRegisterPassword') && document.getElementById('registerPassword')) {
        setupPasswordToggle('toggleRegisterPassword', 'registerPassword');
    }
    // 注册表单确认密码切换
    if (document.getElementById('toggleConfirmRegisterPassword') && document.getElementById('confirmRegisterPassword')) {
        setupPasswordToggle('toggleConfirmRegisterPassword', 'confirmRegisterPassword');
    }
    // 底部弹窗密码切换
    if (document.getElementById('toggleBottomLoginPassword') && document.getElementById('bottomLoginPassword')) {
        setupPasswordToggle('toggleBottomLoginPassword', 'bottomLoginPassword');
    }
}

// 显示VS目录信息模态框
function showVsDirModal() {
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

// 关闭VS目录信息模态框
function closeVsDirModal() {
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

// 显示通用提示弹窗
function showToastModal(title, message, callback = null) {
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

// 关闭通用提示弹窗
function closeToastModal() {
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
            modal.dataset.callback = '';
        }
        
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

// 显示错误消息
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');

        // 添加输入框错误样式
        const inputId = elementId.replace('Error', '');
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.classList.add('input-error');
        }
    }
}

// 隐藏错误消息
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.add('hidden');

        // 移除输入框错误样式
        const inputId = elementId.replace('Error', '');
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.classList.remove('input-error');
        }
    }
}

// 注册页面表单处理
function setupRegistrationForm() {
    const form = document.getElementById('registerForm')?.querySelector('form');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('registerName')?.value.trim() || '';
            const email = document.getElementById('registerEmail')?.value.trim() || '';
            const password = document.getElementById('registerPassword')?.value || '';
            const confirmPassword = document.getElementById('confirmRegisterPassword')?.value || '';

            // 重置所有错误消息
            hideError('registerNameError');
            hideError('registerEmailError');
            hideError('registerPasswordError');
            hideError('confirmRegisterPasswordError');

            // 表单验证
            let isValid = true;

            // 验证用户名
            if (!name) {
                showError('registerNameError', '用户名不能为空');
                isValid = false;
            }

            // 验证邮箱
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                showError('registerEmailError', '请输入有效的邮箱地址');
                isValid = false;
            }

            // 验证密码
            if (!password || password.length < 6) {
                showError('registerPasswordError', '密码长度至少为6位');
                isValid = false;
            }

            // 验证确认密码
            if (password !== confirmPassword) {
                showError('confirmRegisterPasswordError', '两次输入的密码不一致');
                isValid = false;
            }

            // 如果验证通过，执行提交逻辑
            if (isValid) {
                try {
                    // 使用数据库注册功能
                    await window.db.register({
                        name: name,
                        email: email,
                        password: password
                    });

                    showToastModal('注册成功', '注册成功！请登录', "window.location.href = 'cloud ledger.html';");
                } catch (error) {
                    showToastModal('注册失败', '注册失败：' + error.message);
                    console.error('注册错误:', error);
                }
            }
        });
    }
}

// 登录页面表单处理
function setupLoginForm() {
    const form = document.getElementById('loginForm')?.querySelector('form');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail')?.value.trim() || '';
            const password = document.getElementById('loginPassword')?.value || '';

            // 重置所有错误消息
            hideError('loginEmailError');
            hideError('loginPasswordError');

            // 表单验证
            let isValid = true;

            // 验证邮箱
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                showError('loginEmailError', '请输入有效的邮箱地址');
                isValid = false;
            }

            // 验证密码
            if (!password) {
                showError('loginPasswordError', '请输入密码');
                isValid = false;
            }

            // 如果验证通过，执行登录逻辑
            if (isValid) {
                try {
                    await window.db.login(email, password);
                    window.location.href = 'dashboard.html';
                } catch (error) {
                    showError('loginPasswordError', error.message || '登录失败，请检查邮箱和密码');
                    console.error('登录错误:', error);
                }
            }
        });
    }
}

// 添加实时验证
function setupRealTimeValidation() {
    // 注册表单的用户名实时验证
    const registerNameInput = document.getElementById('registerName');
    if (registerNameInput) {
        registerNameInput.addEventListener('input', function () {
            const name = this.value.trim();
            if (name) {
                hideError('registerNameError');
            }
        });
    }

    // 登录表单的邮箱实时验证
    const loginEmailInput = document.getElementById('loginEmail');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (loginEmailInput) {
        loginEmailInput.addEventListener('input', function () {
            const email = this.value.trim();
            if (email && emailRegex.test(email)) {
                hideError('loginEmailError');
            }
        });
    }

    // 注册表单的邮箱实时验证
    const registerEmailInput = document.getElementById('registerEmail');
    if (registerEmailInput) {
        registerEmailInput.addEventListener('input', function () {
            const email = this.value.trim();
            if (email && emailRegex.test(email)) {
                hideError('registerEmailError');
            }
        });
    }

    // 注册表单的密码实时验证
    const registerPasswordInput = document.getElementById('registerPassword');
    if (registerPasswordInput) {
        registerPasswordInput.addEventListener('input', function () {
            const password = this.value;
            if (password.length >= 6) {
                hideError('registerPasswordError');
            }
        });
    }

    // 注册表单的确认密码实时验证
    const confirmRegisterPasswordInput = document.getElementById('confirmRegisterPassword');
    if (confirmRegisterPasswordInput && registerPasswordInput) {
        confirmRegisterPasswordInput.addEventListener('input', function () {
            const confirmPassword = this.value;
            const password = registerPasswordInput.value;
            if (confirmPassword && confirmPassword === password) {
                hideError('confirmRegisterPasswordError');
            }
        });
    }
}

// 登出功能
function setupLogout() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            window.db.logout();
            window.location.href = 'cloud ledger.html';
        });
    }
}

// 忘记密码功能
function setupForgotPassword() {
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const forgotPasswordModalContentContainer = document.getElementById('forgotPasswordModalContentContainer');
    
    // 提升emailRegex到函数作用域
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // 显示忘记密码模态框的函数
    function showForgotPasswordModal() {
        if (forgotPasswordModal && forgotPasswordModalContentContainer) {
            // 显示模态框但保持透明度为0
            forgotPasswordModal.classList.remove('hidden');
            // 使用setTimeout确保下一帧执行动画
            setTimeout(() => {
                // 背景淡入
                forgotPasswordModal.classList.remove('opacity-0');
                // 内容由小变大
                forgotPasswordModalContentContainer.classList.remove('scale-90', 'opacity-0');
                forgotPasswordModalContentContainer.classList.add('scale-100', 'opacity-100');
            }, 10);
        }
    }
    
    // 关闭忘记密码模态框的函数
    function hideForgotPasswordModal() {
        if (forgotPasswordModal && forgotPasswordModalContentContainer) {
            // 内容由大变小
            forgotPasswordModalContentContainer.classList.remove('scale-100', 'opacity-100');
            forgotPasswordModalContentContainer.classList.add('scale-90', 'opacity-0');
            // 背景淡出
            forgotPasswordModal.classList.add('opacity-0');
            // 等待动画完成后隐藏
            setTimeout(() => {
                forgotPasswordModal.classList.add('hidden');
            }, 200);
        }
    }
    
    if (forgotPasswordLink && forgotPasswordModal) {
        // 显示忘记密码模态框
        forgotPasswordLink.addEventListener('click', function (e) {
            e.preventDefault();
            showForgotPasswordModal();
        });
        
        // 关闭忘记密码模态框
        if (closeForgotPasswordModal) {
            closeForgotPasswordModal.addEventListener('click', hideForgotPasswordModal);
        }
        
        // 点击模态框外部关闭
        forgotPasswordModal.addEventListener('click', function (e) {
            if (e.target === forgotPasswordModal) {
                hideForgotPasswordModal();
            }
        });
        
        // 表单提交处理
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                
                const email = document.getElementById('forgotEmail')?.value.trim() || '';
                hideError('forgotEmailError');
                
                // 验证邮箱
                if (!email || !emailRegex.test(email)) {
                    showError('forgotEmailError', '请输入有效的邮箱地址');
                    return;
                }
                
                try {
                    await window.db.forgotPassword(email);
                    showToastModal('重置密码', '重置密码链接已发送到您的邮箱，请查收！');
                    hideForgotPasswordModal();
                    forgotPasswordForm.reset();
                } catch (error) {
                    showError('forgotEmailError', error.message || '发送重置链接失败，请稍后再试');
                    console.error('忘记密码错误:', error);
                }
            });
        }
        
        // 添加实时验证
        const forgotEmailInput = document.getElementById('forgotEmail');
        if (forgotEmailInput) {
            forgotEmailInput.addEventListener('input', function () {
                const email = this.value.trim();
                if (email && emailRegex.test(email)) {
                    hideError('forgotEmailError');
                }
            });
        }
    }
}

// 检查用户是否已登录
function checkUserLoggedIn() {
    // 检查localStorage中是否有用户信息
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    
    // 如果有用户信息，认为用户已登录
    const isLoggedIn = token && userId;
    
    // 更新用户信息显示
    const usernameElement = document.getElementById('username');
    const userEmailElement = document.getElementById('userEmail');
    if (isLoggedIn) {
        if (usernameElement) {
            usernameElement.textContent = username || '用户';
        }
        if (userEmailElement) {
            // 尝试从localStorage获取邮箱，如果没有则显示示例邮箱
            const userEmail = localStorage.getItem('user_email') || 'user@example.com';
            userEmailElement.textContent = userEmail;
        }
    }
    
    return isLoggedIn;
}

// 加载账户列表
async function loadAccounts() {
    try {
        const accounts = await window.db.getAccounts();
        const accountSelect = document.getElementById('accountSelect');
        const accountList = document.getElementById('accountList');

        if (accountSelect) {
            accountSelect.innerHTML = '';
            accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.account_id;
                option.textContent = `${account.name} (${account.balance.toFixed(2)})`;
                accountSelect.appendChild(option);
            });
        }

        if (accountList) {
            accountList.innerHTML = '';
            accounts.forEach(account => {
                const accountItem = document.createElement('div');
                accountItem.className = 'account-item flex justify-between items-center p-3 border rounded-lg mb-2 bg-white/90 hover:bg-white/100 transition-colors';
                accountItem.innerHTML = `
                    <div>
                        <h4 class="font-medium">${account.name}</h4>
                        <p class="text-sm text-gray-500">${account.type}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-lg">¥${account.balance.toFixed(2)}</p>
                        <div class="flex gap-2 mt-1">
                            <button class="edit-account-btn text-blue-500 hover:text-blue-700 text-sm" data-id="${account.account_id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-account-btn text-red-500 hover:text-red-700 text-sm" data-id="${account.account_id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                accountList.appendChild(accountItem);
            });

            // 添加编辑和删除账户的事件监听
            document.querySelectorAll('.edit-account-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const accountId = this.getAttribute('data-id');
                    openAccountModal(accountId);
                });
            });

            document.querySelectorAll('.delete-account-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const accountId = this.getAttribute('data-id');
                    if (confirm('确定要删除这个账户吗？删除后相关的账单也会被删除。')) {
                        deleteAccount(accountId);
                    }
                });
            });
        }

        return accounts;
    } catch (error) {
            console.error('加载账户失败:', error);
            showToastModal('加载失败', '加载账户失败: ' + error.message);
            return [];
        }
}

// 打开账户编辑模态框
async function openAccountModal(accountId = null) {
    const modal = document.getElementById('accountModal');
    const modalTitle = document.getElementById('accountModalTitle');
    const accountIdInput = document.getElementById('accountId');
    const accountNameInput = document.getElementById('accountName');
    const accountTypeInput = document.getElementById('accountType');
    const accountBalanceInput = document.getElementById('accountBalance');
    const modalContentContainer = document.getElementById('accountModalContentContainer');

    if (modal && modalContentContainer) {
        // 重置表单
        accountIdInput.value = '';
        accountNameInput.value = '';
        accountTypeInput.value = '现金';
        accountBalanceInput.value = '0';

        if (accountId) {
            modalTitle.textContent = '编辑账户';
            accountIdInput.value = accountId;

            try {
                // 获取账户详情
                const accounts = await window.db.getAccounts();
                const account = accounts.find(a => a.account_id === accountId);
                if (account) {
                    accountNameInput.value = account.name;
                    accountTypeInput.value = account.type;
                    accountBalanceInput.value = account.balance.toFixed(2);
                }
            } catch (error) {
                console.error('获取账户详情失败:', error);
                showToastModal('获取失败', '获取账户详情失败: ' + error.message);
            }
        } else {
            modalTitle.textContent = '添加账户';
        }

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

// 关闭账户模态框
function closeAccountModal() {
    const modal = document.getElementById('accountModal');
    const modalContentContainer = document.getElementById('accountModalContentContainer');
    if (modal && modalContentContainer) {
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

// 保存账户
async function saveAccount() {
    const accountId = document.getElementById('accountId').value;
    const accountName = document.getElementById('accountName').value.trim();
    const accountType = document.getElementById('accountType').value;
    const accountBalance = parseFloat(document.getElementById('accountBalance').value);

    // 验证表单
    if (!accountName) {
        showToastModal('输入错误', '请输入账户名称');
        return;
    }

    if (isNaN(accountBalance) || accountBalance < 0) {
        showToastModal('输入错误', '请输入有效的余额');
        return;
    }

    try {
        if (accountId) {
            // 更新账户
            await window.db.updateAccount(accountId, {
                name: accountName,
                type: accountType,
                balance: accountBalance
            });
        } else {
            // 添加账户
            await window.db.addAccount({
                name: accountName,
                type: accountType,
                balance: accountBalance
            });
        }

        // 关闭模态框并刷新账户列表
        closeAccountModal();
        await loadAccounts();
        showToastModal('保存成功', '账户保存成功');
    } catch (error) {
        console.error('保存账户失败:', error);
        showToastModal('保存失败', '保存账户失败: ' + error.message);
    }
}

// 删除账户
async function deleteAccount(accountId) {
    try {
        await window.db.deleteAccount(accountId);
        await loadAccounts();
        showToastModal('删除成功', '账户删除成功');
    } catch (error) {
        console.error('删除账户失败:', error);
        showToastModal('删除失败', '删除账户失败: ' + error.message);
    }
}

// 设置账单录入功能
function setupBillEntry() {
    const expenseTab = document.getElementById('expenseTab');
    const incomeTab = document.getElementById('incomeTab');
    const expenseCategories = document.getElementById('expenseCategories');
    const incomeCategories = document.getElementById('incomeCategories');

    if (expenseTab && incomeTab && expenseCategories && incomeCategories) {
        // 切换支出和收入标签
        expenseTab.addEventListener('click', function () {
            expenseTab.classList.add('active');
            incomeTab.classList.remove('active');
            expenseCategories.classList.remove('hidden');
            incomeCategories.classList.add('hidden');
            document.getElementById('billType').value = 'expense';
        });

        incomeTab.addEventListener('click', function () {
            incomeTab.classList.add('active');
            expenseTab.classList.remove('active');
            incomeCategories.classList.remove('hidden');
            expenseCategories.classList.add('hidden');
            document.getElementById('billType').value = 'income';
        });

        // 点击分类选择
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', function () {
                // 移除其他分类的选中状态
                document.querySelectorAll('.category-item').forEach(i => {
                    i.classList.remove('selected');
                });
                // 添加当前分类的选中状态
                this.classList.add('selected');
                // 设置分类值
                document.getElementById('billCategory').value = this.getAttribute('data-category');
            });
        });

        // 快捷记账按钮
        document.querySelectorAll('.quick-entry-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const category = this.getAttribute('data-category');
                const amount = parseFloat(this.getAttribute('data-amount'));

                // 设置分类
                document.querySelectorAll('.category-item').forEach(i => {
                    i.classList.remove('selected');
                    if (i.getAttribute('data-category') === category) {
                        i.classList.add('selected');
                    }
                });
                document.getElementById('billCategory').value = category;

                // 设置金额
                document.getElementById('billAmount').value = amount;
            });
        });

        // 自动填写当天日期
        const billDateInput = document.getElementById('billDate');
        if (billDateInput) {
            // 获取当前日期并格式化为YYYY-MM-DD格式
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            // 设置日期输入框的值
            billDateInput.value = formattedDate;
        }
    }
}

// 保存账单
async function saveBill() {
    const billType = document.getElementById('billType').value;
    const billCategory = document.getElementById('billCategory').value;
    const billAmount = parseFloat(document.getElementById('billAmount').value);
    const billDate = document.getElementById('billDate').value;
    const billDescription = document.getElementById('billDescription').value.trim();
    const accountSelect = document.getElementById('accountSelect');
    const accountId = accountSelect ? accountSelect.value : '';

    // 验证表单
    if (!billCategory) {
        showToastModal('输入错误', '请选择分类');
        return;
    }

    if (isNaN(billAmount) || billAmount <= 0) {
        showToastModal('输入错误', '请输入有效的金额');
        return;
    }

    if (!billDate) {
        showToastModal('输入错误', '请选择日期');
        return;
    }

    if (!accountId) {
        showToastModal('输入错误', '请选择账户');
        return;
    }

    try {
        await window.db.addBill({
            type: billType,
            category: billCategory,
            amount: billAmount,
            date: billDate,
            description: billDescription,
            account_id: accountId
        });

        // 重置表单
        document.getElementById('billCategory').value = '';
        document.getElementById('billAmount').value = '';
        document.getElementById('billDescription').value = '';
        document.querySelectorAll('.category-item').forEach(i => {
            i.classList.remove('selected');
        });

        // 刷新账户列表和账单列表
        await loadAccounts();
        await loadBills();

        showToastModal('记账成功', '记账成功');
    } catch (error) {
        console.error('保存账单失败:', error);
        showToastModal('保存失败', '保存账单失败: ' + error.message);
    }
}

// 加载账单列表
async function loadBills() {
    try {
        const bills = await window.db.getBills();
        const billList = document.getElementById('billList');

        if (billList) {
            billList.innerHTML = '';

            if (bills.length === 0) {
                billList.innerHTML = '<p class="text-gray-500 text-center py-4">暂无账单记录</p>';
                return;
            }

            bills.forEach(bill => {
                const billItem = document.createElement('div');
                billItem.className = 'bill-item flex justify-between items-center p-3 border rounded-lg mb-2 bg-white/90 hover:bg-white/100 transition-colors';

                const amountClass = bill.type === 'income' ? 'text-green-500' : 'text-red-500';
                const amountSign = bill.type === 'income' ? '+' : '-';

                billItem.innerHTML = `
                    <div>
                        <h4 class="font-medium">${bill.category}</h4>
                        <p class="text-sm text-gray-500">${bill.date} ${bill.description || '-'}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-lg ${amountClass}">${amountSign}¥${bill.amount.toFixed(2)}</p>
                    </div>
                `;
                billList.appendChild(billItem);
            });
        }
    } catch (error) {
        console.error('加载账单失败:', error);
        showToastModal('加载失败', '加载账单失败: ' + error.message);
    }
}

// 加载月度统计数据
async function loadMonthlyStats() {
    try {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        const stats = await window.db.getMonthlyStats(currentMonth);

        const incomeElement = document.getElementById('totalIncome');
        const expenseElement = document.getElementById('totalExpense');
        const balanceElement = document.getElementById('totalBalance');
        const budgetElement = document.getElementById('budget');
        const budgetUsedElement = document.getElementById('budgetUsed');

        if (incomeElement) incomeElement.textContent = stats.income.toFixed(2);
        if (expenseElement) expenseElement.textContent = stats.expense.toFixed(2);
        if (balanceElement) balanceElement.textContent = stats.balance.toFixed(2);
        if (budgetElement) budgetElement.textContent = stats.budget ? stats.budget.toFixed(2) : '未设置';
        if (budgetUsedElement) budgetUsedElement.textContent = `${stats.budgetUsed}%`;

        // 绘制分类统计图表
        drawCategoryChart(stats.categoryStats);

        return stats;
    } catch (error) {
        console.error('加载月度统计失败:', error);
        return null;
    }
}

// 绘制分类统计图表
function drawCategoryChart(categoryStats) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    // 如果已有图表实例，先销毁
    if (window.categoryChartInstance) {
        window.categoryChartInstance.destroy();
    }

    // 准备数据
    const categories = Object.keys(categoryStats);
    const amounts = Object.values(categoryStats);

    // 生成随机颜色
    const colors = categories.map(() => {
        const r = Math.floor(Math.random() * 200);
        const g = Math.floor(Math.random() * 200);
        const b = Math.floor(Math.random() * 200);
        return `rgb(${r}, ${g}, ${b})`;
    });

    // 创建图表
    window.categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// 设置导航菜单
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetPath = this.getAttribute('data-target');
            if (targetPath) {
                e.preventDefault();
                window.location.href = targetPath;
            }
        });

        // 高亮当前页面的导航项
        const href = this.getAttribute('href');
        if (href && currentPath.includes(href)) {
            this.classList.add('active');
        }
    });
}

// 设置登录/注册标签切换
function setupLoginRegisterTabs() {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginTab && registerTab && loginForm && registerForm) {
        loginTab.addEventListener('click', function() {
            // 激活登录标签，显示登录表单
            loginTab.classList.add('bg-white', 'text-primary', 'shadow-sm');
            loginTab.classList.remove('text-gray-700');
            registerTab.classList.remove('bg-white', 'text-primary', 'shadow-sm');
            registerTab.classList.add('text-gray-700');
            
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            
            // 重新初始化表单
            setupLoginForm();
        });
        
        registerTab.addEventListener('click', function() {
            // 激活注册标签，显示注册表单
            registerTab.classList.add('bg-white', 'text-primary', 'shadow-sm');
            registerTab.classList.remove('text-gray-700');
            loginTab.classList.remove('bg-white', 'text-primary', 'shadow-sm');
            loginTab.classList.add('text-gray-700');
            
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            
            // 重新初始化表单
            setupRegistrationForm();
        });
    }
}

// 显示登录注册模态框
function showAuthModal() {
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

// 关闭登录注册模态框
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    const modalContent = document.getElementById('authModalContentContainer');
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

// 添加登录状态检测，未登录时直接显示底部弹窗
function setupScrollTrigger() {
    // 移除已显示标记，确保每次都能显示弹窗
    localStorage.removeItem('hasShownBottomPopup');
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    
    // 不管登录状态如何，都尝试显示弹窗进行测试
    console.log('设置滚动触发器，尝试显示底部弹窗');
    
    // 检查bottomPopup元素是否存在
    const popup = document.getElementById('bottomPopup');
    if (!popup) {
        console.log('当前页面不包含底部弹窗元素，跳过弹窗设置');
        return;
    }
    
    console.log('找到底部弹窗元素，当前类名:', popup.className);
    
    // 检查用户登录状态
    const isLoggedIn = checkUserLoggedIn();
    console.log('用户登录状态:', isLoggedIn);
    
    // 尝试直接显示弹窗
    console.log('准备调用showBottomPopup()');
    showBottomPopup();
    
    // 为了确保弹窗显示，添加一个延时再次尝试
    setTimeout(() => {
        console.log('延时后再次尝试显示弹窗');
        popup.classList.remove('translate-y-full', 'opacity-0');
        popup.classList.add('translate-y-0', 'opacity-100');
        console.log('弹窗最终类名:', popup.className);
    }, 1000);
}

// 检查是否滚动到底部
function isScrolledToBottom() {
    return window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
}

// 显示底部小弹窗
function showBottomPopup() {
    const popup = document.getElementById('bottomPopup');
    if (popup) {
        // 移除隐藏类并添加显示动画
        popup.classList.remove('translate-y-full', 'opacity-0');
        popup.classList.add('translate-y-0', 'opacity-100');
    }
}

// 隐藏底部小弹窗
function hideBottomPopup() {
    const popup = document.getElementById('bottomPopup');
    if (popup) {
        // 添加隐藏类并移除显示动画
        popup.classList.add('translate-y-full', 'opacity-0');
        popup.classList.remove('translate-y-0', 'opacity-100');
    }
}

// 设置底部弹窗表单处理
function setupBottomPopupForm() {
    const form = document.getElementById('bottomLoginForm');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('bottomLoginEmail')?.value.trim() || '';
            const password = document.getElementById('bottomLoginPassword')?.value || '';

            // 重置所有错误消息
            hideError('bottomLoginEmailError');
            hideError('bottomLoginPasswordError');

            // 表单验证
            let isValid = true;

            // 验证邮箱
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                showError('bottomLoginEmailError', '请输入有效的邮箱地址');
                isValid = false;
            }

            // 验证密码
            if (!password) {
                showError('bottomLoginPasswordError', '请输入密码');
                isValid = false;
            }

            // 如果验证通过，执行登录逻辑
            if (isValid) {
                try {
                    await window.db.login(email, password);
                    window.location.href = 'dashboard.html';
                } catch (error) {
                    showError('bottomLoginPasswordError', error.message || '登录失败，请检查邮箱和密码');
                    console.error('登录错误:', error);
                }
            }
        });
    }

    // 设置关闭按钮事件
    const closeButton = document.getElementById('closeBottomPopup');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            hideBottomPopup();
            // 设置已显示标记，避免重复显示
            localStorage.setItem('hasShownBottomPopup', 'true');
        });
    }
}

// 页面加载完成后初始化功能
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM加载完成，开始初始化功能:', new Date().toISOString());

    // 初始化登录/注册标签切换功能
    setupLoginRegisterTabs();
    
    // 检查是否在登录/注册页面
    const isAuthPage = document.getElementById('loginForm') || document.getElementById('registerForm');
    
    // 如果在登录/注册页面，不要执行checkUserLoggedIn()，因为它会模拟登录状态
    let isLoggedIn = false;
    if (!isAuthPage) {
        isLoggedIn = checkUserLoggedIn();
        console.log('用户登录状态:', isLoggedIn);
    }

    // 初始化通用功能
    initPasswordToggles();
    setupRealTimeValidation();
    setupLogout();
    setupNavigation();
    setupBottomPopupForm();
    
    // 添加滚轮下滑触发登录注册弹窗功能
    setupScrollTrigger();
    
    // 初始化登录注册模态框事件
    const authModal = document.getElementById('authModal');
    const closeAuthModalButton = document.getElementById('closeAuthModalButton');
    if (authModal) {
        // 点击模态框外部关闭
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }
    
    if (closeAuthModalButton) {
        closeAuthModalButton.addEventListener('click', closeAuthModal);
    }

    // 根据页面类型初始化不同功能
    if (document.getElementById('registerForm')) {
        console.log('初始化注册表单');
            setupRegistrationForm();
        } else if (document.getElementById('loginForm')) {
            console.log('初始化登录表单');
            setupLoginForm();
            // 初始化忘记密码功能
            setupForgotPassword();
    } else if (isLoggedIn) {
        console.log('用户已登录，初始化主界面功能');
        // 主界面功能初始化
        if (document.getElementById('dashboard')) {
            console.log('初始化账单录入');
            // 初始化账单录入
            setupBillEntry();

            // 保存账单按钮事件
            const saveBillButton = document.getElementById('saveBillButton');
            if (saveBillButton) {
                saveBillButton.addEventListener('click', saveBill);
            }

            // 添加账户按钮事件
            const addAccountButton = document.getElementById('addAccountButton');
            if (addAccountButton) {
                addAccountButton.addEventListener('click', () => openAccountModal());
            }

            // 关闭账户模态框按钮事件
            const closeAccountModalButton = document.getElementById('closeAccountModalButton');
            const saveAccountButton = document.getElementById('saveAccountButton');
            if (closeAccountModalButton) {
                closeAccountModalButton.addEventListener('click', closeAccountModal);
            }
            if (saveAccountButton) {
                saveAccountButton.addEventListener('click', saveAccount);
            }

            // 加载数据
            console.log('开始加载数据');
            Promise.all([
                loadAccounts(),
                loadBills(),
                loadMonthlyStats()
            ]).then(() => {
                console.log('数据加载完成');
            }).catch(error => {
                console.error('数据加载错误:', error);
            });
        }
    }

    // 初始化VS目录模态框事件
        if (document.getElementById('closeVsDirModal')) {
            document.getElementById('closeVsDirModal').addEventListener('click', closeVsDirModal);
        }
        
        if (document.getElementById('closeVsDirModalButton')) {
            document.getElementById('closeVsDirModalButton').addEventListener('click', closeVsDirModal);
        }
        
        // 初始化通用提示模态框事件
        if (document.getElementById('closeToastModal')) {
            document.getElementById('closeToastModal').addEventListener('click', closeToastModal);
        }
        
        if (document.getElementById('closeToastModalButton')) {
            document.getElementById('closeToastModalButton').addEventListener('click', closeToastModal);
        }
        
    console.log('初始化完成:', new Date().toISOString());
});