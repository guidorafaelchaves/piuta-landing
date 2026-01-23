// formspree-integration.js — v13 (NOVA LÓGICA, SEM SCREENSHOT)
// Objetivo:
// - Nunca capturar screenshot.
// - Enviar para o Formspree um e-mail com:
//   1) RESUMO_TEXTO (texto do resumo da reserva)
//   2) DADOS_PESSOAIS_TEXTO + campos estruturados (nome, email, whatsapp etc.)
// - Bloquear qualquer lógica antiga de screenshot caso ainda exista no bundle/cache.

(function () {
  // Evita carregar duas vezes
  if (window.__PIUTA_FORMSPREE_V13__) return;
  window.__PIUTA_FORMSPREE_V13__ = true;

  // Mata funções/flags antigas de screenshot se existirem (defensivo)
  window.html2canvas = undefined;
  window.PIUTA_CAPTURE_SCREENSHOT = function () { return Promise.resolve(null); };
  window.PIUTA_SCREENSHOT = null;

  const CFG = (window.PIUTA_CONFIG && window.PIUTA_CONFIG.formspree) ? window.PIUTA_CONFIG.formspree : {};
  const ENDPOINT = CFG.endpoint || "https://formspree.io/f/xvzznrdn";

  // Onde guardamos snapshots entre etapas (SPA)
  const STORE_KEY = "__PIUTA_FORMSPREE_SNAPSHOT__";

  function log(...args) { console.log("[Formspree v13]", ...args); }
  function warn(...args) { console.warn("[Formspree v13]", ...args); }
  function norm(s) { return String(s || "").replace(/\s+/g, " ").trim(); }

  function getRoot() {
    return document.getElementById("root") || document.body;
  }

  function getVisibleText(el) {
    if (!el) return "";
    // innerText é melhor pra e-mail (quebras e texto real)
    return String(el.innerText || el.textContent || "").trim();
  }

  function loadSnap() {
    try {
      return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveSnap(snap) {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(snap || {}));
    } catch (e) {
      warn("Falha ao salvar snapshot:", e);
    }
  }

  function detectStepNumber() {
    // Procura "Etapa X de Y" no texto visível
    const txt = getVisibleText(getRoot());
    const m = txt.match(/Etapa\s+(\d+)\s+de\s+(\d+)/i);
    return m ? Number(m[1]) : null;
  }

  // 1) Captura RESUMO_TEXTO: tenta encontrar a área de resumo; se não achar, pega um recorte bom do texto da tela
  function captureResumoTexto() {
    const root = getRoot();

    // tentativa: achar um bloco que contenha "Resumo"
    const candidates = Array.from(root.querySelectorAll("div, section, article"))
      .filter(el => /Resumo/i.test(getVisibleText(el)))
      .sort((a, b) => getVisibleText(b).length - getVisibleText(a).length);

    if (candidates.length) {
      const txt = getVisibleText(candidates[0]);
      if (txt.length > 30) return txt;
    }

    // fallback: pega texto da tela, mas evita mandar a página inteira infinita
    const full = getVisibleText(root);
    if (!full) return "";
    // mantém somente um trecho razoável (o e-mail fica legível)
    return full.length > 3500 ? full.slice(0, 3500) + "\n...\n(continua na tela)" : full;
  }

  // 2) Captura DADOS PESSOAIS de inputs/textareas/selects da etapa atual
  function captureDadosPessoais() {
    const root = getRoot();
    const fields = Array.from(root.querySelectorAll("input, textarea, select"));

    const obj = {};
    for (const el of fields) {
      if (!el) continue;

      const tag = (el.tagName || "").toLowerCase();
      const type = (el.getAttribute("type") || "").toLowerCase();

      if (tag === "input" && ["button", "submit", "hidden", "reset"].includes(type)) continue;

      let val = "";
      if (tag === "select") {
        val = el.value || "";
      } else if (tag === "input" && (type === "checkbox" || type === "radio")) {
        val = el.checked ? "sim" : "não";
      } else {
        val = el.value || "";
      }

      val = norm(val);
      if (!val) continue;

      const name = norm(el.getAttribute("name"));
      const placeholder = norm(el.getAttribute("placeholder"));
      const id = norm(el.getAttribute("id"));

      // tenta label[for=id]
      let label = "";
      if (id) {
        const lbl = root.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (lbl) label = norm(getVisibleText(lbl));
      }

      // fallback: label próximo
      if (!label) {
        const wrap = el.closest("label, div, section, article") || el.parentElement;
        if (wrap) {
          const lbl2 = wrap.querySelector("label");
          if (lbl2) label = norm(getVisibleText(lbl2));
        }
      }

      const key = label || name || placeholder || `campo_${Object.keys(obj).length + 1}`;
      obj[key] = val;
    }

    return obj;
  }

  function objToText(obj) {
    const entries = Object.entries(obj || {});
    if (!entries.length) return "";
    return entries.map(([k, v]) => `- ${k}: ${v}`).join("\n");
  }

  function pickStructured(obj) {
    // tenta descobrir nome/email/whatsapp em qualquer chave
    const lower = {};
    for (const [k, v] of Object.entries(obj || {})) lower[String(k).toLowerCase()] = v;

    function findAny(...needles) {
      for (const [k, v] of Object.entries(lower)) {
        if (!v) continue;
        if (needles.some(n => k.includes(n))) return v;
      }
      return "";
    }

    return {
      nome: findAny("nome", "name"),
      email: findAny("email", "e-mail", "mail"),
      whatsapp: findAny("whatsapp", "telefone", "celular", "phone"),
      documento: findAny("cpf", "documento"),
    };
  }

  async function sendFormspree(payload) {
    const fd = new FormData();

    const subjectParts = ["🌱 Nova Reserva — Sítio Piutá"];
    if (payload.structured?.nome) subjectParts.push(payload.structured.nome);
    if (payload.checkin && payload.checkout) subjectParts.push(`${payload.checkin}→${payload.checkout}`);

    fd.append("_subject", subjectParts.join(" — "));
    if (payload.structured?.email) fd.append("_replyto", payload.structured.email);

    fd.append("Data_e_Hora", new Date().toLocaleString("pt-BR"));
    fd.append("URL", window.location.href);

    fd.append("RESUMO_TEXTO", payload.resumo || "(Resumo não encontrado)");
    fd.append("DADOS_PESSOAIS_TEXTO", payload.dadosTexto || "(Dados pessoais não encontrados)");

    // estruturados
    if (payload.structured?.nome) fd.append("NOME", payload.structured.nome);
    if (payload.structured?.email) fd.append("EMAIL", payload.structured.email);
    if (payload.structured?.whatsapp) fd.append("WHATSAPP", payload.structured.whatsapp);
    if (payload.structured?.documento) fd.append("DOCUMENTO", payload.structured.documento);

    // raw json para automação futura
    try {
      fd.append("DADOS_PESSOAIS_JSON", JSON.stringify(payload.dadosObj || {}));
    } catch {}

    log("Enviando para Formspree…");

    const res = await fetch(ENDPOINT, {
      method: "POST",
      body: fd,
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Formspree ${res.status}: ${t}`);
    }

    log("OK — enviado.");
  }

  // Gatilho único: envia quando entrar na etapa final ou quando clicar em botão de pagamento/finalizar.
  // Também captura snapshots antes de mudar de tela.
  let sending = false;

  function shouldSendByButton(text) {
    const t = text.toLowerCase();
    return (
      t.includes("pagar") ||
      t.includes("finalizar") ||
      t.includes("concluir") ||
      t.includes("confirmar") ||
      t.includes("pagamento")
    );
  }

  function updateSnapshots() {
    const step = detectStepNumber();
    const snap = loadSnap();

    // Sempre que estiver numa tela que pareça "Resumo", salva resumo
    const resumo = captureResumoTexto();
    if (resumo && /Resumo/i.test(resumo)) {
      snap.resumo = resumo;
      snap.resumo_step = step;
    }

    // Sempre que houver inputs preenchíveis, salva dados pessoais (mesmo que ainda não seja etapa 9)
    const dadosObj = captureDadosPessoais();
    if (Object.keys(dadosObj).length) {
      snap.dadosObj = { ...(snap.dadosObj || {}), ...dadosObj };
      snap.dados_step = step;
    }

    saveSnap(snap);
    return snap;
  }

  async function maybeSend(trigger) {
    if (sending) return;
    const snap = updateSnapshots();

    // Critério de envio: se já temos resumo + algum dado pessoal, e o trigger indica finalização
    const hasResumo = !!snap.resumo && snap.resumo.length > 30;
    const hasDados = !!snap.dadosObj && Object.keys(snap.dadosObj).length > 0;

    if (!hasResumo && !hasDados) return;

    // trava para não enviar em cliques intermediários
    if (trigger !== "final") return;

    sending = true;
    try {
      const structured = pickStructured(snap.dadosObj || {});
      const dadosTexto = objToText(snap.dadosObj || {});

      await sendFormspree({
        resumo: snap.resumo,
        dadosObj: snap.dadosObj,
        dadosTexto,
        structured,
      });

      // limpa snapshot após enviar (evita reenvio)
      sessionStorage.removeItem(STORE_KEY);
    } catch (e) {
      warn("Falha ao enviar:", e);
      sending = false; // permite tentar de novo
      alert("Não foi possível enviar a reserva por e-mail agora. Tente novamente.");
    }
  }

  // Captura e envia pelo clique (ANTES de trocar de etapa)
  document.addEventListener("click", async (ev) => {
    const btn = ev.target && ev.target.closest ? ev.target.closest("button") : null;
    if (!btn) return;

    const text = norm(btn.innerText || btn.textContent || "");
    // sempre atualiza snapshots
    updateSnapshots();

    // se o botão indica finalização/pagamento, envia
    if (shouldSendByButton(text)) {
      await maybeSend("final");
    }
  }, true);

  // Também mantém snapshot atualizado enquanto navega
  const obs = new MutationObserver(() => {
    // guarda silenciosamente para não depender do clique exato
    updateSnapshots();
  });
  obs.observe(document.body, { childList: true, subtree: true });

  log("Ativo. Endpoint:", ENDPOINT);
})();
