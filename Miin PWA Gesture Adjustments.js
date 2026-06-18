// ==UserScript==
// @name   Miin PWA Gesture Adjustments
// @match  https://miin.cc/*
// @version   0.2.8
// @description  Miin PWA Gesture Adjustments
// @author       bixictn, Gemini, Chatgpt
// @grant  none
// @run-at    document-start
// ==/UserScript==

(function () {
    'use strict';

    const TAG = "#pwa_guard";
    const SESSION_KEY = "pwa_guard_session_console.loged";

    let lastPath = location.pathname;
    let isDeployed = false;
    let debug = true;

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

            if(document.body.scrollTop<100){
                location.reload();
            }
            else{
                toTop();
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

    const _pushState = history.pushState;

    history.pushState = function () {
        _pushState.apply(this, arguments);
        const currentPath = location.pathname;
        if (lastPath !== currentPath) {

            log(
                "📄 Page Change",
                lastPath,
                "=>",
                currentPath
            );

            state.isPageChange = true;
            lastPath = currentPath;
        } else {
            state.isPageChange = false;
        }
    };

    document.addEventListener("click", e => {
        const a = e.target.closest("a");
        if (!a) return;
        const url = new URL(a.href);
        if (url.origin === location.origin) {
            e.preventDefault();
            location.href = url.href;
        }
    }, true);

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

    document.addEventListener("click", e => {
        const img = e.target.closest("img");
        if (!img) return;
        if ( img.srcset && img.srcset.includes("assets.miin.cc/img/story/")) {

            const srcset = img.srcset;

            e.preventDefault();
            e.stopPropagation();

            const url = srcset.split(",").pop().trim().split(" ")[0];
            const overlay = document.createElement("div");

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

            function unlockScroll() {
                document.body.style.overflow = "";
                document.documentElement.style.overflow = "";

                document.body.style.touchAction = "";
                document.documentElement.style.touchAction = "";

                document.body.style.overscrollBehavior = "";
                document.documentElement.style.overscrollBehavior = "";
            }

            function closeViewer() {
                unlockScroll();
                document.removeEventListener( "keydown", escHandler);
                overlay.remove();
            }

            function escHandler(ev) {
                if (ev.key === "Escape") { closeViewer(); }
            }

            document.addEventListener( "keydown", escHandler );

            full.addEventListener( "click", e => e.stopPropagation());

            overlay.addEventListener( "click", e => {
                if (e.target !== overlay) return;
                closeViewer();
            });

            overlay.appendChild(full);

            document.body.appendChild( overlay );

            setupImageZoom( full, closeViewer );
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

        function unlockScroll() {
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
            document.body.style.touchAction = "";
            document.documentElement.style.touchAction = "";
            document.body.style.overscrollBehavior = "";
            document.documentElement.style.overscrollBehavior = "";
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
                touches=1;
                startX = e.touches[0].pageX - pointX;
                startY = e.touches[0].pageY - pointY;
            }
            else if ( e.touches.length === 2 ) {
                touches=2;
                initialDist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY );
            }
        }, { passive:true });

        img.addEventListener( "touchmove", e => {
            if ( e.touches.length === 1 && scale > 1 ) {
                touches=1;
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
            lastTap = now;

            if ( scale <= 1.05) {
                scale = 1;
                pointX = 0; pointY = 0;
                img.style.transition = "transform .25s ease";
                img.style.transform = "translate3d(0,0,0) scale(1)";
                unlockScroll();
            }

            setTimeout( () => { touchMode = false; }, 50);	});

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

    document.addEventListener("click", e => {

        const thumb = e.target.closest('img[srcset*="/img/comment/"][sizes]');

        if (!thumb) return;
        setTimeout(() => {
            document.querySelectorAll('img[srcset*="/img/comment/"]')
                .forEach(img => {
                if (img.hasAttribute("sizes")) return;

                if (img.dataset.zoomReady) return;
                img.dataset.zoomReady = "1";
                setupImageZoom(img);
            });
        }, 100);
    }, true);

    const observer = new MutationObserver(() => {
        ExecuteButton();
        emojiPanel();
    }).observe(document, {
        childList: true,
        subtree: true
    });
})();
