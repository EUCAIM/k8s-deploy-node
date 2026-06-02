Package["core-runtime"].queue("check",function () {/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EmitterPromise = Package.meteor.EmitterPromise;
var ECMAScript = Package.ecmascript.ECMAScript;
var EJSON = Package.ejson.EJSON;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var check, Match;

var require = meteorInstall({"node_modules":{"meteor":{"check":{"match.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/check/match.js                                                                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({check:()=>check});module.export({Match:()=>Match},true);let isPlainObject;module.link('./isPlainObject',{isPlainObject(v){isPlainObject=v}},0);// XXX docs

// Things we explicitly do NOT support:
//    - heterogenous arrays
const currentArgumentChecker = new Meteor.EnvironmentVariable;
const hasOwn = Object.prototype.hasOwnProperty;
const format = (result)=>{
    const err = new Match.Error(result.message);
    if (result.path) {
        err.message += ` in field ${result.path}`;
        err.path = result.path;
    }
    return err;
};
function nonEmptyStringCondition(value) {
    check(value, String);
    return value.length > 0;
}
/**
 * @summary Check that a value matches a [pattern](#matchpatterns).
 * If the value does not match the pattern, throw a `Match.Error`.
 * By default, it will throw immediately at the first error encountered. Pass in { throwAllErrors: true } to throw all errors.
 *
 * Particularly useful to assert that arguments to a function have the right
 * types and structure.
 * @locus Anywhere
 * @param {Any} value The value to check
 * @param {MatchPattern} pattern The pattern to match `value` against
 * @param {Object} [options={}] Additional options for check
 * @param {Boolean} [options.throwAllErrors=false] If true, throw all errors
 */ function check(value, pattern, options = {
    throwAllErrors: false
}) {
    // Record that check got called, if somebody cared.
    //
    // We use getOrNullIfOutsideFiber so that it's OK to call check()
    // from non-Fiber server contexts; the downside is that if you forget to
    // bindEnvironment on some random callback in your method/publisher,
    // it might not find the argumentChecker and you'll get an error about
    // not checking an argument that it looks like you're checking (instead
    // of just getting a "Node code must run in a Fiber" error).
    const argChecker = currentArgumentChecker.getOrNullIfOutsideFiber();
    if (argChecker) {
        argChecker.checking(value);
    }
    const result = testSubtree(value, pattern, options.throwAllErrors);
    if (result) {
        if (options.throwAllErrors) {
            throw Array.isArray(result) ? result.map((r)=>format(r)) : [
                format(result)
            ];
        } else {
            throw format(result);
        }
    }
}
;
/**
 * @namespace Match
 * @summary The namespace for all Match types and methods.
 */ const Match = {
    Optional: function(pattern) {
        return new Optional(pattern);
    },
    Maybe: function(pattern) {
        return new Maybe(pattern);
    },
    OneOf: function(...args) {
        return new OneOf(args);
    },
    Any: [
        '__any__'
    ],
    Where: function(condition) {
        return new Where(condition);
    },
    NonEmptyString: [
        '__NonEmptyString__'
    ],
    ObjectIncluding: function(pattern) {
        return new ObjectIncluding(pattern);
    },
    ObjectWithValues: function(pattern) {
        return new ObjectWithValues(pattern);
    },
    // Matches only signed 32-bit integers
    Integer: [
        '__integer__'
    ],
    // XXX matchers should know how to describe themselves for errors
    Error: Meteor.makeErrorType('Match.Error', function(msg) {
        this.message = `Match error: ${msg}`;
        // The path of the value that failed to match. Initially empty, this gets
        // populated by catching and rethrowing the exception as it goes back up the
        // stack.
        // E.g.: "vals[3].entity.created"
        this.path = '';
        // If this gets sent over DDP, don't give full internal details but at least
        // provide something better than 500 Internal server error.
        this.sanitizedError = new Meteor.Error(400, 'Match failed');
    }),
    // Tests to see if value matches pattern. Unlike check, it merely returns true
    // or false (unless an error other than Match.Error was thrown). It does not
    // interact with _failIfArgumentsAreNotAllChecked.
    // XXX maybe also implement a Match.match which returns more information about
    //     failures but without using exception handling or doing what check()
    //     does with _failIfArgumentsAreNotAllChecked and Meteor.Error conversion
    /**
   * @summary Returns true if the value matches the pattern.
   * @locus Anywhere
   * @param {Any} value The value to check
   * @param {MatchPattern} pattern The pattern to match `value` against
   */ test (value, pattern) {
        return !testSubtree(value, pattern);
    },
    // Runs `f.apply(context, args)`. If check() is not called on every element of
    // `args` (either directly or in the first level of an array), throws an error
    // (using `description` in the message).
    _failIfArgumentsAreNotAllChecked (f, context, args, description) {
        const argChecker = new ArgumentChecker(args, description);
        const result = currentArgumentChecker.withValue(argChecker, ()=>f.apply(context, args));
        // If f didn't itself throw, make sure it checked all of its arguments.
        argChecker.throwUnlessAllArgumentsHaveBeenChecked();
        return result;
    }
};
class Optional {
    constructor(pattern){
        this.pattern = pattern;
    }
}
class Maybe {
    constructor(pattern){
        this.pattern = pattern;
    }
}
class OneOf {
    constructor(choices){
        if (!choices || choices.length === 0) {
            throw new Error('Must provide at least one choice to Match.OneOf');
        }
        this.choices = choices;
    }
}
class Where {
    constructor(condition){
        this.condition = condition;
    }
}
class ObjectIncluding {
    constructor(pattern){
        this.pattern = pattern;
    }
}
class ObjectWithValues {
    constructor(pattern){
        this.pattern = pattern;
    }
}
const stringForErrorMessage = (value, options = {})=>{
    if (value === null) {
        return 'null';
    }
    if (options.onlyShowType) {
        return typeof value;
    }
    // Your average non-object things.  Saves from doing the try/catch below for.
    if (typeof value !== 'object') {
        return EJSON.stringify(value);
    }
    try {
        // Find objects with circular references since EJSON doesn't support them yet (Issue #4778 + Unaccepted PR)
        // If the native stringify is going to choke, EJSON.stringify is going to choke too.
        JSON.stringify(value);
    } catch (stringifyError) {
        if (stringifyError.name === 'TypeError') {
            return typeof value;
        }
    }
    return EJSON.stringify(value);
};
const typeofChecks = [
    [
        String,
        'string'
    ],
    [
        Number,
        'number'
    ],
    [
        Boolean,
        'boolean'
    ],
    // While we don't allow undefined/function in EJSON, this is good for optional
    // arguments with OneOf.
    [
        Function,
        'function'
    ],
    [
        undefined,
        'undefined'
    ]
];
// Return `false` if it matches. Otherwise, returns an object with a `message` and a `path` field or an array of objects each with a `message` and a `path` field when collecting errors.
const testSubtree = (value, pattern, collectErrors = false, errors = [], path = '')=>{
    // Match anything!
    if (pattern === Match.Any) {
        return false;
    }
    // Basic atomic types.
    // Do not match boxed objects (e.g. String, Boolean)
    for(let i = 0; i < typeofChecks.length; ++i){
        if (pattern === typeofChecks[i][0]) {
            if (typeof value === typeofChecks[i][1]) {
                return false;
            }
            return {
                message: `Expected ${typeofChecks[i][1]}, got ${stringForErrorMessage(value, {
                    onlyShowType: true
                })}`,
                path: ''
            };
        }
    }
    if (pattern === null) {
        if (value === null) {
            return false;
        }
        return {
            message: `Expected null, got ${stringForErrorMessage(value)}`,
            path: ''
        };
    }
    // Strings, numbers, and booleans match literally. Goes well with Match.OneOf.
    if (typeof pattern === 'string' || typeof pattern === 'number' || typeof pattern === 'boolean') {
        if (value === pattern) {
            return false;
        }
        return {
            message: `Expected ${pattern}, got ${stringForErrorMessage(value)}`,
            path: ''
        };
    }
    // Match.Integer is special type encoded with array
    if (pattern === Match.Integer) {
        // There is no consistent and reliable way to check if variable is a 64-bit
        // integer. One of the popular solutions is to get reminder of division by 1
        // but this method fails on really large floats with big precision.
        // E.g.: 1.348192308491824e+23 % 1 === 0 in V8
        // Bitwise operators work consistantly but always cast variable to 32-bit
        // signed integer according to JavaScript specs.
        if (typeof value === 'number' && (value | 0) === value) {
            return false;
        }
        return {
            message: `Expected Integer, got ${stringForErrorMessage(value)}`,
            path: ''
        };
    }
    // 'Object' is shorthand for Match.ObjectIncluding({});
    if (pattern === Object) {
        pattern = Match.ObjectIncluding({});
    }
    // This must be invoked before pattern instanceof Array as strings are regarded as arrays
    // We invoke the pattern as IIFE so that `pattern isntanceof Where` catches it 
    if (pattern === Match.NonEmptyString) {
        pattern = new Where(nonEmptyStringCondition);
    }
    // Array (checked AFTER Any, which is implemented as an Array).
    if (pattern instanceof Array) {
        if (pattern.length !== 1) {
            return {
                message: `Bad pattern: arrays must have one type element ${stringForErrorMessage(pattern)}`,
                path: ''
            };
        }
        if (!Array.isArray(value) && !isArguments(value)) {
            return {
                message: `Expected array, got ${stringForErrorMessage(value)}`,
                path: ''
            };
        }
        for(let i = 0, length = value.length; i < length; i++){
            const arrPath = `${path}[${i}]`;
            const result = testSubtree(value[i], pattern[0], collectErrors, errors, arrPath);
            if (result) {
                result.path = _prependPath(collectErrors ? arrPath : i, result.path);
                if (!collectErrors) return result;
                if (typeof value[i] !== 'object' || result.message) errors.push(result);
            }
        }
        if (!collectErrors) return false;
        return errors.length === 0 ? false : errors;
    }
    // Arbitrary validation checks. The condition can return false or throw a
    // Match.Error (ie, it can internally use check()) to fail.
    if (pattern instanceof Where) {
        let result;
        try {
            result = pattern.condition(value);
        } catch (err) {
            if (!(err instanceof Match.Error)) {
                throw err;
            }
            return {
                message: err.message,
                path: err.path
            };
        }
        if (result) {
            return false;
        }
        // XXX this error is terrible
        return {
            message: 'Failed Match.Where validation',
            path: ''
        };
    }
    if (pattern instanceof Maybe) {
        pattern = Match.OneOf(undefined, null, pattern.pattern);
    } else if (pattern instanceof Optional) {
        pattern = Match.OneOf(undefined, pattern.pattern);
    }
    if (pattern instanceof OneOf) {
        for(let i = 0; i < pattern.choices.length; ++i){
            const result = testSubtree(value, pattern.choices[i]);
            if (!result) {
                // No error? Yay, return.
                return false;
            }
        // Match errors just mean try another choice.
        }
        // XXX this error is terrible
        return {
            message: 'Failed Match.OneOf, Match.Maybe or Match.Optional validation',
            path: ''
        };
    }
    // A function that isn't something we special-case is assumed to be a
    // constructor.
    if (pattern instanceof Function) {
        if (value instanceof pattern) {
            return false;
        }
        return {
            message: `Expected ${pattern.name || 'particular constructor'}`,
            path: ''
        };
    }
    let unknownKeysAllowed = false;
    let unknownKeyPattern;
    if (pattern instanceof ObjectIncluding) {
        unknownKeysAllowed = true;
        pattern = pattern.pattern;
    }
    if (pattern instanceof ObjectWithValues) {
        unknownKeysAllowed = true;
        unknownKeyPattern = [
            pattern.pattern
        ];
        pattern = {}; // no required keys
    }
    if (typeof pattern !== 'object') {
        return {
            message: 'Bad pattern: unknown pattern type',
            path: ''
        };
    }
    // An object, with required and optional keys. Note that this does NOT do
    // structural matches against objects of special types that happen to match
    // the pattern: this really needs to be a plain old {Object}!
    if (typeof value !== 'object') {
        return {
            message: `Expected object, got ${typeof value}`,
            path: ''
        };
    }
    if (value === null) {
        return {
            message: `Expected object, got null`,
            path: ''
        };
    }
    if (!isPlainObject(value)) {
        return {
            message: `Expected plain object`,
            path: ''
        };
    }
    const requiredPatterns = Object.create(null);
    const optionalPatterns = Object.create(null);
    Object.keys(pattern).forEach((key)=>{
        const subPattern = pattern[key];
        if (subPattern instanceof Optional || subPattern instanceof Maybe) {
            optionalPatterns[key] = subPattern.pattern;
        } else {
            requiredPatterns[key] = subPattern;
        }
    });
    for(let key in Object(value)){
        const subValue = value[key];
        const objPath = path ? `${path}.${key}` : key;
        if (hasOwn.call(requiredPatterns, key)) {
            const result = testSubtree(subValue, requiredPatterns[key], collectErrors, errors, objPath);
            if (result) {
                result.path = _prependPath(collectErrors ? objPath : key, result.path);
                if (!collectErrors) return result;
                if (typeof subValue !== 'object' || result.message) errors.push(result);
            }
            delete requiredPatterns[key];
        } else if (hasOwn.call(optionalPatterns, key)) {
            const result = testSubtree(subValue, optionalPatterns[key], collectErrors, errors, objPath);
            if (result) {
                result.path = _prependPath(collectErrors ? objPath : key, result.path);
                if (!collectErrors) return result;
                if (typeof subValue !== 'object' || result.message) errors.push(result);
            }
        } else {
            if (!unknownKeysAllowed) {
                const result = {
                    message: 'Unknown key',
                    path: key
                };
                if (!collectErrors) return result;
                errors.push(result);
            }
            if (unknownKeyPattern) {
                const result = testSubtree(subValue, unknownKeyPattern[0], collectErrors, errors, objPath);
                if (result) {
                    result.path = _prependPath(collectErrors ? objPath : key, result.path);
                    if (!collectErrors) return result;
                    if (typeof subValue !== 'object' || result.message) errors.push(result);
                }
            }
        }
    }
    const keys = Object.keys(requiredPatterns);
    if (keys.length) {
        const createMissingError = (key)=>({
                message: `Missing key '${key}'`,
                path: collectErrors ? path : ''
            });
        if (!collectErrors) {
            return createMissingError(keys[0]);
        }
        for (const key of keys){
            errors.push(createMissingError(key));
        }
    }
    if (!collectErrors) return false;
    return errors.length === 0 ? false : errors;
};
class ArgumentChecker {
    checking(value) {
        if (this._checkingOneValue(value)) {
            return;
        }
        // Allow check(arguments, [String]) or check(arguments.slice(1), [String])
        // or check([foo, bar], [String]) to count... but only if value wasn't
        // itself an argument.
        if (Array.isArray(value) || isArguments(value)) {
            Array.prototype.forEach.call(value, this._checkingOneValue.bind(this));
        }
    }
    _checkingOneValue(value) {
        for(let i = 0; i < this.args.length; ++i){
            // Is this value one of the arguments? (This can have a false positive if
            // the argument is an interned primitive, but it's still a good enough
            // check.)
            // (NaN is not === to itself, so we have to check specially.)
            if (value === this.args[i] || Number.isNaN(value) && Number.isNaN(this.args[i])) {
                this.args.splice(i, 1);
                return true;
            }
        }
        return false;
    }
    throwUnlessAllArgumentsHaveBeenChecked() {
        if (this.args.length > 0) throw new Error(`Did not check() all arguments during ${this.description}`);
    }
    constructor(args, description){
        // Make a SHALLOW copy of the arguments. (We'll be doing identity checks
        // against its contents.)
        this.args = [
            ...args
        ];
        // Since the common case will be to check arguments in order, and we splice
        // out arguments when we check them, make it so we splice out from the end
        // rather than the beginning.
        this.args.reverse();
        this.description = description;
    }
}
const _jsKeywords = [
    'do',
    'if',
    'in',
    'for',
    'let',
    'new',
    'try',
    'var',
    'case',
    'else',
    'enum',
    'eval',
    'false',
    'null',
    'this',
    'true',
    'void',
    'with',
    'break',
    'catch',
    'class',
    'const',
    'super',
    'throw',
    'while',
    'yield',
    'delete',
    'export',
    'import',
    'public',
    'return',
    'static',
    'switch',
    'typeof',
    'default',
    'extends',
    'finally',
    'package',
    'private',
    'continue',
    'debugger',
    'function',
    'arguments',
    'interface',
    'protected',
    'implements',
    'instanceof'
];
// Assumes the base of path is already escaped properly
// returns key + base
const _prependPath = (key, base)=>{
    if (typeof key === 'number' || key.match(/^[0-9]+$/)) {
        key = `[${key}]`;
    } else if (!key.match(/^[a-z_$][0-9a-z_$.[\]]*$/i) || _jsKeywords.indexOf(key) >= 0) {
        key = JSON.stringify([
            key
        ]);
    }
    if (base && base[0] !== '[') {
        return `${key}.${base}`;
    }
    return key + base;
};
const isObject = (value)=>typeof value === 'object' && value !== null;
const baseIsArguments = (item)=>isObject(item) && Object.prototype.toString.call(item) === '[object Arguments]';
const isArguments = baseIsArguments(function() {
    return arguments;
}()) ? baseIsArguments : (value)=>isObject(value) && typeof value.callee === 'function';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"isPlainObject.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/check/isPlainObject.js                                                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({isPlainObject:()=>isPlainObject},true);// Copy of jQuery.isPlainObject for the server side from jQuery v3.1.1.
const class2type = {};
const toString = class2type.toString;
const hasOwn = Object.prototype.hasOwnProperty;
const fnToString = hasOwn.toString;
const ObjectFunctionString = fnToString.call(Object);
const getProto = Object.getPrototypeOf;
const isPlainObject = (obj)=>{
    let proto;
    let Ctor;
    // Detect obvious negatives
    // Use toString instead of jQuery.type to catch host objects
    if (!obj || toString.call(obj) !== '[object Object]') {
        return false;
    }
    proto = getProto(obj);
    // Objects with no prototype (e.g., `Object.create( null )`) are plain
    if (!proto) {
        return true;
    }
    // Objects with prototype are plain iff they were constructed by a global Object function
    Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});


/* Exports */
return {
  export: function () { return {
      check: check,
      Match: Match
    };},
  require: require,
  eagerModulePaths: [
    "/node_modules/meteor/check/match.js"
  ],
  mainModulePath: "/node_modules/meteor/check/match.js"
}});

//# sourceURL=meteor://💻app/packages/check.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY2hlY2svbWF0Y2guanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2NoZWNrL2lzUGxhaW5PYmplY3QuanMiXSwibmFtZXMiOlsiY3VycmVudEFyZ3VtZW50Q2hlY2tlciIsIk1ldGVvciIsIkVudmlyb25tZW50VmFyaWFibGUiLCJoYXNPd24iLCJPYmplY3QiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImZvcm1hdCIsInJlc3VsdCIsImVyciIsIk1hdGNoIiwiRXJyb3IiLCJtZXNzYWdlIiwicGF0aCIsIm5vbkVtcHR5U3RyaW5nQ29uZGl0aW9uIiwidmFsdWUiLCJjaGVjayIsIlN0cmluZyIsImxlbmd0aCIsInBhdHRlcm4iLCJvcHRpb25zIiwidGhyb3dBbGxFcnJvcnMiLCJhcmdDaGVja2VyIiwiZ2V0T3JOdWxsSWZPdXRzaWRlRmliZXIiLCJjaGVja2luZyIsInRlc3RTdWJ0cmVlIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwiciIsIk9wdGlvbmFsIiwiTWF5YmUiLCJPbmVPZiIsImFyZ3MiLCJBbnkiLCJXaGVyZSIsImNvbmRpdGlvbiIsIk5vbkVtcHR5U3RyaW5nIiwiT2JqZWN0SW5jbHVkaW5nIiwiT2JqZWN0V2l0aFZhbHVlcyIsIkludGVnZXIiLCJtYWtlRXJyb3JUeXBlIiwibXNnIiwic2FuaXRpemVkRXJyb3IiLCJ0ZXN0IiwiX2ZhaWxJZkFyZ3VtZW50c0FyZU5vdEFsbENoZWNrZWQiLCJmIiwiY29udGV4dCIsImRlc2NyaXB0aW9uIiwiQXJndW1lbnRDaGVja2VyIiwid2l0aFZhbHVlIiwiYXBwbHkiLCJ0aHJvd1VubGVzc0FsbEFyZ3VtZW50c0hhdmVCZWVuQ2hlY2tlZCIsImNob2ljZXMiLCJzdHJpbmdGb3JFcnJvck1lc3NhZ2UiLCJvbmx5U2hvd1R5cGUiLCJFSlNPTiIsInN0cmluZ2lmeSIsIkpTT04iLCJzdHJpbmdpZnlFcnJvciIsIm5hbWUiLCJ0eXBlb2ZDaGVja3MiLCJOdW1iZXIiLCJCb29sZWFuIiwiRnVuY3Rpb24iLCJ1bmRlZmluZWQiLCJjb2xsZWN0RXJyb3JzIiwiZXJyb3JzIiwiaSIsImlzQXJndW1lbnRzIiwiYXJyUGF0aCIsIl9wcmVwZW5kUGF0aCIsInB1c2giLCJ1bmtub3duS2V5c0FsbG93ZWQiLCJ1bmtub3duS2V5UGF0dGVybiIsImlzUGxhaW5PYmplY3QiLCJyZXF1aXJlZFBhdHRlcm5zIiwiY3JlYXRlIiwib3B0aW9uYWxQYXR0ZXJucyIsImtleXMiLCJmb3JFYWNoIiwia2V5Iiwic3ViUGF0dGVybiIsInN1YlZhbHVlIiwib2JqUGF0aCIsImNhbGwiLCJjcmVhdGVNaXNzaW5nRXJyb3IiLCJfY2hlY2tpbmdPbmVWYWx1ZSIsImJpbmQiLCJpc05hTiIsInNwbGljZSIsInJldmVyc2UiLCJfanNLZXl3b3JkcyIsImJhc2UiLCJtYXRjaCIsImluZGV4T2YiLCJpc09iamVjdCIsImJhc2VJc0FyZ3VtZW50cyIsIml0ZW0iLCJ0b1N0cmluZyIsImFyZ3VtZW50cyIsImNhbGxlZSIsImNsYXNzMnR5cGUiLCJmblRvU3RyaW5nIiwiT2JqZWN0RnVuY3Rpb25TdHJpbmciLCJnZXRQcm90byIsImdldFByb3RvdHlwZU9mIiwib2JqIiwicHJvdG8iLCJDdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxXQUFXO0FBQ3FDO0FBRWhELHVDQUF1QztBQUN2QywyQkFBMkI7QUFFM0IsTUFBTUEseUJBQXlCLElBQUlDLE9BQU9DLG1CQUFtQjtBQUM3RCxNQUFNQyxTQUFTQyxPQUFPQyxTQUFTLENBQUNDLGNBQWM7QUFFOUMsTUFBTUMsU0FBU0M7SUFDYixNQUFNQyxNQUFNLElBQUlDLE1BQU1DLEtBQUssQ0FBQ0gsT0FBT0ksT0FBTztJQUMxQyxJQUFJSixPQUFPSyxJQUFJLEVBQUU7UUFDZkosSUFBSUcsT0FBTyxJQUFJLENBQUMsVUFBVSxFQUFFSixPQUFPSyxJQUFJLEVBQUU7UUFDekNKLElBQUlJLElBQUksR0FBR0wsT0FB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cnQgeyBpc1BsYWluT2JqZWN0IH0gZnJvbSAnLi9pc1BsYWluT2JqZWN0JztcblxuLy8gVGhpbmdzIHdlIGV4cGxpY2l0bHkgZG8gTk9UIHN1cHBvcnQ6XG4vLyAgICAtIGhldGVyb2dlbm91cyBhcnJheXNcblxuY29uc3QgY3VycmVudEFyZ3VtZW50Q2hlY2tlciA9IG5ldyBNZXRlb3IuRW52aXJvbm1lbnRWYXJpYWJsZTtcbmNvbnN0IGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbmNvbnN0IGZvcm1hdCA9IHJlc3VsdCA9PiB7XG4gIGNvbnN0IGVyciA9IG5ldyBNYXRjaC5FcnJvcihyZXN1bHQubWVzc2FnZSk7XG4gIGlmIChyZXN1bHQucGF0aCkge1xuICAgIGVyci5tZXNzYWdlICs9IGAgaW4gZmllbGQgJHtyZXN1bHQucGF0aH1gO1xuICAgIGVyci5wYXRoID0gcmVzdWx0LnBhdGg7XG4gIH1cblxuICByZXR1cm4gZXJyO1xufVxuXG5mdW5jdGlvbiBub25FbXB0eVN0cmluZ0NvbmRpdGlvbih2YWx1ZSkge1xuICBjaGVjayh2YWx1ZSwgU3RyaW5nKTtcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA+IDA7XG59XG5cbi8qKlxuICogQHN1bW1hcnkgQ2hlY2sgdGhhdCBhIHZhbHVlIG1hdGNoZXMgYSBbcGF0dGVybl0oI21hdGNocGF0dGVybnMpLlxuICogSWYgdGhlIHZhbHVlIGRvZXMgbm90IG1hdGNoIHRoZSBwYXR0ZXJuLCB0aHJvdyBhIGBNYXRjaC5FcnJvcmAuXG4gKiBCeSBkZWZhdWx0LCBpdCB3aWxsIHRocm93IGltbWVkaWF0ZWx5IGF0IHRoZSBmaXJzdCBlcnJvciBlbmNvdW50ZXJlZC4gUGFzcyBpbiB7IHRocm93QWxsRXJyb3JzOiB0cnVlIH0gdG8gdGhyb3cgYWxsIGVycm9ycy5cbiAqXG4gKiBQYXJ0aWN1bGFybHkgdXNlZnVsIHRvIGFzc2VydCB0aGF0IGFyZ3VtZW50cyB0byBhIGZ1bmN0aW9uIGhhdmUgdGhlIHJpZ2h0XG4gKiB0eXBlcyBhbmQgc3RydWN0dXJlLlxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAcGFyYW0ge0FueX0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrXG4gKiBAcGFyYW0ge01hdGNoUGF0dGVybn0gcGF0dGVybiBUaGUgcGF0dGVybiB0byBtYXRjaCBgdmFsdWVgIGFnYWluc3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gQWRkaXRpb25hbCBvcHRpb25zIGZvciBjaGVja1xuICogQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy50aHJvd0FsbEVycm9ycz1mYWxzZV0gSWYgdHJ1ZSwgdGhyb3cgYWxsIGVycm9yc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2sodmFsdWUsIHBhdHRlcm4sIG9wdGlvbnMgPSB7IHRocm93QWxsRXJyb3JzOiBmYWxzZSB9KSB7XG4gIC8vIFJlY29yZCB0aGF0IGNoZWNrIGdvdCBjYWxsZWQsIGlmIHNvbWVib2R5IGNhcmVkLlxuICAvL1xuICAvLyBXZSB1c2UgZ2V0T3JOdWxsSWZPdXRzaWRlRmliZXIgc28gdGhhdCBpdCdzIE9LIHRvIGNhbGwgY2hlY2soKVxuICAvLyBmcm9tIG5vbi1GaWJlciBzZXJ2ZXIgY29udGV4dHM7IHRoZSBkb3duc2lkZSBpcyB0aGF0IGlmIHlvdSBmb3JnZXQgdG9cbiAgLy8gYmluZEVudmlyb25tZW50IG9uIHNvbWUgcmFuZG9tIGNhbGxiYWNrIGluIHlvdXIgbWV0aG9kL3B1Ymxpc2hlcixcbiAgLy8gaXQgbWlnaHQgbm90IGZpbmQgdGhlIGFyZ3VtZW50Q2hlY2tlciBhbmQgeW91J2xsIGdldCBhbiBlcnJvciBhYm91dFxuICAvLyBub3QgY2hlY2tpbmcgYW4gYXJndW1lbnQgdGhhdCBpdCBsb29rcyBsaWtlIHlvdSdyZSBjaGVja2luZyAoaW5zdGVhZFxuICAvLyBvZiBqdXN0IGdldHRpbmcgYSBcIk5vZGUgY29kZSBtdXN0IHJ1biBpbiBhIEZpYmVyXCIgZXJyb3IpLlxuICBjb25zdCBhcmdDaGVja2VyID0gY3VycmVudEFyZ3VtZW50Q2hlY2tlci5nZXRPck51bGxJZk91dHNpZGVGaWJlcigpO1xuICBpZiAoYXJnQ2hlY2tlcikge1xuICAgIGFyZ0NoZWNrZXIuY2hlY2tpbmcodmFsdWUpO1xuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0gdGVzdFN1YnRyZWUodmFsdWUsIHBhdHRlcm4sIG9wdGlvbnMudGhyb3dBbGxFcnJvcnMpO1xuXG4gIGlmIChyZXN1bHQpIHtcbiAgICBpZiAob3B0aW9ucy50aHJvd0FsbEVycm9ycykge1xuICAgICAgdGhyb3cgQXJyYXkuaXNBcnJheShyZXN1bHQpID8gcmVzdWx0Lm1hcChyID0+IGZvcm1hdChyKSkgOiBbZm9ybWF0KHJlc3VsdCldXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGZvcm1hdChyZXN1bHQpXG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgTWF0Y2hcbiAqIEBzdW1tYXJ5IFRoZSBuYW1lc3BhY2UgZm9yIGFsbCBNYXRjaCB0eXBlcyBhbmQgbWV0aG9kcy5cbiAqL1xuZXhwb3J0IGNvbnN0IE1hdGNoID0ge1xuICBPcHRpb25hbDogZnVuY3Rpb24ocGF0dGVybikge1xuICAgIHJldHVybiBuZXcgT3B0aW9uYWwocGF0dGVybik7XG4gIH0sXG5cbiAgTWF5YmU6IGZ1bmN0aW9uKHBhdHRlcm4pIHtcbiAgICByZXR1cm4gbmV3IE1heWJlKHBhdHRlcm4pO1xuICB9LFxuXG4gIE9uZU9mOiBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgcmV0dXJuIG5ldyBPbmVPZihhcmdzKTtcbiAgfSxcblxuICBBbnk6IFsnX19hbnlfXyddLFxuICBXaGVyZTogZnVuY3Rpb24oY29uZGl0aW9uKSB7XG4gICAgcmV0dXJuIG5ldyBXaGVyZShjb25kaXRpb24pO1xuICB9LFxuXG4gIE5vbkVtcHR5U3RyaW5nOiBbJ19fTm9uRW1wdHlTdHJpbmdfXyddLFxuXG4gIE9iamVjdEluY2x1ZGluZzogZnVuY3Rpb24ocGF0dGVybikge1xuICAgIHJldHVybiBuZXcgT2JqZWN0SW5jbHVkaW5nKHBhdHRlcm4pXG4gIH0sXG5cbiAgT2JqZWN0V2l0aFZhbHVlczogZnVuY3Rpb24ocGF0dGVybikge1xuICAgIHJldHVybiBuZXcgT2JqZWN0V2l0aFZhbHVlcyhwYXR0ZXJuKTtcbiAgfSxcblxuICAvLyBNYXRjaGVzIG9ubHkgc2lnbmVkIDMyLWJpdCBpbnRlZ2Vyc1xuICBJbnRlZ2VyOiBbJ19faW50ZWdlcl9fJ10sXG5cbiAgLy8gWFhYIG1hdGNoZXJzIHNob3VsZCBrbm93IGhvdyB0byBkZXNjcmliZSB0aGVtc2VsdmVzIGZvciBlcnJvcnNcbiAgRXJyb3I6IE1ldGVvci5tYWtlRXJyb3JUeXBlKCdNYXRjaC5FcnJvcicsIGZ1bmN0aW9uIChtc2cpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBgTWF0Y2ggZXJyb3I6ICR7bXNnfWA7XG5cbiAgICAvLyBUaGUgcGF0aCBvZiB0aGUgdmFsdWUgdGhhdCBmYWlsZWQgdG8gbWF0Y2guIEluaXRpYWxseSBlbXB0eSwgdGhpcyBnZXRzXG4gICAgLy8gcG9wdWxhdGVkIGJ5IGNhdGNoaW5nIGFuZCByZXRocm93aW5nIHRoZSBleGNlcHRpb24gYXMgaXQgZ29lcyBiYWNrIHVwIHRoZVxuICAgIC8vIHN0YWNrLlxuICAgIC8vIEUuZy46IFwidmFsc1szXS5lbnRpdHkuY3JlYXRlZFwiXG4gICAgdGhpcy5wYXRoID0gJyc7XG5cbiAgICAvLyBJZiB0aGlzIGdldHMgc2VudCBvdmVyIEREUCwgZG9uJ3QgZ2l2ZSBmdWxsIGludGVybmFsIGRldGFpbHMgYnV0IGF0IGxlYXN0XG4gICAgLy8gcHJvdmlkZSBzb21ldGhpbmcgYmV0dGVyIHRoYW4gNTAwIEludGVybmFsIHNlcnZlciBlcnJvci5cbiAgICB0aGlzLnNhbml0aXplZEVycm9yID0gbmV3IE1ldGVvci5FcnJvcig0MDAsICdNYXRjaCBmYWlsZWQnKTtcbiAgfSksXG5cbiAgLy8gVGVzdHMgdG8gc2VlIGlmIHZhbHVlIG1hdGNoZXMgcGF0dGVybi4gVW5saWtlIGNoZWNrLCBpdCBtZXJlbHkgcmV0dXJucyB0cnVlXG4gIC8vIG9yIGZhbHNlICh1bmxlc3MgYW4gZXJyb3Igb3RoZXIgdGhhbiBNYXRjaC5FcnJvciB3YXMgdGhyb3duKS4gSXQgZG9lcyBub3RcbiAgLy8gaW50ZXJhY3Qgd2l0aCBfZmFpbElmQXJndW1lbnRzQXJlTm90QWxsQ2hlY2tlZC5cbiAgLy8gWFhYIG1heWJlIGFsc28gaW1wbGVtZW50IGEgTWF0Y2gubWF0Y2ggd2hpY2ggcmV0dXJucyBtb3JlIGluZm9ybWF0aW9uIGFib3V0XG4gIC8vICAgICBmYWlsdXJlcyBidXQgd2l0aG91dCB1c2luZyBleGNlcHRpb24gaGFuZGxpbmcgb3IgZG9pbmcgd2hhdCBjaGVjaygpXG4gIC8vICAgICBkb2VzIHdpdGggX2ZhaWxJZkFyZ3VtZW50c0FyZU5vdEFsbENoZWNrZWQgYW5kIE1ldGVvci5FcnJvciBjb252ZXJzaW9uXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJldHVybnMgdHJ1ZSBpZiB0aGUgdmFsdWUgbWF0Y2hlcyB0aGUgcGF0dGVybi5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBwYXJhbSB7QW55fSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2tcbiAgICogQHBhcmFtIHtNYXRjaFBhdHRlcm59IHBhdHRlcm4gVGhlIHBhdHRlcm4gdG8gbWF0Y2ggYHZhbHVlYCBhZ2FpbnN0XG4gICAqL1xuICB0ZXN0KHZhbHVlLCBwYXR0ZXJuKSB7XG4gICAgcmV0dXJuICF0ZXN0U3VidHJlZSh2YWx1ZSwgcGF0dGVybik7XG4gIH0sXG5cbiAgLy8gUnVucyBgZi5hcHBseShjb250ZXh0LCBhcmdzKWAuIElmIGNoZWNrKCkgaXMgbm90IGNhbGxlZCBvbiBldmVyeSBlbGVtZW50IG9mXG4gIC8vIGBhcmdzYCAoZWl0aGVyIGRpcmVjdGx5IG9yIGluIHRoZSBmaXJzdCBsZXZlbCBvZiBhbiBhcnJheSksIHRocm93cyBhbiBlcnJvclxuICAvLyAodXNpbmcgYGRlc2NyaXB0aW9uYCBpbiB0aGUgbWVzc2FnZSkuXG4gIF9mYWlsSWZBcmd1bWVudHNBcmVOb3RBbGxDaGVja2VkKGYsIGNvbnRleHQsIGFyZ3MsIGRlc2NyaXB0aW9uKSB7XG4gICAgY29uc3QgYXJnQ2hlY2tlciA9IG5ldyBBcmd1bWVudENoZWNrZXIoYXJncywgZGVzY3JpcHRpb24pO1xuICAgIGNvbnN0IHJlc3VsdCA9IGN1cnJlbnRBcmd1bWVudENoZWNrZXIud2l0aFZhbHVlKFxuICAgICAgYXJnQ2hlY2tlcixcbiAgICAgICgpID0+IGYuYXBwbHkoY29udGV4dCwgYXJncylcbiAgICApO1xuXG4gICAgLy8gSWYgZiBkaWRuJ3QgaXRzZWxmIHRocm93LCBtYWtlIHN1cmUgaXQgY2hlY2tlZCBhbGwgb2YgaXRzIGFyZ3VtZW50cy5cbiAgICBhcmdDaGVja2VyLnRocm93VW5sZXNzQWxsQXJndW1lbnRzSGF2ZUJlZW5DaGVja2VkKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufTtcblxuY2xhc3MgT3B0aW9uYWwge1xuICBjb25zdHJ1Y3RvcihwYXR0ZXJuKSB7XG4gICAgdGhpcy5wYXR0ZXJuID0gcGF0dGVybjtcbiAgfVxufVxuXG5jbGFzcyBNYXliZSB7XG4gIGNvbnN0cnVjdG9yKHBhdHRlcm4pIHtcbiAgICB0aGlzLnBhdHRlcm4gPSBwYXR0ZXJuO1xuICB9XG59XG5cbmNsYXNzIE9uZU9mIHtcbiAgY29uc3RydWN0b3IoY2hvaWNlcykge1xuICAgIGlmICghY2hvaWNlcyB8fCBjaG9pY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNdXN0IHByb3ZpZGUgYXQgbGVhc3Qgb25lIGNob2ljZSB0byBNYXRjaC5PbmVPZicpO1xuICAgIH1cblxuICAgIHRoaXMuY2hvaWNlcyA9IGNob2ljZXM7XG4gIH1cbn1cblxuY2xhc3MgV2hlcmUge1xuICBjb25zdHJ1Y3Rvcihjb25kaXRpb24pIHtcbiAgICB0aGlzLmNvbmRpdGlvbiA9IGNvbmRpdGlvbjtcbiAgfVxufVxuXG5jbGFzcyBPYmplY3RJbmNsdWRpbmcge1xuICBjb25zdHJ1Y3RvcihwYXR0ZXJuKSB7XG4gICAgdGhpcy5wYXR0ZXJuID0gcGF0dGVybjtcbiAgfVxufVxuXG5jbGFzcyBPYmplY3RXaXRoVmFsdWVzIHtcbiAgY29uc3RydWN0b3IocGF0dGVybikge1xuICAgIHRoaXMucGF0dGVybiA9IHBhdHRlcm47XG4gIH1cbn1cblxuY29uc3Qgc3RyaW5nRm9yRXJyb3JNZXNzYWdlID0gKHZhbHVlLCBvcHRpb25zID0ge30pID0+IHtcbiAgaWYgKCB2YWx1ZSA9PT0gbnVsbCApIHtcbiAgICByZXR1cm4gJ251bGwnO1xuICB9XG5cbiAgaWYgKCBvcHRpb25zLm9ubHlTaG93VHlwZSApIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlO1xuICB9XG5cbiAgLy8gWW91ciBhdmVyYWdlIG5vbi1vYmplY3QgdGhpbmdzLiAgU2F2ZXMgZnJvbSBkb2luZyB0aGUgdHJ5L2NhdGNoIGJlbG93IGZvci5cbiAgaWYgKCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnICkge1xuICAgIHJldHVybiBFSlNPTi5zdHJpbmdpZnkodmFsdWUpXG4gIH1cblxuICB0cnkge1xuXG4gICAgLy8gRmluZCBvYmplY3RzIHdpdGggY2lyY3VsYXIgcmVmZXJlbmNlcyBzaW5jZSBFSlNPTiBkb2Vzbid0IHN1cHBvcnQgdGhlbSB5ZXQgKElzc3VlICM0Nzc4ICsgVW5hY2NlcHRlZCBQUilcbiAgICAvLyBJZiB0aGUgbmF0aXZlIHN0cmluZ2lmeSBpcyBnb2luZyB0byBjaG9rZSwgRUpTT04uc3RyaW5naWZ5IGlzIGdvaW5nIHRvIGNob2tlIHRvby5cbiAgICBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gIH0gY2F0Y2ggKHN0cmluZ2lmeUVycm9yKSB7XG4gICAgaWYgKCBzdHJpbmdpZnlFcnJvci5uYW1lID09PSAnVHlwZUVycm9yJyApIHtcbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIEVKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG59O1xuXG5cbmNvbnN0IHR5cGVvZkNoZWNrcyA9IFtcbiAgW1N0cmluZywgJ3N0cmluZyddLFxuICBbTnVtYmVyLCAnbnVtYmVyJ10sXG4gIFtCb29sZWFuLCAnYm9vbGVhbiddLFxuXG4gIC8vIFdoaWxlIHdlIGRvbid0IGFsbG93IHVuZGVmaW5lZC9mdW5jdGlvbiBpbiBFSlNPTiwgdGhpcyBpcyBnb29kIGZvciBvcHRpb25hbFxuICAvLyBhcmd1bWVudHMgd2l0aCBPbmVPZi5cbiAgW0Z1bmN0aW9uLCAnZnVuY3Rpb24nXSxcbiAgW3VuZGVmaW5lZCwgJ3VuZGVmaW5lZCddLFxuXTtcblxuLy8gUmV0dXJuIGBmYWxzZWAgaWYgaXQgbWF0Y2hlcy4gT3RoZXJ3aXNlLCByZXR1cm5zIGFuIG9iamVjdCB3aXRoIGEgYG1lc3NhZ2VgIGFuZCBhIGBwYXRoYCBmaWVsZCBvciBhbiBhcnJheSBvZiBvYmplY3RzIGVhY2ggd2l0aCBhIGBtZXNzYWdlYCBhbmQgYSBgcGF0aGAgZmllbGQgd2hlbiBjb2xsZWN0aW5nIGVycm9ycy5cbmNvbnN0IHRlc3RTdWJ0cmVlID0gKHZhbHVlLCBwYXR0ZXJuLCBjb2xsZWN0RXJyb3JzID0gZmFsc2UsIGVycm9ycyA9IFtdLCBwYXRoID0gJycpID0+IHtcbiAgLy8gTWF0Y2ggYW55dGhpbmchXG4gIGlmIChwYXR0ZXJuID09PSBNYXRjaC5BbnkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBCYXNpYyBhdG9taWMgdHlwZXMuXG4gIC8vIERvIG5vdCBtYXRjaCBib3hlZCBvYmplY3RzIChlLmcuIFN0cmluZywgQm9vbGVhbilcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlb2ZDaGVja3MubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAocGF0dGVybiA9PT0gdHlwZW9mQ2hlY2tzW2ldWzBdKSB7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSB0eXBlb2ZDaGVja3NbaV1bMV0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXNzYWdlOiBgRXhwZWN0ZWQgJHt0eXBlb2ZDaGVja3NbaV1bMV19LCBnb3QgJHtzdHJpbmdGb3JFcnJvck1lc3NhZ2UodmFsdWUsIHsgb25seVNob3dUeXBlOiB0cnVlIH0pfWAsXG4gICAgICAgIHBhdGg6ICcnLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBpZiAocGF0dGVybiA9PT0gbnVsbCkge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiBgRXhwZWN0ZWQgbnVsbCwgZ290ICR7c3RyaW5nRm9yRXJyb3JNZXNzYWdlKHZhbHVlKX1gLFxuICAgICAgcGF0aDogJycsXG4gICAgfTtcbiAgfVxuXG4gIC8vIFN0cmluZ3MsIG51bWJlcnMsIGFuZCBib29sZWFucyBtYXRjaCBsaXRlcmFsbHkuIEdvZXMgd2VsbCB3aXRoIE1hdGNoLk9uZU9mLlxuICBpZiAodHlwZW9mIHBhdHRlcm4gPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBwYXR0ZXJuID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgcGF0dGVybiA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgaWYgKHZhbHVlID09PSBwYXR0ZXJuKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IGBFeHBlY3RlZCAke3BhdHRlcm59LCBnb3QgJHtzdHJpbmdGb3JFcnJvck1lc3NhZ2UodmFsdWUpfWAsXG4gICAgICBwYXRoOiAnJyxcbiAgICB9O1xuICB9XG5cbiAgLy8gTWF0Y2guSW50ZWdlciBpcyBzcGVjaWFsIHR5cGUgZW5jb2RlZCB3aXRoIGFycmF5XG4gIGlmIChwYXR0ZXJuID09PSBNYXRjaC5JbnRlZ2VyKSB7XG5cbiAgICAvLyBUaGVyZSBpcyBubyBjb25zaXN0ZW50IGFuZCByZWxpYWJsZSB3YXkgdG8gY2hlY2sgaWYgdmFyaWFibGUgaXMgYSA2NC1iaXRcbiAgICAvLyBpbnRlZ2VyLiBPbmUgb2YgdGhlIHBvcHVsYXIgc29sdXRpb25zIGlzIHRvIGdldCByZW1pbmRlciBvZiBkaXZpc2lvbiBieSAxXG4gICAgLy8gYnV0IHRoaXMgbWV0aG9kIGZhaWxzIG9uIHJlYWxseSBsYXJnZSBmbG9hdHMgd2l0aCBiaWcgcHJlY2lzaW9uLlxuICAgIC8vIEUuZy46IDEuMzQ4MTkyMzA4NDkxODI0ZSsyMyAlIDEgPT09IDAgaW4gVjhcbiAgICAvLyBCaXR3aXNlIG9wZXJhdG9ycyB3b3JrIGNvbnNpc3RhbnRseSBidXQgYWx3YXlzIGNhc3QgdmFyaWFibGUgdG8gMzItYml0XG4gICAgLy8gc2lnbmVkIGludGVnZXIgYWNjb3JkaW5nIHRvIEphdmFTY3JpcHQgc3BlY3MuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgKHZhbHVlIHwgMCkgPT09IHZhbHVlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IGBFeHBlY3RlZCBJbnRlZ2VyLCBnb3QgJHtzdHJpbmdGb3JFcnJvck1lc3NhZ2UodmFsdWUpfWAsXG4gICAgICBwYXRoOiAnJyxcbiAgICB9O1xuICB9XG5cbiAgLy8gJ09iamVjdCcgaXMgc2hvcnRoYW5kIGZvciBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe30pO1xuICBpZiAocGF0dGVybiA9PT0gT2JqZWN0KSB7XG4gICAgcGF0dGVybiA9IE1hdGNoLk9iamVjdEluY2x1ZGluZyh7fSk7XG4gIH1cbiAgLy8gVGhpcyBtdXN0IGJlIGludm9rZWQgYmVmb3JlIHBhdHRlcm4gaW5zdGFuY2VvZiBBcnJheSBhcyBzdHJpbmdzIGFyZSByZWdhcmRlZCBhcyBhcnJheXNcbiAgLy8gV2UgaW52b2tlIHRoZSBwYXR0ZXJuIGFzIElJRkUgc28gdGhhdCBgcGF0dGVybiBpc250YW5jZW9mIFdoZXJlYCBjYXRjaGVzIGl0IFxuICBpZiAocGF0dGVybiA9PT0gTWF0Y2guTm9uRW1wdHlTdHJpbmcpIHtcbiAgICBwYXR0ZXJuID0gbmV3IFdoZXJlKG5vbkVtcHR5U3RyaW5nQ29uZGl0aW9uKTtcbiAgfVxuXG4gIC8vIEFycmF5IChjaGVja2VkIEFGVEVSIEFueSwgd2hpY2ggaXMgaW1wbGVtZW50ZWQgYXMgYW4gQXJyYXkpLlxuICBpZiAocGF0dGVybiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgaWYgKHBhdHRlcm4ubGVuZ3RoICE9PSAxKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXNzYWdlOiBgQmFkIHBhdHRlcm46IGFycmF5cyBtdXN0IGhhdmUgb25lIHR5cGUgZWxlbWVudCAke3N0cmluZ0ZvckVycm9yTWVzc2FnZShwYXR0ZXJuKX1gLFxuICAgICAgICBwYXRoOiAnJyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSAmJiAhaXNBcmd1bWVudHModmFsdWUpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXNzYWdlOiBgRXhwZWN0ZWQgYXJyYXksIGdvdCAke3N0cmluZ0ZvckVycm9yTWVzc2FnZSh2YWx1ZSl9YCxcbiAgICAgICAgcGF0aDogJycsXG4gICAgICB9O1xuICAgIH1cblxuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhcnJQYXRoID0gYCR7cGF0aH1bJHtpfV1gXG4gICAgICBjb25zdCByZXN1bHQgPSB0ZXN0U3VidHJlZSh2YWx1ZVtpXSwgcGF0dGVyblswXSwgY29sbGVjdEVycm9ycywgZXJyb3JzLCBhcnJQYXRoKTtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0LnBhdGggPSBfcHJlcGVuZFBhdGgoY29sbGVjdEVycm9ycyA/IGFyclBhdGggOiBpLCByZXN1bHQucGF0aClcbiAgICAgICAgaWYgKCFjb2xsZWN0RXJyb3JzKSByZXR1cm4gcmVzdWx0O1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlW2ldICE9PSAnb2JqZWN0JyB8fCByZXN1bHQubWVzc2FnZSkgZXJyb3JzLnB1c2gocmVzdWx0KVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghY29sbGVjdEVycm9ycykgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiBlcnJvcnMubGVuZ3RoID09PSAwID8gZmFsc2UgOiBlcnJvcnM7XG4gIH1cblxuICAvLyBBcmJpdHJhcnkgdmFsaWRhdGlvbiBjaGVja3MuIFRoZSBjb25kaXRpb24gY2FuIHJldHVybiBmYWxzZSBvciB0aHJvdyBhXG4gIC8vIE1hdGNoLkVycm9yIChpZSwgaXQgY2FuIGludGVybmFsbHkgdXNlIGNoZWNrKCkpIHRvIGZhaWwuXG4gIGlmIChwYXR0ZXJuIGluc3RhbmNlb2YgV2hlcmUpIHtcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBwYXR0ZXJuLmNvbmRpdGlvbih2YWx1ZSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBNYXRjaC5FcnJvcikpIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgcGF0aDogZXJyLnBhdGhcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFhYWCB0aGlzIGVycm9yIGlzIHRlcnJpYmxlXG5cbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZTogJ0ZhaWxlZCBNYXRjaC5XaGVyZSB2YWxpZGF0aW9uJyxcbiAgICAgIHBhdGg6ICcnLFxuICAgIH07XG4gIH1cblxuICBpZiAocGF0dGVybiBpbnN0YW5jZW9mIE1heWJlKSB7XG4gICAgcGF0dGVybiA9IE1hdGNoLk9uZU9mKHVuZGVmaW5lZCwgbnVsbCwgcGF0dGVybi5wYXR0ZXJuKTtcbiAgfSBlbHNlIGlmIChwYXR0ZXJuIGluc3RhbmNlb2YgT3B0aW9uYWwpIHtcbiAgICBwYXR0ZXJuID0gTWF0Y2guT25lT2YodW5kZWZpbmVkLCBwYXR0ZXJuLnBhdHRlcm4pO1xuICB9XG5cbiAgaWYgKHBhdHRlcm4gaW5zdGFuY2VvZiBPbmVPZikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0dGVybi5jaG9pY2VzLmxlbmd0aDsgKytpKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB0ZXN0U3VidHJlZSh2YWx1ZSwgcGF0dGVybi5jaG9pY2VzW2ldKTtcbiAgICAgIGlmICghcmVzdWx0KSB7XG5cbiAgICAgICAgLy8gTm8gZXJyb3I/IFlheSwgcmV0dXJuLlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIE1hdGNoIGVycm9ycyBqdXN0IG1lYW4gdHJ5IGFub3RoZXIgY2hvaWNlLlxuICAgIH1cblxuICAgIC8vIFhYWCB0aGlzIGVycm9yIGlzIHRlcnJpYmxlXG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgTWF0Y2guT25lT2YsIE1hdGNoLk1heWJlIG9yIE1hdGNoLk9wdGlvbmFsIHZhbGlkYXRpb24nLFxuICAgICAgcGF0aDogJycsXG4gICAgfTtcbiAgfVxuXG4gIC8vIEEgZnVuY3Rpb24gdGhhdCBpc24ndCBzb21ldGhpbmcgd2Ugc3BlY2lhbC1jYXNlIGlzIGFzc3VtZWQgdG8gYmUgYVxuICAvLyBjb25zdHJ1Y3Rvci5cbiAgaWYgKHBhdHRlcm4gaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIHBhdHRlcm4pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZTogYEV4cGVjdGVkICR7cGF0dGVybi5uYW1lIHx8ICdwYXJ0aWN1bGFyIGNvbnN0cnVjdG9yJ31gLFxuICAgICAgcGF0aDogJycsXG4gICAgfTtcbiAgfVxuXG4gIGxldCB1bmtub3duS2V5c0FsbG93ZWQgPSBmYWxzZTtcbiAgbGV0IHVua25vd25LZXlQYXR0ZXJuO1xuICBpZiAocGF0dGVybiBpbnN0YW5jZW9mIE9iamVjdEluY2x1ZGluZykge1xuICAgIHVua25vd25LZXlzQWxsb3dlZCA9IHRydWU7XG4gICAgcGF0dGVybiA9IHBhdHRlcm4ucGF0dGVybjtcbiAgfVxuXG4gIGlmIChwYXR0ZXJuIGluc3RhbmNlb2YgT2JqZWN0V2l0aFZhbHVlcykge1xuICAgIHVua25vd25LZXlzQWxsb3dlZCA9IHRydWU7XG4gICAgdW5rbm93bktleVBhdHRlcm4gPSBbcGF0dGVybi5wYXR0ZXJuXTtcbiAgICBwYXR0ZXJuID0ge307ICAvLyBubyByZXF1aXJlZCBrZXlzXG4gIH1cblxuICBpZiAodHlwZW9mIHBhdHRlcm4gIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6ICdCYWQgcGF0dGVybjogdW5rbm93biBwYXR0ZXJuIHR5cGUnLFxuICAgICAgcGF0aDogJycsXG4gICAgfTtcbiAgfVxuXG4gIC8vIEFuIG9iamVjdCwgd2l0aCByZXF1aXJlZCBhbmQgb3B0aW9uYWwga2V5cy4gTm90ZSB0aGF0IHRoaXMgZG9lcyBOT1QgZG9cbiAgLy8gc3RydWN0dXJhbCBtYXRjaGVzIGFnYWluc3Qgb2JqZWN0cyBvZiBzcGVjaWFsIHR5cGVzIHRoYXQgaGFwcGVuIHRvIG1hdGNoXG4gIC8vIHRoZSBwYXR0ZXJuOiB0aGlzIHJlYWxseSBuZWVkcyB0byBiZSBhIHBsYWluIG9sZCB7T2JqZWN0fSFcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZTogYEV4cGVjdGVkIG9iamVjdCwgZ290ICR7dHlwZW9mIHZhbHVlfWAsXG4gICAgICBwYXRoOiAnJyxcbiAgICB9O1xuICB9XG5cbiAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IGBFeHBlY3RlZCBvYmplY3QsIGdvdCBudWxsYCxcbiAgICAgIHBhdGg6ICcnLFxuICAgIH07XG4gIH1cblxuICBpZiAoISBpc1BsYWluT2JqZWN0KHZhbHVlKSkge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiBgRXhwZWN0ZWQgcGxhaW4gb2JqZWN0YCxcbiAgICAgIHBhdGg6ICcnLFxuICAgIH07XG4gIH1cblxuICBjb25zdCByZXF1aXJlZFBhdHRlcm5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgY29uc3Qgb3B0aW9uYWxQYXR0ZXJucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgT2JqZWN0LmtleXMocGF0dGVybikuZm9yRWFjaChrZXkgPT4ge1xuICAgIGNvbnN0IHN1YlBhdHRlcm4gPSBwYXR0ZXJuW2tleV07XG4gICAgaWYgKHN1YlBhdHRlcm4gaW5zdGFuY2VvZiBPcHRpb25hbCB8fFxuICAgICAgICBzdWJQYXR0ZXJuIGluc3RhbmNlb2YgTWF5YmUpIHtcbiAgICAgIG9wdGlvbmFsUGF0dGVybnNba2V5XSA9IHN1YlBhdHRlcm4ucGF0dGVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxdWlyZWRQYXR0ZXJuc1trZXldID0gc3ViUGF0dGVybjtcbiAgICB9XG4gIH0pO1xuXG4gIGZvciAobGV0IGtleSBpbiBPYmplY3QodmFsdWUpKSB7XG4gICAgY29uc3Qgc3ViVmFsdWUgPSB2YWx1ZVtrZXldO1xuICAgIGNvbnN0IG9ialBhdGggPSBwYXRoID8gYCR7cGF0aH0uJHtrZXl9YCA6IGtleTtcbiAgICBpZiAoaGFzT3duLmNhbGwocmVxdWlyZWRQYXR0ZXJucywga2V5KSkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdGVzdFN1YnRyZWUoc3ViVmFsdWUsIHJlcXVpcmVkUGF0dGVybnNba2V5XSwgY29sbGVjdEVycm9ycywgZXJyb3JzLCBvYmpQYXRoKTtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0LnBhdGggPSBfcHJlcGVuZFBhdGgoY29sbGVjdEVycm9ycyA/IG9ialBhdGggOiBrZXksIHJlc3VsdC5wYXRoKVxuICAgICAgICBpZiAoIWNvbGxlY3RFcnJvcnMpIHJldHVybiByZXN1bHQ7XG4gICAgICAgIGlmICh0eXBlb2Ygc3ViVmFsdWUgIT09ICdvYmplY3QnIHx8IHJlc3VsdC5tZXNzYWdlKSBlcnJvcnMucHVzaChyZXN1bHQpO1xuICAgICAgfVxuXG4gICAgICBkZWxldGUgcmVxdWlyZWRQYXR0ZXJuc1trZXldO1xuICAgIH0gZWxzZSBpZiAoaGFzT3duLmNhbGwob3B0aW9uYWxQYXR0ZXJucywga2V5KSkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdGVzdFN1YnRyZWUoc3ViVmFsdWUsIG9wdGlvbmFsUGF0dGVybnNba2V5XSwgY29sbGVjdEVycm9ycywgZXJyb3JzLCBvYmpQYXRoKTtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0LnBhdGggPSBfcHJlcGVuZFBhdGgoY29sbGVjdEVycm9ycyA/IG9ialBhdGggOiBrZXksIHJlc3VsdC5wYXRoKVxuICAgICAgICBpZiAoIWNvbGxlY3RFcnJvcnMpIHJldHVybiByZXN1bHQ7XG4gICAgICAgIGlmICh0eXBlb2Ygc3ViVmFsdWUgIT09ICdvYmplY3QnIHx8IHJlc3VsdC5tZXNzYWdlKSBlcnJvcnMucHVzaChyZXN1bHQpO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghdW5rbm93bktleXNBbGxvd2VkKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgICAgICBtZXNzYWdlOiAnVW5rbm93biBrZXknLFxuICAgICAgICAgIHBhdGg6IGtleSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFjb2xsZWN0RXJyb3JzKSByZXR1cm4gcmVzdWx0O1xuICAgICAgICBlcnJvcnMucHVzaChyZXN1bHQpO1xuICAgICAgfVxuXG4gICAgICBpZiAodW5rbm93bktleVBhdHRlcm4pIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGVzdFN1YnRyZWUoc3ViVmFsdWUsIHVua25vd25LZXlQYXR0ZXJuWzBdLCBjb2xsZWN0RXJyb3JzLCBlcnJvcnMsIG9ialBhdGgpO1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgcmVzdWx0LnBhdGggPSBfcHJlcGVuZFBhdGgoY29sbGVjdEVycm9ycyA/IG9ialBhdGggOiBrZXksIHJlc3VsdC5wYXRoKVxuICAgICAgICAgIGlmICghY29sbGVjdEVycm9ycykgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICBpZiAodHlwZW9mIHN1YlZhbHVlICE9PSAnb2JqZWN0JyB8fCByZXN1bHQubWVzc2FnZSkgZXJyb3JzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhyZXF1aXJlZFBhdHRlcm5zKTtcbiAgaWYgKGtleXMubGVuZ3RoKSB7XG4gICAgY29uc3QgY3JlYXRlTWlzc2luZ0Vycm9yID0ga2V5ID0+ICh7XG4gICAgICBtZXNzYWdlOiBgTWlzc2luZyBrZXkgJyR7a2V5fSdgLFxuICAgICAgcGF0aDogY29sbGVjdEVycm9ycyA/IHBhdGggOiAnJyxcbiAgICB9KTtcblxuICAgIGlmICghY29sbGVjdEVycm9ycykge1xuICAgICAgcmV0dXJuIGNyZWF0ZU1pc3NpbmdFcnJvcihrZXlzWzBdKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgICBlcnJvcnMucHVzaChjcmVhdGVNaXNzaW5nRXJyb3Ioa2V5KSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFjb2xsZWN0RXJyb3JzKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBlcnJvcnMubGVuZ3RoID09PSAwID8gZmFsc2UgOiBlcnJvcnM7XG59O1xuXG5jbGFzcyBBcmd1bWVudENoZWNrZXIge1xuICBjb25zdHJ1Y3RvciAoYXJncywgZGVzY3JpcHRpb24pIHtcblxuICAgIC8vIE1ha2UgYSBTSEFMTE9XIGNvcHkgb2YgdGhlIGFyZ3VtZW50cy4gKFdlJ2xsIGJlIGRvaW5nIGlkZW50aXR5IGNoZWNrc1xuICAgIC8vIGFnYWluc3QgaXRzIGNvbnRlbnRzLilcbiAgICB0aGlzLmFyZ3MgPSBbLi4uYXJnc107XG5cbiAgICAvLyBTaW5jZSB0aGUgY29tbW9uIGNhc2Ugd2lsbCBiZSB0byBjaGVjayBhcmd1bWVudHMgaW4gb3JkZXIsIGFuZCB3ZSBzcGxpY2VcbiAgICAvLyBvdXQgYXJndW1lbnRzIHdoZW4gd2UgY2hlY2sgdGhlbSwgbWFrZSBpdCBzbyB3ZSBzcGxpY2Ugb3V0IGZyb20gdGhlIGVuZFxuICAgIC8vIHJhdGhlciB0aGFuIHRoZSBiZWdpbm5pbmcuXG4gICAgdGhpcy5hcmdzLnJldmVyc2UoKTtcbiAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb247XG4gIH1cblxuICBjaGVja2luZyh2YWx1ZSkge1xuICAgIGlmICh0aGlzLl9jaGVja2luZ09uZVZhbHVlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEFsbG93IGNoZWNrKGFyZ3VtZW50cywgW1N0cmluZ10pIG9yIGNoZWNrKGFyZ3VtZW50cy5zbGljZSgxKSwgW1N0cmluZ10pXG4gICAgLy8gb3IgY2hlY2soW2ZvbywgYmFyXSwgW1N0cmluZ10pIHRvIGNvdW50Li4uIGJ1dCBvbmx5IGlmIHZhbHVlIHdhc24ndFxuICAgIC8vIGl0c2VsZiBhbiBhcmd1bWVudC5cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgaXNBcmd1bWVudHModmFsdWUpKSB7XG4gICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKHZhbHVlLCB0aGlzLl9jaGVja2luZ09uZVZhbHVlLmJpbmQodGhpcykpO1xuICAgIH1cbiAgfVxuXG4gIF9jaGVja2luZ09uZVZhbHVlKHZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmFyZ3MubGVuZ3RoOyArK2kpIHtcblxuICAgICAgLy8gSXMgdGhpcyB2YWx1ZSBvbmUgb2YgdGhlIGFyZ3VtZW50cz8gKFRoaXMgY2FuIGhhdmUgYSBmYWxzZSBwb3NpdGl2ZSBpZlxuICAgICAgLy8gdGhlIGFyZ3VtZW50IGlzIGFuIGludGVybmVkIHByaW1pdGl2ZSwgYnV0IGl0J3Mgc3RpbGwgYSBnb29kIGVub3VnaFxuICAgICAgLy8gY2hlY2suKVxuICAgICAgLy8gKE5hTiBpcyBub3QgPT09IHRvIGl0c2VsZiwgc28gd2UgaGF2ZSB0byBjaGVjayBzcGVjaWFsbHkuKVxuICAgICAgaWYgKHZhbHVlID09PSB0aGlzLmFyZ3NbaV0gfHxcbiAgICAgICAgICAoTnVtYmVyLmlzTmFOKHZhbHVlKSAmJiBOdW1iZXIuaXNOYU4odGhpcy5hcmdzW2ldKSkpIHtcbiAgICAgICAgdGhpcy5hcmdzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHRocm93VW5sZXNzQWxsQXJndW1lbnRzSGF2ZUJlZW5DaGVja2VkKCkge1xuICAgIGlmICh0aGlzLmFyZ3MubGVuZ3RoID4gMClcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRGlkIG5vdCBjaGVjaygpIGFsbCBhcmd1bWVudHMgZHVyaW5nICR7dGhpcy5kZXNjcmlwdGlvbn1gKTtcbiAgfVxufVxuXG5jb25zdCBfanNLZXl3b3JkcyA9IFsnZG8nLCAnaWYnLCAnaW4nLCAnZm9yJywgJ2xldCcsICduZXcnLCAndHJ5JywgJ3ZhcicsICdjYXNlJyxcbiAgJ2Vsc2UnLCAnZW51bScsICdldmFsJywgJ2ZhbHNlJywgJ251bGwnLCAndGhpcycsICd0cnVlJywgJ3ZvaWQnLCAnd2l0aCcsXG4gICdicmVhaycsICdjYXRjaCcsICdjbGFzcycsICdjb25zdCcsICdzdXBlcicsICd0aHJvdycsICd3aGlsZScsICd5aWVsZCcsXG4gICdkZWxldGUnLCAnZXhwb3J0JywgJ2ltcG9ydCcsICdwdWJsaWMnLCAncmV0dXJuJywgJ3N0YXRpYycsICdzd2l0Y2gnLFxuICAndHlwZW9mJywgJ2RlZmF1bHQnLCAnZXh0ZW5kcycsICdmaW5hbGx5JywgJ3BhY2thZ2UnLCAncHJpdmF0ZScsICdjb250aW51ZScsXG4gICdkZWJ1Z2dlcicsICdmdW5jdGlvbicsICdhcmd1bWVudHMnLCAnaW50ZXJmYWNlJywgJ3Byb3RlY3RlZCcsICdpbXBsZW1lbnRzJyxcbiAgJ2luc3RhbmNlb2YnXTtcblxuLy8gQXNzdW1lcyB0aGUgYmFzZSBvZiBwYXRoIGlzIGFscmVhZHkgZXNjYXBlZCBwcm9wZXJseVxuLy8gcmV0dXJucyBrZXkgKyBiYXNlXG5jb25zdCBfcHJlcGVuZFBhdGggPSAoa2V5LCBiYXNlKSA9PiB7XG4gIGlmICgodHlwZW9mIGtleSkgPT09ICdudW1iZXInIHx8IGtleS5tYXRjaCgvXlswLTldKyQvKSkge1xuICAgIGtleSA9IGBbJHtrZXl9XWA7XG4gIH0gZWxzZSBpZiAoIWtleS5tYXRjaCgvXlthLXpfJF1bMC05YS16XyQuW1xcXV0qJC9pKSB8fFxuICAgICAgICAgICAgIF9qc0tleXdvcmRzLmluZGV4T2Yoa2V5KSA+PSAwKSB7XG4gICAga2V5ID0gSlNPTi5zdHJpbmdpZnkoW2tleV0pO1xuICB9XG5cbiAgaWYgKGJhc2UgJiYgYmFzZVswXSAhPT0gJ1snKSB7XG4gICAgcmV0dXJuIGAke2tleX0uJHtiYXNlfWA7XG4gIH1cblxuICByZXR1cm4ga2V5ICsgYmFzZTtcbn1cblxuY29uc3QgaXNPYmplY3QgPSB2YWx1ZSA9PiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsO1xuXG5jb25zdCBiYXNlSXNBcmd1bWVudHMgPSBpdGVtID0+XG4gIGlzT2JqZWN0KGl0ZW0pICYmXG4gIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpdGVtKSA9PT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cbmNvbnN0IGlzQXJndW1lbnRzID0gYmFzZUlzQXJndW1lbnRzKGZ1bmN0aW9uKCkgeyByZXR1cm4gYXJndW1lbnRzOyB9KCkpID9cbiAgYmFzZUlzQXJndW1lbnRzIDpcbiAgdmFsdWUgPT4gaXNPYmplY3QodmFsdWUpICYmIHR5cGVvZiB2YWx1ZS5jYWxsZWUgPT09ICdmdW5jdGlvbic7XG4iLCIvLyBDb3B5IG9mIGpRdWVyeS5pc1BsYWluT2JqZWN0IGZvciB0aGUgc2VydmVyIHNpZGUgZnJvbSBqUXVlcnkgdjMuMS4xLlxuXG5jb25zdCBjbGFzczJ0eXBlID0ge307XG5cbmNvbnN0IHRvU3RyaW5nID0gY2xhc3MydHlwZS50b1N0cmluZztcblxuY29uc3QgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuY29uc3QgZm5Ub1N0cmluZyA9IGhhc093bi50b1N0cmluZztcblxuY29uc3QgT2JqZWN0RnVuY3Rpb25TdHJpbmcgPSBmblRvU3RyaW5nLmNhbGwoT2JqZWN0KTtcblxuY29uc3QgZ2V0UHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Y7XG5cbmV4cG9ydCBjb25zdCBpc1BsYWluT2JqZWN0ID0gb2JqID0+IHtcbiAgbGV0IHByb3RvO1xuICBsZXQgQ3RvcjtcblxuICAvLyBEZXRlY3Qgb2J2aW91cyBuZWdhdGl2ZXNcbiAgLy8gVXNlIHRvU3RyaW5nIGluc3RlYWQgb2YgalF1ZXJ5LnR5cGUgdG8gY2F0Y2ggaG9zdCBvYmplY3RzXG4gIGlmICghb2JqIHx8IHRvU3RyaW5nLmNhbGwob2JqKSAhPT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcm90byA9IGdldFByb3RvKG9iaik7XG5cbiAgLy8gT2JqZWN0cyB3aXRoIG5vIHByb3RvdHlwZSAoZS5nLiwgYE9iamVjdC5jcmVhdGUoIG51bGwgKWApIGFyZSBwbGFpblxuICBpZiAoIXByb3RvKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBPYmplY3RzIHdpdGggcHJvdG90eXBlIGFyZSBwbGFpbiBpZmYgdGhleSB3ZXJlIGNvbnN0cnVjdGVkIGJ5IGEgZ2xvYmFsIE9iamVjdCBmdW5jdGlvblxuICBDdG9yID0gaGFzT3duLmNhbGwocHJvdG8sICdjb25zdHJ1Y3RvcicpICYmIHByb3RvLmNvbnN0cnVjdG9yO1xuICByZXR1cm4gdHlwZW9mIEN0b3IgPT09ICdmdW5jdGlvbicgJiYgXG4gICAgZm5Ub1N0cmluZy5jYWxsKEN0b3IpID09PSBPYmplY3RGdW5jdGlvblN0cmluZztcbn07XG4iXX0=
