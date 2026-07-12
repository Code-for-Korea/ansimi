const header = document.querySelector(".site-header");

const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
        const selector = anchor.getAttribute("href");
        if (!selector || selector === "#") return;
        const target = document.querySelector(selector);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});
document.querySelectorAll(".project-card, .wide-card, .log-card").forEach((card) => {
    const link = card.querySelector("a[href]");
    if (!link) return;

    const label = card.querySelector("h2, h3")?.textContent?.trim() || link.textContent.trim() || "자세히 보기";
    card.classList.add("clickable-card");
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", label);

    card.addEventListener("click", (event) => {
        if (event.target.closest("a, button, input, textarea, select")) return;
        if (link.target === "_blank") {
            window.open(link.href, "_blank", "noopener");
            return;
        }
        window.location.href = link.href;
    });

    card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        link.click();
    });
});

const contactForm = document.querySelector("#contact-form");
const contactBody = document.querySelector("#contact-body");

if (contactForm && contactBody) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const body = contactBody.value.trim();
        const subject = encodeURIComponent("안심이 참여 문의");
        const message = encodeURIComponent(body);
        window.location.href = `mailto:ansim@codefor.kr?subject=${subject}&body=${message}`;
    });
}
// Defensive cleanup for cached listing-page markup.
document.querySelectorAll('.nav-links a[href*="#contact"]').forEach((link) => link.remove());

if (location.pathname.endsWith('/projects/') || location.pathname.endsWith('/projects/index.html') || location.pathname.endsWith('/blog.html')) {
    document.querySelectorAll('.sub-hero.fluid-subhero').forEach((section) => section.remove());
}

// Custom Cursor Tracking (Home Screen Only)
const initCustomCursor = () => {
    document.body.classList.add("has-custom-cursor");
    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    cursor.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22H22L12 2Z" fill="#f0b429" stroke="#172026" stroke-width="2" stroke-linejoin="round"/>
            <rect x="11" y="9" width="2" height="6" fill="#172026" rx="1"/>
            <circle cx="12" cy="18" r="1" fill="#172026"/>
        </svg>
    `;
    document.body.appendChild(cursor);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let isVisible = false;

    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!isVisible) {
            cursor.style.opacity = "1";
            isVisible = true;
        }
    });

    document.addEventListener("mouseleave", (e) => {
        if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
            cursor.style.opacity = "0";
            isVisible = false;
        }
    });

    const animate = () => {
        const ease = 0.18;
        cursorX += (mouseX - cursorX) * ease;
        cursorY += (mouseY - cursorY) * ease;
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    const hoverElements = "a, button, [role='link'], .clickable-card, input, textarea, select, #start-simulation-btn, #start-simulation-btn-2";
    document.addEventListener("mouseover", (e) => {
        if (e.target.closest(hoverElements)) {
            cursor.classList.add("cursor-hover");
        }
    });
    document.addEventListener("mouseout", (e) => {
        if (!e.target.closest(hoverElements)) {
            cursor.classList.remove("cursor-hover");
        }
    });
};

// Check if current page is the homepage
const isHomepage = window.location.pathname.includes("index.html") || 
                   (!window.location.pathname.includes(".html") && !window.location.pathname.includes("/projects") && !window.location.pathname.includes("/blog") && !window.location.pathname.includes("/wiki"));

if (isHomepage && window.matchMedia("(pointer: fine)").matches) {
    initCustomCursor();
}

// Scroll-triggered Text Highlighter
const initScrollHighlighter = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("highlight-active");
            }
        });
    }, { threshold: 0.25 });

    document.querySelectorAll(".scroll-highlight-trigger").forEach((el) => {
        observer.observe(el);
    });
};

// Initialize interactive elements on DOMContentLoaded
const initAll = () => {
    initScrollHighlighter();
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
} else {
    initAll();
}