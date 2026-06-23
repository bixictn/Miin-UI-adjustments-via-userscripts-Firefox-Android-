// ==UserScript==
// @name         Miin Fetch Data
// @version      0.2.2
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
    let fetchdata=false;
    const fsnormal=localStorage.getItem('miin_fs') || 16,
          fscolor=localStorage.getItem('miin_fscolor') || '#6AAFD8',
          usercolor=localStorage.getItem('miin_usercolor') || '#D7BE41',
          linkcolor=localStorage.getItem('miin_linkcolor') ||'#8BC4E6',
          bgcolor=localStorage.getItem('miin_bgcolor') ||'#2C2C2C',
          bgcolor2=localStorage.getItem('miin_bgcolor2') ||'#111111',
          bubblecolor=localStorage.getItem('miin_bubblecolor') ||'#5F7B84';

    function injectExploreContent() {
        const search = window.location.href;
        if (!search.endsWith('search')) {
            fetchdata=false
            return;
        }

        const targetForm = document.querySelector('div.card-full form.p-8');
        if (targetForm && !document.getElementById('pwa-explore-container') && !fetchdata) {

            console.log("🎯 [PWA] 偵測到搜尋區塊，正在同步迷友與最新迷音...");
            fetchdata=true;
            Promise.all([
                fetch("https://api.miin.cc/mobile/explore/v5/explore/user:list?limit=50&cursor=").then(res => res.json()),
                fetch("https://api.miin.cc/mobile/explore/v5/explore/hashtag:list?limit=15&cursor=").then(res => res.json()),
                fetch("https://api.miin.cc/mobile/explore/v5/explore/story:list?limit=50&cursor=").then(res => res.json())
            ])
                .then(([userData, tagData, storyData]) => {
                if (userData?.users && tagData?.hashtags && storyData?.stories) {
                    const exploreNode = createExploreContainer(userData.users, tagData.hashtags, storyData.stories);
                    if (exploreNode) {
                        targetForm.insertAdjacentElement('afterend', exploreNode);
                        console.log("✅ [PWA] 迷友橫滑 ＋ 最新迷音 成功！");

                    }
                }
            })
                .catch(err => {console.error("❌ [PWA] 撈取資料失敗:", err);fetchdata=false;});
        }
    }

    function createExploreContainer(users, hashtags, stories) {
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
                    cursor: grab; /* 🌟 提示滑鼠可以抓取/滾動的視覺體感 */
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

        // 渲染 Hashtag
        hashtags.forEach((item) => {
            const cleanTag = item.tag.replace('#', '');
            const searchUrl = `https://miin.cc/search?query=${encodeURIComponent(cleanTag)}`;

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

        // 🌟 正名並解鎖全量放行 .slice(0, 50)，讓 50 篇最新迷音一路鋪下去
        stories.slice(0, 50).forEach((story) => {
            const storyUrl = `https://miin.cc/story/${story.storyId}`;
            const coverImg = story.data.cover?.thumb || story.data.cover?.url || '';
            const authorName = story.data.author?.data?.nickname || '最新迷音';
            const reactionCount = story.data.reactions?.reduce((sum, r) => sum + (r.count || 0), 0) || 0;

            html += `
                <a href="${storyUrl}" class="group" style="display: flex !important; flex-direction: row !important; justify-content: space-between !important; gap: 12px !important; text-decoration: none !important; padding: 12px !important; border-radius: 12px !important; background: ${bgcolor} !important; transition: background 0.15s;" onmouseover="this.style.background='#f2f2f7'" onmouseout="this.style.background='${bgcolor}'">
                    <div style="display: flex !important; flex-direction: column !important; justify-content: space-between !important; flex: 1 !important;">
                        <div style="font-size: ${fsnormal} !important; font-weight: 600 !important; color: ${fscolor} !important; line-height: 1.4 !important; display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important;">
                            ${story.data.title || '無標題貼文'}
                        </div>
                        <div style="font-size: 13px !important; color: ${bgcolor2} !important; margin-top: 6px !important; display: flex !important; gap: 10px !important; align-items: center !important;">
                            <span style="font-weight: 500; color: ${usercolor};">${authorName}</span>
                            ${story.data.commentCount ? `<span style="font-weight: 500; color: ${usercolor};">💬 ${story.data.commentCount}</span>` : ''}
                            ${reactionCount ? `<span style="font-weight: 500; color: ${usercolor};">👏 ${reactionCount}</span>` : ''}
                        </div>
                    </div>
                    ${coverImg ? `
                        <img src="${coverImg}" style="width: 64px !important; height: 64px !important; border-radius: 8px !important; object-fit: cover !important; background: #eee !important;" />
                    ` : ''}
                </a>
            `;
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
        return container;
    }

    function checkIsMobile() {
        const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
        const isMobileUA = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        return hasCoarsePointer || isMobileUA;
    }

    const observer = new MutationObserver(() => {
        injectExploreContent();
    }).observe(document.body?document.body:document, { childList: true, subtree: true });

    setTimeout(injectExploreContent, 1000);
})();
