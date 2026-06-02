Package["core-runtime"].queue("minifier-css",function () {/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EmitterPromise = Package.meteor.EmitterPromise;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var transformResult, CssTools;

var require = meteorInstall({"node_modules":{"meteor":{"minifier-css":{"minifier.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/minifier-css/minifier.js                                                                                 //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({CssTools:()=>CssTools});let path;module.link('path',{default(v){path=v}},0);let url;module.link('url',{default(v){url=v}},1);let postcss;module.link('postcss',{default(v){postcss=v}},2);let cssnano;module.link('cssnano',{default(v){cssnano=v}},3);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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




const CssTools = {
    /**
   * Parse the incoming CSS string; return a CSS AST.
   *
   * @param {string} cssText The CSS string to be parsed.
   * @param {Object} options Options to pass to the PostCSS parser.
   * @return {postcss#Root} PostCSS Root AST.
   */ parseCss (cssText, options = {}) {
        // This function previously used the `css-parse` npm package, which
        // set the name of the css file being parsed using  { source: 'filename' }.
        // If included, we'll convert this to the `postcss` equivalent, to maintain
        // backwards compatibility.
        if (options.source) {
            options.from = options.source;
            delete options.source;
        }
        return postcss.parse(cssText, options);
    },
    /**
   * Using the incoming CSS AST, create and return a new object with the
   * generated CSS string, and optional sourcemap details.
   *
   * @param {postcss#Root} cssAst PostCSS Root AST.
   * @param {Object} options Options to pass to the PostCSS parser.
   * @return {Object} Format: { code: 'css string', map: 'sourcemap deatils' }.
   */ stringifyCss (cssAst, options = {}) {
        // This function previously used the `css-stringify` npm package, which
        // controlled sourcemap generation by passing in { sourcemap: true }.
        // If included, we'll convert this to the `postcss` equivalent, to maintain
        // backwards compatibility.
        if (options.sourcemap) {
            options.map = {
                inline: false,
                annotation: false,
                sourcesContent: false
            };
            delete options.sourcemap;
        }
        // explicitly set from to undefined to prevent postcss warnings
        if (!options.from) {
            options.from = void 0;
        }
        transformResult = cssAst.toResult(options);
        return {
            code: transformResult.css,
            map: transformResult.map ? transformResult.map.toJSON() : null
        };
    },
    /**
   * Minify the passed in CSS string.
   *
   * @param {string} cssText CSS string to minify.
   * @return {Promise<String[]>} Array containing the minified CSS.
   */ minifyCss (cssText) {
        return CssTools.minifyCssAsync(cssText);
    },
    /**
   * Minify the passed in CSS string.
   *
   * @param {string} cssText CSS string to minify.
   * @return {Promise<String[]>} Array containing the minified CSS.
   */ minifyCssAsync (cssText) {
        return _async_to_generator(function*() {
            return yield postcss([
                cssnano({
                    safe: true
                })
            ]).process(cssText, {
                from: void 0
            }).then((result)=>[
                    result.css
                ]);
        })();
    },
    /**
   * Merge multiple CSS AST's into one.
   *
   * @param {postcss#Root[]} cssAsts Array of PostCSS Root objects.
   * @callback warnCb Callback used to handle warning messages.
   * @return {postcss#Root} PostCSS Root object.
   */ mergeCssAsts (cssAsts, warnCb) {
        const rulesPredicate = (rules, exclude = false)=>{
            if (!Array.isArray(rules)) {
                rules = [
                    rules
                ];
            }
            return (node)=>{
                // PostCSS AtRule nodes have `type: 'atrule'` and a descriptive name,
                // e.g. 'import' or 'charset', while Comment nodes have type only.
                const nodeMatchesRule = rules.includes(node.name || node.type);
                return exclude ? !nodeMatchesRule : nodeMatchesRule;
            };
        };
        // Simple concatenation of CSS files would break @import rules
        // located in the beginning of a file. Before concatenation, pull
        // @import rules to the beginning of a new syntax tree so they always
        // precede other rules.
        const newAst = postcss.root();
        cssAsts.forEach((ast)=>{
            if (ast.nodes) {
                // Pick only the imports from the beginning of file ignoring @charset
                // rules as every file is assumed to be in UTF-8.
                const charsetRules = ast.nodes.filter(rulesPredicate('charset'));
                if (charsetRules.some((rule)=>{
                    // According to MDN, only 'UTF-8' and "UTF-8" are the correct
                    // encoding directives representing UTF-8.
                    return !/^(['"])UTF-8\1$/.test(rule.params);
                })) {
                    warnCb(ast.filename, '@charset rules in this file will be ignored as UTF-8 is the ' + 'only encoding supported');
                }
                ast.nodes = ast.nodes.filter(rulesPredicate('charset', true));
                let importCount = 0;
                for(let i = 0; i < ast.nodes.length; i++){
                    if (!rulesPredicate([
                        'import',
                        'comment'
                    ])(ast.nodes[i])) {
                        importCount = i;
                        break;
                    }
                }
                CssTools.rewriteCssUrls(ast);
                const imports = ast.nodes.splice(0, importCount);
                newAst.nodes.push(...imports);
                // If there are imports left in the middle of a file, warn users as it
                // might be a potential bug (imports are only valid at the beginning of
                // a file).
                if (ast.nodes.some(rulesPredicate('import'))) {
                    warnCb(ast.filename, 'There are some @import rules in the middle of a file. This ' + 'might be a bug, as imports are only valid at the beginning of ' + 'a file.');
                }
            }
        });
        // Now we can put the rest of CSS rules into new AST.
        cssAsts.forEach((ast)=>{
            if (ast.nodes) {
                newAst.nodes.push(...ast.nodes);
            }
        });
        return newAst;
    },
    /**
   * We are looking for all relative urls defined with the `url()` functional
   * notation and rewriting them to the equivalent absolute url using the
   * `source` path provided by postcss. For performance reasons this function
   * acts by side effect by modifying the given AST without doing a deep copy.
   *
   * @param {postcss#Root} ast PostCSS Root object.
   * @return Modifies the ast param in place.
   */ rewriteCssUrls (ast) {
        const mergedCssPath = '/';
        rewriteRules(ast.nodes, mergedCssPath);
    }
};
if (typeof Profile !== 'undefined') {
    [
        'parseCss',
        'stringifyCss',
        'minifyCss',
        'minifyCssAsync',
        'mergeCssAsts',
        'rewriteCssUrls'
    ].forEach((funcName)=>{
        CssTools[funcName] = Profile(`CssTools.${funcName}`, CssTools[funcName]);
    });
}

const hasOwn = Object.prototype.hasOwnProperty;
const rewriteRules = (rules, mergedCssPath)=>{
    rules.forEach((rule)=>{
        // Recurse if there are sub-rules. An example:
        //     @media (...) {
        //         .rule { url(...); }
        //     }
        if (hasOwn.call(rule, 'nodes')) {
            rewriteRules(rule.nodes, mergedCssPath);
        }
        const appDir = process.cwd();
        const sourceFile = rule.source.input.file;
        const sourceFileFromAppRoot = sourceFile ? sourceFile.replace(appDir, '') : '';
        let basePath = pathJoin('/', pathDirname(sourceFileFromAppRoot));
        // Set the correct basePath based on how the linked asset will be served.
        // XXX This is wrong. We are coupling the information about how files will
        // be served by the web server to the information how they were stored
        // originally on the filesystem in the project structure. Ideally, there
        // should be some module that tells us precisely how each asset will be
        // served but for now we are just assuming that everything that comes from
        // a folder starting with "/packages/" is served on the same path as
        // it was on the filesystem and everything else is served on root "/".
        if (!basePath.match(/^\/?packages\//i)) {
            basePath = "/";
        }
        let value = rule.value;
        // Match css values containing some functional calls to `url(URI)` where
        // URI is optionally quoted.
        // Note that a css value can contains other elements, for instance:
        //   background: top center url("background.png") black;
        // or even multiple url(), for instance for multiple backgrounds.
        var cssUrlRegex = /url\s*\(\s*(['"]?)(.+?)\1\s*\)/gi;
        let parts;
        while(parts = cssUrlRegex.exec(value)){
            const oldCssUrl = parts[0];
            const quote = parts[1];
            const resource = url.parse(parts[2]);
            // We don't rewrite URLs starting with a protocol definition such as
            // http, https, or data, or those with network-path references
            // i.e. //img.domain.com/cat.gif
            if (resource.protocol !== null || resource.href.startsWith('//') || resource.href.startsWith('#')) {
                continue;
            }
            // Rewrite relative paths (that refers to the internal application tree)
            // to absolute paths (addressable from the public build).
            let absolutePath = isRelative(resource.path) ? pathJoin(basePath, resource.path) : resource.path;
            if (resource.hash) {
                absolutePath += resource.hash;
            }
            // We used to finish the rewriting process at the absolute path step
            // above. But it didn't work in case the Meteor application was deployed
            // under a sub-path (eg `ROOT_URL=http://localhost:3000/myapp meteor`)
            // in which case the resources linked in the merged CSS file would miss
            // the `myapp/` prefix. Since this path prefix is only known at launch
            // time (rather than build time) we can't use absolute paths to link
            // resources in the generated CSS.
            //
            // Instead we transform absolute paths to make them relative to the
            // merged CSS, leaving to the browser the responsibility to calculate
            // the final resource links (by adding the application deployment
            // prefix, here `myapp/`, if applicable).
            const relativeToMergedCss = pathRelative(mergedCssPath, absolutePath);
            const newCssUrl = `url(${quote}${relativeToMergedCss}${quote})`;
            value = value.replace(oldCssUrl, newCssUrl);
        }
        rule.value = value;
    });
};
const isRelative = (path)=>path && path.charAt(0) !== '/';
// These are duplicates of functions in tools/files.js, because we don't have
// a good way of exporting them into packages.
// XXX deduplicate files.js into a package at some point so that we can use it
// in core
const toOSPath = (p)=>process.platform === 'win32' ? p.replace(/\//g, '\\') : p;
const toStandardPath = (p)=>process.platform === 'win32' ? p.replace(/\\/g, '/') : p;
const pathJoin = (a, b)=>toStandardPath(path.join(toOSPath(a), toOSPath(b)));
const pathDirname = (p)=>toStandardPath(path.dirname(toOSPath(p)));
const pathRelative = (p1, p2)=>toStandardPath(path.relative(toOSPath(p1), toOSPath(p2)));
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"postcss":{"package.json":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/minifier-css/node_modules/postcss/package.json                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.exports = {
  "name": "postcss",
  "version": "8.5.1",
  "main": "./lib/postcss.js"
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"postcss.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/minifier-css/node_modules/postcss/lib/postcss.js                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.useNode();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"cssnano":{"package.json":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/minifier-css/node_modules/cssnano/package.json                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.exports = {
  "name": "cssnano",
  "version": "5.1.15",
  "main": "src/index.js"
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"src":{"index.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// node_modules/meteor/minifier-css/node_modules/cssnano/src/index.js                                                //
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
  export: function () { return {
      CssTools: CssTools
    };},
  require: require,
  eagerModulePaths: [
    "/node_modules/meteor/minifier-css/minifier.js"
  ],
  mainModulePath: "/node_modules/meteor/minifier-css/minifier.js"
}});

//# sourceURL=meteor://💻app/packages/minifier-css.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbWluaWZpZXItY3NzL21pbmlmaWVyLmpzIl0sIm5hbWVzIjpbIkNzc1Rvb2xzIiwicGFyc2VDc3MiLCJjc3NUZXh0Iiwib3B0aW9ucyIsInNvdXJjZSIsImZyb20iLCJwb3N0Y3NzIiwicGFyc2UiLCJzdHJpbmdpZnlDc3MiLCJjc3NBc3QiLCJzb3VyY2VtYXAiLCJtYXAiLCJpbmxpbmUiLCJhbm5vdGF0aW9uIiwic291cmNlc0NvbnRlbnQiLCJ0cmFuc2Zvcm1SZXN1bHQiLCJ0b1Jlc3VsdCIsImNvZGUiLCJjc3MiLCJ0b0pTT04iLCJtaW5pZnlDc3MiLCJtaW5pZnlDc3NBc3luYyIsImNzc25hbm8iLCJzYWZlIiwicHJvY2VzcyIsInRoZW4iLCJyZXN1bHQiLCJtZXJnZUNzc0FzdHMiLCJjc3NBc3RzIiwid2FybkNiIiwicnVsZXNQcmVkaWNhdGUiLCJydWxlcyIsImV4Y2x1ZGUiLCJBcnJheSIsImlzQXJyYXkiLCJub2RlIiwibm9kZU1hdGNoZXNSdWxlIiwiaW5jbHVkZXMiLCJuYW1lIiwidHlwZSIsIm5ld0FzdCIsInJvb3QiLCJmb3JFYWNoIiwiYXN0Iiwibm9kZXMiLCJjaGFyc2V0UnVsZXMiLCJmaWx0ZXIiLCJzb21lIiwicnVsZSIsInRlc3QiLCJwYXJhbXMiLCJmaWxlbmFtZSIsImltcG9ydENvdW50IiwiaSIsImxlbmd0aCIsInJld3JpdGVDc3NVcmxzIiwiaW1wb3J0cyIsInNwbGljZSIsInB1c2giLCJtZXJnZWRDc3NQYXRoIiwicmV3cml0ZVJ1bGVzIiwiUHJvZmlsZSIsImZ1bmNOYW1lIiwiaGFzT3duIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiYXBwRGlyIiwiY3dkIiwic291cmNlRmlsZSIsImlucHV0IiwiZmlsZSIsInNvdXJjZUZpbGVGcm9tQXBwUm9vdCIsInJlcGxhY2UiLCJiYXNlUGF0aCIsInBhdGhKb2luIiwicGF0aERpcm5hbWUiLCJtYXRjaCIsInZhbHVlIiwiY3NzVXJsUmVnZXgiLCJwYXJ0cyIsImV4ZWMiLCJvbGRDc3NVcmwiLCJxdW90ZSIsInJlc291cmNlIiwidXJsIiwicHJvdG9jb2wiLCJocmVmIiwic3RhcnRzV2l0aCIsImFic29sdXRlUGF0aCIsImlzUmVsYXRpdmUiLCJwYXRoIiwiaGFzaCIsInJlbGF0aXZlVG9NZXJnZWRDc3MiLCJwYXRoUmVsYXRpdmUiLCJuZXdDc3NVcmwiLCJjaGFyQXQiLCJ0b09TUGF0aCIsInAiLCJwbGF0Zm9ybSIsInRvU3RhbmRhcmRQYXRoIiwiYSIsImIiLCJqb2luIiwiZGlybmFtZSIsInAxIiwicDIiLCJyZWxhdGl2ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUF3QjtBQUNGO0FBQ1E7QUFDQTtBQUU5QixNQUFNQSxXQUFXO0lBQ2Y7Ozs7OztHQU1DLEdBQ0RDLFVBQVNDLE9BQU8sRUFBRUMsVUFBVSxDQUFDLENBQUM7UUFDNUIsbUVBQW1FO1FBQ25FLDJFQUEyRTtRQUMzRSwyRUFBMkU7UUFDM0UsMkJBQTJCO1FBQzNCLElBQUlBLFFBQVFDLE1BQU0sRUFBRTtZQUNsQkQsUUFBUUUsSUFBSSxHQUFHRixRQUFRQyxNQUFNO1lBQzdCLE9BQU9ELFFBQVFDLE1BQU07UUFDdkI7UUFDQSxPQUFPRSxRQUFRQyxLQUFLLENBQUNMLFNBQVNDO0lBQ2hDO0lBRUE7Ozs7Ozs7R0FPQyxHQUNESyxjQUFhQyxNQUFNLEVBQUVOLFVBQVUsQ0FBQyxDQUFDO1FBQy9CLHVFQUF1RTtRQUN2RSxxRUFBcUU7UUFDckUsMkVBQTJFO1FBQzNFLDJCQUEyQjtRQUMzQixJQUFJQSxRQUFRTyxTQUFTLEVBQUU7WUFDckJQLFFBQVFRLEdBQUcsR0FBRztnQkFDWkMsUUFBUTtnQkFDUkMsWUFBWTtnQkFDWkMsZ0JBQWdCO1lBQ2xCO1lBQ0EsT0FBT1gsUUFBUU8sU0FBUztRQUMxQjtRQUNBLCtEQUErRDtRQUMvRCxJQUFJLENBQUNQLFFBQVFF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TSxDQUFDLE9BQU87QUFFdEQsNkVBQTZFO0FBQzdFLDhDQUE4QztBQUM5Qyw4RUFBOEU7QUFDOUUsVUFBVTtBQUNWLE1BQU1DLFdBQ0pDLEtBQUszRSxRQUFRNEUsUUFBUSxLQUFLLFVBQVVELEVBQUV6QixPQUFPLENBQUMsT0FBTyxRQUFReUI7QUFDL0QsTUFBTUUsaUJBQ0pGLEtBQUszRSxRQUFRNEUsUUFBUSxLQUFLLFVBQVVELEVBQUV6QixPQUFPLENBQUMsT0FBTyxPQUFPeUI7QUFDOUQsTUFBTXZCLFdBQ0osQ0FBQzBCLEdBQUdDLElBQU1GLGVBQWVULEtBQUtZLElBQUksQ0FBQ04sU0FBU0ksSUFBSUosU0FBU0s7QUFDM0QsTUFBTTFCLGNBQ0pzQixLQUFLRSxlQUFlVCxLQUFLYSxPQUFPLENBQUNQLFNBQVNDO0FBQzVDLE1BQU1KLGVBQ0osQ0FBQ1csSUFBSUMsS0FBT04sZUFBZVQsS0FBS2dCLFFBQVEsQ0FBQ1YsU0FBU1EsS0FBS1IsU0FBU1MiLCJmaWxlIjoiL3BhY2thZ2VzL21pbmlmaWVyLWNzcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IHBvc3Rjc3MgZnJvbSAncG9zdGNzcyc7XG5pbXBvcnQgY3NzbmFubyBmcm9tICdjc3NuYW5vJztcblxuY29uc3QgQ3NzVG9vbHMgPSB7XG4gIC8qKlxuICAgKiBQYXJzZSB0aGUgaW5jb21pbmcgQ1NTIHN0cmluZzsgcmV0dXJuIGEgQ1NTIEFTVC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNzc1RleHQgVGhlIENTUyBzdHJpbmcgdG8gYmUgcGFyc2VkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIHRvIHBhc3MgdG8gdGhlIFBvc3RDU1MgcGFyc2VyLlxuICAgKiBAcmV0dXJuIHtwb3N0Y3NzI1Jvb3R9IFBvc3RDU1MgUm9vdCBBU1QuXG4gICAqL1xuICBwYXJzZUNzcyhjc3NUZXh0LCBvcHRpb25zID0ge30pIHtcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHByZXZpb3VzbHkgdXNlZCB0aGUgYGNzcy1wYXJzZWAgbnBtIHBhY2thZ2UsIHdoaWNoXG4gICAgLy8gc2V0IHRoZSBuYW1lIG9mIHRoZSBjc3MgZmlsZSBiZWluZyBwYXJzZWQgdXNpbmcgIHsgc291cmNlOiAnZmlsZW5hbWUnIH0uXG4gICAgLy8gSWYgaW5jbHVkZWQsIHdlJ2xsIGNvbnZlcnQgdGhpcyB0byB0aGUgYHBvc3Rjc3NgIGVxdWl2YWxlbnQsIHRvIG1haW50YWluXG4gICAgLy8gYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gICAgaWYgKG9wdGlvbnMuc291cmNlKSB7XG4gICAgICBvcHRpb25zLmZyb20gPSBvcHRpb25zLnNvdXJjZTtcbiAgICAgIGRlbGV0ZSBvcHRpb25zLnNvdXJjZTtcbiAgICB9XG4gICAgcmV0dXJuIHBvc3Rjc3MucGFyc2UoY3NzVGV4dCwgb3B0aW9ucyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFVzaW5nIHRoZSBpbmNvbWluZyBDU1MgQVNULCBjcmVhdGUgYW5kIHJldHVybiBhIG5ldyBvYmplY3Qgd2l0aCB0aGVcbiAgICogZ2VuZXJhdGVkIENTUyBzdHJpbmcsIGFuZCBvcHRpb25hbCBzb3VyY2VtYXAgZGV0YWlscy5cbiAgICpcbiAgICogQHBhcmFtIHtwb3N0Y3NzI1Jvb3R9IGNzc0FzdCBQb3N0Q1NTIFJvb3QgQVNULlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIHRvIHBhc3MgdG8gdGhlIFBvc3RDU1MgcGFyc2VyLlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEZvcm1hdDogeyBjb2RlOiAnY3NzIHN0cmluZycsIG1hcDogJ3NvdXJjZW1hcCBkZWF0aWxzJyB9LlxuICAgKi9cbiAgc3RyaW5naWZ5Q3NzKGNzc0FzdCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgLy8gVGhpcyBmdW5jdGlvbiBwcmV2aW91c2x5IHVzZWQgdGhlIGBjc3Mtc3RyaW5naWZ5YCBucG0gcGFja2FnZSwgd2hpY2hcbiAgICAvLyBjb250cm9sbGVkIHNvdXJjZW1hcCBnZW5lcmF0aW9uIGJ5IHBhc3NpbmcgaW4geyBzb3VyY2VtYXA6IHRydWUgfS5cbiAgICAvLyBJZiBpbmNsdWRlZCwgd2UnbGwgY29udmVydCB0aGlzIHRvIHRoZSBgcG9zdGNzc2AgZXF1aXZhbGVudCwgdG8gbWFpbnRhaW5cbiAgICAvLyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbiAgICBpZiAob3B0aW9ucy5zb3VyY2VtYXApIHtcbiAgICAgIG9wdGlvbnMubWFwID0ge1xuICAgICAgICBpbmxpbmU6IGZhbHNlLFxuICAgICAgICBhbm5vdGF0aW9uOiBmYWxzZSxcbiAgICAgICAgc291cmNlc0NvbnRlbnQ6IGZhbHNlLFxuICAgICAgfTtcbiAgICAgIGRlbGV0ZSBvcHRpb25zLnNvdXJjZW1hcDtcbiAgICB9XG4gICAgLy8gZXhwbGljaXRseSBzZXQgZnJvbSB0byB1bmRlZmluZWQgdG8gcHJldmVudCBwb3N0Y3NzIHdhcm5pbmdzXG4gICAgaWYgKCFvcHRpb25zLmZyb20pe1xuICAgICAgb3B0aW9ucy5mcm9tID0gdm9pZCAwO1xuICAgIH1cblxuICAgIHRyYW5zZm9ybVJlc3VsdCA9IGNzc0FzdC50b1Jlc3VsdChvcHRpb25zKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiB0cmFuc2Zvcm1SZXN1bHQuY3NzLFxuICAgICAgbWFwOiB0cmFuc2Zvcm1SZXN1bHQubWFwID8gdHJhbnNmb3JtUmVzdWx0Lm1hcC50b0pTT04oKSA6IG51bGwsXG4gICAgfTtcbiAgfSxcblxuICAvKipcbiAgICogTWluaWZ5IHRoZSBwYXNzZWQgaW4gQ1NTIHN0cmluZy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNzc1RleHQgQ1NTIHN0cmluZyB0byBtaW5pZnkuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U3RyaW5nW10+fSBBcnJheSBjb250YWluaW5nIHRoZSBtaW5pZmllZCBDU1MuXG4gICAqL1xuICBtaW5pZnlDc3MoY3NzVGV4dCkge1xuICAgIHJldHVybiBDc3NUb29scy5taW5pZnlDc3NBc3luYyhjc3NUZXh0KTtcbiAgfSxcblxuICAvKipcbiAgICogTWluaWZ5IHRoZSBwYXNzZWQgaW4gQ1NTIHN0cmluZy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNzc1RleHQgQ1NTIHN0cmluZyB0byBtaW5pZnkuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U3RyaW5nW10+fSBBcnJheSBjb250YWluaW5nIHRoZSBtaW5pZmllZCBDU1MuXG4gICAqL1xuICBhc3luYyBtaW5pZnlDc3NBc3luYyhjc3NUZXh0KSB7XG4gICAgcmV0dXJuIGF3YWl0IHBvc3Rjc3MoW2Nzc25hbm8oeyBzYWZlOiB0cnVlIH0pXSlcbiAgICAgIC5wcm9jZXNzKGNzc1RleHQsIHtcbiAgICAgICAgZnJvbTogdm9pZCAwLFxuICAgICAgfSlcbiAgICAgIC50aGVuKChyZXN1bHQpID0+IFtyZXN1bHQuY3NzXSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIE1lcmdlIG11bHRpcGxlIENTUyBBU1QncyBpbnRvIG9uZS5cbiAgICpcbiAgICogQHBhcmFtIHtwb3N0Y3NzI1Jvb3RbXX0gY3NzQXN0cyBBcnJheSBvZiBQb3N0Q1NTIFJvb3Qgb2JqZWN0cy5cbiAgICogQGNhbGxiYWNrIHdhcm5DYiBDYWxsYmFjayB1c2VkIHRvIGhhbmRsZSB3YXJuaW5nIG1lc3NhZ2VzLlxuICAgKiBAcmV0dXJuIHtwb3N0Y3NzI1Jvb3R9IFBvc3RDU1MgUm9vdCBvYmplY3QuXG4gICAqL1xuICBtZXJnZUNzc0FzdHMoY3NzQXN0cywgd2FybkNiKSB7XG4gICAgY29uc3QgcnVsZXNQcmVkaWNhdGUgPSAocnVsZXMsIGV4Y2x1ZGUgPSBmYWxzZSkgPT4ge1xuICAgICAgaWYgKCEgQXJyYXkuaXNBcnJheShydWxlcykpIHtcbiAgICAgICAgcnVsZXMgPSBbcnVsZXNdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGUgPT4ge1xuICAgICAgICAvLyBQb3N0Q1NTIEF0UnVsZSBub2RlcyBoYXZlIGB0eXBlOiAnYXRydWxlJ2AgYW5kIGEgZGVzY3JpcHRpdmUgbmFtZSxcbiAgICAgICAgLy8gZS5nLiAnaW1wb3J0JyBvciAnY2hhcnNldCcsIHdoaWxlIENvbW1lbnQgbm9kZXMgaGF2ZSB0eXBlIG9ubHkuXG4gICAgICAgIGNvbnN0IG5vZGVNYXRjaGVzUnVsZSA9IHJ1bGVzLmluY2x1ZGVzKG5vZGUubmFtZSB8fCBub2RlLnR5cGUpO1xuXG4gICAgICAgIHJldHVybiBleGNsdWRlID8gIW5vZGVNYXRjaGVzUnVsZSA6IG5vZGVNYXRjaGVzUnVsZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gU2ltcGxlIGNvbmNhdGVuYXRpb24gb2YgQ1NTIGZpbGVzIHdvdWxkIGJyZWFrIEBpbXBvcnQgcnVsZXNcbiAgICAvLyBsb2NhdGVkIGluIHRoZSBiZWdpbm5pbmcgb2YgYSBmaWxlLiBCZWZvcmUgY29uY2F0ZW5hdGlvbiwgcHVsbFxuICAgIC8vIEBpbXBvcnQgcnVsZXMgdG8gdGhlIGJlZ2lubmluZyBvZiBhIG5ldyBzeW50YXggdHJlZSBzbyB0aGV5IGFsd2F5c1xuICAgIC8vIHByZWNlZGUgb3RoZXIgcnVsZXMuXG4gICAgY29uc3QgbmV3QXN0ID0gcG9zdGNzcy5yb290KCk7XG5cbiAgICBjc3NBc3RzLmZvckVhY2goKGFzdCkgPT4ge1xuICAgICAgaWYgKGFzdC5ub2Rlcykge1xuICAgICAgICAvLyBQaWNrIG9ubHkgdGhlIGltcG9ydHMgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIGZpbGUgaWdub3JpbmcgQGNoYXJzZXRcbiAgICAgICAgLy8gcnVsZXMgYXMgZXZlcnkgZmlsZSBpcyBhc3N1bWVkIHRvIGJlIGluIFVURi04LlxuICAgICAgICBjb25zdCBjaGFyc2V0UnVsZXMgPSBhc3Qubm9kZXMuZmlsdGVyKHJ1bGVzUHJlZGljYXRlKCdjaGFyc2V0JykpO1xuXG4gICAgICAgIGlmIChjaGFyc2V0UnVsZXMuc29tZSgocnVsZSkgPT4ge1xuICAgICAgICAgIC8vIEFjY29yZGluZyB0byBNRE4sIG9ubHkgJ1VURi04JyBhbmQgXCJVVEYtOFwiIGFyZSB0aGUgY29ycmVjdFxuICAgICAgICAgIC8vIGVuY29kaW5nIGRpcmVjdGl2ZXMgcmVwcmVzZW50aW5nIFVURi04LlxuICAgICAgICAgIHJldHVybiAhIC9eKFsnXCJdKVVURi04XFwxJC8udGVzdChydWxlLnBhcmFtcyk7XG4gICAgICAgIH0pKSB7XG4gICAgICAgICAgd2FybkNiKFxuICAgICAgICAgICAgYXN0LmZpbGVuYW1lLFxuICAgICAgICAgICAgJ0BjaGFyc2V0IHJ1bGVzIGluIHRoaXMgZmlsZSB3aWxsIGJlIGlnbm9yZWQgYXMgVVRGLTggaXMgdGhlICcgK1xuICAgICAgICAgICAgJ29ubHkgZW5jb2Rpbmcgc3VwcG9ydGVkJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBhc3Qubm9kZXMgPSBhc3Qubm9kZXMuZmlsdGVyKHJ1bGVzUHJlZGljYXRlKCdjaGFyc2V0JywgdHJ1ZSkpO1xuICAgICAgICBsZXQgaW1wb3J0Q291bnQgPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFzdC5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICghIHJ1bGVzUHJlZGljYXRlKFsnaW1wb3J0JywgJ2NvbW1lbnQnXSkoYXN0Lm5vZGVzW2ldKSkge1xuICAgICAgICAgICAgaW1wb3J0Q291bnQgPSBpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgQ3NzVG9vbHMucmV3cml0ZUNzc1VybHMoYXN0KTtcblxuICAgICAgICBjb25zdCBpbXBvcnRzID0gYXN0Lm5vZGVzLnNwbGljZSgwLCBpbXBvcnRDb3VudCk7XG4gICAgICAgIG5ld0FzdC5ub2Rlcy5wdXNoKC4uLmltcG9ydHMpO1xuXG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSBpbXBvcnRzIGxlZnQgaW4gdGhlIG1pZGRsZSBvZiBhIGZpbGUsIHdhcm4gdXNlcnMgYXMgaXRcbiAgICAgICAgLy8gbWlnaHQgYmUgYSBwb3RlbnRpYWwgYnVnIChpbXBvcnRzIGFyZSBvbmx5IHZhbGlkIGF0IHRoZSBiZWdpbm5pbmcgb2ZcbiAgICAgICAgLy8gYSBmaWxlKS5cbiAgICAgICAgaWYgKGFzdC5ub2Rlcy5zb21lKHJ1bGVzUHJlZGljYXRlKCdpbXBvcnQnKSkpIHtcbiAgICAgICAgICB3YXJuQ2IoXG4gICAgICAgICAgICBhc3QuZmlsZW5hbWUsXG4gICAgICAgICAgICAnVGhlcmUgYXJlIHNvbWUgQGltcG9ydCBydWxlcyBpbiB0aGUgbWlkZGxlIG9mIGEgZmlsZS4gVGhpcyAnICtcbiAgICAgICAgICAgICdtaWdodCBiZSBhIGJ1ZywgYXMgaW1wb3J0cyBhcmUgb25seSB2YWxpZCBhdCB0aGUgYmVnaW5uaW5nIG9mICcgK1xuICAgICAgICAgICAgJ2EgZmlsZS4nXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTm93IHdlIGNhbiBwdXQgdGhlIHJlc3Qgb2YgQ1NTIHJ1bGVzIGludG8gbmV3IEFTVC5cbiAgICBjc3NBc3RzLmZvckVhY2goKGFzdCkgPT4ge1xuICAgICAgaWYgKGFzdC5ub2Rlcykge1xuICAgICAgICBuZXdBc3Qubm9kZXMucHVzaCguLi5hc3Qubm9kZXMpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ld0FzdDtcbiAgfSxcblxuICAvKipcbiAgICogV2UgYXJlIGxvb2tpbmcgZm9yIGFsbCByZWxhdGl2ZSB1cmxzIGRlZmluZWQgd2l0aCB0aGUgYHVybCgpYCBmdW5jdGlvbmFsXG4gICAqIG5vdGF0aW9uIGFuZCByZXdyaXRpbmcgdGhlbSB0byB0aGUgZXF1aXZhbGVudCBhYnNvbHV0ZSB1cmwgdXNpbmcgdGhlXG4gICAqIGBzb3VyY2VgIHBhdGggcHJvdmlkZWQgYnkgcG9zdGNzcy4gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgdGhpcyBmdW5jdGlvblxuICAgKiBhY3RzIGJ5IHNpZGUgZWZmZWN0IGJ5IG1vZGlmeWluZyB0aGUgZ2l2ZW4gQVNUIHdpdGhvdXQgZG9pbmcgYSBkZWVwIGNvcHkuXG4gICAqXG4gICAqIEBwYXJhbSB7cG9zdGNzcyNSb290fSBhc3QgUG9zdENTUyBSb290IG9iamVjdC5cbiAgICogQHJldHVybiBNb2RpZmllcyB0aGUgYXN0IHBhcmFtIGluIHBsYWNlLlxuICAgKi9cbiAgcmV3cml0ZUNzc1VybHMoYXN0KSB7XG4gICAgY29uc3QgbWVyZ2VkQ3NzUGF0aCA9ICcvJztcbiAgICByZXdyaXRlUnVsZXMoYXN0Lm5vZGVzLCBtZXJnZWRDc3NQYXRoKTtcbiAgfVxufTtcblxuaWYgKHR5cGVvZiBQcm9maWxlICE9PSAndW5kZWZpbmVkJykge1xuICBbXG4gICAgJ3BhcnNlQ3NzJyxcbiAgICAnc3RyaW5naWZ5Q3NzJyxcbiAgICAnbWluaWZ5Q3NzJyxcbiAgICAnbWluaWZ5Q3NzQXN5bmMnLFxuICAgICdtZXJnZUNzc0FzdHMnLFxuICAgICdyZXdyaXRlQ3NzVXJscycsXG4gIF0uZm9yRWFjaChmdW5jTmFtZSA9PiB7XG4gICAgQ3NzVG9vbHNbZnVuY05hbWVdID0gUHJvZmlsZShgQ3NzVG9vbHMuJHtmdW5jTmFtZX1gLCBDc3NUb29sc1tmdW5jTmFtZV0pO1xuICB9KTtcbn1cblxuZXhwb3J0IHsgQ3NzVG9vbHMgfTtcblxuY29uc3QgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuY29uc3QgcmV3cml0ZVJ1bGVzID0gKHJ1bGVzLCBtZXJnZWRDc3NQYXRoKSA9PiB7XG4gIHJ1bGVzLmZvckVhY2goKHJ1bGUpID0+IHtcbiAgICAvLyBSZWN1cnNlIGlmIHRoZXJlIGFyZSBzdWItcnVsZXMuIEFuIGV4YW1wbGU6XG4gICAgLy8gICAgIEBtZWRpYSAoLi4uKSB7XG4gICAgLy8gICAgICAgICAucnVsZSB7IHVybCguLi4pOyB9XG4gICAgLy8gICAgIH1cbiAgICBpZiAoaGFzT3duLmNhbGwocnVsZSwgJ25vZGVzJykpIHtcbiAgICAgIHJld3JpdGVSdWxlcyhydWxlLm5vZGVzLCBtZXJnZWRDc3NQYXRoKTtcbiAgICB9XG5cbiAgICBjb25zdCBhcHBEaXIgPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBydWxlLnNvdXJjZS5pbnB1dC5maWxlO1xuICAgIGNvbnN0IHNvdXJjZUZpbGVGcm9tQXBwUm9vdCA9XG4gICAgICBzb3VyY2VGaWxlID8gc291cmNlRmlsZS5yZXBsYWNlKGFwcERpciwgJycpIDogJyc7XG4gICAgbGV0IGJhc2VQYXRoID0gcGF0aEpvaW4oJy8nLCBwYXRoRGlybmFtZShzb3VyY2VGaWxlRnJvbUFwcFJvb3QpKTtcblxuICAgIC8vIFNldCB0aGUgY29ycmVjdCBiYXNlUGF0aCBiYXNlZCBvbiBob3cgdGhlIGxpbmtlZCBhc3NldCB3aWxsIGJlIHNlcnZlZC5cbiAgICAvLyBYWFggVGhpcyBpcyB3cm9uZy4gV2UgYXJlIGNvdXBsaW5nIHRoZSBpbmZvcm1hdGlvbiBhYm91dCBob3cgZmlsZXMgd2lsbFxuICAgIC8vIGJlIHNlcnZlZCBieSB0aGUgd2ViIHNlcnZlciB0byB0aGUgaW5mb3JtYXRpb24gaG93IHRoZXkgd2VyZSBzdG9yZWRcbiAgICAvLyBvcmlnaW5hbGx5IG9uIHRoZSBmaWxlc3lzdGVtIGluIHRoZSBwcm9qZWN0IHN0cnVjdHVyZS4gSWRlYWxseSwgdGhlcmVcbiAgICAvLyBzaG91bGQgYmUgc29tZSBtb2R1bGUgdGhhdCB0ZWxscyB1cyBwcmVjaXNlbHkgaG93IGVhY2ggYXNzZXQgd2lsbCBiZVxuICAgIC8vIHNlcnZlZCBidXQgZm9yIG5vdyB3ZSBhcmUganVzdCBhc3N1bWluZyB0aGF0IGV2ZXJ5dGhpbmcgdGhhdCBjb21lcyBmcm9tXG4gICAgLy8gYSBmb2xkZXIgc3RhcnRpbmcgd2l0aCBcIi9wYWNrYWdlcy9cIiBpcyBzZXJ2ZWQgb24gdGhlIHNhbWUgcGF0aCBhc1xuICAgIC8vIGl0IHdhcyBvbiB0aGUgZmlsZXN5c3RlbSBhbmQgZXZlcnl0aGluZyBlbHNlIGlzIHNlcnZlZCBvbiByb290IFwiL1wiLlxuICAgIGlmICghIGJhc2VQYXRoLm1hdGNoKC9eXFwvP3BhY2thZ2VzXFwvL2kpKSB7XG4gICAgICBiYXNlUGF0aCA9IFwiL1wiO1xuICAgIH1cblxuICAgIGxldCB2YWx1ZSA9IHJ1bGUudmFsdWU7XG5cbiAgICAvLyBNYXRjaCBjc3MgdmFsdWVzIGNvbnRhaW5pbmcgc29tZSBmdW5jdGlvbmFsIGNhbGxzIHRvIGB1cmwoVVJJKWAgd2hlcmVcbiAgICAvLyBVUkkgaXMgb3B0aW9uYWxseSBxdW90ZWQuXG4gICAgLy8gTm90ZSB0aGF0IGEgY3NzIHZhbHVlIGNhbiBjb250YWlucyBvdGhlciBlbGVtZW50cywgZm9yIGluc3RhbmNlOlxuICAgIC8vICAgYmFja2dyb3VuZDogdG9wIGNlbnRlciB1cmwoXCJiYWNrZ3JvdW5kLnBuZ1wiKSBibGFjaztcbiAgICAvLyBvciBldmVuIG11bHRpcGxlIHVybCgpLCBmb3IgaW5zdGFuY2UgZm9yIG11bHRpcGxlIGJhY2tncm91bmRzLlxuICAgIHZhciBjc3NVcmxSZWdleCA9IC91cmxcXHMqXFwoXFxzKihbJ1wiXT8pKC4rPylcXDFcXHMqXFwpL2dpO1xuICAgIGxldCBwYXJ0cztcbiAgICB3aGlsZSAocGFydHMgPSBjc3NVcmxSZWdleC5leGVjKHZhbHVlKSkge1xuICAgICAgY29uc3Qgb2xkQ3NzVXJsID0gcGFydHNbMF07XG4gICAgICBjb25zdCBxdW90ZSA9IHBhcnRzWzFdO1xuICAgICAgY29uc3QgcmVzb3VyY2UgPSB1cmwucGFyc2UocGFydHNbMl0pO1xuXG4gICAgICAvLyBXZSBkb24ndCByZXdyaXRlIFVSTHMgc3RhcnRpbmcgd2l0aCBhIHByb3RvY29sIGRlZmluaXRpb24gc3VjaCBhc1xuICAgICAgLy8gaHR0cCwgaHR0cHMsIG9yIGRhdGEsIG9yIHRob3NlIHdpdGggbmV0d29yay1wYXRoIHJlZmVyZW5jZXNcbiAgICAgIC8vIGkuZS4gLy9pbWcuZG9tYWluLmNvbS9jYXQuZ2lmXG4gICAgICBpZiAocmVzb3VyY2UucHJvdG9jb2wgIT09IG51bGwgfHxcbiAgICAgICAgICByZXNvdXJjZS5ocmVmLnN0YXJ0c1dpdGgoJy8vJykgfHxcbiAgICAgICAgICByZXNvdXJjZS5ocmVmLnN0YXJ0c1dpdGgoJyMnKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gUmV3cml0ZSByZWxhdGl2ZSBwYXRocyAodGhhdCByZWZlcnMgdG8gdGhlIGludGVybmFsIGFwcGxpY2F0aW9uIHRyZWUpXG4gICAgICAvLyB0byBhYnNvbHV0ZSBwYXRocyAoYWRkcmVzc2FibGUgZnJvbSB0aGUgcHVibGljIGJ1aWxkKS5cbiAgICAgIGxldCBhYnNvbHV0ZVBhdGggPSBpc1JlbGF0aXZlKHJlc291cmNlLnBhdGgpXG4gICAgICAgID8gcGF0aEpvaW4oYmFzZVBhdGgsIHJlc291cmNlLnBhdGgpXG4gICAgICAgIDogcmVzb3VyY2UucGF0aDtcblxuICAgICAgaWYgKHJlc291cmNlLmhhc2gpIHtcbiAgICAgICAgYWJzb2x1dGVQYXRoICs9IHJlc291cmNlLmhhc2g7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIHVzZWQgdG8gZmluaXNoIHRoZSByZXdyaXRpbmcgcHJvY2VzcyBhdCB0aGUgYWJzb2x1dGUgcGF0aCBzdGVwXG4gICAgICAvLyBhYm92ZS4gQnV0IGl0IGRpZG4ndCB3b3JrIGluIGNhc2UgdGhlIE1ldGVvciBhcHBsaWNhdGlvbiB3YXMgZGVwbG95ZWRcbiAgICAgIC8vIHVuZGVyIGEgc3ViLXBhdGggKGVnIGBST09UX1VSTD1odHRwOi8vbG9jYWxob3N0OjMwMDAvbXlhcHAgbWV0ZW9yYClcbiAgICAgIC8vIGluIHdoaWNoIGNhc2UgdGhlIHJlc291cmNlcyBsaW5rZWQgaW4gdGhlIG1lcmdlZCBDU1MgZmlsZSB3b3VsZCBtaXNzXG4gICAgICAvLyB0aGUgYG15YXBwL2AgcHJlZml4LiBTaW5jZSB0aGlzIHBhdGggcHJlZml4IGlzIG9ubHkga25vd24gYXQgbGF1bmNoXG4gICAgICAvLyB0aW1lIChyYXRoZXIgdGhhbiBidWlsZCB0aW1lKSB3ZSBjYW4ndCB1c2UgYWJzb2x1dGUgcGF0aHMgdG8gbGlua1xuICAgICAgLy8gcmVzb3VyY2VzIGluIHRoZSBnZW5lcmF0ZWQgQ1NTLlxuICAgICAgLy9cbiAgICAgIC8vIEluc3RlYWQgd2UgdHJhbnNmb3JtIGFic29sdXRlIHBhdGhzIHRvIG1ha2UgdGhlbSByZWxhdGl2ZSB0byB0aGVcbiAgICAgIC8vIG1lcmdlZCBDU1MsIGxlYXZpbmcgdG8gdGhlIGJyb3dzZXIgdGhlIHJlc3BvbnNpYmlsaXR5IHRvIGNhbGN1bGF0ZVxuICAgICAgLy8gdGhlIGZpbmFsIHJlc291cmNlIGxpbmtzIChieSBhZGRpbmcgdGhlIGFwcGxpY2F0aW9uIGRlcGxveW1lbnRcbiAgICAgIC8vIHByZWZpeCwgaGVyZSBgbXlhcHAvYCwgaWYgYXBwbGljYWJsZSkuXG4gICAgICBjb25zdCByZWxhdGl2ZVRvTWVyZ2VkQ3NzID0gcGF0aFJlbGF0aXZlKG1lcmdlZENzc1BhdGgsIGFic29sdXRlUGF0aCk7XG4gICAgICBjb25zdCBuZXdDc3NVcmwgPSBgdXJsKCR7cXVvdGV9JHtyZWxhdGl2ZVRvTWVyZ2VkQ3NzfSR7cXVvdGV9KWA7XG4gICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2Uob2xkQ3NzVXJsLCBuZXdDc3NVcmwpO1xuICAgIH1cblxuICAgIHJ1bGUudmFsdWUgPSB2YWx1ZTtcbiAgfSk7XG59O1xuXG5jb25zdCBpc1JlbGF0aXZlID0gcGF0aCA9PiBwYXRoICYmIHBhdGguY2hhckF0KDApICE9PSAnLyc7XG5cbi8vIFRoZXNlIGFyZSBkdXBsaWNhdGVzIG9mIGZ1bmN0aW9ucyBpbiB0b29scy9maWxlcy5qcywgYmVjYXVzZSB3ZSBkb24ndCBoYXZlXG4vLyBhIGdvb2Qgd2F5IG9mIGV4cG9ydGluZyB0aGVtIGludG8gcGFja2FnZXMuXG4vLyBYWFggZGVkdXBsaWNhdGUgZmlsZXMuanMgaW50byBhIHBhY2thZ2UgYXQgc29tZSBwb2ludCBzbyB0aGF0IHdlIGNhbiB1c2UgaXRcbi8vIGluIGNvcmVcbmNvbnN0IHRvT1NQYXRoID1cbiAgcCA9PiBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInID8gcC5yZXBsYWNlKC9cXC8vZywgJ1xcXFwnKSA6IHA7XG5jb25zdCB0b1N0YW5kYXJkUGF0aCA9XG4gIHAgPT4gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyA/IHAucmVwbGFjZSgvXFxcXC9nLCAnLycpIDogcDtcbmNvbnN0IHBhdGhKb2luID1cbiAgKGEsIGIpID0+IHRvU3RhbmRhcmRQYXRoKHBhdGguam9pbih0b09TUGF0aChhKSwgdG9PU1BhdGgoYikpKTtcbmNvbnN0IHBhdGhEaXJuYW1lID1cbiAgcCA9PiB0b1N0YW5kYXJkUGF0aChwYXRoLmRpcm5hbWUodG9PU1BhdGgocCkpKTtcbmNvbnN0IHBhdGhSZWxhdGl2ZSA9XG4gIChwMSwgcDIpID0+IHRvU3RhbmRhcmRQYXRoKHBhdGgucmVsYXRpdmUodG9PU1BhdGgocDEpLCB0b09TUGF0aChwMikpKTtcbiJdfQ==
