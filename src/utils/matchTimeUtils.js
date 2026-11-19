/**
 * Faz o parse da data/horário de início de uma partida (ex.: "Hoje (19/11), 20:00",
 * "Amanhã (20/11), 19:00", "22/11/2026, 21:00", "Hoje, 20:00")
 * e verifica se já se passou pelo menos 1 hora após o início.
 */
export function parseMatchStartDate(dateTimeStr) {
  if (!dateTimeStr) return null;
  const raw = String(dateTimeStr).trim();

  // Extrai horário HH:mm
  const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const now = new Date();

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
    return new Date(now.getFullYear(), Number(mm) - 1, Number(dd), hours, minutes, 0, 0);
  }

  // 4. Palavras-chave "Amanhã" ou "Hoje"
  const lower = raw.toLowerCase();
  if (lower.includes('amanh')) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours, minutes, 0, 0);
    return d;
  }
  if (lower.includes('hoje')) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  }

  return null;
}

/**
 * Retorna true somente se já se passou pelo menos 1 hora (60 minutos)
 * após o horário de início da partida no relógio local.
 */
export function isEvaluationUnlocked(match) {
  if (!match) return false;
  const startDate = parseMatchStartDate(match.date || match.time);
  if (!startDate) return false;
  const unlockTimestamp = startDate.getTime() + 60 * 60 * 1000;
  return Date.now() >= unlockTimestamp;
}
