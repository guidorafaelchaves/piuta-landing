// Integração Formspree v5 - Captura da Tela de Resumo
// Sítio Piutá - Reservas

(function() {
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzznrdn';
  
  console.log('✅ Integração Formspree v5 carregada - Captura de resumo ativada');
  
  // Função para extrair dados da tela de resumo
  function extractResumoData() {
    const bodyText = document.body.innerText;
    
    // Extrai seções principais
    const data = {
      // Datas
      checkin: null,
      checkout: null,
      diarias: null,
      
      // Acomodações
      acomodacoes: [],
      total_acomodacao: null,
      
      // Alimentação
      alimentacao: [],
      
      // Transporte
      transporte: null,
      transporte_valor: null,
      
      // Atividades
      atividades: [],
      
      // Total
      total_experiencias: null,
      total_diarias_info: null,
      total_valor: null,
      total_pessoas: null
    };
    
    // Extrai datas (formato: terça-feira, 27 de janeiro de 2026)
    const datePattern = /([a-záéíóúâêôãõç\-]+,\s+\d+\s+de\s+[a-záéíóúâêôãõ]+\s+de\s+\d{4})/gi;
    const dates = bodyText.match(datePattern);
    if (dates && dates.length >= 2) {
      data.checkin = dates[0];
      data.checkout = dates[1];
    }
    
    // Extrai diárias
    const diariasMatch = bodyText.match(/(\d+)\s+diária/i);
    if (diariasMatch) {
      data.diarias = diariasMatch[1];
    }
    
    // Extrai acomodações (linhas entre "Acomodação" e "Total acomodação")
    const acomodacaoSection = bodyText.match(/🏠\s*Acomodação([\s\S]*?)Total acomodação:\s*R\$\s*(\d+)/i);
    if (acomodacaoSection) {
      const acomodacaoText = acomodacaoSection[1];
      data.total_acomodacao = acomodacaoSection[2];
      
      // Extrai cada linha de acomodação
      const acomodacaoLines = acomodacaoText.match(/([^\n]+)\s+R\$\s*(\d+)/g);
      if (acomodacaoLines) {
        data.acomodacoes = acomodacaoLines.map(line => line.trim());
      }
    }
    
    // Extrai alimentação
    const alimentacaoSection = bodyText.match(/🍽️\s*Alimentação([\s\S]*?)(?=🚗|$)/i);
    if (alimentacaoSection) {
      const alimentacaoText = alimentacaoSection[1];
      const alimentacaoLines = alimentacaoText.match(/([^\n]+)\s+(?:R\$\s*\d+|Grátis)/g);
      if (alimentacaoLines) {
        data.alimentacao = alimentacaoLines.map(line => line.trim());
      }
    }
    
    // Extrai transporte
    const transporteMatch = bodyText.match(/🚗\s*Transporte\s*([^\n]+)\s+R\$\s*(\d+)/i);
    if (transporteMatch) {
      data.transporte = transporteMatch[1].trim();
      data.transporte_valor = transporteMatch[2];
    } else {
      const transporteGratisMatch = bodyText.match(/🚗\s*Transporte\s*([^\n]+)/i);
      if (transporteGratisMatch) {
        data.transporte = transporteGratisMatch[1].trim();
        data.transporte_valor = '0';
      }
    }
    
    // Extrai atividades
    const atividadesSection = bodyText.match(/🌿\s*Atividades\s*\([\d\w\s]+\)([\s\S]*?)(?=Total|$)/i);
    if (atividadesSection) {
      const atividadesText = atividadesSection[1];
      const atividadesLines = atividadesText.match(/([^\n]+)\s+(?:R\$\s*\d+|Grátis)/g);
      if (atividadesLines) {
        data.atividades = atividadesLines.map(line => line.trim());
      }
    }
    
    // Extrai total
    const totalMatch = bodyText.match(/Total\s*(\d+h?\s+de\s+experiências?\s*•\s*\d+\s+diárias?)\s*R\$\s*(\d+)\s*para\s*(\d+)\s*pessoas?/i);
    if (totalMatch) {
      data.total_diarias_info = totalMatch[1];
      data.total_valor = totalMatch[2];
      data.total_pessoas = totalMatch[3];
    }
    
    return data;
  }
  
  // Função para enviar dados ao Formspree
  async function sendToFormspree(resumoData) {
    try {
      // Formata o e-mail
      const emailData = {
        _subject: '🌱 Nova Reserva - Sítio Piutá',
        
        // Datas
        'Check-in': resumoData.checkin || 'Não informado',
        'Check-out': resumoData.checkout || 'Não informado',
        'Número de Diárias': resumoData.diarias || 'Não informado',
        
        // Acomodações
        'Acomodações': resumoData.acomodacoes.length > 0 
          ? resumoData.acomodacoes.join(' | ') 
          : 'Não informado',
        'Total Acomodação': `R$ ${resumoData.total_acomodacao || '0'}`,
        
        // Alimentação
        'Alimentação': resumoData.alimentacao.length > 0 
          ? resumoData.alimentacao.join(' | ') 
          : 'Não informado',
        
        // Transporte
        'Transporte': resumoData.transporte || 'Não informado',
        'Valor Transporte': `R$ ${resumoData.transporte_valor || '0'}`,
        
        // Atividades
        'Atividades': resumoData.atividades.length > 0 
          ? resumoData.atividades.join(' | ') 
          : 'Não informado',
        
        // Total
        'Resumo': resumoData.total_diarias_info || 'Não informado',
        'Valor Total': `R$ ${resumoData.total_valor || '0'}`,
        'Número de Pessoas': resumoData.total_pessoas || 'Não informado',
        
        // Metadados
        'Data e Hora do Envio': new Date().toLocaleString('pt-BR'),
        'URL': window.location.href
      };
      
      console.log('📤 Enviando dados do resumo:', emailData);
      
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        console.log('✅ E-mail enviado com sucesso!');
        return true;
      } else {
        console.error('❌ Erro ao enviar:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      return false;
    }
  }
  
  // Monitora cliques no botão "Confirmar Reserva"
  document.addEventListener('click', async function(event) {
    const target = event.target;
    const buttonText = target.textContent || '';
    
    if (buttonText.includes('Confirmar Reserva')) {
      console.log('🔔 Botão "Confirmar Reserva" clicado!');
      console.log('📸 Capturando tela de resumo...');
      
      // Aguarda um pouco para garantir que a tela está completamente renderizada
      setTimeout(async () => {
        const resumoData = extractResumoData();
        console.log('📋 Dados extraídos:', resumoData);
        await sendToFormspree(resumoData);
      }, 300);
    }
  }, true);
  
})();
