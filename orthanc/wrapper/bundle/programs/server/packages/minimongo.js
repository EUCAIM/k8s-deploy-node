Package["core-runtime"].queue("minimongo",function () {/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EmitterPromise = Package.meteor.EmitterPromise;
var DiffSequence = Package['diff-sequence'].DiffSequence;
var ECMAScript = Package.ecmascript.ECMAScript;
var EJSON = Package.ejson.EJSON;
var GeoJSON = Package['geojson-utils'].GeoJSON;
var IdMap = Package['id-map'].IdMap;
var MongoID = Package['mongo-id'].MongoID;
var OrderedDict = Package['ordered-dict'].OrderedDict;
var Random = Package.random.Random;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Decimal = Package['mongo-decimal'].Decimal;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var MinimongoTest, MinimongoError, LocalCollection, Minimongo;

var require = meteorInstall({"node_modules":{"meteor":{"minimongo":{"minimongo_server.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/minimongo_server.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!module.wrapAsync(async function (module, __reifyWaitForDeps__, __reifyAsyncResult__) {"use strict"; try {module.link('./minimongo_common.js');let hasOwn,isNumericKey,isOperatorObject,pathsToTree,projectionDetails;module.link('./common.js',{hasOwn(v){hasOwn=v},isNumericKey(v){isNumericKey=v},isOperatorObject(v){isOperatorObject=v},pathsToTree(v){pathsToTree=v},projectionDetails(v){projectionDetails=v}},0);if (__reifyWaitForDeps__()) (await __reifyWaitForDeps__())();

Minimongo._pathsElidingNumericKeys = (paths)=>paths.map((path)=>path.split('.').filter((part)=>!isNumericKey(part)).join('.'));
// Returns true if the modifier applied to some document may change the result
// of matching the document by selector
// The modifier is always in a form of Object:
//  - $set
//    - 'a.b.22.z': value
//    - 'foo.bar': 42
//  - $unset
//    - 'abc.d': 1
Minimongo.Matcher.prototype.affectedByModifier = function(modifier) {
    // safe check for $set/$unset being objects
    modifier = Object.assign({
        $set: {},
        $unset: {}
    }, modifier);
    const meaningfulPaths = this._getPaths();
    const modifiedPaths = [].concat(Object.keys(modifier.$set), Object.keys(modifier.$unset));
    return modifiedPaths.some((path)=>{
        const mod = path.split('.');
        return meaningfulPaths.some((meaningfulPath)=>{
            const sel = meaningfulPath.split('.');
            let i = 0, j = 0;
            while(i < sel.length && j < mod.length){
                if (isNumericKey(sel[i]) && isNumericKey(mod[j])) {
                    // foo.4.bar selector affected by foo.4 modifier
                    // foo.3.bar selector unaffected by foo.4 modifier
                    if (sel[i] === mod[j]) {
                        i++;
                        j++;
                    } else {
                        return false;
                    }
                } else if (isNumericKey(sel[i])) {
                    // foo.4.bar selector unaffected by foo.bar modifier
                    return false;
                } else if (isNumericKey(mod[j])) {
                    j++;
                } else if (sel[i] === mod[j]) {
                    i++;
                    j++;
                } else {
                    return false;
                }
            }
            // One is a prefix of another, taking numeric fields into account
            return true;
        });
    });
};
// @param modifier - Object: MongoDB-styled modifier with `$set`s and `$unsets`
//                           only. (assumed to come from oplog)
// @returns - Boolean: if after applying the modifier, selector can start
//                     accepting the modified value.
// NOTE: assumes that document affected by modifier didn't match this Matcher
// before, so if modifier can't convince selector in a positive change it would
// stay 'false'.
// Currently doesn't support $-operators and numeric indices precisely.
Minimongo.Matcher.prototype.canBecomeTrueByModifier = function(modifier) {
    if (!this.affectedByModifier(modifier)) {
        return false;
    }
    if (!this.isSimple()) {
        return true;
    }
    modifier = Object.assign({
        $set: {},
        $unset: {}
    }, modifier);
    const modifierPaths = [].concat(Object.keys(modifier.$set), Object.keys(modifier.$unset));
    if (this._getPaths().some(pathHasNumericKeys) || modifierPaths.some(pathHasNumericKeys)) {
        return true;
    }
    // check if there is a $set or $unset that indicates something is an
    // object rather than a scalar in the actual object where we saw $-operator
    // NOTE: it is correct since we allow only scalars in $-operators
    // Example: for selector {'a.b': {$gt: 5}} the modifier {'a.b.c':7} would
    // definitely set the result to false as 'a.b' appears to be an object.
    const expectedScalarIsObject = Object.keys(this._selector).some((path)=>{
        if (!isOperatorObject(this._selector[path])) {
            return false;
        }
        return modifierPaths.some((modifierPath)=>modifierPath.startsWith(`${path}.`));
    });
    if (expectedScalarIsObject) {
        return false;
    }
    // See if we can apply the modifier on the ideally matching object. If it
    // still matches the selector, then the modifier could have turned the real
    // object in the database into something matching.
    const matchingDocument = EJSON.clone(this.matchingDocument());
    // The selector is too complex, anything can happen.
    if (matchingDocument === null) {
        return true;
    }
    try {
        LocalCollection._modify(matchingDocument, modifier);
    } catch (error) {
        // Couldn't set a property on a field which is a scalar or null in the
        // selector.
        // Example:
        // real document: { 'a.b': 3 }
        // selector: { 'a': 12 }
        // converted selector (ideal document): { 'a': 12 }
        // modifier: { $set: { 'a.b': 4 } }
        // We don't know what real document was like but from the error raised by
        // $set on a scalar field we can reason that the structure of real document
        // is completely different.
        if (error.name === 'MinimongoError' && error.setPropertyError) {
            return false;
        }
        throw error;
    }
    return this.documentMatches(matchingDocument).result;
};
// Knows how to combine a mongo selector and a fields projection to a new fields
// projection taking into account active fields from the passed selector.
// @returns Object - projection object (same as fields option of mongo cursor)
Minimongo.Matcher.prototype.combineIntoProjection = function(projection) {
    const selectorPaths = Minimongo._pathsElidingNumericKeys(this._getPaths());
    // Special case for $where operator in the selector - projection should depend
    // on all fields of the document. getSelectorPaths returns a list of paths
    // selector depends on. If one of the paths is '' (empty string) representing
    // the root or the whole document, complete projection should be returned.
    if (selectorPaths.includes('')) {
        return {};
    }
    return combineImportantPathsIntoProjection(selectorPaths, projection);
};
// Returns an object that would match the selector if possible or null if the
// selector is too complex for us to analyze
// { 'a.b': { ans: 42 }, 'foo.bar': null, 'foo.baz': "something" }
// => { a: { b: { ans: 42 } }, foo: { bar: null, baz: "something" } }
Minimongo.Matcher.prototype.matchingDocument = function() {
    // check if it was computed before
    if (this._matchingDocument !== undefined) {
        return this._matchingDocument;
    }
    // If the analysis of this selector is too hard for our implementation
    // fallback to "YES"
    let fallback = false;
    this._matchingDocument = pathsToTree(this._getPaths(), (path)=>{
        const valueSelector = this._selector[path];
        if (isOperatorObject(valueSelector)) {
            // if there is a strict equality, there is a good
            // chance we can use one of those as "matching"
            // dummy value
            if (valueSelector.$eq) {
                return valueSelector.$eq;
            }
            if (valueSelector.$in) {
                const matcher = new Minimongo.Matcher({
                    placeholder: valueSelector
                });
                // Return anything from $in that matches the whole selector for this
                // path. If nothing matches, returns `undefined` as nothing can make
                // this selector into `true`.
                return valueSelector.$in.find((placeholder)=>matcher.documentMatches({
                        placeholder
                    }).result);
            }
            if (onlyContainsKeys(valueSelector, [
                '$gt',
                '$gte',
                '$lt',
                '$lte'
            ])) {
                let lowerBound = -Infinity;
                let upperBound = Infinity;
                [
                    '$lte',
                    '$lt'
                ].forEach((op)=>{
                    if (hasOwn.call(valueSelector, op) && valueSelector[op] < upperBound) {
                        upperBound = valueSelector[op];
                    }
                });
                [
                    '$gte',
                    '$gt'
                ].forEach((op)=>{
                    if (hasOwn.call(valueSelector, op) && valueSelector[op] > lowerBound) {
                        lowerBound = valueSelector[op];
                    }
                });
                const middle = (lowerBound + upperBound) / 2;
                const matcher = new Minimongo.Matcher({
                    placeholder: valueSelector
                });
                if (!matcher.documentMatches({
                    placeholder: middle
                }).result && (middle === lowerBound || middle === upperBound)) {
                    fallback = true;
                }
                return middle;
            }
            if (onlyContainsKeys(valueSelector, [
                '$nin',
                '$ne'
            ])) {
                // Since this._isSimple makes sure $nin and $ne are not combined with
                // objects or arrays, we can confidently return an empty object as it
                // never matches any scalar.
                return {};
            }
            fallback = true;
        }
        return this._selector[path];
    }, (x)=>x);
    if (fallback) {
        this._matchingDocument = null;
    }
    return this._matchingDocument;
};
// Minimongo.Sorter gets a similar method, which delegates to a Matcher it made
// for this exact purpose.
Minimongo.Sorter.prototype.affectedByModifier = function(modifier) {
    return this._selectorForAffectedByModifier.affectedByModifier(modifier);
};
Minimongo.Sorter.prototype.combineIntoProjection = function(projection) {
    return combineImportantPathsIntoProjection(Minimongo._pathsElidingNumericKeys(this._getPaths()), projection);
};
function combineImportantPathsIntoProjection(paths, projection) {
    const details = projectionDetails(projection);
    // merge the paths to include
    const tree = pathsToTree(paths, (path)=>true, (node, path, fullPath)=>true, details.tree);
    const mergedProjection = treeToPaths(tree);
    if (details.including) {
        // both selector and projection are pointing on fields to include
        // so we can just return the merged tree
        return mergedProjection;
    }
    // selector is pointing at fields to include
    // projection is pointing at fields to exclude
    // make sure we don't exclude important paths
    const mergedExclProjection = {};
    Object.keys(mergedProjection).forEach((path)=>{
        if (!mergedProjection[path]) {
            mergedExclProjection[path] = false;
        }
    });
    return mergedExclProjection;
}
function getPaths(selector) {
    return Object.keys(new Minimongo.Matcher(selector)._paths);
// XXX remove it?
// return Object.keys(selector).map(k => {
//   // we don't know how to handle $where because it can be anything
//   if (k === '$where') {
//     return ''; // matches everything
//   }
//   // we branch from $or/$and/$nor operator
//   if (['$or', '$and', '$nor'].includes(k)) {
//     return selector[k].map(getPaths);
//   }
//   // the value is a literal or some comparison operator
//   return k;
// })
//   .reduce((a, b) => a.concat(b), [])
//   .filter((a, b, c) => c.indexOf(a) === b);
}
// A helper to ensure object has only certain keys
function onlyContainsKeys(obj, keys) {
    return Object.keys(obj).every((k)=>keys.includes(k));
}
function pathHasNumericKeys(path) {
    return path.split('.').some(isNumericKey);
}
// Returns a set of key paths similar to
// { 'foo.bar': 1, 'a.b.c': 1 }
function treeToPaths(tree, prefix = '') {
    const result = {};
    Object.keys(tree).forEach((key)=>{
        const value = tree[key];
        if (value === Object(value)) {
            Object.assign(result, treeToPaths(value, `${prefix + key}.`));
        } else {
            result[prefix + key] = value;
        }
    });
    return result;
}
//*/
__reifyAsyncResult__();} catch (_reifyError) { __reifyAsyncResult__(_reifyError); }}, { self: this, async: false });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"common.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/common.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({MiniMongoQueryError:()=>MiniMongoQueryError,compileDocumentSelector:()=>compileDocumentSelector,equalityElementMatcher:()=>equalityElementMatcher,expandArraysInBranches:()=>expandArraysInBranches,isIndexable:()=>isIndexable,isNumericKey:()=>isNumericKey,isOperatorObject:()=>isOperatorObject,makeLookupFunction:()=>makeLookupFunction,nothingMatcher:()=>nothingMatcher,pathsToTree:()=>pathsToTree,populateDocumentWithQueryFields:()=>populateDocumentWithQueryFields,projectionDetails:()=>projectionDetails,regexpElementMatcher:()=>regexpElementMatcher});module.export({hasOwn:()=>hasOwn,ELEMENT_OPERATORS:()=>ELEMENT_OPERATORS},true);let LocalCollection;module.link('./local_collection.js',{default(v){LocalCollection=v}},0);
const hasOwn = Object.prototype.hasOwnProperty;
class MiniMongoQueryError extends Error {
}
// Each element selector contains:
//  - compileElementSelector, a function with args:
//    - operand - the "right hand side" of the operator
//    - valueSelector - the "context" for the operator (so that $regex can find
//      $options)
//    - matcher - the Matcher this is going into (so that $elemMatch can compile
//      more things)
//    returning a function mapping a single value to bool.
//  - dontExpandLeafArrays, a bool which prevents expandArraysInBranches from
//    being called
//  - dontIncludeLeafArrays, a bool which causes an argument to be passed to
//    expandArraysInBranches if it is called
const ELEMENT_OPERATORS = {
    $lt: makeInequality((cmpValue)=>cmpValue < 0),
    $gt: makeInequality((cmpValue)=>cmpValue > 0),
    $lte: makeInequality((cmpValue)=>cmpValue <= 0),
    $gte: makeInequality((cmpValue)=>cmpValue >= 0),
    $mod: {
        compileElementSelector (operand) {
            if (!(Array.isArray(operand) && operand.length === 2 && typeof operand[0] === 'number' && typeof operand[1] === 'number')) {
                throw new MiniMongoQueryError('argument to $mod must be an array of two numbers');
            }
            // XXX could require to be ints or round or something
            const divisor = operand[0];
            const remainder = operand[1];
            return (value)=>typeof value === 'number' && value % divisor === remainder;
        }
    },
    $in: {
        compileElementSelector (operand) {
            if (!Array.isArray(operand)) {
                throw new MiniMongoQueryError('$in needs an array');
            }
            const elementMatchers = operand.map((option)=>{
                if (option instanceof RegExp) {
                    return regexpElementMatcher(option);
                }
                if (isOperatorObject(option)) {
                    throw new MiniMongoQueryError('cannot nest $ under $in');
                }
                return equalityElementMatcher(option);
            });
            return (value)=>{
                // Allow {a: {$in: [null]}} to match when 'a' does not exist.
                if (value === undefined) {
                    value = null;
                }
                return elementMatchers.some((matcher)=>matcher(value));
            };
        }
    },
    $size: {
        // {a: [[5, 5]]} must match {a: {$size: 1}} but not {a: {$size: 2}}, so we
        // don't want to consider the element [5,5] in the leaf array [[5,5]] as a
        // possible value.
        dontExpandLeafArrays: true,
        compileElementSelector (operand) {
            if (typeof operand === 'string') {
                // Don't ask me why, but by experimentation, this seems to be what Mongo
                // does.
                operand = 0;
            } else if (typeof operand !== 'number') {
                throw new MiniMongoQueryError('$size needs a number');
            }
            return (value)=>Array.isArray(value) && value.length === operand;
        }
    },
    $type: {
        // {a: [5]} must not match {a: {$type: 4}} (4 means array), but it should
        // match {a: {$type: 1}} (1 means number), and {a: [[5]]} must match {$a:
        // {$type: 4}}. Thus, when we see a leaf array, we *should* expand it but
        // should *not* include it itself.
        dontIncludeLeafArrays: true,
        compileElementSelector (operand) {
            if (typeof operand === 'string') {
                const operandAliasMap = {
                    'double': 1,
                    'string': 2,
                    'object': 3,
                    'array': 4,
                    'binData': 5,
                    'undefined': 6,
                    'objectId': 7,
                    'bool': 8,
                    'date': 9,
                    'null': 10,
                    'regex': 11,
                    'dbPointer': 12,
                    'javascript': 13,
                    'symbol': 14,
                    'javascriptWithScope': 15,
                    'int': 16,
                    'timestamp': 17,
                    'long': 18,
                    'decimal': 19,
                    'minKey': -1,
                    'maxKey': 127
                };
                if (!hasOwn.call(operandAliasMap, operand)) {
                    throw new MiniMongoQueryError(`unknown string alias for $type: ${operand}`);
                }
                operand = operandAliasMap[operand];
            } else if (typeof operand === 'number') {
                if (operand === 0 || operand < -1 || operand > 19 && operand !== 127) {
                    throw new MiniMongoQueryError(`Invalid numerical $type code: ${operand}`);
                }
            } else {
                throw new MiniMongoQueryError('argument to $type is not a number or a string');
            }
            return (value)=>value !== undefined && LocalCollection._f._type(value) === operand;
        }
    },
    $bitsAllSet: {
        compileElementSelector (operand) {
            const mask = getOperandBitmask(operand, '$bitsAllSet');
            return (value)=>{
                const bitmask = getValueBitmask(value, mask.length);
                return bitmask && mask.every((byte, i)=>(bitmask[i] & byte) === byte);
            };
        }
    },
    $bitsAnySet: {
        compileElementSelector (operand) {
            const mask = getOperandBitmask(operand, '$bitsAnySet');
            return (value)=>{
                const bitmask = getValueBitmask(value, mask.length);
                return bitmask && mask.some((byte, i)=>(~bitmask[i] & byte) !== byte);
            };
        }
    },
    $bitsAllClear: {
        compileElementSelector (operand) {
            const mask = getOperandBitmask(operand, '$bitsAllClear');
            return (value)=>{
                const bitmask = getValueBitmask(value, mask.length);
                return bitmask && mask.every((byte, i)=>!(bitmask[i] & byte));
            };
        }
    },
    $bitsAnyClear: {
        compileElementSelector (operand) {
            const mask = getOperandBitmask(operand, '$bitsAnyClear');
            return (value)=>{
                const bitmask = getValueBitmask(value, mask.length);
                return bitmask && mask.some((byte, i)=>(bitmask[i] & byte) !== byte);
            };
        }
    },
    $regex: {
        compileElementSelector (operand, valueSelector) {
            if (!(typeof operand === 'string' || operand instanceof RegExp)) {
                throw new MiniMongoQueryError('$regex has to be a string or RegExp');
            }
            let regexp;
            if (valueSelector.$options !== undefined) {
                // Options passed in $options (even the empty string) always overrides
                // options in the RegExp object itself.
                // Be clear that we only support the JS-supported options, not extended
                // ones (eg, Mongo supports x and s). Ideally we would implement x and s
                // by transforming the regexp, but not today...
                if (/[^gim]/.test(valueSelector.$options)) {
                    throw new MiniMongoQueryError('Only the i, m, and g regexp options are supported');
                }
                const source = operand instanceof RegExp ? operand.source : operand;
                regexp = new RegExp(source, valueSelector.$options);
            } else if (operand instanceof RegExp) {
                regexp = operand;
            } else {
                regexp = new RegExp(operand);
            }
            return regexpElementMatcher(regexp);
        }
    },
    $elemMatch: {
        dontExpandLeafArrays: true,
        compileElementSelector (operand, valueSelector, matcher) {
            if (!LocalCollection._isPlainObject(operand)) {
                throw new MiniMongoQueryError('$elemMatch need an object');
            }
            const isDocMatcher = !isOperatorObject(Object.keys(operand).filter((key)=>!hasOwn.call(LOGICAL_OPERATORS, key)).reduce((a, b)=>Object.assign(a, {
                    [b]: operand[b]
                }), {}), true);
            let subMatcher;
            if (isDocMatcher) {
                // This is NOT the same as compileValueSelector(operand), and not just
                // because of the slightly different calling convention.
                // {$elemMatch: {x: 3}} means "an element has a field x:3", not
                // "consists only of a field x:3". Also, regexps and sub-$ are allowed.
                subMatcher = compileDocumentSelector(operand, matcher, {
                    inElemMatch: true
                });
            } else {
                subMatcher = compileValueSelector(operand, matcher);
            }
            return (value)=>{
                if (!Array.isArray(value)) {
                    return false;
                }
                for(let i = 0; i < value.length; ++i){
                    const arrayElement = value[i];
                    let arg;
                    if (isDocMatcher) {
                        // We can only match {$elemMatch: {b: 3}} against objects.
                        // (We can also match against arrays, if there's numeric indices,
                        // eg {$elemMatch: {'0.b': 3}} or {$elemMatch: {0: 3}}.)
                        if (!isIndexable(arrayElement)) {
                            return false;
                        }
                        arg = arrayElement;
                    } else {
                        // dontIterate ensures that {a: {$elemMatch: {$gt: 5}}} matches
                        // {a: [8]} but not {a: [[8]]}
                        arg = [
                            {
                                value: arrayElement,
                                dontIterate: true
                            }
                        ];
                    }
                    // XXX support $near in $elemMatch by propagating $distance?
                    if (subMatcher(arg).result) {
                        return i; // specially understood to mean "use as arrayIndices"
                    }
                }
                return false;
            };
        }
    }
};
// Operators that appear at the top level of a document selector.
const LOGICAL_OPERATORS = {
    $and (subSelector, matcher, inElemMatch) {
        return andDocumentMatchers(compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch));
    },
    $or (subSelector, matcher, inElemMatch) {
        const matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch);
        // Special case: if there is only one matcher, use it directly, *preserving*
        // any arrayIndices it returns.
        if (matchers.length === 1) {
            return matchers[0];
        }
        return (doc)=>{
            const result = matchers.some((fn)=>fn(doc).result);
            // $or does NOT set arrayIndices when it has multiple
            // sub-expressions. (Tested against MongoDB.)
            return {
                result
            };
        };
    },
    $nor (subSelector, matcher, inElemMatch) {
        const matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch);
        return (doc)=>{
            const result = matchers.every((fn)=>!fn(doc).result);
            // Never set arrayIndices, because we only match if nothing in particular
            // 'matched' (and because this is consistent with MongoDB).
            return {
                result
            };
        };
    },
    $where (selectorValue, matcher) {
        // Record that *any* path may be used.
        matcher._recordPathUsed('');
        matcher._hasWhere = true;
        if (!(selectorValue instanceof Function)) {
            // XXX MongoDB seems to have more complex logic to decide where or or not
            // to add 'return'; not sure exactly what it is.
            selectorValue = Function('obj', `return ${selectorValue}`);
        }
        // We make the document available as both `this` and `obj`.
        // // XXX not sure what we should do if this throws
        return (doc)=>({
                result: selectorValue.call(doc, doc)
            });
    },
    // This is just used as a comment in the query (in MongoDB, it also ends up in
    // query logs); it has no effect on the actual selection.
    $comment () {
        return ()=>({
                result: true
            });
    }
};
// Operators that (unlike LOGICAL_OPERATORS) pertain to individual paths in a
// document, but (unlike ELEMENT_OPERATORS) do not have a simple definition as
// "match each branched value independently and combine with
// convertElementMatcherToBranchedMatcher".
const VALUE_OPERATORS = {
    $eq (operand) {
        return convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand));
    },
    $not (operand, valueSelector, matcher) {
        return invertBranchedMatcher(compileValueSelector(operand, matcher));
    },
    $ne (operand) {
        return invertBranchedMatcher(convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand)));
    },
    $nin (operand) {
        return invertBranchedMatcher(convertElementMatcherToBranchedMatcher(ELEMENT_OPERATORS.$in.compileElementSelector(operand)));
    },
    $exists (operand) {
        const exists = convertElementMatcherToBranchedMatcher((value)=>value !== undefined);
        return operand ? exists : invertBranchedMatcher(exists);
    },
    // $options just provides options for $regex; its logic is inside $regex
    $options (operand, valueSelector) {
        if (!hasOwn.call(valueSelector, '$regex')) {
            throw new MiniMongoQueryError('$options needs a $regex');
        }
        return everythingMatcher;
    },
    // $maxDistance is basically an argument to $near
    $maxDistance (operand, valueSelector) {
        if (!valueSelector.$near) {
            throw new MiniMongoQueryError('$maxDistance needs a $near');
        }
        return everythingMatcher;
    },
    $all (operand, valueSelector, matcher) {
        if (!Array.isArray(operand)) {
            throw new MiniMongoQueryError('$all requires array');
        }
        // Not sure why, but this seems to be what MongoDB does.
        if (operand.length === 0) {
            return nothingMatcher;
        }
        const branchedMatchers = operand.map((criterion)=>{
            // XXX handle $all/$elemMatch combination
            if (isOperatorObject(criterion)) {
                throw new MiniMongoQueryError('no $ expressions in $all');
            }
            // This is always a regexp or equality selector.
            return compileValueSelector(criterion, matcher);
        });
        // andBranchedMatchers does NOT require all selectors to return true on the
        // SAME branch.
        return andBranchedMatchers(branchedMatchers);
    },
    $near (operand, valueSelector, matcher, isRoot) {
        if (!isRoot) {
            throw new MiniMongoQueryError('$near can\'t be inside another $ operator');
        }
        matcher._hasGeoQuery = true;
        // There are two kinds of geodata in MongoDB: legacy coordinate pairs and
        // GeoJSON. They use different distance metrics, too. GeoJSON queries are
        // marked with a $geometry property, though legacy coordinates can be
        // matched using $geometry.
        let maxDistance, point, distance;
        if (LocalCollection._isPlainObject(operand) && hasOwn.call(operand, '$geometry')) {
            // GeoJSON "2dsphere" mode.
            maxDistance = operand.$maxDistance;
            point = operand.$geometry;
            distance = (value)=>{
                // XXX: for now, we don't calculate the actual distance between, say,
                // polygon and circle. If people care about this use-case it will get
                // a priority.
                if (!value) {
                    return null;
                }
                if (!value.type) {
                    return GeoJSON.pointDistance(point, {
                        type: 'Point',
                        coordinates: pointToArray(value)
                    });
                }
                if (value.type === 'Point') {
                    return GeoJSON.pointDistance(point, value);
                }
                return GeoJSON.geometryWithinRadius(value, point, maxDistance) ? 0 : maxDistance + 1;
            };
        } else {
            maxDistance = valueSelector.$maxDistance;
            if (!isIndexable(operand)) {
                throw new MiniMongoQueryError('$near argument must be coordinate pair or GeoJSON');
            }
            point = pointToArray(operand);
            distance = (value)=>{
                if (!isIndexable(value)) {
                    return null;
                }
                return distanceCoordinatePairs(point, value);
            };
        }
        return (branchedValues)=>{
            // There might be multiple points in the document that match the given
            // field. Only one of them needs to be within $maxDistance, but we need to
            // evaluate all of them and use the nearest one for the implicit sort
            // specifier. (That's why we can't just use ELEMENT_OPERATORS here.)
            //
            // Note: This differs from MongoDB's implementation, where a document will
            // actually show up *multiple times* in the result set, with one entry for
            // each within-$maxDistance branching point.
            const result = {
                result: false
            };
            expandArraysInBranches(branchedValues).every((branch)=>{
                // if operation is an update, don't skip branches, just return the first
                // one (#3599)
                let curDistance;
                if (!matcher._isUpdate) {
                    if (!(typeof branch.value === 'object')) {
                        return true;
                    }
                    curDistance = distance(branch.value);
                    // Skip branches that aren't real points or are too far away.
                    if (curDistance === null || curDistance > maxDistance) {
                        return true;
                    }
                    // Skip anything that's a tie.
                    if (result.distance !== undefined && result.distance <= curDistance) {
                        return true;
                    }
                }
                result.result = true;
                result.distance = curDistance;
                if (branch.arrayIndices) {
                    result.arrayIndices = branch.arrayIndices;
                } else {
                    delete result.arrayIndices;
                }
                return !matcher._isUpdate;
            });
            return result;
        };
    }
};
// NB: We are cheating and using this function to implement 'AND' for both
// 'document matchers' and 'branched matchers'. They both return result objects
// but the argument is different: for the former it's a whole doc, whereas for
// the latter it's an array of 'branched values'.
function andSomeMatchers(subMatchers) {
    if (subMatchers.length === 0) {
        return everythingMatcher;
    }
    if (subMatchers.length === 1) {
        return subMatchers[0];
    }
    return (docOrBranches)=>{
        const match = {};
        match.result = subMatchers.every((fn)=>{
            const subResult = fn(docOrBranches);
            // Copy a 'distance' number out of the first sub-matcher that has
            // one. Yes, this means that if there are multiple $near fields in a
            // query, something arbitrary happens; this appears to be consistent with
            // Mongo.
            if (subResult.result && subResult.distance !== undefined && match.distance === undefined) {
                match.distance = subResult.distance;
            }
            // Similarly, propagate arrayIndices from sub-matchers... but to match
            // MongoDB behavior, this time the *last* sub-matcher with arrayIndices
            // wins.
            if (subResult.result && subResult.arrayIndices) {
                match.arrayIndices = subResult.arrayIndices;
            }
            return subResult.result;
        });
        // If we didn't actually match, forget any extra metadata we came up with.
        if (!match.result) {
            delete match.distance;
            delete match.arrayIndices;
        }
        return match;
    };
}
const andDocumentMatchers = andSomeMatchers;
const andBranchedMatchers = andSomeMatchers;
function compileArrayOfDocumentSelectors(selectors, matcher, inElemMatch) {
    if (!Array.isArray(selectors) || selectors.length === 0) {
        throw new MiniMongoQueryError('$and/$or/$nor must be nonempty array');
    }
    return selectors.map((subSelector)=>{
        if (!LocalCollection._isPlainObject(subSelector)) {
            throw new MiniMongoQueryError('$or/$and/$nor entries need to be full objects');
        }
        return compileDocumentSelector(subSelector, matcher, {
            inElemMatch
        });
    });
}
// Takes in a selector that could match a full document (eg, the original
// selector). Returns a function mapping document->result object.
//
// matcher is the Matcher object we are compiling.
//
// If this is the root document selector (ie, not wrapped in $and or the like),
// then isRoot is true. (This is used by $near.)
function compileDocumentSelector(docSelector, matcher, options = {}) {
    const docMatchers = Object.keys(docSelector).map((key)=>{
        const subSelector = docSelector[key];
        if (key.substr(0, 1) === '$') {
            // Outer operators are either logical operators (they recurse back into
            // this function), or $where.
            if (!hasOwn.call(LOGICAL_OPERATORS, key)) {
                throw new MiniMongoQueryError(`Unrecognized logical operator: ${key}`);
            }
            matcher._isSimple = false;
            return LOGICAL_OPERATORS[key](subSelector, matcher, options.inElemMatch);
        }
        // Record this path, but only if we aren't in an elemMatcher, since in an
        // elemMatch this is a path inside an object in an array, not in the doc
        // root.
        if (!options.inElemMatch) {
            matcher._recordPathUsed(key);
        }
        // Don't add a matcher if subSelector is a function -- this is to match
        // the behavior of Meteor on the server (inherited from the node mongodb
        // driver), which is to ignore any part of a selector which is a function.
        if (typeof subSelector === 'function') {
            return undefined;
        }
        const lookUpByIndex = makeLookupFunction(key);
        const valueMatcher = compileValueSelector(subSelector, matcher, options.isRoot);
        return (doc)=>valueMatcher(lookUpByIndex(doc));
    }).filter(Boolean);
    return andDocumentMatchers(docMatchers);
}
// Takes in a selector that could match a key-indexed value in a document; eg,
// {$gt: 5, $lt: 9}, or a regular expression, or any non-expression object (to
// indicate equality).  Returns a branched matcher: a function mapping
// [branched value]->result object.
function compileValueSelector(valueSelector, matcher, isRoot) {
    if (valueSelector instanceof RegExp) {
        matcher._isSimple = false;
        return convertElementMatcherToBranchedMatcher(regexpElementMatcher(valueSelector));
    }
    if (isOperatorObject(valueSelector)) {
        return operatorBranchedMatcher(valueSelector, matcher, isRoot);
    }
    return convertElementMatcherToBranchedMatcher(equalityElementMatcher(valueSelector));
}
// Given an element matcher (which evaluates a single value), returns a branched
// value (which evaluates the element matcher on all the branches and returns a
// more structured return value possibly including arrayIndices).
function convertElementMatcherToBranchedMatcher(elementMatcher, options = {}) {
    return (branches)=>{
        const expanded = options.dontExpandLeafArrays ? branches : expandArraysInBranches(branches, options.dontIncludeLeafArrays);
        const match = {};
        match.result = expanded.some((element)=>{
            let matched = elementMatcher(element.value);
            // Special case for $elemMatch: it means "true, and use this as an array
            // index if I didn't already have one".
            if (typeof matched === 'number') {
                // XXX This code dates from when we only stored a single array index
                // (for the outermost array). Should we be also including deeper array
                // indices from the $elemMatch match?
                if (!element.arrayIndices) {
                    element.arrayIndices = [
                        matched
                    ];
                }
                matched = true;
            }
            // If some element matched, and it's tagged with array indices, include
            // those indices in our result object.
            if (matched && element.arrayIndices) {
                match.arrayIndices = element.arrayIndices;
            }
            return matched;
        });
        return match;
    };
}
// Helpers for $near.
function distanceCoordinatePairs(a, b) {
    const pointA = pointToArray(a);
    const pointB = pointToArray(b);
    return Math.hypot(pointA[0] - pointB[0], pointA[1] - pointB[1]);
}
// Takes something that is not an operator object and returns an element matcher
// for equality with that thing.
function equalityElementMatcher(elementSelector) {
    if (isOperatorObject(elementSelector)) {
        throw new MiniMongoQueryError('Can\'t create equalityValueSelector for operator object');
    }
    // Special-case: null and undefined are equal (if you got undefined in there
    // somewhere, or if you got it due to some branch being non-existent in the
    // weird special case), even though they aren't with EJSON.equals.
    // undefined or null
    if (elementSelector == null) {
        return (value)=>value == null;
    }
    return (value)=>LocalCollection._f._equal(elementSelector, value);
}
function everythingMatcher(docOrBranchedValues) {
    return {
        result: true
    };
}
function expandArraysInBranches(branches, skipTheArrays) {
    const branchesOut = [];
    branches.forEach((branch)=>{
        const thisIsArray = Array.isArray(branch.value);
        // We include the branch itself, *UNLESS* we it's an array that we're going
        // to iterate and we're told to skip arrays.  (That's right, we include some
        // arrays even skipTheArrays is true: these are arrays that were found via
        // explicit numerical indices.)
        if (!(skipTheArrays && thisIsArray && !branch.dontIterate)) {
            branchesOut.push({
                arrayIndices: branch.arrayIndices,
                value: branch.value
            });
        }
        if (thisIsArray && !branch.dontIterate) {
            branch.value.forEach((value, i)=>{
                branchesOut.push({
                    arrayIndices: (branch.arrayIndices || []).concat(i),
                    value
                });
            });
        }
    });
    return branchesOut;
}
// Helpers for $bitsAllSet/$bitsAnySet/$bitsAllClear/$bitsAnyClear.
function getOperandBitmask(operand, selector) {
    // numeric bitmask
    // You can provide a numeric bitmask to be matched against the operand field.
    // It must be representable as a non-negative 32-bit signed integer.
    // Otherwise, $bitsAllSet will return an error.
    if (Number.isInteger(operand) && operand >= 0) {
        return new Uint8Array(new Int32Array([
            operand
        ]).buffer);
    }
    // bindata bitmask
    // You can also use an arbitrarily large BinData instance as a bitmask.
    if (EJSON.isBinary(operand)) {
        return new Uint8Array(operand.buffer);
    }
    // position list
    // If querying a list of bit positions, each <position> must be a non-negative
    // integer. Bit positions start at 0 from the least significant bit.
    if (Array.isArray(operand) && operand.every((x)=>Number.isInteger(x) && x >= 0)) {
        const buffer = new ArrayBuffer((Math.max(...operand) >> 3) + 1);
        const view = new Uint8Array(buffer);
        operand.forEach((x)=>{
            view[x >> 3] |= 1 << (x & 0x7);
        });
        return view;
    }
    // bad operand
    throw new MiniMongoQueryError(`operand to ${selector} must be a numeric bitmask (representable as a ` + 'non-negative 32-bit signed integer), a bindata bitmask or an array with ' + 'bit positions (non-negative integers)');
}
function getValueBitmask(value, length) {
    // The field value must be either numerical or a BinData instance. Otherwise,
    // $bits... will not match the current document.
    // numerical
    if (Number.isSafeInteger(value)) {
        // $bits... will not match numerical values that cannot be represented as a
        // signed 64-bit integer. This can be the case if a value is either too
        // large or small to fit in a signed 64-bit integer, or if it has a
        // fractional component.
        const buffer = new ArrayBuffer(Math.max(length, 2 * Uint32Array.BYTES_PER_ELEMENT));
        let view = new Uint32Array(buffer, 0, 2);
        view[0] = value % ((1 << 16) * (1 << 16)) | 0;
        view[1] = value / ((1 << 16) * (1 << 16)) | 0;
        // sign extension
        if (value < 0) {
            view = new Uint8Array(buffer, 2);
            view.forEach((byte, i)=>{
                view[i] = 0xff;
            });
        }
        return new Uint8Array(buffer);
    }
    // bindata
    if (EJSON.isBinary(value)) {
        return new Uint8Array(value.buffer);
    }
    // no match
    return false;
}
// Actually inserts a key value into the selector document
// However, this checks there is no ambiguity in setting
// the value for the given key, throws otherwise
function insertIntoDocument(document, key, value) {
    Object.keys(document).forEach((existingKey)=>{
        if (existingKey.length > key.length && existingKey.indexOf(`${key}.`) === 0 || key.length > existingKey.length && key.indexOf(`${existingKey}.`) === 0) {
            throw new MiniMongoQueryError(`cannot infer query fields to set, both paths '${existingKey}' and '${key}' are matched`);
        } else if (existingKey === key) {
            throw new MiniMongoQueryError(`cannot infer query fields to set, path '${key}' is matched twice`);
        }
    });
    document[key] = value;
}
// Returns a branched matcher that matches iff the given matcher does not.
// Note that this implicitly "deMorganizes" the wrapped function.  ie, it
// means that ALL branch values need to fail to match innerBranchedMatcher.
function invertBranchedMatcher(branchedMatcher) {
    return (branchValues)=>{
        // We explicitly choose to strip arrayIndices here: it doesn't make sense to
        // say "update the array element that does not match something", at least
        // in mongo-land.
        return {
            result: !branchedMatcher(branchValues).result
        };
    };
}
function isIndexable(obj) {
    return Array.isArray(obj) || LocalCollection._isPlainObject(obj);
}
function isNumericKey(s) {
    return /^[0-9]+$/.test(s);
}
// Returns true if this is an object with at least one key and all keys begin
// with $.  Unless inconsistentOK is set, throws if some keys begin with $ and
// others don't.
function isOperatorObject(valueSelector, inconsistentOK) {
    if (!LocalCollection._isPlainObject(valueSelector)) {
        return false;
    }
    let theseAreOperators = undefined;
    Object.keys(valueSelector).forEach((selKey)=>{
        const thisIsOperator = selKey.substr(0, 1) === '$' || selKey === 'diff';
        if (theseAreOperators === undefined) {
            theseAreOperators = thisIsOperator;
        } else if (theseAreOperators !== thisIsOperator) {
            if (!inconsistentOK) {
                throw new MiniMongoQueryError(`Inconsistent operator: ${JSON.stringify(valueSelector)}`);
            }
            theseAreOperators = false;
        }
    });
    return !!theseAreOperators; // {} has no operators
}
// Helper for $lt/$gt/$lte/$gte.
function makeInequality(cmpValueComparator) {
    return {
        compileElementSelector (operand) {
            // Arrays never compare false with non-arrays for any inequality.
            // XXX This was behavior we observed in pre-release MongoDB 2.5, but
            //     it seems to have been reverted.
            //     See https://jira.mongodb.org/browse/SERVER-11444
            if (Array.isArray(operand)) {
                return ()=>false;
            }
            // Special case: consider undefined and null the same (so true with
            // $gte/$lte).
            if (operand === undefined) {
                operand = null;
            }
            const operandType = LocalCollection._f._type(operand);
            return (value)=>{
                if (value === undefined) {
                    value = null;
                }
                // Comparisons are never true among things of different type (except
                // null vs undefined).
                if (LocalCollection._f._type(value) !== operandType) {
                    return false;
                }
                return cmpValueComparator(LocalCollection._f._cmp(value, operand));
            };
        }
    };
}
// makeLookupFunction(key) returns a lookup function.
//
// A lookup function takes in a document and returns an array of matching
// branches.  If no arrays are found while looking up the key, this array will
// have exactly one branches (possibly 'undefined', if some segment of the key
// was not found).
//
// If arrays are found in the middle, this can have more than one element, since
// we 'branch'. When we 'branch', if there are more key segments to look up,
// then we only pursue branches that are plain objects (not arrays or scalars).
// This means we can actually end up with no branches!
//
// We do *NOT* branch on arrays that are found at the end (ie, at the last
// dotted member of the key). We just return that array; if you want to
// effectively 'branch' over the array's values, post-process the lookup
// function with expandArraysInBranches.
//
// Each branch is an object with keys:
//  - value: the value at the branch
//  - dontIterate: an optional bool; if true, it means that 'value' is an array
//    that expandArraysInBranches should NOT expand. This specifically happens
//    when there is a numeric index in the key, and ensures the
//    perhaps-surprising MongoDB behavior where {'a.0': 5} does NOT
//    match {a: [[5]]}.
//  - arrayIndices: if any array indexing was done during lookup (either due to
//    explicit numeric indices or implicit branching), this will be an array of
//    the array indices used, from outermost to innermost; it is falsey or
//    absent if no array index is used. If an explicit numeric index is used,
//    the index will be followed in arrayIndices by the string 'x'.
//
//    Note: arrayIndices is used for two purposes. First, it is used to
//    implement the '$' modifier feature, which only ever looks at its first
//    element.
//
//    Second, it is used for sort key generation, which needs to be able to tell
//    the difference between different paths. Moreover, it needs to
//    differentiate between explicit and implicit branching, which is why
//    there's the somewhat hacky 'x' entry: this means that explicit and
//    implicit array lookups will have different full arrayIndices paths. (That
//    code only requires that different paths have different arrayIndices; it
//    doesn't actually 'parse' arrayIndices. As an alternative, arrayIndices
//    could contain objects with flags like 'implicit', but I think that only
//    makes the code surrounding them more complex.)
//
//    (By the way, this field ends up getting passed around a lot without
//    cloning, so never mutate any arrayIndices field/var in this package!)
//
//
// At the top level, you may only pass in a plain object or array.
//
// See the test 'minimongo - lookup' for some examples of what lookup functions
// return.
function makeLookupFunction(key, options = {}) {
    const parts = key.split('.');
    const firstPart = parts.length ? parts[0] : '';
    const lookupRest = parts.length > 1 && makeLookupFunction(parts.slice(1).join('.'), options);
    function buildResult(arrayIndices, dontIterate, value) {
        return arrayIndices && arrayIndices.length ? dontIterate ? [
            {
                arrayIndices,
                dontIterate,
                value
            }
        ] : [
            {
                arrayIndices,
                value
            }
        ] : dontIterate ? [
            {
                dontIterate,
                value
            }
        ] : [
            {
                value
            }
        ];
    }
    // Doc will always be a plain object or an array.
    // apply an explicit numeric index, an array.
    return (doc, arrayIndices)=>{
        if (Array.isArray(doc)) {
            // If we're being asked to do an invalid lookup into an array (non-integer
            // or out-of-bounds), return no results (which is different from returning
            // a single undefined result, in that `null` equality checks won't match).
            if (!(isNumericKey(firstPart) && firstPart < doc.length)) {
                return [];
            }
            // Remember that we used this array index. Include an 'x' to indicate that
            // the previous index came from being considered as an explicit array
            // index (not branching).
            arrayIndices = arrayIndices ? arrayIndices.concat(+firstPart, 'x') : [
                +firstPart,
                'x'
            ];
        }
        // Do our first lookup.
        const firstLevel = doc[firstPart];
        // If there is no deeper to dig, return what we found.
        //
        // If what we found is an array, most value selectors will choose to treat
        // the elements of the array as matchable values in their own right, but
        // that's done outside of the lookup function. (Exceptions to this are $size
        // and stuff relating to $elemMatch.  eg, {a: {$size: 2}} does not match {a:
        // [[1, 2]]}.)
        //
        // That said, if we just did an *explicit* array lookup (on doc) to find
        // firstLevel, and firstLevel is an array too, we do NOT want value
        // selectors to iterate over it.  eg, {'a.0': 5} does not match {a: [[5]]}.
        // So in that case, we mark the return value as 'don't iterate'.
        if (!lookupRest) {
            return buildResult(arrayIndices, Array.isArray(doc) && Array.isArray(firstLevel), firstLevel);
        }
        // We need to dig deeper.  But if we can't, because what we've found is not
        // an array or plain object, we're done. If we just did a numeric index into
        // an array, we return nothing here (this is a change in Mongo 2.5 from
        // Mongo 2.4, where {'a.0.b': null} stopped matching {a: [5]}). Otherwise,
        // return a single `undefined` (which can, for example, match via equality
        // with `null`).
        if (!isIndexable(firstLevel)) {
            if (Array.isArray(doc)) {
                return [];
            }
            return buildResult(arrayIndices, false, undefined);
        }
        const result = [];
        const appendToResult = (more)=>{
            result.push(...more);
        };
        // Dig deeper: look up the rest of the parts on whatever we've found.
        // (lookupRest is smart enough to not try to do invalid lookups into
        // firstLevel if it's an array.)
        appendToResult(lookupRest(firstLevel, arrayIndices));
        // If we found an array, then in *addition* to potentially treating the next
        // part as a literal integer lookup, we should also 'branch': try to look up
        // the rest of the parts on each array element in parallel.
        //
        // In this case, we *only* dig deeper into array elements that are plain
        // objects. (Recall that we only got this far if we have further to dig.)
        // This makes sense: we certainly don't dig deeper into non-indexable
        // objects. And it would be weird to dig into an array: it's simpler to have
        // a rule that explicit integer indexes only apply to an outer array, not to
        // an array you find after a branching search.
        //
        // In the special case of a numeric part in a *sort selector* (not a query
        // selector), we skip the branching: we ONLY allow the numeric part to mean
        // 'look up this index' in that case, not 'also look up this index in all
        // the elements of the array'.
        if (Array.isArray(firstLevel) && !(isNumericKey(parts[1]) && options.forSort)) {
            firstLevel.forEach((branch, arrayIndex)=>{
                if (LocalCollection._isPlainObject(branch)) {
                    appendToResult(lookupRest(branch, arrayIndices ? arrayIndices.concat(arrayIndex) : [
                        arrayIndex
                    ]));
                }
            });
        }
        return result;
    };
}
// Object exported only for unit testing.
// Use it to export private functions to test in Tinytest.
MinimongoTest = {
    makeLookupFunction
};
MinimongoError = (message, options = {})=>{
    if (typeof message === 'string' && options.field) {
        message += ` for field '${options.field}'`;
    }
    const error = new Error(message);
    error.name = 'MinimongoError';
    return error;
};
function nothingMatcher(docOrBranchedValues) {
    return {
        result: false
    };
}
// Takes an operator object (an object with $ keys) and returns a branched
// matcher for it.
function operatorBranchedMatcher(valueSelector, matcher, isRoot) {
    // Each valueSelector works separately on the various branches.  So one
    // operator can match one branch and another can match another branch.  This
    // is OK.
    const operatorMatchers = Object.keys(valueSelector).map((operator)=>{
        const operand = valueSelector[operator];
        const simpleRange = [
            '$lt',
            '$lte',
            '$gt',
            '$gte'
        ].includes(operator) && typeof operand === 'number';
        const simpleEquality = [
            '$ne',
            '$eq'
        ].includes(operator) && operand !== Object(operand);
        const simpleInclusion = [
            '$in',
            '$nin'
        ].includes(operator) && Array.isArray(operand) && !operand.some((x)=>x === Object(x));
        if (!(simpleRange || simpleInclusion || simpleEquality)) {
            matcher._isSimple = false;
        }
        if (hasOwn.call(VALUE_OPERATORS, operator)) {
            return VALUE_OPERATORS[operator](operand, valueSelector, matcher, isRoot);
        }
        if (hasOwn.call(ELEMENT_OPERATORS, operator)) {
            const options = ELEMENT_OPERATORS[operator];
            return convertElementMatcherToBranchedMatcher(options.compileElementSelector(operand, valueSelector, matcher), options);
        }
        throw new MiniMongoQueryError(`Unrecognized operator: ${operator}`);
    });
    return andBranchedMatchers(operatorMatchers);
}
// paths - Array: list of mongo style paths
// newLeafFn - Function: of form function(path) should return a scalar value to
//                       put into list created for that path
// conflictFn - Function: of form function(node, path, fullPath) is called
//                        when building a tree path for 'fullPath' node on
//                        'path' was already a leaf with a value. Must return a
//                        conflict resolution.
// initial tree - Optional Object: starting tree.
// @returns - Object: tree represented as a set of nested objects
function pathsToTree(paths, newLeafFn, conflictFn, root = {}) {
    paths.forEach((path)=>{
        const pathArray = path.split('.');
        let tree = root;
        // use .every just for iteration with break
        const success = pathArray.slice(0, -1).every((key, i)=>{
            if (!hasOwn.call(tree, key)) {
                tree[key] = {};
            } else if (tree[key] !== Object(tree[key])) {
                tree[key] = conflictFn(tree[key], pathArray.slice(0, i + 1).join('.'), path);
                // break out of loop if we are failing for this path
                if (tree[key] !== Object(tree[key])) {
                    return false;
                }
            }
            tree = tree[key];
            return true;
        });
        if (success) {
            const lastKey = pathArray[pathArray.length - 1];
            if (hasOwn.call(tree, lastKey)) {
                tree[lastKey] = conflictFn(tree[lastKey], path, path);
            } else {
                tree[lastKey] = newLeafFn(path);
            }
        }
    });
    return root;
}
// Makes sure we get 2 elements array and assume the first one to be x and
// the second one to y no matter what user passes.
// In case user passes { lon: x, lat: y } returns [x, y]
function pointToArray(point) {
    return Array.isArray(point) ? point.slice() : [
        point.x,
        point.y
    ];
}
// Creating a document from an upsert is quite tricky.
// E.g. this selector: {"$or": [{"b.foo": {"$all": ["bar"]}}]}, should result
// in: {"b.foo": "bar"}
// But this selector: {"$or": [{"b": {"foo": {"$all": ["bar"]}}}]} should throw
// an error
// Some rules (found mainly with trial & error, so there might be more):
// - handle all childs of $and (or implicit $and)
// - handle $or nodes with exactly 1 child
// - ignore $or nodes with more than 1 child
// - ignore $nor and $not nodes
// - throw when a value can not be set unambiguously
// - every value for $all should be dealt with as separate $eq-s
// - threat all children of $all as $eq setters (=> set if $all.length === 1,
//   otherwise throw error)
// - you can not mix '$'-prefixed keys and non-'$'-prefixed keys
// - you can only have dotted keys on a root-level
// - you can not have '$'-prefixed keys more than one-level deep in an object
// Handles one key/value pair to put in the selector document
function populateDocumentWithKeyValue(document, key, value) {
    if (value && Object.getPrototypeOf(value) === Object.prototype) {
        populateDocumentWithObject(document, key, value);
    } else if (!(value instanceof RegExp)) {
        insertIntoDocument(document, key, value);
    }
}
// Handles a key, value pair to put in the selector document
// if the value is an object
function populateDocumentWithObject(document, key, value) {
    const keys = Object.keys(value);
    const unprefixedKeys = keys.filter((op)=>op[0] !== '$');
    if (unprefixedKeys.length > 0 || !keys.length) {
        // Literal (possibly empty) object ( or empty object )
        // Don't allow mixing '$'-prefixed with non-'$'-prefixed fields
        if (keys.length !== unprefixedKeys.length) {
            throw new MiniMongoQueryError(`unknown operator: ${unprefixedKeys[0]}`);
        }
        validateObject(value, key);
        insertIntoDocument(document, key, value);
    } else {
        Object.keys(value).forEach((op)=>{
            const object = value[op];
            if (op === '$eq') {
                populateDocumentWithKeyValue(document, key, object);
            } else if (op === '$all') {
                // every value for $all should be dealt with as separate $eq-s
                object.forEach((element)=>populateDocumentWithKeyValue(document, key, element));
            }
        });
    }
}
// Fills a document with certain fields from an upsert selector
function populateDocumentWithQueryFields(query, document = {}) {
    if (Object.getPrototypeOf(query) === Object.prototype) {
        // handle implicit $and
        Object.keys(query).forEach((key)=>{
            const value = query[key];
            if (key === '$and') {
                // handle explicit $and
                value.forEach((element)=>populateDocumentWithQueryFields(element, document));
            } else if (key === '$or') {
                // handle $or nodes with exactly 1 child
                if (value.length === 1) {
                    populateDocumentWithQueryFields(value[0], document);
                }
            } else if (key[0] !== '$') {
                // Ignore other '$'-prefixed logical selectors
                populateDocumentWithKeyValue(document, key, value);
            }
        });
    } else {
        // Handle meteor-specific shortcut for selecting _id
        if (LocalCollection._selectorIsId(query)) {
            insertIntoDocument(document, '_id', query);
        }
    }
    return document;
}
// Traverses the keys of passed projection and constructs a tree where all
// leaves are either all True or all False
// @returns Object:
//  - tree - Object - tree representation of keys involved in projection
//  (exception for '_id' as it is a special case handled separately)
//  - including - Boolean - "take only certain fields" type of projection
function projectionDetails(fields) {
    // Find the non-_id keys (_id is handled specially because it is included
    // unless explicitly excluded). Sort the keys, so that our code to detect
    // overlaps like 'foo' and 'foo.bar' can assume that 'foo' comes first.
    let fieldsKeys = Object.keys(fields).sort();
    // If _id is the only field in the projection, do not remove it, since it is
    // required to determine if this is an exclusion or exclusion. Also keep an
    // inclusive _id, since inclusive _id follows the normal rules about mixing
    // inclusive and exclusive fields. If _id is not the only field in the
    // projection and is exclusive, remove it so it can be handled later by a
    // special case, since exclusive _id is always allowed.
    if (!(fieldsKeys.length === 1 && fieldsKeys[0] === '_id') && !(fieldsKeys.includes('_id') && fields._id)) {
        fieldsKeys = fieldsKeys.filter((key)=>key !== '_id');
    }
    let including = null; // Unknown
    fieldsKeys.forEach((keyPath)=>{
        const rule = !!fields[keyPath];
        if (including === null) {
            including = rule;
        }
        // This error message is copied from MongoDB shell
        if (including !== rule) {
            throw MinimongoError('You cannot currently mix including and excluding fields.');
        }
    });
    const projectionRulesTree = pathsToTree(fieldsKeys, (path)=>including, (node, path, fullPath)=>{
        // Check passed projection fields' keys: If you have two rules such as
        // 'foo.bar' and 'foo.bar.baz', then the result becomes ambiguous. If
        // that happens, there is a probability you are doing something wrong,
        // framework should notify you about such mistake earlier on cursor
        // compilation step than later during runtime.  Note, that real mongo
        // doesn't do anything about it and the later rule appears in projection
        // project, more priority it takes.
        //
        // Example, assume following in mongo shell:
        // > db.coll.insert({ a: { b: 23, c: 44 } })
        // > db.coll.find({}, { 'a': 1, 'a.b': 1 })
        // {"_id": ObjectId("520bfe456024608e8ef24af3"), "a": {"b": 23}}
        // > db.coll.find({}, { 'a.b': 1, 'a': 1 })
        // {"_id": ObjectId("520bfe456024608e8ef24af3"), "a": {"b": 23, "c": 44}}
        //
        // Note, how second time the return set of keys is different.
        const currentPath = fullPath;
        const anotherPath = path;
        throw MinimongoError(`both ${currentPath} and ${anotherPath} found in fields option, ` + 'using both of them may trigger unexpected behavior. Did you mean to ' + 'use only one of them?');
    });
    return {
        including,
        tree: projectionRulesTree
    };
}
// Takes a RegExp object and returns an element matcher.
function regexpElementMatcher(regexp) {
    return (value)=>{
        if (value instanceof RegExp) {
            return value.toString() === regexp.toString();
        }
        // Regexps only work against strings.
        if (typeof value !== 'string') {
            return false;
        }
        // Reset regexp's state to avoid inconsistent matching for objects with the
        // same value on consecutive calls of regexp.test. This happens only if the
        // regexp has the 'g' flag. Also note that ES6 introduces a new flag 'y' for
        // which we should *not* change the lastIndex but MongoDB doesn't support
        // either of these flags.
        regexp.lastIndex = 0;
        return regexp.test(value);
    };
}
// Validates the key in a path.
// Objects that are nested more then 1 level cannot have dotted fields
// or fields starting with '$'
function validateKeyInPath(key, path) {
    if (key.includes('.')) {
        throw new Error(`The dotted field '${key}' in '${path}.${key} is not valid for storage.`);
    }
    if (key[0] === '$') {
        throw new Error(`The dollar ($) prefixed field  '${path}.${key} is not valid for storage.`);
    }
}
// Recursively validates an object that is nested more than one level deep
function validateObject(object, path) {
    if (object && Object.getPrototypeOf(object) === Object.prototype) {
        Object.keys(object).forEach((key)=>{
            validateKeyInPath(key, path);
            validateObject(object[key], path + '.' + key);
        });
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"constants.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/constants.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({getAsyncMethodName:()=>getAsyncMethodName});module.export({ASYNC_COLLECTION_METHODS:()=>ASYNC_COLLECTION_METHODS,ASYNC_CURSOR_METHODS:()=>ASYNC_CURSOR_METHODS,CLIENT_ONLY_METHODS:()=>CLIENT_ONLY_METHODS},true);/** Exported values are also used in the mongo package. */ /** @param {string} method */ function getAsyncMethodName(method) {
    return `${method.replace('_', '')}Async`;
}
const ASYNC_COLLECTION_METHODS = [
    '_createCappedCollection',
    'dropCollection',
    'dropIndex',
    /**
   * @summary Creates the specified index on the collection.
   * @locus server
   * @method createIndexAsync
   * @memberof Mongo.Collection
   * @instance
   * @param {Object} index A document that contains the field and value pairs where the field is the index key and the value describes the type of index for that field. For an ascending index on a field, specify a value of `1`; for descending index, specify a value of `-1`. Use `text` for text indexes.
   * @param {Object} [options] All options are listed in [MongoDB documentation](https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/#options)
   * @param {String} options.name Name of the index
   * @param {Boolean} options.unique Define that the index values must be unique, more at [MongoDB documentation](https://docs.mongodb.com/manual/core/index-unique/)
   * @param {Boolean} options.sparse Define that the index is sparse, more at [MongoDB documentation](https://docs.mongodb.com/manual/core/index-sparse/)
   * @returns {Promise}
   */ 'createIndex',
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
   * @returns {Promise}
   */ 'findOne',
    /**
   * @summary Insert a document in the collection.  Returns its unique _id.
   * @locus Anywhere
   * @method  insertAsync
   * @memberof Mongo.Collection
   * @instance
   * @param {Object} doc The document to insert. May not yet have an _id attribute, in which case Meteor will generate one for you.
   * @return {Promise}
   */ 'insert',
    /**
   * @summary Remove documents from the collection
   * @locus Anywhere
   * @method removeAsync
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} selector Specifies which documents to remove
   * @return {Promise}
   */ 'remove',
    /**
   * @summary Modify one or more documents in the collection. Returns the number of matched documents.
   * @locus Anywhere
   * @method updateAsync
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} selector Specifies which documents to modify
   * @param {MongoModifier} modifier Specifies how to modify the documents
   * @param {Object} [options]
   * @param {Boolean} options.multi True to modify all matching documents; false to only modify one of the matching documents (the default).
   * @param {Boolean} options.upsert True to insert a document if no matching documents are found.
   * @param {Array} options.arrayFilters Optional. Used in combination with MongoDB [filtered positional operator](https://docs.mongodb.com/manual/reference/operator/update/positional-filtered/) to specify which elements to modify in an array field.
   * @return {Promise}
   */ 'update',
    /**
   * @summary Modify one or more documents in the collection, or insert one if no matching documents were found. Returns an object with keys `numberAffected` (the number of documents modified)  and `insertedId` (the unique _id of the document that was inserted, if any).
   * @locus Anywhere
   * @method upsertAsync
   * @memberof Mongo.Collection
   * @instance
   * @param {MongoSelector} selector Specifies which documents to modify
   * @param {MongoModifier} modifier Specifies how to modify the documents
   * @param {Object} [options]
   * @param {Boolean} options.multi True to modify all matching documents; false to only modify one of the matching documents (the default).
   * @return {Promise}
   */ 'upsert'
];
const ASYNC_CURSOR_METHODS = [
    /**
   * @deprecated in 2.9
   * @summary Returns the number of documents that match a query. This method is
   *          [deprecated since MongoDB 4.0](https://www.mongodb.com/docs/v4.4/reference/command/count/);
   *          see `Collection.countDocuments` and
   *          `Collection.estimatedDocumentCount` for a replacement.
   * @memberOf Mongo.Cursor
   * @method  countAsync
   * @instance
   * @locus Anywhere
   * @returns {Promise}
   */ 'count',
    /**
   * @summary Return all matching documents as an Array.
   * @memberOf Mongo.Cursor
   * @method  fetchAsync
   * @instance
   * @locus Anywhere
   * @returns {Promise}
   */ 'fetch',
    /**
   * @summary Call `callback` once for each matching document, sequentially and
   *          synchronously.
   * @locus Anywhere
   * @method  forEachAsync
   * @instance
   * @memberOf Mongo.Cursor
   * @param {IterationCallback} callback Function to call. It will be called
   *                                     with three arguments: the document, a
   *                                     0-based index, and <em>cursor</em>
   *                                     itself.
   * @param {Any} [thisArg] An object which will be the value of `this` inside
   *                        `callback`.
   * @returns {Promise}
   */ 'forEach',
    /**
   * @summary Map callback over all matching documents.  Returns an Array.
   * @locus Anywhere
   * @method mapAsync
   * @instance
   * @memberOf Mongo.Cursor
   * @param {IterationCallback} callback Function to call. It will be called
   *                                     with three arguments: the document, a
   *                                     0-based index, and <em>cursor</em>
   *                                     itself.
   * @param {Any} [thisArg] An object which will be the value of `this` inside
   *                        `callback`.
   * @returns {Promise}
   */ 'map'
];
const CLIENT_ONLY_METHODS = [
    "findOne",
    "insert",
    "remove",
    "update",
    "upsert"
];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cursor.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/cursor.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({default:()=>Cursor});let _async_to_generator;module.link("@swc/helpers/_/_async_to_generator",{_(v){_async_to_generator=v}},0);let LocalCollection;module.link('./local_collection.js',{default(v){LocalCollection=v}},1);let hasOwn;module.link('./common.js',{hasOwn(v){hasOwn=v}},2);let ASYNC_CURSOR_METHODS,getAsyncMethodName;module.link('./constants',{ASYNC_CURSOR_METHODS(v){ASYNC_CURSOR_METHODS=v},getAsyncMethodName(v){getAsyncMethodName=v}},3);



class Cursor {
    /**
   * @deprecated in 2.9
   * @summary Returns the number of documents that match a query. This method is
   *          [deprecated since MongoDB 4.0](https://www.mongodb.com/docs/v4.4/reference/command/count/);
   *          see `Collection.countDocuments` and
   *          `Collection.estimatedDocumentCount` for a replacement.
   * @memberOf Mongo.Cursor
   * @method  count
   * @instance
   * @locus Anywhere
   * @returns {Number}
   */ count() {
        if (this.reactive) {
            // allow the observe to be unordered
            this._depend({
                added: true,
                removed: true
            }, true);
        }
        return this._getRawObjects({
            ordered: true
        }).length;
    }
    /**
   * @summary Return all matching documents as an Array.
   * @memberOf Mongo.Cursor
   * @method  fetch
   * @instance
   * @locus Anywhere
   * @returns {Object[]}
   */ fetch() {
        const result = [];
        this.forEach((doc)=>{
            result.push(doc);
        });
        return result;
    }
    [Symbol.iterator]() {
        if (this.reactive) {
            this._depend({
                addedBefore: true,
                removed: true,
                changed: true,
                movedBefore: true
            });
        }
        let index = 0;
        const objects = this._getRawObjects({
            ordered: true
        });
        return {
            next: ()=>{
                if (index < objects.length) {
                    // This doubles as a clone operation.
                    let element = this._projectionFn(objects[index++]);
                    if (this._transform) element = this._transform(element);
                    return {
                        value: element
                    };
                }
                return {
                    done: true
                };
            }
        };
    }
    [Symbol.asyncIterator]() {
        const syncResult = this[Symbol.iterator]();
        return {
            next () {
                return _async_to_generator(function*() {
                    return Promise.resolve(syncResult.next());
                })();
            }
        };
    }
    /**
   * @callback IterationCallback
   * @param {Object} doc
   * @param {Number} index
   */ /**
   * @summary Call `callback` once for each matching document, sequentially and
   *          synchronously.
   * @locus Anywhere
   * @method  forEach
   * @instance
   * @memberOf Mongo.Cursor
   * @param {IterationCallback} callback Function to call. It will be called
   *                                     with three arguments: the document, a
   *                                     0-based index, and <em>cursor</em>
   *                                     itself.
   * @param {Any} [thisArg] An object which will be the value of `this` inside
   *                        `callback`.
   */ forEach(callback, thisArg) {
        if (this.reactive) {
            this._depend({
                addedBefore: true,
                removed: true,
                changed: true,
                movedBefore: true
            });
        }
        this._getRawObjects({
            ordered: true
        }).forEach((element, i)=>{
            // This doubles as a clone operation.
            element = this._projectionFn(element);
            if (this._transform) {
                element = this._transform(element);
            }
            callback.call(thisArg, element, i, this);
        });
    }
    getTransform() {
        return this._transform;
    }
    /**
   * @summary Map callback over all matching documents.  Returns an Array.
   * @locus Anywhere
   * @method map
   * @instance
   * @memberOf Mongo.Cursor
   * @param {IterationCallback} callback Function to call. It will be called
   *                                     with three arguments: the document, a
   *                                     0-based index, and <em>cursor</em>
   *                                     itself.
   * @param {Any} [thisArg] An object which will be the value of `this` inside
   *                        `callback`.
   */ map(callback, thisArg) {
        const result = [];
        this.forEach((doc, i)=>{
            result.push(callback.call(thisArg, doc, i, this));
        });
        return result;
    }
    // options to contain:
    //  * callbacks for observe():
    //    - addedAt (document, atIndex)
    //    - added (document)
    //    - changedAt (newDocument, oldDocument, atIndex)
    //    - changed (newDocument, oldDocument)
    //    - removedAt (document, atIndex)
    //    - removed (document)
    //    - movedTo (document, oldIndex, newIndex)
    //
    // attributes available on returned query handle:
    //  * stop(): end updates
    //  * collection: the collection this query is querying
    //
    // iff x is a returned query handle, (x instanceof
    // LocalCollection.ObserveHandle) is true
    //
    // initial results delivered through added callback
    // XXX maybe callbacks should take a list of objects, to expose transactions?
    // XXX maybe support field limiting (to limit what you're notified on)
    /**
   * @summary Watch a query.  Receive callbacks as the result set changes.
   * @locus Anywhere
   * @memberOf Mongo.Cursor
   * @instance
   * @param {Object} callbacks Functions to call to deliver the result set as it
   *                           changes
   */ observe(options) {
        return LocalCollection._observeFromObserveChanges(this, options);
    }
    /**
   * @summary Watch a query.  Receive callbacks as the result set changes.
   * @locus Anywhere
   * @memberOf Mongo.Cursor
   * @instance
   */ observeAsync(options) {
        return new Promise((resolve)=>resolve(this.observe(options)));
    }
    /**
   * @summary Watch a query. Receive callbacks as the result set changes. Only
   *          the differences between the old and new documents are passed to
   *          the callbacks.
   * @locus Anywhere
   * @memberOf Mongo.Cursor
   * @instance
   * @param {Object} callbacks Functions to call to deliver the result set as it
   *                           changes
   */ observeChanges(options) {
        const ordered = LocalCollection._observeChangesCallbacksAreOrdered(options);
        // there are several places that assume you aren't combining skip/limit with
        // unordered observe.  eg, update's EJSON.clone, and the "there are several"
        // comment in _modifyAndNotify
        // XXX allow skip/limit with unordered observe
        if (!options._allow_unordered && !ordered && (this.skip || this.limit)) {
            throw new Error("Must use an ordered observe with skip or limit (i.e. 'addedBefore' " + "for observeChanges or 'addedAt' for observe, instead of 'added').");
        }
        if (this.fields && (this.fields._id === 0 || this.fields._id === false)) {
            throw Error("You may not observe a cursor with {fields: {_id: 0}}");
        }
        const distances = this.matcher.hasGeoQuery() && ordered && new LocalCollection._IdMap();
        const query = {
            cursor: this,
            dirty: false,
            distances,
            matcher: this.matcher,
            ordered,
            projectionFn: this._projectionFn,
            resultsSnapshot: null,
            sorter: ordered && this.sorter
        };
        let qid;
        // Non-reactive queries call added[Before] and then never call anything
        // else.
        if (this.reactive) {
            qid = this.collection.next_qid++;
            this.collection.queries[qid] = query;
        }
        query.results = this._getRawObjects({
            ordered,
            distances: query.distances
        });
        if (this.collection.paused) {
            query.resultsSnapshot = ordered ? [] : new LocalCollection._IdMap();
        }
        // wrap callbacks we were passed. callbacks only fire when not paused and
        // are never undefined
        // Filters out blacklisted fields according to cursor's projection.
        // XXX wrong place for this?
        // furthermore, callbacks enqueue until the operation we're working on is
        // done.
        const wrapCallback = (fn)=>{
            if (!fn) {
                return ()=>{};
            }
            const self = this;
            return function() {
                if (self.collection.paused) {
                    return;
                }
                const args = arguments;
                self.collection._observeQueue.queueTask(()=>{
                    fn.apply(this, args);
                });
            };
        };
        query.added = wrapCallback(options.added);
        query.changed = wrapCallback(options.changed);
        query.removed = wrapCallback(options.removed);
        if (ordered) {
            query.addedBefore = wrapCallback(options.addedBefore);
            query.movedBefore = wrapCallback(options.movedBefore);
        }
        if (!options._suppress_initial && !this.collection.paused) {
            var _query_results_size, _query_results;
            const handler = (doc)=>{
                const fields = EJSON.clone(doc);
                delete fields._id;
                if (ordered) {
                    query.addedBefore(doc._id, this._projectionFn(fields), null);
                }
                query.added(doc._id, this._projectionFn(fields));
            };
            // it means it's just an array
            if (query.results.length) {
                for (const doc of query.results){
                    handler(doc);
                }
            }
            // it means it's an id map
            if ((_query_results = query.results) === null || _query_results === void 0 ? void 0 : (_query_results_size = _query_results.size) === null || _query_results_size === void 0 ? void 0 : _query_results_size.call(_query_results)) {
                query.results.forEach(handler);
            }
        }
        const handle = Object.assign(new LocalCollection.ObserveHandle(), {
            collection: this.collection,
            stop: ()=>{
                if (this.reactive) {
                    delete this.collection.queries[qid];
                }
            },
            isReady: false,
            isReadyPromise: null
        });
        if (this.reactive && Tracker.active) {
            // XXX in many cases, the same observe will be recreated when
            // the current autorun is rerun.  we could save work by
            // letting it linger across rerun and potentially get
            // repurposed if the same observe is performed, using logic
            // similar to that of Meteor.subscribe.
            Tracker.onInvalidate(()=>{
                handle.stop();
            });
        }
        // run the observe callbacks resulting from the initial contents
        // before we leave the observe.
        const drainResult = this.collection._observeQueue.drain();
        if (drainResult instanceof Promise) {
            handle.isReadyPromise = drainResult;
            drainResult.then(()=>handle.isReady = true);
        } else {
            handle.isReady = true;
            handle.isReadyPromise = Promise.resolve();
        }
        return handle;
    }
    /**
   * @summary Watch a query. Receive callbacks as the result set changes. Only
   *          the differences between the old and new documents are passed to
   *          the callbacks.
   * @locus Anywhere
   * @memberOf Mongo.Cursor
   * @instance
   * @param {Object} callbacks Functions to call to deliver the result set as it
   *                           changes
   */ observeChangesAsync(options) {
        return new Promise((resolve)=>{
            const handle = this.observeChanges(options);
            handle.isReadyPromise.then(()=>resolve(handle));
        });
    }
    // XXX Maybe we need a version of observe that just calls a callback if
    // anything changed.
    _depend(changers, _allow_unordered) {
        if (Tracker.active) {
            const dependency = new Tracker.Dependency();
            const notify = dependency.changed.bind(dependency);
            dependency.depend();
            const options = {
                _allow_unordered,
                _suppress_initial: true
            };
            [
                'added',
                'addedBefore',
                'changed',
                'movedBefore',
                'removed'
            ].forEach((fn)=>{
                if (changers[fn]) {
                    options[fn] = notify;
                }
            });
            // observeChanges will stop() when this computation is invalidated
            this.observeChanges(options);
        }
    }
    _getCollectionName() {
        return this.collection.name;
    }
    // Returns a collection of matching objects, but doesn't deep copy them.
    //
    // If ordered is set, returns a sorted array, respecting sorter, skip, and
    // limit properties of the query provided that options.applySkipLimit is
    // not set to false (#1201). If sorter is falsey, no sort -- you get the
    // natural order.
    //
    // If ordered is not set, returns an object mapping from ID to doc (sorter,
    // skip and limit should not be set).
    //
    // If ordered is set and this cursor is a $near geoquery, then this function
    // will use an _IdMap to track each distance from the $near argument point in
    // order to use it as a sort key. If an _IdMap is passed in the 'distances'
    // argument, this function will clear it and use it for this purpose
    // (otherwise it will just create its own _IdMap). The observeChanges
    // implementation uses this to remember the distances after this function
    // returns.
    _getRawObjects(options = {}) {
        // By default this method will respect skip and limit because .fetch(),
        // .forEach() etc... expect this behaviour. It can be forced to ignore
        // skip and limit by setting applySkipLimit to false (.count() does this,
        // for example)
        const applySkipLimit = options.applySkipLimit !== false;
        // XXX use OrderedDict instead of array, and make IdMap and OrderedDict
        // compatible
        const results = options.ordered ? [] : new LocalCollection._IdMap();
        // fast path for single ID value
        if (this._selectorId !== undefined) {
            // If you have non-zero skip and ask for a single id, you get nothing.
            // This is so it matches the behavior of the '{_id: foo}' path.
            if (applySkipLimit && this.skip) {
                return results;
            }
            const selectedDoc = this.collection._docs.get(this._selectorId);
            if (selectedDoc) {
                if (options.ordered) {
                    results.push(selectedDoc);
                } else {
                    results.set(this._selectorId, selectedDoc);
                }
            }
            return results;
        }
        // slow path for arbitrary selector, sort, skip, limit
        // in the observeChanges case, distances is actually part of the "query"
        // (ie, live results set) object.  in other cases, distances is only used
        // inside this function.
        let distances;
        if (this.matcher.hasGeoQuery() && options.ordered) {
            if (options.distances) {
                distances = options.distances;
                distances.clear();
            } else {
                distances = new LocalCollection._IdMap();
            }
        }
        Meteor._runFresh(()=>{
            this.collection._docs.forEach((doc, id)=>{
                const matchResult = this.matcher.documentMatches(doc);
                if (matchResult.result) {
                    if (options.ordered) {
                        results.push(doc);
                        if (distances && matchResult.distance !== undefined) {
                            distances.set(id, matchResult.distance);
                        }
                    } else {
                        results.set(id, doc);
                    }
                }
                // Override to ensure all docs are matched if ignoring skip & limit
                if (!applySkipLimit) {
                    return true;
                }
                // Fast path for limited unsorted queries.
                // XXX 'length' check here seems wrong for ordered
                return !this.limit || this.skip || this.sorter || results.length !== this.limit;
            });
        });
        if (!options.ordered) {
            return results;
        }
        if (this.sorter) {
            results.sort(this.sorter.getComparator({
                distances
            }));
        }
        // Return the full set of results if there is no skip or limit or if we're
        // ignoring them
        if (!applySkipLimit || !this.limit && !this.skip) {
            return results;
        }
        return results.slice(this.skip, this.limit ? this.limit + this.skip : results.length);
    }
    _publishCursor(subscription) {
        // XXX minimongo should not depend on mongo-livedata!
        if (!Package.mongo) {
            throw new Error("Can't publish from Minimongo without the `mongo` package.");
        }
        if (!this.collection.name) {
            throw new Error("Can't publish a cursor from a collection without a name.");
        }
        return Package.mongo.Mongo.Collection._publishCursor(this, subscription, this.collection.name);
    }
    // don't call this ctor directly.  use LocalCollection.find().
    constructor(collection, selector, options = {}){
        this.collection = collection;
        this.sorter = null;
        this.matcher = new Minimongo.Matcher(selector);
        if (LocalCollection._selectorIsIdPerhapsAsObject(selector)) {
            // stash for fast _id and { _id }
            this._selectorId = hasOwn.call(selector, '_id') ? selector._id : selector;
        } else {
            this._selectorId = undefined;
            if (this.matcher.hasGeoQuery() || options.sort) {
                this.sorter = new Minimongo.Sorter(options.sort || []);
            }
        }
        this.skip = options.skip || 0;
        this.limit = options.limit;
        this.fields = options.projection || options.fields;
        this._projectionFn = LocalCollection._compileProjection(this.fields || {});
        this._transform = LocalCollection.wrapTransform(options.transform);
        // by default, queries register w/ Tracker when it is available.
        if (typeof Tracker !== 'undefined') {
            this.reactive = options.reactive === undefined ? true : options.reactive;
        }
    }
}
// Cursor: a specification for a particular subset of documents, w/ a defined
// order, limit, and offset.  creating a Cursor with LocalCollection.find(),

// Implements async version of cursor methods to keep collections isomorphic
ASYNC_CURSOR_METHODS.forEach((method)=>{
    const asyncName = getAsyncMethodName(method);
    Cursor.prototype[asyncName] = function(...args) {
        try {
            return Promise.resolve(this[method].apply(this, args));
        } catch (error) {
            return Promise.reject(error);
        }
    };
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"local_collection.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/local_collection.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({default:()=>LocalCollection});let _async_to_generator;module.link("@swc/helpers/_/_async_to_generator",{_(v){_async_to_generator=v}},0);let _object_spread;module.link("@swc/helpers/_/_object_spread",{_(v){_object_spread=v}},1);let Cursor;module.link('./cursor.js',{default(v){Cursor=v}},2);let ObserveHandle;module.link('./observe_handle.js',{default(v){ObserveHandle=v}},3);let hasOwn,isIndexable,isNumericKey,isOperatorObject,populateDocumentWithQueryFields,projectionDetails;module.link('./common.js',{hasOwn(v){hasOwn=v},isIndexable(v){isIndexable=v},isNumericKey(v){isNumericKey=v},isOperatorObject(v){isOperatorObject=v},populateDocumentWithQueryFields(v){populateDocumentWithQueryFields=v},projectionDetails(v){projectionDetails=v}},4);let getAsyncMethodName;module.link('./constants',{getAsyncMethodName(v){getAsyncMethodName=v}},5);





class LocalCollection {
    countDocuments(selector, options) {
        return this.find(selector !== null && selector !== void 0 ? selector : {}, options).countAsync();
    }
    estimatedDocumentCount(options) {
        return this.find({}, options).countAsync();
    }
    // options may include sort, skip, limit, reactive
    // sort may be any of these forms:
    //     {a: 1, b: -1}
    //     [["a", "asc"], ["b", "desc"]]
    //     ["a", ["b", "desc"]]
    //   (in the first form you're beholden to key enumeration order in
    //   your javascript VM)
    //
    // reactive: if given, and false, don't register with Tracker (default
    // is true)
    //
    // XXX possibly should support retrieving a subset of fields? and
    // have it be a hint (ignored on the client, when not copying the
    // doc?)
    //
    // XXX sort does not yet support subkeys ('a.b') .. fix that!
    // XXX add one more sort form: "key"
    // XXX tests
    find(selector, options) {
        // default syntax for everything is to omit the selector argument.
        // but if selector is explicitly passed in as false or undefined, we
        // want a selector that matches nothing.
        if (arguments.length === 0) {
            selector = {};
        }
        return new LocalCollection.Cursor(this, selector, options);
    }
    findOne(selector, options = {}) {
        if (arguments.length === 0) {
            selector = {};
        }
        // NOTE: by setting limit 1 here, we end up using very inefficient
        // code that recomputes the whole query on each update. The upside is
        // that when you reactively depend on a findOne you only get
        // invalidated when the found object changes, not any object in the
        // collection. Most findOne will be by id, which has a fast path, so
        // this might not be a big deal. In most cases, invalidation causes
        // the called to re-query anyway, so this should be a net performance
        // improvement.
        options.limit = 1;
        return this.find(selector, options).fetch()[0];
    }
    findOneAsync(_0) {
        return _async_to_generator(function*(selector, options = {}) {
            if (arguments.length === 0) {
                selector = {};
            }
            options.limit = 1;
            return (yield this.find(selector, options).fetchAsync())[0];
        }).apply(this, arguments);
    }
    prepareInsert(doc) {
        assertHasValidFieldNames(doc);
        // if you really want to use ObjectIDs, set this global.
        // Mongo.Collection specifies its own ids and does not use this code.
        if (!hasOwn.call(doc, '_id')) {
            doc._id = LocalCollection._useOID ? new MongoID.ObjectID() : Random.id();
        }
        const id = doc._id;
        if (this._docs.has(id)) {
            throw MinimongoError(`Duplicate _id '${id}'`);
        }
        this._saveOriginal(id, undefined);
        this._docs.set(id, doc);
        return id;
    }
    // XXX possibly enforce that 'undefined' does not appear (we assume
    // this in our handling of null and $exists)
    insert(doc, callback) {
        doc = EJSON.clone(doc);
        const id = this.prepareInsert(doc);
        const queriesToRecompute = [];
        // trigger live queries that match
        for (const qid of Object.keys(this.queries)){
            const query = this.queries[qid];
            if (query.dirty) {
                continue;
            }
            const matchResult = query.matcher.documentMatches(doc);
            if (matchResult.result) {
                if (query.distances && matchResult.distance !== undefined) {
                    query.distances.set(id, matchResult.distance);
                }
                if (query.cursor.skip || query.cursor.limit) {
                    queriesToRecompute.push(qid);
                } else {
                    LocalCollection._insertInResultsSync(query, doc);
                }
            }
        }
        queriesToRecompute.forEach((qid)=>{
            if (this.queries[qid]) {
                this._recomputeResults(this.queries[qid]);
            }
        });
        this._observeQueue.drain();
        if (callback) {
            Meteor.defer(()=>{
                callback(null, id);
            });
        }
        return id;
    }
    insertAsync(doc, callback) {
        return _async_to_generator(function*() {
            doc = EJSON.clone(doc);
            const id = this.prepareInsert(doc);
            const queriesToRecompute = [];
            // trigger live queries that match
            for(const qid in this.queries){
                const query = this.queries[qid];
                if (query.dirty) {
                    continue;
                }
                const matchResult = query.matcher.documentMatches(doc);
                if (matchResult.result) {
                    if (query.distances && matchResult.distance !== undefined) {
                        query.distances.set(id, matchResult.distance);
                    }
                    if (query.cursor.skip || query.cursor.limit) {
                        queriesToRecompute.push(qid);
                    } else {
                        yield LocalCollection._insertInResultsAsync(query, doc);
                    }
                }
            }
            queriesToRecompute.forEach((qid)=>{
                if (this.queries[qid]) {
                    this._recomputeResults(this.queries[qid]);
                }
            });
            yield this._observeQueue.drain();
            if (callback) {
                Meteor.defer(()=>{
                    callback(null, id);
                });
            }
            return id;
        }).call(this);
    }
    // Pause the observers. No callbacks from observers will fire until
    // 'resumeObservers' is called.
    pauseObservers() {
        // No-op if already paused.
        if (this.paused) {
            return;
        }
        // Set the 'paused' flag such that new observer messages don't fire.
        this.paused = true;
        // Take a snapshot of the query results for each query.
        Object.keys(this.queries).forEach((qid)=>{
            const query = this.queries[qid];
            query.resultsSnapshot = EJSON.clone(query.results);
        });
    }
    clearResultQueries(callback) {
        const result = this._docs.size();
        this._docs.clear();
        Object.keys(this.queries).forEach((qid)=>{
            const query = this.queries[qid];
            if (query.ordered) {
                query.results = [];
            } else {
                query.results.clear();
            }
        });
        if (callback) {
            Meteor.defer(()=>{
                callback(null, result);
            });
        }
        return result;
    }
    prepareRemove(selector) {
        const matcher = new Minimongo.Matcher(selector);
        const remove = [];
        this._eachPossiblyMatchingDocSync(selector, (doc, id)=>{
            if (matcher.documentMatches(doc).result) {
                remove.push(id);
            }
        });
        const queriesToRecompute = [];
        const queryRemove = [];
        for(let i = 0; i < remove.length; i++){
            const removeId = remove[i];
            const removeDoc = this._docs.get(removeId);
            Object.keys(this.queries).forEach((qid)=>{
                const query = this.queries[qid];
                if (query.dirty) {
                    return;
                }
                if (query.matcher.documentMatches(removeDoc).result) {
                    if (query.cursor.skip || query.cursor.limit) {
                        queriesToRecompute.push(qid);
                    } else {
                        queryRemove.push({
                            qid,
                            doc: removeDoc
                        });
                    }
                }
            });
            this._saveOriginal(removeId, removeDoc);
            this._docs.remove(removeId);
        }
        return {
            queriesToRecompute,
            queryRemove,
            remove
        };
    }
    remove(selector, callback) {
        // Easy special case: if we're not calling observeChanges callbacks and
        // we're not saving originals and we got asked to remove everything, then
        // just empty everything directly.
        if (this.paused && !this._savedOriginals && EJSON.equals(selector, {})) {
            return this.clearResultQueries(callback);
        }
        const { queriesToRecompute, queryRemove, remove } = this.prepareRemove(selector);
        // run live query callbacks _after_ we've removed the documents.
        queryRemove.forEach((remove)=>{
            const query = this.queries[remove.qid];
            if (query) {
                query.distances && query.distances.remove(remove.doc._id);
                LocalCollection._removeFromResultsSync(query, remove.doc);
            }
        });
        queriesToRecompute.forEach((qid)=>{
            const query = this.queries[qid];
            if (query) {
                this._recomputeResults(query);
            }
        });
        this._observeQueue.drain();
        const result = remove.length;
        if (callback) {
            Meteor.defer(()=>{
                callback(null, result);
            });
        }
        return result;
    }
    removeAsync(selector, callback) {
        return _async_to_generator(function*() {
            // Easy special case: if we're not calling observeChanges callbacks and
            // we're not saving originals and we got asked to remove everything, then
            // just empty everything directly.
            if (this.paused && !this._savedOriginals && EJSON.equals(selector, {})) {
                return this.clearResultQueries(callback);
            }
            const { queriesToRecompute, queryRemove, remove } = this.prepareRemove(selector);
            // run live query callbacks _after_ we've removed the documents.
            for (const remove of queryRemove){
                const query = this.queries[remove.qid];
                if (query) {
                    query.distances && query.distances.remove(remove.doc._id);
                    yield LocalCollection._removeFromResultsAsync(query, remove.doc);
                }
            }
            queriesToRecompute.forEach((qid)=>{
                const query = this.queries[qid];
                if (query) {
                    this._recomputeResults(query);
                }
            });
            yield this._observeQueue.drain();
            const result = remove.length;
            if (callback) {
                Meteor.defer(()=>{
                    callback(null, result);
                });
            }
            return result;
        }).call(this);
    }
    // Resume the observers. Observers immediately receive change
    // notifications to bring them to the current state of the
    // database. Note that this is not just replaying all the changes that
    // happened during the pause, it is a smarter 'coalesced' diff.
    _resumeObservers() {
        // No-op if not paused.
        if (!this.paused) {
            return;
        }
        // Unset the 'paused' flag. Make sure to do this first, otherwise
        // observer methods won't actually fire when we trigger them.
        this.paused = false;
        Object.keys(this.queries).forEach((qid)=>{
            const query = this.queries[qid];
            if (query.dirty) {
                query.dirty = false;
                // re-compute results will perform `LocalCollection._diffQueryChanges`
                // automatically.
                this._recomputeResults(query, query.resultsSnapshot);
            } else {
                // Diff the current results against the snapshot and send to observers.
                // pass the query object for its observer callbacks.
                LocalCollection._diffQueryChanges(query.ordered, query.resultsSnapshot, query.results, query, {
                    projectionFn: query.projectionFn
                });
            }
            query.resultsSnapshot = null;
        });
    }
    resumeObserversServer() {
        return _async_to_generator(function*() {
            this._resumeObservers();
            yield this._observeQueue.drain();
        }).call(this);
    }
    resumeObserversClient() {
        this._resumeObservers();
        this._observeQueue.drain();
    }
    retrieveOriginals() {
        if (!this._savedOriginals) {
            throw new Error('Called retrieveOriginals without saveOriginals');
        }
        const originals = this._savedOriginals;
        this._savedOriginals = null;
        return originals;
    }
    // To track what documents are affected by a piece of code, call
    // saveOriginals() before it and retrieveOriginals() after it.
    // retrieveOriginals returns an object whose keys are the ids of the documents
    // that were affected since the call to saveOriginals(), and the values are
    // equal to the document's contents at the time of saveOriginals. (In the case
    // of an inserted document, undefined is the value.) You must alternate
    // between calls to saveOriginals() and retrieveOriginals().
    saveOriginals() {
        if (this._savedOriginals) {
            throw new Error('Called saveOriginals twice without retrieveOriginals');
        }
        this._savedOriginals = new LocalCollection._IdMap;
    }
    prepareUpdate(selector) {
        // Save the original results of any query that we might need to
        // _recomputeResults on, because _modifyAndNotify will mutate the objects in
        // it. (We don't need to save the original results of paused queries because
        // they already have a resultsSnapshot and we won't be diffing in
        // _recomputeResults.)
        const qidToOriginalResults = {};
        // We should only clone each document once, even if it appears in multiple
        // queries
        const docMap = new LocalCollection._IdMap;
        const idsMatched = LocalCollection._idsMatchedBySelector(selector);
        Object.keys(this.queries).forEach((qid)=>{
            const query = this.queries[qid];
            if ((query.cursor.skip || query.cursor.limit) && !this.paused) {
                // Catch the case of a reactive `count()` on a cursor with skip
                // or limit, which registers an unordered observe. This is a
                // pretty rare case, so we just clone the entire result set with
                // no optimizations for documents that appear in these result
                // sets and other queries.
                if (query.results instanceof LocalCollection._IdMap) {
                    qidToOriginalResults[qid] = query.results.clone();
                    return;
                }
                if (!(query.results instanceof Array)) {
                    throw new Error('Assertion failed: query.results not an array');
                }
                // Clones a document to be stored in `qidToOriginalResults`
                // because it may be modified before the new and old result sets
                // are diffed. But if we know exactly which document IDs we're
                // going to modify, then we only need to clone those.
                const memoizedCloneIfNeeded = (doc)=>{
                    if (docMap.has(doc._id)) {
                        return docMap.get(doc._id);
                    }
                    const docToMemoize = idsMatched && !idsMatched.some((id)=>EJSON.equals(id, doc._id)) ? doc : EJSON.clone(doc);
                    docMap.set(doc._id, docToMemoize);
                    return docToMemoize;
                };
                qidToOriginalResults[qid] = query.results.map(memoizedCloneIfNeeded);
            }
        });
        return qidToOriginalResults;
    }
    finishUpdate({ options, updateCount, callback, insertedId }) {
        // Return the number of affected documents, or in the upsert case, an object
        // containing the number of affected docs and the id of the doc that was
        // inserted, if any.
        let result;
        if (options._returnObject) {
            result = {
                numberAffected: updateCount
            };
            if (insertedId !== undefined) {
                result.insertedId = insertedId;
            }
        } else {
            result = updateCount;
        }
        if (callback) {
            Meteor.defer(()=>{
                callback(null, result);
            });
        }
        return result;
    }
    // XXX atomicity: if multi is true, and one modification fails, do
    // we rollback the whole operation, or what?
    updateAsync(selector, mod, options, callback) {
        return _async_to_generator(function*() {
            if (!callback && options instanceof Function) {
                callback = options;
                options = null;
            }
            if (!options) {
                options = {};
            }
            const matcher = new Minimongo.Matcher(selector, true);
            const qidToOriginalResults = this.prepareUpdate(selector);
            let recomputeQids = {};
            let updateCount = 0;
            yield this._eachPossiblyMatchingDocAsync(selector, (doc, id)=>_async_to_generator(function*() {
                    const queryResult = matcher.documentMatches(doc);
                    if (queryResult.result) {
                        // XXX Should we save the original even if mod ends up being a no-op?
                        this._saveOriginal(id, doc);
                        recomputeQids = yield this._modifyAndNotifyAsync(doc, mod, queryResult.arrayIndices);
                        ++updateCount;
                        if (!options.multi) {
                            return false; // break
                        }
                    }
                    return true;
                }).call(this));
            Object.keys(recomputeQids).forEach((qid)=>{
                const query = this.queries[qid];
                if (query) {
                    this._recomputeResults(query, qidToOriginalResults[qid]);
                }
            });
            yield this._observeQueue.drain();
            // If we are doing an upsert, and we didn't modify any documents yet, then
            // it's time to do an insert. Figure out what document we are inserting, and
            // generate an id for it.
            let insertedId;
            if (updateCount === 0 && options.upsert) {
                const doc = LocalCollection._createUpsertDocument(selector, mod);
                if (!doc._id && options.insertedId) {
                    doc._id = options.insertedId;
                }
                insertedId = yield this.insertAsync(doc);
                updateCount = 1;
            }
            return this.finishUpdate({
                options,
                insertedId,
                updateCount,
                callback
            });
        }).call(this);
    }
    // XXX atomicity: if multi is true, and one modification fails, do
    // we rollback the whole operation, or what?
    update(selector, mod, options, callback) {
        if (!callback && options instanceof Function) {
            callback = options;
            options = null;
        }
        if (!options) {
            options = {};
        }
        const matcher = new Minimongo.Matcher(selector, true);
        const qidToOriginalResults = this.prepareUpdate(selector);
        let recomputeQids = {};
        let updateCount = 0;
        this._eachPossiblyMatchingDocSync(selector, (doc, id)=>{
            const queryResult = matcher.documentMatches(doc);
            if (queryResult.result) {
                // XXX Should we save the original even if mod ends up being a no-op?
                this._saveOriginal(id, doc);
                recomputeQids = this._modifyAndNotifySync(doc, mod, queryResult.arrayIndices);
                ++updateCount;
                if (!options.multi) {
                    return false; // break
                }
            }
            return true;
        });
        Object.keys(recomputeQids).forEach((qid)=>{
            const query = this.queries[qid];
            if (query) {
                this._recomputeResults(query, qidToOriginalResults[qid]);
            }
        });
        this._observeQueue.drain();
        // If we are doing an upsert, and we didn't modify any documents yet, then
        // it's time to do an insert. Figure out what document we are inserting, and
        // generate an id for it.
        let insertedId;
        if (updateCount === 0 && options.upsert) {
            const doc = LocalCollection._createUpsertDocument(selector, mod);
            if (!doc._id && options.insertedId) {
                doc._id = options.insertedId;
            }
            insertedId = this.insert(doc);
            updateCount = 1;
        }
        return this.finishUpdate({
            options,
            insertedId,
            updateCount,
            callback,
            selector,
            mod
        });
    }
    // A convenience wrapper on update. LocalCollection.upsert(sel, mod) is
    // equivalent to LocalCollection.update(sel, mod, {upsert: true,
    // _returnObject: true}).
    upsert(selector, mod, options, callback) {
        if (!callback && typeof options === 'function') {
            callback = options;
            options = {};
        }
        return this.update(selector, mod, Object.assign({}, options, {
            upsert: true,
            _returnObject: true
        }), callback);
    }
    upsertAsync(selector, mod, options, callback) {
        if (!callback && typeof options === 'function') {
            callback = options;
            options = {};
        }
        return this.updateAsync(selector, mod, Object.assign({}, options, {
            upsert: true,
            _returnObject: true
        }), callback);
    }
    // Iterates over a subset of documents that could match selector; calls
    // fn(doc, id) on each of them.  Specifically, if selector specifies
    // specific _id's, it only looks at those.  doc is *not* cloned: it is the
    // same object that is in _docs.
    _eachPossiblyMatchingDocAsync(selector, fn) {
        return _async_to_generator(function*() {
            const specificIds = LocalCollection._idsMatchedBySelector(selector);
            if (specificIds) {
                for (const id of specificIds){
                    const doc = this._docs.get(id);
                    if (doc && !(yield fn(doc, id))) {
                        break;
                    }
                }
            } else {
                yield this._docs.forEachAsync(fn);
            }
        }).call(this);
    }
    _eachPossiblyMatchingDocSync(selector, fn) {
        const specificIds = LocalCollection._idsMatchedBySelector(selector);
        if (specificIds) {
            for (const id of specificIds){
                const doc = this._docs.get(id);
                if (doc && fn(doc, id) === false) {
                    break;
                }
            }
        } else {
            this._docs.forEach(fn);
        }
    }
    _getMatchedDocAndModify(doc, mod, arrayIndices) {
        const matched_before = {};
        Object.keys(this.queries).forEach((qid)=>{
            const query = this.queries[qid];
            if (query.dirty) {
                return;
            }
            if (query.ordered) {
                matched_before[qid] = query.matcher.documentMatches(doc).result;
            } else {
                // Because we don't support skip or limit (yet) in unordered queries, we
                // can just do a direct lookup.
                matched_before[qid] = query.results.has(doc._id);
            }
        });
        return matched_before;
    }
    _modifyAndNotifySync(doc, mod, arrayIndices) {
        const matched_before = this._getMatchedDocAndModify(doc, mod, arrayIndices);
        const old_doc = EJSON.clone(doc);
        LocalCollection._modify(doc, mod, {
            arrayIndices
        });
        const recomputeQids = {};
        for (const qid of Object.keys(this.queries)){
            const query = this.queries[qid];
            if (query.dirty) {
                continue;
            }
            const afterMatch = query.matcher.documentMatches(doc);
            const after = afterMatch.result;
            const before = matched_before[qid];
            if (after && query.distances && afterMatch.distance !== undefined) {
                query.distances.set(doc._id, afterMatch.distance);
            }
            if (query.cursor.skip || query.cursor.limit) {
                // We need to recompute any query where the doc may have been in the
                // cursor's window either before or after the update. (Note that if skip
                // or limit is set, "before" and "after" being true do not necessarily
                // mean that the document is in the cursor's output after skip/limit is
                // applied... but if they are false, then the document definitely is NOT
                // in the output. So it's safe to skip recompute if neither before or
                // after are true.)
                if (before || after) {
                    recomputeQids[qid] = true;
                }
            } else if (before && !after) {
                LocalCollection._removeFromResultsSync(query, doc);
            } else if (!before && after) {
                LocalCollection._insertInResultsSync(query, doc);
            } else if (before && after) {
                LocalCollection._updateInResultsSync(query, doc, old_doc);
            }
        }
        return recomputeQids;
    }
    _modifyAndNotifyAsync(doc, mod, arrayIndices) {
        return _async_to_generator(function*() {
            const matched_before = this._getMatchedDocAndModify(doc, mod, arrayIndices);
            const old_doc = EJSON.clone(doc);
            LocalCollection._modify(doc, mod, {
                arrayIndices
            });
            const recomputeQids = {};
            for(const qid in this.queries){
                const query = this.queries[qid];
                if (query.dirty) {
                    continue;
                }
                const afterMatch = query.matcher.documentMatches(doc);
                const after = afterMatch.result;
                const before = matched_before[qid];
                if (after && query.distances && afterMatch.distance !== undefined) {
                    query.distances.set(doc._id, afterMatch.distance);
                }
                if (query.cursor.skip || query.cursor.limit) {
                    // We need to recompute any query where the doc may have been in the
                    // cursor's window either before or after the update. (Note that if skip
                    // or limit is set, "before" and "after" being true do not necessarily
                    // mean that the document is in the cursor's output after skip/limit is
                    // applied... but if they are false, then the document definitely is NOT
                    // in the output. So it's safe to skip recompute if neither before or
                    // after are true.)
                    if (before || after) {
                        recomputeQids[qid] = true;
                    }
                } else if (before && !after) {
                    yield LocalCollection._removeFromResultsAsync(query, doc);
                } else if (!before && after) {
                    yield LocalCollection._insertInResultsAsync(query, doc);
                } else if (before && after) {
                    yield LocalCollection._updateInResultsAsync(query, doc, old_doc);
                }
            }
            return recomputeQids;
        }).call(this);
    }
    // Recomputes the results of a query and runs observe callbacks for the
    // difference between the previous results and the current results (unless
    // paused). Used for skip/limit queries.
    //
    // When this is used by insert or remove, it can just use query.results for
    // the old results (and there's no need to pass in oldResults), because these
    // operations don't mutate the documents in the collection. Update needs to
    // pass in an oldResults which was deep-copied before the modifier was
    // applied.
    //
    // oldResults is guaranteed to be ignored if the query is not paused.
    _recomputeResults(query, oldResults) {
        if (this.paused) {
            // There's no reason to recompute the results now as we're still paused.
            // By flagging the query as "dirty", the recompute will be performed
            // when resumeObservers is called.
            query.dirty = true;
            return;
        }
        if (!this.paused && !oldResults) {
            oldResults = query.results;
        }
        if (query.distances) {
            query.distances.clear();
        }
        query.results = query.cursor._getRawObjects({
            distances: query.distances,
            ordered: query.ordered
        });
        if (!this.paused) {
            LocalCollection._diffQueryChanges(query.ordered, oldResults, query.results, query, {
                projectionFn: query.projectionFn
            });
        }
    }
    _saveOriginal(id, doc) {
        // Are we even trying to save originals?
        if (!this._savedOriginals) {
            return;
        }
        // Have we previously mutated the original (and so 'doc' is not actually
        // original)?  (Note the 'has' check rather than truth: we store undefined
        // here for inserted docs!)
        if (this._savedOriginals.has(id)) {
            return;
        }
        this._savedOriginals.set(id, EJSON.clone(doc));
    }
    constructor(name){
        this.name = name;
        // _id -> document (also containing id)
        this._docs = new LocalCollection._IdMap;
        this._observeQueue = Meteor.isClient ? new Meteor._SynchronousQueue() : new Meteor._AsynchronousQueue();
        this.next_qid = 1; // live query id generator
        // qid -> live query object. keys:
        //  ordered: bool. ordered queries have addedBefore/movedBefore callbacks.
        //  results: array (ordered) or object (unordered) of current results
        //    (aliased with this._docs!)
        //  resultsSnapshot: snapshot of results. null if not paused.
        //  cursor: Cursor object for the query.
        //  selector, sorter, (callbacks): functions
        this.queries = Object.create(null);
        // null if not saving originals; an IdMap from id to original document value
        // if saving originals. See comments before saveOriginals().
        this._savedOriginals = null;
        // True when observers are paused and we should not send callbacks.
        this.paused = false;
    }
}
// XXX type checking on selectors (graceful error if malformed)
// LocalCollection: a set of documents that supports queries and modifiers.

LocalCollection.Cursor = Cursor;
LocalCollection.ObserveHandle = ObserveHandle;
// XXX maybe move these into another ObserveHelpers package or something
// _CachingChangeObserver is an object which receives observeChanges callbacks
// and keeps a cache of the current cursor state up to date in this.docs. Users
// of this class should read the docs field but not modify it. You should pass
// the "applyChange" field as the callbacks to the underlying observeChanges
// call. Optionally, you can specify your own observeChanges callbacks which are
// invoked immediately before the docs field is updated; this object is made
// available as `this` to those callbacks.
LocalCollection._CachingChangeObserver = class _CachingChangeObserver {
    constructor(options = {}){
        const orderedFromCallbacks = options.callbacks && LocalCollection._observeChangesCallbacksAreOrdered(options.callbacks);
        if (hasOwn.call(options, 'ordered')) {
            this.ordered = options.ordered;
            if (options.callbacks && options.ordered !== orderedFromCallbacks) {
                throw Error('ordered option doesn\'t match callbacks');
            }
        } else if (options.callbacks) {
            this.ordered = orderedFromCallbacks;
        } else {
            throw Error('must provide ordered or callbacks');
        }
        const callbacks = options.callbacks || {};
        if (this.ordered) {
            this.docs = new OrderedDict(MongoID.idStringify);
            this.applyChange = {
                addedBefore: (id, fields, before)=>{
                    // Take a shallow copy since the top-level properties can be changed
                    const doc = _object_spread({}, fields);
                    doc._id = id;
                    if (callbacks.addedBefore) {
                        callbacks.addedBefore.call(this, id, EJSON.clone(fields), before);
                    }
                    // This line triggers if we provide added with movedBefore.
                    if (callbacks.added) {
                        callbacks.added.call(this, id, EJSON.clone(fields));
                    }
                    // XXX could `before` be a falsy ID?  Technically
                    // idStringify seems to allow for them -- though
                    // OrderedDict won't call stringify on a falsy arg.
                    this.docs.putBefore(id, doc, before || null);
                },
                movedBefore: (id, before)=>{
                    if (callbacks.movedBefore) {
                        callbacks.movedBefore.call(this, id, before);
                    }
                    this.docs.moveBefore(id, before || null);
                }
            };
        } else {
            this.docs = new LocalCollection._IdMap;
            this.applyChange = {
                added: (id, fields)=>{
                    // Take a shallow copy since the top-level properties can be changed
                    const doc = _object_spread({}, fields);
                    if (callbacks.added) {
                        callbacks.added.call(this, id, EJSON.clone(fields));
                    }
                    doc._id = id;
                    this.docs.set(id, doc);
                }
            };
        }
        // The methods in _IdMap and OrderedDict used by these callbacks are
        // identical.
        this.applyChange.changed = (id, fields)=>{
            const doc = this.docs.get(id);
            if (!doc) {
                throw new Error(`Unknown id for changed: ${id}`);
            }
            if (callbacks.changed) {
                callbacks.changed.call(this, id, EJSON.clone(fields));
            }
            DiffSequence.applyChanges(doc, fields);
        };
        this.applyChange.removed = (id)=>{
            if (callbacks.removed) {
                callbacks.removed.call(this, id);
            }
            this.docs.remove(id);
        };
    }
};
LocalCollection._IdMap = class _IdMap extends IdMap {
    constructor(){
        super(MongoID.idStringify, MongoID.idParse);
    }
};
// Wrap a transform function to return objects that have the _id field
// of the untransformed document. This ensures that subsystems such as
// the observe-sequence package that call `observe` can keep track of
// the documents identities.
//
// - Require that it returns objects
// - If the return value has an _id field, verify that it matches the
//   original _id field
// - If the return value doesn't have an _id field, add it back.
LocalCollection.wrapTransform = (transform)=>{
    if (!transform) {
        return null;
    }
    // No need to doubly-wrap transforms.
    if (transform.__wrappedTransform__) {
        return transform;
    }
    const wrapped = (doc)=>{
        if (!hasOwn.call(doc, '_id')) {
            // XXX do we ever have a transform on the oplog's collection? because that
            // collection has no _id.
            throw new Error('can only transform documents with _id');
        }
        const id = doc._id;
        // XXX consider making tracker a weak dependency and checking
        // Package.tracker here
        const transformed = Tracker.nonreactive(()=>transform(doc));
        if (!LocalCollection._isPlainObject(transformed)) {
            throw new Error('transform must return object');
        }
        if (hasOwn.call(transformed, '_id')) {
            if (!EJSON.equals(transformed._id, id)) {
                throw new Error('transformed document can\'t have different _id');
            }
        } else {
            transformed._id = id;
        }
        return transformed;
    };
    wrapped.__wrappedTransform__ = true;
    return wrapped;
};
// XXX the sorted-query logic below is laughably inefficient. we'll
// need to come up with a better datastructure for this.
//
// XXX the logic for observing with a skip or a limit is even more
// laughably inefficient. we recompute the whole results every time!
// This binary search puts a value between any equal values, and the first
// lesser value.
LocalCollection._binarySearch = (cmp, array, value)=>{
    let first = 0;
    let range = array.length;
    while(range > 0){
        const halfRange = Math.floor(range / 2);
        if (cmp(value, array[first + halfRange]) >= 0) {
            first += halfRange + 1;
            range -= halfRange + 1;
        } else {
            range = halfRange;
        }
    }
    return first;
};
LocalCollection._checkSupportedProjection = (fields)=>{
    if (fields !== Object(fields) || Array.isArray(fields)) {
        throw MinimongoError('fields option must be an object');
    }
    Object.keys(fields).forEach((keyPath)=>{
        if (keyPath.split('.').includes('$')) {
            throw MinimongoError('Minimongo doesn\'t support $ operator in projections yet.');
        }
        const value = fields[keyPath];
        if (typeof value === 'object' && [
            '$elemMatch',
            '$meta',
            '$slice'
        ].some((key)=>hasOwn.call(value, key))) {
            throw MinimongoError('Minimongo doesn\'t support operators in projections yet.');
        }
        if (![
            1,
            0,
            true,
            false
        ].includes(value)) {
            throw MinimongoError('Projection values should be one of 1, 0, true, or false');
        }
    });
};
// Knows how to compile a fields projection to a predicate function.
// @returns - Function: a closure that filters out an object according to the
//            fields projection rules:
//            @param obj - Object: MongoDB-styled document
//            @returns - Object: a document with the fields filtered out
//                       according to projection rules. Doesn't retain subfields
//                       of passed argument.
LocalCollection._compileProjection = (fields)=>{
    LocalCollection._checkSupportedProjection(fields);
    const _idProjection = fields._id === undefined ? true : fields._id;
    const details = projectionDetails(fields);
    // returns transformed doc according to ruleTree
    const transform = (doc, ruleTree)=>{
        // Special case for "sets"
        if (Array.isArray(doc)) {
            return doc.map((subdoc)=>transform(subdoc, ruleTree));
        }
        const result = details.including ? {} : EJSON.clone(doc);
        Object.keys(ruleTree).forEach((key)=>{
            if (doc == null || !hasOwn.call(doc, key)) {
                return;
            }
            const rule = ruleTree[key];
            if (rule === Object(rule)) {
                // For sub-objects/subsets we branch
                if (doc[key] === Object(doc[key])) {
                    result[key] = transform(doc[key], rule);
                }
            } else if (details.including) {
                // Otherwise we don't even touch this subfield
                result[key] = EJSON.clone(doc[key]);
            } else {
                delete result[key];
            }
        });
        return doc != null ? result : doc;
    };
    return (doc)=>{
        const result = transform(doc, details.tree);
        if (_idProjection && hasOwn.call(doc, '_id')) {
            result._id = doc._id;
        }
        if (!_idProjection && hasOwn.call(result, '_id')) {
            delete result._id;
        }
        return result;
    };
};
// Calculates the document to insert in case we're doing an upsert and the
// selector does not match any elements
LocalCollection._createUpsertDocument = (selector, modifier)=>{
    const selectorDocument = populateDocumentWithQueryFields(selector);
    const isModify = LocalCollection._isModificationMod(modifier);
    const newDoc = {};
    if (selectorDocument._id) {
        newDoc._id = selectorDocument._id;
        delete selectorDocument._id;
    }
    // This double _modify call is made to help with nested properties (see issue
    // #8631). We do this even if it's a replacement for validation purposes (e.g.
    // ambiguous id's)
    LocalCollection._modify(newDoc, {
        $set: selectorDocument
    });
    LocalCollection._modify(newDoc, modifier, {
        isInsert: true
    });
    if (isModify) {
        return newDoc;
    }
    // Replacement can take _id from query document
    const replacement = Object.assign({}, modifier);
    if (newDoc._id) {
        replacement._id = newDoc._id;
    }
    return replacement;
};
LocalCollection._diffObjects = (left, right, callbacks)=>{
    return DiffSequence.diffObjects(left, right, callbacks);
};
// ordered: bool.
// old_results and new_results: collections of documents.
//    if ordered, they are arrays.
//    if unordered, they are IdMaps
LocalCollection._diffQueryChanges = (ordered, oldResults, newResults, observer, options)=>DiffSequence.diffQueryChanges(ordered, oldResults, newResults, observer, options);
LocalCollection._diffQueryOrderedChanges = (oldResults, newResults, observer, options)=>DiffSequence.diffQueryOrderedChanges(oldResults, newResults, observer, options);
LocalCollection._diffQueryUnorderedChanges = (oldResults, newResults, observer, options)=>DiffSequence.diffQueryUnorderedChanges(oldResults, newResults, observer, options);
LocalCollection._findInOrderedResults = (query, doc)=>{
    if (!query.ordered) {
        throw new Error('Can\'t call _findInOrderedResults on unordered query');
    }
    for(let i = 0; i < query.results.length; i++){
        if (query.results[i] === doc) {
            return i;
        }
    }
    throw Error('object missing from query');
};
// If this is a selector which explicitly constrains the match by ID to a finite
// number of documents, returns a list of their IDs.  Otherwise returns
// null. Note that the selector may have other restrictions so it may not even
// match those document!  We care about $in and $and since those are generated
// access-controlled update and remove.
LocalCollection._idsMatchedBySelector = (selector)=>{
    // Is the selector just an ID?
    if (LocalCollection._selectorIsId(selector)) {
        return [
            selector
        ];
    }
    if (!selector) {
        return null;
    }
    // Do we have an _id clause?
    if (hasOwn.call(selector, '_id')) {
        // Is the _id clause just an ID?
        if (LocalCollection._selectorIsId(selector._id)) {
            return [
                selector._id
            ];
        }
        // Is the _id clause {_id: {$in: ["x", "y", "z"]}}?
        if (selector._id && Array.isArray(selector._id.$in) && selector._id.$in.length && selector._id.$in.every(LocalCollection._selectorIsId)) {
            return selector._id.$in;
        }
        return null;
    }
    // If this is a top-level $and, and any of the clauses constrain their
    // documents, then the whole selector is constrained by any one clause's
    // constraint. (Well, by their intersection, but that seems unlikely.)
    if (Array.isArray(selector.$and)) {
        for(let i = 0; i < selector.$and.length; ++i){
            const subIds = LocalCollection._idsMatchedBySelector(selector.$and[i]);
            if (subIds) {
                return subIds;
            }
        }
    }
    return null;
};
LocalCollection._insertInResultsSync = (query, doc)=>{
    const fields = EJSON.clone(doc);
    delete fields._id;
    if (query.ordered) {
        if (!query.sorter) {
            query.addedBefore(doc._id, query.projectionFn(fields), null);
            query.results.push(doc);
        } else {
            const i = LocalCollection._insertInSortedList(query.sorter.getComparator({
                distances: query.distances
            }), query.results, doc);
            let next = query.results[i + 1];
            if (next) {
                next = next._id;
            } else {
                next = null;
            }
            query.addedBefore(doc._id, query.projectionFn(fields), next);
        }
        query.added(doc._id, query.projectionFn(fields));
    } else {
        query.added(doc._id, query.projectionFn(fields));
        query.results.set(doc._id, doc);
    }
};
LocalCollection._insertInResultsAsync = (query, doc)=>_async_to_generator(function*() {
        const fields = EJSON.clone(doc);
        delete fields._id;
        if (query.ordered) {
            if (!query.sorter) {
                yield query.addedBefore(doc._id, query.projectionFn(fields), null);
                query.results.push(doc);
            } else {
                const i = LocalCollection._insertInSortedList(query.sorter.getComparator({
                    distances: query.distances
                }), query.results, doc);
                let next = query.results[i + 1];
                if (next) {
                    next = next._id;
                } else {
                    next = null;
                }
                yield query.addedBefore(doc._id, query.projectionFn(fields), next);
            }
            yield query.added(doc._id, query.projectionFn(fields));
        } else {
            yield query.added(doc._id, query.projectionFn(fields));
            query.results.set(doc._id, doc);
        }
    })();
LocalCollection._insertInSortedList = (cmp, array, value)=>{
    if (array.length === 0) {
        array.push(value);
        return 0;
    }
    const i = LocalCollection._binarySearch(cmp, array, value);
    array.splice(i, 0, value);
    return i;
};
LocalCollection._isModificationMod = (mod)=>{
    let isModify = false;
    let isReplace = false;
    Object.keys(mod).forEach((key)=>{
        if (key.substr(0, 1) === '$') {
            isModify = true;
        } else {
            isReplace = true;
        }
    });
    if (isModify && isReplace) {
        throw new Error('Update parameter cannot have both modifier and non-modifier fields.');
    }
    return isModify;
};
// XXX maybe this should be EJSON.isObject, though EJSON doesn't know about
// RegExp
// XXX note that _type(undefined) === 3!!!!
LocalCollection._isPlainObject = (x)=>{
    return x && LocalCollection._f._type(x) === 3;
};
// XXX need a strategy for passing the binding of $ into this
// function, from the compiled selector
//
// maybe just {key.up.to.just.before.dollarsign: array_index}
//
// XXX atomicity: if one modification fails, do we roll back the whole
// change?
//
// options:
//   - isInsert is set when _modify is being called to compute the document to
//     insert as part of an upsert operation. We use this primarily to figure
//     out when to set the fields in $setOnInsert, if present.
LocalCollection._modify = (doc, modifier, options = {})=>{
    if (!LocalCollection._isPlainObject(modifier)) {
        throw MinimongoError('Modifier must be an object');
    }
    // Make sure the caller can't mutate our data structures.
    modifier = EJSON.clone(modifier);
    const isModifier = isOperatorObject(modifier);
    const newDoc = isModifier ? EJSON.clone(doc) : modifier;
    if (isModifier) {
        // apply modifiers to the doc.
        Object.keys(modifier).forEach((operator)=>{
            // Treat $setOnInsert as $set if this is an insert.
            const setOnInsert = options.isInsert && operator === '$setOnInsert';
            const modFunc = MODIFIERS[setOnInsert ? '$set' : operator];
            const operand = modifier[operator];
            if (!modFunc) {
                throw MinimongoError(`Invalid modifier specified ${operator}`);
            }
            Object.keys(operand).forEach((keypath)=>{
                const arg = operand[keypath];
                if (keypath === '') {
                    throw MinimongoError('An empty update path is not valid.');
                }
                const keyparts = keypath.split('.');
                if (!keyparts.every(Boolean)) {
                    throw MinimongoError(`The update path '${keypath}' contains an empty field name, ` + 'which is not allowed.');
                }
                const target = findModTarget(newDoc, keyparts, {
                    arrayIndices: options.arrayIndices,
                    forbidArray: operator === '$rename',
                    noCreate: NO_CREATE_MODIFIERS[operator]
                });
                modFunc(target, keyparts.pop(), arg, keypath, newDoc);
            });
        });
        if (doc._id && !EJSON.equals(doc._id, newDoc._id)) {
            throw MinimongoError(`After applying the update to the document {_id: "${doc._id}", ...},` + ' the (immutable) field \'_id\' was found to have been altered to ' + `_id: "${newDoc._id}"`);
        }
    } else {
        if (doc._id && modifier._id && !EJSON.equals(doc._id, modifier._id)) {
            throw MinimongoError(`The _id field cannot be changed from {_id: "${doc._id}"} to ` + `{_id: "${modifier._id}"}`);
        }
        // replace the whole document
        assertHasValidFieldNames(modifier);
    }
    // move new document into place.
    Object.keys(doc).forEach((key)=>{
        // Note: this used to be for (var key in doc) however, this does not
        // work right in Opera. Deleting from a doc while iterating over it
        // would sometimes cause opera to skip some keys.
        if (key !== '_id') {
            delete doc[key];
        }
    });
    Object.keys(newDoc).forEach((key)=>{
        doc[key] = newDoc[key];
    });
};
LocalCollection._observeFromObserveChanges = (cursor, observeCallbacks)=>{
    const transform = cursor.getTransform() || ((doc)=>doc);
    let suppressed = !!observeCallbacks._suppress_initial;
    let observeChangesCallbacks;
    if (LocalCollection._observeCallbacksAreOrdered(observeCallbacks)) {
        // The "_no_indices" option sets all index arguments to -1 and skips the
        // linear scans required to generate them.  This lets observers that don't
        // need absolute indices benefit from the other features of this API --
        // relative order, transforms, and applyChanges -- without the speed hit.
        const indices = !observeCallbacks._no_indices;
        observeChangesCallbacks = {
            addedBefore (id, fields, before) {
                const check = suppressed || !(observeCallbacks.addedAt || observeCallbacks.added);
                if (check) {
                    return;
                }
                const doc = transform(Object.assign(fields, {
                    _id: id
                }));
                if (observeCallbacks.addedAt) {
                    observeCallbacks.addedAt(doc, indices ? before ? this.docs.indexOf(before) : this.docs.size() : -1, before);
                } else {
                    observeCallbacks.added(doc);
                }
            },
            changed (id, fields) {
                if (!(observeCallbacks.changedAt || observeCallbacks.changed)) {
                    return;
                }
                let doc = EJSON.clone(this.docs.get(id));
                if (!doc) {
                    throw new Error(`Unknown id for changed: ${id}`);
                }
                const oldDoc = transform(EJSON.clone(doc));
                DiffSequence.applyChanges(doc, fields);
                if (observeCallbacks.changedAt) {
                    observeCallbacks.changedAt(transform(doc), oldDoc, indices ? this.docs.indexOf(id) : -1);
                } else {
                    observeCallbacks.changed(transform(doc), oldDoc);
                }
            },
            movedBefore (id, before) {
                if (!observeCallbacks.movedTo) {
                    return;
                }
                const from = indices ? this.docs.indexOf(id) : -1;
                let to = indices ? before ? this.docs.indexOf(before) : this.docs.size() : -1;
                // When not moving backwards, adjust for the fact that removing the
                // document slides everything back one slot.
                if (to > from) {
                    --to;
                }
                observeCallbacks.movedTo(transform(EJSON.clone(this.docs.get(id))), from, to, before || null);
            },
            removed (id) {
                if (!(observeCallbacks.removedAt || observeCallbacks.removed)) {
                    return;
                }
                // technically maybe there should be an EJSON.clone here, but it's about
                // to be removed from this.docs!
                const doc = transform(this.docs.get(id));
                if (observeCallbacks.removedAt) {
                    observeCallbacks.removedAt(doc, indices ? this.docs.indexOf(id) : -1);
                } else {
                    observeCallbacks.removed(doc);
                }
            }
        };
    } else {
        observeChangesCallbacks = {
            added (id, fields) {
                if (!suppressed && observeCallbacks.added) {
                    observeCallbacks.added(transform(Object.assign(fields, {
                        _id: id
                    })));
                }
            },
            changed (id, fields) {
                if (observeCallbacks.changed) {
                    const oldDoc = this.docs.get(id);
                    const doc = EJSON.clone(oldDoc);
                    DiffSequence.applyChanges(doc, fields);
                    observeCallbacks.changed(transform(doc), transform(EJSON.clone(oldDoc)));
                }
            },
            removed (id) {
                if (observeCallbacks.removed) {
                    observeCallbacks.removed(transform(this.docs.get(id)));
                }
            }
        };
    }
    const changeObserver = new LocalCollection._CachingChangeObserver({
        callbacks: observeChangesCallbacks
    });
    // CachingChangeObserver clones all received input on its callbacks
    // So we can mark it as safe to reduce the ejson clones.
    // This is tested by the `mongo-livedata - (extended) scribbling` tests
    changeObserver.applyChange._fromObserve = true;
    const handle = cursor.observeChanges(changeObserver.applyChange, {
        nonMutatingCallbacks: true
    });
    // If needed, re-enable callbacks as soon as the initial batch is ready.
    const setSuppressed = (h)=>{
        var _h_isReadyPromise;
        if (h.isReady) suppressed = false;
        else (_h_isReadyPromise = h.isReadyPromise) === null || _h_isReadyPromise === void 0 ? void 0 : _h_isReadyPromise.then(()=>suppressed = false);
    };
    // When we call cursor.observeChanges() it can be the on from
    // the mongo package (instead of the minimongo one) and it doesn't have isReady and isReadyPromise
    if (Meteor._isPromise(handle)) {
        handle.then(setSuppressed);
    } else {
        setSuppressed(handle);
    }
    return handle;
};
LocalCollection._observeCallbacksAreOrdered = (callbacks)=>{
    if (callbacks.added && callbacks.addedAt) {
        throw new Error('Please specify only one of added() and addedAt()');
    }
    if (callbacks.changed && callbacks.changedAt) {
        throw new Error('Please specify only one of changed() and changedAt()');
    }
    if (callbacks.removed && callbacks.removedAt) {
        throw new Error('Please specify only one of removed() and removedAt()');
    }
    return !!(callbacks.addedAt || callbacks.changedAt || callbacks.movedTo || callbacks.removedAt);
};
LocalCollection._observeChangesCallbacksAreOrdered = (callbacks)=>{
    if (callbacks.added && callbacks.addedBefore) {
        throw new Error('Please specify only one of added() and addedBefore()');
    }
    return !!(callbacks.addedBefore || callbacks.movedBefore);
};
LocalCollection._removeFromResultsSync = (query, doc)=>{
    if (query.ordered) {
        const i = LocalCollection._findInOrderedResults(query, doc);
        query.removed(doc._id);
        query.results.splice(i, 1);
    } else {
        const id = doc._id; // in case callback mutates doc
        query.removed(doc._id);
        query.results.remove(id);
    }
};
LocalCollection._removeFromResultsAsync = (query, doc)=>_async_to_generator(function*() {
        if (query.ordered) {
            const i = LocalCollection._findInOrderedResults(query, doc);
            yield query.removed(doc._id);
            query.results.splice(i, 1);
        } else {
            const id = doc._id; // in case callback mutates doc
            yield query.removed(doc._id);
            query.results.remove(id);
        }
    })();
// Is this selector just shorthand for lookup by _id?
LocalCollection._selectorIsId = (selector)=>typeof selector === 'number' || typeof selector === 'string' || selector instanceof MongoID.ObjectID;
// Is the selector just lookup by _id (shorthand or not)?
LocalCollection._selectorIsIdPerhapsAsObject = (selector)=>LocalCollection._selectorIsId(selector) || LocalCollection._selectorIsId(selector && selector._id) && Object.keys(selector).length === 1;
LocalCollection._updateInResultsSync = (query, doc, old_doc)=>{
    if (!EJSON.equals(doc._id, old_doc._id)) {
        throw new Error('Can\'t change a doc\'s _id while updating');
    }
    const projectionFn = query.projectionFn;
    const changedFields = DiffSequence.makeChangedFields(projectionFn(doc), projectionFn(old_doc));
    if (!query.ordered) {
        if (Object.keys(changedFields).length) {
            query.changed(doc._id, changedFields);
            query.results.set(doc._id, doc);
        }
        return;
    }
    const old_idx = LocalCollection._findInOrderedResults(query, doc);
    if (Object.keys(changedFields).length) {
        query.changed(doc._id, changedFields);
    }
    if (!query.sorter) {
        return;
    }
    // just take it out and put it back in again, and see if the index changes
    query.results.splice(old_idx, 1);
    const new_idx = LocalCollection._insertInSortedList(query.sorter.getComparator({
        distances: query.distances
    }), query.results, doc);
    if (old_idx !== new_idx) {
        let next = query.results[new_idx + 1];
        if (next) {
            next = next._id;
        } else {
            next = null;
        }
        query.movedBefore && query.movedBefore(doc._id, next);
    }
};
LocalCollection._updateInResultsAsync = (query, doc, old_doc)=>_async_to_generator(function*() {
        if (!EJSON.equals(doc._id, old_doc._id)) {
            throw new Error('Can\'t change a doc\'s _id while updating');
        }
        const projectionFn = query.projectionFn;
        const changedFields = DiffSequence.makeChangedFields(projectionFn(doc), projectionFn(old_doc));
        if (!query.ordered) {
            if (Object.keys(changedFields).length) {
                yield query.changed(doc._id, changedFields);
                query.results.set(doc._id, doc);
            }
            return;
        }
        const old_idx = LocalCollection._findInOrderedResults(query, doc);
        if (Object.keys(changedFields).length) {
            yield query.changed(doc._id, changedFields);
        }
        if (!query.sorter) {
            return;
        }
        // just take it out and put it back in again, and see if the index changes
        query.results.splice(old_idx, 1);
        const new_idx = LocalCollection._insertInSortedList(query.sorter.getComparator({
            distances: query.distances
        }), query.results, doc);
        if (old_idx !== new_idx) {
            let next = query.results[new_idx + 1];
            if (next) {
                next = next._id;
            } else {
                next = null;
            }
            query.movedBefore && (yield query.movedBefore(doc._id, next));
        }
    })();
const MODIFIERS = {
    $currentDate (target, field, arg) {
        if (typeof arg === 'object' && hasOwn.call(arg, '$type')) {
            if (arg.$type !== 'date') {
                throw MinimongoError('Minimongo does currently only support the date type in ' + '$currentDate modifiers', {
                    field
                });
            }
        } else if (arg !== true) {
            throw MinimongoError('Invalid $currentDate modifier', {
                field
            });
        }
        target[field] = new Date();
    },
    $inc (target, field, arg) {
        if (typeof arg !== 'number') {
            throw MinimongoError('Modifier $inc allowed for numbers only', {
                field
            });
        }
        if (field in target) {
            if (typeof target[field] !== 'number') {
                throw MinimongoError('Cannot apply $inc modifier to non-number', {
                    field
                });
            }
            target[field] += arg;
        } else {
            target[field] = arg;
        }
    },
    $min (target, field, arg) {
        if (typeof arg !== 'number') {
            throw MinimongoError('Modifier $min allowed for numbers only', {
                field
            });
        }
        if (field in target) {
            if (typeof target[field] !== 'number') {
                throw MinimongoError('Cannot apply $min modifier to non-number', {
                    field
                });
            }
            if (target[field] > arg) {
                target[field] = arg;
            }
        } else {
            target[field] = arg;
        }
    },
    $max (target, field, arg) {
        if (typeof arg !== 'number') {
            throw MinimongoError('Modifier $max allowed for numbers only', {
                field
            });
        }
        if (field in target) {
            if (typeof target[field] !== 'number') {
                throw MinimongoError('Cannot apply $max modifier to non-number', {
                    field
                });
            }
            if (target[field] < arg) {
                target[field] = arg;
            }
        } else {
            target[field] = arg;
        }
    },
    $mul (target, field, arg) {
        if (typeof arg !== 'number') {
            throw MinimongoError('Modifier $mul allowed for numbers only', {
                field
            });
        }
        if (field in target) {
            if (typeof target[field] !== 'number') {
                throw MinimongoError('Cannot apply $mul modifier to non-number', {
                    field
                });
            }
            target[field] *= arg;
        } else {
            target[field] = 0;
        }
    },
    $rename (target, field, arg, keypath, doc) {
        // no idea why mongo has this restriction..
        if (keypath === arg) {
            throw MinimongoError('$rename source must differ from target', {
                field
            });
        }
        if (target === null) {
            throw MinimongoError('$rename source field invalid', {
                field
            });
        }
        if (typeof arg !== 'string') {
            throw MinimongoError('$rename target must be a string', {
                field
            });
        }
        if (arg.includes('\0')) {
            // Null bytes are not allowed in Mongo field names
            // https://docs.mongodb.com/manual/reference/limits/#Restrictions-on-Field-Names
            throw MinimongoError('The \'to\' field for $rename cannot contain an embedded null byte', {
                field
            });
        }
        if (target === undefined) {
            return;
        }
        const object = target[field];
        delete target[field];
        const keyparts = arg.split('.');
        const target2 = findModTarget(doc, keyparts, {
            forbidArray: true
        });
        if (target2 === null) {
            throw MinimongoError('$rename target field invalid', {
                field
            });
        }
        target2[keyparts.pop()] = object;
    },
    $set (target, field, arg) {
        if (target !== Object(target)) {
            const error = MinimongoError('Cannot set property on non-object field', {
                field
            });
            error.setPropertyError = true;
            throw error;
        }
        if (target === null) {
            const error = MinimongoError('Cannot set property on null', {
                field
            });
            error.setPropertyError = true;
            throw error;
        }
        assertHasValidFieldNames(arg);
        target[field] = arg;
    },
    $setOnInsert (target, field, arg) {
    // converted to `$set` in `_modify`
    },
    $unset (target, field, arg) {
        if (target !== undefined) {
            if (target instanceof Array) {
                if (field in target) {
                    target[field] = null;
                }
            } else {
                delete target[field];
            }
        }
    },
    $push (target, field, arg) {
        if (target[field] === undefined) {
            target[field] = [];
        }
        if (!(target[field] instanceof Array)) {
            throw MinimongoError('Cannot apply $push modifier to non-array', {
                field
            });
        }
        if (!(arg && arg.$each)) {
            // Simple mode: not $each
            assertHasValidFieldNames(arg);
            target[field].push(arg);
            return;
        }
        // Fancy mode: $each (and maybe $slice and $sort and $position)
        const toPush = arg.$each;
        if (!(toPush instanceof Array)) {
            throw MinimongoError('$each must be an array', {
                field
            });
        }
        assertHasValidFieldNames(toPush);
        // Parse $position
        let position = undefined;
        if ('$position' in arg) {
            if (typeof arg.$position !== 'number') {
                throw MinimongoError('$position must be a numeric value', {
                    field
                });
            }
            // XXX should check to make sure integer
            if (arg.$position < 0) {
                throw MinimongoError('$position in $push must be zero or positive', {
                    field
                });
            }
            position = arg.$position;
        }
        // Parse $slice.
        let slice = undefined;
        if ('$slice' in arg) {
            if (typeof arg.$slice !== 'number') {
                throw MinimongoError('$slice must be a numeric value', {
                    field
                });
            }
            // XXX should check to make sure integer
            slice = arg.$slice;
        }
        // Parse $sort.
        let sortFunction = undefined;
        if (arg.$sort) {
            if (slice === undefined) {
                throw MinimongoError('$sort requires $slice to be present', {
                    field
                });
            }
            // XXX this allows us to use a $sort whose value is an array, but that's
            // actually an extension of the Node driver, so it won't work
            // server-side. Could be confusing!
            // XXX is it correct that we don't do geo-stuff here?
            sortFunction = new Minimongo.Sorter(arg.$sort).getComparator();
            toPush.forEach((element)=>{
                if (LocalCollection._f._type(element) !== 3) {
                    throw MinimongoError('$push like modifiers using $sort require all elements to be ' + 'objects', {
                        field
                    });
                }
            });
        }
        // Actually push.
        if (position === undefined) {
            toPush.forEach((element)=>{
                target[field].push(element);
            });
        } else {
            const spliceArguments = [
                position,
                0
            ];
            toPush.forEach((element)=>{
                spliceArguments.push(element);
            });
            target[field].splice(...spliceArguments);
        }
        // Actually sort.
        if (sortFunction) {
            target[field].sort(sortFunction);
        }
        // Actually slice.
        if (slice !== undefined) {
            if (slice === 0) {
                target[field] = []; // differs from Array.slice!
            } else if (slice < 0) {
                target[field] = target[field].slice(slice);
            } else {
                target[field] = target[field].slice(0, slice);
            }
        }
    },
    $pushAll (target, field, arg) {
        if (!(typeof arg === 'object' && arg instanceof Array)) {
            throw MinimongoError('Modifier $pushAll/pullAll allowed for arrays only');
        }
        assertHasValidFieldNames(arg);
        const toPush = target[field];
        if (toPush === undefined) {
            target[field] = arg;
        } else if (!(toPush instanceof Array)) {
            throw MinimongoError('Cannot apply $pushAll modifier to non-array', {
                field
            });
        } else {
            toPush.push(...arg);
        }
    },
    $addToSet (target, field, arg) {
        let isEach = false;
        if (typeof arg === 'object') {
            // check if first key is '$each'
            const keys = Object.keys(arg);
            if (keys[0] === '$each') {
                isEach = true;
            }
        }
        const values = isEach ? arg.$each : [
            arg
        ];
        assertHasValidFieldNames(values);
        const toAdd = target[field];
        if (toAdd === undefined) {
            target[field] = values;
        } else if (!(toAdd instanceof Array)) {
            throw MinimongoError('Cannot apply $addToSet modifier to non-array', {
                field
            });
        } else {
            values.forEach((value)=>{
                if (toAdd.some((element)=>LocalCollection._f._equal(value, element))) {
                    return;
                }
                toAdd.push(value);
            });
        }
    },
    $pop (target, field, arg) {
        if (target === undefined) {
            return;
        }
        const toPop = target[field];
        if (toPop === undefined) {
            return;
        }
        if (!(toPop instanceof Array)) {
            throw MinimongoError('Cannot apply $pop modifier to non-array', {
                field
            });
        }
        if (typeof arg === 'number' && arg < 0) {
            toPop.splice(0, 1);
        } else {
            toPop.pop();
        }
    },
    $pull (target, field, arg) {
        if (target === undefined) {
            return;
        }
        const toPull = target[field];
        if (toPull === undefined) {
            return;
        }
        if (!(toPull instanceof Array)) {
            throw MinimongoError('Cannot apply $pull/pullAll modifier to non-array', {
                field
            });
        }
        let out;
        if (arg != null && typeof arg === 'object' && !(arg instanceof Array)) {
            // XXX would be much nicer to compile this once, rather than
            // for each document we modify.. but usually we're not
            // modifying that many documents, so we'll let it slide for
            // now
            // XXX Minimongo.Matcher isn't up for the job, because we need
            // to permit stuff like {$pull: {a: {$gt: 4}}}.. something
            // like {$gt: 4} is not normally a complete selector.
            // same issue as $elemMatch possibly?
            const matcher = new Minimongo.Matcher(arg);
            out = toPull.filter((element)=>!matcher.documentMatches(element).result);
        } else {
            out = toPull.filter((element)=>!LocalCollection._f._equal(element, arg));
        }
        target[field] = out;
    },
    $pullAll (target, field, arg) {
        if (!(typeof arg === 'object' && arg instanceof Array)) {
            throw MinimongoError('Modifier $pushAll/pullAll allowed for arrays only', {
                field
            });
        }
        if (target === undefined) {
            return;
        }
        const toPull = target[field];
        if (toPull === undefined) {
            return;
        }
        if (!(toPull instanceof Array)) {
            throw MinimongoError('Cannot apply $pull/pullAll modifier to non-array', {
                field
            });
        }
        target[field] = toPull.filter((object)=>!arg.some((element)=>LocalCollection._f._equal(object, element)));
    },
    $bit (target, field, arg) {
        // XXX mongo only supports $bit on integers, and we only support
        // native javascript numbers (doubles) so far, so we can't support $bit
        throw MinimongoError('$bit is not supported', {
            field
        });
    },
    $v () {
    // As discussed in https://github.com/meteor/meteor/issues/9623,
    // the `$v` operator is not needed by Meteor, but problems can occur if
    // it's not at least callable (as of Mongo >= 3.6). It's defined here as
    // a no-op to work around these problems.
    }
};
const NO_CREATE_MODIFIERS = {
    $pop: true,
    $pull: true,
    $pullAll: true,
    $rename: true,
    $unset: true
};
// Make sure field names do not contain Mongo restricted
// characters ('$', '\0') or invalid dot usage (leading/trailing/consecutive '.').
// https://docs.mongodb.com/manual/reference/limits/#Restrictions-on-Field-Names
const invalidCharMsg = {
    $: 'start with \'$\'',
    '.': 'start or end with \'.\'',
    '..': 'contain consecutive dots',
    '\0': 'contain null bytes'
};
// checks if all field names in an object are valid
function assertHasValidFieldNames(doc) {
    if (doc && typeof doc === 'object') {
        JSON.stringify(doc, (key, value)=>{
            assertIsValidFieldName(key);
            return value;
        });
    }
}
function assertIsValidFieldName(key) {
    let match;
    if (typeof key === 'string' && (match = key.match(/^\$|^\.|\.\.|\.$|^\.$|\0/))) {
        throw MinimongoError(`Key ${key} must not ${invalidCharMsg[match[0]]}`);
    }
}
// for a.b.c.2.d.e, keyparts should be ['a', 'b', 'c', '2', 'd', 'e'],
// and then you would operate on the 'e' property of the returned
// object.
//
// if options.noCreate is falsey, creates intermediate levels of
// structure as necessary, like mkdir -p (and raises an exception if
// that would mean giving a non-numeric property to an array.) if
// options.noCreate is true, return undefined instead.
//
// may modify the last element of keyparts to signal to the caller that it needs
// to use a different value to index into the returned object (for example,
// ['a', '01'] -> ['a', 1]).
//
// if forbidArray is true, return null if the keypath goes through an array.
//
// if options.arrayIndices is set, use its first element for the (first) '$' in
// the path.
function findModTarget(doc, keyparts, options = {}) {
    let usedArrayIndex = false;
    for(let i = 0; i < keyparts.length; i++){
        const last = i === keyparts.length - 1;
        let keypart = keyparts[i];
        if (!isIndexable(doc)) {
            if (options.noCreate) {
                return undefined;
            }
            const error = MinimongoError(`cannot use the part '${keypart}' to traverse ${doc}`);
            error.setPropertyError = true;
            throw error;
        }
        if (doc instanceof Array) {
            if (options.forbidArray) {
                return null;
            }
            if (keypart === '$') {
                if (usedArrayIndex) {
                    throw MinimongoError('Too many positional (i.e. \'$\') elements');
                }
                if (!options.arrayIndices || !options.arrayIndices.length) {
                    throw MinimongoError('The positional operator did not find the match needed from the ' + 'query');
                }
                keypart = options.arrayIndices[0];
                usedArrayIndex = true;
            } else if (isNumericKey(keypart)) {
                keypart = parseInt(keypart);
            } else {
                if (options.noCreate) {
                    return undefined;
                }
                throw MinimongoError(`can't append to array using string field name [${keypart}]`);
            }
            if (last) {
                keyparts[i] = keypart; // handle 'a.01'
            }
            if (options.noCreate && keypart >= doc.length) {
                return undefined;
            }
            while(doc.length < keypart){
                doc.push(null);
            }
            if (!last) {
                if (doc.length === keypart) {
                    doc.push({});
                } else if (typeof doc[keypart] !== 'object') {
                    throw MinimongoError(`can't modify field '${keyparts[i + 1]}' of list value ` + JSON.stringify(doc[keypart]));
                }
            }
        } else {
            assertIsValidFieldName(keypart);
            if (!(keypart in doc)) {
                if (options.noCreate) {
                    return undefined;
                }
                if (!last) {
                    doc[keypart] = {};
                }
            }
        }
        if (last) {
            return doc;
        }
        doc = doc[keypart];
    }
// notreached
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"matcher.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/matcher.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({default:()=>Matcher});let LocalCollection;module.link('./local_collection.js',{default(v){LocalCollection=v}},0);let compileDocumentSelector,hasOwn,nothingMatcher;module.link('./common.js',{compileDocumentSelector(v){compileDocumentSelector=v},hasOwn(v){hasOwn=v},nothingMatcher(v){nothingMatcher=v}},1);var _Package_mongodecimal;


const Decimal = ((_Package_mongodecimal = Package['mongo-decimal']) === null || _Package_mongodecimal === void 0 ? void 0 : _Package_mongodecimal.Decimal) || class DecimalStub {
};
class Matcher {
    documentMatches(doc) {
        if (doc !== Object(doc)) {
            throw Error('documentMatches needs a document');
        }
        return this._docMatcher(doc);
    }
    hasGeoQuery() {
        return this._hasGeoQuery;
    }
    hasWhere() {
        return this._hasWhere;
    }
    isSimple() {
        return this._isSimple;
    }
    // Given a selector, return a function that takes one argument, a
    // document. It returns a result object.
    _compileSelector(selector) {
        // you can pass a literal function instead of a selector
        if (selector instanceof Function) {
            this._isSimple = false;
            this._selector = selector;
            this._recordPathUsed('');
            return (doc)=>({
                    result: !!selector.call(doc)
                });
        }
        // shorthand -- scalar _id
        if (LocalCollection._selectorIsId(selector)) {
            this._selector = {
                _id: selector
            };
            this._recordPathUsed('_id');
            return (doc)=>({
                    result: EJSON.equals(doc._id, selector)
                });
        }
        // protect against dangerous selectors.  falsey and {_id: falsey} are both
        // likely programmer error, and not what you want, particularly for
        // destructive operations.
        if (!selector || hasOwn.call(selector, '_id') && !selector._id) {
            this._isSimple = false;
            return nothingMatcher;
        }
        // Top level can't be an array or true or binary.
        if (Array.isArray(selector) || EJSON.isBinary(selector) || typeof selector === 'boolean') {
            throw new Error(`Invalid selector: ${selector}`);
        }
        this._selector = EJSON.clone(selector);
        return compileDocumentSelector(selector, this, {
            isRoot: true
        });
    }
    // Returns a list of key paths the given selector is looking for. It includes
    // the empty string if there is a $where.
    _getPaths() {
        return Object.keys(this._paths);
    }
    _recordPathUsed(path) {
        this._paths[path] = true;
    }
    constructor(selector, isUpdate){
        // A set (object mapping string -> *) of all of the document paths looked
        // at by the selector. Also includes the empty string if it may look at any
        // path (eg, $where).
        this._paths = {};
        // Set to true if compilation finds a $near.
        this._hasGeoQuery = false;
        // Set to true if compilation finds a $where.
        this._hasWhere = false;
        // Set to false if compilation finds anything other than a simple equality
        // or one or more of '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin' used
        // with scalars as operands.
        this._isSimple = true;
        // Set to a dummy document which always matches this Matcher. Or set to null
        // if such document is too hard to find.
        this._matchingDocument = undefined;
        // A clone of the original selector. It may just be a function if the user
        // passed in a function; otherwise is definitely an object (eg, IDs are
        // translated into {_id: ID} first. Used by canBecomeTrueByModifier and
        // Sorter._useWithMatcher.
        this._selector = null;
        this._docMatcher = this._compileSelector(selector);
        // Set to true if selection is done for an update operation
        // Default is false
        // Used for $near array update (issue #3599)
        this._isUpdate = isUpdate;
    }
}
// The minimongo selector compiler!
// Terminology:
//  - a 'selector' is the EJSON object representing a selector
//  - a 'matcher' is its compiled form (whether a full Minimongo.Matcher
//    object or one of the component lambdas that matches parts of it)
//  - a 'result object' is an object with a 'result' field and maybe
//    distance and arrayIndices.
//  - a 'branched value' is an object with a 'value' field and maybe
//    'dontIterate' and 'arrayIndices'.
//  - a 'document' is a top-level object that can be stored in a collection.
//  - a 'lookup function' is a function that takes in a document and returns
//    an array of 'branched values'.
//  - a 'branched matcher' maps from an array of branched values to a result
//    object.
//  - an 'element matcher' maps from a single value to a bool.
// Main entry point.
//   var matcher = new Minimongo.Matcher({a: {$gt: 5}});
//   if (matcher.documentMatches({a: 7})) ...

// helpers used by compiled selector code
LocalCollection._f = {
    // XXX for _all and _in, consider building 'inquery' at compile time..
    _type (v) {
        if (typeof v === 'number') {
            return 1;
        }
        if (typeof v === 'string') {
            return 2;
        }
        if (typeof v === 'boolean') {
            return 8;
        }
        if (Array.isArray(v)) {
            return 4;
        }
        if (v === null) {
            return 10;
        }
        // note that typeof(/x/) === "object"
        if (v instanceof RegExp) {
            return 11;
        }
        if (typeof v === 'function') {
            return 13;
        }
        if (v instanceof Date) {
            return 9;
        }
        if (EJSON.isBinary(v)) {
            return 5;
        }
        if (v instanceof MongoID.ObjectID) {
            return 7;
        }
        if (v instanceof Decimal) {
            return 1;
        }
        // object
        return 3;
    // XXX support some/all of these:
    // 14, symbol
    // 15, javascript code with scope
    // 16, 18: 32-bit/64-bit integer
    // 17, timestamp
    // 255, minkey
    // 127, maxkey
    },
    // deep equality test: use for literal document and array matches
    _equal (a, b) {
        return EJSON.equals(a, b, {
            keyOrderSensitive: true
        });
    },
    // maps a type code to a value that can be used to sort values of different
    // types
    _typeorder (t) {
        // http://www.mongodb.org/display/DOCS/What+is+the+Compare+Order+for+BSON+Types
        // XXX what is the correct sort position for Javascript code?
        // ('100' in the matrix below)
        // XXX minkey/maxkey
        return [
            -1,
            1,
            2,
            3,
            4,
            5,
            -1,
            6,
            7,
            8,
            0,
            9,
            -1,
            100,
            2,
            100,
            1,
            8,
            1 // 64-bit int
        ][t];
    },
    // compare two values of unknown type according to BSON ordering
    // semantics. (as an extension, consider 'undefined' to be less than
    // any other value.) return negative if a is less, positive if b is
    // less, or 0 if equal
    _cmp (a, b) {
        if (a === undefined) {
            return b === undefined ? 0 : -1;
        }
        if (b === undefined) {
            return 1;
        }
        let ta = LocalCollection._f._type(a);
        let tb = LocalCollection._f._type(b);
        const oa = LocalCollection._f._typeorder(ta);
        const ob = LocalCollection._f._typeorder(tb);
        if (oa !== ob) {
            return oa < ob ? -1 : 1;
        }
        // XXX need to implement this if we implement Symbol or integers, or
        // Timestamp
        if (ta !== tb) {
            throw Error('Missing type coercion logic in _cmp');
        }
        if (ta === 7) {
            // Convert to string.
            ta = tb = 2;
            a = a.toHexString();
            b = b.toHexString();
        }
        if (ta === 9) {
            // Convert to millis.
            ta = tb = 1;
            a = isNaN(a) ? 0 : a.getTime();
            b = isNaN(b) ? 0 : b.getTime();
        }
        if (ta === 1) {
            if (a instanceof Decimal) {
                return a.minus(b).toNumber();
            } else {
                return a - b;
            }
        }
        if (tb === 2) return a < b ? -1 : a === b ? 0 : 1;
        if (ta === 3) {
            // this could be much more efficient in the expected case ...
            const toArray = (object)=>{
                const result = [];
                Object.keys(object).forEach((key)=>{
                    result.push(key, object[key]);
                });
                return result;
            };
            return LocalCollection._f._cmp(toArray(a), toArray(b));
        }
        if (ta === 4) {
            for(let i = 0;; i++){
                if (i === a.length) {
                    return i === b.length ? 0 : -1;
                }
                if (i === b.length) {
                    return 1;
                }
                const s = LocalCollection._f._cmp(a[i], b[i]);
                if (s !== 0) {
                    return s;
                }
            }
        }
        if (ta === 5) {
            // Surprisingly, a small binary blob is always less than a large one in
            // Mongo.
            if (a.length !== b.length) {
                return a.length - b.length;
            }
            for(let i = 0; i < a.length; i++){
                if (a[i] < b[i]) {
                    return -1;
                }
                if (a[i] > b[i]) {
                    return 1;
                }
            }
            return 0;
        }
        if (ta === 8) {
            if (a) {
                return b ? 0 : 1;
            }
            return b ? -1 : 0;
        }
        if (ta === 10) return 0;
        if (ta === 11) throw Error('Sorting not supported on regular expression'); // XXX
        // 13: javascript code
        // 14: symbol
        // 15: javascript code with scope
        // 16: 32-bit integer
        // 17: timestamp
        // 18: 64-bit integer
        // 255: minkey
        // 127: maxkey
        if (ta === 13) throw Error('Sorting not supported on Javascript code'); // XXX
        throw Error('Unknown type to sort');
    }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"minimongo_common.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/minimongo_common.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LocalCollection_;module.link('./local_collection.js',{default(v){LocalCollection_=v}},0);let Matcher;module.link('./matcher.js',{default(v){Matcher=v}},1);let Sorter;module.link('./sorter.js',{default(v){Sorter=v}},2);


LocalCollection = LocalCollection_;
Minimongo = {
    LocalCollection: LocalCollection_,
    Matcher,
    Sorter
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"observe_handle.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/observe_handle.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({default:()=>ObserveHandle});// ObserveHandle: the return value of a live query.
class ObserveHandle {
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sorter.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/minimongo/sorter.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({default:()=>Sorter});let ELEMENT_OPERATORS,equalityElementMatcher,expandArraysInBranches,hasOwn,isOperatorObject,makeLookupFunction,regexpElementMatcher;module.link('./common.js',{ELEMENT_OPERATORS(v){ELEMENT_OPERATORS=v},equalityElementMatcher(v){equalityElementMatcher=v},expandArraysInBranches(v){expandArraysInBranches=v},hasOwn(v){hasOwn=v},isOperatorObject(v){isOperatorObject=v},makeLookupFunction(v){makeLookupFunction=v},regexpElementMatcher(v){regexpElementMatcher=v}},0);
class Sorter {
    getComparator(options) {
        // If sort is specified or have no distances, just use the comparator from
        // the source specification (which defaults to "everything is equal".
        // issue #3599
        // https://docs.mongodb.com/manual/reference/operator/query/near/#sort-operation
        // sort effectively overrides $near
        if (this._sortSpecParts.length || !options || !options.distances) {
            return this._getBaseComparator();
        }
        const distances = options.distances;
        // Return a comparator which compares using $near distances.
        return (a, b)=>{
            if (!distances.has(a._id)) {
                throw Error(`Missing distance for ${a._id}`);
            }
            if (!distances.has(b._id)) {
                throw Error(`Missing distance for ${b._id}`);
            }
            return distances.get(a._id) - distances.get(b._id);
        };
    }
    // Takes in two keys: arrays whose lengths match the number of spec
    // parts. Returns negative, 0, or positive based on using the sort spec to
    // compare fields.
    _compareKeys(key1, key2) {
        if (key1.length !== this._sortSpecParts.length || key2.length !== this._sortSpecParts.length) {
            throw Error('Key has wrong length');
        }
        return this._keyComparator(key1, key2);
    }
    // Iterates over each possible "key" from doc (ie, over each branch), calling
    // 'cb' with the key.
    _generateKeysFromDoc(doc, cb) {
        if (this._sortSpecParts.length === 0) {
            throw new Error('can\'t generate keys without a spec');
        }
        const pathFromIndices = (indices)=>`${indices.join(',')},`;
        let knownPaths = null;
        // maps index -> ({'' -> value} or {path -> value})
        const valuesByIndexAndPath = this._sortSpecParts.map((spec)=>{
            // Expand any leaf arrays that we find, and ignore those arrays
            // themselves.  (We never sort based on an array itself.)
            let branches = expandArraysInBranches(spec.lookup(doc), true);
            // If there are no values for a key (eg, key goes to an empty array),
            // pretend we found one undefined value.
            if (!branches.length) {
                branches = [
                    {
                        value: void 0
                    }
                ];
            }
            const element = Object.create(null);
            let usedPaths = false;
            branches.forEach((branch)=>{
                if (!branch.arrayIndices) {
                    // If there are no array indices for a branch, then it must be the
                    // only branch, because the only thing that produces multiple branches
                    // is the use of arrays.
                    if (branches.length > 1) {
                        throw Error('multiple branches but no array used?');
                    }
                    element[''] = branch.value;
                    return;
                }
                usedPaths = true;
                const path = pathFromIndices(branch.arrayIndices);
                if (hasOwn.call(element, path)) {
                    throw Error(`duplicate path: ${path}`);
                }
                element[path] = branch.value;
                // If two sort fields both go into arrays, they have to go into the
                // exact same arrays and we have to find the same paths.  This is
                // roughly the same condition that makes MongoDB throw this strange
                // error message.  eg, the main thing is that if sort spec is {a: 1,
                // b:1} then a and b cannot both be arrays.
                //
                // (In MongoDB it seems to be OK to have {a: 1, 'a.x.y': 1} where 'a'
                // and 'a.x.y' are both arrays, but we don't allow this for now.
                // #NestedArraySort
                // XXX achieve full compatibility here
                if (knownPaths && !hasOwn.call(knownPaths, path)) {
                    throw Error('cannot index parallel arrays');
                }
            });
            if (knownPaths) {
                // Similarly to above, paths must match everywhere, unless this is a
                // non-array field.
                if (!hasOwn.call(element, '') && Object.keys(knownPaths).length !== Object.keys(element).length) {
                    throw Error('cannot index parallel arrays!');
                }
            } else if (usedPaths) {
                knownPaths = {};
                Object.keys(element).forEach((path)=>{
                    knownPaths[path] = true;
                });
            }
            return element;
        });
        if (!knownPaths) {
            // Easy case: no use of arrays.
            const soleKey = valuesByIndexAndPath.map((values)=>{
                if (!hasOwn.call(values, '')) {
                    throw Error('no value in sole key case?');
                }
                return values[''];
            });
            cb(soleKey);
            return;
        }
        Object.keys(knownPaths).forEach((path)=>{
            const key = valuesByIndexAndPath.map((values)=>{
                if (hasOwn.call(values, '')) {
                    return values[''];
                }
                if (!hasOwn.call(values, path)) {
                    throw Error('missing path?');
                }
                return values[path];
            });
            cb(key);
        });
    }
    // Returns a comparator that represents the sort specification (but not
    // including a possible geoquery distance tie-breaker).
    _getBaseComparator() {
        if (this._sortFunction) {
            return this._sortFunction;
        }
        // If we're only sorting on geoquery distance and no specs, just say
        // everything is equal.
        if (!this._sortSpecParts.length) {
            return (doc1, doc2)=>0;
        }
        return (doc1, doc2)=>{
            const key1 = this._getMinKeyFromDoc(doc1);
            const key2 = this._getMinKeyFromDoc(doc2);
            return this._compareKeys(key1, key2);
        };
    }
    // Finds the minimum key from the doc, according to the sort specs.  (We say
    // "minimum" here but this is with respect to the sort spec, so "descending"
    // sort fields mean we're finding the max for that field.)
    //
    // Note that this is NOT "find the minimum value of the first field, the
    // minimum value of the second field, etc"... it's "choose the
    // lexicographically minimum value of the key vector, allowing only keys which
    // you can find along the same paths".  ie, for a doc {a: [{x: 0, y: 5}, {x:
    // 1, y: 3}]} with sort spec {'a.x': 1, 'a.y': 1}, the only keys are [0,5] and
    // [1,3], and the minimum key is [0,5]; notably, [0,3] is NOT a key.
    _getMinKeyFromDoc(doc) {
        let minKey = null;
        this._generateKeysFromDoc(doc, (key)=>{
            if (minKey === null) {
                minKey = key;
                return;
            }
            if (this._compareKeys(key, minKey) < 0) {
                minKey = key;
            }
        });
        return minKey;
    }
    _getPaths() {
        return this._sortSpecParts.map((part)=>part.path);
    }
    // Given an index 'i', returns a comparator that compares two key arrays based
    // on field 'i'.
    _keyFieldComparator(i) {
        const invert = !this._sortSpecParts[i].ascending;
        return (key1, key2)=>{
            const compare = LocalCollection._f._cmp(key1[i], key2[i]);
            return invert ? -compare : compare;
        };
    }
    constructor(spec){
        this._sortSpecParts = [];
        this._sortFunction = null;
        const addSpecPart = (path, ascending)=>{
            if (!path) {
                throw Error('sort keys must be non-empty');
            }
            if (path.charAt(0) === '$') {
                throw Error(`unsupported sort key: ${path}`);
            }
            this._sortSpecParts.push({
                ascending,
                lookup: makeLookupFunction(path, {
                    forSort: true
                }),
                path
            });
        };
        if (spec instanceof Array) {
            spec.forEach((element)=>{
                if (typeof element === 'string') {
                    addSpecPart(element, true);
                } else {
                    addSpecPart(element[0], element[1] !== 'desc');
                }
            });
        } else if (typeof spec === 'object') {
            Object.keys(spec).forEach((key)=>{
                addSpecPart(key, spec[key] >= 0);
            });
        } else if (typeof spec === 'function') {
            this._sortFunction = spec;
        } else {
            throw Error(`Bad sort specification: ${JSON.stringify(spec)}`);
        }
        // If a function is specified for sorting, we skip the rest.
        if (this._sortFunction) {
            return;
        }
        // To implement affectedByModifier, we piggy-back on top of Matcher's
        // affectedByModifier code; we create a selector that is affected by the
        // same modifiers as this sort order. This is only implemented on the
        // server.
        if (this.affectedByModifier) {
            const selector = {};
            this._sortSpecParts.forEach((spec)=>{
                selector[spec.path] = 1;
            });
            this._selectorForAffectedByModifier = new Minimongo.Matcher(selector);
        }
        this._keyComparator = composeComparators(this._sortSpecParts.map((spec, i)=>this._keyFieldComparator(i)));
    }
}
// Give a sort spec, which can be in any of these forms:
//   {"key1": 1, "key2": -1}
//   [["key1", "asc"], ["key2", "desc"]]
//   ["key1", ["key2", "desc"]]
//
// (.. with the first form being dependent on the key enumeration
// behavior of your javascript VM, which usually does what you mean in
// this case if the key names don't look like integers ..)
//
// return a function that takes two objects, and returns -1 if the
// first object comes first in order, 1 if the second object comes
// first, or 0 if neither object comes before the other.

// Given an array of comparators
// (functions (a,b)->(negative or positive or zero)), returns a single
// comparator which uses each comparator in order and returns the first
// non-zero value.
function composeComparators(comparatorArray) {
    return (a, b)=>{
        for(let i = 0; i < comparatorArray.length; ++i){
            const compare = comparatorArray[i](a, b);
            if (compare !== 0) {
                return compare;
            }
        }
        return 0;
    };
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});


/* Exports */
return {
  export: function () { return {
      LocalCollection: LocalCollection,
      Minimongo: Minimongo,
      MinimongoTest: MinimongoTest,
      MinimongoError: MinimongoError
    };},
  require: require,
  eagerModulePaths: [
    "/node_modules/meteor/minimongo/minimongo_server.js"
  ],
  mainModulePath: "/node_modules/meteor/minimongo/minimongo_server.js"
}});

//# sourceURL=meteor://💻app/packages/minimongo.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbWluaW1vbmdvL21pbmltb25nb19zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21pbmltb25nby9jb21tb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21pbmltb25nby9jb25zdGFudHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21pbmltb25nby9jdXJzb3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21pbmltb25nby9sb2NhbF9jb2xsZWN0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9taW5pbW9uZ28vbWF0Y2hlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbWluaW1vbmdvL21pbmltb25nb19jb21tb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21pbmltb25nby9vYnNlcnZlX2hhbmRsZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbWluaW1vbmdvL3NvcnRlci5qcyJdLCJuYW1lcyI6WyJNaW5pbW9uZ28iLCJfcGF0aHNFbGlkaW5nTnVtZXJpY0tleXMiLCJwYXRocyIsIm1hcCIsInBhdGgiLCJzcGxpdCIsImZpbHRlciIsInBhcnQiLCJpc051bWVyaWNLZXkiLCJqb2luIiwiTWF0Y2hlciIsInByb3RvdHlwZSIsImFmZmVjdGVkQnlNb2RpZmllciIsIm1vZGlmaWVyIiwiT2JqZWN0IiwiYXNzaWduIiwiJHNldCIsIiR1bnNldCIsIm1lYW5pbmdmdWxQYXRocyIsIl9nZXRQYXRocyIsIm1vZGlmaWVkUGF0aHMiLCJjb25jYXQiLCJrZXlzIiwic29tZSIsIm1vZCIsIm1lYW5pbmdmdWxQYXRoIiwic2VsIiwiaSIsImoiLCJsZW5ndGgiLCJjYW5CZWNvbWVUcnVlQnlNb2RpZmllciIsImlzU2ltcGxlIiwibW9kaWZpZXJQYXRocyIsInBhdGhIYXNOdW1lcmljS2V5cyIsImV4cGVjdGVkU2NhbGFySXNPYmplY3QiLCJfc2VsZWN0b3IiLCJpc09wZXJhdG9yT2JqZWN0IiwibW9kaWZpZXJQYXRoIiwic3RhcnRzV2l0aCIsIm1hdGNoaW5nRG9jdW1lbnQiLCJFSlNPTiIsImNsb25lIiwiTG9jYWxDb2xsZWN0aW9uIiwiX21vZGlmeSIsImVycm9yIiwibmFtZSIsInNldFByb3BlcnR5RXJyb3IiLCJkb2N1bWVudE1hdGNoZXMiLCJyZXN1bHQiLCJjb21iaW5lSW50b1Byb2plY3Rpb24iLCJwcm9qZWN0aW9uIiwic2VsZWN0b3JQYXRocyIsImluY2x1ZGVzIiwiY29tYmluZUltcG9ydGFudFBhdGhzSW50b1Byb2plY3Rpb24iLCJfbWF0Y2hpbmdEb2N1bWVudCIsInVuZGVmaW5lZCIsImZhbGxiYWNrIiwicGF0aHNUb1RyZWUiLCJ2YWx1ZVNlbGVjdG9yIiwiJGVxIiwiJGluIiwibWF0Y2hlciIsInBsYWNlaG9sZGVyIiwiZmluZCIsIm9ubHlDb250YWluc0tleXMiLCJsb3dlckJvdW5kIiwiSW5maW5pdHkiLCJ1cHBlckJvdW5kIiwiZm9yRWFjaCIsIm9wIiwiaGFzT3duIiwiY2FsbCIsIm1pZGRsZSIsIngiLCJTb3J0ZXIiLCJfc2VsZWN0b3JGb3JBZmZlY3RlZEJ5TW9kaWZpZXIiLCJkZXRhaWxzIiwicHJvamVjdGlvbkRldGFpbHMiLCJ0cmVlIiwibm9kZSIsImZ1bGxQYXRoIiwibWVyZ2VkUHJvamVjdGlvbiIsInRyZWVUb1BhdGhzIiwiaW5jbHVkaW5nIiwibWVyZ2VkRXhjbFByb2plY3Rpb24iLCJnZXRQYXRocyIsInNlbGVjdG9yIiwiX3BhdGhzIiwib2JqIiwiZXZlcnkiLCJrIiwicHJlZml4Iiwia2V5IiwidmFsdWUiLCJoYXNPd25Qcm9wZXJ0eSIsIk1pbmlNb25nb1F1ZXJ5RXJyb3IiLCJFcnJvciIsIkVMRU1FTlRfT1BFUkFUT1JTIiwiJGx0IiwibWFrZUluZXF1YWxpdHkiLCJjbXBWYWx1ZSIsIiRndCIsIiRsdGUiLCIkZ3RlIiwiJG1vZCIsImNvbXBpbGVFbGVtZW50U2VsZWN0b3IiLCJvcGVyYW5kIiwiQXJyYXkiLCJpc0FycmF5IiwiZGl2aXNvciIsInJlbWFpbmRlciIsImVsZW1lbnRNYXRjaGVycyIsIm9wdGlvbiIsIlJlZ0V4cCIsInJlZ2V4cEVsZW1lbnRNYXRjaGVyIiwiZXF1YWxpdHlFbGVtZW50TWF0Y2hlciIsIiRzaXplIiwiZG9udEV4cGFuZExlYWZBcnJheXMiLCIkdHlwZSIsImRvbnRJbmNsdWRlTGVhZkFycmF5cyIsIm9wZXJhbmRBbGlhc01hcCIsIl9mIiwiX3R5cGUiLCIkYml0c0FsbFNldCIsIm1hc2siLCJnZXRPcGVyYW5kQml0bWFzayIsImJpdG1hc2siLCJnZXRWYWx1ZUJpdG1hc2siLCJieXRlIiwiJGJpdHNBbnlTZXQiLCIkYml0c0FsbENsZWFyIiwiJGJpdHNBbnlDbGVhciIsIiRyZWdleCIsInJlZ2V4cCIsIiRvcHRpb25zIiwidGVzdCIsInNvdXJjZSIsIiRlbGVtTWF0Y2giLCJfaXNQbGFpbk9iamVjdCIsImlzRG9jTWF0Y2hlciIsIkxPR0lDQUxfT1BFUkFUT1JTIiwicmVkdWNlIiwiYSIsImIiLCJzdWJNYXRjaGVyIiwiY29tcGlsZURvY3VtZW50U2VsZWN0b3IiLCJpbkVsZW1NYXRjaCIsImNvbXBpbGVWYWx1ZVNlbGVjdG9yIiwiYXJyYXlFbGVtZW50IiwiYXJnIiwiaXNJbmRleGFibGUiLCJkb250SXRlcmF0ZSIsIiRhbmQiLCJzdWJTZWxlY3RvciIsImFuZERvY3VtZW50TWF0Y2hlcnMiLCJjb21waWxlQXJyYXlPZkRvY3VtZW50U2VsZWN0b3JzIiwiJG9yIiwibWF0Y2hlcnMiLCJkb2MiLCJmbiIsIiRub3IiLCIkd2hlcmUiLCJzZWxlY3RvclZhbHVlIiwiX3JlY29yZFBhdGhVc2VkIiwiX2hhc1doZXJlIiwiRnVuY3Rpb24iLCIkY29tbWVudCIsIlZBTFVFX09QRVJBVE9SUyIsImNvbnZlcnRFbGVtZW50TWF0Y2hlclRvQnJhbmNoZWRNYXRjaGVyIiwiJG5vdCIsImludmVydEJyYW5jaGVkTWF0Y2hlciIsIiRuZSIsIiRuaW4iLCIkZXhpc3RzIiwiZXhpc3RzIiwiZXZlcnl0aGluZ01hdGNoZXIiLCIkbWF4RGlzdGFuY2UiLCIkbmVhciIsIiRhbGwiLCJub3RoaW5nTWF0Y2hlciIsImJyYW5jaGVkTWF0Y2hlcnMiLCJjcml0ZXJpb24iLCJhbmRCcmFuY2hlZE1hdGNoZXJzIiwiaXNSb290IiwiX2hhc0dlb1F1ZXJ5IiwibWF4RGlzdGFuY2UiLCJwb2ludCIsImRpc3RhbmNlIiwiJGdlb21ldHJ5IiwidHlwZSIsIkdlb0pTT04iLCJwb2ludERpc3RhbmNlIiwiY29vcmRpbmF0ZXMiLCJwb2ludFRvQXJyYXkiLCJnZW9tZXRyeVdpdGhpblJhZGl1cyIsImRpc3RhbmNlQ29vcmRpbmF0ZVBhaXJzIiwiYnJhbmNoZWRWYWx1ZXMiLCJleHBhbmRBcnJheXNJbkJyYW5jaGVzIiwiYnJhbmNoIiwiY3VyRGlzdGFuY2UiLCJfaXNVcGRhdGUiLCJhcnJheUluZGljZXMiLCJhbmRTb21lTWF0Y2hlcnMiLCJzdWJNYXRjaGVycyIsImRvY09yQnJhbmNoZXMiLCJtYXRjaCIsInN1YlJlc3VsdCIsInNlbGVjdG9ycyIsImRvY1NlbGVjdG9yIiwib3B0aW9ucyIsImRvY01hdGNoZXJzIiwic3Vic3RyIiwiX2lzU2ltcGxlIiwibG9va1VwQnlJbmRleCIsIm1ha2VMb29rdXBGdW5jdGlvbiIsInZhbHVlTWF0Y2hlciIsIkJvb2xlYW4iLCJvcGVyYXRvckJyYW5jaGVkTWF0Y2hlciIsImVsZW1lbnRNYXRjaGVyIiwiYnJhbmNoZXMiLCJleHBhbmRlZCIsImVsZW1lbnQiLCJtYXRjaGVkIiwicG9pbnRBIiwicG9pbnRCIiwiTWF0aCIsImh5cG90IiwiZWxlbWVudFNlbGVjdG9yIiwiX2VxdWFsIiwiZG9jT3JCcmFuY2hlZFZhbHVlcyIsInNraXBUaGVBcnJheXMiLCJicmFuY2hlc091dCIsInRoaXNJc0FycmF5IiwicHVzaCIsIk51bWJlciIsImlzSW50ZWdlciIsIlVpbnQ4QXJyYXkiLCJJbnQzMkFycmF5IiwiYnVmZmVyIiwiaXNCaW5hcnkiLCJBcnJheUJ1ZmZlciIsIm1heCIsInZpZXciLCJpc1NhZmVJbnRlZ2VyIiwiVWludDMyQXJyYXkiLCJCWVRFU19QRVJfRUxFTUVOVCIsImluc2VydEludG9Eb2N1bWVudCIsImRvY3VtZW50IiwiZXhpc3RpbmdLZXkiLCJpbmRleE9mIiwiYnJhbmNoZWRNYXRjaGVyIiwiYnJhbmNoVmFsdWVzIiwicyIsImluY29uc2lzdGVudE9LIiwidGhlc2VBcmVPcGVyYXRvcnMiLCJzZWxLZXkiLCJ0aGlzSXNPcGVyYXRvciIsIkpTT04iLCJzdHJpbmdpZnkiLCJjbXBWYWx1ZUNvbXBhcmF0b3IiLCJvcGVyYW5kVHlwZSIsIl9jbXAiLCJwYXJ0cyIsImZpcnN0UGFydCIsImxvb2t1cFJlc3QiLCJzbGljZSIsImJ1aWxkUmVzdWx0IiwiZmlyc3RMZXZlbCIsImFwcGVuZFRvUmVzdWx0IiwibW9yZSIsImZvclNvcnQiLCJhcnJheUluZGV4IiwiTWluaW1vbmdvVGVzdCIsIk1pbmltb25nb0Vycm9yIiwibWVzc2FnZSIsImZpZWxkIiwib3BlcmF0b3JNYXRjaGVycyIsIm9wZXJhdG9yIiwic2ltcGxlUmFuZ2UiLCJzaW1wbGVFcXVhbGl0eSIsInNpbXBsZUluY2x1c2lvbiIsIm5ld0xlYWZGbiIsImNvbmZsaWN0Rm4iLCJyb290IiwicGF0aEFycmF5Iiwic3VjY2VzcyIsImxhc3RLZXkiLCJ5IiwicG9wdWxhdGVEb2N1bWVudFdpdGhLZXlWYWx1ZSIsImdldFByb3RvdHlwZU9mIiwicG9wdWxhdGVEb2N1bWVudFdpdGhPYmplY3QiLCJ1bnByZWZpeGVkS2V5cyIsInZhbGlkYXRlT2JqZWN0Iiwib2JqZWN0IiwicG9wdWxhdGVEb2N1bWVudFdpdGhRdWVyeUZpZWxkcyIsInF1ZXJ5IiwiX3NlbGVjdG9ySXNJZCIsImZpZWxkcyIsImZpZWxkc0tleXMiLCJzb3J0IiwiX2lkIiwia2V5UGF0aCIsInJ1bGUiLCJwcm9qZWN0aW9uUnVsZXNUcmVlIiwiY3VycmVudFBhdGgiLCJhbm90aGVyUGF0aCIsInRvU3RyaW5nIiwibGFzdEluZGV4IiwidmFsaWRhdGVLZXlJblBhdGgiLCJnZXRBc3luY01ldGhvZE5hbWUiLCJtZXRob2QiLCJyZXBsYWNlIiwiQVNZTkNfQ09MTEVDVElPTl9NRVRIT0RTIiwiQVNZTkNfQ1VSU09SX01FVEhPRFMiLCJDTElFTlRfT05MWV9NRVRIT0RTIiwiQ3Vyc29yIiwiY291bnQiLCJyZWFjdGl2ZSIsIl9kZXBlbmQiLCJhZGRlZCIsInJlbW92ZWQiLCJfZ2V0UmF3T2JqZWN0cyIsIm9yZGVyZWQiLCJmZXRjaCIsIlN5bWJvbCIsIml0ZXJhdG9yIiwiYWRkZWRCZWZvcmUiLCJjaGFuZ2VkIiwibW92ZWRCZWZvcmUiLCJpbmRleCIsIm9iamVjdHMiLCJuZXh0IiwiX3Byb2plY3Rpb25GbiIsIl90cmFuc2Zvcm0iLCJkb25lIiwiYXN5bmNJdGVyYXRvciIsInN5bmNSZXN1bHQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImNhbGxiYWNrIiwidGhpc0FyZyIsImdldFRyYW5zZm9ybSIsIm9ic2VydmUiLCJfb2JzZXJ2ZUZyb21PYnNlcnZlQ2hhbmdlcyIsIm9ic2VydmVBc3luYyIsIm9ic2VydmVDaGFuZ2VzIiwiX29ic2VydmVDaGFuZ2VzQ2FsbGJhY2tzQXJlT3JkZXJlZCIsIl9hbGxvd191bm9yZGVyZWQiLCJza2lwIiwibGltaXQiLCJkaXN0YW5jZXMiLCJoYXNHZW9RdWVyeSIsIl9JZE1hcCIsImN1cnNvciIsImRpcnR5IiwicHJvamVjdGlvbkZuIiwicmVzdWx0c1NuYXBzaG90Iiwic29ydGVyIiwicWlkIiwiY29sbGVjdGlvbiIsIm5leHRfcWlkIiwicXVlcmllcyIsInJlc3VsdHMiLCJwYXVzZWQiLCJ3cmFwQ2FsbGJhY2siLCJzZWxmIiwiYXJncyIsImFyZ3VtZW50cyIsIl9vYnNlcnZlUXVldWUiLCJxdWV1ZVRhc2siLCJhcHBseSIsIl9zdXBwcmVzc19pbml0aWFsIiwiaGFuZGxlciIsInNpemUiLCJoYW5kbGUiLCJPYnNlcnZlSGFuZGxlIiwic3RvcCIsImlzUmVhZHkiLCJpc1JlYWR5UHJvbWlzZSIsIlRyYWNrZXIiLCJhY3RpdmUiLCJvbkludmFsaWRhdGUiLCJkcmFpblJlc3VsdCIsImRyYWluIiwidGhlbiIsIm9ic2VydmVDaGFuZ2VzQXN5bmMiLCJjaGFuZ2VycyIsImRlcGVuZGVuY3kiLCJEZXBlbmRlbmN5Iiwibm90aWZ5IiwiYmluZCIsImRlcGVuZCIsIl9nZXRDb2xsZWN0aW9uTmFtZSIsImFwcGx5U2tpcExpbWl0IiwiX3NlbGVjdG9ySWQiLCJzZWxlY3RlZERvYyIsIl9kb2NzIiwiZ2V0Iiwic2V0IiwiY2xlYXIiLCJNZXRlb3IiLCJfcnVuRnJlc2giLCJpZCIsIm1hdGNoUmVzdWx0IiwiZ2V0Q29tcGFyYXRvciIsIl9wdWJsaXNoQ3Vyc29yIiwic3Vic2NyaXB0aW9uIiwiUGFja2FnZSIsIm1vbmdvIiwiTW9uZ28iLCJDb2xsZWN0aW9uIiwiX3NlbGVjdG9ySXNJZFBlcmhhcHNBc09iamVjdCIsIl9jb21waWxlUHJvamVjdGlvbiIsIndyYXBUcmFuc2Zvcm0iLCJ0cmFuc2Zvcm0iLCJhc3luY05hbWUiLCJyZWplY3QiLCJjb3VudERvY3VtZW50cyIsImNvdW50QXN5bmMiLCJlc3RpbWF0ZWREb2N1bWVudENvdW50IiwiZmluZE9uZSIsImZpbmRPbmVBc3luYyIsImZldGNoQXN5bmMiLCJwcmVwYXJlSW5zZXJ0IiwiYXNzZXJ0SGFzVmFsaWRGaWVsZE5hbWVzIiwiX3VzZU9JRCIsIk1vbmdvSUQiLCJPYmplY3RJRCIsIlJhbmRvbSIsImhhcyIsIl9zYXZlT3JpZ2luYWwiLCJpbnNlcnQiLCJxdWVyaWVzVG9SZWNvbXB1dGUiLCJfaW5zZXJ0SW5SZXN1bHRzU3luYyIsIl9yZWNvbXB1dGVSZXN1bHRzIiwiZGVmZXIiLCJpbnNlcnRBc3luYyIsIl9pbnNlcnRJblJlc3VsdHNBc3luYyIsInBhdXNlT2JzZXJ2ZXJzIiwiY2xlYXJSZXN1bHRRdWVyaWVzIiwicHJlcGFyZVJlbW92ZSIsInJlbW92ZSIsIl9lYWNoUG9zc2libHlNYXRjaGluZ0RvY1N5bmMiLCJxdWVyeVJlbW92ZSIsInJlbW92ZUlkIiwicmVtb3ZlRG9jIiwiX3NhdmVkT3JpZ2luYWxzIiwiZXF1YWxzIiwiX3JlbW92ZUZyb21SZXN1bHRzU3luYyIsInJlbW92ZUFzeW5jIiwiX3JlbW92ZUZyb21SZXN1bHRzQXN5bmMiLCJfcmVzdW1lT2JzZXJ2ZXJzIiwiX2RpZmZRdWVyeUNoYW5nZXMiLCJyZXN1bWVPYnNlcnZlcnNTZXJ2ZXIiLCJyZXN1bWVPYnNlcnZlcnNDbGllbnQiLCJyZXRyaWV2ZU9yaWdpbmFscyIsIm9yaWdpbmFscyIsInNhdmVPcmlnaW5hbHMiLCJwcmVwYXJlVXBkYXRlIiwicWlkVG9PcmlnaW5hbFJlc3VsdHMiLCJkb2NNYXAiLCJpZHNNYXRjaGVkIiwiX2lkc01hdGNoZWRCeVNlbGVjdG9yIiwibWVtb2l6ZWRDbG9uZUlmTmVlZGVkIiwiZG9jVG9NZW1vaXplIiwiZmluaXNoVXBkYXRlIiwidXBkYXRlQ291bnQiLCJpbnNlcnRlZElkIiwiX3JldHVybk9iamVjdCIsIm51bWJlckFmZmVjdGVkIiwidXBkYXRlQXN5bmMiLCJyZWNvbXB1dGVRaWRzIiwiX2VhY2hQb3NzaWJseU1hdGNoaW5nRG9jQXN5bmMiLCJxdWVyeVJlc3VsdCIsIl9tb2RpZnlBbmROb3RpZnlBc3luYyIsIm11bHRpIiwidXBzZXJ0IiwiX2NyZWF0ZVVwc2VydERvY3VtZW50IiwidXBkYXRlIiwiX21vZGlmeUFuZE5vdGlmeVN5bmMiLCJ1cHNlcnRBc3luYyIsInNwZWNpZmljSWRzIiwiZm9yRWFjaEFzeW5jIiwiX2dldE1hdGNoZWREb2NBbmRNb2RpZnkiLCJtYXRjaGVkX2JlZm9yZSIsIm9sZF9kb2MiLCJhZnRlck1hdGNoIiwiYWZ0ZXIiLCJiZWZvcmUiLCJfdXBkYXRlSW5SZXN1bHRzU3luYyIsIl91cGRhdGVJblJlc3VsdHNBc3luYyIsIm9sZFJlc3VsdHMiLCJpc0NsaWVudCIsIl9TeW5jaHJvbm91c1F1ZXVlIiwiX0FzeW5jaHJvbm91c1F1ZXVlIiwiY3JlYXRlIiwiX0NhY2hpbmdDaGFuZ2VPYnNlcnZlciIsIm9yZGVyZWRGcm9tQ2FsbGJhY2tzIiwiY2FsbGJhY2tzIiwiZG9jcyIsIk9yZGVyZWREaWN0IiwiaWRTdHJpbmdpZnkiLCJhcHBseUNoYW5nZSIsInB1dEJlZm9yZSIsIm1vdmVCZWZvcmUiLCJEaWZmU2VxdWVuY2UiLCJhcHBseUNoYW5nZXMiLCJJZE1hcCIsImlkUGFyc2UiLCJfX3dyYXBwZWRUcmFuc2Zvcm1fXyIsIndyYXBwZWQiLCJ0cmFuc2Zvcm1lZCIsIm5vbnJlYWN0aXZlIiwiX2JpbmFyeVNlYXJjaCIsImNtcCIsImFycmF5IiwiZmlyc3QiLCJyYW5nZSIsImhhbGZSYW5nZSIsImZsb29yIiwiX2NoZWNrU3VwcG9ydGVkUHJvamVjdGlvbiIsIl9pZFByb2plY3Rpb24iLCJydWxlVHJlZSIsInN1YmRvYyIsInNlbGVjdG9yRG9jdW1lbnQiLCJpc01vZGlmeSIsIl9pc01vZGlmaWNhdGlvbk1vZCIsIm5ld0RvYyIsImlzSW5zZXJ0IiwicmVwbGFjZW1lbnQiLCJfZGlmZk9iamVjdHMiLCJsZWZ0IiwicmlnaHQiLCJkaWZmT2JqZWN0cyIsIm5ld1Jlc3VsdHMiLCJvYnNlcnZlciIsImRpZmZRdWVyeUNoYW5nZXMiLCJfZGlmZlF1ZXJ5T3JkZXJlZENoYW5nZXMiLCJkaWZmUXVlcnlPcmRlcmVkQ2hhbmdlcyIsIl9kaWZmUXVlcnlVbm9yZGVyZWRDaGFuZ2VzIiwiZGlmZlF1ZXJ5VW5vcmRlcmVkQ2hhbmdlcyIsIl9maW5kSW5PcmRlcmVkUmVzdWx0cyIsInN1YklkcyIsIl9pbnNlcnRJblNvcnRlZExpc3QiLCJzcGxpY2UiLCJpc1JlcGxhY2UiLCJpc01vZGlmaWVyIiwic2V0T25JbnNlcnQiLCJtb2RGdW5jIiwiTU9ESUZJRVJTIiwia2V5cGF0aCIsImtleXBhcnRzIiwidGFyZ2V0IiwiZmluZE1vZFRhcmdldCIsImZvcmJpZEFycmF5Iiwibm9DcmVhdGUiLCJOT19DUkVBVEVfTU9ESUZJRVJTIiwicG9wIiwib2JzZXJ2ZUNhbGxiYWNrcyIsInN1cHByZXNzZWQiLCJvYnNlcnZlQ2hhbmdlc0NhbGxiYWNrcyIsIl9vYnNlcnZlQ2FsbGJhY2tzQXJlT3JkZXJlZCIsImluZGljZXMiLCJfbm9faW5kaWNlcyIsImNoZWNrIiwiYWRkZWRBdCIsImNoYW5nZWRBdCIsIm9sZERvYyIsIm1vdmVkVG8iLCJmcm9tIiwidG8iLCJyZW1vdmVkQXQiLCJjaGFuZ2VPYnNlcnZlciIsIl9mcm9tT2JzZXJ2ZSIsIm5vbk11dGF0aW5nQ2FsbGJhY2tzIiwic2V0U3VwcHJlc3NlZCIsImgiLCJfaXNQcm9taXNlIiwiY2hhbmdlZEZpZWxkcyIsIm1ha2VDaGFuZ2VkRmllbGRzIiwib2xkX2lkeCIsIm5ld19pZHgiLCIkY3VycmVudERhdGUiLCJEYXRlIiwiJGluYyIsIiRtaW4iLCIkbWF4IiwiJG11bCIsIiRyZW5hbWUiLCJ0YXJnZXQyIiwiJHNldE9uSW5zZXJ0IiwiJHB1c2giLCIkZWFjaCIsInRvUHVzaCIsInBvc2l0aW9uIiwiJHBvc2l0aW9uIiwiJHNsaWNlIiwic29ydEZ1bmN0aW9uIiwiJHNvcnQiLCJzcGxpY2VBcmd1bWVudHMiLCIkcHVzaEFsbCIsIiRhZGRUb1NldCIsImlzRWFjaCIsInZhbHVlcyIsInRvQWRkIiwiJHBvcCIsInRvUG9wIiwiJHB1bGwiLCJ0b1B1bGwiLCJvdXQiLCIkcHVsbEFsbCIsIiRiaXQiLCIkdiIsImludmFsaWRDaGFyTXNnIiwiJCIsImFzc2VydElzVmFsaWRGaWVsZE5hbWUiLCJ1c2VkQXJyYXlJbmRleCIsImxhc3QiLCJrZXlwYXJ0IiwicGFyc2VJbnQiLCJEZWNpbWFsIiwiRGVjaW1hbFN0dWIiLCJfZG9jTWF0Y2hlciIsImhhc1doZXJlIiwiX2NvbXBpbGVTZWxlY3RvciIsImlzVXBkYXRlIiwidiIsImtleU9yZGVyU2Vuc2l0aXZlIiwiX3R5cGVvcmRlciIsInQiLCJ0YSIsInRiIiwib2EiLCJvYiIsInRvSGV4U3RyaW5nIiwiaXNOYU4iLCJnZXRUaW1lIiwibWludXMiLCJ0b051bWJlciIsInRvQXJyYXkiLCJMb2NhbENvbGxlY3Rpb25fIiwiX3NvcnRTcGVjUGFydHMiLCJfZ2V0QmFzZUNvbXBhcmF0b3IiLCJfY29tcGFyZUtleXMiLCJrZXkxIiwia2V5MiIsIl9rZXlDb21wYXJhdG9yIiwiX2dlbmVyYXRlS2V5c0Zyb21Eb2MiLCJjYiIsInBhdGhGcm9tSW5kaWNlcyIsImtub3duUGF0aHMiLCJ2YWx1ZXNCeUluZGV4QW5kUGF0aCIsInNwZWMiLCJsb29rdXAiLCJ1c2VkUGF0aHMiLCJzb2xlS2V5IiwiX3NvcnRGdW5jdGlvbiIsImRvYzEiLCJkb2MyIiwiX2dldE1pbktleUZyb21Eb2MiLCJtaW5LZXkiLCJfa2V5RmllbGRDb21wYXJhdG9yIiwiaW52ZXJ0IiwiYXNjZW5kaW5nIiwiY29tcGFyZSIsImFkZFNwZWNQYXJ0IiwiY2hhckF0IiwiY29tcG9zZUNvbXBhcmF0b3JzIiwiY29tcGFyYXRvckFycmF5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxPQUFPLHdCQUF3QjtBQU9WO0FBRXJCQSxVQUFVQyx3QkFBd0IsR0FBR0MsU0FBU0EsTUFBTUMsR0FBRyxDQUFDQyxRQUN0REEsS0FBS0MsS0FBSyxDQUFDLEtBQUtDLE1BQU0sQ0FBQ0MsUUFBUSxDQUFDQyxhQUFhRCxPQUFPRSxJQUFJLENBQUM7QUFHM0QsOEVBQThFO0FBQzlFLHVDQUF1QztBQUN2Qyw4Q0FBOEM7QUFDOUMsVUFBVTtBQUNWLHlCQUF5QjtBQUN6QixxQkFBcUI7QUFDckIsWUFBWTtBQUNaLGtCQUFrQjtBQUNsQlQsVUFBVVUsT0FBTyxDQUFDQyxTQUFTLENBQUNDLGtCQUFrQixHQUFHLFNBQVNDLFFBQVE7SUFDaEUsMkNBQTJDO0lBQzNDQSxXQUFXQyxPQUFPQyxNQUFNLENBQUM7UUFBQ0MsTUFBTSxDQUFDO1FBQUdDLFFBQVEsQ0FBQztJQUFDLEdBQUdKO0lBRWpELE1BQU1LLGtCQUFrQixJQUFJLENBQUNDLFNBQVM7SUFDdEMsTUFBTUMsZ0JBQWdCLEVBQUUsQ0FBQ0MsTUFBTSxDQUM3QlAsT0FBT1EsSUFBSSxDQUFDVCxTQUFTRyxJQUFJLEdBQ3pCRixPQUFP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LE1BQU0sRUFBRSxFQUFFRixFQUFHO1lBQy9DLE1BQU02bkIsVUFBVUksZUFBZSxDQUFDam9CLEVBQUUsQ0FBQ21ILEdBQUdDO1lBQ3RDLElBQUl5Z0IsWUFBWSxHQUFHO2dCQUNqQixPQUFPQTtZQUNUO1FBQ0Y7UUFFQSxPQUFPO0lBQ1Q7QUFDRiIsImZpbGUiOiIvcGFja2FnZXMvbWluaW1vbmdvLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICcuL21pbmltb25nb19jb21tb24uanMnO1xuaW1wb3J0IHtcbiAgaGFzT3duLFxuICBpc051bWVyaWNLZXksXG4gIGlzT3BlcmF0b3JPYmplY3QsXG4gIHBhdGhzVG9UcmVlLFxuICBwcm9qZWN0aW9uRGV0YWlscyxcbn0gZnJvbSAnLi9jb21tb24uanMnO1xuXG5NaW5pbW9uZ28uX3BhdGhzRWxpZGluZ051bWVyaWNLZXlzID0gcGF0aHMgPT4gcGF0aHMubWFwKHBhdGggPT5cbiAgcGF0aC5zcGxpdCgnLicpLmZpbHRlcihwYXJ0ID0+ICFpc051bWVyaWNLZXkocGFydCkpLmpvaW4oJy4nKVxuKTtcblxuLy8gUmV0dXJucyB0cnVlIGlmIHRoZSBtb2RpZmllciBhcHBsaWVkIHRvIHNvbWUgZG9jdW1lbnQgbWF5IGNoYW5nZSB0aGUgcmVzdWx0XG4vLyBvZiBtYXRjaGluZyB0aGUgZG9jdW1lbnQgYnkgc2VsZWN0b3Jcbi8vIFRoZSBtb2RpZmllciBpcyBhbHdheXMgaW4gYSBmb3JtIG9mIE9iamVjdDpcbi8vICAtICRzZXRcbi8vICAgIC0gJ2EuYi4yMi56JzogdmFsdWVcbi8vICAgIC0gJ2Zvby5iYXInOiA0MlxuLy8gIC0gJHVuc2V0XG4vLyAgICAtICdhYmMuZCc6IDFcbk1pbmltb25nby5NYXRjaGVyLnByb3RvdHlwZS5hZmZlY3RlZEJ5TW9kaWZpZXIgPSBmdW5jdGlvbihtb2RpZmllcikge1xuICAvLyBzYWZlIGNoZWNrIGZvciAkc2V0LyR1bnNldCBiZWluZyBvYmplY3RzXG4gIG1vZGlmaWVyID0gT2JqZWN0LmFzc2lnbih7JHNldDoge30sICR1bnNldDoge319LCBtb2RpZmllcik7XG5cbiAgY29uc3QgbWVhbmluZ2Z1bFBhdGhzID0gdGhpcy5fZ2V0UGF0aHMoKTtcbiAgY29uc3QgbW9kaWZpZWRQYXRocyA9IFtdLmNvbmNhdChcbiAgICBPYmplY3Qua2V5cyhtb2RpZmllci4kc2V0KSxcbiAgICBPYmplY3Qua2V5cyhtb2RpZmllci4kdW5zZXQpXG4gICk7XG5cbiAgcmV0dXJuIG1vZGlmaWVkUGF0aHMuc29tZShwYXRoID0+IHtcbiAgICBjb25zdCBtb2QgPSBwYXRoLnNwbGl0KCcuJyk7XG5cbiAgICByZXR1cm4gbWVhbmluZ2Z1bFBhdGhzLnNvbWUobWVhbmluZ2Z1bFBhdGggPT4ge1xuICAgICAgY29uc3Qgc2VsID0gbWVhbmluZ2Z1bFBhdGguc3BsaXQoJy4nKTtcblxuICAgICAgbGV0IGkgPSAwLCBqID0gMDtcblxuICAgICAgd2hpbGUgKGkgPCBzZWwubGVuZ3RoICYmIGogPCBtb2QubGVuZ3RoKSB7XG4gICAgICAgIGlmIChpc051bWVyaWNLZXkoc2VsW2ldKSAmJiBpc051bWVyaWNLZXkobW9kW2pdKSkge1xuICAgICAgICAgIC8vIGZvby40LmJhciBzZWxlY3RvciBhZmZlY3RlZCBieSBmb28uNCBtb2RpZmllclxuICAgICAgICAgIC8vIGZvby4zLmJhciBzZWxlY3RvciB1bmFmZmVjdGVkIGJ5IGZvby40IG1vZGlmaWVyXG4gICAgICAgICAgaWYgKHNlbFtpXSA9PT0gbW9kW2pdKSB7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBqKys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoaXNOdW1lcmljS2V5KHNlbFtpXSkpIHtcbiAgICAgICAgICAvLyBmb28uNC5iYXIgc2VsZWN0b3IgdW5hZmZlY3RlZCBieSBmb28uYmFyIG1vZGlmaWVyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKGlzTnVtZXJpY0tleShtb2Rbal0pKSB7XG4gICAgICAgICAgaisrO1xuICAgICAgICB9IGVsc2UgaWYgKHNlbFtpXSA9PT0gbW9kW2pdKSB7XG4gICAgICAgICAgaSsrO1xuICAgICAgICAgIGorKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gT25lIGlzIGEgcHJlZml4IG9mIGFub3RoZXIsIHRha2luZyBudW1lcmljIGZpZWxkcyBpbnRvIGFjY291bnRcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbi8vIEBwYXJhbSBtb2RpZmllciAtIE9iamVjdDogTW9uZ29EQi1zdHlsZWQgbW9kaWZpZXIgd2l0aCBgJHNldGBzIGFuZCBgJHVuc2V0c2Bcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgb25seS4gKGFzc3VtZWQgdG8gY29tZSBmcm9tIG9wbG9nKVxuLy8gQHJldHVybnMgLSBCb29sZWFuOiBpZiBhZnRlciBhcHBseWluZyB0aGUgbW9kaWZpZXIsIHNlbGVjdG9yIGNhbiBzdGFydFxuLy8gICAgICAgICAgICAgICAgICAgICBhY2NlcHRpbmcgdGhlIG1vZGlmaWVkIHZhbHVlLlxuLy8gTk9URTogYXNzdW1lcyB0aGF0IGRvY3VtZW50IGFmZmVjdGVkIGJ5IG1vZGlmaWVyIGRpZG4ndCBtYXRjaCB0aGlzIE1hdGNoZXJcbi8vIGJlZm9yZSwgc28gaWYgbW9kaWZpZXIgY2FuJ3QgY29udmluY2Ugc2VsZWN0b3IgaW4gYSBwb3NpdGl2ZSBjaGFuZ2UgaXQgd291bGRcbi8vIHN0YXkgJ2ZhbHNlJy5cbi8vIEN1cnJlbnRseSBkb2Vzbid0IHN1cHBvcnQgJC1vcGVyYXRvcnMgYW5kIG51bWVyaWMgaW5kaWNlcyBwcmVjaXNlbHkuXG5NaW5pbW9uZ28uTWF0Y2hlci5wcm90b3R5cGUuY2FuQmVjb21lVHJ1ZUJ5TW9kaWZpZXIgPSBmdW5jdGlvbihtb2RpZmllcikge1xuICBpZiAoIXRoaXMuYWZmZWN0ZWRCeU1vZGlmaWVyKG1vZGlmaWVyKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICghdGhpcy5pc1NpbXBsZSgpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBtb2RpZmllciA9IE9iamVjdC5hc3NpZ24oeyRzZXQ6IHt9LCAkdW5zZXQ6IHt9fSwgbW9kaWZpZXIpO1xuXG4gIGNvbnN0IG1vZGlmaWVyUGF0aHMgPSBbXS5jb25jYXQoXG4gICAgT2JqZWN0LmtleXMobW9kaWZpZXIuJHNldCksXG4gICAgT2JqZWN0LmtleXMobW9kaWZpZXIuJHVuc2V0KVxuICApO1xuXG4gIGlmICh0aGlzLl9nZXRQYXRocygpLnNvbWUocGF0aEhhc051bWVyaWNLZXlzKSB8fFxuICAgICAgbW9kaWZpZXJQYXRocy5zb21lKHBhdGhIYXNOdW1lcmljS2V5cykpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIGNoZWNrIGlmIHRoZXJlIGlzIGEgJHNldCBvciAkdW5zZXQgdGhhdCBpbmRpY2F0ZXMgc29tZXRoaW5nIGlzIGFuXG4gIC8vIG9iamVjdCByYXRoZXIgdGhhbiBhIHNjYWxhciBpbiB0aGUgYWN0dWFsIG9iamVjdCB3aGVyZSB3ZSBzYXcgJC1vcGVyYXRvclxuICAvLyBOT1RFOiBpdCBpcyBjb3JyZWN0IHNpbmNlIHdlIGFsbG93IG9ubHkgc2NhbGFycyBpbiAkLW9wZXJhdG9yc1xuICAvLyBFeGFtcGxlOiBmb3Igc2VsZWN0b3IgeydhLmInOiB7JGd0OiA1fX0gdGhlIG1vZGlmaWVyIHsnYS5iLmMnOjd9IHdvdWxkXG4gIC8vIGRlZmluaXRlbHkgc2V0IHRoZSByZXN1bHQgdG8gZmFsc2UgYXMgJ2EuYicgYXBwZWFycyB0byBiZSBhbiBvYmplY3QuXG4gIGNvbnN0IGV4cGVjdGVkU2NhbGFySXNPYmplY3QgPSBPYmplY3Qua2V5cyh0aGlzLl9zZWxlY3Rvcikuc29tZShwYXRoID0+IHtcbiAgICBpZiAoIWlzT3BlcmF0b3JPYmplY3QodGhpcy5fc2VsZWN0b3JbcGF0aF0pKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZGlmaWVyUGF0aHMuc29tZShtb2RpZmllclBhdGggPT5cbiAgICAgIG1vZGlmaWVyUGF0aC5zdGFydHNXaXRoKGAke3BhdGh9LmApXG4gICAgKTtcbiAgfSk7XG5cbiAgaWYgKGV4cGVjdGVkU2NhbGFySXNPYmplY3QpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBTZWUgaWYgd2UgY2FuIGFwcGx5IHRoZSBtb2RpZmllciBvbiB0aGUgaWRlYWxseSBtYXRjaGluZyBvYmplY3QuIElmIGl0XG4gIC8vIHN0aWxsIG1hdGNoZXMgdGhlIHNlbGVjdG9yLCB0aGVuIHRoZSBtb2RpZmllciBjb3VsZCBoYXZlIHR1cm5lZCB0aGUgcmVhbFxuICAvLyBvYmplY3QgaW4gdGhlIGRhdGFiYXNlIGludG8gc29tZXRoaW5nIG1hdGNoaW5nLlxuICBjb25zdCBtYXRjaGluZ0RvY3VtZW50ID0gRUpTT04uY2xvbmUodGhpcy5tYXRjaGluZ0RvY3VtZW50KCkpO1xuXG4gIC8vIFRoZSBzZWxlY3RvciBpcyB0b28gY29tcGxleCwgYW55dGhpbmcgY2FuIGhhcHBlbi5cbiAgaWYgKG1hdGNoaW5nRG9jdW1lbnQgPT09IG51bGwpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgTG9jYWxDb2xsZWN0aW9uLl9tb2RpZnkobWF0Y2hpbmdEb2N1bWVudCwgbW9kaWZpZXIpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIC8vIENvdWxkbid0IHNldCBhIHByb3BlcnR5IG9uIGEgZmllbGQgd2hpY2ggaXMgYSBzY2FsYXIgb3IgbnVsbCBpbiB0aGVcbiAgICAvLyBzZWxlY3Rvci5cbiAgICAvLyBFeGFtcGxlOlxuICAgIC8vIHJlYWwgZG9jdW1lbnQ6IHsgJ2EuYic6IDMgfVxuICAgIC8vIHNlbGVjdG9yOiB7ICdhJzogMTIgfVxuICAgIC8vIGNvbnZlcnRlZCBzZWxlY3RvciAoaWRlYWwgZG9jdW1lbnQpOiB7ICdhJzogMTIgfVxuICAgIC8vIG1vZGlmaWVyOiB7ICRzZXQ6IHsgJ2EuYic6IDQgfSB9XG4gICAgLy8gV2UgZG9uJ3Qga25vdyB3aGF0IHJlYWwgZG9jdW1lbnQgd2FzIGxpa2UgYnV0IGZyb20gdGhlIGVycm9yIHJhaXNlZCBieVxuICAgIC8vICRzZXQgb24gYSBzY2FsYXIgZmllbGQgd2UgY2FuIHJlYXNvbiB0aGF0IHRoZSBzdHJ1Y3R1cmUgb2YgcmVhbCBkb2N1bWVudFxuICAgIC8vIGlzIGNvbXBsZXRlbHkgZGlmZmVyZW50LlxuICAgIGlmIChlcnJvci5uYW1lID09PSAnTWluaW1vbmdvRXJyb3InICYmIGVycm9yLnNldFByb3BlcnR5RXJyb3IpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuXG4gIHJldHVybiB0aGlzLmRvY3VtZW50TWF0Y2hlcyhtYXRjaGluZ0RvY3VtZW50KS5yZXN1bHQ7XG59O1xuXG4vLyBLbm93cyBob3cgdG8gY29tYmluZSBhIG1vbmdvIHNlbGVjdG9yIGFuZCBhIGZpZWxkcyBwcm9qZWN0aW9uIHRvIGEgbmV3IGZpZWxkc1xuLy8gcHJvamVjdGlvbiB0YWtpbmcgaW50byBhY2NvdW50IGFjdGl2ZSBmaWVsZHMgZnJvbSB0aGUgcGFzc2VkIHNlbGVjdG9yLlxuLy8gQHJldHVybnMgT2JqZWN0IC0gcHJvamVjdGlvbiBvYmplY3QgKHNhbWUgYXMgZmllbGRzIG9wdGlvbiBvZiBtb25nbyBjdXJzb3IpXG5NaW5pbW9uZ28uTWF0Y2hlci5wcm90b3R5cGUuY29tYmluZUludG9Qcm9qZWN0aW9uID0gZnVuY3Rpb24ocHJvamVjdGlvbikge1xuICBjb25zdCBzZWxlY3RvclBhdGhzID0gTWluaW1vbmdvLl9wYXRoc0VsaWRpbmdOdW1lcmljS2V5cyh0aGlzLl9nZXRQYXRocygpKTtcblxuICAvLyBTcGVjaWFsIGNhc2UgZm9yICR3aGVyZSBvcGVyYXRvciBpbiB0aGUgc2VsZWN0b3IgLSBwcm9qZWN0aW9uIHNob3VsZCBkZXBlbmRcbiAgLy8gb24gYWxsIGZpZWxkcyBvZiB0aGUgZG9jdW1lbnQuIGdldFNlbGVjdG9yUGF0aHMgcmV0dXJucyBhIGxpc3Qgb2YgcGF0aHNcbiAgLy8gc2VsZWN0b3IgZGVwZW5kcyBvbi4gSWYgb25lIG9mIHRoZSBwYXRocyBpcyAnJyAoZW1wdHkgc3RyaW5nKSByZXByZXNlbnRpbmdcbiAgLy8gdGhlIHJvb3Qgb3IgdGhlIHdob2xlIGRvY3VtZW50LCBjb21wbGV0ZSBwcm9qZWN0aW9uIHNob3VsZCBiZSByZXR1cm5lZC5cbiAgaWYgKHNlbGVjdG9yUGF0aHMuaW5jbHVkZXMoJycpKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgcmV0dXJuIGNvbWJpbmVJbXBvcnRhbnRQYXRoc0ludG9Qcm9qZWN0aW9uKHNlbGVjdG9yUGF0aHMsIHByb2plY3Rpb24pO1xufTtcblxuLy8gUmV0dXJucyBhbiBvYmplY3QgdGhhdCB3b3VsZCBtYXRjaCB0aGUgc2VsZWN0b3IgaWYgcG9zc2libGUgb3IgbnVsbCBpZiB0aGVcbi8vIHNlbGVjdG9yIGlzIHRvbyBjb21wbGV4IGZvciB1cyB0byBhbmFseXplXG4vLyB7ICdhLmInOiB7IGFuczogNDIgfSwgJ2Zvby5iYXInOiBudWxsLCAnZm9vLmJheic6IFwic29tZXRoaW5nXCIgfVxuLy8gPT4geyBhOiB7IGI6IHsgYW5zOiA0MiB9IH0sIGZvbzogeyBiYXI6IG51bGwsIGJhejogXCJzb21ldGhpbmdcIiB9IH1cbk1pbmltb25nby5NYXRjaGVyLnByb3RvdHlwZS5tYXRjaGluZ0RvY3VtZW50ID0gZnVuY3Rpb24oKSB7XG4gIC8vIGNoZWNrIGlmIGl0IHdhcyBjb21wdXRlZCBiZWZvcmVcbiAgaWYgKHRoaXMuX21hdGNoaW5nRG9jdW1lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB0aGlzLl9tYXRjaGluZ0RvY3VtZW50O1xuICB9XG5cbiAgLy8gSWYgdGhlIGFuYWx5c2lzIG9mIHRoaXMgc2VsZWN0b3IgaXMgdG9vIGhhcmQgZm9yIG91ciBpbXBsZW1lbnRhdGlvblxuICAvLyBmYWxsYmFjayB0byBcIllFU1wiXG4gIGxldCBmYWxsYmFjayA9IGZhbHNlO1xuXG4gIHRoaXMuX21hdGNoaW5nRG9jdW1lbnQgPSBwYXRoc1RvVHJlZShcbiAgICB0aGlzLl9nZXRQYXRocygpLFxuICAgIHBhdGggPT4ge1xuICAgICAgY29uc3QgdmFsdWVTZWxlY3RvciA9IHRoaXMuX3NlbGVjdG9yW3BhdGhdO1xuXG4gICAgICBpZiAoaXNPcGVyYXRvck9iamVjdCh2YWx1ZVNlbGVjdG9yKSkge1xuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHN0cmljdCBlcXVhbGl0eSwgdGhlcmUgaXMgYSBnb29kXG4gICAgICAgIC8vIGNoYW5jZSB3ZSBjYW4gdXNlIG9uZSBvZiB0aG9zZSBhcyBcIm1hdGNoaW5nXCJcbiAgICAgICAgLy8gZHVtbXkgdmFsdWVcbiAgICAgICAgaWYgKHZhbHVlU2VsZWN0b3IuJGVxKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlU2VsZWN0b3IuJGVxO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlU2VsZWN0b3IuJGluKSB7XG4gICAgICAgICAgY29uc3QgbWF0Y2hlciA9IG5ldyBNaW5pbW9uZ28uTWF0Y2hlcih7cGxhY2Vob2xkZXI6IHZhbHVlU2VsZWN0b3J9KTtcblxuICAgICAgICAgIC8vIFJldHVybiBhbnl0aGluZyBmcm9tICRpbiB0aGF0IG1hdGNoZXMgdGhlIHdob2xlIHNlbGVjdG9yIGZvciB0aGlzXG4gICAgICAgICAgLy8gcGF0aC4gSWYgbm90aGluZyBtYXRjaGVzLCByZXR1cm5zIGB1bmRlZmluZWRgIGFzIG5vdGhpbmcgY2FuIG1ha2VcbiAgICAgICAgICAvLyB0aGlzIHNlbGVjdG9yIGludG8gYHRydWVgLlxuICAgICAgICAgIHJldHVybiB2YWx1ZVNlbGVjdG9yLiRpbi5maW5kKHBsYWNlaG9sZGVyID0+XG4gICAgICAgICAgICBtYXRjaGVyLmRvY3VtZW50TWF0Y2hlcyh7cGxhY2Vob2xkZXJ9KS5yZXN1bHRcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9ubHlDb250YWluc0tleXModmFsdWVTZWxlY3RvciwgWyckZ3QnLCAnJGd0ZScsICckbHQnLCAnJGx0ZSddKSkge1xuICAgICAgICAgIGxldCBsb3dlckJvdW5kID0gLUluZmluaXR5O1xuICAgICAgICAgIGxldCB1cHBlckJvdW5kID0gSW5maW5pdHk7XG5cbiAgICAgICAgICBbJyRsdGUnLCAnJGx0J10uZm9yRWFjaChvcCA9PiB7XG4gICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwodmFsdWVTZWxlY3Rvciwgb3ApICYmXG4gICAgICAgICAgICAgICAgdmFsdWVTZWxlY3RvcltvcF0gPCB1cHBlckJvdW5kKSB7XG4gICAgICAgICAgICAgIHVwcGVyQm91bmQgPSB2YWx1ZVNlbGVjdG9yW29wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIFsnJGd0ZScsICckZ3QnXS5mb3JFYWNoKG9wID0+IHtcbiAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbCh2YWx1ZVNlbGVjdG9yLCBvcCkgJiZcbiAgICAgICAgICAgICAgICB2YWx1ZVNlbGVjdG9yW29wXSA+IGxvd2VyQm91bmQpIHtcbiAgICAgICAgICAgICAgbG93ZXJCb3VuZCA9IHZhbHVlU2VsZWN0b3Jbb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgY29uc3QgbWlkZGxlID0gKGxvd2VyQm91bmQgKyB1cHBlckJvdW5kKSAvIDI7XG4gICAgICAgICAgY29uc3QgbWF0Y2hlciA9IG5ldyBNaW5pbW9uZ28uTWF0Y2hlcih7cGxhY2Vob2xkZXI6IHZhbHVlU2VsZWN0b3J9KTtcblxuICAgICAgICAgIGlmICghbWF0Y2hlci5kb2N1bWVudE1hdGNoZXMoe3BsYWNlaG9sZGVyOiBtaWRkbGV9KS5yZXN1bHQgJiZcbiAgICAgICAgICAgICAgKG1pZGRsZSA9PT0gbG93ZXJCb3VuZCB8fCBtaWRkbGUgPT09IHVwcGVyQm91bmQpKSB7XG4gICAgICAgICAgICBmYWxsYmFjayA9IHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIG1pZGRsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvbmx5Q29udGFpbnNLZXlzKHZhbHVlU2VsZWN0b3IsIFsnJG5pbicsICckbmUnXSkpIHtcbiAgICAgICAgICAvLyBTaW5jZSB0aGlzLl9pc1NpbXBsZSBtYWtlcyBzdXJlICRuaW4gYW5kICRuZSBhcmUgbm90IGNvbWJpbmVkIHdpdGhcbiAgICAgICAgICAvLyBvYmplY3RzIG9yIGFycmF5cywgd2UgY2FuIGNvbmZpZGVudGx5IHJldHVybiBhbiBlbXB0eSBvYmplY3QgYXMgaXRcbiAgICAgICAgICAvLyBuZXZlciBtYXRjaGVzIGFueSBzY2FsYXIuXG4gICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgZmFsbGJhY2sgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5fc2VsZWN0b3JbcGF0aF07XG4gICAgfSxcbiAgICB4ID0+IHgpO1xuXG4gIGlmIChmYWxsYmFjaykge1xuICAgIHRoaXMuX21hdGNoaW5nRG9jdW1lbnQgPSBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMuX21hdGNoaW5nRG9jdW1lbnQ7XG59O1xuXG4vLyBNaW5pbW9uZ28uU29ydGVyIGdldHMgYSBzaW1pbGFyIG1ldGhvZCwgd2hpY2ggZGVsZWdhdGVzIHRvIGEgTWF0Y2hlciBpdCBtYWRlXG4vLyBmb3IgdGhpcyBleGFjdCBwdXJwb3NlLlxuTWluaW1vbmdvLlNvcnRlci5wcm90b3R5cGUuYWZmZWN0ZWRCeU1vZGlmaWVyID0gZnVuY3Rpb24obW9kaWZpZXIpIHtcbiAgcmV0dXJuIHRoaXMuX3NlbGVjdG9yRm9yQWZmZWN0ZWRCeU1vZGlmaWVyLmFmZmVjdGVkQnlNb2RpZmllcihtb2RpZmllcik7XG59O1xuXG5NaW5pbW9uZ28uU29ydGVyLnByb3RvdHlwZS5jb21iaW5lSW50b1Byb2plY3Rpb24gPSBmdW5jdGlvbihwcm9qZWN0aW9uKSB7XG4gIHJldHVybiBjb21iaW5lSW1wb3J0YW50UGF0aHNJbnRvUHJvamVjdGlvbihcbiAgICBNaW5pbW9uZ28uX3BhdGhzRWxpZGluZ051bWVyaWNLZXlzKHRoaXMuX2dldFBhdGhzKCkpLFxuICAgIHByb2plY3Rpb25cbiAgKTtcbn07XG5cbmZ1bmN0aW9uIGNvbWJpbmVJbXBvcnRhbnRQYXRoc0ludG9Qcm9qZWN0aW9uKHBhdGhzLCBwcm9qZWN0aW9uKSB7XG4gIGNvbnN0IGRldGFpbHMgPSBwcm9qZWN0aW9uRGV0YWlscyhwcm9qZWN0aW9uKTtcblxuICAvLyBtZXJnZSB0aGUgcGF0aHMgdG8gaW5jbHVkZVxuICBjb25zdCB0cmVlID0gcGF0aHNUb1RyZWUoXG4gICAgcGF0aHMsXG4gICAgcGF0aCA9PiB0cnVlLFxuICAgIChub2RlLCBwYXRoLCBmdWxsUGF0aCkgPT4gdHJ1ZSxcbiAgICBkZXRhaWxzLnRyZWVcbiAgKTtcbiAgY29uc3QgbWVyZ2VkUHJvamVjdGlvbiA9IHRyZWVUb1BhdGhzKHRyZWUpO1xuXG4gIGlmIChkZXRhaWxzLmluY2x1ZGluZykge1xuICAgIC8vIGJvdGggc2VsZWN0b3IgYW5kIHByb2plY3Rpb24gYXJlIHBvaW50aW5nIG9uIGZpZWxkcyB0byBpbmNsdWRlXG4gICAgLy8gc28gd2UgY2FuIGp1c3QgcmV0dXJuIHRoZSBtZXJnZWQgdHJlZVxuICAgIHJldHVybiBtZXJnZWRQcm9qZWN0aW9uO1xuICB9XG5cbiAgLy8gc2VsZWN0b3IgaXMgcG9pbnRpbmcgYXQgZmllbGRzIHRvIGluY2x1ZGVcbiAgLy8gcHJvamVjdGlvbiBpcyBwb2ludGluZyBhdCBmaWVsZHMgdG8gZXhjbHVkZVxuICAvLyBtYWtlIHN1cmUgd2UgZG9uJ3QgZXhjbHVkZSBpbXBvcnRhbnQgcGF0aHNcbiAgY29uc3QgbWVyZ2VkRXhjbFByb2plY3Rpb24gPSB7fTtcblxuICBPYmplY3Qua2V5cyhtZXJnZWRQcm9qZWN0aW9uKS5mb3JFYWNoKHBhdGggPT4ge1xuICAgIGlmICghbWVyZ2VkUHJvamVjdGlvbltwYXRoXSkge1xuICAgICAgbWVyZ2VkRXhjbFByb2plY3Rpb25bcGF0aF0gPSBmYWxzZTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBtZXJnZWRFeGNsUHJvamVjdGlvbjtcbn1cblxuZnVuY3Rpb24gZ2V0UGF0aHMoc2VsZWN0b3IpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG5ldyBNaW5pbW9uZ28uTWF0Y2hlcihzZWxlY3RvcikuX3BhdGhzKTtcblxuICAvLyBYWFggcmVtb3ZlIGl0P1xuICAvLyByZXR1cm4gT2JqZWN0LmtleXMoc2VsZWN0b3IpLm1hcChrID0+IHtcbiAgLy8gICAvLyB3ZSBkb24ndCBrbm93IGhvdyB0byBoYW5kbGUgJHdoZXJlIGJlY2F1c2UgaXQgY2FuIGJlIGFueXRoaW5nXG4gIC8vICAgaWYgKGsgPT09ICckd2hlcmUnKSB7XG4gIC8vICAgICByZXR1cm4gJyc7IC8vIG1hdGNoZXMgZXZlcnl0aGluZ1xuICAvLyAgIH1cblxuICAvLyAgIC8vIHdlIGJyYW5jaCBmcm9tICRvci8kYW5kLyRub3Igb3BlcmF0b3JcbiAgLy8gICBpZiAoWyckb3InLCAnJGFuZCcsICckbm9yJ10uaW5jbHVkZXMoaykpIHtcbiAgLy8gICAgIHJldHVybiBzZWxlY3RvcltrXS5tYXAoZ2V0UGF0aHMpO1xuICAvLyAgIH1cblxuICAvLyAgIC8vIHRoZSB2YWx1ZSBpcyBhIGxpdGVyYWwgb3Igc29tZSBjb21wYXJpc29uIG9wZXJhdG9yXG4gIC8vICAgcmV0dXJuIGs7XG4gIC8vIH0pXG4gIC8vICAgLnJlZHVjZSgoYSwgYikgPT4gYS5jb25jYXQoYiksIFtdKVxuICAvLyAgIC5maWx0ZXIoKGEsIGIsIGMpID0+IGMuaW5kZXhPZihhKSA9PT0gYik7XG59XG5cbi8vIEEgaGVscGVyIHRvIGVuc3VyZSBvYmplY3QgaGFzIG9ubHkgY2VydGFpbiBrZXlzXG5mdW5jdGlvbiBvbmx5Q29udGFpbnNLZXlzKG9iaiwga2V5cykge1xuICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5ldmVyeShrID0+IGtleXMuaW5jbHVkZXMoaykpO1xufVxuXG5mdW5jdGlvbiBwYXRoSGFzTnVtZXJpY0tleXMocGF0aCkge1xuICByZXR1cm4gcGF0aC5zcGxpdCgnLicpLnNvbWUoaXNOdW1lcmljS2V5KTtcbn1cblxuLy8gUmV0dXJucyBhIHNldCBvZiBrZXkgcGF0aHMgc2ltaWxhciB0b1xuLy8geyAnZm9vLmJhcic6IDEsICdhLmIuYyc6IDEgfVxuZnVuY3Rpb24gdHJlZVRvUGF0aHModHJlZSwgcHJlZml4ID0gJycpIHtcbiAgY29uc3QgcmVzdWx0ID0ge307XG5cbiAgT2JqZWN0LmtleXModHJlZSkuZm9yRWFjaChrZXkgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gdHJlZVtrZXldO1xuICAgIGlmICh2YWx1ZSA9PT0gT2JqZWN0KHZhbHVlKSkge1xuICAgICAgT2JqZWN0LmFzc2lnbihyZXN1bHQsIHRyZWVUb1BhdGhzKHZhbHVlLCBgJHtwcmVmaXggKyBrZXl9LmApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0W3ByZWZpeCArIGtleV0gPSB2YWx1ZTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG4iLCJpbXBvcnQgTG9jYWxDb2xsZWN0aW9uIGZyb20gJy4vbG9jYWxfY29sbGVjdGlvbi5qcyc7XG5cbmV4cG9ydCBjb25zdCBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5leHBvcnQgY2xhc3MgTWluaU1vbmdvUXVlcnlFcnJvciBleHRlbmRzIEVycm9yIHt9XG4vLyBFYWNoIGVsZW1lbnQgc2VsZWN0b3IgY29udGFpbnM6XG4vLyAgLSBjb21waWxlRWxlbWVudFNlbGVjdG9yLCBhIGZ1bmN0aW9uIHdpdGggYXJnczpcbi8vICAgIC0gb3BlcmFuZCAtIHRoZSBcInJpZ2h0IGhhbmQgc2lkZVwiIG9mIHRoZSBvcGVyYXRvclxuLy8gICAgLSB2YWx1ZVNlbGVjdG9yIC0gdGhlIFwiY29udGV4dFwiIGZvciB0aGUgb3BlcmF0b3IgKHNvIHRoYXQgJHJlZ2V4IGNhbiBmaW5kXG4vLyAgICAgICRvcHRpb25zKVxuLy8gICAgLSBtYXRjaGVyIC0gdGhlIE1hdGNoZXIgdGhpcyBpcyBnb2luZyBpbnRvIChzbyB0aGF0ICRlbGVtTWF0Y2ggY2FuIGNvbXBpbGVcbi8vICAgICAgbW9yZSB0aGluZ3MpXG4vLyAgICByZXR1cm5pbmcgYSBmdW5jdGlvbiBtYXBwaW5nIGEgc2luZ2xlIHZhbHVlIHRvIGJvb2wuXG4vLyAgLSBkb250RXhwYW5kTGVhZkFycmF5cywgYSBib29sIHdoaWNoIHByZXZlbnRzIGV4cGFuZEFycmF5c0luQnJhbmNoZXMgZnJvbVxuLy8gICAgYmVpbmcgY2FsbGVkXG4vLyAgLSBkb250SW5jbHVkZUxlYWZBcnJheXMsIGEgYm9vbCB3aGljaCBjYXVzZXMgYW4gYXJndW1lbnQgdG8gYmUgcGFzc2VkIHRvXG4vLyAgICBleHBhbmRBcnJheXNJbkJyYW5jaGVzIGlmIGl0IGlzIGNhbGxlZFxuZXhwb3J0IGNvbnN0IEVMRU1FTlRfT1BFUkFUT1JTID0ge1xuICAkbHQ6IG1ha2VJbmVxdWFsaXR5KGNtcFZhbHVlID0+IGNtcFZhbHVlIDwgMCksXG4gICRndDogbWFrZUluZXF1YWxpdHkoY21wVmFsdWUgPT4gY21wVmFsdWUgPiAwKSxcbiAgJGx0ZTogbWFrZUluZXF1YWxpdHkoY21wVmFsdWUgPT4gY21wVmFsdWUgPD0gMCksXG4gICRndGU6IG1ha2VJbmVxdWFsaXR5KGNtcFZhbHVlID0+IGNtcFZhbHVlID49IDApLFxuICAkbW9kOiB7XG4gICAgY29tcGlsZUVsZW1lbnRTZWxlY3RvcihvcGVyYW5kKSB7XG4gICAgICBpZiAoIShBcnJheS5pc0FycmF5KG9wZXJhbmQpICYmIG9wZXJhbmQubGVuZ3RoID09PSAyXG4gICAgICAgICAgICAmJiB0eXBlb2Ygb3BlcmFuZFswXSA9PT0gJ251bWJlcidcbiAgICAgICAgICAgICYmIHR5cGVvZiBvcGVyYW5kWzFdID09PSAnbnVtYmVyJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1pbmlNb25nb1F1ZXJ5RXJyb3IoJ2FyZ3VtZW50IHRvICRtb2QgbXVzdCBiZSBhbiBhcnJheSBvZiB0d28gbnVtYmVycycpO1xuICAgICAgfVxuXG4gICAgICAvLyBYWFggY291bGQgcmVxdWlyZSB0byBiZSBpbnRzIG9yIHJvdW5kIG9yIHNvbWV0aGluZ1xuICAgICAgY29uc3QgZGl2aXNvciA9IG9wZXJhbmRbMF07XG4gICAgICBjb25zdCByZW1haW5kZXIgPSBvcGVyYW5kWzFdO1xuICAgICAgcmV0dXJuIHZhbHVlID0+IChcbiAgICAgICAgdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiB2YWx1ZSAlIGRpdmlzb3IgPT09IHJlbWFpbmRlclxuICAgICAgKTtcbiAgICB9LFxuICB9LFxuICAkaW46IHtcbiAgICBjb21waWxlRWxlbWVudFNlbGVjdG9yKG9wZXJhbmQpIHtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShvcGVyYW5kKSkge1xuICAgICAgICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcignJGluIG5lZWRzIGFuIGFycmF5Jyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGVsZW1lbnRNYXRjaGVycyA9IG9wZXJhbmQubWFwKG9wdGlvbiA9PiB7XG4gICAgICAgIGlmIChvcHRpb24gaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICByZXR1cm4gcmVnZXhwRWxlbWVudE1hdGNoZXIob3B0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc09wZXJhdG9yT2JqZWN0KG9wdGlvbikpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcignY2Fubm90IG5lc3QgJCB1bmRlciAkaW4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlcXVhbGl0eUVsZW1lbnRNYXRjaGVyKG9wdGlvbik7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHZhbHVlID0+IHtcbiAgICAgICAgLy8gQWxsb3cge2E6IHskaW46IFtudWxsXX19IHRvIG1hdGNoIHdoZW4gJ2EnIGRvZXMgbm90IGV4aXN0LlxuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50TWF0Y2hlcnMuc29tZShtYXRjaGVyID0+IG1hdGNoZXIodmFsdWUpKTtcbiAgICAgIH07XG4gICAgfSxcbiAgfSxcbiAgJHNpemU6IHtcbiAgICAvLyB7YTogW1s1LCA1XV19IG11c3QgbWF0Y2gge2E6IHskc2l6ZTogMX19IGJ1dCBub3Qge2E6IHskc2l6ZTogMn19LCBzbyB3ZVxuICAgIC8vIGRvbid0IHdhbnQgdG8gY29uc2lkZXIgdGhlIGVsZW1lbnQgWzUsNV0gaW4gdGhlIGxlYWYgYXJyYXkgW1s1LDVdXSBhcyBhXG4gICAgLy8gcG9zc2libGUgdmFsdWUuXG4gICAgZG9udEV4cGFuZExlYWZBcnJheXM6IHRydWUsXG4gICAgY29tcGlsZUVsZW1lbnRTZWxlY3RvcihvcGVyYW5kKSB7XG4gICAgICBpZiAodHlwZW9mIG9wZXJhbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIERvbid0IGFzayBtZSB3aHksIGJ1dCBieSBleHBlcmltZW50YXRpb24sIHRoaXMgc2VlbXMgdG8gYmUgd2hhdCBNb25nb1xuICAgICAgICAvLyBkb2VzLlxuICAgICAgICBvcGVyYW5kID0gMDtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wZXJhbmQgIT09ICdudW1iZXInKSB7XG4gICAgICAgIHRocm93IG5ldyBNaW5pTW9uZ29RdWVyeUVycm9yKCckc2l6ZSBuZWVkcyBhIG51bWJlcicpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsdWUgPT4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSBvcGVyYW5kO1xuICAgIH0sXG4gIH0sXG4gICR0eXBlOiB7XG4gICAgLy8ge2E6IFs1XX0gbXVzdCBub3QgbWF0Y2gge2E6IHskdHlwZTogNH19ICg0IG1lYW5zIGFycmF5KSwgYnV0IGl0IHNob3VsZFxuICAgIC8vIG1hdGNoIHthOiB7JHR5cGU6IDF9fSAoMSBtZWFucyBudW1iZXIpLCBhbmQge2E6IFtbNV1dfSBtdXN0IG1hdGNoIHskYTpcbiAgICAvLyB7JHR5cGU6IDR9fS4gVGh1cywgd2hlbiB3ZSBzZWUgYSBsZWFmIGFycmF5LCB3ZSAqc2hvdWxkKiBleHBhbmQgaXQgYnV0XG4gICAgLy8gc2hvdWxkICpub3QqIGluY2x1ZGUgaXQgaXRzZWxmLlxuICAgIGRvbnRJbmNsdWRlTGVhZkFycmF5czogdHJ1ZSxcbiAgICBjb21waWxlRWxlbWVudFNlbGVjdG9yKG9wZXJhbmQpIHtcbiAgICAgIGlmICh0eXBlb2Ygb3BlcmFuZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3Qgb3BlcmFuZEFsaWFzTWFwID0ge1xuICAgICAgICAgICdkb3VibGUnOiAxLFxuICAgICAgICAgICdzdHJpbmcnOiAyLFxuICAgICAgICAgICdvYmplY3QnOiAzLFxuICAgICAgICAgICdhcnJheSc6IDQsXG4gICAgICAgICAgJ2JpbkRhdGEnOiA1LFxuICAgICAgICAgICd1bmRlZmluZWQnOiA2LFxuICAgICAgICAgICdvYmplY3RJZCc6IDcsXG4gICAgICAgICAgJ2Jvb2wnOiA4LFxuICAgICAgICAgICdkYXRlJzogOSxcbiAgICAgICAgICAnbnVsbCc6IDEwLFxuICAgICAgICAgICdyZWdleCc6IDExLFxuICAgICAgICAgICdkYlBvaW50ZXInOiAxMixcbiAgICAgICAgICAnamF2YXNjcmlwdCc6IDEzLFxuICAgICAgICAgICdzeW1ib2wnOiAxNCxcbiAgICAgICAgICAnamF2YXNjcmlwdFdpdGhTY29wZSc6IDE1LFxuICAgICAgICAgICdpbnQnOiAxNixcbiAgICAgICAgICAndGltZXN0YW1wJzogMTcsXG4gICAgICAgICAgJ2xvbmcnOiAxOCxcbiAgICAgICAgICAnZGVjaW1hbCc6IDE5LFxuICAgICAgICAgICdtaW5LZXknOiAtMSxcbiAgICAgICAgICAnbWF4S2V5JzogMTI3LFxuICAgICAgICB9O1xuICAgICAgICBpZiAoIWhhc093bi5jYWxsKG9wZXJhbmRBbGlhc01hcCwgb3BlcmFuZCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcihgdW5rbm93biBzdHJpbmcgYWxpYXMgZm9yICR0eXBlOiAke29wZXJhbmR9YCk7XG4gICAgICAgIH1cbiAgICAgICAgb3BlcmFuZCA9IG9wZXJhbmRBbGlhc01hcFtvcGVyYW5kXTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wZXJhbmQgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlmIChvcGVyYW5kID09PSAwIHx8IG9wZXJhbmQgPCAtMVxuICAgICAgICAgIHx8IChvcGVyYW5kID4gMTkgJiYgb3BlcmFuZCAhPT0gMTI3KSkge1xuICAgICAgICAgIHRocm93IG5ldyBNaW5pTW9uZ29RdWVyeUVycm9yKGBJbnZhbGlkIG51bWVyaWNhbCAkdHlwZSBjb2RlOiAke29wZXJhbmR9YCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBNaW5pTW9uZ29RdWVyeUVycm9yKCdhcmd1bWVudCB0byAkdHlwZSBpcyBub3QgYSBudW1iZXIgb3IgYSBzdHJpbmcnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbHVlID0+IChcbiAgICAgICAgdmFsdWUgIT09IHVuZGVmaW5lZCAmJiBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUodmFsdWUpID09PSBvcGVyYW5kXG4gICAgICApO1xuICAgIH0sXG4gIH0sXG4gICRiaXRzQWxsU2V0OiB7XG4gICAgY29tcGlsZUVsZW1lbnRTZWxlY3RvcihvcGVyYW5kKSB7XG4gICAgICBjb25zdCBtYXNrID0gZ2V0T3BlcmFuZEJpdG1hc2sob3BlcmFuZCwgJyRiaXRzQWxsU2V0Jyk7XG4gICAgICByZXR1cm4gdmFsdWUgPT4ge1xuICAgICAgICBjb25zdCBiaXRtYXNrID0gZ2V0VmFsdWVCaXRtYXNrKHZhbHVlLCBtYXNrLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiBiaXRtYXNrICYmIG1hc2suZXZlcnkoKGJ5dGUsIGkpID0+IChiaXRtYXNrW2ldICYgYnl0ZSkgPT09IGJ5dGUpO1xuICAgICAgfTtcbiAgICB9LFxuICB9LFxuICAkYml0c0FueVNldDoge1xuICAgIGNvbXBpbGVFbGVtZW50U2VsZWN0b3Iob3BlcmFuZCkge1xuICAgICAgY29uc3QgbWFzayA9IGdldE9wZXJhbmRCaXRtYXNrKG9wZXJhbmQsICckYml0c0FueVNldCcpO1xuICAgICAgcmV0dXJuIHZhbHVlID0+IHtcbiAgICAgICAgY29uc3QgYml0bWFzayA9IGdldFZhbHVlQml0bWFzayh2YWx1ZSwgbWFzay5sZW5ndGgpO1xuICAgICAgICByZXR1cm4gYml0bWFzayAmJiBtYXNrLnNvbWUoKGJ5dGUsIGkpID0+ICh+Yml0bWFza1tpXSAmIGJ5dGUpICE9PSBieXRlKTtcbiAgICAgIH07XG4gICAgfSxcbiAgfSxcbiAgJGJpdHNBbGxDbGVhcjoge1xuICAgIGNvbXBpbGVFbGVtZW50U2VsZWN0b3Iob3BlcmFuZCkge1xuICAgICAgY29uc3QgbWFzayA9IGdldE9wZXJhbmRCaXRtYXNrKG9wZXJhbmQsICckYml0c0FsbENsZWFyJyk7XG4gICAgICByZXR1cm4gdmFsdWUgPT4ge1xuICAgICAgICBjb25zdCBiaXRtYXNrID0gZ2V0VmFsdWVCaXRtYXNrKHZhbHVlLCBtYXNrLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiBiaXRtYXNrICYmIG1hc2suZXZlcnkoKGJ5dGUsIGkpID0+ICEoYml0bWFza1tpXSAmIGJ5dGUpKTtcbiAgICAgIH07XG4gICAgfSxcbiAgfSxcbiAgJGJpdHNBbnlDbGVhcjoge1xuICAgIGNvbXBpbGVFbGVtZW50U2VsZWN0b3Iob3BlcmFuZCkge1xuICAgICAgY29uc3QgbWFzayA9IGdldE9wZXJhbmRCaXRtYXNrKG9wZXJhbmQsICckYml0c0FueUNsZWFyJyk7XG4gICAgICByZXR1cm4gdmFsdWUgPT4ge1xuICAgICAgICBjb25zdCBiaXRtYXNrID0gZ2V0VmFsdWVCaXRtYXNrKHZhbHVlLCBtYXNrLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiBiaXRtYXNrICYmIG1hc2suc29tZSgoYnl0ZSwgaSkgPT4gKGJpdG1hc2tbaV0gJiBieXRlKSAhPT0gYnl0ZSk7XG4gICAgICB9O1xuICAgIH0sXG4gIH0sXG4gICRyZWdleDoge1xuICAgIGNvbXBpbGVFbGVtZW50U2VsZWN0b3Iob3BlcmFuZCwgdmFsdWVTZWxlY3Rvcikge1xuICAgICAgaWYgKCEodHlwZW9mIG9wZXJhbmQgPT09ICdzdHJpbmcnIHx8IG9wZXJhbmQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICAgIHRocm93IG5ldyBNaW5pTW9uZ29RdWVyeUVycm9yKCckcmVnZXggaGFzIHRvIGJlIGEgc3RyaW5nIG9yIFJlZ0V4cCcpO1xuICAgICAgfVxuXG4gICAgICBsZXQgcmVnZXhwO1xuICAgICAgaWYgKHZhbHVlU2VsZWN0b3IuJG9wdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBPcHRpb25zIHBhc3NlZCBpbiAkb3B0aW9ucyAoZXZlbiB0aGUgZW1wdHkgc3RyaW5nKSBhbHdheXMgb3ZlcnJpZGVzXG4gICAgICAgIC8vIG9wdGlvbnMgaW4gdGhlIFJlZ0V4cCBvYmplY3QgaXRzZWxmLlxuXG4gICAgICAgIC8vIEJlIGNsZWFyIHRoYXQgd2Ugb25seSBzdXBwb3J0IHRoZSBKUy1zdXBwb3J0ZWQgb3B0aW9ucywgbm90IGV4dGVuZGVkXG4gICAgICAgIC8vIG9uZXMgKGVnLCBNb25nbyBzdXBwb3J0cyB4IGFuZCBzKS4gSWRlYWxseSB3ZSB3b3VsZCBpbXBsZW1lbnQgeCBhbmQgc1xuICAgICAgICAvLyBieSB0cmFuc2Zvcm1pbmcgdGhlIHJlZ2V4cCwgYnV0IG5vdCB0b2RheS4uLlxuICAgICAgICBpZiAoL1teZ2ltXS8udGVzdCh2YWx1ZVNlbGVjdG9yLiRvcHRpb25zKSkge1xuICAgICAgICAgIHRocm93IG5ldyBNaW5pTW9uZ29RdWVyeUVycm9yKCdPbmx5IHRoZSBpLCBtLCBhbmQgZyByZWdleHAgb3B0aW9ucyBhcmUgc3VwcG9ydGVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzb3VyY2UgPSBvcGVyYW5kIGluc3RhbmNlb2YgUmVnRXhwID8gb3BlcmFuZC5zb3VyY2UgOiBvcGVyYW5kO1xuICAgICAgICByZWdleHAgPSBuZXcgUmVnRXhwKHNvdXJjZSwgdmFsdWVTZWxlY3Rvci4kb3B0aW9ucyk7XG4gICAgICB9IGVsc2UgaWYgKG9wZXJhbmQgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgcmVnZXhwID0gb3BlcmFuZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZ2V4cCA9IG5ldyBSZWdFeHAob3BlcmFuZCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZWdleHBFbGVtZW50TWF0Y2hlcihyZWdleHApO1xuICAgIH0sXG4gIH0sXG4gICRlbGVtTWF0Y2g6IHtcbiAgICBkb250RXhwYW5kTGVhZkFycmF5czogdHJ1ZSxcbiAgICBjb21waWxlRWxlbWVudFNlbGVjdG9yKG9wZXJhbmQsIHZhbHVlU2VsZWN0b3IsIG1hdGNoZXIpIHtcbiAgICAgIGlmICghTG9jYWxDb2xsZWN0aW9uLl9pc1BsYWluT2JqZWN0KG9wZXJhbmQpKSB7XG4gICAgICAgIHRocm93IG5ldyBNaW5pTW9uZ29RdWVyeUVycm9yKCckZWxlbU1hdGNoIG5lZWQgYW4gb2JqZWN0Jyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzRG9jTWF0Y2hlciA9ICFpc09wZXJhdG9yT2JqZWN0KFxuICAgICAgICBPYmplY3Qua2V5cyhvcGVyYW5kKVxuICAgICAgICAgIC5maWx0ZXIoa2V5ID0+ICFoYXNPd24uY2FsbChMT0dJQ0FMX09QRVJBVE9SUywga2V5KSlcbiAgICAgICAgICAucmVkdWNlKChhLCBiKSA9PiBPYmplY3QuYXNzaWduKGEsIHtbYl06IG9wZXJhbmRbYl19KSwge30pLFxuICAgICAgICB0cnVlKTtcblxuICAgICAgbGV0IHN1Yk1hdGNoZXI7XG4gICAgICBpZiAoaXNEb2NNYXRjaGVyKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgTk9UIHRoZSBzYW1lIGFzIGNvbXBpbGVWYWx1ZVNlbGVjdG9yKG9wZXJhbmQpLCBhbmQgbm90IGp1c3RcbiAgICAgICAgLy8gYmVjYXVzZSBvZiB0aGUgc2xpZ2h0bHkgZGlmZmVyZW50IGNhbGxpbmcgY29udmVudGlvbi5cbiAgICAgICAgLy8geyRlbGVtTWF0Y2g6IHt4OiAzfX0gbWVhbnMgXCJhbiBlbGVtZW50IGhhcyBhIGZpZWxkIHg6M1wiLCBub3RcbiAgICAgICAgLy8gXCJjb25zaXN0cyBvbmx5IG9mIGEgZmllbGQgeDozXCIuIEFsc28sIHJlZ2V4cHMgYW5kIHN1Yi0kIGFyZSBhbGxvd2VkLlxuICAgICAgICBzdWJNYXRjaGVyID1cbiAgICAgICAgICBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihvcGVyYW5kLCBtYXRjaGVyLCB7aW5FbGVtTWF0Y2g6IHRydWV9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN1Yk1hdGNoZXIgPSBjb21waWxlVmFsdWVTZWxlY3RvcihvcGVyYW5kLCBtYXRjaGVyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbHVlID0+IHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBjb25zdCBhcnJheUVsZW1lbnQgPSB2YWx1ZVtpXTtcbiAgICAgICAgICBsZXQgYXJnO1xuICAgICAgICAgIGlmIChpc0RvY01hdGNoZXIpIHtcbiAgICAgICAgICAgIC8vIFdlIGNhbiBvbmx5IG1hdGNoIHskZWxlbU1hdGNoOiB7YjogM319IGFnYWluc3Qgb2JqZWN0cy5cbiAgICAgICAgICAgIC8vIChXZSBjYW4gYWxzbyBtYXRjaCBhZ2FpbnN0IGFycmF5cywgaWYgdGhlcmUncyBudW1lcmljIGluZGljZXMsXG4gICAgICAgICAgICAvLyBlZyB7JGVsZW1NYXRjaDogeycwLmInOiAzfX0gb3IgeyRlbGVtTWF0Y2g6IHswOiAzfX0uKVxuICAgICAgICAgICAgaWYgKCFpc0luZGV4YWJsZShhcnJheUVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXJnID0gYXJyYXlFbGVtZW50O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBkb250SXRlcmF0ZSBlbnN1cmVzIHRoYXQge2E6IHskZWxlbU1hdGNoOiB7JGd0OiA1fX19IG1hdGNoZXNcbiAgICAgICAgICAgIC8vIHthOiBbOF19IGJ1dCBub3Qge2E6IFtbOF1dfVxuICAgICAgICAgICAgYXJnID0gW3t2YWx1ZTogYXJyYXlFbGVtZW50LCBkb250SXRlcmF0ZTogdHJ1ZX1dO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBYWFggc3VwcG9ydCAkbmVhciBpbiAkZWxlbU1hdGNoIGJ5IHByb3BhZ2F0aW5nICRkaXN0YW5jZT9cbiAgICAgICAgICBpZiAoc3ViTWF0Y2hlcihhcmcpLnJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIGk7IC8vIHNwZWNpYWxseSB1bmRlcnN0b29kIHRvIG1lYW4gXCJ1c2UgYXMgYXJyYXlJbmRpY2VzXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9O1xuICAgIH0sXG4gIH0sXG59O1xuXG4vLyBPcGVyYXRvcnMgdGhhdCBhcHBlYXIgYXQgdGhlIHRvcCBsZXZlbCBvZiBhIGRvY3VtZW50IHNlbGVjdG9yLlxuY29uc3QgTE9HSUNBTF9PUEVSQVRPUlMgPSB7XG4gICRhbmQoc3ViU2VsZWN0b3IsIG1hdGNoZXIsIGluRWxlbU1hdGNoKSB7XG4gICAgcmV0dXJuIGFuZERvY3VtZW50TWF0Y2hlcnMoXG4gICAgICBjb21waWxlQXJyYXlPZkRvY3VtZW50U2VsZWN0b3JzKHN1YlNlbGVjdG9yLCBtYXRjaGVyLCBpbkVsZW1NYXRjaClcbiAgICApO1xuICB9LFxuXG4gICRvcihzdWJTZWxlY3RvciwgbWF0Y2hlciwgaW5FbGVtTWF0Y2gpIHtcbiAgICBjb25zdCBtYXRjaGVycyA9IGNvbXBpbGVBcnJheU9mRG9jdW1lbnRTZWxlY3RvcnMoXG4gICAgICBzdWJTZWxlY3RvcixcbiAgICAgIG1hdGNoZXIsXG4gICAgICBpbkVsZW1NYXRjaFxuICAgICk7XG5cbiAgICAvLyBTcGVjaWFsIGNhc2U6IGlmIHRoZXJlIGlzIG9ubHkgb25lIG1hdGNoZXIsIHVzZSBpdCBkaXJlY3RseSwgKnByZXNlcnZpbmcqXG4gICAgLy8gYW55IGFycmF5SW5kaWNlcyBpdCByZXR1cm5zLlxuICAgIGlmIChtYXRjaGVycy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiBtYXRjaGVyc1swXTtcbiAgICB9XG5cbiAgICByZXR1cm4gZG9jID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IG1hdGNoZXJzLnNvbWUoZm4gPT4gZm4oZG9jKS5yZXN1bHQpO1xuICAgICAgLy8gJG9yIGRvZXMgTk9UIHNldCBhcnJheUluZGljZXMgd2hlbiBpdCBoYXMgbXVsdGlwbGVcbiAgICAgIC8vIHN1Yi1leHByZXNzaW9ucy4gKFRlc3RlZCBhZ2FpbnN0IE1vbmdvREIuKVxuICAgICAgcmV0dXJuIHtyZXN1bHR9O1xuICAgIH07XG4gIH0sXG5cbiAgJG5vcihzdWJTZWxlY3RvciwgbWF0Y2hlciwgaW5FbGVtTWF0Y2gpIHtcbiAgICBjb25zdCBtYXRjaGVycyA9IGNvbXBpbGVBcnJheU9mRG9jdW1lbnRTZWxlY3RvcnMoXG4gICAgICBzdWJTZWxlY3RvcixcbiAgICAgIG1hdGNoZXIsXG4gICAgICBpbkVsZW1NYXRjaFxuICAgICk7XG4gICAgcmV0dXJuIGRvYyA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBtYXRjaGVycy5ldmVyeShmbiA9PiAhZm4oZG9jKS5yZXN1bHQpO1xuICAgICAgLy8gTmV2ZXIgc2V0IGFycmF5SW5kaWNlcywgYmVjYXVzZSB3ZSBvbmx5IG1hdGNoIGlmIG5vdGhpbmcgaW4gcGFydGljdWxhclxuICAgICAgLy8gJ21hdGNoZWQnIChhbmQgYmVjYXVzZSB0aGlzIGlzIGNvbnNpc3RlbnQgd2l0aCBNb25nb0RCKS5cbiAgICAgIHJldHVybiB7cmVzdWx0fTtcbiAgICB9O1xuICB9LFxuXG4gICR3aGVyZShzZWxlY3RvclZhbHVlLCBtYXRjaGVyKSB7XG4gICAgLy8gUmVjb3JkIHRoYXQgKmFueSogcGF0aCBtYXkgYmUgdXNlZC5cbiAgICBtYXRjaGVyLl9yZWNvcmRQYXRoVXNlZCgnJyk7XG4gICAgbWF0Y2hlci5faGFzV2hlcmUgPSB0cnVlO1xuXG4gICAgaWYgKCEoc2VsZWN0b3JWYWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xuICAgICAgLy8gWFhYIE1vbmdvREIgc2VlbXMgdG8gaGF2ZSBtb3JlIGNvbXBsZXggbG9naWMgdG8gZGVjaWRlIHdoZXJlIG9yIG9yIG5vdFxuICAgICAgLy8gdG8gYWRkICdyZXR1cm4nOyBub3Qgc3VyZSBleGFjdGx5IHdoYXQgaXQgaXMuXG4gICAgICBzZWxlY3RvclZhbHVlID0gRnVuY3Rpb24oJ29iaicsIGByZXR1cm4gJHtzZWxlY3RvclZhbHVlfWApO1xuICAgIH1cblxuICAgIC8vIFdlIG1ha2UgdGhlIGRvY3VtZW50IGF2YWlsYWJsZSBhcyBib3RoIGB0aGlzYCBhbmQgYG9iamAuXG4gICAgLy8gLy8gWFhYIG5vdCBzdXJlIHdoYXQgd2Ugc2hvdWxkIGRvIGlmIHRoaXMgdGhyb3dzXG4gICAgcmV0dXJuIGRvYyA9PiAoe3Jlc3VsdDogc2VsZWN0b3JWYWx1ZS5jYWxsKGRvYywgZG9jKX0pO1xuICB9LFxuXG4gIC8vIFRoaXMgaXMganVzdCB1c2VkIGFzIGEgY29tbWVudCBpbiB0aGUgcXVlcnkgKGluIE1vbmdvREIsIGl0IGFsc28gZW5kcyB1cCBpblxuICAvLyBxdWVyeSBsb2dzKTsgaXQgaGFzIG5vIGVmZmVjdCBvbiB0aGUgYWN0dWFsIHNlbGVjdGlvbi5cbiAgJGNvbW1lbnQoKSB7XG4gICAgcmV0dXJuICgpID0+ICh7cmVzdWx0OiB0cnVlfSk7XG4gIH0sXG59O1xuXG4vLyBPcGVyYXRvcnMgdGhhdCAodW5saWtlIExPR0lDQUxfT1BFUkFUT1JTKSBwZXJ0YWluIHRvIGluZGl2aWR1YWwgcGF0aHMgaW4gYVxuLy8gZG9jdW1lbnQsIGJ1dCAodW5saWtlIEVMRU1FTlRfT1BFUkFUT1JTKSBkbyBub3QgaGF2ZSBhIHNpbXBsZSBkZWZpbml0aW9uIGFzXG4vLyBcIm1hdGNoIGVhY2ggYnJhbmNoZWQgdmFsdWUgaW5kZXBlbmRlbnRseSBhbmQgY29tYmluZSB3aXRoXG4vLyBjb252ZXJ0RWxlbWVudE1hdGNoZXJUb0JyYW5jaGVkTWF0Y2hlclwiLlxuY29uc3QgVkFMVUVfT1BFUkFUT1JTID0ge1xuICAkZXEob3BlcmFuZCkge1xuICAgIHJldHVybiBjb252ZXJ0RWxlbWVudE1hdGNoZXJUb0JyYW5jaGVkTWF0Y2hlcihcbiAgICAgIGVxdWFsaXR5RWxlbWVudE1hdGNoZXIob3BlcmFuZClcbiAgICApO1xuICB9LFxuICAkbm90KG9wZXJhbmQsIHZhbHVlU2VsZWN0b3IsIG1hdGNoZXIpIHtcbiAgICByZXR1cm4gaW52ZXJ0QnJhbmNoZWRNYXRjaGVyKGNvbXBpbGVWYWx1ZVNlbGVjdG9yKG9wZXJhbmQsIG1hdGNoZXIpKTtcbiAgfSxcbiAgJG5lKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gaW52ZXJ0QnJhbmNoZWRNYXRjaGVyKFxuICAgICAgY29udmVydEVsZW1lbnRNYXRjaGVyVG9CcmFuY2hlZE1hdGNoZXIoZXF1YWxpdHlFbGVtZW50TWF0Y2hlcihvcGVyYW5kKSlcbiAgICApO1xuICB9LFxuICAkbmluKG9wZXJhbmQpIHtcbiAgICByZXR1cm4gaW52ZXJ0QnJhbmNoZWRNYXRjaGVyKFxuICAgICAgY29udmVydEVsZW1lbnRNYXRjaGVyVG9CcmFuY2hlZE1hdGNoZXIoXG4gICAgICAgIEVMRU1FTlRfT1BFUkFUT1JTLiRpbi5jb21waWxlRWxlbWVudFNlbGVjdG9yKG9wZXJhbmQpXG4gICAgICApXG4gICAgKTtcbiAgfSxcbiAgJGV4aXN0cyhvcGVyYW5kKSB7XG4gICAgY29uc3QgZXhpc3RzID0gY29udmVydEVsZW1lbnRNYXRjaGVyVG9CcmFuY2hlZE1hdGNoZXIoXG4gICAgICB2YWx1ZSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkXG4gICAgKTtcbiAgICByZXR1cm4gb3BlcmFuZCA/IGV4aXN0cyA6IGludmVydEJyYW5jaGVkTWF0Y2hlcihleGlzdHMpO1xuICB9LFxuICAvLyAkb3B0aW9ucyBqdXN0IHByb3ZpZGVzIG9wdGlvbnMgZm9yICRyZWdleDsgaXRzIGxvZ2ljIGlzIGluc2lkZSAkcmVnZXhcbiAgJG9wdGlvbnMob3BlcmFuZCwgdmFsdWVTZWxlY3Rvcikge1xuICAgIGlmICghaGFzT3duLmNhbGwodmFsdWVTZWxlY3RvciwgJyRyZWdleCcpKSB7XG4gICAgICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcignJG9wdGlvbnMgbmVlZHMgYSAkcmVnZXgnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXZlcnl0aGluZ01hdGNoZXI7XG4gIH0sXG4gIC8vICRtYXhEaXN0YW5jZSBpcyBiYXNpY2FsbHkgYW4gYXJndW1lbnQgdG8gJG5lYXJcbiAgJG1heERpc3RhbmNlKG9wZXJhbmQsIHZhbHVlU2VsZWN0b3IpIHtcbiAgICBpZiAoIXZhbHVlU2VsZWN0b3IuJG5lYXIpIHtcbiAgICAgIHRocm93IG5ldyBNaW5pTW9uZ29RdWVyeUVycm9yKCckbWF4RGlzdGFuY2UgbmVlZHMgYSAkbmVhcicpO1xuICAgIH1cblxuICAgIHJldHVybiBldmVyeXRoaW5nTWF0Y2hlcjtcbiAgfSxcbiAgJGFsbChvcGVyYW5kLCB2YWx1ZVNlbGVjdG9yLCBtYXRjaGVyKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KG9wZXJhbmQpKSB7XG4gICAgICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcignJGFsbCByZXF1aXJlcyBhcnJheScpO1xuICAgIH1cblxuICAgIC8vIE5vdCBzdXJlIHdoeSwgYnV0IHRoaXMgc2VlbXMgdG8gYmUgd2hhdCBNb25nb0RCIGRvZXMuXG4gICAgaWYgKG9wZXJhbmQubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbm90aGluZ01hdGNoZXI7XG4gICAgfVxuXG4gICAgY29uc3QgYnJhbmNoZWRNYXRjaGVycyA9IG9wZXJhbmQubWFwKGNyaXRlcmlvbiA9PiB7XG4gICAgICAvLyBYWFggaGFuZGxlICRhbGwvJGVsZW1NYXRjaCBjb21iaW5hdGlvblxuICAgICAgaWYgKGlzT3BlcmF0b3JPYmplY3QoY3JpdGVyaW9uKSkge1xuICAgICAgICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcignbm8gJCBleHByZXNzaW9ucyBpbiAkYWxsJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoaXMgaXMgYWx3YXlzIGEgcmVnZXhwIG9yIGVxdWFsaXR5IHNlbGVjdG9yLlxuICAgICAgcmV0dXJuIGNvbXBpbGVWYWx1ZVNlbGVjdG9yKGNyaXRlcmlvbiwgbWF0Y2hlcik7XG4gICAgfSk7XG5cbiAgICAvLyBhbmRCcmFuY2hlZE1hdGNoZXJzIGRvZXMgTk9UIHJlcXVpcmUgYWxsIHNlbGVjdG9ycyB0byByZXR1cm4gdHJ1ZSBvbiB0aGVcbiAgICAvLyBTQU1FIGJyYW5jaC5cbiAgICByZXR1cm4gYW5kQnJhbmNoZWRNYXRjaGVycyhicmFuY2hlZE1hdGNoZXJzKTtcbiAgfSxcbiAgJG5lYXIob3BlcmFuZCwgdmFsdWVTZWxlY3RvciwgbWF0Y2hlciwgaXNSb290KSB7XG4gICAgaWYgKCFpc1Jvb3QpIHtcbiAgICAgIHRocm93IG5ldyBNaW5pTW9uZ29RdWVyeUVycm9yKCckbmVhciBjYW5cXCd0IGJlIGluc2lkZSBhbm90aGVyICQgb3BlcmF0b3InKTtcbiAgICB9XG5cbiAgICBtYXRjaGVyLl9oYXNHZW9RdWVyeSA9IHRydWU7XG5cbiAgICAvLyBUaGVyZSBhcmUgdHdvIGtpbmRzIG9mIGdlb2RhdGEgaW4gTW9uZ29EQjogbGVnYWN5IGNvb3JkaW5hdGUgcGFpcnMgYW5kXG4gICAgLy8gR2VvSlNPTi4gVGhleSB1c2UgZGlmZmVyZW50IGRpc3RhbmNlIG1ldHJpY3MsIHRvby4gR2VvSlNPTiBxdWVyaWVzIGFyZVxuICAgIC8vIG1hcmtlZCB3aXRoIGEgJGdlb21ldHJ5IHByb3BlcnR5LCB0aG91Z2ggbGVnYWN5IGNvb3JkaW5hdGVzIGNhbiBiZVxuICAgIC8vIG1hdGNoZWQgdXNpbmcgJGdlb21ldHJ5LlxuICAgIGxldCBtYXhEaXN0YW5jZSwgcG9pbnQsIGRpc3RhbmNlO1xuICAgIGlmIChMb2NhbENvbGxlY3Rpb24uX2lzUGxhaW5PYmplY3Qob3BlcmFuZCkgJiYgaGFzT3duLmNhbGwob3BlcmFuZCwgJyRnZW9tZXRyeScpKSB7XG4gICAgICAvLyBHZW9KU09OIFwiMmRzcGhlcmVcIiBtb2RlLlxuICAgICAgbWF4RGlzdGFuY2UgPSBvcGVyYW5kLiRtYXhEaXN0YW5jZTtcbiAgICAgIHBvaW50ID0gb3BlcmFuZC4kZ2VvbWV0cnk7XG4gICAgICBkaXN0YW5jZSA9IHZhbHVlID0+IHtcbiAgICAgICAgLy8gWFhYOiBmb3Igbm93LCB3ZSBkb24ndCBjYWxjdWxhdGUgdGhlIGFjdHVhbCBkaXN0YW5jZSBiZXR3ZWVuLCBzYXksXG4gICAgICAgIC8vIHBvbHlnb24gYW5kIGNpcmNsZS4gSWYgcGVvcGxlIGNhcmUgYWJvdXQgdGhpcyB1c2UtY2FzZSBpdCB3aWxsIGdldFxuICAgICAgICAvLyBhIHByaW9yaXR5LlxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXZhbHVlLnR5cGUpIHtcbiAgICAgICAgICByZXR1cm4gR2VvSlNPTi5wb2ludERpc3RhbmNlKFxuICAgICAgICAgICAgcG9pbnQsXG4gICAgICAgICAgICB7dHlwZTogJ1BvaW50JywgY29vcmRpbmF0ZXM6IHBvaW50VG9BcnJheSh2YWx1ZSl9XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZS50eXBlID09PSAnUG9pbnQnKSB7XG4gICAgICAgICAgcmV0dXJuIEdlb0pTT04ucG9pbnREaXN0YW5jZShwb2ludCwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEdlb0pTT04uZ2VvbWV0cnlXaXRoaW5SYWRpdXModmFsdWUsIHBvaW50LCBtYXhEaXN0YW5jZSlcbiAgICAgICAgICA/IDBcbiAgICAgICAgICA6IG1heERpc3RhbmNlICsgMTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIG1heERpc3RhbmNlID0gdmFsdWVTZWxlY3Rvci4kbWF4RGlzdGFuY2U7XG5cbiAgICAgIGlmICghaXNJbmRleGFibGUob3BlcmFuZCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1pbmlNb25nb1F1ZXJ5RXJyb3IoJyRuZWFyIGFyZ3VtZW50IG11c3QgYmUgY29vcmRpbmF0ZSBwYWlyIG9yIEdlb0pTT04nKTtcbiAgICAgIH1cblxuICAgICAgcG9pbnQgPSBwb2ludFRvQXJyYXkob3BlcmFuZCk7XG5cbiAgICAgIGRpc3RhbmNlID0gdmFsdWUgPT4ge1xuICAgICAgICBpZiAoIWlzSW5kZXhhYmxlKHZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRpc3RhbmNlQ29vcmRpbmF0ZVBhaXJzKHBvaW50LCB2YWx1ZSk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBicmFuY2hlZFZhbHVlcyA9PiB7XG4gICAgICAvLyBUaGVyZSBtaWdodCBiZSBtdWx0aXBsZSBwb2ludHMgaW4gdGhlIGRvY3VtZW50IHRoYXQgbWF0Y2ggdGhlIGdpdmVuXG4gICAgICAvLyBmaWVsZC4gT25seSBvbmUgb2YgdGhlbSBuZWVkcyB0byBiZSB3aXRoaW4gJG1heERpc3RhbmNlLCBidXQgd2UgbmVlZCB0b1xuICAgICAgLy8gZXZhbHVhdGUgYWxsIG9mIHRoZW0gYW5kIHVzZSB0aGUgbmVhcmVzdCBvbmUgZm9yIHRoZSBpbXBsaWNpdCBzb3J0XG4gICAgICAvLyBzcGVjaWZpZXIuIChUaGF0J3Mgd2h5IHdlIGNhbid0IGp1c3QgdXNlIEVMRU1FTlRfT1BFUkFUT1JTIGhlcmUuKVxuICAgICAgLy9cbiAgICAgIC8vIE5vdGU6IFRoaXMgZGlmZmVycyBmcm9tIE1vbmdvREIncyBpbXBsZW1lbnRhdGlvbiwgd2hlcmUgYSBkb2N1bWVudCB3aWxsXG4gICAgICAvLyBhY3R1YWxseSBzaG93IHVwICptdWx0aXBsZSB0aW1lcyogaW4gdGhlIHJlc3VsdCBzZXQsIHdpdGggb25lIGVudHJ5IGZvclxuICAgICAgLy8gZWFjaCB3aXRoaW4tJG1heERpc3RhbmNlIGJyYW5jaGluZyBwb2ludC5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHtyZXN1bHQ6IGZhbHNlfTtcbiAgICAgIGV4cGFuZEFycmF5c0luQnJhbmNoZXMoYnJhbmNoZWRWYWx1ZXMpLmV2ZXJ5KGJyYW5jaCA9PiB7XG4gICAgICAgIC8vIGlmIG9wZXJhdGlvbiBpcyBhbiB1cGRhdGUsIGRvbid0IHNraXAgYnJhbmNoZXMsIGp1c3QgcmV0dXJuIHRoZSBmaXJzdFxuICAgICAgICAvLyBvbmUgKCMzNTk5KVxuICAgICAgICBsZXQgY3VyRGlzdGFuY2U7XG4gICAgICAgIGlmICghbWF0Y2hlci5faXNVcGRhdGUpIHtcbiAgICAgICAgICBpZiAoISh0eXBlb2YgYnJhbmNoLnZhbHVlID09PSAnb2JqZWN0JykpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGN1ckRpc3RhbmNlID0gZGlzdGFuY2UoYnJhbmNoLnZhbHVlKTtcblxuICAgICAgICAgIC8vIFNraXAgYnJhbmNoZXMgdGhhdCBhcmVuJ3QgcmVhbCBwb2ludHMgb3IgYXJlIHRvbyBmYXIgYXdheS5cbiAgICAgICAgICBpZiAoY3VyRGlzdGFuY2UgPT09IG51bGwgfHwgY3VyRGlzdGFuY2UgPiBtYXhEaXN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU2tpcCBhbnl0aGluZyB0aGF0J3MgYSB0aWUuXG4gICAgICAgICAgaWYgKHJlc3VsdC5kaXN0YW5jZSAhPT0gdW5kZWZpbmVkICYmIHJlc3VsdC5kaXN0YW5jZSA8PSBjdXJEaXN0YW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0LnJlc3VsdCA9IHRydWU7XG4gICAgICAgIHJlc3VsdC5kaXN0YW5jZSA9IGN1ckRpc3RhbmNlO1xuXG4gICAgICAgIGlmIChicmFuY2guYXJyYXlJbmRpY2VzKSB7XG4gICAgICAgICAgcmVzdWx0LmFycmF5SW5kaWNlcyA9IGJyYW5jaC5hcnJheUluZGljZXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGVsZXRlIHJlc3VsdC5hcnJheUluZGljZXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gIW1hdGNoZXIuX2lzVXBkYXRlO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfSxcbn07XG5cbi8vIE5COiBXZSBhcmUgY2hlYXRpbmcgYW5kIHVzaW5nIHRoaXMgZnVuY3Rpb24gdG8gaW1wbGVtZW50ICdBTkQnIGZvciBib3RoXG4vLyAnZG9jdW1lbnQgbWF0Y2hlcnMnIGFuZCAnYnJhbmNoZWQgbWF0Y2hlcnMnLiBUaGV5IGJvdGggcmV0dXJuIHJlc3VsdCBvYmplY3RzXG4vLyBidXQgdGhlIGFyZ3VtZW50IGlzIGRpZmZlcmVudDogZm9yIHRoZSBmb3JtZXIgaXQncyBhIHdob2xlIGRvYywgd2hlcmVhcyBmb3Jcbi8vIHRoZSBsYXR0ZXIgaXQncyBhbiBhcnJheSBvZiAnYnJhbmNoZWQgdmFsdWVzJy5cbmZ1bmN0aW9uIGFuZFNvbWVNYXRjaGVycyhzdWJNYXRjaGVycykge1xuICBpZiAoc3ViTWF0Y2hlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGV2ZXJ5dGhpbmdNYXRjaGVyO1xuICB9XG5cbiAgaWYgKHN1Yk1hdGNoZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBzdWJNYXRjaGVyc1swXTtcbiAgfVxuXG4gIHJldHVybiBkb2NPckJyYW5jaGVzID0+IHtcbiAgICBjb25zdCBtYXRjaCA9IHt9O1xuICAgIG1hdGNoLnJlc3VsdCA9IHN1Yk1hdGNoZXJzLmV2ZXJ5KGZuID0+IHtcbiAgICAgIGNvbnN0IHN1YlJlc3VsdCA9IGZuKGRvY09yQnJhbmNoZXMpO1xuXG4gICAgICAvLyBDb3B5IGEgJ2Rpc3RhbmNlJyBudW1iZXIgb3V0IG9mIHRoZSBmaXJzdCBzdWItbWF0Y2hlciB0aGF0IGhhc1xuICAgICAgLy8gb25lLiBZZXMsIHRoaXMgbWVhbnMgdGhhdCBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgJG5lYXIgZmllbGRzIGluIGFcbiAgICAgIC8vIHF1ZXJ5LCBzb21ldGhpbmcgYXJiaXRyYXJ5IGhhcHBlbnM7IHRoaXMgYXBwZWFycyB0byBiZSBjb25zaXN0ZW50IHdpdGhcbiAgICAgIC8vIE1vbmdvLlxuICAgICAgaWYgKHN1YlJlc3VsdC5yZXN1bHQgJiZcbiAgICAgICAgICBzdWJSZXN1bHQuZGlzdGFuY2UgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgIG1hdGNoLmRpc3RhbmNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbWF0Y2guZGlzdGFuY2UgPSBzdWJSZXN1bHQuZGlzdGFuY2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFNpbWlsYXJseSwgcHJvcGFnYXRlIGFycmF5SW5kaWNlcyBmcm9tIHN1Yi1tYXRjaGVycy4uLiBidXQgdG8gbWF0Y2hcbiAgICAgIC8vIE1vbmdvREIgYmVoYXZpb3IsIHRoaXMgdGltZSB0aGUgKmxhc3QqIHN1Yi1tYXRjaGVyIHdpdGggYXJyYXlJbmRpY2VzXG4gICAgICAvLyB3aW5zLlxuICAgICAgaWYgKHN1YlJlc3VsdC5yZXN1bHQgJiYgc3ViUmVzdWx0LmFycmF5SW5kaWNlcykge1xuICAgICAgICBtYXRjaC5hcnJheUluZGljZXMgPSBzdWJSZXN1bHQuYXJyYXlJbmRpY2VzO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc3ViUmVzdWx0LnJlc3VsdDtcbiAgICB9KTtcblxuICAgIC8vIElmIHdlIGRpZG4ndCBhY3R1YWxseSBtYXRjaCwgZm9yZ2V0IGFueSBleHRyYSBtZXRhZGF0YSB3ZSBjYW1lIHVwIHdpdGguXG4gICAgaWYgKCFtYXRjaC5yZXN1bHQpIHtcbiAgICAgIGRlbGV0ZSBtYXRjaC5kaXN0YW5jZTtcbiAgICAgIGRlbGV0ZSBtYXRjaC5hcnJheUluZGljZXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoO1xuICB9O1xufVxuXG5jb25zdCBhbmREb2N1bWVudE1hdGNoZXJzID0gYW5kU29tZU1hdGNoZXJzO1xuY29uc3QgYW5kQnJhbmNoZWRNYXRjaGVycyA9IGFuZFNvbWVNYXRjaGVycztcblxuZnVuY3Rpb24gY29tcGlsZUFycmF5T2ZEb2N1bWVudFNlbGVjdG9ycyhzZWxlY3RvcnMsIG1hdGNoZXIsIGluRWxlbU1hdGNoKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShzZWxlY3RvcnMpIHx8IHNlbGVjdG9ycy5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcignJGFuZC8kb3IvJG5vciBtdXN0IGJlIG5vbmVtcHR5IGFycmF5Jyk7XG4gIH1cblxuICByZXR1cm4gc2VsZWN0b3JzLm1hcChzdWJTZWxlY3RvciA9PiB7XG4gICAgaWYgKCFMb2NhbENvbGxlY3Rpb24uX2lzUGxhaW5PYmplY3Qoc3ViU2VsZWN0b3IpKSB7XG4gICAgICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcignJG9yLyRhbmQvJG5vciBlbnRyaWVzIG5lZWQgdG8gYmUgZnVsbCBvYmplY3RzJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbXBpbGVEb2N1bWVudFNlbGVjdG9yKHN1YlNlbGVjdG9yLCBtYXRjaGVyLCB7aW5FbGVtTWF0Y2h9KTtcbiAgfSk7XG59XG5cbi8vIFRha2VzIGluIGEgc2VsZWN0b3IgdGhhdCBjb3VsZCBtYXRjaCBhIGZ1bGwgZG9jdW1lbnQgKGVnLCB0aGUgb3JpZ2luYWxcbi8vIHNlbGVjdG9yKS4gUmV0dXJucyBhIGZ1bmN0aW9uIG1hcHBpbmcgZG9jdW1lbnQtPnJlc3VsdCBvYmplY3QuXG4vL1xuLy8gbWF0Y2hlciBpcyB0aGUgTWF0Y2hlciBvYmplY3Qgd2UgYXJlIGNvbXBpbGluZy5cbi8vXG4vLyBJZiB0aGlzIGlzIHRoZSByb290IGRvY3VtZW50IHNlbGVjdG9yIChpZSwgbm90IHdyYXBwZWQgaW4gJGFuZCBvciB0aGUgbGlrZSksXG4vLyB0aGVuIGlzUm9vdCBpcyB0cnVlLiAoVGhpcyBpcyB1c2VkIGJ5ICRuZWFyLilcbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlRG9jdW1lbnRTZWxlY3Rvcihkb2NTZWxlY3RvciwgbWF0Y2hlciwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IGRvY01hdGNoZXJzID0gT2JqZWN0LmtleXMoZG9jU2VsZWN0b3IpLm1hcChrZXkgPT4ge1xuICAgIGNvbnN0IHN1YlNlbGVjdG9yID0gZG9jU2VsZWN0b3Jba2V5XTtcblxuICAgIGlmIChrZXkuc3Vic3RyKDAsIDEpID09PSAnJCcpIHtcbiAgICAgIC8vIE91dGVyIG9wZXJhdG9ycyBhcmUgZWl0aGVyIGxvZ2ljYWwgb3BlcmF0b3JzICh0aGV5IHJlY3Vyc2UgYmFjayBpbnRvXG4gICAgICAvLyB0aGlzIGZ1bmN0aW9uKSwgb3IgJHdoZXJlLlxuICAgICAgaWYgKCFoYXNPd24uY2FsbChMT0dJQ0FMX09QRVJBVE9SUywga2V5KSkge1xuICAgICAgICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcihgVW5yZWNvZ25pemVkIGxvZ2ljYWwgb3BlcmF0b3I6ICR7a2V5fWApO1xuICAgICAgfVxuXG4gICAgICBtYXRjaGVyLl9pc1NpbXBsZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIExPR0lDQUxfT1BFUkFUT1JTW2tleV0oc3ViU2VsZWN0b3IsIG1hdGNoZXIsIG9wdGlvbnMuaW5FbGVtTWF0Y2gpO1xuICAgIH1cblxuICAgIC8vIFJlY29yZCB0aGlzIHBhdGgsIGJ1dCBvbmx5IGlmIHdlIGFyZW4ndCBpbiBhbiBlbGVtTWF0Y2hlciwgc2luY2UgaW4gYW5cbiAgICAvLyBlbGVtTWF0Y2ggdGhpcyBpcyBhIHBhdGggaW5zaWRlIGFuIG9iamVjdCBpbiBhbiBhcnJheSwgbm90IGluIHRoZSBkb2NcbiAgICAvLyByb290LlxuICAgIGlmICghb3B0aW9ucy5pbkVsZW1NYXRjaCkge1xuICAgICAgbWF0Y2hlci5fcmVjb3JkUGF0aFVzZWQoa2V5KTtcbiAgICB9XG5cbiAgICAvLyBEb24ndCBhZGQgYSBtYXRjaGVyIGlmIHN1YlNlbGVjdG9yIGlzIGEgZnVuY3Rpb24gLS0gdGhpcyBpcyB0byBtYXRjaFxuICAgIC8vIHRoZSBiZWhhdmlvciBvZiBNZXRlb3Igb24gdGhlIHNlcnZlciAoaW5oZXJpdGVkIGZyb20gdGhlIG5vZGUgbW9uZ29kYlxuICAgIC8vIGRyaXZlciksIHdoaWNoIGlzIHRvIGlnbm9yZSBhbnkgcGFydCBvZiBhIHNlbGVjdG9yIHdoaWNoIGlzIGEgZnVuY3Rpb24uXG4gICAgaWYgKHR5cGVvZiBzdWJTZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCBsb29rVXBCeUluZGV4ID0gbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSk7XG4gICAgY29uc3QgdmFsdWVNYXRjaGVyID0gY29tcGlsZVZhbHVlU2VsZWN0b3IoXG4gICAgICBzdWJTZWxlY3RvcixcbiAgICAgIG1hdGNoZXIsXG4gICAgICBvcHRpb25zLmlzUm9vdFxuICAgICk7XG5cbiAgICByZXR1cm4gZG9jID0+IHZhbHVlTWF0Y2hlcihsb29rVXBCeUluZGV4KGRvYykpO1xuICB9KS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgcmV0dXJuIGFuZERvY3VtZW50TWF0Y2hlcnMoZG9jTWF0Y2hlcnMpO1xufVxuXG4vLyBUYWtlcyBpbiBhIHNlbGVjdG9yIHRoYXQgY291bGQgbWF0Y2ggYSBrZXktaW5kZXhlZCB2YWx1ZSBpbiBhIGRvY3VtZW50OyBlZyxcbi8vIHskZ3Q6IDUsICRsdDogOX0sIG9yIGEgcmVndWxhciBleHByZXNzaW9uLCBvciBhbnkgbm9uLWV4cHJlc3Npb24gb2JqZWN0ICh0b1xuLy8gaW5kaWNhdGUgZXF1YWxpdHkpLiAgUmV0dXJucyBhIGJyYW5jaGVkIG1hdGNoZXI6IGEgZnVuY3Rpb24gbWFwcGluZ1xuLy8gW2JyYW5jaGVkIHZhbHVlXS0+cmVzdWx0IG9iamVjdC5cbmZ1bmN0aW9uIGNvbXBpbGVWYWx1ZVNlbGVjdG9yKHZhbHVlU2VsZWN0b3IsIG1hdGNoZXIsIGlzUm9vdCkge1xuICBpZiAodmFsdWVTZWxlY3RvciBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgIG1hdGNoZXIuX2lzU2ltcGxlID0gZmFsc2U7XG4gICAgcmV0dXJuIGNvbnZlcnRFbGVtZW50TWF0Y2hlclRvQnJhbmNoZWRNYXRjaGVyKFxuICAgICAgcmVnZXhwRWxlbWVudE1hdGNoZXIodmFsdWVTZWxlY3RvcilcbiAgICApO1xuICB9XG5cbiAgaWYgKGlzT3BlcmF0b3JPYmplY3QodmFsdWVTZWxlY3RvcikpIHtcbiAgICByZXR1cm4gb3BlcmF0b3JCcmFuY2hlZE1hdGNoZXIodmFsdWVTZWxlY3RvciwgbWF0Y2hlciwgaXNSb290KTtcbiAgfVxuXG4gIHJldHVybiBjb252ZXJ0RWxlbWVudE1hdGNoZXJUb0JyYW5jaGVkTWF0Y2hlcihcbiAgICBlcXVhbGl0eUVsZW1lbnRNYXRjaGVyKHZhbHVlU2VsZWN0b3IpXG4gICk7XG59XG5cbi8vIEdpdmVuIGFuIGVsZW1lbnQgbWF0Y2hlciAod2hpY2ggZXZhbHVhdGVzIGEgc2luZ2xlIHZhbHVlKSwgcmV0dXJucyBhIGJyYW5jaGVkXG4vLyB2YWx1ZSAod2hpY2ggZXZhbHVhdGVzIHRoZSBlbGVtZW50IG1hdGNoZXIgb24gYWxsIHRoZSBicmFuY2hlcyBhbmQgcmV0dXJucyBhXG4vLyBtb3JlIHN0cnVjdHVyZWQgcmV0dXJuIHZhbHVlIHBvc3NpYmx5IGluY2x1ZGluZyBhcnJheUluZGljZXMpLlxuZnVuY3Rpb24gY29udmVydEVsZW1lbnRNYXRjaGVyVG9CcmFuY2hlZE1hdGNoZXIoZWxlbWVudE1hdGNoZXIsIG9wdGlvbnMgPSB7fSkge1xuICByZXR1cm4gYnJhbmNoZXMgPT4ge1xuICAgIGNvbnN0IGV4cGFuZGVkID0gb3B0aW9ucy5kb250RXhwYW5kTGVhZkFycmF5c1xuICAgICAgPyBicmFuY2hlc1xuICAgICAgOiBleHBhbmRBcnJheXNJbkJyYW5jaGVzKGJyYW5jaGVzLCBvcHRpb25zLmRvbnRJbmNsdWRlTGVhZkFycmF5cyk7XG5cbiAgICBjb25zdCBtYXRjaCA9IHt9O1xuICAgIG1hdGNoLnJlc3VsdCA9IGV4cGFuZGVkLnNvbWUoZWxlbWVudCA9PiB7XG4gICAgICBsZXQgbWF0Y2hlZCA9IGVsZW1lbnRNYXRjaGVyKGVsZW1lbnQudmFsdWUpO1xuXG4gICAgICAvLyBTcGVjaWFsIGNhc2UgZm9yICRlbGVtTWF0Y2g6IGl0IG1lYW5zIFwidHJ1ZSwgYW5kIHVzZSB0aGlzIGFzIGFuIGFycmF5XG4gICAgICAvLyBpbmRleCBpZiBJIGRpZG4ndCBhbHJlYWR5IGhhdmUgb25lXCIuXG4gICAgICBpZiAodHlwZW9mIG1hdGNoZWQgPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIFhYWCBUaGlzIGNvZGUgZGF0ZXMgZnJvbSB3aGVuIHdlIG9ubHkgc3RvcmVkIGEgc2luZ2xlIGFycmF5IGluZGV4XG4gICAgICAgIC8vIChmb3IgdGhlIG91dGVybW9zdCBhcnJheSkuIFNob3VsZCB3ZSBiZSBhbHNvIGluY2x1ZGluZyBkZWVwZXIgYXJyYXlcbiAgICAgICAgLy8gaW5kaWNlcyBmcm9tIHRoZSAkZWxlbU1hdGNoIG1hdGNoP1xuICAgICAgICBpZiAoIWVsZW1lbnQuYXJyYXlJbmRpY2VzKSB7XG4gICAgICAgICAgZWxlbWVudC5hcnJheUluZGljZXMgPSBbbWF0Y2hlZF07XG4gICAgICAgIH1cblxuICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgc29tZSBlbGVtZW50IG1hdGNoZWQsIGFuZCBpdCdzIHRhZ2dlZCB3aXRoIGFycmF5IGluZGljZXMsIGluY2x1ZGVcbiAgICAgIC8vIHRob3NlIGluZGljZXMgaW4gb3VyIHJlc3VsdCBvYmplY3QuXG4gICAgICBpZiAobWF0Y2hlZCAmJiBlbGVtZW50LmFycmF5SW5kaWNlcykge1xuICAgICAgICBtYXRjaC5hcnJheUluZGljZXMgPSBlbGVtZW50LmFycmF5SW5kaWNlcztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1hdGNoZWQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWF0Y2g7XG4gIH07XG59XG5cbi8vIEhlbHBlcnMgZm9yICRuZWFyLlxuZnVuY3Rpb24gZGlzdGFuY2VDb29yZGluYXRlUGFpcnMoYSwgYikge1xuICBjb25zdCBwb2ludEEgPSBwb2ludFRvQXJyYXkoYSk7XG4gIGNvbnN0IHBvaW50QiA9IHBvaW50VG9BcnJheShiKTtcblxuICByZXR1cm4gTWF0aC5oeXBvdChwb2ludEFbMF0gLSBwb2ludEJbMF0sIHBvaW50QVsxXSAtIHBvaW50QlsxXSk7XG59XG5cbi8vIFRha2VzIHNvbWV0aGluZyB0aGF0IGlzIG5vdCBhbiBvcGVyYXRvciBvYmplY3QgYW5kIHJldHVybnMgYW4gZWxlbWVudCBtYXRjaGVyXG4vLyBmb3IgZXF1YWxpdHkgd2l0aCB0aGF0IHRoaW5nLlxuZXhwb3J0IGZ1bmN0aW9uIGVxdWFsaXR5RWxlbWVudE1hdGNoZXIoZWxlbWVudFNlbGVjdG9yKSB7XG4gIGlmIChpc09wZXJhdG9yT2JqZWN0KGVsZW1lbnRTZWxlY3RvcikpIHtcbiAgICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcignQ2FuXFwndCBjcmVhdGUgZXF1YWxpdHlWYWx1ZVNlbGVjdG9yIGZvciBvcGVyYXRvciBvYmplY3QnKTtcbiAgfVxuXG4gIC8vIFNwZWNpYWwtY2FzZTogbnVsbCBhbmQgdW5kZWZpbmVkIGFyZSBlcXVhbCAoaWYgeW91IGdvdCB1bmRlZmluZWQgaW4gdGhlcmVcbiAgLy8gc29tZXdoZXJlLCBvciBpZiB5b3UgZ290IGl0IGR1ZSB0byBzb21lIGJyYW5jaCBiZWluZyBub24tZXhpc3RlbnQgaW4gdGhlXG4gIC8vIHdlaXJkIHNwZWNpYWwgY2FzZSksIGV2ZW4gdGhvdWdoIHRoZXkgYXJlbid0IHdpdGggRUpTT04uZXF1YWxzLlxuICAvLyB1bmRlZmluZWQgb3IgbnVsbFxuICBpZiAoZWxlbWVudFNlbGVjdG9yID09IG51bGwpIHtcbiAgICByZXR1cm4gdmFsdWUgPT4gdmFsdWUgPT0gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZSA9PiBMb2NhbENvbGxlY3Rpb24uX2YuX2VxdWFsKGVsZW1lbnRTZWxlY3RvciwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBldmVyeXRoaW5nTWF0Y2hlcihkb2NPckJyYW5jaGVkVmFsdWVzKSB7XG4gIHJldHVybiB7cmVzdWx0OiB0cnVlfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cGFuZEFycmF5c0luQnJhbmNoZXMoYnJhbmNoZXMsIHNraXBUaGVBcnJheXMpIHtcbiAgY29uc3QgYnJhbmNoZXNPdXQgPSBbXTtcblxuICBicmFuY2hlcy5mb3JFYWNoKGJyYW5jaCA9PiB7XG4gICAgY29uc3QgdGhpc0lzQXJyYXkgPSBBcnJheS5pc0FycmF5KGJyYW5jaC52YWx1ZSk7XG5cbiAgICAvLyBXZSBpbmNsdWRlIHRoZSBicmFuY2ggaXRzZWxmLCAqVU5MRVNTKiB3ZSBpdCdzIGFuIGFycmF5IHRoYXQgd2UncmUgZ29pbmdcbiAgICAvLyB0byBpdGVyYXRlIGFuZCB3ZSdyZSB0b2xkIHRvIHNraXAgYXJyYXlzLiAgKFRoYXQncyByaWdodCwgd2UgaW5jbHVkZSBzb21lXG4gICAgLy8gYXJyYXlzIGV2ZW4gc2tpcFRoZUFycmF5cyBpcyB0cnVlOiB0aGVzZSBhcmUgYXJyYXlzIHRoYXQgd2VyZSBmb3VuZCB2aWFcbiAgICAvLyBleHBsaWNpdCBudW1lcmljYWwgaW5kaWNlcy4pXG4gICAgaWYgKCEoc2tpcFRoZUFycmF5cyAmJiB0aGlzSXNBcnJheSAmJiAhYnJhbmNoLmRvbnRJdGVyYXRlKSkge1xuICAgICAgYnJhbmNoZXNPdXQucHVzaCh7YXJyYXlJbmRpY2VzOiBicmFuY2guYXJyYXlJbmRpY2VzLCB2YWx1ZTogYnJhbmNoLnZhbHVlfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXNJc0FycmF5ICYmICFicmFuY2guZG9udEl0ZXJhdGUpIHtcbiAgICAgIGJyYW5jaC52YWx1ZS5mb3JFYWNoKCh2YWx1ZSwgaSkgPT4ge1xuICAgICAgICBicmFuY2hlc091dC5wdXNoKHtcbiAgICAgICAgICBhcnJheUluZGljZXM6IChicmFuY2guYXJyYXlJbmRpY2VzIHx8IFtdKS5jb25jYXQoaSksXG4gICAgICAgICAgdmFsdWVcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBicmFuY2hlc091dDtcbn1cblxuLy8gSGVscGVycyBmb3IgJGJpdHNBbGxTZXQvJGJpdHNBbnlTZXQvJGJpdHNBbGxDbGVhci8kYml0c0FueUNsZWFyLlxuZnVuY3Rpb24gZ2V0T3BlcmFuZEJpdG1hc2sob3BlcmFuZCwgc2VsZWN0b3IpIHtcbiAgLy8gbnVtZXJpYyBiaXRtYXNrXG4gIC8vIFlvdSBjYW4gcHJvdmlkZSBhIG51bWVyaWMgYml0bWFzayB0byBiZSBtYXRjaGVkIGFnYWluc3QgdGhlIG9wZXJhbmQgZmllbGQuXG4gIC8vIEl0IG11c3QgYmUgcmVwcmVzZW50YWJsZSBhcyBhIG5vbi1uZWdhdGl2ZSAzMi1iaXQgc2lnbmVkIGludGVnZXIuXG4gIC8vIE90aGVyd2lzZSwgJGJpdHNBbGxTZXQgd2lsbCByZXR1cm4gYW4gZXJyb3IuXG4gIGlmIChOdW1iZXIuaXNJbnRlZ2VyKG9wZXJhbmQpICYmIG9wZXJhbmQgPj0gMCkge1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShuZXcgSW50MzJBcnJheShbb3BlcmFuZF0pLmJ1ZmZlcik7XG4gIH1cblxuICAvLyBiaW5kYXRhIGJpdG1hc2tcbiAgLy8gWW91IGNhbiBhbHNvIHVzZSBhbiBhcmJpdHJhcmlseSBsYXJnZSBCaW5EYXRhIGluc3RhbmNlIGFzIGEgYml0bWFzay5cbiAgaWYgKEVKU09OLmlzQmluYXJ5KG9wZXJhbmQpKSB7XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KG9wZXJhbmQuYnVmZmVyKTtcbiAgfVxuXG4gIC8vIHBvc2l0aW9uIGxpc3RcbiAgLy8gSWYgcXVlcnlpbmcgYSBsaXN0IG9mIGJpdCBwb3NpdGlvbnMsIGVhY2ggPHBvc2l0aW9uPiBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlXG4gIC8vIGludGVnZXIuIEJpdCBwb3NpdGlvbnMgc3RhcnQgYXQgMCBmcm9tIHRoZSBsZWFzdCBzaWduaWZpY2FudCBiaXQuXG4gIGlmIChBcnJheS5pc0FycmF5KG9wZXJhbmQpICYmXG4gICAgICBvcGVyYW5kLmV2ZXJ5KHggPT4gTnVtYmVyLmlzSW50ZWdlcih4KSAmJiB4ID49IDApKSB7XG4gICAgY29uc3QgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKChNYXRoLm1heCguLi5vcGVyYW5kKSA+PiAzKSArIDEpO1xuICAgIGNvbnN0IHZpZXcgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuXG4gICAgb3BlcmFuZC5mb3JFYWNoKHggPT4ge1xuICAgICAgdmlld1t4ID4+IDNdIHw9IDEgPDwgKHggJiAweDcpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHZpZXc7XG4gIH1cblxuICAvLyBiYWQgb3BlcmFuZFxuICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcihcbiAgICBgb3BlcmFuZCB0byAke3NlbGVjdG9yfSBtdXN0IGJlIGEgbnVtZXJpYyBiaXRtYXNrIChyZXByZXNlbnRhYmxlIGFzIGEgYCArXG4gICAgJ25vbi1uZWdhdGl2ZSAzMi1iaXQgc2lnbmVkIGludGVnZXIpLCBhIGJpbmRhdGEgYml0bWFzayBvciBhbiBhcnJheSB3aXRoICcgK1xuICAgICdiaXQgcG9zaXRpb25zIChub24tbmVnYXRpdmUgaW50ZWdlcnMpJ1xuICApO1xufVxuXG5mdW5jdGlvbiBnZXRWYWx1ZUJpdG1hc2sodmFsdWUsIGxlbmd0aCkge1xuICAvLyBUaGUgZmllbGQgdmFsdWUgbXVzdCBiZSBlaXRoZXIgbnVtZXJpY2FsIG9yIGEgQmluRGF0YSBpbnN0YW5jZS4gT3RoZXJ3aXNlLFxuICAvLyAkYml0cy4uLiB3aWxsIG5vdCBtYXRjaCB0aGUgY3VycmVudCBkb2N1bWVudC5cblxuICAvLyBudW1lcmljYWxcbiAgaWYgKE51bWJlci5pc1NhZmVJbnRlZ2VyKHZhbHVlKSkge1xuICAgIC8vICRiaXRzLi4uIHdpbGwgbm90IG1hdGNoIG51bWVyaWNhbCB2YWx1ZXMgdGhhdCBjYW5ub3QgYmUgcmVwcmVzZW50ZWQgYXMgYVxuICAgIC8vIHNpZ25lZCA2NC1iaXQgaW50ZWdlci4gVGhpcyBjYW4gYmUgdGhlIGNhc2UgaWYgYSB2YWx1ZSBpcyBlaXRoZXIgdG9vXG4gICAgLy8gbGFyZ2Ugb3Igc21hbGwgdG8gZml0IGluIGEgc2lnbmVkIDY0LWJpdCBpbnRlZ2VyLCBvciBpZiBpdCBoYXMgYVxuICAgIC8vIGZyYWN0aW9uYWwgY29tcG9uZW50LlxuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihcbiAgICAgIE1hdGgubWF4KGxlbmd0aCwgMiAqIFVpbnQzMkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UKVxuICAgICk7XG5cbiAgICBsZXQgdmlldyA9IG5ldyBVaW50MzJBcnJheShidWZmZXIsIDAsIDIpO1xuICAgIHZpZXdbMF0gPSB2YWx1ZSAlICgoMSA8PCAxNikgKiAoMSA8PCAxNikpIHwgMDtcbiAgICB2aWV3WzFdID0gdmFsdWUgLyAoKDEgPDwgMTYpICogKDEgPDwgMTYpKSB8IDA7XG5cbiAgICAvLyBzaWduIGV4dGVuc2lvblxuICAgIGlmICh2YWx1ZSA8IDApIHtcbiAgICAgIHZpZXcgPSBuZXcgVWludDhBcnJheShidWZmZXIsIDIpO1xuICAgICAgdmlldy5mb3JFYWNoKChieXRlLCBpKSA9PiB7XG4gICAgICAgIHZpZXdbaV0gPSAweGZmO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gIH1cblxuICAvLyBiaW5kYXRhXG4gIGlmIChFSlNPTi5pc0JpbmFyeSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkodmFsdWUuYnVmZmVyKTtcbiAgfVxuXG4gIC8vIG5vIG1hdGNoXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8gQWN0dWFsbHkgaW5zZXJ0cyBhIGtleSB2YWx1ZSBpbnRvIHRoZSBzZWxlY3RvciBkb2N1bWVudFxuLy8gSG93ZXZlciwgdGhpcyBjaGVja3MgdGhlcmUgaXMgbm8gYW1iaWd1aXR5IGluIHNldHRpbmdcbi8vIHRoZSB2YWx1ZSBmb3IgdGhlIGdpdmVuIGtleSwgdGhyb3dzIG90aGVyd2lzZVxuZnVuY3Rpb24gaW5zZXJ0SW50b0RvY3VtZW50KGRvY3VtZW50LCBrZXksIHZhbHVlKSB7XG4gIE9iamVjdC5rZXlzKGRvY3VtZW50KS5mb3JFYWNoKGV4aXN0aW5nS2V5ID0+IHtcbiAgICBpZiAoXG4gICAgICAoZXhpc3RpbmdLZXkubGVuZ3RoID4ga2V5Lmxlbmd0aCAmJiBleGlzdGluZ0tleS5pbmRleE9mKGAke2tleX0uYCkgPT09IDApIHx8XG4gICAgICAoa2V5Lmxlbmd0aCA+IGV4aXN0aW5nS2V5Lmxlbmd0aCAmJiBrZXkuaW5kZXhPZihgJHtleGlzdGluZ0tleX0uYCkgPT09IDApXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcihcbiAgICAgICAgYGNhbm5vdCBpbmZlciBxdWVyeSBmaWVsZHMgdG8gc2V0LCBib3RoIHBhdGhzICcke2V4aXN0aW5nS2V5fScgYW5kICcke2tleX0nIGFyZSBtYXRjaGVkYFxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKGV4aXN0aW5nS2V5ID09PSBrZXkpIHtcbiAgICAgIHRocm93IG5ldyBNaW5pTW9uZ29RdWVyeUVycm9yKFxuICAgICAgICBgY2Fubm90IGluZmVyIHF1ZXJ5IGZpZWxkcyB0byBzZXQsIHBhdGggJyR7a2V5fScgaXMgbWF0Y2hlZCB0d2ljZWBcbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICBkb2N1bWVudFtrZXldID0gdmFsdWU7XG59XG5cbi8vIFJldHVybnMgYSBicmFuY2hlZCBtYXRjaGVyIHRoYXQgbWF0Y2hlcyBpZmYgdGhlIGdpdmVuIG1hdGNoZXIgZG9lcyBub3QuXG4vLyBOb3RlIHRoYXQgdGhpcyBpbXBsaWNpdGx5IFwiZGVNb3JnYW5pemVzXCIgdGhlIHdyYXBwZWQgZnVuY3Rpb24uICBpZSwgaXRcbi8vIG1lYW5zIHRoYXQgQUxMIGJyYW5jaCB2YWx1ZXMgbmVlZCB0byBmYWlsIHRvIG1hdGNoIGlubmVyQnJhbmNoZWRNYXRjaGVyLlxuZnVuY3Rpb24gaW52ZXJ0QnJhbmNoZWRNYXRjaGVyKGJyYW5jaGVkTWF0Y2hlcikge1xuICByZXR1cm4gYnJhbmNoVmFsdWVzID0+IHtcbiAgICAvLyBXZSBleHBsaWNpdGx5IGNob29zZSB0byBzdHJpcCBhcnJheUluZGljZXMgaGVyZTogaXQgZG9lc24ndCBtYWtlIHNlbnNlIHRvXG4gICAgLy8gc2F5IFwidXBkYXRlIHRoZSBhcnJheSBlbGVtZW50IHRoYXQgZG9lcyBub3QgbWF0Y2ggc29tZXRoaW5nXCIsIGF0IGxlYXN0XG4gICAgLy8gaW4gbW9uZ28tbGFuZC5cbiAgICByZXR1cm4ge3Jlc3VsdDogIWJyYW5jaGVkTWF0Y2hlcihicmFuY2hWYWx1ZXMpLnJlc3VsdH07XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0luZGV4YWJsZShvYmopIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkob2JqKSB8fCBMb2NhbENvbGxlY3Rpb24uX2lzUGxhaW5PYmplY3Qob2JqKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVtZXJpY0tleShzKSB7XG4gIHJldHVybiAvXlswLTldKyQvLnRlc3Qocyk7XG59XG5cbi8vIFJldHVybnMgdHJ1ZSBpZiB0aGlzIGlzIGFuIG9iamVjdCB3aXRoIGF0IGxlYXN0IG9uZSBrZXkgYW5kIGFsbCBrZXlzIGJlZ2luXG4vLyB3aXRoICQuICBVbmxlc3MgaW5jb25zaXN0ZW50T0sgaXMgc2V0LCB0aHJvd3MgaWYgc29tZSBrZXlzIGJlZ2luIHdpdGggJCBhbmRcbi8vIG90aGVycyBkb24ndC5cbmV4cG9ydCBmdW5jdGlvbiBpc09wZXJhdG9yT2JqZWN0KHZhbHVlU2VsZWN0b3IsIGluY29uc2lzdGVudE9LKSB7XG4gIGlmICghTG9jYWxDb2xsZWN0aW9uLl9pc1BsYWluT2JqZWN0KHZhbHVlU2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgbGV0IHRoZXNlQXJlT3BlcmF0b3JzID0gdW5kZWZpbmVkO1xuICBPYmplY3Qua2V5cyh2YWx1ZVNlbGVjdG9yKS5mb3JFYWNoKHNlbEtleSA9PiB7XG4gICAgY29uc3QgdGhpc0lzT3BlcmF0b3IgPSBzZWxLZXkuc3Vic3RyKDAsIDEpID09PSAnJCcgfHwgc2VsS2V5ID09PSAnZGlmZic7XG5cbiAgICBpZiAodGhlc2VBcmVPcGVyYXRvcnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhlc2VBcmVPcGVyYXRvcnMgPSB0aGlzSXNPcGVyYXRvcjtcbiAgICB9IGVsc2UgaWYgKHRoZXNlQXJlT3BlcmF0b3JzICE9PSB0aGlzSXNPcGVyYXRvcikge1xuICAgICAgaWYgKCFpbmNvbnNpc3RlbnRPSykge1xuICAgICAgICB0aHJvdyBuZXcgTWluaU1vbmdvUXVlcnlFcnJvcihcbiAgICAgICAgICBgSW5jb25zaXN0ZW50IG9wZXJhdG9yOiAke0pTT04uc3RyaW5naWZ5KHZhbHVlU2VsZWN0b3IpfWBcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgdGhlc2VBcmVPcGVyYXRvcnMgPSBmYWxzZTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiAhIXRoZXNlQXJlT3BlcmF0b3JzOyAvLyB7fSBoYXMgbm8gb3BlcmF0b3JzXG59XG5cbi8vIEhlbHBlciBmb3IgJGx0LyRndC8kbHRlLyRndGUuXG5mdW5jdGlvbiBtYWtlSW5lcXVhbGl0eShjbXBWYWx1ZUNvbXBhcmF0b3IpIHtcbiAgcmV0dXJuIHtcbiAgICBjb21waWxlRWxlbWVudFNlbGVjdG9yKG9wZXJhbmQpIHtcbiAgICAgIC8vIEFycmF5cyBuZXZlciBjb21wYXJlIGZhbHNlIHdpdGggbm9uLWFycmF5cyBmb3IgYW55IGluZXF1YWxpdHkuXG4gICAgICAvLyBYWFggVGhpcyB3YXMgYmVoYXZpb3Igd2Ugb2JzZXJ2ZWQgaW4gcHJlLXJlbGVhc2UgTW9uZ29EQiAyLjUsIGJ1dFxuICAgICAgLy8gICAgIGl0IHNlZW1zIHRvIGhhdmUgYmVlbiByZXZlcnRlZC5cbiAgICAgIC8vICAgICBTZWUgaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItMTE0NDRcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wZXJhbmQpKSB7XG4gICAgICAgIHJldHVybiAoKSA9PiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gU3BlY2lhbCBjYXNlOiBjb25zaWRlciB1bmRlZmluZWQgYW5kIG51bGwgdGhlIHNhbWUgKHNvIHRydWUgd2l0aFxuICAgICAgLy8gJGd0ZS8kbHRlKS5cbiAgICAgIGlmIChvcGVyYW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgb3BlcmFuZCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG9wZXJhbmRUeXBlID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKG9wZXJhbmQpO1xuXG4gICAgICByZXR1cm4gdmFsdWUgPT4ge1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbXBhcmlzb25zIGFyZSBuZXZlciB0cnVlIGFtb25nIHRoaW5ncyBvZiBkaWZmZXJlbnQgdHlwZSAoZXhjZXB0XG4gICAgICAgIC8vIG51bGwgdnMgdW5kZWZpbmVkKS5cbiAgICAgICAgaWYgKExvY2FsQ29sbGVjdGlvbi5fZi5fdHlwZSh2YWx1ZSkgIT09IG9wZXJhbmRUeXBlKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNtcFZhbHVlQ29tcGFyYXRvcihMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh2YWx1ZSwgb3BlcmFuZCkpO1xuICAgICAgfTtcbiAgICB9LFxuICB9O1xufVxuXG4vLyBtYWtlTG9va3VwRnVuY3Rpb24oa2V5KSByZXR1cm5zIGEgbG9va3VwIGZ1bmN0aW9uLlxuLy9cbi8vIEEgbG9va3VwIGZ1bmN0aW9uIHRha2VzIGluIGEgZG9jdW1lbnQgYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgbWF0Y2hpbmdcbi8vIGJyYW5jaGVzLiAgSWYgbm8gYXJyYXlzIGFyZSBmb3VuZCB3aGlsZSBsb29raW5nIHVwIHRoZSBrZXksIHRoaXMgYXJyYXkgd2lsbFxuLy8gaGF2ZSBleGFjdGx5IG9uZSBicmFuY2hlcyAocG9zc2libHkgJ3VuZGVmaW5lZCcsIGlmIHNvbWUgc2VnbWVudCBvZiB0aGUga2V5XG4vLyB3YXMgbm90IGZvdW5kKS5cbi8vXG4vLyBJZiBhcnJheXMgYXJlIGZvdW5kIGluIHRoZSBtaWRkbGUsIHRoaXMgY2FuIGhhdmUgbW9yZSB0aGFuIG9uZSBlbGVtZW50LCBzaW5jZVxuLy8gd2UgJ2JyYW5jaCcuIFdoZW4gd2UgJ2JyYW5jaCcsIGlmIHRoZXJlIGFyZSBtb3JlIGtleSBzZWdtZW50cyB0byBsb29rIHVwLFxuLy8gdGhlbiB3ZSBvbmx5IHB1cnN1ZSBicmFuY2hlcyB0aGF0IGFyZSBwbGFpbiBvYmplY3RzIChub3QgYXJyYXlzIG9yIHNjYWxhcnMpLlxuLy8gVGhpcyBtZWFucyB3ZSBjYW4gYWN0dWFsbHkgZW5kIHVwIHdpdGggbm8gYnJhbmNoZXMhXG4vL1xuLy8gV2UgZG8gKk5PVCogYnJhbmNoIG9uIGFycmF5cyB0aGF0IGFyZSBmb3VuZCBhdCB0aGUgZW5kIChpZSwgYXQgdGhlIGxhc3Rcbi8vIGRvdHRlZCBtZW1iZXIgb2YgdGhlIGtleSkuIFdlIGp1c3QgcmV0dXJuIHRoYXQgYXJyYXk7IGlmIHlvdSB3YW50IHRvXG4vLyBlZmZlY3RpdmVseSAnYnJhbmNoJyBvdmVyIHRoZSBhcnJheSdzIHZhbHVlcywgcG9zdC1wcm9jZXNzIHRoZSBsb29rdXBcbi8vIGZ1bmN0aW9uIHdpdGggZXhwYW5kQXJyYXlzSW5CcmFuY2hlcy5cbi8vXG4vLyBFYWNoIGJyYW5jaCBpcyBhbiBvYmplY3Qgd2l0aCBrZXlzOlxuLy8gIC0gdmFsdWU6IHRoZSB2YWx1ZSBhdCB0aGUgYnJhbmNoXG4vLyAgLSBkb250SXRlcmF0ZTogYW4gb3B0aW9uYWwgYm9vbDsgaWYgdHJ1ZSwgaXQgbWVhbnMgdGhhdCAndmFsdWUnIGlzIGFuIGFycmF5XG4vLyAgICB0aGF0IGV4cGFuZEFycmF5c0luQnJhbmNoZXMgc2hvdWxkIE5PVCBleHBhbmQuIFRoaXMgc3BlY2lmaWNhbGx5IGhhcHBlbnNcbi8vICAgIHdoZW4gdGhlcmUgaXMgYSBudW1lcmljIGluZGV4IGluIHRoZSBrZXksIGFuZCBlbnN1cmVzIHRoZVxuLy8gICAgcGVyaGFwcy1zdXJwcmlzaW5nIE1vbmdvREIgYmVoYXZpb3Igd2hlcmUgeydhLjAnOiA1fSBkb2VzIE5PVFxuLy8gICAgbWF0Y2gge2E6IFtbNV1dfS5cbi8vICAtIGFycmF5SW5kaWNlczogaWYgYW55IGFycmF5IGluZGV4aW5nIHdhcyBkb25lIGR1cmluZyBsb29rdXAgKGVpdGhlciBkdWUgdG9cbi8vICAgIGV4cGxpY2l0IG51bWVyaWMgaW5kaWNlcyBvciBpbXBsaWNpdCBicmFuY2hpbmcpLCB0aGlzIHdpbGwgYmUgYW4gYXJyYXkgb2Zcbi8vICAgIHRoZSBhcnJheSBpbmRpY2VzIHVzZWQsIGZyb20gb3V0ZXJtb3N0IHRvIGlubmVybW9zdDsgaXQgaXMgZmFsc2V5IG9yXG4vLyAgICBhYnNlbnQgaWYgbm8gYXJyYXkgaW5kZXggaXMgdXNlZC4gSWYgYW4gZXhwbGljaXQgbnVtZXJpYyBpbmRleCBpcyB1c2VkLFxuLy8gICAgdGhlIGluZGV4IHdpbGwgYmUgZm9sbG93ZWQgaW4gYXJyYXlJbmRpY2VzIGJ5IHRoZSBzdHJpbmcgJ3gnLlxuLy9cbi8vICAgIE5vdGU6IGFycmF5SW5kaWNlcyBpcyB1c2VkIGZvciB0d28gcHVycG9zZXMuIEZpcnN0LCBpdCBpcyB1c2VkIHRvXG4vLyAgICBpbXBsZW1lbnQgdGhlICckJyBtb2RpZmllciBmZWF0dXJlLCB3aGljaCBvbmx5IGV2ZXIgbG9va3MgYXQgaXRzIGZpcnN0XG4vLyAgICBlbGVtZW50LlxuLy9cbi8vICAgIFNlY29uZCwgaXQgaXMgdXNlZCBmb3Igc29ydCBrZXkgZ2VuZXJhdGlvbiwgd2hpY2ggbmVlZHMgdG8gYmUgYWJsZSB0byB0ZWxsXG4vLyAgICB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIGRpZmZlcmVudCBwYXRocy4gTW9yZW92ZXIsIGl0IG5lZWRzIHRvXG4vLyAgICBkaWZmZXJlbnRpYXRlIGJldHdlZW4gZXhwbGljaXQgYW5kIGltcGxpY2l0IGJyYW5jaGluZywgd2hpY2ggaXMgd2h5XG4vLyAgICB0aGVyZSdzIHRoZSBzb21ld2hhdCBoYWNreSAneCcgZW50cnk6IHRoaXMgbWVhbnMgdGhhdCBleHBsaWNpdCBhbmRcbi8vICAgIGltcGxpY2l0IGFycmF5IGxvb2t1cHMgd2lsbCBoYXZlIGRpZmZlcmVudCBmdWxsIGFycmF5SW5kaWNlcyBwYXRocy4gKFRoYXRcbi8vICAgIGNvZGUgb25seSByZXF1aXJlcyB0aGF0IGRpZmZlcmVudCBwYXRocyBoYXZlIGRpZmZlcmVudCBhcnJheUluZGljZXM7IGl0XG4vLyAgICBkb2Vzbid0IGFjdHVhbGx5ICdwYXJzZScgYXJyYXlJbmRpY2VzLiBBcyBhbiBhbHRlcm5hdGl2ZSwgYXJyYXlJbmRpY2VzXG4vLyAgICBjb3VsZCBjb250YWluIG9iamVjdHMgd2l0aCBmbGFncyBsaWtlICdpbXBsaWNpdCcsIGJ1dCBJIHRoaW5rIHRoYXQgb25seVxuLy8gICAgbWFrZXMgdGhlIGNvZGUgc3Vycm91bmRpbmcgdGhlbSBtb3JlIGNvbXBsZXguKVxuLy9cbi8vICAgIChCeSB0aGUgd2F5LCB0aGlzIGZpZWxkIGVuZHMgdXAgZ2V0dGluZyBwYXNzZWQgYXJvdW5kIGEgbG90IHdpdGhvdXRcbi8vICAgIGNsb25pbmcsIHNvIG5ldmVyIG11dGF0ZSBhbnkgYXJyYXlJbmRpY2VzIGZpZWxkL3ZhciBpbiB0aGlzIHBhY2thZ2UhKVxuLy9cbi8vXG4vLyBBdCB0aGUgdG9wIGxldmVsLCB5b3UgbWF5IG9ubHkgcGFzcyBpbiBhIHBsYWluIG9iamVjdCBvciBhcnJheS5cbi8vXG4vLyBTZWUgdGhlIHRlc3QgJ21pbmltb25nbyAtIGxvb2t1cCcgZm9yIHNvbWUgZXhhbXBsZXMgb2Ygd2hhdCBsb29rdXAgZnVuY3Rpb25zXG4vLyByZXR1cm4uXG5leHBvcnQgZnVuY3Rpb24gbWFrZUxvb2t1cEZ1bmN0aW9uKGtleSwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHBhcnRzID0ga2V5LnNwbGl0KCcuJyk7XG4gIGNvbnN0IGZpcnN0UGFydCA9IHBhcnRzLmxlbmd0aCA/IHBhcnRzWzBdIDogJyc7XG4gIGNvbnN0IGxvb2t1cFJlc3QgPSAoXG4gICAgcGFydHMubGVuZ3RoID4gMSAmJlxuICAgIG1ha2VMb29rdXBGdW5jdGlvbihwYXJ0cy5zbGljZSgxKS5qb2luKCcuJyksIG9wdGlvbnMpXG4gICk7XG5cbiAgZnVuY3Rpb24gYnVpbGRSZXN1bHQoYXJyYXlJbmRpY2VzLCBkb250SXRlcmF0ZSwgdmFsdWUpIHtcbiAgICByZXR1cm4gYXJyYXlJbmRpY2VzICYmIGFycmF5SW5kaWNlcy5sZW5ndGhcbiAgICAgID8gZG9udEl0ZXJhdGVcbiAgICAgICAgPyBbeyBhcnJheUluZGljZXMsIGRvbnRJdGVyYXRlLCB2YWx1ZSB9XVxuICAgICAgICA6IFt7IGFycmF5SW5kaWNlcywgdmFsdWUgfV1cbiAgICAgIDogZG9udEl0ZXJhdGVcbiAgICAgICAgPyBbeyBkb250SXRlcmF0ZSwgdmFsdWUgfV1cbiAgICAgICAgOiBbeyB2YWx1ZSB9XTtcbiAgfVxuXG4gIC8vIERvYyB3aWxsIGFsd2F5cyBiZSBhIHBsYWluIG9iamVjdCBvciBhbiBhcnJheS5cbiAgLy8gYXBwbHkgYW4gZXhwbGljaXQgbnVtZXJpYyBpbmRleCwgYW4gYXJyYXkuXG4gIHJldHVybiAoZG9jLCBhcnJheUluZGljZXMpID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShkb2MpKSB7XG4gICAgICAvLyBJZiB3ZSdyZSBiZWluZyBhc2tlZCB0byBkbyBhbiBpbnZhbGlkIGxvb2t1cCBpbnRvIGFuIGFycmF5IChub24taW50ZWdlclxuICAgICAgLy8gb3Igb3V0LW9mLWJvdW5kcyksIHJldHVybiBubyByZXN1bHRzICh3aGljaCBpcyBkaWZmZXJlbnQgZnJvbSByZXR1cm5pbmdcbiAgICAgIC8vIGEgc2luZ2xlIHVuZGVmaW5lZCByZXN1bHQsIGluIHRoYXQgYG51bGxgIGVxdWFsaXR5IGNoZWNrcyB3b24ndCBtYXRjaCkuXG4gICAgICBpZiAoIShpc051bWVyaWNLZXkoZmlyc3RQYXJ0KSAmJiBmaXJzdFBhcnQgPCBkb2MubGVuZ3RoKSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbWVtYmVyIHRoYXQgd2UgdXNlZCB0aGlzIGFycmF5IGluZGV4LiBJbmNsdWRlIGFuICd4JyB0byBpbmRpY2F0ZSB0aGF0XG4gICAgICAvLyB0aGUgcHJldmlvdXMgaW5kZXggY2FtZSBmcm9tIGJlaW5nIGNvbnNpZGVyZWQgYXMgYW4gZXhwbGljaXQgYXJyYXlcbiAgICAgIC8vIGluZGV4IChub3QgYnJhbmNoaW5nKS5cbiAgICAgIGFycmF5SW5kaWNlcyA9IGFycmF5SW5kaWNlcyA/IGFycmF5SW5kaWNlcy5jb25jYXQoK2ZpcnN0UGFydCwgJ3gnKSA6IFsrZmlyc3RQYXJ0LCAneCddO1xuICAgIH1cblxuICAgIC8vIERvIG91ciBmaXJzdCBsb29rdXAuXG4gICAgY29uc3QgZmlyc3RMZXZlbCA9IGRvY1tmaXJzdFBhcnRdO1xuXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gZGVlcGVyIHRvIGRpZywgcmV0dXJuIHdoYXQgd2UgZm91bmQuXG4gICAgLy9cbiAgICAvLyBJZiB3aGF0IHdlIGZvdW5kIGlzIGFuIGFycmF5LCBtb3N0IHZhbHVlIHNlbGVjdG9ycyB3aWxsIGNob29zZSB0byB0cmVhdFxuICAgIC8vIHRoZSBlbGVtZW50cyBvZiB0aGUgYXJyYXkgYXMgbWF0Y2hhYmxlIHZhbHVlcyBpbiB0aGVpciBvd24gcmlnaHQsIGJ1dFxuICAgIC8vIHRoYXQncyBkb25lIG91dHNpZGUgb2YgdGhlIGxvb2t1cCBmdW5jdGlvbi4gKEV4Y2VwdGlvbnMgdG8gdGhpcyBhcmUgJHNpemVcbiAgICAvLyBhbmQgc3R1ZmYgcmVsYXRpbmcgdG8gJGVsZW1NYXRjaC4gIGVnLCB7YTogeyRzaXplOiAyfX0gZG9lcyBub3QgbWF0Y2gge2E6XG4gICAgLy8gW1sxLCAyXV19LilcbiAgICAvL1xuICAgIC8vIFRoYXQgc2FpZCwgaWYgd2UganVzdCBkaWQgYW4gKmV4cGxpY2l0KiBhcnJheSBsb29rdXAgKG9uIGRvYykgdG8gZmluZFxuICAgIC8vIGZpcnN0TGV2ZWwsIGFuZCBmaXJzdExldmVsIGlzIGFuIGFycmF5IHRvbywgd2UgZG8gTk9UIHdhbnQgdmFsdWVcbiAgICAvLyBzZWxlY3RvcnMgdG8gaXRlcmF0ZSBvdmVyIGl0LiAgZWcsIHsnYS4wJzogNX0gZG9lcyBub3QgbWF0Y2gge2E6IFtbNV1dfS5cbiAgICAvLyBTbyBpbiB0aGF0IGNhc2UsIHdlIG1hcmsgdGhlIHJldHVybiB2YWx1ZSBhcyAnZG9uJ3QgaXRlcmF0ZScuXG4gICAgaWYgKCFsb29rdXBSZXN0KSB7XG4gICAgICByZXR1cm4gYnVpbGRSZXN1bHQoXG4gICAgICAgIGFycmF5SW5kaWNlcyxcbiAgICAgICAgQXJyYXkuaXNBcnJheShkb2MpICYmIEFycmF5LmlzQXJyYXkoZmlyc3RMZXZlbCksXG4gICAgICAgIGZpcnN0TGV2ZWwsXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIFdlIG5lZWQgdG8gZGlnIGRlZXBlci4gIEJ1dCBpZiB3ZSBjYW4ndCwgYmVjYXVzZSB3aGF0IHdlJ3ZlIGZvdW5kIGlzIG5vdFxuICAgIC8vIGFuIGFycmF5IG9yIHBsYWluIG9iamVjdCwgd2UncmUgZG9uZS4gSWYgd2UganVzdCBkaWQgYSBudW1lcmljIGluZGV4IGludG9cbiAgICAvLyBhbiBhcnJheSwgd2UgcmV0dXJuIG5vdGhpbmcgaGVyZSAodGhpcyBpcyBhIGNoYW5nZSBpbiBNb25nbyAyLjUgZnJvbVxuICAgIC8vIE1vbmdvIDIuNCwgd2hlcmUgeydhLjAuYic6IG51bGx9IHN0b3BwZWQgbWF0Y2hpbmcge2E6IFs1XX0pLiBPdGhlcndpc2UsXG4gICAgLy8gcmV0dXJuIGEgc2luZ2xlIGB1bmRlZmluZWRgICh3aGljaCBjYW4sIGZvciBleGFtcGxlLCBtYXRjaCB2aWEgZXF1YWxpdHlcbiAgICAvLyB3aXRoIGBudWxsYCkuXG4gICAgaWYgKCFpc0luZGV4YWJsZShmaXJzdExldmVsKSkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZG9jKSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBidWlsZFJlc3VsdChhcnJheUluZGljZXMsIGZhbHNlLCB1bmRlZmluZWQpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIGNvbnN0IGFwcGVuZFRvUmVzdWx0ID0gbW9yZSA9PiB7XG4gICAgICByZXN1bHQucHVzaCguLi5tb3JlKTtcbiAgICB9O1xuXG4gICAgLy8gRGlnIGRlZXBlcjogbG9vayB1cCB0aGUgcmVzdCBvZiB0aGUgcGFydHMgb24gd2hhdGV2ZXIgd2UndmUgZm91bmQuXG4gICAgLy8gKGxvb2t1cFJlc3QgaXMgc21hcnQgZW5vdWdoIHRvIG5vdCB0cnkgdG8gZG8gaW52YWxpZCBsb29rdXBzIGludG9cbiAgICAvLyBmaXJzdExldmVsIGlmIGl0J3MgYW4gYXJyYXkuKVxuICAgIGFwcGVuZFRvUmVzdWx0KGxvb2t1cFJlc3QoZmlyc3RMZXZlbCwgYXJyYXlJbmRpY2VzKSk7XG5cbiAgICAvLyBJZiB3ZSBmb3VuZCBhbiBhcnJheSwgdGhlbiBpbiAqYWRkaXRpb24qIHRvIHBvdGVudGlhbGx5IHRyZWF0aW5nIHRoZSBuZXh0XG4gICAgLy8gcGFydCBhcyBhIGxpdGVyYWwgaW50ZWdlciBsb29rdXAsIHdlIHNob3VsZCBhbHNvICdicmFuY2gnOiB0cnkgdG8gbG9vayB1cFxuICAgIC8vIHRoZSByZXN0IG9mIHRoZSBwYXJ0cyBvbiBlYWNoIGFycmF5IGVsZW1lbnQgaW4gcGFyYWxsZWwuXG4gICAgLy9cbiAgICAvLyBJbiB0aGlzIGNhc2UsIHdlICpvbmx5KiBkaWcgZGVlcGVyIGludG8gYXJyYXkgZWxlbWVudHMgdGhhdCBhcmUgcGxhaW5cbiAgICAvLyBvYmplY3RzLiAoUmVjYWxsIHRoYXQgd2Ugb25seSBnb3QgdGhpcyBmYXIgaWYgd2UgaGF2ZSBmdXJ0aGVyIHRvIGRpZy4pXG4gICAgLy8gVGhpcyBtYWtlcyBzZW5zZTogd2UgY2VydGFpbmx5IGRvbid0IGRpZyBkZWVwZXIgaW50byBub24taW5kZXhhYmxlXG4gICAgLy8gb2JqZWN0cy4gQW5kIGl0IHdvdWxkIGJlIHdlaXJkIHRvIGRpZyBpbnRvIGFuIGFycmF5OiBpdCdzIHNpbXBsZXIgdG8gaGF2ZVxuICAgIC8vIGEgcnVsZSB0aGF0IGV4cGxpY2l0IGludGVnZXIgaW5kZXhlcyBvbmx5IGFwcGx5IHRvIGFuIG91dGVyIGFycmF5LCBub3QgdG9cbiAgICAvLyBhbiBhcnJheSB5b3UgZmluZCBhZnRlciBhIGJyYW5jaGluZyBzZWFyY2guXG4gICAgLy9cbiAgICAvLyBJbiB0aGUgc3BlY2lhbCBjYXNlIG9mIGEgbnVtZXJpYyBwYXJ0IGluIGEgKnNvcnQgc2VsZWN0b3IqIChub3QgYSBxdWVyeVxuICAgIC8vIHNlbGVjdG9yKSwgd2Ugc2tpcCB0aGUgYnJhbmNoaW5nOiB3ZSBPTkxZIGFsbG93IHRoZSBudW1lcmljIHBhcnQgdG8gbWVhblxuICAgIC8vICdsb29rIHVwIHRoaXMgaW5kZXgnIGluIHRoYXQgY2FzZSwgbm90ICdhbHNvIGxvb2sgdXAgdGhpcyBpbmRleCBpbiBhbGxcbiAgICAvLyB0aGUgZWxlbWVudHMgb2YgdGhlIGFycmF5Jy5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShmaXJzdExldmVsKSAmJlxuICAgICAgICAhKGlzTnVtZXJpY0tleShwYXJ0c1sxXSkgJiYgb3B0aW9ucy5mb3JTb3J0KSkge1xuICAgICAgZmlyc3RMZXZlbC5mb3JFYWNoKChicmFuY2gsIGFycmF5SW5kZXgpID0+IHtcbiAgICAgICAgaWYgKExvY2FsQ29sbGVjdGlvbi5faXNQbGFpbk9iamVjdChicmFuY2gpKSB7XG4gICAgICAgICAgYXBwZW5kVG9SZXN1bHQobG9va3VwUmVzdChicmFuY2gsIGFycmF5SW5kaWNlcyA/IGFycmF5SW5kaWNlcy5jb25jYXQoYXJyYXlJbmRleCkgOiBbYXJyYXlJbmRleF0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cblxuLy8gT2JqZWN0IGV4cG9ydGVkIG9ubHkgZm9yIHVuaXQgdGVzdGluZy5cbi8vIFVzZSBpdCB0byBleHBvcnQgcHJpdmF0ZSBmdW5jdGlvbnMgdG8gdGVzdCBpbiBUaW55dGVzdC5cbk1pbmltb25nb1Rlc3QgPSB7bWFrZUxvb2t1cEZ1bmN0aW9ufTtcbk1pbmltb25nb0Vycm9yID0gKG1lc3NhZ2UsIG9wdGlvbnMgPSB7fSkgPT4ge1xuICBpZiAodHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnICYmIG9wdGlvbnMuZmllbGQpIHtcbiAgICBtZXNzYWdlICs9IGAgZm9yIGZpZWxkICcke29wdGlvbnMuZmllbGR9J2A7XG4gIH1cblxuICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgZXJyb3IubmFtZSA9ICdNaW5pbW9uZ29FcnJvcic7XG4gIHJldHVybiBlcnJvcjtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBub3RoaW5nTWF0Y2hlcihkb2NPckJyYW5jaGVkVmFsdWVzKSB7XG4gIHJldHVybiB7cmVzdWx0OiBmYWxzZX07XG59XG5cbi8vIFRha2VzIGFuIG9wZXJhdG9yIG9iamVjdCAoYW4gb2JqZWN0IHdpdGggJCBrZXlzKSBhbmQgcmV0dXJucyBhIGJyYW5jaGVkXG4vLyBtYXRjaGVyIGZvciBpdC5cbmZ1bmN0aW9uIG9wZXJhdG9yQnJhbmNoZWRNYXRjaGVyKHZhbHVlU2VsZWN0b3IsIG1hdGNoZXIsIGlzUm9vdCkge1xuICAvLyBFYWNoIHZhbHVlU2VsZWN0b3Igd29ya3Mgc2VwYXJhdGVseSBvbiB0aGUgdmFyaW91cyBicmFuY2hlcy4gIFNvIG9uZVxuICAvLyBvcGVyYXRvciBjYW4gbWF0Y2ggb25lIGJyYW5jaCBhbmQgYW5vdGhlciBjYW4gbWF0Y2ggYW5vdGhlciBicmFuY2guICBUaGlzXG4gIC8vIGlzIE9LLlxuICBjb25zdCBvcGVyYXRvck1hdGNoZXJzID0gT2JqZWN0LmtleXModmFsdWVTZWxlY3RvcikubWFwKG9wZXJhdG9yID0+IHtcbiAgICBjb25zdCBvcGVyYW5kID0gdmFsdWVTZWxlY3RvcltvcGVyYXRvcl07XG5cbiAgICBjb25zdCBzaW1wbGVSYW5nZSA9IChcbiAgICAgIFsnJGx0JywgJyRsdGUnLCAnJGd0JywgJyRndGUnXS5pbmNsdWRlcyhvcGVyYXRvcikgJiZcbiAgICAgIHR5cGVvZiBvcGVyYW5kID09PSAnbnVtYmVyJ1xuICAgICk7XG5cbiAgICBjb25zdCBzaW1wbGVFcXVhbGl0eSA9IChcbiAgICAgIFsnJG5lJywgJyRlcSddLmluY2x1ZGVzKG9wZXJhdG9yKSAmJlxuICAgICAgb3BlcmFuZCAhPT0gT2JqZWN0KG9wZXJhbmQpXG4gICAgKTtcblxuICAgIGNvbnN0IHNpbXBsZUluY2x1c2lvbiA9IChcbiAgICAgIFsnJGluJywgJyRuaW4nXS5pbmNsdWRlcyhvcGVyYXRvcilcbiAgICAgICYmIEFycmF5LmlzQXJyYXkob3BlcmFuZClcbiAgICAgICYmICFvcGVyYW5kLnNvbWUoeCA9PiB4ID09PSBPYmplY3QoeCkpXG4gICAgKTtcblxuICAgIGlmICghKHNpbXBsZVJhbmdlIHx8IHNpbXBsZUluY2x1c2lvbiB8fCBzaW1wbGVFcXVhbGl0eSkpIHtcbiAgICAgIG1hdGNoZXIuX2lzU2ltcGxlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGhhc093bi5jYWxsKFZBTFVFX09QRVJBVE9SUywgb3BlcmF0b3IpKSB7XG4gICAgICByZXR1cm4gVkFMVUVfT1BFUkFUT1JTW29wZXJhdG9yXShvcGVyYW5kLCB2YWx1ZVNlbGVjdG9yLCBtYXRjaGVyLCBpc1Jvb3QpO1xuICAgIH1cblxuICAgIGlmIChoYXNPd24uY2FsbChFTEVNRU5UX09QRVJBVE9SUywgb3BlcmF0b3IpKSB7XG4gICAgICBjb25zdCBvcHRpb25zID0gRUxFTUVOVF9PUEVSQVRPUlNbb3BlcmF0b3JdO1xuICAgICAgcmV0dXJuIGNvbnZlcnRFbGVtZW50TWF0Y2hlclRvQnJhbmNoZWRNYXRjaGVyKFxuICAgICAgICBvcHRpb25zLmNvbXBpbGVFbGVtZW50U2VsZWN0b3Iob3BlcmFuZCwgdmFsdWVTZWxlY3RvciwgbWF0Y2hlciksXG4gICAgICAgIG9wdGlvbnNcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IE1pbmlNb25nb1F1ZXJ5RXJyb3IoYFVucmVjb2duaXplZCBvcGVyYXRvcjogJHtvcGVyYXRvcn1gKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGFuZEJyYW5jaGVkTWF0Y2hlcnMob3BlcmF0b3JNYXRjaGVycyk7XG59XG5cbi8vIHBhdGhzIC0gQXJyYXk6IGxpc3Qgb2YgbW9uZ28gc3R5bGUgcGF0aHNcbi8vIG5ld0xlYWZGbiAtIEZ1bmN0aW9uOiBvZiBmb3JtIGZ1bmN0aW9uKHBhdGgpIHNob3VsZCByZXR1cm4gYSBzY2FsYXIgdmFsdWUgdG9cbi8vICAgICAgICAgICAgICAgICAgICAgICBwdXQgaW50byBsaXN0IGNyZWF0ZWQgZm9yIHRoYXQgcGF0aFxuLy8gY29uZmxpY3RGbiAtIEZ1bmN0aW9uOiBvZiBmb3JtIGZ1bmN0aW9uKG5vZGUsIHBhdGgsIGZ1bGxQYXRoKSBpcyBjYWxsZWRcbi8vICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiBidWlsZGluZyBhIHRyZWUgcGF0aCBmb3IgJ2Z1bGxQYXRoJyBub2RlIG9uXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICdwYXRoJyB3YXMgYWxyZWFkeSBhIGxlYWYgd2l0aCBhIHZhbHVlLiBNdXN0IHJldHVybiBhXG4vLyAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZsaWN0IHJlc29sdXRpb24uXG4vLyBpbml0aWFsIHRyZWUgLSBPcHRpb25hbCBPYmplY3Q6IHN0YXJ0aW5nIHRyZWUuXG4vLyBAcmV0dXJucyAtIE9iamVjdDogdHJlZSByZXByZXNlbnRlZCBhcyBhIHNldCBvZiBuZXN0ZWQgb2JqZWN0c1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGhzVG9UcmVlKHBhdGhzLCBuZXdMZWFmRm4sIGNvbmZsaWN0Rm4sIHJvb3QgPSB7fSkge1xuICBwYXRocy5mb3JFYWNoKHBhdGggPT4ge1xuICAgIGNvbnN0IHBhdGhBcnJheSA9IHBhdGguc3BsaXQoJy4nKTtcbiAgICBsZXQgdHJlZSA9IHJvb3Q7XG5cbiAgICAvLyB1c2UgLmV2ZXJ5IGp1c3QgZm9yIGl0ZXJhdGlvbiB3aXRoIGJyZWFrXG4gICAgY29uc3Qgc3VjY2VzcyA9IHBhdGhBcnJheS5zbGljZSgwLCAtMSkuZXZlcnkoKGtleSwgaSkgPT4ge1xuICAgICAgaWYgKCFoYXNPd24uY2FsbCh0cmVlLCBrZXkpKSB7XG4gICAgICAgIHRyZWVba2V5XSA9IHt9O1xuICAgICAgfSBlbHNlIGlmICh0cmVlW2tleV0gIT09IE9iamVjdCh0cmVlW2tleV0pKSB7XG4gICAgICAgIHRyZWVba2V5XSA9IGNvbmZsaWN0Rm4oXG4gICAgICAgICAgdHJlZVtrZXldLFxuICAgICAgICAgIHBhdGhBcnJheS5zbGljZSgwLCBpICsgMSkuam9pbignLicpLFxuICAgICAgICAgIHBhdGhcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBicmVhayBvdXQgb2YgbG9vcCBpZiB3ZSBhcmUgZmFpbGluZyBmb3IgdGhpcyBwYXRoXG4gICAgICAgIGlmICh0cmVlW2tleV0gIT09IE9iamVjdCh0cmVlW2tleV0pKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRyZWUgPSB0cmVlW2tleV07XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG4gICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgIGNvbnN0IGxhc3RLZXkgPSBwYXRoQXJyYXlbcGF0aEFycmF5Lmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKGhhc093bi5jYWxsKHRyZWUsIGxhc3RLZXkpKSB7XG4gICAgICAgIHRyZWVbbGFzdEtleV0gPSBjb25mbGljdEZuKHRyZWVbbGFzdEtleV0sIHBhdGgsIHBhdGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJlZVtsYXN0S2V5XSA9IG5ld0xlYWZGbihwYXRoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiByb290O1xufVxuXG4vLyBNYWtlcyBzdXJlIHdlIGdldCAyIGVsZW1lbnRzIGFycmF5IGFuZCBhc3N1bWUgdGhlIGZpcnN0IG9uZSB0byBiZSB4IGFuZFxuLy8gdGhlIHNlY29uZCBvbmUgdG8geSBubyBtYXR0ZXIgd2hhdCB1c2VyIHBhc3Nlcy5cbi8vIEluIGNhc2UgdXNlciBwYXNzZXMgeyBsb246IHgsIGxhdDogeSB9IHJldHVybnMgW3gsIHldXG5mdW5jdGlvbiBwb2ludFRvQXJyYXkocG9pbnQpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkocG9pbnQpID8gcG9pbnQuc2xpY2UoKSA6IFtwb2ludC54LCBwb2ludC55XTtcbn1cblxuLy8gQ3JlYXRpbmcgYSBkb2N1bWVudCBmcm9tIGFuIHVwc2VydCBpcyBxdWl0ZSB0cmlja3kuXG4vLyBFLmcuIHRoaXMgc2VsZWN0b3I6IHtcIiRvclwiOiBbe1wiYi5mb29cIjoge1wiJGFsbFwiOiBbXCJiYXJcIl19fV19LCBzaG91bGQgcmVzdWx0XG4vLyBpbjoge1wiYi5mb29cIjogXCJiYXJcIn1cbi8vIEJ1dCB0aGlzIHNlbGVjdG9yOiB7XCIkb3JcIjogW3tcImJcIjoge1wiZm9vXCI6IHtcIiRhbGxcIjogW1wiYmFyXCJdfX19XX0gc2hvdWxkIHRocm93XG4vLyBhbiBlcnJvclxuXG4vLyBTb21lIHJ1bGVzIChmb3VuZCBtYWlubHkgd2l0aCB0cmlhbCAmIGVycm9yLCBzbyB0aGVyZSBtaWdodCBiZSBtb3JlKTpcbi8vIC0gaGFuZGxlIGFsbCBjaGlsZHMgb2YgJGFuZCAob3IgaW1wbGljaXQgJGFuZClcbi8vIC0gaGFuZGxlICRvciBub2RlcyB3aXRoIGV4YWN0bHkgMSBjaGlsZFxuLy8gLSBpZ25vcmUgJG9yIG5vZGVzIHdpdGggbW9yZSB0aGFuIDEgY2hpbGRcbi8vIC0gaWdub3JlICRub3IgYW5kICRub3Qgbm9kZXNcbi8vIC0gdGhyb3cgd2hlbiBhIHZhbHVlIGNhbiBub3QgYmUgc2V0IHVuYW1iaWd1b3VzbHlcbi8vIC0gZXZlcnkgdmFsdWUgZm9yICRhbGwgc2hvdWxkIGJlIGRlYWx0IHdpdGggYXMgc2VwYXJhdGUgJGVxLXNcbi8vIC0gdGhyZWF0IGFsbCBjaGlsZHJlbiBvZiAkYWxsIGFzICRlcSBzZXR0ZXJzICg9PiBzZXQgaWYgJGFsbC5sZW5ndGggPT09IDEsXG4vLyAgIG90aGVyd2lzZSB0aHJvdyBlcnJvcilcbi8vIC0geW91IGNhbiBub3QgbWl4ICckJy1wcmVmaXhlZCBrZXlzIGFuZCBub24tJyQnLXByZWZpeGVkIGtleXNcbi8vIC0geW91IGNhbiBvbmx5IGhhdmUgZG90dGVkIGtleXMgb24gYSByb290LWxldmVsXG4vLyAtIHlvdSBjYW4gbm90IGhhdmUgJyQnLXByZWZpeGVkIGtleXMgbW9yZSB0aGFuIG9uZS1sZXZlbCBkZWVwIGluIGFuIG9iamVjdFxuXG4vLyBIYW5kbGVzIG9uZSBrZXkvdmFsdWUgcGFpciB0byBwdXQgaW4gdGhlIHNlbGVjdG9yIGRvY3VtZW50XG5mdW5jdGlvbiBwb3B1bGF0ZURvY3VtZW50V2l0aEtleVZhbHVlKGRvY3VtZW50LCBrZXksIHZhbHVlKSB7XG4gIGlmICh2YWx1ZSAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YodmFsdWUpID09PSBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgcG9wdWxhdGVEb2N1bWVudFdpdGhPYmplY3QoZG9jdW1lbnQsIGtleSwgdmFsdWUpO1xuICB9IGVsc2UgaWYgKCEodmFsdWUgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgaW5zZXJ0SW50b0RvY3VtZW50KGRvY3VtZW50LCBrZXksIHZhbHVlKTtcbiAgfVxufVxuXG4vLyBIYW5kbGVzIGEga2V5LCB2YWx1ZSBwYWlyIHRvIHB1dCBpbiB0aGUgc2VsZWN0b3IgZG9jdW1lbnRcbi8vIGlmIHRoZSB2YWx1ZSBpcyBhbiBvYmplY3RcbmZ1bmN0aW9uIHBvcHVsYXRlRG9jdW1lbnRXaXRoT2JqZWN0KGRvY3VtZW50LCBrZXksIHZhbHVlKSB7XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIGNvbnN0IHVucHJlZml4ZWRLZXlzID0ga2V5cy5maWx0ZXIob3AgPT4gb3BbMF0gIT09ICckJyk7XG5cbiAgaWYgKHVucHJlZml4ZWRLZXlzLmxlbmd0aCA+IDAgfHwgIWtleXMubGVuZ3RoKSB7XG4gICAgLy8gTGl0ZXJhbCAocG9zc2libHkgZW1wdHkpIG9iamVjdCAoIG9yIGVtcHR5IG9iamVjdCApXG4gICAgLy8gRG9uJ3QgYWxsb3cgbWl4aW5nICckJy1wcmVmaXhlZCB3aXRoIG5vbi0nJCctcHJlZml4ZWQgZmllbGRzXG4gICAgaWYgKGtleXMubGVuZ3RoICE9PSB1bnByZWZpeGVkS2V5cy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBNaW5pTW9uZ29RdWVyeUVycm9yKGB1bmtub3duIG9wZXJhdG9yOiAke3VucHJlZml4ZWRLZXlzWzBdfWApO1xuICAgIH1cblxuICAgIHZhbGlkYXRlT2JqZWN0KHZhbHVlLCBrZXkpO1xuICAgIGluc2VydEludG9Eb2N1bWVudChkb2N1bWVudCwga2V5LCB2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgT2JqZWN0LmtleXModmFsdWUpLmZvckVhY2gob3AgPT4ge1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdmFsdWVbb3BdO1xuXG4gICAgICBpZiAob3AgPT09ICckZXEnKSB7XG4gICAgICAgIHBvcHVsYXRlRG9jdW1lbnRXaXRoS2V5VmFsdWUoZG9jdW1lbnQsIGtleSwgb2JqZWN0KTtcbiAgICAgIH0gZWxzZSBpZiAob3AgPT09ICckYWxsJykge1xuICAgICAgICAvLyBldmVyeSB2YWx1ZSBmb3IgJGFsbCBzaG91bGQgYmUgZGVhbHQgd2l0aCBhcyBzZXBhcmF0ZSAkZXEtc1xuICAgICAgICBvYmplY3QuZm9yRWFjaChlbGVtZW50ID0+XG4gICAgICAgICAgcG9wdWxhdGVEb2N1bWVudFdpdGhLZXlWYWx1ZShkb2N1bWVudCwga2V5LCBlbGVtZW50KVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8vIEZpbGxzIGEgZG9jdW1lbnQgd2l0aCBjZXJ0YWluIGZpZWxkcyBmcm9tIGFuIHVwc2VydCBzZWxlY3RvclxuZXhwb3J0IGZ1bmN0aW9uIHBvcHVsYXRlRG9jdW1lbnRXaXRoUXVlcnlGaWVsZHMocXVlcnksIGRvY3VtZW50ID0ge30pIHtcbiAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZihxdWVyeSkgPT09IE9iamVjdC5wcm90b3R5cGUpIHtcbiAgICAvLyBoYW5kbGUgaW1wbGljaXQgJGFuZFxuICAgIE9iamVjdC5rZXlzKHF1ZXJ5KS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHF1ZXJ5W2tleV07XG5cbiAgICAgIGlmIChrZXkgPT09ICckYW5kJykge1xuICAgICAgICAvLyBoYW5kbGUgZXhwbGljaXQgJGFuZFxuICAgICAgICB2YWx1ZS5mb3JFYWNoKGVsZW1lbnQgPT5cbiAgICAgICAgICBwb3B1bGF0ZURvY3VtZW50V2l0aFF1ZXJ5RmllbGRzKGVsZW1lbnQsIGRvY3VtZW50KVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChrZXkgPT09ICckb3InKSB7XG4gICAgICAgIC8vIGhhbmRsZSAkb3Igbm9kZXMgd2l0aCBleGFjdGx5IDEgY2hpbGRcbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIHBvcHVsYXRlRG9jdW1lbnRXaXRoUXVlcnlGaWVsZHModmFsdWVbMF0sIGRvY3VtZW50KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChrZXlbMF0gIT09ICckJykge1xuICAgICAgICAvLyBJZ25vcmUgb3RoZXIgJyQnLXByZWZpeGVkIGxvZ2ljYWwgc2VsZWN0b3JzXG4gICAgICAgIHBvcHVsYXRlRG9jdW1lbnRXaXRoS2V5VmFsdWUoZG9jdW1lbnQsIGtleSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIC8vIEhhbmRsZSBtZXRlb3Itc3BlY2lmaWMgc2hvcnRjdXQgZm9yIHNlbGVjdGluZyBfaWRcbiAgICBpZiAoTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWQocXVlcnkpKSB7XG4gICAgICBpbnNlcnRJbnRvRG9jdW1lbnQoZG9jdW1lbnQsICdfaWQnLCBxdWVyeSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRvY3VtZW50O1xufVxuXG4vLyBUcmF2ZXJzZXMgdGhlIGtleXMgb2YgcGFzc2VkIHByb2plY3Rpb24gYW5kIGNvbnN0cnVjdHMgYSB0cmVlIHdoZXJlIGFsbFxuLy8gbGVhdmVzIGFyZSBlaXRoZXIgYWxsIFRydWUgb3IgYWxsIEZhbHNlXG4vLyBAcmV0dXJucyBPYmplY3Q6XG4vLyAgLSB0cmVlIC0gT2JqZWN0IC0gdHJlZSByZXByZXNlbnRhdGlvbiBvZiBrZXlzIGludm9sdmVkIGluIHByb2plY3Rpb25cbi8vICAoZXhjZXB0aW9uIGZvciAnX2lkJyBhcyBpdCBpcyBhIHNwZWNpYWwgY2FzZSBoYW5kbGVkIHNlcGFyYXRlbHkpXG4vLyAgLSBpbmNsdWRpbmcgLSBCb29sZWFuIC0gXCJ0YWtlIG9ubHkgY2VydGFpbiBmaWVsZHNcIiB0eXBlIG9mIHByb2plY3Rpb25cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0aW9uRGV0YWlscyhmaWVsZHMpIHtcbiAgLy8gRmluZCB0aGUgbm9uLV9pZCBrZXlzIChfaWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYmVjYXVzZSBpdCBpcyBpbmNsdWRlZFxuICAvLyB1bmxlc3MgZXhwbGljaXRseSBleGNsdWRlZCkuIFNvcnQgdGhlIGtleXMsIHNvIHRoYXQgb3VyIGNvZGUgdG8gZGV0ZWN0XG4gIC8vIG92ZXJsYXBzIGxpa2UgJ2ZvbycgYW5kICdmb28uYmFyJyBjYW4gYXNzdW1lIHRoYXQgJ2ZvbycgY29tZXMgZmlyc3QuXG4gIGxldCBmaWVsZHNLZXlzID0gT2JqZWN0LmtleXMoZmllbGRzKS5zb3J0KCk7XG5cbiAgLy8gSWYgX2lkIGlzIHRoZSBvbmx5IGZpZWxkIGluIHRoZSBwcm9qZWN0aW9uLCBkbyBub3QgcmVtb3ZlIGl0LCBzaW5jZSBpdCBpc1xuICAvLyByZXF1aXJlZCB0byBkZXRlcm1pbmUgaWYgdGhpcyBpcyBhbiBleGNsdXNpb24gb3IgZXhjbHVzaW9uLiBBbHNvIGtlZXAgYW5cbiAgLy8gaW5jbHVzaXZlIF9pZCwgc2luY2UgaW5jbHVzaXZlIF9pZCBmb2xsb3dzIHRoZSBub3JtYWwgcnVsZXMgYWJvdXQgbWl4aW5nXG4gIC8vIGluY2x1c2l2ZSBhbmQgZXhjbHVzaXZlIGZpZWxkcy4gSWYgX2lkIGlzIG5vdCB0aGUgb25seSBmaWVsZCBpbiB0aGVcbiAgLy8gcHJvamVjdGlvbiBhbmQgaXMgZXhjbHVzaXZlLCByZW1vdmUgaXQgc28gaXQgY2FuIGJlIGhhbmRsZWQgbGF0ZXIgYnkgYVxuICAvLyBzcGVjaWFsIGNhc2UsIHNpbmNlIGV4Y2x1c2l2ZSBfaWQgaXMgYWx3YXlzIGFsbG93ZWQuXG4gIGlmICghKGZpZWxkc0tleXMubGVuZ3RoID09PSAxICYmIGZpZWxkc0tleXNbMF0gPT09ICdfaWQnKSAmJlxuICAgICAgIShmaWVsZHNLZXlzLmluY2x1ZGVzKCdfaWQnKSAmJiBmaWVsZHMuX2lkKSkge1xuICAgIGZpZWxkc0tleXMgPSBmaWVsZHNLZXlzLmZpbHRlcihrZXkgPT4ga2V5ICE9PSAnX2lkJyk7XG4gIH1cblxuICBsZXQgaW5jbHVkaW5nID0gbnVsbDsgLy8gVW5rbm93blxuXG4gIGZpZWxkc0tleXMuZm9yRWFjaChrZXlQYXRoID0+IHtcbiAgICBjb25zdCBydWxlID0gISFmaWVsZHNba2V5UGF0aF07XG5cbiAgICBpZiAoaW5jbHVkaW5nID09PSBudWxsKSB7XG4gICAgICBpbmNsdWRpbmcgPSBydWxlO1xuICAgIH1cblxuICAgIC8vIFRoaXMgZXJyb3IgbWVzc2FnZSBpcyBjb3BpZWQgZnJvbSBNb25nb0RCIHNoZWxsXG4gICAgaWYgKGluY2x1ZGluZyAhPT0gcnVsZSkge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICdZb3UgY2Fubm90IGN1cnJlbnRseSBtaXggaW5jbHVkaW5nIGFuZCBleGNsdWRpbmcgZmllbGRzLidcbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBwcm9qZWN0aW9uUnVsZXNUcmVlID0gcGF0aHNUb1RyZWUoXG4gICAgZmllbGRzS2V5cyxcbiAgICBwYXRoID0+IGluY2x1ZGluZyxcbiAgICAobm9kZSwgcGF0aCwgZnVsbFBhdGgpID0+IHtcbiAgICAgIC8vIENoZWNrIHBhc3NlZCBwcm9qZWN0aW9uIGZpZWxkcycga2V5czogSWYgeW91IGhhdmUgdHdvIHJ1bGVzIHN1Y2ggYXNcbiAgICAgIC8vICdmb28uYmFyJyBhbmQgJ2Zvby5iYXIuYmF6JywgdGhlbiB0aGUgcmVzdWx0IGJlY29tZXMgYW1iaWd1b3VzLiBJZlxuICAgICAgLy8gdGhhdCBoYXBwZW5zLCB0aGVyZSBpcyBhIHByb2JhYmlsaXR5IHlvdSBhcmUgZG9pbmcgc29tZXRoaW5nIHdyb25nLFxuICAgICAgLy8gZnJhbWV3b3JrIHNob3VsZCBub3RpZnkgeW91IGFib3V0IHN1Y2ggbWlzdGFrZSBlYXJsaWVyIG9uIGN1cnNvclxuICAgICAgLy8gY29tcGlsYXRpb24gc3RlcCB0aGFuIGxhdGVyIGR1cmluZyBydW50aW1lLiAgTm90ZSwgdGhhdCByZWFsIG1vbmdvXG4gICAgICAvLyBkb2Vzbid0IGRvIGFueXRoaW5nIGFib3V0IGl0IGFuZCB0aGUgbGF0ZXIgcnVsZSBhcHBlYXJzIGluIHByb2plY3Rpb25cbiAgICAgIC8vIHByb2plY3QsIG1vcmUgcHJpb3JpdHkgaXQgdGFrZXMuXG4gICAgICAvL1xuICAgICAgLy8gRXhhbXBsZSwgYXNzdW1lIGZvbGxvd2luZyBpbiBtb25nbyBzaGVsbDpcbiAgICAgIC8vID4gZGIuY29sbC5pbnNlcnQoeyBhOiB7IGI6IDIzLCBjOiA0NCB9IH0pXG4gICAgICAvLyA+IGRiLmNvbGwuZmluZCh7fSwgeyAnYSc6IDEsICdhLmInOiAxIH0pXG4gICAgICAvLyB7XCJfaWRcIjogT2JqZWN0SWQoXCI1MjBiZmU0NTYwMjQ2MDhlOGVmMjRhZjNcIiksIFwiYVwiOiB7XCJiXCI6IDIzfX1cbiAgICAgIC8vID4gZGIuY29sbC5maW5kKHt9LCB7ICdhLmInOiAxLCAnYSc6IDEgfSlcbiAgICAgIC8vIHtcIl9pZFwiOiBPYmplY3RJZChcIjUyMGJmZTQ1NjAyNDYwOGU4ZWYyNGFmM1wiKSwgXCJhXCI6IHtcImJcIjogMjMsIFwiY1wiOiA0NH19XG4gICAgICAvL1xuICAgICAgLy8gTm90ZSwgaG93IHNlY29uZCB0aW1lIHRoZSByZXR1cm4gc2V0IG9mIGtleXMgaXMgZGlmZmVyZW50LlxuICAgICAgY29uc3QgY3VycmVudFBhdGggPSBmdWxsUGF0aDtcbiAgICAgIGNvbnN0IGFub3RoZXJQYXRoID0gcGF0aDtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICBgYm90aCAke2N1cnJlbnRQYXRofSBhbmQgJHthbm90aGVyUGF0aH0gZm91bmQgaW4gZmllbGRzIG9wdGlvbiwgYCArXG4gICAgICAgICd1c2luZyBib3RoIG9mIHRoZW0gbWF5IHRyaWdnZXIgdW5leHBlY3RlZCBiZWhhdmlvci4gRGlkIHlvdSBtZWFuIHRvICcgK1xuICAgICAgICAndXNlIG9ubHkgb25lIG9mIHRoZW0/J1xuICAgICAgKTtcbiAgICB9KTtcblxuICByZXR1cm4ge2luY2x1ZGluZywgdHJlZTogcHJvamVjdGlvblJ1bGVzVHJlZX07XG59XG5cbi8vIFRha2VzIGEgUmVnRXhwIG9iamVjdCBhbmQgcmV0dXJucyBhbiBlbGVtZW50IG1hdGNoZXIuXG5leHBvcnQgZnVuY3Rpb24gcmVnZXhwRWxlbWVudE1hdGNoZXIocmVnZXhwKSB7XG4gIHJldHVybiB2YWx1ZSA9PiB7XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKSA9PT0gcmVnZXhwLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgLy8gUmVnZXhwcyBvbmx5IHdvcmsgYWdhaW5zdCBzdHJpbmdzLlxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gUmVzZXQgcmVnZXhwJ3Mgc3RhdGUgdG8gYXZvaWQgaW5jb25zaXN0ZW50IG1hdGNoaW5nIGZvciBvYmplY3RzIHdpdGggdGhlXG4gICAgLy8gc2FtZSB2YWx1ZSBvbiBjb25zZWN1dGl2ZSBjYWxscyBvZiByZWdleHAudGVzdC4gVGhpcyBoYXBwZW5zIG9ubHkgaWYgdGhlXG4gICAgLy8gcmVnZXhwIGhhcyB0aGUgJ2cnIGZsYWcuIEFsc28gbm90ZSB0aGF0IEVTNiBpbnRyb2R1Y2VzIGEgbmV3IGZsYWcgJ3knIGZvclxuICAgIC8vIHdoaWNoIHdlIHNob3VsZCAqbm90KiBjaGFuZ2UgdGhlIGxhc3RJbmRleCBidXQgTW9uZ29EQiBkb2Vzbid0IHN1cHBvcnRcbiAgICAvLyBlaXRoZXIgb2YgdGhlc2UgZmxhZ3MuXG4gICAgcmVnZXhwLmxhc3RJbmRleCA9IDA7XG5cbiAgICByZXR1cm4gcmVnZXhwLnRlc3QodmFsdWUpO1xuICB9O1xufVxuXG4vLyBWYWxpZGF0ZXMgdGhlIGtleSBpbiBhIHBhdGguXG4vLyBPYmplY3RzIHRoYXQgYXJlIG5lc3RlZCBtb3JlIHRoZW4gMSBsZXZlbCBjYW5ub3QgaGF2ZSBkb3R0ZWQgZmllbGRzXG4vLyBvciBmaWVsZHMgc3RhcnRpbmcgd2l0aCAnJCdcbmZ1bmN0aW9uIHZhbGlkYXRlS2V5SW5QYXRoKGtleSwgcGF0aCkge1xuICBpZiAoa2V5LmluY2x1ZGVzKCcuJykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgVGhlIGRvdHRlZCBmaWVsZCAnJHtrZXl9JyBpbiAnJHtwYXRofS4ke2tleX0gaXMgbm90IHZhbGlkIGZvciBzdG9yYWdlLmBcbiAgICApO1xuICB9XG5cbiAgaWYgKGtleVswXSA9PT0gJyQnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFRoZSBkb2xsYXIgKCQpIHByZWZpeGVkIGZpZWxkICAnJHtwYXRofS4ke2tleX0gaXMgbm90IHZhbGlkIGZvciBzdG9yYWdlLmBcbiAgICApO1xuICB9XG59XG5cbi8vIFJlY3Vyc2l2ZWx5IHZhbGlkYXRlcyBhbiBvYmplY3QgdGhhdCBpcyBuZXN0ZWQgbW9yZSB0aGFuIG9uZSBsZXZlbCBkZWVwXG5mdW5jdGlvbiB2YWxpZGF0ZU9iamVjdChvYmplY3QsIHBhdGgpIHtcbiAgaWYgKG9iamVjdCAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KSA9PT0gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgIE9iamVjdC5rZXlzKG9iamVjdCkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgdmFsaWRhdGVLZXlJblBhdGgoa2V5LCBwYXRoKTtcbiAgICAgIHZhbGlkYXRlT2JqZWN0KG9iamVjdFtrZXldLCBwYXRoICsgJy4nICsga2V5KTtcbiAgICB9KTtcbiAgfVxufVxuIiwiLyoqIEV4cG9ydGVkIHZhbHVlcyBhcmUgYWxzbyB1c2VkIGluIHRoZSBtb25nbyBwYWNrYWdlLiAqL1xuXG4vKiogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFzeW5jTWV0aG9kTmFtZShtZXRob2QpIHtcbiAgcmV0dXJuIGAke21ldGhvZC5yZXBsYWNlKCdfJywgJycpfUFzeW5jYDtcbn1cblxuZXhwb3J0IGNvbnN0IEFTWU5DX0NPTExFQ1RJT05fTUVUSE9EUyA9IFtcbiAgJ19jcmVhdGVDYXBwZWRDb2xsZWN0aW9uJyxcbiAgJ2Ryb3BDb2xsZWN0aW9uJyxcbiAgJ2Ryb3BJbmRleCcsXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBDcmVhdGVzIHRoZSBzcGVjaWZpZWQgaW5kZXggb24gdGhlIGNvbGxlY3Rpb24uXG4gICAqIEBsb2N1cyBzZXJ2ZXJcbiAgICogQG1ldGhvZCBjcmVhdGVJbmRleEFzeW5jXG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge09iamVjdH0gaW5kZXggQSBkb2N1bWVudCB0aGF0IGNvbnRhaW5zIHRoZSBmaWVsZCBhbmQgdmFsdWUgcGFpcnMgd2hlcmUgdGhlIGZpZWxkIGlzIHRoZSBpbmRleCBrZXkgYW5kIHRoZSB2YWx1ZSBkZXNjcmliZXMgdGhlIHR5cGUgb2YgaW5kZXggZm9yIHRoYXQgZmllbGQuIEZvciBhbiBhc2NlbmRpbmcgaW5kZXggb24gYSBmaWVsZCwgc3BlY2lmeSBhIHZhbHVlIG9mIGAxYDsgZm9yIGRlc2NlbmRpbmcgaW5kZXgsIHNwZWNpZnkgYSB2YWx1ZSBvZiBgLTFgLiBVc2UgYHRleHRgIGZvciB0ZXh0IGluZGV4ZXMuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gQWxsIG9wdGlvbnMgYXJlIGxpc3RlZCBpbiBbTW9uZ29EQiBkb2N1bWVudGF0aW9uXShodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL3JlZmVyZW5jZS9tZXRob2QvZGIuY29sbGVjdGlvbi5jcmVhdGVJbmRleC8jb3B0aW9ucylcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMubmFtZSBOYW1lIG9mIHRoZSBpbmRleFxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMudW5pcXVlIERlZmluZSB0aGF0IHRoZSBpbmRleCB2YWx1ZXMgbXVzdCBiZSB1bmlxdWUsIG1vcmUgYXQgW01vbmdvREIgZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9kb2NzLm1vbmdvZGIuY29tL21hbnVhbC9jb3JlL2luZGV4LXVuaXF1ZS8pXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5zcGFyc2UgRGVmaW5lIHRoYXQgdGhlIGluZGV4IGlzIHNwYXJzZSwgbW9yZSBhdCBbTW9uZ29EQiBkb2N1bWVudGF0aW9uXShodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL2NvcmUvaW5kZXgtc3BhcnNlLylcbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICAnY3JlYXRlSW5kZXgnLFxuICAvKipcbiAgICogQHN1bW1hcnkgRmluZHMgdGhlIGZpcnN0IGRvY3VtZW50IHRoYXQgbWF0Y2hlcyB0aGUgc2VsZWN0b3IsIGFzIG9yZGVyZWQgYnkgc29ydCBhbmQgc2tpcCBvcHRpb25zLiBSZXR1cm5zIGB1bmRlZmluZWRgIGlmIG5vIG1hdGNoaW5nIGRvY3VtZW50IGlzIGZvdW5kLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1ldGhvZCBmaW5kT25lQXN5bmNcbiAgICogQG1lbWJlcm9mIE1vbmdvLkNvbGxlY3Rpb25cbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7TW9uZ29TZWxlY3Rvcn0gW3NlbGVjdG9yXSBBIHF1ZXJ5IGRlc2NyaWJpbmcgdGhlIGRvY3VtZW50cyB0byBmaW5kXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAgICogQHBhcmFtIHtNb25nb1NvcnRTcGVjaWZpZXJ9IG9wdGlvbnMuc29ydCBTb3J0IG9yZGVyIChkZWZhdWx0OiBuYXR1cmFsIG9yZGVyKVxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0aW9ucy5za2lwIE51bWJlciBvZiByZXN1bHRzIHRvIHNraXAgYXQgdGhlIGJlZ2lubmluZ1xuICAgKiBAcGFyYW0ge01vbmdvRmllbGRTcGVjaWZpZXJ9IG9wdGlvbnMuZmllbGRzIERpY3Rpb25hcnkgb2YgZmllbGRzIHRvIHJldHVybiBvciBleGNsdWRlLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMucmVhY3RpdmUgKENsaWVudCBvbmx5KSBEZWZhdWx0IHRydWU7IHBhc3MgZmFsc2UgdG8gZGlzYWJsZSByZWFjdGl2aXR5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdGlvbnMudHJhbnNmb3JtIE92ZXJyaWRlcyBgdHJhbnNmb3JtYCBvbiB0aGUgW2BDb2xsZWN0aW9uYF0oI2NvbGxlY3Rpb25zKSBmb3IgdGhpcyBjdXJzb3IuICBQYXNzIGBudWxsYCB0byBkaXNhYmxlIHRyYW5zZm9ybWF0aW9uLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5yZWFkUHJlZmVyZW5jZSAoU2VydmVyIG9ubHkpIFNwZWNpZmllcyBhIGN1c3RvbSBNb25nb0RCIFtgcmVhZFByZWZlcmVuY2VgXShodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL2NvcmUvcmVhZC1wcmVmZXJlbmNlKSBmb3IgZmV0Y2hpbmcgdGhlIGRvY3VtZW50LiBQb3NzaWJsZSB2YWx1ZXMgYXJlIGBwcmltYXJ5YCwgYHByaW1hcnlQcmVmZXJyZWRgLCBgc2Vjb25kYXJ5YCwgYHNlY29uZGFyeVByZWZlcnJlZGAgYW5kIGBuZWFyZXN0YC5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICAnZmluZE9uZScsXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBJbnNlcnQgYSBkb2N1bWVudCBpbiB0aGUgY29sbGVjdGlvbi4gIFJldHVybnMgaXRzIHVuaXF1ZSBfaWQuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWV0aG9kICBpbnNlcnRBc3luY1xuICAgKiBAbWVtYmVyb2YgTW9uZ28uQ29sbGVjdGlvblxuICAgKiBAaW5zdGFuY2VcbiAgICogQHBhcmFtIHtPYmplY3R9IGRvYyBUaGUgZG9jdW1lbnQgdG8gaW5zZXJ0LiBNYXkgbm90IHlldCBoYXZlIGFuIF9pZCBhdHRyaWJ1dGUsIGluIHdoaWNoIGNhc2UgTWV0ZW9yIHdpbGwgZ2VuZXJhdGUgb25lIGZvciB5b3UuXG4gICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAqL1xuICAnaW5zZXJ0JyxcbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJlbW92ZSBkb2N1bWVudHMgZnJvbSB0aGUgY29sbGVjdGlvblxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1ldGhvZCByZW1vdmVBc3luY1xuICAgKiBAbWVtYmVyb2YgTW9uZ28uQ29sbGVjdGlvblxuICAgKiBAaW5zdGFuY2VcbiAgICogQHBhcmFtIHtNb25nb1NlbGVjdG9yfSBzZWxlY3RvciBTcGVjaWZpZXMgd2hpY2ggZG9jdW1lbnRzIHRvIHJlbW92ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgJ3JlbW92ZScsXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBNb2RpZnkgb25lIG9yIG1vcmUgZG9jdW1lbnRzIGluIHRoZSBjb2xsZWN0aW9uLiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgbWF0Y2hlZCBkb2N1bWVudHMuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWV0aG9kIHVwZGF0ZUFzeW5jXG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge01vbmdvU2VsZWN0b3J9IHNlbGVjdG9yIFNwZWNpZmllcyB3aGljaCBkb2N1bWVudHMgdG8gbW9kaWZ5XG4gICAqIEBwYXJhbSB7TW9uZ29Nb2RpZmllcn0gbW9kaWZpZXIgU3BlY2lmaWVzIGhvdyB0byBtb2RpZnkgdGhlIGRvY3VtZW50c1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5tdWx0aSBUcnVlIHRvIG1vZGlmeSBhbGwgbWF0Y2hpbmcgZG9jdW1lbnRzOyBmYWxzZSB0byBvbmx5IG1vZGlmeSBvbmUgb2YgdGhlIG1hdGNoaW5nIGRvY3VtZW50cyAodGhlIGRlZmF1bHQpLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMudXBzZXJ0IFRydWUgdG8gaW5zZXJ0IGEgZG9jdW1lbnQgaWYgbm8gbWF0Y2hpbmcgZG9jdW1lbnRzIGFyZSBmb3VuZC5cbiAgICogQHBhcmFtIHtBcnJheX0gb3B0aW9ucy5hcnJheUZpbHRlcnMgT3B0aW9uYWwuIFVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBNb25nb0RCIFtmaWx0ZXJlZCBwb3NpdGlvbmFsIG9wZXJhdG9yXShodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL3JlZmVyZW5jZS9vcGVyYXRvci91cGRhdGUvcG9zaXRpb25hbC1maWx0ZXJlZC8pIHRvIHNwZWNpZnkgd2hpY2ggZWxlbWVudHMgdG8gbW9kaWZ5IGluIGFuIGFycmF5IGZpZWxkLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgJ3VwZGF0ZScsXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBNb2RpZnkgb25lIG9yIG1vcmUgZG9jdW1lbnRzIGluIHRoZSBjb2xsZWN0aW9uLCBvciBpbnNlcnQgb25lIGlmIG5vIG1hdGNoaW5nIGRvY3VtZW50cyB3ZXJlIGZvdW5kLiBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGtleXMgYG51bWJlckFmZmVjdGVkYCAodGhlIG51bWJlciBvZiBkb2N1bWVudHMgbW9kaWZpZWQpICBhbmQgYGluc2VydGVkSWRgICh0aGUgdW5pcXVlIF9pZCBvZiB0aGUgZG9jdW1lbnQgdGhhdCB3YXMgaW5zZXJ0ZWQsIGlmIGFueSkuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWV0aG9kIHVwc2VydEFzeW5jXG4gICAqIEBtZW1iZXJvZiBNb25nby5Db2xsZWN0aW9uXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge01vbmdvU2VsZWN0b3J9IHNlbGVjdG9yIFNwZWNpZmllcyB3aGljaCBkb2N1bWVudHMgdG8gbW9kaWZ5XG4gICAqIEBwYXJhbSB7TW9uZ29Nb2RpZmllcn0gbW9kaWZpZXIgU3BlY2lmaWVzIGhvdyB0byBtb2RpZnkgdGhlIGRvY3VtZW50c1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5tdWx0aSBUcnVlIHRvIG1vZGlmeSBhbGwgbWF0Y2hpbmcgZG9jdW1lbnRzOyBmYWxzZSB0byBvbmx5IG1vZGlmeSBvbmUgb2YgdGhlIG1hdGNoaW5nIGRvY3VtZW50cyAodGhlIGRlZmF1bHQpLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgJ3Vwc2VydCcsXG5dO1xuXG5leHBvcnQgY29uc3QgQVNZTkNfQ1VSU09SX01FVEhPRFMgPSBbXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBpbiAyLjlcbiAgICogQHN1bW1hcnkgUmV0dXJucyB0aGUgbnVtYmVyIG9mIGRvY3VtZW50cyB0aGF0IG1hdGNoIGEgcXVlcnkuIFRoaXMgbWV0aG9kIGlzXG4gICAqICAgICAgICAgIFtkZXByZWNhdGVkIHNpbmNlIE1vbmdvREIgNC4wXShodHRwczovL3d3dy5tb25nb2RiLmNvbS9kb2NzL3Y0LjQvcmVmZXJlbmNlL2NvbW1hbmQvY291bnQvKTtcbiAgICogICAgICAgICAgc2VlIGBDb2xsZWN0aW9uLmNvdW50RG9jdW1lbnRzYCBhbmRcbiAgICogICAgICAgICAgYENvbGxlY3Rpb24uZXN0aW1hdGVkRG9jdW1lbnRDb3VudGAgZm9yIGEgcmVwbGFjZW1lbnQuXG4gICAqIEBtZW1iZXJPZiBNb25nby5DdXJzb3JcbiAgICogQG1ldGhvZCAgY291bnRBc3luY1xuICAgKiBAaW5zdGFuY2VcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgJ2NvdW50JyxcbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJldHVybiBhbGwgbWF0Y2hpbmcgZG9jdW1lbnRzIGFzIGFuIEFycmF5LlxuICAgKiBAbWVtYmVyT2YgTW9uZ28uQ3Vyc29yXG4gICAqIEBtZXRob2QgIGZldGNoQXN5bmNcbiAgICogQGluc3RhbmNlXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gICdmZXRjaCcsXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBDYWxsIGBjYWxsYmFja2Agb25jZSBmb3IgZWFjaCBtYXRjaGluZyBkb2N1bWVudCwgc2VxdWVudGlhbGx5IGFuZFxuICAgKiAgICAgICAgICBzeW5jaHJvbm91c2x5LlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1ldGhvZCAgZm9yRWFjaEFzeW5jXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAbWVtYmVyT2YgTW9uZ28uQ3Vyc29yXG4gICAqIEBwYXJhbSB7SXRlcmF0aW9uQ2FsbGJhY2t9IGNhbGxiYWNrIEZ1bmN0aW9uIHRvIGNhbGwuIEl0IHdpbGwgYmUgY2FsbGVkXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGggdGhyZWUgYXJndW1lbnRzOiB0aGUgZG9jdW1lbnQsIGFcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMC1iYXNlZCBpbmRleCwgYW5kIDxlbT5jdXJzb3I8L2VtPlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdHNlbGYuXG4gICAqIEBwYXJhbSB7QW55fSBbdGhpc0FyZ10gQW4gb2JqZWN0IHdoaWNoIHdpbGwgYmUgdGhlIHZhbHVlIG9mIGB0aGlzYCBpbnNpZGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBgY2FsbGJhY2tgLlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gICdmb3JFYWNoJyxcbiAgLyoqXG4gICAqIEBzdW1tYXJ5IE1hcCBjYWxsYmFjayBvdmVyIGFsbCBtYXRjaGluZyBkb2N1bWVudHMuICBSZXR1cm5zIGFuIEFycmF5LlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1ldGhvZCBtYXBBc3luY1xuICAgKiBAaW5zdGFuY2VcbiAgICogQG1lbWJlck9mIE1vbmdvLkN1cnNvclxuICAgKiBAcGFyYW0ge0l0ZXJhdGlvbkNhbGxiYWNrfSBjYWxsYmFjayBGdW5jdGlvbiB0byBjYWxsLiBJdCB3aWxsIGJlIGNhbGxlZFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRoIHRocmVlIGFyZ3VtZW50czogdGhlIGRvY3VtZW50LCBhXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAtYmFzZWQgaW5kZXgsIGFuZCA8ZW0+Y3Vyc29yPC9lbT5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRzZWxmLlxuICAgKiBAcGFyYW0ge0FueX0gW3RoaXNBcmddIEFuIG9iamVjdCB3aGljaCB3aWxsIGJlIHRoZSB2YWx1ZSBvZiBgdGhpc2AgaW5zaWRlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgYGNhbGxiYWNrYC5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICAnbWFwJyxcbl07XG5cbmV4cG9ydCBjb25zdCBDTElFTlRfT05MWV9NRVRIT0RTID0gW1wiZmluZE9uZVwiLCBcImluc2VydFwiLCBcInJlbW92ZVwiLCBcInVwZGF0ZVwiLCBcInVwc2VydFwiXTtcbiIsImltcG9ydCBMb2NhbENvbGxlY3Rpb24gZnJvbSAnLi9sb2NhbF9jb2xsZWN0aW9uLmpzJztcbmltcG9ydCB7IGhhc093biB9IGZyb20gJy4vY29tbW9uLmpzJztcbmltcG9ydCB7IEFTWU5DX0NVUlNPUl9NRVRIT0RTLCBnZXRBc3luY01ldGhvZE5hbWUgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5cbi8vIEN1cnNvcjogYSBzcGVjaWZpY2F0aW9uIGZvciBhIHBhcnRpY3VsYXIgc3Vic2V0IG9mIGRvY3VtZW50cywgdy8gYSBkZWZpbmVkXG4vLyBvcmRlciwgbGltaXQsIGFuZCBvZmZzZXQuICBjcmVhdGluZyBhIEN1cnNvciB3aXRoIExvY2FsQ29sbGVjdGlvbi5maW5kKCksXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDdXJzb3Ige1xuICAvLyBkb24ndCBjYWxsIHRoaXMgY3RvciBkaXJlY3RseS4gIHVzZSBMb2NhbENvbGxlY3Rpb24uZmluZCgpLlxuICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uLCBzZWxlY3Rvciwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5jb2xsZWN0aW9uID0gY29sbGVjdGlvbjtcbiAgICB0aGlzLnNvcnRlciA9IG51bGw7XG4gICAgdGhpcy5tYXRjaGVyID0gbmV3IE1pbmltb25nby5NYXRjaGVyKHNlbGVjdG9yKTtcblxuICAgIGlmIChMb2NhbENvbGxlY3Rpb24uX3NlbGVjdG9ySXNJZFBlcmhhcHNBc09iamVjdChzZWxlY3RvcikpIHtcbiAgICAgIC8vIHN0YXNoIGZvciBmYXN0IF9pZCBhbmQgeyBfaWQgfVxuICAgICAgdGhpcy5fc2VsZWN0b3JJZCA9IGhhc093bi5jYWxsKHNlbGVjdG9yLCAnX2lkJykgPyBzZWxlY3Rvci5faWQgOiBzZWxlY3RvcjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc2VsZWN0b3JJZCA9IHVuZGVmaW5lZDtcblxuICAgICAgaWYgKHRoaXMubWF0Y2hlci5oYXNHZW9RdWVyeSgpIHx8IG9wdGlvbnMuc29ydCkge1xuICAgICAgICB0aGlzLnNvcnRlciA9IG5ldyBNaW5pbW9uZ28uU29ydGVyKG9wdGlvbnMuc29ydCB8fCBbXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5za2lwID0gb3B0aW9ucy5za2lwIHx8IDA7XG4gICAgdGhpcy5saW1pdCA9IG9wdGlvbnMubGltaXQ7XG4gICAgdGhpcy5maWVsZHMgPSBvcHRpb25zLnByb2plY3Rpb24gfHwgb3B0aW9ucy5maWVsZHM7XG5cbiAgICB0aGlzLl9wcm9qZWN0aW9uRm4gPSBMb2NhbENvbGxlY3Rpb24uX2NvbXBpbGVQcm9qZWN0aW9uKHRoaXMuZmllbGRzIHx8IHt9KTtcblxuICAgIHRoaXMuX3RyYW5zZm9ybSA9IExvY2FsQ29sbGVjdGlvbi53cmFwVHJhbnNmb3JtKG9wdGlvbnMudHJhbnNmb3JtKTtcblxuICAgIC8vIGJ5IGRlZmF1bHQsIHF1ZXJpZXMgcmVnaXN0ZXIgdy8gVHJhY2tlciB3aGVuIGl0IGlzIGF2YWlsYWJsZS5cbiAgICBpZiAodHlwZW9mIFRyYWNrZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLnJlYWN0aXZlID0gb3B0aW9ucy5yZWFjdGl2ZSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IG9wdGlvbnMucmVhY3RpdmU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIGluIDIuOVxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIHRoZSBudW1iZXIgb2YgZG9jdW1lbnRzIHRoYXQgbWF0Y2ggYSBxdWVyeS4gVGhpcyBtZXRob2QgaXNcbiAgICogICAgICAgICAgW2RlcHJlY2F0ZWQgc2luY2UgTW9uZ29EQiA0LjBdKGh0dHBzOi8vd3d3Lm1vbmdvZGIuY29tL2RvY3MvdjQuNC9yZWZlcmVuY2UvY29tbWFuZC9jb3VudC8pO1xuICAgKiAgICAgICAgICBzZWUgYENvbGxlY3Rpb24uY291bnREb2N1bWVudHNgIGFuZFxuICAgKiAgICAgICAgICBgQ29sbGVjdGlvbi5lc3RpbWF0ZWREb2N1bWVudENvdW50YCBmb3IgYSByZXBsYWNlbWVudC5cbiAgICogQG1lbWJlck9mIE1vbmdvLkN1cnNvclxuICAgKiBAbWV0aG9kICBjb3VudFxuICAgKiBAaW5zdGFuY2VcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gICAqL1xuICBjb3VudCgpIHtcbiAgICBpZiAodGhpcy5yZWFjdGl2ZSkge1xuICAgICAgLy8gYWxsb3cgdGhlIG9ic2VydmUgdG8gYmUgdW5vcmRlcmVkXG4gICAgICB0aGlzLl9kZXBlbmQoeyBhZGRlZDogdHJ1ZSwgcmVtb3ZlZDogdHJ1ZSB9LCB0cnVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZ2V0UmF3T2JqZWN0cyh7XG4gICAgICBvcmRlcmVkOiB0cnVlLFxuICAgIH0pLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBSZXR1cm4gYWxsIG1hdGNoaW5nIGRvY3VtZW50cyBhcyBhbiBBcnJheS5cbiAgICogQG1lbWJlck9mIE1vbmdvLkN1cnNvclxuICAgKiBAbWV0aG9kICBmZXRjaFxuICAgKiBAaW5zdGFuY2VcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEByZXR1cm5zIHtPYmplY3RbXX1cbiAgICovXG4gIGZldGNoKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuXG4gICAgdGhpcy5mb3JFYWNoKGRvYyA9PiB7XG4gICAgICByZXN1bHQucHVzaChkb2MpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIFtTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgIGlmICh0aGlzLnJlYWN0aXZlKSB7XG4gICAgICB0aGlzLl9kZXBlbmQoe1xuICAgICAgICBhZGRlZEJlZm9yZTogdHJ1ZSxcbiAgICAgICAgcmVtb3ZlZDogdHJ1ZSxcbiAgICAgICAgY2hhbmdlZDogdHJ1ZSxcbiAgICAgICAgbW92ZWRCZWZvcmU6IHRydWUsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsZXQgaW5kZXggPSAwO1xuICAgIGNvbnN0IG9iamVjdHMgPSB0aGlzLl9nZXRSYXdPYmplY3RzKHsgb3JkZXJlZDogdHJ1ZSB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICBuZXh0OiAoKSA9PiB7XG4gICAgICAgIGlmIChpbmRleCA8IG9iamVjdHMubGVuZ3RoKSB7XG4gICAgICAgICAgLy8gVGhpcyBkb3VibGVzIGFzIGEgY2xvbmUgb3BlcmF0aW9uLlxuICAgICAgICAgIGxldCBlbGVtZW50ID0gdGhpcy5fcHJvamVjdGlvbkZuKG9iamVjdHNbaW5kZXgrK10pO1xuXG4gICAgICAgICAgaWYgKHRoaXMuX3RyYW5zZm9ybSkgZWxlbWVudCA9IHRoaXMuX3RyYW5zZm9ybShlbGVtZW50KTtcblxuICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBlbGVtZW50IH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyBkb25lOiB0cnVlIH07XG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCkge1xuICAgIGNvbnN0IHN5bmNSZXN1bHQgPSB0aGlzW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgICByZXR1cm4ge1xuICAgICAgYXN5bmMgbmV4dCgpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzeW5jUmVzdWx0Lm5leHQoKSk7XG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQGNhbGxiYWNrIEl0ZXJhdGlvbkNhbGxiYWNrXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkb2NcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGluZGV4XG4gICAqL1xuICAvKipcbiAgICogQHN1bW1hcnkgQ2FsbCBgY2FsbGJhY2tgIG9uY2UgZm9yIGVhY2ggbWF0Y2hpbmcgZG9jdW1lbnQsIHNlcXVlbnRpYWxseSBhbmRcbiAgICogICAgICAgICAgc3luY2hyb25vdXNseS5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZXRob2QgIGZvckVhY2hcbiAgICogQGluc3RhbmNlXG4gICAqIEBtZW1iZXJPZiBNb25nby5DdXJzb3JcbiAgICogQHBhcmFtIHtJdGVyYXRpb25DYWxsYmFja30gY2FsbGJhY2sgRnVuY3Rpb24gdG8gY2FsbC4gSXQgd2lsbCBiZSBjYWxsZWRcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aCB0aHJlZSBhcmd1bWVudHM6IHRoZSBkb2N1bWVudCwgYVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLWJhc2VkIGluZGV4LCBhbmQgPGVtPmN1cnNvcjwvZW0+XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0c2VsZi5cbiAgICogQHBhcmFtIHtBbnl9IFt0aGlzQXJnXSBBbiBvYmplY3Qgd2hpY2ggd2lsbCBiZSB0aGUgdmFsdWUgb2YgYHRoaXNgIGluc2lkZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIGBjYWxsYmFja2AuXG4gICAqL1xuICBmb3JFYWNoKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgaWYgKHRoaXMucmVhY3RpdmUpIHtcbiAgICAgIHRoaXMuX2RlcGVuZCh7XG4gICAgICAgIGFkZGVkQmVmb3JlOiB0cnVlLFxuICAgICAgICByZW1vdmVkOiB0cnVlLFxuICAgICAgICBjaGFuZ2VkOiB0cnVlLFxuICAgICAgICBtb3ZlZEJlZm9yZTogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuX2dldFJhd09iamVjdHMoeyBvcmRlcmVkOiB0cnVlIH0pLmZvckVhY2goKGVsZW1lbnQsIGkpID0+IHtcbiAgICAgIC8vIFRoaXMgZG91YmxlcyBhcyBhIGNsb25lIG9wZXJhdGlvbi5cbiAgICAgIGVsZW1lbnQgPSB0aGlzLl9wcm9qZWN0aW9uRm4oZWxlbWVudCk7XG5cbiAgICAgIGlmICh0aGlzLl90cmFuc2Zvcm0pIHtcbiAgICAgICAgZWxlbWVudCA9IHRoaXMuX3RyYW5zZm9ybShlbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCBlbGVtZW50LCBpLCB0aGlzKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldFRyYW5zZm9ybSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtO1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IE1hcCBjYWxsYmFjayBvdmVyIGFsbCBtYXRjaGluZyBkb2N1bWVudHMuICBSZXR1cm5zIGFuIEFycmF5LlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1ldGhvZCBtYXBcbiAgICogQGluc3RhbmNlXG4gICAqIEBtZW1iZXJPZiBNb25nby5DdXJzb3JcbiAgICogQHBhcmFtIHtJdGVyYXRpb25DYWxsYmFja30gY2FsbGJhY2sgRnVuY3Rpb24gdG8gY2FsbC4gSXQgd2lsbCBiZSBjYWxsZWRcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aCB0aHJlZSBhcmd1bWVudHM6IHRoZSBkb2N1bWVudCwgYVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLWJhc2VkIGluZGV4LCBhbmQgPGVtPmN1cnNvcjwvZW0+XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0c2VsZi5cbiAgICogQHBhcmFtIHtBbnl9IFt0aGlzQXJnXSBBbiBvYmplY3Qgd2hpY2ggd2lsbCBiZSB0aGUgdmFsdWUgb2YgYHRoaXNgIGluc2lkZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIGBjYWxsYmFja2AuXG4gICAqL1xuICBtYXAoY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICBjb25zdCByZXN1bHQgPSBbXTtcblxuICAgIHRoaXMuZm9yRWFjaCgoZG9jLCBpKSA9PiB7XG4gICAgICByZXN1bHQucHVzaChjYWxsYmFjay5jYWxsKHRoaXNBcmcsIGRvYywgaSwgdGhpcykpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIG9wdGlvbnMgdG8gY29udGFpbjpcbiAgLy8gICogY2FsbGJhY2tzIGZvciBvYnNlcnZlKCk6XG4gIC8vICAgIC0gYWRkZWRBdCAoZG9jdW1lbnQsIGF0SW5kZXgpXG4gIC8vICAgIC0gYWRkZWQgKGRvY3VtZW50KVxuICAvLyAgICAtIGNoYW5nZWRBdCAobmV3RG9jdW1lbnQsIG9sZERvY3VtZW50LCBhdEluZGV4KVxuICAvLyAgICAtIGNoYW5nZWQgKG5ld0RvY3VtZW50LCBvbGREb2N1bWVudClcbiAgLy8gICAgLSByZW1vdmVkQXQgKGRvY3VtZW50LCBhdEluZGV4KVxuICAvLyAgICAtIHJlbW92ZWQgKGRvY3VtZW50KVxuICAvLyAgICAtIG1vdmVkVG8gKGRvY3VtZW50LCBvbGRJbmRleCwgbmV3SW5kZXgpXG4gIC8vXG4gIC8vIGF0dHJpYnV0ZXMgYXZhaWxhYmxlIG9uIHJldHVybmVkIHF1ZXJ5IGhhbmRsZTpcbiAgLy8gICogc3RvcCgpOiBlbmQgdXBkYXRlc1xuICAvLyAgKiBjb2xsZWN0aW9uOiB0aGUgY29sbGVjdGlvbiB0aGlzIHF1ZXJ5IGlzIHF1ZXJ5aW5nXG4gIC8vXG4gIC8vIGlmZiB4IGlzIGEgcmV0dXJuZWQgcXVlcnkgaGFuZGxlLCAoeCBpbnN0YW5jZW9mXG4gIC8vIExvY2FsQ29sbGVjdGlvbi5PYnNlcnZlSGFuZGxlKSBpcyB0cnVlXG4gIC8vXG4gIC8vIGluaXRpYWwgcmVzdWx0cyBkZWxpdmVyZWQgdGhyb3VnaCBhZGRlZCBjYWxsYmFja1xuICAvLyBYWFggbWF5YmUgY2FsbGJhY2tzIHNob3VsZCB0YWtlIGEgbGlzdCBvZiBvYmplY3RzLCB0byBleHBvc2UgdHJhbnNhY3Rpb25zP1xuICAvLyBYWFggbWF5YmUgc3VwcG9ydCBmaWVsZCBsaW1pdGluZyAodG8gbGltaXQgd2hhdCB5b3UncmUgbm90aWZpZWQgb24pXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFdhdGNoIGEgcXVlcnkuICBSZWNlaXZlIGNhbGxiYWNrcyBhcyB0aGUgcmVzdWx0IHNldCBjaGFuZ2VzLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIE1vbmdvLkN1cnNvclxuICAgKiBAaW5zdGFuY2VcbiAgICogQHBhcmFtIHtPYmplY3R9IGNhbGxiYWNrcyBGdW5jdGlvbnMgdG8gY2FsbCB0byBkZWxpdmVyIHRoZSByZXN1bHQgc2V0IGFzIGl0XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlc1xuICAgKi9cbiAgb2JzZXJ2ZShvcHRpb25zKSB7XG4gICAgcmV0dXJuIExvY2FsQ29sbGVjdGlvbi5fb2JzZXJ2ZUZyb21PYnNlcnZlQ2hhbmdlcyh0aGlzLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBXYXRjaCBhIHF1ZXJ5LiAgUmVjZWl2ZSBjYWxsYmFja3MgYXMgdGhlIHJlc3VsdCBzZXQgY2hhbmdlcy5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBNb25nby5DdXJzb3JcbiAgICogQGluc3RhbmNlXG4gICAqL1xuICBvYnNlcnZlQXN5bmMob3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHJlc29sdmUodGhpcy5vYnNlcnZlKG9wdGlvbnMpKSk7XG4gIH1cblxuICAvKipcbiAgICogQHN1bW1hcnkgV2F0Y2ggYSBxdWVyeS4gUmVjZWl2ZSBjYWxsYmFja3MgYXMgdGhlIHJlc3VsdCBzZXQgY2hhbmdlcy4gT25seVxuICAgKiAgICAgICAgICB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgb2xkIGFuZCBuZXcgZG9jdW1lbnRzIGFyZSBwYXNzZWQgdG9cbiAgICogICAgICAgICAgdGhlIGNhbGxiYWNrcy5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBNb25nby5DdXJzb3JcbiAgICogQGluc3RhbmNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjYWxsYmFja3MgRnVuY3Rpb25zIHRvIGNhbGwgdG8gZGVsaXZlciB0aGUgcmVzdWx0IHNldCBhcyBpdFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZXNcbiAgICovXG4gIG9ic2VydmVDaGFuZ2VzKG9wdGlvbnMpIHtcbiAgICBjb25zdCBvcmRlcmVkID0gTG9jYWxDb2xsZWN0aW9uLl9vYnNlcnZlQ2hhbmdlc0NhbGxiYWNrc0FyZU9yZGVyZWQob3B0aW9ucyk7XG5cbiAgICAvLyB0aGVyZSBhcmUgc2V2ZXJhbCBwbGFjZXMgdGhhdCBhc3N1bWUgeW91IGFyZW4ndCBjb21iaW5pbmcgc2tpcC9saW1pdCB3aXRoXG4gICAgLy8gdW5vcmRlcmVkIG9ic2VydmUuICBlZywgdXBkYXRlJ3MgRUpTT04uY2xvbmUsIGFuZCB0aGUgXCJ0aGVyZSBhcmUgc2V2ZXJhbFwiXG4gICAgLy8gY29tbWVudCBpbiBfbW9kaWZ5QW5kTm90aWZ5XG4gICAgLy8gWFhYIGFsbG93IHNraXAvbGltaXQgd2l0aCB1bm9yZGVyZWQgb2JzZXJ2ZVxuICAgIGlmICghb3B0aW9ucy5fYWxsb3dfdW5vcmRlcmVkICYmICFvcmRlcmVkICYmICh0aGlzLnNraXAgfHwgdGhpcy5saW1pdCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJNdXN0IHVzZSBhbiBvcmRlcmVkIG9ic2VydmUgd2l0aCBza2lwIG9yIGxpbWl0IChpLmUuICdhZGRlZEJlZm9yZScgXCIgK1xuICAgICAgICAgIFwiZm9yIG9ic2VydmVDaGFuZ2VzIG9yICdhZGRlZEF0JyBmb3Igb2JzZXJ2ZSwgaW5zdGVhZCBvZiAnYWRkZWQnKS5cIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5maWVsZHMgJiYgKHRoaXMuZmllbGRzLl9pZCA9PT0gMCB8fCB0aGlzLmZpZWxkcy5faWQgPT09IGZhbHNlKSkge1xuICAgICAgdGhyb3cgRXJyb3IoXCJZb3UgbWF5IG5vdCBvYnNlcnZlIGEgY3Vyc29yIHdpdGgge2ZpZWxkczoge19pZDogMH19XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGRpc3RhbmNlcyA9XG4gICAgICB0aGlzLm1hdGNoZXIuaGFzR2VvUXVlcnkoKSAmJiBvcmRlcmVkICYmIG5ldyBMb2NhbENvbGxlY3Rpb24uX0lkTWFwKCk7XG5cbiAgICBjb25zdCBxdWVyeSA9IHtcbiAgICAgIGN1cnNvcjogdGhpcyxcbiAgICAgIGRpcnR5OiBmYWxzZSxcbiAgICAgIGRpc3RhbmNlcyxcbiAgICAgIG1hdGNoZXI6IHRoaXMubWF0Y2hlciwgLy8gbm90IGZhc3QgcGF0aGVkXG4gICAgICBvcmRlcmVkLFxuICAgICAgcHJvamVjdGlvbkZuOiB0aGlzLl9wcm9qZWN0aW9uRm4sXG4gICAgICByZXN1bHRzU25hcHNob3Q6IG51bGwsXG4gICAgICBzb3J0ZXI6IG9yZGVyZWQgJiYgdGhpcy5zb3J0ZXIsXG4gICAgfTtcblxuICAgIGxldCBxaWQ7XG5cbiAgICAvLyBOb24tcmVhY3RpdmUgcXVlcmllcyBjYWxsIGFkZGVkW0JlZm9yZV0gYW5kIHRoZW4gbmV2ZXIgY2FsbCBhbnl0aGluZ1xuICAgIC8vIGVsc2UuXG4gICAgaWYgKHRoaXMucmVhY3RpdmUpIHtcbiAgICAgIHFpZCA9IHRoaXMuY29sbGVjdGlvbi5uZXh0X3FpZCsrO1xuICAgICAgdGhpcy5jb2xsZWN0aW9uLnF1ZXJpZXNbcWlkXSA9IHF1ZXJ5O1xuICAgIH1cblxuICAgIHF1ZXJ5LnJlc3VsdHMgPSB0aGlzLl9nZXRSYXdPYmplY3RzKHtcbiAgICAgIG9yZGVyZWQsXG4gICAgICBkaXN0YW5jZXM6IHF1ZXJ5LmRpc3RhbmNlcyxcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLmNvbGxlY3Rpb24ucGF1c2VkKSB7XG4gICAgICBxdWVyeS5yZXN1bHRzU25hcHNob3QgPSBvcmRlcmVkID8gW10gOiBuZXcgTG9jYWxDb2xsZWN0aW9uLl9JZE1hcCgpO1xuICAgIH1cblxuICAgIC8vIHdyYXAgY2FsbGJhY2tzIHdlIHdlcmUgcGFzc2VkLiBjYWxsYmFja3Mgb25seSBmaXJlIHdoZW4gbm90IHBhdXNlZCBhbmRcbiAgICAvLyBhcmUgbmV2ZXIgdW5kZWZpbmVkXG4gICAgLy8gRmlsdGVycyBvdXQgYmxhY2tsaXN0ZWQgZmllbGRzIGFjY29yZGluZyB0byBjdXJzb3IncyBwcm9qZWN0aW9uLlxuICAgIC8vIFhYWCB3cm9uZyBwbGFjZSBmb3IgdGhpcz9cblxuICAgIC8vIGZ1cnRoZXJtb3JlLCBjYWxsYmFja3MgZW5xdWV1ZSB1bnRpbCB0aGUgb3BlcmF0aW9uIHdlJ3JlIHdvcmtpbmcgb24gaXNcbiAgICAvLyBkb25lLlxuICAgIGNvbnN0IHdyYXBDYWxsYmFjayA9IChmbikgPT4ge1xuICAgICAgaWYgKCFmbikge1xuICAgICAgICByZXR1cm4gKCkgPT4ge307XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKC8qIGFyZ3MqLykge1xuICAgICAgICBpZiAoc2VsZi5jb2xsZWN0aW9uLnBhdXNlZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICAgICAgc2VsZi5jb2xsZWN0aW9uLl9vYnNlcnZlUXVldWUucXVldWVUYXNrKCgpID0+IHtcbiAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH07XG5cbiAgICBxdWVyeS5hZGRlZCA9IHdyYXBDYWxsYmFjayhvcHRpb25zLmFkZGVkKTtcbiAgICBxdWVyeS5jaGFuZ2VkID0gd3JhcENhbGxiYWNrKG9wdGlvbnMuY2hhbmdlZCk7XG4gICAgcXVlcnkucmVtb3ZlZCA9IHdyYXBDYWxsYmFjayhvcHRpb25zLnJlbW92ZWQpO1xuXG4gICAgaWYgKG9yZGVyZWQpIHtcbiAgICAgIHF1ZXJ5LmFkZGVkQmVmb3JlID0gd3JhcENhbGxiYWNrKG9wdGlvbnMuYWRkZWRCZWZvcmUpO1xuICAgICAgcXVlcnkubW92ZWRCZWZvcmUgPSB3cmFwQ2FsbGJhY2sob3B0aW9ucy5tb3ZlZEJlZm9yZSk7XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLl9zdXBwcmVzc19pbml0aWFsICYmICF0aGlzLmNvbGxlY3Rpb24ucGF1c2VkKSB7XG4gICAgICBjb25zdCBoYW5kbGVyID0gKGRvYykgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZHMgPSBFSlNPTi5jbG9uZShkb2MpO1xuXG4gICAgICAgIGRlbGV0ZSBmaWVsZHMuX2lkO1xuXG4gICAgICAgIGlmIChvcmRlcmVkKSB7XG4gICAgICAgICAgcXVlcnkuYWRkZWRCZWZvcmUoZG9jLl9pZCwgdGhpcy5fcHJvamVjdGlvbkZuKGZpZWxkcyksIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcXVlcnkuYWRkZWQoZG9jLl9pZCwgdGhpcy5fcHJvamVjdGlvbkZuKGZpZWxkcykpO1xuICAgICAgfTtcbiAgICAgIC8vIGl0IG1lYW5zIGl0J3MganVzdCBhbiBhcnJheVxuICAgICAgaWYgKHF1ZXJ5LnJlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAgIGZvciAoY29uc3QgZG9jIG9mIHF1ZXJ5LnJlc3VsdHMpIHtcbiAgICAgICAgICBoYW5kbGVyKGRvYyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGl0IG1lYW5zIGl0J3MgYW4gaWQgbWFwXG4gICAgICBpZiAocXVlcnkucmVzdWx0cz8uc2l6ZT8uKCkpIHtcbiAgICAgICAgcXVlcnkucmVzdWx0cy5mb3JFYWNoKGhhbmRsZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGhhbmRsZSA9IE9iamVjdC5hc3NpZ24obmV3IExvY2FsQ29sbGVjdGlvbi5PYnNlcnZlSGFuZGxlKCksIHtcbiAgICAgIGNvbGxlY3Rpb246IHRoaXMuY29sbGVjdGlvbixcbiAgICAgIHN0b3A6ICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMucmVhY3RpdmUpIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5jb2xsZWN0aW9uLnF1ZXJpZXNbcWlkXTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGlzUmVhZHk6IGZhbHNlLFxuICAgICAgaXNSZWFkeVByb21pc2U6IG51bGwsXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5yZWFjdGl2ZSAmJiBUcmFja2VyLmFjdGl2ZSkge1xuICAgICAgLy8gWFhYIGluIG1hbnkgY2FzZXMsIHRoZSBzYW1lIG9ic2VydmUgd2lsbCBiZSByZWNyZWF0ZWQgd2hlblxuICAgICAgLy8gdGhlIGN1cnJlbnQgYXV0b3J1biBpcyByZXJ1bi4gIHdlIGNvdWxkIHNhdmUgd29yayBieVxuICAgICAgLy8gbGV0dGluZyBpdCBsaW5nZXIgYWNyb3NzIHJlcnVuIGFuZCBwb3RlbnRpYWxseSBnZXRcbiAgICAgIC8vIHJlcHVycG9zZWQgaWYgdGhlIHNhbWUgb2JzZXJ2ZSBpcyBwZXJmb3JtZWQsIHVzaW5nIGxvZ2ljXG4gICAgICAvLyBzaW1pbGFyIHRvIHRoYXQgb2YgTWV0ZW9yLnN1YnNjcmliZS5cbiAgICAgIFRyYWNrZXIub25JbnZhbGlkYXRlKCgpID0+IHtcbiAgICAgICAgaGFuZGxlLnN0b3AoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHJ1biB0aGUgb2JzZXJ2ZSBjYWxsYmFja3MgcmVzdWx0aW5nIGZyb20gdGhlIGluaXRpYWwgY29udGVudHNcbiAgICAvLyBiZWZvcmUgd2UgbGVhdmUgdGhlIG9ic2VydmUuXG4gICAgY29uc3QgZHJhaW5SZXN1bHQgPSB0aGlzLmNvbGxlY3Rpb24uX29ic2VydmVRdWV1ZS5kcmFpbigpO1xuXG4gICAgaWYgKGRyYWluUmVzdWx0IGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgaGFuZGxlLmlzUmVhZHlQcm9taXNlID0gZHJhaW5SZXN1bHQ7XG4gICAgICBkcmFpblJlc3VsdC50aGVuKCgpID0+IChoYW5kbGUuaXNSZWFkeSA9IHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGFuZGxlLmlzUmVhZHkgPSB0cnVlO1xuICAgICAgaGFuZGxlLmlzUmVhZHlQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhhbmRsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBXYXRjaCBhIHF1ZXJ5LiBSZWNlaXZlIGNhbGxiYWNrcyBhcyB0aGUgcmVzdWx0IHNldCBjaGFuZ2VzLiBPbmx5XG4gICAqICAgICAgICAgIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIHRoZSBvbGQgYW5kIG5ldyBkb2N1bWVudHMgYXJlIHBhc3NlZCB0b1xuICAgKiAgICAgICAgICB0aGUgY2FsbGJhY2tzLlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIE1vbmdvLkN1cnNvclxuICAgKiBAaW5zdGFuY2VcbiAgICogQHBhcmFtIHtPYmplY3R9IGNhbGxiYWNrcyBGdW5jdGlvbnMgdG8gY2FsbCB0byBkZWxpdmVyIHRoZSByZXN1bHQgc2V0IGFzIGl0XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlc1xuICAgKi9cbiAgb2JzZXJ2ZUNoYW5nZXNBc3luYyhvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBjb25zdCBoYW5kbGUgPSB0aGlzLm9ic2VydmVDaGFuZ2VzKG9wdGlvbnMpO1xuICAgICAgaGFuZGxlLmlzUmVhZHlQcm9taXNlLnRoZW4oKCkgPT4gcmVzb2x2ZShoYW5kbGUpKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFhYWCBNYXliZSB3ZSBuZWVkIGEgdmVyc2lvbiBvZiBvYnNlcnZlIHRoYXQganVzdCBjYWxscyBhIGNhbGxiYWNrIGlmXG4gIC8vIGFueXRoaW5nIGNoYW5nZWQuXG4gIF9kZXBlbmQoY2hhbmdlcnMsIF9hbGxvd191bm9yZGVyZWQpIHtcbiAgICBpZiAoVHJhY2tlci5hY3RpdmUpIHtcbiAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSBuZXcgVHJhY2tlci5EZXBlbmRlbmN5KCk7XG4gICAgICBjb25zdCBub3RpZnkgPSBkZXBlbmRlbmN5LmNoYW5nZWQuYmluZChkZXBlbmRlbmN5KTtcblxuICAgICAgZGVwZW5kZW5jeS5kZXBlbmQoKTtcblxuICAgICAgY29uc3Qgb3B0aW9ucyA9IHsgX2FsbG93X3Vub3JkZXJlZCwgX3N1cHByZXNzX2luaXRpYWw6IHRydWUgfTtcblxuICAgICAgWydhZGRlZCcsICdhZGRlZEJlZm9yZScsICdjaGFuZ2VkJywgJ21vdmVkQmVmb3JlJywgJ3JlbW92ZWQnXS5mb3JFYWNoKFxuICAgICAgICBmbiA9PiB7XG4gICAgICAgICAgaWYgKGNoYW5nZXJzW2ZuXSkge1xuICAgICAgICAgICAgb3B0aW9uc1tmbl0gPSBub3RpZnk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgICAvLyBvYnNlcnZlQ2hhbmdlcyB3aWxsIHN0b3AoKSB3aGVuIHRoaXMgY29tcHV0YXRpb24gaXMgaW52YWxpZGF0ZWRcbiAgICAgIHRoaXMub2JzZXJ2ZUNoYW5nZXMob3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgX2dldENvbGxlY3Rpb25OYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbGxlY3Rpb24ubmFtZTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBjb2xsZWN0aW9uIG9mIG1hdGNoaW5nIG9iamVjdHMsIGJ1dCBkb2Vzbid0IGRlZXAgY29weSB0aGVtLlxuICAvL1xuICAvLyBJZiBvcmRlcmVkIGlzIHNldCwgcmV0dXJucyBhIHNvcnRlZCBhcnJheSwgcmVzcGVjdGluZyBzb3J0ZXIsIHNraXAsIGFuZFxuICAvLyBsaW1pdCBwcm9wZXJ0aWVzIG9mIHRoZSBxdWVyeSBwcm92aWRlZCB0aGF0IG9wdGlvbnMuYXBwbHlTa2lwTGltaXQgaXNcbiAgLy8gbm90IHNldCB0byBmYWxzZSAoIzEyMDEpLiBJZiBzb3J0ZXIgaXMgZmFsc2V5LCBubyBzb3J0IC0tIHlvdSBnZXQgdGhlXG4gIC8vIG5hdHVyYWwgb3JkZXIuXG4gIC8vXG4gIC8vIElmIG9yZGVyZWQgaXMgbm90IHNldCwgcmV0dXJucyBhbiBvYmplY3QgbWFwcGluZyBmcm9tIElEIHRvIGRvYyAoc29ydGVyLFxuICAvLyBza2lwIGFuZCBsaW1pdCBzaG91bGQgbm90IGJlIHNldCkuXG4gIC8vXG4gIC8vIElmIG9yZGVyZWQgaXMgc2V0IGFuZCB0aGlzIGN1cnNvciBpcyBhICRuZWFyIGdlb3F1ZXJ5LCB0aGVuIHRoaXMgZnVuY3Rpb25cbiAgLy8gd2lsbCB1c2UgYW4gX0lkTWFwIHRvIHRyYWNrIGVhY2ggZGlzdGFuY2UgZnJvbSB0aGUgJG5lYXIgYXJndW1lbnQgcG9pbnQgaW5cbiAgLy8gb3JkZXIgdG8gdXNlIGl0IGFzIGEgc29ydCBrZXkuIElmIGFuIF9JZE1hcCBpcyBwYXNzZWQgaW4gdGhlICdkaXN0YW5jZXMnXG4gIC8vIGFyZ3VtZW50LCB0aGlzIGZ1bmN0aW9uIHdpbGwgY2xlYXIgaXQgYW5kIHVzZSBpdCBmb3IgdGhpcyBwdXJwb3NlXG4gIC8vIChvdGhlcndpc2UgaXQgd2lsbCBqdXN0IGNyZWF0ZSBpdHMgb3duIF9JZE1hcCkuIFRoZSBvYnNlcnZlQ2hhbmdlc1xuICAvLyBpbXBsZW1lbnRhdGlvbiB1c2VzIHRoaXMgdG8gcmVtZW1iZXIgdGhlIGRpc3RhbmNlcyBhZnRlciB0aGlzIGZ1bmN0aW9uXG4gIC8vIHJldHVybnMuXG4gIF9nZXRSYXdPYmplY3RzKG9wdGlvbnMgPSB7fSkge1xuICAgIC8vIEJ5IGRlZmF1bHQgdGhpcyBtZXRob2Qgd2lsbCByZXNwZWN0IHNraXAgYW5kIGxpbWl0IGJlY2F1c2UgLmZldGNoKCksXG4gICAgLy8gLmZvckVhY2goKSBldGMuLi4gZXhwZWN0IHRoaXMgYmVoYXZpb3VyLiBJdCBjYW4gYmUgZm9yY2VkIHRvIGlnbm9yZVxuICAgIC8vIHNraXAgYW5kIGxpbWl0IGJ5IHNldHRpbmcgYXBwbHlTa2lwTGltaXQgdG8gZmFsc2UgKC5jb3VudCgpIGRvZXMgdGhpcyxcbiAgICAvLyBmb3IgZXhhbXBsZSlcbiAgICBjb25zdCBhcHBseVNraXBMaW1pdCA9IG9wdGlvbnMuYXBwbHlTa2lwTGltaXQgIT09IGZhbHNlO1xuXG4gICAgLy8gWFhYIHVzZSBPcmRlcmVkRGljdCBpbnN0ZWFkIG9mIGFycmF5LCBhbmQgbWFrZSBJZE1hcCBhbmQgT3JkZXJlZERpY3RcbiAgICAvLyBjb21wYXRpYmxlXG4gICAgY29uc3QgcmVzdWx0cyA9IG9wdGlvbnMub3JkZXJlZCA/IFtdIDogbmV3IExvY2FsQ29sbGVjdGlvbi5fSWRNYXAoKTtcblxuICAgIC8vIGZhc3QgcGF0aCBmb3Igc2luZ2xlIElEIHZhbHVlXG4gICAgaWYgKHRoaXMuX3NlbGVjdG9ySWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gSWYgeW91IGhhdmUgbm9uLXplcm8gc2tpcCBhbmQgYXNrIGZvciBhIHNpbmdsZSBpZCwgeW91IGdldCBub3RoaW5nLlxuICAgICAgLy8gVGhpcyBpcyBzbyBpdCBtYXRjaGVzIHRoZSBiZWhhdmlvciBvZiB0aGUgJ3tfaWQ6IGZvb30nIHBhdGguXG4gICAgICBpZiAoYXBwbHlTa2lwTGltaXQgJiYgdGhpcy5za2lwKSB7XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzZWxlY3RlZERvYyA9IHRoaXMuY29sbGVjdGlvbi5fZG9jcy5nZXQodGhpcy5fc2VsZWN0b3JJZCk7XG4gICAgICBpZiAoc2VsZWN0ZWREb2MpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMub3JkZXJlZCkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChzZWxlY3RlZERvYyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0cy5zZXQodGhpcy5fc2VsZWN0b3JJZCwgc2VsZWN0ZWREb2MpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG5cbiAgICAvLyBzbG93IHBhdGggZm9yIGFyYml0cmFyeSBzZWxlY3Rvciwgc29ydCwgc2tpcCwgbGltaXRcblxuICAgIC8vIGluIHRoZSBvYnNlcnZlQ2hhbmdlcyBjYXNlLCBkaXN0YW5jZXMgaXMgYWN0dWFsbHkgcGFydCBvZiB0aGUgXCJxdWVyeVwiXG4gICAgLy8gKGllLCBsaXZlIHJlc3VsdHMgc2V0KSBvYmplY3QuICBpbiBvdGhlciBjYXNlcywgZGlzdGFuY2VzIGlzIG9ubHkgdXNlZFxuICAgIC8vIGluc2lkZSB0aGlzIGZ1bmN0aW9uLlxuICAgIGxldCBkaXN0YW5jZXM7XG4gICAgaWYgKHRoaXMubWF0Y2hlci5oYXNHZW9RdWVyeSgpICYmIG9wdGlvbnMub3JkZXJlZCkge1xuICAgICAgaWYgKG9wdGlvbnMuZGlzdGFuY2VzKSB7XG4gICAgICAgIGRpc3RhbmNlcyA9IG9wdGlvbnMuZGlzdGFuY2VzO1xuICAgICAgICBkaXN0YW5jZXMuY2xlYXIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRpc3RhbmNlcyA9IG5ldyBMb2NhbENvbGxlY3Rpb24uX0lkTWFwKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgTWV0ZW9yLl9ydW5GcmVzaCgoKSA9PiB7XG4gICAgICB0aGlzLmNvbGxlY3Rpb24uX2RvY3MuZm9yRWFjaCgoZG9jLCBpZCkgPT4ge1xuICAgICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IHRoaXMubWF0Y2hlci5kb2N1bWVudE1hdGNoZXMoZG9jKTtcbiAgICAgICAgaWYgKG1hdGNoUmVzdWx0LnJlc3VsdCkge1xuICAgICAgICAgIGlmIChvcHRpb25zLm9yZGVyZWQpIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChkb2MpO1xuXG4gICAgICAgICAgICBpZiAoZGlzdGFuY2VzICYmIG1hdGNoUmVzdWx0LmRpc3RhbmNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgZGlzdGFuY2VzLnNldChpZCwgbWF0Y2hSZXN1bHQuZGlzdGFuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHRzLnNldChpZCwgZG9jKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPdmVycmlkZSB0byBlbnN1cmUgYWxsIGRvY3MgYXJlIG1hdGNoZWQgaWYgaWdub3Jpbmcgc2tpcCAmIGxpbWl0XG4gICAgICAgIGlmICghYXBwbHlTa2lwTGltaXQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZhc3QgcGF0aCBmb3IgbGltaXRlZCB1bnNvcnRlZCBxdWVyaWVzLlxuICAgICAgICAvLyBYWFggJ2xlbmd0aCcgY2hlY2sgaGVyZSBzZWVtcyB3cm9uZyBmb3Igb3JkZXJlZFxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICF0aGlzLmxpbWl0IHx8IHRoaXMuc2tpcCB8fCB0aGlzLnNvcnRlciB8fCByZXN1bHRzLmxlbmd0aCAhPT0gdGhpcy5saW1pdFxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAoIW9wdGlvbnMub3JkZXJlZCkge1xuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc29ydGVyKSB7XG4gICAgICByZXN1bHRzLnNvcnQodGhpcy5zb3J0ZXIuZ2V0Q29tcGFyYXRvcih7IGRpc3RhbmNlcyB9KSk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBmdWxsIHNldCBvZiByZXN1bHRzIGlmIHRoZXJlIGlzIG5vIHNraXAgb3IgbGltaXQgb3IgaWYgd2UncmVcbiAgICAvLyBpZ25vcmluZyB0aGVtXG4gICAgaWYgKCFhcHBseVNraXBMaW1pdCB8fCAoIXRoaXMubGltaXQgJiYgIXRoaXMuc2tpcCkpIHtcbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzLnNsaWNlKFxuICAgICAgdGhpcy5za2lwLFxuICAgICAgdGhpcy5saW1pdCA/IHRoaXMubGltaXQgKyB0aGlzLnNraXAgOiByZXN1bHRzLmxlbmd0aFxuICAgICk7XG4gIH1cblxuICBfcHVibGlzaEN1cnNvcihzdWJzY3JpcHRpb24pIHtcbiAgICAvLyBYWFggbWluaW1vbmdvIHNob3VsZCBub3QgZGVwZW5kIG9uIG1vbmdvLWxpdmVkYXRhIVxuICAgIGlmICghUGFja2FnZS5tb25nbykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIkNhbid0IHB1Ymxpc2ggZnJvbSBNaW5pbW9uZ28gd2l0aG91dCB0aGUgYG1vbmdvYCBwYWNrYWdlLlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jb2xsZWN0aW9uLm5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJDYW4ndCBwdWJsaXNoIGEgY3Vyc29yIGZyb20gYSBjb2xsZWN0aW9uIHdpdGhvdXQgYSBuYW1lLlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBQYWNrYWdlLm1vbmdvLk1vbmdvLkNvbGxlY3Rpb24uX3B1Ymxpc2hDdXJzb3IoXG4gICAgICB0aGlzLFxuICAgICAgc3Vic2NyaXB0aW9uLFxuICAgICAgdGhpcy5jb2xsZWN0aW9uLm5hbWVcbiAgICApO1xuICB9XG59XG5cbi8vIEltcGxlbWVudHMgYXN5bmMgdmVyc2lvbiBvZiBjdXJzb3IgbWV0aG9kcyB0byBrZWVwIGNvbGxlY3Rpb25zIGlzb21vcnBoaWNcbkFTWU5DX0NVUlNPUl9NRVRIT0RTLmZvckVhY2gobWV0aG9kID0+IHtcbiAgY29uc3QgYXN5bmNOYW1lID0gZ2V0QXN5bmNNZXRob2ROYW1lKG1ldGhvZCk7XG4gIEN1cnNvci5wcm90b3R5cGVbYXN5bmNOYW1lXSA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzW21ldGhvZF0uYXBwbHkodGhpcywgYXJncykpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgIH1cbiAgfTtcbn0pO1xuIiwiaW1wb3J0IEN1cnNvciBmcm9tICcuL2N1cnNvci5qcyc7XG5pbXBvcnQgT2JzZXJ2ZUhhbmRsZSBmcm9tICcuL29ic2VydmVfaGFuZGxlLmpzJztcbmltcG9ydCB7XG4gIGhhc093bixcbiAgaXNJbmRleGFibGUsXG4gIGlzTnVtZXJpY0tleSxcbiAgaXNPcGVyYXRvck9iamVjdCxcbiAgcG9wdWxhdGVEb2N1bWVudFdpdGhRdWVyeUZpZWxkcyxcbiAgcHJvamVjdGlvbkRldGFpbHMsXG59IGZyb20gJy4vY29tbW9uLmpzJztcblxuaW1wb3J0IHsgZ2V0QXN5bmNNZXRob2ROYW1lIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuXG4vLyBYWFggdHlwZSBjaGVja2luZyBvbiBzZWxlY3RvcnMgKGdyYWNlZnVsIGVycm9yIGlmIG1hbGZvcm1lZClcblxuLy8gTG9jYWxDb2xsZWN0aW9uOiBhIHNldCBvZiBkb2N1bWVudHMgdGhhdCBzdXBwb3J0cyBxdWVyaWVzIGFuZCBtb2RpZmllcnMuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMb2NhbENvbGxlY3Rpb24ge1xuICBjb25zdHJ1Y3RvcihuYW1lKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAvLyBfaWQgLT4gZG9jdW1lbnQgKGFsc28gY29udGFpbmluZyBpZClcbiAgICB0aGlzLl9kb2NzID0gbmV3IExvY2FsQ29sbGVjdGlvbi5fSWRNYXA7XG5cbiAgICB0aGlzLl9vYnNlcnZlUXVldWUgPSBNZXRlb3IuaXNDbGllbnRcbiAgICAgID8gbmV3IE1ldGVvci5fU3luY2hyb25vdXNRdWV1ZSgpXG4gICAgICA6IG5ldyBNZXRlb3IuX0FzeW5jaHJvbm91c1F1ZXVlKCk7XG5cbiAgICB0aGlzLm5leHRfcWlkID0gMTsgLy8gbGl2ZSBxdWVyeSBpZCBnZW5lcmF0b3JcblxuICAgIC8vIHFpZCAtPiBsaXZlIHF1ZXJ5IG9iamVjdC4ga2V5czpcbiAgICAvLyAgb3JkZXJlZDogYm9vbC4gb3JkZXJlZCBxdWVyaWVzIGhhdmUgYWRkZWRCZWZvcmUvbW92ZWRCZWZvcmUgY2FsbGJhY2tzLlxuICAgIC8vICByZXN1bHRzOiBhcnJheSAob3JkZXJlZCkgb3Igb2JqZWN0ICh1bm9yZGVyZWQpIG9mIGN1cnJlbnQgcmVzdWx0c1xuICAgIC8vICAgIChhbGlhc2VkIHdpdGggdGhpcy5fZG9jcyEpXG4gICAgLy8gIHJlc3VsdHNTbmFwc2hvdDogc25hcHNob3Qgb2YgcmVzdWx0cy4gbnVsbCBpZiBub3QgcGF1c2VkLlxuICAgIC8vICBjdXJzb3I6IEN1cnNvciBvYmplY3QgZm9yIHRoZSBxdWVyeS5cbiAgICAvLyAgc2VsZWN0b3IsIHNvcnRlciwgKGNhbGxiYWNrcyk6IGZ1bmN0aW9uc1xuICAgIHRoaXMucXVlcmllcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICAvLyBudWxsIGlmIG5vdCBzYXZpbmcgb3JpZ2luYWxzOyBhbiBJZE1hcCBmcm9tIGlkIHRvIG9yaWdpbmFsIGRvY3VtZW50IHZhbHVlXG4gICAgLy8gaWYgc2F2aW5nIG9yaWdpbmFscy4gU2VlIGNvbW1lbnRzIGJlZm9yZSBzYXZlT3JpZ2luYWxzKCkuXG4gICAgdGhpcy5fc2F2ZWRPcmlnaW5hbHMgPSBudWxsO1xuXG4gICAgLy8gVHJ1ZSB3aGVuIG9ic2VydmVycyBhcmUgcGF1c2VkIGFuZCB3ZSBzaG91bGQgbm90IHNlbmQgY2FsbGJhY2tzLlxuICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG4gIH1cblxuICBjb3VudERvY3VtZW50cyhzZWxlY3Rvciwgb3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLmZpbmQoc2VsZWN0b3IgPz8ge30sIG9wdGlvbnMpLmNvdW50QXN5bmMoKTtcbiAgfVxuXG4gIGVzdGltYXRlZERvY3VtZW50Q291bnQob3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLmZpbmQoe30sIG9wdGlvbnMpLmNvdW50QXN5bmMoKTtcbiAgfVxuXG4gIC8vIG9wdGlvbnMgbWF5IGluY2x1ZGUgc29ydCwgc2tpcCwgbGltaXQsIHJlYWN0aXZlXG4gIC8vIHNvcnQgbWF5IGJlIGFueSBvZiB0aGVzZSBmb3JtczpcbiAgLy8gICAgIHthOiAxLCBiOiAtMX1cbiAgLy8gICAgIFtbXCJhXCIsIFwiYXNjXCJdLCBbXCJiXCIsIFwiZGVzY1wiXV1cbiAgLy8gICAgIFtcImFcIiwgW1wiYlwiLCBcImRlc2NcIl1dXG4gIC8vICAgKGluIHRoZSBmaXJzdCBmb3JtIHlvdSdyZSBiZWhvbGRlbiB0byBrZXkgZW51bWVyYXRpb24gb3JkZXIgaW5cbiAgLy8gICB5b3VyIGphdmFzY3JpcHQgVk0pXG4gIC8vXG4gIC8vIHJlYWN0aXZlOiBpZiBnaXZlbiwgYW5kIGZhbHNlLCBkb24ndCByZWdpc3RlciB3aXRoIFRyYWNrZXIgKGRlZmF1bHRcbiAgLy8gaXMgdHJ1ZSlcbiAgLy9cbiAgLy8gWFhYIHBvc3NpYmx5IHNob3VsZCBzdXBwb3J0IHJldHJpZXZpbmcgYSBzdWJzZXQgb2YgZmllbGRzPyBhbmRcbiAgLy8gaGF2ZSBpdCBiZSBhIGhpbnQgKGlnbm9yZWQgb24gdGhlIGNsaWVudCwgd2hlbiBub3QgY29weWluZyB0aGVcbiAgLy8gZG9jPylcbiAgLy9cbiAgLy8gWFhYIHNvcnQgZG9lcyBub3QgeWV0IHN1cHBvcnQgc3Via2V5cyAoJ2EuYicpIC4uIGZpeCB0aGF0IVxuICAvLyBYWFggYWRkIG9uZSBtb3JlIHNvcnQgZm9ybTogXCJrZXlcIlxuICAvLyBYWFggdGVzdHNcbiAgZmluZChzZWxlY3Rvciwgb3B0aW9ucykge1xuICAgIC8vIGRlZmF1bHQgc3ludGF4IGZvciBldmVyeXRoaW5nIGlzIHRvIG9taXQgdGhlIHNlbGVjdG9yIGFyZ3VtZW50LlxuICAgIC8vIGJ1dCBpZiBzZWxlY3RvciBpcyBleHBsaWNpdGx5IHBhc3NlZCBpbiBhcyBmYWxzZSBvciB1bmRlZmluZWQsIHdlXG4gICAgLy8gd2FudCBhIHNlbGVjdG9yIHRoYXQgbWF0Y2hlcyBub3RoaW5nLlxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBzZWxlY3RvciA9IHt9O1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTG9jYWxDb2xsZWN0aW9uLkN1cnNvcih0aGlzLCBzZWxlY3Rvciwgb3B0aW9ucyk7XG4gIH1cblxuICBmaW5kT25lKHNlbGVjdG9yLCBvcHRpb25zID0ge30pIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgc2VsZWN0b3IgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBOT1RFOiBieSBzZXR0aW5nIGxpbWl0IDEgaGVyZSwgd2UgZW5kIHVwIHVzaW5nIHZlcnkgaW5lZmZpY2llbnRcbiAgICAvLyBjb2RlIHRoYXQgcmVjb21wdXRlcyB0aGUgd2hvbGUgcXVlcnkgb24gZWFjaCB1cGRhdGUuIFRoZSB1cHNpZGUgaXNcbiAgICAvLyB0aGF0IHdoZW4geW91IHJlYWN0aXZlbHkgZGVwZW5kIG9uIGEgZmluZE9uZSB5b3Ugb25seSBnZXRcbiAgICAvLyBpbnZhbGlkYXRlZCB3aGVuIHRoZSBmb3VuZCBvYmplY3QgY2hhbmdlcywgbm90IGFueSBvYmplY3QgaW4gdGhlXG4gICAgLy8gY29sbGVjdGlvbi4gTW9zdCBmaW5kT25lIHdpbGwgYmUgYnkgaWQsIHdoaWNoIGhhcyBhIGZhc3QgcGF0aCwgc29cbiAgICAvLyB0aGlzIG1pZ2h0IG5vdCBiZSBhIGJpZyBkZWFsLiBJbiBtb3N0IGNhc2VzLCBpbnZhbGlkYXRpb24gY2F1c2VzXG4gICAgLy8gdGhlIGNhbGxlZCB0byByZS1xdWVyeSBhbnl3YXksIHNvIHRoaXMgc2hvdWxkIGJlIGEgbmV0IHBlcmZvcm1hbmNlXG4gICAgLy8gaW1wcm92ZW1lbnQuXG4gICAgb3B0aW9ucy5saW1pdCA9IDE7XG5cbiAgICByZXR1cm4gdGhpcy5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaCgpWzBdO1xuICB9XG4gIGFzeW5jIGZpbmRPbmVBc3luYyhzZWxlY3Rvciwgb3B0aW9ucyA9IHt9KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHNlbGVjdG9yID0ge307XG4gICAgfVxuICAgIG9wdGlvbnMubGltaXQgPSAxO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5maW5kKHNlbGVjdG9yLCBvcHRpb25zKS5mZXRjaEFzeW5jKCkpWzBdO1xuICB9XG4gIHByZXBhcmVJbnNlcnQoZG9jKSB7XG4gICAgYXNzZXJ0SGFzVmFsaWRGaWVsZE5hbWVzKGRvYyk7XG5cbiAgICAvLyBpZiB5b3UgcmVhbGx5IHdhbnQgdG8gdXNlIE9iamVjdElEcywgc2V0IHRoaXMgZ2xvYmFsLlxuICAgIC8vIE1vbmdvLkNvbGxlY3Rpb24gc3BlY2lmaWVzIGl0cyBvd24gaWRzIGFuZCBkb2VzIG5vdCB1c2UgdGhpcyBjb2RlLlxuICAgIGlmICghaGFzT3duLmNhbGwoZG9jLCAnX2lkJykpIHtcbiAgICAgIGRvYy5faWQgPSBMb2NhbENvbGxlY3Rpb24uX3VzZU9JRCA/IG5ldyBNb25nb0lELk9iamVjdElEKCkgOiBSYW5kb20uaWQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBpZCA9IGRvYy5faWQ7XG5cbiAgICBpZiAodGhpcy5fZG9jcy5oYXMoaWQpKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihgRHVwbGljYXRlIF9pZCAnJHtpZH0nYCk7XG4gICAgfVxuXG4gICAgdGhpcy5fc2F2ZU9yaWdpbmFsKGlkLCB1bmRlZmluZWQpO1xuICAgIHRoaXMuX2RvY3Muc2V0KGlkLCBkb2MpO1xuXG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgLy8gWFhYIHBvc3NpYmx5IGVuZm9yY2UgdGhhdCAndW5kZWZpbmVkJyBkb2VzIG5vdCBhcHBlYXIgKHdlIGFzc3VtZVxuICAvLyB0aGlzIGluIG91ciBoYW5kbGluZyBvZiBudWxsIGFuZCAkZXhpc3RzKVxuICBpbnNlcnQoZG9jLCBjYWxsYmFjaykge1xuICAgIGRvYyA9IEVKU09OLmNsb25lKGRvYyk7XG4gICAgY29uc3QgaWQgPSB0aGlzLnByZXBhcmVJbnNlcnQoZG9jKTtcbiAgICBjb25zdCBxdWVyaWVzVG9SZWNvbXB1dGUgPSBbXTtcblxuICAgIC8vIHRyaWdnZXIgbGl2ZSBxdWVyaWVzIHRoYXQgbWF0Y2hcbiAgICBmb3IgKGNvbnN0IHFpZCBvZiBPYmplY3Qua2V5cyh0aGlzLnF1ZXJpZXMpKSB7XG4gICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuXG4gICAgICBpZiAocXVlcnkuZGlydHkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gcXVlcnkubWF0Y2hlci5kb2N1bWVudE1hdGNoZXMoZG9jKTtcblxuICAgICAgaWYgKG1hdGNoUmVzdWx0LnJlc3VsdCkge1xuICAgICAgICBpZiAocXVlcnkuZGlzdGFuY2VzICYmIG1hdGNoUmVzdWx0LmRpc3RhbmNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBxdWVyeS5kaXN0YW5jZXMuc2V0KGlkLCBtYXRjaFJlc3VsdC5kaXN0YW5jZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocXVlcnkuY3Vyc29yLnNraXAgfHwgcXVlcnkuY3Vyc29yLmxpbWl0KSB7XG4gICAgICAgICAgcXVlcmllc1RvUmVjb21wdXRlLnB1c2gocWlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBMb2NhbENvbGxlY3Rpb24uX2luc2VydEluUmVzdWx0c1N5bmMocXVlcnksIGRvYyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBxdWVyaWVzVG9SZWNvbXB1dGUuZm9yRWFjaChxaWQgPT4ge1xuICAgICAgaWYgKHRoaXMucXVlcmllc1txaWRdKSB7XG4gICAgICAgIHRoaXMuX3JlY29tcHV0ZVJlc3VsdHModGhpcy5xdWVyaWVzW3FpZF0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5fb2JzZXJ2ZVF1ZXVlLmRyYWluKCk7XG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBNZXRlb3IuZGVmZXIoKCkgPT4ge1xuICAgICAgICBjYWxsYmFjayhudWxsLCBpZCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gaWQ7XG4gIH1cbiAgYXN5bmMgaW5zZXJ0QXN5bmMoZG9jLCBjYWxsYmFjaykge1xuICAgIGRvYyA9IEVKU09OLmNsb25lKGRvYyk7XG4gICAgY29uc3QgaWQgPSB0aGlzLnByZXBhcmVJbnNlcnQoZG9jKTtcbiAgICBjb25zdCBxdWVyaWVzVG9SZWNvbXB1dGUgPSBbXTtcblxuICAgIC8vIHRyaWdnZXIgbGl2ZSBxdWVyaWVzIHRoYXQgbWF0Y2hcbiAgICBmb3IgKGNvbnN0IHFpZCBpbiB0aGlzLnF1ZXJpZXMpIHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW3FpZF07XG5cbiAgICAgIGlmIChxdWVyeS5kaXJ0eSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBxdWVyeS5tYXRjaGVyLmRvY3VtZW50TWF0Y2hlcyhkb2MpO1xuXG4gICAgICBpZiAobWF0Y2hSZXN1bHQucmVzdWx0KSB7XG4gICAgICAgIGlmIChxdWVyeS5kaXN0YW5jZXMgJiYgbWF0Y2hSZXN1bHQuZGlzdGFuY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHF1ZXJ5LmRpc3RhbmNlcy5zZXQoaWQsIG1hdGNoUmVzdWx0LmRpc3RhbmNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChxdWVyeS5jdXJzb3Iuc2tpcCB8fCBxdWVyeS5jdXJzb3IubGltaXQpIHtcbiAgICAgICAgICBxdWVyaWVzVG9SZWNvbXB1dGUucHVzaChxaWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGF3YWl0IExvY2FsQ29sbGVjdGlvbi5faW5zZXJ0SW5SZXN1bHRzQXN5bmMocXVlcnksIGRvYyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBxdWVyaWVzVG9SZWNvbXB1dGUuZm9yRWFjaChxaWQgPT4ge1xuICAgICAgaWYgKHRoaXMucXVlcmllc1txaWRdKSB7XG4gICAgICAgIHRoaXMuX3JlY29tcHV0ZVJlc3VsdHModGhpcy5xdWVyaWVzW3FpZF0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXdhaXQgdGhpcy5fb2JzZXJ2ZVF1ZXVlLmRyYWluKCk7XG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBNZXRlb3IuZGVmZXIoKCkgPT4ge1xuICAgICAgICBjYWxsYmFjayhudWxsLCBpZCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICAvLyBQYXVzZSB0aGUgb2JzZXJ2ZXJzLiBObyBjYWxsYmFja3MgZnJvbSBvYnNlcnZlcnMgd2lsbCBmaXJlIHVudGlsXG4gIC8vICdyZXN1bWVPYnNlcnZlcnMnIGlzIGNhbGxlZC5cbiAgcGF1c2VPYnNlcnZlcnMoKSB7XG4gICAgLy8gTm8tb3AgaWYgYWxyZWFkeSBwYXVzZWQuXG4gICAgaWYgKHRoaXMucGF1c2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSAncGF1c2VkJyBmbGFnIHN1Y2ggdGhhdCBuZXcgb2JzZXJ2ZXIgbWVzc2FnZXMgZG9uJ3QgZmlyZS5cbiAgICB0aGlzLnBhdXNlZCA9IHRydWU7XG5cbiAgICAvLyBUYWtlIGEgc25hcHNob3Qgb2YgdGhlIHF1ZXJ5IHJlc3VsdHMgZm9yIGVhY2ggcXVlcnkuXG4gICAgT2JqZWN0LmtleXModGhpcy5xdWVyaWVzKS5mb3JFYWNoKHFpZCA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuICAgICAgcXVlcnkucmVzdWx0c1NuYXBzaG90ID0gRUpTT04uY2xvbmUocXVlcnkucmVzdWx0cyk7XG4gICAgfSk7XG4gIH1cblxuICBjbGVhclJlc3VsdFF1ZXJpZXMoY2FsbGJhY2spIHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9kb2NzLnNpemUoKTtcblxuICAgIHRoaXMuX2RvY3MuY2xlYXIoKTtcblxuICAgIE9iamVjdC5rZXlzKHRoaXMucXVlcmllcykuZm9yRWFjaChxaWQgPT4ge1xuICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbcWlkXTtcblxuICAgICAgaWYgKHF1ZXJ5Lm9yZGVyZWQpIHtcbiAgICAgICAgcXVlcnkucmVzdWx0cyA9IFtdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcXVlcnkucmVzdWx0cy5jbGVhcigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBNZXRlb3IuZGVmZXIoKCkgPT4ge1xuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG5cbiAgcHJlcGFyZVJlbW92ZShzZWxlY3Rvcikge1xuICAgIGNvbnN0IG1hdGNoZXIgPSBuZXcgTWluaW1vbmdvLk1hdGNoZXIoc2VsZWN0b3IpO1xuICAgIGNvbnN0IHJlbW92ZSA9IFtdO1xuXG4gICAgdGhpcy5fZWFjaFBvc3NpYmx5TWF0Y2hpbmdEb2NTeW5jKHNlbGVjdG9yLCAoZG9jLCBpZCkgPT4ge1xuICAgICAgaWYgKG1hdGNoZXIuZG9jdW1lbnRNYXRjaGVzKGRvYykucmVzdWx0KSB7XG4gICAgICAgIHJlbW92ZS5wdXNoKGlkKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHF1ZXJpZXNUb1JlY29tcHV0ZSA9IFtdO1xuICAgIGNvbnN0IHF1ZXJ5UmVtb3ZlID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbW92ZS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcmVtb3ZlSWQgPSByZW1vdmVbaV07XG4gICAgICBjb25zdCByZW1vdmVEb2MgPSB0aGlzLl9kb2NzLmdldChyZW1vdmVJZCk7XG5cbiAgICAgIE9iamVjdC5rZXlzKHRoaXMucXVlcmllcykuZm9yRWFjaChxaWQgPT4ge1xuICAgICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuXG4gICAgICAgIGlmIChxdWVyeS5kaXJ0eSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChxdWVyeS5tYXRjaGVyLmRvY3VtZW50TWF0Y2hlcyhyZW1vdmVEb2MpLnJlc3VsdCkge1xuICAgICAgICAgIGlmIChxdWVyeS5jdXJzb3Iuc2tpcCB8fCBxdWVyeS5jdXJzb3IubGltaXQpIHtcbiAgICAgICAgICAgIHF1ZXJpZXNUb1JlY29tcHV0ZS5wdXNoKHFpZCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHF1ZXJ5UmVtb3ZlLnB1c2goe3FpZCwgZG9jOiByZW1vdmVEb2N9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9zYXZlT3JpZ2luYWwocmVtb3ZlSWQsIHJlbW92ZURvYyk7XG4gICAgICB0aGlzLl9kb2NzLnJlbW92ZShyZW1vdmVJZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcXVlcmllc1RvUmVjb21wdXRlLCBxdWVyeVJlbW92ZSwgcmVtb3ZlIH07XG4gIH1cblxuICByZW1vdmUoc2VsZWN0b3IsIGNhbGxiYWNrKSB7XG4gICAgLy8gRWFzeSBzcGVjaWFsIGNhc2U6IGlmIHdlJ3JlIG5vdCBjYWxsaW5nIG9ic2VydmVDaGFuZ2VzIGNhbGxiYWNrcyBhbmRcbiAgICAvLyB3ZSdyZSBub3Qgc2F2aW5nIG9yaWdpbmFscyBhbmQgd2UgZ290IGFza2VkIHRvIHJlbW92ZSBldmVyeXRoaW5nLCB0aGVuXG4gICAgLy8ganVzdCBlbXB0eSBldmVyeXRoaW5nIGRpcmVjdGx5LlxuICAgIGlmICh0aGlzLnBhdXNlZCAmJiAhdGhpcy5fc2F2ZWRPcmlnaW5hbHMgJiYgRUpTT04uZXF1YWxzKHNlbGVjdG9yLCB7fSkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNsZWFyUmVzdWx0UXVlcmllcyhjYWxsYmFjayk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBxdWVyaWVzVG9SZWNvbXB1dGUsIHF1ZXJ5UmVtb3ZlLCByZW1vdmUgfSA9IHRoaXMucHJlcGFyZVJlbW92ZShzZWxlY3Rvcik7XG5cbiAgICAvLyBydW4gbGl2ZSBxdWVyeSBjYWxsYmFja3MgX2FmdGVyXyB3ZSd2ZSByZW1vdmVkIHRoZSBkb2N1bWVudHMuXG4gICAgcXVlcnlSZW1vdmUuZm9yRWFjaChyZW1vdmUgPT4ge1xuICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbcmVtb3ZlLnFpZF07XG5cbiAgICAgIGlmIChxdWVyeSkge1xuICAgICAgICBxdWVyeS5kaXN0YW5jZXMgJiYgcXVlcnkuZGlzdGFuY2VzLnJlbW92ZShyZW1vdmUuZG9jLl9pZCk7XG4gICAgICAgIExvY2FsQ29sbGVjdGlvbi5fcmVtb3ZlRnJvbVJlc3VsdHNTeW5jKHF1ZXJ5LCByZW1vdmUuZG9jKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHF1ZXJpZXNUb1JlY29tcHV0ZS5mb3JFYWNoKHFpZCA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuXG4gICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgdGhpcy5fcmVjb21wdXRlUmVzdWx0cyhxdWVyeSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9vYnNlcnZlUXVldWUuZHJhaW4oKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IHJlbW92ZS5sZW5ndGg7XG5cbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIE1ldGVvci5kZWZlcigoKSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgcmVtb3ZlQXN5bmMoc2VsZWN0b3IsIGNhbGxiYWNrKSB7XG4gICAgLy8gRWFzeSBzcGVjaWFsIGNhc2U6IGlmIHdlJ3JlIG5vdCBjYWxsaW5nIG9ic2VydmVDaGFuZ2VzIGNhbGxiYWNrcyBhbmRcbiAgICAvLyB3ZSdyZSBub3Qgc2F2aW5nIG9yaWdpbmFscyBhbmQgd2UgZ290IGFza2VkIHRvIHJlbW92ZSBldmVyeXRoaW5nLCB0aGVuXG4gICAgLy8ganVzdCBlbXB0eSBldmVyeXRoaW5nIGRpcmVjdGx5LlxuICAgIGlmICh0aGlzLnBhdXNlZCAmJiAhdGhpcy5fc2F2ZWRPcmlnaW5hbHMgJiYgRUpTT04uZXF1YWxzKHNlbGVjdG9yLCB7fSkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNsZWFyUmVzdWx0UXVlcmllcyhjYWxsYmFjayk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBxdWVyaWVzVG9SZWNvbXB1dGUsIHF1ZXJ5UmVtb3ZlLCByZW1vdmUgfSA9IHRoaXMucHJlcGFyZVJlbW92ZShzZWxlY3Rvcik7XG5cbiAgICAvLyBydW4gbGl2ZSBxdWVyeSBjYWxsYmFja3MgX2FmdGVyXyB3ZSd2ZSByZW1vdmVkIHRoZSBkb2N1bWVudHMuXG4gICAgZm9yIChjb25zdCByZW1vdmUgb2YgcXVlcnlSZW1vdmUpIHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW3JlbW92ZS5xaWRdO1xuXG4gICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgcXVlcnkuZGlzdGFuY2VzICYmIHF1ZXJ5LmRpc3RhbmNlcy5yZW1vdmUocmVtb3ZlLmRvYy5faWQpO1xuICAgICAgICBhd2FpdCBMb2NhbENvbGxlY3Rpb24uX3JlbW92ZUZyb21SZXN1bHRzQXN5bmMocXVlcnksIHJlbW92ZS5kb2MpO1xuICAgICAgfVxuICAgIH1cbiAgICBxdWVyaWVzVG9SZWNvbXB1dGUuZm9yRWFjaChxaWQgPT4ge1xuICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbcWlkXTtcblxuICAgICAgaWYgKHF1ZXJ5KSB7XG4gICAgICAgIHRoaXMuX3JlY29tcHV0ZVJlc3VsdHMocXVlcnkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXdhaXQgdGhpcy5fb2JzZXJ2ZVF1ZXVlLmRyYWluKCk7XG5cbiAgICBjb25zdCByZXN1bHQgPSByZW1vdmUubGVuZ3RoO1xuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBNZXRlb3IuZGVmZXIoKCkgPT4ge1xuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIFJlc3VtZSB0aGUgb2JzZXJ2ZXJzLiBPYnNlcnZlcnMgaW1tZWRpYXRlbHkgcmVjZWl2ZSBjaGFuZ2VcbiAgLy8gbm90aWZpY2F0aW9ucyB0byBicmluZyB0aGVtIHRvIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZVxuICAvLyBkYXRhYmFzZS4gTm90ZSB0aGF0IHRoaXMgaXMgbm90IGp1c3QgcmVwbGF5aW5nIGFsbCB0aGUgY2hhbmdlcyB0aGF0XG4gIC8vIGhhcHBlbmVkIGR1cmluZyB0aGUgcGF1c2UsIGl0IGlzIGEgc21hcnRlciAnY29hbGVzY2VkJyBkaWZmLlxuICBfcmVzdW1lT2JzZXJ2ZXJzKCkge1xuICAgIC8vIE5vLW9wIGlmIG5vdCBwYXVzZWQuXG4gICAgaWYgKCF0aGlzLnBhdXNlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFVuc2V0IHRoZSAncGF1c2VkJyBmbGFnLiBNYWtlIHN1cmUgdG8gZG8gdGhpcyBmaXJzdCwgb3RoZXJ3aXNlXG4gICAgLy8gb2JzZXJ2ZXIgbWV0aG9kcyB3b24ndCBhY3R1YWxseSBmaXJlIHdoZW4gd2UgdHJpZ2dlciB0aGVtLlxuICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG5cbiAgICBPYmplY3Qua2V5cyh0aGlzLnF1ZXJpZXMpLmZvckVhY2gocWlkID0+IHtcbiAgICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW3FpZF07XG5cbiAgICAgIGlmIChxdWVyeS5kaXJ0eSkge1xuICAgICAgICBxdWVyeS5kaXJ0eSA9IGZhbHNlO1xuXG4gICAgICAgIC8vIHJlLWNvbXB1dGUgcmVzdWx0cyB3aWxsIHBlcmZvcm0gYExvY2FsQ29sbGVjdGlvbi5fZGlmZlF1ZXJ5Q2hhbmdlc2BcbiAgICAgICAgLy8gYXV0b21hdGljYWxseS5cbiAgICAgICAgdGhpcy5fcmVjb21wdXRlUmVzdWx0cyhxdWVyeSwgcXVlcnkucmVzdWx0c1NuYXBzaG90KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERpZmYgdGhlIGN1cnJlbnQgcmVzdWx0cyBhZ2FpbnN0IHRoZSBzbmFwc2hvdCBhbmQgc2VuZCB0byBvYnNlcnZlcnMuXG4gICAgICAgIC8vIHBhc3MgdGhlIHF1ZXJ5IG9iamVjdCBmb3IgaXRzIG9ic2VydmVyIGNhbGxiYWNrcy5cbiAgICAgICAgTG9jYWxDb2xsZWN0aW9uLl9kaWZmUXVlcnlDaGFuZ2VzKFxuICAgICAgICAgIHF1ZXJ5Lm9yZGVyZWQsXG4gICAgICAgICAgcXVlcnkucmVzdWx0c1NuYXBzaG90LFxuICAgICAgICAgIHF1ZXJ5LnJlc3VsdHMsXG4gICAgICAgICAgcXVlcnksXG4gICAgICAgICAge3Byb2plY3Rpb25GbjogcXVlcnkucHJvamVjdGlvbkZufVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBxdWVyeS5yZXN1bHRzU25hcHNob3QgPSBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgcmVzdW1lT2JzZXJ2ZXJzU2VydmVyKCkge1xuICAgIHRoaXMuX3Jlc3VtZU9ic2VydmVycygpO1xuICAgIGF3YWl0IHRoaXMuX29ic2VydmVRdWV1ZS5kcmFpbigpO1xuICB9XG4gIHJlc3VtZU9ic2VydmVyc0NsaWVudCgpIHtcbiAgICB0aGlzLl9yZXN1bWVPYnNlcnZlcnMoKTtcbiAgICB0aGlzLl9vYnNlcnZlUXVldWUuZHJhaW4oKTtcbiAgfVxuXG4gIHJldHJpZXZlT3JpZ2luYWxzKCkge1xuICAgIGlmICghdGhpcy5fc2F2ZWRPcmlnaW5hbHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FsbGVkIHJldHJpZXZlT3JpZ2luYWxzIHdpdGhvdXQgc2F2ZU9yaWdpbmFscycpO1xuICAgIH1cblxuICAgIGNvbnN0IG9yaWdpbmFscyA9IHRoaXMuX3NhdmVkT3JpZ2luYWxzO1xuXG4gICAgdGhpcy5fc2F2ZWRPcmlnaW5hbHMgPSBudWxsO1xuXG4gICAgcmV0dXJuIG9yaWdpbmFscztcbiAgfVxuXG4gIC8vIFRvIHRyYWNrIHdoYXQgZG9jdW1lbnRzIGFyZSBhZmZlY3RlZCBieSBhIHBpZWNlIG9mIGNvZGUsIGNhbGxcbiAgLy8gc2F2ZU9yaWdpbmFscygpIGJlZm9yZSBpdCBhbmQgcmV0cmlldmVPcmlnaW5hbHMoKSBhZnRlciBpdC5cbiAgLy8gcmV0cmlldmVPcmlnaW5hbHMgcmV0dXJucyBhbiBvYmplY3Qgd2hvc2Uga2V5cyBhcmUgdGhlIGlkcyBvZiB0aGUgZG9jdW1lbnRzXG4gIC8vIHRoYXQgd2VyZSBhZmZlY3RlZCBzaW5jZSB0aGUgY2FsbCB0byBzYXZlT3JpZ2luYWxzKCksIGFuZCB0aGUgdmFsdWVzIGFyZVxuICAvLyBlcXVhbCB0byB0aGUgZG9jdW1lbnQncyBjb250ZW50cyBhdCB0aGUgdGltZSBvZiBzYXZlT3JpZ2luYWxzLiAoSW4gdGhlIGNhc2VcbiAgLy8gb2YgYW4gaW5zZXJ0ZWQgZG9jdW1lbnQsIHVuZGVmaW5lZCBpcyB0aGUgdmFsdWUuKSBZb3UgbXVzdCBhbHRlcm5hdGVcbiAgLy8gYmV0d2VlbiBjYWxscyB0byBzYXZlT3JpZ2luYWxzKCkgYW5kIHJldHJpZXZlT3JpZ2luYWxzKCkuXG4gIHNhdmVPcmlnaW5hbHMoKSB7XG4gICAgaWYgKHRoaXMuX3NhdmVkT3JpZ2luYWxzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbGxlZCBzYXZlT3JpZ2luYWxzIHR3aWNlIHdpdGhvdXQgcmV0cmlldmVPcmlnaW5hbHMnKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zYXZlZE9yaWdpbmFscyA9IG5ldyBMb2NhbENvbGxlY3Rpb24uX0lkTWFwO1xuICB9XG5cbiAgcHJlcGFyZVVwZGF0ZShzZWxlY3Rvcikge1xuICAgIC8vIFNhdmUgdGhlIG9yaWdpbmFsIHJlc3VsdHMgb2YgYW55IHF1ZXJ5IHRoYXQgd2UgbWlnaHQgbmVlZCB0b1xuICAgIC8vIF9yZWNvbXB1dGVSZXN1bHRzIG9uLCBiZWNhdXNlIF9tb2RpZnlBbmROb3RpZnkgd2lsbCBtdXRhdGUgdGhlIG9iamVjdHMgaW5cbiAgICAvLyBpdC4gKFdlIGRvbid0IG5lZWQgdG8gc2F2ZSB0aGUgb3JpZ2luYWwgcmVzdWx0cyBvZiBwYXVzZWQgcXVlcmllcyBiZWNhdXNlXG4gICAgLy8gdGhleSBhbHJlYWR5IGhhdmUgYSByZXN1bHRzU25hcHNob3QgYW5kIHdlIHdvbid0IGJlIGRpZmZpbmcgaW5cbiAgICAvLyBfcmVjb21wdXRlUmVzdWx0cy4pXG4gICAgY29uc3QgcWlkVG9PcmlnaW5hbFJlc3VsdHMgPSB7fTtcblxuICAgIC8vIFdlIHNob3VsZCBvbmx5IGNsb25lIGVhY2ggZG9jdW1lbnQgb25jZSwgZXZlbiBpZiBpdCBhcHBlYXJzIGluIG11bHRpcGxlXG4gICAgLy8gcXVlcmllc1xuICAgIGNvbnN0IGRvY01hcCA9IG5ldyBMb2NhbENvbGxlY3Rpb24uX0lkTWFwO1xuICAgIGNvbnN0IGlkc01hdGNoZWQgPSBMb2NhbENvbGxlY3Rpb24uX2lkc01hdGNoZWRCeVNlbGVjdG9yKHNlbGVjdG9yKTtcblxuICAgIE9iamVjdC5rZXlzKHRoaXMucXVlcmllcykuZm9yRWFjaChxaWQgPT4ge1xuICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbcWlkXTtcblxuICAgICAgaWYgKChxdWVyeS5jdXJzb3Iuc2tpcCB8fCBxdWVyeS5jdXJzb3IubGltaXQpICYmICEgdGhpcy5wYXVzZWQpIHtcbiAgICAgICAgLy8gQ2F0Y2ggdGhlIGNhc2Ugb2YgYSByZWFjdGl2ZSBgY291bnQoKWAgb24gYSBjdXJzb3Igd2l0aCBza2lwXG4gICAgICAgIC8vIG9yIGxpbWl0LCB3aGljaCByZWdpc3RlcnMgYW4gdW5vcmRlcmVkIG9ic2VydmUuIFRoaXMgaXMgYVxuICAgICAgICAvLyBwcmV0dHkgcmFyZSBjYXNlLCBzbyB3ZSBqdXN0IGNsb25lIHRoZSBlbnRpcmUgcmVzdWx0IHNldCB3aXRoXG4gICAgICAgIC8vIG5vIG9wdGltaXphdGlvbnMgZm9yIGRvY3VtZW50cyB0aGF0IGFwcGVhciBpbiB0aGVzZSByZXN1bHRcbiAgICAgICAgLy8gc2V0cyBhbmQgb3RoZXIgcXVlcmllcy5cbiAgICAgICAgaWYgKHF1ZXJ5LnJlc3VsdHMgaW5zdGFuY2VvZiBMb2NhbENvbGxlY3Rpb24uX0lkTWFwKSB7XG4gICAgICAgICAgcWlkVG9PcmlnaW5hbFJlc3VsdHNbcWlkXSA9IHF1ZXJ5LnJlc3VsdHMuY2xvbmUoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIShxdWVyeS5yZXN1bHRzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBc3NlcnRpb24gZmFpbGVkOiBxdWVyeS5yZXN1bHRzIG5vdCBhbiBhcnJheScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xvbmVzIGEgZG9jdW1lbnQgdG8gYmUgc3RvcmVkIGluIGBxaWRUb09yaWdpbmFsUmVzdWx0c2BcbiAgICAgICAgLy8gYmVjYXVzZSBpdCBtYXkgYmUgbW9kaWZpZWQgYmVmb3JlIHRoZSBuZXcgYW5kIG9sZCByZXN1bHQgc2V0c1xuICAgICAgICAvLyBhcmUgZGlmZmVkLiBCdXQgaWYgd2Uga25vdyBleGFjdGx5IHdoaWNoIGRvY3VtZW50IElEcyB3ZSdyZVxuICAgICAgICAvLyBnb2luZyB0byBtb2RpZnksIHRoZW4gd2Ugb25seSBuZWVkIHRvIGNsb25lIHRob3NlLlxuICAgICAgICBjb25zdCBtZW1vaXplZENsb25lSWZOZWVkZWQgPSBkb2MgPT4ge1xuICAgICAgICAgIGlmIChkb2NNYXAuaGFzKGRvYy5faWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZG9jTWFwLmdldChkb2MuX2lkKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBkb2NUb01lbW9pemUgPSAoXG4gICAgICAgICAgICBpZHNNYXRjaGVkICYmXG4gICAgICAgICAgICAhaWRzTWF0Y2hlZC5zb21lKGlkID0+IEVKU09OLmVxdWFscyhpZCwgZG9jLl9pZCkpXG4gICAgICAgICAgKSA/IGRvYyA6IEVKU09OLmNsb25lKGRvYyk7XG5cbiAgICAgICAgICBkb2NNYXAuc2V0KGRvYy5faWQsIGRvY1RvTWVtb2l6ZSk7XG5cbiAgICAgICAgICByZXR1cm4gZG9jVG9NZW1vaXplO1xuICAgICAgICB9O1xuXG4gICAgICAgIHFpZFRvT3JpZ2luYWxSZXN1bHRzW3FpZF0gPSBxdWVyeS5yZXN1bHRzLm1hcChtZW1vaXplZENsb25lSWZOZWVkZWQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHFpZFRvT3JpZ2luYWxSZXN1bHRzO1xuICB9XG5cbiAgZmluaXNoVXBkYXRlKHsgb3B0aW9ucywgdXBkYXRlQ291bnQsIGNhbGxiYWNrLCBpbnNlcnRlZElkIH0pIHtcblxuXG4gICAgLy8gUmV0dXJuIHRoZSBudW1iZXIgb2YgYWZmZWN0ZWQgZG9jdW1lbnRzLCBvciBpbiB0aGUgdXBzZXJ0IGNhc2UsIGFuIG9iamVjdFxuICAgIC8vIGNvbnRhaW5pbmcgdGhlIG51bWJlciBvZiBhZmZlY3RlZCBkb2NzIGFuZCB0aGUgaWQgb2YgdGhlIGRvYyB0aGF0IHdhc1xuICAgIC8vIGluc2VydGVkLCBpZiBhbnkuXG4gICAgbGV0IHJlc3VsdDtcbiAgICBpZiAob3B0aW9ucy5fcmV0dXJuT2JqZWN0KSB7XG4gICAgICByZXN1bHQgPSB7IG51bWJlckFmZmVjdGVkOiB1cGRhdGVDb3VudCB9O1xuXG4gICAgICBpZiAoaW5zZXJ0ZWRJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlc3VsdC5pbnNlcnRlZElkID0gaW5zZXJ0ZWRJZDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gdXBkYXRlQ291bnQ7XG4gICAgfVxuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBNZXRlb3IuZGVmZXIoKCkgPT4ge1xuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIFhYWCBhdG9taWNpdHk6IGlmIG11bHRpIGlzIHRydWUsIGFuZCBvbmUgbW9kaWZpY2F0aW9uIGZhaWxzLCBkb1xuICAvLyB3ZSByb2xsYmFjayB0aGUgd2hvbGUgb3BlcmF0aW9uLCBvciB3aGF0P1xuICBhc3luYyB1cGRhdGVBc3luYyhzZWxlY3RvciwgbW9kLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIGlmICghIGNhbGxiYWNrICYmIG9wdGlvbnMgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgICAgb3B0aW9ucyA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuXG4gICAgY29uc3QgbWF0Y2hlciA9IG5ldyBNaW5pbW9uZ28uTWF0Y2hlcihzZWxlY3RvciwgdHJ1ZSk7XG5cbiAgICBjb25zdCBxaWRUb09yaWdpbmFsUmVzdWx0cyA9IHRoaXMucHJlcGFyZVVwZGF0ZShzZWxlY3Rvcik7XG5cbiAgICBsZXQgcmVjb21wdXRlUWlkcyA9IHt9O1xuXG4gICAgbGV0IHVwZGF0ZUNvdW50ID0gMDtcblxuICAgIGF3YWl0IHRoaXMuX2VhY2hQb3NzaWJseU1hdGNoaW5nRG9jQXN5bmMoc2VsZWN0b3IsIGFzeW5jIChkb2MsIGlkKSA9PiB7XG4gICAgICBjb25zdCBxdWVyeVJlc3VsdCA9IG1hdGNoZXIuZG9jdW1lbnRNYXRjaGVzKGRvYyk7XG5cbiAgICAgIGlmIChxdWVyeVJlc3VsdC5yZXN1bHQpIHtcbiAgICAgICAgLy8gWFhYIFNob3VsZCB3ZSBzYXZlIHRoZSBvcmlnaW5hbCBldmVuIGlmIG1vZCBlbmRzIHVwIGJlaW5nIGEgbm8tb3A/XG4gICAgICAgIHRoaXMuX3NhdmVPcmlnaW5hbChpZCwgZG9jKTtcbiAgICAgICAgcmVjb21wdXRlUWlkcyA9IGF3YWl0IHRoaXMuX21vZGlmeUFuZE5vdGlmeUFzeW5jKFxuICAgICAgICAgIGRvYyxcbiAgICAgICAgICBtb2QsXG4gICAgICAgICAgcXVlcnlSZXN1bHQuYXJyYXlJbmRpY2VzXG4gICAgICAgICk7XG5cbiAgICAgICAgKyt1cGRhdGVDb3VudDtcblxuICAgICAgICBpZiAoIW9wdGlvbnMubXVsdGkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICBPYmplY3Qua2V5cyhyZWNvbXB1dGVRaWRzKS5mb3JFYWNoKHFpZCA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuXG4gICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgdGhpcy5fcmVjb21wdXRlUmVzdWx0cyhxdWVyeSwgcWlkVG9PcmlnaW5hbFJlc3VsdHNbcWlkXSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBhd2FpdCB0aGlzLl9vYnNlcnZlUXVldWUuZHJhaW4oKTtcblxuICAgIC8vIElmIHdlIGFyZSBkb2luZyBhbiB1cHNlcnQsIGFuZCB3ZSBkaWRuJ3QgbW9kaWZ5IGFueSBkb2N1bWVudHMgeWV0LCB0aGVuXG4gICAgLy8gaXQncyB0aW1lIHRvIGRvIGFuIGluc2VydC4gRmlndXJlIG91dCB3aGF0IGRvY3VtZW50IHdlIGFyZSBpbnNlcnRpbmcsIGFuZFxuICAgIC8vIGdlbmVyYXRlIGFuIGlkIGZvciBpdC5cbiAgICBsZXQgaW5zZXJ0ZWRJZDtcbiAgICBpZiAodXBkYXRlQ291bnQgPT09IDAgJiYgb3B0aW9ucy51cHNlcnQpIHtcbiAgICAgIGNvbnN0IGRvYyA9IExvY2FsQ29sbGVjdGlvbi5fY3JlYXRlVXBzZXJ0RG9jdW1lbnQoc2VsZWN0b3IsIG1vZCk7XG4gICAgICBpZiAoIWRvYy5faWQgJiYgb3B0aW9ucy5pbnNlcnRlZElkKSB7XG4gICAgICAgIGRvYy5faWQgPSBvcHRpb25zLmluc2VydGVkSWQ7XG4gICAgICB9XG5cbiAgICAgIGluc2VydGVkSWQgPSBhd2FpdCB0aGlzLmluc2VydEFzeW5jKGRvYyk7XG4gICAgICB1cGRhdGVDb3VudCA9IDE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZmluaXNoVXBkYXRlKHtcbiAgICAgIG9wdGlvbnMsXG4gICAgICBpbnNlcnRlZElkLFxuICAgICAgdXBkYXRlQ291bnQsXG4gICAgICBjYWxsYmFjayxcbiAgICB9KTtcbiAgfVxuICAvLyBYWFggYXRvbWljaXR5OiBpZiBtdWx0aSBpcyB0cnVlLCBhbmQgb25lIG1vZGlmaWNhdGlvbiBmYWlscywgZG9cbiAgLy8gd2Ugcm9sbGJhY2sgdGhlIHdob2xlIG9wZXJhdGlvbiwgb3Igd2hhdD9cbiAgdXBkYXRlKHNlbGVjdG9yLCBtb2QsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCEgY2FsbGJhY2sgJiYgb3B0aW9ucyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXRjaGVyID0gbmV3IE1pbmltb25nby5NYXRjaGVyKHNlbGVjdG9yLCB0cnVlKTtcblxuICAgIGNvbnN0IHFpZFRvT3JpZ2luYWxSZXN1bHRzID0gdGhpcy5wcmVwYXJlVXBkYXRlKHNlbGVjdG9yKTtcblxuICAgIGxldCByZWNvbXB1dGVRaWRzID0ge307XG5cbiAgICBsZXQgdXBkYXRlQ291bnQgPSAwO1xuXG4gICAgdGhpcy5fZWFjaFBvc3NpYmx5TWF0Y2hpbmdEb2NTeW5jKHNlbGVjdG9yLCAoZG9jLCBpZCkgPT4ge1xuICAgICAgY29uc3QgcXVlcnlSZXN1bHQgPSBtYXRjaGVyLmRvY3VtZW50TWF0Y2hlcyhkb2MpO1xuXG4gICAgICBpZiAocXVlcnlSZXN1bHQucmVzdWx0KSB7XG4gICAgICAgIC8vIFhYWCBTaG91bGQgd2Ugc2F2ZSB0aGUgb3JpZ2luYWwgZXZlbiBpZiBtb2QgZW5kcyB1cCBiZWluZyBhIG5vLW9wP1xuICAgICAgICB0aGlzLl9zYXZlT3JpZ2luYWwoaWQsIGRvYyk7XG4gICAgICAgIHJlY29tcHV0ZVFpZHMgPSB0aGlzLl9tb2RpZnlBbmROb3RpZnlTeW5jKFxuICAgICAgICAgIGRvYyxcbiAgICAgICAgICBtb2QsXG4gICAgICAgICAgcXVlcnlSZXN1bHQuYXJyYXlJbmRpY2VzXG4gICAgICAgICk7XG5cbiAgICAgICAgKyt1cGRhdGVDb3VudDtcblxuICAgICAgICBpZiAoIW9wdGlvbnMubXVsdGkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICBPYmplY3Qua2V5cyhyZWNvbXB1dGVRaWRzKS5mb3JFYWNoKHFpZCA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuICAgICAgaWYgKHF1ZXJ5KSB7XG4gICAgICAgIHRoaXMuX3JlY29tcHV0ZVJlc3VsdHMocXVlcnksIHFpZFRvT3JpZ2luYWxSZXN1bHRzW3FpZF0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5fb2JzZXJ2ZVF1ZXVlLmRyYWluKCk7XG5cblxuICAgIC8vIElmIHdlIGFyZSBkb2luZyBhbiB1cHNlcnQsIGFuZCB3ZSBkaWRuJ3QgbW9kaWZ5IGFueSBkb2N1bWVudHMgeWV0LCB0aGVuXG4gICAgLy8gaXQncyB0aW1lIHRvIGRvIGFuIGluc2VydC4gRmlndXJlIG91dCB3aGF0IGRvY3VtZW50IHdlIGFyZSBpbnNlcnRpbmcsIGFuZFxuICAgIC8vIGdlbmVyYXRlIGFuIGlkIGZvciBpdC5cbiAgICBsZXQgaW5zZXJ0ZWRJZDtcbiAgICBpZiAodXBkYXRlQ291bnQgPT09IDAgJiYgb3B0aW9ucy51cHNlcnQpIHtcbiAgICAgIGNvbnN0IGRvYyA9IExvY2FsQ29sbGVjdGlvbi5fY3JlYXRlVXBzZXJ0RG9jdW1lbnQoc2VsZWN0b3IsIG1vZCk7XG4gICAgICBpZiAoIWRvYy5faWQgJiYgb3B0aW9ucy5pbnNlcnRlZElkKSB7XG4gICAgICAgIGRvYy5faWQgPSBvcHRpb25zLmluc2VydGVkSWQ7XG4gICAgICB9XG5cbiAgICAgIGluc2VydGVkSWQgPSB0aGlzLmluc2VydChkb2MpO1xuICAgICAgdXBkYXRlQ291bnQgPSAxO1xuICAgIH1cblxuXG4gICAgcmV0dXJuIHRoaXMuZmluaXNoVXBkYXRlKHtcbiAgICAgIG9wdGlvbnMsXG4gICAgICBpbnNlcnRlZElkLFxuICAgICAgdXBkYXRlQ291bnQsXG4gICAgICBjYWxsYmFjayxcbiAgICAgIHNlbGVjdG9yLFxuICAgICAgbW9kLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gQSBjb252ZW5pZW5jZSB3cmFwcGVyIG9uIHVwZGF0ZS4gTG9jYWxDb2xsZWN0aW9uLnVwc2VydChzZWwsIG1vZCkgaXNcbiAgLy8gZXF1aXZhbGVudCB0byBMb2NhbENvbGxlY3Rpb24udXBkYXRlKHNlbCwgbW9kLCB7dXBzZXJ0OiB0cnVlLFxuICAvLyBfcmV0dXJuT2JqZWN0OiB0cnVlfSkuXG4gIHVwc2VydChzZWxlY3RvciwgbW9kLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIGlmICghY2FsbGJhY2sgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy51cGRhdGUoXG4gICAgICBzZWxlY3RvcixcbiAgICAgIG1vZCxcbiAgICAgIE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHt1cHNlcnQ6IHRydWUsIF9yZXR1cm5PYmplY3Q6IHRydWV9KSxcbiAgICAgIGNhbGxiYWNrXG4gICAgKTtcbiAgfVxuXG4gIHVwc2VydEFzeW5jKHNlbGVjdG9yLCBtb2QsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCFjYWxsYmFjayAmJiB0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnVwZGF0ZUFzeW5jKFxuICAgICAgc2VsZWN0b3IsXG4gICAgICBtb2QsXG4gICAgICBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7dXBzZXJ0OiB0cnVlLCBfcmV0dXJuT2JqZWN0OiB0cnVlfSksXG4gICAgICBjYWxsYmFja1xuICAgICk7XG4gIH1cblxuICAvLyBJdGVyYXRlcyBvdmVyIGEgc3Vic2V0IG9mIGRvY3VtZW50cyB0aGF0IGNvdWxkIG1hdGNoIHNlbGVjdG9yOyBjYWxsc1xuICAvLyBmbihkb2MsIGlkKSBvbiBlYWNoIG9mIHRoZW0uICBTcGVjaWZpY2FsbHksIGlmIHNlbGVjdG9yIHNwZWNpZmllc1xuICAvLyBzcGVjaWZpYyBfaWQncywgaXQgb25seSBsb29rcyBhdCB0aG9zZS4gIGRvYyBpcyAqbm90KiBjbG9uZWQ6IGl0IGlzIHRoZVxuICAvLyBzYW1lIG9iamVjdCB0aGF0IGlzIGluIF9kb2NzLlxuICBhc3luYyBfZWFjaFBvc3NpYmx5TWF0Y2hpbmdEb2NBc3luYyhzZWxlY3RvciwgZm4pIHtcbiAgICBjb25zdCBzcGVjaWZpY0lkcyA9IExvY2FsQ29sbGVjdGlvbi5faWRzTWF0Y2hlZEJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuXG4gICAgaWYgKHNwZWNpZmljSWRzKSB7XG4gICAgICBmb3IgKGNvbnN0IGlkIG9mIHNwZWNpZmljSWRzKSB7XG4gICAgICAgIGNvbnN0IGRvYyA9IHRoaXMuX2RvY3MuZ2V0KGlkKTtcblxuICAgICAgICBpZiAoZG9jICYmICEgKGF3YWl0IGZuKGRvYywgaWQpKSkge1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdGhpcy5fZG9jcy5mb3JFYWNoQXN5bmMoZm4pO1xuICAgIH1cbiAgfVxuICBfZWFjaFBvc3NpYmx5TWF0Y2hpbmdEb2NTeW5jKHNlbGVjdG9yLCBmbikge1xuICAgIGNvbnN0IHNwZWNpZmljSWRzID0gTG9jYWxDb2xsZWN0aW9uLl9pZHNNYXRjaGVkQnlTZWxlY3RvcihzZWxlY3Rvcik7XG5cbiAgICBpZiAoc3BlY2lmaWNJZHMpIHtcbiAgICAgIGZvciAoY29uc3QgaWQgb2Ygc3BlY2lmaWNJZHMpIHtcbiAgICAgICAgY29uc3QgZG9jID0gdGhpcy5fZG9jcy5nZXQoaWQpO1xuXG4gICAgICAgIGlmIChkb2MgJiYgZm4oZG9jLCBpZCkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kb2NzLmZvckVhY2goZm4pO1xuICAgIH1cbiAgfVxuXG4gIF9nZXRNYXRjaGVkRG9jQW5kTW9kaWZ5KGRvYywgbW9kLCBhcnJheUluZGljZXMpIHtcbiAgICBjb25zdCBtYXRjaGVkX2JlZm9yZSA9IHt9O1xuXG4gICAgT2JqZWN0LmtleXModGhpcy5xdWVyaWVzKS5mb3JFYWNoKHFpZCA9PiB7XG4gICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuXG4gICAgICBpZiAocXVlcnkuZGlydHkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAocXVlcnkub3JkZXJlZCkge1xuICAgICAgICBtYXRjaGVkX2JlZm9yZVtxaWRdID0gcXVlcnkubWF0Y2hlci5kb2N1bWVudE1hdGNoZXMoZG9jKS5yZXN1bHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBCZWNhdXNlIHdlIGRvbid0IHN1cHBvcnQgc2tpcCBvciBsaW1pdCAoeWV0KSBpbiB1bm9yZGVyZWQgcXVlcmllcywgd2VcbiAgICAgICAgLy8gY2FuIGp1c3QgZG8gYSBkaXJlY3QgbG9va3VwLlxuICAgICAgICBtYXRjaGVkX2JlZm9yZVtxaWRdID0gcXVlcnkucmVzdWx0cy5oYXMoZG9jLl9pZCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWF0Y2hlZF9iZWZvcmU7XG4gIH1cblxuICBfbW9kaWZ5QW5kTm90aWZ5U3luYyhkb2MsIG1vZCwgYXJyYXlJbmRpY2VzKSB7XG5cbiAgICBjb25zdCBtYXRjaGVkX2JlZm9yZSA9IHRoaXMuX2dldE1hdGNoZWREb2NBbmRNb2RpZnkoZG9jLCBtb2QsIGFycmF5SW5kaWNlcyk7XG5cbiAgICBjb25zdCBvbGRfZG9jID0gRUpTT04uY2xvbmUoZG9jKTtcbiAgICBMb2NhbENvbGxlY3Rpb24uX21vZGlmeShkb2MsIG1vZCwge2FycmF5SW5kaWNlc30pO1xuXG4gICAgY29uc3QgcmVjb21wdXRlUWlkcyA9IHt9O1xuXG4gICAgZm9yIChjb25zdCBxaWQgb2YgT2JqZWN0LmtleXModGhpcy5xdWVyaWVzKSkge1xuICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbcWlkXTtcblxuICAgICAgaWYgKHF1ZXJ5LmRpcnR5KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhZnRlck1hdGNoID0gcXVlcnkubWF0Y2hlci5kb2N1bWVudE1hdGNoZXMoZG9jKTtcbiAgICAgIGNvbnN0IGFmdGVyID0gYWZ0ZXJNYXRjaC5yZXN1bHQ7XG4gICAgICBjb25zdCBiZWZvcmUgPSBtYXRjaGVkX2JlZm9yZVtxaWRdO1xuXG4gICAgICBpZiAoYWZ0ZXIgJiYgcXVlcnkuZGlzdGFuY2VzICYmIGFmdGVyTWF0Y2guZGlzdGFuY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBxdWVyeS5kaXN0YW5jZXMuc2V0KGRvYy5faWQsIGFmdGVyTWF0Y2guZGlzdGFuY2UpO1xuICAgICAgfVxuXG4gICAgICBpZiAocXVlcnkuY3Vyc29yLnNraXAgfHwgcXVlcnkuY3Vyc29yLmxpbWl0KSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gcmVjb21wdXRlIGFueSBxdWVyeSB3aGVyZSB0aGUgZG9jIG1heSBoYXZlIGJlZW4gaW4gdGhlXG4gICAgICAgIC8vIGN1cnNvcidzIHdpbmRvdyBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSB1cGRhdGUuIChOb3RlIHRoYXQgaWYgc2tpcFxuICAgICAgICAvLyBvciBsaW1pdCBpcyBzZXQsIFwiYmVmb3JlXCIgYW5kIFwiYWZ0ZXJcIiBiZWluZyB0cnVlIGRvIG5vdCBuZWNlc3NhcmlseVxuICAgICAgICAvLyBtZWFuIHRoYXQgdGhlIGRvY3VtZW50IGlzIGluIHRoZSBjdXJzb3IncyBvdXRwdXQgYWZ0ZXIgc2tpcC9saW1pdCBpc1xuICAgICAgICAvLyBhcHBsaWVkLi4uIGJ1dCBpZiB0aGV5IGFyZSBmYWxzZSwgdGhlbiB0aGUgZG9jdW1lbnQgZGVmaW5pdGVseSBpcyBOT1RcbiAgICAgICAgLy8gaW4gdGhlIG91dHB1dC4gU28gaXQncyBzYWZlIHRvIHNraXAgcmVjb21wdXRlIGlmIG5laXRoZXIgYmVmb3JlIG9yXG4gICAgICAgIC8vIGFmdGVyIGFyZSB0cnVlLilcbiAgICAgICAgaWYgKGJlZm9yZSB8fCBhZnRlcikge1xuICAgICAgICAgIHJlY29tcHV0ZVFpZHNbcWlkXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYmVmb3JlICYmICFhZnRlcikge1xuICAgICAgICBMb2NhbENvbGxlY3Rpb24uX3JlbW92ZUZyb21SZXN1bHRzU3luYyhxdWVyeSwgZG9jKTtcbiAgICAgIH0gZWxzZSBpZiAoIWJlZm9yZSAmJiBhZnRlcikge1xuICAgICAgICBMb2NhbENvbGxlY3Rpb24uX2luc2VydEluUmVzdWx0c1N5bmMocXVlcnksIGRvYyk7XG4gICAgICB9IGVsc2UgaWYgKGJlZm9yZSAmJiBhZnRlcikge1xuICAgICAgICBMb2NhbENvbGxlY3Rpb24uX3VwZGF0ZUluUmVzdWx0c1N5bmMocXVlcnksIGRvYywgb2xkX2RvYyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZWNvbXB1dGVRaWRzO1xuICB9XG5cbiAgYXN5bmMgX21vZGlmeUFuZE5vdGlmeUFzeW5jKGRvYywgbW9kLCBhcnJheUluZGljZXMpIHtcblxuICAgIGNvbnN0IG1hdGNoZWRfYmVmb3JlID0gdGhpcy5fZ2V0TWF0Y2hlZERvY0FuZE1vZGlmeShkb2MsIG1vZCwgYXJyYXlJbmRpY2VzKTtcblxuICAgIGNvbnN0IG9sZF9kb2MgPSBFSlNPTi5jbG9uZShkb2MpO1xuICAgIExvY2FsQ29sbGVjdGlvbi5fbW9kaWZ5KGRvYywgbW9kLCB7YXJyYXlJbmRpY2VzfSk7XG5cbiAgICBjb25zdCByZWNvbXB1dGVRaWRzID0ge307XG4gICAgZm9yIChjb25zdCBxaWQgaW4gdGhpcy5xdWVyaWVzKSB7XG4gICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcmllc1txaWRdO1xuXG4gICAgICBpZiAocXVlcnkuZGlydHkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGFmdGVyTWF0Y2ggPSBxdWVyeS5tYXRjaGVyLmRvY3VtZW50TWF0Y2hlcyhkb2MpO1xuICAgICAgY29uc3QgYWZ0ZXIgPSBhZnRlck1hdGNoLnJlc3VsdDtcbiAgICAgIGNvbnN0IGJlZm9yZSA9IG1hdGNoZWRfYmVmb3JlW3FpZF07XG5cbiAgICAgIGlmIChhZnRlciAmJiBxdWVyeS5kaXN0YW5jZXMgJiYgYWZ0ZXJNYXRjaC5kaXN0YW5jZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHF1ZXJ5LmRpc3RhbmNlcy5zZXQoZG9jLl9pZCwgYWZ0ZXJNYXRjaC5kaXN0YW5jZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChxdWVyeS5jdXJzb3Iuc2tpcCB8fCBxdWVyeS5jdXJzb3IubGltaXQpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byByZWNvbXB1dGUgYW55IHF1ZXJ5IHdoZXJlIHRoZSBkb2MgbWF5IGhhdmUgYmVlbiBpbiB0aGVcbiAgICAgICAgLy8gY3Vyc29yJ3Mgd2luZG93IGVpdGhlciBiZWZvcmUgb3IgYWZ0ZXIgdGhlIHVwZGF0ZS4gKE5vdGUgdGhhdCBpZiBza2lwXG4gICAgICAgIC8vIG9yIGxpbWl0IGlzIHNldCwgXCJiZWZvcmVcIiBhbmQgXCJhZnRlclwiIGJlaW5nIHRydWUgZG8gbm90IG5lY2Vzc2FyaWx5XG4gICAgICAgIC8vIG1lYW4gdGhhdCB0aGUgZG9jdW1lbnQgaXMgaW4gdGhlIGN1cnNvcidzIG91dHB1dCBhZnRlciBza2lwL2xpbWl0IGlzXG4gICAgICAgIC8vIGFwcGxpZWQuLi4gYnV0IGlmIHRoZXkgYXJlIGZhbHNlLCB0aGVuIHRoZSBkb2N1bWVudCBkZWZpbml0ZWx5IGlzIE5PVFxuICAgICAgICAvLyBpbiB0aGUgb3V0cHV0LiBTbyBpdCdzIHNhZmUgdG8gc2tpcCByZWNvbXB1dGUgaWYgbmVpdGhlciBiZWZvcmUgb3JcbiAgICAgICAgLy8gYWZ0ZXIgYXJlIHRydWUuKVxuICAgICAgICBpZiAoYmVmb3JlIHx8IGFmdGVyKSB7XG4gICAgICAgICAgcmVjb21wdXRlUWlkc1txaWRdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChiZWZvcmUgJiYgIWFmdGVyKSB7XG4gICAgICAgIGF3YWl0IExvY2FsQ29sbGVjdGlvbi5fcmVtb3ZlRnJvbVJlc3VsdHNBc3luYyhxdWVyeSwgZG9jKTtcbiAgICAgIH0gZWxzZSBpZiAoIWJlZm9yZSAmJiBhZnRlcikge1xuICAgICAgICBhd2FpdCBMb2NhbENvbGxlY3Rpb24uX2luc2VydEluUmVzdWx0c0FzeW5jKHF1ZXJ5LCBkb2MpO1xuICAgICAgfSBlbHNlIGlmIChiZWZvcmUgJiYgYWZ0ZXIpIHtcbiAgICAgICAgYXdhaXQgTG9jYWxDb2xsZWN0aW9uLl91cGRhdGVJblJlc3VsdHNBc3luYyhxdWVyeSwgZG9jLCBvbGRfZG9jKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlY29tcHV0ZVFpZHM7XG4gIH1cblxuICAvLyBSZWNvbXB1dGVzIHRoZSByZXN1bHRzIG9mIGEgcXVlcnkgYW5kIHJ1bnMgb2JzZXJ2ZSBjYWxsYmFja3MgZm9yIHRoZVxuICAvLyBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHByZXZpb3VzIHJlc3VsdHMgYW5kIHRoZSBjdXJyZW50IHJlc3VsdHMgKHVubGVzc1xuICAvLyBwYXVzZWQpLiBVc2VkIGZvciBza2lwL2xpbWl0IHF1ZXJpZXMuXG4gIC8vXG4gIC8vIFdoZW4gdGhpcyBpcyB1c2VkIGJ5IGluc2VydCBvciByZW1vdmUsIGl0IGNhbiBqdXN0IHVzZSBxdWVyeS5yZXN1bHRzIGZvclxuICAvLyB0aGUgb2xkIHJlc3VsdHMgKGFuZCB0aGVyZSdzIG5vIG5lZWQgdG8gcGFzcyBpbiBvbGRSZXN1bHRzKSwgYmVjYXVzZSB0aGVzZVxuICAvLyBvcGVyYXRpb25zIGRvbid0IG11dGF0ZSB0aGUgZG9jdW1lbnRzIGluIHRoZSBjb2xsZWN0aW9uLiBVcGRhdGUgbmVlZHMgdG9cbiAgLy8gcGFzcyBpbiBhbiBvbGRSZXN1bHRzIHdoaWNoIHdhcyBkZWVwLWNvcGllZCBiZWZvcmUgdGhlIG1vZGlmaWVyIHdhc1xuICAvLyBhcHBsaWVkLlxuICAvL1xuICAvLyBvbGRSZXN1bHRzIGlzIGd1YXJhbnRlZWQgdG8gYmUgaWdub3JlZCBpZiB0aGUgcXVlcnkgaXMgbm90IHBhdXNlZC5cbiAgX3JlY29tcHV0ZVJlc3VsdHMocXVlcnksIG9sZFJlc3VsdHMpIHtcbiAgICBpZiAodGhpcy5wYXVzZWQpIHtcbiAgICAgIC8vIFRoZXJlJ3Mgbm8gcmVhc29uIHRvIHJlY29tcHV0ZSB0aGUgcmVzdWx0cyBub3cgYXMgd2UncmUgc3RpbGwgcGF1c2VkLlxuICAgICAgLy8gQnkgZmxhZ2dpbmcgdGhlIHF1ZXJ5IGFzIFwiZGlydHlcIiwgdGhlIHJlY29tcHV0ZSB3aWxsIGJlIHBlcmZvcm1lZFxuICAgICAgLy8gd2hlbiByZXN1bWVPYnNlcnZlcnMgaXMgY2FsbGVkLlxuICAgICAgcXVlcnkuZGlydHkgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5wYXVzZWQgJiYgIW9sZFJlc3VsdHMpIHtcbiAgICAgIG9sZFJlc3VsdHMgPSBxdWVyeS5yZXN1bHRzO1xuICAgIH1cblxuICAgIGlmIChxdWVyeS5kaXN0YW5jZXMpIHtcbiAgICAgIHF1ZXJ5LmRpc3RhbmNlcy5jbGVhcigpO1xuICAgIH1cblxuICAgIHF1ZXJ5LnJlc3VsdHMgPSBxdWVyeS5jdXJzb3IuX2dldFJhd09iamVjdHMoe1xuICAgICAgZGlzdGFuY2VzOiBxdWVyeS5kaXN0YW5jZXMsXG4gICAgICBvcmRlcmVkOiBxdWVyeS5vcmRlcmVkXG4gICAgfSk7XG5cbiAgICBpZiAoIXRoaXMucGF1c2VkKSB7XG4gICAgICBMb2NhbENvbGxlY3Rpb24uX2RpZmZRdWVyeUNoYW5nZXMoXG4gICAgICAgIHF1ZXJ5Lm9yZGVyZWQsXG4gICAgICAgIG9sZFJlc3VsdHMsXG4gICAgICAgIHF1ZXJ5LnJlc3VsdHMsXG4gICAgICAgIHF1ZXJ5LFxuICAgICAgICB7cHJvamVjdGlvbkZuOiBxdWVyeS5wcm9qZWN0aW9uRm59XG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIF9zYXZlT3JpZ2luYWwoaWQsIGRvYykge1xuICAgIC8vIEFyZSB3ZSBldmVuIHRyeWluZyB0byBzYXZlIG9yaWdpbmFscz9cbiAgICBpZiAoIXRoaXMuX3NhdmVkT3JpZ2luYWxzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSGF2ZSB3ZSBwcmV2aW91c2x5IG11dGF0ZWQgdGhlIG9yaWdpbmFsIChhbmQgc28gJ2RvYycgaXMgbm90IGFjdHVhbGx5XG4gICAgLy8gb3JpZ2luYWwpPyAgKE5vdGUgdGhlICdoYXMnIGNoZWNrIHJhdGhlciB0aGFuIHRydXRoOiB3ZSBzdG9yZSB1bmRlZmluZWRcbiAgICAvLyBoZXJlIGZvciBpbnNlcnRlZCBkb2NzISlcbiAgICBpZiAodGhpcy5fc2F2ZWRPcmlnaW5hbHMuaGFzKGlkKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3NhdmVkT3JpZ2luYWxzLnNldChpZCwgRUpTT04uY2xvbmUoZG9jKSk7XG4gIH1cbn1cblxuTG9jYWxDb2xsZWN0aW9uLkN1cnNvciA9IEN1cnNvcjtcblxuTG9jYWxDb2xsZWN0aW9uLk9ic2VydmVIYW5kbGUgPSBPYnNlcnZlSGFuZGxlO1xuXG4vLyBYWFggbWF5YmUgbW92ZSB0aGVzZSBpbnRvIGFub3RoZXIgT2JzZXJ2ZUhlbHBlcnMgcGFja2FnZSBvciBzb21ldGhpbmdcblxuLy8gX0NhY2hpbmdDaGFuZ2VPYnNlcnZlciBpcyBhbiBvYmplY3Qgd2hpY2ggcmVjZWl2ZXMgb2JzZXJ2ZUNoYW5nZXMgY2FsbGJhY2tzXG4vLyBhbmQga2VlcHMgYSBjYWNoZSBvZiB0aGUgY3VycmVudCBjdXJzb3Igc3RhdGUgdXAgdG8gZGF0ZSBpbiB0aGlzLmRvY3MuIFVzZXJzXG4vLyBvZiB0aGlzIGNsYXNzIHNob3VsZCByZWFkIHRoZSBkb2NzIGZpZWxkIGJ1dCBub3QgbW9kaWZ5IGl0LiBZb3Ugc2hvdWxkIHBhc3Ncbi8vIHRoZSBcImFwcGx5Q2hhbmdlXCIgZmllbGQgYXMgdGhlIGNhbGxiYWNrcyB0byB0aGUgdW5kZXJseWluZyBvYnNlcnZlQ2hhbmdlc1xuLy8gY2FsbC4gT3B0aW9uYWxseSwgeW91IGNhbiBzcGVjaWZ5IHlvdXIgb3duIG9ic2VydmVDaGFuZ2VzIGNhbGxiYWNrcyB3aGljaCBhcmVcbi8vIGludm9rZWQgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb2NzIGZpZWxkIGlzIHVwZGF0ZWQ7IHRoaXMgb2JqZWN0IGlzIG1hZGVcbi8vIGF2YWlsYWJsZSBhcyBgdGhpc2AgdG8gdGhvc2UgY2FsbGJhY2tzLlxuTG9jYWxDb2xsZWN0aW9uLl9DYWNoaW5nQ2hhbmdlT2JzZXJ2ZXIgPSBjbGFzcyBfQ2FjaGluZ0NoYW5nZU9ic2VydmVyIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3Qgb3JkZXJlZEZyb21DYWxsYmFja3MgPSAoXG4gICAgICBvcHRpb25zLmNhbGxiYWNrcyAmJlxuICAgICAgTG9jYWxDb2xsZWN0aW9uLl9vYnNlcnZlQ2hhbmdlc0NhbGxiYWNrc0FyZU9yZGVyZWQob3B0aW9ucy5jYWxsYmFja3MpXG4gICAgKTtcblxuICAgIGlmIChoYXNPd24uY2FsbChvcHRpb25zLCAnb3JkZXJlZCcpKSB7XG4gICAgICB0aGlzLm9yZGVyZWQgPSBvcHRpb25zLm9yZGVyZWQ7XG5cbiAgICAgIGlmIChvcHRpb25zLmNhbGxiYWNrcyAmJiBvcHRpb25zLm9yZGVyZWQgIT09IG9yZGVyZWRGcm9tQ2FsbGJhY2tzKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdvcmRlcmVkIG9wdGlvbiBkb2VzblxcJ3QgbWF0Y2ggY2FsbGJhY2tzJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmNhbGxiYWNrcykge1xuICAgICAgdGhpcy5vcmRlcmVkID0gb3JkZXJlZEZyb21DYWxsYmFja3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKCdtdXN0IHByb3ZpZGUgb3JkZXJlZCBvciBjYWxsYmFja3MnKTtcbiAgICB9XG5cbiAgICBjb25zdCBjYWxsYmFja3MgPSBvcHRpb25zLmNhbGxiYWNrcyB8fCB7fTtcblxuICAgIGlmICh0aGlzLm9yZGVyZWQpIHtcbiAgICAgIHRoaXMuZG9jcyA9IG5ldyBPcmRlcmVkRGljdChNb25nb0lELmlkU3RyaW5naWZ5KTtcbiAgICAgIHRoaXMuYXBwbHlDaGFuZ2UgPSB7XG4gICAgICAgIGFkZGVkQmVmb3JlOiAoaWQsIGZpZWxkcywgYmVmb3JlKSA9PiB7XG4gICAgICAgICAgLy8gVGFrZSBhIHNoYWxsb3cgY29weSBzaW5jZSB0aGUgdG9wLWxldmVsIHByb3BlcnRpZXMgY2FuIGJlIGNoYW5nZWRcbiAgICAgICAgICBjb25zdCBkb2MgPSB7IC4uLmZpZWxkcyB9O1xuXG4gICAgICAgICAgZG9jLl9pZCA9IGlkO1xuXG4gICAgICAgICAgaWYgKGNhbGxiYWNrcy5hZGRlZEJlZm9yZSkge1xuICAgICAgICAgICAgY2FsbGJhY2tzLmFkZGVkQmVmb3JlLmNhbGwodGhpcywgaWQsIEVKU09OLmNsb25lKGZpZWxkcyksIGJlZm9yZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVGhpcyBsaW5lIHRyaWdnZXJzIGlmIHdlIHByb3ZpZGUgYWRkZWQgd2l0aCBtb3ZlZEJlZm9yZS5cbiAgICAgICAgICBpZiAoY2FsbGJhY2tzLmFkZGVkKSB7XG4gICAgICAgICAgICBjYWxsYmFja3MuYWRkZWQuY2FsbCh0aGlzLCBpZCwgRUpTT04uY2xvbmUoZmllbGRzKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gWFhYIGNvdWxkIGBiZWZvcmVgIGJlIGEgZmFsc3kgSUQ/ICBUZWNobmljYWxseVxuICAgICAgICAgIC8vIGlkU3RyaW5naWZ5IHNlZW1zIHRvIGFsbG93IGZvciB0aGVtIC0tIHRob3VnaFxuICAgICAgICAgIC8vIE9yZGVyZWREaWN0IHdvbid0IGNhbGwgc3RyaW5naWZ5IG9uIGEgZmFsc3kgYXJnLlxuICAgICAgICAgIHRoaXMuZG9jcy5wdXRCZWZvcmUoaWQsIGRvYywgYmVmb3JlIHx8IG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBtb3ZlZEJlZm9yZTogKGlkLCBiZWZvcmUpID0+IHtcbiAgICAgICAgICBpZiAoY2FsbGJhY2tzLm1vdmVkQmVmb3JlKSB7XG4gICAgICAgICAgICBjYWxsYmFja3MubW92ZWRCZWZvcmUuY2FsbCh0aGlzLCBpZCwgYmVmb3JlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmRvY3MubW92ZUJlZm9yZShpZCwgYmVmb3JlIHx8IG51bGwpO1xuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kb2NzID0gbmV3IExvY2FsQ29sbGVjdGlvbi5fSWRNYXA7XG4gICAgICB0aGlzLmFwcGx5Q2hhbmdlID0ge1xuICAgICAgICBhZGRlZDogKGlkLCBmaWVsZHMpID0+IHtcbiAgICAgICAgICAvLyBUYWtlIGEgc2hhbGxvdyBjb3B5IHNpbmNlIHRoZSB0b3AtbGV2ZWwgcHJvcGVydGllcyBjYW4gYmUgY2hhbmdlZFxuICAgICAgICAgIGNvbnN0IGRvYyA9IHsgLi4uZmllbGRzIH07XG5cbiAgICAgICAgICBpZiAoY2FsbGJhY2tzLmFkZGVkKSB7XG4gICAgICAgICAgICBjYWxsYmFja3MuYWRkZWQuY2FsbCh0aGlzLCBpZCwgRUpTT04uY2xvbmUoZmllbGRzKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZG9jLl9pZCA9IGlkO1xuXG4gICAgICAgICAgdGhpcy5kb2NzLnNldChpZCwgIGRvYyk7XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIFRoZSBtZXRob2RzIGluIF9JZE1hcCBhbmQgT3JkZXJlZERpY3QgdXNlZCBieSB0aGVzZSBjYWxsYmFja3MgYXJlXG4gICAgLy8gaWRlbnRpY2FsLlxuICAgIHRoaXMuYXBwbHlDaGFuZ2UuY2hhbmdlZCA9IChpZCwgZmllbGRzKSA9PiB7XG4gICAgICBjb25zdCBkb2MgPSB0aGlzLmRvY3MuZ2V0KGlkKTtcblxuICAgICAgaWYgKCFkb2MpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGlkIGZvciBjaGFuZ2VkOiAke2lkfWApO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2FsbGJhY2tzLmNoYW5nZWQpIHtcbiAgICAgICAgY2FsbGJhY2tzLmNoYW5nZWQuY2FsbCh0aGlzLCBpZCwgRUpTT04uY2xvbmUoZmllbGRzKSk7XG4gICAgICB9XG5cbiAgICAgIERpZmZTZXF1ZW5jZS5hcHBseUNoYW5nZXMoZG9jLCBmaWVsZHMpO1xuICAgIH07XG5cbiAgICB0aGlzLmFwcGx5Q2hhbmdlLnJlbW92ZWQgPSBpZCA9PiB7XG4gICAgICBpZiAoY2FsbGJhY2tzLnJlbW92ZWQpIHtcbiAgICAgICAgY2FsbGJhY2tzLnJlbW92ZWQuY2FsbCh0aGlzLCBpZCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZG9jcy5yZW1vdmUoaWQpO1xuICAgIH07XG4gIH1cbn07XG5cbkxvY2FsQ29sbGVjdGlvbi5fSWRNYXAgPSBjbGFzcyBfSWRNYXAgZXh0ZW5kcyBJZE1hcCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKE1vbmdvSUQuaWRTdHJpbmdpZnksIE1vbmdvSUQuaWRQYXJzZSk7XG4gIH1cbn07XG5cbi8vIFdyYXAgYSB0cmFuc2Zvcm0gZnVuY3Rpb24gdG8gcmV0dXJuIG9iamVjdHMgdGhhdCBoYXZlIHRoZSBfaWQgZmllbGRcbi8vIG9mIHRoZSB1bnRyYW5zZm9ybWVkIGRvY3VtZW50LiBUaGlzIGVuc3VyZXMgdGhhdCBzdWJzeXN0ZW1zIHN1Y2ggYXNcbi8vIHRoZSBvYnNlcnZlLXNlcXVlbmNlIHBhY2thZ2UgdGhhdCBjYWxsIGBvYnNlcnZlYCBjYW4ga2VlcCB0cmFjayBvZlxuLy8gdGhlIGRvY3VtZW50cyBpZGVudGl0aWVzLlxuLy9cbi8vIC0gUmVxdWlyZSB0aGF0IGl0IHJldHVybnMgb2JqZWN0c1xuLy8gLSBJZiB0aGUgcmV0dXJuIHZhbHVlIGhhcyBhbiBfaWQgZmllbGQsIHZlcmlmeSB0aGF0IGl0IG1hdGNoZXMgdGhlXG4vLyAgIG9yaWdpbmFsIF9pZCBmaWVsZFxuLy8gLSBJZiB0aGUgcmV0dXJuIHZhbHVlIGRvZXNuJ3QgaGF2ZSBhbiBfaWQgZmllbGQsIGFkZCBpdCBiYWNrLlxuTG9jYWxDb2xsZWN0aW9uLndyYXBUcmFuc2Zvcm0gPSB0cmFuc2Zvcm0gPT4ge1xuICBpZiAoIXRyYW5zZm9ybSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gTm8gbmVlZCB0byBkb3VibHktd3JhcCB0cmFuc2Zvcm1zLlxuICBpZiAodHJhbnNmb3JtLl9fd3JhcHBlZFRyYW5zZm9ybV9fKSB7XG4gICAgcmV0dXJuIHRyYW5zZm9ybTtcbiAgfVxuXG4gIGNvbnN0IHdyYXBwZWQgPSBkb2MgPT4ge1xuICAgIGlmICghaGFzT3duLmNhbGwoZG9jLCAnX2lkJykpIHtcbiAgICAgIC8vIFhYWCBkbyB3ZSBldmVyIGhhdmUgYSB0cmFuc2Zvcm0gb24gdGhlIG9wbG9nJ3MgY29sbGVjdGlvbj8gYmVjYXVzZSB0aGF0XG4gICAgICAvLyBjb2xsZWN0aW9uIGhhcyBubyBfaWQuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NhbiBvbmx5IHRyYW5zZm9ybSBkb2N1bWVudHMgd2l0aCBfaWQnKTtcbiAgICB9XG5cbiAgICBjb25zdCBpZCA9IGRvYy5faWQ7XG5cbiAgICAvLyBYWFggY29uc2lkZXIgbWFraW5nIHRyYWNrZXIgYSB3ZWFrIGRlcGVuZGVuY3kgYW5kIGNoZWNraW5nXG4gICAgLy8gUGFja2FnZS50cmFja2VyIGhlcmVcbiAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IFRyYWNrZXIubm9ucmVhY3RpdmUoKCkgPT4gdHJhbnNmb3JtKGRvYykpO1xuXG4gICAgaWYgKCFMb2NhbENvbGxlY3Rpb24uX2lzUGxhaW5PYmplY3QodHJhbnNmb3JtZWQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RyYW5zZm9ybSBtdXN0IHJldHVybiBvYmplY3QnKTtcbiAgICB9XG5cbiAgICBpZiAoaGFzT3duLmNhbGwodHJhbnNmb3JtZWQsICdfaWQnKSkge1xuICAgICAgaWYgKCFFSlNPTi5lcXVhbHModHJhbnNmb3JtZWQuX2lkLCBpZCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0cmFuc2Zvcm1lZCBkb2N1bWVudCBjYW5cXCd0IGhhdmUgZGlmZmVyZW50IF9pZCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0cmFuc2Zvcm1lZC5faWQgPSBpZDtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJhbnNmb3JtZWQ7XG4gIH07XG5cbiAgd3JhcHBlZC5fX3dyYXBwZWRUcmFuc2Zvcm1fXyA9IHRydWU7XG5cbiAgcmV0dXJuIHdyYXBwZWQ7XG59O1xuXG4vLyBYWFggdGhlIHNvcnRlZC1xdWVyeSBsb2dpYyBiZWxvdyBpcyBsYXVnaGFibHkgaW5lZmZpY2llbnQuIHdlJ2xsXG4vLyBuZWVkIHRvIGNvbWUgdXAgd2l0aCBhIGJldHRlciBkYXRhc3RydWN0dXJlIGZvciB0aGlzLlxuLy9cbi8vIFhYWCB0aGUgbG9naWMgZm9yIG9ic2VydmluZyB3aXRoIGEgc2tpcCBvciBhIGxpbWl0IGlzIGV2ZW4gbW9yZVxuLy8gbGF1Z2hhYmx5IGluZWZmaWNpZW50LiB3ZSByZWNvbXB1dGUgdGhlIHdob2xlIHJlc3VsdHMgZXZlcnkgdGltZSFcblxuLy8gVGhpcyBiaW5hcnkgc2VhcmNoIHB1dHMgYSB2YWx1ZSBiZXR3ZWVuIGFueSBlcXVhbCB2YWx1ZXMsIGFuZCB0aGUgZmlyc3Rcbi8vIGxlc3NlciB2YWx1ZS5cbkxvY2FsQ29sbGVjdGlvbi5fYmluYXJ5U2VhcmNoID0gKGNtcCwgYXJyYXksIHZhbHVlKSA9PiB7XG4gIGxldCBmaXJzdCA9IDA7XG4gIGxldCByYW5nZSA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAocmFuZ2UgPiAwKSB7XG4gICAgY29uc3QgaGFsZlJhbmdlID0gTWF0aC5mbG9vcihyYW5nZSAvIDIpO1xuXG4gICAgaWYgKGNtcCh2YWx1ZSwgYXJyYXlbZmlyc3QgKyBoYWxmUmFuZ2VdKSA+PSAwKSB7XG4gICAgICBmaXJzdCArPSBoYWxmUmFuZ2UgKyAxO1xuICAgICAgcmFuZ2UgLT0gaGFsZlJhbmdlICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmFuZ2UgPSBoYWxmUmFuZ2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZpcnN0O1xufTtcblxuTG9jYWxDb2xsZWN0aW9uLl9jaGVja1N1cHBvcnRlZFByb2plY3Rpb24gPSBmaWVsZHMgPT4ge1xuICBpZiAoZmllbGRzICE9PSBPYmplY3QoZmllbGRzKSB8fCBBcnJheS5pc0FycmF5KGZpZWxkcykpIHtcbiAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignZmllbGRzIG9wdGlvbiBtdXN0IGJlIGFuIG9iamVjdCcpO1xuICB9XG5cbiAgT2JqZWN0LmtleXMoZmllbGRzKS5mb3JFYWNoKGtleVBhdGggPT4ge1xuICAgIGlmIChrZXlQYXRoLnNwbGl0KCcuJykuaW5jbHVkZXMoJyQnKSkge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICdNaW5pbW9uZ28gZG9lc25cXCd0IHN1cHBvcnQgJCBvcGVyYXRvciBpbiBwcm9qZWN0aW9ucyB5ZXQuJ1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZSA9IGZpZWxkc1trZXlQYXRoXTtcblxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmXG4gICAgICAgIFsnJGVsZW1NYXRjaCcsICckbWV0YScsICckc2xpY2UnXS5zb21lKGtleSA9PlxuICAgICAgICAgIGhhc093bi5jYWxsKHZhbHVlLCBrZXkpXG4gICAgICAgICkpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICAnTWluaW1vbmdvIGRvZXNuXFwndCBzdXBwb3J0IG9wZXJhdG9ycyBpbiBwcm9qZWN0aW9ucyB5ZXQuJ1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoIVsxLCAwLCB0cnVlLCBmYWxzZV0uaW5jbHVkZXModmFsdWUpKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgJ1Byb2plY3Rpb24gdmFsdWVzIHNob3VsZCBiZSBvbmUgb2YgMSwgMCwgdHJ1ZSwgb3IgZmFsc2UnXG4gICAgICApO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vLyBLbm93cyBob3cgdG8gY29tcGlsZSBhIGZpZWxkcyBwcm9qZWN0aW9uIHRvIGEgcHJlZGljYXRlIGZ1bmN0aW9uLlxuLy8gQHJldHVybnMgLSBGdW5jdGlvbjogYSBjbG9zdXJlIHRoYXQgZmlsdGVycyBvdXQgYW4gb2JqZWN0IGFjY29yZGluZyB0byB0aGVcbi8vICAgICAgICAgICAgZmllbGRzIHByb2plY3Rpb24gcnVsZXM6XG4vLyAgICAgICAgICAgIEBwYXJhbSBvYmogLSBPYmplY3Q6IE1vbmdvREItc3R5bGVkIGRvY3VtZW50XG4vLyAgICAgICAgICAgIEByZXR1cm5zIC0gT2JqZWN0OiBhIGRvY3VtZW50IHdpdGggdGhlIGZpZWxkcyBmaWx0ZXJlZCBvdXRcbi8vICAgICAgICAgICAgICAgICAgICAgICBhY2NvcmRpbmcgdG8gcHJvamVjdGlvbiBydWxlcy4gRG9lc24ndCByZXRhaW4gc3ViZmllbGRzXG4vLyAgICAgICAgICAgICAgICAgICAgICAgb2YgcGFzc2VkIGFyZ3VtZW50LlxuTG9jYWxDb2xsZWN0aW9uLl9jb21waWxlUHJvamVjdGlvbiA9IGZpZWxkcyA9PiB7XG4gIExvY2FsQ29sbGVjdGlvbi5fY2hlY2tTdXBwb3J0ZWRQcm9qZWN0aW9uKGZpZWxkcyk7XG5cbiAgY29uc3QgX2lkUHJvamVjdGlvbiA9IGZpZWxkcy5faWQgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBmaWVsZHMuX2lkO1xuICBjb25zdCBkZXRhaWxzID0gcHJvamVjdGlvbkRldGFpbHMoZmllbGRzKTtcblxuICAvLyByZXR1cm5zIHRyYW5zZm9ybWVkIGRvYyBhY2NvcmRpbmcgdG8gcnVsZVRyZWVcbiAgY29uc3QgdHJhbnNmb3JtID0gKGRvYywgcnVsZVRyZWUpID0+IHtcbiAgICAvLyBTcGVjaWFsIGNhc2UgZm9yIFwic2V0c1wiXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZG9jKSkge1xuICAgICAgcmV0dXJuIGRvYy5tYXAoc3ViZG9jID0+IHRyYW5zZm9ybShzdWJkb2MsIHJ1bGVUcmVlKSk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gZGV0YWlscy5pbmNsdWRpbmcgPyB7fSA6IEVKU09OLmNsb25lKGRvYyk7XG5cbiAgICBPYmplY3Qua2V5cyhydWxlVHJlZSkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgaWYgKGRvYyA9PSBudWxsIHx8ICFoYXNPd24uY2FsbChkb2MsIGtleSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBydWxlID0gcnVsZVRyZWVba2V5XTtcblxuICAgICAgaWYgKHJ1bGUgPT09IE9iamVjdChydWxlKSkge1xuICAgICAgICAvLyBGb3Igc3ViLW9iamVjdHMvc3Vic2V0cyB3ZSBicmFuY2hcbiAgICAgICAgaWYgKGRvY1trZXldID09PSBPYmplY3QoZG9jW2tleV0pKSB7XG4gICAgICAgICAgcmVzdWx0W2tleV0gPSB0cmFuc2Zvcm0oZG9jW2tleV0sIHJ1bGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGRldGFpbHMuaW5jbHVkaW5nKSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSB3ZSBkb24ndCBldmVuIHRvdWNoIHRoaXMgc3ViZmllbGRcbiAgICAgICAgcmVzdWx0W2tleV0gPSBFSlNPTi5jbG9uZShkb2Nba2V5XSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWxldGUgcmVzdWx0W2tleV07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZG9jICE9IG51bGwgPyByZXN1bHQgOiBkb2M7XG4gIH07XG5cbiAgcmV0dXJuIGRvYyA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gdHJhbnNmb3JtKGRvYywgZGV0YWlscy50cmVlKTtcblxuICAgIGlmIChfaWRQcm9qZWN0aW9uICYmIGhhc093bi5jYWxsKGRvYywgJ19pZCcpKSB7XG4gICAgICByZXN1bHQuX2lkID0gZG9jLl9pZDtcbiAgICB9XG5cbiAgICBpZiAoIV9pZFByb2plY3Rpb24gJiYgaGFzT3duLmNhbGwocmVzdWx0LCAnX2lkJykpIHtcbiAgICAgIGRlbGV0ZSByZXN1bHQuX2lkO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59O1xuXG4vLyBDYWxjdWxhdGVzIHRoZSBkb2N1bWVudCB0byBpbnNlcnQgaW4gY2FzZSB3ZSdyZSBkb2luZyBhbiB1cHNlcnQgYW5kIHRoZVxuLy8gc2VsZWN0b3IgZG9lcyBub3QgbWF0Y2ggYW55IGVsZW1lbnRzXG5Mb2NhbENvbGxlY3Rpb24uX2NyZWF0ZVVwc2VydERvY3VtZW50ID0gKHNlbGVjdG9yLCBtb2RpZmllcikgPT4ge1xuICBjb25zdCBzZWxlY3RvckRvY3VtZW50ID0gcG9wdWxhdGVEb2N1bWVudFdpdGhRdWVyeUZpZWxkcyhzZWxlY3Rvcik7XG4gIGNvbnN0IGlzTW9kaWZ5ID0gTG9jYWxDb2xsZWN0aW9uLl9pc01vZGlmaWNhdGlvbk1vZChtb2RpZmllcik7XG5cbiAgY29uc3QgbmV3RG9jID0ge307XG5cbiAgaWYgKHNlbGVjdG9yRG9jdW1lbnQuX2lkKSB7XG4gICAgbmV3RG9jLl9pZCA9IHNlbGVjdG9yRG9jdW1lbnQuX2lkO1xuICAgIGRlbGV0ZSBzZWxlY3RvckRvY3VtZW50Ll9pZDtcbiAgfVxuXG4gIC8vIFRoaXMgZG91YmxlIF9tb2RpZnkgY2FsbCBpcyBtYWRlIHRvIGhlbHAgd2l0aCBuZXN0ZWQgcHJvcGVydGllcyAoc2VlIGlzc3VlXG4gIC8vICM4NjMxKS4gV2UgZG8gdGhpcyBldmVuIGlmIGl0J3MgYSByZXBsYWNlbWVudCBmb3IgdmFsaWRhdGlvbiBwdXJwb3NlcyAoZS5nLlxuICAvLyBhbWJpZ3VvdXMgaWQncylcbiAgTG9jYWxDb2xsZWN0aW9uLl9tb2RpZnkobmV3RG9jLCB7JHNldDogc2VsZWN0b3JEb2N1bWVudH0pO1xuICBMb2NhbENvbGxlY3Rpb24uX21vZGlmeShuZXdEb2MsIG1vZGlmaWVyLCB7aXNJbnNlcnQ6IHRydWV9KTtcblxuICBpZiAoaXNNb2RpZnkpIHtcbiAgICByZXR1cm4gbmV3RG9jO1xuICB9XG5cbiAgLy8gUmVwbGFjZW1lbnQgY2FuIHRha2UgX2lkIGZyb20gcXVlcnkgZG9jdW1lbnRcbiAgY29uc3QgcmVwbGFjZW1lbnQgPSBPYmplY3QuYXNzaWduKHt9LCBtb2RpZmllcik7XG4gIGlmIChuZXdEb2MuX2lkKSB7XG4gICAgcmVwbGFjZW1lbnQuX2lkID0gbmV3RG9jLl9pZDtcbiAgfVxuXG4gIHJldHVybiByZXBsYWNlbWVudDtcbn07XG5cbkxvY2FsQ29sbGVjdGlvbi5fZGlmZk9iamVjdHMgPSAobGVmdCwgcmlnaHQsIGNhbGxiYWNrcykgPT4ge1xuICByZXR1cm4gRGlmZlNlcXVlbmNlLmRpZmZPYmplY3RzKGxlZnQsIHJpZ2h0LCBjYWxsYmFja3MpO1xufTtcblxuLy8gb3JkZXJlZDogYm9vbC5cbi8vIG9sZF9yZXN1bHRzIGFuZCBuZXdfcmVzdWx0czogY29sbGVjdGlvbnMgb2YgZG9jdW1lbnRzLlxuLy8gICAgaWYgb3JkZXJlZCwgdGhleSBhcmUgYXJyYXlzLlxuLy8gICAgaWYgdW5vcmRlcmVkLCB0aGV5IGFyZSBJZE1hcHNcbkxvY2FsQ29sbGVjdGlvbi5fZGlmZlF1ZXJ5Q2hhbmdlcyA9IChvcmRlcmVkLCBvbGRSZXN1bHRzLCBuZXdSZXN1bHRzLCBvYnNlcnZlciwgb3B0aW9ucykgPT5cbiAgRGlmZlNlcXVlbmNlLmRpZmZRdWVyeUNoYW5nZXMob3JkZXJlZCwgb2xkUmVzdWx0cywgbmV3UmVzdWx0cywgb2JzZXJ2ZXIsIG9wdGlvbnMpXG47XG5cbkxvY2FsQ29sbGVjdGlvbi5fZGlmZlF1ZXJ5T3JkZXJlZENoYW5nZXMgPSAob2xkUmVzdWx0cywgbmV3UmVzdWx0cywgb2JzZXJ2ZXIsIG9wdGlvbnMpID0+XG4gIERpZmZTZXF1ZW5jZS5kaWZmUXVlcnlPcmRlcmVkQ2hhbmdlcyhvbGRSZXN1bHRzLCBuZXdSZXN1bHRzLCBvYnNlcnZlciwgb3B0aW9ucylcbjtcblxuTG9jYWxDb2xsZWN0aW9uLl9kaWZmUXVlcnlVbm9yZGVyZWRDaGFuZ2VzID0gKG9sZFJlc3VsdHMsIG5ld1Jlc3VsdHMsIG9ic2VydmVyLCBvcHRpb25zKSA9PlxuICBEaWZmU2VxdWVuY2UuZGlmZlF1ZXJ5VW5vcmRlcmVkQ2hhbmdlcyhvbGRSZXN1bHRzLCBuZXdSZXN1bHRzLCBvYnNlcnZlciwgb3B0aW9ucylcbjtcblxuTG9jYWxDb2xsZWN0aW9uLl9maW5kSW5PcmRlcmVkUmVzdWx0cyA9IChxdWVyeSwgZG9jKSA9PiB7XG4gIGlmICghcXVlcnkub3JkZXJlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2FuXFwndCBjYWxsIF9maW5kSW5PcmRlcmVkUmVzdWx0cyBvbiB1bm9yZGVyZWQgcXVlcnknKTtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcXVlcnkucmVzdWx0cy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChxdWVyeS5yZXN1bHRzW2ldID09PSBkb2MpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuXG4gIHRocm93IEVycm9yKCdvYmplY3QgbWlzc2luZyBmcm9tIHF1ZXJ5Jyk7XG59O1xuXG4vLyBJZiB0aGlzIGlzIGEgc2VsZWN0b3Igd2hpY2ggZXhwbGljaXRseSBjb25zdHJhaW5zIHRoZSBtYXRjaCBieSBJRCB0byBhIGZpbml0ZVxuLy8gbnVtYmVyIG9mIGRvY3VtZW50cywgcmV0dXJucyBhIGxpc3Qgb2YgdGhlaXIgSURzLiAgT3RoZXJ3aXNlIHJldHVybnNcbi8vIG51bGwuIE5vdGUgdGhhdCB0aGUgc2VsZWN0b3IgbWF5IGhhdmUgb3RoZXIgcmVzdHJpY3Rpb25zIHNvIGl0IG1heSBub3QgZXZlblxuLy8gbWF0Y2ggdGhvc2UgZG9jdW1lbnQhICBXZSBjYXJlIGFib3V0ICRpbiBhbmQgJGFuZCBzaW5jZSB0aG9zZSBhcmUgZ2VuZXJhdGVkXG4vLyBhY2Nlc3MtY29udHJvbGxlZCB1cGRhdGUgYW5kIHJlbW92ZS5cbkxvY2FsQ29sbGVjdGlvbi5faWRzTWF0Y2hlZEJ5U2VsZWN0b3IgPSBzZWxlY3RvciA9PiB7XG4gIC8vIElzIHRoZSBzZWxlY3RvciBqdXN0IGFuIElEP1xuICBpZiAoTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWQoc2VsZWN0b3IpKSB7XG4gICAgcmV0dXJuIFtzZWxlY3Rvcl07XG4gIH1cblxuICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBEbyB3ZSBoYXZlIGFuIF9pZCBjbGF1c2U/XG4gIGlmIChoYXNPd24uY2FsbChzZWxlY3RvciwgJ19pZCcpKSB7XG4gICAgLy8gSXMgdGhlIF9pZCBjbGF1c2UganVzdCBhbiBJRD9cbiAgICBpZiAoTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWQoc2VsZWN0b3IuX2lkKSkge1xuICAgICAgcmV0dXJuIFtzZWxlY3Rvci5faWRdO1xuICAgIH1cblxuICAgIC8vIElzIHRoZSBfaWQgY2xhdXNlIHtfaWQ6IHskaW46IFtcInhcIiwgXCJ5XCIsIFwielwiXX19P1xuICAgIGlmIChzZWxlY3Rvci5faWRcbiAgICAgICAgJiYgQXJyYXkuaXNBcnJheShzZWxlY3Rvci5faWQuJGluKVxuICAgICAgICAmJiBzZWxlY3Rvci5faWQuJGluLmxlbmd0aFxuICAgICAgICAmJiBzZWxlY3Rvci5faWQuJGluLmV2ZXJ5KExvY2FsQ29sbGVjdGlvbi5fc2VsZWN0b3JJc0lkKSkge1xuICAgICAgcmV0dXJuIHNlbGVjdG9yLl9pZC4kaW47XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBJZiB0aGlzIGlzIGEgdG9wLWxldmVsICRhbmQsIGFuZCBhbnkgb2YgdGhlIGNsYXVzZXMgY29uc3RyYWluIHRoZWlyXG4gIC8vIGRvY3VtZW50cywgdGhlbiB0aGUgd2hvbGUgc2VsZWN0b3IgaXMgY29uc3RyYWluZWQgYnkgYW55IG9uZSBjbGF1c2Unc1xuICAvLyBjb25zdHJhaW50LiAoV2VsbCwgYnkgdGhlaXIgaW50ZXJzZWN0aW9uLCBidXQgdGhhdCBzZWVtcyB1bmxpa2VseS4pXG4gIGlmIChBcnJheS5pc0FycmF5KHNlbGVjdG9yLiRhbmQpKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci4kYW5kLmxlbmd0aDsgKytpKSB7XG4gICAgICBjb25zdCBzdWJJZHMgPSBMb2NhbENvbGxlY3Rpb24uX2lkc01hdGNoZWRCeVNlbGVjdG9yKHNlbGVjdG9yLiRhbmRbaV0pO1xuXG4gICAgICBpZiAoc3ViSWRzKSB7XG4gICAgICAgIHJldHVybiBzdWJJZHM7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5Mb2NhbENvbGxlY3Rpb24uX2luc2VydEluUmVzdWx0c1N5bmMgPSAocXVlcnksIGRvYykgPT4ge1xuICBjb25zdCBmaWVsZHMgPSBFSlNPTi5jbG9uZShkb2MpO1xuXG4gIGRlbGV0ZSBmaWVsZHMuX2lkO1xuXG4gIGlmIChxdWVyeS5vcmRlcmVkKSB7XG4gICAgaWYgKCFxdWVyeS5zb3J0ZXIpIHtcbiAgICAgIHF1ZXJ5LmFkZGVkQmVmb3JlKGRvYy5faWQsIHF1ZXJ5LnByb2plY3Rpb25GbihmaWVsZHMpLCBudWxsKTtcbiAgICAgIHF1ZXJ5LnJlc3VsdHMucHVzaChkb2MpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpID0gTG9jYWxDb2xsZWN0aW9uLl9pbnNlcnRJblNvcnRlZExpc3QoXG4gICAgICAgIHF1ZXJ5LnNvcnRlci5nZXRDb21wYXJhdG9yKHtkaXN0YW5jZXM6IHF1ZXJ5LmRpc3RhbmNlc30pLFxuICAgICAgICBxdWVyeS5yZXN1bHRzLFxuICAgICAgICBkb2NcbiAgICAgICk7XG5cbiAgICAgIGxldCBuZXh0ID0gcXVlcnkucmVzdWx0c1tpICsgMV07XG4gICAgICBpZiAobmV4dCkge1xuICAgICAgICBuZXh0ID0gbmV4dC5faWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXh0ID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgcXVlcnkuYWRkZWRCZWZvcmUoZG9jLl9pZCwgcXVlcnkucHJvamVjdGlvbkZuKGZpZWxkcyksIG5leHQpO1xuICAgIH1cblxuICAgIHF1ZXJ5LmFkZGVkKGRvYy5faWQsIHF1ZXJ5LnByb2plY3Rpb25GbihmaWVsZHMpKTtcbiAgfSBlbHNlIHtcbiAgICBxdWVyeS5hZGRlZChkb2MuX2lkLCBxdWVyeS5wcm9qZWN0aW9uRm4oZmllbGRzKSk7XG4gICAgcXVlcnkucmVzdWx0cy5zZXQoZG9jLl9pZCwgZG9jKTtcbiAgfVxufTtcblxuTG9jYWxDb2xsZWN0aW9uLl9pbnNlcnRJblJlc3VsdHNBc3luYyA9IGFzeW5jIChxdWVyeSwgZG9jKSA9PiB7XG4gIGNvbnN0IGZpZWxkcyA9IEVKU09OLmNsb25lKGRvYyk7XG5cbiAgZGVsZXRlIGZpZWxkcy5faWQ7XG5cbiAgaWYgKHF1ZXJ5Lm9yZGVyZWQpIHtcbiAgICBpZiAoIXF1ZXJ5LnNvcnRlcikge1xuICAgICAgYXdhaXQgcXVlcnkuYWRkZWRCZWZvcmUoZG9jLl9pZCwgcXVlcnkucHJvamVjdGlvbkZuKGZpZWxkcyksIG51bGwpO1xuICAgICAgcXVlcnkucmVzdWx0cy5wdXNoKGRvYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGkgPSBMb2NhbENvbGxlY3Rpb24uX2luc2VydEluU29ydGVkTGlzdChcbiAgICAgICAgcXVlcnkuc29ydGVyLmdldENvbXBhcmF0b3Ioe2Rpc3RhbmNlczogcXVlcnkuZGlzdGFuY2VzfSksXG4gICAgICAgIHF1ZXJ5LnJlc3VsdHMsXG4gICAgICAgIGRvY1xuICAgICAgKTtcblxuICAgICAgbGV0IG5leHQgPSBxdWVyeS5yZXN1bHRzW2kgKyAxXTtcbiAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgIG5leHQgPSBuZXh0Ll9pZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHQgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBxdWVyeS5hZGRlZEJlZm9yZShkb2MuX2lkLCBxdWVyeS5wcm9qZWN0aW9uRm4oZmllbGRzKSwgbmV4dCk7XG4gICAgfVxuXG4gICAgYXdhaXQgcXVlcnkuYWRkZWQoZG9jLl9pZCwgcXVlcnkucHJvamVjdGlvbkZuKGZpZWxkcykpO1xuICB9IGVsc2Uge1xuICAgIGF3YWl0IHF1ZXJ5LmFkZGVkKGRvYy5faWQsIHF1ZXJ5LnByb2plY3Rpb25GbihmaWVsZHMpKTtcbiAgICBxdWVyeS5yZXN1bHRzLnNldChkb2MuX2lkLCBkb2MpO1xuICB9XG59O1xuXG5Mb2NhbENvbGxlY3Rpb24uX2luc2VydEluU29ydGVkTGlzdCA9IChjbXAsIGFycmF5LCB2YWx1ZSkgPT4ge1xuICBpZiAoYXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgYXJyYXkucHVzaCh2YWx1ZSk7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBjb25zdCBpID0gTG9jYWxDb2xsZWN0aW9uLl9iaW5hcnlTZWFyY2goY21wLCBhcnJheSwgdmFsdWUpO1xuXG4gIGFycmF5LnNwbGljZShpLCAwLCB2YWx1ZSk7XG5cbiAgcmV0dXJuIGk7XG59O1xuXG5Mb2NhbENvbGxlY3Rpb24uX2lzTW9kaWZpY2F0aW9uTW9kID0gbW9kID0+IHtcbiAgbGV0IGlzTW9kaWZ5ID0gZmFsc2U7XG4gIGxldCBpc1JlcGxhY2UgPSBmYWxzZTtcblxuICBPYmplY3Qua2V5cyhtb2QpLmZvckVhY2goa2V5ID0+IHtcbiAgICBpZiAoa2V5LnN1YnN0cigwLCAxKSA9PT0gJyQnKSB7XG4gICAgICBpc01vZGlmeSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlzUmVwbGFjZSA9IHRydWU7XG4gICAgfVxuICB9KTtcblxuICBpZiAoaXNNb2RpZnkgJiYgaXNSZXBsYWNlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ1VwZGF0ZSBwYXJhbWV0ZXIgY2Fubm90IGhhdmUgYm90aCBtb2RpZmllciBhbmQgbm9uLW1vZGlmaWVyIGZpZWxkcy4nXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBpc01vZGlmeTtcbn07XG5cbi8vIFhYWCBtYXliZSB0aGlzIHNob3VsZCBiZSBFSlNPTi5pc09iamVjdCwgdGhvdWdoIEVKU09OIGRvZXNuJ3Qga25vdyBhYm91dFxuLy8gUmVnRXhwXG4vLyBYWFggbm90ZSB0aGF0IF90eXBlKHVuZGVmaW5lZCkgPT09IDMhISEhXG5Mb2NhbENvbGxlY3Rpb24uX2lzUGxhaW5PYmplY3QgPSB4ID0+IHtcbiAgcmV0dXJuIHggJiYgTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKHgpID09PSAzO1xufTtcblxuLy8gWFhYIG5lZWQgYSBzdHJhdGVneSBmb3IgcGFzc2luZyB0aGUgYmluZGluZyBvZiAkIGludG8gdGhpc1xuLy8gZnVuY3Rpb24sIGZyb20gdGhlIGNvbXBpbGVkIHNlbGVjdG9yXG4vL1xuLy8gbWF5YmUganVzdCB7a2V5LnVwLnRvLmp1c3QuYmVmb3JlLmRvbGxhcnNpZ246IGFycmF5X2luZGV4fVxuLy9cbi8vIFhYWCBhdG9taWNpdHk6IGlmIG9uZSBtb2RpZmljYXRpb24gZmFpbHMsIGRvIHdlIHJvbGwgYmFjayB0aGUgd2hvbGVcbi8vIGNoYW5nZT9cbi8vXG4vLyBvcHRpb25zOlxuLy8gICAtIGlzSW5zZXJ0IGlzIHNldCB3aGVuIF9tb2RpZnkgaXMgYmVpbmcgY2FsbGVkIHRvIGNvbXB1dGUgdGhlIGRvY3VtZW50IHRvXG4vLyAgICAgaW5zZXJ0IGFzIHBhcnQgb2YgYW4gdXBzZXJ0IG9wZXJhdGlvbi4gV2UgdXNlIHRoaXMgcHJpbWFyaWx5IHRvIGZpZ3VyZVxuLy8gICAgIG91dCB3aGVuIHRvIHNldCB0aGUgZmllbGRzIGluICRzZXRPbkluc2VydCwgaWYgcHJlc2VudC5cbkxvY2FsQ29sbGVjdGlvbi5fbW9kaWZ5ID0gKGRvYywgbW9kaWZpZXIsIG9wdGlvbnMgPSB7fSkgPT4ge1xuICBpZiAoIUxvY2FsQ29sbGVjdGlvbi5faXNQbGFpbk9iamVjdChtb2RpZmllcikpIHtcbiAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignTW9kaWZpZXIgbXVzdCBiZSBhbiBvYmplY3QnKTtcbiAgfVxuXG4gIC8vIE1ha2Ugc3VyZSB0aGUgY2FsbGVyIGNhbid0IG11dGF0ZSBvdXIgZGF0YSBzdHJ1Y3R1cmVzLlxuICBtb2RpZmllciA9IEVKU09OLmNsb25lKG1vZGlmaWVyKTtcblxuICBjb25zdCBpc01vZGlmaWVyID0gaXNPcGVyYXRvck9iamVjdChtb2RpZmllcik7XG4gIGNvbnN0IG5ld0RvYyA9IGlzTW9kaWZpZXIgPyBFSlNPTi5jbG9uZShkb2MpIDogbW9kaWZpZXI7XG5cbiAgaWYgKGlzTW9kaWZpZXIpIHtcbiAgICAvLyBhcHBseSBtb2RpZmllcnMgdG8gdGhlIGRvYy5cbiAgICBPYmplY3Qua2V5cyhtb2RpZmllcikuZm9yRWFjaChvcGVyYXRvciA9PiB7XG4gICAgICAvLyBUcmVhdCAkc2V0T25JbnNlcnQgYXMgJHNldCBpZiB0aGlzIGlzIGFuIGluc2VydC5cbiAgICAgIGNvbnN0IHNldE9uSW5zZXJ0ID0gb3B0aW9ucy5pc0luc2VydCAmJiBvcGVyYXRvciA9PT0gJyRzZXRPbkluc2VydCc7XG4gICAgICBjb25zdCBtb2RGdW5jID0gTU9ESUZJRVJTW3NldE9uSW5zZXJ0ID8gJyRzZXQnIDogb3BlcmF0b3JdO1xuICAgICAgY29uc3Qgb3BlcmFuZCA9IG1vZGlmaWVyW29wZXJhdG9yXTtcblxuICAgICAgaWYgKCFtb2RGdW5jKSB7XG4gICAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKGBJbnZhbGlkIG1vZGlmaWVyIHNwZWNpZmllZCAke29wZXJhdG9yfWApO1xuICAgICAgfVxuXG4gICAgICBPYmplY3Qua2V5cyhvcGVyYW5kKS5mb3JFYWNoKGtleXBhdGggPT4ge1xuICAgICAgICBjb25zdCBhcmcgPSBvcGVyYW5kW2tleXBhdGhdO1xuXG4gICAgICAgIGlmIChrZXlwYXRoID09PSAnJykge1xuICAgICAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCdBbiBlbXB0eSB1cGRhdGUgcGF0aCBpcyBub3QgdmFsaWQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBrZXlwYXJ0cyA9IGtleXBhdGguc3BsaXQoJy4nKTtcblxuICAgICAgICBpZiAoIWtleXBhcnRzLmV2ZXJ5KEJvb2xlYW4pKSB7XG4gICAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICAgICBgVGhlIHVwZGF0ZSBwYXRoICcke2tleXBhdGh9JyBjb250YWlucyBhbiBlbXB0eSBmaWVsZCBuYW1lLCBgICtcbiAgICAgICAgICAgICd3aGljaCBpcyBub3QgYWxsb3dlZC4nXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGZpbmRNb2RUYXJnZXQobmV3RG9jLCBrZXlwYXJ0cywge1xuICAgICAgICAgIGFycmF5SW5kaWNlczogb3B0aW9ucy5hcnJheUluZGljZXMsXG4gICAgICAgICAgZm9yYmlkQXJyYXk6IG9wZXJhdG9yID09PSAnJHJlbmFtZScsXG4gICAgICAgICAgbm9DcmVhdGU6IE5PX0NSRUFURV9NT0RJRklFUlNbb3BlcmF0b3JdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZEZ1bmModGFyZ2V0LCBrZXlwYXJ0cy5wb3AoKSwgYXJnLCBrZXlwYXRoLCBuZXdEb2MpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpZiAoZG9jLl9pZCAmJiAhRUpTT04uZXF1YWxzKGRvYy5faWQsIG5ld0RvYy5faWQpKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgYEFmdGVyIGFwcGx5aW5nIHRoZSB1cGRhdGUgdG8gdGhlIGRvY3VtZW50IHtfaWQ6IFwiJHtkb2MuX2lkfVwiLCAuLi59LGAgK1xuICAgICAgICAnIHRoZSAoaW1tdXRhYmxlKSBmaWVsZCBcXCdfaWRcXCcgd2FzIGZvdW5kIHRvIGhhdmUgYmVlbiBhbHRlcmVkIHRvICcgK1xuICAgICAgICBgX2lkOiBcIiR7bmV3RG9jLl9pZH1cImBcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkb2MuX2lkICYmIG1vZGlmaWVyLl9pZCAmJiAhRUpTT04uZXF1YWxzKGRvYy5faWQsIG1vZGlmaWVyLl9pZCkpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICBgVGhlIF9pZCBmaWVsZCBjYW5ub3QgYmUgY2hhbmdlZCBmcm9tIHtfaWQ6IFwiJHtkb2MuX2lkfVwifSB0byBgICtcbiAgICAgICAgYHtfaWQ6IFwiJHttb2RpZmllci5faWR9XCJ9YFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyByZXBsYWNlIHRoZSB3aG9sZSBkb2N1bWVudFxuICAgIGFzc2VydEhhc1ZhbGlkRmllbGROYW1lcyhtb2RpZmllcik7XG4gIH1cblxuICAvLyBtb3ZlIG5ldyBkb2N1bWVudCBpbnRvIHBsYWNlLlxuICBPYmplY3Qua2V5cyhkb2MpLmZvckVhY2goa2V5ID0+IHtcbiAgICAvLyBOb3RlOiB0aGlzIHVzZWQgdG8gYmUgZm9yICh2YXIga2V5IGluIGRvYykgaG93ZXZlciwgdGhpcyBkb2VzIG5vdFxuICAgIC8vIHdvcmsgcmlnaHQgaW4gT3BlcmEuIERlbGV0aW5nIGZyb20gYSBkb2Mgd2hpbGUgaXRlcmF0aW5nIG92ZXIgaXRcbiAgICAvLyB3b3VsZCBzb21ldGltZXMgY2F1c2Ugb3BlcmEgdG8gc2tpcCBzb21lIGtleXMuXG4gICAgaWYgKGtleSAhPT0gJ19pZCcpIHtcbiAgICAgIGRlbGV0ZSBkb2Nba2V5XTtcbiAgICB9XG4gIH0pO1xuXG4gIE9iamVjdC5rZXlzKG5ld0RvYykuZm9yRWFjaChrZXkgPT4ge1xuICAgIGRvY1trZXldID0gbmV3RG9jW2tleV07XG4gIH0pO1xufTtcblxuTG9jYWxDb2xsZWN0aW9uLl9vYnNlcnZlRnJvbU9ic2VydmVDaGFuZ2VzID0gKGN1cnNvciwgb2JzZXJ2ZUNhbGxiYWNrcykgPT4ge1xuICBjb25zdCB0cmFuc2Zvcm0gPSBjdXJzb3IuZ2V0VHJhbnNmb3JtKCkgfHwgKGRvYyA9PiBkb2MpO1xuICBsZXQgc3VwcHJlc3NlZCA9ICEhb2JzZXJ2ZUNhbGxiYWNrcy5fc3VwcHJlc3NfaW5pdGlhbDtcblxuICBsZXQgb2JzZXJ2ZUNoYW5nZXNDYWxsYmFja3M7XG4gIGlmIChMb2NhbENvbGxlY3Rpb24uX29ic2VydmVDYWxsYmFja3NBcmVPcmRlcmVkKG9ic2VydmVDYWxsYmFja3MpKSB7XG4gICAgLy8gVGhlIFwiX25vX2luZGljZXNcIiBvcHRpb24gc2V0cyBhbGwgaW5kZXggYXJndW1lbnRzIHRvIC0xIGFuZCBza2lwcyB0aGVcbiAgICAvLyBsaW5lYXIgc2NhbnMgcmVxdWlyZWQgdG8gZ2VuZXJhdGUgdGhlbS4gIFRoaXMgbGV0cyBvYnNlcnZlcnMgdGhhdCBkb24ndFxuICAgIC8vIG5lZWQgYWJzb2x1dGUgaW5kaWNlcyBiZW5lZml0IGZyb20gdGhlIG90aGVyIGZlYXR1cmVzIG9mIHRoaXMgQVBJIC0tXG4gICAgLy8gcmVsYXRpdmUgb3JkZXIsIHRyYW5zZm9ybXMsIGFuZCBhcHBseUNoYW5nZXMgLS0gd2l0aG91dCB0aGUgc3BlZWQgaGl0LlxuICAgIGNvbnN0IGluZGljZXMgPSAhb2JzZXJ2ZUNhbGxiYWNrcy5fbm9faW5kaWNlcztcblxuICAgIG9ic2VydmVDaGFuZ2VzQ2FsbGJhY2tzID0ge1xuICAgICAgYWRkZWRCZWZvcmUoaWQsIGZpZWxkcywgYmVmb3JlKSB7XG4gICAgICAgIGNvbnN0IGNoZWNrID0gc3VwcHJlc3NlZCB8fCAhKG9ic2VydmVDYWxsYmFja3MuYWRkZWRBdCB8fCBvYnNlcnZlQ2FsbGJhY2tzLmFkZGVkKVxuICAgICAgICBpZiAoY2hlY2spIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2MgPSB0cmFuc2Zvcm0oT2JqZWN0LmFzc2lnbihmaWVsZHMsIHtfaWQ6IGlkfSkpO1xuXG4gICAgICAgIGlmIChvYnNlcnZlQ2FsbGJhY2tzLmFkZGVkQXQpIHtcbiAgICAgICAgICBvYnNlcnZlQ2FsbGJhY2tzLmFkZGVkQXQoXG4gICAgICAgICAgICAgIGRvYyxcbiAgICAgICAgICAgICAgaW5kaWNlc1xuICAgICAgICAgICAgICAgICAgPyBiZWZvcmVcbiAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuZG9jcy5pbmRleE9mKGJlZm9yZSlcbiAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuZG9jcy5zaXplKClcbiAgICAgICAgICAgICAgICAgIDogLTEsXG4gICAgICAgICAgICAgIGJlZm9yZVxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb2JzZXJ2ZUNhbGxiYWNrcy5hZGRlZChkb2MpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgY2hhbmdlZChpZCwgZmllbGRzKSB7XG5cbiAgICAgICAgaWYgKCEob2JzZXJ2ZUNhbGxiYWNrcy5jaGFuZ2VkQXQgfHwgb2JzZXJ2ZUNhbGxiYWNrcy5jaGFuZ2VkKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkb2MgPSBFSlNPTi5jbG9uZSh0aGlzLmRvY3MuZ2V0KGlkKSk7XG4gICAgICAgIGlmICghZG9jKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGlkIGZvciBjaGFuZ2VkOiAke2lkfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb2xkRG9jID0gdHJhbnNmb3JtKEVKU09OLmNsb25lKGRvYykpO1xuXG4gICAgICAgIERpZmZTZXF1ZW5jZS5hcHBseUNoYW5nZXMoZG9jLCBmaWVsZHMpO1xuXG4gICAgICAgIGlmIChvYnNlcnZlQ2FsbGJhY2tzLmNoYW5nZWRBdCkge1xuICAgICAgICAgIG9ic2VydmVDYWxsYmFja3MuY2hhbmdlZEF0KFxuICAgICAgICAgICAgICB0cmFuc2Zvcm0oZG9jKSxcbiAgICAgICAgICAgICAgb2xkRG9jLFxuICAgICAgICAgICAgICBpbmRpY2VzID8gdGhpcy5kb2NzLmluZGV4T2YoaWQpIDogLTFcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9ic2VydmVDYWxsYmFja3MuY2hhbmdlZCh0cmFuc2Zvcm0oZG9jKSwgb2xkRG9jKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG1vdmVkQmVmb3JlKGlkLCBiZWZvcmUpIHtcbiAgICAgICAgaWYgKCFvYnNlcnZlQ2FsbGJhY2tzLm1vdmVkVG8pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmcm9tID0gaW5kaWNlcyA/IHRoaXMuZG9jcy5pbmRleE9mKGlkKSA6IC0xO1xuICAgICAgICBsZXQgdG8gPSBpbmRpY2VzXG4gICAgICAgICAgICA/IGJlZm9yZVxuICAgICAgICAgICAgICAgID8gdGhpcy5kb2NzLmluZGV4T2YoYmVmb3JlKVxuICAgICAgICAgICAgICAgIDogdGhpcy5kb2NzLnNpemUoKVxuICAgICAgICAgICAgOiAtMTtcblxuICAgICAgICAvLyBXaGVuIG5vdCBtb3ZpbmcgYmFja3dhcmRzLCBhZGp1c3QgZm9yIHRoZSBmYWN0IHRoYXQgcmVtb3ZpbmcgdGhlXG4gICAgICAgIC8vIGRvY3VtZW50IHNsaWRlcyBldmVyeXRoaW5nIGJhY2sgb25lIHNsb3QuXG4gICAgICAgIGlmICh0byA+IGZyb20pIHtcbiAgICAgICAgICAtLXRvO1xuICAgICAgICB9XG5cbiAgICAgICAgb2JzZXJ2ZUNhbGxiYWNrcy5tb3ZlZFRvKFxuICAgICAgICAgICAgdHJhbnNmb3JtKEVKU09OLmNsb25lKHRoaXMuZG9jcy5nZXQoaWQpKSksXG4gICAgICAgICAgICBmcm9tLFxuICAgICAgICAgICAgdG8sXG4gICAgICAgICAgICBiZWZvcmUgfHwgbnVsbFxuICAgICAgICApO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZWQoaWQpIHtcbiAgICAgICAgaWYgKCEob2JzZXJ2ZUNhbGxiYWNrcy5yZW1vdmVkQXQgfHwgb2JzZXJ2ZUNhbGxiYWNrcy5yZW1vdmVkKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRlY2huaWNhbGx5IG1heWJlIHRoZXJlIHNob3VsZCBiZSBhbiBFSlNPTi5jbG9uZSBoZXJlLCBidXQgaXQncyBhYm91dFxuICAgICAgICAvLyB0byBiZSByZW1vdmVkIGZyb20gdGhpcy5kb2NzIVxuICAgICAgICBjb25zdCBkb2MgPSB0cmFuc2Zvcm0odGhpcy5kb2NzLmdldChpZCkpO1xuXG4gICAgICAgIGlmIChvYnNlcnZlQ2FsbGJhY2tzLnJlbW92ZWRBdCkge1xuICAgICAgICAgIG9ic2VydmVDYWxsYmFja3MucmVtb3ZlZEF0KGRvYywgaW5kaWNlcyA/IHRoaXMuZG9jcy5pbmRleE9mKGlkKSA6IC0xKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvYnNlcnZlQ2FsbGJhY2tzLnJlbW92ZWQoZG9jKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIG9ic2VydmVDaGFuZ2VzQ2FsbGJhY2tzID0ge1xuICAgICAgYWRkZWQoaWQsIGZpZWxkcykge1xuICAgICAgICBpZiAoIXN1cHByZXNzZWQgJiYgb2JzZXJ2ZUNhbGxiYWNrcy5hZGRlZCkge1xuICAgICAgICAgIG9ic2VydmVDYWxsYmFja3MuYWRkZWQodHJhbnNmb3JtKE9iamVjdC5hc3NpZ24oZmllbGRzLCB7X2lkOiBpZH0pKSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcbiAgICAgICAgaWYgKG9ic2VydmVDYWxsYmFja3MuY2hhbmdlZCkge1xuICAgICAgICAgIGNvbnN0IG9sZERvYyA9IHRoaXMuZG9jcy5nZXQoaWQpO1xuICAgICAgICAgIGNvbnN0IGRvYyA9IEVKU09OLmNsb25lKG9sZERvYyk7XG5cbiAgICAgICAgICBEaWZmU2VxdWVuY2UuYXBwbHlDaGFuZ2VzKGRvYywgZmllbGRzKTtcblxuICAgICAgICAgIG9ic2VydmVDYWxsYmFja3MuY2hhbmdlZChcbiAgICAgICAgICAgICAgdHJhbnNmb3JtKGRvYyksXG4gICAgICAgICAgICAgIHRyYW5zZm9ybShFSlNPTi5jbG9uZShvbGREb2MpKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByZW1vdmVkKGlkKSB7XG4gICAgICAgIGlmIChvYnNlcnZlQ2FsbGJhY2tzLnJlbW92ZWQpIHtcbiAgICAgICAgICBvYnNlcnZlQ2FsbGJhY2tzLnJlbW92ZWQodHJhbnNmb3JtKHRoaXMuZG9jcy5nZXQoaWQpKSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGNoYW5nZU9ic2VydmVyID0gbmV3IExvY2FsQ29sbGVjdGlvbi5fQ2FjaGluZ0NoYW5nZU9ic2VydmVyKHtcbiAgICBjYWxsYmFja3M6IG9ic2VydmVDaGFuZ2VzQ2FsbGJhY2tzXG4gIH0pO1xuXG4gIC8vIENhY2hpbmdDaGFuZ2VPYnNlcnZlciBjbG9uZXMgYWxsIHJlY2VpdmVkIGlucHV0IG9uIGl0cyBjYWxsYmFja3NcbiAgLy8gU28gd2UgY2FuIG1hcmsgaXQgYXMgc2FmZSB0byByZWR1Y2UgdGhlIGVqc29uIGNsb25lcy5cbiAgLy8gVGhpcyBpcyB0ZXN0ZWQgYnkgdGhlIGBtb25nby1saXZlZGF0YSAtIChleHRlbmRlZCkgc2NyaWJibGluZ2AgdGVzdHNcbiAgY2hhbmdlT2JzZXJ2ZXIuYXBwbHlDaGFuZ2UuX2Zyb21PYnNlcnZlID0gdHJ1ZTtcbiAgY29uc3QgaGFuZGxlID0gY3Vyc29yLm9ic2VydmVDaGFuZ2VzKGNoYW5nZU9ic2VydmVyLmFwcGx5Q2hhbmdlLFxuICAgICAgeyBub25NdXRhdGluZ0NhbGxiYWNrczogdHJ1ZSB9KTtcblxuICAvLyBJZiBuZWVkZWQsIHJlLWVuYWJsZSBjYWxsYmFja3MgYXMgc29vbiBhcyB0aGUgaW5pdGlhbCBiYXRjaCBpcyByZWFkeS5cbiAgY29uc3Qgc2V0U3VwcHJlc3NlZCA9IChoKSA9PiB7XG4gICAgaWYgKGguaXNSZWFkeSkgc3VwcHJlc3NlZCA9IGZhbHNlO1xuICAgIGVsc2UgaC5pc1JlYWR5UHJvbWlzZT8udGhlbigoKSA9PiAoc3VwcHJlc3NlZCA9IGZhbHNlKSk7XG4gIH07XG4gIC8vIFdoZW4gd2UgY2FsbCBjdXJzb3Iub2JzZXJ2ZUNoYW5nZXMoKSBpdCBjYW4gYmUgdGhlIG9uIGZyb21cbiAgLy8gdGhlIG1vbmdvIHBhY2thZ2UgKGluc3RlYWQgb2YgdGhlIG1pbmltb25nbyBvbmUpIGFuZCBpdCBkb2Vzbid0IGhhdmUgaXNSZWFkeSBhbmQgaXNSZWFkeVByb21pc2VcbiAgaWYgKE1ldGVvci5faXNQcm9taXNlKGhhbmRsZSkpIHtcbiAgICBoYW5kbGUudGhlbihzZXRTdXBwcmVzc2VkKTtcbiAgfSBlbHNlIHtcbiAgICBzZXRTdXBwcmVzc2VkKGhhbmRsZSk7XG4gIH1cbiAgcmV0dXJuIGhhbmRsZTtcbn07XG5cbkxvY2FsQ29sbGVjdGlvbi5fb2JzZXJ2ZUNhbGxiYWNrc0FyZU9yZGVyZWQgPSBjYWxsYmFja3MgPT4ge1xuICBpZiAoY2FsbGJhY2tzLmFkZGVkICYmIGNhbGxiYWNrcy5hZGRlZEF0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2Ugc3BlY2lmeSBvbmx5IG9uZSBvZiBhZGRlZCgpIGFuZCBhZGRlZEF0KCknKTtcbiAgfVxuXG4gIGlmIChjYWxsYmFja3MuY2hhbmdlZCAmJiBjYWxsYmFja3MuY2hhbmdlZEF0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2Ugc3BlY2lmeSBvbmx5IG9uZSBvZiBjaGFuZ2VkKCkgYW5kIGNoYW5nZWRBdCgpJyk7XG4gIH1cblxuICBpZiAoY2FsbGJhY2tzLnJlbW92ZWQgJiYgY2FsbGJhY2tzLnJlbW92ZWRBdCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgb25seSBvbmUgb2YgcmVtb3ZlZCgpIGFuZCByZW1vdmVkQXQoKScpO1xuICB9XG5cbiAgcmV0dXJuICEhKFxuICAgIGNhbGxiYWNrcy5hZGRlZEF0IHx8XG4gICAgY2FsbGJhY2tzLmNoYW5nZWRBdCB8fFxuICAgIGNhbGxiYWNrcy5tb3ZlZFRvIHx8XG4gICAgY2FsbGJhY2tzLnJlbW92ZWRBdFxuICApO1xufTtcblxuTG9jYWxDb2xsZWN0aW9uLl9vYnNlcnZlQ2hhbmdlc0NhbGxiYWNrc0FyZU9yZGVyZWQgPSBjYWxsYmFja3MgPT4ge1xuICBpZiAoY2FsbGJhY2tzLmFkZGVkICYmIGNhbGxiYWNrcy5hZGRlZEJlZm9yZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgb25seSBvbmUgb2YgYWRkZWQoKSBhbmQgYWRkZWRCZWZvcmUoKScpO1xuICB9XG5cbiAgcmV0dXJuICEhKGNhbGxiYWNrcy5hZGRlZEJlZm9yZSB8fCBjYWxsYmFja3MubW92ZWRCZWZvcmUpO1xufTtcblxuTG9jYWxDb2xsZWN0aW9uLl9yZW1vdmVGcm9tUmVzdWx0c1N5bmMgPSAocXVlcnksIGRvYykgPT4ge1xuICBpZiAocXVlcnkub3JkZXJlZCkge1xuICAgIGNvbnN0IGkgPSBMb2NhbENvbGxlY3Rpb24uX2ZpbmRJbk9yZGVyZWRSZXN1bHRzKHF1ZXJ5LCBkb2MpO1xuXG4gICAgcXVlcnkucmVtb3ZlZChkb2MuX2lkKTtcbiAgICBxdWVyeS5yZXN1bHRzLnNwbGljZShpLCAxKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBpZCA9IGRvYy5faWQ7ICAvLyBpbiBjYXNlIGNhbGxiYWNrIG11dGF0ZXMgZG9jXG5cbiAgICBxdWVyeS5yZW1vdmVkKGRvYy5faWQpO1xuICAgIHF1ZXJ5LnJlc3VsdHMucmVtb3ZlKGlkKTtcbiAgfVxufTtcblxuTG9jYWxDb2xsZWN0aW9uLl9yZW1vdmVGcm9tUmVzdWx0c0FzeW5jID0gYXN5bmMgKHF1ZXJ5LCBkb2MpID0+IHtcbiAgaWYgKHF1ZXJ5Lm9yZGVyZWQpIHtcbiAgICBjb25zdCBpID0gTG9jYWxDb2xsZWN0aW9uLl9maW5kSW5PcmRlcmVkUmVzdWx0cyhxdWVyeSwgZG9jKTtcblxuICAgIGF3YWl0IHF1ZXJ5LnJlbW92ZWQoZG9jLl9pZCk7XG4gICAgcXVlcnkucmVzdWx0cy5zcGxpY2UoaSwgMSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaWQgPSBkb2MuX2lkOyAgLy8gaW4gY2FzZSBjYWxsYmFjayBtdXRhdGVzIGRvY1xuXG4gICAgYXdhaXQgcXVlcnkucmVtb3ZlZChkb2MuX2lkKTtcbiAgICBxdWVyeS5yZXN1bHRzLnJlbW92ZShpZCk7XG4gIH1cbn07XG5cbi8vIElzIHRoaXMgc2VsZWN0b3IganVzdCBzaG9ydGhhbmQgZm9yIGxvb2t1cCBieSBfaWQ/XG5Mb2NhbENvbGxlY3Rpb24uX3NlbGVjdG9ySXNJZCA9IHNlbGVjdG9yID0+XG4gIHR5cGVvZiBzZWxlY3RvciA9PT0gJ251bWJlcicgfHxcbiAgdHlwZW9mIHNlbGVjdG9yID09PSAnc3RyaW5nJyB8fFxuICBzZWxlY3RvciBpbnN0YW5jZW9mIE1vbmdvSUQuT2JqZWN0SURcbjtcblxuLy8gSXMgdGhlIHNlbGVjdG9yIGp1c3QgbG9va3VwIGJ5IF9pZCAoc2hvcnRoYW5kIG9yIG5vdCk/XG5Mb2NhbENvbGxlY3Rpb24uX3NlbGVjdG9ySXNJZFBlcmhhcHNBc09iamVjdCA9IHNlbGVjdG9yID0+XG4gIExvY2FsQ29sbGVjdGlvbi5fc2VsZWN0b3JJc0lkKHNlbGVjdG9yKSB8fFxuICBMb2NhbENvbGxlY3Rpb24uX3NlbGVjdG9ySXNJZChzZWxlY3RvciAmJiBzZWxlY3Rvci5faWQpICYmXG4gIE9iamVjdC5rZXlzKHNlbGVjdG9yKS5sZW5ndGggPT09IDFcbjtcblxuTG9jYWxDb2xsZWN0aW9uLl91cGRhdGVJblJlc3VsdHNTeW5jID0gKHF1ZXJ5LCBkb2MsIG9sZF9kb2MpID0+IHtcbiAgaWYgKCFFSlNPTi5lcXVhbHMoZG9jLl9pZCwgb2xkX2RvYy5faWQpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5cXCd0IGNoYW5nZSBhIGRvY1xcJ3MgX2lkIHdoaWxlIHVwZGF0aW5nJyk7XG4gIH1cblxuICBjb25zdCBwcm9qZWN0aW9uRm4gPSBxdWVyeS5wcm9qZWN0aW9uRm47XG4gIGNvbnN0IGNoYW5nZWRGaWVsZHMgPSBEaWZmU2VxdWVuY2UubWFrZUNoYW5nZWRGaWVsZHMoXG4gICAgcHJvamVjdGlvbkZuKGRvYyksXG4gICAgcHJvamVjdGlvbkZuKG9sZF9kb2MpXG4gICk7XG5cbiAgaWYgKCFxdWVyeS5vcmRlcmVkKSB7XG4gICAgaWYgKE9iamVjdC5rZXlzKGNoYW5nZWRGaWVsZHMpLmxlbmd0aCkge1xuICAgICAgcXVlcnkuY2hhbmdlZChkb2MuX2lkLCBjaGFuZ2VkRmllbGRzKTtcbiAgICAgIHF1ZXJ5LnJlc3VsdHMuc2V0KGRvYy5faWQsIGRvYyk7XG4gICAgfVxuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgb2xkX2lkeCA9IExvY2FsQ29sbGVjdGlvbi5fZmluZEluT3JkZXJlZFJlc3VsdHMocXVlcnksIGRvYyk7XG5cbiAgaWYgKE9iamVjdC5rZXlzKGNoYW5nZWRGaWVsZHMpLmxlbmd0aCkge1xuICAgIHF1ZXJ5LmNoYW5nZWQoZG9jLl9pZCwgY2hhbmdlZEZpZWxkcyk7XG4gIH1cblxuICBpZiAoIXF1ZXJ5LnNvcnRlcikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGp1c3QgdGFrZSBpdCBvdXQgYW5kIHB1dCBpdCBiYWNrIGluIGFnYWluLCBhbmQgc2VlIGlmIHRoZSBpbmRleCBjaGFuZ2VzXG4gIHF1ZXJ5LnJlc3VsdHMuc3BsaWNlKG9sZF9pZHgsIDEpO1xuXG4gIGNvbnN0IG5ld19pZHggPSBMb2NhbENvbGxlY3Rpb24uX2luc2VydEluU29ydGVkTGlzdChcbiAgICBxdWVyeS5zb3J0ZXIuZ2V0Q29tcGFyYXRvcih7ZGlzdGFuY2VzOiBxdWVyeS5kaXN0YW5jZXN9KSxcbiAgICBxdWVyeS5yZXN1bHRzLFxuICAgIGRvY1xuICApO1xuXG4gIGlmIChvbGRfaWR4ICE9PSBuZXdfaWR4KSB7XG4gICAgbGV0IG5leHQgPSBxdWVyeS5yZXN1bHRzW25ld19pZHggKyAxXTtcbiAgICBpZiAobmV4dCkge1xuICAgICAgbmV4dCA9IG5leHQuX2lkO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBxdWVyeS5tb3ZlZEJlZm9yZSAmJiBxdWVyeS5tb3ZlZEJlZm9yZShkb2MuX2lkLCBuZXh0KTtcbiAgfVxufTtcblxuTG9jYWxDb2xsZWN0aW9uLl91cGRhdGVJblJlc3VsdHNBc3luYyA9IGFzeW5jIChxdWVyeSwgZG9jLCBvbGRfZG9jKSA9PiB7XG4gIGlmICghRUpTT04uZXF1YWxzKGRvYy5faWQsIG9sZF9kb2MuX2lkKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2FuXFwndCBjaGFuZ2UgYSBkb2NcXCdzIF9pZCB3aGlsZSB1cGRhdGluZycpO1xuICB9XG5cbiAgY29uc3QgcHJvamVjdGlvbkZuID0gcXVlcnkucHJvamVjdGlvbkZuO1xuICBjb25zdCBjaGFuZ2VkRmllbGRzID0gRGlmZlNlcXVlbmNlLm1ha2VDaGFuZ2VkRmllbGRzKFxuICAgIHByb2plY3Rpb25Gbihkb2MpLFxuICAgIHByb2plY3Rpb25GbihvbGRfZG9jKVxuICApO1xuXG4gIGlmICghcXVlcnkub3JkZXJlZCkge1xuICAgIGlmIChPYmplY3Qua2V5cyhjaGFuZ2VkRmllbGRzKS5sZW5ndGgpIHtcbiAgICAgIGF3YWl0IHF1ZXJ5LmNoYW5nZWQoZG9jLl9pZCwgY2hhbmdlZEZpZWxkcyk7XG4gICAgICBxdWVyeS5yZXN1bHRzLnNldChkb2MuX2lkLCBkb2MpO1xuICAgIH1cblxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG9sZF9pZHggPSBMb2NhbENvbGxlY3Rpb24uX2ZpbmRJbk9yZGVyZWRSZXN1bHRzKHF1ZXJ5LCBkb2MpO1xuXG4gIGlmIChPYmplY3Qua2V5cyhjaGFuZ2VkRmllbGRzKS5sZW5ndGgpIHtcbiAgICBhd2FpdCBxdWVyeS5jaGFuZ2VkKGRvYy5faWQsIGNoYW5nZWRGaWVsZHMpO1xuICB9XG5cbiAgaWYgKCFxdWVyeS5zb3J0ZXIpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBqdXN0IHRha2UgaXQgb3V0IGFuZCBwdXQgaXQgYmFjayBpbiBhZ2FpbiwgYW5kIHNlZSBpZiB0aGUgaW5kZXggY2hhbmdlc1xuICBxdWVyeS5yZXN1bHRzLnNwbGljZShvbGRfaWR4LCAxKTtcblxuICBjb25zdCBuZXdfaWR4ID0gTG9jYWxDb2xsZWN0aW9uLl9pbnNlcnRJblNvcnRlZExpc3QoXG4gICAgcXVlcnkuc29ydGVyLmdldENvbXBhcmF0b3Ioe2Rpc3RhbmNlczogcXVlcnkuZGlzdGFuY2VzfSksXG4gICAgcXVlcnkucmVzdWx0cyxcbiAgICBkb2NcbiAgKTtcblxuICBpZiAob2xkX2lkeCAhPT0gbmV3X2lkeCkge1xuICAgIGxldCBuZXh0ID0gcXVlcnkucmVzdWx0c1tuZXdfaWR4ICsgMV07XG4gICAgaWYgKG5leHQpIHtcbiAgICAgIG5leHQgPSBuZXh0Ll9pZDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dCA9IG51bGw7XG4gICAgfVxuXG4gICAgcXVlcnkubW92ZWRCZWZvcmUgJiYgYXdhaXQgcXVlcnkubW92ZWRCZWZvcmUoZG9jLl9pZCwgbmV4dCk7XG4gIH1cbn07XG5cbmNvbnN0IE1PRElGSUVSUyA9IHtcbiAgJGN1cnJlbnREYXRlKHRhcmdldCwgZmllbGQsIGFyZykge1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBoYXNPd24uY2FsbChhcmcsICckdHlwZScpKSB7XG4gICAgICBpZiAoYXJnLiR0eXBlICE9PSAnZGF0ZScpIHtcbiAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICAgJ01pbmltb25nbyBkb2VzIGN1cnJlbnRseSBvbmx5IHN1cHBvcnQgdGhlIGRhdGUgdHlwZSBpbiAnICtcbiAgICAgICAgICAnJGN1cnJlbnREYXRlIG1vZGlmaWVycycsXG4gICAgICAgICAge2ZpZWxkfVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYXJnICE9PSB0cnVlKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignSW52YWxpZCAkY3VycmVudERhdGUgbW9kaWZpZXInLCB7ZmllbGR9KTtcbiAgICB9XG5cbiAgICB0YXJnZXRbZmllbGRdID0gbmV3IERhdGUoKTtcbiAgfSxcbiAgJGluYyh0YXJnZXQsIGZpZWxkLCBhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ251bWJlcicpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCdNb2RpZmllciAkaW5jIGFsbG93ZWQgZm9yIG51bWJlcnMgb25seScsIHtmaWVsZH0pO1xuICAgIH1cblxuICAgIGlmIChmaWVsZCBpbiB0YXJnZXQpIHtcbiAgICAgIGlmICh0eXBlb2YgdGFyZ2V0W2ZpZWxkXSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICAgJ0Nhbm5vdCBhcHBseSAkaW5jIG1vZGlmaWVyIHRvIG5vbi1udW1iZXInLFxuICAgICAgICAgIHtmaWVsZH1cbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgdGFyZ2V0W2ZpZWxkXSArPSBhcmc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRhcmdldFtmaWVsZF0gPSBhcmc7XG4gICAgfVxuICB9LFxuICAkbWluKHRhcmdldCwgZmllbGQsIGFyZykge1xuICAgIGlmICh0eXBlb2YgYXJnICE9PSAnbnVtYmVyJykge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJ01vZGlmaWVyICRtaW4gYWxsb3dlZCBmb3IgbnVtYmVycyBvbmx5Jywge2ZpZWxkfSk7XG4gICAgfVxuXG4gICAgaWYgKGZpZWxkIGluIHRhcmdldCkge1xuICAgICAgaWYgKHR5cGVvZiB0YXJnZXRbZmllbGRdICE9PSAnbnVtYmVyJykge1xuICAgICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgICAnQ2Fubm90IGFwcGx5ICRtaW4gbW9kaWZpZXIgdG8gbm9uLW51bWJlcicsXG4gICAgICAgICAge2ZpZWxkfVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAodGFyZ2V0W2ZpZWxkXSA+IGFyZykge1xuICAgICAgICB0YXJnZXRbZmllbGRdID0gYXJnO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0YXJnZXRbZmllbGRdID0gYXJnO1xuICAgIH1cbiAgfSxcbiAgJG1heCh0YXJnZXQsIGZpZWxkLCBhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ251bWJlcicpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCdNb2RpZmllciAkbWF4IGFsbG93ZWQgZm9yIG51bWJlcnMgb25seScsIHtmaWVsZH0pO1xuICAgIH1cblxuICAgIGlmIChmaWVsZCBpbiB0YXJnZXQpIHtcbiAgICAgIGlmICh0eXBlb2YgdGFyZ2V0W2ZpZWxkXSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICAgJ0Nhbm5vdCBhcHBseSAkbWF4IG1vZGlmaWVyIHRvIG5vbi1udW1iZXInLFxuICAgICAgICAgIHtmaWVsZH1cbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRhcmdldFtmaWVsZF0gPCBhcmcpIHtcbiAgICAgICAgdGFyZ2V0W2ZpZWxkXSA9IGFyZztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGFyZ2V0W2ZpZWxkXSA9IGFyZztcbiAgICB9XG4gIH0sXG4gICRtdWwodGFyZ2V0LCBmaWVsZCwgYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgIT09ICdudW1iZXInKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignTW9kaWZpZXIgJG11bCBhbGxvd2VkIGZvciBudW1iZXJzIG9ubHknLCB7ZmllbGR9KTtcbiAgICB9XG5cbiAgICBpZiAoZmllbGQgaW4gdGFyZ2V0KSB7XG4gICAgICBpZiAodHlwZW9mIHRhcmdldFtmaWVsZF0gIT09ICdudW1iZXInKSB7XG4gICAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICAgICdDYW5ub3QgYXBwbHkgJG11bCBtb2RpZmllciB0byBub24tbnVtYmVyJyxcbiAgICAgICAgICB7ZmllbGR9XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHRhcmdldFtmaWVsZF0gKj0gYXJnO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YXJnZXRbZmllbGRdID0gMDtcbiAgICB9XG4gIH0sXG4gICRyZW5hbWUodGFyZ2V0LCBmaWVsZCwgYXJnLCBrZXlwYXRoLCBkb2MpIHtcbiAgICAvLyBubyBpZGVhIHdoeSBtb25nbyBoYXMgdGhpcyByZXN0cmljdGlvbi4uXG4gICAgaWYgKGtleXBhdGggPT09IGFyZykge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJyRyZW5hbWUgc291cmNlIG11c3QgZGlmZmVyIGZyb20gdGFyZ2V0Jywge2ZpZWxkfSk7XG4gICAgfVxuXG4gICAgaWYgKHRhcmdldCA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJyRyZW5hbWUgc291cmNlIGZpZWxkIGludmFsaWQnLCB7ZmllbGR9KTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCckcmVuYW1lIHRhcmdldCBtdXN0IGJlIGEgc3RyaW5nJywge2ZpZWxkfSk7XG4gICAgfVxuXG4gICAgaWYgKGFyZy5pbmNsdWRlcygnXFwwJykpIHtcbiAgICAgIC8vIE51bGwgYnl0ZXMgYXJlIG5vdCBhbGxvd2VkIGluIE1vbmdvIGZpZWxkIG5hbWVzXG4gICAgICAvLyBodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL3JlZmVyZW5jZS9saW1pdHMvI1Jlc3RyaWN0aW9ucy1vbi1GaWVsZC1OYW1lc1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICdUaGUgXFwndG9cXCcgZmllbGQgZm9yICRyZW5hbWUgY2Fubm90IGNvbnRhaW4gYW4gZW1iZWRkZWQgbnVsbCBieXRlJyxcbiAgICAgICAge2ZpZWxkfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvYmplY3QgPSB0YXJnZXRbZmllbGRdO1xuXG4gICAgZGVsZXRlIHRhcmdldFtmaWVsZF07XG5cbiAgICBjb25zdCBrZXlwYXJ0cyA9IGFyZy5zcGxpdCgnLicpO1xuICAgIGNvbnN0IHRhcmdldDIgPSBmaW5kTW9kVGFyZ2V0KGRvYywga2V5cGFydHMsIHtmb3JiaWRBcnJheTogdHJ1ZX0pO1xuXG4gICAgaWYgKHRhcmdldDIgPT09IG51bGwpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCckcmVuYW1lIHRhcmdldCBmaWVsZCBpbnZhbGlkJywge2ZpZWxkfSk7XG4gICAgfVxuXG4gICAgdGFyZ2V0MltrZXlwYXJ0cy5wb3AoKV0gPSBvYmplY3Q7XG4gIH0sXG4gICRzZXQodGFyZ2V0LCBmaWVsZCwgYXJnKSB7XG4gICAgaWYgKHRhcmdldCAhPT0gT2JqZWN0KHRhcmdldCkpIHsgLy8gbm90IGFuIGFycmF5IG9yIGFuIG9iamVjdFxuICAgICAgY29uc3QgZXJyb3IgPSBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgJ0Nhbm5vdCBzZXQgcHJvcGVydHkgb24gbm9uLW9iamVjdCBmaWVsZCcsXG4gICAgICAgIHtmaWVsZH1cbiAgICAgICk7XG4gICAgICBlcnJvci5zZXRQcm9wZXJ0eUVycm9yID0gdHJ1ZTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIGlmICh0YXJnZXQgPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGVycm9yID0gTWluaW1vbmdvRXJyb3IoJ0Nhbm5vdCBzZXQgcHJvcGVydHkgb24gbnVsbCcsIHtmaWVsZH0pO1xuICAgICAgZXJyb3Iuc2V0UHJvcGVydHlFcnJvciA9IHRydWU7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG5cbiAgICBhc3NlcnRIYXNWYWxpZEZpZWxkTmFtZXMoYXJnKTtcblxuICAgIHRhcmdldFtmaWVsZF0gPSBhcmc7XG4gIH0sXG4gICRzZXRPbkluc2VydCh0YXJnZXQsIGZpZWxkLCBhcmcpIHtcbiAgICAvLyBjb252ZXJ0ZWQgdG8gYCRzZXRgIGluIGBfbW9kaWZ5YFxuICB9LFxuICAkdW5zZXQodGFyZ2V0LCBmaWVsZCwgYXJnKSB7XG4gICAgaWYgKHRhcmdldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgaWYgKGZpZWxkIGluIHRhcmdldCkge1xuICAgICAgICAgIHRhcmdldFtmaWVsZF0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWxldGUgdGFyZ2V0W2ZpZWxkXTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gICRwdXNoKHRhcmdldCwgZmllbGQsIGFyZykge1xuICAgIGlmICh0YXJnZXRbZmllbGRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRhcmdldFtmaWVsZF0gPSBbXTtcbiAgICB9XG5cbiAgICBpZiAoISh0YXJnZXRbZmllbGRdIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignQ2Fubm90IGFwcGx5ICRwdXNoIG1vZGlmaWVyIHRvIG5vbi1hcnJheScsIHtmaWVsZH0pO1xuICAgIH1cblxuICAgIGlmICghKGFyZyAmJiBhcmcuJGVhY2gpKSB7XG4gICAgICAvLyBTaW1wbGUgbW9kZTogbm90ICRlYWNoXG4gICAgICBhc3NlcnRIYXNWYWxpZEZpZWxkTmFtZXMoYXJnKTtcblxuICAgICAgdGFyZ2V0W2ZpZWxkXS5wdXNoKGFyZyk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGYW5jeSBtb2RlOiAkZWFjaCAoYW5kIG1heWJlICRzbGljZSBhbmQgJHNvcnQgYW5kICRwb3NpdGlvbilcbiAgICBjb25zdCB0b1B1c2ggPSBhcmcuJGVhY2g7XG4gICAgaWYgKCEodG9QdXNoIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignJGVhY2ggbXVzdCBiZSBhbiBhcnJheScsIHtmaWVsZH0pO1xuICAgIH1cblxuICAgIGFzc2VydEhhc1ZhbGlkRmllbGROYW1lcyh0b1B1c2gpO1xuXG4gICAgLy8gUGFyc2UgJHBvc2l0aW9uXG4gICAgbGV0IHBvc2l0aW9uID0gdW5kZWZpbmVkO1xuICAgIGlmICgnJHBvc2l0aW9uJyBpbiBhcmcpIHtcbiAgICAgIGlmICh0eXBlb2YgYXJnLiRwb3NpdGlvbiAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJyRwb3NpdGlvbiBtdXN0IGJlIGEgbnVtZXJpYyB2YWx1ZScsIHtmaWVsZH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBYWFggc2hvdWxkIGNoZWNrIHRvIG1ha2Ugc3VyZSBpbnRlZ2VyXG4gICAgICBpZiAoYXJnLiRwb3NpdGlvbiA8IDApIHtcbiAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICAgJyRwb3NpdGlvbiBpbiAkcHVzaCBtdXN0IGJlIHplcm8gb3IgcG9zaXRpdmUnLFxuICAgICAgICAgIHtmaWVsZH1cbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcG9zaXRpb24gPSBhcmcuJHBvc2l0aW9uO1xuICAgIH1cblxuICAgIC8vIFBhcnNlICRzbGljZS5cbiAgICBsZXQgc2xpY2UgPSB1bmRlZmluZWQ7XG4gICAgaWYgKCckc2xpY2UnIGluIGFyZykge1xuICAgICAgaWYgKHR5cGVvZiBhcmcuJHNsaWNlICE9PSAnbnVtYmVyJykge1xuICAgICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcignJHNsaWNlIG11c3QgYmUgYSBudW1lcmljIHZhbHVlJywge2ZpZWxkfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFhYWCBzaG91bGQgY2hlY2sgdG8gbWFrZSBzdXJlIGludGVnZXJcbiAgICAgIHNsaWNlID0gYXJnLiRzbGljZTtcbiAgICB9XG5cbiAgICAvLyBQYXJzZSAkc29ydC5cbiAgICBsZXQgc29ydEZ1bmN0aW9uID0gdW5kZWZpbmVkO1xuICAgIGlmIChhcmcuJHNvcnQpIHtcbiAgICAgIGlmIChzbGljZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCckc29ydCByZXF1aXJlcyAkc2xpY2UgdG8gYmUgcHJlc2VudCcsIHtmaWVsZH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBYWFggdGhpcyBhbGxvd3MgdXMgdG8gdXNlIGEgJHNvcnQgd2hvc2UgdmFsdWUgaXMgYW4gYXJyYXksIGJ1dCB0aGF0J3NcbiAgICAgIC8vIGFjdHVhbGx5IGFuIGV4dGVuc2lvbiBvZiB0aGUgTm9kZSBkcml2ZXIsIHNvIGl0IHdvbid0IHdvcmtcbiAgICAgIC8vIHNlcnZlci1zaWRlLiBDb3VsZCBiZSBjb25mdXNpbmchXG4gICAgICAvLyBYWFggaXMgaXQgY29ycmVjdCB0aGF0IHdlIGRvbid0IGRvIGdlby1zdHVmZiBoZXJlP1xuICAgICAgc29ydEZ1bmN0aW9uID0gbmV3IE1pbmltb25nby5Tb3J0ZXIoYXJnLiRzb3J0KS5nZXRDb21wYXJhdG9yKCk7XG5cbiAgICAgIHRvUHVzaC5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBpZiAoTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKGVsZW1lbnQpICE9PSAzKSB7XG4gICAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICAgICAnJHB1c2ggbGlrZSBtb2RpZmllcnMgdXNpbmcgJHNvcnQgcmVxdWlyZSBhbGwgZWxlbWVudHMgdG8gYmUgJyArXG4gICAgICAgICAgICAnb2JqZWN0cycsXG4gICAgICAgICAgICB7ZmllbGR9XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQWN0dWFsbHkgcHVzaC5cbiAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdG9QdXNoLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIHRhcmdldFtmaWVsZF0ucHVzaChlbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzcGxpY2VBcmd1bWVudHMgPSBbcG9zaXRpb24sIDBdO1xuXG4gICAgICB0b1B1c2guZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgc3BsaWNlQXJndW1lbnRzLnB1c2goZWxlbWVudCk7XG4gICAgICB9KTtcblxuICAgICAgdGFyZ2V0W2ZpZWxkXS5zcGxpY2UoLi4uc3BsaWNlQXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICAvLyBBY3R1YWxseSBzb3J0LlxuICAgIGlmIChzb3J0RnVuY3Rpb24pIHtcbiAgICAgIHRhcmdldFtmaWVsZF0uc29ydChzb3J0RnVuY3Rpb24pO1xuICAgIH1cblxuICAgIC8vIEFjdHVhbGx5IHNsaWNlLlxuICAgIGlmIChzbGljZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoc2xpY2UgPT09IDApIHtcbiAgICAgICAgdGFyZ2V0W2ZpZWxkXSA9IFtdOyAvLyBkaWZmZXJzIGZyb20gQXJyYXkuc2xpY2UhXG4gICAgICB9IGVsc2UgaWYgKHNsaWNlIDwgMCkge1xuICAgICAgICB0YXJnZXRbZmllbGRdID0gdGFyZ2V0W2ZpZWxkXS5zbGljZShzbGljZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXRbZmllbGRdID0gdGFyZ2V0W2ZpZWxkXS5zbGljZSgwLCBzbGljZSk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICAkcHVzaEFsbCh0YXJnZXQsIGZpZWxkLCBhcmcpIHtcbiAgICBpZiAoISh0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCdNb2RpZmllciAkcHVzaEFsbC9wdWxsQWxsIGFsbG93ZWQgZm9yIGFycmF5cyBvbmx5Jyk7XG4gICAgfVxuXG4gICAgYXNzZXJ0SGFzVmFsaWRGaWVsZE5hbWVzKGFyZyk7XG5cbiAgICBjb25zdCB0b1B1c2ggPSB0YXJnZXRbZmllbGRdO1xuXG4gICAgaWYgKHRvUHVzaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0YXJnZXRbZmllbGRdID0gYXJnO1xuICAgIH0gZWxzZSBpZiAoISh0b1B1c2ggaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICAnQ2Fubm90IGFwcGx5ICRwdXNoQWxsIG1vZGlmaWVyIHRvIG5vbi1hcnJheScsXG4gICAgICAgIHtmaWVsZH1cbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRvUHVzaC5wdXNoKC4uLmFyZyk7XG4gICAgfVxuICB9LFxuICAkYWRkVG9TZXQodGFyZ2V0LCBmaWVsZCwgYXJnKSB7XG4gICAgbGV0IGlzRWFjaCA9IGZhbHNlO1xuXG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdvYmplY3QnKSB7XG4gICAgICAvLyBjaGVjayBpZiBmaXJzdCBrZXkgaXMgJyRlYWNoJ1xuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGFyZyk7XG4gICAgICBpZiAoa2V5c1swXSA9PT0gJyRlYWNoJykge1xuICAgICAgICBpc0VhY2ggPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHZhbHVlcyA9IGlzRWFjaCA/IGFyZy4kZWFjaCA6IFthcmddO1xuXG4gICAgYXNzZXJ0SGFzVmFsaWRGaWVsZE5hbWVzKHZhbHVlcyk7XG5cbiAgICBjb25zdCB0b0FkZCA9IHRhcmdldFtmaWVsZF07XG4gICAgaWYgKHRvQWRkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRhcmdldFtmaWVsZF0gPSB2YWx1ZXM7XG4gICAgfSBlbHNlIGlmICghKHRvQWRkIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgJ0Nhbm5vdCBhcHBseSAkYWRkVG9TZXQgbW9kaWZpZXIgdG8gbm9uLWFycmF5JyxcbiAgICAgICAge2ZpZWxkfVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4ge1xuICAgICAgICBpZiAodG9BZGQuc29tZShlbGVtZW50ID0+IExvY2FsQ29sbGVjdGlvbi5fZi5fZXF1YWwodmFsdWUsIGVsZW1lbnQpKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvQWRkLnB1c2godmFsdWUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuICAkcG9wKHRhcmdldCwgZmllbGQsIGFyZykge1xuICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRvUG9wID0gdGFyZ2V0W2ZpZWxkXTtcblxuICAgIGlmICh0b1BvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCEodG9Qb3AgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKCdDYW5ub3QgYXBwbHkgJHBvcCBtb2RpZmllciB0byBub24tYXJyYXknLCB7ZmllbGR9KTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicgJiYgYXJnIDwgMCkge1xuICAgICAgdG9Qb3Auc3BsaWNlKDAsIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0b1BvcC5wb3AoKTtcbiAgICB9XG4gIH0sXG4gICRwdWxsKHRhcmdldCwgZmllbGQsIGFyZykge1xuICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRvUHVsbCA9IHRhcmdldFtmaWVsZF07XG4gICAgaWYgKHRvUHVsbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCEodG9QdWxsIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICB0aHJvdyBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgJ0Nhbm5vdCBhcHBseSAkcHVsbC9wdWxsQWxsIG1vZGlmaWVyIHRvIG5vbi1hcnJheScsXG4gICAgICAgIHtmaWVsZH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgbGV0IG91dDtcbiAgICBpZiAoYXJnICE9IG51bGwgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgIShhcmcgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgIC8vIFhYWCB3b3VsZCBiZSBtdWNoIG5pY2VyIHRvIGNvbXBpbGUgdGhpcyBvbmNlLCByYXRoZXIgdGhhblxuICAgICAgLy8gZm9yIGVhY2ggZG9jdW1lbnQgd2UgbW9kaWZ5Li4gYnV0IHVzdWFsbHkgd2UncmUgbm90XG4gICAgICAvLyBtb2RpZnlpbmcgdGhhdCBtYW55IGRvY3VtZW50cywgc28gd2UnbGwgbGV0IGl0IHNsaWRlIGZvclxuICAgICAgLy8gbm93XG5cbiAgICAgIC8vIFhYWCBNaW5pbW9uZ28uTWF0Y2hlciBpc24ndCB1cCBmb3IgdGhlIGpvYiwgYmVjYXVzZSB3ZSBuZWVkXG4gICAgICAvLyB0byBwZXJtaXQgc3R1ZmYgbGlrZSB7JHB1bGw6IHthOiB7JGd0OiA0fX19Li4gc29tZXRoaW5nXG4gICAgICAvLyBsaWtlIHskZ3Q6IDR9IGlzIG5vdCBub3JtYWxseSBhIGNvbXBsZXRlIHNlbGVjdG9yLlxuICAgICAgLy8gc2FtZSBpc3N1ZSBhcyAkZWxlbU1hdGNoIHBvc3NpYmx5P1xuICAgICAgY29uc3QgbWF0Y2hlciA9IG5ldyBNaW5pbW9uZ28uTWF0Y2hlcihhcmcpO1xuXG4gICAgICBvdXQgPSB0b1B1bGwuZmlsdGVyKGVsZW1lbnQgPT4gIW1hdGNoZXIuZG9jdW1lbnRNYXRjaGVzKGVsZW1lbnQpLnJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IHRvUHVsbC5maWx0ZXIoZWxlbWVudCA9PiAhTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbChlbGVtZW50LCBhcmcpKTtcbiAgICB9XG5cbiAgICB0YXJnZXRbZmllbGRdID0gb3V0O1xuICB9LFxuICAkcHVsbEFsbCh0YXJnZXQsIGZpZWxkLCBhcmcpIHtcbiAgICBpZiAoISh0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICAnTW9kaWZpZXIgJHB1c2hBbGwvcHVsbEFsbCBhbGxvd2VkIGZvciBhcnJheXMgb25seScsXG4gICAgICAgIHtmaWVsZH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdG9QdWxsID0gdGFyZ2V0W2ZpZWxkXTtcblxuICAgIGlmICh0b1B1bGwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghKHRvUHVsbCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICdDYW5ub3QgYXBwbHkgJHB1bGwvcHVsbEFsbCBtb2RpZmllciB0byBub24tYXJyYXknLFxuICAgICAgICB7ZmllbGR9XG4gICAgICApO1xuICAgIH1cblxuICAgIHRhcmdldFtmaWVsZF0gPSB0b1B1bGwuZmlsdGVyKG9iamVjdCA9PlxuICAgICAgIWFyZy5zb21lKGVsZW1lbnQgPT4gTG9jYWxDb2xsZWN0aW9uLl9mLl9lcXVhbChvYmplY3QsIGVsZW1lbnQpKVxuICAgICk7XG4gIH0sXG4gICRiaXQodGFyZ2V0LCBmaWVsZCwgYXJnKSB7XG4gICAgLy8gWFhYIG1vbmdvIG9ubHkgc3VwcG9ydHMgJGJpdCBvbiBpbnRlZ2VycywgYW5kIHdlIG9ubHkgc3VwcG9ydFxuICAgIC8vIG5hdGl2ZSBqYXZhc2NyaXB0IG51bWJlcnMgKGRvdWJsZXMpIHNvIGZhciwgc28gd2UgY2FuJ3Qgc3VwcG9ydCAkYml0XG4gICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJyRiaXQgaXMgbm90IHN1cHBvcnRlZCcsIHtmaWVsZH0pO1xuICB9LFxuICAkdigpIHtcbiAgICAvLyBBcyBkaXNjdXNzZWQgaW4gaHR0cHM6Ly9naXRodWIuY29tL21ldGVvci9tZXRlb3IvaXNzdWVzLzk2MjMsXG4gICAgLy8gdGhlIGAkdmAgb3BlcmF0b3IgaXMgbm90IG5lZWRlZCBieSBNZXRlb3IsIGJ1dCBwcm9ibGVtcyBjYW4gb2NjdXIgaWZcbiAgICAvLyBpdCdzIG5vdCBhdCBsZWFzdCBjYWxsYWJsZSAoYXMgb2YgTW9uZ28gPj0gMy42KS4gSXQncyBkZWZpbmVkIGhlcmUgYXNcbiAgICAvLyBhIG5vLW9wIHRvIHdvcmsgYXJvdW5kIHRoZXNlIHByb2JsZW1zLlxuICB9XG59O1xuXG5jb25zdCBOT19DUkVBVEVfTU9ESUZJRVJTID0ge1xuICAkcG9wOiB0cnVlLFxuICAkcHVsbDogdHJ1ZSxcbiAgJHB1bGxBbGw6IHRydWUsXG4gICRyZW5hbWU6IHRydWUsXG4gICR1bnNldDogdHJ1ZVxufTtcblxuLy8gTWFrZSBzdXJlIGZpZWxkIG5hbWVzIGRvIG5vdCBjb250YWluIE1vbmdvIHJlc3RyaWN0ZWRcbi8vIGNoYXJhY3RlcnMgKCckJywgJ1xcMCcpIG9yIGludmFsaWQgZG90IHVzYWdlIChsZWFkaW5nL3RyYWlsaW5nL2NvbnNlY3V0aXZlICcuJykuXG4vLyBodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL3JlZmVyZW5jZS9saW1pdHMvI1Jlc3RyaWN0aW9ucy1vbi1GaWVsZC1OYW1lc1xuY29uc3QgaW52YWxpZENoYXJNc2cgPSB7XG4gICQ6ICdzdGFydCB3aXRoIFxcJyRcXCcnLFxuICAnLic6ICdzdGFydCBvciBlbmQgd2l0aCBcXCcuXFwnJyxcbiAgJy4uJzogJ2NvbnRhaW4gY29uc2VjdXRpdmUgZG90cycsXG4gICdcXDAnOiAnY29udGFpbiBudWxsIGJ5dGVzJ1xufTtcblxuLy8gY2hlY2tzIGlmIGFsbCBmaWVsZCBuYW1lcyBpbiBhbiBvYmplY3QgYXJlIHZhbGlkXG5mdW5jdGlvbiBhc3NlcnRIYXNWYWxpZEZpZWxkTmFtZXMoZG9jKSB7XG4gIGlmIChkb2MgJiYgdHlwZW9mIGRvYyA9PT0gJ29iamVjdCcpIHtcbiAgICBKU09OLnN0cmluZ2lmeShkb2MsIChrZXksIHZhbHVlKSA9PiB7XG4gICAgICBhc3NlcnRJc1ZhbGlkRmllbGROYW1lKGtleSk7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZXJ0SXNWYWxpZEZpZWxkTmFtZShrZXkpIHtcbiAgbGV0IG1hdGNoO1xuICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYgKG1hdGNoID0ga2V5Lm1hdGNoKC9eXFwkfF5cXC58XFwuXFwufFxcLiR8XlxcLiR8XFwwLykpKSB7XG4gICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoYEtleSAke2tleX0gbXVzdCBub3QgJHtpbnZhbGlkQ2hhck1zZ1ttYXRjaFswXV19YCk7XG4gIH1cbn1cblxuLy8gZm9yIGEuYi5jLjIuZC5lLCBrZXlwYXJ0cyBzaG91bGQgYmUgWydhJywgJ2InLCAnYycsICcyJywgJ2QnLCAnZSddLFxuLy8gYW5kIHRoZW4geW91IHdvdWxkIG9wZXJhdGUgb24gdGhlICdlJyBwcm9wZXJ0eSBvZiB0aGUgcmV0dXJuZWRcbi8vIG9iamVjdC5cbi8vXG4vLyBpZiBvcHRpb25zLm5vQ3JlYXRlIGlzIGZhbHNleSwgY3JlYXRlcyBpbnRlcm1lZGlhdGUgbGV2ZWxzIG9mXG4vLyBzdHJ1Y3R1cmUgYXMgbmVjZXNzYXJ5LCBsaWtlIG1rZGlyIC1wIChhbmQgcmFpc2VzIGFuIGV4Y2VwdGlvbiBpZlxuLy8gdGhhdCB3b3VsZCBtZWFuIGdpdmluZyBhIG5vbi1udW1lcmljIHByb3BlcnR5IHRvIGFuIGFycmF5LikgaWZcbi8vIG9wdGlvbnMubm9DcmVhdGUgaXMgdHJ1ZSwgcmV0dXJuIHVuZGVmaW5lZCBpbnN0ZWFkLlxuLy9cbi8vIG1heSBtb2RpZnkgdGhlIGxhc3QgZWxlbWVudCBvZiBrZXlwYXJ0cyB0byBzaWduYWwgdG8gdGhlIGNhbGxlciB0aGF0IGl0IG5lZWRzXG4vLyB0byB1c2UgYSBkaWZmZXJlbnQgdmFsdWUgdG8gaW5kZXggaW50byB0aGUgcmV0dXJuZWQgb2JqZWN0IChmb3IgZXhhbXBsZSxcbi8vIFsnYScsICcwMSddIC0+IFsnYScsIDFdKS5cbi8vXG4vLyBpZiBmb3JiaWRBcnJheSBpcyB0cnVlLCByZXR1cm4gbnVsbCBpZiB0aGUga2V5cGF0aCBnb2VzIHRocm91Z2ggYW4gYXJyYXkuXG4vL1xuLy8gaWYgb3B0aW9ucy5hcnJheUluZGljZXMgaXMgc2V0LCB1c2UgaXRzIGZpcnN0IGVsZW1lbnQgZm9yIHRoZSAoZmlyc3QpICckJyBpblxuLy8gdGhlIHBhdGguXG5mdW5jdGlvbiBmaW5kTW9kVGFyZ2V0KGRvYywga2V5cGFydHMsIG9wdGlvbnMgPSB7fSkge1xuICBsZXQgdXNlZEFycmF5SW5kZXggPSBmYWxzZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgbGFzdCA9IGkgPT09IGtleXBhcnRzLmxlbmd0aCAtIDE7XG4gICAgbGV0IGtleXBhcnQgPSBrZXlwYXJ0c1tpXTtcblxuICAgIGlmICghaXNJbmRleGFibGUoZG9jKSkge1xuICAgICAgaWYgKG9wdGlvbnMubm9DcmVhdGUpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZXJyb3IgPSBNaW5pbW9uZ29FcnJvcihcbiAgICAgICAgYGNhbm5vdCB1c2UgdGhlIHBhcnQgJyR7a2V5cGFydH0nIHRvIHRyYXZlcnNlICR7ZG9jfWBcbiAgICAgICk7XG4gICAgICBlcnJvci5zZXRQcm9wZXJ0eUVycm9yID0gdHJ1ZTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIGlmIChkb2MgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgaWYgKG9wdGlvbnMuZm9yYmlkQXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmIChrZXlwYXJ0ID09PSAnJCcpIHtcbiAgICAgICAgaWYgKHVzZWRBcnJheUluZGV4KSB7XG4gICAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoJ1RvbyBtYW55IHBvc2l0aW9uYWwgKGkuZS4gXFwnJFxcJykgZWxlbWVudHMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghb3B0aW9ucy5hcnJheUluZGljZXMgfHwgIW9wdGlvbnMuYXJyYXlJbmRpY2VzLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICAgICAgJ1RoZSBwb3NpdGlvbmFsIG9wZXJhdG9yIGRpZCBub3QgZmluZCB0aGUgbWF0Y2ggbmVlZGVkIGZyb20gdGhlICcgK1xuICAgICAgICAgICAgJ3F1ZXJ5J1xuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBrZXlwYXJ0ID0gb3B0aW9ucy5hcnJheUluZGljZXNbMF07XG4gICAgICAgIHVzZWRBcnJheUluZGV4ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoaXNOdW1lcmljS2V5KGtleXBhcnQpKSB7XG4gICAgICAgIGtleXBhcnQgPSBwYXJzZUludChrZXlwYXJ0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChvcHRpb25zLm5vQ3JlYXRlKSB7XG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IE1pbmltb25nb0Vycm9yKFxuICAgICAgICAgIGBjYW4ndCBhcHBlbmQgdG8gYXJyYXkgdXNpbmcgc3RyaW5nIGZpZWxkIG5hbWUgWyR7a2V5cGFydH1dYFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAobGFzdCkge1xuICAgICAgICBrZXlwYXJ0c1tpXSA9IGtleXBhcnQ7IC8vIGhhbmRsZSAnYS4wMSdcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMubm9DcmVhdGUgJiYga2V5cGFydCA+PSBkb2MubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIHdoaWxlIChkb2MubGVuZ3RoIDwga2V5cGFydCkge1xuICAgICAgICBkb2MucHVzaChudWxsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFsYXN0KSB7XG4gICAgICAgIGlmIChkb2MubGVuZ3RoID09PSBrZXlwYXJ0KSB7XG4gICAgICAgICAgZG9jLnB1c2goe30pO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkb2Nba2V5cGFydF0gIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhyb3cgTWluaW1vbmdvRXJyb3IoXG4gICAgICAgICAgICBgY2FuJ3QgbW9kaWZ5IGZpZWxkICcke2tleXBhcnRzW2kgKyAxXX0nIG9mIGxpc3QgdmFsdWUgYCArXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeShkb2Nba2V5cGFydF0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBhc3NlcnRJc1ZhbGlkRmllbGROYW1lKGtleXBhcnQpO1xuXG4gICAgICBpZiAoIShrZXlwYXJ0IGluIGRvYykpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMubm9DcmVhdGUpIHtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFsYXN0KSB7XG4gICAgICAgICAgZG9jW2tleXBhcnRdID0ge307XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobGFzdCkge1xuICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG5cbiAgICBkb2MgPSBkb2Nba2V5cGFydF07XG4gIH1cblxuICAvLyBub3RyZWFjaGVkXG59XG4iLCJpbXBvcnQgTG9jYWxDb2xsZWN0aW9uIGZyb20gJy4vbG9jYWxfY29sbGVjdGlvbi5qcyc7XG5pbXBvcnQge1xuICBjb21waWxlRG9jdW1lbnRTZWxlY3RvcixcbiAgaGFzT3duLFxuICBub3RoaW5nTWF0Y2hlcixcbn0gZnJvbSAnLi9jb21tb24uanMnO1xuXG5jb25zdCBEZWNpbWFsID0gUGFja2FnZVsnbW9uZ28tZGVjaW1hbCddPy5EZWNpbWFsIHx8IGNsYXNzIERlY2ltYWxTdHViIHt9XG5cbi8vIFRoZSBtaW5pbW9uZ28gc2VsZWN0b3IgY29tcGlsZXIhXG5cbi8vIFRlcm1pbm9sb2d5OlxuLy8gIC0gYSAnc2VsZWN0b3InIGlzIHRoZSBFSlNPTiBvYmplY3QgcmVwcmVzZW50aW5nIGEgc2VsZWN0b3Jcbi8vICAtIGEgJ21hdGNoZXInIGlzIGl0cyBjb21waWxlZCBmb3JtICh3aGV0aGVyIGEgZnVsbCBNaW5pbW9uZ28uTWF0Y2hlclxuLy8gICAgb2JqZWN0IG9yIG9uZSBvZiB0aGUgY29tcG9uZW50IGxhbWJkYXMgdGhhdCBtYXRjaGVzIHBhcnRzIG9mIGl0KVxuLy8gIC0gYSAncmVzdWx0IG9iamVjdCcgaXMgYW4gb2JqZWN0IHdpdGggYSAncmVzdWx0JyBmaWVsZCBhbmQgbWF5YmVcbi8vICAgIGRpc3RhbmNlIGFuZCBhcnJheUluZGljZXMuXG4vLyAgLSBhICdicmFuY2hlZCB2YWx1ZScgaXMgYW4gb2JqZWN0IHdpdGggYSAndmFsdWUnIGZpZWxkIGFuZCBtYXliZVxuLy8gICAgJ2RvbnRJdGVyYXRlJyBhbmQgJ2FycmF5SW5kaWNlcycuXG4vLyAgLSBhICdkb2N1bWVudCcgaXMgYSB0b3AtbGV2ZWwgb2JqZWN0IHRoYXQgY2FuIGJlIHN0b3JlZCBpbiBhIGNvbGxlY3Rpb24uXG4vLyAgLSBhICdsb29rdXAgZnVuY3Rpb24nIGlzIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBpbiBhIGRvY3VtZW50IGFuZCByZXR1cm5zXG4vLyAgICBhbiBhcnJheSBvZiAnYnJhbmNoZWQgdmFsdWVzJy5cbi8vICAtIGEgJ2JyYW5jaGVkIG1hdGNoZXInIG1hcHMgZnJvbSBhbiBhcnJheSBvZiBicmFuY2hlZCB2YWx1ZXMgdG8gYSByZXN1bHRcbi8vICAgIG9iamVjdC5cbi8vICAtIGFuICdlbGVtZW50IG1hdGNoZXInIG1hcHMgZnJvbSBhIHNpbmdsZSB2YWx1ZSB0byBhIGJvb2wuXG5cbi8vIE1haW4gZW50cnkgcG9pbnQuXG4vLyAgIHZhciBtYXRjaGVyID0gbmV3IE1pbmltb25nby5NYXRjaGVyKHthOiB7JGd0OiA1fX0pO1xuLy8gICBpZiAobWF0Y2hlci5kb2N1bWVudE1hdGNoZXMoe2E6IDd9KSkgLi4uXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYXRjaGVyIHtcbiAgY29uc3RydWN0b3Ioc2VsZWN0b3IsIGlzVXBkYXRlKSB7XG4gICAgLy8gQSBzZXQgKG9iamVjdCBtYXBwaW5nIHN0cmluZyAtPiAqKSBvZiBhbGwgb2YgdGhlIGRvY3VtZW50IHBhdGhzIGxvb2tlZFxuICAgIC8vIGF0IGJ5IHRoZSBzZWxlY3Rvci4gQWxzbyBpbmNsdWRlcyB0aGUgZW1wdHkgc3RyaW5nIGlmIGl0IG1heSBsb29rIGF0IGFueVxuICAgIC8vIHBhdGggKGVnLCAkd2hlcmUpLlxuICAgIHRoaXMuX3BhdGhzID0ge307XG4gICAgLy8gU2V0IHRvIHRydWUgaWYgY29tcGlsYXRpb24gZmluZHMgYSAkbmVhci5cbiAgICB0aGlzLl9oYXNHZW9RdWVyeSA9IGZhbHNlO1xuICAgIC8vIFNldCB0byB0cnVlIGlmIGNvbXBpbGF0aW9uIGZpbmRzIGEgJHdoZXJlLlxuICAgIHRoaXMuX2hhc1doZXJlID0gZmFsc2U7XG4gICAgLy8gU2V0IHRvIGZhbHNlIGlmIGNvbXBpbGF0aW9uIGZpbmRzIGFueXRoaW5nIG90aGVyIHRoYW4gYSBzaW1wbGUgZXF1YWxpdHlcbiAgICAvLyBvciBvbmUgb3IgbW9yZSBvZiAnJGd0JywgJyRndGUnLCAnJGx0JywgJyRsdGUnLCAnJG5lJywgJyRpbicsICckbmluJyB1c2VkXG4gICAgLy8gd2l0aCBzY2FsYXJzIGFzIG9wZXJhbmRzLlxuICAgIHRoaXMuX2lzU2ltcGxlID0gdHJ1ZTtcbiAgICAvLyBTZXQgdG8gYSBkdW1teSBkb2N1bWVudCB3aGljaCBhbHdheXMgbWF0Y2hlcyB0aGlzIE1hdGNoZXIuIE9yIHNldCB0byBudWxsXG4gICAgLy8gaWYgc3VjaCBkb2N1bWVudCBpcyB0b28gaGFyZCB0byBmaW5kLlxuICAgIHRoaXMuX21hdGNoaW5nRG9jdW1lbnQgPSB1bmRlZmluZWQ7XG4gICAgLy8gQSBjbG9uZSBvZiB0aGUgb3JpZ2luYWwgc2VsZWN0b3IuIEl0IG1heSBqdXN0IGJlIGEgZnVuY3Rpb24gaWYgdGhlIHVzZXJcbiAgICAvLyBwYXNzZWQgaW4gYSBmdW5jdGlvbjsgb3RoZXJ3aXNlIGlzIGRlZmluaXRlbHkgYW4gb2JqZWN0IChlZywgSURzIGFyZVxuICAgIC8vIHRyYW5zbGF0ZWQgaW50byB7X2lkOiBJRH0gZmlyc3QuIFVzZWQgYnkgY2FuQmVjb21lVHJ1ZUJ5TW9kaWZpZXIgYW5kXG4gICAgLy8gU29ydGVyLl91c2VXaXRoTWF0Y2hlci5cbiAgICB0aGlzLl9zZWxlY3RvciA9IG51bGw7XG4gICAgdGhpcy5fZG9jTWF0Y2hlciA9IHRoaXMuX2NvbXBpbGVTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgLy8gU2V0IHRvIHRydWUgaWYgc2VsZWN0aW9uIGlzIGRvbmUgZm9yIGFuIHVwZGF0ZSBvcGVyYXRpb25cbiAgICAvLyBEZWZhdWx0IGlzIGZhbHNlXG4gICAgLy8gVXNlZCBmb3IgJG5lYXIgYXJyYXkgdXBkYXRlIChpc3N1ZSAjMzU5OSlcbiAgICB0aGlzLl9pc1VwZGF0ZSA9IGlzVXBkYXRlO1xuICB9XG5cbiAgZG9jdW1lbnRNYXRjaGVzKGRvYykge1xuICAgIGlmIChkb2MgIT09IE9iamVjdChkb2MpKSB7XG4gICAgICB0aHJvdyBFcnJvcignZG9jdW1lbnRNYXRjaGVzIG5lZWRzIGEgZG9jdW1lbnQnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZG9jTWF0Y2hlcihkb2MpO1xuICB9XG5cbiAgaGFzR2VvUXVlcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hhc0dlb1F1ZXJ5O1xuICB9XG5cbiAgaGFzV2hlcmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hhc1doZXJlO1xuICB9XG5cbiAgaXNTaW1wbGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzU2ltcGxlO1xuICB9XG5cbiAgLy8gR2l2ZW4gYSBzZWxlY3RvciwgcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBvbmUgYXJndW1lbnQsIGFcbiAgLy8gZG9jdW1lbnQuIEl0IHJldHVybnMgYSByZXN1bHQgb2JqZWN0LlxuICBfY29tcGlsZVNlbGVjdG9yKHNlbGVjdG9yKSB7XG4gICAgLy8geW91IGNhbiBwYXNzIGEgbGl0ZXJhbCBmdW5jdGlvbiBpbnN0ZWFkIG9mIGEgc2VsZWN0b3JcbiAgICBpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgdGhpcy5faXNTaW1wbGUgPSBmYWxzZTtcbiAgICAgIHRoaXMuX3NlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgICB0aGlzLl9yZWNvcmRQYXRoVXNlZCgnJyk7XG5cbiAgICAgIHJldHVybiBkb2MgPT4gKHtyZXN1bHQ6ICEhc2VsZWN0b3IuY2FsbChkb2MpfSk7XG4gICAgfVxuXG4gICAgLy8gc2hvcnRoYW5kIC0tIHNjYWxhciBfaWRcbiAgICBpZiAoTG9jYWxDb2xsZWN0aW9uLl9zZWxlY3RvcklzSWQoc2VsZWN0b3IpKSB7XG4gICAgICB0aGlzLl9zZWxlY3RvciA9IHtfaWQ6IHNlbGVjdG9yfTtcbiAgICAgIHRoaXMuX3JlY29yZFBhdGhVc2VkKCdfaWQnKTtcblxuICAgICAgcmV0dXJuIGRvYyA9PiAoe3Jlc3VsdDogRUpTT04uZXF1YWxzKGRvYy5faWQsIHNlbGVjdG9yKX0pO1xuICAgIH1cblxuICAgIC8vIHByb3RlY3QgYWdhaW5zdCBkYW5nZXJvdXMgc2VsZWN0b3JzLiAgZmFsc2V5IGFuZCB7X2lkOiBmYWxzZXl9IGFyZSBib3RoXG4gICAgLy8gbGlrZWx5IHByb2dyYW1tZXIgZXJyb3IsIGFuZCBub3Qgd2hhdCB5b3Ugd2FudCwgcGFydGljdWxhcmx5IGZvclxuICAgIC8vIGRlc3RydWN0aXZlIG9wZXJhdGlvbnMuXG4gICAgaWYgKCFzZWxlY3RvciB8fCBoYXNPd24uY2FsbChzZWxlY3RvciwgJ19pZCcpICYmICFzZWxlY3Rvci5faWQpIHtcbiAgICAgIHRoaXMuX2lzU2ltcGxlID0gZmFsc2U7XG4gICAgICByZXR1cm4gbm90aGluZ01hdGNoZXI7XG4gICAgfVxuXG4gICAgLy8gVG9wIGxldmVsIGNhbid0IGJlIGFuIGFycmF5IG9yIHRydWUgb3IgYmluYXJ5LlxuICAgIGlmIChBcnJheS5pc0FycmF5KHNlbGVjdG9yKSB8fFxuICAgICAgICBFSlNPTi5pc0JpbmFyeShzZWxlY3RvcikgfHxcbiAgICAgICAgdHlwZW9mIHNlbGVjdG9yID09PSAnYm9vbGVhbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZWxlY3RvcjogJHtzZWxlY3Rvcn1gKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zZWxlY3RvciA9IEVKU09OLmNsb25lKHNlbGVjdG9yKTtcblxuICAgIHJldHVybiBjb21waWxlRG9jdW1lbnRTZWxlY3RvcihzZWxlY3RvciwgdGhpcywge2lzUm9vdDogdHJ1ZX0pO1xuICB9XG5cbiAgLy8gUmV0dXJucyBhIGxpc3Qgb2Yga2V5IHBhdGhzIHRoZSBnaXZlbiBzZWxlY3RvciBpcyBsb29raW5nIGZvci4gSXQgaW5jbHVkZXNcbiAgLy8gdGhlIGVtcHR5IHN0cmluZyBpZiB0aGVyZSBpcyBhICR3aGVyZS5cbiAgX2dldFBhdGhzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLl9wYXRocyk7XG4gIH1cblxuICBfcmVjb3JkUGF0aFVzZWQocGF0aCkge1xuICAgIHRoaXMuX3BhdGhzW3BhdGhdID0gdHJ1ZTtcbiAgfVxufVxuXG4vLyBoZWxwZXJzIHVzZWQgYnkgY29tcGlsZWQgc2VsZWN0b3IgY29kZVxuTG9jYWxDb2xsZWN0aW9uLl9mID0ge1xuICAvLyBYWFggZm9yIF9hbGwgYW5kIF9pbiwgY29uc2lkZXIgYnVpbGRpbmcgJ2lucXVlcnknIGF0IGNvbXBpbGUgdGltZS4uXG4gIF90eXBlKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHYgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gMjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHYgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuIDg7XG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICAgIHJldHVybiA0O1xuICAgIH1cblxuICAgIGlmICh2ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gMTA7XG4gICAgfVxuXG4gICAgLy8gbm90ZSB0aGF0IHR5cGVvZigveC8pID09PSBcIm9iamVjdFwiXG4gICAgaWYgKHYgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgIHJldHVybiAxMTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHYgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiAxMztcbiAgICB9XG5cbiAgICBpZiAodiBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgIHJldHVybiA5O1xuICAgIH1cblxuICAgIGlmIChFSlNPTi5pc0JpbmFyeSh2KSkge1xuICAgICAgcmV0dXJuIDU7XG4gICAgfVxuXG4gICAgaWYgKHYgaW5zdGFuY2VvZiBNb25nb0lELk9iamVjdElEKSB7XG4gICAgICByZXR1cm4gNztcbiAgICB9XG5cbiAgICBpZiAodiBpbnN0YW5jZW9mIERlY2ltYWwpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cblxuICAgIC8vIG9iamVjdFxuICAgIHJldHVybiAzO1xuXG4gICAgLy8gWFhYIHN1cHBvcnQgc29tZS9hbGwgb2YgdGhlc2U6XG4gICAgLy8gMTQsIHN5bWJvbFxuICAgIC8vIDE1LCBqYXZhc2NyaXB0IGNvZGUgd2l0aCBzY29wZVxuICAgIC8vIDE2LCAxODogMzItYml0LzY0LWJpdCBpbnRlZ2VyXG4gICAgLy8gMTcsIHRpbWVzdGFtcFxuICAgIC8vIDI1NSwgbWlua2V5XG4gICAgLy8gMTI3LCBtYXhrZXlcbiAgfSxcblxuICAvLyBkZWVwIGVxdWFsaXR5IHRlc3Q6IHVzZSBmb3IgbGl0ZXJhbCBkb2N1bWVudCBhbmQgYXJyYXkgbWF0Y2hlc1xuICBfZXF1YWwoYSwgYikge1xuICAgIHJldHVybiBFSlNPTi5lcXVhbHMoYSwgYiwge2tleU9yZGVyU2Vuc2l0aXZlOiB0cnVlfSk7XG4gIH0sXG5cbiAgLy8gbWFwcyBhIHR5cGUgY29kZSB0byBhIHZhbHVlIHRoYXQgY2FuIGJlIHVzZWQgdG8gc29ydCB2YWx1ZXMgb2YgZGlmZmVyZW50XG4gIC8vIHR5cGVzXG4gIF90eXBlb3JkZXIodCkge1xuICAgIC8vIGh0dHA6Ly93d3cubW9uZ29kYi5vcmcvZGlzcGxheS9ET0NTL1doYXQraXMrdGhlK0NvbXBhcmUrT3JkZXIrZm9yK0JTT04rVHlwZXNcbiAgICAvLyBYWFggd2hhdCBpcyB0aGUgY29ycmVjdCBzb3J0IHBvc2l0aW9uIGZvciBKYXZhc2NyaXB0IGNvZGU/XG4gICAgLy8gKCcxMDAnIGluIHRoZSBtYXRyaXggYmVsb3cpXG4gICAgLy8gWFhYIG1pbmtleS9tYXhrZXlcbiAgICByZXR1cm4gW1xuICAgICAgLTEsICAvLyAobm90IGEgdHlwZSlcbiAgICAgIDEsICAgLy8gbnVtYmVyXG4gICAgICAyLCAgIC8vIHN0cmluZ1xuICAgICAgMywgICAvLyBvYmplY3RcbiAgICAgIDQsICAgLy8gYXJyYXlcbiAgICAgIDUsICAgLy8gYmluYXJ5XG4gICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgIDYsICAgLy8gT2JqZWN0SURcbiAgICAgIDcsICAgLy8gYm9vbFxuICAgICAgOCwgICAvLyBEYXRlXG4gICAgICAwLCAgIC8vIG51bGxcbiAgICAgIDksICAgLy8gUmVnRXhwXG4gICAgICAtMSwgIC8vIGRlcHJlY2F0ZWRcbiAgICAgIDEwMCwgLy8gSlMgY29kZVxuICAgICAgMiwgICAvLyBkZXByZWNhdGVkIChzeW1ib2wpXG4gICAgICAxMDAsIC8vIEpTIGNvZGVcbiAgICAgIDEsICAgLy8gMzItYml0IGludFxuICAgICAgOCwgICAvLyBNb25nbyB0aW1lc3RhbXBcbiAgICAgIDEgICAgLy8gNjQtYml0IGludFxuICAgIF1bdF07XG4gIH0sXG5cbiAgLy8gY29tcGFyZSB0d28gdmFsdWVzIG9mIHVua25vd24gdHlwZSBhY2NvcmRpbmcgdG8gQlNPTiBvcmRlcmluZ1xuICAvLyBzZW1hbnRpY3MuIChhcyBhbiBleHRlbnNpb24sIGNvbnNpZGVyICd1bmRlZmluZWQnIHRvIGJlIGxlc3MgdGhhblxuICAvLyBhbnkgb3RoZXIgdmFsdWUuKSByZXR1cm4gbmVnYXRpdmUgaWYgYSBpcyBsZXNzLCBwb3NpdGl2ZSBpZiBiIGlzXG4gIC8vIGxlc3MsIG9yIDAgaWYgZXF1YWxcbiAgX2NtcChhLCBiKSB7XG4gICAgaWYgKGEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGIgPT09IHVuZGVmaW5lZCA/IDAgOiAtMTtcbiAgICB9XG5cbiAgICBpZiAoYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICBsZXQgdGEgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGUoYSk7XG4gICAgbGV0IHRiID0gTG9jYWxDb2xsZWN0aW9uLl9mLl90eXBlKGIpO1xuXG4gICAgY29uc3Qgb2EgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGVvcmRlcih0YSk7XG4gICAgY29uc3Qgb2IgPSBMb2NhbENvbGxlY3Rpb24uX2YuX3R5cGVvcmRlcih0Yik7XG5cbiAgICBpZiAob2EgIT09IG9iKSB7XG4gICAgICByZXR1cm4gb2EgPCBvYiA/IC0xIDogMTtcbiAgICB9XG5cbiAgICAvLyBYWFggbmVlZCB0byBpbXBsZW1lbnQgdGhpcyBpZiB3ZSBpbXBsZW1lbnQgU3ltYm9sIG9yIGludGVnZXJzLCBvclxuICAgIC8vIFRpbWVzdGFtcFxuICAgIGlmICh0YSAhPT0gdGIpIHtcbiAgICAgIHRocm93IEVycm9yKCdNaXNzaW5nIHR5cGUgY29lcmNpb24gbG9naWMgaW4gX2NtcCcpO1xuICAgIH1cblxuICAgIGlmICh0YSA9PT0gNykgeyAvLyBPYmplY3RJRFxuICAgICAgLy8gQ29udmVydCB0byBzdHJpbmcuXG4gICAgICB0YSA9IHRiID0gMjtcbiAgICAgIGEgPSBhLnRvSGV4U3RyaW5nKCk7XG4gICAgICBiID0gYi50b0hleFN0cmluZygpO1xuICAgIH1cblxuICAgIGlmICh0YSA9PT0gOSkgeyAvLyBEYXRlXG4gICAgICAvLyBDb252ZXJ0IHRvIG1pbGxpcy5cbiAgICAgIHRhID0gdGIgPSAxO1xuICAgICAgYSA9IGlzTmFOKGEpID8gMCA6IGEuZ2V0VGltZSgpO1xuICAgICAgYiA9IGlzTmFOKGIpID8gMCA6IGIuZ2V0VGltZSgpO1xuICAgIH1cblxuICAgIGlmICh0YSA9PT0gMSkgeyAvLyBkb3VibGVcbiAgICAgIGlmIChhIGluc3RhbmNlb2YgRGVjaW1hbCkge1xuICAgICAgICByZXR1cm4gYS5taW51cyhiKS50b051bWJlcigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGEgLSBiO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0YiA9PT0gMikgLy8gc3RyaW5nXG4gICAgICByZXR1cm4gYSA8IGIgPyAtMSA6IGEgPT09IGIgPyAwIDogMTtcblxuICAgIGlmICh0YSA9PT0gMykgeyAvLyBPYmplY3RcbiAgICAgIC8vIHRoaXMgY291bGQgYmUgbXVjaCBtb3JlIGVmZmljaWVudCBpbiB0aGUgZXhwZWN0ZWQgY2FzZSAuLi5cbiAgICAgIGNvbnN0IHRvQXJyYXkgPSBvYmplY3QgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBbXTtcblxuICAgICAgICBPYmplY3Qua2V5cyhvYmplY3QpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICByZXN1bHQucHVzaChrZXksIG9iamVjdFtrZXldKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcCh0b0FycmF5KGEpLCB0b0FycmF5KGIpKTtcbiAgICB9XG5cbiAgICBpZiAodGEgPT09IDQpIHsgLy8gQXJyYXlcbiAgICAgIGZvciAobGV0IGkgPSAwOyA7IGkrKykge1xuICAgICAgICBpZiAoaSA9PT0gYS5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gaSA9PT0gYi5sZW5ndGggPyAwIDogLTE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaSA9PT0gYi5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHMgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChhW2ldLCBiW2ldKTtcbiAgICAgICAgaWYgKHMgIT09IDApIHtcbiAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0YSA9PT0gNSkgeyAvLyBiaW5hcnlcbiAgICAgIC8vIFN1cnByaXNpbmdseSwgYSBzbWFsbCBiaW5hcnkgYmxvYiBpcyBhbHdheXMgbGVzcyB0aGFuIGEgbGFyZ2Ugb25lIGluXG4gICAgICAvLyBNb25nby5cbiAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGEubGVuZ3RoIC0gYi5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYVtpXSA8IGJbaV0pIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYVtpXSA+IGJbaV0pIHtcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBpZiAodGEgPT09IDgpIHsgLy8gYm9vbGVhblxuICAgICAgaWYgKGEpIHtcbiAgICAgICAgcmV0dXJuIGIgPyAwIDogMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGIgPyAtMSA6IDA7XG4gICAgfVxuXG4gICAgaWYgKHRhID09PSAxMCkgLy8gbnVsbFxuICAgICAgcmV0dXJuIDA7XG5cbiAgICBpZiAodGEgPT09IDExKSAvLyByZWdleHBcbiAgICAgIHRocm93IEVycm9yKCdTb3J0aW5nIG5vdCBzdXBwb3J0ZWQgb24gcmVndWxhciBleHByZXNzaW9uJyk7IC8vIFhYWFxuXG4gICAgLy8gMTM6IGphdmFzY3JpcHQgY29kZVxuICAgIC8vIDE0OiBzeW1ib2xcbiAgICAvLyAxNTogamF2YXNjcmlwdCBjb2RlIHdpdGggc2NvcGVcbiAgICAvLyAxNjogMzItYml0IGludGVnZXJcbiAgICAvLyAxNzogdGltZXN0YW1wXG4gICAgLy8gMTg6IDY0LWJpdCBpbnRlZ2VyXG4gICAgLy8gMjU1OiBtaW5rZXlcbiAgICAvLyAxMjc6IG1heGtleVxuICAgIGlmICh0YSA9PT0gMTMpIC8vIGphdmFzY3JpcHQgY29kZVxuICAgICAgdGhyb3cgRXJyb3IoJ1NvcnRpbmcgbm90IHN1cHBvcnRlZCBvbiBKYXZhc2NyaXB0IGNvZGUnKTsgLy8gWFhYXG5cbiAgICB0aHJvdyBFcnJvcignVW5rbm93biB0eXBlIHRvIHNvcnQnKTtcbiAgfSxcbn07XG4iLCJpbXBvcnQgTG9jYWxDb2xsZWN0aW9uXyBmcm9tICcuL2xvY2FsX2NvbGxlY3Rpb24uanMnO1xuaW1wb3J0IE1hdGNoZXIgZnJvbSAnLi9tYXRjaGVyLmpzJztcbmltcG9ydCBTb3J0ZXIgZnJvbSAnLi9zb3J0ZXIuanMnO1xuXG5Mb2NhbENvbGxlY3Rpb24gPSBMb2NhbENvbGxlY3Rpb25fO1xuTWluaW1vbmdvID0ge1xuICAgIExvY2FsQ29sbGVjdGlvbjogTG9jYWxDb2xsZWN0aW9uXyxcbiAgICBNYXRjaGVyLFxuICAgIFNvcnRlclxufTtcbiIsIi8vIE9ic2VydmVIYW5kbGU6IHRoZSByZXR1cm4gdmFsdWUgb2YgYSBsaXZlIHF1ZXJ5LlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzZXJ2ZUhhbmRsZSB7fVxuIiwiaW1wb3J0IHtcbiAgRUxFTUVOVF9PUEVSQVRPUlMsXG4gIGVxdWFsaXR5RWxlbWVudE1hdGNoZXIsXG4gIGV4cGFuZEFycmF5c0luQnJhbmNoZXMsXG4gIGhhc093bixcbiAgaXNPcGVyYXRvck9iamVjdCxcbiAgbWFrZUxvb2t1cEZ1bmN0aW9uLFxuICByZWdleHBFbGVtZW50TWF0Y2hlcixcbn0gZnJvbSAnLi9jb21tb24uanMnO1xuXG4vLyBHaXZlIGEgc29ydCBzcGVjLCB3aGljaCBjYW4gYmUgaW4gYW55IG9mIHRoZXNlIGZvcm1zOlxuLy8gICB7XCJrZXkxXCI6IDEsIFwia2V5MlwiOiAtMX1cbi8vICAgW1tcImtleTFcIiwgXCJhc2NcIl0sIFtcImtleTJcIiwgXCJkZXNjXCJdXVxuLy8gICBbXCJrZXkxXCIsIFtcImtleTJcIiwgXCJkZXNjXCJdXVxuLy9cbi8vICguLiB3aXRoIHRoZSBmaXJzdCBmb3JtIGJlaW5nIGRlcGVuZGVudCBvbiB0aGUga2V5IGVudW1lcmF0aW9uXG4vLyBiZWhhdmlvciBvZiB5b3VyIGphdmFzY3JpcHQgVk0sIHdoaWNoIHVzdWFsbHkgZG9lcyB3aGF0IHlvdSBtZWFuIGluXG4vLyB0aGlzIGNhc2UgaWYgdGhlIGtleSBuYW1lcyBkb24ndCBsb29rIGxpa2UgaW50ZWdlcnMgLi4pXG4vL1xuLy8gcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyB0d28gb2JqZWN0cywgYW5kIHJldHVybnMgLTEgaWYgdGhlXG4vLyBmaXJzdCBvYmplY3QgY29tZXMgZmlyc3QgaW4gb3JkZXIsIDEgaWYgdGhlIHNlY29uZCBvYmplY3QgY29tZXNcbi8vIGZpcnN0LCBvciAwIGlmIG5laXRoZXIgb2JqZWN0IGNvbWVzIGJlZm9yZSB0aGUgb3RoZXIuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNvcnRlciB7XG4gIGNvbnN0cnVjdG9yKHNwZWMpIHtcbiAgICB0aGlzLl9zb3J0U3BlY1BhcnRzID0gW107XG4gICAgdGhpcy5fc29ydEZ1bmN0aW9uID0gbnVsbDtcblxuICAgIGNvbnN0IGFkZFNwZWNQYXJ0ID0gKHBhdGgsIGFzY2VuZGluZykgPT4ge1xuICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdzb3J0IGtleXMgbXVzdCBiZSBub24tZW1wdHknKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHBhdGguY2hhckF0KDApID09PSAnJCcpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoYHVuc3VwcG9ydGVkIHNvcnQga2V5OiAke3BhdGh9YCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3NvcnRTcGVjUGFydHMucHVzaCh7XG4gICAgICAgIGFzY2VuZGluZyxcbiAgICAgICAgbG9va3VwOiBtYWtlTG9va3VwRnVuY3Rpb24ocGF0aCwge2ZvclNvcnQ6IHRydWV9KSxcbiAgICAgICAgcGF0aFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGlmIChzcGVjIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIHNwZWMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGFkZFNwZWNQYXJ0KGVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFkZFNwZWNQYXJ0KGVsZW1lbnRbMF0sIGVsZW1lbnRbMV0gIT09ICdkZXNjJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNwZWMgPT09ICdvYmplY3QnKSB7XG4gICAgICBPYmplY3Qua2V5cyhzcGVjKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGFkZFNwZWNQYXJ0KGtleSwgc3BlY1trZXldID49IDApO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3BlYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5fc29ydEZ1bmN0aW9uID0gc3BlYztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoYEJhZCBzb3J0IHNwZWNpZmljYXRpb246ICR7SlNPTi5zdHJpbmdpZnkoc3BlYyl9YCk7XG4gICAgfVxuXG4gICAgLy8gSWYgYSBmdW5jdGlvbiBpcyBzcGVjaWZpZWQgZm9yIHNvcnRpbmcsIHdlIHNraXAgdGhlIHJlc3QuXG4gICAgaWYgKHRoaXMuX3NvcnRGdW5jdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRvIGltcGxlbWVudCBhZmZlY3RlZEJ5TW9kaWZpZXIsIHdlIHBpZ2d5LWJhY2sgb24gdG9wIG9mIE1hdGNoZXInc1xuICAgIC8vIGFmZmVjdGVkQnlNb2RpZmllciBjb2RlOyB3ZSBjcmVhdGUgYSBzZWxlY3RvciB0aGF0IGlzIGFmZmVjdGVkIGJ5IHRoZVxuICAgIC8vIHNhbWUgbW9kaWZpZXJzIGFzIHRoaXMgc29ydCBvcmRlci4gVGhpcyBpcyBvbmx5IGltcGxlbWVudGVkIG9uIHRoZVxuICAgIC8vIHNlcnZlci5cbiAgICBpZiAodGhpcy5hZmZlY3RlZEJ5TW9kaWZpZXIpIHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yID0ge307XG5cbiAgICAgIHRoaXMuX3NvcnRTcGVjUGFydHMuZm9yRWFjaChzcGVjID0+IHtcbiAgICAgICAgc2VsZWN0b3Jbc3BlYy5wYXRoXSA9IDE7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5fc2VsZWN0b3JGb3JBZmZlY3RlZEJ5TW9kaWZpZXIgPSBuZXcgTWluaW1vbmdvLk1hdGNoZXIoc2VsZWN0b3IpO1xuICAgIH1cblxuICAgIHRoaXMuX2tleUNvbXBhcmF0b3IgPSBjb21wb3NlQ29tcGFyYXRvcnMoXG4gICAgICB0aGlzLl9zb3J0U3BlY1BhcnRzLm1hcCgoc3BlYywgaSkgPT4gdGhpcy5fa2V5RmllbGRDb21wYXJhdG9yKGkpKVxuICAgICk7XG4gIH1cblxuICBnZXRDb21wYXJhdG9yKG9wdGlvbnMpIHtcbiAgICAvLyBJZiBzb3J0IGlzIHNwZWNpZmllZCBvciBoYXZlIG5vIGRpc3RhbmNlcywganVzdCB1c2UgdGhlIGNvbXBhcmF0b3IgZnJvbVxuICAgIC8vIHRoZSBzb3VyY2Ugc3BlY2lmaWNhdGlvbiAod2hpY2ggZGVmYXVsdHMgdG8gXCJldmVyeXRoaW5nIGlzIGVxdWFsXCIuXG4gICAgLy8gaXNzdWUgIzM1OTlcbiAgICAvLyBodHRwczovL2RvY3MubW9uZ29kYi5jb20vbWFudWFsL3JlZmVyZW5jZS9vcGVyYXRvci9xdWVyeS9uZWFyLyNzb3J0LW9wZXJhdGlvblxuICAgIC8vIHNvcnQgZWZmZWN0aXZlbHkgb3ZlcnJpZGVzICRuZWFyXG4gICAgaWYgKHRoaXMuX3NvcnRTcGVjUGFydHMubGVuZ3RoIHx8ICFvcHRpb25zIHx8ICFvcHRpb25zLmRpc3RhbmNlcykge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldEJhc2VDb21wYXJhdG9yKCk7XG4gICAgfVxuXG4gICAgY29uc3QgZGlzdGFuY2VzID0gb3B0aW9ucy5kaXN0YW5jZXM7XG5cbiAgICAvLyBSZXR1cm4gYSBjb21wYXJhdG9yIHdoaWNoIGNvbXBhcmVzIHVzaW5nICRuZWFyIGRpc3RhbmNlcy5cbiAgICByZXR1cm4gKGEsIGIpID0+IHtcbiAgICAgIGlmICghZGlzdGFuY2VzLmhhcyhhLl9pZCkpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoYE1pc3NpbmcgZGlzdGFuY2UgZm9yICR7YS5faWR9YCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghZGlzdGFuY2VzLmhhcyhiLl9pZCkpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoYE1pc3NpbmcgZGlzdGFuY2UgZm9yICR7Yi5faWR9YCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkaXN0YW5jZXMuZ2V0KGEuX2lkKSAtIGRpc3RhbmNlcy5nZXQoYi5faWQpO1xuICAgIH07XG4gIH1cblxuICAvLyBUYWtlcyBpbiB0d28ga2V5czogYXJyYXlzIHdob3NlIGxlbmd0aHMgbWF0Y2ggdGhlIG51bWJlciBvZiBzcGVjXG4gIC8vIHBhcnRzLiBSZXR1cm5zIG5lZ2F0aXZlLCAwLCBvciBwb3NpdGl2ZSBiYXNlZCBvbiB1c2luZyB0aGUgc29ydCBzcGVjIHRvXG4gIC8vIGNvbXBhcmUgZmllbGRzLlxuICBfY29tcGFyZUtleXMoa2V5MSwga2V5Mikge1xuICAgIGlmIChrZXkxLmxlbmd0aCAhPT0gdGhpcy5fc29ydFNwZWNQYXJ0cy5sZW5ndGggfHxcbiAgICAgICAga2V5Mi5sZW5ndGggIT09IHRoaXMuX3NvcnRTcGVjUGFydHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBFcnJvcignS2V5IGhhcyB3cm9uZyBsZW5ndGgnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fa2V5Q29tcGFyYXRvcihrZXkxLCBrZXkyKTtcbiAgfVxuXG4gIC8vIEl0ZXJhdGVzIG92ZXIgZWFjaCBwb3NzaWJsZSBcImtleVwiIGZyb20gZG9jIChpZSwgb3ZlciBlYWNoIGJyYW5jaCksIGNhbGxpbmdcbiAgLy8gJ2NiJyB3aXRoIHRoZSBrZXkuXG4gIF9nZW5lcmF0ZUtleXNGcm9tRG9jKGRvYywgY2IpIHtcbiAgICBpZiAodGhpcy5fc29ydFNwZWNQYXJ0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignY2FuXFwndCBnZW5lcmF0ZSBrZXlzIHdpdGhvdXQgYSBzcGVjJyk7XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aEZyb21JbmRpY2VzID0gaW5kaWNlcyA9PiBgJHtpbmRpY2VzLmpvaW4oJywnKX0sYDtcblxuICAgIGxldCBrbm93blBhdGhzID0gbnVsbDtcblxuICAgIC8vIG1hcHMgaW5kZXggLT4gKHsnJyAtPiB2YWx1ZX0gb3Ige3BhdGggLT4gdmFsdWV9KVxuICAgIGNvbnN0IHZhbHVlc0J5SW5kZXhBbmRQYXRoID0gdGhpcy5fc29ydFNwZWNQYXJ0cy5tYXAoc3BlYyA9PiB7XG4gICAgICAvLyBFeHBhbmQgYW55IGxlYWYgYXJyYXlzIHRoYXQgd2UgZmluZCwgYW5kIGlnbm9yZSB0aG9zZSBhcnJheXNcbiAgICAgIC8vIHRoZW1zZWx2ZXMuICAoV2UgbmV2ZXIgc29ydCBiYXNlZCBvbiBhbiBhcnJheSBpdHNlbGYuKVxuICAgICAgbGV0IGJyYW5jaGVzID0gZXhwYW5kQXJyYXlzSW5CcmFuY2hlcyhzcGVjLmxvb2t1cChkb2MpLCB0cnVlKTtcblxuICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIHZhbHVlcyBmb3IgYSBrZXkgKGVnLCBrZXkgZ29lcyB0byBhbiBlbXB0eSBhcnJheSksXG4gICAgICAvLyBwcmV0ZW5kIHdlIGZvdW5kIG9uZSB1bmRlZmluZWQgdmFsdWUuXG4gICAgICBpZiAoIWJyYW5jaGVzLmxlbmd0aCkge1xuICAgICAgICBicmFuY2hlcyA9IFt7IHZhbHVlOiB2b2lkIDAgfV07XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgbGV0IHVzZWRQYXRocyA9IGZhbHNlO1xuXG4gICAgICBicmFuY2hlcy5mb3JFYWNoKGJyYW5jaCA9PiB7XG4gICAgICAgIGlmICghYnJhbmNoLmFycmF5SW5kaWNlcykge1xuICAgICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBhcnJheSBpbmRpY2VzIGZvciBhIGJyYW5jaCwgdGhlbiBpdCBtdXN0IGJlIHRoZVxuICAgICAgICAgIC8vIG9ubHkgYnJhbmNoLCBiZWNhdXNlIHRoZSBvbmx5IHRoaW5nIHRoYXQgcHJvZHVjZXMgbXVsdGlwbGUgYnJhbmNoZXNcbiAgICAgICAgICAvLyBpcyB0aGUgdXNlIG9mIGFycmF5cy5cbiAgICAgICAgICBpZiAoYnJhbmNoZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ211bHRpcGxlIGJyYW5jaGVzIGJ1dCBubyBhcnJheSB1c2VkPycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsZW1lbnRbJyddID0gYnJhbmNoLnZhbHVlO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHVzZWRQYXRocyA9IHRydWU7XG5cbiAgICAgICAgY29uc3QgcGF0aCA9IHBhdGhGcm9tSW5kaWNlcyhicmFuY2guYXJyYXlJbmRpY2VzKTtcblxuICAgICAgICBpZiAoaGFzT3duLmNhbGwoZWxlbWVudCwgcGF0aCkpIHtcbiAgICAgICAgICB0aHJvdyBFcnJvcihgZHVwbGljYXRlIHBhdGg6ICR7cGF0aH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnRbcGF0aF0gPSBicmFuY2gudmFsdWU7XG5cbiAgICAgICAgLy8gSWYgdHdvIHNvcnQgZmllbGRzIGJvdGggZ28gaW50byBhcnJheXMsIHRoZXkgaGF2ZSB0byBnbyBpbnRvIHRoZVxuICAgICAgICAvLyBleGFjdCBzYW1lIGFycmF5cyBhbmQgd2UgaGF2ZSB0byBmaW5kIHRoZSBzYW1lIHBhdGhzLiAgVGhpcyBpc1xuICAgICAgICAvLyByb3VnaGx5IHRoZSBzYW1lIGNvbmRpdGlvbiB0aGF0IG1ha2VzIE1vbmdvREIgdGhyb3cgdGhpcyBzdHJhbmdlXG4gICAgICAgIC8vIGVycm9yIG1lc3NhZ2UuICBlZywgdGhlIG1haW4gdGhpbmcgaXMgdGhhdCBpZiBzb3J0IHNwZWMgaXMge2E6IDEsXG4gICAgICAgIC8vIGI6MX0gdGhlbiBhIGFuZCBiIGNhbm5vdCBib3RoIGJlIGFycmF5cy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gKEluIE1vbmdvREIgaXQgc2VlbXMgdG8gYmUgT0sgdG8gaGF2ZSB7YTogMSwgJ2EueC55JzogMX0gd2hlcmUgJ2EnXG4gICAgICAgIC8vIGFuZCAnYS54LnknIGFyZSBib3RoIGFycmF5cywgYnV0IHdlIGRvbid0IGFsbG93IHRoaXMgZm9yIG5vdy5cbiAgICAgICAgLy8gI05lc3RlZEFycmF5U29ydFxuICAgICAgICAvLyBYWFggYWNoaWV2ZSBmdWxsIGNvbXBhdGliaWxpdHkgaGVyZVxuICAgICAgICBpZiAoa25vd25QYXRocyAmJiAhaGFzT3duLmNhbGwoa25vd25QYXRocywgcGF0aCkpIHtcbiAgICAgICAgICB0aHJvdyBFcnJvcignY2Fubm90IGluZGV4IHBhcmFsbGVsIGFycmF5cycpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKGtub3duUGF0aHMpIHtcbiAgICAgICAgLy8gU2ltaWxhcmx5IHRvIGFib3ZlLCBwYXRocyBtdXN0IG1hdGNoIGV2ZXJ5d2hlcmUsIHVubGVzcyB0aGlzIGlzIGFcbiAgICAgICAgLy8gbm9uLWFycmF5IGZpZWxkLlxuICAgICAgICBpZiAoIWhhc093bi5jYWxsKGVsZW1lbnQsICcnKSAmJlxuICAgICAgICAgICAgT2JqZWN0LmtleXMoa25vd25QYXRocykubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhlbGVtZW50KS5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyBFcnJvcignY2Fubm90IGluZGV4IHBhcmFsbGVsIGFycmF5cyEnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh1c2VkUGF0aHMpIHtcbiAgICAgICAga25vd25QYXRocyA9IHt9O1xuXG4gICAgICAgIE9iamVjdC5rZXlzKGVsZW1lbnQpLmZvckVhY2gocGF0aCA9PiB7XG4gICAgICAgICAga25vd25QYXRoc1twYXRoXSA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9KTtcblxuICAgIGlmICgha25vd25QYXRocykge1xuICAgICAgLy8gRWFzeSBjYXNlOiBubyB1c2Ugb2YgYXJyYXlzLlxuICAgICAgY29uc3Qgc29sZUtleSA9IHZhbHVlc0J5SW5kZXhBbmRQYXRoLm1hcCh2YWx1ZXMgPT4ge1xuICAgICAgICBpZiAoIWhhc093bi5jYWxsKHZhbHVlcywgJycpKSB7XG4gICAgICAgICAgdGhyb3cgRXJyb3IoJ25vIHZhbHVlIGluIHNvbGUga2V5IGNhc2U/Jyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWVzWycnXTtcbiAgICAgIH0pO1xuXG4gICAgICBjYihzb2xlS2V5KTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIE9iamVjdC5rZXlzKGtub3duUGF0aHMpLmZvckVhY2gocGF0aCA9PiB7XG4gICAgICBjb25zdCBrZXkgPSB2YWx1ZXNCeUluZGV4QW5kUGF0aC5tYXAodmFsdWVzID0+IHtcbiAgICAgICAgaWYgKGhhc093bi5jYWxsKHZhbHVlcywgJycpKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlc1snJ107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWhhc093bi5jYWxsKHZhbHVlcywgcGF0aCkpIHtcbiAgICAgICAgICB0aHJvdyBFcnJvcignbWlzc2luZyBwYXRoPycpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlc1twYXRoXTtcbiAgICAgIH0pO1xuXG4gICAgICBjYihrZXkpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gUmV0dXJucyBhIGNvbXBhcmF0b3IgdGhhdCByZXByZXNlbnRzIHRoZSBzb3J0IHNwZWNpZmljYXRpb24gKGJ1dCBub3RcbiAgLy8gaW5jbHVkaW5nIGEgcG9zc2libGUgZ2VvcXVlcnkgZGlzdGFuY2UgdGllLWJyZWFrZXIpLlxuICBfZ2V0QmFzZUNvbXBhcmF0b3IoKSB7XG4gICAgaWYgKHRoaXMuX3NvcnRGdW5jdGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMuX3NvcnRGdW5jdGlvbjtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSdyZSBvbmx5IHNvcnRpbmcgb24gZ2VvcXVlcnkgZGlzdGFuY2UgYW5kIG5vIHNwZWNzLCBqdXN0IHNheVxuICAgIC8vIGV2ZXJ5dGhpbmcgaXMgZXF1YWwuXG4gICAgaWYgKCF0aGlzLl9zb3J0U3BlY1BhcnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIChkb2MxLCBkb2MyKSA9PiAwO1xuICAgIH1cblxuICAgIHJldHVybiAoZG9jMSwgZG9jMikgPT4ge1xuICAgICAgY29uc3Qga2V5MSA9IHRoaXMuX2dldE1pbktleUZyb21Eb2MoZG9jMSk7XG4gICAgICBjb25zdCBrZXkyID0gdGhpcy5fZ2V0TWluS2V5RnJvbURvYyhkb2MyKTtcbiAgICAgIHJldHVybiB0aGlzLl9jb21wYXJlS2V5cyhrZXkxLCBrZXkyKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gRmluZHMgdGhlIG1pbmltdW0ga2V5IGZyb20gdGhlIGRvYywgYWNjb3JkaW5nIHRvIHRoZSBzb3J0IHNwZWNzLiAgKFdlIHNheVxuICAvLyBcIm1pbmltdW1cIiBoZXJlIGJ1dCB0aGlzIGlzIHdpdGggcmVzcGVjdCB0byB0aGUgc29ydCBzcGVjLCBzbyBcImRlc2NlbmRpbmdcIlxuICAvLyBzb3J0IGZpZWxkcyBtZWFuIHdlJ3JlIGZpbmRpbmcgdGhlIG1heCBmb3IgdGhhdCBmaWVsZC4pXG4gIC8vXG4gIC8vIE5vdGUgdGhhdCB0aGlzIGlzIE5PVCBcImZpbmQgdGhlIG1pbmltdW0gdmFsdWUgb2YgdGhlIGZpcnN0IGZpZWxkLCB0aGVcbiAgLy8gbWluaW11bSB2YWx1ZSBvZiB0aGUgc2Vjb25kIGZpZWxkLCBldGNcIi4uLiBpdCdzIFwiY2hvb3NlIHRoZVxuICAvLyBsZXhpY29ncmFwaGljYWxseSBtaW5pbXVtIHZhbHVlIG9mIHRoZSBrZXkgdmVjdG9yLCBhbGxvd2luZyBvbmx5IGtleXMgd2hpY2hcbiAgLy8geW91IGNhbiBmaW5kIGFsb25nIHRoZSBzYW1lIHBhdGhzXCIuICBpZSwgZm9yIGEgZG9jIHthOiBbe3g6IDAsIHk6IDV9LCB7eDpcbiAgLy8gMSwgeTogM31dfSB3aXRoIHNvcnQgc3BlYyB7J2EueCc6IDEsICdhLnknOiAxfSwgdGhlIG9ubHkga2V5cyBhcmUgWzAsNV0gYW5kXG4gIC8vIFsxLDNdLCBhbmQgdGhlIG1pbmltdW0ga2V5IGlzIFswLDVdOyBub3RhYmx5LCBbMCwzXSBpcyBOT1QgYSBrZXkuXG4gIF9nZXRNaW5LZXlGcm9tRG9jKGRvYykge1xuICAgIGxldCBtaW5LZXkgPSBudWxsO1xuXG4gICAgdGhpcy5fZ2VuZXJhdGVLZXlzRnJvbURvYyhkb2MsIGtleSA9PiB7XG4gICAgICBpZiAobWluS2V5ID09PSBudWxsKSB7XG4gICAgICAgIG1pbktleSA9IGtleTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fY29tcGFyZUtleXMoa2V5LCBtaW5LZXkpIDwgMCkge1xuICAgICAgICBtaW5LZXkgPSBrZXk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWluS2V5O1xuICB9XG5cbiAgX2dldFBhdGhzKCkge1xuICAgIHJldHVybiB0aGlzLl9zb3J0U3BlY1BhcnRzLm1hcChwYXJ0ID0+IHBhcnQucGF0aCk7XG4gIH1cblxuICAvLyBHaXZlbiBhbiBpbmRleCAnaScsIHJldHVybnMgYSBjb21wYXJhdG9yIHRoYXQgY29tcGFyZXMgdHdvIGtleSBhcnJheXMgYmFzZWRcbiAgLy8gb24gZmllbGQgJ2knLlxuICBfa2V5RmllbGRDb21wYXJhdG9yKGkpIHtcbiAgICBjb25zdCBpbnZlcnQgPSAhdGhpcy5fc29ydFNwZWNQYXJ0c1tpXS5hc2NlbmRpbmc7XG5cbiAgICByZXR1cm4gKGtleTEsIGtleTIpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBhcmUgPSBMb2NhbENvbGxlY3Rpb24uX2YuX2NtcChrZXkxW2ldLCBrZXkyW2ldKTtcbiAgICAgIHJldHVybiBpbnZlcnQgPyAtY29tcGFyZSA6IGNvbXBhcmU7XG4gICAgfTtcbiAgfVxufVxuXG4vLyBHaXZlbiBhbiBhcnJheSBvZiBjb21wYXJhdG9yc1xuLy8gKGZ1bmN0aW9ucyAoYSxiKS0+KG5lZ2F0aXZlIG9yIHBvc2l0aXZlIG9yIHplcm8pKSwgcmV0dXJucyBhIHNpbmdsZVxuLy8gY29tcGFyYXRvciB3aGljaCB1c2VzIGVhY2ggY29tcGFyYXRvciBpbiBvcmRlciBhbmQgcmV0dXJucyB0aGUgZmlyc3Rcbi8vIG5vbi16ZXJvIHZhbHVlLlxuZnVuY3Rpb24gY29tcG9zZUNvbXBhcmF0b3JzKGNvbXBhcmF0b3JBcnJheSkge1xuICByZXR1cm4gKGEsIGIpID0+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBhcmF0b3JBcnJheS5sZW5ndGg7ICsraSkge1xuICAgICAgY29uc3QgY29tcGFyZSA9IGNvbXBhcmF0b3JBcnJheVtpXShhLCBiKTtcbiAgICAgIGlmIChjb21wYXJlICE9PSAwKSB7XG4gICAgICAgIHJldHVybiBjb21wYXJlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAwO1xuICB9O1xufVxuIl19
