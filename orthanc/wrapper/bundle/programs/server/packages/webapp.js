Package["core-runtime"].queue("webapp",function () {/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EmitterPromise = Package.meteor.EmitterPromise;
var ECMAScript = Package.ecmascript.ECMAScript;
var Log = Package.logging.Log;
var RoutePolicy = Package.routepolicy.RoutePolicy;
var Boilerplate = Package['boilerplate-generator'].Boilerplate;
var WebAppHashing = Package['webapp-hashing'].WebAppHashing;
var Hook = Package['callback-hook'].Hook;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var WebApp, WebAppInternals, main;

var require = meteorInstall({"node_modules":{"meteor":{"webapp":{"webapp_server.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/webapp/webapp_server.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({WebApp:()=>WebApp,WebAppInternals:()=>WebAppInternals,getGroupInfo:()=>getGroupInfo},true);let assert;module.link('assert',{default(v){assert=v}},0);let readFileSync,chmodSync,chownSync;module.link('fs',{readFileSync(v){readFileSync=v},chmodSync(v){chmodSync=v},chownSync(v){chownSync=v}},1);let createServer;module.link('http',{createServer(v){createServer=v}},2);let userInfo;module.link('os',{userInfo(v){userInfo=v}},3);let pathJoin,pathDirname;module.link('path',{join(v){pathJoin=v},dirname(v){pathDirname=v}},4);let parseUrl;module.link('url',{parse(v){parseUrl=v}},5);let createHash;module.link('crypto',{createHash(v){createHash=v}},6);let express;module.link('express',{default(v){express=v}},7);let compress;module.link('compression',{default(v){compress=v}},8);let cookieParser;module.link('cookie-parser',{default(v){cookieParser=v}},9);let qs;module.link('qs',{default(v){qs=v}},10);let parseRequest;module.link('parseurl',{default(v){parseRequest=v}},11);let lookupUserAgent;module.link('useragent-ng',{lookup(v){lookupUserAgent=v}},12);let isModern;module.link('meteor/modern-browsers',{isModern(v){isModern=v}},13);let send;module.link('send',{default(v){send=v}},14);let removeExistingSocketFile,registerSocketFileCleanup;module.link('./socket_file.js',{removeExistingSocketFile(v){removeExistingSocketFile=v},registerSocketFileCleanup(v){registerSocketFileCleanup=v}},15);let cluster;module.link('cluster',{default(v){cluster=v}},16);let execSync;module.link('child_process',{execSync(v){execSync=v}},17);let onMessage;module.link('meteor/inter-process-messaging',{onMessage(v){onMessage=v}},18);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}


















var SHORT_SOCKET_TIMEOUT = 5 * 1000;
var LONG_SOCKET_TIMEOUT = 120 * 1000;
const createExpressApp = ()=>{
    const app = express();
    // Security and performace headers
    // these headers come from these docs: https://expressjs.com/en/api.html#app.settings.table
    app.set('x-powered-by', false);
    app.set('etag', false);
    app.set('query parser', qs.parse);
    return app;
};
const WebApp = {};
const WebAppInternals = {};
const hasOwn = Object.prototype.hasOwnProperty;
WebAppInternals.NpmModules = {
    express: {
        version: Npm.require('express/package.json').version,
        module: express
    }
};
// More of a convenience for the end user
WebApp.express = express;
// Though we might prefer to use web.browser (modern) as the default
// architecture, safety requires a more compatible defaultArch.
WebApp.defaultArch = 'web.browser.legacy';
// XXX maps archs to manifests
WebApp.clientPrograms = {};
// XXX maps archs to program path on filesystem
var archPath = {};
var bundledJsCssUrlRewriteHook = function(url) {
    var bundledPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
    return bundledPrefix + url;
};
var sha1 = function(contents) {
    var hash = createHash('sha1');
    hash.update(contents);
    return hash.digest('hex');
};
function shouldCompress(req, res) {
    if (req.headers['x-no-compression']) {
        // don't compress responses with this request header
        return false;
    }
    // fallback to standard filter function
    return compress.filter(req, res);
}
// #BrowserIdentification
//
// We have multiple places that want to identify the browser: the
// unsupported browser page, the appcache package, and, eventually
// delivering browser polyfills only as needed.
//
// To avoid detecting the browser in multiple places ad-hoc, we create a
// Meteor "browser" object. It uses but does not expose the npm
// useragent module (we could choose a different mechanism to identify
// the browser in the future if we wanted to).  The browser object
// contains
//
// * `name`: the name of the browser in camel case
// * `major`, `minor`, `patch`: integers describing the browser version
//
// Also here is an early version of a Meteor `request` object, intended
// to be a high-level description of the request without exposing
// details of Express's low-level `req`.  Currently it contains:
//
// * `browser`: browser identification object described above
// * `url`: parsed url, including parsed query params
//
// As a temporary hack there is a `categorizeRequest` function on WebApp which
// converts a Express `req` to a Meteor `request`. This can go away once smart
// packages such as appcache are being passed a `request` object directly when
// they serve content.
//
// This allows `request` to be used uniformly: it is passed to the html
// attributes hook, and the appcache package can use it when deciding
// whether to generate a 404 for the manifest.
//
// Real routing / server side rendering will probably refactor this
// heavily.
// e.g. "Mobile Safari" => "mobileSafari"
var camelCase = function(name) {
    var parts = name.split(' ');
    parts[0] = parts[0].toLowerCase();
    for(var i = 1; i < parts.length; ++i){
        parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
    }
    return parts.join('');
};
var identifyBrowser = function(userAgentString) {
    if (!userAgentString) {
        return {
            name: 'unknown',
            major: 0,
            minor: 0,
            patch: 0
        };
    }
    var userAgent = lookupUserAgent(userAgentString);
    return {
        name: camelCase(userAgent.family),
        major: +userAgent.major,
        minor: +userAgent.minor,
        patch: +userAgent.patch
    };
};
// XXX Refactor as part of implementing real routing.
WebAppInternals.identifyBrowser = identifyBrowser;
WebApp.categorizeRequest = function(req) {
    if (req.browser && req.arch && typeof req.modern === 'boolean') {
        // Already categorized.
        return req;
    }
    const browser = identifyBrowser(req.headers['user-agent']);
    const modern = isModern(browser);
    const path = typeof req.pathname === 'string' ? req.pathname : parseRequest(req).pathname;
    const categorized = {
        browser,
        modern,
        path,
        arch: WebApp.defaultArch,
        url: parseUrl(req.url, true),
        dynamicHead: req.dynamicHead,
        dynamicBody: req.dynamicBody,
        headers: req.headers,
        cookies: req.cookies
    };
    const pathParts = path.split('/');
    const archKey = pathParts[1];
    if (archKey.startsWith('__')) {
        const archCleaned = 'web.' + archKey.slice(2);
        if (hasOwn.call(WebApp.clientPrograms, archCleaned)) {
            pathParts.splice(1, 1); // Remove the archKey part.
            return Object.assign(categorized, {
                arch: archCleaned,
                path: pathParts.join('/')
            });
        }
    }
    // TODO Perhaps one day we could infer Cordova clients here, so that we
    // wouldn't have to use prefixed "/__cordova/..." URLs.
    const preferredArchOrder = isModern(browser) ? [
        'web.browser',
        'web.browser.legacy'
    ] : [
        'web.browser.legacy',
        'web.browser'
    ];
    for (const arch of preferredArchOrder){
        // If our preferred arch is not available, it's better to use another
        // client arch that is available than to guarantee the site won't work
        // by returning an unknown arch. For example, if web.browser.legacy is
        // excluded using the --exclude-archs command-line option, legacy
        // clients are better off receiving web.browser (which might actually
        // work) than receiving an HTTP 404 response. If none of the archs in
        // preferredArchOrder are defined, only then should we send a 404.
        if (hasOwn.call(WebApp.clientPrograms, arch)) {
            return Object.assign(categorized, {
                arch
            });
        }
    }
    return categorized;
};
// HTML attribute hooks: functions to be called to determine any attributes to
// be added to the '<html>' tag. Each function is passed a 'request' object (see
// #BrowserIdentification) and should return null or object.
var htmlAttributeHooks = [];
var getHtmlAttributes = function(request) {
    var combinedAttributes = {};
    (htmlAttributeHooks || []).forEach(function(hook) {
        var attributes = hook(request);
        if (attributes === null) return;
        if (typeof attributes !== 'object') throw Error('HTML attribute hook must return null or object');
        Object.assign(combinedAttributes, attributes);
    });
    return combinedAttributes;
};
WebApp.addHtmlAttributeHook = function(hook) {
    htmlAttributeHooks.push(hook);
};
// Serve app HTML for this URL?
var appUrl = function(url) {
    if (url === '/favicon.ico' || url === '/robots.txt') return false;
    // NOTE: app.manifest is not a web standard like favicon.ico and
    // robots.txt. It is a file name we have chosen to use for HTML5
    // appcache URLs. It is included here to prevent using an appcache
    // then removing it from poisoning an app permanently. Eventually,
    // once we have server side routing, this won't be needed as
    // unknown URLs with return a 404 automatically.
    if (url === '/app.manifest') return false;
    // Avoid serving app HTML for declared routes such as /sockjs/.
    if (RoutePolicy.classify(url)) return false;
    // we currently return app HTML on all URLs by default
    return true;
};
// We need to calculate the client hash after all packages have loaded
// to give them a chance to populate __meteor_runtime_config__.
//
// Calculating the hash during startup means that packages can only
// populate __meteor_runtime_config__ during load, not during startup.
//
// Calculating instead it at the beginning of main after all startup
// hooks had run would allow packages to also populate
// __meteor_runtime_config__ during startup, but that's too late for
// autoupdate because it needs to have the client hash at startup to
// insert the auto update version itself into
// __meteor_runtime_config__ to get it to the client.
//
// An alternative would be to give autoupdate a "post-start,
// pre-listen" hook to allow it to insert the auto update version at
// the right moment.
Meteor.startup(function() {
    function getter(key) {
        return function(arch) {
            arch = arch || WebApp.defaultArch;
            const program = WebApp.clientPrograms[arch];
            const value = program && program[key];
            // If this is the first time we have calculated this hash,
            // program[key] will be a thunk (lazy function with no parameters)
            // that we should call to do the actual computation.
            return typeof value === 'function' ? program[key] = value() : value;
        };
    }
    WebApp.calculateClientHash = WebApp.clientHash = getter('version');
    WebApp.calculateClientHashRefreshable = getter('versionRefreshable');
    WebApp.calculateClientHashNonRefreshable = getter('versionNonRefreshable');
    WebApp.calculateClientHashReplaceable = getter('versionReplaceable');
    WebApp.getRefreshableAssets = getter('refreshableAssets');
});
// When we have a request pending, we want the socket timeout to be long, to
// give ourselves a while to serve it, and to allow sockjs long polls to
// complete.  On the other hand, we want to close idle sockets relatively
// quickly, so that we can shut down relatively promptly but cleanly, without
// cutting off anyone's response.
WebApp._timeoutAdjustmentRequestCallback = function(req, res) {
    // this is really just req.socket.setTimeout(LONG_SOCKET_TIMEOUT);
    req.setTimeout(LONG_SOCKET_TIMEOUT);
    // Insert our new finish listener to run BEFORE the existing one which removes
    // the response from the socket.
    var finishListeners = res.listeners('finish');
    // XXX Apparently in Node 0.12 this event was called 'prefinish'.
    // https://github.com/joyent/node/commit/7c9b6070
    // But it has switched back to 'finish' in Node v4:
    // https://github.com/nodejs/node/pull/1411
    res.removeAllListeners('finish');
    res.on('finish', function() {
        res.setTimeout(SHORT_SOCKET_TIMEOUT);
    });
    Object.values(finishListeners).forEach(function(l) {
        res.on('finish', l);
    });
};
// Will be updated by main before we listen.
// Map from client arch to boilerplate object.
// Boilerplate object has:
//   - func: XXX
//   - baseData: XXX
var boilerplateByArch = {};
// Register a callback function that can selectively modify boilerplate
// data given arguments (request, data, arch). The key should be a unique
// identifier, to prevent accumulating duplicate callbacks from the same
// call site over time. Callbacks will be called in the order they were
// registered. A callback should return false if it did not make any
// changes affecting the boilerplate. Passing null deletes the callback.
// Any previous callback registered for this key will be returned.
const boilerplateDataCallbacks = Object.create(null);
WebAppInternals.registerBoilerplateDataCallback = function(key, callback) {
    const previousCallback = boilerplateDataCallbacks[key];
    if (typeof callback === 'function') {
        boilerplateDataCallbacks[key] = callback;
    } else {
        assert.strictEqual(callback, null);
        delete boilerplateDataCallbacks[key];
    }
    // Return the previous callback in case the new callback needs to call
    // it; for example, when the new callback is a wrapper for the old.
    return previousCallback || null;
};
// Given a request (as returned from `categorizeRequest`), return the
// boilerplate HTML to serve for that request.
//
// If a previous Express middleware has rendered content for the head or body,
// returns the boilerplate with that content patched in otherwise
// memoizes on HTML attributes (used by, eg, appcache) and whether inline
// scripts are currently allowed.
// XXX so far this function is always called with arch === 'web.browser'
function getBoilerplate(request, arch) {
    return getBoilerplateAsync(request, arch);
}
/**
 * @summary Takes a runtime configuration object and
 * returns an encoded runtime string.
 * @locus Server
 * @param {Object} rtimeConfig
 * @returns {String}
 */ WebApp.encodeRuntimeConfig = function(rtimeConfig) {
    return JSON.stringify(encodeURIComponent(JSON.stringify(rtimeConfig)));
};
/**
 * @summary Takes an encoded runtime string and returns
 * a runtime configuration object.
 * @locus Server
 * @param {String} rtimeConfigString
 * @returns {Object}
 */ WebApp.decodeRuntimeConfig = function(rtimeConfigStr) {
    return JSON.parse(decodeURIComponent(JSON.parse(rtimeConfigStr)));
};
const runtimeConfig = {
    // hooks will contain the callback functions
    // set by the caller to addRuntimeConfigHook
    hooks: new Hook(),
    // updateHooks will contain the callback functions
    // set by the caller to addUpdatedNotifyHook
    updateHooks: new Hook(),
    // isUpdatedByArch is an object containing fields for each arch
    // that this server supports.
    // - Each field will be true when the server updates the runtimeConfig for that arch.
    // - When the hook callback is called the update field in the callback object will be
    // set to isUpdatedByArch[arch].
    // = isUpdatedyByArch[arch] is reset to false after the callback.
    // This enables the caller to cache data efficiently so they do not need to
    // decode & update data on every callback when the runtimeConfig is not changing.
    isUpdatedByArch: {}
};
/**
 * @name addRuntimeConfigHookCallback(options)
 * @locus Server
 * @isprototype true
 * @summary Callback for `addRuntimeConfigHook`.
 *
 * If the handler returns a _falsy_ value the hook will not
 * modify the runtime configuration.
 *
 * If the handler returns a _String_ the hook will substitute
 * the string for the encoded configuration string.
 *
 * **Warning:** the hook does not check the return value at all it is
 * the responsibility of the caller to get the formatting correct using
 * the helper functions.
 *
 * `addRuntimeConfigHookCallback` takes only one `Object` argument
 * with the following fields:
 * @param {Object} options
 * @param {String} options.arch The architecture of the client
 * requesting a new runtime configuration. This can be one of
 * `web.browser`, `web.browser.legacy` or `web.cordova`.
 * @param {Object} options.request
 * A NodeJs [IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
 * https://nodejs.org/api/http.html#http_class_http_incomingmessage
 * `Object` that can be used to get information about the incoming request.
 * @param {String} options.encodedCurrentConfig The current configuration object
 * encoded as a string for inclusion in the root html.
 * @param {Boolean} options.updated `true` if the config for this architecture
 * has been updated since last called, otherwise `false`. This flag can be used
 * to cache the decoding/encoding for each architecture.
 */ /**
 * @summary Hook that calls back when the meteor runtime configuration,
 * `__meteor_runtime_config__` is being sent to any client.
 *
 * **returns**: <small>_Object_</small> `{ stop: function, callback: function }`
 * - `stop` <small>_Function_</small> Call `stop()` to stop getting callbacks.
 * - `callback` <small>_Function_</small> The passed in `callback`.
 * @locus Server
 * @param {addRuntimeConfigHookCallback} callback
 * See `addRuntimeConfigHookCallback` description.
 * @returns {Object} {{ stop: function, callback: function }}
 * Call the returned `stop()` to stop getting callbacks.
 * The passed in `callback` is returned also.
 */ WebApp.addRuntimeConfigHook = function(callback) {
    return runtimeConfig.hooks.register(callback);
};
function getBoilerplateAsync(request, arch, response) {
    return _async_to_generator(function*() {
        let boilerplate = boilerplateByArch[arch];
        yield runtimeConfig.hooks.forEachAsync((hook)=>_async_to_generator(function*() {
                const meteorRuntimeConfig = yield hook({
                    arch,
                    request,
                    encodedCurrentConfig: boilerplate.baseData.meteorRuntimeConfig,
                    updated: runtimeConfig.isUpdatedByArch[arch]
                });
                if (!meteorRuntimeConfig) return true;
                boilerplate.baseData = Object.assign({}, boilerplate.baseData, {
                    meteorRuntimeConfig
                });
                return true;
            })());
        runtimeConfig.isUpdatedByArch[arch] = false;
        const { dynamicHead, dynamicBody } = request;
        const data = Object.assign({}, boilerplate.baseData, {
            htmlAttributes: getHtmlAttributes(request)
        }, {
            dynamicHead,
            dynamicBody
        });
        let madeChanges = false;
        let promise = Promise.resolve();
        Object.keys(boilerplateDataCallbacks).forEach((key)=>{
            promise = promise.then(()=>{
                const callback = boilerplateDataCallbacks[key];
                return callback(request, data, arch, response);
            }).then((result)=>{
                // Callbacks should return false if they did not make any changes.
                if (result !== false) {
                    madeChanges = true;
                }
            });
        });
        return promise.then(()=>({
                stream: boilerplate.toHTMLStream(data),
                statusCode: data.statusCode,
                headers: data.headers
            }));
    })();
}
/**
 * @name addUpdatedNotifyHookCallback(options)
 * @summary callback handler for `addupdatedNotifyHook`
 * @isprototype true
 * @locus Server
 * @param {Object} options
 * @param {String} options.arch The architecture that is being updated.
 * This can be one of `web.browser`, `web.browser.legacy` or `web.cordova`.
 * @param {Object} options.manifest The new updated manifest object for
 * this `arch`.
 * @param {Object} options.runtimeConfig The new updated configuration
 * object for this `arch`.
 */ /**
 * @summary Hook that runs when the meteor runtime configuration
 * is updated.  Typically the configuration only changes during development mode.
 * @locus Server
 * @param {addUpdatedNotifyHookCallback} handler
 * The `handler` is called on every change to an `arch` runtime configuration.
 * See `addUpdatedNotifyHookCallback`.
 * @returns {Object} {{ stop: function, callback: function }}
 */ WebApp.addUpdatedNotifyHook = function(handler) {
    return runtimeConfig.updateHooks.register(handler);
};
WebAppInternals.generateBoilerplateInstance = function(arch, manifest, additionalOptions) {
    additionalOptions = additionalOptions || {};
    runtimeConfig.isUpdatedByArch[arch] = true;
    const rtimeConfig = _object_spread({}, __meteor_runtime_config__, additionalOptions.runtimeConfigOverrides || {});
    runtimeConfig.updateHooks.forEach((cb)=>{
        cb({
            arch,
            manifest,
            runtimeConfig: rtimeConfig
        });
        return true;
    });
    const meteorRuntimeConfig = JSON.stringify(encodeURIComponent(JSON.stringify(rtimeConfig)));
    return new Boilerplate(arch, manifest, Object.assign({
        pathMapper (itemPath) {
            return pathJoin(archPath[arch], itemPath);
        },
        baseDataExtension: {
            additionalStaticJs: (Object.entries(additionalStaticJs) || []).map(function([pathname, contents]) {
                return {
                    pathname: pathname,
                    contents: contents
                };
            }),
            // Convert to a JSON string, then get rid of most weird characters, then
            // wrap in double quotes. (The outermost JSON.stringify really ought to
            // just be "wrap in double quotes" but we use it to be safe.) This might
            // end up inside a <script> tag so we need to be careful to not include
            // "</script>", but normal {{spacebars}} escaping escapes too much! See
            // https://github.com/meteor/meteor/issues/3730
            meteorRuntimeConfig,
            meteorRuntimeHash: sha1(meteorRuntimeConfig),
            rootUrlPathPrefix: __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '',
            bundledJsCssUrlRewriteHook: bundledJsCssUrlRewriteHook,
            sriMode: sriMode,
            inlineScriptsAllowed: WebAppInternals.inlineScriptsAllowed(),
            inline: additionalOptions.inline
        }
    }, additionalOptions));
};
// A mapping from url path to architecture (e.g. "web.browser") to static
// file information with the following fields:
// - type: the type of file to be served
// - cacheable: optionally, whether the file should be cached or not
// - sourceMapUrl: optionally, the url of the source map
//
// Info also contains one of the following:
// - content: the stringified content that should be served at this path
// - absolutePath: the absolute path on disk to the file
// Serve static files from the manifest or added with
// `addStaticJs`. Exported for tests.
WebAppInternals.staticFilesMiddleware = function(staticFilesByArch, req, res, next) {
    return _async_to_generator(function*() {
        var _Meteor_settings_packages_webapp, _Meteor_settings_packages, _Meteor_settings_packages_webapp1, _Meteor_settings_packages1;
        var pathname = parseRequest(req).pathname;
        try {
            pathname = decodeURIComponent(pathname);
        } catch (e) {
            next();
            return;
        }
        var serveStaticJs = function(s) {
            var _Meteor_settings_packages_webapp, _Meteor_settings_packages;
            if (req.method === 'GET' || req.method === 'HEAD' || ((_Meteor_settings_packages = Meteor.settings.packages) === null || _Meteor_settings_packages === void 0 ? void 0 : (_Meteor_settings_packages_webapp = _Meteor_settings_packages.webapp) === null || _Meteor_settings_packages_webapp === void 0 ? void 0 : _Meteor_settings_packages_webapp.alwaysReturnContent)) {
                res.writeHead(200, {
                    'Content-type': 'application/javascript; charset=UTF-8',
                    'Content-Length': Buffer.byteLength(s)
                });
                res.write(s);
                res.end();
            } else {
                const status = req.method === 'OPTIONS' ? 200 : 405;
                res.writeHead(status, {
                    Allow: 'OPTIONS, GET, HEAD',
                    'Content-Length': '0'
                });
                res.end();
            }
        };
        if (pathname in additionalStaticJs && !WebAppInternals.inlineScriptsAllowed()) {
            serveStaticJs(additionalStaticJs[pathname]);
            return;
        }
        const { arch, path } = WebApp.categorizeRequest(req);
        if (!hasOwn.call(WebApp.clientPrograms, arch)) {
            // We could come here in case we run with some architectures excluded
            next();
            return;
        }
        // If pauseClient(arch) has been called, program.paused will be a
        // Promise that will be resolved when the program is unpaused.
        const program = WebApp.clientPrograms[arch];
        yield program.paused;
        if (path === '/meteor_runtime_config.js' && !WebAppInternals.inlineScriptsAllowed()) {
            serveStaticJs(`__meteor_runtime_config__ = ${program.meteorRuntimeConfig};`);
            return;
        }
        const info = getStaticFileInfo(staticFilesByArch, pathname, path, arch);
        if (!info) {
            next();
            return;
        }
        // "send" will handle HEAD & GET requests
        if (req.method !== 'HEAD' && req.method !== 'GET' && !((_Meteor_settings_packages = Meteor.settings.packages) === null || _Meteor_settings_packages === void 0 ? void 0 : (_Meteor_settings_packages_webapp = _Meteor_settings_packages.webapp) === null || _Meteor_settings_packages_webapp === void 0 ? void 0 : _Meteor_settings_packages_webapp.alwaysReturnContent)) {
            const status = req.method === 'OPTIONS' ? 200 : 405;
            res.writeHead(status, {
                Allow: 'OPTIONS, GET, HEAD',
                'Content-Length': '0'
            });
            res.end();
            return;
        }
        // We don't need to call pause because, unlike 'static', once we call into
        // 'send' and yield to the event loop, we never call another handler with
        // 'next'.
        // Cacheable files are files that should never change. Typically
        // named by their hash (eg meteor bundled js and css files).
        // We cache them ~forever (1yr).
        const maxAge = info.cacheable ? 1000 * 60 * 60 * 24 * 365 : 0;
        var _Meteor_settings_packages_webapp_includeVaryUserAgent;
        // Resources whose URL already contains the content hash are immutable
        // and unique per architecture (modern vs legacy), so Vary: User-Agent
        // is unnecessary and harms CDN cache efficiency.
        //
        // If the requested URL does not contain the hash (e.g. development
        // or unhashed assets), we keep Vary: User-Agent to prevent cache
        // poisoning across different browsers.
        const includeVaryUserAgent = (_Meteor_settings_packages_webapp_includeVaryUserAgent = (_Meteor_settings_packages1 = Meteor.settings.packages) === null || _Meteor_settings_packages1 === void 0 ? void 0 : (_Meteor_settings_packages_webapp1 = _Meteor_settings_packages1.webapp) === null || _Meteor_settings_packages_webapp1 === void 0 ? void 0 : _Meteor_settings_packages_webapp1.includeVaryUserAgent) !== null && _Meteor_settings_packages_webapp_includeVaryUserAgent !== void 0 ? _Meteor_settings_packages_webapp_includeVaryUserAgent : true;
        if (info.cacheable && !pathname.includes(info.hash) && includeVaryUserAgent) {
            res.setHeader('Vary', 'User-Agent');
        }
        // Set the X-SourceMap header, which current Chrome, FireFox, and Safari
        // understand.  (The SourceMap header is slightly more spec-correct but FF
        // doesn't understand it.)
        //
        // You may also need to enable source maps in Chrome: open dev tools, click
        // the gear in the bottom right corner, and select "enable source maps".
        if (info.sourceMapUrl) {
            res.setHeader('X-SourceMap', __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + info.sourceMapUrl);
        }
        if (info.type === 'js' || info.type === 'dynamic js') {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        } else if (info.type === 'css') {
            res.setHeader('Content-Type', 'text/css; charset=UTF-8');
        } else if (info.type === 'json') {
            res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        }
        if (info.hash) {
            res.setHeader('ETag', '"' + info.hash + '"');
        }
        if (info.content) {
            res.setHeader('Content-Length', Buffer.byteLength(info.content));
            res.write(info.content);
            res.end();
        } else {
            send(req, info.absolutePath, {
                maxage: maxAge,
                dotfiles: 'allow',
                lastModified: false
            }).on('error', function(err) {
                Log.error('Error serving static file ' + err);
                res.writeHead(500);
                res.end();
            }).on('directory', function() {
                Log.error('Unexpected directory ' + info.absolutePath);
                res.writeHead(500);
                res.end();
            }).pipe(res);
        }
    })();
};
function getStaticFileInfo(staticFilesByArch, originalPath, path, arch) {
    if (!hasOwn.call(WebApp.clientPrograms, arch)) {
        return null;
    }
    // Get a list of all available static file architectures, with arch
    // first in the list if it exists.
    const staticArchList = Object.keys(staticFilesByArch);
    const archIndex = staticArchList.indexOf(arch);
    if (archIndex > 0) {
        staticArchList.unshift(staticArchList.splice(archIndex, 1)[0]);
    }
    let info = null;
    staticArchList.some((arch)=>{
        const staticFiles = staticFilesByArch[arch];
        function finalize(path) {
            info = staticFiles[path];
            // Sometimes we register a lazy function instead of actual data in
            // the staticFiles manifest.
            if (typeof info === 'function') {
                info = staticFiles[path] = info();
            }
            return info;
        }
        // If staticFiles contains originalPath with the arch inferred above,
        // use that information.
        if (hasOwn.call(staticFiles, originalPath)) {
            return finalize(originalPath);
        }
        // If categorizeRequest returned an alternate path, try that instead.
        if (path !== originalPath && hasOwn.call(staticFiles, path)) {
            return finalize(path);
        }
    });
    return info;
}
// Parse the passed in port value. Return the port as-is if it's a String
// (e.g. a Windows Server style named pipe), otherwise return the port as an
// integer.
//
// DEPRECATED: Direct use of this function is not recommended; it is no
// longer used internally, and will be removed in a future release.
WebAppInternals.parsePort = (port)=>{
    let parsedPort = parseInt(port);
    if (Number.isNaN(parsedPort)) {
        parsedPort = port;
    }
    return parsedPort;
};

onMessage('webapp-pause-client', ({ arch })=>_async_to_generator(function*() {
        yield WebAppInternals.pauseClient(arch);
    })());
onMessage('webapp-reload-client', ({ arch })=>_async_to_generator(function*() {
        yield WebAppInternals.generateClientProgram(arch);
    })());
function runWebAppServer() {
    return _async_to_generator(function*() {
        var shuttingDown = false;
        var syncQueue = new Meteor._AsynchronousQueue();
        var getItemPathname = function(itemUrl) {
            return decodeURIComponent(parseUrl(itemUrl).pathname);
        };
        WebAppInternals.reloadClientPrograms = function() {
            return _async_to_generator(function*() {
                yield syncQueue.runTask(function() {
                    const staticFilesByArch = Object.create(null);
                    const { configJson } = __meteor_bootstrap__;
                    const clientArchs = configJson.clientArchs || Object.keys(configJson.clientPaths);
                    try {
                        clientArchs.forEach((arch)=>{
                            generateClientProgram(arch, staticFilesByArch);
                        });
                        WebAppInternals.staticFilesByArch = staticFilesByArch;
                    } catch (e) {
                        Log.error('Error reloading the client program: ' + e.stack);
                        process.exit(1);
                    }
                });
            })();
        };
        // Pause any incoming requests and make them wait for the program to be
        // unpaused the next time generateClientProgram(arch) is called.
        WebAppInternals.pauseClient = function(arch) {
            return _async_to_generator(function*() {
                yield syncQueue.runTask(()=>{
                    const program = WebApp.clientPrograms[arch];
                    const { unpause } = program;
                    program.paused = new Promise((resolve)=>{
                        if (typeof unpause === 'function') {
                            // If there happens to be an existing program.unpause function,
                            // compose it with the resolve function.
                            program.unpause = function() {
                                unpause();
                                resolve();
                            };
                        } else {
                            program.unpause = resolve;
                        }
                    });
                });
            })();
        };
        WebAppInternals.generateClientProgram = function(arch) {
            return _async_to_generator(function*() {
                yield syncQueue.runTask(()=>generateClientProgram(arch));
            })();
        };
        function generateClientProgram(arch, staticFilesByArch = WebAppInternals.staticFilesByArch) {
            const clientDir = pathJoin(pathDirname(__meteor_bootstrap__.serverDir), arch);
            // read the control for the client we'll be serving up
            const programJsonPath = pathJoin(clientDir, 'program.json');
            let programJson;
            try {
                programJson = JSON.parse(readFileSync(programJsonPath));
            } catch (e) {
                if (e.code === 'ENOENT') return;
                throw e;
            }
            if (programJson.format !== 'web-program-pre1') {
                throw new Error('Unsupported format for client assets: ' + JSON.stringify(programJson.format));
            }
            if (!programJsonPath || !clientDir || !programJson) {
                throw new Error('Client config file not parsed.');
            }
            archPath[arch] = clientDir;
            const staticFiles = staticFilesByArch[arch] = Object.create(null);
            const { manifest } = programJson;
            manifest.forEach((item)=>{
                if (item.url && item.where === 'client') {
                    staticFiles[getItemPathname(item.url)] = {
                        absolutePath: pathJoin(clientDir, item.path),
                        cacheable: item.cacheable,
                        hash: item.hash,
                        // Link from source to its map
                        sourceMapUrl: item.sourceMapUrl,
                        type: item.type
                    };
                    if (item.sourceMap) {
                        // Serve the source map too, under the specified URL. We assume
                        // all source maps are cacheable.
                        staticFiles[getItemPathname(item.sourceMapUrl)] = {
                            absolutePath: pathJoin(clientDir, item.sourceMap),
                            cacheable: true
                        };
                    }
                }
            });
            const { PUBLIC_SETTINGS } = __meteor_runtime_config__;
            const configOverrides = {
                PUBLIC_SETTINGS
            };
            const oldProgram = WebApp.clientPrograms[arch];
            const newProgram = WebApp.clientPrograms[arch] = {
                format: 'web-program-pre1',
                manifest: manifest,
                // Use arrow functions so that these versions can be lazily
                // calculated later, and so that they will not be included in the
                // staticFiles[manifestUrl].content string below.
                //
                // Note: these version calculations must be kept in agreement with
                // CordovaBuilder#appendVersion in tools/cordova/builder.js, or hot
                // code push will reload Cordova apps unnecessarily.
                version: ()=>WebAppHashing.calculateClientHash(manifest, null, configOverrides),
                versionRefreshable: ()=>WebAppHashing.calculateClientHash(manifest, (type)=>type === 'css', configOverrides),
                versionNonRefreshable: ()=>WebAppHashing.calculateClientHash(manifest, (type, replaceable)=>type !== 'css' && !replaceable, configOverrides),
                versionReplaceable: ()=>WebAppHashing.calculateClientHash(manifest, (_type, replaceable)=>replaceable, configOverrides),
                cordovaCompatibilityVersions: programJson.cordovaCompatibilityVersions,
                PUBLIC_SETTINGS,
                hmrVersion: programJson.hmrVersion
            };
            // Expose program details as a string reachable via the following URL.
            const manifestUrlPrefix = '/__' + arch.replace(/^web\./, '');
            const manifestUrl = manifestUrlPrefix + getItemPathname('/manifest.json');
            staticFiles[manifestUrl] = ()=>{
                if (Package.autoupdate) {
                    const { AUTOUPDATE_VERSION = Package.autoupdate.Autoupdate.autoupdateVersion } = process.env;
                    if (AUTOUPDATE_VERSION) {
                        newProgram.version = AUTOUPDATE_VERSION;
                    }
                }
                if (typeof newProgram.version === 'function') {
                    newProgram.version = newProgram.version();
                }
                return {
                    content: JSON.stringify(newProgram),
                    cacheable: false,
                    hash: newProgram.version,
                    type: 'json'
                };
            };
            generateBoilerplateForArch(arch);
            // If there are any requests waiting on oldProgram.paused, let them
            // continue now (using the new program).
            if (oldProgram && oldProgram.paused) {
                oldProgram.unpause();
            }
        }
        const defaultOptionsForArch = {
            'web.cordova': {
                runtimeConfigOverrides: {
                    // XXX We use absoluteUrl() here so that we serve https://
                    // URLs to cordova clients if force-ssl is in use. If we were
                    // to use __meteor_runtime_config__.ROOT_URL instead of
                    // absoluteUrl(), then Cordova clients would immediately get a
                    // HCP setting their DDP_DEFAULT_CONNECTION_URL to
                    // http://example.meteor.com. This breaks the app, because
                    // force-ssl doesn't serve CORS headers on 302
                    // redirects. (Plus it's undesirable to have clients
                    // connecting to http://example.meteor.com when force-ssl is
                    // in use.)
                    DDP_DEFAULT_CONNECTION_URL: process.env.MOBILE_DDP_URL || Meteor.absoluteUrl(),
                    ROOT_URL: process.env.MOBILE_ROOT_URL || Meteor.absoluteUrl()
                }
            },
            'web.browser': {
                runtimeConfigOverrides: {
                    isModern: true
                }
            },
            'web.browser.legacy': {
                runtimeConfigOverrides: {
                    isModern: false
                }
            }
        };
        WebAppInternals.generateBoilerplate = function() {
            return _async_to_generator(function*() {
                // This boilerplate will be served to the mobile devices when used with
                // Meteor/Cordova for the Hot-Code Push and since the file will be served by
                // the device's server, it is important to set the DDP url to the actual
                // Meteor server accepting DDP connections and not the device's file server.
                yield syncQueue.runTask(function() {
                    Object.keys(WebApp.clientPrograms).forEach(generateBoilerplateForArch);
                });
            })();
        };
        function generateBoilerplateForArch(arch) {
            const program = WebApp.clientPrograms[arch];
            const additionalOptions = defaultOptionsForArch[arch] || {};
            const { baseData } = boilerplateByArch[arch] = WebAppInternals.generateBoilerplateInstance(arch, program.manifest, additionalOptions);
            // We need the runtime config with overrides for meteor_runtime_config.js:
            program.meteorRuntimeConfig = JSON.stringify(_object_spread({}, __meteor_runtime_config__, additionalOptions.runtimeConfigOverrides || null));
            program.refreshableAssets = baseData.css.map((file)=>({
                    url: bundledJsCssUrlRewriteHook(file.url)
                }));
        }
        yield WebAppInternals.reloadClientPrograms();
        // webserver
        var app = createExpressApp();
        // Packages and apps can add handlers that run before any other Meteor
        // handlers via WebApp.rawExpressHandlers.
        var rawExpressHandlers = createExpressApp();
        app.use(rawExpressHandlers);
        // Auto-compress any json, javascript, or text.
        app.use(compress({
            filter: shouldCompress
        }));
        // parse cookies into an object
        app.use(cookieParser());
        // We're not a proxy; reject (without crashing) attempts to treat us like
        // one. (See #1212.)
        app.use(function(req, res, next) {
            if (RoutePolicy.isValidUrl(req.url)) {
                next();
                return;
            }
            res.writeHead(400);
            res.write('Not a proxy');
            res.end();
        });
        function getPathParts(path) {
            const parts = path.split('/');
            while(parts[0] === '')parts.shift();
            return parts;
        }
        function isPrefixOf(prefix, array) {
            return prefix.length <= array.length && prefix.every((part, i)=>part === array[i]);
        }
        // Strip off the path prefix, if it exists.
        app.use(function(request, response, next) {
            const pathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
            const { pathname, search } = parseUrl(request.url);
            // check if the path in the url starts with the path prefix
            if (pathPrefix) {
                const prefixParts = getPathParts(pathPrefix);
                const pathParts = getPathParts(pathname);
                if (isPrefixOf(prefixParts, pathParts)) {
                    request.url = '/' + pathParts.slice(prefixParts.length).join('/');
                    if (search) {
                        request.url += search;
                    }
                    return next();
                }
            }
            if (pathname === '/favicon.ico' || pathname === '/robots.txt') {
                return next();
            }
            if (pathPrefix) {
                response.writeHead(404);
                response.write('Unknown path');
                response.end();
                return;
            }
            next();
        });
        // Serve static files from the manifest.
        // This is inspired by the 'static' middleware.
        app.use(function(req, res, next) {
            // console.log(String(arguments.callee));
            WebAppInternals.staticFilesMiddleware(WebAppInternals.staticFilesByArch, req, res, next);
        });
        // Core Meteor packages like dynamic-import can add handlers before
        // other handlers added by package and application code.
        app.use(WebAppInternals.meteorInternalHandlers = createExpressApp());
        /**
   * @name expressHandlersCallback(req, res, next)
   * @locus Server
   * @isprototype true
   * @summary callback handler for `WebApp.expressHandlers`
   * @param {Object} req
   * a Node.js
   * [IncomingMessage](https://nodejs.org/api/http.html#class-httpincomingmessage)
   * object with some extra properties. This argument can be used
   *  to get information about the incoming request.
   * @param {Object} res
   * a Node.js
   * [ServerResponse](https://nodejs.org/api/http.html#class-httpserverresponse)
   * object. Use this to write data that should be sent in response to the
   * request, and call `res.end()` when you are done.
   * @param {Function} next
   * Calling this function will pass on the handling of
   * this request to the next relevant handler.
   *
   */ /**
   * @method handlers
   * @memberof WebApp
   * @locus Server
   * @summary Register a handler for all HTTP requests.
   * @param {String} [path]
   * This handler will only be called on paths that match
   * this string. The match has to border on a `/` or a `.`.
   *
   * For example, `/hello` will match `/hello/world` and
   * `/hello.world`, but not `/hello_world`.
   * @param {expressHandlersCallback} handler
   * A handler function that will be called on HTTP requests.
   * See `expressHandlersCallback`
   *
   */ // Packages and apps can add handlers to this via WebApp.expressHandlers.
        // They are inserted before our default handler.
        var packageAndAppHandlers = createExpressApp();
        app.use(packageAndAppHandlers);
        let suppressExpressErrors = false;
        // Express knows it is an error handler because it has 4 arguments instead of
        // 3. go figure.  (It is not smart enough to find such a thing if it's hidden
        // inside packageAndAppHandlers.)
        app.use(function(err, req, res, next) {
            if (!err || !suppressExpressErrors || !req.headers['x-suppress-error']) {
                next(err);
                return;
            }
            res.writeHead(err.status, {
                'Content-Type': 'text/plain'
            });
            res.end('An error message');
        });
        app.use(function(req, res, next) {
            return _async_to_generator(function*() {
                var _Meteor_settings_packages_webapp, _Meteor_settings_packages;
                if (!appUrl(req.url)) {
                    return next();
                } else if (req.method !== 'HEAD' && req.method !== 'GET' && !((_Meteor_settings_packages = Meteor.settings.packages) === null || _Meteor_settings_packages === void 0 ? void 0 : (_Meteor_settings_packages_webapp = _Meteor_settings_packages.webapp) === null || _Meteor_settings_packages_webapp === void 0 ? void 0 : _Meteor_settings_packages_webapp.alwaysReturnContent)) {
                    const status = req.method === 'OPTIONS' ? 200 : 405;
                    res.writeHead(status, {
                        Allow: 'OPTIONS, GET, HEAD',
                        'Content-Length': '0'
                    });
                    res.end();
                } else {
                    var headers = {
                        'Content-Type': 'text/html; charset=utf-8'
                    };
                    if (shuttingDown) {
                        headers['Connection'] = 'Close';
                    }
                    var request = WebApp.categorizeRequest(req);
                    var response = res;
                    if (request.url.query && request.url.query['meteor_css_resource']) {
                        // In this case, we're requesting a CSS resource in the meteor-specific
                        // way, but we don't have it.  Serve a static css file that indicates that
                        // we didn't have it, so we can detect that and refresh.  Make sure
                        // that any proxies or CDNs don't cache this error!  (Normally proxies
                        // or CDNs are smart enough not to cache error pages, but in order to
                        // make this hack work, we need to return the CSS file as a 200, which
                        // would otherwise be cached.)
                        headers['Content-Type'] = 'text/css; charset=utf-8';
                        headers['Cache-Control'] = 'no-cache';
                        res.writeHead(200, headers);
                        res.write('.meteor-css-not-found-error { width: 0px;}');
                        res.end();
                        return;
                    }
                    if (request.url.query && request.url.query['meteor_js_resource']) {
                        // Similarly, we're requesting a JS resource that we don't have.
                        // Serve an uncached 404. (We can't use the same hack we use for CSS,
                        // because actually acting on that hack requires us to have the JS
                        // already!)
                        headers['Cache-Control'] = 'no-cache';
                        res.writeHead(404, headers);
                        res.end('404 Not Found');
                        return;
                    }
                    if (request.url.query && request.url.query['meteor_dont_serve_index']) {
                        // When downloading files during a Cordova hot code push, we need
                        // to detect if a file is not available instead of inadvertently
                        // downloading the default index page.
                        // So similar to the situation above, we serve an uncached 404.
                        headers['Cache-Control'] = 'no-cache';
                        res.writeHead(404, headers);
                        res.end('404 Not Found');
                        return;
                    }
                    const { arch } = request;
                    assert.strictEqual(typeof arch, 'string', {
                        arch
                    });
                    if (!hasOwn.call(WebApp.clientPrograms, arch)) {
                        // We could come here in case we run with some architectures excluded
                        headers['Cache-Control'] = 'no-cache';
                        res.writeHead(404, headers);
                        if (Meteor.isDevelopment) {
                            res.end(`No client program found for the ${arch} architecture.`);
                        } else {
                            // Safety net, but this branch should not be possible.
                            res.end('404 Not Found');
                        }
                        return;
                    }
                    // If pauseClient(arch) has been called, program.paused will be a
                    // Promise that will be resolved when the program is unpaused.
                    yield WebApp.clientPrograms[arch].paused;
                    return getBoilerplateAsync(request, arch, response).then(({ stream, statusCode, headers: newHeaders })=>{
                        if (!statusCode) {
                            statusCode = res.statusCode ? res.statusCode : 200;
                        }
                        if (newHeaders) {
                            Object.assign(headers, newHeaders);
                        }
                        res.writeHead(statusCode, headers);
                        if (!disableBoilerplateResponse) {
                            stream.pipe(res, {
                                // End the response when the stream ends.
                                end: true
                            });
                        }
                    }).catch((error)=>{
                        Log.error('Error running template: ' + error.stack);
                        res.writeHead(500, headers);
                        res.end();
                    });
                }
            })();
        });
        // Return 404 by default, if no other handlers serve this URL.
        app.use(function(req, res) {
            res.writeHead(404);
            res.end();
        });
        var httpServer = createServer(app);
        var onListeningCallbacks = [];
        // After 5 seconds w/o data on a socket, kill it.  On the other hand, if
        // there's an outstanding request, give it a higher timeout instead (to avoid
        // killing long-polling requests)
        httpServer.setTimeout(SHORT_SOCKET_TIMEOUT);
        // Do this here, and then also in livedata/stream_server.js, because
        // stream_server.js kills all the current request handlers when installing its
        // own.
        httpServer.on('request', WebApp._timeoutAdjustmentRequestCallback);
        // If the client gave us a bad request, tell it instead of just closing the
        // socket. This lets load balancers in front of us differentiate between "a
        // server is randomly closing sockets for no reason" and "client sent a bad
        // request".
        //
        // This will only work on Node 6; Node 4 destroys the socket before calling
        // this event. See https://github.com/nodejs/node/pull/4557/ for details.
        httpServer.on('clientError', (err, socket)=>{
            // Pre-Node-6, do nothing.
            if (socket.destroyed) {
                return;
            }
            if (err.message === 'Parse Error') {
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            } else {
                // For other errors, use the default behavior as if we had no clientError
                // handler.
                socket.destroy(err);
            }
        });
        const suppressErrors = function() {
            suppressExpressErrors = true;
        };
        let warnedAboutConnectUsage = false;
        // start up app
        Object.assign(WebApp, {
            connectHandlers: packageAndAppHandlers,
            handlers: packageAndAppHandlers,
            rawConnectHandlers: rawExpressHandlers,
            rawHandlers: rawExpressHandlers,
            httpServer: httpServer,
            expressApp: app,
            // For testing.
            suppressConnectErrors: ()=>{
                if (!warnedAboutConnectUsage) {
                    Meteor._debug("WebApp.suppressConnectErrors has been renamed to Meteor._suppressExpressErrors and it should be used only in tests.");
                    warnedAboutConnectUsage = true;
                }
                suppressErrors();
            },
            _suppressExpressErrors: suppressErrors,
            onListening: function(f) {
                if (onListeningCallbacks) onListeningCallbacks.push(f);
                else f();
            },
            // This can be overridden by users who want to modify how listening works
            // (eg, to run a proxy like Apollo Engine Proxy in front of the server).
            startListening: function(httpServer, listenOptions, cb) {
                httpServer.listen(listenOptions, cb);
            }
        });
        /**
   * @name main
   * @locus Server
   * @summary Starts the HTTP server.
   *  If `UNIX_SOCKET_PATH` is present Meteor's HTTP server will use that socket file for inter-process communication, instead of TCP.
   * If you choose to not include webapp package in your application this method still must be defined for your Meteor application to work.
   */ // Let the rest of the packages (and Meteor.startup hooks) insert Express
        // middlewares and update __meteor_runtime_config__, then keep going to set up
        // actually serving HTML.
        exports.main = (argv)=>_async_to_generator(function*() {
                yield WebAppInternals.generateBoilerplate();
                const startHttpServer = (listenOptions)=>{
                    WebApp.startListening((argv === null || argv === void 0 ? void 0 : argv.httpServer) || httpServer, listenOptions, Meteor.bindEnvironment(()=>{
                        if (process.env.METEOR_PRINT_ON_LISTEN) {
                            console.log('LISTENING');
                        }
                        const callbacks = onListeningCallbacks;
                        onListeningCallbacks = null;
                        callbacks === null || callbacks === void 0 ? void 0 : callbacks.forEach((callback)=>{
                            callback();
                        });
                    }, (e)=>{
                        console.error('Error listening:', e);
                        console.error(e && e.stack);
                    }));
                };
                let localPort = process.env.PORT || 0;
                let unixSocketPath = process.env.UNIX_SOCKET_PATH;
                if (unixSocketPath) {
                    if (cluster.isWorker) {
                        const workerName = cluster.worker.process.env.name || cluster.worker.id;
                        unixSocketPath += '.' + workerName + '.sock';
                    }
                    // Start the HTTP server using a socket file.
                    removeExistingSocketFile(unixSocketPath);
                    startHttpServer({
                        path: unixSocketPath
                    });
                    const unixSocketPermissions = (process.env.UNIX_SOCKET_PERMISSIONS || '').trim();
                    if (unixSocketPermissions) {
                        if (/^[0-7]{3}$/.test(unixSocketPermissions)) {
                            chmodSync(unixSocketPath, parseInt(unixSocketPermissions, 8));
                        } else {
                            throw new Error('Invalid UNIX_SOCKET_PERMISSIONS specified');
                        }
                    }
                    const unixSocketGroup = (process.env.UNIX_SOCKET_GROUP || '').trim();
                    if (unixSocketGroup) {
                        const unixSocketGroupInfo = getGroupInfo(unixSocketGroup);
                        if (unixSocketGroupInfo === null) {
                            throw new Error('Invalid UNIX_SOCKET_GROUP name specified');
                        }
                        chownSync(unixSocketPath, userInfo().uid, unixSocketGroupInfo.gid);
                    }
                    registerSocketFileCleanup(unixSocketPath);
                } else {
                    localPort = isNaN(Number(localPort)) ? localPort : Number(localPort);
                    if (/\\\\?.+\\pipe\\?.+/.test(localPort)) {
                        // Start the HTTP server using Windows Server style named pipe.
                        startHttpServer({
                            path: localPort
                        });
                    } else if (typeof localPort === 'number') {
                        // Start the HTTP server using TCP.
                        startHttpServer({
                            port: localPort,
                            host: process.env.BIND_IP || '0.0.0.0'
                        });
                    } else {
                        throw new Error('Invalid PORT specified');
                    }
                }
                return 'DAEMON';
            })();
    })();
}
const isGetentAvailable = ()=>{
    try {
        execSync('which getent');
        return true;
    } catch (e) {
        return false;
    }
};
const getGroupInfoUsingGetent = (groupName)=>{
    try {
        const stdout = execSync(`getent group ${groupName}`, {
            encoding: 'utf8'
        });
        if (!stdout) return null;
        const [name, , gid] = stdout.trim().split(':');
        if (name == null || gid == null) return null;
        return {
            name,
            gid: Number(gid)
        };
    } catch (error) {
        return null;
    }
};
const getGroupInfoFromFile = (groupName)=>{
    try {
        const data = readFileSync('/etc/group', 'utf8');
        const groupLine = data.trim().split('\n').find((line)=>line.startsWith(`${groupName}:`));
        if (!groupLine) return null;
        const [name, , gid] = groupLine.trim().split(':');
        if (name == null || gid == null) return null;
        return {
            name,
            gid: Number(gid)
        };
    } catch (error) {
        return null;
    }
};
const getGroupInfo = (groupName)=>{
    let groupInfo = getGroupInfoFromFile(groupName);
    if (!groupInfo && isGetentAvailable()) {
        groupInfo = getGroupInfoUsingGetent(groupName);
    }
    return groupInfo;
};
var inlineScriptsAllowed = true;
WebAppInternals.inlineScriptsAllowed = function() {
    return inlineScriptsAllowed;
};
WebAppInternals.setInlineScriptsAllowed = function(value) {
    return _async_to_generator(function*() {
        inlineScriptsAllowed = value;
        yield WebAppInternals.generateBoilerplate();
    })();
};
var sriMode;
WebAppInternals.enableSubresourceIntegrity = function(use_credentials = false) {
    return _async_to_generator(function*() {
        sriMode = use_credentials ? 'use-credentials' : 'anonymous';
        yield WebAppInternals.generateBoilerplate();
    })();
};
WebAppInternals.setBundledJsCssUrlRewriteHook = function(hookFn) {
    return _async_to_generator(function*() {
        bundledJsCssUrlRewriteHook = hookFn;
        yield WebAppInternals.generateBoilerplate();
    })();
};
WebAppInternals.setBundledJsCssPrefix = function(prefix) {
    return _async_to_generator(function*() {
        var self = this;
        yield self.setBundledJsCssUrlRewriteHook(function(url) {
            return prefix + url;
        });
    }).call(this);
};
// Packages can call `WebAppInternals.addStaticJs` to specify static
// JavaScript to be included in the app. This static JS will be inlined,
// unless inline scripts have been disabled, in which case it will be
// served under `/<sha1 of contents>`.
var additionalStaticJs = {};
WebAppInternals.addStaticJs = function(contents) {
    additionalStaticJs['/' + sha1(contents) + '.js'] = contents;
};
var disableBoilerplateResponse = false;
WebAppInternals.disableBoilerplateResponse = function() {
    disableBoilerplateResponse = true;
};
// Exported for tests
WebAppInternals.getBoilerplate = getBoilerplate;
WebAppInternals.additionalStaticJs = additionalStaticJs;
await runWebAppServer();
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: true });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"socket_file.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/webapp/socket_file.js                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({removeExistingSocketFile:()=>removeExistingSocketFile,registerSocketFileCleanup:()=>registerSocketFileCleanup},true);let statSync,unlinkSync,existsSync;module.link('fs',{statSync(v){statSync=v},unlinkSync(v){unlinkSync=v},existsSync(v){existsSync=v}},0);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
// Since a new socket file will be created when the HTTP server
// starts up, if found remove the existing file.
//
// WARNING:
// This will remove the configured socket file without warning. If
// the configured socket file is already in use by another application,
// it will still be removed. Node does not provide a reliable way to
// differentiate between a socket file that is already in use by
// another application or a stale socket file that has been
// left over after a SIGKILL. Since we have no reliable way to
// differentiate between these two scenarios, the best course of
// action during startup is to remove any existing socket file. This
// is not the safest course of action as removing the existing socket
// file could impact an application using it, but this approach helps
// ensure the HTTP server can startup without manual
// intervention (e.g. asking for the verification and cleanup of socket
// files before allowing the HTTP server to be started).
//
// The above being said, as long as the socket file path is
// configured carefully when the application is deployed (and extra
// care is taken to make sure the configured path is unique and doesn't
// conflict with another socket file path), then there should not be
// any issues with this approach.
const removeExistingSocketFile = (socketPath)=>{
    try {
        if (statSync(socketPath).isSocket()) {
            // Since a new socket file will be created, remove the existing
            // file.
            unlinkSync(socketPath);
        } else {
            throw new Error(`An existing file was found at "${socketPath}" and it is not ` + 'a socket file. Please confirm PORT is pointing to valid and ' + 'un-used socket file path.');
        }
    } catch (error) {
        // If there is no existing socket file to cleanup, great, we'll
        // continue normally. If the caught exception represents any other
        // issue, re-throw.
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
};
// Remove the socket file when done to avoid leaving behind a stale one.
// Note - a stale socket file is still left behind if the running node
// process is killed via signal 9 - SIGKILL.
const registerSocketFileCleanup = (socketPath, eventEmitter = process)=>{
    [
        'exit',
        'SIGINT',
        'SIGHUP',
        'SIGTERM'
    ].forEach((signal)=>{
        eventEmitter.on(signal, Meteor.bindEnvironment(()=>{
            if (existsSync(socketPath)) {
                unlinkSync(socketPath);
            }
        }));
    });
};
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"express":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/express/package.json                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "express",
  "version": "5.1.0"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/express/index.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"compression":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/compression/package.json                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "compression",
  "version": "1.7.4"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/compression/index.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"cookie-parser":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/cookie-parser/package.json                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "cookie-parser",
  "version": "1.4.6"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/cookie-parser/index.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"qs":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/qs/package.json                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "qs",
  "version": "6.13.0",
  "main": "lib/index.js"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/qs/lib/index.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"parseurl":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/parseurl/package.json                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "parseurl",
  "version": "1.3.3"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/parseurl/index.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"useragent-ng":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/useragent-ng/package.json                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "useragent-ng",
  "version": "2.4.4",
  "main": "./index.js"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/useragent-ng/index.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"send":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/send/package.json                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "send",
  "version": "1.1.0"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/webapp/node_modules/send/index.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});


/* Exports */
return {
  export: function () { return {
      WebApp: WebApp,
      WebAppInternals: WebAppInternals,
      main: main
    };},
  require: require,
  eagerModulePaths: [
    "/node_modules/meteor/webapp/webapp_server.js"
  ],
  mainModulePath: "/node_modules/meteor/webapp/webapp_server.js"
}});

//# sourceURL=meteor://💻app/packages/webapp.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvd2ViYXBwL3dlYmFwcF9zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3dlYmFwcC9zb2NrZXRfZmlsZS5qcyJdLCJuYW1lcyI6WyJTSE9SVF9TT0NLRVRfVElNRU9VVCIsIkxPTkdfU09DS0VUX1RJTUVPVVQiLCJjcmVhdGVFeHByZXNzQXBwIiwiYXBwIiwiZXhwcmVzcyIsInNldCIsInFzIiwicGFyc2UiLCJXZWJBcHAiLCJXZWJBcHBJbnRlcm5hbHMiLCJoYXNPd24iLCJPYmplY3QiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsIk5wbU1vZHVsZXMiLCJ2ZXJzaW9uIiwiTnBtIiwicmVxdWlyZSIsIm1vZHVsZSIsImRlZmF1bHRBcmNoIiwiY2xpZW50UHJvZ3JhbXMiLCJhcmNoUGF0aCIsImJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rIiwidXJsIiwiYnVuZGxlZFByZWZpeCIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJST09UX1VSTF9QQVRIX1BSRUZJWCIsInNoYTEiLCJjb250ZW50cyIsImhhc2giLCJjcmVhdGVIYXNoIiwidXBkYXRlIiwiZGlnZXN0Iiwic2hvdWxkQ29tcHJlc3MiLCJyZXEiLCJyZXMiLCJoZWFkZXJzIiwiY29tcHJlc3MiLCJmaWx0ZXIiLCJjYW1lbENhc2UiLCJuYW1lIiwicGFydHMiLCJzcGxpdCIsInRvTG93ZXJDYXNlIiwiaSIsImxlbmd0aCIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwic3Vic3RyaW5nIiwiam9pbiIsImlkZW50aWZ5QnJvd3NlciIsInVzZXJBZ2VudFN0cmluZyIsIm1ham9yIiwibWlub3IiLCJwYXRjaCIsInVzZXJBZ2VudCIsImxvb2t1cFVzZXJBZ2VudCIsImZhbWlseSIsImNhdGVnb3JpemVSZXF1ZXN0IiwiYnJvd3NlciIsImFyY2giLCJtb2Rlcm4iLCJpc01vZGVybiIsInBhdGgiLCJwYXRobmFtZSIsInBhcnNlUmVxdWVzdCIsImNhdGVnb3JpemVkIiwicGFyc2VVcmwiLCJkeW5hbWljSGVhZCIsImR5bmFtaWNCb2R5IiwiY29va2llcyIsInBhdGhQYXJ0cyIsImFyY2hLZXkiLCJzdGFydHNXaXRoIiwiYXJjaENsZWFuZWQiLCJzbGljZSIsImNhbGwiLCJzcGxpY2UiLCJhc3NpZ24iLCJwcmVmZXJyZWRBcmNoT3JkZXIiLCJodG1sQXR0cmlidXRlSG9va3MiLCJnZXRIdG1sQXR0cmlidXRlcyIsInJlcXVlc3QiLCJjb21iaW5lZEF0dHJpYnV0ZXMiLCJmb3JFYWNoIiwiaG9vayIsImF0dHJpYnV0ZXMiLCJFcnJvciIsImFkZEh0bWxBdHRyaWJ1dGVIb29rIiwicHVzaCIsImFwcFVybCIsIlJvdXRlUG9saWN5IiwiY2xhc3NpZnkiLCJNZXRlb3IiLCJzdGFydHVwIiwiZ2V0dGVyIiwia2V5IiwicHJvZ3JhbSIsInZhbHVlIiwiY2FsY3VsYXRlQ2xpZW50SGFzaCIsImNsaWVudEhhc2giLCJjYWxjdWxhdGVDbGllbnRIYXNoUmVmcmVzaGFibGUiLCJjYWxjdWxhdGVDbGllbnRIYXNoTm9uUmVmcmVzaGFibGUiLCJjYWxjdWxhdGVDbGllbnRIYXNoUmVwbGFjZWFibGUiLCJnZXRSZWZyZXNoYWJsZUFzc2V0cyIsIl90aW1lb3V0QWRqdXN0bWVudFJlcXVlc3RDYWxsYmFjayIsInNldFRpbWVvdXQiLCJmaW5pc2hMaXN0ZW5lcnMiLCJsaXN0ZW5lcnMiLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJvbiIsInZhbHVlcyIsImwiLCJib2lsZXJwbGF0ZUJ5QXJjaCIsImJvaWxlcnBsYXRlRGF0YUNhbGxiYWNrcyIsImNyZWF0ZSIsInJlZ2lzdGVyQm9pbGVycGxhdGVEYXRhQ2FsbGJhY2siLCJjYWxsYmFjayIsInByZXZpb3VzQ2FsbGJhY2siLCJhc3NlcnQiLCJzdHJpY3RFcXVhbCIsImdldEJvaWxlcnBsYXRlIiwiZ2V0Qm9pbGVycGxhdGVBc3luYyIsImVuY29kZVJ1bnRpbWVDb25maWciLCJydGltZUNvbmZpZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJkZWNvZGVSdW50aW1lQ29uZmlnIiwicnRpbWVDb25maWdTdHIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJydW50aW1lQ29uZmlnIiwiaG9va3MiLCJIb29rIiwidXBkYXRlSG9va3MiLCJpc1VwZGF0ZWRCeUFyY2giLCJhZGRSdW50aW1lQ29uZmlnSG9vayIsInJlZ2lzdGVyIiwicmVzcG9uc2UiLCJib2lsZXJwbGF0ZSIsImZvckVhY2hBc3luYyIsIm1ldGVvclJ1bnRpbWVDb25maWciLCJlbmNvZGVkQ3VycmVudENvbmZpZyIsImJhc2VEYXRhIiwidXBkYXRlZCIsImRhdGEiLCJodG1sQXR0cmlidXRlcyIsIm1hZGVDaGFuZ2VzIiwicHJvbWlzZSIsIlByb21pc2UiLCJyZXNvbHZlIiwia2V5cyIsInRoZW4iLCJyZXN1bHQiLCJzdHJlYW0iLCJ0b0hUTUxTdHJlYW0iLCJzdGF0dXNDb2RlIiwiYWRkVXBkYXRlZE5vdGlmeUhvb2siLCJoYW5kbGVyIiwiZ2VuZXJhdGVCb2lsZXJwbGF0ZUluc3RhbmNlIiwibWFuaWZlc3QiLCJhZGRpdGlvbmFsT3B0aW9ucyIsInJ1bnRpbWVDb25maWdPdmVycmlkZXMiLCJjYiIsIkJvaWxlcnBsYXRlIiwicGF0aE1hcHBlciIsIml0ZW1QYXRoIiwicGF0aEpvaW4iLCJiYXNlRGF0YUV4dGVuc2lvbiIsImFkZGl0aW9uYWxTdGF0aWNKcyIsImVudHJpZXMiLCJtYXAiLCJtZXRlb3JSdW50aW1lSGFzaCIsInJvb3RVcmxQYXRoUHJlZml4Iiwic3JpTW9kZSIsImlubGluZVNjcmlwdHNBbGxvd2VkIiwiaW5saW5lIiwic3RhdGljRmlsZXNNaWRkbGV3YXJlIiwic3RhdGljRmlsZXNCeUFyY2giLCJuZXh0IiwiZSIsInNlcnZlU3RhdGljSnMiLCJzIiwibWV0aG9kIiwic2V0dGluZ3MiLCJwYWNrYWdlcyIsIndlYmFwcCIsImFsd2F5c1JldHVybkNvbnRlbnQiLCJ3cml0ZUhlYWQiLCJCdWZmZXIiLCJieXRlTGVuZ3RoIiwid3JpdGUiLCJlbmQiLCJzdGF0dXMiLCJBbGxvdyIsInBhdXNlZCIsImluZm8iLCJnZXRTdGF0aWNGaWxlSW5mbyIsIm1heEFnZSIsImNhY2hlYWJsZSIsImluY2x1ZGVWYXJ5VXNlckFnZW50IiwiaW5jbHVkZXMiLCJzZXRIZWFkZXIiLCJzb3VyY2VNYXBVcmwiLCJ0eXBlIiwiY29udGVudCIsInNlbmQiLCJhYnNvbHV0ZVBhdGgiLCJtYXhhZ2UiLCJkb3RmaWxlcyIsImxhc3RNb2RpZmllZCIsImVyciIsIkxvZyIsImVycm9yIiwicGlwZSIsIm9yaWdpbmFsUGF0aCIsInN0YXRpY0FyY2hMaXN0IiwiYXJjaEluZGV4IiwiaW5kZXhPZiIsInVuc2hpZnQiLCJzb21lIiwic3RhdGljRmlsZXMiLCJmaW5hbGl6ZSIsInBhcnNlUG9ydCIsInBvcnQiLCJwYXJzZWRQb3J0IiwicGFyc2VJbnQiLCJOdW1iZXIiLCJpc05hTiIsIm9uTWVzc2FnZSIsInBhdXNlQ2xpZW50IiwiZ2VuZXJhdGVDbGllbnRQcm9ncmFtIiwicnVuV2ViQXBwU2VydmVyIiwic2h1dHRpbmdEb3duIiwic3luY1F1ZXVlIiwiX0FzeW5jaHJvbm91c1F1ZXVlIiwiZ2V0SXRlbVBhdGhuYW1lIiwiaXRlbVVybCIsInJlbG9hZENsaWVudFByb2dyYW1zIiwicnVuVGFzayIsImNvbmZpZ0pzb24iLCJfX21ldGVvcl9ib290c3RyYXBfXyIsImNsaWVudEFyY2hzIiwiY2xpZW50UGF0aHMiLCJzdGFjayIsInByb2Nlc3MiLCJleGl0IiwidW5wYXVzZSIsImNsaWVudERpciIsInBhdGhEaXJuYW1lIiwic2VydmVyRGlyIiwicHJvZ3JhbUpzb25QYXRoIiwicHJvZ3JhbUpzb24iLCJyZWFkRmlsZVN5bmMiLCJjb2RlIiwiZm9ybWF0IiwiaXRlbSIsIndoZXJlIiwic291cmNlTWFwIiwiUFVCTElDX1NFVFRJTkdTIiwiY29uZmlnT3ZlcnJpZGVzIiwib2xkUHJvZ3JhbSIsIm5ld1Byb2dyYW0iLCJXZWJBcHBIYXNoaW5nIiwidmVyc2lvblJlZnJlc2hhYmxlIiwidmVyc2lvbk5vblJlZnJlc2hhYmxlIiwicmVwbGFjZWFibGUiLCJ2ZXJzaW9uUmVwbGFjZWFibGUiLCJfdHlwZSIsImNvcmRvdmFDb21wYXRpYmlsaXR5VmVyc2lvbnMiLCJobXJWZXJzaW9uIiwibWFuaWZlc3RVcmxQcmVmaXgiLCJyZXBsYWNlIiwibWFuaWZlc3RVcmwiLCJQYWNrYWdlIiwiYXV0b3VwZGF0ZSIsIkFVVE9VUERBVEVfVkVSU0lPTiIsIkF1dG91cGRhdGUiLCJhdXRvdXBkYXRlVmVyc2lvbiIsImVudiIsImdlbmVyYXRlQm9pbGVycGxhdGVGb3JBcmNoIiwiZGVmYXVsdE9wdGlvbnNGb3JBcmNoIiwiRERQX0RFRkFVTFRfQ09OTkVDVElPTl9VUkwiLCJNT0JJTEVfRERQX1VSTCIsImFic29sdXRlVXJsIiwiUk9PVF9VUkwiLCJNT0JJTEVfUk9PVF9VUkwiLCJnZW5lcmF0ZUJvaWxlcnBsYXRlIiwicmVmcmVzaGFibGVBc3NldHMiLCJjc3MiLCJmaWxlIiwicmF3RXhwcmVzc0hhbmRsZXJzIiwidXNlIiwiY29va2llUGFyc2VyIiwiaXNWYWxpZFVybCIsImdldFBhdGhQYXJ0cyIsInNoaWZ0IiwiaXNQcmVmaXhPZiIsInByZWZpeCIsImFycmF5IiwiZXZlcnkiLCJwYXJ0IiwicGF0aFByZWZpeCIsInNlYXJjaCIsInByZWZpeFBhcnRzIiwibWV0ZW9ySW50ZXJuYWxIYW5kbGVycyIsInBhY2thZ2VBbmRBcHBIYW5kbGVycyIsInN1cHByZXNzRXhwcmVzc0Vycm9ycyIsInF1ZXJ5IiwiaXNEZXZlbG9wbWVudCIsIm5ld0hlYWRlcnMiLCJkaXNhYmxlQm9pbGVycGxhdGVSZXNwb25zZSIsImNhdGNoIiwiaHR0cFNlcnZlciIsImNyZWF0ZVNlcnZlciIsIm9uTGlzdGVuaW5nQ2FsbGJhY2tzIiwic29ja2V0IiwiZGVzdHJveWVkIiwibWVzc2FnZSIsImRlc3Ryb3kiLCJzdXBwcmVzc0Vycm9ycyIsIndhcm5lZEFib3V0Q29ubmVjdFVzYWdlIiwiY29ubmVjdEhhbmRsZXJzIiwiaGFuZGxlcnMiLCJyYXdDb25uZWN0SGFuZGxlcnMiLCJyYXdIYW5kbGVycyIsImV4cHJlc3NBcHAiLCJzdXBwcmVzc0Nvbm5lY3RFcnJvcnMiLCJfZGVidWciLCJfc3VwcHJlc3NFeHByZXNzRXJyb3JzIiwib25MaXN0ZW5pbmciLCJmIiwic3RhcnRMaXN0ZW5pbmciLCJsaXN0ZW5PcHRpb25zIiwibGlzdGVuIiwiZXhwb3J0cyIsIm1haW4iLCJhcmd2Iiwic3RhcnRIdHRwU2VydmVyIiwiYmluZEVudmlyb25tZW50IiwiTUVURU9SX1BSSU5UX09OX0xJU1RFTiIsImNvbnNvbGUiLCJsb2ciLCJjYWxsYmFja3MiLCJsb2NhbFBvcnQiLCJQT1JUIiwidW5peFNvY2tldFBhdGgiLCJVTklYX1NPQ0tFVF9QQVRIIiwiY2x1c3RlciIsImlzV29ya2VyIiwid29ya2VyTmFtZSIsIndvcmtlciIsImlkIiwicmVtb3ZlRXhpc3RpbmdTb2NrZXRGaWxlIiwidW5peFNvY2tldFBlcm1pc3Npb25zIiwiVU5JWF9TT0NLRVRfUEVSTUlTU0lPTlMiLCJ0cmltIiwidGVzdCIsImNobW9kU3luYyIsInVuaXhTb2NrZXRHcm91cCIsIlVOSVhfU09DS0VUX0dST1VQIiwidW5peFNvY2tldEdyb3VwSW5mbyIsImdldEdyb3VwSW5mbyIsImNob3duU3luYyIsInVzZXJJbmZvIiwidWlkIiwiZ2lkIiwicmVnaXN0ZXJTb2NrZXRGaWxlQ2xlYW51cCIsImhvc3QiLCJCSU5EX0lQIiwiaXNHZXRlbnRBdmFpbGFibGUiLCJleGVjU3luYyIsImdldEdyb3VwSW5mb1VzaW5nR2V0ZW50IiwiZ3JvdXBOYW1lIiwic3Rkb3V0IiwiZW5jb2RpbmciLCJnZXRHcm91cEluZm9Gcm9tRmlsZSIsImdyb3VwTGluZSIsImZpbmQiLCJsaW5lIiwiZ3JvdXBJbmZvIiwic2V0SW5saW5lU2NyaXB0c0FsbG93ZWQiLCJlbmFibGVTdWJyZXNvdXJjZUludGVncml0eSIsInVzZV9jcmVkZW50aWFscyIsInNldEJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rIiwiaG9va0ZuIiwic2V0QnVuZGxlZEpzQ3NzUHJlZml4Iiwic2VsZiIsImFkZFN0YXRpY0pzIiwic3RhdFN5bmMiLCJ1bmxpbmtTeW5jIiwiZXhpc3RzU3luYyIsInNvY2tldFBhdGgiLCJpc1NvY2tldCIsImV2ZW50RW1pdHRlciIsInNpZ25hbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUE0QjtBQUM0QjtBQUNwQjtBQUNOO0FBQ2tDO0FBQ3hCO0FBQ0o7QUFDTjtBQUNLO0FBQ007QUFDckI7QUFDZ0I7QUFDcUI7QUFDUDtBQUMxQjtBQUlFO0FBQ0k7QUFDVztBQUV6QyxJQUFJQSx1QkFBdUIsSUFBSTtBQUMvQixJQUFJQyxzQkFBc0IsTUFBTTtBQUVoQyxNQUFNQyxtQkFBbUI7SUFDdkIsTUFBTUMsTUFBTUM7SUFDWixrQ0FBa0M7SUFDbEMsMkZBQTJGO0lBQzNGRCxJQUFJRSxHQUFHLENBQUMsZ0JBQWdCO0lBQ3hCRixJQUFJRSxHQUFHLENBQUMsUUFBUTtJQUNoQkYsSUFBSUUsR0FBRyxDQUFDLGdCQUFnQkMsR0FBR0MsS0FBSztJQUNoQyxPQUFPSjtBQUNUO0FBQ0EsT0FBTyxNQUFNSyxLQUFZO0FBQ3pCLE9BQU8sTUFBTUMsY0FBcUI7QUFFbEMsTUFBTUMsU0FBU0MsT0FBT0MsU0FBUyxDQUFDQyxjQUFjO0FBRzlDSixnQkFBZ0JLLFVBQVUsR0FBRztJQUMzQlYsU0FBVTtRQUNSVyxTQUFTQyxJQUFJQyxPQUFPLENBQUMsd0JBQXdCRixPQUFPO1FBQ3BERyxRQUFRZDtJQUNWO0FBQ0Y7QUFFQSx5Q0FBeUM7QUFDekNJLE9BQU9KLE9BQU8sR0FBR0E7QUFFakIsb0VBQW9FO0FBQ3BFLCtEQUErRDtBQUMvREksT0FBT1csV0FBVyxHQUFHO0FBRXJCLDhCQUE4QjtBQUM5QlgsT0FBT1ksY0FBYyxHQUFHLENBQUM7QUFFekIsK0NB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Q0FBQztZQUM3QyxJQUFJb0QsV0FBV0MsYUFBYTtnQkFDMUJGLFdBQVdFO1lBQ2I7UUFDRjtJQUNGO0FBQ0YsRUFBRSIsImZpbGUiOiIvcGFja2FnZXMvd2ViYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jLCBjaG1vZFN5bmMsIGNob3duU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGNyZWF0ZVNlcnZlciB9IGZyb20gJ2h0dHAnO1xuaW1wb3J0IHsgdXNlckluZm8gfSBmcm9tICdvcyc7XG5pbXBvcnQgeyBqb2luIGFzIHBhdGhKb2luLCBkaXJuYW1lIGFzIHBhdGhEaXJuYW1lIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBwYXJzZSBhcyBwYXJzZVVybCB9IGZyb20gJ3VybCc7XG5pbXBvcnQgeyBjcmVhdGVIYXNoIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IGNvbXByZXNzIGZyb20gJ2NvbXByZXNzaW9uJztcbmltcG9ydCBjb29raWVQYXJzZXIgZnJvbSAnY29va2llLXBhcnNlcic7XG5pbXBvcnQgcXMgZnJvbSAncXMnO1xuaW1wb3J0IHBhcnNlUmVxdWVzdCBmcm9tICdwYXJzZXVybCc7XG5pbXBvcnQgeyBsb29rdXAgYXMgbG9va3VwVXNlckFnZW50IH0gZnJvbSAndXNlcmFnZW50LW5nJztcbmltcG9ydCB7IGlzTW9kZXJuIH0gZnJvbSAnbWV0ZW9yL21vZGVybi1icm93c2Vycyc7XG5pbXBvcnQgc2VuZCBmcm9tICdzZW5kJztcbmltcG9ydCB7XG4gIHJlbW92ZUV4aXN0aW5nU29ja2V0RmlsZSxcbiAgcmVnaXN0ZXJTb2NrZXRGaWxlQ2xlYW51cCxcbn0gZnJvbSAnLi9zb2NrZXRfZmlsZS5qcyc7XG5pbXBvcnQgY2x1c3RlciBmcm9tICdjbHVzdGVyJztcbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5cbnZhciBTSE9SVF9TT0NLRVRfVElNRU9VVCA9IDUgKiAxMDAwO1xudmFyIExPTkdfU09DS0VUX1RJTUVPVVQgPSAxMjAgKiAxMDAwO1xuXG5jb25zdCBjcmVhdGVFeHByZXNzQXBwID0gKCkgPT4ge1xuICBjb25zdCBhcHAgPSBleHByZXNzKCk7XG4gIC8vIFNlY3VyaXR5IGFuZCBwZXJmb3JtYWNlIGhlYWRlcnNcbiAgLy8gdGhlc2UgaGVhZGVycyBjb21lIGZyb20gdGhlc2UgZG9jczogaHR0cHM6Ly9leHByZXNzanMuY29tL2VuL2FwaS5odG1sI2FwcC5zZXR0aW5ncy50YWJsZVxuICBhcHAuc2V0KCd4LXBvd2VyZWQtYnknLCBmYWxzZSk7XG4gIGFwcC5zZXQoJ2V0YWcnLCBmYWxzZSk7XG4gIGFwcC5zZXQoJ3F1ZXJ5IHBhcnNlcicsIHFzLnBhcnNlKTtcbiAgcmV0dXJuIGFwcDtcbn1cbmV4cG9ydCBjb25zdCBXZWJBcHAgPSB7fTtcbmV4cG9ydCBjb25zdCBXZWJBcHBJbnRlcm5hbHMgPSB7fTtcblxuY29uc3QgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuXG5XZWJBcHBJbnRlcm5hbHMuTnBtTW9kdWxlcyA9IHtcbiAgZXhwcmVzcyA6IHtcbiAgICB2ZXJzaW9uOiBOcG0ucmVxdWlyZSgnZXhwcmVzcy9wYWNrYWdlLmpzb24nKS52ZXJzaW9uLFxuICAgIG1vZHVsZTogZXhwcmVzcyxcbiAgfVxufTtcblxuLy8gTW9yZSBvZiBhIGNvbnZlbmllbmNlIGZvciB0aGUgZW5kIHVzZXJcbldlYkFwcC5leHByZXNzID0gZXhwcmVzcztcblxuLy8gVGhvdWdoIHdlIG1pZ2h0IHByZWZlciB0byB1c2Ugd2ViLmJyb3dzZXIgKG1vZGVybikgYXMgdGhlIGRlZmF1bHRcbi8vIGFyY2hpdGVjdHVyZSwgc2FmZXR5IHJlcXVpcmVzIGEgbW9yZSBjb21wYXRpYmxlIGRlZmF1bHRBcmNoLlxuV2ViQXBwLmRlZmF1bHRBcmNoID0gJ3dlYi5icm93c2VyLmxlZ2FjeSc7XG5cbi8vIFhYWCBtYXBzIGFyY2hzIHRvIG1hbmlmZXN0c1xuV2ViQXBwLmNsaWVudFByb2dyYW1zID0ge307XG5cbi8vIFhYWCBtYXBzIGFyY2hzIHRvIHByb2dyYW0gcGF0aCBvbiBmaWxlc3lzdGVtXG52YXIgYXJjaFBhdGggPSB7fTtcblxudmFyIGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rID0gZnVuY3Rpb24odXJsKSB7XG4gIHZhciBidW5kbGVkUHJlZml4ID0gX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWCB8fCAnJztcbiAgcmV0dXJuIGJ1bmRsZWRQcmVmaXggKyB1cmw7XG59O1xuXG52YXIgc2hhMSA9IGZ1bmN0aW9uKGNvbnRlbnRzKSB7XG4gIHZhciBoYXNoID0gY3JlYXRlSGFzaCgnc2hhMScpO1xuICBoYXNoLnVwZGF0ZShjb250ZW50cyk7XG4gIHJldHVybiBoYXNoLmRpZ2VzdCgnaGV4Jyk7XG59O1xuXG5mdW5jdGlvbiBzaG91bGRDb21wcmVzcyhyZXEsIHJlcykge1xuICBpZiAocmVxLmhlYWRlcnNbJ3gtbm8tY29tcHJlc3Npb24nXSkge1xuICAgIC8vIGRvbid0IGNvbXByZXNzIHJlc3BvbnNlcyB3aXRoIHRoaXMgcmVxdWVzdCBoZWFkZXJcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBmYWxsYmFjayB0byBzdGFuZGFyZCBmaWx0ZXIgZnVuY3Rpb25cbiAgcmV0dXJuIGNvbXByZXNzLmZpbHRlcihyZXEsIHJlcyk7XG59XG5cbi8vICNCcm93c2VySWRlbnRpZmljYXRpb25cbi8vXG4vLyBXZSBoYXZlIG11bHRpcGxlIHBsYWNlcyB0aGF0IHdhbnQgdG8gaWRlbnRpZnkgdGhlIGJyb3dzZXI6IHRoZVxuLy8gdW5zdXBwb3J0ZWQgYnJvd3NlciBwYWdlLCB0aGUgYXBwY2FjaGUgcGFja2FnZSwgYW5kLCBldmVudHVhbGx5XG4vLyBkZWxpdmVyaW5nIGJyb3dzZXIgcG9seWZpbGxzIG9ubHkgYXMgbmVlZGVkLlxuLy9cbi8vIFRvIGF2b2lkIGRldGVjdGluZyB0aGUgYnJvd3NlciBpbiBtdWx0aXBsZSBwbGFjZXMgYWQtaG9jLCB3ZSBjcmVhdGUgYVxuLy8gTWV0ZW9yIFwiYnJvd3NlclwiIG9iamVjdC4gSXQgdXNlcyBidXQgZG9lcyBub3QgZXhwb3NlIHRoZSBucG1cbi8vIHVzZXJhZ2VudCBtb2R1bGUgKHdlIGNvdWxkIGNob29zZSBhIGRpZmZlcmVudCBtZWNoYW5pc20gdG8gaWRlbnRpZnlcbi8vIHRoZSBicm93c2VyIGluIHRoZSBmdXR1cmUgaWYgd2Ugd2FudGVkIHRvKS4gIFRoZSBicm93c2VyIG9iamVjdFxuLy8gY29udGFpbnNcbi8vXG4vLyAqIGBuYW1lYDogdGhlIG5hbWUgb2YgdGhlIGJyb3dzZXIgaW4gY2FtZWwgY2FzZVxuLy8gKiBgbWFqb3JgLCBgbWlub3JgLCBgcGF0Y2hgOiBpbnRlZ2VycyBkZXNjcmliaW5nIHRoZSBicm93c2VyIHZlcnNpb25cbi8vXG4vLyBBbHNvIGhlcmUgaXMgYW4gZWFybHkgdmVyc2lvbiBvZiBhIE1ldGVvciBgcmVxdWVzdGAgb2JqZWN0LCBpbnRlbmRlZFxuLy8gdG8gYmUgYSBoaWdoLWxldmVsIGRlc2NyaXB0aW9uIG9mIHRoZSByZXF1ZXN0IHdpdGhvdXQgZXhwb3Npbmdcbi8vIGRldGFpbHMgb2YgRXhwcmVzcydzIGxvdy1sZXZlbCBgcmVxYC4gIEN1cnJlbnRseSBpdCBjb250YWluczpcbi8vXG4vLyAqIGBicm93c2VyYDogYnJvd3NlciBpZGVudGlmaWNhdGlvbiBvYmplY3QgZGVzY3JpYmVkIGFib3ZlXG4vLyAqIGB1cmxgOiBwYXJzZWQgdXJsLCBpbmNsdWRpbmcgcGFyc2VkIHF1ZXJ5IHBhcmFtc1xuLy9cbi8vIEFzIGEgdGVtcG9yYXJ5IGhhY2sgdGhlcmUgaXMgYSBgY2F0ZWdvcml6ZVJlcXVlc3RgIGZ1bmN0aW9uIG9uIFdlYkFwcCB3aGljaFxuLy8gY29udmVydHMgYSBFeHByZXNzIGByZXFgIHRvIGEgTWV0ZW9yIGByZXF1ZXN0YC4gVGhpcyBjYW4gZ28gYXdheSBvbmNlIHNtYXJ0XG4vLyBwYWNrYWdlcyBzdWNoIGFzIGFwcGNhY2hlIGFyZSBiZWluZyBwYXNzZWQgYSBgcmVxdWVzdGAgb2JqZWN0IGRpcmVjdGx5IHdoZW5cbi8vIHRoZXkgc2VydmUgY29udGVudC5cbi8vXG4vLyBUaGlzIGFsbG93cyBgcmVxdWVzdGAgdG8gYmUgdXNlZCB1bmlmb3JtbHk6IGl0IGlzIHBhc3NlZCB0byB0aGUgaHRtbFxuLy8gYXR0cmlidXRlcyBob29rLCBhbmQgdGhlIGFwcGNhY2hlIHBhY2thZ2UgY2FuIHVzZSBpdCB3aGVuIGRlY2lkaW5nXG4vLyB3aGV0aGVyIHRvIGdlbmVyYXRlIGEgNDA0IGZvciB0aGUgbWFuaWZlc3QuXG4vL1xuLy8gUmVhbCByb3V0aW5nIC8gc2VydmVyIHNpZGUgcmVuZGVyaW5nIHdpbGwgcHJvYmFibHkgcmVmYWN0b3IgdGhpc1xuLy8gaGVhdmlseS5cblxuLy8gZS5nLiBcIk1vYmlsZSBTYWZhcmlcIiA9PiBcIm1vYmlsZVNhZmFyaVwiXG52YXIgY2FtZWxDYXNlID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgcGFydHMgPSBuYW1lLnNwbGl0KCcgJyk7XG4gIHBhcnRzWzBdID0gcGFydHNbMF0udG9Mb3dlckNhc2UoKTtcbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBwYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgIHBhcnRzW2ldID0gcGFydHNbaV0uY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwYXJ0c1tpXS5zdWJzdHJpbmcoMSk7XG4gIH1cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpO1xufTtcblxudmFyIGlkZW50aWZ5QnJvd3NlciA9IGZ1bmN0aW9uKHVzZXJBZ2VudFN0cmluZykge1xuICBpZiAoIXVzZXJBZ2VudFN0cmluZykge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiAndW5rbm93bicsXG4gICAgICBtYWpvcjogMCxcbiAgICAgIG1pbm9yOiAwLFxuICAgICAgcGF0Y2g6IDBcbiAgICB9O1xuICB9XG4gIHZhciB1c2VyQWdlbnQgPSBsb29rdXBVc2VyQWdlbnQodXNlckFnZW50U3RyaW5nKTtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBjYW1lbENhc2UodXNlckFnZW50LmZhbWlseSksXG4gICAgbWFqb3I6ICt1c2VyQWdlbnQubWFqb3IsXG4gICAgbWlub3I6ICt1c2VyQWdlbnQubWlub3IsXG4gICAgcGF0Y2g6ICt1c2VyQWdlbnQucGF0Y2gsXG4gIH07XG59O1xuXG4vLyBYWFggUmVmYWN0b3IgYXMgcGFydCBvZiBpbXBsZW1lbnRpbmcgcmVhbCByb3V0aW5nLlxuV2ViQXBwSW50ZXJuYWxzLmlkZW50aWZ5QnJvd3NlciA9IGlkZW50aWZ5QnJvd3NlcjtcblxuV2ViQXBwLmNhdGVnb3JpemVSZXF1ZXN0ID0gZnVuY3Rpb24ocmVxKSB7XG4gIGlmIChyZXEuYnJvd3NlciAmJiByZXEuYXJjaCAmJiB0eXBlb2YgcmVxLm1vZGVybiA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgLy8gQWxyZWFkeSBjYXRlZ29yaXplZC5cbiAgICByZXR1cm4gcmVxO1xuICB9XG5cbiAgY29uc3QgYnJvd3NlciA9IGlkZW50aWZ5QnJvd3NlcihyZXEuaGVhZGVyc1sndXNlci1hZ2VudCddKTtcbiAgY29uc3QgbW9kZXJuID0gaXNNb2Rlcm4oYnJvd3Nlcik7XG4gIGNvbnN0IHBhdGggPVxuICAgIHR5cGVvZiByZXEucGF0aG5hbWUgPT09ICdzdHJpbmcnXG4gICAgICA/IHJlcS5wYXRobmFtZVxuICAgICAgOiBwYXJzZVJlcXVlc3QocmVxKS5wYXRobmFtZTtcblxuICBjb25zdCBjYXRlZ29yaXplZCA9IHtcbiAgICBicm93c2VyLFxuICAgIG1vZGVybixcbiAgICBwYXRoLFxuICAgIGFyY2g6IFdlYkFwcC5kZWZhdWx0QXJjaCxcbiAgICB1cmw6IHBhcnNlVXJsKHJlcS51cmwsIHRydWUpLFxuICAgIGR5bmFtaWNIZWFkOiByZXEuZHluYW1pY0hlYWQsXG4gICAgZHluYW1pY0JvZHk6IHJlcS5keW5hbWljQm9keSxcbiAgICBoZWFkZXJzOiByZXEuaGVhZGVycyxcbiAgICBjb29raWVzOiByZXEuY29va2llcyxcbiAgfTtcblxuICBjb25zdCBwYXRoUGFydHMgPSBwYXRoLnNwbGl0KCcvJyk7XG4gIGNvbnN0IGFyY2hLZXkgPSBwYXRoUGFydHNbMV07XG5cbiAgaWYgKGFyY2hLZXkuc3RhcnRzV2l0aCgnX18nKSkge1xuICAgIGNvbnN0IGFyY2hDbGVhbmVkID0gJ3dlYi4nICsgYXJjaEtleS5zbGljZSgyKTtcbiAgICBpZiAoaGFzT3duLmNhbGwoV2ViQXBwLmNsaWVudFByb2dyYW1zLCBhcmNoQ2xlYW5lZCkpIHtcbiAgICAgIHBhdGhQYXJ0cy5zcGxpY2UoMSwgMSk7IC8vIFJlbW92ZSB0aGUgYXJjaEtleSBwYXJ0LlxuICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oY2F0ZWdvcml6ZWQsIHtcbiAgICAgICAgYXJjaDogYXJjaENsZWFuZWQsXG4gICAgICAgIHBhdGg6IHBhdGhQYXJ0cy5qb2luKCcvJyksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBUT0RPIFBlcmhhcHMgb25lIGRheSB3ZSBjb3VsZCBpbmZlciBDb3Jkb3ZhIGNsaWVudHMgaGVyZSwgc28gdGhhdCB3ZVxuICAvLyB3b3VsZG4ndCBoYXZlIHRvIHVzZSBwcmVmaXhlZCBcIi9fX2NvcmRvdmEvLi4uXCIgVVJMcy5cbiAgY29uc3QgcHJlZmVycmVkQXJjaE9yZGVyID0gaXNNb2Rlcm4oYnJvd3NlcilcbiAgICA/IFsnd2ViLmJyb3dzZXInLCAnd2ViLmJyb3dzZXIubGVnYWN5J11cbiAgICA6IFsnd2ViLmJyb3dzZXIubGVnYWN5JywgJ3dlYi5icm93c2VyJ107XG5cbiAgZm9yIChjb25zdCBhcmNoIG9mIHByZWZlcnJlZEFyY2hPcmRlcikge1xuICAgIC8vIElmIG91ciBwcmVmZXJyZWQgYXJjaCBpcyBub3QgYXZhaWxhYmxlLCBpdCdzIGJldHRlciB0byB1c2UgYW5vdGhlclxuICAgIC8vIGNsaWVudCBhcmNoIHRoYXQgaXMgYXZhaWxhYmxlIHRoYW4gdG8gZ3VhcmFudGVlIHRoZSBzaXRlIHdvbid0IHdvcmtcbiAgICAvLyBieSByZXR1cm5pbmcgYW4gdW5rbm93biBhcmNoLiBGb3IgZXhhbXBsZSwgaWYgd2ViLmJyb3dzZXIubGVnYWN5IGlzXG4gICAgLy8gZXhjbHVkZWQgdXNpbmcgdGhlIC0tZXhjbHVkZS1hcmNocyBjb21tYW5kLWxpbmUgb3B0aW9uLCBsZWdhY3lcbiAgICAvLyBjbGllbnRzIGFyZSBiZXR0ZXIgb2ZmIHJlY2VpdmluZyB3ZWIuYnJvd3NlciAod2hpY2ggbWlnaHQgYWN0dWFsbHlcbiAgICAvLyB3b3JrKSB0aGFuIHJlY2VpdmluZyBhbiBIVFRQIDQwNCByZXNwb25zZS4gSWYgbm9uZSBvZiB0aGUgYXJjaHMgaW5cbiAgICAvLyBwcmVmZXJyZWRBcmNoT3JkZXIgYXJlIGRlZmluZWQsIG9ubHkgdGhlbiBzaG91bGQgd2Ugc2VuZCBhIDQwNC5cbiAgICBpZiAoaGFzT3duLmNhbGwoV2ViQXBwLmNsaWVudFByb2dyYW1zLCBhcmNoKSkge1xuICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oY2F0ZWdvcml6ZWQsIHsgYXJjaCB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY2F0ZWdvcml6ZWQ7XG59O1xuXG4vLyBIVE1MIGF0dHJpYnV0ZSBob29rczogZnVuY3Rpb25zIHRvIGJlIGNhbGxlZCB0byBkZXRlcm1pbmUgYW55IGF0dHJpYnV0ZXMgdG9cbi8vIGJlIGFkZGVkIHRvIHRoZSAnPGh0bWw+JyB0YWcuIEVhY2ggZnVuY3Rpb24gaXMgcGFzc2VkIGEgJ3JlcXVlc3QnIG9iamVjdCAoc2VlXG4vLyAjQnJvd3NlcklkZW50aWZpY2F0aW9uKSBhbmQgc2hvdWxkIHJldHVybiBudWxsIG9yIG9iamVjdC5cbnZhciBodG1sQXR0cmlidXRlSG9va3MgPSBbXTtcbnZhciBnZXRIdG1sQXR0cmlidXRlcyA9IGZ1bmN0aW9uKHJlcXVlc3QpIHtcbiAgdmFyIGNvbWJpbmVkQXR0cmlidXRlcyA9IHt9O1xuICAoaHRtbEF0dHJpYnV0ZUhvb2tzIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKGhvb2spIHtcbiAgICB2YXIgYXR0cmlidXRlcyA9IGhvb2socmVxdWVzdCk7XG4gICAgaWYgKGF0dHJpYnV0ZXMgPT09IG51bGwpIHJldHVybjtcbiAgICBpZiAodHlwZW9mIGF0dHJpYnV0ZXMgIT09ICdvYmplY3QnKVxuICAgICAgdGhyb3cgRXJyb3IoJ0hUTUwgYXR0cmlidXRlIGhvb2sgbXVzdCByZXR1cm4gbnVsbCBvciBvYmplY3QnKTtcbiAgICBPYmplY3QuYXNzaWduKGNvbWJpbmVkQXR0cmlidXRlcywgYXR0cmlidXRlcyk7XG4gIH0pO1xuICByZXR1cm4gY29tYmluZWRBdHRyaWJ1dGVzO1xufTtcbldlYkFwcC5hZGRIdG1sQXR0cmlidXRlSG9vayA9IGZ1bmN0aW9uKGhvb2spIHtcbiAgaHRtbEF0dHJpYnV0ZUhvb2tzLnB1c2goaG9vayk7XG59O1xuXG4vLyBTZXJ2ZSBhcHAgSFRNTCBmb3IgdGhpcyBVUkw/XG52YXIgYXBwVXJsID0gZnVuY3Rpb24odXJsKSB7XG4gIGlmICh1cmwgPT09ICcvZmF2aWNvbi5pY28nIHx8IHVybCA9PT0gJy9yb2JvdHMudHh0JykgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIE5PVEU6IGFwcC5tYW5pZmVzdCBpcyBub3QgYSB3ZWIgc3RhbmRhcmQgbGlrZSBmYXZpY29uLmljbyBhbmRcbiAgLy8gcm9ib3RzLnR4dC4gSXQgaXMgYSBmaWxlIG5hbWUgd2UgaGF2ZSBjaG9zZW4gdG8gdXNlIGZvciBIVE1MNVxuICAvLyBhcHBjYWNoZSBVUkxzLiBJdCBpcyBpbmNsdWRlZCBoZXJlIHRvIHByZXZlbnQgdXNpbmcgYW4gYXBwY2FjaGVcbiAgLy8gdGhlbiByZW1vdmluZyBpdCBmcm9tIHBvaXNvbmluZyBhbiBhcHAgcGVybWFuZW50bHkuIEV2ZW50dWFsbHksXG4gIC8vIG9uY2Ugd2UgaGF2ZSBzZXJ2ZXIgc2lkZSByb3V0aW5nLCB0aGlzIHdvbid0IGJlIG5lZWRlZCBhc1xuICAvLyB1bmtub3duIFVSTHMgd2l0aCByZXR1cm4gYSA0MDQgYXV0b21hdGljYWxseS5cbiAgaWYgKHVybCA9PT0gJy9hcHAubWFuaWZlc3QnKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gQXZvaWQgc2VydmluZyBhcHAgSFRNTCBmb3IgZGVjbGFyZWQgcm91dGVzIHN1Y2ggYXMgL3NvY2tqcy8uXG4gIGlmIChSb3V0ZVBvbGljeS5jbGFzc2lmeSh1cmwpKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gd2UgY3VycmVudGx5IHJldHVybiBhcHAgSFRNTCBvbiBhbGwgVVJMcyBieSBkZWZhdWx0XG4gIHJldHVybiB0cnVlO1xufTtcblxuLy8gV2UgbmVlZCB0byBjYWxjdWxhdGUgdGhlIGNsaWVudCBoYXNoIGFmdGVyIGFsbCBwYWNrYWdlcyBoYXZlIGxvYWRlZFxuLy8gdG8gZ2l2ZSB0aGVtIGEgY2hhbmNlIHRvIHBvcHVsYXRlIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uXG4vL1xuLy8gQ2FsY3VsYXRpbmcgdGhlIGhhc2ggZHVyaW5nIHN0YXJ0dXAgbWVhbnMgdGhhdCBwYWNrYWdlcyBjYW4gb25seVxuLy8gcG9wdWxhdGUgX19tZXRlb3JfcnVudGltZV9jb25maWdfXyBkdXJpbmcgbG9hZCwgbm90IGR1cmluZyBzdGFydHVwLlxuLy9cbi8vIENhbGN1bGF0aW5nIGluc3RlYWQgaXQgYXQgdGhlIGJlZ2lubmluZyBvZiBtYWluIGFmdGVyIGFsbCBzdGFydHVwXG4vLyBob29rcyBoYWQgcnVuIHdvdWxkIGFsbG93IHBhY2thZ2VzIHRvIGFsc28gcG9wdWxhdGVcbi8vIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18gZHVyaW5nIHN0YXJ0dXAsIGJ1dCB0aGF0J3MgdG9vIGxhdGUgZm9yXG4vLyBhdXRvdXBkYXRlIGJlY2F1c2UgaXQgbmVlZHMgdG8gaGF2ZSB0aGUgY2xpZW50IGhhc2ggYXQgc3RhcnR1cCB0b1xuLy8gaW5zZXJ0IHRoZSBhdXRvIHVwZGF0ZSB2ZXJzaW9uIGl0c2VsZiBpbnRvXG4vLyBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fIHRvIGdldCBpdCB0byB0aGUgY2xpZW50LlxuLy9cbi8vIEFuIGFsdGVybmF0aXZlIHdvdWxkIGJlIHRvIGdpdmUgYXV0b3VwZGF0ZSBhIFwicG9zdC1zdGFydCxcbi8vIHByZS1saXN0ZW5cIiBob29rIHRvIGFsbG93IGl0IHRvIGluc2VydCB0aGUgYXV0byB1cGRhdGUgdmVyc2lvbiBhdFxuLy8gdGhlIHJpZ2h0IG1vbWVudC5cblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIGdldHRlcihrZXkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJjaCkge1xuICAgICAgYXJjaCA9IGFyY2ggfHwgV2ViQXBwLmRlZmF1bHRBcmNoO1xuICAgICAgY29uc3QgcHJvZ3JhbSA9IFdlYkFwcC5jbGllbnRQcm9ncmFtc1thcmNoXTtcbiAgICAgIGNvbnN0IHZhbHVlID0gcHJvZ3JhbSAmJiBwcm9ncmFtW2tleV07XG4gICAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHdlIGhhdmUgY2FsY3VsYXRlZCB0aGlzIGhhc2gsXG4gICAgICAvLyBwcm9ncmFtW2tleV0gd2lsbCBiZSBhIHRodW5rIChsYXp5IGZ1bmN0aW9uIHdpdGggbm8gcGFyYW1ldGVycylcbiAgICAgIC8vIHRoYXQgd2Ugc2hvdWxkIGNhbGwgdG8gZG8gdGhlIGFjdHVhbCBjb21wdXRhdGlvbi5cbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgPyAocHJvZ3JhbVtrZXldID0gdmFsdWUoKSkgOiB2YWx1ZTtcbiAgICB9O1xuICB9XG5cbiAgV2ViQXBwLmNhbGN1bGF0ZUNsaWVudEhhc2ggPSBXZWJBcHAuY2xpZW50SGFzaCA9IGdldHRlcigndmVyc2lvbicpO1xuICBXZWJBcHAuY2FsY3VsYXRlQ2xpZW50SGFzaFJlZnJlc2hhYmxlID0gZ2V0dGVyKCd2ZXJzaW9uUmVmcmVzaGFibGUnKTtcbiAgV2ViQXBwLmNhbGN1bGF0ZUNsaWVudEhhc2hOb25SZWZyZXNoYWJsZSA9IGdldHRlcigndmVyc2lvbk5vblJlZnJlc2hhYmxlJyk7XG4gIFdlYkFwcC5jYWxjdWxhdGVDbGllbnRIYXNoUmVwbGFjZWFibGUgPSBnZXR0ZXIoJ3ZlcnNpb25SZXBsYWNlYWJsZScpO1xuICBXZWJBcHAuZ2V0UmVmcmVzaGFibGVBc3NldHMgPSBnZXR0ZXIoJ3JlZnJlc2hhYmxlQXNzZXRzJyk7XG59KTtcblxuLy8gV2hlbiB3ZSBoYXZlIGEgcmVxdWVzdCBwZW5kaW5nLCB3ZSB3YW50IHRoZSBzb2NrZXQgdGltZW91dCB0byBiZSBsb25nLCB0b1xuLy8gZ2l2ZSBvdXJzZWx2ZXMgYSB3aGlsZSB0byBzZXJ2ZSBpdCwgYW5kIHRvIGFsbG93IHNvY2tqcyBsb25nIHBvbGxzIHRvXG4vLyBjb21wbGV0ZS4gIE9uIHRoZSBvdGhlciBoYW5kLCB3ZSB3YW50IHRvIGNsb3NlIGlkbGUgc29ja2V0cyByZWxhdGl2ZWx5XG4vLyBxdWlja2x5LCBzbyB0aGF0IHdlIGNhbiBzaHV0IGRvd24gcmVsYXRpdmVseSBwcm9tcHRseSBidXQgY2xlYW5seSwgd2l0aG91dFxuLy8gY3V0dGluZyBvZmYgYW55b25lJ3MgcmVzcG9uc2UuXG5XZWJBcHAuX3RpbWVvdXRBZGp1c3RtZW50UmVxdWVzdENhbGxiYWNrID0gZnVuY3Rpb24ocmVxLCByZXMpIHtcbiAgLy8gdGhpcyBpcyByZWFsbHkganVzdCByZXEuc29ja2V0LnNldFRpbWVvdXQoTE9OR19TT0NLRVRfVElNRU9VVCk7XG4gIHJlcS5zZXRUaW1lb3V0KExPTkdfU09DS0VUX1RJTUVPVVQpO1xuICAvLyBJbnNlcnQgb3VyIG5ldyBmaW5pc2ggbGlzdGVuZXIgdG8gcnVuIEJFRk9SRSB0aGUgZXhpc3Rpbmcgb25lIHdoaWNoIHJlbW92ZXNcbiAgLy8gdGhlIHJlc3BvbnNlIGZyb20gdGhlIHNvY2tldC5cbiAgdmFyIGZpbmlzaExpc3RlbmVycyA9IHJlcy5saXN0ZW5lcnMoJ2ZpbmlzaCcpO1xuICAvLyBYWFggQXBwYXJlbnRseSBpbiBOb2RlIDAuMTIgdGhpcyBldmVudCB3YXMgY2FsbGVkICdwcmVmaW5pc2gnLlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vam95ZW50L25vZGUvY29tbWl0LzdjOWI2MDcwXG4gIC8vIEJ1dCBpdCBoYXMgc3dpdGNoZWQgYmFjayB0byAnZmluaXNoJyBpbiBOb2RlIHY0OlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvcHVsbC8xNDExXG4gIHJlcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2ZpbmlzaCcpO1xuICByZXMub24oJ2ZpbmlzaCcsIGZ1bmN0aW9uKCkge1xuICAgIHJlcy5zZXRUaW1lb3V0KFNIT1JUX1NPQ0tFVF9USU1FT1VUKTtcbiAgfSk7XG4gIE9iamVjdC52YWx1ZXMoZmluaXNoTGlzdGVuZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKGwpIHtcbiAgICByZXMub24oJ2ZpbmlzaCcsIGwpO1xuICB9KTtcbn07XG5cbi8vIFdpbGwgYmUgdXBkYXRlZCBieSBtYWluIGJlZm9yZSB3ZSBsaXN0ZW4uXG4vLyBNYXAgZnJvbSBjbGllbnQgYXJjaCB0byBib2lsZXJwbGF0ZSBvYmplY3QuXG4vLyBCb2lsZXJwbGF0ZSBvYmplY3QgaGFzOlxuLy8gICAtIGZ1bmM6IFhYWFxuLy8gICAtIGJhc2VEYXRhOiBYWFhcbnZhciBib2lsZXJwbGF0ZUJ5QXJjaCA9IHt9O1xuXG4vLyBSZWdpc3RlciBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgY2FuIHNlbGVjdGl2ZWx5IG1vZGlmeSBib2lsZXJwbGF0ZVxuLy8gZGF0YSBnaXZlbiBhcmd1bWVudHMgKHJlcXVlc3QsIGRhdGEsIGFyY2gpLiBUaGUga2V5IHNob3VsZCBiZSBhIHVuaXF1ZVxuLy8gaWRlbnRpZmllciwgdG8gcHJldmVudCBhY2N1bXVsYXRpbmcgZHVwbGljYXRlIGNhbGxiYWNrcyBmcm9tIHRoZSBzYW1lXG4vLyBjYWxsIHNpdGUgb3ZlciB0aW1lLiBDYWxsYmFja3Mgd2lsbCBiZSBjYWxsZWQgaW4gdGhlIG9yZGVyIHRoZXkgd2VyZVxuLy8gcmVnaXN0ZXJlZC4gQSBjYWxsYmFjayBzaG91bGQgcmV0dXJuIGZhbHNlIGlmIGl0IGRpZCBub3QgbWFrZSBhbnlcbi8vIGNoYW5nZXMgYWZmZWN0aW5nIHRoZSBib2lsZXJwbGF0ZS4gUGFzc2luZyBudWxsIGRlbGV0ZXMgdGhlIGNhbGxiYWNrLlxuLy8gQW55IHByZXZpb3VzIGNhbGxiYWNrIHJlZ2lzdGVyZWQgZm9yIHRoaXMga2V5IHdpbGwgYmUgcmV0dXJuZWQuXG5jb25zdCBib2lsZXJwbGF0ZURhdGFDYWxsYmFja3MgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuV2ViQXBwSW50ZXJuYWxzLnJlZ2lzdGVyQm9pbGVycGxhdGVEYXRhQ2FsbGJhY2sgPSBmdW5jdGlvbihrZXksIGNhbGxiYWNrKSB7XG4gIGNvbnN0IHByZXZpb3VzQ2FsbGJhY2sgPSBib2lsZXJwbGF0ZURhdGFDYWxsYmFja3Nba2V5XTtcblxuICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgYm9pbGVycGxhdGVEYXRhQ2FsbGJhY2tzW2tleV0gPSBjYWxsYmFjaztcbiAgfSBlbHNlIHtcbiAgICBhc3NlcnQuc3RyaWN0RXF1YWwoY2FsbGJhY2ssIG51bGwpO1xuICAgIGRlbGV0ZSBib2lsZXJwbGF0ZURhdGFDYWxsYmFja3Nba2V5XTtcbiAgfVxuXG4gIC8vIFJldHVybiB0aGUgcHJldmlvdXMgY2FsbGJhY2sgaW4gY2FzZSB0aGUgbmV3IGNhbGxiYWNrIG5lZWRzIHRvIGNhbGxcbiAgLy8gaXQ7IGZvciBleGFtcGxlLCB3aGVuIHRoZSBuZXcgY2FsbGJhY2sgaXMgYSB3cmFwcGVyIGZvciB0aGUgb2xkLlxuICByZXR1cm4gcHJldmlvdXNDYWxsYmFjayB8fCBudWxsO1xufTtcblxuLy8gR2l2ZW4gYSByZXF1ZXN0IChhcyByZXR1cm5lZCBmcm9tIGBjYXRlZ29yaXplUmVxdWVzdGApLCByZXR1cm4gdGhlXG4vLyBib2lsZXJwbGF0ZSBIVE1MIHRvIHNlcnZlIGZvciB0aGF0IHJlcXVlc3QuXG4vL1xuLy8gSWYgYSBwcmV2aW91cyBFeHByZXNzIG1pZGRsZXdhcmUgaGFzIHJlbmRlcmVkIGNvbnRlbnQgZm9yIHRoZSBoZWFkIG9yIGJvZHksXG4vLyByZXR1cm5zIHRoZSBib2lsZXJwbGF0ZSB3aXRoIHRoYXQgY29udGVudCBwYXRjaGVkIGluIG90aGVyd2lzZVxuLy8gbWVtb2l6ZXMgb24gSFRNTCBhdHRyaWJ1dGVzICh1c2VkIGJ5LCBlZywgYXBwY2FjaGUpIGFuZCB3aGV0aGVyIGlubGluZVxuLy8gc2NyaXB0cyBhcmUgY3VycmVudGx5IGFsbG93ZWQuXG4vLyBYWFggc28gZmFyIHRoaXMgZnVuY3Rpb24gaXMgYWx3YXlzIGNhbGxlZCB3aXRoIGFyY2ggPT09ICd3ZWIuYnJvd3NlcidcbmZ1bmN0aW9uIGdldEJvaWxlcnBsYXRlKHJlcXVlc3QsIGFyY2gpIHtcbiAgcmV0dXJuIGdldEJvaWxlcnBsYXRlQXN5bmMocmVxdWVzdCwgYXJjaCk7XG59XG5cbi8qKlxuICogQHN1bW1hcnkgVGFrZXMgYSBydW50aW1lIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGFuZFxuICogcmV0dXJucyBhbiBlbmNvZGVkIHJ1bnRpbWUgc3RyaW5nLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtPYmplY3R9IHJ0aW1lQ29uZmlnXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5XZWJBcHAuZW5jb2RlUnVudGltZUNvbmZpZyA9IGZ1bmN0aW9uKHJ0aW1lQ29uZmlnKSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkocnRpbWVDb25maWcpKSk7XG59O1xuXG4vKipcbiAqIEBzdW1tYXJ5IFRha2VzIGFuIGVuY29kZWQgcnVudGltZSBzdHJpbmcgYW5kIHJldHVybnNcbiAqIGEgcnVudGltZSBjb25maWd1cmF0aW9uIG9iamVjdC5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBydGltZUNvbmZpZ1N0cmluZ1xuICogQHJldHVybnMge09iamVjdH1cbiAqL1xuV2ViQXBwLmRlY29kZVJ1bnRpbWVDb25maWcgPSBmdW5jdGlvbihydGltZUNvbmZpZ1N0cikge1xuICByZXR1cm4gSlNPTi5wYXJzZShkZWNvZGVVUklDb21wb25lbnQoSlNPTi5wYXJzZShydGltZUNvbmZpZ1N0cikpKTtcbn07XG5cbmNvbnN0IHJ1bnRpbWVDb25maWcgPSB7XG4gIC8vIGhvb2tzIHdpbGwgY29udGFpbiB0aGUgY2FsbGJhY2sgZnVuY3Rpb25zXG4gIC8vIHNldCBieSB0aGUgY2FsbGVyIHRvIGFkZFJ1bnRpbWVDb25maWdIb29rXG4gIGhvb2tzOiBuZXcgSG9vaygpLFxuICAvLyB1cGRhdGVIb29rcyB3aWxsIGNvbnRhaW4gdGhlIGNhbGxiYWNrIGZ1bmN0aW9uc1xuICAvLyBzZXQgYnkgdGhlIGNhbGxlciB0byBhZGRVcGRhdGVkTm90aWZ5SG9va1xuICB1cGRhdGVIb29rczogbmV3IEhvb2soKSxcbiAgLy8gaXNVcGRhdGVkQnlBcmNoIGlzIGFuIG9iamVjdCBjb250YWluaW5nIGZpZWxkcyBmb3IgZWFjaCBhcmNoXG4gIC8vIHRoYXQgdGhpcyBzZXJ2ZXIgc3VwcG9ydHMuXG4gIC8vIC0gRWFjaCBmaWVsZCB3aWxsIGJlIHRydWUgd2hlbiB0aGUgc2VydmVyIHVwZGF0ZXMgdGhlIHJ1bnRpbWVDb25maWcgZm9yIHRoYXQgYXJjaC5cbiAgLy8gLSBXaGVuIHRoZSBob29rIGNhbGxiYWNrIGlzIGNhbGxlZCB0aGUgdXBkYXRlIGZpZWxkIGluIHRoZSBjYWxsYmFjayBvYmplY3Qgd2lsbCBiZVxuICAvLyBzZXQgdG8gaXNVcGRhdGVkQnlBcmNoW2FyY2hdLlxuICAvLyA9IGlzVXBkYXRlZHlCeUFyY2hbYXJjaF0gaXMgcmVzZXQgdG8gZmFsc2UgYWZ0ZXIgdGhlIGNhbGxiYWNrLlxuICAvLyBUaGlzIGVuYWJsZXMgdGhlIGNhbGxlciB0byBjYWNoZSBkYXRhIGVmZmljaWVudGx5IHNvIHRoZXkgZG8gbm90IG5lZWQgdG9cbiAgLy8gZGVjb2RlICYgdXBkYXRlIGRhdGEgb24gZXZlcnkgY2FsbGJhY2sgd2hlbiB0aGUgcnVudGltZUNvbmZpZyBpcyBub3QgY2hhbmdpbmcuXG4gIGlzVXBkYXRlZEJ5QXJjaDoge30sXG59O1xuXG4vKipcbiAqIEBuYW1lIGFkZFJ1bnRpbWVDb25maWdIb29rQ2FsbGJhY2sob3B0aW9ucylcbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBpc3Byb3RvdHlwZSB0cnVlXG4gKiBAc3VtbWFyeSBDYWxsYmFjayBmb3IgYGFkZFJ1bnRpbWVDb25maWdIb29rYC5cbiAqXG4gKiBJZiB0aGUgaGFuZGxlciByZXR1cm5zIGEgX2ZhbHN5XyB2YWx1ZSB0aGUgaG9vayB3aWxsIG5vdFxuICogbW9kaWZ5IHRoZSBydW50aW1lIGNvbmZpZ3VyYXRpb24uXG4gKlxuICogSWYgdGhlIGhhbmRsZXIgcmV0dXJucyBhIF9TdHJpbmdfIHRoZSBob29rIHdpbGwgc3Vic3RpdHV0ZVxuICogdGhlIHN0cmluZyBmb3IgdGhlIGVuY29kZWQgY29uZmlndXJhdGlvbiBzdHJpbmcuXG4gKlxuICogKipXYXJuaW5nOioqIHRoZSBob29rIGRvZXMgbm90IGNoZWNrIHRoZSByZXR1cm4gdmFsdWUgYXQgYWxsIGl0IGlzXG4gKiB0aGUgcmVzcG9uc2liaWxpdHkgb2YgdGhlIGNhbGxlciB0byBnZXQgdGhlIGZvcm1hdHRpbmcgY29ycmVjdCB1c2luZ1xuICogdGhlIGhlbHBlciBmdW5jdGlvbnMuXG4gKlxuICogYGFkZFJ1bnRpbWVDb25maWdIb29rQ2FsbGJhY2tgIHRha2VzIG9ubHkgb25lIGBPYmplY3RgIGFyZ3VtZW50XG4gKiB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGRzOlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLmFyY2ggVGhlIGFyY2hpdGVjdHVyZSBvZiB0aGUgY2xpZW50XG4gKiByZXF1ZXN0aW5nIGEgbmV3IHJ1bnRpbWUgY29uZmlndXJhdGlvbi4gVGhpcyBjYW4gYmUgb25lIG9mXG4gKiBgd2ViLmJyb3dzZXJgLCBgd2ViLmJyb3dzZXIubGVnYWN5YCBvciBgd2ViLmNvcmRvdmFgLlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMucmVxdWVzdFxuICogQSBOb2RlSnMgW0luY29taW5nTWVzc2FnZV0oaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9odHRwLmh0bWwjaHR0cF9jbGFzc19odHRwX2luY29taW5nbWVzc2FnZSlcbiAqIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvaHR0cC5odG1sI2h0dHBfY2xhc3NfaHR0cF9pbmNvbWluZ21lc3NhZ2VcbiAqIGBPYmplY3RgIHRoYXQgY2FuIGJlIHVzZWQgdG8gZ2V0IGluZm9ybWF0aW9uIGFib3V0IHRoZSBpbmNvbWluZyByZXF1ZXN0LlxuICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMuZW5jb2RlZEN1cnJlbnRDb25maWcgVGhlIGN1cnJlbnQgY29uZmlndXJhdGlvbiBvYmplY3RcbiAqIGVuY29kZWQgYXMgYSBzdHJpbmcgZm9yIGluY2x1c2lvbiBpbiB0aGUgcm9vdCBodG1sLlxuICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLnVwZGF0ZWQgYHRydWVgIGlmIHRoZSBjb25maWcgZm9yIHRoaXMgYXJjaGl0ZWN0dXJlXG4gKiBoYXMgYmVlbiB1cGRhdGVkIHNpbmNlIGxhc3QgY2FsbGVkLCBvdGhlcndpc2UgYGZhbHNlYC4gVGhpcyBmbGFnIGNhbiBiZSB1c2VkXG4gKiB0byBjYWNoZSB0aGUgZGVjb2RpbmcvZW5jb2RpbmcgZm9yIGVhY2ggYXJjaGl0ZWN0dXJlLlxuICovXG5cbi8qKlxuICogQHN1bW1hcnkgSG9vayB0aGF0IGNhbGxzIGJhY2sgd2hlbiB0aGUgbWV0ZW9yIHJ1bnRpbWUgY29uZmlndXJhdGlvbixcbiAqIGBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fYCBpcyBiZWluZyBzZW50IHRvIGFueSBjbGllbnQuXG4gKlxuICogKipyZXR1cm5zKio6IDxzbWFsbD5fT2JqZWN0Xzwvc21hbGw+IGB7IHN0b3A6IGZ1bmN0aW9uLCBjYWxsYmFjazogZnVuY3Rpb24gfWBcbiAqIC0gYHN0b3BgIDxzbWFsbD5fRnVuY3Rpb25fPC9zbWFsbD4gQ2FsbCBgc3RvcCgpYCB0byBzdG9wIGdldHRpbmcgY2FsbGJhY2tzLlxuICogLSBgY2FsbGJhY2tgIDxzbWFsbD5fRnVuY3Rpb25fPC9zbWFsbD4gVGhlIHBhc3NlZCBpbiBgY2FsbGJhY2tgLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHthZGRSdW50aW1lQ29uZmlnSG9va0NhbGxiYWNrfSBjYWxsYmFja1xuICogU2VlIGBhZGRSdW50aW1lQ29uZmlnSG9va0NhbGxiYWNrYCBkZXNjcmlwdGlvbi5cbiAqIEByZXR1cm5zIHtPYmplY3R9IHt7IHN0b3A6IGZ1bmN0aW9uLCBjYWxsYmFjazogZnVuY3Rpb24gfX1cbiAqIENhbGwgdGhlIHJldHVybmVkIGBzdG9wKClgIHRvIHN0b3AgZ2V0dGluZyBjYWxsYmFja3MuXG4gKiBUaGUgcGFzc2VkIGluIGBjYWxsYmFja2AgaXMgcmV0dXJuZWQgYWxzby5cbiAqL1xuV2ViQXBwLmFkZFJ1bnRpbWVDb25maWdIb29rID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgcmV0dXJuIHJ1bnRpbWVDb25maWcuaG9va3MucmVnaXN0ZXIoY2FsbGJhY2spO1xufTtcblxuYXN5bmMgZnVuY3Rpb24gZ2V0Qm9pbGVycGxhdGVBc3luYyhyZXF1ZXN0LCBhcmNoLCByZXNwb25zZSkge1xuICBsZXQgYm9pbGVycGxhdGUgPSBib2lsZXJwbGF0ZUJ5QXJjaFthcmNoXTtcbiAgYXdhaXQgcnVudGltZUNvbmZpZy5ob29rcy5mb3JFYWNoQXN5bmMoYXN5bmMgaG9vayA9PiB7XG4gICAgY29uc3QgbWV0ZW9yUnVudGltZUNvbmZpZyA9IGF3YWl0IGhvb2soe1xuICAgICAgYXJjaCxcbiAgICAgIHJlcXVlc3QsXG4gICAgICBlbmNvZGVkQ3VycmVudENvbmZpZzogYm9pbGVycGxhdGUuYmFzZURhdGEubWV0ZW9yUnVudGltZUNvbmZpZyxcbiAgICAgIHVwZGF0ZWQ6IHJ1bnRpbWVDb25maWcuaXNVcGRhdGVkQnlBcmNoW2FyY2hdLFxuICAgIH0pO1xuICAgIGlmICghbWV0ZW9yUnVudGltZUNvbmZpZykgcmV0dXJuIHRydWU7XG4gICAgYm9pbGVycGxhdGUuYmFzZURhdGEgPSBPYmplY3QuYXNzaWduKHt9LCBib2lsZXJwbGF0ZS5iYXNlRGF0YSwge1xuICAgICAgbWV0ZW9yUnVudGltZUNvbmZpZyxcbiAgICB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG4gIHJ1bnRpbWVDb25maWcuaXNVcGRhdGVkQnlBcmNoW2FyY2hdID0gZmFsc2U7XG4gIGNvbnN0IHsgZHluYW1pY0hlYWQsIGR5bmFtaWNCb2R5IH0gPSByZXF1ZXN0O1xuICBjb25zdCBkYXRhID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICBib2lsZXJwbGF0ZS5iYXNlRGF0YSxcbiAgICB7XG4gICAgICBodG1sQXR0cmlidXRlczogZ2V0SHRtbEF0dHJpYnV0ZXMocmVxdWVzdCksXG4gICAgfSxcbiAgICB7IGR5bmFtaWNIZWFkLCBkeW5hbWljQm9keSB9XG4gICk7XG5cbiAgbGV0IG1hZGVDaGFuZ2VzID0gZmFsc2U7XG4gIGxldCBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgT2JqZWN0LmtleXMoYm9pbGVycGxhdGVEYXRhQ2FsbGJhY2tzKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgcHJvbWlzZSA9IHByb21pc2VcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2sgPSBib2lsZXJwbGF0ZURhdGFDYWxsYmFja3Nba2V5XTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHJlcXVlc3QsIGRhdGEsIGFyY2gsIHJlc3BvbnNlKTtcbiAgICAgIH0pXG4gICAgICAudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAvLyBDYWxsYmFja3Mgc2hvdWxkIHJldHVybiBmYWxzZSBpZiB0aGV5IGRpZCBub3QgbWFrZSBhbnkgY2hhbmdlcy5cbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBtYWRlQ2hhbmdlcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gcHJvbWlzZS50aGVuKCgpID0+ICh7XG4gICAgc3RyZWFtOiBib2lsZXJwbGF0ZS50b0hUTUxTdHJlYW0oZGF0YSksXG4gICAgc3RhdHVzQ29kZTogZGF0YS5zdGF0dXNDb2RlLFxuICAgIGhlYWRlcnM6IGRhdGEuaGVhZGVycyxcbiAgfSkpO1xufVxuXG4vKipcbiAqIEBuYW1lIGFkZFVwZGF0ZWROb3RpZnlIb29rQ2FsbGJhY2sob3B0aW9ucylcbiAqIEBzdW1tYXJ5IGNhbGxiYWNrIGhhbmRsZXIgZm9yIGBhZGR1cGRhdGVkTm90aWZ5SG9va2BcbiAqIEBpc3Byb3RvdHlwZSB0cnVlXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMuYXJjaCBUaGUgYXJjaGl0ZWN0dXJlIHRoYXQgaXMgYmVpbmcgdXBkYXRlZC5cbiAqIFRoaXMgY2FuIGJlIG9uZSBvZiBgd2ViLmJyb3dzZXJgLCBgd2ViLmJyb3dzZXIubGVnYWN5YCBvciBgd2ViLmNvcmRvdmFgLlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMubWFuaWZlc3QgVGhlIG5ldyB1cGRhdGVkIG1hbmlmZXN0IG9iamVjdCBmb3JcbiAqIHRoaXMgYGFyY2hgLlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMucnVudGltZUNvbmZpZyBUaGUgbmV3IHVwZGF0ZWQgY29uZmlndXJhdGlvblxuICogb2JqZWN0IGZvciB0aGlzIGBhcmNoYC5cbiAqL1xuXG4vKipcbiAqIEBzdW1tYXJ5IEhvb2sgdGhhdCBydW5zIHdoZW4gdGhlIG1ldGVvciBydW50aW1lIGNvbmZpZ3VyYXRpb25cbiAqIGlzIHVwZGF0ZWQuICBUeXBpY2FsbHkgdGhlIGNvbmZpZ3VyYXRpb24gb25seSBjaGFuZ2VzIGR1cmluZyBkZXZlbG9wbWVudCBtb2RlLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHthZGRVcGRhdGVkTm90aWZ5SG9va0NhbGxiYWNrfSBoYW5kbGVyXG4gKiBUaGUgYGhhbmRsZXJgIGlzIGNhbGxlZCBvbiBldmVyeSBjaGFuZ2UgdG8gYW4gYGFyY2hgIHJ1bnRpbWUgY29uZmlndXJhdGlvbi5cbiAqIFNlZSBgYWRkVXBkYXRlZE5vdGlmeUhvb2tDYWxsYmFja2AuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSB7eyBzdG9wOiBmdW5jdGlvbiwgY2FsbGJhY2s6IGZ1bmN0aW9uIH19XG4gKi9cbldlYkFwcC5hZGRVcGRhdGVkTm90aWZ5SG9vayA9IGZ1bmN0aW9uKGhhbmRsZXIpIHtcbiAgcmV0dXJuIHJ1bnRpbWVDb25maWcudXBkYXRlSG9va3MucmVnaXN0ZXIoaGFuZGxlcik7XG59O1xuXG5XZWJBcHBJbnRlcm5hbHMuZ2VuZXJhdGVCb2lsZXJwbGF0ZUluc3RhbmNlID0gZnVuY3Rpb24oXG4gIGFyY2gsXG4gIG1hbmlmZXN0LFxuICBhZGRpdGlvbmFsT3B0aW9uc1xuKSB7XG4gIGFkZGl0aW9uYWxPcHRpb25zID0gYWRkaXRpb25hbE9wdGlvbnMgfHwge307XG5cbiAgcnVudGltZUNvbmZpZy5pc1VwZGF0ZWRCeUFyY2hbYXJjaF0gPSB0cnVlO1xuICBjb25zdCBydGltZUNvbmZpZyA9IHtcbiAgICAuLi5fX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLFxuICAgIC4uLihhZGRpdGlvbmFsT3B0aW9ucy5ydW50aW1lQ29uZmlnT3ZlcnJpZGVzIHx8IHt9KSxcbiAgfTtcbiAgcnVudGltZUNvbmZpZy51cGRhdGVIb29rcy5mb3JFYWNoKGNiID0+IHtcbiAgICBjYih7IGFyY2gsIG1hbmlmZXN0LCBydW50aW1lQ29uZmlnOiBydGltZUNvbmZpZyB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG5cbiAgY29uc3QgbWV0ZW9yUnVudGltZUNvbmZpZyA9IEpTT04uc3RyaW5naWZ5KFxuICAgIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShydGltZUNvbmZpZykpXG4gICk7XG5cbiAgcmV0dXJuIG5ldyBCb2lsZXJwbGF0ZShcbiAgICBhcmNoLFxuICAgIG1hbmlmZXN0LFxuICAgIE9iamVjdC5hc3NpZ24oXG4gICAgICB7XG4gICAgICAgIHBhdGhNYXBwZXIoaXRlbVBhdGgpIHtcbiAgICAgICAgICByZXR1cm4gcGF0aEpvaW4oYXJjaFBhdGhbYXJjaF0sIGl0ZW1QYXRoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYmFzZURhdGFFeHRlbnNpb246IHtcbiAgICAgICAgICBhZGRpdGlvbmFsU3RhdGljSnM6IChPYmplY3QuZW50cmllcyhhZGRpdGlvbmFsU3RhdGljSnMpIHx8IFtdKS5tYXAoZnVuY3Rpb24oXG4gICAgICAgICAgICBbcGF0aG5hbWUsIGNvbnRlbnRzXVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgcGF0aG5hbWU6IHBhdGhuYW1lLFxuICAgICAgICAgICAgICBjb250ZW50czogY29udGVudHMsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIC8vIENvbnZlcnQgdG8gYSBKU09OIHN0cmluZywgdGhlbiBnZXQgcmlkIG9mIG1vc3Qgd2VpcmQgY2hhcmFjdGVycywgdGhlblxuICAgICAgICAgIC8vIHdyYXAgaW4gZG91YmxlIHF1b3Rlcy4gKFRoZSBvdXRlcm1vc3QgSlNPTi5zdHJpbmdpZnkgcmVhbGx5IG91Z2h0IHRvXG4gICAgICAgICAgLy8ganVzdCBiZSBcIndyYXAgaW4gZG91YmxlIHF1b3Rlc1wiIGJ1dCB3ZSB1c2UgaXQgdG8gYmUgc2FmZS4pIFRoaXMgbWlnaHRcbiAgICAgICAgICAvLyBlbmQgdXAgaW5zaWRlIGEgPHNjcmlwdD4gdGFnIHNvIHdlIG5lZWQgdG8gYmUgY2FyZWZ1bCB0byBub3QgaW5jbHVkZVxuICAgICAgICAgIC8vIFwiPC9zY3JpcHQ+XCIsIGJ1dCBub3JtYWwge3tzcGFjZWJhcnN9fSBlc2NhcGluZyBlc2NhcGVzIHRvbyBtdWNoISBTZWVcbiAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9pc3N1ZXMvMzczMFxuICAgICAgICAgIG1ldGVvclJ1bnRpbWVDb25maWcsXG4gICAgICAgICAgbWV0ZW9yUnVudGltZUhhc2g6IHNoYTEobWV0ZW9yUnVudGltZUNvbmZpZyksXG4gICAgICAgICAgcm9vdFVybFBhdGhQcmVmaXg6XG4gICAgICAgICAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYIHx8ICcnLFxuICAgICAgICAgIGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rOiBidW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayxcbiAgICAgICAgICBzcmlNb2RlOiBzcmlNb2RlLFxuICAgICAgICAgIGlubGluZVNjcmlwdHNBbGxvd2VkOiBXZWJBcHBJbnRlcm5hbHMuaW5saW5lU2NyaXB0c0FsbG93ZWQoKSxcbiAgICAgICAgICBpbmxpbmU6IGFkZGl0aW9uYWxPcHRpb25zLmlubGluZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBhZGRpdGlvbmFsT3B0aW9uc1xuICAgIClcbiAgKTtcbn07XG5cbi8vIEEgbWFwcGluZyBmcm9tIHVybCBwYXRoIHRvIGFyY2hpdGVjdHVyZSAoZS5nLiBcIndlYi5icm93c2VyXCIpIHRvIHN0YXRpY1xuLy8gZmlsZSBpbmZvcm1hdGlvbiB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGRzOlxuLy8gLSB0eXBlOiB0aGUgdHlwZSBvZiBmaWxlIHRvIGJlIHNlcnZlZFxuLy8gLSBjYWNoZWFibGU6IG9wdGlvbmFsbHksIHdoZXRoZXIgdGhlIGZpbGUgc2hvdWxkIGJlIGNhY2hlZCBvciBub3Rcbi8vIC0gc291cmNlTWFwVXJsOiBvcHRpb25hbGx5LCB0aGUgdXJsIG9mIHRoZSBzb3VyY2UgbWFwXG4vL1xuLy8gSW5mbyBhbHNvIGNvbnRhaW5zIG9uZSBvZiB0aGUgZm9sbG93aW5nOlxuLy8gLSBjb250ZW50OiB0aGUgc3RyaW5naWZpZWQgY29udGVudCB0aGF0IHNob3VsZCBiZSBzZXJ2ZWQgYXQgdGhpcyBwYXRoXG4vLyAtIGFic29sdXRlUGF0aDogdGhlIGFic29sdXRlIHBhdGggb24gZGlzayB0byB0aGUgZmlsZVxuXG4vLyBTZXJ2ZSBzdGF0aWMgZmlsZXMgZnJvbSB0aGUgbWFuaWZlc3Qgb3IgYWRkZWQgd2l0aFxuLy8gYGFkZFN0YXRpY0pzYC4gRXhwb3J0ZWQgZm9yIHRlc3RzLlxuV2ViQXBwSW50ZXJuYWxzLnN0YXRpY0ZpbGVzTWlkZGxld2FyZSA9IGFzeW5jIGZ1bmN0aW9uKFxuICBzdGF0aWNGaWxlc0J5QXJjaCxcbiAgcmVxLFxuICByZXMsXG4gIG5leHRcbikge1xuICB2YXIgcGF0aG5hbWUgPSBwYXJzZVJlcXVlc3QocmVxKS5wYXRobmFtZTtcbiAgdHJ5IHtcbiAgICBwYXRobmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChwYXRobmFtZSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBuZXh0KCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHNlcnZlU3RhdGljSnMgPSBmdW5jdGlvbihzKSB7XG4gICAgaWYgKFxuICAgICAgcmVxLm1ldGhvZCA9PT0gJ0dFVCcgfHxcbiAgICAgIHJlcS5tZXRob2QgPT09ICdIRUFEJyB8fFxuICAgICAgTWV0ZW9yLnNldHRpbmdzLnBhY2thZ2VzPy53ZWJhcHA/LmFsd2F5c1JldHVybkNvbnRlbnRcbiAgICApIHtcbiAgICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7XG4gICAgICAgICdDb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vamF2YXNjcmlwdDsgY2hhcnNldD1VVEYtOCcsXG4gICAgICAgICdDb250ZW50LUxlbmd0aCc6IEJ1ZmZlci5ieXRlTGVuZ3RoKHMpLFxuICAgICAgfSk7XG4gICAgICByZXMud3JpdGUocyk7XG4gICAgICByZXMuZW5kKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHJlcS5tZXRob2QgPT09ICdPUFRJT05TJyA/IDIwMCA6IDQwNTtcbiAgICAgIHJlcy53cml0ZUhlYWQoc3RhdHVzLCB7XG4gICAgICAgIEFsbG93OiAnT1BUSU9OUywgR0VULCBIRUFEJyxcbiAgICAgICAgJ0NvbnRlbnQtTGVuZ3RoJzogJzAnLFxuICAgICAgfSk7XG4gICAgICByZXMuZW5kKCk7XG4gICAgfVxuICB9O1xuXG4gIGlmIChcbiAgICBwYXRobmFtZSBpbiBhZGRpdGlvbmFsU3RhdGljSnMgJiZcbiAgICAhV2ViQXBwSW50ZXJuYWxzLmlubGluZVNjcmlwdHNBbGxvd2VkKClcbiAgKSB7XG4gICAgc2VydmVTdGF0aWNKcyhhZGRpdGlvbmFsU3RhdGljSnNbcGF0aG5hbWVdKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB7IGFyY2gsIHBhdGggfSA9IFdlYkFwcC5jYXRlZ29yaXplUmVxdWVzdChyZXEpO1xuXG4gIGlmICghaGFzT3duLmNhbGwoV2ViQXBwLmNsaWVudFByb2dyYW1zLCBhcmNoKSkge1xuICAgIC8vIFdlIGNvdWxkIGNvbWUgaGVyZSBpbiBjYXNlIHdlIHJ1biB3aXRoIHNvbWUgYXJjaGl0ZWN0dXJlcyBleGNsdWRlZFxuICAgIG5leHQoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBJZiBwYXVzZUNsaWVudChhcmNoKSBoYXMgYmVlbiBjYWxsZWQsIHByb2dyYW0ucGF1c2VkIHdpbGwgYmUgYVxuICAvLyBQcm9taXNlIHRoYXQgd2lsbCBiZSByZXNvbHZlZCB3aGVuIHRoZSBwcm9ncmFtIGlzIHVucGF1c2VkLlxuICBjb25zdCBwcm9ncmFtID0gV2ViQXBwLmNsaWVudFByb2dyYW1zW2FyY2hdO1xuICBhd2FpdCBwcm9ncmFtLnBhdXNlZDtcblxuICBpZiAoXG4gICAgcGF0aCA9PT0gJy9tZXRlb3JfcnVudGltZV9jb25maWcuanMnICYmXG4gICAgIVdlYkFwcEludGVybmFscy5pbmxpbmVTY3JpcHRzQWxsb3dlZCgpXG4gICkge1xuICAgIHNlcnZlU3RhdGljSnMoXG4gICAgICBgX19tZXRlb3JfcnVudGltZV9jb25maWdfXyA9ICR7cHJvZ3JhbS5tZXRlb3JSdW50aW1lQ29uZmlnfTtgXG4gICAgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBpbmZvID0gZ2V0U3RhdGljRmlsZUluZm8oc3RhdGljRmlsZXNCeUFyY2gsIHBhdGhuYW1lLCBwYXRoLCBhcmNoKTtcbiAgaWYgKCFpbmZvKSB7XG4gICAgbmV4dCgpO1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBcInNlbmRcIiB3aWxsIGhhbmRsZSBIRUFEICYgR0VUIHJlcXVlc3RzXG4gIGlmIChcbiAgICByZXEubWV0aG9kICE9PSAnSEVBRCcgJiZcbiAgICByZXEubWV0aG9kICE9PSAnR0VUJyAmJlxuICAgICFNZXRlb3Iuc2V0dGluZ3MucGFja2FnZXM/LndlYmFwcD8uYWx3YXlzUmV0dXJuQ29udGVudFxuICApIHtcbiAgICBjb25zdCBzdGF0dXMgPSByZXEubWV0aG9kID09PSAnT1BUSU9OUycgPyAyMDAgOiA0MDU7XG4gICAgcmVzLndyaXRlSGVhZChzdGF0dXMsIHtcbiAgICAgIEFsbG93OiAnT1BUSU9OUywgR0VULCBIRUFEJyxcbiAgICAgICdDb250ZW50LUxlbmd0aCc6ICcwJyxcbiAgICB9KTtcbiAgICByZXMuZW5kKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gV2UgZG9uJ3QgbmVlZCB0byBjYWxsIHBhdXNlIGJlY2F1c2UsIHVubGlrZSAnc3RhdGljJywgb25jZSB3ZSBjYWxsIGludG9cbiAgLy8gJ3NlbmQnIGFuZCB5aWVsZCB0byB0aGUgZXZlbnQgbG9vcCwgd2UgbmV2ZXIgY2FsbCBhbm90aGVyIGhhbmRsZXIgd2l0aFxuICAvLyAnbmV4dCcuXG5cbiAgLy8gQ2FjaGVhYmxlIGZpbGVzIGFyZSBmaWxlcyB0aGF0IHNob3VsZCBuZXZlciBjaGFuZ2UuIFR5cGljYWxseVxuICAvLyBuYW1lZCBieSB0aGVpciBoYXNoIChlZyBtZXRlb3IgYnVuZGxlZCBqcyBhbmQgY3NzIGZpbGVzKS5cbiAgLy8gV2UgY2FjaGUgdGhlbSB+Zm9yZXZlciAoMXlyKS5cbiAgY29uc3QgbWF4QWdlID0gaW5mby5jYWNoZWFibGUgPyAxMDAwICogNjAgKiA2MCAqIDI0ICogMzY1IDogMDtcblxuICAvLyBSZXNvdXJjZXMgd2hvc2UgVVJMIGFscmVhZHkgY29udGFpbnMgdGhlIGNvbnRlbnQgaGFzaCBhcmUgaW1tdXRhYmxlXG4gIC8vIGFuZCB1bmlxdWUgcGVyIGFyY2hpdGVjdHVyZSAobW9kZXJuIHZzIGxlZ2FjeSksIHNvIFZhcnk6IFVzZXItQWdlbnRcbiAgLy8gaXMgdW5uZWNlc3NhcnkgYW5kIGhhcm1zIENETiBjYWNoZSBlZmZpY2llbmN5LlxuICAvL1xuICAvLyBJZiB0aGUgcmVxdWVzdGVkIFVSTCBkb2VzIG5vdCBjb250YWluIHRoZSBoYXNoIChlLmcuIGRldmVsb3BtZW50XG4gIC8vIG9yIHVuaGFzaGVkIGFzc2V0cyksIHdlIGtlZXAgVmFyeTogVXNlci1BZ2VudCB0byBwcmV2ZW50IGNhY2hlXG4gIC8vIHBvaXNvbmluZyBhY3Jvc3MgZGlmZmVyZW50IGJyb3dzZXJzLlxuICBjb25zdCBpbmNsdWRlVmFyeVVzZXJBZ2VudCA9XG4gIE1ldGVvci5zZXR0aW5ncy5wYWNrYWdlcz8ud2ViYXBwPy5pbmNsdWRlVmFyeVVzZXJBZ2VudCA/PyB0cnVlO1xuXG4gIGlmIChpbmZvLmNhY2hlYWJsZSAmJiAhcGF0aG5hbWUuaW5jbHVkZXMoaW5mby5oYXNoKSAmJiBpbmNsdWRlVmFyeVVzZXJBZ2VudCkge1xuICAgIHJlcy5zZXRIZWFkZXIoJ1ZhcnknLCAnVXNlci1BZ2VudCcpO1xuICB9XG5cbiAgLy8gU2V0IHRoZSBYLVNvdXJjZU1hcCBoZWFkZXIsIHdoaWNoIGN1cnJlbnQgQ2hyb21lLCBGaXJlRm94LCBhbmQgU2FmYXJpXG4gIC8vIHVuZGVyc3RhbmQuICAoVGhlIFNvdXJjZU1hcCBoZWFkZXIgaXMgc2xpZ2h0bHkgbW9yZSBzcGVjLWNvcnJlY3QgYnV0IEZGXG4gIC8vIGRvZXNuJ3QgdW5kZXJzdGFuZCBpdC4pXG4gIC8vXG4gIC8vIFlvdSBtYXkgYWxzbyBuZWVkIHRvIGVuYWJsZSBzb3VyY2UgbWFwcyBpbiBDaHJvbWU6IG9wZW4gZGV2IHRvb2xzLCBjbGlja1xuICAvLyB0aGUgZ2VhciBpbiB0aGUgYm90dG9tIHJpZ2h0IGNvcm5lciwgYW5kIHNlbGVjdCBcImVuYWJsZSBzb3VyY2UgbWFwc1wiLlxuICBpZiAoaW5mby5zb3VyY2VNYXBVcmwpIHtcbiAgICByZXMuc2V0SGVhZGVyKFxuICAgICAgJ1gtU291cmNlTWFwJyxcbiAgICAgIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVggKyBpbmZvLnNvdXJjZU1hcFVybFxuICAgICk7XG4gIH1cblxuICBpZiAoaW5mby50eXBlID09PSAnanMnIHx8IGluZm8udHlwZSA9PT0gJ2R5bmFtaWMganMnKSB7XG4gICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQ7IGNoYXJzZXQ9VVRGLTgnKTtcbiAgfSBlbHNlIGlmIChpbmZvLnR5cGUgPT09ICdjc3MnKSB7XG4gICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ3RleHQvY3NzOyBjaGFyc2V0PVVURi04Jyk7XG4gIH0gZWxzZSBpZiAoaW5mby50eXBlID09PSAnanNvbicpIHtcbiAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD1VVEYtOCcpO1xuICB9XG5cbiAgaWYgKGluZm8uaGFzaCkge1xuICAgIHJlcy5zZXRIZWFkZXIoJ0VUYWcnLCAnXCInICsgaW5mby5oYXNoICsgJ1wiJyk7XG4gIH1cblxuICBpZiAoaW5mby5jb250ZW50KSB7XG4gICAgcmVzLnNldEhlYWRlcignQ29udGVudC1MZW5ndGgnLCBCdWZmZXIuYnl0ZUxlbmd0aChpbmZvLmNvbnRlbnQpKTtcbiAgICByZXMud3JpdGUoaW5mby5jb250ZW50KTtcbiAgICByZXMuZW5kKCk7XG4gIH0gZWxzZSB7XG4gICAgc2VuZChyZXEsIGluZm8uYWJzb2x1dGVQYXRoLCB7XG4gICAgICBtYXhhZ2U6IG1heEFnZSxcbiAgICAgIGRvdGZpbGVzOiAnYWxsb3cnLCAvLyBpZiB3ZSBzcGVjaWZpZWQgYSBkb3RmaWxlIGluIHRoZSBtYW5pZmVzdCwgc2VydmUgaXRcbiAgICAgIGxhc3RNb2RpZmllZDogZmFsc2UsIC8vIGRvbid0IHNldCBsYXN0LW1vZGlmaWVkIGJhc2VkIG9uIHRoZSBmaWxlIGRhdGVcbiAgICB9KVxuICAgICAgLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICBMb2cuZXJyb3IoJ0Vycm9yIHNlcnZpbmcgc3RhdGljIGZpbGUgJyArIGVycik7XG4gICAgICAgIHJlcy53cml0ZUhlYWQoNTAwKTtcbiAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgfSlcbiAgICAgIC5vbignZGlyZWN0b3J5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIExvZy5lcnJvcignVW5leHBlY3RlZCBkaXJlY3RvcnkgJyArIGluZm8uYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgcmVzLndyaXRlSGVhZCg1MDApO1xuICAgICAgICByZXMuZW5kKCk7XG4gICAgICB9KVxuICAgICAgLnBpcGUocmVzKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZ2V0U3RhdGljRmlsZUluZm8oc3RhdGljRmlsZXNCeUFyY2gsIG9yaWdpbmFsUGF0aCwgcGF0aCwgYXJjaCkge1xuICBpZiAoIWhhc093bi5jYWxsKFdlYkFwcC5jbGllbnRQcm9ncmFtcywgYXJjaCkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIEdldCBhIGxpc3Qgb2YgYWxsIGF2YWlsYWJsZSBzdGF0aWMgZmlsZSBhcmNoaXRlY3R1cmVzLCB3aXRoIGFyY2hcbiAgLy8gZmlyc3QgaW4gdGhlIGxpc3QgaWYgaXQgZXhpc3RzLlxuICBjb25zdCBzdGF0aWNBcmNoTGlzdCA9IE9iamVjdC5rZXlzKHN0YXRpY0ZpbGVzQnlBcmNoKTtcbiAgY29uc3QgYXJjaEluZGV4ID0gc3RhdGljQXJjaExpc3QuaW5kZXhPZihhcmNoKTtcbiAgaWYgKGFyY2hJbmRleCA+IDApIHtcbiAgICBzdGF0aWNBcmNoTGlzdC51bnNoaWZ0KHN0YXRpY0FyY2hMaXN0LnNwbGljZShhcmNoSW5kZXgsIDEpWzBdKTtcbiAgfVxuXG4gIGxldCBpbmZvID0gbnVsbDtcblxuICBzdGF0aWNBcmNoTGlzdC5zb21lKGFyY2ggPT4ge1xuICAgIGNvbnN0IHN0YXRpY0ZpbGVzID0gc3RhdGljRmlsZXNCeUFyY2hbYXJjaF07XG5cbiAgICBmdW5jdGlvbiBmaW5hbGl6ZShwYXRoKSB7XG4gICAgICBpbmZvID0gc3RhdGljRmlsZXNbcGF0aF07XG4gICAgICAvLyBTb21ldGltZXMgd2UgcmVnaXN0ZXIgYSBsYXp5IGZ1bmN0aW9uIGluc3RlYWQgb2YgYWN0dWFsIGRhdGEgaW5cbiAgICAgIC8vIHRoZSBzdGF0aWNGaWxlcyBtYW5pZmVzdC5cbiAgICAgIGlmICh0eXBlb2YgaW5mbyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpbmZvID0gc3RhdGljRmlsZXNbcGF0aF0gPSBpbmZvKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaW5mbztcbiAgICB9XG5cbiAgICAvLyBJZiBzdGF0aWNGaWxlcyBjb250YWlucyBvcmlnaW5hbFBhdGggd2l0aCB0aGUgYXJjaCBpbmZlcnJlZCBhYm92ZSxcbiAgICAvLyB1c2UgdGhhdCBpbmZvcm1hdGlvbi5cbiAgICBpZiAoaGFzT3duLmNhbGwoc3RhdGljRmlsZXMsIG9yaWdpbmFsUGF0aCkpIHtcbiAgICAgIHJldHVybiBmaW5hbGl6ZShvcmlnaW5hbFBhdGgpO1xuICAgIH1cblxuICAgIC8vIElmIGNhdGVnb3JpemVSZXF1ZXN0IHJldHVybmVkIGFuIGFsdGVybmF0ZSBwYXRoLCB0cnkgdGhhdCBpbnN0ZWFkLlxuICAgIGlmIChwYXRoICE9PSBvcmlnaW5hbFBhdGggJiYgaGFzT3duLmNhbGwoc3RhdGljRmlsZXMsIHBhdGgpKSB7XG4gICAgICByZXR1cm4gZmluYWxpemUocGF0aCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gaW5mbztcbn1cblxuLy8gUGFyc2UgdGhlIHBhc3NlZCBpbiBwb3J0IHZhbHVlLiBSZXR1cm4gdGhlIHBvcnQgYXMtaXMgaWYgaXQncyBhIFN0cmluZ1xuLy8gKGUuZy4gYSBXaW5kb3dzIFNlcnZlciBzdHlsZSBuYW1lZCBwaXBlKSwgb3RoZXJ3aXNlIHJldHVybiB0aGUgcG9ydCBhcyBhblxuLy8gaW50ZWdlci5cbi8vXG4vLyBERVBSRUNBVEVEOiBEaXJlY3QgdXNlIG9mIHRoaXMgZnVuY3Rpb24gaXMgbm90IHJlY29tbWVuZGVkOyBpdCBpcyBub1xuLy8gbG9uZ2VyIHVzZWQgaW50ZXJuYWxseSwgYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiBhIGZ1dHVyZSByZWxlYXNlLlxuV2ViQXBwSW50ZXJuYWxzLnBhcnNlUG9ydCA9IHBvcnQgPT4ge1xuICBsZXQgcGFyc2VkUG9ydCA9IHBhcnNlSW50KHBvcnQpO1xuICBpZiAoTnVtYmVyLmlzTmFOKHBhcnNlZFBvcnQpKSB7XG4gICAgcGFyc2VkUG9ydCA9IHBvcnQ7XG4gIH1cbiAgcmV0dXJuIHBhcnNlZFBvcnQ7XG59O1xuXG5pbXBvcnQgeyBvbk1lc3NhZ2UgfSBmcm9tICdtZXRlb3IvaW50ZXItcHJvY2Vzcy1tZXNzYWdpbmcnO1xuXG5vbk1lc3NhZ2UoJ3dlYmFwcC1wYXVzZS1jbGllbnQnLCBhc3luYyAoeyBhcmNoIH0pID0+IHtcbiAgYXdhaXQgV2ViQXBwSW50ZXJuYWxzLnBhdXNlQ2xpZW50KGFyY2gpO1xufSk7XG5cbm9uTWVzc2FnZSgnd2ViYXBwLXJlbG9hZC1jbGllbnQnLCBhc3luYyAoeyBhcmNoIH0pID0+IHtcbiAgYXdhaXQgV2ViQXBwSW50ZXJuYWxzLmdlbmVyYXRlQ2xpZW50UHJvZ3JhbShhcmNoKTtcbn0pO1xuXG5hc3luYyBmdW5jdGlvbiBydW5XZWJBcHBTZXJ2ZXIoKSB7XG4gIHZhciBzaHV0dGluZ0Rvd24gPSBmYWxzZTtcbiAgdmFyIHN5bmNRdWV1ZSA9IG5ldyBNZXRlb3IuX0FzeW5jaHJvbm91c1F1ZXVlKCk7XG5cbiAgdmFyIGdldEl0ZW1QYXRobmFtZSA9IGZ1bmN0aW9uKGl0ZW1VcmwpIHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHBhcnNlVXJsKGl0ZW1VcmwpLnBhdGhuYW1lKTtcbiAgfTtcblxuICBXZWJBcHBJbnRlcm5hbHMucmVsb2FkQ2xpZW50UHJvZ3JhbXMgPSBhc3luYyBmdW5jdGlvbigpIHtcbiAgICBhd2FpdCBzeW5jUXVldWUucnVuVGFzayhmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IHN0YXRpY0ZpbGVzQnlBcmNoID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgICAgY29uc3QgeyBjb25maWdKc29uIH0gPSBfX21ldGVvcl9ib290c3RyYXBfXztcbiAgICAgIGNvbnN0IGNsaWVudEFyY2hzID1cbiAgICAgICAgY29uZmlnSnNvbi5jbGllbnRBcmNocyB8fCBPYmplY3Qua2V5cyhjb25maWdKc29uLmNsaWVudFBhdGhzKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY2xpZW50QXJjaHMuZm9yRWFjaChhcmNoID0+IHtcbiAgICAgICAgICBnZW5lcmF0ZUNsaWVudFByb2dyYW0oYXJjaCwgc3RhdGljRmlsZXNCeUFyY2gpO1xuICAgICAgICB9KTtcbiAgICAgICAgV2ViQXBwSW50ZXJuYWxzLnN0YXRpY0ZpbGVzQnlBcmNoID0gc3RhdGljRmlsZXNCeUFyY2g7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIExvZy5lcnJvcignRXJyb3IgcmVsb2FkaW5nIHRoZSBjbGllbnQgcHJvZ3JhbTogJyArIGUuc3RhY2spO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gUGF1c2UgYW55IGluY29taW5nIHJlcXVlc3RzIGFuZCBtYWtlIHRoZW0gd2FpdCBmb3IgdGhlIHByb2dyYW0gdG8gYmVcbiAgLy8gdW5wYXVzZWQgdGhlIG5leHQgdGltZSBnZW5lcmF0ZUNsaWVudFByb2dyYW0oYXJjaCkgaXMgY2FsbGVkLlxuICBXZWJBcHBJbnRlcm5hbHMucGF1c2VDbGllbnQgPSBhc3luYyBmdW5jdGlvbihhcmNoKSB7XG4gICAgYXdhaXQgc3luY1F1ZXVlLnJ1blRhc2soKCkgPT4ge1xuICAgICAgY29uc3QgcHJvZ3JhbSA9IFdlYkFwcC5jbGllbnRQcm9ncmFtc1thcmNoXTtcbiAgICAgIGNvbnN0IHsgdW5wYXVzZSB9ID0gcHJvZ3JhbTtcbiAgICAgIHByb2dyYW0ucGF1c2VkID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgdW5wYXVzZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIC8vIElmIHRoZXJlIGhhcHBlbnMgdG8gYmUgYW4gZXhpc3RpbmcgcHJvZ3JhbS51bnBhdXNlIGZ1bmN0aW9uLFxuICAgICAgICAgIC8vIGNvbXBvc2UgaXQgd2l0aCB0aGUgcmVzb2x2ZSBmdW5jdGlvbi5cbiAgICAgICAgICBwcm9ncmFtLnVucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHVucGF1c2UoKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2dyYW0udW5wYXVzZSA9IHJlc29sdmU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIFdlYkFwcEludGVybmFscy5nZW5lcmF0ZUNsaWVudFByb2dyYW0gPSBhc3luYyBmdW5jdGlvbihhcmNoKSB7XG4gICAgYXdhaXQgc3luY1F1ZXVlLnJ1blRhc2soKCkgPT4gZ2VuZXJhdGVDbGllbnRQcm9ncmFtKGFyY2gpKTtcbiAgfTtcblxuICBmdW5jdGlvbiBnZW5lcmF0ZUNsaWVudFByb2dyYW0oXG4gICAgYXJjaCxcbiAgICBzdGF0aWNGaWxlc0J5QXJjaCA9IFdlYkFwcEludGVybmFscy5zdGF0aWNGaWxlc0J5QXJjaFxuICApIHtcbiAgICBjb25zdCBjbGllbnREaXIgPSBwYXRoSm9pbihcbiAgICAgIHBhdGhEaXJuYW1lKF9fbWV0ZW9yX2Jvb3RzdHJhcF9fLnNlcnZlckRpciksXG4gICAgICBhcmNoXG4gICAgKTtcblxuICAgIC8vIHJlYWQgdGhlIGNvbnRyb2wgZm9yIHRoZSBjbGllbnQgd2UnbGwgYmUgc2VydmluZyB1cFxuICAgIGNvbnN0IHByb2dyYW1Kc29uUGF0aCA9IHBhdGhKb2luKGNsaWVudERpciwgJ3Byb2dyYW0uanNvbicpO1xuXG4gICAgbGV0IHByb2dyYW1Kc29uO1xuICAgIHRyeSB7XG4gICAgICBwcm9ncmFtSnNvbiA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKHByb2dyYW1Kc29uUGF0aCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlLmNvZGUgPT09ICdFTk9FTlQnKSByZXR1cm47XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIGlmIChwcm9ncmFtSnNvbi5mb3JtYXQgIT09ICd3ZWItcHJvZ3JhbS1wcmUxJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnVW5zdXBwb3J0ZWQgZm9ybWF0IGZvciBjbGllbnQgYXNzZXRzOiAnICtcbiAgICAgICAgICBKU09OLnN0cmluZ2lmeShwcm9ncmFtSnNvbi5mb3JtYXQpXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICghcHJvZ3JhbUpzb25QYXRoIHx8ICFjbGllbnREaXIgfHwgIXByb2dyYW1Kc29uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NsaWVudCBjb25maWcgZmlsZSBub3QgcGFyc2VkLicpO1xuICAgIH1cblxuICAgIGFyY2hQYXRoW2FyY2hdID0gY2xpZW50RGlyO1xuICAgIGNvbnN0IHN0YXRpY0ZpbGVzID0gKHN0YXRpY0ZpbGVzQnlBcmNoW2FyY2hdID0gT2JqZWN0LmNyZWF0ZShudWxsKSk7XG5cbiAgICBjb25zdCB7IG1hbmlmZXN0IH0gPSBwcm9ncmFtSnNvbjtcbiAgICBtYW5pZmVzdC5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgaWYgKGl0ZW0udXJsICYmIGl0ZW0ud2hlcmUgPT09ICdjbGllbnQnKSB7XG4gICAgICAgIHN0YXRpY0ZpbGVzW2dldEl0ZW1QYXRobmFtZShpdGVtLnVybCldID0ge1xuICAgICAgICAgIGFic29sdXRlUGF0aDogcGF0aEpvaW4oY2xpZW50RGlyLCBpdGVtLnBhdGgpLFxuICAgICAgICAgIGNhY2hlYWJsZTogaXRlbS5jYWNoZWFibGUsXG4gICAgICAgICAgaGFzaDogaXRlbS5oYXNoLFxuICAgICAgICAgIC8vIExpbmsgZnJvbSBzb3VyY2UgdG8gaXRzIG1hcFxuICAgICAgICAgIHNvdXJjZU1hcFVybDogaXRlbS5zb3VyY2VNYXBVcmwsXG4gICAgICAgICAgdHlwZTogaXRlbS50eXBlLFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChpdGVtLnNvdXJjZU1hcCkge1xuICAgICAgICAgIC8vIFNlcnZlIHRoZSBzb3VyY2UgbWFwIHRvbywgdW5kZXIgdGhlIHNwZWNpZmllZCBVUkwuIFdlIGFzc3VtZVxuICAgICAgICAgIC8vIGFsbCBzb3VyY2UgbWFwcyBhcmUgY2FjaGVhYmxlLlxuICAgICAgICAgIHN0YXRpY0ZpbGVzW2dldEl0ZW1QYXRobmFtZShpdGVtLnNvdXJjZU1hcFVybCldID0ge1xuICAgICAgICAgICAgYWJzb2x1dGVQYXRoOiBwYXRoSm9pbihjbGllbnREaXIsIGl0ZW0uc291cmNlTWFwKSxcbiAgICAgICAgICAgIGNhY2hlYWJsZTogdHJ1ZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCB7IFBVQkxJQ19TRVRUSU5HUyB9ID0gX19tZXRlb3JfcnVudGltZV9jb25maWdfXztcbiAgICBjb25zdCBjb25maWdPdmVycmlkZXMgPSB7XG4gICAgICBQVUJMSUNfU0VUVElOR1MsXG4gICAgfTtcblxuICAgIGNvbnN0IG9sZFByb2dyYW0gPSBXZWJBcHAuY2xpZW50UHJvZ3JhbXNbYXJjaF07XG4gICAgY29uc3QgbmV3UHJvZ3JhbSA9IChXZWJBcHAuY2xpZW50UHJvZ3JhbXNbYXJjaF0gPSB7XG4gICAgICBmb3JtYXQ6ICd3ZWItcHJvZ3JhbS1wcmUxJyxcbiAgICAgIG1hbmlmZXN0OiBtYW5pZmVzdCxcbiAgICAgIC8vIFVzZSBhcnJvdyBmdW5jdGlvbnMgc28gdGhhdCB0aGVzZSB2ZXJzaW9ucyBjYW4gYmUgbGF6aWx5XG4gICAgICAvLyBjYWxjdWxhdGVkIGxhdGVyLCBhbmQgc28gdGhhdCB0aGV5IHdpbGwgbm90IGJlIGluY2x1ZGVkIGluIHRoZVxuICAgICAgLy8gc3RhdGljRmlsZXNbbWFuaWZlc3RVcmxdLmNvbnRlbnQgc3RyaW5nIGJlbG93LlxuICAgICAgLy9cbiAgICAgIC8vIE5vdGU6IHRoZXNlIHZlcnNpb24gY2FsY3VsYXRpb25zIG11c3QgYmUga2VwdCBpbiBhZ3JlZW1lbnQgd2l0aFxuICAgICAgLy8gQ29yZG92YUJ1aWxkZXIjYXBwZW5kVmVyc2lvbiBpbiB0b29scy9jb3Jkb3ZhL2J1aWxkZXIuanMsIG9yIGhvdFxuICAgICAgLy8gY29kZSBwdXNoIHdpbGwgcmVsb2FkIENvcmRvdmEgYXBwcyB1bm5lY2Vzc2FyaWx5LlxuICAgICAgdmVyc2lvbjogKCkgPT5cbiAgICAgICAgV2ViQXBwSGFzaGluZy5jYWxjdWxhdGVDbGllbnRIYXNoKG1hbmlmZXN0LCBudWxsLCBjb25maWdPdmVycmlkZXMpLFxuICAgICAgdmVyc2lvblJlZnJlc2hhYmxlOiAoKSA9PlxuICAgICAgICBXZWJBcHBIYXNoaW5nLmNhbGN1bGF0ZUNsaWVudEhhc2goXG4gICAgICAgICAgbWFuaWZlc3QsXG4gICAgICAgICAgdHlwZSA9PiB0eXBlID09PSAnY3NzJyxcbiAgICAgICAgICBjb25maWdPdmVycmlkZXNcbiAgICAgICAgKSxcbiAgICAgIHZlcnNpb25Ob25SZWZyZXNoYWJsZTogKCkgPT5cbiAgICAgICAgV2ViQXBwSGFzaGluZy5jYWxjdWxhdGVDbGllbnRIYXNoKFxuICAgICAgICAgIG1hbmlmZXN0LFxuICAgICAgICAgICh0eXBlLCByZXBsYWNlYWJsZSkgPT4gdHlwZSAhPT0gJ2NzcycgJiYgIXJlcGxhY2VhYmxlLFxuICAgICAgICAgIGNvbmZpZ092ZXJyaWRlc1xuICAgICAgICApLFxuICAgICAgdmVyc2lvblJlcGxhY2VhYmxlOiAoKSA9PlxuICAgICAgICBXZWJBcHBIYXNoaW5nLmNhbGN1bGF0ZUNsaWVudEhhc2goXG4gICAgICAgICAgbWFuaWZlc3QsXG4gICAgICAgICAgKF90eXBlLCByZXBsYWNlYWJsZSkgPT4gcmVwbGFjZWFibGUsXG4gICAgICAgICAgY29uZmlnT3ZlcnJpZGVzXG4gICAgICAgICksXG4gICAgICBjb3Jkb3ZhQ29tcGF0aWJpbGl0eVZlcnNpb25zOiBwcm9ncmFtSnNvbi5jb3Jkb3ZhQ29tcGF0aWJpbGl0eVZlcnNpb25zLFxuICAgICAgUFVCTElDX1NFVFRJTkdTLFxuICAgICAgaG1yVmVyc2lvbjogcHJvZ3JhbUpzb24uaG1yVmVyc2lvbixcbiAgICB9KTtcblxuICAgIC8vIEV4cG9zZSBwcm9ncmFtIGRldGFpbHMgYXMgYSBzdHJpbmcgcmVhY2hhYmxlIHZpYSB0aGUgZm9sbG93aW5nIFVSTC5cbiAgICBjb25zdCBtYW5pZmVzdFVybFByZWZpeCA9ICcvX18nICsgYXJjaC5yZXBsYWNlKC9ed2ViXFwuLywgJycpO1xuICAgIGNvbnN0IG1hbmlmZXN0VXJsID0gbWFuaWZlc3RVcmxQcmVmaXggKyBnZXRJdGVtUGF0aG5hbWUoJy9tYW5pZmVzdC5qc29uJyk7XG5cbiAgICBzdGF0aWNGaWxlc1ttYW5pZmVzdFVybF0gPSAoKSA9PiB7XG4gICAgICBpZiAoUGFja2FnZS5hdXRvdXBkYXRlKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBBVVRPVVBEQVRFX1ZFUlNJT04gPSBQYWNrYWdlLmF1dG91cGRhdGUuQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvbixcbiAgICAgICAgfSA9IHByb2Nlc3MuZW52O1xuXG4gICAgICAgIGlmIChBVVRPVVBEQVRFX1ZFUlNJT04pIHtcbiAgICAgICAgICBuZXdQcm9ncmFtLnZlcnNpb24gPSBBVVRPVVBEQVRFX1ZFUlNJT047XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBuZXdQcm9ncmFtLnZlcnNpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgbmV3UHJvZ3JhbS52ZXJzaW9uID0gbmV3UHJvZ3JhbS52ZXJzaW9uKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbnRlbnQ6IEpTT04uc3RyaW5naWZ5KG5ld1Byb2dyYW0pLFxuICAgICAgICBjYWNoZWFibGU6IGZhbHNlLFxuICAgICAgICBoYXNoOiBuZXdQcm9ncmFtLnZlcnNpb24sXG4gICAgICAgIHR5cGU6ICdqc29uJyxcbiAgICAgIH07XG4gICAgfTtcblxuICAgIGdlbmVyYXRlQm9pbGVycGxhdGVGb3JBcmNoKGFyY2gpO1xuXG4gICAgLy8gSWYgdGhlcmUgYXJlIGFueSByZXF1ZXN0cyB3YWl0aW5nIG9uIG9sZFByb2dyYW0ucGF1c2VkLCBsZXQgdGhlbVxuICAgIC8vIGNvbnRpbnVlIG5vdyAodXNpbmcgdGhlIG5ldyBwcm9ncmFtKS5cbiAgICBpZiAob2xkUHJvZ3JhbSAmJiBvbGRQcm9ncmFtLnBhdXNlZCkge1xuICAgICAgb2xkUHJvZ3JhbS51bnBhdXNlKCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZGVmYXVsdE9wdGlvbnNGb3JBcmNoID0ge1xuICAgICd3ZWIuY29yZG92YSc6IHtcbiAgICAgIHJ1bnRpbWVDb25maWdPdmVycmlkZXM6IHtcbiAgICAgICAgLy8gWFhYIFdlIHVzZSBhYnNvbHV0ZVVybCgpIGhlcmUgc28gdGhhdCB3ZSBzZXJ2ZSBodHRwczovL1xuICAgICAgICAvLyBVUkxzIHRvIGNvcmRvdmEgY2xpZW50cyBpZiBmb3JjZS1zc2wgaXMgaW4gdXNlLiBJZiB3ZSB3ZXJlXG4gICAgICAgIC8vIHRvIHVzZSBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMIGluc3RlYWQgb2ZcbiAgICAgICAgLy8gYWJzb2x1dGVVcmwoKSwgdGhlbiBDb3Jkb3ZhIGNsaWVudHMgd291bGQgaW1tZWRpYXRlbHkgZ2V0IGFcbiAgICAgICAgLy8gSENQIHNldHRpbmcgdGhlaXIgRERQX0RFRkFVTFRfQ09OTkVDVElPTl9VUkwgdG9cbiAgICAgICAgLy8gaHR0cDovL2V4YW1wbGUubWV0ZW9yLmNvbS4gVGhpcyBicmVha3MgdGhlIGFwcCwgYmVjYXVzZVxuICAgICAgICAvLyBmb3JjZS1zc2wgZG9lc24ndCBzZXJ2ZSBDT1JTIGhlYWRlcnMgb24gMzAyXG4gICAgICAgIC8vIHJlZGlyZWN0cy4gKFBsdXMgaXQncyB1bmRlc2lyYWJsZSB0byBoYXZlIGNsaWVudHNcbiAgICAgICAgLy8gY29ubmVjdGluZyB0byBodHRwOi8vZXhhbXBsZS5tZXRlb3IuY29tIHdoZW4gZm9yY2Utc3NsIGlzXG4gICAgICAgIC8vIGluIHVzZS4pXG4gICAgICAgIEREUF9ERUZBVUxUX0NPTk5FQ1RJT05fVVJMOlxuICAgICAgICAgIHByb2Nlc3MuZW52Lk1PQklMRV9ERFBfVVJMIHx8IE1ldGVvci5hYnNvbHV0ZVVybCgpLFxuICAgICAgICBST09UX1VSTDogcHJvY2Vzcy5lbnYuTU9CSUxFX1JPT1RfVVJMIHx8IE1ldGVvci5hYnNvbHV0ZVVybCgpLFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgJ3dlYi5icm93c2VyJzoge1xuICAgICAgcnVudGltZUNvbmZpZ092ZXJyaWRlczoge1xuICAgICAgICBpc01vZGVybjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcblxuICAgICd3ZWIuYnJvd3Nlci5sZWdhY3knOiB7XG4gICAgICBydW50aW1lQ29uZmlnT3ZlcnJpZGVzOiB7XG4gICAgICAgIGlzTW9kZXJuOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcblxuICBXZWJBcHBJbnRlcm5hbHMuZ2VuZXJhdGVCb2lsZXJwbGF0ZSA9IGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgIC8vIFRoaXMgYm9pbGVycGxhdGUgd2lsbCBiZSBzZXJ2ZWQgdG8gdGhlIG1vYmlsZSBkZXZpY2VzIHdoZW4gdXNlZCB3aXRoXG4gICAgLy8gTWV0ZW9yL0NvcmRvdmEgZm9yIHRoZSBIb3QtQ29kZSBQdXNoIGFuZCBzaW5jZSB0aGUgZmlsZSB3aWxsIGJlIHNlcnZlZCBieVxuICAgIC8vIHRoZSBkZXZpY2UncyBzZXJ2ZXIsIGl0IGlzIGltcG9ydGFudCB0byBzZXQgdGhlIEREUCB1cmwgdG8gdGhlIGFjdHVhbFxuICAgIC8vIE1ldGVvciBzZXJ2ZXIgYWNjZXB0aW5nIEREUCBjb25uZWN0aW9ucyBhbmQgbm90IHRoZSBkZXZpY2UncyBmaWxlIHNlcnZlci5cbiAgICBhd2FpdCBzeW5jUXVldWUucnVuVGFzayhmdW5jdGlvbigpIHtcbiAgICAgIE9iamVjdC5rZXlzKFdlYkFwcC5jbGllbnRQcm9ncmFtcykuZm9yRWFjaChnZW5lcmF0ZUJvaWxlcnBsYXRlRm9yQXJjaCk7XG4gICAgfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2VuZXJhdGVCb2lsZXJwbGF0ZUZvckFyY2goYXJjaCkge1xuICAgIGNvbnN0IHByb2dyYW0gPSBXZWJBcHAuY2xpZW50UHJvZ3JhbXNbYXJjaF07XG4gICAgY29uc3QgYWRkaXRpb25hbE9wdGlvbnMgPSBkZWZhdWx0T3B0aW9uc0ZvckFyY2hbYXJjaF0gfHwge307XG4gICAgY29uc3QgeyBiYXNlRGF0YSB9ID0gKGJvaWxlcnBsYXRlQnlBcmNoW1xuICAgICAgYXJjaFxuICAgIF0gPSBXZWJBcHBJbnRlcm5hbHMuZ2VuZXJhdGVCb2lsZXJwbGF0ZUluc3RhbmNlKFxuICAgICAgYXJjaCxcbiAgICAgIHByb2dyYW0ubWFuaWZlc3QsXG4gICAgICBhZGRpdGlvbmFsT3B0aW9uc1xuICAgICkpO1xuICAgIC8vIFdlIG5lZWQgdGhlIHJ1bnRpbWUgY29uZmlnIHdpdGggb3ZlcnJpZGVzIGZvciBtZXRlb3JfcnVudGltZV9jb25maWcuanM6XG4gICAgcHJvZ3JhbS5tZXRlb3JSdW50aW1lQ29uZmlnID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgLi4uX19tZXRlb3JfcnVudGltZV9jb25maWdfXyxcbiAgICAgIC4uLihhZGRpdGlvbmFsT3B0aW9ucy5ydW50aW1lQ29uZmlnT3ZlcnJpZGVzIHx8IG51bGwpLFxuICAgIH0pO1xuICAgIHByb2dyYW0ucmVmcmVzaGFibGVBc3NldHMgPSBiYXNlRGF0YS5jc3MubWFwKGZpbGUgPT4gKHtcbiAgICAgIHVybDogYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2soZmlsZS51cmwpLFxuICAgIH0pKTtcbiAgfVxuXG4gIGF3YWl0IFdlYkFwcEludGVybmFscy5yZWxvYWRDbGllbnRQcm9ncmFtcygpO1xuXG4gIC8vIHdlYnNlcnZlclxuICB2YXIgYXBwID0gY3JlYXRlRXhwcmVzc0FwcCgpXG5cbiAgLy8gUGFja2FnZXMgYW5kIGFwcHMgY2FuIGFkZCBoYW5kbGVycyB0aGF0IHJ1biBiZWZvcmUgYW55IG90aGVyIE1ldGVvclxuICAvLyBoYW5kbGVycyB2aWEgV2ViQXBwLnJhd0V4cHJlc3NIYW5kbGVycy5cbiAgdmFyIHJhd0V4cHJlc3NIYW5kbGVycyA9IGNyZWF0ZUV4cHJlc3NBcHAoKVxuICBhcHAudXNlKHJhd0V4cHJlc3NIYW5kbGVycyk7XG5cbiAgLy8gQXV0by1jb21wcmVzcyBhbnkganNvbiwgamF2YXNjcmlwdCwgb3IgdGV4dC5cbiAgYXBwLnVzZShjb21wcmVzcyh7IGZpbHRlcjogc2hvdWxkQ29tcHJlc3MgfSkpO1xuXG4gIC8vIHBhcnNlIGNvb2tpZXMgaW50byBhbiBvYmplY3RcbiAgYXBwLnVzZShjb29raWVQYXJzZXIoKSk7XG5cbiAgLy8gV2UncmUgbm90IGEgcHJveHk7IHJlamVjdCAod2l0aG91dCBjcmFzaGluZykgYXR0ZW1wdHMgdG8gdHJlYXQgdXMgbGlrZVxuICAvLyBvbmUuIChTZWUgIzEyMTIuKVxuICBhcHAudXNlKGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgaWYgKFJvdXRlUG9saWN5LmlzVmFsaWRVcmwocmVxLnVybCkpIHtcbiAgICAgIG5leHQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVzLndyaXRlSGVhZCg0MDApO1xuICAgIHJlcy53cml0ZSgnTm90IGEgcHJveHknKTtcbiAgICByZXMuZW5kKCk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGdldFBhdGhQYXJ0cyhwYXRoKSB7XG4gICAgY29uc3QgcGFydHMgPSBwYXRoLnNwbGl0KCcvJyk7XG4gICAgd2hpbGUgKHBhcnRzWzBdID09PSAnJykgcGFydHMuc2hpZnQoKTtcbiAgICByZXR1cm4gcGFydHM7XG4gIH1cblxuICBmdW5jdGlvbiBpc1ByZWZpeE9mKHByZWZpeCwgYXJyYXkpIHtcbiAgICByZXR1cm4gKFxuICAgICAgcHJlZml4Lmxlbmd0aCA8PSBhcnJheS5sZW5ndGggJiZcbiAgICAgIHByZWZpeC5ldmVyeSgocGFydCwgaSkgPT4gcGFydCA9PT0gYXJyYXlbaV0pXG4gICAgKTtcbiAgfVxuXG4gIC8vIFN0cmlwIG9mZiB0aGUgcGF0aCBwcmVmaXgsIGlmIGl0IGV4aXN0cy5cbiAgYXBwLnVzZShmdW5jdGlvbihyZXF1ZXN0LCByZXNwb25zZSwgbmV4dCkge1xuICAgIGNvbnN0IHBhdGhQcmVmaXggPSBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYO1xuICAgIGNvbnN0IHsgcGF0aG5hbWUsIHNlYXJjaCB9ID0gcGFyc2VVcmwocmVxdWVzdC51cmwpO1xuXG4gICAgLy8gY2hlY2sgaWYgdGhlIHBhdGggaW4gdGhlIHVybCBzdGFydHMgd2l0aCB0aGUgcGF0aCBwcmVmaXhcbiAgICBpZiAocGF0aFByZWZpeCkge1xuICAgICAgY29uc3QgcHJlZml4UGFydHMgPSBnZXRQYXRoUGFydHMocGF0aFByZWZpeCk7XG4gICAgICBjb25zdCBwYXRoUGFydHMgPSBnZXRQYXRoUGFydHMocGF0aG5hbWUpO1xuICAgICAgaWYgKGlzUHJlZml4T2YocHJlZml4UGFydHMsIHBhdGhQYXJ0cykpIHtcbiAgICAgICAgcmVxdWVzdC51cmwgPSAnLycgKyBwYXRoUGFydHMuc2xpY2UocHJlZml4UGFydHMubGVuZ3RoKS5qb2luKCcvJyk7XG4gICAgICAgIGlmIChzZWFyY2gpIHtcbiAgICAgICAgICByZXF1ZXN0LnVybCArPSBzZWFyY2g7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocGF0aG5hbWUgPT09ICcvZmF2aWNvbi5pY28nIHx8IHBhdGhuYW1lID09PSAnL3JvYm90cy50eHQnKSB7XG4gICAgICByZXR1cm4gbmV4dCgpO1xuICAgIH1cblxuICAgIGlmIChwYXRoUHJlZml4KSB7XG4gICAgICByZXNwb25zZS53cml0ZUhlYWQoNDA0KTtcbiAgICAgIHJlc3BvbnNlLndyaXRlKCdVbmtub3duIHBhdGgnKTtcbiAgICAgIHJlc3BvbnNlLmVuZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG5leHQoKTtcbiAgfSk7XG5cbiAgLy8gU2VydmUgc3RhdGljIGZpbGVzIGZyb20gdGhlIG1hbmlmZXN0LlxuICAvLyBUaGlzIGlzIGluc3BpcmVkIGJ5IHRoZSAnc3RhdGljJyBtaWRkbGV3YXJlLlxuICBhcHAudXNlKGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgLy8gY29uc29sZS5sb2coU3RyaW5nKGFyZ3VtZW50cy5jYWxsZWUpKTtcbiAgICBXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNNaWRkbGV3YXJlKFxuICAgICAgV2ViQXBwSW50ZXJuYWxzLnN0YXRpY0ZpbGVzQnlBcmNoLFxuICAgICAgcmVxLFxuICAgICAgcmVzLFxuICAgICAgbmV4dFxuICAgICk7XG4gIH0pO1xuXG4gIC8vIENvcmUgTWV0ZW9yIHBhY2thZ2VzIGxpa2UgZHluYW1pYy1pbXBvcnQgY2FuIGFkZCBoYW5kbGVycyBiZWZvcmVcbiAgLy8gb3RoZXIgaGFuZGxlcnMgYWRkZWQgYnkgcGFja2FnZSBhbmQgYXBwbGljYXRpb24gY29kZS5cbiAgYXBwLnVzZSgoV2ViQXBwSW50ZXJuYWxzLm1ldGVvckludGVybmFsSGFuZGxlcnMgPSBjcmVhdGVFeHByZXNzQXBwKCkpKTtcblxuICAvKipcbiAgICogQG5hbWUgZXhwcmVzc0hhbmRsZXJzQ2FsbGJhY2socmVxLCByZXMsIG5leHQpXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQGlzcHJvdG90eXBlIHRydWVcbiAgICogQHN1bW1hcnkgY2FsbGJhY2sgaGFuZGxlciBmb3IgYFdlYkFwcC5leHByZXNzSGFuZGxlcnNgXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXFcbiAgICogYSBOb2RlLmpzXG4gICAqIFtJbmNvbWluZ01lc3NhZ2VdKGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvaHR0cC5odG1sI2NsYXNzLWh0dHBpbmNvbWluZ21lc3NhZ2UpXG4gICAqIG9iamVjdCB3aXRoIHNvbWUgZXh0cmEgcHJvcGVydGllcy4gVGhpcyBhcmd1bWVudCBjYW4gYmUgdXNlZFxuICAgKiAgdG8gZ2V0IGluZm9ybWF0aW9uIGFib3V0IHRoZSBpbmNvbWluZyByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVzXG4gICAqIGEgTm9kZS5qc1xuICAgKiBbU2VydmVyUmVzcG9uc2VdKGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvaHR0cC5odG1sI2NsYXNzLWh0dHBzZXJ2ZXJyZXNwb25zZSlcbiAgICogb2JqZWN0LiBVc2UgdGhpcyB0byB3cml0ZSBkYXRhIHRoYXQgc2hvdWxkIGJlIHNlbnQgaW4gcmVzcG9uc2UgdG8gdGhlXG4gICAqIHJlcXVlc3QsIGFuZCBjYWxsIGByZXMuZW5kKClgIHdoZW4geW91IGFyZSBkb25lLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gICAqIENhbGxpbmcgdGhpcyBmdW5jdGlvbiB3aWxsIHBhc3Mgb24gdGhlIGhhbmRsaW5nIG9mXG4gICAqIHRoaXMgcmVxdWVzdCB0byB0aGUgbmV4dCByZWxldmFudCBoYW5kbGVyLlxuICAgKlxuICAgKi9cblxuICAvKipcbiAgICogQG1ldGhvZCBoYW5kbGVyc1xuICAgKiBAbWVtYmVyb2YgV2ViQXBwXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQHN1bW1hcnkgUmVnaXN0ZXIgYSBoYW5kbGVyIGZvciBhbGwgSFRUUCByZXF1ZXN0cy5cbiAgICogQHBhcmFtIHtTdHJpbmd9IFtwYXRoXVxuICAgKiBUaGlzIGhhbmRsZXIgd2lsbCBvbmx5IGJlIGNhbGxlZCBvbiBwYXRocyB0aGF0IG1hdGNoXG4gICAqIHRoaXMgc3RyaW5nLiBUaGUgbWF0Y2ggaGFzIHRvIGJvcmRlciBvbiBhIGAvYCBvciBhIGAuYC5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGAvaGVsbG9gIHdpbGwgbWF0Y2ggYC9oZWxsby93b3JsZGAgYW5kXG4gICAqIGAvaGVsbG8ud29ybGRgLCBidXQgbm90IGAvaGVsbG9fd29ybGRgLlxuICAgKiBAcGFyYW0ge2V4cHJlc3NIYW5kbGVyc0NhbGxiYWNrfSBoYW5kbGVyXG4gICAqIEEgaGFuZGxlciBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIG9uIEhUVFAgcmVxdWVzdHMuXG4gICAqIFNlZSBgZXhwcmVzc0hhbmRsZXJzQ2FsbGJhY2tgXG4gICAqXG4gICAqL1xuICAvLyBQYWNrYWdlcyBhbmQgYXBwcyBjYW4gYWRkIGhhbmRsZXJzIHRvIHRoaXMgdmlhIFdlYkFwcC5leHByZXNzSGFuZGxlcnMuXG4gIC8vIFRoZXkgYXJlIGluc2VydGVkIGJlZm9yZSBvdXIgZGVmYXVsdCBoYW5kbGVyLlxuICB2YXIgcGFja2FnZUFuZEFwcEhhbmRsZXJzID0gY3JlYXRlRXhwcmVzc0FwcCgpXG4gIGFwcC51c2UocGFja2FnZUFuZEFwcEhhbmRsZXJzKTtcblxuICBsZXQgc3VwcHJlc3NFeHByZXNzRXJyb3JzID0gZmFsc2U7XG4gIC8vIEV4cHJlc3Mga25vd3MgaXQgaXMgYW4gZXJyb3IgaGFuZGxlciBiZWNhdXNlIGl0IGhhcyA0IGFyZ3VtZW50cyBpbnN0ZWFkIG9mXG4gIC8vIDMuIGdvIGZpZ3VyZS4gIChJdCBpcyBub3Qgc21hcnQgZW5vdWdoIHRvIGZpbmQgc3VjaCBhIHRoaW5nIGlmIGl0J3MgaGlkZGVuXG4gIC8vIGluc2lkZSBwYWNrYWdlQW5kQXBwSGFuZGxlcnMuKVxuICBhcHAudXNlKGZ1bmN0aW9uKGVyciwgcmVxLCByZXMsIG5leHQpIHtcbiAgICBpZiAoIWVyciB8fCAhc3VwcHJlc3NFeHByZXNzRXJyb3JzIHx8ICFyZXEuaGVhZGVyc1sneC1zdXBwcmVzcy1lcnJvciddKSB7XG4gICAgICBuZXh0KGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJlcy53cml0ZUhlYWQoZXJyLnN0YXR1cywgeyAnQ29udGVudC1UeXBlJzogJ3RleHQvcGxhaW4nIH0pO1xuICAgIHJlcy5lbmQoJ0FuIGVycm9yIG1lc3NhZ2UnKTtcbiAgfSk7XG5cbiAgYXBwLnVzZShhc3luYyBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICAgIGlmICghYXBwVXJsKHJlcS51cmwpKSB7XG4gICAgICByZXR1cm4gbmV4dCgpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICByZXEubWV0aG9kICE9PSAnSEVBRCcgJiZcbiAgICAgIHJlcS5tZXRob2QgIT09ICdHRVQnICYmXG4gICAgICAhTWV0ZW9yLnNldHRpbmdzLnBhY2thZ2VzPy53ZWJhcHA/LmFsd2F5c1JldHVybkNvbnRlbnRcbiAgICApIHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHJlcS5tZXRob2QgPT09ICdPUFRJT05TJyA/IDIwMCA6IDQwNTtcbiAgICAgIHJlcy53cml0ZUhlYWQoc3RhdHVzLCB7XG4gICAgICAgIEFsbG93OiAnT1BUSU9OUywgR0VULCBIRUFEJyxcbiAgICAgICAgJ0NvbnRlbnQtTGVuZ3RoJzogJzAnLFxuICAgICAgfSk7XG4gICAgICByZXMuZW5kKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBoZWFkZXJzID0ge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ3RleHQvaHRtbDsgY2hhcnNldD11dGYtOCcsXG4gICAgICB9O1xuXG4gICAgICBpZiAoc2h1dHRpbmdEb3duKSB7XG4gICAgICAgIGhlYWRlcnNbJ0Nvbm5lY3Rpb24nXSA9ICdDbG9zZSc7XG4gICAgICB9XG5cbiAgICAgIHZhciByZXF1ZXN0ID0gV2ViQXBwLmNhdGVnb3JpemVSZXF1ZXN0KHJlcSk7XG4gICAgICB2YXIgcmVzcG9uc2UgPSByZXM7XG5cbiAgICAgIGlmIChyZXF1ZXN0LnVybC5xdWVyeSAmJiByZXF1ZXN0LnVybC5xdWVyeVsnbWV0ZW9yX2Nzc19yZXNvdXJjZSddKSB7XG4gICAgICAgIC8vIEluIHRoaXMgY2FzZSwgd2UncmUgcmVxdWVzdGluZyBhIENTUyByZXNvdXJjZSBpbiB0aGUgbWV0ZW9yLXNwZWNpZmljXG4gICAgICAgIC8vIHdheSwgYnV0IHdlIGRvbid0IGhhdmUgaXQuICBTZXJ2ZSBhIHN0YXRpYyBjc3MgZmlsZSB0aGF0IGluZGljYXRlcyB0aGF0XG4gICAgICAgIC8vIHdlIGRpZG4ndCBoYXZlIGl0LCBzbyB3ZSBjYW4gZGV0ZWN0IHRoYXQgYW5kIHJlZnJlc2guICBNYWtlIHN1cmVcbiAgICAgICAgLy8gdGhhdCBhbnkgcHJveGllcyBvciBDRE5zIGRvbid0IGNhY2hlIHRoaXMgZXJyb3IhICAoTm9ybWFsbHkgcHJveGllc1xuICAgICAgICAvLyBvciBDRE5zIGFyZSBzbWFydCBlbm91Z2ggbm90IHRvIGNhY2hlIGVycm9yIHBhZ2VzLCBidXQgaW4gb3JkZXIgdG9cbiAgICAgICAgLy8gbWFrZSB0aGlzIGhhY2sgd29yaywgd2UgbmVlZCB0byByZXR1cm4gdGhlIENTUyBmaWxlIGFzIGEgMjAwLCB3aGljaFxuICAgICAgICAvLyB3b3VsZCBvdGhlcndpc2UgYmUgY2FjaGVkLilcbiAgICAgICAgaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAndGV4dC9jc3M7IGNoYXJzZXQ9dXRmLTgnO1xuICAgICAgICBoZWFkZXJzWydDYWNoZS1Db250cm9sJ10gPSAnbm8tY2FjaGUnO1xuICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgaGVhZGVycyk7XG4gICAgICAgIHJlcy53cml0ZSgnLm1ldGVvci1jc3Mtbm90LWZvdW5kLWVycm9yIHsgd2lkdGg6IDBweDt9Jyk7XG4gICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVxdWVzdC51cmwucXVlcnkgJiYgcmVxdWVzdC51cmwucXVlcnlbJ21ldGVvcl9qc19yZXNvdXJjZSddKSB7XG4gICAgICAgIC8vIFNpbWlsYXJseSwgd2UncmUgcmVxdWVzdGluZyBhIEpTIHJlc291cmNlIHRoYXQgd2UgZG9uJ3QgaGF2ZS5cbiAgICAgICAgLy8gU2VydmUgYW4gdW5jYWNoZWQgNDA0LiAoV2UgY2FuJ3QgdXNlIHRoZSBzYW1lIGhhY2sgd2UgdXNlIGZvciBDU1MsXG4gICAgICAgIC8vIGJlY2F1c2UgYWN0dWFsbHkgYWN0aW5nIG9uIHRoYXQgaGFjayByZXF1aXJlcyB1cyB0byBoYXZlIHRoZSBKU1xuICAgICAgICAvLyBhbHJlYWR5ISlcbiAgICAgICAgaGVhZGVyc1snQ2FjaGUtQ29udHJvbCddID0gJ25vLWNhY2hlJztcbiAgICAgICAgcmVzLndyaXRlSGVhZCg0MDQsIGhlYWRlcnMpO1xuICAgICAgICByZXMuZW5kKCc0MDQgTm90IEZvdW5kJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlcXVlc3QudXJsLnF1ZXJ5ICYmIHJlcXVlc3QudXJsLnF1ZXJ5WydtZXRlb3JfZG9udF9zZXJ2ZV9pbmRleCddKSB7XG4gICAgICAgIC8vIFdoZW4gZG93bmxvYWRpbmcgZmlsZXMgZHVyaW5nIGEgQ29yZG92YSBob3QgY29kZSBwdXNoLCB3ZSBuZWVkXG4gICAgICAgIC8vIHRvIGRldGVjdCBpZiBhIGZpbGUgaXMgbm90IGF2YWlsYWJsZSBpbnN0ZWFkIG9mIGluYWR2ZXJ0ZW50bHlcbiAgICAgICAgLy8gZG93bmxvYWRpbmcgdGhlIGRlZmF1bHQgaW5kZXggcGFnZS5cbiAgICAgICAgLy8gU28gc2ltaWxhciB0byB0aGUgc2l0dWF0aW9uIGFib3ZlLCB3ZSBzZXJ2ZSBhbiB1bmNhY2hlZCA0MDQuXG4gICAgICAgIGhlYWRlcnNbJ0NhY2hlLUNvbnRyb2wnXSA9ICduby1jYWNoZSc7XG4gICAgICAgIHJlcy53cml0ZUhlYWQoNDA0LCBoZWFkZXJzKTtcbiAgICAgICAgcmVzLmVuZCgnNDA0IE5vdCBGb3VuZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgYXJjaCB9ID0gcmVxdWVzdDtcbiAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eXBlb2YgYXJjaCwgJ3N0cmluZycsIHsgYXJjaCB9KTtcblxuICAgICAgaWYgKCFoYXNPd24uY2FsbChXZWJBcHAuY2xpZW50UHJvZ3JhbXMsIGFyY2gpKSB7XG4gICAgICAgIC8vIFdlIGNvdWxkIGNvbWUgaGVyZSBpbiBjYXNlIHdlIHJ1biB3aXRoIHNvbWUgYXJjaGl0ZWN0dXJlcyBleGNsdWRlZFxuICAgICAgICBoZWFkZXJzWydDYWNoZS1Db250cm9sJ10gPSAnbm8tY2FjaGUnO1xuICAgICAgICByZXMud3JpdGVIZWFkKDQwNCwgaGVhZGVycyk7XG4gICAgICAgIGlmIChNZXRlb3IuaXNEZXZlbG9wbWVudCkge1xuICAgICAgICAgIHJlcy5lbmQoYE5vIGNsaWVudCBwcm9ncmFtIGZvdW5kIGZvciB0aGUgJHthcmNofSBhcmNoaXRlY3R1cmUuYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gU2FmZXR5IG5ldCwgYnV0IHRoaXMgYnJhbmNoIHNob3VsZCBub3QgYmUgcG9zc2libGUuXG4gICAgICAgICAgcmVzLmVuZCgnNDA0IE5vdCBGb3VuZCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgcGF1c2VDbGllbnQoYXJjaCkgaGFzIGJlZW4gY2FsbGVkLCBwcm9ncmFtLnBhdXNlZCB3aWxsIGJlIGFcbiAgICAgIC8vIFByb21pc2UgdGhhdCB3aWxsIGJlIHJlc29sdmVkIHdoZW4gdGhlIHByb2dyYW0gaXMgdW5wYXVzZWQuXG4gICAgICBhd2FpdCBXZWJBcHAuY2xpZW50UHJvZ3JhbXNbYXJjaF0ucGF1c2VkO1xuXG4gICAgICByZXR1cm4gZ2V0Qm9pbGVycGxhdGVBc3luYyhyZXF1ZXN0LCBhcmNoLCByZXNwb25zZSlcbiAgICAgICAgLnRoZW4oKHsgc3RyZWFtLCBzdGF0dXNDb2RlLCBoZWFkZXJzOiBuZXdIZWFkZXJzIH0pID0+IHtcbiAgICAgICAgICBpZiAoIXN0YXR1c0NvZGUpIHtcbiAgICAgICAgICAgIHN0YXR1c0NvZGUgPSByZXMuc3RhdHVzQ29kZSA/IHJlcy5zdGF0dXNDb2RlIDogMjAwO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChuZXdIZWFkZXJzKSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGhlYWRlcnMsIG5ld0hlYWRlcnMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlcy53cml0ZUhlYWQoc3RhdHVzQ29kZSwgaGVhZGVycyk7XG5cbiAgICAgICAgICBpZiAoIWRpc2FibGVCb2lsZXJwbGF0ZVJlc3BvbnNlKSB7XG4gICAgICAgICAgICBzdHJlYW0ucGlwZShyZXMsIHtcbiAgICAgICAgICAgICAgLy8gRW5kIHRoZSByZXNwb25zZSB3aGVuIHRoZSBzdHJlYW0gZW5kcy5cbiAgICAgICAgICAgICAgZW5kOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgIExvZy5lcnJvcignRXJyb3IgcnVubmluZyB0ZW1wbGF0ZTogJyArIGVycm9yLnN0YWNrKTtcbiAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgaGVhZGVycyk7XG4gICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFJldHVybiA0MDQgYnkgZGVmYXVsdCwgaWYgbm8gb3RoZXIgaGFuZGxlcnMgc2VydmUgdGhpcyBVUkwuXG4gIGFwcC51c2UoZnVuY3Rpb24ocmVxLCByZXMpIHtcbiAgICByZXMud3JpdGVIZWFkKDQwNCk7XG4gICAgcmVzLmVuZCgpO1xuICB9KTtcblxuICB2YXIgaHR0cFNlcnZlciA9IGNyZWF0ZVNlcnZlcihhcHApO1xuICB2YXIgb25MaXN0ZW5pbmdDYWxsYmFja3MgPSBbXTtcblxuICAvLyBBZnRlciA1IHNlY29uZHMgdy9vIGRhdGEgb24gYSBzb2NrZXQsIGtpbGwgaXQuICBPbiB0aGUgb3RoZXIgaGFuZCwgaWZcbiAgLy8gdGhlcmUncyBhbiBvdXRzdGFuZGluZyByZXF1ZXN0LCBnaXZlIGl0IGEgaGlnaGVyIHRpbWVvdXQgaW5zdGVhZCAodG8gYXZvaWRcbiAgLy8ga2lsbGluZyBsb25nLXBvbGxpbmcgcmVxdWVzdHMpXG4gIGh0dHBTZXJ2ZXIuc2V0VGltZW91dChTSE9SVF9TT0NLRVRfVElNRU9VVCk7XG5cbiAgLy8gRG8gdGhpcyBoZXJlLCBhbmQgdGhlbiBhbHNvIGluIGxpdmVkYXRhL3N0cmVhbV9zZXJ2ZXIuanMsIGJlY2F1c2VcbiAgLy8gc3RyZWFtX3NlcnZlci5qcyBraWxscyBhbGwgdGhlIGN1cnJlbnQgcmVxdWVzdCBoYW5kbGVycyB3aGVuIGluc3RhbGxpbmcgaXRzXG4gIC8vIG93bi5cbiAgaHR0cFNlcnZlci5vbigncmVxdWVzdCcsIFdlYkFwcC5fdGltZW91dEFkanVzdG1lbnRSZXF1ZXN0Q2FsbGJhY2spO1xuXG4gIC8vIElmIHRoZSBjbGllbnQgZ2F2ZSB1cyBhIGJhZCByZXF1ZXN0LCB0ZWxsIGl0IGluc3RlYWQgb2YganVzdCBjbG9zaW5nIHRoZVxuICAvLyBzb2NrZXQuIFRoaXMgbGV0cyBsb2FkIGJhbGFuY2VycyBpbiBmcm9udCBvZiB1cyBkaWZmZXJlbnRpYXRlIGJldHdlZW4gXCJhXG4gIC8vIHNlcnZlciBpcyByYW5kb21seSBjbG9zaW5nIHNvY2tldHMgZm9yIG5vIHJlYXNvblwiIGFuZCBcImNsaWVudCBzZW50IGEgYmFkXG4gIC8vIHJlcXVlc3RcIi5cbiAgLy9cbiAgLy8gVGhpcyB3aWxsIG9ubHkgd29yayBvbiBOb2RlIDY7IE5vZGUgNCBkZXN0cm95cyB0aGUgc29ja2V0IGJlZm9yZSBjYWxsaW5nXG4gIC8vIHRoaXMgZXZlbnQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvcHVsbC80NTU3LyBmb3IgZGV0YWlscy5cbiAgaHR0cFNlcnZlci5vbignY2xpZW50RXJyb3InLCAoZXJyLCBzb2NrZXQpID0+IHtcbiAgICAvLyBQcmUtTm9kZS02LCBkbyBub3RoaW5nLlxuICAgIGlmIChzb2NrZXQuZGVzdHJveWVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGVyci5tZXNzYWdlID09PSAnUGFyc2UgRXJyb3InKSB7XG4gICAgICBzb2NrZXQuZW5kKCdIVFRQLzEuMSA0MDAgQmFkIFJlcXVlc3RcXHJcXG5cXHJcXG4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRm9yIG90aGVyIGVycm9ycywgdXNlIHRoZSBkZWZhdWx0IGJlaGF2aW9yIGFzIGlmIHdlIGhhZCBubyBjbGllbnRFcnJvclxuICAgICAgLy8gaGFuZGxlci5cbiAgICAgIHNvY2tldC5kZXN0cm95KGVycik7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBzdXBwcmVzc0Vycm9ycyA9IGZ1bmN0aW9uKCkge1xuICAgIHN1cHByZXNzRXhwcmVzc0Vycm9ycyA9IHRydWU7XG4gIH07XG5cbiAgbGV0IHdhcm5lZEFib3V0Q29ubmVjdFVzYWdlID0gZmFsc2U7XG5cbiAgLy8gc3RhcnQgdXAgYXBwXG4gIE9iamVjdC5hc3NpZ24oV2ViQXBwLCB7XG4gICAgY29ubmVjdEhhbmRsZXJzOiBwYWNrYWdlQW5kQXBwSGFuZGxlcnMsXG4gICAgaGFuZGxlcnM6IHBhY2thZ2VBbmRBcHBIYW5kbGVycyxcbiAgICByYXdDb25uZWN0SGFuZGxlcnM6IHJhd0V4cHJlc3NIYW5kbGVycyxcbiAgICByYXdIYW5kbGVyczogcmF3RXhwcmVzc0hhbmRsZXJzLFxuICAgIGh0dHBTZXJ2ZXI6IGh0dHBTZXJ2ZXIsXG4gICAgZXhwcmVzc0FwcDogYXBwLFxuICAgIC8vIEZvciB0ZXN0aW5nLlxuICAgIHN1cHByZXNzQ29ubmVjdEVycm9yczogKCkgPT4ge1xuICAgICAgaWYgKCEgd2FybmVkQWJvdXRDb25uZWN0VXNhZ2UpIHtcbiAgICAgICAgTWV0ZW9yLl9kZWJ1ZyhcIldlYkFwcC5zdXBwcmVzc0Nvbm5lY3RFcnJvcnMgaGFzIGJlZW4gcmVuYW1lZCB0byBNZXRlb3IuX3N1cHByZXNzRXhwcmVzc0Vycm9ycyBhbmQgaXQgc2hvdWxkIGJlIHVzZWQgb25seSBpbiB0ZXN0cy5cIik7XG4gICAgICAgIHdhcm5lZEFib3V0Q29ubmVjdFVzYWdlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHN1cHByZXNzRXJyb3JzKCk7XG4gICAgfSxcbiAgICBfc3VwcHJlc3NFeHByZXNzRXJyb3JzOiBzdXBwcmVzc0Vycm9ycyxcbiAgICBvbkxpc3RlbmluZzogZnVuY3Rpb24oZikge1xuICAgICAgaWYgKG9uTGlzdGVuaW5nQ2FsbGJhY2tzKSBvbkxpc3RlbmluZ0NhbGxiYWNrcy5wdXNoKGYpO1xuICAgICAgZWxzZSBmKCk7XG4gICAgfSxcbiAgICAvLyBUaGlzIGNhbiBiZSBvdmVycmlkZGVuIGJ5IHVzZXJzIHdobyB3YW50IHRvIG1vZGlmeSBob3cgbGlzdGVuaW5nIHdvcmtzXG4gICAgLy8gKGVnLCB0byBydW4gYSBwcm94eSBsaWtlIEFwb2xsbyBFbmdpbmUgUHJveHkgaW4gZnJvbnQgb2YgdGhlIHNlcnZlcikuXG4gICAgc3RhcnRMaXN0ZW5pbmc6IGZ1bmN0aW9uKGh0dHBTZXJ2ZXIsIGxpc3Rlbk9wdGlvbnMsIGNiKSB7XG4gICAgICBodHRwU2VydmVyLmxpc3RlbihsaXN0ZW5PcHRpb25zLCBjYik7XG4gICAgfSxcbiAgfSk7XG5cbiAgICAvKipcbiAgICogQG5hbWUgbWFpblxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBzdW1tYXJ5IFN0YXJ0cyB0aGUgSFRUUCBzZXJ2ZXIuXG4gICAqICBJZiBgVU5JWF9TT0NLRVRfUEFUSGAgaXMgcHJlc2VudCBNZXRlb3IncyBIVFRQIHNlcnZlciB3aWxsIHVzZSB0aGF0IHNvY2tldCBmaWxlIGZvciBpbnRlci1wcm9jZXNzIGNvbW11bmljYXRpb24sIGluc3RlYWQgb2YgVENQLlxuICAgKiBJZiB5b3UgY2hvb3NlIHRvIG5vdCBpbmNsdWRlIHdlYmFwcCBwYWNrYWdlIGluIHlvdXIgYXBwbGljYXRpb24gdGhpcyBtZXRob2Qgc3RpbGwgbXVzdCBiZSBkZWZpbmVkIGZvciB5b3VyIE1ldGVvciBhcHBsaWNhdGlvbiB0byB3b3JrLlxuICAgKi9cbiAgLy8gTGV0IHRoZSByZXN0IG9mIHRoZSBwYWNrYWdlcyAoYW5kIE1ldGVvci5zdGFydHVwIGhvb2tzKSBpbnNlcnQgRXhwcmVzc1xuICAvLyBtaWRkbGV3YXJlcyBhbmQgdXBkYXRlIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18sIHRoZW4ga2VlcCBnb2luZyB0byBzZXQgdXBcbiAgLy8gYWN0dWFsbHkgc2VydmluZyBIVE1MLlxuICBleHBvcnRzLm1haW4gPSBhc3luYyBhcmd2ID0+IHtcbiAgICBhd2FpdCBXZWJBcHBJbnRlcm5hbHMuZ2VuZXJhdGVCb2lsZXJwbGF0ZSgpO1xuXG4gICAgY29uc3Qgc3RhcnRIdHRwU2VydmVyID0gbGlzdGVuT3B0aW9ucyA9PiB7XG4gICAgICBXZWJBcHAuc3RhcnRMaXN0ZW5pbmcoXG4gICAgICAgIGFyZ3Y/Lmh0dHBTZXJ2ZXIgfHwgaHR0cFNlcnZlcixcbiAgICAgICAgbGlzdGVuT3B0aW9ucyxcbiAgICAgICAgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChcbiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTUVURU9SX1BSSU5UX09OX0xJU1RFTikge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTElTVEVOSU5HJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBvbkxpc3RlbmluZ0NhbGxiYWNrcztcbiAgICAgICAgICAgIG9uTGlzdGVuaW5nQ2FsbGJhY2tzID0gbnVsbDtcbiAgICAgICAgICAgIGNhbGxiYWNrcz8uZm9yRWFjaChjYWxsYmFjayA9PiB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGUgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgbGlzdGVuaW5nOicsIGUpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlICYmIGUuc3RhY2spO1xuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgbGV0IGxvY2FsUG9ydCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgMDtcbiAgICBsZXQgdW5peFNvY2tldFBhdGggPSBwcm9jZXNzLmVudi5VTklYX1NPQ0tFVF9QQVRIO1xuXG4gICAgaWYgKHVuaXhTb2NrZXRQYXRoKSB7XG4gICAgICBpZiAoY2x1c3Rlci5pc1dvcmtlcikge1xuICAgICAgICBjb25zdCB3b3JrZXJOYW1lID0gY2x1c3Rlci53b3JrZXIucHJvY2Vzcy5lbnYubmFtZSB8fCBjbHVzdGVyLndvcmtlci5pZDtcbiAgICAgICAgdW5peFNvY2tldFBhdGggKz0gJy4nICsgd29ya2VyTmFtZSArICcuc29jayc7XG4gICAgICB9XG4gICAgICAvLyBTdGFydCB0aGUgSFRUUCBzZXJ2ZXIgdXNpbmcgYSBzb2NrZXQgZmlsZS5cbiAgICAgIHJlbW92ZUV4aXN0aW5nU29ja2V0RmlsZSh1bml4U29ja2V0UGF0aCk7XG4gICAgICBzdGFydEh0dHBTZXJ2ZXIoeyBwYXRoOiB1bml4U29ja2V0UGF0aCB9KTtcblxuICAgICAgY29uc3QgdW5peFNvY2tldFBlcm1pc3Npb25zID0gKFxuICAgICAgICBwcm9jZXNzLmVudi5VTklYX1NPQ0tFVF9QRVJNSVNTSU9OUyB8fCAnJ1xuICAgICAgKS50cmltKCk7XG4gICAgICBpZiAodW5peFNvY2tldFBlcm1pc3Npb25zKSB7XG4gICAgICAgIGlmICgvXlswLTddezN9JC8udGVzdCh1bml4U29ja2V0UGVybWlzc2lvbnMpKSB7XG4gICAgICAgICAgY2htb2RTeW5jKHVuaXhTb2NrZXRQYXRoLCBwYXJzZUludCh1bml4U29ja2V0UGVybWlzc2lvbnMsIDgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgVU5JWF9TT0NLRVRfUEVSTUlTU0lPTlMgc3BlY2lmaWVkJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdW5peFNvY2tldEdyb3VwID0gKHByb2Nlc3MuZW52LlVOSVhfU09DS0VUX0dST1VQIHx8ICcnKS50cmltKCk7XG4gICAgICBpZiAodW5peFNvY2tldEdyb3VwKSB7XG4gICAgICAgIGNvbnN0IHVuaXhTb2NrZXRHcm91cEluZm8gPSBnZXRHcm91cEluZm8odW5peFNvY2tldEdyb3VwKTtcbiAgICAgICAgaWYgKHVuaXhTb2NrZXRHcm91cEluZm8gPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgVU5JWF9TT0NLRVRfR1JPVVAgbmFtZSBzcGVjaWZpZWQnKTtcbiAgICAgICAgfVxuICAgICAgICBjaG93blN5bmModW5peFNvY2tldFBhdGgsIHVzZXJJbmZvKCkudWlkLCB1bml4U29ja2V0R3JvdXBJbmZvLmdpZCk7XG4gICAgICB9XG5cbiAgICAgIHJlZ2lzdGVyU29ja2V0RmlsZUNsZWFudXAodW5peFNvY2tldFBhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFBvcnQgPSBpc05hTihOdW1iZXIobG9jYWxQb3J0KSkgPyBsb2NhbFBvcnQgOiBOdW1iZXIobG9jYWxQb3J0KTtcbiAgICAgIGlmICgvXFxcXFxcXFw/LitcXFxccGlwZVxcXFw/LisvLnRlc3QobG9jYWxQb3J0KSkge1xuICAgICAgICAvLyBTdGFydCB0aGUgSFRUUCBzZXJ2ZXIgdXNpbmcgV2luZG93cyBTZXJ2ZXIgc3R5bGUgbmFtZWQgcGlwZS5cbiAgICAgICAgc3RhcnRIdHRwU2VydmVyKHsgcGF0aDogbG9jYWxQb3J0IH0pO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbG9jYWxQb3J0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBTdGFydCB0aGUgSFRUUCBzZXJ2ZXIgdXNpbmcgVENQLlxuICAgICAgICBzdGFydEh0dHBTZXJ2ZXIoe1xuICAgICAgICAgIHBvcnQ6IGxvY2FsUG9ydCxcbiAgICAgICAgICBob3N0OiBwcm9jZXNzLmVudi5CSU5EX0lQIHx8ICcwLjAuMC4wJyxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgUE9SVCBzcGVjaWZpZWQnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gJ0RBRU1PTic7XG4gIH07XG59XG5cbmNvbnN0IGlzR2V0ZW50QXZhaWxhYmxlID0gKCkgPT4ge1xuICB0cnkge1xuICAgIGV4ZWNTeW5jKCd3aGljaCBnZXRlbnQnKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG5jb25zdCBnZXRHcm91cEluZm9Vc2luZ0dldGVudCA9IChncm91cE5hbWUpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGRvdXQgPSBleGVjU3luYyhgZ2V0ZW50IGdyb3VwICR7Z3JvdXBOYW1lfWAsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICBpZiAoIXN0ZG91dCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgW25hbWUsICwgZ2lkXSA9IHN0ZG91dC50cmltKCkuc3BsaXQoJzonKTtcbiAgICBpZiAobmFtZSA9PSBudWxsIHx8IGdpZCA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4geyBuYW1lLCBnaWQ6IE51bWJlcihnaWQpIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG5cbmNvbnN0IGdldEdyb3VwSW5mb0Zyb21GaWxlID0gKGdyb3VwTmFtZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGRhdGEgPSByZWFkRmlsZVN5bmMoJy9ldGMvZ3JvdXAnLCAndXRmOCcpO1xuICAgIGNvbnN0IGdyb3VwTGluZSA9IGRhdGEudHJpbSgpLnNwbGl0KCdcXG4nKS5maW5kKGxpbmUgPT4gbGluZS5zdGFydHNXaXRoKGAke2dyb3VwTmFtZX06YCkpO1xuICAgIGlmICghZ3JvdXBMaW5lKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBbbmFtZSwgLCBnaWRdID0gZ3JvdXBMaW5lLnRyaW0oKS5zcGxpdCgnOicpO1xuICAgIGlmIChuYW1lID09IG51bGwgfHwgZ2lkID09IG51bGwpIHJldHVybiBudWxsO1xuICAgIHJldHVybiB7IG5hbWUsIGdpZDogTnVtYmVyKGdpZCkgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGdldEdyb3VwSW5mbyA9IChncm91cE5hbWUpID0+IHtcbiAgbGV0IGdyb3VwSW5mbyA9IGdldEdyb3VwSW5mb0Zyb21GaWxlKGdyb3VwTmFtZSk7XG4gIGlmICghZ3JvdXBJbmZvICYmIGlzR2V0ZW50QXZhaWxhYmxlKCkpIHtcbiAgICBncm91cEluZm8gPSBnZXRHcm91cEluZm9Vc2luZ0dldGVudChncm91cE5hbWUpO1xuICB9XG4gIHJldHVybiBncm91cEluZm87XG59O1xuXG52YXIgaW5saW5lU2NyaXB0c0FsbG93ZWQgPSB0cnVlO1xuXG5XZWJBcHBJbnRlcm5hbHMuaW5saW5lU2NyaXB0c0FsbG93ZWQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGlubGluZVNjcmlwdHNBbGxvd2VkO1xufTtcblxuV2ViQXBwSW50ZXJuYWxzLnNldElubGluZVNjcmlwdHNBbGxvd2VkID0gYXN5bmMgZnVuY3Rpb24odmFsdWUpIHtcbiAgaW5saW5lU2NyaXB0c0FsbG93ZWQgPSB2YWx1ZTtcbiAgYXdhaXQgV2ViQXBwSW50ZXJuYWxzLmdlbmVyYXRlQm9pbGVycGxhdGUoKTtcbn07XG5cbnZhciBzcmlNb2RlO1xuXG5XZWJBcHBJbnRlcm5hbHMuZW5hYmxlU3VicmVzb3VyY2VJbnRlZ3JpdHkgPSBhc3luYyBmdW5jdGlvbih1c2VfY3JlZGVudGlhbHMgPSBmYWxzZSkge1xuICBzcmlNb2RlID0gdXNlX2NyZWRlbnRpYWxzID8gJ3VzZS1jcmVkZW50aWFscycgOiAnYW5vbnltb3VzJztcbiAgYXdhaXQgV2ViQXBwSW50ZXJuYWxzLmdlbmVyYXRlQm9pbGVycGxhdGUoKTtcbn07XG5cbldlYkFwcEludGVybmFscy5zZXRCdW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayA9IGFzeW5jIGZ1bmN0aW9uKGhvb2tGbikge1xuICBidW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayA9IGhvb2tGbjtcbiAgYXdhaXQgV2ViQXBwSW50ZXJuYWxzLmdlbmVyYXRlQm9pbGVycGxhdGUoKTtcbn07XG5cbldlYkFwcEludGVybmFscy5zZXRCdW5kbGVkSnNDc3NQcmVmaXggPSBhc3luYyBmdW5jdGlvbihwcmVmaXgpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBhd2FpdCBzZWxmLnNldEJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rKGZ1bmN0aW9uKHVybCkge1xuICAgIHJldHVybiBwcmVmaXggKyB1cmw7XG4gIH0pO1xufTtcblxuLy8gUGFja2FnZXMgY2FuIGNhbGwgYFdlYkFwcEludGVybmFscy5hZGRTdGF0aWNKc2AgdG8gc3BlY2lmeSBzdGF0aWNcbi8vIEphdmFTY3JpcHQgdG8gYmUgaW5jbHVkZWQgaW4gdGhlIGFwcC4gVGhpcyBzdGF0aWMgSlMgd2lsbCBiZSBpbmxpbmVkLFxuLy8gdW5sZXNzIGlubGluZSBzY3JpcHRzIGhhdmUgYmVlbiBkaXNhYmxlZCwgaW4gd2hpY2ggY2FzZSBpdCB3aWxsIGJlXG4vLyBzZXJ2ZWQgdW5kZXIgYC88c2hhMSBvZiBjb250ZW50cz5gLlxudmFyIGFkZGl0aW9uYWxTdGF0aWNKcyA9IHt9O1xuV2ViQXBwSW50ZXJuYWxzLmFkZFN0YXRpY0pzID0gZnVuY3Rpb24oY29udGVudHMpIHtcbiAgYWRkaXRpb25hbFN0YXRpY0pzWycvJyArIHNoYTEoY29udGVudHMpICsgJy5qcyddID0gY29udGVudHM7XG59O1xuXG52YXIgZGlzYWJsZUJvaWxlcnBsYXRlUmVzcG9uc2UgPSBmYWxzZTtcbldlYkFwcEludGVybmFscy5kaXNhYmxlQm9pbGVycGxhdGVSZXNwb25zZSA9IGZ1bmN0aW9uKCkge1xuICBkaXNhYmxlQm9pbGVycGxhdGVSZXNwb25zZSA9IHRydWU7XG59XG5cbi8vIEV4cG9ydGVkIGZvciB0ZXN0c1xuV2ViQXBwSW50ZXJuYWxzLmdldEJvaWxlcnBsYXRlID0gZ2V0Qm9pbGVycGxhdGU7XG5XZWJBcHBJbnRlcm5hbHMuYWRkaXRpb25hbFN0YXRpY0pzID0gYWRkaXRpb25hbFN0YXRpY0pzO1xuXG5hd2FpdCBydW5XZWJBcHBTZXJ2ZXIoKTtcbiIsImltcG9ydCB7IHN0YXRTeW5jLCB1bmxpbmtTeW5jLCBleGlzdHNTeW5jIH0gZnJvbSAnZnMnO1xuXG4vLyBTaW5jZSBhIG5ldyBzb2NrZXQgZmlsZSB3aWxsIGJlIGNyZWF0ZWQgd2hlbiB0aGUgSFRUUCBzZXJ2ZXJcbi8vIHN0YXJ0cyB1cCwgaWYgZm91bmQgcmVtb3ZlIHRoZSBleGlzdGluZyBmaWxlLlxuLy9cbi8vIFdBUk5JTkc6XG4vLyBUaGlzIHdpbGwgcmVtb3ZlIHRoZSBjb25maWd1cmVkIHNvY2tldCBmaWxlIHdpdGhvdXQgd2FybmluZy4gSWZcbi8vIHRoZSBjb25maWd1cmVkIHNvY2tldCBmaWxlIGlzIGFscmVhZHkgaW4gdXNlIGJ5IGFub3RoZXIgYXBwbGljYXRpb24sXG4vLyBpdCB3aWxsIHN0aWxsIGJlIHJlbW92ZWQuIE5vZGUgZG9lcyBub3QgcHJvdmlkZSBhIHJlbGlhYmxlIHdheSB0b1xuLy8gZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGEgc29ja2V0IGZpbGUgdGhhdCBpcyBhbHJlYWR5IGluIHVzZSBieVxuLy8gYW5vdGhlciBhcHBsaWNhdGlvbiBvciBhIHN0YWxlIHNvY2tldCBmaWxlIHRoYXQgaGFzIGJlZW5cbi8vIGxlZnQgb3ZlciBhZnRlciBhIFNJR0tJTEwuIFNpbmNlIHdlIGhhdmUgbm8gcmVsaWFibGUgd2F5IHRvXG4vLyBkaWZmZXJlbnRpYXRlIGJldHdlZW4gdGhlc2UgdHdvIHNjZW5hcmlvcywgdGhlIGJlc3QgY291cnNlIG9mXG4vLyBhY3Rpb24gZHVyaW5nIHN0YXJ0dXAgaXMgdG8gcmVtb3ZlIGFueSBleGlzdGluZyBzb2NrZXQgZmlsZS4gVGhpc1xuLy8gaXMgbm90IHRoZSBzYWZlc3QgY291cnNlIG9mIGFjdGlvbiBhcyByZW1vdmluZyB0aGUgZXhpc3Rpbmcgc29ja2V0XG4vLyBmaWxlIGNvdWxkIGltcGFjdCBhbiBhcHBsaWNhdGlvbiB1c2luZyBpdCwgYnV0IHRoaXMgYXBwcm9hY2ggaGVscHNcbi8vIGVuc3VyZSB0aGUgSFRUUCBzZXJ2ZXIgY2FuIHN0YXJ0dXAgd2l0aG91dCBtYW51YWxcbi8vIGludGVydmVudGlvbiAoZS5nLiBhc2tpbmcgZm9yIHRoZSB2ZXJpZmljYXRpb24gYW5kIGNsZWFudXAgb2Ygc29ja2V0XG4vLyBmaWxlcyBiZWZvcmUgYWxsb3dpbmcgdGhlIEhUVFAgc2VydmVyIHRvIGJlIHN0YXJ0ZWQpLlxuLy9cbi8vIFRoZSBhYm92ZSBiZWluZyBzYWlkLCBhcyBsb25nIGFzIHRoZSBzb2NrZXQgZmlsZSBwYXRoIGlzXG4vLyBjb25maWd1cmVkIGNhcmVmdWxseSB3aGVuIHRoZSBhcHBsaWNhdGlvbiBpcyBkZXBsb3llZCAoYW5kIGV4dHJhXG4vLyBjYXJlIGlzIHRha2VuIHRvIG1ha2Ugc3VyZSB0aGUgY29uZmlndXJlZCBwYXRoIGlzIHVuaXF1ZSBhbmQgZG9lc24ndFxuLy8gY29uZmxpY3Qgd2l0aCBhbm90aGVyIHNvY2tldCBmaWxlIHBhdGgpLCB0aGVuIHRoZXJlIHNob3VsZCBub3QgYmVcbi8vIGFueSBpc3N1ZXMgd2l0aCB0aGlzIGFwcHJvYWNoLlxuZXhwb3J0IGNvbnN0IHJlbW92ZUV4aXN0aW5nU29ja2V0RmlsZSA9IChzb2NrZXRQYXRoKSA9PiB7XG4gIHRyeSB7XG4gICAgaWYgKHN0YXRTeW5jKHNvY2tldFBhdGgpLmlzU29ja2V0KCkpIHtcbiAgICAgIC8vIFNpbmNlIGEgbmV3IHNvY2tldCBmaWxlIHdpbGwgYmUgY3JlYXRlZCwgcmVtb3ZlIHRoZSBleGlzdGluZ1xuICAgICAgLy8gZmlsZS5cbiAgICAgIHVubGlua1N5bmMoc29ja2V0UGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEFuIGV4aXN0aW5nIGZpbGUgd2FzIGZvdW5kIGF0IFwiJHtzb2NrZXRQYXRofVwiIGFuZCBpdCBpcyBub3QgYCArXG4gICAgICAgICdhIHNvY2tldCBmaWxlLiBQbGVhc2UgY29uZmlybSBQT1JUIGlzIHBvaW50aW5nIHRvIHZhbGlkIGFuZCAnICtcbiAgICAgICAgJ3VuLXVzZWQgc29ja2V0IGZpbGUgcGF0aC4nXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBleGlzdGluZyBzb2NrZXQgZmlsZSB0byBjbGVhbnVwLCBncmVhdCwgd2UnbGxcbiAgICAvLyBjb250aW51ZSBub3JtYWxseS4gSWYgdGhlIGNhdWdodCBleGNlcHRpb24gcmVwcmVzZW50cyBhbnkgb3RoZXJcbiAgICAvLyBpc3N1ZSwgcmUtdGhyb3cuXG4gICAgaWYgKGVycm9yLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cbn07XG5cbi8vIFJlbW92ZSB0aGUgc29ja2V0IGZpbGUgd2hlbiBkb25lIHRvIGF2b2lkIGxlYXZpbmcgYmVoaW5kIGEgc3RhbGUgb25lLlxuLy8gTm90ZSAtIGEgc3RhbGUgc29ja2V0IGZpbGUgaXMgc3RpbGwgbGVmdCBiZWhpbmQgaWYgdGhlIHJ1bm5pbmcgbm9kZVxuLy8gcHJvY2VzcyBpcyBraWxsZWQgdmlhIHNpZ25hbCA5IC0gU0lHS0lMTC5cbmV4cG9ydCBjb25zdCByZWdpc3RlclNvY2tldEZpbGVDbGVhbnVwID1cbiAgKHNvY2tldFBhdGgsIGV2ZW50RW1pdHRlciA9IHByb2Nlc3MpID0+IHtcbiAgICBbJ2V4aXQnLCAnU0lHSU5UJywgJ1NJR0hVUCcsICdTSUdURVJNJ10uZm9yRWFjaChzaWduYWwgPT4ge1xuICAgICAgZXZlbnRFbWl0dGVyLm9uKHNpZ25hbCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XG4gICAgICAgIGlmIChleGlzdHNTeW5jKHNvY2tldFBhdGgpKSB7XG4gICAgICAgICAgdW5saW5rU3luYyhzb2NrZXRQYXRoKTtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH0pO1xuICB9O1xuIl19
