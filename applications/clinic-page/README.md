# 🏥 Sistema de Páginas Públicas por Clínica

Sistema completo de páginas personalizadas para cada clínica com agendamento online integrado ao Google Calendar.

## 🎯 Funcionalidades

### ✅ O que está implementado:

- ✅ **Página pública personalizada** para cada clínica
- ✅ **URL amigável**: `/clinica/nome-da-clinica`
- ✅ **Agendamento online** em 5 passos simples
- ✅ **Integração Google Calendar** em tempo real
- ✅ **Design responsivo** (mobile, tablet, desktop)
- ✅ **Personalização de cores** por clínica (branding)
- ✅ **Informações completas**: horários, endereço, contato
- ✅ **Mapa integrado** do Google Maps
- ✅ **Sistema de avaliações** (rating)
- ✅ **Redes sociais** da clínica
- ✅ **SEO otimizado** (meta tags, Open Graph)
- ✅ **Compartilhamento WhatsApp** do agendamento
- ✅ **Adicionar à agenda** (Google Calendar)

## 📋 Fluxo de Agendamento

```
1. Escolher Especialidade
   ↓
2. Escolher Médico
   ↓
3. Escolher Data (calendário visual)
   ↓
4. Escolher Horário (horários disponíveis via Google Calendar)
   ↓
5. Preencher Dados Pessoais
   ↓
6. Confirmação com QR Code e compartilhamento
```

## 🚀 Como Usar

### 1. Criar uma Clínica

```bash
# Via API
POST /api/clinics
Content-Type: application/json

{
  "name": "Clínica São Paulo",
  "description": "Clínica especializada em cardiologia e clínica geral",
  "slogan": "Cuidando do seu coração",
  "address": {
    "street": "Av. Paulista",
    "number": "1000",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100"
  },
  "contact": {
    "phone": "(11) 3000-0000",
    "email": "contato@clinicasp.com.br",
    "whatsapp": "11999999999"
  },
  "workingHours": {
    "start": 8,
    "end": 18,
    "formatted": "Seg-Sex: 8h às 18h"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "_id": "abc123",
    "slug": "clinica-sao-paulo",
    "publicUrl": "/clinica/clinica-sao-paulo"
  }
}
```

### 2. Acessar a Página

```
https://atenmed.com.br/clinica/clinica-sao-paulo
```

### 3. Personalizar Branding (Opcional)

```bash
PUT /api/clinics/abc123/branding
Content-Type: application/json

{
  "primaryColor": "#0066cc",
  "secondaryColor": "#003366",
  "accentColor": "#66ccff",
  "logo": "https://exemplo.com/logo.png"
}
```

## 📁 Estrutura de Arquivos

```
applications/clinic-page/
├── index.html              # Página principal
├── clinic-page.css         # Estilos (personalizáveis)
├── clinic-page.js          # Lógica do agendamento
└── README.md              # Este arquivo
```

## 🎨 Personalização de Cores

Cada clínica pode ter suas próprias cores. O sistema usa variáveis CSS:

```css
:root {
    --primary-color: #45a7b1;      /* Cor principal */
    --secondary-color: #184354;    /* Cor secundária */
    --accent-color: #6dd5ed;       /* Cor de destaque */
}
```

### Aplicar cores via API:

```javascript
// No JavaScript da página, as cores são aplicadas automaticamente
document.documentElement.style.setProperty('--primary-color', clinic.branding.primaryColor);
```

## 🔧 Configuração do Backend

### Modelo de Clínica (models/Clinic.js)

```javascript
{
  name: String,           // Nome da clínica
  slug: String,           // URL amigável (auto-gerado)
  description: String,    // Descrição
  slogan: String,         // Slogan
  logo: String,           // URL da logo
  address: Object,        // Endereço completo
  contact: Object,        // Telefones e emails
  workingHours: Object,   // Horários de funcionamento
  branding: Object,       // Cores personalizadas
  social: Object,         // Redes sociais
  rating: Object,         // Avaliações
  stats: Object          // Estatísticas
}
```

### Rotas da API

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/api/clinics/slug/:slug` | Buscar clínica por slug | Público |
| GET | `/api/clinics/:id/public` | Info públicas | Público |
| GET | `/api/clinics/:id/doctors` | Médicos da clínica | Público |
| GET | `/api/clinics/:id/stats` | Estatísticas | Público |
| POST | `/api/clinics` | Criar clínica | Admin |
| PUT | `/api/clinics/:id` | Atualizar clínica | Admin |
| PUT | `/api/clinics/:id/branding` | Atualizar branding | Admin |

## 📱 Recursos Mobile

- ✅ Design totalmente responsivo
- ✅ Touch-friendly (botões grandes)
- ✅ Calendário otimizado para mobile
- ✅ Compartilhamento nativo
- ✅ PWA ready (pode virar app)

## 🌐 SEO e Compartilhamento

### Meta Tags Geradas Automaticamente:

```html
<title>Clínica São Paulo - Agendar Consulta Online</title>
<meta name="description" content="...">
<meta property="og:title" content="...">
<meta property="og:image" content="...">
```

### Schema.org (Futuro):

```json
{
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  "name": "Clínica São Paulo",
  "address": {...},
  "telephone": "(11) 3000-0000"
}
```

## 📊 Analytics e Métricas

Cada clínica tem métricas automaticamente:

```javascript
// Incrementar visualização de página
await clinic.incrementStat('pageViews');

// Atualizar rating
await clinic.updateRating(5);

// Stats disponíveis
{
  totalAppointments: 150,
  activePatients: 80,
  pageViews: 1200,
  rating: {
    average: 4.5,
    count: 30
  }
}
```

## 🎁 Features Premium (Futuro)

### White Label (Domínio Próprio)
```
https://agendamento.clinicasp.com.br
```

### Personalização Avançada
- Fonte customizada
- Layout alternativo
- Seções personalizadas

### Múltiplas Línguas
- Português
- Inglês
- Espanhol

## 💰 Monetização

### Planos Sugeridos:

**FREE**
- Página básica
- Marca AtenMed
- 50 agendamentos/mês

**BASIC - R$ 99/mês**
- Branding personalizado
- 300 agendamentos/mês
- Sem marca AtenMed

**PRO - R$ 249/mês**
- White label (domínio próprio)
- Agendamentos ilimitados
- Analytics avançado
- Suporte prioritário

**ENTERPRISE - R$ 599/mês**
- Multi-clínicas
- API customizada
- Integrações
- Gerente de conta

## 🔒 Segurança

- ✅ Validação de dados no frontend e backend
- ✅ Rate limiting nas APIs
- ✅ HTTPS obrigatório
- ✅ Sanitização de inputs
- ✅ CORS configurado
- ✅ Headers de segurança (Helmet)

## 🐛 Troubleshooting

### Clínica não aparece

```bash
# Verificar se clínica está ativa
GET /api/clinics/slug/nome-da-clinica

# Resposta deve ter isActive: true
```

### Horários não aparecem

```bash
# Verificar integração Google Calendar
GET /api/auth/google/status

# Verificar disponibilidade
GET /api/appointments/availability?doctorId=xxx&date=2024-01-15
```

### Cores não aplicam

```javascript
// Verificar no console do navegador
console.log(bookingApp.clinic.branding);

// Deve ter primaryColor, secondaryColor, etc.
```

## 📞 Suporte

Para dúvidas ou problemas:
- 📧 Email: suporte@atenmed.com.br
- 💬 WhatsApp: (11) 99999-9999
- 📚 Docs: https://docs.atenmed.com.br

## 🚀 Próximos Passos

1. ✅ Testar criando uma clínica via API
2. ✅ Acessar `/clinica/sua-clinica`
3. ✅ Fazer um agendamento teste
4. ✅ Personalizar cores e logo
5. ✅ Compartilhar com clientes

---

**Desenvolvido por AtenMed** 🏥
Versão 1.0 - Janeiro 2025

