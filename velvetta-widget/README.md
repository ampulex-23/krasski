# Velvetta Chat Widget

Встраиваемый чат-виджет для n8n AI агентов с полной поддержкой HTML рендеринга.

## Особенности

- ✅ **HTML рендеринг** — полная поддержка HTML в ответах бота
- ✅ **Настраиваемый дизайн** — цвета, позиция, размеры, иконки
- ✅ **Управление сессиями** — автоматическое сохранение контекста
- ✅ **Адаптивность** — работает на мобильных и десктопе
- ✅ **Анимации** — плавные переходы и индикатор набора
- ✅ **Без зависимостей** — чистый JavaScript

## Быстрый старт

### 1. Подключение с автоинициализацией

```html
<script>
  window.VelvettaChatConfig = {
    webhookUrl: 'https://your-n8n.com/webhook/xxx',
    title: 'AI Помощник',
    welcomeMessage: 'Привет! Чем могу помочь?'
  };
</script>
<script src="velvetta-chat.js"></script>
```

### 2. Ручная инициализация

```html
<script src="velvetta-chat.js"></script>
<script>
  const chat = new VelvettaChat({
    webhookUrl: 'https://your-n8n.com/webhook/xxx',
    title: 'AI Ассистент',
    subtitle: 'Онлайн',
    welcomeMessage: '<b>Привет!</b> Я ваш виртуальный помощник.',
    position: 'bottom-right',
    primaryColor: '#6366f1'
  });
</script>
```

## Конфигурация

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `webhookUrl` | string | **обязательный** | URL вебхука n8n |
| `title` | string | 'Чат с ассистентом' | Заголовок чата |
| `subtitle` | string | 'Онлайн' | Подзаголовок/статус |
| `welcomeMessage` | string | 'Привет! Чем могу помочь?' | Приветствие (HTML) |
| `placeholder` | string | 'Введите сообщение...' | Плейсхолдер ввода |
| `position` | string | 'bottom-right' | Позиция виджета |
| `buttonSize` | number | 60 | Размер кнопки (px) |
| `buttonIcon` | string | 'chat' | Иконка: chat, message, help |
| `primaryColor` | string | '#6366f1' | Основной цвет |
| `userMessageBg` | string | '#6366f1' | Фон сообщений пользователя |
| `userMessageColor` | string | '#ffffff' | Цвет текста пользователя |
| `botMessageBg` | string | '#f3f4f6' | Фон сообщений бота |
| `botMessageColor` | string | '#1f2937' | Цвет текста бота |
| `width` | number | 380 | Ширина окна чата |
| `height` | number | 550 | Высота окна чата |
| `zIndex` | number | 9999 | z-index виджета |
| `showTimestamp` | boolean | true | Показывать время |
| `customCss` | string | '' | Дополнительные стили |

### Позиции виджета

- `bottom-right` — правый нижний угол
- `bottom-left` — левый нижний угол
- `top-right` — правый верхний угол
- `top-left` — левый верхний угол

## Формат запроса

Виджет отправляет POST запрос:

```json
{
  "message": "Текст сообщения",
  "sessionId": "session_1702288000000_abc123",
  "timestamp": "2024-12-11T08:00:00.000Z"
}
```

## Формат ответа

Поддерживаемые форматы:

```json
{ "output": "<p>Ответ с <b>HTML</b></p>" }
{ "response": "Текст ответа" }
{ "message": "Текст ответа" }
{ "text": "Текст ответа" }
```

## API методы

```javascript
// Управление окном
chat.open();
chat.close();
chat.toggle();

// Сообщения
chat.addMessage('Текст', 'bot'); // или 'user'
chat.clearMessages();

// Конфигурация
chat.setConfig({ primaryColor: '#10b981' });

// Удаление
chat.destroy();
```

## Поддерживаемый HTML

В ответах бота поддерживаются:

- Заголовки: `<h1>`, `<h2>`, `<h3>`, `<h4>`
- Параграфы: `<p>`
- Списки: `<ul>`, `<ol>`, `<li>`
- Форматирование: `<b>`, `<strong>`, `<i>`, `<em>`
- Ссылки: `<a href="...">`
- Код: `<code>`, `<pre>`
- Таблицы: `<table>`, `<tr>`, `<th>`, `<td>`
- Цитаты: `<blockquote>`

## Настройка n8n

1. Создайте Webhook node с методом POST
2. Подключите AI Agent
3. Используйте поле `message` из входящего запроса
4. Верните ответ в формате `{ "output": "..." }`

## Настройка CORS в n8n

Для работы виджета с разных доменов необходимо настроить CORS в n8n:

### Вариант 1: Переменные окружения n8n

Добавьте в `.env` или переменные окружения:

```env
N8N_CORS_ALLOWED_ORIGINS=*
```

Или для конкретных доменов:

```env
N8N_CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://anotherdomain.com
```

### Вариант 2: Respond to Webhook node

В вашем workflow используйте node "Respond to Webhook" и добавьте заголовки:

```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
}
```

### Вариант 3: Прокси-сервер

Если нет доступа к настройкам n8n, используйте прокси-сервер (nginx, cloudflare worker и т.д.)

## Лицензия

MIT
