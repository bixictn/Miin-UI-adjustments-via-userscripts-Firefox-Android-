// ==UserScript==
// @name         Miin Fetch Data
// @version      0.5.0
// @description  Miin Fetch Data
// @match        https://miin.cc/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      api.miin.cc
// @connect      storage.googleapis.com
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20Fetch%20Data.js
// @downloadURL  https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20Fetch%20Data.js
// ==/UserScript==

(function() {
    'use strict';

    unsafeWindow.APP_CONFIG = {
        VERSION: "4.9.13",
        USER_AGENT_STRING: "Miin/Android-4.9.13"
    };

    unsafeWindow.MiinAPI = {
        async toggleFollow(hostId, isFollowing) {
            const action = isFollowing ? 'follow' : 'unfollow';
            const url = `https://api.miin.cc/web/v2/friend/host:${action}?hostId=${hostId}`;

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getMiinToken()}`,
                        'Content-Type': 'application/json',
                        'x-request-id': generateUUID(), // 您原有的 UUID 產生器
                        "x-session-id": generateUUID(),
                        "x-accept-language": "zh-hant",
                        "x-user-agent": unsafeWindow.APP_CONFIG?.USER_AGENT_STRING,
                        "user-agent": "okhttp/4.12.0",
                    }
                });
                if (res.ok) {
                    console.log(`成功執行: ${action}`);
                    // 更新 SessionStorage 狀態，UI Script 會自動偵測並重新渲染
                    const cacheRaw = sessionStorage.getItem(`miin_user_${hostId}`);
                    if (cacheRaw) {
                        const userData = JSON.parse(cacheRaw);
                        userData.relation = isFollowing ? 'following' : 'none';
                        sessionStorage.setItem(`miin_user_${hostId}`, JSON.stringify(userData));
                    }

                    window.dispatchEvent(new CustomEvent('MiinDataUpdated'));
                }
            } catch (err) {
                console.error('API 操作失敗:', err);
            }
        },

        async toggleBlock(hostId, isBlocking) {
            const action = isBlocking ? 'block' : 'unblock';
            const url = `https://api.miin.cc/mobile/v4/friend/host:${action}?hostId=${hostId}`;

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getMiinToken()}`,
                        'Content-Type': 'application/json',
                        'x-request-id': generateUUID(), // 您原有的 UUID 產生器
                        "x-session-id": generateUUID(),
                        "x-accept-language": "zh-hant",
                        "x-user-agent": unsafeWindow.APP_CONFIG?.USER_AGENT_STRING,
                        "user-agent": "okhttp/4.12.0",
                    }
                });

                if (res.ok) {
                    console.log(`成功執行: ${action}`);
                    // 更新 SessionStorage 狀態，UI Script 會自動偵測並重新渲染
                    const cacheRaw = sessionStorage.getItem(`miin_user_${hostId}`);
                    if (cacheRaw) {
                        const userData = JSON.parse(cacheRaw);
                        userData.relation = isBlocking ? 'blocking' : 'none'; // 更新狀態

                        // 寫回 Cache
                        sessionStorage.setItem(`miin_user_${hostId}`, JSON.stringify(userData));
                    }

                    window.dispatchEvent(new CustomEvent('MiinDataUpdated'));
                }

            } catch (err) {
                console.error('API 操作失敗:', err);
            }
        }
    };

    let fetchdata=false,embeddedquote=false;
    const fsnormal=localStorage.getItem('miin_fs') || 16,
          fscolor=localStorage.getItem('miin_fscolor') || '#6AAFD8',
          usercolor=localStorage.getItem('miin_usercolor') || '#D7BE41',
          linkcolor=localStorage.getItem('miin_linkcolor') ||'#8BC4E6',
          bgcolor=localStorage.getItem('miin_bgcolor') ||'#2C2C2C',
          bgcolor2=localStorage.getItem('miin_bgcolor2') ||'#111111',
          bubblecolor=localStorage.getItem('miin_bubblecolor') ||'#5F7B84';

    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {

        if (header.toLowerCase() === 'authorization' && value.startsWith('Bearer ')) {
            const tokenInHeader = value.replace('Bearer ', '');

            // 只要經過的 Token 跟我們手上的不一樣，就代表網站換發了新 Token，立刻更新！
            if (localStorage.getItem('miin_valid_token') !== tokenInHeader) {
                localStorage.setItem('miin_valid_token', tokenInHeader);
                console.log("🎯 [XHR 攔截器] 抓到最新 Token 並已儲存至 LocalStorage！");
            }
        }

        return originalSetRequestHeader.apply(this, arguments);
    };


    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
        let targetUrl = url;

        // 1. 發文與編輯 (PATCH/POST) 轉址
        if ((method === 'PATCH' || method === 'POST') && typeof url === 'string') {
            if (url.includes('/web/v2/posting/story')) {
                targetUrl = url.replace('/web/v2/posting/story', '/mobile/posting/v5/story');
                console.log('[Miin] 發文/編輯 攔截成功！轉址為 v5:', targetUrl);
            }
            // 【新增】攔截留言請求
            else if (url.includes('/web/v2/posting/comment')) {
                targetUrl = url.replace('/web/v2/posting/comment', '/mobile/posting/v5/comment');
                console.log('[Miin] 留言 攔截成功！轉址為 v5:', targetUrl);
            }
        }
        // 2. 取得草稿 (GET) 轉址 (直接讓網頁去抓 v5 的完整資料)
        else if (method === 'GET' && typeof url === 'string' && url.includes('/web/v2/posting/story?storyId=')) {
            targetUrl = url.replace('/web/v2/posting/story', '/mobile/posting/v5/story');
            this._isDraftRequest = true; // 標記這是一個草稿請求
            console.log('[Miin] GET 草稿轉址至 v5:', targetUrl);
        }

        this._method = method;
        this._url = targetUrl;
        this._requestUrl = targetUrl;

        return originalXhrOpen.apply(this, [method, targetUrl, ...Array.from(arguments).slice(2)]);
    };


    XMLHttpRequest.prototype.send = function(body) {
        const url = this._requestUrl;
        // 確保有這個全域變數或函式
        const token = typeof getMiinToken === 'function' ? getMiinToken() : '';

        // ==========================================
        // A. Payload 攔截與修改 (發文/更新時)
        // ==========================================
        const isStory = this._url.includes('/mobile/posting/v5/story');
        const isComment = this._url.includes('/mobile/posting/v5/comment');

        if ((this._method === 'PATCH' || this._method === 'POST') && (isStory || isComment) && typeof body === 'string') {
            try {
                const data = JSON.parse(body);

                // 確保有內容才處理 (防呆)
                if (data.text !== undefined) {
                    let v5Data = {};

                    // 1. 根據類型建立不同的基底結構
                    if (isStory) {
                        v5Data = {
                            title: [{ query: null, text: data.title || '', type: 'plain', userId: null }],
                            content: [],
                            coverKeys: data.coverKeys || [],
                            videoKeys: data.videoKeys || [],
                            audioKey: data.audioKey || "",
                            fieldMask: ["title", "content", "coverKeys", "videoKeys", "audioKey", "previewTitle", "previewImageKey"],
                            previewImageKey: null,
                            previewTitle: null
                        };
                    } else if (isComment) {
                        v5Data = {
                            storyId: data.storyId,
                            audioKey: data.audioKey || null, // 留言的空值是 null
                            imageKey: data.imageKey || null, // 留言的空值是 null
                            content: []
                        };
                    }

                    // 2. 共用強大的字串切割與還原邏輯
                    const parts = data.text.split(/(#\S+|@[^\(]+\([^\)]+\)|\n)/);

                    parts.forEach(part => {
                        if (!part) return;

                        const mentionMatch = part.match(/^@([^\(]+)\(([^\)]+)\)$/);

                        if (mentionMatch) {
                            const nickname = mentionMatch[1];
                            const username = mentionMatch[2];
                            let uid = null;

                            // 利用您的捷徑快取瞬間反查 ID
                            let cachedId = window.sessionStorage.getItem(`miin_username_${username}`);
                            if (cachedId) {
                                uid = parseInt(cachedId.replace(/"/g, ''), 10);
                            }

                            if (uid) {
                                v5Data.content.push({ query: null, text: null, type: 'mention', userId: uid });
                                console.log(`[Miin] 成功將 ${isComment ? '留言' : '文章'} 提及 @${username} 轉換為 userId: ${uid}`);
                            } else {
                                v5Data.content.push({ query: null, text: part, type: 'plain', userId: null });
                                console.warn(`[Miin] 找不到 ${username} 的快取資料，以純文字發送`);
                            }
                        } else if (part.startsWith('#')) {
                            v5Data.content.push({ query: part, text: null, type: 'hashtag', userId: null });
                        } else {
                            v5Data.content.push({ query: null, text: part, type: 'plain', userId: null });
                        }
                    });

                    console.log(`[Miin] 已成功轉換為 v5 Payload 格式 (${isComment ? 'Comment' : 'Story'})`);
                    arguments[0] = JSON.stringify(v5Data);
                }
            } catch (e) {
                console.error('[Miin] Payload 轉換失敗:', e);
            }
        }

        // ==========================================
        // B. 草稿 Response 攔截 (修改回傳內容) - 同步執行，不阻塞！
        // ==========================================
        if (this._isDraftRequest) {
            const originalResponseTextDescriptor = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'responseText');
            const originalResponseDescriptor = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'response');

            const interceptGetter = function() {
                let rawText = originalResponseTextDescriptor.get.call(this);
                if (!rawText) return rawText;

                try {
                    let data = JSON.parse(rawText);

                    // 確定拿到的是 v5 格式
                    if (data.story && data.story.data) {

                        // 【關鍵修正 1】：應付 Zod 驗證，將 title 陣列轉回字串
                        if (Array.isArray(data.story.data.title)) {
                            data.story.data.title = data.story.data.title.map(t => t.text || '').join('');
                        }

                        // 處理 content (還原 Mention)
                        if (data.story.data.content) {
                            let rebuiltText = '';

                            data.story.data.content.forEach(item => {
                                if (item.type === 'mention') {
                                    const uid = item.data.userId;
                                    const nickname = item.text || item.data.nickname;
                                    let foundUsername = uid;

                                    let cacheData = window.sessionStorage.getItem(`miin_user_${uid}`);
                                    if (cacheData) {
                                        try { foundUsername = JSON.parse(cacheData).username; } catch(e) {}
                                    }
                                    rebuiltText += `@${nickname}(${foundUsername})`;
                                } else if (item.type === 'hashtag') {
                                    rebuiltText += item.text;
                                } else {
                                    rebuiltText += item.text || '';
                                }
                            });

                            data.story.data.text = rebuiltText;

                            delete data.story.data.content;
                        }

                        return JSON.stringify(data);
                    }
                } catch (e) {
                    console.error('[Miin] 草稿 JSON 解析重組失敗', e);
                }
                return rawText;
            };

            Object.defineProperty(this, 'responseText', { get: interceptGetter });
            Object.defineProperty(this, 'response', { get: interceptGetter });
        }


        // ==========================================
        // C. 被動讀取：監聽載入完成事件 (處理其他頁面邏輯)
        // ==========================================
        this.addEventListener('load', async () => {
            if (typeof url === 'string' && url.includes('/web/v2/user/page?userId=')) {
                try {
                    const response = JSON.parse(this.responseText);
                    if (response && response.relation) {
                        const userId = response.user.userId;
                        const cacheRaw = sessionStorage.getItem(`miin_user_${userId}`);
                        if (cacheRaw) {
                            const userData = JSON.parse(cacheRaw);
                            userData.relation = response.relation;
                            sessionStorage.setItem(`miin_user_${userId}`, JSON.stringify(userData));
                        }
                        window.dispatchEvent(new CustomEvent('MiinDataUpdated'));
                    }
                } catch (e) {
                    console.error('解析 relation 失敗:', e);
                }
            }
            else if (typeof url === 'string' && url.includes('me')) {
                try {
                    const response = JSON.parse(this.responseText);
                    if (response && response.me) {
                        sessionStorage.setItem(`miin_loginId`, response.me.userId);
                    }
                } catch (e) {
                    console.error('解析 login user 失敗:', e);
                }
            }
            else if (typeof url === 'string' && url.includes('https://api.miin.cc/web/story/v3/story?storyId=')) {
                try {
                    const response = JSON.parse(this.responseText);
                    if (response && response.story.state && response.story.state === 'blocked') {
                        window.location.replace('/feed/trend');
                    }
                } catch (e) {
                    console.error('解析文章 relation 失敗:', e);
                }
            }
        });

        // ==========================================
        // D. 發送 Shadow API 請求 (背景執行)
        // ==========================================
        if (typeof url === 'string' && url.includes('/web/v2/user/page?userId=')) {
            try {
                const urlObj = new URL(url.startsWith('http') ? url : window.location.origin + url);
                const userId = urlObj.searchParams.get('userId');
                if (userId) {
                    fetchShadowMobileData(`https://api.miin.cc/mobile/v4/user/page?userId=${userId}&storyLimit=0`, token);
                }
            } catch (e) { console.error('v4Url發生錯誤:', e); }
        }

        let mobileUrl = '';
        try {
            const urlObj = new URL(url.startsWith('http') ? url : window.location.origin + url);
            const storyId = urlObj.searchParams.get('storyId');
            const cursor = urlObj.searchParams.get('cursor') || '';
            const limit = urlObj.searchParams.get('limit') || '30';

            if (url.includes('/comment:list') && storyId) {
                mobileUrl = `https://api.miin.cc/mobile/story/v5/comment:list?storyId=${storyId}&limit=${limit}&cursor=${encodeURIComponent(cursor)}`;
            } else if (url.includes('/story/page') && storyId) {
                mobileUrl = `https://api.miin.cc/mobile/story/v5/page?storyId=${storyId}`;
            } else if (url.includes('/story:list')) {
                mobileUrl = `https://api.miin.cc/mobile/feed/v5/trend/story:list?limit=${limit}&cursor=${encodeURIComponent(cursor)}&immersive=true`;
            }

            if (mobileUrl) {
                fetchShadowMobileData(mobileUrl, token);
            }
        } catch (e) {}

        // ==========================================
        // E. 最終發送 (確保所有前置作業完成，且只呼叫一次)
        // ==========================================
        return originalXhrSend.apply(this, arguments);
    };

    function saveUserToCache(userId, dataObj) {
        if (!userId || !dataObj) return;
        const cacheKey = `miin_user_${userId}`;
        const userData = {
            badge: dataObj.badge || 'none',
            nickname: dataObj.nickname || '',
            username: dataObj.username || '',
            relation: dataObj.relation
        };

        sessionStorage.setItem(cacheKey, JSON.stringify(userData));
        if (dataObj.username) {
            sessionStorage.setItem(`miin_username_${dataObj.username}`, userId);
        }
        if (dataObj.nickname) {
            sessionStorage.setItem(`miin_nickname_${dataObj.nickname}`, userId);
        }
    }

    function harvestBadgesFromJson(obj) {
        if (!obj || typeof obj !== 'object') return;

        // 特徵辨識：只要該節點有 userId，且 data 裡面有 badge，就視為目標
        if (obj.userId && obj.data && 'badge' in obj.data) {
            saveUserToCache(obj.userId, obj.data);
        }

        // 遞迴往下挖所有的陣列與子物件
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                harvestBadgesFromJson(obj[key]);
            }
        }
    }

    // ==========================================
    // 2. 手機版 API 補齊資料
    // ==========================================

    async function fetchShadowMobileData(Url,token,getdata) {

        try {
            const res = await window.fetch(Url, {
                method: 'GET',
                headers: {
                    "authorization": `Bearer ${token}`,
                    "accept": "application/json",
                    "x-request-id": generateUUID(),
                    "x-session-id": generateUUID(),
                    "x-accept-language": "zh-hant",
                    "x-user-agent": unsafeWindow.APP_CONFIG?.USER_AGENT_STRING,
                    "user-agent": "okhttp/4.12.0",
                    'accept': 'application/json'
                }
            });
            const data = await res.json();
            if(getdata)return data;
            harvestBadgesFromJson(data);

        } catch (err) {
            console.error('[取得資料錯誤]', err);
        }
    }

    // 🌟 共用工具：產生模擬 App 的 UUID
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getMiinToken() {
        return localStorage.getItem('miin_valid_token');
    }

    //==========Profile data==========
    // 🌟 API：取得使用者個人資料
    unsafeWindow.fetchMiinProfileFriendList = async function(endpoint) {
        const token = getMiinToken();
        if (!token) return null;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://api.miin.cc/mobile/v4/friend/" + endpoint,
                headers: {
                    "authorization": `Bearer ${token}`,
                    "accept": "application/json",
                    "x-request-id": generateUUID(),
                    "x-session-id": generateUUID(),
                    "x-accept-language": "zh-hant",
                    // 加上預設值防呆，避免 APP_CONFIG 還沒載入就報錯
                    "x-user-agent": unsafeWindow.APP_CONFIG?.USER_AGENT_STRING || "Miin/Android-4.9.12",
                    "user-agent": "okhttp/4.12.0"
                },
                onload: (res) => {
                    if (res.status === 401) {
                        console.warn("⚠️ API 回傳 401 (Token 可能已過期)", res);
                        reject(401); // 🌟 這裡一定要 reject，才不會讓 UI 卡死
                    } else if (res.status >= 200 && res.status < 300) {
                        try {
                            const data = JSON.parse(res.responseText);
                            resolve(data);
                        } catch (e) {
                            console.error("❌ JSON 解析失敗:", res.responseText);
                            reject("JSON Parse Error");
                        }
                    } else {
                        console.error(`❌ API 錯誤 [${res.status}]:`, res.responseText);
                        reject(res.status);
                    }
                },
                onerror: (err) => {
                    console.error("❌ 網路請求失敗:", err);
                    reject(err);
                }
            });
        });
    };

    //==============================

    unsafeWindow.miinFriendAPI = {
        // 🌟 補上 limit=50&cursor= 參數
        getBlockedUsers: () => unsafeWindow.fetchMiinProfileFriendList('host:list?limit=50&cursor=&relation=blocking'),

        //fh = 'follower' //聽眾, 'host' //收聽中
        getFriendList: (fh) => unsafeWindow.fetchMiinProfileFriendList(`${fh}:list?limit=50&cursor=&relation=following`)
    };

    unsafeWindow.fetchMiinProfile = async function() {
        const token = getMiinToken();
        if (!token) return null;

        const res = await new Promise(resolve => GM_xmlhttpRequest({
            method: "GET",
            url: "https://api.miin.cc/mobile/v4/user/profile",
            headers: {
                "authorization": `Bearer ${token}`,
                "x-user-agent": unsafeWindow.APP_CONFIG.USER_AGENT_STRING,
                "user-agent": "okhttp/4.12.0"
            },
            onload: (res) => resolve(res.status === 200 ? JSON.parse(res.responseText).user.data : null)
        }));

        const meRes = await new Promise(resolve => GM_xmlhttpRequest({
            method: "GET",
            url: "https://api.miin.cc/mobile/v4/setting/me",
            headers: {
                "authorization": `Bearer ${token}`,
                "x-user-agent": unsafeWindow.APP_CONFIG.USER_AGENT_STRING,
                "user-agent": "okhttp/4.12.0"
            },
            onload: (res) => resolve(res.status === 200 ? JSON.parse(res.responseText).me.data : null)
        }));

        if (!meRes) return null;

        return {...res, cover: meRes.cover};
    };
    //==============================

    //==========modify searchh page==========
    function injectExploreContent() {
        const search = window.location.href;
        const pwaec=document.getElementById('pwa-explore-container');
        if (!search.endsWith('search')) {
            fetchdata=false
            if(pwaec)pwaec.style.display='none';
            return;
        }

        const targetForm = document.querySelector('div.card-full form.p-8');
        if (targetForm && !document.getElementById('pwa-explore-container') && !fetchdata) {
            if(pwaec)pwaec.style.display='flex';
            console.log("🎯 [PWA] 偵測到搜尋區塊，正在同步迷友與最新迷音...");
            fetchdata=true;
            Promise.all([
                fetchShadowMobileData("https://api.miin.cc/mobile/explore/v5/explore/user:list?limit=50&cursor=",getMiinToken(),true),
                fetch("https://api.miin.cc/mobile/explore/v5/explore/hashtag:list?limit=15&cursor=").then(res => res.json()),
                fetchShadowMobileData("https://api.miin.cc/mobile/explore/v5/explore/story:list?limit=50&cursor=",getMiinToken(),true)
            ])
                .then(([userData, tagData, storyData]) => {
                if (userData?.users && tagData?.hashtags && storyData?.stories) {
                    createExploreContainer(userData.users, tagData.hashtags, storyData.stories)
                        .then(exploreNode => {
                        if (exploreNode) {
                            targetForm.insertAdjacentElement('afterend', exploreNode);
                            console.log("✅ [PWA] 迷友橫滑 ＋ 最新迷音（含引文標記） 成功！");
                        }
                    });
                }
            })
        }
    }

    async function createExploreContainer(users, hashtags, stories) {
        if (document.getElementById('pwa-explore-container')) return null;
        const goldenBadgeSvg=`
                        <svg class="miin-custom-badge inline-block h-4 w-4 align-text-bottom" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px;">
                            <path fill="#FBBF24" d="M21.8836 11.9999 L23.3416 9.72645 C23.4939 9.48915 23.5389 9.19911 23.4656 8.92762 C23.3934 8.65614 23.2088 8.42762 22.9588 8.29774 L20.5594 7.05751 L20.6854 4.36024 C20.6981 4.07899 20.5926 3.80555 20.3934 3.60633 C20.1941 3.40613 19.9148 3.2909 19.6395 3.31434 L16.9417 3.44032 L15.7015 1.04091 C15.5726 0.790906 15.3441 0.606336 15.0721 0.534066 C14.7996 0.461796 14.5106 0.505746 14.2737 0.658086 L11.9999 2.1161 L9.72594 0.658096 C9.48912 0.505756 9.19811 0.461806 8.9276 0.534076 C8.65563 0.606346 8.42711 0.790916 8.29821 1.04092 L7.05798 3.44033 L4.35974 3.31435 C4.08093 3.29287 3.80554 3.40615 3.60632 3.60634 C3.4071 3.80556 3.30114 4.079 3.31433 4.36025 L3.43982 7.05752 L1.04041 8.29775 C0.790409 8.42763 0.606819 8.65615 0.534059 8.92763 C0.461299 9.19911 0.506229 9.48915 0.658079 9.72646 L2.1156 11.9999 L0.658069 14.2733 C0.506209 14.5106 0.461289 14.8007 0.534049 15.0722 C0.606809 15.3436 0.790399 15.5722 1.0404 15.702 L3.43981 16.9423 L3.31432 19.6395 C3.30114 19.9208 3.40709 20.1942 3.60631 20.3934 C3.80553 20.5936 4.07945 20.703 4.35973 20.6854 L7.05797 20.5595 L8.2982 22.9589 C8.42711 23.2089 8.65562 23.3934 8.92759 23.4657 C9.1981 23.536 9.48911 23.494 9.72593 23.3417 L11.9999 21.8837 L14.2737 23.3417 C14.4363 23.4462 14.6238 23.4999 14.8133 23.4999 C14.8997 23.4999 14.9871 23.4882 15.0721 23.4657 C15.344 23.3934 15.5725 23.2089 15.7014 22.9589 L16.9417 20.5595 L19.6394 20.6854 C19.9168 20.705 20.1951 20.5936 20.3933 20.3934 C20.5926 20.1942 20.698 19.9208 20.6853 19.6395 L20.5593 16.9423 L22.9588 15.702 C23.2088 15.5722 23.3933 15.3436 23.4656 15.0722 C23.5388 14.8007 23.4939 14.5106 23.3416 14.2733 L21.8836 11.9999 Z" />
                            <path fill="#FFFFFF" d="M17.207 9.70705 L11.207 15.707 C11.0117 15.9024 10.7558 16 10.5 16 C10.2441 16 9.98827 15.9024 9.79296 15.707 L 6.79296 12.707 C 6.40234 12.3164 6.40234 11.6836 6.79296 11.293 C 7.18358 10.9024 7.8164 10.9024 8.20702 11.293 L 10.5 13.586 L 15.793 8.29299 C 16.1836 7.90237 16.8164 7.90237 17.207 8.29299 C 17.5976 8.68361 17.5976 9.31643 17.207 9.70705 Z" />
                        </svg>
            `;
        const container = document.createElement('div');
        container.id = 'pwa-explore-container';
        container.style.cssText = checkIsMobile()?`padding-left: 2px; padding-right: 2px;margin-bottom: 0px`:
        `padding-left: 25px; padding-right: 25px;`;

        let html = `
            <div class="border-t border-neutral-light my-4 pt-4 w-full">
                <h3 class="text-sm font-bold text-neutral-dark mb-3 flex items-center">
                    <span class="mr-1">👥</span> 熱門迷友
                </h3>
                <div onwheel="event.preventDefault(); this.scrollLeft += event.deltaY;"
                style="
                    display: flex !important;
                    flex-direction: row !important;
                    gap: 16px !important;
                    overflow-x: auto !important;
                    width: 100% !important;
                    padding-bottom: 12px !important;
                    scrollbar-width: none;
                    cursor: grab;
                " class="no-scrollbar">
        `;

        const followSvg = (userID) => `
                    <svg class="miin-follow-icon inline-block ml-1 h-4 w-4 align-text-bottom" data-userid="${userID}" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg" style="cursor: pointer; width: 16px; height: 16px; margin-right: 5px; ">
                        <circle cx="12" cy="12" r="10" stroke="#10B981" stroke-width="2.5"></circle>
                        <path d="M12 8V16M8 12H16" stroke="#10B981" stroke-width="2.5" stroke-linecap="round"></path>
                    </svg>`;

        // 取消追蹤符號 (-)
        const unfollowSvg = (userID) => `
                    <svg class="miin-unfollow-icon inline-block ml-1 h-4 w-4 align-text-bottom"
                    data-userid="${userID}" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg" style="cursor: pointer; width: 16px; height: 16px; margin-right: 5px; ">
                        <circle cx="12" cy="12" r="10" stroke="#6B7280" stroke-width="2.5"></circle>
                        <path d="M8 12H16" stroke="#6B7280" stroke-width="2.5" stroke-linecap="round"></path>
                    </svg>`;

        const blockSvg = (userID) => `
                <svg class="miin-block-icon inline-block ml-1 h-4 w-4 align-text-bottom"
                     data-userid="${userID}"
                     viewBox="0 0 24 24"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg"
                     style="cursor: pointer; width: 16px; height: 16px; margin-right: 5px;">
                    <circle cx="12" cy="12" r="10" stroke="#EF4444" stroke-width="2.5"></circle>
                    <line x1="6" y1="6" x2="18" y2="18" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"></line>
                </svg>`;

        users.slice(0, 50).forEach((user) => {
            const userUrl = `https://miin.cc/user?userId=${user.userId}`;
            const avatarUrl = user.data.avatar.thumb || user.data.avatar.url || 'https://miin.cc/miin.png';
            harvestBadgesFromJson(user);

            const avatarBadgeSvg = user.data.badge === 'golden'
            ? goldenBadgeSvg
            : '';

            html += `
            <a href="${userUrl}" style="display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: flex-start !important; text-decoration: none !important; width: 68px !important; height: 85px !important; flex-shrink: 0 !important;" class="group">

                <div style="position: relative !important; width: 52px !important; height: 52px !important; flex-shrink: 0 !important;">

                    <img src="${avatarUrl}" style="box-sizing: border-box !important; width: 100% !important; height: 100% !important; border-radius: 50% !important; object-fit: cover !important; border: 2px solid ${linkcolor} !important;" class="group-hover:border-primary" />

                    ${avatarBadgeSvg ? `
                        <div style="position: absolute !important; bottom: -2px !important; right: -2px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; width: 22px !important; height: 22px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.15) !important;">
                            ${avatarBadgeSvg}
                        </div>
                    ` : ''}
                </div>

                <span style="display: block !important; width: 68px !important; height: 20px !important;
                   font-size: 13px !important; color: ${usercolor} !important; margin-top: 8px !important; overflow: hidden !important;
                   text-overflow: ellipsis !important; text-align: center !important;">${user.data.nickname}</span>
            </a>
        `;
        });

        html += `
                </div>

                <h3 class="text-sm font-bold text-neutral-dark my-4 flex items-center">
                    <span class="mr-1">🔥</span> 趨勢話題
                </h3>
                <div style="display: flex !important; flex-direction: row !important; flex-wrap: wrap !important;margin-top: 25px !important; gap: 10px !important; width: 100% !important;">
        `;

        hashtags.forEach((item) => {
            const cleanTag = item.tag.replace('#', '');
            const searchUrl = `https://miin.cc/hashtag/${encodeURIComponent(cleanTag)}`;

            html += `
                <a href="${searchUrl}" class="hover:bg-primary-light text-neutral-dark hover:text-primary transition-colors duration-150" style="display: inline-flex !important; align-items: center !important; flex-direction: row !important; white-space: nowrap !important; background-color: ${bgcolor} !important; padding: 6px 14px !important; border-radius: 9999px !important; font-size: 13px !important; text-decoration: none !important; border: 1px solid transparent !important; gap: 6px !important;">
                    <span style="font-size: 13px !important; color: ${linkcolor} !important; font-weight: bold !important;">#${cleanTag}</span>
                </a>
            `;
        });

        html += `
                </div>

                <h3 class="text-sm font-bold text-neutral-dark my-5 pt-2 flex items-center border-t border-neutral-light/50" style="margin-top: 25px !important;">
                    <span class="mr-1">📰</span> 最新迷音
                </h3>
                <div style="display: flex !important; flex-direction: column !important; margin-top: 25px !important;gap: 14px !important; width: 100% !important;">
        `;

        const storyPromises = stories.slice(0, 50)
        .map(async (story) => {
            const storyUrl = `https://miin.cc/story/${story.storyId}`;
            const coverImg = story.data.cover?.thumb || story.data.cover?.url || '';
            const authorName = story.data.author?.data?.nickname || '最新迷音';
            const authorId = story.data.author.userId;
            let relation;

            const reactionCount = story.data.reactions?.reduce((sum, r) => sum + (r.count || 0), 0) || 0;
            harvestBadgesFromJson(story.data.author);

            const quoteNode = await fetchQuoteNode(story.storyId);
            let pContent;
            if(quoteNode){
                if (Array.isArray(quoteNode.data?.title)) {
                    pContent = quoteNode.data.title.map(t => t.text).join('');
                } else {
                    pContent = quoteNode.data?.titleText || quoteNode.data?.title || quoteNode.data?.content || '[轉錄]';
                }
            }

            const cacheRaw = sessionStorage.getItem(`miin_user_${authorId}`);
            if (cacheRaw) {
                const userData = JSON.parse(cacheRaw);
                relation=userData.relation ;
            }
            let followActionSvg = '';
            if (authorId !== sessionStorage.getItem("miin_loginId")) { // 確保不顯示自己的追蹤按鈕
                followActionSvg = (relation === 'following') ? unfollowSvg(authorId) : followSvg(authorId);
            }

            let c = `${story.data.author.data.badge === 'golden' ? goldenBadgeSvg : ''}${followActionSvg}${blockSvg(authorId)}`;
            c = checkIsMobile()?`<span>${c}</span>`:c;

            return `
                <a href='${relation === 'blocking' ? "#' onclick='alert(\"已封鎖該帳號\"); return false;'" : storyUrl}' class="group" style="display: flex !important; flex-direction: row !important; justify-content: space-between !important; gap: 12px !important; text-decoration: none !important; padding: 12px !important; border-radius: 12px !important; background: ${bgcolor} !important; transition: background 0.15s;" onmouseover="this.style.background='#f2f2f7'" onmouseout="this.style.background='${bgcolor}'">
                    <div style="display: flex !important; flex-direction: column !important; justify-content: space-between !important; flex: 1 !important;">
                        <span style="font-weight: 500; color: ${usercolor};">${authorName} ${checkIsMobile()?"":c}<span style="font-size: 14px; color: #777; margin-left: 12px;">${timeSince(story.data.createAt * 1000)}</span></span>
                        ${checkIsMobile()?c:""}
                        <div style="font-size: ${fsnormal} !important; font-weight: 600 !important; color: ${fscolor} !important; line-height: 1.4 !important; display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important;">
                            ${story.data.title.replace(/\uFFFC/g, '') || '無標題貼文'}
                            ${pContent?`<div>[轉錄]${pContent.replace(/\uFFFC/g, '')}</div>`:""}
                        </div>
                        <div style='width: 100%;'>${coverImg ? "<img src='"+coverImg+"' style='width: 100%; max-height: 150px; object-fit: cover; object-position: top; border-radius: 12px !important;'> ":''}</div>
                        <div style="font-size: 13px !important; color: ${bgcolor2} !important; margin-top: 6px !important; display: flex !important; gap: 10px !important; align-items: center !important;">
                            ${story.data.commentCount ? `<span style="font-weight: 500; color: ${usercolor};">💬 ${story.data.commentCount}</span>` : ''}
                            ${reactionCount ? `<span style="font-weight: 500; color: ${usercolor};">👏 ${reactionCount}</span>` : ''}
                        </div>
                        <div class="py-2"></div>
                    </div>                   
                </a>
            `;
        });

        const storyHtmlArray = await Promise.all(storyPromises);
        html += storyHtmlArray.join('');

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
        unsafeWindow.MiinPWA.setScrollLocation(window.location.pathname);
        return container;
    }

    async function checkAndInjectStoryQuote() {
        if (window.location.pathname.indexOf('/story/') < 0){
            embeddedquote=false;
            return;
        }

        const mainContentTarget = document.querySelector('[class="py-2"]');

        if (mainContentTarget && !document.getElementById('pwa-injected-quote')) {
            const urlParts = window.location.pathname.split('/');
            const storyId = urlParts[urlParts.length - 1];

            if ((!storyId || isNaN(storyId)) && embeddedquote) return;

            const quoteNode=await fetchQuoteNode(storyId);

            if (quoteNode) {
                const node=createEmbeddedQuoteNode(quoteNode);
                if(node)mainContentTarget.appendChild(node);
            }

        }
    }

    function timeSince(dateInMilliseconds) {
        // 取得當前時間的毫秒數
        const now = Date.now();
        // 計算兩者之間的秒數差異
        const seconds = Math.floor((now - dateInMilliseconds) / 1000);

        let interval = seconds / 31536000; // 年
        if (interval > 1) return Math.floor(interval) + " 年前";

        interval = seconds / 2592000; // 月
        if (interval > 1) return Math.floor(interval) + " 個月前";

        interval = seconds / 86400; // 天
        if (interval > 1) return Math.floor(interval) + " 天前";

        interval = seconds / 3600; // 小時
        if (interval > 1) return Math.floor(interval) + " 小時前";

        interval = seconds / 60; // 分鐘
        if (interval > 1) return Math.floor(interval) + " 分鐘前";

        return Math.floor(seconds) + " 秒前";
    }

    //==============================

    function checkIsMobile() {
        const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
        const isMobileUA = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        return hasCoarsePointer || isMobileUA;
    }

    function createEmbeddedQuoteNode(parentStory) {
        if (document.getElementById('pwa-injected-quote')) return null;

        const parentStoryId = parentStory.storyId;
        if (!parentStoryId) return null;

        const parentStoryUrl = `https://miin.cc/story/${parentStoryId}`;
        const pAuthor = parentStory.data?.author?.data?.nickname || '原作者';
        const pUserUrl = `https://miin.cc/user?userId=${parentStory.data?.author?.userId}`;

        let pContent = '';
        if (Array.isArray(parentStory.data?.title)) {
            pContent = parentStory.data.title.map(t => t.text).join('');
        } else {
            pContent = parentStory.data?.titleText || parentStory.data?.title || parentStory.data?.content || '無內文';
        }

        const quoteLink = document.createElement('a');
        quoteLink.id = 'pwa-injected-quote';
        quoteLink.href = parentStoryUrl;

        quoteLink.style = `
            display: block !important;
            background-color: #f2f2f7 !important;
            border-left: 4px solid #5b5ee8 !important;
            padding: 14px 16px !important;
            margin: 16px 0 !important;
            border-radius: 8px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            text-decoration: none !important;
            transition: background-color 0.15s ease !important;
            cursor: pointer !important;
        `;

        quoteLink.onmouseover = function() { this.style.backgroundColor = '#e5e5ea'; };
        quoteLink.onmouseout = function() { this.style.backgroundColor = '#f2f2f7'; };

        quoteLink.innerHTML = `
            <div style="margin-bottom: 8px !important; display: flex !important; align-items: center !important; gap: 6px !important;">
                <span style="font-size: 11px !important; background: #5b5ee8 !important; color: #ffffff !important; padding: 2px 6px !important; border-radius: 4px !important; font-weight: bold !important;">[轉錄]</span>
                <span style="color: #5b5ee8 !important; font-weight: bold !important; font-size: 13px !important;" onclick="event.preventDefault(); event.stopPropagation(); window.location.href='${pUserUrl}';">@${pAuthor}</span>
            </div>
            <div style="color: #1a1a1a !important; font-size: 14px !important; line-height: 1.5 !important; white-space: pre-wrap !important; font-weight: 500 !important;">
                ${pContent}
            </div>
        `;

        return quoteLink;
    }

    async function fetchQuoteNode(storyId) {
        try {
            const res = await fetch(`https://api.miin.cc/mobile/story/v5/page?storyId=${storyId}&commentLimit=0&newsSourceLimit=0&socialSourceLimit=0&relatedStoryLimit=0&factSourceLimit=0&nationSourceLimit=0`);
            const resData = await res.json();

            const parentStory = resData?.parentStory || resData?.story?.parentStory;

            if (parentStory && parentStory.data) {
                console.log(`🎯 [PWA] 成功偵測到轉錄，指向原始文章: ${parentStory.storyId}`);
                embeddedquote = true;
                return parentStory;
            }
            return null;
        } catch (err) {
            console.error("❌ [PWA] 文章內頁轉錄失敗:", err);
            return null;
        }
    }

    //==========mainstory Quote story==========
    function isInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (rect.top <= (window.innerHeight || document.documentElement.clientHeight) + 200 && rect.bottom >= -200);
    }

    ['touchstart', 'wheel'].forEach(evt => {
        window.addEventListener(evt, () => {
            mainStory();
        }, {passive: true,capture: true});
    });

    function mainStory() {
        const path = location.pathname;
        if (!path.endsWith('trend')) return;

        const main = document.querySelector('main[class^="order-2"]');
        if (!main) return;

        const stories = main.querySelectorAll('a[href^="/story/"]:not([data-quote-fetched])');

        stories.forEach(story => {
            if (isInViewport(story)) {
                story.setAttribute('data-quote-fetched', '1');

                const urlParts = story.href.split('/');
                const storyId = urlParts[urlParts.length - 1];

                fetchQuoteNode(storyId).then(quoteNode => {
                    if (quoteNode) {
                        const between=story.querySelector('[class="relative flex items-center justify-between"]');
                        let pContent;
                        if(quoteNode){
                            if (Array.isArray(quoteNode.data?.title)) {
                                pContent = quoteNode.data.title.map(t => t.text).join('');
                            } else {
                                pContent = quoteNode.data?.titleText || quoteNode.data?.title || quoteNode.data?.content || '[轉錄]';
                            }
                        }
                        const p=document.createElement('div');
                        p.innerHTML='<div style="padding-left: 20px;">[轉錄]'+pContent.replace(/\uFFFC/g, '')+'</div>';
                        between.after(p);
                        console.log(`✅ [PWA] 加入轉錄: ${storyId}`);
                    }
                }).catch(err => {
                    console.error(`❌ [PWA] ${storyId} 抓取轉錄失敗:`, err);
                    story.removeAttribute('data-quote-fetched');
                });
            }
        });
    }

    const observer = new MutationObserver(() => {
        injectExploreContent();
        checkAndInjectStoryQuote();
    }).observe(document.body?document.body:document, { childList: true, subtree: true });
    //==============================

    //========ChatRoom========//
    // 🌟 核心：封裝 Chat API 請求器
    // 🌟 增加一個鎖，防止重複刷新
    let isRefreshing = false;
    let refreshQueue = []; // 用來存因為 Token 過期而失敗、等待重試的請求

    async function fetchChatAPI(endpoint, method = 'GET', body = null) {
        if (isRefreshing) {
            return new Promise((resolve) => {
                refreshQueue.push(() => resolve(fetchChatAPI(endpoint, method, body)));
            });
        }

        const token = getMiinToken();
        if (!token) return Promise.resolve(null);

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: method,
                url: `https://api.miin.cc/mobile/chat/v6/${endpoint}`,
                headers: {
                    "authorization": `Bearer ${token}`,
                    "accept": "application/json",
                    "x-request-id": generateUUID(),
                    "x-session-id": generateUUID(),
                    "x-accept-language": "zh-hant",
                    "x-user-agent": unsafeWindow.APP_CONFIG.USER_AGENT_STRING,
                    "user-agent": "okhttp/4.12.0",
                    "content-type": body ? "application/json; charset=UTF-8" : undefined
                },
                data: body ? JSON.stringify(body) : undefined,
                onload: (res) => {
                    if (res.status === 401) {
                        handle401Error(endpoint, method, body, resolve, reject);
                    } else if (res.status >= 200 && res.status < 300) {
                        resolve(JSON.parse(res.responseText));
                    } else {
                        reject(res.status);
                    }
                },
                onerror: reject
            });
        });
    }

    function handle401Error(endpoint, method, body, resolve, reject) {
        if (isRefreshing) {
            // 如果已經有人在刷新了，直接排隊
            refreshQueue.push(() => resolve(fetchChatAPI(endpoint, method, body)));
            return;
        }

        isRefreshing = true;
        console.warn("⚠️ Token 過期，準備重新抓取...");

        performAuthRefresh().then(() => {
            isRefreshing = false;
            // 執行佇列中的所有請求
            refreshQueue.forEach(cb => cb());
            refreshQueue = [];
        });
    }

    function performAuthRefresh(){
        return new Promise((resolve) => {
            let authFrame = document.createElement('iframe');
            authFrame.id = 'auth-refresh-frame';
            authFrame.style.display = 'none';
            document.body.appendChild(authFrame);

            console.log("偵測到需要進行背景驗證...");
            authFrame.src = '/feed/trend?t=' + Date.now();

            authFrame.onload = () => {
                console.log("背景驗證觸發完成。");
                // 🌟 當動作完成，呼叫 resolve() 告訴 .then() 可以繼續了
                resolve();
                setTimeout(() => {
                    document.body.removeChild(authFrame);
                }, 1000);
            };
        });
    }



    // 🌟 開放全域 API 供 UI 腳本呼叫
    unsafeWindow.miinChatAPI = {
        // 取得聯絡人列表
        getUserList: async (cursor = '') => {
            return await fetchChatAPI(`user:list?limit=50&cursor=${encodeURIComponent(cursor)}`);
        },
        // 搜尋聯絡人
        searchUsers: async (query) => {
            return await fetchChatAPI(`user:search?query=${encodeURIComponent(query)}&limit=50`);
        },
        // 取得聊天室歷史訊息
        getMessages: async (roomId, cursor = '') => {
            return await fetchChatAPI(`message:list?roomId=${roomId}&limit=50&cursor=${encodeURIComponent(cursor)}`);
        },
        sendMessage: async (roomId, text) => {
            const body = {
                "audio": null, "image": null, "miinlink": null,
                "roomId": roomId,
                "text": [{ "query": null, "text": text, "type": "plain", "url": null, "userId": null }],
                "type": "text", "video": null
            };
            // 確保這裡有 return，這樣發送成功後才能拿到伺服器回傳的真實訊息物件
            return await fetchChatAPI('message', 'POST', body);
        },
        getUploadUrl: async () => {
            return await fetchChatAPI('message/image:upload', 'POST', {
                "mimeType": "image/jpeg",
                "supportedProviders": ["GCS"]
            });
        },
        uploadToGCS: (file, uploadUrl, requiredHeaders) => {
            return new Promise((resolve, reject) => {
                const headers = {};
                requiredHeaders.forEach(h => headers[h.key] = h.value);
                GM_xmlhttpRequest({
                    method: 'PUT',
                    url: uploadUrl,
                    headers: headers,
                    data: file, // 直接傳送 File 物件
                    onload: (res) => {
                        if (res.status >= 200 && res.status < 300) resolve();
                        else reject(`上傳失敗 [${res.status}]: ${res.statusText}`);
                    },
                    onerror: reject
                });
            });
        },
        sendImageMessage: async (roomId, uploadKey, width, height) => {
            const body = {
                "audio": null,
                "image": {
                    "key": uploadKey,
                    "width": parseInt(width),
                    "height": parseInt(height)
                },
                "miinlink": null,
                "roomId": roomId,
                "text": null,
                "type": "image",
                "video": null
            };
            return await fetchChatAPI('message', 'POST', body);
        },
        getNotificationStatus: async () => {
            return await fetchChatAPI('bell', 'GET');
        },
        getRoomList: async (cursor = '') => {
            return await fetchChatAPI(`room:list?limit=50&cursor=${encodeURIComponent(cursor)}`);
        }
    };
    //chatroom
})();
