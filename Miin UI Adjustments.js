// ==UserScript==
// @name         Miin UI Adjustments
// @namespace    http://tampermonkey.net/
// @version      0.4.6
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
        bottom: -170px;
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

    ${isMobile?"":`
        #comment a,.space-x-2 {
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
         }`};

     h3[data-badge-injected],span[data-badge-injected] {
          display: inline-flex !important;
          align-items: center !important;
          white-space: nowrap !important; /* 強制不換行，讓所有圖示黏在一起 */
          max-width: 100% !important;     /* 避免超出容器 */
     }

    h3[data-badge-injected] svg,span[data-badge-injected] svg {
        flex-shrink: 0 !important;
        margin-left: 8px !important;    /* 給圖示與文字之間一點呼吸空間 */
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
        ${isMobile?"":`
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100vh !important;`}
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

    const followSvg = (userID) => `
                    <svg class="miin-follow-icon inline-block ml-1 h-4 w-4 align-text-bottom" data-userid="${userID}" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg" style="cursor: pointer; width: 16px; height: 16px; margin-right: 10px; ">
                        <circle cx="12" cy="12" r="10" stroke="#10B981" stroke-width="2.5"></circle>
                        <path d="M12 8V16M8 12H16" stroke="#10B981" stroke-width="2.5" stroke-linecap="round"></path>
                    </svg>`;

    // 取消追蹤符號 (-)
    const unfollowSvg = (userID) => `
                    <svg class="miin-unfollow-icon inline-block ml-1 h-4 w-4 align-text-bottom" data-userid="${userID}" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg" style="cursor: pointer; width: 16px; height: 16px; margin-right: 10px; ">
                        <circle cx="12" cy="12" r="10" stroke="#6B7280" stroke-width="2.5"></circle>
                        <path d="M8 12H16" stroke="#6B7280" stroke-width="2.5" stroke-linecap="round"></path>
                    </svg>`;

     const blockSvg = (userID) => `
                <svg class="miin-block-icon inline-block ml-1 h-4 w-4 align-text-bottom"
                     data-userid="${userID}"
                     viewBox="0 0 24 24"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg"
                     style="cursor: pointer; width: 16px; height: 16px; margin-right: 10px;">
                    <circle cx="12" cy="12" r="10" stroke="#EF4444" stroke-width="2.5"></circle>
                    <line x1="6" y1="6" x2="18" y2="18" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"></line>
                </svg>`;

    async function renderBadgesToDOM() {
       
        const goldenBadgeSvg=`
                        <svg class="miin-custom-badge inline-block ml-1 h-4 w-4 align-text-bottom" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg" style="margin-right: 10px;">
                            <path fill="#FBBF24" d="M21.8836 11.9999 L23.3416 9.72645 C23.4939 9.48915 23.5389 9.19911 23.4656 8.92762 C23.3934 8.65614 23.2088 8.42762 22.9588 8.29774 L20.5594 7.05751 L20.6854 4.36024 C20.6981 4.07899 20.5926 3.80555 20.3934 3.60633 C20.1941 3.40613 19.9148 3.2909 19.6395 3.31434 L16.9417 3.44032 L15.7015 1.04091 C15.5726 0.790906 15.3441 0.606336 15.0721 0.534066 C14.7996 0.461796 14.5106 0.505746 14.2737 0.658086 L11.9999 2.1161 L9.72594 0.658096 C9.48912 0.505756 9.19811 0.461806 8.9276 0.534076 C8.65563 0.606346 8.42711 0.790916 8.29821 1.04092 L7.05798 3.44033 L4.35974 3.31435 C4.08093 3.29287 3.80554 3.40615 3.60632 3.60634 C3.4071 3.80556 3.30114 4.079 3.31433 4.36025 L3.43982 7.05752 L1.04041 8.29775 C0.790409 8.42763 0.606819 8.65615 0.534059 8.92763 C0.461299 9.19911 0.506229 9.48915 0.658079 9.72646 L2.1156 11.9999 L0.658069 14.2733 C0.506209 14.5106 0.461289 14.8007 0.534049 15.0722 C0.606809 15.3436 0.790399 15.5722 1.0404 15.702 L3.43981 16.9423 L3.31432 19.6395 C3.30114 19.9208 3.40709 20.1942 3.60631 20.3934 C3.80553 20.5936 4.07945 20.703 4.35973 20.6854 L7.05797 20.5595 L8.2982 22.9589 C8.42711 23.2089 8.65562 23.3934 8.92759 23.4657 C9.1981 23.536 9.48911 23.494 9.72593 23.3417 L11.9999 21.8837 L14.2737 23.3417 C14.4363 23.4462 14.6238 23.4999 14.8133 23.4999 C14.8997 23.4999 14.9871 23.4882 15.0721 23.4657 C15.344 23.3934 15.5725 23.2089 15.7014 22.9589 L16.9417 20.5595 L19.6394 20.6854 C19.9168 20.705 20.1951 20.5936 20.3933 20.3934 C20.5926 20.1942 20.698 19.9208 20.6853 19.6395 L20.5593 16.9423 L22.9588 15.702 C23.2088 15.5722 23.3933 15.3436 23.4656 15.0722 C23.5388 14.8007 23.4939 14.5106 23.3416 14.2733 L21.8836 11.9999 Z" />
                            <path fill="#FFFFFF" d="M17.207 9.70705 L11.207 15.707 C11.0117 15.9024 10.7558 16 10.5 16 C10.2441 16 9.98827 15.9024 9.79296 15.707 L 6.79296 12.707 C 6.40234 12.3164 6.40234 11.6836 6.79296 11.293 C 7.18358 10.9024 7.8164 10.9024 8.20702 11.293 L 10.5 13.586 L 15.793 8.29299 C 16.1836 7.90237 16.8164 7.90237 17.207 8.29299 C 17.5976 8.68361 17.5976 9.31643 17.207 9.70705 Z" />
                        </svg>
            `;


        // 負責執行插入的子函數
        function injectBadge (element, userId) {

            let span = document.createElement('span');
            span.style.display='flex';
            span.style.whiteSpace='nowrap';
            span.style.alignItems='center';
            if(!checkIsMobile())span=element;



            const cacheData = sessionStorage.getItem(`miin_user_${userId}`);
            if (cacheData) {

                const userData = JSON.parse(cacheData);

                let checked = false;
                if(window.location.pathname.includes('/user')){
                    checked = true;
                }
                else if(!element.closest('a').parentElement.previousElementSibling){
                    checked = true;
                }
                if(checked){
                    if (userData.badge === 'golden') {
                        span.insertAdjacentHTML('beforeend',goldenBadgeSvg);
                    }
                    if(userId !== sessionStorage.getItem("miin_loginId")){

                        const cacheRaw = sessionStorage.getItem(`miin_user_${userId}`);
                        if (cacheRaw) {
                            const userData = JSON.parse(cacheRaw);
                            if(userData.relation === 'none'){
                                span.insertAdjacentHTML('beforeend',followSvg(userId));
                            }
                            else if(userData.relation === 'following'){
                                 span.insertAdjacentHTML('beforeend',unfollowSvg(userId));
                            }
                        }

                        span.insertAdjacentHTML('beforeend',blockSvg(userId));
                        if(checkIsMobile())element.after(span);
                    }
                    element.setAttribute('data-badge-injected', 'true');
                }
            }
        }
        // ==========================================
        // 處理帶有 userId 的完整連結 (留言區/個人主頁)
        // ==========================================
        if(window.location.pathname.includes("/story/")){
            document.querySelectorAll('a[href^="/user?userId="]:not([data-badge-injected="true"])').forEach(el => {
                const urlObj = new URL(el.getAttribute('href'), window.location.origin);
                const userId = urlObj.searchParams.get('userId');
                const sp = el.querySelector('span');
                if(!sp)injectBadge(el, userId);
                else{
                    injectBadge(sp, userId);
                    el.setAttribute('data-badge-injected', 'true');
                }
            });
        }
        else if(window.location.pathname.includes("/user/")){
            // ==========================================
            // 處理動態牆 (Feed) 的作者
            // ==========================================
            const avatarElement=document.querySelector('#avatar:not([data-badge-injected="true"])');

            if(avatarElement){
                const nextEl = avatarElement.nextElementSibling; // 抓旁邊帶有 @ 的 span
                let userId = null;

                // 優先用 @username 來反查 (最準確)
                if (nextEl && nextEl.innerText.includes('@')) {
                    const match = nextEl.innerText.match(/@([a-zA-Z0-9_]+)/);
                    if (match) {
                        userId = sessionStorage.getItem(`miin_username_${match[1]}`);
                        injectBadge(nextEl.firstChild, userId);
                        avatarElement.setAttribute('data-badge-injected', 'true');
                    }
                }
            }

            // ==========================================
            // 處理「使用者頁面」的動態列表
            // ==========================================
            document.querySelectorAll('.mb-2.mt-1.flex.items-center > span.line-clamp-1:not([data-badge-injected="true"])').forEach(el => {
                const nickname = el.innerText.split('·')[0].trim();
                const userId = sessionStorage.getItem(`miin_nickname_${nickname}`);
                injectBadge(el, userId);
            });
        }
        else{
            document.querySelectorAll('.flex-col.justify-center > span.text-sm:first-child:not([data-badge-injected="true"])').forEach(el => {
                const nextEl = el.nextElementSibling; // 抓旁邊帶有 @ 的 span
                let userId = null;

                // 優先用 @username 來反查 (最準確)
                if (nextEl && nextEl.innerText.includes('@')) {
                    const match = nextEl.innerText.match(/@([a-zA-Z0-9_]+)/);
                    if (match) {
                        userId = sessionStorage.getItem(`miin_username_${match[1]}`);
                    }
                }

                // 如果沒查到，退而求其次用「暱稱」反查
                if (!userId) {
                    userId = sessionStorage.getItem(`miin_nickname_${el.innerText.trim()}`);
                }

                injectBadge(el, userId);
            });
            // ==========================================
            // 處理貼文內的「留言預覽」
            // HTML結構: <div class="font-bold break-all"><span>Cob (MIIN-B1-MW-0535)</span></div>
            // ==========================================
            document.querySelectorAll('.font-bold.break-all > span:not([data-badge-injected="true"])').forEach(el => {
                const nickname = el.innerText.trim();
                const userId = sessionStorage.getItem(`miin_nickname_${nickname}`); // 用暱稱反查
                injectBadge(el, userId);
            });
        }
    }

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
        renderBadgesToDOM();

        if (location.pathname !== lastPath) {
            lastPath = location.pathname;
            updateTrendMode();
        }
    }

    const observer = new MutationObserver(() => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(runAllAdjustments);
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });


    function checkAndApplyBlocking() {
        // 1. 取得當前頁面的 userId (從網址列抓取)
        const currentUserName = (window.location.pathname.split('/'))[2];

        if (!currentUserName) return;
        const currentUserId = sessionStorage.getItem('miin_username_'+currentUserName);

        // 2. 從快取讀取該使用者的 relation
        const cacheRaw = sessionStorage.getItem(`miin_user_${currentUserId}`);
        if (cacheRaw) {
            const userData = JSON.parse(cacheRaw);
            const relation = userData.relation;

            // 3. 如果是 blocking，啟動遮罩
            if (relation === 'blocking') {
                applyBlockingOverlay(currentUserId);
            }
        }

    }

    function render() {
        checkAndApplyBlocking();
    }

    // UI Script 繼續監聽更新
    window.addEventListener('MiinDataUpdated', render);

    // 封鎖遮罩函數
    function applyBlockingOverlay(userId) {
        // 避免重複生成
        if (document.getElementById('miin-block-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'miin-block-overlay';

        // 樣式：覆蓋全螢幕、變灰、禁用所有點擊
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(200, 200, 200, 0.5)', // 灰色透明遮罩
            backdropFilter: 'grayscale(100%)',          // 強制轉為灰階
            zIndex: '99999',                            // 確保在最上層
            cursor: 'not-allowed'
        });

        const unblockBtn = document.createElement('button');
        unblockBtn.innerText = "解除封鎖";
        Object.assign(unblockBtn.style, {
            display: 'flex',
            position: 'absolute',
            top: '20px',
            left:'50%',
            padding: '10px 20px',
            backgroundColor: '#FBBF24', // 金色按鈕
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
        });

        unblockBtn.onclick = () => {
            // 呼叫我們剛剛定義的 API 工具
            window.MiinAPI.toggleBlock(userId, false);

            // 移除遮罩
            const overlay = document.getElementById('miin-block-overlay');
            if (overlay) overlay.remove();
            const blockIcon = document.querySelector('.miin-block-icon');
            blockIcon.insertAdjacentHTML('beforebegin', followSvg(userId));
        };

        overlay.appendChild(unblockBtn);
        document.body.appendChild(overlay);
    }

    document.addEventListener('click', async (e) => {
        // 尋找被點擊的目標是否為我們帶有 data-userid 的 SVG
        const blockIcon = e.target.closest('.miin-block-icon');

        if (blockIcon) {
            e.preventDefault();
            e.stopPropagation();

            const userId = blockIcon.getAttribute('data-userid');
            if (!userId) return;

            if (confirm('確定要封鎖此使用者嗎？')) {
                await window.MiinAPI.toggleBlock(userId, true);
                window.location.reload();

            }
        }

        const followIcon = e.target.closest('.miin-follow-icon');
        const unfollowIcon = e.target.closest('.miin-unfollow-icon');

        if (followIcon || unfollowIcon) {
            e.preventDefault();
            e.stopPropagation();

            const icon = followIcon || unfollowIcon;
            const userId = icon.getAttribute('data-userid');
            const willFollowing = !followIcon; // 如果不是點到 followIcon，代表點 unfollowIcon 要追蹤

            await window.MiinAPI.toggleFollow(userId, !willFollowing);

            const ufs=document.querySelectorAll(`svg[class^=${!willFollowing?"'miin-follow-icon'":"'miin-unfollow-icon'"}][data-userid='${userId}']`);
            for(const uf of ufs){
                if (uf.dataset.status === 'pending') return;
                uf.dataset.status = 'pending';
                if(!willFollowing){
                    uf.insertAdjacentHTML('beforebegin', unfollowSvg(userId));
                    uf.remove();
                }
                else{
                    uf.insertAdjacentHTML('beforebegin', followSvg(userId));
                    uf.remove();
                }
            }

            const cacheRaw = sessionStorage.getItem(`miin_user_${userId}`);
            if (cacheRaw) {
                const userData = JSON.parse(cacheRaw);
                userData.relation = !willFollowing ? 'following' : 'none';
                sessionStorage.setItem(`miin_user_${userId}`, JSON.stringify(userData));
                //if(window.location.pathname.includes('/user/')) window.location.reload();
            }
        }

    }, true);

})();
