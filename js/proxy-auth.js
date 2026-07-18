/**
 * 代理请求鉴权模块
 * 为代理请求添加基于 PASSWORD 的鉴权机制
 */

// 从全局配置获取密码哈希（如果存在）
let cachedPasswordHash = null;

/**
 * 获取当前会话的密码哈希
 */
async function getPasswordHash() {
    if (cachedPasswordHash) {
        return cachedPasswordHash;
    }
    
    // 1. 優先從已存儲的代理鑑權哈希獲取
    const storedHash = localStorage.getItem('proxyAuthHash');
    if (storedHash) {
        cachedPasswordHash = storedHash;
        return storedHash;
    }
    
    // 2. 從 password.js 存儲的驗證狀態 JSON 中讀取 (key: 'passwordVerified', value: JSON{verified,timestamp,passwordHash})
    try {
        const passwordVerifiedRaw = localStorage.getItem('passwordVerified');
        if (passwordVerifiedRaw) {
            const parsed = JSON.parse(passwordVerifiedRaw);
            if (parsed && parsed.passwordHash) {
                localStorage.setItem('proxyAuthHash', parsed.passwordHash);
                cachedPasswordHash = parsed.passwordHash;
                return parsed.passwordHash;
            }
        }
    } catch (e) {
        // 舊版本可能只是字串 'true'，忽略解析錯誤
    }
    
    // 3. 直接使用頁面注入的環境變量密碼哈希（不需登入的情況下也能代理）
    if (window.__ENV__ && window.__ENV__.PASSWORD) {
        cachedPasswordHash = window.__ENV__.PASSWORD;
        return window.__ENV__.PASSWORD;
    }
    
    return null;
}


/**
 * 为代理请求URL添加鉴权参数
 */
async function addAuthToProxyUrl(url) {
    try {
        const hash = await getPasswordHash();
        if (!hash) {
            console.warn('无法获取密码哈希，代理请求可能失败');
            return url;
        }
        
        // 添加时间戳防止重放攻击
        const timestamp = Date.now();
        
        // 检查URL是否已包含查询参数
        const separator = url.includes('?') ? '&' : '?';
        
        return `${url}${separator}auth=${encodeURIComponent(hash)}&t=${timestamp}`;
    } catch (error) {
        console.error('添加代理鉴权失败:', error);
        return url;
    }
}

/**
 * 验证代理请求的鉴权
 */
function validateProxyAuth(authHash, serverPasswordHash, timestamp) {
    if (!authHash || !serverPasswordHash) {
        return false;
    }
    
    // 验证哈希是否匹配
    if (authHash !== serverPasswordHash) {
        return false;
    }
    
    // 验证时间戳（10分钟有效期）
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10分钟
    
    if (timestamp && (now - parseInt(timestamp)) > maxAge) {
        console.warn('代理请求时间戳过期');
        return false;
    }
    
    return true;
}

/**
 * 清除缓存的鉴权信息
 */
function clearAuthCache() {
    cachedPasswordHash = null;
    localStorage.removeItem('proxyAuthHash');
}

// 监听密码变化，清除缓存
window.addEventListener('storage', (e) => {
    if (e.key === 'userPassword' || (window.PASSWORD_CONFIG && e.key === window.PASSWORD_CONFIG.localStorageKey)) {
        clearAuthCache();
    }
});

// 导出函数
window.ProxyAuth = {
    addAuthToProxyUrl,
    validateProxyAuth,
    clearAuthCache,
    getPasswordHash
};
