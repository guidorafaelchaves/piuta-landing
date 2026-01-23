// === ETAPA 9 - INJEÇÃO SEGURA ===

function getEtapaAtiva() {
  return document.querySelector('.etapa.ativa')
      || document.querySelector('.step.active')
      || document.querySelector('[data-step].active');
}

function renderEtapa9() {
  const wrapper = document.createElement('div');
  wrapper.className = 'etapa-conteudo etapa-9';

  wrapper.innerHTML = `
    <h2>Dados do responsável pela reserva</h2>
    <p>Essas informações são usadas apenas para confirmação e contato.</p>

    <input name="nome" placeholder="Nome completo">
    <input name="email" placeholder="E-mail">
    <input name="telefone" placeholder="WhatsApp / Telefone">
    <input name="cidade" placeholder="Cidade / Estado">

    <textarea name="necessidades" placeholder="Há crianças, idosos ou necessidades especiais?"></textarea>
    <textarea name="observacoes" placeholder="Observações gerais (opcional)"></textarea>

    <button id="confirmar-reserva">Confirmar reserva</button>
  `;

  wrapper.querySelector('#confirmar-reserva').onclick = enviarReserva;
  return wrapper;
}

function mostrarEtapa9() {
  const etapa = getEtapaAtiva();
  if (!etapa) {
    console.error('Nenhuma etapa ativa encontrada');
    return;
  }
  etapa.innerHTML = '';
  etapa.appendChild(renderEtapa9());
}

function gerarTextoReserva() {
  const v = n => document.querySelector(`[name="${n}"]`)?.value || '';
  return `
RESPONSÁVEL PELA RESERVA
-----------------------
Nome: ${v('nome')}
E-mail: ${v('email')}
Telefone: ${v('telefone')}
Cidade/Estado: ${v('cidade')}

Necessidades:
${v('necessidades')}

Observações:
${v('observacoes')}
`;
}

function enviarReserva() {
  fetch('https://formspree.io/f/SEU_ID_AQUI', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      resumo_reserva: gerarTextoReserva()
    })
  })
  .then(() => alert('Reserva enviada com sucesso!'))
  .catch(() => alert('Erro ao enviar reserva'));
}

// chamar mostrarEtapa9() quando o fluxo chegar na etapa 9
