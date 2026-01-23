
function gerarTextoResponsavel() {
  return `🧑 RESPONSÁVEL PELA RESERVA

Nome: ${document.getElementById('resp_nome').value || '-'}
E-mail: ${document.getElementById('resp_email').value || '-'}
Telefone: ${document.getElementById('resp_telefone').value || '-'}
Cidade: ${document.getElementById('resp_cidade').value || '-'}

Condições do grupo:
${document.getElementById('resp_condicoes').value || 'Nenhuma informada'}

Observações gerais:
${document.getElementById('resp_obs').value || 'Nenhuma'}
`;
}

function enviarReservaFormspree() {
  const payload = {
    dados_responsavel: gerarTextoResponsavel()
  };

  fetch("https://formspree.io/f/SEU_ID_AQUI", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(() => alert("Reserva enviada com sucesso"))
  .catch(() => alert("Erro ao enviar reserva"));
}
