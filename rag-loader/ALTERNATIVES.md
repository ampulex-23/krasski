# Альтернативные векторные БД

Если Pinecone не подходит, можно использовать другие векторные базы данных.

## 1. Qdrant (рекомендуется для self-hosted)

### Преимущества
- ✅ Open source
- ✅ Можно развернуть локально или в облаке
- ✅ Отличная производительность
- ✅ Бесплатный cloud tier
- ✅ Поддержка фильтров и метаданных

### Установка

```bash
npm install @qdrant/js-client
```

### Изменения в коде

```javascript
// loader.js
import { QdrantClient } from '@qdrant/js-client';

this.qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY
});
```

### .env

```env
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=krasski-knowledge-base
```

## 2. Weaviate

### Преимущества
- ✅ Open source
- ✅ Встроенная поддержка hybrid search
- ✅ GraphQL API
- ✅ Хорошая документация

### Установка

```bash
npm install weaviate-ts-client
```

### .env

```env
WEAVIATE_URL=http://localhost:8080
WEAVIATE_API_KEY=your_key
```

## 3. Chroma

### Преимущества
- ✅ Open source
- ✅ Очень простой в использовании
- ✅ Локальная разработка
- ✅ Минимальная настройка

### Установка

```bash
npm install chromadb
```

### Использование

```javascript
import { ChromaClient } from 'chromadb';

const client = new ChromaClient();
const collection = await client.createCollection({
  name: 'krasski-knowledge-base'
});
```

## 4. Supabase Vector (PostgreSQL)

### Преимущества
- ✅ Использует PostgreSQL + pgvector
- ✅ Интеграция с существующей БД
- ✅ Бесплатный tier
- ✅ Знакомый SQL

### Установка

```bash
npm install @supabase/supabase-js
```

### .env

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_key
```

## 5. Milvus

### Преимущества
- ✅ Open source
- ✅ Высокая производительность
- ✅ Масштабируемость
- ✅ Поддержка GPU

### Использование
Для больших объёмов данных (миллионы векторов)

## Сравнение

| БД | Open Source | Free Tier | Self-hosted | Сложность | n8n Support |
|----|-------------|-----------|-------------|-----------|-------------|
| **Pinecone** | ❌ | ✅ | ❌ | Низкая | ✅ Нативная |
| **Qdrant** | ✅ | ✅ | ✅ | Средняя | ✅ Нативная |
| **Weaviate** | ✅ | ✅ | ✅ | Средняя | ✅ Нативная |
| **Chroma** | ✅ | ✅ | ✅ | Низкая | ⚠️ Через HTTP |
| **Supabase** | ✅ | ✅ | ✅ | Низкая | ✅ Нативная |
| **Milvus** | ✅ | ❌ | ✅ | Высокая | ⚠️ Через HTTP |

## Рекомендации

### Для прототипа
**Pinecone** - самый простой старт, не требует настройки инфраструктуры

### Для production
**Qdrant** - лучший баланс функциональности и стоимости

### Для интеграции с БД
**Supabase Vector** - если уже используете PostgreSQL

### Для локальной разработки
**Chroma** - минимальная настройка, работает из коробки

## Миграция с Pinecone

Если решите мигрировать, основные изменения:

1. Заменить клиент в `loader.js`
2. Обновить методы загрузки/поиска
3. Изменить `.env` переменные
4. Обновить n8n credentials

Структура данных и embeddings остаются теми же!
