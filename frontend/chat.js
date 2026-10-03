// ════════════════════════════════════════
// AI Chat — Netlify + Groq Version
// ════════════════════════════════════════

let conversations = {};
let currentChatId = null;
let currentModel = "llama-3.1-70b-versatile";
let isGenerating = false;
let sidebarOpen = true;

// ── Init ──────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    loadConversations();
    loadModels();
    newChat();
});

// ── Chat Management ───────────────────
function newChat() {
    const id = "chat_" + Date.now();
    conversations[id] = {
        id,
        title: "گفتوگۆی نوێ",
        messages: [],
        model: currentModel
    };
    currentChatId = id;
    saveConversations();
    renderChatHistory();
    clearMessages();
}

function changeModel(model) {
    currentModel = model;
    const label = document.getElementById("modelSelect").selectedOptions[0]?.text || model;
    document.getElementById("currentModelLabel").textContent = label.replace(" ⭐", "");
    if (currentChatId) {
        conversations[currentChatId].model = model;
        saveConversations();
    }
}

function clearMessages() {
    const container = document.getElementById("messagesContainer");
    container.innerHTML = `
        <div class="welcome-screen" id="welcomeScreen">
            <div class="welcome-icon">🤖</div>
            <h1>AI Chat</h1>
            <p>پرسیارێک بکە — وەڵامی دەدات!</p>
            <div class="suggestions">
                <button onclick="sendSuggestion('سڵاو، خۆت بناسێنە')">سڵاو، خۆت بناسێنە</button>
                <button onclick="sendSuggestion('Python چییە؟')">Python چییە؟</button>
                <button onclick="sendSuggestion('کۆدی Hello World بنووسە')">کۆدی Hello World</button>
                <button onclick="sendSuggestion('Explain quantum computing simply')">Quantum Computing</button>
                <button onclick="sendSuggestion('یەک چیرۆکی کورد بنووسە')">یەک چیرۆکی کورد</button>
                <button onclick="sendSuggestion('باشترین زمانی پرۆگرامنووسی چییە؟')">باشترین زمان؟</button>
            </div>
        </div>`;
}

// ── Send Message ──────────────────────
async function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (!text || isGenerating) return;

    const welcome = document.getElementById("welcomeScreen");
    if (welcome) welcome.remove();

    const chat = conversations[currentChatId];
    chat.messages.push({ role: "user", content: text });

    if (chat.title === "گفتوگۆی نوێ") {
        chat.title = text.substring(0, 40);
        renderChatHistory();
    }

    appendMessage("user", text);
    input.value = "";
    input.style.height = "auto";
    saveConversations();

    const typingId = "typing_" + Date.now();
    appendTypingIndicator(typingId);
    isGenerating = true;
    toggleSendBtn(true);

    let aiText = "";
    let msgElement = null;

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: chat.messages,
                model: currentModel
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;

                try {
                    const data = JSON.parse(jsonStr);

                    if (data.error) {
                        removeElement(typingId);
                        appendMessage("ai", `❌ هەڵە: ${data.error}`);
                        break;
                    }

                    if (data.content) {
                        if (!msgElement) {
                            removeElement(typingId);
                            msgElement = appendMessage("ai", "");
                        }
                        aiText += data.content;
                        updateMessageContent(msgElement, aiText);
                        scrollToBottom();
                    }

                    if (data.done) {
                        chat.messages.push({ role: "assistant", content: aiText });
                        saveConversations();
                    }
                } catch {}
            }
        }
    } catch (err) {
        removeElement(typingId);
        appendMessage("ai", `❌ کێشە: ${err.message}`);
    }

    if (!msgElement) removeElement(typingId);
    isGenerating = false;
    toggleSendBtn(false);
    scrollToBottom();
}

function sendSuggestion(text) {
    document.getElementById("userInput").value = text;
    sendMessage();
}

function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function autoResize(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
}

// ── DOM Helpers ───────────────────────
function appendMessage(role, content) {
    const container = document.getElementById("messagesContainer");
    const msgId = "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2);

    const div = document.createElement("div");
    div.className = `message ${role}`;
    div.id = msgId;
    div.innerHTML = `
        <div class="message-avatar">${role === "user" ? "👤" : "🤖"}</div>
        <div class="message-content">
            <div class="message-bubble"></div>
            ${role === "ai" ? `
            <div class="message-actions">
                <button class="action-btn" onclick="copyMessage('${msgId}')">📋 کۆپی</button>
                <button class="action-btn" onclick="regenerate()">🔄 دووبارە</button>
            </div>` : ""}
        </div>`;

    container.appendChild(div);
    if (content) updateMessageContent(div, content);
    scrollToBottom();
    return div;
}

function updateMessageContent(el, content) {
    const bubble = el.querySelector(".message-bubble");
    bubble.innerHTML = formatMessage(content);
}

function formatMessage(text) {
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
        `<pre><code class="${lang}">${escapeHtml(code.trim())}</code></pre>`
    );
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    text = text.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    text = text.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    text = text.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    text = text.replace(/\n/g, "<br>");
    return text;
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function appendTypingIndicator(id) {
    const container = document.getElementById("messagesContainer");
    const div = document.createElement("div");
    div.className = "message ai";
    div.id = id;
    div.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>`;
    container.appendChild(div);
    scrollToBottom();
}

function removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollToBottom() {
    const c = document.getElementById("messagesContainer");
    c.scrollTop = c.scrollHeight;
}

function toggleSendBtn(disabled) {
    const btn = document.getElementById("sendBtn");
    btn.disabled = disabled;
    document.getElementById("sendIcon").textContent = disabled ? "⏹" : "➤";
    btn.onclick = disabled
        ? () => { isGenerating = false; }
        : sendMessage;
}

// ── Copy / Regenerate ─────────────────
function copyMessage(msgId) {
    const el = document.getElementById(msgId);
    if (!el) return;
    const text = el.querySelector(".message-bubble").innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = el.querySelector(".action-btn");
        const orig = btn.textContent;
        btn.textContent = "✅ کۆپیکرا";
        setTimeout(() => btn.textContent = orig, 2000);
    });
}

async function regenerate() {
    const chat = conversations[currentChatId];
    if (!chat || chat.messages.length === 0) return;
    if (chat.messages[chat.messages.length - 1].role === "assistant") {
        chat.messages.pop();
    }
    const msgs = document.querySelectorAll(".message.ai");
    if (msgs.length > 0) msgs[msgs.length - 1].remove();
    isGenerating = false;
    await sendMessage();
}

// ── Sidebar ───────────────────────────
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle("hidden", !sidebarOpen);
}

function renderChatHistory() {
    const history = document.getElementById("chatHistory");
    history.innerHTML = "";
    Object.values(conversations).reverse().forEach(chat => {
        const item = document.createElement("div");
        item.className = `history-item ${chat.id === currentChatId ? "active" : ""}`;
        item.textContent = "💬 " + chat.title;
        item.onclick = () => loadChat(chat.id);
        history.appendChild(item);
    });
}

function loadChat(id) {
    currentChatId = id;
    const chat = conversations[id];
    clearMessages();
    if (chat.messages.length > 0) {
        const welcome = document.getElementById("welcomeScreen");
        if (welcome) welcome.remove();
        chat.messages.forEach(m => appendMessage(m.role, m.content));
    }
    currentModel = chat.model || "llama-3.1-70b-versatile";
    document.getElementById("modelSelect").value = currentModel;
    renderChatHistory();
}

// ── Storage ───────────────────────────
function saveConversations() {
    try { localStorage.setItem("ai_chats", JSON.stringify(conversations)); } catch {}
}
function loadConversations() {
    try {
        const s = localStorage.getItem("ai_chats");
        if (s) conversations = JSON.parse(s);
    } catch {}
}

// ── Models ────────────────────────────
async function loadModels() {
    try {
        const res = await fetch("/api/models");
        const data = await res.json();
        if (data.models?.length) {
            const select = document.getElementById("modelSelect");
            select.innerHTML = data.models
                .map(m => `<option value="${m.id}">${m.label}</option>`)
                .join("");
        }
    } catch {}
}

// ── Theme ─────────────────────────────
function toggleTheme() {
    const body = document.body;
    const btn = document.querySelector(".theme-toggle");
    if (body.classList.contains("dark-mode")) {
        body.classList.replace("dark-mode", "light-mode");
        btn.textContent = "🌙 تاریک";
    } else {
        body.classList.replace("light-mode", "dark-mode");
        btn.textContent = "☀️ ڕووناک";
    }
}
