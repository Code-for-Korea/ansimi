document.addEventListener("DOMContentLoaded", () => {
    let wikiData = [];
    let currentFilter = "all";
    let searchQuery = "";

    const searchInput = document.getElementById("wiki-search");
    const cardsContainer = document.getElementById("wiki-cards-container");
    const tagButtons = document.querySelectorAll(".wiki-tag-btn");
    const modal = document.getElementById("wiki-modal");
    const modalClose = document.getElementById("modal-close");

    // Load wiki database from global WIKI_DATABASE (bypasses local file CORS block)
    if (typeof WIKI_DATABASE !== "undefined") {
        wikiData = WIKI_DATABASE;
        
        // Parse URL params for pre-applied tag or query
        const urlParams = new URLSearchParams(window.location.search);
        const tagParam = urlParams.get('tag');
        const qParam = urlParams.get('q');
        
        if (tagParam) {
            currentFilter = tagParam;
            tagButtons.forEach(btn => {
                if (btn.getAttribute("data-filter") === tagParam) {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            });
        }
        
        if (qParam) {
            searchQuery = qParam;
            if (searchInput) {
                searchInput.value = qParam;
            }
        }
        
        renderCards();
    } else {
        console.error("WIKI_DATABASE is not defined.");
        cardsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--red);"><strong>데이터를 로드하는 데 실패했습니다. (데이터 파일 누락)</strong></div>`;
    }

    // Simple Markdown to HTML parser
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
        // Group list items
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
        if (inList) {
            resultLines.push('</ul>');
        }
        html = resultLines.join('\n');
        
        // Markdown Images: ![alt](url)
        html = html.replace(/\!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="wiki-content-img" style="display:block; max-width:100%; height:auto; margin: 16px 0; border: 3px solid var(--line); box-shadow: var(--shadow);">');

        // Markdown Links: [text](url) - formats raw URLs into beautiful link cards
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
            if (text.startsWith('http') || text === url) {
                return `
                    <div class="wiki-link-card" style="margin: 16px 0; padding: 16px; background: var(--soft); border: 3px solid var(--line); box-shadow: var(--shadow); display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 1.5rem;">🔗</span>
                            <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                                <strong style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px;">참고 원문 링크</strong>
                                <span style="font-size: 0.9rem; font-weight: 800; word-break: break-all; color: var(--ink);">${url}</span>
                            </div>
                        </div>
                        <a href="${url}" target="_blank" rel="noreferrer" class="button secondary" style="min-height: 38px; padding: 0 14px; font-size: 0.85rem; border: 2px solid var(--line); display: inline-flex; align-items: center; justify-content: center; height: fit-content; text-decoration: none;">원문 방문 ↗</a>
                    </div>
                `;
            }
            return `<a href="${url}" target="_blank" rel="noreferrer">${text}</a>`;
        });
        
        // Handle paragraphs for lines not starting/ending with block elements
        lines = html.split('\n');
        let parsedLines = lines.map(line => {
            let stripped = line.trim();
            if (!stripped) return "";
            if (stripped.startsWith('<h') || stripped.startsWith('</h') || 
                stripped.startsWith('<ul') || stripped.startsWith('</ul') || 
                stripped.startsWith('<li') || stripped.startsWith('</li') ||
                stripped.startsWith('<blockquote') || stripped.startsWith('</blockquote')) {
                return line;
            }
            return '<p>' + line + '</p>';
        });
        
        return parsedLines.join('\n');
    }

    // Render wiki cards
    function renderCards() {
        cardsContainer.innerHTML = "";
        
        const filtered = wikiData.filter(item => {
            // Filter by Tag
            let matchesTag = true;
            if (currentFilter !== "all") {
                if (["한국", "일본", "미국", "국제"].includes(currentFilter)) {
                    matchesTag = item.country.includes(currentFilter);
                } else {
                    matchesTag = item.keywords.some(k => k.includes(currentFilter)) || 
                                 item.title.includes(currentFilter);
                }
            }
            
            // Filter by Search Query
            let matchesSearch = true;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const titleMatch = item.title.toLowerCase().includes(query);
                const descMatch = item.description.toLowerCase().includes(query);
                const contentMatch = item.content.toLowerCase().includes(query);
                const keywordMatch = item.keywords.some(k => k.toLowerCase().includes(query));
                matchesSearch = titleMatch || descMatch || contentMatch || keywordMatch;
            }
            
            return matchesTag && matchesSearch;
        });

        if (filtered.length === 0) {
            cardsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted); font-size: 1.1rem; font-weight: 800;">검색 결과가 없습니다.</div>`;
            return;
        }

        // Card rotations list
        const rotations = ["rot-left", "rot-right", "rot-slight", ""];

        filtered.forEach((item, index) => {
            const card = document.createElement("div");
            const rotClass = rotations[index % rotations.length];
            card.className = `wiki-card clickable-card ${rotClass}`;
            
            const keywordsHtml = item.keywords.map(k => `<span class="wiki-card-tag">#${k}</span>`).join(" ");
            const countryBadge = item.country && item.country !== "기타" ? `<span class="wiki-card-country">${item.country}</span>` : "";

            card.innerHTML = `
                <div class="wiki-card-meta">
                    <span>ARCHIVE NODE ${String(index + 1).padStart(3, '0')}</span>
                    ${countryBadge}
                </div>
                <h3 class="wiki-card-title">${item.title}</h3>
                <p class="wiki-card-desc">${item.description}</p>
                <div class="wiki-card-footer">
                    <div class="wiki-card-tags">${keywordsHtml}</div>
                    <span class="wiki-read-btn">필드노트 읽기 →</span>
                </div>
            `;

            // Open Modal on Click
            card.addEventListener("click", () => {
                openWikiModal(item);
            });

            cardsContainer.appendChild(card);
        });
    }

    // Modal Operations
    function openWikiModal(item) {
        document.getElementById("modal-title").textContent = item.title;
        document.getElementById("modal-country").textContent = `국가: ${item.country || '미지정'}`;
        document.getElementById("modal-keywords").textContent = `키워드: ${item.keywords.join(', ') || '없음'}`;
        
        const parsedHtml = parseMarkdown(item.content);
        document.getElementById("modal-body").innerHTML = parsedHtml;

        const extLink = document.getElementById("modal-external-link");
        if (item.url) {
            extLink.href = item.url;
            extLink.style.display = "inline-flex";
        } else {
            extLink.style.display = "none";
        }

        modal.style.display = "flex";
        document.body.style.overflow = "hidden"; // Disable background scrolling
    }

    function closeWikiModal() {
        modal.style.display = "none";
        document.body.style.overflow = ""; // Enable background scrolling
    }

    modalClose.addEventListener("click", closeWikiModal);
    
    // Close modal when clicking outside content area
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeWikiModal();
        }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "flex") {
            closeWikiModal();
        }
    });

    // Search events
    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        renderCards();
    });

    // Filter Tag Button events
    tagButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tagButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            renderCards();
        });
    });
});
