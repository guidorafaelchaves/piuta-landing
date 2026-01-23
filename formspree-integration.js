// Integração Formspree v11.1 - SCREENSHOT das telas
// Sítio Piutá - Reservas
//
// Melhorias:
// - Espera explícita do carregamento do html2canvas (evita corrida)
// - Captura com 'requestAnimationFrame' para garantir render estável
// - Evita múltiplos envios (idempotência com flag)

(function () {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzznrdn';

  // Permite desativar screenshots via config (evita erros de compatibilidade do html2canvas)
  const ENABLE_SCREENSHOTS = !!(window.PIUTA_CONFIG && window.PIUTA_CONFIG.formspree ? (window.PIUTA_CONFIG.formspree.enableScreenshots !== false) : true);

  // Carrega html2canvas dinamicamente e expõe uma Promise de prontidão
  let html2canvasReadyResolve;
  const html2canvasReady = new Promise((resolve) => (html2canvasReadyResolve = resolve));

  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  script.onload = function () {
    console.log('✅ html2canvas carregado!');
    html2canvasReadyResolve(true);
  };
  script.onerror = function () {
    console.error('❌ Falha ao carregar html2canvas');
    html2canvasReadyResolve(false);
  };
  document.head.appendChild(script);

  // Armazena os screenshots
  let screenshotEtapa7 = null; // Blob da imagem
  let screenshotEtapa9 = null; // Blob da imagem
  let emailJaEnviado = false;

  console.log('✅ Integração Formspree v11.1 carregada - SCREENSHOT das telas');

  function normalizarTexto(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  // Função para capturar screenshot
  async function capturarScreenshot() {
    const ok = await html2canvasReady;
    if (!ok || typeof html2canvas === 'undefined') {
      console.error('❌ html2canvas não disponível');
      return null;
    }

    try {
      // Espera o próximo frame para minimizar "prints" no meio de transição
      await new Promise((r) => requestAnimationFrame(() => r()));

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false
      });

      return await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 0.9);
      });
    } catch (error) {
      const msg = (error && (error.message || String(error))) || '';
      // html2canvas pode falhar em CSS moderno (ex.: cores em oklch). Não interrompe o fluxo.
      if (String(msg).toLowerCase().includes('oklch')) {
        console.warn('⚠️ Screenshot ignorado (html2canvas não suporta OKLCH neste navegador/tema).');
      } else {
        console.warn('⚠️ Falha ao capturar screenshot (ignorado):', error);
      }
      return null;
    }
  }

  async function enviarEmailComScreenshots() {
    if (emailJaEnviado) {
      console.log('⚠️ E-mail já foi enviado (ignorado)');
      return;
    }
    emailJaEnviado = true;

    try {
      const formData = new FormData();
      formData.append('_subject', '🌱 Nova Reserva - Sítio Piutá (com Screenshots)');
      formData.append('Data_e_Hora', new Date().toLocaleString('pt-BR'));
      formData.append('URL', window.location.href);

      if (screenshotEtapa7) {
        formData.append('Screenshot_Etapa_7_Resumo', screenshotEtapa7, 'etapa7-resumo.png');
        console.log('📎 Screenshot Etapa 7 anexado');
      } else {
        formData.append('Etapa_7', 'Screenshot não capturado');
      }

      if (screenshotEtapa9) {
        formData.append('Screenshot_Etapa_9_Dados', screenshotEtapa9, 'etapa9-dados.png');
        console.log('📎 Screenshot Etapa 9 anexado');
      } else {
        formData.append('Etapa_9', 'Screenshot não capturado');
      }

      console.log('📤 Enviando e-mail com screenshots...');

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        console.log('✅ E-mail com screenshots enviado com sucesso!');
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

  // Monitora cliques em botões (captura antes do app mudar de tela)
  document.addEventListener(
    'mousedown',
    async function (event) {
      const target = event.target;
      const button = target && target.closest ? target.closest('button') : null;
      if (!button) return;

      const buttonText = normalizarTexto(button.textContent);
      const pageText = normalizarTexto(document.body && document.body.innerText);

      // ============================================================
      // ETAPA 7: "Resumo" + "Etapa 7 de 10" + "Confirmar Reserva"
      // ============================================================
      const isEtapa7 = pageText.includes('Resumo') && pageText.includes('Etapa 7 de 10');
      if (isEtapa7 && buttonText.includes('Confirmar Reserva')) {
        console.log('🔔 === ETAPA 7: Capturando SCREENSHOT ===');
        screenshotEtapa7 = await capturarScreenshot();
        if (screenshotEtapa7) {
          console.log('📸 Screenshot Etapa 7 capturado! Tamanho:', screenshotEtapa7.size, 'bytes');
        } else {
          console.error('❌ Falha ao capturar screenshot da Etapa 7');
        }
      }

      // ============================================================
      // ETAPA 9: "Seus Dados" + "Etapa 9 de 10" + "Continuar para Pagamento"
      // ============================================================
      const isEtapa9 = pageText.includes('Seus Dados') && pageText.includes('Etapa 9 de 10');
      if (isEtapa9 && buttonText.includes('Continuar para Pagamento')) {
        console.log('🔔 === ETAPA 9: Capturando SCREENSHOT ===');
        screenshotEtapa9 = await capturarScreenshot();
        if (screenshotEtapa9) {
          console.log('📸 Screenshot Etapa 9 capturado! Tamanho:', screenshotEtapa9.size, 'bytes');
        } else {
          console.error('❌ Falha ao capturar screenshot da Etapa 9');
        }

        console.log('📤 Enviando e-mail com screenshots...');
        await enviarEmailComScreenshots();
      }
    },
    true
  );
})();