// Integração Google Calendar - Sítio Piutá (Disponibilidade + Capacidade)
// Sem backend, via Calendar API events.list, seguindo o mesmo padrão das integrações atuais.

(function () {
  console.log('✅ Integração Calendar (disponibilidade/capacidade) carregada');

  const CFG = (window.PIUTA_CONFIG && window.PIUTA_CONFIG.calendar) ? window.PIUTA_CONFIG.calendar : null;

  if (!CFG || !CFG.calendarId || !CFG.apiKey) {
    console.warn('⚠️ Calendar: CFG incompleto. Verifique window.PIUTA_CONFIG.calendar (calendarId/apiKey).');
    return;
  }

  const CALENDAR_ID = String(CFG.calendarId);
  const API_KEY = String(CFG.apiKey);
  const CAP_MAX = Number(CFG.capacidadeMaxima || 12);
  const CHECKIN_H = Number.isFinite(Number(CFG.checkInHora)) ? Number(CFG.checkInHora) : 14;
  const CHECKOUT_H = Number.isFinite(Number(CFG.checkOutHora)) ? Number(CFG.checkOutHora) : 12;
  const BLOQUEIO = String(CFG.palavraBloqueio || 'BLOQUEIO').toUpperCase();

  function normalizarTexto(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function toRFC3339(date) {
    return date.toISOString();
  }

  function setHora(d, hora) {
    const x = new Date(d.getTime());
    x.setHours(hora, 0, 0, 0);
    return x;
  }

  // ========= Extração de datas do DOM (heurística) =========
  // Como o app principal está em assets/index.js (SPA), aqui tentamos extrair pelas formas mais comuns.
  function parseDateBR(text) {
    // dd/mm/aaaa
    const m = String(text || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!m) return null;
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    const d = new Date(yyyy, mm - 1, dd);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  function parseDateISO(value) {
    // yyyy-mm-dd (input type=date)
    const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const yyyy = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    const d = new Date(yyyy, mm - 1, dd);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  function tentarExtrairDatas() {
    // 1) inputs type="date"
    const dateInputs = Array.from(document.querySelectorAll('input[type="date"]'));
    const values = dateInputs.map(i => parseDateISO(i.value)).filter(Boolean);

    if (values.length >= 2) {
      // Assume: [checkin, checkout]
      return { checkIn: values[0], checkOut: values[1], fonte: 'input[type=date]' };
    }

    // 2) procurar no texto da página (dd/mm/aaaa)
    const bodyText = normalizarTexto(document.body && document.body.innerText);
    const matches = bodyText.match(/\d{2}\/\d{2}\/\d{4}/g) || [];
    if (matches.length >= 2) {
      const d1 = parseDateBR(matches[0]);
      const d2 = parseDateBR(matches[1]);
      if (d1 && d2) return { checkIn: d1, checkOut: d2, fonte: 'innerText dd/mm/aaaa' };
    }

    return null;
  }

  function tentarExtrairHospedes() {
    // Heurística: procurar “Hóspedes” e um número próximo
    const bodyText = normalizarTexto(document.body && document.body.innerText);

    // padrões comuns: "Hóspedes 4", "Hóspedes: 4", "Número de hóspedes: 4"
    const m = bodyText.match(/h[oó]spedes?\s*[:\-]?\s*(\d{1,2})/i);
    if (m) return Number(m[1]);

    // fallback: procurar “pessoas”
    const m2 = bodyText.match(/(\d{1,2})\s*pessoas?/i);
    if (m2) return Number(m2[1]);

    // se não achar, assume 1 (para não bloquear erroneamente por NaN)
    return 1;
  }

  // ========= Leitura de hóspedes por evento =========
  function parseHospedesDoEvento(ev) {
    const d = ev.description || '';
    const m = String(d).match(/HOSPEDES\s*=\s*(\d{1,2})/i);
    if (m) return Number(m[1]);

    // fallback: tentar no título “Reserva – 3 hóspedes”
    const s = ev.summary || '';
    const m2 = String(s).match(/(\d{1,2})\s*h[oó]sp/i);
    if (m2) return Number(m2[1]);

    return 0;
  }

  function isBloqueioTotal(ev) {
    const s = String(ev.summary || '').toUpperCase();
    const d = String(ev.description || '').toUpperCase();
    return s.includes(BLOQUEIO) || d.includes(BLOQUEIO);
  }

  async function getOverlappingEvents(timeMin, timeMax) {
    const params = new URLSearchParams({
      key: API_KEY,
      timeMin: toRFC3339(timeMin),
      timeMax: toRFC3339(timeMax),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250'
    });

    const url =
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?` +
      params.toString();

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Calendar API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.items || [];
  }

  async function checkBooking(checkInDate, checkOutDate, hospedesSolicitados) {
    if (!(checkOutDate > checkInDate)) {
      return { ok: false, motivo: 'Intervalo inválido (checkout deve ser após checkin).' };
    }

    // Normaliza horários: checkin 14:00 e checkout 12:00 (ajustável)
    const checkIn = setHora(checkInDate, CHECKIN_H);
    const checkOut = setHora(checkOutDate, CHECKOUT_H);

    const events = await getOverlappingEvents(checkIn, checkOut);

    if (events.some(isBloqueioTotal)) {
      return { ok: false, motivo: 'Datas bloqueadas para reserva.' };
    }

    const reservados = events.reduce((sum, ev) => sum + parseHospedesDoEvento(ev), 0);
    const total = reservados + hospedesSolicitados;

    if (total > CAP_MAX) {
      return {
        ok: false,
        motivo: `Capacidade excedida: já existem ${reservados} hóspedes nesse período. Máximo ${CAP_MAX}.`
      };
    }

    return { ok: true, motivo: `OK. Reservados: ${reservados}. Após incluir: ${total}/${CAP_MAX}.` };
  }

  // ========= Interceptação do fluxo =========
  // Estratégia: interceptar cliques em botões “Continuar/Avançar/Próximo”
  // e, se estivermos na etapa de datas, validar antes de prosseguir.
  function pareceEtapaDatas() {
    const t = normalizarTexto(document.body && document.body.innerText);
    // heurísticas amplas: ajuste depois com logs reais do seu app
    return (
      t.includes('Etapa') &&
      (t.toLowerCase().includes('datas') || t.toLowerCase().includes('check-in') || t.toLowerCase().includes('check out') || t.toLowerCase().includes('check-out'))
    );
  }

  function pareceBotaoDeAvanco(buttonText) {
    const b = String(buttonText || '').toLowerCase();
    return (
      b.includes('continuar') ||
      b.includes('avançar') ||
      b.includes('proximo') ||
      b.includes('próximo') ||
      b.includes('seguir')
    );
  }

  let emVerificacao = false;

  document.addEventListener(
    'click',
    async function (event) {
      const target = event.target;
      const button = target && target.closest ? target.closest('button') : null;
      if (!button) return;

      const buttonText = normalizarTexto(button.textContent);
      if (!buttonText) return;

      if (!pareceBotaoDeAvanco(buttonText)) return;
      if (!pareceEtapaDatas()) return;
      if (emVerificacao) return;

      const extra = tentarExtrairDatas();
      if (!extra) {
        console.warn('⚠️ Calendar: não consegui extrair datas nessa tela. Clique liberado.');
        return;
      }

      const hospedes = tentarExtrairHospedes();
      console.log('🗓️ Calendar: datas extraídas via', extra.fonte, extra.checkIn, extra.checkOut, '| hóspedes:', hospedes);

      emVerificacao = true;

      // Bloqueia avanço enquanto verifica
      event.preventDefault();
      event.stopPropagation();

      try {
        const r = await checkBooking(extra.checkIn, extra.checkOut, hospedes);

        if (!r.ok) {
          alert(`Não disponível: ${r.motivo}`);
          return;
        }

        // Libera o clique original: simula clique novamente após validação
        console.log('✅ Calendar:', r.motivo);
        setTimeout(() => {
          emVerificacao = false;
          button.click();
        }, 50);
      } catch (e) {
        console.error('❌ Calendar: erro na verificação:', e);
        alert('Não foi possível verificar disponibilidade agora. Tente novamente.');
      } finally {
        // se não tiver simulado clique, libera para novos cliques
        setTimeout(() => { emVerificacao = false; }, 400);
      }
    },
    true
  );
})();
