// ==UserScript==
// @name   Miin PWA Gesture Adjustments
// @match  https://miin.cc/*
// @version   0.3.0
// @description  Miin PWA Gesture Adjustments
// @author       bixictn, Gemini, Chatgpt
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
    let scrollHistory = {},targetScrollY = 0;

    let handlescroll;

    const state = {
        isPageChange: false,
        isStartTouch: false
    };

    function log(...args) {
        if (debug) console.log(...args);
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
            if (closingByBack) {
                closingByBack = false; // 解鎖
                e.stopImmediatePropagation();
                return;
            }

            // 🌟 2. 如果是使用者手動按返回鍵（此時 closingByBack 是 false）
            if (document.querySelector("#pwa-image-viewer")) {
                closeViewer(true); // 傳入 true 告訴它：不要再 back 了！
                e.stopImmediatePropagation();
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

    ['touchstart', 'wheel'].forEach(evt => {
        window.addEventListener(evt, () => {
            state.isStartTouch = true;
            let myScrollHandler;

            if (handlescroll === undefined) {

                myScrollHandler = (e) => {
                    if(!scrollHistory[location.pathname])scrollHistory[location.pathname]=0;

                    if (state.isStartTouch) {
                        if (scrollHistory[location.pathname] - getScrollY() < 100) {
                            scrollHistory[location.pathname] = getScrollY();
                        }

                    }
                };

                document.addEventListener("scroll", myScrollHandler, true);
                handlescroll = myScrollHandler;
            }

            if (
                location.pathname === "/feed/trend" &&
                history.state?.pwa === undefined &&
                !isDeployed
            ) {
                firstDeploy();
            }
        }, {passive: true,capture: true});
    });

    window.addEventListener("mousemove", () => {
        state.isStartTouch = true;
    }, { passive: true, capture: true });

    function getScrollY() {
        return window.scrollY ||
            document.documentElement.scrollTop ||
            document.body.scrollTop ||
            0;
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

        const savedPos = scrollHistory[currentPath];

        const targetY = (state.isPageChange) ? savedPos : 0;

        log(`[Start] 準備捲動至: ${targetY} (Path: ${currentPath})`);

        targetScrollY = getScrollY();
        let attempts = 0;
        const recoverScroll = setInterval(() => {
            setScrollY(targetY);
            attempts++;

            if (attempts > 30 || Math.abs(getScrollY() - savedPos) < 2) {
                clearInterval(recoverScroll);
            }
        }, 30);
        lastPath=currentPath;
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
            if (btn.textContent.trim().indexOf('More')>=0) {
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
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.body.style.touchAction = "none";
        document.documentElement.style.touchAction = "none";
        document.body.style.overscrollBehavior = "none";
        document.documentElement.style.overscrollBehavior = "none";
    }

    function unlockScroll() {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";

        document.body.style.touchAction = "";
        document.documentElement.style.touchAction = "";

        document.body.style.overscrollBehavior = "";
        document.documentElement.style.overscrollBehavior = "";
    }


    let overlay;

    function escHandler(ev) {
        if (ev.key === "Escape") { closeViewer(); }
    }
    document.addEventListener( "keydown", escHandler );

    function closeViewer(fromBack = false) {
        state.isStartTouch=false;
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
        if (thumb){
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
                    observer.observe(document.body, { childList: true, subtree: true });
                });
            }, 100);
        }
        else{
            const img = e.target.closest("img");
            if (!img) return;

            // 🌟 檢查點擊的是不是主文的貓咪大圖
            if (img.srcset && img.srcset.includes("assets.miin.cc/img/story/")) {
                e.preventDefault();
                e.stopPropagation();

                // 🌟 1. 精準鎖定主文 article 區塊，撈出主文內所有的 5 張貓咪圖片
                const articleContainer = img.closest('article');
                if (!articleContainer) return;

                const allStoryImages = Array.from(articleContainer.querySelectorAll('figure img[srcset*="assets.miin.cc/img/story/"]'));

                // 🌟 2. 解析出所有大圖的真正網址 (拿 1920w 的最清晰版本)
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

                // 🌟 6. 多圖時，產生左右切換按鈕（手機版可以直接點邊邊切換，非常方便）
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
                            if (isLeft) {
                                currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
                            } else {
                                currentIndex = (currentIndex + 1) % imageUrls.length;
                            }
                            full.src = imageUrls[currentIndex]; // 切換圖片
                            updateCounter(); // 更新頁數
                        });
                        return btn;
                    };

                    overlay.appendChild(createBtn("‹", true));  // 左側點擊區
                    overlay.appendChild(createBtn("›", false)); // 右側點擊區
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

        let scale = 1;

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
            if (scale >= 1) {
                lockScroll();
            } else {
                // 🌟 只有在「不是」剛開圖的狀態下才解鎖
                if (!history.state?.imageViewer) {
                    unlockScroll();
                }
            }
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

    const observer = new MutationObserver(() => {
        ExecuteButton();
        emojiPanel();
        fixLinks(document);
    }).observe(document, {
        childList: true,
        subtree: true
    });
})();
