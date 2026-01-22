// Integração Formspree FINAL - Captura Total da Tela de Resumo
// Sítio Piutá - Reservas

(function() {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzznrdn';
  
  console.log('✅ Integração Formspree FINAL carregada');
  
  // Monitora cliques no botão "Confirmar Reserva"
  document.addEventListener('click', async function(event) {
    const target = event.target;
    const buttonText = target.textContent || '';
    
    // Detecta clique no botão "Confirmar Reserva"
    if (buttonText.includes('Confirmar Reserva')) {
      console.log('🔔 Botão "Confirmar Reserva" clicado!');
      
      // Aguarda um pouco para garantir que a tela está renderizada
      setTimeout(async () => {
        // Captura TODO o texto visível da página
        const textoCompleto = document.body.innerText;
        
        console.log('📸 Texto capturado da tela:');
        console.log(textoCompleto);
        
        // Envia para o Formspree
        try {
          const emailData = {
            _subject: '🌱 Nova Reserva - Sítio Piutá',
            'Resumo Completo': textoCompleto,
            'Data e Hora': new Date().toLocaleString('pt-BR'),
            'URL': window.location.href
          };
          
          console.log('📤 Enviando para Formspree...');
          
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
            console.error('❌ Erro ao enviar:', response.statusText);
          }
        } catch (error) {
          console.error('❌ Erro na requisição:', error);
        }
      }, 300);
    }
  }, true);
  
})();
