import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import { config } from './config.js';
import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class RAGLoader {
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openaiApiKey,
      modelName: 'text-embedding-3-small'
    });
    
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      separators: ['\n## ', '\n### ', '\n\n', '\n', ' ', '']
    });
    
    this.pinecone = null;
    this.index = null;
  }

  async initialize() {
    const spinner = ora('Подключение к Pinecone...').start();
    
    try {
      this.pinecone = new Pinecone({
        apiKey: config.pineconeApiKey
      });
      
      this.index = this.pinecone.Index(config.pineconeIndexName);
      
      spinner.succeed('Подключено к Pinecone');
      return true;
    } catch (error) {
      spinner.fail('Ошибка подключения к Pinecone');
      throw error;
    }
  }

  async loadDocuments() {
    const spinner = ora('Загрузка документов...').start();
    
    try {
      const docsPath = join(__dirname, '..', config.docsPath);
      
      const loader = new DirectoryLoader(docsPath, {
        '.md': (path) => new TextLoader(path)
      });
      
      const docs = await loader.load();
      
      spinner.succeed(`Загружено ${docs.length} документов`);
      
      // Добавляем метаданные к каждому документу
      const docsWithMetadata = docs.map(doc => {
        const filename = basename(doc.metadata.source);
        const categoryInfo = config.documentCategories[filename] || {
          type: 'unknown',
          category: 'general',
          priority: 'low'
        };
        
        return {
          ...doc,
          metadata: {
            ...doc.metadata,
            ...categoryInfo,
            filename,
            loadedAt: new Date().toISOString()
          }
        };
      });
      
      return docsWithMetadata;
    } catch (error) {
      spinner.fail('Ошибка загрузки документов');
      throw error;
    }
  }

  async splitDocuments(docs) {
    const spinner = ora('Разбивка документов на чанки...').start();
    
    try {
      const splits = await this.textSplitter.splitDocuments(docs);
      
      spinner.succeed(`Создано ${splits.length} чанков`);
      
      return splits;
    } catch (error) {
      spinner.fail('Ошибка разбивки документов');
      throw error;
    }
  }

  async uploadToVectorStore(splits) {
    const spinner = ora('Загрузка в векторную базу данных...').start();
    
    try {
      await PineconeStore.fromDocuments(splits, this.embeddings, {
        pineconeIndex: this.index,
        namespace: 'krasski-docs',
        textKey: 'text'
      });
      
      spinner.succeed(`Загружено ${splits.length} чанков в Pinecone`);
      
      return true;
    } catch (error) {
      spinner.fail('Ошибка загрузки в Pinecone');
      throw error;
    }
  }

  async clearVectorStore() {
    const spinner = ora('Очистка векторной базы данных...').start();
    
    try {
      await this.index.namespace('krasski-docs').deleteAll();
      
      spinner.succeed('Векторная база данных очищена');
      
      return true;
    } catch (error) {
      spinner.fail('Ошибка очистки базы данных');
      throw error;
    }
  }

  async testQuery(query = 'Сколько стоит прокат лыж?') {
    const spinner = ora('Тестовый запрос...').start();
    
    try {
      const vectorStore = await PineconeStore.fromExistingIndex(this.embeddings, {
        pineconeIndex: this.index,
        namespace: 'krasski-docs',
        textKey: 'text'
      });
      
      const results = await vectorStore.similaritySearchWithScore(query, 5);
      
      spinner.succeed('Тестовый запрос выполнен');
      
      console.log(chalk.cyan('\n📊 Результаты поиска:\n'));
      
      results.forEach((result, index) => {
        const [doc, score] = result;
        console.log(chalk.yellow(`\n${index + 1}. Релевантность: ${(score * 100).toFixed(2)}%`));
        console.log(chalk.gray(`   Файл: ${doc.metadata.filename}`));
        console.log(chalk.gray(`   Категория: ${doc.metadata.category}`));
        console.log(chalk.white(`   Текст: ${doc.pageContent.substring(0, 200)}...`));
      });
      
      return results;
    } catch (error) {
      spinner.fail('Ошибка тестового запроса');
      throw error;
    }
  }

  async getStats() {
    const spinner = ora('Получение статистики...').start();
    
    try {
      const stats = await this.index.describeIndexStats();
      
      spinner.succeed('Статистика получена');
      
      console.log(chalk.cyan('\n📈 Статистика индекса:\n'));
      console.log(chalk.white(`   Всего векторов: ${stats.totalRecordCount || 0}`));
      console.log(chalk.white(`   Размерность: ${stats.dimension || 0}`));
      
      if (stats.namespaces && stats.namespaces['krasski-docs']) {
        console.log(chalk.white(`   Векторов в namespace 'krasski-docs': ${stats.namespaces['krasski-docs'].recordCount}`));
      }
      
      return stats;
    } catch (error) {
      spinner.fail('Ошибка получения статистики');
      throw error;
    }
  }
}
