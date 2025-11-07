#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { RAGLoader } from './loader.js';
import { config, validateConfig } from './config.js';

const program = new Command();

program
  .name('krasski-rag-loader')
  .description('CLI для загрузки базы знаний KRASSKI в векторную БД')
  .version('1.0.0');

program
  .command('load')
  .description('Загрузить все документы в векторную БД')
  .option('-c, --clear', 'Очистить БД перед загрузкой')
  .action(async (options) => {
    try {
      console.log(chalk.bold.cyan('\n🎿 KRASSKI RAG Loader\n'));
      
      validateConfig();
      
      const loader = new RAGLoader();
      await loader.initialize();
      
      if (options.clear) {
        console.log(chalk.yellow('\n⚠️  Очистка существующих данных...\n'));
        await loader.clearVectorStore();
      }
      
      console.log(chalk.cyan('\n📚 Загрузка документов...\n'));
      const docs = await loader.loadDocuments();
      
      console.log(chalk.cyan('\n✂️  Разбивка на чанки...\n'));
      const splits = await loader.splitDocuments(docs);
      
      console.log(chalk.cyan('\n☁️  Загрузка в Pinecone...\n'));
      await loader.uploadToVectorStore(splits);
      
      console.log(chalk.cyan('\n📊 Статистика:\n'));
      await loader.getStats();
      
      console.log(chalk.bold.green('\n✅ Загрузка завершена успешно!\n'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Ошибка:'), error.message);
      process.exit(1);
    }
  });

program
  .command('update')
  .description('Обновить документы (очистить и загрузить заново)')
  .action(async () => {
    try {
      console.log(chalk.bold.cyan('\n🎿 KRASSKI RAG Loader - Обновление\n'));
      
      validateConfig();
      
      const loader = new RAGLoader();
      await loader.initialize();
      
      console.log(chalk.yellow('\n⚠️  Очистка существующих данных...\n'));
      await loader.clearVectorStore();
      
      console.log(chalk.cyan('\n📚 Загрузка документов...\n'));
      const docs = await loader.loadDocuments();
      
      console.log(chalk.cyan('\n✂️  Разбивка на чанки...\n'));
      const splits = await loader.splitDocuments(docs);
      
      console.log(chalk.cyan('\n☁️  Загрузка в Pinecone...\n'));
      await loader.uploadToVectorStore(splits);
      
      console.log(chalk.cyan('\n📊 Статистика:\n'));
      await loader.getStats();
      
      console.log(chalk.bold.green('\n✅ Обновление завершено успешно!\n'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Ошибка:'), error.message);
      process.exit(1);
    }
  });

program
  .command('clear')
  .description('Очистить векторную БД')
  .action(async () => {
    try {
      console.log(chalk.bold.cyan('\n🎿 KRASSKI RAG Loader - Очистка\n'));
      
      validateConfig();
      
      const loader = new RAGLoader();
      await loader.initialize();
      
      console.log(chalk.yellow('\n⚠️  Очистка векторной базы данных...\n'));
      await loader.clearVectorStore();
      
      console.log(chalk.bold.green('\n✅ База данных очищена!\n'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Ошибка:'), error.message);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Тестовый запрос к векторной БД')
  .option('-q, --query <query>', 'Текст запроса', 'Сколько стоит прокат лыж?')
  .action(async (options) => {
    try {
      console.log(chalk.bold.cyan('\n🎿 KRASSKI RAG Loader - Тест\n'));
      
      validateConfig();
      
      const loader = new RAGLoader();
      await loader.initialize();
      
      console.log(chalk.cyan(`\n🔍 Запрос: "${options.query}"\n`));
      await loader.testQuery(options.query);
      
      console.log(chalk.bold.green('\n✅ Тест завершён!\n'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Ошибка:'), error.message);
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Показать статистику векторной БД')
  .action(async () => {
    try {
      console.log(chalk.bold.cyan('\n🎿 KRASSKI RAG Loader - Статистика\n'));
      
      validateConfig();
      
      const loader = new RAGLoader();
      await loader.initialize();
      
      await loader.getStats();
      
      console.log(chalk.bold.green('\n✅ Готово!\n'));
      
    } catch (error) {
      console.error(chalk.red('\n❌ Ошибка:'), error.message);
      process.exit(1);
    }
  });

program.parse();
