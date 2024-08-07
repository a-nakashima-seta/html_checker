document.addEventListener('DOMContentLoaded', function () {
    const applicationNoInput = document.getElementById('applicationNo');
    const preheaderInput = document.getElementById('preheader');
    const titleInput = document.getElementById('title');
    const setValuesButton = document.getElementById('setValues');
    const outputArea = document.getElementById('outputArea');
    const checklistArea = document.getElementById('checklistArea');
    const mailOption = document.getElementById('mailOption');
    const webOption = document.getElementById('webOption');
    const checkAllButton = document.getElementById('checkAll');
    const checkSelectedButton = document.getElementById('checkSelected');
    const resetButton = document.getElementById('resetButton');

    // ローカルストレージからデータを読み込む
    function loadValues() {
        const applicationNo = localStorage.getItem('applicationNo') || '';
        const preheader = localStorage.getItem('preheader') || '';
        const title = localStorage.getItem('title') || '';

        applicationNoInput.value = applicationNo;
        preheaderInput.value = preheader;
        titleInput.value = title;

        outputArea.innerHTML = `
            <strong>申込番号:</strong> ${applicationNo}<br>
            <strong>プリヘッダー:</strong> ${preheader}<br>
            <strong>タイトル:</strong> ${title}<br>
        `;
    }

    // 入力されたデータをローカルストレージに保存する
    function saveValues() {
        const applicationNo = applicationNoInput.value;
        const preheader = preheaderInput.value;
        const title = titleInput.value;

        localStorage.setItem('applicationNo', applicationNo);
        localStorage.setItem('preheader', preheader);
        localStorage.setItem('title', title);
    }

    // チェックリストを更新する
    function updateChecklist() {
        let checklistItems = [];

        if (mailOption.checked) {
            checklistItems = [
                'タイトルは正しいか',
                'プリヘッダーは正しいか',
                '冒頭に変数があり、正しい申込番号が入っているか',
                '画像のリンク切れはないか',
                '$$$utm_campaign$$$がないか',
                '※画像がうまく表示されない方はこちらがあるか',
                'bodyタグ直下に開封タグはあるか'
            ];
        } else if (webOption.checked) {
            checklistItems = [
                'タイトルは正しいか',
                'プリヘッダーはないか',
                '冒頭に変数はないか',
                '画像のリンク切れはないか',
                '$$$utm_campaign$$$がないか',
                '※画像がうまく表示されない方はこちらをご覧ください。はないか',
                '開封タグはないか',
                'ウェブページのタイトルを確認',
                'noindexの記述はあるか'
            ];
        }

        checklistArea.innerHTML = '<ul>' +
            checklistItems.map(item => `
                <li>
                    <input type="checkbox" id="${item.replace(/ /g, '_')}" />
                    <label for="${item.replace(/ /g, '_')}">${item}</label>
                </li>
            `).join('') +
            '</ul>';
    }

    // ボタンクリックで値を保存して表示
    setValuesButton.addEventListener('click', function () {
        saveValues();
        outputArea.innerHTML = `
            <strong>申込番号:</strong> ${applicationNoInput.value}<br>
            <strong>プリヘッダー:</strong> ${preheaderInput.value}<br>
            <strong>タイトル:</strong> ${titleInput.value}<br>
        `;
    });

    // ラジオボタンの変更でチェックリストを更新
    document.querySelectorAll('input[name="checkType"]').forEach(radio => {
        radio.addEventListener('change', updateChecklist);
    });

    // 全てのチェックボックスをチェックする
    checkAllButton.addEventListener('click', function () {
        document.querySelectorAll('#checklistArea input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
    });

    // 選択した項目のチェックボックスをチェックする
    checkSelectedButton.addEventListener('click', function () {
        document.querySelectorAll('#checklistArea input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = true;
            }
        });
    });

    // リセットボタンで初期状態に戻す
    resetButton.addEventListener('click', function () {
        applicationNoInput.value = '';
        preheaderInput.value = '';
        titleInput.value = '';
        mailOption.checked = true;
        webOption.checked = false;

        // チェックリストを mail 用のリストで再生成
        updateChecklist();

        // チェックリスト内のチェックボックスを全てオフにする
        document.querySelectorAll('#checklistArea input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // outputArea を非表示にする
        outputArea.style.display = 'none';
    });

    // ポップアップが開かれたときに値を読み込む
    loadValues();
    // 初期表示のチェックリストを更新
    updateChecklist();
});
