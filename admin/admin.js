/* =====================================================
   PROTEÇÃO DO DASHBOARD
   ===================================================== */

async function requireAdminSession() {
    if (!window.supabaseClient) {
        window.location.replace(
            "./index.html"
        );

        return false;
    }

    const {
        data: sessionData,
        error: sessionError
    } =
        await window.supabaseClient
            .auth
            .getSession();

    const session =
        sessionData?.session;

    if (
        sessionError ||
        !session
    ) {
        window.location.replace(
            "./index.html"
        );

        return false;
    }

    const {
        data: adminRecord,
        error: adminError
    } =
        await window.supabaseClient
            .from("admin_users")
            .select("user_id")
            .eq(
                "user_id",
                session.user.id
            )
            .maybeSingle();

    if (
        adminError ||
        !adminRecord
    ) {
        await window.supabaseClient
            .auth
            .signOut();

        window.location.replace(
            "./index.html"
        );

        return false;
    }

    document.documentElement
        .classList
        .add(
            "admin-authenticated"
        );

    return true;
}


"use strict";

/* =========================================================
   PRESÉPIO 2026
   PAINEL DE ADMINISTRAÇÃO

   Versão local para desenvolvimento.
   Não contém palavras-passe fixas no código.
   A autenticação definitiva será ligada ao Supabase.
   ========================================================= */

(() => {
    if (window.presepioAdminInitialized) {
        return;
    }

    window.presepioAdminInitialized = true;


    /* =====================================================
       CONFIGURAÇÃO
       ===================================================== */

    const CONFIG = {
        dashboardPath: "./dashboard.html",
        loginPath: "./index.html",
        publicSitePath: "../index.html",

        sessionKey: "presepio_admin_session",
        contentKey: "presepio_site_content",
        settingsKey: "presepio_admin_settings",
        mediaKey: "presepio_admin_media",

        toastDuration: 3200,
        modalTransitionTime: 350,

        minimumPasswordLength: 6
    };


    /* =====================================================
       ESTADO
       ===================================================== */

    const state = {
        currentSection: "overview",
        currentEditorPanel: "hero",
        toastTimer: null,
        previousFocus: null,
        pendingMediaTarget: null
    };


    /* =====================================================
       UTILITÁRIOS
       ===================================================== */

    function getElement(id) {
        return document.getElementById(id);
    }


    function query(selector, parent = document) {
        return parent.querySelector(selector);
    }


    function queryAll(
        selector,
        parent = document
    ) {
        return Array.from(
            parent.querySelectorAll(selector)
        );
    }


    function parseJson(value, fallback = null) {
        if (!value) {
            return fallback;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            console.warn(
                "Não foi possível interpretar os dados guardados.",
                error
            );

            return fallback;
        }
    }


    function readStorage(
        key,
        fallback = null
    ) {
        try {
            return parseJson(
                window.localStorage.getItem(key),
                fallback
            );
        } catch (error) {
            console.warn(
                "O armazenamento local não está disponível.",
                error
            );

            return fallback;
        }
    }


    function writeStorage(key, value) {
        try {
            window.localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;
        } catch (error) {
            console.warn(
                "Não foi possível guardar os dados.",
                error
            );

            return false;
        }
    }


    function removeStorage(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            console.warn(
                "Não foi possível remover os dados.",
                error
            );
        }
    }


    function sanitizeText(value) {
        return String(value || "").trim();
    }


    function isValidEmail(value) {
        const email =
            sanitizeText(value);

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        );
    }


    function createReference() {
        const date = new Date();

        const datePart = [
            date.getFullYear(),
            String(
                date.getMonth() + 1
            ).padStart(2, "0"),
            String(
                date.getDate()
            ).padStart(2, "0")
        ].join("");

        const randomPart =
            Math.random()
                .toString(36)
                .slice(2, 8)
                .toUpperCase();

        return `ADM-${datePart}-${randomPart}`;
    }


    function formatDateTime(date) {
        return new Intl.DateTimeFormat(
            "pt-PT",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        ).format(date);
    }


    function escapeCsvValue(value) {
        const text = String(
            value ?? ""
        ).replaceAll("\"", "\"\"");

        return `"${text}"`;
    }


    function downloadTextFile(
        fileName,
        content,
        type = "text/plain;charset=utf-8"
    ) {
        const blob = new Blob(
            [content],
            {
                type
            }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }


    /* =====================================================
       SESSÃO LOCAL DE DESENVOLVIMENTO
       ===================================================== */

    function getSession() {
        return readStorage(
            CONFIG.sessionKey,
            null
        );
    }


    function createSession(email, remember) {
        const session = {
            email,
            reference: createReference(),
            createdAt:
                new Date().toISOString(),
            remember:
                Boolean(remember)
        };

        /*
         * Esta sessão local serve apenas para testar
         * o painel. Não substitui autenticação real.
         */

        if (remember) {
            writeStorage(
                CONFIG.sessionKey,
                session
            );
        } else {
            try {
                window.sessionStorage.setItem(
                    CONFIG.sessionKey,
                    JSON.stringify(session)
                );
            } catch (error) {
                console.warn(
                    "A sessão temporária não pôde ser guardada.",
                    error
                );
            }
        }

        return session;
    }


    function getTemporarySession() {
        try {
            return parseJson(
                window.sessionStorage.getItem(
                    CONFIG.sessionKey
                ),
                null
            );
        } catch {
            return null;
        }
    }


    function getActiveSession() {
        return (
            getSession() ||
            getTemporarySession()
        );
    }


    function clearSession() {
        removeStorage(
            CONFIG.sessionKey
        );

        try {
            window.sessionStorage.removeItem(
                CONFIG.sessionKey
            );
        } catch {
            /*
             * Não é necessária outra ação.
             */
        }
    }


    function isLoginPage() {
        return document.body.classList.contains(
            "admin-login-page"
        );
    }


    function isDashboardPage() {
        return document.body.classList.contains(
            "admin-dashboard-page"
        );
    }


    function protectDashboard() {
        if (
            !isDashboardPage() ||
            getActiveSession()
        ) {
            return true;
        }

        window.location.replace(
            CONFIG.loginPath
        );

        return false;
    }


    /* =====================================================
       LOGIN
       ===================================================== */

    const loginForm =
        getElement("admin-login-form");

    const loginEmail =
        getElement("admin-email");

    const loginPassword =
        getElement("admin-password");

    const loginRemember =
        getElement("admin-remember");

    const loginMessage =
        getElement("admin-login-message");

    const loginSubmit =
        getElement("admin-login-submit");

    const passwordToggle =
        getElement("admin-toggle-password");

    const forgotPasswordButton =
        getElement("admin-forgot-password");


    function setLoginMessage(
        message,
        type = "error"
    ) {
        if (!loginMessage) {
            return;
        }

        loginMessage.textContent =
            message;

        loginMessage.dataset.type =
            type;
    }


    function clearLoginMessage() {
        setLoginMessage("");
    }


    function setLoginLoading(loading) {
        if (!loginSubmit) {
            return;
        }

        loginSubmit.disabled =
            loading;

        const label =
            query(
                "span:first-child",
                loginSubmit
            );

        if (label) {
            label.textContent =
                loading
                    ? "A entrar..."
                    : "Entrar no painel";
        }
    }


    async function handleLogin(event) {
        event.preventDefault();

        clearLoginMessage();

        const email =
            sanitizeText(
                loginEmail?.value
            ).toLowerCase();

        const password =
            String(
                loginPassword?.value ||
                ""
            );

        const remember =
            Boolean(
                loginRemember?.checked
            );

        if (!isValidEmail(email)) {
            setLoginMessage(
                "Introduza um endereço de email válido."
            );

            loginEmail?.focus();
            return;
        }

        if (
            password.length <
            CONFIG.minimumPasswordLength
        ) {
            setLoginMessage(
                `A palavra-passe deve ter pelo menos ${CONFIG.minimumPasswordLength} caracteres.`
            );

            loginPassword?.focus();
            return;
        }

        setLoginLoading(true);

        /*
         * Pequena espera apenas para a transição visual.
         * Nesta versão local não existe validação real
         * da palavra-passe.
         */

        window.setTimeout(() => {
            createSession(
                email,
                remember
            );

            window.location.href =
                CONFIG.dashboardPath;
        }, 650);
    }


    function togglePasswordVisibility() {
        if (
            !loginPassword ||
            !passwordToggle
        ) {
            return;
        }

        const showingPassword =
            loginPassword.type === "text";

        loginPassword.type =
            showingPassword
                ? "password"
                : "text";

        passwordToggle.textContent =
            showingPassword
                ? "Mostrar"
                : "Ocultar";

        passwordToggle.setAttribute(
            "aria-label",
            showingPassword
                ? "Mostrar palavra-passe"
                : "Ocultar palavra-passe"
        );

        passwordToggle.setAttribute(
            "aria-pressed",
            String(!showingPassword)
        );

        loginPassword.focus();
    }


    function handleForgotPassword() {
        openModal({
            eyebrow: "RECUPERAR ACESSO",
            title:
                "Recuperação de palavra-passe",
            message:
                "A recuperação será ativada quando ligarmos o painel ao sistema de autenticação. Para já, esta versão funciona apenas em modo local."
        });
    }


    function initializeLogin() {
        if (!isLoginPage()) {
            return;
        }

        /*
         * Se existir sessão, permite regressar
         * diretamente ao dashboard.
         */

        if (getActiveSession()) {
            const currentUrl =
                new URL(
                    window.location.href
                );

            if (
                currentUrl.searchParams.get(
                    "logout"
                ) !== "1"
            ) {
                window.location.replace(
                    CONFIG.dashboardPath
                );

                return;
            }

            clearSession();
        }

        loginForm?.addEventListener(
            "submit",
            handleLogin
        );

        passwordToggle?.addEventListener(
            "click",
            togglePasswordVisibility
        );

        forgotPasswordButton?.addEventListener(
            "click",
            handleForgotPassword
        );

        loginEmail?.addEventListener(
            "input",
            clearLoginMessage
        );

        loginPassword?.addEventListener(
            "input",
            clearLoginMessage
        );
    }


    /* =====================================================
       SIDEBAR
       ===================================================== */

    const sidebar =
        getElement("admin-sidebar");

    const sidebarToggle =
        getElement("admin-sidebar-toggle");

    const sidebarClose =
        getElement("admin-sidebar-close");

    const sidebarBackdrop =
        getElement("admin-sidebar-backdrop");


    function setSidebar(open) {
        document.body.classList.toggle(
            "admin-sidebar-open",
            open
        );

        sidebarToggle?.setAttribute(
            "aria-expanded",
            String(open)
        );

        sidebar?.setAttribute(
            "aria-hidden",
            String(!open)
        );
    }


    function initializeSidebar() {
        sidebarToggle?.addEventListener(
            "click",
            () => {
                const open =
                    document.body.classList.contains(
                        "admin-sidebar-open"
                    );

                setSidebar(!open);
            }
        );

        sidebarClose?.addEventListener(
            "click",
            () => {
                setSidebar(false);
            }
        );

        sidebarBackdrop?.addEventListener(
            "click",
            () => {
                setSidebar(false);
            }
        );

        window.addEventListener(
            "resize",
            () => {
                if (
                    window.innerWidth >
                    1000
                ) {
                    setSidebar(false);
                }
            }
        );
    }


    /* =====================================================
       NAVEGAÇÃO DO DASHBOARD
       ===================================================== */

    const navigationLinks =
        queryAll(
            ".admin-navigation-link[data-admin-section]"
        );

    const panelSections =
        queryAll(
            ".admin-panel-section"
        );

    const pageTitle =
        getElement("admin-page-title");

    const pageEyebrow =
        getElement("admin-page-eyebrow");


    function showAdminSection(
        sectionName,
        updateAddress = true
    ) {
        const target =
            getElement(
                `admin-section-${sectionName}`
            );

        if (!target) {
            return;
        }

        state.currentSection =
            sectionName;

        navigationLinks.forEach(
            (link) => {
                const active =
                    link.dataset
                        .adminSection ===
                    sectionName;

                link.classList.toggle(
                    "is-active",
                    active
                );

                link.setAttribute(
                    "aria-current",
                    active
                        ? "page"
                        : "false"
                );
            }
        );

        panelSections.forEach(
            (section) => {
                const active =
                    section === target;

                section.hidden =
                    !active;

                section.classList.toggle(
                    "is-active",
                    active
                );
            }
        );

        if (pageTitle) {
            pageTitle.textContent =
                target.dataset
                    .sectionTitle ||
                "Administração";
        }

        if (pageEyebrow) {
            pageEyebrow.textContent =
                target.dataset
                    .sectionEyebrow ||
                "PAINEL";
        }

        if (updateAddress) {
            const url =
                new URL(
                    window.location.href
                );

            url.hash =
                sectionName;

            history.replaceState(
                {
                    sectionName
                },
                "",
                url
            );
        }

        setSidebar(false);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    function initializeDashboardNavigation() {
        navigationLinks.forEach(
            (link) => {
                link.addEventListener(
                    "click",
                    () => {
                        showAdminSection(
                            link.dataset
                                .adminSection
                        );
                    }
                );
            }
        );

        queryAll(
            "[data-go-to-section]"
        ).forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    showAdminSection(
                        button.dataset
                            .goToSection
                    );
                }
            );
        });

        const initialSection =
            window.location.hash
                .replace("#", "")
                .trim();

        if (
            initialSection &&
            getElement(
                `admin-section-${initialSection}`
            )
        ) {
            showAdminSection(
                initialSection,
                false
            );
        }

        window.addEventListener(
            "popstate",
            () => {
                const section =
                    window.location.hash
                        .replace("#", "")
                        .trim();

                if (
                    section &&
                    getElement(
                        `admin-section-${section}`
                    )
                ) {
                    showAdminSection(
                        section,
                        false
                    );
                }
            }
        );
    }


    /* =====================================================
       NAVEGAÇÃO DO EDITOR
       ===================================================== */

    const editorLinks =
        queryAll(
            ".admin-editor-navigation-link[data-editor-panel]"
        );

    const editorPanels =
        queryAll(
            ".admin-editor-panel"
        );


    function showEditorPanel(
        panelName
    ) {
        const target =
            getElement(
                `admin-editor-${panelName}`
            );

        if (!target) {
            return;
        }

        state.currentEditorPanel =
            panelName;

        editorLinks.forEach(
            (link) => {
                link.classList.toggle(
                    "is-active",
                    link.dataset
                        .editorPanel ===
                        panelName
                );
            }
        );

        editorPanels.forEach(
            (panel) => {
                const active =
                    panel === target;

                panel.hidden =
                    !active;

                panel.classList.toggle(
                    "is-active",
                    active
                );
            }
        );
    }


    function initializeEditorNavigation() {
        editorLinks.forEach(
            (link) => {
                link.addEventListener(
                    "click",
                    () => {
                        showEditorPanel(
                            link.dataset
                                .editorPanel
                        );
                    }
                );
            }
        );
    }


    /* =====================================================
       DADOS DOS CONTEÚDOS
       ===================================================== */

    const defaultContent = {
        heroEyebrow:
            "PRESÉPIO 2026",

        heroTitle:
            "Uma história eterna.\nUma experiência inesquecível.",

        heroDescription:
            "Luz, música e movimento unem-se para dar vida à história do nascimento de Jesus.",

        experienceTitle:
            "A tradição ganha vida.",

        experienceDescription:
            "Uma apresentação cuidadosamente sincronizada, onde cada luz, movimento e som participa na narrativa.",

        aboutTitle:
            "Arautos do Evangelho.",

        aboutDescription:
            "",

        address:
            "Av. dos Combatentes da Grande Guerra, 355, Porto",

        duration:
            "45 minutos",

        openingTime:
            "14:00",

        closingTime:
            "18:00",

        contactEmail:
            "contacto@presepio.pt",

        contactPhone:
            "+351 912 345 678"
    };


    function readFormData(form) {
        const data =
            new FormData(form);

        const result = {};

        for (
            const [key, value]
            of data.entries()
        ) {
            result[key] =
                typeof value === "string"
                    ? value.trim()
                    : value;
        }

        return result;
    }


    function fillForm(
        form,
        values
    ) {
        if (!form || !values) {
            return;
        }

        Object.entries(values).forEach(
            ([key, value]) => {
                const field =
                    form.elements.namedItem(
                        key
                    );

                if (!field) {
                    return;
                }

                if (
                    field instanceof
                    HTMLInputElement &&
                    field.type === "checkbox"
                ) {
                    field.checked =
                        Boolean(value);

                    return;
                }

                field.value =
                    String(
                        value ?? ""
                    );
            }
        );
    }


    function loadSavedContent() {
        const contentForm =
            getElement(
                "admin-content-form"
            );

        if (!contentForm) {
            return;
        }

        const savedContent =
            readStorage(
                CONFIG.contentKey,
                {}
            ) || {};

        fillForm(
            contentForm,
            {
                ...defaultContent,
                ...savedContent
            }
        );
    }


    function saveAllContent() {
        const contentForm =
            getElement(
                "admin-content-form"
            );

        if (!contentForm) {
            showToast(
                "Nada para guardar",
                "O formulário de conteúdos não foi encontrado.",
                "warning"
            );

            return;
        }

        if (!contentForm.checkValidity()) {
            contentForm.reportValidity();

            showToast(
                "Verifique os campos",
                "Existem informações obrigatórias por preencher.",
                "warning"
            );

            return;
        }

        const content =
            readFormData(
                contentForm
            );

        const saved =
            writeStorage(
                CONFIG.contentKey,
                content
            );

        if (!saved) {
            showToast(
                "Erro ao guardar",
                "O navegador não permitiu guardar os dados.",
                "error"
            );

            return;
        }

        saveSettings();

        showToast(
            "Alterações guardadas",
            "O conteúdo foi atualizado localmente."
            );
        const saveButton =
    document.getElementById(
        "admin-save-button"
    );

saveButton?.classList.remove(
    "has-unsaved-changes"
);



saveButton?.classList.remove(
    "has-unsaved-changes"
);
        
    }


    /* =====================================================
       DEFINIÇÕES
       ===================================================== */

    function getSettingsForms() {
        return queryAll(
            ".admin-settings-card"
        ).filter(
            (element) =>
                element instanceof
                HTMLFormElement
        );
    }


    function saveSettings() {
        const result = {};

        getSettingsForms().forEach(
            (form) => {
                Object.assign(
                    result,
                    readFormData(form)
                );
            }
        );

        queryAll(
            ".admin-setting-row input[type='checkbox']"
        ).forEach(
            (input, index) => {
                result[
                    `settingSwitch${index + 1}`
                ] = input.checked;
            }
        );

        writeStorage(
            CONFIG.settingsKey,
            result
        );

        return result;
    }


    function loadSettings() {
        const settings =
            readStorage(
                CONFIG.settingsKey,
                null
            );

        if (!settings) {
            return;
        }

        getSettingsForms().forEach(
            (form) => {
                fillForm(
                    form,
                    settings
                );
            }
        );

        queryAll(
            ".admin-setting-row input[type='checkbox']"
        ).forEach(
            (input, index) => {
                const key =
                    `settingSwitch${index + 1}`;

                if (
                    key in settings
                ) {
                    input.checked =
                        Boolean(
                            settings[key]
                        );
                }
            }
        );
    }


    function initializeAutosaveIndicators() {
        const fields =
            queryAll(
                ".admin-content input, " +
                ".admin-content textarea, " +
                ".admin-content select"
            );

        fields.forEach((field) => {
            field.addEventListener(
                "input",
                () => {
                    const saveButton =
                        getElement(
                            "admin-save-button"
                        );

                    saveButton?.classList.add(
                        "has-unsaved-changes"
                    );

                    const text =
                        query(
                            "span:first-child",
                            saveButton
                        );

                    if (text) {
                        text.textContent =
                            "Guardar alterações";
                    }
                }
            );
        });
    }
    function initializeAutomaticDrafts() {
    const contentForm =
        document.getElementById(
            "admin-content-form"
        );

    if (!contentForm) {
        return;
    }

    let draftTimer = null;

    contentForm.addEventListener(
        "input",
        () => {
            window.clearTimeout(
                draftTimer
            );

            draftTimer =
                window.setTimeout(() => {
                    const content =
                        readFormData(
                            contentForm
                        );

                    writeStorage(
                        CONFIG.contentKey,
                        content
                    );

                    showToast(
                        "Rascunho guardado",
                        "As alterações foram guardadas neste navegador.",
                        "info"
                    );
                }, 1000);
        }
    );
}


    /* =====================================================
       PRÉ-VISUALIZAÇÃO
       ===================================================== */

    function openPublicPreview() {
    saveAllContent();

    const previewWindow =
        window.open(
            CONFIG.publicSitePath,
            "_blank"
        );

    if (!previewWindow) {
        showToast(
            "Pré-visualização bloqueada",
            "Permita janelas emergentes para abrir o site.",
            "warning"
        );
    }
}


    /* =====================================================
       MULTIMÉDIA LOCAL
       ===================================================== */

    const mediaInput =
        getElement(
            "admin-media-input"
        );

    const uploadMediaButton =
        getElement(
            "admin-upload-media"
        );


    function describeFile(file) {
        const megabytes =
            file.size /
            1024 /
            1024;

        return (
            `${file.name} · ` +
            `${megabytes.toFixed(2)} MB`
        );
    }


    function saveMediaMetadata(files) {
        const metadata =
            files.map((file) => ({
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified:
                    file.lastModified
            }));

        writeStorage(
            CONFIG.mediaKey,
            metadata
        );

        return metadata;
    }


    function handleMediaSelection() {
        const files =
            Array.from(
                mediaInput?.files || []
            );

        if (!files.length) {
            return;
        }

        const maximumSize =
            100 * 1024 * 1024;

        const oversizedFile =
            files.find(
                (file) =>
                    file.size >
                    maximumSize
            );

        if (oversizedFile) {
            showToast(
                "Ficheiro demasiado grande",
                `${oversizedFile.name} ultrapassa o limite local de 100 MB.`,
                "warning"
            );

            mediaInput.value = "";
            return;
        }

        saveMediaMetadata(files);

        const description =
            files.length === 1
                ? describeFile(files[0])
                : `${files.length} ficheiros selecionados`;

        showToast(
            "Ficheiros preparados",
            `${description}. O envio real será ativado com o armazenamento online.`
        );

        mediaInput.value = "";
    }


    function initializeMediaControls() {
        uploadMediaButton?.addEventListener(
            "click",
            () => {
                state.pendingMediaTarget =
                    "library";

                mediaInput?.click();
            }
        );

        queryAll(
            ".admin-media-information button"
        ).forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    const card =
                        button.closest(
                            ".admin-media-card"
                        );

                    state.pendingMediaTarget =
                        query(
                            "strong",
                            card
                        )?.textContent ||
                        "media";

                    mediaInput?.click();
                }
            );
        });

        mediaInput?.addEventListener(
            "change",
            handleMediaSelection
        );
    }


    /* =====================================================
       MARCAÇÕES DEMONSTRATIVAS
       ===================================================== */

    const sampleBookings = [
        {
            reference:
                "PRE-20261212-1400-A1B2C3",
            responsible:
                "Ana Martins",
            email:
                "ana@example.pt",
            date:
                "2026-12-12",
            time:
                "14:00",
            visitors:
                4,
            status:
                "Confirmada"
        },
        {
            reference:
                "PRE-20261212-1530-D4E5F6",
            responsible:
                "João Pereira",
            email:
                "joao@example.pt",
            date:
                "2026-12-12",
            time:
                "15:30",
            visitors:
                12,
            status:
                "Confirmada"
        },
        {
            reference:
                "PRE-20261213-1445-G7H8I9",
            responsible:
                "Colégio do Porto",
            email:
                "colegio@example.pt",
            date:
                "2026-12-13",
            time:
                "14:45",
            visitors:
                25,
            status:
                "Sessão completa"
        }
    ];


    function exportBookings() {
        const headings = [
            "Referência",
            "Responsável",
            "Email",
            "Data",
            "Hora",
            "Visitantes",
            "Estado"
        ];

        const rows =
            sampleBookings.map(
                (booking) => [
                    booking.reference,
                    booking.responsible,
                    booking.email,
                    booking.date,
                    booking.time,
                    booking.visitors,
                    booking.status
                ]
            );

        const csv = [
            headings,
            ...rows
        ]
            .map((row) =>
                row
                    .map(
                        escapeCsvValue
                    )
                    .join(";")
            )
            .join("\n");

        downloadTextFile(
            "marcacoes-presepio-2026.csv",
            `\uFEFF${csv}`,
            "text/csv;charset=utf-8"
        );

        showToast(
            "Exportação concluída",
            "Foi criado um ficheiro CSV com os dados demonstrativos."
        );
    }


    function filterBookings() {
        const search =
            sanitizeText(
                getElement(
                    "admin-booking-search"
                )?.value
            ).toLowerCase();

        if (!search) {
            return;
        }

        const matches =
            sampleBookings.filter(
                (booking) => {
                    const searchable =
                        [
                            booking.reference,
                            booking.responsible,
                            booking.email,
                            booking.date,
                            booking.time,
                            booking.status
                        ]
                            .join(" ")
                            .toLowerCase();

                    return searchable.includes(
                        search
                    );
                }
            );

        showToast(
            "Pesquisa concluída",
            `${matches.length} resultado(s) encontrado(s) nos dados demonstrativos.`
        );
    }


    function initializeBookingControls() {
        getElement(
            "admin-export-bookings"
        )?.addEventListener(
            "click",
            exportBookings
        );

        getElement(
            "admin-new-booking"
        )?.addEventListener(
            "click",
            () => {
                openModal({
                    eyebrow:
                        "NOVA MARCAÇÃO",
                    title:
                        "Criar uma reserva",
                    message:
                        "A criação manual de reservas ficará disponível quando ligarmos o painel à base de dados."
                });
            }
        );

        getElement(
            "admin-booking-search"
        )?.addEventListener(
            "search",
            filterBookings
        );

        getElement(
            "admin-booking-search"
        )?.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key === "Enter"
                ) {
                    event.preventDefault();
                    filterBookings();
                }
            }
        );
    }


    /* =====================================================
       NOTIFICAÇÕES
       ===================================================== */

    const toast =
        getElement("admin-toast");


    function showToast(
        title,
        message,
        type = "success"
    ) {
        if (!toast) {
            return;
        }

        const icon =
            query(
                ".admin-toast-icon",
                toast
            );

        const titleElement =
            query("strong", toast);

        const messageElement =
            query("p", toast);

        if (icon) {
            const icons = {
                success: "✓",
                warning: "!",
                error: "×",
                info: "i"
            };

            icon.textContent =
                icons[type] || "✓";

            icon.dataset.type =
                type;
        }

        if (titleElement) {
            titleElement.textContent =
                title;
        }

        if (messageElement) {
            messageElement.textContent =
                message;
        }

        toast.dataset.type =
            type;

        toast.classList.add(
            "is-visible"
        );

        window.clearTimeout(
            state.toastTimer
        );

        state.toastTimer =
            window.setTimeout(() => {
                toast.classList.remove(
                    "is-visible"
                );
            }, CONFIG.toastDuration);
    }


    /* =====================================================
       MODAL
       ===================================================== */

    const modal =
        getElement("admin-modal");

    const modalClose =
        getElement("admin-modal-close");

    const modalContent =
        getElement(
            "admin-modal-content"
        );


    function openModal({
        eyebrow =
            "ADMINISTRAÇÃO",
        title =
            "Informação",
        message =
            ""
    } = {}) {
        if (!modal || !modalContent) {
            return;
        }

        state.previousFocus =
            document.activeElement;

        modalContent.innerHTML = "";

        const eyebrowElement =
            document.createElement("p");

        eyebrowElement.className =
            "admin-eyebrow";

        eyebrowElement.textContent =
            eyebrow;

        const titleElement =
            document.createElement("h2");

        titleElement.id =
            "admin-modal-title";

        titleElement.textContent =
            title;

        const messageElement =
            document.createElement("p");

        messageElement.textContent =
            message;

        modalContent.append(
            eyebrowElement,
            titleElement,
            messageElement
        );

        modal.classList.add(
            "is-open"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "admin-modal-open"
        );

        modalClose?.focus();
    }


    function closeModal() {
        if (!modal) {
            return;
        }

        modal.classList.remove(
            "is-open"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "admin-modal-open"
        );

        window.setTimeout(() => {
            if (
                state.previousFocus &&
                typeof state
                    .previousFocus
                    .focus ===
                    "function"
            ) {
                state.previousFocus.focus();
            }
        }, CONFIG.modalTransitionTime);
    }


    function initializeModal() {
        modalClose?.addEventListener(
            "click",
            closeModal
        );

        modal?.addEventListener(
            "click",
            (event) => {
                if (
                    event.target === modal
                ) {
                    closeModal();
                }
            }
        );
    }


    /* =====================================================
       GUARDAR E PRÉ-VISUALIZAR
       ===================================================== */

    function initializeTopbarActions() {
        getElement(
            "admin-save-button"
        )?.addEventListener(
            "click",
            () => {
                saveAllContent();

                getElement(
                    "admin-save-button"
                )?.classList.remove(
                    "has-unsaved-changes"
                );
            }
        );

        getElement(
            "admin-preview-button"
        )?.addEventListener(
            "click",
            openPublicPreview
        );
    }


    /* =====================================================
       TERMINAR SESSÃO
       ===================================================== */

    function logout() {
        clearSession();

        showToast(
            "Sessão terminada",
            "A regressar à página de entrada."
        );

        window.setTimeout(() => {
            window.location.href =
                `${CONFIG.loginPath}?logout=1`;
        }, 500);
    }


    function initializeLogout() {
        getElement(
            "admin-logout"
        )?.addEventListener(
            "click",
            () => {
                openConfirmationModal({
                    title:
                        "Terminar sessão?",
                    message:
                        "Será necessário iniciar sessão novamente para regressar ao painel.",
                    confirmLabel:
                        "Terminar sessão",
                    onConfirm:
                        logout
                });
            }
        );
    }


    function openConfirmationModal({
        title,
        message,
        confirmLabel =
            "Confirmar",
        onConfirm
    }) {
        if (!modal || !modalContent) {
            return;
        }

        state.previousFocus =
            document.activeElement;

        modalContent.innerHTML = "";

        const eyebrow =
            document.createElement("p");

        eyebrow.className =
            "admin-eyebrow";

        eyebrow.textContent =
            "CONFIRMAÇÃO";

        const heading =
            document.createElement("h2");

        heading.id =
            "admin-modal-title";

        heading.textContent =
            title;

        const paragraph =
            document.createElement("p");

        paragraph.textContent =
            message;

        const actions =
            document.createElement("div");

        actions.className =
            "admin-modal-actions";

        actions.style.display =
            "flex";

        actions.style.gap =
            "12px";

        actions.style.marginTop =
            "28px";

        const cancelButton =
            document.createElement("button");

        cancelButton.type =
            "button";

        cancelButton.className =
            "admin-secondary-button";

        cancelButton.textContent =
            "Cancelar";

        const confirmButton =
            document.createElement("button");

        confirmButton.type =
            "button";

        confirmButton.className =
            "admin-primary-button";

        confirmButton.textContent =
            confirmLabel;

        cancelButton.addEventListener(
            "click",
            closeModal
        );

        confirmButton.addEventListener(
            "click",
            () => {
                closeModal();

                if (
                    typeof onConfirm ===
                    "function"
                ) {
                    onConfirm();
                }
            }
        );

        actions.append(
            cancelButton,
            confirmButton
        );

        modalContent.append(
            eyebrow,
            heading,
            paragraph,
            actions
        );

        modal.classList.add(
            "is-open"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "admin-modal-open"
        );

        confirmButton.focus();
    }


    /* =====================================================
       ATALHOS DE TECLADO
       ===================================================== */

    function initializeKeyboardShortcuts() {
        document.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Escape") {
                    if (
                        modal?.classList.contains(
                            "is-open"
                        )
                    ) {
                        closeModal();
                        return;
                    }

                    if (
                        document.body.classList.contains(
                            "admin-sidebar-open"
                        )
                    ) {
                        setSidebar(false);
                    }
                }

                const saveShortcut =
                    (
                        event.metaKey ||
                        event.ctrlKey
                    ) &&
                    event.key.toLowerCase() ===
                        "s";

                if (
                    saveShortcut &&
                    isDashboardPage()
                ) {
                    event.preventDefault();

                    saveAllContent();
                }
            }
        );
    }


    /* =====================================================
       INFORMAÇÃO DO UTILIZADOR
       ===================================================== */

    function initializeAdminIdentity() {
        const session =
            getActiveSession();

        if (!session) {
            return;
        }

        const email =
            sanitizeText(
                session.email
            );

        queryAll(
            ".admin-user-information"
        ).forEach((container) => {
            const strong =
                query(
                    "strong",
                    container
                );

            const small =
                query(
                    "small",
                    container
                );

            if (strong) {
                strong.textContent =
                    email
                        .split("@")[0]
                        .replace(/[._-]+/g, " ")
                        .replace(
                            /\b\w/g,
                            (character) =>
                                character.toUpperCase()
                        ) ||
                    "Administrador";
            }

            if (small) {
                small.textContent =
                    "Terminar sessão";
            }
        });
    }


    /* =====================================================
       INICIALIZAÇÃO DO DASHBOARD
       ===================================================== */

    function initializeDashboard() {
        if (!isDashboardPage()) {
            return;
        }

        if (!protectDashboard()) {
            return;
        }

        initializeSidebar();
        initializeDashboardNavigation();
        initializeEditorNavigation();
        initializeTopbarActions();
        initializeBookingControls();
        initializeAutosaveIndicators();
        initializeAutomaticDrafts();
        initializeLogout();
        initializeAdminIdentity();

        loadSavedContent();
        loadSettings();
    }


    /* =====================================================
       INICIALIZAÇÃO PRINCIPAL
       ===================================================== */

    function initializeApplication() {
        initializeModal();
        initializeKeyboardShortcuts();

        initializeLogin();
        initializeDashboard();

        document.body.classList.add(
            "admin-ready"
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeApplication,
            {
                once: true
            }
        );
    } else {
        initializeApplication();
    }
})();