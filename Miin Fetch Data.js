// ==UserScript==
// @name         Miin Fetch Data
// @version      0.4.5
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

    // 覆寫 open 以便把 URL 存起來
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        // 將 URL 綁定到這個 XHR 實例上，讓稍後的 send 可以讀取
        this._requestUrl = url;
        return originalXhrOpen.apply(this, arguments);
    };

    // 覆寫 send 以便在請求發出時觸發我們的邏輯
    XMLHttpRequest.prototype.send = function(body) {
        const url = this._requestUrl;
        const token = getMiinToken();
        // 1. 偵測是否為請求使用者資料的 v2 API
        if (typeof url === 'string' && url.includes('/web/v2/user/page?userId=')) {
            try {
                // 2. 解析出 userId (處理相對路徑或絕對路徑)
                const urlObj = new URL(url.startsWith('http') ? url : window.location.origin + url);
                const userId = urlObj.searchParams.get('userId');

                if (userId) {
                    const v4Url = `https://api.miin.cc/mobile/v4/user/page?userId=${userId}&storyLimit=0`;
                    if (v4Url) {
                        fetchShadowMobileData(v4Url,token);
                        return originalXhrSend.apply(this, arguments);
                    }
                }

            } catch (e) {
                console.error('v4Url發生錯誤:', e);
            }
        }

        let mobileUrl = '';
        const urlObj = new URL(url.startsWith('http') ? url : window.location.origin + url);
        const storyId = urlObj.searchParams.get('storyId');

        // 取得原請求的分頁參數，若無則給預設值
        const cursor = urlObj.searchParams.get('cursor') || '';
        const limit = urlObj.searchParams.get('limit') || '30'; // 配合 v3 的 30 筆

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

        return originalXhrSend.apply(this, arguments);
    };

    function saveUserToCache(userId, dataObj) {
        if (!userId || !dataObj) return;
        const cacheKey = `miin_user_${userId}`;
        const userData = {
            badge: dataObj.badge || 'none',
            nickname: dataObj.nickname || '',
            username: dataObj.username || ''
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

    async function fetchShadowMobileData(Url,token) {

        try {
            // 注意：這裡必須使用 originalFetch，避免觸發自己的攔截器造成無限迴圈
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
                fetch("https://api.miin.cc/mobile/explore/v5/explore/user:list?limit=50&cursor=").then(res => res.json()),
                fetch("https://api.miin.cc/mobile/explore/v5/explore/hashtag:list?limit=15&cursor=").then(res => res.json()),
                fetch("https://api.miin.cc/mobile/explore/v5/explore/story:list?limit=50&cursor=").then(res => res.json())
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
        const goldenBadgeSvg=`<svg class="miin-custom-badge inline-block ml-1 h-4 w-4 align-text-bottom" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#FBBF24"/>
                <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
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

        users.slice(0, 50).forEach((user) => {
            const userUrl = `https://miin.cc/user?userId=${user.userId}`;
            const avatarUrl = user.data.avatar.thumb || user.data.avatar.url || 'https://miin.cc/miin.png';
            harvestBadgesFromJson(user, getMiinToken());

            // 🌟 關鍵 1：動態移除 SVG 裡面的 ml-1，讓它在圓圈內可以完美置中
            const avatarBadgeSvg = user.data.badge === 'golden'
                ? goldenBadgeSvg.replace('ml-1', '').replace('align-text-bottom', '')
                : '';

        html += `
            <a href="${userUrl}" style="display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: flex-start !important; text-decoration: none !important; width: 68px !important; height: 85px !important; flex-shrink: 0 !important;" class="group">

                <div style="position: relative !important; width: 52px !important; height: 52px !important; flex-shrink: 0 !important;">

                    <img src="${avatarUrl}" style="box-sizing: border-box !important; width: 100% !important; height: 100% !important; border-radius: 50% !important; object-fit: cover !important; border: 2px solid ${linkcolor} !important;" class="group-hover:border-primary" />

                    ${avatarBadgeSvg ? `
                        <div style="position: absolute !important; bottom: -2px !important; right: -2px !important; background: white !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; width: 22px !important; height: 22px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.15) !important;">
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

        const storyPromises = stories.slice(0, 50).map(async (story) => {
            const storyUrl = `https://miin.cc/story/${story.storyId}`;
            const coverImg = story.data.cover?.thumb || story.data.cover?.url || '';
            const authorName = story.data.author?.data?.nickname || '最新迷音';
            const reactionCount = story.data.reactions?.reduce((sum, r) => sum + (r.count || 0), 0) || 0;
            harvestBadgesFromJson(story.data.author,getMiinToken());

            const quoteNode = await fetchQuoteNode(story.storyId);
            let pContent;
            if(quoteNode){
                if (Array.isArray(quoteNode.data?.title)) {
                    pContent = quoteNode.data.title.map(t => t.text).join('');
                } else {
                    pContent = quoteNode.data?.titleText || quoteNode.data?.title || quoteNode.data?.content || '[轉錄]';
                }
            }

            return `
                <a href="${storyUrl}" class="group" style="height:350px;display: flex !important; flex-direction: row !important; justify-content: space-between !important; gap: 12px !important; text-decoration: none !important; padding: 12px !important; border-radius: 12px !important; background: ${bgcolor} !important; transition: background 0.15s;" onmouseover="this.style.background='#f2f2f7'" onmouseout="this.style.background='${bgcolor}'">
                    <div style="display: flex !important; flex-direction: column !important; justify-content: space-between !important; flex: 1 !important;">
                        <span style="font-weight: 500; color: ${usercolor};">${authorName}${story.data.author.data.badge === 'golden' ? goldenBadgeSvg : ''} <span style="font-size: 14px; color: #777; margin-left: 12px;">${timeSince(story.data.createAt * 1000)}</span></span>
                        <div style="font-size: ${fsnormal} !important; font-weight: 600 !important; color: ${fscolor} !important; line-height: 1.4 !important; display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important;">
                            ${story.data.title.replace(/\uFFFC/g, '') || '無標題貼文'}
                            ${pContent?`<div>[轉錄]${pContent.replace(/\uFFFC/g, '')}</div>`:""}
                        </div>
                        <div style='width: 100%;height: 150px;'>${coverImg ? "<img src='"+coverImg+"' style='width: 100%; max-height: 150px; object-fit: cover; object-position: top; border-radius: 12px !important;'> ":''}</div>
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
            console.error("❌ [PWA] 撈取文章內頁轉錄失敗:", err);
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
