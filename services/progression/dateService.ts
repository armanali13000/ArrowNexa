export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (dateKey: string, amount: number) => {
  const date = parseLocalDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return getLocalDateKey(date);
};

export const getWeekId = (date = new Date()) => {
  const cursor = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = cursor.getDay() || 7;
  cursor.setDate(cursor.getDate() + 4 - day);
  const yearStart = new Date(cursor.getFullYear(), 0, 1);
  const week = Math.ceil((((cursor.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${cursor.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

export const formatDayMonth = (dateKey: string) =>
  parseLocalDateKey(dateKey).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase();
