// Integração Formspree v4 - Interceptação Total de Cliques
// Sítio Piutá - Reservas

(function() {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzznrdn';
  
  // Objeto para armazenar dados
  const reservationData = {
    pessoas: null,
    checkin: null,
    checkout: null,
    diarias: null,
    acomodacoes: [],
    transporte: null,
    atividades: [],
    nome: null,
    email: null,
    telefone: null,
    observacoes: null,
    pagamento: null,
    valor_total: null
  };
  
  // Função para salvar dados capturados
  function saveData(key, value) {
    console.log(`💾 Salvando: ${key} = ${value}`);
    reservationData[key] = value;
  }
  
  // Função para capturar dados da tela atual
  function captureCurrentScreen() {
    const bodyText = document.body.innerText;
    
    // Captura número de pessoas
    const pessoasMatch = bodyText.match(/(\d+)\s+pessoa/i);
    if (pessoasMatch) {
      saveData('pessoas', pessoasMatch[1]);
    }
    
    // Captura datas
    const dateMatches = bodyText.match(/(\d{2}\/\d{2}\/\d{4})/g);
    if (dateMatches && dateMatches.length >= 2) {
      saveData('checkin', dateMatches[0]);
      saveData('checkout', dateMatches[1]);
    }
    
    // Captura diárias
    const diariasMatch = bodyText.match(/(\d+)\s+diária/i);
    if (diariasMatch) {
      saveData('diarias', diariasMatch[1]);
    }
    
    // Captura valor total
    const valorMatch = bodyText.match(/R\$\s*(\d+)/);
    if (valorMatch && bodyText.includes('Total')) {
      saveData('valor_total', valorMatch[1]);
    }
    
    // Captura inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
    inputs.forEach(input => {
      const placeholder = (input.placeholder || '').toLowerCase();
      const value = input.value;
      
      if (value) {
        if (placeholder.includes('nome')) {
          saveData('nome', value);
        } else if (placeholder.includes('email') || placeholder.includes('e-mail')) {
          saveData('email', value);
        } else if (placeholder.includes('telefone') || placeholder.includes('whatsapp')) {
          saveData('telefone', value);
        }
      }
    });
    
    // Captura textarea
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      if (textarea.value) {
        saveData('observacoes', textarea.value);
      }
    });
  }
  
  // Intercepta TODOS os cliques na página
  document.addEventListener('click', function(event) {
    const target = event.target;
    const targetText = target.textContent || '';
    const parentText = target.parentElement ? target.parentElement.textContent || '' : '';
    const fullText = targetText + ' ' + parentText;
    
    console.log('🖱️ Clique detectado:', fullText.substring(0, 100));
    
    // Detecta cliques em acomodações
    if (fullText.match(/Chalé|Chale|Quarto|Suíte|Suite|Casa|Dormitório/i) && 
        fullText.match(/R\$\s*\d+/)) {
      const acomodacao = fullText.trim().substring(0, 100);
      if (!reservationData.acomodacoes.includes(acomodacao)) {
        reservationData.acomodacoes.push(acomodacao);
        console.log('🏠 Acomodação capturada:', acomodacao);
      }
    }
    
    // Detecta cliques em transporte
    if (fullText.match(/Van|Carro|Ônibus|Onibus|Transporte|Próprio/i)) {
      const transporte = fullText.trim().substring(0, 100);
      saveData('transporte', transporte);
      console.log('🚗 Transporte capturado:', transporte);
    }
    
    // Detecta cliques em atividades
    if (fullText.match(/Trilha|Yoga|Meditação|Meditacao|Oficina|Workshop|Colheita|Plantio/i)) {
      const atividade = fullText.trim().substring(0, 100);
      if (!reservationData.atividades.includes(atividade)) {
        reservationData.atividades.push(atividade);
        console.log('🌿 Atividade capturada:', atividade);
      }
    }
    
    // Detecta clique no botão de pagamento
    if (targetText.includes('Pagar R$')) {
      console.log('💳 Botão de pagamento clicado!');
      
      // Identifica método de pagamento
      if (targetText.includes('PIX')) {
        saveData('pagamento', 'PIX (com desconto de 5%)');
      } else if (targetText.includes('Cartão')) {
        saveData('pagamento', 'Cartão de Crédito');
      }
      
      // Captura final e envia
      setTimeout(() => {
        captureCurrentScreen();
        sendToFormspree();
      }, 500);
    }
    
    // Captura dados a cada clique
    setTimeout(captureCurrentScreen, 200);
  }, true);
  
  // Monitora mudanças na página
  const observer = new MutationObserver(() => {
    captureCurrentScreen();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Função para enviar dados
  async function sendToFormspree() {
    try {
      const emailData = {
        _subject: '🌱 Nova Reserva - Sítio Piutá',
        'Nome Completo': reservationData.nome || 'Não informado',
        'E-mail': reservationData.email || 'Não informado',
        'Telefone/WhatsApp': reservationData.telefone || 'Não informado',
        'Número de Pessoas': reservationData.pessoas || 'Não informado',
        'Check-in': reservationData.checkin || 'Não informado',
        'Check-out': reservationData.checkout || 'Não informado',
        'Número de Diárias': reservationData.diarias || 'Não informado',
        'Acomodações Escolhidas': reservationData.acomodacoes.length > 0 
          ? reservationData.acomodacoes.join(' | ') 
          : 'Não informado',
        'Transporte': reservationData.transporte || 'Não informado',
        'Atividades': reservationData.atividades.length > 0 
          ? reservationData.atividades.join(' | ') 
          : 'Não informado',
        'Forma de Pagamento': reservationData.pagamento || 'Não informado',
        'Valor Total': `R$ ${reservationData.valor_total || '0'}`,
        'Observações': reservationData.observacoes || 'Nenhuma',
        'Data e Hora do Envio': new Date().toLocaleString('pt-BR'),
        'URL': window.location.href
      };
      
      console.log('📤 Enviando dados:', emailData);
      
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
  
  // Inicialização
  window.addEventListener('load', function() {
    console.log('✅ Integração Formspree v4 carregada - Interceptação total ativada');
    captureCurrentScreen();
  });
})();
