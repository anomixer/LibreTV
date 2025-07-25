// 密碼保護功能

/**
 * 檢查是否設置了密碼保護
 * 通過讀取頁面上嵌入的環境變量來檢查
 */
function isPasswordProtected() {
    // 檢查頁面上嵌入的環境變量
    const pwd = window.__ENV__ && window.__ENV__.PASSWORD;
    const adminPwd = window.__ENV__ && window.__ENV__.ADMINPASSWORD;

    // 檢查普通密碼或管理員密碼是否有效
    const isPwdValid = typeof pwd === 'string' && pwd.length === 64 && !/^0+$/.test(pwd);
    const isAdminPwdValid = typeof adminPwd === 'string' && adminPwd.length === 64 && !/^0+$/.test(adminPwd);

    // 任意一個密碼有效即認為啟用了密碼保護
    return isPwdValid || isAdminPwdValid;
}

window.isPasswordProtected = isPasswordProtected;

/**
 * 驗證用戶輸入的密碼是否正確（異步，使用SHA-256哈希）
 */
// 統一驗證函數
async function verifyPassword(password, passwordType = 'PASSWORD') {
    try {
        const correctHash = window.__ENV__?.[passwordType];
        if (!correctHash) return false;

        const inputHash = await sha256(password);
        const isValid = inputHash === correctHash;

        if (isValid) {
            const storageKey = passwordType === 'PASSWORD'
                ? PASSWORD_CONFIG.localStorageKey
                : PASSWORD_CONFIG.adminLocalStorageKey;

            localStorage.setItem(storageKey, JSON.stringify({
                verified: true,
                timestamp: Date.now(),
                passwordHash: correctHash
            }));
        }
        return isValid;
    } catch (error) {
        console.error(`驗證${passwordType}密碼時出錯:`, error);
        return false;
    }
}

// 統一驗證狀態檢查
function isVerified(passwordType = 'PASSWORD') {
    try {
        if (!isPasswordProtected()) return true;

        const storageKey = passwordType === 'PASSWORD'
            ? PASSWORD_CONFIG.localStorageKey
            : PASSWORD_CONFIG.adminLocalStorageKey;

        const stored = localStorage.getItem(storageKey);
        if (!stored) return false;

        const { timestamp, passwordHash } = JSON.parse(stored);
        const currentHash = window.__ENV__?.[passwordType];

        return timestamp && passwordHash === currentHash &&
            Date.now() - timestamp < PASSWORD_CONFIG.verificationTTL;
    } catch (error) {
        console.error(`檢查${passwordType}驗證狀態時出錯:`, error);
        return false;
    }
}

// 更新全局導出
window.isPasswordProtected = isPasswordProtected;
window.isPasswordVerified = () => isVerified('PASSWORD');
window.isAdminVerified = () => isVerified('ADMINPASSWORD');
window.verifyPassword = verifyPassword;

// SHA-256實現，可用Web Crypto API
async function sha256(message) {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // HTTP 下調用原始 js‑sha256
    if (typeof window._jsSha256 === 'function') {
        return window._jsSha256(message);
    }
    throw new Error('No SHA-256 implementation available.');
}

/**
 * 顯示密碼驗證彈窗
 */
function showPasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) {
        // 防止出現豆瓣區域滾動條
        document.getElementById('doubanArea').classList.add('hidden');
        document.getElementById('passwordCancelBtn').classList.add('hidden');

        passwordModal.style.display = 'flex';

        // 確保輸入框獲取焦點
        setTimeout(() => {
            const passwordInput = document.getElementById('passwordInput');
            if (passwordInput) {
                passwordInput.focus();
            }
        }, 100);
    }
}

/**
 * 隱藏密碼驗證彈窗
 */
function hidePasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) {
        // 隱藏密碼錯誤提示
        hidePasswordError();

        // 清空密碼輸入框
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) passwordInput.value = '';

        passwordModal.style.display = 'none';

        // 如果啟用豆瓣區域則顯示豆瓣區域
        if (localStorage.getItem('doubanEnabled') === 'true') {
            document.getElementById('doubanArea').classList.remove('hidden');
            initDouban();
        }
    }
}

/**
 * 顯示密碼錯誤信息
 */
function showPasswordError() {
    const errorElement = document.getElementById('passwordError');
    if (errorElement) {
        errorElement.classList.remove('hidden');
    }
}

/**
 * 隱藏密碼錯誤信息
 */
function hidePasswordError() {
    const errorElement = document.getElementById('passwordError');
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

/**
 * 處理密碼提交事件（異步）
 */
async function handlePasswordSubmit() {
    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput ? passwordInput.value.trim() : '';
    if (await verifyPassword(password)) {
        hidePasswordModal();

        // 觸發密碼驗證成功事件
        document.dispatchEvent(new CustomEvent('passwordVerified'));
    } else {
        showPasswordError();
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

/**
 * 初始化密碼驗證系統（需適配異步事件）
 */
// 修改initPasswordProtection函數
function initPasswordProtection() {
    if (!isPasswordProtected()) {
        return;
    }
    
    // 檢查是否有普通密碼
    const hasNormalPassword = window.__ENV__?.PASSWORD && 
                           window.__ENV__.PASSWORD.length === 64 && 
                           !/^0+$/.test(window.__ENV__.PASSWORD);
    
    // 只有當設置了普通密碼且未驗證時才顯示密碼框
    if (hasNormalPassword && !isPasswordVerified()) {
        showPasswordModal();
    }
    
    // 設置按鈕事件監聽
    const settingsBtn = document.querySelector('[onclick="toggleSettings(event)"]');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            // 只有當設置了普通密碼且未驗證時才攔截點擊
            if (hasNormalPassword && !isPasswordVerified()) {
                e.preventDefault();
                e.stopPropagation();
                showPasswordModal();
                return;
            }
            
        });
    }
}

// 設置按鈕密碼框驗證
function showAdminPasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    if (!passwordModal) return;

    // 清空密碼輸入框
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) passwordInput.value = '';

    // 修改標題為管理員驗證
    const title = passwordModal.querySelector('h2');
    if (title) title.textContent = '管理員驗證';

    document.getElementById('passwordCancelBtn').classList.remove('hidden');
    passwordModal.style.display = 'flex';

    // 設置表單提交處理
    const form = document.getElementById('passwordForm');
    if (form) {
        form.onsubmit = async function (e) {
            e.preventDefault();
            const password = document.getElementById('passwordInput').value.trim();
            if (await verifyPassword(password, 'ADMINPASSWORD')) {
                passwordModal.style.display = 'none';
                document.getElementById('settingsPanel').classList.add('show');
            } else {
                showPasswordError();
            }
        };
    }
}

// 在頁面加載完成後初始化密碼保護
document.addEventListener('DOMContentLoaded', function () {
    initPasswordProtection();
});


