const CUSTOMER_SITES = {
    qiqi: {
        api: 'https://www.qiqidys.com/api.php/provide/vod',
        name: '七七資源',
    }
};

// 調用全局方法合併
if (window.extendAPISites) {
    window.extendAPISites(CUSTOMER_SITES);
} else {
    console.error("錯誤：請先加載 config.js！");
}
