/*!
 * Vikram Psychic – Chatbot Widget
 * Conversation flow:
 *   1. Bot greets: "Hi! 🔮 How may I help you today?"
 *   2. User types / submits free text → Bot shows service options
 *   3. User picks an option → Bot asks for full name
 *   4. Bot asks for NY mobile number (validates +1 or 10-digit US)
 *   5. Bot asks "What do you need?" (free text)
 *   6. User replies → Small popup "My admin will connect with you shortly…"
 */

(function () {
  'use strict';

  /* ─────────────── Inject CSS ─────────────── */
  var style = document.createElement('style');
  style.textContent = `
    /* ====== Chatbot Widget ====== */
    #vp-chat-launcher {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff7a00, #c0392b);
      border: none;
      cursor: pointer;
      box-shadow: 0 6px 24px rgba(255,122,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    #vp-chat-launcher:hover {
      transform: scale(1.08);
      box-shadow: 0 10px 32px rgba(255,122,0,0.65);
    }
    #vp-chat-launcher svg { fill: #fff; width: 28px; height: 28px; }

    /* Pulse ring */
    #vp-chat-launcher::before {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 2px solid rgba(255,122,0,0.5);
      animation: vp-pulse 2s ease-out infinite;
    }
    @keyframes vp-pulse {
      0%   { transform: scale(1);   opacity: 1; }
      70%  { transform: scale(1.35); opacity: 0; }
      100% { transform: scale(1.35); opacity: 0; }
    }

    /* Unread badge */
    #vp-chat-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #e74c3c;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    }

    /* ─── Window ─── */
    #vp-chat-window {
      position: fixed;
      bottom: 100px;
      right: 28px;
      width: 360px;
      max-height: 540px;
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.22);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 99998;
      font-family: 'Segoe UI', Arial, sans-serif;
      transform: scale(0.85) translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), opacity 0.3s ease;
    }
    #vp-chat-window.vp-open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    /* Header */
    #vp-chat-header {
      background: linear-gradient(135deg, #0a2a45, #163a5b);
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      flex-shrink: 0;
    }
    .vp-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff7a00, #e84000);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .vp-hdr-text h4 { margin: 0; font-size: 15px; font-weight: 700; }
    .vp-hdr-text p  { margin: 0; font-size: 11px; opacity: 0.75; }
    .vp-status-dot  { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #2ecc71; margin-right: 4px; }
    #vp-chat-close  { margin-left: auto; background: none; border: none; color: rgba(255,255,255,0.7); font-size: 22px; cursor: pointer; line-height: 1; padding: 0; }
    #vp-chat-close:hover { color: #fff; }

    /* Messages area */
    #vp-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f5f7fa;
      scroll-behavior: smooth;
    }
    #vp-chat-messages::-webkit-scrollbar { width: 4px; }
    #vp-chat-messages::-webkit-scrollbar-thumb { background: #d0d5dd; border-radius: 4px; }

    /* Bubbles */
    .vp-bubble {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
      animation: vp-fadein 0.25s ease;
    }
    @keyframes vp-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .vp-bot  { background: #fff; color: #1a1a2e; border-radius: 4px 16px 16px 16px; align-self: flex-start; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .vp-user { background: linear-gradient(135deg, #ff7a00, #c0392b); color: #fff; border-radius: 16px 4px 16px 16px; align-self: flex-end; }

    /* Typing indicator */
    .vp-typing { display: flex; gap: 5px; padding: 12px 14px; align-self: flex-start; background: #fff; border-radius: 4px 16px 16px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .vp-typing span { width: 8px; height: 8px; border-radius: 50%; background: #ff7a00; animation: vp-bounce 1.2s infinite; }
    .vp-typing span:nth-child(2) { animation-delay: 0.2s; }
    .vp-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes vp-bounce { 0%,80%,100% { transform: scale(1); opacity: 0.5; } 40% { transform: scale(1.4); opacity: 1; } }

    /* Option buttons */
    .vp-options { display: flex; flex-direction: column; gap: 8px; align-self: flex-start; width: 100%; max-width: 82%; }
    .vp-option-btn {
      background: #fff;
      border: 1.5px solid #e2e8f0;
      border-radius: 50px;
      padding: 9px 16px;
      font-size: 13.5px;
      color: #0a2a45;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: inherit;
    }
    .vp-option-btn::before { content: '○'; color: #ff7a00; font-size: 12px; }
    .vp-option-btn:hover { background: #fff8f2; border-color: #ff7a00; color: #ff7a00; }
    .vp-option-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Input area */
    #vp-chat-input-area {
      display: flex;
      gap: 8px;
      padding: 12px 14px;
      border-top: 1px solid #e8ecf0;
      background: #fff;
      flex-shrink: 0;
    }
    #vp-chat-input {
      flex: 1;
      border: 1.5px solid #e2e8f0;
      border-radius: 50px;
      padding: 9px 16px;
      font-size: 14px;
      outline: none;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    #vp-chat-input:focus { border-color: #ff7a00; }
    #vp-chat-send {
      background: linear-gradient(135deg, #ff7a00, #c0392b);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }
    #vp-chat-send:hover { transform: scale(1.1); }
    #vp-chat-send svg { fill: #fff; width: 16px; height: 16px; }

    /* ─── Thank You / Admin Popup ─── */
    #vp-thankyou-popup {
      position: fixed;
      bottom: 110px;
      right: 28px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.2);
      padding: 20px 24px;
      max-width: 310px;
      z-index: 100000;
      font-family: 'Segoe UI', Arial, sans-serif;
      display: none;
      animation: vp-popup-in 0.4s cubic-bezier(.34,1.56,.64,1);
      border-top: 4px solid #ff7a00;
    }
    @keyframes vp-popup-in { from { opacity: 0; transform: translateY(20px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
    #vp-thankyou-popup .vp-popup-icon { font-size: 32px; text-align: center; margin-bottom: 10px; }
    #vp-thankyou-popup h3 { margin: 0 0 6px; font-size: 16px; color: #0a2a45; font-weight: 700; text-align: center; }
    #vp-thankyou-popup p  { margin: 0; font-size: 13px; color: #555; text-align: center; line-height: 1.5; }
    #vp-popup-close-btn {
      display: block;
      margin: 14px auto 0;
      background: linear-gradient(135deg, #ff7a00, #c0392b);
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 8px 22px;
      font-size: 13px;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.2s;
    }
    #vp-popup-close-btn:hover { opacity: 0.9; }

    /* Mobile */
    @media (max-width: 420px) {
      #vp-chat-window { width: calc(100vw - 20px); right: 10px; bottom: 90px; }
      #vp-chat-launcher { bottom: 18px; right: 18px; }
      #vp-thankyou-popup { right: 10px; max-width: calc(100vw - 20px); }
    }
  `;
  document.head.appendChild(style);

  /* ─────────────── Build HTML ─────────────── */
  var html = `
    <!-- Launcher -->
    <button id="vp-chat-launcher" aria-label="Open chat">
      <span id="vp-chat-badge">1</span>
      <svg viewBox="0 0 512 512"><path d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.4-2.8 5.9-1.5 8.9S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4C181.9 440.9 218.4 448 256 448c141.4 0 256-93.1 256-208S397.4 32 256 32z"/></svg>
    </button>

    <!-- Chat Window -->
    <div id="vp-chat-window" role="dialog" aria-label="Chat with Vikram Psychic">
      <div id="vp-chat-header">
        <div class="vp-avatar">🔮</div>
        <div class="vp-hdr-text">
          <h4>Vikram Psychic</h4>
          <p><span class="vp-status-dot"></span>Online – Usually replies instantly</p>
        </div>
        <button id="vp-chat-close" aria-label="Close chat">×</button>
      </div>
      <div id="vp-chat-messages"></div>
      <div id="vp-chat-input-area">
        <input id="vp-chat-input" type="text" placeholder="Type your message…" autocomplete="off" maxlength="300">
        <button id="vp-chat-send" aria-label="Send">
          <svg viewBox="0 0 512 512"><path d="M476 3.2L12.5 270.6c-18.1 10.4-15.8 35.6 2.2 43.2L121 358.4l287.3-253.2c5.5-4.9 13.3 2.6 8.6 8.3L176 407v80.5c0 23.6 28.5 32.9 42.5 15.8L282 426l124.6 52.2c14.2 6 30.4-2.9 33-18.2l72-432C515 7.8 493.3-6.8 476 3.2z"/></svg>
        </button>
      </div>
    </div>

    <!-- Thank-you popup -->
    <div id="vp-thankyou-popup" role="alert">
      <div class="vp-popup-icon">✨</div>
      <h3>Thank You!</h3>
      <p>My admin will connect with you shortly.<br>Thank you for visiting our website!</p>
      <button id="vp-popup-close-btn">Got it!</button>
    </div>
  `;

  var wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  /* ─────────────── State Machine ─────────────── */
  var STEP = {
    INIT: 0,          // Show greeting
    WAITING_REPLY: 1, // User typed anything → show options
    PICK_OPTION: 2,   // Waiting for option selection
    ASK_NAME: 3,
    ASK_PHONE: 4,
    ASK_NEED: 5,
    DONE: 6
  };

  var state = {
    step: STEP.INIT,
    selectedOption: '',
    name: '',
    phone: '',
    need: ''
  };

  var SERVICE_OPTIONS = [
    'Psychic Reading',
    'Book Appointment',
    'Love Reading',
    'Vedic Astrology',
    'Contact Us'
  ];

  /* ─────────────── DOM refs ─────────────── */
  var launcher = document.getElementById('vp-chat-launcher');
  var chatWindow = document.getElementById('vp-chat-window');
  var closeBtn = document.getElementById('vp-chat-close');
  var messages = document.getElementById('vp-chat-messages');
  var input = document.getElementById('vp-chat-input');
  var sendBtn = document.getElementById('vp-chat-send');
  var badge = document.getElementById('vp-chat-badge');
  var popup = document.getElementById('vp-thankyou-popup');
  var popupClose = document.getElementById('vp-popup-close-btn');

  /* ─────────────── Helpers ─────────────── */
  function scrollBottom() {
    setTimeout(function () { messages.scrollTop = messages.scrollHeight; }, 50);
  }

  function addBubble(text, who) {
    var el = document.createElement('div');
    el.className = 'vp-bubble ' + (who === 'bot' ? 'vp-bot' : 'vp-user');
    el.textContent = text;
    messages.appendChild(el);
    scrollBottom();
    return el;
  }

  function showTyping(callback, delay) {
    delay = delay || 900;
    var t = document.createElement('div');
    t.className = 'vp-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(t);
    scrollBottom();
    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
      callback();
    }, delay);
  }

  function botSay(text, delay) {
    showTyping(function () { addBubble(text, 'bot'); }, delay);
  }

  function showOptions() {
    var wrapper = document.createElement('div');
    wrapper.className = 'vp-options';
    SERVICE_OPTIONS.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'vp-option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', function () {
        // Disable all option buttons
        wrapper.querySelectorAll('.vp-option-btn').forEach(function (b) { b.disabled = true; });
        // Echo user choice
        addBubble(opt, 'user');
        state.selectedOption = opt;
        state.step = STEP.ASK_NAME;
        botSay("Great choice! 😊 May I know your full name, please?", 800);
        input.focus();
      });
      wrapper.appendChild(btn);
    });
    messages.appendChild(wrapper);
    scrollBottom();
  }

  /* ─────────────── NY Phone Validation ─────────────── */
  function isValidNYPhone(raw) {
    // Accept: 10 digits, or +1XXXXXXXXXX, or 1XXXXXXXXXX
    var digits = raw.replace(/\D/g, '');
    if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
    if (digits.length !== 10) return false;
    // NY area codes (partial list covering NYC metro)
    var nyAreaCodes = ['212', '332', '347', '516', '551', '607', '631', '646', '680', '716', '718', '838', '845', '914', '917', '929'];
    var area = digits.slice(0, 3);
    return nyAreaCodes.indexOf(area) !== -1;
  }

  /* ─────────────── Process user input ─────────────── */
  function handleUserInput(text) {
    text = text.trim();
    if (!text) return;
    input.value = '';

    switch (state.step) {
      case STEP.WAITING_REPLY:
        // User said something → show options
        addBubble(text, 'user');
        state.step = STEP.PICK_OPTION;
        showTyping(function () {
          addBubble("What are you looking for?", 'bot');
          showOptions();
        }, 700);
        break;

      case STEP.ASK_NAME:
        if (text.length < 2) {
          addBubble(text, 'user');
          botSay("Please enter your full name (at least 2 characters).", 700);
          return;
        }
        addBubble(text, 'user');
        state.name = text;
        state.step = STEP.ASK_PHONE;
        botSay("Thank you, " + state.name.split(' ')[0] + "! 📞 Please enter your mobile number (e.g. 929-XXX-XXXX).", 900);
        break;

      case STEP.ASK_PHONE:
        addBubble(text, 'user');
        if (!isValidNYPhone(text)) {
          botSay("Hmm, that doesn't look like a valid New York number. Please enter a 10-digit NY number (area codes: 212, 347, 646, 718, 929, etc.).", 900);
          return;
        }
        state.phone = text;
        state.step = STEP.ASK_NEED;
        botSay("Perfect! ✨ What do you need help with today?", 900);
        break;

      case STEP.ASK_NEED:
        addBubble(text, 'user');
        state.need = text;
        state.step = STEP.DONE;
        showTyping(function () {
          addBubble("Thank you! We've received your request. 🙏", 'bot');
          setTimeout(showThankYouPopup, 600);
        }, 1000);
        break;

      default:
        break;
    }
  }

  /* ─────────────── Thank-You Popup ─────────────── */
  function showThankYouPopup() {
    popup.style.display = 'block';
  }

  popupClose.addEventListener('click', function () {
    popup.style.display = 'none';
  });

  /* ─────────────── Toggle chat ─────────────── */
  function openChat() {
    chatWindow.classList.add('vp-open');
    badge.style.display = 'none';
    launcher.querySelector('svg').innerHTML = '<path d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-18.9 220.6L218.9 379.6c-3.1 3.1-8.2 3.1-11.3 0l-8.5-8.5c-3.1-3.1-3.1-8.2 0-11.3L323.6 236H112c-4.4 0-8-3.6-8-8v-12c0-4.4 3.6-8 8-8h211.6L199.1 92.2c-3.1-3.1-3.1-8.2 0-11.3l8.5-8.5c3.1-3.1 8.2-3.1 11.3 0l163.2 163.2c3.1 3.1 3.1 8.2 0 11z"/>';

    // Greet on first open
    if (state.step === STEP.INIT) {
      state.step = STEP.WAITING_REPLY;
      botSay("Hi! 🔮 How may I help you today?", 600);
    }
    setTimeout(function () { input.focus(); }, 400);
  }

  function closeChat() {
    chatWindow.classList.remove('vp-open');
    // Restore chat icon
    launcher.querySelector('svg').innerHTML = '<path d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.4-2.8 5.9-1.5 8.9S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4C181.9 440.9 218.4 448 256 448c141.4 0 256-93.1 256-208S397.4 32 256 32z"/>';
  }

  launcher.addEventListener('click', function () {
    if (chatWindow.classList.contains('vp-open')) {
      closeChat();
    } else {
      openChat();
    }
  });

  closeBtn.addEventListener('click', function () { closeChat(); });

  /* ─────────────── Send events ─────────────── */
  sendBtn.addEventListener('click', function () { handleUserInput(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); handleUserInput(input.value); }
  });

})();
