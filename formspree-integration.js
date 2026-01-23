// ===============================
// PIUTÁ – Formspree SIMPLE POST
// ===============================
(() => {
  const FORMSPREE_ID = "xvzznrdn"; // <-- seu id do formspree
  const ENDPOINT = `https://formspree.io/f/${FORMSPREE_ID}`;

  // 1) cria um form oculto e estável
  const form = document.createElement("form");
  form.method = "POST";
  form.action = ENDPOINT;
  form.style.display = "none";

  const inpSubject = mkInput("_subject");
  const inpReplyTo = mkInput("_replyto"); // opcional (só se email válido)
  const inpMsg = mkTextarea("mensagem");

  form.appendChild(inpSubject);
  form.appendChild(inpReplyTo);
  form.appendChild(inpMsg);

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(form);
    console.log("✅ Formspree SIMPLE carregado.");
  });

  function mkInput(name) {
    const i = document.createElement("input");
    i.type = "hidden";
    i.name = name;
    return i;
  }

  function mkTextarea(name) {
    const t = document.createElement("textarea");
    t.name = name;
    return t;
  }

  function norm(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }

  function isValidEmail(email) {
    const e = String(email || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  }

  // 2) CAPTURA SIMPLES (apenas 2 fontes):
  // - RESUMO: pega o texto do container do resumo (ajuste o seletor abaixo)
  // - DADOS PESSOAIS: pega inputs/textarea/select VISÍVEIS na etapa 9 (ajuste seletor abaixo)
  function getResumoText() {
    // AJUSTE 1: coloque aqui o seletor do “Resumo da Estadia”
    const resumoEl =
      document.querySelector("#resumo-estadia") ||
      document.querySelector(".resumo-estadia") ||
      document.querySelector("[data-resumo]");

    if (resumoEl) return norm(resumoEl.innerText);

    // fallback: tenta achar um bloco que contenha "Resumo" e "Total"
    const blocks = Array.from(document.querySelectorAll("section, div, article"))
      .map((el) => ({ el, t: norm(el.innerText) }))
      .filter((x) => x.t.includes("Resumo") && (x.t.includes("Total") || x.t.includes("Check-in")))
      .sort((a, b) => a.t.length - b.t.length);

    return blocks[0]?.t || "";
  }

  function getDadosPessoais() {
    // AJUSTE 2: seletor do container da etapa 9 (onde estão os campos pessoais)
    const etapa9 =
      document.querySelector("#etapa-9") ||
      document.querySelector('[data-etapa="9"]') ||
      document.querySelector(".etapa9");

    const root = etapa9 || document;

    const fields = Array.from(root.querySelectorAll("input, textarea, select"))
      .filter((el) => el.offsetParent !== null && !el.disabled);

    const data = {};
    for (const el of fields) {
      const type = (el.type || "").toLowerCase();
      if (type === "hidden" || type === "button" || type === "submit") continue;

      const value = norm(el.value);
      if (!value) continue;

      const label =
        norm(el.getAttribute("aria-label")) ||
        norm(el.placeholder) ||
        norm(el.name) ||
        norm(el.id) ||
        "campo";

      // evita duplicatas
      if (!data[label]) data[label] = value;
    }
    return data;
  }

  function inferEmail(dados) {
    for (const [k, v] of Object.entries(dados || {})) {
      if (/e-?mail/i.test(k) && isValidEmail(v)) return v;
    }
    return "";
  }

  function buildMessage() {
    const resumo = getResumoText();
    const dados = getDadosPessoais();

    const lines = [];
    lines.push("RESUMO DA RESERVA");
    lines.push("----------------------------------------");
    lines.push(resumo || "(não encontrado)");
    lines.push("");
    lines.push("DADOS DO RESPONSÁVEL");
    lines.push("----------------------------------------");

    const entries = Object.entries(dados);
    if (!entries.length) {
      lines.push("(nenhum campo capturado)");
    } else {
      for (const [k, v] of entries) lines.push(`${k}: ${v}`);
    }

    lines.push("");
    lines.push("META");
    lines.push("----------------------------------------");
    lines.push(`URL: ${window.location.href}`);
    lines.push(`Data/Hora: ${new Date().toLocaleString("pt-BR")}`);

    return lines.join("\n");
  }

  // 3) gatilho: clique em botões finais (simples)
  function isFinalButtonText(txt) {
    const t = norm(txt).toLowerCase();
    return (
      t.includes("confirmar") ||
      t.includes("finalizar") ||
      t.includes("pagar") ||
      t.includes("pagamento") ||
      t.includes("concluir")
    );
  }

  document.addEventListener(
    "click",
    (ev) => {
      const btn = ev.target?.closest?.("button, a");
      if (!btn) return;

      const txt = btn.innerText || btn.textContent || "";
      if (!isFinalButtonText(txt)) return;

      // monta e envia
      const dados = getDadosPessoais();
      const email = inferEmail(dados);

      inpSubject.value = "🌱 Nova Reserva – Sítio Piutá";
      inpMsg.value = buildMessage();

      // só seta replyto se válido (senão deixa vazio)
      inpReplyTo.value = isValidEmail(email) ? email : "";

      console.log("📩 Enviando via FORM POST (SIMPLE)...");
      form.submit();
    },
    true
  );
})();
