// Integração PagBank - Sítio Piutá
// Versão 3.1 (PATCH) - Gatilho somente na Etapa 10 visível
// Correção: SPAs mantêm etapas anteriores ocultas no DOM, então não use apenas texto no body.
// Este script agora só intercepta cliques quando a etapa ATUAL (visível) for a Etapa 10/10.

(function() {
  console.log('✅ Integração PagBank v3.1 (PATCH) carregada');

  // Configurações do Sítio Piutá
  const CONFIG = {
    chavePix: 'sitiopiuta@gmail.com',  // Chave PIX (e-mail)
    whatsapp: '(81) 99159-0655',       // WhatsApp Sítio Piutá
    email: 'guidorafael@hotmail.com'
  };

  const STEP_NUMBER_ALVO = 10;

  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const inViewport = rect.bottom >= 0 && rect.right >= 0 && rect.top <= (window.innerHeight || 0) && rect.left <= (window.innerWidth || 0);
    return inViewport;
  }

  function getCurrentStepNumber() {
    const candidates = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);
    let node;
    while ((node = walker.nextNode())) {
      const el = node;
      if (!isVisible(el)) continue;
      const txt = (el.innerText || '').trim();
      if (!txt) continue;
      if (/Etapa\s+\d+\s+de\s+10/i.test(txt)) candidates.push(el);
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (rb.width * rb.height) - (ra.width * ra.height);
    });
    const m = (candidates[0].innerText || '').match(/Etapa\s+(\d+)\s+de\s+10/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function isEtapaPagamentoVisivel() {
    const step = getCurrentStepNumber();
    if (step !== STEP_NUMBER_ALVO) return false;

    // Opcional: reforço pelo título "Pagamento"
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);
    let node;
    while ((node = walker.nextNode())) {
      const el = node;
      if (!isVisible(el)) continue;
      const txt = (el.innerText || '').trim();
      if (!txt) continue;
      if (/Pagamento/i.test(txt)) return true;
    }
    // Se não achar "Pagamento", ainda assim deixa passar por ser Etapa 10
    return true;
  }

  function formatarChavePix(chave) {
    // Mostra um PIX "bonito" para copiar
    return chave;
  }

  function abrirWhatsApp(mensagem) {
    const numero = CONFIG.whatsapp.replace(/\D/g, '');
    const url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).then(() => {
      alert('✅ Chave PIX copiada!');
    }).catch(() => {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      alert('✅ Chave PIX copiada!');
    });
  }

  function criarModalPagamento(valor) {
    const modalId = 'piuta-modal-pagamento';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.55);
      display:flex; align-items:center; justify-content:center;
      padding: 18px;
    `;

    const chave = formatarChavePix(CONFIG.chavePix);
    const msg = `Olá! Quero pagar a reserva do Sítio Piutá no valor de R$ ${valor}. Pode me enviar o link para cartão?`;

    modal.innerHTML = `
      <div style="
        width: min(560px, 96vw);
        background: rgba(30,30,30,0.95);
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 18px;
        padding: 18px;
        color: white;
        backdrop-filter: blur(12px);
      ">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
          <div>
            <div style="font-size:16px;font-weight:800;margin:0 0 2px 0;">Pagamento da Reserva</div>
            <div style="opacity:0.75;font-size:13px;">Escolha PIX (imediato) ou Cartão (via WhatsApp)</div>
          </div>
          <button id="piuta-fechar" style="
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.18);
            color: white; border-radius: 12px;
            padding: 8px 10px; cursor: pointer;
          ">Fechar</button>
        </div>

        <div style="margin-top:14px;padding:14px;border:1px solid rgba(255,255,255,0.14);border-radius:14px;">
          <div style="font-weight:700;">PIX</div>
          <div style="margin-top:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; padding:10px 12px; border-radius:12px; background: rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12);">
              ${chave}
            </div>
            <button id="piuta-copiar" style="
              background: rgba(135, 169, 107, 0.25);
              border: 1px solid rgba(135, 169, 107, 0.55);
              color: white;
              border-radius: 12px;
              padding: 10px 12px;
              cursor: pointer;
            ">Copiar</button>
          </div>
        </div>

        <div style="margin-top:12px;padding:14px;border:1px solid rgba(255,255,255,0.14);border-radius:14px;">
          <div style="font-weight:700;">Cartão</div>
          <div style="margin-top:8px;opacity:0.85;font-size:13px;">Abra o WhatsApp e solicite o link de pagamento.</div>
          <button id="piuta-whats" style="
            margin-top:10px;
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.18);
            color: white;
            border-radius: 12px;
            padding: 10px 12px;
            cursor: pointer;
          ">Falar no WhatsApp</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('#piuta-fechar').addEventListener('click', () => modal.remove());
    modal.querySelector('#piuta-copiar').addEventListener('click', () => copiarTexto(CONFIG.chavePix));
    modal.querySelector('#piuta-whats').addEventListener('click', () => abrirWhatsApp(msg));

    document.body.appendChild(modal);
  }

  function extrairValor(texto) {
    // Tenta capturar "R$ 123" / "R$ 123,45"
    const m = (texto || '').match(/R\$\s*([\d\.]+(?:,\d{2})?)/);
    return m ? m[1] : '';
  }

  // Monitora cliques (com gate na etapa visível)
  document.addEventListener('click', function(event) {
    // Só atua na Etapa 10 visível
    if (!isEtapaPagamentoVisivel()) return;

    const target = event.target;
    if (!target) return;

    const buttonText = (target.textContent || '').trim();

    // Verifica se é o botão de pagamento (contém "Pagar R$" ou "Pagar via")
    if (buttonText.includes('Pagar R$') || buttonText.includes('Pagar via')) {
      event.preventDefault();
      event.stopPropagation();

      const valor = extrairValor(buttonText);
      criarModalPagamento(valor || '—');
    }
  }, true);

})();
