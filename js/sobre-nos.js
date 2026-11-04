"use strict";

(() => {
    const navbar =
        document.getElementById("navbar");

    const progressBar =
        document.getElementById("scroll-progress-bar");

    const mobileMenuButton =
        document.getElementById("mobile-menu-button");

    const mobileMenu =
        document.getElementById("mobile-menu");

    let lastScrollPosition =
        window.scrollY;

    let scrollFrame =
        null;


    /* Navbar e progresso */

    function updateScroll() {
        scrollFrame = null;

        const currentScroll =
            Math.max(window.scrollY, 0);

        const scrollableHeight =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const progress =
            scrollableHeight > 0
                ? currentScroll / scrollableHeight
                : 0;

        if (progressBar) {
            progressBar.style.transform =
                `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
        }

        if (navbar) {
            navbar.classList.toggle(
                "navbar-scrolled",
                currentScroll > 80
            );

            const scrollingDown =
                currentScroll > lastScrollPosition;

            if (
                scrollingDown &&
                currentScroll > 550 &&
                !document.body.classList.contains(
                    "mobile-menu-open"
                )
            ) {
                navbar.classList.add(
                    "navbar-hidden"
                );
            } else {
                navbar.classList.remove(
                    "navbar-hidden"
                );
            }
        }

        lastScrollPosition =
            currentScroll;
    }

    function requestScrollUpdate() {
        if (scrollFrame !== null) {
            return;
        }

        scrollFrame =
            window.requestAnimationFrame(
                updateScroll
            );
    }

    window.addEventListener(
        "scroll",
        requestScrollUpdate,
        {
            passive: true
        }
    );


    /* Menu móvel */

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

        mobileMenu.setAttribute(
            "aria-hidden",
            String(!open)
        );
    }

    mobileMenuButton?.addEventListener(
        "click",
        () => {
            setMobileMenu(
                !mobileMenu.classList.contains(
                    "is-open"
                )
            );
        }
    );

    mobileMenu
        ?.querySelectorAll("a")
        .forEach((link) => {
            link.addEventListener(
                "click",
                () => setMobileMenu(false)
            );
        });


    /* Galeria nacional */

    const countryImages = [
        {
            source:
                "./images/casas/portugal-1.jpg",

            alternative:
                "Casa dos Arautos do Evangelho em Portugal"
        },
        {
            source:
                "./images/casas/portugal-2.jpg",

            alternative:
                "Presença dos Arautos do Evangelho em Portugal"
        }
    ];

    const countryImage =
        document.getElementById("country-image");

    const countryPhotoNumber =
        document.getElementById(
            "country-photo-number"
        );

    const countryPrevious =
        document.getElementById(
            "country-previous"
        );

    const countryNext =
        document.getElementById(
            "country-next"
        );

    let activeCountryImage =
        0;

    function renderCountryImage(index) {
        if (!countryImage) {
            return;
        }

        activeCountryImage =
            (
                index +
                countryImages.length
            ) %
            countryImages.length;

        countryImage.style.opacity =
            "0";

        window.setTimeout(() => {
            const item =
                countryImages[
                    activeCountryImage
                ];

            countryImage.src =
                item.source;

            countryImage.alt =
                item.alternative;

            countryImage.style.opacity =
                "1";

            if (countryPhotoNumber) {
                countryPhotoNumber.textContent =
                    `${activeCountryImage + 1} / ${countryImages.length}`;
            }
        }, 180);
    }

    countryPrevious?.addEventListener(
        "click",
        () => {
            renderCountryImage(
                activeCountryImage - 1
            );
        }
    );

    countryNext?.addEventListener(
        "click",
        () => {
            renderCountryImage(
                activeCountryImage + 1
            );
        }
    );


    /* Acordeões */

    const houseCards =
        Array.from(
            document.querySelectorAll(
                ".house-card"
            )
        );

    houseCards.forEach((card) => {
        const button =
            card.querySelector(
                ".house-card-header"
            );

        const arrow =
            card.querySelector(
                ".house-card-arrow"
            );

        button?.addEventListener(
            "click",
            () => {
                const opening =
                    !card.classList.contains(
                        "is-open"
                    );

                houseCards.forEach(
                    (otherCard) => {
                        if (otherCard === card) {
                            return;
                        }

                        otherCard.classList.remove(
                            "is-open"
                        );

                        const otherButton =
                            otherCard.querySelector(
                                ".house-card-header"
                            );

                        const otherArrow =
                            otherCard.querySelector(
                                ".house-card-arrow"
                            );

                        otherButton?.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                        if (otherArrow) {
                            otherArrow.textContent =
                                "⌄";
                        }
                    }
                );

                card.classList.toggle(
                    "is-open",
                    opening
                );

                button.setAttribute(
                    "aria-expanded",
                    String(opening)
                );

                if (arrow) {
                    arrow.textContent =
                        opening ? "⌃" : "⌄";
                }
            }
        );
    });


    /* Pesquisa */

    const searchInput =
        document.getElementById(
            "houses-search-input"
        );

    const emptyMessage =
        document.getElementById(
            "houses-empty-message"
        );

    function normalizeText(value) {
        return value
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .trim();
    }

    searchInput?.addEventListener(
        "input",
        () => {
            const query =
                normalizeText(
                    searchInput.value
                );

            let visibleCards =
                0;

            houseCards.forEach((card) => {
                const name =
                    normalizeText(
                        card.dataset.houseName ||
                        card.textContent
                    );

                const visible =
                    !query ||
                    name.includes(query);

                card.hidden =
                    !visible;

                if (visible) {
                    visibleCards += 1;
                }
            });

            if (emptyMessage) {
                emptyMessage.hidden =
                    visibleCards !== 0;
            }
        }
    );


    /* Teclado */

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape" &&
                mobileMenu?.classList.contains(
                    "is-open"
                )
            ) {
                setMobileMenu(false);
            }
        }
    );


    updateScroll();
    renderCountryImage(0);
})();