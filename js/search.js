async function searchByAPIAndKeyWord(apiId, query) {
    try {
        let apiUrl, apiName, apiBaseUrl;
        
        // 處理自定義API
        if (apiId.startsWith('custom_')) {
            const customIndex = apiId.replace('custom_', '');
            const customApi = getCustomApiInfo(customIndex);
            if (!customApi) return [];
            
            apiBaseUrl = customApi.url;
            apiUrl = apiBaseUrl + API_CONFIG.search.path + encodeURIComponent(query);
            apiName = customApi.name;
        } else {
            // 內置API
            if (!API_SITES[apiId]) return [];
            apiBaseUrl = API_SITES[apiId].api;
            apiUrl = apiBaseUrl + API_CONFIG.search.path + encodeURIComponent(query);
            apiName = API_SITES[apiId].name;
        }
        
        // 添加超時處理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(PROXY_URL + encodeURIComponent(apiUrl), {
            headers: API_CONFIG.search.headers,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            return [];
        }
        
        const data = await response.json();
        
        if (!data || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
            return [];
        }
        
        // 處理第一頁結果
        const results = data.list.map(item => ({
            ...item,
            source_name: apiName,
            source_code: apiId,
            api_url: apiId.startsWith('custom_') ? getCustomApiInfo(apiId.replace('custom_', ''))?.url : undefined
        }));
        
        // 獲取總頁數
        const pageCount = data.pagecount || 1;
        // 確定需要獲取的額外頁數 (最多獲取maxPages頁)
        const pagesToFetch = Math.min(pageCount - 1, API_CONFIG.search.maxPages - 1);
        
        // 如果有額外頁數，獲取更多頁的結果
        if (pagesToFetch > 0) {
            const additionalPagePromises = [];
            
            for (let page = 2; page <= pagesToFetch + 1; page++) {
                // 構建分頁URL
                const pageUrl = apiBaseUrl + API_CONFIG.search.pagePath
                    .replace('{query}', encodeURIComponent(query))
                    .replace('{page}', page);
                
                // 創建獲取額外頁的Promise
                const pagePromise = (async () => {
                    try {
                        const pageController = new AbortController();
                        const pageTimeoutId = setTimeout(() => pageController.abort(), 8000);
                        
                        const pageResponse = await fetch(PROXY_URL + encodeURIComponent(pageUrl), {
                            headers: API_CONFIG.search.headers,
                            signal: pageController.signal
                        });
                        
                        clearTimeout(pageTimeoutId);
                        
                        if (!pageResponse.ok) return [];
                        
                        const pageData = await pageResponse.json();
                        
                        if (!pageData || !pageData.list || !Array.isArray(pageData.list)) return [];
                        
                        // 處理當前頁結果
                        return pageData.list.map(item => ({
                            ...item,
                            source_name: apiName,
                            source_code: apiId,
                            api_url: apiId.startsWith('custom_') ? getCustomApiInfo(apiId.replace('custom_', ''))?.url : undefined
                        }));
                    } catch (error) {
                        console.warn(`API ${apiId} 第${page}頁搜索失敗:`, error);
                        return [];
                    }
                })();
                
                additionalPagePromises.push(pagePromise);
            }
            
            // 等待所有額外頁的結果
            const additionalResults = await Promise.all(additionalPagePromises);
            
            // 合併所有頁的結果
            additionalResults.forEach(pageResults => {
                if (pageResults.length > 0) {
                    results.push(...pageResults);
                }
            });
        }
        
        return results;
    } catch (error) {
        console.warn(`API ${apiId} 搜索失敗:`, error);
        return [];
    }
}