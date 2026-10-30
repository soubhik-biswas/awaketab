import type { IToolStrings, TToolLang } from '@/lib/tool/strings';

// Tool copy beyond the drawn string table (menu, sheets, accessible names, announcements); {x} goes through fill().
export interface IToolChrome {
  menu: string;
  close: string;
  controls: string;
  addMin: string;
  addHour: string;
  minutes: string;
  hoursN: string;
  noEnd: string;
  faceBtn: string;
  fullscreen: string;
  exitFull: string;
  searchCmds: string;
  themeIs: string;
  light: string;
  dark: string;
  oled: string;
  share: string;
  ambient: string;
  account: string;
  extension: string;
  clearTitle: string;
  extendTitle: string;
  welcome: string;
  anStart: string;
  anStartOpen: string;
  anExtend: string;
  anLow: string;
  anHidden: string;
  anRefused: string;
  anEnded: string;
  faceOpen: string;
  faceUp: string;
  faceLeft1: string;
  faceLeft: string;
  tabLeft: string;
  tabAwake: string;
  tabBlocked: string;
  tabUp: string;
  tExt: string;
  tExtD: string;
  undo: string;
  tLow: string;
  tLowD: string;
  tUpD: string;
  copied: string;
  copiedD: string;
  done: string;
  savedPreset: string;
  savedPresetD: string;
  noEndNote: string;
  pausedHidden: string;
  palTitle: string;
  palPlaceholder: string;
  palEmpty: string;
  palHint: string;
  palMove: string;
  palRun: string;
  palClose: string;
  palClosePalette: string;
  palResults: string;
  palResult1: string;
  palCommands: string;
  palCommand1: string;
  gGo: string;
  gLook: string;
  cStopAwake: string;
  cExt15: string;
  cExt60: string;
  cUntil: string;
  cLen: string;
  cLenOpen: string;
  cFace: string;
  cPreset: string;
  cOpenPresets: string;
  cOpenHistory: string;
  cOpenSettings: string;
  cToggleTheme: string;
  theme: string;
  segAuto: string;
  segLight: string;
  segDark: string;
  clockSound: string;
  h12: string;
  h12D: string;
  language: string;
  langHelp: string;
  motion: string;
  motionD: string;
  data: string;
  clearBtn: string;
  privacy: string;
  terms: string;
  contact: string;
  orUntil: string;
  keepUntilLabel: string;
  extendTo: string;
  keepUntil: string;
}

export const CHROME: Record<TToolLang, IToolChrome> = {
  en: {
    menu: 'Menu',
    close: 'Close {title}',
    controls: 'Session controls',
    addMin: 'Add {n} minutes',
    addHour: 'Add 1 hour',
    minutes: '{n} minutes',
    hoursN: '{n} hours',
    noEnd: 'No end',
    faceBtn: 'Clock face: {name}. Change face',
    fullscreen: 'Fullscreen',
    exitFull: 'Exit fullscreen',
    searchCmds: 'Search and commands',
    themeIs: 'Theme: {name}',
    light: 'light',
    dark: 'dark',
    oled: 'OLED black',
    share: 'Share this setup',
    ambient: 'Ambient sound',
    account: 'Account',
    extension: 'Get the browser extension',
    clearTitle: 'Clear history',
    extendTitle: 'Extend session',
    welcome: 'Welcome',
    anStart: 'Screen awake until {time}.',
    anStartOpen: 'Screen awake, no end.',
    anExtend: 'Extended by {n} minutes. Now until {time}.',
    anLow: '5 minutes left. Extend with plus.',
    anHidden: 'Paused — come back to this tab to continue.',
    anRefused: 'Not awake. The browser refused the lock. See the fix.',
    anEnded: 'Time’s up. Ended at {time}; the screen can sleep again.',
    faceOpen: '{n} minutes awake, no end',
    faceUp: 'Time’s up, ended at {time}',
    faceLeft1: '1 minute left, until {time}',
    faceLeft: '{n} minutes left, until {time}',
    tabLeft: '{t} left',
    tabAwake: 'Awake',
    tabBlocked: 'Blocked',
    tabUp: 'Time’s up',
    tExt: 'Awake until {time}',
    tExtD: 'Extended by {n} minutes.',
    undo: 'Undo',
    tLow: '5 minutes left',
    tLowD: 'Ends at {time}.',
    tUpD: 'Ended at {time}. The screen can sleep again.',
    copied: 'Link copied',
    copiedD: 'Paste it anywhere. Your label is not included.',
    done: 'Done',
    savedPreset: 'Saved “{label}”',
    savedPresetD: '{len} · press {n} to start it.',
    noEndNote: 'No end — runs until you stop it.',
    pausedHidden: 'Paused · tab hidden',
    palTitle: 'Command palette',
    palPlaceholder: 'Type a command or search…',
    palEmpty: 'No commands match “{q}”',
    palHint: 'Try “extend”, “face” or “theme”.',
    palMove: 'move',
    palRun: 'run',
    palClose: 'close',
    palClosePalette: 'Close palette',
    palResults: '{n} results',
    palResult1: '1 result',
    palCommands: '{n} commands',
    palCommand1: '1 command',
    gGo: 'Go to',
    gLook: 'Appearance',
    cStopAwake: 'Stop keeping awake',
    cExt15: 'Extend 15 minutes',
    cExt60: 'Extend 1 hour',
    cUntil: 'Keep awake until…',
    cLen: 'Set length: {len}',
    cLenOpen: 'until I stop it',
    cFace: 'Face: {name}',
    cPreset: 'Start preset: {name}',
    cOpenPresets: 'Open presets',
    cOpenHistory: 'Open history',
    cOpenSettings: 'Open settings',
    cToggleTheme: 'Toggle theme',
    theme: 'Theme',
    segAuto: 'Auto',
    segLight: 'Light',
    segDark: 'Dark',
    clockSound: 'Clock and sound',
    h12: '12-hour clock',
    h12D: 'Shows 11:42 AM instead of 11:42',
    language: 'Language',
    langHelp: 'Also {list}.',
    motion: 'Motion',
    motionD: 'Follows your system’s reduce-motion setting. Faces then change digits without flips, rolls or glow.',
    data: 'Data',
    clearBtn: 'Clear history…',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    orUntil: 'Or until a time',
    keepUntilLabel: 'Keep awake until',
    extendTo: 'Extend to {time}',
    keepUntil: 'Keep awake until {time}',
  },
  de: {
    menu: 'Menü',
    close: '{title} schließen',
    controls: 'Sitzungssteuerung',
    addMin: '{n} Minuten hinzufügen',
    addHour: '1 Stunde hinzufügen',
    minutes: '{n} Minuten',
    hoursN: '{n} Stunden',
    noEnd: 'Ohne Ende',
    faceBtn: 'Zifferblatt: {name}. Zifferblatt wechseln',
    fullscreen: 'Vollbild',
    exitFull: 'Vollbild beenden',
    searchCmds: 'Suche und Befehle',
    themeIs: 'Design: {name}',
    light: 'hell',
    dark: 'dunkel',
    oled: 'OLED-Schwarz',
    share: 'Diese Einstellung teilen',
    ambient: 'Umgebungsklang',
    account: 'Konto',
    extension: 'Browsererweiterung holen',
    clearTitle: 'Verlauf löschen',
    extendTitle: 'Sitzung verlängern',
    welcome: 'Willkommen',
    anStart: 'Bildschirm wach bis {time}.',
    anStartOpen: 'Bildschirm wach, ohne Ende.',
    anExtend: 'Um {n} Minuten verlängert. Jetzt bis {time}.',
    anLow: 'Noch 5 Minuten. Mit Plus verlängern.',
    anHidden: 'Pausiert — kehren Sie zu diesem Tab zurück, um fortzufahren.',
    anRefused: 'Nicht wach. Der Browser hat die Sperre abgelehnt. Siehe Lösung.',
    anEnded: 'Zeit ist um. Beendet um {time}; der Bildschirm darf wieder schlafen.',
    faceOpen: '{n} Minuten wach, ohne Ende',
    faceUp: 'Zeit ist um, beendet um {time}',
    faceLeft1: 'Noch 1 Minute, bis {time}',
    faceLeft: 'Noch {n} Minuten, bis {time}',
    tabLeft: 'noch {t}',
    tabAwake: 'Wach',
    tabBlocked: 'Blockiert',
    tabUp: 'Zeit ist um',
    tExt: 'Wach bis {time}',
    tExtD: 'Um {n} Minuten verlängert.',
    undo: 'Rückgängig',
    tLow: 'Noch 5 Minuten',
    tLowD: 'Endet um {time}.',
    tUpD: 'Beendet um {time}. Der Bildschirm darf wieder schlafen.',
    copied: 'Link kopiert',
    copiedD: 'Fügen Sie ihn überall ein. Ihre Bezeichnung ist nicht enthalten.',
    done: 'Fertig',
    savedPreset: '„{label}“ gespeichert',
    savedPresetD: '{len} · zum Starten {n} drücken.',
    noEndNote: 'Ohne Ende — läuft, bis Sie es beenden.',
    pausedHidden: 'Pausiert · Tab verborgen',
    palTitle: 'Befehlspalette',
    palPlaceholder: 'Befehl eingeben oder suchen…',
    palEmpty: 'Kein Befehl passt zu „{q}“',
    palHint: 'Versuchen Sie „verlängern“, „Zifferblatt“ oder „Design“.',
    palMove: 'bewegen',
    palRun: 'ausführen',
    palClose: 'schließen',
    palClosePalette: 'Palette schließen',
    palResults: '{n} Ergebnisse',
    palResult1: '1 Ergebnis',
    palCommands: '{n} Befehle',
    palCommand1: '1 Befehl',
    gGo: 'Gehe zu',
    gLook: 'Darstellung',
    cStopAwake: 'Wachhalten beenden',
    cExt15: 'Um 15 Minuten verlängern',
    cExt60: 'Um 1 Stunde verlängern',
    cUntil: 'Wach halten bis…',
    cLen: 'Dauer festlegen: {len}',
    cLenOpen: 'bis ich es beende',
    cFace: 'Zifferblatt: {name}',
    cPreset: 'Vorlage starten: {name}',
    cOpenPresets: 'Vorlagen öffnen',
    cOpenHistory: 'Verlauf öffnen',
    cOpenSettings: 'Einstellungen öffnen',
    cToggleTheme: 'Design wechseln',
    theme: 'Design',
    segAuto: 'Auto',
    segLight: 'Hell',
    segDark: 'Dunkel',
    clockSound: 'Uhr und Klang',
    h12: '12-Stunden-Uhr',
    h12D: 'Gilt für Englisch; auf Deutsch zeigt die Uhr immer 24 Stunden',
    language: 'Sprache',
    langHelp: 'Auch {list}.',
    motion: 'Bewegung',
    motionD:
      'Folgt der Systemeinstellung „Bewegung reduzieren“. Zifferblätter wechseln die Ziffern dann ohne Klappen, Rollen oder Leuchten.',
    data: 'Daten',
    clearBtn: 'Verlauf löschen…',
    privacy: 'Datenschutz',
    terms: 'Nutzungsbedingungen',
    contact: 'Kontakt',
    orUntil: 'Oder bis zu einer Uhrzeit',
    keepUntilLabel: 'Wach halten bis',
    extendTo: 'Verlängern bis {time}',
    keepUntil: 'Wach halten bis {time}',
  },
  ja: {
    menu: 'メニュー',
    close: '{title}を閉じる',
    controls: 'セッションの操作',
    addMin: '{n}分追加',
    addHour: '1時間追加',
    minutes: '{n}分',
    hoursN: '{n}時間',
    noEnd: '終了なし',
    faceBtn: '文字盤：{name}。文字盤を変更',
    fullscreen: '全画面表示',
    exitFull: '全画面表示を終了',
    searchCmds: '検索とコマンド',
    themeIs: 'テーマ：{name}',
    light: 'ライト',
    dark: 'ダーク',
    oled: 'OLEDブラック',
    share: 'この設定を共有',
    ambient: '環境音',
    account: 'アカウント',
    extension: 'ブラウザー拡張機能を入手',
    clearTitle: '履歴を消去',
    extendTitle: 'セッションを延長',
    welcome: 'ようこそ',
    anStart: '{time}まで画面をつけたままにします。',
    anStartOpen: '画面をつけたままにします。終了時刻はありません。',
    anExtend: '{n}分延長しました。{time}までです。',
    anLow: '残り5分です。プラスキーで延長できます。',
    anHidden: '一時停止中 — 続けるにはこのタブに戻ってください。',
    anRefused: '点灯していません。ブラウザーがロックを拒否しました。解決方法をご覧ください。',
    anEnded: '時間になりました。{time}に終了しました。画面は再びスリープできます。',
    faceOpen: '点灯して{n}分、終了なし',
    faceUp: '時間になりました。{time}に終了',
    faceLeft1: '残り1分、{time}まで',
    faceLeft: '残り{n}分、{time}まで',
    tabLeft: '残り{t}',
    tabAwake: '点灯中',
    tabBlocked: 'ブロック',
    tabUp: '時間になりました',
    tExt: '{time}まで点灯',
    tExtD: '{n}分延長しました。',
    undo: '元に戻す',
    tLow: '残り5分',
    tLowD: '{time}に終了します。',
    tUpD: '{time}に終了しました。画面は再びスリープできます。',
    copied: 'リンクをコピーしました',
    copiedD: 'どこにでも貼り付けられます。ラベルは含まれません。',
    done: '完了',
    savedPreset: '「{label}」を保存しました',
    savedPresetD: '{len} · {n}キーで開始します。',
    noEndNote: '終了なし — 停止するまで続きます。',
    pausedHidden: '一時停止中 · タブが非表示',
    palTitle: 'コマンドパレット',
    palPlaceholder: 'コマンドを入力または検索…',
    palEmpty: '「{q}」に一致するコマンドはありません',
    palHint: '「延長」「文字盤」「テーマ」などを試してください。',
    palMove: '移動',
    palRun: '実行',
    palClose: '閉じる',
    palClosePalette: 'パレットを閉じる',
    palResults: '{n}件の結果',
    palResult1: '1件の結果',
    palCommands: '{n}件のコマンド',
    palCommand1: '1件のコマンド',
    gGo: '移動',
    gLook: '表示',
    cStopAwake: 'スリープ防止を停止',
    cExt15: '15分延長',
    cExt60: '1時間延長',
    cUntil: '指定時刻までつけたままにする…',
    cLen: '時間を設定：{len}',
    cLenOpen: '停止するまで',
    cFace: '文字盤：{name}',
    cPreset: 'プリセットを開始：{name}',
    cOpenPresets: 'プリセットを開く',
    cOpenHistory: '履歴を開く',
    cOpenSettings: '設定を開く',
    cToggleTheme: 'テーマを切り替え',
    theme: 'テーマ',
    segAuto: '自動',
    segLight: 'ライト',
    segDark: 'ダーク',
    clockSound: '時計とサウンド',
    h12: '12時間表示',
    h12D: '午前11:42 のように表示（オフにすると 11:42）',
    language: '言語',
    langHelp: 'ほかに {list}。',
    motion: 'モーション',
    motionD:
      'システムの「視差効果を減らす」設定に従います。その場合、文字盤はめくり・回転・発光なしで数字を切り替えます。',
    data: 'データ',
    clearBtn: '履歴を消去…',
    privacy: 'プライバシー',
    terms: '利用規約',
    contact: 'お問い合わせ',
    orUntil: 'または時刻まで',
    keepUntilLabel: 'この時刻までつけたままにする',
    extendTo: '{time}まで延長',
    keepUntil: '{time}までつけたままにする',
  },
  zh: {
    menu: '菜单',
    close: '关闭{title}',
    controls: '会话控制',
    addMin: '增加 {n} 分钟',
    addHour: '增加 1 小时',
    minutes: '{n} 分钟',
    hoursN: '{n} 小时',
    noEnd: '不限时',
    faceBtn: '表盘：{name}。更换表盘',
    fullscreen: '全屏',
    exitFull: '退出全屏',
    searchCmds: '搜索和命令',
    themeIs: '主题：{name}',
    light: '浅色',
    dark: '深色',
    oled: 'OLED 纯黑',
    share: '分享此设置',
    ambient: '环境音',
    account: '账户',
    extension: '获取浏览器扩展',
    clearTitle: '清除历史记录',
    extendTitle: '延长会话',
    welcome: '欢迎',
    anStart: '屏幕将常亮至{time}。',
    anStartOpen: '屏幕保持常亮，不限时。',
    anExtend: '已延长 {n} 分钟。现在至{time}。',
    anLow: '还剩 5 分钟。按加号键延长。',
    anHidden: '已暂停 — 返回此标签页即可继续。',
    anRefused: '未常亮。浏览器拒绝了唤醒锁。请查看解决办法。',
    anEnded: '时间到。已于{time}结束，屏幕可以再次休眠。',
    faceOpen: '已常亮 {n} 分钟，不限时',
    faceUp: '时间到，已于{time}结束',
    faceLeft1: '剩余 1 分钟，至{time}',
    faceLeft: '剩余 {n} 分钟，至{time}',
    tabLeft: '剩余 {t}',
    tabAwake: '常亮中',
    tabBlocked: '已被阻止',
    tabUp: '时间到',
    tExt: '常亮至{time}',
    tExtD: '已延长 {n} 分钟。',
    undo: '撤销',
    tLow: '还剩 5 分钟',
    tLowD: '将于{time}结束。',
    tUpD: '已于{time}结束。屏幕可以再次休眠。',
    copied: '链接已复制',
    copiedD: '可粘贴到任何地方。不包含你的标签。',
    done: '完成',
    savedPreset: '已保存“{label}”',
    savedPresetD: '{len} · 按 {n} 键开始。',
    noEndNote: '不限时 — 运行到你停止为止。',
    pausedHidden: '已暂停 · 标签页已隐藏',
    palTitle: '命令面板',
    palPlaceholder: '输入命令或搜索…',
    palEmpty: '没有与“{q}”匹配的命令',
    palHint: '试试“延长”“表盘”或“主题”。',
    palMove: '移动',
    palRun: '执行',
    palClose: '关闭',
    palClosePalette: '关闭命令面板',
    palResults: '{n} 个结果',
    palResult1: '1 个结果',
    palCommands: '{n} 个命令',
    palCommand1: '1 个命令',
    gGo: '前往',
    gLook: '外观',
    cStopAwake: '停止保持常亮',
    cExt15: '延长 15 分钟',
    cExt60: '延长 1 小时',
    cUntil: '保持常亮直到…',
    cLen: '设置时长：{len}',
    cLenOpen: '直到我停止',
    cFace: '表盘：{name}',
    cPreset: '启动预设：{name}',
    cOpenPresets: '打开预设',
    cOpenHistory: '打开历史记录',
    cOpenSettings: '打开设置',
    cToggleTheme: '切换主题',
    theme: '主题',
    segAuto: '自动',
    segLight: '浅色',
    segDark: '深色',
    clockSound: '时钟和声音',
    h12: '12 小时制',
    h12D: '显示为上午11:42（关闭则显示 11:42）',
    language: '语言',
    langHelp: '另有 {list}。',
    motion: '动效',
    motionD: '跟随系统的“减弱动态效果”设置。开启后，表盘切换数字时不再翻页、滚动或发光。',
    data: '数据',
    clearBtn: '清除历史记录…',
    privacy: '隐私',
    terms: '条款',
    contact: '联系',
    orUntil: '或直到某个时间',
    keepUntilLabel: '保持常亮直到',
    extendTo: '延长至{time}',
    keepUntil: '保持常亮至{time}',
  },
  hi: {
    menu: 'मेनू',
    close: '{title} बंद करें',
    controls: 'सत्र नियंत्रण',
    addMin: '{n} मिनट जोड़ें',
    addHour: '1 घंटा जोड़ें',
    minutes: '{n} मिनट',
    hoursN: '{n} घंटे',
    noEnd: 'बिना अंत',
    faceBtn: 'डायल: {name}। डायल बदलें',
    fullscreen: 'फ़ुलस्क्रीन',
    exitFull: 'फ़ुलस्क्रीन से बाहर निकलें',
    searchCmds: 'खोज और कमांड',
    themeIs: 'थीम: {name}',
    light: 'हल्की',
    dark: 'गहरी',
    oled: 'OLED काली',
    share: 'यह सेटअप साझा करें',
    ambient: 'परिवेश ध्वनि',
    account: 'खाता',
    extension: 'ब्राउज़र एक्सटेंशन पाएँ',
    clearTitle: 'इतिहास मिटाएँ',
    extendTitle: 'सत्र बढ़ाएँ',
    welcome: 'स्वागत है',
    anStart: 'स्क्रीन {time} तक जागृत रहेगी।',
    anStartOpen: 'स्क्रीन जागृत है, बिना अंत।',
    anExtend: '{n} मिनट बढ़ाया गया। अब {time} तक।',
    anLow: '5 मिनट बाकी। प्लस से बढ़ाएँ।',
    anHidden: 'रुका हुआ — जारी रखने के लिए इस टैब पर लौटें।',
    anRefused: 'जागृत नहीं। ब्राउज़र ने लॉक अस्वीकार कर दिया। समाधान देखें।',
    anEnded: 'समय पूरा। {time} पर समाप्त; स्क्रीन फिर से सो सकती है।',
    faceOpen: '{n} मिनट से जागृत, बिना अंत',
    faceUp: 'समय पूरा, {time} पर समाप्त',
    faceLeft1: '1 मिनट बाकी, {time} तक',
    faceLeft: '{n} मिनट बाकी, {time} तक',
    tabLeft: '{t} बाकी',
    tabAwake: 'जागृत',
    tabBlocked: 'अवरुद्ध',
    tabUp: 'समय पूरा',
    tExt: '{time} तक जागृत',
    tExtD: '{n} मिनट बढ़ाया गया।',
    undo: 'पूर्ववत करें',
    tLow: '5 मिनट बाकी',
    tLowD: '{time} पर समाप्त होगा।',
    tUpD: '{time} पर समाप्त। स्क्रीन फिर से सो सकती है।',
    copied: 'लिंक कॉपी हो गया',
    copiedD: 'इसे कहीं भी पेस्ट करें। आपका लेबल शामिल नहीं है।',
    done: 'हो गया',
    savedPreset: '“{label}” सहेजा गया',
    savedPresetD: '{len} · शुरू करने के लिए {n} दबाएँ।',
    noEndNote: 'बिना अंत — जब तक आप बंद न करें, चलता रहेगा।',
    pausedHidden: 'रुका हुआ · टैब छिपा है',
    palTitle: 'कमांड पैलेट',
    palPlaceholder: 'कमांड लिखें या खोजें…',
    palEmpty: '“{q}” से मेल खाता कोई कमांड नहीं',
    palHint: '“बढ़ाएँ”, “डायल” या “थीम” आज़माएँ।',
    palMove: 'चुनें',
    palRun: 'चलाएँ',
    palClose: 'बंद करें',
    palClosePalette: 'पैलेट बंद करें',
    palResults: '{n} परिणाम',
    palResult1: '1 परिणाम',
    palCommands: '{n} कमांड',
    palCommand1: '1 कमांड',
    gGo: 'जाएँ',
    gLook: 'रूप-रंग',
    cStopAwake: 'जगाए रखना बंद करें',
    cExt15: '15 मिनट बढ़ाएँ',
    cExt60: '1 घंटा बढ़ाएँ',
    cUntil: 'इस समय तक जगाए रखें…',
    cLen: 'अवधि तय करें: {len}',
    cLenOpen: 'जब तक मैं बंद न करूँ',
    cFace: 'डायल: {name}',
    cPreset: 'प्रीसेट शुरू करें: {name}',
    cOpenPresets: 'प्रीसेट खोलें',
    cOpenHistory: 'इतिहास खोलें',
    cOpenSettings: 'सेटिंग्स खोलें',
    cToggleTheme: 'थीम बदलें',
    theme: 'थीम',
    segAuto: 'स्वचालित',
    segLight: 'हल्की',
    segDark: 'गहरी',
    clockSound: 'घड़ी और ध्वनि',
    h12: '12-घंटे की घड़ी',
    h12D: '11:42 के बजाय 11:42 पूर्वाह्न दिखाता है',
    language: 'भाषा',
    langHelp: 'और भी: {list}।',
    motion: 'गति',
    motionD: 'आपके सिस्टम की “गति कम करें” सेटिंग का पालन करता है। तब डायल बिना पलटे, घूमे या चमके अंक बदलते हैं।',
    data: 'डेटा',
    clearBtn: 'इतिहास मिटाएँ…',
    privacy: 'गोपनीयता',
    terms: 'शर्तें',
    contact: 'संपर्क',
    orUntil: 'या किसी समय तक',
    keepUntilLabel: 'इस समय तक जगाए रखें',
    extendTo: '{time} तक बढ़ाएँ',
    keepUntil: '{time} तक जगाए रखें',
  },
};

export function fill(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/gu, (all, key: string) => (key in vars ? String(vars[key]) : all));
}

// "1 hour", "45 min", "4 hours" or "No end" in the tool's language.
export function lengthText(sec: number, s: IToolStrings, c: IToolChrome): string {
  if (sec === 0) return c.noEnd;
  if (sec === 3600) return s.hour;
  if (sec === 7200) return s.hours2;
  if (sec % 3600 === 0) return fill(c.hoursN, { n: sec / 3600 });
  return `${Math.round(sec / 60)}${s.min}`;
}
