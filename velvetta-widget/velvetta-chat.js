(function() {
  'use strict';

  // Default configuration
  const defaultConfig = {
    webhookUrl: '',
    title: 'Чат с ассистентом',
    subtitle: 'Онлайн',
    welcomeMessage: 'Привет! Чем могу помочь?',
    placeholder: 'Введите сообщение...',
    sendButtonText: 'Отправить',
    position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
    buttonSize: 60,
    buttonIcon: 'chat', // chat, message, help
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#10b981',
    warningColor: '#f59e0b',
    dangerColor: '#ef4444',
    headerTextColor: '#ffffff',
    userMessageBg: '#6366f1',
    userMessageColor: '#ffffff',
    botMessageBg: '#ffffff',
    botMessageColor: '#1f2937',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    zIndex: 9999,
    width: 700,
    height: 650,
    sessionIdKey: 'velvetta_session_id',
    showTimestamp: true,
    enableSounds: false,
    customCss: '',
    openOnMobile: true // Auto-open chat on mobile devices
  };

  // Helper to detect mobile devices
  function isMobileDevice() {
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Icons SVG
  const icons = {
    chat: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    message: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
    help: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    send: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
    minimize: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
    fullscreen: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
    exitFullscreen: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`
  };

  class VelvettaChat {
    constructor(userConfig = {}) {
      this.config = { ...defaultConfig, ...userConfig };
      this.isOpen = false;
      this.isFullscreen = false;
      this.isLoading = false;
      this.messages = [];
      this.sessionId = this.getOrCreateSessionId();
      
      this.init();
    }

    getOrCreateSessionId() {
      let sessionId = localStorage.getItem(this.config.sessionIdKey);
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(this.config.sessionIdKey, sessionId);
      }
      return sessionId;
    }

    init() {
      this.injectStyles();
      this.createWidget();
      this.attachEventListeners();
      
      // Add welcome message
      if (this.config.welcomeMessage) {
        this.addMessage(this.config.welcomeMessage, 'bot');
      }

      // Check URL parameter for fullscreen mode
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'chat') {
        this.open();
        this.enterFullscreen();
        return; // Skip other auto-open logic
      }

      // Auto-open on mobile if enabled
      if (this.config.openOnMobile && isMobileDevice()) {
        this.open();
      }
    }

    injectStyles() {
      const style = document.createElement('style');
      style.id = 'velvetta-chat-styles';
      style.textContent = this.getStyles();
      document.head.appendChild(style);

      if (this.config.customCss) {
        const customStyle = document.createElement('style');
        customStyle.id = 'velvetta-chat-custom-styles';
        customStyle.textContent = this.config.customCss;
        document.head.appendChild(customStyle);
      }
    }

    getStyles() {
      const { position, buttonSize, primaryColor, secondaryColor, accentColor, warningColor, dangerColor,
              headerTextColor, userMessageBg, userMessageColor, botMessageBg, botMessageColor, 
              fontFamily, zIndex, width, height } = this.config;
      
      const positions = {
        'bottom-right': { bottom: '20px', right: '20px' },
        'bottom-left': { bottom: '20px', left: '20px' },
        'top-right': { top: '20px', right: '20px' },
        'top-left': { top: '20px', left: '20px' }
      };
      
      const pos = positions[position] || positions['bottom-right'];
      const positionStyles = Object.entries(pos).map(([k, v]) => `${k}: ${v}`).join('; ');

      return `
        .velvetta-widget {
          position: fixed;
          ${positionStyles};
          z-index: ${zIndex};
          font-family: ${fontFamily};
        }

        .velvetta-button {
          width: ${buttonSize}px;
          height: ${buttonSize}px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
          transition: all 0.3s ease;
          outline: none;
        }

        .velvetta-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px rgba(99, 102, 241, 0.5);
        }

        .velvetta-button.open {
          transform: rotate(90deg);
        }

        .velvetta-chat-window {
          position: absolute;
          ${position.includes('bottom') ? 'bottom' : 'top'}: ${buttonSize + 15}px;
          ${position.includes('right') ? 'right' : 'left'}: 0;
          width: ${width}px;
          height: ${height}px;
          background: #f8fafc;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
          visibility: hidden;
          transform: scale(0.9) translateY(${position.includes('bottom') ? '20px' : '-20px'});
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .velvetta-chat-window.open {
          opacity: 1;
          visibility: visible;
          transform: scale(1) translateY(0);
        }

        .velvetta-header {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%);
          color: ${headerTextColor};
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .velvetta-header-info {
          display: flex;
          flex-direction: column;
        }

        .velvetta-header-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .velvetta-header-subtitle {
          font-size: 13px;
          opacity: 0.9;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .velvetta-header-subtitle::before {
          content: '';
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
        }

        .velvetta-header-actions {
          display: flex;
          gap: 8px;
        }

        .velvetta-header-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 10px;
          padding: 8px;
          cursor: pointer;
          color: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }

        .velvetta-header-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .velvetta-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scroll-behavior: smooth;
          background: #f8fafc;
        }

        .velvetta-messages::-webkit-scrollbar {
          width: 6px;
        }

        .velvetta-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .velvetta-messages::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }

        .velvetta-message {
          max-width: 90%;
          padding: 16px 20px;
          border-radius: 18px;
          line-height: 1.6;
          font-size: 14px;
          animation: velvetta-message-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes velvetta-message-in {
          from {
            opacity: 0;
            transform: translateY(15px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .velvetta-message.user {
          background: linear-gradient(135deg, ${userMessageBg} 0%, ${secondaryColor || userMessageBg} 100%);
          color: ${userMessageColor};
          align-self: flex-end;
          border-bottom-right-radius: 6px;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }

        .velvetta-message.bot {
          background: ${botMessageBg};
          color: ${botMessageColor};
          align-self: flex-start;
          border-bottom-left-radius: 6px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        /* === RICH HTML DESIGN SYSTEM === */

        .velvetta-message.bot h1,
        .velvetta-message.bot h2,
        .velvetta-message.bot h3,
        .velvetta-message.bot h4 {
          margin: 0 0 12px 0;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.02em;
        }

        .velvetta-message.bot h3 { 
          font-size: 1.15em;
          padding-bottom: 8px;
          border-bottom: 2px solid ${primaryColor}20;
          margin-bottom: 16px;
        }
        
        .velvetta-message.bot h4 { 
          font-size: 1em;
          color: #475569;
          margin-top: 16px;
        }

        .velvetta-message.bot p {
          margin: 0 0 12px 0;
          color: #334155;
        }

        .velvetta-message.bot p:last-child {
          margin-bottom: 0;
        }

        /* Lists */
        .velvetta-message.bot ul,
        .velvetta-message.bot ol {
          margin: 12px 0;
          padding-left: 0;
          list-style: none;
        }

        .velvetta-message.bot ul li,
        .velvetta-message.bot ol li {
          margin: 8px 0;
          padding: 8px 12px 8px 32px;
          position: relative;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          border-radius: 10px;
          transition: all 0.2s;
        }

        .velvetta-message.bot ul li:hover,
        .velvetta-message.bot ol li:hover {
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
          transform: translateX(4px);
        }

        .velvetta-message.bot ul li::before {
          content: '•';
          position: absolute;
          left: 12px;
          color: ${primaryColor};
          font-weight: bold;
          font-size: 1.2em;
        }

        .velvetta-message.bot ol {
          counter-reset: item;
        }

        .velvetta-message.bot ol li::before {
          counter-increment: item;
          content: counter(item);
          position: absolute;
          left: 10px;
          color: ${primaryColor};
          font-weight: 700;
          font-size: 0.85em;
          background: ${primaryColor}15;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Links & Buttons */
        .velvetta-message.bot a {
          color: ${primaryColor};
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
        }

        .velvetta-message.bot a:hover {
          color: ${secondaryColor || primaryColor};
          text-decoration: underline;
        }

        .velvetta-message.bot a.btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%);
          color: white !important;
          border-radius: 25px;
          font-weight: 600;
          font-size: 13px;
          text-decoration: none !important;
          margin: 4px 6px 4px 0;
          box-shadow: 0 4px 15px ${primaryColor}40;
          transition: all 0.3s;
        }

        .velvetta-message.bot a.btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px ${primaryColor}50;
        }

        .velvetta-message.bot a.btn-call {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
        }

        .velvetta-message.bot a.btn-whatsapp {
          background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
          box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
        }

        .velvetta-message.bot a.btn-telegram {
          background: linear-gradient(135deg, #0088cc 0%, #0077b5 100%);
          box-shadow: 0 4px 15px rgba(0, 136, 204, 0.4);
        }

        /* Quick Reply Buttons */
        .velvetta-message.bot button.quick-reply {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          color: ${primaryColor};
          border: 2px solid ${primaryColor}30;
          border-radius: 25px;
          font-weight: 600;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          margin: 4px 6px 4px 0;
          transition: all 0.3s;
        }

        .velvetta-message.bot button.quick-reply:hover {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%);
          color: white;
          border-color: transparent;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px ${primaryColor}40;
        }

        .velvetta-message.bot button.quick-reply:active {
          transform: translateY(0);
        }

        .velvetta-message.bot .quick-replies {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }

        /* Code */
        .velvetta-message.bot code {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: #e2e8f0;
          padding: 3px 8px;
          border-radius: 6px;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 0.9em;
        }

        .velvetta-message.bot pre {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #e2e8f0;
          padding: 16px;
          border-radius: 12px;
          overflow-x: auto;
          margin: 12px 0;
          font-size: 13px;
        }

        .velvetta-message.bot pre code {
          background: none;
          padding: 0;
          color: inherit;
        }

        /* Tables */
        .velvetta-message.bot table {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
          margin: 16px 0;
          font-size: 13px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .velvetta-message.bot thead {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%);
        }

        .velvetta-message.bot th {
          color: white;
          font-weight: 600;
          padding: 12px 16px;
          text-align: left;
          border: none;
        }

        .velvetta-message.bot td {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          background: white;
        }

        .velvetta-message.bot tbody tr:last-child td {
          border-bottom: none;
        }

        .velvetta-message.bot tbody tr:hover td {
          background: #f8fafc;
        }

        .velvetta-message.bot tfoot {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        }

        .velvetta-message.bot tfoot td {
          font-weight: 700;
          border-bottom: none;
        }

        /* Special blocks */
        .velvetta-message.bot .info-card,
        .velvetta-message.bot .price-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          margin: 12px 0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        .velvetta-message.bot .price-card {
          border-left: 4px solid ${primaryColor};
        }

        .velvetta-message.bot .warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: 12px;
          padding: 14px 18px;
          margin: 12px 0;
          color: #92400e;
        }

        .velvetta-message.bot .warning h4 {
          color: #92400e;
          margin-top: 0;
        }

        .velvetta-message.bot .success {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border: 1px solid #10b981;
          border-radius: 12px;
          padding: 14px 18px;
          margin: 12px 0;
          color: #065f46;
        }

        .velvetta-message.bot .success h4 {
          color: #065f46;
          margin-top: 0;
        }

        .velvetta-message.bot .highlight {
          background: linear-gradient(135deg, ${primaryColor}10 0%, ${primaryColor}20 100%);
          border: 1px solid ${primaryColor}30;
          border-radius: 12px;
          padding: 16px 20px;
          margin: 12px 0;
        }

        /* Text formatting */
        .velvetta-message.bot strong,
        .velvetta-message.bot b {
          font-weight: 700;
          color: #1e293b;
        }

        .velvetta-message.bot em,
        .velvetta-message.bot i {
          font-style: italic;
          color: #64748b;
        }

        .velvetta-message.bot mark {
          background: linear-gradient(135deg, #fef08a 0%, #fde047 100%);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .velvetta-message.bot s {
          color: #94a3b8;
        }

        .velvetta-message.bot u {
          text-decoration-color: ${primaryColor};
          text-decoration-thickness: 2px;
        }

        .velvetta-message.bot small {
          font-size: 0.85em;
          color: #64748b;
        }

        .velvetta-message.bot hr {
          border: none;
          height: 2px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          margin: 16px 0;
        }

        .velvetta-message.bot blockquote {
          border-left: 4px solid ${primaryColor};
          margin: 12px 0;
          padding: 12px 16px;
          background: ${primaryColor}08;
          border-radius: 0 12px 12px 0;
          color: #475569;
          font-style: italic;
        }

        /* === WEATHER FORECAST STYLES === */

        .velvetta-message.bot .weather-forecast {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          border-radius: 16px;
          padding: 20px;
          margin: 12px 0;
          border: 1px solid #7dd3fc;
        }

        .velvetta-message.bot .weather-forecast h3 {
          color: #0369a1;
          margin: 0 0 16px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid #7dd3fc;
        }

        .velvetta-message.bot .weather-cards {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
          -webkit-overflow-scrolling: touch;
        }

        .velvetta-message.bot .weather-card {
          flex: 0 0 auto;
          min-width: 100px;
          background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%);
          border-radius: 12px;
          padding: 14px 12px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #e0f2fe;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .velvetta-message.bot .weather-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .velvetta-message.bot .weather-date {
          font-size: 12px;
          font-weight: 600;
          color: #0369a1;
          margin-bottom: 8px;
        }

        .velvetta-message.bot .weather-icon {
          font-size: 32px;
          line-height: 1;
          margin-bottom: 8px;
        }

        .velvetta-message.bot .weather-temp {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .velvetta-message.bot .temp-high {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .velvetta-message.bot .temp-low {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          align-self: flex-end;
        }

        .velvetta-message.bot .weather-desc {
          font-size: 11px;
          color: #475569;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .velvetta-message.bot .weather-details {
          display: flex;
          justify-content: center;
          gap: 8px;
          font-size: 10px;
          color: #64748b;
        }

        .velvetta-message.bot .weather-tip {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 10px;
          padding: 12px 14px;
          margin-top: 14px;
          border: 1px solid #fbbf24;
        }

        .velvetta-message.bot .weather-tip p {
          margin: 0;
          font-size: 13px;
          color: #92400e;
        }

        .velvetta-message.bot .weather-table {
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }

        .velvetta-message.bot .weather-table thead {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
        }

        .velvetta-message.bot .weather-table th {
          color: white;
          font-size: 12px;
          padding: 10px 12px;
          font-weight: 600;
        }

        .velvetta-message.bot .weather-table td {
          padding: 12px;
          font-size: 13px;
          border-bottom: 1px solid #e0f2fe;
          white-space: nowrap;
        }

        .velvetta-message.bot .weather-table tbody tr:hover td {
          background: #f0f9ff;
        }

        .velvetta-message.bot .weather-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* === SLOPES CARD STYLES === */

        /* Base slopes card */
        .velvetta-message.bot .slopes-card {
          border-radius: 16px;
          padding: 20px;
          margin: 12px 0;
        }

        /* Красная Поляна theme */
        .velvetta-message.bot .slopes-card--kp {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #86efac;
        }

        .velvetta-message.bot .slopes-card--kp h3 {
          color: #166534;
          margin: 0 0 12px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #86efac;
        }

        /* Роза Хутор theme */
        .velvetta-message.bot .slopes-card--roza {
          background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
          border: 1px solid #f87171;
        }

        .velvetta-message.bot .slopes-card--roza h3 {
          color: #991b1b;
          margin: 0 0 12px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #f87171;
        }

        .velvetta-message.bot .slopes-updated {
          font-size: 12px;
          color: #6b7280;
          margin: 0 0 12px 0;
        }

        .velvetta-message.bot .slopes-stats {
          background: white;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 16px;
          text-align: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .velvetta-message.bot .slopes-count {
          font-size: 18px;
          color: #166534;
        }

        /* Summary stats for Roza Khutor */
        .velvetta-message.bot .slopes-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .velvetta-message.bot .slopes-stat {
          background: white;
          border-radius: 10px;
          padding: 12px 8px;
          text-align: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .velvetta-message.bot .slopes-stat .stat-number {
          display: block;
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
        }

        .velvetta-message.bot .slopes-stat .stat-label {
          display: block;
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
        }

        .velvetta-message.bot .slopes-stat--open .stat-number { color: #16a34a; }
        .velvetta-message.bot .slopes-stat--planned .stat-number { color: #eab308; }
        .velvetta-message.bot .slopes-stat--closed .stat-number { color: #dc2626; }
        .velvetta-message.bot .slopes-stat--season .stat-number { color: #9ca3af; }

        /* Sections for Roza Khutor */
        .velvetta-message.bot .slopes-section {
          margin-bottom: 16px;
        }

        .velvetta-message.bot .section-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px 0;
          padding: 6px 10px;
          border-radius: 8px;
        }

        .velvetta-message.bot .section-title--open {
          background: #dcfce7;
          color: #166534;
        }

        .velvetta-message.bot .section-title--planned {
          background: #fef9c3;
          color: #854d0e;
        }

        .velvetta-message.bot .section-title--closed {
          background: #fee2e2;
          color: #991b1b;
        }

        .velvetta-message.bot .slopes-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .velvetta-message.bot .slope-item {
          background: white;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 13px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .velvetta-message.bot .slope-item--open {
          color: #166534;
          border-left: 3px solid #16a34a;
        }

        .velvetta-message.bot .slope-item--planned {
          color: #854d0e;
          border-left: 3px solid #eab308;
        }

        .velvetta-message.bot .slope-item--closed {
          color: #991b1b;
          border-left: 3px solid #dc2626;
        }

        .velvetta-message.bot .slopes-note {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
          font-style: italic;
        }

        /* === END DESIGN SYSTEM === */

        .velvetta-message-time {
          font-size: 11px;
          opacity: 0.5;
          margin-top: 8px;
          font-weight: 500;
        }

        .velvetta-message.bot th {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%);
          font-weight: 600;
        }

        .velvetta-message.bot blockquote {
          border-left: 3px solid ${primaryColor};
          margin: 8px 0;
          padding-left: 12px;
          color: #666;
        }

        .velvetta-message.bot strong {
          font-weight: 600;
        }

        .velvetta-message.bot em {
          font-style: italic;
        }

        .velvetta-message-time {
          font-size: 10px;
          opacity: 0.6;
          margin-top: 4px;
        }

        .velvetta-typing {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: ${botMessageBg};
          border-radius: 16px;
          border-bottom-left-radius: 4px;
          align-self: flex-start;
          max-width: 60px;
        }

        .velvetta-typing-dot {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          border-radius: 50%;
          animation: velvetta-typing 1.4s infinite;
        }

        .velvetta-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .velvetta-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes velvetta-typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        .velvetta-input-area {
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }

        .velvetta-input {
          flex: 1;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          max-height: 120px;
          outline: none;
          transition: border-color 0.2s;
        }

        .velvetta-input:focus {
          border-color: ${primaryColor};
        }

        .velvetta-input::placeholder {
          color: #9ca3af;
        }

        .velvetta-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: ${primaryColor};
          border: none;
          cursor: pointer;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .velvetta-send-btn:hover:not(:disabled) {
          background: ${this.adjustColor(primaryColor, -20)};
        }

        .velvetta-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .velvetta-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          margin: 8px 16px;
        }

        .velvetta-powered {
          text-align: center;
          padding: 8px;
          font-size: 11px;
          color: #9ca3af;
          border-top: 1px solid #f3f4f6;
        }

        .velvetta-powered a {
          color: #6b7280;
          text-decoration: none;
        }

        /* === FULLSCREEN MODE === */
        .velvetta-widget.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          z-index: ${zIndex + 10};
        }

        .velvetta-chat-window.fullscreen {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          border-radius: 0 !important;
          opacity: 1 !important;
          visibility: visible !important;
          transform: none !important;
        }

        .velvetta-chat-window.fullscreen .velvetta-header {
          padding: 20px 40px;
          border-radius: 0;
        }

        .velvetta-chat-window.fullscreen .velvetta-messages {
          padding: 30px;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }

        .velvetta-chat-window.fullscreen .velvetta-message {
          max-width: 75%;
          padding: 18px 24px;
          font-size: 15px;
        }

        .velvetta-chat-window.fullscreen .velvetta-message.bot {
          max-width: 85%;
        }

        .velvetta-chat-window.fullscreen .velvetta-input-area {
          padding: 20px 40px 30px;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
          background: transparent;
        }

        .velvetta-chat-window.fullscreen .velvetta-input {
          padding: 16px 20px;
          font-size: 15px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .velvetta-chat-window.fullscreen .velvetta-send-btn {
          width: 50px;
          height: 50px;
          border-radius: 14px;
        }

        /* Hide fullscreen button on mobile (already fullscreen) */
        @media (max-width: 768px) {
          .velvetta-fullscreen-btn {
            display: none !important;
          }
        }

        /* === MOBILE RESPONSIVE === */
        @media (max-width: 768px) {
          .velvetta-widget {
            bottom: 16px !important;
            right: 16px !important;
            left: auto !important;
            top: auto !important;
          }

          .velvetta-button {
            width: 56px;
            height: 56px;
          }

          .velvetta-chat-window {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            top: auto !important;
            width: 100vw !important;
            height: 100% !important;
            max-width: none !important;
            max-height: none !important;
            border-radius: 0 !important;
            z-index: ${zIndex + 1};
            display: flex !important;
            flex-direction: column !important;
            box-sizing: border-box;
          }

          .velvetta-header {
            flex-shrink: 0;
          }

          .velvetta-messages {
            flex: 1 1 0% !important;
            min-height: 0 !important;
            overflow-y: auto !important;
          }

          .velvetta-input-area {
            flex-shrink: 0 !important;
            padding-bottom: env(safe-area-inset-bottom, 12px) !important;
          }

          .velvetta-header {
            padding: 16px 20px;
            padding-top: max(16px, env(safe-area-inset-top));
          }

          .velvetta-header-title {
            font-size: 16px;
          }

          .velvetta-header-subtitle {
            font-size: 12px;
          }

          .velvetta-messages {
            padding: 16px;
            padding-bottom: max(16px, env(safe-area-inset-bottom));
          }

          .velvetta-message {
            max-width: 85%;
            padding: 12px 16px;
            font-size: 15px;
            border-radius: 16px;
          }

          .velvetta-message.user {
            border-bottom-right-radius: 4px;
          }

          .velvetta-message.bot {
            border-bottom-left-radius: 4px;
          }

          /* Адаптивные таблицы */
          .velvetta-message.bot table {
            font-size: 12px;
            display: block;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .velvetta-message.bot th,
          .velvetta-message.bot td {
            padding: 8px 10px;
            white-space: nowrap;
          }

          /* Адаптивные карточки */
          .velvetta-message.bot .info-card,
          .velvetta-message.bot .price-card {
            padding: 14px;
            margin: 8px 0;
          }

          .velvetta-message.bot h3 {
            font-size: 1.05em;
            margin-bottom: 12px;
          }

          .velvetta-message.bot h4 {
            font-size: 0.95em;
            margin-top: 12px;
          }

          /* Адаптивные списки */
          .velvetta-message.bot ul li,
          .velvetta-message.bot ol li {
            padding: 6px 10px 6px 28px;
            font-size: 14px;
          }

          .velvetta-message.bot ul li::before {
            left: 10px;
          }

          .velvetta-message.bot ol li::before {
            left: 8px;
            width: 16px;
            height: 16px;
            font-size: 0.8em;
          }

          /* Адаптивные кнопки */
          .velvetta-message.bot a.btn {
            padding: 10px 14px;
            font-size: 13px;
            margin: 3px 4px 3px 0;
          }

          .velvetta-message.bot button.quick-reply {
            padding: 10px 14px;
            font-size: 13px;
            margin: 3px 4px 3px 0;
          }

          .velvetta-message.bot .quick-replies {
            gap: 6px;
            margin-top: 10px;
            padding-top: 10px;
          }

          /* Блоки предупреждений */
          .velvetta-message.bot .warning,
          .velvetta-message.bot .success {
            padding: 10px 14px;
            font-size: 13px;
          }

          /* Адаптивный прогноз погоды */
          .velvetta-message.bot .weather-forecast {
            padding: 14px;
          }

          .velvetta-message.bot .weather-forecast h3 {
            font-size: 1em;
            margin-bottom: 12px;
          }

          .velvetta-message.bot .weather-card {
            min-width: 85px;
            padding: 10px 8px;
          }

          .velvetta-message.bot .weather-icon {
            font-size: 26px;
          }

          .velvetta-message.bot .temp-high {
            font-size: 16px;
          }

          .velvetta-message.bot .temp-low {
            font-size: 12px;
          }

          .velvetta-message.bot .weather-tip {
            padding: 10px 12px;
          }

          .velvetta-message.bot .weather-tip p {
            font-size: 12px;
          }

          .velvetta-input-area {
            padding: 12px 16px;
            padding-bottom: max(12px, env(safe-area-inset-bottom));
            gap: 8px;
          }

          .velvetta-input {
            padding: 12px 14px;
            font-size: 16px; /* Предотвращает зум на iOS */
            border-radius: 20px;
          }

          .velvetta-send-btn {
            width: 44px;
            height: 44px;
            border-radius: 50%;
          }
        }

        /* Очень маленькие экраны */
        @media (max-width: 380px) {
          .velvetta-message {
            max-width: 90%;
            font-size: 14px;
          }

          .velvetta-message.bot a.btn,
          .velvetta-message.bot button.quick-reply {
            padding: 8px 12px;
            font-size: 12px;
          }

          .velvetta-message.bot .quick-replies {
            gap: 4px;
          }
        }
      `;
    }

    adjustColor(color, amount) {
      const hex = color.replace('#', '');
      const num = parseInt(hex, 16);
      const r = Math.min(255, Math.max(0, (num >> 16) + amount));
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
      return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    }

    createWidget() {
      const widget = document.createElement('div');
      widget.className = 'velvetta-widget';
      widget.innerHTML = `
        <div class="velvetta-chat-window" id="velvetta-chat-window">
          <div class="velvetta-header">
            <div class="velvetta-header-info">
              <h3 class="velvetta-header-title">${this.config.title}</h3>
              <span class="velvetta-header-subtitle">${this.config.subtitle}</span>
            </div>
            <div class="velvetta-header-actions">
              <button class="velvetta-header-btn velvetta-fullscreen-btn" id="velvetta-fullscreen-btn" title="Полноэкранный режим">
                ${icons.fullscreen}
              </button>
              <button class="velvetta-header-btn" id="velvetta-close-btn" title="Закрыть">
                ${icons.close}
              </button>
            </div>
          </div>
          <div class="velvetta-messages" id="velvetta-messages"></div>
          <div class="velvetta-input-area">
            <textarea 
              class="velvetta-input" 
              id="velvetta-input" 
              placeholder="${this.config.placeholder}"
              rows="1"
            ></textarea>
            <button class="velvetta-send-btn" id="velvetta-send-btn" title="${this.config.sendButtonText}">
              ${icons.send}
            </button>
          </div>
        </div>
        <button class="velvetta-button" id="velvetta-toggle-btn" title="Открыть чат">
          ${icons[this.config.buttonIcon] || icons.chat}
        </button>
      `;

      document.body.appendChild(widget);

      this.elements = {
        widget,
        chatWindow: document.getElementById('velvetta-chat-window'),
        messages: document.getElementById('velvetta-messages'),
        input: document.getElementById('velvetta-input'),
        sendBtn: document.getElementById('velvetta-send-btn'),
        toggleBtn: document.getElementById('velvetta-toggle-btn'),
        closeBtn: document.getElementById('velvetta-close-btn'),
        fullscreenBtn: document.getElementById('velvetta-fullscreen-btn')
      };
    }

    attachEventListeners() {
      this.elements.toggleBtn.addEventListener('click', () => this.toggle());
      this.elements.closeBtn.addEventListener('click', () => this.close());
      this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
      this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
      
      this.elements.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      this.elements.input.addEventListener('input', () => {
        this.autoResizeInput();
      });

      // Handle quick reply button clicks
      this.elements.messages.addEventListener('click', (e) => {
        const quickReplyBtn = e.target.closest('button.quick-reply');
        if (quickReplyBtn && !this.isLoading) {
          const replyText = quickReplyBtn.dataset.reply || quickReplyBtn.textContent.trim();
          this.sendQuickReply(replyText);
        }
      });

      // Handle mobile keyboard visibility
      this.setupMobileKeyboardHandler();
    }

    setupMobileKeyboardHandler() {
      if (!isMobileDevice()) return;

      // On focus, scroll to bottom after keyboard opens
      this.elements.input.addEventListener('focus', () => {
        setTimeout(() => {
          this.scrollToBottom();
        }, 350);
      });
    }

    autoResizeInput() {
      const input = this.elements.input;
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    open() {
      this.isOpen = true;
      this.elements.chatWindow.classList.add('open');
      this.elements.toggleBtn.classList.add('open');
      this.elements.toggleBtn.innerHTML = icons.close;
      this.elements.input.focus();
      this.scrollToBottom();
    }

    close() {
      this.isOpen = false;
      this.elements.chatWindow.classList.remove('open');
      this.elements.toggleBtn.classList.remove('open');
      this.elements.toggleBtn.innerHTML = icons[this.config.buttonIcon] || icons.chat;
      
      // Exit fullscreen if active
      if (this.isFullscreen) {
        this.exitFullscreen();
      }
      
      // Blur input to close keyboard on mobile
      this.elements.input.blur();
    }

    toggleFullscreen() {
      this.isFullscreen ? this.exitFullscreen() : this.enterFullscreen();
    }

    enterFullscreen() {
      this.isFullscreen = true;
      this.elements.widget.classList.add('fullscreen');
      this.elements.chatWindow.classList.add('fullscreen');
      this.elements.fullscreenBtn.innerHTML = icons.exitFullscreen;
      this.elements.fullscreenBtn.title = 'Выйти из полноэкранного режима';
      
      // Hide toggle button in fullscreen
      this.elements.toggleBtn.style.display = 'none';
      
      // Ensure chat is open
      if (!this.isOpen) {
        this.open();
      }
      
      this.scrollToBottom();
      document.body.style.overflow = 'hidden';
    }

    exitFullscreen() {
      this.isFullscreen = false;
      this.elements.widget.classList.remove('fullscreen');
      this.elements.chatWindow.classList.remove('fullscreen');
      this.elements.fullscreenBtn.innerHTML = icons.fullscreen;
      this.elements.fullscreenBtn.title = 'Полноэкранный режим';
      
      // Show toggle button
      this.elements.toggleBtn.style.display = '';
      
      document.body.style.overflow = '';
      this.scrollToBottom();
    }

    addMessage(content, type = 'user') {
      const messageDiv = document.createElement('div');
      messageDiv.className = `velvetta-message ${type}`;
      
      if (type === 'bot') {
        // Render HTML for bot messages
        messageDiv.innerHTML = content;
      } else {
        // Escape HTML for user messages
        messageDiv.textContent = content;
      }

      if (this.config.showTimestamp) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'velvetta-message-time';
        timeDiv.textContent = new Date().toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        messageDiv.appendChild(timeDiv);
      }

      this.elements.messages.appendChild(messageDiv);
      this.messages.push({ content, type, timestamp: new Date() });
      this.scrollToBottom();

      return messageDiv;
    }

    showTyping() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'velvetta-typing';
      typingDiv.id = 'velvetta-typing';
      typingDiv.innerHTML = `
        <div class="velvetta-typing-dot"></div>
        <div class="velvetta-typing-dot"></div>
        <div class="velvetta-typing-dot"></div>
      `;
      this.elements.messages.appendChild(typingDiv);
      this.scrollToBottom();
    }

    hideTyping() {
      const typing = document.getElementById('velvetta-typing');
      if (typing) {
        typing.remove();
      }
    }

    showError(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'velvetta-error';
      errorDiv.textContent = message;
      this.elements.messages.appendChild(errorDiv);
      this.scrollToBottom();

      setTimeout(() => {
        errorDiv.remove();
      }, 5000);
    }

    scrollToBottom() {
      requestAnimationFrame(() => {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
      });
    }

    sendQuickReply(message) {
      if (!message || this.isLoading) return;
      
      // Disable all quick reply buttons in the chat
      this.disableQuickReplies();
      
      // Send the message
      this.elements.input.value = message;
      this.sendMessage();
    }

    disableQuickReplies() {
      const buttons = this.elements.messages.querySelectorAll('button.quick-reply');
      buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      });
    }

    async sendMessage() {
      const message = this.elements.input.value.trim();
      if (!message || this.isLoading) return;

      if (!this.config.webhookUrl) {
        this.showError('Webhook URL не настроен');
        return;
      }

      // Add user message
      this.addMessage(message, 'user');
      this.elements.input.value = '';
      this.elements.input.style.height = 'auto';

      // Show loading
      this.isLoading = true;
      this.elements.sendBtn.disabled = true;
      this.showTyping();

      try {
        const response = await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.hideTyping();

        // Handle different response formats
        let botResponse = '';
        if (typeof data === 'string') {
          botResponse = data;
        } else if (data.output) {
          botResponse = data.output;
        } else if (data.response) {
          botResponse = data.response;
        } else if (data.message) {
          botResponse = data.message;
        } else if (data.text) {
          botResponse = data.text;
        } else {
          botResponse = JSON.stringify(data);
        }

        this.addMessage(botResponse, 'bot');

      } catch (error) {
        console.error('Velvetta Chat Error:', error);
        this.hideTyping();
        this.showError('Не удалось отправить сообщение. Попробуйте позже.');
      } finally {
        this.isLoading = false;
        this.elements.sendBtn.disabled = false;
      }
    }

    // Public API methods
    setConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
    }

    clearMessages() {
      this.elements.messages.innerHTML = '';
      this.messages = [];
      if (this.config.welcomeMessage) {
        this.addMessage(this.config.welcomeMessage, 'bot');
      }
    }

    destroy() {
      this.elements.widget.remove();
      const styles = document.getElementById('velvetta-chat-styles');
      if (styles) styles.remove();
      const customStyles = document.getElementById('velvetta-chat-custom-styles');
      if (customStyles) customStyles.remove();
    }
  }

  // Expose to global scope
  window.VelvettaChat = VelvettaChat;

  // Auto-init if config is present
  function initVelvetta() {
    if (window.VelvettaChatConfig) {
      window.velvettaChat = new VelvettaChat(window.VelvettaChatConfig);
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVelvetta);
  } else {
    initVelvetta();
  }
})();
