// ==UserScript==
// @name         Miin Fetch Data
// @version      0.4.2.1
// @description  Miin Fetch Data
// @match        https://miin.cc/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      api.miin.cc
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20Fetch%20Data.js
// @downloadURL  https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20Fetch%20Data.js
// ==/UserScript==

(function() {
    'use strict';

    unsafeWindow.APP_CONFIG = {
        VERSION: "4.9.11",
        USER_AGENT_STRING: "Miin/Android-4.9.11"
    };

    let fetchdata=false,embeddedquote=false;
    const fsnormal=localStorage.getItem('miin_fs') || 16,
          fscolor=localStorage.getItem('miin_fscolor') || '#6AAFD8',
          usercolor=localStorage.getItem('miin_usercolor') || '#D7BE41',
          linkcolor=localStorage.getItem('miin_linkcolor') ||'#8BC4E6',
          bgcolor=localStorage.getItem('miin_bgcolor') ||'#2C2C2C',
          bgcolor2=localStorage.getItem('miin_bgcolor2') ||'#111111',
          bubblecolor=localStorage.getItem('miin_bubblecolor') ||'#5F7B84';

    unsafeWindow.validToken = null;

    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {

        if (header.toLowerCase() === 'authorization' && value.startsWith('Bearer ')) {
            const tokenInHeader = value.replace('Bearer ', '');

            // 只要經過的 Token 跟我們手上的不一樣，就代表網站換發了新 Token，立刻更新！
            if (unsafeWindow.validToken !== tokenInHeader) {
                unsafeWindow.validToken = tokenInHeader;
                localStorage.setItem('miin_valid_token', tokenInHeader);
                console.log("🎯 [XHR 攔截器] 抓到最新 Token 並已儲存至 LocalStorage！");
            }
        }

        return originalSetRequestHeader.apply(this, arguments);
    };


    // 🌟 共用工具：產生模擬 App 的 UUID
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getMiinToken() {
        return unsafeWindow.validToken || localStorage.getItem('miin_valid_token')
    }

    //==========Profile data==========
    // 🌟 API：取得使用者個人資料
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

            html += `
                <a href="${userUrl}" style="display: flex !important; flex-direction: column !important; align-items: center !important; text-decoration: none !important; min-width: 64px !important;" class="group">
                    <div style="position: relative !important;">
                        <img src="${avatarUrl}" style="width: 52px !important; height: 52px !important; border-radius: 50% !important; object-fit: cover !important; border: 2px solid ${linkcolor} !important;" class="group-hover:border-primary" />
                        ${user.data.badge === 'golden' ? `<span style="position: absolute !important; bottom: -2px !important; right: -2px !important; background: #ffcc00 !important; border-radius: 50% !important; width: 16px !important; height: 16px !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 10px !important; border: 1.5px solid #ffffff !important;">⚡</span>` : ''}
                    </div>
                    <span style="font-size: 13px !important; color: ${usercolor} !important; margin-top: 25px !important; max-width: 64px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; text-align: center !important;">${user.data.nickname}</span>
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
                <a href="${storyUrl}" class="group" style="display: flex !important; flex-direction: row !important; justify-content: space-between !important; gap: 12px !important; text-decoration: none !important; padding: 12px !important; border-radius: 12px !important; background: ${bgcolor} !important; transition: background 0.15s;" onmouseover="this.style.background='#f2f2f7'" onmouseout="this.style.background='${bgcolor}'">
                    <div style="display: flex !important; flex-direction: column !important; justify-content: space-between !important; flex: 1 !important;">
                        <div style="font-size: ${fsnormal} !important; font-weight: 600 !important; color: ${fscolor} !important; line-height: 1.4 !important; display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important;">
                            ${story.data.title || '無標題貼文'}
                            ${pContent?`<div>[轉錄]${pContent.replace(/\uFFFC/g, '')}</div>`:""}
                        </div>
                        <div style="font-size: 13px !important; color: ${bgcolor2} !important; margin-top: 6px !important; display: flex !important; gap: 10px !important; align-items: center !important;">
                            <span style="font-weight: 500; color: ${usercolor};">${authorName}</span>
                            ${story.data.commentCount ? `<span style="font-weight: 500; color: ${usercolor};">💬 ${story.data.commentCount}</span>` : ''}
                            ${reactionCount ? `<span style="font-weight: 500; color: ${usercolor};">👏 ${reactionCount}</span>` : ''}
                        </div>
                        <div class="py-2"></div>
                    </div>
                    ${coverImg ? `
                        <img src="${coverImg}" style="width: 64px !important; height: 64px !important; border-radius: 8px !important; object-fit: cover !important; background: #eee !important;" />
                    ` : ''}
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
    let authFrame;
    function fetchChatAPI(endpoint, method = 'GET', body = null) {
        const token = getMiinToken();
        if (!token) {
            console.error("等待抓取Token");
            if(!authFrame){
                authFrame = document.createElement('iframe');
                authFrame.id = 'auth-refresh-frame';
                authFrame.style.display = 'none';
                document.body.appendChild(authFrame);

                // 執行背景驗證的邏輯
                function performAuthRefresh() {
                    console.log("偵測到需要進行背景驗證...");

                    authFrame.src = '/feed/trend?t=' + Date.now(); // 加上時間戳記防止快取

                    authFrame.onload = () => {
                        console.log("背景驗證觸發完成。");
                        setTimeout(() => {
                            authFrame.remove();
                        }, 3000);
                    };
                }
                performAuthRefresh();
            }
            return Promise.resolve(null);
        }

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
                    if (res.status >= 200 && res.status < 300) {
                        resolve(JSON.parse(res.responseText));
                    } else {
                        console.error(`❌ Chat API 錯誤 [${res.status}]:`, res.responseText);
                        reject(res.status);
                    }
                },
                onerror: reject
            });
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
