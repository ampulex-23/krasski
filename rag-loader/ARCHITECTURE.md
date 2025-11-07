# Архитектура RAG Loader

## Общая схема

```
┌─────────────────────────────────────────────────────────────┐
│                    KRASSKI RAG System                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  MD Documents    │
│  /docs/ai-agent- │
│  data/           │
│  - rental-       │
│    pricing.md    │
│  - instructor-   │
│    pricing.md    │
│  - etc...        │
└────────┬─────────┘
         │
         │ 1. Load
         ▼
┌──────────────────┐
│  RAG Loader CLI  │
│  (этот проект)   │
│                  │
│  • Читает MD     │
│  • Разбивает на  │
│    чанки (800т)  │
│  • Добавляет     │
│    метаданные    │
└────────┬─────────┘
         │
         │ 2. Create Embeddings
         ▼
┌──────────────────┐
│  OpenAI API      │
│  text-embedding- │
│  3-small         │
│  (1536 dims)     │
└────────┬─────────┘
         │
         │ 3. Upload Vectors
         ▼
┌──────────────────┐
│  Pinecone        │
│  Vector DB       │
│                  │
│  Index:          │
│  krasski-        │
│  knowledge-base  │
│                  │
│  Namespace:      │
│  krasski-docs    │
└────────┬─────────┘
         │
         │ 4. Query
         ▼
┌──────────────────┐
│  n8n Workflow    │
│                  │
│  User Query      │
│    ↓             │
│  Pinecone Node   │
│    ↓             │
│  Top 5-7 chunks  │
│    ↓             │
│  LLM (GPT-4)     │
│    ↓             │
│  Response        │
└──────────────────┘
```

## Поток данных

### 1. Загрузка документов

```javascript
DirectoryLoader
  ↓
[rental-pricing.md, instructor-pricing.md, ...]
  ↓
Добавление метаданных:
{
  filename: 'rental-pricing.md',
  type: 'pricing',
  category: 'rental',
  priority: 'high',
  loadedAt: '2025-11-06T...'
}
```

### 2. Разбивка на чанки

```javascript
RecursiveCharacterTextSplitter
  ↓
Параметры:
- chunkSize: 800 токенов
- chunkOverlap: 100 токенов
- separators: ['## ', '### ', '\n\n', '\n']
  ↓
Результат: ~87 чанков
```

### 3. Создание embeddings

```javascript
OpenAI API (text-embedding-3-small)
  ↓
Каждый чанк → вектор [1536 чисел]
  ↓
Стоимость: ~$0.001 за всю базу
```

### 4. Загрузка в Pinecone

```javascript
PineconeStore.fromDocuments()
  ↓
Каждый вектор + метаданные + текст
  ↓
Namespace: 'krasski-docs'
  ↓
Index: 'krasski-knowledge-base'
```

## Структура чанка в Pinecone

```json
{
  "id": "doc_rental-pricing_chunk_0",
  "values": [0.123, -0.456, ...], // 1536 чисел
  "metadata": {
    "text": "# Прайс-лист на прокат снаряжения...",
    "filename": "rental-pricing.md",
    "type": "pricing",
    "category": "rental",
    "priority": "high",
    "loadedAt": "2025-11-06T13:00:00.000Z",
    "source": "/docs/ai-agent-data/rental-pricing.md"
  }
}
```

## Поиск (Similarity Search)

```
User Query: "Сколько стоит прокат лыж?"
  ↓
OpenAI Embeddings: query → vector [1536]
  ↓
Pinecone: cosine similarity search
  ↓
Top K=5 результатов с score:
  1. rental-pricing.md (score: 0.92)
  2. equipment-inventory.md (score: 0.87)
  3. faq.md (score: 0.81)
  4. promotions.md (score: 0.76)
  5. booking-rules.md (score: 0.71)
  ↓
Контекст для LLM
```

## Компоненты системы

### config.js
- Загрузка переменных окружения
- Валидация конфигурации
- Метаданные для категоризации документов

### loader.js
- `loadDocuments()` - загрузка MD файлов
- `splitDocuments()` - разбивка на чанки
- `uploadToVectorStore()` - загрузка в Pinecone
- `clearVectorStore()` - очистка базы
- `testQuery()` - тестирование поиска
- `getStats()` - статистика индекса

### index.js
- CLI команды:
  - `load` - первая загрузка
  - `update` - обновление (clear + load)
  - `clear` - очистка
  - `test` - тестовый запрос
  - `stats` - статистика

## Метаданные документов

Каждый документ категоризируется:

| Файл | Type | Category | Priority |
|------|------|----------|----------|
| rental-pricing.md | pricing | rental | high |
| instructor-pricing.md | pricing | instructor | high |
| kraskids-pricing.md | pricing | kids | high |
| promotions.md | marketing | promotions | medium |
| resorts-info.md | info | resorts | medium |
| equipment-inventory.md | inventory | equipment | high |
| contact-info.md | info | contacts | low |
| faq.md | support | faq | high |
| booking-rules.md | rules | booking | high |
| services-additional.md | info | services | medium |

**Priority** влияет на ранжирование результатов в будущем.

## Оптимизация поиска

### Chunk Size: 800 токенов
- Достаточно для полных таблиц
- Не слишком большой для точного поиска
- Оптимальный баланс контекст/точность

### Overlap: 100 токенов
- Сохраняет контекст между чанками
- Предотвращает потерю информации на границах
- Улучшает поиск по таблицам

### Separators
```javascript
['## ', '### ', '\n\n', '\n', ' ', '']
```
- Приоритет: заголовки → параграфы → строки
- Сохраняет семантическую целостность

## Масштабирование

### Текущая база
- 11 документов
- ~87 чанков
- ~50K токенов
- Стоимость embeddings: $0.001

### При росте базы знаний
- Pinecone Free tier: до 100K векторов
- Можно добавить ~1000 документов
- Incremental updates: загружать только изменённые файлы

## Мониторинг

```bash
# Проверить количество векторов
npm run stats

# Тестовый запрос
npm run test -- --query "ваш запрос"
```

## Troubleshooting

### Проблема: Дубликаты векторов
**Решение**: `npm run update` (очистка + загрузка)

### Проблема: Плохая релевантность
**Решение**: 
- Увеличить Top K
- Проверить качество чанков
- Улучшить метаданные

### Проблема: Медленный поиск
**Решение**:
- Уменьшить Top K
- Использовать фильтры по metadata
- Кэшировать частые запросы

## Интеграция с n8n

См. следующий раздел документации для настройки n8n workflow с Pinecone.
