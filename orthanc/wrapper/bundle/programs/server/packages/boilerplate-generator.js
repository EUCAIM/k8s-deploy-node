Package["core-runtime"].queue("boilerplate-generator",function () {/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EmitterPromise = Package.meteor.EmitterPromise;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Boilerplate;

var require = meteorInstall({"node_modules":{"meteor":{"boilerplate-generator":{"generator.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/boilerplate-generator/generator.js                                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({Boilerplate:()=>Boilerplate});let readFileSync;module.link('fs',{readFileSync(v){readFileSync=v}},0);let createStream;module.link("combined-stream2",{create(v){createStream=v}},1);let modernHeadTemplate,modernCloseTemplate;module.link('./template-web.browser',{headTemplate(v){modernHeadTemplate=v},closeTemplate(v){modernCloseTemplate=v}},2);let cordovaHeadTemplate,cordovaCloseTemplate;module.link('./template-web.cordova',{headTemplate(v){cordovaHeadTemplate=v},closeTemplate(v){cordovaCloseTemplate=v}},3);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function _define_property(obj, key, value) {
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




// Copied from webapp_server
const readUtf8FileSync = (filename)=>readFileSync(filename, 'utf8');
const identity = (value)=>value;
function appendToStream(chunk, stream) {
    if (typeof chunk === "string") {
        stream.append(Buffer.from(chunk, "utf8"));
    } else if (Buffer.isBuffer(chunk) || typeof chunk.read === "function") {
        stream.append(chunk);
    }
}
class Boilerplate {
    toHTML(extraData) {
        throw new Error("The Boilerplate#toHTML method has been removed. " + "Please use Boilerplate#toHTMLStream instead.");
    }
    // Returns a Promise that resolves to a string of HTML.
    toHTMLAsync(extraData) {
        return new Promise((resolve, reject)=>{
            const stream = this.toHTMLStream(extraData);
            const chunks = [];
            stream.on("data", (chunk)=>chunks.push(chunk));
            stream.on("end", ()=>{
                resolve(Buffer.concat(chunks).toString("utf8"));
            });
            stream.on("error", reject);
        });
    }
    // The 'extraData' argument can be used to extend 'self.baseData'. Its
    // purpose is to allow you to specify data that you might not know at
    // the time that you construct the Boilerplate object. (e.g. it is used
    // by 'webapp' to specify data that is only known at request-time).
    // this returns a stream
    toHTMLStream(extraData) {
        if (!this.baseData || !this.headTemplate || !this.closeTemplate) {
            throw new Error('Boilerplate did not instantiate correctly.');
        }
        const data = _object_spread({}, this.baseData, extraData);
        const start = "<!DOCTYPE html>\n" + this.headTemplate(data);
        const { body, dynamicBody } = data;
        const end = this.closeTemplate(data);
        const response = createStream();
        appendToStream(start, response);
        if (body) {
            appendToStream(body, response);
        }
        if (dynamicBody) {
            appendToStream(dynamicBody, response);
        }
        appendToStream(end, response);
        return response;
    }
    // XXX Exported to allow client-side only changes to rebuild the boilerplate
    // without requiring a full server restart.
    // Produces an HTML string with given manifest and boilerplateSource.
    // Optionally takes urlMapper in case urls from manifest need to be prefixed
    // or rewritten.
    // Optionally takes pathMapper for resolving relative file system paths.
    // Optionally allows to override fields of the data context.
    _generateBoilerplateFromManifest(manifest, { urlMapper = identity, pathMapper = identity, baseDataExtension, inline } = {}) {
        const boilerplateBaseData = _object_spread({
            css: [],
            js: [],
            head: '',
            body: '',
            meteorManifest: JSON.stringify(manifest)
        }, baseDataExtension);
        manifest.forEach((item)=>{
            const urlPath = urlMapper(item.url);
            const itemObj = {
                url: urlPath
            };
            if (inline) {
                itemObj.scriptContent = readUtf8FileSync(pathMapper(item.path));
                itemObj.inline = true;
            } else if (item.sri) {
                itemObj.sri = item.sri;
            }
            if (item.type === 'css' && item.where === 'client') {
                boilerplateBaseData.css.push(itemObj);
            }
            if (item.type === 'js' && item.where === 'client' && // Dynamic JS modules should not be loaded eagerly in the
            // initial HTML of the app.
            !item.path.startsWith('dynamic/')) {
                boilerplateBaseData.js.push(itemObj);
            }
            if (item.type === 'head') {
                boilerplateBaseData.head = readUtf8FileSync(pathMapper(item.path));
            }
            if (item.type === 'body') {
                boilerplateBaseData.body = readUtf8FileSync(pathMapper(item.path));
            }
        });
        this.baseData = boilerplateBaseData;
    }
    constructor(arch, manifest, options = {}){
        const { headTemplate, closeTemplate } = getTemplate(arch);
        this.headTemplate = headTemplate;
        this.closeTemplate = closeTemplate;
        this.baseData = null;
        this._generateBoilerplateFromManifest(manifest, options);
    }
}
;
// Returns a template function that, when called, produces the boilerplate
// html as a string.
function getTemplate(arch) {
    const prefix = arch.split(".", 2).join(".");
    if (prefix === "web.browser") {
        return {
            headTemplate: modernHeadTemplate,
            closeTemplate: modernCloseTemplate
        };
    }
    if (prefix === "web.cordova") {
        return {
            headTemplate: cordovaHeadTemplate,
            closeTemplate: cordovaCloseTemplate
        };
    }
    throw new Error("Unsupported arch: " + arch);
}
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"template-web.browser.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/boilerplate-generator/template-web.browser.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({headTemplate:()=>headTemplate,closeTemplate:()=>closeTemplate},true);let template;module.link('./template',{default(v){template=v}},0);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
const sri = (sri, mode)=>sri && mode ? ` integrity="sha512-${sri}" crossorigin="${mode}"` : '';
const headTemplate = ({ css, htmlAttributes, bundledJsCssUrlRewriteHook, sriMode, head, dynamicHead })=>{
    var headSections = head.split(/<meteor-bundled-css[^<>]*>/, 2);
    var cssBundle = [
        ...(css || []).map((file)=>template('  <link rel="stylesheet" type="text/css" class="__meteor-css__" href="<%- href %>"<%= sri %>>')({
                href: bundledJsCssUrlRewriteHook(file.url),
                sri: sri(file.sri, sriMode)
            }))
    ].join('\n');
    return [
        '<html' + Object.keys(htmlAttributes || {}).map((key)=>template(' <%= attrName %>="<%- attrValue %>"')({
                attrName: key,
                attrValue: htmlAttributes[key]
            })).join('') + '>',
        '<head>',
        headSections.length === 1 ? [
            cssBundle,
            headSections[0]
        ].join('\n') : [
            headSections[0],
            cssBundle,
            headSections[1]
        ].join('\n'),
        dynamicHead,
        '</head>',
        '<body>'
    ].join('\n');
};
// Template function for rendering the boilerplate html for browsers
const closeTemplate = ({ meteorRuntimeConfig, meteorRuntimeHash, rootUrlPathPrefix, inlineScriptsAllowed, js, additionalStaticJs, bundledJsCssUrlRewriteHook, sriMode })=>[
        '',
        inlineScriptsAllowed ? template('  <script type="text/javascript">__meteor_runtime_config__ = JSON.parse(decodeURIComponent(<%= conf %>))</script>')({
            conf: meteorRuntimeConfig
        }) : template('  <script type="text/javascript" src="<%- src %>/meteor_runtime_config.js?hash=<%- hash %>"></script>')({
            src: rootUrlPathPrefix,
            hash: meteorRuntimeHash
        }),
        '',
        ...(js || []).map((file)=>template('  <script type="text/javascript" src="<%- src %>"<%= sri %>></script>')({
                src: bundledJsCssUrlRewriteHook(file.url),
                sri: sri(file.sri, sriMode)
            })),
        ...(additionalStaticJs || []).map(({ contents, pathname })=>inlineScriptsAllowed ? template('  <script><%= contents %></script>')({
                contents
            }) : template('  <script type="text/javascript" src="<%- src %>"></script>')({
                src: rootUrlPathPrefix + pathname
            })),
        process.env.METEOR_APP_CUSTOM_SCRIPT_URL ? template("  <script type=\"text/javascript\" src=\"<%- src %>\"></script>")({
            src: process.env.METEOR_APP_CUSTOM_SCRIPT_URL
        }) : '',
        '',
        '',
        '</body>',
        '</html>'
    ].join('\n');
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"template-web.cordova.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/boilerplate-generator/template-web.cordova.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({closeTemplate:()=>closeTemplate});module.export({headTemplate:()=>headTemplate},true);let template;module.link('./template',{default(v){template=v}},0);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
// Template function for rendering the boilerplate html for cordova
const headTemplate = ({ meteorRuntimeConfig, rootUrlPathPrefix, inlineScriptsAllowed, css, js, additionalStaticJs, htmlAttributes, bundledJsCssUrlRewriteHook, head, dynamicHead })=>{
    var headSections = head.split(/<meteor-bundled-css[^<>]*>/, 2);
    var cssBundle = [
        // We are explicitly not using bundledJsCssUrlRewriteHook: in cordova we serve assets up directly from disk, so rewriting the URL does not make sense
        ...(css || []).map((file)=>template('  <link rel="stylesheet" type="text/css" class="__meteor-css__" href="<%- href %>">')({
                href: file.url
            }))
    ].join('\n');
    return [
        '<html>',
        '<head>',
        '  <meta charset="utf-8">',
        '  <meta name="format-detection" content="telephone=no">',
        '  <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height, viewport-fit=cover">',
        '  <meta name="msapplication-tap-highlight" content="no">',
        '  <meta http-equiv="Content-Security-Policy" content="default-src * android-webview-video-poster: gap: data: blob: \'unsafe-inline\' \'unsafe-eval\' ws: wss:;">',
        headSections.length === 1 ? [
            cssBundle,
            headSections[0]
        ].join('\n') : [
            headSections[0],
            cssBundle,
            headSections[1]
        ].join('\n'),
        '  <script type="text/javascript">',
        template('    __meteor_runtime_config__ = JSON.parse(decodeURIComponent(<%= conf %>));')({
            conf: meteorRuntimeConfig
        }),
        '    if (/Android/i.test(navigator.userAgent)) {',
        // When Android app is emulated, it cannot connect to localhost,
        // instead it should connect to 10.0.2.2
        // (unless we\'re using an http proxy; then it works!)
        '      if (!__meteor_runtime_config__.httpProxyPort) {',
        '        __meteor_runtime_config__.ROOT_URL = (__meteor_runtime_config__.ROOT_URL || \'\').replace(/localhost/i, \'10.0.2.2\');',
        '        __meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL = (__meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL || \'\').replace(/localhost/i, \'10.0.2.2\');',
        '      }',
        '    }',
        '  </script>',
        '',
        '  <script type="text/javascript" src="/cordova.js"></script>',
        ...(js || []).map((file)=>template('  <script type="text/javascript" src="<%- src %>"></script>')({
                src: file.url
            })),
        ...(additionalStaticJs || []).map(({ contents, pathname })=>inlineScriptsAllowed ? template('  <script><%= contents %></script>')({
                contents
            }) : template('  <script type="text/javascript" src="<%- src %>"></script>')({
                src: rootUrlPathPrefix + pathname
            })),
        '',
        '</head>',
        '',
        '<body>'
    ].join('\n');
};
function closeTemplate() {
    return "</body>\n</html>";
}
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"template.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/boilerplate-generator/template.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({default:()=>template});/**
 * Internal full-featured implementation of lodash.template (inspired by v4.5.0)
 * embedded to eliminate the external dependency while preserving functionality.
 *
 * MIT License (c) JS Foundation and other contributors <https://js.foundation/>
 * Adapted for Meteor boilerplate-generator (only the pieces required by template were extracted).
 */ // ---------------------------------------------------------------------------
// Utility & regex definitions (mirroring lodash pieces used by template)
// ---------------------------------------------------------------------------
const reEmptyStringLeading = /\b__p \+= '';/g;
const reEmptyStringMiddle = /\b(__p \+=) '' \+/g;
const reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;
const reEscape = /<%-([\s\S]+?)%>/g; // escape delimiter
const reEvaluate = /<%([\s\S]+?)%>/g; // evaluate delimiter
const reInterpolate = /<%=([\s\S]+?)%>/g; // interpolate delimiter
const reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g; // ES6 template literal capture
const reUnescapedString = /['\\\n\r\u2028\u2029]/g; // string literal escapes
// HTML escape
const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};
const reHasUnescapedHtml = /[&<>"']/;
function escapeHtml(string) {
    return string && reHasUnescapedHtml.test(string) ? string.replace(/[&<>"']/g, (chr)=>htmlEscapes[chr]) : string || '';
}
// Escape characters for inclusion into a string literal
const escapes = {
    "'": "'",
    '\\': '\\',
    '\n': 'n',
    '\r': 'r',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
};
function escapeStringChar(match) {
    return '\\' + escapes[match];
}
// Basic Object helpers ------------------------------------------------------
function isObject(value) {
    return value != null && typeof value === 'object';
}
function toStringSafe(value) {
    return value == null ? '' : value + '';
}
function baseValues(object, props) {
    return props.map((k)=>object[k]);
}
function attempt(fn) {
    try {
        return fn();
    } catch (e) {
        return e;
    }
}
function isError(value) {
    return value instanceof Error || isObject(value) && value.name === 'Error';
}
// ---------------------------------------------------------------------------
// Main template implementation
// ---------------------------------------------------------------------------
let templateCounter = -1; // used for sourceURL generation
function _template(string) {
    string = toStringSafe(string);
    const imports = {
        '_': {
            escape: escapeHtml
        }
    };
    const importKeys = Object.keys(imports);
    const importValues = baseValues(imports, importKeys);
    let index = 0;
    let isEscaping;
    let isEvaluating;
    let source = "__p += '";
    // Build combined regex of delimiters
    const reDelimiters = RegExp(reEscape.source + '|' + reInterpolate.source + '|' + reEsTemplate.source + '|' + reEvaluate.source + '|$', 'g');
    const sourceURL = `//# sourceURL=lodash.templateSources[${++templateCounter}]\n`;
    // Tokenize
    string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);
        // Append preceding string portion with escaped literal chars
        source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);
        if (escapeValue) {
            isEscaping = true;
            source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
            isEvaluating = true;
            source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
            source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;
        return match;
    });
    source += "';\n";
    source = 'with (obj) {\n' + source + '\n}\n';
    // Remove unnecessary concatenations
    source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source).replace(reEmptyStringMiddle, '$1').replace(reEmptyStringTrailing, '$1;');
    // Frame as function body
    source = 'function(obj) {\n' + 'obj || (obj = {});\n' + "var __t, __p = ''" + (isEscaping ? ', __e = _.escape' : '') + (isEvaluating ? ', __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, \'\') }\n' : ';\n') + source + 'return __p\n}';
    // Actual compile step
    const result = attempt(function() {
        return Function(importKeys, sourceURL + 'return ' + source).apply(undefined, importValues); // eslint-disable-line no-new-func
    });
    if (isError(result)) {
        result.source = source; // expose for debugging if error
        throw result;
    }
    // Expose compiled source
    result.source = source;
    return result;
}
function template(text) {
    return _template(text);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"combined-stream2":{"package.json":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/boilerplate-generator/node_modules/combined-stream2/package.json                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.exports = {
  "name": "combined-stream2",
  "version": "1.1.2",
  "main": "index.js"
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/boilerplate-generator/node_modules/combined-stream2/index.js                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.useNode();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});


/* Exports */
return {
  export: function () { return {
      Boilerplate: Boilerplate
    };},
  require: require,
  eagerModulePaths: [
    "/node_modules/meteor/boilerplate-generator/generator.js"
  ],
  mainModulePath: "/node_modules/meteor/boilerplate-generator/generator.js"
}});

//# sourceURL=meteor://💻app/packages/boilerplate-generator.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYm9pbGVycGxhdGUtZ2VuZXJhdG9yL2dlbmVyYXRvci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYm9pbGVycGxhdGUtZ2VuZXJhdG9yL3RlbXBsYXRlLXdlYi5icm93c2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9ib2lsZXJwbGF0ZS1nZW5lcmF0b3IvdGVtcGxhdGUtd2ViLmNvcmRvdmEuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2JvaWxlcnBsYXRlLWdlbmVyYXRvci90ZW1wbGF0ZS5qcyJdLCJuYW1lcyI6WyJyZWFkVXRmOEZpbGVTeW5jIiwiZmlsZW5hbWUiLCJyZWFkRmlsZVN5bmMiLCJpZGVudGl0eSIsInZhbHVlIiwiYXBwZW5kVG9TdHJlYW0iLCJjaHVuayIsInN0cmVhbSIsImFwcGVuZCIsIkJ1ZmZlciIsImZyb20iLCJpc0J1ZmZlciIsInJlYWQiLCJCb2lsZXJwbGF0ZSIsInRvSFRNTCIsImV4dHJhRGF0YSIsIkVycm9yIiwidG9IVE1MQXN5bmMiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInRvSFRNTFN0cmVhbSIsImNodW5rcyIsIm9uIiwicHVzaCIsImNvbmNhdCIsInRvU3RyaW5nIiwiYmFzZURhdGEiLCJoZWFkVGVtcGxhdGUiLCJjbG9zZVRlbXBsYXRlIiwiZGF0YSIsInN0YXJ0IiwiYm9keSIsImR5bmFtaWNCb2R5IiwiZW5kIiwicmVzcG9uc2UiLCJjcmVhdGVTdHJlYW0iLCJfZ2VuZXJhdGVCb2lsZXJwbGF0ZUZyb21NYW5pZmVzdCIsIm1hbmlmZXN0IiwidXJsTWFwcGVyIiwicGF0aE1hcHBlciIsImJhc2VEYXRhRXh0ZW5zaW9uIiwiaW5saW5lIiwiYm9pbGVycGxhdGVCYXNlRGF0YSIsImNzcyIsImpzIiwiaGVhZCIsIm1ldGVvck1hbmlmZXN0IiwiSlNPTiIsInN0cmluZ2lmeSIsImZvckVhY2giLCJpdGVtIiwidXJsUGF0aCIsInVybCIsIml0ZW1PYmoiLCJzY3JpcHRDb250ZW50IiwicGF0aCIsInNyaSIsInR5cGUiLCJ3aGVyZSIsInN0YXJ0c1dpdGgiLCJhcmNoIiwib3B0aW9ucyIsImdldFRlbXBsYXRlIiwicHJlZml4Iiwic3BsaXQiLCJqb2luIiwibW9kZXJuSGVhZFRlbXBsYXRlIiwibW9kZXJuQ2xvc2VUZW1wbGF0ZSIsImNvcmRvdmFIZWFkVGVtcGxhdGUiLCJjb3Jkb3ZhQ2xvc2VUZW1wbGF0ZSIsInRlbXBsYXRlIiwibW9kZSIsImh0bWxBdHRyaWJ1dGVzIiwiYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2siLCJzcmlNb2RlIiwiZHluYW1pY0hlYWQiLCJoZWFkU2VjdGlvbnMiLCJjc3NCdW5kbGUiLCJtYXAiLCJmaWxlIiwiaHJlZiIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJhdHRyTmFtZSIsImF0dHJWYWx1ZSIsImxlbmd0aCIsIm1ldGVvclJ1bnRpbWVDb25maWciLCJtZXRlb3JSdW50aW1lSGFzaCIsInJvb3RVcmxQYXRoUHJlZml4IiwiaW5saW5lU2NyaXB0c0FsbG93ZWQiLCJhZGRpdGlvbmFsU3RhdGljSnMiLCJjb25mIiwic3JjIiwiaGFzaCIsImNvbnRlbnRzIiwicGF0aG5hbWUiLCJwcm9jZXNzIiwiZW52IiwiTUVURU9SX0FQUF9DVVNUT01fU0NSSVBUX1VSTCIsInJlRW1wdHlTdHJpbmdMZWFkaW5nIiwicmVFbXB0eVN0cmluZ01pZGRsZSIsInJlRW1wdHlTdHJpbmdUcmFpbGluZyIsInJlRXNjYXBlIiwicmVFdmFsdWF0ZSIsInJlSW50ZXJwb2xhdGUiLCJyZUVzVGVtcGxhdGUiLCJyZVVuZXNjYXBlZFN0cmluZyIsImh0bWxFc2NhcGVzIiwicmVIYXNVbmVzY2FwZWRIdG1sIiwiZXNjYXBlSHRtbCIsInN0cmluZyIsInRlc3QiLCJyZXBsYWNlIiwiY2hyIiwiZXNjYXBlcyIsImVzY2FwZVN0cmluZ0NoYXIiLCJtYXRjaCIsImlzT2JqZWN0IiwidG9TdHJpbmdTYWZlIiwiYmFzZVZhbHVlcyIsIm9iamVjdCIsInByb3BzIiwiayIsImF0dGVtcHQiLCJmbiIsImUiLCJpc0Vycm9yIiwibmFtZSIsInRlbXBsYXRlQ291bnRlciIsIl90ZW1wbGF0ZSIsImltcG9ydHMiLCJlc2NhcGUiLCJpbXBvcnRLZXlzIiwiaW1wb3J0VmFsdWVzIiwiaW5kZXgiLCJpc0VzY2FwaW5nIiwiaXNFdmFsdWF0aW5nIiwic291cmNlIiwicmVEZWxpbWl0ZXJzIiwiUmVnRXhwIiwic291cmNlVVJMIiwiZXNjYXBlVmFsdWUiLCJpbnRlcnBvbGF0ZVZhbHVlIiwiZXNUZW1wbGF0ZVZhbHVlIiwiZXZhbHVhdGVWYWx1ZSIsIm9mZnNldCIsInNsaWNlIiwicmVzdWx0IiwiRnVuY3Rpb24iLCJhcHBseSIsInVuZGVmaW5lZCIsInRleHQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFnQztBQUMwQjtBQUV3RDtBQUNFO0FBRXBILDRCQUE0QjtBQUM1QixNQUFNQSxtQkFBbUJDLFlBQVlDLGFBQWFELFVBQVU7QUFFNUQsTUFBTUUsV0FBV0MsU0FBU0E7QUFFMUIsU0FBU0MsZUFBZUMsS0FBSyxFQUFFQyxNQUFNO0lBQ25DLElBQUksT0FBT0QsVUFBVSxVQUFVO1FBQzdCQyxPQUFPQyxNQUFNLENBQUNDLE9BQU9DLElBQUksQ0FBQ0osT0FBTztJQUNuQyxPQUFPLElBQUlHLE9BQU9FLFFBQVEsQ0FBQ0wsVUFDaEIsT0FBT0EsTUFBTU0sSUFBSSxLQUFLLFlBQVk7UUFDM0NMLE9BQU9DLE1BQU0sQ0FBQ0Y7SUFDaEI7QUFDRjtBQUVBLE9BQU8sTUFBTU87SUFhWEMsT0FBT0MsU0FBUyxFQUFFO1FBQ2hCLE1BQU0sSUFBSUMsTUFDUixxREFDRTtJQUVOO0lBRUEsdURBQXVEO0lBQ3ZEQyxZQUFZRixTQUFTLEVBQUU7UUFDckIsT0FBTyxJQUFJRyxRQUFRLENBQUNDLFNBQVNDO1lBQzNCLE1BQU1iLFNBQVMsSUFBSSxDQUFDYyxZQUFZLENBQUNOO1lBQ2pD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SyxDQUFDQyxXQUFXakIsZUFBZSxrQ0FBa0M7SUFDaEk7SUFFQSxJQUFJUCxRQUFRcUIsU0FBUztRQUNuQkEsT0FBT1YsTUFBTSxHQUFHQSxRQUFRLGdDQUFnQztRQUN4RCxNQUFNVTtJQUNSO0lBQ0EseUJBQXlCO0lBQ3pCQSxPQUFPVixNQUFNLEdBQUdBO0lBQ2hCLE9BQU9VO0FBQ1Q7QUFFQSxlQUFlLFNBQVM5RSxDQUFhO0lBQ25DLE9BQU80RCxVQUFVc0I7QUFDbkIiLCJmaWxlIjoiL3BhY2thZ2VzL2JvaWxlcnBsYXRlLWdlbmVyYXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBjcmVhdGUgYXMgY3JlYXRlU3RyZWFtIH0gZnJvbSBcImNvbWJpbmVkLXN0cmVhbTJcIjtcblxuaW1wb3J0IHsgaGVhZFRlbXBsYXRlIGFzIG1vZGVybkhlYWRUZW1wbGF0ZSwgY2xvc2VUZW1wbGF0ZSBhcyBtb2Rlcm5DbG9zZVRlbXBsYXRlIH0gZnJvbSAnLi90ZW1wbGF0ZS13ZWIuYnJvd3Nlcic7XG5pbXBvcnQgeyBoZWFkVGVtcGxhdGUgYXMgY29yZG92YUhlYWRUZW1wbGF0ZSwgY2xvc2VUZW1wbGF0ZSBhcyBjb3Jkb3ZhQ2xvc2VUZW1wbGF0ZSB9IGZyb20gJy4vdGVtcGxhdGUtd2ViLmNvcmRvdmEnO1xuXG4vLyBDb3BpZWQgZnJvbSB3ZWJhcHBfc2VydmVyXG5jb25zdCByZWFkVXRmOEZpbGVTeW5jID0gZmlsZW5hbWUgPT4gcmVhZEZpbGVTeW5jKGZpbGVuYW1lLCAndXRmOCcpO1xuXG5jb25zdCBpZGVudGl0eSA9IHZhbHVlID0+IHZhbHVlO1xuXG5mdW5jdGlvbiBhcHBlbmRUb1N0cmVhbShjaHVuaywgc3RyZWFtKSB7XG4gIGlmICh0eXBlb2YgY2h1bmsgPT09IFwic3RyaW5nXCIpIHtcbiAgICBzdHJlYW0uYXBwZW5kKEJ1ZmZlci5mcm9tKGNodW5rLCBcInV0ZjhcIikpO1xuICB9IGVsc2UgaWYgKEJ1ZmZlci5pc0J1ZmZlcihjaHVuaykgfHxcbiAgICAgICAgICAgICB0eXBlb2YgY2h1bmsucmVhZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgc3RyZWFtLmFwcGVuZChjaHVuayk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEJvaWxlcnBsYXRlIHtcbiAgY29uc3RydWN0b3IoYXJjaCwgbWFuaWZlc3QsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IHsgaGVhZFRlbXBsYXRlLCBjbG9zZVRlbXBsYXRlIH0gPSBnZXRUZW1wbGF0ZShhcmNoKTtcbiAgICB0aGlzLmhlYWRUZW1wbGF0ZSA9IGhlYWRUZW1wbGF0ZTtcbiAgICB0aGlzLmNsb3NlVGVtcGxhdGUgPSBjbG9zZVRlbXBsYXRlO1xuICAgIHRoaXMuYmFzZURhdGEgPSBudWxsO1xuXG4gICAgdGhpcy5fZ2VuZXJhdGVCb2lsZXJwbGF0ZUZyb21NYW5pZmVzdChcbiAgICAgIG1hbmlmZXN0LFxuICAgICAgb3B0aW9uc1xuICAgICk7XG4gIH1cblxuICB0b0hUTUwoZXh0cmFEYXRhKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgXCJUaGUgQm9pbGVycGxhdGUjdG9IVE1MIG1ldGhvZCBoYXMgYmVlbiByZW1vdmVkLiBcIiArXG4gICAgICAgIFwiUGxlYXNlIHVzZSBCb2lsZXJwbGF0ZSN0b0hUTUxTdHJlYW0gaW5zdGVhZC5cIlxuICAgICk7XG4gIH1cblxuICAvLyBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgc3RyaW5nIG9mIEhUTUwuXG4gIHRvSFRNTEFzeW5jKGV4dHJhRGF0YSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBzdHJlYW0gPSB0aGlzLnRvSFRNTFN0cmVhbShleHRyYURhdGEpO1xuICAgICAgY29uc3QgY2h1bmtzID0gW107XG4gICAgICBzdHJlYW0ub24oXCJkYXRhXCIsIGNodW5rID0+IGNodW5rcy5wdXNoKGNodW5rKSk7XG4gICAgICBzdHJlYW0ub24oXCJlbmRcIiwgKCkgPT4ge1xuICAgICAgICByZXNvbHZlKEJ1ZmZlci5jb25jYXQoY2h1bmtzKS50b1N0cmluZyhcInV0ZjhcIikpO1xuICAgICAgfSk7XG4gICAgICBzdHJlYW0ub24oXCJlcnJvclwiLCByZWplY3QpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gVGhlICdleHRyYURhdGEnIGFyZ3VtZW50IGNhbiBiZSB1c2VkIHRvIGV4dGVuZCAnc2VsZi5iYXNlRGF0YScuIEl0c1xuICAvLyBwdXJwb3NlIGlzIHRvIGFsbG93IHlvdSB0byBzcGVjaWZ5IGRhdGEgdGhhdCB5b3UgbWlnaHQgbm90IGtub3cgYXRcbiAgLy8gdGhlIHRpbWUgdGhhdCB5b3UgY29uc3RydWN0IHRoZSBCb2lsZXJwbGF0ZSBvYmplY3QuIChlLmcuIGl0IGlzIHVzZWRcbiAgLy8gYnkgJ3dlYmFwcCcgdG8gc3BlY2lmeSBkYXRhIHRoYXQgaXMgb25seSBrbm93biBhdCByZXF1ZXN0LXRpbWUpLlxuICAvLyB0aGlzIHJldHVybnMgYSBzdHJlYW1cbiAgdG9IVE1MU3RyZWFtKGV4dHJhRGF0YSkge1xuICAgIGlmICghdGhpcy5iYXNlRGF0YSB8fCAhdGhpcy5oZWFkVGVtcGxhdGUgfHwgIXRoaXMuY2xvc2VUZW1wbGF0ZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCb2lsZXJwbGF0ZSBkaWQgbm90IGluc3RhbnRpYXRlIGNvcnJlY3RseS4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBkYXRhID0gey4uLnRoaXMuYmFzZURhdGEsIC4uLmV4dHJhRGF0YX07XG4gICAgY29uc3Qgc3RhcnQgPSBcIjwhRE9DVFlQRSBodG1sPlxcblwiICsgdGhpcy5oZWFkVGVtcGxhdGUoZGF0YSk7XG5cbiAgICBjb25zdCB7IGJvZHksIGR5bmFtaWNCb2R5IH0gPSBkYXRhO1xuXG4gICAgY29uc3QgZW5kID0gdGhpcy5jbG9zZVRlbXBsYXRlKGRhdGEpO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gY3JlYXRlU3RyZWFtKCk7XG5cbiAgICBhcHBlbmRUb1N0cmVhbShzdGFydCwgcmVzcG9uc2UpO1xuXG4gICAgaWYgKGJvZHkpIHtcbiAgICAgIGFwcGVuZFRvU3RyZWFtKGJvZHksIHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICBpZiAoZHluYW1pY0JvZHkpIHtcbiAgICAgIGFwcGVuZFRvU3RyZWFtKGR5bmFtaWNCb2R5LCByZXNwb25zZSk7XG4gICAgfVxuXG4gICAgYXBwZW5kVG9TdHJlYW0oZW5kLCByZXNwb25zZSk7XG5cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICAvLyBYWFggRXhwb3J0ZWQgdG8gYWxsb3cgY2xpZW50LXNpZGUgb25seSBjaGFuZ2VzIHRvIHJlYnVpbGQgdGhlIGJvaWxlcnBsYXRlXG4gIC8vIHdpdGhvdXQgcmVxdWlyaW5nIGEgZnVsbCBzZXJ2ZXIgcmVzdGFydC5cbiAgLy8gUHJvZHVjZXMgYW4gSFRNTCBzdHJpbmcgd2l0aCBnaXZlbiBtYW5pZmVzdCBhbmQgYm9pbGVycGxhdGVTb3VyY2UuXG4gIC8vIE9wdGlvbmFsbHkgdGFrZXMgdXJsTWFwcGVyIGluIGNhc2UgdXJscyBmcm9tIG1hbmlmZXN0IG5lZWQgdG8gYmUgcHJlZml4ZWRcbiAgLy8gb3IgcmV3cml0dGVuLlxuICAvLyBPcHRpb25hbGx5IHRha2VzIHBhdGhNYXBwZXIgZm9yIHJlc29sdmluZyByZWxhdGl2ZSBmaWxlIHN5c3RlbSBwYXRocy5cbiAgLy8gT3B0aW9uYWxseSBhbGxvd3MgdG8gb3ZlcnJpZGUgZmllbGRzIG9mIHRoZSBkYXRhIGNvbnRleHQuXG4gIF9nZW5lcmF0ZUJvaWxlcnBsYXRlRnJvbU1hbmlmZXN0KG1hbmlmZXN0LCB7XG4gICAgdXJsTWFwcGVyID0gaWRlbnRpdHksXG4gICAgcGF0aE1hcHBlciA9IGlkZW50aXR5LFxuICAgIGJhc2VEYXRhRXh0ZW5zaW9uLFxuICAgIGlubGluZSxcbiAgfSA9IHt9KSB7XG5cbiAgICBjb25zdCBib2lsZXJwbGF0ZUJhc2VEYXRhID0ge1xuICAgICAgY3NzOiBbXSxcbiAgICAgIGpzOiBbXSxcbiAgICAgIGhlYWQ6ICcnLFxuICAgICAgYm9keTogJycsXG4gICAgICBtZXRlb3JNYW5pZmVzdDogSlNPTi5zdHJpbmdpZnkobWFuaWZlc3QpLFxuICAgICAgLi4uYmFzZURhdGFFeHRlbnNpb24sXG4gICAgfTtcblxuICAgIG1hbmlmZXN0LmZvckVhY2goaXRlbSA9PiB7XG4gICAgICBjb25zdCB1cmxQYXRoID0gdXJsTWFwcGVyKGl0ZW0udXJsKTtcbiAgICAgIGNvbnN0IGl0ZW1PYmogPSB7IHVybDogdXJsUGF0aCB9O1xuXG4gICAgICBpZiAoaW5saW5lKSB7XG4gICAgICAgIGl0ZW1PYmouc2NyaXB0Q29udGVudCA9IHJlYWRVdGY4RmlsZVN5bmMoXG4gICAgICAgICAgcGF0aE1hcHBlcihpdGVtLnBhdGgpKTtcbiAgICAgICAgaXRlbU9iai5pbmxpbmUgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChpdGVtLnNyaSkge1xuICAgICAgICBpdGVtT2JqLnNyaSA9IGl0ZW0uc3JpO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXRlbS50eXBlID09PSAnY3NzJyAmJiBpdGVtLndoZXJlID09PSAnY2xpZW50Jykge1xuICAgICAgICBib2lsZXJwbGF0ZUJhc2VEYXRhLmNzcy5wdXNoKGl0ZW1PYmopO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXRlbS50eXBlID09PSAnanMnICYmIGl0ZW0ud2hlcmUgPT09ICdjbGllbnQnICYmXG4gICAgICAgIC8vIER5bmFtaWMgSlMgbW9kdWxlcyBzaG91bGQgbm90IGJlIGxvYWRlZCBlYWdlcmx5IGluIHRoZVxuICAgICAgICAvLyBpbml0aWFsIEhUTUwgb2YgdGhlIGFwcC5cbiAgICAgICAgIWl0ZW0ucGF0aC5zdGFydHNXaXRoKCdkeW5hbWljLycpKSB7XG4gICAgICAgIGJvaWxlcnBsYXRlQmFzZURhdGEuanMucHVzaChpdGVtT2JqKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ2hlYWQnKSB7XG4gICAgICAgIGJvaWxlcnBsYXRlQmFzZURhdGEuaGVhZCA9XG4gICAgICAgICAgcmVhZFV0ZjhGaWxlU3luYyhwYXRoTWFwcGVyKGl0ZW0ucGF0aCkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXRlbS50eXBlID09PSAnYm9keScpIHtcbiAgICAgICAgYm9pbGVycGxhdGVCYXNlRGF0YS5ib2R5ID1cbiAgICAgICAgICByZWFkVXRmOEZpbGVTeW5jKHBhdGhNYXBwZXIoaXRlbS5wYXRoKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmJhc2VEYXRhID0gYm9pbGVycGxhdGVCYXNlRGF0YTtcbiAgfVxufTtcblxuLy8gUmV0dXJucyBhIHRlbXBsYXRlIGZ1bmN0aW9uIHRoYXQsIHdoZW4gY2FsbGVkLCBwcm9kdWNlcyB0aGUgYm9pbGVycGxhdGVcbi8vIGh0bWwgYXMgYSBzdHJpbmcuXG5mdW5jdGlvbiBnZXRUZW1wbGF0ZShhcmNoKSB7XG4gIGNvbnN0IHByZWZpeCA9IGFyY2guc3BsaXQoXCIuXCIsIDIpLmpvaW4oXCIuXCIpO1xuXG4gIGlmIChwcmVmaXggPT09IFwid2ViLmJyb3dzZXJcIikge1xuICAgIHJldHVybiB7IGhlYWRUZW1wbGF0ZTogbW9kZXJuSGVhZFRlbXBsYXRlLCBjbG9zZVRlbXBsYXRlOiBtb2Rlcm5DbG9zZVRlbXBsYXRlIH07XG4gIH1cblxuICBpZiAocHJlZml4ID09PSBcIndlYi5jb3Jkb3ZhXCIpIHtcbiAgICByZXR1cm4geyBoZWFkVGVtcGxhdGU6IGNvcmRvdmFIZWFkVGVtcGxhdGUsIGNsb3NlVGVtcGxhdGU6IGNvcmRvdmFDbG9zZVRlbXBsYXRlIH07XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbnN1cHBvcnRlZCBhcmNoOiBcIiArIGFyY2gpO1xufVxuIiwiaW1wb3J0IHRlbXBsYXRlIGZyb20gJy4vdGVtcGxhdGUnO1xuXG5jb25zdCBzcmkgPSAoc3JpLCBtb2RlKSA9PlxuICAoc3JpICYmIG1vZGUpID8gYCBpbnRlZ3JpdHk9XCJzaGE1MTItJHtzcml9XCIgY3Jvc3NvcmlnaW49XCIke21vZGV9XCJgIDogJyc7XG5cbmV4cG9ydCBjb25zdCBoZWFkVGVtcGxhdGUgPSAoe1xuICBjc3MsXG4gIGh0bWxBdHRyaWJ1dGVzLFxuICBidW5kbGVkSnNDc3NVcmxSZXdyaXRlSG9vayxcbiAgc3JpTW9kZSxcbiAgaGVhZCxcbiAgZHluYW1pY0hlYWQsXG59KSA9PiB7XG4gIHZhciBoZWFkU2VjdGlvbnMgPSBoZWFkLnNwbGl0KC88bWV0ZW9yLWJ1bmRsZWQtY3NzW148Pl0qPi8sIDIpO1xuICB2YXIgY3NzQnVuZGxlID0gWy4uLihjc3MgfHwgW10pLm1hcChmaWxlID0+XG4gICAgdGVtcGxhdGUoJyAgPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIGNsYXNzPVwiX19tZXRlb3ItY3NzX19cIiBocmVmPVwiPCUtIGhyZWYgJT5cIjwlPSBzcmkgJT4+Jykoe1xuICAgICAgaHJlZjogYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2soZmlsZS51cmwpLFxuICAgICAgc3JpOiBzcmkoZmlsZS5zcmksIHNyaU1vZGUpLFxuICAgIH0pXG4gICldLmpvaW4oJ1xcbicpO1xuXG4gIHJldHVybiBbXG4gICAgJzxodG1sJyArIE9iamVjdC5rZXlzKGh0bWxBdHRyaWJ1dGVzIHx8IHt9KS5tYXAoXG4gICAgICBrZXkgPT4gdGVtcGxhdGUoJyA8JT0gYXR0ck5hbWUgJT49XCI8JS0gYXR0clZhbHVlICU+XCInKSh7XG4gICAgICAgIGF0dHJOYW1lOiBrZXksXG4gICAgICAgIGF0dHJWYWx1ZTogaHRtbEF0dHJpYnV0ZXNba2V5XSxcbiAgICAgIH0pXG4gICAgKS5qb2luKCcnKSArICc+JyxcblxuICAgICc8aGVhZD4nLFxuXG4gICAgKGhlYWRTZWN0aW9ucy5sZW5ndGggPT09IDEpXG4gICAgICA/IFtjc3NCdW5kbGUsIGhlYWRTZWN0aW9uc1swXV0uam9pbignXFxuJylcbiAgICAgIDogW2hlYWRTZWN0aW9uc1swXSwgY3NzQnVuZGxlLCBoZWFkU2VjdGlvbnNbMV1dLmpvaW4oJ1xcbicpLFxuXG4gICAgZHluYW1pY0hlYWQsXG4gICAgJzwvaGVhZD4nLFxuICAgICc8Ym9keT4nLFxuICBdLmpvaW4oJ1xcbicpO1xufTtcblxuLy8gVGVtcGxhdGUgZnVuY3Rpb24gZm9yIHJlbmRlcmluZyB0aGUgYm9pbGVycGxhdGUgaHRtbCBmb3IgYnJvd3NlcnNcbmV4cG9ydCBjb25zdCBjbG9zZVRlbXBsYXRlID0gKHtcbiAgbWV0ZW9yUnVudGltZUNvbmZpZyxcbiAgbWV0ZW9yUnVudGltZUhhc2gsXG4gIHJvb3RVcmxQYXRoUHJlZml4LFxuICBpbmxpbmVTY3JpcHRzQWxsb3dlZCxcbiAganMsXG4gIGFkZGl0aW9uYWxTdGF0aWNKcyxcbiAgYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2ssXG4gIHNyaU1vZGUsXG59KSA9PiBbXG4gICcnLFxuICBpbmxpbmVTY3JpcHRzQWxsb3dlZFxuICAgID8gdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCI+X19tZXRlb3JfcnVudGltZV9jb25maWdfXyA9IEpTT04ucGFyc2UoZGVjb2RlVVJJQ29tcG9uZW50KDwlPSBjb25mICU+KSk8L3NjcmlwdD4nKSh7XG4gICAgICBjb25mOiBtZXRlb3JSdW50aW1lQ29uZmlnLFxuICAgIH0pXG4gICAgOiB0ZW1wbGF0ZSgnICA8c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIiBzcmM9XCI8JS0gc3JjICU+L21ldGVvcl9ydW50aW1lX2NvbmZpZy5qcz9oYXNoPTwlLSBoYXNoICU+XCI+PC9zY3JpcHQ+Jykoe1xuICAgICAgc3JjOiByb290VXJsUGF0aFByZWZpeCxcbiAgICAgIGhhc2g6IG1ldGVvclJ1bnRpbWVIYXNoLFxuICAgIH0pLFxuICAnJyxcblxuICAuLi4oanMgfHwgW10pLm1hcChmaWxlID0+XG4gICAgdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiPCUtIHNyYyAlPlwiPCU9IHNyaSAlPj48L3NjcmlwdD4nKSh7XG4gICAgICBzcmM6IGJ1bmRsZWRKc0Nzc1VybFJld3JpdGVIb29rKGZpbGUudXJsKSxcbiAgICAgIHNyaTogc3JpKGZpbGUuc3JpLCBzcmlNb2RlKSxcbiAgICB9KVxuICApLFxuXG4gIC4uLihhZGRpdGlvbmFsU3RhdGljSnMgfHwgW10pLm1hcCgoeyBjb250ZW50cywgcGF0aG5hbWUgfSkgPT4gKFxuICAgIGlubGluZVNjcmlwdHNBbGxvd2VkXG4gICAgICA/IHRlbXBsYXRlKCcgIDxzY3JpcHQ+PCU9IGNvbnRlbnRzICU+PC9zY3JpcHQ+Jykoe1xuICAgICAgICBjb250ZW50cyxcbiAgICAgIH0pXG4gICAgICA6IHRlbXBsYXRlKCcgIDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiIHNyYz1cIjwlLSBzcmMgJT5cIj48L3NjcmlwdD4nKSh7XG4gICAgICAgIHNyYzogcm9vdFVybFBhdGhQcmVmaXggKyBwYXRobmFtZSxcbiAgICAgIH0pXG4gICkpLFxuICBwcm9jZXNzLmVudi5NRVRFT1JfQVBQX0NVU1RPTV9TQ1JJUFRfVVJMID9cbiAgICB0ZW1wbGF0ZShcIiAgPHNjcmlwdCB0eXBlPVxcXCJ0ZXh0L2phdmFzY3JpcHRcXFwiIHNyYz1cXFwiPCUtIHNyYyAlPlxcXCI+PC9zY3JpcHQ+XCIpKHtcbiAgICAgIHNyYzogcHJvY2Vzcy5lbnYuTUVURU9SX0FQUF9DVVNUT01fU0NSSVBUX1VSTFxuICAgIH0pXG4gICAgOiAnJyxcbiAgJycsXG4gICcnLFxuICAnPC9ib2R5PicsXG4gICc8L2h0bWw+J1xuXS5qb2luKCdcXG4nKTtcbiIsImltcG9ydCB0ZW1wbGF0ZSBmcm9tICcuL3RlbXBsYXRlJztcblxuLy8gVGVtcGxhdGUgZnVuY3Rpb24gZm9yIHJlbmRlcmluZyB0aGUgYm9pbGVycGxhdGUgaHRtbCBmb3IgY29yZG92YVxuZXhwb3J0IGNvbnN0IGhlYWRUZW1wbGF0ZSA9ICh7XG4gIG1ldGVvclJ1bnRpbWVDb25maWcsXG4gIHJvb3RVcmxQYXRoUHJlZml4LFxuICBpbmxpbmVTY3JpcHRzQWxsb3dlZCxcbiAgY3NzLFxuICBqcyxcbiAgYWRkaXRpb25hbFN0YXRpY0pzLFxuICBodG1sQXR0cmlidXRlcyxcbiAgYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2ssXG4gIGhlYWQsXG4gIGR5bmFtaWNIZWFkLFxufSkgPT4ge1xuICB2YXIgaGVhZFNlY3Rpb25zID0gaGVhZC5zcGxpdCgvPG1ldGVvci1idW5kbGVkLWNzc1tePD5dKj4vLCAyKTtcbiAgdmFyIGNzc0J1bmRsZSA9IFtcbiAgICAvLyBXZSBhcmUgZXhwbGljaXRseSBub3QgdXNpbmcgYnVuZGxlZEpzQ3NzVXJsUmV3cml0ZUhvb2s6IGluIGNvcmRvdmEgd2Ugc2VydmUgYXNzZXRzIHVwIGRpcmVjdGx5IGZyb20gZGlzaywgc28gcmV3cml0aW5nIHRoZSBVUkwgZG9lcyBub3QgbWFrZSBzZW5zZVxuICAgIC4uLihjc3MgfHwgW10pLm1hcChmaWxlID0+XG4gICAgICB0ZW1wbGF0ZSgnICA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgY2xhc3M9XCJfX21ldGVvci1jc3NfX1wiIGhyZWY9XCI8JS0gaHJlZiAlPlwiPicpKHtcbiAgICAgICAgaHJlZjogZmlsZS51cmwsXG4gICAgICB9KVxuICApXS5qb2luKCdcXG4nKTtcblxuICByZXR1cm4gW1xuICAgICc8aHRtbD4nLFxuICAgICc8aGVhZD4nLFxuICAgICcgIDxtZXRhIGNoYXJzZXQ9XCJ1dGYtOFwiPicsXG4gICAgJyAgPG1ldGEgbmFtZT1cImZvcm1hdC1kZXRlY3Rpb25cIiBjb250ZW50PVwidGVsZXBob25lPW5vXCI+JyxcbiAgICAnICA8bWV0YSBuYW1lPVwidmlld3BvcnRcIiBjb250ZW50PVwidXNlci1zY2FsYWJsZT1ubywgaW5pdGlhbC1zY2FsZT0xLCBtYXhpbXVtLXNjYWxlPTEsIG1pbmltdW0tc2NhbGU9MSwgd2lkdGg9ZGV2aWNlLXdpZHRoLCBoZWlnaHQ9ZGV2aWNlLWhlaWdodCwgdmlld3BvcnQtZml0PWNvdmVyXCI+JyxcbiAgICAnICA8bWV0YSBuYW1lPVwibXNhcHBsaWNhdGlvbi10YXAtaGlnaGxpZ2h0XCIgY29udGVudD1cIm5vXCI+JyxcbiAgICAnICA8bWV0YSBodHRwLWVxdWl2PVwiQ29udGVudC1TZWN1cml0eS1Qb2xpY3lcIiBjb250ZW50PVwiZGVmYXVsdC1zcmMgKiBhbmRyb2lkLXdlYnZpZXctdmlkZW8tcG9zdGVyOiBnYXA6IGRhdGE6IGJsb2I6IFxcJ3Vuc2FmZS1pbmxpbmVcXCcgXFwndW5zYWZlLWV2YWxcXCcgd3M6IHdzczo7XCI+JyxcblxuICAoaGVhZFNlY3Rpb25zLmxlbmd0aCA9PT0gMSlcbiAgICA/IFtjc3NCdW5kbGUsIGhlYWRTZWN0aW9uc1swXV0uam9pbignXFxuJylcbiAgICA6IFtoZWFkU2VjdGlvbnNbMF0sIGNzc0J1bmRsZSwgaGVhZFNlY3Rpb25zWzFdXS5qb2luKCdcXG4nKSxcblxuICAgICcgIDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiPicsXG4gICAgdGVtcGxhdGUoJyAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fID0gSlNPTi5wYXJzZShkZWNvZGVVUklDb21wb25lbnQoPCU9IGNvbmYgJT4pKTsnKSh7XG4gICAgICBjb25mOiBtZXRlb3JSdW50aW1lQ29uZmlnLFxuICAgIH0pLFxuICAgICcgICAgaWYgKC9BbmRyb2lkL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkgeycsXG4gICAgLy8gV2hlbiBBbmRyb2lkIGFwcCBpcyBlbXVsYXRlZCwgaXQgY2Fubm90IGNvbm5lY3QgdG8gbG9jYWxob3N0LFxuICAgIC8vIGluc3RlYWQgaXQgc2hvdWxkIGNvbm5lY3QgdG8gMTAuMC4yLjJcbiAgICAvLyAodW5sZXNzIHdlXFwncmUgdXNpbmcgYW4gaHR0cCBwcm94eTsgdGhlbiBpdCB3b3JrcyEpXG4gICAgJyAgICAgIGlmICghX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5odHRwUHJveHlQb3J0KSB7JyxcbiAgICAnICAgICAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMID0gKF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkwgfHwgXFwnXFwnKS5yZXBsYWNlKC9sb2NhbGhvc3QvaSwgXFwnMTAuMC4yLjJcXCcpOycsXG4gICAgJyAgICAgICAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ERFBfREVGQVVMVF9DT05ORUNUSU9OX1VSTCA9IChfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLkREUF9ERUZBVUxUX0NPTk5FQ1RJT05fVVJMIHx8IFxcJ1xcJykucmVwbGFjZSgvbG9jYWxob3N0L2ksIFxcJzEwLjAuMi4yXFwnKTsnLFxuICAgICcgICAgICB9JyxcbiAgICAnICAgIH0nLFxuICAgICcgIDwvc2NyaXB0PicsXG4gICAgJycsXG4gICAgJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiL2NvcmRvdmEuanNcIj48L3NjcmlwdD4nLFxuXG4gICAgLi4uKGpzIHx8IFtdKS5tYXAoZmlsZSA9PlxuICAgICAgdGVtcGxhdGUoJyAgPHNjcmlwdCB0eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIgc3JjPVwiPCUtIHNyYyAlPlwiPjwvc2NyaXB0PicpKHtcbiAgICAgICAgc3JjOiBmaWxlLnVybCxcbiAgICAgIH0pXG4gICAgKSxcblxuICAgIC4uLihhZGRpdGlvbmFsU3RhdGljSnMgfHwgW10pLm1hcCgoeyBjb250ZW50cywgcGF0aG5hbWUgfSkgPT4gKFxuICAgICAgaW5saW5lU2NyaXB0c0FsbG93ZWRcbiAgICAgICAgPyB0ZW1wbGF0ZSgnICA8c2NyaXB0PjwlPSBjb250ZW50cyAlPjwvc2NyaXB0PicpKHtcbiAgICAgICAgICBjb250ZW50cyxcbiAgICAgICAgfSlcbiAgICAgICAgOiB0ZW1wbGF0ZSgnICA8c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIiBzcmM9XCI8JS0gc3JjICU+XCI+PC9zY3JpcHQ+Jykoe1xuICAgICAgICAgIHNyYzogcm9vdFVybFBhdGhQcmVmaXggKyBwYXRobmFtZVxuICAgICAgICB9KVxuICAgICkpLFxuICAgICcnLFxuICAgICc8L2hlYWQ+JyxcbiAgICAnJyxcbiAgICAnPGJvZHk+JyxcbiAgXS5qb2luKCdcXG4nKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9zZVRlbXBsYXRlKCkge1xuICByZXR1cm4gXCI8L2JvZHk+XFxuPC9odG1sPlwiO1xufVxuIiwiLyoqXG4gKiBJbnRlcm5hbCBmdWxsLWZlYXR1cmVkIGltcGxlbWVudGF0aW9uIG9mIGxvZGFzaC50ZW1wbGF0ZSAoaW5zcGlyZWQgYnkgdjQuNS4wKVxuICogZW1iZWRkZWQgdG8gZWxpbWluYXRlIHRoZSBleHRlcm5hbCBkZXBlbmRlbmN5IHdoaWxlIHByZXNlcnZpbmcgZnVuY3Rpb25hbGl0eS5cbiAqXG4gKiBNSVQgTGljZW5zZSAoYykgSlMgRm91bmRhdGlvbiBhbmQgb3RoZXIgY29udHJpYnV0b3JzIDxodHRwczovL2pzLmZvdW5kYXRpb24vPlxuICogQWRhcHRlZCBmb3IgTWV0ZW9yIGJvaWxlcnBsYXRlLWdlbmVyYXRvciAob25seSB0aGUgcGllY2VzIHJlcXVpcmVkIGJ5IHRlbXBsYXRlIHdlcmUgZXh0cmFjdGVkKS5cbiAqL1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFV0aWxpdHkgJiByZWdleCBkZWZpbml0aW9ucyAobWlycm9yaW5nIGxvZGFzaCBwaWVjZXMgdXNlZCBieSB0ZW1wbGF0ZSlcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5jb25zdCByZUVtcHR5U3RyaW5nTGVhZGluZyA9IC9cXGJfX3AgXFwrPSAnJzsvZztcbmNvbnN0IHJlRW1wdHlTdHJpbmdNaWRkbGUgPSAvXFxiKF9fcCBcXCs9KSAnJyBcXCsvZztcbmNvbnN0IHJlRW1wdHlTdHJpbmdUcmFpbGluZyA9IC8oX19lXFwoLio/XFwpfFxcYl9fdFxcKSkgXFwrXFxuJyc7L2c7XG5cbmNvbnN0IHJlRXNjYXBlID0gLzwlLShbXFxzXFxTXSs/KSU+L2c7ICAgICAgICAgICAgICAvLyBlc2NhcGUgZGVsaW1pdGVyXG5jb25zdCByZUV2YWx1YXRlID0gLzwlKFtcXHNcXFNdKz8pJT4vZzsgICAgICAgICAgICAgIC8vIGV2YWx1YXRlIGRlbGltaXRlclxuY29uc3QgcmVJbnRlcnBvbGF0ZSA9IC88JT0oW1xcc1xcU10rPyklPi9nOyAgICAgICAgICAvLyBpbnRlcnBvbGF0ZSBkZWxpbWl0ZXJcbmNvbnN0IHJlRXNUZW1wbGF0ZSA9IC9cXCRcXHsoW15cXFxcfV0qKD86XFxcXC5bXlxcXFx9XSopKilcXH0vZzsgLy8gRVM2IHRlbXBsYXRlIGxpdGVyYWwgY2FwdHVyZVxuY29uc3QgcmVVbmVzY2FwZWRTdHJpbmcgPSAvWydcXFxcXFxuXFxyXFx1MjAyOFxcdTIwMjldL2c7IC8vIHN0cmluZyBsaXRlcmFsIGVzY2FwZXNcblxuLy8gSFRNTCBlc2NhcGVcbmNvbnN0IGh0bWxFc2NhcGVzID0geyAnJic6ICcmYW1wOycsICc8JzogJyZsdDsnLCAnPic6ICcmZ3Q7JywgJ1wiJzogJyZxdW90OycsIFwiJ1wiOiAnJiMzOTsnIH07XG5jb25zdCByZUhhc1VuZXNjYXBlZEh0bWwgPSAvWyY8PlwiJ10vO1xuXG5mdW5jdGlvbiBlc2NhcGVIdG1sKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nICYmIHJlSGFzVW5lc2NhcGVkSHRtbC50ZXN0KHN0cmluZylcbiAgICA/IHN0cmluZy5yZXBsYWNlKC9bJjw+XCInXS9nLCBjaHIgPT4gaHRtbEVzY2FwZXNbY2hyXSlcbiAgICA6IChzdHJpbmcgfHwgJycpO1xufVxuXG4vLyBFc2NhcGUgY2hhcmFjdGVycyBmb3IgaW5jbHVzaW9uIGludG8gYSBzdHJpbmcgbGl0ZXJhbFxuY29uc3QgZXNjYXBlcyA9IHsgXCInXCI6IFwiJ1wiLCAnXFxcXCc6ICdcXFxcJywgJ1xcbic6ICduJywgJ1xccic6ICdyJywgJ1xcdTIwMjgnOiAndTIwMjgnLCAnXFx1MjAyOSc6ICd1MjAyOScgfTtcbmZ1bmN0aW9uIGVzY2FwZVN0cmluZ0NoYXIobWF0Y2gpIHsgcmV0dXJuICdcXFxcJyArIGVzY2FwZXNbbWF0Y2hdOyB9XG5cbi8vIEJhc2ljIE9iamVjdCBoZWxwZXJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHsgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JzsgfVxuZnVuY3Rpb24gdG9TdHJpbmdTYWZlKHZhbHVlKSB7IHJldHVybiB2YWx1ZSA9PSBudWxsID8gJycgOiAodmFsdWUgKyAnJyk7IH1cbmZ1bmN0aW9uIGJhc2VWYWx1ZXMob2JqZWN0LCBwcm9wcykgeyByZXR1cm4gcHJvcHMubWFwKGsgPT4gb2JqZWN0W2tdKTsgfVxuXG5cbmZ1bmN0aW9uIGF0dGVtcHQoZm4pIHtcbiAgdHJ5IHsgcmV0dXJuIGZuKCk7IH0gY2F0Y2ggKGUpIHsgcmV0dXJuIGU7IH1cbn1cbmZ1bmN0aW9uIGlzRXJyb3IodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgRXJyb3IgfHwgKGlzT2JqZWN0KHZhbHVlKSAmJiB2YWx1ZS5uYW1lID09PSAnRXJyb3InKTsgfVxuXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gTWFpbiB0ZW1wbGF0ZSBpbXBsZW1lbnRhdGlvblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5sZXQgdGVtcGxhdGVDb3VudGVyID0gLTE7IC8vIHVzZWQgZm9yIHNvdXJjZVVSTCBnZW5lcmF0aW9uXG5cbmZ1bmN0aW9uIF90ZW1wbGF0ZShzdHJpbmcpIHtcbiAgc3RyaW5nID0gdG9TdHJpbmdTYWZlKHN0cmluZyk7XG5cbiAgY29uc3QgaW1wb3J0cyA9IHsgJ18nOiB7IGVzY2FwZTogZXNjYXBlSHRtbCB9IH07XG4gIGNvbnN0IGltcG9ydEtleXMgPSBPYmplY3Qua2V5cyhpbXBvcnRzKTtcbiAgY29uc3QgaW1wb3J0VmFsdWVzID0gYmFzZVZhbHVlcyhpbXBvcnRzLCBpbXBvcnRLZXlzKTtcblxuICBsZXQgaW5kZXggPSAwO1xuICBsZXQgaXNFc2NhcGluZztcbiAgbGV0IGlzRXZhbHVhdGluZztcbiAgbGV0IHNvdXJjZSA9IFwiX19wICs9ICdcIjtcblxuXG4gIC8vIEJ1aWxkIGNvbWJpbmVkIHJlZ2V4IG9mIGRlbGltaXRlcnNcbiAgY29uc3QgcmVEZWxpbWl0ZXJzID0gUmVnRXhwKFxuICAgIHJlRXNjYXBlLnNvdXJjZSArICd8JyArXG4gICAgcmVJbnRlcnBvbGF0ZS5zb3VyY2UgKyAnfCcgK1xuICAgIHJlRXNUZW1wbGF0ZS5zb3VyY2UgKyAnfCcgK1xuICAgIHJlRXZhbHVhdGUuc291cmNlICsgJ3wkJ1xuICAsICdnJyk7XG5cbiAgY29uc3Qgc291cmNlVVJMID0gYC8vIyBzb3VyY2VVUkw9bG9kYXNoLnRlbXBsYXRlU291cmNlc1skeysrdGVtcGxhdGVDb3VudGVyfV1cXG5gO1xuXG4gIC8vIFRva2VuaXplXG4gIHN0cmluZy5yZXBsYWNlKHJlRGVsaW1pdGVycywgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZVZhbHVlLCBpbnRlcnBvbGF0ZVZhbHVlLCBlc1RlbXBsYXRlVmFsdWUsIGV2YWx1YXRlVmFsdWUsIG9mZnNldCkge1xuICAgIGludGVycG9sYXRlVmFsdWUgfHwgKGludGVycG9sYXRlVmFsdWUgPSBlc1RlbXBsYXRlVmFsdWUpO1xuICAgIC8vIEFwcGVuZCBwcmVjZWRpbmcgc3RyaW5nIHBvcnRpb24gd2l0aCBlc2NhcGVkIGxpdGVyYWwgY2hhcnNcbiAgICBzb3VyY2UgKz0gc3RyaW5nLnNsaWNlKGluZGV4LCBvZmZzZXQpLnJlcGxhY2UocmVVbmVzY2FwZWRTdHJpbmcsIGVzY2FwZVN0cmluZ0NoYXIpO1xuICAgIGlmIChlc2NhcGVWYWx1ZSkge1xuICAgICAgaXNFc2NhcGluZyA9IHRydWU7XG4gICAgICBzb3VyY2UgKz0gXCInICtcXG5fX2UoXCIgKyBlc2NhcGVWYWx1ZSArIFwiKSArXFxuJ1wiO1xuICAgIH1cbiAgICBpZiAoZXZhbHVhdGVWYWx1ZSkge1xuICAgICAgaXNFdmFsdWF0aW5nID0gdHJ1ZTtcbiAgICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZVZhbHVlICsgXCI7XFxuX19wICs9ICdcIjtcbiAgICB9XG4gICAgaWYgKGludGVycG9sYXRlVmFsdWUpIHtcbiAgICAgIHNvdXJjZSArPSBcIicgK1xcbigoX190ID0gKFwiICsgaW50ZXJwb2xhdGVWYWx1ZSArIFwiKSkgPT0gbnVsbCA/ICcnIDogX190KSArXFxuJ1wiO1xuICAgIH1cbiAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcbiAgICByZXR1cm4gbWF0Y2g7XG4gIH0pO1xuXG4gIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgc291cmNlID0gJ3dpdGggKG9iaikge1xcbicgKyBzb3VyY2UgKyAnXFxufVxcbic7XG5cbiAgLy8gUmVtb3ZlIHVubmVjZXNzYXJ5IGNvbmNhdGVuYXRpb25zXG4gIHNvdXJjZSA9IChpc0V2YWx1YXRpbmcgPyBzb3VyY2UucmVwbGFjZShyZUVtcHR5U3RyaW5nTGVhZGluZywgJycpIDogc291cmNlKVxuICAgIC5yZXBsYWNlKHJlRW1wdHlTdHJpbmdNaWRkbGUsICckMScpXG4gICAgLnJlcGxhY2UocmVFbXB0eVN0cmluZ1RyYWlsaW5nLCAnJDE7Jyk7XG5cbiAgLy8gRnJhbWUgYXMgZnVuY3Rpb24gYm9keVxuICBzb3VyY2UgPSAnZnVuY3Rpb24ob2JqKSB7XFxuJyArXG4gICAgJ29iaiB8fCAob2JqID0ge30pO1xcbicgK1xuICAgIFwidmFyIF9fdCwgX19wID0gJydcIiArXG4gICAgKGlzRXNjYXBpbmcgPyAnLCBfX2UgPSBfLmVzY2FwZScgOiAnJykgK1xuICAgIChpc0V2YWx1YXRpbmdcbiAgICAgID8gJywgX19qID0gQXJyYXkucHJvdG90eXBlLmpvaW47XFxuZnVuY3Rpb24gcHJpbnQoKSB7IF9fcCArPSBfX2ouY2FsbChhcmd1bWVudHMsIFxcJ1xcJykgfVxcbidcbiAgICAgIDogJztcXG4nXG4gICAgKSArXG4gICAgc291cmNlICtcbiAgICAncmV0dXJuIF9fcFxcbn0nO1xuXG4gIC8vIEFjdHVhbCBjb21waWxlIHN0ZXBcbiAgY29uc3QgcmVzdWx0ID0gYXR0ZW1wdChmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRnVuY3Rpb24oaW1wb3J0S2V5cywgc291cmNlVVJMICsgJ3JldHVybiAnICsgc291cmNlKS5hcHBseSh1bmRlZmluZWQsIGltcG9ydFZhbHVlcyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3LWZ1bmNcbiAgfSk7XG5cbiAgaWYgKGlzRXJyb3IocmVzdWx0KSkge1xuICAgIHJlc3VsdC5zb3VyY2UgPSBzb3VyY2U7IC8vIGV4cG9zZSBmb3IgZGVidWdnaW5nIGlmIGVycm9yXG4gICAgdGhyb3cgcmVzdWx0O1xuICB9XG4gIC8vIEV4cG9zZSBjb21waWxlZCBzb3VyY2VcbiAgcmVzdWx0LnNvdXJjZSA9IHNvdXJjZTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdGVtcGxhdGUodGV4dCkge1xuICByZXR1cm4gX3RlbXBsYXRlKHRleHQpO1xufVxuIl19
