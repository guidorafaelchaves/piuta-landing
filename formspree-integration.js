// Integração Formspree v6 - Captura Etapas 7 e 9
// Sítio Piutá - Reservas

(function() {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzznrdn';
  
  // Armazena os textos capturados
  let textoEtapa7 = null;
  let textoEtapa9 = null;
  
  console.log('✅ Integração Formspree v6 carregada - Captura etapas 7 e 9');
  
  // Função para enviar e-mail
  async function enviarEmail() {
    try {
      const emailData = {
        _subject: '🌱 Nova Reserva - Sítio Piutá',
        'Etapa 7 - Resumo da Reserva': textoEtapa7 || 'Não capturado',
        'Etapa 9 - Dados do Cliente': textoEtapa9 || 'Não capturado',
        'Data e Hora do Envio': new Date().toLocaleString('pt-BR'),
        'URL': window.location.href
      };
      
      console.log('📤 Enviando e-mail com dados das etapas 7 e 9...');
      
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
  
  // Monitora cliques em todos os botões
  document.addEventListener('click', async function(event) {
    const target = event.target;
    const buttonText = target.textContent || '';
    
    // Detecta clique em "Confirmar Reserva" (Etapa 7)
    if (buttonText.includes('Confirmar Reserva')) {
      console.log('🔔 Botão "Confirmar Reserva" clicado! (Etapa 7/10)');
      
      setTimeout(() => {
        textoEtapa7 = document.body.innerText;
        console.log('📸 Texto da Etapa 7 capturado:');
        console.log(textoEtapa7);
      }, 300);
    }
    
    // Detecta clique em "Continuar para Pagamento" (Etapa 9)
    if (buttonText.includes('Continuar para Pagamento') || 
        buttonText.includes('Continuar') && document.body.innerText.includes('Etapa 9')) {
      console.log('🔔 Botão "Continuar para Pagamento" clicado! (Etapa 9/10)');
      
      setTimeout(async () => {
        textoEtapa9 = document.body.innerText;
        console.log('📸 Texto da Etapa 9 capturado:');
        console.log(textoEtapa9);
        
        // Envia e-mail com ambas as etapas
        await enviarEmail();
      }, 300);
    }
    
  }, true);
  
})();
