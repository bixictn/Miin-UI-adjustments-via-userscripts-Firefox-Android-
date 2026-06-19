// ==UserScript==
// @name         Miin UI Adjustments
// @namespace    http://tampermonkey.net/
// @version      0.2.8.1
// @description  Miin UI Adjustments
// @author       bixictn, Gemini, Chatgpt
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

    #__next, main, div, section, article, header, footer {
        max-width: 100vw !important;
        min-width: 0 !important; /* 打破原廠 min-width 限制 */
        box-sizing: border-box !important;
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

    [id="comment"]{
        ${isMobile?
        `padding-bottom: 100px;`
    :
    `padding-bottom: 80px;`}
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

      svg.hidden {
          display:none;
      }
  `;

    (document.head || document.documentElement).appendChild(style);


    function ModifyButton() {
        const buttons = document.querySelectorAll('[class^="btn"]');
        buttons.forEach(btn => {
            if (btn.textContent.trim().indexOf('App')>0) {
                btn.style.setProperty('display', 'none', 'important');
            }
            else if(btn.textContent.trim().indexOf('下載')>=0) {
                const parentDiv = btn.closest('div');
                if (parentDiv) {
                    parentDiv.style.setProperty('display', 'none', 'important');
                }
                else{
                    btn.parentElement.style.setProperty('display', 'none', 'important');
                }
            }
            else if(btn.textContent.trim().indexOf('Search')>=0){
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
        const targetElements = document.querySelectorAll('.relative.flex.gap-2.leading-6');
        targetElements.forEach(element => {
            if (!element.classList.contains('bubble-quote')) {
                element.classList.add('bubble-quote');
            }
        });
    }

    // 💡 改為 1.0 比例，配合 CSS 的 RWD 限制
    function preventInputZoom() {
        const inputs = document.querySelectorAll('input, textarea, select');
        const viewportMeta = document.querySelector('meta[name="viewport"]');

        if (!viewportMeta) return;

        const originalContent = viewportMeta.getAttribute('content');

        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            });
            input.addEventListener('blur', () => {
                viewportMeta.setAttribute('content', originalContent);
            });
        });
    }

    // 💡 改為 1.0 比例，不再物理縮小整個網頁
    function lockViewportCompletely() {
        let viewport = document.querySelector('meta[name="viewport"]');

        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }

        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    function checkIsMobile() {
        const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
        const isMobileUA = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        return hasCoarsePointer || isMobileUA;
    }

    function cleanContent() {
        document.querySelectorAll('span:not([data-obj-cleaned])').forEach(span => {
            let hasObj = false;
            span.childNodes.forEach(node => {
                if(!node)return;

                if (node.nodeType === 3 && node.nodeValue.includes('\uFFFC')) {
                    node.nodeValue = node.nodeValue.replace(/\uFFFC/g, '');
                    hasObj = true;
                }
            });
            if (hasObj) span.setAttribute('data-obj-cleaned', 'true');
        });
    }

    //EmojiSize --- Start
    function emojiSize(){
        const spans = document.querySelectorAll('span');
        for ( const span of spans){
            if(span.className !== '') continue;
            if(span.dataset.processed) continue;
            const twlock=span.querySelectorAll('span[class="tw-p-lock"]');
            if(!twlock)continue;
            const emojis = span.querySelectorAll('img[class*="twemoji"]');
            // 取得容器內的純文字（去除空白）
            const textContent = span.textContent.trim();
            const segmenter = new Intl.Segmenter('zh-TW', { granularity: 'grapheme' });
            const segments = segmenter.segment(textContent);
            // 條件：純文字長度為 0 且 emoji 數量在 1~3 個之間
            if ([...segments].length === (twlock.length-emojis.length) && emojis.length > 0 && emojis.length <= 3) {
                span.dataset.processed=true;
                span.style.setProperty('display', 'flex','important');
                span.style.setProperty('line-height', '58px','important');

                twlock.forEach(twspan => {
                    twspan.style.setProperty('display', 'flex','important');
                    twspan.style.setProperty('height', '60px', 'important');
                    twspan.style.setProperty('width', '60px', 'important');
                    twspan.style.setProperty('font-size','49px','important');
                    twspan.style.setProperty('margin', '0px 5px 0px 0px', 'important');
                    twspan.style.setProperty('line-height', '58px','important');
                    twspan.style.setProperty('align-items', 'center','important');
                    twspan.style.setProperty('justify-content','center','important');
                    const emoji = twspan.querySelector('img[class*="twemoji"]');
                    if(emoji){
                        emoji.style.setProperty('display', 'flex','important');
                        emoji.style.setProperty('line-height', '58px','important');
                        emoji.style.setProperty('display', 'flex','important');
                        emoji.style.setProperty('height', '54px', 'important');
                        emoji.style.setProperty('width', '54px', 'important');
                        emoji.style.setProperty('font-size','48px','important');
                        emoji.style.setProperty('align-items', 'center','important');
                        emoji.style.setProperty('justify-content','center','important');
                    }
                });
            }

        }
    }
    //EmojiSize --- End

    function EmojiFeelings(){
        if(checkIsMobile()){
            const ef=document.querySelector("[class^='flex items-center justify-between']")
            if(ef){
                ef.style.setProperty("display","grid");
                ef.style.setProperty("grid-template-columns", "repeat(auto-fit, minmax(200px, 1fr)");
                const efs=ef.querySelector("[class='flex']");
                if(efs){
                    efs.style.setProperty("align-items", "center;");
                    efs.style.setProperty("justify-content", "end");
                }
            }
        }        
    }

    function updateTrendMode() {
        document.documentElement.classList.toggle(
            "miin-trend-page",
            location.pathname === "/feed/trend"
        );
    }
    updateTrendMode();

    let lastPath = location.pathname;

    const observer = new MutationObserver(() => {
        ModifyButton();
        updateActiveMenu();
        addBubbleQuoteClass();
        preventInputZoom();
        lockViewportCompletely();
        cleanContent();
        emojiSize();
        EmojiFeelings();

        if (location.pathname === lastPath) return;
        lastPath = location.pathname;
        updateTrendMode();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });


})();
