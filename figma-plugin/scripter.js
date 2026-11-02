// Вставьте целиком в плагин Scripter (Figma → Plugins → Scripter) и нажмите ▶ Run.
// Делает то же, что плагин из manifest.json: копия «итог» → «итог v6 · после юзабилити-прохода» + отметки правок + отчёт.

// Плагин: копирует фрейм «итог» на странице «пко» в новый фрейм «итог v6 · после юзабилити-прохода»,
// отмечает изменённые экраны как в прошлых версиях (синяя подпись «изм. v6»), добавляет заметки с правками
// и вставляет отчёт по юзабилити-проходу. Старые карты не трогает. Повторный запуск пересоздаёт только копию v6.

const SRC_ID = '331:415';
const NAME = 'итог v6 · после юзабилити-прохода';
const LOG = [], ERR = [];

const CHANGES = {
  W05: 'Ошибка гаснет, как только начинаешь вводить имя или телефон',
  W10: '«Начать» ведёт сразу на первый шаг W11, без промежуточного списка W72',
  W11: 'Тап по карточке открывает текст, галочка — отдельная кнопка слева',
  W13: 'Кнопка «Выбрать район» на карточке; чипы вопроса пересчитывают «Подходит по N из M» и порядок; «Готово» активна после выбора',
  W14: 'Строка «Ваш бюджет» и плашка «Выше бюджета на X ₽» видны до нажатия; при превышении — «Посмотреть, как уложиться» / «Оставить и продолжить»',
  W15: 'Суммы как в калькуляторе (с ЖКУ): Митино 84 000 ₽, 1-комн. в Хорошёво 79 000 ₽',
  W16: 'Пустая ссылка — подсказка под полем без перехода на W17; «1 вариант / 3 варианта / 5 вариантов»',
  W17: 'В поле показана ссылка, которую ввёл пользователь, а не пример',
  W58: 'Поля пустые с серыми примерами; без адреса и цены — ошибка «Укажите адрес и цену»',
  W18: 'Меню «⋯» на карточке: «Открыть» / «Удалить»; при 4+ вариантах — «Выбрать 3 и сравнить бесплатно» и «Сравнить все с Семья+»',
  W23: 'Колонки подписаны «район, площадь», лучший отмечен ★; кнопка «Подробнее: Хорошёво, 54 м²» вместо «№1»',
  W24: 'Заголовок — район и площадь; переключатель — чипы с названиями вместо №1/№2',
  W59: 'Дата и время — из системного календаря; без них ошибка «Выберите дату и время»',
  W60: '«Перенести» и «Отменить просмотр» раздельно; отмена — с подтверждением',
  W48: 'Плашка «Так придёт уведомление на телефон» — понятно, что это пример',
  W26: 'Звёзды и теги пустые; без оценки — подсказка «Сначала поставьте оценку»',
  W27: 'Не все пункты отмечены → шторка «Не проверено: 2 пункта»: «Вернуться к проверке» / «Всё равно подтвердить»',
  W29: 'Кнопка названа по месту назначения: «На главную — к этапу «Переезд»»',
  W63: 'Hero и «Новое» берут район и бюджет из шага 1 (выбрали Митино — пишет Митино)',
  W64: 'Если договор проверен не полностью — «в договоре не проверено: 2 пункта» вместо «договор проверен»',
  W76: 'Поля билета пустые с примерами; загрузка или подбор (W77) заполняют их; без номера и рейса — ошибка',
  W78: 'Переключатель «Загрузка · 12 авг / Доставка · 15 авг» над календарём; доставка не раньше загрузки',
  W31: 'Перевозчик, отказавший в брони, серый — «Нет машин на 12 авг»; выбор переходит на следующего',
  W32: '«Выбрать другого перевозчика» возвращает к списку с уже выбранным доступным перевозчиком',
  W40: 'Демо-ссылка «Прошёл месяц» убрана: через 3 с приходит пуш «Месяц на новом месте!», тап → W50',
};

// подписи стрелок на картах: старый текст → новый
const FLOW_TEXT = [
  ['этап «Подготовка»', 'W11 «Разговор с ребёнком»'],
  ['«К шагам этапа»', '«На главную — к этапу «Переезд»»'],
  ['прошёл месяц', 'пуш через месяц'],
  ['«Сравнить с агентом»', '«Выбрать 3 бесплатно» / «Сравнить все с Семья+»'],
];

// тексты внутри экранов
const SCREEN_TEXT = {
  W29: [['К шагам этапа', 'На главную — к этапу «Переезд»']],
  W60: [['Перенести или отменить', 'Перенести']],
  W24: [['Вариант 1 из 3', 'Хорошёво, 54 м²']],
  W58: [['ул. Генерала Глаголева, 10', 'Например: ул. Генерала Глаголева, 10', 'hint'], ['85 000 ₽', 'Например: 85 000', 'hint']],
  W76: [['7012 3456 7890', 'Например: 7012 3456 7890', 'hint'], ['020С Ростов → Москва, вагон 7', 'Например: 020С, вагон 7', 'hint']],
};

const GREY = { r: 0.55, g: 0.58, b: 0.61 };
const INK = { r: 0.118, g: 0.165, b: 0.2 };
const BEIGE = { r: 0.965, g: 0.945, b: 0.914 };
const LINE = { r: 0.9, g: 0.88, b: 0.85 };
const BLUE = { r: 0.122, g: 0.373, b: 0.545 };

function AL(dir, props) {
  const f = figma.createFrame();
  f.layoutMode = dir || 'HORIZONTAL';
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = [];
  f.clipsContent = false;
  if (props) Object.assign(f, props);
  return f;
}
async function loadFonts(t) {
  for (const f of t.getRangeAllFontNames(0, t.characters.length)) await figma.loadFontAsync(f);
}
async function replaceIn(t, a, b) {
  const i = t.characters.indexOf(a);
  if (i < 0) return false;
  await loadFonts(t);
  t.insertCharacters(i + a.length, b, 'BEFORE');
  t.deleteCharacters(i, i + a.length);
  return true;
}
function solidFills(node) {
  if (!node) return null;
  if ('fills' in node && Array.isArray(node.fills) && node.fills.length) return JSON.parse(JSON.stringify(node.fills));
  if ('children' in node) { const r = node.children.find(c => c.type === 'RECTANGLE'); if (r) return JSON.parse(JSON.stringify(r.fills)); }
  return null;
}
function setFills(node, fills) {
  if (!node || !fills) return;
  if (node.type === 'GROUP') { const r = node.children.find(c => c.type === 'RECTANGLE' || c.type === 'FRAME'); if (r) r.fills = fills; return; }
  if ('fills' in node) node.fills = fills;
}

async function main() {
  const page = figma.root.children.find(p => p.name === 'пко');
  if (!page) throw new Error('Нет страницы «пко»');
  await figma.setCurrentPageAsync(page);
  const src = await figma.getNodeByIdAsync(SRC_ID);
  if (!src) throw new Error('Не найден фрейм «итог» (' + SRC_ID + ')');

  const prev = page.children.find(n => n.name === NAME);
  if (prev) { prev.remove(); LOG.push('прошлая копия v6 пересоздана'); }

  // 1. копия карты
  const dst = src.clone();
  dst.name = NAME;
  dst.x = src.x + src.width + 1200;
  dst.y = src.y;
  for (const c of dst.children) {
    if (c.name.startsWith('v5.3 ')) c.name = 'v6 ' + c.name.slice(5);
    else if (c.name.startsWith('v5 label')) c.name = 'v6 label' + c.name.slice(8);
  }
  const maps = dst.children.filter(c => c.type === 'FRAME' && /Карта \d/.test(c.name));
  const inMap = n => { let p = n.parent; while (p && p !== dst) { if (maps.includes(p)) return true; p = p.parent; } return false; };
  const boxOf = t => {
    const p = t.parent;
    if (p && p !== dst && !maps.includes(p) && (p.type === 'FRAME' || p.type === 'GROUP' || p.type === 'INSTANCE')) return p;
    const cx = t.x + t.width / 2, cy = t.y + t.height / 2;
    return (p.children || []).find(s => s !== t && (s.type === 'RECTANGLE' || s.type === 'FRAME') && s.x <= cx && s.x + s.width >= cx && s.y <= cy && s.y + s.height >= cy) || null;
  };
  const texts = dst.findAllWithCriteria({ types: ['TEXT'] });
  const mapTexts = texts.filter(inMap);
  LOG.push('скопировано: ' + dst.children.length + ' слоёв верхнего уровня, текстов на картах: ' + mapTexts.length);

  // 2. легенда версии
  for (const t of texts) {
    try {
      if (t.characters.includes('Синие узлы') || t.characters.includes('Синяя рамка')) {
        await replaceIn(t, 'V5.1', 'V6');
        await replaceIn(t, 'изменён в v5.1', 'изменён в v6 — по итогам юзабилити-прохода');
      }
    } catch (e) { ERR.push('легенда: ' + e.message); }
  }

  // 3. подписи экранов: v5.1 → обычные, v6 → синие
  try {
    const blueT = mapTexts.find(t => /^W\d\d ·/.test(t.characters) && t.characters.includes('изм.'));
    const plainT = mapTexts.find(t => /^W\d\d ·/.test(t.characters) && !t.characters.includes('изм.'));
    const blueBox = blueT && boxOf(blueT), plainBox = plainT && boxOf(plainT);
    const blueFill = solidFills(blueBox) || [{ type: 'SOLID', color: { r: 0.18, g: 0.48, b: 0.92 } }];
    const plainFill = solidFills(plainBox) || [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    const blueTextFill = blueT ? JSON.parse(JSON.stringify(blueT.fills)) : [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    const plainTextFill = plainT ? JSON.parse(JSON.stringify(plainT.fills)) : [{ type: 'SOLID', color: INK }];
    let unmarked = 0, marked = 0;
    for (const t of mapTexts.filter(t => /^W\d\d ·/.test(t.characters) && /изм\. v5\.\d/.test(t.characters))) {
      await loadFonts(t);
      t.characters = t.characters.replace(/\s*·\s*изм\. v5\.\d/, '');
      t.fills = plainTextFill; setFills(boxOf(t), plainFill); unmarked++;
    }
    for (const key of Object.keys(CHANGES)) {
      const t = mapTexts.find(x => x.characters.startsWith(key + ' ·'));
      if (!t) { ERR.push('подпись ' + key + ' не найдена'); continue; }
      await loadFonts(t);
      if (!t.characters.includes('изм. v6')) t.characters = t.characters + ' · изм. v6';
      t.fills = blueTextFill; setFills(boxOf(t), blueFill); marked++;
    }
    LOG.push('подписи: снято «изм. v5.x» — ' + unmarked + ', отмечено «изм. v6» — ' + marked);
  } catch (e) { ERR.push('подписи: ' + e.message); }

  // 4. подписи стрелок
  let flows = 0;
  for (const [a, b] of FLOW_TEXT) for (const t of mapTexts) { try { if (await replaceIn(t, a, b)) flows++; } catch (e) { ERR.push('стрелка: ' + e.message); } }
  LOG.push('подписей стрелок изменено: ' + flows);

  // 5. тексты внутри экранов
  const screenOf = key => dst.children.find(c => c.type === 'FRAME' && c.name.startsWith('v6 ' + key + ' ·'));
  let edits = 0;
  for (const [key, list] of Object.entries(SCREEN_TEXT)) {
    const s = screenOf(key); if (!s) { ERR.push('экран ' + key + ' не найден'); continue; }
    const st = s.findAllWithCriteria({ types: ['TEXT'] });
    for (const [a, b, hint] of list) {
      const t = st.find(x => x.characters.includes(a));
      if (!t) { ERR.push(key + ': нет текста «' + a + '»'); continue; }
      try { await replaceIn(t, a, b); if (hint) t.fills = [{ type: 'SOLID', color: GREY }]; edits++; } catch (e) { ERR.push(key + ': ' + e.message); }
    }
  }
  LOG.push('правок текста в экранах: ' + edits);

  // 6. шрифты для новых слоёв
  let F;
  try {
    await Promise.all(['Bold', 'SemiBold', 'Regular'].map(s => figma.loadFontAsync({ family: 'Manrope', style: s })));
    F = { b: { family: 'Manrope', style: 'Bold' }, sb: { family: 'Manrope', style: 'SemiBold' }, r: { family: 'Manrope', style: 'Regular' } };
  } catch (e) {
    await Promise.all(['Bold', 'Semi Bold', 'Regular'].map(s => figma.loadFontAsync({ family: 'Inter', style: s })));
    F = { b: { family: 'Inter', style: 'Bold' }, sb: { family: 'Inter', style: 'Semi Bold' }, r: { family: 'Inter', style: 'Regular' } };
  }
  const T = (str, size, font, color, w) => {
    const t = figma.createText(); t.fontName = font; t.fontSize = size; t.characters = str;
    t.fills = [{ type: 'SOLID', color: color || INK }];
    if (w) { t.textAutoResize = 'HEIGHT'; t.resize(w, Math.max(1, t.height)); }
    return t;
  };

  // 7. заметки «Правка v6» под изменёнными экранами — в стиле заметок карты
  const noteT = texts.find(t => t.characters.includes('Один вопрос агента'));
  const noteTpl = noteT ? boxOf(noteT) : null;
  let notes = 0;
  for (const [key, text] of Object.entries(CHANGES)) {
    const s = screenOf(key); if (!s) continue;
    try {
      let n;
      const tpl = noteTpl && noteTpl.type === 'FRAME' ? noteTpl : null;
      if (tpl && tpl.findAllWithCriteria({ types: ['TEXT'] }).length >= 2) {
        n = tpl.clone(); dst.appendChild(n);
        const nt = n.findAllWithCriteria({ types: ['TEXT'] });
        await loadFonts(nt[0]); nt[0].characters = 'Правка v6 · ' + key;
        await loadFonts(nt[1]); nt[1].characters = text;
        for (const x of nt.slice(2)) x.visible = false;
        if (n.layoutMode === 'NONE') { n.resize(390, n.height); nt[1].textAutoResize = 'HEIGHT'; nt[1].resize(390 - nt[1].x * 2, nt[1].height); n.resize(390, nt[1].y + nt[1].height + nt[0].y); }
        else { n.counterAxisSizingMode = 'FIXED'; n.resize(390, n.height); n.primaryAxisSizingMode = 'AUTO'; nt[1].layoutSizingHorizontal = 'FILL'; nt[1].textAutoResize = 'HEIGHT'; }
      } else {
        n = AL('VERTICAL', { itemSpacing: 6 }); dst.appendChild(n);
        n.paddingLeft = n.paddingRight = 16; n.paddingTop = n.paddingBottom = 12; n.cornerRadius = 10;
        n.fills = [{ type: 'SOLID', color: { r: 0.925, g: 0.875, b: 0.984 } }];
        n.strokes = [{ type: 'SOLID', color: { r: 0.62, g: 0.36, b: 0.92 } }]; n.strokeWeight = 2; n.dashPattern = [8, 6];
        n.appendChild(T('Правка v6 · ' + key, 16, F.b, INK)); n.appendChild(T(text, 14, F.r, INK, 358));
        n.counterAxisSizingMode = 'FIXED'; n.resize(390, n.height); n.primaryAxisSizingMode = 'AUTO';
      }
      n.name = 'Правка v6 · ' + key;
      n.x = s.x; n.y = s.y + s.height + 36;
      notes++;
    } catch (e) { ERR.push('заметка ' + key + ': ' + e.message); }
  }
  LOG.push('заметок «Правка v6»: ' + notes + (noteTpl ? ' (по образцу заметки карты)' : ' (свой стиль)'));

  // 8. отчёт по юзабилити-проходу
  try { buildReport(dst, F, T); LOG.push('отчёт добавлен'); } catch (e) { ERR.push('отчёт: ' + e.message); }

  figma.viewport.scrollAndZoomIntoView([dst]);
  return { newFrameId: dst.id, log: LOG, errors: ERR };
}

function buildReport(dst, F, T) {
  const W = 4300, IN = W - 192;
  const R = AL('VERTICAL', { name: 'Отчёт по юзабилити-проходу · v6', itemSpacing: 56 });
  dst.appendChild(R);
  R.paddingLeft = R.paddingRight = R.paddingTop = R.paddingBottom = 96;
  R.cornerRadius = 32; R.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  R.counterAxisSizingMode = 'FIXED'; R.resize(W, 100); R.primaryAxisSizingMode = 'AUTO';
  R.x = 10660; R.y = 3400;

  const add = n => { R.appendChild(n); return n; };
  const H2 = s => add(T(s, 48, F.b, INK, IN));
  const P = s => add(T(s, 28, F.r, INK, IN));
  const sevColor = s => s === 'Высокая' ? { r: 0.85, g: 0.27, b: 0.2 } : s === 'Средняя' ? { r: 0.86, g: 0.5, b: 0.08 } : GREY;

  function table(cols, rows) {
    const tb = AL('VERTICAL', { name: 'таблица', itemSpacing: 0 });
    R.appendChild(tb); tb.fills = [];
    const mk = (cells, head) => {
      const r = AL('HORIZONTAL', { itemSpacing: 0 });
      tb.appendChild(r);
      r.fills = head ? [{ type: 'SOLID', color: BEIGE }] : [];
      r.strokes = [{ type: 'SOLID', color: LINE }];
      r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 2;
      cells.forEach((c, i) => {
        const cell = AL('VERTICAL');
        r.appendChild(cell);
        cell.fills = []; cell.paddingLeft = cell.paddingRight = 20; cell.paddingTop = cell.paddingBottom = 18;
        cell.counterAxisSizingMode = 'FIXED'; cell.resize(cols[i].w, 40); cell.primaryAxisSizingMode = 'AUTO';
        const isSev = !head && cols[i].sev;
        cell.appendChild(T(String(c), 24, head || isSev ? F.b : F.r, isSev ? sevColor(c) : INK, cols[i].w - 40));
        cell.layoutSizingVertical = 'FILL';
      });
    };
    mk(cols.map(c => c.h), true);
    rows.forEach(r => mk(r, false));
    return tb;
  }

  add(T('Юзабилити-проход прототипа «Переезд с семьёй» · что исправлено в v6', 72, F.b, INK, IN));
  P('Оба прохода дошли до конца: квартира выбрана, переезд закрыт, адаптация пройдена. Критичных тупиков нет, но на подборе жилья и в данных между этапами пользователь спотыкался чаще всего. Все 11 проблем из сводки исправлены в прототипе v6 — изменённые экраны на картах отмечены синей подписью «изм. v6» и заметкой «Правка v6».');

  H2('Как проводили');
  P('Задание: «Вы с семьёй переезжаете из Ростова-на-Дону в Москву. Подготовьтесь, найдите и снимите квартиру, перевезите вещи и освойтесь на новом месте».');
  P('Прототип: denkot-cobaka.github.io/pereezd — полный путь W01 → W65, около 80 экранов.');
  P('Метод: экспертный проход по двум персонам — сценарий пройден целиком за каждую, с записью экранов. Это не интервью с реальными респондентами; таблицы можно заменить ответами живых людей, формат тот же.');
  P('Персона 1 — Анна, 34 года: мама двоих детей, переезжает впервые, проходит всё по шагам, читает подсказки. Персона 2 — Игорь, 41 год: торопится, ищет кратчайший путь, сравнивает много квартир, не хочет платить.');
  P('Критичность: высокая — путь ломается или ведёт к неверному решению; средняя — путает или требует лишних действий; низкая — косметика.');

  const C4 = [{ h: '№', w: 100 }, { h: 'Экран', w: 560 }, { h: 'Что произошло', w: 2948 }, { h: 'Критичность', w: 500, sev: true }];
  H2('Проход 1 — Анна');
  P('Анна дошла до конца, но трижды решила, что приложение «перепутало» её выбор: район, номер квартиры и проверку договора.');
  table(C4, [
    ['1', 'W05 Регистрация', 'Заполнила имя и телефон, а красная рамка и надпись «Как к вам обращаться?» не пропали, пока снова не нажала «Продолжить», непонятно, что ещё не так.', 'Средняя'],
    ['2', 'W10 → W72', 'Нажала «Начать» и ждала первый шаг, а попала ещё в один список шагов, лишний экран.', 'Низкая'],
    ['3', 'W11 Разговор с ребёнком', 'Тапнула по «Сказке о переезде», чтобы почитать, а она просто отметилась галочкой, читать надо через мелкое «Подробнее».', 'Средняя'],
    ['4', 'W13 Районы', 'Выбрала «Метро» в вопросе агента, список районов не поменялся. Кнопки «выбрать этот район» нет, район выбирается неявно через «Бюджет ›».', 'Высокая'],
    ['5', 'W14 → W15', 'Нажала «Готово» на калькуляторе, а вместо возврата открылось «Бюджет превышен». Мой бюджет 90 000 ₽ на калькуляторе нигде не показан, предупреждения не было.', 'Средняя'],
    ['6', 'W15 / W14', 'На экране превышения Митино «~79 000 ₽/мес», а в калькуляторе Митино уже 84 000 ₽ в месяц, цифры расходятся.', 'Средняя'],
    ['7', 'W63 Главная, этап 2', 'Выбрала Митино, а на главной написано «Подготовка готова: Хорошёво-Мнёвники» и предлагают объявления в Хорошёво.', 'Высокая'],
    ['8', 'W23 → W24', 'Открыла «Подробнее о №1» из сводки, а карточка называется «Вариант 2 из 4» и подсвечен №2, подумала, что открылась не та квартира.', 'Высокая'],
    ['9', 'W25 → W48', 'Нажала «Завершить и оценить», и вдруг показался экран блокировки телефона, не поняла, вышла ли из приложения.', 'Средняя'],
    ['10', 'W26 Оценка просмотра', 'Все 5 звёзд и теги «Светло», «Тихо», «Нет лифта» уже выбраны до того, как я что-то оценила.', 'Средняя'],
    ['11', 'W27 → W64', 'Подтвердила выбор с двумя неотмеченными пунктами договора (залог, опись), предупреждения не было, а на главной потом написано «договор проверен».', 'Высокая'],
    ['12', 'W29 Жильё выбрано', 'Кнопка «К шагам этапа» привела на главную, а не к шагам.', 'Низкая'],
    ['13', 'W40 Бытовые услуги', 'Ссылка «Прошёл месяц ›» внизу выглядит как ошибка, непонятно, зачем она пользователю.', 'Низкая'],
  ]);

  H2('Проход 2 — Игорь');
  P('Игорь прошёл путь бесплатно, но три раза сохранил данные, которые не вводил: формы заранее заполнены, а торопливый пользователь их не читает.');
  table(C4, [
    ['1', 'W16 → W17', 'Нажал «Добавить по ссылке» с пустым полем — ошибка «Не удалось загрузить» про ссылку example-site.ru, которую я не вводил.', 'Средняя'],
    ['2', 'W58 Новый вариант', 'Форма уже заполнена чужим адресом и ценой, нажал «Сохранить» и получил квартиру, которую не добавлял.', 'Высокая'],
    ['3', 'W16 Жильё', 'Пишет «В списке 1 варианта», ошибка в склонении.', 'Низкая'],
    ['4', 'W18 Мои варианты', 'Удалить квартиру можно только мелкой серой надписью «Удалить» под «Подробнее», нашёл не сразу и боялся промахнуться.', 'Средняя'],
    ['5', 'W18 + шторка Семья+', 'При 4 вариантах сравнение сразу упирается в оплату, бесплатный выбор трёх нашёл только во второй кнопке шторки. Уведомление «Объявление добавлено» перекрывает кнопку оплаты.', 'Средняя'],
    ['6', 'W18 выбор для сравнения', 'В режиме выбора пропадает сортировка, не видно, какие варианты лучше, выбираю три наугад.', 'Низкая'],
    ['7', 'W59 → W60 Просмотр', 'Дату и время надо печатать текстом, календаря нет. «Перенести или отменить» просто снова открывает форму, отменить нельзя.', 'Средняя'],
    ['8', 'W76 Билеты', 'Билет уже заполнен (номер 7012 3456 7890, поезд 020С), нажал «Сохранить», хотя билетов не покупал.', 'Средняя'],
    ['9', 'W78 Перевозка вещей', 'Непонятно, как выбрать дату загрузки и доставки: нажатие на число то меняет загрузку, то доставку.', 'Средняя'],
    ['10', 'W31 → W32 → W33', '«ГрузТранс» отказал в брони, вернулся к списку — он всё ещё выбран, нажал снова, и бронь вдруг прошла. Нелогично.', 'Средняя'],
    ['11', 'Всплывающие уведомления', 'Уведомления внизу перекрывают главную кнопку (например «Готово — к шагам этапа» на W33) и висят после перехода на следующий экран.', 'Низкая'],
  ]);

  H2('Сводка и что исправлено в v6');
  P('24 наблюдения сводятся к 11 проблемам. Все исправлены в прототипе; на картах изменённые экраны отмечены «изм. v6».');
  table([{ h: '№', w: 90 }, { h: 'Проблема', w: 1250 }, { h: 'Где', w: 420 }, { h: 'Кто', w: 300 }, { h: 'Крит.', w: 320, sev: true }, { h: 'Что сделано в v6', w: 1728 }], [
    ['1', 'Выбор не переносится между этапами; суммы на W15 и W14 расходятся', 'W63, W15, W14', 'Анна', 'Высокая', 'Район и бюджет из шага 1 подставляются в главную и подборки; W15 считает так же, как калькулятор (с ЖКУ)'],
    ['2', 'Номер в сводке (№1) не совпадает с карточкой («Вариант 2 из 4»)', 'W23 → W24', 'Анна', 'Высокая', 'Квартиры везде названы «район, площадь»; лучший вариант отмечен ★'],
    ['3', 'Можно выбрать квартиру с непроверенным договором, а главная пишет «договор проверен»', 'W27 → W64', 'Анна', 'Высокая', 'Шторка «Не проверено: N пунктов»; главная пишет, сколько пунктов осталось'],
    ['4', 'Формы и оценки заранее заполнены', 'W58, W76, W26', 'Анна, Игорь', 'Высокая', 'Поля пустые с серыми примерами и проверкой; звёзды и теги без предвыбора'],
    ['5', 'Район выбирается неявно, вопрос агента не меняет список', 'W13', 'Анна', 'Высокая', 'Кнопка «Выбрать район»; чипы пересчитывают «Подходит по N из M» и порядок'],
    ['6', 'Бесплатное сравнение 4+ квартир спрятано, «Удалить» мелкое', 'W18', 'Игорь', 'Средняя', 'Кнопка «Выбрать 3 и сравнить бесплатно» на виду; удаление через меню «⋯»'],
    ['7', 'Кнопки ведут не туда, куда обещают', 'W14, W25, W29, W10', 'Анна', 'Средняя', 'Бюджет виден на калькуляторе; плашка «Так придёт уведомление»; «На главную — к этапу «Переезд»»; «Начать» → сразу W11'],
    ['8', 'Ошибки не гаснут; пустая ссылка даёт ошибку про чужой адрес', 'W05, W17', 'Анна, Игорь', 'Средняя', 'Ошибка гаснет при вводе; пустое поле — подсказка на месте'],
    ['9', 'Даты текстом, календарь перевозки непонятен, просмотр не отменить', 'W59, W60, W78', 'Игорь', 'Средняя', 'Системный календарь; переключатель «Загрузка / Доставка»; «Отменить просмотр» отдельно'],
    ['10', 'Отказ перевозчика не запоминается', 'W31–W33', 'Игорь', 'Средняя', 'Отказавший перевозчик серый «Нет машин на 12 авг», выбор переходит на следующего'],
    ['11', 'Мелочи: склонение, уведомления, демо-ссылка, галочка вместо чтения, сортировка', 'W16, W33, W40, W11, W18', 'Анна, Игорь', 'Низкая', 'Склонение по числу; уведомления сверху; пуш вместо ссылки; тап по карточке открывает текст; сортировка в режиме выбора'],
  ]);

  H2('Что работает хорошо');
  P('План из трёх этапов с прогрессом: ни один проход не потерялся — главная всегда показывает «Вы остановились здесь» и одну кнопку «Продолжить».');
  P('Бесплатный путь настоящий: Игорь прошёл всё без оплаты, Семья+ предлагается только там, где даёт выигрыш во времени.');
  P('Ошибки с выходом: нераспознанная ссылка, отказ перевозчика и неверный код объясняют причину и сразу дают следующее действие.');
  P('Подсказки агента на месте и адаптация по желанию: после акта приёмки можно сказать «Не сейчас».');
  return R;
}

try {
  const r = await main();
  const msg = 'Готово: «' + NAME + '». ' + r.log.join('; ') + (r.errors.length ? ' · Пропущено: ' + r.errors.length : '');
  figma.notify(msg, { timeout: 10000 });
  console.log(msg);
  if (r.errors.length) console.log('Пропущено:\n' + r.errors.join('\n'));
} catch (e) {
  figma.notify('Ошибка: ' + e.message, { error: true, timeout: 10000 });
  console.log(e);
}
