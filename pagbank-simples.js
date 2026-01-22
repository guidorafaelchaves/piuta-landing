// Integração PagBank Simples - Sítio Piutá
// Este script captura o valor do site e redireciona para o PagBank

(function() {
  console.log('✅ Integração PagBank Simples carregada');
  
  // E-mail da conta PagBank (recebedor)
  const EMAIL_PAGBANK = 'guidorafael@hotmail.com';
  
  // URL do checkout PagBank (Formulário HTML)
  const PAGBANK_CHECKOUT_URL = 'https://pagseguro.uol.com.br/v2/checkout/payment.html';
  
  // Função para extrair valor da página
  function extrairValor() {
    const textoCompleto = document.body.innerText;
    
    // Procura por "R$ X.XXX" seguido de "para X pessoas"
    let match = textoCompleto.match(/R\$\s*([\d.,]+)\s*para\s*\d+\s*pessoa/i);
    if (match) {
      return parseFloat(match[1].replace('.', '').replace(',', '.'));
    }
    
    // Procura por "Total a Pagar R$ XXX" ou similar
    match = textoCompleto.match(/Total[^\d]*R\$\s*([\d.,]+)/i);
    if (match) {
      return parseFloat(match[1].replace('.', '').replace(',', '.'));
    }
    
    // Procura por qualquer "R$ X.XXX" grande (acima de 100)
    const matches = textoCompleto.match(/R\$\s*([\d.,]+)/g);
    if (matches) {
      for (const m of matches) {
        const valor = parseFloat(m.replace('R$', '').trim().replace('.', '').replace(',', '.'));
        if (valor >= 100) {
          return valor;
        }
      }
    }
    
    return null;
  }
  
  // Função para criar e submeter formulário para o PagBank
  function redirecionarPagBank(valor, metodoPagamento) {
    console.log('💳 Redirecionando para PagBank - Valor: R$', valor, '- Método:', metodoPagamento);
    
    // Cria um formulário oculto
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = PAGBANK_CHECKOUT_URL;
    form.target = '_blank'; // Abre em nova aba
    
    // Campos obrigatórios do PagBank
    const campos = {
      'receiverEmail': EMAIL_PAGBANK,
      'currency': 'BRL',
      'itemId1': 'RESERVA001',
      'itemDescription1': 'Reserva Sítio Piutá - Experiências em Agroecologia',
      'itemAmount1': valor.toFixed(2),
      'itemQuantity1': '1',
      'reference': 'PIUTA-' + Date.now(),
      'senderName': '',
      'senderEmail': '',
      'shippingType': '3' // Sem frete
    };
    
    // Adiciona os campos ao formulário
    for (const [nome, valor] of Object.entries(campos)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = nome;
      input.value = valor;
      form.appendChild(input);
    }
    
    // Adiciona ao body, submete e remove
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }
  
  // Função alternativa: redirecionar via URL direta (mais simples)
  function redirecionarPagBankSimples(valor) {
    console.log('💳 Redirecionando para PagBank - Valor: R$', valor);
    
    // URL do checkout simplificado do PagBank
    // Formato: https://pag.ae/EMAIL?amount=VALOR
    const valorFormatado = valor.toFixed(2);
    
    // Monta a URL de checkout
    const checkoutUrl = `https://pagseguro.uol.com.br/checkout/v2/payment.html?` +
      `receiverEmail=${encodeURIComponent(EMAIL_PAGBANK)}` +
      `&currency=BRL` +
      `&itemId1=RESERVA` +
      `&itemDescription1=${encodeURIComponent('Reserva Sítio Piutá')}` +
      `&itemAmount1=${valorFormatado}` +
      `&itemQuantity1=1` +
      `&reference=PIUTA-${Date.now()}`;
    
    // Abre em nova aba
    window.open(checkoutUrl, '_blank');
  }
  
  // Monitora cliques nos botões de pagamento
  document.addEventListener('click', function(event) {
    const target = event.target;
    const buttonText = (target.textContent || '').toLowerCase();
    const parentText = (target.parentElement?.textContent || '').toLowerCase();
    
    // Detecta clique no botão PIX
    if (buttonText.includes('pix') || (target.closest && target.closest('[class*="pix"]'))) {
      console.log('🔔 Botão PIX clicado!');
      
      const valor = extrairValor();
      if (!valor) {
        alert('Não foi possível identificar o valor. Por favor, tente novamente.');
        return;
      }
      
      // Para PIX, mostra instruções manuais (PagBank vai oferecer PIX no checkout)
      alert(`Você será redirecionado para o PagBank.\n\nValor: R$ ${valor.toFixed(2)}\n\nEscolha PIX como forma de pagamento na próxima tela.`);
      redirecionarPagBank(valor, 'PIX');
    }
    
    // Detecta clique no botão Cartão
    if (buttonText.includes('cartão') || buttonText.includes('cartao') || 
        buttonText.includes('crédito') || buttonText.includes('credito') ||
        parentText.includes('cartão') || parentText.includes('crédito')) {
      console.log('🔔 Botão Cartão clicado!');
      
      const valor = extrairValor();
      if (!valor) {
        alert('Não foi possível identificar o valor. Por favor, tente novamente.');
        return;
      }
      
      alert(`Você será redirecionado para o PagBank.\n\nValor: R$ ${valor.toFixed(2)}\n\nEscolha Cartão de Crédito na próxima tela.`);
      redirecionarPagBank(valor, 'CARTAO');
    }
  }, true);
  
  // Verifica se voltou de um pagamento
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('pagamento') === 'sucesso') {
    setTimeout(() => {
      alert('🎉 Obrigado! Seu pagamento está sendo processado.\n\nEntraremos em contato em breve para confirmar sua reserva.');
    }, 1000);
  }
  
})();
