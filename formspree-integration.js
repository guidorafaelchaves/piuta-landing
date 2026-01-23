// Integração Formspree v12 - ENVIO DE DADOS (Resumo + Dados Pessoais)
// Sítio Piutá - Reservas
//
// Objetivo:
// - Enviar para o Formspree um payload completo com:
//   (a) RESUMO_TEXTO (Etapa 7 - resumo)
//   (b) DADOS_PESSOAIS_TEXTO + campos estruturados (Etapa 9 - seus dados)
// - Sem screenshots (mais robusto; evita erros do html2canvas/oklch)
// - Idempotência: evita múltiplos envios na mesma jornada
//
// Como funciona:
// - Na Etapa 7 (ao clicar "Continuar"), captura o texto do resumo visível na tela
// - Na Etapa 9 (ao clicar "Continuar para Pagamento"), captura inputs e envia tudo

(function () {
  const CFG = (window.PIUTA_CONFIG && window.PIUTA_CONFIG.formspree) ? window.PIUTA_CONFIG.formspree : {};
  const FORMSPREE_ENDPOINT = CFG.endpoint || 'https://formspree.io/f/xvzznrdn';

  let emailJaEnviado = false;
  let resumoEtapa7Texto = null;
  let dadosEtapa9Texto = null;
  let dadosEtapa9Obj = null;

  console.log('✅ Integração Formspree v12 carregada (dados: resumo + pessoais)');

  function norm(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function getRoot() {
    return document.getElementById('root') || document.body;
  }

  function snapshotTextoVisivel() {
    const root = getRoot();
    // innerText é melhor para "texto humano" do e-mail (respeita quebras)
    const txt = root ? (root.innerText || root.textContent || '') : '';
    return String(txt || '').trim();
  }

  function detectEtapaInfo() {
    // Busca "Etapa X de Y" no texto visível do root
    const txt = snapshotTextoVisivel();
    const m = txt.match(/Etapa\s+(\d+)\s+de\s+(\d+)/i);
    const stepNumber = m ? Number(m[1]) : null;
    const stepTotal = m ? Number(m[2]) : null;
    return { stepNumber, stepTotal, txt };
  }

  function coletarInputsEtapa() {
    const root = getRoot();
    const fields = Array.from(root.querySelectorAll('input, textarea, select'));

    const out = {};
    for (const el of fields) {
      if (!el) continue;

      const tag = (el.tagName || '').toLowerCase();
      const type = (el.getAttribute('type') || '').toLowerCase();

      // ignora campos não-dados
      if (tag === 'input' && ['button', 'submit', 'hidden', 'reset'].includes(type)) continue;

      let val = '';
      if (tag === 'select') {
        val = el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : el.value;
      } else if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
        val = el.checked ? 'sim' : 'não';
      } else {
        val = el.value;
      }

      val = norm(val);
      if (!val) continue;

      // tenta achar nome "humano"
      let label = '';
      const name = el.getAttribute('name') || '';
      const id = el.getAttribute('id') || '';
      const placeholder = el.getAttribute('placeholder') || '';

      if (id) {
        const lbl = root.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (lbl) label = norm(lbl.innerText || lbl.textContent || '');
      }

      if (!label) {
        // procura um label próximo
        const parent = el.closest('div, section, article, label') || el.parentElement;
        if (parent) {
          const maybe = parent.querySelector('label');
          if (maybe && maybe !== el) label = norm(maybe.innerText || maybe.textContent || '');
        }
      }

      const key = norm(label) || norm(name) || norm(placeholder) || `campo_${Object.keys(out).length + 1}`;
      out[key] = val;
    }

    return out;
  }

  function montarBlocoTexto(obj) {
    const keys = Object.keys(obj || {});
    if (!keys.length) return '';
    return keys.map(k => `- ${k}: ${obj[k]}`).join('\n');
  }

  function extrairCamposEstruturados(obj) {
    // tenta padronizar alguns campos comuns
    const lowerMap = {};
    for (const [k, v] of Object.entries(obj || {})) {
      lowerMap[String(k).toLowerCase()] = v;
    }

    function pick(...candidates) {
      for (const c of candidates) {
        const v = lowerMap[c];
        if (v) return v;
      }
      // tentativa parcial
      for (const [k, v] of Object.entries(lowerMap)) {
        if (candidates.some(c => k.includes(c))) return v;
      }
      return '';
    }

    return {
      NOME: pick('nome', 'name'),
      EMAIL: pick('e-mail', 'email', 'mail'),
      WHATSAPP: pick('whatsapp', 'telefone', 'celular', 'phone'),
      DOCUMENTO: pick('cpf', 'documento')
    };
  }

  async function enviarEmail() {
    if (emailJaEnviado) {
      console.log('⚠️ E-mail já foi enviado (ignorado)');
      return;
    }
    emailJaEnviado = true;

    try {
      const { stepNumber } = detectEtapaInfo();

      const resumo = resumoEtapa7Texto || '(Resumo não capturado)';
      const dadosTxt = dadosEtapa9Texto || '(Dados pessoais não capturados)';
      const dadosObj = dadosEtapa9Obj || {};

      const structured = extrairCamposEstruturados(dadosObj);
      const subjectParts = ['🌱 Nova Reserva - Sítio Piutá'];
      if (structured.NOME) subjectParts.push(structured.NOME);

      const formData = new FormData();
      formData.append('_subject', subjectParts.join(' — '));
      formData.append('Data_e_Hora', new Date().toLocaleString('pt-BR'));
      formData.append('URL', window.location.href);

      // Blocos principais (human-friendly)
      formData.append('RESUMO_TEXTO', resumo);
      formData.append('DADOS_PESSOAIS_TEXTO', dadosTxt);

      // Estruturados (máquina-friendly)
      if (structured.NOME) formData.append('NOME', structured.NOME);
      if (structured.EMAIL) formData.append('EMAIL', structured.EMAIL);
      if (structured.WHATSAPP) formData.append('WHATSAPP', structured.WHATSAPP);
      if (structured.DOCUMENTO) formData.append('DOCUMENTO', structured.DOCUMENTO);

      // JSON completo (útil para automação futura)
      try {
        formData.append('DADOS_PESSOAIS_JSON', JSON.stringify(dadosObj));
      } catch (_) {}

      formData.append('ETAPA_ENVIO', String(stepNumber || 'desconhecida'));

      console.log('📤 Enviando e-mail (Formspree) com resumo + dados pessoais...');

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        console.log('✅ E-mail enviado com sucesso!');
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao enviar:', response.status, errorText);
        emailJaEnviado = false; // libera retry
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      emailJaEnviado = false;
    }
  }

  // Gatilho por clique (antes da tela mudar)
  document.addEventListener('mousedown', async function (event) {
    const target = event.target;
    const button = target && target.closest ? target.closest('button') : null;
    if (!button) return;

    const btnText = norm(button.innerText || button.textContent || '');
    const info = detectEtapaInfo();
    const pageText = info.txt || '';

    // Etapa 7: captura o resumo ANTES de sair
    // Heurística: precisa conter "Resumo" e "Etapa 7 de"
    const isEtapa7 = /Etapa\s+7\s+de\s+/i.test(pageText) && /Resumo/i.test(pageText);
    if (isEtapa7 && /Continuar/i.test(btnText)) {
      resumoEtapa7Texto = snapshotTextoVisivel();
      console.log('🧾 Etapa 7: resumo capturado (tamanho):', resumoEtapa7Texto.length);
      return;
    }

    // Etapa 9: captura dados + envia
    const isEtapa9 = /Etapa\s+9\s+de\s+/i.test(pageText) && /Seus Dados/i.test(pageText);
    if (isEtapa9 && (/Continuar/i.test(btnText) || /Pagamento/i.test(btnText))) {
      const obj = coletarInputsEtapa();
      dadosEtapa9Obj = obj;
      dadosEtapa9Texto = montarBlocoTexto(obj) || snapshotTextoVisivel();
      console.log('👤 Etapa 9: dados capturados (campos):', Object.keys(obj).length);

      await enviarEmail();
      return;
    }
  }, true);
})();
