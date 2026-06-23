// ==UserScript==
// @name   Miin PWA Gesture Adjustments
// @match  https://miin.cc/*
// @version   0.3.1.6
// @description  Miin PWA Gesture Adjustments
// @author       bixictn, Gemini, ChatGPT
// @grant  none
// @run-at    document-start
// @updateURL    https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20PWA%20Gesture%20Adjustments.js
// @downloadURL  https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20PWA%20Gesture%20Adjustments.js
// ==/UserScript==

(function () {
    'use strict';

    const TAG = "#pwa_guard";
    const SESSION_KEY = "pwa_guard_session_console.loged";

    let lastPath = location.pathname;
    let isDeployed = false;
    let closingByBack = false;
    let debug = true;
    let scrollHistory = {};
    let scale = 1;
    let handlescroll;

    const state = {
        isPageChange: false,
        isStartTouch: false
    };

    function log(...args) {
        if (debug) console.log(...args);
    }

    function checkIsMobile() {
        return (window.matchMedia("(pointer: coarse)").matches || /Mobi|Android|iPhone|iPad/i.test( navigator.userAgent) );
    }

    function firstDeploy() {

        if (!sessionStorage.getItem(SESSION_KEY)) {
            if (checkIsMobile()) {
                alert("加強返回鍵!!!");
            }
            sessionStorage.setItem( SESSION_KEY, "true" );
        }
        deployGuard();
    }

    function deployGuard() {

        if (location.pathname !== "/feed/trend")return;
        if (location.hash.includes(TAG))return;

        const baseState = history.state || {};
        log("🛡️ Deploy Guard");
        history.replaceState({...baseState,pwa: "base"}, "", "/feed/trend");
        history.pushState({...baseState,pwa: "guard"}, "", "/feed/trend" + TAG);

        isDeployed = true;
    }

    function toTop() {

        window.scrollTo({top: 0,behavior: "instant"});

        [0, 100, 200, 500].forEach(delay => {
            setTimeout(() => {
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            }, delay);
        });
    }

    window.addEventListener('popstate', (e) => {
        state.isTouch=false;
        if (e.state?.pwa === "base") {
            history.pushState({ ...(history.state || {}), pwa: "guard"}, "", location.pathname + TAG );

            if(getScrollY()<100){
                location.reload();
            }
            else{
                toTop();
            }

            return;
        }
        else{
            // 🌟 1. 如果是我們自己程式碼呼叫 history.back() 引起的 popstate，直接放行，不做任何畫面處理
            if (closingByBack) {//closeViewer() 已關閉且呼叫history.back(),解除unlockScroll();
                closingByBack = false; // 解鎖
                unlockScroll();
                e.stopImmediatePropagation();
                return;
            }

            // 🌟 2. 使用回上頁（此時 closingByBack 是 false）
            if (document.querySelector("#pwa-image-viewer")) {
                e.stopImmediatePropagation();
                closeViewer(true);//history.state已退回,不須history.back();
                return;
            }

            //<div class="fixed inset-0 bg-black/20 opacity-100" id="headlessui-dialog-overlay-:r3s:" aria-hidden="true" data-headlessui-state="open"></div>
            const closeTarget = document.querySelector('[id^="headlessui-dialog-overlay"]');
            if(closeTarget) {
                closeTarget.click();
                unlockScroll();
                e.stopImmediatePropagation();
                return;
            }

            if(state.isPageChange){
                setTimeout(()=>{
                    setScrollLocation(location.pathname);
                },300);

            }
            return;
        }
    }, true);

    ['touchstart', 'wheel'].forEach(evt => {
        window.addEventListener(evt, () => {
            state.isStartTouch = true;
            let myScrollHandler;
            if (handlescroll === undefined) {
                myScrollHandler = (e) => {
                    if(!scrollHistory[location.pathname])scrollHistory[location.pathname]=0;

                    if (state.isStartTouch) {
                        if(getScrollY() != 0 && scrollHistory[location.pathname] >= 0){
                            scrollHistory[location.pathname] = getScrollY();
                        }
                    }
                };

                document.addEventListener("scroll", myScrollHandler, true);
                handlescroll = myScrollHandler;
            }

            if (location.pathname === "/feed/trend" &&
                history.state?.pwa === undefined &&
                !isDeployed ) {
                firstDeploy();
            }
        }, {passive: true,capture: true});
    });

    window.addEventListener("mousemove", () => {
        state.isStartTouch = true;
    }, { passive: true, capture: true });

    function getScrollY() {
        return window.scrollY ||
            document.documentElement.scrollTop ;
    }

    function setScrollY(y) {
        window.scrollTo(0, y);
        document.documentElement.scrollTop = y;
        document.body.scrollTop = y;
    }

    const _pushState = history.pushState;

    history.pushState = function () {
        _pushState.apply(this, arguments);

        const isImageViewer = history.state?.imageViewer;
        if(isImageViewer) return;

        const currentPath = location.pathname;
        if (lastPath !== currentPath) {

            log("📄 Page Change",lastPath,"=>", currentPath );

            state.isPageChange = true;
            lastPath = currentPath;
        } else {
            state.isPageChange = false;
        }
        state.isTouch=false;
    };

    function setScrollLocation(currentPath){

        const savedPos =(typeof scrollHistory[currentPath] === undefined)? 0 : scrollHistory[currentPath];
        let targetY = savedPos ;

        log(`[Start] 準備捲動至: ${targetY} (Path: ${currentPath})`);

        let attempts = 0;
        const recoverScroll = setInterval(() => {
            setScrollY(targetY);
            attempts++;
            if (attempts > 30 || Math.abs(getScrollY() - savedPos) < 2) {
                clearInterval(recoverScroll);
            }
        }, 30);

        if(state.isPageChange)lastPath=currentPath;
    }

    function emojiPanel(){
        const hpb=document.querySelector('[id^="headlessui-popover-button"]');
        if(!hpb) return
        if(hpb.dataset.done)return;
        ['touchstart','touchmove', 'mouseenter','mousemove'].forEach(evt => {
            hpb.addEventListener(evt,e => {
                if(evt.indexOf('touch')>=0){
                    const propsKey = Object.keys(hpb)
                    .find(k => k.startsWith('__reactProps$'));

                    if (!propsKey) return;

                    hpb[propsKey].onMouseEnter({
                        target: hpb,
                        currentTarget: hpb
                    });
                }
                const btn = document.querySelector('[id^="headlessui-popover-panel"]');
                if (!btn) return;

                const img = btn.querySelector('img');

                if (!img) return;

                const propsKey = Object.keys(btn)
                .find(k => k.startsWith('__reactProps$'));

                if (!propsKey) return;

                btn[propsKey].onMouseEnter({
                    target: btn,
                    currentTarget: btn
                });

            }, true);
        });
    }

    function ExecuteButton() {
        const buttons = document.querySelectorAll('[class^="btn"]');
        buttons.forEach(btn => {
            if (btn.textContent.trim().indexOf('More')>=0 && location.pathname.indexOf('story')>0) {
                ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(evtType => {
                    const event = new MouseEvent(evtType, {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        buttons: evtType.includes('down') ? 1 : 0
                    });
                    btn.dispatchEvent(event);
                });

            }
        });
    }

    function fixLinks() {
        document.querySelectorAll?.('a[target="_blank"]').forEach(a => {
            try {
                const url = new URL(a.href, location.href);

                if (url.origin === location.origin) {
                    a.target = "_self";
                }
            } catch {}
        });
    };

    function lockScroll() {
        document.body.classList.add('viewer-scroll-locked');
    }

    function unlockScroll() {
        // 🌟 只有在使用者真的退出了 imageViewer 狀態時，才移除圖片鎖
        if (!history.state?.imageViewer) {
            document.body.classList.remove('viewer-scroll-locked');
            setScrollLocation(location.pathname);
        }
    }

    let overlay;

    //ESC關圖
    function escHandler(ev) {
        if (ev.key === "Escape"){

            if(history.state?.imageViewer) { closeViewer(); }
            else if(history.state?.commentAim) { clearCommentAim();}

        }
    }

    document.addEventListener( "keydown", escHandler );

    //關圖設定
    function closeViewer(fromBack = false) {
        unlockScroll();
        if(overlay)overlay.remove();
        if (!fromBack && history.state?.imageViewer) {
            closingByBack = true;
            history.back();
        }
    }

    document.addEventListener("click", e => {

        if(location.pathname.indexOf('story')<0) return;
        const thumb = e.target.closest('img[srcset*="/img/comment/"][sizes]');
        if (thumb){//留言圖點擊設定
            history.pushState({...(history.state || {}), imageViewer: true}, "");
            lockScroll()
            setTimeout(() => {
                document.querySelectorAll('img[srcset*="/img/comment/"]')
                    .forEach(img => {
                    if (img.hasAttribute("sizes")) return;

                    if (img.dataset.zoomReady) return;
                    img.dataset.zoomReady = "1";

                    setupImageZoom(img);
                    const observer = new MutationObserver((mutations, obs) => {
                        if (!document.body.contains(img)) {
                            if (history.state?.imageViewer) {
                                unlockScroll();
                                closingByBack = true;
                                history.back();
                            }
                            obs.disconnect();
                        }
                    });
                    observer.observe(document.body?document.body:document, { childList: true, subtree: true });
                });
            }, 100);
        }
        else{// 🌟 檢查點擊的是不是主文的大圖
            const img = e.target.closest("img");
            if (!img) return;
            if (img.srcset && img.srcset.includes("assets.miin.cc/img/story/")) {
                e.preventDefault();
                e.stopPropagation();

                // 🌟 1. 精準鎖定主文 article 區塊，撈出主文內所有的圖片
                const articleContainer = img.closest('article');
                if (!articleContainer) return;

                const allStoryImages = Array.from(articleContainer.querySelectorAll('figure img[srcset*="assets.miin.cc/img/story/"]'));

                // 🌟 2. 解析出所有大圖的真正網址
                const imageUrls = allStoryImages.map(el => el.srcset.split(",").pop().trim().split(" ")[0]);
                let currentIndex = allStoryImages.indexOf(img);
                if (currentIndex === -1) currentIndex = 0;

                log(`📸 成功打包相簿，共 ${imageUrls.length} 張照片，當前開啟第 ${currentIndex + 1} 張`);

                // 3. 建立全螢幕遮罩
                overlay = document.createElement("div");
                overlay.id = "pwa-image-viewer";
                overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,.95); z-index: 999999;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden; touch-action: none; user-select: none;
        `;

                // 4. 建立大圖節點
                const full = document.createElement("img");
                full.src = imageUrls[currentIndex];
                full.style.cssText = `
            max-width: 95vw; max-height: 95vh; object-fit: contain;
            -webkit-user-drag: none; cursor: grab; transition: transform 0.2s ease;
        `;
                full.addEventListener("click", e => e.stopPropagation());
                overlay.appendChild(full);

                // 🌟 5. 建立上方或中央的頁數提示（例如：3 / 5）
                const counter = document.createElement("div");
                counter.style.cssText = `
            position: absolute; top: 20px; color: white; background: rgba(0,0,0,0.6);
            padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; z-index: 1000001;
        `;
                const updateCounter = () => {
                    counter.innerText = `${currentIndex + 1} / ${imageUrls.length}`;
                };
                updateCounter();
                overlay.appendChild(counter);

                if (imageUrls.length > 1) {
                    const createBtn = (text, isLeft) => {
                        const btn = document.createElement("div");
                        btn.innerText = text;
                        btn.style.cssText = `
            position: absolute; top: 0; bottom: 0;
            ${isLeft ? 'left: 0;' : 'right: 0;'}
            width: 20%; max-width: 80px; display: flex; align-items: center;
            justify-content: center; color: rgba(255,255,255,0.7); font-size: 40px;
            cursor: pointer; z-index: 1000000; font-family: monospace;
            background: linear-gradient(${isLeft ? '90deg' : '270deg'}, rgba(0,0,0,0.2), transparent);
            transition: opacity 0.2s;
        `;
                        btn.addEventListener("click", (ev) => {
                            ev.stopPropagation(); // 防止點擊關閉視窗
                            navigateImage(isLeft);
                        });
                        return btn;
                    };

                    // 🌟 2. 抽出統一的換圖邏輯，方便點擊和滑動共同呼叫
                    const navigateImage = (isLeft) => {
                        if (isLeft) {
                            currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
                        } else {
                            currentIndex = (currentIndex + 1) % imageUrls.length;
                        }
                        full.src = imageUrls[currentIndex]; // 切換圖片
                        updateCounter(); // 更新頁數
                    };

                    overlay.appendChild(createBtn("‹", true));  // 左側點擊區
                    overlay.appendChild(createBtn("›", false)); // 右側點擊區

                    // 🌟 3. 新增手機版左右滑動手勢監聽 (綁在 overlay 上全螢幕皆可滑)
                    let touchStartX = 0;
                    let touchStartY = 0;

                    overlay.addEventListener('touchstart', (e) => {
                        // 只有單指操作，且圖片「沒有放大」時，才允許觸發滑動換圖
                        // (避免跟雙指縮放或放大後的圖片拖曳事件衝突)
                        if (e.touches.length === 1 && ( scale <= 1)) {
                            touchStartX = e.touches[0].clientX;
                            touchStartY = e.touches[0].clientY;
                        }
                    }, { passive: true });

                    overlay.addEventListener('touchend', (e) => {
                        if (touchStartX === 0) return;

                        const touchEndX = e.changedTouches[0].clientX;
                        const touchEndY = e.changedTouches[0].clientY;

                        const diffX = touchEndX - touchStartX;
                        const diffY = touchEndY - touchStartY;

                        // 🌟 判定門檻：水平滑動距離要大於 50 像素，且水平滑動幅度大於垂直（防止斜滑誤判）
                        if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
                            if (diffX > 0) {
                                // ➔ 向右滑，看上一張 (Left)
                                log("👉 手勢：向右滑動，切換至上一張");
                                navigateImage(true);
                            } else {
                                // 針左滑，看下一張 (Right)
                                log("👈 手勢：向左滑動，切換至下一張");
                                navigateImage(false);
                            }
                        }

                        // 重設座標
                        touchStartX = 0;
                        touchStartY = 0;
                    }, { passive: true });
                }

                // 7. 點擊圖片之外的空白背景處 ➔ 關閉
                overlay.addEventListener("click", e => {
                    if (e.target === overlay) closeViewer();
                });

                // 8. 塞進 Body、推送歷史紀錄狀態、綁定縮放
                document.body.appendChild(overlay);
                history.pushState({ ... (history.state || {}), imageViewer: true }, "");
                setupImageZoom(full, closeViewer);

            }
        }
    }, true);

    function setupImageZoom( img,closeViewer) {
        lockScroll();

        let pointX = 0;
        let pointY = 0;

        let startX = 0;
        let startY = 0;

        let initialDist = 0;

        let dragging = false;
        let touchMode = false;

        let lastTap = 0, touches=1;
        img.style.transformOrigin = "center center";

        function clampPosition() {
            const scaledWidth = img.offsetWidth * scale;
            const scaledHeight = img.offsetHeight * scale;
            const maxScrollX = Math.max(0, (scaledWidth - window.innerWidth ) / 2 );
            const maxScrollY = Math.max(0, (scaledHeight - window.innerHeight) / 2);

            pointX = Math.max(-maxScrollX, Math.min( maxScrollX, pointX ));
            pointY = Math.max(-maxScrollY, Math.min( maxScrollY, pointY ));
        }

        function updateTransform() {
            clampPosition();
            img.style.transform = `translate3d(${pointX}px,${pointY}px,0) scale(${scale})`;
        }

        img.addEventListener("touchstart", e => {
            touchMode = true;
            img.style.transition = "none";
            if ( e.touches.length === 1 ) {
                startX = e.touches[0].pageX - pointX;
                startY = e.touches[0].pageY - pointY;
            }
            else if ( e.touches.length === 2 ) {
                initialDist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY );
            }
        }, { passive:true });

        img.addEventListener( "touchmove", e => {
            if ( e.touches.length === 1 && scale > 1 ) {
                e.preventDefault();
                pointX = e.touches[0].pageX - startX;
                pointY = e.touches[0].pageY - startY;
                updateTransform();
            }
            else if ( e.touches.length === 2) {
                touches=2;
                e.preventDefault();
                const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX,
                                        e.touches[0].pageY - e.touches[1].pageY);
                scale *= dist / initialDist;
                scale = Math.max( 1, Math.min( 5, scale ) );
                initialDist = dist;
                updateTransform();
            }
        },{ passive:false });

        img.addEventListener("touchend",() => {
            const now = Date.now();

            if ( (now - lastTap < 300) && touches === 1) {
                if ( scale === 1 ) {
                    scale = 2;
                } else {
                    scale = 1;
                    pointX = 0;
                    pointY = 0;
                }
                updateTransform();
            }
            lastTap = now-(touches===2?500:0);

            if ( scale <= 1.05) {
                scale = 1;
                pointX = 0; pointY = 0;
                img.style.transition = "transform .25s ease";
                img.style.transform = "translate3d(0,0,0) scale(1)";
            }
            touches=1;
            setTimeout( () => { touchMode = false; }, 50);
        });

        img.addEventListener("wheel", e => {
            e.preventDefault();
            const rect = img.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const oldScale = scale;
            scale += e.deltaY > 0 ? -0.2: 0.2;
            scale = Math.max( 1, Math.min( 5, scale )	);

            const ratio = scale / oldScale;
            pointX -= ( mouseX - rect.width / 2	) * ( ratio - 1	);
            pointY -= ( mouseY - rect.height / 2) * ( ratio - 1	);
            updateTransform();
        },{ passive:false });

        img.addEventListener("pointerdown",	e => {
            if ( touchMode || scale <= 1) return;
            dragging = true;
            startX = e.clientX - pointX;
            startY = e.clientY - pointY;
            img.style.cursor = "grabbing";
            e.preventDefault();
        });

        img.addEventListener("pointermove",	e => {
            if ( touchMode || !dragging || scale <= 1) return;
            e.preventDefault();
            pointX =e.clientX - startX;
            pointY = e.clientY - startY;
            updateTransform();
        },	{ passive:false });

        const stopDrag = () => {
            dragging = false;
            img.style.cursor = "";
        };

        img.addEventListener( "pointerup", stopDrag	);
        img.addEventListener( "pointercancel",stopDrag);
        img.addEventListener("lostpointercapture",stopDrag);

        updateTransform();
    }

    function highlightBtn(){
        const clearBtn = document.getElementById('miin-aim-clear-btn');
        if(!clearBtn) return;

        // 撈出畫面上所有的留言外殼
        const usercolor = localStorage.getItem('miin_usercolor') || '#D7BE41';
        const comments = document.querySelectorAll('.group.flex.gap-2');

        comments.forEach(comment => {
            // 找到頭像圖片
            const avatarImg = comment.querySelector('.shrink-0 img');
            if (!avatarImg || avatarImg.dataset.aimBound === 'true') return;

            // 找到該則留言的 User ID 連結（用來抓 Href）
            const userLink = comment.querySelector('a.link.font-bold');
            if (!userLink) return;

            const userHref = userLink.getAttribute('href');
            avatarImg.title = `🎯 點擊鎖定與 ${userLink.textContent.trim()} 相關的對話`;

            // 🌟 點擊頭像直接觸發過濾
            avatarImg.onclick = (e) => {
                // 阻擋原生可能造成的跳轉或 React 事件打架
                e.preventDefault();
                e.stopPropagation();

                // 🌟 核心修改：判斷是否已經處於被鎖定狀態（如果自己帶有金框，代表再點一次要消掉）
                if (avatarImg.style.boxShadow.includes('8px')) {
                    log("🎯 偵測到再次點擊相同目標，執行解鎖");
                    clearBtn.click(); // 直接模擬點擊清除鈕，走標準還原與 history.back() 流程
                    return;
                }

                log(`🎯 頭像鎖定目標 User Href: ${userHref}`);
                if (!history.state?.commentAim) {
                    history.pushState({ ... (history.state || {}), commentAim: true }, "");
                }

                // 再次撈出所有留言進行過濾
                const allComments = document.querySelectorAll('.group.flex.gap-2');

                allComments.forEach(c => {
                    c.style.transition = 'opacity 0.2s';

                    const hasMention = c.querySelector(`a[href="${userHref}"]`);
                    const isAuthor = c.querySelector(`a.link.font-bold[href="${userHref}"]`);
                    const targetImg = c.querySelector('.shrink-0 img');

                    if (hasMention || isAuthor) {
                        c.style.opacity = '1';
                        // 幫被鎖定的使用者頭像加上一個金色發光圈，方便識別是鎖定誰
                        if (isAuthor && targetImg) {
                            targetImg.style.boxShadow = '0 0 8px ' + usercolor;
                        }
                    } else {
                        c.style.opacity = '0.2';
                        if (targetImg) targetImg.style.boxShadow = '';
                    }
                });

                // 顯示頂部的清除按鈕
                clearBtn.style.display = 'block';
            };

            // 標記已綁定，避免重複綁定
            avatarImg.dataset.aimBound = 'true';
        });
    }

    let closingAimByBack = false;
    //關閉醒目留言
    function clearCommentAim(fromBack = false) {
        document.querySelectorAll('.group.flex.gap-2').forEach(comment => {
            comment.style.opacity = '1';
            const img = comment.querySelector('.shrink-0 img');
            if (img) img.style.boxShadow = '';
        });
        const clearBtn = document.getElementById('miin-aim-clear-btn');
        if (clearBtn) clearBtn.style.display = 'none';

        if (!fromBack && history.state?.commentAim) {
            closingAimByBack = true;
            history.back();
        }
    }

    const initAimController = () => {
        const clearBtn = document.getElementById('miin-aim-clear-btn');
        if (!clearBtn || clearBtn.dataset.init === 'true') return;

        clearBtn.onclick = () => clearCommentAim(false);

        window.addEventListener('popstate', (e) => {
            if (closingAimByBack) {
                e.stopImmediatePropagation();
                closingAimByBack = false;
                return;
            }

            const btn = document.getElementById('miin-aim-clear-btn');
            if (!e.state?.commentAim && btn && btn.style.display === 'block') {
                e.stopImmediatePropagation();
                clearCommentAim(true);
                return;
            }
        }, true);

        clearBtn.dataset.init = 'true';
    };

    const observer = new MutationObserver(() => {
        ExecuteButton();
        emojiPanel();
        fixLinks();
        highlightBtn();
        initAimController();
    }).observe(document.body?document.body:document, {
        childList: true,
        subtree: true
    });
})();
