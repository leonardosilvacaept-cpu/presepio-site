"use strict";

/* =========================================================
   PRESÉPIO 2026
   MAIN.JS COMPLETO E CORRIGIDO
   ========================================================= */

(() => {
    if (window.presepioMainInitialized) {
        return;
    }

    window.presepioMainInitialized = true;

    /* =====================================================
       CONFIGURAÇÃO
       ===================================================== */

    const CONFIG = {
        navbarScrollPoint: 80,
        mobileBreakpoint: 980,
        revealThreshold: 0.08,
        revealMargin: "0px 0px -5% 0px",
        countdownDate: "2026-12-01T14:00:00+00:00",
        loaderDelay: 500,
        loaderRemovalDelay: 900
    };

    /* =====================================================
       ESTADO
       ===================================================== */

    const state = {
        lastScrollPosition: window.scrollY,
        scrollFrame: null,
        activeGalleryIndex: 0,
        previousFocus: null,
        countdownTimer: null,
        loaderRemoved: false,
        pageResizeObserver: null
    };

    /* =====================================================
       ELEMENTOS GERAIS
       ===================================================== */

    const pageLoader =
        document.getElementById("page-loader");

    const progressBar =
        document.getElementById("scroll-progress-bar");

    const navbar =
        document.getElementById("navbar");

    const mobileMenuButton =
        document.getElementById("mobile-menu-button");

    const mobileMenu =
        document.getElementById("mobile-menu");

    /* =====================================================
       UTILITÁRIOS
       ===================================================== */

    function clamp(
        value,
        minimum = 0,
        maximum = 1
    ) {
        return Math.min(
            Math.max(value, minimum),
            maximum
        );
    }

    function formatTwoDigits(value) {
        return String(value).padStart(2, "0");
    }

    function reducedMotionIsActive() {
        return window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;
    }

    function getNavbarHeight() {
        if (!navbar) {
            return 0;
        }

        return navbar.offsetHeight;
    }

    /* =====================================================
       LOADER E PREPARAÇÃO
       ===================================================== */

    function preparePage() {
        document.body.classList.add("page-loaded");

        if (!reducedMotionIsActive()) {
            document.documentElement.classList.add(
                "motion-ready"
            );
        }
    }

    function removeLoader() {
        if (state.loaderRemoved) {
            return;
        }

        state.loaderRemoved = true;

        document.body.classList.add("page-loaded");

        if (!pageLoader) {
            return;
        }

        pageLoader.classList.add("is-hidden");

        pageLoader.setAttribute(
            "aria-hidden",
            "true"
        );

        window.setTimeout(() => {
            pageLoader.remove();
        }, CONFIG.loaderRemovalDelay);
    }

    function initializeLoader() {
        window.setTimeout(
            removeLoader,
            CONFIG.loaderDelay
        );

        window.setTimeout(
            removeLoader,
            2000
        );
    }

    /* =====================================================
       GARANTIR CONTEÚDO VISÍVEL
       ===================================================== */

    function guaranteeVisibleContent() {
        document
            .querySelectorAll("[data-reveal]")
            .forEach((element) => {
                const style =
                    window.getComputedStyle(element);

                const rectangle =
                    element.getBoundingClientRect();

                const hasInvalidVisibility =
                    style.visibility === "hidden" &&
                    rectangle.top <
                        window.innerHeight * 1.25;

                if (hasInvalidVisibility) {
                    element.classList.add(
                        "is-visible"
                    );
                }
            });

        document
            .querySelectorAll(
                ".experience-section, " +
                ".details-section"
            )
            .forEach((section) => {
                const rectangle =
                    section.getBoundingClientRect();

                if (
                    rectangle.top <
                        window.innerHeight * 1.25
                ) {
                    section.classList.add(
                        "is-visible"
                    );
                }
            });
    }

    /* =====================================================
       BARRA DE PROGRESSO
       ===================================================== */

    function updateScrollProgress() {
        if (!progressBar) {
            return;
        }

        const scrollableHeight =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const progress =
            scrollableHeight > 0
                ? clamp(
                    window.scrollY /
                    scrollableHeight
                )
                : 0;

        progressBar.style.transform =
            `scaleX(${progress})`;
    }

    /* =====================================================
       NAVBAR
       ===================================================== */

    function updateNavbar() {
        if (!navbar) {
            return;
        }

        const currentScroll =
            Math.max(window.scrollY, 0);

        navbar.classList.toggle(
            "navbar-scrolled",
            currentScroll >
                CONFIG.navbarScrollPoint
        );

        const scrollingDown =
            currentScroll >
            state.lastScrollPosition;

        const scrollDifference =
            Math.abs(
                currentScroll -
                state.lastScrollPosition
            );

        const mobileMenuOpen =
            document.body.classList.contains(
                "mobile-menu-open"
            );

        if (
            scrollingDown &&
            currentScroll > 550 &&
            scrollDifference > 5 &&
            !mobileMenuOpen
        ) {
            navbar.classList.add(
                "navbar-hidden"
            );
        } else if (
            !scrollingDown ||
            currentScroll < 550 ||
            mobileMenuOpen
        ) {
            navbar.classList.remove(
                "navbar-hidden"
            );
        }

        state.lastScrollPosition =
            currentScroll;
    }

    /* =====================================================
       MENU MÓVEL
       ===================================================== */

    function mobileMenuIsOpen() {
        return Boolean(
            mobileMenu?.classList.contains(
                "is-open"
            )
        );
    }

    function setMobileMenu(open) {
        if (
            !mobileMenuButton ||
            !mobileMenu
        ) {
            return;
        }

        mobileMenuButton.classList.toggle(
            "is-active",
            open
        );

        mobileMenu.classList.toggle(
            "is-open",
            open
        );

        document.body.classList.toggle(
            "mobile-menu-open",
            open
        );

        mobileMenuButton.setAttribute(
            "aria-expanded",
            String(open)
        );

        mobileMenuButton.setAttribute(
            "aria-label",
            open
                ? "Fechar menu"
                : "Abrir menu"
        );

        mobileMenu.setAttribute(
            "aria-hidden",
            String(!open)
        );

        navbar?.classList.remove(
            "navbar-hidden"
        );
    }

    function toggleMobileMenu(event) {
        event.preventDefault();
        event.stopPropagation();

        setMobileMenu(
            !mobileMenuIsOpen()
        );
    }

    function initializeMobileMenu() {
        if (
            !mobileMenuButton ||
            !mobileMenu
        ) {
            console.warn(
                "Menu móvel não encontrado no HTML."
            );

            return;
        }

        /*
         * Importante:
         * existe apenas UM evento de clique
         * para este botão.
         */

        mobileMenuButton.addEventListener(
            "click",
            toggleMobileMenu
        );

        mobileMenu
            .querySelectorAll("a[href]")
            .forEach((link) => {
                link.addEventListener(
                    "click",
                    () => {
                        setMobileMenu(false);
                    }
                );
            });

        /*
         * Tocar fora dos links não fecha o menu.
         * Apenas o botão, um link ou Escape fecham.
         */
    }

    /* =====================================================
       NAVEGAÇÃO SUAVE
       ===================================================== */

    function scrollToTarget(target) {
        const navbarHeight =
            getNavbarHeight();

        const targetTop =
            target.getBoundingClientRect().top +
            window.scrollY -
            navbarHeight +
            2;

        window.scrollTo({
            top: targetTop,
            behavior:
                reducedMotionIsActive()
                    ? "auto"
                    : "smooth"
        });
    }

    function initializeSmoothNavigation() {
        document
            .querySelectorAll('a[href^="#"]')
            .forEach((link) => {
                link.addEventListener(
                    "click",
                    (event) => {
                        const selector =
                            link.getAttribute(
                                "href"
                            );

                        if (
                            !selector ||
                            selector === "#"
                        ) {
                            return;
                        }

                        let target = null;

                        try {
                            target =
                                document.querySelector(
                                    selector
                                );
                        } catch (error) {
                            console.warn(
                                "Seletor inválido:",
                                selector
                            );

                            return;
                        }

                        if (!target) {
                            console.warn(
                                "Secção não encontrada:",
                                selector
                            );

                            return;
                        }

                        event.preventDefault();

                        setMobileMenu(false);

                        /*
                         * Pequeno atraso para permitir
                         * o início do fecho do menu.
                         */

                        window.setTimeout(() => {
                            scrollToTarget(target);
                        }, 30);

                        history.replaceState(
                            null,
                            "",
                            selector
                        );
                    }
                );
            });
    }

    /* =====================================================
       LINK ATIVO DA NAVBAR
       ===================================================== */

    function initializeActiveNavigation() {
        const links =
            Array.from(
                document.querySelectorAll(
                    ".nav-links a[href^='#']"
                )
            );

        if (
            !links.length ||
            !("IntersectionObserver" in window)
        ) {
            return;
        }

        const sections =
            links
                .map((link) => {
                    const selector =
                        link.getAttribute("href");

                    if (
                        !selector ||
                        selector === "#"
                    ) {
                        return null;
                    }

                    try {
                        return document.querySelector(
                            selector
                        );
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean);

        const observer =
            new IntersectionObserver(
                (entries) => {
                    const visible =
                        entries
                            .filter(
                                (entry) =>
                                    entry.isIntersecting
                            )
                            .sort(
                                (first, second) =>
                                    second
                                        .intersectionRatio -
                                    first
                                        .intersectionRatio
                            );

                    if (!visible.length) {
                        return;
                    }

                    const activeId =
                        visible[0].target.id;

                    links.forEach((link) => {
                        link.classList.toggle(
                            "is-active",
                            link.getAttribute(
                                "href"
                            ) ===
                                `#${activeId}`
                        );
                    });
                },
                {
                    rootMargin:
                        "-34% 0px -54% 0px",

                    threshold: [
                        0,
                        0.1,
                        0.3,
                        0.6
                    ]
                }
            );

        sections.forEach((section) => {
            observer.observe(section);
        });
    }

    /* =====================================================
       REVELAÇÕES GERAIS
       ===================================================== */

    function initializeGeneralReveals() {
        const elements =
            Array.from(
                document.querySelectorAll(
                    "[data-reveal]"
                )
            );

        if (!elements.length) {
            return;
        }

        if (
            reducedMotionIsActive() ||
            !("IntersectionObserver" in window)
        ) {
            elements.forEach((element) => {
                element.classList.add(
                    "is-visible"
                );
            });

            return;
        }

        const observer =
            new IntersectionObserver(
                (entries) => {
                    entries.forEach(
                        (entry) => {
                            if (
                                !entry.isIntersecting
                            ) {
                                return;
                            }

                            entry.target.classList.add(
                                "is-visible"
                            );

                            observer.unobserve(
                                entry.target
                            );
                        }
                    );
                },
                {
                    threshold:
                        CONFIG.revealThreshold,

                    rootMargin:
                        CONFIG.revealMargin
                }
            );

        elements.forEach((element) => {
            observer.observe(element);
        });
    }

    /* =====================================================
       EXPERIÊNCIA CINEMATOGRÁFICA
       ===================================================== */

    function initializeExperienceEntrance() {
        const section =
            document.querySelector(
                ".experience-section"
            );

        if (!section) {
            return;
        }

        const image =
            section.querySelector(
                ".experience-image"
            );

        if (!image) {
            return;
        }

        let animationFrame = null;

        function effectIsDisabled() {
            return (
                reducedMotionIsActive() ||
                window.innerWidth <= 900
            );
        }

        function updateExperienceEffect() {
            animationFrame = null;

            if (effectIsDisabled()) {
                section.style.setProperty(
                    "--experience-progress",
                    "1"
                );

                section.classList.add(
                    "is-visible"
                );

                return;
            }

            const rectangle =
                section.getBoundingClientRect();

            const viewportHeight =
                window.innerHeight;

            const start =
                viewportHeight * 0.92;

            const distance =
                viewportHeight * 1.05;

            const rawProgress =
                (
                    start -
                    rectangle.top
                ) /
                distance;

            const progress =
                clamp(rawProgress, 0, 1);

            section.style.setProperty(
                "--experience-progress",
                progress.toFixed(4)
            );

            section.classList.toggle(
                "is-visible",
                progress > 0.015
            );
        }

        function requestExperienceEffect() {
            if (animationFrame !== null) {
                return;
            }

            animationFrame =
                window.requestAnimationFrame(
                    updateExperienceEffect
                );
        }

        section.classList.add(
            "experience-motion-ready"
        );

        section.style.setProperty(
            "--experience-progress",
            "0"
        );

        window.addEventListener(
            "scroll",
            requestExperienceEffect,
            {
                passive: true
            }
        );

        window.addEventListener(
            "resize",
            requestExperienceEffect
        );

        requestExperienceEffect();
    }

    /* =====================================================
       ENTRADA DOS DETALHES
       ===================================================== */

    function initializeDetailsEntrance() {
        const section =
            document.querySelector(
                ".details-section"
            );

        if (!section) {
            return;
        }

        if (reducedMotionIsActive()) {
            section.classList.add(
                "details-motion-ready",
                "is-visible"
            );

            return;
        }

        section.classList.add(
            "details-motion-ready"
        );

        section.classList.remove(
            "is-visible"
        );

        if (
            !("IntersectionObserver" in window)
        ) {
            section.classList.add(
                "is-visible"
            );

            return;
        }

        const observer =
            new IntersectionObserver(
                (entries) => {
                    entries.forEach(
                        (entry) => {
                            if (
                                !entry.isIntersecting
                            ) {
                                return;
                            }

                            section.classList.add(
                                "is-visible"
                            );

                            observer.disconnect();
                        }
                    );
                },
                {
                    threshold: 0.06,
                    rootMargin:
                        "0px 0px -4% 0px"
                }
            );

        observer.observe(section);
    }

    /* =====================================================
       BRILHO DOS CARTÕES
       ===================================================== */

    function initializeCardLighting() {
        const cards =
            document.querySelectorAll(
                ".stat-card, " +
                ".details-card, " +
                ".value-card, " +
                ".visit-card, " +
                ".location-card, " +
                ".booking-location-card"
            );

        cards.forEach((card) => {
            card.addEventListener(
                "pointermove",
                (event) => {
                    const rectangle =
                        card.getBoundingClientRect();

                    const x =
                        (
                            (
                                event.clientX -
                                rectangle.left
                            ) /
                            rectangle.width
                        ) *
                        100;

                    const y =
                        (
                            (
                                event.clientY -
                                rectangle.top
                            ) /
                            rectangle.height
                        ) *
                        100;

                    card.style.setProperty(
                        "--pointer-x",
                        `${x}%`
                    );

                    card.style.setProperty(
                        "--pointer-y",
                        `${y}%`
                    );
                }
            );

            card.addEventListener(
                "pointerleave",
                () => {
                    card.style.removeProperty(
                        "--pointer-x"
                    );

                    card.style.removeProperty(
                        "--pointer-y"
                    );
                }
            );
        });
    }

    /* =====================================================
       VÍDEO PRINCIPAL
       ===================================================== */

    function initializeHeroVideo() {
        const heroVideo =
            document.getElementById(
                "hero-video"
            );

        if (!heroVideo) {
            return;
        }

        heroVideo.muted = true;
        heroVideo.defaultMuted = true;
        heroVideo.playsInline = true;

        heroVideo.setAttribute(
            "muted",
            ""
        );

        heroVideo.setAttribute(
            "playsinline",
            ""
        );

        heroVideo.setAttribute(
            "webkit-playsinline",
            ""
        );

        const playPromise =
            heroVideo.play();

        if (
            playPromise &&
            typeof playPromise.catch ===
                "function"
        ) {
            playPromise.catch(() => {
                document
                    .querySelector(".hero")
                    ?.classList.add(
                        "hero-video-fallback"
                    );
            });
        }
    }

    /* =====================================================
       VÍDEO VERTICAL
       ===================================================== */

    const verticalVideo =
        document.getElementById(
            "vertical-video"
        );

    const verticalVideoToggle =
        document.getElementById(
            "vertical-video-toggle"
        );

    const verticalVideoDevice =
        document.querySelector(
            ".vertical-video-device"
        );

    const verticalVideoIcon =
        verticalVideoToggle?.querySelector(
            ".vertical-video-play"
        );

    const verticalVideoText =
        verticalVideoToggle?.querySelector(
            ".vertical-video-button-text"
        );

    function updateVerticalVideoButton() {
        if (
            !verticalVideo ||
            !verticalVideoToggle
        ) {
            return;
        }

        const playing =
            !verticalVideo.paused &&
            !verticalVideo.ended;

        verticalVideoDevice
            ?.classList
            .toggle(
                "is-playing",
                playing
            );

        verticalVideoToggle.setAttribute(
            "aria-label",
            playing
                ? "Pausar vídeo"
                : "Reproduzir vídeo"
        );

        if (verticalVideoIcon) {
            verticalVideoIcon.textContent =
                playing
                    ? "Ⅱ"
                    : "▶";
        }

        if (verticalVideoText) {
            verticalVideoText.textContent =
                playing
                    ? "Pausar"
                    : "Reproduzir";
        }
    }

    async function toggleVerticalVideo() {
        if (!verticalVideo) {
            return;
        }

        if (verticalVideo.paused) {
            try {
                await verticalVideo.play();
            } catch {
                if (verticalVideoText) {
                    verticalVideoText.textContent =
                        "Vídeo indisponível";
                }
            }
        } else {
            verticalVideo.pause();
        }

        updateVerticalVideoButton();
    }

    function initializeVerticalVideo() {
        verticalVideoToggle?.addEventListener(
            "click",
            toggleVerticalVideo
        );

        verticalVideo?.addEventListener(
            "click",
            toggleVerticalVideo
        );

        verticalVideo?.addEventListener(
            "play",
            updateVerticalVideoButton
        );

        verticalVideo?.addEventListener(
            "pause",
            updateVerticalVideoButton
        );

        verticalVideo?.addEventListener(
            "ended",
            updateVerticalVideoButton
        );

        verticalVideo?.addEventListener(
            "error",
            () => {
                if (verticalVideoText) {
                    verticalVideoText.textContent =
                        "Vídeo em preparação";
                }
            }
        );

        updateVerticalVideoButton();
    }

    /* =====================================================
       GALERIA E LIGHTBOX
       ===================================================== */

    const galleryItems =
        Array.from(
            document.querySelectorAll(
                ".gallery-item"
            )
        );

    const lightbox =
        document.getElementById("lightbox");

    const lightboxImage =
        document.getElementById(
            "lightbox-image"
        );

    const lightboxTitle =
        document.getElementById(
            "lightbox-title"
        );

    const lightboxDescription =
        document.getElementById(
            "lightbox-description"
        );

    const lightboxClose =
        document.getElementById(
            "lightbox-close"
        );

    const lightboxPrevious =
        document.getElementById(
            "lightbox-previous"
        );

    const lightboxNext =
        document.getElementById(
            "lightbox-next"
        );

    function renderLightbox(index) {
        if (!galleryItems.length) {
            return;
        }

        state.activeGalleryIndex =
            (
                index +
                galleryItems.length
            ) %
            galleryItems.length;

        const item =
            galleryItems[
                state.activeGalleryIndex
            ];

        const image =
            item.dataset.image || "";

        const title =
            item.dataset.title ||
            "Fotografia do Presépio";

        const description =
            item.dataset.description || "";

        if (lightboxImage) {
            lightboxImage.src = image;
            lightboxImage.alt = title;
        }

        if (lightboxTitle) {
            lightboxTitle.textContent =
                title;
        }

        if (lightboxDescription) {
            lightboxDescription.textContent =
                description;
        }
    }

    function openLightbox(index) {
        if (!lightbox) {
            return;
        }

        state.previousFocus =
            document.activeElement;

        renderLightbox(index);

        lightbox.classList.add(
            "is-open"
        );

        lightbox.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "lightbox-open"
        );

        lightboxClose?.focus();
    }

    function closeLightbox() {
        if (!lightbox) {
            return;
        }

        lightbox.classList.remove(
            "is-open"
        );

        lightbox.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "lightbox-open"
        );

        if (
            typeof state.previousFocus
                ?.focus ===
                "function"
        ) {
            state.previousFocus.focus();
        }
    }

    function initializeGallery() {
        galleryItems.forEach(
            (item, index) => {
                item.addEventListener(
                    "click",
                    () => {
                        openLightbox(index);
                    }
                );
            }
        );

        lightboxClose?.addEventListener(
            "click",
            closeLightbox
        );

        lightboxPrevious?.addEventListener(
            "click",
            () => {
                renderLightbox(
                    state.activeGalleryIndex -
                        1
                );
            }
        );

        lightboxNext?.addEventListener(
            "click",
            () => {
                renderLightbox(
                    state.activeGalleryIndex +
                        1
                );
            }
        );

        lightbox?.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    lightbox
                ) {
                    closeLightbox();
                }
            }
        );
    }

    /* =====================================================
       CONTAGEM DECRESCENTE
       ===================================================== */

    const daysElement =
        document.getElementById("days");

    const hoursElement =
        document.getElementById("hours");

    const minutesElement =
        document.getElementById("minutes");

    const secondsElement =
        document.getElementById("seconds");

    const countdownMessage =
        document.getElementById(
            "countdown-message"
        );

    function updateCountdown() {
        if (
            !daysElement ||
            !hoursElement ||
            !minutesElement ||
            !secondsElement
        ) {
            return;
        }

        const targetDate =
            new Date(
                CONFIG.countdownDate
            ).getTime();

        if (!Number.isFinite(targetDate)) {
            if (countdownMessage) {
                countdownMessage.textContent =
                    "Data por definir.";
            }

            return;
        }

        const difference =
            targetDate -
            Date.now();

        if (difference <= 0) {
            daysElement.textContent = "00";
            hoursElement.textContent = "00";
            minutesElement.textContent = "00";
            secondsElement.textContent = "00";

            if (countdownMessage) {
                countdownMessage.textContent =
                    "A experiência já começou.";
            }

            if (
                state.countdownTimer !==
                null
            ) {
                window.clearInterval(
                    state.countdownTimer
                );

                state.countdownTimer = null;
            }

            return;
        }

        const totalSeconds =
            Math.floor(
                difference / 1000
            );

        const days =
            Math.floor(
                totalSeconds / 86400
            );

        const hours =
            Math.floor(
                (
                    totalSeconds %
                    86400
                ) /
                3600
            );

        const minutes =
            Math.floor(
                (
                    totalSeconds %
                    3600
                ) /
                60
            );

        const seconds =
            totalSeconds % 60;

        daysElement.textContent =
            formatTwoDigits(days);

        hoursElement.textContent =
            formatTwoDigits(hours);

        minutesElement.textContent =
            formatTwoDigits(minutes);

        secondsElement.textContent =
            formatTwoDigits(seconds);

        if (countdownMessage) {
            countdownMessage.textContent =
                "";
        }
    }

    function initializeCountdown() {
        updateCountdown();

        state.countdownTimer =
            window.setInterval(
                updateCountdown,
                1000
            );
    }

    /* =====================================================
       CONTROLOS DE TECLADO
       ===================================================== */

    function initializeKeyboardControls() {
        document.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Escape") {
                    if (
                        lightbox
                            ?.classList
                            .contains(
                                "is-open"
                            )
                    ) {
                        closeLightbox();

                        return;
                    }

                    if (mobileMenuIsOpen()) {
                        setMobileMenu(false);
                    }
                }

                if (
                    lightbox
                        ?.classList
                        .contains(
                            "is-open"
                        )
                ) {
                    if (
                        event.key ===
                        "ArrowLeft"
                    ) {
                        renderLightbox(
                            state.activeGalleryIndex -
                                1
                        );
                    }

                    if (
                        event.key ===
                        "ArrowRight"
                    ) {
                        renderLightbox(
                            state.activeGalleryIndex +
                                1
                        );
                    }
                }
            }
        );
    }

    /* =====================================================
       CICLO DE SCROLL
       ===================================================== */

    function updateScrollEffects() {
        state.scrollFrame = null;

        updateScrollProgress();
        updateNavbar();
    }

    function requestScrollEffects() {
        if (
            state.scrollFrame !== null
        ) {
            return;
        }

        state.scrollFrame =
            window.requestAnimationFrame(
                updateScrollEffects
            );
    }

    function initializeScrollEffects() {
        window.addEventListener(
            "scroll",
            requestScrollEffects,
            {
                passive: true
            }
        );

        window.addEventListener(
            "resize",
            () => {
                requestScrollEffects();

                if (
                    window.innerWidth >
                    CONFIG.mobileBreakpoint
                ) {
                    setMobileMenu(false);
                }
            }
        );
    }

    /* =====================================================
       ALTURA PARA PÁGINA INCORPORADA
       ===================================================== */

    function sendPageHeightToParent() {
        if (window.parent === window) {
            return;
        }

        const height =
            Math.max(
                document.body.scrollHeight,
                document.documentElement
                    .scrollHeight,
                document.body.offsetHeight,
                document.documentElement
                    .offsetHeight
            );

        window.parent.postMessage(
            {
                type:
                    "PRESEPIO_PAGE_HEIGHT",

                height
            },
            "*"
        );
    }

    function initializePageHeightObserver() {
        window.addEventListener(
            "load",
            sendPageHeightToParent
        );

        window.addEventListener(
            "resize",
            sendPageHeightToParent
        );

        if (
            "ResizeObserver" in window
        ) {
            state.pageResizeObserver =
                new ResizeObserver(
                    sendPageHeightToParent
                );

            state.pageResizeObserver.observe(
                document.documentElement
            );
        }

        [500, 1500, 3000].forEach(
            (delay) => {
                window.setTimeout(
                    sendPageHeightToParent,
                    delay
                );
            }
        );
    }

    /* =====================================================
       INICIALIZAÇÃO PRINCIPAL
       ===================================================== */
/* =====================================================
   TRANSIÇÕES ENTRE SECÇÕES
   DEGRADÉ, BRILHO E FRAME MOTION
   ===================================================== */

function initializeSectionTransitions() {
    const sections =
        Array.from(
            document.querySelectorAll(
                ".section-transition"
            )
        );

    if (!sections.length) {
        return;
    }

    const reducedMotion =
        reducedMotionIsActive();

    sections.forEach((section) => {
        if (
            section.dataset
                .sectionMotionInitialized ===
            "true"
        ) {
            return;
        }

        section.dataset
            .sectionMotionInitialized =
            "true";

        const glow =
            document.createElement("div");

        glow.className =
            "section-motion-glow";

        glow.setAttribute(
            "aria-hidden",
            "true"
        );

        const line =
            document.createElement("div");

        line.className =
            "section-transition-line";

        line.setAttribute(
            "aria-hidden",
            "true"
        );

        const frame =
            document.createElement("div");

        frame.className =
            "section-frame";

        frame.setAttribute(
            "aria-hidden",
            "true"
        );

        /*
         * Inserir os efeitos sem mover
         * o conteúdo original da secção.
         */

        section.prepend(glow);
        section.appendChild(line);
        section.appendChild(frame);

        if (reducedMotion) {
            section.style.setProperty(
                "--motion-progress",
                "1"
            );

            section.style.setProperty(
                "--motion-frame-opacity",
                "1"
            );

            section.style.setProperty(
                "--motion-frame-scale",
                "1"
            );

            section.style.setProperty(
                "--motion-line-scale",
                "1"
            );

            section.style.setProperty(
                "--motion-glow-opacity",
                "0.6"
            );

            section.classList.add(
                "is-section-visible"
            );
        }
    });

    if (reducedMotion) {
        return;
    }

    if (
        !("IntersectionObserver" in window)
    ) {
        sections.forEach((section) => {
            section.classList.add(
                "is-section-visible"
            );
        });

        return;
    }

    const observer =
        new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add(
                        "is-section-visible"
                    );
                });
            },
            {
                threshold: 0.08,

                rootMargin:
                    "0px 0px -7% 0px"
            }
        );

    sections.forEach((section) => {
        observer.observe(section);
    });

    let motionFrame = null;

    function updateSectionMotion() {
        motionFrame = null;

        const viewportHeight =
            window.innerHeight;

        sections.forEach((section) => {
            const rectangle =
                section.getBoundingClientRect();

            const start =
                viewportHeight * 0.97;

            const distance =
                viewportHeight * 0.76;

            const rawProgress =
                (
                    start -
                    rectangle.top
                ) /
                distance;

            const progress =
                clamp(
                    rawProgress,
                    0,
                    1
                );

            section.style.setProperty(
                "--motion-progress",
                progress.toFixed(4)
            );

            section.style.setProperty(
                "--motion-frame-opacity",
                Math.min(
                    progress * 1.4,
                    1
                ).toFixed(4)
            );

            section.style.setProperty(
                "--motion-frame-scale",
                (
                    0.975 +
                    progress * 0.025
                ).toFixed(4)
            );

            section.style.setProperty(
                "--motion-line-scale",
                Math.min(
                    progress * 1.25,
                    1
                ).toFixed(4)
            );

            section.style.setProperty(
                "--motion-glow-opacity",
                Math.min(
                    progress,
                    1
                ).toFixed(4)
            );
        });
    }

    function requestSectionMotion() {
        if (motionFrame !== null) {
            return;
        }

        motionFrame =
            window.requestAnimationFrame(
                updateSectionMotion
            );
    }

    window.addEventListener(
        "scroll",
        requestSectionMotion,
        {
            passive: true
        }
    );

    window.addEventListener(
        "resize",
        requestSectionMotion
    );

    requestSectionMotion();
}
    function initializeApplication() {
        preparePage();
        initializeLoader();
        initializeMobileMenu();
        initializeSmoothNavigation();
        initializeActiveNavigation();
        initializeGeneralReveals();
        initializeSectionTransitions();
        initializeCardLighting();
        initializeHeroVideo();
        initializeVerticalVideo();
        initializeGallery();
        initializeCountdown();
        initializeKeyboardControls();
        initializeScrollEffects();
        initializePageHeightObserver();

        updateScrollProgress();
        updateNavbar();

        window.setTimeout(
            guaranteeVisibleContent,
            1800
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
