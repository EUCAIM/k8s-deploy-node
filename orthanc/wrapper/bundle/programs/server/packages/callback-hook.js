Package["core-runtime"].queue("callback-hook",function () {/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EmitterPromise = Package.meteor.EmitterPromise;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Hook;

var require = meteorInstall({"node_modules":{"meteor":{"callback-hook":{"hook.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/callback-hook/hook.js                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({Hook:()=>Hook});let _async_to_generator;module.link("@swc/helpers/_/_async_to_generator",{_(v){_async_to_generator=v}},0);
// XXX This pattern is under development. Do not add more callsites
// using this package for now. See:
// https://meteor.hackpad.com/Design-proposal-Hooks-YxvgEW06q6f
//
// Encapsulates the pattern of registering callbacks on a hook.
//
// The `each` method of the hook calls its iterator function argument
// with each registered callback.  This allows the hook to
// conditionally decide not to call the callback (if, for example, the
// observed object has been closed or terminated).
//
// By default, callbacks are bound with `Meteor.bindEnvironment`, so they will be
// called with the Meteor environment of the calling code that
// registered the callback. Override by passing { bindEnvironment: false }
// to the constructor.
//
// Registering a callback returns an object with a single `stop`
// method which unregisters the callback.
//
// The code is careful to allow a callback to be safely unregistered
// while the callbacks are being iterated over.
//
// If the hook is configured with the `exceptionHandler` option, the
// handler will be called if a called callback throws an exception.
// By default (if the exception handler doesn't itself throw an
// exception, or if the iterator function doesn't return a falsy value
// to terminate the calling of callbacks), the remaining callbacks
// will still be called.
//
// Alternatively, the `debugPrintExceptions` option can be specified
// as string describing the callback.  On an exception the string and
// the exception will be printed to the console log with
// `Meteor._debug`, and the exception otherwise ignored.
//
// If an exception handler isn't specified, exceptions thrown in the
// callback will propagate up to the iterator function, and will
// terminate calling the remaining callbacks if not caught.
class Hook {
    /**
   * Clears all registered callbacks from this Hook instance.
   * After calling this method, the hook will have no callbacks registered.
   */ clear() {
        this.callbacks.clear();
    }
    /**
   * Returns the number of callbacks currently registered with this Hook instance.
   * @returns {number} The number of registered callbacks.
   */ size() {
        return this.callbacks.size;
    }
    /**
   * Returns all registered callbacks as a new Array.
   * This provides a snapshot of the current callbacks.
   * @returns {Array<Function>} An array containing all registered callback functions.
   */ asArray() {
        return Array.from(this.callbacks);
    }
    /**
   * Replaces the current set of registered callbacks with a new set derived from the given array.
   *
   * @param {Array<Function>} arr An array of callback functions to register with this hook.
   * @throws {Error} If the provided argument `arr` is not an array.
   */ fromArray(arr) {
        if (!Array.isArray(arr)) {
            throw new Error("Method fromArray expects an array");
        }
        this.callbacks = new Set(arr);
    }
    /**
   * Registers a new callback with this Hook instance.
   *
   * @param {Function} callback The function to register. This function will be called when the hook is iterated over.
   * @returns {{callback: Function, stop: Function}} An object containing:
   *   - `callback`: The actual callback function that was added to the hook's internal set (after any wrapping).
   *   - `stop`: A function that, when called, unregisters this specific callback from the hook.
   */ register(callback) {
        const exceptionHandler = this.exceptionHandler || function(exception) {
            // Note: this relies on the undocumented fact that if bindEnvironment's
            // onException throws, and you are invoking the callback either in the
            // browser or from within a Fiber in Node, the exception is propagated.
            throw exception;
        };
        if (this.bindEnvironment) {
            callback = Meteor.bindEnvironment(callback, exceptionHandler);
        } else {
            callback = wrapHookWithErrorHandling(callback, exceptionHandler);
        }
        if (this.wrapAsync) {
            callback = Meteor.wrapFn(callback);
        }
        this.callbacks.add(callback);
        return {
            callback,
            stop: ()=>{
                this.callbacks.delete(callback);
            }
        };
    }
    /**
   * For each registered callback, call the passed iterator function with the callback.
   *
   * The iterator function can choose whether or not to call the
   * callback.  (For example, it might not call the callback if the
   * observed object has been closed or terminated).
   * The iteration is stopped if the iterator function returns a falsy
   * value or throws an exception.
   *
   * @param iterator
   */ forEach(iterator) {
        for (const callback of this.callbacks){
            if (!iterator(callback)) break;
        }
    }
    /**
   * For each registered callback, call the passed iterator function with the callback.
   *
   * it is a counterpart of forEach, but it is async and returns a promise
   * @param iterator
   * @return {Promise<void>}
   * @see forEach
   */ forEachAsync(iterator) {
        return _async_to_generator(function*() {
            for (const callback of this.callbacks){
                if (!(yield iterator(callback))) break;
            }
        }).call(this);
    }
    /**
   * @deprecated use forEach
   * @param iterator
   */ each(iterator) {
        return this.forEach(iterator);
    }
    /**
   * Makes the Hook instance iterable, allowing it to be used in `for...of` loops.
   * It iterates over the registered callbacks.
   * @returns {Iterator<Function>} An iterator for the registered callbacks.
   */ [Symbol.iterator]() {
        return this.callbacks[Symbol.iterator]();
    }
    /**
   * Creates a new Hook instance.
   * @param {object} [options={}] - Configuration options for the hook.
   * @param {boolean} [options.bindEnvironment=true] - Whether to automatically wrap registered callbacks with `Meteor.bindEnvironment`.
   *   If `true`, callbacks will run in the Meteor environment of the code that registered them.
   * @param {boolean} [options.wrapAsync=true] - Whether to automatically wrap registered callbacks with `Meteor.wrapFn`.
   *   If `true`, callbacks will be prepared to run asynchronously.
   * @param {Function} [options.exceptionHandler] - A custom function to handle exceptions thrown by registered callbacks.
   *   This function will be called with the exception as its argument.
   *   If provided, `options.debugPrintExceptions` will be ignored.
   * @param {string} [options.debugPrintExceptions] - If an `exceptionHandler` is not provided, and this option is a string,
   *   exceptions thrown by callbacks will be logged to `Meteor._debug` with this string as a description.
   */ constructor(options = {}){
        this.callbacks = new Set();
        // Whether to wrap callbacks with Meteor.bindEnvironment
        const { bindEnvironment = true, wrapAsync = true } = options;
        this.bindEnvironment = !!bindEnvironment;
        this.wrapAsync = !!wrapAsync;
        if (options.exceptionHandler) {
            this.exceptionHandler = options.exceptionHandler;
        } else if (options.debugPrintExceptions) {
            if (typeof options.debugPrintExceptions !== "string") {
                throw new Error("Hook option debugPrintExceptions should be a string");
            }
            this.exceptionHandler = options.debugPrintExceptions;
        }
    }
}
/**
 * Wraps a given function with error handling. If the wrapped function throws an exception,
 * it will be caught and passed to the provided exception handler.
 * This is similar to `Meteor.bindEnvironment` but without the Meteor environment binding.
 *
 * @param {Function} func The function to wrap.
 * @param {Function|string} onException The exception handler function to call if `func` throws,
 *   or a string description for default exception logging.
 * @param {any} _this The `this` context to bind to `func` when it is called.
 * @returns {Function} A new function that executes `func` with error handling.
 */ function wrapHookWithErrorHandling(func, onException, _this) {
    const exceptionHandler = normalizeHookExceptionHandler(onException);
    return function executeHookWithErrorHandling(...args) {
        let ret;
        try {
            ret = func.apply(_this, args);
        } catch (e) {
            exceptionHandler(e);
        }
        return ret;
    };
}
/**
 * Normalizes an exception handler, ensuring it is a function.
 * If a function is provided, it is returned directly.
 * If a string is provided, it is used as a description for a default handler that logs exceptions.
 * Otherwise, a generic default handler that logs exceptions with a default description is returned.
 *
 * @param {Function|string} exceptionHandler The exception handler to normalize. Can be a function,
 *   a string description for logging, or any other value (which defaults to generic logging).
 * @returns {Function} A function that handles exceptions.
 */ function normalizeHookExceptionHandler(exceptionHandler) {
    if (typeof exceptionHandler === 'function') {
        return exceptionHandler;
    }
    const description = typeof exceptionHandler === 'string' ? exceptionHandler : "callback of async function";
    return function defaultHookExceptionHandler(error) {
        Meteor._debug(`Exception in ${description}`, error);
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
      Hook: Hook
    };},
  require: require,
  eagerModulePaths: [
    "/node_modules/meteor/callback-hook/hook.js"
  ],
  mainModulePath: "/node_modules/meteor/callback-hook/hook.js"
}});

//# sourceURL=meteor://💻app/packages/callback-hook.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY2FsbGJhY2staG9vay9ob29rLmpzIl0sIm5hbWVzIjpbIkhvb2siLCJjbGVhciIsImNhbGxiYWNrcyIsInNpemUiLCJhc0FycmF5IiwiQXJyYXkiLCJmcm9tIiwiZnJvbUFycmF5IiwiYXJyIiwiaXNBcnJheSIsIkVycm9yIiwiU2V0IiwicmVnaXN0ZXIiLCJjYWxsYmFjayIsImV4Y2VwdGlvbkhhbmRsZXIiLCJleGNlcHRpb24iLCJiaW5kRW52aXJvbm1lbnQiLCJNZXRlb3IiLCJ3cmFwSG9va1dpdGhFcnJvckhhbmRsaW5nIiwid3JhcEFzeW5jIiwid3JhcEZuIiwiYWRkIiwic3RvcCIsImRlbGV0ZSIsImZvckVhY2giLCJpdGVyYXRvciIsImZvckVhY2hBc3luYyIsImVhY2giLCJTeW1ib2wiLCJvcHRpb25zIiwiZGVidWdQcmludEV4Y2VwdGlvbnMiLCJmdW5jIiwib25FeGNlcHRpb24iLCJfdGhpcyIsIm5vcm1hbGl6ZUhvb2tFeGNlcHRpb25IYW5kbGVyIiwiZXhlY3V0ZUhvb2tXaXRoRXJyb3JIYW5kbGluZyIsImFyZ3MiLCJyZXQiLCJhcHBseSIsImUiLCJkZXNjcmlwdGlvbiIsImRlZmF1bHRIb29rRXhjZXB0aW9uSGFuZGxlciIsImVycm9yIiwiX2RlYnVnIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxtRUFBbUU7QUFDbkUsbUNBQW1DO0FBQ25DLCtEQUErRDtBQUMvRCxFQUFFO0FBQ0YsK0RBQStEO0FBQy9ELEVBQUU7QUFDRixxRUFBcUU7QUFDckUsMERBQTBEO0FBQzFELHNFQUFzRTtBQUN0RSxrREFBa0Q7QUFDbEQsRUFBRTtBQUNGLGlGQUFpRjtBQUNqRiw4REFBOEQ7QUFDOUQsMEVBQTBFO0FBQzFFLHNCQUFzQjtBQUN0QixFQUFFO0FBQ0YsZ0VBQWdFO0FBQ2hFLHlDQUF5QztBQUN6QyxFQUFFO0FBQ0Ysb0VBQW9FO0FBQ3BFLCtDQUErQztBQUMvQyxFQUFF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QUssVUFBVTtnQkFDcEQsTUFBTSxJQUFJcEIsTUFBTTtZQUNsQjtZQUNBLElBQUksQ0FBQ0ksZ0JBQWdCLEdBQUdlLFFBQVFDLG9CQUFvQjtRQUN0RDtJQUNGO0FBMkhKO0FBRUE7Ozs7Ozs7Ozs7Q0FVQyxHQUNELFNBQVNaLDBCQUEwQmEsSUFBSSxFQUFFQyxXQUFXLEVBQUVDLEtBQUs7SUFDekQsTUFBTW5CLG1CQUFtQm9CLDhCQUE4QkY7SUFDdkQsT0FBTyxTQUFTRyw2QkFBNkIsR0FBR0MsSUFBSTtRQUNsRCxJQUFJQztRQUNKLElBQUk7WUFDRkEsTUFBTU4sS0FBS08sS0FBSyxDQUFDTCxPQUFPRztRQUMxQixFQUFFLE9BQU9HLEdBQUc7WUFDVnpCLGlCQUFpQnlCO1FBQ25CO1FBQ0EsT0FBT0Y7SUFDVDtBQUNGO0FBRUE7Ozs7Ozs7OztDQVNDLEdBQ0QsU0FBU0gsOEJBQThCcEIsZ0JBQWdCO0lBQ3JELElBQUksT0FBT0EscUJBQXFCLFlBQVk7UUFDMUMsT0FBT0E7SUFDVDtJQUVBLE1BQU0wQixjQUFjLE9BQU8xQixxQkFBcUIsV0FDNUNBLG1CQUNBO0lBRUosT0FBTyxTQUFTMkIsNEJBQTRCQyxLQUFLO1FBQy9DekIsT0FBTzBCLE1BQU0sQ0FBQyxDQUFDLGFBQWEsRUFBRUgsYUFBYSxFQUFFRTtJQUMvQztBQUNGIiwiZmlsZSI6Ii9wYWNrYWdlcy9jYWxsYmFjay1ob29rLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gWFhYIFRoaXMgcGF0dGVybiBpcyB1bmRlciBkZXZlbG9wbWVudC4gRG8gbm90IGFkZCBtb3JlIGNhbGxzaXRlc1xuLy8gdXNpbmcgdGhpcyBwYWNrYWdlIGZvciBub3cuIFNlZTpcbi8vIGh0dHBzOi8vbWV0ZW9yLmhhY2twYWQuY29tL0Rlc2lnbi1wcm9wb3NhbC1Ib29rcy1ZeHZnRVcwNnE2ZlxuLy9cbi8vIEVuY2Fwc3VsYXRlcyB0aGUgcGF0dGVybiBvZiByZWdpc3RlcmluZyBjYWxsYmFja3Mgb24gYSBob29rLlxuLy9cbi8vIFRoZSBgZWFjaGAgbWV0aG9kIG9mIHRoZSBob29rIGNhbGxzIGl0cyBpdGVyYXRvciBmdW5jdGlvbiBhcmd1bWVudFxuLy8gd2l0aCBlYWNoIHJlZ2lzdGVyZWQgY2FsbGJhY2suICBUaGlzIGFsbG93cyB0aGUgaG9vayB0b1xuLy8gY29uZGl0aW9uYWxseSBkZWNpZGUgbm90IHRvIGNhbGwgdGhlIGNhbGxiYWNrIChpZiwgZm9yIGV4YW1wbGUsIHRoZVxuLy8gb2JzZXJ2ZWQgb2JqZWN0IGhhcyBiZWVuIGNsb3NlZCBvciB0ZXJtaW5hdGVkKS5cbi8vXG4vLyBCeSBkZWZhdWx0LCBjYWxsYmFja3MgYXJlIGJvdW5kIHdpdGggYE1ldGVvci5iaW5kRW52aXJvbm1lbnRgLCBzbyB0aGV5IHdpbGwgYmVcbi8vIGNhbGxlZCB3aXRoIHRoZSBNZXRlb3IgZW52aXJvbm1lbnQgb2YgdGhlIGNhbGxpbmcgY29kZSB0aGF0XG4vLyByZWdpc3RlcmVkIHRoZSBjYWxsYmFjay4gT3ZlcnJpZGUgYnkgcGFzc2luZyB7IGJpbmRFbnZpcm9ubWVudDogZmFsc2UgfVxuLy8gdG8gdGhlIGNvbnN0cnVjdG9yLlxuLy9cbi8vIFJlZ2lzdGVyaW5nIGEgY2FsbGJhY2sgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBhIHNpbmdsZSBgc3RvcGBcbi8vIG1ldGhvZCB3aGljaCB1bnJlZ2lzdGVycyB0aGUgY2FsbGJhY2suXG4vL1xuLy8gVGhlIGNvZGUgaXMgY2FyZWZ1bCB0byBhbGxvdyBhIGNhbGxiYWNrIHRvIGJlIHNhZmVseSB1bnJlZ2lzdGVyZWRcbi8vIHdoaWxlIHRoZSBjYWxsYmFja3MgYXJlIGJlaW5nIGl0ZXJhdGVkIG92ZXIuXG4vL1xuLy8gSWYgdGhlIGhvb2sgaXMgY29uZmlndXJlZCB3aXRoIHRoZSBgZXhjZXB0aW9uSGFuZGxlcmAgb3B0aW9uLCB0aGVcbi8vIGhhbmRsZXIgd2lsbCBiZSBjYWxsZWQgaWYgYSBjYWxsZWQgY2FsbGJhY2sgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cbi8vIEJ5IGRlZmF1bHQgKGlmIHRoZSBleGNlcHRpb24gaGFuZGxlciBkb2Vzbid0IGl0c2VsZiB0aHJvdyBhblxuLy8gZXhjZXB0aW9uLCBvciBpZiB0aGUgaXRlcmF0b3IgZnVuY3Rpb24gZG9lc24ndCByZXR1cm4gYSBmYWxzeSB2YWx1ZVxuLy8gdG8gdGVybWluYXRlIHRoZSBjYWxsaW5nIG9mIGNhbGxiYWNrcyksIHRoZSByZW1haW5pbmcgY2FsbGJhY2tzXG4vLyB3aWxsIHN0aWxsIGJlIGNhbGxlZC5cbi8vXG4vLyBBbHRlcm5hdGl2ZWx5LCB0aGUgYGRlYnVnUHJpbnRFeGNlcHRpb25zYCBvcHRpb24gY2FuIGJlIHNwZWNpZmllZFxuLy8gYXMgc3RyaW5nIGRlc2NyaWJpbmcgdGhlIGNhbGxiYWNrLiAgT24gYW4gZXhjZXB0aW9uIHRoZSBzdHJpbmcgYW5kXG4vLyB0aGUgZXhjZXB0aW9uIHdpbGwgYmUgcHJpbnRlZCB0byB0aGUgY29uc29sZSBsb2cgd2l0aFxuLy8gYE1ldGVvci5fZGVidWdgLCBhbmQgdGhlIGV4Y2VwdGlvbiBvdGhlcndpc2UgaWdub3JlZC5cbi8vXG4vLyBJZiBhbiBleGNlcHRpb24gaGFuZGxlciBpc24ndCBzcGVjaWZpZWQsIGV4Y2VwdGlvbnMgdGhyb3duIGluIHRoZVxuLy8gY2FsbGJhY2sgd2lsbCBwcm9wYWdhdGUgdXAgdG8gdGhlIGl0ZXJhdG9yIGZ1bmN0aW9uLCBhbmQgd2lsbFxuLy8gdGVybWluYXRlIGNhbGxpbmcgdGhlIHJlbWFpbmluZyBjYWxsYmFja3MgaWYgbm90IGNhdWdodC5cblxuZXhwb3J0IGNsYXNzIEhvb2sge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBIb29rIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnM9e31dIC0gQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgaG9vay5cbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5iaW5kRW52aXJvbm1lbnQ9dHJ1ZV0gLSBXaGV0aGVyIHRvIGF1dG9tYXRpY2FsbHkgd3JhcCByZWdpc3RlcmVkIGNhbGxiYWNrcyB3aXRoIGBNZXRlb3IuYmluZEVudmlyb25tZW50YC5cbiAgICogICBJZiBgdHJ1ZWAsIGNhbGxiYWNrcyB3aWxsIHJ1biBpbiB0aGUgTWV0ZW9yIGVudmlyb25tZW50IG9mIHRoZSBjb2RlIHRoYXQgcmVnaXN0ZXJlZCB0aGVtLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLndyYXBBc3luYz10cnVlXSAtIFdoZXRoZXIgdG8gYXV0b21hdGljYWxseSB3cmFwIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIHdpdGggYE1ldGVvci53cmFwRm5gLlxuICAgKiAgIElmIGB0cnVlYCwgY2FsbGJhY2tzIHdpbGwgYmUgcHJlcGFyZWQgdG8gcnVuIGFzeW5jaHJvbm91c2x5LlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb3B0aW9ucy5leGNlcHRpb25IYW5kbGVyXSAtIEEgY3VzdG9tIGZ1bmN0aW9uIHRvIGhhbmRsZSBleGNlcHRpb25zIHRocm93biBieSByZWdpc3RlcmVkIGNhbGxiYWNrcy5cbiAgICogICBUaGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHdpdGggdGhlIGV4Y2VwdGlvbiBhcyBpdHMgYXJndW1lbnQuXG4gICAqICAgSWYgcHJvdmlkZWQsIGBvcHRpb25zLmRlYnVnUHJpbnRFeGNlcHRpb25zYCB3aWxsIGJlIGlnbm9yZWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kZWJ1Z1ByaW50RXhjZXB0aW9uc10gLSBJZiBhbiBgZXhjZXB0aW9uSGFuZGxlcmAgaXMgbm90IHByb3ZpZGVkLCBhbmQgdGhpcyBvcHRpb24gaXMgYSBzdHJpbmcsXG4gICAqICAgZXhjZXB0aW9ucyB0aHJvd24gYnkgY2FsbGJhY2tzIHdpbGwgYmUgbG9nZ2VkIHRvIGBNZXRlb3IuX2RlYnVnYCB3aXRoIHRoaXMgc3RyaW5nIGFzIGEgZGVzY3JpcHRpb24uXG4gICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgICAgdGhpcy5jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG5cbiAgICAgIC8vIFdoZXRoZXIgdG8gd3JhcCBjYWxsYmFja3Mgd2l0aCBNZXRlb3IuYmluZEVudmlyb25tZW50XG4gICAgICBjb25zdCB7IGJpbmRFbnZpcm9ubWVudCA9IHRydWUsIHdyYXBBc3luYyA9IHRydWUgfSA9IG9wdGlvbnM7XG4gICAgICB0aGlzLmJpbmRFbnZpcm9ubWVudCA9ICEhYmluZEVudmlyb25tZW50O1xuICAgICAgdGhpcy53cmFwQXN5bmMgPSAhIXdyYXBBc3luYztcblxuICAgICAgaWYgKG9wdGlvbnMuZXhjZXB0aW9uSGFuZGxlcikge1xuICAgICAgICB0aGlzLmV4Y2VwdGlvbkhhbmRsZXIgPSBvcHRpb25zLmV4Y2VwdGlvbkhhbmRsZXI7XG4gICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZGVidWdQcmludEV4Y2VwdGlvbnMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmRlYnVnUHJpbnRFeGNlcHRpb25zICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSG9vayBvcHRpb24gZGVidWdQcmludEV4Y2VwdGlvbnMgc2hvdWxkIGJlIGEgc3RyaW5nXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXhjZXB0aW9uSGFuZGxlciA9IG9wdGlvbnMuZGVidWdQcmludEV4Y2VwdGlvbnM7XG4gICAgICB9XG4gICAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYWxsIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGZyb20gdGhpcyBIb29rIGluc3RhbmNlLlxuICAgKiBBZnRlciBjYWxsaW5nIHRoaXMgbWV0aG9kLCB0aGUgaG9vayB3aWxsIGhhdmUgbm8gY2FsbGJhY2tzIHJlZ2lzdGVyZWQuXG4gICAqL1xuICBjbGVhcigpIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBjYWxsYmFja3MgY3VycmVudGx5IHJlZ2lzdGVyZWQgd2l0aCB0aGlzIEhvb2sgaW5zdGFuY2UuXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBudW1iZXIgb2YgcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gICAqL1xuICBzaXplKCkge1xuICAgIHJldHVybiB0aGlzLmNhbGxiYWNrcy5zaXplO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYWxsIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGFzIGEgbmV3IEFycmF5LlxuICAgKiBUaGlzIHByb3ZpZGVzIGEgc25hcHNob3Qgb2YgdGhlIGN1cnJlbnQgY2FsbGJhY2tzLlxuICAgKiBAcmV0dXJucyB7QXJyYXk8RnVuY3Rpb24+fSBBbiBhcnJheSBjb250YWluaW5nIGFsbCByZWdpc3RlcmVkIGNhbGxiYWNrIGZ1bmN0aW9ucy5cbiAgICovXG4gIGFzQXJyYXkoKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5jYWxsYmFja3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcGxhY2VzIHRoZSBjdXJyZW50IHNldCBvZiByZWdpc3RlcmVkIGNhbGxiYWNrcyB3aXRoIGEgbmV3IHNldCBkZXJpdmVkIGZyb20gdGhlIGdpdmVuIGFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5PEZ1bmN0aW9uPn0gYXJyIEFuIGFycmF5IG9mIGNhbGxiYWNrIGZ1bmN0aW9ucyB0byByZWdpc3RlciB3aXRoIHRoaXMgaG9vay5cbiAgICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBwcm92aWRlZCBhcmd1bWVudCBgYXJyYCBpcyBub3QgYW4gYXJyYXkuXG4gICAqL1xuICBmcm9tQXJyYXkoYXJyKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFycikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCBmcm9tQXJyYXkgZXhwZWN0cyBhbiBhcnJheVwiKTtcbiAgICB9XG4gICAgdGhpcy5jYWxsYmFja3MgPSBuZXcgU2V0KGFycik7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgbmV3IGNhbGxiYWNrIHdpdGggdGhpcyBIb29rIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gcmVnaXN0ZXIuIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgaG9vayBpcyBpdGVyYXRlZCBvdmVyLlxuICAgKiBAcmV0dXJucyB7e2NhbGxiYWNrOiBGdW5jdGlvbiwgc3RvcDogRnVuY3Rpb259fSBBbiBvYmplY3QgY29udGFpbmluZzpcbiAgICogICAtIGBjYWxsYmFja2A6IFRoZSBhY3R1YWwgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3YXMgYWRkZWQgdG8gdGhlIGhvb2sncyBpbnRlcm5hbCBzZXQgKGFmdGVyIGFueSB3cmFwcGluZykuXG4gICAqICAgLSBgc3RvcGA6IEEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsIHVucmVnaXN0ZXJzIHRoaXMgc3BlY2lmaWMgY2FsbGJhY2sgZnJvbSB0aGUgaG9vay5cbiAgICovXG4gIHJlZ2lzdGVyKGNhbGxiYWNrKSB7XG4gICAgY29uc3QgZXhjZXB0aW9uSGFuZGxlciA9IHRoaXMuZXhjZXB0aW9uSGFuZGxlciB8fCBmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAvLyBOb3RlOiB0aGlzIHJlbGllcyBvbiB0aGUgdW5kb2N1bWVudGVkIGZhY3QgdGhhdCBpZiBiaW5kRW52aXJvbm1lbnQnc1xuICAgICAgLy8gb25FeGNlcHRpb24gdGhyb3dzLCBhbmQgeW91IGFyZSBpbnZva2luZyB0aGUgY2FsbGJhY2sgZWl0aGVyIGluIHRoZVxuICAgICAgLy8gYnJvd3NlciBvciBmcm9tIHdpdGhpbiBhIEZpYmVyIGluIE5vZGUsIHRoZSBleGNlcHRpb24gaXMgcHJvcGFnYXRlZC5cbiAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuYmluZEVudmlyb25tZW50KSB7XG4gICAgICBjYWxsYmFjayA9IE1ldGVvci5iaW5kRW52aXJvbm1lbnQoY2FsbGJhY2ssIGV4Y2VwdGlvbkhhbmRsZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayA9IHdyYXBIb29rV2l0aEVycm9ySGFuZGxpbmcoY2FsbGJhY2ssIGV4Y2VwdGlvbkhhbmRsZXIpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLndyYXBBc3luYykge1xuICAgICAgY2FsbGJhY2sgPSBNZXRlb3Iud3JhcEZuKGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICB0aGlzLmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNhbGxiYWNrLFxuICAgICAgc3RvcDogKCkgPT4ge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRm9yIGVhY2ggcmVnaXN0ZXJlZCBjYWxsYmFjaywgY2FsbCB0aGUgcGFzc2VkIGl0ZXJhdG9yIGZ1bmN0aW9uIHdpdGggdGhlIGNhbGxiYWNrLlxuICAgKlxuICAgKiBUaGUgaXRlcmF0b3IgZnVuY3Rpb24gY2FuIGNob29zZSB3aGV0aGVyIG9yIG5vdCB0byBjYWxsIHRoZVxuICAgKiBjYWxsYmFjay4gIChGb3IgZXhhbXBsZSwgaXQgbWlnaHQgbm90IGNhbGwgdGhlIGNhbGxiYWNrIGlmIHRoZVxuICAgKiBvYnNlcnZlZCBvYmplY3QgaGFzIGJlZW4gY2xvc2VkIG9yIHRlcm1pbmF0ZWQpLlxuICAgKiBUaGUgaXRlcmF0aW9uIGlzIHN0b3BwZWQgaWYgdGhlIGl0ZXJhdG9yIGZ1bmN0aW9uIHJldHVybnMgYSBmYWxzeVxuICAgKiB2YWx1ZSBvciB0aHJvd3MgYW4gZXhjZXB0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gaXRlcmF0b3JcbiAgICovXG4gIGZvckVhY2goaXRlcmF0b3IpIHtcbiAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuY2FsbGJhY2tzKSB7XG4gICAgICBpZiAoIWl0ZXJhdG9yKGNhbGxiYWNrKSkgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvciBlYWNoIHJlZ2lzdGVyZWQgY2FsbGJhY2ssIGNhbGwgdGhlIHBhc3NlZCBpdGVyYXRvciBmdW5jdGlvbiB3aXRoIHRoZSBjYWxsYmFjay5cbiAgICpcbiAgICogaXQgaXMgYSBjb3VudGVycGFydCBvZiBmb3JFYWNoLCBidXQgaXQgaXMgYXN5bmMgYW5kIHJldHVybnMgYSBwcm9taXNlXG4gICAqIEBwYXJhbSBpdGVyYXRvclxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKiBAc2VlIGZvckVhY2hcbiAgICovXG4gIGFzeW5jIGZvckVhY2hBc3luYyhpdGVyYXRvcikge1xuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5jYWxsYmFja3MpIHtcbiAgICAgIGlmICghYXdhaXQgaXRlcmF0b3IoY2FsbGJhY2spKSBicmVhaztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgdXNlIGZvckVhY2hcbiAgICogQHBhcmFtIGl0ZXJhdG9yXG4gICAqL1xuICBlYWNoKGl0ZXJhdG9yKSB7XG4gICAgcmV0dXJuIHRoaXMuZm9yRWFjaChpdGVyYXRvcik7XG4gIH1cblxuICAvKipcbiAgICogTWFrZXMgdGhlIEhvb2sgaW5zdGFuY2UgaXRlcmFibGUsIGFsbG93aW5nIGl0IHRvIGJlIHVzZWQgaW4gYGZvci4uLm9mYCBsb29wcy5cbiAgICogSXQgaXRlcmF0ZXMgb3ZlciB0aGUgcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gICAqIEByZXR1cm5zIHtJdGVyYXRvcjxGdW5jdGlvbj59IEFuIGl0ZXJhdG9yIGZvciB0aGUgcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gICAqL1xuICBbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsYmFja3NbU3ltYm9sLml0ZXJhdG9yXSgpO1xuICB9XG59XG5cbi8qKlxuICogV3JhcHMgYSBnaXZlbiBmdW5jdGlvbiB3aXRoIGVycm9yIGhhbmRsaW5nLiBJZiB0aGUgd3JhcHBlZCBmdW5jdGlvbiB0aHJvd3MgYW4gZXhjZXB0aW9uLFxuICogaXQgd2lsbCBiZSBjYXVnaHQgYW5kIHBhc3NlZCB0byB0aGUgcHJvdmlkZWQgZXhjZXB0aW9uIGhhbmRsZXIuXG4gKiBUaGlzIGlzIHNpbWlsYXIgdG8gYE1ldGVvci5iaW5kRW52aXJvbm1lbnRgIGJ1dCB3aXRob3V0IHRoZSBNZXRlb3IgZW52aXJvbm1lbnQgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICogQHBhcmFtIHtGdW5jdGlvbnxzdHJpbmd9IG9uRXhjZXB0aW9uIFRoZSBleGNlcHRpb24gaGFuZGxlciBmdW5jdGlvbiB0byBjYWxsIGlmIGBmdW5jYCB0aHJvd3MsXG4gKiAgIG9yIGEgc3RyaW5nIGRlc2NyaXB0aW9uIGZvciBkZWZhdWx0IGV4Y2VwdGlvbiBsb2dnaW5nLlxuICogQHBhcmFtIHthbnl9IF90aGlzIFRoZSBgdGhpc2AgY29udGV4dCB0byBiaW5kIHRvIGBmdW5jYCB3aGVuIGl0IGlzIGNhbGxlZC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24gdGhhdCBleGVjdXRlcyBgZnVuY2Agd2l0aCBlcnJvciBoYW5kbGluZy5cbiAqL1xuZnVuY3Rpb24gd3JhcEhvb2tXaXRoRXJyb3JIYW5kbGluZyhmdW5jLCBvbkV4Y2VwdGlvbiwgX3RoaXMpIHtcbiAgY29uc3QgZXhjZXB0aW9uSGFuZGxlciA9IG5vcm1hbGl6ZUhvb2tFeGNlcHRpb25IYW5kbGVyKG9uRXhjZXB0aW9uKTtcbiAgcmV0dXJuIGZ1bmN0aW9uIGV4ZWN1dGVIb29rV2l0aEVycm9ySGFuZGxpbmcoLi4uYXJncykge1xuICAgIGxldCByZXQ7XG4gICAgdHJ5IHtcbiAgICAgIHJldCA9IGZ1bmMuYXBwbHkoX3RoaXMsIGFyZ3MpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGV4Y2VwdGlvbkhhbmRsZXIoZSk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH07XG59XG5cbi8qKlxuICogTm9ybWFsaXplcyBhbiBleGNlcHRpb24gaGFuZGxlciwgZW5zdXJpbmcgaXQgaXMgYSBmdW5jdGlvbi5cbiAqIElmIGEgZnVuY3Rpb24gaXMgcHJvdmlkZWQsIGl0IGlzIHJldHVybmVkIGRpcmVjdGx5LlxuICogSWYgYSBzdHJpbmcgaXMgcHJvdmlkZWQsIGl0IGlzIHVzZWQgYXMgYSBkZXNjcmlwdGlvbiBmb3IgYSBkZWZhdWx0IGhhbmRsZXIgdGhhdCBsb2dzIGV4Y2VwdGlvbnMuXG4gKiBPdGhlcndpc2UsIGEgZ2VuZXJpYyBkZWZhdWx0IGhhbmRsZXIgdGhhdCBsb2dzIGV4Y2VwdGlvbnMgd2l0aCBhIGRlZmF1bHQgZGVzY3JpcHRpb24gaXMgcmV0dXJuZWQuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbnxzdHJpbmd9IGV4Y2VwdGlvbkhhbmRsZXIgVGhlIGV4Y2VwdGlvbiBoYW5kbGVyIHRvIG5vcm1hbGl6ZS4gQ2FuIGJlIGEgZnVuY3Rpb24sXG4gKiAgIGEgc3RyaW5nIGRlc2NyaXB0aW9uIGZvciBsb2dnaW5nLCBvciBhbnkgb3RoZXIgdmFsdWUgKHdoaWNoIGRlZmF1bHRzIHRvIGdlbmVyaWMgbG9nZ2luZykuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IEEgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIGV4Y2VwdGlvbnMuXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUhvb2tFeGNlcHRpb25IYW5kbGVyKGV4Y2VwdGlvbkhhbmRsZXIpIHtcbiAgaWYgKHR5cGVvZiBleGNlcHRpb25IYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGV4Y2VwdGlvbkhhbmRsZXI7XG4gIH1cblxuICBjb25zdCBkZXNjcmlwdGlvbiA9IHR5cGVvZiBleGNlcHRpb25IYW5kbGVyID09PSAnc3RyaW5nJ1xuICAgID8gZXhjZXB0aW9uSGFuZGxlclxuICAgIDogXCJjYWxsYmFjayBvZiBhc3luYyBmdW5jdGlvblwiO1xuXG4gIHJldHVybiBmdW5jdGlvbiBkZWZhdWx0SG9va0V4Y2VwdGlvbkhhbmRsZXIoZXJyb3IpIHtcbiAgICBNZXRlb3IuX2RlYnVnKGBFeGNlcHRpb24gaW4gJHtkZXNjcmlwdGlvbn1gLCBlcnJvcik7XG4gIH1cbn1cbiJdfQ==
