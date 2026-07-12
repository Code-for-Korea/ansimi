document.addEventListener("DOMContentLoaded", () => {
    let wikiData = [];
    let gitHubToken = "";
    let searchQuery = "";

    // DOM Elements
    const loginOverlay = document.getElementById("login-overlay");
    const loginForm = document.getElementById("login-form");
    const adminPasswordInput = document.getElementById("admin-password");
    const loginErrorMsg = document.getElementById("login-error-msg");
    const configWarning = document.getElementById("config-warning");
    
    const connectionStatus = document.getElementById("connection-status");
    const connectionText = document.getElementById("connection-text");
    
    const newPostBtn = document.getElementById("new-post-btn");
    const downloadDbBtn = document.getElementById("download-db-btn");
    const openEncryptorBtn = document.getElementById("open-encryptor-btn");
    const closeEncryptorBtn = document.getElementById("close-encryptor-btn");
    const encryptorContainer = document.getElementById("encryptor-container");
    
    const editorContainer = document.getElementById("editor-container");
    const editorHeading = document.getElementById("editor-heading");
    const editorForm = document.getElementById("editor-form");
    const entryIndexInput = document.getElementById("entry-index");
    const entryTitleInput = document.getElementById("entry-title");
    const entryCountryInput = document.getElementById("entry-country");
    const entryKeywordsInput = document.getElementById("entry-keywords");
    const entryUrlInput = document.getElementById("entry-url");
    const entryContentTextarea = document.getElementById("entry-content");
    const entryPreviewPane = document.getElementById("entry-preview");
    const imageUploader = document.getElementById("image-uploader");
    
    const editorCancelBtn = document.getElementById("editor-cancel-btn");
    const editorSaveBtn = document.getElementById("editor-save-btn");
    const editorPublishBtn = document.getElementById("editor-publish-btn");
    
    const encryptorForm = document.getElementById("encryptor-form");
    const rawTokenInput = document.getElementById("raw-token");
    const encryptPasswordInput = document.getElementById("encrypt-password");
    const encryptionResultBox = document.getElementById("encryption-result-box");
    const encryptedOutputTextarea = document.getElementById("encrypted-output");
    
    const cmsSearchInput = document.getElementById("cms-search");
    const totalCountText = document.getElementById("total-count");
    const cmsArticlesList = document.getElementById("cms-articles-list");

    // Initialize CMS Data from wiki-db.js global variable
    if (typeof WIKI_DATABASE !== "undefined") {
        // Deep copy data to prevent instant mutability before saving
        wikiData = JSON.parse(JSON.stringify(WIKI_DATABASE));
    } else {
        console.error("WIKI_DATABASE is missing.");
    }

    // Check configuration and show Login overlay or warning
    if (typeof CMS_CONFIG !== "undefined" && CMS_CONFIG.encryptedToken) {
        loginOverlay.style.display = "flex";
        adminPasswordInput.focus();
    } else {
        configWarning.style.display = "block";
        updateStatus(false, "오프라인 모드");
    }

    // Update connection badge status
    function updateStatus(connected, text) {
        if (connected) {
            connectionStatus.className = "status-badge connected";
            connectionText.textContent = text;
            editorPublishBtn.style.display = "inline-flex";
        } else {
            connectionStatus.className = "status-badge disconnected";
            connectionText.textContent = text;
            editorPublishBtn.style.display = "none";
        }
    }

    // Admin Password authentication & Decryption
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const password = adminPasswordInput.value;
        const encrypted = CMS_CONFIG.encryptedToken;
        
        try {
            const bytes = CryptoJS.AES.decrypt(encrypted, password);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            
            if (decrypted && (decrypted.startsWith("ghp_") || decrypted.startsWith("github_pat_"))) {
                gitHubToken = decrypted;
                loginOverlay.style.display = "none";
                loginErrorMsg.style.display = "none";
                updateStatus(true, "원격 커밋 가능 (관리자)");
            } else {
                throw new Error("Invalid decrypted token format.");
            }
        } catch (err) {
            console.error("Decryption failed:", err);
            loginErrorMsg.style.display = "block";
            adminPasswordInput.value = "";
            adminPasswordInput.focus();
        }
    });

    // Token Encryption Helper
    encryptorForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const rawToken = rawTokenInput.value.trim();
        const password = encryptPasswordInput.value;
        
        if (!rawToken.startsWith("ghp_") && !rawToken.startsWith("github_pat_")) {
            alert("깃허브 Personal Access Token은 'ghp_' 또는 'github_pat_'으로 시작해야 합니다.");
            return;
        }

        try {
            const encrypted = CryptoJS.AES.encrypt(rawToken, password).toString();
            encryptedOutputTextarea.value = encrypted;
            encryptionResultBox.style.display = "block";
        } catch (err) {
            console.error("Encryption error:", err);
            alert("암호화 생성 과정에서 오류가 발생했습니다.");
        }
    });

    // Simple Markdown to HTML preview parser
    function parseMarkdown(md) {
        if (!md) return "";
        let html = md;
        
        // Headers
        html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Quotes
        html = html.replace(/^\> (.*?)$/gm, '<blockquote>$1</blockquote>');
        
        // Lists
        let lines = html.split('\n');
        let inList = false;
        let resultLines = [];
        for (let line of lines) {
            let stripped = line.trim();
            if (stripped.startsWith('- ')) {
                if (!inList) {
                    resultLines.push('<ul>');
                    inList = true;
                }
                resultLines.push('<li>' + stripped.substring(2) + '</li>');
            } else {
                if (inList) {
                    resultLines.push('</ul>');
                    inList = false;
                }
                resultLines.push(line);
            }
        }
        if (inList) resultLines.push('</ul>');
        html = resultLines.join('\n');
        
        // Markdown Images: ![alt](url)
        html = html.replace(/\!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; height:auto; margin: 12px 0; border: 2px solid var(--line);">');

        // Markdown Links: [text](url) -> Converts to link card if raw URL
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
            if (text.startsWith('http') || text === url) {
                return `
                    <div style="margin: 12px 0; padding: 12px; background: var(--soft); border: 2px solid var(--line); display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <span style="font-size: 0.85rem; word-break: break-all;">🔗 <strong>원문:</strong> ${url}</span>
                    </div>
                `;
            }
            return `<a href="${url}" target="_blank" rel="noreferrer">${text}</a>`;
        });
        
        // Paragraphs
        lines = html.split('\n');
        let parsedLines = lines.map(line => {
            let stripped = line.trim();
            if (!stripped) return "";
            if (stripped.startsWith('<h') || stripped.startsWith('</h') || 
                stripped.startsWith('<ul') || stripped.startsWith('</ul') || 
                stripped.startsWith('<li') || stripped.startsWith('</li') ||
                stripped.startsWith('<blockquote') || stripped.startsWith('</blockquote') ||
                stripped.startsWith('<div') || stripped.startsWith('</div')) {
                return line;
            }
            return '<p>' + line + '</p>';
        });
        
        return parsedLines.join('\n');
    }

    // Live preview update
    entryContentTextarea.addEventListener("input", () => {
        entryPreviewPane.innerHTML = parseMarkdown(entryContentTextarea.value);
    });

    // Image Uploader: converts image to inline Base64 data URL
    imageUploader.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const markdownImage = `\n![${filename}](${base64})\n`;
            
            // Insert markdown image code at current cursor position
            const startPos = entryContentTextarea.selectionStart;
            const endPos = entryContentTextarea.selectionEnd;
            const oldVal = entryContentTextarea.value;
            
            entryContentTextarea.value = oldVal.substring(0, startPos) + markdownImage + oldVal.substring(endPos);
            entryContentTextarea.dispatchEvent(new Event("input")); // Trigger live preview
            
            // Reset input file value
            imageUploader.value = "";
        };
        reader.readAsDataURL(file);
    });

    // Render table listing
    function renderArticlesTable() {
        cmsArticlesList.innerHTML = "";
        
        const filtered = wikiData.filter(item => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return item.title.toLowerCase().includes(query) || 
                   item.content.toLowerCase().includes(query) || 
                   item.keywords.some(k => k.toLowerCase().includes(query));
        });

        totalCountText.textContent = filtered.length;

        if (filtered.length === 0) {
            cmsArticlesList.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 30px; color: var(--muted);">등록된 위키 문서가 없습니다.</td></tr>`;
            return;
        }

        filtered.forEach((item, index) => {
            const originalIndex = wikiData.indexOf(item);
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid rgba(23,32,38,0.15)";
            
            const keywordsHtml = item.keywords.map(k => `#${k}`).join(" ");

            tr.innerHTML = `
                <td style="padding: 12px 8px; font-weight:800;">${String(index + 1).padStart(3, '0')}</td>
                <td style="padding: 12px 8px; font-weight:900;">${item.title}</td>
                <td style="padding: 12px 8px;">${item.country}</td>
                <td style="padding: 12px 8px; color: var(--muted); font-size: 0.85rem;">${keywordsHtml}</td>
                <td style="padding: 12px 8px; text-align: right;">
                    <button class="button secondary compact-btn edit-btn" data-index="${originalIndex}" style="min-height: 28px; padding: 0 10px; font-size: 0.8rem; cursor: pointer;">수정</button>
                    <button class="button secondary compact-btn delete-btn" data-index="${originalIndex}" style="min-height: 28px; padding: 0 10px; font-size: 0.8rem; cursor: pointer; color: var(--red); border-color: var(--red);">삭제</button>
                </td>
            `;

            // Action: Edit
            tr.querySelector(".edit-btn").addEventListener("click", () => {
                openEditor(originalIndex);
            });

            // Action: Delete
            tr.querySelector(".delete-btn").addEventListener("click", () => {
                if (confirm(`"${item.title}" 문서를 정말로 삭제하시겠습니까?`)) {
                    wikiData.splice(originalIndex, 1);
                    renderArticlesTable();
                    closeEditor();
                }
            });

            cmsArticlesList.appendChild(tr);
        });
    }

    // Open editor panel
    function openEditor(index = null) {
        editorContainer.style.display = "block";
        editorContainer.scrollIntoView({ behavior: "smooth", block: "start" });

        if (index !== null) {
            const item = wikiData[index];
            editorHeading.textContent = `위키 문서 수정: ${item.title}`;
            entryIndexInput.value = index;
            entryTitleInput.value = item.title;
            entryCountryInput.value = item.country;
            entryKeywordsInput.value = item.keywords.join(", ");
            entryUrlInput.value = item.url || "";
            entryContentTextarea.value = item.content;
        } else {
            editorHeading.textContent = "새 위키 문서 작성";
            entryIndexInput.value = "";
            editorForm.reset();
            entryContentTextarea.value = "";
        }
        
        entryContentTextarea.dispatchEvent(new Event("input")); // trigger preview
    }

    function closeEditor() {
        editorContainer.style.display = "none";
        editorForm.reset();
        entryContentTextarea.value = "";
    }

    newPostBtn.addEventListener("click", () => openEditor());
    editorCancelBtn.addEventListener("click", closeEditor);

    // Temp save to RAM array
    editorForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const index = entryIndexInput.value;
        const keywords = entryKeywordsInput.value.split(",")
            .map(k => k.trim())
            .filter(k => k);
            
        // Generate description from content
        let description = "";
        const cleanContent = entryContentTextarea.value.replace(/[#*_\-\[\]\(\)]/g, "");
        const paragraphs = cleanContent.split("\n").map(p => p.trim()).filter(p => p);
        if (paragraphs.length > 0) {
            description = paragraphs[0];
            if (description.length > 150) description = description.substring(0, 150) + "...";
        } else {
            description = `${entryTitleInput.value} 관련 자료입니다.`;
        }

        const payload = {
            title: entryTitleInput.value.trim(),
            country: entryCountryInput.value.trim() || "기타",
            keywords: keywords,
            url: entryUrlInput.value.trim(),
            description: description,
            content: entryContentTextarea.value
        };

        if (index !== "") {
            wikiData[index] = payload;
        } else {
            wikiData.push(payload);
        }

        renderArticlesTable();
        closeEditor();
        alert("임시 보관함(브라우저 메모리)에 저장되었습니다. 깃허브 게시를 누르거나 다운로드해야 파일이 반영됩니다.");
    });

    // Local DB files downloader
    downloadDbBtn.addEventListener("click", () => {
        const jsonContent = JSON.stringify(wikiData, null, 4);
        const jsContent = `const WIKI_DATABASE = ${jsonContent};\n`;
        
        // Trigger JSON download
        triggerDownload(jsonContent, "wiki-db.json", "application/json");
        // Trigger JS download
        triggerDownload(jsContent, "wiki-db.js", "application/javascript");
    });

    function triggerDownload(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Realtime GitHub Commit & Publish API
    editorPublishBtn.addEventListener("click", async () => {
        if (!gitHubToken) {
            alert("인증 토큰이 누락되었습니다. 새로고침 후 다시 로그인해주세요.");
            return;
        }

        // 1. Double check form is saved to list first
        const index = entryIndexInput.value;
        const keywords = entryKeywordsInput.value.split(",")
            .map(k => k.trim())
            .filter(k => k);
        
        let description = "";
        const cleanContent = entryContentTextarea.value.replace(/[#*_\-\[\]\(\)]/g, "");
        const paragraphs = cleanContent.split("\n").map(p => p.trim()).filter(p => p);
        if (paragraphs.length > 0) {
            description = paragraphs[0];
            if (description.length > 150) description = description.substring(0, 150) + "...";
        } else {
            description = `${entryTitleInput.value} 관련 자료입니다.`;
        }

        const payload = {
            title: entryTitleInput.value.trim(),
            country: entryCountryInput.value.trim() || "기타",
            keywords: keywords,
            url: entryUrlInput.value.trim(),
            description: description,
            content: entryContentTextarea.value
        };

        if (index !== "") {
            wikiData[index] = payload;
        } else {
            wikiData.push(payload);
        }
        renderArticlesTable();

        // Disable publish button and set loading state
        editorPublishBtn.disabled = true;
        editorPublishBtn.textContent = "저장소 커밋 중... ⏳";

        try {
            const owner = CMS_CONFIG.owner;
            const repo = CMS_CONFIG.repo;
            const branch = CMS_CONFIG.branch || "main";
            
            // Format updated databases content
            const jsonContent = JSON.stringify(wikiData, null, 4);
            const jsContent = `const WIKI_DATABASE = ${jsonContent};\n`;

            // Commit JSON Database
            const jsonSha = await getFileSha(owner, repo, "assets/data/wiki-db.json", branch);
            await commitToGitHub(owner, repo, "assets/data/wiki-db.json", jsonContent, "Update wiki-db.json via Serverless CMS", jsonSha, branch);

            // Commit JS Database
            const jsSha = await getFileSha(owner, repo, "assets/data/wiki-db.js", branch);
            await commitToGitHub(owner, repo, "assets/data/wiki-db.js", jsContent, "Update wiki-db.js via Serverless CMS", jsSha, branch);

            alert("성공적으로 GitHub 저장소에 변경사항을 커밋 및 게시하였습니다! 라이브 배포가 완료되는 데 1~2분이 걸릴 수 있습니다.");
            closeEditor();
        } catch (err) {
            console.error("GitHub publish failed:", err);
            alert("게시 중 실패했습니다. 콘솔 에러로그 또는 토큰 권한을 확인해주세요: " + err.message);
        } finally {
            editorPublishBtn.disabled = false;
            editorPublishBtn.textContent = "저장소에 직접 게시 🚀";
        }
    });

    // Helper: Get GitHub File SHA
    async function getFileSha(owner, repo, path, branch) {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        const headers = {
            "Authorization": `token ${gitHubToken}`,
            "Accept": "application/vnd.github.v3+json"
        };

        try {
            const res = await fetch(url, { headers });
            if (res.status === 404) return null;
            if (!res.ok) throw new Error(`SHA Fetch error: ${res.statusText}`);
            const data = await res.json();
            return data.sha;
        } catch (err) {
            console.warn(`File ${path} might not exist yet:`, err.message);
            return null;
        }
    }

    // Helper: Commit file to GitHub contents API
    async function commitToGitHub(owner, repo, path, content, commitMessage, sha, branch) {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const headers = {
            "Authorization": `token ${gitHubToken}`,
            "Content-Type": "application/json",
            "Accept": "application/vnd.github.v3+json"
        };

        const body = {
            message: commitMessage,
            content: btoa(unescape(encodeURIComponent(content))), // Safe Base64 encoding for Unicode characters
            branch: branch
        };

        if (sha) body.sha = sha;

        const res = await fetch(url, {
            method: "PUT",
            headers,
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(`GitHub API commit failed: ${errData.message || res.statusText}`);
        }
        return res.json();
    }

    // Toggle Encryptor Container
    openEncryptorBtn.addEventListener("click", () => {
        encryptorContainer.style.display = "block";
        encryptorContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    
    closeEncryptorBtn.addEventListener("click", () => {
        encryptorContainer.style.display = "none";
        encryptorForm.reset();
        encryptionResultBox.style.display = "none";
    });

    // CMS Search binding
    cmsSearchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        renderArticlesTable();
    });

    // Initial render
    renderArticlesTable();
});
