// 全局常量配置
const PROXY_URL = '/proxy/';    // 適用於 Cloudflare, Netlify (帶重寫), Vercel (帶重寫)
// const HOPLAYER_URL = 'https://hoplayer.com/index.html';
const SEARCH_HISTORY_KEY = 'videoSearchHistory';
const MAX_HISTORY_ITEMS = 5;

// 密码保护配置
// 注意：PASSWORD 环境变量是必需的，所有部署都必须设置密码以确保安全
const PASSWORD_CONFIG = {
    localStorageKey: 'passwordVerified',  // 存储验证状态的键名
    verificationTTL: 90 * 24 * 60 * 60 * 1000  // 验证有效期（90天，约3个月）
};

// 網站信息配置
const SITE_CONFIG = {
    name: 'LibreTV',
    url: 'https://libretv.is-an.org',
    description: '免費在線視頻搜索與觀看平臺',
    logo: 'image/logo.png',
    version: '1.0.3'
};

// API站點配置
const API_SITES = {
    testSource: {
        api: 'https://www.example.com/api.php/provide/vod',
        name: '空內容測試源',
        adult: true
    }
    //ARCHIVE https://telegra.ph/APIs-08-12
};

// 定義合併方法
function extendAPISites(newSites) {
    Object.assign(API_SITES, newSites);
}

// 暴露到全局
window.API_SITES = API_SITES;
window.extendAPISites = extendAPISites;


// 添加聚合搜索的配置選項
const AGGREGATED_SEARCH_CONFIG = {
    enabled: true,             // 是否啟用聚合搜索
    timeout: 8000,            // 單個源超時時間（毫秒）
    maxResults: 10000,          // 最大結果數量
    parallelRequests: true,   // 是否並行請求所有源
    showSourceBadges: true    // 是否顯示來源徽章
};

// 抽象API請求配置
const API_CONFIG = {
    search: {
        // 只拼接參數部分，不再包含 /api.php/provide/vod/
        path: '?ac=videolist&wd=',
        pagePath: '?ac=videolist&wd={query}&pg={page}',
        maxPages: 50, // 最大獲取頁數
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
    },
    detail: {
        // 只拼接參數部分
        path: '?ac=videolist&ids=',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
    }
};

// 優化後的正則表達式模式
const M3U8_PATTERN = /\$https?:\/\/[^"'\s]+?\.m3u8/g;

// 添加自定義播放器URL
const CUSTOM_PLAYER_URL = 'player.html'; // 使用相對路徑引用本地player.html

// 增加視頻播放相關配置
const PLAYER_CONFIG = {
    autoplay: true,
    allowFullscreen: true,
    width: '100%',
    height: '600',
    timeout: 15000,  // 播放器加載超時時間
    filterAds: true,  // 是否啟用廣告過濾
    autoPlayNext: true,  // 默認啟用自動連播功能
    adFilteringEnabled: true, // 默認開啟分片廣告過濾
    adFilteringStorage: 'adFilteringEnabled' // 存儲廣告過濾設置的鍵名
};

// 增加錯誤信息本地化
const ERROR_MESSAGES = {
    NETWORK_ERROR: '網絡連接錯誤，請檢查網絡設置',
    TIMEOUT_ERROR: '請求超時，服務器響應時間過長',
    API_ERROR: 'API接口返回錯誤，請嘗試更換數據源',
    PLAYER_ERROR: '播放器加載失敗，請嘗試其他視頻源',
    UNKNOWN_ERROR: '發生未知錯誤，請刷新頁面重試'
};

// 添加進一步安全設置
const SECURITY_CONFIG = {
    enableXSSProtection: true,  // 是否啟用XSS保護
    sanitizeUrls: true,         // 是否清理URL
    maxQueryLength: 100,        // 最大搜索長度
    // allowedApiDomains 不再需要，因為所有請求都通過內部代理
};

// 添加多個自定義API源的配置
const CUSTOM_API_CONFIG = {
    separator: ',',           // 分隔符
    maxSources: 5,            // 最大允許的自定義源數量
    testTimeout: 5000,        // 測試超時時間(毫秒)
    namePrefix: 'Custom-',    // 自定義源名稱前綴
    validateUrl: true,        // 驗證URL格式
    cacheResults: true,       // 緩存測試結果
    cacheExpiry: 5184000000,  // 緩存過期時間(2個月)
    adultPropName: 'isAdult' // 用於標記成人內容的屬性名
};

// 隱藏內置黃色採集站API的變量
const HIDE_BUILTIN_ADULT_APIS = false;
