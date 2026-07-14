// ==UserScript==
// @name         Miin Profile Data
// @version      0.3.0
// @match        https://miin.cc/*
// @description  Miin Profile Data
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      api.miin.cc
// @connect      storage.googleapis.com
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20Profile%20Data.js
// @downloadURL  https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20Profile%20Data.js
// ==/UserScript==

(function() {
    'use strict';

    function getMiinToken() {
        if (typeof unsafeWindow.validToken !== 'undefined' && unsafeWindow.validToken) {
            return unsafeWindow.validToken;
        }
        const cookies = document.cookie.split(';');
        const targetCookies = cookies.map(c => c.trim()).filter(c => c.startsWith('miin-auth='));
        if (targetCookies.length > 0) return targetCookies.pop().substring(10);
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // 內部封裝：處理 GCP 圖片上傳的通用函式 (type: 'avatar' 或 'cover')
    async function uploadImageToGCS(imageFile, type, token) {
        const uploadEndpoint = `https://api.miin.cc/mobile/v4/user/profile/${type}:upload`;

        console.log(`[GCS] 1. 申請 ${type} 上傳通行證...`);
        const authRes = await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST", url: uploadEndpoint,
                headers: {
                    "authorization": `Bearer ${token}`, "accept": "application/json",
                    "x-request-id": generateUUID(), "x-session-id": generateUUID(),
                    "x-accept-language": "zh-hant", "x-user-agent": unsafeWindow.APP_CONFIG.USER_AGENT_STRING,
                    "content-type": "application/json; charset=UTF-8", "user-agent": "okhttp/4.12.0"
                },
                data: JSON.stringify({ "mimeType": imageFile.type || "image/jpeg", "supportedProviders": ["GCS"] }),
                anonymous: true, onload: resolve, onerror: reject
            });
        });

        if (authRes.status !== 200 && authRes.status !== 201) throw new Error(`${type} 申請通行證失敗`);
        const authData = JSON.parse(authRes.responseText);
        const { uploadUrl, uploadKey, requiredHeaders } = authData.asset;

        console.log(`[GCS] 2. 直傳 ${type} 至 GCS...`);
        const uploadHeaders = {};
        requiredHeaders.forEach(h => uploadHeaders[h.key] = h.value);

        const uploadReq = await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "PUT", url: uploadUrl, headers: uploadHeaders, data: imageFile, anonymous: true,
                onload: resolve, onerror: reject
            });
        });

        if (uploadReq.status !== 200) throw new Error(`${type} GCS 上傳失敗`);
        console.log(`[GCS] ✅ ${type} 上傳完成，取得 Key: ${uploadKey}`);
        return uploadKey;
    }

    // 🌟 核心 API：接收文字與檔案，統一進行處理
    unsafeWindow.updateMiinProfileFull = async function(nickname, intro, avatarFile, coverFile) {
        const token = getMiinToken();
        if (!token) {
            console.error("❌ 找不到 Token");
            return false;
        }

        const payload = { fieldMask: [] };

        try {
            // 處理純文字
            if (nickname !== null && nickname !== undefined) {
                payload.nickname = nickname;
                payload.fieldMask.push("nickname");
            }
            if (intro !== null && intro !== undefined) {
                payload.intro = intro;
                payload.fieldMask.push("intro");
            }

            // 平行處理圖片上傳 (如果有的話)
            const uploadPromises = [];
            if (avatarFile) {
                uploadPromises.push(uploadImageToGCS(avatarFile, 'avatar', token).then(key => {
                    payload.avatarKey = key;
                    payload.fieldMask.push("avatarKey");
                }));
            }
            if (coverFile) {
                uploadPromises.push(uploadImageToGCS(coverFile, 'cover', token).then(key => {
                    payload.coverKey = key;
                    payload.fieldMask.push("coverKey");
                }));
            }

            // 等待所有圖片上傳完畢
            await Promise.all(uploadPromises);

            if (payload.fieldMask.length === 0) return true; // 沒東西要改

            console.log("3. 發送最終 PATCH 綁定資料...", payload);
            const res = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "PATCH", url: "https://api.miin.cc/mobile/v4/user/profile",
                    headers: {
                        "authorization": `Bearer ${token}`, "content-type": "application/json; charset=UTF-8",
                        "x-user-agent": unsafeWindow.APP_CONFIG.USER_AGENT_STRING, "user-agent": "okhttp/4.12.0"
                    },
                    data: JSON.stringify(payload),
                    onload: resolve, onerror: reject
                });
            });

            if (res.status === 200 || res.status === 204) {
                console.log("🎉 個人資料全面更新成功！");
                return true;
            } else {
                throw new Error(`PATCH 失敗: ${res.status}`);
            }

        } catch (err) {
            console.error("❌ 更新流程中斷:", err);
            return false;
        }
    };

    // 🌟 1. 注入 Panel 專用的 CSS 樣式
    function injectPanelCSS() {
        if (document.getElementById('miin-panel-style')) return;
        const style = document.createElement('style');
        style.id = 'miin-panel-style';
        style.innerHTML = `
            #miin-custom-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0, 0, 0, 0.6); z-index: 9998;
                opacity: 0; transition: opacity 0.3s ease; display: none;
            }
            #miin-custom-overlay.show { opacity: 1; display: block; }

            #miin-custom-panel {
                position: fixed; bottom: -100%; left: 50%; transform: translateX(-50%);
                width: 100%; max-width: 600px; max-height: 80vh; background: #2C2C2C; /* 配合深色模式 */
                border-radius: 20px 20px 0 0; z-index: 9999;
                display: flex; flex-direction: column;
                transition: bottom 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
            }
            #miin-custom-panel.show { bottom: 0; }

            .miin-panel-header {
                padding: 16px 20px; border-bottom: 1px solid #444;
                display: flex; justify-content: space-between; align-items: center;
            }
            .miin-panel-title { color: #FFF; font-size: 16px; font-weight: bold; margin: 0; }
            .miin-panel-close {
                background: #444; border: none; color: #FFF; border-radius: 50%;
                width: 30px; height: 30px; font-size: 14px; cursor: pointer;
            }

            .miin-panel-body {
                overflow-y: auto; padding: 10px 0; flex: 1;
            }
            .miin-user-item {
                display: flex; align-items: center; padding: 12px 20px;
                text-decoration: none; transition: background 0.2s;
            }
            .miin-user-item:hover { background: #3c3c3c; }
            .miin-user-avatar {
                width: 48px; height: 48px; border-radius: 50%; object-fit: cover; margin-right: 16px;
                background: #555; border: 1px solid #6AAFD8;
            }
            .miin-user-info { display: flex; flex-direction: column; }
            .miin-user-name { color: #D7BE41; font-size: 15px; font-weight: bold; }
            .miin-user-desc { color: #aaa; font-size: 12px; margin-top: 4px; }

            .miin-panel-empty { text-align: center; color: #888; padding: 30px 0; }
            .miin-panel-loading { text-align: center; color: #8BC4E6; padding: 30px 0; font-weight: bold; }
        `;
        document.head.appendChild(style);
    }

    // 🌟 2. 建立並顯示 Panel
    let overlay = document.getElementById('miin-custom-overlay');
    let panel = document.getElementById('miin-custom-panel');
    function showUserListPanel(title) {

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'miin-custom-overlay';
            document.body.appendChild(overlay);

            panel = document.createElement('div');
            panel.id = 'miin-custom-panel';
            panel.innerHTML = `
                <div class="miin-panel-header">
                    <h3 class="miin-panel-title"></h3>
                    <button class="miin-panel-close">✕</button>
                </div>
                <div class="miin-panel-body" id="miin-panel-content"></div>
            `;
            document.body.appendChild(panel);

            // 關閉事件

            overlay.addEventListener('click', closeFHPanel);
            panel.querySelector('.miin-panel-close').addEventListener('click', closeFHPanel);
        }

        // 初始化狀態
        panel.querySelector('.miin-panel-title').innerText = title;
        document.getElementById('miin-panel-content').innerHTML = '<div class="miin-panel-loading">載入中...</div>';

        // 顯示動畫
        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.classList.add('show');
            panel.classList.add('show');
        }, 10);
    }

    function closeFHPanel() {
        panel.classList.remove('show');
        overlay.classList.remove('show');
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
        unlockScroll();
        if (history.state?.hostViewer || history.state?.followerViewer) {
            history.back();
        }
    };

    unsafeWindow.MiinDispatcher.register('FHPanel', 90, (e) => {
        if(!panel)return;
        if (panel.classList.contains('show')) {
            closeFHPanel();
            return true;
        }
        return false;
    });


    // 🌟 3. 渲染名單資料進 Panel
    function renderUserList(users) {
        const contentArea = document.getElementById('miin-panel-content');
        if (!contentArea) return;

        if (!users || users.length === 0) {
            contentArea.innerHTML = '<div class="miin-panel-empty">目前沒有資料</div>';
            return;
        }

        let html = '';
        users.forEach(u => {
            // 解析資料結構
            const userId = u.userId;
            const nickname = u.data?.nickname || u.data?.username || '未知迷友';
            const badge = u.data?.badge === 'golden' ? '⚡' : '';
            // 嘗試取得頭像，若無則給預設圖
            let avatarUrl = 'https://miin.cc/miin.png';
            if (u.data?.avatar && u.data.avatar.length > 0) {
                avatarUrl = u.data.avatar[0].url;
            }

            const profileUrl = `https://miin.cc/user?userId=${userId}`;

            html += `
                <a href="${profileUrl}" class="miin-user-item">
                    <img src="${avatarUrl}" class="miin-user-avatar" loading="lazy" />
                    <div class="miin-user-info">
                        <span class="miin-user-name">${nickname} ${badge}</span>
                    </div>
                </a>
            `;
        });

        contentArea.innerHTML = html;
    }

    // 🌟 4. 綁定網頁上的「聽眾 / 收聽中」按鈕
    function attachProfileListeners() {
        const statsContainer = document.querySelector('[class="flex text-xs text-gray-500"]');
        if (!statsContainer || statsContainer.dataset.listenersAttached) return;

        const items = statsContainer.querySelectorAll('li');
        if (items.length < 2) return;

        // 確保 CSS 已注入
        injectPanelCSS();
        // 統一設定樣式函數
        const styleItem = (el) => {
            el.style.cursor = 'pointer';
            el.style.color = '#8BC4E6';
        };

        // 聽眾 (follower)
        styleItem(items[0]);
        items[0].onclick = async () => {
            showUserListPanel('聽眾名單');
            try {
                // 呼叫 Script 1 的 API
                const res = await unsafeWindow.miinFriendAPI.getFriendList('follower');
                renderUserList(res.users);
                lockScroll();
                history.pushState({...(history.state || {}), followerViewer: true}, "");
            } catch (err) {
                document.getElementById('miin-panel-content').innerHTML = '<div class="miin-panel-empty">讀取失敗</div>';
            }
        };

        // 收聽中 (host)
        styleItem(items[1]);
        items[1].onclick = async () => {
            showUserListPanel('收聽中名單');
            try {
                const res = await unsafeWindow.miinFriendAPI.getFriendList('host');
                renderUserList(res.users);
                lockScroll();
                history.pushState({...(history.state || {}), hostViewer: true}, "");
            } catch (err) {
                document.getElementById('miin-panel-content').innerHTML = '<div class="miin-panel-empty">讀取失敗</div>';
            }
        };

        const blacklistLi = document.createElement('li');
        blacklistLi.textContent = '黑名單';
        styleItem(blacklistLi);
        blacklistLi.style.marginLeft = '10px'; // 稍微拉開距離

        blacklistLi.onclick = async () => {
            showUserListPanel('黑名單列表');
            try {
                // 使用你提供的 API
                const data = await unsafeWindow.fetchMiinProfileFriendList('host:list?limit=50&cursor=&relation=blocking');

                // 這裡檢查一下 API 回傳的結構，確保 renderUserList 能吃進去
                // 如果回傳的資料結構跟 friendList 不同，這裡可能需要做一點調整
                renderUserList(data.users || data.list || []);

                lockScroll();
                history.pushState({...(history.state || {}), blockViewer: true}, "");
            } catch (err) {
                console.error(err);
                document.getElementById('miin-panel-content').innerHTML = '<div class="miin-panel-empty">無法讀取黑名單</div>';
            }
        };

        // 插入到第二個項目的後面 (收聽中是 items[1])
        items[1].after(blacklistLi);

        statsContainer.dataset.listenersAttached = 'true';
    }


    function lockScroll() {
        document.body.classList.add('viewer-scroll-locked');
    }

    function unlockScroll() {
        document.body.classList.remove('viewer-scroll-locked');
        unsafeWindow.MiinPWA.setScrollLocation();
    }

    // 利用 MutationObserver 偵測個人頁面渲染完成
    const observer = new MutationObserver(() => {
        if (window.location.href.includes('/user')) {
            attachProfileListeners();
        }
    }).observe(document.body?document.body:document, { childList: true, subtree: true });
})();
