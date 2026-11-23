/**
 * Faz o parse da data/horário de início de uma partida (ex.: "Hoje (19/11), 20:00",
 * "Amanhã (20/11), 19:00", "22/11/2026, 21:00", "Hoje, 20:00").
 * Se a string contiver apenas "Hoje" ou "Amanhã" sem dia/mês explícito,
 * utiliza `referenceDate` (ex.: `match.createdAt`) como data-base para evitar que
 * partidas criadas em dias anteriores pareçam ser de hoje.
 */
export function parseMatchStartDate(dateTimeStr, referenceDate = null) {
  if (!dateTimeStr) return null;
  const raw = String(dateTimeStr).trim();

  // Extrai horário HH:mm
  const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const baseDate =
    referenceDate && !Number.isNaN(new Date(referenceDate).getTime())
      ? new Date(referenceDate)
      : new Date();

  // 1. Formato dd/mm/yyyy
  const fullBrMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (fullBrMatch) {
    const [, dd, mm, yyyy] = fullBrMatch;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), hours, minutes, 0, 0);
  }

  // 2. Formato ISO yyyy-mm-dd
  const isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), hours, minutes, 0, 0);
  }

  // 3. Formato dd/mm (ex.: "Hoje (19/11), 20:00" ou "Amanhã (20/11), 19:00")
  const shortBrMatch = raw.match(/(\d{2})\/(\d{2})/);
  if (shortBrMatch) {
    const [, dd, mm] = shortBrMatch;
    return new Date(baseDate.getFullYear(), Number(mm) - 1, Number(dd), hours, minutes, 0, 0);
  }

  // 4. Palavras-chave "Amanhã" ou "Hoje" ancoradas na data de criação da partida
  const lower = raw.toLowerCase();
  if (lower.includes('amanh')) {
    return new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 1,
      hours,
      minutes,
      0,
      0
    );
  }
  if (lower.includes('hoje')) {
    return new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours,
      minutes,
      0,
      0
    );
  }

  return null;
}

/**
 * Retorna true assim que já se passou pelo menos 1 hora (60 minutos)
 * após o horário de início da partida (momento em que a partida se encerra e libera a avaliação).
 */
export function isEvaluationUnlocked(match) {
  if (!match) return false;
  const startDate = parseMatchStartDate(match.date || match.time, match.createdAt);
  if (!startDate) return false;
  const unlockTimestamp = startDate.getTime() + 60 * 60 * 1000;
  return Date.now() >= unlockTimestamp;
}

/**
 * Determina a partida como encerrada assim que liberar a avaliação da partida
 * (ou se já estiver avaliada / marcada como encerrada/concluída).
 */
export function isMatchEnded(match) {
  if (!match) return false;
  const statusLower = String(match.status || '').toLowerCase();
  if (statusLower.includes('cancelad')) return false;
  if (
    Boolean(match.evaluated) ||
    isEvaluationUnlocked(match) ||
    statusLower.includes('encerrad') ||
    statusLower.includes('conclu') ||
    statusLower.includes('finaliz') ||
    statusLower.includes('jogad')
  ) {
    return true;
  }
  return false;
}

/**
 * Retorna true quando a janela de avaliação da partida já se encerrou:
 * - Quando todos os jogadores confirmados já avaliaram, OU
 * - 1 hora após o encerramento da partida (ou seja, 2 horas após o horário de início).
 */
export function isEvaluationClosed(match) {
  if (!match) return true;
  const statusLower = String(match.status || '').toLowerCase();
  if (statusLower.includes('avaliações concluídas') || Boolean(match.allPlayersEvaluated)) {
    return true;
  }

  const participants = Array.isArray(match.participants) ? match.participants : [];
  const approvedParticipants = participants.filter(
    (p) =>
      (p.requestStatus || 'approved') === 'approved' &&
      !String(p.status || '').toLowerCase().includes('aguardando host')
  );
  if (
    approvedParticipants.length > 0 &&
    approvedParticipants.every((p) => Boolean(p.evaluated))
  ) {
    return true;
  }

  const startDate = parseMatchStartDate(match.date || match.time, match.createdAt);
  if (!startDate) return false;
  const matchEndTimestamp = startDate.getTime() + 60 * 60 * 1000;
  const evaluationCloseTimestamp = matchEndTimestamp + 60 * 60 * 1000;
  return Date.now() >= evaluationCloseTimestamp;
}

/**
 * Verifica se uma partida pode aparecer no Lobby Público:
 * - Não pode estar cancelada nem encerrada
 * - Deve ser somente do dia atual (hoje) ou de 1 dia futuro (amanhã)
 */
export function isEligibleForPublicLobby(match) {
  if (!match) return false;
  const statusLower = String(match.status || '').toLowerCase();
  if (statusLower.includes('cancelad')) return false;
  if (isMatchEnded(match)) return false;

  const startDate = parseMatchStartDate(match.time || match.date, match.createdAt);
  if (!startDate) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const matchDayStart = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  ).getTime();

  const dayDiff = Math.round((matchDayStart - todayStart) / (24 * 60 * 60 * 1000));
  return dayDiff === 0 || dayDiff === 1;
}

/**
 * Formata o rótulo de data/hora do lobby garantindo exibição precisa ("Hoje (DD/MM), HH:mm" ou "Amanhã (DD/MM), HH:mm").
 */
export function formatLobbyDateLabel(match) {
  const raw = match?.time || match?.date || '';
  const startDate = parseMatchStartDate(raw, match?.createdAt);
  if (!startDate) return raw;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const matchDayStart = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  ).getTime();
  const dayDiff = Math.round((matchDayStart - todayStart) / (24 * 60 * 60 * 1000));

  const dd = String(startDate.getDate()).padStart(2, '0');
  const mm = String(startDate.getMonth() + 1).padStart(2, '0');
  const hh = String(startDate.getHours()).padStart(2, '0');
  const min = String(startDate.getMinutes()).padStart(2, '0');

  if (dayDiff === 0) return `Hoje (${dd}/${mm}), ${hh}:${min}`;
  if (dayDiff === 1) return `Amanhã (${dd}/${mm}), ${hh}:${min}`;
  return `${dd}/${mm}, ${hh}:${min}`;
}
