// 密碼保護功能

/**
 * 檢查是否設置了密碼保護
 * 通過讀取頁面上嵌入的環境變量來檢查
 */
function isPasswordProtected() {
    // 檢查頁面上嵌入的環境變量
    const pwd = window.__ENV__ && window.__ENV__.PASSWORD;
    const adminPwd = window.__ENV__ && window.__ENV__.ADMINPASSWORD;

    // 檢查普通密碼是否有效
    const isPwdValid = typeof pwd === 'string' && pwd.length === 64 && !/^0+$/.test(pwd);
    const isAdminPwdValid = typeof adminPwd === 'string' && adminPwd.length === 64 && !/^0+$/.test(adminPwd);

    // 任意一個密碼有效即認為啟用了密碼保護
    return isPwdValid || isAdminPwdValid;
}

/**
 * 檢查是否強制要求設置密碼
 * 本站不強制設密碼——密碼是可選的安全配置
 */
function isPasswordRequired() {
    return false; // 密碼為可選，不強制
}

/**
 * 強制密碼保護檢查 - 只在設置了密碼且未驗證時攔截
 */
function ensurePasswordProtection() {
    if (isPasswordProtected() && !isPasswordVerified()) {
        showPasswordModal();
        throw new Error('Password verification required');
    }
    return true;
}

window.isPasswordProtected = isPasswordProtected;
window.isPasswordRequired = isPasswordRequired;

/**
 * 驗證用戶輸入的密碼是否正確（異步，使用SHA-256哈希）
 */
// 統一驗證函數（支持普通密碼和管理員密碼）
async function verifyPassword(password, passwordType = 'PASSWORD') {
    try {
        const correctHash = window.__ENV__?.[passwordType];
        if (!correctHash) return false;

        const inputHash = await sha256(password);
        const isValid = inputHash === correctHash;

        if (isValid) {
            const storageKey = passwordType === 'ADMINPASSWORD'
                ? PASSWORD_CONFIG.adminLocalStorageKey
                : PASSWORD_CONFIG.localStorageKey;
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

        const storageKey = passwordType === 'ADMINPASSWORD'
            ? PASSWORD_CONFIG.adminLocalStorageKey
            : PASSWORD_CONFIG.localStorageKey;
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

function isPasswordVerified() {
    return isVerified('PASSWORD');
}

// 更新全局導出
window.isPasswordProtected = isPasswordProtected;
window.isPasswordRequired = isPasswordRequired;
window.isPasswordVerified = isPasswordVerified;
window.verifyPassword = verifyPassword;
window.ensurePasswordProtection = ensurePasswordProtection;

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
        const doubanArea = document.getElementById('doubanArea');
        if (doubanArea) doubanArea.classList.add('hidden');
        const cancelBtn = document.getElementById('passwordCancelBtn');
        if (cancelBtn) cancelBtn.classList.add('hidden');

        // 正常的密碼驗證模式（密碼必須已設置）
        const title = passwordModal.querySelector('h2');
        const description = passwordModal.querySelector('p');
        if (title) title.textContent = '訪問驗證';
        if (description) description.textContent = '請輸入密碼繼續訪問';

        const form = passwordModal.querySelector('form');
        if (form) form.style.display = 'block';

        passwordModal.style.display = 'flex';

        // 確保輸入框獲取焦點
        if (!isPasswordRequired()) {
            setTimeout(() => {
                const passwordInput = document.getElementById('passwordInput');
                if (passwordInput) {
                    passwordInput.focus();
                }
            }, 100);
        }
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
            const doubanArea = document.getElementById('doubanArea');
            if (doubanArea) doubanArea.classList.remove('hidden');
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
function initPasswordProtection() {
    // 如果設置了密碼但用戶未驗證，顯示密碼輸入框
    if (isPasswordProtected() && !isPasswordVerified()) {
        showPasswordModal();
        return;
    }

    // 設置按鈕事件監聽
    const settingsBtn = document.querySelector('[onclick="toggleSettings(event)"]');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            // 只有當設置了普通密碼且未驗證時才攔截點擊
            if (isPasswordProtected() && !isPasswordVerified()) {
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

    const cancelBtn = document.getElementById('passwordCancelBtn');
    if (cancelBtn) cancelBtn.classList.remove('hidden');
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