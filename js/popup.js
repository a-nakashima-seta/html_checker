// popup.js
document.addEventListener('DOMContentLoaded', () => {
    let pageSourceMail = '';
    let pageSourceWeb = '';

    // 要素を取得
    const ELEMENTS = {
        mailFileInput: document.getElementById('mailFileInput'),
        webUrlInput: document.getElementById('webUrlInput'),
        outputAreaMail: document.getElementById('outputAreaMail'),
        outputAreaWeb: document.getElementById('outputAreaWeb'),
        checklistAreaMail: document.getElementById('checklistAreaMail'),
        checklistAreaWeb: document.getElementById('checklistAreaWeb'),
        mailCheckButton: document.getElementById('mailCheckButton'),
        webCheckButton: document.getElementById('webCheckButton'),
        setValuesButton: document.getElementById('setValues'),
        resetButton: document.getElementById('resetButton'),
        copyAndOpenPageButton: document.getElementById('copyAndOpenPageButton'),
        checkAllButton: document.getElementById('checkAll'),
        checkSelectedButton: document.getElementById('checkSelected')
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

    // IDをエスケープする関数
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
            title: localStorage.getItem('title') || '',
        };


        const { applicationNo, preheader, title } = values;
        const infoArea = document.getElementById('infoArea');

        if (applicationNo || preheader || title) {
            document.getElementById('displayApplicationNo').textContent = applicationNo;
            document.getElementById('displayTitle').textContent = title;
            document.getElementById('displayPreheader').textContent = preheader;
            infoArea.style.display = 'block'; // infoAreaを表示

            // イベントリスナーをここに移動
            document.getElementById('editApplicationNo').addEventListener('click', () => {
                const currentValue = localStorage.getItem('applicationNo') || '';
                const newValue = prompt('申込番号を編集:', currentValue);
                if (newValue !== null) {
                    localStorage.setItem('applicationNo', newValue);
                    loadValues(); // 値を再読み込みして表示を更新
                }
            });

            document.getElementById('editTitle').addEventListener('click', () => {
                const currentValue = localStorage.getItem('title') || '';
                const newValue = prompt('タイトルを編集:', currentValue);
                if (newValue !== null) {
                    localStorage.setItem('title', newValue);
                    loadValues(); // 値を再読み込みして表示を更新
                }
            });

            document.getElementById('editPreheader').addEventListener('click', () => {
                const currentValue = localStorage.getItem('preheader') || '';
                const newValue = prompt('プリヘッダーを編集:', currentValue);
                if (newValue !== null) {
                    localStorage.setItem('preheader', newValue);
                    loadValues(); // 値を再読み込みして表示を更新
                }
            });
        } else {
            infoArea.style.display = 'none'; // infoAreaを非表示
        }
    }


    // チェックリストを生成する関数
    function generateChecklist(items, type) {
        return items.map((item, index) => `
                    <li>
                        <input type="checkbox" id="${type}_check_${index}" />
                        <label for="${type}_check_${index}">${item}</label>
                    </li>
                    `).join('');
    }

    // イベントリスナーを設定
    ELEMENTS.mailFileInput.addEventListener('change', loadMailHTML);

    // チェックリストの生成
    ELEMENTS.checklistAreaMail.innerHTML = generateChecklist(CHECKLIST_ITEMS.mail, 'mail');
    ELEMENTS.checklistAreaWeb.innerHTML = generateChecklist(CHECKLIST_ITEMS.web, 'web');


    // HTMLをアップロードし、読み込む関数
    function loadMailHTML(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                pageSourceMail = e.target.result;
                // ここでアップロードされたHTMLを表示または処理
                ELEMENTS.outputAreaMail.innerHTML = pageSourceMail; // 必要に応じて変更
            };
            reader.readAsText(file);
        }
    }

    // URLからWeb版HTMLを取得する関数
    async function fetchWebHTML(url) {
        const response = await fetch(`your_php_script.php?url=${encodeURIComponent(url)}`);
        const result = await response.text();
        pageSourceWeb = result;
        ELEMENTS.outputAreaWeb.innerHTML = pageSourceWeb; // 必要に応じて変更
    }


    // Webチェックボタンのイベントリスナー
    ELEMENTS.webCheckButton.addEventListener('click', () => {
        const url = ELEMENTS.webUrlInput.value;
        if (url) {
            fetchWebHTML(url);
        } else {
            alert('URLを入力してください');
        }
    });

    // Mailチェックボタンのイベントリスナー
    ELEMENTS.mailCheckButton.addEventListener('click', () => {
        if (pageSourceMail) {
            performChecks(pageSourceMail, 'mail'); // performChecksを適切に定義する必要があります
        } else {
            alert('HTMLファイルをアップロードしてください');
        }
    });


    // セットした値をリセットする
    // function resetForm() {
    //     // ローカルストレージをクリア
    //     localStorage.removeItem('applicationNo');
    //     localStorage.removeItem('title');
    //     localStorage.removeItem('preheader');

    //     // 表示されている値をリセット
    //     loadValues(); // 表示を更新
    //     document.getElementById('inputText').value = ''; // テキストエリアをクリア
    // }






    // メール用の申込番号の確認
    function checkMailApplicationNo(pageSource) {
        const applicationNo = localStorage.getItem('applicationNo');
        const pattern = new RegExp(`SET @application_no = '${applicationNo}'`);
        return pattern.test(pageSource) ? null : '・冒頭変数または申込番号に誤りがあります';
    }

    // Web用の申込番号の確認
    function checkWebApplicationNo(pageSource) {
        const applicationNo = localStorage.getItem('applicationNo');
        const pattern = new RegExp(`SET @application_no = '`);
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
    const SPECIAL_TEXT = '※画像が';
    function checkForSpecialText(pageSource) {
        const isMail = ELEMENTS.mailOption.checked;
        const textPattern = new RegExp(SPECIAL_TEXT, 'i'); // 大文字・小文字を区別しない
        const textExists = textPattern.test(pageSource);

        // 部分一致で判定
        return isMail
            ? textExists ? null : `・※画像がうまく表示されない方はこちらを追加してください`
            : textExists ? `・※画像がうまく表示されない方はこちらは削除してください` : null;
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

        // <body> タグのパターン、属性を含む可能性に対応
        const bodyTagPattern = /<!--[\s\S]*?<\/body>|<body[^>]*>/i;

        if (isMail) {
            // メール版では <body> タグの直下に <custom name="opencounter" type="tracking" /> が必要
            const bodyTagMatch = pageSource.match(bodyTagPattern);
            if (bodyTagMatch) {
                const bodyTagIndex = bodyTagMatch.index + bodyTagMatch[0].length;
                const bodyContentAfterTag = pageSource.substring(bodyTagIndex);

                // コメントアウトされたタグも含めて、<body> タグの直下に開封タグがあるか確認
                if (!/<custom\s+name=["']opencounter["']\s+type=["']tracking["']\s*(\/?)>/.test(bodyContentAfterTag.replace(/<!--[\s\S]*?-->/g, ''))) {
                    return '・開封タグの位置を確認してください';
                }
            } else {
                return '・<body> タグが存在しません';
            }
        } else {
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

    // メール用のプリヘッダーの確認
    function checkMailPreheader(pageSource) {
        // id="preheader" を持つタグの存在をチェック
        const preheaderIdPattern = /id\s*=\s*["']preheader["']/i;
        if (!preheaderIdPattern.test(pageSource)) {
            return 'id="preheader"を追加してください。';
        }

        // id="preheader" を持つタグ内の文字列を抽出
        const preheaderTagPattern = /id\s*=\s*["']preheader["'][^>]*>([^<]*)<\/[^>]+>/i;
        const match = pageSource.match(preheaderTagPattern);
        const preheaderTagText = match ? match[1].trim() : '';

        // ユーザーが設定したプリヘッダーの値を取得
        let setPreheaderText = localStorage.getItem('preheader');
        if (setPreheaderText) {
            setPreheaderText = setPreheaderText.trim();
            // タグ内のテキストとユーザー設定のプリヘッダーを比較
            return preheaderTagText === setPreheaderText
                ? null // 成功時は `null` を返す
                : 'プリヘッダーを確認してください。'; // エラーメッセージを返す
        } else {
            return 'プリヘッダーが設定されていません'; // `null` または空の場合のエラーメッセージ
        }
    }

    // Web用のプリヘッダーの確認
    function checkWebPreheader(pageSource) {
        const preheaderPattern = /<!--\s*▼\s*プリヘッダー\s*▼\s*-->/i;
        return preheaderPattern.test(pageSource) ? '・プリヘッダーを削除してください' : null;
    }

    // ファビコンのチェック
    function checkFavicon(pageSource) {
        const isSEAC = document.getElementById('seacOption').checked;

        // 通常のファビコンのパターン
        const faviconPattern = isSEAC
            ? /<link\s+rel=["']shortcut icon["']\s+href=["']\/excludes\/dmlite\/seac\/img\/common\/favicon\.ico["']\s*\/?>/i
            : /<link\s+rel=["']shortcut icon["']\s+href=["']\/excludes\/dmlite\/favicon\.ico["']\s*\/?>/i;

        // コメントアウトされたファビコンのパターン
        const commentedFaviconPattern = isSEAC
            ? /<!--.*?<link\s+rel=["']shortcut icon["']\s+href=["']\/excludes\/dmlite\/seac\/img\/common\/favicon\.ico["']\s*\/?>.*?-->/i
            : /<!--.*?<link\s+rel=["']shortcut icon["']\s+href=["']\/excludes\/dmlite\/favicon\.ico["']\s*\/?>.*?-->/i;

        // 通常のファビコンが存在するかチェック
        const hasFavicon = faviconPattern.test(pageSource);
        // コメントアウトされたファビコンが存在するかチェック
        const hasCommentedFavicon = commentedFaviconPattern.test(pageSource);

        // ファビコンが存在しない、またはコメントアウトされている場合にエラーを返す
        if (!hasFavicon || hasCommentedFavicon) {
            return '・faviconの記述を確認してください';
        }

        return null;
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
                    case 'プリヘッダーは正しいか':
                        error = checkMailPreheader(pageSource);
                        break;
                    case 'プリヘッダーはないか':
                        error = checkWebPreheader(pageSource);
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
                    case 'faviconは設定されているか':
                        error = checkFavicon(pageSource);
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

        // チェックの実行
        if (pageSource) {
            performChecks(pageSource);
        } else {
            alert('チェック対象のHTMLが確認できません。');
        }

    }

    ELEMENTS.setValuesButton.addEventListener('click', () => {
        const inputText = document.getElementById('inputText').value;
        const lines = inputText.split('\n');

        if (lines.length >= 3) {
            const applicationNo = lines[0].trim();
            const title = lines[1].trim();
            const preheader = lines[2].trim();

            // ローカルストレージに保存
            localStorage.setItem('applicationNo', applicationNo);
            localStorage.setItem('title', title);
            localStorage.setItem('preheader', preheader);


            loadValues()
        } else {
            alert('3行で入力してください。');
        }
    });


    loadValues();
});