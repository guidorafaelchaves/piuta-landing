// Integração Formspree v11 - SCREENSHOT das telas
// Sítio Piutá - Reservas
// 
// Usa html2canvas para tirar PRINT das etapas 7 e 9
// Envia as imagens como anexo via Formspree

(function() {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzznrdn';
  
  // Carrega html2canvas dinamicamente
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  script.onload = function() {
    console.log('✅ html2canvas carregado!');
  };
  document.head.appendChild(script);
  
  // Armazena os screenshots
  let screenshotEtapa7 = null; // Blob da imagem
  let screenshotEtapa9 = null; // Blob da imagem
  let emailJaEnviado = false;
  
  console.log('✅ Integração Formspree v11 carregada - SCREENSHOT das telas');
  
  // Função para capturar screenshot
  async function capturarScreenshot() {
    if (typeof html2canvas === 'undefined') {
      console.error('❌ html2canvas não carregado ainda');
      return null;
    }
    
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false
      });
      
      // Converte canvas para Blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 0.9);
      });
    } catch (error) {
      console.error('❌ Erro ao capturar screenshot:', error);
      return null;
    }
  }
  
  // Função para enviar e-mail com screenshots
  async function enviarEmailComScreenshots() {
    if (emailJaEnviado) {
      console.log('⚠️ E-mail já foi enviado');
      return;
    }
    
    emailJaEnviado = true;
    
    try {
      // Cria FormData para enviar arquivos
      const formData = new FormData();
      
      // Adiciona campos de texto
      formData.append('_subject', '🌱 Nova Reserva - Sítio Piutá (com Screenshots)');
      formData.append('Data_e_Hora', new Date().toLocaleString('pt-BR'));
      formData.append('URL', window.location.href);
      
      // Adiciona screenshot da etapa 7 (se existir)
      if (screenshotEtapa7) {
        formData.append('Screenshot_Etapa_7_Resumo', screenshotEtapa7, 'etapa7-resumo.png');
        console.log('📎 Screenshot Etapa 7 anexado');
      } else {
        formData.append('Etapa_7', 'Screenshot não capturado');
      }
      
      // Adiciona screenshot da etapa 9 (se existir)
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
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ E-mail com screenshots enviado com sucesso!');
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao enviar:', response.status, errorText);
        emailJaEnviado = false;
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      emailJaEnviado = false;
    }
  }
  
  // Monitora cliques em botões (PATCH: etapa visível)
  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const inViewport = rect.bottom >= 0 && rect.right >= 0 && rect.top <= (window.innerHeight || 0) && rect.left <= (window.innerWidth || 0);
    return inViewport;
  }

  function getCurrentStepNumber() {
    const candidates = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);
    let node;
    while ((node = walker.nextNode())) {
      const el = node;
      if (!isVisible(el)) continue;
      const txt = (el.innerText || '').trim();
      if (!txt) continue;
      if (/Etapa\s+\d+\s+de\s+10/i.test(txt)) candidates.push(el);
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (rb.width * rb.height) - (ra.width * ra.height);
    });
    const m = (candidates[0].innerText || '').match(/Etapa\s+(\d+)\s+de\s+10/i);
    return m ? parseInt(m[1], 10) : null;
  }

  document.addEventListener('mousedown', async function(event) {
    const target = event.target;
    const button = target && target.closest ? target.closest('button') : null;
    if (!button) return;

    const buttonText = (button.textContent || '').trim();
    const stepNumber = getCurrentStepNumber();

    console.log('🖱️ Botão clicado:', buttonText, '| etapa visível:', stepNumber);

    // ============================================================
    // ETAPA 7 (visível): captura screenshot antes de sair do resumo
    // ============================================================
    if (stepNumber === 7 && buttonText.includes('Confirmar Reserva')) {
      console.log('🔔 === ETAPA 7 (visível): Capturando SCREENSHOT ===');
      screenshotEtapa7 = await capturarScreenshot();
      if (screenshotEtapa7) {
        console.log('📸 Screenshot Etapa 7 capturado! Tamanho:', screenshotEtapa7.size, 'bytes');
      } else {
        console.error('❌ Falha ao capturar screenshot da Etapa 7');
      }
    }

    // ============================================================
    // ETAPA 9 (visível): captura screenshot e envia e-mail
    // ============================================================
    if (stepNumber === 9 && buttonText.includes('Continuar para Pagamento')) {
      console.log('🔔 === ETAPA 9 (visível): Capturando SCREENSHOT ===');
      screenshotEtapa9 = await capturarScreenshot();
      if (screenshotEtapa9) {
        console.log('📸 Screenshot Etapa 9 capturado! Tamanho:', screenshotEtapa9.size, 'bytes');
      } else {
        console.error('❌ Falha ao capturar screenshot da Etapa 9');
      }

      console.log('📤 Enviando e-mail com screenshots...');
      await enviarEmailComScreenshots();
    }

  }, true);


})();
