// Integração PagBank - Sítio Piutá
// Detecta o botão "Pagar R$ XXXX via PIX" ou "Pagar via Cartão" e redireciona para o PagBank

(function() {
  console.log('✅ Integração PagBank carregada - Versão corrigida');
  
  // E-mail da conta PagBank (recebedor)
  const EMAIL_PAGBANK = 'guidorafael@hotmail.com';
  
  // Monitora todos os cliques na página
  document.addEventListener('click', function(event) {
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
        return;
      }
      
      // Detecta se é PIX ou Cartão
      const isPix = buttonText.toLowerCase().includes('pix');
      const metodo = isPix ? 'PIX' : 'Cartão';
      console.log('💳 Método de pagamento:', metodo);
      
      // Previne o comportamento padrão do botão
      event.preventDefault();
      event.stopPropagation();
      
      // Redireciona para o PagBank
      redirecionarPagBank(valor, metodo);
    }
  }, true); // capture: true para interceptar antes do React
  
  // Função para redirecionar para o checkout do PagBank
  function redirecionarPagBank(valor, metodo) {
    console.log('🚀 Redirecionando para PagBank...');
    console.log('   Valor: R$', valor.toFixed(2));
    console.log('   Método:', metodo);
    
    // Cria um formulário oculto para enviar ao PagBank
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://pagseguro.uol.com.br/v2/checkout/payment.html';
    form.target = '_blank';
    
    // Campos do formulário
    const campos = {
      'receiverEmail': EMAIL_PAGBANK,
      'currency': 'BRL',
      'itemId1': 'RESERVA-PIUTA',
      'itemDescription1': 'Reserva Sítio Piutá - Experiências em Agroecologia',
      'itemAmount1': valor.toFixed(2),
      'itemQuantity1': '1',
      'reference': 'PIUTA-' + Date.now(),
      'shippingType': '3'
    };
    
    // Adiciona os campos ao formulário
    for (const [nome, val] of Object.entries(campos)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = nome;
      input.value = val;
      form.appendChild(input);
    }
    
    // Adiciona ao body, submete e remove
    document.body.appendChild(form);
    
    console.log('📤 Enviando formulário para PagBank...');
    form.submit();
    
    // Remove o formulário após um pequeno delay
    setTimeout(() => {
      document.body.removeChild(form);
    }, 1000);
  }
  
  // Verifica se voltou de um pagamento bem-sucedido
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('pagamento') === 'sucesso') {
    setTimeout(() => {
      alert('🎉 Obrigado! Seu pagamento está sendo processado.\n\nEntraremos em contato em breve para confirmar sua reserva.');
    }, 1000);
  }
  
})();
