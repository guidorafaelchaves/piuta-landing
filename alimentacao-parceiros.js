// Modificação da Etapa 4 - Alimentação
// Sítio Piutá - Restaurantes Parceiros
//
// IMPORTANTE (correção do "vazamento" para outras etapas):
// Este script agora só atua quando a etapa ATUAL (visível) for a Etapa 4/10.
// Muitos SPAs mantêm etapas anteriores no DOM (ocultas), então não podemos usar document.body.innerText.
// A detecção foi refeita para olhar apenas elementos visíveis.
//
// Substitui as opções de alimentação por:
// - Trazer Própria Comida (recomendado)
// - 3 Restaurantes Parceiros com botão "Ver Cardápio"

(function () {
  console.log('✅ Script de Alimentação Parceiros carregado (modo seguro por etapa visível)');

  // =========================
  // CONFIGURAÇÃO
  // =========================
  const RESTAURANTES = [
    { id: 'parceiro1', nome: 'Restaurante Parceiro 1', tipo: 'Comida Regional', cardapioUrl: null },
    { id: 'parceiro2', nome: 'Restaurante Parceiro 2', tipo: 'Variedades', cardapioUrl: null },
    { id: 'parceiro3', nome: 'Restaurante Parceiro 3', tipo: 'Lanches e Refeições', cardapioUrl: null }
  ];

  const TAXA_ENTREGA = 20;

  // Textos-alvo (ajuste aqui se você mudar frases na UI)
  const STEP_NUMBER_ALVO = 4;
  const REGEX_PERGUNTA_ALVO = /Como\s+prefer(em|e)\s+se\s+alimentar/i;

  // Identificação dos elementos inseridos por este script
  const PLUGIN_ATTR = 'data-piuta-plugin';
  const PLUGIN_NAME = 'alimentacao-parceiros';

  // =========================
  // HELPERS (visibilidade / etapa)
  // =========================
  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    // Se estiver fora da viewport por completo, considere não-visível (evita pegar telas "fora do flow")
    const inViewport = rect.bottom >= 0 && rect.right >= 0 && rect.top <= (window.innerHeight || 0) && rect.left <= (window.innerWidth || 0);
    return inViewport;
  }

  function getVisibleTextElements(pattern) {
    const out = [];
    // Busca ampla por nós que contenham texto, mas filtrando por visibilidade
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);
    let node;
    while ((node = walker.nextNode())) {
      const el = node;
      if (!isVisible(el)) continue;
      const txt = (el.innerText || '').trim();
      if (!txt) continue;
      if (pattern.test(txt)) out.push(el);
    }
    return out;
  }

  function getCurrentStepNumber() {
    // Procura elemento visível com "Etapa X de 10"
    const candidates = getVisibleTextElements(/Etapa\s+\d+\s+de\s+10/i);
    if (!candidates.length) return null;

    // Pega o candidato "mais relevante" (maior área)
    candidates.sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (rb.width * rb.height) - (ra.width * ra.height);
    });

    const txt = candidates[0].innerText;
    const m = txt.match(/Etapa\s+(\d+)\s+de\s+10/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function isEtapaAlimentacaoVisivel() {
    const step = getCurrentStepNumber();
    if (step !== STEP_NUMBER_ALVO) return false;

    // Confirma a pergunta da etapa de alimentação (visível)
    const perguntaVisivel = getVisibleTextElements(REGEX_PERGUNTA_ALVO);
    return perguntaVisivel.length > 0;
  }

  function cleanup() {
    // Remove tudo que este script inseriu anteriormente (se a etapa mudou)
    document.querySelectorAll(`[${PLUGIN_ATTR}="${PLUGIN_NAME}"]`).forEach(el => el.remove());

    // Fecha modal se existir
    const modal = document.getElementById('modal-cardapio-piuta');
    if (modal) modal.remove();
  }

  // =========================
  // UI (modal)
  // =========================
  function mostrarCardapio(restaurante) {
    const url = restaurante.cardapioUrl;
    const conteudo = url
      ? `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#87a96b;text-decoration:underline;">Abrir cardápio</a>`
      : `<p style="margin:0;opacity:0.9;">Cardápio será disponibilizado em breve.</p>`;

    let modal = document.getElementById('modal-cardapio-piuta');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-cardapio-piuta';
      modal.setAttribute(PLUGIN_ATTR, PLUGIN_NAME);
      modal.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,0.55);
        display: flex; align-items: center; justify-content: center;
        padding: 18px;
      `;
      modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.remove();
      });
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div style="
        width: min(520px, 96vw);
        background: rgba(30,30,30,0.95);
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 18px;
        padding: 18px 18px 14px 18px;
        color: white;
        backdrop-filter: blur(12px);
      ">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
          <div>
            <div style="font-size:16px;font-weight:700;margin:0 0 2px 0;">${restaurante.nome}</div>
            <div style="opacity:0.75;font-size:13px;">${restaurante.tipo}</div>
          </div>
          <button id="btn-fechar-cardapio" style="
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.18);
            color: white; border-radius: 12px;
            padding: 8px 10px; cursor: pointer;
          ">Fechar</button>
        </div>

        <div style="margin-top:14px;line-height:1.35;">
          ${conteudo}
        </div>

        <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.14);opacity:0.9;font-size:13px;">
          Taxa de entrega (não incluída na reserva): <strong>R$ ${TAXA_ENTREGA}</strong>
        </div>
      </div>
    `;

    modal.querySelector('#btn-fechar-cardapio').addEventListener('click', function () {
      modal.remove();
    });
  }

  // =========================
  // INJEÇÃO (somente na etapa 4 visível)
  // =========================
  const estilos = {
    card: `
      background-color: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 16px;
      margin: 10px 0;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      min-height: 72px;
    `,
    botaoCardapio: `
      background: rgba(135, 169, 107, 0.25);
      border: 1px solid rgba(135, 169, 107, 0.55);
      color: white;
      border-radius: 12px;
      padding: 10px 12px;
      cursor: pointer;
      white-space: nowrap;
    `,
    avisoTaxa: `
      background-color: rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 14px;
      padding: 12px 14px;
      margin-top: 12px;
      backdrop-filter: blur(10px);
    `
  };

  function findOpcaoTrazerComidaVisivel() {
    // Procura por um card/opção VISÍVEL com "Trazer Própria Comida"
    const candidates = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);
    let node;
    while ((node = walker.nextNode())) {
      const el = node;
      if (!isVisible(el)) continue;
      const txt = (el.innerText || '').trim();
      if (!txt) continue;
      if (/Trazer\s+Pr(ó|o)pria\s+Comida/i.test(txt)) candidates.push(el);
    }
    if (!candidates.length) return null;

    // Queremos o menor elemento "card" que contenha esse texto (mais próximo da UI)
    candidates.sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height);
    return candidates[0];
  }

  function alreadyAppliedNear(anchorEl) {
    if (!anchorEl) return false;
    const container = anchorEl.parentElement;
    if (!container) return false;
    return !!container.querySelector(`[${PLUGIN_ATTR}="${PLUGIN_NAME}"]`);
  }

  function modificarTelaAlimentacao() {
    if (!isEtapaAlimentacaoVisivel()) {
      cleanup();
      return;
    }

    const anchor = findOpcaoTrazerComidaVisivel();
    if (!anchor) return;

    // Normalmente o "card" tem um container comum com outros cards.
    const container = anchor.parentElement;
    if (!container) return;

    if (alreadyAppliedNear(anchor)) return; // evita duplicação

    // Insere cards dos restaurantes após a opção "Trazer Própria Comida"
    RESTAURANTES.forEach(restaurante => {
      const card = document.createElement('div');
      card.setAttribute(PLUGIN_ATTR, PLUGIN_NAME);
      card.style.cssText = estilos.card;
      card.innerHTML = `
        <div style="min-width: 0;">
          <div style="font-weight: 700; font-size: 14px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${restaurante.nome}
          </div>
          <div style="margin: 2px 0 0 0; opacity: 0.75; font-size: 13px;">
            ${restaurante.tipo}
          </div>
        </div>
        <button type="button" class="btn-cardapio" data-restaurante="${restaurante.id}" style="${estilos.botaoCardapio}">
          📋 Ver Cardápio
        </button>
      `;

      // Insere após a âncora
      container.insertBefore(card, anchor.nextSibling);

      card.querySelector('.btn-cardapio').addEventListener('click', function (e) {
        e.stopPropagation();
        mostrarCardapio(restaurante);
      });
    });

    // Aviso taxa
    const aviso = document.createElement('div');
    aviso.setAttribute(PLUGIN_ATTR, PLUGIN_NAME);
    aviso.style.cssText = estilos.avisoTaxa;
    aviso.innerHTML = `
      <div style="font-weight: 700; color: #ffc107;">🚚 Taxa de entrega: R$ ${TAXA_ENTREGA}</div>
      <div style="margin-top: 4px; opacity: 0.9; font-size: 13px; color: white;">
        Pedidos de restaurantes parceiros têm taxa de entrega não incluída no valor da reserva.
      </div>
    `;

    // Coloca depois dos cards injetados
    // (acha o último inserido)
    const injected = container.querySelectorAll(`[${PLUGIN_ATTR}="${PLUGIN_NAME}"]`);
    if (injected.length) {
      container.insertBefore(aviso, injected[injected.length - 1].nextSibling);
    } else {
      container.appendChild(aviso);
    }

    console.log('✅ Alimentação: restaurantes parceiros aplicados somente na Etapa 4 visível.');
  }

  // =========================
  // OBSERVAÇÃO: reavalia ao trocar etapa
  // =========================
  let lastRun = 0;
  const observer = new MutationObserver(function () {
    const now = Date.now();
    if (now - lastRun < 300) return;
    lastRun = now;
    setTimeout(modificarTelaAlimentacao, 50);
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(modificarTelaAlimentacao, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
