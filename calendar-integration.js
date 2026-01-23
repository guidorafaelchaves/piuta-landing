// Integração Google Calendar - Sítio Piutá (Disponibilidade + Capacidade)
// Versão otimizada: evita múltiplas verificações, usa cache e mostra status visual no site.

(function () {
  const CFG = (window.PIUTA_CONFIG && window.PIUTA_CONFIG.calendar) ? window.PIUTA_CONFIG.calendar : null;

  // UI status (toast)
  const UI = (() => {
    const el = document.createElement('div');
    el.id = 'piuta-calendar-status';
    el.style.cssText = `
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 999999;
      max-width: 340px;
      padding: 10px 12px;
      border-radius: 12px;
      font: 13px/1.3 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      box-shadow: 0 8px 24px rgba(0,0,0,.18);
      background: rgba(20,20,20,.92);
      color: #fff;
      display: none;
      align-items: center;
      gap: 10px;
      backdrop-filter: blur(6px);
    `;

    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 10px; height: 10px; border-radius: 999px;
      background: #999; flex: 0 0 auto;
    `;

    const txt = document.createElement('div');
    txt.style.cssText = `flex: 1 1 auto;`;

    el.appendChild(dot);
    el.appendChild(txt);
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(el));

    let hideTimer = null;

    function show(message, state) {
      // state: "loading" | "ok" | "warn" | "error"
      if (hideTimer) clearTimeout(hideTimer);

      el.style.display = 'flex';
      txt.textContent = message;

      if (state === 'loading') dot.style.background = '#f0c54a';
      else if (state === 'ok') dot.style.background = '#5cd38d';
      else if (state === 'warn') dot.style.background = '#ffb020';
      else dot.style.background = '#ff5b5b';
    }

    function autoHide(ms = 1800) {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => (el.style.display = 'none'), ms);
    }

    function hide() {
      if (hideTimer) clearTimeout(hideTimer);
      el.style.display = 'none';
    }

    return { show, autoHide, hide };
  })();

  if (!CFG || !CFG.calendarId || !CFG.apiKey) {
    console.warn('⚠️ Calendar: CFG incompleto. Verifique window.PIUTA_CONFIG.calendar (calendarId/apikey).');
    return;
  }

  const CALENDAR_ID = String(CFG.calendarId);
  const API_KEY = String(CFG.apiKey);
  const CAP_MAX = Number(CFG.capacidadeMaxima || 12);
  const CHECKIN_H = Number.isFinite(Number(CFG.checkInHora)) ? Number(CFG.checkInHora) : 14;
  const CHECKOUT_H = Number.isFinite(Number(CFG.checkOutHora)) ? Number(CFG.checkOutHora) : 12;
  const BLOQUEIO = String(CFG.palavraBloqueio || 'BLOQUEIO').toUpperCase();

  // Cache curto para evitar chamadas repetidas
  const cache = new Map(); // key -> { t, result }
  const CACHE_TTL_MS = 8000;

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

  function parseDateBR(text) {
    const m = String(text || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!m) return null;
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    const d = new Date(yyyy, mm - 1, dd);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  function parseDateISO(value) {
    const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const yyyy = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    const d = new Date(yyyy, mm - 1, dd);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  function tentarExtrairDatas() {
    // 1) inputs type date
    const dateInputs = Array.from(document.querySelectorAll('input[type="date"]'));
    const values = dateInputs.map(i => parseDateISO(i.value)).filter(Boolean);
    if (values.length >= 2) return { checkIn: values[0], checkOut: values[1], fonte: 'input[type=date]' };

    // 2) texto da página dd/mm/aaaa
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
    // tenta inputs numéricos
    const n = Array.from(document.querySelectorAll('input[type="number"]'))
      .map(i => Number(i.value))
      .find(v => Number.isFinite(v) && v > 0 && v <= 99);
    if (Number.isFinite(n)) return n;

    const bodyText = normalizarTexto(document.body && document.body.innerText);
    const m = bodyText.match(/h[oó]spedes?\s*[:\-]?\s*(\d{1,2})/i);
    if (m) return Number(m[1]);
    const m2 = bodyText.match(/(\d{1,2})\s*pessoas?/i);
    if (m2) return Number(m2[1]);

    return 1;
  }

  function parseHospedesDoEvento(ev) {
    const d = ev.description || '';
    const m = String(d).match(/HOSPEDES\s*=\s*(\d{1,2})/i);
    if (m) return Number(m[1]);

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

    const checkIn = setHora(checkInDate, CHECKIN_H);
    const checkOut = setHora(checkOutDate, CHECKOUT_H);

    const cacheKey = `${checkIn.toISOString()}|${checkOut.toISOString()}|${hospedesSolicitados}`;
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.t) < CACHE_TTL_MS) {
      return cached.result;
    }

    const events = await getOverlappingEvents(checkIn, checkOut);

    if (events.some(isBloqueioTotal)) {
      const result = { ok: false, motivo: 'Datas bloqueadas para reserva.' };
      cache.set(cacheKey, { t: Date.now(), result });
      return result;
    }

    const reservados = events.reduce((sum, ev) => sum + parseHospedesDoEvento(ev), 0);
    const total = reservados + hospedesSolicitados;

    if (total > CAP_MAX) {
      const result = {
        ok: false,
        motivo: `Capacidade excedida: já existem ${reservados} hóspedes nesse período. Máximo ${CAP_MAX}.`
      };
      cache.set(cacheKey, { t: Date.now(), result });
      return result;
    }

    const result = { ok: true, motivo: `Disponível. Reservados: ${reservados}. Após incluir: ${total}/${CAP_MAX}.` };
    cache.set(cacheKey, { t: Date.now(), result });
    return result;
  }

  function pareceEtapaDatas() {
    const t = normalizarTexto(document.body && document.body.innerText).toLowerCase();
    return t.includes('etapa') && (t.includes('datas') || t.includes('diárias') || t.includes('check-in') || t.includes('check in'));
  }

  function pareceBotaoDeAvanco(text) {
    const b = String(text || '').toLowerCase();
    return b.includes('continuar') || b.includes('avançar') || b.includes('proximo') || b.includes('próximo') || b.includes('seguir');
  }

  let emVerificacao = false;

  document.addEventListener('click', async (event) => {
    const target = event.target;
    const button = target && target.closest ? target.closest('button') : null;
    if (!button) return;

    // Bypass anti-loop
    if (button.dataset.piutaBypass === '1') {
      delete button.dataset.piutaBypass;
      return;
    }

    const buttonText = normalizarTexto(button.textContent);
    if (!buttonText || !pareceBotaoDeAvanco(buttonText)) return;
    if (!pareceEtapaDatas()) return;
    if (emVerificacao) return;

    const extra = tentarExtrairDatas();
    if (!extra) return;

    const hospedes = tentarExtrairHospedes();

    emVerificacao = true;
    event.preventDefault();
    event.stopPropagation();

    UI.show('Verificando agenda do Piutá…', 'loading');

    try {
      const r = await checkBooking(extra.checkIn, extra.checkOut, hospedes);

      if (!r.ok) {
        UI.show(r.motivo, 'warn');
        UI.autoHide(2600);
        alert(`Indisponível: ${r.motivo}`);
        return;
      }

      UI.show(r.motivo, 'ok');
      UI.autoHide(1400);

      button.dataset.piutaBypass = '1';
      setTimeout(() => button.click(), 0);
    } catch (e) {
      console.error('❌ Calendar: erro na verificação:', e);
      UI.show('Falha ao consultar agenda. Tente novamente.', 'error');
      UI.autoHide(2600);
      alert('Não foi possível verificar disponibilidade agora. Tente novamente.');
    } finally {
      setTimeout(() => { emVerificacao = false; }, 250);
    }
  }, true);

  console.log('✅ Integração Calendar (disponibilidade/capacidade) carregada');
})();
