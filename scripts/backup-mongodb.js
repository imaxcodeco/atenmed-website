#!/usr/bin/env node

/**
 * Script: Backup do MongoDB
 * 
 * Faz backup do banco de dados MongoDB (Atlas ou local)
 * Salva em formato JSON comprimido
 * 
 * Uso: node scripts/backup-mongodb.js
 * 
 * Agendar com cron (diariamente às 2h):
 * 0 2 * * * node /path/to/atenmed/scripts/backup-mongodb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const logger = require('../utils/logger');

// Configurações
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 7; // Manter últimos 7 backups

async function backupMongoDB() {
    try {
        console.log('\n💾 Iniciando backup do MongoDB...\n');
        
        // Criar diretório de backups se não existir
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
            console.log(`✅ Diretório de backups criado: ${BACKUP_DIR}\n`);
        }

        // Verificar conexão
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI não configurada');
        }

        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB\n');

        // Obter nome do banco
        const dbName = mongoose.connection.db.databaseName;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const backupFileName = `atenmed-backup-${timestamp}.json`;
        const backupPath = path.join(BACKUP_DIR, backupFileName);

        console.log(`📦 Fazendo backup do banco: ${dbName}`);
        console.log(`📁 Arquivo: ${backupFileName}\n`);

        // Listar todas as coleções
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📋 Encontradas ${collections.length} coleções:\n`);

        const backupData = {
            backupDate: new Date().toISOString(),
            database: dbName,
            collections: {}
        };

        // Fazer backup de cada coleção
        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            
            // Pular coleções do sistema
            if (collectionName.startsWith('system.')) {
                continue;
            }

            console.log(`   📄 Backing up: ${collectionName}...`);
            
            try {
                const documents = await mongoose.connection.db
                    .collection(collectionName)
                    .find({})
                    .toArray();
                
                backupData.collections[collectionName] = documents;
                console.log(`      ✓ ${documents.length} documentos\n`);
            } catch (error) {
                console.error(`      ❌ Erro ao fazer backup de ${collectionName}:`, error.message);
            }
        }

        // Salvar backup em arquivo JSON
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        console.log(`✅ Backup salvo: ${backupPath}\n`);

        // Comprimir backup (se zip estiver disponível)
        try {
            const zipPath = backupPath.replace('.json', '.zip');
            exec(`zip -j "${zipPath}" "${backupPath}"`, (error) => {
                if (!error) {
                    console.log(`✅ Backup comprimido: ${zipPath}\n`);
                    // Remover JSON original após comprimir
                    fs.unlinkSync(backupPath);
                }
            });
        } catch (error) {
            console.log('   ℹ️  Zip não disponível, mantendo JSON não comprimido\n');
        }

        // Limpar backups antigos
        await cleanupOldBackups();

        // Estatísticas
        const stats = fs.statSync(backupPath.replace('.json', '.zip') || backupPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        
        console.log('════════════════════════════════════════');
        console.log('   📊 RESUMO DO BACKUP');
        console.log('════════════════════════════════════════');
        console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
        console.log(`💾 Banco: ${dbName}`);
        console.log(`📦 Coleções: ${Object.keys(backupData.collections).length}`);
        console.log(`📁 Arquivo: ${backupFileName}`);
        console.log(`💿 Tamanho: ${sizeMB} MB`);
        console.log('════════════════════════════════════════\n');

        logger.info('Backup do MongoDB concluído', {
            database: dbName,
            collections: Object.keys(backupData.collections).length,
            file: backupFileName,
            size: `${sizeMB} MB`
        });

    } catch (error) {
        console.error('❌ ERRO no backup:', error);
        logger.error('Erro no backup do MongoDB:', error);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        console.log('👋 Processo finalizado.\n');
    }
}

async function cleanupOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('atenmed-backup-'))
            .map(f => ({
                name: f,
                path: path.join(BACKUP_DIR, f),
                mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime
            }))
            .sort((a, b) => b.mtime - a.mtime); // Mais recentes primeiro

        if (files.length > MAX_BACKUPS) {
            const toDelete = files.slice(MAX_BACKUPS);
            console.log(`🗑️  Removendo ${toDelete.length} backup(s) antigo(s):\n`);
            
            for (const file of toDelete) {
                fs.unlinkSync(file.path);
                console.log(`   ✓ Removido: ${file.name}`);
            }
            console.log('');
        }
    } catch (error) {
        console.error('⚠️  Erro ao limpar backups antigos:', error.message);
    }
}

// Executar backup
if (require.main === module) {
    backupMongoDB();
}

module.exports = { backupMongoDB };

