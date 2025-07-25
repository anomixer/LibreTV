// 頁面加載後顯示彈窗腳本
document.addEventListener('DOMContentLoaded', function() {
    // 彈窗顯示腳本
    // 檢查用戶是否已經看過聲明
    const hasSeenDisclaimer = localStorage.getItem('hasSeenDisclaimer');
    
    if (!hasSeenDisclaimer) {
        // 顯示彈窗
        const disclaimerModal = document.getElementById('disclaimerModal');
        disclaimerModal.style.display = 'flex';
        
        // 添加接受按鈕事件
        document.getElementById('acceptDisclaimerBtn').addEventListener('click', function() {
            // 保存用戶已看過聲明的狀態
            localStorage.setItem('hasSeenDisclaimer', 'true');
            // 隱藏彈窗
            disclaimerModal.style.display = 'none';
        });
    }

    // URL搜索參數處理腳本
    // 首先檢查是否是播放URL格式 (/watch 開頭的路徑)
    if (window.location.pathname.startsWith('/watch')) {
        // 播放URL，不做額外處理，watch.html會處理重定向
        return;
    }
    
    // 檢查頁面路徑中的搜索參數 (格式: /s=keyword)
    const path = window.location.pathname;
    const searchPrefix = '/s=';
    
    if (path.startsWith(searchPrefix)) {
        // 提取搜索關鍵詞
        const keyword = decodeURIComponent(path.substring(searchPrefix.length));
        if (keyword) {
            // 設置搜索框的值
            document.getElementById('searchInput').value = keyword;
            // 顯示清空按鈕
            toggleClearButton();
            // 執行搜索
            setTimeout(() => {
                // 使用setTimeout確保其他DOM加載和初始化完成
                search();
                // 更新瀏覽器歷史，不改變URL (保持搜索參數在地址欄)
                try {
                    window.history.replaceState(
                        { search: keyword }, 
                        `搜索: ${keyword} - LibreTV`, 
                        window.location.href
                    );
                } catch (e) {
                    console.error('更新瀏覽器歷史失敗:', e);
                }
            }, 300);
        }
    }
    
    // 也檢查查詢字符串中的搜索參數 (格式: ?s=keyword)
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('s');
    
    if (searchQuery) {
        // 設置搜索框的值
        document.getElementById('searchInput').value = searchQuery;
        // 執行搜索
        setTimeout(() => {
            search();
            // 更新URL為規範格式
            try {
                window.history.replaceState(
                    { search: searchQuery }, 
                    `搜索: ${searchQuery} - LibreTV`, 
                    `/s=${encodeURIComponent(searchQuery)}`
                );
            } catch (e) {
                console.error('更新瀏覽器歷史失敗:', e);
            }
        }, 300);
    }
});
