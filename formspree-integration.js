// Integração Formspree v13 - TEXTO (Resumo + Dados do responsável)
// Sítio Piutá - Reservas
//
// Objetivos desta versão:
// 1) Eliminar screenshots (html2canvas) e enviar apenas TEXTO estruturado.
// 2) Evitar erro 422 do Formspree (campo "email" inválido) enviando:
//    - contato_email (sempre)
//    - _replyto (apenas se e-mail for válido)
// 3) Reescrever/normalizar a Etapa 9 via JS (sem quebrar o visual do site):
//    - questionário simples, sem perguntas repetidas (ex.: "quantas pessoas" já existe antes)
//    - não bloqueia envio por validação rígida (apenas sinaliza campos faltantes)
// 4) Enviar no clique de "Continuar" da Etapa 9 (uma única vez).

(function () {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzznrdn';

  let envioJaFeito = false;

  // ----------------------------
  // UI: toast/badge de status
  // ----------------------------
  function ensureStatusEl() {
    let el = document.getElementById('piuta-status');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'piuta-status';
    el.style.position = 'fixed';
    el.style.left = '16px';
    el.style.bottom = '16px';
    el.style.zIndex = '99999';
    el.style.maxWidth = '420px';
    el.style.padding = '10px 12px';
    el.style.borderRadius = '12px';
    el.style.background = 'rgba(0,0,0,0.60)';
    el.style.color = '#fff';
    el.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
    el.style.fontSize = '13px';
    el.style.lineHeight = '1.25';
    el.style.backdropFilter = 'blur(8px)';
    el.style.boxShadow = '0 10px 22px rgba(0,0,0,0.25)';
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }

  function showStatus(msg, timeoutMs = 2500) {
    const el = ensureStatusEl();
    el.textContent = msg;
    el.style.display = 'block';
    if (timeoutMs > 0) {
      window.clearTimeout(el.__t);
      el.__t = window.setTimeout(() => (el.style.display = 'none'), timeoutMs);
    }
  }

  // ----------------------------
  // Helpers
  // ----------------------------
  function normalizeText(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function isValidEmail(email) {
    const e = String(email || '').trim();
    // validação simples/robusta o suficiente p/ _replyto
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  }

  function safeGetValue(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    return normalizeText(el.value || el.textContent || '');
  }

  function nowBR() {
    try {
      return new Date().toLocaleString('pt-BR');
    } catch {
      return String(new Date());
    }
  }

  // ----------------------------
  // Etapa 9: injeção do formulário
  // ----------------------------
  function findEtapa9Container() {
    // Observação: seu app alterna estruturas entre builds.
    // Tentamos as opções mais comuns sem quebrar.
    return (
      document.getElementById('etapa-9') ||
      document.querySelector('[data-etapa="9"]') ||
      document.querySelector('.etapa[data-step="9"]') ||
      null
    );
  }

  function injectEtapa9IfNeeded() {
    const container = findEtapa9Container();
    if (!container) return false;

    // Se já injetamos, não refaz
    if (container.__piutaEtapa9Injected) return true;

    // Só injeta quando a Etapa 9 realmente estiver "visível" no fluxo
    const bodyText = normalizeText(document.body && document.body.innerText);
    const likelyOnStep9 =
      bodyText.includes('Etapa 9') ||
      bodyText.includes('Dados do responsável') ||
      bodyText.includes('Seus dados');
    if (!likelyOnStep9) return false;

    // Mantém classe original do container, mas força um wrapper leve
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.maxWidth = '980px';
    wrapper.style.margin = '0 auto';
    wrapper.style.padding = '18px 14px';

    // Card simples (não depende do CSS existente, mas não conflita)
    const card = document.createElement('div');
    card.style.borderRadius = '18px';
    card.style.padding = '16px';
    card.style.background = 'rgba(255,255,255,0.10)';
    card.style.backdropFilter = 'blur(10px)';
    card.style.border = '1px solid rgba(255,255,255,0.18)';

    const title = document.createElement('div');
    title.textContent = 'Dados do responsável pela reserva';
    title.style.fontSize = '18px';
    title.style.fontWeight = '700';
    title.style.marginBottom = '6px';

    const subtitle = document.createElement('div');
    subtitle.textContent = 'Essas informações são usadas apenas para confirmação e contato.';
    subtitle.style.fontSize = '13px';
    subtitle.style.opacity = '0.9';
    subtitle.style.marginBottom = '14px';

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(12, 1fr)';
    grid.style.gap = '10px';

    function mkField({ id, label, placeholder, type = 'text', col = 6, required = false, as = 'input' }) {
      const wrap = document.createElement('div');
      wrap.style.gridColumn = `span ${col}`;
      const lab = document.createElement('div');
      lab.textContent = label + (required ? ' *' : '');
      lab.style.fontSize = '12px';
      lab.style.margin = '0 0 6px 2px';
      lab.style.opacity = '0.95';

      const inp = document.createElement(as);
      inp.id = id;
      inp.name = id;
      inp.placeholder = placeholder || '';
      if (as === 'input') inp.type = type;
      inp.style.width = '100%';
      inp.style.padding = '10px 12px';
      inp.style.borderRadius = '12px';
      inp.style.border = '1px solid rgba(255,255,255,0.20)';
      inp.style.background = 'rgba(0,0,0,0.18)';
      inp.style.color = '#fff';
      inp.style.outline = 'none';
      inp.style.fontSize = '14px';
      inp.style.boxSizing = 'border-box';
      inp.autocomplete = 'off';

      wrap.appendChild(lab);
      wrap.appendChild(inp);
      return wrap;
    }

    // Campos (sem repetir "quantas pessoas")
    grid.appendChild(mkField({ id: 'piuta_nome', label: 'Nome completo', placeholder: 'Ex.: Maria Silva', col: 4, required: true }));
    grid.appendChild(mkField({ id: 'piuta_contato_email', label: 'E-mail (opcional)', placeholder: 'Ex.: nome@dominio.com', type: 'email', col: 4 }));
    grid.appendChild(mkField({ id: 'piuta_whatsapp', label: 'WhatsApp / Telefone', placeholder: 'Ex.: (81) 9xxxx-xxxx', col: 4, required: true }));

    grid.appendChild(mkField({ id: 'piuta_cidade_estado', label: 'Cidade / Estado', placeholder: 'Ex.: Garanhuns/PE', col: 4 }));
    grid.appendChild(mkField({ id: 'piuta_horario_chegada', label: 'Previsão de chegada (opcional)', placeholder: 'Ex.: 15h–16h', col: 4 }));
    grid.appendChild(mkField({ id: 'piuta_restricoes', label: 'Restrições / necessidades (opcional)', placeholder: 'Alergias, mobilidade, crianças/idosos...', col: 4 }));

    const obs = mkField({ id: 'piuta_observacoes', label: 'Observações gerais (opcional)', placeholder: 'O que você acha importante o sítio saber?', col: 12, as: 'textarea' });
    obs.querySelector('textarea').rows = 3;
    grid.appendChild(obs);

    // Aviso não-bloqueante
    const note = document.createElement('div');
    note.id = 'piuta_step9_note';
    note.style.marginTop = '12px';
    note.style.fontSize = '12px';
    note.style.opacity = '0.95';
    note.textContent = 'Dica: nome e WhatsApp são recomendados para confirmar rapidamente.';

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(grid);
    card.appendChild(note);

    wrapper.appendChild(card);

    // Substitui conteúdo do container da etapa 9
    container.innerHTML = '';
    container.appendChild(wrapper);

    container.__piutaEtapa9Injected = true;
    showStatus('Etapa 9 carregada (dados do responsável).', 1800);
    return true;
  }

  // ----------------------------
  // Coleta do Resumo (Etapa 7)
  // ----------------------------
  function coletarResumoTexto() {
    // Tentativas: localizar bloco que contém "Resumo" e capturar texto limpo.
    const candidates = Array.from(document.querySelectorAll('section, div'))
      .filter((el) => {
        const t = normalizeText(el.innerText);
        return t.includes('Resumo') && (t.includes('Check-in') || t.includes('Check-out') || t.includes('Total'));
      })
      .slice(0, 5);

    if (candidates.length) {
      // pega o menor bloco que ainda contém o resumo
      candidates.sort((a, b) => (a.innerText || '').length - (b.innerText || '').length);
      return normalizeText(candidates[0].innerText);
    }

    // fallback: extrai uma janela do body ao redor de "Resumo"
    const body = normalizeText(document.body && document.body.innerText);
    const idx = body.indexOf('Resumo');
    if (idx >= 0) return body.slice(idx, Math.min(body.length, idx + 1200));
    return '';
  }

  // ----------------------------
  // Coleta dados Etapa 9
  // ----------------------------
  function coletarDadosResponsavel() {
    const data = {
      nome: safeGetValue('piuta_nome'),
      contato_email: safeGetValue('piuta_contato_email'),
      whatsapp: safeGetValue('piuta_whatsapp'),
      cidade_estado: safeGetValue('piuta_cidade_estado'),
      horario_chegada: safeGetValue('piuta_horario_chegada'),
      restricoes: safeGetValue('piuta_restricoes'),
      observacoes: safeGetValue('piuta_observacoes')
    };

    // texto humano
    const linhas = [];
    linhas.push(`Nome: ${data.nome || '-'}`);
    linhas.push(`WhatsApp/Telefone: ${data.whatsapp || '-'}`);
    if (data.contato_email) linhas.push(`E-mail: ${data.contato_email}`);
    if (data.cidade_estado) linhas.push(`Cidade/Estado: ${data.cidade_estado}`);
    if (data.horario_chegada) linhas.push(`Previsão de chegada: ${data.horario_chegada}`);
    if (data.restricoes) linhas.push(`Restrições/necessidades: ${data.restricoes}`);
    if (data.observacoes) linhas.push(`Observações: ${data.observacoes}`);

    return { data, texto: linhas.join('\n') };
  }

  // ----------------------------
  // Envio Formspree
  // ----------------------------
  async function enviarFormspree() {
    if (envioJaFeito) return;
    envioJaFeito = true;

    const resumo = coletarResumoTexto();
    const { data: dados, texto: dadosTexto } = coletarDadosResponsavel();

    // Sinaliza (sem bloquear) se faltam campos recomendados
    const faltas = [];
    if (!dados.nome) faltas.push('nome');
    if (!dados.whatsapp) faltas.push('whatsapp');
    if (faltas.length) {
      showStatus(`Atenção: faltando ${faltas.join(' e ')} (a reserva ainda será enviada).`, 3200);
    } else {
      showStatus('Enviando reserva…', 2500);
    }

    const payload = new FormData();
    payload.append('_subject', '🌱 Nova Reserva - Sítio Piutá');
    payload.append('Data_e_Hora', nowBR());
    payload.append('URL', window.location.href);

    // Campos chave no e-mail
    payload.append('RESUMO_TEXTO', resumo || '(não foi possível extrair o resumo)');
    payload.append('DADOS_RESPONSAVEL_TEXTO', dadosTexto || '(sem dados preenchidos)');
    payload.append('DADOS_RESPONSAVEL_JSON', JSON.stringify(dados || {}));

    // Evita validação do Formspree em campo "email"
    // (Formspree costuma validar automaticamente "email")
    if (dados.contato_email) payload.append('contato_email', dados.contato_email);

    // Se e-mail estiver ok, também habilita reply-to
    if (isValidEmail(dados.contato_email)) {
      payload.append('_replyto', dados.contato_email);
    }

    try {
      const resp = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: payload,
        headers: { Accept: 'application/json' }
      });

      if (resp.ok) {
        showStatus('Reserva enviada com sucesso.', 3500);
        console.log('✅ Formspree OK');
      } else {
        const err = await resp.text();
        envioJaFeito = false; // libera retry
        showStatus('Falha ao enviar reserva. Veja o Console.', 4500);
        console.error('❌ Formspree erro:', resp.status, err);
      }
    } catch (e) {
      envioJaFeito = false;
      showStatus('Erro de rede ao enviar. Veja o Console.', 4500);
      console.error('❌ Erro de rede Formspree:', e);
    }
  }

  // ----------------------------
  // Gatilhos: injeção e envio
  // ----------------------------
  function shouldConsiderOnStep9() {
    const t = normalizeText(document.body && document.body.innerText);
    return t.includes('Etapa 9') || t.includes('Dados do responsável') || t.includes('Seus Dados');
  }

  // Injeta quando a etapa 9 aparecer
  const stepWatcher = setInterval(() => {
    try {
      if (shouldConsiderOnStep9()) injectEtapa9IfNeeded();
    } catch {}
  }, 500);

  // Dispara envio no clique do botão de continuar da etapa 9
  document.addEventListener(
    'click',
    function (event) {
      const target = event.target;
      const btn = target && target.closest ? target.closest('button') : null;
      if (!btn) return;

      const txt = normalizeText(btn.textContent);
      const bodyTxt = normalizeText(document.body && document.body.innerText);

      const isEtapa9 = bodyTxt.includes('Etapa 9') || bodyTxt.includes('Dados do responsável') || bodyTxt.includes('Seus Dados');

      // Aceita variações de botão
      const isContinue =
        txt.includes('Continuar') ||
        txt.includes('Pagamento') ||
        txt.includes('Confirmar Reserva');

      if (isEtapa9 && isContinue) {
        // garante injeção antes de coletar
        injectEtapa9IfNeeded();
        enviarFormspree();
      }
    },
    true
  );

  console.log('✅ Integração Formspree v13 carregada (texto + etapa 9 injetada)');
})();
