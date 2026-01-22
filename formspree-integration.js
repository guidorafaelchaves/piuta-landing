// Integração Formspree v10 - Baseado nas telas REAIS
// Sítio Piutá - Reservas
// 
// ETAPA 7: Título "Resumo" + "Etapa 7 de 10" + botão "Confirmar Reserva"
// ETAPA 9: Título "Seus Dados" + "Etapa 9 de 10" + botão "Continuar para Pagamento"

(function() {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzznrdn';
  
  // Armazena os textos capturados
  let textoEtapa7 = null;
  let textoEtapa9 = null;
  let emailJaEnviado = false;
  
  console.log('✅ Integração Formspree v10 carregada - Baseado nas telas REAIS');
  
  // Função para enviar e-mail
  async function enviarEmail() {
    if (emailJaEnviado) {
      console.log('⚠️ E-mail já foi enviado nesta sessão');
      return;
    }
    
    emailJaEnviado = true;
    
    try {
      const emailData = {
        _subject: '🌱 Nova Reserva - Sítio Piutá',
        'Etapa_7_Resumo_da_Reserva': textoEtapa7 || 'Não capturado',
        'Etapa_9_Dados_do_Cliente': textoEtapa9 || 'Não capturado',
        'Data_e_Hora_do_Envio': new Date().toLocaleString('pt-BR'),
        'URL': window.location.href
      };
      
      console.log('📤 ENVIANDO E-MAIL...');
      console.log('📋 Etapa 7 (Resumo):', textoEtapa7 ? 'CAPTURADO' : 'vazio');
      console.log('📋 Etapa 9 (Dados):', textoEtapa9 ? 'CAPTURADO' : 'vazio');
      
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
      } else {
        console.error('❌ Erro:', response.statusText);
        emailJaEnviado = false;
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      emailJaEnviado = false;
    }
  }
  
  // Monitora cliques em botões
  document.addEventListener('mousedown', function(event) {
    const target = event.target;
    const button = target.closest('button');
    if (!button) return;
    
    const buttonText = (button.textContent || '').trim();
    const pageText = document.body.innerText;
    
    console.log('🖱️ Botão clicado:', buttonText);
    
    // ============================================================
    // ETAPA 7: Detecta "Resumo" + "Etapa 7 de 10" na página
    // Botão: "Confirmar Reserva"
    // ============================================================
    const isEtapa7 = pageText.includes('Resumo') && 
                     pageText.includes('Etapa 7 de 10') &&
                     pageText.includes('Sua experiência no Sítio Piutá');
    
    if (isEtapa7 && buttonText.includes('Confirmar Reserva')) {
      console.log('🔔 === ETAPA 7 DETECTADA ===');
      console.log('📸 Capturando RESUMO DA RESERVA...');
      
      // Captura todo o texto da tela
      textoEtapa7 = pageText;
      
      console.log('✅ Etapa 7 capturada! (' + textoEtapa7.length + ' caracteres)');
      console.log('📝 Preview:', textoEtapa7.substring(0, 300));
    }
    
    // ============================================================
    // ETAPA 9: Detecta "Seus Dados" + "Etapa 9 de 10" na página
    // Botão: "Continuar para Pagamento"
    // ============================================================
    const isEtapa9 = pageText.includes('Seus Dados') && 
                     pageText.includes('Etapa 9 de 10') &&
                     pageText.includes('Quase lá!');
    
    if (isEtapa9 && buttonText.includes('Continuar para Pagamento')) {
      console.log('🔔 === ETAPA 9 DETECTADA ===');
      console.log('📸 Capturando DADOS DO CLIENTE...');
      
      // Captura os valores dos inputs (nome, email, telefone, observações)
      const inputs = document.querySelectorAll('input, textarea');
      let dadosCliente = '=== DADOS DO CLIENTE ===\n\n';
      
      inputs.forEach((input, index) => {
        const valor = input.value || '';
        if (valor.trim()) {
          // Tenta identificar o campo pelo placeholder ou posição
          let nomeCampo = input.placeholder || '';
          if (!nomeCampo) {
            // Identifica pela ordem: 1=Nome, 2=Email, 3=Telefone, 4=Observações
            const campos = ['Nome', 'E-mail', 'Telefone/WhatsApp', 'Observações'];
            nomeCampo = campos[index] || `Campo ${index + 1}`;
          }
          dadosCliente += nomeCampo + ': ' + valor + '\n';
          console.log('  📝 ' + nomeCampo + ':', valor);
        }
      });
      
      // Adiciona o texto completo da página também
      dadosCliente += '\n=== TEXTO COMPLETO DA TELA ===\n\n';
      dadosCliente += pageText;
      
      textoEtapa9 = dadosCliente;
      
      console.log('✅ Etapa 9 capturada! (' + textoEtapa9.length + ' caracteres)');
      
      // ENVIA O E-MAIL AGORA (antes de mudar para etapa 10)
      console.log('📤 Enviando e-mail AGORA (antes de ir para pagamento)...');
      enviarEmail();
    }
    
    // ============================================================
    // IGNORAR: Modal de pagamento (etapa 10)
    // Não deve capturar nada quando clica em PIX ou Cartão
    // ============================================================
    const isModalPagamento = pageText.includes('Pagamento via PIX') || 
                             pageText.includes('Chave PIX') ||
                             pageText.includes('Etapa 10 de 10');
    
    if (isModalPagamento) {
      console.log('ℹ️ Modal de pagamento detectado - NÃO capturando');
    }
    
  }, true);
  
})();
