/**
 * AtenMed - Analytics Service
 * Serviço para calcular métricas e estatísticas avançadas
 */

const Conversation = require('../models/Conversation');
const Agent = require('../models/Agent');
const logger = require('../utils/logger');

/**
 * Obter métricas gerais
 */
async function getGeneralMetrics(clinicId, startDate, endDate) {
    try {
        const query = {
            clinic: clinicId,
            lastMessageAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        
        const conversations = await Conversation.find(query);
        
        const totalConversations = conversations.length;
        const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
        const activeConversations = conversations.filter(c => c.status === 'active').length;
        const completedConversations = conversations.filter(c => c.status === 'completed').length;
        const leadsGenerated = conversations.filter(c => c.leadGenerated).length;
        
        // Taxa de conversão (leads / conversas)
        const conversionRate = totalConversations > 0 
            ? ((leadsGenerated / totalConversations) * 100).toFixed(1)
            : 0;
        
        // Tempo médio de resposta
        const responseTimes = [];
        conversations.forEach(conv => {
            for (let i = 0; i < conv.messages.length - 1; i++) {
                if (conv.messages[i].role === 'user' && conv.messages[i + 1].role === 'assistant') {
                    const responseTime = conv.messages[i + 1].timestamp - conv.messages[i].timestamp;
                    responseTimes.push(responseTime);
                }
            }
        });
        
        const avgResponseTime = responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000) // segundos
            : 0;
        
        // Taxa de satisfação
        const ratedConversations = conversations.filter(c => c.satisfaction?.rating);
        const avgSatisfaction = ratedConversations.length > 0
            ? (ratedConversations.reduce((sum, c) => sum + c.satisfaction.rating, 0) / ratedConversations.length).toFixed(1)
            : 0;
        
        return {
            totalConversations,
            totalMessages,
            activeConversations,
            completedConversations,
            leadsGenerated,
            conversionRate: parseFloat(conversionRate),
            avgResponseTime,
            avgSatisfaction: parseFloat(avgSatisfaction),
            satisfactionCount: ratedConversations.length
        };
        
    } catch (error) {
        logger.error('Erro ao calcular métricas gerais:', error);
        throw error;
    }
}

/**
 * Obter métricas por dia
 */
async function getDailyMetrics(clinicId, startDate, endDate) {
    try {
        const query = {
            clinic: clinicId,
            lastMessageAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        
        const conversations = await Conversation.find(query);
        
        // Agrupar por dia
        const dailyData = {};
        
        conversations.forEach(conv => {
            const date = new Date(conv.lastMessageAt).toISOString().split('T')[0];
            if (!dailyData[date]) {
                dailyData[date] = {
                    date,
                    conversations: 0,
                    messages: 0,
                    leads: 0
                };
            }
            dailyData[date].conversations++;
            dailyData[date].messages += conv.messages.length;
            if (conv.leadGenerated) {
                dailyData[date].leads++;
            }
        });
        
        // Converter para array e ordenar
        return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
        
    } catch (error) {
        logger.error('Erro ao calcular métricas diárias:', error);
        throw error;
    }
}

/**
 * Obter métricas por agente
 */
async function getAgentMetrics(clinicId, startDate, endDate) {
    try {
        const query = {
            clinic: clinicId,
            lastMessageAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        
        const conversations = await Conversation.find(query).populate('agent', 'name');
        
        // Agrupar por agente
        const agentData = {};
        
        conversations.forEach(conv => {
            const agentId = conv.agent?._id?.toString() || 'unknown';
            const agentName = conv.agent?.name || 'Agente Desconhecido';
            
            if (!agentData[agentId]) {
                agentData[agentId] = {
                    agentId,
                    agentName,
                    conversations: 0,
                    messages: 0,
                    leads: 0,
                    avgSatisfaction: 0,
                    satisfactionCount: 0
                };
            }
            
            agentData[agentId].conversations++;
            agentData[agentId].messages += conv.messages.length;
            if (conv.leadGenerated) {
                agentData[agentId].leads++;
            }
            if (conv.satisfaction?.rating) {
                agentData[agentId].satisfactionCount++;
                agentData[agentId].avgSatisfaction += conv.satisfaction.rating;
            }
        });
        
        // Calcular médias
        Object.values(agentData).forEach(agent => {
            if (agent.satisfactionCount > 0) {
                agent.avgSatisfaction = (agent.avgSatisfaction / agent.satisfactionCount).toFixed(1);
            }
            agent.conversionRate = agent.conversations > 0
                ? ((agent.leads / agent.conversations) * 100).toFixed(1)
                : 0;
        });
        
        return Object.values(agentData);
        
    } catch (error) {
        logger.error('Erro ao calcular métricas por agente:', error);
        throw error;
    }
}

/**
 * Obter métricas por canal
 */
async function getChannelMetrics(clinicId, startDate, endDate) {
    try {
        const query = {
            clinic: clinicId,
            lastMessageAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        
        const conversations = await Conversation.find(query);
        
        const channelData = {};
        
        conversations.forEach(conv => {
            const channel = conv.channel || 'other';
            if (!channelData[channel]) {
                channelData[channel] = {
                    channel,
                    conversations: 0,
                    messages: 0,
                    leads: 0
                };
            }
            channelData[channel].conversations++;
            channelData[channel].messages += conv.messages.length;
            if (conv.leadGenerated) {
                channelData[channel].leads++;
            }
        });
        
        return Object.values(channelData);
        
    } catch (error) {
        logger.error('Erro ao calcular métricas por canal:', error);
        throw error;
    }
}

/**
 * Obter tendências
 */
async function getTrends(clinicId, days = 30) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const dailyMetrics = await getDailyMetrics(clinicId, startDate, endDate);
        
        // Calcular tendências
        if (dailyMetrics.length < 2) {
            return {
                conversations: 0,
                messages: 0,
                leads: 0
            };
        }
        
        const firstHalf = dailyMetrics.slice(0, Math.floor(dailyMetrics.length / 2));
        const secondHalf = dailyMetrics.slice(Math.floor(dailyMetrics.length / 2));
        
        const avgFirst = {
            conversations: firstHalf.reduce((sum, d) => sum + d.conversations, 0) / firstHalf.length,
            messages: firstHalf.reduce((sum, d) => sum + d.messages, 0) / firstHalf.length,
            leads: firstHalf.reduce((sum, d) => sum + d.leads, 0) / firstHalf.length
        };
        
        const avgSecond = {
            conversations: secondHalf.reduce((sum, d) => sum + d.conversations, 0) / secondHalf.length,
            messages: secondHalf.reduce((sum, d) => sum + d.messages, 0) / secondHalf.length,
            leads: secondHalf.reduce((sum, d) => sum + d.leads, 0) / secondHalf.length
        };
        
        return {
            conversations: ((avgSecond.conversations - avgFirst.conversations) / avgFirst.conversations * 100).toFixed(1),
            messages: ((avgSecond.messages - avgFirst.messages) / avgFirst.messages * 100).toFixed(1),
            leads: ((avgSecond.leads - avgFirst.leads) / avgFirst.leads * 100).toFixed(1)
        };
        
    } catch (error) {
        logger.error('Erro ao calcular tendências:', error);
        throw error;
    }
}

/**
 * Obter métricas de horários (pico de uso)
 */
async function getHourlyMetrics(clinicId, startDate, endDate) {
    try {
        const query = {
            clinic: clinicId,
            lastMessageAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        
        const conversations = await Conversation.find(query);
        
        const hourlyData = Array(24).fill(0).map((_, hour) => ({
            hour,
            conversations: 0,
            messages: 0
        }));
        
        conversations.forEach(conv => {
            const hour = new Date(conv.lastMessageAt).getHours();
            hourlyData[hour].conversations++;
            hourlyData[hour].messages += conv.messages.length;
        });
        
        return hourlyData;
        
    } catch (error) {
        logger.error('Erro ao calcular métricas horárias:', error);
        throw error;
    }
}

/**
 * Obter métricas de satisfação detalhadas
 */
async function getSatisfactionMetrics(clinicId, startDate, endDate) {
    try {
        const query = {
            clinic: clinicId,
            lastMessageAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            'satisfaction.rating': { $exists: true }
        };
        
        const conversations = await Conversation.find(query);
        
        const ratings = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };
        
        let totalRating = 0;
        let totalCount = 0;
        
        conversations.forEach(conv => {
            const rating = conv.satisfaction.rating;
            if (rating >= 1 && rating <= 5) {
                ratings[rating]++;
                totalRating += rating;
                totalCount++;
            }
        });
        
        return {
            distribution: ratings,
            average: totalCount > 0 ? (totalRating / totalCount).toFixed(1) : 0,
            total: totalCount,
            percentage: {
                positive: totalCount > 0 ? (((ratings[4] + ratings[5]) / totalCount) * 100).toFixed(1) : 0,
                neutral: totalCount > 0 ? ((ratings[3] / totalCount) * 100).toFixed(1) : 0,
                negative: totalCount > 0 ? (((ratings[1] + ratings[2]) / totalCount) * 100).toFixed(1) : 0
            }
        };
        
    } catch (error) {
        logger.error('Erro ao calcular métricas de satisfação:', error);
        throw error;
    }
}

/**
 * Obter métricas de intenções detectadas
 */
async function getIntentMetrics(clinicId, startDate, endDate) {
    try {
        const query = {
            clinic: clinicId,
            lastMessageAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        
        const conversations = await Conversation.find(query);
        
        const intents = {};
        
        conversations.forEach(conv => {
            conv.messages.forEach(msg => {
                if (msg.intent) {
                    intents[msg.intent] = (intents[msg.intent] || 0) + 1;
                }
            });
        });
        
        // Ordenar por frequência
        const sortedIntents = Object.entries(intents)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10) // Top 10
            .map(([intent, count]) => ({
                intent,
                count,
                percentage: ((count / conversations.length) * 100).toFixed(1)
            }));
        
        return sortedIntents;
        
    } catch (error) {
        logger.error('Erro ao calcular métricas de intenções:', error);
        throw error;
    }
}

/**
 * Obter métricas de tempo de resposta por período
 */
async function getResponseTimeMetrics(clinicId, startDate, endDate) {
    try {
        const query = {
            clinic: clinicId,
            lastMessageAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
        
        const conversations = await Conversation.find(query);
        
        const responseTimes = [];
        
        conversations.forEach(conv => {
            for (let i = 0; i < conv.messages.length - 1; i++) {
                if (conv.messages[i].role === 'user' && conv.messages[i + 1].role === 'assistant') {
                    const responseTime = conv.messages[i + 1].timestamp - conv.messages[i].timestamp;
                    responseTimes.push(Math.floor(responseTime / 1000)); // segundos
                }
            }
        });
        
        if (responseTimes.length === 0) {
            return {
                min: 0,
                max: 0,
                avg: 0,
                median: 0,
                p95: 0
            };
        }
        
        responseTimes.sort((a, b) => a - b);
        
        const min = responseTimes[0];
        const max = responseTimes[responseTimes.length - 1];
        const avg = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
        const median = responseTimes[Math.floor(responseTimes.length / 2)];
        const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
        
        return {
            min,
            max,
            avg,
            median,
            p95,
            total: responseTimes.length
        };
        
    } catch (error) {
        logger.error('Erro ao calcular métricas de tempo de resposta:', error);
        throw error;
    }
}

module.exports = {
    getGeneralMetrics,
    getDailyMetrics,
    getAgentMetrics,
    getChannelMetrics,
    getTrends,
    getHourlyMetrics,
    getSatisfactionMetrics,
    getIntentMetrics,
    getResponseTimeMetrics
};

