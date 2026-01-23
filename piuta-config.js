// Configuração central do site (sem backend)
// Ajuste aqui dados operacionais do Sítio Piutá sem mexer no código de integração.
//
// Observação: este arquivo é carregado antes das integrações e expõe window.PIUTA_CONFIG.

(function () {
  window.PIUTA_CONFIG = Object.assign(
    {
      // Pagamento / contato
      chavePix: 'sitiopiuta@gmail.com',
      whatsapp: '(81) 99159-0655',
      email: 'guidorafael@hotmail.com',

      // Alimentação
      taxaEntrega: 20,
      restaurantes: [
        { id: 'parceiro1', nome: 'Restaurante Parceiro 1', tipo: 'Comida Regional', cardapioUrl: null },
        { id: 'parceiro2', nome: 'Restaurante Parceiro 2', tipo: 'Variedades', cardapioUrl: null },
        { id: 'parceiro3', nome: 'Restaurante Parceiro 3', tipo: 'Lanches e Refeições', cardapioUrl: null }
      ],

      // ====== Calendário / Disponibilidade ======
      // Recomendações:
      // 1) Use um calendário dedicado “Piutá – Reservas” e publique-o (somente leitura).
      // 2) Cada reserva deve registrar o número de hóspedes na descrição: HOSPEDES=3
      calendar: {
        calendarId: 'sitiopiuta@gmail.com',

        // ATENÇÃO: use uma API KEY NOVA e restrita por domínio + somente Calendar API
        apiKey: 'COLOQUE_AQUI_SUA_API_KEY_RESTRITA',

        // Capacidade máxima simultânea:
        capacidadeMaxima: 12,

        // Horários padrão para checagem (reduz falso conflito em “troca no mesmo dia”)
        // Ex.: checkout 12:00 e checkin 14:00
        checkInHora: 14,
        checkOutHora: 12,

        // Se você usar eventos “BLOQUEIO” para fechar datas:
        palavraBloqueio: 'BLOQUEIO'
      }
    },
    window.PIUTA_CONFIG || {}
  );
})();
