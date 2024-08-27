chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            func: () => document.documentElement.innerHTML
        },
        (results) => {
            const pageSource = results[0]?.result;
            if (pageSource) {
                // ページソースを処理する
                chrome.storage.local.set({ pageSource });
                chrome.tabs.create({ url: chrome.runtime.getURL('result.html') });
            }
        }
    );
});
