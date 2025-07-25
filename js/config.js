// 全局常量配置
const PROXY_URL = '/proxy/';    // 適用於 Cloudflare, Netlify (帶重寫), Vercel (帶重寫)
// const HOPLAYER_URL = 'https://hoplayer.com/index.html';
const SEARCH_HISTORY_KEY = 'videoSearchHistory';
const MAX_HISTORY_ITEMS = 5;

// 密碼保護配置
const PASSWORD_CONFIG = {
    localStorageKey: 'passwordVerified',  // 存儲驗證狀態的鍵名
    verificationTTL: 90 * 24 * 60 * 60 * 1000,  // 驗證有效期（90天，約3個月）
    adminLocalStorageKey: 'adminPasswordVerified'  // 新增的管理員驗證狀態的鍵名
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
    dyttzy: {
        api: 'http://caiji.dyttzyapi.com/api.php/provide/vod',
        name: '電影天堂資源',
        detail: 'http://caiji.dyttzyapi.com', 
    },
    ruyi: {
        api: 'https://cj.rycjapi.com/api.php/provide/vod',
        name: '如意資源',
    },
    bfzy: {
        api: 'https://bfzyapi.com/api.php/provide/vod',
        name: '暴風資源',
    },
    tyyszy: {
        api: 'https://tyyszy.com/api.php/provide/vod',
        name: '天涯資源',
    },
    xiaomaomi: {
        api: 'https://zy.xmm.hk/api.php/provide/vod',
        name: '小貓咪資源',
    },
    ffzy: {
        api: 'http://ffzy5.tv/api.php/provide/vod',
        name: '非凡影視',
        detail: 'http://ffzy5.tv', 
    },
    heimuer: {
        api: 'https://json.heimuer.xyz/api.php/provide/vod',
        name: '黑木耳',
        detail: 'https://heimuer.tv', 
    },
    zy360: {
        api: 'https://360zy.com/api.php/provide/vod',
        name: '360資源',
    },
    iqiyi: {
        api: 'https://www.iqiyizyapi.com/api.php/provide/vod',
        name: 'iqiyi資源',
    },
    wolong: {
        api: 'https://wolongzyw.com/api.php/provide/vod',
        name: '臥龍資源',
    }, 
    hwba: {
        api: 'https://cjhwba.com/api.php/provide/vod',
        name: '華為吧資源',
    },
    jisu: {
        api: 'https://jszyapi.com/api.php/provide/vod',
        name: '極速資源',
        detail: 'https://jszyapi.com', 
    },
    dbzy: {
        api: 'https://dbzy.tv/api.php/provide/vod',
        name: '豆瓣資源',
    },
    mozhua: {
        api: 'https://mozhuazy.com/api.php/provide/vod',
        name: '魔爪資源',
    },
    mdzy: {
        api: 'https://www.mdzyapi.com/api.php/provide/vod',
        name: '魔都資源',
    },
    zuid: {
        api: 'https://api.zuidapi.com/api.php/provide/vod',
        name: '最大資源'
    },
    yinghua: {
        api: 'https://m3u8.apiyhzy.com/api.php/provide/vod',
        name: '櫻花資源'
    },
    baidu: {
        api: 'https://api.apibdzy.com/api.php/provide/vod',
        name: '百度雲資源'
    },
    wujin: {
        api: 'https://api.wujinapi.me/api.php/provide/vod',
        name: '無盡資源'
    },
    wwzy: {
        api: 'https://wwzy.tv/api.php/provide/vod',
        name: '旺旺短劇'
    },
    ikun: {
        api: 'https://ikunzyapi.com/api.php/provide/vod',
        name: 'iKun資源'
    },
    lzi: {
        api: 'https://cj.lziapi.com/api.php/provide/vod/',
        name: '量子資源站'
    },
    testSource: {
        api: 'https://www.example.com/api.php/provide/vod',
        name: '空內容測試源',
        adult: true
    },
    // 下面是一些成人內容的API源，默認隱藏，使用本項目瀏覽黃色內容違背項目初衷
    // 互聯網上傳播的色情內容將人徹底客體化、工具化，是性別解放和人類平等道路上的巨大障礙。
    // 這些黃色影片是資本主義父權制壓迫的最惡毒體現，它將暴力和屈辱商品化，踐踏人的尊嚴，對受害者造成無法彌愈的傷害，並毒害社會關係。
    // 資本為了利潤，不惜將最卑劣的剝削（包括對受害者和表演者的剝削）和暴力商品化，
    // 把性別剝削塑造成“性享受”麻痺觀眾的意識，轉移我們對現實生活中矛盾和壓迫的注意力。
    // 這些影片和背後的產業已經使數百萬男女“下海”，出賣自己的身體，甚至以此為生計。
    // 而作為觀眾無辜嗎？毫無疑問，他們促成了黃色產業鏈的再生產。
    // 我們提供此警告，是希望您能認清這些內容的本質——它們是壓迫和奴役的工具，而非娛樂。
    // ckzy: {
    //     api: 'https://www.ckzy1.com',
    //     name: 'CK資源',
    //     adult: true
    // },
    // jkun: {
    //     api: 'https://jkunzyapi.com',
    //     name: 'jkun資源',
    //     adult: true
    // },
    // bwzy: {
    //     api: 'https://api.bwzym3u8.com',
    //     name: '百萬資源',
    //     adult: true
    // },
    // souav: {
    //     api: 'https://api.souavzy.vip',
    //     name: 'souav資源',
    //     adult: true
    // },
    // r155: {
    //     api: 'https://155api.com',
    //     name: '155資源',
    //     adult: true
    // },
    // lsb: {
    //     api: 'https://apilsbzy1.com',
    //     name: 'lsb資源',
    //     adult: true
    // },
    // huangcang: {
    //     api: 'https://hsckzy.vip',
    //     name: '黃色倉庫',
    //     adult: true,
    //     detail: 'https://hsckzy.vip'
    // },
    // yutu: {
    //     api: 'https://yutuzy10.com',
    //     name: '玉兔資源',
    //     adult: true
    // },

    // 下面是資源失效率高的API源，不建議使用
    // subo: {
    //     api: 'https://subocaiji.com/api.php/provide/vod',
    //     name: '速播資源'
    // },
    // fczy: {
    //     api: 'https://api.fczy888.me/api.php/provide/vod',
    //     name: '蜂巢資源'
    // },
    // ukzy: {
    //     api: 'https://api.ukuapi88.com/api.php/provide/vod',
    //     name: 'U酷資源'
    // },
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
