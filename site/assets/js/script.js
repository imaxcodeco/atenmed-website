/**
 * AtenMed Landing Page - JavaScript
 * Funcionalidades: Smooth scrolling, header dinâmico, menu mobile e interações
 */

// ===== VARIÁVEIS GLOBAIS =====
const header = document.querySelector('.header');
const menuToggle = document.querySelector('.menu-toggle');
const navList = document.querySelector('.nav-list');
const navLinks = document.querySelectorAll('.nav-link');
const contactForm = document.getElementById('contactForm');

// ===== FUNCIONALIDADE DE SMOOTH SCROLLING =====
function initSmoothScrolling() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // Só aplicar smooth scrolling para links âncora (#)
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const headerHeight = header.offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Fechar menu mobile após clique
                    closeMobileMenu();
                }
            } else {
                // Deixar links normais (.html) funcionarem
                closeMobileMenu();
            }
        });
    });
}

// ===== HEADER COM SOMBRA AO ROLAR =====
let lastScrollY = window.scrollY;

function initHeaderScrollEffect() {
    // Esta função agora é chamada dentro de initPerformanceOptimizations
    // para evitar duplicação de event listeners
}

// ===== MENU MOBILE =====
function initMobileMenu() {
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', function() {
            toggleMobileMenu();
        });
        
        // Fechar menu ao clicar fora dele
        document.addEventListener('click', function(e) {
            if (!menuToggle.contains(e.target) && !navList.contains(e.target)) {
                closeMobileMenu();
            }
        });
        
        // Fechar menu ao redimensionar a janela
        window.addEventListener('resize', function() {
            if (window.innerWidth > 767) {
                closeMobileMenu();
            }
        });
    }
}

function toggleMobileMenu() {
    menuToggle.classList.toggle('active');
    navList.classList.toggle('active');
    
    // Prevenir scroll do body quando menu está aberto
    if (navList.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeMobileMenu() {
    menuToggle.classList.remove('active');
    navList.classList.remove('active');
    document.body.style.overflow = '';
}

// ===== FORMULÁRIO DE CONTATO =====
function initContactForm() {
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Coletar dados do formulário
            const formData = new FormData(contactForm);
            const data = {
                nome: formData.get('nome'),
                email: formData.get('email'),
                telefone: formData.get('telefone'),
                especialidade: formData.get('especialidade')
            };
            
            // Validar dados
            if (validateFormData(data)) {
                submitForm(data);
            }
        });
        
        // Adicionar máscara ao campo de telefone
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', function(e) {
                applyPhoneMask(e.target);
                validateField(e.target);
            });
        }
        
        // Validação em tempo real para todos os campos
        const formInputs = contactForm.querySelectorAll('.form-input');
        formInputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });
    }
}

function validateFormData(data) {
    const errors = [];
    
    if (!data.nome || data.nome.trim().length < 2) {
        errors.push('Nome deve ter pelo menos 2 caracteres');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('E-mail inválido');
    }
    
    if (!data.telefone || data.telefone.replace(/\D/g, '').length < 10) {
        errors.push('Telefone inválido');
    }
    
    if (!data.especialidade) {
        errors.push('Selecione uma especialidade');
    }
    
    if (errors.length > 0) {
        showNotification('Por favor, corrija os seguintes erros:\n' + errors.join('\n'), 'error');
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function applyPhoneMask(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        if (value.length <= 2) {
            value = value;
        } else if (value.length <= 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (value.length <= 10) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
        } else {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        }
    }
    
    input.value = value;
}

async function submitForm(data) {
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Mostrar estado de carregamento
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    
    try {
        // Enviar dados para a API
        const response = await fetch('/api/leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nome: data.nome,
                email: data.email,
                telefone: data.telefone,
                especialidade: data.especialidade,
                origem: 'site',
                interesse: 'alto', // String ao invés de array
                observacoes: 'Lead gerado pela página inicial - Interesse em demonstração'
            })
        });
        
        const result = await response.json();

        if (response.ok && result.success) {
            // Salvar dados no localStorage para demonstração
            saveLeadData(data);
            
            // Enviar para analytics (simulado)
            trackFormSubmission(data);
            
            showNotification('🎉 Demonstração agendada com sucesso! Nossa equipe entrará em contato em até 2 horas úteis.', 'success');
            contactForm.reset();
            
            // Scroll para o topo
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            // Tratamento de erros amigável
            if (response.status === 409 || result?.code === 'LEAD_EXISTS') {
                // Já existe lead com este e-mail – tratar como sucesso para o usuário
                showNotification('✅ Já recebemos sua solicitação anteriormente. Nossa equipe entrará em contato em breve.', 'success');
                contactForm.reset();
                return;
            }

            if (response.status === 400 && Array.isArray(result?.errors)) {
                const messages = result.errors.map(e => `• ${e.path}: ${e.msg}`).join('\n');
                showNotification(`Por favor, corrija os seguintes erros:\n${messages}`, 'error');
                return;
            }

            showNotification(result?.error || 'Erro ao processar solicitação', 'error');
            return;
        }
    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        showNotification(error?.message || 'Ops! Ocorreu um erro. Tente novamente ou entre em contato pelo WhatsApp.', 'error');
    } finally {
        // Restaurar botão
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Salvar dados do lead
function saveLeadData(data) {
    const leads = JSON.parse(localStorage.getItem('atenmed_leads') || '[]');
    const lead = {
        ...data,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
    };
    leads.push(lead);
    localStorage.setItem('atenmed_leads', JSON.stringify(leads));
    
    console.log('Lead salvo:', lead);
}

// Rastrear submissão do formulário
function trackFormSubmission(data) {
    // Google Analytics 4 (se disponível)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submit', {
            'event_category': 'engagement',
            'event_label': 'contact_form',
            'value': 1,
            'custom_parameters': {
                'specialty': data.especialidade,
                'has_phone': data.telefone ? 'yes' : 'no'
            }
        });
    }
    
    // Facebook Pixel (se disponível)
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            content_name: 'Contact Form',
            content_category: 'Medical Services'
        });
    }
    
    console.log('Formulário rastreado:', data);
}

// Validação em tempo real de campos
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';
    
    // Remover erros anteriores
    clearFieldError(field);
    
    switch (fieldName) {
        case 'nome':
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'Nome deve ter pelo menos 2 caracteres';
            }
            break;
            
        case 'email':
            if (!isValidEmail(value)) {
                isValid = false;
                errorMessage = 'E-mail inválido';
            }
            break;
            
        case 'telefone':
            const phoneDigits = value.replace(/\D/g, '');
            if (phoneDigits.length < 10) {
                isValid = false;
                errorMessage = 'Telefone deve ter pelo menos 10 dígitos';
            }
            break;
            
        case 'especialidade':
            if (!value) {
                isValid = false;
                errorMessage = 'Selecione uma especialidade';
            }
            break;
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

// Mostrar erro no campo
function showFieldError(field, message) {
    field.classList.add('error');
    
    // Criar elemento de erro
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: var(--error-color);
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: block;
    `;
    
    // Inserir após o campo
    field.parentNode.insertBefore(errorElement, field.nextSibling);
}

// Limpar erro do campo
function clearFieldError(field) {
    field.classList.remove('error');
    
    // Remover mensagem de erro existente
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// ===== SISTEMA DE NOTIFICAÇÕES =====
function showNotification(message, type = 'info') {
    // Remover notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Adicionar estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        ${type === 'success' ? 'background-color: #10b981; color: white;' : 
          type === 'error' ? 'background-color: #ef4444; color: white;' : 
          'background-color: #3b82f6; color: white;'}
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// ===== ANIMAÇÕES AO SCROLL =====
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observar elementos para animação
    const elementsToAnimate = document.querySelectorAll('.solution-card, .testimonial-card, .contact-form');
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });
}

// ===== OTIMIZAÇÃO DE PERFORMANCE =====
function initPerformanceOptimizations() {
    // Lazy loading para imagens
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window && images.length > 0) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Preload de imagens críticas
    preloadCriticalImages();
    
    // Debounce para eventos de scroll
    const debouncedScrollHandler = debounce(handleScroll, 16);
    window.addEventListener('scroll', debouncedScrollHandler, { passive: true });
    
    // Preload de recursos críticos
    preloadCriticalResources();
}

// Preload de imagens críticas
function preloadCriticalImages() {
    const criticalImages = [
        'assets/images/logo-transp.png'
    ];
    
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

// Preload de recursos críticos
function preloadCriticalResources() {
    // Preload do CSS crítico
    const criticalCSS = document.createElement('link');
    criticalCSS.rel = 'preload';
    criticalCSS.as = 'style';
    criticalCSS.href = 'assets/css/style.css';
    criticalCSS.onload = function() {
        this.rel = 'stylesheet';
    };
    document.head.appendChild(criticalCSS);
    
    // Preload de fontes críticas
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.crossOrigin = 'anonymous';
    fontLink.href = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2';
    document.head.appendChild(fontLink);
}

// Handler otimizado para scroll
function handleScroll() {
    const currentScrollY = window.scrollY;
    
    // Header scroll effect
    if (currentScrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    // Hide/show header based on scroll direction
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
    }
    
    lastScrollY = currentScrollY;
}

// ===== BOTÕES DE CALL-TO-ACTION =====
function initCTATracking() {
    const ctaButtons = document.querySelectorAll('.btn-primary');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Rastreamento de cliques em CTA (substituir por analytics real)
            console.log('CTA clicked:', this.textContent.trim());
            
            // Exemplo de integração com Google Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'cta_click', {
                    'event_category': 'engagement',
                    'event_label': this.textContent.trim(),
                    'value': 1
                });
            }
        });
    });
}

// ===== CARREGAR SERVIÇOS DA API =====
async function loadServices() {
    try {
        const response = await fetch('/api/services');
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('Serviços carregados:', result.data);
            // Aqui você pode atualizar a interface com os dados reais
            // Por enquanto, apenas logamos os dados
        }
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todas as funcionalidades
    initSmoothScrolling();
    initHeaderScrollEffect();
    initMobileMenu();
    initContactForm();
    initScrollAnimations();
    initPerformanceOptimizations();
    initCTATracking();
    
    // Carregar dados da API
    loadServices();
    
    // Log de inicialização
    console.log('AtenMed Landing Page inicializada com sucesso!');
});

// ===== UTILITÁRIOS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== TRATAMENTO DE ERROS =====
window.addEventListener('error', function(e) {
    console.error('Erro na página:', e.error);
    // Aqui você pode integrar com um serviço de monitoramento de erros
});

// ===== EXPORTAR FUNÇÕES PARA TESTES =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateFormData,
        isValidEmail,
        applyPhoneMask,
        debounce,
        throttle
    };
}
