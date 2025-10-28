/**
 * AtenMed - Modulo de Mensagens Humanizadas
 * Sistema de mensagens naturais e empaticas para WhatsApp
 */

// ===== FUNCOES AUXILIARES =====

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
}

// ===== SAUDACOES INICIAIS =====

function getWelcomeMessage(clinicName = 'AtenMed', patientName = null) {
    const greeting = getGreeting();
    
    const greetings = [
        `${greeting}! Tudo bem?`,
        `${greeting}! Como vai?`,
        `${greeting}! Espero que esteja bem!`,
        `${greeting}! Prazer em falar com voce!`,
        `${greeting}! Que bom ter voce aqui!`
    ];
    
    const introductions = [
        `Aqui e da *${clinicName}*!`,
        `Sou da equipe *${clinicName}*!`,
        `Falo da *${clinicName}*, tudo certo?`,
        `E um prazer atender voce pela *${clinicName}*!`
    ];
    
    const helpOffers = [
        'Em que posso te ajudar hoje?',
        'Como posso te ajudar?',
        'O que voce precisa hoje?',
        'Vamos ver como posso te ajudar?'
    ];
    
    let message = `${randomChoice(greetings)}\n${randomChoice(introductions)}\n\n`;
    
    if (patientName) {
        message = `${greeting}, ${patientName}! Que bom falar com voce de novo!\n${randomChoice(introductions)}\n\n`;
    }
    
    message += `${randomChoice(helpOffers)}\n\n`;
    message += `1 Quero marcar uma consulta\n`;
    message += `2 Ver minhas consultas agendadas\n`;
    message += `3 Preciso cancelar uma consulta\n`;
    message += `4 Entrar na lista de espera\n`;
    message += `5 Falar com alguem da equipe\n\n`;
    message += `E so digitar o numero da opcao!`;
    
    return message;
}

// ===== MENSAGENS DE AGENDAMENTO =====

function getScheduleStartMessage() {
    const messages = [
        'Legal! Vamos agendar sua consulta!',
        'Otimo! Vou te ajudar a marcar sua consulta!',
        'Perfeito! Que bom que vai cuidar da sua saude!',
        'Maravilha! Vamos encontrar o melhor horario pra voce!',
        'Que bom! Vamos agendar isso agora mesmo!'
    ];
    
    return `${randomChoice(messages)}\n\nQual especialidade voce precisa?`;
}

function getSpecialtySelectedMessage(specialtyName) {
    const messages = [
        `Otimo! Voce escolheu *${specialtyName}*.`,
        `Perfeito! *${specialtyName}* e uma otima escolha!`,
        `Muito bem! Vamos ver os profissionais de *${specialtyName}*.`,
        `Legal! Temos otimos profissionais em *${specialtyName}*!`
    ];
    
    return `${randomChoice(messages)}\n\nTemos profissionais disponiveis:`;
}

function getDoctorSelectedMessage(doctorName) {
    const messages = [
        `Excelente escolha! Dr(a) *${doctorName}* e muito bom!`,
        `Otimo! Dr(a) *${doctorName}* vai te atender super bem!`,
        `Perfeito! Dr(a) *${doctorName}* e um(a) profissional incrivel!`,
        `Muito bem! Voce vai gostar do atendimento do(a) Dr(a) *${doctorName}*!`
    ];
    
    return randomChoice(messages);
}

function getDateRequestMessage() {
    const messages = [
        'Agora me diz: *qual data voce prefere?*',
        'Perfeito! *Que dia seria melhor pra voce?*',
        'Vamos la! *Qual data funciona pra voce?*',
        'Otimo! *Em que dia voce gostaria?*'
    ];
    
    return `${randomChoice(messages)}\n\nUse o formato: DD/MM\nExemplo: 15/12\n\n_Temos horarios de segunda a sexta!_`;
}

function getTimeRequestMessage(date) {
    const messages = [
        `Show! Para o dia *${date}*:`,
        `Perfeito! No dia *${date}* temos:`,
        `Otimo! Dia *${date}*, que horario prefere?`,
        `Legal! Para *${date}*, qual horario e melhor?`
    ];
    
    return `${randomChoice(messages)}\n\nEscolha o horario:\n\nUse o formato: HH:MM\nExemplo: 14:30\n\n_Atendemos de 08:00 as 18:00_`;
}

function getNameRequestMessage() {
    const messages = [
        'Perfeito! Agora preciso do seu nome completo, por favor!',
        'Quase la! So preciso que me diga seu nome completo!',
        'Otimo! Pode me dizer seu nome completo?',
        'Maravilha! Me diz seu nome completo pra eu confirmar?'
    ];
    
    return randomChoice(messages);
}

function getConfirmationMessage(patientName, doctorName, date, time) {
    const messages = [
        'Perfeito! Deixa eu confirmar os dados:',
        'Muito bem! Vou revisar tudo com voce:',
        'Otimo! So pra ter certeza, esta tudo certo?',
        'Legal! Deixa eu ver se esta tudo certinho:'
    ];
    
    return `${randomChoice(messages)}\n\n` +
        `*Paciente:* ${patientName}\n` +
        `*Medico:* ${doctorName}\n` +
        `*Data:* ${date}\n` +
        `*Horario:* ${time}\n\n` +
        `Esta tudo certo?\n\n` +
        `1 Sim, confirmar!\n` +
        `2 Nao, cancelar`;
}

function getSuccessMessage(patientName, date, time, doctorName) {
    const messages = [
        `Pronto! Consulta agendada com sucesso!`,
        `Maravilha! Sua consulta esta confirmada!`,
        `Perfeito! Esta tudo certo!`,
        `Otimo! Agendamento confirmado!`
    ];
    
    return `${randomChoice(messages)}\n\n` +
        `*Paciente:* ${patientName}\n` +
        `*Data:* ${date}\n` +
        `*Horario:* ${time}\n` +
        `*Medico(a):* Dr(a) ${doctorName}\n\n` +
        `Vou te mandar um lembrete antes da consulta!\n\n` +
        `Qualquer duvida, e so mandar mensagem!\n\n` +
        `_Digite *menu* para mais opcoes._`;
}

// ===== MENSAGENS DE ERRO =====

function getInvalidOptionMessage() {
    const messages = [
        'Ops! Nao entendi...',
        'Hmm, nao consegui entender...',
        'Desculpa, nao peguei...',
        'Opa! Acho que nao entendi direito...'
    ];
    
    return `${randomChoice(messages)}\n\n` +
        `Digite o *numero* da opcao que voce quer:\n` +
        `1 - Marcar consulta\n` +
        `2 - Ver consultas\n` +
        `3 - Cancelar\n` +
        `4 - Lista de espera\n` +
        `5 - Falar com alguem\n\n` +
        `Ou digite *menu* para ver todas as opcoes!`;
}

function getInvalidNumberMessage() {
    const messages = [
        'Hmm, numero invalido...',
        'Ops! Esse numero nao esta nas opcoes...',
        'Desculpa, nao encontrei essa opcao...',
        'Opa! Esse numero nao e valido...'
    ];
    
    return `${randomChoice(messages)}\n\nTenta de novo ou digite *menu* para voltar!`;
}

function getInvalidDateMessage() {
    const messages = [
        'Ops! Data invalida...',
        'Hmm, nao consegui entender essa data...',
        'Desculpa, essa data nao ficou clara...',
        'Opa! Formato de data incorreto...'
    ];
    
    return `${randomChoice(messages)}\n\nUse o formato: DD/MM\nExemplo: 15/12`;
}

function getPastDateMessage() {
    const messages = [
        'Ops! Essa data ja passou...',
        'Hmm, essa data e no passado...',
        'Essa data ja foi, amigo(a)!',
        'Opa! Nao podemos voltar no tempo...'
    ];
    
    return `${randomChoice(messages)}\n\nEscolhe uma data futura, por favor!`;
}

function getInvalidTimeMessage() {
    const messages = [
        'Ops! Horario invalido...',
        'Hmm, nao entendi esse horario...',
        'Desculpa, formato de horario incorreto...',
        'Opa! Esse horario nao esta certo...'
    ];
    
    return `${randomChoice(messages)}\n\nUse o formato: HH:MM\nExemplo: 14:30`;
}

function getShortNameMessage() {
    const messages = [
        'Nome muito curto!',
        'Hmm, preciso do nome completo...',
        'Pode me dizer o nome completo, por favor?',
        'Ops! Preciso do seu nome completo!'
    ];
    
    return `${randomChoice(messages)}\n\nDigite seu *nome completo*.`;
}

function getCancellationMessage() {
    const messages = [
        'Tudo bem! Sem problemas!',
        'Ok! Fica tranquilo(a)!',
        'Tudo certo! Nao tem problema!',
        'Tranquilo! A gente entende!'
    ];
    
    return `${randomChoice(messages)}\n\nAgendamento cancelado.\n\nDigite *menu* quando quiser tentar novamente!`;
}

function getErrorMessage() {
    const messages = [
        'Ops! Algo deu errado...',
        'Desculpa! Tivemos um probleminha...',
        'Opa! Aconteceu um erro aqui...',
        'Hmm, algo nao saiu como esperado...'
    ];
    
    return `${randomChoice(messages)}\n\nTenta de novo digitando *menu*, por favor!\n\nSe continuar com problema, fala com a gente digitando 5!`;
}

// ===== MENSAGENS DE CONSULTAS =====

function getNoAppointmentsMessage() {
    const messages = [
        'Voce nao tem consultas agendadas no momento.',
        'Sem consultas por enquanto!',
        'Nenhuma consulta marcada ainda.',
        'Sua agenda esta limpa no momento!'
    ];
    
    return `${randomChoice(messages)}\n\nQuer marcar uma? Digite *1*!\n\nOu *menu* para ver outras opcoes.`;
}

function getViewAppointmentsHeader() {
    const messages = [
        'Aqui estao suas consultas:',
        'Suas consultas agendadas:',
        'Olha so sua agenda:',
        'Voce tem estas consultas marcadas:'
    ];
    
    return randomChoice(messages);
}

// ===== MENSAGENS DE CANCELAMENTO =====

function getCancelWhichMessage() {
    const messages = [
        'Qual consulta voce quer cancelar?',
        'Me diz qual consulta quer desmarcar?',
        'Qual dessas voce precisa cancelar?',
        'Que consulta voce gostaria de cancelar?'
    ];
    
    return randomChoice(messages);
}

function getCancelConfirmMessage(doctorName, date) {
    const messages = [
        `Tem certeza que quer cancelar?`,
        `Confirma o cancelamento?`,
        `Realmente quer desmarcar?`,
        `Voce tem certeza?`
    ];
    
    return `${randomChoice(messages)}\n\n` +
        `*Medico:* Dr(a) ${doctorName}\n` +
        `*Data:* ${date}\n\n` +
        `1 Sim, cancelar\n` +
        `2 Nao, manter`;
}

function getCancelledSuccessMessage() {
    const messages = [
        'Consulta cancelada com sucesso!',
        'Pronto! Consulta desmarcada!',
        'Ok! Cancelamento feito!',
        'Tudo certo! Consulta cancelada!'
    ];
    
    return `${randomChoice(messages)}\n\nSe precisar remarcar, e so digitar *1*!\n\nDigite *menu* para mais opcoes.`;
}

// ===== MENSAGENS DE SUPORTE HUMANO =====

function getHumanSupportMessage() {
    const messages = [
        'Claro! Vou transferir voce para nossa equipe!',
        'Sem problemas! Ja vou chamar alguem pra te ajudar!',
        'Pode deixar! Vou te conectar com a equipe!',
        'Tranquilo! Ja vou passar voce pra um atendente!'
    ];
    
    return `${randomChoice(messages)}\n\nEm alguns instantes alguem vai te responder!\n\n_Enquanto isso, fique a vontade para deixar sua mensagem!_`;
}

// ===== LEMBRETES =====

function getReminderMessage(patientName, date, time, doctorName, hoursUntil) {
    let timeText;
    if (hoursUntil <= 1) {
        timeText = 'ja e daqui a pouco';
    } else if (hoursUntil < 24) {
        timeText = `e daqui a ${hoursUntil} hora${hoursUntil > 1 ? 's' : ''}`;
    } else {
        timeText = 'e amanha';
    }
    
    const greetings = [
        'Oi! Passando aqui pra te lembrar...',
        'Ola! Lembrete importante!',
        'Oi! Nao esquece, hein!',
        'Ola! Tudo pronto pra sua consulta?'
    ];
    
    return `${randomChoice(greetings)}\n\n` +
        `Sua consulta ${timeText}!\n\n` +
        `*Paciente:* ${patientName}\n` +
        `*Data:* ${date}\n` +
        `*Horario:* ${time}\n` +
        `*Medico(a):* Dr(a) ${doctorName}\n\n` +
        `Voce vai conseguir vir?\n\n` +
        `1 Sim! Vou comparecer\n` +
        `2 Preciso remarcar`;
}

// ===== EXPORTAR =====

module.exports = {
    getWelcomeMessage,
    getScheduleStartMessage,
    getSpecialtySelectedMessage,
    getDoctorSelectedMessage,
    getDateRequestMessage,
    getTimeRequestMessage,
    getNameRequestMessage,
    getConfirmationMessage,
    getSuccessMessage,
    getInvalidOptionMessage,
    getInvalidNumberMessage,
    getInvalidDateMessage,
    getPastDateMessage,
    getInvalidTimeMessage,
    getShortNameMessage,
    getCancellationMessage,
    getErrorMessage,
    getNoAppointmentsMessage,
    getViewAppointmentsHeader,
    getCancelWhichMessage,
    getCancelConfirmMessage,
    getCancelledSuccessMessage,
    getHumanSupportMessage,
    getReminderMessage,
    getGreeting
};

