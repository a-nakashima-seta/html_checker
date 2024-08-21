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
            '※画像がうまく表示されない方はこちらはないか',
            '開封タグはないか',
            'noindexの記述はあるか'
        ]
    };

    const EXTERNAL_URL_REGEX = /^https?:\/\/(?!www\.shizensyokuhin\.jp)(?!shizensyokuhin\.jp)(?!www\.s-shizensyokuhin\.jp)(?!s-shizensyokuhin\.jp)/;
    const SPECIAL_TEXT = '※画像がうまく表示されない方はこちら';

    function escapeId(id) {
        return id
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '')
            .substring(0, 50);
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
                localStorage.setItem(key.replace('Input', ''), ELEMENTS[key].value);
            }
        });
    }

    function updateOutputArea({ applicationNo, preheader, title }) {
        ELEMENTS.outputArea.innerHTML = `
            <strong>申込番号:</strong> ${applicationNo}<br>
            <strong>タイトル:</strong> ${title}<br>
            <strong>プリヘッダー:</strong> ${preheader}<br>
        `;
    }

    function generateChecklistItems(items, type) {
        return items.map((item, index) => {
            const id = `${type}_check_${index}_${escapeId(item)}`;
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
        ELEMENTS.checklistArea.innerHTML = `<ul>${generateChecklistItems(CHECKLIST_ITEMS[checklistType], checklistType)}</ul>`;
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
        location.reload();
    }

    function getPageSourceCode(callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs.length > 0) {
                chrome.scripting.executeScript(
                    {
                        target: { tabId: tabs[0].id },
                        func: () => document.documentElement.innerHTML
                    },
                    results => callback(results?.[0]?.result ?? null)
                );
            } else {
                callback(null);
            }
        });
    }

    function checkMailApplicationNo(pageSource) {
        const applicationNo = localStorage.getItem('applicationNo');
        const pattern = new RegExp(`SET @application_no = '${applicationNo}'`);
        return pattern.test(pageSource) ? null : '・冒頭変数または申込番号に誤りがあります';
    }

    function checkWebApplicationNo(pageSource) {
        const applicationNo = localStorage.getItem('applicationNo');
        const pattern = new RegExp(`SET @application_no = '${applicationNo}'`);
        return !pattern.test(pageSource) ? null : '・冒頭変数を削除してください';
    }

    function checkPageTitle(pageSource) {
        const title = localStorage.getItem('title');
        const pattern = new RegExp(`<title>${title}</title>`, 'i');
        const titleMatch = pageSource.match(/<title>([^<]*)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1] : '';
        return title === pageTitle ? null : '・タイトルに誤りがあります';
    }

    function checkImageLinks(pageSource) {
        return new Promise((resolve) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(pageSource, 'text/html');
            const images = doc.querySelectorAll('img');
            const errors = [];
            const totalImages = images.length;
            let loadedImages = 0;

            if (totalImages === 0) {
                resolve(errors);
                return;
            }

            images.forEach((img, index) => {
                const src = img.getAttribute('src');
                if (!src) {
                    errors.push(`・画像${index + 1}のsrc属性が空です。`);
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        errors.sort();
                        resolve(errors);
                    }
                    return;
                }

                if (EXTERNAL_URL_REGEX.test(src)) {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        errors.sort();
                        resolve(errors);
                    }
                    return;
                }

                const imgElement = new Image();
                imgElement.src = src;
                imgElement.onload = () => {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        errors.sort();
                        resolve(errors);
                    }
                };
                imgElement.onerror = () => {
                    errors.push(`・画像${index + 1}（URL: ${src}）がリンク切れです。`);
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        errors.sort();
                        resolve(errors);
                    }
                };
            });
        });
    }

    function checkUTMCampaign(pageSource) {
        const pattern = /\$\$\$utm_campaign\$\$\$/;
        return pattern.test(pageSource) ? '・$$$utm_campaign$$$が存在します' : null;
    }

    function checkForSpecialText(pageSource) {
        const isMail = ELEMENTS.mailOption.checked;
        const textPattern = new RegExp(SPECIAL_TEXT, 'i');
        const textExists = textPattern.test(pageSource);

        return isMail
            ? textExists ? null : `・${SPECIAL_TEXT}を追加してください`
            : textExists ? `・${SPECIAL_TEXT}は削除してください` : null;
    }

    function checkNoIndexMetaTag(pageSource) {
        const commentPattern = /<!--.*?<meta\s+name=["']robots["']\s+content=["']noindex["']\s*\/?>.*?-->/is;
        const metaPattern = /<meta\s+name=["']robots["']\s+content=["']noindex["']\s*\/?>/i;
        const noIndexInComments = commentPattern.test(pageSource);
        const noIndexInCode = metaPattern.test(pageSource);

        return ELEMENTS.webOption.checked
            ? (noIndexInCode || noIndexInComments)
                ? null
                : '・noindexの記述がありません。head内に<meta name="robots" content="noindex">を追加してください'
            : null;
    }

    async function performChecks(pageSource) {
        const checklistType = ELEMENTS.mailOption.checked ? 'mail' : 'web';
        const checklistItems = CHECKLIST_ITEMS[checklistType];
        const errors = [];

        const checkPromises = checklistItems.map(async (item, index) => {
            const itemId = `${checklistType}_check_${index}_${escapeId(item)}`;
            const itemChecked = document.getElementById(itemId)?.checked;

            if (itemChecked) {
                let error;
                switch (item) {
                    case '冒頭に変数があり、正しい申込番号が入っているか':
                        error = checkMailApplicationNo(pageSource);
                        break;
                    case '冒頭に変数はないか':
                        error = checkWebApplicationNo(pageSource);
                        break;
                    case 'タイトルは正しいか':
                        error = checkPageTitle(pageSource);
                        break;
                    case '画像のリンク切れはないか':
                        const imageErrors = await checkImageLinks(pageSource);
                        errors.push(...imageErrors);
                        return;
                    case '$$$utm_campaign$$$がないか':
                        error = checkUTMCampaign(pageSource);
                        break;
                    case '※画像がうまく表示されない方はこちらがあるか':
                    case '※画像がうまく表示されない方はこちらはないか':
                        error = checkForSpecialText(pageSource);
                        break;
                    case 'noindexの記述はあるか':
                        error = checkNoIndexMetaTag(pageSource);
                        break;
                    default:
                        break;
                }
                if (error) {
                    errors.push(error);
                }
            }
        });

        await Promise.all(checkPromises);

        alert(errors.length > 0 ? `チェックに失敗しました:\n${errors.sort().join('\n')}` : 'OKです!');
    }

    function handleCheckSelected() {
        // 少なくとも1つのチェックリスト項目が選択されているか確認する
        const selectedItems = document.querySelectorAll('#checklistArea input[type="checkbox"]:checked');

        if (selectedItems.length === 0) {
            alert('チェック項目を選択してください');
            return;
        }


        getPageSourceCode(pageSource => {
            if (pageSource) {
                performChecks(pageSource);
            } else {
                alert('ページのソースコードを取得できませんでした。');
            }
        });
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
