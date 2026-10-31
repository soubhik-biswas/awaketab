import catalogs from 'virtual:at-catalogs-bg';
import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import type { IExtApi } from '../src/api';
import { createController } from '../src/controller';
import { mockPower } from '../src/test-hooks';

export default defineBackground({
  type: 'module',
  main() {
    const real = browser as unknown as IExtApi;
    const api: IExtApi = __AT_TEST__
      ? (Object.create(real, { power: { value: mockPower(real.storage.session, real.storage.onChanged) } }) as IExtApi)
      : real;
    const ctl = createController({ api, catalogs });
    const run = (task: Promise<unknown>) => {
      task.catch((error: unknown) => {
        console.error('[AwakeTab]', error);
      });
    };

    api.runtime.onStartup.addListener(() => {
      run(ctl.onStartup());
    });
    api.runtime.onInstalled.addListener((details) => {
      run(ctl.onInstalled(details.reason));
    });
    api.alarms.onAlarm.addListener((alarm) => {
      run(ctl.onAlarm(alarm.name));
    });
    api.commands.onCommand.addListener((command) => {
      run(ctl.onCommand(command));
    });
    api.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Only this extension's own pages talk to the worker (no externally_connectable, no content scripts).
      if ((sender as { id?: string } | undefined)?.id !== api.runtime.id) return undefined;
      ctl.onMessage(message).then(sendResponse, () => {
        sendResponse(null);
      });
      return true;
    });
    api.storage.onChanged.addListener((changes, areaName) => {
      run(ctl.onStorageChanged(changes, areaName));
    });
    api.tabs.onUpdated.addListener((tabId, change, tab) => {
      run(ctl.onTabUpdated(tabId, change, tab));
    });
    api.tabs.onRemoved.addListener((tabId) => {
      run(ctl.onTabRemoved(tabId));
    });
    api.tabs.onActivated.addListener((info) => {
      run(ctl.onTabActivated(info));
    });
    api.windows?.onFocusChanged.addListener((windowId) => {
      run(ctl.onWindowFocus(windowId));
    });
    api.permissions.onRemoved.addListener(() => {
      run(ctl.onPermissionsRemoved());
    });

    run(ctl.ready());
  },
});
