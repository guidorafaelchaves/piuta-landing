// Integração Formspree v3 - Captura Completa com Seleções Visuais
// Sítio Piutá - Reservas

(function() {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzznrdn';
  
  // Objeto para armazenar dados de todas as etapas
  const reservationData = {
    etapa1_pessoas: null,
    etapa2_checkin: null,
    etapa3_checkout: null,
    etapa4_diarias: null,
    etapa5_acomodacoes: [],
    etapa6_alimentacao: {},
    etapa7_transporte: null,
    etapa8_atividades: [],
    etapa9_nome: null,
    etapa9_email: null,
    etapa9_telefone: null,
    etapa9_observacoes: null,
    etapa10_pagamento: null,
    etapa10_valor_total: null,
    
    // Histórico de telas para captura completa
    screenHistory: []
  };
  
  // Função para capturar snapshot da tela atual
  function captureScreenSnapshot() {
    const bodyText = document.body.innerText;
    const timestamp = new Date().toISOString();
    
    // Adiciona ao histórico
    reservationData.screenHistory.push({
      timestamp: timestamp,
      content: bodyText
    });
    
    // Mantém apenas os últimos 15 snapshots
    if (reservationData.screenHistory.length > 15) {
      reservationData.screenHistory.shift();
    }
  }
  
  // Função para extrair dados de todas as telas capturadas
  function extractFromHistory() {
    const allText = reservationData.screenHistory.map(s => s.content).join('\n');
    
    // Extrai acomodações (procura por padrões como "Chalé", "Quarto", etc. seguidos de preço)
    const acomodacoesPatterns = [
      /([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)*)\s*-\s*R\$\s*\d+\s*\/\s*diária/gi,
      /([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)*)\s*R\$\s*\d+/gi
    ];
    
    let acomodacoes = [];
    acomodacoesPatterns.forEach(pattern => {
      const matches = allText.match(pattern);
      if (matches) {
        acomodacoes = acomodacoes.concat(matches);
      }
    });
    
    // Remove duplicatas
    acomodacoes = [...new Set(acomodacoes)];
    
    // Filtra apenas itens que parecem ser acomodações
    acomodacoes = acomodacoes.filter(item => {
      const lower = item.toLowerCase();
      return (lower.includes('chalé') || 
              lower.includes('chale') || 
              lower.includes('quarto') || 
              lower.includes('suíte') ||
              lower.includes('suite') ||
              lower.includes('casa') ||
              lower.includes('dormitório') ||
              lower.includes('dormitorio')) &&
             !lower.includes('etapa') &&
             !lower.includes('continuar');
    });
    
    if (acomodacoes.length > 0) {
      reservationData.etapa5_acomodacoes = acomodacoes;
    }
    
    // Extrai transporte
    const transportePatterns = [
      /(?:Van|Carro|Ônibus|Onibus|Transporte)\s+[^R\n]*(?:R\$\s*\d+|Grátis|Gratuito)/gi,
      /(?:Próprio|Proprio)\s+transporte/gi
    ];
    
    transportePatterns.forEach(pattern => {
      const match = allText.match(pattern);
      if (match && match[0]) {
        reservationData.etapa7_transporte = match[0].trim();
      }
    });
    
    // Extrai atividades
    const atividadesPatterns = [
      /([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[a-zà-ÿ]+)*)\s*\(\d+h\)/gi,
      /(Trilha|Yoga|Meditação|Meditacao|Oficina|Workshop|Colheita|Plantio)[^R\n]*/gi
    ];
    
    let atividades = [];
    atividadesPatterns.forEach(pattern => {
      const matches = allText.match(pattern);
      if (matches) {
        atividades = atividades.concat(matches);
      }
    });
    
    // Remove duplicatas
    atividades = [...new Set(atividades)];
    
    // Filtra atividades válidas
    atividades = atividades.filter(item => {
      const lower = item.toLowerCase();
      return !lower.includes('etapa') &&
             !lower.includes('continuar') &&
             !lower.includes('voltar') &&
             item.length > 3;
    });
    
    if (atividades.length > 0) {
      reservationData.etapa8_atividades = atividades;
    }
  }
  
  // Função para capturar dados da tela atual
  function captureCurrentStepData() {
    const bodyText = document.body.innerText;
    
    // Etapa 1: Número de pessoas
    const pessoasMatch = bodyText.match(/(\d+)\s+pessoa/i);
    if (pessoasMatch && bodyText.includes('Quantas pessoas')) {
      reservationData.etapa1_pessoas = pessoasMatch[1];
    }
    
    // Etapa 2 e 3: Datas
    const dateMatches = bodyText.match(/(\d{2}\/\d{2}\/\d{4})/g);
    if (dateMatches) {
      if (bodyText.includes('Check-in') && dateMatches[0]) {
        reservationData.etapa2_checkin = dateMatches[0];
      }
      if (bodyText.includes('Check-out') && dateMatches[1]) {
        reservationData.etapa3_checkout = dateMatches[1];
      }
    }
    
    // Etapa 4: Diárias
    const diariasMatch = bodyText.match(/(\d+)\s+diária/i);
    if (diariasMatch) {
      reservationData.etapa4_diarias = diariasMatch[1];
    }
    
    // Etapa 9: Dados pessoais
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
    inputs.forEach(input => {
      const placeholder = input.placeholder || '';
      const value = input.value;
      
      if (value) {
        if (placeholder.includes('Nome')) {
          reservationData.etapa9_nome = value;
        } else if (placeholder.includes('Email') || placeholder.includes('E-mail')) {
          reservationData.etapa9_email = value;
        } else if (placeholder.includes('Telefone') || placeholder.includes('WhatsApp')) {
          reservationData.etapa9_telefone = value;
        }
      }
    });
    
    // Captura textarea
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      if (textarea.value) {
        reservationData.etapa9_observacoes = textarea.value;
      }
    });
    
    // Etapa 10: Valor total
    const valorMatch = bodyText.match(/R\$\s*(\d+)/);
    if (valorMatch && bodyText.includes('Total a Pagar')) {
      reservationData.etapa10_valor_total = valorMatch[1];
    }
    
    // Captura snapshot para análise posterior
    captureScreenSnapshot();
  }
  
  // Monitora mudanças na página
  function startMonitoring() {
    const observer = new MutationObserver(() => {
      captureCurrentStepData();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Captura inicial
    captureCurrentStepData();
  }
  
  // Função para enviar dados ao Formspree
  async function sendToFormspree() {
    try {
      // Captura final
      captureCurrentStepData();
      
      // Extrai dados do histórico
      extractFromHistory();
      
      // Formata o e-mail
      const emailData = {
        _subject: '🌱 Nova Reserva - Sítio Piutá',
        
        // Dados do cliente
        'Nome Completo': reservationData.etapa9_nome || 'Não informado',
        'E-mail': reservationData.etapa9_email || 'Não informado',
        'Telefone/WhatsApp': reservationData.etapa9_telefone || 'Não informado',
        
        // Dados da reserva
        'Número de Pessoas': reservationData.etapa1_pessoas || 'Não informado',
        'Check-in': reservationData.etapa2_checkin || 'Não informado',
        'Check-out': reservationData.etapa3_checkout || 'Não informado',
        'Número de Diárias': reservationData.etapa4_diarias || 'Não informado',
        
        // Acomodações e serviços
        'Acomodações Escolhidas': reservationData.etapa5_acomodacoes.length > 0 
          ? reservationData.etapa5_acomodacoes.join(' | ') 
          : 'Não informado',
        'Transporte': reservationData.etapa7_transporte || 'Não informado',
        'Atividades': reservationData.etapa8_atividades.length > 0 
          ? reservationData.etapa8_atividades.join(' | ') 
          : 'Não informado',
        
        // Pagamento
        'Forma de Pagamento': reservationData.etapa10_pagamento || 'Não informado',
        'Valor Total': `R$ ${reservationData.etapa10_valor_total || '0'}`,
        
        // Observações
        'Observações': reservationData.etapa9_observacoes || 'Nenhuma',
        
        // Metadados
        'Data e Hora do Envio': new Date().toLocaleString('pt-BR'),
        'URL': window.location.href
      };
      
      console.log('📤 Enviando dados completos para Formspree:', emailData);
      
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        console.log('✅ E-mail enviado com sucesso!');
        return true;
      } else {
        console.error('❌ Erro ao enviar:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      return false;
    }
  }
  
  // Aguarda carregamento
  window.addEventListener('load', function() {
    console.log('✅ Integração Formspree v3 carregada - Captura avançada ativada');
    startMonitoring();
    
    // Monitora cliques no botão de pagamento
    document.addEventListener('click', async function(event) {
      const target = event.target;
      const buttonText = target.textContent || '';
      
      if (buttonText.includes('Pagar R$')) {
        console.log('🔔 Botão de pagamento clicado!');
        
        // Identifica método de pagamento
        if (buttonText.includes('PIX')) {
          reservationData.etapa10_pagamento = 'PIX (com desconto de 5%)';
        } else if (buttonText.includes('Cartão')) {
          reservationData.etapa10_pagamento = 'Cartão de Crédito';
        }
        
        // Aguarda e envia
        setTimeout(async () => {
          await sendToFormspree();
        }, 300);
      }
    }, true);
  });
})();
