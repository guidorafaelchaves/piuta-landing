
/**
 * Formspree Integration – Versão Robust V6
 * Captura dados reais da Etapa 9 (inputs visíveis)
 */

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xzzrdrnq";

function capturarDadosPessoais() {
  const dados = {};
  const campos = document.querySelectorAll("input, textarea, select");

  campos.forEach(el => {
    if (
      el.offsetParent !== null &&
      !el.disabled &&
      el.value &&
      el.type !== "hidden" &&
      el.type !== "button" &&
      el.type !== "submit"
    ) {
      let label = el.closest("label");
      let nomeCampo = label
        ? label.innerText.replace("*", "").trim()
        : el.name || el.id || "Campo";

      dados[nomeCampo] = el.value.trim();
    }
  });

  return dados;
}

function formatarDadosTexto(dados) {
  let texto = "🧑 DADOS DO HÓSPEDE\n\n";
  Object.entries(dados).forEach(([k, v]) => {
    texto += `${k}: ${v}\n`;
  });
  return texto;
}

async function enviarParaFormspree(resumoTexto) {
  const dadosPessoais = capturarDadosPessoais();
  const dadosTexto = formatarDadosTexto(dadosPessoais);

  const payload = {
    resumo_reserva: resumoTexto,
    dados_hospede: dadosTexto
  };

  console.log("📨 Enviando para Formspree:", payload);

  const response = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    console.error("❌ Erro Formspree", await response.text());
  } else {
    console.log("✅ Formspree enviado com sucesso");
  }
}

window.FormspreePiuta = {
  enviar: enviarParaFormspree
};
