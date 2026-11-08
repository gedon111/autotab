// Tab Cycler: click the toolbar icon to start/stop.
// Every 2 minutes it switches to the next tab in that window and reloads it.

const ALARM = 'switch-tab';

chrome.action.onClicked.addListener(async (tab) => {
  if (await chrome.alarms.get(ALARM)) {
    await stop();
  } else {
    await chrome.storage.local.set({ windowId: tab.windowId });
    chrome.alarms.create(ALARM, { periodInMinutes: 2 });
    chrome.action.setBadgeText({ text: 'ON' });
  }
});

async function stop() {
  await chrome.alarms.clear(ALARM);
  chrome.action.setBadgeText({ text: '' });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return;

  const { windowId } = await chrome.storage.local.get('windowId');
  const tabs = await chrome.tabs.query({ windowId });
  if (tabs.length === 0) return stop(); // window was closed

  tabs.sort((a, b) => a.index - b.index);
  const current = tabs.findIndex((t) => t.active);

  // Next tab after the current one, skipping chrome:// and other non-reloadable pages.
  for (let k = 1; k <= tabs.length; k++) {
    const tab = tabs[(current + k) % tabs.length];
    if (/^(https?|file):/.test(tab.url || '')) {
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.tabs.reload(tab.id);
      return;
    }
  }
});
