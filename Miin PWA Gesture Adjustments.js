// ==UserScript==
// @name   Miin PWA Gesture Adjustments
// @match  https://miin.cc/*
// @version   0.2.8.1
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
    let debug = true;
    let scrollHistory = {},targetScrollY = 0;

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
            if (document.querySelector("#pwa-image-viewer")){
                closeViewer(true);
                return;
            }
			
            if(!e.state?.imageViewer) {
                //<div class="fixed inset-0 bg-black/20 opacity-100" id="headlessui-dialog-overlay-:r3s:" aria-hidden="true" data-headlessui-state="open"></div>
                const closeTarget = document.querySelector('[id^="headlessui-dialog-overlay"]');
                closeTarget.click();
                return;
            }
			
            if(state.isPageChange){
                setScrollLocation(location.pathname);
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

            document.addEventListener("scroll", e => {
                if (state.isStartTouch) {
                    scrollHistory[window.location.pathname] = getScrollY();
                }
            }, true);
            sessionStorage.setItem( SESSION_KEY, "true" );
        }

        deployGuard();
    }

    ['touchstart', 'wheel'].forEach(evt => {
        window.addEventListener(evt, () => {
            state.isStartTouch = true;

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
        //選擇emoji時不消失
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

    function unlockScroll() {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";

        document.body.style.touchAction = "";
        document.documentElement.style.touchAction = "";

        document.body.style.overscrollBehavior = "";
        document.documentElement.style.overscrollBehavior = "";
    }

    let closingByBack = false;
    let overlay;

    function escHandler(ev) {
        if (ev.key === "Escape") { closeViewer(); }
    }
    document.addEventListener( "keydown", escHandler );

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
        if (thumb){
            history.pushState({...(history.state || {}), imageViewer: true}, "");
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
                                history.back(); // 點旁邊消失了，自動把網址退回上一頁
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
            if ( img.srcset && img.srcset.includes("assets.miin.cc/img/story/")) {
                const srcset = img.srcset;

                e.preventDefault();
                e.stopPropagation();

                const url = srcset.split(",").pop().trim().split(" ")[0];
                overlay = document.createElement("div");

                overlay.style.cssText = `
					 position:fixed;
					 inset:0;
					 background:rgba(0,0,0,.95);
					 z-index:999999;

					 display:flex;
					 align-items:center;
					 justify-content:center;

					 overflow:hidden;
					 touch-action:none;
					`;

                const full = document.createElement("img");

                full.src = url;

                full.style.cssText = `
					 max-width:95vw;
					 max-height:95vh;
					 object-fit:contain;

					 user-select:none;
					 -webkit-user-drag:none;

					 cursor:grab;
					`;

                full.addEventListener( "click", e => e.stopPropagation());

                overlay.addEventListener( "click", e => {
                    if (e.target !== overlay) return;
                    closeViewer();
                });

                overlay.appendChild(full);
                overlay.id = "pwa-image-viewer";
                document.body.appendChild( overlay );
                history.pushState({...(history.state || {}), imageViewer: true}, "");
                setupImageZoom( full, closeViewer );
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

        function lockScroll() {
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
            document.body.style.touchAction = "none";
            document.documentElement.style.touchAction = "none";
            document.body.style.overscrollBehavior = "none";
            document.documentElement.style.overscrollBehavior = "none";
        }      

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
            if (scale > 1) {
                lockScroll();
            }
            else {
                unlockScroll();
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
                unlockScroll();
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
