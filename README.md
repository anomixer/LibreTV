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

## 🚀 快速部署

選擇以下任一平臺，點擊一鍵部署按鈕，即可快速創建自己的 LibreTV 實例：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLibreSpark%2FLibreTV)  
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/LibreSpark/LibreTV)  
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/LibreSpark/LibreTV)

## 🚨 重要声明

- 本项目仅供学习和个人使用，为避免版权纠纷，必须设置PASSWORD环境变量
- 请勿将部署的实例用于商业用途或公开服务
- 如因公开分享导致的任何法律问题，用户需自行承担责任
- 项目开发者不对用户的使用行为承担任何法律责任

## ⚠️ 同步与升级

Pull Bot 會反覆觸發無效的 PR 和垃圾郵件，嚴重干擾項目維護。作者可能會直接拉黑所有 Pull Bot 自動發起的同步請求的倉庫所有者。

**推薦做法：**

建議在 fork 的倉庫中啟用本倉庫自帶的 GitHub Actions 自動同步功能（見 `.github/workflows/sync.yml`）。 

如需手動同步主倉庫更新，也可以使用 GitHub 官方的 [Sync fork](https://docs.github.com/cn/github/collaborating-with-issues-and-pull-requests/syncing-a-fork) 功能。

对于更新后可能会出现的错误和异常，在设置中备份配置后，首先清除页面Cookie，然后 Ctrl + F5 刷新页面。再次访问网页检查是否解决问题。


## 📋 詳細部署指南

### Cloudflare Pages

1. Fork 或克隆本仓库到您的 GitHub 账户
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 Pages 服务
3. 点击"创建项目"，连接您的 GitHub 仓库
4. 使用以下设置：
   - 构建命令：留空（无需构建）
   - 输出目录：留空（默认为根目录）
5. **⚠️ 重要：在"设置" > "环境变量"中添加 `PASSWORD` 变量（必须设置）**
6. 点击"保存并部署"

### Vercel

1. Fork 或克隆本仓库到您的 GitHub/GitLab 账户
2. 登录 [Vercel](https://vercel.com/)，点击"New Project"
3. 导入您的仓库，使用默认设置
4. **⚠️ 重要：在"Settings" > "Environment Variables"中添加 `PASSWORD` 变量（必须设置）**
5. 点击"Deploy"


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
      - PASSWORD=${PASSWORD:-111111} # 可将 111111 修改为你想要的密码，默认为 your_password
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

**重要提示**: 为确保安全，所有部署都必须设置 PASSWORD 环境变量，否则用户将看到设置密码的提示。


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

## 🤝 衍生项目

它们提供了更多丰富的自定义功能，欢迎体验~

- **[MoonTV](https://github.com/senshinya/MoonTV)**  
- **[OrionTV](https://github.com/zimplexing/OrionTV)**  

## 🥇 感谢支持

- **[Sharon](https://sharon.io)**
- **[ZMTO](https://zmto.com)**
- **[YXVM](https://yxvm.com)**  