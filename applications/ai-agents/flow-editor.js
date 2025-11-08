/**
 * AtenMed - Flow Editor
 * Editor visual de fluxos conversacionais (versão básica)
 */

// Versão básica do editor de fluxos
// Em produção, usar biblioteca como React Flow ou similar

/* global authToken */

function initFlowEditor(agentId) {
    const container = document.getElementById('flow-editor-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="flow-editor-toolbar">
            <button class="btn-secondary" onclick="addFlowNode('message')">
                <i class="fas fa-comment"></i> Mensagem
            </button>
            <button class="btn-secondary" onclick="addFlowNode('question')">
                <i class="fas fa-question"></i> Pergunta
            </button>
            <button class="btn-secondary" onclick="addFlowNode('action')">
                <i class="fas fa-bolt"></i> Ação
            </button>
            <button class="btn-secondary" onclick="addFlowNode('condition')">
                <i class="fas fa-code-branch"></i> Condição
            </button>
            <button class="btn-primary" onclick="saveFlow()" style="margin-left: auto;">
                <i class="fas fa-save"></i> Salvar Fluxo
            </button>
        </div>
        <div class="flow-editor-canvas" id="flow-canvas">
            <div class="flow-empty-state">
                <i class="fas fa-project-diagram" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <p>Arraste elementos da barra de ferramentas para criar seu fluxo</p>
            </div>
        </div>
    `;
    
    // Inicializar canvas básico
    window.currentFlow = {
        agentId,
        nodes: [],
        connections: []
    };
}

function addFlowNode(type) {
    const canvas = document.getElementById('flow-canvas');
    if (!canvas) return;
    
    const nodeId = 'node_' + Date.now();
    const nodeTypes = {
        message: { icon: 'comment', label: 'Mensagem', color: '#45a7b1' },
        question: { icon: 'question', label: 'Pergunta', color: '#10b981' },
        action: { icon: 'bolt', label: 'Ação', color: '#f59e0b' },
        condition: { icon: 'code-branch', label: 'Condição', color: '#ef4444' }
    };
    
    const nodeType = nodeTypes[type] || nodeTypes.message;
    
    const node = document.createElement('div');
    node.className = 'flow-node';
    node.id = nodeId;
    node.style.left = Math.random() * 300 + 'px';
    node.style.top = Math.random() * 200 + 'px';
    node.innerHTML = `
        <div class="flow-node-header" style="background: ${nodeType.color};">
            <i class="fas fa-${nodeType.icon}"></i>
            <span>${nodeType.label}</span>
            <button class="flow-node-delete" onclick="deleteFlowNode('${nodeId}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="flow-node-content">
            <input type="text" class="form-input" placeholder="Conteúdo..." style="width: 100%; margin-bottom: 0.5rem;">
            <small style="color: var(--gray-600);">Clique para editar</small>
        </div>
    `;
    
    canvas.appendChild(node);
    
    // Tornar arrastável (básico)
    makeNodeDraggable(node);
    
    // Adicionar ao fluxo
    if (!window.currentFlow) window.currentFlow = { nodes: [], connections: [] };
    window.currentFlow.nodes.push({
        id: nodeId,
        type: type,
        x: parseInt(node.style.left),
        y: parseInt(node.style.top)
    });
}

function makeNodeDraggable(node) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    node.querySelector('.flow-node-header').addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = parseInt(node.style.left) || 0;
        initialY = parseInt(node.style.top) || 0;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        node.style.left = (initialX + dx) + 'px';
        node.style.top = (initialY + dy) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

function deleteFlowNode(nodeId) {
    const node = document.getElementById(nodeId);
    if (node) node.remove();
    
    if (window.currentFlow) {
        window.currentFlow.nodes = window.currentFlow.nodes.filter(n => n.id !== nodeId);
    }
}

function saveFlow() {
    // Converter nodes para formato de fluxo
    const flow = {
        name: 'Fluxo Personalizado',
        trigger: 'always',
        triggerValue: '',
        steps: window.currentFlow.nodes.map((node, index) => {
            const nodeElement = document.getElementById(node.id);
            const content = nodeElement?.querySelector('input')?.value || '';
            
            return {
                type: node.type,
                content: content,
                nextStep: index < window.currentFlow.nodes.length - 1 ? index + 1 : null
            };
        }),
        isDefault: false
    };
    
    // Salvar via API
    fetch(`/api/agents/${window.currentFlow.agentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            flows: [flow]
        })
    }).then(res => res.json())
      .then(data => {
          if (data.success) {
              alert('Fluxo salvo com sucesso!');
          }
      });
}

window.initFlowEditor = initFlowEditor;
window.addFlowNode = addFlowNode;
window.deleteFlowNode = deleteFlowNode;
window.saveFlow = saveFlow;

