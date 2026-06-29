// ==UserScript==
// @name         Miin Chat Room
// @namespace    http://tampermonkey.net/
// @version      0.2.6
// @description  Miin Chat Room
// @author       bixictn, Gemini, ChatGPT
// @match        https://miin.cc/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20Chat%20Room.js
// @downloadURL  https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20Chat%20Room.js
// ==/UserScript==

(function() {
    'use strict';
    let messagePollInterval = null;
    let renderedMessageIds = new Set();
    let historyDepth = 0;
    // ==========================================
    // 1. 建立 UI 骨架與樣式
    // ==========================================
    const chatContainer = document.createElement('div');
    chatContainer.id = 'miin-floating-chat';
    chatContainer.innerHTML = `
        <style>
            /* 基礎框架略作精簡，維持你原本的設定 */
            #chat-fab {
            display: flex; justify-content: center; align-items: center;cursor: pointer;
                ${checkIsMobile()?"":
    `width: 56px; height: 56px; border-radius: 50%;
                background: #222222; color: #fff;position: fixed; bottom: 20px;
                right: 20px; z-index: 999999; font-size: 24px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3); `};
            }
            #chat-panel {
                position: fixed; bottom: 20px; right: 90px; z-index: 999998;
                width: 450px; height: 450px; border-radius: 12px;
                background: #1A1A1A; border: 1px solid #333;
                box-shadow: 0 10px 30px rgba(0,0,0,0.8);
                display: none; flex-direction: column; overflow: hidden; color: #fff;
            }

            @media (max-width: 450px) {
                #chat-panel { width: 100vw; ${checkIsMobile()?"height: 100%;top: 0px;":""} bottom: 0; right: 0; border-radius: 0; }
            }
            .chat-header {
                height: 60px; background: #222; border-bottom: 1px solid #444;
                display: flex; align-items: center; padding: 0 15px; justify-content: space-between;
            }
            .chat-view { display: none; flex-direction: column; flex: 1; height: 100%; }
            .chat-view.active { display: flex; }

            /* 隱藏原生卷軸 */
            .chat-scroll-area { flex: 1; overflow-y: auto; padding: 10px; scrollbar-width: none; }
            .chat-scroll-area::-webkit-scrollbar { display: none; }

            .chat-input-area {
                 ${checkIsMobile()?"width: 100%":""};
                min-height: 60px; background: #222; border-top: 1px solid #444;
                display: flex; align-items: center; padding: 10px; gap: 8px;
            }
            .chat-input-area input {
                flex: 1; background: #333; color: #fff; border: none;
                padding: 10px 15px; border-radius: 20px; outline: none; font-size: 14px;
                ${checkIsMobile()?"width: 80%":""};
            }
            .chat-btn { background: none; border: none; color: #D4AF37; font-size: 20px; cursor: pointer; padding: 5px; }

            /* ✨ 聯絡人清單樣式 */
            .user-item {
                display: flex; align-items: center; padding: 12px 10px; cursor: pointer;
                border-bottom: 1px solid #2a2a2a; transition: background 0.2s; border-radius: 8px;
            }
            .user-item:hover { background: #2a2a2a; }
            .user-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; background: #333; margin-right: 12px; }
            .user-info { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
            .user-nickname { font-weight: bold; font-size: 15px; color: #eee; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
            .user-id { font-size: 12px; color: #888; margin-top: 2px;}

            /* ✨ 訊息氣泡樣式 */
            .msg-row { display: flex; margin-bottom: 16px; width: 100%; }
            .msg-row.me { justify-content: flex-end; }
            .msg-row.them { justify-content: flex-start; }
            .msg-bubble {
                max-width: 75%; padding: 10px 14px; border-radius: 18px;
                line-height: 1.4; word-break: break-word; font-size: 15px;
            }
            .msg-bubble.me { background: #777; color: #000; border-bottom-right-radius: 4px; }
            .msg-bubble.them { background: #333; color: #fff; border-bottom-left-radius: 4px; }
            .msg-bubble img { max-width: 100%; border-radius: 8px; margin-top: 4px; }

            .loading-spin {
                animation: spin 1s linear infinite;
                display: inline-block;
            }
            @keyframes spin {
                100% { transform: rotate(360deg); }
            }
            #chat-upload-img-btn {
                position: relative;
               ${checkIsMobile()?"width:32px;height:32px;padding-left: 0px;padding-right:25px;":"width:40px;height:40px;"}
                display: flex;
                justify-content: center;
                align-items: center;
                background: text;
                border:none !important;
                outline:none !important;
            }

            #upload-icon-idle, #upload-icon-loading {
                position: absolute; /* 關鍵：強制圖示重疊在按鈕正中央 */
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            /* 新訊息小紅點 */
            #new-msg-dot {
                position: absolute;
                top: 5px;
                right:  ${checkIsMobile()?"25%":"5px"};
                width: 12px;
                height: 12px;
                background: #ff4757;
                border-radius: 50%;
                border: 2px solid #1A1A1A;
                display: none; /* 預設隱藏 */
            }

            .tw-p-lock,.twemojified{
                font-size:24px !important;
            }
        .msg-date-divider {
			text-align: center;
			font-size: 12px;
			color: #888;
			margin: 16px 0;
			font-weight: bold;
		}
		/* 讓訊息列的內容靠底部對齊，這樣時間就會貼著氣泡底部 */
		.msg-row {
			display: flex; margin-bottom: 16px; width: 100%; align-items: flex-end;
		}
		/* 時間文字樣式 */
		.msg-time {
			font-size: 11px;
			color: #666;
			margin: 0 6px;
			margin-bottom: 2px;
			white-space: nowrap;
		}
        </style>

        <div id="chat-fab">
            ⚡
            <span id="new-msg-dot"></span>
        </div>

        <div id="chat-panel">
            <div id="view-list" class="chat-view active">
                <div class="chat-header">
                    <span style="font-weight: bold; font-size: 18px;">電波</span>
                    <button id="close-chat-btn" class="chat-btn" style="border:none !important;outline:none;">✖</button>
                </div>
                <div style="padding: 10px; border-bottom: 1px solid #333;">
                    <input type="text" id="chat-search" placeholder="搜尋迷友..." style="width: 100%; padding: 10px; border-radius: 8px; background: #333; color:#fff; border:none; outline:none;">
                </div>
                <div id="user-list-container" class="chat-scroll-area">
                    <div style="text-align:center; padding:20px; color:#888;">載入中...</div>
                </div>
            </div>

            <div id="view-room" class="chat-view">
                <div class="chat-header">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <button id="back-to-list-btn" class="chat-btn" style="font-size:24px;border:none !important;outline:none;">‹</button>
                        <img id="current-chat-avatar" src="" style="width:36px; height:36px; border-radius:50%; display:none; object-fit: cover;">
                        <span id="current-chat-name" style="font-weight: bold; font-size: 16px;">讀取中...</span>
                    </div>
                </div>
                <div id="message-list-container" class="chat-scroll-area" style="display: flex; flex-direction: column;">
                </div>
                <div class="chat-input-area">
                    <button id="chat-upload-img-btn" class="chat-btn">
                      <span id="upload-icon-idle" style="${checkIsMobile()?"width:32px;height:32px;":"width:40px;height:40px;"}">🏞️</span>
                      <span id="upload-icon-loading" style="display:none;${checkIsMobile()?"width:32px;height:32px;":"width:40px;height:40px;"}" class="loading-spin">🌀</span>
                   </button>
                    <input type="text" id="chat-text-input" placeholder="發送電波...">
                    <button id="chat-send-btn" class="chat-btn" style="border:none !important;outline:none;">➤</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(chatContainer);


    function checkIsMobile() {
        const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
        const isMobileUA = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        return hasCoarsePointer || isMobileUA;
    }

    // ==========================================
    // 2. 狀態變數與 DOM 綁定
    // ==========================================
    const fab = document.getElementById('chat-fab');
    const panel = document.getElementById('chat-panel');
    const viewList = document.getElementById('view-list');
    const viewRoom = document.getElementById('view-room');
    const userListContainer = document.getElementById('user-list-container');
    const msgListContainer = document.getElementById('message-list-container');

    // 儲存目前正在聊天的對象 ID，用來判斷訊息是「自己」發的還是「對方」發的
    let currentTargetUserId = null;
    let currentRoomId = null;

    // ==========================================
    // 3. 畫面切換邏輯
    // ==========================================
    window.addEventListener('popstate', (e) => {

        const state = e.state;
        if (state && state.miinChatPanel) {
            panel.style.display = 'flex';
            if (state.view === 'list') {
                historyDepth = 1;
                // 畫面切換回列表
                viewRoom.classList.remove('active');
                viewList.classList.add('active');
                currentRoomId = null;
                currentTargetUserId = null;
                if (messagePollInterval) {
                    clearInterval(messagePollInterval);
                    messagePollInterval = null;
                }
            } else if (state.view === 'room') {
                historyDepth = 2;
                viewList.classList.remove('active');
                viewRoom.classList.add('active');
            }
        } else {
            // 歷史狀態中沒有聊天面板，代表使用者退出了
            historyDepth = 0;
            panel.style.display = 'none';

            // 重置回預設狀態
            viewRoom.classList.remove('active');
            viewList.classList.add('active');
            currentRoomId = null;
            currentTargetUserId = null;
            if (messagePollInterval) {
                clearInterval(messagePollInterval);
                messagePollInterval = null;
            }
        }
    });

    fab.addEventListener('click', () => {
        if (panel.style.display === 'flex') {
            // 如果目前是開著的，透過歷史回退來關閉
            if (historyDepth > 0) {
                history.go(-historyDepth);
            } else {
                panel.style.display = 'none';
            }
        } else {
            // 開啟面板，推入第一層歷史 (列表)
            history.pushState({ miinChatPanel: true, view: 'list' }, '');
            historyDepth = 1;
            panel.style.display = 'flex';
            if (!userListContainer.querySelector('.user-item')) {
                loadAndRenderUserList();
            }
        }
    });

    document.getElementById('close-chat-btn').addEventListener('click', () => {
        // 根據目前的深度一次退回，保持歷史紀錄乾淨
        if (historyDepth > 0) {
            history.go(-historyDepth);
        } else {
            panel.style.display = 'none';
        }
    });

    document.getElementById('back-to-list-btn').addEventListener('click', () => {
        // 只要觸發回上一頁，popstate 監聽器就會自動幫我們切換畫面並清除輪詢
        if (historyDepth === 2) {
            history.back();
        }
    });

    // ==========================================
    // 4. API 串接與渲染：聯絡人列表與搜尋
    // ==========================================

    const newMsgDot = document.getElementById('new-msg-dot');

    async function checkNotifications() {
        if (typeof window.miinChatAPI === 'undefined') return;
        try {
            const res = await window.miinChatAPI.getNotificationStatus();
            if (res && res.hasNew) {
                newMsgDot.style.display = 'block';
            } else {
                newMsgDot.style.display = 'none';
            }
        } catch (e) {
            console.error("檢查通知失敗", e);
        }
    }

    // 每 15 秒檢查一次通知，不用太頻繁
    setInterval(checkNotifications, 15000);
    setTimeout(checkNotifications,500); // 初始執行一次

    // 2. 改用 room:list 載入聯絡人列表
    async function loadAndRenderUserList(query = '') {
        if (typeof window.miinChatAPI === 'undefined') return;

        // 如果有搜尋字串，還是用原本的 searchUsers
        // 如果沒有搜尋，改用 room:list 取得聊天室列表
        userListContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">載入中...</div>';

        try {
            const res = query ? await window.miinChatAPI.searchUsers(query) : await window.miinChatAPI.getRoomList();
            userListContainer.innerHTML = '';

            // 整理資料：room:list 的資料結構可能跟 search 不同，我們做簡單的轉換
            const list = res.rooms || res.users || [];

            if (list.length === 0) {
                userListContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">目前沒有聊天室</div>';
                return;
            }

            list.forEach(item => {
                // room:list 的結構可能包含 lastMessage 與對方資訊，這裡確保能取到對方資料
                const uData = item.data.author || item.targetUser;
                const roomId = item.roomId;
                const avatar = uData.data.avatar.thumb || 'https://miin.cc/miin.png';
                const nickname = uData.data.nickname;
                const userId = uData.userId;

                const div = document.createElement('div');
                div.className = 'user-item';
                div.innerHTML = `
                <img class="user-avatar" src="${avatar}">
                <div class="user-info">
                    <div class="user-nickname">${nickname}</div>
                    <div class="user-id">@${uData.data.username}</div>
                </div>
            `;
                div.onclick = () => {
                    history.pushState({ miinChatPanel: true, view: 'room' }, '');
                    historyDepth = 2;
                    openChatRoom(roomId, nickname, avatar, userId);
                    newMsgDot.style.display = 'none'; // 點進去列表後隱藏紅點
                };
                userListContainer.appendChild(div);
            });
        } catch (err) {
            userListContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#ff6b6b;">讀取列表失敗</div>';
        }
    }

    let searchTimeout;
    document.getElementById('chat-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        searchTimeout = setTimeout(() => {
            loadAndRenderUserList(query);
        }, 500);
    });

    // ==========================================
    // 5. API 串接與渲染：聊天室訊息
    // ==========================================
    let lastRenderedDateString = null; // 🌟 新增：用來記錄最後渲染的日期

    // 🌟 新增：時間格式化工具
    function formatTime(timestamp) {
        const d = new Date(timestamp * 1000);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`; // 輸出格式：14:30
    }

    function formatDate(timestamp) {
        const d = new Date(timestamp * 1000);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}/${mm}/${dd}`; // 輸出格式：2026/06/27
    }

    async function openChatRoom(roomId, nickname, avatarUrl, targetUserId) {
        if (messagePollInterval) clearInterval(messagePollInterval);
        renderedMessageIds.clear();
        lastRenderedDateString = null;

        viewList.classList.remove('active');
        viewRoom.classList.add('active');
        currentRoomId = roomId;
        currentTargetUserId = targetUserId;

        document.getElementById('current-chat-name').textContent = nickname;
        document.getElementById('current-chat-avatar').src = avatarUrl;
        document.getElementById('current-chat-avatar').style.display = 'block';

        // 初始化介面
        msgListContainer.innerHTML = '';

        async function refreshMessages() {
            if (typeof window.miinChatAPI === 'undefined') return;
            if (currentRoomId !== roomId) return;

            try {
                const res = await window.miinChatAPI.getMessages(roomId);
                if (!res || !res.messages) return;
                renderMessages(res.messages);
            } catch (err) {
                console.error("輪詢失敗", err);
            }
        }

        await refreshMessages();
        messagePollInterval = setInterval(refreshMessages, 4000);
    }

    function renderMessages(messages) {
        const messagesToRender = Array.isArray(messages) ? messages.slice().reverse() : [];
        let hasNewMessage = false;

        messagesToRender.forEach(msg => {
            const msgId = msg.message?.messageId || msg.messageId;
            if (renderedMessageIds.has(msgId)) return;

            const msgData = msg.data;
            const isMe = (msgData.author.userId !== currentTargetUserId);

            // 🌟 1. 處理時間與換日邏輯
            const timestamp = msgData.createAt;
            const dateString = formatDate(timestamp);
            const timeString = formatTime(timestamp);

            // 如果日期跟上一則不同，就插入「日期分隔線」
            if (dateString !== lastRenderedDateString) {
                const dateDivider = document.createElement('div');
                dateDivider.className = 'msg-date-divider';
                dateDivider.textContent = dateString;
                msgListContainer.appendChild(dateDivider);
                lastRenderedDateString = dateString; // 更新為最新日期
            }

            // 2. 處理訊息內容
            let contentHtml = '';
            if (msg.type === 'text') {
                const safeText = (msg.content && msg.content.text && msg.content.text[0]) ? msg.content.text[0].text : '';
                contentHtml = safeText.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            } else if (msg.type === 'image') {
                const imgUrl = msg.content?.image?.thumb || msg.content?.image?.url;
                contentHtml = `<img src="${imgUrl}">`;
            }
            if (!contentHtml) return;

            // 🌟 3. 組合 HTML：讓時間排在氣泡的左邊(自己)或右邊(對方)
            const row = document.createElement('div');
            row.className = `msg-row ${isMe ? 'me' : 'them'}`;

            if (isMe) {
                row.innerHTML = `
                <div class="msg-time">${timeString}</div>
                <div class="msg-bubble me">${contentHtml}</div>
            `;
            } else {
                row.innerHTML = `
                <div class="msg-bubble them">${contentHtml}</div>
                <div class="msg-time">${timeString}</div>
            `;
            }

            msgListContainer.appendChild(row);
            renderedMessageIds.add(msgId);
            hasNewMessage = true;
        });

        if (hasNewMessage) {
            msgListContainer.scrollTop = msgListContainer.scrollHeight;
        }
    }
    document.getElementById('back-to-list-btn').addEventListener('click', () => {
        // 清除輪詢
        if (messagePollInterval) {
            clearInterval(messagePollInterval);
            messagePollInterval = null;
        }

        viewRoom.classList.remove('active');
        viewList.classList.add('active');
        currentRoomId = null;
        currentTargetUserId = null;
    });

    const sendBtn = document.getElementById('chat-send-btn');
    const textInput = document.getElementById('chat-text-input');

    async function handleSendMessage() {
        const text = textInput.value.trim();
        if (!text || !currentRoomId) return;

        textInput.value = '';

        // 🌟 取得當下時間
        const nowUnix = Math.floor(Date.now() / 1000);
        const dateString = formatDate(nowUnix);
        const timeString = formatTime(nowUnix);

        // 如果跨日了（例如半夜 12 點整傳訊），也要加一條分隔線
        if (dateString !== lastRenderedDateString) {
            const dateDivider = document.createElement('div');
            dateDivider.className = 'msg-date-divider';
            dateDivider.textContent = dateString;
            msgListContainer.appendChild(dateDivider);
            lastRenderedDateString = dateString;
        }

        const row = document.createElement('div');
        row.className = 'msg-row me';
        row.innerHTML = `
            <div class="msg-time">${timeString}</div>
            <div class="msg-bubble me">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
        `;

        msgListContainer.appendChild(row);
        msgListContainer.scrollTop = msgListContainer.scrollHeight;

        try {
            const res = await window.miinChatAPI.sendMessage(currentRoomId, text);

            if (res && res.message && res.message.messageId) {
                renderedMessageIds.add(res.message.messageId);
                console.log("已成功加入 ID:", res.message.messageId);
            }

        } catch (err) {
            console.error("發送失敗", err);
        }
    }

    sendBtn.addEventListener('click', handleSendMessage);

    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });


    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    document.getElementById('chat-upload-img-btn').addEventListener('click', () => {
        fileInput.click();
    });

    function getImageDimensions(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.src = URL.createObjectURL(file);
        });
    }

    const iconIdle = document.getElementById('upload-icon-idle');
    const iconLoading = document.getElementById('upload-icon-loading');
    const uploadBtn = document.getElementById('chat-upload-img-btn');

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !currentRoomId) return;

        iconIdle.style.display = 'none';
        iconLoading.style.display = 'flex';
        uploadBtn.style.pointerEvents = 'none';

        try {
            const dimensions = await getImageDimensions(file);
            const authData = await window.miinChatAPI.getUploadUrl();
            const { uploadKey, uploadUrl, requiredHeaders } = authData.asset;

            await window.miinChatAPI.uploadToGCS(file, uploadUrl, requiredHeaders);
            await window.miinChatAPI.sendImageMessage(currentRoomId, uploadKey, dimensions.width, dimensions.height);

            fileInput.value = '';
        } catch (err) {
            console.error("圖片上傳失敗", err);
            alert("圖片發送失敗");
        } finally {
            iconLoading.style.display = 'none';
            iconIdle.style.display = 'flex';
            uploadBtn.style.pointerEvents = 'auto';
        }
    });

    // 建立一個全域監控器，隨時應對登入/登出狀態的變化
    let chatFab = document.getElementById('chat-fab');
    const authStateObserver = new MutationObserver(() => {
        // 尋找網頁上是否出現「登入」連結，這代表目前是「未登入」狀態
        const login=document.querySelector('[href="/login"]');
        if (login) {
            chatFab.style.display="none";
            if(login && localStorage.getItem('miin_valid_token')){
                localStorage.removeItem('miin_valid_token');
            }
            historyDepth = 0;
        } else {
            if(!chatFab){
                document.body.appendChild(chatContainer);
                chatFab = document.getElementById('chat-fab');
            }
            chatFab.style.display="flex";
            if (checkIsMobile()) {
                const postingLink = document.querySelector('footer a[href="/posting"]');
                if (postingLink) {
                    if (postingLink.nextElementSibling !== chatFab) {
                        postingLink.insertAdjacentElement('afterend', chatFab);
                    }
                }
            }
        }
    });

    // 開始觀察整個網頁的變動
    authStateObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.addEventListener('popstate', (e) => {
        setTimeout(()=>{
            if (checkIsMobile()) {
                const postingLink = document.querySelector('footer a[href="/posting"]');
                if (chatFab.nextElementSibling !== postingLink) {
                    postingLink.insertAdjacentElement('afterend', chatFab);
                }
            }
        },1000);

    });
})();
