// Integração com Formspree - Sítio Piutá
// Este script captura os dados da reserva e envia para o e-mail via Formspree

(function() {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzznrdn';
  
  // Aguarda o carregamento completo
  window.addEventListener('load', function() {
    console.log('✅ Integração Formspree carregada');
    
    // Monitora cliques em todo o documento
    document.addEventListener('click', async function(event) {
      const target = event.target;
      const buttonText = target.textContent || '';
      
      // Detecta clique no botão de pagamento
      if (buttonText.includes('Pagar R$') && (buttonText.includes('PIX') || buttonText.includes('Cartão'))) {
        console.log('🔔 Botão de pagamento detectado!');
        
        // Aguarda um pouco para o alert aparecer
        setTimeout(async () => {
          try {
            // Captura informações visíveis na página
            const pageText = document.body.innerText;
            
            // Tenta extrair dados básicos
            const emailData = {
              _subject: '🌱 Nova Reserva - Sítio Piutá',
              timestamp: new Date().toLocaleString('pt-BR'),
              pagina_completa: pageText.substring(0, 5000), // Limita para não exceder
              metodo_pagamento: buttonText.includes('PIX') ? 'PIX' : 'Cartão de Crédito',
              url_origem: window.location.href
            };
            
            console.log('📤 Enviando dados para Formspree...');
            
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
        }, 100);
      }
    }, true);
  });
})();
