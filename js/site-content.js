"use strict";

/* =========================================================
   PRESÉPIO 2026
   Conteúdos editados no painel de administração
   ========================================================= */

(() => {
    const CONTENT_STORAGE_KEY =
        "presepio_site_content";

    const SETTINGS_STORAGE_KEY =
        "presepio_admin_settings";


    /* =====================================================
       UTILITÁRIOS
       ===================================================== */

    function readStorage(key) {
        try {
            const storedValue =
                window.localStorage.getItem(key);

            if (!storedValue) {
                return null;
            }

            return JSON.parse(storedValue);
        } catch (error) {
            console.warn(
                `Não foi possível carregar "${key}".`,
                error
            );

            return null;
        }
    }


    function normalizeText(value) {
        if (typeof value !== "string") {
            return "";
        }

        return value.trim();
    }


    function getElement(selector) {
        try {
            return document.querySelector(selector);
        } catch (error) {
            console.warn(
                `Seletor inválido: ${selector}`,
                error
            );

            return null;
        }
    }


    function updateText(selector, value) {
        const element =
            getElement(selector);

        const text =
            normalizeText(value);

        if (!element || !text) {
            return;
        }

        element.textContent = text;
    }


    function updateMultilineText(
        selector,
        value
    ) {
        const element =
            getElement(selector);

        const text =
            normalizeText(value);

        if (!element || !text) {
            return;
        }

        const lines = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (!lines.length) {
            return;
        }

        const fragment =
            document.createDocumentFragment();

        lines.forEach((line, index) => {
            if (index > 0) {
                fragment.appendChild(
                    document.createElement("br")
                );
            }

            fragment.appendChild(
                document.createTextNode(line)
            );
        });

        element.replaceChildren(fragment);
    }


    function updateLink(
        selector,
        href,
        visibleText = ""
    ) {
        const element =
            getElement(selector);

        if (
            !(element instanceof HTMLAnchorElement) ||
            !href
        ) {
            return;
        }

        element.href = href;

        if (normalizeText(visibleText)) {
            element.textContent =
                normalizeText(visibleText);
        }
    }


    function setSectionVisible(
        selector,
        visible
    ) {
        const element =
            getElement(selector);

        if (!element) {
            return;
        }

        element.hidden = !visible;

        element.setAttribute(
            "aria-hidden",
            String(!visible)
        );
    }


    /* =====================================================
       CONTEÚDOS PRINCIPAIS
       ===================================================== */

    function applyHeroContent(content) {
        updateText(
            ".hero-content .eyebrow",
            content.heroEyebrow
        );

        updateMultilineText(
            ".hero-content h1",
            content.heroTitle
        );

        updateText(
            ".hero-description",
            content.heroDescription
        );
    }


    function applyExperienceContent(content) {
        updateText(
            ".experience-content " +
            ".section-heading h2",
            content.experienceTitle
        );

        updateText(
            ".experience-content " +
            ".section-heading > p:last-child",
            content.experienceDescription
        );
    }


    function applyAboutContent(content) {
        updateMultilineText(
            ".about-heading h2",
            content.aboutTitle
        );

        const aboutParagraphs =
            document.querySelectorAll(
                ".about-content > " +
                "p:not(.about-kicker)"
            );

        const description =
            normalizeText(
                content.aboutDescription
            );

        if (
            description &&
            aboutParagraphs.length
        ) {
            aboutParagraphs[0].textContent =
                description;
        }
    }


    function applyVisitContent(content) {
        updateText(
            ".visit-card:nth-child(2) p",
            content.address
        );

        updateText(
            ".visit-card:nth-child(3) h3",
            content.duration
        );

        const openingTime =
            normalizeText(
                content.openingTime
            );

        const closingTime =
            normalizeText(
                content.closingTime
            );

        if (openingTime && closingTime) {
            updateText(
                ".visit-card:nth-child(1) p",
                `${openingTime} às ${closingTime}`
            );
        }

        const mapsLink =
            getElement(
                ".visit-actions " +
                "a[target='_blank']"
            );

        const address =
            normalizeText(content.address);

        if (
            mapsLink instanceof
                HTMLAnchorElement &&
            address
        ) {
            mapsLink.href =
                "https://www.google.com/maps/" +
                "dir/?api=1&destination=" +
                encodeURIComponent(address);
        }
    }


    function applyContactContent(content) {
        const contactEmail =
            normalizeText(
                content.contactEmail
            );

        const contactPhone =
            normalizeText(
                content.contactPhone
            );

        if (contactEmail) {
            updateLink(
                ".contact-actions " +
                "a[href^='mailto:']",
                `mailto:${contactEmail}`
            );
        }

        if (contactPhone) {
            const telephoneHref =
                contactPhone.replace(
                    /[^\d+]/g,
                    ""
                );

            updateLink(
                ".contact-actions " +
                "a[href^='tel:']",
                `tel:${telephoneHref}`
            );
        }
    }


    /* =====================================================
       DEFINIÇÕES
       ===================================================== */

    function applySettings(settings) {
        if (!settings) {
            return;
        }

        /*
         * Interruptor 1:
         * Site publicado.
         *
         * Não escondemos o site durante os testes.
         * Apenas guardamos o valor.
         */

        const bookingsEnabled =
            settings.settingSwitch2 !== false;

        const countdownEnabled =
            settings.settingSwitch3 !== false;

        setSectionVisible(
            "#marcacoes",
            bookingsEnabled
        );

        setSectionVisible(
            ".countdown-section",
            countdownEnabled
        );

        const bookingLinks =
            document.querySelectorAll(
                "a[href='#marcacoes']"
            );

        bookingLinks.forEach((link) => {
            link.hidden = !bookingsEnabled;
        });
    }


    /* =====================================================
       MARCA DE ATUALIZAÇÃO
       ===================================================== */

    function addAdminUpdateMarker() {
        document.documentElement.dataset
            .adminContentLoaded = "true";
    }


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    function applyAdminContent() {
        const content =
            readStorage(
                CONTENT_STORAGE_KEY
            );

        const settings =
            readStorage(
                SETTINGS_STORAGE_KEY
            );

        if (content) {
            applyHeroContent(content);
            applyExperienceContent(content);
            applyAboutContent(content);
            applyVisitContent(content);
            applyContactContent(content);
        }

        applySettings(settings);
        addAdminUpdateMarker();
    }


    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            applyAdminContent,
            {
                once: true
            }
        );
    } else {
        applyAdminContent();
    }


    /*
     * Atualiza o site automaticamente se o painel
     * estiver aberto noutra janela do navegador e
     * o administrador guardar alterações.
     */

    window.addEventListener(
        "storage",
        (event) => {
            if (
                event.key ===
                    CONTENT_STORAGE_KEY ||
                event.key ===
                    SETTINGS_STORAGE_KEY
            ) {
                applyAdminContent();
            }
        }
    );
})();