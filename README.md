![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) | ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) | ![mongodb](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

# 封面

![專案封面圖](https://avatars.githubusercontent.com/u/167001950)

> 募資平台的核心理念在於透過眾人的集體力量，在募資平台上支持以人為本，共同建立更美好社會互助

- [線上觀看連結](https://github.com/orgs/Move-Move-CrowdFunding/repositories)

## 功能

測試帳號密碼

```bash
帳號： example@example.com
密碼： example
```

- [] 登入
- [] 登出

## 安裝

> 請務必依據你的專案來調整內容。

以下將會引導你如何安裝此專案到你的電腦上。

Node.js 版本建議為：`18.14.0` 以上...

### 取得專案

```bash
git clone git@github.com:Move-Move-CrowdFunding/movemove_api.git
```

### 安裝套件

```bash
npm install
```

### 環境變數設定

請在終端機輸入 `cp .env.simple .env` 來複製 .env.example 檔案，並依據 `.env` 內容調整相關欄位。

### 運行專案

```bash
npm run start
```

### 開啟專案

在瀏覽器網址列輸入以下即可看到畫面

```bash
http://localhost:3000/
```

### swagger 文件

```bash
http://localhost:3000/api-docs
```

## 環境變數說明

```env
PORT=
MONGODB_URL= # MongoDB 資料庫網址
MONGODB_PASSWORD= # MongoDB 密碼

SWAGGER_HOST= # Swagger base url
SWAGGER_SCHEMES= # Swagger 連接 schemes, 'http' or 'https'

IMGUR_ALBUM_ID= # Imgur 相簿 Album ID
IMGUR_CLIENTID= # Imgur API 串接 Client ID
IMGUR_CLIENT_SECRET= # Imgur API 串接 Client Secret
IMGUR_REFRESH_TOKEN= # Imgur API 串接 Token

JWT_SECRET_KEY= # JWT TOKEN 加密私鑰

HASH_KEY= # 藍新金流 HashKey
HASH_IV= # 藍新金流 HashIV
MERCHANT_ID= # 藍新金流 商店代號
VERSION= # 藍新金流 串接版本號, 當前使用 '2.0'
NOTIFY_URL={API_URL}/payment/notify # 藍新金流 後端成功 Notify URL
RETURN_URL= # 藍新金流 前端成功 Return URL

CLIENT_ID= # Google Cloud Platform Client ID
CLIENT_SECRET= # Google Cloud Platform Secret Key
GMAIL_REDIRECT_URL= # Google Cloud Platform redirect URI
GMAIL_REFRESH_TOKEN= # Gmail API refresh token
...
```

## 資料夾說明

- connections - 資料庫連接
- controllers - 控制器放置處
- interface - TypeScript 型別
- middleware - API 攔截器
- modules - Mongoose 模組放置處
- routes - API 路由
- service - API 相關服務
- utils - 通用方法
  ...

## 專案技術

- Node.js v18.14.1
- express v4.16.1
- mongoose v8.3.2
- typescript v5.4.5
- swagger v2.23.7
  ...

## 第三方服務

- 藍新金流
- Imgur
  ...

## CI/CD 說明

此專案有使用 Github Actions，所以發起 PR 時會自動執行以下動作：

- 建立 Node.js 環境
- 安裝相依套件
- 編譯程式碼
- 執行 ESLint 掃描
- 執行測試
  ...

當專案 merge 到 main 時會自動執行以下動作：

- 建立 Node.js 環境
- 安裝相依套件
- 編譯程式碼
- 執行 ESLint 掃描
- 執行測試
- 部署到 Render
  ...

## 開發人員

> 查看 GitHab 更多開發專案

- [圈圈](https://github.com/panduola666)
- [羽](https://github.com/linglingsyu)
- [Hank](https://github.com/tw1720)
  ...
