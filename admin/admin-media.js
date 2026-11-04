"use strict";

/* =========================================================
   PRESÉPIO 2026
   Biblioteca multimédia local do administrador
   ========================================================= */

(() => {
    const DATABASE_NAME =
        "presepio_media_database";

    const DATABASE_VERSION = 1;

    const STORE_NAME =
        "media_files";

    const ALLOWED_IMAGE_TYPES = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    const ALLOWED_VIDEO_TYPES = [
        "video/mp4",
        "video/webm"
    ];

    const MAX_IMAGE_SIZE =
        15 * 1024 * 1024;

    const MAX_VIDEO_SIZE =
        150 * 1024 * 1024;

    const mediaInput =
        document.getElementById(
            "admin-media-input"
        );

    const uploadButton =
        document.getElementById(
            "admin-upload-media"
        );

    const mediaCards = Array.from(
        document.querySelectorAll(
            ".admin-media-card"
        )
    );

    let selectedMediaKey = null;
    let currentObjectUrls = [];


    /* =====================================================
       CONFIGURAÇÃO DOS ELEMENTOS EDITÁVEIS
       ===================================================== */

    const MEDIA_TARGETS = {
        heroVideo: {
            label: "Vídeo principal",
            fileName: "presepio-hero.mp4",
            type: "video",
            previewSelector: ".hero-preview"
        },

        experienceImage: {
            label: "Experiência",
            fileName: "experiencia.jpg",
            type: "image",
            previewSelector:
                ".experience-preview"
        },

        detailsImage: {
            label: "Detalhes",
            fileName: "detalhes.jpg",
            type: "image",
            previewSelector:
                ".details-preview"
        },

        verticalVideo: {
            label: "Vídeo vertical",
            fileName: "video-vertical.mp4",
            type: "video",
            previewSelector:
                ".vertical-preview"
        },

        verticalPoster: {
            label: "Poster do vídeo vertical",
            fileName:
                "video-vertical-poster.jpg",
            type: "image",
            previewSelector:
                ".vertical-preview"
        },

        aboutImage: {
            label: "Quem somos",
            fileName: "quem-somos.jpg",
            type: "image",
            previewSelector:
                ".about-preview"
        },

        visitImage: {
            label: "Visitar",
            fileName: "visitar.jpg",
            type: "image",
            previewSelector:
                ".visit-preview"
        },

        gallery1: {
            label: "Galeria 1",
            fileName: "galeria-1.jpg",
            type: "image",
            previewSelector:
                "[data-media-key='gallery1']"
        },

        gallery2: {
            label: "Galeria 2",
            fileName: "galeria-2.jpg",
            type: "image",
            previewSelector:
                "[data-media-key='gallery2']"
        },

        gallery3: {
            label: "Galeria 3",
            fileName: "galeria-3.jpg",
            type: "image",
            previewSelector:
                "[data-media-key='gallery3']"
        },

        gallery4: {
            label: "Galeria 4",
            fileName: "galeria-4.jpg",
            type: "image",
            previewSelector:
                "[data-media-key='gallery4']"
        },

        gallery5: {
            label: "Galeria 5",
            fileName: "galeria-5.jpg",
            type: "image",
            previewSelector:
                "[data-media-key='gallery5']"
        },

        gallery6: {
            label: "Galeria 6",
            fileName: "galeria-6.jpg",
            type: "image",
            previewSelector:
                "[data-media-key='gallery6']"
        }
    };


    /* =====================================================
       INDEXEDDB
       ===================================================== */

    function openDatabase() {
        return new Promise(
            (resolve, reject) => {
                const request =
                    indexedDB.open(
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
                            request.error
                        );
                    };
            }
        );
    }


    async function saveMedia(
        key,
        file
    ) {
        const database =
            await openDatabase();

        return new Promise(
            (resolve, reject) => {
                const transaction =
                    database.transaction(
                        STORE_NAME,
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        STORE_NAME
                    );

                store.put({
                    key,
                    file,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    updatedAt:
                        new Date()
                            .toISOString()
                });

                transaction.oncomplete =
                    () => {
                        database.close();
                        resolve();
                    };

                transaction.onerror =
                    () => {
                        database.close();

                        reject(
                            transaction.error
                        );
                    };
            }
        );
    }


    async function getMedia(key) {
        const database =
            await openDatabase();

        return new Promise(
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
                        database.close();

                        resolve(
                            request.result ||
                            null
                        );
                    };

                request.onerror =
                    () => {
                        database.close();

                        reject(
                            request.error
                        );
                    };
            }
        );
    }


    async function deleteMedia(key) {
        const database =
            await openDatabase();

        return new Promise(
            (resolve, reject) => {
                const transaction =
                    database.transaction(
                        STORE_NAME,
                        "readwrite"
                    );

                transaction
                    .objectStore(
                        STORE_NAME
                    )
                    .delete(key);

                transaction.oncomplete =
                    () => {
                        database.close();
                        resolve();
                    };

                transaction.onerror =
                    () => {
                        database.close();

                        reject(
                            transaction.error
                        );
                    };
            }
        );
    }


    /* =====================================================
       NOTIFICAÇÕES
       ===================================================== */

    function showMediaMessage(
        title,
        message,
        type = "success"
    ) {
        const toast =
            document.getElementById(
                "admin-toast"
            );

        if (!toast) {
            window.alert(
                `${title}\n\n${message}`
            );

            return;
        }

        const titleElement =
            toast.querySelector(
                "strong"
            );

        const messageElement =
            toast.querySelector(
                "p"
            );

        const icon =
            toast.querySelector(
                ".admin-toast-icon"
            );

        if (titleElement) {
            titleElement.textContent =
                title;
        }

        if (messageElement) {
            messageElement.textContent =
                message;
        }

        if (icon) {
            icon.textContent =
                type === "error"
                    ? "×"
                    : type === "warning"
                        ? "!"
                        : "✓";
        }

        toast.dataset.type = type;

        toast.classList.add(
            "is-visible"
        );

        window.setTimeout(() => {
            toast.classList.remove(
                "is-visible"
            );
        }, 3500);
    }


    /* =====================================================
       VALIDAÇÃO
       ===================================================== */

    function validateFile(
        file,
        target
    ) {
        if (!file || !target) {
            return {
                valid: false,
                message:
                    "Não foi selecionado nenhum ficheiro."
            };
        }

        const isImage =
            ALLOWED_IMAGE_TYPES.includes(
                file.type
            );

        const isVideo =
            ALLOWED_VIDEO_TYPES.includes(
                file.type
            );

        if (
            target.type === "image" &&
            !isImage
        ) {
            return {
                valid: false,
                message:
                    "Selecione uma imagem JPG, PNG ou WebP."
            };
        }

        if (
            target.type === "video" &&
            !isVideo
        ) {
            return {
                valid: false,
                message:
                    "Selecione um vídeo MP4 ou WebM."
            };
        }

        const maximumSize =
            target.type === "video"
                ? MAX_VIDEO_SIZE
                : MAX_IMAGE_SIZE;

        if (file.size > maximumSize) {
            const maximumMegabytes =
                Math.round(
                    maximumSize /
                    1024 /
                    1024
                );

            return {
                valid: false,
                message:
                    `O ficheiro ultrapassa o limite de ${maximumMegabytes} MB.`
            };
        }

        return {
            valid: true,
            message: ""
        };
    }


    /* =====================================================
       PRÉ-VISUALIZAÇÃO
       ===================================================== */

    function clearObjectUrls() {
        currentObjectUrls.forEach(
            (url) => {
                URL.revokeObjectURL(url);
            }
        );

        currentObjectUrls = [];
    }


    function findPreviewElement(key) {
        const target =
            MEDIA_TARGETS[key];

        if (!target) {
            return null;
        }

        return document.querySelector(
            target.previewSelector
        );
    }


    function setPreview(
        key,
        media
    ) {
        const preview =
            findPreviewElement(key);

        if (!preview || !media?.file) {
            return;
        }

        const objectUrl =
            URL.createObjectURL(
                media.file
            );

        currentObjectUrls.push(
            objectUrl
        );

        const existingVideo =
            preview.querySelector(
                "video"
            );

        if (existingVideo) {
            existingVideo.remove();
        }

        if (
            media.type.startsWith(
                "video/"
            )
        ) {
            const video =
                document.createElement(
                    "video"
                );

            video.src = objectUrl;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = "metadata";

            video.style.position =
                "absolute";

            video.style.inset = "0";

            video.style.width = "100%";
            video.style.height = "100%";

            video.style.objectFit =
                "cover";

            preview.prepend(video);

            video.play().catch(() => {
                /*
                 * A reprodução automática pode
                 * ser bloqueada pelo navegador.
                 */
            });
        } else {
            preview.style.backgroundImage =
                `linear-gradient(
                    rgba(0, 0, 0, 0.05),
                    rgba(0, 0, 0, 0.5)
                ),
                url("${objectUrl}")`;
        }

        const fileName =
            preview
                .closest(
                    ".admin-media-card"
                )
                ?.querySelector(
                    ".admin-media-information small"
                );

        if (fileName) {
            fileName.textContent =
                media.name;
        }
    }


    async function loadSavedPreviews() {
        for (
            const key of Object.keys(
                MEDIA_TARGETS
            )
        ) {
            try {
                const media =
                    await getMedia(key);

                if (media) {
                    setPreview(
                        key,
                        media
                    );
                }
            } catch (error) {
                console.warn(
                    `Não foi possível carregar ${key}.`,
                    error
                );
            }
        }
    }


    /* =====================================================
       SELEÇÃO DO DESTINO
       ===================================================== */

    function inferCardKey(card) {
        if (!card) {
            return null;
        }

        const explicitKey =
            card.dataset.mediaKey;

        if (
            explicitKey &&
            MEDIA_TARGETS[
                explicitKey
            ]
        ) {
            return explicitKey;
        }

        const title =
            card
                .querySelector(
                    ".admin-media-information strong"
                )
                ?.textContent
                ?.trim()
                ?.toLowerCase() || "";

        if (
            title.includes(
                "vídeo principal"
            )
        ) {
            return "heroVideo";
        }

        if (
            title.includes(
                "experiência"
            )
        ) {
            return "experienceImage";
        }

        if (
            title.includes(
                "detalhes"
            )
        ) {
            return "detailsImage";
        }

        if (
            title.includes(
                "vídeo vertical"
            )
        ) {
            return "verticalVideo";
        }

        if (
            title.includes(
                "poster"
            )
        ) {
            return "verticalPoster";
        }

        if (
            title.includes(
                "quem somos"
            )
        ) {
            return "aboutImage";
        }

        if (
            title.includes(
                "visitar"
            )
        ) {
            return "visitImage";
        }

        return null;
    }


    function setInputAccept(key) {
        const target =
            MEDIA_TARGETS[key];

        if (!mediaInput || !target) {
            return;
        }

        mediaInput.accept =
            target.type === "video"
                ? "video/mp4,video/webm"
                : "image/jpeg,image/png,image/webp";
    }


    /* =====================================================
       CARREGAMENTO DO FICHEIRO
       ===================================================== */

    async function handleFileSelected() {
        const file =
            mediaInput?.files?.[0];

        if (
            !file ||
            !selectedMediaKey
        ) {
            return;
        }

        const target =
            MEDIA_TARGETS[
                selectedMediaKey
            ];

        const validation =
            validateFile(
                file,
                target
            );

        if (!validation.valid) {
            showMediaMessage(
                "Ficheiro inválido",
                validation.message,
                "error"
            );

            mediaInput.value = "";
            return;
        }

        try {
            await saveMedia(
                selectedMediaKey,
                file
            );

            const media =
                await getMedia(
                    selectedMediaKey
                );

            setPreview(
                selectedMediaKey,
                media
            );

            showMediaMessage(
                "Ficheiro guardado",
                `${target.label} foi atualizado neste navegador.`
            );

            /*
             * Notifica outras janelas abertas.
             */

            localStorage.setItem(
                "presepio_media_updated",
                JSON.stringify({
                    key:
                        selectedMediaKey,

                    updatedAt:
                        Date.now()
                })
            );
        } catch (error) {
            console.error(error);

            showMediaMessage(
                "Erro ao guardar",
                "Não foi possível guardar o ficheiro neste navegador.",
                "error"
            );
        } finally {
            mediaInput.value = "";
            selectedMediaKey = null;
        }
    }


    /* =====================================================
       REMOVER UM FICHEIRO LOCAL
       ===================================================== */

    async function removeLocalMedia(
        key
    ) {
        const target =
            MEDIA_TARGETS[key];

        if (!target) {
            return;
        }

        try {
            await deleteMedia(key);

            showMediaMessage(
                "Ficheiro removido",
                `${target.label} voltou a usar o ficheiro original do projeto.`
            );

            window.location.reload();
        } catch (error) {
            console.error(error);

            showMediaMessage(
                "Erro ao remover",
                "Não foi possível remover o ficheiro.",
                "error"
            );
        }
    }


    /* =====================================================
       BOTÕES
       ===================================================== */

    function initializeMediaButtons() {
        mediaCards.forEach((card) => {
            const key =
                inferCardKey(card);

            if (key) {
                card.dataset.mediaKey =
                    key;
            }

            const replaceButton =
                card.querySelector(
                    ".admin-media-information button"
                );

            replaceButton?.addEventListener(
                "click",
                () => {
                    const mediaKey =
                        card.dataset.mediaKey;

                    if (
                        !mediaKey ||
                        !MEDIA_TARGETS[
                            mediaKey
                        ]
                    ) {
                        showMediaMessage(
                            "Destino não configurado",
                            "Adicione um data-media-key ao cartão.",
                            "warning"
                        );

                        return;
                    }

                    selectedMediaKey =
                        mediaKey;

                    setInputAccept(
                        mediaKey
                    );

                    mediaInput?.click();
                }
            );

            /*
             * Clique com o botão direito na imagem
             * permite remover o ficheiro local.
             */

            card.addEventListener(
                "contextmenu",
                (event) => {
                    const mediaKey =
                        card.dataset.mediaKey;

                    if (!mediaKey) {
                        return;
                    }

                    event.preventDefault();

                    const shouldRemove =
                        window.confirm(
                            "Remover a substituição local e voltar ao ficheiro original?"
                        );

                    if (shouldRemove) {
                        removeLocalMedia(
                            mediaKey
                        );
                    }
                }
            );
        });


        uploadButton?.addEventListener(
            "click",
            () => {
                showMediaMessage(
                    "Escolha o conteúdo",
                    "Use o botão Substituir no cartão da imagem ou do vídeo pretendido.",
                    "warning"
                );
            }
        );


        mediaInput?.addEventListener(
            "change",
            handleFileSelected
        );
    }


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    async function initialize() {
        if (!("indexedDB" in window)) {
            showMediaMessage(
                "Armazenamento indisponível",
                "Este navegador não suporta armazenamento local de ficheiros.",
                "error"
            );

            return;
        }

        initializeMediaButtons();

        await loadSavedPreviews();
    }


    if (
        document.readyState === "loading"
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


    window.addEventListener(
        "beforeunload",
        clearObjectUrls
    );
})();