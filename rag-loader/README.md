# KRASSKI RAG Loader

CLI-приложение для загрузки базы знаний KRASSKI в векторную базу данных (Pinecone) для использования в RAG-системе.

## Возможности

- ✅ Загрузка всех MD файлов из `/docs/ai-agent-data`
- ✅ Автоматическая разбивка на чанки (800 токенов с overlap 100)
- ✅ Создание embeddings через OpenAI API
- ✅ Загрузка в Pinecone с метаданными
- ✅ Обновление базы знаний
- ✅ Тестирование поиска
- ✅ Статистика

## Установка

### 1. Установить зависимости

```bash
cd rag-loader
npm install
```

### 2. Настроить переменные окружения

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

Заполните `.env`:

```env
# OpenAI API Key (для создания embeddings)
OPENAI_API_KEY=sk-...

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1  # или ваш регион
PINECONE_INDEX_NAME=krasski-knowledge-base

# Chunk Settings (опционально)
CHUNK_SIZE=800
CHUNK_OVERLAP=100

# Путь к документам (опционально)
DOCS_PATH=../docs/ai-agent-data
```

### 3. Создать индекс в Pinecone

Перейдите на [pinecone.io](https://www.pinecone.io/) и создайте индекс:

- **Name**: `krasski-knowledge-base` (или как указано в `.env`)
- **Dimensions**: `1536` (для OpenAI text-embedding-3-small)
- **Metric**: `cosine`
- **Cloud**: AWS
- **Region**: выберите ближайший

## Использование

### Первая загрузка

```bash
npm run load
```

Или с очисткой существующих данных:

```bash
npm run load -- --clear
```

### Обновление данных

Когда вы изменили MD файлы и хотите обновить базу:

```bash
npm run update
```

Это автоматически очистит старые данные и загрузит новые.

### Очистка базы данных

```bash
npm run clear
```

### Тестирование поиска

Проверить, что RAG работает:

```bash
npm run test
```

С кастомным запросом:

```bash
npm run test -- --query "Какие скидки на прокат?"
```

### Статистика

Посмотреть количество векторов в базе:

```bash
npm run stats
```

## Структура проекта

```
rag-loader/
├── src/
│   ├── index.js       # CLI команды
│   ├── loader.js      # Основная логика загрузки
│   └── config.js      # Конфигурация
├── package.json
├── .env.example
├── .env               # Ваши настройки (не в git)
├── .gitignore
└── README.md
```

## Метаданные документов

Каждый чанк содержит метаданные:

```javascript
{
  filename: 'rental-pricing.md',
  type: 'pricing',           // pricing, info, rules, support, marketing
  category: 'rental',        // rental, instructor, kids, equipment, etc.
  priority: 'high',          // high, medium, low
  loadedAt: '2025-11-06T...'
}
```

Это позволяет фильтровать результаты поиска по типу документа.

## Настройки чанков

По умолчанию:
- **Chunk size**: 800 токенов (оптимально для таблиц)
- **Overlap**: 100 токенов (для сохранения контекста)
- **Separators**: `## `, `### `, `\n\n`, `\n` (разбивка по заголовкам)

Можно изменить в `.env`:

```env
CHUNK_SIZE=1000
CHUNK_OVERLAP=150
```

## Использование в n8n

После загрузки данных в Pinecone, в n8n:

1. Добавьте **Pinecone Vector Store** узел
2. Настройте credentials:
   - API Key: из `.env`
   - Environment: из `.env`
   - Index Name: из `.env`
3. Используйте namespace: `krasski-docs`
4. Top K: 5-7 результатов

## Troubleshooting

### Ошибка: "OPENAI_API_KEY не установлен"

Проверьте, что файл `.env` существует и содержит корректный API ключ.

### Ошибка: "Index not found"

Создайте индекс в Pinecone с правильным именем и размерностью 1536.

### Ошибка: "Rate limit exceeded"

OpenAI API имеет лимиты. Подождите немного и попробуйте снова.

### Медленная загрузка

Это нормально. Создание embeddings для всех документов занимает 1-3 минуты.

## Обновление базы знаний

Workflow:

1. Редактируете MD файлы в `/docs/ai-agent-data`
2. Запускаете `npm run update`
3. Проверяете тестовым запросом: `npm run test`
4. Готово! n8n автоматически использует новые данные

## Стоимость

**OpenAI embeddings** (text-embedding-3-small):
- ~$0.00002 за 1K токенов
- Все документы KRASSKI: ~50K токенов
- Стоимость загрузки: ~$0.001 (меньше цента)

**Pinecone**:
- Free tier: 1 индекс, 100K векторов
- Достаточно для KRASSKI

## Лицензия

MIT
