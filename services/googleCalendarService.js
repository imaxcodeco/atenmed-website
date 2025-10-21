const { google } = require('googleapis');
const logger = require('../utils/logger');

/**
 * Serviço para integração com Google Calendar API
 * Gerencia autenticação, verificação de disponibilidade e criação de eventos
 */
class GoogleCalendarService {
    constructor() {
        this.oauth2Client = null;
        this.savedTokens = null;
        this.initialized = false;
    }

    /**
     * Inicializar o cliente OAuth2
     */
    initialize() {
        try {
            if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
                logger.warn('⚠️ Google Calendar não configurado - credenciais OAuth2 ausentes');
                return false;
            }

            this.oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3000/auth/google/callback'
            );

            this.initialized = true;
            logger.info('✅ Google Calendar Service inicializado');
            return true;
        } catch (error) {
            logger.error('Erro ao inicializar Google Calendar Service:', error);
            return false;
        }
    }

    /**
     * Gerar URL de autenticação
     */
    getAuthUrl() {
        if (!this.oauth2Client) {
            throw new Error('OAuth2 Client não inicializado');
        }

        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent' // Força mostrar tela de consentimento
        });
    }

    /**
     * Trocar código por tokens de acesso
     */
    async getTokenFromCode(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.setCredentials(tokens);
            return tokens;
        } catch (error) {
            logger.error('Erro ao obter tokens do Google:', error);
            throw error;
        }
    }

    /**
     * Definir credenciais (tokens)
     */
    setCredentials(tokens) {
        if (!this.oauth2Client) {
            throw new Error('OAuth2 Client não inicializado');
        }
        
        this.oauth2Client.setCredentials(tokens);
        this.savedTokens = tokens;
        logger.info('✅ Credenciais Google Calendar definidas');
    }

    /**
     * Verificar se está autenticado
     */
    isAuthenticated() {
        return this.savedTokens !== null && this.oauth2Client !== null;
    }

    /**
     * Obter calendário do Google
     */
    getCalendar() {
        if (!this.isAuthenticated()) {
            throw new Error('Não autenticado com Google Calendar');
        }

        return google.calendar({ version: 'v3', auth: this.oauth2Client });
    }

    /**
     * Buscar horários disponíveis em uma data específica
     * @param {string} calendarId - ID do calendário do Google
     * @param {string} date - Data no formato YYYY-MM-DD
     * @param {object} options - Opções de horário de trabalho
     * @returns {Promise<string[]>} - Array de horários disponíveis (HH:MM)
     */
    async getAvailableSlots(calendarId, date, options = {}) {
        try {
            const calendar = this.getCalendar();

            // Opções padrão
            const {
                workingHours = { start: 9, end: 18 },
                slotDuration = 60, // minutos
                timeZone = 'America/Sao_Paulo'
            } = options;

            // Criar timestamps para início e fim do dia
            const timeMin = new Date(`${date}T00:00:00-03:00`);
            const timeMax = new Date(`${date}T23:59:59-03:00`);

            // Buscar períodos ocupados usando Freebusy API
            const response = await calendar.freebusy.query({
                requestBody: {
                    timeMin: timeMin.toISOString(),
                    timeMax: timeMax.toISOString(),
                    timeZone: timeZone,
                    items: [{ id: calendarId }]
                }
            });

            const busySlots = response.data.calendars[calendarId]?.busy || [];

            // Gerar slots disponíveis
            const availableSlots = [];
            let currentTime = new Date(timeMin);
            currentTime.setHours(workingHours.start, 0, 0, 0);

            while (currentTime.getHours() < workingHours.end) {
                const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);

                // Verificar se o slot não está ocupado
                const isBusy = busySlots.some(busy => {
                    const busyStart = new Date(busy.start);
                    const busyEnd = new Date(busy.end);
                    
                    return (
                        (currentTime >= busyStart && currentTime < busyEnd) ||
                        (slotEnd > busyStart && slotEnd <= busyEnd) ||
                        (busyStart >= currentTime && busyStart < slotEnd)
                    );
                });

                if (!isBusy) {
                    availableSlots.push(
                        currentTime.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })
                    );
                }

                currentTime = slotEnd;
            }

            logger.info(`Horários disponíveis encontrados: ${availableSlots.length} slots para ${date}`);
            return availableSlots;

        } catch (error) {
            logger.error('Erro ao buscar horários disponíveis:', error);
            throw new Error(`Erro ao buscar horários disponíveis: ${error.message}`);
        }
    }

    /**
     * Criar evento no Google Calendar
     * @param {string} calendarId - ID do calendário
     * @param {object} appointmentData - Dados do agendamento
     * @returns {Promise<object>} - Evento criado
     */
    async createEvent(calendarId, appointmentData) {
        try {
            const calendar = this.getCalendar();

            const {
                date,
                time,
                duration = 60,
                patientName,
                patientEmail,
                patientPhone,
                doctorName,
                specialty,
                notes = ''
            } = appointmentData;

            // Criar data/hora de início
            const [hours, minutes] = time.split(':');
            const startTime = new Date(`${date}T${hours}:${minutes}:00-03:00`);
            const endTime = new Date(startTime.getTime() + duration * 60000);

            // Preparar descrição do evento
            const description = `
📋 Agendamento via AtenMed

👤 Paciente: ${patientName}
📞 Telefone: ${patientPhone}
${patientEmail ? `📧 Email: ${patientEmail}` : ''}

🏥 Especialidade: ${specialty}
👨‍⚕️ Profissional: ${doctorName}

${notes ? `📝 Observações: ${notes}` : ''}

---
Sistema de Agendamento AtenMed
            `.trim();

            // Criar evento
            const event = {
                summary: `Consulta - ${patientName}`,
                description: description,
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: 'America/Sao_Paulo'
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: 'America/Sao_Paulo'
                },
                attendees: [],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 }, // 1 dia antes
                        { method: 'popup', minutes: 60 } // 1 hora antes
                    ]
                },
                colorId: '9' // Azul
            };

            // Adicionar participantes se tiver email
            if (patientEmail) {
                event.attendees.push({ email: patientEmail });
            }

            // Inserir evento no calendário
            const createdEvent = await calendar.events.insert({
                calendarId: calendarId,
                resource: event,
                sendUpdates: patientEmail ? 'all' : 'none' // Enviar notificações se tiver email
            });

            logger.info(`✅ Evento criado no Google Calendar: ${createdEvent.data.id}`);
            
            return {
                eventId: createdEvent.data.id,
                htmlLink: createdEvent.data.htmlLink,
                status: createdEvent.data.status,
                created: createdEvent.data.created
            };

        } catch (error) {
            logger.error('Erro ao criar evento no Google Calendar:', error);
            throw new Error(`Erro ao criar evento: ${error.message}`);
        }
    }

    /**
     * Atualizar evento no Google Calendar
     * @param {string} calendarId - ID do calendário
     * @param {string} eventId - ID do evento
     * @param {object} updateData - Dados para atualizar
     * @returns {Promise<object>} - Evento atualizado
     */
    async updateEvent(calendarId, eventId, updateData) {
        try {
            const calendar = this.getCalendar();

            // Buscar evento atual
            const currentEvent = await calendar.events.get({
                calendarId: calendarId,
                eventId: eventId
            });

            // Preparar dados de atualização
            const updatedEvent = {
                ...currentEvent.data,
                ...updateData
            };

            // Atualizar evento
            const response = await calendar.events.update({
                calendarId: calendarId,
                eventId: eventId,
                resource: updatedEvent,
                sendUpdates: 'all'
            });

            logger.info(`✅ Evento atualizado: ${eventId}`);
            return response.data;

        } catch (error) {
            logger.error('Erro ao atualizar evento:', error);
            throw new Error(`Erro ao atualizar evento: ${error.message}`);
        }
    }

    /**
     * Cancelar evento no Google Calendar
     * @param {string} calendarId - ID do calendário
     * @param {string} eventId - ID do evento
     * @returns {Promise<void>}
     */
    async cancelEvent(calendarId, eventId) {
        try {
            const calendar = this.getCalendar();

            await calendar.events.delete({
                calendarId: calendarId,
                eventId: eventId,
                sendUpdates: 'all'
            });

            logger.info(`✅ Evento cancelado: ${eventId}`);

        } catch (error) {
            logger.error('Erro ao cancelar evento:', error);
            throw new Error(`Erro ao cancelar evento: ${error.message}`);
        }
    }

    /**
     * Listar eventos de um calendário
     * @param {string} calendarId - ID do calendário
     * @param {object} options - Opções de busca
     * @returns {Promise<Array>} - Lista de eventos
     */
    async listEvents(calendarId, options = {}) {
        try {
            const calendar = this.getCalendar();

            const {
                timeMin = new Date().toISOString(),
                timeMax = null,
                maxResults = 250,
                singleEvents = true,
                orderBy = 'startTime'
            } = options;

            const params = {
                calendarId: calendarId,
                timeMin: timeMin,
                maxResults: maxResults,
                singleEvents: singleEvents,
                orderBy: orderBy
            };

            if (timeMax) {
                params.timeMax = timeMax;
            }

            const response = await calendar.events.list(params);
            return response.data.items || [];

        } catch (error) {
            logger.error('Erro ao listar eventos:', error);
            throw new Error(`Erro ao listar eventos: ${error.message}`);
        }
    }

    /**
     * Verificar se um horário específico está disponível
     * @param {string} calendarId - ID do calendário
     * @param {string} date - Data (YYYY-MM-DD)
     * @param {string} time - Horário (HH:MM)
     * @param {number} duration - Duração em minutos
     * @returns {Promise<boolean>} - true se disponível
     */
    async isTimeSlotAvailable(calendarId, date, time, duration = 60) {
        try {
            const [hours, minutes] = time.split(':');
            const startTime = new Date(`${date}T${hours}:${minutes}:00-03:00`);
            const endTime = new Date(startTime.getTime() + duration * 60000);

            const calendar = this.getCalendar();

            const response = await calendar.freebusy.query({
                requestBody: {
                    timeMin: startTime.toISOString(),
                    timeMax: endTime.toISOString(),
                    timeZone: 'America/Sao_Paulo',
                    items: [{ id: calendarId }]
                }
            });

            const busySlots = response.data.calendars[calendarId]?.busy || [];
            
            return busySlots.length === 0;

        } catch (error) {
            logger.error('Erro ao verificar disponibilidade:', error);
            throw new Error(`Erro ao verificar disponibilidade: ${error.message}`);
        }
    }
}

// Criar instância singleton
const googleCalendarService = new GoogleCalendarService();

module.exports = googleCalendarService;

