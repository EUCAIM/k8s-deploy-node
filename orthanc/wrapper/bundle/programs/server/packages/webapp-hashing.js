Package["core-runtime"].queue("webapp-hashing",function () {/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EmitterPromise = Package.meteor.EmitterPromise;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var WebAppHashing;

var require = meteorInstall({"node_modules":{"meteor":{"webapp-hashing":{"webapp-hashing.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/webapp-hashing/webapp-hashing.js                                                                         //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {let createHash;module.link("crypto",{createHash(v){createHash=v}},0);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function _object_without_properties(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
        var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
        for(i = 0; i < sourceSymbolKeys.length; i++){
            key = sourceSymbolKeys[i];
            if (excluded.indexOf(key) >= 0) continue;
            if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
            target[key] = source[key];
        }
    }
    return target;
}
function _object_without_properties_loose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
    }
    return target;
}

WebAppHashing = {};
// Calculate a hash of all the client resources downloaded by the
// browser, including the application HTML, runtime config, code, and
// static files.
//
// This hash *must* change if any resources seen by the browser
// change, and ideally *doesn't* change for any server-only changes
// (but the second is a performance enhancement, not a hard
// requirement).
WebAppHashing.calculateClientHash = function(manifest, includeFilter, runtimeConfigOverride) {
    var hash = createHash('sha1');
    // Omit the old hashed client values in the new hash. These may be
    // modified in the new boilerplate.
    var { autoupdateVersion, autoupdateVersionRefreshable, autoupdateVersionCordova } = __meteor_runtime_config__, runtimeCfg = _object_without_properties(__meteor_runtime_config__, [
        "autoupdateVersion",
        "autoupdateVersionRefreshable",
        "autoupdateVersionCordova"
    ]);
    if (runtimeConfigOverride) {
        runtimeCfg = runtimeConfigOverride;
    }
    hash.update(JSON.stringify(runtimeCfg, 'utf8'));
    manifest.forEach(function(resource) {
        if ((!includeFilter || includeFilter(resource.type, resource.replaceable)) && (resource.where === 'client' || resource.where === 'internal')) {
            hash.update(resource.path);
            hash.update(resource.hash);
        }
    });
    return hash.digest('hex');
};
WebAppHashing.calculateCordovaCompatibilityHash = function(platformVersion, pluginVersions) {
    const hash = createHash('sha1');
    hash.update(platformVersion);
    // Sort plugins first so iteration order doesn't affect the hash
    const plugins = Object.keys(pluginVersions).sort();
    for (let plugin of plugins){
        const version = pluginVersions[plugin];
        hash.update(plugin);
        hash.update(version);
    }
    return hash.digest('hex');
};
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});


/* Exports */
return {
  export: function () { return {
      WebAppHashing: WebAppHashing
    };},
  require: require,
  eagerModulePaths: [
    "/node_modules/meteor/webapp-hashing/webapp-hashing.js"
  ]
}});

//# sourceURL=meteor://💻app/packages/webapp-hashing.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvd2ViYXBwLWhhc2hpbmcvd2ViYXBwLWhhc2hpbmcuanMiXSwibmFtZXMiOlsiV2ViQXBwSGFzaGluZyIsImNhbGN1bGF0ZUNsaWVudEhhc2giLCJtYW5pZmVzdCIsImluY2x1ZGVGaWx0ZXIiLCJydW50aW1lQ29uZmlnT3ZlcnJpZGUiLCJoYXNoIiwiY3JlYXRlSGFzaCIsImF1dG91cGRhdGVWZXJzaW9uIiwiYXV0b3VwZGF0ZVZlcnNpb25SZWZyZXNoYWJsZSIsImF1dG91cGRhdGVWZXJzaW9uQ29yZG92YSIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJydW50aW1lQ2ZnIiwidXBkYXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsImZvckVhY2giLCJyZXNvdXJjZSIsInR5cGUiLCJyZXBsYWNlYWJsZSIsIndoZXJlIiwicGF0aCIsImRpZ2VzdCIsImNhbGN1bGF0ZUNvcmRvdmFDb21wYXRpYmlsaXR5SGFzaCIsInBsYXRmb3JtVmVyc2lvbiIsInBsdWdpblZlcnNpb25zIiwicGx1Z2lucyIsIk9iamVjdCIsImtleXMiLCJzb3J0IiwicGx1Z2luIiwidmVyc2lvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBb0M7QUFFcENBLGdCQUFnQixDQUFDO0FBRWpCLGlFQUFpRTtBQUNqRSxxRUFBcUU7QUFDckUsZ0JBQWdCO0FBQ2hCLEVBQUU7QUFDRiwrREFBK0Q7QUFDL0QsbUVBQW1FO0FBQ25FLDJEQUEyRDtBQUMzRCxnQkFBZ0I7QUFFaEJBLGNBQWNDLG1CQUFtQixHQUMvQixTQUFVQyxRQUFRLEVBQUVDLGFBQWEsRUFBRUMscUJBQXFCO0lBQ3hELElBQUlDLE9BQU9DLFdBQVc7SUFFdEIsa0VBQWtFO0lBQ2xFLG1DQUFtQztJQUNuQyxJQUFJLEVBQUVDLGlCQUFpQixFQUFFQyw0QkFBNEIsRUFBRUMsd0JBQXdCLEVBQWlCLEdBQUdDLDJCQUFmQyx3Q0FBZUQ7UUFBN0ZIO1FBQW1CQztRQUE4QkM7O0lBRXZELElBQUlMLHVCQUF1QjtRQUN6Qk8sYUFBYVA7SUFDZjtJQUVBQyxLQUFLTyxNQUFNLENBQUNDLEtBQUtDLFNBQVMsQ0FBQ0gsWUFBWTtJQUV2Q1QsU0FBU2EsT0FBTyxDQUFDLFNBQVVDLFFBQVE7UUFDL0IsSUFBSyxFQUFFYixpQkFBaUJBLGNBQWNhLFNBQVNDLElBQUksRUFBRUQsU0FBU0UsV0FBVyxNQUNwRUYsVUFBU0csS0FBSyxLQUFLLFlBQVlILFNBQVNHLEtBQUssS0FBSyxVQUFTLEdBQUk7WUFDcEVkLEtBQUtPLE1BQU0sQ0FBQ0ksU0FBU0ksSUFBSTtZQUN6QmYsS0FBS08sTUFBTSxDQUFDSSxTQUFTWCxJQUFJO1FBQzNCO0lBQ0Y7SUFDQSxPQUFPQSxLQUFLZ0IsTUFBTSxDQUFDO0FBQ3JCO0FBRUFyQixjQUFjc0IsaUNBQWlDLEdBQzdDLFNBQVNDLGVBQWUsRUFBRUMsY0FBYztJQUN4QyxNQUFNbkIsT0FBT0MsV0FBVztJQUV4QkQsS0FBS08sTUFBTSxDQUFDVztJQUVaLGdFQUFnRTtJQUNoRSxNQUFNRSxVQUFVQyxPQUFPQyxJQUFJLENBQUNILGdCQUFnQkksSUFBSTtJQUNoRCxLQUFLLElBQUlDLFVBQVVKLFFBQVM7UUFDMUIsTUFBTUssVUFBVU4sY0FBYyxDQUFDSyxPQUFPO1FBQ3RDeEIsS0FBS08sTUFBTSxDQUFDaUI7UUFDWnhCLEtBQUtPLE1BQU0sQ0FBQ2tCO0lBQ2Q7SUFFQSxPQUFPekIsS0FBS2dCLE1BQU0sQ0FBQztBQUNyQiIsImZpbGUiOiIvcGFja2FnZXMvd2ViYXBwLWhhc2hpbmcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVIYXNoIH0gZnJvbSBcImNyeXB0b1wiO1xuXG5XZWJBcHBIYXNoaW5nID0ge307XG5cbi8vIENhbGN1bGF0ZSBhIGhhc2ggb2YgYWxsIHRoZSBjbGllbnQgcmVzb3VyY2VzIGRvd25sb2FkZWQgYnkgdGhlXG4vLyBicm93c2VyLCBpbmNsdWRpbmcgdGhlIGFwcGxpY2F0aW9uIEhUTUwsIHJ1bnRpbWUgY29uZmlnLCBjb2RlLCBhbmRcbi8vIHN0YXRpYyBmaWxlcy5cbi8vXG4vLyBUaGlzIGhhc2ggKm11c3QqIGNoYW5nZSBpZiBhbnkgcmVzb3VyY2VzIHNlZW4gYnkgdGhlIGJyb3dzZXJcbi8vIGNoYW5nZSwgYW5kIGlkZWFsbHkgKmRvZXNuJ3QqIGNoYW5nZSBmb3IgYW55IHNlcnZlci1vbmx5IGNoYW5nZXNcbi8vIChidXQgdGhlIHNlY29uZCBpcyBhIHBlcmZvcm1hbmNlIGVuaGFuY2VtZW50LCBub3QgYSBoYXJkXG4vLyByZXF1aXJlbWVudCkuXG5cbldlYkFwcEhhc2hpbmcuY2FsY3VsYXRlQ2xpZW50SGFzaCA9XG4gIGZ1bmN0aW9uIChtYW5pZmVzdCwgaW5jbHVkZUZpbHRlciwgcnVudGltZUNvbmZpZ092ZXJyaWRlKSB7XG4gIHZhciBoYXNoID0gY3JlYXRlSGFzaCgnc2hhMScpO1xuXG4gIC8vIE9taXQgdGhlIG9sZCBoYXNoZWQgY2xpZW50IHZhbHVlcyBpbiB0aGUgbmV3IGhhc2guIFRoZXNlIG1heSBiZVxuICAvLyBtb2RpZmllZCBpbiB0aGUgbmV3IGJvaWxlcnBsYXRlLlxuICB2YXIgeyBhdXRvdXBkYXRlVmVyc2lvbiwgYXV0b3VwZGF0ZVZlcnNpb25SZWZyZXNoYWJsZSwgYXV0b3VwZGF0ZVZlcnNpb25Db3Jkb3ZhLCAuLi5ydW50aW1lQ2ZnIH0gPSBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fO1xuXG4gIGlmIChydW50aW1lQ29uZmlnT3ZlcnJpZGUpIHtcbiAgICBydW50aW1lQ2ZnID0gcnVudGltZUNvbmZpZ092ZXJyaWRlO1xuICB9XG5cbiAgaGFzaC51cGRhdGUoSlNPTi5zdHJpbmdpZnkocnVudGltZUNmZywgJ3V0ZjgnKSk7XG5cbiAgbWFuaWZlc3QuZm9yRWFjaChmdW5jdGlvbiAocmVzb3VyY2UpIHtcbiAgICAgIGlmICgoISBpbmNsdWRlRmlsdGVyIHx8IGluY2x1ZGVGaWx0ZXIocmVzb3VyY2UudHlwZSwgcmVzb3VyY2UucmVwbGFjZWFibGUpKSAmJlxuICAgICAgICAgIChyZXNvdXJjZS53aGVyZSA9PT0gJ2NsaWVudCcgfHwgcmVzb3VyY2Uud2hlcmUgPT09ICdpbnRlcm5hbCcpKSB7XG4gICAgICBoYXNoLnVwZGF0ZShyZXNvdXJjZS5wYXRoKTtcbiAgICAgIGhhc2gudXBkYXRlKHJlc291cmNlLmhhc2gpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBoYXNoLmRpZ2VzdCgnaGV4Jyk7XG59O1xuXG5XZWJBcHBIYXNoaW5nLmNhbGN1bGF0ZUNvcmRvdmFDb21wYXRpYmlsaXR5SGFzaCA9XG4gIGZ1bmN0aW9uKHBsYXRmb3JtVmVyc2lvbiwgcGx1Z2luVmVyc2lvbnMpIHtcbiAgY29uc3QgaGFzaCA9IGNyZWF0ZUhhc2goJ3NoYTEnKTtcblxuICBoYXNoLnVwZGF0ZShwbGF0Zm9ybVZlcnNpb24pO1xuXG4gIC8vIFNvcnQgcGx1Z2lucyBmaXJzdCBzbyBpdGVyYXRpb24gb3JkZXIgZG9lc24ndCBhZmZlY3QgdGhlIGhhc2hcbiAgY29uc3QgcGx1Z2lucyA9IE9iamVjdC5rZXlzKHBsdWdpblZlcnNpb25zKS5zb3J0KCk7XG4gIGZvciAobGV0IHBsdWdpbiBvZiBwbHVnaW5zKSB7XG4gICAgY29uc3QgdmVyc2lvbiA9IHBsdWdpblZlcnNpb25zW3BsdWdpbl07XG4gICAgaGFzaC51cGRhdGUocGx1Z2luKTtcbiAgICBoYXNoLnVwZGF0ZSh2ZXJzaW9uKTtcbiAgfVxuXG4gIHJldHVybiBoYXNoLmRpZ2VzdCgnaGV4Jyk7XG59O1xuIl19
