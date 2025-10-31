/**
 * Validadores e Constantes Reutilizáveis
 * Centraliza validações comuns para uso em modelos e rotas
 */

/**
 * Regex para validação de email (padrão usado em todos os modelos)
 */
exports.EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

/**
 * Mensagem de erro padrão para email inválido
 */
exports.EMAIL_ERROR_MESSAGE = 'Email inválido';

/**
 * Regex para validação de telefone/WhatsApp (formato internacional)
 */
exports.PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * Mensagem de erro padrão para telefone inválido
 */
exports.PHONE_ERROR_MESSAGE = 'Número de telefone inválido (formato: +5511999999999)';

/**
 * Regex para validação de horário (HH:MM)
 */
exports.TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Mensagem de erro padrão para horário inválido
 */
exports.TIME_ERROR_MESSAGE = 'Formato de horário inválido (HH:MM)';

/**
 * Valida email usando regex padrão
 * @param {string} email - Email a validar
 * @returns {boolean} True se válido
 */
exports.isValidEmail = (email) => {
    return exports.EMAIL_REGEX.test(email);
};

/**
 * Valida telefone usando regex padrão
 * @param {string} phone - Telefone a validar
 * @returns {boolean} True se válido
 */
exports.isValidPhone = (phone) => {
    return exports.PHONE_REGEX.test(phone);
};

/**
 * Valida horário usando regex padrão
 * @param {string} time - Horário a validar (HH:MM)
 * @returns {boolean} True se válido
 */
exports.isValidTime = (time) => {
    return exports.TIME_REGEX.test(time);
};

