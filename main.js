"use strict";
(() => {
    const editorManager = acode.require("editorMnager");
    const sideBarApps = acode.require("sidebarApps");
    const SideButton = acode.require("sideButton");

    var e = {
        id: "pdfViewer",
    };

    class managerFunctions {
        #currentFile() {
            return editorManager.activeFile;
        }
    }

    class eventsHandler {}

    class pdfViewer {
        constructor() {
            this.currentEditorFilePath = null;
            this.currentOpendFileName = null;
        }
        async init() {
            // get the pdfjs later ill include it directly in project
           // <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.js"></script>
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            // acode.registerFileHandler({id: e.id, extensions: ['pdf', 'xlsx', 'docx', 'csv'],
            //     async handleFile( { name, uri, fs, options }) {
            //         this.currentEditorFilePath = uri;
            //         this.currentOpendFileName = name;
            //         // Handler implementation
            //         // open_Document(uri)
            //         console.log('hsndler adder')
            //     }
            // });
            
        }

        async destroy() {}
    }

    if (window.acode) {
        let i = new pdfViewer();
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