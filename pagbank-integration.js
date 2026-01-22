// Integração PagBank - Sítio Piutá
// Versão 3.1 - Modal de pagamento (PIX direto e contato para cartão)
// Melhorias:
// - Configuração central via window.PIUTA_CONFIG
// - Gatilho mais seguro (evita interceptar botões fora da etapa de pagamento)
// - Parsing de valores mais robusto (milhar/pontuação)
// - Menos risco de interferir na navegação interna do app

(function () {
  console.log('✅ Integração PagBank v3.1 carregada');

  // Configurações do Sítio Piutá (preferencialmente via piuta-config.js)
  const CONFIG = Object.assign(
    {
      chavePix: 'sitiopiuta@gmail.com',
      whatsapp: '(81) 99159-0655',
      email: 'guidorafael@hotmail.com'
    },
    (window.PIUTA_CONFIG || {})
  );

  function normalizarTexto(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isEtapaPagamento() {
    const pageText = normalizarTexto(document.body && document.body.innerText);
    // Mantém compatibilidade com o fluxo atual, mas reduz falsos positivos.
    // Ajuste estes termos se o texto do app mudar.
    return (
      pageText.includes('Etapa 10 de 10') ||
      (pageText.includes('Pagamento') && pageText.includes('Etapa')) ||
      pageText.includes('Continuar para Pagamento')
    );
  }

  function extrairValorDoTexto(texto) {
    // Ex.: "Pagar R$ 1.539,00 via PIX" / "Pagar R$ 1539,00" / "Pagar R$ 1539"
    const match = String(texto || '').match(/R\$\s*([\d.]+)(?:,([\d]{2}))?/);
    if (!match) return 0;

    const inteiro = match[1].replace(/\./g, '');
    const centavos = match[2] ? match[2] : '00';

    const valor = Number(`${inteiro}.${centavos}`);
    return Number.isFinite(valor) ? valor : 0;
  }

  function detectarMetodo(textoBotao) {
    const t = String(textoBotao || '').toLowerCase();
    if (t.includes('pix')) return 'PIX';
    // fallback: se não mencionar, tratar como cartão
    return 'Cartão de Crédito';
  }

  // Monitora cliques e intercepta apenas quando houver alta confiança
  document.addEventListener(
    'click',
    function (event) {
      const target = event.target;
      const button = target && target.closest ? target.closest('button') : null;
      if (!button) return;

      const buttonText = normalizarTexto(button.textContent);
      if (!buttonText) return;

      // Só intercepta botões de pagamento, dentro (ou muito próximo) da etapa de pagamento.
      const pareceBotaoPagamento = buttonText.includes('Pagar R$') || buttonText.toLowerCase().includes('pagar via');
      if (!pareceBotaoPagamento) return;
      if (!isEtapaPagamento()) return;

      console.log('🔔 Botão de pagamento identificado:', buttonText);

      const valor = extrairValorDoTexto(buttonText);
      if (valor <= 0) {
        console.error('❌ Não foi possível extrair o valor do botão:', buttonText);
        alert('Erro ao processar o valor. Por favor, tente novamente.');
        return;
      }

      const metodo = detectarMetodo(buttonText);
      console.log('💳 Método detectado:', metodo, '| 💰 Valor:', valor);

      // Previne o comportamento padrão do botão apenas aqui, para não quebrar o app em outras etapas
      event.preventDefault();
      event.stopPropagation();

      mostrarModalPagamento(valor, metodo);
    },
    true
  );

  function mostrarModalPagamento(valor, metodo) {
    const valorFormatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Remove modal anterior se existir
    document.getElementById('pagbank-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'pagbank-modal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
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
          <p style="font-size: 32px; font-weight: bold; margin: 0;">${valorFormatado}</p>
          <p style="font-size: 12px; margin-top: 5px; opacity: 0.8;">✓ 5% de desconto aplicado</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px dashed #2d5016;">
          <p style="margin-bottom: 10px; font-weight: bold; color: #2d5016;">📱 Chave PIX (E-mail):</p>
          <p id="chave-pix" style="font-size: 16px; word-break: break-all; color: #333; background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 10px;">${CONFIG.chavePix}</p>
          <button id="btn-copiar" type="button"
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

        <a id="btn-wpp-comprovante"
           href="#"
           target="_blank"
           rel="noopener"
           style="display: inline-block; margin-top: 15px; padding: 14px 28px; background: #25D366; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; text-decoration: none;">
          📱 Enviar Comprovante via WhatsApp
        </a>

        <button type="button" id="btn-fechar-pix"
                style="display: block; width: 100%; margin-top: 15px; padding: 12px; background: transparent; color: #666; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 14px;">
          Fechar
        </button>
      `;
    } else {
      conteudo.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">💳</div>
        <h2 style="color: #2d5016; margin-bottom: 10px; font-size: 22px;">Pagamento via Cartão</h2>
        <p style="color: #666; margin-bottom: 20px; font-size: 14px;">Sítio Piutá - Experiências em Agroecologia</p>

        <div style="background: linear-gradient(135deg, #2d5016 0%, #4a7c23 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="font-size: 14px; margin-bottom: 5px; opacity: 0.9;">Valor a pagar:</p>
          <p style="font-size: 32px; font-weight: bold; margin: 0;">${valorFormatado}</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin-bottom: 15px; color: #333;">
            Para pagamento com cartão de crédito, enviaremos um <strong>link seguro do PagBank</strong>.
          </p>
          <p style="font-size: 14px; color: #666;">
            Clique no botão abaixo para solicitar o link de pagamento via WhatsApp.
          </p>
        </div>

        <a id="btn-wpp-link"
           href="#"
           target="_blank"
           rel="noopener"
           style="display: inline-block; margin-top: 15px; padding: 14px 28px; background: #25D366; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; text-decoration: none;">
          📱 Solicitar Link via WhatsApp
        </a>

        <p style="margin-top: 20px; font-size: 13px; color: #666;">
          Ou entre em contato:<br>
          📧 ${CONFIG.email}
        </p>

        <button type="button" id="btn-fechar-cartao"
                style="display: block; width: 100%; margin-top: 15px; padding: 12px; background: transparent; color: #666; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 14px;">
          Fechar
        </button>
      `;
    }

    modal.appendChild(conteudo);
    document.body.appendChild(modal);

    // Ações
    const wpp = String(CONFIG.whatsapp || '').replace(/\D/g, '');
    if (metodo === 'PIX') {
      const btnCopiar = conteudo.querySelector('#btn-copiar');
      btnCopiar?.addEventListener('click', copiarChavePix);

      const btnWpp = conteudo.querySelector('#btn-wpp-comprovante');
      if (btnWpp) {
        const msg = `Olá! Acabei de fazer um PIX de ${valorFormatado} para reserva no Sítio Piutá. Segue comprovante:`;
        btnWpp.href = `https://wa.me/55${wpp}?text=${encodeURIComponent(msg)}`;
      }

      conteudo.querySelector('#btn-fechar-pix')?.addEventListener('click', () => modal.remove());
    } else {
      const btnWpp = conteudo.querySelector('#btn-wpp-link');
      if (btnWpp) {
        const msg = `Olá! Gostaria de receber o link de pagamento do PagBank para minha reserva no valor de ${valorFormatado}.`;
        btnWpp.href = `https://wa.me/55${wpp}?text=${encodeURIComponent(msg)}`;
      }
      conteudo.querySelector('#btn-fechar-cartao')?.addEventListener('click', () => modal.remove());
    }

    // Fecha ao clicar fora
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.remove();
    });
  }

  function copiarChavePix() {
    const chaveEl = document.getElementById('chave-pix');
    if (!chaveEl) return;
    const chave = String(chaveEl.textContent || '').trim();
    const btn = document.getElementById('btn-copiar');

    function feedback(ok) {
      if (!btn) return;
      btn.textContent = ok ? '✓ Copiado!' : '❌ Falhou (copie manualmente)';
      btn.style.background = ok ? '#28a745' : '#dc3545';
      setTimeout(() => {
        btn.textContent = '📋 Copiar Chave PIX';
        btn.style.background = '#2d5016';
      }, 2000);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(chave).then(() => feedback(true)).catch(() => feedback(false));
      return;
    }

    // Fallback para navegadores antigos
    try {
      const textarea = document.createElement('textarea');
      textarea.value = chave;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      feedback(true);
    } catch (e) {
      feedback(false);
    }
  }

  // Feedback pós-retorno (se aplicável ao seu fluxo)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('pagamento') === 'sucesso') {
    setTimeout(() => {
      alert('🎉 Obrigado! Seu pagamento está sendo processado.\n\nEntraremos em contato em breve para confirmar sua reserva.');
    }, 1000);
  }
})();
