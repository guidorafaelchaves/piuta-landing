// Integração Formspree v7 - Captura Etapas 7 e 9
// Sítio Piutá - Reservas

(function() {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzznrdn';
  
  // Armazena os textos capturados
  let textoEtapa7 = null;
  let textoEtapa9 = null;
  
  console.log('✅ Integração Formspree v7 carregada - Captura etapas 7 e 9');
  
  // Função para enviar e-mail
  async function enviarEmail() {
    try {
      const emailData = {
        _subject: '🌱 Nova Reserva - Sítio Piutá',
        'Etapa_7_Resumo_da_Reserva': textoEtapa7 || 'Não capturado',
        'Etapa_9_Dados_do_Cliente': textoEtapa9 || 'Não capturado',
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
  
  // Monitora cliques em todos os botões
  document.addEventListener('click', async function(event) {
    const target = event.target;
    const buttonText = (target.textContent || '').toLowerCase();
    const bodyText = document.body.innerText;
    
    console.log('🖱️ Clique detectado em:', buttonText);
    
    // Detecta clique em "Confirmar Reserva" (Etapa 7)
    if (buttonText.includes('confirmar reserva')) {
      console.log('🔔 Botão "Confirmar Reserva" clicado! (Etapa 7/10)');
      
      setTimeout(() => {
        textoEtapa7 = document.body.innerText;
        console.log('📸 Texto da Etapa 7 capturado!');
        console.log('Tamanho:', textoEtapa7.length, 'caracteres');
      }, 100);
    }
    
    // Detecta clique em "Continuar para Pagamento" ou variações (Etapa 9)
    // Verifica se o texto do botão contém "pagamento" OU se estamos na etapa 9 e clicamos em continuar
    if (buttonText.includes('pagamento') || 
        (buttonText.includes('continuar') && bodyText.includes('Etapa 9'))) {
      console.log('🔔 Botão para pagamento clicado! (Etapa 9/10)');
      
      // Captura o texto ANTES de avançar
      textoEtapa9 = document.body.innerText;
      console.log('📸 Texto da Etapa 9 capturado!');
      console.log('Tamanho:', textoEtapa9.length, 'caracteres');
      
      // Envia e-mail com ambas as etapas
      setTimeout(async () => {
        await enviarEmail();
      }, 300);
    }
    
  }, true);
  
})();
