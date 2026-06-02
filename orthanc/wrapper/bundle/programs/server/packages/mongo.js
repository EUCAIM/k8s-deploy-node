Package["core-runtime"].queue("mongo",function () {/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EmitterPromise = Package.meteor.EmitterPromise;
var NpmModuleMongodb = Package['npm-mongo'].NpmModuleMongodb;
var NpmModuleMongodbVersion = Package['npm-mongo'].NpmModuleMongodbVersion;
var AllowDeny = Package['allow-deny'].AllowDeny;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var DiffSequence = Package['diff-sequence'].DiffSequence;
var MongoID = Package['mongo-id'].MongoID;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var Log = Package.logging.Log;
var Decimal = Package['mongo-decimal'].Decimal;
var MaxHeap = Package['binary-heap'].MaxHeap;
var MinHeap = Package['binary-heap'].MinHeap;
var MinMaxHeap = Package['binary-heap'].MinMaxHeap;
var Hook = Package['callback-hook'].Hook;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var MongoInternals, callback, CollectionExtensions, Mongo, ObserveMultiplexer;

var require = meteorInstall({"node_modules":{"meteor":{"mongo":{"mongo_driver.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/mongo_driver.js                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({listenAll:()=>listenAll,forEachTrigger:()=>forEachTrigger},true);let OplogHandle;module.link('./oplog_tailing',{OplogHandle(v){OplogHandle=v}},0);let MongoConnection;module.link('./mongo_connection',{MongoConnection(v){MongoConnection=v}},1);let OplogObserveDriver;module.link('./oplog_observe_driver',{OplogObserveDriver(v){OplogObserveDriver=v}},2);let MongoDB;module.link('./mongo_common',{MongoDB(v){MongoDB=v}},3);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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




MongoInternals = global.MongoInternals = {};
MongoInternals.__packageName = 'mongo';
MongoInternals.NpmModules = {
    mongodb: {
        version: NpmModuleMongodbVersion,
        module: MongoDB
    }
};
// Older version of what is now available via
// MongoInternals.NpmModules.mongodb.module.  It was never documented, but
// people do use it.
// XXX COMPAT WITH 1.0.3.2
MongoInternals.NpmModule = new Proxy(MongoDB, {
    get (target, propertyKey, receiver) {
        if (propertyKey === 'ObjectID') {
            Meteor.deprecate(`Accessing 'MongoInternals.NpmModule.ObjectID' directly is deprecated. ` + `Use 'MongoInternals.NpmModule.ObjectId' instead.`);
        }
        return Reflect.get(target, propertyKey, receiver);
    }
});
MongoInternals.OplogHandle = OplogHandle;
MongoInternals.Connection = MongoConnection;
MongoInternals.OplogObserveDriver = OplogObserveDriver;
// This is used to add or remove EJSON from the beginning of everything nested
// inside an EJSON custom type. It should only be called on pure JSON!
// Ensure that EJSON.clone keeps a Timestamp as a Timestamp (instead of just
// doing a structural clone).
// XXX how ok is this? what if there are multiple copies of MongoDB loaded?
MongoDB.Timestamp.prototype.clone = function() {
    // Timestamps should be immutable.
    return this;
};
// Listen for the invalidation messages that will trigger us to poll the
// database for changes. If this selector specifies specific IDs, specify them
// here, so that updates to different specific IDs don't cause us to poll.
// listenCallback is the same kind of (notification, complete) callback passed
// to InvalidationCrossbar.listen.
const listenAll = function(cursorDescription, listenCallback) {
    return _async_to_generator(function*() {
        const listeners = [];
        yield forEachTrigger(cursorDescription, function(trigger) {
            listeners.push(DDPServer._InvalidationCrossbar.listen(trigger, listenCallback));
        });
        return {
            stop: function() {
                listeners.forEach(function(listener) {
                    listener.stop();
                });
            }
        };
    })();
};
const forEachTrigger = function(cursorDescription, triggerCallback) {
    return _async_to_generator(function*() {
        const key = {
            collection: cursorDescription.collectionName
        };
        const specificIds = LocalCollection._idsMatchedBySelector(cursorDescription.selector);
        if (specificIds) {
            for (const id of specificIds){
                yield triggerCallback(Object.assign({
                    id: id
                }, key));
            }
            yield triggerCallback(Object.assign({
                dropCollection: true,
                id: null
            }, key));
        } else {
            yield triggerCallback(key);
        }
        // Everyone cares about the database being dropped.
        yield triggerCallback({
            dropDatabase: true
        });
    })();
};
// XXX We probably need to find a better way to expose this. Right now
// it's only used by tests, but in fact you need it in normal
// operation to interact with capped collections.
MongoInternals.MongoTimestamp = MongoDB.Timestamp;
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oplog_tailing.ts":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/oplog_tailing.ts                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({OplogHandle:()=>OplogHandle,idForOp:()=>idForOp});module.export({OPLOG_COLLECTION:()=>OPLOG_COLLECTION},true);let isEmpty;module.link('lodash.isempty',{default(v){isEmpty=v}},0);let Meteor;module.link('meteor/meteor',{Meteor(v){Meteor=v}},1);let CursorDescription;module.link('./cursor_description',{CursorDescription(v){CursorDescription=v}},2);let MongoConnection;module.link('./mongo_connection',{MongoConnection(v){MongoConnection=v}},3);let NpmModuleMongodb;module.link("meteor/npm-mongo",{NpmModuleMongodb(v){NpmModuleMongodb=v}},4);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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





const { Long } = NpmModuleMongodb;
const OPLOG_COLLECTION = 'oplog.rs';
let TOO_FAR_BEHIND = +(process.env.METEOR_OPLOG_TOO_FAR_BEHIND || 2000);
const TAIL_TIMEOUT = +(process.env.METEOR_OPLOG_TAIL_TIMEOUT || 30000);
class OplogHandle {
    _nsAllowed(ns) {
        if (!ns) return false;
        if (ns === 'admin.$cmd') return true;
        if (this._includeNSRegex && !this._includeNSRegex.test(ns)) return false;
        if (this._excludeNSRegex && this._excludeNSRegex.test(ns)) return false;
        return true;
    }
    _getOplogSelector(lastProcessedTS) {
        var _this__oplogOptions_excludeCollections, _this__oplogOptions_includeCollections;
        const oplogCriteria = [
            {
                $or: [
                    {
                        op: {
                            $in: [
                                "i",
                                "u",
                                "d"
                            ]
                        }
                    },
                    {
                        op: "c",
                        "o.drop": {
                            $exists: true
                        }
                    },
                    {
                        op: "c",
                        "o.dropDatabase": 1
                    },
                    {
                        op: "c",
                        "o.applyOps": {
                            $exists: true
                        }
                    }
                ]
            }
        ];
        if ((_this__oplogOptions_excludeCollections = this._oplogOptions.excludeCollections) === null || _this__oplogOptions_excludeCollections === void 0 ? void 0 : _this__oplogOptions_excludeCollections.length) {
            const nsRegex = new RegExp('^(?:' + [
                // @ts-ignore
                Meteor._escapeRegExp(this._dbName + '.')
            ].join('|') + ')');
            const excludeNs = {
                $regex: nsRegex,
                $nin: this._oplogOptions.excludeCollections.map((collName)=>`${this._dbName}.${collName}`)
            };
            oplogCriteria.push({
                $or: [
                    {
                        ns: excludeNs
                    },
                    {
                        ns: /^admin\.\$cmd/,
                        'o.applyOps': {
                            $elemMatch: {
                                ns: excludeNs
                            }
                        }
                    }
                ]
            });
        } else if ((_this__oplogOptions_includeCollections = this._oplogOptions.includeCollections) === null || _this__oplogOptions_includeCollections === void 0 ? void 0 : _this__oplogOptions_includeCollections.length) {
            const includeNs = {
                $in: this._oplogOptions.includeCollections.map((collName)=>`${this._dbName}.${collName}`)
            };
            oplogCriteria.push({
                $or: [
                    {
                        ns: includeNs
                    },
                    {
                        ns: /^admin\.\$cmd/,
                        'o.applyOps.ns': includeNs
                    }
                ]
            });
        } else {
            const nsRegex = new RegExp("^(?:" + [
                // @ts-ignore
                Meteor._escapeRegExp(this._dbName + "."),
                // @ts-ignore
                Meteor._escapeRegExp("admin.$cmd")
            ].join("|") + ")");
            oplogCriteria.push({
                ns: nsRegex
            });
        }
        if (lastProcessedTS) {
            oplogCriteria.push({
                ts: {
                    $gt: lastProcessedTS
                }
            });
        }
        return {
            $and: oplogCriteria
        };
    }
    stop() {
        return _async_to_generator(function*() {
            if (this._stopped) return;
            this._stopped = true;
            if (this._tailHandle) {
                yield this._tailHandle.stop();
            }
        }).call(this);
    }
    _onOplogEntry(trigger, callback) {
        return _async_to_generator(function*() {
            if (this._stopped) {
                throw new Error("Called onOplogEntry on stopped handle!");
            }
            yield this._readyPromise;
            const originalCallback = callback;
            /**
     * This depends on AsynchronousQueue tasks being wrapped in `bindEnvironment` too.
     *
     * @todo Check after we simplify the `bindEnvironment` implementation if we can remove the second wrap.
     */ callback = Meteor.bindEnvironment(function(notification) {
                originalCallback(notification);
            }, // @ts-ignore
            function(err) {
                Meteor._debug("Error in oplog callback", err);
            });
            const listenHandle = this._crossbar.listen(trigger, callback);
            return {
                stop: function() {
                    return _async_to_generator(function*() {
                        yield listenHandle.stop();
                    })();
                }
            };
        }).call(this);
    }
    onOplogEntry(trigger, callback) {
        return this._onOplogEntry(trigger, callback);
    }
    onSkippedEntries(callback) {
        if (this._stopped) {
            throw new Error("Called onSkippedEntries on stopped handle!");
        }
        return this._onSkippedEntriesHook.register(callback);
    }
    _waitUntilCaughtUp() {
        return _async_to_generator(function*() {
            if (this._stopped) {
                throw new Error("Called waitUntilCaughtUp on stopped handle!");
            }
            yield this._readyPromise;
            let lastEntry = null;
            while(!this._stopped){
                const oplogSelector = this._getOplogSelector();
                try {
                    lastEntry = yield this._oplogLastEntryConnection.findOneAsync(OPLOG_COLLECTION, oplogSelector, {
                        projection: {
                            ts: 1
                        },
                        sort: {
                            $natural: -1
                        }
                    });
                    break;
                } catch (e) {
                    Meteor._debug("Got exception while reading last entry", e);
                    // @ts-ignore
                    yield Meteor.sleep(100);
                }
            }
            if (this._stopped) return;
            if (!lastEntry) return;
            const ts = lastEntry.ts;
            if (!ts) {
                throw Error("oplog entry without ts: " + JSON.stringify(lastEntry));
            }
            if (this._lastProcessedTS && ts.lessThanOrEqual(this._lastProcessedTS)) {
                return;
            }
            let insertAfter = this._catchingUpResolvers.length;
            while(insertAfter - 1 > 0 && this._catchingUpResolvers[insertAfter - 1].ts.greaterThan(ts)){
                insertAfter--;
            }
            let promiseResolver = null;
            const promiseToAwait = new Promise((r)=>promiseResolver = r);
            clearTimeout(this._resolveTimeout);
            this._resolveTimeout = setTimeout(()=>{
                console.error("Meteor: oplog catching up took too long", {
                    ts
                });
            }, 10000);
            this._catchingUpResolvers.splice(insertAfter, 0, {
                ts,
                resolver: promiseResolver
            });
            yield promiseToAwait;
            clearTimeout(this._resolveTimeout);
        }).call(this);
    }
    waitUntilCaughtUp() {
        return _async_to_generator(function*() {
            return this._waitUntilCaughtUp();
        }).call(this);
    }
    _startTailing() {
        return _async_to_generator(function*() {
            const mongodbUri = require('mongodb-uri');
            if (mongodbUri.parse(this._oplogUrl).database !== 'local') {
                throw new Error("$MONGO_OPLOG_URL must be set to the 'local' database of a Mongo replica set");
            }
            this._oplogTailConnection = new MongoConnection(this._oplogUrl, {
                maxPoolSize: 1,
                minPoolSize: 1
            });
            this._oplogLastEntryConnection = new MongoConnection(this._oplogUrl, {
                maxPoolSize: 1,
                minPoolSize: 1
            });
            try {
                const isMasterDoc = yield this._oplogLastEntryConnection.db.admin().command({
                    ismaster: 1
                });
                if (!(isMasterDoc && isMasterDoc.setName)) {
                    throw new Error("$MONGO_OPLOG_URL must be set to the 'local' database of a Mongo replica set");
                }
                const lastOplogEntry = yield this._oplogLastEntryConnection.findOneAsync(OPLOG_COLLECTION, {}, {
                    sort: {
                        $natural: -1
                    },
                    projection: {
                        ts: 1
                    }
                });
                const oplogSelector = this._getOplogSelector(lastOplogEntry === null || lastOplogEntry === void 0 ? void 0 : lastOplogEntry.ts);
                if (lastOplogEntry) {
                    this._lastProcessedTS = lastOplogEntry.ts;
                }
                const cursorDescription = new CursorDescription(OPLOG_COLLECTION, oplogSelector, {
                    tailable: true
                });
                this._tailHandle = this._oplogTailConnection.tail(cursorDescription, (doc)=>{
                    this._entryQueue.push(doc);
                    this._maybeStartWorker();
                }, TAIL_TIMEOUT);
                this._readyPromiseResolver();
            } catch (error) {
                console.error('Error in _startTailing:', error);
                throw error;
            }
        }).call(this);
    }
    _maybeStartWorker() {
        if (this._workerPromise) return;
        this._workerActive = true;
        // Convert to a proper promise-based queue processor
        this._workerPromise = (()=>_async_to_generator(function*() {
                try {
                    while(!this._stopped && !this._entryQueue.isEmpty()){
                        // Are we too far behind? Just tell our observers that they need to
                        // repoll, and drop our queue.
                        if (this._entryQueue.length > TOO_FAR_BEHIND) {
                            const lastEntry = this._entryQueue.pop();
                            this._entryQueue.clear();
                            this._onSkippedEntriesHook.each((callback)=>{
                                callback();
                                return true;
                            });
                            // Free any waitUntilCaughtUp() calls that were waiting for us to
                            // pass something that we just skipped.
                            this._setLastProcessedTS(lastEntry.ts);
                            continue;
                        }
                        // Process next batch from the queue
                        const doc = this._entryQueue.shift();
                        try {
                            yield handleDoc(this, doc);
                            // Process any waiting fence callbacks
                            if (doc.ts) {
                                this._setLastProcessedTS(doc.ts);
                            }
                        } catch (e) {
                            // Keep processing queue even if one entry fails
                            console.error('Error processing oplog entry:', e);
                        }
                    }
                } finally{
                    this._workerPromise = null;
                    this._workerActive = false;
                }
            }).call(this))();
    }
    _setLastProcessedTS(ts) {
        this._lastProcessedTS = ts;
        while(!isEmpty(this._catchingUpResolvers) && this._catchingUpResolvers[0].ts.lessThanOrEqual(this._lastProcessedTS)){
            const sequencer = this._catchingUpResolvers.shift();
            sequencer.resolver();
        }
    }
    _defineTooFarBehind(value) {
        TOO_FAR_BEHIND = value;
    }
    _resetTooFarBehind() {
        TOO_FAR_BEHIND = +(process.env.METEOR_OPLOG_TOO_FAR_BEHIND || 2000);
    }
    constructor(oplogUrl, dbName){
        var _Meteor_settings_packages_mongo, _Meteor_settings_packages, _Meteor_settings, _Meteor_settings_packages_mongo1, _Meteor_settings_packages1, _Meteor_settings1;
        _define_property(this, "_oplogUrl", void 0);
        _define_property(this, "_dbName", void 0);
        _define_property(this, "_oplogLastEntryConnection", void 0);
        _define_property(this, "_oplogTailConnection", void 0);
        _define_property(this, "_oplogOptions", void 0);
        _define_property(this, "_includeNSRegex", void 0);
        _define_property(this, "_excludeNSRegex", void 0);
        _define_property(this, "_stopped", void 0);
        _define_property(this, "_tailHandle", void 0);
        _define_property(this, "_readyPromiseResolver", void 0);
        _define_property(this, "_readyPromise", void 0);
        _define_property(this, "_crossbar", void 0);
        _define_property(this, "_catchingUpResolvers", void 0);
        _define_property(this, "_lastProcessedTS", void 0);
        _define_property(this, "_onSkippedEntriesHook", void 0);
        _define_property(this, "_startTrailingPromise", void 0);
        _define_property(this, "_resolveTimeout", void 0);
        _define_property(this, "_entryQueue", new Meteor._DoubleEndedQueue());
        _define_property(this, "_workerActive", false);
        _define_property(this, "_workerPromise", null);
        this._oplogUrl = oplogUrl;
        this._dbName = dbName;
        this._resolveTimeout = null;
        this._oplogLastEntryConnection = null;
        this._oplogTailConnection = null;
        this._stopped = false;
        this._tailHandle = null;
        this._readyPromiseResolver = null;
        this._readyPromise = new Promise((r)=>this._readyPromiseResolver = r);
        this._crossbar = new DDPServer._Crossbar({
            factPackage: "mongo-livedata",
            factName: "oplog-watchers"
        });
        const includeCollections = (_Meteor_settings = Meteor.settings) === null || _Meteor_settings === void 0 ? void 0 : (_Meteor_settings_packages = _Meteor_settings.packages) === null || _Meteor_settings_packages === void 0 ? void 0 : (_Meteor_settings_packages_mongo = _Meteor_settings_packages.mongo) === null || _Meteor_settings_packages_mongo === void 0 ? void 0 : _Meteor_settings_packages_mongo.oplogIncludeCollections;
        const excludeCollections = (_Meteor_settings1 = Meteor.settings) === null || _Meteor_settings1 === void 0 ? void 0 : (_Meteor_settings_packages1 = _Meteor_settings1.packages) === null || _Meteor_settings_packages1 === void 0 ? void 0 : (_Meteor_settings_packages_mongo1 = _Meteor_settings_packages1.mongo) === null || _Meteor_settings_packages_mongo1 === void 0 ? void 0 : _Meteor_settings_packages_mongo1.oplogExcludeCollections;
        if ((includeCollections === null || includeCollections === void 0 ? void 0 : includeCollections.length) && (excludeCollections === null || excludeCollections === void 0 ? void 0 : excludeCollections.length)) {
            throw new Error("Can't use both mongo oplog settings oplogIncludeCollections and oplogExcludeCollections at the same time.");
        }
        this._oplogOptions = {
            includeCollections,
            excludeCollections
        };
        if (includeCollections === null || includeCollections === void 0 ? void 0 : includeCollections.length) {
            const incAlt = includeCollections.map((c)=>Meteor._escapeRegExp(c)).join('|');
            this._includeNSRegex = new RegExp(`^${Meteor._escapeRegExp(this._dbName)}\\.(?:${incAlt})$`);
        }
        if (excludeCollections === null || excludeCollections === void 0 ? void 0 : excludeCollections.length) {
            const excAlt = excludeCollections.map((c)=>Meteor._escapeRegExp(c)).join('|');
            this._excludeNSRegex = new RegExp(`^${Meteor._escapeRegExp(this._dbName)}\\.(?:${excAlt})$`);
        }
        this._catchingUpResolvers = [];
        this._lastProcessedTS = null;
        this._onSkippedEntriesHook = new Hook({
            debugPrintExceptions: "onSkippedEntries callback"
        });
        this._startTrailingPromise = this._startTailing();
    }
}
function idForOp(op) {
    if (op.op === 'd' || op.op === 'i') {
        return op.o._id;
    } else if (op.op === 'u') {
        return op.o2._id;
    } else if (op.op === 'c') {
        throw Error("Operator 'c' doesn't supply an object with id: " + JSON.stringify(op));
    } else {
        throw Error("Unknown op: " + JSON.stringify(op));
    }
}
function handleDoc(handle, doc) {
    return _async_to_generator(function*() {
        if (doc.ns === "admin.$cmd") {
            if (doc.o.applyOps) {
                // This was a successful transaction, so we need to apply the
                // operations that were involved.
                let nextTimestamp = doc.ts;
                for (const op of doc.o.applyOps){
                    // See https://github.com/meteor/meteor/issues/10420.
                    if (!op.ts) {
                        op.ts = nextTimestamp;
                        nextTimestamp = nextTimestamp.add(Long.ONE);
                    }
                    // Only forward sub-ops whose ns is allowed
                    // See https://github.com/meteor/meteor/issues/13945
                    if (!handle['_nsAllowed'](op.ns)) {
                        continue;
                    }
                    yield handleDoc(handle, op);
                }
                return;
            }
            throw new Error("Unknown command " + JSON.stringify(doc));
        }
        const trigger = {
            dropCollection: false,
            dropDatabase: false,
            op: doc
        };
        if (typeof doc.ns === "string" && doc.ns.startsWith(handle._dbName + ".")) {
            trigger.collection = doc.ns.slice(handle._dbName.length + 1);
        }
        // Is it a special command and the collection name is hidden
        // somewhere in operator?
        if (trigger.collection === "$cmd") {
            if (doc.o.dropDatabase) {
                delete trigger.collection;
                trigger.dropDatabase = true;
            } else if ("drop" in doc.o) {
                trigger.collection = doc.o.drop;
                trigger.dropCollection = true;
                trigger.id = null;
            } else if ("create" in doc.o && "idIndex" in doc.o) {
            // A collection got implicitly created within a transaction. There's
            // no need to do anything about it.
            } else {
                throw Error("Unknown command " + JSON.stringify(doc));
            }
        } else {
            // All other ops have an id.
            trigger.id = idForOp(doc);
        }
        yield handle._crossbar.fire(trigger);
        yield new Promise((resolve)=>setImmediate(resolve));
    })();
}
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"observe_multiplex.ts":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/observe_multiplex.ts                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({ObserveMultiplexer:()=>ObserveMultiplexer});let isEmpty;module.link("lodash.isempty",{default(v){isEmpty=v}},0);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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
function _object_without_properties(source, excluded) {
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

/**
 * Allows multiple identical ObserveHandles to be driven by a single observe driver.
 *
 * This optimization ensures that multiple identical observations
 * don't result in duplicate database queries.
 */ class ObserveMultiplexer {
    addHandleAndSendInitialAdds(handle) {
        return this._addHandleAndSendInitialAdds(handle);
    }
    _addHandleAndSendInitialAdds(handle) {
        return _async_to_generator(function*() {
            ++this._addHandleTasksScheduledButNotPerformed;
            // @ts-ignore
            Package["facts-base"] && Package["facts-base"].Facts.incrementServerFact("mongo-livedata", "observe-handles", 1);
            yield this._queue.runTask(()=>_async_to_generator(function*() {
                    this._handles[handle._id] = handle;
                    yield this._sendAdds(handle);
                    --this._addHandleTasksScheduledButNotPerformed;
                }).call(this));
            yield this._readyPromise;
        }).call(this);
    }
    removeHandle(id) {
        return _async_to_generator(function*() {
            if (!this._ready()) throw new Error("Can't remove handles until the multiplex is ready");
            delete this._handles[id];
            // @ts-ignore
            Package["facts-base"] && Package["facts-base"].Facts.incrementServerFact("mongo-livedata", "observe-handles", -1);
            if (isEmpty(this._handles) && this._addHandleTasksScheduledButNotPerformed === 0) {
                yield this._stop();
            }
        }).call(this);
    }
    _stop() {
        return _async_to_generator(function*(options = {}) {
            if (!this._ready() && !options.fromQueryError) throw Error("surprising _stop: not ready");
            yield this._onStop();
            // @ts-ignore
            Package["facts-base"] && Package["facts-base"].Facts.incrementServerFact("mongo-livedata", "observe-multiplexers", -1);
            this._handles = null;
        }).apply(this, arguments);
    }
    ready() {
        return _async_to_generator(function*() {
            yield this._queue.queueTask(()=>{
                if (this._ready()) throw Error("can't make ObserveMultiplex ready twice!");
                if (!this._resolver) {
                    throw new Error("Missing resolver");
                }
                this._resolver();
                this._isReady = true;
            });
        }).call(this);
    }
    queryError(err) {
        return _async_to_generator(function*() {
            yield this._queue.runTask(()=>{
                if (this._ready()) throw Error("can't claim query has an error after it worked!");
                this._stop({
                    fromQueryError: true
                });
                throw err;
            });
        }).call(this);
    }
    onFlush(cb) {
        return _async_to_generator(function*() {
            yield this._queue.queueTask(()=>_async_to_generator(function*() {
                    if (!this._ready()) throw Error("only call onFlush on a multiplexer that will be ready");
                    yield cb();
                }).call(this));
        }).call(this);
    }
    callbackNames() {
        return this._ordered ? [
            "addedBefore",
            "changed",
            "movedBefore",
            "removed"
        ] : [
            "added",
            "changed",
            "removed"
        ];
    }
    _ready() {
        return !!this._isReady;
    }
    _applyCallback(callbackName, args) {
        this._queue.queueTask(()=>_async_to_generator(function*() {
                if (!this._handles) return;
                yield this._cache.applyChange[callbackName].apply(null, args);
                if (!this._ready() && callbackName !== "added" && callbackName !== "addedBefore") {
                    throw new Error(`Got ${callbackName} during initial adds`);
                }
                for (const handleId of Object.keys(this._handles)){
                    const handle = this._handles && this._handles[handleId];
                    if (!handle) return;
                    const callback = handle[`_${callbackName}`];
                    if (!callback) continue;
                    const result = callback.apply(null, handle.nonMutatingCallbacks ? args : EJSON.clone(args));
                    if (result && Meteor._isPromise(result)) {
                        result.catch((error)=>{
                            console.error(`Error in observeChanges callback ${callbackName}:`, error);
                        });
                    }
                    handle.initialAddsSent.then(result);
                }
            }).call(this));
    }
    _sendAdds(handle) {
        return _async_to_generator(function*() {
            const add = this._ordered ? handle._addedBefore : handle._added;
            if (!add) return;
            const addPromises = [];
            // note: docs may be an _IdMap or an OrderedDict
            this._cache.docs.forEach((doc, id)=>{
                if (!(handle._id in this._handles)) {
                    throw Error("handle got removed before sending initial adds!");
                }
                const _ref = handle.nonMutatingCallbacks ? doc : EJSON.clone(doc), { _id } = _ref, fields = _object_without_properties(_ref, [
                    "_id"
                ]);
                const promise = new Promise((resolve, reject)=>{
                    try {
                        const r = this._ordered ? add(id, fields, null) : add(id, fields);
                        resolve(r);
                    } catch (error) {
                        reject(error);
                    }
                });
                addPromises.push(promise);
            });
            yield Promise.allSettled(addPromises).then((p)=>{
                p.forEach((result)=>{
                    if (result.status === "rejected") {
                        console.error(`Error in adds for handle: ${result.reason}`);
                    }
                });
            });
            handle.initialAddsSentResolver();
        }).call(this);
    }
    constructor({ ordered, onStop = ()=>{} }){
        _define_property(this, "_ordered", void 0);
        _define_property(this, "_onStop", void 0);
        _define_property(this, "_queue", void 0);
        _define_property(this, "_handles", void 0);
        _define_property(this, "_resolver", void 0);
        _define_property(this, "_readyPromise", void 0);
        _define_property(this, "_isReady", void 0);
        _define_property(this, "_cache", void 0);
        _define_property(this, "_addHandleTasksScheduledButNotPerformed", void 0);
        if (ordered === undefined) throw Error("must specify ordered");
        // @ts-ignore
        Package["facts-base"] && Package["facts-base"].Facts.incrementServerFact("mongo-livedata", "observe-multiplexers", 1);
        this._ordered = ordered;
        this._onStop = onStop;
        this._queue = new Meteor._AsynchronousQueue();
        this._handles = {};
        this._resolver = null;
        this._isReady = false;
        this._readyPromise = new Promise((r)=>this._resolver = r).then(()=>this._isReady = true);
        // @ts-ignore
        this._cache = new LocalCollection._CachingChangeObserver({
            ordered
        });
        this._addHandleTasksScheduledButNotPerformed = 0;
        this.callbackNames().forEach((callbackName)=>{
            this[callbackName] = (...args)=>{
                this._applyCallback(callbackName, args);
            };
        });
    }
}
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"doc_fetcher.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/doc_fetcher.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({DocFetcher:()=>DocFetcher});function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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
class DocFetcher {
    // Fetches document "id" from collectionName, returning it or null if not
    // found.
    //
    // If you make multiple calls to fetch() with the same op reference,
    // DocFetcher may assume that they all return the same document. (It does
    // not check to see if collectionName/id match.)
    //
    // You may assume that callback is never called synchronously (and in fact
    // OplogObserveDriver does so).
    fetch(collectionName, id, op, callback) {
        return _async_to_generator(function*() {
            const self = this;
            check(collectionName, String);
            check(op, Object);
            // If there's already an in-progress fetch for this cache key, yield until
            // it's done and return whatever it returns.
            if (self._callbacksForOp.has(op)) {
                self._callbacksForOp.get(op).push(callback);
                return;
            }
            const callbacks = [
                callback
            ];
            self._callbacksForOp.set(op, callbacks);
            try {
                var doc = (yield self._mongoConnection.findOneAsync(collectionName, {
                    _id: id
                })) || null;
                // Return doc to all relevant callbacks. Note that this array can
                // continue to grow during callback excecution.
                while(callbacks.length > 0){
                    // Clone the document so that the various calls to fetch don't return
                    // objects that are intertwingled with each other. Clone before
                    // popping the future, so that if clone throws, the error gets passed
                    // to the next callback.
                    callbacks.pop()(null, EJSON.clone(doc));
                }
            } catch (e) {
                while(callbacks.length > 0){
                    callbacks.pop()(e);
                }
            } finally{
                // XXX consider keeping the doc around for a period of time before
                // removing from the cache
                self._callbacksForOp.delete(op);
            }
        }).call(this);
    }
    constructor(mongoConnection){
        this._mongoConnection = mongoConnection;
        // Map from op -> [callback]
        this._callbacksForOp = new Map();
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"polling_observe_driver.ts":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/polling_observe_driver.ts                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({PollingObserveDriver:()=>PollingObserveDriver});let throttle;module.link('lodash.throttle',{default(v){throttle=v}},0);let listenAll;module.link('./mongo_driver',{listenAll(v){listenAll=v}},1);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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


const POLLING_THROTTLE_MS = +(process.env.METEOR_POLLING_THROTTLE_MS || '') || 50;
const POLLING_INTERVAL_MS = +(process.env.METEOR_POLLING_INTERVAL_MS || '') || 10 * 1000;
/**
 * @class PollingObserveDriver
 *
 * One of two observe driver implementations.
 *
 * Characteristics:
 * - Caches the results of a query
 * - Reruns the query when necessary
 * - Suitable for cases where oplog tailing is not available or practical
 */ class PollingObserveDriver {
    _init() {
        return _async_to_generator(function*() {
            var _Package_factsbase;
            const options = this._options;
            const listenersHandle = yield listenAll(this._cursorDescription, (notification)=>{
                const fence = DDPServer._getCurrentFence();
                if (fence) {
                    this._pendingWrites.push(fence.beginWrite());
                }
                if (this._pollsScheduledButNotStarted === 0) {
                    this._ensurePollIsScheduled();
                }
            });
            this._stopCallbacks.push(()=>_async_to_generator(function*() {
                    yield listenersHandle.stop();
                })());
            if (options._testOnlyPollCallback) {
                this._testOnlyPollCallback = options._testOnlyPollCallback;
            } else {
                const pollingInterval = this._cursorDescription.options.pollingIntervalMs || this._cursorDescription.options._pollingInterval || POLLING_INTERVAL_MS;
                const intervalHandle = Meteor.setInterval(this._ensurePollIsScheduled.bind(this), pollingInterval);
                this._stopCallbacks.push(()=>{
                    Meteor.clearInterval(intervalHandle);
                });
            }
            yield this._unthrottledEnsurePollIsScheduled();
            (_Package_factsbase = Package['facts-base']) === null || _Package_factsbase === void 0 ? void 0 : _Package_factsbase.Facts.incrementServerFact("mongo-livedata", "observe-drivers-polling", 1);
        }).call(this);
    }
    _unthrottledEnsurePollIsScheduled() {
        return _async_to_generator(function*() {
            if (this._pollsScheduledButNotStarted > 0) return;
            ++this._pollsScheduledButNotStarted;
            yield this._taskQueue.runTask(()=>_async_to_generator(function*() {
                    yield this._pollMongo();
                }).call(this));
        }).call(this);
    }
    _suspendPolling() {
        ++this._pollsScheduledButNotStarted;
        this._taskQueue.runTask(()=>{});
        if (this._pollsScheduledButNotStarted !== 1) {
            throw new Error(`_pollsScheduledButNotStarted is ${this._pollsScheduledButNotStarted}`);
        }
    }
    _resumePolling() {
        return _async_to_generator(function*() {
            if (this._pollsScheduledButNotStarted !== 1) {
                throw new Error(`_pollsScheduledButNotStarted is ${this._pollsScheduledButNotStarted}`);
            }
            yield this._taskQueue.runTask(()=>_async_to_generator(function*() {
                    yield this._pollMongo();
                }).call(this));
        }).call(this);
    }
    _pollMongo() {
        return _async_to_generator(function*() {
            var _this__testOnlyPollCallback, _this;
            --this._pollsScheduledButNotStarted;
            if (this._stopped) return;
            let first = false;
            let newResults;
            let oldResults = this._results;
            if (!oldResults) {
                first = true;
                oldResults = this._ordered ? [] : new LocalCollection._IdMap;
            }
            (_this__testOnlyPollCallback = (_this = this)._testOnlyPollCallback) === null || _this__testOnlyPollCallback === void 0 ? void 0 : _this__testOnlyPollCallback.call(_this);
            const writesForCycle = this._pendingWrites;
            this._pendingWrites = [];
            try {
                newResults = yield this._cursor.getRawObjects(this._ordered);
            } catch (e) {
                if (first && typeof e.code === 'number') {
                    yield this._multiplexer.queryError(new Error(`Exception while polling query ${JSON.stringify(this._cursorDescription)}: ${e.message}`));
                }
                Array.prototype.push.apply(this._pendingWrites, writesForCycle);
                Meteor._debug(`Exception while polling query ${JSON.stringify(this._cursorDescription)}`, e);
                return;
            }
            if (!this._stopped) {
                LocalCollection._diffQueryChanges(this._ordered, oldResults, newResults, this._multiplexer);
            }
            if (first) this._multiplexer.ready();
            this._results = newResults;
            yield this._multiplexer.onFlush(()=>_async_to_generator(function*() {
                    for (const w of writesForCycle){
                        yield w.committed();
                    }
                })());
        }).call(this);
    }
    stop() {
        return _async_to_generator(function*() {
            var _Package_factsbase;
            this._stopped = true;
            for (const callback of this._stopCallbacks){
                yield callback();
            }
            for (const w of this._pendingWrites){
                yield w.committed();
            }
            (_Package_factsbase = Package['facts-base']) === null || _Package_factsbase === void 0 ? void 0 : _Package_factsbase.Facts.incrementServerFact("mongo-livedata", "observe-drivers-polling", -1);
        }).call(this);
    }
    constructor(options){
        _define_property(this, "_options", void 0);
        _define_property(this, "_cursorDescription", void 0);
        _define_property(this, "_mongoHandle", void 0);
        _define_property(this, "_ordered", void 0);
        _define_property(this, "_multiplexer", void 0);
        _define_property(this, "_stopCallbacks", void 0);
        _define_property(this, "_stopped", void 0);
        _define_property(this, "_cursor", void 0);
        _define_property(this, "_results", void 0);
        _define_property(this, "_pollsScheduledButNotStarted", void 0);
        _define_property(this, "_pendingWrites", void 0);
        _define_property(this, "_ensurePollIsScheduled", void 0);
        _define_property(this, "_taskQueue", void 0);
        _define_property(this, "_testOnlyPollCallback", void 0);
        this._options = options;
        this._cursorDescription = options.cursorDescription;
        this._mongoHandle = options.mongoHandle;
        this._ordered = options.ordered;
        this._multiplexer = options.multiplexer;
        this._stopCallbacks = [];
        this._stopped = false;
        this._cursor = this._mongoHandle._createAsynchronousCursor(this._cursorDescription);
        this._results = null;
        this._pollsScheduledButNotStarted = 0;
        this._pendingWrites = [];
        this._ensurePollIsScheduled = throttle(this._unthrottledEnsurePollIsScheduled.bind(this), this._cursorDescription.options.pollingThrottleMs || POLLING_THROTTLE_MS);
        this._taskQueue = new Meteor._AsynchronousQueue();
    }
}
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oplog_observe_driver.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/oplog_observe_driver.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({OplogObserveDriver:()=>OplogObserveDriver},true);let has;module.link('lodash.has',{default(v){has=v}},0);let isEmpty;module.link('lodash.isempty',{default(v){isEmpty=v}},1);let oplogV2V1Converter;module.link("./oplog_v2_converter",{oplogV2V1Converter(v){oplogV2V1Converter=v}},2);let check,Match;module.link('meteor/check',{check(v){check=v},Match(v){Match=v}},3);let CursorDescription;module.link('./cursor_description',{CursorDescription(v){CursorDescription=v}},4);let forEachTrigger,listenAll;module.link('./mongo_driver',{forEachTrigger(v){forEachTrigger=v},listenAll(v){listenAll=v}},5);let Cursor;module.link('./cursor',{Cursor(v){Cursor=v}},6);let LocalCollection;module.link('meteor/minimongo/local_collection',{default(v){LocalCollection=v}},7);let idForOp;module.link('./oplog_tailing',{idForOp(v){idForOp=v}},8);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function _async_iterator(iterable) {
    var method, async, sync, retry = 2;
    for("undefined" != typeof Symbol && (async = Symbol.asyncIterator, sync = Symbol.iterator); retry--;){
        if (async && null != (method = iterable[async])) return method.call(iterable);
        if (sync && null != (method = iterable[sync])) return new AsyncFromSyncIterator(method.call(iterable));
        async = "@@asyncIterator", sync = "@@iterator";
    }
    throw new TypeError("Object is not async iterable");
}
function AsyncFromSyncIterator(s) {
    function AsyncFromSyncIteratorContinuation(r) {
        if (Object(r) !== r) return Promise.reject(new TypeError(r + " is not an object."));
        var done = r.done;
        return Promise.resolve(r.value).then(function(value) {
            return {
                value: value,
                done: done
            };
        });
    }
    return AsyncFromSyncIterator = function(s) {
        this.s = s, this.n = s.next;
    }, AsyncFromSyncIterator.prototype = {
        s: null,
        n: null,
        next: function() {
            return AsyncFromSyncIteratorContinuation(this.n.apply(this.s, arguments));
        },
        return: function(value) {
            var ret = this.s.return;
            return void 0 === ret ? Promise.resolve({
                value: value,
                done: !0
            }) : AsyncFromSyncIteratorContinuation(ret.apply(this.s, arguments));
        },
        throw: function(value) {
            var thr = this.s.return;
            return void 0 === thr ? Promise.reject(value) : AsyncFromSyncIteratorContinuation(thr.apply(this.s, arguments));
        }
    }, new AsyncFromSyncIterator(s);
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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









var PHASE = {
    QUERYING: "QUERYING",
    FETCHING: "FETCHING",
    STEADY: "STEADY"
};
// Exception thrown by _needToPollQuery which unrolls the stack up to the
// enclosing call to finishIfNeedToPollQuery.
var SwitchedToQuery = function() {};
var finishIfNeedToPollQuery = function(f) {
    return function() {
        try {
            f.apply(this, arguments);
        } catch (e) {
            if (!(e instanceof SwitchedToQuery)) throw e;
        }
    };
};
var currentId = 0;
/**
 * @class OplogObserveDriver
 * An alternative to PollingObserveDriver which follows the MongoDB operation log
 * instead of re-polling the query.
 *
 * Characteristics:
 * - Follows the MongoDB operation log
 * - Directly observes database changes
 * - More efficient than polling for most use cases
 * - Requires access to MongoDB oplog
 *
 * Interface:
 * - Construction initiates observeChanges callbacks and ready() invocation to the ObserveMultiplexer
 * - Observation can be terminated via the stop() method
 */ const OplogObserveDriver = function(options) {
    const self = this;
    self._usesOplog = true; // tests look at this
    self._id = currentId;
    currentId++;
    self._cursorDescription = options.cursorDescription;
    self._mongoHandle = options.mongoHandle;
    self._multiplexer = options.multiplexer;
    if (options.ordered) {
        throw Error("OplogObserveDriver only supports unordered observeChanges");
    }
    const sorter = options.sorter;
    // We don't support $near and other geo-queries so it's OK to initialize the
    // comparator only once in the constructor.
    const comparator = sorter && sorter.getComparator();
    if (options.cursorDescription.options.limit) {
        // There are several properties ordered driver implements:
        // - _limit is a positive number
        // - _comparator is a function-comparator by which the query is ordered
        // - _unpublishedBuffer is non-null Min/Max Heap,
        //                      the empty buffer in STEADY phase implies that the
        //                      everything that matches the queries selector fits
        //                      into published set.
        // - _published - Max Heap (also implements IdMap methods)
        const heapOptions = {
            IdMap: LocalCollection._IdMap
        };
        self._limit = self._cursorDescription.options.limit;
        self._comparator = comparator;
        self._sorter = sorter;
        self._unpublishedBuffer = new MinMaxHeap(comparator, heapOptions);
        // We need something that can find Max value in addition to IdMap interface
        self._published = new MaxHeap(comparator, heapOptions);
    } else {
        self._limit = 0;
        self._comparator = null;
        self._sorter = null;
        self._unpublishedBuffer = null;
        // Memory Growth
        self._published = new LocalCollection._IdMap;
    }
    // Indicates if it is safe to insert a new document at the end of the buffer
    // for this query. i.e. it is known that there are no documents matching the
    // selector those are not in published or buffer.
    self._safeAppendToBuffer = false;
    self._stopped = false;
    self._stopHandles = [];
    self._addStopHandles = function(newStopHandles) {
        const expectedPattern = Match.ObjectIncluding({
            stop: Function
        });
        // Single item or array
        check(newStopHandles, Match.OneOf([
            expectedPattern
        ], expectedPattern));
        self._stopHandles.push(newStopHandles);
    };
    Package['facts-base'] && Package['facts-base'].Facts.incrementServerFact("mongo-livedata", "observe-drivers-oplog", 1);
    self._registerPhaseChange(PHASE.QUERYING);
    self._matcher = options.matcher;
    // we are now using projection, not fields in the cursor description even if you pass {fields}
    // in the cursor construction
    const projection = self._cursorDescription.options.fields || self._cursorDescription.options.projection || {};
    self._projectionFn = LocalCollection._compileProjection(projection);
    // Projection function, result of combining important fields for selector and
    // existing fields projection
    self._sharedProjection = self._matcher.combineIntoProjection(projection);
    if (sorter) self._sharedProjection = sorter.combineIntoProjection(self._sharedProjection);
    self._sharedProjectionFn = LocalCollection._compileProjection(self._sharedProjection);
    self._needToFetch = new LocalCollection._IdMap;
    self._currentlyFetching = null;
    self._fetchGeneration = 0;
    self._requeryWhenDoneThisQuery = false;
    self._writesToCommitWhenWeReachSteady = [];
};
Object.assign(OplogObserveDriver.prototype, {
    _init: function() {
        return _async_to_generator(function*() {
            const self = this;
            // If the oplog handle tells us that it skipped some entries (because it got
            // behind, say), re-poll.
            self._addStopHandles(self._mongoHandle._oplogHandle.onSkippedEntries(finishIfNeedToPollQuery(function() {
                return self._needToPollQuery();
            })));
            yield forEachTrigger(self._cursorDescription, function(trigger) {
                return _async_to_generator(function*() {
                    self._addStopHandles((yield self._mongoHandle._oplogHandle.onOplogEntry(trigger, function(notification) {
                        finishIfNeedToPollQuery(function() {
                            const op = notification.op;
                            if (notification.dropCollection || notification.dropDatabase) {
                                // Note: this call is not allowed to block on anything (especially
                                // on waiting for oplog entries to catch up) because that will block
                                // onOplogEntry!
                                return self._needToPollQuery();
                            } else {
                                // All other operators should be handled depending on phase
                                if (self._phase === PHASE.QUERYING) {
                                    return self._handleOplogEntryQuerying(op);
                                } else {
                                    return self._handleOplogEntrySteadyOrFetching(op);
                                }
                            }
                        })();
                    })));
                })();
            });
            // XXX ordering w.r.t. everything else?
            self._addStopHandles((yield listenAll(self._cursorDescription, function() {
                // If we're not in a pre-fire write fence, we don't have to do anything.
                const fence = DDPServer._getCurrentFence();
                if (!fence || fence.fired) return;
                if (fence._oplogObserveDrivers) {
                    fence._oplogObserveDrivers[self._id] = self;
                    return;
                }
                fence._oplogObserveDrivers = {};
                fence._oplogObserveDrivers[self._id] = self;
                fence.onBeforeFire(function() {
                    return _async_to_generator(function*() {
                        const drivers = fence._oplogObserveDrivers;
                        delete fence._oplogObserveDrivers;
                        // This fence cannot fire until we've caught up to "this point" in the
                        // oplog, and all observers made it back to the steady state.
                        yield self._mongoHandle._oplogHandle.waitUntilCaughtUp();
                        for (const driver of Object.values(drivers)){
                            if (driver._stopped) continue;
                            const write = yield fence.beginWrite();
                            if (driver._phase === PHASE.STEADY) {
                                // Make sure that all of the callbacks have made it through the
                                // multiplexer and been delivered to ObserveHandles before committing
                                // writes.
                                yield driver._multiplexer.onFlush(write.committed);
                            } else {
                                driver._writesToCommitWhenWeReachSteady.push(write);
                            }
                        }
                    })();
                });
            })));
            // When Mongo fails over, we need to repoll the query, in case we processed an
            // oplog entry that got rolled back.
            self._addStopHandles(self._mongoHandle._onFailover(finishIfNeedToPollQuery(function() {
                return self._needToPollQuery();
            })));
            // Give _observeChanges a chance to add the new ObserveHandle to our
            // multiplexer, so that the added calls get streamed.
            return self._runInitialQuery();
        }).call(this);
    },
    _addPublished: function(id, doc) {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            var fields = Object.assign({}, doc);
            delete fields._id;
            self._published.set(id, self._sharedProjectionFn(doc));
            self._multiplexer.added(id, self._projectionFn(fields));
            // After adding this document, the published set might be overflowed
            // (exceeding capacity specified by limit). If so, push the maximum
            // element to the buffer, we might want to save it in memory to reduce the
            // amount of Mongo lookups in the future.
            if (self._limit && self._published.size() > self._limit) {
                // XXX in theory the size of published is no more than limit+1
                if (self._published.size() !== self._limit + 1) {
                    throw new Error("After adding to published, " + (self._published.size() - self._limit) + " documents are overflowing the set");
                }
                var overflowingDocId = self._published.maxElementId();
                var overflowingDoc = self._published.get(overflowingDocId);
                if (EJSON.equals(overflowingDocId, id)) {
                    throw new Error("The document just added is overflowing the published set");
                }
                self._published.remove(overflowingDocId);
                self._multiplexer.removed(overflowingDocId);
                self._addBuffered(overflowingDocId, overflowingDoc);
            }
        });
    },
    _removePublished: function(id) {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            self._published.remove(id);
            self._multiplexer.removed(id);
            if (!self._limit || self._published.size() === self._limit) return;
            if (self._published.size() > self._limit) throw Error("self._published got too big");
            // OK, we are publishing less than the limit. Maybe we should look in the
            // buffer to find the next element past what we were publishing before.
            if (!self._unpublishedBuffer.empty()) {
                // There's something in the buffer; move the first thing in it to
                // _published.
                var newDocId = self._unpublishedBuffer.minElementId();
                var newDoc = self._unpublishedBuffer.get(newDocId);
                self._removeBuffered(newDocId);
                self._addPublished(newDocId, newDoc);
                return;
            }
            // There's nothing in the buffer.  This could mean one of a few things.
            // (a) We could be in the middle of re-running the query (specifically, we
            // could be in _publishNewResults). In that case, _unpublishedBuffer is
            // empty because we clear it at the beginning of _publishNewResults. In
            // this case, our caller already knows the entire answer to the query and
            // we don't need to do anything fancy here.  Just return.
            if (self._phase === PHASE.QUERYING) return;
            // (b) We're pretty confident that the union of _published and
            // _unpublishedBuffer contain all documents that match selector. Because
            // _unpublishedBuffer is empty, that means we're confident that _published
            // contains all documents that match selector. So we have nothing to do.
            if (self._safeAppendToBuffer) return;
            // (c) Maybe there are other documents out there that should be in our
            // buffer. But in that case, when we emptied _unpublishedBuffer in
            // _removeBuffered, we should have called _needToPollQuery, which will
            // either put something in _unpublishedBuffer or set _safeAppendToBuffer
            // (or both), and it will put us in QUERYING for that whole time. So in
            // fact, we shouldn't be able to get here.
            throw new Error("Buffer inexplicably empty");
        });
    },
    _changePublished: function(id, oldDoc, newDoc) {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            self._published.set(id, self._sharedProjectionFn(newDoc));
            var projectedNew = self._projectionFn(newDoc);
            var projectedOld = self._projectionFn(oldDoc);
            var changed = DiffSequence.makeChangedFields(projectedNew, projectedOld);
            if (!isEmpty(changed)) self._multiplexer.changed(id, changed);
        });
    },
    _addBuffered: function(id, doc) {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            self._unpublishedBuffer.set(id, self._sharedProjectionFn(doc));
            // If something is overflowing the buffer, we just remove it from cache
            if (self._unpublishedBuffer.size() > self._limit) {
                var maxBufferedId = self._unpublishedBuffer.maxElementId();
                self._unpublishedBuffer.remove(maxBufferedId);
                // Since something matching is removed from cache (both published set and
                // buffer), set flag to false
                self._safeAppendToBuffer = false;
            }
        });
    },
    // Is called either to remove the doc completely from matching set or to move
    // it to the published set later.
    _removeBuffered: function(id) {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            self._unpublishedBuffer.remove(id);
            // To keep the contract "buffer is never empty in STEADY phase unless the
            // everything matching fits into published" true, we poll everything as
            // soon as we see the buffer becoming empty.
            if (!self._unpublishedBuffer.size() && !self._safeAppendToBuffer) self._needToPollQuery();
        });
    },
    // Called when a document has joined the "Matching" results set.
    // Takes responsibility of keeping _unpublishedBuffer in sync with _published
    // and the effect of limit enforced.
    _addMatching: function(doc) {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            var id = doc._id;
            if (self._published.has(id)) throw Error("tried to add something already published " + id);
            if (self._limit && self._unpublishedBuffer.has(id)) throw Error("tried to add something already existed in buffer " + id);
            var limit = self._limit;
            var comparator = self._comparator;
            var maxPublished = limit && self._published.size() > 0 ? self._published.get(self._published.maxElementId()) : null;
            var maxBuffered = limit && self._unpublishedBuffer.size() > 0 ? self._unpublishedBuffer.get(self._unpublishedBuffer.maxElementId()) : null;
            // The query is unlimited or didn't publish enough documents yet or the
            // new document would fit into published set pushing the maximum element
            // out, then we need to publish the doc.
            var toPublish = !limit || self._published.size() < limit || comparator(doc, maxPublished) < 0;
            // Otherwise we might need to buffer it (only in case of limited query).
            // Buffering is allowed if the buffer is not filled up yet and all
            // matching docs are either in the published set or in the buffer.
            var canAppendToBuffer = !toPublish && self._safeAppendToBuffer && self._unpublishedBuffer.size() < limit;
            // Or if it is small enough to be safely inserted to the middle or the
            // beginning of the buffer.
            var canInsertIntoBuffer = !toPublish && maxBuffered && comparator(doc, maxBuffered) <= 0;
            var toBuffer = canAppendToBuffer || canInsertIntoBuffer;
            if (toPublish) {
                self._addPublished(id, doc);
            } else if (toBuffer) {
                self._addBuffered(id, doc);
            } else {
                // dropping it and not saving to the cache
                self._safeAppendToBuffer = false;
            }
        });
    },
    // Called when a document leaves the "Matching" results set.
    // Takes responsibility of keeping _unpublishedBuffer in sync with _published
    // and the effect of limit enforced.
    _removeMatching: function(id) {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            if (!self._published.has(id) && !self._limit) throw Error("tried to remove something matching but not cached " + id);
            if (self._published.has(id)) {
                self._removePublished(id);
            } else if (self._unpublishedBuffer.has(id)) {
                self._removeBuffered(id);
            }
        });
    },
    _handleDoc: function(id, newDoc) {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            var matchesNow = newDoc && self._matcher.documentMatches(newDoc).result;
            var publishedBefore = self._published.has(id);
            var bufferedBefore = self._limit && self._unpublishedBuffer.has(id);
            var cachedBefore = publishedBefore || bufferedBefore;
            if (matchesNow && !cachedBefore) {
                self._addMatching(newDoc);
            } else if (cachedBefore && !matchesNow) {
                self._removeMatching(id);
            } else if (cachedBefore && matchesNow) {
                var oldDoc = self._published.get(id);
                var comparator = self._comparator;
                var minBuffered = self._limit && self._unpublishedBuffer.size() && self._unpublishedBuffer.get(self._unpublishedBuffer.minElementId());
                var maxBuffered;
                if (publishedBefore) {
                    // Unlimited case where the document stays in published once it
                    // matches or the case when we don't have enough matching docs to
                    // publish or the changed but matching doc will stay in published
                    // anyways.
                    //
                    // XXX: We rely on the emptiness of buffer. Be sure to maintain the
                    // fact that buffer can't be empty if there are matching documents not
                    // published. Notably, we don't want to schedule repoll and continue
                    // relying on this property.
                    var staysInPublished = !self._limit || self._unpublishedBuffer.size() === 0 || comparator(newDoc, minBuffered) <= 0;
                    if (staysInPublished) {
                        self._changePublished(id, oldDoc, newDoc);
                    } else {
                        // after the change doc doesn't stay in the published, remove it
                        self._removePublished(id);
                        // but it can move into buffered now, check it
                        maxBuffered = self._unpublishedBuffer.get(self._unpublishedBuffer.maxElementId());
                        var toBuffer = self._safeAppendToBuffer || maxBuffered && comparator(newDoc, maxBuffered) <= 0;
                        if (toBuffer) {
                            self._addBuffered(id, newDoc);
                        } else {
                            // Throw away from both published set and buffer
                            self._safeAppendToBuffer = false;
                        }
                    }
                } else if (bufferedBefore) {
                    oldDoc = self._unpublishedBuffer.get(id);
                    // remove the old version manually instead of using _removeBuffered so
                    // we don't trigger the querying immediately.  if we end this block
                    // with the buffer empty, we will need to trigger the query poll
                    // manually too.
                    self._unpublishedBuffer.remove(id);
                    var maxPublished = self._published.get(self._published.maxElementId());
                    maxBuffered = self._unpublishedBuffer.size() && self._unpublishedBuffer.get(self._unpublishedBuffer.maxElementId());
                    // the buffered doc was updated, it could move to published
                    var toPublish = comparator(newDoc, maxPublished) < 0;
                    // or stays in buffer even after the change
                    var staysInBuffer = !toPublish && self._safeAppendToBuffer || !toPublish && maxBuffered && comparator(newDoc, maxBuffered) <= 0;
                    if (toPublish) {
                        self._addPublished(id, newDoc);
                    } else if (staysInBuffer) {
                        // stays in buffer but changes
                        self._unpublishedBuffer.set(id, newDoc);
                    } else {
                        // Throw away from both published set and buffer
                        self._safeAppendToBuffer = false;
                        // Normally this check would have been done in _removeBuffered but
                        // we didn't use it, so we need to do it ourself now.
                        if (!self._unpublishedBuffer.size()) {
                            self._needToPollQuery();
                        }
                    }
                } else {
                    throw new Error("cachedBefore implies either of publishedBefore or bufferedBefore is true.");
                }
            }
        });
    },
    _fetchModifiedDocuments: function() {
        var self = this;
        self._registerPhaseChange(PHASE.FETCHING);
        // Defer, because nothing called from the oplog entry handler may yield,
        // but fetch() yields.
        Meteor.defer(finishIfNeedToPollQuery(function() {
            return _async_to_generator(function*() {
                while(!self._stopped && !self._needToFetch.empty()){
                    if (self._phase === PHASE.QUERYING) {
                        break;
                    }
                    // Being in steady phase here would be surprising.
                    if (self._phase !== PHASE.FETCHING) throw new Error("phase in fetchModifiedDocuments: " + self._phase);
                    self._currentlyFetching = self._needToFetch;
                    var thisGeneration = ++self._fetchGeneration;
                    self._needToFetch = new LocalCollection._IdMap;
                    // Create an array of promises for all the fetch operations
                    const fetchPromises = [];
                    self._currentlyFetching.forEach(function(op, id) {
                        const fetchPromise = new Promise((resolve, reject)=>{
                            self._mongoHandle._docFetcher.fetch(self._cursorDescription.collectionName, id, op, finishIfNeedToPollQuery(function(err, doc) {
                                if (err) {
                                    Meteor._debug('Got exception while fetching documents', err);
                                    // If we get an error from the fetcher (eg, trouble
                                    // connecting to Mongo), let's just abandon the fetch phase
                                    // altogether and fall back to polling. It's not like we're
                                    // getting live updates anyway.
                                    if (self._phase !== PHASE.QUERYING) {
                                        self._needToPollQuery();
                                    }
                                    resolve();
                                    return;
                                }
                                if (!self._stopped && self._phase === PHASE.FETCHING && self._fetchGeneration === thisGeneration) {
                                    // We re-check the generation in case we've had an explicit
                                    // _pollQuery call (eg, in another fiber) which should
                                    // effectively cancel this round of fetches.  (_pollQuery
                                    // increments the generation.)
                                    try {
                                        self._handleDoc(id, doc);
                                        resolve();
                                    } catch (err) {
                                        reject(err);
                                    }
                                } else {
                                    resolve();
                                }
                            }));
                        });
                        fetchPromises.push(fetchPromise);
                    });
                    // Wait for all fetch operations to complete
                    try {
                        const results = yield Promise.allSettled(fetchPromises);
                        const errors = results.filter((result)=>result.status === 'rejected').map((result)=>result.reason);
                        if (errors.length > 0) {
                            Meteor._debug('Some fetch queries failed:', errors);
                        }
                    } catch (err) {
                        Meteor._debug('Got an exception in a fetch query', err);
                    }
                    // Exit now if we've had a _pollQuery call (here or in another fiber).
                    if (self._phase === PHASE.QUERYING) return;
                    self._currentlyFetching = null;
                }
                // We're done fetching, so we can be steady, unless we've had a
                // _pollQuery call (here or in another fiber).
                if (self._phase !== PHASE.QUERYING) yield self._beSteady();
            })();
        }));
    },
    _beSteady: function() {
        return _async_to_generator(function*() {
            var self = this;
            self._registerPhaseChange(PHASE.STEADY);
            var writes = self._writesToCommitWhenWeReachSteady || [];
            self._writesToCommitWhenWeReachSteady = [];
            yield self._multiplexer.onFlush(function() {
                return _async_to_generator(function*() {
                    try {
                        for (const w of writes){
                            yield w.committed();
                        }
                    } catch (e) {
                        console.error("_beSteady error", {
                            writes
                        }, e);
                    }
                })();
            });
        }).call(this);
    },
    _handleOplogEntryQuerying: function(op) {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            self._needToFetch.set(idForOp(op), op);
        });
    },
    _handleOplogEntrySteadyOrFetching: function(op) {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            var id = idForOp(op);
            // If we're already fetching this one, or about to, we can't optimize;
            // make sure that we fetch it again if necessary.
            if (self._phase === PHASE.FETCHING && (self._currentlyFetching && self._currentlyFetching.has(id) || self._needToFetch.has(id))) {
                self._needToFetch.set(id, op);
                return;
            }
            if (op.op === 'd') {
                if (self._published.has(id) || self._limit && self._unpublishedBuffer.has(id)) self._removeMatching(id);
            } else if (op.op === 'i') {
                if (self._published.has(id)) throw new Error("insert found for already-existing ID in published");
                if (self._unpublishedBuffer && self._unpublishedBuffer.has(id)) throw new Error("insert found for already-existing ID in buffer");
                // XXX what if selector yields?  for now it can't but later it could
                // have $where
                if (self._matcher.documentMatches(op.o).result) self._addMatching(op.o);
            } else if (op.op === 'u') {
                // we are mapping the new oplog format on mongo 5
                // to what we know better, $set
                op.o = oplogV2V1Converter(op.o);
                // Is this a modifier ($set/$unset, which may require us to poll the
                // database to figure out if the whole document matches the selector) or
                // a replacement (in which case we can just directly re-evaluate the
                // selector)?
                // oplog format has changed on mongodb 5, we have to support both now
                // diff is the format in Mongo 5+ (oplog v2)
                var isReplace = !has(op.o, '$set') && !has(op.o, 'diff') && !has(op.o, '$unset');
                // If this modifier modifies something inside an EJSON custom type (ie,
                // anything with EJSON$), then we can't try to use
                // LocalCollection._modify, since that just mutates the EJSON encoding,
                // not the actual object.
                var canDirectlyModifyDoc = !isReplace && modifierCanBeDirectlyApplied(op.o);
                var publishedBefore = self._published.has(id);
                var bufferedBefore = self._limit && self._unpublishedBuffer.has(id);
                if (isReplace) {
                    self._handleDoc(id, Object.assign({
                        _id: id
                    }, op.o));
                } else if ((publishedBefore || bufferedBefore) && canDirectlyModifyDoc) {
                    // Oh great, we actually know what the document is, so we can apply
                    // this directly.
                    var newDoc = self._published.has(id) ? self._published.get(id) : self._unpublishedBuffer.get(id);
                    newDoc = EJSON.clone(newDoc);
                    newDoc._id = id;
                    try {
                        LocalCollection._modify(newDoc, op.o);
                    } catch (e) {
                        if (e.name !== "MinimongoError") throw e;
                        // We didn't understand the modifier.  Re-fetch.
                        self._needToFetch.set(id, op);
                        if (self._phase === PHASE.STEADY) {
                            self._fetchModifiedDocuments();
                        }
                        return;
                    }
                    self._handleDoc(id, self._sharedProjectionFn(newDoc));
                } else if (!canDirectlyModifyDoc || self._matcher.canBecomeTrueByModifier(op.o) || self._sorter && self._sorter.affectedByModifier(op.o)) {
                    self._needToFetch.set(id, op);
                    if (self._phase === PHASE.STEADY) self._fetchModifiedDocuments();
                }
            } else {
                throw Error("XXX SURPRISING OPERATION: " + op);
            }
        });
    },
    _runInitialQueryAsync () {
        return _async_to_generator(function*() {
            var self = this;
            if (self._stopped) throw new Error("oplog stopped surprisingly early");
            yield self._runQuery({
                initial: true
            }); // yields
            if (self._stopped) return; // can happen on queryError
            // Allow observeChanges calls to return. (After this, it's possible for
            // stop() to be called.)
            yield self._multiplexer.ready();
            yield self._doneQuerying(); // yields
        }).call(this);
    },
    // Yields!
    _runInitialQuery: function() {
        return this._runInitialQueryAsync();
    },
    // In various circumstances, we may just want to stop processing the oplog and
    // re-run the initial query, just as if we were a PollingObserveDriver.
    //
    // This function may not block, because it is called from an oplog entry
    // handler.
    //
    // XXX We should call this when we detect that we've been in FETCHING for "too
    // long".
    //
    // XXX We should call this when we detect Mongo failover (since that might
    // mean that some of the oplog entries we have processed have been rolled
    // back). The Node Mongo driver is in the middle of a bunch of huge
    // refactorings, including the way that it notifies you when primary
    // changes. Will put off implementing this until driver 1.4 is out.
    _pollQuery: function() {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            if (self._stopped) return;
            // Yay, we get to forget about all the things we thought we had to fetch.
            self._needToFetch = new LocalCollection._IdMap;
            self._currentlyFetching = null;
            ++self._fetchGeneration; // ignore any in-flight fetches
            self._registerPhaseChange(PHASE.QUERYING);
            // Defer so that we don't yield.  We don't need finishIfNeedToPollQuery
            // here because SwitchedToQuery is not thrown in QUERYING mode.
            Meteor.defer(function() {
                return _async_to_generator(function*() {
                    yield self._runQuery();
                    yield self._doneQuerying();
                })();
            });
        });
    },
    // Yields!
    _runQueryAsync (options) {
        return _async_to_generator(function*() {
            var self = this;
            options = options || {};
            var newResults, newBuffer;
            // This while loop is just to retry failures.
            while(true){
                // If we've been stopped, we don't have to run anything any more.
                if (self._stopped) return;
                newResults = new LocalCollection._IdMap;
                newBuffer = new LocalCollection._IdMap;
                // Query 2x documents as the half excluded from the original query will go
                // into unpublished buffer to reduce additional Mongo lookups in cases
                // when documents are removed from the published set and need a
                // replacement.
                // XXX needs more thought on non-zero skip
                // XXX 2 is a "magic number" meaning there is an extra chunk of docs for
                // buffer if such is needed.
                var cursor = self._cursorForQuery({
                    limit: self._limit * 2
                });
                try {
                    yield cursor.forEach(function(doc, i) {
                        if (!self._limit || i < self._limit) {
                            newResults.set(doc._id, doc);
                        } else {
                            newBuffer.set(doc._id, doc);
                        }
                    });
                    break;
                } catch (e) {
                    if (options.initial && typeof e.code === 'number') {
                        // This is an error document sent to us by mongod, not a connection
                        // error generated by the client. And we've never seen this query work
                        // successfully. Probably it's a bad selector or something, so we
                        // should NOT retry. Instead, we should halt the observe (which ends
                        // up calling `stop` on us).
                        yield self._multiplexer.queryError(e);
                        return;
                    }
                    // During failover (eg) if we get an exception we should log and retry
                    // instead of crashing.
                    Meteor._debug("Got exception while polling query", e);
                    yield Meteor._sleepForMs(100);
                }
            }
            if (self._stopped) return;
            self._publishNewResults(newResults, newBuffer);
        }).call(this);
    },
    // Yields!
    _runQuery: function(options) {
        return this._runQueryAsync(options);
    },
    // Transitions to QUERYING and runs another query, or (if already in QUERYING)
    // ensures that we will query again later.
    //
    // This function may not block, because it is called from an oplog entry
    // handler. However, if we were not already in the QUERYING phase, it throws
    // an exception that is caught by the closest surrounding
    // finishIfNeedToPollQuery call; this ensures that we don't continue running
    // close that was designed for another phase inside PHASE.QUERYING.
    //
    // (It's also necessary whenever logic in this file yields to check that other
    // phases haven't put us into QUERYING mode, though; eg,
    // _fetchModifiedDocuments does this.)
    _needToPollQuery: function() {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            if (self._stopped) return;
            // If we're not already in the middle of a query, we can query now
            // (possibly pausing FETCHING).
            if (self._phase !== PHASE.QUERYING) {
                self._pollQuery();
                throw new SwitchedToQuery;
            }
            // We're currently in QUERYING. Set a flag to ensure that we run another
            // query when we're done.
            self._requeryWhenDoneThisQuery = true;
        });
    },
    // Yields!
    _doneQuerying: function() {
        return _async_to_generator(function*() {
            var self = this;
            if (self._stopped) return;
            yield self._mongoHandle._oplogHandle.waitUntilCaughtUp();
            if (self._stopped) return;
            if (self._phase !== PHASE.QUERYING) throw Error("Phase unexpectedly " + self._phase);
            if (self._requeryWhenDoneThisQuery) {
                self._requeryWhenDoneThisQuery = false;
                self._pollQuery();
            } else if (self._needToFetch.empty()) {
                yield self._beSteady();
            } else {
                self._fetchModifiedDocuments();
            }
        }).call(this);
    },
    _cursorForQuery: function(optionsOverwrite) {
        var self = this;
        return Meteor._noYieldsAllowed(function() {
            // The query we run is almost the same as the cursor we are observing,
            // with a few changes. We need to read all the fields that are relevant to
            // the selector, not just the fields we are going to publish (that's the
            // "shared" projection). And we don't want to apply any transform in the
            // cursor, because observeChanges shouldn't use the transform.
            var options = Object.assign({}, self._cursorDescription.options);
            // Allow the caller to modify the options. Useful to specify different
            // skip and limit values.
            Object.assign(options, optionsOverwrite);
            options.fields = self._sharedProjection;
            delete options.transform;
            // We are NOT deep cloning fields or selector here, which should be OK.
            var description = new CursorDescription(self._cursorDescription.collectionName, self._cursorDescription.selector, options);
            return new Cursor(self._mongoHandle, description);
        });
    },
    // Replace self._published with newResults (both are IdMaps), invoking observe
    // callbacks on the multiplexer.
    // Replace self._unpublishedBuffer with newBuffer.
    //
    // XXX This is very similar to LocalCollection._diffQueryUnorderedChanges. We
    // should really: (a) Unify IdMap and OrderedDict into Unordered/OrderedDict
    // (b) Rewrite diff.js to use these classes instead of arrays and objects.
    _publishNewResults: function(newResults, newBuffer) {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            // If the query is limited and there is a buffer, shut down so it doesn't
            // stay in a way.
            if (self._limit) {
                self._unpublishedBuffer.clear();
            }
            // First remove anything that's gone. Be careful not to modify
            // self._published while iterating over it.
            var idsToRemove = [];
            self._published.forEach(function(doc, id) {
                if (!newResults.has(id)) idsToRemove.push(id);
            });
            idsToRemove.forEach(function(id) {
                self._removePublished(id);
            });
            // Now do adds and changes.
            // If self has a buffer and limit, the new fetched result will be
            // limited correctly as the query has sort specifier.
            newResults.forEach(function(doc, id) {
                self._handleDoc(id, doc);
            });
            // Sanity-check that everything we tried to put into _published ended up
            // there.
            // XXX if this is slow, remove it later
            if (self._published.size() !== newResults.size()) {
                Meteor._debug('The Mongo server and the Meteor query disagree on how ' + 'many documents match your query. Cursor description: ', self._cursorDescription);
            }
            self._published.forEach(function(doc, id) {
                if (!newResults.has(id)) throw Error("_published has a doc that newResults doesn't; " + id);
            });
            // Finally, replace the buffer
            newBuffer.forEach(function(doc, id) {
                self._addBuffered(id, doc);
            });
            self._safeAppendToBuffer = newBuffer.size() < self._limit;
        });
    },
    // This stop function is invoked from the onStop of the ObserveMultiplexer, so
    // it shouldn't actually be possible to call it until the multiplexer is
    // ready.
    //
    // It's important to check self._stopped after every call in this file that
    // can yield!
    _stop: function() {
        return _async_to_generator(function*() {
            var self = this;
            if (self._stopped) return;
            self._stopped = true;
            // Note: we *don't* use multiplexer.onFlush here because this stop
            // callback is actually invoked by the multiplexer itself when it has
            // determined that there are no handles left. So nothing is actually going
            // to get flushed (and it's probably not valid to call methods on the
            // dying multiplexer).
            for (const w of self._writesToCommitWhenWeReachSteady){
                yield w.committed();
            }
            self._writesToCommitWhenWeReachSteady = null;
            // Proactively drop references to potentially big things.
            self._published = null;
            self._unpublishedBuffer = null;
            self._needToFetch = null;
            self._currentlyFetching = null;
            self._oplogEntryHandle = null;
            self._listenersHandle = null;
            Package['facts-base'] && Package['facts-base'].Facts.incrementServerFact("mongo-livedata", "observe-drivers-oplog", -1);
            {
                var _iteratorAbruptCompletion = false, _didIteratorError = false, _iteratorError;
                try {
                    for(var _iterator = _async_iterator(self._stopHandles), _step; _iteratorAbruptCompletion = !(_step = yield _iterator.next()).done; _iteratorAbruptCompletion = false){
                        let _value = _step.value;
                        const handle = _value;
                        yield handle.stop();
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally{
                    try {
                        if (_iteratorAbruptCompletion && _iterator.return != null) {
                            yield _iterator.return();
                        }
                    } finally{
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
        }).call(this);
    },
    stop: function() {
        return _async_to_generator(function*() {
            const self = this;
            return yield self._stop();
        }).call(this);
    },
    _registerPhaseChange: function(phase) {
        var self = this;
        Meteor._noYieldsAllowed(function() {
            var now = new Date;
            if (self._phase) {
                var timeDiff = now - self._phaseStartTime;
                Package['facts-base'] && Package['facts-base'].Facts.incrementServerFact("mongo-livedata", "time-spent-in-" + self._phase + "-phase", timeDiff);
            }
            self._phase = phase;
            self._phaseStartTime = now;
        });
    }
});
// Does our oplog tailing code support this cursor? For now, we are being very
// conservative and allowing only simple queries with simple options.
// (This is a "static method".)
OplogObserveDriver.cursorSupported = function(cursorDescription, matcher) {
    // First, check the options.
    var options = cursorDescription.options;
    // Did the user say no explicitly?
    // underscored version of the option is COMPAT with 1.2
    if (options.disableOplog || options._disableOplog) return false;
    // skip is not supported: to support it we would need to keep track of all
    // "skipped" documents or at least their ids.
    // limit w/o a sort specifier is not supported: current implementation needs a
    // deterministic way to order documents.
    if (options.skip || options.limit && !options.sort) return false;
    // If a fields projection option is given check if it is supported by
    // minimongo (some operators are not supported).
    const fields = options.fields || options.projection;
    if (fields) {
        try {
            LocalCollection._checkSupportedProjection(fields);
        } catch (e) {
            if (e.name === "MinimongoError") {
                return false;
            } else {
                throw e;
            }
        }
    }
    // We don't allow the following selectors:
    //   - $where (not confident that we provide the same JS environment
    //             as Mongo, and can yield!)
    //   - $near (has "interesting" properties in MongoDB, like the possibility
    //            of returning an ID multiple times, though even polling maybe
    //            have a bug there)
    //           XXX: once we support it, we would need to think more on how we
    //           initialize the comparators when we create the driver.
    return !matcher.hasWhere() && !matcher.hasGeoQuery();
};
var modifierCanBeDirectlyApplied = function(modifier) {
    return Object.entries(modifier).every(function([operation, fields]) {
        return Object.entries(fields).every(function([field, value]) {
            return !/EJSON\$/.test(field);
        });
    });
};
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oplog_v2_converter.ts":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/oplog_v2_converter.ts                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({oplogV2V1Converter:()=>oplogV2V1Converter});let EJSON;module.link('meteor/ejson',{EJSON(v){EJSON=v}},0);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();/**
 * Converter module for the new MongoDB Oplog format (>=5.0) to the one that Meteor
 * handles well, i.e., `$set` and `$unset`. The new format is completely new,
 * and looks as follows:
 *
 * ```js
 * { $v: 2, diff: Diff }
 * ```
 *
 * where `Diff` is a recursive structure:
 * ```js
 * {
 *   // Nested updates (sometimes also represented with an s-field).
 *   // Example: `{ $set: { 'foo.bar': 1 } }`.
 *   i: { <key>: <value>, ... },
 *
 *   // Top-level updates.
 *   // Example: `{ $set: { foo: { bar: 1 } } }`.
 *   u: { <key>: <value>, ... },
 *
 *   // Unsets.
 *   // Example: `{ $unset: { foo: '' } }`.
 *   d: { <key>: false, ... },
 *
 *   // Array operations.
 *   // Example: `{ $push: { foo: 'bar' } }`.
 *   s<key>: { a: true, u<index>: <value>, ... },
 *   ...
 *
 *   // Nested operations (sometimes also represented in the `i` field).
 *   // Example: `{ $set: { 'foo.bar': 1 } }`.
 *   s<key>: Diff,
 *   ...
 * }
 * ```
 *
 * (all fields are optional)
 */ 
const arrayOperatorKeyRegex = /^(a|[su]\d+)$/;
/**
 * Checks if a field is an array operator key of form 'a' or 's1' or 'u1' etc
 */ function isArrayOperatorKey(field) {
    return arrayOperatorKeyRegex.test(field);
}
/**
 * Type guard to check if an operator is a valid array operator.
 * Array operators have 'a: true' and keys that match the arrayOperatorKeyRegex
 */ function isArrayOperator(operator) {
    return operator !== null && typeof operator === 'object' && 'a' in operator && operator.a === true && Object.keys(operator).every(isArrayOperatorKey);
}
/**
 * Joins two parts of a field path with a dot.
 * Returns the key itself if prefix is empty.
 */ function join(prefix, key) {
    return prefix ? `${prefix}.${key}` : key;
}
/**
 * Recursively flattens an object into a target object with dot notation paths.
 * Handles special cases:
 * - Arrays are assigned directly
 * - Custom EJSON types are preserved
 * - Mongo.ObjectIDs are preserved
 * - Plain objects are recursively flattened
 * - Empty objects are assigned directly
 */ function flattenObjectInto(target, source, prefix) {
    if (Array.isArray(source) || typeof source !== 'object' || source === null || source instanceof Mongo.ObjectID || EJSON._isCustomType(source)) {
        target[prefix] = source;
        return;
    }
    const entries = Object.entries(source);
    if (entries.length) {
        entries.forEach(([key, value])=>{
            flattenObjectInto(target, value, join(prefix, key));
        });
    } else {
        target[prefix] = source;
    }
}
/**
 * Converts an oplog diff to a series of $set and $unset operations.
 * Handles several types of operations:
 * - Direct unsets via 'd' field
 * - Nested sets via 'i' field
 * - Top-level sets via 'u' field
 * - Array operations and nested objects via 's' prefixed fields
 *
 * Preserves the structure of EJSON custom types and ObjectIDs while
 * flattening paths into dot notation for MongoDB updates.
 */ function convertOplogDiff(oplogEntry, diff, prefix = '') {
    Object.entries(diff).forEach(([diffKey, value])=>{
        if (diffKey === 'd') {
            var // Handle `$unset`s
            _oplogEntry;
            var _$unset;
            (_$unset = (_oplogEntry = oplogEntry).$unset) !== null && _$unset !== void 0 ? _$unset : _oplogEntry.$unset = {};
            Object.keys(value).forEach((key)=>{
                oplogEntry.$unset[join(prefix, key)] = true;
            });
        } else if (diffKey === 'i') {
            var // Handle (potentially) nested `$set`s
            _oplogEntry1;
            var _$set;
            (_$set = (_oplogEntry1 = oplogEntry).$set) !== null && _$set !== void 0 ? _$set : _oplogEntry1.$set = {};
            flattenObjectInto(oplogEntry.$set, value, prefix);
        } else if (diffKey === 'u') {
            var // Handle flat `$set`s
            _oplogEntry2;
            var _$set1;
            (_$set1 = (_oplogEntry2 = oplogEntry).$set) !== null && _$set1 !== void 0 ? _$set1 : _oplogEntry2.$set = {};
            Object.entries(value).forEach(([key, fieldValue])=>{
                oplogEntry.$set[join(prefix, key)] = fieldValue;
            });
        } else if (diffKey.startsWith('s')) {
            // Handle s-fields (array operations and nested objects)
            const key = diffKey.slice(1);
            if (isArrayOperator(value)) {
                // Array operator
                Object.entries(value).forEach(([position, fieldValue])=>{
                    if (position === 'a') return;
                    const positionKey = join(prefix, `${key}.${position.slice(1)}`);
                    if (position[0] === 's') {
                        convertOplogDiff(oplogEntry, fieldValue, positionKey);
                    } else if (fieldValue === null) {
                        var _oplogEntry;
                        var _$unset;
                        (_$unset = (_oplogEntry = oplogEntry).$unset) !== null && _$unset !== void 0 ? _$unset : _oplogEntry.$unset = {};
                        oplogEntry.$unset[positionKey] = true;
                    } else {
                        var _oplogEntry1;
                        var _$set;
                        (_$set = (_oplogEntry1 = oplogEntry).$set) !== null && _$set !== void 0 ? _$set : _oplogEntry1.$set = {};
                        oplogEntry.$set[positionKey] = fieldValue;
                    }
                });
            } else if (key) {
                // Nested object
                convertOplogDiff(oplogEntry, value, join(prefix, key));
            }
        }
    });
}
/**
 * Converts a MongoDB v2 oplog entry to v1 format.
 * Returns the original entry unchanged if it's not a v2 oplog entry
 * or doesn't contain a diff field.
 *
 * The converted entry will contain $set and $unset operations that are
 * equivalent to the v2 diff format, with paths flattened to dot notation
 * and special handling for EJSON custom types and ObjectIDs.
 */ function oplogV2V1Converter(oplogEntry) {
    if (oplogEntry.$v !== 2 || !oplogEntry.diff) {
        return oplogEntry;
    }
    const convertedOplogEntry = {
        $v: 2
    };
    convertOplogDiff(convertedOplogEntry, oplogEntry.diff);
    return convertedOplogEntry;
}
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cursor_description.ts":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/cursor_description.ts                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({CursorDescription:()=>CursorDescription});function _define_property(obj, key, value) {
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
/**
 * Represents the arguments used to construct a cursor.
 * Used as a key for cursor de-duplication.
 *
 * All properties must be either:
 * - JSON-stringifiable, or
 * - Not affect observeChanges output (e.g., options.transform functions)
 */ class CursorDescription {
    constructor(collectionName, selector, options){
        _define_property(this, "collectionName", void 0);
        _define_property(this, "selector", void 0);
        _define_property(this, "options", void 0);
        this.collectionName = collectionName;
        // @ts-ignore
        this.selector = Mongo.Collection._rewriteSelector(selector);
        this.options = options || {};
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"mongo_connection.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/mongo_connection.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({MongoConnection:()=>MongoConnection},true);let Meteor;module.link('meteor/meteor',{Meteor(v){Meteor=v}},0);let CLIENT_ONLY_METHODS,getAsyncMethodName;module.link('meteor/minimongo/constants',{CLIENT_ONLY_METHODS(v){CLIENT_ONLY_METHODS=v},getAsyncMethodName(v){getAsyncMethodName=v}},1);let MiniMongoQueryError;module.link('meteor/minimongo/common',{MiniMongoQueryError(v){MiniMongoQueryError=v}},2);let path;module.link('path',{default(v){path=v}},3);let AsynchronousCursor;module.link('./asynchronous_cursor',{AsynchronousCursor(v){AsynchronousCursor=v}},4);let Cursor;module.link('./cursor',{Cursor(v){Cursor=v}},5);let CursorDescription;module.link('./cursor_description',{CursorDescription(v){CursorDescription=v}},6);let DocFetcher;module.link('./doc_fetcher',{DocFetcher(v){DocFetcher=v}},7);let MongoDB,replaceMeteorAtomWithMongo,replaceTypes,transformResult;module.link('./mongo_common',{MongoDB(v){MongoDB=v},replaceMeteorAtomWithMongo(v){replaceMeteorAtomWithMongo=v},replaceTypes(v){replaceTypes=v},transformResult(v){transformResult=v}},8);let ObserveHandle;module.link('./observe_handle',{ObserveHandle(v){ObserveHandle=v}},9);let ObserveMultiplexer;module.link('./observe_multiplex',{ObserveMultiplexer(v){ObserveMultiplexer=v}},10);let OplogObserveDriver;module.link('./oplog_observe_driver',{OplogObserveDriver(v){OplogObserveDriver=v}},11);let OPLOG_COLLECTION,OplogHandle;module.link('./oplog_tailing',{OPLOG_COLLECTION(v){OPLOG_COLLECTION=v},OplogHandle(v){OplogHandle=v}},12);let PollingObserveDriver;module.link('./polling_observe_driver',{PollingObserveDriver(v){PollingObserveDriver=v}},13);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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














const FILE_ASSET_SUFFIX = 'Asset';
const ASSETS_FOLDER = 'assets';
const APP_FOLDER = 'app';
const oplogCollectionWarnings = [];
const MongoConnection = function(url, options) {
    var _Meteor_settings_packages_mongo, _Meteor_settings_packages, _Meteor_settings;
    var self = this;
    options = options || {};
    self._observeMultiplexers = {};
    self._onFailoverHook = new Hook;
    const userOptions = _object_spread({}, Mongo._connectionOptions || {}, ((_Meteor_settings = Meteor.settings) === null || _Meteor_settings === void 0 ? void 0 : (_Meteor_settings_packages = _Meteor_settings.packages) === null || _Meteor_settings_packages === void 0 ? void 0 : (_Meteor_settings_packages_mongo = _Meteor_settings_packages.mongo) === null || _Meteor_settings_packages_mongo === void 0 ? void 0 : _Meteor_settings_packages_mongo.options) || {});
    var mongoOptions = Object.assign({
        ignoreUndefined: true
    }, userOptions);
    // Internally the oplog connections specify their own maxPoolSize
    // which we don't want to overwrite with any user defined value
    if ('maxPoolSize' in options) {
        // If we just set this for "server", replSet will override it. If we just
        // set it for replSet, it will be ignored if we're not using a replSet.
        mongoOptions.maxPoolSize = options.maxPoolSize;
    }
    if ('minPoolSize' in options) {
        mongoOptions.minPoolSize = options.minPoolSize;
    }
    // Transform options like "tlsCAFileAsset": "filename.pem" into
    // "tlsCAFile": "/<fullpath>/filename.pem"
    Object.entries(mongoOptions || {}).filter(([key])=>key && key.endsWith(FILE_ASSET_SUFFIX)).forEach(([key, value])=>{
        const optionName = key.replace(FILE_ASSET_SUFFIX, '');
        mongoOptions[optionName] = path.join(Assets.getServerDir(), ASSETS_FOLDER, APP_FOLDER, value);
        delete mongoOptions[key];
    });
    self.db = null;
    self._oplogHandle = null;
    self._docFetcher = null;
    mongoOptions.driverInfo = {
        name: 'Meteor',
        version: Meteor.release
    };
    self.client = new MongoDB.MongoClient(url, mongoOptions);
    self.db = self.client.db();
    self.client.on('serverDescriptionChanged', Meteor.bindEnvironment((event)=>{
        // When the connection is no longer against the primary node, execute all
        // failover hooks. This is important for the driver as it has to re-pool the
        // query when it happens.
        if (event.previousDescription.type !== 'RSPrimary' && event.newDescription.type === 'RSPrimary') {
            self._onFailoverHook.each((callback1)=>{
                callback1();
                return true;
            });
        }
    }));
    if (options.oplogUrl && !Package['disable-oplog']) {
        self._oplogHandle = new OplogHandle(options.oplogUrl, self.db.databaseName);
        self._docFetcher = new DocFetcher(self);
    }
};
MongoConnection.prototype._close = function() {
    return _async_to_generator(function*() {
        var self = this;
        if (!self.db) throw Error("close called before Connection created?");
        // XXX probably untested
        var oplogHandle = self._oplogHandle;
        self._oplogHandle = null;
        if (oplogHandle) yield oplogHandle.stop();
        // Use Future.wrap so that errors get thrown. This happens to
        // work even outside a fiber since the 'close' method is not
        // actually asynchronous.
        yield self.client.close();
    }).call(this);
};
MongoConnection.prototype.close = function() {
    return this._close();
};
MongoConnection.prototype._setOplogHandle = function(oplogHandle) {
    this._oplogHandle = oplogHandle;
    return this;
};
// Returns the Mongo Collection object; may yield.
MongoConnection.prototype.rawCollection = function(collectionName) {
    var self = this;
    if (!self.db) throw Error("rawCollection called before Connection created?");
    return self.db.collection(collectionName);
};
MongoConnection.prototype.createCappedCollectionAsync = function(collectionName, byteSize, maxDocuments) {
    return _async_to_generator(function*() {
        var self = this;
        if (!self.db) throw Error("createCappedCollectionAsync called before Connection created?");
        yield self.db.createCollection(collectionName, {
            capped: true,
            size: byteSize,
            max: maxDocuments
        });
    }).call(this);
};
// This should be called synchronously with a write, to create a
// transaction on the current write fence, if any. After we can read
// the write, and after observers have been notified (or at least,
// after the observer notifiers have added themselves to the write
// fence), you should call 'committed()' on the object returned.
MongoConnection.prototype._maybeBeginWrite = function() {
    const fence = DDPServer._getCurrentFence();
    if (fence) {
        return fence.beginWrite();
    } else {
        return {
            committed: function() {}
        };
    }
};
// Internal interface: adds a callback which is called when the Mongo primary
// changes. Returns a stop handle.
MongoConnection.prototype._onFailover = function(callback1) {
    return this._onFailoverHook.register(callback1);
};
MongoConnection.prototype.insertAsync = function(collection_name, document) {
    return _async_to_generator(function*() {
        const self = this;
        if (collection_name === "___meteor_failure_test_collection") {
            const e = new Error("Failure test");
            e._expectedByTest = true;
            throw e;
        }
        if (!(LocalCollection._isPlainObject(document) && !EJSON._isCustomType(document))) {
            throw new Error("Only plain objects may be inserted into MongoDB");
        }
        var write = self._maybeBeginWrite();
        var refresh = function() {
            return _async_to_generator(function*() {
                yield Meteor.refresh({
                    collection: collection_name,
                    id: document._id
                });
            })();
        };
        return self.rawCollection(collection_name).insertOne(replaceTypes(document, replaceMeteorAtomWithMongo), {
            safe: true
        }).then(({ insertedId })=>_async_to_generator(function*() {
                yield refresh();
                yield write.committed();
                return insertedId;
            })()).catch((e)=>_async_to_generator(function*() {
                yield write.committed();
                throw e;
            })());
    }).call(this);
};
// Cause queries that may be affected by the selector to poll in this write
// fence.
MongoConnection.prototype._refresh = function(collectionName, selector) {
    return _async_to_generator(function*() {
        var refreshKey = {
            collection: collectionName
        };
        // If we know which documents we're removing, don't poll queries that are
        // specific to other documents. (Note that multiple notifications here should
        // not cause multiple polls, since all our listener is doing is enqueueing a
        // poll.)
        var specificIds = LocalCollection._idsMatchedBySelector(selector);
        if (specificIds) {
            for (const id of specificIds){
                yield Meteor.refresh(Object.assign({
                    id: id
                }, refreshKey));
            }
            ;
        } else {
            yield Meteor.refresh(refreshKey);
        }
    })();
};
MongoConnection.prototype.removeAsync = function(collection_name, selector) {
    return _async_to_generator(function*() {
        var self = this;
        if (collection_name === "___meteor_failure_test_collection") {
            var e = new Error("Failure test");
            e._expectedByTest = true;
            throw e;
        }
        var write = self._maybeBeginWrite();
        var refresh = function() {
            return _async_to_generator(function*() {
                yield self._refresh(collection_name, selector);
            })();
        };
        return self.rawCollection(collection_name).deleteMany(replaceTypes(selector, replaceMeteorAtomWithMongo), {
            safe: true
        }).then(({ deletedCount })=>_async_to_generator(function*() {
                yield refresh();
                yield write.committed();
                return transformResult({
                    result: {
                        modifiedCount: deletedCount
                    }
                }).numberAffected;
            })()).catch((err)=>_async_to_generator(function*() {
                yield write.committed();
                throw err;
            })());
    }).call(this);
};
MongoConnection.prototype.dropCollectionAsync = function(collectionName) {
    return _async_to_generator(function*() {
        var self = this;
        var write = self._maybeBeginWrite();
        var refresh = function() {
            return Meteor.refresh({
                collection: collectionName,
                id: null,
                dropCollection: true
            });
        };
        return self.rawCollection(collectionName).drop().then((result)=>_async_to_generator(function*() {
                yield refresh();
                yield write.committed();
                return result;
            })()).catch((e)=>_async_to_generator(function*() {
                yield write.committed();
                throw e;
            })());
    }).call(this);
};
// For testing only.  Slightly better than `c.rawDatabase().dropDatabase()`
// because it lets the test's fence wait for it to be complete.
MongoConnection.prototype.dropDatabaseAsync = function() {
    return _async_to_generator(function*() {
        var self = this;
        var write = self._maybeBeginWrite();
        var refresh = function() {
            return _async_to_generator(function*() {
                yield Meteor.refresh({
                    dropDatabase: true
                });
            })();
        };
        try {
            yield self.db._dropDatabase();
            yield refresh();
            yield write.committed();
        } catch (e) {
            yield write.committed();
            throw e;
        }
    }).call(this);
};
MongoConnection.prototype.updateAsync = function(collection_name, selector, mod, options) {
    return _async_to_generator(function*() {
        var self = this;
        if (collection_name === "___meteor_failure_test_collection") {
            var e = new Error("Failure test");
            e._expectedByTest = true;
            throw e;
        }
        // explicit safety check. null and undefined can crash the mongo
        // driver. Although the node driver and minimongo do 'support'
        // non-object modifier in that they don't crash, they are not
        // meaningful operations and do not do anything. Defensively throw an
        // error here.
        if (!mod || typeof mod !== 'object') {
            const error = new Error("Invalid modifier. Modifier must be an object.");
            throw error;
        }
        if (!(LocalCollection._isPlainObject(mod) && !EJSON._isCustomType(mod))) {
            const error = new Error("Only plain objects may be used as replacement" + " documents in MongoDB");
            throw error;
        }
        if (!options) options = {};
        var write = self._maybeBeginWrite();
        var refresh = function() {
            return _async_to_generator(function*() {
                yield self._refresh(collection_name, selector);
            })();
        };
        var collection = self.rawCollection(collection_name);
        var mongoOpts = {
            safe: true
        };
        // Add support for filtered positional operator
        if (options.arrayFilters !== undefined) mongoOpts.arrayFilters = options.arrayFilters;
        // explictly enumerate options that minimongo supports
        if (options.upsert) mongoOpts.upsert = true;
        if (options.multi) mongoOpts.multi = true;
        // Lets you get a more more full result from MongoDB. Use with caution:
        // might not work with C.upsert (as opposed to C.update({upsert:true}) or
        // with simulated upsert.
        if (options.fullResult) mongoOpts.fullResult = true;
        var mongoSelector = replaceTypes(selector, replaceMeteorAtomWithMongo);
        var mongoMod = replaceTypes(mod, replaceMeteorAtomWithMongo);
        var isModify = LocalCollection._isModificationMod(mongoMod);
        if (options._forbidReplace && !isModify) {
            var err = new Error("Invalid modifier. Replacements are forbidden.");
            throw err;
        }
        // We've already run replaceTypes/replaceMeteorAtomWithMongo on
        // selector and mod.  We assume it doesn't matter, as far as
        // the behavior of modifiers is concerned, whether `_modify`
        // is run on EJSON or on mongo-converted EJSON.
        // Run this code up front so that it fails fast if someone uses
        // a Mongo update operator we don't support.
        let knownId;
        if (options.upsert) {
            try {
                let newDoc = LocalCollection._createUpsertDocument(selector, mod);
                knownId = newDoc._id;
            } catch (err) {
                throw err;
            }
        }
        if (options.upsert && !isModify && !knownId && options.insertedId && !(options.insertedId instanceof Mongo.ObjectID && options.generatedId)) {
            // In case of an upsert with a replacement, where there is no _id defined
            // in either the query or the replacement doc, mongo will generate an id itself.
            // Therefore we need this special strategy if we want to control the id ourselves.
            // We don't need to do this when:
            // - This is not a replacement, so we can add an _id to $setOnInsert
            // - The id is defined by query or mod we can just add it to the replacement doc
            // - The user did not specify any id preference and the id is a Mongo ObjectId,
            //     then we can just let Mongo generate the id
            return yield simulateUpsertWithInsertedId(collection, mongoSelector, mongoMod, options).then((result)=>_async_to_generator(function*() {
                    yield refresh();
                    yield write.committed();
                    if (result && !options._returnObject) {
                        return result.numberAffected;
                    } else {
                        return result;
                    }
                })());
        } else {
            if (options.upsert && !knownId && options.insertedId && isModify) {
                if (!mongoMod.hasOwnProperty('$setOnInsert')) {
                    mongoMod.$setOnInsert = {};
                }
                knownId = options.insertedId;
                Object.assign(mongoMod.$setOnInsert, replaceTypes({
                    _id: options.insertedId
                }, replaceMeteorAtomWithMongo));
            }
            const strings = Object.keys(mongoMod).filter((key)=>!key.startsWith("$"));
            let updateMethod = strings.length > 0 ? 'replaceOne' : 'updateMany';
            updateMethod = updateMethod === 'updateMany' && !mongoOpts.multi ? 'updateOne' : updateMethod;
            return collection[updateMethod].bind(collection)(mongoSelector, mongoMod, mongoOpts).then((result)=>_async_to_generator(function*() {
                    var meteorResult = transformResult({
                        result
                    });
                    if (meteorResult && options._returnObject) {
                        // If this was an upsertAsync() call, and we ended up
                        // inserting a new doc and we know its id, then
                        // return that id as well.
                        if (options.upsert && meteorResult.insertedId) {
                            if (knownId) {
                                meteorResult.insertedId = knownId;
                            } else if (meteorResult.insertedId instanceof MongoDB.ObjectId) {
                                meteorResult.insertedId = new Mongo.ObjectID(meteorResult.insertedId.toHexString());
                            }
                        }
                        yield refresh();
                        yield write.committed();
                        return meteorResult;
                    } else {
                        yield refresh();
                        yield write.committed();
                        return meteorResult.numberAffected;
                    }
                })()).catch((err)=>_async_to_generator(function*() {
                    yield write.committed();
                    throw err;
                })());
        }
    }).call(this);
};
// exposed for testing
MongoConnection._isCannotChangeIdError = function(err) {
    // Mongo 3.2.* returns error as next Object:
    // {name: String, code: Number, errmsg: String}
    // Older Mongo returns:
    // {name: String, code: Number, err: String}
    var error = err.errmsg || err.err;
    // We don't use the error code here
    // because the error code we observed it producing (16837) appears to be
    // a far more generic error code based on examining the source.
    if (error.indexOf('The _id field cannot be changed') === 0 || error.indexOf("the (immutable) field '_id' was found to have been altered to _id") !== -1) {
        return true;
    }
    return false;
};
// XXX MongoConnection.upsertAsync() does not return the id of the inserted document
// unless you set it explicitly in the selector or modifier (as a replacement
// doc).
MongoConnection.prototype.upsertAsync = function(collectionName, selector, mod, options) {
    return _async_to_generator(function*() {
        var self = this;
        if (typeof options === "function" && !callback) {
            callback = options;
            options = {};
        }
        return self.updateAsync(collectionName, selector, mod, Object.assign({}, options, {
            upsert: true,
            _returnObject: true
        }));
    }).call(this);
};
MongoConnection.prototype.find = function(collectionName, selector, options) {
    var self = this;
    if (arguments.length === 1) selector = {};
    return new Cursor(self, new CursorDescription(collectionName, selector, options));
};
MongoConnection.prototype.findOneAsync = function(_0, _1, _2) {
    return _async_to_generator(function*(collection_name, selector, options) {
        var self = this;
        if (arguments.length === 1) {
            selector = {};
        }
        options = options || {};
        options.limit = 1;
        const results = yield self.find(collection_name, selector, options).fetch();
        return results[0];
    }).apply(this, arguments);
};
// We'll actually design an index API later. For now, we just pass through to
// Mongo's, but make it synchronous.
MongoConnection.prototype.createIndexAsync = function(collectionName, index, options) {
    return _async_to_generator(function*() {
        var self = this;
        // We expect this function to be called at startup, not from within a method,
        // so we don't interact with the write fence.
        var collection = self.rawCollection(collectionName);
        yield collection.createIndex(index, options);
    }).call(this);
};
// just to be consistent with the other methods
MongoConnection.prototype.createIndex = MongoConnection.prototype.createIndexAsync;
MongoConnection.prototype.countDocuments = function(collectionName, ...args) {
    args = args.map((arg)=>replaceTypes(arg, replaceMeteorAtomWithMongo));
    const collection = this.rawCollection(collectionName);
    return collection.countDocuments(...args);
};
MongoConnection.prototype.estimatedDocumentCount = function(collectionName, ...args) {
    args = args.map((arg)=>replaceTypes(arg, replaceMeteorAtomWithMongo));
    const collection = this.rawCollection(collectionName);
    return collection.estimatedDocumentCount(...args);
};
MongoConnection.prototype.ensureIndexAsync = MongoConnection.prototype.createIndexAsync;
MongoConnection.prototype.dropIndexAsync = function(collectionName, index) {
    return _async_to_generator(function*() {
        var self = this;
        // This function is only used by test code, not within a method, so we don't
        // interact with the write fence.
        var collection = self.rawCollection(collectionName);
        var indexName = yield collection.dropIndex(index);
    }).call(this);
};
CLIENT_ONLY_METHODS.forEach(function(m) {
    MongoConnection.prototype[m] = function() {
        throw new Error(`${m} +  is not available on the server. Please use ${getAsyncMethodName(m)}() instead.`);
    };
});
var NUM_OPTIMISTIC_TRIES = 3;
var simulateUpsertWithInsertedId = function(collection, selector, mod, options) {
    return _async_to_generator(function*() {
        // STRATEGY: First try doing an upsert with a generated ID.
        // If this throws an error about changing the ID on an existing document
        // then without affecting the database, we know we should probably try
        // an update without the generated ID. If it affected 0 documents,
        // then without affecting the database, we the document that first
        // gave the error is probably removed and we need to try an insert again
        // We go back to step one and repeat.
        // Like all "optimistic write" schemes, we rely on the fact that it's
        // unlikely our writes will continue to be interfered with under normal
        // circumstances (though sufficiently heavy contention with writers
        // disagreeing on the existence of an object will cause writes to fail
        // in theory).
        var insertedId = options.insertedId; // must exist
        var mongoOptsForUpdate = {
            safe: true,
            multi: options.multi
        };
        var mongoOptsForInsert = {
            safe: true,
            upsert: true
        };
        var replacementWithId = Object.assign(replaceTypes({
            _id: insertedId
        }, replaceMeteorAtomWithMongo), mod);
        var tries = NUM_OPTIMISTIC_TRIES;
        var doUpdate = function() {
            return _async_to_generator(function*() {
                tries--;
                if (!tries) {
                    throw new Error("Upsert failed after " + NUM_OPTIMISTIC_TRIES + " tries.");
                } else {
                    let method = collection.updateMany;
                    if (!Object.keys(mod).some((key)=>key.startsWith("$"))) {
                        method = collection.replaceOne.bind(collection);
                    }
                    return method(selector, mod, mongoOptsForUpdate).then((result)=>{
                        if (result && (result.modifiedCount || result.upsertedCount)) {
                            return {
                                numberAffected: result.modifiedCount || result.upsertedCount,
                                insertedId: result.upsertedId || undefined
                            };
                        } else {
                            return doConditionalInsert();
                        }
                    });
                }
            })();
        };
        var doConditionalInsert = function() {
            return collection.replaceOne(selector, replacementWithId, mongoOptsForInsert).then((result)=>({
                    numberAffected: result.upsertedCount,
                    insertedId: result.upsertedId
                })).catch((err)=>{
                if (MongoConnection._isCannotChangeIdError(err)) {
                    return doUpdate();
                } else {
                    throw err;
                }
            });
        };
        return doUpdate();
    })();
};
// observeChanges for tailable cursors on capped collections.
//
// Some differences from normal cursors:
//   - Will never produce anything other than 'added' or 'addedBefore'. If you
//     do update a document that has already been produced, this will not notice
//     it.
//   - If you disconnect and reconnect from Mongo, it will essentially restart
//     the query, which will lead to duplicate results. This is pretty bad,
//     but if you include a field called 'ts' which is inserted as
//     new MongoInternals.MongoTimestamp(0, 0) (which is initialized to the
//     current Mongo-style timestamp), we'll be able to find the place to
//     restart properly. (This field is specifically understood by Mongo with an
//     optimization which allows it to find the right place to start without
//     an index on ts. It's how the oplog works.)
//   - No callbacks are triggered synchronously with the call (there's no
//     differentiation between "initial data" and "later changes"; everything
//     that matches the query gets sent asynchronously).
//   - De-duplication is not implemented.
//   - Does not yet interact with the write fence. Probably, this should work by
//     ignoring removes (which don't work on capped collections) and updates
//     (which don't affect tailable cursors), and just keeping track of the ID
//     of the inserted object, and closing the write fence once you get to that
//     ID (or timestamp?).  This doesn't work well if the document doesn't match
//     the query, though.  On the other hand, the write fence can close
//     immediately if it does not match the query. So if we trust minimongo
//     enough to accurately evaluate the query against the write fence, we
//     should be able to do this...  Of course, minimongo doesn't even support
//     Mongo Timestamps yet.
MongoConnection.prototype._observeChangesTailable = function(cursorDescription, ordered, callbacks) {
    var self = this;
    // Tailable cursors only ever call added/addedBefore callbacks, so it's an
    // error if you didn't provide them.
    if (ordered && !callbacks.addedBefore || !ordered && !callbacks.added) {
        throw new Error("Can't observe an " + (ordered ? "ordered" : "unordered") + " tailable cursor without a " + (ordered ? "addedBefore" : "added") + " callback");
    }
    return self.tail(cursorDescription, function(doc) {
        var id = doc._id;
        delete doc._id;
        // The ts is an implementation detail. Hide it.
        delete doc.ts;
        if (ordered) {
            callbacks.addedBefore(id, doc, null);
        } else {
            callbacks.added(id, doc);
        }
    });
};
MongoConnection.prototype._createAsynchronousCursor = function(cursorDescription, options = {}) {
    var self = this;
    const { selfForIteration, useTransform } = options;
    options = {
        selfForIteration,
        useTransform
    };
    var collection = self.rawCollection(cursorDescription.collectionName);
    var cursorOptions = cursorDescription.options;
    var mongoOptions = {
        sort: cursorOptions.sort,
        limit: cursorOptions.limit,
        skip: cursorOptions.skip,
        projection: cursorOptions.fields || cursorOptions.projection,
        readPreference: cursorOptions.readPreference
    };
    // Do we want a tailable cursor (which only works on capped collections)?
    if (cursorOptions.tailable) {
        mongoOptions.numberOfRetries = -1;
    }
    var dbCursor = collection.find(replaceTypes(cursorDescription.selector, replaceMeteorAtomWithMongo), mongoOptions);
    // Do we want a tailable cursor (which only works on capped collections)?
    if (cursorOptions.tailable) {
        // We want a tailable cursor...
        dbCursor.addCursorFlag("tailable", true);
        // ... and for the server to wait a bit if any getMore has no data (rather
        // than making us put the relevant sleeps in the client)...
        dbCursor.addCursorFlag("awaitData", true);
        // And if this is on the oplog collection and the cursor specifies a 'ts',
        // then set the undocumented oplog replay flag, which does a special scan to
        // find the first document (instead of creating an index on ts). This is a
        // very hard-coded Mongo flag which only works on the oplog collection and
        // only works with the ts field.
        if (cursorDescription.collectionName === OPLOG_COLLECTION && cursorDescription.selector.ts) {
            dbCursor.addCursorFlag("oplogReplay", true);
        }
    }
    if (typeof cursorOptions.maxTimeMs !== 'undefined') {
        dbCursor = dbCursor.maxTimeMS(cursorOptions.maxTimeMs);
    }
    if (typeof cursorOptions.hint !== 'undefined') {
        dbCursor = dbCursor.hint(cursorOptions.hint);
    }
    return new AsynchronousCursor(dbCursor, cursorDescription, options, collection);
};
// Tails the cursor described by cursorDescription, most likely on the
// oplog. Calls docCallback with each document found. Ignores errors and just
// restarts the tail on error.
//
// If timeoutMS is set, then if we don't get a new document every timeoutMS,
// kill and restart the cursor. This is primarily a workaround for #8598.
MongoConnection.prototype.tail = function(cursorDescription, docCallback, timeoutMS) {
    var self = this;
    if (!cursorDescription.options.tailable) throw new Error("Can only tail a tailable cursor");
    var cursor = self._createAsynchronousCursor(cursorDescription);
    var stopped = false;
    var lastTS;
    Meteor.defer(function loop() {
        return _async_to_generator(function*() {
            var doc = null;
            while(true){
                if (stopped) return;
                try {
                    doc = yield cursor._nextObjectPromiseWithTimeout(timeoutMS);
                } catch (err) {
                    // We should not ignore errors here unless we want to spend a lot of time debugging
                    console.error(err);
                    // There's no good way to figure out if this was actually an error from
                    // Mongo, or just client-side (including our own timeout error). Ah
                    // well. But either way, we need to retry the cursor (unless the failure
                    // was because the observe got stopped).
                    doc = null;
                }
                // Since we awaited a promise above, we need to check again to see if
                // we've been stopped before calling the callback.
                if (stopped) return;
                if (doc) {
                    // If a tailable cursor contains a "ts" field, use it to recreate the
                    // cursor on error. ("ts" is a standard that Mongo uses internally for
                    // the oplog, and there's a special flag that lets you do binary search
                    // on it instead of needing to use an index.)
                    lastTS = doc.ts;
                    docCallback(doc);
                } else {
                    var newSelector = Object.assign({}, cursorDescription.selector);
                    if (lastTS) {
                        newSelector.ts = {
                            $gt: lastTS
                        };
                    }
                    cursor = self._createAsynchronousCursor(new CursorDescription(cursorDescription.collectionName, newSelector, cursorDescription.options));
                    // Mongo failover takes many seconds.  Retry in a bit.  (Without this
                    // setTimeout, we peg the CPU at 100% and never notice the actual
                    // failover.
                    setTimeout(loop, 100);
                    break;
                }
            }
        })();
    });
    return {
        stop: function() {
            stopped = true;
            cursor.close();
        }
    };
};
Object.assign(MongoConnection.prototype, {
    _observeChanges: function(cursorDescription, ordered, callbacks, nonMutatingCallbacks) {
        return _async_to_generator(function*() {
            var _self__oplogHandle;
            var self = this;
            const collectionName = cursorDescription.collectionName;
            if (cursorDescription.options.tailable) {
                return self._observeChangesTailable(cursorDescription, ordered, callbacks);
            }
            // You may not filter out _id when observing changes, because the id is a core
            // part of the observeChanges API.
            const fieldsOptions = cursorDescription.options.projection || cursorDescription.options.fields;
            if (fieldsOptions && (fieldsOptions._id === 0 || fieldsOptions._id === false)) {
                throw Error("You may not observe a cursor with {fields: {_id: 0}}");
            }
            var observeKey = EJSON.stringify(Object.assign({
                ordered: ordered
            }, cursorDescription));
            var multiplexer, observeDriver;
            var firstHandle = false;
            // Find a matching ObserveMultiplexer, or create a new one. This next block is
            // guaranteed to not yield (and it doesn't call anything that can observe a
            // new query), so no other calls to this function can interleave with it.
            if (observeKey in self._observeMultiplexers) {
                multiplexer = self._observeMultiplexers[observeKey];
            } else {
                firstHandle = true;
                // Create a new ObserveMultiplexer.
                multiplexer = new ObserveMultiplexer({
                    ordered: ordered,
                    onStop: function() {
                        delete self._observeMultiplexers[observeKey];
                        return observeDriver.stop();
                    }
                });
            }
            var observeHandle = new ObserveHandle(multiplexer, callbacks, nonMutatingCallbacks);
            const oplogOptions = (self === null || self === void 0 ? void 0 : (_self__oplogHandle = self._oplogHandle) === null || _self__oplogHandle === void 0 ? void 0 : _self__oplogHandle._oplogOptions) || {};
            const { includeCollections, excludeCollections } = oplogOptions;
            if (firstHandle) {
                var matcher, sorter;
                var canUseOplog = [
                    function() {
                        // At a bare minimum, using the oplog requires us to have an oplog, to
                        // want unordered callbacks, and to not want a callback on the polls
                        // that won't happen.
                        return self._oplogHandle && !ordered && !callbacks._testOnlyPollCallback;
                    },
                    function() {
                        // We also need to check, if the collection of this Cursor is actually being "watched" by the Oplog handle
                        // if not, we have to fallback to long polling
                        if ((excludeCollections === null || excludeCollections === void 0 ? void 0 : excludeCollections.length) && excludeCollections.includes(collectionName)) {
                            if (!oplogCollectionWarnings.includes(collectionName)) {
                                console.warn(`Meteor.settings.packages.mongo.oplogExcludeCollections includes the collection ${collectionName} - your subscriptions will only use long polling!`);
                                oplogCollectionWarnings.push(collectionName); // we only want to show the warnings once per collection!
                            }
                            return false;
                        }
                        if ((includeCollections === null || includeCollections === void 0 ? void 0 : includeCollections.length) && !includeCollections.includes(collectionName)) {
                            if (!oplogCollectionWarnings.includes(collectionName)) {
                                console.warn(`Meteor.settings.packages.mongo.oplogIncludeCollections does not include the collection ${collectionName} - your subscriptions will only use long polling!`);
                                oplogCollectionWarnings.push(collectionName); // we only want to show the warnings once per collection!
                            }
                            return false;
                        }
                        return true;
                    },
                    function() {
                        // We need to be able to compile the selector. Fall back to polling for
                        // some newfangled $selector that minimongo doesn't support yet.
                        try {
                            matcher = new Minimongo.Matcher(cursorDescription.selector);
                            return true;
                        } catch (e) {
                            // XXX make all compilation errors MinimongoError or something
                            //     so that this doesn't ignore unrelated exceptions
                            if (Meteor.isClient && e instanceof MiniMongoQueryError) {
                                throw e;
                            }
                            return false;
                        }
                    },
                    function() {
                        // ... and the selector itself needs to support oplog.
                        return OplogObserveDriver.cursorSupported(cursorDescription, matcher);
                    },
                    function() {
                        // And we need to be able to compile the sort, if any.  eg, can't be
                        // {$natural: 1}.
                        if (!cursorDescription.options.sort) return true;
                        try {
                            sorter = new Minimongo.Sorter(cursorDescription.options.sort);
                            return true;
                        } catch (e) {
                            // XXX make all compilation errors MinimongoError or something
                            //     so that this doesn't ignore unrelated exceptions
                            return false;
                        }
                    }
                ].every((f)=>f()); // invoke each function and check if all return true
                var driverClass = canUseOplog ? OplogObserveDriver : PollingObserveDriver;
                observeDriver = new driverClass({
                    cursorDescription: cursorDescription,
                    mongoHandle: self,
                    multiplexer: multiplexer,
                    ordered: ordered,
                    matcher: matcher,
                    sorter: sorter,
                    _testOnlyPollCallback: callbacks._testOnlyPollCallback
                });
                if (observeDriver._init) {
                    yield observeDriver._init();
                }
                // This field is only set for use in tests.
                multiplexer._observeDriver = observeDriver;
            }
            self._observeMultiplexers[observeKey] = multiplexer;
            // Blocks until the initial adds have been sent.
            yield multiplexer.addHandleAndSendInitialAdds(observeHandle);
            return observeHandle;
        }).call(this);
    }
});
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"mongo_common.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/mongo_common.js                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({replaceNames:()=>replaceNames});module.export({MongoDB:()=>MongoDB,writeCallback:()=>writeCallback,transformResult:()=>transformResult,replaceMeteorAtomWithMongo:()=>replaceMeteorAtomWithMongo,replaceTypes:()=>replaceTypes,replaceMongoAtomWithMeteor:()=>replaceMongoAtomWithMeteor},true);let clone;module.link('lodash.clone',{default(v){clone=v}},0);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();
/** @type {import('mongodb')} */ const MongoDB = Object.assign(NpmModuleMongodb, {
    ObjectID: NpmModuleMongodb.ObjectId
});
// The write methods block until the database has confirmed the write (it may
// not be replicated or stable on disk, but one server has confirmed it) if no
// callback is provided. If a callback is provided, then they call the callback
// when the write is confirmed. They return nothing on success, and raise an
// exception on failure.
//
// After making a write (with insert, update, remove), observers are
// notified asynchronously. If you want to receive a callback once all
// of the observer notifications have landed for your write, do the
// writes inside a write fence (set DDPServer._CurrentWriteFence to a new
// _WriteFence, and then set a callback on the write fence.)
//
// Since our execution environment is single-threaded, this is
// well-defined -- a write "has been made" if it's returned, and an
// observer "has been notified" if its callback has returned.
const writeCallback = function(write, refresh, callback) {
    return function(err, result) {
        if (!err) {
            // XXX We don't have to run this on error, right?
            try {
                refresh();
            } catch (refreshErr) {
                if (callback) {
                    callback(refreshErr);
                    return;
                } else {
                    throw refreshErr;
                }
            }
        }
        write.committed();
        if (callback) {
            callback(err, result);
        } else if (err) {
            throw err;
        }
    };
};
const transformResult = function(driverResult) {
    var meteorResult = {
        numberAffected: 0
    };
    if (driverResult) {
        var mongoResult = driverResult.result;
        // On updates with upsert:true, the inserted values come as a list of
        // upserted values -- even with options.multi, when the upsert does insert,
        // it only inserts one element.
        if (mongoResult.upsertedCount) {
            meteorResult.numberAffected = mongoResult.upsertedCount;
            if (mongoResult.upsertedId) {
                meteorResult.insertedId = mongoResult.upsertedId;
            }
        } else {
            // n was used before Mongo 5.0, in Mongo 5.0 we are not receiving this n
            // field and so we are using modifiedCount instead
            meteorResult.numberAffected = mongoResult.n || mongoResult.matchedCount || mongoResult.modifiedCount;
        }
    }
    return meteorResult;
};
const replaceMeteorAtomWithMongo = function(document) {
    if (EJSON.isBinary(document)) {
        // This does more copies than we'd like, but is necessary because
        // MongoDB.BSON only looks like it takes a Uint8Array (and doesn't actually
        // serialize it correctly).
        return new MongoDB.Binary(Buffer.from(document));
    }
    if (document instanceof MongoDB.Binary) {
        return document;
    }
    if (document instanceof Mongo.ObjectID) {
        return new MongoDB.ObjectId(document.toHexString());
    }
    if (document instanceof MongoDB.ObjectId) {
        return new MongoDB.ObjectId(document.toHexString());
    }
    if (document instanceof MongoDB.Timestamp) {
        // For now, the Meteor representation of a Mongo timestamp type (not a date!
        // this is a weird internal thing used in the oplog!) is the same as the
        // Mongo representation. We need to do this explicitly or else we would do a
        // structural clone and lose the prototype.
        return document;
    }
    if (document instanceof Decimal) {
        return MongoDB.Decimal128.fromString(document.toString());
    }
    if (EJSON._isCustomType(document)) {
        return replaceNames(makeMongoLegal, EJSON.toJSONValue(document));
    }
    // It is not ordinarily possible to stick dollar-sign keys into mongo
    // so we don't bother checking for things that need escaping at this time.
    return undefined;
};
const replaceTypes = function(document, atomTransformer) {
    if (typeof document !== 'object' || document === null) return document;
    var replacedTopLevelAtom = atomTransformer(document);
    if (replacedTopLevelAtom !== undefined) return replacedTopLevelAtom;
    var ret = document;
    Object.entries(document).forEach(function([key, val]) {
        var valReplaced = replaceTypes(val, atomTransformer);
        if (val !== valReplaced) {
            // Lazy clone. Shallow copy.
            if (ret === document) ret = clone(document);
            ret[key] = valReplaced;
        }
    });
    return ret;
};
const replaceMongoAtomWithMeteor = function(document) {
    if (document instanceof MongoDB.Binary) {
        // for backwards compatibility
        if (document.sub_type !== 0) {
            return document;
        }
        var buffer = document.value(true);
        return new Uint8Array(buffer);
    }
    if (document instanceof MongoDB.ObjectId) {
        return new Mongo.ObjectID(document.toHexString());
    }
    if (document instanceof MongoDB.Decimal128) {
        return Decimal(document.toString());
    }
    if (document["EJSON$type"] && document["EJSON$value"] && Object.keys(document).length === 2) {
        return EJSON.fromJSONValue(replaceNames(unmakeMongoLegal, document));
    }
    if (document instanceof MongoDB.Timestamp) {
        // For now, the Meteor representation of a Mongo timestamp type (not a date!
        // this is a weird internal thing used in the oplog!) is the same as the
        // Mongo representation. We need to do this explicitly or else we would do a
        // structural clone and lose the prototype.
        return document;
    }
    return undefined;
};
const makeMongoLegal = (name)=>"EJSON" + name;
const unmakeMongoLegal = (name)=>name.substr(5);
function replaceNames(filter, thing) {
    if (typeof thing === "object" && thing !== null) {
        if (Array.isArray(thing)) {
            return thing.map(replaceNames.bind(null, filter));
        }
        var ret = {};
        Object.entries(thing).forEach(function([key, value]) {
            ret[filter(key)] = replaceNames(filter, value);
        });
        return ret;
    }
    return thing;
}
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"asynchronous_cursor.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/asynchronous_cursor.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({AsynchronousCursor:()=>AsynchronousCursor});let LocalCollection;module.link('meteor/minimongo/local_collection',{default(v){LocalCollection=v}},0);let replaceMongoAtomWithMeteor,replaceTypes;module.link('./mongo_common',{replaceMongoAtomWithMeteor(v){replaceMongoAtomWithMeteor=v},replaceTypes(v){replaceTypes=v}},1);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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


/**
 * This is just a light wrapper for the cursor. The goal here is to ensure compatibility even if
 * there are breaking changes on the MongoDB driver.
 *
 * This is an internal implementation detail and is created lazily by the main Cursor class.
 */ class AsynchronousCursor {
    [Symbol.asyncIterator]() {
        var cursor = this;
        return {
            next () {
                return _async_to_generator(function*() {
                    const value = yield cursor._nextObjectPromise();
                    return {
                        done: !value,
                        value
                    };
                })();
            }
        };
    }
    // Returns a Promise for the next object from the underlying cursor (before
    // the Mongo->Meteor type replacement).
    _rawNextObjectPromise() {
        return _async_to_generator(function*() {
            if (this._closing) {
                // Prevent next() after close is called
                return null;
            }
            try {
                this._pendingNext = this._dbCursor.next();
                const result = yield this._pendingNext;
                this._pendingNext = null;
                return result;
            } catch (e) {
                console.error(e);
            } finally{
                this._pendingNext = null;
            }
        }).call(this);
    }
    // Returns a Promise for the next object from the cursor, skipping those whose
    // IDs we've already seen and replacing Mongo atoms with Meteor atoms.
    _nextObjectPromise() {
        return _async_to_generator(function*() {
            while(true){
                var doc = yield this._rawNextObjectPromise();
                if (!doc) return null;
                doc = replaceTypes(doc, replaceMongoAtomWithMeteor);
                if (!this._cursorDescription.options.tailable && '_id' in doc) {
                    // Did Mongo give us duplicate documents in the same cursor? If so,
                    // ignore this one. (Do this before the transform, since transform might
                    // return some unrelated value.) We don't do this for tailable cursors,
                    // because we want to maintain O(1) memory usage. And if there isn't _id
                    // for some reason (maybe it's the oplog), then we don't do this either.
                    // (Be careful to do this for falsey but existing _id, though.)
                    if (this._visitedIds.has(doc._id)) continue;
                    this._visitedIds.set(doc._id, true);
                }
                if (this._transform) doc = this._transform(doc);
                return doc;
            }
        }).call(this);
    }
    // Returns a promise which is resolved with the next object (like with
    // _nextObjectPromise) or rejected if the cursor doesn't return within
    // timeoutMS ms.
    _nextObjectPromiseWithTimeout(timeoutMS) {
        const nextObjectPromise = this._nextObjectPromise();
        if (!timeoutMS) {
            return nextObjectPromise;
        }
        const timeoutPromise = new Promise((resolve)=>{
            // On timeout, close the cursor.
            const timeoutId = setTimeout(()=>{
                resolve(this.close());
            }, timeoutMS);
            // If the `_nextObjectPromise` returned first, cancel the timeout.
            nextObjectPromise.finally(()=>{
                clearTimeout(timeoutId);
            });
        });
        return Promise.race([
            nextObjectPromise,
            timeoutPromise
        ]);
    }
    forEach(callback, thisArg) {
        return _async_to_generator(function*() {
            // Get back to the beginning.
            this._rewind();
            let idx = 0;
            while(true){
                const doc = yield this._nextObjectPromise();
                if (!doc) return;
                yield callback.call(thisArg, doc, idx++, this._selfForIteration);
            }
        }).call(this);
    }
    map(callback, thisArg) {
        return _async_to_generator(function*() {
            const results = [];
            yield this.forEach((doc, index)=>_async_to_generator(function*() {
                    results.push((yield callback.call(thisArg, doc, index, this._selfForIteration)));
                }).call(this));
            return results;
        }).call(this);
    }
    _rewind() {
        // known to be synchronous
        this._dbCursor.rewind();
        this._visitedIds = new LocalCollection._IdMap;
    }
    // Mostly usable for tailable cursors.
    close() {
        return _async_to_generator(function*() {
            this._closing = true;
            // If there's a pending next(), wait for it to finish or abort
            if (this._pendingNext) {
                try {
                    yield this._pendingNext;
                } catch (e) {
                // ignore
                }
            }
            this._dbCursor.close();
        }).call(this);
    }
    fetch() {
        return this.map((doc)=>doc);
    }
    /**
   * FIXME: (node:34680) [MONGODB DRIVER] Warning: cursor.count is deprecated and will be
   *  removed in the next major version, please use `collection.estimatedDocumentCount` or
   *  `collection.countDocuments` instead.
   */ count() {
        return this._dbCursor.count();
    }
    // This method is NOT wrapped in Cursor.
    getRawObjects(ordered) {
        return _async_to_generator(function*() {
            var self = this;
            if (ordered) {
                return self.fetch();
            } else {
                var results = new LocalCollection._IdMap;
                yield self.forEach(function(doc) {
                    results.set(doc._id, doc);
                });
                return results;
            }
        }).call(this);
    }
    constructor(dbCursor, cursorDescription, options){
        _define_property(this, "_closing", false);
        _define_property(this, "_pendingNext", null);
        this._dbCursor = dbCursor;
        this._cursorDescription = cursorDescription;
        this._selfForIteration = options.selfForIteration || this;
        if (options.useTransform && cursorDescription.options.transform) {
            this._transform = LocalCollection.wrapTransform(cursorDescription.options.transform);
        } else {
            this._transform = null;
        }
        this._visitedIds = new LocalCollection._IdMap;
    }
}
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cursor.ts":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/cursor.ts                                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({Cursor:()=>Cursor});let ASYNC_CURSOR_METHODS,getAsyncMethodName;module.link('meteor/minimongo/constants',{ASYNC_CURSOR_METHODS(v){ASYNC_CURSOR_METHODS=v},getAsyncMethodName(v){getAsyncMethodName=v}},0);let replaceMeteorAtomWithMongo,replaceTypes;module.link('./mongo_common',{replaceMeteorAtomWithMongo(v){replaceMeteorAtomWithMongo=v},replaceTypes(v){replaceTypes=v}},1);let LocalCollection;module.link('meteor/minimongo/local_collection',{default(v){LocalCollection=v}},2);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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



/**
 * @class Cursor
 *
 * The main cursor object returned from find(), implementing the documented
 * Mongo.Collection cursor API.
 *
 * Wraps a CursorDescription and lazily creates an AsynchronousCursor
 * (only contacts MongoDB when methods like fetch or forEach are called).
 */ class Cursor {
    countAsync() {
        return _async_to_generator(function*() {
            const collection = this._mongo.rawCollection(this._cursorDescription.collectionName);
            return yield collection.countDocuments(replaceTypes(this._cursorDescription.selector, replaceMeteorAtomWithMongo), replaceTypes(this._cursorDescription.options, replaceMeteorAtomWithMongo));
        }).call(this);
    }
    count() {
        throw new Error("count() is not available on the server. Please use countAsync() instead.");
    }
    getTransform() {
        return this._cursorDescription.options.transform;
    }
    _publishCursor(sub) {
        const collection = this._cursorDescription.collectionName;
        return Mongo.Collection._publishCursor(this, sub, collection);
    }
    _getCollectionName() {
        return this._cursorDescription.collectionName;
    }
    observe(callbacks) {
        return LocalCollection._observeFromObserveChanges(this, callbacks);
    }
    observeAsync(callbacks) {
        return _async_to_generator(function*() {
            return new Promise((resolve)=>resolve(this.observe(callbacks)));
        }).call(this);
    }
    observeChanges(callbacks, options = {}) {
        const ordered = LocalCollection._observeChangesCallbacksAreOrdered(callbacks);
        return this._mongo._observeChanges(this._cursorDescription, ordered, callbacks, options.nonMutatingCallbacks);
    }
    observeChangesAsync(_0) {
        return _async_to_generator(function*(callbacks, options = {}) {
            return this.observeChanges(callbacks, options);
        }).apply(this, arguments);
    }
    constructor(mongo, cursorDescription){
        _define_property(this, "_mongo", void 0);
        _define_property(this, "_cursorDescription", void 0);
        _define_property(this, "_synchronousCursor", void 0);
        this._mongo = mongo;
        this._cursorDescription = cursorDescription;
        this._synchronousCursor = null;
    }
}
// Add cursor methods dynamically
[
    ...ASYNC_CURSOR_METHODS,
    Symbol.iterator,
    Symbol.asyncIterator
].forEach((methodName)=>{
    if (methodName === 'count') return;
    Cursor.prototype[methodName] = function(...args) {
        const cursor = setupAsynchronousCursor(this, methodName);
        return cursor[methodName](...args);
    };
    if (methodName === Symbol.iterator || methodName === Symbol.asyncIterator) return;
    const methodNameAsync = getAsyncMethodName(methodName);
    Cursor.prototype[methodNameAsync] = function(...args) {
        return this[methodName](...args);
    };
});
function setupAsynchronousCursor(cursor, method) {
    if (cursor._cursorDescription.options.tailable) {
        throw new Error(`Cannot call ${String(method)} on a tailable cursor`);
    }
    if (!cursor._synchronousCursor) {
        cursor._synchronousCursor = cursor._mongo._createAsynchronousCursor(cursor._cursorDescription, {
            selfForIteration: cursor,
            useTransform: true
        });
    }
    return cursor._synchronousCursor;
}
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"local_collection_driver.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/local_collection_driver.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({LocalCollectionDriver:()=>LocalCollectionDriver},true);// singleton
const LocalCollectionDriver = new class LocalCollectionDriver {
    open(name, conn) {
        if (!name) {
            return new LocalCollection;
        }
        if (!conn) {
            return ensureCollection(name, this.noConnCollections);
        }
        if (!conn._mongo_livedata_collections) {
            conn._mongo_livedata_collections = Object.create(null);
        }
        // XXX is there a way to keep track of a connection's collections without
        // dangling it off the connection object?
        return ensureCollection(name, conn._mongo_livedata_collections);
    }
    constructor(){
        this.noConnCollections = Object.create(null);
    }
};
function ensureCollection(name, collections) {
    return name in collections ? collections[name] : collections[name] = new LocalCollection(name);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"remote_collection_driver.ts":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/remote_collection_driver.ts                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.export({RemoteCollectionDriver:()=>RemoteCollectionDriver});let once;module.link('lodash.once',{default(v){once=v}},0);let ASYNC_COLLECTION_METHODS,getAsyncMethodName,CLIENT_ONLY_METHODS;module.link("meteor/minimongo/constants",{ASYNC_COLLECTION_METHODS(v){ASYNC_COLLECTION_METHODS=v},getAsyncMethodName(v){getAsyncMethodName=v},CLIENT_ONLY_METHODS(v){CLIENT_ONLY_METHODS=v}},1);let MongoConnection;module.link('./mongo_connection',{MongoConnection(v){MongoConnection=v}},2);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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



class RemoteCollectionDriver {
    open(name) {
        const ret = {};
        // Handle remote collection methods
        RemoteCollectionDriver.REMOTE_COLLECTION_METHODS.forEach((method)=>{
            // Type assertion needed because we know these methods exist on MongoConnection
            const mongoMethod = this.mongo[method];
            ret[method] = mongoMethod.bind(this.mongo, name);
            if (!ASYNC_COLLECTION_METHODS.includes(method)) return;
            const asyncMethodName = getAsyncMethodName(method);
            ret[asyncMethodName] = (...args)=>ret[method](...args);
        });
        // Handle client-only methods
        CLIENT_ONLY_METHODS.forEach((method)=>{
            ret[method] = (...args)=>{
                throw new Error(`${method} is not available on the server. Please use ${getAsyncMethodName(method)}() instead.`);
            };
        });
        return ret;
    }
    constructor(mongoUrl, options){
        _define_property(this, "mongo", void 0);
        this.mongo = new MongoConnection(mongoUrl, options);
    }
}
_define_property(RemoteCollectionDriver, "REMOTE_COLLECTION_METHODS", [
    'createCappedCollectionAsync',
    'dropIndexAsync',
    'ensureIndexAsync',
    'createIndexAsync',
    'countDocuments',
    'dropCollectionAsync',
    'estimatedDocumentCount',
    'find',
    'findOneAsync',
    'insertAsync',
    'rawCollection',
    'removeAsync',
    'updateAsync',
    'upsertAsync'
]);
// Assign the class to MongoInternals
MongoInternals.RemoteCollectionDriver = RemoteCollectionDriver;
// Create the singleton RemoteCollectionDriver only on demand
MongoInternals.defaultRemoteCollectionDriver = once(()=>{
    const connectionOptions = {};
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
        throw new Error("MONGO_URL must be set in environment");
    }
    if (process.env.MONGO_OPLOG_URL) {
        connectionOptions.oplogUrl = process.env.MONGO_OPLOG_URL;
    }
    const driver = new RemoteCollectionDriver(mongoUrl, connectionOptions);
    // Initialize database connection on startup
    Meteor.startup(()=>_async_to_generator(function*() {
            yield driver.mongo.client.connect();
        })());
    return driver;
});

//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"collection":{"collection_extensions.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/collection/collection_extensions.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Collection Extensions System
 * 
 * Provides a clean way to extend Mongo.Collection functionality
 * without monkey patching. Supports constructor extensions,
 * prototype methods, and static methods.
 */ if (Package['lai:collection-extensions']) {
    console.warn('lai:collection-extensions is not deprecated. Use Mongo.Collection.addExtension instead.');
}
CollectionExtensions = {
    _extensions: [],
    _prototypeMethods: new Map(),
    _staticMethods: new Map(),
    /**
   * Add a constructor extension function
   * Extension function is called with (name, options) and 'this' bound to collection instance
   */ addExtension (extension) {
        if (typeof extension !== 'function') {
            throw new Error('Extension must be a function');
        }
        this._extensions.push(extension);
    },
    /**
   * Add a prototype method to all collection instances
   * Method is bound to the collection instance
   */ addPrototypeMethod (name, method) {
        if (typeof name !== 'string' || !name) {
            throw new Error('Prototype method name must be a non-empty string');
        }
        if (typeof method !== 'function') {
            throw new Error('Prototype method must be a function');
        }
        this._prototypeMethods.set(name, method);
    },
    /**
   * Add a static method to the Mongo.Collection constructor
   */ addStaticMethod (name, method) {
        if (typeof name !== 'string' || !name) {
            throw new Error('Static method name must be a non-empty string');
        }
        if (typeof method !== 'function') {
            throw new Error('Static method must be a function');
        }
        this._staticMethods.set(name, method);
    },
    /**
   * Remove an extension (useful for testing)
   */ removeExtension (extension) {
        const index = this._extensions.indexOf(extension);
        if (index > -1) {
            this._extensions.splice(index, 1);
        }
    },
    /**
   * Remove a prototype method
   */ removePrototypeMethod (name) {
        this._prototypeMethods.delete(name);
    },
    /**
   * Remove a static method
   */ removeStaticMethod (name) {
        this._staticMethods.delete(name);
    },
    /**
   * Clear all extensions (useful for testing)
   */ clearExtensions () {
        this._extensions.length = 0;
        this._prototypeMethods.clear();
        this._staticMethods.clear();
    },
    /**
   * Get all registered extensions (useful for debugging)
   */ getExtensions () {
        return [
            ...this._extensions
        ];
    },
    /**
   * Get all registered prototype methods (useful for debugging)
   */ getPrototypeMethods () {
        return new Map(this._prototypeMethods);
    },
    /**
   * Get all registered static methods (useful for debugging)
   */ getStaticMethods () {
        return new Map(this._staticMethods);
    },
    /**
   * Apply all extensions to a collection instance
   * Called during collection construction
   */ _applyExtensions (instance, name, options) {
        // Apply constructor extensions
        for (const extension of this._extensions){
            try {
                extension.call(instance, name, options);
            } catch (error) {
                // Provide helpful error context
                throw new Error(`Extension failed for collection '${name}': ${error.message}`);
            }
        }
        // Apply prototype methods
        for (const [methodName, method] of this._prototypeMethods){
            instance[methodName] = method.bind(instance);
        }
    },
    /**
   * Apply static methods to the Mongo.Collection constructor
   * Called during package initialization
   */ _applyStaticMethods (CollectionConstructor) {
        for (const [methodName, method] of this._staticMethods){
            CollectionConstructor[methodName] = method;
        }
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"collection.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/collection/collection.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _async_to_generator;module.link("@swc/helpers/_/_async_to_generator",{_(v){_async_to_generator=v}},0);let _object_spread;module.link("@swc/helpers/_/_object_spread",{_(v){_object_spread=v}},1);let normalizeProjection;module.link("../mongo_utils",{normalizeProjection(v){normalizeProjection=v}},2);let AsyncMethods;module.link('./methods_async',{AsyncMethods(v){AsyncMethods=v}},3);let SyncMethods;module.link('./methods_sync',{SyncMethods(v){SyncMethods=v}},4);let IndexMethods;module.link('./methods_index',{IndexMethods(v){IndexMethods=v}},5);let ID_GENERATORS,normalizeOptions,setupAutopublish,setupConnection,setupDriver,setupMutationMethods,validateCollectionName;module.link('./collection_utils',{ID_GENERATORS(v){ID_GENERATORS=v},normalizeOptions(v){normalizeOptions=v},setupAutopublish(v){setupAutopublish=v},setupConnection(v){setupConnection=v},setupDriver(v){setupDriver=v},setupMutationMethods(v){setupMutationMethods=v},validateCollectionName(v){validateCollectionName=v}},6);let ReplicationMethods;module.link('./methods_replication',{ReplicationMethods(v){ReplicationMethods=v}},7);







/**
 * @summary Namespace for MongoDB-related items
 * @namespace
 */ Mongo = {};
/**
 * @summary Constructor for a Collection
 * @locus Anywhere
 * @instancename collection
 * @class
 * @param {String} name The name of the collection.  If null, creates an unmanaged (unsynchronized) local collection.
 * @param {Object} [options]
 * @param {Object} options.connection The server connection that will manage this collection. Uses the default connection if not specified.  Pass the return value of calling [`DDP.connect`](#DDP-connect) to specify a different server. Pass `null` to specify no connection. Unmanaged (`name` is null) collections cannot specify a connection.
 * @param {String} options.idGeneration The method of generating the `_id` fields of new documents in this collection.  Possible values:

 - **`'STRING'`**: random strings
 - **`'MONGO'`**:  random [`Mongo.ObjectID`](#mongo_object_id) values

The default id generation technique is `'STRING'`.
 * @param {Function} options.transform An optional transformation function. Documents will be passed through this function before being returned from `fetch` or `findOneAsync`, and before being passed to callbacks of `observe`, `map`, `forEach`, `allow`, and `deny`. Transforms are *not* applied for the callbacks of `observeChanges` or to cursors returned from publish functions.
 * @param {Boolean} options.defineMutationMethods Set to `false` to skip setting up the mutation methods that enable insert/update/remove from client code. Default `true`.
 */ // Main Collection constructor
Mongo.Collection = function Collection(name, options) {
    var _ID_GENERATORS_options_idGeneration;
    name = validateCollectionName(name);
    options = normalizeOptions(options);
    this._makeNewID = (_ID_GENERATORS_options_idGeneration = ID_GENERATORS[options.idGeneration]) === null || _ID_GENERATORS_options_idGeneration === void 0 ? void 0 : _ID_GENERATORS_options_idGeneration.call(ID_GENERATORS, name);
    this._transform = LocalCollection.wrapTransform(options.transform);
    this.resolverType = options.resolverType;
    this._connection = setupConnection(name, options);
    const driver = setupDriver(name, this._connection, options);
    this._driver = driver;
    this._collection = driver.open(name, this._connection);
    this._name = name;
    this._settingUpReplicationPromise = this._maybeSetUpReplication(name, options);
    setupMutationMethods(this, name, options);
    setupAutopublish(this, name, options);
    Mongo._collections.set(name, this);
    // Apply collection extensions
    CollectionExtensions._applyExtensions(this, name, options);
};
// Apply static methods to the Collection constructor
CollectionExtensions._applyStaticMethods(Mongo.Collection);
Object.assign(Mongo.Collection.prototype, {
    _getFindSelector (args) {
        if (args.length == 0) return {};
        else return args[0];
    },
    _getFindOptions (args) {
        const [, options] = args || [];
        const newOptions = normalizeProjection(options);
        var self = this;
        if (args.length < 2) {
            return {
                transform: self._transform
            };
        } else {
            check(newOptions, Match.Optional(Match.ObjectIncluding({
                projection: Match.Optional(Match.OneOf(Object, undefined)),
                sort: Match.Optional(Match.OneOf(Object, Array, Function, undefined)),
                limit: Match.Optional(Match.OneOf(Number, undefined)),
                skip: Match.Optional(Match.OneOf(Number, undefined))
            })));
            return _object_spread({
                transform: self._transform
            }, newOptions);
        }
    }
});
Object.assign(Mongo.Collection, {
    _publishCursor (cursor, sub, collection) {
        return _async_to_generator(function*() {
            var observeHandle = yield cursor.observeChanges({
                added: function(id, fields) {
                    sub.added(collection, id, fields);
                },
                changed: function(id, fields) {
                    sub.changed(collection, id, fields);
                },
                removed: function(id) {
                    sub.removed(collection, id);
                }
            }, // Publications don't mutate the documents
            // This is tested by the `livedata - publish callbacks clone` test
            {
                nonMutatingCallbacks: true
            });
            // We don't call sub.ready() here: it gets called in livedata_server, after
            // possibly calling _publishCursor on multiple returned cursors.
            // register stop callback (expects lambda w/ no args).
            sub.onStop(function() {
                return _async_to_generator(function*() {
                    return yield observeHandle.stop();
                })();
            });
            // return the observeHandle in case it needs to be stopped early
            return observeHandle;
        })();
    },
    // protect against dangerous selectors.  falsey and {_id: falsey} are both
    // likely programmer error, and not what you want, particularly for destructive
    // operations. If a falsey _id is sent in, a new string _id will be
    // generated and returned; if a fallbackId is provided, it will be returned
    // instead.
    _rewriteSelector (selector, { fallbackId } = {}) {
        // shorthand -- scalars match _id
        if (LocalCollection._selectorIsId(selector)) selector = {
            _id: selector
        };
        if (Array.isArray(selector)) {
            // This is consistent with the Mongo console itself; if we don't do this
            // check passing an empty array ends up selecting all items
            throw new Error("Mongo selector can't be an array.");
        }
        if (!selector || '_id' in selector && !selector._id) {
            // can't match anything
            return {
                _id: fallbackId || Random.id()
            };
        }
        return selector;
    },
    // Collection Extensions API - delegate to CollectionExtensions
    /**
   * @summary Add a constructor extension function that runs when collections are created.
   * @locus Anywhere
   * @memberof Mongo.Collection
   * @static
   * @param {Function} extension Extension function called with (name, options) and 'this' bound to collection instance
   */ addExtension (extension) {
        return CollectionExtensions.addExtension(extension);
    },
    /**
   * @summary Add a prototype method to all collection instances.
   * @locus Anywhere
   * @memberof Mongo.Collection
   * @static
   * @param {String} name The name of the method to add
   * @param {Function} method The method function, bound to the collection instance
   */ addPrototypeMethod (name, method) {
        return CollectionExtensions.addPrototypeMethod(name, method);
    },
    /**
   * @summary Add a static method to the Mongo.Collection constructor.
   * @locus Anywhere
   * @memberof Mongo.Collection
   * @static
   * @param {String} name The name of the static method to add
   * @param {Function} method The static method function
   */ addStaticMethod (name, method) {
        return CollectionExtensions.addStaticMethod(name, method);
    },
    /**
   * @summary Remove a constructor extension (useful for testing).
   * @locus Anywhere
   * @memberof Mongo.Collection
   * @static
   * @param {Function} extension The extension function to remove
   */ removeExtension (extension) {
        return CollectionExtensions.removeExtension(extension);
    },
    /**
   * @summary Remove a prototype method from all collection instances.
   * @locus Anywhere
   * @memberof Mongo.Collection
   * @static
   * @param {String} name The name of the method to remove
   */ removePrototypeMethod (name) {
        return CollectionExtensions.removePrototypeMethod(name);
    },
    /**
   * @summary Remove a static method from the Mongo.Collection constructor.
   * @locus Anywhere
   * @memberof Mongo.Collection
   * @static
   * @param {String} name The name of the static method to remove
   */ removeStaticMethod (name) {
        return CollectionExtensions.removeStaticMethod(name);
    },
    /**
   * @summary Clear all extensions, prototype methods, and static methods (useful for testing).
   * @locus Anywhere
   * @memberof Mongo.Collection
   * @static
   */ clearExtensions () {
        return CollectionExtensions.clearExtensions();
    },
    /**
   * @summary Get all registered constructor extensions (useful for debugging).
   * @locus Anywhere
   * @memberof Mongo.Collection
   * @static
   * @returns {Array<Function>} Array of registered extension functions
   */ getExtensions () {
        return CollectionExtensions.getExtensions();
    },
    /**
   * @summary Get all registered prototype methods (useful for debugging).
   * @locus Anywhere
   * @memberof Mongo.Collection
   * @static
   * @returns {Map<String, Function>} Map of method names to functions
   */ getPrototypeMethods () {
        return CollectionExtensions.getPrototypeMethods();
    },
    /**
   * @summary Get all registered static methods (useful for debugging).
   * @locus Anywhere
   * @memberof Mongo.Collection
   * @static
   * @returns {Map<String, Function>} Map of method names to functions
   */ getStaticMethods () {
        return CollectionExtensions.getStaticMethods();
    }
});
Object.assign(Mongo.Collection.prototype, ReplicationMethods, SyncMethods, AsyncMethods, IndexMethods);
Object.assign(Mongo.Collection.prototype, {
    // Determine if this collection is simply a minimongo representation of a real
    // database on another server
    _isRemoteCollection () {
        // XXX see #MeteorServerNull
        return this._connection && this._connection !== Meteor.server;
    },
    dropCollectionAsync () {
        return _async_to_generator(function*() {
            var self = this;
            if (!self._collection.dropCollectionAsync) throw new Error('Can only call dropCollectionAsync on server collections');
            yield self._collection.dropCollectionAsync();
        }).call(this);
    },
    createCappedCollectionAsync (byteSize, maxDocuments) {
        return _async_to_generator(function*() {
            var self = this;
            if (!(yield self._collection.createCappedCollectionAsync)) throw new Error('Can only call createCappedCollectionAsync on server collections');
            yield self._collection.createCappedCollectionAsync(byteSize, maxDocuments);
        }).call(this);
    },
    /**
   * @summary Returns the [`Collection`](http://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html) object corresponding to this collection from the [npm `mongodb` driver module](https://www.npmjs.com/package/mongodb) which is wrapped by `Mongo.Collection`.
   * @locus Server
   * @memberof Mongo.Collection
   * @instance
   */ rawCollection () {
        var self = this;
        if (!self._collection.rawCollection) {
            throw new Error('Can only call rawCollection on server collections');
        }
        return self._collection.rawCollection();
    },
    /**
   * @summary Returns the [`Db`](http://mongodb.github.io/node-mongodb-native/3.0/api/Db.html) object corresponding to this collection's database connection from the [npm `mongodb` driver module](https://www.npmjs.com/package/mongodb) which is wrapped by `Mongo.Collection`.
   * @locus Server
   * @memberof Mongo.Collection
   * @instance
   */ rawDatabase () {
        var self = this;
        if (!(self._driver.mongo && self._driver.mongo.db)) {
            throw new Error('Can only call rawDatabase on server collections');
        }
        return self._driver.mongo.db;
    }
});
Object.assign(Mongo, {
    /**
   * @summary Retrieve a Meteor collection instance by name. Only collections defined with [`new Mongo.Collection(...)`](#collections) are available with this method. For plain MongoDB collections, you'll want to look at [`rawDatabase()`](#Mongo-Collection-rawDatabase).
   * @locus Anywhere
   * @memberof Mongo
   * @static
   * @param {string} name Name of your collection as it was defined with `new Mongo.Collection()`.
   * @returns {Mongo.Collection | undefined}
   */ getCollection (name) {
        return this._collections.get(name);
    },
    /**
   * @summary A record of all defined Mongo.Collection instances, indexed by collection name.
   * @type {Map<string, Mongo.Collection>}
   * @memberof Mongo
   * @protected
   */ _collections: new Map(),
    /**
   * @summary Collection Extensions API
   * @memberof Mongo
   * @static
   */ CollectionExtensions: CollectionExtensions
});
/**
 * @summary Create a Mongo-style `ObjectID`.  If you don't specify a `hexString`, the `ObjectID` will be generated randomly (not using MongoDB's ID construction rules).
 * @locus Anywhere
 * @class
 * @param {String} [hexString] Optional.  The 24-character hexadecimal contents of the ObjectID to create
 */ Mongo.ObjectID = MongoID.ObjectID;
/**
 * @summary To create a cursor, use find. To access the documents in a cursor, use forEach, map, or fetch.
 * @class
 * @instanceName cursor
 */ Mongo.Cursor = LocalCollection.Cursor;
/**
 * @deprecated in 0.9.1
 */ Mongo.Collection.Cursor = Mongo.Cursor;
/**
 * @deprecated in 0.9.1
 */ Mongo.Collection.ObjectID = Mongo.ObjectID;
/**
 * @deprecated in 0.9.1
 */ Meteor.Collection = Mongo.Collection;
// Allow deny stuff is now in the allow-deny package
Object.assign(Mongo.Collection.prototype, AllowDeny.CollectionPrototype);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"collection_utils.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/collection/collection_utils.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({setupConnection:()=>setupConnection,setupDriver:()=>setupDriver,setupAutopublish:()=>setupAutopublish,setupMutationMethods:()=>setupMutationMethods,validateCollectionName:()=>validateCollectionName,normalizeOptions:()=>normalizeOptions});module.export({ID_GENERATORS:()=>ID_GENERATORS},true);let _object_spread;module.link("@swc/helpers/_/_object_spread",{_(v){_object_spread=v}},0);
const ID_GENERATORS = {
    MONGO (name) {
        return function() {
            const src = name ? DDP.randomStream('/collection/' + name) : Random.insecure;
            return new Mongo.ObjectID(src.hexString(24));
        };
    },
    STRING (name) {
        return function() {
            const src = name ? DDP.randomStream('/collection/' + name) : Random.insecure;
            return src.id();
        };
    }
};
function setupConnection(name, options) {
    if (!name || options.connection === null) return null;
    if (options.connection) return options.connection;
    return Meteor.isClient ? Meteor.connection : Meteor.server;
}
function setupDriver(name, connection, options) {
    if (options._driver) return options._driver;
    if (name && connection === Meteor.server && typeof MongoInternals !== 'undefined' && MongoInternals.defaultRemoteCollectionDriver) {
        return MongoInternals.defaultRemoteCollectionDriver();
    }
    const { LocalCollectionDriver } = require('../local_collection_driver.js');
    return LocalCollectionDriver;
}
function setupAutopublish(collection, name, options) {
    if (Package.autopublish && !options._preventAutopublish && collection._connection && collection._connection.publish) {
        collection._connection.publish(null, ()=>collection.find(), {
            is_auto: true
        });
    }
}
function setupMutationMethods(collection, name, options) {
    if (options.defineMutationMethods === false) return;
    try {
        collection._defineMutationMethods({
            useExisting: options._suppressSameNameError === true
        });
    } catch (error) {
        if (error.message === `A method named '/${name}/insertAsync' is already defined`) {
            throw new Error(`There is already a collection named "${name}"`);
        }
        throw error;
    }
}
function validateCollectionName(name) {
    if (!name && name !== null) {
        Meteor._debug('Warning: creating anonymous collection. It will not be ' + 'saved or synchronized over the network. (Pass null for ' + 'the collection name to turn off this warning.)');
        name = null;
    }
    if (name !== null && typeof name !== 'string') {
        throw new Error('First argument to new Mongo.Collection must be a string or null');
    }
    return name;
}
function normalizeOptions(options) {
    if (options && options.methods) {
        // Backwards compatibility hack with original signature
        options = {
            connection: options
        };
    }
    // Backwards compatibility: "connection" used to be called "manager".
    if (options && options.manager && !options.connection) {
        options.connection = options.manager;
    }
    const cleanedOptions = Object.fromEntries(Object.entries(options || {}).filter(([_, v])=>v !== undefined));
    // 2) Spread defaults first, then only the defined overrides
    return _object_spread({
        connection: undefined,
        idGeneration: 'STRING',
        transform: null,
        _driver: undefined,
        _preventAutopublish: false
    }, cleanedOptions);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods_async.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/collection/methods_async.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({AsyncMethods:()=>AsyncMethods},true);let _async_to_generator;module.link("@swc/helpers/_/_async_to_generator",{_(v){_async_to_generator=v}},0);let _object_spread;module.link("@swc/helpers/_/_object_spread",{_(v){_object_spread=v}},1);let _object_spread_props;module.link("@swc/helpers/_/_object_spread_props",{_(v){_object_spread_props=v}},2);


const AsyncMethods = {
    /**
   * @summary Finds the first document that matches the selector, as ordered by sort and skip options. Returns `undefined` if no matching document is found.
   * @locus Anywhere
   * @method findOneAsync
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} [selector] A query describing the documents to find
   * @param {Object} [options]
   * @param {MongoSortSpecifier} options.sort Sort order (default: natural order)
   * @param {Number} options.skip Number of results to skip at the beginning
   * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
   * @param {Boolean} options.reactive (Client only) Default true; pass false to disable reactivity
   * @param {Function} options.transform Overrides `transform` on the [`Collection`](#collections) for this cursor.  Pass `null` to disable transformation.
   * @param {String} options.readPreference (Server only) Specifies a custom MongoDB [`readPreference`](https://docs.mongodb.com/manual/core/read-preference) for fetching the document. Possible values are `primary`, `primaryPreferred`, `secondary`, `secondaryPreferred` and `nearest`.
   * @returns {Object}
   */ findOneAsync (...args) {
        return this._collection.findOneAsync(this._getFindSelector(args), this._getFindOptions(args));
    },
    _insertAsync (doc, options = {}) {
        // Make sure we were passed a document to insert
        if (!doc) {
            throw new Error('insert requires an argument');
        }
        // Make a shallow clone of the document, preserving its prototype.
        doc = Object.create(Object.getPrototypeOf(doc), Object.getOwnPropertyDescriptors(doc));
        if ('_id' in doc) {
            if (!doc._id || !(typeof doc._id === 'string' || doc._id instanceof Mongo.ObjectID)) {
                throw new Error('Meteor requires document _id fields to be non-empty strings or ObjectIDs');
            }
        } else {
            let generateId = true;
            // Don't generate the id if we're the client and the 'outermost' call
            // This optimization saves us passing both the randomSeed and the id
            // Passing both is redundant.
            if (this._isRemoteCollection()) {
                const enclosing = DDP._CurrentMethodInvocation.get();
                if (!enclosing) {
                    generateId = false;
                }
            }
            if (generateId) {
                doc._id = this._makeNewID();
            }
        }
        // On inserts, always return the id that we generated; on all other
        // operations, just return the result from the collection.
        var chooseReturnValueFromCollectionResult = function(result) {
            if (Meteor._isPromise(result)) return result;
            if (doc._id) {
                return doc._id;
            }
            // XXX what is this for??
            // It's some iteraction between the callback to _callMutatorMethod and
            // the return value conversion
            doc._id = result;
            return result;
        };
        if (this._isRemoteCollection()) {
            const promise = this._callMutatorMethodAsync('insertAsync', [
                doc
            ], options);
            promise.then(chooseReturnValueFromCollectionResult);
            promise.stubPromise = promise.stubPromise.then(chooseReturnValueFromCollectionResult);
            promise.serverPromise = promise.serverPromise.then(chooseReturnValueFromCollectionResult);
            return promise;
        }
        // it's my collection.  descend into the collection object
        // and propagate any exception.
        return this._collection.insertAsync(doc).then(chooseReturnValueFromCollectionResult);
    },
    /**
   * @summary Insert a document in the collection.  Returns a promise that will return the document's unique _id when solved.
   * @locus Anywhere
   * @method  insert
   * @memberof Mongo.Collection
   * @instance
   * @param {Object} doc The document to insert. May not yet have an _id attribute, in which case Meteor will generate one for you.
   */ insertAsync (doc, options) {
        return this._insertAsync(doc, options);
    },
    /**
   * @summary Modify one or more documents in the collection. Returns the number of matched documents.
   * @locus Anywhere
   * @method update
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} selector Specifies which documents to modify
   * @param {MongoModifier} modifier Specifies how to modify the documents
   * @param {Object} [options]
   * @param {Boolean} options.multi True to modify all matching documents; false to only modify one of the matching documents (the default).
   * @param {Boolean} options.upsert True to insert a document if no matching documents are found.
   * @param {Array} options.arrayFilters Optional. Used in combination with MongoDB [filtered positional operator](https://docs.mongodb.com/manual/reference/operator/update/positional-filtered/) to specify which elements to modify in an array field.
   */ updateAsync (selector, modifier, ...optionsAndCallback) {
        // We've already popped off the callback, so we are left with an array
        // of one or zero items
        const options = _object_spread({}, optionsAndCallback[0] || null);
        let insertedId;
        if (options && options.upsert) {
            // set `insertedId` if absent.  `insertedId` is a Meteor extension.
            if (options.insertedId) {
                if (!(typeof options.insertedId === 'string' || options.insertedId instanceof Mongo.ObjectID)) throw new Error('insertedId must be string or ObjectID');
                insertedId = options.insertedId;
            } else if (!selector || !selector._id) {
                insertedId = this._makeNewID();
                options.generatedId = true;
                options.insertedId = insertedId;
            }
        }
        selector = Mongo.Collection._rewriteSelector(selector, {
            fallbackId: insertedId
        });
        if (this._isRemoteCollection()) {
            const args = [
                selector,
                modifier,
                options
            ];
            return this._callMutatorMethodAsync('updateAsync', args, options);
        }
        // it's my collection.  descend into the collection object
        // and propagate any exception.
        // If the user provided a callback and the collection implements this
        // operation asynchronously, then queryRet will be undefined, and the
        // result will be returned through the callback instead.
        return this._collection.updateAsync(selector, modifier, options);
    },
    /**
   * @summary Asynchronously removes documents from the collection.
   * @locus Anywhere
   * @method remove
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} selector Specifies which documents to remove
   */ removeAsync (selector, options = {}) {
        selector = Mongo.Collection._rewriteSelector(selector);
        if (this._isRemoteCollection()) {
            return this._callMutatorMethodAsync('removeAsync', [
                selector
            ], options);
        }
        // it's my collection.  descend into the collection1 object
        // and propagate any exception.
        return this._collection.removeAsync(selector);
    },
    /**
   * @summary Asynchronously modifies one or more documents in the collection, or insert one if no matching documents were found. Returns an object with keys `numberAffected` (the number of documents modified)  and `insertedId` (the unique _id of the document that was inserted, if any).
   * @locus Anywhere
   * @method upsert
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} selector Specifies which documents to modify
   * @param {MongoModifier} modifier Specifies how to modify the documents
   * @param {Object} [options]
   * @param {Boolean} options.multi True to modify all matching documents; false to only modify one of the matching documents (the default).
   */ upsertAsync (selector, modifier, options) {
        return _async_to_generator(function*() {
            return this.updateAsync(selector, modifier, _object_spread_props(_object_spread({}, options), {
                _returnObject: true,
                upsert: true
            }));
        }).call(this);
    },
    /**
   * @summary Gets the number of documents matching the filter. For a fast count of the total documents in a collection see `estimatedDocumentCount`.
   * @locus Anywhere
   * @method countDocuments
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} [selector] A query describing the documents to count
   * @param {Object} [options] All options are listed in [MongoDB documentation](https://mongodb.github.io/node-mongodb-native/4.11/interfaces/CountDocumentsOptions.html). Please note that not all of them are available on the client.
   * @returns {Promise<number>}
   */ countDocuments (...args) {
        return this._collection.countDocuments(...args);
    },
    /**
   * @summary Gets an estimate of the count of documents in a collection using collection metadata. For an exact count of the documents in a collection see `countDocuments`.
   * @locus Anywhere
   * @method estimatedDocumentCount
   * @memberof Mongo.Collection
   * @instance
   * @param {Object} [options] All options are listed in [MongoDB documentation](https://mongodb.github.io/node-mongodb-native/4.11/interfaces/EstimatedDocumentCountOptions.html). Please note that not all of them are available on the client.
   * @returns {Promise<number>}
   */ estimatedDocumentCount (...args) {
        return this._collection.estimatedDocumentCount(...args);
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods_index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/collection/methods_index.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({IndexMethods:()=>IndexMethods},true);let _async_to_generator;module.link("@swc/helpers/_/_async_to_generator",{_(v){_async_to_generator=v}},0);let Log;module.link('meteor/logging',{Log(v){Log=v}},1);

const IndexMethods = {
    // We'll actually design an index API later. For now, we just pass through to
    // Mongo's, but make it synchronous.
    /**
   * @summary Asynchronously creates the specified index on the collection.
   * @locus server
   * @method ensureIndexAsync
   * @deprecated in 3.0
   * @memberof Mongo.Collection
   * @instance
   * @param {Object} index A document that contains the field and value pairs where the field is the index key and the value describes the type of index for that field. For an ascending index on a field, specify a value of `1`; for descending index, specify a value of `-1`. Use `text` for text indexes.
   * @param {Object} [options] All options are listed in [MongoDB documentation](https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/#options)
   * @param {String} options.name Name of the index
   * @param {Boolean} options.unique Define that the index values must be unique, more at [MongoDB documentation](https://docs.mongodb.com/manual/core/index-unique/)
   * @param {Boolean} options.sparse Define that the index is sparse, more at [MongoDB documentation](https://docs.mongodb.com/manual/core/index-sparse/)
   */ ensureIndexAsync (index, options) {
        return _async_to_generator(function*() {
            var self = this;
            if (!self._collection.ensureIndexAsync || !self._collection.createIndexAsync) throw new Error('Can only call createIndexAsync on server collections');
            if (self._collection.createIndexAsync) {
                yield self._collection.createIndexAsync(index, options);
            } else {
                Log.debug(`ensureIndexAsync has been deprecated, please use the new 'createIndexAsync' instead${(options === null || options === void 0 ? void 0 : options.name) ? `, index name: ${options.name}` : `, index: ${JSON.stringify(index)}`}`);
                yield self._collection.ensureIndexAsync(index, options);
            }
        }).call(this);
    },
    /**
   * @summary Asynchronously creates the specified index on the collection.
   * @locus server
   * @method createIndexAsync
   * @memberof Mongo.Collection
   * @instance
   * @param {Object} index A document that contains the field and value pairs where the field is the index key and the value describes the type of index for that field. For an ascending index on a field, specify a value of `1`; for descending index, specify a value of `-1`. Use `text` for text indexes.
   * @param {Object} [options] All options are listed in [MongoDB documentation](https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/#options)
   * @param {String} options.name Name of the index
   * @param {Boolean} options.unique Define that the index values must be unique, more at [MongoDB documentation](https://docs.mongodb.com/manual/core/index-unique/)
   * @param {Boolean} options.sparse Define that the index is sparse, more at [MongoDB documentation](https://docs.mongodb.com/manual/core/index-sparse/)
   */ createIndexAsync (index, options) {
        return _async_to_generator(function*() {
            var self = this;
            if (!self._collection.createIndexAsync) throw new Error('Can only call createIndexAsync on server collections');
            try {
                yield self._collection.createIndexAsync(index, options);
            } catch (e) {
                var _Meteor_settings_packages_mongo, _Meteor_settings_packages, _Meteor_settings;
                if (e.message.includes('An equivalent index already exists with the same name but different options.') && ((_Meteor_settings = Meteor.settings) === null || _Meteor_settings === void 0 ? void 0 : (_Meteor_settings_packages = _Meteor_settings.packages) === null || _Meteor_settings_packages === void 0 ? void 0 : (_Meteor_settings_packages_mongo = _Meteor_settings_packages.mongo) === null || _Meteor_settings_packages_mongo === void 0 ? void 0 : _Meteor_settings_packages_mongo.reCreateIndexOnOptionMismatch)) {
                    Log.info(`Re-creating index ${index} for ${self._name} due to options mismatch.`);
                    yield self._collection.dropIndexAsync(index);
                    yield self._collection.createIndexAsync(index, options);
                } else {
                    console.error(e);
                    throw new Meteor.Error(`An error occurred when creating an index for collection "${self._name}: ${e.message}`);
                }
            }
        }).call(this);
    },
    /**
   * @summary Asynchronously creates the specified index on the collection.
   * @locus server
   * @method createIndex
   * @memberof Mongo.Collection
   * @instance
   * @param {Object} index A document that contains the field and value pairs where the field is the index key and the value describes the type of index for that field. For an ascending index on a field, specify a value of `1`; for descending index, specify a value of `-1`. Use `text` for text indexes.
   * @param {Object} [options] All options are listed in [MongoDB documentation](https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/#options)
   * @param {String} options.name Name of the index
   * @param {Boolean} options.unique Define that the index values must be unique, more at [MongoDB documentation](https://docs.mongodb.com/manual/core/index-unique/)
   * @param {Boolean} options.sparse Define that the index is sparse, more at [MongoDB documentation](https://docs.mongodb.com/manual/core/index-sparse/)
   */ createIndex (index, options) {
        return this.createIndexAsync(index, options);
    },
    dropIndexAsync (index) {
        return _async_to_generator(function*() {
            var self = this;
            if (!self._collection.dropIndexAsync) throw new Error('Can only call dropIndexAsync on server collections');
            yield self._collection.dropIndexAsync(index);
        }).call(this);
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods_replication.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/collection/methods_replication.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({ReplicationMethods:()=>ReplicationMethods},true);let _async_to_generator;module.link("@swc/helpers/_/_async_to_generator",{_(v){_async_to_generator=v}},0);let _object_spread;module.link("@swc/helpers/_/_object_spread",{_(v){_object_spread=v}},1);

const ReplicationMethods = {
    _maybeSetUpReplication (name) {
        return _async_to_generator(function*() {
            var _registerStoreResult_then;
            const self = this;
            if (!(self._connection && self._connection.registerStoreClient && self._connection.registerStoreServer)) {
                return;
            }
            const wrappedStoreCommon = {
                // Called around method stub invocations to capture the original versions
                // of modified documents.
                saveOriginals () {
                    self._collection.saveOriginals();
                },
                retrieveOriginals () {
                    return self._collection.retrieveOriginals();
                },
                // To be able to get back to the collection from the store.
                _getCollection () {
                    return self;
                }
            };
            const wrappedStoreClient = _object_spread({
                // Called at the beginning of a batch of updates. batchSize is the number
                // of update calls to expect.
                //
                // XXX This interface is pretty janky. reset probably ought to go back to
                // being its own function, and callers shouldn't have to calculate
                // batchSize. The optimization of not calling pause/remove should be
                // delayed until later: the first call to update() should buffer its
                // message, and then we can either directly apply it at endUpdate time if
                // it was the only update, or do pauseObservers/apply/apply at the next
                // update() if there's another one.
                beginUpdate (batchSize, reset) {
                    return _async_to_generator(function*() {
                        // pause observers so users don't see flicker when updating several
                        // objects at once (including the post-reconnect reset-and-reapply
                        // stage), and so that a re-sorting of a query can take advantage of the
                        // full _diffQuery moved calculation instead of applying change one at a
                        // time.
                        if (batchSize > 1 || reset) self._collection.pauseObservers();
                        if (reset) yield self._collection.remove({});
                    })();
                },
                // Apply an update.
                // XXX better specify this interface (not in terms of a wire message)?
                update (msg) {
                    var mongoId = MongoID.idParse(msg.id);
                    var doc = self._collection._docs.get(mongoId);
                    //When the server's mergebox is disabled for a collection, the client must gracefully handle it when:
                    // *We receive an added message for a document that is already there. Instead, it will be changed
                    // *We reeive a change message for a document that is not there. Instead, it will be added
                    // *We receive a removed messsage for a document that is not there. Instead, noting wil happen.
                    //Code is derived from client-side code originally in peerlibrary:control-mergebox
                    //https://github.com/peerlibrary/meteor-control-mergebox/blob/master/client.coffee
                    //For more information, refer to discussion "Initial support for publication strategies in livedata server":
                    //https://github.com/meteor/meteor/pull/11151
                    if (Meteor.isClient) {
                        if (msg.msg === 'added' && doc) {
                            msg.msg = 'changed';
                        } else if (msg.msg === 'removed' && !doc) {
                            return;
                        } else if (msg.msg === 'changed' && !doc) {
                            msg.msg = 'added';
                            const _ref = msg.fields;
                            for(let field in _ref){
                                const value = _ref[field];
                                if (value === void 0) {
                                    delete msg.fields[field];
                                }
                            }
                        }
                    }
                    // Is this a "replace the whole doc" message coming from the quiescence
                    // of method writes to an object? (Note that 'undefined' is a valid
                    // value meaning "remove it".)
                    if (msg.msg === 'replace') {
                        var replace = msg.replace;
                        if (!replace) {
                            if (doc) self._collection.remove(mongoId);
                        } else if (!doc) {
                            self._collection.insert(replace);
                        } else {
                            // XXX check that replace has no $ ops
                            self._collection.update(mongoId, replace);
                        }
                        return;
                    } else if (msg.msg === 'added') {
                        if (doc) {
                            throw new Error('Expected not to find a document already present for an add');
                        }
                        self._collection.insert(_object_spread({
                            _id: mongoId
                        }, msg.fields));
                    } else if (msg.msg === 'removed') {
                        if (!doc) throw new Error('Expected to find a document already present for removed');
                        self._collection.remove(mongoId);
                    } else if (msg.msg === 'changed') {
                        if (!doc) throw new Error('Expected to find a document to change');
                        const keys = Object.keys(msg.fields);
                        if (keys.length > 0) {
                            var modifier = {};
                            keys.forEach((key)=>{
                                const value = msg.fields[key];
                                if (EJSON.equals(doc[key], value)) {
                                    return;
                                }
                                if (typeof value === 'undefined') {
                                    if (!modifier.$unset) {
                                        modifier.$unset = {};
                                    }
                                    modifier.$unset[key] = 1;
                                } else {
                                    if (!modifier.$set) {
                                        modifier.$set = {};
                                    }
                                    modifier.$set[key] = value;
                                }
                            });
                            if (Object.keys(modifier).length > 0) {
                                self._collection.update(mongoId, modifier);
                            }
                        }
                    } else {
                        throw new Error("I don't know how to deal with this message");
                    }
                },
                // Called at the end of a batch of updates.livedata_connection.js:1287
                endUpdate () {
                    self._collection.resumeObserversClient();
                },
                // Used to preserve current versions of documents across a store reset.
                getDoc (id) {
                    return self.findOne(id);
                }
            }, wrappedStoreCommon);
            const wrappedStoreServer = _object_spread({
                beginUpdate (batchSize, reset) {
                    return _async_to_generator(function*() {
                        if (batchSize > 1 || reset) self._collection.pauseObservers();
                        if (reset) yield self._collection.removeAsync({});
                    })();
                },
                update (msg) {
                    return _async_to_generator(function*() {
                        var mongoId = MongoID.idParse(msg.id);
                        var doc = self._collection._docs.get(mongoId);
                        // Is this a "replace the whole doc" message coming from the quiescence
                        // of method writes to an object? (Note that 'undefined' is a valid
                        // value meaning "remove it".)
                        if (msg.msg === 'replace') {
                            var replace = msg.replace;
                            if (!replace) {
                                if (doc) yield self._collection.removeAsync(mongoId);
                            } else if (!doc) {
                                yield self._collection.insertAsync(replace);
                            } else {
                                // XXX check that replace has no $ ops
                                yield self._collection.updateAsync(mongoId, replace);
                            }
                            return;
                        } else if (msg.msg === 'added') {
                            if (doc) {
                                throw new Error('Expected not to find a document already present for an add');
                            }
                            yield self._collection.insertAsync(_object_spread({
                                _id: mongoId
                            }, msg.fields));
                        } else if (msg.msg === 'removed') {
                            if (!doc) throw new Error('Expected to find a document already present for removed');
                            yield self._collection.removeAsync(mongoId);
                        } else if (msg.msg === 'changed') {
                            if (!doc) throw new Error('Expected to find a document to change');
                            const keys = Object.keys(msg.fields);
                            if (keys.length > 0) {
                                var modifier = {};
                                keys.forEach((key)=>{
                                    const value = msg.fields[key];
                                    if (EJSON.equals(doc[key], value)) {
                                        return;
                                    }
                                    if (typeof value === 'undefined') {
                                        if (!modifier.$unset) {
                                            modifier.$unset = {};
                                        }
                                        modifier.$unset[key] = 1;
                                    } else {
                                        if (!modifier.$set) {
                                            modifier.$set = {};
                                        }
                                        modifier.$set[key] = value;
                                    }
                                });
                                if (Object.keys(modifier).length > 0) {
                                    yield self._collection.updateAsync(mongoId, modifier);
                                }
                            }
                        } else {
                            throw new Error("I don't know how to deal with this message");
                        }
                    })();
                },
                // Called at the end of a batch of updates.
                endUpdate () {
                    return _async_to_generator(function*() {
                        yield self._collection.resumeObserversServer();
                    })();
                },
                // Used to preserve current versions of documents across a store reset.
                getDoc (id) {
                    return _async_to_generator(function*() {
                        return self.findOneAsync(id);
                    })();
                }
            }, wrappedStoreCommon);
            // OK, we're going to be a slave, replicating some remote
            // database, except possibly with some temporary divergence while
            // we have unacknowledged RPC's.
            let registerStoreResult;
            if (Meteor.isClient) {
                registerStoreResult = self._connection.registerStoreClient(name, wrappedStoreClient);
            } else {
                registerStoreResult = self._connection.registerStoreServer(name, wrappedStoreServer);
            }
            const message = `There is already a collection named "${name}"`;
            const logWarn = ()=>{
                console.warn ? console.warn(message) : console.log(message);
            };
            if (!registerStoreResult) {
                return logWarn();
            }
            return registerStoreResult === null || registerStoreResult === void 0 ? void 0 : (_registerStoreResult_then = registerStoreResult.then) === null || _registerStoreResult_then === void 0 ? void 0 : _registerStoreResult_then.call(registerStoreResult, (ok)=>{
                if (!ok) {
                    logWarn();
                }
            });
        }).call(this);
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods_sync.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/collection/methods_sync.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({SyncMethods:()=>SyncMethods},true);let _object_spread;module.link("@swc/helpers/_/_object_spread",{_(v){_object_spread=v}},0);let _object_spread_props;module.link("@swc/helpers/_/_object_spread_props",{_(v){_object_spread_props=v}},1);

const SyncMethods = {
    /**
   * @summary Find the documents in a collection that match the selector.
   * @locus Anywhere
   * @method find
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} [selector] A query describing the documents to find
   * @param {Object} [options]
   * @param {MongoSortSpecifier} options.sort Sort order (default: natural order)
   * @param {Number} options.skip Number of results to skip at the beginning
   * @param {Number} options.limit Maximum number of results to return
   * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
   * @param {Boolean} options.reactive (Client only) Default `true`; pass `false` to disable reactivity
   * @param {Function} options.transform Overrides `transform` on the  [`Collection`](#collections) for this cursor.  Pass `null` to disable transformation.
   * @param {Boolean} options.disableOplog (Server only) Pass true to disable oplog-tailing on this query. This affects the way server processes calls to `observe` on this query. Disabling the oplog can be useful when working with data that updates in large batches.
   * @param {Number} options.pollingIntervalMs (Server only) When oplog is disabled (through the use of `disableOplog` or when otherwise not available), the frequency (in milliseconds) of how often to poll this query when observing on the server. Defaults to 10000ms (10 seconds).
   * @param {Number} options.pollingThrottleMs (Server only) When oplog is disabled (through the use of `disableOplog` or when otherwise not available), the minimum time (in milliseconds) to allow between re-polling when observing on the server. Increasing this will save CPU and mongo load at the expense of slower updates to users. Decreasing this is not recommended. Defaults to 50ms.
   * @param {Number} options.maxTimeMs (Server only) If set, instructs MongoDB to set a time limit for this cursor's operations. If the operation reaches the specified time limit (in milliseconds) without the having been completed, an exception will be thrown. Useful to prevent an (accidental or malicious) unoptimized query from causing a full collection scan that would disrupt other database users, at the expense of needing to handle the resulting error.
   * @param {String|Object} options.hint (Server only) Overrides MongoDB's default index selection and query optimization process. Specify an index to force its use, either by its name or index specification. You can also specify `{ $natural : 1 }` to force a forwards collection scan, or `{ $natural : -1 }` for a reverse collection scan. Setting this is only recommended for advanced users.
   * @param {String} options.readPreference (Server only) Specifies a custom MongoDB [`readPreference`](https://docs.mongodb.com/manual/core/read-preference) for this particular cursor. Possible values are `primary`, `primaryPreferred`, `secondary`, `secondaryPreferred` and `nearest`.
   * @returns {Mongo.Cursor}
   */ find (...args) {
        // Collection.find() (return all docs) behaves differently
        // from Collection.find(undefined) (return 0 docs).  so be
        // careful about the length of arguments.
        return this._collection.find(this._getFindSelector(args), this._getFindOptions(args));
    },
    /**
   * @summary Finds the first document that matches the selector, as ordered by sort and skip options. Returns `undefined` if no matching document is found.
   * @locus Anywhere
   * @method findOne
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} [selector] A query describing the documents to find
   * @param {Object} [options]
   * @param {MongoSortSpecifier} options.sort Sort order (default: natural order)
   * @param {Number} options.skip Number of results to skip at the beginning
   * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
   * @param {Boolean} options.reactive (Client only) Default true; pass false to disable reactivity
   * @param {Function} options.transform Overrides `transform` on the [`Collection`](#collections) for this cursor.  Pass `null` to disable transformation.
   * @param {String} options.readPreference (Server only) Specifies a custom MongoDB [`readPreference`](https://docs.mongodb.com/manual/core/read-preference) for fetching the document. Possible values are `primary`, `primaryPreferred`, `secondary`, `secondaryPreferred` and `nearest`.
   * @returns {Object}
   */ findOne (...args) {
        return this._collection.findOne(this._getFindSelector(args), this._getFindOptions(args));
    },
    // 'insert' immediately returns the inserted document's new _id.
    // The others return values immediately if you are in a stub, an in-memory
    // unmanaged collection, or a mongo-backed collection and you don't pass a
    // callback. 'update' and 'remove' return the number of affected
    // documents. 'upsert' returns an object with keys 'numberAffected' and, if an
    // insert happened, 'insertedId'.
    //
    // Otherwise, the semantics are exactly like other methods: they take
    // a callback as an optional last argument; if no callback is
    // provided, they block until the operation is complete, and throw an
    // exception if it fails; if a callback is provided, then they don't
    // necessarily block, and they call the callback when they finish with error and
    // result arguments.  (The insert method provides the document ID as its result;
    // update and remove provide the number of affected docs as the result; upsert
    // provides an object with numberAffected and maybe insertedId.)
    //
    // On the client, blocking is impossible, so if a callback
    // isn't provided, they just return immediately and any error
    // information is lost.
    //
    // There's one more tweak. On the client, if you don't provide a
    // callback, then if there is an error, a message will be logged with
    // Meteor._debug.
    //
    // The intent (though this is actually determined by the underlying
    // drivers) is that the operations should be done synchronously, not
    // generating their result until the database has acknowledged
    // them. In the future maybe we should provide a flag to turn this
    // off.
    _insert (doc, callback) {
        // Make sure we were passed a document to insert
        if (!doc) {
            throw new Error('insert requires an argument');
        }
        // Make a shallow clone of the document, preserving its prototype.
        doc = Object.create(Object.getPrototypeOf(doc), Object.getOwnPropertyDescriptors(doc));
        if ('_id' in doc) {
            if (!doc._id || !(typeof doc._id === 'string' || doc._id instanceof Mongo.ObjectID)) {
                throw new Error('Meteor requires document _id fields to be non-empty strings or ObjectIDs');
            }
        } else {
            let generateId = true;
            // Don't generate the id if we're the client and the 'outermost' call
            // This optimization saves us passing both the randomSeed and the id
            // Passing both is redundant.
            if (this._isRemoteCollection()) {
                const enclosing = DDP._CurrentMethodInvocation.get();
                if (!enclosing) {
                    generateId = false;
                }
            }
            if (generateId) {
                doc._id = this._makeNewID();
            }
        }
        // On inserts, always return the id that we generated; on all other
        // operations, just return the result from the collection.
        var chooseReturnValueFromCollectionResult = function(result) {
            if (Meteor._isPromise(result)) return result;
            if (doc._id) {
                return doc._id;
            }
            // XXX what is this for??
            // It's some iteraction between the callback to _callMutatorMethod and
            // the return value conversion
            doc._id = result;
            return result;
        };
        const wrappedCallback = wrapCallback(callback, chooseReturnValueFromCollectionResult);
        if (this._isRemoteCollection()) {
            const result = this._callMutatorMethod('insert', [
                doc
            ], wrappedCallback);
            return chooseReturnValueFromCollectionResult(result);
        }
        // it's my collection.  descend into the collection object
        // and propagate any exception.
        try {
            // If the user provided a callback and the collection implements this
            // operation asynchronously, then queryRet will be undefined, and the
            // result will be returned through the callback instead.
            let result;
            if (!!wrappedCallback) {
                this._collection.insert(doc, wrappedCallback);
            } else {
                // If we don't have the callback, we assume the user is using the promise.
                // We can't just pass this._collection.insert to the promisify because it would lose the context.
                result = this._collection.insert(doc);
            }
            return chooseReturnValueFromCollectionResult(result);
        } catch (e) {
            if (callback) {
                callback(e);
                return null;
            }
            throw e;
        }
    },
    /**
   * @summary Insert a document in the collection.  Returns its unique _id.
   * @locus Anywhere
   * @method  insert
   * @memberof Mongo.Collection
   * @instance
   * @param {Object} doc The document to insert. May not yet have an _id attribute, in which case Meteor will generate one for you.
   * @param {Function} [callback] Optional.  If present, called with an error object as the first argument and, if no error, the _id as the second.
   */ insert (doc, callback) {
        return this._insert(doc, callback);
    },
    /**
   * @summary Asynchronously modifies one or more documents in the collection. Returns the number of matched documents.
   * @locus Anywhere
   * @method update
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} selector Specifies which documents to modify
   * @param {MongoModifier} modifier Specifies how to modify the documents
   * @param {Object} [options]
   * @param {Boolean} options.multi True to modify all matching documents; false to only modify one of the matching documents (the default).
   * @param {Boolean} options.upsert True to insert a document if no matching documents are found.
   * @param {Array} options.arrayFilters Optional. Used in combination with MongoDB [filtered positional operator](https://docs.mongodb.com/manual/reference/operator/update/positional-filtered/) to specify which elements to modify in an array field.
   * @param {Function} [callback] Optional.  If present, called with an error object as the first argument and, if no error, the number of affected documents as the second.
   */ update (selector, modifier, ...optionsAndCallback) {
        const callback = popCallbackFromArgs(optionsAndCallback);
        // We've already popped off the callback, so we are left with an array
        // of one or zero items
        const options = _object_spread({}, optionsAndCallback[0] || null);
        let insertedId;
        if (options && options.upsert) {
            // set `insertedId` if absent.  `insertedId` is a Meteor extension.
            if (options.insertedId) {
                if (!(typeof options.insertedId === 'string' || options.insertedId instanceof Mongo.ObjectID)) throw new Error('insertedId must be string or ObjectID');
                insertedId = options.insertedId;
            } else if (!selector || !selector._id) {
                insertedId = this._makeNewID();
                options.generatedId = true;
                options.insertedId = insertedId;
            }
        }
        selector = Mongo.Collection._rewriteSelector(selector, {
            fallbackId: insertedId
        });
        const wrappedCallback = wrapCallback(callback);
        if (this._isRemoteCollection()) {
            const args = [
                selector,
                modifier,
                options
            ];
            return this._callMutatorMethod('update', args, callback);
        }
        // it's my collection.  descend into the collection object
        // and propagate any exception.
        // If the user provided a callback and the collection implements this
        // operation asynchronously, then queryRet will be undefined, and the
        // result will be returned through the callback instead.
        //console.log({callback, options, selector, modifier, coll: this._collection});
        try {
            // If the user provided a callback and the collection implements this
            // operation asynchronously, then queryRet will be undefined, and the
            // result will be returned through the callback instead.
            return this._collection.update(selector, modifier, options, wrappedCallback);
        } catch (e) {
            if (callback) {
                callback(e);
                return null;
            }
            throw e;
        }
    },
    /**
   * @summary Remove documents from the collection
   * @locus Anywhere
   * @method remove
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} selector Specifies which documents to remove
   * @param {Function} [callback] Optional.  If present, called with an error object as the first argument and, if no error, the number of affected documents as the second.
   */ remove (selector, callback) {
        selector = Mongo.Collection._rewriteSelector(selector);
        if (this._isRemoteCollection()) {
            return this._callMutatorMethod('remove', [
                selector
            ], callback);
        }
        // it's my collection.  descend into the collection1 object
        // and propagate any exception.
        return this._collection.remove(selector);
    },
    /**
   * @summary Asynchronously modifies one or more documents in the collection, or insert one if no matching documents were found. Returns an object with keys `numberAffected` (the number of documents modified)  and `insertedId` (the unique _id of the document that was inserted, if any).
   * @locus Anywhere
   * @method upsert
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} selector Specifies which documents to modify
   * @param {MongoModifier} modifier Specifies how to modify the documents
   * @param {Object} [options]
   * @param {Boolean} options.multi True to modify all matching documents; false to only modify one of the matching documents (the default).
   * @param {Function} [callback] Optional.  If present, called with an error object as the first argument and, if no error, the number of affected documents as the second.
   */ upsert (selector, modifier, options, callback) {
        if (!callback && typeof options === 'function') {
            callback = options;
            options = {};
        }
        return this.update(selector, modifier, _object_spread_props(_object_spread({}, options), {
            _returnObject: true,
            upsert: true
        }));
    }
};
// Convert the callback to not return a result if there is an error
function wrapCallback(callback, convertResult) {
    return callback && function(error, result) {
        if (error) {
            callback(error);
        } else if (typeof convertResult === 'function') {
            callback(error, convertResult(result));
        } else {
            callback(error, result);
        }
    };
}
function popCallbackFromArgs(args) {
    // Pull off any callback (or perhaps a 'callback' variable that was passed
    // in undefined, like how 'upsert' does it).
    if (args.length && (args[args.length - 1] === undefined || args[args.length - 1] instanceof Function)) {
        return args.pop();
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"connection_options.ts":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/connection_options.ts                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * @summary Allows for user specified connection options
 * @example http://mongodb.github.io/node-mongodb-native/3.0/reference/connecting/connection-settings/
 * @locus Server
 * @param {Object} options User specified Mongo connection options
 */ Mongo.setConnectionOptions = function setConnectionOptions(options) {
    check(options, Object);
    Mongo._connectionOptions = options;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"mongo_utils.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/mongo_utils.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({normalizeProjection:()=>normalizeProjection},true);let _object_spread;module.link("@swc/helpers/_/_object_spread",{_(v){_object_spread=v}},0);let _object_without_properties;module.link("@swc/helpers/_/_object_without_properties",{_(v){_object_without_properties=v}},1);

const normalizeProjection = (options)=>{
    // transform fields key in projection
    const _ref = options || {}, { fields, projection } = _ref, otherOptions = _object_without_properties(_ref, [
        "fields",
        "projection"
    ]);
    // TODO: enable this comment when deprecating the fields option
    // Log.debug(`fields option has been deprecated, please use the new 'projection' instead`)
    return _object_spread({}, otherOptions, projection || fields ? {
        projection: fields || projection
    } : {});
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"observe_handle.ts":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo/observe_handle.ts                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({ObserveHandle:()=>ObserveHandle});function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
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
let nextObserveHandleId = 1;
/**
 * The "observe handle" returned from observeChanges.
 * Contains a reference to an ObserveMultiplexer.
 * Used to stop observation and clean up resources.
 */ class ObserveHandle {
    constructor(multiplexer, callbacks, nonMutatingCallbacks){
        _define_property(this, "_id", void 0);
        _define_property(this, "_multiplexer", void 0);
        _define_property(this, "nonMutatingCallbacks", void 0);
        _define_property(this, "_stopped", void 0);
        _define_property(this, "initialAddsSentResolver", ()=>{});
        _define_property(this, "initialAddsSent", void 0);
        _define_property(this, "_added", void 0);
        _define_property(this, "_addedBefore", void 0);
        _define_property(this, "_changed", void 0);
        _define_property(this, "_movedBefore", void 0);
        _define_property(this, "_removed", void 0);
        /**
   * Using property syntax and arrow function syntax to avoid binding the wrong context on callbacks.
   */ _define_property(this, "stop", ()=>_async_to_generator(function*() {
                if (this._stopped) return;
                this._stopped = true;
                yield this._multiplexer.removeHandle(this._id);
            }).call(this));
        this._multiplexer = multiplexer;
        multiplexer.callbackNames().forEach((name)=>{
            if (callbacks[name]) {
                this[`_${name}`] = callbacks[name];
                return;
            }
            if (name === "addedBefore" && callbacks.added) {
                this._addedBefore = function(id, fields, before) {
                    return _async_to_generator(function*() {
                        yield callbacks.added(id, fields);
                    })();
                };
            }
        });
        this._stopped = false;
        this._id = nextObserveHandleId++;
        this.nonMutatingCallbacks = nonMutatingCallbacks;
        this.initialAddsSent = new Promise((resolve)=>{
            const ready = ()=>{
                resolve();
                this.initialAddsSent = Promise.resolve();
            };
            const timeout = setTimeout(ready, 30000);
            this.initialAddsSentResolver = ()=>{
                ready();
                clearTimeout(timeout);
            };
        });
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"lodash.isempty":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/mongo/node_modules/lodash.isempty/package.json                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "lodash.isempty",
  "version": "4.4.0"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/mongo/node_modules/lodash.isempty/index.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lodash.clone":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/mongo/node_modules/lodash.clone/package.json                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "lodash.clone",
  "version": "4.5.0"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/mongo/node_modules/lodash.clone/index.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lodash.has":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/mongo/node_modules/lodash.has/package.json                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "lodash.has",
  "version": "4.5.2"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/mongo/node_modules/lodash.has/index.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lodash.throttle":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/mongo/node_modules/lodash.throttle/package.json                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "lodash.throttle",
  "version": "4.1.1"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/mongo/node_modules/lodash.throttle/index.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"mongodb-uri":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/mongo/node_modules/mongodb-uri/package.json                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "mongodb-uri",
  "version": "0.9.7",
  "main": "mongodb-uri"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"mongodb-uri.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/mongo/node_modules/mongodb-uri/mongodb-uri.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lodash.once":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/mongo/node_modules/lodash.once/package.json                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "lodash.once",
  "version": "4.1.1"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/mongo/node_modules/lodash.once/index.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".ts"
  ]
});


/* Exports */
return {
  export: function () { return {
      MongoInternals: MongoInternals,
      Mongo: Mongo,
      CollectionExtensions: CollectionExtensions,
      ObserveMultiplexer: ObserveMultiplexer
    };},
  require: require,
  eagerModulePaths: [
    "/node_modules/meteor/mongo/mongo_driver.js",
    "/node_modules/meteor/mongo/oplog_tailing.ts",
    "/node_modules/meteor/mongo/observe_multiplex.ts",
    "/node_modules/meteor/mongo/doc_fetcher.js",
    "/node_modules/meteor/mongo/polling_observe_driver.ts",
    "/node_modules/meteor/mongo/oplog_observe_driver.js",
    "/node_modules/meteor/mongo/oplog_v2_converter.ts",
    "/node_modules/meteor/mongo/cursor_description.ts",
    "/node_modules/meteor/mongo/mongo_connection.js",
    "/node_modules/meteor/mongo/mongo_common.js",
    "/node_modules/meteor/mongo/asynchronous_cursor.js",
    "/node_modules/meteor/mongo/cursor.ts",
    "/node_modules/meteor/mongo/local_collection_driver.js",
    "/node_modules/meteor/mongo/remote_collection_driver.ts",
    "/node_modules/meteor/mongo/collection/collection_extensions.js",
    "/node_modules/meteor/mongo/collection/collection.js",
    "/node_modules/meteor/mongo/connection_options.ts"
  ]
}});

//# sourceURL=meteor://💻app/packages/mongo.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9uZ28vbW9uZ29fZHJpdmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb25nby9vcGxvZ190YWlsaW5nLnRzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb25nby9vYnNlcnZlX211bHRpcGxleC50cyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9uZ28vZG9jX2ZldGNoZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbmdvL3BvbGxpbmdfb2JzZXJ2ZV9kcml2ZXIudHMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbmdvL29wbG9nX29ic2VydmVfZHJpdmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb25nby9vcGxvZ192Ml9jb252ZXJ0ZXIudHMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbmdvL2N1cnNvcl9kZXNjcmlwdGlvbi50cyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9uZ28vbW9uZ29fY29ubmVjdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9uZ28vbW9uZ29fY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb25nby9hc3luY2hyb25vdXNfY3Vyc29yLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb25nby9jdXJzb3IudHMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbmdvL2xvY2FsX2NvbGxlY3Rpb25fZHJpdmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb25nby9yZW1vdGVfY29sbGVjdGlvbl9kcml2ZXIudHMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbmdvL2NvbGxlY3Rpb24vY29sbGVjdGlvbl9leHRlbnNpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb25nby9jb2xsZWN0aW9uL2NvbGxlY3Rpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbmdvL2NvbGxlY3Rpb24vY29sbGVjdGlvbl91dGlscy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9uZ28vY29sbGVjdGlvbi9tZXRob2RzX2FzeW5jLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb25nby9jb2xsZWN0aW9uL21ldGhvZHNfaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbmdvL2NvbGxlY3Rpb24vbWV0aG9kc19yZXBsaWNhdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9uZ28vY29sbGVjdGlvbi9tZXRob2RzX3N5bmMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbmdvL2Nvbm5lY3Rpb25fb3B0aW9ucy50cyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9uZ28vbW9uZ29fdXRpbHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbmdvL29ic2VydmVfaGFuZGxlLnRzIl0sIm5hbWVzIjpbIk1vbmdvSW50ZXJuYWxzIiwiZ2xvYmFsIiwiX19wYWNrYWdlTmFtZSIsIk5wbU1vZHVsZXMiLCJtb25nb2RiIiwidmVyc2lvbiIsIk5wbU1vZHVsZU1vbmdvZGJWZXJzaW9uIiwibW9kdWxlIiwiTW9uZ29EQiIsIk5wbU1vZHVsZSIsIlByb3h5IiwiZ2V0IiwidGFyZ2V0IiwicHJvcGVydHlLZXkiLCJyZWNlaXZlciIsIk1ldGVvciIsImRlcHJlY2F0ZSIsIlJlZmxlY3QiLCJPcGxvZ0hhbmRsZSIsIkNvbm5lY3Rpb24iLCJNb25nb0Nvbm5lY3Rpb24iLCJPcGxvZ09ic2VydmVEcml2ZXIiLCJUaW1lc3RhbXAiLCJwcm90b3R5cGUiLCJjbG9uZSIsImxpc3RlbkFsbCIsImN1cnNvckRlc2NyaXB0aW9uIiwibGlzdGVuQ2FsbGJhY2siLCJsaXN0ZW5lcnMiLCJmb3JFYWNoVHJpZ2dlciIsInRyaWdnZXIiLCJwdXNoIiwiRERQU2VydmVyIiwiX0ludmFsaWRhdGlvbkNyb3NzYmFyIiwibGlzdGVuIiwic3RvcCIsImZvckVhY2giLCJsaXN0ZW5lciIsInRyaWdnZXJDYWxsYmFjayIsImtleSIsImNvbGxlY3Rpb24iLCJjb2xsZWN0aW9uTmFtZSIsInNwZWNpZmljSWRzIiwiTG9jYWxDb2xsZWN0aW9uIiwiX2lkc01hdGNoZWRCeVNlbGVjdG9yIiwic2VsZWN0b3IiLCJpZCIsIk9iamVjdCIsImFzc2lnbiIsImRyb3BDb2xsZWN0aW9uIiwiZHJvcERhdGFiYXNlIiwiTW9uZ29UaW1lc3RhbXAiLCJMb25nIiwiTnBtTW9kdWxlTW9uZ29kYiIsIk9QTE9HX0NPTExFQ1RJT04iLCJUT09fRkFSX0JFSElORCIsInByb2Nlc3MiLCJlbnYiLCJNRVRFT1JfT1BMT0dfVE9PX0ZBUl9CRUhJTkQiLCJUQUlMX1RJTUVPVVQiLCJNRVRFT1JfT1BMT0dfVEFJTF9USU1FT1VUIiwiX25zQWxsb3dlZCIsIm5zIiwiX2luY2x1ZGVOU1JlZ2V4IiwidGVzdCIsIl9leGNsdWRlTlNSZWdleCIsIl9nZXRPcGxvZ1NlbGVjdG9yIiwibGFzdFByb2Nlc3NlZFRTIiwib3Bsb2dDcml0ZXJpYSIsIiRvciIsIm9wIiwiJGluIiwiJGV4aXN0cyIsIl9vcGxvZ09wdGlvbnMiLCJleGNsdWRlQ29sbGVjdGlvbnMiLCJsZW5ndGgiLCJuc1JlZ2V4IiwiUmVnRXhwIiwiX2VzY2FwZVJlZ0V4cCIsIl9kYk5hbWUiLCJqb2luIiwiZXhjbHVkZU5zIiwiJHJlZ2V4IiwiJG5pbiIsIm1hcCIsImNvbGxOYW1lIiwiJGVsZW1NYXRjaCIsImluY2x1ZGVDb2xsZWN0aW9ucyIsImluY2x1ZGVOcyIsInRzIiwiJGd0IiwiJGFuZCIsIl9zdG9wcGVkIiwiX3RhaWxIYW5kbGUiLCJfb25PcGxvZ0VudHJ5IiwiY2FsbGJhY2siLCJFcnJvciIsIl9yZWFkeVByb21pc2UiLCJvcmlnaW5hbENhbGxiYWNrIiwiYmluZEVudmlyb25tZW50Iiwibm90aWZpY2F0aW9uIiwiZXJyIiwiX2RlYnVnIiwibGlzdGVuSGFuZGxlIiwiX2Nyb3NzYmFyIiwib25PcGxvZ0VudHJ5Iiwib25Ta2lwcGVkRW50cmllcyIsIl9vblNraXBwZWRFbnRyaWVzSG9vayIsInJlZ2lzdGVyIiwiX3dhaXRVbnRpbENhdWdodFVwIiwibGFzdEVudHJ5Iiwib3Bsb2dTZWxlY3RvciIsIl9vcGxvZ0xhc3RFbnRyeUNvbm5lY3Rpb24iLCJmaW5kT25lQXN5bmMiLCJwcm9qZWN0aW9uIiwic29ydCIsIiRuYXR1cmFsIiwiZSIsInNsZWVwIiwiSlNPTiIsInN0cmluZ2lmeSIsIl9sYXN0UHJvY2Vzc2VkVFMiLCJsZXNzVGhhbk9yRXF1YWwiLCJpbnNlcnRBZnRlciIsIl9jYXRjaGluZ1VwUmVzb2x2ZXJzIiwiZ3JlYXRlclRoYW4iLCJwcm9taXNlUmVzb2x2ZXIiLCJwcm9taXNlVG9Bd2FpdCIsIlByb21pc2UiLCJyIiwiY2xlYXJUaW1lb3V0IiwiX3Jlc29sdmVUaW1lb3V0Iiwic2V0VGltZW91dCIsImNvbnNvbGUiLCJlcnJvciIsInNwbGljZSIsInJlc29sdmVyIiwid2FpdFVudGlsQ2F1Z2h0VXAiLCJfc3RhcnRUYWlsaW5nIiwibW9uZ29kYlVyaSIsInJlcXVpcmUiLCJwYXJzZSIsIl9vcGxvZ1VybCIsImRhdGFiYXNlIiwiX29wbG9nVGFpbENvbm5lY3Rpb24iLCJtYXhQb29sU2l6ZSIsIm1pblBvb2xTaXplIiwiaXNNYXN0ZXJEb2MiLCJkYiIsImFkbWluIiwiY29tbWFuZCIsImlzbWFzdGVyIiwic2V0TmFtZSIsImxhc3RPcGxvZ0VudHJ5IiwiQ3Vyc29yRGVzY3JpcHRpb24iLCJ0YWlsYWJsZSIsInRhaWwiLCJkb2MiLCJfZW50cnlRdWV1ZSIsIl9tYXliZVN0YXJ0V29ya2VyIiwiX3JlYWR5UHJvbWlzZVJlc29sdmVyIiwiX3dvcmtlclByb21pc2UiLCJfd29ya2VyQWN0aXZlIiwiaXNFbXB0eSIsInBvcCIsImNsZWFyIiwiZWFjaCIsIl9zZXRMYXN0UHJvY2Vzc2VkVFMiLCJzaGlmdCIsImhhbmRsZURvYyIsInNlcXVlbmNlciIsIl9kZWZpbmVUb29GYXJCZWhpbmQiLCJ2YWx1ZSIsIl9yZXNldFRvb0ZhckJlaGluZCIsIm9wbG9nVXJsIiwiZGJOYW1lIiwiX3N0YXJ0VHJhaWxpbmdQcm9taXNlIiwiX0RvdWJsZUVuZGVkUXVldWUiLCJfQ3Jvc3NiYXIiLCJmYWN0UGFja2FnZSIsImZhY3ROYW1lIiwic2V0dGluZ3MiLCJwYWNrYWdlcyIsIm1vbmdvIiwib3Bsb2dJbmNsdWRlQ29sbGVjdGlvbnMiLCJvcGxvZ0V4Y2x1ZGVDb2xsZWN0aW9ucyIsImluY0FsdCIsImMiLCJleGNBbHQiLCJIb29rIiwiZGVidWdQcmludEV4Y2VwdGlvbnMiLCJpZEZvck9wIiwibyIsIl9pZCIsIm8yIiwiaGFuZGxlIiwiYXBwbHlPcHMiLCJuZXh0VGltZXN0YW1wIiwiYWRkIiwiT05FIiwic3RhcnRzV2l0aCIsInNsaWNlIiwiZHJvcCIsImZpcmUiLCJyZXNvbHZlIiwic2V0SW1tZWRpYXRlIiwiT2JzZXJ2ZU11bHRpcGxleGVyIiwiYWRkSGFuZGxlQW5kU2VuZEluaXRpYWxBZGRzIiwiX2FkZEhhbmRsZUFuZFNlbmRJbml0aWFsQWRkcyIsIl9hZGRIYW5kbGVUYXNrc1NjaGVkdWxlZEJ1dE5vdFBlcmZvcm1lZCIsIlBhY2thZ2UiLCJGYWN0cyIsImluY3JlbWVudFNlcnZlckZhY3QiLCJfcXVldWUiLCJydW5UYXNrIiwiX2hhbmRsZXMiLCJfc2VuZEFkZHMiLCJyZW1vdmVIYW5kbGUiLCJfcmVhZHkiLCJfc3RvcCIsIm9wdGlvbnMiLCJmcm9tUXVlcnlFcnJvciIsIl9vblN0b3AiLCJyZWFkeSIsInF1ZXVlVGFzayIsIl9yZXNvbHZlciIsIl9pc1JlYWR5IiwicXVlcnlFcnJvciIsIm9uRmx1c2giLCJjYiIsImNhbGxiYWNrTmFtZXMiLCJfb3JkZXJlZCIsIl9hcHBseUNhbGxiYWNrIiwiY2FsbGJhY2tOYW1lIiwiYXJncyIsIl9jYWNoZSIsImFwcGx5Q2hhbmdlIiwiYXBwbHkiLCJoYW5kbGVJZCIsImtleXMiLCJyZXN1bHQiLCJub25NdXRhdGluZ0NhbGxiYWNrcyIsIkVKU09OIiwiX2lzUHJvbWlzZSIsImNhdGNoIiwiaW5pdGlhbEFkZHNTZW50IiwidGhlbiIsIl9hZGRlZEJlZm9yZSIsIl9hZGRlZCIsImFkZFByb21pc2VzIiwiZG9jcyIsImZpZWxkcyIsInByb21pc2UiLCJyZWplY3QiLCJhbGxTZXR0bGVkIiwicCIsInN0YXR1cyIsInJlYXNvbiIsImluaXRpYWxBZGRzU2VudFJlc29sdmVyIiwib3JkZXJlZCIsIm9uU3RvcCIsInVuZGVmaW5lZCIsIl9Bc3luY2hyb25vdXNRdWV1ZSIsIl9DYWNoaW5nQ2hhbmdlT2JzZXJ2ZXIiLCJEb2NGZXRjaGVyIiwiZmV0Y2giLCJzZWxmIiwiY2hlY2siLCJTdHJpbmciLCJfY2FsbGJhY2tzRm9yT3AiLCJoYXMiLCJjYWxsYmFja3MiLCJzZXQiLCJfbW9uZ29Db25uZWN0aW9uIiwiZGVsZXRlIiwibW9uZ29Db25uZWN0aW9uIiwiTWFwIiwiUE9MTElOR19USFJPVFRMRV9NUyIsIk1FVEVPUl9QT0xMSU5HX1RIUk9UVExFX01TIiwiUE9MTElOR19JTlRFUlZBTF9NUyIsIk1FVEVPUl9QT0xMSU5HX0lOVEVSVkFMX01TIiwiUG9sbGluZ09ic2VydmVEcml2ZXIiLCJfaW5pdCIsIl9vcHRpb25zIiwibGlzdGVuZXJzSGFuZGxlIiwiX2N1cnNvckRlc2NyaXB0aW9uIiwiZmVuY2UiLCJfZ2V0Q3VycmVudEZlbmNlIiwiX3BlbmRpbmdXcml0ZXMiLCJiZWdpbldyaXRlIiwiX3BvbGxzU2NoZWR1bGVkQnV0Tm90U3RhcnRlZCIsIl9lbnN1cmVQb2xsSXNTY2hlZHVsZWQiLCJfc3RvcENhbGxiYWNrcyIsIl90ZXN0T25seVBvbGxDYWxsYmFjayIsInBvbGxpbmdJbnRlcnZhbCIsInBvbGxpbmdJbnRlcnZhbE1zIiwiX3BvbGxpbmdJbnRlcnZhbCIsImludGVydmFsSGFuZGxlIiwic2V0SW50ZXJ2YWwiLCJiaW5kIiwiY2xlYXJJbnRlcnZhbCIsIl91bnRocm90dGxlZEVuc3VyZVBvbGxJc1NjaGVkdWxlZCIsIl90YXNrUXVldWUiLCJfcG9sbE1vbmdvIiwiX3N1c3BlbmRQb2xsaW5nIiwiX3Jlc3VtZVBvbGxpbmciLCJmaXJzdCIsIm5ld1Jlc3VsdHMiLCJvbGRSZXN1bHRzIiwiX3Jlc3VsdHMiLCJfSWRNYXAiLCJ3cml0ZXNGb3JDeWNsZSIsIl9jdXJzb3IiLCJnZXRSYXdPYmplY3RzIiwiY29kZSIsIl9tdWx0aXBsZXhlciIsIm1lc3NhZ2UiLCJBcnJheSIsIl9kaWZmUXVlcnlDaGFuZ2VzIiwidyIsImNvbW1pdHRlZCIsIl9tb25nb0hhbmRsZSIsIm1vbmdvSGFuZGxlIiwibXVsdGlwbGV4ZXIiLCJfY3JlYXRlQXN5bmNocm9ub3VzQ3Vyc29yIiwidGhyb3R0bGUiLCJwb2xsaW5nVGhyb3R0bGVNcyIsIlBIQVNFIiwiUVVFUllJTkciLCJGRVRDSElORyIsIlNURUFEWSIsIlN3aXRjaGVkVG9RdWVyeSIsImZpbmlzaElmTmVlZFRvUG9sbFF1ZXJ5IiwiZiIsImFyZ3VtZW50cyIsImN1cnJlbnRJZCIsIl91c2VzT3Bsb2ciLCJzb3J0ZXIiLCJjb21wYXJhdG9yIiwiZ2V0Q29tcGFyYXRvciIsImxpbWl0IiwiaGVhcE9wdGlvbnMiLCJJZE1hcCIsIl9saW1pdCIsIl9jb21wYXJhdG9yIiwiX3NvcnRlciIsIl91bnB1Ymxpc2hlZEJ1ZmZlciIsIk1pbk1heEhlYXAiLCJfcHVibGlzaGVkIiwiTWF4SGVhcCIsIl9zYWZlQXBwZW5kVG9CdWZmZXIiLCJfc3RvcEhhbmRsZXMiLCJfYWRkU3RvcEhhbmRsZXMiLCJuZXdTdG9wSGFuZGxlcyIsImV4cGVjdGVkUGF0dGVybiIsIk1hdGNoIiwiT2JqZWN0SW5jbHVkaW5nIiwiRnVuY3Rpb24iLCJPbmVPZiIsIl9yZWdpc3RlclBoYXNlQ2hhbmdlIiwiX21hdGNoZXIiLCJtYXRjaGVyIiwiX3Byb2plY3Rpb25GbiIsIl9jb21waWxlUHJvamVjdGlvbiIsIl9zaGFyZWRQcm9qZWN0aW9uIiwiY29tYmluZUludG9Qcm9qZWN0aW9uIiwiX3NoYXJlZFByb2plY3Rpb25GbiIsIl9uZWVkVG9GZXRjaCIsIl9jdXJyZW50bHlGZXRjaGluZyIsIl9mZXRjaEdlbmVyYXRpb24iLCJfcmVxdWVyeVdoZW5Eb25lVGhpc1F1ZXJ5IiwiX3dyaXRlc1RvQ29tbWl0V2hlbldlUmVhY2hTdGVhZHkiLCJfb3Bsb2dIYW5kbGUiLCJfbmVlZFRvUG9sbFF1ZXJ5IiwiX3BoYXNlIiwiX2hhbmRsZU9wbG9nRW50cnlRdWVyeWluZyIsIl9oYW5kbGVPcGxvZ0VudHJ5U3RlYWR5T3JGZXRjaGluZyIsImZpcmVkIiwiX29wbG9nT2JzZXJ2ZURyaXZlcnMiLCJvbkJlZm9yZUZpcmUiLCJkcml2ZXJzIiwiZHJpdmVyIiwidmFsdWVzIiwid3JpdGUiLCJfb25GYWlsb3ZlciIsIl9ydW5Jbml0aWFsUXVlcnkiLCJfYWRkUHVibGlzaGVkIiwiX25vWWllbGRzQWxsb3dlZCIsImFkZGVkIiwic2l6ZSIsIm92ZXJmbG93aW5nRG9jSWQiLCJtYXhFbGVtZW50SWQiLCJvdmVyZmxvd2luZ0RvYyIsImVxdWFscyIsInJlbW92ZSIsInJlbW92ZWQiLCJfYWRkQnVmZmVyZWQiLCJfcmVtb3ZlUHVibGlzaGVkIiwiZW1wdHkiLCJuZXdEb2NJZCIsIm1pbkVsZW1lbnRJZCIsIm5ld0RvYyIsIl9yZW1vdmVCdWZmZXJlZCIsIl9jaGFuZ2VQdWJsaXNoZWQiLCJvbGREb2MiLCJwcm9qZWN0ZWROZXciLCJwcm9qZWN0ZWRPbGQiLCJjaGFuZ2VkIiwiRGlmZlNlcXVlbmNlIiwibWFrZUNoYW5nZWRGaWVsZHMiLCJtYXhCdWZmZXJlZElkIiwiX2FkZE1hdGNoaW5nIiwibWF4UHVibGlzaGVkIiwibWF4QnVmZmVyZWQiLCJ0b1B1Ymxpc2giLCJjYW5BcHBlbmRUb0J1ZmZlciIsImNhbkluc2VydEludG9CdWZmZXIiLCJ0b0J1ZmZlciIsIl9yZW1vdmVNYXRjaGluZyIsIl9oYW5kbGVEb2MiLCJtYXRjaGVzTm93IiwiZG9jdW1lbnRNYXRjaGVzIiwicHVibGlzaGVkQmVmb3JlIiwiYnVmZmVyZWRCZWZvcmUiLCJjYWNoZWRCZWZvcmUiLCJtaW5CdWZmZXJlZCIsInN0YXlzSW5QdWJsaXNoZWQiLCJzdGF5c0luQnVmZmVyIiwiX2ZldGNoTW9kaWZpZWREb2N1bWVudHMiLCJkZWZlciIsInRoaXNHZW5lcmF0aW9uIiwiZmV0Y2hQcm9taXNlcyIsImZldGNoUHJvbWlzZSIsIl9kb2NGZXRjaGVyIiwicmVzdWx0cyIsImVycm9ycyIsImZpbHRlciIsIl9iZVN0ZWFkeSIsIndyaXRlcyIsIm9wbG9nVjJWMUNvbnZlcnRlciIsImlzUmVwbGFjZSIsImNhbkRpcmVjdGx5TW9kaWZ5RG9jIiwibW9kaWZpZXJDYW5CZURpcmVjdGx5QXBwbGllZCIsIl9tb2RpZnkiLCJuYW1lIiwiY2FuQmVjb21lVHJ1ZUJ5TW9kaWZpZXIiLCJhZmZlY3RlZEJ5TW9kaWZpZXIiLCJfcnVuSW5pdGlhbFF1ZXJ5QXN5bmMiLCJfcnVuUXVlcnkiLCJpbml0aWFsIiwiX2RvbmVRdWVyeWluZyIsIl9wb2xsUXVlcnkiLCJfcnVuUXVlcnlBc3luYyIsIm5ld0J1ZmZlciIsImN1cnNvciIsIl9jdXJzb3JGb3JRdWVyeSIsImkiLCJfc2xlZXBGb3JNcyIsIl9wdWJsaXNoTmV3UmVzdWx0cyIsIm9wdGlvbnNPdmVyd3JpdGUiLCJ0cmFuc2Zvcm0iLCJkZXNjcmlwdGlvbiIsIkN1cnNvciIsImlkc1RvUmVtb3ZlIiwiX29wbG9nRW50cnlIYW5kbGUiLCJfbGlzdGVuZXJzSGFuZGxlIiwicGhhc2UiLCJub3ciLCJEYXRlIiwidGltZURpZmYiLCJfcGhhc2VTdGFydFRpbWUiLCJjdXJzb3JTdXBwb3J0ZWQiLCJkaXNhYmxlT3Bsb2ciLCJfZGlzYWJsZU9wbG9nIiwic2tpcCIsIl9jaGVja1N1cHBvcnRlZFByb2plY3Rpb24iLCJoYXNXaGVyZSIsImhhc0dlb1F1ZXJ5IiwibW9kaWZpZXIiLCJlbnRyaWVzIiwiZXZlcnkiLCJvcGVyYXRpb24iLCJmaWVsZCIsImFycmF5T3BlcmF0b3JLZXlSZWdleCIsImlzQXJyYXlPcGVyYXRvcktleSIsImlzQXJyYXlPcGVyYXRvciIsIm9wZXJhdG9yIiwiYSIsInByZWZpeCIsImZsYXR0ZW5PYmplY3RJbnRvIiwic291cmNlIiwiaXNBcnJheSIsIk1vbmdvIiwiT2JqZWN0SUQiLCJfaXNDdXN0b21UeXBlIiwiY29udmVydE9wbG9nRGlmZiIsIm9wbG9nRW50cnkiLCJkaWZmIiwiZGlmZktleSIsIiR1bnNldCIsIiRzZXQiLCJmaWVsZFZhbHVlIiwicG9zaXRpb24iLCJwb3NpdGlvbktleSIsIiR2IiwiY29udmVydGVkT3Bsb2dFbnRyeSIsIkNvbGxlY3Rpb24iLCJfcmV3cml0ZVNlbGVjdG9yIiwiRklMRV9BU1NFVF9TVUZGSVgiLCJBU1NFVFNfRk9MREVSIiwiQVBQX0ZPTERFUiIsIm9wbG9nQ29sbGVjdGlvbldhcm5pbmdzIiwidXJsIiwiX29ic2VydmVNdWx0aXBsZXhlcnMiLCJfb25GYWlsb3Zlckhvb2siLCJ1c2VyT3B0aW9ucyIsIl9jb25uZWN0aW9uT3B0aW9ucyIsIm1vbmdvT3B0aW9ucyIsImlnbm9yZVVuZGVmaW5lZCIsImVuZHNXaXRoIiwib3B0aW9uTmFtZSIsInJlcGxhY2UiLCJwYXRoIiwiQXNzZXRzIiwiZ2V0U2VydmVyRGlyIiwiZHJpdmVySW5mbyIsInJlbGVhc2UiLCJjbGllbnQiLCJNb25nb0NsaWVudCIsIm9uIiwiZXZlbnQiLCJwcmV2aW91c0Rlc2NyaXB0aW9uIiwidHlwZSIsIm5ld0Rlc2NyaXB0aW9uIiwiZGF0YWJhc2VOYW1lIiwiX2Nsb3NlIiwib3Bsb2dIYW5kbGUiLCJjbG9zZSIsIl9zZXRPcGxvZ0hhbmRsZSIsInJhd0NvbGxlY3Rpb24iLCJjcmVhdGVDYXBwZWRDb2xsZWN0aW9uQXN5bmMiLCJieXRlU2l6ZSIsIm1heERvY3VtZW50cyIsImNyZWF0ZUNvbGxlY3Rpb24iLCJjYXBwZWQiLCJtYXgiLCJfbWF5YmVCZWdpbldyaXRlIiwiaW5zZXJ0QXN5bmMiLCJjb2xsZWN0aW9uX25hbWUiLCJkb2N1bWVudCIsIl9leHBlY3RlZEJ5VGVzdCIsIl9pc1BsYWluT2JqZWN0IiwicmVmcmVzaCIsImluc2VydE9uZSIsInJlcGxhY2VUeXBlcyIsInJlcGxhY2VNZXRlb3JBdG9tV2l0aE1vbmdvIiwic2FmZSIsImluc2VydGVkSWQiLCJfcmVmcmVzaCIsInJlZnJlc2hLZXkiLCJyZW1vdmVBc3luYyIsImRlbGV0ZU1hbnkiLCJkZWxldGVkQ291bnQiLCJ0cmFuc2Zvcm1SZXN1bHQiLCJtb2RpZmllZENvdW50IiwibnVtYmVyQWZmZWN0ZWQiLCJkcm9wQ29sbGVjdGlvbkFzeW5jIiwiZHJvcERhdGFiYXNlQXN5bmMiLCJfZHJvcERhdGFiYXNlIiwidXBkYXRlQXN5bmMiLCJtb2QiLCJtb25nb09wdHMiLCJhcnJheUZpbHRlcnMiLCJ1cHNlcnQiLCJtdWx0aSIsImZ1bGxSZXN1bHQiLCJtb25nb1NlbGVjdG9yIiwibW9uZ29Nb2QiLCJpc01vZGlmeSIsIl9pc01vZGlmaWNhdGlvbk1vZCIsIl9mb3JiaWRSZXBsYWNlIiwia25vd25JZCIsIl9jcmVhdGVVcHNlcnREb2N1bWVudCIsImdlbmVyYXRlZElkIiwic2ltdWxhdGVVcHNlcnRXaXRoSW5zZXJ0ZWRJZCIsIl9yZXR1cm5PYmplY3QiLCJoYXNPd25Qcm9wZXJ0eSIsIiRzZXRPbkluc2VydCIsInN0cmluZ3MiLCJ1cGRhdGVNZXRob2QiLCJtZXRlb3JSZXN1bHQiLCJPYmplY3RJZCIsInRvSGV4U3RyaW5nIiwiX2lzQ2Fubm90Q2hhbmdlSWRFcnJvciIsImVycm1zZyIsImluZGV4T2YiLCJ1cHNlcnRBc3luYyIsImZpbmQiLCJjcmVhdGVJbmRleEFzeW5jIiwiaW5kZXgiLCJjcmVhdGVJbmRleCIsImNvdW50RG9jdW1lbnRzIiwiYXJnIiwiZXN0aW1hdGVkRG9jdW1lbnRDb3VudCIsImVuc3VyZUluZGV4QXN5bmMiLCJkcm9wSW5kZXhBc3luYyIsImluZGV4TmFtZSIsImRyb3BJbmRleCIsIkNMSUVOVF9PTkxZX01FVEhPRFMiLCJtIiwiZ2V0QXN5bmNNZXRob2ROYW1lIiwiTlVNX09QVElNSVNUSUNfVFJJRVMiLCJtb25nb09wdHNGb3JVcGRhdGUiLCJtb25nb09wdHNGb3JJbnNlcnQiLCJyZXBsYWNlbWVudFdpdGhJZCIsInRyaWVzIiwiZG9VcGRhdGUiLCJtZXRob2QiLCJ1cGRhdGVNYW55Iiwic29tZSIsInJlcGxhY2VPbmUiLCJ1cHNlcnRlZENvdW50IiwidXBzZXJ0ZWRJZCIsImRvQ29uZGl0aW9uYWxJbnNlcnQiLCJfb2JzZXJ2ZUNoYW5nZXNUYWlsYWJsZSIsImFkZGVkQmVmb3JlIiwic2VsZkZvckl0ZXJhdGlvbiIsInVzZVRyYW5zZm9ybSIsImN1cnNvck9wdGlvbnMiLCJyZWFkUHJlZmVyZW5jZSIsIm51bWJlck9mUmV0cmllcyIsImRiQ3Vyc29yIiwiYWRkQ3Vyc29yRmxhZyIsIm1heFRpbWVNcyIsIm1heFRpbWVNUyIsImhpbnQiLCJBc3luY2hyb25vdXNDdXJzb3IiLCJkb2NDYWxsYmFjayIsInRpbWVvdXRNUyIsInN0b3BwZWQiLCJsYXN0VFMiLCJsb29wIiwiX25leHRPYmplY3RQcm9taXNlV2l0aFRpbWVvdXQiLCJuZXdTZWxlY3RvciIsIl9vYnNlcnZlQ2hhbmdlcyIsImZpZWxkc09wdGlvbnMiLCJvYnNlcnZlS2V5Iiwib2JzZXJ2ZURyaXZlciIsImZpcnN0SGFuZGxlIiwib2JzZXJ2ZUhhbmRsZSIsIk9ic2VydmVIYW5kbGUiLCJvcGxvZ09wdGlvbnMiLCJjYW5Vc2VPcGxvZyIsImluY2x1ZGVzIiwid2FybiIsIk1pbmltb25nbyIsIk1hdGNoZXIiLCJpc0NsaWVudCIsIk1pbmlNb25nb1F1ZXJ5RXJyb3IiLCJTb3J0ZXIiLCJkcml2ZXJDbGFzcyIsIl9vYnNlcnZlRHJpdmVyIiwid3JpdGVDYWxsYmFjayIsInJlZnJlc2hFcnIiLCJkcml2ZXJSZXN1bHQiLCJtb25nb1Jlc3VsdCIsIm4iLCJtYXRjaGVkQ291bnQiLCJpc0JpbmFyeSIsIkJpbmFyeSIsIkJ1ZmZlciIsImZyb20iLCJEZWNpbWFsIiwiRGVjaW1hbDEyOCIsImZyb21TdHJpbmciLCJ0b1N0cmluZyIsInJlcGxhY2VOYW1lcyIsIm1ha2VNb25nb0xlZ2FsIiwidG9KU09OVmFsdWUiLCJhdG9tVHJhbnNmb3JtZXIiLCJyZXBsYWNlZFRvcExldmVsQXRvbSIsInJldCIsInZhbCIsInZhbFJlcGxhY2VkIiwicmVwbGFjZU1vbmdvQXRvbVdpdGhNZXRlb3IiLCJzdWJfdHlwZSIsImJ1ZmZlciIsIlVpbnQ4QXJyYXkiLCJmcm9tSlNPTlZhbHVlIiwidW5tYWtlTW9uZ29MZWdhbCIsInN1YnN0ciIsInRoaW5nIiwiU3ltYm9sIiwiYXN5bmNJdGVyYXRvciIsIm5leHQiLCJfbmV4dE9iamVjdFByb21pc2UiLCJkb25lIiwiX3Jhd05leHRPYmplY3RQcm9taXNlIiwiX2Nsb3NpbmciLCJfcGVuZGluZ05leHQiLCJfZGJDdXJzb3IiLCJfdmlzaXRlZElkcyIsIl90cmFuc2Zvcm0iLCJuZXh0T2JqZWN0UHJvbWlzZSIsInRpbWVvdXRQcm9taXNlIiwidGltZW91dElkIiwiZmluYWxseSIsInJhY2UiLCJ0aGlzQXJnIiwiX3Jld2luZCIsImlkeCIsImNhbGwiLCJfc2VsZkZvckl0ZXJhdGlvbiIsInJld2luZCIsImNvdW50Iiwid3JhcFRyYW5zZm9ybSIsImNvdW50QXN5bmMiLCJfbW9uZ28iLCJnZXRUcmFuc2Zvcm0iLCJfcHVibGlzaEN1cnNvciIsInN1YiIsIl9nZXRDb2xsZWN0aW9uTmFtZSIsIm9ic2VydmUiLCJfb2JzZXJ2ZUZyb21PYnNlcnZlQ2hhbmdlcyIsIm9ic2VydmVBc3luYyIsIm9ic2VydmVDaGFuZ2VzIiwiX29ic2VydmVDaGFuZ2VzQ2FsbGJhY2tzQXJlT3JkZXJlZCIsIm9ic2VydmVDaGFuZ2VzQXN5bmMiLCJfc3luY2hyb25vdXNDdXJzb3IiLCJBU1lOQ19DVVJTT1JfTUVUSE9EUyIsIml0ZXJhdG9yIiwibWV0aG9kTmFtZSIsInNldHVwQXN5bmNocm9ub3VzQ3Vyc29yIiwibWV0aG9kTmFtZUFzeW5jIiwiTG9jYWxDb2xsZWN0aW9uRHJpdmVyIiwib3BlbiIsImNvbm4iLCJlbnN1cmVDb2xsZWN0aW9uIiwibm9Db25uQ29sbGVjdGlvbnMiLCJfbW9uZ29fbGl2ZWRhdGFfY29sbGVjdGlvbnMiLCJjcmVhdGUiLCJjb2xsZWN0aW9ucyIsIlJlbW90ZUNvbGxlY3Rpb25Ecml2ZXIiLCJSRU1PVEVfQ09MTEVDVElPTl9NRVRIT0RTIiwibW9uZ29NZXRob2QiLCJBU1lOQ19DT0xMRUNUSU9OX01FVEhPRFMiLCJhc3luY01ldGhvZE5hbWUiLCJtb25nb1VybCIsImRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyIiwib25jZSIsImNvbm5lY3Rpb25PcHRpb25zIiwiTU9OR09fVVJMIiwiTU9OR09fT1BMT0dfVVJMIiwic3RhcnR1cCIsImNvbm5lY3QiLCJDb2xsZWN0aW9uRXh0ZW5zaW9ucyIsIl9leHRlbnNpb25zIiwiX3Byb3RvdHlwZU1ldGhvZHMiLCJfc3RhdGljTWV0aG9kcyIsImFkZEV4dGVuc2lvbiIsImV4dGVuc2lvbiIsImFkZFByb3RvdHlwZU1ldGhvZCIsImFkZFN0YXRpY01ldGhvZCIsInJlbW92ZUV4dGVuc2lvbiIsInJlbW92ZVByb3RvdHlwZU1ldGhvZCIsInJlbW92ZVN0YXRpY01ldGhvZCIsImNsZWFyRXh0ZW5zaW9ucyIsImdldEV4dGVuc2lvbnMiLCJnZXRQcm90b3R5cGVNZXRob2RzIiwiZ2V0U3RhdGljTWV0aG9kcyIsIl9hcHBseUV4dGVuc2lvbnMiLCJpbnN0YW5jZSIsIl9hcHBseVN0YXRpY01ldGhvZHMiLCJDb2xsZWN0aW9uQ29uc3RydWN0b3IiLCJJRF9HRU5FUkFUT1JTIiwidmFsaWRhdGVDb2xsZWN0aW9uTmFtZSIsIm5vcm1hbGl6ZU9wdGlvbnMiLCJfbWFrZU5ld0lEIiwiaWRHZW5lcmF0aW9uIiwicmVzb2x2ZXJUeXBlIiwiX2Nvbm5lY3Rpb24iLCJzZXR1cENvbm5lY3Rpb24iLCJzZXR1cERyaXZlciIsIl9kcml2ZXIiLCJfY29sbGVjdGlvbiIsIl9uYW1lIiwiX3NldHRpbmdVcFJlcGxpY2F0aW9uUHJvbWlzZSIsIl9tYXliZVNldFVwUmVwbGljYXRpb24iLCJzZXR1cE11dGF0aW9uTWV0aG9kcyIsInNldHVwQXV0b3B1Ymxpc2giLCJfY29sbGVjdGlvbnMiLCJfZ2V0RmluZFNlbGVjdG9yIiwiX2dldEZpbmRPcHRpb25zIiwibmV3T3B0aW9ucyIsIm5vcm1hbGl6ZVByb2plY3Rpb24iLCJPcHRpb25hbCIsIk51bWJlciIsImZhbGxiYWNrSWQiLCJfc2VsZWN0b3JJc0lkIiwiUmFuZG9tIiwiUmVwbGljYXRpb25NZXRob2RzIiwiU3luY01ldGhvZHMiLCJBc3luY01ldGhvZHMiLCJJbmRleE1ldGhvZHMiLCJfaXNSZW1vdGVDb2xsZWN0aW9uIiwic2VydmVyIiwicmF3RGF0YWJhc2UiLCJnZXRDb2xsZWN0aW9uIiwiTW9uZ29JRCIsIkFsbG93RGVueSIsIkNvbGxlY3Rpb25Qcm90b3R5cGUiLCJNT05HTyIsInNyYyIsIkREUCIsInJhbmRvbVN0cmVhbSIsImluc2VjdXJlIiwiaGV4U3RyaW5nIiwiU1RSSU5HIiwiY29ubmVjdGlvbiIsImF1dG9wdWJsaXNoIiwiX3ByZXZlbnRBdXRvcHVibGlzaCIsInB1Ymxpc2giLCJpc19hdXRvIiwiZGVmaW5lTXV0YXRpb25NZXRob2RzIiwiX2RlZmluZU11dGF0aW9uTWV0aG9kcyIsInVzZUV4aXN0aW5nIiwiX3N1cHByZXNzU2FtZU5hbWVFcnJvciIsIm1ldGhvZHMiLCJtYW5hZ2VyIiwiY2xlYW5lZE9wdGlvbnMiLCJmcm9tRW50cmllcyIsIl8iLCJ2IiwiX2luc2VydEFzeW5jIiwiZ2V0UHJvdG90eXBlT2YiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzIiwiZ2VuZXJhdGVJZCIsImVuY2xvc2luZyIsIl9DdXJyZW50TWV0aG9kSW52b2NhdGlvbiIsImNob29zZVJldHVyblZhbHVlRnJvbUNvbGxlY3Rpb25SZXN1bHQiLCJfY2FsbE11dGF0b3JNZXRob2RBc3luYyIsInN0dWJQcm9taXNlIiwic2VydmVyUHJvbWlzZSIsIm9wdGlvbnNBbmRDYWxsYmFjayIsIkxvZyIsImRlYnVnIiwicmVDcmVhdGVJbmRleE9uT3B0aW9uTWlzbWF0Y2giLCJpbmZvIiwicmVnaXN0ZXJTdG9yZVJlc3VsdCIsInJlZ2lzdGVyU3RvcmVDbGllbnQiLCJyZWdpc3RlclN0b3JlU2VydmVyIiwid3JhcHBlZFN0b3JlQ29tbW9uIiwic2F2ZU9yaWdpbmFscyIsInJldHJpZXZlT3JpZ2luYWxzIiwiX2dldENvbGxlY3Rpb24iLCJ3cmFwcGVkU3RvcmVDbGllbnQiLCJiZWdpblVwZGF0ZSIsImJhdGNoU2l6ZSIsInJlc2V0IiwicGF1c2VPYnNlcnZlcnMiLCJ1cGRhdGUiLCJtc2ciLCJtb25nb0lkIiwiaWRQYXJzZSIsIl9kb2NzIiwiX3JlZiIsImluc2VydCIsImVuZFVwZGF0ZSIsInJlc3VtZU9ic2VydmVyc0NsaWVudCIsImdldERvYyIsImZpbmRPbmUiLCJ3cmFwcGVkU3RvcmVTZXJ2ZXIiLCJyZXN1bWVPYnNlcnZlcnNTZXJ2ZXIiLCJsb2dXYXJuIiwibG9nIiwib2siLCJfaW5zZXJ0Iiwid3JhcHBlZENhbGxiYWNrIiwid3JhcENhbGxiYWNrIiwiX2NhbGxNdXRhdG9yTWV0aG9kIiwicG9wQ2FsbGJhY2tGcm9tQXJncyIsImNvbnZlcnRSZXN1bHQiLCJzZXRDb25uZWN0aW9uT3B0aW9ucyIsIm90aGVyT3B0aW9ucyIsIm5leHRPYnNlcnZlSGFuZGxlSWQiLCJfY2hhbmdlZCIsIl9tb3ZlZEJlZm9yZSIsIl9yZW1vdmVkIiwiYmVmb3JlIiwidGltZW91dCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUE4QztBQUNPO0FBQ087QUFDbkI7QUFFekNBLGlCQUFpQkMsT0FBT0QsY0FBYyxHQUFHLENBQUM7QUFFMUNBLGVBQWVFLGFBQWEsR0FBRztBQUUvQkYsZUFBZUcsVUFBVSxHQUFHO0lBQzFCQyxTQUFTO1FBQ1BDLFNBQVNDO1FBQ1RDLFFBQVFDO0lBQ1Y7QUFDRjtBQUVBLDZDQUE2QztBQUM3QywwRUFBMEU7QUFDMUUsb0JBQW9CO0FBQ3BCLDBCQUEw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SSxZQUFZLEdBQUcsU0FBZ0J6TSxFQUFFLEVBQUU2TSxNQUFNLEVBQUU2bkIsTUFBTTs7d0JBQ3BELE1BQU16bUIsVUFBVXFILEtBQUssQ0FBQ3RWLElBQUk2TTtvQkFDNUI7O1lBQ0Y7UUFDRjtRQUVBLElBQUksQ0FBQy9KLFFBQVEsR0FBRztRQUNoQixJQUFJLENBQUNxRyxHQUFHLEdBQUdtckI7UUFDWCxJQUFJLENBQUNub0Isb0JBQW9CLEdBQUdBO1FBRTVCLElBQUksQ0FBQ0ksZUFBZSxHQUFHLElBQUlySCxRQUFRNEU7WUFDakMsTUFBTW1CLFFBQVE7Z0JBQ1puQjtnQkFDQSxJQUFJLENBQUN5QyxlQUFlLEdBQUdySCxRQUFRNEUsT0FBTztZQUN4QztZQUVBLE1BQU02cUIsVUFBVXJ2QixXQUFXMkYsT0FBTztZQUVsQyxJQUFJLENBQUNtQyx1QkFBdUIsR0FBRztnQkFDN0JuQztnQkFDQTdGLGFBQWF1dkI7WUFDZjtRQUNGO0lBQ0Y7QUFVRiIsImZpbGUiOiIvcGFja2FnZXMvbW9uZ28uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPcGxvZ0hhbmRsZSB9IGZyb20gJy4vb3Bsb2dfdGFpbGluZyc7XG5pbXBvcnQgeyBNb25nb0Nvbm5lY3Rpb24gfSBmcm9tICcuL21vbmdvX2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHsgT3Bsb2dPYnNlcnZlRHJpdmVyIH0gZnJvbSAnLi9vcGxvZ19vYnNlcnZlX2RyaXZlcic7XG5pbXBvcnQgeyBNb25nb0RCIH0gZnJvbSAnLi9tb25nb19jb21tb24nO1xuXG5Nb25nb0ludGVybmFscyA9IGdsb2JhbC5Nb25nb0ludGVybmFscyA9IHt9O1xuXG5Nb25nb0ludGVybmFscy5fX3BhY2thZ2VOYW1lID0gJ21vbmdvJztcblxuTW9uZ29JbnRlcm5hbHMuTnBtTW9kdWxlcyA9IHtcbiAgbW9uZ29kYjoge1xuICAgIHZlcnNpb246IE5wbU1vZHVsZU1vbmdvZGJWZXJzaW9uLFxuICAgIG1vZHVsZTogTW9uZ29EQlxuICB9XG59O1xuXG4vLyBPbGRlciB2ZXJzaW9uIG9mIHdoYXQgaXMgbm93IGF2YWlsYWJsZSB2aWFcbi8vIE1vbmdvSW50ZXJuYWxzLk5wbU1vZHVsZXMubW9uZ29kYi5tb2R1bGUuICBJdCB3YXMgbmV2ZXIgZG9jdW1lbnRlZCwgYnV0XG4vLyBwZW9wbGUgZG8gdXNlIGl0LlxuLy8gWFhYIENPTVBBVCBXSVRIIDEuMC4zLjJcbk1vbmdvSW50ZXJuYWxzLk5wbU1vZHVsZSA9IG5ldyBQcm94eShNb25nb0RCLCB7XG4gIGdldCh0YXJnZXQsIHByb3BlcnR5S2V5LCByZWNlaXZlcikge1xuICAgIGlmIChwcm9wZXJ0eUtleSA9PT0gJ09iamVjdElEJykge1xuICAgICAgTWV0ZW9yLmRlcHJlY2F0ZShcbiAgICAgICAgYEFjY2Vzc2luZyAnTW9uZ29JbnRlcm5hbHMuTnBtTW9kdWxlLk9iamVjdElEJyBkaXJlY3RseSBpcyBkZXByZWNhdGVkLiBgICtcbiAgICAgICAgYFVzZSAnTW9uZ29JbnRlcm5hbHMuTnBtTW9kdWxlLk9iamVjdElkJyBpbnN0ZWFkLmBcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBSZWZsZWN0LmdldCh0YXJnZXQsIHByb3BlcnR5S2V5LCByZWNlaXZlcik7XG4gIH0sXG59KTtcblxuTW9uZ29JbnRlcm5hbHMuT3Bsb2dIYW5kbGUgPSBPcGxvZ0hhbmRsZTtcblxuTW9uZ29JbnRlcm5hbHMuQ29ubmVjdGlvbiA9IE1vbmdvQ29ubmVjdGlvbjtcblxuTW9uZ29JbnRlcm5hbHMuT3Bsb2dPYnNlcnZlRHJpdmVyID0gT3Bsb2dPYnNlcnZlRHJpdmVyO1xuXG4vLyBUaGlzIGlzIHVzZWQgdG8gYWRkIG9yIHJlbW92ZSBFSlNPTiBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgZXZlcnl0aGluZyBuZXN0ZWRcbi8vIGluc2lkZSBhbiBFSlNPTiBjdXN0b20gdHlwZS4gSXQgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIG9uIHB1cmUgSlNPTiFcblxuXG4vLyBFbnN1cmUgdGhhdCBFSlNPTi5jbG9uZSBrZWVwcyBhIFRpbWVzdGFtcCBhcyBhIFRpbWVzdGFtcCAoaW5zdGVhZCBvZiBqdXN0XG4vLyBkb2luZyBhIHN0cnVjdHVyYWwgY2xvbmUpLlxuLy8gWFhYIGhvdyBvayBpcyB0aGlzPyB3aGF0IGlmIHRoZXJlIGFyZSBtdWx0aXBsZSBjb3BpZXMgb2YgTW9uZ29EQiBsb2FkZWQ/XG5Nb25nb0RCLlRpbWVzdGFtcC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gIC8vIFRpbWVzdGFtcHMgc2hvdWxkIGJlIGltbXV0YWJsZS5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBMaXN0ZW4gZm9yIHRoZSBpbnZhbGlkYXRpb24gbWVzc2FnZXMgdGhhdCB3aWxsIHRyaWdnZXIgdXMgdG8gcG9sbCB0aGVcbi8vIGRhdGFiYXNlIGZvciBjaGFuZ2VzLiBJZiB0aGlzIHNlbGVjdG9yIHNwZWNpZmllcyBzcGVjaWZpYyBJRHMsIHNwZWNpZnkgdGhlbVxuLy8gaGVyZSwgc28gdGhhdCB1cGRhdGVzIHRvIGRpZmZlcmVudCBzcGVjaWZpYyBJRHMgZG9uJ3QgY2F1c2UgdXMgdG8gcG9sbC5cbi8vIGxpc3RlbkNhbGxiYWNrIGlzIHRoZSBzYW1lIGtpbmQgb2YgKG5vdGlmaWNhdGlvbiwgY29tcGxldGUpIGNhbGxiYWNrIHBhc3NlZFxuLy8gdG8gSW52YWxpZGF0aW9uQ3Jvc3NiYXIubGlzdGVuLlxuXG5leHBvcnQgY29uc3QgbGlzdGVuQWxsID0gYXN5bmMgZnVuY3Rpb24gKGN1cnNvckRlc2NyaXB0aW9uLCBsaXN0ZW5DYWxsYmFjaykge1xuICBjb25zdCBsaXN0ZW5lcnMgPSBbXTtcbiAgYXdhaXQgZm9yRWFjaFRyaWdnZXIoY3Vyc29yRGVzY3JpcHRpb24sIGZ1bmN0aW9uICh0cmlnZ2VyKSB7XG4gICAgbGlzdGVuZXJzLnB1c2goRERQU2VydmVyLl9JbnZhbGlkYXRpb25Dcm9zc2Jhci5saXN0ZW4oXG4gICAgICB0cmlnZ2VyLCBsaXN0ZW5DYWxsYmFjaykpO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgICBsaXN0ZW5lci5zdG9wKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59O1xuXG5leHBvcnQgY29uc3QgZm9yRWFjaFRyaWdnZXIgPSBhc3luYyBmdW5jdGlvbiAoY3Vyc29yRGVzY3JpcHRpb24sIHRyaWdnZXJDYWxsYmFjaykge1xuICBjb25zdCBrZXkgPSB7Y29sbGVjdGlvbjogY3Vyc29yRGVzY3JpcHRpb24uY29sbGVjdGlvbk5hbWV9O1xuICBjb25zdCBzcGVjaWZpY0lkcyA9IExvY2FsQ29sbGVjdGlvbi5faWRzTWF0Y2hlZEJ5U2VsZWN0b3IoXG4gICAgY3Vyc29yRGVzY3JpcHRpb24uc2VsZWN0b3IpO1xuICBpZiAoc3BlY2lmaWNJZHMpIHtcbiAgICBmb3IgKGNvbnN0IGlkIG9mIHNwZWNpZmljSWRzKSB7XG4gICAgICBhd2FpdCB0cmlnZ2VyQ2FsbGJhY2soT2JqZWN0LmFzc2lnbih7aWQ6IGlkfSwga2V5KSk7XG4gICAgfVxuICAgIGF3YWl0IHRyaWdnZXJDYWxsYmFjayhPYmplY3QuYXNzaWduKHtkcm9wQ29sbGVjdGlvbjogdHJ1ZSwgaWQ6IG51bGx9LCBrZXkpKTtcbiAgfSBlbHNlIHtcbiAgICBhd2FpdCB0cmlnZ2VyQ2FsbGJhY2soa2V5KTtcbiAgfVxuICAvLyBFdmVyeW9uZSBjYXJlcyBhYm91dCB0aGUgZGF0YWJhc2UgYmVpbmcgZHJvcHBlZC5cbiAgYXdhaXQgdHJpZ2dlckNhbGxiYWNrKHsgZHJvcERhdGFiYXNlOiB0cnVlIH0pO1xufTtcblxuXG5cbi8vIFhYWCBXZSBwcm9iYWJseSBuZWVkIHRvIGZpbmQgYSBiZXR0ZXIgd2F5IHRvIGV4cG9zZSB0aGlzLiBSaWdodCBub3dcbi8vIGl0J3Mgb25seSB1c2VkIGJ5IHRlc3RzLCBidXQgaW4gZmFjdCB5b3UgbmVlZCBpdCBpbiBub3JtYWxcbi8vIG9wZXJhdGlvbiB0byBpbnRlcmFjdCB3aXRoIGNhcHBlZCBjb2xsZWN0aW9ucy5cbk1vbmdvSW50ZXJuYWxzLk1vbmdvVGltZXN0YW1wID0gTW9uZ29EQi5UaW1lc3RhbXA7XG4iLCJpbXBvcnQgaXNFbXB0eSBmcm9tICdsb2Rhc2guaXNlbXB0eSc7XG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IEN1cnNvckRlc2NyaXB0aW9uIH0gZnJvbSAnLi9jdXJzb3JfZGVzY3JpcHRpb24nO1xuaW1wb3J0IHsgTW9uZ29Db25uZWN0aW9uIH0gZnJvbSAnLi9tb25nb19jb25uZWN0aW9uJztcblxuaW1wb3J0IHsgTnBtTW9kdWxlTW9uZ29kYiB9IGZyb20gXCJtZXRlb3IvbnBtLW1vbmdvXCI7XG5jb25zdCB7IExvbmcgfSA9IE5wbU1vZHVsZU1vbmdvZGI7XG5cbmV4cG9ydCBjb25zdCBPUExPR19DT0xMRUNUSU9OID0gJ29wbG9nLnJzJztcblxubGV0IFRPT19GQVJfQkVISU5EID0gKyhwcm9jZXNzLmVudi5NRVRFT1JfT1BMT0dfVE9PX0ZBUl9CRUhJTkQgfHwgMjAwMCk7XG5jb25zdCBUQUlMX1RJTUVPVVQgPSArKHByb2Nlc3MuZW52Lk1FVEVPUl9PUExPR19UQUlMX1RJTUVPVVQgfHwgMzAwMDApO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wbG9nRW50cnkge1xuICBvcDogc3RyaW5nO1xuICBvOiBhbnk7XG4gIG8yPzogYW55O1xuICB0czogYW55O1xuICBuczogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENhdGNoaW5nVXBSZXNvbHZlciB7XG4gIHRzOiBhbnk7XG4gIHJlc29sdmVyOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9wbG9nVHJpZ2dlciB7XG4gIGRyb3BDb2xsZWN0aW9uOiBib29sZWFuO1xuICBkcm9wRGF0YWJhc2U6IGJvb2xlYW47XG4gIG9wOiBPcGxvZ0VudHJ5O1xuICBjb2xsZWN0aW9uPzogc3RyaW5nO1xuICBpZD86IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBPcGxvZ0hhbmRsZSB7XG4gIHByaXZhdGUgX29wbG9nVXJsOiBzdHJpbmc7XG4gIHB1YmxpYyBfZGJOYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgX29wbG9nTGFzdEVudHJ5Q29ubmVjdGlvbjogTW9uZ29Db25uZWN0aW9uIHwgbnVsbDtcbiAgcHJpdmF0ZSBfb3Bsb2dUYWlsQ29ubmVjdGlvbjogTW9uZ29Db25uZWN0aW9uIHwgbnVsbDtcbiAgcHJpdmF0ZSBfb3Bsb2dPcHRpb25zOiB7XG4gICAgZXhjbHVkZUNvbGxlY3Rpb25zPzogc3RyaW5nW107XG4gICAgaW5jbHVkZUNvbGxlY3Rpb25zPzogc3RyaW5nW107XG4gIH07XG4gIHByaXZhdGUgX2luY2x1ZGVOU1JlZ2V4PzogUmVnRXhwO1xuICBwcml2YXRlIF9leGNsdWRlTlNSZWdleD86IFJlZ0V4cDtcbiAgcHJpdmF0ZSBfc3RvcHBlZDogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfdGFpbEhhbmRsZTogYW55O1xuICBwcml2YXRlIF9yZWFkeVByb21pc2VSZXNvbHZlcjogKCgpID0+IHZvaWQpIHwgbnVsbDtcbiAgcHJpdmF0ZSBfcmVhZHlQcm9taXNlOiBQcm9taXNlPHZvaWQ+O1xuICBwdWJsaWMgX2Nyb3NzYmFyOiBhbnk7XG4gIHByaXZhdGUgX2NhdGNoaW5nVXBSZXNvbHZlcnM6IENhdGNoaW5nVXBSZXNvbHZlcltdO1xuICBwcml2YXRlIF9sYXN0UHJvY2Vzc2VkVFM6IGFueTtcbiAgcHJpdmF0ZSBfb25Ta2lwcGVkRW50cmllc0hvb2s6IGFueTtcbiAgcHJpdmF0ZSBfc3RhcnRUcmFpbGluZ1Byb21pc2U6IFByb21pc2U8dm9pZD47XG4gIHByaXZhdGUgX3Jlc29sdmVUaW1lb3V0OiBhbnk7XG5cbiAgcHJpdmF0ZSBfZW50cnlRdWV1ZSA9IG5ldyBNZXRlb3IuX0RvdWJsZUVuZGVkUXVldWUoKTtcbiAgcHJpdmF0ZSBfd29ya2VyQWN0aXZlID0gZmFsc2U7XG4gIHByaXZhdGUgX3dvcmtlclByb21pc2U6IFByb21pc2U8dm9pZD4gfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihvcGxvZ1VybDogc3RyaW5nLCBkYk5hbWU6IHN0cmluZykge1xuICAgIHRoaXMuX29wbG9nVXJsID0gb3Bsb2dVcmw7XG4gICAgdGhpcy5fZGJOYW1lID0gZGJOYW1lO1xuXG4gICAgdGhpcy5fcmVzb2x2ZVRpbWVvdXQgPSBudWxsO1xuICAgIHRoaXMuX29wbG9nTGFzdEVudHJ5Q29ubmVjdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fb3Bsb2dUYWlsQ29ubmVjdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fc3RvcHBlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3RhaWxIYW5kbGUgPSBudWxsO1xuICAgIHRoaXMuX3JlYWR5UHJvbWlzZVJlc29sdmVyID0gbnVsbDtcbiAgICB0aGlzLl9yZWFkeVByb21pc2UgPSBuZXcgUHJvbWlzZShyID0+IHRoaXMuX3JlYWR5UHJvbWlzZVJlc29sdmVyID0gcik7IFxuICAgIHRoaXMuX2Nyb3NzYmFyID0gbmV3IEREUFNlcnZlci5fQ3Jvc3NiYXIoe1xuICAgICAgZmFjdFBhY2thZ2U6IFwibW9uZ28tbGl2ZWRhdGFcIiwgZmFjdE5hbWU6IFwib3Bsb2ctd2F0Y2hlcnNcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgaW5jbHVkZUNvbGxlY3Rpb25zID1cbiAgICAgIE1ldGVvci5zZXR0aW5ncz8ucGFja2FnZXM/Lm1vbmdvPy5vcGxvZ0luY2x1ZGVDb2xsZWN0aW9ucztcbiAgICBjb25zdCBleGNsdWRlQ29sbGVjdGlvbnMgPVxuICAgICAgTWV0ZW9yLnNldHRpbmdzPy5wYWNrYWdlcz8ubW9uZ28/Lm9wbG9nRXhjbHVkZUNvbGxlY3Rpb25zO1xuICAgIGlmIChpbmNsdWRlQ29sbGVjdGlvbnM/Lmxlbmd0aCAmJiBleGNsdWRlQ29sbGVjdGlvbnM/Lmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIkNhbid0IHVzZSBib3RoIG1vbmdvIG9wbG9nIHNldHRpbmdzIG9wbG9nSW5jbHVkZUNvbGxlY3Rpb25zIGFuZCBvcGxvZ0V4Y2x1ZGVDb2xsZWN0aW9ucyBhdCB0aGUgc2FtZSB0aW1lLlwiXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLl9vcGxvZ09wdGlvbnMgPSB7IGluY2x1ZGVDb2xsZWN0aW9ucywgZXhjbHVkZUNvbGxlY3Rpb25zIH07XG5cbiAgICBpZiAoaW5jbHVkZUNvbGxlY3Rpb25zPy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGluY0FsdCA9IGluY2x1ZGVDb2xsZWN0aW9ucy5tYXAoKGMpID0+IE1ldGVvci5fZXNjYXBlUmVnRXhwKGMpKS5qb2luKCd8Jyk7XG5cbiAgICAgIHRoaXMuX2luY2x1ZGVOU1JlZ2V4ID0gbmV3IFJlZ0V4cChgXiR7TWV0ZW9yLl9lc2NhcGVSZWdFeHAodGhpcy5fZGJOYW1lKX1cXFxcLig/OiR7aW5jQWx0fSkkYCk7XG4gICAgfVxuXG4gICAgaWYgKGV4Y2x1ZGVDb2xsZWN0aW9ucz8ubGVuZ3RoKSB7XG4gICAgICBjb25zdCBleGNBbHQgPSBleGNsdWRlQ29sbGVjdGlvbnMubWFwKChjKSA9PiBNZXRlb3IuX2VzY2FwZVJlZ0V4cChjKSkuam9pbignfCcpO1xuXG4gICAgICB0aGlzLl9leGNsdWRlTlNSZWdleCA9IG5ldyBSZWdFeHAoYF4ke01ldGVvci5fZXNjYXBlUmVnRXhwKHRoaXMuX2RiTmFtZSl9XFxcXC4oPzoke2V4Y0FsdH0pJGApO1xuICAgIH1cblxuICAgIHRoaXMuX2NhdGNoaW5nVXBSZXNvbHZlcnMgPSBbXTtcbiAgICB0aGlzLl9sYXN0UHJvY2Vzc2VkVFMgPSBudWxsO1xuXG4gICAgdGhpcy5fb25Ta2lwcGVkRW50cmllc0hvb2sgPSBuZXcgSG9vayh7XG4gICAgICBkZWJ1Z1ByaW50RXhjZXB0aW9uczogXCJvblNraXBwZWRFbnRyaWVzIGNhbGxiYWNrXCJcbiAgICB9KTtcblxuICAgIHRoaXMuX3N0YXJ0VHJhaWxpbmdQcm9taXNlID0gdGhpcy5fc3RhcnRUYWlsaW5nKCk7XG4gIH1cblxuICAgIHByaXZhdGUgX25zQWxsb3dlZChuczogc3RyaW5nIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XG4gICAgaWYgKCFucykgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChucyA9PT0gJ2FkbWluLiRjbWQnKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAodGhpcy5faW5jbHVkZU5TUmVnZXggJiYgIXRoaXMuX2luY2x1ZGVOU1JlZ2V4LnRlc3QobnMpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHRoaXMuX2V4Y2x1ZGVOU1JlZ2V4ICYmIHRoaXMuX2V4Y2x1ZGVOU1JlZ2V4LnRlc3QobnMpKSByZXR1cm4gZmFsc2U7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldE9wbG9nU2VsZWN0b3IobGFzdFByb2Nlc3NlZFRTPzogYW55KTogYW55IHtcbiAgICBjb25zdCBvcGxvZ0NyaXRlcmlhOiBhbnkgPSBbXG4gICAgICB7XG4gICAgICAgICRvcjogW1xuICAgICAgICAgIHsgb3A6IHsgJGluOiBbXCJpXCIsIFwidVwiLCBcImRcIl0gfSB9LFxuICAgICAgICAgIHsgb3A6IFwiY1wiLCBcIm8uZHJvcFwiOiB7ICRleGlzdHM6IHRydWUgfSB9LFxuICAgICAgICAgIHsgb3A6IFwiY1wiLCBcIm8uZHJvcERhdGFiYXNlXCI6IDEgfSxcbiAgICAgICAgICB7IG9wOiBcImNcIiwgXCJvLmFwcGx5T3BzXCI6IHsgJGV4aXN0czogdHJ1ZSB9IH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIF07XG5cbiAgICBpZiAodGhpcy5fb3Bsb2dPcHRpb25zLmV4Y2x1ZGVDb2xsZWN0aW9ucz8ubGVuZ3RoKSB7XG4gICAgICBjb25zdCBuc1JlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgICAgICAgJ14oPzonICtcbiAgICAgICAgICBbXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBNZXRlb3IuX2VzY2FwZVJlZ0V4cCh0aGlzLl9kYk5hbWUgKyAnLicpLFxuICAgICAgICAgIF0uam9pbignfCcpICtcbiAgICAgICAgICAnKSdcbiAgICAgICk7XG4gICAgICBjb25zdCBleGNsdWRlTnMgPSB7XG4gICAgICAgICRyZWdleDogbnNSZWdleCxcbiAgICAgICAgJG5pbjogdGhpcy5fb3Bsb2dPcHRpb25zLmV4Y2x1ZGVDb2xsZWN0aW9ucy5tYXAoXG4gICAgICAgICAgKGNvbGxOYW1lOiBzdHJpbmcpID0+IGAke3RoaXMuX2RiTmFtZX0uJHtjb2xsTmFtZX1gXG4gICAgICAgICksXG4gICAgICB9O1xuICAgICAgb3Bsb2dDcml0ZXJpYS5wdXNoKHtcbiAgICAgICAgJG9yOiBbXG4gICAgICAgICAgeyBuczogZXhjbHVkZU5zIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbnM6IC9eYWRtaW5cXC5cXCRjbWQvLFxuICAgICAgICAgICAgJ28uYXBwbHlPcHMnOiB7ICRlbGVtTWF0Y2g6IHsgbnM6IGV4Y2x1ZGVOcyB9IH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fb3Bsb2dPcHRpb25zLmluY2x1ZGVDb2xsZWN0aW9ucz8ubGVuZ3RoKSB7XG4gICAgICBjb25zdCBpbmNsdWRlTnMgPSB7XG4gICAgICAgICRpbjogdGhpcy5fb3Bsb2dPcHRpb25zLmluY2x1ZGVDb2xsZWN0aW9ucy5tYXAoXG4gICAgICAgICAgKGNvbGxOYW1lOiBzdHJpbmcpID0+IGAke3RoaXMuX2RiTmFtZX0uJHtjb2xsTmFtZX1gXG4gICAgICAgICksXG4gICAgICB9O1xuICAgICAgb3Bsb2dDcml0ZXJpYS5wdXNoKHtcbiAgICAgICAgJG9yOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbnM6IGluY2x1ZGVOcyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgbnM6IC9eYWRtaW5cXC5cXCRjbWQvLCAnby5hcHBseU9wcy5ucyc6IGluY2x1ZGVOcyB9LFxuICAgICAgICBdLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG5zUmVnZXggPSBuZXcgUmVnRXhwKFxuICAgICAgICBcIl4oPzpcIiArXG4gICAgICAgICAgW1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgTWV0ZW9yLl9lc2NhcGVSZWdFeHAodGhpcy5fZGJOYW1lICsgXCIuXCIpLFxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgTWV0ZW9yLl9lc2NhcGVSZWdFeHAoXCJhZG1pbi4kY21kXCIpLFxuICAgICAgICAgIF0uam9pbihcInxcIikgK1xuICAgICAgICAgIFwiKVwiXG4gICAgICApO1xuICAgICAgb3Bsb2dDcml0ZXJpYS5wdXNoKHtcbiAgICAgICAgbnM6IG5zUmVnZXgsXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYobGFzdFByb2Nlc3NlZFRTKSB7XG4gICAgICBvcGxvZ0NyaXRlcmlhLnB1c2goe1xuICAgICAgICB0czogeyAkZ3Q6IGxhc3RQcm9jZXNzZWRUUyB9LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICRhbmQ6IG9wbG9nQ3JpdGVyaWEsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuX3N0b3BwZWQpIHJldHVybjtcbiAgICB0aGlzLl9zdG9wcGVkID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5fdGFpbEhhbmRsZSkge1xuICAgICAgYXdhaXQgdGhpcy5fdGFpbEhhbmRsZS5zdG9wKCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgX29uT3Bsb2dFbnRyeSh0cmlnZ2VyOiBPcGxvZ1RyaWdnZXIsIGNhbGxiYWNrOiBGdW5jdGlvbik6IFByb21pc2U8eyBzdG9wOiAoKSA9PiBQcm9taXNlPHZvaWQ+IH0+IHtcbiAgICBpZiAodGhpcy5fc3RvcHBlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FsbGVkIG9uT3Bsb2dFbnRyeSBvbiBzdG9wcGVkIGhhbmRsZSFcIik7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5fcmVhZHlQcm9taXNlO1xuXG4gICAgY29uc3Qgb3JpZ2luYWxDYWxsYmFjayA9IGNhbGxiYWNrO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBkZXBlbmRzIG9uIEFzeW5jaHJvbm91c1F1ZXVlIHRhc2tzIGJlaW5nIHdyYXBwZWQgaW4gYGJpbmRFbnZpcm9ubWVudGAgdG9vLlxuICAgICAqXG4gICAgICogQHRvZG8gQ2hlY2sgYWZ0ZXIgd2Ugc2ltcGxpZnkgdGhlIGBiaW5kRW52aXJvbm1lbnRgIGltcGxlbWVudGF0aW9uIGlmIHdlIGNhbiByZW1vdmUgdGhlIHNlY29uZCB3cmFwLlxuICAgICAqL1xuICAgIGNhbGxiYWNrID0gTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChcbiAgICAgIGZ1bmN0aW9uIChub3RpZmljYXRpb246IGFueSkge1xuICAgICAgICBvcmlnaW5hbENhbGxiYWNrKG5vdGlmaWNhdGlvbik7XG4gICAgICB9LFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBNZXRlb3IuX2RlYnVnKFwiRXJyb3IgaW4gb3Bsb2cgY2FsbGJhY2tcIiwgZXJyKTtcbiAgICAgIH1cbiAgICApO1xuXG4gICAgY29uc3QgbGlzdGVuSGFuZGxlID0gdGhpcy5fY3Jvc3NiYXIubGlzdGVuKHRyaWdnZXIsIGNhbGxiYWNrKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RvcDogYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCBsaXN0ZW5IYW5kbGUuc3RvcCgpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBvbk9wbG9nRW50cnkodHJpZ2dlcjogT3Bsb2dUcmlnZ2VyLCBjYWxsYmFjazogRnVuY3Rpb24pOiBQcm9taXNlPHsgc3RvcDogKCkgPT4gUHJvbWlzZTx2b2lkPiB9PiB7XG4gICAgcmV0dXJuIHRoaXMuX29uT3Bsb2dFbnRyeSh0cmlnZ2VyLCBjYWxsYmFjayk7XG4gIH1cblxuICBvblNraXBwZWRFbnRyaWVzKGNhbGxiYWNrOiBGdW5jdGlvbik6IHsgc3RvcDogKCkgPT4gdm9pZCB9IHtcbiAgICBpZiAodGhpcy5fc3RvcHBlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FsbGVkIG9uU2tpcHBlZEVudHJpZXMgb24gc3RvcHBlZCBoYW5kbGUhXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fb25Ta2lwcGVkRW50cmllc0hvb2sucmVnaXN0ZXIoY2FsbGJhY2spO1xuICB9XG5cbiAgYXN5bmMgX3dhaXRVbnRpbENhdWdodFVwKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9zdG9wcGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYWxsZWQgd2FpdFVudGlsQ2F1Z2h0VXAgb24gc3RvcHBlZCBoYW5kbGUhXCIpO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuX3JlYWR5UHJvbWlzZTtcblxuICAgIGxldCBsYXN0RW50cnk6IE9wbG9nRW50cnkgfCBudWxsID0gbnVsbDtcblxuICAgIHdoaWxlICghdGhpcy5fc3RvcHBlZCkge1xuICAgICAgY29uc3Qgb3Bsb2dTZWxlY3RvciA9IHRoaXMuX2dldE9wbG9nU2VsZWN0b3IoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxhc3RFbnRyeSA9IGF3YWl0IHRoaXMuX29wbG9nTGFzdEVudHJ5Q29ubmVjdGlvbi5maW5kT25lQXN5bmMoXG4gICAgICAgICAgT1BMT0dfQ09MTEVDVElPTixcbiAgICAgICAgICBvcGxvZ1NlbGVjdG9yLFxuICAgICAgICAgIHsgcHJvamVjdGlvbjogeyB0czogMSB9LCBzb3J0OiB7ICRuYXR1cmFsOiAtMSB9IH1cbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIE1ldGVvci5fZGVidWcoXCJHb3QgZXhjZXB0aW9uIHdoaWxlIHJlYWRpbmcgbGFzdCBlbnRyeVwiLCBlKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBhd2FpdCBNZXRlb3Iuc2xlZXAoMTAwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fc3RvcHBlZCkgcmV0dXJuO1xuXG4gICAgaWYgKCFsYXN0RW50cnkpIHJldHVybjtcblxuICAgIGNvbnN0IHRzID0gbGFzdEVudHJ5LnRzO1xuICAgIGlmICghdHMpIHtcbiAgICAgIHRocm93IEVycm9yKFwib3Bsb2cgZW50cnkgd2l0aG91dCB0czogXCIgKyBKU09OLnN0cmluZ2lmeShsYXN0RW50cnkpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fbGFzdFByb2Nlc3NlZFRTICYmIHRzLmxlc3NUaGFuT3JFcXVhbCh0aGlzLl9sYXN0UHJvY2Vzc2VkVFMpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGluc2VydEFmdGVyID0gdGhpcy5fY2F0Y2hpbmdVcFJlc29sdmVycy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaW5zZXJ0QWZ0ZXIgLSAxID4gMCAmJiB0aGlzLl9jYXRjaGluZ1VwUmVzb2x2ZXJzW2luc2VydEFmdGVyIC0gMV0udHMuZ3JlYXRlclRoYW4odHMpKSB7XG4gICAgICBpbnNlcnRBZnRlci0tO1xuICAgIH1cblxuICAgIGxldCBwcm9taXNlUmVzb2x2ZXIgPSBudWxsO1xuXG4gICAgY29uc3QgcHJvbWlzZVRvQXdhaXQgPSBuZXcgUHJvbWlzZShyID0+IHByb21pc2VSZXNvbHZlciA9IHIpO1xuXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX3Jlc29sdmVUaW1lb3V0KTtcblxuICAgIHRoaXMuX3Jlc29sdmVUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiTWV0ZW9yOiBvcGxvZyBjYXRjaGluZyB1cCB0b29rIHRvbyBsb25nXCIsIHsgdHMgfSk7XG4gICAgfSwgMTAwMDApO1xuXG4gICAgdGhpcy5fY2F0Y2hpbmdVcFJlc29sdmVycy5zcGxpY2UoaW5zZXJ0QWZ0ZXIsIDAsIHsgdHMsIHJlc29sdmVyOiBwcm9taXNlUmVzb2x2ZXIhIH0pO1xuXG4gICAgYXdhaXQgcHJvbWlzZVRvQXdhaXQ7XG5cbiAgICBjbGVhclRpbWVvdXQodGhpcy5fcmVzb2x2ZVRpbWVvdXQpO1xuICB9XG5cbiAgYXN5bmMgd2FpdFVudGlsQ2F1Z2h0VXAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuX3dhaXRVbnRpbENhdWdodFVwKCk7XG4gIH1cblxuICBhc3luYyBfc3RhcnRUYWlsaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1vbmdvZGJVcmkgPSByZXF1aXJlKCdtb25nb2RiLXVyaScpO1xuICAgIGlmIChtb25nb2RiVXJpLnBhcnNlKHRoaXMuX29wbG9nVXJsKS5kYXRhYmFzZSAhPT0gJ2xvY2FsJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJE1PTkdPX09QTE9HX1VSTCBtdXN0IGJlIHNldCB0byB0aGUgJ2xvY2FsJyBkYXRhYmFzZSBvZiBhIE1vbmdvIHJlcGxpY2Egc2V0XCIpO1xuICAgIH1cblxuICAgIHRoaXMuX29wbG9nVGFpbENvbm5lY3Rpb24gPSBuZXcgTW9uZ29Db25uZWN0aW9uKFxuICAgICAgdGhpcy5fb3Bsb2dVcmwsIHsgbWF4UG9vbFNpemU6IDEsIG1pblBvb2xTaXplOiAxIH1cbiAgICApO1xuICAgIHRoaXMuX29wbG9nTGFzdEVudHJ5Q29ubmVjdGlvbiA9IG5ldyBNb25nb0Nvbm5lY3Rpb24oXG4gICAgICB0aGlzLl9vcGxvZ1VybCwgeyBtYXhQb29sU2l6ZTogMSwgbWluUG9vbFNpemU6IDEgfVxuICAgICk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgaXNNYXN0ZXJEb2MgPSBhd2FpdCB0aGlzLl9vcGxvZ0xhc3RFbnRyeUNvbm5lY3Rpb24hLmRiXG4gICAgICAgIC5hZG1pbigpXG4gICAgICAgIC5jb21tYW5kKHsgaXNtYXN0ZXI6IDEgfSk7XG5cbiAgICAgIGlmICghKGlzTWFzdGVyRG9jICYmIGlzTWFzdGVyRG9jLnNldE5hbWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIiRNT05HT19PUExPR19VUkwgbXVzdCBiZSBzZXQgdG8gdGhlICdsb2NhbCcgZGF0YWJhc2Ugb2YgYSBNb25nbyByZXBsaWNhIHNldFwiKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGFzdE9wbG9nRW50cnkgPSBhd2FpdCB0aGlzLl9vcGxvZ0xhc3RFbnRyeUNvbm5lY3Rpb24uZmluZE9uZUFzeW5jKFxuICAgICAgICBPUExPR19DT0xMRUNUSU9OLFxuICAgICAgICB7fSxcbiAgICAgICAgeyBzb3J0OiB7ICRuYXR1cmFsOiAtMSB9LCBwcm9qZWN0aW9uOiB7IHRzOiAxIH0gfVxuICAgICAgKTtcblxuICAgICAgY29uc3Qgb3Bsb2dTZWxlY3RvciA9IHRoaXMuX2dldE9wbG9nU2VsZWN0b3IobGFzdE9wbG9nRW50cnk/LnRzKTtcbiAgICAgIGlmIChsYXN0T3Bsb2dFbnRyeSkge1xuICAgICAgICB0aGlzLl9sYXN0UHJvY2Vzc2VkVFMgPSBsYXN0T3Bsb2dFbnRyeS50cztcbiAgICAgIH1cblxuICAgICAgY29uc3QgY3Vyc29yRGVzY3JpcHRpb24gPSBuZXcgQ3Vyc29yRGVzY3JpcHRpb24oXG4gICAgICAgIE9QTE9HX0NPTExFQ1RJT04sXG4gICAgICAgIG9wbG9nU2VsZWN0b3IsXG4gICAgICAgIHsgdGFpbGFibGU6IHRydWUgfVxuICAgICAgKTtcblxuICAgICAgdGhpcy5fdGFpbEhhbmRsZSA9IHRoaXMuX29wbG9nVGFpbENvbm5lY3Rpb24udGFpbChcbiAgICAgICAgY3Vyc29yRGVzY3JpcHRpb24sXG4gICAgICAgIChkb2M6IGFueSkgPT4ge1xuICAgICAgICAgIHRoaXMuX2VudHJ5UXVldWUucHVzaChkb2MpO1xuICAgICAgICAgIHRoaXMuX21heWJlU3RhcnRXb3JrZXIoKTtcbiAgICAgICAgfSxcbiAgICAgICAgVEFJTF9USU1FT1VUXG4gICAgICApO1xuXG4gICAgICB0aGlzLl9yZWFkeVByb21pc2VSZXNvbHZlciEoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gX3N0YXJ0VGFpbGluZzonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9tYXliZVN0YXJ0V29ya2VyKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl93b3JrZXJQcm9taXNlKSByZXR1cm47XG4gICAgdGhpcy5fd29ya2VyQWN0aXZlID0gdHJ1ZTtcblxuICAgIC8vIENvbnZlcnQgdG8gYSBwcm9wZXIgcHJvbWlzZS1iYXNlZCBxdWV1ZSBwcm9jZXNzb3JcbiAgICB0aGlzLl93b3JrZXJQcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHdoaWxlICghdGhpcy5fc3RvcHBlZCAmJiAhdGhpcy5fZW50cnlRdWV1ZS5pc0VtcHR5KCkpIHtcbiAgICAgICAgICAvLyBBcmUgd2UgdG9vIGZhciBiZWhpbmQ/IEp1c3QgdGVsbCBvdXIgb2JzZXJ2ZXJzIHRoYXQgdGhleSBuZWVkIHRvXG4gICAgICAgICAgLy8gcmVwb2xsLCBhbmQgZHJvcCBvdXIgcXVldWUuXG4gICAgICAgICAgaWYgKHRoaXMuX2VudHJ5UXVldWUubGVuZ3RoID4gVE9PX0ZBUl9CRUhJTkQpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhc3RFbnRyeSA9IHRoaXMuX2VudHJ5UXVldWUucG9wKCk7XG4gICAgICAgICAgICB0aGlzLl9lbnRyeVF1ZXVlLmNsZWFyKCk7XG5cbiAgICAgICAgICAgIHRoaXMuX29uU2tpcHBlZEVudHJpZXNIb29rLmVhY2goKGNhbGxiYWNrOiBGdW5jdGlvbikgPT4ge1xuICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBGcmVlIGFueSB3YWl0VW50aWxDYXVnaHRVcCgpIGNhbGxzIHRoYXQgd2VyZSB3YWl0aW5nIGZvciB1cyB0b1xuICAgICAgICAgICAgLy8gcGFzcyBzb21ldGhpbmcgdGhhdCB3ZSBqdXN0IHNraXBwZWQuXG4gICAgICAgICAgICB0aGlzLl9zZXRMYXN0UHJvY2Vzc2VkVFMobGFzdEVudHJ5LnRzKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFByb2Nlc3MgbmV4dCBiYXRjaCBmcm9tIHRoZSBxdWV1ZVxuICAgICAgICAgIGNvbnN0IGRvYyA9IHRoaXMuX2VudHJ5UXVldWUuc2hpZnQoKTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBoYW5kbGVEb2ModGhpcywgZG9jKTtcbiAgICAgICAgICAgIC8vIFByb2Nlc3MgYW55IHdhaXRpbmcgZmVuY2UgY2FsbGJhY2tzXG4gICAgICAgICAgICBpZiAoZG9jLnRzKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3NldExhc3RQcm9jZXNzZWRUUyhkb2MudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIEtlZXAgcHJvY2Vzc2luZyBxdWV1ZSBldmVuIGlmIG9uZSBlbnRyeSBmYWlsc1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcHJvY2Vzc2luZyBvcGxvZyBlbnRyeTonLCBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRoaXMuX3dvcmtlclByb21pc2UgPSBudWxsO1xuICAgICAgICB0aGlzLl93b3JrZXJBY3RpdmUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9KSgpO1xuICB9XG5cbiAgX3NldExhc3RQcm9jZXNzZWRUUyh0czogYW55KTogdm9pZCB7XG4gICAgdGhpcy5fbGFzdFByb2Nlc3NlZFRTID0gdHM7XG4gICAgd2hpbGUgKCFpc0VtcHR5KHRoaXMuX2NhdGNoaW5nVXBSZXNvbHZlcnMpICYmIHRoaXMuX2NhdGNoaW5nVXBSZXNvbHZlcnNbMF0udHMubGVzc1RoYW5PckVxdWFsKHRoaXMuX2xhc3RQcm9jZXNzZWRUUykpIHtcbiAgICAgIGNvbnN0IHNlcXVlbmNlciA9IHRoaXMuX2NhdGNoaW5nVXBSZXNvbHZlcnMuc2hpZnQoKSE7XG4gICAgICBzZXF1ZW5jZXIucmVzb2x2ZXIoKTtcbiAgICB9XG4gIH1cblxuICBfZGVmaW5lVG9vRmFyQmVoaW5kKHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgICBUT09fRkFSX0JFSElORCA9IHZhbHVlO1xuICB9XG5cbiAgX3Jlc2V0VG9vRmFyQmVoaW5kKCk6IHZvaWQge1xuICAgIFRPT19GQVJfQkVISU5EID0gKyhwcm9jZXNzLmVudi5NRVRFT1JfT1BMT0dfVE9PX0ZBUl9CRUhJTkQgfHwgMjAwMCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlkRm9yT3Aob3A6IE9wbG9nRW50cnkpOiBzdHJpbmcge1xuICBpZiAob3Aub3AgPT09ICdkJyB8fCBvcC5vcCA9PT0gJ2knKSB7XG4gICAgcmV0dXJuIG9wLm8uX2lkO1xuICB9IGVsc2UgaWYgKG9wLm9wID09PSAndScpIHtcbiAgICByZXR1cm4gb3AubzIuX2lkO1xuICB9IGVsc2UgaWYgKG9wLm9wID09PSAnYycpIHtcbiAgICB0aHJvdyBFcnJvcihcIk9wZXJhdG9yICdjJyBkb2Vzbid0IHN1cHBseSBhbiBvYmplY3Qgd2l0aCBpZDogXCIgKyBKU09OLnN0cmluZ2lmeShvcCkpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKFwiVW5rbm93biBvcDogXCIgKyBKU09OLnN0cmluZ2lmeShvcCkpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZURvYyhoYW5kbGU6IE9wbG9nSGFuZGxlLCBkb2M6IE9wbG9nRW50cnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKGRvYy5ucyA9PT0gXCJhZG1pbi4kY21kXCIpIHtcbiAgICBpZiAoZG9jLm8uYXBwbHlPcHMpIHtcbiAgICAgIC8vIFRoaXMgd2FzIGEgc3VjY2Vzc2Z1bCB0cmFuc2FjdGlvbiwgc28gd2UgbmVlZCB0byBhcHBseSB0aGVcbiAgICAgIC8vIG9wZXJhdGlvbnMgdGhhdCB3ZXJlIGludm9sdmVkLlxuICAgICAgbGV0IG5leHRUaW1lc3RhbXAgPSBkb2MudHM7XG4gICAgICBmb3IgKGNvbnN0IG9wIG9mIGRvYy5vLmFwcGx5T3BzKSB7XG4gICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9pc3N1ZXMvMTA0MjAuXG4gICAgICAgIGlmICghb3AudHMpIHtcbiAgICAgICAgICBvcC50cyA9IG5leHRUaW1lc3RhbXA7XG4gICAgICAgICAgbmV4dFRpbWVzdGFtcCA9IG5leHRUaW1lc3RhbXAuYWRkKExvbmcuT05FKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBPbmx5IGZvcndhcmQgc3ViLW9wcyB3aG9zZSBucyBpcyBhbGxvd2VkXG4gICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9pc3N1ZXMvMTM5NDVcbiAgICAgICAgaWYgKCFoYW5kbGVbJ19uc0FsbG93ZWQnXShvcC5ucykpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBoYW5kbGVEb2MoaGFuZGxlLCBvcCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gY29tbWFuZCBcIiArIEpTT04uc3RyaW5naWZ5KGRvYykpO1xuICB9XG5cbiAgY29uc3QgdHJpZ2dlcjogT3Bsb2dUcmlnZ2VyID0ge1xuICAgIGRyb3BDb2xsZWN0aW9uOiBmYWxzZSxcbiAgICBkcm9wRGF0YWJhc2U6IGZhbHNlLFxuICAgIG9wOiBkb2MsXG4gIH07XG5cbiAgaWYgKHR5cGVvZiBkb2MubnMgPT09IFwic3RyaW5nXCIgJiYgZG9jLm5zLnN0YXJ0c1dpdGgoaGFuZGxlLl9kYk5hbWUgKyBcIi5cIikpIHtcbiAgICB0cmlnZ2VyLmNvbGxlY3Rpb24gPSBkb2MubnMuc2xpY2UoaGFuZGxlLl9kYk5hbWUubGVuZ3RoICsgMSk7XG4gIH1cblxuICAvLyBJcyBpdCBhIHNwZWNpYWwgY29tbWFuZCBhbmQgdGhlIGNvbGxlY3Rpb24gbmFtZSBpcyBoaWRkZW5cbiAgLy8gc29tZXdoZXJlIGluIG9wZXJhdG9yP1xuICBpZiAodHJpZ2dlci5jb2xsZWN0aW9uID09PSBcIiRjbWRcIikge1xuICAgIGlmIChkb2Muby5kcm9wRGF0YWJhc2UpIHtcbiAgICAgIGRlbGV0ZSB0cmlnZ2VyLmNvbGxlY3Rpb247XG4gICAgICB0cmlnZ2VyLmRyb3BEYXRhYmFzZSA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChcImRyb3BcIiBpbiBkb2Mubykge1xuICAgICAgdHJpZ2dlci5jb2xsZWN0aW9uID0gZG9jLm8uZHJvcDtcbiAgICAgIHRyaWdnZXIuZHJvcENvbGxlY3Rpb24gPSB0cnVlO1xuICAgICAgdHJpZ2dlci5pZCA9IG51bGw7XG4gICAgfSBlbHNlIGlmIChcImNyZWF0ZVwiIGluIGRvYy5vICYmIFwiaWRJbmRleFwiIGluIGRvYy5vKSB7XG4gICAgICAvLyBBIGNvbGxlY3Rpb24gZ290IGltcGxpY2l0bHkgY3JlYXRlZCB3aXRoaW4gYSB0cmFuc2FjdGlvbi4gVGhlcmUnc1xuICAgICAgLy8gbm8gbmVlZCB0byBkbyBhbnl0aGluZyBhYm91dCBpdC5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoXCJVbmtub3duIGNvbW1hbmQgXCIgKyBKU09OLnN0cmluZ2lmeShkb2MpKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gQWxsIG90aGVyIG9wcyBoYXZlIGFuIGlkLlxuICAgIHRyaWdnZXIuaWQgPSBpZEZvck9wKGRvYyk7XG4gIH1cblxuICBhd2FpdCBoYW5kbGUuX2Nyb3NzYmFyLmZpcmUodHJpZ2dlcik7XG5cbiAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRJbW1lZGlhdGUocmVzb2x2ZSkpO1xufSIsImltcG9ydCBpc0VtcHR5IGZyb20gXCJsb2Rhc2guaXNlbXB0eVwiO1xuaW1wb3J0IHsgT2JzZXJ2ZUhhbmRsZSB9IGZyb20gXCIuL29ic2VydmVfaGFuZGxlXCI7XG5cbmludGVyZmFjZSBPYnNlcnZlTXVsdGlwbGV4ZXJPcHRpb25zIHtcbiAgb3JkZXJlZDogYm9vbGVhbjtcbiAgb25TdG9wPzogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IHR5cGUgT2JzZXJ2ZUhhbmRsZUNhbGxiYWNrID1cbiAgfCBcImFkZGVkXCJcbiAgfCBcImFkZGVkQmVmb3JlXCJcbiAgfCBcImNoYW5nZWRcIlxuICB8IFwibW92ZWRCZWZvcmVcIlxuICB8IFwicmVtb3ZlZFwiO1xuXG4vKipcbiAqIEFsbG93cyBtdWx0aXBsZSBpZGVudGljYWwgT2JzZXJ2ZUhhbmRsZXMgdG8gYmUgZHJpdmVuIGJ5IGEgc2luZ2xlIG9ic2VydmUgZHJpdmVyLlxuICpcbiAqIFRoaXMgb3B0aW1pemF0aW9uIGVuc3VyZXMgdGhhdCBtdWx0aXBsZSBpZGVudGljYWwgb2JzZXJ2YXRpb25zXG4gKiBkb24ndCByZXN1bHQgaW4gZHVwbGljYXRlIGRhdGFiYXNlIHF1ZXJpZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBPYnNlcnZlTXVsdGlwbGV4ZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IF9vcmRlcmVkOiBib29sZWFuO1xuICBwcml2YXRlIHJlYWRvbmx5IF9vblN0b3A6ICgpID0+IHZvaWQ7XG4gIHByaXZhdGUgX3F1ZXVlOiBhbnk7XG4gIHByaXZhdGUgX2hhbmRsZXM6IHsgW2tleTogc3RyaW5nXTogT2JzZXJ2ZUhhbmRsZSB9IHwgbnVsbDtcbiAgcHJpdmF0ZSBfcmVzb2x2ZXI6ICgodmFsdWU/OiB1bmtub3duKSA9PiB2b2lkKSB8IG51bGw7XG4gIHByaXZhdGUgcmVhZG9ubHkgX3JlYWR5UHJvbWlzZTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD47XG4gIHByaXZhdGUgX2lzUmVhZHk6IGJvb2xlYW47XG4gIHByaXZhdGUgX2NhY2hlOiBhbnk7XG4gIHByaXZhdGUgX2FkZEhhbmRsZVRhc2tzU2NoZWR1bGVkQnV0Tm90UGVyZm9ybWVkOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoeyBvcmRlcmVkLCBvblN0b3AgPSAoKSA9PiB7fSB9OiBPYnNlcnZlTXVsdGlwbGV4ZXJPcHRpb25zKSB7XG4gICAgaWYgKG9yZGVyZWQgPT09IHVuZGVmaW5lZCkgdGhyb3cgRXJyb3IoXCJtdXN0IHNwZWNpZnkgb3JkZXJlZFwiKTtcblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBQYWNrYWdlW1wiZmFjdHMtYmFzZVwiXSAmJlxuICAgICAgUGFja2FnZVtcImZhY3RzLWJhc2VcIl0uRmFjdHMuaW5jcmVtZW50U2VydmVyRmFjdChcbiAgICAgICAgXCJtb25nby1saXZlZGF0YVwiLFxuICAgICAgICBcIm9ic2VydmUtbXVsdGlwbGV4ZXJzXCIsXG4gICAgICAgIDFcbiAgICAgICk7XG5cbiAgICB0aGlzLl9vcmRlcmVkID0gb3JkZXJlZDtcbiAgICB0aGlzLl9vblN0b3AgPSBvblN0b3A7XG4gICAgdGhpcy5fcXVldWUgPSBuZXcgTWV0ZW9yLl9Bc3luY2hyb25vdXNRdWV1ZSgpO1xuICAgIHRoaXMuX2hhbmRsZXMgPSB7fTtcbiAgICB0aGlzLl9yZXNvbHZlciA9IG51bGw7XG4gICAgdGhpcy5faXNSZWFkeSA9IGZhbHNlO1xuICAgIHRoaXMuX3JlYWR5UHJvbWlzZSA9IG5ldyBQcm9taXNlKChyKSA9PiAodGhpcy5fcmVzb2x2ZXIgPSByKSkudGhlbihcbiAgICAgICgpID0+ICh0aGlzLl9pc1JlYWR5ID0gdHJ1ZSlcbiAgICApO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB0aGlzLl9jYWNoZSA9IG5ldyBMb2NhbENvbGxlY3Rpb24uX0NhY2hpbmdDaGFuZ2VPYnNlcnZlcih7IG9yZGVyZWQgfSk7XG4gICAgdGhpcy5fYWRkSGFuZGxlVGFza3NTY2hlZHVsZWRCdXROb3RQZXJmb3JtZWQgPSAwO1xuXG4gICAgdGhpcy5jYWxsYmFja05hbWVzKCkuZm9yRWFjaCgoY2FsbGJhY2tOYW1lKSA9PiB7XG4gICAgICAodGhpcyBhcyBhbnkpW2NhbGxiYWNrTmFtZV0gPSAoLi4uYXJnczogYW55W10pID0+IHtcbiAgICAgICAgdGhpcy5fYXBwbHlDYWxsYmFjayhjYWxsYmFja05hbWUsIGFyZ3MpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGFkZEhhbmRsZUFuZFNlbmRJbml0aWFsQWRkcyhoYW5kbGU6IE9ic2VydmVIYW5kbGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5fYWRkSGFuZGxlQW5kU2VuZEluaXRpYWxBZGRzKGhhbmRsZSk7XG4gIH1cblxuICBhc3luYyBfYWRkSGFuZGxlQW5kU2VuZEluaXRpYWxBZGRzKGhhbmRsZTogT2JzZXJ2ZUhhbmRsZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICsrdGhpcy5fYWRkSGFuZGxlVGFza3NTY2hlZHVsZWRCdXROb3RQZXJmb3JtZWQ7XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgUGFja2FnZVtcImZhY3RzLWJhc2VcIl0gJiZcbiAgICAgIFBhY2thZ2VbXCJmYWN0cy1iYXNlXCJdLkZhY3RzLmluY3JlbWVudFNlcnZlckZhY3QoXG4gICAgICAgIFwibW9uZ28tbGl2ZWRhdGFcIixcbiAgICAgICAgXCJvYnNlcnZlLWhhbmRsZXNcIixcbiAgICAgICAgMVxuICAgICAgKTtcblxuICAgIGF3YWl0IHRoaXMuX3F1ZXVlLnJ1blRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5faGFuZGxlcyFbaGFuZGxlLl9pZF0gPSBoYW5kbGU7XG4gICAgICBhd2FpdCB0aGlzLl9zZW5kQWRkcyhoYW5kbGUpO1xuICAgICAgLS10aGlzLl9hZGRIYW5kbGVUYXNrc1NjaGVkdWxlZEJ1dE5vdFBlcmZvcm1lZDtcbiAgICB9KTtcblxuICAgIGF3YWl0IHRoaXMuX3JlYWR5UHJvbWlzZTtcbiAgfVxuXG4gIGFzeW5jIHJlbW92ZUhhbmRsZShpZDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLl9yZWFkeSgpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgcmVtb3ZlIGhhbmRsZXMgdW50aWwgdGhlIG11bHRpcGxleCBpcyByZWFkeVwiKTtcblxuICAgIGRlbGV0ZSB0aGlzLl9oYW5kbGVzIVtpZF07XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgUGFja2FnZVtcImZhY3RzLWJhc2VcIl0gJiZcbiAgICAgIFBhY2thZ2VbXCJmYWN0cy1iYXNlXCJdLkZhY3RzLmluY3JlbWVudFNlcnZlckZhY3QoXG4gICAgICAgIFwibW9uZ28tbGl2ZWRhdGFcIixcbiAgICAgICAgXCJvYnNlcnZlLWhhbmRsZXNcIixcbiAgICAgICAgLTFcbiAgICAgICk7XG5cbiAgICBpZiAoXG4gICAgICBpc0VtcHR5KHRoaXMuX2hhbmRsZXMpICYmXG4gICAgICB0aGlzLl9hZGRIYW5kbGVUYXNrc1NjaGVkdWxlZEJ1dE5vdFBlcmZvcm1lZCA9PT0gMFxuICAgICkge1xuICAgICAgYXdhaXQgdGhpcy5fc3RvcCgpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIF9zdG9wKG9wdGlvbnM6IHsgZnJvbVF1ZXJ5RXJyb3I/OiBib29sZWFuIH0gPSB7fSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5fcmVhZHkoKSAmJiAhb3B0aW9ucy5mcm9tUXVlcnlFcnJvcilcbiAgICAgIHRocm93IEVycm9yKFwic3VycHJpc2luZyBfc3RvcDogbm90IHJlYWR5XCIpO1xuXG4gICAgYXdhaXQgdGhpcy5fb25TdG9wKCk7XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgUGFja2FnZVtcImZhY3RzLWJhc2VcIl0gJiZcbiAgICAgIFBhY2thZ2VbXCJmYWN0cy1iYXNlXCJdLkZhY3RzLmluY3JlbWVudFNlcnZlckZhY3QoXG4gICAgICAgIFwibW9uZ28tbGl2ZWRhdGFcIixcbiAgICAgICAgXCJvYnNlcnZlLW11bHRpcGxleGVyc1wiLFxuICAgICAgICAtMVxuICAgICAgKTtcblxuICAgIHRoaXMuX2hhbmRsZXMgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgcmVhZHkoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fcXVldWUucXVldWVUYXNrKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLl9yZWFkeSgpKVxuICAgICAgICB0aHJvdyBFcnJvcihcImNhbid0IG1ha2UgT2JzZXJ2ZU11bHRpcGxleCByZWFkeSB0d2ljZSFcIik7XG5cbiAgICAgIGlmICghdGhpcy5fcmVzb2x2ZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyByZXNvbHZlclwiKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcmVzb2x2ZXIoKTtcbiAgICAgIHRoaXMuX2lzUmVhZHkgPSB0cnVlO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgcXVlcnlFcnJvcihlcnI6IEVycm9yKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fcXVldWUucnVuVGFzaygoKSA9PiB7XG4gICAgICBpZiAodGhpcy5fcmVhZHkoKSlcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJjYW4ndCBjbGFpbSBxdWVyeSBoYXMgYW4gZXJyb3IgYWZ0ZXIgaXQgd29ya2VkIVwiKTtcbiAgICAgIHRoaXMuX3N0b3AoeyBmcm9tUXVlcnlFcnJvcjogdHJ1ZSB9KTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIG9uRmx1c2goY2I6ICgpID0+IHZvaWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9xdWV1ZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLl9yZWFkeSgpKVxuICAgICAgICB0aHJvdyBFcnJvcihcIm9ubHkgY2FsbCBvbkZsdXNoIG9uIGEgbXVsdGlwbGV4ZXIgdGhhdCB3aWxsIGJlIHJlYWR5XCIpO1xuICAgICAgYXdhaXQgY2IoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGNhbGxiYWNrTmFtZXMoKTogT2JzZXJ2ZUhhbmRsZUNhbGxiYWNrW10ge1xuICAgIHJldHVybiB0aGlzLl9vcmRlcmVkXG4gICAgICA/IFtcImFkZGVkQmVmb3JlXCIsIFwiY2hhbmdlZFwiLCBcIm1vdmVkQmVmb3JlXCIsIFwicmVtb3ZlZFwiXVxuICAgICAgOiBbXCJhZGRlZFwiLCBcImNoYW5nZWRcIiwgXCJyZW1vdmVkXCJdO1xuICB9XG5cbiAgX3JlYWR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuX2lzUmVhZHk7XG4gIH1cblxuICBfYXBwbHlDYWxsYmFjayhjYWxsYmFja05hbWU6IHN0cmluZywgYXJnczogYW55W10pIHtcbiAgICB0aGlzLl9xdWV1ZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLl9oYW5kbGVzKSByZXR1cm47XG5cbiAgICAgIGF3YWl0IHRoaXMuX2NhY2hlLmFwcGx5Q2hhbmdlW2NhbGxiYWNrTmFtZV0uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICBpZiAoXG4gICAgICAgICF0aGlzLl9yZWFkeSgpICYmXG4gICAgICAgIGNhbGxiYWNrTmFtZSAhPT0gXCJhZGRlZFwiICYmXG4gICAgICAgIGNhbGxiYWNrTmFtZSAhPT0gXCJhZGRlZEJlZm9yZVwiXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBHb3QgJHtjYWxsYmFja05hbWV9IGR1cmluZyBpbml0aWFsIGFkZHNgKTtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBoYW5kbGVJZCBvZiBPYmplY3Qua2V5cyh0aGlzLl9oYW5kbGVzKSkge1xuICAgICAgICBjb25zdCBoYW5kbGUgPSB0aGlzLl9oYW5kbGVzICYmIHRoaXMuX2hhbmRsZXNbaGFuZGxlSWRdO1xuXG4gICAgICAgIGlmICghaGFuZGxlKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgY2FsbGJhY2sgPSAoaGFuZGxlIGFzIGFueSlbYF8ke2NhbGxiYWNrTmFtZX1gXTtcblxuICAgICAgICBpZiAoIWNhbGxiYWNrKSBjb250aW51ZTtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjay5hcHBseShcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIGhhbmRsZS5ub25NdXRhdGluZ0NhbGxiYWNrcyA/IGFyZ3MgOiBFSlNPTi5jbG9uZShhcmdzKVxuICAgICAgICApO1xuXG4gICAgICAgIGlmIChyZXN1bHQgJiYgTWV0ZW9yLl9pc1Byb21pc2UocmVzdWx0KSkge1xuICAgICAgICAgIHJlc3VsdC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgIGBFcnJvciBpbiBvYnNlcnZlQ2hhbmdlcyBjYWxsYmFjayAke2NhbGxiYWNrTmFtZX06YCxcbiAgICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaGFuZGxlLmluaXRpYWxBZGRzU2VudC50aGVuKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBfc2VuZEFkZHMoaGFuZGxlOiBPYnNlcnZlSGFuZGxlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgYWRkID0gdGhpcy5fb3JkZXJlZCA/IGhhbmRsZS5fYWRkZWRCZWZvcmUgOiBoYW5kbGUuX2FkZGVkO1xuICAgIGlmICghYWRkKSByZXR1cm47XG5cbiAgICBjb25zdCBhZGRQcm9taXNlczogKFByb21pc2U8dm9pZD4gfCB2b2lkKVtdID0gW107XG5cbiAgICAvLyBub3RlOiBkb2NzIG1heSBiZSBhbiBfSWRNYXAgb3IgYW4gT3JkZXJlZERpY3RcbiAgICB0aGlzLl9jYWNoZS5kb2NzLmZvckVhY2goKGRvYzogYW55LCBpZDogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoIShoYW5kbGUuX2lkIGluIHRoaXMuX2hhbmRsZXMhKSkge1xuICAgICAgICB0aHJvdyBFcnJvcihcImhhbmRsZSBnb3QgcmVtb3ZlZCBiZWZvcmUgc2VuZGluZyBpbml0aWFsIGFkZHMhXCIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7IF9pZCwgLi4uZmllbGRzIH0gPSBoYW5kbGUubm9uTXV0YXRpbmdDYWxsYmFja3NcbiAgICAgICAgPyBkb2NcbiAgICAgICAgOiBFSlNPTi5jbG9uZShkb2MpO1xuXG4gICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHIgPSB0aGlzLl9vcmRlcmVkID8gYWRkKGlkLCBmaWVsZHMsIG51bGwpIDogYWRkKGlkLCBmaWVsZHMpO1xuICAgICAgICAgIHJlc29sdmUocik7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGFkZFByb21pc2VzLnB1c2gocHJvbWlzZSk7XG4gICAgfSk7XG5cbiAgICBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQoYWRkUHJvbWlzZXMpLnRoZW4oKHApID0+IHtcbiAgICAgIHAuZm9yRWFjaCgocmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChyZXN1bHQuc3RhdHVzID09PSBcInJlamVjdGVkXCIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBpbiBhZGRzIGZvciBoYW5kbGU6ICR7cmVzdWx0LnJlYXNvbn1gKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBoYW5kbGUuaW5pdGlhbEFkZHNTZW50UmVzb2x2ZXIoKTtcbiAgfVxufVxuIiwiZXhwb3J0IGNsYXNzIERvY0ZldGNoZXIge1xuICBjb25zdHJ1Y3Rvcihtb25nb0Nvbm5lY3Rpb24pIHtcbiAgICB0aGlzLl9tb25nb0Nvbm5lY3Rpb24gPSBtb25nb0Nvbm5lY3Rpb247XG4gICAgLy8gTWFwIGZyb20gb3AgLT4gW2NhbGxiYWNrXVxuICAgIHRoaXMuX2NhbGxiYWNrc0Zvck9wID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgLy8gRmV0Y2hlcyBkb2N1bWVudCBcImlkXCIgZnJvbSBjb2xsZWN0aW9uTmFtZSwgcmV0dXJuaW5nIGl0IG9yIG51bGwgaWYgbm90XG4gIC8vIGZvdW5kLlxuICAvL1xuICAvLyBJZiB5b3UgbWFrZSBtdWx0aXBsZSBjYWxscyB0byBmZXRjaCgpIHdpdGggdGhlIHNhbWUgb3AgcmVmZXJlbmNlLFxuICAvLyBEb2NGZXRjaGVyIG1heSBhc3N1bWUgdGhhdCB0aGV5IGFsbCByZXR1cm4gdGhlIHNhbWUgZG9jdW1lbnQuIChJdCBkb2VzXG4gIC8vIG5vdCBjaGVjayB0byBzZWUgaWYgY29sbGVjdGlvbk5hbWUvaWQgbWF0Y2guKVxuICAvL1xuICAvLyBZb3UgbWF5IGFzc3VtZSB0aGF0IGNhbGxiYWNrIGlzIG5ldmVyIGNhbGxlZCBzeW5jaHJvbm91c2x5IChhbmQgaW4gZmFjdFxuICAvLyBPcGxvZ09ic2VydmVEcml2ZXIgZG9lcyBzbykuXG4gIGFzeW5jIGZldGNoKGNvbGxlY3Rpb25OYW1lLCBpZCwgb3AsIGNhbGxiYWNrKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBcbiAgICBjaGVjayhjb2xsZWN0aW9uTmFtZSwgU3RyaW5nKTtcbiAgICBjaGVjayhvcCwgT2JqZWN0KTtcblxuXG4gICAgLy8gSWYgdGhlcmUncyBhbHJlYWR5IGFuIGluLXByb2dyZXNzIGZldGNoIGZvciB0aGlzIGNhY2hlIGtleSwgeWllbGQgdW50aWxcbiAgICAvLyBpdCdzIGRvbmUgYW5kIHJldHVybiB3aGF0ZXZlciBpdCByZXR1cm5zLlxuICAgIGlmIChzZWxmLl9jYWxsYmFja3NGb3JPcC5oYXMob3ApKSB7XG4gICAgICBzZWxmLl9jYWxsYmFja3NGb3JPcC5nZXQob3ApLnB1c2goY2FsbGJhY2spO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNhbGxiYWNrcyA9IFtjYWxsYmFja107XG4gICAgc2VsZi5fY2FsbGJhY2tzRm9yT3Auc2V0KG9wLCBjYWxsYmFja3MpO1xuXG4gICAgdHJ5IHtcbiAgICAgIHZhciBkb2MgPVxuICAgICAgICAoYXdhaXQgc2VsZi5fbW9uZ29Db25uZWN0aW9uLmZpbmRPbmVBc3luYyhjb2xsZWN0aW9uTmFtZSwge1xuICAgICAgICAgIF9pZDogaWQsXG4gICAgICAgIH0pKSB8fCBudWxsO1xuICAgICAgLy8gUmV0dXJuIGRvYyB0byBhbGwgcmVsZXZhbnQgY2FsbGJhY2tzLiBOb3RlIHRoYXQgdGhpcyBhcnJheSBjYW5cbiAgICAgIC8vIGNvbnRpbnVlIHRvIGdyb3cgZHVyaW5nIGNhbGxiYWNrIGV4Y2VjdXRpb24uXG4gICAgICB3aGlsZSAoY2FsbGJhY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gQ2xvbmUgdGhlIGRvY3VtZW50IHNvIHRoYXQgdGhlIHZhcmlvdXMgY2FsbHMgdG8gZmV0Y2ggZG9uJ3QgcmV0dXJuXG4gICAgICAgIC8vIG9iamVjdHMgdGhhdCBhcmUgaW50ZXJ0d2luZ2xlZCB3aXRoIGVhY2ggb3RoZXIuIENsb25lIGJlZm9yZVxuICAgICAgICAvLyBwb3BwaW5nIHRoZSBmdXR1cmUsIHNvIHRoYXQgaWYgY2xvbmUgdGhyb3dzLCB0aGUgZXJyb3IgZ2V0cyBwYXNzZWRcbiAgICAgICAgLy8gdG8gdGhlIG5leHQgY2FsbGJhY2suXG4gICAgICAgIGNhbGxiYWNrcy5wb3AoKShudWxsLCBFSlNPTi5jbG9uZShkb2MpKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB3aGlsZSAoY2FsbGJhY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY2FsbGJhY2tzLnBvcCgpKGUpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBYWFggY29uc2lkZXIga2VlcGluZyB0aGUgZG9jIGFyb3VuZCBmb3IgYSBwZXJpb2Qgb2YgdGltZSBiZWZvcmVcbiAgICAgIC8vIHJlbW92aW5nIGZyb20gdGhlIGNhY2hlXG4gICAgICBzZWxmLl9jYWxsYmFja3NGb3JPcC5kZWxldGUob3ApO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHRocm90dGxlIGZyb20gJ2xvZGFzaC50aHJvdHRsZSc7XG5pbXBvcnQgeyBsaXN0ZW5BbGwgfSBmcm9tICcuL21vbmdvX2RyaXZlcic7XG5pbXBvcnQgeyBPYnNlcnZlTXVsdGlwbGV4ZXIgfSBmcm9tICcuL29ic2VydmVfbXVsdGlwbGV4JztcblxuaW50ZXJmYWNlIFBvbGxpbmdPYnNlcnZlRHJpdmVyT3B0aW9ucyB7XG4gIGN1cnNvckRlc2NyaXB0aW9uOiBhbnk7XG4gIG1vbmdvSGFuZGxlOiBhbnk7XG4gIG9yZGVyZWQ6IGJvb2xlYW47XG4gIG11bHRpcGxleGVyOiBPYnNlcnZlTXVsdGlwbGV4ZXI7XG4gIF90ZXN0T25seVBvbGxDYWxsYmFjaz86ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IFBPTExJTkdfVEhST1RUTEVfTVMgPSArKHByb2Nlc3MuZW52Lk1FVEVPUl9QT0xMSU5HX1RIUk9UVExFX01TIHx8ICcnKSB8fCA1MDtcbmNvbnN0IFBPTExJTkdfSU5URVJWQUxfTVMgPSArKHByb2Nlc3MuZW52Lk1FVEVPUl9QT0xMSU5HX0lOVEVSVkFMX01TIHx8ICcnKSB8fCAxMCAqIDEwMDA7XG5cbi8qKlxuICogQGNsYXNzIFBvbGxpbmdPYnNlcnZlRHJpdmVyXG4gKlxuICogT25lIG9mIHR3byBvYnNlcnZlIGRyaXZlciBpbXBsZW1lbnRhdGlvbnMuXG4gKlxuICogQ2hhcmFjdGVyaXN0aWNzOlxuICogLSBDYWNoZXMgdGhlIHJlc3VsdHMgb2YgYSBxdWVyeVxuICogLSBSZXJ1bnMgdGhlIHF1ZXJ5IHdoZW4gbmVjZXNzYXJ5XG4gKiAtIFN1aXRhYmxlIGZvciBjYXNlcyB3aGVyZSBvcGxvZyB0YWlsaW5nIGlzIG5vdCBhdmFpbGFibGUgb3IgcHJhY3RpY2FsXG4gKi9cbmV4cG9ydCBjbGFzcyBQb2xsaW5nT2JzZXJ2ZURyaXZlciB7XG4gIHByaXZhdGUgX29wdGlvbnM6IFBvbGxpbmdPYnNlcnZlRHJpdmVyT3B0aW9ucztcbiAgcHJpdmF0ZSBfY3Vyc29yRGVzY3JpcHRpb246IGFueTtcbiAgcHJpdmF0ZSBfbW9uZ29IYW5kbGU6IGFueTtcbiAgcHJpdmF0ZSBfb3JkZXJlZDogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfbXVsdGlwbGV4ZXI6IGFueTtcbiAgcHJpdmF0ZSBfc3RvcENhbGxiYWNrczogQXJyYXk8KCkgPT4gUHJvbWlzZTx2b2lkPj47XG4gIHByaXZhdGUgX3N0b3BwZWQ6IGJvb2xlYW47XG4gIHByaXZhdGUgX2N1cnNvcjogYW55O1xuICBwcml2YXRlIF9yZXN1bHRzOiBhbnk7XG4gIHByaXZhdGUgX3BvbGxzU2NoZWR1bGVkQnV0Tm90U3RhcnRlZDogbnVtYmVyO1xuICBwcml2YXRlIF9wZW5kaW5nV3JpdGVzOiBhbnlbXTtcbiAgcHJpdmF0ZSBfZW5zdXJlUG9sbElzU2NoZWR1bGVkOiBGdW5jdGlvbjtcbiAgcHJpdmF0ZSBfdGFza1F1ZXVlOiBhbnk7XG4gIHByaXZhdGUgX3Rlc3RPbmx5UG9sbENhbGxiYWNrPzogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBQb2xsaW5nT2JzZXJ2ZURyaXZlck9wdGlvbnMpIHtcbiAgICB0aGlzLl9vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbiA9IG9wdGlvbnMuY3Vyc29yRGVzY3JpcHRpb247XG4gICAgdGhpcy5fbW9uZ29IYW5kbGUgPSBvcHRpb25zLm1vbmdvSGFuZGxlO1xuICAgIHRoaXMuX29yZGVyZWQgPSBvcHRpb25zLm9yZGVyZWQ7XG4gICAgdGhpcy5fbXVsdGlwbGV4ZXIgPSBvcHRpb25zLm11bHRpcGxleGVyO1xuICAgIHRoaXMuX3N0b3BDYWxsYmFja3MgPSBbXTtcbiAgICB0aGlzLl9zdG9wcGVkID0gZmFsc2U7XG5cbiAgICB0aGlzLl9jdXJzb3IgPSB0aGlzLl9tb25nb0hhbmRsZS5fY3JlYXRlQXN5bmNocm9ub3VzQ3Vyc29yKFxuICAgICAgdGhpcy5fY3Vyc29yRGVzY3JpcHRpb24pO1xuXG4gICAgdGhpcy5fcmVzdWx0cyA9IG51bGw7XG4gICAgdGhpcy5fcG9sbHNTY2hlZHVsZWRCdXROb3RTdGFydGVkID0gMDtcbiAgICB0aGlzLl9wZW5kaW5nV3JpdGVzID0gW107XG5cbiAgICB0aGlzLl9lbnN1cmVQb2xsSXNTY2hlZHVsZWQgPSB0aHJvdHRsZShcbiAgICAgIHRoaXMuX3VudGhyb3R0bGVkRW5zdXJlUG9sbElzU2NoZWR1bGVkLmJpbmQodGhpcyksXG4gICAgICB0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zLnBvbGxpbmdUaHJvdHRsZU1zIHx8IFBPTExJTkdfVEhST1RUTEVfTVNcbiAgICApO1xuXG4gICAgdGhpcy5fdGFza1F1ZXVlID0gbmV3IChNZXRlb3IgYXMgYW55KS5fQXN5bmNocm9ub3VzUXVldWUoKTtcbiAgfVxuXG4gIGFzeW5jIF9pbml0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG9wdGlvbnMgPSB0aGlzLl9vcHRpb25zO1xuICAgIGNvbnN0IGxpc3RlbmVyc0hhbmRsZSA9IGF3YWl0IGxpc3RlbkFsbChcbiAgICAgIHRoaXMuX2N1cnNvckRlc2NyaXB0aW9uLFxuICAgICAgKG5vdGlmaWNhdGlvbjogYW55KSA9PiB7XG4gICAgICAgIGNvbnN0IGZlbmNlID0gKEREUFNlcnZlciBhcyBhbnkpLl9nZXRDdXJyZW50RmVuY2UoKTtcbiAgICAgICAgaWYgKGZlbmNlKSB7XG4gICAgICAgICAgdGhpcy5fcGVuZGluZ1dyaXRlcy5wdXNoKGZlbmNlLmJlZ2luV3JpdGUoKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3BvbGxzU2NoZWR1bGVkQnV0Tm90U3RhcnRlZCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuX2Vuc3VyZVBvbGxJc1NjaGVkdWxlZCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcblxuICAgIHRoaXMuX3N0b3BDYWxsYmFja3MucHVzaChhc3luYyAoKSA9PiB7IGF3YWl0IGxpc3RlbmVyc0hhbmRsZS5zdG9wKCk7IH0pO1xuXG4gICAgaWYgKG9wdGlvbnMuX3Rlc3RPbmx5UG9sbENhbGxiYWNrKSB7XG4gICAgICB0aGlzLl90ZXN0T25seVBvbGxDYWxsYmFjayA9IG9wdGlvbnMuX3Rlc3RPbmx5UG9sbENhbGxiYWNrO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwb2xsaW5nSW50ZXJ2YWwgPVxuICAgICAgICB0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zLnBvbGxpbmdJbnRlcnZhbE1zIHx8XG4gICAgICAgIHRoaXMuX2N1cnNvckRlc2NyaXB0aW9uLm9wdGlvbnMuX3BvbGxpbmdJbnRlcnZhbCB8fFxuICAgICAgICBQT0xMSU5HX0lOVEVSVkFMX01TO1xuXG4gICAgICBjb25zdCBpbnRlcnZhbEhhbmRsZSA9IE1ldGVvci5zZXRJbnRlcnZhbChcbiAgICAgICAgdGhpcy5fZW5zdXJlUG9sbElzU2NoZWR1bGVkLmJpbmQodGhpcyksXG4gICAgICAgIHBvbGxpbmdJbnRlcnZhbFxuICAgICAgKTtcblxuICAgICAgdGhpcy5fc3RvcENhbGxiYWNrcy5wdXNoKCgpID0+IHtcbiAgICAgICAgTWV0ZW9yLmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGUpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5fdW50aHJvdHRsZWRFbnN1cmVQb2xsSXNTY2hlZHVsZWQoKTtcblxuICAgIChQYWNrYWdlWydmYWN0cy1iYXNlJ10gYXMgYW55KT8uRmFjdHMuaW5jcmVtZW50U2VydmVyRmFjdChcbiAgICAgIFwibW9uZ28tbGl2ZWRhdGFcIiwgXCJvYnNlcnZlLWRyaXZlcnMtcG9sbGluZ1wiLCAxKTtcbiAgfVxuXG4gIGFzeW5jIF91bnRocm90dGxlZEVuc3VyZVBvbGxJc1NjaGVkdWxlZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5fcG9sbHNTY2hlZHVsZWRCdXROb3RTdGFydGVkID4gMCkgcmV0dXJuO1xuICAgICsrdGhpcy5fcG9sbHNTY2hlZHVsZWRCdXROb3RTdGFydGVkO1xuICAgIGF3YWl0IHRoaXMuX3Rhc2tRdWV1ZS5ydW5UYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMuX3BvbGxNb25nbygpO1xuICAgIH0pO1xuICB9XG5cbiAgX3N1c3BlbmRQb2xsaW5nKCk6IHZvaWQge1xuICAgICsrdGhpcy5fcG9sbHNTY2hlZHVsZWRCdXROb3RTdGFydGVkO1xuICAgIHRoaXMuX3Rhc2tRdWV1ZS5ydW5UYXNrKCgpID0+IHt9KTtcblxuICAgIGlmICh0aGlzLl9wb2xsc1NjaGVkdWxlZEJ1dE5vdFN0YXJ0ZWQgIT09IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgX3BvbGxzU2NoZWR1bGVkQnV0Tm90U3RhcnRlZCBpcyAke3RoaXMuX3BvbGxzU2NoZWR1bGVkQnV0Tm90U3RhcnRlZH1gKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBfcmVzdW1lUG9sbGluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5fcG9sbHNTY2hlZHVsZWRCdXROb3RTdGFydGVkICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYF9wb2xsc1NjaGVkdWxlZEJ1dE5vdFN0YXJ0ZWQgaXMgJHt0aGlzLl9wb2xsc1NjaGVkdWxlZEJ1dE5vdFN0YXJ0ZWR9YCk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuX3Rhc2tRdWV1ZS5ydW5UYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMuX3BvbGxNb25nbygpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgX3BvbGxNb25nbygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAtLXRoaXMuX3BvbGxzU2NoZWR1bGVkQnV0Tm90U3RhcnRlZDtcblxuICAgIGlmICh0aGlzLl9zdG9wcGVkKSByZXR1cm47XG5cbiAgICBsZXQgZmlyc3QgPSBmYWxzZTtcbiAgICBsZXQgbmV3UmVzdWx0cztcbiAgICBsZXQgb2xkUmVzdWx0cyA9IHRoaXMuX3Jlc3VsdHM7XG5cbiAgICBpZiAoIW9sZFJlc3VsdHMpIHtcbiAgICAgIGZpcnN0ID0gdHJ1ZTtcbiAgICAgIG9sZFJlc3VsdHMgPSB0aGlzLl9vcmRlcmVkID8gW10gOiBuZXcgKExvY2FsQ29sbGVjdGlvbiBhcyBhbnkpLl9JZE1hcDtcbiAgICB9XG5cbiAgICB0aGlzLl90ZXN0T25seVBvbGxDYWxsYmFjaz8uKCk7XG5cbiAgICBjb25zdCB3cml0ZXNGb3JDeWNsZSA9IHRoaXMuX3BlbmRpbmdXcml0ZXM7XG4gICAgdGhpcy5fcGVuZGluZ1dyaXRlcyA9IFtdO1xuXG4gICAgdHJ5IHtcbiAgICAgIG5ld1Jlc3VsdHMgPSBhd2FpdCB0aGlzLl9jdXJzb3IuZ2V0UmF3T2JqZWN0cyh0aGlzLl9vcmRlcmVkKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChmaXJzdCAmJiB0eXBlb2YoZS5jb2RlKSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5fbXVsdGlwbGV4ZXIucXVlcnlFcnJvcihcbiAgICAgICAgICBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgRXhjZXB0aW9uIHdoaWxlIHBvbGxpbmcgcXVlcnkgJHtcbiAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkodGhpcy5fY3Vyc29yRGVzY3JpcHRpb24pXG4gICAgICAgICAgICB9OiAke2UubWVzc2FnZX1gXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLl9wZW5kaW5nV3JpdGVzLCB3cml0ZXNGb3JDeWNsZSk7XG4gICAgICBNZXRlb3IuX2RlYnVnKGBFeGNlcHRpb24gd2hpbGUgcG9sbGluZyBxdWVyeSAke1xuICAgICAgICBKU09OLnN0cmluZ2lmeSh0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbil9YCwgZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9zdG9wcGVkKSB7XG4gICAgICAoTG9jYWxDb2xsZWN0aW9uIGFzIGFueSkuX2RpZmZRdWVyeUNoYW5nZXMoXG4gICAgICAgIHRoaXMuX29yZGVyZWQsIG9sZFJlc3VsdHMsIG5ld1Jlc3VsdHMsIHRoaXMuX211bHRpcGxleGVyKTtcbiAgICB9XG5cbiAgICBpZiAoZmlyc3QpIHRoaXMuX211bHRpcGxleGVyLnJlYWR5KCk7XG5cbiAgICB0aGlzLl9yZXN1bHRzID0gbmV3UmVzdWx0cztcblxuICAgIGF3YWl0IHRoaXMuX211bHRpcGxleGVyLm9uRmx1c2goYXN5bmMgKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCB3IG9mIHdyaXRlc0ZvckN5Y2xlKSB7XG4gICAgICAgIGF3YWl0IHcuY29tbWl0dGVkKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuX3N0b3BwZWQgPSB0cnVlO1xuXG4gICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiB0aGlzLl9zdG9wQ2FsbGJhY2tzKSB7XG4gICAgICBhd2FpdCBjYWxsYmFjaygpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdyBvZiB0aGlzLl9wZW5kaW5nV3JpdGVzKSB7XG4gICAgICBhd2FpdCB3LmNvbW1pdHRlZCgpO1xuICAgIH1cblxuICAgIChQYWNrYWdlWydmYWN0cy1iYXNlJ10gYXMgYW55KT8uRmFjdHMuaW5jcmVtZW50U2VydmVyRmFjdChcbiAgICAgIFwibW9uZ28tbGl2ZWRhdGFcIiwgXCJvYnNlcnZlLWRyaXZlcnMtcG9sbGluZ1wiLCAtMSk7XG4gIH1cbn0iLCJpbXBvcnQgaGFzIGZyb20gJ2xvZGFzaC5oYXMnO1xuaW1wb3J0IGlzRW1wdHkgZnJvbSAnbG9kYXNoLmlzZW1wdHknO1xuaW1wb3J0IHsgb3Bsb2dWMlYxQ29udmVydGVyIH0gZnJvbSBcIi4vb3Bsb2dfdjJfY29udmVydGVyXCI7XG5pbXBvcnQgeyBjaGVjaywgTWF0Y2ggfSBmcm9tICdtZXRlb3IvY2hlY2snO1xuaW1wb3J0IHsgQ3Vyc29yRGVzY3JpcHRpb24gfSBmcm9tICcuL2N1cnNvcl9kZXNjcmlwdGlvbic7XG5pbXBvcnQgeyBmb3JFYWNoVHJpZ2dlciwgbGlzdGVuQWxsIH0gZnJvbSAnLi9tb25nb19kcml2ZXInO1xuaW1wb3J0IHsgQ3Vyc29yIH0gZnJvbSAnLi9jdXJzb3InO1xuaW1wb3J0IExvY2FsQ29sbGVjdGlvbiBmcm9tICdtZXRlb3IvbWluaW1vbmdvL2xvY2FsX2NvbGxlY3Rpb24nO1xuaW1wb3J0IHsgaWRGb3JPcCB9IGZyb20gJy4vb3Bsb2dfdGFpbGluZyc7XG5cbnZhciBQSEFTRSA9IHtcbiAgUVVFUllJTkc6IFwiUVVFUllJTkdcIixcbiAgRkVUQ0hJTkc6IFwiRkVUQ0hJTkdcIixcbiAgU1RFQURZOiBcIlNURUFEWVwiXG59O1xuXG4vLyBFeGNlcHRpb24gdGhyb3duIGJ5IF9uZWVkVG9Qb2xsUXVlcnkgd2hpY2ggdW5yb2xscyB0aGUgc3RhY2sgdXAgdG8gdGhlXG4vLyBlbmNsb3NpbmcgY2FsbCB0byBmaW5pc2hJZk5lZWRUb1BvbGxRdWVyeS5cbnZhciBTd2l0Y2hlZFRvUXVlcnkgPSBmdW5jdGlvbiAoKSB7fTtcbnZhciBmaW5pc2hJZk5lZWRUb1BvbGxRdWVyeSA9IGZ1bmN0aW9uIChmKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGYuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoIShlIGluc3RhbmNlb2YgU3dpdGNoZWRUb1F1ZXJ5KSlcbiAgICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH07XG59O1xuXG52YXIgY3VycmVudElkID0gMDtcblxuLyoqXG4gKiBAY2xhc3MgT3Bsb2dPYnNlcnZlRHJpdmVyXG4gKiBBbiBhbHRlcm5hdGl2ZSB0byBQb2xsaW5nT2JzZXJ2ZURyaXZlciB3aGljaCBmb2xsb3dzIHRoZSBNb25nb0RCIG9wZXJhdGlvbiBsb2dcbiAqIGluc3RlYWQgb2YgcmUtcG9sbGluZyB0aGUgcXVlcnkuXG4gKlxuICogQ2hhcmFjdGVyaXN0aWNzOlxuICogLSBGb2xsb3dzIHRoZSBNb25nb0RCIG9wZXJhdGlvbiBsb2dcbiAqIC0gRGlyZWN0bHkgb2JzZXJ2ZXMgZGF0YWJhc2UgY2hhbmdlc1xuICogLSBNb3JlIGVmZmljaWVudCB0aGFuIHBvbGxpbmcgZm9yIG1vc3QgdXNlIGNhc2VzXG4gKiAtIFJlcXVpcmVzIGFjY2VzcyB0byBNb25nb0RCIG9wbG9nXG4gKlxuICogSW50ZXJmYWNlOlxuICogLSBDb25zdHJ1Y3Rpb24gaW5pdGlhdGVzIG9ic2VydmVDaGFuZ2VzIGNhbGxiYWNrcyBhbmQgcmVhZHkoKSBpbnZvY2F0aW9uIHRvIHRoZSBPYnNlcnZlTXVsdGlwbGV4ZXJcbiAqIC0gT2JzZXJ2YXRpb24gY2FuIGJlIHRlcm1pbmF0ZWQgdmlhIHRoZSBzdG9wKCkgbWV0aG9kXG4gKi9cbmV4cG9ydCBjb25zdCBPcGxvZ09ic2VydmVEcml2ZXIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICBjb25zdCBzZWxmID0gdGhpcztcbiAgc2VsZi5fdXNlc09wbG9nID0gdHJ1ZTsgIC8vIHRlc3RzIGxvb2sgYXQgdGhpc1xuXG4gIHNlbGYuX2lkID0gY3VycmVudElkO1xuICBjdXJyZW50SWQrKztcblxuICBzZWxmLl9jdXJzb3JEZXNjcmlwdGlvbiA9IG9wdGlvbnMuY3Vyc29yRGVzY3JpcHRpb247XG4gIHNlbGYuX21vbmdvSGFuZGxlID0gb3B0aW9ucy5tb25nb0hhbmRsZTtcbiAgc2VsZi5fbXVsdGlwbGV4ZXIgPSBvcHRpb25zLm11bHRpcGxleGVyO1xuXG4gIGlmIChvcHRpb25zLm9yZGVyZWQpIHtcbiAgICB0aHJvdyBFcnJvcihcIk9wbG9nT2JzZXJ2ZURyaXZlciBvbmx5IHN1cHBvcnRzIHVub3JkZXJlZCBvYnNlcnZlQ2hhbmdlc1wiKTtcbiAgfVxuXG4gIGNvbnN0IHNvcnRlciA9IG9wdGlvbnMuc29ydGVyO1xuICAvLyBXZSBkb24ndCBzdXBwb3J0ICRuZWFyIGFuZCBvdGhlciBnZW8tcXVlcmllcyBzbyBpdCdzIE9LIHRvIGluaXRpYWxpemUgdGhlXG4gIC8vIGNvbXBhcmF0b3Igb25seSBvbmNlIGluIHRoZSBjb25zdHJ1Y3Rvci5cbiAgY29uc3QgY29tcGFyYXRvciA9IHNvcnRlciAmJiBzb3J0ZXIuZ2V0Q29tcGFyYXRvcigpO1xuXG4gIGlmIChvcHRpb25zLmN1cnNvckRlc2NyaXB0aW9uLm9wdGlvbnMubGltaXQpIHtcbiAgICAvLyBUaGVyZSBhcmUgc2V2ZXJhbCBwcm9wZXJ0aWVzIG9yZGVyZWQgZHJpdmVyIGltcGxlbWVudHM6XG4gICAgLy8gLSBfbGltaXQgaXMgYSBwb3NpdGl2ZSBudW1iZXJcbiAgICAvLyAtIF9jb21wYXJhdG9yIGlzIGEgZnVuY3Rpb24tY29tcGFyYXRvciBieSB3aGljaCB0aGUgcXVlcnkgaXMgb3JkZXJlZFxuICAgIC8vIC0gX3VucHVibGlzaGVkQnVmZmVyIGlzIG5vbi1udWxsIE1pbi9NYXggSGVhcCxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICB0aGUgZW1wdHkgYnVmZmVyIGluIFNURUFEWSBwaGFzZSBpbXBsaWVzIHRoYXQgdGhlXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgZXZlcnl0aGluZyB0aGF0IG1hdGNoZXMgdGhlIHF1ZXJpZXMgc2VsZWN0b3IgZml0c1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgIGludG8gcHVibGlzaGVkIHNldC5cbiAgICAvLyAtIF9wdWJsaXNoZWQgLSBNYXggSGVhcCAoYWxzbyBpbXBsZW1lbnRzIElkTWFwIG1ldGhvZHMpXG5cbiAgICBjb25zdCBoZWFwT3B0aW9ucyA9IHsgSWRNYXA6IExvY2FsQ29sbGVjdGlvbi5fSWRNYXAgfTtcbiAgICBzZWxmLl9saW1pdCA9IHNlbGYuX2N1cnNvckRlc2NyaXB0aW9uLm9wdGlvbnMubGltaXQ7XG4gICAgc2VsZi5fY29tcGFyYXRvciA9IGNvbXBhcmF0b3I7XG4gICAgc2VsZi5fc29ydGVyID0gc29ydGVyO1xuICAgIHNlbGYuX3VucHVibGlzaGVkQnVmZmVyID0gbmV3IE1pbk1heEhlYXAoY29tcGFyYXRvciwgaGVhcE9wdGlvbnMpO1xuICAgIC8vIFdlIG5lZWQgc29tZXRoaW5nIHRoYXQgY2FuIGZpbmQgTWF4IHZhbHVlIGluIGFkZGl0aW9uIHRvIElkTWFwIGludGVyZmFjZVxuICAgIHNlbGYuX3B1Ymxpc2hlZCA9IG5ldyBNYXhIZWFwKGNvbXBhcmF0b3IsIGhlYXBPcHRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICBzZWxmLl9saW1pdCA9IDA7XG4gICAgc2VsZi5fY29tcGFyYXRvciA9IG51bGw7XG4gICAgc2VsZi5fc29ydGVyID0gbnVsbDtcbiAgICBzZWxmLl91bnB1Ymxpc2hlZEJ1ZmZlciA9IG51bGw7XG4gICAgLy8gTWVtb3J5IEdyb3d0aFxuICAgIHNlbGYuX3B1Ymxpc2hlZCA9IG5ldyBMb2NhbENvbGxlY3Rpb24uX0lkTWFwO1xuICB9XG5cbiAgLy8gSW5kaWNhdGVzIGlmIGl0IGlzIHNhZmUgdG8gaW5zZXJ0IGEgbmV3IGRvY3VtZW50IGF0IHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICAvLyBmb3IgdGhpcyBxdWVyeS4gaS5lLiBpdCBpcyBrbm93biB0aGF0IHRoZXJlIGFyZSBubyBkb2N1bWVudHMgbWF0Y2hpbmcgdGhlXG4gIC8vIHNlbGVjdG9yIHRob3NlIGFyZSBub3QgaW4gcHVibGlzaGVkIG9yIGJ1ZmZlci5cbiAgc2VsZi5fc2FmZUFwcGVuZFRvQnVmZmVyID0gZmFsc2U7XG5cbiAgc2VsZi5fc3RvcHBlZCA9IGZhbHNlO1xuICBzZWxmLl9zdG9wSGFuZGxlcyA9IFtdO1xuICBzZWxmLl9hZGRTdG9wSGFuZGxlcyA9IGZ1bmN0aW9uIChuZXdTdG9wSGFuZGxlcykge1xuICAgIGNvbnN0IGV4cGVjdGVkUGF0dGVybiA9IE1hdGNoLk9iamVjdEluY2x1ZGluZyh7IHN0b3A6IEZ1bmN0aW9uIH0pO1xuICAgIC8vIFNpbmdsZSBpdGVtIG9yIGFycmF5XG4gICAgY2hlY2sobmV3U3RvcEhhbmRsZXMsIE1hdGNoLk9uZU9mKFtleHBlY3RlZFBhdHRlcm5dLCBleHBlY3RlZFBhdHRlcm4pKTtcbiAgICBzZWxmLl9zdG9wSGFuZGxlcy5wdXNoKG5ld1N0b3BIYW5kbGVzKTtcbiAgfVxuXG4gIFBhY2thZ2VbJ2ZhY3RzLWJhc2UnXSAmJiBQYWNrYWdlWydmYWN0cy1iYXNlJ10uRmFjdHMuaW5jcmVtZW50U2VydmVyRmFjdChcbiAgICBcIm1vbmdvLWxpdmVkYXRhXCIsIFwib2JzZXJ2ZS1kcml2ZXJzLW9wbG9nXCIsIDEpO1xuXG4gIHNlbGYuX3JlZ2lzdGVyUGhhc2VDaGFuZ2UoUEhBU0UuUVVFUllJTkcpO1xuXG4gIHNlbGYuX21hdGNoZXIgPSBvcHRpb25zLm1hdGNoZXI7XG4gIC8vIHdlIGFyZSBub3cgdXNpbmcgcHJvamVjdGlvbiwgbm90IGZpZWxkcyBpbiB0aGUgY3Vyc29yIGRlc2NyaXB0aW9uIGV2ZW4gaWYgeW91IHBhc3Mge2ZpZWxkc31cbiAgLy8gaW4gdGhlIGN1cnNvciBjb25zdHJ1Y3Rpb25cbiAgY29uc3QgcHJvamVjdGlvbiA9IHNlbGYuX2N1cnNvckRlc2NyaXB0aW9uLm9wdGlvbnMuZmllbGRzIHx8IHNlbGYuX2N1cnNvckRlc2NyaXB0aW9uLm9wdGlvbnMucHJvamVjdGlvbiB8fCB7fTtcbiAgc2VsZi5fcHJvamVjdGlvbkZuID0gTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlUHJvamVjdGlvbihwcm9qZWN0aW9uKTtcbiAgLy8gUHJvamVjdGlvbiBmdW5jdGlvbiwgcmVzdWx0IG9mIGNvbWJpbmluZyBpbXBvcnRhbnQgZmllbGRzIGZvciBzZWxlY3RvciBhbmRcbiAgLy8gZXhpc3RpbmcgZmllbGRzIHByb2plY3Rpb25cbiAgc2VsZi5fc2hhcmVkUHJvamVjdGlvbiA9IHNlbGYuX21hdGNoZXIuY29tYmluZUludG9Qcm9qZWN0aW9uKHByb2plY3Rpb24pO1xuICBpZiAoc29ydGVyKVxuICAgIHNlbGYuX3NoYXJlZFByb2plY3Rpb24gPSBzb3J0ZXIuY29tYmluZUludG9Qcm9qZWN0aW9uKHNlbGYuX3NoYXJlZFByb2plY3Rpb24pO1xuICBzZWxmLl9zaGFyZWRQcm9qZWN0aW9uRm4gPSBMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVQcm9qZWN0aW9uKFxuICAgIHNlbGYuX3NoYXJlZFByb2plY3Rpb24pO1xuXG4gIHNlbGYuX25lZWRUb0ZldGNoID0gbmV3IExvY2FsQ29sbGVjdGlvbi5fSWRNYXA7XG4gIHNlbGYuX2N1cnJlbnRseUZldGNoaW5nID0gbnVsbDtcbiAgc2VsZi5fZmV0Y2hHZW5lcmF0aW9uID0gMDtcblxuICBzZWxmLl9yZXF1ZXJ5V2hlbkRvbmVUaGlzUXVlcnkgPSBmYWxzZTtcbiAgc2VsZi5fd3JpdGVzVG9Db21taXRXaGVuV2VSZWFjaFN0ZWFkeSA9IFtdO1xuIH07XG5cbk9iamVjdC5hc3NpZ24oT3Bsb2dPYnNlcnZlRHJpdmVyLnByb3RvdHlwZSwge1xuICBfaW5pdDogYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBJZiB0aGUgb3Bsb2cgaGFuZGxlIHRlbGxzIHVzIHRoYXQgaXQgc2tpcHBlZCBzb21lIGVudHJpZXMgKGJlY2F1c2UgaXQgZ290XG4gICAgLy8gYmVoaW5kLCBzYXkpLCByZS1wb2xsLlxuICAgIHNlbGYuX2FkZFN0b3BIYW5kbGVzKHNlbGYuX21vbmdvSGFuZGxlLl9vcGxvZ0hhbmRsZS5vblNraXBwZWRFbnRyaWVzKFxuICAgICAgZmluaXNoSWZOZWVkVG9Qb2xsUXVlcnkoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc2VsZi5fbmVlZFRvUG9sbFF1ZXJ5KCk7XG4gICAgICB9KVxuICAgICkpO1xuICAgIFxuICAgIGF3YWl0IGZvckVhY2hUcmlnZ2VyKHNlbGYuX2N1cnNvckRlc2NyaXB0aW9uLCBhc3luYyBmdW5jdGlvbiAodHJpZ2dlcikge1xuICAgICAgc2VsZi5fYWRkU3RvcEhhbmRsZXMoYXdhaXQgc2VsZi5fbW9uZ29IYW5kbGUuX29wbG9nSGFuZGxlLm9uT3Bsb2dFbnRyeShcbiAgICAgICAgdHJpZ2dlciwgZnVuY3Rpb24gKG5vdGlmaWNhdGlvbikge1xuICAgICAgICAgIGZpbmlzaElmTmVlZFRvUG9sbFF1ZXJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0IG9wID0gbm90aWZpY2F0aW9uLm9wO1xuICAgICAgICAgICAgaWYgKG5vdGlmaWNhdGlvbi5kcm9wQ29sbGVjdGlvbiB8fCBub3RpZmljYXRpb24uZHJvcERhdGFiYXNlKSB7XG4gICAgICAgICAgICAgIC8vIE5vdGU6IHRoaXMgY2FsbCBpcyBub3QgYWxsb3dlZCB0byBibG9jayBvbiBhbnl0aGluZyAoZXNwZWNpYWxseVxuICAgICAgICAgICAgICAvLyBvbiB3YWl0aW5nIGZvciBvcGxvZyBlbnRyaWVzIHRvIGNhdGNoIHVwKSBiZWNhdXNlIHRoYXQgd2lsbCBibG9ja1xuICAgICAgICAgICAgICAvLyBvbk9wbG9nRW50cnkhXG4gICAgICAgICAgICAgIHJldHVybiBzZWxmLl9uZWVkVG9Qb2xsUXVlcnkoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIEFsbCBvdGhlciBvcGVyYXRvcnMgc2hvdWxkIGJlIGhhbmRsZWQgZGVwZW5kaW5nIG9uIHBoYXNlXG4gICAgICAgICAgICAgIGlmIChzZWxmLl9waGFzZSA9PT0gUEhBU0UuUVVFUllJTkcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5faGFuZGxlT3Bsb2dFbnRyeVF1ZXJ5aW5nKG9wKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5faGFuZGxlT3Bsb2dFbnRyeVN0ZWFkeU9yRmV0Y2hpbmcob3ApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkoKTtcbiAgICAgICAgfVxuICAgICAgKSk7XG4gICAgfSk7XG4gIFxuICAgIC8vIFhYWCBvcmRlcmluZyB3LnIudC4gZXZlcnl0aGluZyBlbHNlP1xuICAgIHNlbGYuX2FkZFN0b3BIYW5kbGVzKGF3YWl0IGxpc3RlbkFsbChcbiAgICAgIHNlbGYuX2N1cnNvckRlc2NyaXB0aW9uLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIElmIHdlJ3JlIG5vdCBpbiBhIHByZS1maXJlIHdyaXRlIGZlbmNlLCB3ZSBkb24ndCBoYXZlIHRvIGRvIGFueXRoaW5nLlxuICAgICAgICBjb25zdCBmZW5jZSA9IEREUFNlcnZlci5fZ2V0Q3VycmVudEZlbmNlKCk7XG4gICAgICAgIGlmICghZmVuY2UgfHwgZmVuY2UuZmlyZWQpXG4gICAgICAgICAgcmV0dXJuO1xuICBcbiAgICAgICAgaWYgKGZlbmNlLl9vcGxvZ09ic2VydmVEcml2ZXJzKSB7XG4gICAgICAgICAgZmVuY2UuX29wbG9nT2JzZXJ2ZURyaXZlcnNbc2VsZi5faWRdID0gc2VsZjtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgXG4gICAgICAgIGZlbmNlLl9vcGxvZ09ic2VydmVEcml2ZXJzID0ge307XG4gICAgICAgIGZlbmNlLl9vcGxvZ09ic2VydmVEcml2ZXJzW3NlbGYuX2lkXSA9IHNlbGY7XG4gIFxuICAgICAgICBmZW5jZS5vbkJlZm9yZUZpcmUoYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnN0IGRyaXZlcnMgPSBmZW5jZS5fb3Bsb2dPYnNlcnZlRHJpdmVycztcbiAgICAgICAgICBkZWxldGUgZmVuY2UuX29wbG9nT2JzZXJ2ZURyaXZlcnM7XG4gIFxuICAgICAgICAgIC8vIFRoaXMgZmVuY2UgY2Fubm90IGZpcmUgdW50aWwgd2UndmUgY2F1Z2h0IHVwIHRvIFwidGhpcyBwb2ludFwiIGluIHRoZVxuICAgICAgICAgIC8vIG9wbG9nLCBhbmQgYWxsIG9ic2VydmVycyBtYWRlIGl0IGJhY2sgdG8gdGhlIHN0ZWFkeSBzdGF0ZS5cbiAgICAgICAgICBhd2FpdCBzZWxmLl9tb25nb0hhbmRsZS5fb3Bsb2dIYW5kbGUud2FpdFVudGlsQ2F1Z2h0VXAoKTtcbiAgXG4gICAgICAgICAgZm9yIChjb25zdCBkcml2ZXIgb2YgT2JqZWN0LnZhbHVlcyhkcml2ZXJzKSkge1xuICAgICAgICAgICAgaWYgKGRyaXZlci5fc3RvcHBlZClcbiAgICAgICAgICAgICAgY29udGludWU7XG4gIFxuICAgICAgICAgICAgY29uc3Qgd3JpdGUgPSBhd2FpdCBmZW5jZS5iZWdpbldyaXRlKCk7XG4gICAgICAgICAgICBpZiAoZHJpdmVyLl9waGFzZSA9PT0gUEhBU0UuU1RFQURZKSB7XG4gICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGFsbCBvZiB0aGUgY2FsbGJhY2tzIGhhdmUgbWFkZSBpdCB0aHJvdWdoIHRoZVxuICAgICAgICAgICAgICAvLyBtdWx0aXBsZXhlciBhbmQgYmVlbiBkZWxpdmVyZWQgdG8gT2JzZXJ2ZUhhbmRsZXMgYmVmb3JlIGNvbW1pdHRpbmdcbiAgICAgICAgICAgICAgLy8gd3JpdGVzLlxuICAgICAgICAgICAgICBhd2FpdCBkcml2ZXIuX211bHRpcGxleGVyLm9uRmx1c2god3JpdGUuY29tbWl0dGVkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGRyaXZlci5fd3JpdGVzVG9Db21taXRXaGVuV2VSZWFjaFN0ZWFkeS5wdXNoKHdyaXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICkpO1xuICBcbiAgICAvLyBXaGVuIE1vbmdvIGZhaWxzIG92ZXIsIHdlIG5lZWQgdG8gcmVwb2xsIHRoZSBxdWVyeSwgaW4gY2FzZSB3ZSBwcm9jZXNzZWQgYW5cbiAgICAvLyBvcGxvZyBlbnRyeSB0aGF0IGdvdCByb2xsZWQgYmFjay5cbiAgICBzZWxmLl9hZGRTdG9wSGFuZGxlcyhzZWxmLl9tb25nb0hhbmRsZS5fb25GYWlsb3ZlcihmaW5pc2hJZk5lZWRUb1BvbGxRdWVyeShcbiAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuX25lZWRUb1BvbGxRdWVyeSgpO1xuICAgICAgfSkpKTtcbiAgXG4gICAgLy8gR2l2ZSBfb2JzZXJ2ZUNoYW5nZXMgYSBjaGFuY2UgdG8gYWRkIHRoZSBuZXcgT2JzZXJ2ZUhhbmRsZSB0byBvdXJcbiAgICAvLyBtdWx0aXBsZXhlciwgc28gdGhhdCB0aGUgYWRkZWQgY2FsbHMgZ2V0IHN0cmVhbWVkLlxuICAgIHJldHVybiBzZWxmLl9ydW5Jbml0aWFsUXVlcnkoKTtcbiAgfSxcbiAgX2FkZFB1Ymxpc2hlZDogZnVuY3Rpb24gKGlkLCBkb2MpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgTWV0ZW9yLl9ub1lpZWxkc0FsbG93ZWQoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGZpZWxkcyA9IE9iamVjdC5hc3NpZ24oe30sIGRvYyk7XG4gICAgICBkZWxldGUgZmllbGRzLl9pZDtcbiAgICAgIHNlbGYuX3B1Ymxpc2hlZC5zZXQoaWQsIHNlbGYuX3NoYXJlZFByb2plY3Rpb25Gbihkb2MpKTtcbiAgICAgIHNlbGYuX211bHRpcGxleGVyLmFkZGVkKGlkLCBzZWxmLl9wcm9qZWN0aW9uRm4oZmllbGRzKSk7XG5cbiAgICAgIC8vIEFmdGVyIGFkZGluZyB0aGlzIGRvY3VtZW50LCB0aGUgcHVibGlzaGVkIHNldCBtaWdodCBiZSBvdmVyZmxvd2VkXG4gICAgICAvLyAoZXhjZWVkaW5nIGNhcGFjaXR5IHNwZWNpZmllZCBieSBsaW1pdCkuIElmIHNvLCBwdXNoIHRoZSBtYXhpbXVtXG4gICAgICAvLyBlbGVtZW50IHRvIHRoZSBidWZmZXIsIHdlIG1pZ2h0IHdhbnQgdG8gc2F2ZSBpdCBpbiBtZW1vcnkgdG8gcmVkdWNlIHRoZVxuICAgICAgLy8gYW1vdW50IG9mIE1vbmdvIGxvb2t1cHMgaW4gdGhlIGZ1dHVyZS5cbiAgICAgIGlmIChzZWxmLl9saW1pdCAmJiBzZWxmLl9wdWJsaXNoZWQuc2l6ZSgpID4gc2VsZi5fbGltaXQpIHtcbiAgICAgICAgLy8gWFhYIGluIHRoZW9yeSB0aGUgc2l6ZSBvZiBwdWJsaXNoZWQgaXMgbm8gbW9yZSB0aGFuIGxpbWl0KzFcbiAgICAgICAgaWYgKHNlbGYuX3B1Ymxpc2hlZC5zaXplKCkgIT09IHNlbGYuX2xpbWl0ICsgMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFmdGVyIGFkZGluZyB0byBwdWJsaXNoZWQsIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKHNlbGYuX3B1Ymxpc2hlZC5zaXplKCkgLSBzZWxmLl9saW1pdCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBkb2N1bWVudHMgYXJlIG92ZXJmbG93aW5nIHRoZSBzZXRcIik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb3ZlcmZsb3dpbmdEb2NJZCA9IHNlbGYuX3B1Ymxpc2hlZC5tYXhFbGVtZW50SWQoKTtcbiAgICAgICAgdmFyIG92ZXJmbG93aW5nRG9jID0gc2VsZi5fcHVibGlzaGVkLmdldChvdmVyZmxvd2luZ0RvY0lkKTtcblxuICAgICAgICBpZiAoRUpTT04uZXF1YWxzKG92ZXJmbG93aW5nRG9jSWQsIGlkKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBkb2N1bWVudCBqdXN0IGFkZGVkIGlzIG92ZXJmbG93aW5nIHRoZSBwdWJsaXNoZWQgc2V0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5fcHVibGlzaGVkLnJlbW92ZShvdmVyZmxvd2luZ0RvY0lkKTtcbiAgICAgICAgc2VsZi5fbXVsdGlwbGV4ZXIucmVtb3ZlZChvdmVyZmxvd2luZ0RvY0lkKTtcbiAgICAgICAgc2VsZi5fYWRkQnVmZmVyZWQob3ZlcmZsb3dpbmdEb2NJZCwgb3ZlcmZsb3dpbmdEb2MpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICBfcmVtb3ZlUHVibGlzaGVkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgTWV0ZW9yLl9ub1lpZWxkc0FsbG93ZWQoZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5fcHVibGlzaGVkLnJlbW92ZShpZCk7XG4gICAgICBzZWxmLl9tdWx0aXBsZXhlci5yZW1vdmVkKGlkKTtcbiAgICAgIGlmICghIHNlbGYuX2xpbWl0IHx8IHNlbGYuX3B1Ymxpc2hlZC5zaXplKCkgPT09IHNlbGYuX2xpbWl0KVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIGlmIChzZWxmLl9wdWJsaXNoZWQuc2l6ZSgpID4gc2VsZi5fbGltaXQpXG4gICAgICAgIHRocm93IEVycm9yKFwic2VsZi5fcHVibGlzaGVkIGdvdCB0b28gYmlnXCIpO1xuXG4gICAgICAvLyBPSywgd2UgYXJlIHB1Ymxpc2hpbmcgbGVzcyB0aGFuIHRoZSBsaW1pdC4gTWF5YmUgd2Ugc2hvdWxkIGxvb2sgaW4gdGhlXG4gICAgICAvLyBidWZmZXIgdG8gZmluZCB0aGUgbmV4dCBlbGVtZW50IHBhc3Qgd2hhdCB3ZSB3ZXJlIHB1Ymxpc2hpbmcgYmVmb3JlLlxuXG4gICAgICBpZiAoIXNlbGYuX3VucHVibGlzaGVkQnVmZmVyLmVtcHR5KCkpIHtcbiAgICAgICAgLy8gVGhlcmUncyBzb21ldGhpbmcgaW4gdGhlIGJ1ZmZlcjsgbW92ZSB0aGUgZmlyc3QgdGhpbmcgaW4gaXQgdG9cbiAgICAgICAgLy8gX3B1Ymxpc2hlZC5cbiAgICAgICAgdmFyIG5ld0RvY0lkID0gc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIubWluRWxlbWVudElkKCk7XG4gICAgICAgIHZhciBuZXdEb2MgPSBzZWxmLl91bnB1Ymxpc2hlZEJ1ZmZlci5nZXQobmV3RG9jSWQpO1xuICAgICAgICBzZWxmLl9yZW1vdmVCdWZmZXJlZChuZXdEb2NJZCk7XG4gICAgICAgIHNlbGYuX2FkZFB1Ymxpc2hlZChuZXdEb2NJZCwgbmV3RG9jKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGVyZSdzIG5vdGhpbmcgaW4gdGhlIGJ1ZmZlci4gIFRoaXMgY291bGQgbWVhbiBvbmUgb2YgYSBmZXcgdGhpbmdzLlxuXG4gICAgICAvLyAoYSkgV2UgY291bGQgYmUgaW4gdGhlIG1pZGRsZSBvZiByZS1ydW5uaW5nIHRoZSBxdWVyeSAoc3BlY2lmaWNhbGx5LCB3ZVxuICAgICAgLy8gY291bGQgYmUgaW4gX3B1Ymxpc2hOZXdSZXN1bHRzKS4gSW4gdGhhdCBjYXNlLCBfdW5wdWJsaXNoZWRCdWZmZXIgaXNcbiAgICAgIC8vIGVtcHR5IGJlY2F1c2Ugd2UgY2xlYXIgaXQgYXQgdGhlIGJlZ2lubmluZyBvZiBfcHVibGlzaE5ld1Jlc3VsdHMuIEluXG4gICAgICAvLyB0aGlzIGNhc2UsIG91ciBjYWxsZXIgYWxyZWFkeSBrbm93cyB0aGUgZW50aXJlIGFuc3dlciB0byB0aGUgcXVlcnkgYW5kXG4gICAgICAvLyB3ZSBkb24ndCBuZWVkIHRvIGRvIGFueXRoaW5nIGZhbmN5IGhlcmUuICBKdXN0IHJldHVybi5cbiAgICAgIGlmIChzZWxmLl9waGFzZSA9PT0gUEhBU0UuUVVFUllJTkcpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgLy8gKGIpIFdlJ3JlIHByZXR0eSBjb25maWRlbnQgdGhhdCB0aGUgdW5pb24gb2YgX3B1Ymxpc2hlZCBhbmRcbiAgICAgIC8vIF91bnB1Ymxpc2hlZEJ1ZmZlciBjb250YWluIGFsbCBkb2N1bWVudHMgdGhhdCBtYXRjaCBzZWxlY3Rvci4gQmVjYXVzZVxuICAgICAgLy8gX3VucHVibGlzaGVkQnVmZmVyIGlzIGVtcHR5LCB0aGF0IG1lYW5zIHdlJ3JlIGNvbmZpZGVudCB0aGF0IF9wdWJsaXNoZWRcbiAgICAgIC8vIGNvbnRhaW5zIGFsbCBkb2N1bWVudHMgdGhhdCBtYXRjaCBzZWxlY3Rvci4gU28gd2UgaGF2ZSBub3RoaW5nIHRvIGRvLlxuICAgICAgaWYgKHNlbGYuX3NhZmVBcHBlbmRUb0J1ZmZlcilcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICAvLyAoYykgTWF5YmUgdGhlcmUgYXJlIG90aGVyIGRvY3VtZW50cyBvdXQgdGhlcmUgdGhhdCBzaG91bGQgYmUgaW4gb3VyXG4gICAgICAvLyBidWZmZXIuIEJ1dCBpbiB0aGF0IGNhc2UsIHdoZW4gd2UgZW1wdGllZCBfdW5wdWJsaXNoZWRCdWZmZXIgaW5cbiAgICAgIC8vIF9yZW1vdmVCdWZmZXJlZCwgd2Ugc2hvdWxkIGhhdmUgY2FsbGVkIF9uZWVkVG9Qb2xsUXVlcnksIHdoaWNoIHdpbGxcbiAgICAgIC8vIGVpdGhlciBwdXQgc29tZXRoaW5nIGluIF91bnB1Ymxpc2hlZEJ1ZmZlciBvciBzZXQgX3NhZmVBcHBlbmRUb0J1ZmZlclxuICAgICAgLy8gKG9yIGJvdGgpLCBhbmQgaXQgd2lsbCBwdXQgdXMgaW4gUVVFUllJTkcgZm9yIHRoYXQgd2hvbGUgdGltZS4gU28gaW5cbiAgICAgIC8vIGZhY3QsIHdlIHNob3VsZG4ndCBiZSBhYmxlIHRvIGdldCBoZXJlLlxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCdWZmZXIgaW5leHBsaWNhYmx5IGVtcHR5XCIpO1xuICAgIH0pO1xuICB9LFxuICBfY2hhbmdlUHVibGlzaGVkOiBmdW5jdGlvbiAoaWQsIG9sZERvYywgbmV3RG9jKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIE1ldGVvci5fbm9ZaWVsZHNBbGxvd2VkKGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuX3B1Ymxpc2hlZC5zZXQoaWQsIHNlbGYuX3NoYXJlZFByb2plY3Rpb25GbihuZXdEb2MpKTtcbiAgICAgIHZhciBwcm9qZWN0ZWROZXcgPSBzZWxmLl9wcm9qZWN0aW9uRm4obmV3RG9jKTtcbiAgICAgIHZhciBwcm9qZWN0ZWRPbGQgPSBzZWxmLl9wcm9qZWN0aW9uRm4ob2xkRG9jKTtcbiAgICAgIHZhciBjaGFuZ2VkID0gRGlmZlNlcXVlbmNlLm1ha2VDaGFuZ2VkRmllbGRzKFxuICAgICAgICBwcm9qZWN0ZWROZXcsIHByb2plY3RlZE9sZCk7XG4gICAgICBpZiAoIWlzRW1wdHkoY2hhbmdlZCkpXG4gICAgICAgIHNlbGYuX211bHRpcGxleGVyLmNoYW5nZWQoaWQsIGNoYW5nZWQpO1xuICAgIH0pO1xuICB9LFxuICBfYWRkQnVmZmVyZWQ6IGZ1bmN0aW9uIChpZCwgZG9jKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIE1ldGVvci5fbm9ZaWVsZHNBbGxvd2VkKGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuX3VucHVibGlzaGVkQnVmZmVyLnNldChpZCwgc2VsZi5fc2hhcmVkUHJvamVjdGlvbkZuKGRvYykpO1xuXG4gICAgICAvLyBJZiBzb21ldGhpbmcgaXMgb3ZlcmZsb3dpbmcgdGhlIGJ1ZmZlciwgd2UganVzdCByZW1vdmUgaXQgZnJvbSBjYWNoZVxuICAgICAgaWYgKHNlbGYuX3VucHVibGlzaGVkQnVmZmVyLnNpemUoKSA+IHNlbGYuX2xpbWl0KSB7XG4gICAgICAgIHZhciBtYXhCdWZmZXJlZElkID0gc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIubWF4RWxlbWVudElkKCk7XG5cbiAgICAgICAgc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIucmVtb3ZlKG1heEJ1ZmZlcmVkSWQpO1xuXG4gICAgICAgIC8vIFNpbmNlIHNvbWV0aGluZyBtYXRjaGluZyBpcyByZW1vdmVkIGZyb20gY2FjaGUgKGJvdGggcHVibGlzaGVkIHNldCBhbmRcbiAgICAgICAgLy8gYnVmZmVyKSwgc2V0IGZsYWcgdG8gZmFsc2VcbiAgICAgICAgc2VsZi5fc2FmZUFwcGVuZFRvQnVmZmVyID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIC8vIElzIGNhbGxlZCBlaXRoZXIgdG8gcmVtb3ZlIHRoZSBkb2MgY29tcGxldGVseSBmcm9tIG1hdGNoaW5nIHNldCBvciB0byBtb3ZlXG4gIC8vIGl0IHRvIHRoZSBwdWJsaXNoZWQgc2V0IGxhdGVyLlxuICBfcmVtb3ZlQnVmZmVyZWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBNZXRlb3IuX25vWWllbGRzQWxsb3dlZChmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLl91bnB1Ymxpc2hlZEJ1ZmZlci5yZW1vdmUoaWQpO1xuICAgICAgLy8gVG8ga2VlcCB0aGUgY29udHJhY3QgXCJidWZmZXIgaXMgbmV2ZXIgZW1wdHkgaW4gU1RFQURZIHBoYXNlIHVubGVzcyB0aGVcbiAgICAgIC8vIGV2ZXJ5dGhpbmcgbWF0Y2hpbmcgZml0cyBpbnRvIHB1Ymxpc2hlZFwiIHRydWUsIHdlIHBvbGwgZXZlcnl0aGluZyBhc1xuICAgICAgLy8gc29vbiBhcyB3ZSBzZWUgdGhlIGJ1ZmZlciBiZWNvbWluZyBlbXB0eS5cbiAgICAgIGlmICghIHNlbGYuX3VucHVibGlzaGVkQnVmZmVyLnNpemUoKSAmJiAhIHNlbGYuX3NhZmVBcHBlbmRUb0J1ZmZlcilcbiAgICAgICAgc2VsZi5fbmVlZFRvUG9sbFF1ZXJ5KCk7XG4gICAgfSk7XG4gIH0sXG4gIC8vIENhbGxlZCB3aGVuIGEgZG9jdW1lbnQgaGFzIGpvaW5lZCB0aGUgXCJNYXRjaGluZ1wiIHJlc3VsdHMgc2V0LlxuICAvLyBUYWtlcyByZXNwb25zaWJpbGl0eSBvZiBrZWVwaW5nIF91bnB1Ymxpc2hlZEJ1ZmZlciBpbiBzeW5jIHdpdGggX3B1Ymxpc2hlZFxuICAvLyBhbmQgdGhlIGVmZmVjdCBvZiBsaW1pdCBlbmZvcmNlZC5cbiAgX2FkZE1hdGNoaW5nOiBmdW5jdGlvbiAoZG9jKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIE1ldGVvci5fbm9ZaWVsZHNBbGxvd2VkKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBpZCA9IGRvYy5faWQ7XG4gICAgICBpZiAoc2VsZi5fcHVibGlzaGVkLmhhcyhpZCkpXG4gICAgICAgIHRocm93IEVycm9yKFwidHJpZWQgdG8gYWRkIHNvbWV0aGluZyBhbHJlYWR5IHB1Ymxpc2hlZCBcIiArIGlkKTtcbiAgICAgIGlmIChzZWxmLl9saW1pdCAmJiBzZWxmLl91bnB1Ymxpc2hlZEJ1ZmZlci5oYXMoaWQpKVxuICAgICAgICB0aHJvdyBFcnJvcihcInRyaWVkIHRvIGFkZCBzb21ldGhpbmcgYWxyZWFkeSBleGlzdGVkIGluIGJ1ZmZlciBcIiArIGlkKTtcblxuICAgICAgdmFyIGxpbWl0ID0gc2VsZi5fbGltaXQ7XG4gICAgICB2YXIgY29tcGFyYXRvciA9IHNlbGYuX2NvbXBhcmF0b3I7XG4gICAgICB2YXIgbWF4UHVibGlzaGVkID0gKGxpbWl0ICYmIHNlbGYuX3B1Ymxpc2hlZC5zaXplKCkgPiAwKSA/XG4gICAgICAgIHNlbGYuX3B1Ymxpc2hlZC5nZXQoc2VsZi5fcHVibGlzaGVkLm1heEVsZW1lbnRJZCgpKSA6IG51bGw7XG4gICAgICB2YXIgbWF4QnVmZmVyZWQgPSAobGltaXQgJiYgc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIuc2l6ZSgpID4gMClcbiAgICAgICAgPyBzZWxmLl91bnB1Ymxpc2hlZEJ1ZmZlci5nZXQoc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIubWF4RWxlbWVudElkKCkpXG4gICAgICAgIDogbnVsbDtcbiAgICAgIC8vIFRoZSBxdWVyeSBpcyB1bmxpbWl0ZWQgb3IgZGlkbid0IHB1Ymxpc2ggZW5vdWdoIGRvY3VtZW50cyB5ZXQgb3IgdGhlXG4gICAgICAvLyBuZXcgZG9jdW1lbnQgd291bGQgZml0IGludG8gcHVibGlzaGVkIHNldCBwdXNoaW5nIHRoZSBtYXhpbXVtIGVsZW1lbnRcbiAgICAgIC8vIG91dCwgdGhlbiB3ZSBuZWVkIHRvIHB1Ymxpc2ggdGhlIGRvYy5cbiAgICAgIHZhciB0b1B1Ymxpc2ggPSAhIGxpbWl0IHx8IHNlbGYuX3B1Ymxpc2hlZC5zaXplKCkgPCBsaW1pdCB8fFxuICAgICAgICBjb21wYXJhdG9yKGRvYywgbWF4UHVibGlzaGVkKSA8IDA7XG5cbiAgICAgIC8vIE90aGVyd2lzZSB3ZSBtaWdodCBuZWVkIHRvIGJ1ZmZlciBpdCAob25seSBpbiBjYXNlIG9mIGxpbWl0ZWQgcXVlcnkpLlxuICAgICAgLy8gQnVmZmVyaW5nIGlzIGFsbG93ZWQgaWYgdGhlIGJ1ZmZlciBpcyBub3QgZmlsbGVkIHVwIHlldCBhbmQgYWxsXG4gICAgICAvLyBtYXRjaGluZyBkb2NzIGFyZSBlaXRoZXIgaW4gdGhlIHB1Ymxpc2hlZCBzZXQgb3IgaW4gdGhlIGJ1ZmZlci5cbiAgICAgIHZhciBjYW5BcHBlbmRUb0J1ZmZlciA9ICF0b1B1Ymxpc2ggJiYgc2VsZi5fc2FmZUFwcGVuZFRvQnVmZmVyICYmXG4gICAgICAgIHNlbGYuX3VucHVibGlzaGVkQnVmZmVyLnNpemUoKSA8IGxpbWl0O1xuXG4gICAgICAvLyBPciBpZiBpdCBpcyBzbWFsbCBlbm91Z2ggdG8gYmUgc2FmZWx5IGluc2VydGVkIHRvIHRoZSBtaWRkbGUgb3IgdGhlXG4gICAgICAvLyBiZWdpbm5pbmcgb2YgdGhlIGJ1ZmZlci5cbiAgICAgIHZhciBjYW5JbnNlcnRJbnRvQnVmZmVyID0gIXRvUHVibGlzaCAmJiBtYXhCdWZmZXJlZCAmJlxuICAgICAgICBjb21wYXJhdG9yKGRvYywgbWF4QnVmZmVyZWQpIDw9IDA7XG5cbiAgICAgIHZhciB0b0J1ZmZlciA9IGNhbkFwcGVuZFRvQnVmZmVyIHx8IGNhbkluc2VydEludG9CdWZmZXI7XG5cbiAgICAgIGlmICh0b1B1Ymxpc2gpIHtcbiAgICAgICAgc2VsZi5fYWRkUHVibGlzaGVkKGlkLCBkb2MpO1xuICAgICAgfSBlbHNlIGlmICh0b0J1ZmZlcikge1xuICAgICAgICBzZWxmLl9hZGRCdWZmZXJlZChpZCwgZG9jKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGRyb3BwaW5nIGl0IGFuZCBub3Qgc2F2aW5nIHRvIHRoZSBjYWNoZVxuICAgICAgICBzZWxmLl9zYWZlQXBwZW5kVG9CdWZmZXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgLy8gQ2FsbGVkIHdoZW4gYSBkb2N1bWVudCBsZWF2ZXMgdGhlIFwiTWF0Y2hpbmdcIiByZXN1bHRzIHNldC5cbiAgLy8gVGFrZXMgcmVzcG9uc2liaWxpdHkgb2Yga2VlcGluZyBfdW5wdWJsaXNoZWRCdWZmZXIgaW4gc3luYyB3aXRoIF9wdWJsaXNoZWRcbiAgLy8gYW5kIHRoZSBlZmZlY3Qgb2YgbGltaXQgZW5mb3JjZWQuXG4gIF9yZW1vdmVNYXRjaGluZzogZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIE1ldGVvci5fbm9ZaWVsZHNBbGxvd2VkKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghIHNlbGYuX3B1Ymxpc2hlZC5oYXMoaWQpICYmICEgc2VsZi5fbGltaXQpXG4gICAgICAgIHRocm93IEVycm9yKFwidHJpZWQgdG8gcmVtb3ZlIHNvbWV0aGluZyBtYXRjaGluZyBidXQgbm90IGNhY2hlZCBcIiArIGlkKTtcblxuICAgICAgaWYgKHNlbGYuX3B1Ymxpc2hlZC5oYXMoaWQpKSB7XG4gICAgICAgIHNlbGYuX3JlbW92ZVB1Ymxpc2hlZChpZCk7XG4gICAgICB9IGVsc2UgaWYgKHNlbGYuX3VucHVibGlzaGVkQnVmZmVyLmhhcyhpZCkpIHtcbiAgICAgICAgc2VsZi5fcmVtb3ZlQnVmZmVyZWQoaWQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICBfaGFuZGxlRG9jOiBmdW5jdGlvbiAoaWQsIG5ld0RvYykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBNZXRlb3IuX25vWWllbGRzQWxsb3dlZChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgbWF0Y2hlc05vdyA9IG5ld0RvYyAmJiBzZWxmLl9tYXRjaGVyLmRvY3VtZW50TWF0Y2hlcyhuZXdEb2MpLnJlc3VsdDtcblxuICAgICAgdmFyIHB1Ymxpc2hlZEJlZm9yZSA9IHNlbGYuX3B1Ymxpc2hlZC5oYXMoaWQpO1xuICAgICAgdmFyIGJ1ZmZlcmVkQmVmb3JlID0gc2VsZi5fbGltaXQgJiYgc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIuaGFzKGlkKTtcbiAgICAgIHZhciBjYWNoZWRCZWZvcmUgPSBwdWJsaXNoZWRCZWZvcmUgfHwgYnVmZmVyZWRCZWZvcmU7XG5cbiAgICAgIGlmIChtYXRjaGVzTm93ICYmICFjYWNoZWRCZWZvcmUpIHtcbiAgICAgICAgc2VsZi5fYWRkTWF0Y2hpbmcobmV3RG9jKTtcbiAgICAgIH0gZWxzZSBpZiAoY2FjaGVkQmVmb3JlICYmICFtYXRjaGVzTm93KSB7XG4gICAgICAgIHNlbGYuX3JlbW92ZU1hdGNoaW5nKGlkKTtcbiAgICAgIH0gZWxzZSBpZiAoY2FjaGVkQmVmb3JlICYmIG1hdGNoZXNOb3cpIHtcbiAgICAgICAgdmFyIG9sZERvYyA9IHNlbGYuX3B1Ymxpc2hlZC5nZXQoaWQpO1xuICAgICAgICB2YXIgY29tcGFyYXRvciA9IHNlbGYuX2NvbXBhcmF0b3I7XG4gICAgICAgIHZhciBtaW5CdWZmZXJlZCA9IHNlbGYuX2xpbWl0ICYmIHNlbGYuX3VucHVibGlzaGVkQnVmZmVyLnNpemUoKSAmJlxuICAgICAgICAgIHNlbGYuX3VucHVibGlzaGVkQnVmZmVyLmdldChzZWxmLl91bnB1Ymxpc2hlZEJ1ZmZlci5taW5FbGVtZW50SWQoKSk7XG4gICAgICAgIHZhciBtYXhCdWZmZXJlZDtcblxuICAgICAgICBpZiAocHVibGlzaGVkQmVmb3JlKSB7XG4gICAgICAgICAgLy8gVW5saW1pdGVkIGNhc2Ugd2hlcmUgdGhlIGRvY3VtZW50IHN0YXlzIGluIHB1Ymxpc2hlZCBvbmNlIGl0XG4gICAgICAgICAgLy8gbWF0Y2hlcyBvciB0aGUgY2FzZSB3aGVuIHdlIGRvbid0IGhhdmUgZW5vdWdoIG1hdGNoaW5nIGRvY3MgdG9cbiAgICAgICAgICAvLyBwdWJsaXNoIG9yIHRoZSBjaGFuZ2VkIGJ1dCBtYXRjaGluZyBkb2Mgd2lsbCBzdGF5IGluIHB1Ymxpc2hlZFxuICAgICAgICAgIC8vIGFueXdheXMuXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBYWFg6IFdlIHJlbHkgb24gdGhlIGVtcHRpbmVzcyBvZiBidWZmZXIuIEJlIHN1cmUgdG8gbWFpbnRhaW4gdGhlXG4gICAgICAgICAgLy8gZmFjdCB0aGF0IGJ1ZmZlciBjYW4ndCBiZSBlbXB0eSBpZiB0aGVyZSBhcmUgbWF0Y2hpbmcgZG9jdW1lbnRzIG5vdFxuICAgICAgICAgIC8vIHB1Ymxpc2hlZC4gTm90YWJseSwgd2UgZG9uJ3Qgd2FudCB0byBzY2hlZHVsZSByZXBvbGwgYW5kIGNvbnRpbnVlXG4gICAgICAgICAgLy8gcmVseWluZyBvbiB0aGlzIHByb3BlcnR5LlxuICAgICAgICAgIHZhciBzdGF5c0luUHVibGlzaGVkID0gISBzZWxmLl9saW1pdCB8fFxuICAgICAgICAgICAgc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIuc2l6ZSgpID09PSAwIHx8XG4gICAgICAgICAgICBjb21wYXJhdG9yKG5ld0RvYywgbWluQnVmZmVyZWQpIDw9IDA7XG5cbiAgICAgICAgICBpZiAoc3RheXNJblB1Ymxpc2hlZCkge1xuICAgICAgICAgICAgc2VsZi5fY2hhbmdlUHVibGlzaGVkKGlkLCBvbGREb2MsIG5ld0RvYyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGFmdGVyIHRoZSBjaGFuZ2UgZG9jIGRvZXNuJ3Qgc3RheSBpbiB0aGUgcHVibGlzaGVkLCByZW1vdmUgaXRcbiAgICAgICAgICAgIHNlbGYuX3JlbW92ZVB1Ymxpc2hlZChpZCk7XG4gICAgICAgICAgICAvLyBidXQgaXQgY2FuIG1vdmUgaW50byBidWZmZXJlZCBub3csIGNoZWNrIGl0XG4gICAgICAgICAgICBtYXhCdWZmZXJlZCA9IHNlbGYuX3VucHVibGlzaGVkQnVmZmVyLmdldChcbiAgICAgICAgICAgICAgc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIubWF4RWxlbWVudElkKCkpO1xuXG4gICAgICAgICAgICB2YXIgdG9CdWZmZXIgPSBzZWxmLl9zYWZlQXBwZW5kVG9CdWZmZXIgfHxcbiAgICAgICAgICAgICAgICAgIChtYXhCdWZmZXJlZCAmJiBjb21wYXJhdG9yKG5ld0RvYywgbWF4QnVmZmVyZWQpIDw9IDApO1xuXG4gICAgICAgICAgICBpZiAodG9CdWZmZXIpIHtcbiAgICAgICAgICAgICAgc2VsZi5fYWRkQnVmZmVyZWQoaWQsIG5ld0RvYyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBUaHJvdyBhd2F5IGZyb20gYm90aCBwdWJsaXNoZWQgc2V0IGFuZCBidWZmZXJcbiAgICAgICAgICAgICAgc2VsZi5fc2FmZUFwcGVuZFRvQnVmZmVyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGJ1ZmZlcmVkQmVmb3JlKSB7XG4gICAgICAgICAgb2xkRG9jID0gc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIuZ2V0KGlkKTtcbiAgICAgICAgICAvLyByZW1vdmUgdGhlIG9sZCB2ZXJzaW9uIG1hbnVhbGx5IGluc3RlYWQgb2YgdXNpbmcgX3JlbW92ZUJ1ZmZlcmVkIHNvXG4gICAgICAgICAgLy8gd2UgZG9uJ3QgdHJpZ2dlciB0aGUgcXVlcnlpbmcgaW1tZWRpYXRlbHkuICBpZiB3ZSBlbmQgdGhpcyBibG9ja1xuICAgICAgICAgIC8vIHdpdGggdGhlIGJ1ZmZlciBlbXB0eSwgd2Ugd2lsbCBuZWVkIHRvIHRyaWdnZXIgdGhlIHF1ZXJ5IHBvbGxcbiAgICAgICAgICAvLyBtYW51YWxseSB0b28uXG4gICAgICAgICAgc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIucmVtb3ZlKGlkKTtcblxuICAgICAgICAgIHZhciBtYXhQdWJsaXNoZWQgPSBzZWxmLl9wdWJsaXNoZWQuZ2V0KFxuICAgICAgICAgICAgc2VsZi5fcHVibGlzaGVkLm1heEVsZW1lbnRJZCgpKTtcbiAgICAgICAgICBtYXhCdWZmZXJlZCA9IHNlbGYuX3VucHVibGlzaGVkQnVmZmVyLnNpemUoKSAmJlxuICAgICAgICAgICAgICAgIHNlbGYuX3VucHVibGlzaGVkQnVmZmVyLmdldChcbiAgICAgICAgICAgICAgICAgIHNlbGYuX3VucHVibGlzaGVkQnVmZmVyLm1heEVsZW1lbnRJZCgpKTtcblxuICAgICAgICAgIC8vIHRoZSBidWZmZXJlZCBkb2Mgd2FzIHVwZGF0ZWQsIGl0IGNvdWxkIG1vdmUgdG8gcHVibGlzaGVkXG4gICAgICAgICAgdmFyIHRvUHVibGlzaCA9IGNvbXBhcmF0b3IobmV3RG9jLCBtYXhQdWJsaXNoZWQpIDwgMDtcblxuICAgICAgICAgIC8vIG9yIHN0YXlzIGluIGJ1ZmZlciBldmVuIGFmdGVyIHRoZSBjaGFuZ2VcbiAgICAgICAgICB2YXIgc3RheXNJbkJ1ZmZlciA9ICghIHRvUHVibGlzaCAmJiBzZWxmLl9zYWZlQXBwZW5kVG9CdWZmZXIpIHx8XG4gICAgICAgICAgICAgICAgKCF0b1B1Ymxpc2ggJiYgbWF4QnVmZmVyZWQgJiZcbiAgICAgICAgICAgICAgICAgY29tcGFyYXRvcihuZXdEb2MsIG1heEJ1ZmZlcmVkKSA8PSAwKTtcblxuICAgICAgICAgIGlmICh0b1B1Ymxpc2gpIHtcbiAgICAgICAgICAgIHNlbGYuX2FkZFB1Ymxpc2hlZChpZCwgbmV3RG9jKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN0YXlzSW5CdWZmZXIpIHtcbiAgICAgICAgICAgIC8vIHN0YXlzIGluIGJ1ZmZlciBidXQgY2hhbmdlc1xuICAgICAgICAgICAgc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIuc2V0KGlkLCBuZXdEb2MpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUaHJvdyBhd2F5IGZyb20gYm90aCBwdWJsaXNoZWQgc2V0IGFuZCBidWZmZXJcbiAgICAgICAgICAgIHNlbGYuX3NhZmVBcHBlbmRUb0J1ZmZlciA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gTm9ybWFsbHkgdGhpcyBjaGVjayB3b3VsZCBoYXZlIGJlZW4gZG9uZSBpbiBfcmVtb3ZlQnVmZmVyZWQgYnV0XG4gICAgICAgICAgICAvLyB3ZSBkaWRuJ3QgdXNlIGl0LCBzbyB3ZSBuZWVkIHRvIGRvIGl0IG91cnNlbGYgbm93LlxuICAgICAgICAgICAgaWYgKCEgc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIuc2l6ZSgpKSB7XG4gICAgICAgICAgICAgIHNlbGYuX25lZWRUb1BvbGxRdWVyeSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYWNoZWRCZWZvcmUgaW1wbGllcyBlaXRoZXIgb2YgcHVibGlzaGVkQmVmb3JlIG9yIGJ1ZmZlcmVkQmVmb3JlIGlzIHRydWUuXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIF9mZXRjaE1vZGlmaWVkRG9jdW1lbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNlbGYuX3JlZ2lzdGVyUGhhc2VDaGFuZ2UoUEhBU0UuRkVUQ0hJTkcpO1xuICAgIC8vIERlZmVyLCBiZWNhdXNlIG5vdGhpbmcgY2FsbGVkIGZyb20gdGhlIG9wbG9nIGVudHJ5IGhhbmRsZXIgbWF5IHlpZWxkLFxuICAgIC8vIGJ1dCBmZXRjaCgpIHlpZWxkcy5cbiAgICBNZXRlb3IuZGVmZXIoZmluaXNoSWZOZWVkVG9Qb2xsUXVlcnkoYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgd2hpbGUgKCFzZWxmLl9zdG9wcGVkICYmICFzZWxmLl9uZWVkVG9GZXRjaC5lbXB0eSgpKSB7XG4gICAgICAgIGlmIChzZWxmLl9waGFzZSA9PT0gUEhBU0UuUVVFUllJTkcpIHtcbiAgICAgICAgICAvLyBXaGlsZSBmZXRjaGluZywgd2UgZGVjaWRlZCB0byBnbyBpbnRvIFFVRVJZSU5HIG1vZGUsIGFuZCB0aGVuIHdlXG4gICAgICAgICAgLy8gc2F3IGFub3RoZXIgb3Bsb2cgZW50cnksIHNvIF9uZWVkVG9GZXRjaCBpcyBub3QgZW1wdHkuIEJ1dCB3ZVxuICAgICAgICAgIC8vIHNob3VsZG4ndCBmZXRjaCB0aGVzZSBkb2N1bWVudHMgdW50aWwgQUZURVIgdGhlIHF1ZXJ5IGlzIGRvbmUuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCZWluZyBpbiBzdGVhZHkgcGhhc2UgaGVyZSB3b3VsZCBiZSBzdXJwcmlzaW5nLlxuICAgICAgICBpZiAoc2VsZi5fcGhhc2UgIT09IFBIQVNFLkZFVENISU5HKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBoYXNlIGluIGZldGNoTW9kaWZpZWREb2N1bWVudHM6IFwiICsgc2VsZi5fcGhhc2UpO1xuXG4gICAgICAgIHNlbGYuX2N1cnJlbnRseUZldGNoaW5nID0gc2VsZi5fbmVlZFRvRmV0Y2g7XG4gICAgICAgIHZhciB0aGlzR2VuZXJhdGlvbiA9ICsrc2VsZi5fZmV0Y2hHZW5lcmF0aW9uO1xuICAgICAgICBzZWxmLl9uZWVkVG9GZXRjaCA9IG5ldyBMb2NhbENvbGxlY3Rpb24uX0lkTWFwO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSBvZiBwcm9taXNlcyBmb3IgYWxsIHRoZSBmZXRjaCBvcGVyYXRpb25zXG4gICAgICAgIGNvbnN0IGZldGNoUHJvbWlzZXMgPSBbXTtcblxuICAgICAgICBzZWxmLl9jdXJyZW50bHlGZXRjaGluZy5mb3JFYWNoKGZ1bmN0aW9uIChvcCwgaWQpIHtcbiAgICAgICAgICBjb25zdCBmZXRjaFByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBzZWxmLl9tb25nb0hhbmRsZS5fZG9jRmV0Y2hlci5mZXRjaChcbiAgICAgICAgICAgICAgc2VsZi5fY3Vyc29yRGVzY3JpcHRpb24uY29sbGVjdGlvbk5hbWUsXG4gICAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgICBvcCxcbiAgICAgICAgICAgICAgZmluaXNoSWZOZWVkVG9Qb2xsUXVlcnkoZnVuY3Rpb24oZXJyLCBkb2MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICBNZXRlb3IuX2RlYnVnKCdHb3QgZXhjZXB0aW9uIHdoaWxlIGZldGNoaW5nIGRvY3VtZW50cycsIGVycik7XG4gICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBnZXQgYW4gZXJyb3IgZnJvbSB0aGUgZmV0Y2hlciAoZWcsIHRyb3VibGVcbiAgICAgICAgICAgICAgICAgIC8vIGNvbm5lY3RpbmcgdG8gTW9uZ28pLCBsZXQncyBqdXN0IGFiYW5kb24gdGhlIGZldGNoIHBoYXNlXG4gICAgICAgICAgICAgICAgICAvLyBhbHRvZ2V0aGVyIGFuZCBmYWxsIGJhY2sgdG8gcG9sbGluZy4gSXQncyBub3QgbGlrZSB3ZSdyZVxuICAgICAgICAgICAgICAgICAgLy8gZ2V0dGluZyBsaXZlIHVwZGF0ZXMgYW55d2F5LlxuICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuX3BoYXNlICE9PSBQSEFTRS5RVUVSWUlORykge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9uZWVkVG9Qb2xsUXVlcnkoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAhc2VsZi5fc3RvcHBlZCAmJlxuICAgICAgICAgICAgICAgICAgc2VsZi5fcGhhc2UgPT09IFBIQVNFLkZFVENISU5HICYmXG4gICAgICAgICAgICAgICAgICBzZWxmLl9mZXRjaEdlbmVyYXRpb24gPT09IHRoaXNHZW5lcmF0aW9uXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAvLyBXZSByZS1jaGVjayB0aGUgZ2VuZXJhdGlvbiBpbiBjYXNlIHdlJ3ZlIGhhZCBhbiBleHBsaWNpdFxuICAgICAgICAgICAgICAgICAgLy8gX3BvbGxRdWVyeSBjYWxsIChlZywgaW4gYW5vdGhlciBmaWJlcikgd2hpY2ggc2hvdWxkXG4gICAgICAgICAgICAgICAgICAvLyBlZmZlY3RpdmVseSBjYW5jZWwgdGhpcyByb3VuZCBvZiBmZXRjaGVzLiAgKF9wb2xsUXVlcnlcbiAgICAgICAgICAgICAgICAgIC8vIGluY3JlbWVudHMgdGhlIGdlbmVyYXRpb24uKVxuICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5faGFuZGxlRG9jKGlkLCBkb2MpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApXG4gICAgICAgICAgfSlcbiAgICAgICAgICBmZXRjaFByb21pc2VzLnB1c2goZmV0Y2hQcm9taXNlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIFdhaXQgZm9yIGFsbCBmZXRjaCBvcGVyYXRpb25zIHRvIGNvbXBsZXRlXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChmZXRjaFByb21pc2VzKTtcbiAgICAgICAgICBjb25zdCBlcnJvcnMgPSByZXN1bHRzXG4gICAgICAgICAgICAuZmlsdGVyKHJlc3VsdCA9PiByZXN1bHQuc3RhdHVzID09PSAncmVqZWN0ZWQnKVxuICAgICAgICAgICAgLm1hcChyZXN1bHQgPT4gcmVzdWx0LnJlYXNvbik7XG5cbiAgICAgICAgICBpZiAoZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIE1ldGVvci5fZGVidWcoJ1NvbWUgZmV0Y2ggcXVlcmllcyBmYWlsZWQ6JywgZXJyb3JzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIE1ldGVvci5fZGVidWcoJ0dvdCBhbiBleGNlcHRpb24gaW4gYSBmZXRjaCBxdWVyeScsIGVycik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gRXhpdCBub3cgaWYgd2UndmUgaGFkIGEgX3BvbGxRdWVyeSBjYWxsIChoZXJlIG9yIGluIGFub3RoZXIgZmliZXIpLlxuICAgICAgICBpZiAoc2VsZi5fcGhhc2UgPT09IFBIQVNFLlFVRVJZSU5HKVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgc2VsZi5fY3VycmVudGx5RmV0Y2hpbmcgPSBudWxsO1xuICAgICAgfVxuICAgICAgLy8gV2UncmUgZG9uZSBmZXRjaGluZywgc28gd2UgY2FuIGJlIHN0ZWFkeSwgdW5sZXNzIHdlJ3ZlIGhhZCBhXG4gICAgICAvLyBfcG9sbFF1ZXJ5IGNhbGwgKGhlcmUgb3IgaW4gYW5vdGhlciBmaWJlcikuXG4gICAgICBpZiAoc2VsZi5fcGhhc2UgIT09IFBIQVNFLlFVRVJZSU5HKVxuICAgICAgICBhd2FpdCBzZWxmLl9iZVN0ZWFkeSgpO1xuICAgIH0pKTtcbiAgfSxcbiAgX2JlU3RlYWR5OiBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNlbGYuX3JlZ2lzdGVyUGhhc2VDaGFuZ2UoUEhBU0UuU1RFQURZKTtcbiAgICB2YXIgd3JpdGVzID0gc2VsZi5fd3JpdGVzVG9Db21taXRXaGVuV2VSZWFjaFN0ZWFkeSB8fCBbXTtcbiAgICBzZWxmLl93cml0ZXNUb0NvbW1pdFdoZW5XZVJlYWNoU3RlYWR5ID0gW107XG4gICAgYXdhaXQgc2VsZi5fbXVsdGlwbGV4ZXIub25GbHVzaChhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICB0cnkge1xuICAgICAgICBmb3IgKGNvbnN0IHcgb2Ygd3JpdGVzKSB7XG4gICAgICAgICAgYXdhaXQgdy5jb21taXR0ZWQoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiX2JlU3RlYWR5IGVycm9yXCIsIHt3cml0ZXN9LCBlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgX2hhbmRsZU9wbG9nRW50cnlRdWVyeWluZzogZnVuY3Rpb24gKG9wKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIE1ldGVvci5fbm9ZaWVsZHNBbGxvd2VkKGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuX25lZWRUb0ZldGNoLnNldChpZEZvck9wKG9wKSwgb3ApO1xuICAgIH0pO1xuICB9LFxuICBfaGFuZGxlT3Bsb2dFbnRyeVN0ZWFkeU9yRmV0Y2hpbmc6IGZ1bmN0aW9uIChvcCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBNZXRlb3IuX25vWWllbGRzQWxsb3dlZChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgaWQgPSBpZEZvck9wKG9wKTtcbiAgICAgIC8vIElmIHdlJ3JlIGFscmVhZHkgZmV0Y2hpbmcgdGhpcyBvbmUsIG9yIGFib3V0IHRvLCB3ZSBjYW4ndCBvcHRpbWl6ZTtcbiAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHdlIGZldGNoIGl0IGFnYWluIGlmIG5lY2Vzc2FyeS5cblxuICAgICAgaWYgKHNlbGYuX3BoYXNlID09PSBQSEFTRS5GRVRDSElORyAmJlxuICAgICAgICAgICgoc2VsZi5fY3VycmVudGx5RmV0Y2hpbmcgJiYgc2VsZi5fY3VycmVudGx5RmV0Y2hpbmcuaGFzKGlkKSkgfHxcbiAgICAgICAgICAgc2VsZi5fbmVlZFRvRmV0Y2guaGFzKGlkKSkpIHtcbiAgICAgICAgc2VsZi5fbmVlZFRvRmV0Y2guc2V0KGlkLCBvcCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wLm9wID09PSAnZCcpIHtcbiAgICAgICAgaWYgKHNlbGYuX3B1Ymxpc2hlZC5oYXMoaWQpIHx8XG4gICAgICAgICAgICAoc2VsZi5fbGltaXQgJiYgc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIuaGFzKGlkKSkpXG4gICAgICAgICAgc2VsZi5fcmVtb3ZlTWF0Y2hpbmcoaWQpO1xuICAgICAgfSBlbHNlIGlmIChvcC5vcCA9PT0gJ2knKSB7XG4gICAgICAgIGlmIChzZWxmLl9wdWJsaXNoZWQuaGFzKGlkKSlcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnNlcnQgZm91bmQgZm9yIGFscmVhZHktZXhpc3RpbmcgSUQgaW4gcHVibGlzaGVkXCIpO1xuICAgICAgICBpZiAoc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIgJiYgc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIuaGFzKGlkKSlcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnNlcnQgZm91bmQgZm9yIGFscmVhZHktZXhpc3RpbmcgSUQgaW4gYnVmZmVyXCIpO1xuXG4gICAgICAgIC8vIFhYWCB3aGF0IGlmIHNlbGVjdG9yIHlpZWxkcz8gIGZvciBub3cgaXQgY2FuJ3QgYnV0IGxhdGVyIGl0IGNvdWxkXG4gICAgICAgIC8vIGhhdmUgJHdoZXJlXG4gICAgICAgIGlmIChzZWxmLl9tYXRjaGVyLmRvY3VtZW50TWF0Y2hlcyhvcC5vKS5yZXN1bHQpXG4gICAgICAgICAgc2VsZi5fYWRkTWF0Y2hpbmcob3Aubyk7XG4gICAgICB9IGVsc2UgaWYgKG9wLm9wID09PSAndScpIHtcbiAgICAgICAgLy8gd2UgYXJlIG1hcHBpbmcgdGhlIG5ldyBvcGxvZyBmb3JtYXQgb24gbW9uZ28gNVxuICAgICAgICAvLyB0byB3aGF0IHdlIGtub3cgYmV0dGVyLCAkc2V0XG4gICAgICAgIG9wLm8gPSBvcGxvZ1YyVjFDb252ZXJ0ZXIob3AubylcbiAgICAgICAgLy8gSXMgdGhpcyBhIG1vZGlmaWVyICgkc2V0LyR1bnNldCwgd2hpY2ggbWF5IHJlcXVpcmUgdXMgdG8gcG9sbCB0aGVcbiAgICAgICAgLy8gZGF0YWJhc2UgdG8gZmlndXJlIG91dCBpZiB0aGUgd2hvbGUgZG9jdW1lbnQgbWF0Y2hlcyB0aGUgc2VsZWN0b3IpIG9yXG4gICAgICAgIC8vIGEgcmVwbGFjZW1lbnQgKGluIHdoaWNoIGNhc2Ugd2UgY2FuIGp1c3QgZGlyZWN0bHkgcmUtZXZhbHVhdGUgdGhlXG4gICAgICAgIC8vIHNlbGVjdG9yKT9cbiAgICAgICAgLy8gb3Bsb2cgZm9ybWF0IGhhcyBjaGFuZ2VkIG9uIG1vbmdvZGIgNSwgd2UgaGF2ZSB0byBzdXBwb3J0IGJvdGggbm93XG4gICAgICAgIC8vIGRpZmYgaXMgdGhlIGZvcm1hdCBpbiBNb25nbyA1KyAob3Bsb2cgdjIpXG4gICAgICAgIHZhciBpc1JlcGxhY2UgPSAhaGFzKG9wLm8sICckc2V0JykgJiYgIWhhcyhvcC5vLCAnZGlmZicpICYmICFoYXMob3AubywgJyR1bnNldCcpO1xuICAgICAgICAvLyBJZiB0aGlzIG1vZGlmaWVyIG1vZGlmaWVzIHNvbWV0aGluZyBpbnNpZGUgYW4gRUpTT04gY3VzdG9tIHR5cGUgKGllLFxuICAgICAgICAvLyBhbnl0aGluZyB3aXRoIEVKU09OJCksIHRoZW4gd2UgY2FuJ3QgdHJ5IHRvIHVzZVxuICAgICAgICAvLyBMb2NhbENvbGxlY3Rpb24uX21vZGlmeSwgc2luY2UgdGhhdCBqdXN0IG11dGF0ZXMgdGhlIEVKU09OIGVuY29kaW5nLFxuICAgICAgICAvLyBub3QgdGhlIGFjdHVhbCBvYmplY3QuXG4gICAgICAgIHZhciBjYW5EaXJlY3RseU1vZGlmeURvYyA9XG4gICAgICAgICAgIWlzUmVwbGFjZSAmJiBtb2RpZmllckNhbkJlRGlyZWN0bHlBcHBsaWVkKG9wLm8pO1xuXG4gICAgICAgIHZhciBwdWJsaXNoZWRCZWZvcmUgPSBzZWxmLl9wdWJsaXNoZWQuaGFzKGlkKTtcbiAgICAgICAgdmFyIGJ1ZmZlcmVkQmVmb3JlID0gc2VsZi5fbGltaXQgJiYgc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIuaGFzKGlkKTtcblxuICAgICAgICBpZiAoaXNSZXBsYWNlKSB7XG4gICAgICAgICAgc2VsZi5faGFuZGxlRG9jKGlkLCBPYmplY3QuYXNzaWduKHtfaWQ6IGlkfSwgb3AubykpO1xuICAgICAgICB9IGVsc2UgaWYgKChwdWJsaXNoZWRCZWZvcmUgfHwgYnVmZmVyZWRCZWZvcmUpICYmXG4gICAgICAgICAgICAgICAgICAgY2FuRGlyZWN0bHlNb2RpZnlEb2MpIHtcbiAgICAgICAgICAvLyBPaCBncmVhdCwgd2UgYWN0dWFsbHkga25vdyB3aGF0IHRoZSBkb2N1bWVudCBpcywgc28gd2UgY2FuIGFwcGx5XG4gICAgICAgICAgLy8gdGhpcyBkaXJlY3RseS5cbiAgICAgICAgICB2YXIgbmV3RG9jID0gc2VsZi5fcHVibGlzaGVkLmhhcyhpZClcbiAgICAgICAgICAgID8gc2VsZi5fcHVibGlzaGVkLmdldChpZCkgOiBzZWxmLl91bnB1Ymxpc2hlZEJ1ZmZlci5nZXQoaWQpO1xuICAgICAgICAgIG5ld0RvYyA9IEVKU09OLmNsb25lKG5ld0RvYyk7XG5cbiAgICAgICAgICBuZXdEb2MuX2lkID0gaWQ7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIExvY2FsQ29sbGVjdGlvbi5fbW9kaWZ5KG5ld0RvYywgb3Aubyk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGUubmFtZSAhPT0gXCJNaW5pbW9uZ29FcnJvclwiKVxuICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgLy8gV2UgZGlkbid0IHVuZGVyc3RhbmQgdGhlIG1vZGlmaWVyLiAgUmUtZmV0Y2guXG4gICAgICAgICAgICBzZWxmLl9uZWVkVG9GZXRjaC5zZXQoaWQsIG9wKTtcbiAgICAgICAgICAgIGlmIChzZWxmLl9waGFzZSA9PT0gUEhBU0UuU1RFQURZKSB7XG4gICAgICAgICAgICAgIHNlbGYuX2ZldGNoTW9kaWZpZWREb2N1bWVudHMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2VsZi5faGFuZGxlRG9jKGlkLCBzZWxmLl9zaGFyZWRQcm9qZWN0aW9uRm4obmV3RG9jKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIWNhbkRpcmVjdGx5TW9kaWZ5RG9jIHx8XG4gICAgICAgICAgICAgICAgICAgc2VsZi5fbWF0Y2hlci5jYW5CZWNvbWVUcnVlQnlNb2RpZmllcihvcC5vKSB8fFxuICAgICAgICAgICAgICAgICAgIChzZWxmLl9zb3J0ZXIgJiYgc2VsZi5fc29ydGVyLmFmZmVjdGVkQnlNb2RpZmllcihvcC5vKSkpIHtcbiAgICAgICAgICBzZWxmLl9uZWVkVG9GZXRjaC5zZXQoaWQsIG9wKTtcbiAgICAgICAgICBpZiAoc2VsZi5fcGhhc2UgPT09IFBIQVNFLlNURUFEWSlcbiAgICAgICAgICAgIHNlbGYuX2ZldGNoTW9kaWZpZWREb2N1bWVudHMoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJYWFggU1VSUFJJU0lORyBPUEVSQVRJT046IFwiICsgb3ApO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIGFzeW5jIF9ydW5Jbml0aWFsUXVlcnlBc3luYygpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX3N0b3BwZWQpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvcGxvZyBzdG9wcGVkIHN1cnByaXNpbmdseSBlYXJseVwiKTtcblxuICAgIGF3YWl0IHNlbGYuX3J1blF1ZXJ5KHtpbml0aWFsOiB0cnVlfSk7ICAvLyB5aWVsZHNcblxuICAgIGlmIChzZWxmLl9zdG9wcGVkKVxuICAgICAgcmV0dXJuOyAgLy8gY2FuIGhhcHBlbiBvbiBxdWVyeUVycm9yXG5cbiAgICAvLyBBbGxvdyBvYnNlcnZlQ2hhbmdlcyBjYWxscyB0byByZXR1cm4uIChBZnRlciB0aGlzLCBpdCdzIHBvc3NpYmxlIGZvclxuICAgIC8vIHN0b3AoKSB0byBiZSBjYWxsZWQuKVxuICAgIGF3YWl0IHNlbGYuX211bHRpcGxleGVyLnJlYWR5KCk7XG5cbiAgICBhd2FpdCBzZWxmLl9kb25lUXVlcnlpbmcoKTsgIC8vIHlpZWxkc1xuICB9LFxuXG4gIC8vIFlpZWxkcyFcbiAgX3J1bkluaXRpYWxRdWVyeTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9ydW5Jbml0aWFsUXVlcnlBc3luYygpO1xuICB9LFxuXG4gIC8vIEluIHZhcmlvdXMgY2lyY3Vtc3RhbmNlcywgd2UgbWF5IGp1c3Qgd2FudCB0byBzdG9wIHByb2Nlc3NpbmcgdGhlIG9wbG9nIGFuZFxuICAvLyByZS1ydW4gdGhlIGluaXRpYWwgcXVlcnksIGp1c3QgYXMgaWYgd2Ugd2VyZSBhIFBvbGxpbmdPYnNlcnZlRHJpdmVyLlxuICAvL1xuICAvLyBUaGlzIGZ1bmN0aW9uIG1heSBub3QgYmxvY2ssIGJlY2F1c2UgaXQgaXMgY2FsbGVkIGZyb20gYW4gb3Bsb2cgZW50cnlcbiAgLy8gaGFuZGxlci5cbiAgLy9cbiAgLy8gWFhYIFdlIHNob3VsZCBjYWxsIHRoaXMgd2hlbiB3ZSBkZXRlY3QgdGhhdCB3ZSd2ZSBiZWVuIGluIEZFVENISU5HIGZvciBcInRvb1xuICAvLyBsb25nXCIuXG4gIC8vXG4gIC8vIFhYWCBXZSBzaG91bGQgY2FsbCB0aGlzIHdoZW4gd2UgZGV0ZWN0IE1vbmdvIGZhaWxvdmVyIChzaW5jZSB0aGF0IG1pZ2h0XG4gIC8vIG1lYW4gdGhhdCBzb21lIG9mIHRoZSBvcGxvZyBlbnRyaWVzIHdlIGhhdmUgcHJvY2Vzc2VkIGhhdmUgYmVlbiByb2xsZWRcbiAgLy8gYmFjaykuIFRoZSBOb2RlIE1vbmdvIGRyaXZlciBpcyBpbiB0aGUgbWlkZGxlIG9mIGEgYnVuY2ggb2YgaHVnZVxuICAvLyByZWZhY3RvcmluZ3MsIGluY2x1ZGluZyB0aGUgd2F5IHRoYXQgaXQgbm90aWZpZXMgeW91IHdoZW4gcHJpbWFyeVxuICAvLyBjaGFuZ2VzLiBXaWxsIHB1dCBvZmYgaW1wbGVtZW50aW5nIHRoaXMgdW50aWwgZHJpdmVyIDEuNCBpcyBvdXQuXG4gIF9wb2xsUXVlcnk6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgTWV0ZW9yLl9ub1lpZWxkc0FsbG93ZWQoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHNlbGYuX3N0b3BwZWQpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgLy8gWWF5LCB3ZSBnZXQgdG8gZm9yZ2V0IGFib3V0IGFsbCB0aGUgdGhpbmdzIHdlIHRob3VnaHQgd2UgaGFkIHRvIGZldGNoLlxuICAgICAgc2VsZi5fbmVlZFRvRmV0Y2ggPSBuZXcgTG9jYWxDb2xsZWN0aW9uLl9JZE1hcDtcbiAgICAgIHNlbGYuX2N1cnJlbnRseUZldGNoaW5nID0gbnVsbDtcbiAgICAgICsrc2VsZi5fZmV0Y2hHZW5lcmF0aW9uOyAgLy8gaWdub3JlIGFueSBpbi1mbGlnaHQgZmV0Y2hlc1xuICAgICAgc2VsZi5fcmVnaXN0ZXJQaGFzZUNoYW5nZShQSEFTRS5RVUVSWUlORyk7XG5cbiAgICAgIC8vIERlZmVyIHNvIHRoYXQgd2UgZG9uJ3QgeWllbGQuICBXZSBkb24ndCBuZWVkIGZpbmlzaElmTmVlZFRvUG9sbFF1ZXJ5XG4gICAgICAvLyBoZXJlIGJlY2F1c2UgU3dpdGNoZWRUb1F1ZXJ5IGlzIG5vdCB0aHJvd24gaW4gUVVFUllJTkcgbW9kZS5cbiAgICAgIE1ldGVvci5kZWZlcihhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IHNlbGYuX3J1blF1ZXJ5KCk7XG4gICAgICAgIGF3YWl0IHNlbGYuX2RvbmVRdWVyeWluZygpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gWWllbGRzIVxuICBhc3luYyBfcnVuUXVlcnlBc3luYyhvcHRpb25zKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHZhciBuZXdSZXN1bHRzLCBuZXdCdWZmZXI7XG5cbiAgICAvLyBUaGlzIHdoaWxlIGxvb3AgaXMganVzdCB0byByZXRyeSBmYWlsdXJlcy5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgLy8gSWYgd2UndmUgYmVlbiBzdG9wcGVkLCB3ZSBkb24ndCBoYXZlIHRvIHJ1biBhbnl0aGluZyBhbnkgbW9yZS5cbiAgICAgIGlmIChzZWxmLl9zdG9wcGVkKVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIG5ld1Jlc3VsdHMgPSBuZXcgTG9jYWxDb2xsZWN0aW9uLl9JZE1hcDtcbiAgICAgIG5ld0J1ZmZlciA9IG5ldyBMb2NhbENvbGxlY3Rpb24uX0lkTWFwO1xuXG4gICAgICAvLyBRdWVyeSAyeCBkb2N1bWVudHMgYXMgdGhlIGhhbGYgZXhjbHVkZWQgZnJvbSB0aGUgb3JpZ2luYWwgcXVlcnkgd2lsbCBnb1xuICAgICAgLy8gaW50byB1bnB1Ymxpc2hlZCBidWZmZXIgdG8gcmVkdWNlIGFkZGl0aW9uYWwgTW9uZ28gbG9va3VwcyBpbiBjYXNlc1xuICAgICAgLy8gd2hlbiBkb2N1bWVudHMgYXJlIHJlbW92ZWQgZnJvbSB0aGUgcHVibGlzaGVkIHNldCBhbmQgbmVlZCBhXG4gICAgICAvLyByZXBsYWNlbWVudC5cbiAgICAgIC8vIFhYWCBuZWVkcyBtb3JlIHRob3VnaHQgb24gbm9uLXplcm8gc2tpcFxuICAgICAgLy8gWFhYIDIgaXMgYSBcIm1hZ2ljIG51bWJlclwiIG1lYW5pbmcgdGhlcmUgaXMgYW4gZXh0cmEgY2h1bmsgb2YgZG9jcyBmb3JcbiAgICAgIC8vIGJ1ZmZlciBpZiBzdWNoIGlzIG5lZWRlZC5cbiAgICAgIHZhciBjdXJzb3IgPSBzZWxmLl9jdXJzb3JGb3JRdWVyeSh7IGxpbWl0OiBzZWxmLl9saW1pdCAqIDIgfSk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBjdXJzb3IuZm9yRWFjaChmdW5jdGlvbiAoZG9jLCBpKSB7ICAvLyB5aWVsZHNcbiAgICAgICAgICBpZiAoIXNlbGYuX2xpbWl0IHx8IGkgPCBzZWxmLl9saW1pdCkge1xuICAgICAgICAgICAgbmV3UmVzdWx0cy5zZXQoZG9jLl9pZCwgZG9jKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3QnVmZmVyLnNldChkb2MuX2lkLCBkb2MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAob3B0aW9ucy5pbml0aWFsICYmIHR5cGVvZihlLmNvZGUpID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIC8vIFRoaXMgaXMgYW4gZXJyb3IgZG9jdW1lbnQgc2VudCB0byB1cyBieSBtb25nb2QsIG5vdCBhIGNvbm5lY3Rpb25cbiAgICAgICAgICAvLyBlcnJvciBnZW5lcmF0ZWQgYnkgdGhlIGNsaWVudC4gQW5kIHdlJ3ZlIG5ldmVyIHNlZW4gdGhpcyBxdWVyeSB3b3JrXG4gICAgICAgICAgLy8gc3VjY2Vzc2Z1bGx5LiBQcm9iYWJseSBpdCdzIGEgYmFkIHNlbGVjdG9yIG9yIHNvbWV0aGluZywgc28gd2VcbiAgICAgICAgICAvLyBzaG91bGQgTk9UIHJldHJ5LiBJbnN0ZWFkLCB3ZSBzaG91bGQgaGFsdCB0aGUgb2JzZXJ2ZSAod2hpY2ggZW5kc1xuICAgICAgICAgIC8vIHVwIGNhbGxpbmcgYHN0b3BgIG9uIHVzKS5cbiAgICAgICAgICBhd2FpdCBzZWxmLl9tdWx0aXBsZXhlci5xdWVyeUVycm9yKGUpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIER1cmluZyBmYWlsb3ZlciAoZWcpIGlmIHdlIGdldCBhbiBleGNlcHRpb24gd2Ugc2hvdWxkIGxvZyBhbmQgcmV0cnlcbiAgICAgICAgLy8gaW5zdGVhZCBvZiBjcmFzaGluZy5cbiAgICAgICAgTWV0ZW9yLl9kZWJ1ZyhcIkdvdCBleGNlcHRpb24gd2hpbGUgcG9sbGluZyBxdWVyeVwiLCBlKTtcbiAgICAgICAgYXdhaXQgTWV0ZW9yLl9zbGVlcEZvck1zKDEwMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNlbGYuX3N0b3BwZWQpXG4gICAgICByZXR1cm47XG5cbiAgICBzZWxmLl9wdWJsaXNoTmV3UmVzdWx0cyhuZXdSZXN1bHRzLCBuZXdCdWZmZXIpO1xuICB9LFxuXG4gIC8vIFlpZWxkcyFcbiAgX3J1blF1ZXJ5OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLl9ydW5RdWVyeUFzeW5jKG9wdGlvbnMpO1xuICB9LFxuXG4gIC8vIFRyYW5zaXRpb25zIHRvIFFVRVJZSU5HIGFuZCBydW5zIGFub3RoZXIgcXVlcnksIG9yIChpZiBhbHJlYWR5IGluIFFVRVJZSU5HKVxuICAvLyBlbnN1cmVzIHRoYXQgd2Ugd2lsbCBxdWVyeSBhZ2FpbiBsYXRlci5cbiAgLy9cbiAgLy8gVGhpcyBmdW5jdGlvbiBtYXkgbm90IGJsb2NrLCBiZWNhdXNlIGl0IGlzIGNhbGxlZCBmcm9tIGFuIG9wbG9nIGVudHJ5XG4gIC8vIGhhbmRsZXIuIEhvd2V2ZXIsIGlmIHdlIHdlcmUgbm90IGFscmVhZHkgaW4gdGhlIFFVRVJZSU5HIHBoYXNlLCBpdCB0aHJvd3NcbiAgLy8gYW4gZXhjZXB0aW9uIHRoYXQgaXMgY2F1Z2h0IGJ5IHRoZSBjbG9zZXN0IHN1cnJvdW5kaW5nXG4gIC8vIGZpbmlzaElmTmVlZFRvUG9sbFF1ZXJ5IGNhbGw7IHRoaXMgZW5zdXJlcyB0aGF0IHdlIGRvbid0IGNvbnRpbnVlIHJ1bm5pbmdcbiAgLy8gY2xvc2UgdGhhdCB3YXMgZGVzaWduZWQgZm9yIGFub3RoZXIgcGhhc2UgaW5zaWRlIFBIQVNFLlFVRVJZSU5HLlxuICAvL1xuICAvLyAoSXQncyBhbHNvIG5lY2Vzc2FyeSB3aGVuZXZlciBsb2dpYyBpbiB0aGlzIGZpbGUgeWllbGRzIHRvIGNoZWNrIHRoYXQgb3RoZXJcbiAgLy8gcGhhc2VzIGhhdmVuJ3QgcHV0IHVzIGludG8gUVVFUllJTkcgbW9kZSwgdGhvdWdoOyBlZyxcbiAgLy8gX2ZldGNoTW9kaWZpZWREb2N1bWVudHMgZG9lcyB0aGlzLilcbiAgX25lZWRUb1BvbGxRdWVyeTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBNZXRlb3IuX25vWWllbGRzQWxsb3dlZChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoc2VsZi5fc3RvcHBlZClcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICAvLyBJZiB3ZSdyZSBub3QgYWxyZWFkeSBpbiB0aGUgbWlkZGxlIG9mIGEgcXVlcnksIHdlIGNhbiBxdWVyeSBub3dcbiAgICAgIC8vIChwb3NzaWJseSBwYXVzaW5nIEZFVENISU5HKS5cbiAgICAgIGlmIChzZWxmLl9waGFzZSAhPT0gUEhBU0UuUVVFUllJTkcpIHtcbiAgICAgICAgc2VsZi5fcG9sbFF1ZXJ5KCk7XG4gICAgICAgIHRocm93IG5ldyBTd2l0Y2hlZFRvUXVlcnk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlJ3JlIGN1cnJlbnRseSBpbiBRVUVSWUlORy4gU2V0IGEgZmxhZyB0byBlbnN1cmUgdGhhdCB3ZSBydW4gYW5vdGhlclxuICAgICAgLy8gcXVlcnkgd2hlbiB3ZSdyZSBkb25lLlxuICAgICAgc2VsZi5fcmVxdWVyeVdoZW5Eb25lVGhpc1F1ZXJ5ID0gdHJ1ZTtcbiAgICB9KTtcbiAgfSxcblxuICAvLyBZaWVsZHMhXG4gIF9kb25lUXVlcnlpbmc6IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAoc2VsZi5fc3RvcHBlZClcbiAgICAgIHJldHVybjtcblxuICAgIGF3YWl0IHNlbGYuX21vbmdvSGFuZGxlLl9vcGxvZ0hhbmRsZS53YWl0VW50aWxDYXVnaHRVcCgpO1xuXG4gICAgaWYgKHNlbGYuX3N0b3BwZWQpXG4gICAgICByZXR1cm47XG5cbiAgICBpZiAoc2VsZi5fcGhhc2UgIT09IFBIQVNFLlFVRVJZSU5HKVxuICAgICAgdGhyb3cgRXJyb3IoXCJQaGFzZSB1bmV4cGVjdGVkbHkgXCIgKyBzZWxmLl9waGFzZSk7XG5cbiAgICBpZiAoc2VsZi5fcmVxdWVyeVdoZW5Eb25lVGhpc1F1ZXJ5KSB7XG4gICAgICBzZWxmLl9yZXF1ZXJ5V2hlbkRvbmVUaGlzUXVlcnkgPSBmYWxzZTtcbiAgICAgIHNlbGYuX3BvbGxRdWVyeSgpO1xuICAgIH0gZWxzZSBpZiAoc2VsZi5fbmVlZFRvRmV0Y2guZW1wdHkoKSkge1xuICAgICAgYXdhaXQgc2VsZi5fYmVTdGVhZHkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5fZmV0Y2hNb2RpZmllZERvY3VtZW50cygpO1xuICAgIH1cbiAgfSxcblxuICBfY3Vyc29yRm9yUXVlcnk6IGZ1bmN0aW9uIChvcHRpb25zT3ZlcndyaXRlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBNZXRlb3IuX25vWWllbGRzQWxsb3dlZChmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBUaGUgcXVlcnkgd2UgcnVuIGlzIGFsbW9zdCB0aGUgc2FtZSBhcyB0aGUgY3Vyc29yIHdlIGFyZSBvYnNlcnZpbmcsXG4gICAgICAvLyB3aXRoIGEgZmV3IGNoYW5nZXMuIFdlIG5lZWQgdG8gcmVhZCBhbGwgdGhlIGZpZWxkcyB0aGF0IGFyZSByZWxldmFudCB0b1xuICAgICAgLy8gdGhlIHNlbGVjdG9yLCBub3QganVzdCB0aGUgZmllbGRzIHdlIGFyZSBnb2luZyB0byBwdWJsaXNoICh0aGF0J3MgdGhlXG4gICAgICAvLyBcInNoYXJlZFwiIHByb2plY3Rpb24pLiBBbmQgd2UgZG9uJ3Qgd2FudCB0byBhcHBseSBhbnkgdHJhbnNmb3JtIGluIHRoZVxuICAgICAgLy8gY3Vyc29yLCBiZWNhdXNlIG9ic2VydmVDaGFuZ2VzIHNob3VsZG4ndCB1c2UgdGhlIHRyYW5zZm9ybS5cbiAgICAgIHZhciBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgc2VsZi5fY3Vyc29yRGVzY3JpcHRpb24ub3B0aW9ucyk7XG5cbiAgICAgIC8vIEFsbG93IHRoZSBjYWxsZXIgdG8gbW9kaWZ5IHRoZSBvcHRpb25zLiBVc2VmdWwgdG8gc3BlY2lmeSBkaWZmZXJlbnRcbiAgICAgIC8vIHNraXAgYW5kIGxpbWl0IHZhbHVlcy5cbiAgICAgIE9iamVjdC5hc3NpZ24ob3B0aW9ucywgb3B0aW9uc092ZXJ3cml0ZSk7XG5cbiAgICAgIG9wdGlvbnMuZmllbGRzID0gc2VsZi5fc2hhcmVkUHJvamVjdGlvbjtcbiAgICAgIGRlbGV0ZSBvcHRpb25zLnRyYW5zZm9ybTtcbiAgICAgIC8vIFdlIGFyZSBOT1QgZGVlcCBjbG9uaW5nIGZpZWxkcyBvciBzZWxlY3RvciBoZXJlLCB3aGljaCBzaG91bGQgYmUgT0suXG4gICAgICB2YXIgZGVzY3JpcHRpb24gPSBuZXcgQ3Vyc29yRGVzY3JpcHRpb24oXG4gICAgICAgIHNlbGYuX2N1cnNvckRlc2NyaXB0aW9uLmNvbGxlY3Rpb25OYW1lLFxuICAgICAgICBzZWxmLl9jdXJzb3JEZXNjcmlwdGlvbi5zZWxlY3RvcixcbiAgICAgICAgb3B0aW9ucyk7XG4gICAgICByZXR1cm4gbmV3IEN1cnNvcihzZWxmLl9tb25nb0hhbmRsZSwgZGVzY3JpcHRpb24pO1xuICAgIH0pO1xuICB9LFxuXG5cbiAgLy8gUmVwbGFjZSBzZWxmLl9wdWJsaXNoZWQgd2l0aCBuZXdSZXN1bHRzIChib3RoIGFyZSBJZE1hcHMpLCBpbnZva2luZyBvYnNlcnZlXG4gIC8vIGNhbGxiYWNrcyBvbiB0aGUgbXVsdGlwbGV4ZXIuXG4gIC8vIFJlcGxhY2Ugc2VsZi5fdW5wdWJsaXNoZWRCdWZmZXIgd2l0aCBuZXdCdWZmZXIuXG4gIC8vXG4gIC8vIFhYWCBUaGlzIGlzIHZlcnkgc2ltaWxhciB0byBMb2NhbENvbGxlY3Rpb24uX2RpZmZRdWVyeVVub3JkZXJlZENoYW5nZXMuIFdlXG4gIC8vIHNob3VsZCByZWFsbHk6IChhKSBVbmlmeSBJZE1hcCBhbmQgT3JkZXJlZERpY3QgaW50byBVbm9yZGVyZWQvT3JkZXJlZERpY3RcbiAgLy8gKGIpIFJld3JpdGUgZGlmZi5qcyB0byB1c2UgdGhlc2UgY2xhc3NlcyBpbnN0ZWFkIG9mIGFycmF5cyBhbmQgb2JqZWN0cy5cbiAgX3B1Ymxpc2hOZXdSZXN1bHRzOiBmdW5jdGlvbiAobmV3UmVzdWx0cywgbmV3QnVmZmVyKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIE1ldGVvci5fbm9ZaWVsZHNBbGxvd2VkKGZ1bmN0aW9uICgpIHtcblxuICAgICAgLy8gSWYgdGhlIHF1ZXJ5IGlzIGxpbWl0ZWQgYW5kIHRoZXJlIGlzIGEgYnVmZmVyLCBzaHV0IGRvd24gc28gaXQgZG9lc24ndFxuICAgICAgLy8gc3RheSBpbiBhIHdheS5cbiAgICAgIGlmIChzZWxmLl9saW1pdCkge1xuICAgICAgICBzZWxmLl91bnB1Ymxpc2hlZEJ1ZmZlci5jbGVhcigpO1xuICAgICAgfVxuXG4gICAgICAvLyBGaXJzdCByZW1vdmUgYW55dGhpbmcgdGhhdCdzIGdvbmUuIEJlIGNhcmVmdWwgbm90IHRvIG1vZGlmeVxuICAgICAgLy8gc2VsZi5fcHVibGlzaGVkIHdoaWxlIGl0ZXJhdGluZyBvdmVyIGl0LlxuICAgICAgdmFyIGlkc1RvUmVtb3ZlID0gW107XG4gICAgICBzZWxmLl9wdWJsaXNoZWQuZm9yRWFjaChmdW5jdGlvbiAoZG9jLCBpZCkge1xuICAgICAgICBpZiAoIW5ld1Jlc3VsdHMuaGFzKGlkKSlcbiAgICAgICAgICBpZHNUb1JlbW92ZS5wdXNoKGlkKTtcbiAgICAgIH0pO1xuICAgICAgaWRzVG9SZW1vdmUuZm9yRWFjaChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgc2VsZi5fcmVtb3ZlUHVibGlzaGVkKGlkKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBOb3cgZG8gYWRkcyBhbmQgY2hhbmdlcy5cbiAgICAgIC8vIElmIHNlbGYgaGFzIGEgYnVmZmVyIGFuZCBsaW1pdCwgdGhlIG5ldyBmZXRjaGVkIHJlc3VsdCB3aWxsIGJlXG4gICAgICAvLyBsaW1pdGVkIGNvcnJlY3RseSBhcyB0aGUgcXVlcnkgaGFzIHNvcnQgc3BlY2lmaWVyLlxuICAgICAgbmV3UmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uIChkb2MsIGlkKSB7XG4gICAgICAgIHNlbGYuX2hhbmRsZURvYyhpZCwgZG9jKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBTYW5pdHktY2hlY2sgdGhhdCBldmVyeXRoaW5nIHdlIHRyaWVkIHRvIHB1dCBpbnRvIF9wdWJsaXNoZWQgZW5kZWQgdXBcbiAgICAgIC8vIHRoZXJlLlxuICAgICAgLy8gWFhYIGlmIHRoaXMgaXMgc2xvdywgcmVtb3ZlIGl0IGxhdGVyXG4gICAgICBpZiAoc2VsZi5fcHVibGlzaGVkLnNpemUoKSAhPT0gbmV3UmVzdWx0cy5zaXplKCkpIHtcbiAgICAgICAgTWV0ZW9yLl9kZWJ1ZygnVGhlIE1vbmdvIHNlcnZlciBhbmQgdGhlIE1ldGVvciBxdWVyeSBkaXNhZ3JlZSBvbiBob3cgJyArXG4gICAgICAgICAgJ21hbnkgZG9jdW1lbnRzIG1hdGNoIHlvdXIgcXVlcnkuIEN1cnNvciBkZXNjcmlwdGlvbjogJyxcbiAgICAgICAgICBzZWxmLl9jdXJzb3JEZXNjcmlwdGlvbik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHNlbGYuX3B1Ymxpc2hlZC5mb3JFYWNoKGZ1bmN0aW9uIChkb2MsIGlkKSB7XG4gICAgICAgIGlmICghbmV3UmVzdWx0cy5oYXMoaWQpKVxuICAgICAgICAgIHRocm93IEVycm9yKFwiX3B1Ymxpc2hlZCBoYXMgYSBkb2MgdGhhdCBuZXdSZXN1bHRzIGRvZXNuJ3Q7IFwiICsgaWQpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEZpbmFsbHksIHJlcGxhY2UgdGhlIGJ1ZmZlclxuICAgICAgbmV3QnVmZmVyLmZvckVhY2goZnVuY3Rpb24gKGRvYywgaWQpIHtcbiAgICAgICAgc2VsZi5fYWRkQnVmZmVyZWQoaWQsIGRvYyk7XG4gICAgICB9KTtcblxuICAgICAgc2VsZi5fc2FmZUFwcGVuZFRvQnVmZmVyID0gbmV3QnVmZmVyLnNpemUoKSA8IHNlbGYuX2xpbWl0O1xuICAgIH0pO1xuICB9LFxuXG4gIC8vIFRoaXMgc3RvcCBmdW5jdGlvbiBpcyBpbnZva2VkIGZyb20gdGhlIG9uU3RvcCBvZiB0aGUgT2JzZXJ2ZU11bHRpcGxleGVyLCBzb1xuICAvLyBpdCBzaG91bGRuJ3QgYWN0dWFsbHkgYmUgcG9zc2libGUgdG8gY2FsbCBpdCB1bnRpbCB0aGUgbXVsdGlwbGV4ZXIgaXNcbiAgLy8gcmVhZHkuXG4gIC8vXG4gIC8vIEl0J3MgaW1wb3J0YW50IHRvIGNoZWNrIHNlbGYuX3N0b3BwZWQgYWZ0ZXIgZXZlcnkgY2FsbCBpbiB0aGlzIGZpbGUgdGhhdFxuICAvLyBjYW4geWllbGQhXG4gIF9zdG9wOiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuX3N0b3BwZWQpXG4gICAgICByZXR1cm47XG4gICAgc2VsZi5fc3RvcHBlZCA9IHRydWU7XG5cbiAgICAvLyBOb3RlOiB3ZSAqZG9uJ3QqIHVzZSBtdWx0aXBsZXhlci5vbkZsdXNoIGhlcmUgYmVjYXVzZSB0aGlzIHN0b3BcbiAgICAvLyBjYWxsYmFjayBpcyBhY3R1YWxseSBpbnZva2VkIGJ5IHRoZSBtdWx0aXBsZXhlciBpdHNlbGYgd2hlbiBpdCBoYXNcbiAgICAvLyBkZXRlcm1pbmVkIHRoYXQgdGhlcmUgYXJlIG5vIGhhbmRsZXMgbGVmdC4gU28gbm90aGluZyBpcyBhY3R1YWxseSBnb2luZ1xuICAgIC8vIHRvIGdldCBmbHVzaGVkIChhbmQgaXQncyBwcm9iYWJseSBub3QgdmFsaWQgdG8gY2FsbCBtZXRob2RzIG9uIHRoZVxuICAgIC8vIGR5aW5nIG11bHRpcGxleGVyKS5cbiAgICBmb3IgKGNvbnN0IHcgb2Ygc2VsZi5fd3JpdGVzVG9Db21taXRXaGVuV2VSZWFjaFN0ZWFkeSkge1xuICAgICAgYXdhaXQgdy5jb21taXR0ZWQoKTtcbiAgICB9XG4gICAgc2VsZi5fd3JpdGVzVG9Db21taXRXaGVuV2VSZWFjaFN0ZWFkeSA9IG51bGw7XG5cbiAgICAvLyBQcm9hY3RpdmVseSBkcm9wIHJlZmVyZW5jZXMgdG8gcG90ZW50aWFsbHkgYmlnIHRoaW5ncy5cbiAgICBzZWxmLl9wdWJsaXNoZWQgPSBudWxsO1xuICAgIHNlbGYuX3VucHVibGlzaGVkQnVmZmVyID0gbnVsbDtcbiAgICBzZWxmLl9uZWVkVG9GZXRjaCA9IG51bGw7XG4gICAgc2VsZi5fY3VycmVudGx5RmV0Y2hpbmcgPSBudWxsO1xuICAgIHNlbGYuX29wbG9nRW50cnlIYW5kbGUgPSBudWxsO1xuICAgIHNlbGYuX2xpc3RlbmVyc0hhbmRsZSA9IG51bGw7XG5cbiAgICBQYWNrYWdlWydmYWN0cy1iYXNlJ10gJiYgUGFja2FnZVsnZmFjdHMtYmFzZSddLkZhY3RzLmluY3JlbWVudFNlcnZlckZhY3QoXG4gICAgICAgIFwibW9uZ28tbGl2ZWRhdGFcIiwgXCJvYnNlcnZlLWRyaXZlcnMtb3Bsb2dcIiwgLTEpO1xuXG4gICAgZm9yIGF3YWl0IChjb25zdCBoYW5kbGUgb2Ygc2VsZi5fc3RvcEhhbmRsZXMpIHtcbiAgICAgIGF3YWl0IGhhbmRsZS5zdG9wKCk7XG4gICAgfVxuICB9LFxuICBzdG9wOiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gYXdhaXQgc2VsZi5fc3RvcCgpO1xuICB9LFxuXG4gIF9yZWdpc3RlclBoYXNlQ2hhbmdlOiBmdW5jdGlvbiAocGhhc2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgTWV0ZW9yLl9ub1lpZWxkc0FsbG93ZWQoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlO1xuXG4gICAgICBpZiAoc2VsZi5fcGhhc2UpIHtcbiAgICAgICAgdmFyIHRpbWVEaWZmID0gbm93IC0gc2VsZi5fcGhhc2VTdGFydFRpbWU7XG4gICAgICAgIFBhY2thZ2VbJ2ZhY3RzLWJhc2UnXSAmJiBQYWNrYWdlWydmYWN0cy1iYXNlJ10uRmFjdHMuaW5jcmVtZW50U2VydmVyRmFjdChcbiAgICAgICAgICBcIm1vbmdvLWxpdmVkYXRhXCIsIFwidGltZS1zcGVudC1pbi1cIiArIHNlbGYuX3BoYXNlICsgXCItcGhhc2VcIiwgdGltZURpZmYpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLl9waGFzZSA9IHBoYXNlO1xuICAgICAgc2VsZi5fcGhhc2VTdGFydFRpbWUgPSBub3c7XG4gICAgfSk7XG4gIH1cbn0pO1xuXG4vLyBEb2VzIG91ciBvcGxvZyB0YWlsaW5nIGNvZGUgc3VwcG9ydCB0aGlzIGN1cnNvcj8gRm9yIG5vdywgd2UgYXJlIGJlaW5nIHZlcnlcbi8vIGNvbnNlcnZhdGl2ZSBhbmQgYWxsb3dpbmcgb25seSBzaW1wbGUgcXVlcmllcyB3aXRoIHNpbXBsZSBvcHRpb25zLlxuLy8gKFRoaXMgaXMgYSBcInN0YXRpYyBtZXRob2RcIi4pXG5PcGxvZ09ic2VydmVEcml2ZXIuY3Vyc29yU3VwcG9ydGVkID0gZnVuY3Rpb24gKGN1cnNvckRlc2NyaXB0aW9uLCBtYXRjaGVyKSB7XG4gIC8vIEZpcnN0LCBjaGVjayB0aGUgb3B0aW9ucy5cbiAgdmFyIG9wdGlvbnMgPSBjdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zO1xuXG4gIC8vIERpZCB0aGUgdXNlciBzYXkgbm8gZXhwbGljaXRseT9cbiAgLy8gdW5kZXJzY29yZWQgdmVyc2lvbiBvZiB0aGUgb3B0aW9uIGlzIENPTVBBVCB3aXRoIDEuMlxuICBpZiAob3B0aW9ucy5kaXNhYmxlT3Bsb2cgfHwgb3B0aW9ucy5fZGlzYWJsZU9wbG9nKVxuICAgIHJldHVybiBmYWxzZTtcblxuICAvLyBza2lwIGlzIG5vdCBzdXBwb3J0ZWQ6IHRvIHN1cHBvcnQgaXQgd2Ugd291bGQgbmVlZCB0byBrZWVwIHRyYWNrIG9mIGFsbFxuICAvLyBcInNraXBwZWRcIiBkb2N1bWVudHMgb3IgYXQgbGVhc3QgdGhlaXIgaWRzLlxuICAvLyBsaW1pdCB3L28gYSBzb3J0IHNwZWNpZmllciBpcyBub3Qgc3VwcG9ydGVkOiBjdXJyZW50IGltcGxlbWVudGF0aW9uIG5lZWRzIGFcbiAgLy8gZGV0ZXJtaW5pc3RpYyB3YXkgdG8gb3JkZXIgZG9jdW1lbnRzLlxuICBpZiAob3B0aW9ucy5za2lwIHx8IChvcHRpb25zLmxpbWl0ICYmICFvcHRpb25zLnNvcnQpKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gSWYgYSBmaWVsZHMgcHJvamVjdGlvbiBvcHRpb24gaXMgZ2l2ZW4gY2hlY2sgaWYgaXQgaXMgc3VwcG9ydGVkIGJ5XG4gIC8vIG1pbmltb25nbyAoc29tZSBvcGVyYXRvcnMgYXJlIG5vdCBzdXBwb3J0ZWQpLlxuICBjb25zdCBmaWVsZHMgPSBvcHRpb25zLmZpZWxkcyB8fCBvcHRpb25zLnByb2plY3Rpb247XG4gIGlmIChmaWVsZHMpIHtcbiAgICB0cnkge1xuICAgICAgTG9jYWxDb2xsZWN0aW9uLl9jaGVja1N1cHBvcnRlZFByb2plY3Rpb24oZmllbGRzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZS5uYW1lID09PSBcIk1pbmltb25nb0Vycm9yXCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBXZSBkb24ndCBhbGxvdyB0aGUgZm9sbG93aW5nIHNlbGVjdG9yczpcbiAgLy8gICAtICR3aGVyZSAobm90IGNvbmZpZGVudCB0aGF0IHdlIHByb3ZpZGUgdGhlIHNhbWUgSlMgZW52aXJvbm1lbnRcbiAgLy8gICAgICAgICAgICAgYXMgTW9uZ28sIGFuZCBjYW4geWllbGQhKVxuICAvLyAgIC0gJG5lYXIgKGhhcyBcImludGVyZXN0aW5nXCIgcHJvcGVydGllcyBpbiBNb25nb0RCLCBsaWtlIHRoZSBwb3NzaWJpbGl0eVxuICAvLyAgICAgICAgICAgIG9mIHJldHVybmluZyBhbiBJRCBtdWx0aXBsZSB0aW1lcywgdGhvdWdoIGV2ZW4gcG9sbGluZyBtYXliZVxuICAvLyAgICAgICAgICAgIGhhdmUgYSBidWcgdGhlcmUpXG4gIC8vICAgICAgICAgICBYWFg6IG9uY2Ugd2Ugc3VwcG9ydCBpdCwgd2Ugd291bGQgbmVlZCB0byB0aGluayBtb3JlIG9uIGhvdyB3ZVxuICAvLyAgICAgICAgICAgaW5pdGlhbGl6ZSB0aGUgY29tcGFyYXRvcnMgd2hlbiB3ZSBjcmVhdGUgdGhlIGRyaXZlci5cbiAgcmV0dXJuICFtYXRjaGVyLmhhc1doZXJlKCkgJiYgIW1hdGNoZXIuaGFzR2VvUXVlcnkoKTtcbn07XG5cbnZhciBtb2RpZmllckNhbkJlRGlyZWN0bHlBcHBsaWVkID0gZnVuY3Rpb24gKG1vZGlmaWVyKSB7XG4gIHJldHVybiBPYmplY3QuZW50cmllcyhtb2RpZmllcikuZXZlcnkoZnVuY3Rpb24gKFtvcGVyYXRpb24sIGZpZWxkc10pIHtcbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXMoZmllbGRzKS5ldmVyeShmdW5jdGlvbiAoW2ZpZWxkLCB2YWx1ZV0pIHtcbiAgICAgIHJldHVybiAhL0VKU09OXFwkLy50ZXN0KGZpZWxkKTtcbiAgICB9KTtcbiAgfSk7XG59OyIsIi8qKlxuICogQ29udmVydGVyIG1vZHVsZSBmb3IgdGhlIG5ldyBNb25nb0RCIE9wbG9nIGZvcm1hdCAoPj01LjApIHRvIHRoZSBvbmUgdGhhdCBNZXRlb3JcbiAqIGhhbmRsZXMgd2VsbCwgaS5lLiwgYCRzZXRgIGFuZCBgJHVuc2V0YC4gVGhlIG5ldyBmb3JtYXQgaXMgY29tcGxldGVseSBuZXcsXG4gKiBhbmQgbG9va3MgYXMgZm9sbG93czpcbiAqXG4gKiBgYGBqc1xuICogeyAkdjogMiwgZGlmZjogRGlmZiB9XG4gKiBgYGBcbiAqXG4gKiB3aGVyZSBgRGlmZmAgaXMgYSByZWN1cnNpdmUgc3RydWN0dXJlOlxuICogYGBganNcbiAqIHtcbiAqICAgLy8gTmVzdGVkIHVwZGF0ZXMgKHNvbWV0aW1lcyBhbHNvIHJlcHJlc2VudGVkIHdpdGggYW4gcy1maWVsZCkuXG4gKiAgIC8vIEV4YW1wbGU6IGB7ICRzZXQ6IHsgJ2Zvby5iYXInOiAxIH0gfWAuXG4gKiAgIGk6IHsgPGtleT46IDx2YWx1ZT4sIC4uLiB9LFxuICpcbiAqICAgLy8gVG9wLWxldmVsIHVwZGF0ZXMuXG4gKiAgIC8vIEV4YW1wbGU6IGB7ICRzZXQ6IHsgZm9vOiB7IGJhcjogMSB9IH0gfWAuXG4gKiAgIHU6IHsgPGtleT46IDx2YWx1ZT4sIC4uLiB9LFxuICpcbiAqICAgLy8gVW5zZXRzLlxuICogICAvLyBFeGFtcGxlOiBgeyAkdW5zZXQ6IHsgZm9vOiAnJyB9IH1gLlxuICogICBkOiB7IDxrZXk+OiBmYWxzZSwgLi4uIH0sXG4gKlxuICogICAvLyBBcnJheSBvcGVyYXRpb25zLlxuICogICAvLyBFeGFtcGxlOiBgeyAkcHVzaDogeyBmb286ICdiYXInIH0gfWAuXG4gKiAgIHM8a2V5PjogeyBhOiB0cnVlLCB1PGluZGV4PjogPHZhbHVlPiwgLi4uIH0sXG4gKiAgIC4uLlxuICpcbiAqICAgLy8gTmVzdGVkIG9wZXJhdGlvbnMgKHNvbWV0aW1lcyBhbHNvIHJlcHJlc2VudGVkIGluIHRoZSBgaWAgZmllbGQpLlxuICogICAvLyBFeGFtcGxlOiBgeyAkc2V0OiB7ICdmb28uYmFyJzogMSB9IH1gLlxuICogICBzPGtleT46IERpZmYsXG4gKiAgIC4uLlxuICogfVxuICogYGBgXG4gKlxuICogKGFsbCBmaWVsZHMgYXJlIG9wdGlvbmFsKVxuICovXG5cbmltcG9ydCB7IEVKU09OIH0gZnJvbSAnbWV0ZW9yL2Vqc29uJztcblxuaW50ZXJmYWNlIE9wbG9nRW50cnkge1xuICAkdjogbnVtYmVyO1xuICBkaWZmPzogT3Bsb2dEaWZmO1xuICAkc2V0PzogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgJHVuc2V0PzogUmVjb3JkPHN0cmluZywgdHJ1ZT47XG59XG5cbmludGVyZmFjZSBPcGxvZ0RpZmYge1xuICBpPzogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgdT86IFJlY29yZDxzdHJpbmcsIGFueT47XG4gIGQ/OiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPjtcbiAgW2tleTogYHMke3N0cmluZ31gXTogQXJyYXlPcGVyYXRvciB8IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbmludGVyZmFjZSBBcnJheU9wZXJhdG9yIHtcbiAgYTogdHJ1ZTtcbiAgW2tleTogYHUke251bWJlcn1gXTogYW55O1xufVxuXG5jb25zdCBhcnJheU9wZXJhdG9yS2V5UmVnZXggPSAvXihhfFtzdV1cXGQrKSQvO1xuXG4vKipcbiAqIENoZWNrcyBpZiBhIGZpZWxkIGlzIGFuIGFycmF5IG9wZXJhdG9yIGtleSBvZiBmb3JtICdhJyBvciAnczEnIG9yICd1MScgZXRjXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlPcGVyYXRvcktleShmaWVsZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBhcnJheU9wZXJhdG9yS2V5UmVnZXgudGVzdChmaWVsZCk7XG59XG5cbi8qKlxuICogVHlwZSBndWFyZCB0byBjaGVjayBpZiBhbiBvcGVyYXRvciBpcyBhIHZhbGlkIGFycmF5IG9wZXJhdG9yLlxuICogQXJyYXkgb3BlcmF0b3JzIGhhdmUgJ2E6IHRydWUnIGFuZCBrZXlzIHRoYXQgbWF0Y2ggdGhlIGFycmF5T3BlcmF0b3JLZXlSZWdleFxuICovXG5mdW5jdGlvbiBpc0FycmF5T3BlcmF0b3Iob3BlcmF0b3I6IHVua25vd24pOiBvcGVyYXRvciBpcyBBcnJheU9wZXJhdG9yIHtcbiAgcmV0dXJuIChcbiAgICBvcGVyYXRvciAhPT0gbnVsbCAmJlxuICAgIHR5cGVvZiBvcGVyYXRvciA9PT0gJ29iamVjdCcgJiZcbiAgICAnYScgaW4gb3BlcmF0b3IgJiZcbiAgICAob3BlcmF0b3IgYXMgQXJyYXlPcGVyYXRvcikuYSA9PT0gdHJ1ZSAmJlxuICAgIE9iamVjdC5rZXlzKG9wZXJhdG9yKS5ldmVyeShpc0FycmF5T3BlcmF0b3JLZXkpXG4gICk7XG59XG5cbi8qKlxuICogSm9pbnMgdHdvIHBhcnRzIG9mIGEgZmllbGQgcGF0aCB3aXRoIGEgZG90LlxuICogUmV0dXJucyB0aGUga2V5IGl0c2VsZiBpZiBwcmVmaXggaXMgZW1wdHkuXG4gKi9cbmZ1bmN0aW9uIGpvaW4ocHJlZml4OiBzdHJpbmcsIGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHByZWZpeCA/IGAke3ByZWZpeH0uJHtrZXl9YCA6IGtleTtcbn1cblxuLyoqXG4gKiBSZWN1cnNpdmVseSBmbGF0dGVucyBhbiBvYmplY3QgaW50byBhIHRhcmdldCBvYmplY3Qgd2l0aCBkb3Qgbm90YXRpb24gcGF0aHMuXG4gKiBIYW5kbGVzIHNwZWNpYWwgY2FzZXM6XG4gKiAtIEFycmF5cyBhcmUgYXNzaWduZWQgZGlyZWN0bHlcbiAqIC0gQ3VzdG9tIEVKU09OIHR5cGVzIGFyZSBwcmVzZXJ2ZWRcbiAqIC0gTW9uZ28uT2JqZWN0SURzIGFyZSBwcmVzZXJ2ZWRcbiAqIC0gUGxhaW4gb2JqZWN0cyBhcmUgcmVjdXJzaXZlbHkgZmxhdHRlbmVkXG4gKiAtIEVtcHR5IG9iamVjdHMgYXJlIGFzc2lnbmVkIGRpcmVjdGx5XG4gKi9cbmZ1bmN0aW9uIGZsYXR0ZW5PYmplY3RJbnRvKFxuICB0YXJnZXQ6IFJlY29yZDxzdHJpbmcsIGFueT4sXG4gIHNvdXJjZTogYW55LFxuICBwcmVmaXg6IHN0cmluZ1xuKTogdm9pZCB7XG4gIGlmIChcbiAgICBBcnJheS5pc0FycmF5KHNvdXJjZSkgfHxcbiAgICB0eXBlb2Ygc291cmNlICE9PSAnb2JqZWN0JyB8fFxuICAgIHNvdXJjZSA9PT0gbnVsbCB8fFxuICAgIHNvdXJjZSBpbnN0YW5jZW9mIE1vbmdvLk9iamVjdElEIHx8XG4gICAgRUpTT04uX2lzQ3VzdG9tVHlwZShzb3VyY2UpXG4gICkge1xuICAgIHRhcmdldFtwcmVmaXhdID0gc291cmNlO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyhzb3VyY2UpO1xuICBpZiAoZW50cmllcy5sZW5ndGgpIHtcbiAgICBlbnRyaWVzLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgZmxhdHRlbk9iamVjdEludG8odGFyZ2V0LCB2YWx1ZSwgam9pbihwcmVmaXgsIGtleSkpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHRhcmdldFtwcmVmaXhdID0gc291cmNlO1xuICB9XG59XG5cbi8qKlxuICogQ29udmVydHMgYW4gb3Bsb2cgZGlmZiB0byBhIHNlcmllcyBvZiAkc2V0IGFuZCAkdW5zZXQgb3BlcmF0aW9ucy5cbiAqIEhhbmRsZXMgc2V2ZXJhbCB0eXBlcyBvZiBvcGVyYXRpb25zOlxuICogLSBEaXJlY3QgdW5zZXRzIHZpYSAnZCcgZmllbGRcbiAqIC0gTmVzdGVkIHNldHMgdmlhICdpJyBmaWVsZFxuICogLSBUb3AtbGV2ZWwgc2V0cyB2aWEgJ3UnIGZpZWxkXG4gKiAtIEFycmF5IG9wZXJhdGlvbnMgYW5kIG5lc3RlZCBvYmplY3RzIHZpYSAncycgcHJlZml4ZWQgZmllbGRzXG4gKlxuICogUHJlc2VydmVzIHRoZSBzdHJ1Y3R1cmUgb2YgRUpTT04gY3VzdG9tIHR5cGVzIGFuZCBPYmplY3RJRHMgd2hpbGVcbiAqIGZsYXR0ZW5pbmcgcGF0aHMgaW50byBkb3Qgbm90YXRpb24gZm9yIE1vbmdvREIgdXBkYXRlcy5cbiAqL1xuZnVuY3Rpb24gY29udmVydE9wbG9nRGlmZihcbiAgb3Bsb2dFbnRyeTogT3Bsb2dFbnRyeSxcbiAgZGlmZjogT3Bsb2dEaWZmLFxuICBwcmVmaXggPSAnJ1xuKTogdm9pZCB7XG4gIE9iamVjdC5lbnRyaWVzKGRpZmYpLmZvckVhY2goKFtkaWZmS2V5LCB2YWx1ZV0pID0+IHtcbiAgICBpZiAoZGlmZktleSA9PT0gJ2QnKSB7XG4gICAgICAvLyBIYW5kbGUgYCR1bnNldGBzXG4gICAgICBvcGxvZ0VudHJ5LiR1bnNldCA/Pz0ge307XG4gICAgICBPYmplY3Qua2V5cyh2YWx1ZSkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBvcGxvZ0VudHJ5LiR1bnNldCFbam9pbihwcmVmaXgsIGtleSldID0gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZGlmZktleSA9PT0gJ2knKSB7XG4gICAgICAvLyBIYW5kbGUgKHBvdGVudGlhbGx5KSBuZXN0ZWQgYCRzZXRgc1xuICAgICAgb3Bsb2dFbnRyeS4kc2V0ID8/PSB7fTtcbiAgICAgIGZsYXR0ZW5PYmplY3RJbnRvKG9wbG9nRW50cnkuJHNldCwgdmFsdWUsIHByZWZpeCk7XG4gICAgfSBlbHNlIGlmIChkaWZmS2V5ID09PSAndScpIHtcbiAgICAgIC8vIEhhbmRsZSBmbGF0IGAkc2V0YHNcbiAgICAgIG9wbG9nRW50cnkuJHNldCA/Pz0ge307XG4gICAgICBPYmplY3QuZW50cmllcyh2YWx1ZSkuZm9yRWFjaCgoW2tleSwgZmllbGRWYWx1ZV0pID0+IHtcbiAgICAgICAgb3Bsb2dFbnRyeS4kc2V0IVtqb2luKHByZWZpeCwga2V5KV0gPSBmaWVsZFZhbHVlO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChkaWZmS2V5LnN0YXJ0c1dpdGgoJ3MnKSkge1xuICAgICAgLy8gSGFuZGxlIHMtZmllbGRzIChhcnJheSBvcGVyYXRpb25zIGFuZCBuZXN0ZWQgb2JqZWN0cylcbiAgICAgIGNvbnN0IGtleSA9IGRpZmZLZXkuc2xpY2UoMSk7XG4gICAgICBpZiAoaXNBcnJheU9wZXJhdG9yKHZhbHVlKSkge1xuICAgICAgICAvLyBBcnJheSBvcGVyYXRvclxuICAgICAgICBPYmplY3QuZW50cmllcyh2YWx1ZSkuZm9yRWFjaCgoW3Bvc2l0aW9uLCBmaWVsZFZhbHVlXSkgPT4ge1xuICAgICAgICAgIGlmIChwb3NpdGlvbiA9PT0gJ2EnKSByZXR1cm47XG5cbiAgICAgICAgICBjb25zdCBwb3NpdGlvbktleSA9IGpvaW4ocHJlZml4LCBgJHtrZXl9LiR7cG9zaXRpb24uc2xpY2UoMSl9YCk7XG4gICAgICAgICAgaWYgKHBvc2l0aW9uWzBdID09PSAncycpIHtcbiAgICAgICAgICAgIGNvbnZlcnRPcGxvZ0RpZmYob3Bsb2dFbnRyeSwgZmllbGRWYWx1ZSwgcG9zaXRpb25LZXkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGRWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgb3Bsb2dFbnRyeS4kdW5zZXQgPz89IHt9O1xuICAgICAgICAgICAgb3Bsb2dFbnRyeS4kdW5zZXRbcG9zaXRpb25LZXldID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3Bsb2dFbnRyeS4kc2V0ID8/PSB7fTtcbiAgICAgICAgICAgIG9wbG9nRW50cnkuJHNldFtwb3NpdGlvbktleV0gPSBmaWVsZFZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKGtleSkge1xuICAgICAgICAvLyBOZXN0ZWQgb2JqZWN0XG4gICAgICAgIGNvbnZlcnRPcGxvZ0RpZmYob3Bsb2dFbnRyeSwgdmFsdWUsIGpvaW4ocHJlZml4LCBrZXkpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgTW9uZ29EQiB2MiBvcGxvZyBlbnRyeSB0byB2MSBmb3JtYXQuXG4gKiBSZXR1cm5zIHRoZSBvcmlnaW5hbCBlbnRyeSB1bmNoYW5nZWQgaWYgaXQncyBub3QgYSB2MiBvcGxvZyBlbnRyeVxuICogb3IgZG9lc24ndCBjb250YWluIGEgZGlmZiBmaWVsZC5cbiAqXG4gKiBUaGUgY29udmVydGVkIGVudHJ5IHdpbGwgY29udGFpbiAkc2V0IGFuZCAkdW5zZXQgb3BlcmF0aW9ucyB0aGF0IGFyZVxuICogZXF1aXZhbGVudCB0byB0aGUgdjIgZGlmZiBmb3JtYXQsIHdpdGggcGF0aHMgZmxhdHRlbmVkIHRvIGRvdCBub3RhdGlvblxuICogYW5kIHNwZWNpYWwgaGFuZGxpbmcgZm9yIEVKU09OIGN1c3RvbSB0eXBlcyBhbmQgT2JqZWN0SURzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb3Bsb2dWMlYxQ29udmVydGVyKG9wbG9nRW50cnk6IE9wbG9nRW50cnkpOiBPcGxvZ0VudHJ5IHtcbiAgaWYgKG9wbG9nRW50cnkuJHYgIT09IDIgfHwgIW9wbG9nRW50cnkuZGlmZikge1xuICAgIHJldHVybiBvcGxvZ0VudHJ5O1xuICB9XG5cbiAgY29uc3QgY29udmVydGVkT3Bsb2dFbnRyeTogT3Bsb2dFbnRyeSA9IHsgJHY6IDIgfTtcbiAgY29udmVydE9wbG9nRGlmZihjb252ZXJ0ZWRPcGxvZ0VudHJ5LCBvcGxvZ0VudHJ5LmRpZmYpO1xuICByZXR1cm4gY29udmVydGVkT3Bsb2dFbnRyeTtcbn0iLCJpbnRlcmZhY2UgQ3Vyc29yT3B0aW9ucyB7XG4gIGxpbWl0PzogbnVtYmVyO1xuICBza2lwPzogbnVtYmVyO1xuICBzb3J0PzogUmVjb3JkPHN0cmluZywgMSB8IC0xPjtcbiAgZmllbGRzPzogUmVjb3JkPHN0cmluZywgMSB8IDA+O1xuICBwcm9qZWN0aW9uPzogUmVjb3JkPHN0cmluZywgMSB8IDA+O1xuICBkaXNhYmxlT3Bsb2c/OiBib29sZWFuO1xuICBfZGlzYWJsZU9wbG9nPzogYm9vbGVhbjtcbiAgdGFpbGFibGU/OiBib29sZWFuO1xuICB0cmFuc2Zvcm0/OiAoZG9jOiBhbnkpID0+IGFueTtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBhcmd1bWVudHMgdXNlZCB0byBjb25zdHJ1Y3QgYSBjdXJzb3IuXG4gKiBVc2VkIGFzIGEga2V5IGZvciBjdXJzb3IgZGUtZHVwbGljYXRpb24uXG4gKlxuICogQWxsIHByb3BlcnRpZXMgbXVzdCBiZSBlaXRoZXI6XG4gKiAtIEpTT04tc3RyaW5naWZpYWJsZSwgb3JcbiAqIC0gTm90IGFmZmVjdCBvYnNlcnZlQ2hhbmdlcyBvdXRwdXQgKGUuZy4sIG9wdGlvbnMudHJhbnNmb3JtIGZ1bmN0aW9ucylcbiAqL1xuZXhwb3J0IGNsYXNzIEN1cnNvckRlc2NyaXB0aW9uIHtcbiAgY29sbGVjdGlvbk5hbWU6IHN0cmluZztcbiAgc2VsZWN0b3I6IFJlY29yZDxzdHJpbmcsIGFueT47XG4gIG9wdGlvbnM6IEN1cnNvck9wdGlvbnM7XG5cbiAgY29uc3RydWN0b3IoY29sbGVjdGlvbk5hbWU6IHN0cmluZywgc2VsZWN0b3I6IGFueSwgb3B0aW9ucz86IEN1cnNvck9wdGlvbnMpIHtcbiAgICB0aGlzLmNvbGxlY3Rpb25OYW1lID0gY29sbGVjdGlvbk5hbWU7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHRoaXMuc2VsZWN0b3IgPSBNb25nby5Db2xsZWN0aW9uLl9yZXdyaXRlU2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIH1cbn0iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IENMSUVOVF9PTkxZX01FVEhPRFMsIGdldEFzeW5jTWV0aG9kTmFtZSB9IGZyb20gJ21ldGVvci9taW5pbW9uZ28vY29uc3RhbnRzJztcbmltcG9ydCB7IE1pbmlNb25nb1F1ZXJ5RXJyb3IgfSBmcm9tICdtZXRlb3IvbWluaW1vbmdvL2NvbW1vbic7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IEFzeW5jaHJvbm91c0N1cnNvciB9IGZyb20gJy4vYXN5bmNocm9ub3VzX2N1cnNvcic7XG5pbXBvcnQgeyBDdXJzb3IgfSBmcm9tICcuL2N1cnNvcic7XG5pbXBvcnQgeyBDdXJzb3JEZXNjcmlwdGlvbiB9IGZyb20gJy4vY3Vyc29yX2Rlc2NyaXB0aW9uJztcbmltcG9ydCB7IERvY0ZldGNoZXIgfSBmcm9tICcuL2RvY19mZXRjaGVyJztcbmltcG9ydCB7IE1vbmdvREIsIHJlcGxhY2VNZXRlb3JBdG9tV2l0aE1vbmdvLCByZXBsYWNlVHlwZXMsIHRyYW5zZm9ybVJlc3VsdCB9IGZyb20gJy4vbW9uZ29fY29tbW9uJztcbmltcG9ydCB7IE9ic2VydmVIYW5kbGUgfSBmcm9tICcuL29ic2VydmVfaGFuZGxlJztcbmltcG9ydCB7IE9ic2VydmVNdWx0aXBsZXhlciB9IGZyb20gJy4vb2JzZXJ2ZV9tdWx0aXBsZXgnO1xuaW1wb3J0IHsgT3Bsb2dPYnNlcnZlRHJpdmVyIH0gZnJvbSAnLi9vcGxvZ19vYnNlcnZlX2RyaXZlcic7XG5pbXBvcnQgeyBPUExPR19DT0xMRUNUSU9OLCBPcGxvZ0hhbmRsZSB9IGZyb20gJy4vb3Bsb2dfdGFpbGluZyc7XG5pbXBvcnQgeyBQb2xsaW5nT2JzZXJ2ZURyaXZlciB9IGZyb20gJy4vcG9sbGluZ19vYnNlcnZlX2RyaXZlcic7XG5cbmNvbnN0IEZJTEVfQVNTRVRfU1VGRklYID0gJ0Fzc2V0JztcbmNvbnN0IEFTU0VUU19GT0xERVIgPSAnYXNzZXRzJztcbmNvbnN0IEFQUF9GT0xERVIgPSAnYXBwJztcblxuY29uc3Qgb3Bsb2dDb2xsZWN0aW9uV2FybmluZ3MgPSBbXTtcblxuZXhwb3J0IGNvbnN0IE1vbmdvQ29ubmVjdGlvbiA9IGZ1bmN0aW9uICh1cmwsIG9wdGlvbnMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgc2VsZi5fb2JzZXJ2ZU11bHRpcGxleGVycyA9IHt9O1xuICBzZWxmLl9vbkZhaWxvdmVySG9vayA9IG5ldyBIb29rO1xuXG4gIGNvbnN0IHVzZXJPcHRpb25zID0ge1xuICAgIC4uLihNb25nby5fY29ubmVjdGlvbk9wdGlvbnMgfHwge30pLFxuICAgIC4uLihNZXRlb3Iuc2V0dGluZ3M/LnBhY2thZ2VzPy5tb25nbz8ub3B0aW9ucyB8fCB7fSlcbiAgfTtcblxuICB2YXIgbW9uZ29PcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgaWdub3JlVW5kZWZpbmVkOiB0cnVlLFxuICB9LCB1c2VyT3B0aW9ucyk7XG5cblxuXG4gIC8vIEludGVybmFsbHkgdGhlIG9wbG9nIGNvbm5lY3Rpb25zIHNwZWNpZnkgdGhlaXIgb3duIG1heFBvb2xTaXplXG4gIC8vIHdoaWNoIHdlIGRvbid0IHdhbnQgdG8gb3ZlcndyaXRlIHdpdGggYW55IHVzZXIgZGVmaW5lZCB2YWx1ZVxuICBpZiAoJ21heFBvb2xTaXplJyBpbiBvcHRpb25zKSB7XG4gICAgLy8gSWYgd2UganVzdCBzZXQgdGhpcyBmb3IgXCJzZXJ2ZXJcIiwgcmVwbFNldCB3aWxsIG92ZXJyaWRlIGl0LiBJZiB3ZSBqdXN0XG4gICAgLy8gc2V0IGl0IGZvciByZXBsU2V0LCBpdCB3aWxsIGJlIGlnbm9yZWQgaWYgd2UncmUgbm90IHVzaW5nIGEgcmVwbFNldC5cbiAgICBtb25nb09wdGlvbnMubWF4UG9vbFNpemUgPSBvcHRpb25zLm1heFBvb2xTaXplO1xuICB9XG4gIGlmICgnbWluUG9vbFNpemUnIGluIG9wdGlvbnMpIHtcbiAgICBtb25nb09wdGlvbnMubWluUG9vbFNpemUgPSBvcHRpb25zLm1pblBvb2xTaXplO1xuICB9XG5cbiAgLy8gVHJhbnNmb3JtIG9wdGlvbnMgbGlrZSBcInRsc0NBRmlsZUFzc2V0XCI6IFwiZmlsZW5hbWUucGVtXCIgaW50b1xuICAvLyBcInRsc0NBRmlsZVwiOiBcIi88ZnVsbHBhdGg+L2ZpbGVuYW1lLnBlbVwiXG4gIE9iamVjdC5lbnRyaWVzKG1vbmdvT3B0aW9ucyB8fCB7fSlcbiAgICAuZmlsdGVyKChba2V5XSkgPT4ga2V5ICYmIGtleS5lbmRzV2l0aChGSUxFX0FTU0VUX1NVRkZJWCkpXG4gICAgLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgY29uc3Qgb3B0aW9uTmFtZSA9IGtleS5yZXBsYWNlKEZJTEVfQVNTRVRfU1VGRklYLCAnJyk7XG4gICAgICBtb25nb09wdGlvbnNbb3B0aW9uTmFtZV0gPSBwYXRoLmpvaW4oQXNzZXRzLmdldFNlcnZlckRpcigpLFxuICAgICAgICBBU1NFVFNfRk9MREVSLCBBUFBfRk9MREVSLCB2YWx1ZSk7XG4gICAgICBkZWxldGUgbW9uZ29PcHRpb25zW2tleV07XG4gICAgfSk7XG5cbiAgc2VsZi5kYiA9IG51bGw7XG4gIHNlbGYuX29wbG9nSGFuZGxlID0gbnVsbDtcbiAgc2VsZi5fZG9jRmV0Y2hlciA9IG51bGw7XG5cbiAgbW9uZ29PcHRpb25zLmRyaXZlckluZm8gPSB7XG4gICAgbmFtZTogJ01ldGVvcicsXG4gICAgdmVyc2lvbjogTWV0ZW9yLnJlbGVhc2VcbiAgfVxuXG4gIHNlbGYuY2xpZW50ID0gbmV3IE1vbmdvREIuTW9uZ29DbGllbnQodXJsLCBtb25nb09wdGlvbnMpO1xuICBzZWxmLmRiID0gc2VsZi5jbGllbnQuZGIoKTtcblxuICBzZWxmLmNsaWVudC5vbignc2VydmVyRGVzY3JpcHRpb25DaGFuZ2VkJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChldmVudCA9PiB7XG4gICAgLy8gV2hlbiB0aGUgY29ubmVjdGlvbiBpcyBubyBsb25nZXIgYWdhaW5zdCB0aGUgcHJpbWFyeSBub2RlLCBleGVjdXRlIGFsbFxuICAgIC8vIGZhaWxvdmVyIGhvb2tzLiBUaGlzIGlzIGltcG9ydGFudCBmb3IgdGhlIGRyaXZlciBhcyBpdCBoYXMgdG8gcmUtcG9vbCB0aGVcbiAgICAvLyBxdWVyeSB3aGVuIGl0IGhhcHBlbnMuXG4gICAgaWYgKFxuICAgICAgZXZlbnQucHJldmlvdXNEZXNjcmlwdGlvbi50eXBlICE9PSAnUlNQcmltYXJ5JyAmJlxuICAgICAgZXZlbnQubmV3RGVzY3JpcHRpb24udHlwZSA9PT0gJ1JTUHJpbWFyeSdcbiAgICApIHtcbiAgICAgIHNlbGYuX29uRmFpbG92ZXJIb29rLmVhY2goY2FsbGJhY2sgPT4ge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSkpO1xuXG4gIGlmIChvcHRpb25zLm9wbG9nVXJsICYmICEgUGFja2FnZVsnZGlzYWJsZS1vcGxvZyddKSB7XG4gICAgc2VsZi5fb3Bsb2dIYW5kbGUgPSBuZXcgT3Bsb2dIYW5kbGUob3B0aW9ucy5vcGxvZ1VybCwgc2VsZi5kYi5kYXRhYmFzZU5hbWUpO1xuICAgIHNlbGYuX2RvY0ZldGNoZXIgPSBuZXcgRG9jRmV0Y2hlcihzZWxmKTtcbiAgfVxuXG59O1xuXG5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLl9jbG9zZSA9IGFzeW5jIGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKCEgc2VsZi5kYilcbiAgICB0aHJvdyBFcnJvcihcImNsb3NlIGNhbGxlZCBiZWZvcmUgQ29ubmVjdGlvbiBjcmVhdGVkP1wiKTtcblxuICAvLyBYWFggcHJvYmFibHkgdW50ZXN0ZWRcbiAgdmFyIG9wbG9nSGFuZGxlID0gc2VsZi5fb3Bsb2dIYW5kbGU7XG4gIHNlbGYuX29wbG9nSGFuZGxlID0gbnVsbDtcbiAgaWYgKG9wbG9nSGFuZGxlKVxuICAgIGF3YWl0IG9wbG9nSGFuZGxlLnN0b3AoKTtcblxuICAvLyBVc2UgRnV0dXJlLndyYXAgc28gdGhhdCBlcnJvcnMgZ2V0IHRocm93bi4gVGhpcyBoYXBwZW5zIHRvXG4gIC8vIHdvcmsgZXZlbiBvdXRzaWRlIGEgZmliZXIgc2luY2UgdGhlICdjbG9zZScgbWV0aG9kIGlzIG5vdFxuICAvLyBhY3R1YWxseSBhc3luY2hyb25vdXMuXG4gIGF3YWl0IHNlbGYuY2xpZW50LmNsb3NlKCk7XG59O1xuXG5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5fY2xvc2UoKTtcbn07XG5cbk1vbmdvQ29ubmVjdGlvbi5wcm90b3R5cGUuX3NldE9wbG9nSGFuZGxlID0gZnVuY3Rpb24ob3Bsb2dIYW5kbGUpIHtcbiAgdGhpcy5fb3Bsb2dIYW5kbGUgPSBvcGxvZ0hhbmRsZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBSZXR1cm5zIHRoZSBNb25nbyBDb2xsZWN0aW9uIG9iamVjdDsgbWF5IHlpZWxkLlxuTW9uZ29Db25uZWN0aW9uLnByb3RvdHlwZS5yYXdDb2xsZWN0aW9uID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25OYW1lKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBpZiAoISBzZWxmLmRiKVxuICAgIHRocm93IEVycm9yKFwicmF3Q29sbGVjdGlvbiBjYWxsZWQgYmVmb3JlIENvbm5lY3Rpb24gY3JlYXRlZD9cIik7XG5cbiAgcmV0dXJuIHNlbGYuZGIuY29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZSk7XG59O1xuXG5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLmNyZWF0ZUNhcHBlZENvbGxlY3Rpb25Bc3luYyA9IGFzeW5jIGZ1bmN0aW9uIChcbiAgY29sbGVjdGlvbk5hbWUsIGJ5dGVTaXplLCBtYXhEb2N1bWVudHMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIGlmICghIHNlbGYuZGIpXG4gICAgdGhyb3cgRXJyb3IoXCJjcmVhdGVDYXBwZWRDb2xsZWN0aW9uQXN5bmMgY2FsbGVkIGJlZm9yZSBDb25uZWN0aW9uIGNyZWF0ZWQ/XCIpO1xuXG5cbiAgYXdhaXQgc2VsZi5kYi5jcmVhdGVDb2xsZWN0aW9uKGNvbGxlY3Rpb25OYW1lLFxuICAgIHsgY2FwcGVkOiB0cnVlLCBzaXplOiBieXRlU2l6ZSwgbWF4OiBtYXhEb2N1bWVudHMgfSk7XG59O1xuXG4vLyBUaGlzIHNob3VsZCBiZSBjYWxsZWQgc3luY2hyb25vdXNseSB3aXRoIGEgd3JpdGUsIHRvIGNyZWF0ZSBhXG4vLyB0cmFuc2FjdGlvbiBvbiB0aGUgY3VycmVudCB3cml0ZSBmZW5jZSwgaWYgYW55LiBBZnRlciB3ZSBjYW4gcmVhZFxuLy8gdGhlIHdyaXRlLCBhbmQgYWZ0ZXIgb2JzZXJ2ZXJzIGhhdmUgYmVlbiBub3RpZmllZCAob3IgYXQgbGVhc3QsXG4vLyBhZnRlciB0aGUgb2JzZXJ2ZXIgbm90aWZpZXJzIGhhdmUgYWRkZWQgdGhlbXNlbHZlcyB0byB0aGUgd3JpdGVcbi8vIGZlbmNlKSwgeW91IHNob3VsZCBjYWxsICdjb21taXR0ZWQoKScgb24gdGhlIG9iamVjdCByZXR1cm5lZC5cbk1vbmdvQ29ubmVjdGlvbi5wcm90b3R5cGUuX21heWJlQmVnaW5Xcml0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc3QgZmVuY2UgPSBERFBTZXJ2ZXIuX2dldEN1cnJlbnRGZW5jZSgpO1xuICBpZiAoZmVuY2UpIHtcbiAgICByZXR1cm4gZmVuY2UuYmVnaW5Xcml0ZSgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB7Y29tbWl0dGVkOiBmdW5jdGlvbiAoKSB7fX07XG4gIH1cbn07XG5cbi8vIEludGVybmFsIGludGVyZmFjZTogYWRkcyBhIGNhbGxiYWNrIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoZSBNb25nbyBwcmltYXJ5XG4vLyBjaGFuZ2VzLiBSZXR1cm5zIGEgc3RvcCBoYW5kbGUuXG5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLl9vbkZhaWxvdmVyID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIHJldHVybiB0aGlzLl9vbkZhaWxvdmVySG9vay5yZWdpc3RlcihjYWxsYmFjayk7XG59O1xuXG5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLmluc2VydEFzeW5jID0gYXN5bmMgZnVuY3Rpb24gKGNvbGxlY3Rpb25fbmFtZSwgZG9jdW1lbnQpIHtcbiAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKGNvbGxlY3Rpb25fbmFtZSA9PT0gXCJfX19tZXRlb3JfZmFpbHVyZV90ZXN0X2NvbGxlY3Rpb25cIikge1xuICAgIGNvbnN0IGUgPSBuZXcgRXJyb3IoXCJGYWlsdXJlIHRlc3RcIik7XG4gICAgZS5fZXhwZWN0ZWRCeVRlc3QgPSB0cnVlO1xuICAgIHRocm93IGU7XG4gIH1cblxuICBpZiAoIShMb2NhbENvbGxlY3Rpb24uX2lzUGxhaW5PYmplY3QoZG9jdW1lbnQpICYmXG4gICAgIUVKU09OLl9pc0N1c3RvbVR5cGUoZG9jdW1lbnQpKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk9ubHkgcGxhaW4gb2JqZWN0cyBtYXkgYmUgaW5zZXJ0ZWQgaW50byBNb25nb0RCXCIpO1xuICB9XG5cbiAgdmFyIHdyaXRlID0gc2VsZi5fbWF5YmVCZWdpbldyaXRlKCk7XG4gIHZhciByZWZyZXNoID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGF3YWl0IE1ldGVvci5yZWZyZXNoKHtjb2xsZWN0aW9uOiBjb2xsZWN0aW9uX25hbWUsIGlkOiBkb2N1bWVudC5faWQgfSk7XG4gIH07XG4gIHJldHVybiBzZWxmLnJhd0NvbGxlY3Rpb24oY29sbGVjdGlvbl9uYW1lKS5pbnNlcnRPbmUoXG4gICAgcmVwbGFjZVR5cGVzKGRvY3VtZW50LCByZXBsYWNlTWV0ZW9yQXRvbVdpdGhNb25nbyksXG4gICAge1xuICAgICAgc2FmZTogdHJ1ZSxcbiAgICB9XG4gICkudGhlbihhc3luYyAoe2luc2VydGVkSWR9KSA9PiB7XG4gICAgYXdhaXQgcmVmcmVzaCgpO1xuICAgIGF3YWl0IHdyaXRlLmNvbW1pdHRlZCgpO1xuICAgIHJldHVybiBpbnNlcnRlZElkO1xuICB9KS5jYXRjaChhc3luYyBlID0+IHtcbiAgICBhd2FpdCB3cml0ZS5jb21taXR0ZWQoKTtcbiAgICB0aHJvdyBlO1xuICB9KTtcbn07XG5cblxuLy8gQ2F1c2UgcXVlcmllcyB0aGF0IG1heSBiZSBhZmZlY3RlZCBieSB0aGUgc2VsZWN0b3IgdG8gcG9sbCBpbiB0aGlzIHdyaXRlXG4vLyBmZW5jZS5cbk1vbmdvQ29ubmVjdGlvbi5wcm90b3R5cGUuX3JlZnJlc2ggPSBhc3luYyBmdW5jdGlvbiAoY29sbGVjdGlvbk5hbWUsIHNlbGVjdG9yKSB7XG4gIHZhciByZWZyZXNoS2V5ID0ge2NvbGxlY3Rpb246IGNvbGxlY3Rpb25OYW1lfTtcbiAgLy8gSWYgd2Uga25vdyB3aGljaCBkb2N1bWVudHMgd2UncmUgcmVtb3ZpbmcsIGRvbid0IHBvbGwgcXVlcmllcyB0aGF0IGFyZVxuICAvLyBzcGVjaWZpYyB0byBvdGhlciBkb2N1bWVudHMuIChOb3RlIHRoYXQgbXVsdGlwbGUgbm90aWZpY2F0aW9ucyBoZXJlIHNob3VsZFxuICAvLyBub3QgY2F1c2UgbXVsdGlwbGUgcG9sbHMsIHNpbmNlIGFsbCBvdXIgbGlzdGVuZXIgaXMgZG9pbmcgaXMgZW5xdWV1ZWluZyBhXG4gIC8vIHBvbGwuKVxuICB2YXIgc3BlY2lmaWNJZHMgPSBMb2NhbENvbGxlY3Rpb24uX2lkc01hdGNoZWRCeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgaWYgKHNwZWNpZmljSWRzKSB7XG4gICAgZm9yIChjb25zdCBpZCBvZiBzcGVjaWZpY0lkcykge1xuICAgICAgYXdhaXQgTWV0ZW9yLnJlZnJlc2goT2JqZWN0LmFzc2lnbih7aWQ6IGlkfSwgcmVmcmVzaEtleSkpO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgYXdhaXQgTWV0ZW9yLnJlZnJlc2gocmVmcmVzaEtleSk7XG4gIH1cbn07XG5cbk1vbmdvQ29ubmVjdGlvbi5wcm90b3R5cGUucmVtb3ZlQXN5bmMgPSBhc3luYyBmdW5jdGlvbiAoY29sbGVjdGlvbl9uYW1lLCBzZWxlY3Rvcikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKGNvbGxlY3Rpb25fbmFtZSA9PT0gXCJfX19tZXRlb3JfZmFpbHVyZV90ZXN0X2NvbGxlY3Rpb25cIikge1xuICAgIHZhciBlID0gbmV3IEVycm9yKFwiRmFpbHVyZSB0ZXN0XCIpO1xuICAgIGUuX2V4cGVjdGVkQnlUZXN0ID0gdHJ1ZTtcbiAgICB0aHJvdyBlO1xuICB9XG5cbiAgdmFyIHdyaXRlID0gc2VsZi5fbWF5YmVCZWdpbldyaXRlKCk7XG4gIHZhciByZWZyZXNoID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGF3YWl0IHNlbGYuX3JlZnJlc2goY29sbGVjdGlvbl9uYW1lLCBzZWxlY3Rvcik7XG4gIH07XG5cbiAgcmV0dXJuIHNlbGYucmF3Q29sbGVjdGlvbihjb2xsZWN0aW9uX25hbWUpXG4gICAgLmRlbGV0ZU1hbnkocmVwbGFjZVR5cGVzKHNlbGVjdG9yLCByZXBsYWNlTWV0ZW9yQXRvbVdpdGhNb25nbyksIHtcbiAgICAgIHNhZmU6IHRydWUsXG4gICAgfSlcbiAgICAudGhlbihhc3luYyAoeyBkZWxldGVkQ291bnQgfSkgPT4ge1xuICAgICAgYXdhaXQgcmVmcmVzaCgpO1xuICAgICAgYXdhaXQgd3JpdGUuY29tbWl0dGVkKCk7XG4gICAgICByZXR1cm4gdHJhbnNmb3JtUmVzdWx0KHsgcmVzdWx0IDoge21vZGlmaWVkQ291bnQgOiBkZWxldGVkQ291bnR9IH0pLm51bWJlckFmZmVjdGVkO1xuICAgIH0pLmNhdGNoKGFzeW5jIChlcnIpID0+IHtcbiAgICAgIGF3YWl0IHdyaXRlLmNvbW1pdHRlZCgpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH0pO1xufTtcblxuTW9uZ29Db25uZWN0aW9uLnByb3RvdHlwZS5kcm9wQ29sbGVjdGlvbkFzeW5jID0gYXN5bmMgZnVuY3Rpb24oY29sbGVjdGlvbk5hbWUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cbiAgdmFyIHdyaXRlID0gc2VsZi5fbWF5YmVCZWdpbldyaXRlKCk7XG4gIHZhciByZWZyZXNoID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIE1ldGVvci5yZWZyZXNoKHtcbiAgICAgIGNvbGxlY3Rpb246IGNvbGxlY3Rpb25OYW1lLFxuICAgICAgaWQ6IG51bGwsXG4gICAgICBkcm9wQ29sbGVjdGlvbjogdHJ1ZSxcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gc2VsZlxuICAgIC5yYXdDb2xsZWN0aW9uKGNvbGxlY3Rpb25OYW1lKVxuICAgIC5kcm9wKClcbiAgICAudGhlbihhc3luYyByZXN1bHQgPT4ge1xuICAgICAgYXdhaXQgcmVmcmVzaCgpO1xuICAgICAgYXdhaXQgd3JpdGUuY29tbWl0dGVkKCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pXG4gICAgLmNhdGNoKGFzeW5jIGUgPT4ge1xuICAgICAgYXdhaXQgd3JpdGUuY29tbWl0dGVkKCk7XG4gICAgICB0aHJvdyBlO1xuICAgIH0pO1xufTtcblxuLy8gRm9yIHRlc3Rpbmcgb25seS4gIFNsaWdodGx5IGJldHRlciB0aGFuIGBjLnJhd0RhdGFiYXNlKCkuZHJvcERhdGFiYXNlKClgXG4vLyBiZWNhdXNlIGl0IGxldHMgdGhlIHRlc3QncyBmZW5jZSB3YWl0IGZvciBpdCB0byBiZSBjb21wbGV0ZS5cbk1vbmdvQ29ubmVjdGlvbi5wcm90b3R5cGUuZHJvcERhdGFiYXNlQXN5bmMgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgd3JpdGUgPSBzZWxmLl9tYXliZUJlZ2luV3JpdGUoKTtcbiAgdmFyIHJlZnJlc2ggPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgYXdhaXQgTWV0ZW9yLnJlZnJlc2goeyBkcm9wRGF0YWJhc2U6IHRydWUgfSk7XG4gIH07XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBzZWxmLmRiLl9kcm9wRGF0YWJhc2UoKTtcbiAgICBhd2FpdCByZWZyZXNoKCk7XG4gICAgYXdhaXQgd3JpdGUuY29tbWl0dGVkKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhd2FpdCB3cml0ZS5jb21taXR0ZWQoKTtcbiAgICB0aHJvdyBlO1xuICB9XG59O1xuXG5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLnVwZGF0ZUFzeW5jID0gYXN5bmMgZnVuY3Rpb24gKGNvbGxlY3Rpb25fbmFtZSwgc2VsZWN0b3IsIG1vZCwgb3B0aW9ucykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKGNvbGxlY3Rpb25fbmFtZSA9PT0gXCJfX19tZXRlb3JfZmFpbHVyZV90ZXN0X2NvbGxlY3Rpb25cIikge1xuICAgIHZhciBlID0gbmV3IEVycm9yKFwiRmFpbHVyZSB0ZXN0XCIpO1xuICAgIGUuX2V4cGVjdGVkQnlUZXN0ID0gdHJ1ZTtcbiAgICB0aHJvdyBlO1xuICB9XG5cbiAgLy8gZXhwbGljaXQgc2FmZXR5IGNoZWNrLiBudWxsIGFuZCB1bmRlZmluZWQgY2FuIGNyYXNoIHRoZSBtb25nb1xuICAvLyBkcml2ZXIuIEFsdGhvdWdoIHRoZSBub2RlIGRyaXZlciBhbmQgbWluaW1vbmdvIGRvICdzdXBwb3J0J1xuICAvLyBub24tb2JqZWN0IG1vZGlmaWVyIGluIHRoYXQgdGhleSBkb24ndCBjcmFzaCwgdGhleSBhcmUgbm90XG4gIC8vIG1lYW5pbmdmdWwgb3BlcmF0aW9ucyBhbmQgZG8gbm90IGRvIGFueXRoaW5nLiBEZWZlbnNpdmVseSB0aHJvdyBhblxuICAvLyBlcnJvciBoZXJlLlxuICBpZiAoIW1vZCB8fCB0eXBlb2YgbW9kICE9PSAnb2JqZWN0Jykge1xuICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKFwiSW52YWxpZCBtb2RpZmllci4gTW9kaWZpZXIgbXVzdCBiZSBhbiBvYmplY3QuXCIpO1xuXG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cblxuICBpZiAoIShMb2NhbENvbGxlY3Rpb24uX2lzUGxhaW5PYmplY3QobW9kKSAmJiAhRUpTT04uX2lzQ3VzdG9tVHlwZShtb2QpKSkge1xuICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKFxuICAgICAgXCJPbmx5IHBsYWluIG9iamVjdHMgbWF5IGJlIHVzZWQgYXMgcmVwbGFjZW1lbnRcIiArXG4gICAgICBcIiBkb2N1bWVudHMgaW4gTW9uZ29EQlwiKTtcblxuICAgIHRocm93IGVycm9yO1xuICB9XG5cbiAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG5cbiAgdmFyIHdyaXRlID0gc2VsZi5fbWF5YmVCZWdpbldyaXRlKCk7XG4gIHZhciByZWZyZXNoID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGF3YWl0IHNlbGYuX3JlZnJlc2goY29sbGVjdGlvbl9uYW1lLCBzZWxlY3Rvcik7XG4gIH07XG5cbiAgdmFyIGNvbGxlY3Rpb24gPSBzZWxmLnJhd0NvbGxlY3Rpb24oY29sbGVjdGlvbl9uYW1lKTtcbiAgdmFyIG1vbmdvT3B0cyA9IHtzYWZlOiB0cnVlfTtcbiAgLy8gQWRkIHN1cHBvcnQgZm9yIGZpbHRlcmVkIHBvc2l0aW9uYWwgb3BlcmF0b3JcbiAgaWYgKG9wdGlvbnMuYXJyYXlGaWx0ZXJzICE9PSB1bmRlZmluZWQpIG1vbmdvT3B0cy5hcnJheUZpbHRlcnMgPSBvcHRpb25zLmFycmF5RmlsdGVycztcbiAgLy8gZXhwbGljdGx5IGVudW1lcmF0ZSBvcHRpb25zIHRoYXQgbWluaW1vbmdvIHN1cHBvcnRzXG4gIGlmIChvcHRpb25zLnVwc2VydCkgbW9uZ29PcHRzLnVwc2VydCA9IHRydWU7XG4gIGlmIChvcHRpb25zLm11bHRpKSBtb25nb09wdHMubXVsdGkgPSB0cnVlO1xuICAvLyBMZXRzIHlvdSBnZXQgYSBtb3JlIG1vcmUgZnVsbCByZXN1bHQgZnJvbSBNb25nb0RCLiBVc2Ugd2l0aCBjYXV0aW9uOlxuICAvLyBtaWdodCBub3Qgd29yayB3aXRoIEMudXBzZXJ0IChhcyBvcHBvc2VkIHRvIEMudXBkYXRlKHt1cHNlcnQ6dHJ1ZX0pIG9yXG4gIC8vIHdpdGggc2ltdWxhdGVkIHVwc2VydC5cbiAgaWYgKG9wdGlvbnMuZnVsbFJlc3VsdCkgbW9uZ29PcHRzLmZ1bGxSZXN1bHQgPSB0cnVlO1xuXG4gIHZhciBtb25nb1NlbGVjdG9yID0gcmVwbGFjZVR5cGVzKHNlbGVjdG9yLCByZXBsYWNlTWV0ZW9yQXRvbVdpdGhNb25nbyk7XG4gIHZhciBtb25nb01vZCA9IHJlcGxhY2VUeXBlcyhtb2QsIHJlcGxhY2VNZXRlb3JBdG9tV2l0aE1vbmdvKTtcblxuICB2YXIgaXNNb2RpZnkgPSBMb2NhbENvbGxlY3Rpb24uX2lzTW9kaWZpY2F0aW9uTW9kKG1vbmdvTW9kKTtcblxuICBpZiAob3B0aW9ucy5fZm9yYmlkUmVwbGFjZSAmJiAhaXNNb2RpZnkpIHtcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKFwiSW52YWxpZCBtb2RpZmllci4gUmVwbGFjZW1lbnRzIGFyZSBmb3JiaWRkZW4uXCIpO1xuICAgIHRocm93IGVycjtcbiAgfVxuXG4gIC8vIFdlJ3ZlIGFscmVhZHkgcnVuIHJlcGxhY2VUeXBlcy9yZXBsYWNlTWV0ZW9yQXRvbVdpdGhNb25nbyBvblxuICAvLyBzZWxlY3RvciBhbmQgbW9kLiAgV2UgYXNzdW1lIGl0IGRvZXNuJ3QgbWF0dGVyLCBhcyBmYXIgYXNcbiAgLy8gdGhlIGJlaGF2aW9yIG9mIG1vZGlmaWVycyBpcyBjb25jZXJuZWQsIHdoZXRoZXIgYF9tb2RpZnlgXG4gIC8vIGlzIHJ1biBvbiBFSlNPTiBvciBvbiBtb25nby1jb252ZXJ0ZWQgRUpTT04uXG5cbiAgLy8gUnVuIHRoaXMgY29kZSB1cCBmcm9udCBzbyB0aGF0IGl0IGZhaWxzIGZhc3QgaWYgc29tZW9uZSB1c2VzXG4gIC8vIGEgTW9uZ28gdXBkYXRlIG9wZXJhdG9yIHdlIGRvbid0IHN1cHBvcnQuXG4gIGxldCBrbm93bklkO1xuICBpZiAob3B0aW9ucy51cHNlcnQpIHtcbiAgICB0cnkge1xuICAgICAgbGV0IG5ld0RvYyA9IExvY2FsQ29sbGVjdGlvbi5fY3JlYXRlVXBzZXJ0RG9jdW1lbnQoc2VsZWN0b3IsIG1vZCk7XG4gICAgICBrbm93bklkID0gbmV3RG9jLl9pZDtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cbiAgaWYgKG9wdGlvbnMudXBzZXJ0ICYmXG4gICAgISBpc01vZGlmeSAmJlxuICAgICEga25vd25JZCAmJlxuICAgIG9wdGlvbnMuaW5zZXJ0ZWRJZCAmJlxuICAgICEgKG9wdGlvbnMuaW5zZXJ0ZWRJZCBpbnN0YW5jZW9mIE1vbmdvLk9iamVjdElEICYmXG4gICAgICBvcHRpb25zLmdlbmVyYXRlZElkKSkge1xuICAgIC8vIEluIGNhc2Ugb2YgYW4gdXBzZXJ0IHdpdGggYSByZXBsYWNlbWVudCwgd2hlcmUgdGhlcmUgaXMgbm8gX2lkIGRlZmluZWRcbiAgICAvLyBpbiBlaXRoZXIgdGhlIHF1ZXJ5IG9yIHRoZSByZXBsYWNlbWVudCBkb2MsIG1vbmdvIHdpbGwgZ2VuZXJhdGUgYW4gaWQgaXRzZWxmLlxuICAgIC8vIFRoZXJlZm9yZSB3ZSBuZWVkIHRoaXMgc3BlY2lhbCBzdHJhdGVneSBpZiB3ZSB3YW50IHRvIGNvbnRyb2wgdGhlIGlkIG91cnNlbHZlcy5cblxuICAgIC8vIFdlIGRvbid0IG5lZWQgdG8gZG8gdGhpcyB3aGVuOlxuICAgIC8vIC0gVGhpcyBpcyBub3QgYSByZXBsYWNlbWVudCwgc28gd2UgY2FuIGFkZCBhbiBfaWQgdG8gJHNldE9uSW5zZXJ0XG4gICAgLy8gLSBUaGUgaWQgaXMgZGVmaW5lZCBieSBxdWVyeSBvciBtb2Qgd2UgY2FuIGp1c3QgYWRkIGl0IHRvIHRoZSByZXBsYWNlbWVudCBkb2NcbiAgICAvLyAtIFRoZSB1c2VyIGRpZCBub3Qgc3BlY2lmeSBhbnkgaWQgcHJlZmVyZW5jZSBhbmQgdGhlIGlkIGlzIGEgTW9uZ28gT2JqZWN0SWQsXG4gICAgLy8gICAgIHRoZW4gd2UgY2FuIGp1c3QgbGV0IE1vbmdvIGdlbmVyYXRlIHRoZSBpZFxuICAgIHJldHVybiBhd2FpdCBzaW11bGF0ZVVwc2VydFdpdGhJbnNlcnRlZElkKGNvbGxlY3Rpb24sIG1vbmdvU2VsZWN0b3IsIG1vbmdvTW9kLCBvcHRpb25zKVxuICAgICAgLnRoZW4oYXN5bmMgcmVzdWx0ID0+IHtcbiAgICAgICAgYXdhaXQgcmVmcmVzaCgpO1xuICAgICAgICBhd2FpdCB3cml0ZS5jb21taXR0ZWQoKTtcbiAgICAgICAgaWYgKHJlc3VsdCAmJiAhIG9wdGlvbnMuX3JldHVybk9iamVjdCkge1xuICAgICAgICAgIHJldHVybiByZXN1bHQubnVtYmVyQWZmZWN0ZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKG9wdGlvbnMudXBzZXJ0ICYmICFrbm93bklkICYmIG9wdGlvbnMuaW5zZXJ0ZWRJZCAmJiBpc01vZGlmeSkge1xuICAgICAgaWYgKCFtb25nb01vZC5oYXNPd25Qcm9wZXJ0eSgnJHNldE9uSW5zZXJ0JykpIHtcbiAgICAgICAgbW9uZ29Nb2QuJHNldE9uSW5zZXJ0ID0ge307XG4gICAgICB9XG4gICAgICBrbm93bklkID0gb3B0aW9ucy5pbnNlcnRlZElkO1xuICAgICAgT2JqZWN0LmFzc2lnbihtb25nb01vZC4kc2V0T25JbnNlcnQsIHJlcGxhY2VUeXBlcyh7X2lkOiBvcHRpb25zLmluc2VydGVkSWR9LCByZXBsYWNlTWV0ZW9yQXRvbVdpdGhNb25nbykpO1xuICAgIH1cblxuICAgIGNvbnN0IHN0cmluZ3MgPSBPYmplY3Qua2V5cyhtb25nb01vZCkuZmlsdGVyKChrZXkpID0+ICFrZXkuc3RhcnRzV2l0aChcIiRcIikpO1xuICAgIGxldCB1cGRhdGVNZXRob2QgPSBzdHJpbmdzLmxlbmd0aCA+IDAgPyAncmVwbGFjZU9uZScgOiAndXBkYXRlTWFueSc7XG4gICAgdXBkYXRlTWV0aG9kID1cbiAgICAgIHVwZGF0ZU1ldGhvZCA9PT0gJ3VwZGF0ZU1hbnknICYmICFtb25nb09wdHMubXVsdGlcbiAgICAgICAgPyAndXBkYXRlT25lJ1xuICAgICAgICA6IHVwZGF0ZU1ldGhvZDtcbiAgICByZXR1cm4gY29sbGVjdGlvblt1cGRhdGVNZXRob2RdXG4gICAgICAuYmluZChjb2xsZWN0aW9uKShtb25nb1NlbGVjdG9yLCBtb25nb01vZCwgbW9uZ29PcHRzKVxuICAgICAgLnRoZW4oYXN5bmMgcmVzdWx0ID0+IHtcbiAgICAgICAgdmFyIG1ldGVvclJlc3VsdCA9IHRyYW5zZm9ybVJlc3VsdCh7cmVzdWx0fSk7XG4gICAgICAgIGlmIChtZXRlb3JSZXN1bHQgJiYgb3B0aW9ucy5fcmV0dXJuT2JqZWN0KSB7XG4gICAgICAgICAgLy8gSWYgdGhpcyB3YXMgYW4gdXBzZXJ0QXN5bmMoKSBjYWxsLCBhbmQgd2UgZW5kZWQgdXBcbiAgICAgICAgICAvLyBpbnNlcnRpbmcgYSBuZXcgZG9jIGFuZCB3ZSBrbm93IGl0cyBpZCwgdGhlblxuICAgICAgICAgIC8vIHJldHVybiB0aGF0IGlkIGFzIHdlbGwuXG4gICAgICAgICAgaWYgKG9wdGlvbnMudXBzZXJ0ICYmIG1ldGVvclJlc3VsdC5pbnNlcnRlZElkKSB7XG4gICAgICAgICAgICBpZiAoa25vd25JZCkge1xuICAgICAgICAgICAgICBtZXRlb3JSZXN1bHQuaW5zZXJ0ZWRJZCA9IGtub3duSWQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1ldGVvclJlc3VsdC5pbnNlcnRlZElkIGluc3RhbmNlb2YgTW9uZ29EQi5PYmplY3RJZCkge1xuICAgICAgICAgICAgICBtZXRlb3JSZXN1bHQuaW5zZXJ0ZWRJZCA9IG5ldyBNb25nby5PYmplY3RJRChtZXRlb3JSZXN1bHQuaW5zZXJ0ZWRJZC50b0hleFN0cmluZygpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgcmVmcmVzaCgpO1xuICAgICAgICAgIGF3YWl0IHdyaXRlLmNvbW1pdHRlZCgpO1xuICAgICAgICAgIHJldHVybiBtZXRlb3JSZXN1bHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXdhaXQgcmVmcmVzaCgpO1xuICAgICAgICAgIGF3YWl0IHdyaXRlLmNvbW1pdHRlZCgpO1xuICAgICAgICAgIHJldHVybiBtZXRlb3JSZXN1bHQubnVtYmVyQWZmZWN0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH0pLmNhdGNoKGFzeW5jIChlcnIpID0+IHtcbiAgICAgICAgYXdhaXQgd3JpdGUuY29tbWl0dGVkKCk7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH0pO1xuICB9XG59O1xuXG4vLyBleHBvc2VkIGZvciB0ZXN0aW5nXG5Nb25nb0Nvbm5lY3Rpb24uX2lzQ2Fubm90Q2hhbmdlSWRFcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcblxuICAvLyBNb25nbyAzLjIuKiByZXR1cm5zIGVycm9yIGFzIG5leHQgT2JqZWN0OlxuICAvLyB7bmFtZTogU3RyaW5nLCBjb2RlOiBOdW1iZXIsIGVycm1zZzogU3RyaW5nfVxuICAvLyBPbGRlciBNb25nbyByZXR1cm5zOlxuICAvLyB7bmFtZTogU3RyaW5nLCBjb2RlOiBOdW1iZXIsIGVycjogU3RyaW5nfVxuICB2YXIgZXJyb3IgPSBlcnIuZXJybXNnIHx8IGVyci5lcnI7XG5cbiAgLy8gV2UgZG9uJ3QgdXNlIHRoZSBlcnJvciBjb2RlIGhlcmVcbiAgLy8gYmVjYXVzZSB0aGUgZXJyb3IgY29kZSB3ZSBvYnNlcnZlZCBpdCBwcm9kdWNpbmcgKDE2ODM3KSBhcHBlYXJzIHRvIGJlXG4gIC8vIGEgZmFyIG1vcmUgZ2VuZXJpYyBlcnJvciBjb2RlIGJhc2VkIG9uIGV4YW1pbmluZyB0aGUgc291cmNlLlxuICBpZiAoZXJyb3IuaW5kZXhPZignVGhlIF9pZCBmaWVsZCBjYW5ub3QgYmUgY2hhbmdlZCcpID09PSAwXG4gICAgfHwgZXJyb3IuaW5kZXhPZihcInRoZSAoaW1tdXRhYmxlKSBmaWVsZCAnX2lkJyB3YXMgZm91bmQgdG8gaGF2ZSBiZWVuIGFsdGVyZWQgdG8gX2lkXCIpICE9PSAtMSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLy8gWFhYIE1vbmdvQ29ubmVjdGlvbi51cHNlcnRBc3luYygpIGRvZXMgbm90IHJldHVybiB0aGUgaWQgb2YgdGhlIGluc2VydGVkIGRvY3VtZW50XG4vLyB1bmxlc3MgeW91IHNldCBpdCBleHBsaWNpdGx5IGluIHRoZSBzZWxlY3RvciBvciBtb2RpZmllciAoYXMgYSByZXBsYWNlbWVudFxuLy8gZG9jKS5cbk1vbmdvQ29ubmVjdGlvbi5wcm90b3R5cGUudXBzZXJ0QXN5bmMgPSBhc3luYyBmdW5jdGlvbiAoY29sbGVjdGlvbk5hbWUsIHNlbGVjdG9yLCBtb2QsIG9wdGlvbnMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cblxuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwiZnVuY3Rpb25cIiAmJiAhIGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuXG4gIHJldHVybiBzZWxmLnVwZGF0ZUFzeW5jKGNvbGxlY3Rpb25OYW1lLCBzZWxlY3RvciwgbW9kLFxuICAgIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgIHVwc2VydDogdHJ1ZSxcbiAgICAgIF9yZXR1cm5PYmplY3Q6IHRydWVcbiAgICB9KSk7XG59O1xuXG5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbiAoY29sbGVjdGlvbk5hbWUsIHNlbGVjdG9yLCBvcHRpb25zKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSlcbiAgICBzZWxlY3RvciA9IHt9O1xuXG4gIHJldHVybiBuZXcgQ3Vyc29yKFxuICAgIHNlbGYsIG5ldyBDdXJzb3JEZXNjcmlwdGlvbihjb2xsZWN0aW9uTmFtZSwgc2VsZWN0b3IsIG9wdGlvbnMpKTtcbn07XG5cbk1vbmdvQ29ubmVjdGlvbi5wcm90b3R5cGUuZmluZE9uZUFzeW5jID0gYXN5bmMgZnVuY3Rpb24gKGNvbGxlY3Rpb25fbmFtZSwgc2VsZWN0b3IsIG9wdGlvbnMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIHNlbGVjdG9yID0ge307XG4gIH1cblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgb3B0aW9ucy5saW1pdCA9IDE7XG5cbiAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHNlbGYuZmluZChjb2xsZWN0aW9uX25hbWUsIHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaCgpO1xuXG4gIHJldHVybiByZXN1bHRzWzBdO1xufTtcblxuLy8gV2UnbGwgYWN0dWFsbHkgZGVzaWduIGFuIGluZGV4IEFQSSBsYXRlci4gRm9yIG5vdywgd2UganVzdCBwYXNzIHRocm91Z2ggdG9cbi8vIE1vbmdvJ3MsIGJ1dCBtYWtlIGl0IHN5bmNocm9ub3VzLlxuTW9uZ29Db25uZWN0aW9uLnByb3RvdHlwZS5jcmVhdGVJbmRleEFzeW5jID0gYXN5bmMgZnVuY3Rpb24gKGNvbGxlY3Rpb25OYW1lLCBpbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICAvLyBXZSBleHBlY3QgdGhpcyBmdW5jdGlvbiB0byBiZSBjYWxsZWQgYXQgc3RhcnR1cCwgbm90IGZyb20gd2l0aGluIGEgbWV0aG9kLFxuICAvLyBzbyB3ZSBkb24ndCBpbnRlcmFjdCB3aXRoIHRoZSB3cml0ZSBmZW5jZS5cbiAgdmFyIGNvbGxlY3Rpb24gPSBzZWxmLnJhd0NvbGxlY3Rpb24oY29sbGVjdGlvbk5hbWUpO1xuICBhd2FpdCBjb2xsZWN0aW9uLmNyZWF0ZUluZGV4KGluZGV4LCBvcHRpb25zKTtcbn07XG5cbi8vIGp1c3QgdG8gYmUgY29uc2lzdGVudCB3aXRoIHRoZSBvdGhlciBtZXRob2RzXG5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLmNyZWF0ZUluZGV4ID1cbiAgTW9uZ29Db25uZWN0aW9uLnByb3RvdHlwZS5jcmVhdGVJbmRleEFzeW5jO1xuXG5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLmNvdW50RG9jdW1lbnRzID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25OYW1lLCAuLi5hcmdzKSB7XG4gIGFyZ3MgPSBhcmdzLm1hcChhcmcgPT4gcmVwbGFjZVR5cGVzKGFyZywgcmVwbGFjZU1ldGVvckF0b21XaXRoTW9uZ28pKTtcbiAgY29uc3QgY29sbGVjdGlvbiA9IHRoaXMucmF3Q29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZSk7XG4gIHJldHVybiBjb2xsZWN0aW9uLmNvdW50RG9jdW1lbnRzKC4uLmFyZ3MpO1xufTtcblxuTW9uZ29Db25uZWN0aW9uLnByb3RvdHlwZS5lc3RpbWF0ZWREb2N1bWVudENvdW50ID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25OYW1lLCAuLi5hcmdzKSB7XG4gIGFyZ3MgPSBhcmdzLm1hcChhcmcgPT4gcmVwbGFjZVR5cGVzKGFyZywgcmVwbGFjZU1ldGVvckF0b21XaXRoTW9uZ28pKTtcbiAgY29uc3QgY29sbGVjdGlvbiA9IHRoaXMucmF3Q29sbGVjdGlvbihjb2xsZWN0aW9uTmFtZSk7XG4gIHJldHVybiBjb2xsZWN0aW9uLmVzdGltYXRlZERvY3VtZW50Q291bnQoLi4uYXJncyk7XG59O1xuXG5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLmVuc3VyZUluZGV4QXN5bmMgPSBNb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLmNyZWF0ZUluZGV4QXN5bmM7XG5cbk1vbmdvQ29ubmVjdGlvbi5wcm90b3R5cGUuZHJvcEluZGV4QXN5bmMgPSBhc3luYyBmdW5jdGlvbiAoY29sbGVjdGlvbk5hbWUsIGluZGV4KSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuXG4gIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIGJ5IHRlc3QgY29kZSwgbm90IHdpdGhpbiBhIG1ldGhvZCwgc28gd2UgZG9uJ3RcbiAgLy8gaW50ZXJhY3Qgd2l0aCB0aGUgd3JpdGUgZmVuY2UuXG4gIHZhciBjb2xsZWN0aW9uID0gc2VsZi5yYXdDb2xsZWN0aW9uKGNvbGxlY3Rpb25OYW1lKTtcbiAgdmFyIGluZGV4TmFtZSA9ICBhd2FpdCBjb2xsZWN0aW9uLmRyb3BJbmRleChpbmRleCk7XG59O1xuXG5cbkNMSUVOVF9PTkxZX01FVEhPRFMuZm9yRWFjaChmdW5jdGlvbiAobSkge1xuICBNb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlW21dID0gZnVuY3Rpb24gKCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGAke219ICsgIGlzIG5vdCBhdmFpbGFibGUgb24gdGhlIHNlcnZlci4gUGxlYXNlIHVzZSAke2dldEFzeW5jTWV0aG9kTmFtZShcbiAgICAgICAgbVxuICAgICAgKX0oKSBpbnN0ZWFkLmBcbiAgICApO1xuICB9O1xufSk7XG5cblxudmFyIE5VTV9PUFRJTUlTVElDX1RSSUVTID0gMztcblxuXG5cbnZhciBzaW11bGF0ZVVwc2VydFdpdGhJbnNlcnRlZElkID0gYXN5bmMgZnVuY3Rpb24gKGNvbGxlY3Rpb24sIHNlbGVjdG9yLCBtb2QsIG9wdGlvbnMpIHtcbiAgLy8gU1RSQVRFR1k6IEZpcnN0IHRyeSBkb2luZyBhbiB1cHNlcnQgd2l0aCBhIGdlbmVyYXRlZCBJRC5cbiAgLy8gSWYgdGhpcyB0aHJvd3MgYW4gZXJyb3IgYWJvdXQgY2hhbmdpbmcgdGhlIElEIG9uIGFuIGV4aXN0aW5nIGRvY3VtZW50XG4gIC8vIHRoZW4gd2l0aG91dCBhZmZlY3RpbmcgdGhlIGRhdGFiYXNlLCB3ZSBrbm93IHdlIHNob3VsZCBwcm9iYWJseSB0cnlcbiAgLy8gYW4gdXBkYXRlIHdpdGhvdXQgdGhlIGdlbmVyYXRlZCBJRC4gSWYgaXQgYWZmZWN0ZWQgMCBkb2N1bWVudHMsXG4gIC8vIHRoZW4gd2l0aG91dCBhZmZlY3RpbmcgdGhlIGRhdGFiYXNlLCB3ZSB0aGUgZG9jdW1lbnQgdGhhdCBmaXJzdFxuICAvLyBnYXZlIHRoZSBlcnJvciBpcyBwcm9iYWJseSByZW1vdmVkIGFuZCB3ZSBuZWVkIHRvIHRyeSBhbiBpbnNlcnQgYWdhaW5cbiAgLy8gV2UgZ28gYmFjayB0byBzdGVwIG9uZSBhbmQgcmVwZWF0LlxuICAvLyBMaWtlIGFsbCBcIm9wdGltaXN0aWMgd3JpdGVcIiBzY2hlbWVzLCB3ZSByZWx5IG9uIHRoZSBmYWN0IHRoYXQgaXQnc1xuICAvLyB1bmxpa2VseSBvdXIgd3JpdGVzIHdpbGwgY29udGludWUgdG8gYmUgaW50ZXJmZXJlZCB3aXRoIHVuZGVyIG5vcm1hbFxuICAvLyBjaXJjdW1zdGFuY2VzICh0aG91Z2ggc3VmZmljaWVudGx5IGhlYXZ5IGNvbnRlbnRpb24gd2l0aCB3cml0ZXJzXG4gIC8vIGRpc2FncmVlaW5nIG9uIHRoZSBleGlzdGVuY2Ugb2YgYW4gb2JqZWN0IHdpbGwgY2F1c2Ugd3JpdGVzIHRvIGZhaWxcbiAgLy8gaW4gdGhlb3J5KS5cblxuICB2YXIgaW5zZXJ0ZWRJZCA9IG9wdGlvbnMuaW5zZXJ0ZWRJZDsgLy8gbXVzdCBleGlzdFxuICB2YXIgbW9uZ29PcHRzRm9yVXBkYXRlID0ge1xuICAgIHNhZmU6IHRydWUsXG4gICAgbXVsdGk6IG9wdGlvbnMubXVsdGlcbiAgfTtcbiAgdmFyIG1vbmdvT3B0c0Zvckluc2VydCA9IHtcbiAgICBzYWZlOiB0cnVlLFxuICAgIHVwc2VydDogdHJ1ZVxuICB9O1xuXG4gIHZhciByZXBsYWNlbWVudFdpdGhJZCA9IE9iamVjdC5hc3NpZ24oXG4gICAgcmVwbGFjZVR5cGVzKHtfaWQ6IGluc2VydGVkSWR9LCByZXBsYWNlTWV0ZW9yQXRvbVdpdGhNb25nbyksXG4gICAgbW9kKTtcblxuICB2YXIgdHJpZXMgPSBOVU1fT1BUSU1JU1RJQ19UUklFUztcblxuICB2YXIgZG9VcGRhdGUgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgdHJpZXMtLTtcbiAgICBpZiAoISB0cmllcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVXBzZXJ0IGZhaWxlZCBhZnRlciBcIiArIE5VTV9PUFRJTUlTVElDX1RSSUVTICsgXCIgdHJpZXMuXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgbWV0aG9kID0gY29sbGVjdGlvbi51cGRhdGVNYW55O1xuICAgICAgaWYoIU9iamVjdC5rZXlzKG1vZCkuc29tZShrZXkgPT4ga2V5LnN0YXJ0c1dpdGgoXCIkXCIpKSl7XG4gICAgICAgIG1ldGhvZCA9IGNvbGxlY3Rpb24ucmVwbGFjZU9uZS5iaW5kKGNvbGxlY3Rpb24pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ldGhvZChcbiAgICAgICAgc2VsZWN0b3IsXG4gICAgICAgIG1vZCxcbiAgICAgICAgbW9uZ29PcHRzRm9yVXBkYXRlKS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIGlmIChyZXN1bHQgJiYgKHJlc3VsdC5tb2RpZmllZENvdW50IHx8IHJlc3VsdC51cHNlcnRlZENvdW50KSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBudW1iZXJBZmZlY3RlZDogcmVzdWx0Lm1vZGlmaWVkQ291bnQgfHwgcmVzdWx0LnVwc2VydGVkQ291bnQsXG4gICAgICAgICAgICBpbnNlcnRlZElkOiByZXN1bHQudXBzZXJ0ZWRJZCB8fCB1bmRlZmluZWQsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZG9Db25kaXRpb25hbEluc2VydCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGRvQ29uZGl0aW9uYWxJbnNlcnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5yZXBsYWNlT25lKHNlbGVjdG9yLCByZXBsYWNlbWVudFdpdGhJZCwgbW9uZ29PcHRzRm9ySW5zZXJ0KVxuICAgICAgLnRoZW4ocmVzdWx0ID0+ICh7XG4gICAgICAgIG51bWJlckFmZmVjdGVkOiByZXN1bHQudXBzZXJ0ZWRDb3VudCxcbiAgICAgICAgaW5zZXJ0ZWRJZDogcmVzdWx0LnVwc2VydGVkSWQsXG4gICAgICB9KSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgaWYgKE1vbmdvQ29ubmVjdGlvbi5faXNDYW5ub3RDaGFuZ2VJZEVycm9yKGVycikpIHtcbiAgICAgICAgICByZXR1cm4gZG9VcGRhdGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gIH07XG4gIHJldHVybiBkb1VwZGF0ZSgpO1xufTtcblxuLy8gb2JzZXJ2ZUNoYW5nZXMgZm9yIHRhaWxhYmxlIGN1cnNvcnMgb24gY2FwcGVkIGNvbGxlY3Rpb25zLlxuLy9cbi8vIFNvbWUgZGlmZmVyZW5jZXMgZnJvbSBub3JtYWwgY3Vyc29yczpcbi8vICAgLSBXaWxsIG5ldmVyIHByb2R1Y2UgYW55dGhpbmcgb3RoZXIgdGhhbiAnYWRkZWQnIG9yICdhZGRlZEJlZm9yZScuIElmIHlvdVxuLy8gICAgIGRvIHVwZGF0ZSBhIGRvY3VtZW50IHRoYXQgaGFzIGFscmVhZHkgYmVlbiBwcm9kdWNlZCwgdGhpcyB3aWxsIG5vdCBub3RpY2Vcbi8vICAgICBpdC5cbi8vICAgLSBJZiB5b3UgZGlzY29ubmVjdCBhbmQgcmVjb25uZWN0IGZyb20gTW9uZ28sIGl0IHdpbGwgZXNzZW50aWFsbHkgcmVzdGFydFxuLy8gICAgIHRoZSBxdWVyeSwgd2hpY2ggd2lsbCBsZWFkIHRvIGR1cGxpY2F0ZSByZXN1bHRzLiBUaGlzIGlzIHByZXR0eSBiYWQsXG4vLyAgICAgYnV0IGlmIHlvdSBpbmNsdWRlIGEgZmllbGQgY2FsbGVkICd0cycgd2hpY2ggaXMgaW5zZXJ0ZWQgYXNcbi8vICAgICBuZXcgTW9uZ29JbnRlcm5hbHMuTW9uZ29UaW1lc3RhbXAoMCwgMCkgKHdoaWNoIGlzIGluaXRpYWxpemVkIHRvIHRoZVxuLy8gICAgIGN1cnJlbnQgTW9uZ28tc3R5bGUgdGltZXN0YW1wKSwgd2UnbGwgYmUgYWJsZSB0byBmaW5kIHRoZSBwbGFjZSB0b1xuLy8gICAgIHJlc3RhcnQgcHJvcGVybHkuIChUaGlzIGZpZWxkIGlzIHNwZWNpZmljYWxseSB1bmRlcnN0b29kIGJ5IE1vbmdvIHdpdGggYW5cbi8vICAgICBvcHRpbWl6YXRpb24gd2hpY2ggYWxsb3dzIGl0IHRvIGZpbmQgdGhlIHJpZ2h0IHBsYWNlIHRvIHN0YXJ0IHdpdGhvdXRcbi8vICAgICBhbiBpbmRleCBvbiB0cy4gSXQncyBob3cgdGhlIG9wbG9nIHdvcmtzLilcbi8vICAgLSBObyBjYWxsYmFja3MgYXJlIHRyaWdnZXJlZCBzeW5jaHJvbm91c2x5IHdpdGggdGhlIGNhbGwgKHRoZXJlJ3Mgbm9cbi8vICAgICBkaWZmZXJlbnRpYXRpb24gYmV0d2VlbiBcImluaXRpYWwgZGF0YVwiIGFuZCBcImxhdGVyIGNoYW5nZXNcIjsgZXZlcnl0aGluZ1xuLy8gICAgIHRoYXQgbWF0Y2hlcyB0aGUgcXVlcnkgZ2V0cyBzZW50IGFzeW5jaHJvbm91c2x5KS5cbi8vICAgLSBEZS1kdXBsaWNhdGlvbiBpcyBub3QgaW1wbGVtZW50ZWQuXG4vLyAgIC0gRG9lcyBub3QgeWV0IGludGVyYWN0IHdpdGggdGhlIHdyaXRlIGZlbmNlLiBQcm9iYWJseSwgdGhpcyBzaG91bGQgd29yayBieVxuLy8gICAgIGlnbm9yaW5nIHJlbW92ZXMgKHdoaWNoIGRvbid0IHdvcmsgb24gY2FwcGVkIGNvbGxlY3Rpb25zKSBhbmQgdXBkYXRlc1xuLy8gICAgICh3aGljaCBkb24ndCBhZmZlY3QgdGFpbGFibGUgY3Vyc29ycyksIGFuZCBqdXN0IGtlZXBpbmcgdHJhY2sgb2YgdGhlIElEXG4vLyAgICAgb2YgdGhlIGluc2VydGVkIG9iamVjdCwgYW5kIGNsb3NpbmcgdGhlIHdyaXRlIGZlbmNlIG9uY2UgeW91IGdldCB0byB0aGF0XG4vLyAgICAgSUQgKG9yIHRpbWVzdGFtcD8pLiAgVGhpcyBkb2Vzbid0IHdvcmsgd2VsbCBpZiB0aGUgZG9jdW1lbnQgZG9lc24ndCBtYXRjaFxuLy8gICAgIHRoZSBxdWVyeSwgdGhvdWdoLiAgT24gdGhlIG90aGVyIGhhbmQsIHRoZSB3cml0ZSBmZW5jZSBjYW4gY2xvc2Vcbi8vICAgICBpbW1lZGlhdGVseSBpZiBpdCBkb2VzIG5vdCBtYXRjaCB0aGUgcXVlcnkuIFNvIGlmIHdlIHRydXN0IG1pbmltb25nb1xuLy8gICAgIGVub3VnaCB0byBhY2N1cmF0ZWx5IGV2YWx1YXRlIHRoZSBxdWVyeSBhZ2FpbnN0IHRoZSB3cml0ZSBmZW5jZSwgd2Vcbi8vICAgICBzaG91bGQgYmUgYWJsZSB0byBkbyB0aGlzLi4uICBPZiBjb3Vyc2UsIG1pbmltb25nbyBkb2Vzbid0IGV2ZW4gc3VwcG9ydFxuLy8gICAgIE1vbmdvIFRpbWVzdGFtcHMgeWV0LlxuTW9uZ29Db25uZWN0aW9uLnByb3RvdHlwZS5fb2JzZXJ2ZUNoYW5nZXNUYWlsYWJsZSA9IGZ1bmN0aW9uIChcbiAgY3Vyc29yRGVzY3JpcHRpb24sIG9yZGVyZWQsIGNhbGxiYWNrcykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgLy8gVGFpbGFibGUgY3Vyc29ycyBvbmx5IGV2ZXIgY2FsbCBhZGRlZC9hZGRlZEJlZm9yZSBjYWxsYmFja3MsIHNvIGl0J3MgYW5cbiAgLy8gZXJyb3IgaWYgeW91IGRpZG4ndCBwcm92aWRlIHRoZW0uXG4gIGlmICgob3JkZXJlZCAmJiAhY2FsbGJhY2tzLmFkZGVkQmVmb3JlKSB8fFxuICAgICghb3JkZXJlZCAmJiAhY2FsbGJhY2tzLmFkZGVkKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IG9ic2VydmUgYW4gXCIgKyAob3JkZXJlZCA/IFwib3JkZXJlZFwiIDogXCJ1bm9yZGVyZWRcIilcbiAgICAgICsgXCIgdGFpbGFibGUgY3Vyc29yIHdpdGhvdXQgYSBcIlxuICAgICAgKyAob3JkZXJlZCA/IFwiYWRkZWRCZWZvcmVcIiA6IFwiYWRkZWRcIikgKyBcIiBjYWxsYmFja1wiKTtcbiAgfVxuXG4gIHJldHVybiBzZWxmLnRhaWwoY3Vyc29yRGVzY3JpcHRpb24sIGZ1bmN0aW9uIChkb2MpIHtcbiAgICB2YXIgaWQgPSBkb2MuX2lkO1xuICAgIGRlbGV0ZSBkb2MuX2lkO1xuICAgIC8vIFRoZSB0cyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBkZXRhaWwuIEhpZGUgaXQuXG4gICAgZGVsZXRlIGRvYy50cztcbiAgICBpZiAob3JkZXJlZCkge1xuICAgICAgY2FsbGJhY2tzLmFkZGVkQmVmb3JlKGlkLCBkb2MsIG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFja3MuYWRkZWQoaWQsIGRvYyk7XG4gICAgfVxuICB9KTtcbn07XG5cbk1vbmdvQ29ubmVjdGlvbi5wcm90b3R5cGUuX2NyZWF0ZUFzeW5jaHJvbm91c0N1cnNvciA9IGZ1bmN0aW9uKFxuICBjdXJzb3JEZXNjcmlwdGlvbiwgb3B0aW9ucyA9IHt9KSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgY29uc3QgeyBzZWxmRm9ySXRlcmF0aW9uLCB1c2VUcmFuc2Zvcm0gfSA9IG9wdGlvbnM7XG4gIG9wdGlvbnMgPSB7IHNlbGZGb3JJdGVyYXRpb24sIHVzZVRyYW5zZm9ybSB9O1xuXG4gIHZhciBjb2xsZWN0aW9uID0gc2VsZi5yYXdDb2xsZWN0aW9uKGN1cnNvckRlc2NyaXB0aW9uLmNvbGxlY3Rpb25OYW1lKTtcbiAgdmFyIGN1cnNvck9wdGlvbnMgPSBjdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zO1xuICB2YXIgbW9uZ29PcHRpb25zID0ge1xuICAgIHNvcnQ6IGN1cnNvck9wdGlvbnMuc29ydCxcbiAgICBsaW1pdDogY3Vyc29yT3B0aW9ucy5saW1pdCxcbiAgICBza2lwOiBjdXJzb3JPcHRpb25zLnNraXAsXG4gICAgcHJvamVjdGlvbjogY3Vyc29yT3B0aW9ucy5maWVsZHMgfHwgY3Vyc29yT3B0aW9ucy5wcm9qZWN0aW9uLFxuICAgIHJlYWRQcmVmZXJlbmNlOiBjdXJzb3JPcHRpb25zLnJlYWRQcmVmZXJlbmNlLFxuICB9O1xuXG4gIC8vIERvIHdlIHdhbnQgYSB0YWlsYWJsZSBjdXJzb3IgKHdoaWNoIG9ubHkgd29ya3Mgb24gY2FwcGVkIGNvbGxlY3Rpb25zKT9cbiAgaWYgKGN1cnNvck9wdGlvbnMudGFpbGFibGUpIHtcbiAgICBtb25nb09wdGlvbnMubnVtYmVyT2ZSZXRyaWVzID0gLTE7XG4gIH1cblxuICB2YXIgZGJDdXJzb3IgPSBjb2xsZWN0aW9uLmZpbmQoXG4gICAgcmVwbGFjZVR5cGVzKGN1cnNvckRlc2NyaXB0aW9uLnNlbGVjdG9yLCByZXBsYWNlTWV0ZW9yQXRvbVdpdGhNb25nbyksXG4gICAgbW9uZ29PcHRpb25zKTtcblxuICAvLyBEbyB3ZSB3YW50IGEgdGFpbGFibGUgY3Vyc29yICh3aGljaCBvbmx5IHdvcmtzIG9uIGNhcHBlZCBjb2xsZWN0aW9ucyk/XG4gIGlmIChjdXJzb3JPcHRpb25zLnRhaWxhYmxlKSB7XG4gICAgLy8gV2Ugd2FudCBhIHRhaWxhYmxlIGN1cnNvci4uLlxuICAgIGRiQ3Vyc29yLmFkZEN1cnNvckZsYWcoXCJ0YWlsYWJsZVwiLCB0cnVlKVxuICAgIC8vIC4uLiBhbmQgZm9yIHRoZSBzZXJ2ZXIgdG8gd2FpdCBhIGJpdCBpZiBhbnkgZ2V0TW9yZSBoYXMgbm8gZGF0YSAocmF0aGVyXG4gICAgLy8gdGhhbiBtYWtpbmcgdXMgcHV0IHRoZSByZWxldmFudCBzbGVlcHMgaW4gdGhlIGNsaWVudCkuLi5cbiAgICBkYkN1cnNvci5hZGRDdXJzb3JGbGFnKFwiYXdhaXREYXRhXCIsIHRydWUpXG5cbiAgICAvLyBBbmQgaWYgdGhpcyBpcyBvbiB0aGUgb3Bsb2cgY29sbGVjdGlvbiBhbmQgdGhlIGN1cnNvciBzcGVjaWZpZXMgYSAndHMnLFxuICAgIC8vIHRoZW4gc2V0IHRoZSB1bmRvY3VtZW50ZWQgb3Bsb2cgcmVwbGF5IGZsYWcsIHdoaWNoIGRvZXMgYSBzcGVjaWFsIHNjYW4gdG9cbiAgICAvLyBmaW5kIHRoZSBmaXJzdCBkb2N1bWVudCAoaW5zdGVhZCBvZiBjcmVhdGluZyBhbiBpbmRleCBvbiB0cykuIFRoaXMgaXMgYVxuICAgIC8vIHZlcnkgaGFyZC1jb2RlZCBNb25nbyBmbGFnIHdoaWNoIG9ubHkgd29ya3Mgb24gdGhlIG9wbG9nIGNvbGxlY3Rpb24gYW5kXG4gICAgLy8gb25seSB3b3JrcyB3aXRoIHRoZSB0cyBmaWVsZC5cbiAgICBpZiAoY3Vyc29yRGVzY3JpcHRpb24uY29sbGVjdGlvbk5hbWUgPT09IE9QTE9HX0NPTExFQ1RJT04gJiZcbiAgICAgIGN1cnNvckRlc2NyaXB0aW9uLnNlbGVjdG9yLnRzKSB7XG4gICAgICBkYkN1cnNvci5hZGRDdXJzb3JGbGFnKFwib3Bsb2dSZXBsYXlcIiwgdHJ1ZSlcbiAgICB9XG4gIH1cblxuICBpZiAodHlwZW9mIGN1cnNvck9wdGlvbnMubWF4VGltZU1zICE9PSAndW5kZWZpbmVkJykge1xuICAgIGRiQ3Vyc29yID0gZGJDdXJzb3IubWF4VGltZU1TKGN1cnNvck9wdGlvbnMubWF4VGltZU1zKTtcbiAgfVxuICBpZiAodHlwZW9mIGN1cnNvck9wdGlvbnMuaGludCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBkYkN1cnNvciA9IGRiQ3Vyc29yLmhpbnQoY3Vyc29yT3B0aW9ucy5oaW50KTtcbiAgfVxuXG4gIHJldHVybiBuZXcgQXN5bmNocm9ub3VzQ3Vyc29yKGRiQ3Vyc29yLCBjdXJzb3JEZXNjcmlwdGlvbiwgb3B0aW9ucywgY29sbGVjdGlvbik7XG59O1xuXG4vLyBUYWlscyB0aGUgY3Vyc29yIGRlc2NyaWJlZCBieSBjdXJzb3JEZXNjcmlwdGlvbiwgbW9zdCBsaWtlbHkgb24gdGhlXG4vLyBvcGxvZy4gQ2FsbHMgZG9jQ2FsbGJhY2sgd2l0aCBlYWNoIGRvY3VtZW50IGZvdW5kLiBJZ25vcmVzIGVycm9ycyBhbmQganVzdFxuLy8gcmVzdGFydHMgdGhlIHRhaWwgb24gZXJyb3IuXG4vL1xuLy8gSWYgdGltZW91dE1TIGlzIHNldCwgdGhlbiBpZiB3ZSBkb24ndCBnZXQgYSBuZXcgZG9jdW1lbnQgZXZlcnkgdGltZW91dE1TLFxuLy8ga2lsbCBhbmQgcmVzdGFydCB0aGUgY3Vyc29yLiBUaGlzIGlzIHByaW1hcmlseSBhIHdvcmthcm91bmQgZm9yICM4NTk4LlxuTW9uZ29Db25uZWN0aW9uLnByb3RvdHlwZS50YWlsID0gZnVuY3Rpb24gKGN1cnNvckRlc2NyaXB0aW9uLCBkb2NDYWxsYmFjaywgdGltZW91dE1TKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgaWYgKCFjdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zLnRhaWxhYmxlKVxuICAgIHRocm93IG5ldyBFcnJvcihcIkNhbiBvbmx5IHRhaWwgYSB0YWlsYWJsZSBjdXJzb3JcIik7XG5cbiAgdmFyIGN1cnNvciA9IHNlbGYuX2NyZWF0ZUFzeW5jaHJvbm91c0N1cnNvcihjdXJzb3JEZXNjcmlwdGlvbik7XG5cbiAgdmFyIHN0b3BwZWQgPSBmYWxzZTtcbiAgdmFyIGxhc3RUUztcblxuICBNZXRlb3IuZGVmZXIoYXN5bmMgZnVuY3Rpb24gbG9vcCgpIHtcbiAgICB2YXIgZG9jID0gbnVsbDtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKHN0b3BwZWQpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRvYyA9IGF3YWl0IGN1cnNvci5fbmV4dE9iamVjdFByb21pc2VXaXRoVGltZW91dCh0aW1lb3V0TVMpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIFdlIHNob3VsZCBub3QgaWdub3JlIGVycm9ycyBoZXJlIHVubGVzcyB3ZSB3YW50IHRvIHNwZW5kIGEgbG90IG9mIHRpbWUgZGVidWdnaW5nXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgLy8gVGhlcmUncyBubyBnb29kIHdheSB0byBmaWd1cmUgb3V0IGlmIHRoaXMgd2FzIGFjdHVhbGx5IGFuIGVycm9yIGZyb21cbiAgICAgICAgLy8gTW9uZ28sIG9yIGp1c3QgY2xpZW50LXNpZGUgKGluY2x1ZGluZyBvdXIgb3duIHRpbWVvdXQgZXJyb3IpLiBBaFxuICAgICAgICAvLyB3ZWxsLiBCdXQgZWl0aGVyIHdheSwgd2UgbmVlZCB0byByZXRyeSB0aGUgY3Vyc29yICh1bmxlc3MgdGhlIGZhaWx1cmVcbiAgICAgICAgLy8gd2FzIGJlY2F1c2UgdGhlIG9ic2VydmUgZ290IHN0b3BwZWQpLlxuICAgICAgICBkb2MgPSBudWxsO1xuICAgICAgfVxuICAgICAgLy8gU2luY2Ugd2UgYXdhaXRlZCBhIHByb21pc2UgYWJvdmUsIHdlIG5lZWQgdG8gY2hlY2sgYWdhaW4gdG8gc2VlIGlmXG4gICAgICAvLyB3ZSd2ZSBiZWVuIHN0b3BwZWQgYmVmb3JlIGNhbGxpbmcgdGhlIGNhbGxiYWNrLlxuICAgICAgaWYgKHN0b3BwZWQpXG4gICAgICAgIHJldHVybjtcbiAgICAgIGlmIChkb2MpIHtcbiAgICAgICAgLy8gSWYgYSB0YWlsYWJsZSBjdXJzb3IgY29udGFpbnMgYSBcInRzXCIgZmllbGQsIHVzZSBpdCB0byByZWNyZWF0ZSB0aGVcbiAgICAgICAgLy8gY3Vyc29yIG9uIGVycm9yLiAoXCJ0c1wiIGlzIGEgc3RhbmRhcmQgdGhhdCBNb25nbyB1c2VzIGludGVybmFsbHkgZm9yXG4gICAgICAgIC8vIHRoZSBvcGxvZywgYW5kIHRoZXJlJ3MgYSBzcGVjaWFsIGZsYWcgdGhhdCBsZXRzIHlvdSBkbyBiaW5hcnkgc2VhcmNoXG4gICAgICAgIC8vIG9uIGl0IGluc3RlYWQgb2YgbmVlZGluZyB0byB1c2UgYW4gaW5kZXguKVxuICAgICAgICBsYXN0VFMgPSBkb2MudHM7XG4gICAgICAgIGRvY0NhbGxiYWNrKGRvYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbmV3U2VsZWN0b3IgPSBPYmplY3QuYXNzaWduKHt9LCBjdXJzb3JEZXNjcmlwdGlvbi5zZWxlY3Rvcik7XG4gICAgICAgIGlmIChsYXN0VFMpIHtcbiAgICAgICAgICBuZXdTZWxlY3Rvci50cyA9IHskZ3Q6IGxhc3RUU307XG4gICAgICAgIH1cbiAgICAgICAgY3Vyc29yID0gc2VsZi5fY3JlYXRlQXN5bmNocm9ub3VzQ3Vyc29yKG5ldyBDdXJzb3JEZXNjcmlwdGlvbihcbiAgICAgICAgICBjdXJzb3JEZXNjcmlwdGlvbi5jb2xsZWN0aW9uTmFtZSxcbiAgICAgICAgICBuZXdTZWxlY3RvcixcbiAgICAgICAgICBjdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zKSk7XG4gICAgICAgIC8vIE1vbmdvIGZhaWxvdmVyIHRha2VzIG1hbnkgc2Vjb25kcy4gIFJldHJ5IGluIGEgYml0LiAgKFdpdGhvdXQgdGhpc1xuICAgICAgICAvLyBzZXRUaW1lb3V0LCB3ZSBwZWcgdGhlIENQVSBhdCAxMDAlIGFuZCBuZXZlciBub3RpY2UgdGhlIGFjdHVhbFxuICAgICAgICAvLyBmYWlsb3Zlci5cbiAgICAgICAgc2V0VGltZW91dChsb29wLCAxMDApO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgc3RvcHBlZCA9IHRydWU7XG4gICAgICBjdXJzb3IuY2xvc2UoKTtcbiAgICB9XG4gIH07XG59O1xuXG5PYmplY3QuYXNzaWduKE1vbmdvQ29ubmVjdGlvbi5wcm90b3R5cGUsIHtcbiAgX29ic2VydmVDaGFuZ2VzOiBhc3luYyBmdW5jdGlvbiAoXG4gICAgY3Vyc29yRGVzY3JpcHRpb24sIG9yZGVyZWQsIGNhbGxiYWNrcywgbm9uTXV0YXRpbmdDYWxsYmFja3MpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSBjdXJzb3JEZXNjcmlwdGlvbi5jb2xsZWN0aW9uTmFtZTtcblxuICAgIGlmIChjdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zLnRhaWxhYmxlKSB7XG4gICAgICByZXR1cm4gc2VsZi5fb2JzZXJ2ZUNoYW5nZXNUYWlsYWJsZShjdXJzb3JEZXNjcmlwdGlvbiwgb3JkZXJlZCwgY2FsbGJhY2tzKTtcbiAgICB9XG5cbiAgICAvLyBZb3UgbWF5IG5vdCBmaWx0ZXIgb3V0IF9pZCB3aGVuIG9ic2VydmluZyBjaGFuZ2VzLCBiZWNhdXNlIHRoZSBpZCBpcyBhIGNvcmVcbiAgICAvLyBwYXJ0IG9mIHRoZSBvYnNlcnZlQ2hhbmdlcyBBUEkuXG4gICAgY29uc3QgZmllbGRzT3B0aW9ucyA9IGN1cnNvckRlc2NyaXB0aW9uLm9wdGlvbnMucHJvamVjdGlvbiB8fCBjdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zLmZpZWxkcztcbiAgICBpZiAoZmllbGRzT3B0aW9ucyAmJlxuICAgICAgKGZpZWxkc09wdGlvbnMuX2lkID09PSAwIHx8XG4gICAgICAgIGZpZWxkc09wdGlvbnMuX2lkID09PSBmYWxzZSkpIHtcbiAgICAgIHRocm93IEVycm9yKFwiWW91IG1heSBub3Qgb2JzZXJ2ZSBhIGN1cnNvciB3aXRoIHtmaWVsZHM6IHtfaWQ6IDB9fVwiKTtcbiAgICB9XG5cbiAgICB2YXIgb2JzZXJ2ZUtleSA9IEVKU09OLnN0cmluZ2lmeShcbiAgICAgIE9iamVjdC5hc3NpZ24oe29yZGVyZWQ6IG9yZGVyZWR9LCBjdXJzb3JEZXNjcmlwdGlvbikpO1xuXG4gICAgdmFyIG11bHRpcGxleGVyLCBvYnNlcnZlRHJpdmVyO1xuICAgIHZhciBmaXJzdEhhbmRsZSA9IGZhbHNlO1xuXG4gICAgLy8gRmluZCBhIG1hdGNoaW5nIE9ic2VydmVNdWx0aXBsZXhlciwgb3IgY3JlYXRlIGEgbmV3IG9uZS4gVGhpcyBuZXh0IGJsb2NrIGlzXG4gICAgLy8gZ3VhcmFudGVlZCB0byBub3QgeWllbGQgKGFuZCBpdCBkb2Vzbid0IGNhbGwgYW55dGhpbmcgdGhhdCBjYW4gb2JzZXJ2ZSBhXG4gICAgLy8gbmV3IHF1ZXJ5KSwgc28gbm8gb3RoZXIgY2FsbHMgdG8gdGhpcyBmdW5jdGlvbiBjYW4gaW50ZXJsZWF2ZSB3aXRoIGl0LlxuICAgIGlmIChvYnNlcnZlS2V5IGluIHNlbGYuX29ic2VydmVNdWx0aXBsZXhlcnMpIHtcbiAgICAgIG11bHRpcGxleGVyID0gc2VsZi5fb2JzZXJ2ZU11bHRpcGxleGVyc1tvYnNlcnZlS2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmlyc3RIYW5kbGUgPSB0cnVlO1xuICAgICAgLy8gQ3JlYXRlIGEgbmV3IE9ic2VydmVNdWx0aXBsZXhlci5cbiAgICAgIG11bHRpcGxleGVyID0gbmV3IE9ic2VydmVNdWx0aXBsZXhlcih7XG4gICAgICAgIG9yZGVyZWQ6IG9yZGVyZWQsXG4gICAgICAgIG9uU3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGRlbGV0ZSBzZWxmLl9vYnNlcnZlTXVsdGlwbGV4ZXJzW29ic2VydmVLZXldO1xuICAgICAgICAgIHJldHVybiBvYnNlcnZlRHJpdmVyLnN0b3AoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIG9ic2VydmVIYW5kbGUgPSBuZXcgT2JzZXJ2ZUhhbmRsZShtdWx0aXBsZXhlcixcbiAgICAgIGNhbGxiYWNrcyxcbiAgICAgIG5vbk11dGF0aW5nQ2FsbGJhY2tzLFxuICAgICk7XG5cbiAgICBjb25zdCBvcGxvZ09wdGlvbnMgPSBzZWxmPy5fb3Bsb2dIYW5kbGU/Ll9vcGxvZ09wdGlvbnMgfHwge307XG4gICAgY29uc3QgeyBpbmNsdWRlQ29sbGVjdGlvbnMsIGV4Y2x1ZGVDb2xsZWN0aW9ucyB9ID0gb3Bsb2dPcHRpb25zO1xuICAgIGlmIChmaXJzdEhhbmRsZSkge1xuXG4gICAgICB2YXIgbWF0Y2hlciwgc29ydGVyO1xuICAgICAgdmFyIGNhblVzZU9wbG9nID0gW1xuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy8gQXQgYSBiYXJlIG1pbmltdW0sIHVzaW5nIHRoZSBvcGxvZyByZXF1aXJlcyB1cyB0byBoYXZlIGFuIG9wbG9nLCB0b1xuICAgICAgICAgIC8vIHdhbnQgdW5vcmRlcmVkIGNhbGxiYWNrcywgYW5kIHRvIG5vdCB3YW50IGEgY2FsbGJhY2sgb24gdGhlIHBvbGxzXG4gICAgICAgICAgLy8gdGhhdCB3b24ndCBoYXBwZW4uXG4gICAgICAgICAgcmV0dXJuIHNlbGYuX29wbG9nSGFuZGxlICYmICFvcmRlcmVkICYmXG4gICAgICAgICAgICAhY2FsbGJhY2tzLl90ZXN0T25seVBvbGxDYWxsYmFjaztcbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIC8vIFdlIGFsc28gbmVlZCB0byBjaGVjaywgaWYgdGhlIGNvbGxlY3Rpb24gb2YgdGhpcyBDdXJzb3IgaXMgYWN0dWFsbHkgYmVpbmcgXCJ3YXRjaGVkXCIgYnkgdGhlIE9wbG9nIGhhbmRsZVxuICAgICAgICAgIC8vIGlmIG5vdCwgd2UgaGF2ZSB0byBmYWxsYmFjayB0byBsb25nIHBvbGxpbmdcbiAgICAgICAgICBpZiAoZXhjbHVkZUNvbGxlY3Rpb25zPy5sZW5ndGggJiYgZXhjbHVkZUNvbGxlY3Rpb25zLmluY2x1ZGVzKGNvbGxlY3Rpb25OYW1lKSkge1xuICAgICAgICAgICAgaWYgKCFvcGxvZ0NvbGxlY3Rpb25XYXJuaW5ncy5pbmNsdWRlcyhjb2xsZWN0aW9uTmFtZSkpIHtcbiAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBNZXRlb3Iuc2V0dGluZ3MucGFja2FnZXMubW9uZ28ub3Bsb2dFeGNsdWRlQ29sbGVjdGlvbnMgaW5jbHVkZXMgdGhlIGNvbGxlY3Rpb24gJHtjb2xsZWN0aW9uTmFtZX0gLSB5b3VyIHN1YnNjcmlwdGlvbnMgd2lsbCBvbmx5IHVzZSBsb25nIHBvbGxpbmchYCk7XG4gICAgICAgICAgICAgIG9wbG9nQ29sbGVjdGlvbldhcm5pbmdzLnB1c2goY29sbGVjdGlvbk5hbWUpOyAvLyB3ZSBvbmx5IHdhbnQgdG8gc2hvdyB0aGUgd2FybmluZ3Mgb25jZSBwZXIgY29sbGVjdGlvbiFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGluY2x1ZGVDb2xsZWN0aW9ucz8ubGVuZ3RoICYmICFpbmNsdWRlQ29sbGVjdGlvbnMuaW5jbHVkZXMoY29sbGVjdGlvbk5hbWUpKSB7XG4gICAgICAgICAgICBpZiAoIW9wbG9nQ29sbGVjdGlvbldhcm5pbmdzLmluY2x1ZGVzKGNvbGxlY3Rpb25OYW1lKSkge1xuICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYE1ldGVvci5zZXR0aW5ncy5wYWNrYWdlcy5tb25nby5vcGxvZ0luY2x1ZGVDb2xsZWN0aW9ucyBkb2VzIG5vdCBpbmNsdWRlIHRoZSBjb2xsZWN0aW9uICR7Y29sbGVjdGlvbk5hbWV9IC0geW91ciBzdWJzY3JpcHRpb25zIHdpbGwgb25seSB1c2UgbG9uZyBwb2xsaW5nIWApO1xuICAgICAgICAgICAgICBvcGxvZ0NvbGxlY3Rpb25XYXJuaW5ncy5wdXNoKGNvbGxlY3Rpb25OYW1lKTsgLy8gd2Ugb25seSB3YW50IHRvIHNob3cgdGhlIHdhcm5pbmdzIG9uY2UgcGVyIGNvbGxlY3Rpb24hXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy8gV2UgbmVlZCB0byBiZSBhYmxlIHRvIGNvbXBpbGUgdGhlIHNlbGVjdG9yLiBGYWxsIGJhY2sgdG8gcG9sbGluZyBmb3JcbiAgICAgICAgICAvLyBzb21lIG5ld2ZhbmdsZWQgJHNlbGVjdG9yIHRoYXQgbWluaW1vbmdvIGRvZXNuJ3Qgc3VwcG9ydCB5ZXQuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG1hdGNoZXIgPSBuZXcgTWluaW1vbmdvLk1hdGNoZXIoY3Vyc29yRGVzY3JpcHRpb24uc2VsZWN0b3IpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gWFhYIG1ha2UgYWxsIGNvbXBpbGF0aW9uIGVycm9ycyBNaW5pbW9uZ29FcnJvciBvciBzb21ldGhpbmdcbiAgICAgICAgICAgIC8vICAgICBzbyB0aGF0IHRoaXMgZG9lc24ndCBpZ25vcmUgdW5yZWxhdGVkIGV4Y2VwdGlvbnNcbiAgICAgICAgICAgIGlmIChNZXRlb3IuaXNDbGllbnQgJiYgZSBpbnN0YW5jZW9mIE1pbmlNb25nb1F1ZXJ5RXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvLyAuLi4gYW5kIHRoZSBzZWxlY3RvciBpdHNlbGYgbmVlZHMgdG8gc3VwcG9ydCBvcGxvZy5cbiAgICAgICAgICByZXR1cm4gT3Bsb2dPYnNlcnZlRHJpdmVyLmN1cnNvclN1cHBvcnRlZChjdXJzb3JEZXNjcmlwdGlvbiwgbWF0Y2hlcik7XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvLyBBbmQgd2UgbmVlZCB0byBiZSBhYmxlIHRvIGNvbXBpbGUgdGhlIHNvcnQsIGlmIGFueS4gIGVnLCBjYW4ndCBiZVxuICAgICAgICAgIC8vIHskbmF0dXJhbDogMX0uXG4gICAgICAgICAgaWYgKCFjdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zLnNvcnQpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgc29ydGVyID0gbmV3IE1pbmltb25nby5Tb3J0ZXIoY3Vyc29yRGVzY3JpcHRpb24ub3B0aW9ucy5zb3J0KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIFhYWCBtYWtlIGFsbCBjb21waWxhdGlvbiBlcnJvcnMgTWluaW1vbmdvRXJyb3Igb3Igc29tZXRoaW5nXG4gICAgICAgICAgICAvLyAgICAgc28gdGhhdCB0aGlzIGRvZXNuJ3QgaWdub3JlIHVucmVsYXRlZCBleGNlcHRpb25zXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBdLmV2ZXJ5KGYgPT4gZigpKTsgIC8vIGludm9rZSBlYWNoIGZ1bmN0aW9uIGFuZCBjaGVjayBpZiBhbGwgcmV0dXJuIHRydWVcblxuICAgICAgdmFyIGRyaXZlckNsYXNzID0gY2FuVXNlT3Bsb2cgPyBPcGxvZ09ic2VydmVEcml2ZXIgOiBQb2xsaW5nT2JzZXJ2ZURyaXZlcjtcbiAgICAgIG9ic2VydmVEcml2ZXIgPSBuZXcgZHJpdmVyQ2xhc3Moe1xuICAgICAgICBjdXJzb3JEZXNjcmlwdGlvbjogY3Vyc29yRGVzY3JpcHRpb24sXG4gICAgICAgIG1vbmdvSGFuZGxlOiBzZWxmLFxuICAgICAgICBtdWx0aXBsZXhlcjogbXVsdGlwbGV4ZXIsXG4gICAgICAgIG9yZGVyZWQ6IG9yZGVyZWQsXG4gICAgICAgIG1hdGNoZXI6IG1hdGNoZXIsICAvLyBpZ25vcmVkIGJ5IHBvbGxpbmdcbiAgICAgICAgc29ydGVyOiBzb3J0ZXIsICAvLyBpZ25vcmVkIGJ5IHBvbGxpbmdcbiAgICAgICAgX3Rlc3RPbmx5UG9sbENhbGxiYWNrOiBjYWxsYmFja3MuX3Rlc3RPbmx5UG9sbENhbGxiYWNrXG4gICAgICB9KTtcblxuICAgICAgaWYgKG9ic2VydmVEcml2ZXIuX2luaXQpIHtcbiAgICAgICAgYXdhaXQgb2JzZXJ2ZURyaXZlci5faW5pdCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGlzIGZpZWxkIGlzIG9ubHkgc2V0IGZvciB1c2UgaW4gdGVzdHMuXG4gICAgICBtdWx0aXBsZXhlci5fb2JzZXJ2ZURyaXZlciA9IG9ic2VydmVEcml2ZXI7XG4gICAgfVxuICAgIHNlbGYuX29ic2VydmVNdWx0aXBsZXhlcnNbb2JzZXJ2ZUtleV0gPSBtdWx0aXBsZXhlcjtcbiAgICAvLyBCbG9ja3MgdW50aWwgdGhlIGluaXRpYWwgYWRkcyBoYXZlIGJlZW4gc2VudC5cbiAgICBhd2FpdCBtdWx0aXBsZXhlci5hZGRIYW5kbGVBbmRTZW5kSW5pdGlhbEFkZHMob2JzZXJ2ZUhhbmRsZSk7XG5cbiAgICByZXR1cm4gb2JzZXJ2ZUhhbmRsZTtcbiAgfSxcblxufSk7XG4iLCJpbXBvcnQgY2xvbmUgZnJvbSAnbG9kYXNoLmNsb25lJ1xuXG4vKiogQHR5cGUge2ltcG9ydCgnbW9uZ29kYicpfSAqL1xuZXhwb3J0IGNvbnN0IE1vbmdvREIgPSBPYmplY3QuYXNzaWduKE5wbU1vZHVsZU1vbmdvZGIsIHtcbiAgT2JqZWN0SUQ6IE5wbU1vZHVsZU1vbmdvZGIuT2JqZWN0SWQsXG59KTtcblxuLy8gVGhlIHdyaXRlIG1ldGhvZHMgYmxvY2sgdW50aWwgdGhlIGRhdGFiYXNlIGhhcyBjb25maXJtZWQgdGhlIHdyaXRlIChpdCBtYXlcbi8vIG5vdCBiZSByZXBsaWNhdGVkIG9yIHN0YWJsZSBvbiBkaXNrLCBidXQgb25lIHNlcnZlciBoYXMgY29uZmlybWVkIGl0KSBpZiBub1xuLy8gY2FsbGJhY2sgaXMgcHJvdmlkZWQuIElmIGEgY2FsbGJhY2sgaXMgcHJvdmlkZWQsIHRoZW4gdGhleSBjYWxsIHRoZSBjYWxsYmFja1xuLy8gd2hlbiB0aGUgd3JpdGUgaXMgY29uZmlybWVkLiBUaGV5IHJldHVybiBub3RoaW5nIG9uIHN1Y2Nlc3MsIGFuZCByYWlzZSBhblxuLy8gZXhjZXB0aW9uIG9uIGZhaWx1cmUuXG4vL1xuLy8gQWZ0ZXIgbWFraW5nIGEgd3JpdGUgKHdpdGggaW5zZXJ0LCB1cGRhdGUsIHJlbW92ZSksIG9ic2VydmVycyBhcmVcbi8vIG5vdGlmaWVkIGFzeW5jaHJvbm91c2x5LiBJZiB5b3Ugd2FudCB0byByZWNlaXZlIGEgY2FsbGJhY2sgb25jZSBhbGxcbi8vIG9mIHRoZSBvYnNlcnZlciBub3RpZmljYXRpb25zIGhhdmUgbGFuZGVkIGZvciB5b3VyIHdyaXRlLCBkbyB0aGVcbi8vIHdyaXRlcyBpbnNpZGUgYSB3cml0ZSBmZW5jZSAoc2V0IEREUFNlcnZlci5fQ3VycmVudFdyaXRlRmVuY2UgdG8gYSBuZXdcbi8vIF9Xcml0ZUZlbmNlLCBhbmQgdGhlbiBzZXQgYSBjYWxsYmFjayBvbiB0aGUgd3JpdGUgZmVuY2UuKVxuLy9cbi8vIFNpbmNlIG91ciBleGVjdXRpb24gZW52aXJvbm1lbnQgaXMgc2luZ2xlLXRocmVhZGVkLCB0aGlzIGlzXG4vLyB3ZWxsLWRlZmluZWQgLS0gYSB3cml0ZSBcImhhcyBiZWVuIG1hZGVcIiBpZiBpdCdzIHJldHVybmVkLCBhbmQgYW5cbi8vIG9ic2VydmVyIFwiaGFzIGJlZW4gbm90aWZpZWRcIiBpZiBpdHMgY2FsbGJhY2sgaGFzIHJldHVybmVkLlxuXG5leHBvcnQgY29uc3Qgd3JpdGVDYWxsYmFjayA9IGZ1bmN0aW9uICh3cml0ZSwgcmVmcmVzaCwgY2FsbGJhY2spIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChlcnIsIHJlc3VsdCkge1xuICAgIGlmICghIGVycikge1xuICAgICAgLy8gWFhYIFdlIGRvbid0IGhhdmUgdG8gcnVuIHRoaXMgb24gZXJyb3IsIHJpZ2h0P1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVmcmVzaCgpO1xuICAgICAgfSBjYXRjaCAocmVmcmVzaEVycikge1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICBjYWxsYmFjayhyZWZyZXNoRXJyKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgcmVmcmVzaEVycjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB3cml0ZS5jb21taXR0ZWQoKTtcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0KTtcbiAgICB9IGVsc2UgaWYgKGVycikge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfTtcbn07XG5cblxuZXhwb3J0IGNvbnN0IHRyYW5zZm9ybVJlc3VsdCA9IGZ1bmN0aW9uIChkcml2ZXJSZXN1bHQpIHtcbiAgdmFyIG1ldGVvclJlc3VsdCA9IHsgbnVtYmVyQWZmZWN0ZWQ6IDAgfTtcbiAgaWYgKGRyaXZlclJlc3VsdCkge1xuICAgIHZhciBtb25nb1Jlc3VsdCA9IGRyaXZlclJlc3VsdC5yZXN1bHQ7XG4gICAgLy8gT24gdXBkYXRlcyB3aXRoIHVwc2VydDp0cnVlLCB0aGUgaW5zZXJ0ZWQgdmFsdWVzIGNvbWUgYXMgYSBsaXN0IG9mXG4gICAgLy8gdXBzZXJ0ZWQgdmFsdWVzIC0tIGV2ZW4gd2l0aCBvcHRpb25zLm11bHRpLCB3aGVuIHRoZSB1cHNlcnQgZG9lcyBpbnNlcnQsXG4gICAgLy8gaXQgb25seSBpbnNlcnRzIG9uZSBlbGVtZW50LlxuICAgIGlmIChtb25nb1Jlc3VsdC51cHNlcnRlZENvdW50KSB7XG4gICAgICBtZXRlb3JSZXN1bHQubnVtYmVyQWZmZWN0ZWQgPSBtb25nb1Jlc3VsdC51cHNlcnRlZENvdW50O1xuXG4gICAgICBpZiAobW9uZ29SZXN1bHQudXBzZXJ0ZWRJZCkge1xuICAgICAgICBtZXRlb3JSZXN1bHQuaW5zZXJ0ZWRJZCA9IG1vbmdvUmVzdWx0LnVwc2VydGVkSWQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG4gd2FzIHVzZWQgYmVmb3JlIE1vbmdvIDUuMCwgaW4gTW9uZ28gNS4wIHdlIGFyZSBub3QgcmVjZWl2aW5nIHRoaXMgblxuICAgICAgLy8gZmllbGQgYW5kIHNvIHdlIGFyZSB1c2luZyBtb2RpZmllZENvdW50IGluc3RlYWRcbiAgICAgIG1ldGVvclJlc3VsdC5udW1iZXJBZmZlY3RlZCA9IG1vbmdvUmVzdWx0Lm4gfHwgbW9uZ29SZXN1bHQubWF0Y2hlZENvdW50IHx8IG1vbmdvUmVzdWx0Lm1vZGlmaWVkQ291bnQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1ldGVvclJlc3VsdDtcbn07XG5cbmV4cG9ydCBjb25zdCByZXBsYWNlTWV0ZW9yQXRvbVdpdGhNb25nbyA9IGZ1bmN0aW9uIChkb2N1bWVudCkge1xuICBpZiAoRUpTT04uaXNCaW5hcnkoZG9jdW1lbnQpKSB7XG4gICAgLy8gVGhpcyBkb2VzIG1vcmUgY29waWVzIHRoYW4gd2UnZCBsaWtlLCBidXQgaXMgbmVjZXNzYXJ5IGJlY2F1c2VcbiAgICAvLyBNb25nb0RCLkJTT04gb25seSBsb29rcyBsaWtlIGl0IHRha2VzIGEgVWludDhBcnJheSAoYW5kIGRvZXNuJ3QgYWN0dWFsbHlcbiAgICAvLyBzZXJpYWxpemUgaXQgY29ycmVjdGx5KS5cbiAgICByZXR1cm4gbmV3IE1vbmdvREIuQmluYXJ5KEJ1ZmZlci5mcm9tKGRvY3VtZW50KSk7XG4gIH1cbiAgaWYgKGRvY3VtZW50IGluc3RhbmNlb2YgTW9uZ29EQi5CaW5hcnkpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQ7XG4gIH1cbiAgaWYgKGRvY3VtZW50IGluc3RhbmNlb2YgTW9uZ28uT2JqZWN0SUQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmdvREIuT2JqZWN0SWQoZG9jdW1lbnQudG9IZXhTdHJpbmcoKSk7XG4gIH1cbiAgaWYgKGRvY3VtZW50IGluc3RhbmNlb2YgTW9uZ29EQi5PYmplY3RJZCkge1xuICAgIHJldHVybiBuZXcgTW9uZ29EQi5PYmplY3RJZChkb2N1bWVudC50b0hleFN0cmluZygpKTtcbiAgfVxuICBpZiAoZG9jdW1lbnQgaW5zdGFuY2VvZiBNb25nb0RCLlRpbWVzdGFtcCkge1xuICAgIC8vIEZvciBub3csIHRoZSBNZXRlb3IgcmVwcmVzZW50YXRpb24gb2YgYSBNb25nbyB0aW1lc3RhbXAgdHlwZSAobm90IGEgZGF0ZSFcbiAgICAvLyB0aGlzIGlzIGEgd2VpcmQgaW50ZXJuYWwgdGhpbmcgdXNlZCBpbiB0aGUgb3Bsb2chKSBpcyB0aGUgc2FtZSBhcyB0aGVcbiAgICAvLyBNb25nbyByZXByZXNlbnRhdGlvbi4gV2UgbmVlZCB0byBkbyB0aGlzIGV4cGxpY2l0bHkgb3IgZWxzZSB3ZSB3b3VsZCBkbyBhXG4gICAgLy8gc3RydWN0dXJhbCBjbG9uZSBhbmQgbG9zZSB0aGUgcHJvdG90eXBlLlxuICAgIHJldHVybiBkb2N1bWVudDtcbiAgfVxuICBpZiAoZG9jdW1lbnQgaW5zdGFuY2VvZiBEZWNpbWFsKSB7XG4gICAgcmV0dXJuIE1vbmdvREIuRGVjaW1hbDEyOC5mcm9tU3RyaW5nKGRvY3VtZW50LnRvU3RyaW5nKCkpO1xuICB9XG4gIGlmIChFSlNPTi5faXNDdXN0b21UeXBlKGRvY3VtZW50KSkge1xuICAgIHJldHVybiByZXBsYWNlTmFtZXMobWFrZU1vbmdvTGVnYWwsIEVKU09OLnRvSlNPTlZhbHVlKGRvY3VtZW50KSk7XG4gIH1cbiAgLy8gSXQgaXMgbm90IG9yZGluYXJpbHkgcG9zc2libGUgdG8gc3RpY2sgZG9sbGFyLXNpZ24ga2V5cyBpbnRvIG1vbmdvXG4gIC8vIHNvIHdlIGRvbid0IGJvdGhlciBjaGVja2luZyBmb3IgdGhpbmdzIHRoYXQgbmVlZCBlc2NhcGluZyBhdCB0aGlzIHRpbWUuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59O1xuXG5leHBvcnQgY29uc3QgcmVwbGFjZVR5cGVzID0gZnVuY3Rpb24gKGRvY3VtZW50LCBhdG9tVHJhbnNmb3JtZXIpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ29iamVjdCcgfHwgZG9jdW1lbnQgPT09IG51bGwpXG4gICAgcmV0dXJuIGRvY3VtZW50O1xuXG4gIHZhciByZXBsYWNlZFRvcExldmVsQXRvbSA9IGF0b21UcmFuc2Zvcm1lcihkb2N1bWVudCk7XG4gIGlmIChyZXBsYWNlZFRvcExldmVsQXRvbSAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiByZXBsYWNlZFRvcExldmVsQXRvbTtcblxuICB2YXIgcmV0ID0gZG9jdW1lbnQ7XG4gIE9iamVjdC5lbnRyaWVzKGRvY3VtZW50KS5mb3JFYWNoKGZ1bmN0aW9uIChba2V5LCB2YWxdKSB7XG4gICAgdmFyIHZhbFJlcGxhY2VkID0gcmVwbGFjZVR5cGVzKHZhbCwgYXRvbVRyYW5zZm9ybWVyKTtcbiAgICBpZiAodmFsICE9PSB2YWxSZXBsYWNlZCkge1xuICAgICAgLy8gTGF6eSBjbG9uZS4gU2hhbGxvdyBjb3B5LlxuICAgICAgaWYgKHJldCA9PT0gZG9jdW1lbnQpXG4gICAgICAgIHJldCA9IGNsb25lKGRvY3VtZW50KTtcbiAgICAgIHJldFtrZXldID0gdmFsUmVwbGFjZWQ7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmV4cG9ydCBjb25zdCByZXBsYWNlTW9uZ29BdG9tV2l0aE1ldGVvciA9IGZ1bmN0aW9uIChkb2N1bWVudCkge1xuICBpZiAoZG9jdW1lbnQgaW5zdGFuY2VvZiBNb25nb0RCLkJpbmFyeSkge1xuICAgIC8vIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgIGlmIChkb2N1bWVudC5zdWJfdHlwZSAhPT0gMCkge1xuICAgICAgcmV0dXJuIGRvY3VtZW50O1xuICAgIH1cbiAgICB2YXIgYnVmZmVyID0gZG9jdW1lbnQudmFsdWUodHJ1ZSk7XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gIH1cbiAgaWYgKGRvY3VtZW50IGluc3RhbmNlb2YgTW9uZ29EQi5PYmplY3RJZCkge1xuICAgIHJldHVybiBuZXcgTW9uZ28uT2JqZWN0SUQoZG9jdW1lbnQudG9IZXhTdHJpbmcoKSk7XG4gIH1cbiAgaWYgKGRvY3VtZW50IGluc3RhbmNlb2YgTW9uZ29EQi5EZWNpbWFsMTI4KSB7XG4gICAgcmV0dXJuIERlY2ltYWwoZG9jdW1lbnQudG9TdHJpbmcoKSk7XG4gIH1cbiAgaWYgKGRvY3VtZW50W1wiRUpTT04kdHlwZVwiXSAmJiBkb2N1bWVudFtcIkVKU09OJHZhbHVlXCJdICYmIE9iamVjdC5rZXlzKGRvY3VtZW50KS5sZW5ndGggPT09IDIpIHtcbiAgICByZXR1cm4gRUpTT04uZnJvbUpTT05WYWx1ZShyZXBsYWNlTmFtZXModW5tYWtlTW9uZ29MZWdhbCwgZG9jdW1lbnQpKTtcbiAgfVxuICBpZiAoZG9jdW1lbnQgaW5zdGFuY2VvZiBNb25nb0RCLlRpbWVzdGFtcCkge1xuICAgIC8vIEZvciBub3csIHRoZSBNZXRlb3IgcmVwcmVzZW50YXRpb24gb2YgYSBNb25nbyB0aW1lc3RhbXAgdHlwZSAobm90IGEgZGF0ZSFcbiAgICAvLyB0aGlzIGlzIGEgd2VpcmQgaW50ZXJuYWwgdGhpbmcgdXNlZCBpbiB0aGUgb3Bsb2chKSBpcyB0aGUgc2FtZSBhcyB0aGVcbiAgICAvLyBNb25nbyByZXByZXNlbnRhdGlvbi4gV2UgbmVlZCB0byBkbyB0aGlzIGV4cGxpY2l0bHkgb3IgZWxzZSB3ZSB3b3VsZCBkbyBhXG4gICAgLy8gc3RydWN0dXJhbCBjbG9uZSBhbmQgbG9zZSB0aGUgcHJvdG90eXBlLlxuICAgIHJldHVybiBkb2N1bWVudDtcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufTtcblxuY29uc3QgbWFrZU1vbmdvTGVnYWwgPSBuYW1lID0+IFwiRUpTT05cIiArIG5hbWU7XG5jb25zdCB1bm1ha2VNb25nb0xlZ2FsID0gbmFtZSA9PiBuYW1lLnN1YnN0cig1KTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VOYW1lcyhmaWx0ZXIsIHRoaW5nKSB7XG4gIGlmICh0eXBlb2YgdGhpbmcgPT09IFwib2JqZWN0XCIgJiYgdGhpbmcgIT09IG51bGwpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGluZykpIHtcbiAgICAgIHJldHVybiB0aGluZy5tYXAocmVwbGFjZU5hbWVzLmJpbmQobnVsbCwgZmlsdGVyKSk7XG4gICAgfVxuICAgIHZhciByZXQgPSB7fTtcbiAgICBPYmplY3QuZW50cmllcyh0aGluZykuZm9yRWFjaChmdW5jdGlvbiAoW2tleSwgdmFsdWVdKSB7XG4gICAgICByZXRbZmlsdGVyKGtleSldID0gcmVwbGFjZU5hbWVzKGZpbHRlciwgdmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXQ7XG4gIH1cbiAgcmV0dXJuIHRoaW5nO1xufVxuIiwiaW1wb3J0IExvY2FsQ29sbGVjdGlvbiBmcm9tICdtZXRlb3IvbWluaW1vbmdvL2xvY2FsX2NvbGxlY3Rpb24nO1xuaW1wb3J0IHsgcmVwbGFjZU1vbmdvQXRvbVdpdGhNZXRlb3IsIHJlcGxhY2VUeXBlcyB9IGZyb20gJy4vbW9uZ29fY29tbW9uJztcblxuLyoqXG4gKiBUaGlzIGlzIGp1c3QgYSBsaWdodCB3cmFwcGVyIGZvciB0aGUgY3Vyc29yLiBUaGUgZ29hbCBoZXJlIGlzIHRvIGVuc3VyZSBjb21wYXRpYmlsaXR5IGV2ZW4gaWZcbiAqIHRoZXJlIGFyZSBicmVha2luZyBjaGFuZ2VzIG9uIHRoZSBNb25nb0RCIGRyaXZlci5cbiAqXG4gKiBUaGlzIGlzIGFuIGludGVybmFsIGltcGxlbWVudGF0aW9uIGRldGFpbCBhbmQgaXMgY3JlYXRlZCBsYXppbHkgYnkgdGhlIG1haW4gQ3Vyc29yIGNsYXNzLlxuICovXG5leHBvcnQgY2xhc3MgQXN5bmNocm9ub3VzQ3Vyc29yIHtcbiAgX2Nsb3NpbmcgPSBmYWxzZTtcbiAgX3BlbmRpbmdOZXh0ID0gbnVsbDtcbiAgY29uc3RydWN0b3IoZGJDdXJzb3IsIGN1cnNvckRlc2NyaXB0aW9uLCBvcHRpb25zKSB7XG4gICAgdGhpcy5fZGJDdXJzb3IgPSBkYkN1cnNvcjtcbiAgICB0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbiA9IGN1cnNvckRlc2NyaXB0aW9uO1xuXG4gICAgdGhpcy5fc2VsZkZvckl0ZXJhdGlvbiA9IG9wdGlvbnMuc2VsZkZvckl0ZXJhdGlvbiB8fCB0aGlzO1xuICAgIGlmIChvcHRpb25zLnVzZVRyYW5zZm9ybSAmJiBjdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zLnRyYW5zZm9ybSkge1xuICAgICAgdGhpcy5fdHJhbnNmb3JtID0gTG9jYWxDb2xsZWN0aW9uLndyYXBUcmFuc2Zvcm0oXG4gICAgICAgIGN1cnNvckRlc2NyaXB0aW9uLm9wdGlvbnMudHJhbnNmb3JtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdHJhbnNmb3JtID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl92aXNpdGVkSWRzID0gbmV3IExvY2FsQ29sbGVjdGlvbi5fSWRNYXA7XG4gIH1cblxuICBbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCkge1xuICAgIHZhciBjdXJzb3IgPSB0aGlzO1xuICAgIHJldHVybiB7XG4gICAgICBhc3luYyBuZXh0KCkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IGN1cnNvci5fbmV4dE9iamVjdFByb21pc2UoKTtcbiAgICAgICAgcmV0dXJuIHsgZG9uZTogIXZhbHVlLCB2YWx1ZSB9O1xuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLy8gUmV0dXJucyBhIFByb21pc2UgZm9yIHRoZSBuZXh0IG9iamVjdCBmcm9tIHRoZSB1bmRlcmx5aW5nIGN1cnNvciAoYmVmb3JlXG4gIC8vIHRoZSBNb25nby0+TWV0ZW9yIHR5cGUgcmVwbGFjZW1lbnQpLlxuICBhc3luYyBfcmF3TmV4dE9iamVjdFByb21pc2UoKSB7XG4gICAgaWYgKHRoaXMuX2Nsb3NpbmcpIHtcbiAgICAgIC8vIFByZXZlbnQgbmV4dCgpIGFmdGVyIGNsb3NlIGlzIGNhbGxlZFxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICB0aGlzLl9wZW5kaW5nTmV4dCA9IHRoaXMuX2RiQ3Vyc29yLm5leHQoKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuX3BlbmRpbmdOZXh0O1xuICAgICAgdGhpcy5fcGVuZGluZ05leHQgPSBudWxsO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLl9wZW5kaW5nTmV4dCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJucyBhIFByb21pc2UgZm9yIHRoZSBuZXh0IG9iamVjdCBmcm9tIHRoZSBjdXJzb3IsIHNraXBwaW5nIHRob3NlIHdob3NlXG4gIC8vIElEcyB3ZSd2ZSBhbHJlYWR5IHNlZW4gYW5kIHJlcGxhY2luZyBNb25nbyBhdG9tcyB3aXRoIE1ldGVvciBhdG9tcy5cbiAgYXN5bmMgX25leHRPYmplY3RQcm9taXNlICgpIHtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgdmFyIGRvYyA9IGF3YWl0IHRoaXMuX3Jhd05leHRPYmplY3RQcm9taXNlKCk7XG5cbiAgICAgIGlmICghZG9jKSByZXR1cm4gbnVsbDtcbiAgICAgIGRvYyA9IHJlcGxhY2VUeXBlcyhkb2MsIHJlcGxhY2VNb25nb0F0b21XaXRoTWV0ZW9yKTtcblxuICAgICAgaWYgKCF0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zLnRhaWxhYmxlICYmICdfaWQnIGluIGRvYykge1xuICAgICAgICAvLyBEaWQgTW9uZ28gZ2l2ZSB1cyBkdXBsaWNhdGUgZG9jdW1lbnRzIGluIHRoZSBzYW1lIGN1cnNvcj8gSWYgc28sXG4gICAgICAgIC8vIGlnbm9yZSB0aGlzIG9uZS4gKERvIHRoaXMgYmVmb3JlIHRoZSB0cmFuc2Zvcm0sIHNpbmNlIHRyYW5zZm9ybSBtaWdodFxuICAgICAgICAvLyByZXR1cm4gc29tZSB1bnJlbGF0ZWQgdmFsdWUuKSBXZSBkb24ndCBkbyB0aGlzIGZvciB0YWlsYWJsZSBjdXJzb3JzLFxuICAgICAgICAvLyBiZWNhdXNlIHdlIHdhbnQgdG8gbWFpbnRhaW4gTygxKSBtZW1vcnkgdXNhZ2UuIEFuZCBpZiB0aGVyZSBpc24ndCBfaWRcbiAgICAgICAgLy8gZm9yIHNvbWUgcmVhc29uIChtYXliZSBpdCdzIHRoZSBvcGxvZyksIHRoZW4gd2UgZG9uJ3QgZG8gdGhpcyBlaXRoZXIuXG4gICAgICAgIC8vIChCZSBjYXJlZnVsIHRvIGRvIHRoaXMgZm9yIGZhbHNleSBidXQgZXhpc3RpbmcgX2lkLCB0aG91Z2guKVxuICAgICAgICBpZiAodGhpcy5fdmlzaXRlZElkcy5oYXMoZG9jLl9pZCkpIGNvbnRpbnVlO1xuICAgICAgICB0aGlzLl92aXNpdGVkSWRzLnNldChkb2MuX2lkLCB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX3RyYW5zZm9ybSlcbiAgICAgICAgZG9jID0gdGhpcy5fdHJhbnNmb3JtKGRvYyk7XG5cbiAgICAgIHJldHVybiBkb2M7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggaXMgcmVzb2x2ZWQgd2l0aCB0aGUgbmV4dCBvYmplY3QgKGxpa2Ugd2l0aFxuICAvLyBfbmV4dE9iamVjdFByb21pc2UpIG9yIHJlamVjdGVkIGlmIHRoZSBjdXJzb3IgZG9lc24ndCByZXR1cm4gd2l0aGluXG4gIC8vIHRpbWVvdXRNUyBtcy5cbiAgX25leHRPYmplY3RQcm9taXNlV2l0aFRpbWVvdXQodGltZW91dE1TKSB7XG4gICAgY29uc3QgbmV4dE9iamVjdFByb21pc2UgPSB0aGlzLl9uZXh0T2JqZWN0UHJvbWlzZSgpO1xuICAgIGlmICghdGltZW91dE1TKSB7XG4gICAgICByZXR1cm4gbmV4dE9iamVjdFByb21pc2U7XG4gICAgfVxuXG4gICAgY29uc3QgdGltZW91dFByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIC8vIE9uIHRpbWVvdXQsIGNsb3NlIHRoZSBjdXJzb3IuXG4gICAgICBjb25zdCB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgcmVzb2x2ZSh0aGlzLmNsb3NlKCkpO1xuICAgICAgfSwgdGltZW91dE1TKTtcblxuICAgICAgLy8gSWYgdGhlIGBfbmV4dE9iamVjdFByb21pc2VgIHJldHVybmVkIGZpcnN0LCBjYW5jZWwgdGhlIHRpbWVvdXQuXG4gICAgICBuZXh0T2JqZWN0UHJvbWlzZS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBQcm9taXNlLnJhY2UoW25leHRPYmplY3RQcm9taXNlLCB0aW1lb3V0UHJvbWlzZV0pO1xuICB9XG5cbiAgYXN5bmMgZm9yRWFjaChjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIC8vIEdldCBiYWNrIHRvIHRoZSBiZWdpbm5pbmcuXG4gICAgdGhpcy5fcmV3aW5kKCk7XG5cbiAgICBsZXQgaWR4ID0gMDtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgZG9jID0gYXdhaXQgdGhpcy5fbmV4dE9iamVjdFByb21pc2UoKTtcbiAgICAgIGlmICghZG9jKSByZXR1cm47XG4gICAgICBhd2FpdCBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIGRvYywgaWR4KyssIHRoaXMuX3NlbGZGb3JJdGVyYXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIG1hcChjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBhd2FpdCB0aGlzLmZvckVhY2goYXN5bmMgKGRvYywgaW5kZXgpID0+IHtcbiAgICAgIHJlc3VsdHMucHVzaChhd2FpdCBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIGRvYywgaW5kZXgsIHRoaXMuX3NlbGZGb3JJdGVyYXRpb24pKTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG5cbiAgX3Jld2luZCgpIHtcbiAgICAvLyBrbm93biB0byBiZSBzeW5jaHJvbm91c1xuICAgIHRoaXMuX2RiQ3Vyc29yLnJld2luZCgpO1xuXG4gICAgdGhpcy5fdmlzaXRlZElkcyA9IG5ldyBMb2NhbENvbGxlY3Rpb24uX0lkTWFwO1xuICB9XG5cbiAgLy8gTW9zdGx5IHVzYWJsZSBmb3IgdGFpbGFibGUgY3Vyc29ycy5cbiAgYXN5bmMgY2xvc2UoKSB7XG4gICAgdGhpcy5fY2xvc2luZyA9IHRydWU7XG4gICAgLy8gSWYgdGhlcmUncyBhIHBlbmRpbmcgbmV4dCgpLCB3YWl0IGZvciBpdCB0byBmaW5pc2ggb3IgYWJvcnRcbiAgICBpZiAodGhpcy5fcGVuZGluZ05leHQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMuX3BlbmRpbmdOZXh0O1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBpZ25vcmVcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fZGJDdXJzb3IuY2xvc2UoKTtcbiAgfVxuXG4gIGZldGNoKCkge1xuICAgIHJldHVybiB0aGlzLm1hcChkb2MgPT4gZG9jKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGSVhNRTogKG5vZGU6MzQ2ODApIFtNT05HT0RCIERSSVZFUl0gV2FybmluZzogY3Vyc29yLmNvdW50IGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmVcbiAgICogIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvbiwgcGxlYXNlIHVzZSBgY29sbGVjdGlvbi5lc3RpbWF0ZWREb2N1bWVudENvdW50YCBvclxuICAgKiAgYGNvbGxlY3Rpb24uY291bnREb2N1bWVudHNgIGluc3RlYWQuXG4gICAqL1xuICBjb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGJDdXJzb3IuY291bnQoKTtcbiAgfVxuXG4gIC8vIFRoaXMgbWV0aG9kIGlzIE5PVCB3cmFwcGVkIGluIEN1cnNvci5cbiAgYXN5bmMgZ2V0UmF3T2JqZWN0cyhvcmRlcmVkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmIChvcmRlcmVkKSB7XG4gICAgICByZXR1cm4gc2VsZi5mZXRjaCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcmVzdWx0cyA9IG5ldyBMb2NhbENvbGxlY3Rpb24uX0lkTWFwO1xuICAgICAgYXdhaXQgc2VsZi5mb3JFYWNoKGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgICAgcmVzdWx0cy5zZXQoZG9jLl9pZCwgZG9jKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuICB9XG59IiwiaW1wb3J0IHsgQVNZTkNfQ1VSU09SX01FVEhPRFMsIGdldEFzeW5jTWV0aG9kTmFtZSB9IGZyb20gJ21ldGVvci9taW5pbW9uZ28vY29uc3RhbnRzJztcbmltcG9ydCB7IHJlcGxhY2VNZXRlb3JBdG9tV2l0aE1vbmdvLCByZXBsYWNlVHlwZXMgfSBmcm9tICcuL21vbmdvX2NvbW1vbic7XG5pbXBvcnQgTG9jYWxDb2xsZWN0aW9uIGZyb20gJ21ldGVvci9taW5pbW9uZ28vbG9jYWxfY29sbGVjdGlvbic7XG5pbXBvcnQgeyBDdXJzb3JEZXNjcmlwdGlvbiB9IGZyb20gJy4vY3Vyc29yX2Rlc2NyaXB0aW9uJztcbmltcG9ydCB7IE9ic2VydmVDYWxsYmFja3MsIE9ic2VydmVDaGFuZ2VzQ2FsbGJhY2tzIH0gZnJvbSAnLi90eXBlcyc7XG5cbmludGVyZmFjZSBNb25nb0ludGVyZmFjZSB7XG4gIHJhd0NvbGxlY3Rpb246IChjb2xsZWN0aW9uTmFtZTogc3RyaW5nKSA9PiBhbnk7XG4gIF9jcmVhdGVBc3luY2hyb25vdXNDdXJzb3I6IChjdXJzb3JEZXNjcmlwdGlvbjogQ3Vyc29yRGVzY3JpcHRpb24sIG9wdGlvbnM6IEN1cnNvck9wdGlvbnMpID0+IGFueTtcbiAgX29ic2VydmVDaGFuZ2VzOiAoY3Vyc29yRGVzY3JpcHRpb246IEN1cnNvckRlc2NyaXB0aW9uLCBvcmRlcmVkOiBib29sZWFuLCBjYWxsYmFja3M6IGFueSwgbm9uTXV0YXRpbmdDYWxsYmFja3M/OiBib29sZWFuKSA9PiBhbnk7XG59XG5cbmludGVyZmFjZSBDdXJzb3JPcHRpb25zIHtcbiAgc2VsZkZvckl0ZXJhdGlvbjogQ3Vyc29yPGFueT47XG4gIHVzZVRyYW5zZm9ybTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBAY2xhc3MgQ3Vyc29yXG4gKlxuICogVGhlIG1haW4gY3Vyc29yIG9iamVjdCByZXR1cm5lZCBmcm9tIGZpbmQoKSwgaW1wbGVtZW50aW5nIHRoZSBkb2N1bWVudGVkXG4gKiBNb25nby5Db2xsZWN0aW9uIGN1cnNvciBBUEkuXG4gKlxuICogV3JhcHMgYSBDdXJzb3JEZXNjcmlwdGlvbiBhbmQgbGF6aWx5IGNyZWF0ZXMgYW4gQXN5bmNocm9ub3VzQ3Vyc29yXG4gKiAob25seSBjb250YWN0cyBNb25nb0RCIHdoZW4gbWV0aG9kcyBsaWtlIGZldGNoIG9yIGZvckVhY2ggYXJlIGNhbGxlZCkuXG4gKi9cbmV4cG9ydCBjbGFzcyBDdXJzb3I8VCwgVSA9IFQ+IHtcbiAgcHVibGljIF9tb25nbzogTW9uZ29JbnRlcmZhY2U7XG4gIHB1YmxpYyBfY3Vyc29yRGVzY3JpcHRpb246IEN1cnNvckRlc2NyaXB0aW9uO1xuICBwdWJsaWMgX3N5bmNocm9ub3VzQ3Vyc29yOiBhbnkgfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKG1vbmdvOiBNb25nb0ludGVyZmFjZSwgY3Vyc29yRGVzY3JpcHRpb246IEN1cnNvckRlc2NyaXB0aW9uKSB7XG4gICAgdGhpcy5fbW9uZ28gPSBtb25nbztcbiAgICB0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbiA9IGN1cnNvckRlc2NyaXB0aW9uO1xuICAgIHRoaXMuX3N5bmNocm9ub3VzQ3Vyc29yID0gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIGNvdW50QXN5bmMoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gdGhpcy5fbW9uZ28ucmF3Q29sbGVjdGlvbih0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbi5jb2xsZWN0aW9uTmFtZSk7XG4gICAgcmV0dXJuIGF3YWl0IGNvbGxlY3Rpb24uY291bnREb2N1bWVudHMoXG4gICAgICByZXBsYWNlVHlwZXModGhpcy5fY3Vyc29yRGVzY3JpcHRpb24uc2VsZWN0b3IsIHJlcGxhY2VNZXRlb3JBdG9tV2l0aE1vbmdvKSxcbiAgICAgIHJlcGxhY2VUeXBlcyh0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zLCByZXBsYWNlTWV0ZW9yQXRvbVdpdGhNb25nbyksXG4gICAgKTtcbiAgfVxuXG4gIGNvdW50KCk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBcImNvdW50KCkgaXMgbm90IGF2YWlsYWJsZSBvbiB0aGUgc2VydmVyLiBQbGVhc2UgdXNlIGNvdW50QXN5bmMoKSBpbnN0ZWFkLlwiXG4gICAgKTtcbiAgfVxuXG4gIGdldFRyYW5zZm9ybSgpOiAoKGRvYzogYW55KSA9PiBhbnkpIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fY3Vyc29yRGVzY3JpcHRpb24ub3B0aW9ucy50cmFuc2Zvcm07XG4gIH1cblxuICBfcHVibGlzaEN1cnNvcihzdWI6IGFueSk6IGFueSB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IHRoaXMuX2N1cnNvckRlc2NyaXB0aW9uLmNvbGxlY3Rpb25OYW1lO1xuICAgIHJldHVybiBNb25nby5Db2xsZWN0aW9uLl9wdWJsaXNoQ3Vyc29yKHRoaXMsIHN1YiwgY29sbGVjdGlvbik7XG4gIH1cblxuICBfZ2V0Q29sbGVjdGlvbk5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fY3Vyc29yRGVzY3JpcHRpb24uY29sbGVjdGlvbk5hbWU7XG4gIH1cblxuICBvYnNlcnZlKGNhbGxiYWNrczogT2JzZXJ2ZUNhbGxiYWNrczxVPik6IGFueSB7XG4gICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fb2JzZXJ2ZUZyb21PYnNlcnZlQ2hhbmdlcyh0aGlzLCBjYWxsYmFja3MpO1xuICB9XG5cbiAgYXN5bmMgb2JzZXJ2ZUFzeW5jKGNhbGxiYWNrczogT2JzZXJ2ZUNhbGxiYWNrczxVPik6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gcmVzb2x2ZSh0aGlzLm9ic2VydmUoY2FsbGJhY2tzKSkpO1xuICB9XG5cbiAgb2JzZXJ2ZUNoYW5nZXMoY2FsbGJhY2tzOiBPYnNlcnZlQ2hhbmdlc0NhbGxiYWNrczxVPiwgb3B0aW9uczogeyBub25NdXRhdGluZ0NhbGxiYWNrcz86IGJvb2xlYW4gfSA9IHt9KTogYW55IHtcbiAgICBjb25zdCBvcmRlcmVkID0gTG9jYWxDb2xsZWN0aW9uLl9vYnNlcnZlQ2hhbmdlc0NhbGxiYWNrc0FyZU9yZGVyZWQoY2FsbGJhY2tzKTtcbiAgICByZXR1cm4gdGhpcy5fbW9uZ28uX29ic2VydmVDaGFuZ2VzKFxuICAgICAgdGhpcy5fY3Vyc29yRGVzY3JpcHRpb24sXG4gICAgICBvcmRlcmVkLFxuICAgICAgY2FsbGJhY2tzLFxuICAgICAgb3B0aW9ucy5ub25NdXRhdGluZ0NhbGxiYWNrc1xuICAgICk7XG4gIH1cblxuICBhc3luYyBvYnNlcnZlQ2hhbmdlc0FzeW5jKGNhbGxiYWNrczogT2JzZXJ2ZUNoYW5nZXNDYWxsYmFja3M8VT4sIG9wdGlvbnM6IHsgbm9uTXV0YXRpbmdDYWxsYmFja3M/OiBib29sZWFuIH0gPSB7fSk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMub2JzZXJ2ZUNoYW5nZXMoY2FsbGJhY2tzLCBvcHRpb25zKTtcbiAgfVxufVxuXG4vLyBBZGQgY3Vyc29yIG1ldGhvZHMgZHluYW1pY2FsbHlcblsuLi5BU1lOQ19DVVJTT1JfTUVUSE9EUywgU3ltYm9sLml0ZXJhdG9yLCBTeW1ib2wuYXN5bmNJdGVyYXRvcl0uZm9yRWFjaChtZXRob2ROYW1lID0+IHtcbiAgaWYgKG1ldGhvZE5hbWUgPT09ICdjb3VudCcpIHJldHVybjtcblxuICAoQ3Vyc29yLnByb3RvdHlwZSBhcyBhbnkpW21ldGhvZE5hbWVdID0gZnVuY3Rpb24odGhpczogQ3Vyc29yPGFueT4sIC4uLmFyZ3M6IGFueVtdKTogYW55IHtcbiAgICBjb25zdCBjdXJzb3IgPSBzZXR1cEFzeW5jaHJvbm91c0N1cnNvcih0aGlzLCBtZXRob2ROYW1lKTtcbiAgICByZXR1cm4gY3Vyc29yW21ldGhvZE5hbWVdKC4uLmFyZ3MpO1xuICB9O1xuXG4gIGlmIChtZXRob2ROYW1lID09PSBTeW1ib2wuaXRlcmF0b3IgfHwgbWV0aG9kTmFtZSA9PT0gU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHJldHVybjtcblxuICBjb25zdCBtZXRob2ROYW1lQXN5bmMgPSBnZXRBc3luY01ldGhvZE5hbWUobWV0aG9kTmFtZSk7XG5cbiAgKEN1cnNvci5wcm90b3R5cGUgYXMgYW55KVttZXRob2ROYW1lQXN5bmNdID0gZnVuY3Rpb24odGhpczogQ3Vyc29yPGFueT4sIC4uLmFyZ3M6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gdGhpc1ttZXRob2ROYW1lXSguLi5hcmdzKTtcbiAgfTtcbn0pO1xuXG5mdW5jdGlvbiBzZXR1cEFzeW5jaHJvbm91c0N1cnNvcihjdXJzb3I6IEN1cnNvcjxhbnk+LCBtZXRob2Q6IHN0cmluZyB8IHN5bWJvbCk6IGFueSB7XG4gIGlmIChjdXJzb3IuX2N1cnNvckRlc2NyaXB0aW9uLm9wdGlvbnMudGFpbGFibGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBjYWxsICR7U3RyaW5nKG1ldGhvZCl9IG9uIGEgdGFpbGFibGUgY3Vyc29yYCk7XG4gIH1cblxuICBpZiAoIWN1cnNvci5fc3luY2hyb25vdXNDdXJzb3IpIHtcbiAgICBjdXJzb3IuX3N5bmNocm9ub3VzQ3Vyc29yID0gY3Vyc29yLl9tb25nby5fY3JlYXRlQXN5bmNocm9ub3VzQ3Vyc29yKFxuICAgICAgY3Vyc29yLl9jdXJzb3JEZXNjcmlwdGlvbixcbiAgICAgIHtcbiAgICAgICAgc2VsZkZvckl0ZXJhdGlvbjogY3Vyc29yLFxuICAgICAgICB1c2VUcmFuc2Zvcm06IHRydWUsXG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBjdXJzb3IuX3N5bmNocm9ub3VzQ3Vyc29yO1xufSIsIi8vIHNpbmdsZXRvblxuZXhwb3J0IGNvbnN0IExvY2FsQ29sbGVjdGlvbkRyaXZlciA9IG5ldyAoY2xhc3MgTG9jYWxDb2xsZWN0aW9uRHJpdmVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5ub0Nvbm5Db2xsZWN0aW9ucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIH1cblxuICBvcGVuKG5hbWUsIGNvbm4pIHtcbiAgICBpZiAoISBuYW1lKSB7XG4gICAgICByZXR1cm4gbmV3IExvY2FsQ29sbGVjdGlvbjtcbiAgICB9XG5cbiAgICBpZiAoISBjb25uKSB7XG4gICAgICByZXR1cm4gZW5zdXJlQ29sbGVjdGlvbihuYW1lLCB0aGlzLm5vQ29ubkNvbGxlY3Rpb25zKTtcbiAgICB9XG5cbiAgICBpZiAoISBjb25uLl9tb25nb19saXZlZGF0YV9jb2xsZWN0aW9ucykge1xuICAgICAgY29ubi5fbW9uZ29fbGl2ZWRhdGFfY29sbGVjdGlvbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIH1cblxuICAgIC8vIFhYWCBpcyB0aGVyZSBhIHdheSB0byBrZWVwIHRyYWNrIG9mIGEgY29ubmVjdGlvbidzIGNvbGxlY3Rpb25zIHdpdGhvdXRcbiAgICAvLyBkYW5nbGluZyBpdCBvZmYgdGhlIGNvbm5lY3Rpb24gb2JqZWN0P1xuICAgIHJldHVybiBlbnN1cmVDb2xsZWN0aW9uKG5hbWUsIGNvbm4uX21vbmdvX2xpdmVkYXRhX2NvbGxlY3Rpb25zKTtcbiAgfVxufSk7XG5cbmZ1bmN0aW9uIGVuc3VyZUNvbGxlY3Rpb24obmFtZSwgY29sbGVjdGlvbnMpIHtcbiAgcmV0dXJuIChuYW1lIGluIGNvbGxlY3Rpb25zKVxuICAgID8gY29sbGVjdGlvbnNbbmFtZV1cbiAgICA6IGNvbGxlY3Rpb25zW25hbWVdID0gbmV3IExvY2FsQ29sbGVjdGlvbihuYW1lKTtcbn1cbiIsImltcG9ydCBvbmNlIGZyb20gJ2xvZGFzaC5vbmNlJztcbmltcG9ydCB7XG4gIEFTWU5DX0NPTExFQ1RJT05fTUVUSE9EUyxcbiAgZ2V0QXN5bmNNZXRob2ROYW1lLFxuICBDTElFTlRfT05MWV9NRVRIT0RTXG59IGZyb20gXCJtZXRlb3IvbWluaW1vbmdvL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgTW9uZ29Db25uZWN0aW9uIH0gZnJvbSAnLi9tb25nb19jb25uZWN0aW9uJztcblxuLy8gRGVmaW5lIGludGVyZmFjZXMgYW5kIHR5cGVzXG5pbnRlcmZhY2UgSUNvbm5lY3Rpb25PcHRpb25zIHtcbiAgb3Bsb2dVcmw/OiBzdHJpbmc7XG4gIFtrZXk6IHN0cmluZ106IHVua25vd247ICAvLyBDaGFuZ2VkIGZyb20gJ2FueScgdG8gJ3Vua25vd24nIGZvciBiZXR0ZXIgdHlwZSBzYWZldHlcbn1cblxuaW50ZXJmYWNlIElNb25nb0ludGVybmFscyB7XG4gIFJlbW90ZUNvbGxlY3Rpb25Ecml2ZXI6IHR5cGVvZiBSZW1vdGVDb2xsZWN0aW9uRHJpdmVyO1xuICBkZWZhdWx0UmVtb3RlQ29sbGVjdGlvbkRyaXZlcjogKCkgPT4gUmVtb3RlQ29sbGVjdGlvbkRyaXZlcjtcbn1cblxuLy8gTW9yZSBzcGVjaWZpYyB0eXBpbmcgZm9yIGNvbGxlY3Rpb24gbWV0aG9kc1xudHlwZSBNb25nb01ldGhvZEZ1bmN0aW9uID0gKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdW5rbm93bjtcbmludGVyZmFjZSBJQ29sbGVjdGlvbk1ldGhvZHMge1xuICBba2V5OiBzdHJpbmddOiBNb25nb01ldGhvZEZ1bmN0aW9uO1xufVxuXG4vLyBUeXBlIGZvciBNb25nb0Nvbm5lY3Rpb25cbmludGVyZmFjZSBJTW9uZ29DbGllbnQge1xuICBjb25uZWN0OiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xufVxuXG5pbnRlcmZhY2UgSU1vbmdvQ29ubmVjdGlvbiB7XG4gIGNsaWVudDogSU1vbmdvQ2xpZW50O1xuICBba2V5OiBzdHJpbmddOiBNb25nb01ldGhvZEZ1bmN0aW9uIHwgSU1vbmdvQ2xpZW50O1xufVxuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIG5hbWVzcGFjZSBOb2RlSlMge1xuICAgIGludGVyZmFjZSBQcm9jZXNzRW52IHtcbiAgICAgIE1PTkdPX1VSTDogc3RyaW5nO1xuICAgICAgTU9OR09fT1BMT0dfVVJMPzogc3RyaW5nO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IE1vbmdvSW50ZXJuYWxzOiBJTW9uZ29JbnRlcm5hbHM7XG4gIGNvbnN0IE1ldGVvcjoge1xuICAgIHN0YXJ0dXA6IChjYWxsYmFjazogKCkgPT4gUHJvbWlzZTx2b2lkPikgPT4gdm9pZDtcbiAgfTtcbn1cblxuY2xhc3MgUmVtb3RlQ29sbGVjdGlvbkRyaXZlciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgbW9uZ286IE1vbmdvQ29ubmVjdGlvbjtcblxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBSRU1PVEVfQ09MTEVDVElPTl9NRVRIT0RTID0gW1xuICAgICdjcmVhdGVDYXBwZWRDb2xsZWN0aW9uQXN5bmMnLFxuICAgICdkcm9wSW5kZXhBc3luYycsXG4gICAgJ2Vuc3VyZUluZGV4QXN5bmMnLFxuICAgICdjcmVhdGVJbmRleEFzeW5jJyxcbiAgICAnY291bnREb2N1bWVudHMnLFxuICAgICdkcm9wQ29sbGVjdGlvbkFzeW5jJyxcbiAgICAnZXN0aW1hdGVkRG9jdW1lbnRDb3VudCcsXG4gICAgJ2ZpbmQnLFxuICAgICdmaW5kT25lQXN5bmMnLFxuICAgICdpbnNlcnRBc3luYycsXG4gICAgJ3Jhd0NvbGxlY3Rpb24nLFxuICAgICdyZW1vdmVBc3luYycsXG4gICAgJ3VwZGF0ZUFzeW5jJyxcbiAgICAndXBzZXJ0QXN5bmMnLFxuICBdIGFzIGNvbnN0O1xuXG4gIGNvbnN0cnVjdG9yKG1vbmdvVXJsOiBzdHJpbmcsIG9wdGlvbnM6IElDb25uZWN0aW9uT3B0aW9ucykge1xuICAgIHRoaXMubW9uZ28gPSBuZXcgTW9uZ29Db25uZWN0aW9uKG1vbmdvVXJsLCBvcHRpb25zKTtcbiAgfVxuXG4gIHB1YmxpYyBvcGVuKG5hbWU6IHN0cmluZyk6IElDb2xsZWN0aW9uTWV0aG9kcyB7XG4gICAgY29uc3QgcmV0OiBJQ29sbGVjdGlvbk1ldGhvZHMgPSB7fTtcblxuICAgIC8vIEhhbmRsZSByZW1vdGUgY29sbGVjdGlvbiBtZXRob2RzXG4gICAgUmVtb3RlQ29sbGVjdGlvbkRyaXZlci5SRU1PVEVfQ09MTEVDVElPTl9NRVRIT0RTLmZvckVhY2goKG1ldGhvZCkgPT4ge1xuICAgICAgLy8gVHlwZSBhc3NlcnRpb24gbmVlZGVkIGJlY2F1c2Ugd2Uga25vdyB0aGVzZSBtZXRob2RzIGV4aXN0IG9uIE1vbmdvQ29ubmVjdGlvblxuICAgICAgY29uc3QgbW9uZ29NZXRob2QgPSB0aGlzLm1vbmdvW21ldGhvZF0gYXMgTW9uZ29NZXRob2RGdW5jdGlvbjtcbiAgICAgIHJldFttZXRob2RdID0gbW9uZ29NZXRob2QuYmluZCh0aGlzLm1vbmdvLCBuYW1lKTtcblxuICAgICAgaWYgKCFBU1lOQ19DT0xMRUNUSU9OX01FVEhPRFMuaW5jbHVkZXMobWV0aG9kKSkgcmV0dXJuO1xuXG4gICAgICBjb25zdCBhc3luY01ldGhvZE5hbWUgPSBnZXRBc3luY01ldGhvZE5hbWUobWV0aG9kKTtcbiAgICAgIHJldFthc3luY01ldGhvZE5hbWVdID0gKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gcmV0W21ldGhvZF0oLi4uYXJncyk7XG4gICAgfSk7XG5cbiAgICAvLyBIYW5kbGUgY2xpZW50LW9ubHkgbWV0aG9kc1xuICAgIENMSUVOVF9PTkxZX01FVEhPRFMuZm9yRWFjaCgobWV0aG9kKSA9PiB7XG4gICAgICByZXRbbWV0aG9kXSA9ICguLi5hcmdzOiB1bmtub3duW10pOiBuZXZlciA9PiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgJHttZXRob2R9IGlzIG5vdCBhdmFpbGFibGUgb24gdGhlIHNlcnZlci4gUGxlYXNlIHVzZSAke2dldEFzeW5jTWV0aG9kTmFtZShcbiAgICAgICAgICAgIG1ldGhvZFxuICAgICAgICAgICl9KCkgaW5zdGVhZC5gXG4gICAgICAgICk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJldDtcbiAgfVxufVxuXG4vLyBBc3NpZ24gdGhlIGNsYXNzIHRvIE1vbmdvSW50ZXJuYWxzXG5Nb25nb0ludGVybmFscy5SZW1vdGVDb2xsZWN0aW9uRHJpdmVyID0gUmVtb3RlQ29sbGVjdGlvbkRyaXZlcjtcblxuLy8gQ3JlYXRlIHRoZSBzaW5nbGV0b24gUmVtb3RlQ29sbGVjdGlvbkRyaXZlciBvbmx5IG9uIGRlbWFuZFxuTW9uZ29JbnRlcm5hbHMuZGVmYXVsdFJlbW90ZUNvbGxlY3Rpb25Ecml2ZXIgPSBvbmNlKCgpOiBSZW1vdGVDb2xsZWN0aW9uRHJpdmVyID0+IHtcbiAgY29uc3QgY29ubmVjdGlvbk9wdGlvbnM6IElDb25uZWN0aW9uT3B0aW9ucyA9IHt9O1xuICBjb25zdCBtb25nb1VybCA9IHByb2Nlc3MuZW52Lk1PTkdPX1VSTDtcblxuICBpZiAoIW1vbmdvVXJsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTU9OR09fVVJMIG11c3QgYmUgc2V0IGluIGVudmlyb25tZW50XCIpO1xuICB9XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk1PTkdPX09QTE9HX1VSTCkge1xuICAgIGNvbm5lY3Rpb25PcHRpb25zLm9wbG9nVXJsID0gcHJvY2Vzcy5lbnYuTU9OR09fT1BMT0dfVVJMO1xuICB9XG5cbiAgY29uc3QgZHJpdmVyID0gbmV3IFJlbW90ZUNvbGxlY3Rpb25Ecml2ZXIobW9uZ29VcmwsIGNvbm5lY3Rpb25PcHRpb25zKTtcblxuICAvLyBJbml0aWFsaXplIGRhdGFiYXNlIGNvbm5lY3Rpb24gb24gc3RhcnR1cFxuICBNZXRlb3Iuc3RhcnR1cChhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgYXdhaXQgZHJpdmVyLm1vbmdvLmNsaWVudC5jb25uZWN0KCk7XG4gIH0pO1xuXG4gIHJldHVybiBkcml2ZXI7XG59KTtcblxuZXhwb3J0IHsgUmVtb3RlQ29sbGVjdGlvbkRyaXZlciwgSUNvbm5lY3Rpb25PcHRpb25zLCBJQ29sbGVjdGlvbk1ldGhvZHMgfTsiLCIvKipcbiAqIENvbGxlY3Rpb24gRXh0ZW5zaW9ucyBTeXN0ZW1cbiAqIFxuICogUHJvdmlkZXMgYSBjbGVhbiB3YXkgdG8gZXh0ZW5kIE1vbmdvLkNvbGxlY3Rpb24gZnVuY3Rpb25hbGl0eVxuICogd2l0aG91dCBtb25rZXkgcGF0Y2hpbmcuIFN1cHBvcnRzIGNvbnN0cnVjdG9yIGV4dGVuc2lvbnMsXG4gKiBwcm90b3R5cGUgbWV0aG9kcywgYW5kIHN0YXRpYyBtZXRob2RzLlxuICovXG5cbmlmIChQYWNrYWdlWydsYWk6Y29sbGVjdGlvbi1leHRlbnNpb25zJ10pIHtcbiAgY29uc29sZS53YXJuKCdsYWk6Y29sbGVjdGlvbi1leHRlbnNpb25zIGlzIG5vdCBkZXByZWNhdGVkLiBVc2UgTW9uZ28uQ29sbGVjdGlvbi5hZGRFeHRlbnNpb24gaW5zdGVhZC4nKTtcbn1cblxuQ29sbGVjdGlvbkV4dGVuc2lvbnMgPSB7XG4gIF9leHRlbnNpb25zOiBbXSxcbiAgX3Byb3RvdHlwZU1ldGhvZHM6IG5ldyBNYXAoKSxcbiAgX3N0YXRpY01ldGhvZHM6IG5ldyBNYXAoKSxcbiAgXG4gIC8qKlxuICAgKiBBZGQgYSBjb25zdHJ1Y3RvciBleHRlbnNpb24gZnVuY3Rpb25cbiAgICogRXh0ZW5zaW9uIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIChuYW1lLCBvcHRpb25zKSBhbmQgJ3RoaXMnIGJvdW5kIHRvIGNvbGxlY3Rpb24gaW5zdGFuY2VcbiAgICovXG4gIGFkZEV4dGVuc2lvbihleHRlbnNpb24pIHtcbiAgICBpZiAodHlwZW9mIGV4dGVuc2lvbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHRlbnNpb24gbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgfVxuICAgIHRoaXMuX2V4dGVuc2lvbnMucHVzaChleHRlbnNpb24pO1xuICB9LFxuICBcbiAgLyoqXG4gICAqIEFkZCBhIHByb3RvdHlwZSBtZXRob2QgdG8gYWxsIGNvbGxlY3Rpb24gaW5zdGFuY2VzXG4gICAqIE1ldGhvZCBpcyBib3VuZCB0byB0aGUgY29sbGVjdGlvbiBpbnN0YW5jZVxuICAgKi9cbiAgYWRkUHJvdG90eXBlTWV0aG9kKG5hbWUsIG1ldGhvZCkge1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycgfHwgIW5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUHJvdG90eXBlIG1ldGhvZCBuYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb3RvdHlwZSBtZXRob2QgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgfVxuICAgIFxuICAgIHRoaXMuX3Byb3RvdHlwZU1ldGhvZHMuc2V0KG5hbWUsIG1ldGhvZCk7XG4gIH0sXG4gIFxuICAvKipcbiAgICogQWRkIGEgc3RhdGljIG1ldGhvZCB0byB0aGUgTW9uZ28uQ29sbGVjdGlvbiBjb25zdHJ1Y3RvclxuICAgKi9cbiAgYWRkU3RhdGljTWV0aG9kKG5hbWUsIG1ldGhvZCkge1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycgfHwgIW5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU3RhdGljIG1ldGhvZCBuYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbWV0aG9kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1N0YXRpYyBtZXRob2QgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgfVxuICAgIFxuICAgIHRoaXMuX3N0YXRpY01ldGhvZHMuc2V0KG5hbWUsIG1ldGhvZCk7XG4gIH0sXG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4dGVuc2lvbiAodXNlZnVsIGZvciB0ZXN0aW5nKVxuICAgKi9cbiAgcmVtb3ZlRXh0ZW5zaW9uKGV4dGVuc2lvbikge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fZXh0ZW5zaW9ucy5pbmRleE9mKGV4dGVuc2lvbik7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuX2V4dGVuc2lvbnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gIH0sXG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGEgcHJvdG90eXBlIG1ldGhvZFxuICAgKi9cbiAgcmVtb3ZlUHJvdG90eXBlTWV0aG9kKG5hbWUpIHtcbiAgICB0aGlzLl9wcm90b3R5cGVNZXRob2RzLmRlbGV0ZShuYW1lKTtcbiAgfSxcbiAgXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBzdGF0aWMgbWV0aG9kXG4gICAqL1xuICByZW1vdmVTdGF0aWNNZXRob2QobmFtZSkge1xuICAgIHRoaXMuX3N0YXRpY01ldGhvZHMuZGVsZXRlKG5hbWUpO1xuICB9LFxuICBcbiAgLyoqXG4gICAqIENsZWFyIGFsbCBleHRlbnNpb25zICh1c2VmdWwgZm9yIHRlc3RpbmcpXG4gICAqL1xuICBjbGVhckV4dGVuc2lvbnMoKSB7XG4gICAgdGhpcy5fZXh0ZW5zaW9ucy5sZW5ndGggPSAwO1xuICAgIHRoaXMuX3Byb3RvdHlwZU1ldGhvZHMuY2xlYXIoKTtcbiAgICB0aGlzLl9zdGF0aWNNZXRob2RzLmNsZWFyKCk7XG4gIH0sXG4gIFxuICAvKipcbiAgICogR2V0IGFsbCByZWdpc3RlcmVkIGV4dGVuc2lvbnMgKHVzZWZ1bCBmb3IgZGVidWdnaW5nKVxuICAgKi9cbiAgZ2V0RXh0ZW5zaW9ucygpIHtcbiAgICByZXR1cm4gWy4uLnRoaXMuX2V4dGVuc2lvbnNdO1xuICB9LFxuICBcbiAgLyoqXG4gICAqIEdldCBhbGwgcmVnaXN0ZXJlZCBwcm90b3R5cGUgbWV0aG9kcyAodXNlZnVsIGZvciBkZWJ1Z2dpbmcpXG4gICAqL1xuICBnZXRQcm90b3R5cGVNZXRob2RzKCkge1xuICAgIHJldHVybiBuZXcgTWFwKHRoaXMuX3Byb3RvdHlwZU1ldGhvZHMpO1xuICB9LFxuICBcbiAgLyoqXG4gICAqIEdldCBhbGwgcmVnaXN0ZXJlZCBzdGF0aWMgbWV0aG9kcyAodXNlZnVsIGZvciBkZWJ1Z2dpbmcpXG4gICAqL1xuICBnZXRTdGF0aWNNZXRob2RzKCkge1xuICAgIHJldHVybiBuZXcgTWFwKHRoaXMuX3N0YXRpY01ldGhvZHMpO1xuICB9LFxuICBcblxuICBcbiAgLyoqXG4gICAqIEFwcGx5IGFsbCBleHRlbnNpb25zIHRvIGEgY29sbGVjdGlvbiBpbnN0YW5jZVxuICAgKiBDYWxsZWQgZHVyaW5nIGNvbGxlY3Rpb24gY29uc3RydWN0aW9uXG4gICAqL1xuICBfYXBwbHlFeHRlbnNpb25zKGluc3RhbmNlLCBuYW1lLCBvcHRpb25zKSB7XG4gICAgLy8gQXBwbHkgY29uc3RydWN0b3IgZXh0ZW5zaW9uc1xuICAgIGZvciAoY29uc3QgZXh0ZW5zaW9uIG9mIHRoaXMuX2V4dGVuc2lvbnMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGV4dGVuc2lvbi5jYWxsKGluc3RhbmNlLCBuYW1lLCBvcHRpb25zKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8vIFByb3ZpZGUgaGVscGZ1bCBlcnJvciBjb250ZXh0XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRXh0ZW5zaW9uIGZhaWxlZCBmb3IgY29sbGVjdGlvbiAnJHtuYW1lfSc6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gQXBwbHkgcHJvdG90eXBlIG1ldGhvZHNcbiAgICBmb3IgKGNvbnN0IFttZXRob2ROYW1lLCBtZXRob2RdIG9mIHRoaXMuX3Byb3RvdHlwZU1ldGhvZHMpIHtcbiAgICAgIGluc3RhbmNlW21ldGhvZE5hbWVdID0gbWV0aG9kLmJpbmQoaW5zdGFuY2UpO1xuICAgIH1cbiAgfSxcbiAgXG4gIC8qKlxuICAgKiBBcHBseSBzdGF0aWMgbWV0aG9kcyB0byB0aGUgTW9uZ28uQ29sbGVjdGlvbiBjb25zdHJ1Y3RvclxuICAgKiBDYWxsZWQgZHVyaW5nIHBhY2thZ2UgaW5pdGlhbGl6YXRpb25cbiAgICovXG4gIF9hcHBseVN0YXRpY01ldGhvZHMoQ29sbGVjdGlvbkNvbnN0cnVjdG9yKSB7XG4gICAgZm9yIChjb25zdCBbbWV0aG9kTmFtZSwgbWV0aG9kXSBvZiB0aGlzLl9zdGF0aWNNZXRob2RzKSB7XG4gICAgICBDb2xsZWN0aW9uQ29uc3RydWN0b3JbbWV0aG9kTmFtZV0gPSBtZXRob2Q7XG4gICAgfVxuICB9LFxuICBcblxufTsgIiwiaW1wb3J0IHsgbm9ybWFsaXplUHJvamVjdGlvbiB9IGZyb20gXCIuLi9tb25nb191dGlsc1wiO1xuaW1wb3J0IHsgQXN5bmNNZXRob2RzIH0gZnJvbSAnLi9tZXRob2RzX2FzeW5jJztcbmltcG9ydCB7IFN5bmNNZXRob2RzIH0gZnJvbSAnLi9tZXRob2RzX3N5bmMnO1xuaW1wb3J0IHsgSW5kZXhNZXRob2RzIH0gZnJvbSAnLi9tZXRob2RzX2luZGV4JztcbmltcG9ydCB7XG4gIElEX0dFTkVSQVRPUlMsXG4gIG5vcm1hbGl6ZU9wdGlvbnMsXG4gIHNldHVwQXV0b3B1Ymxpc2gsXG4gIHNldHVwQ29ubmVjdGlvbixcbiAgc2V0dXBEcml2ZXIsXG4gIHNldHVwTXV0YXRpb25NZXRob2RzLFxuICB2YWxpZGF0ZUNvbGxlY3Rpb25OYW1lXG59IGZyb20gJy4vY29sbGVjdGlvbl91dGlscyc7XG5pbXBvcnQgeyBSZXBsaWNhdGlvbk1ldGhvZHMgfSBmcm9tICcuL21ldGhvZHNfcmVwbGljYXRpb24nO1xuXG4vKipcbiAqIEBzdW1tYXJ5IE5hbWVzcGFjZSBmb3IgTW9uZ29EQi1yZWxhdGVkIGl0ZW1zXG4gKiBAbmFtZXNwYWNlXG4gKi9cbk1vbmdvID0ge307XG5cbi8qKlxuICogQHN1bW1hcnkgQ29uc3RydWN0b3IgZm9yIGEgQ29sbGVjdGlvblxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAaW5zdGFuY2VuYW1lIGNvbGxlY3Rpb25cbiAqIEBjbGFzc1xuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbGxlY3Rpb24uICBJZiBudWxsLCBjcmVhdGVzIGFuIHVubWFuYWdlZCAodW5zeW5jaHJvbml6ZWQpIGxvY2FsIGNvbGxlY3Rpb24uXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy5jb25uZWN0aW9uIFRoZSBzZXJ2ZXIgY29ubmVjdGlvbiB0aGF0IHdpbGwgbWFuYWdlIHRoaXMgY29sbGVjdGlvbi4gVXNlcyB0aGUgZGVmYXVsdCBjb25uZWN0aW9uIGlmIG5vdCBzcGVjaWZpZWQuICBQYXNzIHRoZSByZXR1cm4gdmFsdWUgb2YgY2FsbGluZyBbYEREUC5jb25uZWN0YF0oI0REUC1jb25uZWN0KSB0byBzcGVjaWZ5IGEgZGlmZmVyZW50IHNlcnZlci4gUGFzcyBgbnVsbGAgdG8gc3BlY2lmeSBubyBjb25uZWN0aW9uLiBVbm1hbmFnZWQgKGBuYW1lYCBpcyBudWxsKSBjb2xsZWN0aW9ucyBjYW5ub3Qgc3BlY2lmeSBhIGNvbm5lY3Rpb24uXG4gKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5pZEdlbmVyYXRpb24gVGhlIG1ldGhvZCBvZiBnZW5lcmF0aW5nIHRoZSBgX2lkYCBmaWVsZHMgb2YgbmV3IGRvY3VtZW50cyBpbiB0aGlzIGNvbGxlY3Rpb24uICBQb3NzaWJsZSB2YWx1ZXM6XG5cbiAtICoqYCdTVFJJTkcnYCoqOiByYW5kb20gc3RyaW5nc1xuIC0gKipgJ01PTkdPJ2AqKjogIHJhbmRvbSBbYE1vbmdvLk9iamVjdElEYF0oI21vbmdvX29iamVjdF9pZCkgdmFsdWVzXG5cblRoZSBkZWZhdWx0IGlkIGdlbmVyYXRpb24gdGVjaG5pcXVlIGlzIGAnU1RSSU5HJ2AuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvcHRpb25zLnRyYW5zZm9ybSBBbiBvcHRpb25hbCB0cmFuc2Zvcm1hdGlvbiBmdW5jdGlvbi4gRG9jdW1lbnRzIHdpbGwgYmUgcGFzc2VkIHRocm91Z2ggdGhpcyBmdW5jdGlvbiBiZWZvcmUgYmVpbmcgcmV0dXJuZWQgZnJvbSBgZmV0Y2hgIG9yIGBmaW5kT25lQXN5bmNgLCBhbmQgYmVmb3JlIGJlaW5nIHBhc3NlZCB0byBjYWxsYmFja3Mgb2YgYG9ic2VydmVgLCBgbWFwYCwgYGZvckVhY2hgLCBgYWxsb3dgLCBhbmQgYGRlbnlgLiBUcmFuc2Zvcm1zIGFyZSAqbm90KiBhcHBsaWVkIGZvciB0aGUgY2FsbGJhY2tzIG9mIGBvYnNlcnZlQ2hhbmdlc2Agb3IgdG8gY3Vyc29ycyByZXR1cm5lZCBmcm9tIHB1Ymxpc2ggZnVuY3Rpb25zLlxuICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLmRlZmluZU11dGF0aW9uTWV0aG9kcyBTZXQgdG8gYGZhbHNlYCB0byBza2lwIHNldHRpbmcgdXAgdGhlIG11dGF0aW9uIG1ldGhvZHMgdGhhdCBlbmFibGUgaW5zZXJ0L3VwZGF0ZS9yZW1vdmUgZnJvbSBjbGllbnQgY29kZS4gRGVmYXVsdCBgdHJ1ZWAuXG4gKi9cbi8vIE1haW4gQ29sbGVjdGlvbiBjb25zdHJ1Y3RvclxuTW9uZ28uQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIENvbGxlY3Rpb24obmFtZSwgb3B0aW9ucykge1xuICBuYW1lID0gdmFsaWRhdGVDb2xsZWN0aW9uTmFtZShuYW1lKTtcblxuICBvcHRpb25zID0gbm9ybWFsaXplT3B0aW9ucyhvcHRpb25zKTtcblxuICB0aGlzLl9tYWtlTmV3SUQgPSBJRF9HRU5FUkFUT1JTW29wdGlvbnMuaWRHZW5lcmF0aW9uXT8uKG5hbWUpO1xuXG4gIHRoaXMuX3RyYW5zZm9ybSA9IExvY2FsQ29sbGVjdGlvbi53cmFwVHJhbnNmb3JtKG9wdGlvbnMudHJhbnNmb3JtKTtcbiAgdGhpcy5yZXNvbHZlclR5cGUgPSBvcHRpb25zLnJlc29sdmVyVHlwZTtcblxuICB0aGlzLl9jb25uZWN0aW9uID0gc2V0dXBDb25uZWN0aW9uKG5hbWUsIG9wdGlvbnMpO1xuXG4gIGNvbnN0IGRyaXZlciA9IHNldHVwRHJpdmVyKG5hbWUsIHRoaXMuX2Nvbm5lY3Rpb24sIG9wdGlvbnMpO1xuICB0aGlzLl9kcml2ZXIgPSBkcml2ZXI7XG5cbiAgdGhpcy5fY29sbGVjdGlvbiA9IGRyaXZlci5vcGVuKG5hbWUsIHRoaXMuX2Nvbm5lY3Rpb24pO1xuICB0aGlzLl9uYW1lID0gbmFtZTtcblxuICB0aGlzLl9zZXR0aW5nVXBSZXBsaWNhdGlvblByb21pc2UgPSB0aGlzLl9tYXliZVNldFVwUmVwbGljYXRpb24obmFtZSwgb3B0aW9ucyk7XG5cbiAgc2V0dXBNdXRhdGlvbk1ldGhvZHModGhpcywgbmFtZSwgb3B0aW9ucyk7XG5cbiAgc2V0dXBBdXRvcHVibGlzaCh0aGlzLCBuYW1lLCBvcHRpb25zKTtcblxuICBNb25nby5fY29sbGVjdGlvbnMuc2V0KG5hbWUsIHRoaXMpO1xuICBcbiAgLy8gQXBwbHkgY29sbGVjdGlvbiBleHRlbnNpb25zXG4gIENvbGxlY3Rpb25FeHRlbnNpb25zLl9hcHBseUV4dGVuc2lvbnModGhpcywgbmFtZSwgb3B0aW9ucyk7XG59O1xuXG4vLyBBcHBseSBzdGF0aWMgbWV0aG9kcyB0byB0aGUgQ29sbGVjdGlvbiBjb25zdHJ1Y3RvclxuQ29sbGVjdGlvbkV4dGVuc2lvbnMuX2FwcGx5U3RhdGljTWV0aG9kcyhNb25nby5Db2xsZWN0aW9uKTtcblxuXG5PYmplY3QuYXNzaWduKE1vbmdvLkNvbGxlY3Rpb24ucHJvdG90eXBlLCB7XG4gIF9nZXRGaW5kU2VsZWN0b3IoYXJncykge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PSAwKSByZXR1cm4ge307XG4gICAgZWxzZSByZXR1cm4gYXJnc1swXTtcbiAgfSxcblxuICBfZ2V0RmluZE9wdGlvbnMoYXJncykge1xuICAgIGNvbnN0IFssIG9wdGlvbnNdID0gYXJncyB8fCBbXTtcbiAgICBjb25zdCBuZXdPcHRpb25zID0gbm9ybWFsaXplUHJvamVjdGlvbihvcHRpb25zKTtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoYXJncy5sZW5ndGggPCAyKSB7XG4gICAgICByZXR1cm4geyB0cmFuc2Zvcm06IHNlbGYuX3RyYW5zZm9ybSB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBjaGVjayhcbiAgICAgICAgbmV3T3B0aW9ucyxcbiAgICAgICAgTWF0Y2guT3B0aW9uYWwoXG4gICAgICAgICAgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcbiAgICAgICAgICAgIHByb2plY3Rpb246IE1hdGNoLk9wdGlvbmFsKE1hdGNoLk9uZU9mKE9iamVjdCwgdW5kZWZpbmVkKSksXG4gICAgICAgICAgICBzb3J0OiBNYXRjaC5PcHRpb25hbChcbiAgICAgICAgICAgICAgTWF0Y2guT25lT2YoT2JqZWN0LCBBcnJheSwgRnVuY3Rpb24sIHVuZGVmaW5lZClcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBsaW1pdDogTWF0Y2guT3B0aW9uYWwoTWF0Y2guT25lT2YoTnVtYmVyLCB1bmRlZmluZWQpKSxcbiAgICAgICAgICAgIHNraXA6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLk9uZU9mKE51bWJlciwgdW5kZWZpbmVkKSksXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHJhbnNmb3JtOiBzZWxmLl90cmFuc2Zvcm0sXG4gICAgICAgIC4uLm5ld09wdGlvbnMsXG4gICAgICB9O1xuICAgIH1cbiAgfSxcbn0pO1xuXG5PYmplY3QuYXNzaWduKE1vbmdvLkNvbGxlY3Rpb24sIHtcbiAgYXN5bmMgX3B1Ymxpc2hDdXJzb3IoY3Vyc29yLCBzdWIsIGNvbGxlY3Rpb24pIHtcbiAgICB2YXIgb2JzZXJ2ZUhhbmRsZSA9IGF3YWl0IGN1cnNvci5vYnNlcnZlQ2hhbmdlcyhcbiAgICAgICAge1xuICAgICAgICAgIGFkZGVkOiBmdW5jdGlvbihpZCwgZmllbGRzKSB7XG4gICAgICAgICAgICBzdWIuYWRkZWQoY29sbGVjdGlvbiwgaWQsIGZpZWxkcyk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBjaGFuZ2VkOiBmdW5jdGlvbihpZCwgZmllbGRzKSB7XG4gICAgICAgICAgICBzdWIuY2hhbmdlZChjb2xsZWN0aW9uLCBpZCwgZmllbGRzKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlbW92ZWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICBzdWIucmVtb3ZlZChjb2xsZWN0aW9uLCBpZCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gUHVibGljYXRpb25zIGRvbid0IG11dGF0ZSB0aGUgZG9jdW1lbnRzXG4gICAgICAgIC8vIFRoaXMgaXMgdGVzdGVkIGJ5IHRoZSBgbGl2ZWRhdGEgLSBwdWJsaXNoIGNhbGxiYWNrcyBjbG9uZWAgdGVzdFxuICAgICAgICB7IG5vbk11dGF0aW5nQ2FsbGJhY2tzOiB0cnVlIH1cbiAgICApO1xuXG4gICAgLy8gV2UgZG9uJ3QgY2FsbCBzdWIucmVhZHkoKSBoZXJlOiBpdCBnZXRzIGNhbGxlZCBpbiBsaXZlZGF0YV9zZXJ2ZXIsIGFmdGVyXG4gICAgLy8gcG9zc2libHkgY2FsbGluZyBfcHVibGlzaEN1cnNvciBvbiBtdWx0aXBsZSByZXR1cm5lZCBjdXJzb3JzLlxuXG4gICAgLy8gcmVnaXN0ZXIgc3RvcCBjYWxsYmFjayAoZXhwZWN0cyBsYW1iZGEgdy8gbm8gYXJncykuXG4gICAgc3ViLm9uU3RvcChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhd2FpdCBvYnNlcnZlSGFuZGxlLnN0b3AoKTtcbiAgICB9KTtcblxuICAgIC8vIHJldHVybiB0aGUgb2JzZXJ2ZUhhbmRsZSBpbiBjYXNlIGl0IG5lZWRzIHRvIGJlIHN0b3BwZWQgZWFybHlcbiAgICByZXR1cm4gb2JzZXJ2ZUhhbmRsZTtcbiAgfSxcblxuICAvLyBwcm90ZWN0IGFnYWluc3QgZGFuZ2Vyb3VzIHNlbGVjdG9ycy4gIGZhbHNleSBhbmQge19pZDogZmFsc2V5fSBhcmUgYm90aFxuICAvLyBsaWtlbHkgcHJvZ3JhbW1lciBlcnJvciwgYW5kIG5vdCB3aGF0IHlvdSB3YW50LCBwYXJ0aWN1bGFybHkgZm9yIGRlc3RydWN0aXZlXG4gIC8vIG9wZXJhdGlvbnMuIElmIGEgZmFsc2V5IF9pZCBpcyBzZW50IGluLCBhIG5ldyBzdHJpbmcgX2lkIHdpbGwgYmVcbiAgLy8gZ2VuZXJhdGVkIGFuZCByZXR1cm5lZDsgaWYgYSBmYWxsYmFja0lkIGlzIHByb3ZpZGVkLCBpdCB3aWxsIGJlIHJldHVybmVkXG4gIC8vIGluc3RlYWQuXG4gIF9yZXdyaXRlU2VsZWN0b3Ioc2VsZWN0b3IsIHsgZmFsbGJhY2tJZCB9ID0ge30pIHtcbiAgICAvLyBzaG9ydGhhbmQgLS0gc2NhbGFycyBtYXRjaCBfaWRcbiAgICBpZiAoTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWQoc2VsZWN0b3IpKSBzZWxlY3RvciA9IHsgX2lkOiBzZWxlY3RvciB9O1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc2VsZWN0b3IpKSB7XG4gICAgICAvLyBUaGlzIGlzIGNvbnNpc3RlbnQgd2l0aCB0aGUgTW9uZ28gY29uc29sZSBpdHNlbGY7IGlmIHdlIGRvbid0IGRvIHRoaXNcbiAgICAgIC8vIGNoZWNrIHBhc3NpbmcgYW4gZW1wdHkgYXJyYXkgZW5kcyB1cCBzZWxlY3RpbmcgYWxsIGl0ZW1zXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNb25nbyBzZWxlY3RvciBjYW4ndCBiZSBhbiBhcnJheS5cIik7XG4gICAgfVxuXG4gICAgaWYgKCFzZWxlY3RvciB8fCAoJ19pZCcgaW4gc2VsZWN0b3IgJiYgIXNlbGVjdG9yLl9pZCkpIHtcbiAgICAgIC8vIGNhbid0IG1hdGNoIGFueXRoaW5nXG4gICAgICByZXR1cm4geyBfaWQ6IGZhbGxiYWNrSWQgfHwgUmFuZG9tLmlkKCkgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZWN0b3I7XG4gIH0sXG5cbiAgLy8gQ29sbGVjdGlvbiBFeHRlbnNpb25zIEFQSSAtIGRlbGVnYXRlIHRvIENvbGxlY3Rpb25FeHRlbnNpb25zXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBBZGQgYSBjb25zdHJ1Y3RvciBleHRlbnNpb24gZnVuY3Rpb24gdGhhdCBydW5zIHdoZW4gY29sbGVjdGlvbnMgYXJlIGNyZWF0ZWQuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyb2YgTW9uZ28uQ29sbGVjdGlvblxuICAgKiBAc3RhdGljXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGV4dGVuc2lvbiBFeHRlbnNpb24gZnVuY3Rpb24gY2FsbGVkIHdpdGggKG5hbWUsIG9wdGlvbnMpIGFuZCAndGhpcycgYm91bmQgdG8gY29sbGVjdGlvbiBpbnN0YW5jZVxuICAgKi9cbiAgYWRkRXh0ZW5zaW9uKGV4dGVuc2lvbikge1xuICAgIHJldHVybiBDb2xsZWN0aW9uRXh0ZW5zaW9ucy5hZGRFeHRlbnNpb24oZXh0ZW5zaW9uKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQWRkIGEgcHJvdG90eXBlIG1ldGhvZCB0byBhbGwgY29sbGVjdGlvbiBpbnN0YW5jZXMuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyb2YgTW9uZ28uQ29sbGVjdGlvblxuICAgKiBAc3RhdGljXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBtZXRob2QgdG8gYWRkXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG1ldGhvZCBUaGUgbWV0aG9kIGZ1bmN0aW9uLCBib3VuZCB0byB0aGUgY29sbGVjdGlvbiBpbnN0YW5jZVxuICAgKi9cbiAgYWRkUHJvdG90eXBlTWV0aG9kKG5hbWUsIG1ldGhvZCkge1xuICAgIHJldHVybiBDb2xsZWN0aW9uRXh0ZW5zaW9ucy5hZGRQcm90b3R5cGVNZXRob2QobmFtZSwgbWV0aG9kKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQWRkIGEgc3RhdGljIG1ldGhvZCB0byB0aGUgTW9uZ28uQ29sbGVjdGlvbiBjb25zdHJ1Y3Rvci5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBzdGF0aWNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHN0YXRpYyBtZXRob2QgdG8gYWRkXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG1ldGhvZCBUaGUgc3RhdGljIG1ldGhvZCBmdW5jdGlvblxuICAgKi9cbiAgYWRkU3RhdGljTWV0aG9kKG5hbWUsIG1ldGhvZCkge1xuICAgIHJldHVybiBDb2xsZWN0aW9uRXh0ZW5zaW9ucy5hZGRTdGF0aWNNZXRob2QobmFtZSwgbWV0aG9kKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgUmVtb3ZlIGEgY29uc3RydWN0b3IgZXh0ZW5zaW9uICh1c2VmdWwgZm9yIHRlc3RpbmcpLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQHN0YXRpY1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBleHRlbnNpb24gVGhlIGV4dGVuc2lvbiBmdW5jdGlvbiB0byByZW1vdmVcbiAgICovXG4gIHJlbW92ZUV4dGVuc2lvbihleHRlbnNpb24pIHtcbiAgICByZXR1cm4gQ29sbGVjdGlvbkV4dGVuc2lvbnMucmVtb3ZlRXh0ZW5zaW9uKGV4dGVuc2lvbik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJlbW92ZSBhIHByb3RvdHlwZSBtZXRob2QgZnJvbSBhbGwgY29sbGVjdGlvbiBpbnN0YW5jZXMuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyb2YgTW9uZ28uQ29sbGVjdGlvblxuICAgKiBAc3RhdGljXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBtZXRob2QgdG8gcmVtb3ZlXG4gICAqL1xuICByZW1vdmVQcm90b3R5cGVNZXRob2QobmFtZSkge1xuICAgIHJldHVybiBDb2xsZWN0aW9uRXh0ZW5zaW9ucy5yZW1vdmVQcm90b3R5cGVNZXRob2QobmFtZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJlbW92ZSBhIHN0YXRpYyBtZXRob2QgZnJvbSB0aGUgTW9uZ28uQ29sbGVjdGlvbiBjb25zdHJ1Y3Rvci5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBzdGF0aWNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHN0YXRpYyBtZXRob2QgdG8gcmVtb3ZlXG4gICAqL1xuICByZW1vdmVTdGF0aWNNZXRob2QobmFtZSkge1xuICAgIHJldHVybiBDb2xsZWN0aW9uRXh0ZW5zaW9ucy5yZW1vdmVTdGF0aWNNZXRob2QobmFtZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IENsZWFyIGFsbCBleHRlbnNpb25zLCBwcm90b3R5cGUgbWV0aG9kcywgYW5kIHN0YXRpYyBtZXRob2RzICh1c2VmdWwgZm9yIHRlc3RpbmcpLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQHN0YXRpY1xuICAgKi9cbiAgY2xlYXJFeHRlbnNpb25zKCkge1xuICAgIHJldHVybiBDb2xsZWN0aW9uRXh0ZW5zaW9ucy5jbGVhckV4dGVuc2lvbnMoKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgR2V0IGFsbCByZWdpc3RlcmVkIGNvbnN0cnVjdG9yIGV4dGVuc2lvbnMgKHVzZWZ1bCBmb3IgZGVidWdnaW5nKS5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBzdGF0aWNcbiAgICogQHJldHVybnMge0FycmF5PEZ1bmN0aW9uPn0gQXJyYXkgb2YgcmVnaXN0ZXJlZCBleHRlbnNpb24gZnVuY3Rpb25zXG4gICAqL1xuICBnZXRFeHRlbnNpb25zKCkge1xuICAgIHJldHVybiBDb2xsZWN0aW9uRXh0ZW5zaW9ucy5nZXRFeHRlbnNpb25zKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IEdldCBhbGwgcmVnaXN0ZXJlZCBwcm90b3R5cGUgbWV0aG9kcyAodXNlZnVsIGZvciBkZWJ1Z2dpbmcpLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQHN0YXRpY1xuICAgKiBAcmV0dXJucyB7TWFwPFN0cmluZywgRnVuY3Rpb24+fSBNYXAgb2YgbWV0aG9kIG5hbWVzIHRvIGZ1bmN0aW9uc1xuICAgKi9cbiAgZ2V0UHJvdG90eXBlTWV0aG9kcygpIHtcbiAgICByZXR1cm4gQ29sbGVjdGlvbkV4dGVuc2lvbnMuZ2V0UHJvdG90eXBlTWV0aG9kcygpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBHZXQgYWxsIHJlZ2lzdGVyZWQgc3RhdGljIG1ldGhvZHMgKHVzZWZ1bCBmb3IgZGVidWdnaW5nKS5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBzdGF0aWNcbiAgICogQHJldHVybnMge01hcDxTdHJpbmcsIEZ1bmN0aW9uPn0gTWFwIG9mIG1ldGhvZCBuYW1lcyB0byBmdW5jdGlvbnNcbiAgICovXG4gIGdldFN0YXRpY01ldGhvZHMoKSB7XG4gICAgcmV0dXJuIENvbGxlY3Rpb25FeHRlbnNpb25zLmdldFN0YXRpY01ldGhvZHMoKTtcbiAgfVxufSk7XG5cbk9iamVjdC5hc3NpZ24oTW9uZ28uQ29sbGVjdGlvbi5wcm90b3R5cGUsIFJlcGxpY2F0aW9uTWV0aG9kcywgU3luY01ldGhvZHMsIEFzeW5jTWV0aG9kcywgSW5kZXhNZXRob2RzKTtcblxuT2JqZWN0LmFzc2lnbihNb25nby5Db2xsZWN0aW9uLnByb3RvdHlwZSwge1xuICAvLyBEZXRlcm1pbmUgaWYgdGhpcyBjb2xsZWN0aW9uIGlzIHNpbXBseSBhIG1pbmltb25nbyByZXByZXNlbnRhdGlvbiBvZiBhIHJlYWxcbiAgLy8gZGF0YWJhc2Ugb24gYW5vdGhlciBzZXJ2ZXJcbiAgX2lzUmVtb3RlQ29sbGVjdGlvbigpIHtcbiAgICAvLyBYWFggc2VlICNNZXRlb3JTZXJ2ZXJOdWxsXG4gICAgcmV0dXJuIHRoaXMuX2Nvbm5lY3Rpb24gJiYgdGhpcy5fY29ubmVjdGlvbiAhPT0gTWV0ZW9yLnNlcnZlcjtcbiAgfSxcblxuICBhc3luYyBkcm9wQ29sbGVjdGlvbkFzeW5jKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoIXNlbGYuX2NvbGxlY3Rpb24uZHJvcENvbGxlY3Rpb25Bc3luYylcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG9ubHkgY2FsbCBkcm9wQ29sbGVjdGlvbkFzeW5jIG9uIHNlcnZlciBjb2xsZWN0aW9ucycpO1xuICAgYXdhaXQgc2VsZi5fY29sbGVjdGlvbi5kcm9wQ29sbGVjdGlvbkFzeW5jKCk7XG4gIH0sXG5cbiAgYXN5bmMgY3JlYXRlQ2FwcGVkQ29sbGVjdGlvbkFzeW5jKGJ5dGVTaXplLCBtYXhEb2N1bWVudHMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKCEgYXdhaXQgc2VsZi5fY29sbGVjdGlvbi5jcmVhdGVDYXBwZWRDb2xsZWN0aW9uQXN5bmMpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdDYW4gb25seSBjYWxsIGNyZWF0ZUNhcHBlZENvbGxlY3Rpb25Bc3luYyBvbiBzZXJ2ZXIgY29sbGVjdGlvbnMnXG4gICAgICApO1xuICAgIGF3YWl0IHNlbGYuX2NvbGxlY3Rpb24uY3JlYXRlQ2FwcGVkQ29sbGVjdGlvbkFzeW5jKGJ5dGVTaXplLCBtYXhEb2N1bWVudHMpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIHRoZSBbYENvbGxlY3Rpb25gXShodHRwOi8vbW9uZ29kYi5naXRodWIuaW8vbm9kZS1tb25nb2RiLW5hdGl2ZS8zLjAvYXBpL0NvbGxlY3Rpb24uaHRtbCkgb2JqZWN0IGNvcnJlc3BvbmRpbmcgdG8gdGhpcyBjb2xsZWN0aW9uIGZyb20gdGhlIFtucG0gYG1vbmdvZGJgIGRyaXZlciBtb2R1bGVdKGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL21vbmdvZGIpIHdoaWNoIGlzIHdyYXBwZWQgYnkgYE1vbmdvLkNvbGxlY3Rpb25gLlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKi9cbiAgcmF3Q29sbGVjdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKCFzZWxmLl9jb2xsZWN0aW9uLnJhd0NvbGxlY3Rpb24pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG9ubHkgY2FsbCByYXdDb2xsZWN0aW9uIG9uIHNlcnZlciBjb2xsZWN0aW9ucycpO1xuICAgIH1cbiAgICByZXR1cm4gc2VsZi5fY29sbGVjdGlvbi5yYXdDb2xsZWN0aW9uKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJldHVybnMgdGhlIFtgRGJgXShodHRwOi8vbW9uZ29kYi5naXRodWIuaW8vbm9kZS1tb25nb2RiLW5hdGl2ZS8zLjAvYXBpL0RiLmh0bWwpIG9iamVjdCBjb3JyZXNwb25kaW5nIHRvIHRoaXMgY29sbGVjdGlvbidzIGRhdGFiYXNlIGNvbm5lY3Rpb24gZnJvbSB0aGUgW25wbSBgbW9uZ29kYmAgZHJpdmVyIG1vZHVsZV0oaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2UvbW9uZ29kYikgd2hpY2ggaXMgd3JhcHBlZCBieSBgTW9uZ28uQ29sbGVjdGlvbmAuXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQGluc3RhbmNlXG4gICAqL1xuICByYXdEYXRhYmFzZSgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKCEoc2VsZi5fZHJpdmVyLm1vbmdvICYmIHNlbGYuX2RyaXZlci5tb25nby5kYikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG9ubHkgY2FsbCByYXdEYXRhYmFzZSBvbiBzZXJ2ZXIgY29sbGVjdGlvbnMnKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlbGYuX2RyaXZlci5tb25nby5kYjtcbiAgfSxcbn0pO1xuXG5PYmplY3QuYXNzaWduKE1vbmdvLCB7XG4gIC8qKlxuICAgKiBAc3VtbWFyeSBSZXRyaWV2ZSBhIE1ldGVvciBjb2xsZWN0aW9uIGluc3RhbmNlIGJ5IG5hbWUuIE9ubHkgY29sbGVjdGlvbnMgZGVmaW5lZCB3aXRoIFtgbmV3IE1vbmdvLkNvbGxlY3Rpb24oLi4uKWBdKCNjb2xsZWN0aW9ucykgYXJlIGF2YWlsYWJsZSB3aXRoIHRoaXMgbWV0aG9kLiBGb3IgcGxhaW4gTW9uZ29EQiBjb2xsZWN0aW9ucywgeW91J2xsIHdhbnQgdG8gbG9vayBhdCBbYHJhd0RhdGFiYXNlKClgXSgjTW9uZ28tQ29sbGVjdGlvbi1yYXdEYXRhYmFzZSkuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyb2YgTW9uZ29cbiAgICogQHN0YXRpY1xuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBOYW1lIG9mIHlvdXIgY29sbGVjdGlvbiBhcyBpdCB3YXMgZGVmaW5lZCB3aXRoIGBuZXcgTW9uZ28uQ29sbGVjdGlvbigpYC5cbiAgICogQHJldHVybnMge01vbmdvLkNvbGxlY3Rpb24gfCB1bmRlZmluZWR9XG4gICAqL1xuICBnZXRDb2xsZWN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5fY29sbGVjdGlvbnMuZ2V0KG5hbWUpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBBIHJlY29yZCBvZiBhbGwgZGVmaW5lZCBNb25nby5Db2xsZWN0aW9uIGluc3RhbmNlcywgaW5kZXhlZCBieSBjb2xsZWN0aW9uIG5hbWUuXG4gICAqIEB0eXBlIHtNYXA8c3RyaW5nLCBNb25nby5Db2xsZWN0aW9uPn1cbiAgICogQG1lbWJlcm9mIE1vbmdvXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG4gIF9jb2xsZWN0aW9uczogbmV3IE1hcCgpLFxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBDb2xsZWN0aW9uIEV4dGVuc2lvbnMgQVBJXG4gICAqIEBtZW1iZXJvZiBNb25nb1xuICAgKiBAc3RhdGljXG4gICAqL1xuICBDb2xsZWN0aW9uRXh0ZW5zaW9uczogQ29sbGVjdGlvbkV4dGVuc2lvbnNcbn0pXG5cblxuXG4vKipcbiAqIEBzdW1tYXJ5IENyZWF0ZSBhIE1vbmdvLXN0eWxlIGBPYmplY3RJRGAuICBJZiB5b3UgZG9uJ3Qgc3BlY2lmeSBhIGBoZXhTdHJpbmdgLCB0aGUgYE9iamVjdElEYCB3aWxsIGJlIGdlbmVyYXRlZCByYW5kb21seSAobm90IHVzaW5nIE1vbmdvREIncyBJRCBjb25zdHJ1Y3Rpb24gcnVsZXMpLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAY2xhc3NcbiAqIEBwYXJhbSB7U3RyaW5nfSBbaGV4U3RyaW5nXSBPcHRpb25hbC4gIFRoZSAyNC1jaGFyYWN0ZXIgaGV4YWRlY2ltYWwgY29udGVudHMgb2YgdGhlIE9iamVjdElEIHRvIGNyZWF0ZVxuICovXG5Nb25nby5PYmplY3RJRCA9IE1vbmdvSUQuT2JqZWN0SUQ7XG5cbi8qKlxuICogQHN1bW1hcnkgVG8gY3JlYXRlIGEgY3Vyc29yLCB1c2UgZmluZC4gVG8gYWNjZXNzIHRoZSBkb2N1bWVudHMgaW4gYSBjdXJzb3IsIHVzZSBmb3JFYWNoLCBtYXAsIG9yIGZldGNoLlxuICogQGNsYXNzXG4gKiBAaW5zdGFuY2VOYW1lIGN1cnNvclxuICovXG5Nb25nby5DdXJzb3IgPSBMb2NhbENvbGxlY3Rpb24uQ3Vyc29yO1xuXG4vKipcbiAqIEBkZXByZWNhdGVkIGluIDAuOS4xXG4gKi9cbk1vbmdvLkNvbGxlY3Rpb24uQ3Vyc29yID0gTW9uZ28uQ3Vyc29yO1xuXG4vKipcbiAqIEBkZXByZWNhdGVkIGluIDAuOS4xXG4gKi9cbk1vbmdvLkNvbGxlY3Rpb24uT2JqZWN0SUQgPSBNb25nby5PYmplY3RJRDtcblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBpbiAwLjkuMVxuICovXG5NZXRlb3IuQ29sbGVjdGlvbiA9IE1vbmdvLkNvbGxlY3Rpb247XG5cblxuLy8gQWxsb3cgZGVueSBzdHVmZiBpcyBub3cgaW4gdGhlIGFsbG93LWRlbnkgcGFja2FnZVxuT2JqZWN0LmFzc2lnbihNb25nby5Db2xsZWN0aW9uLnByb3RvdHlwZSwgQWxsb3dEZW55LkNvbGxlY3Rpb25Qcm90b3R5cGUpO1xuIiwiZXhwb3J0IGNvbnN0IElEX0dFTkVSQVRPUlMgPSB7XG4gIE1PTkdPKG5hbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBzcmMgPSBuYW1lID8gRERQLnJhbmRvbVN0cmVhbSgnL2NvbGxlY3Rpb24vJyArIG5hbWUpIDogUmFuZG9tLmluc2VjdXJlO1xuICAgICAgcmV0dXJuIG5ldyBNb25nby5PYmplY3RJRChzcmMuaGV4U3RyaW5nKDI0KSk7XG4gICAgfVxuICB9LFxuICBTVFJJTkcobmFtZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IHNyYyA9IG5hbWUgPyBERFAucmFuZG9tU3RyZWFtKCcvY29sbGVjdGlvbi8nICsgbmFtZSkgOiBSYW5kb20uaW5zZWN1cmU7XG4gICAgICByZXR1cm4gc3JjLmlkKCk7XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBDb25uZWN0aW9uKG5hbWUsIG9wdGlvbnMpIHtcbiAgaWYgKCFuYW1lIHx8IG9wdGlvbnMuY29ubmVjdGlvbiA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGlmIChvcHRpb25zLmNvbm5lY3Rpb24pIHJldHVybiBvcHRpb25zLmNvbm5lY3Rpb247XG4gIHJldHVybiBNZXRlb3IuaXNDbGllbnQgPyBNZXRlb3IuY29ubmVjdGlvbiA6IE1ldGVvci5zZXJ2ZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXR1cERyaXZlcihuYW1lLCBjb25uZWN0aW9uLCBvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLl9kcml2ZXIpIHJldHVybiBvcHRpb25zLl9kcml2ZXI7XG5cbiAgaWYgKG5hbWUgJiZcbiAgICBjb25uZWN0aW9uID09PSBNZXRlb3Iuc2VydmVyICYmXG4gICAgdHlwZW9mIE1vbmdvSW50ZXJuYWxzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIE1vbmdvSW50ZXJuYWxzLmRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyKSB7XG4gICAgcmV0dXJuIE1vbmdvSW50ZXJuYWxzLmRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyKCk7XG4gIH1cblxuICBjb25zdCB7IExvY2FsQ29sbGVjdGlvbkRyaXZlciB9ID0gcmVxdWlyZSgnLi4vbG9jYWxfY29sbGVjdGlvbl9kcml2ZXIuanMnKTtcbiAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbkRyaXZlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldHVwQXV0b3B1Ymxpc2goY29sbGVjdGlvbiwgbmFtZSwgb3B0aW9ucykge1xuICBpZiAoUGFja2FnZS5hdXRvcHVibGlzaCAmJlxuICAgICFvcHRpb25zLl9wcmV2ZW50QXV0b3B1Ymxpc2ggJiZcbiAgICBjb2xsZWN0aW9uLl9jb25uZWN0aW9uICYmXG4gICAgY29sbGVjdGlvbi5fY29ubmVjdGlvbi5wdWJsaXNoKSB7XG4gICAgY29sbGVjdGlvbi5fY29ubmVjdGlvbi5wdWJsaXNoKG51bGwsICgpID0+IGNvbGxlY3Rpb24uZmluZCgpLCB7XG4gICAgICBpc19hdXRvOiB0cnVlXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldHVwTXV0YXRpb25NZXRob2RzKGNvbGxlY3Rpb24sIG5hbWUsIG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMuZGVmaW5lTXV0YXRpb25NZXRob2RzID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gIHRyeSB7XG4gICAgY29sbGVjdGlvbi5fZGVmaW5lTXV0YXRpb25NZXRob2RzKHtcbiAgICAgIHVzZUV4aXN0aW5nOiBvcHRpb25zLl9zdXBwcmVzc1NhbWVOYW1lRXJyb3IgPT09IHRydWVcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IubWVzc2FnZSA9PT0gYEEgbWV0aG9kIG5hbWVkICcvJHtuYW1lfS9pbnNlcnRBc3luYycgaXMgYWxyZWFkeSBkZWZpbmVkYCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGVyZSBpcyBhbHJlYWR5IGEgY29sbGVjdGlvbiBuYW1lZCBcIiR7bmFtZX1cImApO1xuICAgIH1cbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVDb2xsZWN0aW9uTmFtZShuYW1lKSB7XG4gIGlmICghbmFtZSAmJiBuYW1lICE9PSBudWxsKSB7XG4gICAgTWV0ZW9yLl9kZWJ1ZyhcbiAgICAgICdXYXJuaW5nOiBjcmVhdGluZyBhbm9ueW1vdXMgY29sbGVjdGlvbi4gSXQgd2lsbCBub3QgYmUgJyArXG4gICAgICAnc2F2ZWQgb3Igc3luY2hyb25pemVkIG92ZXIgdGhlIG5ldHdvcmsuIChQYXNzIG51bGwgZm9yICcgK1xuICAgICAgJ3RoZSBjb2xsZWN0aW9uIG5hbWUgdG8gdHVybiBvZmYgdGhpcyB3YXJuaW5nLiknXG4gICAgKTtcbiAgICBuYW1lID0gbnVsbDtcbiAgfVxuXG4gIGlmIChuYW1lICE9PSBudWxsICYmIHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdGaXJzdCBhcmd1bWVudCB0byBuZXcgTW9uZ28uQ29sbGVjdGlvbiBtdXN0IGJlIGEgc3RyaW5nIG9yIG51bGwnXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplT3B0aW9ucyhvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMubWV0aG9kcykge1xuICAgIC8vIEJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IGhhY2sgd2l0aCBvcmlnaW5hbCBzaWduYXR1cmVcbiAgICBvcHRpb25zID0geyBjb25uZWN0aW9uOiBvcHRpb25zIH07XG4gIH1cbiAgLy8gQmFja3dhcmRzIGNvbXBhdGliaWxpdHk6IFwiY29ubmVjdGlvblwiIHVzZWQgdG8gYmUgY2FsbGVkIFwibWFuYWdlclwiLlxuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLm1hbmFnZXIgJiYgIW9wdGlvbnMuY29ubmVjdGlvbikge1xuICAgIG9wdGlvbnMuY29ubmVjdGlvbiA9IG9wdGlvbnMubWFuYWdlcjtcbiAgfVxuXG4gIGNvbnN0IGNsZWFuZWRPcHRpb25zID0gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgIE9iamVjdC5lbnRyaWVzKG9wdGlvbnMgfHwge30pLmZpbHRlcigoW18sIHZdKSA9PiB2ICE9PSB1bmRlZmluZWQpLFxuICApO1xuXG4gIC8vIDIpIFNwcmVhZCBkZWZhdWx0cyBmaXJzdCwgdGhlbiBvbmx5IHRoZSBkZWZpbmVkIG92ZXJyaWRlc1xuICByZXR1cm4ge1xuICAgIGNvbm5lY3Rpb246IHVuZGVmaW5lZCxcbiAgICBpZEdlbmVyYXRpb246ICdTVFJJTkcnLFxuICAgIHRyYW5zZm9ybTogbnVsbCxcbiAgICBfZHJpdmVyOiB1bmRlZmluZWQsXG4gICAgX3ByZXZlbnRBdXRvcHVibGlzaDogZmFsc2UsXG4gICAgLi4uY2xlYW5lZE9wdGlvbnMsXG4gIH07XG59XG4iLCJleHBvcnQgY29uc3QgQXN5bmNNZXRob2RzID0ge1xuICAvKipcbiAgICogQHN1bW1hcnkgRmluZHMgdGhlIGZpcnN0IGRvY3VtZW50IHRoYXQgbWF0Y2hlcyB0aGUgc2VsZWN0b3IsIGFzIG9yZGVyZWQgYnkgc29ydCBhbmQgc2tpcCBvcHRpb25zLiBSZXR1cm5zIGB1bmRlZmluZWRgIGlmIG5vIG1hdGNoaW5nIGRvY3VtZW50IGlzIGZvdW5kLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1ldGhvZCBmaW5kT25lQXN5bmNcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7TW9uZ29TZWxlY3Rvcn0gW3NlbGVjdG9yXSBBIHF1ZXJ5IGRlc2NyaWJpbmcgdGhlIGRvY3VtZW50cyB0byBmaW5kXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAgICogQHBhcmFtIHtNb25nb1NvcnRTcGVjaWZpZXJ9IG9wdGlvbnMuc29ydCBTb3J0IG9yZGVyIChkZWZhdWx0OiBuYXR1cmFsIG9yZGVyKVxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0aW9ucy5za2lwIE51bWJlciBvZiByZXN1bHRzIHRvIHNraXAgYXQgdGhlIGJlZ2lubmluZ1xuICAgKiBAcGFyYW0ge01vbmdvRmllbGRTcGVjaWZpZXJ9IG9wdGlvbnMuZmllbGRzIERpY3Rpb25hcnkgb2YgZmllbGRzIHRvIHJldHVybiBvciBleGNsdWRlLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMucmVhY3RpdmUgKENsaWVudCBvbmx5KSBEZWZhdWx0IHRydWU7IHBhc3MgZmFsc2UgdG8gZGlzYWJsZSByZWFjdGl2aXR5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdGlvbnMudHJhbnNmb3JtIE92ZXJyaWRlcyBgdHJhbnNmb3JtYCBvbiB0aGUgW2BDb2xsZWN0aW9uYF0oI2NvbGxlY3Rpb25zKSBmb3IgdGhpcyBjdXJzb3IuICBQYXNzIGBudWxsYCB0byBkaXNhYmxlIHRyYW5zZm9ybWF0aW9uLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5yZWFkUHJlZmVyZW5jZSAoU2VydmVyIG9ubHkpIFNwZWNpZmllcyBhIGN1c3RvbSBNb25nb0RCIFtgcmVhZFByZWZlcmVuY2VgXShodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL2NvcmUvcmVhZC1wcmVmZXJlbmNlKSBmb3IgZmV0Y2hpbmcgdGhlIGRvY3VtZW50LiBQb3NzaWJsZSB2YWx1ZXMgYXJlIGBwcmltYXJ5YCwgYHByaW1hcnlQcmVmZXJyZWRgLCBgc2Vjb25kYXJ5YCwgYHNlY29uZGFyeVByZWZlcnJlZGAgYW5kIGBuZWFyZXN0YC5cbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIGZpbmRPbmVBc3luYyguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb24uZmluZE9uZUFzeW5jKFxuICAgICAgdGhpcy5fZ2V0RmluZFNlbGVjdG9yKGFyZ3MpLFxuICAgICAgdGhpcy5fZ2V0RmluZE9wdGlvbnMoYXJncylcbiAgICApO1xuICB9LFxuXG4gIF9pbnNlcnRBc3luYyhkb2MsIG9wdGlvbnMgPSB7fSkge1xuICAgIC8vIE1ha2Ugc3VyZSB3ZSB3ZXJlIHBhc3NlZCBhIGRvY3VtZW50IHRvIGluc2VydFxuICAgIGlmICghZG9jKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luc2VydCByZXF1aXJlcyBhbiBhcmd1bWVudCcpO1xuICAgIH1cblxuICAgIC8vIE1ha2UgYSBzaGFsbG93IGNsb25lIG9mIHRoZSBkb2N1bWVudCwgcHJlc2VydmluZyBpdHMgcHJvdG90eXBlLlxuICAgIGRvYyA9IE9iamVjdC5jcmVhdGUoXG4gICAgICBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZG9jKSxcbiAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKGRvYylcbiAgICApO1xuXG4gICAgaWYgKCdfaWQnIGluIGRvYykge1xuICAgICAgaWYgKFxuICAgICAgICAhZG9jLl9pZCB8fFxuICAgICAgICAhKHR5cGVvZiBkb2MuX2lkID09PSAnc3RyaW5nJyB8fCBkb2MuX2lkIGluc3RhbmNlb2YgTW9uZ28uT2JqZWN0SUQpXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdNZXRlb3IgcmVxdWlyZXMgZG9jdW1lbnQgX2lkIGZpZWxkcyB0byBiZSBub24tZW1wdHkgc3RyaW5ncyBvciBPYmplY3RJRHMnXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBnZW5lcmF0ZUlkID0gdHJ1ZTtcblxuICAgICAgLy8gRG9uJ3QgZ2VuZXJhdGUgdGhlIGlkIGlmIHdlJ3JlIHRoZSBjbGllbnQgYW5kIHRoZSAnb3V0ZXJtb3N0JyBjYWxsXG4gICAgICAvLyBUaGlzIG9wdGltaXphdGlvbiBzYXZlcyB1cyBwYXNzaW5nIGJvdGggdGhlIHJhbmRvbVNlZWQgYW5kIHRoZSBpZFxuICAgICAgLy8gUGFzc2luZyBib3RoIGlzIHJlZHVuZGFudC5cbiAgICAgIGlmICh0aGlzLl9pc1JlbW90ZUNvbGxlY3Rpb24oKSkge1xuICAgICAgICBjb25zdCBlbmNsb3NpbmcgPSBERFAuX0N1cnJlbnRNZXRob2RJbnZvY2F0aW9uLmdldCgpO1xuICAgICAgICBpZiAoIWVuY2xvc2luZykge1xuICAgICAgICAgIGdlbmVyYXRlSWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZ2VuZXJhdGVJZCkge1xuICAgICAgICBkb2MuX2lkID0gdGhpcy5fbWFrZU5ld0lEKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gT24gaW5zZXJ0cywgYWx3YXlzIHJldHVybiB0aGUgaWQgdGhhdCB3ZSBnZW5lcmF0ZWQ7IG9uIGFsbCBvdGhlclxuICAgIC8vIG9wZXJhdGlvbnMsIGp1c3QgcmV0dXJuIHRoZSByZXN1bHQgZnJvbSB0aGUgY29sbGVjdGlvbi5cbiAgICB2YXIgY2hvb3NlUmV0dXJuVmFsdWVGcm9tQ29sbGVjdGlvblJlc3VsdCA9IGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgaWYgKE1ldGVvci5faXNQcm9taXNlKHJlc3VsdCkpIHJldHVybiByZXN1bHQ7XG5cbiAgICAgIGlmIChkb2MuX2lkKSB7XG4gICAgICAgIHJldHVybiBkb2MuX2lkO1xuICAgICAgfVxuXG4gICAgICAvLyBYWFggd2hhdCBpcyB0aGlzIGZvcj8/XG4gICAgICAvLyBJdCdzIHNvbWUgaXRlcmFjdGlvbiBiZXR3ZWVuIHRoZSBjYWxsYmFjayB0byBfY2FsbE11dGF0b3JNZXRob2QgYW5kXG4gICAgICAvLyB0aGUgcmV0dXJuIHZhbHVlIGNvbnZlcnNpb25cbiAgICAgIGRvYy5faWQgPSByZXN1bHQ7XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIGlmICh0aGlzLl9pc1JlbW90ZUNvbGxlY3Rpb24oKSkge1xuICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuX2NhbGxNdXRhdG9yTWV0aG9kQXN5bmMoJ2luc2VydEFzeW5jJywgW2RvY10sIG9wdGlvbnMpO1xuICAgICAgcHJvbWlzZS50aGVuKGNob29zZVJldHVyblZhbHVlRnJvbUNvbGxlY3Rpb25SZXN1bHQpO1xuICAgICAgcHJvbWlzZS5zdHViUHJvbWlzZSA9IHByb21pc2Uuc3R1YlByb21pc2UudGhlbihjaG9vc2VSZXR1cm5WYWx1ZUZyb21Db2xsZWN0aW9uUmVzdWx0KTtcbiAgICAgIHByb21pc2Uuc2VydmVyUHJvbWlzZSA9IHByb21pc2Uuc2VydmVyUHJvbWlzZS50aGVuKGNob29zZVJldHVyblZhbHVlRnJvbUNvbGxlY3Rpb25SZXN1bHQpO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgLy8gaXQncyBteSBjb2xsZWN0aW9uLiAgZGVzY2VuZCBpbnRvIHRoZSBjb2xsZWN0aW9uIG9iamVjdFxuICAgIC8vIGFuZCBwcm9wYWdhdGUgYW55IGV4Y2VwdGlvbi5cbiAgICByZXR1cm4gdGhpcy5fY29sbGVjdGlvbi5pbnNlcnRBc3luYyhkb2MpXG4gICAgICAudGhlbihjaG9vc2VSZXR1cm5WYWx1ZUZyb21Db2xsZWN0aW9uUmVzdWx0KTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgSW5zZXJ0IGEgZG9jdW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24uICBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGwgcmV0dXJuIHRoZSBkb2N1bWVudCdzIHVuaXF1ZSBfaWQgd2hlbiBzb2x2ZWQuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWV0aG9kICBpbnNlcnRcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkb2MgVGhlIGRvY3VtZW50IHRvIGluc2VydC4gTWF5IG5vdCB5ZXQgaGF2ZSBhbiBfaWQgYXR0cmlidXRlLCBpbiB3aGljaCBjYXNlIE1ldGVvciB3aWxsIGdlbmVyYXRlIG9uZSBmb3IgeW91LlxuICAgKi9cbiAgaW5zZXJ0QXN5bmMoZG9jLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuX2luc2VydEFzeW5jKGRvYywgb3B0aW9ucyk7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHN1bW1hcnkgTW9kaWZ5IG9uZSBvciBtb3JlIGRvY3VtZW50cyBpbiB0aGUgY29sbGVjdGlvbi4gUmV0dXJucyB0aGUgbnVtYmVyIG9mIG1hdGNoZWQgZG9jdW1lbnRzLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1ldGhvZCB1cGRhdGVcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7TW9uZ29TZWxlY3Rvcn0gc2VsZWN0b3IgU3BlY2lmaWVzIHdoaWNoIGRvY3VtZW50cyB0byBtb2RpZnlcbiAgICogQHBhcmFtIHtNb25nb01vZGlmaWVyfSBtb2RpZmllciBTcGVjaWZpZXMgaG93IHRvIG1vZGlmeSB0aGUgZG9jdW1lbnRzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAgICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLm11bHRpIFRydWUgdG8gbW9kaWZ5IGFsbCBtYXRjaGluZyBkb2N1bWVudHM7IGZhbHNlIHRvIG9ubHkgbW9kaWZ5IG9uZSBvZiB0aGUgbWF0Y2hpbmcgZG9jdW1lbnRzICh0aGUgZGVmYXVsdCkuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy51cHNlcnQgVHJ1ZSB0byBpbnNlcnQgYSBkb2N1bWVudCBpZiBubyBtYXRjaGluZyBkb2N1bWVudHMgYXJlIGZvdW5kLlxuICAgKiBAcGFyYW0ge0FycmF5fSBvcHRpb25zLmFycmF5RmlsdGVycyBPcHRpb25hbC4gVXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIE1vbmdvREIgW2ZpbHRlcmVkIHBvc2l0aW9uYWwgb3BlcmF0b3JdKGh0dHBzOi8vZG9jcy5tb25nb2RiLmNvbS9tYW51YWwvcmVmZXJlbmNlL29wZXJhdG9yL3VwZGF0ZS9wb3NpdGlvbmFsLWZpbHRlcmVkLykgdG8gc3BlY2lmeSB3aGljaCBlbGVtZW50cyB0byBtb2RpZnkgaW4gYW4gYXJyYXkgZmllbGQuXG4gICAqL1xuICB1cGRhdGVBc3luYyhzZWxlY3RvciwgbW9kaWZpZXIsIC4uLm9wdGlvbnNBbmRDYWxsYmFjaykge1xuXG4gICAgLy8gV2UndmUgYWxyZWFkeSBwb3BwZWQgb2ZmIHRoZSBjYWxsYmFjaywgc28gd2UgYXJlIGxlZnQgd2l0aCBhbiBhcnJheVxuICAgIC8vIG9mIG9uZSBvciB6ZXJvIGl0ZW1zXG4gICAgY29uc3Qgb3B0aW9ucyA9IHsgLi4uKG9wdGlvbnNBbmRDYWxsYmFja1swXSB8fCBudWxsKSB9O1xuICAgIGxldCBpbnNlcnRlZElkO1xuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMudXBzZXJ0KSB7XG4gICAgICAvLyBzZXQgYGluc2VydGVkSWRgIGlmIGFic2VudC4gIGBpbnNlcnRlZElkYCBpcyBhIE1ldGVvciBleHRlbnNpb24uXG4gICAgICBpZiAob3B0aW9ucy5pbnNlcnRlZElkKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAhKFxuICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMuaW5zZXJ0ZWRJZCA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgICAgIG9wdGlvbnMuaW5zZXJ0ZWRJZCBpbnN0YW5jZW9mIE1vbmdvLk9iamVjdElEXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnNlcnRlZElkIG11c3QgYmUgc3RyaW5nIG9yIE9iamVjdElEJyk7XG4gICAgICAgIGluc2VydGVkSWQgPSBvcHRpb25zLmluc2VydGVkSWQ7XG4gICAgICB9IGVsc2UgaWYgKCFzZWxlY3RvciB8fCAhc2VsZWN0b3IuX2lkKSB7XG4gICAgICAgIGluc2VydGVkSWQgPSB0aGlzLl9tYWtlTmV3SUQoKTtcbiAgICAgICAgb3B0aW9ucy5nZW5lcmF0ZWRJZCA9IHRydWU7XG4gICAgICAgIG9wdGlvbnMuaW5zZXJ0ZWRJZCA9IGluc2VydGVkSWQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2VsZWN0b3IgPSBNb25nby5Db2xsZWN0aW9uLl9yZXdyaXRlU2VsZWN0b3Ioc2VsZWN0b3IsIHtcbiAgICAgIGZhbGxiYWNrSWQ6IGluc2VydGVkSWQsXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5faXNSZW1vdGVDb2xsZWN0aW9uKCkpIHtcbiAgICAgIGNvbnN0IGFyZ3MgPSBbc2VsZWN0b3IsIG1vZGlmaWVyLCBvcHRpb25zXTtcblxuICAgICAgcmV0dXJuIHRoaXMuX2NhbGxNdXRhdG9yTWV0aG9kQXN5bmMoJ3VwZGF0ZUFzeW5jJywgYXJncywgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8gaXQncyBteSBjb2xsZWN0aW9uLiAgZGVzY2VuZCBpbnRvIHRoZSBjb2xsZWN0aW9uIG9iamVjdFxuICAgIC8vIGFuZCBwcm9wYWdhdGUgYW55IGV4Y2VwdGlvbi5cbiAgICAvLyBJZiB0aGUgdXNlciBwcm92aWRlZCBhIGNhbGxiYWNrIGFuZCB0aGUgY29sbGVjdGlvbiBpbXBsZW1lbnRzIHRoaXNcbiAgICAvLyBvcGVyYXRpb24gYXN5bmNocm9ub3VzbHksIHRoZW4gcXVlcnlSZXQgd2lsbCBiZSB1bmRlZmluZWQsIGFuZCB0aGVcbiAgICAvLyByZXN1bHQgd2lsbCBiZSByZXR1cm5lZCB0aHJvdWdoIHRoZSBjYWxsYmFjayBpbnN0ZWFkLlxuXG4gICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb24udXBkYXRlQXN5bmMoXG4gICAgICBzZWxlY3RvcixcbiAgICAgIG1vZGlmaWVyLFxuICAgICAgb3B0aW9uc1xuICAgICk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IEFzeW5jaHJvbm91c2x5IHJlbW92ZXMgZG9jdW1lbnRzIGZyb20gdGhlIGNvbGxlY3Rpb24uXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWV0aG9kIHJlbW92ZVxuICAgKiBAbWVtYmVyb2YgTW9uZ28uQ29sbGVjdGlvblxuICAgKiBAaW5zdGFuY2VcbiAgICogQHBhcmFtIHtNb25nb1NlbGVjdG9yfSBzZWxlY3RvciBTcGVjaWZpZXMgd2hpY2ggZG9jdW1lbnRzIHRvIHJlbW92ZVxuICAgKi9cbiAgcmVtb3ZlQXN5bmMoc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSkge1xuICAgIHNlbGVjdG9yID0gTW9uZ28uQ29sbGVjdGlvbi5fcmV3cml0ZVNlbGVjdG9yKHNlbGVjdG9yKTtcblxuICAgIGlmICh0aGlzLl9pc1JlbW90ZUNvbGxlY3Rpb24oKSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NhbGxNdXRhdG9yTWV0aG9kQXN5bmMoJ3JlbW92ZUFzeW5jJywgW3NlbGVjdG9yXSwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8gaXQncyBteSBjb2xsZWN0aW9uLiAgZGVzY2VuZCBpbnRvIHRoZSBjb2xsZWN0aW9uMSBvYmplY3RcbiAgICAvLyBhbmQgcHJvcGFnYXRlIGFueSBleGNlcHRpb24uXG4gICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb24ucmVtb3ZlQXN5bmMoc2VsZWN0b3IpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBBc3luY2hyb25vdXNseSBtb2RpZmllcyBvbmUgb3IgbW9yZSBkb2N1bWVudHMgaW4gdGhlIGNvbGxlY3Rpb24sIG9yIGluc2VydCBvbmUgaWYgbm8gbWF0Y2hpbmcgZG9jdW1lbnRzIHdlcmUgZm91bmQuIFJldHVybnMgYW4gb2JqZWN0IHdpdGgga2V5cyBgbnVtYmVyQWZmZWN0ZWRgICh0aGUgbnVtYmVyIG9mIGRvY3VtZW50cyBtb2RpZmllZCkgIGFuZCBgaW5zZXJ0ZWRJZGAgKHRoZSB1bmlxdWUgX2lkIG9mIHRoZSBkb2N1bWVudCB0aGF0IHdhcyBpbnNlcnRlZCwgaWYgYW55KS5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZXRob2QgdXBzZXJ0XG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge01vbmdvU2VsZWN0b3J9IHNlbGVjdG9yIFNwZWNpZmllcyB3aGljaCBkb2N1bWVudHMgdG8gbW9kaWZ5XG4gICAqIEBwYXJhbSB7TW9uZ29Nb2RpZmllcn0gbW9kaWZpZXIgU3BlY2lmaWVzIGhvdyB0byBtb2RpZnkgdGhlIGRvY3VtZW50c1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5tdWx0aSBUcnVlIHRvIG1vZGlmeSBhbGwgbWF0Y2hpbmcgZG9jdW1lbnRzOyBmYWxzZSB0byBvbmx5IG1vZGlmeSBvbmUgb2YgdGhlIG1hdGNoaW5nIGRvY3VtZW50cyAodGhlIGRlZmF1bHQpLlxuICAgKi9cbiAgYXN5bmMgdXBzZXJ0QXN5bmMoc2VsZWN0b3IsIG1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlQXN5bmMoXG4gICAgICBzZWxlY3RvcixcbiAgICAgIG1vZGlmaWVyLFxuICAgICAge1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICBfcmV0dXJuT2JqZWN0OiB0cnVlLFxuICAgICAgICB1cHNlcnQ6IHRydWUsXG4gICAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgR2V0cyB0aGUgbnVtYmVyIG9mIGRvY3VtZW50cyBtYXRjaGluZyB0aGUgZmlsdGVyLiBGb3IgYSBmYXN0IGNvdW50IG9mIHRoZSB0b3RhbCBkb2N1bWVudHMgaW4gYSBjb2xsZWN0aW9uIHNlZSBgZXN0aW1hdGVkRG9jdW1lbnRDb3VudGAuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWV0aG9kIGNvdW50RG9jdW1lbnRzXG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge01vbmdvU2VsZWN0b3J9IFtzZWxlY3Rvcl0gQSBxdWVyeSBkZXNjcmliaW5nIHRoZSBkb2N1bWVudHMgdG8gY291bnRcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBBbGwgb3B0aW9ucyBhcmUgbGlzdGVkIGluIFtNb25nb0RCIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vbW9uZ29kYi5naXRodWIuaW8vbm9kZS1tb25nb2RiLW5hdGl2ZS80LjExL2ludGVyZmFjZXMvQ291bnREb2N1bWVudHNPcHRpb25zLmh0bWwpLiBQbGVhc2Ugbm90ZSB0aGF0IG5vdCBhbGwgb2YgdGhlbSBhcmUgYXZhaWxhYmxlIG9uIHRoZSBjbGllbnQuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPG51bWJlcj59XG4gICAqL1xuICBjb3VudERvY3VtZW50cyguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb24uY291bnREb2N1bWVudHMoLi4uYXJncyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IEdldHMgYW4gZXN0aW1hdGUgb2YgdGhlIGNvdW50IG9mIGRvY3VtZW50cyBpbiBhIGNvbGxlY3Rpb24gdXNpbmcgY29sbGVjdGlvbiBtZXRhZGF0YS4gRm9yIGFuIGV4YWN0IGNvdW50IG9mIHRoZSBkb2N1bWVudHMgaW4gYSBjb2xsZWN0aW9uIHNlZSBgY291bnREb2N1bWVudHNgLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1ldGhvZCBlc3RpbWF0ZWREb2N1bWVudENvdW50XG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIEFsbCBvcHRpb25zIGFyZSBsaXN0ZWQgaW4gW01vbmdvREIgZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9tb25nb2RiLmdpdGh1Yi5pby9ub2RlLW1vbmdvZGItbmF0aXZlLzQuMTEvaW50ZXJmYWNlcy9Fc3RpbWF0ZWREb2N1bWVudENvdW50T3B0aW9ucy5odG1sKS4gUGxlYXNlIG5vdGUgdGhhdCBub3QgYWxsIG9mIHRoZW0gYXJlIGF2YWlsYWJsZSBvbiB0aGUgY2xpZW50LlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTxudW1iZXI+fVxuICAgKi9cbiAgZXN0aW1hdGVkRG9jdW1lbnRDb3VudCguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb24uZXN0aW1hdGVkRG9jdW1lbnRDb3VudCguLi5hcmdzKTtcbiAgfSxcbn0iLCJpbXBvcnQgeyBMb2cgfSBmcm9tICdtZXRlb3IvbG9nZ2luZyc7XG5cbmV4cG9ydCBjb25zdCBJbmRleE1ldGhvZHMgPSB7XG4gIC8vIFdlJ2xsIGFjdHVhbGx5IGRlc2lnbiBhbiBpbmRleCBBUEkgbGF0ZXIuIEZvciBub3csIHdlIGp1c3QgcGFzcyB0aHJvdWdoIHRvXG4gIC8vIE1vbmdvJ3MsIGJ1dCBtYWtlIGl0IHN5bmNocm9ub3VzLlxuICAvKipcbiAgICogQHN1bW1hcnkgQXN5bmNocm9ub3VzbHkgY3JlYXRlcyB0aGUgc3BlY2lmaWVkIGluZGV4IG9uIHRoZSBjb2xsZWN0aW9uLlxuICAgKiBAbG9jdXMgc2VydmVyXG4gICAqIEBtZXRob2QgZW5zdXJlSW5kZXhBc3luY1xuICAgKiBAZGVwcmVjYXRlZCBpbiAzLjBcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBpbmRleCBBIGRvY3VtZW50IHRoYXQgY29udGFpbnMgdGhlIGZpZWxkIGFuZCB2YWx1ZSBwYWlycyB3aGVyZSB0aGUgZmllbGQgaXMgdGhlIGluZGV4IGtleSBhbmQgdGhlIHZhbHVlIGRlc2NyaWJlcyB0aGUgdHlwZSBvZiBpbmRleCBmb3IgdGhhdCBmaWVsZC4gRm9yIGFuIGFzY2VuZGluZyBpbmRleCBvbiBhIGZpZWxkLCBzcGVjaWZ5IGEgdmFsdWUgb2YgYDFgOyBmb3IgZGVzY2VuZGluZyBpbmRleCwgc3BlY2lmeSBhIHZhbHVlIG9mIGAtMWAuIFVzZSBgdGV4dGAgZm9yIHRleHQgaW5kZXhlcy5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBBbGwgb3B0aW9ucyBhcmUgbGlzdGVkIGluIFtNb25nb0RCIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vZG9jcy5tb25nb2RiLmNvbS9tYW51YWwvcmVmZXJlbmNlL21ldGhvZC9kYi5jb2xsZWN0aW9uLmNyZWF0ZUluZGV4LyNvcHRpb25zKVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5uYW1lIE5hbWUgb2YgdGhlIGluZGV4XG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy51bmlxdWUgRGVmaW5lIHRoYXQgdGhlIGluZGV4IHZhbHVlcyBtdXN0IGJlIHVuaXF1ZSwgbW9yZSBhdCBbTW9uZ29EQiBkb2N1bWVudGF0aW9uXShodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL2NvcmUvaW5kZXgtdW5pcXVlLylcbiAgICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLnNwYXJzZSBEZWZpbmUgdGhhdCB0aGUgaW5kZXggaXMgc3BhcnNlLCBtb3JlIGF0IFtNb25nb0RCIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vZG9jcy5tb25nb2RiLmNvbS9tYW51YWwvY29yZS9pbmRleC1zcGFyc2UvKVxuICAgKi9cbiAgYXN5bmMgZW5zdXJlSW5kZXhBc3luYyhpbmRleCwgb3B0aW9ucykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoIXNlbGYuX2NvbGxlY3Rpb24uZW5zdXJlSW5kZXhBc3luYyB8fCAhc2VsZi5fY29sbGVjdGlvbi5jcmVhdGVJbmRleEFzeW5jKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW4gb25seSBjYWxsIGNyZWF0ZUluZGV4QXN5bmMgb24gc2VydmVyIGNvbGxlY3Rpb25zJyk7XG4gICAgaWYgKHNlbGYuX2NvbGxlY3Rpb24uY3JlYXRlSW5kZXhBc3luYykge1xuICAgICAgYXdhaXQgc2VsZi5fY29sbGVjdGlvbi5jcmVhdGVJbmRleEFzeW5jKGluZGV4LCBvcHRpb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nLmRlYnVnKGBlbnN1cmVJbmRleEFzeW5jIGhhcyBiZWVuIGRlcHJlY2F0ZWQsIHBsZWFzZSB1c2UgdGhlIG5ldyAnY3JlYXRlSW5kZXhBc3luYycgaW5zdGVhZCR7IG9wdGlvbnM/Lm5hbWUgPyBgLCBpbmRleCBuYW1lOiAkeyBvcHRpb25zLm5hbWUgfWAgOiBgLCBpbmRleDogJHsgSlNPTi5zdHJpbmdpZnkoaW5kZXgpIH1gIH1gKVxuICAgICAgYXdhaXQgc2VsZi5fY29sbGVjdGlvbi5lbnN1cmVJbmRleEFzeW5jKGluZGV4LCBvcHRpb25zKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IEFzeW5jaHJvbm91c2x5IGNyZWF0ZXMgdGhlIHNwZWNpZmllZCBpbmRleCBvbiB0aGUgY29sbGVjdGlvbi5cbiAgICogQGxvY3VzIHNlcnZlclxuICAgKiBAbWV0aG9kIGNyZWF0ZUluZGV4QXN5bmNcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBpbmRleCBBIGRvY3VtZW50IHRoYXQgY29udGFpbnMgdGhlIGZpZWxkIGFuZCB2YWx1ZSBwYWlycyB3aGVyZSB0aGUgZmllbGQgaXMgdGhlIGluZGV4IGtleSBhbmQgdGhlIHZhbHVlIGRlc2NyaWJlcyB0aGUgdHlwZSBvZiBpbmRleCBmb3IgdGhhdCBmaWVsZC4gRm9yIGFuIGFzY2VuZGluZyBpbmRleCBvbiBhIGZpZWxkLCBzcGVjaWZ5IGEgdmFsdWUgb2YgYDFgOyBmb3IgZGVzY2VuZGluZyBpbmRleCwgc3BlY2lmeSBhIHZhbHVlIG9mIGAtMWAuIFVzZSBgdGV4dGAgZm9yIHRleHQgaW5kZXhlcy5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBBbGwgb3B0aW9ucyBhcmUgbGlzdGVkIGluIFtNb25nb0RCIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vZG9jcy5tb25nb2RiLmNvbS9tYW51YWwvcmVmZXJlbmNlL21ldGhvZC9kYi5jb2xsZWN0aW9uLmNyZWF0ZUluZGV4LyNvcHRpb25zKVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5uYW1lIE5hbWUgb2YgdGhlIGluZGV4XG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy51bmlxdWUgRGVmaW5lIHRoYXQgdGhlIGluZGV4IHZhbHVlcyBtdXN0IGJlIHVuaXF1ZSwgbW9yZSBhdCBbTW9uZ29EQiBkb2N1bWVudGF0aW9uXShodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL2NvcmUvaW5kZXgtdW5pcXVlLylcbiAgICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLnNwYXJzZSBEZWZpbmUgdGhhdCB0aGUgaW5kZXggaXMgc3BhcnNlLCBtb3JlIGF0IFtNb25nb0RCIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vZG9jcy5tb25nb2RiLmNvbS9tYW51YWwvY29yZS9pbmRleC1zcGFyc2UvKVxuICAgKi9cbiAgYXN5bmMgY3JlYXRlSW5kZXhBc3luYyhpbmRleCwgb3B0aW9ucykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoIXNlbGYuX2NvbGxlY3Rpb24uY3JlYXRlSW5kZXhBc3luYylcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG9ubHkgY2FsbCBjcmVhdGVJbmRleEFzeW5jIG9uIHNlcnZlciBjb2xsZWN0aW9ucycpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHNlbGYuX2NvbGxlY3Rpb24uY3JlYXRlSW5kZXhBc3luYyhpbmRleCwgb3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKFxuICAgICAgICBlLm1lc3NhZ2UuaW5jbHVkZXMoXG4gICAgICAgICAgJ0FuIGVxdWl2YWxlbnQgaW5kZXggYWxyZWFkeSBleGlzdHMgd2l0aCB0aGUgc2FtZSBuYW1lIGJ1dCBkaWZmZXJlbnQgb3B0aW9ucy4nXG4gICAgICAgICkgJiZcbiAgICAgICAgTWV0ZW9yLnNldHRpbmdzPy5wYWNrYWdlcz8ubW9uZ28/LnJlQ3JlYXRlSW5kZXhPbk9wdGlvbk1pc21hdGNoXG4gICAgICApIHtcbiAgICAgICAgTG9nLmluZm8oYFJlLWNyZWF0aW5nIGluZGV4ICR7IGluZGV4IH0gZm9yICR7IHNlbGYuX25hbWUgfSBkdWUgdG8gb3B0aW9ucyBtaXNtYXRjaC5gKTtcbiAgICAgICAgYXdhaXQgc2VsZi5fY29sbGVjdGlvbi5kcm9wSW5kZXhBc3luYyhpbmRleCk7XG4gICAgICAgIGF3YWl0IHNlbGYuX2NvbGxlY3Rpb24uY3JlYXRlSW5kZXhBc3luYyhpbmRleCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGBBbiBlcnJvciBvY2N1cnJlZCB3aGVuIGNyZWF0aW5nIGFuIGluZGV4IGZvciBjb2xsZWN0aW9uIFwiJHsgc2VsZi5fbmFtZSB9OiAkeyBlLm1lc3NhZ2UgfWApO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQXN5bmNocm9ub3VzbHkgY3JlYXRlcyB0aGUgc3BlY2lmaWVkIGluZGV4IG9uIHRoZSBjb2xsZWN0aW9uLlxuICAgKiBAbG9jdXMgc2VydmVyXG4gICAqIEBtZXRob2QgY3JlYXRlSW5kZXhcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBpbmRleCBBIGRvY3VtZW50IHRoYXQgY29udGFpbnMgdGhlIGZpZWxkIGFuZCB2YWx1ZSBwYWlycyB3aGVyZSB0aGUgZmllbGQgaXMgdGhlIGluZGV4IGtleSBhbmQgdGhlIHZhbHVlIGRlc2NyaWJlcyB0aGUgdHlwZSBvZiBpbmRleCBmb3IgdGhhdCBmaWVsZC4gRm9yIGFuIGFzY2VuZGluZyBpbmRleCBvbiBhIGZpZWxkLCBzcGVjaWZ5IGEgdmFsdWUgb2YgYDFgOyBmb3IgZGVzY2VuZGluZyBpbmRleCwgc3BlY2lmeSBhIHZhbHVlIG9mIGAtMWAuIFVzZSBgdGV4dGAgZm9yIHRleHQgaW5kZXhlcy5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBBbGwgb3B0aW9ucyBhcmUgbGlzdGVkIGluIFtNb25nb0RCIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vZG9jcy5tb25nb2RiLmNvbS9tYW51YWwvcmVmZXJlbmNlL21ldGhvZC9kYi5jb2xsZWN0aW9uLmNyZWF0ZUluZGV4LyNvcHRpb25zKVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5uYW1lIE5hbWUgb2YgdGhlIGluZGV4XG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy51bmlxdWUgRGVmaW5lIHRoYXQgdGhlIGluZGV4IHZhbHVlcyBtdXN0IGJlIHVuaXF1ZSwgbW9yZSBhdCBbTW9uZ29EQiBkb2N1bWVudGF0aW9uXShodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL2NvcmUvaW5kZXgtdW5pcXVlLylcbiAgICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLnNwYXJzZSBEZWZpbmUgdGhhdCB0aGUgaW5kZXggaXMgc3BhcnNlLCBtb3JlIGF0IFtNb25nb0RCIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vZG9jcy5tb25nb2RiLmNvbS9tYW51YWwvY29yZS9pbmRleC1zcGFyc2UvKVxuICAgKi9cbiAgY3JlYXRlSW5kZXgoaW5kZXgsIG9wdGlvbnMpe1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZUluZGV4QXN5bmMoaW5kZXgsIG9wdGlvbnMpO1xuICB9LFxuXG4gIGFzeW5jIGRyb3BJbmRleEFzeW5jKGluZGV4KSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICghc2VsZi5fY29sbGVjdGlvbi5kcm9wSW5kZXhBc3luYylcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG9ubHkgY2FsbCBkcm9wSW5kZXhBc3luYyBvbiBzZXJ2ZXIgY29sbGVjdGlvbnMnKTtcbiAgICBhd2FpdCBzZWxmLl9jb2xsZWN0aW9uLmRyb3BJbmRleEFzeW5jKGluZGV4KTtcbiAgfSxcbn1cbiIsImV4cG9ydCBjb25zdCBSZXBsaWNhdGlvbk1ldGhvZHMgPSB7XG4gIGFzeW5jIF9tYXliZVNldFVwUmVwbGljYXRpb24obmFtZSkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGlmIChcbiAgICAgICEoXG4gICAgICAgIHNlbGYuX2Nvbm5lY3Rpb24gJiZcbiAgICAgICAgc2VsZi5fY29ubmVjdGlvbi5yZWdpc3RlclN0b3JlQ2xpZW50ICYmXG4gICAgICAgIHNlbGYuX2Nvbm5lY3Rpb24ucmVnaXN0ZXJTdG9yZVNlcnZlclxuICAgICAgKVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuXG4gICAgY29uc3Qgd3JhcHBlZFN0b3JlQ29tbW9uID0ge1xuICAgICAgLy8gQ2FsbGVkIGFyb3VuZCBtZXRob2Qgc3R1YiBpbnZvY2F0aW9ucyB0byBjYXB0dXJlIHRoZSBvcmlnaW5hbCB2ZXJzaW9uc1xuICAgICAgLy8gb2YgbW9kaWZpZWQgZG9jdW1lbnRzLlxuICAgICAgc2F2ZU9yaWdpbmFscygpIHtcbiAgICAgICAgc2VsZi5fY29sbGVjdGlvbi5zYXZlT3JpZ2luYWxzKCk7XG4gICAgICB9LFxuICAgICAgcmV0cmlldmVPcmlnaW5hbHMoKSB7XG4gICAgICAgIHJldHVybiBzZWxmLl9jb2xsZWN0aW9uLnJldHJpZXZlT3JpZ2luYWxzKCk7XG4gICAgICB9LFxuICAgICAgLy8gVG8gYmUgYWJsZSB0byBnZXQgYmFjayB0byB0aGUgY29sbGVjdGlvbiBmcm9tIHRoZSBzdG9yZS5cbiAgICAgIF9nZXRDb2xsZWN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCB3cmFwcGVkU3RvcmVDbGllbnQgPSB7XG4gICAgICAvLyBDYWxsZWQgYXQgdGhlIGJlZ2lubmluZyBvZiBhIGJhdGNoIG9mIHVwZGF0ZXMuIGJhdGNoU2l6ZSBpcyB0aGUgbnVtYmVyXG4gICAgICAvLyBvZiB1cGRhdGUgY2FsbHMgdG8gZXhwZWN0LlxuICAgICAgLy9cbiAgICAgIC8vIFhYWCBUaGlzIGludGVyZmFjZSBpcyBwcmV0dHkgamFua3kuIHJlc2V0IHByb2JhYmx5IG91Z2h0IHRvIGdvIGJhY2sgdG9cbiAgICAgIC8vIGJlaW5nIGl0cyBvd24gZnVuY3Rpb24sIGFuZCBjYWxsZXJzIHNob3VsZG4ndCBoYXZlIHRvIGNhbGN1bGF0ZVxuICAgICAgLy8gYmF0Y2hTaXplLiBUaGUgb3B0aW1pemF0aW9uIG9mIG5vdCBjYWxsaW5nIHBhdXNlL3JlbW92ZSBzaG91bGQgYmVcbiAgICAgIC8vIGRlbGF5ZWQgdW50aWwgbGF0ZXI6IHRoZSBmaXJzdCBjYWxsIHRvIHVwZGF0ZSgpIHNob3VsZCBidWZmZXIgaXRzXG4gICAgICAvLyBtZXNzYWdlLCBhbmQgdGhlbiB3ZSBjYW4gZWl0aGVyIGRpcmVjdGx5IGFwcGx5IGl0IGF0IGVuZFVwZGF0ZSB0aW1lIGlmXG4gICAgICAvLyBpdCB3YXMgdGhlIG9ubHkgdXBkYXRlLCBvciBkbyBwYXVzZU9ic2VydmVycy9hcHBseS9hcHBseSBhdCB0aGUgbmV4dFxuICAgICAgLy8gdXBkYXRlKCkgaWYgdGhlcmUncyBhbm90aGVyIG9uZS5cbiAgICAgIGFzeW5jIGJlZ2luVXBkYXRlKGJhdGNoU2l6ZSwgcmVzZXQpIHtcbiAgICAgICAgLy8gcGF1c2Ugb2JzZXJ2ZXJzIHNvIHVzZXJzIGRvbid0IHNlZSBmbGlja2VyIHdoZW4gdXBkYXRpbmcgc2V2ZXJhbFxuICAgICAgICAvLyBvYmplY3RzIGF0IG9uY2UgKGluY2x1ZGluZyB0aGUgcG9zdC1yZWNvbm5lY3QgcmVzZXQtYW5kLXJlYXBwbHlcbiAgICAgICAgLy8gc3RhZ2UpLCBhbmQgc28gdGhhdCBhIHJlLXNvcnRpbmcgb2YgYSBxdWVyeSBjYW4gdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlXG4gICAgICAgIC8vIGZ1bGwgX2RpZmZRdWVyeSBtb3ZlZCBjYWxjdWxhdGlvbiBpbnN0ZWFkIG9mIGFwcGx5aW5nIGNoYW5nZSBvbmUgYXQgYVxuICAgICAgICAvLyB0aW1lLlxuICAgICAgICBpZiAoYmF0Y2hTaXplID4gMSB8fCByZXNldCkgc2VsZi5fY29sbGVjdGlvbi5wYXVzZU9ic2VydmVycygpO1xuXG4gICAgICAgIGlmIChyZXNldCkgYXdhaXQgc2VsZi5fY29sbGVjdGlvbi5yZW1vdmUoe30pO1xuICAgICAgfSxcblxuICAgICAgLy8gQXBwbHkgYW4gdXBkYXRlLlxuICAgICAgLy8gWFhYIGJldHRlciBzcGVjaWZ5IHRoaXMgaW50ZXJmYWNlIChub3QgaW4gdGVybXMgb2YgYSB3aXJlIG1lc3NhZ2UpP1xuICAgICAgdXBkYXRlKG1zZykge1xuICAgICAgICB2YXIgbW9uZ29JZCA9IE1vbmdvSUQuaWRQYXJzZShtc2cuaWQpO1xuICAgICAgICB2YXIgZG9jID0gc2VsZi5fY29sbGVjdGlvbi5fZG9jcy5nZXQobW9uZ29JZCk7XG5cbiAgICAgICAgLy9XaGVuIHRoZSBzZXJ2ZXIncyBtZXJnZWJveCBpcyBkaXNhYmxlZCBmb3IgYSBjb2xsZWN0aW9uLCB0aGUgY2xpZW50IG11c3QgZ3JhY2VmdWxseSBoYW5kbGUgaXQgd2hlbjpcbiAgICAgICAgLy8gKldlIHJlY2VpdmUgYW4gYWRkZWQgbWVzc2FnZSBmb3IgYSBkb2N1bWVudCB0aGF0IGlzIGFscmVhZHkgdGhlcmUuIEluc3RlYWQsIGl0IHdpbGwgYmUgY2hhbmdlZFxuICAgICAgICAvLyAqV2UgcmVlaXZlIGEgY2hhbmdlIG1lc3NhZ2UgZm9yIGEgZG9jdW1lbnQgdGhhdCBpcyBub3QgdGhlcmUuIEluc3RlYWQsIGl0IHdpbGwgYmUgYWRkZWRcbiAgICAgICAgLy8gKldlIHJlY2VpdmUgYSByZW1vdmVkIG1lc3NzYWdlIGZvciBhIGRvY3VtZW50IHRoYXQgaXMgbm90IHRoZXJlLiBJbnN0ZWFkLCBub3Rpbmcgd2lsIGhhcHBlbi5cblxuICAgICAgICAvL0NvZGUgaXMgZGVyaXZlZCBmcm9tIGNsaWVudC1zaWRlIGNvZGUgb3JpZ2luYWxseSBpbiBwZWVybGlicmFyeTpjb250cm9sLW1lcmdlYm94XG4gICAgICAgIC8vaHR0cHM6Ly9naXRodWIuY29tL3BlZXJsaWJyYXJ5L21ldGVvci1jb250cm9sLW1lcmdlYm94L2Jsb2IvbWFzdGVyL2NsaWVudC5jb2ZmZWVcblxuICAgICAgICAvL0ZvciBtb3JlIGluZm9ybWF0aW9uLCByZWZlciB0byBkaXNjdXNzaW9uIFwiSW5pdGlhbCBzdXBwb3J0IGZvciBwdWJsaWNhdGlvbiBzdHJhdGVnaWVzIGluIGxpdmVkYXRhIHNlcnZlclwiOlxuICAgICAgICAvL2h0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL3B1bGwvMTExNTFcbiAgICAgICAgaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICAgICAgICAgIGlmIChtc2cubXNnID09PSAnYWRkZWQnICYmIGRvYykge1xuICAgICAgICAgICAgbXNnLm1zZyA9ICdjaGFuZ2VkJztcbiAgICAgICAgICB9IGVsc2UgaWYgKG1zZy5tc2cgPT09ICdyZW1vdmVkJyAmJiAhZG9jKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSBlbHNlIGlmIChtc2cubXNnID09PSAnY2hhbmdlZCcgJiYgIWRvYykge1xuICAgICAgICAgICAgbXNnLm1zZyA9ICdhZGRlZCc7XG4gICAgICAgICAgICBjb25zdCBfcmVmID0gbXNnLmZpZWxkcztcbiAgICAgICAgICAgIGZvciAobGV0IGZpZWxkIGluIF9yZWYpIHtcbiAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBfcmVmW2ZpZWxkXTtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgbXNnLmZpZWxkc1tmaWVsZF07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSXMgdGhpcyBhIFwicmVwbGFjZSB0aGUgd2hvbGUgZG9jXCIgbWVzc2FnZSBjb21pbmcgZnJvbSB0aGUgcXVpZXNjZW5jZVxuICAgICAgICAvLyBvZiBtZXRob2Qgd3JpdGVzIHRvIGFuIG9iamVjdD8gKE5vdGUgdGhhdCAndW5kZWZpbmVkJyBpcyBhIHZhbGlkXG4gICAgICAgIC8vIHZhbHVlIG1lYW5pbmcgXCJyZW1vdmUgaXRcIi4pXG4gICAgICAgIGlmIChtc2cubXNnID09PSAncmVwbGFjZScpIHtcbiAgICAgICAgICB2YXIgcmVwbGFjZSA9IG1zZy5yZXBsYWNlO1xuICAgICAgICAgIGlmICghcmVwbGFjZSkge1xuICAgICAgICAgICAgaWYgKGRvYykgc2VsZi5fY29sbGVjdGlvbi5yZW1vdmUobW9uZ29JZCk7XG4gICAgICAgICAgfSBlbHNlIGlmICghZG9jKSB7XG4gICAgICAgICAgICBzZWxmLl9jb2xsZWN0aW9uLmluc2VydChyZXBsYWNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gWFhYIGNoZWNrIHRoYXQgcmVwbGFjZSBoYXMgbm8gJCBvcHNcbiAgICAgICAgICAgIHNlbGYuX2NvbGxlY3Rpb24udXBkYXRlKG1vbmdvSWQsIHJlcGxhY2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSBpZiAobXNnLm1zZyA9PT0gJ2FkZGVkJykge1xuICAgICAgICAgIGlmIChkb2MpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgJ0V4cGVjdGVkIG5vdCB0byBmaW5kIGEgZG9jdW1lbnQgYWxyZWFkeSBwcmVzZW50IGZvciBhbiBhZGQnXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZWxmLl9jb2xsZWN0aW9uLmluc2VydCh7IF9pZDogbW9uZ29JZCwgLi4ubXNnLmZpZWxkcyB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChtc2cubXNnID09PSAncmVtb3ZlZCcpIHtcbiAgICAgICAgICBpZiAoIWRvYylcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgJ0V4cGVjdGVkIHRvIGZpbmQgYSBkb2N1bWVudCBhbHJlYWR5IHByZXNlbnQgZm9yIHJlbW92ZWQnXG4gICAgICAgICAgICApO1xuICAgICAgICAgIHNlbGYuX2NvbGxlY3Rpb24ucmVtb3ZlKG1vbmdvSWQpO1xuICAgICAgICB9IGVsc2UgaWYgKG1zZy5tc2cgPT09ICdjaGFuZ2VkJykge1xuICAgICAgICAgIGlmICghZG9jKSB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIHRvIGZpbmQgYSBkb2N1bWVudCB0byBjaGFuZ2UnKTtcbiAgICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMobXNnLmZpZWxkcyk7XG4gICAgICAgICAgaWYgKGtleXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIG1vZGlmaWVyID0ge307XG4gICAgICAgICAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBtc2cuZmllbGRzW2tleV07XG4gICAgICAgICAgICAgIGlmIChFSlNPTi5lcXVhbHMoZG9jW2tleV0sIHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGlmICghbW9kaWZpZXIuJHVuc2V0KSB7XG4gICAgICAgICAgICAgICAgICBtb2RpZmllci4kdW5zZXQgPSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbW9kaWZpZXIuJHVuc2V0W2tleV0gPSAxO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghbW9kaWZpZXIuJHNldCkge1xuICAgICAgICAgICAgICAgICAgbW9kaWZpZXIuJHNldCA9IHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtb2RpZmllci4kc2V0W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMobW9kaWZpZXIpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgc2VsZi5fY29sbGVjdGlvbi51cGRhdGUobW9uZ29JZCwgbW9kaWZpZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJIGRvbid0IGtub3cgaG93IHRvIGRlYWwgd2l0aCB0aGlzIG1lc3NhZ2VcIik7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIC8vIENhbGxlZCBhdCB0aGUgZW5kIG9mIGEgYmF0Y2ggb2YgdXBkYXRlcy5saXZlZGF0YV9jb25uZWN0aW9uLmpzOjEyODdcbiAgICAgIGVuZFVwZGF0ZSgpIHtcbiAgICAgICAgc2VsZi5fY29sbGVjdGlvbi5yZXN1bWVPYnNlcnZlcnNDbGllbnQoKTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIFVzZWQgdG8gcHJlc2VydmUgY3VycmVudCB2ZXJzaW9ucyBvZiBkb2N1bWVudHMgYWNyb3NzIGEgc3RvcmUgcmVzZXQuXG4gICAgICBnZXREb2MoaWQpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuZmluZE9uZShpZCk7XG4gICAgICB9LFxuXG4gICAgICAuLi53cmFwcGVkU3RvcmVDb21tb24sXG4gICAgfTtcbiAgICBjb25zdCB3cmFwcGVkU3RvcmVTZXJ2ZXIgPSB7XG4gICAgICBhc3luYyBiZWdpblVwZGF0ZShiYXRjaFNpemUsIHJlc2V0KSB7XG4gICAgICAgIGlmIChiYXRjaFNpemUgPiAxIHx8IHJlc2V0KSBzZWxmLl9jb2xsZWN0aW9uLnBhdXNlT2JzZXJ2ZXJzKCk7XG5cbiAgICAgICAgaWYgKHJlc2V0KSBhd2FpdCBzZWxmLl9jb2xsZWN0aW9uLnJlbW92ZUFzeW5jKHt9KTtcbiAgICAgIH0sXG5cbiAgICAgIGFzeW5jIHVwZGF0ZShtc2cpIHtcbiAgICAgICAgdmFyIG1vbmdvSWQgPSBNb25nb0lELmlkUGFyc2UobXNnLmlkKTtcbiAgICAgICAgdmFyIGRvYyA9IHNlbGYuX2NvbGxlY3Rpb24uX2RvY3MuZ2V0KG1vbmdvSWQpO1xuXG4gICAgICAgIC8vIElzIHRoaXMgYSBcInJlcGxhY2UgdGhlIHdob2xlIGRvY1wiIG1lc3NhZ2UgY29taW5nIGZyb20gdGhlIHF1aWVzY2VuY2VcbiAgICAgICAgLy8gb2YgbWV0aG9kIHdyaXRlcyB0byBhbiBvYmplY3Q/IChOb3RlIHRoYXQgJ3VuZGVmaW5lZCcgaXMgYSB2YWxpZFxuICAgICAgICAvLyB2YWx1ZSBtZWFuaW5nIFwicmVtb3ZlIGl0XCIuKVxuICAgICAgICBpZiAobXNnLm1zZyA9PT0gJ3JlcGxhY2UnKSB7XG4gICAgICAgICAgdmFyIHJlcGxhY2UgPSBtc2cucmVwbGFjZTtcbiAgICAgICAgICBpZiAoIXJlcGxhY2UpIHtcbiAgICAgICAgICAgIGlmIChkb2MpIGF3YWl0IHNlbGYuX2NvbGxlY3Rpb24ucmVtb3ZlQXN5bmMobW9uZ29JZCk7XG4gICAgICAgICAgfSBlbHNlIGlmICghZG9jKSB7XG4gICAgICAgICAgICBhd2FpdCBzZWxmLl9jb2xsZWN0aW9uLmluc2VydEFzeW5jKHJlcGxhY2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBYWFggY2hlY2sgdGhhdCByZXBsYWNlIGhhcyBubyAkIG9wc1xuICAgICAgICAgICAgYXdhaXQgc2VsZi5fY29sbGVjdGlvbi51cGRhdGVBc3luYyhtb25nb0lkLCByZXBsYWNlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2UgaWYgKG1zZy5tc2cgPT09ICdhZGRlZCcpIHtcbiAgICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICdFeHBlY3RlZCBub3QgdG8gZmluZCBhIGRvY3VtZW50IGFscmVhZHkgcHJlc2VudCBmb3IgYW4gYWRkJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgc2VsZi5fY29sbGVjdGlvbi5pbnNlcnRBc3luYyh7IF9pZDogbW9uZ29JZCwgLi4ubXNnLmZpZWxkcyB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChtc2cubXNnID09PSAncmVtb3ZlZCcpIHtcbiAgICAgICAgICBpZiAoIWRvYylcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgJ0V4cGVjdGVkIHRvIGZpbmQgYSBkb2N1bWVudCBhbHJlYWR5IHByZXNlbnQgZm9yIHJlbW92ZWQnXG4gICAgICAgICAgICApO1xuICAgICAgICAgIGF3YWl0IHNlbGYuX2NvbGxlY3Rpb24ucmVtb3ZlQXN5bmMobW9uZ29JZCk7XG4gICAgICAgIH0gZWxzZSBpZiAobXNnLm1zZyA9PT0gJ2NoYW5nZWQnKSB7XG4gICAgICAgICAgaWYgKCFkb2MpIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgdG8gZmluZCBhIGRvY3VtZW50IHRvIGNoYW5nZScpO1xuICAgICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhtc2cuZmllbGRzKTtcbiAgICAgICAgICBpZiAoa2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgbW9kaWZpZXIgPSB7fTtcbiAgICAgICAgICAgIGtleXMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IG1zZy5maWVsZHNba2V5XTtcbiAgICAgICAgICAgICAgaWYgKEVKU09OLmVxdWFscyhkb2Nba2V5XSwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFtb2RpZmllci4kdW5zZXQpIHtcbiAgICAgICAgICAgICAgICAgIG1vZGlmaWVyLiR1bnNldCA9IHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtb2RpZmllci4kdW5zZXRba2V5XSA9IDE7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFtb2RpZmllci4kc2V0KSB7XG4gICAgICAgICAgICAgICAgICBtb2RpZmllci4kc2V0ID0ge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLiRzZXRba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhtb2RpZmllcikubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBhd2FpdCBzZWxmLl9jb2xsZWN0aW9uLnVwZGF0ZUFzeW5jKG1vbmdvSWQsIG1vZGlmaWVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSSBkb24ndCBrbm93IGhvdyB0byBkZWFsIHdpdGggdGhpcyBtZXNzYWdlXCIpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICAvLyBDYWxsZWQgYXQgdGhlIGVuZCBvZiBhIGJhdGNoIG9mIHVwZGF0ZXMuXG4gICAgICBhc3luYyBlbmRVcGRhdGUoKSB7XG4gICAgICAgIGF3YWl0IHNlbGYuX2NvbGxlY3Rpb24ucmVzdW1lT2JzZXJ2ZXJzU2VydmVyKCk7XG4gICAgICB9LFxuXG4gICAgICAvLyBVc2VkIHRvIHByZXNlcnZlIGN1cnJlbnQgdmVyc2lvbnMgb2YgZG9jdW1lbnRzIGFjcm9zcyBhIHN0b3JlIHJlc2V0LlxuICAgICAgYXN5bmMgZ2V0RG9jKGlkKSB7XG4gICAgICAgIHJldHVybiBzZWxmLmZpbmRPbmVBc3luYyhpZCk7XG4gICAgICB9LFxuICAgICAgLi4ud3JhcHBlZFN0b3JlQ29tbW9uLFxuICAgIH07XG5cblxuICAgIC8vIE9LLCB3ZSdyZSBnb2luZyB0byBiZSBhIHNsYXZlLCByZXBsaWNhdGluZyBzb21lIHJlbW90ZVxuICAgIC8vIGRhdGFiYXNlLCBleGNlcHQgcG9zc2libHkgd2l0aCBzb21lIHRlbXBvcmFyeSBkaXZlcmdlbmNlIHdoaWxlXG4gICAgLy8gd2UgaGF2ZSB1bmFja25vd2xlZGdlZCBSUEMncy5cbiAgICBsZXQgcmVnaXN0ZXJTdG9yZVJlc3VsdDtcbiAgICBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgICByZWdpc3RlclN0b3JlUmVzdWx0ID0gc2VsZi5fY29ubmVjdGlvbi5yZWdpc3RlclN0b3JlQ2xpZW50KFxuICAgICAgICBuYW1lLFxuICAgICAgICB3cmFwcGVkU3RvcmVDbGllbnRcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlZ2lzdGVyU3RvcmVSZXN1bHQgPSBzZWxmLl9jb25uZWN0aW9uLnJlZ2lzdGVyU3RvcmVTZXJ2ZXIoXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHdyYXBwZWRTdG9yZVNlcnZlclxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBtZXNzYWdlID0gYFRoZXJlIGlzIGFscmVhZHkgYSBjb2xsZWN0aW9uIG5hbWVkIFwiJHtuYW1lfVwiYDtcbiAgICBjb25zdCBsb2dXYXJuID0gKCkgPT4ge1xuICAgICAgY29uc29sZS53YXJuID8gY29uc29sZS53YXJuKG1lc3NhZ2UpIDogY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgfTtcblxuICAgIGlmICghcmVnaXN0ZXJTdG9yZVJlc3VsdCkge1xuICAgICAgcmV0dXJuIGxvZ1dhcm4oKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVnaXN0ZXJTdG9yZVJlc3VsdD8udGhlbj8uKG9rID0+IHtcbiAgICAgIGlmICghb2spIHtcbiAgICAgICAgbG9nV2FybigpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxufSIsImV4cG9ydCBjb25zdCBTeW5jTWV0aG9kcyA9IHtcbiAgLyoqXG4gICAqIEBzdW1tYXJ5IEZpbmQgdGhlIGRvY3VtZW50cyBpbiBhIGNvbGxlY3Rpb24gdGhhdCBtYXRjaCB0aGUgc2VsZWN0b3IuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWV0aG9kIGZpbmRcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7TW9uZ29TZWxlY3Rvcn0gW3NlbGVjdG9yXSBBIHF1ZXJ5IGRlc2NyaWJpbmcgdGhlIGRvY3VtZW50cyB0byBmaW5kXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAgICogQHBhcmFtIHtNb25nb1NvcnRTcGVjaWZpZXJ9IG9wdGlvbnMuc29ydCBTb3J0IG9yZGVyIChkZWZhdWx0OiBuYXR1cmFsIG9yZGVyKVxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0aW9ucy5za2lwIE51bWJlciBvZiByZXN1bHRzIHRvIHNraXAgYXQgdGhlIGJlZ2lubmluZ1xuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0aW9ucy5saW1pdCBNYXhpbXVtIG51bWJlciBvZiByZXN1bHRzIHRvIHJldHVyblxuICAgKiBAcGFyYW0ge01vbmdvRmllbGRTcGVjaWZpZXJ9IG9wdGlvbnMuZmllbGRzIERpY3Rpb25hcnkgb2YgZmllbGRzIHRvIHJldHVybiBvciBleGNsdWRlLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMucmVhY3RpdmUgKENsaWVudCBvbmx5KSBEZWZhdWx0IGB0cnVlYDsgcGFzcyBgZmFsc2VgIHRvIGRpc2FibGUgcmVhY3Rpdml0eVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvcHRpb25zLnRyYW5zZm9ybSBPdmVycmlkZXMgYHRyYW5zZm9ybWAgb24gdGhlICBbYENvbGxlY3Rpb25gXSgjY29sbGVjdGlvbnMpIGZvciB0aGlzIGN1cnNvci4gIFBhc3MgYG51bGxgIHRvIGRpc2FibGUgdHJhbnNmb3JtYXRpb24uXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5kaXNhYmxlT3Bsb2cgKFNlcnZlciBvbmx5KSBQYXNzIHRydWUgdG8gZGlzYWJsZSBvcGxvZy10YWlsaW5nIG9uIHRoaXMgcXVlcnkuIFRoaXMgYWZmZWN0cyB0aGUgd2F5IHNlcnZlciBwcm9jZXNzZXMgY2FsbHMgdG8gYG9ic2VydmVgIG9uIHRoaXMgcXVlcnkuIERpc2FibGluZyB0aGUgb3Bsb2cgY2FuIGJlIHVzZWZ1bCB3aGVuIHdvcmtpbmcgd2l0aCBkYXRhIHRoYXQgdXBkYXRlcyBpbiBsYXJnZSBiYXRjaGVzLlxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0aW9ucy5wb2xsaW5nSW50ZXJ2YWxNcyAoU2VydmVyIG9ubHkpIFdoZW4gb3Bsb2cgaXMgZGlzYWJsZWQgKHRocm91Z2ggdGhlIHVzZSBvZiBgZGlzYWJsZU9wbG9nYCBvciB3aGVuIG90aGVyd2lzZSBub3QgYXZhaWxhYmxlKSwgdGhlIGZyZXF1ZW5jeSAoaW4gbWlsbGlzZWNvbmRzKSBvZiBob3cgb2Z0ZW4gdG8gcG9sbCB0aGlzIHF1ZXJ5IHdoZW4gb2JzZXJ2aW5nIG9uIHRoZSBzZXJ2ZXIuIERlZmF1bHRzIHRvIDEwMDAwbXMgKDEwIHNlY29uZHMpLlxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0aW9ucy5wb2xsaW5nVGhyb3R0bGVNcyAoU2VydmVyIG9ubHkpIFdoZW4gb3Bsb2cgaXMgZGlzYWJsZWQgKHRocm91Z2ggdGhlIHVzZSBvZiBgZGlzYWJsZU9wbG9nYCBvciB3aGVuIG90aGVyd2lzZSBub3QgYXZhaWxhYmxlKSwgdGhlIG1pbmltdW0gdGltZSAoaW4gbWlsbGlzZWNvbmRzKSB0byBhbGxvdyBiZXR3ZWVuIHJlLXBvbGxpbmcgd2hlbiBvYnNlcnZpbmcgb24gdGhlIHNlcnZlci4gSW5jcmVhc2luZyB0aGlzIHdpbGwgc2F2ZSBDUFUgYW5kIG1vbmdvIGxvYWQgYXQgdGhlIGV4cGVuc2Ugb2Ygc2xvd2VyIHVwZGF0ZXMgdG8gdXNlcnMuIERlY3JlYXNpbmcgdGhpcyBpcyBub3QgcmVjb21tZW5kZWQuIERlZmF1bHRzIHRvIDUwbXMuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHRpb25zLm1heFRpbWVNcyAoU2VydmVyIG9ubHkpIElmIHNldCwgaW5zdHJ1Y3RzIE1vbmdvREIgdG8gc2V0IGEgdGltZSBsaW1pdCBmb3IgdGhpcyBjdXJzb3IncyBvcGVyYXRpb25zLiBJZiB0aGUgb3BlcmF0aW9uIHJlYWNoZXMgdGhlIHNwZWNpZmllZCB0aW1lIGxpbWl0IChpbiBtaWxsaXNlY29uZHMpIHdpdGhvdXQgdGhlIGhhdmluZyBiZWVuIGNvbXBsZXRlZCwgYW4gZXhjZXB0aW9uIHdpbGwgYmUgdGhyb3duLiBVc2VmdWwgdG8gcHJldmVudCBhbiAoYWNjaWRlbnRhbCBvciBtYWxpY2lvdXMpIHVub3B0aW1pemVkIHF1ZXJ5IGZyb20gY2F1c2luZyBhIGZ1bGwgY29sbGVjdGlvbiBzY2FuIHRoYXQgd291bGQgZGlzcnVwdCBvdGhlciBkYXRhYmFzZSB1c2VycywgYXQgdGhlIGV4cGVuc2Ugb2YgbmVlZGluZyB0byBoYW5kbGUgdGhlIHJlc3VsdGluZyBlcnJvci5cbiAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBvcHRpb25zLmhpbnQgKFNlcnZlciBvbmx5KSBPdmVycmlkZXMgTW9uZ29EQidzIGRlZmF1bHQgaW5kZXggc2VsZWN0aW9uIGFuZCBxdWVyeSBvcHRpbWl6YXRpb24gcHJvY2Vzcy4gU3BlY2lmeSBhbiBpbmRleCB0byBmb3JjZSBpdHMgdXNlLCBlaXRoZXIgYnkgaXRzIG5hbWUgb3IgaW5kZXggc3BlY2lmaWNhdGlvbi4gWW91IGNhbiBhbHNvIHNwZWNpZnkgYHsgJG5hdHVyYWwgOiAxIH1gIHRvIGZvcmNlIGEgZm9yd2FyZHMgY29sbGVjdGlvbiBzY2FuLCBvciBgeyAkbmF0dXJhbCA6IC0xIH1gIGZvciBhIHJldmVyc2UgY29sbGVjdGlvbiBzY2FuLiBTZXR0aW5nIHRoaXMgaXMgb25seSByZWNvbW1lbmRlZCBmb3IgYWR2YW5jZWQgdXNlcnMuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLnJlYWRQcmVmZXJlbmNlIChTZXJ2ZXIgb25seSkgU3BlY2lmaWVzIGEgY3VzdG9tIE1vbmdvREIgW2ByZWFkUHJlZmVyZW5jZWBdKGh0dHBzOi8vZG9jcy5tb25nb2RiLmNvbS9tYW51YWwvY29yZS9yZWFkLXByZWZlcmVuY2UpIGZvciB0aGlzIHBhcnRpY3VsYXIgY3Vyc29yLiBQb3NzaWJsZSB2YWx1ZXMgYXJlIGBwcmltYXJ5YCwgYHByaW1hcnlQcmVmZXJyZWRgLCBgc2Vjb25kYXJ5YCwgYHNlY29uZGFyeVByZWZlcnJlZGAgYW5kIGBuZWFyZXN0YC5cbiAgICogQHJldHVybnMge01vbmdvLkN1cnNvcn1cbiAgICovXG4gIGZpbmQoLi4uYXJncykge1xuICAgIC8vIENvbGxlY3Rpb24uZmluZCgpIChyZXR1cm4gYWxsIGRvY3MpIGJlaGF2ZXMgZGlmZmVyZW50bHlcbiAgICAvLyBmcm9tIENvbGxlY3Rpb24uZmluZCh1bmRlZmluZWQpIChyZXR1cm4gMCBkb2NzKS4gIHNvIGJlXG4gICAgLy8gY2FyZWZ1bCBhYm91dCB0aGUgbGVuZ3RoIG9mIGFyZ3VtZW50cy5cbiAgICByZXR1cm4gdGhpcy5fY29sbGVjdGlvbi5maW5kKFxuICAgICAgdGhpcy5fZ2V0RmluZFNlbGVjdG9yKGFyZ3MpLFxuICAgICAgdGhpcy5fZ2V0RmluZE9wdGlvbnMoYXJncylcbiAgICApO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBGaW5kcyB0aGUgZmlyc3QgZG9jdW1lbnQgdGhhdCBtYXRjaGVzIHRoZSBzZWxlY3RvciwgYXMgb3JkZXJlZCBieSBzb3J0IGFuZCBza2lwIG9wdGlvbnMuIFJldHVybnMgYHVuZGVmaW5lZGAgaWYgbm8gbWF0Y2hpbmcgZG9jdW1lbnQgaXMgZm91bmQuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWV0aG9kIGZpbmRPbmVcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7TW9uZ29TZWxlY3Rvcn0gW3NlbGVjdG9yXSBBIHF1ZXJ5IGRlc2NyaWJpbmcgdGhlIGRvY3VtZW50cyB0byBmaW5kXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAgICogQHBhcmFtIHtNb25nb1NvcnRTcGVjaWZpZXJ9IG9wdGlvbnMuc29ydCBTb3J0IG9yZGVyIChkZWZhdWx0OiBuYXR1cmFsIG9yZGVyKVxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0aW9ucy5za2lwIE51bWJlciBvZiByZXN1bHRzIHRvIHNraXAgYXQgdGhlIGJlZ2lubmluZ1xuICAgKiBAcGFyYW0ge01vbmdvRmllbGRTcGVjaWZpZXJ9IG9wdGlvbnMuZmllbGRzIERpY3Rpb25hcnkgb2YgZmllbGRzIHRvIHJldHVybiBvciBleGNsdWRlLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMucmVhY3RpdmUgKENsaWVudCBvbmx5KSBEZWZhdWx0IHRydWU7IHBhc3MgZmFsc2UgdG8gZGlzYWJsZSByZWFjdGl2aXR5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdGlvbnMudHJhbnNmb3JtIE92ZXJyaWRlcyBgdHJhbnNmb3JtYCBvbiB0aGUgW2BDb2xsZWN0aW9uYF0oI2NvbGxlY3Rpb25zKSBmb3IgdGhpcyBjdXJzb3IuICBQYXNzIGBudWxsYCB0byBkaXNhYmxlIHRyYW5zZm9ybWF0aW9uLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5yZWFkUHJlZmVyZW5jZSAoU2VydmVyIG9ubHkpIFNwZWNpZmllcyBhIGN1c3RvbSBNb25nb0RCIFtgcmVhZFByZWZlcmVuY2VgXShodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL2NvcmUvcmVhZC1wcmVmZXJlbmNlKSBmb3IgZmV0Y2hpbmcgdGhlIGRvY3VtZW50LiBQb3NzaWJsZSB2YWx1ZXMgYXJlIGBwcmltYXJ5YCwgYHByaW1hcnlQcmVmZXJyZWRgLCBgc2Vjb25kYXJ5YCwgYHNlY29uZGFyeVByZWZlcnJlZGAgYW5kIGBuZWFyZXN0YC5cbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIGZpbmRPbmUoLi4uYXJncykge1xuICAgIHJldHVybiB0aGlzLl9jb2xsZWN0aW9uLmZpbmRPbmUoXG4gICAgICB0aGlzLl9nZXRGaW5kU2VsZWN0b3IoYXJncyksXG4gICAgICB0aGlzLl9nZXRGaW5kT3B0aW9ucyhhcmdzKVxuICAgICk7XG4gIH0sXG5cblxuICAvLyAnaW5zZXJ0JyBpbW1lZGlhdGVseSByZXR1cm5zIHRoZSBpbnNlcnRlZCBkb2N1bWVudCdzIG5ldyBfaWQuXG4gIC8vIFRoZSBvdGhlcnMgcmV0dXJuIHZhbHVlcyBpbW1lZGlhdGVseSBpZiB5b3UgYXJlIGluIGEgc3R1YiwgYW4gaW4tbWVtb3J5XG4gIC8vIHVubWFuYWdlZCBjb2xsZWN0aW9uLCBvciBhIG1vbmdvLWJhY2tlZCBjb2xsZWN0aW9uIGFuZCB5b3UgZG9uJ3QgcGFzcyBhXG4gIC8vIGNhbGxiYWNrLiAndXBkYXRlJyBhbmQgJ3JlbW92ZScgcmV0dXJuIHRoZSBudW1iZXIgb2YgYWZmZWN0ZWRcbiAgLy8gZG9jdW1lbnRzLiAndXBzZXJ0JyByZXR1cm5zIGFuIG9iamVjdCB3aXRoIGtleXMgJ251bWJlckFmZmVjdGVkJyBhbmQsIGlmIGFuXG4gIC8vIGluc2VydCBoYXBwZW5lZCwgJ2luc2VydGVkSWQnLlxuICAvL1xuICAvLyBPdGhlcndpc2UsIHRoZSBzZW1hbnRpY3MgYXJlIGV4YWN0bHkgbGlrZSBvdGhlciBtZXRob2RzOiB0aGV5IHRha2VcbiAgLy8gYSBjYWxsYmFjayBhcyBhbiBvcHRpb25hbCBsYXN0IGFyZ3VtZW50OyBpZiBubyBjYWxsYmFjayBpc1xuICAvLyBwcm92aWRlZCwgdGhleSBibG9jayB1bnRpbCB0aGUgb3BlcmF0aW9uIGlzIGNvbXBsZXRlLCBhbmQgdGhyb3cgYW5cbiAgLy8gZXhjZXB0aW9uIGlmIGl0IGZhaWxzOyBpZiBhIGNhbGxiYWNrIGlzIHByb3ZpZGVkLCB0aGVuIHRoZXkgZG9uJ3RcbiAgLy8gbmVjZXNzYXJpbHkgYmxvY2ssIGFuZCB0aGV5IGNhbGwgdGhlIGNhbGxiYWNrIHdoZW4gdGhleSBmaW5pc2ggd2l0aCBlcnJvciBhbmRcbiAgLy8gcmVzdWx0IGFyZ3VtZW50cy4gIChUaGUgaW5zZXJ0IG1ldGhvZCBwcm92aWRlcyB0aGUgZG9jdW1lbnQgSUQgYXMgaXRzIHJlc3VsdDtcbiAgLy8gdXBkYXRlIGFuZCByZW1vdmUgcHJvdmlkZSB0aGUgbnVtYmVyIG9mIGFmZmVjdGVkIGRvY3MgYXMgdGhlIHJlc3VsdDsgdXBzZXJ0XG4gIC8vIHByb3ZpZGVzIGFuIG9iamVjdCB3aXRoIG51bWJlckFmZmVjdGVkIGFuZCBtYXliZSBpbnNlcnRlZElkLilcbiAgLy9cbiAgLy8gT24gdGhlIGNsaWVudCwgYmxvY2tpbmcgaXMgaW1wb3NzaWJsZSwgc28gaWYgYSBjYWxsYmFja1xuICAvLyBpc24ndCBwcm92aWRlZCwgdGhleSBqdXN0IHJldHVybiBpbW1lZGlhdGVseSBhbmQgYW55IGVycm9yXG4gIC8vIGluZm9ybWF0aW9uIGlzIGxvc3QuXG4gIC8vXG4gIC8vIFRoZXJlJ3Mgb25lIG1vcmUgdHdlYWsuIE9uIHRoZSBjbGllbnQsIGlmIHlvdSBkb24ndCBwcm92aWRlIGFcbiAgLy8gY2FsbGJhY2ssIHRoZW4gaWYgdGhlcmUgaXMgYW4gZXJyb3IsIGEgbWVzc2FnZSB3aWxsIGJlIGxvZ2dlZCB3aXRoXG4gIC8vIE1ldGVvci5fZGVidWcuXG4gIC8vXG4gIC8vIFRoZSBpbnRlbnQgKHRob3VnaCB0aGlzIGlzIGFjdHVhbGx5IGRldGVybWluZWQgYnkgdGhlIHVuZGVybHlpbmdcbiAgLy8gZHJpdmVycykgaXMgdGhhdCB0aGUgb3BlcmF0aW9ucyBzaG91bGQgYmUgZG9uZSBzeW5jaHJvbm91c2x5LCBub3RcbiAgLy8gZ2VuZXJhdGluZyB0aGVpciByZXN1bHQgdW50aWwgdGhlIGRhdGFiYXNlIGhhcyBhY2tub3dsZWRnZWRcbiAgLy8gdGhlbS4gSW4gdGhlIGZ1dHVyZSBtYXliZSB3ZSBzaG91bGQgcHJvdmlkZSBhIGZsYWcgdG8gdHVybiB0aGlzXG4gIC8vIG9mZi5cblxuICBfaW5zZXJ0KGRvYywgY2FsbGJhY2spIHtcbiAgICAvLyBNYWtlIHN1cmUgd2Ugd2VyZSBwYXNzZWQgYSBkb2N1bWVudCB0byBpbnNlcnRcbiAgICBpZiAoIWRvYykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnNlcnQgcmVxdWlyZXMgYW4gYXJndW1lbnQnKTtcbiAgICB9XG5cblxuICAgIC8vIE1ha2UgYSBzaGFsbG93IGNsb25lIG9mIHRoZSBkb2N1bWVudCwgcHJlc2VydmluZyBpdHMgcHJvdG90eXBlLlxuICAgIGRvYyA9IE9iamVjdC5jcmVhdGUoXG4gICAgICBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZG9jKSxcbiAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKGRvYylcbiAgICApO1xuXG4gICAgaWYgKCdfaWQnIGluIGRvYykge1xuICAgICAgaWYgKFxuICAgICAgICAhZG9jLl9pZCB8fFxuICAgICAgICAhKHR5cGVvZiBkb2MuX2lkID09PSAnc3RyaW5nJyB8fCBkb2MuX2lkIGluc3RhbmNlb2YgTW9uZ28uT2JqZWN0SUQpXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdNZXRlb3IgcmVxdWlyZXMgZG9jdW1lbnQgX2lkIGZpZWxkcyB0byBiZSBub24tZW1wdHkgc3RyaW5ncyBvciBPYmplY3RJRHMnXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBnZW5lcmF0ZUlkID0gdHJ1ZTtcblxuICAgICAgLy8gRG9uJ3QgZ2VuZXJhdGUgdGhlIGlkIGlmIHdlJ3JlIHRoZSBjbGllbnQgYW5kIHRoZSAnb3V0ZXJtb3N0JyBjYWxsXG4gICAgICAvLyBUaGlzIG9wdGltaXphdGlvbiBzYXZlcyB1cyBwYXNzaW5nIGJvdGggdGhlIHJhbmRvbVNlZWQgYW5kIHRoZSBpZFxuICAgICAgLy8gUGFzc2luZyBib3RoIGlzIHJlZHVuZGFudC5cbiAgICAgIGlmICh0aGlzLl9pc1JlbW90ZUNvbGxlY3Rpb24oKSkge1xuICAgICAgICBjb25zdCBlbmNsb3NpbmcgPSBERFAuX0N1cnJlbnRNZXRob2RJbnZvY2F0aW9uLmdldCgpO1xuICAgICAgICBpZiAoIWVuY2xvc2luZykge1xuICAgICAgICAgIGdlbmVyYXRlSWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZ2VuZXJhdGVJZCkge1xuICAgICAgICBkb2MuX2lkID0gdGhpcy5fbWFrZU5ld0lEKCk7XG4gICAgICB9XG4gICAgfVxuXG5cbiAgICAvLyBPbiBpbnNlcnRzLCBhbHdheXMgcmV0dXJuIHRoZSBpZCB0aGF0IHdlIGdlbmVyYXRlZDsgb24gYWxsIG90aGVyXG4gICAgLy8gb3BlcmF0aW9ucywganVzdCByZXR1cm4gdGhlIHJlc3VsdCBmcm9tIHRoZSBjb2xsZWN0aW9uLlxuICAgIHZhciBjaG9vc2VSZXR1cm5WYWx1ZUZyb21Db2xsZWN0aW9uUmVzdWx0ID0gZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBpZiAoTWV0ZW9yLl9pc1Byb21pc2UocmVzdWx0KSkgcmV0dXJuIHJlc3VsdDtcblxuICAgICAgaWYgKGRvYy5faWQpIHtcbiAgICAgICAgcmV0dXJuIGRvYy5faWQ7XG4gICAgICB9XG5cbiAgICAgIC8vIFhYWCB3aGF0IGlzIHRoaXMgZm9yPz9cbiAgICAgIC8vIEl0J3Mgc29tZSBpdGVyYWN0aW9uIGJldHdlZW4gdGhlIGNhbGxiYWNrIHRvIF9jYWxsTXV0YXRvck1ldGhvZCBhbmRcbiAgICAgIC8vIHRoZSByZXR1cm4gdmFsdWUgY29udmVyc2lvblxuICAgICAgZG9jLl9pZCA9IHJlc3VsdDtcblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgY29uc3Qgd3JhcHBlZENhbGxiYWNrID0gd3JhcENhbGxiYWNrKFxuICAgICAgY2FsbGJhY2ssXG4gICAgICBjaG9vc2VSZXR1cm5WYWx1ZUZyb21Db2xsZWN0aW9uUmVzdWx0XG4gICAgKTtcblxuICAgIGlmICh0aGlzLl9pc1JlbW90ZUNvbGxlY3Rpb24oKSkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fY2FsbE11dGF0b3JNZXRob2QoJ2luc2VydCcsIFtkb2NdLCB3cmFwcGVkQ2FsbGJhY2spO1xuICAgICAgcmV0dXJuIGNob29zZVJldHVyblZhbHVlRnJvbUNvbGxlY3Rpb25SZXN1bHQocmVzdWx0KTtcbiAgICB9XG5cbiAgICAvLyBpdCdzIG15IGNvbGxlY3Rpb24uICBkZXNjZW5kIGludG8gdGhlIGNvbGxlY3Rpb24gb2JqZWN0XG4gICAgLy8gYW5kIHByb3BhZ2F0ZSBhbnkgZXhjZXB0aW9uLlxuICAgIHRyeSB7XG4gICAgICAvLyBJZiB0aGUgdXNlciBwcm92aWRlZCBhIGNhbGxiYWNrIGFuZCB0aGUgY29sbGVjdGlvbiBpbXBsZW1lbnRzIHRoaXNcbiAgICAgIC8vIG9wZXJhdGlvbiBhc3luY2hyb25vdXNseSwgdGhlbiBxdWVyeVJldCB3aWxsIGJlIHVuZGVmaW5lZCwgYW5kIHRoZVxuICAgICAgLy8gcmVzdWx0IHdpbGwgYmUgcmV0dXJuZWQgdGhyb3VnaCB0aGUgY2FsbGJhY2sgaW5zdGVhZC5cbiAgICAgIGxldCByZXN1bHQ7XG4gICAgICBpZiAoISF3cmFwcGVkQ2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5fY29sbGVjdGlvbi5pbnNlcnQoZG9jLCB3cmFwcGVkQ2FsbGJhY2spO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSB0aGUgY2FsbGJhY2ssIHdlIGFzc3VtZSB0aGUgdXNlciBpcyB1c2luZyB0aGUgcHJvbWlzZS5cbiAgICAgICAgLy8gV2UgY2FuJ3QganVzdCBwYXNzIHRoaXMuX2NvbGxlY3Rpb24uaW5zZXJ0IHRvIHRoZSBwcm9taXNpZnkgYmVjYXVzZSBpdCB3b3VsZCBsb3NlIHRoZSBjb250ZXh0LlxuICAgICAgICByZXN1bHQgPSB0aGlzLl9jb2xsZWN0aW9uLmluc2VydChkb2MpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2hvb3NlUmV0dXJuVmFsdWVGcm9tQ29sbGVjdGlvblJlc3VsdChyZXN1bHQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayhlKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgSW5zZXJ0IGEgZG9jdW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24uICBSZXR1cm5zIGl0cyB1bmlxdWUgX2lkLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1ldGhvZCAgaW5zZXJ0XG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZG9jIFRoZSBkb2N1bWVudCB0byBpbnNlcnQuIE1heSBub3QgeWV0IGhhdmUgYW4gX2lkIGF0dHJpYnV0ZSwgaW4gd2hpY2ggY2FzZSBNZXRlb3Igd2lsbCBnZW5lcmF0ZSBvbmUgZm9yIHlvdS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBPcHRpb25hbC4gIElmIHByZXNlbnQsIGNhbGxlZCB3aXRoIGFuIGVycm9yIG9iamVjdCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgYW5kLCBpZiBubyBlcnJvciwgdGhlIF9pZCBhcyB0aGUgc2Vjb25kLlxuICAgKi9cbiAgaW5zZXJ0KGRvYywgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5faW5zZXJ0KGRvYywgY2FsbGJhY2spO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBBc3luY2hyb25vdXNseSBtb2RpZmllcyBvbmUgb3IgbW9yZSBkb2N1bWVudHMgaW4gdGhlIGNvbGxlY3Rpb24uIFJldHVybnMgdGhlIG51bWJlciBvZiBtYXRjaGVkIGRvY3VtZW50cy5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZXRob2QgdXBkYXRlXG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge01vbmdvU2VsZWN0b3J9IHNlbGVjdG9yIFNwZWNpZmllcyB3aGljaCBkb2N1bWVudHMgdG8gbW9kaWZ5XG4gICAqIEBwYXJhbSB7TW9uZ29Nb2RpZmllcn0gbW9kaWZpZXIgU3BlY2lmaWVzIGhvdyB0byBtb2RpZnkgdGhlIGRvY3VtZW50c1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5tdWx0aSBUcnVlIHRvIG1vZGlmeSBhbGwgbWF0Y2hpbmcgZG9jdW1lbnRzOyBmYWxzZSB0byBvbmx5IG1vZGlmeSBvbmUgb2YgdGhlIG1hdGNoaW5nIGRvY3VtZW50cyAodGhlIGRlZmF1bHQpLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMudXBzZXJ0IFRydWUgdG8gaW5zZXJ0IGEgZG9jdW1lbnQgaWYgbm8gbWF0Y2hpbmcgZG9jdW1lbnRzIGFyZSBmb3VuZC5cbiAgICogQHBhcmFtIHtBcnJheX0gb3B0aW9ucy5hcnJheUZpbHRlcnMgT3B0aW9uYWwuIFVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBNb25nb0RCIFtmaWx0ZXJlZCBwb3NpdGlvbmFsIG9wZXJhdG9yXShodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL3JlZmVyZW5jZS9vcGVyYXRvci91cGRhdGUvcG9zaXRpb25hbC1maWx0ZXJlZC8pIHRvIHNwZWNpZnkgd2hpY2ggZWxlbWVudHMgdG8gbW9kaWZ5IGluIGFuIGFycmF5IGZpZWxkLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIE9wdGlvbmFsLiAgSWYgcHJlc2VudCwgY2FsbGVkIHdpdGggYW4gZXJyb3Igb2JqZWN0IGFzIHRoZSBmaXJzdCBhcmd1bWVudCBhbmQsIGlmIG5vIGVycm9yLCB0aGUgbnVtYmVyIG9mIGFmZmVjdGVkIGRvY3VtZW50cyBhcyB0aGUgc2Vjb25kLlxuICAgKi9cbiAgdXBkYXRlKHNlbGVjdG9yLCBtb2RpZmllciwgLi4ub3B0aW9uc0FuZENhbGxiYWNrKSB7XG4gICAgY29uc3QgY2FsbGJhY2sgPSBwb3BDYWxsYmFja0Zyb21BcmdzKG9wdGlvbnNBbmRDYWxsYmFjayk7XG5cbiAgICAvLyBXZSd2ZSBhbHJlYWR5IHBvcHBlZCBvZmYgdGhlIGNhbGxiYWNrLCBzbyB3ZSBhcmUgbGVmdCB3aXRoIGFuIGFycmF5XG4gICAgLy8gb2Ygb25lIG9yIHplcm8gaXRlbXNcbiAgICBjb25zdCBvcHRpb25zID0geyAuLi4ob3B0aW9uc0FuZENhbGxiYWNrWzBdIHx8IG51bGwpIH07XG4gICAgbGV0IGluc2VydGVkSWQ7XG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy51cHNlcnQpIHtcbiAgICAgIC8vIHNldCBgaW5zZXJ0ZWRJZGAgaWYgYWJzZW50LiAgYGluc2VydGVkSWRgIGlzIGEgTWV0ZW9yIGV4dGVuc2lvbi5cbiAgICAgIGlmIChvcHRpb25zLmluc2VydGVkSWQpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICEoXG4gICAgICAgICAgICB0eXBlb2Ygb3B0aW9ucy5pbnNlcnRlZElkID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgICAgb3B0aW9ucy5pbnNlcnRlZElkIGluc3RhbmNlb2YgTW9uZ28uT2JqZWN0SURcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luc2VydGVkSWQgbXVzdCBiZSBzdHJpbmcgb3IgT2JqZWN0SUQnKTtcbiAgICAgICAgaW5zZXJ0ZWRJZCA9IG9wdGlvbnMuaW5zZXJ0ZWRJZDtcbiAgICAgIH0gZWxzZSBpZiAoIXNlbGVjdG9yIHx8ICFzZWxlY3Rvci5faWQpIHtcbiAgICAgICAgaW5zZXJ0ZWRJZCA9IHRoaXMuX21ha2VOZXdJRCgpO1xuICAgICAgICBvcHRpb25zLmdlbmVyYXRlZElkID0gdHJ1ZTtcbiAgICAgICAgb3B0aW9ucy5pbnNlcnRlZElkID0gaW5zZXJ0ZWRJZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZWxlY3RvciA9IE1vbmdvLkNvbGxlY3Rpb24uX3Jld3JpdGVTZWxlY3RvcihzZWxlY3Rvciwge1xuICAgICAgZmFsbGJhY2tJZDogaW5zZXJ0ZWRJZCxcbiAgICB9KTtcblxuICAgIGNvbnN0IHdyYXBwZWRDYWxsYmFjayA9IHdyYXBDYWxsYmFjayhjYWxsYmFjayk7XG5cbiAgICBpZiAodGhpcy5faXNSZW1vdGVDb2xsZWN0aW9uKCkpIHtcbiAgICAgIGNvbnN0IGFyZ3MgPSBbc2VsZWN0b3IsIG1vZGlmaWVyLCBvcHRpb25zXTtcbiAgICAgIHJldHVybiB0aGlzLl9jYWxsTXV0YXRvck1ldGhvZCgndXBkYXRlJywgYXJncywgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIC8vIGl0J3MgbXkgY29sbGVjdGlvbi4gIGRlc2NlbmQgaW50byB0aGUgY29sbGVjdGlvbiBvYmplY3RcbiAgICAvLyBhbmQgcHJvcGFnYXRlIGFueSBleGNlcHRpb24uXG4gICAgLy8gSWYgdGhlIHVzZXIgcHJvdmlkZWQgYSBjYWxsYmFjayBhbmQgdGhlIGNvbGxlY3Rpb24gaW1wbGVtZW50cyB0aGlzXG4gICAgLy8gb3BlcmF0aW9uIGFzeW5jaHJvbm91c2x5LCB0aGVuIHF1ZXJ5UmV0IHdpbGwgYmUgdW5kZWZpbmVkLCBhbmQgdGhlXG4gICAgLy8gcmVzdWx0IHdpbGwgYmUgcmV0dXJuZWQgdGhyb3VnaCB0aGUgY2FsbGJhY2sgaW5zdGVhZC5cbiAgICAvL2NvbnNvbGUubG9nKHtjYWxsYmFjaywgb3B0aW9ucywgc2VsZWN0b3IsIG1vZGlmaWVyLCBjb2xsOiB0aGlzLl9jb2xsZWN0aW9ufSk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIElmIHRoZSB1c2VyIHByb3ZpZGVkIGEgY2FsbGJhY2sgYW5kIHRoZSBjb2xsZWN0aW9uIGltcGxlbWVudHMgdGhpc1xuICAgICAgLy8gb3BlcmF0aW9uIGFzeW5jaHJvbm91c2x5LCB0aGVuIHF1ZXJ5UmV0IHdpbGwgYmUgdW5kZWZpbmVkLCBhbmQgdGhlXG4gICAgICAvLyByZXN1bHQgd2lsbCBiZSByZXR1cm5lZCB0aHJvdWdoIHRoZSBjYWxsYmFjayBpbnN0ZWFkLlxuICAgICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb24udXBkYXRlKFxuICAgICAgICBzZWxlY3RvcixcbiAgICAgICAgbW9kaWZpZXIsXG4gICAgICAgIG9wdGlvbnMsXG4gICAgICAgIHdyYXBwZWRDYWxsYmFja1xuICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soZSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJlbW92ZSBkb2N1bWVudHMgZnJvbSB0aGUgY29sbGVjdGlvblxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1ldGhvZCByZW1vdmVcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7TW9uZ29TZWxlY3Rvcn0gc2VsZWN0b3IgU3BlY2lmaWVzIHdoaWNoIGRvY3VtZW50cyB0byByZW1vdmVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBPcHRpb25hbC4gIElmIHByZXNlbnQsIGNhbGxlZCB3aXRoIGFuIGVycm9yIG9iamVjdCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgYW5kLCBpZiBubyBlcnJvciwgdGhlIG51bWJlciBvZiBhZmZlY3RlZCBkb2N1bWVudHMgYXMgdGhlIHNlY29uZC5cbiAgICovXG4gIHJlbW92ZShzZWxlY3RvciwgY2FsbGJhY2spIHtcbiAgICBzZWxlY3RvciA9IE1vbmdvLkNvbGxlY3Rpb24uX3Jld3JpdGVTZWxlY3RvcihzZWxlY3Rvcik7XG5cbiAgICBpZiAodGhpcy5faXNSZW1vdGVDb2xsZWN0aW9uKCkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9jYWxsTXV0YXRvck1ldGhvZCgncmVtb3ZlJywgW3NlbGVjdG9yXSwgY2FsbGJhY2spO1xuICAgIH1cblxuXG4gICAgLy8gaXQncyBteSBjb2xsZWN0aW9uLiAgZGVzY2VuZCBpbnRvIHRoZSBjb2xsZWN0aW9uMSBvYmplY3RcbiAgICAvLyBhbmQgcHJvcGFnYXRlIGFueSBleGNlcHRpb24uXG4gICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb24ucmVtb3ZlKHNlbGVjdG9yKTtcbiAgfSxcblxuICAvKipcbiAgICogQHN1bW1hcnkgQXN5bmNocm9ub3VzbHkgbW9kaWZpZXMgb25lIG9yIG1vcmUgZG9jdW1lbnRzIGluIHRoZSBjb2xsZWN0aW9uLCBvciBpbnNlcnQgb25lIGlmIG5vIG1hdGNoaW5nIGRvY3VtZW50cyB3ZXJlIGZvdW5kLiBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGtleXMgYG51bWJlckFmZmVjdGVkYCAodGhlIG51bWJlciBvZiBkb2N1bWVudHMgbW9kaWZpZWQpICBhbmQgYGluc2VydGVkSWRgICh0aGUgdW5pcXVlIF9pZCBvZiB0aGUgZG9jdW1lbnQgdGhhdCB3YXMgaW5zZXJ0ZWQsIGlmIGFueSkuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWV0aG9kIHVwc2VydFxuICAgKiBAbWVtYmVyb2YgTW9uZ28uQ29sbGVjdGlvblxuICAgKiBAaW5zdGFuY2VcbiAgICogQHBhcmFtIHtNb25nb1NlbGVjdG9yfSBzZWxlY3RvciBTcGVjaWZpZXMgd2hpY2ggZG9jdW1lbnRzIHRvIG1vZGlmeVxuICAgKiBAcGFyYW0ge01vbmdvTW9kaWZpZXJ9IG1vZGlmaWVyIFNwZWNpZmllcyBob3cgdG8gbW9kaWZ5IHRoZSBkb2N1bWVudHNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMubXVsdGkgVHJ1ZSB0byBtb2RpZnkgYWxsIG1hdGNoaW5nIGRvY3VtZW50czsgZmFsc2UgdG8gb25seSBtb2RpZnkgb25lIG9mIHRoZSBtYXRjaGluZyBkb2N1bWVudHMgKHRoZSBkZWZhdWx0KS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBPcHRpb25hbC4gIElmIHByZXNlbnQsIGNhbGxlZCB3aXRoIGFuIGVycm9yIG9iamVjdCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgYW5kLCBpZiBubyBlcnJvciwgdGhlIG51bWJlciBvZiBhZmZlY3RlZCBkb2N1bWVudHMgYXMgdGhlIHNlY29uZC5cbiAgICovXG4gIHVwc2VydChzZWxlY3RvciwgbW9kaWZpZXIsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCFjYWxsYmFjayAmJiB0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnVwZGF0ZShcbiAgICAgIHNlbGVjdG9yLFxuICAgICAgbW9kaWZpZXIsXG4gICAgICB7XG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIF9yZXR1cm5PYmplY3Q6IHRydWUsXG4gICAgICAgIHVwc2VydDogdHJ1ZSxcbiAgICAgIH0pO1xuICB9LFxufVxuXG4vLyBDb252ZXJ0IHRoZSBjYWxsYmFjayB0byBub3QgcmV0dXJuIGEgcmVzdWx0IGlmIHRoZXJlIGlzIGFuIGVycm9yXG5mdW5jdGlvbiB3cmFwQ2FsbGJhY2soY2FsbGJhY2ssIGNvbnZlcnRSZXN1bHQpIHtcbiAgcmV0dXJuIChcbiAgICBjYWxsYmFjayAmJlxuICAgIGZ1bmN0aW9uKGVycm9yLCByZXN1bHQpIHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBjYWxsYmFjayhlcnJvcik7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb252ZXJ0UmVzdWx0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBjb252ZXJ0UmVzdWx0KHJlc3VsdCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIHJlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuICApO1xufVxuXG5mdW5jdGlvbiBwb3BDYWxsYmFja0Zyb21BcmdzKGFyZ3MpIHtcbiAgLy8gUHVsbCBvZmYgYW55IGNhbGxiYWNrIChvciBwZXJoYXBzIGEgJ2NhbGxiYWNrJyB2YXJpYWJsZSB0aGF0IHdhcyBwYXNzZWRcbiAgLy8gaW4gdW5kZWZpbmVkLCBsaWtlIGhvdyAndXBzZXJ0JyBkb2VzIGl0KS5cbiAgaWYgKFxuICAgIGFyZ3MubGVuZ3RoICYmXG4gICAgKGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gaW5zdGFuY2VvZiBGdW5jdGlvbilcbiAgKSB7XG4gICAgcmV0dXJuIGFyZ3MucG9wKCk7XG4gIH1cbn1cbiIsIi8qKlxuICogQHN1bW1hcnkgQWxsb3dzIGZvciB1c2VyIHNwZWNpZmllZCBjb25uZWN0aW9uIG9wdGlvbnNcbiAqIEBleGFtcGxlIGh0dHA6Ly9tb25nb2RiLmdpdGh1Yi5pby9ub2RlLW1vbmdvZGItbmF0aXZlLzMuMC9yZWZlcmVuY2UvY29ubmVjdGluZy9jb25uZWN0aW9uLXNldHRpbmdzL1xuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVXNlciBzcGVjaWZpZWQgTW9uZ28gY29ubmVjdGlvbiBvcHRpb25zXG4gKi9cbk1vbmdvLnNldENvbm5lY3Rpb25PcHRpb25zID0gZnVuY3Rpb24gc2V0Q29ubmVjdGlvbk9wdGlvbnMgKG9wdGlvbnMpIHtcbiAgY2hlY2sob3B0aW9ucywgT2JqZWN0KTtcbiAgTW9uZ28uX2Nvbm5lY3Rpb25PcHRpb25zID0gb3B0aW9ucztcbn07IiwiZXhwb3J0IGNvbnN0IG5vcm1hbGl6ZVByb2plY3Rpb24gPSBvcHRpb25zID0+IHtcbiAgLy8gdHJhbnNmb3JtIGZpZWxkcyBrZXkgaW4gcHJvamVjdGlvblxuICBjb25zdCB7IGZpZWxkcywgcHJvamVjdGlvbiwgLi4ub3RoZXJPcHRpb25zIH0gPSBvcHRpb25zIHx8IHt9O1xuICAvLyBUT0RPOiBlbmFibGUgdGhpcyBjb21tZW50IHdoZW4gZGVwcmVjYXRpbmcgdGhlIGZpZWxkcyBvcHRpb25cbiAgLy8gTG9nLmRlYnVnKGBmaWVsZHMgb3B0aW9uIGhhcyBiZWVuIGRlcHJlY2F0ZWQsIHBsZWFzZSB1c2UgdGhlIG5ldyAncHJvamVjdGlvbicgaW5zdGVhZGApXG5cbiAgcmV0dXJuIHtcbiAgICAuLi5vdGhlck9wdGlvbnMsXG4gICAgLi4uKHByb2plY3Rpb24gfHwgZmllbGRzID8geyBwcm9qZWN0aW9uOiBmaWVsZHMgfHwgcHJvamVjdGlvbiB9IDoge30pLFxuICB9O1xufTtcbiIsImltcG9ydCB7IE9ic2VydmVIYW5kbGVDYWxsYmFjaywgT2JzZXJ2ZU11bHRpcGxleGVyIH0gZnJvbSAnLi9vYnNlcnZlX211bHRpcGxleCc7XG5cbmxldCBuZXh0T2JzZXJ2ZUhhbmRsZUlkID0gMTtcblxuZXhwb3J0IHR5cGUgT2JzZXJ2ZUhhbmRsZUNhbGxiYWNrSW50ZXJuYWwgPSAnX2FkZGVkJyB8ICdfYWRkZWRCZWZvcmUnIHwgJ19jaGFuZ2VkJyB8ICdfbW92ZWRCZWZvcmUnIHwgJ19yZW1vdmVkJztcblxuXG5leHBvcnQgdHlwZSBDYWxsYmFjazxUID0gYW55PiA9ICguLi5hcmdzOiBUW10pID0+IFByb21pc2U8dm9pZD4gfCB2b2lkO1xuXG4vKipcbiAqIFRoZSBcIm9ic2VydmUgaGFuZGxlXCIgcmV0dXJuZWQgZnJvbSBvYnNlcnZlQ2hhbmdlcy5cbiAqIENvbnRhaW5zIGEgcmVmZXJlbmNlIHRvIGFuIE9ic2VydmVNdWx0aXBsZXhlci5cbiAqIFVzZWQgdG8gc3RvcCBvYnNlcnZhdGlvbiBhbmQgY2xlYW4gdXAgcmVzb3VyY2VzLlxuICovXG5leHBvcnQgY2xhc3MgT2JzZXJ2ZUhhbmRsZTxUID0gYW55PiB7XG4gIF9pZDogbnVtYmVyO1xuICBfbXVsdGlwbGV4ZXI6IE9ic2VydmVNdWx0aXBsZXhlcjtcbiAgbm9uTXV0YXRpbmdDYWxsYmFja3M6IGJvb2xlYW47XG4gIF9zdG9wcGVkOiBib29sZWFuO1xuXG4gIHB1YmxpYyBpbml0aWFsQWRkc1NlbnRSZXNvbHZlcjogKHZhbHVlOiB2b2lkKSA9PiB2b2lkID0gKCkgPT4ge307XG4gIHB1YmxpYyBpbml0aWFsQWRkc1NlbnQ6IFByb21pc2U8dm9pZD5cblxuICBfYWRkZWQ/OiBDYWxsYmFjazxUPjtcbiAgX2FkZGVkQmVmb3JlPzogQ2FsbGJhY2s8VD47XG4gIF9jaGFuZ2VkPzogQ2FsbGJhY2s8VD47XG4gIF9tb3ZlZEJlZm9yZT86IENhbGxiYWNrPFQ+O1xuICBfcmVtb3ZlZD86IENhbGxiYWNrPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKG11bHRpcGxleGVyOiBPYnNlcnZlTXVsdGlwbGV4ZXIsIGNhbGxiYWNrczogUmVjb3JkPE9ic2VydmVIYW5kbGVDYWxsYmFjaywgQ2FsbGJhY2s8VD4+LCBub25NdXRhdGluZ0NhbGxiYWNrczogYm9vbGVhbikge1xuICAgIHRoaXMuX211bHRpcGxleGVyID0gbXVsdGlwbGV4ZXI7XG5cbiAgICBtdWx0aXBsZXhlci5jYWxsYmFja05hbWVzKCkuZm9yRWFjaCgobmFtZTogT2JzZXJ2ZUhhbmRsZUNhbGxiYWNrKSA9PiB7XG4gICAgICBpZiAoY2FsbGJhY2tzW25hbWVdKSB7XG4gICAgICAgIHRoaXNbYF8ke25hbWV9YCBhcyBPYnNlcnZlSGFuZGxlQ2FsbGJhY2tJbnRlcm5hbF0gPSBjYWxsYmFja3NbbmFtZV07XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKG5hbWUgPT09IFwiYWRkZWRCZWZvcmVcIiAmJiBjYWxsYmFja3MuYWRkZWQpIHtcbiAgICAgICAgdGhpcy5fYWRkZWRCZWZvcmUgPSBhc3luYyBmdW5jdGlvbiAoaWQsIGZpZWxkcywgYmVmb3JlKSB7XG4gICAgICAgICAgYXdhaXQgY2FsbGJhY2tzLmFkZGVkKGlkLCBmaWVsZHMpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5fc3RvcHBlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2lkID0gbmV4dE9ic2VydmVIYW5kbGVJZCsrO1xuICAgIHRoaXMubm9uTXV0YXRpbmdDYWxsYmFja3MgPSBub25NdXRhdGluZ0NhbGxiYWNrcztcblxuICAgIHRoaXMuaW5pdGlhbEFkZHNTZW50ID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICBjb25zdCByZWFkeSA9ICgpID0+IHtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB0aGlzLmluaXRpYWxBZGRzU2VudCA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dChyZWFkeSwgMzAwMDApXG5cbiAgICAgIHRoaXMuaW5pdGlhbEFkZHNTZW50UmVzb2x2ZXIgPSAoKSA9PiB7XG4gICAgICAgIHJlYWR5KCk7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXNpbmcgcHJvcGVydHkgc3ludGF4IGFuZCBhcnJvdyBmdW5jdGlvbiBzeW50YXggdG8gYXZvaWQgYmluZGluZyB0aGUgd3JvbmcgY29udGV4dCBvbiBjYWxsYmFja3MuXG4gICAqL1xuICBzdG9wID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICh0aGlzLl9zdG9wcGVkKSByZXR1cm47XG4gICAgdGhpcy5fc3RvcHBlZCA9IHRydWU7XG4gICAgYXdhaXQgdGhpcy5fbXVsdGlwbGV4ZXIucmVtb3ZlSGFuZGxlKHRoaXMuX2lkKTtcbiAgfVxufSJdfQ==
