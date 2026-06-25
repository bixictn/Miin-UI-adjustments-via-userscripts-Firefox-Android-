// ==UserScript==
// @name         Miin UI Adjustments
// @namespace    http://tampermonkey.net/
// @version      0.3.1.7
// @description  Miin UI Adjustments
// @author       bixictn, Gemini, ChatGPT
// @match        https://miin.cc/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20UI%20Adjustments.js
// @downloadURL  https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20UI%20Adjustments.js
// ==/UserScript==


(function() {
    'use strict';
    const path = window.location.pathname;
    const isMobile = checkIsMobile();
    let fsnormal=localStorage.getItem('miin_fs') || 16;
    let fscolor=localStorage.getItem('miin_fscolor') || '#6AAFD8',
        usercolor=localStorage.getItem('miin_usercolor') || '#D7BE41',
        linkcolor=localStorage.getItem('miin_linkcolor') ||'#8BC4E6',
        bgcolor=localStorage.getItem('miin_bgcolor') ||'#2C2C2C' ,
        bgcolor2=localStorage.getItem('miin_bgcolor2') ||'#111111';
    let footercolor=localStorage.getItem('miin_footercolor') ||'#B8932F',
        profilecolor=localStorage.getItem('miin_profilecolor') ||'#6F6F6F',
        profileitemcolor=localStorage.getItem('miin_profileitemcolor') ||'#9A9A9A',
        bubblecolor=localStorage.getItem('miin_bubblecolor') ||'#5F7B84';
    const commentheight=window.screen.height-(checkIsMobile()?200:75*3);

    const style = document.createElement('style');
    style.textContent = `

    html, body {
        color: ${fscolor} !important;
        font-size: ${fsnormal}px;
        touch-action: pan-x pan-y !important;
        -moz-text-size-adjust: 100% !important;
        -webkit-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
        width: 100vw !important;
        max-width: 100vw !important;
        min-width: 288px !important;
        overflow-x: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
    }

    #__next {
        ${isMobile?"":`overflow-y: hidden !important;`}
        height: auto !important;
    }

    #__next, main, div, section, article, header, footer {
        max-width: 100vw !important;
        min-width: 0 !important; 
    }

    /* 強制自動換行，防止長網址撐破版面 */
    * {
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
    }

    input, textarea, select {
        touch-action: manipulation !important;
    }

    *, ::after, ::before {
           border-color: #D4AF37 !important;
    }

    .border-gray-100 {
        border-color: #D4AF37 !important;
    }

    .text-xl,.line-clamp-1.text-sm {
      font-size: ${parseInt(fsnormal)+4}px !important;
      line-height: ${parseInt(fsnormal)+4}px !important;
    }

    .text-sm,.line-clamp-1.text-xs {
      font-size: ${parseInt(fsnormal)-4}px !important;
      line-height: ${parseInt(fsnormal)-4}px !important;
    }

    a[href^="/user"] {
        color: ${usercolor} !important;
    }

    .max-h-22 {
        width: 100%;
    }

    .link-mention {
        color: ${linkcolor} !important;
    }

    .bg-light, body {
        background-color: ${bgcolor} !important;
    }

    .bg-white,.card-full {
        background-color: ${bgcolor2} !important;
    }

    .hover\\:text-black:hover {
        color: ${linkcolor} !important;
    }

    .text-gray-700,.text-sm {
        color: ${usercolor} !important;
    }

    [id^="headlessui-menu-button-"] {
        background-color: ${profilecolor} !important;
    }

    [id^="headlessui-menu-items-"] {
        background-color: ${profileitemcolor} !important;
        bottom: -135px;
        margin-top: 45px;
    }

    [id^="headlessui-menu-items-"][class="absolute z-10 mt-2 flex w-28 -translate-x-1/2 flex-col divide-y"]{
        top: 12px;
        bottom: 0px;
        right: 0px;
        left: 34px;
    }

    [id^="headlessui-menu-item-"][class="relative rounded-lg border bg-white p-2 shadow-menu"]{
        height: fit-content !important;
    }

    @media (min-width: 1024px) {
        .lg\:w-aside-max {
            ${isMobile?"":"width: 280px;"}
        }
    }

    header.sticky.top-0{
     ${isMobile?
        `
            position: fixed;
            width:105dvw;
            top: 0%;
            margin-left: 0px !important;
        `:""}
    }

    .sticky.top-16{
        ${isMobile?
        `
            width:105%;
            top: 2rem;
            margin-left: 0px !important;`
    :
    ""}
    }

    .bg-branding.grid.min-h-screen.grid-cols-1.grid-rows-header-main-auto {
        grid-template-rows: unset;
    }
    [class="ml-0 grid min-h-screen grid-cols-1 grid-rows-header-main-footer md:ml-aside-min md:grid-rows-header-main lg:ml-aside-max"]{
        margin-bottom: -42px !important;
    }

    [class^="order-2"] {
    margin-top:40px;
    padding-top: 5px;
    padding-bottom: 0px;
     ${isMobile?
        `padding-left: 0px;padding-right: 0px;
        margin-left: 2px;margin-right: 2px;`
    :
    `padding-left: 15px;padding-right: 15px;
        margin-left: 25px;margin-right: 25px;`}
    }
    /*hashtag*/
    [class='order-2 bg-light pt-0 lg:px-12 px-4 pb-12']{
        ${isMobile?"":"margin-bottom:100px;"}
    }

    [id="comment"]{
        ${isMobile?
        `padding-bottom: 100px;`
    :
    `padding-bottom: 120px;`}
    }

    .card-full {
        margin-left: 0px;
        margin-right: 0px;
    }

    article{
            height: 99.7%;
    }

    article img.h-7.w-4 {
        display:none;
    }

    .grid.grid-rows-header-main {
        grid-template-rows: auto;
    }

    .relative.h-18.font-bold{
        margin-top: 35px;
    }

    .cursor-pointer {
        ${isMobile?
        `margin-left: 0px;
            padding-bottom: 0px;
            padding-top: 20px;
            padding-right: 0px;
            padding-left: 0px;`
    :""}
    }

    .group.mr-1.flex.items-center{
         ${isMobile?`
            padding-bottom: 8px;
            padding-top: 8px;
            padding-right: 8px;
            padding-left: 16px;`
    :""}
    }

    .sticky.bottom-footer {
        position: fixed;
        ${isMobile?
        `width: 99dvw;
            bottom: 7%;`
    :
    `width: 67.3dvw;
            bottom: 0%;`
}

    }

    .aspect-video.w-full,svg.absolute.left-3 {
        ${isMobile?"":"top:100px"};
    }

    .miin-trend-page img.aspect-video {
        margin-top: 100px !important;
    }

    .flex.justify-between.pb-4{
        z-index: 1 !important;
    }

    footer.sticky.bottom-0 {
        position: fixed;
        bottom: 0%;
        z-index: 99;
        width: -moz-available;
    }

    nav a.group,footer a.group {
            color: ${footercolor} !important;
            transition: color 0.2s ease;
        }

        nav a.group:hover,footer a.group:hover{
            color: ${usercolor} !important;
        }

        nav a.group.custom-active-link,footer a.group.custom-active-link {
            color: ${usercolor} !important;
        }

        .bubble-quote {
            width: 85%;
            background-image: none !important;
            background-color: ${bubblecolor} !important;
            color: #333333;
            padding: 5px;
            border-radius: 12px;
            margin: 5px auto;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }

        .flex-col-reverse {
            flex-direction: column;
        }

       button[id^="headlessui-popover-button-"],
        .h-11 {
            -webkit-user-select: none !important;
            -khtml-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-touch-callout: none !important;
            outline: none !important;
        }

        .bg-banner {
            display: none;
        }

        svg.hidden {
            display:none;
        }

      /*突顯留言設定*/
      .group.flex.gap-2 .shrink-0 img {
          cursor: pointer;
          transition: transform 0.1s, ring 0.2s;
      }
      .group.flex.gap-2 .shrink-0 img:active {
          transform: scale(1.1);
      }

     /* 固定在頂部的清除按鈕樣式 */
    #miin-aim-clear-btn {
        position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
        z-index: 100; background:${linkcolor}; color: black; font-weight: bold;
        padding: 6px 16px; border-radius: 20px; cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 14px; display: none;
    }

    /*防捲動*/
    html:has(body.viewer-scroll-locked),
    html:has(body.panel-scroll-locked) {
        scroll-behavior: auto !important;
    }

    body.viewer-scroll-locked,
    body.panel-scroll-locked {
        /* 2. 核心鎖定 */
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100vh !important;

        overscroll-behavior: none !important;
        padding-right: 0px !important;
    }
  `;

    (document.head || document.documentElement).appendChild(style);


    function ModifyButton() {
        const buttons = document.querySelectorAll('[class^="btn"]:not([data-pwa-mod])');
        buttons.forEach(btn => {
            btn.setAttribute('data-pwa-mod', '1');
            const text = btn.textContent.trim();
            if (text.indexOf('App') > 0) {
                btn.style.setProperty('display', 'none', 'important');
            } else if (text.indexOf('下載') >= 0) {
                const parentDiv = btn.closest('div');
                if (parentDiv) parentDiv.style.setProperty('display', 'none', 'important');
                else btn.parentElement.style.setProperty('display', 'none', 'important');
            } else if (text.indexOf('Search') >= 0) {
                btn.style.setProperty('position', 'relative', 'important');
            }
        });
    }

    function updateActiveMenu() {
        const currentPath = window.location.pathname;
        const menuLinks = document.querySelectorAll('nav a.group,footer a.group');
        menuLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            if (currentPath === href || currentPath.startsWith(href)) {
                link.classList.add('custom-active-link');
            } else {
                link.classList.remove('custom-active-link');
            }
        });
    }

    function addBubbleQuoteClass() {
        // 🌟 最佳化：利用 :not 排除已處理的元素，避免重複遍歷
        const targetElements = document.querySelectorAll('.relative.flex.gap-2.leading-6:not(.bubble-quote)');
        targetElements.forEach(element => {
            element.classList.add('bubble-quote');
        });
    }

    function preventInputZoom() {
        const inputs = document.querySelectorAll('input:not([data-zoom-lock]), textarea:not([data-zoom-lock]), select:not([data-zoom-lock])');
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) return;
        const originalContent = viewportMeta.getAttribute('content');

        inputs.forEach(input => {
            input.setAttribute('data-zoom-lock', '1');
            input.addEventListener('focus', () => {
                viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            });
            input.addEventListener('blur', () => {
                viewportMeta.setAttribute('content', originalContent);
            });
        });
    }

    function lockViewportCompletely() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        if (viewport.getAttribute('content') !== 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no') {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    }

    function checkIsMobile() {
        return window.matchMedia("(pointer: coarse)").matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    }

    function cleanContent() {
        document.querySelectorAll('span:not([data-obj-cleaned])').forEach(span => {
            let hasObj = false;
            span.childNodes.forEach(node => {
                if (node && node.nodeType === 3 && node.nodeValue.includes('\uFFFC')) {
                    node.nodeValue = node.nodeValue.replace(/\uFFFC/g, '');
                    hasObj = true;
                }
            });
            if (hasObj) span.setAttribute('data-obj-cleaned', 'true');
        });
    }

    // 🌟 最佳化：高度最佳化核心耗能函式 emojiSize
    const segmenter = new Intl.Segmenter('zh-TW', { granularity: 'grapheme' });
    function emojiSize() {
        const spans = document.querySelectorAll('span:not([data-processed])');
        spans.forEach(span => {
            if (span.className !== '') return;
            const twlock = span.querySelectorAll('span[class="tw-p-lock"]');
            if (twlock.length === 0) return;

            const emojis = span.querySelectorAll('img[class*="twemoji"]');
            if (emojis.length === 0 || emojis.length > 3) return;

            const textContent = span.textContent.trim();
            const segments = segmenter.segment(textContent);

            if ([...segments].length === (twlock.length - emojis.length)) {
                span.setAttribute('data-processed', 'true');
                span.style.setProperty('display', 'flex', 'important');
                span.style.setProperty('line-height', '58px', 'important');

                twlock.forEach(twspan => {
                    twspan.style.setProperty('display', 'flex', 'important');
                    twspan.style.setProperty('height', '60px', 'important');
                    twspan.style.setProperty('width', '60px', 'important');
                    twspan.style.setProperty('font-size', '49px', 'important');
                    twspan.style.setProperty('margin', '0px 5px 0px 0px', 'important');
                    twspan.style.setProperty('line-height', '58px', 'important');
                    twspan.style.setProperty('align-items', 'center', 'important');
                    twspan.style.setProperty('justify-content', 'center', 'important');
                    const emoji = twspan.querySelector('img[class*="twemoji"]');
                    if (emoji) {
                        emoji.style.setProperty('display', 'flex', 'important');
                        emoji.style.setProperty('line-height', '58px', 'important');
                        emoji.style.setProperty('height', '54px', 'important');
                        emoji.style.setProperty('width', '54px', 'important');
                        emoji.style.setProperty('font-size', '48px', 'important');
                        emoji.style.setProperty('align-items', 'center', 'important');
                        emoji.style.setProperty('justify-content', 'center', 'important');
                    }
                });
            }
        });
    }

    function EmojiFeelings() {
        if (!isMobile) return;
        const ef = document.querySelector("[class^='flex items-center justify-between']:not([data-pwa-ef])");
        if (ef) {
            ef.setAttribute('data-pwa-ef', '1');
            ef.style.setProperty("display", "grid");
            ef.style.setProperty("grid-template-columns", "repeat(auto-fit, minmax(200px, 1fr)");
            const efs = ef.querySelector("[class='flex']");
            if (efs) {
                efs.style.setProperty("align-items", "center;");
                efs.style.setProperty("justify-content", "end");
            }
        }
    }

    function updateTrendMode() {
        document.documentElement.classList.toggle("miin-trend-page", location.pathname === "/feed/trend");
    }
    updateTrendMode();

    const clearBtn = document.createElement('div');
    clearBtn.id = 'miin-aim-clear-btn';
    clearBtn.innerText = '☀️ 還原';
    document.body.appendChild(clearBtn);

    let lastPath = location.pathname;

    // 🌟 核心最佳化：建立排程排隊機制（AnimationFrame），拒絕主執行緒被頻繁阻塞
    let animationFrameId = null;
    function runAllAdjustments() {
        ModifyButton();
        updateActiveMenu();
        addBubbleQuoteClass();
        preventInputZoom();
        lockViewportCompletely();
        cleanContent();
        emojiSize();
        EmojiFeelings();

        if (location.pathname !== lastPath) {
            lastPath = location.pathname;
            updateTrendMode();
        }
    }

    const observer = new MutationObserver(() => {
        // 使用 requestAnimationFrame 將 DOM 批次處理移至瀏覽器準備更新畫面的那一幀執行，確保網頁滑動時維持極致順暢
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(runAllAdjustments);
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });
})();
