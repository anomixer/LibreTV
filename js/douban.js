// 豆瓣熱門電影電視劇推薦功能

// 豆瓣標籤列表 - 修改為默認標籤
let defaultMovieTags = ['热门', '最新', '經典', '豆瓣高分', '冷门佳片', '華語', '歐美', '韓國', '日本', '動作', '喜劇', '愛情', '科幻', '懸疑', '恐怖', '治癒'];
let defaultTvTags = ['热门', '美剧', '英剧', '韩剧', '日剧', '国产剧', '港剧', '日本动画', '综艺', '纪录片'];

// 用戶標籤列表 - 存儲用戶實際使用的標籤（包含保留的系統標籤和用戶添加的自定義標籤）
let movieTags = [];
let tvTags = [];

// 加載用戶標籤
function loadUserTags() {
    try {
        // 嘗試從本地存儲加載用戶保存的標籤
        const savedMovieTags = localStorage.getItem('userMovieTags');
        const savedTvTags = localStorage.getItem('userTvTags');
        
        // 如果本地存儲中有標籤數據，則使用它
        if (savedMovieTags) {
            movieTags = JSON.parse(savedMovieTags);
        } else {
            // 否則使用默認標籤
            movieTags = [...defaultMovieTags];
        }
        
        if (savedTvTags) {
            tvTags = JSON.parse(savedTvTags);
        } else {
            // 否則使用默認標籤
            tvTags = [...defaultTvTags];
        }
    } catch (e) {
        console.error('加載標籤失敗：', e);
        // 初始化為默認值，防止錯誤
        movieTags = [...defaultMovieTags];
        tvTags = [...defaultTvTags];
    }
}

// 保存用戶標籤
function saveUserTags() {
    try {
        localStorage.setItem('userMovieTags', JSON.stringify(movieTags));
        localStorage.setItem('userTvTags', JSON.stringify(tvTags));
    } catch (e) {
        console.error('保存標籤失敗：', e);
        showToast('保存標籤失敗', 'error');
    }
}

let doubanMovieTvCurrentSwitch = 'movie';
let doubanCurrentTag = '热门';
let doubanPageStart = 0;
const doubanPageSize = 16; // 一次顯示的項目數量

// 初始化豆瓣功能
function initDouban() {
    // 設置豆瓣開關的初始狀態
    const doubanToggle = document.getElementById('doubanToggle');
    if (doubanToggle) {
        const isEnabled = localStorage.getItem('doubanEnabled') === 'true';
        doubanToggle.checked = isEnabled;
        
        // 設置開關外觀
        const toggleBg = doubanToggle.nextElementSibling;
        const toggleDot = toggleBg.nextElementSibling;
        if (isEnabled) {
            toggleBg.classList.add('bg-pink-600');
            toggleDot.classList.add('translate-x-6');
        }
        
        // 添加事件監聽
        doubanToggle.addEventListener('change', function(e) {
            const isChecked = e.target.checked;
            localStorage.setItem('doubanEnabled', isChecked);
            
            // 更新開關外觀
            if (isChecked) {
                toggleBg.classList.add('bg-pink-600');
                toggleDot.classList.add('translate-x-6');
            } else {
                toggleBg.classList.remove('bg-pink-600');
                toggleDot.classList.remove('translate-x-6');
            }
            
            // 更新顯示狀態
            updateDoubanVisibility();
        });
        
        // 初始更新顯示狀態
        updateDoubanVisibility();

        // 滾動到頁面頂部
        window.scrollTo(0, 0);
    }

    // 加載用戶標籤
    loadUserTags();

    // 渲染電影/電視劇切換
    renderDoubanMovieTvSwitch();
    
    // 渲染豆瓣標籤
    renderDoubanTags();
    
    // 換一批按鈕事件監聽
    setupDoubanRefreshBtn();
    
    // 初始加載熱門內容
    if (localStorage.getItem('doubanEnabled') === 'true') {
        renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
    }
}

// 根據設置更新豆瓣區域的顯示狀態
function updateDoubanVisibility() {
    const doubanArea = document.getElementById('doubanArea');
    if (!doubanArea) return;
    
    const isEnabled = localStorage.getItem('doubanEnabled') === 'true';
    const isSearching = document.getElementById('resultsArea') && 
        !document.getElementById('resultsArea').classList.contains('hidden');
    
    // 只有在啟用且沒有搜索結果顯示時才顯示豆瓣區域
    if (isEnabled && !isSearching) {
        doubanArea.classList.remove('hidden');
        // 如果豆瓣結果為空，重新加載
        if (document.getElementById('douban-results').children.length === 0) {
            renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
        }
    } else {
        doubanArea.classList.add('hidden');
    }
}

// 只填充搜索框，不執行搜索，讓用戶自主決定搜索時機
function fillSearchInput(title) {
    if (!title) return;
    
    // 安全處理標題，防止XSS
    const safeTitle = title
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = safeTitle;
        
        // 聚焦搜索框，便於用戶立即使用鍵盤操作
        input.focus();
        
        // 顯示一個提示，告知用戶點擊搜索按鈕進行搜索
        showToast('已填充搜索內容，點擊搜索按鈕開始搜索', 'info');
    }
}

// 填充搜索框並執行搜索
function fillAndSearch(title) {
    if (!title) return;
    
    // 安全處理標題，防止XSS
    const safeTitle = title
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = safeTitle;
        search(); // 使用已有的search函數執行搜索
        
        // 同時更新瀏覽器URL，使其反映當前的搜索狀態
        try {
            // 使用URI編碼確保特殊字符能夠正確顯示
            const encodedQuery = encodeURIComponent(safeTitle);
            // 使用HTML5 History API更新URL，不刷新頁面
            window.history.pushState(
                { search: safeTitle }, 
                `搜索: ${safeTitle} - LibreTV`, 
                `/s=${encodedQuery}`
            );
            // 更新頁面標題
            document.title = `搜索: ${safeTitle} - LibreTV`;
        } catch (e) {
            console.error('更新瀏覽器歷史失敗:', e);
        }
    }
}

// 填充搜索框，確保豆瓣資源API被選中，然後執行搜索
async function fillAndSearchWithDouban(title) {
    if (!title) return;
    
    // 安全處理標題，防止XSS
    const safeTitle = title
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    
    // 確保豆瓣資源API被選中
    if (typeof selectedAPIs !== 'undefined' && !selectedAPIs.includes('dbzy')) {
        // 在設置中勾選豆瓣資源API複選框
        const doubanCheckbox = document.querySelector('input[id="api_dbzy"]');
        if (doubanCheckbox) {
            doubanCheckbox.checked = true;
            
            // 觸發updateSelectedAPIs函數以更新狀態
            if (typeof updateSelectedAPIs === 'function') {
                updateSelectedAPIs();
            } else {
                // 如果函數不可用，則手動添加到selectedAPIs
                selectedAPIs.push('dbzy');
                localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
                
                // 更新選中API計數（如果有這個元素）
                const countEl = document.getElementById('selectedAPICount');
                if (countEl) {
                    countEl.textContent = selectedAPIs.length;
                }
            }
            
            showToast('已自動選擇豆瓣資源API', 'info');
        }
    }
    
    // 填充搜索框並執行搜索
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = safeTitle;
        await search(); // 使用已有的search函數執行搜索
        
        // 更新瀏覽器URL，使其反映當前的搜索狀態
        try {
            // 使用URI編碼確保特殊字符能夠正確顯示
            const encodedQuery = encodeURIComponent(safeTitle);
            // 使用HTML5 History API更新URL，不刷新頁面
            window.history.pushState(
                { search: safeTitle }, 
                `搜索: ${safeTitle} - LibreTV`, 
                `/s=${encodedQuery}`
            );
            // 更新頁面標題
            document.title = `搜索: ${safeTitle} - LibreTV`;
        } catch (e) {
            console.error('更新瀏覽器歷史失敗:', e);
        }

        if (window.innerWidth <= 768) {
          window.scrollTo({
              top: 0,
              behavior: 'smooth'
          });
        }
    }
}

// 渲染電影/電視劇切換器
function renderDoubanMovieTvSwitch() {
    // 獲取切換按鈕元素
    const movieToggle = document.getElementById('douban-movie-toggle');
    const tvToggle = document.getElementById('douban-tv-toggle');

    if (!movieToggle ||!tvToggle) return;

    movieToggle.addEventListener('click', function() {
        if (doubanMovieTvCurrentSwitch !== 'movie') {
            // 更新按鈕樣式
            movieToggle.classList.add('bg-pink-600', 'text-white');
            movieToggle.classList.remove('text-gray-300');
            
            tvToggle.classList.remove('bg-pink-600', 'text-white');
            tvToggle.classList.add('text-gray-300');
            
            doubanMovieTvCurrentSwitch = 'movie';
            doubanCurrentTag = '熱門';

            // 重新加載豆瓣內容
            renderDoubanTags(movieTags);

            // 換一批按鈕事件監聽
            setupDoubanRefreshBtn();
            
            // 初始加載熱門內容
            if (localStorage.getItem('doubanEnabled') === 'true') {
                renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
            }
        }
    });
    
    // 電視劇按鈕點擊事件
    tvToggle.addEventListener('click', function() {
        if (doubanMovieTvCurrentSwitch !== 'tv') {
            // 更新按鈕樣式
            tvToggle.classList.add('bg-pink-600', 'text-white');
            tvToggle.classList.remove('text-gray-300');
            
            movieToggle.classList.remove('bg-pink-600', 'text-white');
            movieToggle.classList.add('text-gray-300');
            
            doubanMovieTvCurrentSwitch = 'tv';
            doubanCurrentTag = '熱門';

            // 重新加載豆瓣內容
            renderDoubanTags(tvTags);

            // 換一批按鈕事件監聽
            setupDoubanRefreshBtn();
            
            // 初始加載熱門內容
            if (localStorage.getItem('doubanEnabled') === 'true') {
                renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
            }
        }
    });
}

// 渲染豆瓣標籤選擇器
function renderDoubanTags(tags) {
    const tagContainer = document.getElementById('douban-tags');
    if (!tagContainer) return;
    
    // 確定當前應該使用的標籤列表
    const currentTags = doubanMovieTvCurrentSwitch === 'movie' ? movieTags : tvTags;
    
    // 清空標籤容器
    tagContainer.innerHTML = '';

    // 先添加標籤管理按鈕
    const manageBtn = document.createElement('button');
    manageBtn.className = 'py-1.5 px-3.5 rounded text-sm font-medium transition-all duration-300 bg-[#1a1a1a] text-gray-300 hover:bg-pink-700 hover:text-white border border-[#333] hover:border-white';
    manageBtn.innerHTML = '<span class="flex items-center"><svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>管理標籤</span>';
    manageBtn.onclick = function() {
        showTagManageModal();
    };
    tagContainer.appendChild(manageBtn);

    // 添加所有標籤
    currentTags.forEach(tag => {
        const btn = document.createElement('button');
        
        // 設置樣式
        let btnClass = 'py-1.5 px-3.5 rounded text-sm font-medium transition-all duration-300 border ';
        
        // 當前選中的標籤使用高亮樣式
        if (tag === doubanCurrentTag) {
            btnClass += 'bg-pink-600 text-white shadow-md border-white';
        } else {
            btnClass += 'bg-[#1a1a1a] text-gray-300 hover:bg-pink-700 hover:text-white border-[#333] hover:border-white';
        }
        
        btn.className = btnClass;
        btn.textContent = tag;
        
        btn.onclick = function() {
            if (doubanCurrentTag !== tag) {
                doubanCurrentTag = tag;
                doubanPageStart = 0;
                renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
                renderDoubanTags();
            }
        };
        
        tagContainer.appendChild(btn);
    });
}

// 設置換一批按鈕事件
function setupDoubanRefreshBtn() {
    // 修復ID，使用正確的ID douban-refresh 而不是 douban-refresh-btn
    const btn = document.getElementById('douban-refresh');
    if (!btn) return;
    
    btn.onclick = function() {
        doubanPageStart += doubanPageSize;
        if (doubanPageStart > 9 * doubanPageSize) {
            doubanPageStart = 0;
        }
        
        renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
    };
}

function fetchDoubanTags() {
    const movieTagsTarget = `https://movie.douban.com/j/search_tags?type=movie`
    fetchDoubanData(movieTagsTarget)
        .then(data => {
            movieTags = data.tags;
            if (doubanMovieTvCurrentSwitch === 'movie') {
                renderDoubanTags(movieTags);
            }
        })
        .catch(error => {
            console.error("獲取豆瓣熱門電影標籤失敗：", error);
        });
    const tvTagsTarget = `https://movie.douban.com/j/search_tags?type=tv`
    fetchDoubanData(tvTagsTarget)
       .then(data => {
            tvTags = data.tags;
            if (doubanMovieTvCurrentSwitch === 'tv') {
                renderDoubanTags(tvTags);
            }
        })
       .catch(error => {
            console.error("獲取豆瓣熱門電視劇標籤失敗：", error);
        });
}

// 渲染熱門推薦內容
function renderRecommend(tag, pageLimit, pageStart) {
    const container = document.getElementById("douban-results");
    if (!container) return;

    const loadingOverlayHTML = `
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div class="flex items-center justify-center">
                <div class="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin inline-block"></div>
                <span class="text-pink-500 ml-4">加載中...</span>
            </div>
        </div>
    `;

    container.classList.add("relative");
    container.insertAdjacentHTML('beforeend', loadingOverlayHTML);
    
    const target = `https://movie.douban.com/j/search_subjects?type=${doubanMovieTvCurrentSwitch}&tag=${tag}&sort=recommend&page_limit=${pageLimit}&page_start=${pageStart}`;
    
    // 使用通用請求函數
    fetchDoubanData(target)
        .then(data => {
            renderDoubanCards(data, container);
        })
        .catch(error => {
            console.error("獲取豆瓣數據失敗：", error);
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-red-400">❌ 獲取豆瓣數據失敗，請稍後重試</div>
                    <div class="text-gray-500 text-sm mt-2">提示：使用VPN可能有助於解決此問題</div>
                </div>
            `;
        });
}

async function fetchDoubanData(url) {
    // 添加超時控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超時
    
    // 設置請求選項，包括信號和頭部
    const fetchOptions = {
        signal: controller.signal,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Referer': 'https://movie.douban.com/',
            'Accept': 'application/json, text/plain, */*',
        }
    };

    try {
        // 嘗試直接訪問（豆瓣API可能允許部分CORS請求）
        const response = await fetch(PROXY_URL + encodeURIComponent(url), fetchOptions);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (err) {
        console.error("豆瓣 API 請求失敗（直接代理）：", err);
        
        // 失敗後嘗試備用方法：作為備選
        const fallbackUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        
        try {
            const fallbackResponse = await fetch(fallbackUrl);
            
            if (!fallbackResponse.ok) {
                throw new Error(`備用API請求失敗! 狀態: ${fallbackResponse.status}`);
            }
            
            const data = await fallbackResponse.json();
            
            // 解析原始內容
            if (data && data.contents) {
                return JSON.parse(data.contents);
            } else {
                throw new Error("無法獲取有效數據");
            }
        } catch (fallbackErr) {
            console.error("豆瓣 API 備用請求也失敗：", fallbackErr);
            throw fallbackErr; // 向上拋出錯誤，讓調用者處理
        }
    }
}

// 抽取渲染豆瓣卡片的邏輯到單獨函數
function renderDoubanCards(data, container) {
    // 創建文檔片段以提高性能
    const fragment = document.createDocumentFragment();
    
    // 如果沒有數據
    if (!data.subjects || data.subjects.length === 0) {
        const emptyEl = document.createElement("div");
        emptyEl.className = "col-span-full text-center py-8";
        emptyEl.innerHTML = `
            <div class="text-pink-500">❌ 暫無數據，請嘗試其他分類或刷新</div>
        `;
        fragment.appendChild(emptyEl);
    } else {
        // 循環創建每個影視卡片
        data.subjects.forEach(item => {
            const card = document.createElement("div");
            card.className = "bg-[#111] hover:bg-[#222] transition-all duration-300 rounded-lg overflow-hidden flex flex-col transform hover:scale-105 shadow-md hover:shadow-lg";
            
            // 生成卡片內容，確保安全顯示（防止XSS）
            const safeTitle = item.title
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
            
            const safeRate = (item.rate || "暫無")
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            // 處理圖片URL
            // 1. 直接使用豆瓣圖片URL (添加no-referrer屬性)
            const originalCoverUrl = item.cover;
            
            // 2. 也準備代理URL作為備選
            const proxiedCoverUrl = PROXY_URL + encodeURIComponent(originalCoverUrl);
            
            // 為不同設備優化卡片佈局
            card.innerHTML = `
                <div class="relative w-full aspect-[2/3] overflow-hidden cursor-pointer" onclick="fillAndSearchWithDouban('${safeTitle}')">
                    <img src="${originalCoverUrl}" alt="${safeTitle}" 
                        class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        onerror="this.onerror=null; this.src='${proxiedCoverUrl}'; this.classList.add('object-contain');"
                        loading="lazy" referrerpolicy="no-referrer">
                    <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                    <div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-sm">
                        <span class="text-yellow-400">★</span> ${safeRate}
                    </div>
                    <div class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-sm hover:bg-[#333] transition-colors">
                        <a href="${item.url}" target="_blank" rel="noopener noreferrer" title="在豆瓣查看" onclick="event.stopPropagation();">
                            🔗
                        </a>
                    </div>
                </div>
                <div class="p-2 text-center bg-[#111]">
                    <button onclick="fillAndSearchWithDouban('${safeTitle}')" 
                            class="text-sm font-medium text-white truncate w-full hover:text-pink-400 transition"
                            title="${safeTitle}">
                        ${safeTitle}
                    </button>
                </div>
            `;
            
            fragment.appendChild(card);
        });
    }
    
    // 清空並添加所有新元素
    container.innerHTML = "";
    container.appendChild(fragment);
}

// 重置到首頁
function resetToHome() {
    resetSearchArea();
    updateDoubanVisibility();
}

// 加載豆瓣首頁內容
document.addEventListener('DOMContentLoaded', initDouban);

// 顯示標籤管理模態框
function showTagManageModal() {
    // 確保模態框在頁面上只有一個實例
    let modal = document.getElementById('tagManageModal');
    if (modal) {
        document.body.removeChild(modal);
    }
    
    // 創建模態框元素
    modal = document.createElement('div');
    modal.id = 'tagManageModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40';
    
    // 當前使用的標籤類型和默認標籤
    const isMovie = doubanMovieTvCurrentSwitch === 'movie';
    const currentTags = isMovie ? movieTags : tvTags;
    const defaultTags = isMovie ? defaultMovieTags : defaultTvTags;
    
    // 模態框內容
    modal.innerHTML = `
        <div class="bg-[#191919] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button id="closeTagModal" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
            
            <h3 class="text-xl font-bold text-white mb-4">標籤管理 (${isMovie ? '電影' : '電視劇'})</h3>
            
            <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-lg font-medium text-gray-300">標籤列表</h4>
                    <button id="resetTagsBtn" class="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded">
                        恢復默認標籤
                    </button>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4" id="tagsGrid">
                    ${currentTags.length ? currentTags.map(tag => {
                        // "熱門"標籤不能刪除
                        const canDelete = tag !== '熱門';
                        return `
                            <div class="bg-[#1a1a1a] text-gray-300 py-1.5 px-3 rounded text-sm font-medium flex justify-between items-center group">
                                <span>${tag}</span>
                                ${canDelete ? 
                                    `<button class="delete-tag-btn text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                                        data-tag="${tag}">✕</button>` : 
                                    `<span class="text-gray-500 text-xs italic opacity-0 group-hover:opacity-100">必需</span>`
                                }
                            </div>
                        `;
                    }).join('') : 
                    `<div class="col-span-full text-center py-4 text-gray-500">無標籤，請添加或恢復默認</div>`}
                </div>
            </div>
            
            <div class="border-t border-gray-700 pt-4">
                <h4 class="text-lg font-medium text-gray-300 mb-3">添加新標籤</h4>
                <form id="addTagForm" class="flex items-center">
                    <input type="text" id="newTagInput" placeholder="輸入標籤名稱..." 
                           class="flex-1 bg-[#222] text-white border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-pink-500">
                    <button type="submit" class="ml-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded">添加</button>
                </form>
                <p class="text-xs text-gray-500 mt-2">提示：標籤名稱不能為空，不能重複，不能包含特殊字符</p>
            </div>
        </div>
    `;
    
    // 添加模態框到頁面
    document.body.appendChild(modal);
    
    // 焦點放在輸入框上
    setTimeout(() => {
        document.getElementById('newTagInput').focus();
    }, 100);
    
    // 添加事件監聽器 - 關閉按鈕
    document.getElementById('closeTagModal').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // 添加事件監聽器 - 點擊模態框外部關閉
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // 添加事件監聽器 - 恢復默認標籤按鈕
    document.getElementById('resetTagsBtn').addEventListener('click', function() {
        resetTagsToDefault();
        showTagManageModal(); // 重新加載模態框
    });
    
    // 添加事件監聽器 - 刪除標籤按鈕
    const deleteButtons = document.querySelectorAll('.delete-tag-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tagToDelete = this.getAttribute('data-tag');
            deleteTag(tagToDelete);
            showTagManageModal(); // 重新加載模態框
        });
    });
    
    // 添加事件監聽器 - 表單提交
    document.getElementById('addTagForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const input = document.getElementById('newTagInput');
        const newTag = input.value.trim();
        
        if (newTag) {
            addTag(newTag);
            input.value = '';
            showTagManageModal(); // 重新加載模態框
        }
    });
}

// 添加標籤
function addTag(tag) {
    // 安全處理標籤名，防止XSS
    const safeTag = tag
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    
    // 確定當前使用的是電影還是電視劇標籤
    const isMovie = doubanMovieTvCurrentSwitch === 'movie';
    const currentTags = isMovie ? movieTags : tvTags;
    
    // 檢查是否已存在（忽略大小寫）
    const exists = currentTags.some(
        existingTag => existingTag.toLowerCase() === safeTag.toLowerCase()
    );
    
    if (exists) {
        showToast('標籤已存在', 'warning');
        return;
    }
    
    // 添加到對應的標籤數組
    if (isMovie) {
        movieTags.push(safeTag);
    } else {
        tvTags.push(safeTag);
    }
    
    // 保存到本地存儲
    saveUserTags();
    
    // 重新渲染標籤
    renderDoubanTags();
    
    showToast('標籤添加成功', 'success');
}

// 刪除標籤
function deleteTag(tag) {
    // 熱門標籤不能刪除
    if (tag === '熱門') {
        showToast('熱門標籤不能刪除', 'warning');
        return;
    }
    
    // 確定當前使用的是電影還是電視劇標籤
    const isMovie = doubanMovieTvCurrentSwitch === 'movie';
    const currentTags = isMovie ? movieTags : tvTags;
    
    // 尋找標籤索引
    const index = currentTags.indexOf(tag);
    
    // 如果找到標籤，則刪除
    if (index !== -1) {
        currentTags.splice(index, 1);
        
        // 保存到本地存儲
        saveUserTags();
        
        // 如果當前選中的是被刪除的標籤，則重置為"熱門"
        if (doubanCurrentTag === tag) {
            doubanCurrentTag = '熱門';
            doubanPageStart = 0;
            renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
        }
        
        // 重新渲染標籤
        renderDoubanTags();
        
        showToast('標籤刪除成功', 'success');
    }
}

// 重置為默認標籤
function resetTagsToDefault() {
    // 確定當前使用的是電影還是電視劇
    const isMovie = doubanMovieTvCurrentSwitch === 'movie';
    
    // 重置為默認標籤
    if (isMovie) {
        movieTags = [...defaultMovieTags];
    } else {
        tvTags = [...defaultTvTags];
    }
    
    // 設置當前標籤為熱門
    doubanCurrentTag = '熱門';
    doubanPageStart = 0;
    
    // 保存到本地存儲
    saveUserTags();
    
    // 重新渲染標籤和內容
    renderDoubanTags();
    renderRecommend(doubanCurrentTag, doubanPageSize, doubanPageStart);
    
    showToast('已恢復默認標籤', 'success');
}
