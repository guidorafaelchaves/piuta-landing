// Integração Formspree v8 - Captura Etapas 7 e 9 CORRIGIDA
// Sítio Piutá - Reservas
// CORREÇÃO: Captura o texto da tela ATUAL antes de avançar

(function() {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzznrdn';
  
  // Armazena os textos capturados
  let textoEtapa7 = null;
  let textoEtapa9 = null;
  
  console.log('✅ Integração Formspree v8 carregada - Captura CORRIGIDA etapas 7 e 9');
  
  // Função para extrair dados estruturados da etapa 9
  function extrairDadosEtapa9() {
    const texto = document.body.innerText;
    const dados = {
      textoCompleto: texto,
      nome: '',
      email: '',
      telefone: '',
      observacoes: ''
    };
    
    // Tenta extrair campos específicos dos inputs
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      const valor = input.value || '';
      const placeholder = (input.placeholder || '').toLowerCase();
      const label = input.previousElementSibling?.textContent || '';
      
      if (placeholder.includes('nome') || label.toLowerCase().includes('nome')) {
        dados.nome = valor;
      } else if (placeholder.includes('email') || placeholder.includes('e-mail') || label.toLowerCase().includes('email')) {
        dados.email = valor;
      } else if (placeholder.includes('telefone') || placeholder.includes('whatsapp') || label.toLowerCase().includes('telefone')) {
        dados.telefone = valor;
      } else if (placeholder.includes('observ') || label.toLowerCase().includes('observ')) {
        dados.observacoes = valor;
      }
    });
    
    return dados;
  }
  
  // Função para enviar e-mail
  async function enviarEmail() {
    try {
      // Extrai dados estruturados se disponíveis
      const dadosEtapa9 = textoEtapa9 || 'Não capturado';
      
      const emailData = {
        _subject: '🌱 Nova Reserva - Sítio Piutá',
        'Etapa_7_Resumo_da_Reserva': textoEtapa7 || 'Não capturado',
        'Etapa_9_Dados_do_Cliente': dadosEtapa9,
        'Data_e_Hora_do_Envio': new Date().toLocaleString('pt-BR'),
        'URL': window.location.href
      };
      
      console.log('📤 Enviando e-mail com dados das etapas 7 e 9...');
      console.log('Dados:', emailData);
      
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
  
  // Monitora cliques em todos os botões - FASE DE CAPTURA
  document.addEventListener('mousedown', function(event) {
    const target = event.target;
    
    // Verifica se é um botão
    if (target.tagName !== 'BUTTON' && !target.closest('button')) {
      return;
    }
    
    const button = target.tagName === 'BUTTON' ? target : target.closest('button');
    const buttonText = (button.textContent || '').toLowerCase();
    const bodyText = document.body.innerText;
    
    console.log('🖱️ MouseDown em botão:', buttonText);
    console.log('📍 Texto da página contém "Etapa 7":', bodyText.includes('Etapa 7'));
    console.log('📍 Texto da página contém "Etapa 9":', bodyText.includes('Etapa 9'));
    
    // ETAPA 7: Captura quando clica em "Confirmar Reserva"
    if (buttonText.includes('confirmar reserva') || 
        (bodyText.includes('Etapa 7') && buttonText.includes('confirmar'))) {
      console.log('🔔 Capturando dados da ETAPA 7 (Resumo da Reserva)');
      textoEtapa7 = document.body.innerText;
      console.log('📸 Etapa 7 capturada! Tamanho:', textoEtapa7.length, 'caracteres');
    }
    
    // ETAPA 9: Captura quando clica em "Continuar para Pagamento" ou similar
    // IMPORTANTE: Captura ANTES de mudar de tela (no mousedown)
    if (bodyText.includes('Etapa 9') || bodyText.includes('Seus Dados')) {
      if (buttonText.includes('continuar') || buttonText.includes('pagamento')) {
        console.log('🔔 Capturando dados da ETAPA 9 (Dados do Cliente) - ANTES de avançar');
        
        // Captura o texto completo da tela atual
        textoEtapa9 = document.body.innerText;
        console.log('📸 Etapa 9 capturada! Tamanho:', textoEtapa9.length, 'caracteres');
        
        // Também tenta extrair os valores dos inputs
        const inputs = document.querySelectorAll('input, textarea');
        let dadosInputs = '\n\n--- DADOS DOS CAMPOS ---\n';
        inputs.forEach((input, i) => {
          if (input.value) {
            const label = input.placeholder || input.name || `Campo ${i+1}`;
            dadosInputs += `${label}: ${input.value}\n`;
          }
        });
        
        if (dadosInputs.length > 30) {
          textoEtapa9 += dadosInputs;
        }
        
        console.log('📝 Dados capturados:', textoEtapa9.substring(0, 500) + '...');
        
        // Envia o e-mail imediatamente (antes de mudar de tela)
        enviarEmail();
      }
    }
    
  }, true); // capture: true para pegar o evento antes de qualquer outro handler
  
})();
