const selectedAPIs = JSON.parse(localStorage.getItem('selectedAPIs') || '[]');
const customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]'); // 存儲自定義API列表

// 改進返回功能
function goBack(event) {
    // 防止默認鏈接行為
    if (event) event.preventDefault();
    
    // 1. 優先檢查URL參數中的returnUrl
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl');
    
    if (returnUrl) {
        // 如果URL中有returnUrl參數，優先使用
        window.location.href = decodeURIComponent(returnUrl);
        return;
    }
    
    // 2. 檢查localStorage中保存的lastPageUrl
    const lastPageUrl = localStorage.getItem('lastPageUrl');
    if (lastPageUrl && lastPageUrl !== window.location.href) {
        window.location.href = lastPageUrl;
        return;
    }
    
    // 3. 檢查是否是從搜索頁面進入的播放器
    const referrer = document.referrer;
    
    // 檢查 referrer 是否包含搜索參數
    if (referrer && (referrer.includes('/s=') || referrer.includes('?s='))) {
        // 如果是從搜索頁面來的，返回到搜索頁面
        window.location.href = referrer;
        return;
    }
    
    // 4. 如果是在iframe中打開的，嘗試關閉iframe
    if (window.self !== window.top) {
        try {
            // 嘗試調用父窗口的關閉播放器函數
            window.parent.closeVideoPlayer && window.parent.closeVideoPlayer();
            return;
        } catch (e) {
            console.error('調用父窗口closeVideoPlayer失敗:', e);
        }
    }
    
    // 5. 無法確定上一頁，則返回首頁
    if (!referrer || referrer === '') {
        window.location.href = '/';
        return;
    }
    
    // 6. 以上都不滿足，使用默認行為：返回上一頁
    window.history.back();
}

// 頁面加載時保存當前URL到localStorage，作為返回目標
window.addEventListener('load', function () {
    // 保存前一頁面URL
    if (document.referrer && document.referrer !== window.location.href) {
        localStorage.setItem('lastPageUrl', document.referrer);
    }

    // 提取當前URL中的重要參數，以便在需要時能夠恢復當前頁面
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');
    const sourceCode = urlParams.get('source');

    if (videoId && sourceCode) {
        // 保存當前播放狀態，以便其他頁面可以返回
        localStorage.setItem('currentPlayingId', videoId);
        localStorage.setItem('currentPlayingSource', sourceCode);
    }
});


// =================================
// ============== PLAYER ==========
// =================================
// 全局變量
let currentVideoTitle = '';
let currentEpisodeIndex = 0;
let art = null; // 用於 ArtPlayer 實例
let currentHls = null; // 跟蹤當前HLS實例
let currentEpisodes = [];
let episodesReversed = false;
let autoplayEnabled = true; // 默認開啟自動連播
let videoHasEnded = false; // 跟蹤視頻是否已經自然結束
let userClickedPosition = null; // 記錄用戶點擊的位置
let shortcutHintTimeout = null; // 用於控制快捷鍵提示顯示時間
let adFilteringEnabled = true; // 默認開啟廣告過濾
let progressSaveInterval = null; // 定期保存進度的計時器
let currentVideoUrl = ''; // 記錄當前實際的視頻URL
const isWebkit = (typeof window.webkitConvertPointFromNodeToPage === 'function')
Artplayer.FULLSCREEN_WEB_IN_BODY = true;

// 頁面加載
document.addEventListener('DOMContentLoaded', function () {
    // 先檢查用戶是否已通過密碼驗證
    if (!isPasswordVerified()) {
        // 隱藏加載提示
        document.getElementById('player-loading').style.display = 'none';
        return;
    }

    initializePageContent();
});

// 監聽密碼驗證成功事件
document.addEventListener('passwordVerified', () => {
    document.getElementById('player-loading').style.display = 'block';

    initializePageContent();
});

// 初始化頁面內容
function initializePageContent() {

    // 解析URL參數
    const urlParams = new URLSearchParams(window.location.search);
    let videoUrl = urlParams.get('url');
    const title = urlParams.get('title');
    const sourceCode = urlParams.get('source');
    let index = parseInt(urlParams.get('index') || '0');
    const episodesList = urlParams.get('episodes'); // 從URL獲取集數信息
    const savedPosition = parseInt(urlParams.get('position') || '0'); // 獲取保存的播放位置
    // 解決歷史記錄問題：檢查URL是否是player.html開頭的鏈接
    // 如果是，說明這是歷史記錄重定向，需要解析真實的視頻URL
    if (videoUrl && videoUrl.includes('player.html')) {
        try {
            // 嘗試從嵌套URL中提取真實的視頻鏈接
            const nestedUrlParams = new URLSearchParams(videoUrl.split('?')[1]);
            // 從嵌套參數中獲取真實視頻URL
            const nestedVideoUrl = nestedUrlParams.get('url');
            // 檢查嵌套URL是否包含播放位置信息
            const nestedPosition = nestedUrlParams.get('position');
            const nestedIndex = nestedUrlParams.get('index');
            const nestedTitle = nestedUrlParams.get('title');

            if (nestedVideoUrl) {
                videoUrl = nestedVideoUrl;

                // 更新當前URL參數
                const url = new URL(window.location.href);
                if (!urlParams.has('position') && nestedPosition) {
                    url.searchParams.set('position', nestedPosition);
                }
                if (!urlParams.has('index') && nestedIndex) {
                    url.searchParams.set('index', nestedIndex);
                }
                if (!urlParams.has('title') && nestedTitle) {
                    url.searchParams.set('title', nestedTitle);
                }
                // 替換當前URL
                window.history.replaceState({}, '', url);
            } else {
                showError('歷史記錄鏈接無效，請返回首頁重新訪問');
            }
        } catch (e) {
        }
    }

    // 保存當前視頻URL
    currentVideoUrl = videoUrl || '';

    // 從localStorage獲取數據
    currentVideoTitle = title || localStorage.getItem('currentVideoTitle') || '未知視頻';
    currentEpisodeIndex = index;

    // 設置自動連播開關狀態
    autoplayEnabled = localStorage.getItem('autoplayEnabled') !== 'false'; // 默認為true
    document.getElementById('autoplayToggle').checked = autoplayEnabled;

    // 獲取廣告過濾設置
    adFilteringEnabled = localStorage.getItem(PLAYER_CONFIG.adFilteringStorage) !== 'false'; // 默認為true

    // 監聽自動連播開關變化
    document.getElementById('autoplayToggle').addEventListener('change', function (e) {
        autoplayEnabled = e.target.checked;
        localStorage.setItem('autoplayEnabled', autoplayEnabled);
    });

    // 優先使用URL傳遞的集數信息，否則從localStorage獲取
    try {
        if (episodesList) {
            // 如果URL中有集數數據，優先使用它
            currentEpisodes = JSON.parse(decodeURIComponent(episodesList));

        } else {
            // 否則從localStorage獲取
            currentEpisodes = JSON.parse(localStorage.getItem('currentEpisodes') || '[]');

        }

        // 檢查集數索引是否有效，如果無效則調整為0
        if (index < 0 || (currentEpisodes.length > 0 && index >= currentEpisodes.length)) {
            // 如果索引太大，則使用最大有效索引
            if (index >= currentEpisodes.length && currentEpisodes.length > 0) {
                index = currentEpisodes.length - 1;
            } else {
                index = 0;
            }

            // 更新URL以反映修正後的索引
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('index', index);
            window.history.replaceState({}, '', newUrl);
        }

        // 更新當前索引為驗證過的值
        currentEpisodeIndex = index;

        episodesReversed = localStorage.getItem('episodesReversed') === 'true';
    } catch (e) {
        currentEpisodes = [];
        currentEpisodeIndex = 0;
        episodesReversed = false;
    }

    // 設置頁面標題
    document.title = currentVideoTitle + ' - LibreTV播放器';
    document.getElementById('videoTitle').textContent = currentVideoTitle;

    // 初始化播放器
    if (videoUrl) {
        initPlayer(videoUrl);
    } else {
        showError('無效的視頻鏈接');
    }

    // 渲染源信息
    renderResourceInfoBar();

    // 更新集數信息
    updateEpisodeInfo();

    // 渲染集數列表
    renderEpisodes();

    // 更新按鈕狀態
    updateButtonStates();

    // 更新排序按鈕狀態
    updateOrderButton();

    // 添加對進度條的監聽，確保點擊準確跳轉
    setTimeout(() => {
        setupProgressBarPreciseClicks();
    }, 1000);

    // 添加鍵盤快捷鍵事件監聽
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // 添加頁面離開事件監聽，保存播放位置
    window.addEventListener('beforeunload', saveCurrentProgress);

    // 新增：頁面隱藏（切後臺/切標籤）時也保存
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            saveCurrentProgress();
        }
    });

    // 視頻暫停時也保存
    const waitForVideo = setInterval(() => {
        if (art && art.video) {
            art.video.addEventListener('pause', saveCurrentProgress);

            // 新增：播放進度變化時節流保存
            let lastSave = 0;
            art.video.addEventListener('timeupdate', function() {
                const now = Date.now();
                if (now - lastSave > 5000) { // 每5秒最多保存一次
                    saveCurrentProgress();
                    lastSave = now;
                }
            });

            clearInterval(waitForVideo);
        }
    }, 200);
}

// 處理鍵盤快捷鍵
function handleKeyboardShortcuts(e) {
    // 忽略輸入框中的按鍵事件
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Alt + 左箭頭 = 上一集
    if (e.altKey && e.key === 'ArrowLeft') {
        if (currentEpisodeIndex > 0) {
            playPreviousEpisode();
            showShortcutHint('上一集', 'left');
            e.preventDefault();
        }
    }

    // Alt + 右箭頭 = 下一集
    if (e.altKey && e.key === 'ArrowRight') {
        if (currentEpisodeIndex < currentEpisodes.length - 1) {
            playNextEpisode();
            showShortcutHint('下一集', 'right');
            e.preventDefault();
        }
    }

    // 左箭頭 = 快退
    if (!e.altKey && e.key === 'ArrowLeft') {
        if (art && art.currentTime > 5) {
            art.currentTime -= 5;
            showShortcutHint('快退', 'left');
            e.preventDefault();
        }
    }

    // 右箭頭 = 快進
    if (!e.altKey && e.key === 'ArrowRight') {
        if (art && art.currentTime < art.duration - 5) {
            art.currentTime += 5;
            showShortcutHint('快進', 'right');
            e.preventDefault();
        }
    }

    // 上箭頭 = 音量+
    if (e.key === 'ArrowUp') {
        if (art && art.volume < 1) {
            art.volume += 0.1;
            showShortcutHint('音量+', 'up');
            e.preventDefault();
        }
    }

    // 下箭頭 = 音量-
    if (e.key === 'ArrowDown') {
        if (art && art.volume > 0) {
            art.volume -= 0.1;
            showShortcutHint('音量-', 'down');
            e.preventDefault();
        }
    }

    // 空格 = 播放/暫停
    if (e.key === ' ') {
        if (art) {
            art.toggle();
            showShortcutHint('播放/暫停', 'play');
            e.preventDefault();
        }
    }

    // f 鍵 = 切換全屏
    if (e.key === 'f' || e.key === 'F') {
        if (art) {
            art.fullscreen = !art.fullscreen;
            showShortcutHint('切換全屏', 'fullscreen');
            e.preventDefault();
        }
    }
}

// 顯示快捷鍵提示
function showShortcutHint(text, direction) {
    const hintElement = document.getElementById('shortcutHint');
    const textElement = document.getElementById('shortcutText');
    const iconElement = document.getElementById('shortcutIcon');

    // 清除之前的超時
    if (shortcutHintTimeout) {
        clearTimeout(shortcutHintTimeout);
    }

    // 設置文本和圖標方向
    textElement.textContent = text;

    if (direction === 'left') {
        iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>';
    } else if (direction === 'right') {
        iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>';
    }  else if (direction === 'up') {
        iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>';
    } else if (direction === 'down') {
        iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';
    } else if (direction === 'fullscreen') {
        iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path>';
    } else if (direction === 'play') {
        iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l14 9-14 9V3z"></path>';
    }

    // 顯示提示
    hintElement.classList.add('show');

    // 兩秒後隱藏
    shortcutHintTimeout = setTimeout(() => {
        hintElement.classList.remove('show');
    }, 2000);
}

// 初始化播放器
function initPlayer(videoUrl) {
    if (!videoUrl) {
        return
    }

    // 銷燬舊實例
    if (art) {
        art.destroy();
        art = null;
    }

    // 配置HLS.js選項
    const hlsConfig = {
        debug: false,
        loader: adFilteringEnabled ? CustomHlsJsLoader : Hls.DefaultConfig.loader,
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.5,
        fragLoadingMaxRetry: 6,
        fragLoadingMaxRetryTimeout: 64000,
        fragLoadingRetryDelay: 1000,
        manifestLoadingMaxRetry: 3,
        manifestLoadingRetryDelay: 1000,
        levelLoadingMaxRetry: 4,
        levelLoadingRetryDelay: 1000,
        startLevel: -1,
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
        abrMaxWithRealBitrate: true,
        stretchShortVideoTrack: true,
        appendErrorMaxRetry: 5,  // 增加嘗試次數
        liveSyncDurationCount: 3,
        liveDurationInfinity: false
    };

    // Create new ArtPlayer instance
    art = new Artplayer({
        container: '#player',
        url: videoUrl,
        type: 'm3u8',
        title: videoTitle,
        volume: 0.8,
        isLive: false,
        muted: false,
        autoplay: true,
        pip: true,
        autoSize: false,
        autoMini: true,
        screenshot: true,
        setting: true,
        loop: false,
        flip: false,
        playbackRate: true,
        aspectRatio: false,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: false,
        miniProgressBar: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: false,
        airplay: true,
        hotkey: false,
        theme: '#23ade5',
        lang: navigator.language.toLowerCase(),
        moreVideoAttr: {
            crossOrigin: 'anonymous',
        },
        customType: {
            m3u8: function (video, url) {
                // 清理之前的HLS實例
                if (currentHls && currentHls.destroy) {
                    try {
                        currentHls.destroy();
                    } catch (e) {
                    }
                }

                // 創建新的HLS實例
                const hls = new Hls(hlsConfig);
                currentHls = hls;

                // 跟蹤是否已經顯示錯誤
                let errorDisplayed = false;
                // 跟蹤是否有錯誤發生
                let errorCount = 0;
                // 跟蹤視頻是否開始播放
                let playbackStarted = false;
                // 跟蹤視頻是否出現bufferAppendError
                let bufferAppendErrorCount = 0;

                // 監聽視頻播放事件
                video.addEventListener('playing', function () {
                    playbackStarted = true;
                    document.getElementById('player-loading').style.display = 'none';
                    document.getElementById('error').style.display = 'none';
                });

                // 監聽視頻進度事件
                video.addEventListener('timeupdate', function () {
                    if (video.currentTime > 1) {
                        // 視頻進度超過1秒，隱藏錯誤（如果存在）
                        document.getElementById('error').style.display = 'none';
                    }
                });

                hls.loadSource(url);
                hls.attachMedia(video);

                // enable airplay, from https://github.com/video-dev/hls.js/issues/5989
                // 檢查是否已存在source元素，如果存在則更新，不存在則創建
                let sourceElement = video.querySelector('source');
                if (sourceElement) {
                    // 更新現有source元素的URL
                    sourceElement.src = videoUrl;
                } else {
                    // 創建新的source元素
                    sourceElement = document.createElement('source');
                    sourceElement.src = videoUrl;
                    video.appendChild(sourceElement);
                }
                video.disableRemotePlayback = false;

                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    video.play().catch(e => {
                    });
                });

                hls.on(Hls.Events.ERROR, function (event, data) {
                    // 增加錯誤計數
                    errorCount++;

                    // 處理bufferAppendError
                    if (data.details === 'bufferAppendError') {
                        bufferAppendErrorCount++;
                        // 如果視頻已經開始播放，則忽略這個錯誤
                        if (playbackStarted) {
                            return;
                        }

                        // 如果出現多次bufferAppendError但視頻未播放，嘗試恢復
                        if (bufferAppendErrorCount >= 3) {
                            hls.recoverMediaError();
                        }
                    }

                    // 如果是致命錯誤，且視頻未播放
                    if (data.fatal && !playbackStarted) {
                        // 嘗試恢復錯誤
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                // 僅在多次恢復嘗試後顯示錯誤
                                if (errorCount > 3 && !errorDisplayed) {
                                    errorDisplayed = true;
                                    showError('視頻加載失敗，可能是格式不兼容或源不可用');
                                }
                                break;
                        }
                    }
                });

                // 監聽分段加載事件
                hls.on(Hls.Events.FRAG_LOADED, function () {
                    document.getElementById('player-loading').style.display = 'none';
                });

                // 監聽級別加載事件
                hls.on(Hls.Events.LEVEL_LOADED, function () {
                    document.getElementById('player-loading').style.display = 'none';
                });
            }
        }
    });

    // artplayer 沒有 'fullscreenWeb:enter', 'fullscreenWeb:exit' 等事件
    // 所以原控制欄隱藏代碼並沒有起作用
    // 實際起作用的是 artplayer 默認行為，它支持自動隱藏工具欄
    // 但有一個 bug： 在副屏全屏時，鼠標移出副屏後不會自動隱藏工具欄
    // 下面進一併重構和修復：
    let hideTimer;

    // 隱藏控制欄
    function hideControls() {
        if (art && art.controls) {
            art.controls.show = false;
        }
    }

    // 重置計時器，計時器超時時間與 artplayer 保持一致
    function resetHideTimer() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            hideControls();
        }, Artplayer.CONTROL_HIDE_TIME);
    }

    // 處理鼠標離開瀏覽器窗口
    function handleMouseOut(e) {
        if (e && !e.relatedTarget) {
            resetHideTimer();
        }
    }

    // 全屏狀態切換時註冊/移除 mouseout 事件，監聽鼠標移出屏幕事件
    // 從而對播放器狀態欄進行隱藏倒計時
    function handleFullScreen(isFullScreen, isWeb) {
        if (isFullScreen) {
            document.addEventListener('mouseout', handleMouseOut);
        } else {
            document.removeEventListener('mouseout', handleMouseOut);
            // 退出全屏時清理計時器
            clearTimeout(hideTimer);
        }

        if (!isWeb) {
            if (window.screen.orientation && window.screen.orientation.lock) {
                window.screen.orientation.lock('landscape')
                    .then(() => {
                    })
                    .catch((error) => {
                    });
            }
        }
    }

    // 播放器加載完成後初始隱藏工具欄
    art.on('ready', () => {
        hideControls();
    });

    // 全屏 Web 模式處理
    art.on('fullscreenWeb', function (isFullScreen) {
        handleFullScreen(isFullScreen, true);
    });

    // 全屏模式處理
    art.on('fullscreen', function (isFullScreen) {
        handleFullScreen(isFullScreen, false);
    });

    art.on('video:loadedmetadata', function() {
        document.getElementById('player-loading').style.display = 'none';
        videoHasEnded = false; // 視頻加載時重置結束標誌
        // 優先使用URL傳遞的position參數
        const urlParams = new URLSearchParams(window.location.search);
        const savedPosition = parseInt(urlParams.get('position') || '0');

        if (savedPosition > 10 && savedPosition < art.duration - 2) {
            // 如果URL中有有效的播放位置參數，直接使用它
            art.currentTime = savedPosition;
            showPositionRestoreHint(savedPosition);
        } else {
            // 否則嘗試從本地存儲恢復播放進度
            try {
                const progressKey = 'videoProgress_' + getVideoId();
                const progressStr = localStorage.getItem(progressKey);
                if (progressStr && art.duration > 0) {
                    const progress = JSON.parse(progressStr);
                    if (
                        progress &&
                        typeof progress.position === 'number' &&
                        progress.position > 10 &&
                        progress.position < art.duration - 2
                    ) {
                        art.currentTime = progress.position;
                        showPositionRestoreHint(progress.position);
                    }
                }
            } catch (e) {
            }
        }

        // 設置進度條點擊監聽
        setupProgressBarPreciseClicks();

        // 視頻加載成功後，在稍微延遲後將其添加到觀看歷史
        setTimeout(saveToHistory, 3000);

        // 啟動定期保存播放進度
        startProgressSaveInterval();
    })

    // 錯誤處理
    art.on('video:error', function (error) {
        // 如果正在切換視頻，忽略錯誤
        if (window.isSwitchingVideo) {
            return;
        }

        // 隱藏所有加載指示器
        const loadingElements = document.querySelectorAll('#player-loading, .player-loading-container');
        loadingElements.forEach(el => {
            if (el) el.style.display = 'none';
        });

        showError('視頻播放失敗: ' + (error.message || '未知錯誤'));
    });

    // 添加移動端長按三倍速播放功能
    setupLongPressSpeedControl();

    // 視頻播放結束事件
    art.on('video:ended', function () {
        videoHasEnded = true;

        clearVideoProgress();

        // 如果自動播放下一集開啟，且確實有下一集
        if (autoplayEnabled && currentEpisodeIndex < currentEpisodes.length - 1) {
            // 稍長延遲以確保所有事件處理完成
            setTimeout(() => {
                // 確認不是因為用戶拖拽導致的假結束事件
                playNextEpisode();
                videoHasEnded = false; // 重置標誌
            }, 1000);
        } else {
            art.fullscreen = false;
        }
    });

    // 添加雙擊全屏支持
    art.on('video:playing', () => {
        // 綁定雙擊事件到視頻容器
        if (art.video) {
            art.video.addEventListener('dblclick', () => {
                art.fullscreen = !art.fullscreen;
                art.play();
            });
        }
    });

    // 10秒後如果仍在加載，但不立即顯示錯誤
    setTimeout(function () {
        // 如果視頻已經播放開始，則不顯示錯誤
        if (art && art.video && art.video.currentTime > 0) {
            return;
        }

        const loadingElement = document.getElementById('player-loading');
        if (loadingElement && loadingElement.style.display !== 'none') {
            loadingElement.innerHTML = `
                <div class="loading-spinner"></div>
                <div>視頻加載時間較長，請耐心等待...</div>
                <div style="font-size: 12px; color: #aaa; margin-top: 10px;">如長時間無響應，請嘗試其他視頻源</div>
            `;
        }
    }, 10000);
}

// 自定義M3U8 Loader用於過濾廣告
class CustomHlsJsLoader extends Hls.DefaultConfig.loader {
    constructor(config) {
        super(config);
        const load = this.load.bind(this);
        this.load = function (context, config, callbacks) {
            // 攔截manifest和level請求
            if (context.type === 'manifest' || context.type === 'level') {
                const onSuccess = callbacks.onSuccess;
                callbacks.onSuccess = function (response, stats, context) {
                    // 如果是m3u8文件，處理內容以移除廣告分段
                    if (response.data && typeof response.data === 'string') {
                        // 過濾掉廣告段 - 實現更精確的廣告過濾邏輯
                        response.data = filterAdsFromM3U8(response.data, true);
                    }
                    return onSuccess(response, stats, context);
                };
            }
            // 執行原始load方法
            load(context, config, callbacks);
        };
    }
}

// 過濾可疑的廣告內容
function filterAdsFromM3U8(m3u8Content, strictMode = false) {
    if (!m3u8Content) return '';

    // 按行分割M3U8內容
    const lines = m3u8Content.split('\n');
    const filteredLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 只過濾#EXT-X-DISCONTINUITY標識
        if (!line.includes('#EXT-X-DISCONTINUITY')) {
            filteredLines.push(line);
        }
    }

    return filteredLines.join('\n');
}


// 顯示錯誤
function showError(message) {
    // 在視頻已經播放的情況下不顯示錯誤
    if (art && art.video && art.video.currentTime > 1) {
        return;
    }
    const loadingEl = document.getElementById('player-loading');
    if (loadingEl) loadingEl.style.display = 'none';
    const errorEl = document.getElementById('error');
    if (errorEl) errorEl.style.display = 'flex';
    const errorMsgEl = document.getElementById('error-message');
    if (errorMsgEl) errorMsgEl.textContent = message;
}

// 更新集數信息
function updateEpisodeInfo() {
    if (currentEpisodes.length > 0) {
        document.getElementById('episodeInfo').textContent = `第 ${currentEpisodeIndex + 1}/${currentEpisodes.length} 集`;
    } else {
        document.getElementById('episodeInfo').textContent = '無集數信息';
    }
}

// 更新按鈕狀態
function updateButtonStates() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    // 處理上一集按鈕
    if (currentEpisodeIndex > 0) {
        prevButton.classList.remove('bg-gray-700', 'cursor-not-allowed');
        prevButton.classList.add('bg-[#222]', 'hover:bg-[#333]');
        prevButton.removeAttribute('disabled');
    } else {
        prevButton.classList.add('bg-gray-700', 'cursor-not-allowed');
        prevButton.classList.remove('bg-[#222]', 'hover:bg-[#333]');
        prevButton.setAttribute('disabled', '');
    }

    // 處理下一集按鈕
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
        nextButton.classList.remove('bg-gray-700', 'cursor-not-allowed');
        nextButton.classList.add('bg-[#222]', 'hover:bg-[#333]');
        nextButton.removeAttribute('disabled');
    } else {
        nextButton.classList.add('bg-gray-700', 'cursor-not-allowed');
        nextButton.classList.remove('bg-[#222]', 'hover:bg-[#333]');
        nextButton.setAttribute('disabled', '');
    }
}

// 渲染集數按鈕
function renderEpisodes() {
    const episodesList = document.getElementById('episodesList');
    if (!episodesList) return;

    if (!currentEpisodes || currentEpisodes.length === 0) {
        episodesList.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">沒有可用的集數</div>';
        return;
    }

    const episodes = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;
    let html = '';

    episodes.forEach((episode, index) => {
        // 根據倒序狀態計算真實的劇集索引
        const realIndex = episodesReversed ? currentEpisodes.length - 1 - index : index;
        const isActive = realIndex === currentEpisodeIndex;

        html += `
            <button id="episode-${realIndex}" 
                    onclick="playEpisode(${realIndex})" 
                    class="px-4 py-2 ${isActive ? 'episode-active' : '!bg-[#222] hover:!bg-[#333] hover:!shadow-none'} !border ${isActive ? '!border-blue-500' : '!border-[#333]'} rounded-lg transition-colors text-center episode-btn">
                ${realIndex + 1}
            </button>
        `;
    });

    episodesList.innerHTML = html;
}

// 播放指定集數
function playEpisode(index) {
    // 確保index在有效範圍內
    if (index < 0 || index >= currentEpisodes.length) {
        return;
    }

    // 保存當前播放進度（如果正在播放）
    if (art && art.video && !art.video.paused && !videoHasEnded) {
        saveCurrentProgress();
    }

    // 清除進度保存計時器
    if (progressSaveInterval) {
        clearInterval(progressSaveInterval);
        progressSaveInterval = null;
    }

    // 首先隱藏之前可能顯示的錯誤
    document.getElementById('error').style.display = 'none';
    // 顯示加載指示器
    document.getElementById('player-loading').style.display = 'flex';
    document.getElementById('player-loading').innerHTML = `
        <div class="loading-spinner"></div>
        <div>正在加載視頻...</div>
    `;

    // 獲取 sourceCode
    const urlParams2 = new URLSearchParams(window.location.search);
    const sourceCode = urlParams2.get('source_code');

    // 準備切換劇集的URL
    const url = currentEpisodes[index];

    // 更新當前劇集索引
    currentEpisodeIndex = index;
    currentVideoUrl = url;
    videoHasEnded = false; // 重置視頻結束標誌

    clearVideoProgress();

    // 更新URL參數（不刷新頁面）
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('index', index);
    currentUrl.searchParams.set('url', url);
    currentUrl.searchParams.delete('position');
    window.history.replaceState({}, '', currentUrl.toString());

    if (isWebkit) {
        initPlayer(url);
    } else {
        art.switch = url;
    }

    // 更新UI
    updateEpisodeInfo();
    updateButtonStates();
    renderEpisodes();

    // 重置用戶點擊位置記錄
    userClickedPosition = null;

    // 三秒後保存到歷史記錄
    setTimeout(() => saveToHistory(), 3000);
}

// 播放上一集
function playPreviousEpisode() {
    if (currentEpisodeIndex > 0) {
        playEpisode(currentEpisodeIndex - 1);
    }
}

// 播放下一集
function playNextEpisode() {
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
        playEpisode(currentEpisodeIndex + 1);
    }
}

// 複製播放鏈接
function copyLinks() {
    // 嘗試從URL中獲取參數
    const urlParams = new URLSearchParams(window.location.search);
    const linkUrl = urlParams.get('url') || '';
    if (linkUrl !== '') {
        navigator.clipboard.writeText(linkUrl).then(() => {
            showToast('播放鏈接已複製', 'success');
        }).catch(err => {
            showToast('複製失敗，請檢查瀏覽器權限', 'error');
        });
    }
}

// 切換集數排序
function toggleEpisodeOrder() {
    episodesReversed = !episodesReversed;

    // 保存到localStorage
    localStorage.setItem('episodesReversed', episodesReversed);

    // 重新渲染集數列表
    renderEpisodes();

    // 更新排序按鈕
    updateOrderButton();
}

// 更新排序按鈕狀態
function updateOrderButton() {
    const orderText = document.getElementById('orderText');
    const orderIcon = document.getElementById('orderIcon');

    if (orderText && orderIcon) {
        orderText.textContent = episodesReversed ? '正序排列' : '倒序排列';
        orderIcon.style.transform = episodesReversed ? 'rotate(180deg)' : '';
    }
}

// 設置進度條準確點擊處理
function setupProgressBarPreciseClicks() {
    // 查找DPlayer的進度條元素
    const progressBar = document.querySelector('.dplayer-bar-wrap');
    if (!progressBar || !art || !art.video) return;

    // 移除可能存在的舊事件監聽器
    progressBar.removeEventListener('mousedown', handleProgressBarClick);

    // 添加新的事件監聽器
    progressBar.addEventListener('mousedown', handleProgressBarClick);

    // 在移動端也添加觸摸事件支持
    progressBar.removeEventListener('touchstart', handleProgressBarTouch);
    progressBar.addEventListener('touchstart', handleProgressBarTouch);

    // 處理進度條點擊
    function handleProgressBarClick(e) {
        if (!art || !art.video) return;

        // 計算點擊位置相對於進度條的比例
        const rect = e.currentTarget.getBoundingClientRect();
        const percentage = (e.clientX - rect.left) / rect.width;

        // 計算點擊位置對應的視頻時間
        const duration = art.video.duration;
        let clickTime = percentage * duration;

        // 處理視頻接近結尾的情況
        if (duration - clickTime < 1) {
            // 如果點擊位置非常接近結尾，稍微往前移一點
            clickTime = Math.min(clickTime, duration - 1.5);

        }

        // 記錄用戶點擊的位置
        userClickedPosition = clickTime;

        // 阻止默認事件傳播，避免DPlayer內部邏輯將視頻跳至末尾
        e.stopPropagation();

        // 直接設置視頻時間
        art.seek(clickTime);
    }

    // 處理移動端觸摸事件
    function handleProgressBarTouch(e) {
        if (!art || !art.video || !e.touches[0]) return;

        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        const percentage = (touch.clientX - rect.left) / rect.width;

        const duration = art.video.duration;
        let clickTime = percentage * duration;

        // 處理視頻接近結尾的情況
        if (duration - clickTime < 1) {
            clickTime = Math.min(clickTime, duration - 1.5);
        }

        // 記錄用戶點擊的位置
        userClickedPosition = clickTime;

        e.stopPropagation();
        art.seek(clickTime);
    }
}

// 在播放器初始化後添加視頻到歷史記錄
function saveToHistory() {
    // 確保 currentEpisodes 非空且有當前視頻URL
    if (!currentEpisodes || currentEpisodes.length === 0 || !currentVideoUrl) {
        return;
    }

    // 嘗試從URL中獲取參數
    const urlParams = new URLSearchParams(window.location.search);
    const sourceName = urlParams.get('source') || '';
    const sourceCode = urlParams.get('source') || '';
    const id_from_params = urlParams.get('id'); // Get video ID from player URL (passed as 'id')

    // 獲取當前播放進度
    let currentPosition = 0;
    let videoDuration = 0;

    if (art && art.video) {
        currentPosition = art.video.currentTime;
        videoDuration = art.video.duration;
    }

    // Define a show identifier: Prioritize sourceName_id, fallback to first episode URL or current video URL
    let show_identifier_for_video_info;
    if (sourceName && id_from_params) {
        show_identifier_for_video_info = `${sourceName}_${id_from_params}`;
    } else {
        show_identifier_for_video_info = (currentEpisodes && currentEpisodes.length > 0) ? currentEpisodes[0] : currentVideoUrl;
    }

    // 構建要保存的視頻信息對象
    const videoInfo = {
        title: currentVideoTitle,
        directVideoUrl: currentVideoUrl, // Current episode's direct URL
        url: `player.html?url=${encodeURIComponent(currentVideoUrl)}&title=${encodeURIComponent(currentVideoTitle)}&source=${encodeURIComponent(sourceName)}&source_code=${encodeURIComponent(sourceCode)}&id=${encodeURIComponent(id_from_params || '')}&index=${currentEpisodeIndex}&position=${Math.floor(currentPosition || 0)}`,
        episodeIndex: currentEpisodeIndex,
        sourceName: sourceName,
        vod_id: id_from_params || '', // Store the ID from params as vod_id in history item
        sourceCode: sourceCode,
        showIdentifier: show_identifier_for_video_info, // Identifier for the show/series
        timestamp: Date.now(),
        playbackPosition: currentPosition,
        duration: videoDuration,
        episodes: currentEpisodes && currentEpisodes.length > 0 ? [...currentEpisodes] : []
    };
    
    try {
        const history = JSON.parse(localStorage.getItem('viewingHistory') || '[]');

        // 檢查是否已經存在相同的系列記錄 (基於標題、來源和 showIdentifier)
        const existingIndex = history.findIndex(item => 
            item.title === videoInfo.title && 
            item.sourceName === videoInfo.sourceName && 
            item.showIdentifier === videoInfo.showIdentifier
        );

        if (existingIndex !== -1) {
            // 存在則更新現有記錄的當前集數、時間戳、播放進度和URL等
            const existingItem = history[existingIndex];
            existingItem.episodeIndex = videoInfo.episodeIndex;
            existingItem.timestamp = videoInfo.timestamp;
            existingItem.sourceName = videoInfo.sourceName; // Should be consistent, but update just in case
            existingItem.sourceCode = videoInfo.sourceCode;
            existingItem.vod_id = videoInfo.vod_id;
            
            // Update URLs to reflect the current episode being watched
            existingItem.directVideoUrl = videoInfo.directVideoUrl; // Current episode's direct URL
            existingItem.url = videoInfo.url; // Player link for the current episode

            // 更新播放進度信息
            existingItem.playbackPosition = videoInfo.playbackPosition > 10 ? videoInfo.playbackPosition : (existingItem.playbackPosition || 0);
            existingItem.duration = videoInfo.duration || existingItem.duration;
            
            // 更新集數列表（如果新的集數列表與存儲的不同，例如集數增加了）
            if (videoInfo.episodes && videoInfo.episodes.length > 0) {
                if (!existingItem.episodes || 
                    !Array.isArray(existingItem.episodes) || 
                    existingItem.episodes.length !== videoInfo.episodes.length || 
                    !videoInfo.episodes.every((ep, i) => ep === existingItem.episodes[i])) { // Basic check for content change
                    existingItem.episodes = [...videoInfo.episodes]; // Deep copy
                }
            }
            
            // 移到最前面
            const updatedItem = history.splice(existingIndex, 1)[0];
            history.unshift(updatedItem);
        } else {
            // 添加新記錄到最前面
            history.unshift(videoInfo);
        }

        // 限制歷史記錄數量為50條
        if (history.length > 50) history.splice(50);

        localStorage.setItem('viewingHistory', JSON.stringify(history));
    } catch (e) {
    }
}

// 顯示恢復位置提示
function showPositionRestoreHint(position) {
    if (!position || position < 10) return;

    // 創建提示元素
    const hint = document.createElement('div');
    hint.className = 'position-restore-hint';
    hint.innerHTML = `
        <div class="hint-content">
            已從 ${formatTime(position)} 繼續播放
        </div>
    `;

    // 添加到播放器容器
    const playerContainer = document.querySelector('.player-container'); // Ensure this selector is correct
    if (playerContainer) { // Check if playerContainer exists
        playerContainer.appendChild(hint);
    } else {
        return; // Exit if container not found
    }

    // 顯示提示
    setTimeout(() => {
        hint.classList.add('show');

        // 3秒後隱藏
        setTimeout(() => {
            hint.classList.remove('show');
            setTimeout(() => hint.remove(), 300);
        }, 3000);
    }, 100);
}

// 格式化時間為 mm:ss 格式
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 開始定期保存播放進度
function startProgressSaveInterval() {
    // 清除可能存在的舊計時器
    if (progressSaveInterval) {
        clearInterval(progressSaveInterval);
    }

    // 每30秒保存一次播放進度
    progressSaveInterval = setInterval(saveCurrentProgress, 30000);
}

// 保存當前播放進度
function saveCurrentProgress() {
    if (!art || !art.video) return;
    const currentTime = art.video.currentTime;
    const duration = art.video.duration;
    if (!duration || currentTime < 1) return;

    // 在localStorage中保存進度
    const progressKey = `videoProgress_${getVideoId()}`;
    const progressData = {
        position: currentTime,
        duration: duration,
        timestamp: Date.now()
    };
    try {
        localStorage.setItem(progressKey, JSON.stringify(progressData));
        // --- 新增：同步更新 viewingHistory 中的進度 ---
        try {
            const historyRaw = localStorage.getItem('viewingHistory');
            if (historyRaw) {
                const history = JSON.parse(historyRaw);
                // 用 title + 集數索引唯一標識
                const idx = history.findIndex(item =>
                    item.title === currentVideoTitle &&
                    (item.episodeIndex === undefined || item.episodeIndex === currentEpisodeIndex)
                );
                if (idx !== -1) {
                    // 只在進度有明顯變化時才更新，減少寫入
                    if (
                        Math.abs((history[idx].playbackPosition || 0) - currentTime) > 2 ||
                        Math.abs((history[idx].duration || 0) - duration) > 2
                    ) {
                        history[idx].playbackPosition = currentTime;
                        history[idx].duration = duration;
                        history[idx].timestamp = Date.now();
                        localStorage.setItem('viewingHistory', JSON.stringify(history));
                    }
                }
            }
        } catch (e) {
        }
    } catch (e) {
    }
}

// 設置移動端長按三倍速播放功能
function setupLongPressSpeedControl() {
    if (!art || !art.video) return;

    const playerElement = document.getElementById('player');
    let longPressTimer = null;
    let originalPlaybackRate = 1.0;
    let isLongPress = false;

    // 顯示快速提示
    function showSpeedHint(speed) {
        showShortcutHint(`${speed}倍速`, 'right');
    }

    // 禁用右鍵
    playerElement.oncontextmenu = () => {
        // 檢測是否為移動設備
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // 只在移動設備上禁用右鍵
        if (isMobile) {
            const dplayerMenu = document.querySelector(".dplayer-menu");
            const dplayerMask = document.querySelector(".dplayer-mask");
            if (dplayerMenu) dplayerMenu.style.display = "none";
            if (dplayerMask) dplayerMask.style.display = "none";
            return false;
        }
        return true; // 在桌面設備上允許右鍵菜單
    };

    // 觸摸開始事件
    playerElement.addEventListener('touchstart', function (e) {
        // 檢查視頻是否正在播放，如果沒有播放則不觸發長按功能
        if (art.video.paused) {
            return; // 視頻暫停時不觸發長按功能
        }

        // 保存原始播放速度
        originalPlaybackRate = art.video.playbackRate;

        // 設置長按計時器
        longPressTimer = setTimeout(() => {
            // 再次檢查視頻是否仍在播放
            if (art.video.paused) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
                return;
            }

            // 長按超過500ms，設置為3倍速
            art.video.playbackRate = 3.0;
            isLongPress = true;
            showSpeedHint(3.0);

            // 只在確認為長按時阻止默認行為
            e.preventDefault();
        }, 500);
    }, { passive: false });

    // 觸摸結束事件
    playerElement.addEventListener('touchend', function (e) {
        // 清除長按計時器
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }

        // 如果是長按狀態，恢復原始播放速度
        if (isLongPress) {
            art.video.playbackRate = originalPlaybackRate;
            isLongPress = false;
            showSpeedHint(originalPlaybackRate);

            // 阻止長按後的點擊事件
            e.preventDefault();
        }
        // 如果不是長按，則允許正常的點擊事件（暫停/播放）
    });

    // 觸摸取消事件
    playerElement.addEventListener('touchcancel', function () {
        // 清除長按計時器
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }

        // 如果是長按狀態，恢復原始播放速度
        if (isLongPress) {
            art.video.playbackRate = originalPlaybackRate;
            isLongPress = false;
        }
    });

    // 觸摸移動事件 - 防止在長按時觸發頁面滾動
    playerElement.addEventListener('touchmove', function (e) {
        if (isLongPress) {
            e.preventDefault();
        }
    }, { passive: false });

    // 視頻暫停時取消長按狀態
    art.video.addEventListener('pause', function () {
        if (isLongPress) {
            art.video.playbackRate = originalPlaybackRate;
            isLongPress = false;
        }

        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });
}

// 清除視頻進度記錄
function clearVideoProgress() {
    const progressKey = `videoProgress_${getVideoId()}`;
    try {
        localStorage.removeItem(progressKey);
    } catch (e) {
    }
}

// 獲取視頻唯一標識
function getVideoId() {
    // 使用視頻標題和集數索引作為唯一標識
    // If currentVideoUrl is available and more unique, prefer it. Otherwise, fallback.
    if (currentVideoUrl) {
        return `${encodeURIComponent(currentVideoUrl)}`;
    }
    return `${encodeURIComponent(currentVideoTitle)}_${currentEpisodeIndex}`;
}

let controlsLocked = false;
function toggleControlsLock() {
    const container = document.getElementById('playerContainer');
    controlsLocked = !controlsLocked;
    container.classList.toggle('controls-locked', controlsLocked);
    const icon = document.getElementById('lockIcon');
    // 切換圖標：鎖 / 解鎖
    icon.innerHTML = controlsLocked
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d=\"M12 15v2m0-8V7a4 4 0 00-8 0v2m8 0H4v8h16v-8H6v-6z\"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d=\"M15 11V7a3 3 0 00-6 0v4m-3 4h12v6H6v-6z\"/>';
}

// 支持在iframe中關閉播放器
function closeEmbeddedPlayer() {
    try {
        if (window.self !== window.top) {
            // 如果在iframe中，嘗試調用父窗口的關閉方法
            if (window.parent && typeof window.parent.closeVideoPlayer === 'function') {
                window.parent.closeVideoPlayer();
                return true;
            }
        }
    } catch (e) {
        console.error('嘗試關閉嵌入式播放器失敗:', e);
    }
    return false;
}

function renderResourceInfoBar() {
    // 獲取容器元素
    const container = document.getElementById('resourceInfoBarContainer');
    if (!container) {
        console.error('找不到資源信息卡片容器');
        return;
    }
    
    // 獲取當前視頻 source_code
    const urlParams = new URLSearchParams(window.location.search);
    const currentSource = urlParams.get('source') || '';
    
    // 顯示臨時加載狀態
    container.innerHTML = `
      <div class="resource-info-bar-left flex">
        <span>加載中...</span>
        <span class="resource-info-bar-videos">-</span>
      </div>
      <button class="resource-switch-btn flex" id="switchResourceBtn" onclick="showSwitchResourceModal()">
        <span class="resource-switch-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4v16m0 0l-6-6m6 6l6-6" stroke="#a67c2d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        切換資源
      </button>
    `;

    // 查找當前源名稱，從 API_SITES 和 custom_api 中查找即可
    let resourceName = currentSource
    if (currentSource && API_SITES[currentSource]) {
        resourceName = API_SITES[currentSource].name;
    }
    if (resourceName === currentSource) {
        const customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]');
        const customIndex = parseInt(currentSource.replace('custom_', ''), 10);
        if (customAPIs[customIndex]) {
            resourceName = customAPIs[customIndex].name || '自定義資源';
        }
    }

    container.innerHTML = `
      <div class="resource-info-bar-left flex">
        <span>${resourceName}</span>
        <span class="resource-info-bar-videos">${currentEpisodes.length} 個視頻</span>
      </div>
      <button class="resource-switch-btn flex" id="switchResourceBtn" onclick="showSwitchResourceModal()">
        <span class="resource-switch-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4v16m0 0l-6-6m6 6l6-6" stroke="#a67c2d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        切換資源
      </button>
    `;
}

async function showSwitchResourceModal() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentSourceCode = urlParams.get('source');
    const currentVideoId = urlParams.get('id');

    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    modalTitle.innerHTML = `<span class="break-words">${currentVideoTitle}</span>`;
    modalContent.innerHTML = '<div style="text-align:center;padding:20px;color:#aaa;grid-column:1/-1;">正在加載資源列表...</div>';
    modal.classList.remove('hidden');

    // 搜索
    const resourceOptions = selectedAPIs.map((curr) => {
        if (API_SITES[curr]) {
            return { key: curr, name: API_SITES[curr].name };
        }
        const customIndex = parseInt(curr.replace('custom_', ''), 10);
        if (customAPIs[customIndex]) {
            return { key: curr, name: customAPIs[customIndex].name || '自定義資源' };
        }
        return { key: curr, name: '未知資源' };
    });
    let allResults = {};
    await Promise.all(resourceOptions.map(async (opt) => {
        let queryResult = await searchByAPIAndKeyWord(opt.key, currentVideoTitle);
        if (queryResult.length == 0) {
            return 
        }
        // 優先取完全同名資源，否則默認取第一個
        let result = queryResult[0]
        queryResult.forEach((res) => {
            if (res.vod_name == currentVideoTitle) {
                result = res;
            }
        })
        allResults[opt.key] = result;
    }));

    // 對結果進行排序
    const sortedResults = Object.entries(allResults).sort(([keyA, resultA], [keyB, resultB]) => {
        // 當前播放的源放在最前面
        const isCurrentA = String(keyA) === String(currentSourceCode) && String(resultA.vod_id) === String(currentVideoId);
        const isCurrentB = String(keyB) === String(currentSourceCode) && String(resultB.vod_id) === String(currentVideoId);
        
        if (isCurrentA && !isCurrentB) return -1;
        if (!isCurrentA && isCurrentB) return 1;
        
        // 其餘按照 selectedAPIs 的順序排列
        const indexA = selectedAPIs.indexOf(keyA);
        const indexB = selectedAPIs.indexOf(keyB);
        
        return indexA - indexB;
    });

    // 渲染資源列表
    let html = '<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 p-4">';
    
    for (const [sourceKey, result] of sortedResults) {
        if (!result) continue;
        
        // 修復 isCurrentSource 判斷，確保類型一致
        const isCurrentSource = String(sourceKey) === String(currentSourceCode) && String(result.vod_id) === String(currentVideoId);
        const sourceName = resourceOptions.find(opt => opt.key === sourceKey)?.name || '未知資源';
        
        html += `
            <div class="relative group ${isCurrentSource ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 transition-transform'}" 
                 ${!isCurrentSource ? `onclick="switchToResource('${sourceKey}', '${result.vod_id}')"` : ''}>
                <div class="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                    <img src="${result.vod_pic}" 
                         alt="${result.vod_name}"
                         class="w-full h-full object-cover"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiPjwvcmVjdD48cGF0aCBkPSJNMjEgMTV2NGEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnYtNCI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjE3IDggMTIgMyA3IDgiPjwvcG9seWxpbmU+PHBhdGggZD0iTTEyIDN2MTIiPjwvcGF0aD48L3N2Zz4='">
                </div>
                <div class="mt-1">
                    <div class="text-xs font-medium text-gray-200 truncate">${result.vod_name}</div>
                    <div class="text-[10px] text-gray-400">${sourceName}</div>
                </div>
                ${isCurrentSource ? `
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="bg-black bg-opacity-50 rounded-lg px-2 py-0.5 text-xs text-white">
                            當前播放
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    html += '</div>';
    modalContent.innerHTML = html;
}

// 切換資源的函數
async function switchToResource(sourceKey, vodId) {
    // 關閉模態框
    document.getElementById('modal').classList.add('hidden');
    
    showLoading();
    try {
        // 構建API參數
        let apiParams = '';
        
        // 處理自定義API源
        if (sourceKey.startsWith('custom_')) {
            const customIndex = sourceKey.replace('custom_', '');
            const customApi = getCustomApiInfo(customIndex);
            if (!customApi) {
                showToast('自定義API配置無效', 'error');
                hideLoading();
                return;
            }
            // 傳遞 detail 字段
            if (customApi.detail) {
                apiParams = '&customApi=' + encodeURIComponent(customApi.url) + '&customDetail=' + encodeURIComponent(customApi.detail) + '&source=custom';
            } else {
                apiParams = '&customApi=' + encodeURIComponent(customApi.url) + '&source=custom';
            }
        } else {
            // 內置API
            apiParams = '&source=' + sourceKey;
        }
        
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const cacheBuster = `&_t=${timestamp}`;
        const response = await fetch(`/api/detail?id=${encodeURIComponent(vodId)}${apiParams}${cacheBuster}`);
        
        const data = await response.json();
        
        if (!data.episodes || data.episodes.length === 0) {
            showToast('未找到播放資源', 'error');
            hideLoading();
            return;
        }

        // 獲取當前播放的集數索引
        const currentIndex = currentEpisodeIndex;
        
        // 確定要播放的集數索引
        let targetIndex = 0;
        if (currentIndex < data.episodes.length) {
            // 如果當前集數在新資源中存在，則使用相同集數
            targetIndex = currentIndex;
        }
        
        // 獲取目標集數的URL
        const targetUrl = data.episodes[targetIndex];
        
        // 構建播放頁面URL
        const watchUrl = `player.html?id=${vodId}&source=${sourceKey}&url=${encodeURIComponent(targetUrl)}&index=${targetIndex}&title=${encodeURIComponent(currentVideoTitle)}`;
        
        // 保存當前狀態到localStorage
        try {
            localStorage.setItem('currentVideoTitle', data.vod_name || '未知視頻');
            localStorage.setItem('currentEpisodes', JSON.stringify(data.episodes));
            localStorage.setItem('currentEpisodeIndex', targetIndex);
            localStorage.setItem('currentSourceCode', sourceKey);
            localStorage.setItem('lastPlayTime', Date.now());
        } catch (e) {
            console.error('保存播放狀態失敗:', e);
        }

        // 跳轉到播放頁面
        window.location.href = watchUrl;
        
    } catch (error) {
        console.error('切換資源失敗:', error);
        showToast('切換資源失敗，請稍後重試', 'error');
    } finally {
        hideLoading();
    }
}