// Integração Formspree v2 - Captura completa de dados
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
    etapa10_valor_total: null
  };
  
  // Função para capturar dados da tela atual
  function captureCurrentStepData() {
    const bodyText = document.body.innerText;
    
    // Etapa 1: Número de pessoas
    const pessoasMatch = bodyText.match(/(\d+)\s+pessoa/i);
    if (pessoasMatch && bodyText.includes('Quantas pessoas')) {
      reservationData.etapa1_pessoas = pessoasMatch[1];
    }
    
    // Etapa 2 e 3: Datas
    const dateMatches = bodyText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/g);
    if (dateMatches && bodyText.includes('Check-in')) {
      reservationData.etapa2_checkin = dateMatches[0] || null;
      reservationData.etapa3_checkout = dateMatches[1] || null;
    }
    
    // Etapa 4: Diárias
    const diariasMatch = bodyText.match(/(\d+)\s+diária/i);
    if (diariasMatch) {
      reservationData.etapa4_diarias = diariasMatch[1];
    }
    
    // Etapa 5: Acomodações (captura nomes com "R$")
    if (bodyText.includes('Acomodação') || bodyText.includes('Escolha')) {
      const acomodacaoMatches = bodyText.match(/([A-Za-zÀ-ÿ\s]+)\s+-\s+R\$\s+\d+/g);
      if (acomodacaoMatches && acomodacaoMatches.length > 0) {
        reservationData.etapa5_acomodacoes = acomodacaoMatches;
      }
    }
    
    // Etapa 9: Dados pessoais (captura inputs)
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
    
    // Captura textarea (observações)
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      if (textarea.value) {
        reservationData.etapa9_observacoes = textarea.value;
      }
    });
    
    // Etapa 10: Valor total
    const valorMatch = bodyText.match(/R\$\s+(\d+)/);
    if (valorMatch && bodyText.includes('Total a Pagar')) {
      reservationData.etapa10_valor_total = valorMatch[1];
    }
  }
  
  // Monitora mudanças na página (MutationObserver)
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
      // Captura final antes de enviar
      captureCurrentStepData();
      
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
        'Acomodações Escolhidas': reservationData.etapa5_acomodacoes.join(', ') || 'Não informado',
        'Transporte': reservationData.etapa7_transporte || 'Não informado',
        'Atividades': reservationData.etapa8_atividades.join(', ') || 'Não informado',
        
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
  
  // Aguarda carregamento e inicia monitoramento
  window.addEventListener('load', function() {
    console.log('✅ Integração Formspree v2 carregada');
    startMonitoring();
    
    // Monitora cliques no botão de pagamento
    document.addEventListener('click', async function(event) {
      const target = event.target;
      const buttonText = target.textContent || '';
      
      // Detecta clique no botão de pagamento
      if (buttonText.includes('Pagar R$')) {
        console.log('🔔 Botão de pagamento clicado!');
        
        // Identifica método de pagamento
        if (buttonText.includes('PIX')) {
          reservationData.etapa10_pagamento = 'PIX (com desconto de 5%)';
        } else if (buttonText.includes('Cartão')) {
          reservationData.etapa10_pagamento = 'Cartão de Crédito';
        }
        
        // Aguarda um pouco e envia
        setTimeout(async () => {
          await sendToFormspree();
        }, 200);
      }
    }, true);
  });
})();
