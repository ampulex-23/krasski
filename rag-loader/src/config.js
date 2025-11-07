import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env из корня rag-loader
dotenv.config({ path: join(__dirname, '..', '.env') });

export const config = {
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY,
  
  // Pinecone
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeEnvironment: process.env.PINECONE_ENVIRONMENT,
  pineconeIndexName: process.env.PINECONE_INDEX_NAME || 'krasski-knowledge-base',
  
  // Chunk settings
  chunkSize: parseInt(process.env.CHUNK_SIZE) || 800,
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 100,
  
  // Paths
  docsPath: process.env.DOCS_PATH || '../docs/ai-agent-data',
  
  // Metadata для категоризации документов
  documentCategories: {
    'rental-pricing.md': { type: 'pricing', category: 'rental', priority: 'high' },
    'instructor-pricing.md': { type: 'pricing', category: 'instructor', priority: 'high' },
    'kraskids-pricing.md': { type: 'pricing', category: 'kids', priority: 'high' },
    'promotions.md': { type: 'marketing', category: 'promotions', priority: 'medium' },
    'resorts-info.md': { type: 'info', category: 'resorts', priority: 'medium' },
    'equipment-inventory.md': { type: 'inventory', category: 'equipment', priority: 'high' },
    'contact-info.md': { type: 'info', category: 'contacts', priority: 'low' },
    'faq.md': { type: 'support', category: 'faq', priority: 'high' },
    'booking-rules.md': { type: 'rules', category: 'booking', priority: 'high' },
    'services-additional.md': { type: 'info', category: 'services', priority: 'medium' },
    'README.md': { type: 'meta', category: 'documentation', priority: 'low' }
  }
};

// Валидация конфигурации
export function validateConfig() {
  const errors = [];
  
  if (!config.openaiApiKey) {
    errors.push('OPENAI_API_KEY не установлен в .env');
  }
  
  if (!config.pineconeApiKey) {
    errors.push('PINECONE_API_KEY не установлен в .env');
  }
  
  if (errors.length > 0) {
    throw new Error(`Ошибки конфигурации:\n${errors.join('\n')}`);
  }
  
  return true;
}
