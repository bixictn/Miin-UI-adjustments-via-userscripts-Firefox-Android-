// ==UserScript==
// @name         Miin Profile Data
// @version      0.1.0
// @match        https://miin.cc/*
// @description  Miin Profile Data
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      api.miin.cc
// @connect      storage.googleapis.com
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20Profile%20Data.js
// @downloadURL  https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20Profile%20Data.js
// ==/UserScript==

(function() {
    'use strict';

    function getMiinToken() {
        if (typeof unsafeWindow.validToken !== 'undefined' && unsafeWindow.validToken) {
            return unsafeWindow.validToken;
        }
        const cookies = document.cookie.split(';');
        const targetCookies = cookies.map(c => c.trim()).filter(c => c.startsWith('miin-auth='));
        if (targetCookies.length > 0) return targetCookies.pop().substring(10);
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // 內部封裝：處理 GCP 圖片上傳的通用函式 (type: 'avatar' 或 'cover')
    async function uploadImageToGCS(imageFile, type, token) {
        const uploadEndpoint = `https://api.miin.cc/mobile/v4/user/profile/${type}:upload`;

        console.log(`[GCS] 1. 申請 ${type} 上傳通行證...`);
        const authRes = await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST", url: uploadEndpoint,
                headers: {
                    "authorization": `Bearer ${token}`, "accept": "application/json",
                    "x-request-id": generateUUID(), "x-session-id": generateUUID(),
                    "x-accept-language": "zh-hant", "x-user-agent": "Miin/Android-4.9.9",
                    "content-type": "application/json; charset=UTF-8", "user-agent": "okhttp/4.12.0"
                },
                data: JSON.stringify({ "mimeType": imageFile.type || "image/jpeg", "supportedProviders": ["GCS"] }),
                anonymous: true, onload: resolve, onerror: reject
            });
        });

        if (authRes.status !== 200 && authRes.status !== 201) throw new Error(`${type} 申請通行證失敗`);
        const authData = JSON.parse(authRes.responseText);
        const { uploadUrl, uploadKey, requiredHeaders } = authData.asset;

        console.log(`[GCS] 2. 直傳 ${type} 至 GCS...`);
        const uploadHeaders = {};
        requiredHeaders.forEach(h => uploadHeaders[h.key] = h.value);

        const uploadReq = await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "PUT", url: uploadUrl, headers: uploadHeaders, data: imageFile, anonymous: true,
                onload: resolve, onerror: reject
            });
        });

        if (uploadReq.status !== 200) throw new Error(`${type} GCS 上傳失敗`);
        console.log(`[GCS] ✅ ${type} 上傳完成，取得 Key: ${uploadKey}`);
        return uploadKey;
    }

    // 🌟 核心 API：接收文字與檔案，統一進行處理
    unsafeWindow.updateMiinProfileFull = async function(nickname, intro, avatarFile, coverFile) {
        const token = getMiinToken();
        if (!token) {
            console.error("❌ 找不到 Token");
            return false;
        }

        const payload = { fieldMask: [] };

        try {
            // 處理純文字
            if (nickname !== null && nickname !== undefined) {
                payload.nickname = nickname;
                payload.fieldMask.push("nickname");
            }
            if (intro !== null && intro !== undefined) {
                payload.intro = intro;
                payload.fieldMask.push("intro");
            }

            // 平行處理圖片上傳 (如果有的話)
            const uploadPromises = [];
            if (avatarFile) {
                uploadPromises.push(uploadImageToGCS(avatarFile, 'avatar', token).then(key => {
                    payload.avatarKey = key;
                    payload.fieldMask.push("avatarKey");
                }));
            }
            if (coverFile) {
                uploadPromises.push(uploadImageToGCS(coverFile, 'cover', token).then(key => {
                    payload.coverKey = key;
                    payload.fieldMask.push("coverKey");
                }));
            }

            // 等待所有圖片上傳完畢
            await Promise.all(uploadPromises);

            if (payload.fieldMask.length === 0) return true; // 沒東西要改

            console.log("3. 發送最終 PATCH 綁定資料...", payload);
            const res = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "PATCH", url: "https://api.miin.cc/mobile/v4/user/profile",
                    headers: {
                        "authorization": `Bearer ${token}`, "content-type": "application/json; charset=UTF-8",
                        "x-user-agent": "Miin/Android-4.9.9", "user-agent": "okhttp/4.12.0"
                    },
                    data: JSON.stringify(payload),
                    onload: resolve, onerror: reject
                });
            });

            if (res.status === 200 || res.status === 204) {
                console.log("🎉 個人資料全面更新成功！");
                return true;
            } else {
                throw new Error(`PATCH 失敗: ${res.status}`);
            }

        } catch (err) {
            console.error("❌ 更新流程中斷:", err);
            return false;
        }
    };
})();
