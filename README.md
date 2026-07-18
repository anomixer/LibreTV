# LibreTV - 免費在線視頻搜索與觀看平臺

<div align="center">
  <img src="image/logo.png" alt="LibreTV Logo" width="120">
  <br>
  <p><strong>自由觀影，暢享精彩</strong></p>
</div>

## 📺 項目簡介

LibreTV 是一個輕量級、免費的在線視頻搜索與觀看平臺，提供來自多個視頻源的內容搜索與播放服務。無需註冊，即開即用，支持多種設備訪問。項目結合了前端技術和後端代理功能，可部署在支持服務端功能的各類網站託管服務上。**項目門戶**： [libretv.is-an.org](https://libretv.is-an.org)

本項目基於 [bestK/tv](https://github.com/bestK/tv) 進行重構與增強。

<details>
  <summary>點擊查看項目截圖</summary>
  <img src="https://github.com/user-attachments/assets/df485345-e83b-4564-adf7-0680be92d3c7" alt="項目截圖" style="max-width:600px">
</details>

## 🥇 感謝贊助

- **[YXVM](https://yxvm.com)**  
- **[ZMTO/VTEXS](https://zmto.com)**
- **[Sharon](https://sharon.io)**

## 🚀 快速部署 (推薦 Cloudflare Pages)

LibreTV 推薦使用 **Cloudflare Pages** 進行部署，免費、無限頻寬且防盜鏈圖片與影片加載體驗最佳。

## 📋 詳細部署指南

### Cloudflare Pages (推薦)

1. Fork 或克隆本倉庫到您的 GitHub 賬戶
2. 登錄 [Cloudflare Dashboard](https://dash.cloudflare.com/)，進入 Pages 服務
3. 點擊"創建項目"，連接您的 GitHub 倉庫
4. 使用以下設置：
   - 構建命令：留空（無需構建）
   - 輸出目錄：`.`（根目錄）
5. 點擊"保存並部署"！

6. 部署成功後即可訪問您的 LibreTV 實例

> 如需啟用密碼保護，可在 Render 控制臺的環境變量中手動添加 `PASSWORD` 和/或 `ADMINPASSWORD`。

### Docker
```
docker run -d \
  --name libretv \
  --restart unless-stopped \
  -p 8899:8080 \
  -e PASSWORD=your_password \
  bestzwei/libretv:latest
```

### Docker Compose

`docker-compose.yml` 文件：

```yaml
services:
  libretv:
    image: bestzwei/libretv:latest
    container_name: libretv
    ports:
      - "8899:8080" # 將內部 8080 端口映射到主機的 8899 端口
    environment:
      - PASSWORD=${PASSWORD:-your_password} # 可將 your_password 修改為你想要的密碼，默認為 your_password
      - ADMINPASSWORD=${PASSWORD:-your_adminpassword} # 可將 your_adminpassword 修改為你想要的密碼，默認為 your_adminpassword
    restart: unless-stopped
```
啟動 LibreTV：

```bash
docker compose up -d
```
訪問 `http://localhost:8899` 即可使用。

### 本地開發環境

項目包含後端代理功能，需要支持服務器端功能的環境：

```bash
# 首先，通過複製示例來設置 .env 文件（可選）
cp .env.example .env

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

訪問 `http://localhost:8080` 即可使用（端口可在.env文件中通過PORT變量修改）。

> ⚠️ 注意：使用簡單靜態服務器（如 `python -m http.server` 或 `npx http-server`）時，視頻代理功能將不可用，視頻無法正常播放。完整功能測試請使用 Node.js 開發服務器。

## 🔧 自定義配置

### 密碼保護

要為您的 LibreTV 實例添加密碼保護，可以在部署平臺上設置環境變量：

**環境變量名**: `PASSWORD`  
**值**: 您想設置的密碼

**環境變量名**: `ADMINPASSWORD`  
**值**: 您想設置的管理員密碼

各平臺設置方法：

- **Cloudflare Pages**: Dashboard > 您的項目 > 設置 > 環境變量
- **Vercel**: Dashboard > 您的項目 > Settings > Environment Variables
- **Netlify**: Dashboard > 您的項目 > Site settings > Build & deploy > Environment
- **Docker**: 修改 `docker run` 中 `your_password` 為你的密碼
- **Docker Compose**: 修改 `docker-compose.yml` 中的 `your_password` 為你的密碼
- **本地開發**: SET PASSWORD=your_password

### API兼容性

LibreTV 支持標準的蘋果 CMS V10 API 格式。添加自定義 API 時需遵循以下格式：
- 搜索接口: `https://example.com/api.php/provide/vod/?ac=videolist&wd=關鍵詞`
- 詳情接口: `https://example.com/api.php/provide/vod/?ac=detail&ids=視頻ID`

**添加 CMS 源**:
1. 在設置面板中選擇"自定義接口"
2. 接口地址: `https://example.com/api.php/provide/vod`

## ⌨️ 鍵盤快捷鍵

播放器支持以下鍵盤快捷鍵：

- **空格鍵**: 播放/暫停
- **左右箭頭**: 快退/快進
- **上下箭頭**: 音量增加/減小
- **M 鍵**: 靜音/取消靜音
- **F 鍵**: 全屏/退出全屏
- **Esc 鍵**: 退出全屏

## 🛠️ 技術棧

- HTML5 + CSS3 + JavaScript (ES6+)
- Tailwind CSS
- HLS.js 用於 HLS 流處理
- DPlayer 視頻播放器核心
- Cloudflare/Vercel/Netlify Serverless Functions
- 服務端 HLS 代理和處理技術
- localStorage 本地存儲

## ⚠️ 免責聲明

LibreTV 僅作為視頻搜索工具，不存儲、上傳或分發任何視頻內容。所有視頻均來自第三方 API 接口提供的搜索結果。如有侵權內容，請聯繫相應的內容提供方。

本項目開發者不對使用本項目產生的任何後果負責。使用本項目時，您必須遵守當地的法律法規。

## 🤝 衍生項目

它們提供了更多豐富的自定義功能，歡迎體驗~

- **[MoonTV](https://github.com/senshinya/MoonTV)**  
- **[OrionTV](https://github.com/zimplexing/OrionTV)**  

## 🎉 貢獻者福利

活躍貢獻者可以在 [Issue #268](https://github.com/LibreSpark/LibreTV/issues/268) 中留言，申請免費上車 1Password Team，享受團隊協作工具的便利！

## 💝 支持項目

如果您想支持本項目，可以考慮進行捐款：

[![捐贈](https://img.shields.io/badge/愛心捐贈-無國界醫生-1a85ff?style=for-the-badge&logo=medical-cross)](https://www.msf.hk/zh-hant/donate/general?type=one-off)
