// Modificação da Etapa 4 - Alimentação
// Sítio Piutá - Restaurantes Parceiros
//
// Substitui as opções de alimentação por:
// - Trazer Própria Comida (recomendado)
// - Restaurantes parceiros com botão "Ver Cardápio"
//
// Melhorias:
// - Configuração central via window.PIUTA_CONFIG
// - Menos dependência de estilos inline do app (ainda mantém fallback por texto)
// - Marca elementos inseridos com classes para evitar duplicação

(function () {
  console.log('✅ Script de Alimentação Parceiros carregado');

  const CFG = Object.assign(
    {
      taxaEntrega: 20,
      restaurantes: [
        { id: 'parceiro1', nome: 'Restaurante Parceiro 1', tipo: 'Comida Regional', cardapioUrl: null },
        { id: 'parceiro2', nome: 'Restaurante Parceiro 2', tipo: 'Variedades', cardapioUrl: null },
        { id: 'parceiro3', nome: 'Restaurante Parceiro 3', tipo: 'Lanches e Refeições', cardapioUrl: null }
      ]
    },
    (window.PIUTA_CONFIG || {})
  );

  const RESTAURANTES = Array.isArray(CFG.restaurantes) ? CFG.restaurantes : [];
  const TAXA_ENTREGA = Number(CFG.taxaEntrega) || 0;

  const estilos = {
    container: `
      background-color: rgba(255,255,255,0.10);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.20);
      border-radius: 16px;
      padding: 20px;
      margin: 10px 0;
      color: white;
    `,
    botaoCardapio: `
      background-color: rgba(255,255,255,0.20);
      color: white;
      border: 1px solid rgba(255,255,255,0.30);
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
      white-space: nowrap;
    `,
    avisoTaxa: `
      background-color: rgba(255, 193, 7, 0.20);
      border: 1px solid rgba(255, 193, 7, 0.50);
      border-radius: 12px;
      padding: 15px;
      margin: 15px 0;
      text-align: center;
    `,
    modal: `
      position: fixed;
      inset: 0;
      background-color: rgba(0,0,0,0.80);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `,
    modalConteudo: `
      background-color: white;
      color: #333;
      border-radius: 20px;
      padding: 30px;
      max-width: 520px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    `
  };

  function normalizarTexto(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function isEtapaAlimentacao() {
    const pageText = normalizarTexto(document.body && document.body.innerText);
    return (
      pageText.includes('Alimentação') &&
      pageText.includes('Etapa 4 de 10') &&
      (pageText.includes('Como preferem se alimentar') || pageText.includes('Como vocês preferem se alimentar'))
    );
  }

  function mostrarCardapio(restaurante) {
    document.getElementById('modal-cardapio')?.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-cardapio';
    modal.style.cssText = estilos.modal;

    const conteudo = document.createElement('div');
    conteudo.style.cssText = estilos.modalConteudo;

    const taxaHtml = TAXA_ENTREGA > 0
      ? `<div style="margin-top: 20px; padding: 15px; background: rgba(255, 193, 7, 0.10); border: 1px solid rgba(255, 193, 7, 0.30); border-radius: 10px;">
           <p style="margin: 0; color: #856404; font-weight: bold; text-align: center;">🚚 Taxa de entrega: R$ ${TAXA_ENTREGA}</p>
           <p style="margin: 10px 0 0 0; color: #856404; font-size: 13px; text-align: center;">A taxa não está incluída no valor da reserva</p>
         </div>`
      : '';

    if (restaurante.cardapioUrl) {
      conteudo.innerHTML = `
        <button type="button" aria-label="Fechar" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
        <h2 style="color: #2D5016; margin-bottom: 8px;">${restaurante.nome}</h2>
        <p style="color: #666; margin-bottom: 20px;">${restaurante.tipo || ''}</p>
        <div style="text-align: center;">
          <img src="${restaurante.cardapioUrl}" alt="Cardápio" style="max-width: 100%; border-radius: 10px;">
        </div>
        ${taxaHtml}
      `;
    } else {
      conteudo.innerHTML = `
        <button type="button" aria-label="Fechar" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
        <h2 style="color: #2D5016; margin-bottom: 8px;">${restaurante.nome}</h2>
        <p style="color: #666; margin-bottom: 20px;">${restaurante.tipo || ''}</p>

        <div style="text-align: center; padding: 40px 20px; background: #f8f9fa; border-radius: 15px;">
          <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
          <h3 style="color: #2D5016; margin-bottom: 10px;">Cardápio em breve</h3>
          <p style="color: #666; margin-bottom: 0;">
            O cardápio deste restaurante parceiro será disponibilizado em breve.
          </p>
        </div>

        ${taxaHtml}

        <button type="button" style="width: 100%; margin-top: 20px; padding: 14px; background: #87A96B; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer;">
          Fechar
        </button>
      `;
    }

    modal.appendChild(conteudo);
    document.body.appendChild(modal);

    const closeBtn = conteudo.querySelector('button[aria-label="Fechar"]');
    closeBtn?.addEventListener('click', () => modal.remove());
    const footerClose = Array.from(conteudo.querySelectorAll('button')).find((b) => normalizarTexto(b.textContent) === 'Fechar');
    footerClose?.addEventListener('click', () => modal.remove());

    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.remove();
    });
  }

  function encontrarContainerEtapa() {
    // Heurística: localizar a região que contém as opções de alimentação.
    // Mantém compatibilidade com a estrutura atual do app.
    const divs = document.querySelectorAll('div');
    for (const d of divs) {
      const text = normalizarTexto(d.innerText);
      if (text.includes('Trazer Própria Comida') && d.querySelectorAll('button').length > 0) {
        return d;
      }
    }
    return null;
  }

  function modificarTelaAlimentacao() {
    const alimentacaoContainer = encontrarContainerEtapa();
    if (!alimentacaoContainer) return;

    if (alimentacaoContainer.dataset.piutaAlimentacaoModificado === 'true') return;
    alimentacaoContainer.dataset.piutaAlimentacaoModificado = 'true';

    console.log('🔄 Modificando tela de alimentação...');

    // Encontra cards originais (heurística por backdrop-filter). Caso mude, o item "Trazer Própria Comida" ainda é encontrado por texto.
    const itensOriginais = alimentacaoContainer.querySelectorAll('div[style*="backdrop-filter"]');

    // Mantém "Trazer Própria Comida" e esconde outros planos tradicionais
    itensOriginais.forEach((item) => {
      const texto = normalizarTexto(item.innerText);
      if (texto.includes('Trazer Própria Comida')) {
        const descricao = item.querySelector('p');
        if (descricao && !normalizarTexto(descricao.innerText).includes('cozinha')) {
          descricao.innerHTML = `
            <span style="color: #87A96B; font-weight: bold;">Recomendado</span><br>
            Use nossa cozinha compartilhada e geladeira • Grátis
          `;
        }
      } else if (
        texto.includes('Café da Manhã') ||
        texto.includes('Almoço') ||
        texto.includes('Jantar') ||
        texto.includes('Pensão Completa')
      ) {
        item.style.display = 'none';
      }
    });

    const itemTrazerComida = Array.from(itensOriginais).find((it) => normalizarTexto(it.innerText).includes('Trazer Própria Comida'));
    if (!itemTrazerComida) return;

    // Evita inserir duas vezes (em caso de re-render)
    if (alimentacaoContainer.querySelector('.piuta-restaurante-card')) return;

    // Inserção dos restaurantes
    RESTAURANTES.forEach((r) => {
      const card = document.createElement('div');
      card.className = 'piuta-restaurante-card';
      card.style.cssText = estilos.container;

      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div style="flex: 1; min-width: 0;">
            <h4 style="margin: 0 0 5px 0; color: white;">${r.nome}</h4>
            <p style="margin: 0; opacity: 0.7; font-size: 14px;">${r.tipo || ''}</p>
          </div>
          <button type="button" class="btn-cardapio" data-restaurante="${r.id}" style="${estilos.botaoCardapio}">
            📋 Ver Cardápio
          </button>
        </div>
      `;

      itemTrazerComida.parentNode.insertBefore(card, itemTrazerComida.nextSibling);

      const btn = card.querySelector('.btn-cardapio');
      btn?.addEventListener('click', function (e) {
        e.stopPropagation();
        mostrarCardapio(r);
      });
    });

    // Aviso taxa entrega
    if (TAXA_ENTREGA > 0) {
      const aviso = document.createElement('div');
      aviso.className = 'piuta-taxa-entrega';
      aviso.style.cssText = estilos.avisoTaxa;
      aviso.innerHTML = `
        <p style="margin: 0; font-weight: bold; color: #ffc107;">🚚 Taxa de entrega: R$ ${TAXA_ENTREGA}</p>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 13px; color: white;">
          Pedidos de restaurantes parceiros têm taxa de entrega não incluída no valor da reserva
        </p>
      `;

      const ultimoInserido = alimentacaoContainer.querySelector('.piuta-restaurante-card:last-of-type') || alimentacaoContainer.querySelector('.piuta-restaurante-card');
      if (ultimoInserido) {
        ultimoInserido.parentNode.insertBefore(aviso, ultimoInserido.nextSibling);
      } else {
        itemTrazerComida.parentNode.insertBefore(aviso, itemTrazerComida.nextSibling);
      }
    }

    console.log('✅ Tela de alimentação modificada com sucesso!');
  }

  // Observa mudanças no DOM para detectar quando a etapa de alimentação é exibida
  let ultimaVerificacao = 0;
  const observer = new MutationObserver(function () {
    const agora = Date.now();
    if (agora - ultimaVerificacao < 500) return;
    ultimaVerificacao = agora;

    if (isEtapaAlimentacao()) {
      setTimeout(modificarTelaAlimentacao, 100);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  setTimeout(function () {
    if (isEtapaAlimentacao()) modificarTelaAlimentacao();
  }, 1000);
})();
