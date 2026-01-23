// Alimentação Parceiros - Sítio Piutá
// Versão robusta: injeta SOMENTE na etapa de Alimentação e remove ao sair da etapa.
// Evita "vazamento" de cards para Transporte/Pagamento/etc.

(function () {
  const CFG = (window.PIUTA_CONFIG && window.PIUTA_CONFIG.alimentacao) ? window.PIUTA_CONFIG.alimentacao : {};

  // Palavras-chave para identificar a etapa correta (título no topo da tela)
  const KEYWORDS = (CFG.stepTitleKeywords && Array.isArray(CFG.stepTitleKeywords) && CFG.stepTitleKeywords.length)
    ? CFG.stepTitleKeywords
    : ['aliment', 'restaur', 'refei', 'lanche'];

  // Se você preferir travar por número de etapa, informe no piuta-config.js:
  // window.PIUTA_CONFIG.alimentacao = { stepNumber: 7 }
  const STEP_NUMBER_TARGET = Number.isFinite(Number(CFG.stepNumber)) ? Number(CFG.stepNumber) : null;

  // IDs/markers para limpeza
  const INJECT_ATTR = 'data-piuta-injected';
  const INJECT_VALUE = 'alimentacao';
  const HIDDEN_ATTR = 'data-piuta-hidden';
  const INJECT_SELECTOR = `[${INJECT_ATTR}="${INJECT_VALUE}"]`;

  function normalize(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function findStepInfo() {
    // Procura um nó que contenha "Etapa X de Y" e extrai (X, Y) e o "título" do mesmo bloco.
    const all = Array.from(document.querySelectorAll('*'))
      .filter(el => el && el.childElementCount === 0); // folhas (menos ruído)

    let etapaEl = null;
    for (const el of all) {
      const t = normalize(el.textContent);
      if (t && /etapa\s+\d+\s+de\s+\d+/i.test(t)) {
        etapaEl = el;
        break;
      }
    }

    let stepNumber = null;
    let stepTotal = null;
    let title = null;

    if (etapaEl) {
      const txt = normalize(etapaEl.textContent);
      const m = txt.match(/etapa\s+(\d+)\s+de\s+(\d+)/i);
      if (m) {
        stepNumber = Number(m[1]);
        stepTotal = Number(m[2]);
      }

      // Tenta pegar o "título" olhando para o mesmo bloco/pai
      const parent = etapaEl.parentElement;
      if (parent) {
        const lines = String(parent.innerText || parent.textContent || '')
          .split('\n')
          .map(s => normalize(s))
          .filter(Boolean);

        // Ex.: ["Transporte", "Etapa 5 de 10"] -> título = "Transporte"
        title = lines.find(l => !/etapa\s+\d+\s+de\s+\d+/i.test(l)) || null;
      }
    }

    return { stepNumber, stepTotal, title };
  }

  function isTargetStep() {
    const info = findStepInfo();
    const title = normalize(info.title).toLowerCase();

    if (STEP_NUMBER_TARGET && info.stepNumber) {
      return info.stepNumber === STEP_NUMBER_TARGET;
    }

    if (!title) return false;

    return KEYWORDS.some(k => title.includes(String(k).toLowerCase()));
  }

  function removeInjected() {
    document.querySelectorAll(INJECT_SELECTOR).forEach(el => el.remove());

    // Reverte itens ocultados por nós (se houver)
    document.querySelectorAll(`[${HIDDEN_ATTR}="1"]`).forEach(el => {
      el.style.display = '';
      el.removeAttribute(HIDDEN_ATTR);
    });
  }

  function alreadyInjected() {
    return document.querySelector(INJECT_SELECTOR) != null;
  }

  function createCard(title, subtitle, priceText) {
    const card = document.createElement('div');
    card.setAttribute(INJECT_ATTR, INJECT_VALUE);
    card.className = 'piuta-restaurante-card';
    card.style.cssText = `
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; padding:14px 16px; border-radius:14px;
      background: rgba(255,255,255,0.14);
      border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(10px);
      color: #fff;
      min-width: 220px;
    `;

    const left = document.createElement('div');
    left.style.cssText = `display:flex; flex-direction:column; gap:4px;`;

    const h = document.createElement('div');
    h.textContent = title;
    h.style.cssText = `font-weight:700; font-size:14px;`;

    const s = document.createElement('div');
    s.textContent = subtitle || '';
    s.style.cssText = `opacity:.85; font-size:12px;`;

    left.appendChild(h);
    if (subtitle) left.appendChild(s);

    const right = document.createElement('div');
    right.style.cssText = `display:flex; align-items:center; gap:10px;`;

    if (priceText) {
      const p = document.createElement('div');
      p.textContent = priceText;
      p.style.cssText = `font-weight:700; font-size:13px;`;
      right.appendChild(p);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Ver Cardápio';
    btn.style.cssText = `
      border: 1px solid rgba(255,255,255,.22);
      background: rgba(0,0,0,.18);
      color:#fff;
      border-radius: 10px;
      padding: 8px 10px;
      cursor:pointer;
      font-size:12px;
    `;

    // Ação placeholder: você pode integrar com link/whatsapp aqui
    btn.addEventListener('click', () => {
      alert('Cardápio: em breve você poderá abrir o cardápio diretamente por aqui.');
    });

    right.appendChild(btn);

    card.appendChild(left);
    card.appendChild(right);

    return card;
  }

  function createFeeBanner(text) {
    const banner = document.createElement('div');
    banner.setAttribute(INJECT_ATTR, INJECT_VALUE);
    banner.className = 'piuta-taxa-entrega';
    banner.style.cssText = `
      padding: 14px 16px;
      border-radius: 14px;
      background: rgba(245, 170, 35, 0.20);
      border: 1px solid rgba(245, 170, 35, 0.35);
      color:#fff;
      font-weight:600;
      font-size:13px;
      min-width: 260px;
      text-align:center;
    `;
    banner.textContent = text;
    return banner;
  }

  function ensureInjected() {
    if (!isTargetStep()) {
      removeInjected();
      return;
    }

    if (alreadyInjected()) return;

    // Local de injeção: tenta achar um container "visível" na etapa
    // Preferência: o bloco principal que contém o botão "Continuar"
    const candidates = Array.from(document.querySelectorAll('button'))
      .filter(b => /continuar|avançar|próximo|proximo|seguir/i.test(normalize(b.textContent)))
      .map(b => b.closest('div'))
      .filter(Boolean);

    const host = candidates[0] || document.body;

    const row = document.createElement('div');
    row.setAttribute(INJECT_ATTR, INJECT_VALUE);
    row.style.cssText = `
      display:flex;
      flex-wrap:wrap;
      gap:12px;
      align-items:stretch;
      justify-content:flex-start;
      margin: 14px 0;
    `;

    const r1 = createCard('Restaurante Parceiro 1', 'Comida Regional', '');
    const r2 = createCard('Restaurante Parceiro 2', 'Variedades', '');
    const r3 = createCard('Restaurante Parceiro 3', 'Lanches e Refeições', '');
    const fee = createFeeBanner('Taxa de entrega: R$ 20 (não inclusa no valor da reserva)');

    row.appendChild(r3);
    row.appendChild(fee);
    row.appendChild(r2);
    row.appendChild(r1);

    // Insere antes do bloco do botão (se possível), senão no final do host
    const btn = Array.from(host.querySelectorAll('button')).find(b => /continuar/i.test(normalize(b.textContent)));
    if (btn && btn.parentElement) {
      btn.parentElement.insertAdjacentElement('beforebegin', row);
    } else {
      host.appendChild(row);
    }
  }

  // Observa mudanças de etapa (SPA)
  let t = null;
  const obs = new MutationObserver(() => {
    if (t) clearTimeout(t);
    t = setTimeout(ensureInjected, 120);
  });

  document.addEventListener('DOMContentLoaded', () => {
    ensureInjected();
    obs.observe(document.body, { childList: true, subtree: true });
  });

  console.log('✅ Script de Alimentação Parceiros (robusto) carregado');
})();
