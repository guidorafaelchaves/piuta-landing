// Configuração central do site (sem backend)
// Ajuste aqui dados operacionais do Sítio Piutá sem mexer no código de integração.
//
// Observação: este arquivo é carregado antes das integrações e expõe window.PIUTA_CONFIG.

(function () {
  window.PIUTA_CONFIG = Object.assign(
    {
      // ===============================
      // Pagamento / Contato
      // ===============================
      chavePix: 'sitiopiuta@gmail.com',
      whatsapp: '(81) 99159-0655',
      email: 'guidorafael@hotmail.com',

      // ===============================
      // Alimentação
      // ===============================
      taxaEntrega: 20,
      restaurantes: [
        { id: 'parceiro1', nome: 'Restaurante Parceiro 1', tipo: 'Comida Regional', cardapioUrl: null },
        { id: 'parceiro2', nome: 'Restaurante Parceiro 2', tipo: 'Variedades', cardapioUrl: null },
        { id: 'parceiro3', nome: 'Restaurante Parceiro 3', tipo: 'Lanches e Refeições', cardapioUrl: null }
      ],

      // ===============================
      // Calendário / Disponibilidade
      // ===============================
      calendar: {
        // ID do calendário usado para reservas
        calendarId: 'sitiopiuta@gmail.com',

        // API Key (conforme solicitado)
        apiKey: 'AIzaSyB2RbZhK3i2IlYnyefbkwgB6LjNJYYNj2k',

        // Capacidade máxima simultânea
        capacidadeMaxima: 12,

        // Horários padrão para evitar falso conflito
        // Check-in às 14h / Check-out às 12h
        checkInHora: 14,
        checkOutHora: 12,

        // Palavra-chave para bloqueio total de datas
        palavraBloqueio: 'BLOQUEIO'
      }
    },
    window.PIUTA_CONFIG || {}
  );
})();
