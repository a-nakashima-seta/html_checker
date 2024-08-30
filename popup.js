document.addEventListener('DOMContentLoaded', () => {
    // DOM要素を取得
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
        resetButton: document.getElementById('resetButton'),
        textArea: document.getElementById('textArea')
    };

    // チェックリストの項目
    const CHECKLIST_ITEMS = {
        mail: [
            'タイトルは正しいか',
            'プリヘッダーは正しいか',
            '冒頭に変数があり、正しい申込番号が入っているか',
            '画像のリンク切れはないか',
            '$$$utm_campaign$$$がないか',
            '※画像がうまく表示されない方はこちらがあるか',
            '開封タグはあるか',
            'フッターが変数化されているか'
        ],
        web: [
            'タイトルは正しいか',
            'プリヘッダーはないか',
            '冒頭に変数はないか',
            '画像のリンク切れはないか',
            '$$$utm_campaign$$$がないか',
            '※画像がうまく表示されない方はこちらはないか',
            '開封タグはないか',
            'noindexの記述はあるか',
            'フッターが変数化されていないか',
            'GTM用の記述があるか',
            'faviconは設定されているか'
        ]
    };

    // 外部URLの正規表現
    const EXTERNAL_URL_REGEX = /^https?:\/\/(?!www\.shizensyokuhin\.jp)(?!shizensyokuhin\.jp)(?!www\.s-shizensyokuhin\.jp)(?!s-shizensyokuhin\.jp)/;
    const SPECIAL_TEXT = '※画像がうまく表示されない方はこちらをご覧ください。';

    // IDをエスケープする関数
    function escapeId(id) {
        return id
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '')
            .substring(0, 50);
    }

    // 保存された値を読み込む
    function loadValues() {
        const values = {
            applicationNo: localStorage.getItem('applicationNo') || '',
            preheader: localStorage.getItem('preheader') || '',
            title: localStorage.getItem('title') || '',
            htmlContent: localStorage.getItem('htmlContent') || ''
        };

        Object.keys(values).forEach(key => {
            if (key === 'htmlContent') {
                ELEMENTS.textArea.value = values[key];
            } else {
                ELEMENTS[`${key}Input`].value = values[key];
            }
        });

        updateOutputArea(values);
        updateOutputMessage(); // メッセージの更新
    }

    // 現在の値を保存する
    function saveValues() {
        Object.keys(ELEMENTS).forEach(key => {
            if (key.endsWith('Input')) {
                localStorage.setItem(key.replace('Input', ''), ELEMENTS[key].value);
            }
        });

        localStorage.setItem('htmlContent', getTextAreaContent());
        updateOutputMessage(); // メッセージの更新
    }

    // 出力エリアを更新する
    function updateOutputArea({ applicationNo, preheader, title }) {
        ELEMENTS.outputArea.innerHTML = `
            <strong>申込番号:</strong> ${applicationNo}<br>
            <strong>タイトル:</strong> ${title}<br>
            <strong>プリヘッダー:</strong> ${preheader}<br>
        `;
    }

    // 出力メッセージを更新する
    function updateOutputMessage() {
        const htmlContent = localStorage.getItem('htmlContent');
        // メッセージのリセット
        ELEMENTS.outputArea.innerHTML = ELEMENTS.outputArea.innerHTML.split('<p style="color: green;">HTMLソースがセットされています</p>').shift();
        ELEMENTS.outputArea.innerHTML = ELEMENTS.outputArea.innerHTML.split('<p style="color: red;">HTMLソース未設定</p>').shift();
        // メッセージの追加
        const message = htmlContent && htmlContent.trim() !== ''
            ? '<p style="color: green;">HTMLソースがセットされています</p>'
            : '<p style="color: red;">HTMLソース未設定</p>';

        ELEMENTS.outputArea.innerHTML += message;
    }

    // チェックリストの項目を生成する
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

    // チェックリストを更新する
    function updateChecklist() {
        const checklistType = ELEMENTS.mailOption.checked ? 'mail' : 'web';
        ELEMENTS.checklistArea.innerHTML = `<ul>${generateChecklistItems(CHECKLIST_ITEMS[checklistType], checklistType)}</ul>`;
    }

    // チェックボックスの状態を変更する
    function toggleCheckboxes(checked) {
        document.querySelectorAll('#checklistArea input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = checked;
        });
    }

    // フォームをリセットする
    function resetForm() {
        Object.keys(ELEMENTS).forEach(key => {
            if (key.endsWith('Input')) {
                ELEMENTS[key].value = '';
            } else if (key === 'textArea') {
                ELEMENTS[key].value = '';
            }
        });

        localStorage.clear();
        ELEMENTS.mailOption.checked = true;
        ELEMENTS.webOption.checked = false;

        updateChecklist();
        toggleCheckboxes(false);
        updateOutputMessage(); // メッセージの更新
    }

    // テキストエリアからHTMLソースを取得する関数
    function getTextAreaContent() {
        return ELEMENTS.textArea.value;
    }

    // メール用の申込番号の確認
    function checkMailApplicationNo(pageSource) {
        const applicationNo = localStorage.getItem('applicationNo');
        const pattern = new RegExp(`SET @application_no = '${applicationNo}'`);
        return pattern.test(pageSource) ? null : '・冒頭変数または申込番号に誤りがあります';
    }

    // Web用の申込番号の確認
    function checkWebApplicationNo(pageSource) {
        const applicationNo = localStorage.getItem('applicationNo');
        const pattern = new RegExp(`SET @application_no = '${applicationNo}'`);
        return !pattern.test(pageSource) ? null : '・冒頭変数を削除してください';
    }

    // ページタイトルの確認
    function checkPageTitle(pageSource) {
        const title = localStorage.getItem('title');
        const pattern = new RegExp(`<title>${title}</title>`, 'i');
        const titleMatch = pageSource.match(/<title>([^<]*)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1] : '';
        return title === pageTitle ? null : '・タイトルに誤りがあります';
    }

    // 画像のリンク切れの確認
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

                // 外部URLのチェックを含めた画像のリンク切れチェック
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

                // 外部URLのチェックを行う
                if (EXTERNAL_URL_REGEX.test(src)) {
                    // 外部URLの場合でもリンク切れチェックを行う
                    fetch(src, { method: 'HEAD' })
                        .then(response => {
                            if (!response.ok) {
                                errors.push(`・画像${index + 1}（URL: ${src}）がリンク切れです。`);
                            }
                        })
                        .catch(() => {
                            errors.push(`・画像${index + 1}（URL: ${src}）がリンク切れです。`);
                        })
                        .finally(() => {
                            loadedImages++;
                            if (loadedImages === totalImages) {
                                errors.sort();
                                resolve(errors);
                            }
                        });
                }
            });
        });
    }

    // $$$utm_campaign$$$の確認
    function checkUTMCampaign(pageSource) {
        const pattern = /\$\$\$utm_campaign\$\$\$/;
        return pattern.test(pageSource) ? '・$$$utm_campaign$$$が存在します' : null;
    }

    // 特殊テキストの確認
    function checkForSpecialText(pageSource) {
        const isMail = ELEMENTS.mailOption.checked;
        const textPattern = new RegExp(SPECIAL_TEXT, 'i');
        const textExists = textPattern.test(pageSource);

        return isMail
            ? textExists ? null : `・${SPECIAL_TEXT}を追加してください`
            : textExists ? `・${SPECIAL_TEXT}は削除してください` : null;
    }

    // noindexメタタグの確認
    function checkNoIndexMetaTag(pageSource) {
        // コメントを取り除く正規表現
        const stripCommentsPattern = /<!--[\s\S]*?-->/g;

        // コメントを取り除いたソースコード
        const cleanedSource = pageSource.replace(stripCommentsPattern, '');

        // コメント外に存在するmetaタグの正規表現
        const metaPattern = /<meta\s+name=["']robots["']\s+content=["']noindex["']/i;

        // コメント外にnoindexメタタグが存在するかどうかをチェック
        return metaPattern.test(cleanedSource)
            ? null
            : '・noindexの記述がありません';
    }

    // 開封タグの確認
    function checkNoIndexOpenTag(pageSource) {
        const isMail = ELEMENTS.mailOption.checked;
        // 正規化された開封タグのパターン（コメントアウトも含む）
        const openTagPattern = /<!--\s*<custom\s+name=["']opencounter["']\s+type=["']tracking["']\s*(\/?)>\s*-->|<custom\s+name=["']opencounter["']\s+type=["']tracking["']\s*(\/?)>/i;
        const bodyTagPattern = /<body>/i;

        if (isMail) {
            // メール版では <body> タグの直下に <custom name="opencounter" type="tracking" /> が必要
            const bodyTagMatch = pageSource.match(bodyTagPattern);
            if (bodyTagMatch) {
                const bodyTagIndex = bodyTagMatch.index + bodyTagMatch[0].length;
                const bodyContentAfterTag = pageSource.substring(bodyTagIndex);

                // コメントアウトされたタグも含めて、<body> タグの直下に開封タグがあるか確認
                if (!/<custom\s+name=["']opencounter["']\s+type=["']tracking["']\s*(\/?)>/.test(bodyContentAfterTag.replace(/<!--.*?-->/g, ''))) {
                    return '・開封タグの位置を確認してください';
                }
            } else {
                return '・<body> タグが存在しません';
            }
        } else {
            // Web版では開封タグが不要
            if (openTagPattern.test(pageSource)) {
                return '・開封タグは削除してください';
            }
        }

        return null;
    }

    // フッターの変数化チェック
    function checkFooter(pageSource) {
        const isMail = ELEMENTS.mailOption.checked;
        const footerPatternMail = /お問い合わせは%%=TreatAsContent\(@contactlink\)=%%からお願いします。/;
        const footerPatternWeb = /お問い合わせは<a href="https:\/\/www\.shizensyokuhin\.jp\/contact\/">こちら<\/a>からお願いします。/;

        if (isMail) {
            if (footerPatternMail.test(pageSource)) {
                return null;
            } else if (footerPatternWeb.test(pageSource)) {
                return '・フッター変数が変数化されていません';
            }
        } else {
            if (footerPatternWeb.test(pageSource)) {
                return null;
            } else if (footerPatternMail.test(pageSource)) {
                return '・フッター変数が解除されていません';
            }
        }

        return null;
    }

    // Google Tag Manager のチェック
    function checkGTM(pageSource) {
        const bodyCloseTagPattern = /<\/body>/i;
        const gtmTagPattern = /<!--\s*Google Tag Manager\s*-->/i;

        // </body> タグの位置を見つける
        const bodyCloseTagMatch = pageSource.match(bodyCloseTagPattern);
        if (!bodyCloseTagMatch) {
            return '・</body> タグが存在しません';
        }

        const bodyCloseTagIndex = bodyCloseTagMatch.index;
        const bodyContentBeforeCloseTag = pageSource.substring(0, bodyCloseTagIndex);

        // Google Tag Manager タグが </body> タグより上にあるかどうかを確認
        if (gtmTagPattern.test(bodyContentBeforeCloseTag)) {
            return null; // GTM タグが正しい位置にある
        } else {
            return '・GTMの場所を確認してください';
        }
    }

    // チェックを実行する
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
                    case '開封タグはあるか':
                    case '開封タグはないか':
                        error = checkNoIndexOpenTag(pageSource);
                        break;
                    case 'フッターが変数化されているか':
                    case 'フッターが変数化されていないか':
                        error = checkFooter(pageSource);
                        break;
                    case 'GTM用の記述があるか':
                        error = checkGTM(pageSource);
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
        const selectedItems = document.querySelectorAll('#checklistArea input[type="checkbox"]:checked');

        if (selectedItems.length === 0) {
            alert('チェック項目を選択してください');
            return;
        }

        // テキストエリアの内容を取得
        const pageSource = getTextAreaContent();

        if (pageSource) {
            performChecks(pageSource);
        } else {
            alert('チェック対象のHTMLが入力されていません。');
        }
    }

    // イベントリスナーの設定
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

    ELEMENTS.textArea.addEventListener('input', updateOutputMessage); // 追加: テキストエリアの入力時にメッセージを更新

    loadValues();
    updateChecklist();
});
