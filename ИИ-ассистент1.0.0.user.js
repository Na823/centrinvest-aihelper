// ==UserScript==
// @name         Центр-инвест — ИИ-ассистент
// @namespace    https://www.centrinvest.ru/
// @version      1.0.0
// @description  Добавляет ИИ-ассистента на сайт Центр-инвест
// @author       AI Assistant
// @match        https://www.centrinvest.ru/*
// @match        https://centrinvest.ru/*
// @match        http://www.centrinvest.ru/*
// @match        http://centrinvest.ru/*
// @grant        GM_xmlhttpRequest
// @connect      n8n.dnsresolverproblem.space
// @connect      127.0.0.1
// @require      https://cdn.jsdelivr.net/npm/marked/marked.min.js
// @require      https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    // НАСТРОЙКИ
    // ============================================================
    const WELCOME_MESSAGE = `
Здравствуйте! 👋

Я — **виртуальный помощник банка «Центр-инвест»**.

Могу помочь вам с информацией о:
**кредитах и ипотеке**, **вкладах и счетах**, **банковских картах**, **условиях и требованиях**, **необходимых документах**, **подаче онлайн-заявки**
Задайте вопрос, и я постараюсь подобрать подходящую информацию.
`;
    const WEBHOOK_URL =
        'https://n8n.dnsresolverproblem.space/webhook/a5435758-0266-4a79-9e7f-872f3e674e85';

    const SESSION_ID_KEY = 'ci_ai_session_id';

    const SESSION_ID =
    sessionStorage.getItem('ci_ai_session_id') ||
    crypto.randomUUID();

sessionStorage.setItem(
    'ci_ai_session_id',
    SESSION_ID
);

    // Положение кнопки относительно нижнего края.
    // Чем больше число — тем выше кнопка.
    const BUTTON_BOTTOM = 213;

    // ============================================================
    // ЗАЩИТА ОТ ПОВТОРНОГО ЗАПУСКА
    // ============================================================

    if (window.__CENTRINVEST_AI_ASSISTANT__) {
        return;
    }

    window.__CENTRINVEST_AI_ASSISTANT__ = true;

    // ============================================================
    // CSS
    // ============================================================

    const style = document.createElement('style');

    style.textContent = `#ci-ai-button {
    position: fixed !important;
    right: 73px !important;
    bottom: ${BUTTON_BOTTOM}px !important;

    width: 58px !important;
    height: 58px !important;

    border-radius: 50% !important;
    border: none !important;

    background: #16864a !important;
    color: white !important;

    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    cursor: pointer !important;

    box-shadow:
        0 4px 14px rgba(0, 0, 0, 0.20),
        0 2px 5px rgba(0, 0, 0, 0.12) !important;

    z-index: 2147483646 !important;

    font-family:
        Arial,
        Helvetica,
        sans-serif !important;

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        background 0.2s ease !important;

    padding: 0 !important;
    margin: 0 !important;
}

#ci-ai-button:hover {
    transform: scale(1.06) !important;
    background: #11743f !important;

    box-shadow:
        0 6px 20px rgba(0, 0, 0, 0.25),
        0 3px 8px rgba(0, 0, 0, 0.15) !important;
}

#ci-ai-button:active {
    transform: scale(0.96) !important;
}

#ci-ai-button svg {
    width: 30px !important;
    height: 30px !important;

    display: block !important;
    pointer-events: none !important;
}


/* ========================================================
   CHAT WINDOW
======================================================== */

##ci-ai-chat {
    position: fixed !important;

    right: 24px !important;
    bottom: 90px !important;

    width: min(360px, calc(100vw - 32px)) !important;
    height: min(510px, calc(100vh - 120px)) !important;

    max-width: calc(100vw - 32px) !important;
    max-height: calc(100vh - 120px) !important;

    min-width: 280px !important;
    min-height: 350px !important;

    background: #ffffff !important;

    border-radius: 16px !important;

    box-shadow:
        0 12px 45px rgba(0, 0, 0, 0.20),
        0 3px 12px rgba(0, 0, 0, 0.10) !important;

    overflow: hidden !important;

    display: none !important;
    flex-direction: column !important;

    z-index: 2147483647 !important;

    font-family:
        Arial,
        Helvetica,
        sans-serif !important;

    border: 1px solid #e5e5e5 !important;
}

#ci-ai-chat.ci-open {
    display: flex !important;
    animation: ciChatOpen 0.20s ease-out !important;
}

@keyframes ciChatOpen {
    from {
        opacity: 0;
        transform: translateY(10px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}


/* ========================================================
   HEADER
======================================================== */

#ci-ai-header {
    height: 64px !important;
    min-height: 64px !important;

    background: #16864a !important;
    color: #ffffff !important;

    display: flex !important;
    align-items: center !important;

    padding: 0 16px !important;

    box-sizing: border-box !important;
}

#ci-ai-header-icon {
    width: 38px !important;
    height: 38px !important;

    border-radius: 50% !important;

    background: rgba(255, 255, 255, 0.18) !important;

    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    margin-right: 11px !important;

    flex-shrink: 0 !important;
}

#ci-ai-header-icon svg {
    width: 23px !important;
    height: 23px !important;
}

#ci-ai-title-container {
    flex: 1 !important;
    min-width: 0 !important;
}

#ci-ai-title {
    font-size: 16px !important;
    font-weight: 600 !important;
    line-height: 20px !important;

    color: #ffffff !important;

    margin: 0 !important;
    padding: 0 !important;
}

#ci-ai-status {
    font-size: 12px !important;
    line-height: 16px !important;

    color: rgba(255, 255, 255, 0.82) !important;

    margin-top: 1px !important;
}

#ci-ai-close {
    width: 34px !important;
    height: 34px !important;

    border: none !important;
    background: transparent !important;

    color: #ffffff !important;

    cursor: pointer !important;

    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    border-radius: 8px !important;

    padding: 0 !important;
    margin: 0 !important;

    font-size: 25px !important;
    font-weight: 300 !important;
    line-height: 1 !important;
}

#ci-ai-close:hover {
    background: rgba(255, 255, 255, 0.14) !important;
}


/* ========================================================
   MESSAGES
======================================================== */

#ci-ai-messages {
    flex: 1 !important;

    overflow-y: auto !important;
    overflow-x: hidden !important;

    padding: 16px !important;

    background: #f7f8f8 !important;

    box-sizing: border-box !important;

    scroll-behavior: smooth !important;
}

#ci-ai-messages::-webkit-scrollbar {
    width: 6px !important;
}

#ci-ai-messages::-webkit-scrollbar-track {
    background: transparent !important;
}

#ci-ai-messages::-webkit-scrollbar-thumb {
    background: #c8cfcb !important;
    border-radius: 10px !important;
}

.ci-ai-message-row {
    display: flex !important;
    width: 100% !important;

    margin-bottom: 11px !important;

    box-sizing: border-box !important;
}

.ci-ai-message-row.user {
    justify-content: flex-end !important;
}

.ci-ai-message-row.assistant {
    justify-content: flex-start !important;
}

.ci-ai-message {
    max-width: 82% !important;

    padding: 10px 13px !important;

    border-radius: 13px !important;

    font-size: 14px !important;
    line-height: 20px !important;

    word-wrap: break-word !important;
    overflow-wrap: break-word !important;

    box-sizing: border-box !important;

    white-space: pre-wrap !important;
}

.ci-ai-message-row.user .ci-ai-message {
    background: #16864a !important;
    color: #ffffff !important;

    border-bottom-right-radius: 4px !important;
}

.ci-ai-message-row.assistant .ci-ai-message {
    background: #ffffff !important;
    color: #252525 !important;

    border: 1px solid #e3e6e4 !important;

    border-bottom-left-radius: 4px !important;

    box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.04) !important;
}


/* ========================================================
   TYPING
======================================================== */

#ci-ai-typing {
    display: none !important;

    align-items: center !important;

    width: fit-content !important;

    background: #ffffff !important;

    border: 1px solid #e3e6e4 !important;

    border-radius: 13px !important;
    border-bottom-left-radius: 4px !important;

    padding: 10px 13px !important;

    margin-bottom: 10px !important;

    box-sizing: border-box !important;
}

#ci-ai-typing.ci-visible {
    display: flex !important;
}

.ci-ai-dot {
    width: 5px !important;
    height: 5px !important;

    background: #777777 !important;

    border-radius: 50% !important;

    margin: 0 2px !important;

    animation: ciTyping 1.2s infinite ease-in-out !important;
}

.ci-ai-dot:nth-child(2) {
    animation-delay: 0.15s !important;
}

.ci-ai-dot:nth-child(3) {
    animation-delay: 0.30s !important;
}

@keyframes ciTyping {
    0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.45;
    }

    30% {
        transform: translateY(-4px);
        opacity: 1;
    }
}


/* ========================================================
   INPUT
======================================================== */

#ci-ai-input-area {
    min-height: 66px !important;

    background: #ffffff !important;

    border-top: 1px solid #e7e9e8 !important;

    display: flex !important;
    align-items: flex-end !important;

    padding: 10px !important;

    box-sizing: border-box !important;
}

#ci-ai-input {
    flex: 1 !important;
    overflow: hidden !important;
    min-width: 0 !important;

    height: 42px !important;
    max-height: 100px !important;

    resize: none !important;

    border: 1px solid #d9ddda !important;
    border-radius: 10px !important;

    background: #ffffff !important;
    color: #222222 !important;

    outline: none !important;

    padding: 11px 12px !important;

    font-family:
        Arial,
        Helvetica,
        sans-serif !important;

    font-size: 14px !important;
    line-height: 19px !important;

    box-sizing: border-box !important;
}

#ci-ai-input:focus {
    border-color: #16864a !important;

    box-shadow:
        0 0 0 2px rgba(22, 134, 74, 0.10) !important;
}

#ci-ai-input::placeholder {
    color: #929292 !important;
}

#ci-ai-send {
    width: 42px !important;
    height: 42px !important;

    flex-shrink: 0 !important;

    margin-left: 8px !important;

    border: none !important;
    border-radius: 10px !important;

    background: #16864a !important;
    color: #ffffff !important;

    cursor: pointer !important;

    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    padding: 0 !important;
}

#ci-ai-send:hover {
    background: #11743f !important;
}

#ci-ai-send:disabled {
    opacity: 0.45 !important;
    cursor: default !important;
}

#ci-ai-send svg {
    width: 19px !important;
    height: 19px !important;
}


/* ========================================================
   MOBILE
======================================================== */

@media (max-width: 600px) {

    #ci-ai-button {
        right: 16px !important;
        bottom: 90px !important;

        width: 54px !important;
        height: 54px !important;
    }

    #ci-ai-chat {
        right: 10px !important;
        bottom: 154px !important;

        width: calc(100vw - 20px) !important;
        height: min(520px, calc(100vh - 180px)) !important;

        border-radius: 14px !important;
    }
}`;

    document.head.appendChild(style);

    // ============================================================
    // SVG ИКОНКИ
    // ============================================================

    const robotIcon = `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <rect
                x="5"
                y="7"
                width="14"
                height="12"
                rx="3"
                stroke="currentColor"
                stroke-width="1.8"
            />

            <path
                d="M12 3V7"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
            />

            <circle
                cx="12"
                cy="2.5"
                r="1"
                fill="currentColor"
            />

            <circle
                cx="9"
                cy="12"
                r="1.2"
                fill="currentColor"
            />

            <circle
                cx="15"
                cy="12"
                r="1.2"
                fill="currentColor"
            />

            <path
                d="M9 16H15"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
            />
        </svg>
    `;

    const sendIcon = `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M21 3L10.2 13.8"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            <path
                d="M21 3L14.2 21L10.2 13.8L3 9.8L21 3Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
            />
        </svg>
    `;

    // ============================================================
    // СОЗДАНИЕ КНОПКИ
    // ============================================================

    const button = document.createElement('button');

    button.id = 'ci-ai-button';
    button.type = 'button';
    button.title = 'ИИ-ассистент';
    button.setAttribute('aria-label', 'Открыть ИИ-ассистента');

    button.innerHTML = robotIcon;

    document.body.appendChild(button);

    // ============================================================
    // СОЗДАНИЕ CHAT
    // ============================================================

    const chat = document.createElement('div');

    chat.id = 'ci-ai-chat';

    chat.innerHTML = `
        <div id="ci-ai-header">

            <div id="ci-ai-header-icon">
                ${robotIcon}
            </div>

            <div id="ci-ai-title-container">
                <div id="ci-ai-title">
                    ИИ-ассистент
                </div>

                <div id="ci-ai-status">
                    Онлайн
                </div>
            </div>

            <button
                id="ci-ai-close"
                type="button"
                aria-label="Закрыть"
                title="Закрыть"
            >
                ×
            </button>

        </div>

        <div id="ci-ai-messages">

            <div
                id="ci-ai-typing"
                aria-hidden="true"
            >
                <span class="ci-ai-dot"></span>
                <span class="ci-ai-dot"></span>
                <span class="ci-ai-dot"></span>
            </div>

        </div>

        <div id="ci-ai-input-area">

            <textarea
                id="ci-ai-input"
                placeholder="Введите вопрос..."
                rows="1"
                maxlength="4000"
            ></textarea>

            <button
                id="ci-ai-send"
                type="button"
                title="Отправить"
                aria-label="Отправить сообщение"
            >
                ${sendIcon}
            </button>

        </div>
    `;

    document.body.appendChild(chat);

    // ============================================================
    // ELEMENTS
    // ============================================================

    const closeButton = chat.querySelector('#ci-ai-close');
    const messages = chat.querySelector('#ci-ai-messages');
    const input = chat.querySelector('#ci-ai-input');
    const sendButton = chat.querySelector('#ci-ai-send');
    const typing = chat.querySelector('#ci-ai-typing');

    let isRequestInProgress = false;

    // ============================================================
    // ОТКРЫТЬ CHAT
    // ============================================================

function openChat() {

    chat.classList.add('ci-open');

    // Восстанавливаем историю только при первом открытии
    if (!chat.dataset.historyRestored) {
        restoreChatHistory();
        chat.dataset.historyRestored = 'true';
    }

    setTimeout(() => {
        input.focus();
        scrollToBottom();
    }, 50);
}

    // ============================================================
    // ЗАКРЫТЬ CHAT
    // ============================================================

    function closeChat() {
        chat.classList.remove('ci-open');
    }

    // ============================================================
    // SCROLL
    // ============================================================

    function scrollToBottom() {
        messages.scrollTop = messages.scrollHeight;
    }

    // ============================================================
    // ДОБАВИТЬ СООБЩЕНИЕ
    // ============================================================

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


function safeUrl(url) {
    try {
        const parsed = new URL(url, window.location.origin);

        // Разрешаем только безопасные протоколы
        if (
            parsed.protocol === 'http:' ||
            parsed.protocol === 'https:'
        ) {
            return parsed.href;
        }

    } catch (error) {
        return null;
    }

    return null;
}


function renderMarkdown(text) {
    const rawHtml = marked.parse(text, {
        breaks: false,
        gfm: true
    });

    return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
            'p',
            'br',
            'strong',
            'em',
            'del',
            'a',
            'ul',
            'ol',
            'li',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'blockquote',
            'code',
            'pre',
            'table',
            'thead',
            'tbody',
            'tr',
            'th',
            'td',
            'hr'
        ],

        ALLOWED_ATTR: [
            'href',
            'target',
            'rel'
        ],

        ALLOW_DATA_ATTR: false
    });
}

function saveChatHistory() {
    const messagesData = [];

    messages.querySelectorAll('.ci-ai-message-row').forEach(row => {
        const message = row.querySelector('.ci-ai-message');

        if (!message) return;

        messagesData.push({
            type: row.classList.contains('user') ? 'user' : 'assistant',
            html: message.innerHTML
        });
    });

    sessionStorage.setItem(
        'ci_ai_chat_history',
        JSON.stringify(messagesData)
    );
}


function restoreChatHistory() {

    const saved = sessionStorage.getItem(
        'ci_ai_chat_history'
    );

    if (!saved) return;

    try {

        const messagesData = JSON.parse(saved);

        messagesData.forEach(item => {

            const row = document.createElement('div');

            row.className =
                `ci-ai-message-row ${item.type}`;

            const message =
                document.createElement('div');

            message.className = 'ci-ai-message';

            if (item.type === 'assistant') {
                message.innerHTML = item.html;
            } else {
                message.textContent = item.html;
            }

            row.appendChild(message);

            messages.insertBefore(row, typing);
        });

        scrollToBottom();

    } catch (error) {

        console.error(
            '[Центр-инвест AI] Ошибка восстановления истории:',
            error
        );

    }
}

function addMessage(text, type) {

    const row = document.createElement('div');

    row.className = `ci-ai-message-row ${type}`;

    const message = document.createElement('div');

    message.className = 'ci-ai-message';

    if (type === 'assistant') {

        message.innerHTML = renderMarkdown(text);

        // ====================================================
        // КОМПАКТНОЕ MARKDOWN-ФОРМАТИРОВАНИЕ
        // ====================================================

        // Параграфы
        message.querySelectorAll('p').forEach((el) => {
            el.style.setProperty(
                'margin',
                '0 0 4px 0',
                'important'
            );

            el.style.setProperty(
                'padding',
                '0',
                'important'
            );

            el.style.setProperty(
                'line-height',
                '19px',
                'important'
            );
        });

        // Последний параграф без нижнего отступа
        const paragraphs = message.querySelectorAll('p');

        if (paragraphs.length > 0) {
            paragraphs[paragraphs.length - 1]
                .style.setProperty(
                    'margin-bottom',
                    '0',
                    'important'
                );
        }

        // Списки
        message.querySelectorAll('ul, ol').forEach((el) => {

            el.style.setProperty(
                'margin',
                '2px 0 4px 0',
                'important'
            );

            el.style.setProperty(
                'padding-left',
                '18px',
                'important'
            );
        });

        // Элементы списка
        message.querySelectorAll('li').forEach((el) => {

            el.style.setProperty(
                'margin',
                '0',
                'important'
            );

            el.style.setProperty(
                'padding',
                '0',
                'important'
            );

            el.style.setProperty(
                'line-height',
                '19px',
                'important'
            );
        });

        // Заголовки
        message.querySelectorAll(
            'h1, h2, h3, h4, h5, h6'
        ).forEach((el) => {

            el.style.setProperty(
                'margin',
                '5px 0 3px 0',
                'important'
            );

            el.style.setProperty(
                'padding',
                '0',
                'important'
            );

            el.style.setProperty(
                'line-height',
                '20px',
                'important'
            );
        });

        // Убираем двойные переносы
        message.querySelectorAll('br + br').forEach((el) => {
            el.remove();
        });

    } else {

        message.textContent = text;
    }

    row.appendChild(message);

    messages.insertBefore(row, typing);

    saveChatHistory();

    scrollToBottom();
}

    // ============================================================
// ПРИВЕТСТВЕННОЕ СООБЩЕНИЕ
// ============================================================

const savedHistory =
    sessionStorage.getItem('ci_ai_chat_history');

if (!savedHistory) {
    addMessage(WELCOME_MESSAGE, 'assistant');
}


    // ============================================================
    // TYPING
    // ============================================================

    function showTyping() {
        typing.style.display = 'flex';
        typing.classList.add('ci-visible');

        scrollToBottom();
    }

    function hideTyping() {
        typing.classList.remove('ci-visible');
        typing.style.display = 'none';
    }

    // ============================================================
    // ОТПРАВКА В N8N
    // ============================================================

    function sendToN8N(message) {

        return new Promise((resolve, reject) => {

            GM_xmlhttpRequest({
                method: 'POST',

                url: WEBHOOK_URL,

                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },

                data: JSON.stringify({
                    message: message,
                    sessionId: SESSION_ID
                }),

                timeout: 120000,

                onload: function (response) {

                    if (
                        response.status < 200 ||
                        response.status >= 300
                    ) {
                        reject(
                            new Error(
                                `n8n вернул HTTP ${response.status}`
                            )
                        );

                        return;
                    }

                    try {

                        const data =
                            JSON.parse(response.responseText);

                        /*
                         * Поддерживаем несколько вариантов
                         * ответа n8n.
                         */

                        const answer =
                            data.answer ??
                            data.output ??
                            data.text ??
                            data.response ??
                            data.message;

                        if (
                            typeof answer === 'string' &&
                            answer.trim()
                        ) {
                            resolve(answer.trim());

                            return;
                        }

                        /*
                         * Если n8n вернул массив:
                         *
                         * [
                         *   {
                         *      "output": "..."
                         *   }
                         * ]
                         */

                        if (
                            Array.isArray(data) &&
                            data.length > 0
                        ) {

                            const item = data[0];

                            const arrayAnswer =
                                item.answer ??
                                item.output ??
                                item.text ??
                                item.response ??
                                item.message;

                            if (
                                typeof arrayAnswer === 'string' &&
                                arrayAnswer.trim()
                            ) {
                                resolve(arrayAnswer.trim());

                                return;
                            }
                        }

                        reject(
                            new Error(
                                'В ответе n8n не найден текст ответа.'
                            )
                        );

                    } catch (error) {

                        reject(
                            new Error(
                                'n8n вернул некорректный JSON.'
                            )
                        );
                    }
                },

                onerror: function () {

                    reject(
                        new Error(
                            'Не удалось подключиться к n8n.'
                        )
                    );
                },

                ontimeout: function () {

                    reject(
                        new Error(
                            'Время ожидания ответа n8n истекло.'
                        )
                    );
                }
            });

        });
    }

    // ============================================================
    // SEND MESSAGE
    // ============================================================

    async function sendMessage() {

        if (isRequestInProgress) {
            return;
        }

        const text = input.value.trim();

        if (!text) {
            return;
        }

        // Очищаем поле
        input.value = '';
        input.style.height = '42px';

        // Показываем сообщение пользователя
        addMessage(text, 'user');

        // Блокируем отправку
        isRequestInProgress = true;
        sendButton.disabled = true;
        input.disabled = true;

        showTyping();

        try {

            const answer =
                await sendToN8N(text);

            hideTyping();

            addMessage(
                answer,
                'assistant'
            );

        } catch (error) {

            console.error(
                '[Центр-инвест AI]',
                error
            );

            hideTyping();

            addMessage(
                'Не удалось получить ответ от ИИ-ассистента. Попробуйте ещё раз.',
                'assistant'
            );
        }

        isRequestInProgress = false;

        sendButton.disabled = false;
        input.disabled = false;

        input.focus();

        scrollToBottom();
    }

    // ============================================================
    // EVENTS
    // ============================================================

    button.addEventListener(
        'click',
        openChat
    );

    closeButton.addEventListener(
        'click',
        closeChat
    );

    sendButton.addEventListener(
        'click',
        sendMessage
    );

    input.addEventListener(
        'keydown',
        function (event) {

            /*
             * Enter — отправить.
             *
             * Shift + Enter — новая строка.
             */

            if (
                event.key === 'Enter' &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );

    // Автоматическое изменение высоты textarea
    input.addEventListener(
        'input',
        function () {

            this.style.height = '42px';

            this.style.height =
                Math.min(
                    this.scrollHeight,
                    100
                ) + 'px';
        }
    );

    // ============================================================
    // ГОТОВО
    // ============================================================

    console.log(
        '[Центр-инвест AI] ИИ-ассистент загружен'
    );

})();
