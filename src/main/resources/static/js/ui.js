function toggleDropdown(targetDropdown, targetButton) {
    const isShow = targetDropdown.classList.toggle('show');
    targetButton.setAttribute('aria-expanded', isShow);

    const allDropdowns = [modeDropdown, langDropdown];
    const allButtons = [modeMenuButton, langMenuButton];

    allDropdowns.forEach((dropdown, index) => {
        if (dropdown !== targetDropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            allButtons[index].setAttribute('aria-expanded', 'false');
        }
    });
}

function getModeText(mode) {
    const t = getTranslationFunction();
    return t(mode === MODE_FAST ? 'mode_fast' : 'mode_accurate');
}

function updateButtonTitles() {
    const t = getTranslationFunction();
    const micKoTitle = micKo.querySelector('.mic-title');
    const micUkTitle = micUk.querySelector('.mic-title');

    if (micKoTitle) micKoTitle.textContent = '한국어';
    if (micUkTitle) micUkTitle.textContent = 'Українська';

    const micImageHtml = `<img src="${ICON_MIC_URL}" alt="${t('mic_alt_ready')}">`;

    const micKoIcon = micKo.querySelector('.mic-icon');
    const micUkIcon = micUk.querySelector('.mic-icon');

    if (micKoIcon) micKoIcon.innerHTML = micImageHtml;
    if (micUkIcon) micUkIcon.innerHTML = micImageHtml;
}

function renderModeDropdown() {
    const t = getTranslationFunction();
    modeDropdown.innerHTML = '';

    const modes = [
        { code: MODE_FAST, name: t('mode_fast') },
        { code: MODE_ACCURATE, name: t('mode_accurate') }
    ];

    modes.forEach(mode => {
        const optionEl = createElement('div', 'mode-option');
        optionEl.dataset.mode = mode.code;

        const nameEl = createElement('div', '', mode.name);
        nameEl.style.fontWeight = 'bold';

        optionEl.appendChild(nameEl);

        if (mode.code === appState.currentMode) {
            optionEl.classList.add('selected');
        }

        let currentFontSize = INITIAL_FONT_SIZE;
        let textWidth = measureTextWidth(mode.name, currentFontSize);

        while (textWidth > MAX_MODE_DROPDOWN_WIDTH && currentFontSize > MIN_FONT_SIZE) {
            currentFontSize -= FONT_SIZE_STEP;
            textWidth = measureTextWidth(mode.name, currentFontSize);
        }

        optionEl.style.fontSize = currentFontSize + 'em';

        optionEl.addEventListener('click', () => {
            appState.currentMode = mode.code;
            updateControls(); // Changed from updateUI to updateControls to preserve chat
            modeDropdown.classList.remove('show');
            modeMenuButton.setAttribute('aria-expanded', 'false');
        });

        modeDropdown.appendChild(optionEl);
    });
}

function renderLangDropdown() {
    const t = getTranslationFunction();
    langDropdown.innerHTML = '';

    const langs = [
        { code: 'ko', name: t('lang_ko') },
        { code: 'uk', name: t('lang_uk') }
    ];

    langs.forEach(lang => {
        const optionEl = createElement('div', 'lang-option', lang.name);
        optionEl.dataset.lang = lang.code;

        if (lang.code === appState.currentLang) {
            optionEl.classList.add('selected');
        }

        optionEl.addEventListener('click', () => {
            appState.currentLang = lang.code;
            initializeUI();
            langDropdown.classList.remove('show');
            langMenuButton.setAttribute('aria-expanded', 'false');
        });

        langDropdown.appendChild(optionEl);
    });
}

function updateControls() {
    const t = getTranslationFunction();
    stopTranslationLoading();
    document.getElementById('doc-title').textContent = t('title');

    modeMenuButton.title = t('tooltip_mode_set');
    langMenuButton.title = t('tooltip_lang_set');

    modeMenuButton.setAttribute('aria-label', t('tooltip_mode_set'));
    langMenuButton.setAttribute('aria-label', t('tooltip_lang_set'));

    renderModeDropdown();
    renderLangDropdown();
    updateButtonTitles();
}

function initializeUI() {
    updateControls();

    const t = getTranslationFunction();
    chatContainer.innerHTML = '';
    addMessage(t('chat_initial_ko'), 'ko-uk', t('chat_initial_uk'), false, true);
    addMessage(t('chat_example_uk'), 'uk-ko', t('chat_example_ko'), false, true);
}

const updateUI = initializeUI;
