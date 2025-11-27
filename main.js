"use strict";
(() => {


    class pdfViewer {

        async init() {}
        async destroy() {}
    }


    if (window.acode) {
        let i = new pdfViewer();
        acode.setPluginInit(e.id, async (n, o, {
            cacheFileUrl: s, cacheFile: d
        }) => {
            n.endsWith("/") || (n += "/");
            i.baseUrl = n;
            await i.init(o, d, s);
        });
        acode.setPluginUnmount(e.id, () => {
            i.destroy();
        });
    }
})();