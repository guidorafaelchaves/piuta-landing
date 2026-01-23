// Formspree Integration (texto-only) – Piutá v6
// Objetivos:
// 1) Enviar um e-mail com TODO o conteúdo relevante (resumo + dados pessoais) sem screenshot.
// 2) Evitar 422 do Formspree: NÃO enviar campo chamado "email"; usar "contato_email" e "_replyto" apenas se válido.
// 3) Capturar dados com lógica robusta (wizard SPA): procura campos visíveis, labels/placeholder, e extrai "Resumo" do DOM.
// 4) Enviar uma única vez quando o usuário clicar em botões típicos de finalização/continuação.

(function () {
  // === AJUSTE AQUI se necessário ===
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/xvzznrdn";

  // Evita múltiplos envios
  let alreadySent = false;

  // -------------------------
  // Helpers
  // -------------------------
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();

  const isValidEmail = (email) => {
    const e = String(email || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  };

  const nowBR = () => {
    try {
      return new Date().toLocaleString("pt-BR");
    } catch {
      return String(new Date());
    }
  };

  // Pequeno status no canto (debug amigável, sem quebrar layout)
  function status(msg, ms = 2200) {
    try {
      let el = document.getElementById("piuta-formspree-status");
      if (!el) {
        el = document.createElement("div");
        el.id = "piuta-formspree-status";
        el.style.position = "fixed";
        el.style.right = "16px";
        el.style.bottom = "16px";
        el.style.zIndex = "99999";
        el.style.maxWidth = "360px";
        el.style.padding = "10px 12px";
        el.style.borderRadius = "12px";
        el.style.background = "rgba(0,0,0,0.65)";
        el.style.color = "#fff";
        el.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
        el.style.fontSize = "12.5px";
        el.style.lineHeight = "1.25";
        el.style.backdropFilter = "blur(8px)";
        el.style.boxShadow = "0 10px 22px rgba(0,0,0,0.25)";
        el.style.display = "none";
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.display = "block";
      if (ms > 0) {
        clearTimeout(el.__t);
        el.__t = setTimeout(() => (el.style.display = "none"), ms);
      }
    } catch {}
  }

  // -------------------------
  // Captura de dados pessoais (Etapa 9 ou equivalente)
  // -------------------------
  function pickFieldLabel(el) {
    // 1) label ligado por for=
    if (el.id) {
      const lab = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lab) return norm(lab.innerText);
    }
    // 2) label “pai”
    const parentLabel = el.closest("label");
    if (parentLabel) return norm(parentLabel.innerText);

    // 3) aria-label / name / placeholder
    return (
      norm(el.getAttribute("aria-label")) ||
      norm(el.name) ||
      norm(el.id) ||
      norm(el.placeholder) ||
      "Campo"
    );
  }

  function collectVisibleFormFields() {
    const fields = Array.from(document.querySelectorAll("input, textarea, select"));

    const data = {};
    for (const el of fields) {
      // somente visíveis e preenchidos
      if (el.offsetParent === null) continue;
      if (el.disabled) continue;

      const type = (el.type || "").toLowerCase();
      if (type === "hidden" || type === "button" || type === "submit") continue;

      let value = "";
      if (el.tagName === "SELECT") value = norm(el.value);
      else value = norm(el.value);

      if (!value) continue;

      const key = pickFieldLabel(el);

      // Não explodir o e-mail por repetição: se já existir, agrega
      if (data[key] && data[key] !== value) {
        data[key] = `${data[key]} | ${value}`;
      } else {
        data[key] = value;
      }
    }
    return data;
  }

  // tenta achar um e-mail “natural” dentro dos campos coletados
  function inferEmailFromCollected(collected) {
    const keys = Object.keys(collected || {});
    // busca por chaves comuns
    const candidates = keys
      .filter((k) => /e-?mail|email/i.test(k))
      .map((k) => collected[k])
      .filter(Boolean);

    for (const c of candidates) {
      // se houver múltiplos, tenta separar
      const parts = String(c).split(/[|,; ]+/).map((p) => p.trim());
      for (const p of parts) {
        if (isValidEmail(p)) return p;
      }
      if (isValidEmail(c)) return c;
    }
    return "";
  }

  // -------------------------
  // Captura do Resumo (Etapa 7/Resumo final)
  // -------------------------
  function collectResumo() {
    // Estratégia 1: pegar o menor bloco que contenha “Resumo” e “Total”
    const blocks = Array.from(document.querySelectorAll("section, div, article"))
      .filter((el) => {
        const t = norm(el.innerText);
        return t.includes("Resumo") && (t.includes("Total") || t.includes("Check-in") || t.includes("Check-out"));
      })
      .sort((a, b) => (a.innerText || "").length - (b.innerText || "").length);

    if (blocks.length) return norm(blocks[0].innerText);

    // Estratégia 2: fallback — fatia do body a partir de “Resumo”
    const body = norm(document.body && document.body.innerText);
    const idx = body.indexOf("Resumo");
    if (idx >= 0) return body.slice(idx, Math.min(body.length, idx + 1400));

    return "";
  }

  function formatBlock(title, objOrText) {
    const line = "----------------------------------------";
    if (typeof objOrText === "string") {
      const t = norm(objOrText);
      return `${title}\n${line}\n${t || "(vazio)"}\n`;
    }
    const entries = Object.entries(objOrText || {});
    if (!entries.length) return `${title}\n${line}\n(vazio)\n`;
    const lines = entries.map(([k, v]) => `${k}: ${v}`);
    return `${title}\n${line}\n${lines.join("\n")}\n`;
  }

  // -------------------------
  // Envio (FormData)
  // -------------------------
  async function sendFormspree() {
    if (alreadySent) return;

    alreadySent = true;
    status("Enviando reserva…", 2500);

    const resumo = collectResumo();
    const collected = collectVisibleFormFields();
    const inferredEmail = inferEmailFromCollected(collected);

    const textEmail =
      formatBlock("RESUMO DA RESERVA", resumo) +
      "\n" +
      formatBlock("DADOS PREENCHIDOS (CAMPOS VISÍVEIS)", collected) +
      "\n" +
      `META\n----------------------------------------\n` +
      `Data/Hora: ${nowBR()}\nURL: ${window.location.href}\n`;

    const fd = new FormData();

    // Assunto
    fd.append("_subject", "🌱 Nova Reserva – Sítio Piutá");

    // Corpo principal em texto (o que você quer ver no e-mail)
    fd.append("mensagem", textEmail);

    // Dados auxiliares para filtros/automação
    fd.append("resumo_texto", resumo || "");
    fd.append("dados_campos_json", JSON.stringify(collected || {}));
    fd.append("contato_email", inferredEmail || ""); // NÃO usar "email"

    // Reply-to apenas se válido (evita 422)
    if (isValidEmail(inferredEmail)) {
      fd.append("_replyto", inferredEmail);
    }

    try {
      const resp = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });

      if (resp.ok) {
        status("Reserva enviada com sucesso.", 3500);
        console.log("✅ Formspree OK");
      } else {
        alreadySent = false; // libera retry
        const errText = await resp.text();
        status("Falha ao enviar (veja Console).", 4500);
        console.error("❌ Formspree erro:", resp.status, errText);
      }
    } catch (e) {
      alreadySent = false;
      status("Erro de rede ao enviar (veja Console).", 4500);
      console.error("❌ Erro de rede Formspree:", e);
    }
  }

  // -------------------------
  // Gatilho de envio: clique em botões “finais”
  // -------------------------
  function looksLikeFinalizeButton(btnText) {
    const t = norm(btnText).toLowerCase();
    return (
      t.includes("confirmar") ||
      t.includes("finalizar") ||
      t.includes("pagamento") ||
      t.includes("pagar") ||
      t.includes("concluir") ||
      t.includes("enviar") ||
      t.includes("reservar") ||
      t === "continuar"
    );
  }

  // Dispara no clique, mas tenta ser “tarde” o suficiente para já existir resumo/dados
  document.addEventListener(
    "click",
    (ev) => {
      const btn = ev.target && ev.target.closest ? ev.target.closest("button, a") : null;
      if (!btn) return;

      // Ignora links que não parecem ação de fluxo
      const txt = btn.tagName === "A" ? (btn.innerText || btn.textContent) : (btn.innerText || btn.textContent);
      if (!looksLikeFinalizeButton(txt)) return;

      // dá um pequeno delay para o DOM “assentar”
      setTimeout(() => {
        // só envia se houver algum sinal de que o usuário já avançou bastante:
        // (a) existe “Resumo” no DOM, ou (b) existem vários campos preenchidos
        const resumo = collectResumo();
        const fields = collectVisibleFormFields();
        const hasSignal = norm(resumo).includes("Resumo") || Object.keys(fields).length >= 3;

        if (!hasSignal) {
          // não envia cedo demais
          return;
        }
        sendFormspree();
      }, 250);
    },
    true
  );

  // Debug
  console.log("✅ Piutá Formspree texto-only carregado (v6).");
})();
