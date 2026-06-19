// ==UserScript==
// @name         Miin UI Settings Panel
// @namespace    http://tampermonkey.net/
// @version      0.2.8.1
// @description  Miin UI Settings Panel
// @author       bixictn, Gemini, Chatgpt
// @match        https://miin.cc/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20UI%20Settings%20Panel.js
// @downloadURL  https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20UI%20Settings%20Panel.js
// ==/UserScript==

(function() {
    'use strict';

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
    `;
    document.head.appendChild(style);

    function checkIsMobile() {
        const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
        const isMobileUA = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        return hasCoarsePointer || isMobileUA;
    }

    // 2. 初始化與齒輪按鈕
    const gear = document.createElement('button');
    gear.innerHTML = '⚙️';
    gear.id = 'Cthemes';
    gear.style.cssText = `display:none;`;

    // 3. 面板結構
    const panel = document.createElement('div');
    panel.id='miin-settings-panel';
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

    document.body.append(gear, panel);
    gear.onclick = () => panel.style.display = panel.style.display === 'none' ? 'block' : 'none';

    // 4. 功能邏輯
    // 即時顏色預覽
    document.querySelectorAll('.panelinput').forEach(input => {
        input.style.color = input.value;
        input.addEventListener('input', (e) => e.target.style.color = e.target.value);
    });

    // 儲存
    document.getElementById('save_btn').onclick = () => {
        configFields.forEach(f => localStorage.setItem(f.key, document.getElementById(f.id).value));
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

    const observer = new MutationObserver(() => {
    const menu = document.querySelector('[role="menu"]');
    if (!menu) return;

    // 1. 隱藏原本懸浮在角落的齒輪
    const gear = document.getElementById('Cthemes');
    if (gear) gear.style.display = 'none';

    // 2. 尋找「個人電台」作為複製的模板
    const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]'));
    const templateItem = menuItems.find(item => item.textContent.includes('個人電台'));

    // 3. 複製並建立「設定」按鈕 (確保不重複建立)
    if (templateItem && !menu.querySelector('#settings-trigger')) {
        const settingsItem = templateItem.cloneNode(true); // 完美複製外觀

        // 修改設定按鈕的屬性
        settingsItem.id = 'settings-trigger';
        settingsItem.textContent = '🎨';
        settingsItem.style.borderTop = '1px solid #444'; // 加個小分隔線會更好看
        // 移除跳轉並綁定開啟面板的事件
        settingsItem.removeAttribute('href');
        settingsItem.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 注意：請確保你在建立設定面板時，有給 panel 設定 id="miin-settings-panel"
            const panel = document.querySelector('#miin-settings-panel') || document.querySelector('div[style*="background:#999"]');
            if (panel){
                panel.style.display = panel.style.display==='block' ? 'none':'block';
            }
        };

        // 將設定按鈕插入到個人電台的下方
        templateItem.before(settingsItem);
    }

    // 4. 將選單內的所有文字替換成 Emoji
    // 重新抓取一次最新的列表 (包含剛剛產生的設定按鈕)
    const allItems = document.querySelectorAll('[role="menuitem"]');
    allItems.forEach(item => {
        // 檢查防護標記，避免無限迴圈
        if (item.dataset.processed === 'true') return;

        // 依照內容替換文字
        if (item.textContent.includes('個人電台')) {
            item.textContent = '🎙️';
            item.dataset.processed = 'true';
        } else if (item.textContent.includes('登出')) {
            item.textContent = '➡️';
            item.dataset.processed = 'true';
        } else if (item.id === 'settings-trigger') {
            // 新增的設定按鈕已經處理好了
            item.dataset.processed = 'true';
        }
    });
});

// 啟動監聽器
observer.observe(document.body, { childList: true, subtree: true });

})();
