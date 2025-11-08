/**
 * AtenMed - Document Service
 * Serviço para processar documentos da knowledge base
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Processar upload de documento
 */
async function processDocument(file, agentId) {
    try {
        // Criar diretório de uploads se não existir
        const uploadDir = path.join(__dirname, '../uploads/documents', agentId);
        await fs.mkdir(uploadDir, { recursive: true });
        
        // Salvar arquivo
        const filePath = path.join(uploadDir, file.originalname);
        await fs.writeFile(filePath, file.buffer);
        
        // Extrair texto (básico - pode ser expandido para PDF, DOCX, etc)
        const content = await extractText(filePath, file.mimetype);
        
        return {
            success: true,
            filePath,
            content,
            size: file.size,
            type: file.mimetype
        };
        
    } catch (error) {
        logger.error('Erro ao processar documento:', error);
        throw error;
    }
}

/**
 * Extrair texto do arquivo
 */
async function extractText(filePath, mimeType) {
    try {
        // Arquivos de texto
        if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/html') {
            return await fs.readFile(filePath, 'utf-8');
        }
        
        // PDF
        if (mimeType === 'application/pdf') {
            try {
                const pdfParse = require('pdf-parse');
                const dataBuffer = await fs.readFile(filePath);
                const data = await pdfParse(dataBuffer);
                return data.text;
            } catch (error) {
                logger.error('Erro ao processar PDF:', error);
                return `[Erro ao processar PDF: ${error.message}]`;
            }
        }
        
        // DOCX
        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            mimeType === 'application/msword') {
            try {
                const mammoth = require('mammoth');
                const result = await mammoth.extractRawText({ path: filePath });
                return result.value;
            } catch (error) {
                logger.error('Erro ao processar DOCX:', error);
                return `[Erro ao processar DOCX: ${error.message}]`;
            }
        }
        
        // Para outros tipos, retornar placeholder
        return `[Conteúdo do arquivo ${path.basename(filePath)} - tipo ${mimeType} não suportado ainda]`;
        
    } catch (error) {
        logger.error('Erro ao extrair texto:', error);
        return '';
    }
}

/**
 * Crawler de URL (básico)
 */
async function crawlURL(url) {
    try {
        const axios = require('axios');
        const cheerio = require('cheerio');
        
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AtenMed Bot)'
            }
        });
        
        const $ = cheerio.load(response.data);
        
        // Remover scripts e styles
        $('script, style').remove();
        
        // Extrair texto principal
        const text = $('body').text()
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000); // Limitar tamanho
        
        return {
            success: true,
            url,
            content: text,
            title: $('title').text() || url,
            crawledAt: new Date()
        };
        
    } catch (error) {
        logger.error('Erro ao fazer crawl da URL:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    processDocument,
    extractText,
    crawlURL
};

