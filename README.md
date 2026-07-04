# record-discord

One-command Discord live-stream recorder for macOS (Chrome web).
Auto-joins the stage, focuses the stream, records the exact video region
with system audio, and restores your audio setup when done.

一鍵錄製 Discord 直播（macOS + Chrome 網頁版）。取代原本的手動流程：
切聲音輸出 → 開直播頁 → 開 QuickTime → 拉錄影框 → 開始 → 結束。

## 用法

```sh
record-discord <直播頁網址>   # 開始錄影（全自動，見下方流程）
record-discord --chat        # 加上這個會自動點開聊天室，錄影範圍含聊天室訊息
record-discord --auto-stop   # 直播 video 消失約 2 分鐘後自動停止錄影
record-discord stop          # 手動停止：停止錄影、還原聲音輸出、打開檔案位置
record-discord status        # 查看目前狀態
record-discord doctor        # 檢查環境是否設定齊全（新使用者先跑這個）
```

常錄同一個頻道的話，把網址存成預設值，之後直接跑 `record-discord`：

```sh
mkdir -p ~/.config/record-discord
echo 'https://discord.com/channels/<伺服器ID>/<頻道ID>' > ~/.config/record-discord/url
```

## 開錄流程（全自動）

跑指令之後基本上什麼都不用做，腳本每 2 秒偵測一次、看到什麼做什麼：

1. 聲音輸出切到多重輸出裝置（你照常聽得到聲音）
2. 開啟（或切到）直播頁分頁
3. 舞台頻道自動點「加入舞台 / Join Stage」（觀眾身分）
4. 直播還是小預覽磚時，自動點擊放大成焦點畫面
   （優先點帶「直播/LIVE」標記的磚，不會誤點成員鏡頭）
5. 直播畫面夠大（video 佔視窗寬度 50% 以上）→ 自動開始錄影＋系統通知

錄影檔存在 `~/Movies/discord-live-日期時間.mov`。

**可以提早掛機等開播**：直播還沒開始也能先跑指令，舞台一開放就自動加入、
主持人一分享就自動開錄。預設最多等 30 分鐘，要等更久用
`RD_POLL_TIMEOUT=7200 record-discord`。等待期間讓 Discord 分頁留在
最前面（切走不會壞，但偵測會暫停到你切回來）。

## 停止錄影的方式

1. **懸浮按鈕（主要方式）**：錄影開始後螢幕上會出現置頂的「⏹ 停止錄影」
   小面板，位置自動選在錄影範圍外（直播畫面左側的 Discord 側欄上），
   所以按鈕不會被錄進影片，點下去也不會搶走 Chrome 的焦點。
2. **自動偵測（選用，`--auto-stop`）**：每 20 秒檢查直播 video 還在不在
   （背景分頁也查得到），連續 2 分鐘消失就自動停止＋通知。
   預設關閉——主持人可能只是暫停分享畫面但繼續講話。
3. **終端機**：`record-discord stop`（注意切到終端機的過程會被錄進去）。

## 運作方式

1. `SwitchAudioSource` 把聲音輸出切到多重輸出裝置（先記住原本的裝置）
2. 在 Chrome 找到（或開啟）Discord 直播分頁並帶到最前面
3. 用 AppleScript 叫 Chrome 執行 JavaScript，抓到直播 `<video>` 元素
   在螢幕上的精確座標（會跟視窗可視範圍取交集，避免抓到螢幕外的假座標）
   - `--chat` 模式：先點右上角的聊天按鈕（aria-label 為 Open Chat /
     Show Chat / 開啟聊天 / 顯示聊天，精確比對，避免誤點名叫「聊天室」
     的頻道），等版面重排後，錄影範圍改為「video ∪ 聊天訊息列表 ∪
     輸入框」的聯集。找不到按鈕或量不到聊天室時自動退回純直播畫面。
4. `screencapture -v -R <區域> -G <BlackHole UID>` 錄影：
   區域＝分享畫面、聲音＝BlackHole 收系統音，**不會動到你的麥克風設定**
5. `stop` 時送 SIGINT 讓檔案完整收尾，再把聲音輸出還原

## 安裝與前置作業（第一次使用）

裝完後跑 `record-discord doctor`，會逐項檢查並告訴你缺什麼。

### 1. 安裝工具（需要 [Homebrew](https://brew.sh)）

```sh
brew install switchaudio-osx     # 切換音訊裝置的指令
brew install blackhole-2ch       # 虛擬音訊裝置（把系統聲音接給錄影）
brew install ffmpeg              # 選用：只拿來顯示錄影長度
```

裝完 BlackHole 建議重開機（或 `sudo killall coreaudiod`）讓裝置出現。

### 2. 建立多重輸出裝置（讓你邊聽邊錄）

1. 開啟「**音訊 MIDI 設定**」（應用程式 > 工具程式）
2. 左下角「＋」→「**建立多重輸出裝置**」
3. 右邊勾選兩個：**你平常的喇叭/耳機** ＋ **BlackHole 2ch**
   （喇叭那排的「時脈來源」設為主裝置，BlackHole 勾「偏移校正」）
4. 把裝置改名成 **Record w Sound**
   （想取別的名字也行，跑的時候用 `RD_OUTPUT_DEVICE="你的名字"` 指定）

原理：錄影時系統聲音輸出到這個裝置＝喇叭和 BlackHole 同時有聲音，
你聽得到、`screencapture` 也錄得到，而且不會動到你的麥克風。

### 3. Chrome 設定

- 登入 Discord（本工具用 Chrome 網頁版，不需要 Discord App）
- 選單「**檢視 > 開發人員 > 允許 Apple 事件中的 JavaScript**」打勾
  （英文版：View > Developer > Allow JavaScript from Apple Events）

### 4. 放檔案＋接上 PATH

`record-discord` 和 `float-stop.js` 兩個檔案要放同一個資料夾，然後：

```sh
chmod +x record-discord
ln -s "$(pwd)/record-discord" /opt/homebrew/bin/record-discord
```

### 5. macOS 權限（第一次跑會自動跳出詢問）

系統設定 > 隱私權與安全性，給你的終端機 App（Terminal / iTerm2…）：

- **螢幕錄製**（screencapture 要用）
- **自動化 > Google Chrome、System Events**（控制 Chrome 要用）

第一次跑 `record-discord` 時系統會逐個跳窗詢問，都按允許即可；
授權「螢幕錄製」後要重開終端機 App 才生效。

## 多視窗行為

- 找分頁時按視窗前後順序（z-order）掃描，**無痕視窗一律排除**
- 已有該頻道分頁 → 切到該分頁並把視窗帶到最前（縮小在 Dock 的會自動還原）
- 沒有 → 在第一個非無痕、非縮小的視窗開新分頁；都沒有就開新的一般視窗

## 注意事項

- Chrome 的頁面縮放請維持 100%，否則座標會偏
- 錄影區域是固定座標：錄影中不要移動/縮放該 Chrome 視窗，
  也不要讓其他視窗蓋住直播畫面
- 視窗請放在主螢幕（選單列那個螢幕）；放在排列於主螢幕上方/左方的
  副螢幕會產生負座標，`screencapture` 錄影模式不支援

## 可調參數（環境變數）

| 變數 | 預設 | 說明 |
|---|---|---|
| `RD_OUTPUT_DEVICE` | `Record w Sound` | 錄影期間切換到的多重輸出裝置名稱 |
| `RD_AUDIO_UID` | `BlackHole2ch_UID` | 錄影收音的裝置 UID |
| `RD_URL` | （參數或設定檔） | 要開啟的直播頁網址 |
| `RD_URL_MATCH` | （從網址自動推導） | 用哪個字串找分頁 |
| `RD_MIN_RATIO` | `0.5` | video 需佔視窗寬度的比例才開錄 |
| `RD_POLL_TIMEOUT` | `1800` | 最多等幾秒偵測分享畫面（可提早掛機等開播） |
| `RD_CHAT` | `0` | 設 1 等同 `--chat` |
| `RD_AUTOSTOP` | `0` | 設 1 等同 `--auto-stop` |
| `RD_NO_BUTTON` | `0` | 設 1 不顯示懸浮停止按鈕 |
| `RD_WATCH_INTERVAL` | `20` | 自動偵測直播結束的間隔（秒） |
| `RD_WATCH_MISSES` | `6` | 連續幾次沒偵測到 video 才自動停止 |

## License

MIT
