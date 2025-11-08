const express = require('express');
const { query } = require('express-validator');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware de validação
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      errors: errors.array(),
    });
  }
  next();
};

// @route   GET /api/services
// @desc    Listar todos os serviços
// @access  Public
router.get('/', async (req, res) => {
  try {
    const services = [
      {
        id: 'automacao-whatsapp',
        nome: 'Automação WhatsApp',
        descricao: 'Automatize atendimentos, lembretes de consultas e confirmações via WhatsApp',
        icone: 'whatsapp',
        caracteristicas: [
          'Confirmação automática de consultas',
          'Lembretes personalizados',
          'Respostas automáticas para perguntas frequentes',
          'Integração com agenda médica',
          'Relatórios de atendimento',
          'Suporte 24/7',
        ],
        beneficios: [
          { numero: '70%', descricao: 'Redução no tempo de atendimento' },
          { numero: '95%', descricao: 'Satisfação dos pacientes' },
          { numero: '24h', descricao: 'Atendimento disponível' },
        ],
        preco: {
          basico: 297,
          profissional: 497,
          completo: 797,
        },
      },
      {
        id: 'agendamento-inteligente',
        nome: 'Agendamento Inteligente',
        descricao: 'Sistema de agendamento integrado com Google Agenda que elimina conflitos',
        icone: 'calendar',
        caracteristicas: [
          'Integração com Google Agenda',
          'Agendamento online 24/7',
          'Prevenção de conflitos de horários',
          'Lembretes automáticos',
          'Gestão de disponibilidade',
          'Relatórios de ocupação',
        ],
        beneficios: [
          { numero: '100%', descricao: 'Eliminação de conflitos' },
          { numero: '40%', descricao: 'Aumento na ocupação' },
          { numero: '0', descricao: 'Agendamentos duplos' },
        ],
        preco: {
          basico: 297,
          profissional: 497,
          completo: 797,
        },
      },
      {
        id: 'criacao-sites',
        nome: 'Criação de Sites Profissionais',
        descricao: 'Desenvolvemos sites modernos, responsivos e otimizados para consultórios',
        icone: 'website',
        caracteristicas: [
          'Design responsivo e moderno',
          'Otimização para SEO',
          'Integração com agendamento',
          'Formulários de contato',
          'Galeria de fotos',
          'Hospedagem e manutenção',
        ],
        beneficios: [
          { numero: '300%', descricao: 'Aumento na credibilidade' },
          { numero: '50%', descricao: 'Mais pacientes online' },
          { numero: '24/7', descricao: 'Presença digital' },
        ],
        preco: {
          basico: 297,
          profissional: 497,
          completo: 797,
        },
      },
    ];

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
    });
  }
});

// @route   GET /api/services/:id
// @desc    Obter serviço específico
// @access  Public
router.get(
  '/:id',
  [query('id').isIn(['automacao-whatsapp', 'agendamento-inteligente', 'criacao-sites'])],
  validateRequest,
  async (req, res) => {
    try {
      const serviceId = req.params.id;

      const services = {
        'automacao-whatsapp': {
          id: 'automacao-whatsapp',
          nome: 'Automação WhatsApp',
          descricao: 'Transforme seu WhatsApp em uma central de atendimento inteligente',
          descricaoCompleta:
            'Nossa solução automatiza confirmações, lembretes, agendamentos e respostas frequentes, reduzindo a carga de trabalho da sua equipe em até 70%.',
          icone: 'whatsapp',
          caracteristicas: [
            'Confirmação automática de consultas',
            'Lembretes personalizados',
            'Respostas automáticas para perguntas frequentes',
            'Integração com agenda médica',
            'Relatórios de atendimento',
            'Suporte 24/7',
          ],
          beneficios: [
            { numero: '70%', descricao: 'Redução no tempo de atendimento' },
            { numero: '95%', descricao: 'Satisfação dos pacientes' },
            { numero: '24h', descricao: 'Atendimento disponível' },
          ],
          casosUso: [
            'Clínicas com alta demanda de agendamentos',
            'Consultórios que querem reduzir no-show',
            'Estabelecimentos que buscam atendimento 24/7',
          ],
          preco: {
            basico: 297,
            profissional: 497,
            completo: 797,
          },
        },
        'agendamento-inteligente': {
          id: 'agendamento-inteligente',
          nome: 'Agendamento Inteligente',
          descricao: 'Sistema de agendamento integrado com Google Agenda',
          descricaoCompleta:
            'Elimina conflitos de horários, otimiza sua agenda e permite que pacientes agendem consultas online 24 horas por dia.',
          icone: 'calendar',
          caracteristicas: [
            'Integração com Google Agenda',
            'Agendamento online 24/7',
            'Prevenção de conflitos de horários',
            'Lembretes automáticos',
            'Gestão de disponibilidade',
            'Relatórios de ocupação',
          ],
          beneficios: [
            { numero: '100%', descricao: 'Eliminação de conflitos' },
            { numero: '40%', descricao: 'Aumento na ocupação' },
            { numero: '0', descricao: 'Agendamentos duplos' },
          ],
          casosUso: [
            'Consultórios com múltiplos profissionais',
            'Clínicas com agenda complexa',
            'Estabelecimentos que querem agendamento online',
          ],
          preco: {
            basico: 297,
            profissional: 497,
            completo: 797,
          },
        },
        'criacao-sites': {
          id: 'criacao-sites',
          nome: 'Criação de Sites Profissionais',
          descricao: 'Desenvolvemos sites modernos e responsivos para consultórios',
          descricaoCompleta:
            'Aumente sua presença digital, credibilidade e atraia mais pacientes com um site profissional desenvolvido especificamente para o setor de saúde.',
          icone: 'website',
          caracteristicas: [
            'Design responsivo e moderno',
            'Otimização para SEO',
            'Integração com agendamento',
            'Formulários de contato',
            'Galeria de fotos',
            'Hospedagem e manutenção',
          ],
          beneficios: [
            { numero: '300%', descricao: 'Aumento na credibilidade' },
            { numero: '50%', descricao: 'Mais pacientes online' },
            { numero: '24/7', descricao: 'Presença digital' },
          ],
          casosUso: [
            'Consultórios sem presença digital',
            'Clínicas que querem modernizar',
            'Estabelecimentos que buscam mais pacientes',
          ],
          preco: {
            basico: 297,
            profissional: 497,
            completo: 797,
          },
        },
      };

      const service = services[serviceId];

      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Serviço não encontrado',
          code: 'SERVICE_NOT_FOUND',
        });
      }

      res.json({
        success: true,
        data: service,
      });
    } catch (error) {
      logger.logError(error, req);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
);

// @route   GET /api/services/plans/pricing
// @desc    Obter planos e preços
// @access  Public
router.get('/plans/pricing', async (req, res) => {
  try {
    const plans = [
      {
        id: 'basico',
        nome: 'Básico',
        preco: 297,
        periodo: 'mês',
        descricao: 'Ideal para consultórios pequenos',
        caracteristicas: [
          'Automação WhatsApp básica',
          'Até 100 mensagens/mês',
          'Suporte por email',
          'Relatórios básicos',
        ],
        limiteMensagens: 100,
        suporte: 'email',
        relatorios: 'basicos',
      },
      {
        id: 'profissional',
        nome: 'Profissional',
        preco: 497,
        periodo: 'mês',
        descricao: 'Mais popular - Para consultórios em crescimento',
        caracteristicas: [
          'Automação WhatsApp completa',
          'Agendamento inteligente',
          'Até 500 mensagens/mês',
          'Suporte prioritário',
          'Relatórios avançados',
          'Integração com agenda',
        ],
        limiteMensagens: 500,
        suporte: 'prioritario',
        relatorios: 'avancados',
        destaque: true,
      },
      {
        id: 'completo',
        nome: 'Completo',
        preco: 797,
        periodo: 'mês',
        descricao: 'Solução completa para clínicas grandes',
        caracteristicas: [
          'Todos os recursos',
          'Site profissional incluído',
          'Mensagens ilimitadas',
          'Suporte 24/7',
          'Consultoria personalizada',
          'Treinamento da equipe',
        ],
        limiteMensagens: -1, // Ilimitado
        suporte: '24/7',
        relatorios: 'completos',
        incluiSite: true,
      },
    ];

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
    });
  }
});

module.exports = router;




