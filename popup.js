document.addEventListener('DOMContentLoaded', () => {
    const ELEMENTS = {
        applicationNoInput: document.getElementById('applicationNo'),
        preheaderInput: document.getElementById('preheader'),
        titleInput: document.getElementById('title'),
        setValuesButton: document.getElementById('setValues'),
        outputArea: document.getElementById('outputArea'),
        checklistArea: document.getElementById('checklistArea'),
        mailOption: document.getElementById('mailOption'),
        webOption: document.getElementById('webOption'),
        checkAllButton: document.getElementById('checkAll'),
        checkSelectedButton: document.getElementById('checkSelected'),
        resetButton: document.getElementById('resetButton')
    };

    const CHECKLIST_ITEMS = {
        mail: [
            'タイトルは正しいか',
            'プリヘッダーは正しいか',
            '冒頭に変数があり、正しい申込番号が入っているか',
            '画像のリンク切れはないか',
            '$$$utm_campaign$$$がないか',
            '※画像がうまく表示されない方はこちらがあるか',
            'bodyタグ直下に開封タグはあるか'
        ],
        web: [
            'タイトルは正しいか',
            'プリヘッダーはないか',
            '冒頭に変数はないか',
            '画像のリンク切れはないか',
            '$$$utm_campaign$$$がないか',
            '※画像がうまく表示されない方はこちらをご覧ください。はないか',
            '開封タグはないか',
            'ウェブページのタイトルを確認',
            'noindexの記述はあるか'
        ]
    };

    function escapeId(id) {
        return id.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    function loadValues() {
        const values = {
            applicationNo: localStorage.getItem('applicationNo') || '',
            preheader: localStorage.getItem('preheader') || '',
            title: localStorage.getItem('title') || ''
        };

        Object.keys(values).forEach(key => {
            ELEMENTS[`${key}Input`].value = values[key];
        });

        updateOutputArea(values);
    }

    function saveValues() {
        Object.keys(ELEMENTS).forEach(key => {
            if (key.endsWith('Input')) {
                const localStorageKey = key.replace('Input', '');
                localStorage.setItem(localStorageKey, ELEMENTS[key].value);
            }
        });
    }

    function updateOutputArea({ applicationNo, preheader, title }) {
        ELEMENTS.outputArea.innerHTML = `
            <strong>申込番号:</strong> ${applicationNo}<br>
            <strong>プリヘッダー:</strong> ${preheader}<br>
            <strong>タイトル:</strong> ${title}<br>
        `;
    }

    function generateChecklistItems(items) {
        return items.map((item, index) => {
            const id = `check_${escapeId(item)}`;
            return `
                <li>
                    <input type="checkbox" id="${id}" />
                    <label for="${id}">${item}</label>
                </li>
            `;
        }).join('');
    }

    function updateChecklist() {
        const checklistType = ELEMENTS.mailOption.checked ? 'mail' : 'web';
        const checklistItems = CHECKLIST_ITEMS[checklistType];
        ELEMENTS.checklistArea.innerHTML = `<ul>${generateChecklistItems(checklistItems)}</ul>`;
    }

    function toggleCheckboxes(checked) {
        document.querySelectorAll('#checklistArea input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = checked;
        });
    }

    function resetForm() {
        Object.keys(ELEMENTS).forEach(key => {
            if (key.endsWith('Input')) {
                ELEMENTS[key].value = '';
            }
        });

        localStorage.clear();
        ELEMENTS.mailOption.checked = true;
        ELEMENTS.webOption.checked = false;

        updateChecklist();
        toggleCheckboxes(false);
        location.reload()
    }

    function getPageTitle(callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs.length > 0) {
                chrome.scripting.executeScript(
                    {
                        target: { tabId: tabs[0].id },
                        func: () => document.title
                    },
                    results => callback(results?.[0]?.result ?? null)
                );
            } else {
                callback(null);
            }
        });
    }

    function handleCheckSelected() {
        const checklistType = ELEMENTS.mailOption.checked ? 'mail' : 'web';
        const titleItemId = `check_${escapeId('タイトルは正しいか')}`;
        const titleCorrect = document.getElementById(titleItemId)?.checked;

        if (titleCorrect) {
            getPageTitle(pageTitle => {
                const storedTitle = localStorage.getItem('title');
                alert(pageTitle === storedTitle ? 'チェックOK!' : 'タイトルに誤りがあります');
            });
        } else {
            alert('「タイトルは正しいか」にチェックがついていません。');
        }
    }

    ELEMENTS.setValuesButton.addEventListener('click', () => {
        saveValues();
        updateOutputArea({
            applicationNo: ELEMENTS.applicationNoInput.value,
            preheader: ELEMENTS.preheaderInput.value,
            title: ELEMENTS.titleInput.value
        });
    });

    document.querySelectorAll('input[name="checkType"]').forEach(radio => {
        radio.addEventListener('change', updateChecklist);
    });

    ELEMENTS.checkAllButton.addEventListener('click', () => toggleCheckboxes(true));
    ELEMENTS.checkSelectedButton.addEventListener('click', handleCheckSelected);
    ELEMENTS.resetButton.addEventListener('click', resetForm);

    loadValues();
    updateChecklist();
});
