// popup.js
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

    function loadValues() {
        const applicationNo = localStorage.getItem('applicationNo') || '';
        const preheader = localStorage.getItem('preheader') || '';
        const title = localStorage.getItem('title') || '';

        ELEMENTS.applicationNoInput.value = applicationNo;
        ELEMENTS.preheaderInput.value = preheader;
        ELEMENTS.titleInput.value = title;

        updateOutputArea(applicationNo, preheader, title);
    }

    function saveValues() {
        const applicationNo = ELEMENTS.applicationNoInput.value;
        const preheader = ELEMENTS.preheaderInput.value;
        const title = ELEMENTS.titleInput.value;

        localStorage.setItem('applicationNo', applicationNo);
        localStorage.setItem('preheader', preheader);
        localStorage.setItem('title', title);
    }

    function updateOutputArea(applicationNo, preheader, title) {
        ELEMENTS.outputArea.innerHTML = `
            <strong>申込番号:</strong> ${applicationNo}<br>
            <strong>プリヘッダー:</strong> ${preheader}<br>
            <strong>タイトル:</strong> ${title}<br>
        `;
    }

    function generateChecklistItems(items) {
        return items.map(item => `
            <li>
                <input type="checkbox" id="${item.replace(/ /g, '_')}" />
                <label for="${item.replace(/ /g, '_')}">${item}</label>
            </li>
        `).join('');
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
        ELEMENTS.applicationNoInput.value = '';
        ELEMENTS.preheaderInput.value = '';
        ELEMENTS.titleInput.value = '';
        ELEMENTS.mailOption.checked = true;
        ELEMENTS.webOption.checked = false;

        updateChecklist();
        toggleCheckboxes(false);
        ELEMENTS.outputArea.style.display = 'none';
    }

    ELEMENTS.setValuesButton.addEventListener('click', () => {
        saveValues();
        updateOutputArea(
            ELEMENTS.applicationNoInput.value,
            ELEMENTS.preheaderInput.value,
            ELEMENTS.titleInput.value
        );
    });

    document.querySelectorAll('input[name="checkType"]').forEach(radio => {
        radio.addEventListener('change', updateChecklist);
    });

    ELEMENTS.checkAllButton.addEventListener('click', () => toggleCheckboxes(true));
    ELEMENTS.checkSelectedButton.addEventListener('click', () => {
        document.querySelectorAll('#checklistArea input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = true;
            }
        });
    });

    ELEMENTS.resetButton.addEventListener('click', resetForm);

    loadValues();
    updateChecklist();
});
