"use strict";
(() => {
    const editorManager = acode.require("editorMnager");
    const sideBarApps = acode.require("sidebarApps");
    const SideButton = acode.require("sideButton");
    const EditorFile = acode.require('EditorFile');
    const fs = acode.require('fs')
    var e = {
        id: "pdfViewer",
    }


    class GeneralFunctions {
        constructor() { }
        static CreateNewTab(name, path, container) {
            const tab = new EditorFile(name, {
                type: 'custom',
                content: container,
                uri: path,
                hideQuickTools: false
            });
            return tab
        }

        static createElement(id, elementName, styles = {}) {
            const ele = document.createElement(elementName);
            ele.id = id;
            for (const [key, value] of Object.entries(styles)) {
                ele.style[key] = value;
            }
            return ele;
        }

        static createMainContainer() {
            return GeneralFunctions.createElement('main_container', 'div', { height: '100vh !important', width: '100vw', backgroundColor: 'green', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' })
        }


        /// read the actual file and returns the arrayBuffer
        static async getFileData(path) {
            const fsObj = fs(path)
            const fileData = await fsObj.readFile();
            return fileData
        }

        static async addPDFLibrary() {
            if (!window.pdfjsLib) {
                const library = document.createElement('script');
                library.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/build/pdf.min.js';
                document.head.appendChild(library);
                await new Promise((resolve, reject) => { library.onload = resolve; library.onerror = reject });
                window.pdfjsLib ? pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/build/pdf.worker.min.js" : window.toast('pdfLibraryErr');
            }
            return
        }
    }

    class PDF {
        constructor(name, uri) {
            this.currentEditorFilePath = uri; // as its anem
            this.currentOpendFileName = name; // as its name
            this.tab_container = null; // holds the tabs main div
            this.pdfOBJ = null; // golds the actual pdf obj
            this.tab = null; // holds the entire tab
        }

        handle() {
            console.log(`this is the file name ${this.currentOpendFileName}`)
            console.log(`this is file uri ${this.currentEditorFilePath}`)

            // const tab_data = GeneralFunctions.CreateNewTab(this.currentOpendFileName, this.currentEditorFilePath)
            // const tab = tab_data[0];
            // const tab_container = tab_data[1]
            // this.#prepareTab(tab, tab_container)
            const tab_container = GeneralFunctions.createMainContainer()
            const tab = GeneralFunctions.CreateNewTab(this.currentOpendFileName, this.currentEditorFilePath, tab_container)
            GeneralFunctions.addPDFLibrary();
            this.tab = tab;
            this.#prepareTab();
            this.tab_container = tab_container;
        }

        async #prepareTab() {
            // const pdf_canvas = GeneralFunctions.createCanvas('pdf-canvas');
            // const library = document.createElement('script');
            // library.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/build/pdf.min.js';
            // ///library.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.js";

            // tab_container.append(library, pdf_canvas);

            // // Wait for the external script to load
            // await new Promise((resolve) => { library.onload = () => { resolve() }; library.onerror = () => { console.error("Failed to load PDF.js"); resolve() } }); // deadlock prevention by rejecting

            // // Ensure pdfjsLib is available
            // if (window.pdfjsLib) {
            //     pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/build/pdf.worker.min.js";
            // } else {
            //     console.error("pdfjsLib not found after loading script.");
            //     return;
            // }

            //this.#showPDF(pdf_canvas);
            try {
                await GeneralFunctions.addPDFLibrary()
                setTimeout(() => this.#loadPDF(), 50);
            } catch (err) {
                console.log('error while trying to load pdf js library / worker ', err)
            }
        }

        async #loadPDF() {
            let fileData = await GeneralFunctions.getFileData(this.currentEditorFilePath); // returns arraybuffer
            const loadingTask = pdfjsLib.getDocument(fileData);
            const pdf = await loadingTask.promise;
            this.pdfOBJ = pdf;
            this.#createFakePages(pdf.numPages);

            /// i have to imolemnt the lazy loading hear

            console.log("Type:", typeof fileData);
            console.log("Instance:", fileData.constructor.name);
            console.log("Length:", fileData.length || fileData.byteLength);
            console.log("PDF loaded, pages:", pdf.numPages);
        }

        #createFakePages(count) {
            for (let i = 1; i <= count; i++) {
                let ele = GeneralFunctions.createElement(`pageWrapper-${i}`, 'div', {
                    marginTop: '10px',
                    height: '60vh',
                    width: '85vw',
                    backgroundColor: 'red'
                });
                this.#setObserver().observe(ele); // setted up observeing
                this.tab_container.appendChild(ele)
            }
        }

        #setObserver() {
            const pageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const pageElem = entry.target;
                        console.log(pageElem, typeof pageElem, pageElem.id)
                        this.#loadRealPdfPage(pageElem);
                        observer.unobserve(pageElem); //after loading stiop
                    }
                });
            }, {
                root: null,        // viewport
                rootMargin: '200px',
                threshold: 0.1     // trigger when 10% visible
            });
            return pageObserver
        }


        async #loadRealPdfPage(pageElem) {
            try {
                const pageNo = parseInt(pageElem.id.split('-')[1], 10);
                const pdf_canvas = GeneralFunctions.createElement(`canvas-${pageNo}`, 'canvas');
                pageElem.appendChild(pdf_canvas);

                const page = await this.pdfOBJ.getPage(pageNo);

                // Step 1: get original PDF page size
                const unscaledViewport = page.getViewport({ scale: 1 });

                const containerWidth = pageElem.clientWidth;
                const containerHeight = pageElem.clientHeight;

                // Step 2: compute scale that fits inside the container
                const scale = Math.min(
                    containerWidth / unscaledViewport.width,
                    containerHeight / unscaledViewport.height
                );

                // Step 3: create scaled viewport
                const viewport = page.getViewport({ scale });

                // 🔥 High-quality rendering
                const outputScale = 5 || window.devicePixelRatio;

                // Canvas internal resolution (high DPI)
                pdf_canvas.width = viewport.width * outputScale;
                pdf_canvas.height = viewport.height * outputScale;

                // CSS size (visual size)
                pdf_canvas.style.width = `${viewport.width}px`;
                pdf_canvas.style.height = `${viewport.height}px`;

                const ctx = pdf_canvas.getContext("2d");

                // Apply DPI transform
                const transform = outputScale !== 1
                    ? [outputScale, 0, 0, outputScale, 0, 0]
                    : null;

                // Render PDF page
                await page.render({
                    canvasContext: ctx,
                    viewport,
                    transform
                }).promise;

                console.log(`page ${pageNo} Render complete`);
            } catch (error) {
                console.error("Error loading PDF:", error);
            }
        }

    }





    // handle the ms word files
    class DOCX {
        constructor(name, uri) {
            this.currentEditorFilePath = uri;
            this.currentOpendFileName = name;
        }

        handle() {
            const library = document.createElement('script');
            library.src = '';
        }
    }

    // handle the CSV fils
    class CSV {
        constructor(name, uri) {
            this.currentEditorFilePath = uri;
            this.currentOpendFileName = name;
        }

        handle() {
            const library = document.createElement('script');
            library.src = '';
        }
    }

    // handle the XLSX file
    class XLS {
        constructor(name, uri) {
            this.currentEditorFilePath = uri;
            this.currentOpendFileName = name;
        }

        handle() {
            const library = document.createElement('script');
            library.src = '';
        }
    }

    // handle the Markdown files
    class MD {
        constructor(name, uri) {
            this.currentEditorFilePath = uri;
            this.currentOpendFileName = name;
        }

        handle() {
            const library = document.createElement('script');
            library.src = '';
        }
    }

    class documentsHandler {
        constructor() { }
        async init() {

            // get the pdfjs later ill include it directly in project
            acode.registerFileHandler(e.id, {
                //extensions: ['pdf', 'docx', 'csv', 'xls', 'xlsx', 'md'],
                extensions: ['pdf'],
                async handleFile({ name, uri, fs, options }) {
                    // Handler implementation
                    if (name.toLowerCase().endsWith('pdf')) {
                        const pdf = new PDF(name, uri)
                        pdf.handle()
                    } else if (name.toLowerCase().endsWith('docx')) {
                        const docx = new DOCX(name, uri)
                        docx.handle()
                    } else if (name.toLowerCase().endsWith('csv')) {
                        const csv = new CSV(name, uri)
                        csv.handle()
                    } else if (name.toLowerCase().endsWith('md')) {
                        const md = new MD(name, uri)
                        md.handle()
                    } else if (name.toLowerCase().endsWith('xls') || name.toLowerCase().endsWith('xlsx')) {
                        const xls = new XLS(name, uri)
                        xls.handle()
                    }
                }
            });
        }

        async destroy() { acode.unregisterFileHandler(e.id) }
    }

    if (window.acode) {
        let i = new documentsHandler();
        acode.setPluginInit(
            e.id,
            async (n, o, {
                cacheFileUrl: s, cacheFile: d
            }) => {
                n.endsWith("/") || (n += "/");
                i.baseUrl = n;
                await i.init(o, d, s);
            }
        );
        acode.setPluginUnmount(e.id, () => {
            i.destroy();
        });
    }
})();








// <script>
//   const url = 'myfile.pdf';

//   const loadingTask = pdfjsLib.getDocument(url);
//   loadingTask.promise.then(function(pdf) {
//     console.log('PDF loaded');

//     // Fetch page 1
//     pdf.getPage(1).then(function(page) {
//       console.log('Page loaded');

//       const scale = 1.5;
//       const viewport = page.getViewport({ scale });

//       // Prepare canvas using PDF page dimensions
//       const canvas = document.getElementById('pdf-canvas');
//       const context = canvas.getContext('2d');
//       canvas.height = viewport.height;
//       canvas.width = viewport.width;

//       // Render PDF page into canvas context
//       const renderContext = {
//         canvasContext: context,
//         viewport: viewport
//       };
//       page.render(renderContext);
//     });
//   });
// </script>




// /// loading other pages

// function renderPage(num) {
//   pdf.getPage(num).then(page => {
//     const viewport = page.getViewport({ scale: 1.5 });
//     canvas.height = viewport.height;
//     canvas.width = viewport.width;

//     page.render({
//       canvasContext: context,
//       viewport
//     });
//   });
// }
// window.cordova.plugin.http.sendRequest(
//     "file:///data/user/0/com.foxdebug.acode/files/alpine/home/tt/kamalResume.pdf",
//     {
//         method: "get",
//         responseType: "arraybuffer"
//     },
//     function (response) {
//         try {
//             // response.data is a base64 string when using arraybuffer
//             const binary = atob(response.data);
//             const len = binary.length;
//             const uint8 = new Uint8Array(len);

//             for (let i = 0; i < len; i++) {
//                 uint8[i] = binary.charCodeAt(i);
//             }

//             console.log(uint8);
//         } catch (err) {
//             console.error("Failed to decode arraybuffer:", err);
//         }
//     },
//     function (error) {
//         console.error("Cannot load PDF:", error);
//     }
// );
