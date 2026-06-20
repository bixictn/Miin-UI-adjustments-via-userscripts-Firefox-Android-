// ==UserScript==
// @name         Miin UI Settings Panel
// @namespace    http://tampermonkey.net/
// @version      0.3.0
// @description  Miin UI Settings Panel with Gesture Close and LockScroll
// @author       bixictn, Gemini, Chatgpt
// @match        https://miin.cc/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20UI%20Settings%20Panel.js
// @downloadURL  https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20UI%20Settings%20Panel.js
// ==/UserScript==

(function() {
    'use strict';

    let closingPanelByBack = false;

    // 1. 樣式注入
    const style = document.createElement('style');
    style.textContent = `
        .panelitem { font-size: ${checkIsMobile()?"14px":"16px"}; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; color: #D4AF37; }
        .panelinput { width: ${checkIsMobile()?"130px":"380px"}; background: #eee; border: 1px solid #777; padding: 2px 5px; border-radius: 4px; font-weight: bold;}
        .btn-group { display: flex; gap: 5px; margin-top: 10px; }
        [id$="btn"] { color: #D4AF37;border: 1px solid #777 !important; padding: 2px 5px; border-radius: 4px;}
        [role="menu"] { width: 56px !important;align-items: center;}
        [role="menuitem"] { height:42px !important; display: flex !important; align-items: center; padding: 5px !important; }
        .menu-item-primary:hover{ background-color:unset !important; }

        /* 🌟 新增全螢幕透明點擊遮罩的樣式 */
        #miin-settings-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999998; display: none;
        }
    `;
    document.head.appendChild(style);

    function checkIsMobile() {
        const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
        const isMobileUA = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        return hasCoarsePointer || isMobileUA;
    }

    // 🌟 捲動鎖定與解鎖功能
    function lockScroll() {
        document.documentElement.style.cssText = "overflow: hidden !important; height: 100vh !important;";
        document.body.style.cssText = "overflow: hidden !important; height: 100vh !important; touch-action: none !important;";
    }

    function unlockScroll() {
        document.documentElement.style.cssText = "";
        document.body.style.cssText = "";
    }

    // 2. 初始化按鈕（保留備用）
    const gear = document.createElement('button');
    gear.innerHTML = '⚙️';
    gear.id = 'Cthemes';
    gear.style.cssText = `display:none;`;

    // 🌟 建立背景點擊遮罩（點旁邊關閉用）
    const overlay = document.createElement('div');
    overlay.id = 'miin-settings-overlay';

    // 3. 面板結構
    const panel = document.createElement('div');
    panel.id = 'miin-settings-panel';
    panel.style.cssText = `
                display:none;
                position:fixed;
                top:55%;
                right:20px;
                transform:translateY(-50%);
                z-index:999999;
                width:${checkIsMobile()?"85%":"45%"};
                max-width:${checkIsMobile()?"320px":"500px"};
                padding: 10px !important;
                border-radius: 4px !important;
                background: #101010 !important;
                border: 2px solid #D4AF37 !important;
                color: #FFFFFF !important;
                box-shadow: 0 15px 50px rgba(0,0,0,0.9) !important;`;

    const configFields = [
        { id: 'fs_input', label: '字體大小', key: 'miin_fs', def: 16 },
        { id: 'fscolor_input', label: '主文字', key: 'miin_fscolor', def: '#6AAFD8' },
        { id: 'usercolor_input', label: 'ID', key: 'miin_usercolor', def: '#D7BE41' },
        { id: 'linkcolor_input', label: '連結', key: 'miin_linkcolor', def: '#8BC4E6' },
        { id: 'bgcolor1_input', label: '背景1', key: 'miin_bgcolor', def: '#2C2C2C' },
        { id: 'bgcolor2_input', label: '背景2', key: 'miin_bgcolor2', def: '#111111' },
        { id: 'footercolor_input', label: '導覽列按鈕', key: 'miin_footercolor', def: '#B8932F' },
        { id: 'profilecolor_input', label: '個人選單', key: 'miin_profilecolor', def: '#6F6F6F' },
        { id: 'profileitemcolor_input', label: '個人選單2', key: 'miin_profileitemcolor', def: '#9A9A9A' },
        { id: 'bubblecolor_input', label: '泡泡顏色', key: 'miin_bubblecolor', def: '#5F7B84' }
    ];

    let html = '';
    configFields.forEach(f => {
        html += `<div class="panelitem">${f.label}: <input class="panelinput" type="text" id="${f.id}" value="${localStorage.getItem(f.key) || f.def}"></div>`;
    });

    panel.innerHTML = html + `
        <button id="save_btn" style="width:100%; cursor:pointer; margin-bottom:5px;">儲存並重新整理</button>
        <div class="btn-group">
            <button id="export_btn" style="flex:1; cursor:pointer;">匯出</button>
            <button id="import_btn" style="flex:1; cursor:pointer;">匯入</button>
        </div>
    `;

    document.body.append(gear, overlay, panel);

    // 🌟 核心控制：開啟面板
    function openPanel() {
        panel.style.display = 'block';
        overlay.style.display = 'block';
        lockScroll();
        history.pushState({ ... (history.state || {}), uiSettingsPanel: true }, "");
    }

    // 🌟 核心控制：關閉面板
    function closePanel(fromBack = false) {
        panel.style.display = 'none';
        overlay.style.display = 'none';
        unlockScroll();

        // 如果是點旁邊或點儲存（非返回鍵主導），主動向瀏覽器要求 back 把網址洗回來
        if (!fromBack && history.state?.uiSettingsPanel) {
            closingPanelByBack = true;
            history.back();
        }
    }

    // 點擊遮罩（點旁邊）關閉
    overlay.onclick = () => closePanel(false);

    // 4. 功能邏輯
    document.querySelectorAll('.panelinput').forEach(input => {
        input.style.color = input.value;
        input.addEventListener('input', (e) => e.target.style.color = e.target.value);
    });

    // 儲存
    document.getElementById('save_btn').onclick = () => {
        configFields.forEach(f => localStorage.setItem(f.key, document.getElementById(f.id).value));
        unlockScroll(); // 確保重新整理前解開鎖定
        location.reload();
    };

    // 匯出
    document.getElementById('export_btn').onclick = () => {
        let settings = {};
        configFields.forEach(f => settings[f.key] = localStorage.getItem(f.key));
        const blob = new Blob([JSON.stringify(settings)], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'miin_settings.json';
        a.click();
    };

    // 匯入
    document.getElementById('import_btn').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const reader = new FileReader();
            reader.onload = event => {
                const settings = JSON.parse(event.target.result);
                for (let key in settings) localStorage.setItem(key, settings[key]);
                location.reload();
            };
            reader.readAsText(e.target.files[0]);
        };
        input.click();
    };

    // 🌟 監聽手機返回鍵手勢（popstate）
    window.addEventListener('popstate', (e) => {
        if (closingPanelByBack) {
            closingPanelByBack = false; // 解開安全鎖
            return;
        }

        // 如果在歷史紀錄中發現設定面板被倒退了，立刻關閉畫面
        if (panel.style.display === 'block') {
            closePanel(true);
        }
    }, true);

    // 🌟 監聽鍵盤 ESC 鍵
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.style.display === 'block') {
            closePanel(false);
        }
    });

    // 5. 側邊選單修改
    const menuObserver = new MutationObserver(() => {
        const menu = document.querySelector('[role="menu"]');
        if (!menu) return;

        const gear = document.getElementById('Cthemes');
        if (gear) gear.style.display = 'none';

        const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]'));
        const templateItem = menuItems.find(item => item.textContent.includes('個人電台'));

        if (templateItem && !menu.querySelector('#settings-trigger')) {
            const settingsItem = templateItem.cloneNode(true);

            settingsItem.id = 'settings-trigger';
            settingsItem.textContent = '🎨';
            settingsItem.style.borderTop = '1px solid #444';
            settingsItem.removeAttribute('href');

            // 🌟 綁定開關改為全新的核心函數
            settingsItem.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (panel.style.display === 'block') {
                    closePanel(false);
                } else {
                    openPanel();
                }
            };

            templateItem.before(settingsItem);
        }

        const allItems = document.querySelectorAll('[role="menuitem"]');
        allItems.forEach(item => {
            if (item.dataset.processed === 'true') return;

            if (item.textContent.includes('個人電台')) {
                item.textContent = '🎙️';
                item.dataset.processed = 'true';
            } else if (item.textContent.includes('登出')) {
                item.textContent = '➡️';
                item.dataset.processed = 'true';
            } else if (item.id === 'settings-trigger') {
                item.dataset.processed = 'true';
            }
        });
    });

    menuObserver.observe(document.body, { childList: true, subtree: true });

})();
