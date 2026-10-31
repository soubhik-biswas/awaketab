export interface IExtEvent<TFn extends (...args: never[]) => unknown> {
  addListener(cb: TFn): void;
  removeListener(cb: TFn): void;
}

export interface IStorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

export interface IStorageAreaApi {
  get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

export interface IAlarm {
  name: string;
  scheduledTime: number;
  periodInMinutes?: number;
}

export interface IAlarmInfo {
  when?: number;
  delayInMinutes?: number;
  periodInMinutes?: number;
}

export interface IPermissions {
  permissions?: string[];
  origins?: string[];
}

export interface ITab {
  id?: number;
  windowId?: number;
  url?: string;
  active?: boolean;
  lastAccessed?: number;
}

export interface ITabQuery {
  url?: string[];
  active?: boolean;
  currentWindow?: boolean;
  lastFocusedWindow?: boolean;
  windowId?: number;
}

export interface IWindow {
  id?: number;
  state?: string;
}

export interface IExtApi {
  power?: {
    requestKeepAwake(level: 'display'): void;
    releaseKeepAwake(): void;
  };
  storage: {
    local: IStorageAreaApi;
    sync?: IStorageAreaApi;
    session?: IStorageAreaApi;
    onChanged: IExtEvent<(changes: Record<string, IStorageChange>, areaName: string) => void>;
  };
  alarms: {
    create(name: string, info: IAlarmInfo): Promise<void>;
    clear(name: string): Promise<boolean>;
    getAll(): Promise<IAlarm[]>;
    onAlarm: IExtEvent<(alarm: IAlarm) => void>;
  };
  action: {
    setBadgeText(details: { text: string }): Promise<void>;
    setBadgeBackgroundColor(details: { color: string }): Promise<void>;
    setBadgeTextColor?(details: { color: string }): Promise<void>;
    setTitle(details: { title: string }): Promise<void>;
  };
  offscreen?: {
    createDocument(p: { url: string; reasons: string[]; justification: string }): Promise<void>;
    closeDocument(): Promise<void>;
  };
  permissions: {
    contains(p: IPermissions): Promise<boolean>;
    request(p: IPermissions): Promise<boolean>;
    remove(p: IPermissions): Promise<boolean>;
    onAdded: IExtEvent<(p: IPermissions) => void>;
    onRemoved: IExtEvent<(p: IPermissions) => void>;
  };
  runtime: {
    id: string;
    getManifest(): { version: string };
    getURL(path: string): string;
    onStartup: IExtEvent<() => void>;
    onInstalled: IExtEvent<(details: { reason: string; previousVersion?: string }) => void>;
    onMessage: IExtEvent<
      (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => boolean | undefined
    >;
    sendMessage(message: unknown): Promise<unknown>;
  };
  commands: {
    onCommand: IExtEvent<(command: string) => void>;
  };
  tabs: {
    query(q: ITabQuery): Promise<ITab[]>;
    create(p: { url: string }): Promise<unknown>;
    onUpdated: IExtEvent<(tabId: number, change: { status?: string; url?: string }, tab: ITab) => void>;
    onRemoved: IExtEvent<(tabId: number) => void>;
    onActivated: IExtEvent<(info: { tabId: number; windowId: number }) => void>;
  };
  windows?: {
    get(windowId: number): Promise<IWindow>;
    onFocusChanged: IExtEvent<(windowId: number) => void>;
  };
  i18n?: { getUILanguage(): string };
}
