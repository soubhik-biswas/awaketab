export type TToolLang = 'en' | 'de' | 'ja' | 'zh' | 'hi';

export const TOOL_LANGS: readonly TToolLang[] = ['en', 'de', 'ja', 'zh', 'hi'];

export interface IToolStrings {
  soundNav: string;
  studio: string;
  keep: string;
  pause: string;
  resume: string;
  stop: string;
  ext15: string;
  again: string;
  starting: string;
  fix: string;
  fallback: string;
  timer: string;
  faces: string;
  presets: string;
  history: string;
  devices: string;
  settings: string;
  help: string;
  more: string;
  search: string;
  session: string;
  length: string;
  label: string;
  face: string;
  allFaces: string;
  options: string;
  level: string;
  screen: string;
  system: string;
  sound: string;
  soundD: string;
  dim: string;
  dimD: string;
  secs: string;
  secsD: string;
  idle: string;
  awakeUntil: string;
  awakeFor: string;
  fb: string;
  paused: string;
  needs: string;
  blocked: string;
  ended: string;
  unsup: string;
  left: string;
  until: string;
  endsAt: string;
  wouldEnd: string;
  min: string;
  hour: string;
  hours2: string;
  untilT: string;
  label0: string;
  forLen: string;
}

export const STRINGS: Record<TToolLang, IToolStrings> = {
  en: {
    soundNav: 'Sound',
    studio: 'Face studio',
    keep: 'Keep awake',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop',
    ext15: '+15 min',
    again: 'Start again',
    starting: 'Starting…',
    fix: 'See the fix',
    fallback: 'Use video fallback',
    timer: 'Timer',
    faces: 'Faces',
    presets: 'Presets',
    history: 'History',
    devices: 'Devices',
    settings: 'Settings',
    help: 'Help & fixes',
    more: 'More',
    search: 'Search or jump to…',
    session: 'Session',
    length: 'Length',
    label: 'Label',
    face: 'Face',
    allFaces: 'All 33 faces',
    options: 'Options',
    level: 'Keep-awake level',
    screen: 'Screen',
    system: 'System · app',
    sound: 'Chime when it ends',
    soundD: 'A soft two-note chime',
    dim: 'Dim the clock at night',
    dimD: 'After 10:00 PM',
    secs: 'Show seconds',
    secsD: 'On the face and the tab title',
    idle: 'Not keeping awake',
    awakeUntil: 'Awake · until ',
    awakeFor: 'Awake · no end',
    fb: 'Awake · video fallback',
    paused: 'Paused',
    needs: 'Needs you · tap to resume',
    blocked: 'Blocked · battery saver',
    ended: 'Ended at ',
    unsup: 'Not supported here',
    left: 'left',
    until: 'until ',
    endsAt: 'Ends at ',
    wouldEnd: 'Would end at ',
    min: ' min',
    hour: '1 hour',
    hours2: '2 hours',
    untilT: 'Until…',
    label0: 'Presenting to the board',
    forLen: ' · ends ',
  },
  de: {
    soundNav: 'Klang',
    studio: 'Zifferblatt-Studio',
    keep: 'Wach halten',
    pause: 'Pausieren',
    resume: 'Fortsetzen',
    stop: 'Beenden',
    ext15: '+15 Min.',
    again: 'Neu starten',
    starting: 'Startet…',
    fix: 'Lösung ansehen',
    fallback: 'Video-Ersatz nutzen',
    timer: 'Timer',
    faces: 'Zifferblätter',
    presets: 'Vorlagen',
    history: 'Verlauf',
    devices: 'Geräte',
    settings: 'Einstellungen',
    help: 'Hilfe',
    more: 'Mehr',
    search: 'Suchen oder springen…',
    session: 'Sitzung',
    length: 'Dauer',
    label: 'Bezeichnung',
    face: 'Zifferblatt',
    allFaces: 'Alle 33',
    options: 'Optionen',
    level: 'Wach-Stufe',
    screen: 'Bildschirm',
    system: 'System · App',
    sound: 'Ton am Ende',
    soundD: 'Ein leiser Zweiklang',
    dim: 'Uhr nachts dimmen',
    dimD: 'Ab 22:00 Uhr',
    secs: 'Sekunden zeigen',
    secsD: 'Auf dem Zifferblatt und im Tab',
    idle: 'Nicht aktiv',
    awakeUntil: 'Wach · bis ',
    awakeFor: 'Wach · ohne Ende',
    fb: 'Wach · Video-Ersatz',
    paused: 'Pausiert',
    needs: 'Antippen zum Fortsetzen',
    blocked: 'Blockiert · Energiesparen',
    ended: 'Beendet um ',
    unsup: 'Hier nicht unterstützt',
    left: 'übrig',
    until: 'bis ',
    endsAt: 'Endet um ',
    wouldEnd: 'Würde enden um ',
    min: ' Min.',
    hour: '1 Stunde',
    hours2: '2 Stunden',
    untilT: 'Bis…',
    label0: 'Präsentation vor dem Vorstand',
    forLen: ' · endet ',
  },
  ja: {
    soundNav: 'サウンド',
    studio: '文字盤スタジオ',
    keep: '画面をつけたままにする',
    pause: '一時停止',
    resume: '再開',
    stop: '停止',
    ext15: '+15分',
    again: 'もう一度',
    starting: '開始中…',
    fix: '解決方法を見る',
    fallback: '動画で代替する',
    timer: 'タイマー',
    faces: '文字盤',
    presets: 'プリセット',
    history: '履歴',
    devices: 'デバイス',
    settings: '設定',
    help: 'ヘルプ',
    more: 'その他',
    search: '検索またはジャンプ…',
    session: 'セッション',
    length: '時間',
    label: 'ラベル',
    face: '文字盤',
    allFaces: '33種類すべて',
    options: 'オプション',
    level: 'スリープ防止の範囲',
    screen: '画面',
    system: 'システム · アプリ',
    sound: '終了時にチャイム',
    soundD: 'やさしい2音のチャイム',
    dim: '夜は時計を暗く',
    dimD: '午後10:00以降',
    secs: '秒を表示',
    secsD: '文字盤とタブのタイトル',
    idle: '停止中',
    awakeUntil: '点灯中 · ',
    awakeFor: '点灯中 · 終了なし',
    fb: '点灯中 · 動画で代替',
    paused: '一時停止中',
    needs: 'タップして再開',
    blocked: 'ブロック · 省電力',
    ended: '終了 ',
    unsup: 'このブラウザは非対応',
    left: '残り',
    until: 'まで ',
    endsAt: '終了 ',
    wouldEnd: '終了予定 ',
    min: '分',
    hour: '1時間',
    hours2: '2時間',
    untilT: '時刻まで…',
    label0: '役員会でのプレゼン',
    forLen: ' · 終了 ',
  },
  zh: {
    soundNav: '声音',
    studio: '表盘工作室',
    keep: '保持屏幕常亮',
    pause: '暂停',
    resume: '继续',
    stop: '停止',
    ext15: '+15 分钟',
    again: '重新开始',
    starting: '正在启动…',
    fix: '查看解决办法',
    fallback: '使用视频备用方案',
    timer: '计时',
    faces: '表盘',
    presets: '预设',
    history: '历史记录',
    devices: '设备',
    settings: '设置',
    help: '帮助',
    more: '更多',
    search: '搜索或跳转…',
    session: '会话',
    length: '时长',
    label: '标签',
    face: '表盘',
    allFaces: '全部 33 款',
    options: '选项',
    level: '防休眠范围',
    screen: '屏幕',
    system: '系统 · 应用',
    sound: '结束时提示音',
    soundD: '柔和的双音提示',
    dim: '夜间调暗时钟',
    dimD: '晚上 10:00 之后',
    secs: '显示秒',
    secsD: '表盘和标签页标题',
    idle: '未启用',
    awakeUntil: '常亮中 · 至',
    awakeFor: '常亮中 · 不限时',
    fb: '常亮中 · 视频备用',
    paused: '已暂停',
    needs: '轻触以继续',
    blocked: '已被阻止 · 省电模式',
    ended: '已结束于 ',
    unsup: '此浏览器不支持',
    left: '剩余',
    until: '至 ',
    endsAt: '结束于 ',
    wouldEnd: '将结束于 ',
    min: ' 分钟',
    hour: '1 小时',
    hours2: '2 小时',
    untilT: '直到…',
    label0: '向董事会演示',
    forLen: ' · 结束于 ',
  },
  hi: {
    soundNav: 'ध्वनि',
    studio: 'डायल स्टूडियो',
    keep: 'स्क्रीन जगाए रखें',
    pause: 'रोकें',
    resume: 'फिर शुरू करें',
    stop: 'बंद करें',
    ext15: '+15 मिनट',
    again: 'फिर से शुरू करें',
    starting: 'शुरू हो रहा है…',
    fix: 'समाधान देखें',
    fallback: 'वीडियो विकल्प इस्तेमाल करें',
    timer: 'टाइमर',
    faces: 'डायल',
    presets: 'प्रीसेट',
    history: 'इतिहास',
    devices: 'डिवाइस',
    settings: 'सेटिंग्स',
    help: 'मदद',
    more: 'और',
    search: 'खोजें या जाएँ…',
    session: 'सत्र',
    length: 'अवधि',
    label: 'लेबल',
    face: 'डायल',
    allFaces: 'सभी 33',
    options: 'विकल्प',
    level: 'जगाए रखने का स्तर',
    screen: 'स्क्रीन',
    system: 'सिस्टम · ऐप',
    sound: 'खत्म होने पर झंकार',
    soundD: 'दो सुरों की हल्की झंकार',
    dim: 'रात में घड़ी धीमी करें',
    dimD: 'रात 10:00 बजे के बाद',
    secs: 'सेकंड दिखाएँ',
    secsD: 'डायल और टैब शीर्षक पर',
    idle: 'बंद है',
    awakeUntil: 'जागृत · ',
    awakeFor: 'जागृत · बिना अंत',
    fb: 'जागृत · वीडियो विकल्प',
    paused: 'रुका हुआ',
    needs: 'फिर शुरू करने के लिए टैप करें',
    blocked: 'अवरुद्ध · बैटरी सेवर',
    ended: 'समाप्त ',
    unsup: 'यहाँ समर्थित नहीं',
    left: 'बाकी',
    until: 'तक ',
    endsAt: 'समाप्त ',
    wouldEnd: 'समाप्त होगा ',
    min: ' मिनट',
    hour: '1 घंटा',
    hours2: '2 घंटे',
    untilT: 'समय तक…',
    label0: 'बोर्ड के सामने प्रस्तुति',
    forLen: ' · समाप्त ',
  },
};

// The word above the digits on a localised face, per state (English faces carry their own).
export const FACE_TOP: Record<Exclude<TToolLang, 'en'>, Record<string, string>> = {
  de: {
    idle: 'bereit',
    starting: 'startet',
    running: 'übrig',
    fallback: 'übrig',
    paused: 'pausiert',
    needsyou: 'tippen',
    blocked: 'nicht aktiv',
    unsupported: 'nicht aktiv',
    ended: 'abgelaufen',
  },
  ja: {
    idle: '準備完了',
    starting: '開始中',
    running: '残り',
    fallback: '残り',
    paused: '一時停止中',
    needsyou: '要タップ',
    blocked: '未保持',
    unsupported: '未保持',
    ended: '終了',
  },
  zh: {
    idle: '就绪',
    starting: '正在启动',
    running: '剩余',
    fallback: '剩余',
    paused: '已暂停',
    needsyou: '需要轻触',
    blocked: '未常亮',
    unsupported: '未常亮',
    ended: '已结束',
  },
  hi: {
    idle: 'तैयार',
    starting: 'शुरू हो रहा',
    running: 'बाकी',
    fallback: 'बाकी',
    paused: 'रुका हुआ',
    needsyou: 'टैप करें',
    blocked: 'जागृत नहीं',
    unsupported: 'जागृत नहीं',
    ended: 'समय पूरा',
  },
};

export function isToolLang(v: unknown): v is TToolLang {
  return typeof v === 'string' && (TOOL_LANGS as readonly string[]).includes(v);
}
