"use strict";

/* =========================================================
   PRESÉPIO 2026
   MULTIMÉDIA GUARDADA PELO PAINEL
   ========================================================= */

(() => {
    if (window.presepioSiteMediaInitialized) {
        return;
    }

    window.presepioSiteMediaInitialized = true;

    const DATABASE_NAME =
        "presepio_media_database";

    const DATABASE_VERSION = 1;

    const STORE_NAME =
        "media_files";

    const objectUrls = [];


    /* =====================================================
       ABRIR BASE DE DADOS LOCAL
       ===================================================== */

    function openDatabase() {
        return new Promise(
            (resolve, reject) => {
                if (!("indexedDB" in window)) {
                    reject(
                        new Error(
                            "IndexedDB não está disponível."
                        )
                    );

                    return;
                }

                const request =
                    window.indexedDB.open(
                        DATABASE_NAME,
                        DATABASE_VERSION
                    );

                request.onupgradeneeded =
                    () => {
                        const database =
                            request.result;

                        if (
                            !database
                                .objectStoreNames
                                .contains(
                                    STORE_NAME
                                )
                        ) {
                            database.createObjectStore(
                                STORE_NAME,
                                {
                                    keyPath: "key"
                                }
                            );
                        }
                    };

                request.onsuccess =
                    () => {
                        resolve(
                            request.result
                        );
                    };

                request.onerror =
                    () => {
                        reject(
                            request.error ||
                            new Error(
                                "Erro ao abrir a biblioteca multimédia."
                            )
                        );
                    };

                request.onblocked =
                    () => {
                        reject(
                            new Error(
                                "A biblioteca multimédia está bloqueada por outra janela."
                            )
                        );
                    };
            }
        );
    }


    /* =====================================================
       LER FICHEIRO GUARDADO
       ===================================================== */

    async function getMedia(key) {
        let database = null;

        try {
            database =
                await openDatabase();

            return await new Promise(
                (resolve, reject) => {
                    const transaction =
                        database.transaction(
                            STORE_NAME,
                            "readonly"
                        );

                    const store =
                        transaction.objectStore(
                            STORE_NAME
                        );

                    const request =
                        store.get(key);

                    request.onsuccess =
                        () => {
                            resolve(
                                request.result ||
                                null
                            );
                        };

                    request.onerror =
                        () => {
                            reject(
                                request.error ||
                                new Error(
                                    `Erro ao carregar ${key}.`
                                )
                            );
                        };
                }
            );
        } finally {
            database?.close();
        }
    }


    /* =====================================================
       CRIAR URL TEMPORÁRIO
       ===================================================== */

    function createObjectUrl(file) {
        if (!(file instanceof Blob)) {
            return "";
        }

        const url =
            URL.createObjectURL(file);

        objectUrls.push(url);

        return url;
    }


    /* =====================================================
       SUBSTITUIR IMAGEM
       ===================================================== */

    async function replaceImage(
        key,
        selector
    ) {
        const media =
            await getMedia(key);

        if (!media?.file) {
            return false;
        }

        const image =
            document.querySelector(
                selector
            );

        if (
            !(image instanceof
                HTMLImageElement)
        ) {
            return false;
        }

        const url =
            createObjectUrl(
                media.file
            );

        if (!url) {
            return false;
        }

        image.src = url;

        image.dataset.adminMediaKey =
            key;

        return true;
    }


    /* =====================================================
       SUBSTITUIR VÍDEO
       ===================================================== */

    async function replaceVideo(
        key,
        selector
    ) {
        const media =
            await getMedia(key);

        if (!media?.file) {
            return false;
        }

        const video =
            document.querySelector(
                selector
            );

        if (
            !(video instanceof
                HTMLVideoElement)
        ) {
            return false;
        }

        const url =
            createObjectUrl(
                media.file
            );

        if (!url) {
            return false;
        }

        /*
         * Remove fontes antigas para evitar que
         * o navegador continue a usar o vídeo original.
         */

        video
            .querySelectorAll("source")
            .forEach((source) => {
                source.remove();
            });

        video.src = url;

        video.dataset.adminMediaKey =
            key;

        video.load();

        /*
         * Tenta retomar a reprodução automática
         * quando se trata do vídeo principal.
         */

        if (
            video.autoplay ||
            video.id === "hero-video"
        ) {
            video
                .play()
                .catch(() => {
                    /*
                     * Alguns navegadores podem bloquear
                     * a reprodução automática.
                     */
                });
        }

        return true;
    }


    /* =====================================================
       SUBSTITUIR FUNDO
       ===================================================== */

    async function replaceBackground(
        key,
        selector,
        overlay =
            "rgba(0, 0, 0, 0.78)"
    ) {
        const media =
            await getMedia(key);

        if (!media?.file) {
            return false;
        }

        const element =
            document.querySelector(
                selector
            );

        if (!element) {
            return false;
        }

        const url =
            createObjectUrl(
                media.file
            );

        if (!url) {
            return false;
        }

        element.style.backgroundImage =
            `linear-gradient(
                rgba(0, 0, 0, 0.06),
                ${overlay}
            ),
            url("${url}")`;

        element.style.backgroundPosition =
            "center";

        element.style.backgroundSize =
            "cover";

        element.dataset.adminMediaKey =
            key;

        return true;
    }


    /* =====================================================
       POSTER DO VÍDEO VERTICAL
       ===================================================== */

    async function replaceVideoPoster(
        key,
        selector
    ) {
        const media =
            await getMedia(key);

        if (!media?.file) {
            return false;
        }

        const video =
            document.querySelector(
                selector
            );

        if (
            !(video instanceof
                HTMLVideoElement)
        ) {
            return false;
        }

        const url =
            createObjectUrl(
                media.file
            );

        if (!url) {
            return false;
        }

        video.poster = url;

        return true;
    }


    /* =====================================================
       ATUALIZAR LIGHTBOX DA GALERIA
       ===================================================== */

    async function updateGalleryItem(
        key,
        itemNumber
    ) {
        const media =
            await getMedia(key);

        if (!media?.file) {
            return false;
        }

        const item =
            document.querySelector(
                `.gallery-item:nth-child(${itemNumber})`
            );

        if (!item) {
            return false;
        }

        const url =
            createObjectUrl(
                media.file
            );

        if (!url) {
            return false;
        }

        item.style.backgroundImage =
            `linear-gradient(
                rgba(0, 0, 0, 0.05),
                rgba(0, 0, 0, 0.78)
            ),
            url("${url}")`;

        /*
         * O main.js utiliza este atributo
         * quando abre o lightbox.
         */

        item.dataset.image = url;

        item.dataset.adminMediaKey =
            key;

        return true;
    }


    /* =====================================================
       APLICAR TODOS OS CONTEÚDOS
       ===================================================== */

    async function applyAdminMedia() {
        if (!("indexedDB" in window)) {
            document.documentElement.dataset
                .adminMediaLoaded =
                "unsupported";

            return;
        }

        const operations = [
            replaceVideo(
                "heroVideo",
                "#hero-video"
            ),

            replaceImage(
                "experienceImage",
                "#experience-image img"
            ),

            replaceImage(
                "detailsImage",
                ".details-image img"
            ),

            replaceVideo(
                "verticalVideo",
                "#vertical-video"
            ),

            replaceVideoPoster(
                "verticalPoster",
                "#vertical-video"
            ),

            replaceImage(
                "aboutImage",
                ".about-image img"
            ),

            replaceBackground(
                "visitImage",
                ".visit-section",
                "rgba(0, 0, 0, 0.38)"
            ),

            updateGalleryItem(
                "gallery1",
                1
            ),

            updateGalleryItem(
                "gallery2",
                2
            ),

            updateGalleryItem(
                "gallery3",
                3
            ),

            updateGalleryItem(
                "gallery4",
                4
            ),

            updateGalleryItem(
                "gallery5",
                5
            ),

            updateGalleryItem(
                "gallery6",
                6
            )
        ];

        try {
            const results =
                await Promise.allSettled(
                    operations
                );

            const rejected =
                results.filter(
                    (result) =>
                        result.status ===
                        "rejected"
                );

            if (rejected.length) {
                rejected.forEach(
                    (result) => {
                        console.warn(
                            "Um ficheiro multimédia não pôde ser aplicado.",
                            result.reason
                        );
                    }
                );
            }

            document.documentElement.dataset
                .adminMediaLoaded =
                "true";

            document.dispatchEvent(
                new CustomEvent(
                    "presepio:media-loaded"
                )
            );
        } catch (error) {
            console.warn(
                "A biblioteca multimédia não foi aplicada.",
                error
            );

            document.documentElement.dataset
                .adminMediaLoaded =
                "error";
        }
    }


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    function initialize() {
        /*
         * O ficheiro multimédia nunca deve esconder
         * nem bloquear o conteúdo principal.
         */

        applyAdminMedia().catch(
            (error) => {
                console.warn(
                    "Erro multimédia ignorado:",
                    error
                );

                document.documentElement.dataset
                    .adminMediaLoaded =
                    "error";
            }
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );
    } else {
        initialize();
    }


    /* =====================================================
       ATUALIZAÇÃO ENTRE JANELAS
       ===================================================== */

    window.addEventListener(
        "storage",
        (event) => {
            if (
                event.key ===
                "presepio_media_updated"
            ) {
                window.location.reload();
            }
        }
    );


    /* =====================================================
       LIMPEZA
       ===================================================== */

    window.addEventListener(
        "beforeunload",
        () => {
            objectUrls.forEach(
                (url) => {
                    URL.revokeObjectURL(
                        url
                    );
                }
            );
        }
    );
})();