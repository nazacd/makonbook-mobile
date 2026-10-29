import { ApiError } from '@/lib/api/client';
import type { Weekday } from '@/lib/api/types';

// Parents use the app in Uzbek (Latin) or Russian, as they choose; the rest
// of the app is in English. Everything a parent reads comes from here.
export type Lang = 'uz' | 'ru';

export const LANG_NAME: Record<Lang, string> = { uz: 'O‘zbekcha', ru: 'Русский' };

const uz = {
  forParents: 'Ota-onalar uchun',
  codeTitle: 'Farzandingiz kodi',
  codeIntro:
    'Farzandingizning 5 xonali ota-ona kodini kiriting. Farzandingiz uni ilovadagi «Profile» bo‘limida ko‘radi, yoki kodni ofisdan so‘rashingiz mumkin.',
  codeLabel: 'Kod',
  enter: 'Kirish',
  wrongCode: 'Bu kod bilan o‘quvchi topilmadi. Raqamlarni tekshiring.',
  tooManyChildren: 'Bitta telefonga ko‘pi bilan 5 nafar farzand qo‘shish mumkin.',
  addChild: 'Boshqa farzandni qo‘shish',
  addChildTitle: 'Farzand qo‘shish',

  parentMode: 'Ota-ona rejimi',
  nowInClass: 'Hozir darsda',
  nextClass: 'Keyingi dars',
  until: (time: string) => `${time} gacha`,
  room: (room: string) => `Xona ${room}`,
  classes: 'Guruhlar',
  noClasses: 'Hozircha guruh yo‘q',
  noClassesBody: 'Ofis farzandingizni guruhga qo‘shganda, u jadvali bilan shu yerda ko‘rinadi.',
  loadFailed: 'Yuklab bo‘lmadi',
  tryAgain: 'Qayta urinish',

  attendance: 'Davomat',
  noLessonsRecorded: 'Hali darslar qayd etilmagan',
  attendedOf: (a: number, n: number) => `${n} darsdan ${a} tasida qatnashgan`,
  lateCount: (n: number) => `${n} marta kechikkan`,
  absentCount: (n: number) => `${n} marta kelmagan`,
  attendedLine: (a: number, n: number) => `qatnashgan — ${n} darsdan ${a} tasi`,
  present: 'Keldi',
  late: 'Kechikdi',
  absent: 'Kelmadi',
  presentTile: 'Kelgan',
  lateTile: 'Kechikkan',
  absentTile: 'Kelmagan',
  noLessons: 'Hali darslar yo‘q',
  noLessonsBody: 'Bu guruhdagi darslar o‘tgandan keyin shu yerda ko‘rinadi.',
  attendanceSource: 'Xato bo‘lsa, ofisga xabar bering.',

  report: 'Muammo haqida xabar berish',
  reportTitle: 'Ofisga xabar',
  reportIntro: 'Xabaringiz filial ma’muriyatiga boradi. Javob shu yerda ko‘rinadi.',
  aboutClass: 'Qaysi guruh haqida? (ixtiyoriy)',
  general: 'Umumiy',
  message: 'Xabar',
  messagePlaceholder: 'Masalan: 12-oktabrdagi davomat noto‘g‘ri belgilangan',
  messageTooLong: 'Xabar juda uzun (ko‘pi bilan 2000 belgi).',
  send: 'Yuborish',
  sent: 'Yuborildi. Ofis javobini shu yerda ko‘rasiz.',
  sentReports: 'Yuborilgan xabarlar',
  open: 'Ko‘rib chiqilmoqda',
  handled: 'Ko‘rib chiqildi',
  answer: 'Javob',

  settings: 'Sozlamalar',
  language: 'Til',
  remove: 'Bu telefondan olib tashlash',
  removeTitle: (name: string) => `${name} olib tashlansinmi?`,
  removeBody: 'Qayta qo‘shish uchun kod yana kerak bo‘ladi.',
  removeConfirm: 'Olib tashlash',
  cancel: 'Bekor qilish',
  studentSignIn: 'O‘quvchi sifatida kirish',
  theme: 'Mavzu',
  themeSystem: 'Tizim',
  themeLight: 'Yorug‘',
  themeDark: 'Qorong‘i',

  errNetwork: 'Internet aloqasi yo‘q. Ulanishni tekshirib, qayta urinib ko‘ring.',
  errTimeout: 'Server javob bermadi. Qayta urinib ko‘ring.',
  errRateLimited: 'Juda ko‘p urinish. 15 daqiqadan keyin qayta urinib ko‘ring.',
  errServer: 'Serverda muammo. Birozdan keyin qayta urinib ko‘ring.',
  errOther: 'Nimadir xato ketdi. Qayta urinib ko‘ring.',

  today: 'Bugun',
  tomorrow: 'Ertaga',
};

export type Strings = typeof uz;

const ru: Strings = {
  forParents: 'Для родителей',
  codeTitle: 'Код ребёнка',
  codeIntro:
    'Введите 5-значный родительский код вашего ребёнка. Ребёнок видит его в приложении в разделе «Profile», или код можно узнать в офисе.',
  codeLabel: 'Код',
  enter: 'Войти',
  wrongCode: 'Ученик с таким кодом не найден. Проверьте цифры.',
  tooManyChildren: 'На один телефон можно добавить не больше 5 детей.',
  addChild: 'Добавить другого ребёнка',
  addChildTitle: 'Добавить ребёнка',

  parentMode: 'Режим для родителей',
  nowInClass: 'Сейчас на занятии',
  nextClass: 'Следующее занятие',
  until: (time: string) => `до ${time}`,
  room: (room: string) => `Каб. ${room}`,
  classes: 'Группы',
  noClasses: 'Пока нет групп',
  noClassesBody: 'Когда офис добавит ребёнка в группу, она появится здесь вместе с расписанием.',
  loadFailed: 'Не удалось загрузить',
  tryAgain: 'Повторить',

  attendance: 'Посещаемость',
  noLessonsRecorded: 'Занятий пока не отмечено',
  attendedOf: (a: number, n: number) => `посещено ${a} из ${n} занятий`,
  lateCount: (n: number) => `опозданий: ${n}`,
  absentCount: (n: number) => `пропусков: ${n}`,
  attendedLine: (a: number, n: number) => `посещено — ${a} из ${n} занятий`,
  present: 'Присутствие',
  late: 'Опоздание',
  absent: 'Пропуск',
  presentTile: 'Посещено',
  lateTile: 'Опозданий',
  absentTile: 'Пропусков',
  noLessons: 'Пока нет занятий',
  noLessonsBody: 'Занятия в этой группе появятся здесь, когда пройдут.',
  attendanceSource: 'Если что-то не так, сообщите в офис.',

  report: 'Сообщить о проблеме',
  reportTitle: 'Сообщение в офис',
  reportIntro: 'Сообщение получит администрация филиала. Ответ появится здесь.',
  aboutClass: 'О какой группе? (необязательно)',
  general: 'Общее',
  message: 'Сообщение',
  messagePlaceholder: 'Например: неверно отмечена посещаемость 12 октября',
  messageTooLong: 'Сообщение слишком длинное (не больше 2000 знаков).',
  send: 'Отправить',
  sent: 'Отправлено. Ответ офиса появится здесь.',
  sentReports: 'Отправленные сообщения',
  open: 'На рассмотрении',
  handled: 'Рассмотрено',
  answer: 'Ответ',

  settings: 'Настройки',
  language: 'Язык',
  remove: 'Убрать с этого телефона',
  removeTitle: (name: string) => `Убрать ${name}?`,
  removeBody: 'Чтобы добавить снова, понадобится код.',
  removeConfirm: 'Убрать',
  cancel: 'Отмена',
  studentSignIn: 'Войти как ученик',
  theme: 'Тема',
  themeSystem: 'Системная',
  themeLight: 'Светлая',
  themeDark: 'Тёмная',

  errNetwork: 'Нет соединения с интернетом. Проверьте подключение и попробуйте ещё раз.',
  errTimeout: 'Сервер не ответил. Попробуйте ещё раз.',
  errRateLimited: 'Слишком много попыток. Попробуйте через 15 минут.',
  errServer: 'Проблема на сервере. Попробуйте чуть позже.',
  errOther: 'Что-то пошло не так. Попробуйте ещё раз.',

  today: 'Сегодня',
  tomorrow: 'Завтра',
};

export const STRINGS: Record<Lang, Strings> = { uz, ru };

/** The words for an error, for a parent. */
export function describeParentError(t: Strings, error: unknown): string {
  if (!(error instanceof ApiError)) return t.errOther;
  if (error.code === 'network') return t.errNetwork;
  if (error.code === 'timeout') return t.errTimeout;
  if (error.code === 'rate_limited') return t.errRateLimited;
  if (error.status >= 500) return t.errServer;
  return error.requestId ? `${t.errOther} (${error.requestId})` : t.errOther;
}

// ---- Dates and weekdays ----

const SHORT: Record<Lang, Record<Weekday, string>> = {
  uz: { mon: 'Du', tue: 'Se', wed: 'Ch', thu: 'Pa', fri: 'Ju', sat: 'Sh', sun: 'Ya' },
  ru: { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' },
};
const LONG: Record<Lang, Record<Weekday, string>> = {
  uz: {
    mon: 'Dushanba', tue: 'Seshanba', wed: 'Chorshanba', thu: 'Payshanba', fri: 'Juma', sat: 'Shanba', sun: 'Yakshanba',
  },
  ru: {
    mon: 'Понедельник', tue: 'Вторник', wed: 'Среда', thu: 'Четверг', fri: 'Пятница', sat: 'Суббота', sun: 'Воскресенье',
  },
};
// Month on its own (a heading), and in a date ("12 октября", "12-oktabr").
const MONTH: Record<Lang, string[]> = {
  uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
};
const MONTH_IN_DATE: Record<Lang, string[]> = {
  uz: MONTH.uz.map((m) => m.toLowerCase()),
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
};
const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const ORDER: Record<Weekday, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
const SCHOOL_UTC_OFFSET_MS = 5 * 60 * 60 * 1000; // Tashkent, as in lib/schedule
const DAY_MS = 24 * 60 * 60 * 1000;

export function weekdaysIn(lang: Lang, days: Weekday[]): string {
  return [...days].sort((a, b) => ORDER[a] - ORDER[b]).map((d) => SHORT[lang][d]).join(' · ');
}

/** "Du, 12-oktabr" / "Пн, 12 октября" for a "YYYY-MM-DD" date. */
export function dateIn(lang: Lang, date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = SHORT[lang][WEEKDAYS[d.getUTCDay()]];
  const month = MONTH_IN_DATE[lang][d.getUTCMonth()];
  return lang === 'uz' ? `${day}, ${d.getUTCDate()}-${month}` : `${day}, ${d.getUTCDate()} ${month}`;
}

/** "Oktabr 2026" / "Октябрь 2026" for a "YYYY-MM-DD" date. */
export function monthIn(lang: Lang, date: string): string {
  return `${MONTH[lang][Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
}

/** "12-oktabr, 14:05" / "12 октября, 14:05" at the school, for an instant. */
export function dateTimeIn(lang: Lang, iso: string): string {
  const d = new Date(Date.parse(iso) + SCHOOL_UTC_OFFSET_MS);
  const month = MONTH_IN_DATE[lang][d.getUTCMonth()];
  const time = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  return lang === 'uz' ? `${d.getUTCDate()}-${month}, ${time}` : `${d.getUTCDate()} ${month}, ${time}`;
}

/** "Bugun", "Ertaga" or the weekday, for a class starting at `start`. */
export function dayIn(t: Strings, lang: Lang, start: number, now: number): string {
  const midnight = (x: number) => {
    const local = x + SCHOOL_UTC_OFFSET_MS;
    return local - (local % DAY_MS);
  };
  const days = Math.round((midnight(start) - midnight(now)) / DAY_MS);
  if (days === 0) return t.today;
  if (days === 1) return t.tomorrow;
  return LONG[lang][WEEKDAYS[new Date(start + SCHOOL_UTC_OFFSET_MS).getUTCDay()]];
}
