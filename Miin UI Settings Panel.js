// ==UserScript==
// @name         Miin UI Settings Panel
// @namespace    http://tampermonkey.net/
// @version      0.4.0
// @description  Miin UI Settings Panel
// @author       bixictn
// @match        https://miin.cc/*
// @grant        unsafeWindow
// @updateURL    https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20UI%20Settings%20Panel.js
// @downloadURL  https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20UI%20Settings%20Panel.js
// ==/UserScript==

(function() {
    'use strict';

    let closingPanelByBack = false;

    // 1. 樣式注入
    const style = document.createElement('style');
    function checkIsMobile() {
        const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
        const isMobileUA = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        return hasCoarsePointer || isMobileUA;
    }

    style.textContent = `
        .panelitem { font-size: ${checkIsMobile()?"14px":"16px"}; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; color: #D4AF37; }
        .panelinput { width: ${checkIsMobile()?"130px":"380px"}; background: #eee; border: 1px solid #777; padding: 2px 5px; border-radius: 4px; font-weight: bold; color: #333;}
        .profile-input { width: ${checkIsMobile()?"130px":"380px"}; background: #333; color: #fff; border: 1px solid #D4AF37; padding: 4px 5px; border-radius: 4px; }
        .btn-group { display: flex; gap: 5px; margin-top: 10px; }
        [id$="btn"] { color: #D4AF37; border: 1px solid #777 !important; padding: 4px 8px; border-radius: 4px; cursor: pointer; background: #222; }
        [id$="btn"]:hover { background: #444; }
        [role="menu"] { width: 56px !important; align-items: center;}
        [role="menuitem"] { height:42px !important; display: flex !important; align-items: center; padding: 5px !important; }
        .menu-item-primary:hover{ background-color:unset !important; }
        #miin-settings-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999998; display: none; }
        .section-divider { border-top: 1px dashed #555; margin: 12px 0; }
        .section-title { color: #D4AF37; font-weight: bold; margin-bottom: 8px; font-size: 1.1em; }
    `;
    document.head.appendChild(style);

    function lockScroll() { document.body.classList.add('panel-scroll-locked'); }
    function unlockScroll() { document.body.classList.remove('panel-scroll-locked'); }

    const overlay = document.createElement('div');
    overlay.id = 'miin-settings-overlay';

    const panel = document.createElement('div');
    panel.id = 'miin-settings-panel';
    panel.style.cssText = `
        display:none; position:fixed; top:55%; right:20px; transform:translateY(-50%);
        z-index:999999; width:${checkIsMobile()?"85%":"45%"}; max-width:${checkIsMobile()?"320px":"500px"};
        padding: 15px !important; border-radius: 6px !important; background: #101010 !important;
        border: 2px solid #D4AF37 !important; color: #FFFFFF !important;
        box-shadow: 0 15px 50px rgba(0,0,0,0.9) !important;
        max-height: 80vh; overflow-y: auto;
    `;

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

    let html = `<div id='themes_setup'><div class="section-title">🎨 介面外觀設定</div>`;
    configFields.forEach(f => {
        html += `<div class="panelitem">${f.label}: <input class="panelinput" type="text" id="${f.id}" value="${localStorage.getItem(f.key) || f.def}"></div>`;
    });

    html += `
            <button id="save_ui_btn" style="width:100%; margin-bottom:5px;">儲存外觀並重新整理</button>
            <div class="btn-group" style="margin-bottom: 10px;">
                <button id="export_btn" style="flex:1;">匯出</button>
                <button id="import_btn" style="flex:1;">匯入</button>
            </div>
        </div>
        <div id="profile_setup">
           <div id="cover_container" style="height: 150px; background: linear-gradient(to right, #0000ff, #00ffff); border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center;">
           <button id="cover_upload_btn">🖼️ 更換封面</button>
           </div>

            <div style="text-align: center; margin-top: -40px;">
                <img id="avatar_img" src="" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #1a1a1a;">
                <br>
                <button id="avatar_upload_btn">📷 更換頭像</button>
            </div>

            <label>顯示名稱</label><label id="username_display"></label>
            <input type="text" id="nickname_input" style="color:#000;width: 100%; margin: 10px 0; padding: 8px; border-radius: 5px;">

            <label>個人簡介</label>
                <textarea id="intro_input" style="color:#000;width: 100%; margin: 10px 0; padding: 8px; border-radius: 5px; height: 120px;resize: none;"></textarea>

                <button id="save_profile_btn" style="width: 100%; padding: 10px; background: #4a90e2; border: none; border-radius: 5px; color: white; font-weight: bold;">送出</button>
        <div>
    `;

    panel.innerHTML = html;
    document.body.append(overlay, panel);

    // 開關面板邏輯：在這裡呼叫底層腳本提供的 API
    function openPanel() {
        panel.style.display = 'block';
        overlay.style.display = 'block';
        lockScroll();
        history.pushState({ ... (history.state || {}), uiSettingsPanel: true }, "");

        // 🌟 跨腳本呼叫資料層 API
        if (typeof unsafeWindow.fetchMiinProfile === 'function') {
            unsafeWindow.fetchMiinProfile().then(userData => {
                if (userData) {
                    document.getElementById("cover_container").style.backgroundImage = `url('${userData.cover[0].url}')`;
                    document.getElementById('avatar_img').src=userData.avatar[0].url;
                    document.getElementById('username_display').textContent = `@${userData.username}`;
                    document.getElementById('nickname_input').value = userData.nickname || '';
                    document.getElementById('intro_input').value = userData.intro || '';
                } else {
                    document.getElementById('username_display').textContent = '讀取失敗';
                }
            });
        } else {
            console.error("找不到 API 核心！請確認 Miin Push Data 腳本已啟用。");
            document.getElementById('username_display').textContent = 'API 未載入';
        }
    }

    function closePanel(fromBack = false) {
        panel.style.display = 'none';
        overlay.style.display = 'none';
        unlockScroll();
        if (!fromBack && history.state?.uiSettingsPanel) {
            closingPanelByBack = true;
            history.back();
        }
    }

    overlay.onclick = () => closePanel(false);

    // ... 事件綁定 (UI 儲存、匯出入) 保持原樣 ...
    document.querySelectorAll('.panelinput').forEach(input => {
        input.style.color = input.value;
        input.addEventListener('input', (e) => e.target.style.color = e.target.value);
    });

    document.getElementById('save_ui_btn').onclick = () => {
        configFields.forEach(f => localStorage.setItem(f.key, document.getElementById(f.id).value));
        unlockScroll(); location.reload();
    };

    // 用來暫存使用者選取的圖片檔案
    let pendingAvatarFile = null;
    let pendingCoverFile = null;

    // 處理更換頭像按鈕 (僅選檔 + 預覽)
    document.getElementById('avatar_upload_btn').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            if (e.target.files[0]) {
                pendingAvatarFile = e.target.files[0];
                // 產生本機預覽網址
                document.getElementById('avatar_img').src = URL.createObjectURL(pendingAvatarFile);
            }
        };
        input.click();
    };

    // 處理更換封面按鈕 (僅選檔 + 預覽)
    document.getElementById('cover_upload_btn').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.jpg, .jpeg, image/jpeg';
        input.onchange = e => {
            if (e.target.files[0]) {
                pendingCoverFile = e.target.files[0];
                document.getElementById("cover_container").style.backgroundImage = `url('${URL.createObjectURL(pendingCoverFile)}')`;
            }
        };
        input.click();
    };

    // 最終送出按鈕：統整文字與檔案，呼叫單一 API
    document.getElementById('save_profile_btn').onclick = async () => {
        const btn = document.getElementById('save_profile_btn');
        const nickname = document.getElementById('nickname_input').value;
        const intro = document.getElementById('intro_input').value;

        if (typeof unsafeWindow.updateMiinProfileFull === 'function') {
            btn.textContent = "上傳並儲存中...";
            btn.disabled = true;

            const success = await unsafeWindow.updateMiinProfileFull(
                nickname,
                intro,
                pendingAvatarFile,
                pendingCoverFile
            );

            if (success) {
                alert("個人資料更新成功！");
                location.reload();
            } else {
                alert("更新失敗，請檢查主控台訊息。");
                btn.textContent = "送出";
                btn.disabled = false;
            }
        } else {
            console.error("找不到 API，請確認 Profile Data 腳本已更新。");
        }
    };

    // 側邊選單注入按鈕 (呼叫全域 uploadMiinAvatar 邏輯維持不變)
    const menuObserver = new MutationObserver(() => {
        const menu = document.querySelector('[role="menu"]');
        if (!menu) return;
        const templateItem = Array.from(menu.querySelectorAll('[role="menuitem"]')).find(item => item.textContent.includes('個人電台'));

        if (templateItem && !menu.querySelector('#settings-trigger')) {
            // 👤 頭貼更換按鈕
            const aimItem = templateItem.cloneNode(true);
            aimItem.id = 'aim-trigger'; aimItem.textContent = '👤';
            aimItem.style.borderTop = '1px solid #444'; aimItem.removeAttribute('href');
            aimItem.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (panel.style.display === 'block') closePanel(false); else openPanel();
                const theme=document.getElementById('themes_setup');
                const profile=document.getElementById('profile_setup');
                theme.style.display='none';
                profile.style.display='block';
            });

            // 🎨 設定面板按鈕
            const settingsItem = templateItem.cloneNode(true);
            settingsItem.id = 'settings-trigger'; settingsItem.textContent = '🎨';
            settingsItem.style.borderTop = '1px solid #444'; settingsItem.removeAttribute('href');
            settingsItem.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();

                if (panel.style.display === 'block') closePanel(false); else openPanel();
                const theme=document.getElementById('themes_setup');
                const profile=document.getElementById('profile_setup');
                theme.style.display='block';
                profile.style.display='none';
            };

            templateItem.before(settingsItem); settingsItem.before(aimItem);
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
            } else if (item.id === 'settings-trigger' || item.id === 'aim-trigger') {
                item.dataset.processed = 'true';
            }
        });
    });

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
            e.preventDefault();
            e.stopImmediatePropagation();
            closePanel(false);
        }
    }, true);


    menuObserver.observe(document.body?document.body:document, { childList: true, subtree: true });
})();
