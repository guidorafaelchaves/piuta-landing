// Integração PagBank - Sítio Piutá
// Versão 3.0 - Solução com PIX direto e contato para cartão
// O método antigo de formulário HTML foi depreciado pelo PagBank

(function() {
  console.log('✅ Integração PagBank v3.0 carregada');
  
  // Configurações do Sítio Piutá
  const CONFIG = {
    chavePix: 'guidorafael@hotmail.com',  // Chave PIX (e-mail)
    whatsapp: '(81) 99159-0655',           // WhatsApp Sítio Piutá
    email: 'guidorafael@hotmail.com'
  };
  
  // Monitora todos os cliques na página
  document.addEventListener('click', async function(event) {
    const target = event.target;
    const buttonText = target.textContent || '';
    
    // Verifica se é o botão de pagamento (contém "Pagar R$" ou "Pagar via")
    if (buttonText.includes('Pagar R$') || buttonText.includes('Pagar via')) {
      console.log('🔔 Botão de pagamento clicado:', buttonText);
      
      // Extrai o valor do texto do botão (ex: "Pagar R$ 1539 via PIX")
      const matchValor = buttonText.match(/R\$\s*([\d.,]+)/);
      let valor = 0;
      
      if (matchValor) {
        // Remove pontos de milhar e converte vírgula em ponto
        valor = parseFloat(matchValor[1].replace('.', '').replace(',', '.'));
        console.log('💰 Valor extraído:', valor);
      }
      
      if (valor <= 0) {
        console.error('❌ Não foi possível extrair o valor');
        alert('Erro ao processar o valor. Por favor, tente novamente.');
        return;
      }
      
      // Detecta se é PIX ou Cartão
      const isPix = buttonText.toLowerCase().includes('pix');
      const metodo = isPix ? 'PIX' : 'Cartão de Crédito';
      console.log('💳 Método de pagamento:', metodo);
      
      // Previne o comportamento padrão do botão
      event.preventDefault();
      event.stopPropagation();
      
      // Mostra modal de pagamento
      mostrarModalPagamento(valor, metodo);
    }
  }, true);
  
  // Função para mostrar modal de pagamento
  function mostrarModalPagamento(valor, metodo) {
    const valorFormatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    // Remove modal anterior se existir
    document.getElementById('pagbank-modal')?.remove();
    
    // Cria modal
    const modal = document.createElement('div');
    modal.id = 'pagbank-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
      box-sizing: border-box;
    `;
    
    const conteudo = document.createElement('div');
    conteudo.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 16px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      color: #333;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    
    if (metodo === 'PIX') {
      conteudo.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">🌱</div>
        <h2 style="color: #2d5016; margin-bottom: 10px; font-size: 22px;">Pagamento via PIX</h2>
        <p style="color: #666; margin-bottom: 20px; font-size: 14px;">Sítio Piutá - Experiências em Agroecologia</p>
        
        <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="font-size: 14px; margin-bottom: 5px; opacity: 0.9;">Valor a pagar:</p>
          <p style="font-size: 32px; font-weight: bold; margin: 0;">
            ${valorFormatado}
          </p>
          <p style="font-size: 12px; margin-top: 5px; opacity: 0.8;">✓ 5% de desconto aplicado</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px dashed #2d5016;">
          <p style="margin-bottom: 10px; font-weight: bold; color: #2d5016;">📱 Chave PIX (E-mail):</p>
          <p id="chave-pix" style="font-size: 16px; word-break: break-all; color: #333; background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 10px;">
            ${CONFIG.chavePix}
          </p>
          <button id="btn-copiar" onclick="copiarChavePix()" 
                  style="padding: 12px 24px; background: #2d5016; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.3s;">
            📋 Copiar Chave PIX
          </button>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">
          <p style="font-size: 14px; color: #856404; margin: 0;">
            <strong>📌 Importante:</strong><br>
            Após realizar o PIX, envie o comprovante por WhatsApp para confirmarmos sua reserva.
          </p>
        </div>
        
        <a href="https://wa.me/55${CONFIG.whatsapp.replace(/\D/g, '')}?text=Olá! Acabei de fazer um PIX de ${valorFormatado} para reserva no Sítio Piutá. Segue comprovante:" 
           target="_blank"
           style="display: inline-block; margin-top: 15px; padding: 14px 28px; background: #25D366; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; text-decoration: none;">
          📱 Enviar Comprovante via WhatsApp
        </a>
        
        <button onclick="document.getElementById('pagbank-modal').remove()" 
                style="display: block; width: 100%; margin-top: 15px; padding: 12px; background: transparent; color: #666; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 14px;">
          Fechar
        </button>
      `;
    } else {
      // Pagamento com cartão - solicita link via WhatsApp
      conteudo.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">💳</div>
        <h2 style="color: #2d5016; margin-bottom: 10px; font-size: 22px;">Pagamento via Cartão</h2>
        <p style="color: #666; margin-bottom: 20px; font-size: 14px;">Sítio Piutá - Experiências em Agroecologia</p>
        
        <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="font-size: 14px; margin-bottom: 5px; opacity: 0.9;">Valor a pagar:</p>
          <p style="font-size: 32px; font-weight: bold; margin: 0;">
            ${valorFormatado}
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin-bottom: 15px; color: #333;">
            Para pagamento com cartão de crédito, enviaremos um <strong>link seguro do PagBank</strong> para você.
          </p>
          <p style="font-size: 14px; color: #666;">
            Clique no botão abaixo para solicitar o link de pagamento via WhatsApp.
          </p>
        </div>
        
        <a href="https://wa.me/55${CONFIG.whatsapp.replace(/\D/g, '')}?text=Olá! Gostaria de receber o link de pagamento do PagBank para minha reserva no valor de ${valorFormatado}." 
           target="_blank"
           style="display: inline-block; margin-top: 15px; padding: 14px 28px; background: #25D366; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; text-decoration: none;">
          📱 Solicitar Link via WhatsApp
        </a>
        
        <p style="margin-top: 20px; font-size: 13px; color: #666;">
          Ou entre em contato:<br>
          📧 ${CONFIG.email}
        </p>
        
        <button onclick="document.getElementById('pagbank-modal').remove()" 
                style="display: block; width: 100%; margin-top: 15px; padding: 12px; background: transparent; color: #666; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 14px;">
          Fechar
        </button>
      `;
    }
    
    modal.appendChild(conteudo);
    document.body.appendChild(modal);
    
    // Fecha ao clicar fora
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  // Função global para copiar chave PIX
  window.copiarChavePix = function() {
    const chave = document.getElementById('chave-pix').textContent.trim();
    navigator.clipboard.writeText(chave).then(() => {
      const btn = document.getElementById('btn-copiar');
      btn.textContent = '✓ Copiado!';
      btn.style.background = '#28a745';
      setTimeout(() => {
        btn.textContent = '📋 Copiar Chave PIX';
        btn.style.background = '#2d5016';
      }, 2000);
    }).catch(err => {
      // Fallback para navegadores mais antigos
      const textarea = document.createElement('textarea');
      textarea.value = chave;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      const btn = document.getElementById('btn-copiar');
      btn.textContent = '✓ Copiado!';
      btn.style.background = '#28a745';
      setTimeout(() => {
        btn.textContent = '📋 Copiar Chave PIX';
        btn.style.background = '#2d5016';
      }, 2000);
    });
  };
  
  // Verifica se voltou de um pagamento bem-sucedido
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('pagamento') === 'sucesso') {
    setTimeout(() => {
      alert('🎉 Obrigado! Seu pagamento está sendo processado.\n\nEntraremos em contato em breve para confirmar sua reserva.');
    }, 1000);
  }
  
})();
