"use strict";

(function () {
    function startDetailsAnimation() {
        const section = document.querySelector(
            ".details-section"
        );

        if (!section) {
            return;
        }

        const prefersReducedMotion =
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

        if (
            prefersReducedMotion ||
            !("IntersectionObserver" in window)
        ) {
            section.classList.add("is-visible");
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    section.classList.add("is-visible");
                    observer.disconnect();
                });
            },
            {
                threshold: 0.05,
                rootMargin: "0px 0px -5% 0px"
            }
        );

        observer.observe(section);

        /*
         * Se a página abrir diretamente em #detalhes,
         * inicia a animação imediatamente.
         */

        if (window.location.hash === "#detalhes") {
            window.setTimeout(() => {
                section.classList.add("is-visible");
            }, 150);
        }

        /*
         * Segurança: nunca deixa os elementos invisíveis
         * se existir algum problema no observador.
         */

        window.setTimeout(() => {
            section.classList.add("is-visible");
        }, 1400);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            startDetailsAnimation,
            {
                once: true
            }
        );
    } else {
        startDetailsAnimation();
    }
})();