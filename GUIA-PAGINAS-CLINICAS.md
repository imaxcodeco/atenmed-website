# 🚀 Guia Rápido - Sistema de Páginas por Clínica

## ⚡ Setup Rápido (5 minutos)

### 1️⃣ Popular Clínicas de Exemplo

```bash
# Criar 3 clínicas de exemplo
node scripts/seed-clinics.js
```

**Resultado:**
```
✅ Clínica criada: Clínica São Paulo (clinica-sao-paulo)
✅ Clínica criada: Clínica Rio de Janeiro (clinica-rio-de-janeiro)
✅ Clínica criada: Clínica Belo Horizonte (clinica-belo-horizonte)
```

### 2️⃣ Acessar as Páginas

Abra no navegador:

```
http://localhost:3000/clinica/clinica-sao-paulo
http://localhost:3000/clinica/clinica-rio-de-janeiro
http://localhost:3000/clinica/clinica-belo-horizonte
```

### 3️⃣ Testar Agendamento

1. Escolha uma especialidade
2. Escolha um médico
3. Selecione uma data
4. Escolha um horário
5. Preencha seus dados
6. Confirme! ✅

---

## 📝 Criar Sua Própria Clínica

### Opção 1: Via Script Node.js

```javascript
// test-clinic.js
const axios = require('axios');

const clinicData = {
    name: 'Minha Clínica',
    description: 'Descrição da minha clínica',
    slogan: 'Seu slogan aqui',
    address: {
        street: 'Rua Exemplo',
        number: '123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
    },
    contact: {
        phone: '(11) 91234-5678',
        email: 'contato@minhaclinica.com.br',
        whatsapp: '5511912345678'
    },
    workingHours: {
        start: 8,
        end: 18,
        formatted: 'Seg-Sex: 8h às 18h'
    },
    branding: {
        primaryColor: '#45a7b1',
        secondaryColor: '#184354'
    }
};

axios.post('http://localhost:3000/api/clinics', clinicData, {
    headers: {
        'Authorization': 'Bearer SEU_TOKEN_ADMIN',
        'Content-Type': 'application/json'
    }
})
.then(res => {
    console.log('✅ Clínica criada!');
    console.log('URL:', res.data.data.publicUrl);
    console.log('Slug:', res.data.data.slug);
})
.catch(err => console.error('Erro:', err.response?.data));
```

### Opção 2: Via cURL

```bash
curl -X POST http://localhost:3000/api/clinics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "name": "Minha Clínica",
    "description": "Descrição da clínica",
    "address": {
      "street": "Rua Exemplo",
      "number": "123",
      "city": "São Paulo",
      "state": "SP"
    },
    "contact": {
      "phone": "(11) 91234-5678",
      "whatsapp": "5511912345678"
    }
  }'
```

### Opção 3: Via Postman/Insomnia

```
POST http://localhost:3000/api/clinics
Headers:
  Authorization: Bearer SEU_TOKEN_ADMIN
  Content-Type: application/json

Body (JSON):
{
  "name": "Minha Clínica",
  "description": "...",
  ...
}
```

---

## 🎨 Personalizar Cores da Clínica

```bash
# Atualizar branding
curl -X PUT http://localhost:3000/api/clinics/CLINIC_ID/branding \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "primaryColor": "#ff6b6b",
    "secondaryColor": "#c92a2a",
    "accentColor": "#ff8787",
    "logo": "https://exemplo.com/logo.png"
  }'
```

---

## 🔗 Estrutura de URLs

```
Padrão:
https://atenmed.com.br/clinica/[slug-da-clinica]

Exemplos:
https://atenmed.com.br/clinica/clinica-sao-paulo
https://atenmed.com.br/clinica/dr-joao-cardiologia
https://atenmed.com.br/clinica/centro-medico-abc
```

### Como é gerado o slug?

```javascript
"Clínica São Paulo" → "clinica-sao-paulo"
"Dr. João Cardio" → "dr-joao-cardio"
"Centro Médico ABC" → "centro-medico-abc"

// Remove acentos, converte para minúsculas, 
// substitui espaços por hífen
```

---

## 📊 Dados Mínimos Necessários

```javascript
{
  "name": "Nome da Clínica",          // ✅ OBRIGATÓRIO
  "address": {                        // ✅ OBRIGATÓRIO
    "street": "Rua/Av",
    "number": "123",
    "city": "Cidade"
  },
  "contact": {                        // ✅ OBRIGATÓRIO
    "phone": "(11) 1234-5678"
  }
}
```

### Dados Opcionais (Recomendados)

```javascript
{
  "slug": "meu-slug-personalizado",  // Gerado automaticamente
  "description": "Descrição completa",
  "slogan": "Seu slogan",
  "logo": "URL da logo",
  "workingHours": {...},
  "branding": {...},
  "social": {...},
  "insurance": [...]
}
```

---

## 🧪 Testar a Página

### Checklist de Teste:

- [ ] Página carrega sem erros
- [ ] Logo aparece corretamente
- [ ] Informações de contato estão corretas
- [ ] Mapa do Google aparece
- [ ] Especialidades listadas
- [ ] Médicos aparecem
- [ ] Calendário funciona
- [ ] Horários carregam do Google Calendar
- [ ] Formulário envia corretamente
- [ ] Confirmação aparece
- [ ] Compartilhamento WhatsApp funciona

### Debug comum:

```javascript
// Abrir console do navegador (F12)
console.log(bookingApp.clinic);        // Ver dados da clínica
console.log(bookingApp.specialties);   // Ver especialidades
console.log(bookingApp.doctors);       // Ver médicos
console.log(bookingApp.availableSlots); // Ver horários
```

---

## 🎯 Próximos Passos

### Para uma clínica real:

1. ✅ Criar clínica via API
2. ✅ Adicionar médicos e especialidades
3. ✅ Configurar Google Calendar dos médicos
4. ✅ Personalizar cores (branding)
5. ✅ Upload de logo
6. ✅ Configurar redes sociais
7. ✅ Testar agendamento completo
8. ✅ Compartilhar URL com pacientes

### White Label (Premium):

```
Domínio próprio:
https://agendamento.clinicaxyz.com.br

Configurar:
1. DNS CNAME para atenmed.com.br
2. Certificado SSL
3. Configuração no painel admin
```

---

## 💡 Dicas e Truques

### 1. Slug Personalizado

```javascript
// Ao criar a clínica, defina o slug manualmente
{
  "name": "Centro Médico São Paulo",
  "slug": "centromedico-sp"  // ← Slug personalizado
}
```

### 2. Múltiplas Clínicas Mesmo Proprietário

```javascript
// Associar várias clínicas a um mesmo usuário
{
  "owner": "user_id_aqui",
  "clinics": ["clinic1_id", "clinic2_id", "clinic3_id"]
}
```

### 3. Desativar Clínica (Soft Delete)

```bash
# Não aparecer mais publicamente
curl -X PUT http://localhost:3000/api/clinics/CLINIC_ID \
  -d '{"isActive": false}'
```

### 4. Estatísticas em Tempo Real

```javascript
// API retorna stats automaticamente
GET /api/clinics/CLINIC_ID/stats

Response:
{
  "totalAppointments": 150,
  "activePatients": 80,
  "pageViews": 1200,
  "rating": { "average": 4.5, "count": 30 }
}
```

---

## 🐛 Troubleshooting

### Problema: "Clínica não encontrada"

**Solução:**
```bash
# Verificar se clínica existe
GET /api/clinics/slug/seu-slug

# Verificar se está ativa
{
  "isActive": true  # ← Deve ser true
}
```

### Problema: "Horários não aparecem"

**Solução:**
1. Verificar se médico tem `googleCalendarId`
2. Verificar se Google Calendar está autenticado
3. Verificar se médico está ativo

```bash
GET /api/auth/google/status
# Deve retornar: authenticated: true
```

### Problema: "Cores não aplicam"

**Solução:**
```javascript
// Verificar no console
console.log(bookingApp.clinic.branding);

// Deve ter:
{
  primaryColor: "#ff6b6b",
  secondaryColor: "#c92a2a"
}
```

---

## 📞 Suporte

Precisa de ajuda?

- 📧 Email: suporte@atenmed.com.br
- 💬 WhatsApp: (11) 99999-9999
- 📚 Documentação completa: `applications/clinic-page/README.md`

---

## ✅ Checklist de Produção

Antes de colocar no ar:

- [ ] Clínica criada e testada
- [ ] Google Calendar configurado
- [ ] Médicos e especialidades cadastrados
- [ ] Logo e cores personalizadas
- [ ] Informações de contato corretas
- [ ] Endereço e mapa funcionando
- [ ] Teste de agendamento completo
- [ ] HTTPS configurado
- [ ] DNS apontando corretamente
- [ ] Analytics configurado
- [ ] Backup automático ativo

---

**🎉 Pronto! Sua clínica já tem uma página profissional de agendamentos!**

**Custo total: R$ 0** (tudo incluído no sistema existente)
**Tempo de implementação: 5 minutos** ⚡

