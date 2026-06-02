Package["core-runtime"].queue("rspack",function () {/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EmitterPromise = Package.meteor.EmitterPromise;
var ECMAScript = Package.ecmascript.ECMAScript;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rspack":{"rspack_server.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rspack/rspack_server.js                                                                                  //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {let Meteor;module.link('meteor/meteor',{Meteor(v){Meteor=v}},0);let WebApp,WebAppInternals;module.link('meteor/webapp',{WebApp(v){WebApp=v},WebAppInternals(v){WebAppInternals=v}},1);let path;module.link('path',{default(v){path=v}},2);let parseUrl;module.link('url',{parse(v){parseUrl=v}},3);let RSPACK_CHUNKS_CONTEXT,RSPACK_ASSETS_CONTEXT,RSPACK_HOT_UPDATE_REGEX;module.link("./lib/constants",{RSPACK_CHUNKS_CONTEXT(v){RSPACK_CHUNKS_CONTEXT=v},RSPACK_ASSETS_CONTEXT(v){RSPACK_ASSETS_CONTEXT=v},RSPACK_HOT_UPDATE_REGEX(v){RSPACK_HOT_UPDATE_REGEX=v}},4);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
var _global_Package, _global;





// Define constants for both development and production
const rspackChunksContext = process.env.RSPACK_CHUNKS_CONTEXT || RSPACK_CHUNKS_CONTEXT;
const rspackAssetsContext = process.env.RSPACK_ASSETS_CONTEXT || RSPACK_ASSETS_CONTEXT;
/**
 * Regex pattern for rspack bundles
 * @constant {RegExp}
 */ const RSPACK_CHUNKS_REGEX = new RegExp(`^\/${rspackChunksContext}\/(.+)$`);
/**
 * Regex pattern for rspack assets
 * @constant {RegExp}
 */ const RSPACK_ASSETS_REGEX = new RegExp(`^\/${rspackAssetsContext}\/(.+)$`);
const shouldEnableDevHMRProxy = ((_global = global) === null || _global === void 0 ? void 0 : (_global_Package = _global.Package) === null || _global_Package === void 0 ? void 0 : _global_Package["tools-core"]) != null && Meteor.isDevelopment && !Meteor.isTest && !Meteor.isAppTest && !process.env.RSPACK_NATIVE;
if (shouldEnableDevHMRProxy) {
    const { shuffleString } = require('meteor/tools-core/lib/string');
    const { createProxyMiddleware } = require('http-proxy-middleware');
    // Target URL for the Rspack dev server
    const target = `http://localhost:${process.env.RSPACK_DEVSERVER_PORT}`;
    // Proxy HMR websocket upgrade requests
    WebApp.connectHandlers.use('/ws', createProxyMiddleware({
        target,
        ws: true,
        logLevel: 'debug'
    }));
    // Proxy all dev asset requests under the rspack prefix
    WebApp.connectHandlers.use('/__rspack__', createProxyMiddleware({
        target,
        changeOrigin: true,
        ws: true,
        logLevel: 'debug'
    }));
    WebApp.rawConnectHandlers.use((req, res, next)=>{
        // If this request is already under /__rspack__/, don't redirect it again.
        if (req.url.startsWith('/__rspack__/')) {
            return next();
        }
        // 1) match ANY URL whose last segment ends with ".hot-update.js" or ".hot-update.json",
        //    e.g. "/main.ce385971e9f19307.hot-update.js"
        //         "/ui_pages_tasks_tasks-page_jsx.ce385971e9f19307.hot-update.js"
        //         "/foo/bar/baz.1234abcd.hot-update.json"
        const hotUpdate = req.url.match(RSPACK_HOT_UPDATE_REGEX);
        if (hotUpdate) {
            // Redirect "/something.hot-update.js" → "/__rspack__/something.hot-update.js"
            const target = `/__rspack__/${hotUpdate[1]}`;
            res.writeHead(307, {
                Location: target
            });
            return res.end();
        }
        // 2) match "/build-chunks/<anything>"
        const bundlesMatch = req.url.match(RSPACK_CHUNKS_REGEX);
        if (bundlesMatch) {
            // Redirect "/bundles/foo.js" → "/__rspack__/build-chunks/foo.js"
            const target = `/__rspack__/${rspackChunksContext}/${bundlesMatch[1]}`;
            res.writeHead(307, {
                Location: target
            });
            return res.end();
        }
        // 3) match "/build-assets/<anything>"
        const assetsMatch = req.url.match(RSPACK_ASSETS_REGEX);
        if (assetsMatch) {
            // Redirect "/build-assets/foo.js" → "/__rspack__/build-assets/foo.js"
            const target = `/__rspack__/${rspackAssetsContext}/${assetsMatch[1]}`;
            res.writeHead(307, {
                Location: target
            });
            return res.end();
        }
        // Otherwise, let it pass through
        next();
    });
    /**
   * Force client to reload after Rspack server compilation and restart, which doesn’t happen automatically.
   * On each server reload, generate a new client hash once to force Meteor’s client reload.
   * After the first reload, apply Meteor's default behavior.
   */ function enableClientReloadOnServerStart() {
        Meteor.startup(()=>{
            const originalCalc = WebApp.calculateClientHashReplaceable;
            let hasShuffled = false;
            let cachedHash = {};
            let prevRealHash = {};
            WebApp.calculateClientHashReplaceable = function(...args) {
                const arch = args[0];
                const realHash = originalCalc.apply(this, args);
                if (prevRealHash[arch] && realHash !== prevRealHash[arch]) {
                    prevRealHash[arch] = realHash;
                    return realHash;
                }
                prevRealHash[arch] = realHash;
                if (cachedHash[arch] == null) {
                    cachedHash[arch] = shuffleString(realHash);
                    hasShuffled = true;
                }
                return cachedHash[arch];
            };
        });
    }
    // Enable client reload on server startup
    enableClientReloadOnServerStart();
}
/**
 * Register a single rspack static asset with WebAppInternals.staticFilesByArch
 * @param {string} arch - The architecture to register the asset for
 * @param {string} pathname - The pathname of the asset
 * @param {string} filePath - The absolute path to the asset on disk
 * @returns {Object} The static file info object
 */ function registerRspackStaticAsset(arch, pathname, filePath) {
    // Ensure the architecture exists in staticFilesByArch
    if (!WebAppInternals.staticFilesByArch[arch]) {
        WebAppInternals.staticFilesByArch[arch] = Object.create(null);
    }
    // Get the static files object for this architecture
    const staticFiles = WebAppInternals.staticFilesByArch[arch];
    // Skip if already registered
    if (staticFiles[pathname]) {
        // Ensure the entry is marked as cacheable
        staticFiles[pathname].cacheable = true;
        return staticFiles[pathname];
    }
    // Determine file type based on extension
    const type = pathname.endsWith(".js") ? "js" : pathname.endsWith(".css") ? "css" : pathname.endsWith(".json") ? "json" : undefined;
    // Extract hash from filename (assuming it's the second part after splitting by '.')
    const filename = pathname.split("/").pop();
    const hash = filename.split(".")[1];
    // Register the asset
    staticFiles[pathname] = {
        absolutePath: filePath,
        cacheable: true,
        hash,
        type
    };
    return staticFiles[pathname];
}
// Store the original staticFilesMiddleware
const originalStaticFilesMiddleware = WebAppInternals.staticFilesMiddleware;
// Handle rspack assets on-demand to add Meteor's static files headers
WebAppInternals.staticFilesMiddleware = function(staticFilesByArch, req, res, next) {
    return _async_to_generator(function*() {
        const pathname = parseUrl(req.url).pathname;
        try {
            // Check if this is a rspack asset request
            const chunksMatch = pathname.match(RSPACK_CHUNKS_REGEX);
            const assetsMatch = pathname.match(RSPACK_ASSETS_REGEX);
            if (chunksMatch || assetsMatch) {
                const cwd = process.cwd();
                const architectures = [
                    "web.browser",
                    "web.browser.legacy",
                    "web.cordova"
                ];
                WebApp.categorizeRequest(req);
                // Try to find the file on disk
                const context = chunksMatch ? rspackChunksContext : rspackAssetsContext;
                const filename = chunksMatch ? chunksMatch[1] : assetsMatch[1];
                const filePath = path.join(cwd, context, filename);
                architectures.forEach((archName)=>{
                    registerRspackStaticAsset(archName, pathname, filePath);
                });
            }
        } catch (e) {
            console.error(`Error handling rspack asset: ${e.message}`);
        }
        // Call the original middleware
        return originalStaticFilesMiddleware(staticFilesByArch, req, res, next);
    })();
};
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"constants.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rspack/lib/constants.js                                                                                  //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({DEFAULT_RSPACK_VERSION:()=>DEFAULT_RSPACK_VERSION,DEFAULT_METEOR_RSPACK_VERSION:()=>DEFAULT_METEOR_RSPACK_VERSION,DEFAULT_METEOR_RSPACK_REACT_HMR_VERSION:()=>DEFAULT_METEOR_RSPACK_REACT_HMR_VERSION,DEFAULT_METEOR_RSPACK_REACT_REFRESH_VERSION:()=>DEFAULT_METEOR_RSPACK_REACT_REFRESH_VERSION,DEFAULT_METEOR_RSPACK_SWC_LOADER_VERSION:()=>DEFAULT_METEOR_RSPACK_SWC_LOADER_VERSION,DEFAULT_METEOR_RSPACK_SWC_HELPERS_VERSION:()=>DEFAULT_METEOR_RSPACK_SWC_HELPERS_VERSION,DEFAULT_RSDOCTOR_RSPACK_PLUGIN_VERSION:()=>DEFAULT_RSDOCTOR_RSPACK_PLUGIN_VERSION,GLOBAL_STATE_KEYS:()=>GLOBAL_STATE_KEYS,RSPACK_BUILD_CONTEXT:()=>RSPACK_BUILD_CONTEXT,RSPACK_ASSETS_CONTEXT:()=>RSPACK_ASSETS_CONTEXT,RSPACK_CHUNKS_CONTEXT:()=>RSPACK_CHUNKS_CONTEXT,RSPACK_DOCTOR_CONTEXT:()=>RSPACK_DOCTOR_CONTEXT,RSPACK_HOT_UPDATE_REGEX:()=>RSPACK_HOT_UPDATE_REGEX,FILE_ROLE:()=>FILE_ROLE},true);let path;module.link('path',{default(v){path=v}},0);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();var _Plugin;
/**
 * @module constants
 * @description Constants and global state keys for Rspack plugin
 */ 
const DEFAULT_RSPACK_VERSION = '1.7.1';
const DEFAULT_METEOR_RSPACK_VERSION = '2.0.1';
const DEFAULT_METEOR_RSPACK_REACT_HMR_VERSION = '1.4.3';
const DEFAULT_METEOR_RSPACK_REACT_REFRESH_VERSION = '0.17.0';
const DEFAULT_METEOR_RSPACK_SWC_LOADER_VERSION = '0.2.6';
const DEFAULT_METEOR_RSPACK_SWC_HELPERS_VERSION = '0.5.17';
const DEFAULT_RSDOCTOR_RSPACK_PLUGIN_VERSION = '1.5.7';
/**
 * Global state keys used for storing and retrieving state across the application
 * @constant {Object}
 * @property {string} CLIENT_PROCESS - Key for storing the client process
 * @property {string} SERVER_PROCESS - Key for storing the server process
 * @property {string} RSPACK_INSTALLATION_CHECKED - Key for tracking if Rspack installation was checked
 * @property {string} IS_REACT_ENABLED - Key for tracking if React is enabled
 * @property {string} INITIAL_ENTRYPONTS - Key for storing initial entrypoints
 * @property {string} CLIENT_FIRST_COMPILE - Key for tracking client first compilation state
 * @property {string} SERVER_FIRST_COMPILE - Key for tracking server first compilation state
 * @property {string} BUILD_CONTEXT_FILES_CLEANED - Key for tracking if build context files have been cleaned
 */ const GLOBAL_STATE_KEYS = {
    CLIENT_PROCESS: 'rspack.clientProcess',
    SERVER_PROCESS: 'rspack.serverProcess',
    RSPACK_INSTALLATION_CHECKED: 'rspack.rspackInstallationChecked',
    RSPACK_REACT_INSTALLATION_CHECKED: 'rspack.rspackReactInstallationChecked',
    RSPACK_DOCTOR_INSTALLATION_CHECKED: 'rspack.rspackDoctorInstallationChecked',
    REACT_CHECKED: 'rspack.reactChecked',
    TYPESCRIPT_CHECKED: 'rspack.typescriptChecked',
    ANGULAR_CHECKED: 'rspack.angularChecked',
    INITIAL_ENTRYPONTS: 'meteor.initialEntrypoints',
    CLIENT_FIRST_COMPILE: 'rspack.clientFirstCompile',
    SERVER_FIRST_COMPILE: 'rspack.serverFirstCompile',
    BUILD_CONTEXT_FILES_CLEANED: 'rspack.buildContextFilesCleaned'
};
const meteorConfig = typeof Plugin !== 'undefined' ? (_Plugin = Plugin) === null || _Plugin === void 0 ? void 0 : _Plugin.getMeteorConfig() : null;
const meteorLocalDirName = process.env.METEOR_LOCAL_DIR ? path.basename(process.env.METEOR_LOCAL_DIR.replace(/\\/g, '/')) : '';
/**
 * Directory name for Rspack build context
 * Can be overridden with RSPACK_BUILD_CONTEXT environment variable
 * @constant {string}
 */ const RSPACK_BUILD_CONTEXT = (meteorConfig === null || meteorConfig === void 0 ? void 0 : meteorConfig.buildContext) || process.env.RSPACK_BUILD_CONTEXT || `_build${meteorLocalDirName && `-${meteorLocalDirName}` || ''}`;
process.env.RSPACK_BUILD_CONTEXT = RSPACK_BUILD_CONTEXT;
/**
 * Directory name for Rspack assets context
 * Can be overridden with RSPACK_ASSETS_CONTEXT environment variable
 * @constant {string}
 */ const RSPACK_ASSETS_CONTEXT = (meteorConfig === null || meteorConfig === void 0 ? void 0 : meteorConfig.assetsContext) || process.env.RSPACK_ASSETS_CONTEXT || `build-assets${meteorLocalDirName && `-${meteorLocalDirName}` || ''}`;
process.env.RSPACK_ASSETS_CONTEXT = RSPACK_ASSETS_CONTEXT;
/**
 * Directory name for Rspack bundles context
 * Can be overridden with RSPACK_ASSETS_CONTEXT environment variable
 * @constant {string}
 */ const RSPACK_CHUNKS_CONTEXT = (meteorConfig === null || meteorConfig === void 0 ? void 0 : meteorConfig.chunksContext) || process.env.RSPACK_CHUNKS_CONTEXT || `build-chunks${meteorLocalDirName && `-${meteorLocalDirName}` || ''}`;
process.env.RSPACK_CHUNKS_CONTEXT = RSPACK_CHUNKS_CONTEXT;
/**
 * Directory name for Rspack doctor context
 * @type {string}
 */ const RSPACK_DOCTOR_CONTEXT = '.rsdoctor';
/**
 * Regex pattern for hot update files
 * @constant {RegExp}
 */ const RSPACK_HOT_UPDATE_REGEX = /^\/(.+\.hot-update\.(?:json|js))$/;
const FILE_ROLE = {
    build: 'build',
    entry: 'entry',
    run: 'run',
    output: 'output'
};
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"http-proxy-middleware":{"package.json":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/rspack/node_modules/http-proxy-middleware/package.json                                        //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.exports = {
  "name": "http-proxy-middleware",
  "version": "3.0.5",
  "main": "dist/index.js"
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"index.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/rspack/node_modules/http-proxy-middleware/dist/index.js                                       //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.useNode();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});


/* Exports */
return {
  require: require,
  eagerModulePaths: [
    "/node_modules/meteor/rspack/rspack_server.js"
  ],
  mainModulePath: "/node_modules/meteor/rspack/rspack_server.js"
}});

//# sourceURL=meteor://💻app/packages/rspack.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcnNwYWNrL3JzcGFja19zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JzcGFjay9saWIvY29uc3RhbnRzLmpzIl0sIm5hbWVzIjpbImdsb2JhbCIsInJzcGFja0NodW5rc0NvbnRleHQiLCJwcm9jZXNzIiwiZW52IiwiUlNQQUNLX0NIVU5LU19DT05URVhUIiwicnNwYWNrQXNzZXRzQ29udGV4dCIsIlJTUEFDS19BU1NFVFNfQ09OVEVYVCIsIlJTUEFDS19DSFVOS1NfUkVHRVgiLCJSZWdFeHAiLCJSU1BBQ0tfQVNTRVRTX1JFR0VYIiwic2hvdWxkRW5hYmxlRGV2SE1SUHJveHkiLCJQYWNrYWdlIiwiTWV0ZW9yIiwiaXNEZXZlbG9wbWVudCIsImlzVGVzdCIsImlzQXBwVGVzdCIsIlJTUEFDS19OQVRJVkUiLCJzaHVmZmxlU3RyaW5nIiwicmVxdWlyZSIsImNyZWF0ZVByb3h5TWlkZGxld2FyZSIsInRhcmdldCIsIlJTUEFDS19ERVZTRVJWRVJfUE9SVCIsIldlYkFwcCIsImNvbm5lY3RIYW5kbGVycyIsInVzZSIsIndzIiwibG9nTGV2ZWwiLCJjaGFuZ2VPcmlnaW4iLCJyYXdDb25uZWN0SGFuZGxlcnMiLCJyZXEiLCJyZXMiLCJuZXh0IiwidXJsIiwic3RhcnRzV2l0aCIsImhvdFVwZGF0ZSIsIm1hdGNoIiwiUlNQQUNLX0hPVF9VUERBVEVfUkVHRVgiLCJ3cml0ZUhlYWQiLCJMb2NhdGlvbiIsImVuZCIsImJ1bmRsZXNNYXRjaCIsImFzc2V0c01hdGNoIiwiZW5hYmxlQ2xpZW50UmVsb2FkT25TZXJ2ZXJTdGFydCIsInN0YXJ0dXAiLCJvcmlnaW5hbENhbGMiLCJjYWxjdWxhdGVDbGllbnRIYXNoUmVwbGFjZWFibGUiLCJoYXNTaHVmZmxlZCIsImNhY2hlZEhhc2giLCJwcmV2UmVhbEhhc2giLCJhcmdzIiwiYXJjaCIsInJlYWxIYXNoIiwiYXBwbHkiLCJyZWdpc3RlclJzcGFja1N0YXRpY0Fzc2V0IiwicGF0aG5hbWUiLCJmaWxlUGF0aCIsIldlYkFwcEludGVybmFscyIsInN0YXRpY0ZpbGVzQnlBcmNoIiwiT2JqZWN0IiwiY3JlYXRlIiwic3RhdGljRmlsZXMiLCJjYWNoZWFibGUiLCJ0eXBlIiwiZW5kc1dpdGgiLCJ1bmRlZmluZWQiLCJmaWxlbmFtZSIsInNwbGl0IiwicG9wIiwiaGFzaCIsImFic29sdXRlUGF0aCIsIm9yaWdpbmFsU3RhdGljRmlsZXNNaWRkbGV3YXJlIiwic3RhdGljRmlsZXNNaWRkbGV3YXJlIiwicGFyc2VVcmwiLCJjaHVua3NNYXRjaCIsImN3ZCIsImFyY2hpdGVjdHVyZXMiLCJjYXRlZ29yaXplUmVxdWVzdCIsImNvbnRleHQiLCJwYXRoIiwiam9pbiIsImZvckVhY2giLCJhcmNoTmFtZSIsImUiLCJjb25zb2xlIiwiZXJyb3IiLCJtZXNzYWdlIiwiUGx1Z2luIiwiREVGQVVMVF9SU1BBQ0tfVkVSU0lPTiIsIkRFRkFVTFRfTUVURU9SX1JTUEFDS19WRVJTSU9OIiwiREVGQVVMVF9NRVRFT1JfUlNQQUNLX1JFQUNUX0hNUl9WRVJTSU9OIiwiREVGQVVMVF9NRVRFT1JfUlNQQUNLX1JFQUNUX1JFRlJFU0hfVkVSU0lPTiIsIkRFRkFVTFRfTUVURU9SX1JTUEFDS19TV0NfTE9BREVSX1ZFUlNJT04iLCJERUZBVUxUX01FVEVPUl9SU1BBQ0tfU1dDX0hFTFBFUlNfVkVSU0lPTiIsIkRFRkFVTFRfUlNET0NUT1JfUlNQQUNLX1BMVUdJTl9WRVJTSU9OIiwiR0xPQkFMX1NUQVRFX0tFWVMiLCJDTElFTlRfUFJPQ0VTUyIsIlNFUlZFUl9QUk9DRVNTIiwiUlNQQUNLX0lOU1RBTExBVElPTl9DSEVDS0VEIiwiUlNQQUNLX1JFQUNUX0lOU1RBTExBVElPTl9DSEVDS0VEIiwiUlNQQUNLX0RPQ1RPUl9JTlNUQUxMQVRJT05fQ0hFQ0tFRCIsIlJFQUNUX0NIRUNLRUQiLCJUWVBFU0NSSVBUX0NIRUNLRUQiLCJBTkdVTEFSX0NIRUNLRUQiLCJJTklUSUFMX0VOVFJZUE9OVFMiLCJDTElFTlRfRklSU1RfQ09NUElMRSIsIlNFUlZFUl9GSVJTVF9DT01QSUxFIiwiQlVJTERfQ09OVEVYVF9GSUxFU19DTEVBTkVEIiwibWV0ZW9yQ29uZmlnIiwiZ2V0TWV0ZW9yQ29uZmlnIiwibWV0ZW9yTG9jYWxEaXJOYW1lIiwiTUVURU9SX0xPQ0FMX0RJUiIsImJhc2VuYW1lIiwicmVwbGFjZSIsIlJTUEFDS19CVUlMRF9DT05URVhUIiwiYnVpbGRDb250ZXh0IiwiYXNzZXRzQ29udGV4dCIsImNodW5rc0NvbnRleHQiLCJSU1BBQ0tfRE9DVE9SX0NPTlRFWFQiLCJGSUxFX1JPTEUiLCJidWlsZCIsImVudHJ5IiwicnVuIiwib3V0cHV0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBK0JFQTtBQS9CcUM7QUFDaUI7QUFDaEM7QUFDZ0I7QUFLZjtBQUV6Qix1REFBdUQ7QUFDdkQsTUFBTUMsc0JBQXNCQyxRQUFRQyxHQUFHLENBQUNDLHFCQUFxQixJQUFJQTtBQUNqRSxNQUFNQyxzQkFBc0JILFFBQVFDLEdBQUcsQ0FBQ0cscUJBQXFCLElBQUlBO0FBRWpFOzs7Q0FHQyxHQUNELE1BQU1DLHNCQUFzQixJQUFJQyxPQUM5QixDQUFDLEdBQUcsRUFBRVAsb0JBQW9CLE9BQU8sQ0FBQztBQUdwQzs7O0NBR0MsR0FDRCxNQUFNUSxzQkFBc0IsSUFBSUQsT0FDOUIsQ0FBQyxHQUFHLEVBQUVILG9CQUFvQixPQUFPLENBQUM7QUFHcEMsTUFBTUssMEJBQ0pWLHlGQUFRVyxPQUFPLGNBQWZYLHFEQUFpQixDQUFDLGFBQWEsS0FBSSxRQUNuQ1ksT0FBT0MsYUFBYSxJQUNwQixDQUFDRCxPQUFPRSxNQUFNLElBQUksQ0FBQ0YsT0FBT0csU0FBUyxJQUNuQyxDQUFDYixRQUFRQyxHQUFHLENBQUNhLGFBQWE7QUFDNUIsSUFBSU4seUJBQXlCO0lBQzNCLE1BQU0sRUFBRU8sYUFBYSxFQUFFLEdBQUdDLFFBQVE7SUFDbEMsTUFB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TyxNQUFNakYsMEJBQTBCLDZCQUFvQztBQUUzRSxPQUFPLE1BQU1rRixNQUFZO0lBQ3ZCQyxPQUFPO0lBQ1BDLE9BQU87SUFDUEMsS0FBSztJQUNMQyxRQUFRO0FBQ1YsRUFBRSIsImZpbGUiOiIvcGFja2FnZXMvcnNwYWNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBXZWJBcHAsIFdlYkFwcEludGVybmFscyB9IGZyb20gJ21ldGVvci93ZWJhcHAnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBwYXJzZSBhcyBwYXJzZVVybCB9IGZyb20gJ3VybCc7XG5pbXBvcnQge1xuICBSU1BBQ0tfQ0hVTktTX0NPTlRFWFQsXG4gIFJTUEFDS19BU1NFVFNfQ09OVEVYVCxcbiAgUlNQQUNLX0hPVF9VUERBVEVfUkVHRVgsXG59IGZyb20gXCIuL2xpYi9jb25zdGFudHNcIjtcblxuLy8gRGVmaW5lIGNvbnN0YW50cyBmb3IgYm90aCBkZXZlbG9wbWVudCBhbmQgcHJvZHVjdGlvblxuY29uc3QgcnNwYWNrQ2h1bmtzQ29udGV4dCA9IHByb2Nlc3MuZW52LlJTUEFDS19DSFVOS1NfQ09OVEVYVCB8fCBSU1BBQ0tfQ0hVTktTX0NPTlRFWFQ7XG5jb25zdCByc3BhY2tBc3NldHNDb250ZXh0ID0gcHJvY2Vzcy5lbnYuUlNQQUNLX0FTU0VUU19DT05URVhUIHx8IFJTUEFDS19BU1NFVFNfQ09OVEVYVDtcblxuLyoqXG4gKiBSZWdleCBwYXR0ZXJuIGZvciByc3BhY2sgYnVuZGxlc1xuICogQGNvbnN0YW50IHtSZWdFeHB9XG4gKi9cbmNvbnN0IFJTUEFDS19DSFVOS1NfUkVHRVggPSBuZXcgUmVnRXhwKFxuICBgXlxcLyR7cnNwYWNrQ2h1bmtzQ29udGV4dH1cXC8oLispJGAsXG4pO1xuXG4vKipcbiAqIFJlZ2V4IHBhdHRlcm4gZm9yIHJzcGFjayBhc3NldHNcbiAqIEBjb25zdGFudCB7UmVnRXhwfVxuICovXG5jb25zdCBSU1BBQ0tfQVNTRVRTX1JFR0VYID0gbmV3IFJlZ0V4cChcbiAgYF5cXC8ke3JzcGFja0Fzc2V0c0NvbnRleHR9XFwvKC4rKSRgLFxuKTtcblxuY29uc3Qgc2hvdWxkRW5hYmxlRGV2SE1SUHJveHkgPVxuICBnbG9iYWw/LlBhY2thZ2U/LltcInRvb2xzLWNvcmVcIl0gIT0gbnVsbCAmJlxuICBNZXRlb3IuaXNEZXZlbG9wbWVudCAmJlxuICAhTWV0ZW9yLmlzVGVzdCAmJiAhTWV0ZW9yLmlzQXBwVGVzdCAmJlxuICAhcHJvY2Vzcy5lbnYuUlNQQUNLX05BVElWRTtcbmlmIChzaG91bGRFbmFibGVEZXZITVJQcm94eSkge1xuICBjb25zdCB7IHNodWZmbGVTdHJpbmcgfSA9IHJlcXVpcmUoJ21ldGVvci90b29scy1jb3JlL2xpYi9zdHJpbmcnKTtcbiAgY29uc3QgeyBjcmVhdGVQcm94eU1pZGRsZXdhcmUgfSA9IHJlcXVpcmUoJ2h0dHAtcHJveHktbWlkZGxld2FyZScpO1xuXG4gIC8vIFRhcmdldCBVUkwgZm9yIHRoZSBSc3BhY2sgZGV2IHNlcnZlclxuICBjb25zdCB0YXJnZXQgPSBgaHR0cDovL2xvY2FsaG9zdDoke3Byb2Nlc3MuZW52LlJTUEFDS19ERVZTRVJWRVJfUE9SVH1gO1xuXG4gIC8vIFByb3h5IEhNUiB3ZWJzb2NrZXQgdXBncmFkZSByZXF1ZXN0c1xuICBXZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgnL3dzJyxcbiAgICBjcmVhdGVQcm94eU1pZGRsZXdhcmUoIHtcbiAgICAgIHRhcmdldCxcbiAgICAgIHdzOiB0cnVlLFxuICAgICAgbG9nTGV2ZWw6ICdkZWJ1ZydcbiAgICB9KVxuICApO1xuXG4gIC8vIFByb3h5IGFsbCBkZXYgYXNzZXQgcmVxdWVzdHMgdW5kZXIgdGhlIHJzcGFjayBwcmVmaXhcbiAgV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoJy9fX3JzcGFja19fJyxcbiAgICBjcmVhdGVQcm94eU1pZGRsZXdhcmUoe1xuICAgICAgdGFyZ2V0LFxuICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgd3M6IHRydWUsXG4gICAgICBsb2dMZXZlbDogJ2RlYnVnJyxcbiAgICB9KVxuICApO1xuXG4gIFdlYkFwcC5yYXdDb25uZWN0SGFuZGxlcnMudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgIC8vIElmIHRoaXMgcmVxdWVzdCBpcyBhbHJlYWR5IHVuZGVyIC9fX3JzcGFja19fLywgZG9uJ3QgcmVkaXJlY3QgaXQgYWdhaW4uXG4gICAgaWYgKHJlcS51cmwuc3RhcnRzV2l0aCgnL19fcnNwYWNrX18vJykpIHtcbiAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgfVxuXG4gICAgLy8gMSkgbWF0Y2ggQU5ZIFVSTCB3aG9zZSBsYXN0IHNlZ21lbnQgZW5kcyB3aXRoIFwiLmhvdC11cGRhdGUuanNcIiBvciBcIi5ob3QtdXBkYXRlLmpzb25cIixcbiAgICAvLyAgICBlLmcuIFwiL21haW4uY2UzODU5NzFlOWYxOTMwNy5ob3QtdXBkYXRlLmpzXCJcbiAgICAvLyAgICAgICAgIFwiL3VpX3BhZ2VzX3Rhc2tzX3Rhc2tzLXBhZ2VfanN4LmNlMzg1OTcxZTlmMTkzMDcuaG90LXVwZGF0ZS5qc1wiXG4gICAgLy8gICAgICAgICBcIi9mb28vYmFyL2Jhei4xMjM0YWJjZC5ob3QtdXBkYXRlLmpzb25cIlxuICAgIGNvbnN0IGhvdFVwZGF0ZSA9IHJlcS51cmwubWF0Y2goUlNQQUNLX0hPVF9VUERBVEVfUkVHRVgpO1xuICAgIGlmIChob3RVcGRhdGUpIHtcbiAgICAgIC8vIFJlZGlyZWN0IFwiL3NvbWV0aGluZy5ob3QtdXBkYXRlLmpzXCIg4oaSIFwiL19fcnNwYWNrX18vc29tZXRoaW5nLmhvdC11cGRhdGUuanNcIlxuICAgICAgY29uc3QgdGFyZ2V0ID0gYC9fX3JzcGFja19fLyR7aG90VXBkYXRlWzFdfWA7XG4gICAgICByZXMud3JpdGVIZWFkKDMwNywgeyBMb2NhdGlvbjogdGFyZ2V0IH0pO1xuICAgICAgcmV0dXJuIHJlcy5lbmQoKTtcbiAgICB9XG5cbiAgICAvLyAyKSBtYXRjaCBcIi9idWlsZC1jaHVua3MvPGFueXRoaW5nPlwiXG4gICAgY29uc3QgYnVuZGxlc01hdGNoID0gcmVxLnVybC5tYXRjaChSU1BBQ0tfQ0hVTktTX1JFR0VYKTtcbiAgICBpZiAoYnVuZGxlc01hdGNoKSB7XG4gICAgICAvLyBSZWRpcmVjdCBcIi9idW5kbGVzL2Zvby5qc1wiIOKGkiBcIi9fX3JzcGFja19fL2J1aWxkLWNodW5rcy9mb28uanNcIlxuICAgICAgY29uc3QgdGFyZ2V0ID0gYC9fX3JzcGFja19fLyR7cnNwYWNrQ2h1bmtzQ29udGV4dH0vJHtidW5kbGVzTWF0Y2hbMV19YDtcbiAgICAgIHJlcy53cml0ZUhlYWQoMzA3LCB7IExvY2F0aW9uOiB0YXJnZXQgfSk7XG4gICAgICByZXR1cm4gcmVzLmVuZCgpO1xuICAgIH1cblxuICAgIC8vIDMpIG1hdGNoIFwiL2J1aWxkLWFzc2V0cy88YW55dGhpbmc+XCJcbiAgICBjb25zdCBhc3NldHNNYXRjaCA9IHJlcS51cmwubWF0Y2goUlNQQUNLX0FTU0VUU19SRUdFWCk7XG4gICAgaWYgKGFzc2V0c01hdGNoKSB7XG4gICAgICAvLyBSZWRpcmVjdCBcIi9idWlsZC1hc3NldHMvZm9vLmpzXCIg4oaSIFwiL19fcnNwYWNrX18vYnVpbGQtYXNzZXRzL2Zvby5qc1wiXG4gICAgICBjb25zdCB0YXJnZXQgPSBgL19fcnNwYWNrX18vJHtyc3BhY2tBc3NldHNDb250ZXh0fS8ke2Fzc2V0c01hdGNoWzFdfWA7XG4gICAgICByZXMud3JpdGVIZWFkKDMwNywgeyBMb2NhdGlvbjogdGFyZ2V0IH0pO1xuICAgICAgcmV0dXJuIHJlcy5lbmQoKTtcbiAgICB9XG5cbiAgICAvLyBPdGhlcndpc2UsIGxldCBpdCBwYXNzIHRocm91Z2hcbiAgICBuZXh0KCk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBGb3JjZSBjbGllbnQgdG8gcmVsb2FkIGFmdGVyIFJzcGFjayBzZXJ2ZXIgY29tcGlsYXRpb24gYW5kIHJlc3RhcnQsIHdoaWNoIGRvZXNu4oCZdCBoYXBwZW4gYXV0b21hdGljYWxseS5cbiAgICogT24gZWFjaCBzZXJ2ZXIgcmVsb2FkLCBnZW5lcmF0ZSBhIG5ldyBjbGllbnQgaGFzaCBvbmNlIHRvIGZvcmNlIE1ldGVvcuKAmXMgY2xpZW50IHJlbG9hZC5cbiAgICogQWZ0ZXIgdGhlIGZpcnN0IHJlbG9hZCwgYXBwbHkgTWV0ZW9yJ3MgZGVmYXVsdCBiZWhhdmlvci5cbiAgICovXG4gIGZ1bmN0aW9uIGVuYWJsZUNsaWVudFJlbG9hZE9uU2VydmVyU3RhcnQoKSB7XG4gICAgTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAgICAgY29uc3Qgb3JpZ2luYWxDYWxjID0gV2ViQXBwLmNhbGN1bGF0ZUNsaWVudEhhc2hSZXBsYWNlYWJsZTtcbiAgICAgIGxldCBoYXNTaHVmZmxlZCA9IGZhbHNlO1xuICAgICAgbGV0IGNhY2hlZEhhc2ggPSB7fTtcbiAgICAgIGxldCBwcmV2UmVhbEhhc2ggPSB7fTtcbiAgICAgIFdlYkFwcC5jYWxjdWxhdGVDbGllbnRIYXNoUmVwbGFjZWFibGUgPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBjb25zdCBhcmNoID0gYXJnc1swXTtcbiAgICAgICAgY29uc3QgcmVhbEhhc2ggPSBvcmlnaW5hbENhbGMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIGlmIChwcmV2UmVhbEhhc2hbYXJjaF0gJiYgcmVhbEhhc2ggIT09IHByZXZSZWFsSGFzaFthcmNoXSkge1xuICAgICAgICAgIHByZXZSZWFsSGFzaFthcmNoXSA9IHJlYWxIYXNoO1xuICAgICAgICAgIHJldHVybiByZWFsSGFzaDtcbiAgICAgICAgfVxuICAgICAgICBwcmV2UmVhbEhhc2hbYXJjaF0gPSByZWFsSGFzaDtcbiAgICAgICAgaWYgKGNhY2hlZEhhc2hbYXJjaF0gPT0gbnVsbCkge1xuICAgICAgICAgIGNhY2hlZEhhc2hbYXJjaF0gPSBzaHVmZmxlU3RyaW5nKHJlYWxIYXNoKTtcbiAgICAgICAgICBoYXNTaHVmZmxlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhY2hlZEhhc2hbYXJjaF07XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgLy8gRW5hYmxlIGNsaWVudCByZWxvYWQgb24gc2VydmVyIHN0YXJ0dXBcbiAgZW5hYmxlQ2xpZW50UmVsb2FkT25TZXJ2ZXJTdGFydCgpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgc2luZ2xlIHJzcGFjayBzdGF0aWMgYXNzZXQgd2l0aCBXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNCeUFyY2hcbiAqIEBwYXJhbSB7c3RyaW5nfSBhcmNoIC0gVGhlIGFyY2hpdGVjdHVyZSB0byByZWdpc3RlciB0aGUgYXNzZXQgZm9yXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aG5hbWUgLSBUaGUgcGF0aG5hbWUgb2YgdGhlIGFzc2V0XG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZVBhdGggLSBUaGUgYWJzb2x1dGUgcGF0aCB0byB0aGUgYXNzZXQgb24gZGlza1xuICogQHJldHVybnMge09iamVjdH0gVGhlIHN0YXRpYyBmaWxlIGluZm8gb2JqZWN0XG4gKi9cbmZ1bmN0aW9uIHJlZ2lzdGVyUnNwYWNrU3RhdGljQXNzZXQoYXJjaCwgcGF0aG5hbWUsIGZpbGVQYXRoKSB7XG4gIC8vIEVuc3VyZSB0aGUgYXJjaGl0ZWN0dXJlIGV4aXN0cyBpbiBzdGF0aWNGaWxlc0J5QXJjaFxuICBpZiAoIVdlYkFwcEludGVybmFscy5zdGF0aWNGaWxlc0J5QXJjaFthcmNoXSkge1xuICAgIFdlYkFwcEludGVybmFscy5zdGF0aWNGaWxlc0J5QXJjaFthcmNoXSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIH1cblxuICAvLyBHZXQgdGhlIHN0YXRpYyBmaWxlcyBvYmplY3QgZm9yIHRoaXMgYXJjaGl0ZWN0dXJlXG4gIGNvbnN0IHN0YXRpY0ZpbGVzID0gV2ViQXBwSW50ZXJuYWxzLnN0YXRpY0ZpbGVzQnlBcmNoW2FyY2hdO1xuXG4gIC8vIFNraXAgaWYgYWxyZWFkeSByZWdpc3RlcmVkXG4gIGlmIChzdGF0aWNGaWxlc1twYXRobmFtZV0pIHtcbiAgICAvLyBFbnN1cmUgdGhlIGVudHJ5IGlzIG1hcmtlZCBhcyBjYWNoZWFibGVcbiAgICBzdGF0aWNGaWxlc1twYXRobmFtZV0uY2FjaGVhYmxlID0gdHJ1ZTtcbiAgICByZXR1cm4gc3RhdGljRmlsZXNbcGF0aG5hbWVdO1xuICB9XG5cbiAgLy8gRGV0ZXJtaW5lIGZpbGUgdHlwZSBiYXNlZCBvbiBleHRlbnNpb25cbiAgY29uc3QgdHlwZSA9IHBhdGhuYW1lLmVuZHNXaXRoKFwiLmpzXCIpID8gXCJqc1wiIDpcbiAgICBwYXRobmFtZS5lbmRzV2l0aChcIi5jc3NcIikgPyBcImNzc1wiIDpcbiAgICAgIHBhdGhuYW1lLmVuZHNXaXRoKFwiLmpzb25cIikgPyBcImpzb25cIiA6IHVuZGVmaW5lZDtcblxuICAvLyBFeHRyYWN0IGhhc2ggZnJvbSBmaWxlbmFtZSAoYXNzdW1pbmcgaXQncyB0aGUgc2Vjb25kIHBhcnQgYWZ0ZXIgc3BsaXR0aW5nIGJ5ICcuJylcbiAgY29uc3QgZmlsZW5hbWUgPSBwYXRobmFtZS5zcGxpdChcIi9cIikucG9wKCk7XG4gIGNvbnN0IGhhc2ggPSBmaWxlbmFtZS5zcGxpdChcIi5cIilbMV07XG5cbiAgLy8gUmVnaXN0ZXIgdGhlIGFzc2V0XG4gIHN0YXRpY0ZpbGVzW3BhdGhuYW1lXSA9IHtcbiAgICBhYnNvbHV0ZVBhdGg6IGZpbGVQYXRoLFxuICAgIGNhY2hlYWJsZTogdHJ1ZSwgLy8gTW9zdCByc3BhY2sgYXNzZXRzIGFyZSBjYWNoZWFibGVcbiAgICBoYXNoLFxuICAgIHR5cGVcbiAgfTtcblxuICByZXR1cm4gc3RhdGljRmlsZXNbcGF0aG5hbWVdO1xufVxuXG4vLyBTdG9yZSB0aGUgb3JpZ2luYWwgc3RhdGljRmlsZXNNaWRkbGV3YXJlXG5jb25zdCBvcmlnaW5hbFN0YXRpY0ZpbGVzTWlkZGxld2FyZSA9IFdlYkFwcEludGVybmFscy5zdGF0aWNGaWxlc01pZGRsZXdhcmU7XG5cbi8vIEhhbmRsZSByc3BhY2sgYXNzZXRzIG9uLWRlbWFuZCB0byBhZGQgTWV0ZW9yJ3Mgc3RhdGljIGZpbGVzIGhlYWRlcnNcbldlYkFwcEludGVybmFscy5zdGF0aWNGaWxlc01pZGRsZXdhcmUgPSBhc3luYyBmdW5jdGlvbihzdGF0aWNGaWxlc0J5QXJjaCwgcmVxLCByZXMsIG5leHQpIHtcbiAgY29uc3QgcGF0aG5hbWUgPSBwYXJzZVVybChyZXEudXJsKS5wYXRobmFtZTtcblxuICB0cnkge1xuICAgIC8vIENoZWNrIGlmIHRoaXMgaXMgYSByc3BhY2sgYXNzZXQgcmVxdWVzdFxuICAgIGNvbnN0IGNodW5rc01hdGNoID0gcGF0aG5hbWUubWF0Y2goUlNQQUNLX0NIVU5LU19SRUdFWCk7XG4gICAgY29uc3QgYXNzZXRzTWF0Y2ggPSBwYXRobmFtZS5tYXRjaChSU1BBQ0tfQVNTRVRTX1JFR0VYKTtcblxuICAgIGlmIChjaHVua3NNYXRjaCB8fCBhc3NldHNNYXRjaCkge1xuICAgICAgY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKTtcbiAgICAgIGNvbnN0IGFyY2hpdGVjdHVyZXMgPSBbXCJ3ZWIuYnJvd3NlclwiLCBcIndlYi5icm93c2VyLmxlZ2FjeVwiLCBcIndlYi5jb3Jkb3ZhXCJdO1xuICAgICAgV2ViQXBwLmNhdGVnb3JpemVSZXF1ZXN0KHJlcSk7XG5cbiAgICAgIC8vIFRyeSB0byBmaW5kIHRoZSBmaWxlIG9uIGRpc2tcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBjaHVua3NNYXRjaCA/IHJzcGFja0NodW5rc0NvbnRleHQgOiByc3BhY2tBc3NldHNDb250ZXh0O1xuICAgICAgY29uc3QgZmlsZW5hbWUgPSAoY2h1bmtzTWF0Y2ggPyBjaHVua3NNYXRjaFsxXSA6IGFzc2V0c01hdGNoWzFdKTtcbiAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGN3ZCwgY29udGV4dCwgZmlsZW5hbWUpO1xuXG4gICAgICBhcmNoaXRlY3R1cmVzLmZvckVhY2goYXJjaE5hbWUgPT4ge1xuICAgICAgICByZWdpc3RlclJzcGFja1N0YXRpY0Fzc2V0KGFyY2hOYW1lLCBwYXRobmFtZSwgZmlsZVBhdGgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgaGFuZGxpbmcgcnNwYWNrIGFzc2V0OiAke2UubWVzc2FnZX1gKTtcbiAgfVxuXG4gIC8vIENhbGwgdGhlIG9yaWdpbmFsIG1pZGRsZXdhcmVcbiAgcmV0dXJuIG9yaWdpbmFsU3RhdGljRmlsZXNNaWRkbGV3YXJlKHN0YXRpY0ZpbGVzQnlBcmNoLCByZXEsIHJlcywgbmV4dCk7XG59O1xuIiwiLyoqXG4gKiBAbW9kdWxlIGNvbnN0YW50c1xuICogQGRlc2NyaXB0aW9uIENvbnN0YW50cyBhbmQgZ2xvYmFsIHN0YXRlIGtleXMgZm9yIFJzcGFjayBwbHVnaW5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfUlNQQUNLX1ZFUlNJT04gPSAnMS43LjEnO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9NRVRFT1JfUlNQQUNLX1ZFUlNJT04gPSAnMi4wLjEnO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9NRVRFT1JfUlNQQUNLX1JFQUNUX0hNUl9WRVJTSU9OID0gJzEuNC4zJztcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfTUVURU9SX1JTUEFDS19SRUFDVF9SRUZSRVNIX1ZFUlNJT04gPSAnMC4xNy4wJztcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfTUVURU9SX1JTUEFDS19TV0NfTE9BREVSX1ZFUlNJT04gPSAnMC4yLjYnO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9NRVRFT1JfUlNQQUNLX1NXQ19IRUxQRVJTX1ZFUlNJT04gPSAnMC41LjE3JztcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfUlNET0NUT1JfUlNQQUNLX1BMVUdJTl9WRVJTSU9OID0gJzEuNS43JztcblxuLyoqXG4gKiBHbG9iYWwgc3RhdGUga2V5cyB1c2VkIGZvciBzdG9yaW5nIGFuZCByZXRyaWV2aW5nIHN0YXRlIGFjcm9zcyB0aGUgYXBwbGljYXRpb25cbiAqIEBjb25zdGFudCB7T2JqZWN0fVxuICogQHByb3BlcnR5IHtzdHJpbmd9IENMSUVOVF9QUk9DRVNTIC0gS2V5IGZvciBzdG9yaW5nIHRoZSBjbGllbnQgcHJvY2Vzc1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFNFUlZFUl9QUk9DRVNTIC0gS2V5IGZvciBzdG9yaW5nIHRoZSBzZXJ2ZXIgcHJvY2Vzc1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFJTUEFDS19JTlNUQUxMQVRJT05fQ0hFQ0tFRCAtIEtleSBmb3IgdHJhY2tpbmcgaWYgUnNwYWNrIGluc3RhbGxhdGlvbiB3YXMgY2hlY2tlZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IElTX1JFQUNUX0VOQUJMRUQgLSBLZXkgZm9yIHRyYWNraW5nIGlmIFJlYWN0IGlzIGVuYWJsZWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBJTklUSUFMX0VOVFJZUE9OVFMgLSBLZXkgZm9yIHN0b3JpbmcgaW5pdGlhbCBlbnRyeXBvaW50c1xuICogQHByb3BlcnR5IHtzdHJpbmd9IENMSUVOVF9GSVJTVF9DT01QSUxFIC0gS2V5IGZvciB0cmFja2luZyBjbGllbnQgZmlyc3QgY29tcGlsYXRpb24gc3RhdGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBTRVJWRVJfRklSU1RfQ09NUElMRSAtIEtleSBmb3IgdHJhY2tpbmcgc2VydmVyIGZpcnN0IGNvbXBpbGF0aW9uIHN0YXRlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gQlVJTERfQ09OVEVYVF9GSUxFU19DTEVBTkVEIC0gS2V5IGZvciB0cmFja2luZyBpZiBidWlsZCBjb250ZXh0IGZpbGVzIGhhdmUgYmVlbiBjbGVhbmVkXG4gKi9cbmV4cG9ydCBjb25zdCBHTE9CQUxfU1RBVEVfS0VZUyA9IHtcbiAgQ0xJRU5UX1BST0NFU1M6ICdyc3BhY2suY2xpZW50UHJvY2VzcycsXG4gIFNFUlZFUl9QUk9DRVNTOiAncnNwYWNrLnNlcnZlclByb2Nlc3MnLFxuICBSU1BBQ0tfSU5TVEFMTEFUSU9OX0NIRUNLRUQ6ICdyc3BhY2sucnNwYWNrSW5zdGFsbGF0aW9uQ2hlY2tlZCcsXG4gIFJTUEFDS19SRUFDVF9JTlNUQUxMQVRJT05fQ0hFQ0tFRDogJ3JzcGFjay5yc3BhY2tSZWFjdEluc3RhbGxhdGlvbkNoZWNrZWQnLFxuICBSU1BBQ0tfRE9DVE9SX0lOU1RBTExBVElPTl9DSEVDS0VEOiAncnNwYWNrLnJzcGFja0RvY3Rvckluc3RhbGxhdGlvbkNoZWNrZWQnLFxuICBSRUFDVF9DSEVDS0VEOiAncnNwYWNrLnJlYWN0Q2hlY2tlZCcsXG4gIFRZUEVTQ1JJUFRfQ0hFQ0tFRDogJ3JzcGFjay50eXBlc2NyaXB0Q2hlY2tlZCcsXG4gIEFOR1VMQVJfQ0hFQ0tFRDogJ3JzcGFjay5hbmd1bGFyQ2hlY2tlZCcsXG4gIElOSVRJQUxfRU5UUllQT05UUzogJ21ldGVvci5pbml0aWFsRW50cnlwb2ludHMnLFxuICBDTElFTlRfRklSU1RfQ09NUElMRTogJ3JzcGFjay5jbGllbnRGaXJzdENvbXBpbGUnLFxuICBTRVJWRVJfRklSU1RfQ09NUElMRTogJ3JzcGFjay5zZXJ2ZXJGaXJzdENvbXBpbGUnLFxuICBCVUlMRF9DT05URVhUX0ZJTEVTX0NMRUFORUQ6ICdyc3BhY2suYnVpbGRDb250ZXh0RmlsZXNDbGVhbmVkJyxcbn07XG5cbmNvbnN0IG1ldGVvckNvbmZpZyA9IHR5cGVvZiBQbHVnaW4gIT09ICd1bmRlZmluZWQnID8gUGx1Z2luPy5nZXRNZXRlb3JDb25maWcoKSA6IG51bGw7XG5cbmNvbnN0IG1ldGVvckxvY2FsRGlyTmFtZSA9IHByb2Nlc3MuZW52Lk1FVEVPUl9MT0NBTF9ESVJcbiAgPyBwYXRoLmJhc2VuYW1lKHByb2Nlc3MuZW52Lk1FVEVPUl9MT0NBTF9ESVIucmVwbGFjZSgvXFxcXC9nLCAnLycpKVxuICA6ICcnO1xuXG4vKipcbiAqIERpcmVjdG9yeSBuYW1lIGZvciBSc3BhY2sgYnVpbGQgY29udGV4dFxuICogQ2FuIGJlIG92ZXJyaWRkZW4gd2l0aCBSU1BBQ0tfQlVJTERfQ09OVEVYVCBlbnZpcm9ubWVudCB2YXJpYWJsZVxuICogQGNvbnN0YW50IHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBSU1BBQ0tfQlVJTERfQ09OVEVYVCA9XG4gIG1ldGVvckNvbmZpZz8uYnVpbGRDb250ZXh0IHx8XG4gIHByb2Nlc3MuZW52LlJTUEFDS19CVUlMRF9DT05URVhUIHx8XG4gIGBfYnVpbGQkeyhtZXRlb3JMb2NhbERpck5hbWUgJiYgYC0ke21ldGVvckxvY2FsRGlyTmFtZX1gKSB8fCAnJ31gO1xuXG5wcm9jZXNzLmVudi5SU1BBQ0tfQlVJTERfQ09OVEVYVCA9IFJTUEFDS19CVUlMRF9DT05URVhUO1xuXG4vKipcbiAqIERpcmVjdG9yeSBuYW1lIGZvciBSc3BhY2sgYXNzZXRzIGNvbnRleHRcbiAqIENhbiBiZSBvdmVycmlkZGVuIHdpdGggUlNQQUNLX0FTU0VUU19DT05URVhUIGVudmlyb25tZW50IHZhcmlhYmxlXG4gKiBAY29uc3RhbnQge3N0cmluZ31cbiAqL1xuZXhwb3J0IGNvbnN0IFJTUEFDS19BU1NFVFNfQ09OVEVYVCA9XG4gIG1ldGVvckNvbmZpZz8uYXNzZXRzQ29udGV4dCB8fFxuICBwcm9jZXNzLmVudi5SU1BBQ0tfQVNTRVRTX0NPTlRFWFQgfHxcbiAgYGJ1aWxkLWFzc2V0cyR7KG1ldGVvckxvY2FsRGlyTmFtZSAmJiBgLSR7bWV0ZW9yTG9jYWxEaXJOYW1lfWApIHx8ICcnfWA7XG5cbnByb2Nlc3MuZW52LlJTUEFDS19BU1NFVFNfQ09OVEVYVCA9IFJTUEFDS19BU1NFVFNfQ09OVEVYVDtcblxuLyoqXG4gKiBEaXJlY3RvcnkgbmFtZSBmb3IgUnNwYWNrIGJ1bmRsZXMgY29udGV4dFxuICogQ2FuIGJlIG92ZXJyaWRkZW4gd2l0aCBSU1BBQ0tfQVNTRVRTX0NPTlRFWFQgZW52aXJvbm1lbnQgdmFyaWFibGVcbiAqIEBjb25zdGFudCB7c3RyaW5nfVxuICovXG5leHBvcnQgY29uc3QgUlNQQUNLX0NIVU5LU19DT05URVhUID1cbiAgbWV0ZW9yQ29uZmlnPy5jaHVua3NDb250ZXh0IHx8XG4gIHByb2Nlc3MuZW52LlJTUEFDS19DSFVOS1NfQ09OVEVYVCB8fFxuICBgYnVpbGQtY2h1bmtzJHsobWV0ZW9yTG9jYWxEaXJOYW1lICYmIGAtJHttZXRlb3JMb2NhbERpck5hbWV9YCkgfHwgJyd9YDtcblxucHJvY2Vzcy5lbnYuUlNQQUNLX0NIVU5LU19DT05URVhUID0gUlNQQUNLX0NIVU5LU19DT05URVhUO1xuXG4vKipcbiAqIERpcmVjdG9yeSBuYW1lIGZvciBSc3BhY2sgZG9jdG9yIGNvbnRleHRcbiAqIEB0eXBlIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBjb25zdCBSU1BBQ0tfRE9DVE9SX0NPTlRFWFQgPSAnLnJzZG9jdG9yJztcblxuLyoqXG4gKiBSZWdleCBwYXR0ZXJuIGZvciBob3QgdXBkYXRlIGZpbGVzXG4gKiBAY29uc3RhbnQge1JlZ0V4cH1cbiAqL1xuZXhwb3J0IGNvbnN0IFJTUEFDS19IT1RfVVBEQVRFX1JFR0VYID0gL15cXC8oLitcXC5ob3QtdXBkYXRlXFwuKD86anNvbnxqcykpJC87XG5cbmV4cG9ydCBjb25zdCBGSUxFX1JPTEUgPSB7XG4gIGJ1aWxkOiAnYnVpbGQnLFxuICBlbnRyeTogJ2VudHJ5JyxcbiAgcnVuOiAncnVuJyxcbiAgb3V0cHV0OiAnb3V0cHV0Jyxcbn07XG4iXX0=
