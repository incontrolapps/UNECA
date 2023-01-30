
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*!
     * Quill Editor v1.3.7
     * https://quilljs.com/
     * Copyright (c) 2014, Jason Chen
     * Copyright (c) 2013, salesforce.com
     */

    var quill = createCommonjsModule(function (module, exports) {
    (function webpackUniversalModuleDefinition(root, factory) {
    	module.exports = factory();
    })(typeof self !== 'undefined' ? self : commonjsGlobal, function() {
    return /******/ (function(modules) { // webpackBootstrap
    /******/ 	// The module cache
    /******/ 	var installedModules = {};
    /******/
    /******/ 	// The require function
    /******/ 	function __webpack_require__(moduleId) {
    /******/
    /******/ 		// Check if module is in cache
    /******/ 		if(installedModules[moduleId]) {
    /******/ 			return installedModules[moduleId].exports;
    /******/ 		}
    /******/ 		// Create a new module (and put it into the cache)
    /******/ 		var module = installedModules[moduleId] = {
    /******/ 			i: moduleId,
    /******/ 			l: false,
    /******/ 			exports: {}
    /******/ 		};
    /******/
    /******/ 		// Execute the module function
    /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    /******/
    /******/ 		// Flag the module as loaded
    /******/ 		module.l = true;
    /******/
    /******/ 		// Return the exports of the module
    /******/ 		return module.exports;
    /******/ 	}
    /******/
    /******/
    /******/ 	// expose the modules object (__webpack_modules__)
    /******/ 	__webpack_require__.m = modules;
    /******/
    /******/ 	// expose the module cache
    /******/ 	__webpack_require__.c = installedModules;
    /******/
    /******/ 	// define getter function for harmony exports
    /******/ 	__webpack_require__.d = function(exports, name, getter) {
    /******/ 		if(!__webpack_require__.o(exports, name)) {
    /******/ 			Object.defineProperty(exports, name, {
    /******/ 				configurable: false,
    /******/ 				enumerable: true,
    /******/ 				get: getter
    /******/ 			});
    /******/ 		}
    /******/ 	};
    /******/
    /******/ 	// getDefaultExport function for compatibility with non-harmony modules
    /******/ 	__webpack_require__.n = function(module) {
    /******/ 		var getter = module && module.__esModule ?
    /******/ 			function getDefault() { return module['default']; } :
    /******/ 			function getModuleExports() { return module; };
    /******/ 		__webpack_require__.d(getter, 'a', getter);
    /******/ 		return getter;
    /******/ 	};
    /******/
    /******/ 	// Object.prototype.hasOwnProperty.call
    /******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
    /******/
    /******/ 	// __webpack_public_path__
    /******/ 	__webpack_require__.p = "";
    /******/
    /******/ 	// Load entry module and return exports
    /******/ 	return __webpack_require__(__webpack_require__.s = 109);
    /******/ })
    /************************************************************************/
    /******/ ([
    /* 0 */
    /***/ (function(module, exports, __webpack_require__) {

    Object.defineProperty(exports, "__esModule", { value: true });
    var container_1 = __webpack_require__(17);
    var format_1 = __webpack_require__(18);
    var leaf_1 = __webpack_require__(19);
    var scroll_1 = __webpack_require__(45);
    var inline_1 = __webpack_require__(46);
    var block_1 = __webpack_require__(47);
    var embed_1 = __webpack_require__(48);
    var text_1 = __webpack_require__(49);
    var attributor_1 = __webpack_require__(12);
    var class_1 = __webpack_require__(32);
    var style_1 = __webpack_require__(33);
    var store_1 = __webpack_require__(31);
    var Registry = __webpack_require__(1);
    var Parchment = {
        Scope: Registry.Scope,
        create: Registry.create,
        find: Registry.find,
        query: Registry.query,
        register: Registry.register,
        Container: container_1.default,
        Format: format_1.default,
        Leaf: leaf_1.default,
        Embed: embed_1.default,
        Scroll: scroll_1.default,
        Block: block_1.default,
        Inline: inline_1.default,
        Text: text_1.default,
        Attributor: {
            Attribute: attributor_1.default,
            Class: class_1.default,
            Style: style_1.default,
            Store: store_1.default,
        },
    };
    exports.default = Parchment;


    /***/ }),
    /* 1 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var ParchmentError = /** @class */ (function (_super) {
        __extends(ParchmentError, _super);
        function ParchmentError(message) {
            var _this = this;
            message = '[Parchment] ' + message;
            _this = _super.call(this, message) || this;
            _this.message = message;
            _this.name = _this.constructor.name;
            return _this;
        }
        return ParchmentError;
    }(Error));
    exports.ParchmentError = ParchmentError;
    var attributes = {};
    var classes = {};
    var tags = {};
    var types = {};
    exports.DATA_KEY = '__blot';
    var Scope;
    (function (Scope) {
        Scope[Scope["TYPE"] = 3] = "TYPE";
        Scope[Scope["LEVEL"] = 12] = "LEVEL";
        Scope[Scope["ATTRIBUTE"] = 13] = "ATTRIBUTE";
        Scope[Scope["BLOT"] = 14] = "BLOT";
        Scope[Scope["INLINE"] = 7] = "INLINE";
        Scope[Scope["BLOCK"] = 11] = "BLOCK";
        Scope[Scope["BLOCK_BLOT"] = 10] = "BLOCK_BLOT";
        Scope[Scope["INLINE_BLOT"] = 6] = "INLINE_BLOT";
        Scope[Scope["BLOCK_ATTRIBUTE"] = 9] = "BLOCK_ATTRIBUTE";
        Scope[Scope["INLINE_ATTRIBUTE"] = 5] = "INLINE_ATTRIBUTE";
        Scope[Scope["ANY"] = 15] = "ANY";
    })(Scope = exports.Scope || (exports.Scope = {}));
    function create(input, value) {
        var match = query(input);
        if (match == null) {
            throw new ParchmentError("Unable to create " + input + " blot");
        }
        var BlotClass = match;
        var node = 
        // @ts-ignore
        input instanceof Node || input['nodeType'] === Node.TEXT_NODE ? input : BlotClass.create(value);
        return new BlotClass(node, value);
    }
    exports.create = create;
    function find(node, bubble) {
        if (bubble === void 0) { bubble = false; }
        if (node == null)
            return null;
        // @ts-ignore
        if (node[exports.DATA_KEY] != null)
            return node[exports.DATA_KEY].blot;
        if (bubble)
            return find(node.parentNode, bubble);
        return null;
    }
    exports.find = find;
    function query(query, scope) {
        if (scope === void 0) { scope = Scope.ANY; }
        var match;
        if (typeof query === 'string') {
            match = types[query] || attributes[query];
            // @ts-ignore
        }
        else if (query instanceof Text || query['nodeType'] === Node.TEXT_NODE) {
            match = types['text'];
        }
        else if (typeof query === 'number') {
            if (query & Scope.LEVEL & Scope.BLOCK) {
                match = types['block'];
            }
            else if (query & Scope.LEVEL & Scope.INLINE) {
                match = types['inline'];
            }
        }
        else if (query instanceof HTMLElement) {
            var names = (query.getAttribute('class') || '').split(/\s+/);
            for (var i in names) {
                match = classes[names[i]];
                if (match)
                    break;
            }
            match = match || tags[query.tagName];
        }
        if (match == null)
            return null;
        // @ts-ignore
        if (scope & Scope.LEVEL & match.scope && scope & Scope.TYPE & match.scope)
            return match;
        return null;
    }
    exports.query = query;
    function register() {
        var Definitions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            Definitions[_i] = arguments[_i];
        }
        if (Definitions.length > 1) {
            return Definitions.map(function (d) {
                return register(d);
            });
        }
        var Definition = Definitions[0];
        if (typeof Definition.blotName !== 'string' && typeof Definition.attrName !== 'string') {
            throw new ParchmentError('Invalid definition');
        }
        else if (Definition.blotName === 'abstract') {
            throw new ParchmentError('Cannot register abstract class');
        }
        types[Definition.blotName || Definition.attrName] = Definition;
        if (typeof Definition.keyName === 'string') {
            attributes[Definition.keyName] = Definition;
        }
        else {
            if (Definition.className != null) {
                classes[Definition.className] = Definition;
            }
            if (Definition.tagName != null) {
                if (Array.isArray(Definition.tagName)) {
                    Definition.tagName = Definition.tagName.map(function (tagName) {
                        return tagName.toUpperCase();
                    });
                }
                else {
                    Definition.tagName = Definition.tagName.toUpperCase();
                }
                var tagNames = Array.isArray(Definition.tagName) ? Definition.tagName : [Definition.tagName];
                tagNames.forEach(function (tag) {
                    if (tags[tag] == null || Definition.className == null) {
                        tags[tag] = Definition;
                    }
                });
            }
        }
        return Definition;
    }
    exports.register = register;


    /***/ }),
    /* 2 */
    /***/ (function(module, exports, __webpack_require__) {

    var diff = __webpack_require__(51);
    var equal = __webpack_require__(11);
    var extend = __webpack_require__(3);
    var op = __webpack_require__(20);


    var NULL_CHARACTER = String.fromCharCode(0);  // Placeholder char for embed in diff()


    var Delta = function (ops) {
      // Assume we are given a well formed ops
      if (Array.isArray(ops)) {
        this.ops = ops;
      } else if (ops != null && Array.isArray(ops.ops)) {
        this.ops = ops.ops;
      } else {
        this.ops = [];
      }
    };


    Delta.prototype.insert = function (text, attributes) {
      var newOp = {};
      if (text.length === 0) return this;
      newOp.insert = text;
      if (attributes != null && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
        newOp.attributes = attributes;
      }
      return this.push(newOp);
    };

    Delta.prototype['delete'] = function (length) {
      if (length <= 0) return this;
      return this.push({ 'delete': length });
    };

    Delta.prototype.retain = function (length, attributes) {
      if (length <= 0) return this;
      var newOp = { retain: length };
      if (attributes != null && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
        newOp.attributes = attributes;
      }
      return this.push(newOp);
    };

    Delta.prototype.push = function (newOp) {
      var index = this.ops.length;
      var lastOp = this.ops[index - 1];
      newOp = extend(true, {}, newOp);
      if (typeof lastOp === 'object') {
        if (typeof newOp['delete'] === 'number' && typeof lastOp['delete'] === 'number') {
          this.ops[index - 1] = { 'delete': lastOp['delete'] + newOp['delete'] };
          return this;
        }
        // Since it does not matter if we insert before or after deleting at the same index,
        // always prefer to insert first
        if (typeof lastOp['delete'] === 'number' && newOp.insert != null) {
          index -= 1;
          lastOp = this.ops[index - 1];
          if (typeof lastOp !== 'object') {
            this.ops.unshift(newOp);
            return this;
          }
        }
        if (equal(newOp.attributes, lastOp.attributes)) {
          if (typeof newOp.insert === 'string' && typeof lastOp.insert === 'string') {
            this.ops[index - 1] = { insert: lastOp.insert + newOp.insert };
            if (typeof newOp.attributes === 'object') this.ops[index - 1].attributes = newOp.attributes;
            return this;
          } else if (typeof newOp.retain === 'number' && typeof lastOp.retain === 'number') {
            this.ops[index - 1] = { retain: lastOp.retain + newOp.retain };
            if (typeof newOp.attributes === 'object') this.ops[index - 1].attributes = newOp.attributes;
            return this;
          }
        }
      }
      if (index === this.ops.length) {
        this.ops.push(newOp);
      } else {
        this.ops.splice(index, 0, newOp);
      }
      return this;
    };

    Delta.prototype.chop = function () {
      var lastOp = this.ops[this.ops.length - 1];
      if (lastOp && lastOp.retain && !lastOp.attributes) {
        this.ops.pop();
      }
      return this;
    };

    Delta.prototype.filter = function (predicate) {
      return this.ops.filter(predicate);
    };

    Delta.prototype.forEach = function (predicate) {
      this.ops.forEach(predicate);
    };

    Delta.prototype.map = function (predicate) {
      return this.ops.map(predicate);
    };

    Delta.prototype.partition = function (predicate) {
      var passed = [], failed = [];
      this.forEach(function(op) {
        var target = predicate(op) ? passed : failed;
        target.push(op);
      });
      return [passed, failed];
    };

    Delta.prototype.reduce = function (predicate, initial) {
      return this.ops.reduce(predicate, initial);
    };

    Delta.prototype.changeLength = function () {
      return this.reduce(function (length, elem) {
        if (elem.insert) {
          return length + op.length(elem);
        } else if (elem.delete) {
          return length - elem.delete;
        }
        return length;
      }, 0);
    };

    Delta.prototype.length = function () {
      return this.reduce(function (length, elem) {
        return length + op.length(elem);
      }, 0);
    };

    Delta.prototype.slice = function (start, end) {
      start = start || 0;
      if (typeof end !== 'number') end = Infinity;
      var ops = [];
      var iter = op.iterator(this.ops);
      var index = 0;
      while (index < end && iter.hasNext()) {
        var nextOp;
        if (index < start) {
          nextOp = iter.next(start - index);
        } else {
          nextOp = iter.next(end - index);
          ops.push(nextOp);
        }
        index += op.length(nextOp);
      }
      return new Delta(ops);
    };


    Delta.prototype.compose = function (other) {
      var thisIter = op.iterator(this.ops);
      var otherIter = op.iterator(other.ops);
      var ops = [];
      var firstOther = otherIter.peek();
      if (firstOther != null && typeof firstOther.retain === 'number' && firstOther.attributes == null) {
        var firstLeft = firstOther.retain;
        while (thisIter.peekType() === 'insert' && thisIter.peekLength() <= firstLeft) {
          firstLeft -= thisIter.peekLength();
          ops.push(thisIter.next());
        }
        if (firstOther.retain - firstLeft > 0) {
          otherIter.next(firstOther.retain - firstLeft);
        }
      }
      var delta = new Delta(ops);
      while (thisIter.hasNext() || otherIter.hasNext()) {
        if (otherIter.peekType() === 'insert') {
          delta.push(otherIter.next());
        } else if (thisIter.peekType() === 'delete') {
          delta.push(thisIter.next());
        } else {
          var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
          var thisOp = thisIter.next(length);
          var otherOp = otherIter.next(length);
          if (typeof otherOp.retain === 'number') {
            var newOp = {};
            if (typeof thisOp.retain === 'number') {
              newOp.retain = length;
            } else {
              newOp.insert = thisOp.insert;
            }
            // Preserve null when composing with a retain, otherwise remove it for inserts
            var attributes = op.attributes.compose(thisOp.attributes, otherOp.attributes, typeof thisOp.retain === 'number');
            if (attributes) newOp.attributes = attributes;
            delta.push(newOp);

            // Optimization if rest of other is just retain
            if (!otherIter.hasNext() && equal(delta.ops[delta.ops.length - 1], newOp)) {
              var rest = new Delta(thisIter.rest());
              return delta.concat(rest).chop();
            }

          // Other op should be delete, we could be an insert or retain
          // Insert + delete cancels out
          } else if (typeof otherOp['delete'] === 'number' && typeof thisOp.retain === 'number') {
            delta.push(otherOp);
          }
        }
      }
      return delta.chop();
    };

    Delta.prototype.concat = function (other) {
      var delta = new Delta(this.ops.slice());
      if (other.ops.length > 0) {
        delta.push(other.ops[0]);
        delta.ops = delta.ops.concat(other.ops.slice(1));
      }
      return delta;
    };

    Delta.prototype.diff = function (other, index) {
      if (this.ops === other.ops) {
        return new Delta();
      }
      var strings = [this, other].map(function (delta) {
        return delta.map(function (op) {
          if (op.insert != null) {
            return typeof op.insert === 'string' ? op.insert : NULL_CHARACTER;
          }
          var prep = (delta === other) ? 'on' : 'with';
          throw new Error('diff() called ' + prep + ' non-document');
        }).join('');
      });
      var delta = new Delta();
      var diffResult = diff(strings[0], strings[1], index);
      var thisIter = op.iterator(this.ops);
      var otherIter = op.iterator(other.ops);
      diffResult.forEach(function (component) {
        var length = component[1].length;
        while (length > 0) {
          var opLength = 0;
          switch (component[0]) {
            case diff.INSERT:
              opLength = Math.min(otherIter.peekLength(), length);
              delta.push(otherIter.next(opLength));
              break;
            case diff.DELETE:
              opLength = Math.min(length, thisIter.peekLength());
              thisIter.next(opLength);
              delta['delete'](opLength);
              break;
            case diff.EQUAL:
              opLength = Math.min(thisIter.peekLength(), otherIter.peekLength(), length);
              var thisOp = thisIter.next(opLength);
              var otherOp = otherIter.next(opLength);
              if (equal(thisOp.insert, otherOp.insert)) {
                delta.retain(opLength, op.attributes.diff(thisOp.attributes, otherOp.attributes));
              } else {
                delta.push(otherOp)['delete'](opLength);
              }
              break;
          }
          length -= opLength;
        }
      });
      return delta.chop();
    };

    Delta.prototype.eachLine = function (predicate, newline) {
      newline = newline || '\n';
      var iter = op.iterator(this.ops);
      var line = new Delta();
      var i = 0;
      while (iter.hasNext()) {
        if (iter.peekType() !== 'insert') return;
        var thisOp = iter.peek();
        var start = op.length(thisOp) - iter.peekLength();
        var index = typeof thisOp.insert === 'string' ?
          thisOp.insert.indexOf(newline, start) - start : -1;
        if (index < 0) {
          line.push(iter.next());
        } else if (index > 0) {
          line.push(iter.next(index));
        } else {
          if (predicate(line, iter.next(1).attributes || {}, i) === false) {
            return;
          }
          i += 1;
          line = new Delta();
        }
      }
      if (line.length() > 0) {
        predicate(line, {}, i);
      }
    };

    Delta.prototype.transform = function (other, priority) {
      priority = !!priority;
      if (typeof other === 'number') {
        return this.transformPosition(other, priority);
      }
      var thisIter = op.iterator(this.ops);
      var otherIter = op.iterator(other.ops);
      var delta = new Delta();
      while (thisIter.hasNext() || otherIter.hasNext()) {
        if (thisIter.peekType() === 'insert' && (priority || otherIter.peekType() !== 'insert')) {
          delta.retain(op.length(thisIter.next()));
        } else if (otherIter.peekType() === 'insert') {
          delta.push(otherIter.next());
        } else {
          var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
          var thisOp = thisIter.next(length);
          var otherOp = otherIter.next(length);
          if (thisOp['delete']) {
            // Our delete either makes their delete redundant or removes their retain
            continue;
          } else if (otherOp['delete']) {
            delta.push(otherOp);
          } else {
            // We retain either their retain or insert
            delta.retain(length, op.attributes.transform(thisOp.attributes, otherOp.attributes, priority));
          }
        }
      }
      return delta.chop();
    };

    Delta.prototype.transformPosition = function (index, priority) {
      priority = !!priority;
      var thisIter = op.iterator(this.ops);
      var offset = 0;
      while (thisIter.hasNext() && offset <= index) {
        var length = thisIter.peekLength();
        var nextType = thisIter.peekType();
        thisIter.next();
        if (nextType === 'delete') {
          index -= Math.min(length, index - offset);
          continue;
        } else if (nextType === 'insert' && (offset < index || !priority)) {
          index += length;
        }
        offset += length;
      }
      return index;
    };


    module.exports = Delta;


    /***/ }),
    /* 3 */
    /***/ (function(module, exports) {

    var hasOwn = Object.prototype.hasOwnProperty;
    var toStr = Object.prototype.toString;
    var defineProperty = Object.defineProperty;
    var gOPD = Object.getOwnPropertyDescriptor;

    var isArray = function isArray(arr) {
    	if (typeof Array.isArray === 'function') {
    		return Array.isArray(arr);
    	}

    	return toStr.call(arr) === '[object Array]';
    };

    var isPlainObject = function isPlainObject(obj) {
    	if (!obj || toStr.call(obj) !== '[object Object]') {
    		return false;
    	}

    	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
    	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
    	// Not own constructor property must be Object
    	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
    		return false;
    	}

    	// Own properties are enumerated firstly, so to speed up,
    	// if last one is own, then all properties are own.
    	var key;
    	for (key in obj) { /**/ }

    	return typeof key === 'undefined' || hasOwn.call(obj, key);
    };

    // If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
    var setProperty = function setProperty(target, options) {
    	if (defineProperty && options.name === '__proto__') {
    		defineProperty(target, options.name, {
    			enumerable: true,
    			configurable: true,
    			value: options.newValue,
    			writable: true
    		});
    	} else {
    		target[options.name] = options.newValue;
    	}
    };

    // Return undefined instead of __proto__ if '__proto__' is not an own property
    var getProperty = function getProperty(obj, name) {
    	if (name === '__proto__') {
    		if (!hasOwn.call(obj, name)) {
    			return void 0;
    		} else if (gOPD) {
    			// In early versions of node, obj['__proto__'] is buggy when obj has
    			// __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
    			return gOPD(obj, name).value;
    		}
    	}

    	return obj[name];
    };

    module.exports = function extend() {
    	var options, name, src, copy, copyIsArray, clone;
    	var target = arguments[0];
    	var i = 1;
    	var length = arguments.length;
    	var deep = false;

    	// Handle a deep copy situation
    	if (typeof target === 'boolean') {
    		deep = target;
    		target = arguments[1] || {};
    		// skip the boolean and the target
    		i = 2;
    	}
    	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
    		target = {};
    	}

    	for (; i < length; ++i) {
    		options = arguments[i];
    		// Only deal with non-null/undefined values
    		if (options != null) {
    			// Extend the base object
    			for (name in options) {
    				src = getProperty(target, name);
    				copy = getProperty(options, name);

    				// Prevent never-ending loop
    				if (target !== copy) {
    					// Recurse if we're merging plain objects or arrays
    					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
    						if (copyIsArray) {
    							copyIsArray = false;
    							clone = src && isArray(src) ? src : [];
    						} else {
    							clone = src && isPlainObject(src) ? src : {};
    						}

    						// Never move original objects, clone them
    						setProperty(target, { name: name, newValue: extend(deep, clone, copy) });

    					// Don't bring in undefined values
    					} else if (typeof copy !== 'undefined') {
    						setProperty(target, { name: name, newValue: copy });
    					}
    				}
    			}
    		}
    	}

    	// Return the modified object
    	return target;
    };


    /***/ }),
    /* 4 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.BlockEmbed = exports.bubbleFormats = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _break = __webpack_require__(16);

    var _break2 = _interopRequireDefault(_break);

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    var _text = __webpack_require__(7);

    var _text2 = _interopRequireDefault(_text);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var NEWLINE_LENGTH = 1;

    var BlockEmbed = function (_Parchment$Embed) {
      _inherits(BlockEmbed, _Parchment$Embed);

      function BlockEmbed() {
        _classCallCheck(this, BlockEmbed);

        return _possibleConstructorReturn(this, (BlockEmbed.__proto__ || Object.getPrototypeOf(BlockEmbed)).apply(this, arguments));
      }

      _createClass(BlockEmbed, [{
        key: 'attach',
        value: function attach() {
          _get(BlockEmbed.prototype.__proto__ || Object.getPrototypeOf(BlockEmbed.prototype), 'attach', this).call(this);
          this.attributes = new _parchment2.default.Attributor.Store(this.domNode);
        }
      }, {
        key: 'delta',
        value: function delta() {
          return new _quillDelta2.default().insert(this.value(), (0, _extend2.default)(this.formats(), this.attributes.values()));
        }
      }, {
        key: 'format',
        value: function format(name, value) {
          var attribute = _parchment2.default.query(name, _parchment2.default.Scope.BLOCK_ATTRIBUTE);
          if (attribute != null) {
            this.attributes.attribute(attribute, value);
          }
        }
      }, {
        key: 'formatAt',
        value: function formatAt(index, length, name, value) {
          this.format(name, value);
        }
      }, {
        key: 'insertAt',
        value: function insertAt(index, value, def) {
          if (typeof value === 'string' && value.endsWith('\n')) {
            var block = _parchment2.default.create(Block.blotName);
            this.parent.insertBefore(block, index === 0 ? this : this.next);
            block.insertAt(0, value.slice(0, -1));
          } else {
            _get(BlockEmbed.prototype.__proto__ || Object.getPrototypeOf(BlockEmbed.prototype), 'insertAt', this).call(this, index, value, def);
          }
        }
      }]);

      return BlockEmbed;
    }(_parchment2.default.Embed);

    BlockEmbed.scope = _parchment2.default.Scope.BLOCK_BLOT;
    // It is important for cursor behavior BlockEmbeds use tags that are block level elements


    var Block = function (_Parchment$Block) {
      _inherits(Block, _Parchment$Block);

      function Block(domNode) {
        _classCallCheck(this, Block);

        var _this2 = _possibleConstructorReturn(this, (Block.__proto__ || Object.getPrototypeOf(Block)).call(this, domNode));

        _this2.cache = {};
        return _this2;
      }

      _createClass(Block, [{
        key: 'delta',
        value: function delta() {
          if (this.cache.delta == null) {
            this.cache.delta = this.descendants(_parchment2.default.Leaf).reduce(function (delta, leaf) {
              if (leaf.length() === 0) {
                return delta;
              } else {
                return delta.insert(leaf.value(), bubbleFormats(leaf));
              }
            }, new _quillDelta2.default()).insert('\n', bubbleFormats(this));
          }
          return this.cache.delta;
        }
      }, {
        key: 'deleteAt',
        value: function deleteAt(index, length) {
          _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'deleteAt', this).call(this, index, length);
          this.cache = {};
        }
      }, {
        key: 'formatAt',
        value: function formatAt(index, length, name, value) {
          if (length <= 0) return;
          if (_parchment2.default.query(name, _parchment2.default.Scope.BLOCK)) {
            if (index + length === this.length()) {
              this.format(name, value);
            }
          } else {
            _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'formatAt', this).call(this, index, Math.min(length, this.length() - index - 1), name, value);
          }
          this.cache = {};
        }
      }, {
        key: 'insertAt',
        value: function insertAt(index, value, def) {
          if (def != null) return _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'insertAt', this).call(this, index, value, def);
          if (value.length === 0) return;
          var lines = value.split('\n');
          var text = lines.shift();
          if (text.length > 0) {
            if (index < this.length() - 1 || this.children.tail == null) {
              _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'insertAt', this).call(this, Math.min(index, this.length() - 1), text);
            } else {
              this.children.tail.insertAt(this.children.tail.length(), text);
            }
            this.cache = {};
          }
          var block = this;
          lines.reduce(function (index, line) {
            block = block.split(index, true);
            block.insertAt(0, line);
            return line.length;
          }, index + text.length);
        }
      }, {
        key: 'insertBefore',
        value: function insertBefore(blot, ref) {
          var head = this.children.head;
          _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'insertBefore', this).call(this, blot, ref);
          if (head instanceof _break2.default) {
            head.remove();
          }
          this.cache = {};
        }
      }, {
        key: 'length',
        value: function length() {
          if (this.cache.length == null) {
            this.cache.length = _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'length', this).call(this) + NEWLINE_LENGTH;
          }
          return this.cache.length;
        }
      }, {
        key: 'moveChildren',
        value: function moveChildren(target, ref) {
          _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'moveChildren', this).call(this, target, ref);
          this.cache = {};
        }
      }, {
        key: 'optimize',
        value: function optimize(context) {
          _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'optimize', this).call(this, context);
          this.cache = {};
        }
      }, {
        key: 'path',
        value: function path(index) {
          return _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'path', this).call(this, index, true);
        }
      }, {
        key: 'removeChild',
        value: function removeChild(child) {
          _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'removeChild', this).call(this, child);
          this.cache = {};
        }
      }, {
        key: 'split',
        value: function split(index) {
          var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

          if (force && (index === 0 || index >= this.length() - NEWLINE_LENGTH)) {
            var clone = this.clone();
            if (index === 0) {
              this.parent.insertBefore(clone, this);
              return this;
            } else {
              this.parent.insertBefore(clone, this.next);
              return clone;
            }
          } else {
            var next = _get(Block.prototype.__proto__ || Object.getPrototypeOf(Block.prototype), 'split', this).call(this, index, force);
            this.cache = {};
            return next;
          }
        }
      }]);

      return Block;
    }(_parchment2.default.Block);

    Block.blotName = 'block';
    Block.tagName = 'P';
    Block.defaultChild = 'break';
    Block.allowedChildren = [_inline2.default, _parchment2.default.Embed, _text2.default];

    function bubbleFormats(blot) {
      var formats = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (blot == null) return formats;
      if (typeof blot.formats === 'function') {
        formats = (0, _extend2.default)(formats, blot.formats());
      }
      if (blot.parent == null || blot.parent.blotName == 'scroll' || blot.parent.statics.scope !== blot.statics.scope) {
        return formats;
      }
      return bubbleFormats(blot.parent, formats);
    }

    exports.bubbleFormats = bubbleFormats;
    exports.BlockEmbed = BlockEmbed;
    exports.default = Block;

    /***/ }),
    /* 5 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.overload = exports.expandConfig = undefined;

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    __webpack_require__(50);

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _editor = __webpack_require__(14);

    var _editor2 = _interopRequireDefault(_editor);

    var _emitter3 = __webpack_require__(8);

    var _emitter4 = _interopRequireDefault(_emitter3);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _selection = __webpack_require__(15);

    var _selection2 = _interopRequireDefault(_selection);

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    var _logger = __webpack_require__(10);

    var _logger2 = _interopRequireDefault(_logger);

    var _theme = __webpack_require__(34);

    var _theme2 = _interopRequireDefault(_theme);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var debug = (0, _logger2.default)('quill');

    var Quill = function () {
      _createClass(Quill, null, [{
        key: 'debug',
        value: function debug(limit) {
          if (limit === true) {
            limit = 'log';
          }
          _logger2.default.level(limit);
        }
      }, {
        key: 'find',
        value: function find(node) {
          return node.__quill || _parchment2.default.find(node);
        }
      }, {
        key: 'import',
        value: function _import(name) {
          if (this.imports[name] == null) {
            debug.error('Cannot import ' + name + '. Are you sure it was registered?');
          }
          return this.imports[name];
        }
      }, {
        key: 'register',
        value: function register(path, target) {
          var _this = this;

          var overwrite = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

          if (typeof path !== 'string') {
            var name = path.attrName || path.blotName;
            if (typeof name === 'string') {
              // register(Blot | Attributor, overwrite)
              this.register('formats/' + name, path, target);
            } else {
              Object.keys(path).forEach(function (key) {
                _this.register(key, path[key], target);
              });
            }
          } else {
            if (this.imports[path] != null && !overwrite) {
              debug.warn('Overwriting ' + path + ' with', target);
            }
            this.imports[path] = target;
            if ((path.startsWith('blots/') || path.startsWith('formats/')) && target.blotName !== 'abstract') {
              _parchment2.default.register(target);
            } else if (path.startsWith('modules') && typeof target.register === 'function') {
              target.register();
            }
          }
        }
      }]);

      function Quill(container) {
        var _this2 = this;

        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, Quill);

        this.options = expandConfig(container, options);
        this.container = this.options.container;
        if (this.container == null) {
          return debug.error('Invalid Quill container', container);
        }
        if (this.options.debug) {
          Quill.debug(this.options.debug);
        }
        var html = this.container.innerHTML.trim();
        this.container.classList.add('ql-container');
        this.container.innerHTML = '';
        this.container.__quill = this;
        this.root = this.addContainer('ql-editor');
        this.root.classList.add('ql-blank');
        this.root.setAttribute('data-gramm', false);
        this.scrollingContainer = this.options.scrollingContainer || this.root;
        this.emitter = new _emitter4.default();
        this.scroll = _parchment2.default.create(this.root, {
          emitter: this.emitter,
          whitelist: this.options.formats
        });
        this.editor = new _editor2.default(this.scroll);
        this.selection = new _selection2.default(this.scroll, this.emitter);
        this.theme = new this.options.theme(this, this.options);
        this.keyboard = this.theme.addModule('keyboard');
        this.clipboard = this.theme.addModule('clipboard');
        this.history = this.theme.addModule('history');
        this.theme.init();
        this.emitter.on(_emitter4.default.events.EDITOR_CHANGE, function (type) {
          if (type === _emitter4.default.events.TEXT_CHANGE) {
            _this2.root.classList.toggle('ql-blank', _this2.editor.isBlank());
          }
        });
        this.emitter.on(_emitter4.default.events.SCROLL_UPDATE, function (source, mutations) {
          var range = _this2.selection.lastRange;
          var index = range && range.length === 0 ? range.index : undefined;
          modify.call(_this2, function () {
            return _this2.editor.update(null, mutations, index);
          }, source);
        });
        var contents = this.clipboard.convert('<div class=\'ql-editor\' style="white-space: normal;">' + html + '<p><br></p></div>');
        this.setContents(contents);
        this.history.clear();
        if (this.options.placeholder) {
          this.root.setAttribute('data-placeholder', this.options.placeholder);
        }
        if (this.options.readOnly) {
          this.disable();
        }
      }

      _createClass(Quill, [{
        key: 'addContainer',
        value: function addContainer(container) {
          var refNode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

          if (typeof container === 'string') {
            var className = container;
            container = document.createElement('div');
            container.classList.add(className);
          }
          this.container.insertBefore(container, refNode);
          return container;
        }
      }, {
        key: 'blur',
        value: function blur() {
          this.selection.setRange(null);
        }
      }, {
        key: 'deleteText',
        value: function deleteText(index, length, source) {
          var _this3 = this;

          var _overload = overload(index, length, source);

          var _overload2 = _slicedToArray(_overload, 4);

          index = _overload2[0];
          length = _overload2[1];
          source = _overload2[3];

          return modify.call(this, function () {
            return _this3.editor.deleteText(index, length);
          }, source, index, -1 * length);
        }
      }, {
        key: 'disable',
        value: function disable() {
          this.enable(false);
        }
      }, {
        key: 'enable',
        value: function enable() {
          var enabled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

          this.scroll.enable(enabled);
          this.container.classList.toggle('ql-disabled', !enabled);
        }
      }, {
        key: 'focus',
        value: function focus() {
          var scrollTop = this.scrollingContainer.scrollTop;
          this.selection.focus();
          this.scrollingContainer.scrollTop = scrollTop;
          this.scrollIntoView();
        }
      }, {
        key: 'format',
        value: function format(name, value) {
          var _this4 = this;

          var source = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _emitter4.default.sources.API;

          return modify.call(this, function () {
            var range = _this4.getSelection(true);
            var change = new _quillDelta2.default();
            if (range == null) {
              return change;
            } else if (_parchment2.default.query(name, _parchment2.default.Scope.BLOCK)) {
              change = _this4.editor.formatLine(range.index, range.length, _defineProperty({}, name, value));
            } else if (range.length === 0) {
              _this4.selection.format(name, value);
              return change;
            } else {
              change = _this4.editor.formatText(range.index, range.length, _defineProperty({}, name, value));
            }
            _this4.setSelection(range, _emitter4.default.sources.SILENT);
            return change;
          }, source);
        }
      }, {
        key: 'formatLine',
        value: function formatLine(index, length, name, value, source) {
          var _this5 = this;

          var formats = void 0;

          var _overload3 = overload(index, length, name, value, source);

          var _overload4 = _slicedToArray(_overload3, 4);

          index = _overload4[0];
          length = _overload4[1];
          formats = _overload4[2];
          source = _overload4[3];

          return modify.call(this, function () {
            return _this5.editor.formatLine(index, length, formats);
          }, source, index, 0);
        }
      }, {
        key: 'formatText',
        value: function formatText(index, length, name, value, source) {
          var _this6 = this;

          var formats = void 0;

          var _overload5 = overload(index, length, name, value, source);

          var _overload6 = _slicedToArray(_overload5, 4);

          index = _overload6[0];
          length = _overload6[1];
          formats = _overload6[2];
          source = _overload6[3];

          return modify.call(this, function () {
            return _this6.editor.formatText(index, length, formats);
          }, source, index, 0);
        }
      }, {
        key: 'getBounds',
        value: function getBounds(index) {
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

          var bounds = void 0;
          if (typeof index === 'number') {
            bounds = this.selection.getBounds(index, length);
          } else {
            bounds = this.selection.getBounds(index.index, index.length);
          }
          var containerBounds = this.container.getBoundingClientRect();
          return {
            bottom: bounds.bottom - containerBounds.top,
            height: bounds.height,
            left: bounds.left - containerBounds.left,
            right: bounds.right - containerBounds.left,
            top: bounds.top - containerBounds.top,
            width: bounds.width
          };
        }
      }, {
        key: 'getContents',
        value: function getContents() {
          var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.getLength() - index;

          var _overload7 = overload(index, length);

          var _overload8 = _slicedToArray(_overload7, 2);

          index = _overload8[0];
          length = _overload8[1];

          return this.editor.getContents(index, length);
        }
      }, {
        key: 'getFormat',
        value: function getFormat() {
          var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.getSelection(true);
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

          if (typeof index === 'number') {
            return this.editor.getFormat(index, length);
          } else {
            return this.editor.getFormat(index.index, index.length);
          }
        }
      }, {
        key: 'getIndex',
        value: function getIndex(blot) {
          return blot.offset(this.scroll);
        }
      }, {
        key: 'getLength',
        value: function getLength() {
          return this.scroll.length();
        }
      }, {
        key: 'getLeaf',
        value: function getLeaf(index) {
          return this.scroll.leaf(index);
        }
      }, {
        key: 'getLine',
        value: function getLine(index) {
          return this.scroll.line(index);
        }
      }, {
        key: 'getLines',
        value: function getLines() {
          var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Number.MAX_VALUE;

          if (typeof index !== 'number') {
            return this.scroll.lines(index.index, index.length);
          } else {
            return this.scroll.lines(index, length);
          }
        }
      }, {
        key: 'getModule',
        value: function getModule(name) {
          return this.theme.modules[name];
        }
      }, {
        key: 'getSelection',
        value: function getSelection() {
          var focus = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

          if (focus) this.focus();
          this.update(); // Make sure we access getRange with editor in consistent state
          return this.selection.getRange()[0];
        }
      }, {
        key: 'getText',
        value: function getText() {
          var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.getLength() - index;

          var _overload9 = overload(index, length);

          var _overload10 = _slicedToArray(_overload9, 2);

          index = _overload10[0];
          length = _overload10[1];

          return this.editor.getText(index, length);
        }
      }, {
        key: 'hasFocus',
        value: function hasFocus() {
          return this.selection.hasFocus();
        }
      }, {
        key: 'insertEmbed',
        value: function insertEmbed(index, embed, value) {
          var _this7 = this;

          var source = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : Quill.sources.API;

          return modify.call(this, function () {
            return _this7.editor.insertEmbed(index, embed, value);
          }, source, index);
        }
      }, {
        key: 'insertText',
        value: function insertText(index, text, name, value, source) {
          var _this8 = this;

          var formats = void 0;

          var _overload11 = overload(index, 0, name, value, source);

          var _overload12 = _slicedToArray(_overload11, 4);

          index = _overload12[0];
          formats = _overload12[2];
          source = _overload12[3];

          return modify.call(this, function () {
            return _this8.editor.insertText(index, text, formats);
          }, source, index, text.length);
        }
      }, {
        key: 'isEnabled',
        value: function isEnabled() {
          return !this.container.classList.contains('ql-disabled');
        }
      }, {
        key: 'off',
        value: function off() {
          return this.emitter.off.apply(this.emitter, arguments);
        }
      }, {
        key: 'on',
        value: function on() {
          return this.emitter.on.apply(this.emitter, arguments);
        }
      }, {
        key: 'once',
        value: function once() {
          return this.emitter.once.apply(this.emitter, arguments);
        }
      }, {
        key: 'pasteHTML',
        value: function pasteHTML(index, html, source) {
          this.clipboard.dangerouslyPasteHTML(index, html, source);
        }
      }, {
        key: 'removeFormat',
        value: function removeFormat(index, length, source) {
          var _this9 = this;

          var _overload13 = overload(index, length, source);

          var _overload14 = _slicedToArray(_overload13, 4);

          index = _overload14[0];
          length = _overload14[1];
          source = _overload14[3];

          return modify.call(this, function () {
            return _this9.editor.removeFormat(index, length);
          }, source, index);
        }
      }, {
        key: 'scrollIntoView',
        value: function scrollIntoView() {
          this.selection.scrollIntoView(this.scrollingContainer);
        }
      }, {
        key: 'setContents',
        value: function setContents(delta) {
          var _this10 = this;

          var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _emitter4.default.sources.API;

          return modify.call(this, function () {
            delta = new _quillDelta2.default(delta);
            var length = _this10.getLength();
            var deleted = _this10.editor.deleteText(0, length);
            var applied = _this10.editor.applyDelta(delta);
            var lastOp = applied.ops[applied.ops.length - 1];
            if (lastOp != null && typeof lastOp.insert === 'string' && lastOp.insert[lastOp.insert.length - 1] === '\n') {
              _this10.editor.deleteText(_this10.getLength() - 1, 1);
              applied.delete(1);
            }
            var ret = deleted.compose(applied);
            return ret;
          }, source);
        }
      }, {
        key: 'setSelection',
        value: function setSelection(index, length, source) {
          if (index == null) {
            this.selection.setRange(null, length || Quill.sources.API);
          } else {
            var _overload15 = overload(index, length, source);

            var _overload16 = _slicedToArray(_overload15, 4);

            index = _overload16[0];
            length = _overload16[1];
            source = _overload16[3];

            this.selection.setRange(new _selection.Range(index, length), source);
            if (source !== _emitter4.default.sources.SILENT) {
              this.selection.scrollIntoView(this.scrollingContainer);
            }
          }
        }
      }, {
        key: 'setText',
        value: function setText(text) {
          var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _emitter4.default.sources.API;

          var delta = new _quillDelta2.default().insert(text);
          return this.setContents(delta, source);
        }
      }, {
        key: 'update',
        value: function update() {
          var source = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _emitter4.default.sources.USER;

          var change = this.scroll.update(source); // Will update selection before selection.update() does if text changes
          this.selection.update(source);
          return change;
        }
      }, {
        key: 'updateContents',
        value: function updateContents(delta) {
          var _this11 = this;

          var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _emitter4.default.sources.API;

          return modify.call(this, function () {
            delta = new _quillDelta2.default(delta);
            return _this11.editor.applyDelta(delta, source);
          }, source, true);
        }
      }]);

      return Quill;
    }();

    Quill.DEFAULTS = {
      bounds: null,
      formats: null,
      modules: {},
      placeholder: '',
      readOnly: false,
      scrollingContainer: null,
      strict: true,
      theme: 'default'
    };
    Quill.events = _emitter4.default.events;
    Quill.sources = _emitter4.default.sources;
    // eslint-disable-next-line no-undef
    Quill.version =  "1.3.7";

    Quill.imports = {
      'delta': _quillDelta2.default,
      'parchment': _parchment2.default,
      'core/module': _module2.default,
      'core/theme': _theme2.default
    };

    function expandConfig(container, userConfig) {
      userConfig = (0, _extend2.default)(true, {
        container: container,
        modules: {
          clipboard: true,
          keyboard: true,
          history: true
        }
      }, userConfig);
      if (!userConfig.theme || userConfig.theme === Quill.DEFAULTS.theme) {
        userConfig.theme = _theme2.default;
      } else {
        userConfig.theme = Quill.import('themes/' + userConfig.theme);
        if (userConfig.theme == null) {
          throw new Error('Invalid theme ' + userConfig.theme + '. Did you register it?');
        }
      }
      var themeConfig = (0, _extend2.default)(true, {}, userConfig.theme.DEFAULTS);
      [themeConfig, userConfig].forEach(function (config) {
        config.modules = config.modules || {};
        Object.keys(config.modules).forEach(function (module) {
          if (config.modules[module] === true) {
            config.modules[module] = {};
          }
        });
      });
      var moduleNames = Object.keys(themeConfig.modules).concat(Object.keys(userConfig.modules));
      var moduleConfig = moduleNames.reduce(function (config, name) {
        var moduleClass = Quill.import('modules/' + name);
        if (moduleClass == null) {
          debug.error('Cannot load ' + name + ' module. Are you sure you registered it?');
        } else {
          config[name] = moduleClass.DEFAULTS || {};
        }
        return config;
      }, {});
      // Special case toolbar shorthand
      if (userConfig.modules != null && userConfig.modules.toolbar && userConfig.modules.toolbar.constructor !== Object) {
        userConfig.modules.toolbar = {
          container: userConfig.modules.toolbar
        };
      }
      userConfig = (0, _extend2.default)(true, {}, Quill.DEFAULTS, { modules: moduleConfig }, themeConfig, userConfig);
      ['bounds', 'container', 'scrollingContainer'].forEach(function (key) {
        if (typeof userConfig[key] === 'string') {
          userConfig[key] = document.querySelector(userConfig[key]);
        }
      });
      userConfig.modules = Object.keys(userConfig.modules).reduce(function (config, name) {
        if (userConfig.modules[name]) {
          config[name] = userConfig.modules[name];
        }
        return config;
      }, {});
      return userConfig;
    }

    // Handle selection preservation and TEXT_CHANGE emission
    // common to modification APIs
    function modify(modifier, source, index, shift) {
      if (this.options.strict && !this.isEnabled() && source === _emitter4.default.sources.USER) {
        return new _quillDelta2.default();
      }
      var range = index == null ? null : this.getSelection();
      var oldDelta = this.editor.delta;
      var change = modifier();
      if (range != null) {
        if (index === true) index = range.index;
        if (shift == null) {
          range = shiftRange(range, change, source);
        } else if (shift !== 0) {
          range = shiftRange(range, index, shift, source);
        }
        this.setSelection(range, _emitter4.default.sources.SILENT);
      }
      if (change.length() > 0) {
        var _emitter;

        var args = [_emitter4.default.events.TEXT_CHANGE, change, oldDelta, source];
        (_emitter = this.emitter).emit.apply(_emitter, [_emitter4.default.events.EDITOR_CHANGE].concat(args));
        if (source !== _emitter4.default.sources.SILENT) {
          var _emitter2;

          (_emitter2 = this.emitter).emit.apply(_emitter2, args);
        }
      }
      return change;
    }

    function overload(index, length, name, value, source) {
      var formats = {};
      if (typeof index.index === 'number' && typeof index.length === 'number') {
        // Allow for throwaway end (used by insertText/insertEmbed)
        if (typeof length !== 'number') {
          source = value, value = name, name = length, length = index.length, index = index.index;
        } else {
          length = index.length, index = index.index;
        }
      } else if (typeof length !== 'number') {
        source = value, value = name, name = length, length = 0;
      }
      // Handle format being object, two format name/value strings or excluded
      if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
        formats = name;
        source = value;
      } else if (typeof name === 'string') {
        if (value != null) {
          formats[name] = value;
        } else {
          source = name;
        }
      }
      // Handle optional source
      source = source || _emitter4.default.sources.API;
      return [index, length, formats, source];
    }

    function shiftRange(range, index, length, source) {
      if (range == null) return null;
      var start = void 0,
          end = void 0;
      if (index instanceof _quillDelta2.default) {
        var _map = [range.index, range.index + range.length].map(function (pos) {
          return index.transformPosition(pos, source !== _emitter4.default.sources.USER);
        });

        var _map2 = _slicedToArray(_map, 2);

        start = _map2[0];
        end = _map2[1];
      } else {
        var _map3 = [range.index, range.index + range.length].map(function (pos) {
          if (pos < index || pos === index && source === _emitter4.default.sources.USER) return pos;
          if (length >= 0) {
            return pos + length;
          } else {
            return Math.max(index, pos + length);
          }
        });

        var _map4 = _slicedToArray(_map3, 2);

        start = _map4[0];
        end = _map4[1];
      }
      return new _selection.Range(start, end - start);
    }

    exports.expandConfig = expandConfig;
    exports.overload = overload;
    exports.default = Quill;

    /***/ }),
    /* 6 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _text = __webpack_require__(7);

    var _text2 = _interopRequireDefault(_text);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Inline = function (_Parchment$Inline) {
      _inherits(Inline, _Parchment$Inline);

      function Inline() {
        _classCallCheck(this, Inline);

        return _possibleConstructorReturn(this, (Inline.__proto__ || Object.getPrototypeOf(Inline)).apply(this, arguments));
      }

      _createClass(Inline, [{
        key: 'formatAt',
        value: function formatAt(index, length, name, value) {
          if (Inline.compare(this.statics.blotName, name) < 0 && _parchment2.default.query(name, _parchment2.default.Scope.BLOT)) {
            var blot = this.isolate(index, length);
            if (value) {
              blot.wrap(name, value);
            }
          } else {
            _get(Inline.prototype.__proto__ || Object.getPrototypeOf(Inline.prototype), 'formatAt', this).call(this, index, length, name, value);
          }
        }
      }, {
        key: 'optimize',
        value: function optimize(context) {
          _get(Inline.prototype.__proto__ || Object.getPrototypeOf(Inline.prototype), 'optimize', this).call(this, context);
          if (this.parent instanceof Inline && Inline.compare(this.statics.blotName, this.parent.statics.blotName) > 0) {
            var parent = this.parent.isolate(this.offset(), this.length());
            this.moveChildren(parent);
            parent.wrap(this);
          }
        }
      }], [{
        key: 'compare',
        value: function compare(self, other) {
          var selfIndex = Inline.order.indexOf(self);
          var otherIndex = Inline.order.indexOf(other);
          if (selfIndex >= 0 || otherIndex >= 0) {
            return selfIndex - otherIndex;
          } else if (self === other) {
            return 0;
          } else if (self < other) {
            return -1;
          } else {
            return 1;
          }
        }
      }]);

      return Inline;
    }(_parchment2.default.Inline);

    Inline.allowedChildren = [Inline, _parchment2.default.Embed, _text2.default];
    // Lower index means deeper in the DOM tree, since not found (-1) is for embeds
    Inline.order = ['cursor', 'inline', // Must be lower
    'underline', 'strike', 'italic', 'bold', 'script', 'link', 'code' // Must be higher
    ];

    exports.default = Inline;

    /***/ }),
    /* 7 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var TextBlot = function (_Parchment$Text) {
      _inherits(TextBlot, _Parchment$Text);

      function TextBlot() {
        _classCallCheck(this, TextBlot);

        return _possibleConstructorReturn(this, (TextBlot.__proto__ || Object.getPrototypeOf(TextBlot)).apply(this, arguments));
      }

      return TextBlot;
    }(_parchment2.default.Text);

    exports.default = TextBlot;

    /***/ }),
    /* 8 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _eventemitter = __webpack_require__(54);

    var _eventemitter2 = _interopRequireDefault(_eventemitter);

    var _logger = __webpack_require__(10);

    var _logger2 = _interopRequireDefault(_logger);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var debug = (0, _logger2.default)('quill:events');

    var EVENTS = ['selectionchange', 'mousedown', 'mouseup', 'click'];

    EVENTS.forEach(function (eventName) {
      document.addEventListener(eventName, function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        [].slice.call(document.querySelectorAll('.ql-container')).forEach(function (node) {
          // TODO use WeakMap
          if (node.__quill && node.__quill.emitter) {
            var _node$__quill$emitter;

            (_node$__quill$emitter = node.__quill.emitter).handleDOM.apply(_node$__quill$emitter, args);
          }
        });
      });
    });

    var Emitter = function (_EventEmitter) {
      _inherits(Emitter, _EventEmitter);

      function Emitter() {
        _classCallCheck(this, Emitter);

        var _this = _possibleConstructorReturn(this, (Emitter.__proto__ || Object.getPrototypeOf(Emitter)).call(this));

        _this.listeners = {};
        _this.on('error', debug.error);
        return _this;
      }

      _createClass(Emitter, [{
        key: 'emit',
        value: function emit() {
          debug.log.apply(debug, arguments);
          _get(Emitter.prototype.__proto__ || Object.getPrototypeOf(Emitter.prototype), 'emit', this).apply(this, arguments);
        }
      }, {
        key: 'handleDOM',
        value: function handleDOM(event) {
          for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }

          (this.listeners[event.type] || []).forEach(function (_ref) {
            var node = _ref.node,
                handler = _ref.handler;

            if (event.target === node || node.contains(event.target)) {
              handler.apply(undefined, [event].concat(args));
            }
          });
        }
      }, {
        key: 'listenDOM',
        value: function listenDOM(eventName, node, handler) {
          if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
          }
          this.listeners[eventName].push({ node: node, handler: handler });
        }
      }]);

      return Emitter;
    }(_eventemitter2.default);

    Emitter.events = {
      EDITOR_CHANGE: 'editor-change',
      SCROLL_BEFORE_UPDATE: 'scroll-before-update',
      SCROLL_OPTIMIZE: 'scroll-optimize',
      SCROLL_UPDATE: 'scroll-update',
      SELECTION_CHANGE: 'selection-change',
      TEXT_CHANGE: 'text-change'
    };
    Emitter.sources = {
      API: 'api',
      SILENT: 'silent',
      USER: 'user'
    };

    exports.default = Emitter;

    /***/ }),
    /* 9 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Module = function Module(quill) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, Module);

      this.quill = quill;
      this.options = options;
    };

    Module.DEFAULTS = {};

    exports.default = Module;

    /***/ }),
    /* 10 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var levels = ['error', 'warn', 'log', 'info'];
    var level = 'warn';

    function debug(method) {
      if (levels.indexOf(method) <= levels.indexOf(level)) {
        var _console;

        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        (_console = console)[method].apply(_console, args); // eslint-disable-line no-console
      }
    }

    function namespace(ns) {
      return levels.reduce(function (logger, method) {
        logger[method] = debug.bind(console, method, ns);
        return logger;
      }, {});
    }

    debug.level = namespace.level = function (newLevel) {
      level = newLevel;
    };

    exports.default = namespace;

    /***/ }),
    /* 11 */
    /***/ (function(module, exports, __webpack_require__) {

    var pSlice = Array.prototype.slice;
    var objectKeys = __webpack_require__(52);
    var isArguments = __webpack_require__(53);

    var deepEqual = module.exports = function (actual, expected, opts) {
      if (!opts) opts = {};
      // 7.1. All identical values are equivalent, as determined by ===.
      if (actual === expected) {
        return true;

      } else if (actual instanceof Date && expected instanceof Date) {
        return actual.getTime() === expected.getTime();

      // 7.3. Other pairs that do not both pass typeof value == 'object',
      // equivalence is determined by ==.
      } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
        return opts.strict ? actual === expected : actual == expected;

      // 7.4. For all other Object pairs, including Array objects, equivalence is
      // determined by having the same number of owned properties (as verified
      // with Object.prototype.hasOwnProperty.call), the same set of keys
      // (although not necessarily the same order), equivalent values for every
      // corresponding key, and an identical 'prototype' property. Note: this
      // accounts for both named and indexed properties on Arrays.
      } else {
        return objEquiv(actual, expected, opts);
      }
    };

    function isUndefinedOrNull(value) {
      return value === null || value === undefined;
    }

    function isBuffer (x) {
      if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
      if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
        return false;
      }
      if (x.length > 0 && typeof x[0] !== 'number') return false;
      return true;
    }

    function objEquiv(a, b, opts) {
      var i, key;
      if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
        return false;
      // an identical 'prototype' property.
      if (a.prototype !== b.prototype) return false;
      //~~~I've managed to break Object.keys through screwy arguments passing.
      //   Converting to array solves the problem.
      if (isArguments(a)) {
        if (!isArguments(b)) {
          return false;
        }
        a = pSlice.call(a);
        b = pSlice.call(b);
        return deepEqual(a, b, opts);
      }
      if (isBuffer(a)) {
        if (!isBuffer(b)) {
          return false;
        }
        if (a.length !== b.length) return false;
        for (i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      }
      try {
        var ka = objectKeys(a),
            kb = objectKeys(b);
      } catch (e) {//happens when one is a string literal and the other isn't
        return false;
      }
      // having the same number of owned properties (keys incorporates
      // hasOwnProperty)
      if (ka.length != kb.length)
        return false;
      //the same set of keys (although not necessarily the same order),
      ka.sort();
      kb.sort();
      //~~~cheap key test
      for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] != kb[i])
          return false;
      }
      //equivalent values for every corresponding key, and
      //~~~possibly expensive deep test
      for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i];
        if (!deepEqual(a[key], b[key], opts)) return false;
      }
      return typeof a === typeof b;
    }


    /***/ }),
    /* 12 */
    /***/ (function(module, exports, __webpack_require__) {

    Object.defineProperty(exports, "__esModule", { value: true });
    var Registry = __webpack_require__(1);
    var Attributor = /** @class */ (function () {
        function Attributor(attrName, keyName, options) {
            if (options === void 0) { options = {}; }
            this.attrName = attrName;
            this.keyName = keyName;
            var attributeBit = Registry.Scope.TYPE & Registry.Scope.ATTRIBUTE;
            if (options.scope != null) {
                // Ignore type bits, force attribute bit
                this.scope = (options.scope & Registry.Scope.LEVEL) | attributeBit;
            }
            else {
                this.scope = Registry.Scope.ATTRIBUTE;
            }
            if (options.whitelist != null)
                this.whitelist = options.whitelist;
        }
        Attributor.keys = function (node) {
            return [].map.call(node.attributes, function (item) {
                return item.name;
            });
        };
        Attributor.prototype.add = function (node, value) {
            if (!this.canAdd(node, value))
                return false;
            node.setAttribute(this.keyName, value);
            return true;
        };
        Attributor.prototype.canAdd = function (node, value) {
            var match = Registry.query(node, Registry.Scope.BLOT & (this.scope | Registry.Scope.TYPE));
            if (match == null)
                return false;
            if (this.whitelist == null)
                return true;
            if (typeof value === 'string') {
                return this.whitelist.indexOf(value.replace(/["']/g, '')) > -1;
            }
            else {
                return this.whitelist.indexOf(value) > -1;
            }
        };
        Attributor.prototype.remove = function (node) {
            node.removeAttribute(this.keyName);
        };
        Attributor.prototype.value = function (node) {
            var value = node.getAttribute(this.keyName);
            if (this.canAdd(node, value) && value) {
                return value;
            }
            return '';
        };
        return Attributor;
    }());
    exports.default = Attributor;


    /***/ }),
    /* 13 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.Code = undefined;

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    var _text = __webpack_require__(7);

    var _text2 = _interopRequireDefault(_text);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Code = function (_Inline) {
      _inherits(Code, _Inline);

      function Code() {
        _classCallCheck(this, Code);

        return _possibleConstructorReturn(this, (Code.__proto__ || Object.getPrototypeOf(Code)).apply(this, arguments));
      }

      return Code;
    }(_inline2.default);

    Code.blotName = 'code';
    Code.tagName = 'CODE';

    var CodeBlock = function (_Block) {
      _inherits(CodeBlock, _Block);

      function CodeBlock() {
        _classCallCheck(this, CodeBlock);

        return _possibleConstructorReturn(this, (CodeBlock.__proto__ || Object.getPrototypeOf(CodeBlock)).apply(this, arguments));
      }

      _createClass(CodeBlock, [{
        key: 'delta',
        value: function delta() {
          var _this3 = this;

          var text = this.domNode.textContent;
          if (text.endsWith('\n')) {
            // Should always be true
            text = text.slice(0, -1);
          }
          return text.split('\n').reduce(function (delta, frag) {
            return delta.insert(frag).insert('\n', _this3.formats());
          }, new _quillDelta2.default());
        }
      }, {
        key: 'format',
        value: function format(name, value) {
          if (name === this.statics.blotName && value) return;

          var _descendant = this.descendant(_text2.default, this.length() - 1),
              _descendant2 = _slicedToArray(_descendant, 1),
              text = _descendant2[0];

          if (text != null) {
            text.deleteAt(text.length() - 1, 1);
          }
          _get(CodeBlock.prototype.__proto__ || Object.getPrototypeOf(CodeBlock.prototype), 'format', this).call(this, name, value);
        }
      }, {
        key: 'formatAt',
        value: function formatAt(index, length, name, value) {
          if (length === 0) return;
          if (_parchment2.default.query(name, _parchment2.default.Scope.BLOCK) == null || name === this.statics.blotName && value === this.statics.formats(this.domNode)) {
            return;
          }
          var nextNewline = this.newlineIndex(index);
          if (nextNewline < 0 || nextNewline >= index + length) return;
          var prevNewline = this.newlineIndex(index, true) + 1;
          var isolateLength = nextNewline - prevNewline + 1;
          var blot = this.isolate(prevNewline, isolateLength);
          var next = blot.next;
          blot.format(name, value);
          if (next instanceof CodeBlock) {
            next.formatAt(0, index - prevNewline + length - isolateLength, name, value);
          }
        }
      }, {
        key: 'insertAt',
        value: function insertAt(index, value, def) {
          if (def != null) return;

          var _descendant3 = this.descendant(_text2.default, index),
              _descendant4 = _slicedToArray(_descendant3, 2),
              text = _descendant4[0],
              offset = _descendant4[1];

          text.insertAt(offset, value);
        }
      }, {
        key: 'length',
        value: function length() {
          var length = this.domNode.textContent.length;
          if (!this.domNode.textContent.endsWith('\n')) {
            return length + 1;
          }
          return length;
        }
      }, {
        key: 'newlineIndex',
        value: function newlineIndex(searchIndex) {
          var reverse = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

          if (!reverse) {
            var offset = this.domNode.textContent.slice(searchIndex).indexOf('\n');
            return offset > -1 ? searchIndex + offset : -1;
          } else {
            return this.domNode.textContent.slice(0, searchIndex).lastIndexOf('\n');
          }
        }
      }, {
        key: 'optimize',
        value: function optimize(context) {
          if (!this.domNode.textContent.endsWith('\n')) {
            this.appendChild(_parchment2.default.create('text', '\n'));
          }
          _get(CodeBlock.prototype.__proto__ || Object.getPrototypeOf(CodeBlock.prototype), 'optimize', this).call(this, context);
          var next = this.next;
          if (next != null && next.prev === this && next.statics.blotName === this.statics.blotName && this.statics.formats(this.domNode) === next.statics.formats(next.domNode)) {
            next.optimize(context);
            next.moveChildren(this);
            next.remove();
          }
        }
      }, {
        key: 'replace',
        value: function replace(target) {
          _get(CodeBlock.prototype.__proto__ || Object.getPrototypeOf(CodeBlock.prototype), 'replace', this).call(this, target);
          [].slice.call(this.domNode.querySelectorAll('*')).forEach(function (node) {
            var blot = _parchment2.default.find(node);
            if (blot == null) {
              node.parentNode.removeChild(node);
            } else if (blot instanceof _parchment2.default.Embed) {
              blot.remove();
            } else {
              blot.unwrap();
            }
          });
        }
      }], [{
        key: 'create',
        value: function create(value) {
          var domNode = _get(CodeBlock.__proto__ || Object.getPrototypeOf(CodeBlock), 'create', this).call(this, value);
          domNode.setAttribute('spellcheck', false);
          return domNode;
        }
      }, {
        key: 'formats',
        value: function formats() {
          return true;
        }
      }]);

      return CodeBlock;
    }(_block2.default);

    CodeBlock.blotName = 'code-block';
    CodeBlock.tagName = 'PRE';
    CodeBlock.TAB = '  ';

    exports.Code = Code;
    exports.default = CodeBlock;

    /***/ }),
    /* 14 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _op = __webpack_require__(20);

    var _op2 = _interopRequireDefault(_op);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _code = __webpack_require__(13);

    var _code2 = _interopRequireDefault(_code);

    var _cursor = __webpack_require__(24);

    var _cursor2 = _interopRequireDefault(_cursor);

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    var _break = __webpack_require__(16);

    var _break2 = _interopRequireDefault(_break);

    var _clone = __webpack_require__(21);

    var _clone2 = _interopRequireDefault(_clone);

    var _deepEqual = __webpack_require__(11);

    var _deepEqual2 = _interopRequireDefault(_deepEqual);

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var ASCII = /^[ -~]*$/;

    var Editor = function () {
      function Editor(scroll) {
        _classCallCheck(this, Editor);

        this.scroll = scroll;
        this.delta = this.getDelta();
      }

      _createClass(Editor, [{
        key: 'applyDelta',
        value: function applyDelta(delta) {
          var _this = this;

          var consumeNextNewline = false;
          this.scroll.update();
          var scrollLength = this.scroll.length();
          this.scroll.batchStart();
          delta = normalizeDelta(delta);
          delta.reduce(function (index, op) {
            var length = op.retain || op.delete || op.insert.length || 1;
            var attributes = op.attributes || {};
            if (op.insert != null) {
              if (typeof op.insert === 'string') {
                var text = op.insert;
                if (text.endsWith('\n') && consumeNextNewline) {
                  consumeNextNewline = false;
                  text = text.slice(0, -1);
                }
                if (index >= scrollLength && !text.endsWith('\n')) {
                  consumeNextNewline = true;
                }
                _this.scroll.insertAt(index, text);

                var _scroll$line = _this.scroll.line(index),
                    _scroll$line2 = _slicedToArray(_scroll$line, 2),
                    line = _scroll$line2[0],
                    offset = _scroll$line2[1];

                var formats = (0, _extend2.default)({}, (0, _block.bubbleFormats)(line));
                if (line instanceof _block2.default) {
                  var _line$descendant = line.descendant(_parchment2.default.Leaf, offset),
                      _line$descendant2 = _slicedToArray(_line$descendant, 1),
                      leaf = _line$descendant2[0];

                  formats = (0, _extend2.default)(formats, (0, _block.bubbleFormats)(leaf));
                }
                attributes = _op2.default.attributes.diff(formats, attributes) || {};
              } else if (_typeof(op.insert) === 'object') {
                var key = Object.keys(op.insert)[0]; // There should only be one key
                if (key == null) return index;
                _this.scroll.insertAt(index, key, op.insert[key]);
              }
              scrollLength += length;
            }
            Object.keys(attributes).forEach(function (name) {
              _this.scroll.formatAt(index, length, name, attributes[name]);
            });
            return index + length;
          }, 0);
          delta.reduce(function (index, op) {
            if (typeof op.delete === 'number') {
              _this.scroll.deleteAt(index, op.delete);
              return index;
            }
            return index + (op.retain || op.insert.length || 1);
          }, 0);
          this.scroll.batchEnd();
          return this.update(delta);
        }
      }, {
        key: 'deleteText',
        value: function deleteText(index, length) {
          this.scroll.deleteAt(index, length);
          return this.update(new _quillDelta2.default().retain(index).delete(length));
        }
      }, {
        key: 'formatLine',
        value: function formatLine(index, length) {
          var _this2 = this;

          var formats = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

          this.scroll.update();
          Object.keys(formats).forEach(function (format) {
            if (_this2.scroll.whitelist != null && !_this2.scroll.whitelist[format]) return;
            var lines = _this2.scroll.lines(index, Math.max(length, 1));
            var lengthRemaining = length;
            lines.forEach(function (line) {
              var lineLength = line.length();
              if (!(line instanceof _code2.default)) {
                line.format(format, formats[format]);
              } else {
                var codeIndex = index - line.offset(_this2.scroll);
                var codeLength = line.newlineIndex(codeIndex + lengthRemaining) - codeIndex + 1;
                line.formatAt(codeIndex, codeLength, format, formats[format]);
              }
              lengthRemaining -= lineLength;
            });
          });
          this.scroll.optimize();
          return this.update(new _quillDelta2.default().retain(index).retain(length, (0, _clone2.default)(formats)));
        }
      }, {
        key: 'formatText',
        value: function formatText(index, length) {
          var _this3 = this;

          var formats = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

          Object.keys(formats).forEach(function (format) {
            _this3.scroll.formatAt(index, length, format, formats[format]);
          });
          return this.update(new _quillDelta2.default().retain(index).retain(length, (0, _clone2.default)(formats)));
        }
      }, {
        key: 'getContents',
        value: function getContents(index, length) {
          return this.delta.slice(index, index + length);
        }
      }, {
        key: 'getDelta',
        value: function getDelta() {
          return this.scroll.lines().reduce(function (delta, line) {
            return delta.concat(line.delta());
          }, new _quillDelta2.default());
        }
      }, {
        key: 'getFormat',
        value: function getFormat(index) {
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

          var lines = [],
              leaves = [];
          if (length === 0) {
            this.scroll.path(index).forEach(function (path) {
              var _path = _slicedToArray(path, 1),
                  blot = _path[0];

              if (blot instanceof _block2.default) {
                lines.push(blot);
              } else if (blot instanceof _parchment2.default.Leaf) {
                leaves.push(blot);
              }
            });
          } else {
            lines = this.scroll.lines(index, length);
            leaves = this.scroll.descendants(_parchment2.default.Leaf, index, length);
          }
          var formatsArr = [lines, leaves].map(function (blots) {
            if (blots.length === 0) return {};
            var formats = (0, _block.bubbleFormats)(blots.shift());
            while (Object.keys(formats).length > 0) {
              var blot = blots.shift();
              if (blot == null) return formats;
              formats = combineFormats((0, _block.bubbleFormats)(blot), formats);
            }
            return formats;
          });
          return _extend2.default.apply(_extend2.default, formatsArr);
        }
      }, {
        key: 'getText',
        value: function getText(index, length) {
          return this.getContents(index, length).filter(function (op) {
            return typeof op.insert === 'string';
          }).map(function (op) {
            return op.insert;
          }).join('');
        }
      }, {
        key: 'insertEmbed',
        value: function insertEmbed(index, embed, value) {
          this.scroll.insertAt(index, embed, value);
          return this.update(new _quillDelta2.default().retain(index).insert(_defineProperty({}, embed, value)));
        }
      }, {
        key: 'insertText',
        value: function insertText(index, text) {
          var _this4 = this;

          var formats = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

          text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          this.scroll.insertAt(index, text);
          Object.keys(formats).forEach(function (format) {
            _this4.scroll.formatAt(index, text.length, format, formats[format]);
          });
          return this.update(new _quillDelta2.default().retain(index).insert(text, (0, _clone2.default)(formats)));
        }
      }, {
        key: 'isBlank',
        value: function isBlank() {
          if (this.scroll.children.length == 0) return true;
          if (this.scroll.children.length > 1) return false;
          var block = this.scroll.children.head;
          if (block.statics.blotName !== _block2.default.blotName) return false;
          if (block.children.length > 1) return false;
          return block.children.head instanceof _break2.default;
        }
      }, {
        key: 'removeFormat',
        value: function removeFormat(index, length) {
          var text = this.getText(index, length);

          var _scroll$line3 = this.scroll.line(index + length),
              _scroll$line4 = _slicedToArray(_scroll$line3, 2),
              line = _scroll$line4[0],
              offset = _scroll$line4[1];

          var suffixLength = 0,
              suffix = new _quillDelta2.default();
          if (line != null) {
            if (!(line instanceof _code2.default)) {
              suffixLength = line.length() - offset;
            } else {
              suffixLength = line.newlineIndex(offset) - offset + 1;
            }
            suffix = line.delta().slice(offset, offset + suffixLength - 1).insert('\n');
          }
          var contents = this.getContents(index, length + suffixLength);
          var diff = contents.diff(new _quillDelta2.default().insert(text).concat(suffix));
          var delta = new _quillDelta2.default().retain(index).concat(diff);
          return this.applyDelta(delta);
        }
      }, {
        key: 'update',
        value: function update(change) {
          var mutations = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
          var cursorIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

          var oldDelta = this.delta;
          if (mutations.length === 1 && mutations[0].type === 'characterData' && mutations[0].target.data.match(ASCII) && _parchment2.default.find(mutations[0].target)) {
            // Optimization for character changes
            var textBlot = _parchment2.default.find(mutations[0].target);
            var formats = (0, _block.bubbleFormats)(textBlot);
            var index = textBlot.offset(this.scroll);
            var oldValue = mutations[0].oldValue.replace(_cursor2.default.CONTENTS, '');
            var oldText = new _quillDelta2.default().insert(oldValue);
            var newText = new _quillDelta2.default().insert(textBlot.value());
            var diffDelta = new _quillDelta2.default().retain(index).concat(oldText.diff(newText, cursorIndex));
            change = diffDelta.reduce(function (delta, op) {
              if (op.insert) {
                return delta.insert(op.insert, formats);
              } else {
                return delta.push(op);
              }
            }, new _quillDelta2.default());
            this.delta = oldDelta.compose(change);
          } else {
            this.delta = this.getDelta();
            if (!change || !(0, _deepEqual2.default)(oldDelta.compose(change), this.delta)) {
              change = oldDelta.diff(this.delta, cursorIndex);
            }
          }
          return change;
        }
      }]);

      return Editor;
    }();

    function combineFormats(formats, combined) {
      return Object.keys(combined).reduce(function (merged, name) {
        if (formats[name] == null) return merged;
        if (combined[name] === formats[name]) {
          merged[name] = combined[name];
        } else if (Array.isArray(combined[name])) {
          if (combined[name].indexOf(formats[name]) < 0) {
            merged[name] = combined[name].concat([formats[name]]);
          }
        } else {
          merged[name] = [combined[name], formats[name]];
        }
        return merged;
      }, {});
    }

    function normalizeDelta(delta) {
      return delta.reduce(function (delta, op) {
        if (op.insert === 1) {
          var attributes = (0, _clone2.default)(op.attributes);
          delete attributes['image'];
          return delta.insert({ image: op.attributes.image }, attributes);
        }
        if (op.attributes != null && (op.attributes.list === true || op.attributes.bullet === true)) {
          op = (0, _clone2.default)(op);
          if (op.attributes.list) {
            op.attributes.list = 'ordered';
          } else {
            op.attributes.list = 'bullet';
            delete op.attributes.bullet;
          }
        }
        if (typeof op.insert === 'string') {
          var text = op.insert.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          return delta.insert(text, op.attributes);
        }
        return delta.push(op);
      }, new _quillDelta2.default());
    }

    exports.default = Editor;

    /***/ }),
    /* 15 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.Range = undefined;

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _clone = __webpack_require__(21);

    var _clone2 = _interopRequireDefault(_clone);

    var _deepEqual = __webpack_require__(11);

    var _deepEqual2 = _interopRequireDefault(_deepEqual);

    var _emitter3 = __webpack_require__(8);

    var _emitter4 = _interopRequireDefault(_emitter3);

    var _logger = __webpack_require__(10);

    var _logger2 = _interopRequireDefault(_logger);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var debug = (0, _logger2.default)('quill:selection');

    var Range = function Range(index) {
      var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      _classCallCheck(this, Range);

      this.index = index;
      this.length = length;
    };

    var Selection = function () {
      function Selection(scroll, emitter) {
        var _this = this;

        _classCallCheck(this, Selection);

        this.emitter = emitter;
        this.scroll = scroll;
        this.composing = false;
        this.mouseDown = false;
        this.root = this.scroll.domNode;
        this.cursor = _parchment2.default.create('cursor', this);
        // savedRange is last non-null range
        this.lastRange = this.savedRange = new Range(0, 0);
        this.handleComposition();
        this.handleDragging();
        this.emitter.listenDOM('selectionchange', document, function () {
          if (!_this.mouseDown) {
            setTimeout(_this.update.bind(_this, _emitter4.default.sources.USER), 1);
          }
        });
        this.emitter.on(_emitter4.default.events.EDITOR_CHANGE, function (type, delta) {
          if (type === _emitter4.default.events.TEXT_CHANGE && delta.length() > 0) {
            _this.update(_emitter4.default.sources.SILENT);
          }
        });
        this.emitter.on(_emitter4.default.events.SCROLL_BEFORE_UPDATE, function () {
          if (!_this.hasFocus()) return;
          var native = _this.getNativeRange();
          if (native == null) return;
          if (native.start.node === _this.cursor.textNode) return; // cursor.restore() will handle
          // TODO unclear if this has negative side effects
          _this.emitter.once(_emitter4.default.events.SCROLL_UPDATE, function () {
            try {
              _this.setNativeRange(native.start.node, native.start.offset, native.end.node, native.end.offset);
            } catch (ignored) {}
          });
        });
        this.emitter.on(_emitter4.default.events.SCROLL_OPTIMIZE, function (mutations, context) {
          if (context.range) {
            var _context$range = context.range,
                startNode = _context$range.startNode,
                startOffset = _context$range.startOffset,
                endNode = _context$range.endNode,
                endOffset = _context$range.endOffset;

            _this.setNativeRange(startNode, startOffset, endNode, endOffset);
          }
        });
        this.update(_emitter4.default.sources.SILENT);
      }

      _createClass(Selection, [{
        key: 'handleComposition',
        value: function handleComposition() {
          var _this2 = this;

          this.root.addEventListener('compositionstart', function () {
            _this2.composing = true;
          });
          this.root.addEventListener('compositionend', function () {
            _this2.composing = false;
            if (_this2.cursor.parent) {
              var range = _this2.cursor.restore();
              if (!range) return;
              setTimeout(function () {
                _this2.setNativeRange(range.startNode, range.startOffset, range.endNode, range.endOffset);
              }, 1);
            }
          });
        }
      }, {
        key: 'handleDragging',
        value: function handleDragging() {
          var _this3 = this;

          this.emitter.listenDOM('mousedown', document.body, function () {
            _this3.mouseDown = true;
          });
          this.emitter.listenDOM('mouseup', document.body, function () {
            _this3.mouseDown = false;
            _this3.update(_emitter4.default.sources.USER);
          });
        }
      }, {
        key: 'focus',
        value: function focus() {
          if (this.hasFocus()) return;
          this.root.focus();
          this.setRange(this.savedRange);
        }
      }, {
        key: 'format',
        value: function format(_format, value) {
          if (this.scroll.whitelist != null && !this.scroll.whitelist[_format]) return;
          this.scroll.update();
          var nativeRange = this.getNativeRange();
          if (nativeRange == null || !nativeRange.native.collapsed || _parchment2.default.query(_format, _parchment2.default.Scope.BLOCK)) return;
          if (nativeRange.start.node !== this.cursor.textNode) {
            var blot = _parchment2.default.find(nativeRange.start.node, false);
            if (blot == null) return;
            // TODO Give blot ability to not split
            if (blot instanceof _parchment2.default.Leaf) {
              var after = blot.split(nativeRange.start.offset);
              blot.parent.insertBefore(this.cursor, after);
            } else {
              blot.insertBefore(this.cursor, nativeRange.start.node); // Should never happen
            }
            this.cursor.attach();
          }
          this.cursor.format(_format, value);
          this.scroll.optimize();
          this.setNativeRange(this.cursor.textNode, this.cursor.textNode.data.length);
          this.update();
        }
      }, {
        key: 'getBounds',
        value: function getBounds(index) {
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

          var scrollLength = this.scroll.length();
          index = Math.min(index, scrollLength - 1);
          length = Math.min(index + length, scrollLength - 1) - index;
          var node = void 0,
              _scroll$leaf = this.scroll.leaf(index),
              _scroll$leaf2 = _slicedToArray(_scroll$leaf, 2),
              leaf = _scroll$leaf2[0],
              offset = _scroll$leaf2[1];
          if (leaf == null) return null;

          var _leaf$position = leaf.position(offset, true);

          var _leaf$position2 = _slicedToArray(_leaf$position, 2);

          node = _leaf$position2[0];
          offset = _leaf$position2[1];

          var range = document.createRange();
          if (length > 0) {
            range.setStart(node, offset);

            var _scroll$leaf3 = this.scroll.leaf(index + length);

            var _scroll$leaf4 = _slicedToArray(_scroll$leaf3, 2);

            leaf = _scroll$leaf4[0];
            offset = _scroll$leaf4[1];

            if (leaf == null) return null;

            var _leaf$position3 = leaf.position(offset, true);

            var _leaf$position4 = _slicedToArray(_leaf$position3, 2);

            node = _leaf$position4[0];
            offset = _leaf$position4[1];

            range.setEnd(node, offset);
            return range.getBoundingClientRect();
          } else {
            var side = 'left';
            var rect = void 0;
            if (node instanceof Text) {
              if (offset < node.data.length) {
                range.setStart(node, offset);
                range.setEnd(node, offset + 1);
              } else {
                range.setStart(node, offset - 1);
                range.setEnd(node, offset);
                side = 'right';
              }
              rect = range.getBoundingClientRect();
            } else {
              rect = leaf.domNode.getBoundingClientRect();
              if (offset > 0) side = 'right';
            }
            return {
              bottom: rect.top + rect.height,
              height: rect.height,
              left: rect[side],
              right: rect[side],
              top: rect.top,
              width: 0
            };
          }
        }
      }, {
        key: 'getNativeRange',
        value: function getNativeRange() {
          var selection = document.getSelection();
          if (selection == null || selection.rangeCount <= 0) return null;
          var nativeRange = selection.getRangeAt(0);
          if (nativeRange == null) return null;
          var range = this.normalizeNative(nativeRange);
          debug.info('getNativeRange', range);
          return range;
        }
      }, {
        key: 'getRange',
        value: function getRange() {
          var normalized = this.getNativeRange();
          if (normalized == null) return [null, null];
          var range = this.normalizedToRange(normalized);
          return [range, normalized];
        }
      }, {
        key: 'hasFocus',
        value: function hasFocus() {
          return document.activeElement === this.root;
        }
      }, {
        key: 'normalizedToRange',
        value: function normalizedToRange(range) {
          var _this4 = this;

          var positions = [[range.start.node, range.start.offset]];
          if (!range.native.collapsed) {
            positions.push([range.end.node, range.end.offset]);
          }
          var indexes = positions.map(function (position) {
            var _position = _slicedToArray(position, 2),
                node = _position[0],
                offset = _position[1];

            var blot = _parchment2.default.find(node, true);
            var index = blot.offset(_this4.scroll);
            if (offset === 0) {
              return index;
            } else if (blot instanceof _parchment2.default.Container) {
              return index + blot.length();
            } else {
              return index + blot.index(node, offset);
            }
          });
          var end = Math.min(Math.max.apply(Math, _toConsumableArray(indexes)), this.scroll.length() - 1);
          var start = Math.min.apply(Math, [end].concat(_toConsumableArray(indexes)));
          return new Range(start, end - start);
        }
      }, {
        key: 'normalizeNative',
        value: function normalizeNative(nativeRange) {
          if (!contains(this.root, nativeRange.startContainer) || !nativeRange.collapsed && !contains(this.root, nativeRange.endContainer)) {
            return null;
          }
          var range = {
            start: { node: nativeRange.startContainer, offset: nativeRange.startOffset },
            end: { node: nativeRange.endContainer, offset: nativeRange.endOffset },
            native: nativeRange
          };
          [range.start, range.end].forEach(function (position) {
            var node = position.node,
                offset = position.offset;
            while (!(node instanceof Text) && node.childNodes.length > 0) {
              if (node.childNodes.length > offset) {
                node = node.childNodes[offset];
                offset = 0;
              } else if (node.childNodes.length === offset) {
                node = node.lastChild;
                offset = node instanceof Text ? node.data.length : node.childNodes.length + 1;
              } else {
                break;
              }
            }
            position.node = node, position.offset = offset;
          });
          return range;
        }
      }, {
        key: 'rangeToNative',
        value: function rangeToNative(range) {
          var _this5 = this;

          var indexes = range.collapsed ? [range.index] : [range.index, range.index + range.length];
          var args = [];
          var scrollLength = this.scroll.length();
          indexes.forEach(function (index, i) {
            index = Math.min(scrollLength - 1, index);
            var node = void 0,
                _scroll$leaf5 = _this5.scroll.leaf(index),
                _scroll$leaf6 = _slicedToArray(_scroll$leaf5, 2),
                leaf = _scroll$leaf6[0],
                offset = _scroll$leaf6[1];
            var _leaf$position5 = leaf.position(offset, i !== 0);

            var _leaf$position6 = _slicedToArray(_leaf$position5, 2);

            node = _leaf$position6[0];
            offset = _leaf$position6[1];

            args.push(node, offset);
          });
          if (args.length < 2) {
            args = args.concat(args);
          }
          return args;
        }
      }, {
        key: 'scrollIntoView',
        value: function scrollIntoView(scrollingContainer) {
          var range = this.lastRange;
          if (range == null) return;
          var bounds = this.getBounds(range.index, range.length);
          if (bounds == null) return;
          var limit = this.scroll.length() - 1;

          var _scroll$line = this.scroll.line(Math.min(range.index, limit)),
              _scroll$line2 = _slicedToArray(_scroll$line, 1),
              first = _scroll$line2[0];

          var last = first;
          if (range.length > 0) {
            var _scroll$line3 = this.scroll.line(Math.min(range.index + range.length, limit));

            var _scroll$line4 = _slicedToArray(_scroll$line3, 1);

            last = _scroll$line4[0];
          }
          if (first == null || last == null) return;
          var scrollBounds = scrollingContainer.getBoundingClientRect();
          if (bounds.top < scrollBounds.top) {
            scrollingContainer.scrollTop -= scrollBounds.top - bounds.top;
          } else if (bounds.bottom > scrollBounds.bottom) {
            scrollingContainer.scrollTop += bounds.bottom - scrollBounds.bottom;
          }
        }
      }, {
        key: 'setNativeRange',
        value: function setNativeRange(startNode, startOffset) {
          var endNode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : startNode;
          var endOffset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : startOffset;
          var force = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

          debug.info('setNativeRange', startNode, startOffset, endNode, endOffset);
          if (startNode != null && (this.root.parentNode == null || startNode.parentNode == null || endNode.parentNode == null)) {
            return;
          }
          var selection = document.getSelection();
          if (selection == null) return;
          if (startNode != null) {
            if (!this.hasFocus()) this.root.focus();
            var native = (this.getNativeRange() || {}).native;
            if (native == null || force || startNode !== native.startContainer || startOffset !== native.startOffset || endNode !== native.endContainer || endOffset !== native.endOffset) {

              if (startNode.tagName == "BR") {
                startOffset = [].indexOf.call(startNode.parentNode.childNodes, startNode);
                startNode = startNode.parentNode;
              }
              if (endNode.tagName == "BR") {
                endOffset = [].indexOf.call(endNode.parentNode.childNodes, endNode);
                endNode = endNode.parentNode;
              }
              var range = document.createRange();
              range.setStart(startNode, startOffset);
              range.setEnd(endNode, endOffset);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          } else {
            selection.removeAllRanges();
            this.root.blur();
            document.body.focus(); // root.blur() not enough on IE11+Travis+SauceLabs (but not local VMs)
          }
        }
      }, {
        key: 'setRange',
        value: function setRange(range) {
          var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
          var source = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _emitter4.default.sources.API;

          if (typeof force === 'string') {
            source = force;
            force = false;
          }
          debug.info('setRange', range);
          if (range != null) {
            var args = this.rangeToNative(range);
            this.setNativeRange.apply(this, _toConsumableArray(args).concat([force]));
          } else {
            this.setNativeRange(null);
          }
          this.update(source);
        }
      }, {
        key: 'update',
        value: function update() {
          var source = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _emitter4.default.sources.USER;

          var oldRange = this.lastRange;

          var _getRange = this.getRange(),
              _getRange2 = _slicedToArray(_getRange, 2),
              lastRange = _getRange2[0],
              nativeRange = _getRange2[1];

          this.lastRange = lastRange;
          if (this.lastRange != null) {
            this.savedRange = this.lastRange;
          }
          if (!(0, _deepEqual2.default)(oldRange, this.lastRange)) {
            var _emitter;

            if (!this.composing && nativeRange != null && nativeRange.native.collapsed && nativeRange.start.node !== this.cursor.textNode) {
              this.cursor.restore();
            }
            var args = [_emitter4.default.events.SELECTION_CHANGE, (0, _clone2.default)(this.lastRange), (0, _clone2.default)(oldRange), source];
            (_emitter = this.emitter).emit.apply(_emitter, [_emitter4.default.events.EDITOR_CHANGE].concat(args));
            if (source !== _emitter4.default.sources.SILENT) {
              var _emitter2;

              (_emitter2 = this.emitter).emit.apply(_emitter2, args);
            }
          }
        }
      }]);

      return Selection;
    }();

    function contains(parent, descendant) {
      try {
        // Firefox inserts inaccessible nodes around video elements
        descendant.parentNode;
      } catch (e) {
        return false;
      }
      // IE11 has bug with Text nodes
      // https://connect.microsoft.com/IE/feedback/details/780874/node-contains-is-incorrect
      if (descendant instanceof Text) {
        descendant = descendant.parentNode;
      }
      return parent.contains(descendant);
    }

    exports.Range = Range;
    exports.default = Selection;

    /***/ }),
    /* 16 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Break = function (_Parchment$Embed) {
      _inherits(Break, _Parchment$Embed);

      function Break() {
        _classCallCheck(this, Break);

        return _possibleConstructorReturn(this, (Break.__proto__ || Object.getPrototypeOf(Break)).apply(this, arguments));
      }

      _createClass(Break, [{
        key: 'insertInto',
        value: function insertInto(parent, ref) {
          if (parent.children.length === 0) {
            _get(Break.prototype.__proto__ || Object.getPrototypeOf(Break.prototype), 'insertInto', this).call(this, parent, ref);
          } else {
            this.remove();
          }
        }
      }, {
        key: 'length',
        value: function length() {
          return 0;
        }
      }, {
        key: 'value',
        value: function value() {
          return '';
        }
      }], [{
        key: 'value',
        value: function value() {
          return undefined;
        }
      }]);

      return Break;
    }(_parchment2.default.Embed);

    Break.blotName = 'break';
    Break.tagName = 'BR';

    exports.default = Break;

    /***/ }),
    /* 17 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var linked_list_1 = __webpack_require__(44);
    var shadow_1 = __webpack_require__(30);
    var Registry = __webpack_require__(1);
    var ContainerBlot = /** @class */ (function (_super) {
        __extends(ContainerBlot, _super);
        function ContainerBlot(domNode) {
            var _this = _super.call(this, domNode) || this;
            _this.build();
            return _this;
        }
        ContainerBlot.prototype.appendChild = function (other) {
            this.insertBefore(other);
        };
        ContainerBlot.prototype.attach = function () {
            _super.prototype.attach.call(this);
            this.children.forEach(function (child) {
                child.attach();
            });
        };
        ContainerBlot.prototype.build = function () {
            var _this = this;
            this.children = new linked_list_1.default();
            // Need to be reversed for if DOM nodes already in order
            [].slice
                .call(this.domNode.childNodes)
                .reverse()
                .forEach(function (node) {
                try {
                    var child = makeBlot(node);
                    _this.insertBefore(child, _this.children.head || undefined);
                }
                catch (err) {
                    if (err instanceof Registry.ParchmentError)
                        return;
                    else
                        throw err;
                }
            });
        };
        ContainerBlot.prototype.deleteAt = function (index, length) {
            if (index === 0 && length === this.length()) {
                return this.remove();
            }
            this.children.forEachAt(index, length, function (child, offset, length) {
                child.deleteAt(offset, length);
            });
        };
        ContainerBlot.prototype.descendant = function (criteria, index) {
            var _a = this.children.find(index), child = _a[0], offset = _a[1];
            if ((criteria.blotName == null && criteria(child)) ||
                (criteria.blotName != null && child instanceof criteria)) {
                return [child, offset];
            }
            else if (child instanceof ContainerBlot) {
                return child.descendant(criteria, offset);
            }
            else {
                return [null, -1];
            }
        };
        ContainerBlot.prototype.descendants = function (criteria, index, length) {
            if (index === void 0) { index = 0; }
            if (length === void 0) { length = Number.MAX_VALUE; }
            var descendants = [];
            var lengthLeft = length;
            this.children.forEachAt(index, length, function (child, index, length) {
                if ((criteria.blotName == null && criteria(child)) ||
                    (criteria.blotName != null && child instanceof criteria)) {
                    descendants.push(child);
                }
                if (child instanceof ContainerBlot) {
                    descendants = descendants.concat(child.descendants(criteria, index, lengthLeft));
                }
                lengthLeft -= length;
            });
            return descendants;
        };
        ContainerBlot.prototype.detach = function () {
            this.children.forEach(function (child) {
                child.detach();
            });
            _super.prototype.detach.call(this);
        };
        ContainerBlot.prototype.formatAt = function (index, length, name, value) {
            this.children.forEachAt(index, length, function (child, offset, length) {
                child.formatAt(offset, length, name, value);
            });
        };
        ContainerBlot.prototype.insertAt = function (index, value, def) {
            var _a = this.children.find(index), child = _a[0], offset = _a[1];
            if (child) {
                child.insertAt(offset, value, def);
            }
            else {
                var blot = def == null ? Registry.create('text', value) : Registry.create(value, def);
                this.appendChild(blot);
            }
        };
        ContainerBlot.prototype.insertBefore = function (childBlot, refBlot) {
            if (this.statics.allowedChildren != null &&
                !this.statics.allowedChildren.some(function (child) {
                    return childBlot instanceof child;
                })) {
                throw new Registry.ParchmentError("Cannot insert " + childBlot.statics.blotName + " into " + this.statics.blotName);
            }
            childBlot.insertInto(this, refBlot);
        };
        ContainerBlot.prototype.length = function () {
            return this.children.reduce(function (memo, child) {
                return memo + child.length();
            }, 0);
        };
        ContainerBlot.prototype.moveChildren = function (targetParent, refNode) {
            this.children.forEach(function (child) {
                targetParent.insertBefore(child, refNode);
            });
        };
        ContainerBlot.prototype.optimize = function (context) {
            _super.prototype.optimize.call(this, context);
            if (this.children.length === 0) {
                if (this.statics.defaultChild != null) {
                    var child = Registry.create(this.statics.defaultChild);
                    this.appendChild(child);
                    child.optimize(context);
                }
                else {
                    this.remove();
                }
            }
        };
        ContainerBlot.prototype.path = function (index, inclusive) {
            if (inclusive === void 0) { inclusive = false; }
            var _a = this.children.find(index, inclusive), child = _a[0], offset = _a[1];
            var position = [[this, index]];
            if (child instanceof ContainerBlot) {
                return position.concat(child.path(offset, inclusive));
            }
            else if (child != null) {
                position.push([child, offset]);
            }
            return position;
        };
        ContainerBlot.prototype.removeChild = function (child) {
            this.children.remove(child);
        };
        ContainerBlot.prototype.replace = function (target) {
            if (target instanceof ContainerBlot) {
                target.moveChildren(this);
            }
            _super.prototype.replace.call(this, target);
        };
        ContainerBlot.prototype.split = function (index, force) {
            if (force === void 0) { force = false; }
            if (!force) {
                if (index === 0)
                    return this;
                if (index === this.length())
                    return this.next;
            }
            var after = this.clone();
            this.parent.insertBefore(after, this.next);
            this.children.forEachAt(index, this.length(), function (child, offset, length) {
                child = child.split(offset, force);
                after.appendChild(child);
            });
            return after;
        };
        ContainerBlot.prototype.unwrap = function () {
            this.moveChildren(this.parent, this.next);
            this.remove();
        };
        ContainerBlot.prototype.update = function (mutations, context) {
            var _this = this;
            var addedNodes = [];
            var removedNodes = [];
            mutations.forEach(function (mutation) {
                if (mutation.target === _this.domNode && mutation.type === 'childList') {
                    addedNodes.push.apply(addedNodes, mutation.addedNodes);
                    removedNodes.push.apply(removedNodes, mutation.removedNodes);
                }
            });
            removedNodes.forEach(function (node) {
                // Check node has actually been removed
                // One exception is Chrome does not immediately remove IFRAMEs
                // from DOM but MutationRecord is correct in its reported removal
                if (node.parentNode != null &&
                    // @ts-ignore
                    node.tagName !== 'IFRAME' &&
                    document.body.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY) {
                    return;
                }
                var blot = Registry.find(node);
                if (blot == null)
                    return;
                if (blot.domNode.parentNode == null || blot.domNode.parentNode === _this.domNode) {
                    blot.detach();
                }
            });
            addedNodes
                .filter(function (node) {
                return node.parentNode == _this.domNode;
            })
                .sort(function (a, b) {
                if (a === b)
                    return 0;
                if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    return 1;
                }
                return -1;
            })
                .forEach(function (node) {
                var refBlot = null;
                if (node.nextSibling != null) {
                    refBlot = Registry.find(node.nextSibling);
                }
                var blot = makeBlot(node);
                if (blot.next != refBlot || blot.next == null) {
                    if (blot.parent != null) {
                        blot.parent.removeChild(_this);
                    }
                    _this.insertBefore(blot, refBlot || undefined);
                }
            });
        };
        return ContainerBlot;
    }(shadow_1.default));
    function makeBlot(node) {
        var blot = Registry.find(node);
        if (blot == null) {
            try {
                blot = Registry.create(node);
            }
            catch (e) {
                blot = Registry.create(Registry.Scope.INLINE);
                [].slice.call(node.childNodes).forEach(function (child) {
                    // @ts-ignore
                    blot.domNode.appendChild(child);
                });
                if (node.parentNode) {
                    node.parentNode.replaceChild(blot.domNode, node);
                }
                blot.attach();
            }
        }
        return blot;
    }
    exports.default = ContainerBlot;


    /***/ }),
    /* 18 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var attributor_1 = __webpack_require__(12);
    var store_1 = __webpack_require__(31);
    var container_1 = __webpack_require__(17);
    var Registry = __webpack_require__(1);
    var FormatBlot = /** @class */ (function (_super) {
        __extends(FormatBlot, _super);
        function FormatBlot(domNode) {
            var _this = _super.call(this, domNode) || this;
            _this.attributes = new store_1.default(_this.domNode);
            return _this;
        }
        FormatBlot.formats = function (domNode) {
            if (typeof this.tagName === 'string') {
                return true;
            }
            else if (Array.isArray(this.tagName)) {
                return domNode.tagName.toLowerCase();
            }
            return undefined;
        };
        FormatBlot.prototype.format = function (name, value) {
            var format = Registry.query(name);
            if (format instanceof attributor_1.default) {
                this.attributes.attribute(format, value);
            }
            else if (value) {
                if (format != null && (name !== this.statics.blotName || this.formats()[name] !== value)) {
                    this.replaceWith(name, value);
                }
            }
        };
        FormatBlot.prototype.formats = function () {
            var formats = this.attributes.values();
            var format = this.statics.formats(this.domNode);
            if (format != null) {
                formats[this.statics.blotName] = format;
            }
            return formats;
        };
        FormatBlot.prototype.replaceWith = function (name, value) {
            var replacement = _super.prototype.replaceWith.call(this, name, value);
            this.attributes.copy(replacement);
            return replacement;
        };
        FormatBlot.prototype.update = function (mutations, context) {
            var _this = this;
            _super.prototype.update.call(this, mutations, context);
            if (mutations.some(function (mutation) {
                return mutation.target === _this.domNode && mutation.type === 'attributes';
            })) {
                this.attributes.build();
            }
        };
        FormatBlot.prototype.wrap = function (name, value) {
            var wrapper = _super.prototype.wrap.call(this, name, value);
            if (wrapper instanceof FormatBlot && wrapper.statics.scope === this.statics.scope) {
                this.attributes.move(wrapper);
            }
            return wrapper;
        };
        return FormatBlot;
    }(container_1.default));
    exports.default = FormatBlot;


    /***/ }),
    /* 19 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var shadow_1 = __webpack_require__(30);
    var Registry = __webpack_require__(1);
    var LeafBlot = /** @class */ (function (_super) {
        __extends(LeafBlot, _super);
        function LeafBlot() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        LeafBlot.value = function (domNode) {
            return true;
        };
        LeafBlot.prototype.index = function (node, offset) {
            if (this.domNode === node ||
                this.domNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY) {
                return Math.min(offset, 1);
            }
            return -1;
        };
        LeafBlot.prototype.position = function (index, inclusive) {
            var offset = [].indexOf.call(this.parent.domNode.childNodes, this.domNode);
            if (index > 0)
                offset += 1;
            return [this.parent.domNode, offset];
        };
        LeafBlot.prototype.value = function () {
            var _a;
            return _a = {}, _a[this.statics.blotName] = this.statics.value(this.domNode) || true, _a;
        };
        LeafBlot.scope = Registry.Scope.INLINE_BLOT;
        return LeafBlot;
    }(shadow_1.default));
    exports.default = LeafBlot;


    /***/ }),
    /* 20 */
    /***/ (function(module, exports, __webpack_require__) {

    var equal = __webpack_require__(11);
    var extend = __webpack_require__(3);


    var lib = {
      attributes: {
        compose: function (a, b, keepNull) {
          if (typeof a !== 'object') a = {};
          if (typeof b !== 'object') b = {};
          var attributes = extend(true, {}, b);
          if (!keepNull) {
            attributes = Object.keys(attributes).reduce(function (copy, key) {
              if (attributes[key] != null) {
                copy[key] = attributes[key];
              }
              return copy;
            }, {});
          }
          for (var key in a) {
            if (a[key] !== undefined && b[key] === undefined) {
              attributes[key] = a[key];
            }
          }
          return Object.keys(attributes).length > 0 ? attributes : undefined;
        },

        diff: function(a, b) {
          if (typeof a !== 'object') a = {};
          if (typeof b !== 'object') b = {};
          var attributes = Object.keys(a).concat(Object.keys(b)).reduce(function (attributes, key) {
            if (!equal(a[key], b[key])) {
              attributes[key] = b[key] === undefined ? null : b[key];
            }
            return attributes;
          }, {});
          return Object.keys(attributes).length > 0 ? attributes : undefined;
        },

        transform: function (a, b, priority) {
          if (typeof a !== 'object') return b;
          if (typeof b !== 'object') return undefined;
          if (!priority) return b;  // b simply overwrites us without priority
          var attributes = Object.keys(b).reduce(function (attributes, key) {
            if (a[key] === undefined) attributes[key] = b[key];  // null is a valid value
            return attributes;
          }, {});
          return Object.keys(attributes).length > 0 ? attributes : undefined;
        }
      },

      iterator: function (ops) {
        return new Iterator(ops);
      },

      length: function (op) {
        if (typeof op['delete'] === 'number') {
          return op['delete'];
        } else if (typeof op.retain === 'number') {
          return op.retain;
        } else {
          return typeof op.insert === 'string' ? op.insert.length : 1;
        }
      }
    };


    function Iterator(ops) {
      this.ops = ops;
      this.index = 0;
      this.offset = 0;
    }
    Iterator.prototype.hasNext = function () {
      return this.peekLength() < Infinity;
    };

    Iterator.prototype.next = function (length) {
      if (!length) length = Infinity;
      var nextOp = this.ops[this.index];
      if (nextOp) {
        var offset = this.offset;
        var opLength = lib.length(nextOp);
        if (length >= opLength - offset) {
          length = opLength - offset;
          this.index += 1;
          this.offset = 0;
        } else {
          this.offset += length;
        }
        if (typeof nextOp['delete'] === 'number') {
          return { 'delete': length };
        } else {
          var retOp = {};
          if (nextOp.attributes) {
            retOp.attributes = nextOp.attributes;
          }
          if (typeof nextOp.retain === 'number') {
            retOp.retain = length;
          } else if (typeof nextOp.insert === 'string') {
            retOp.insert = nextOp.insert.substr(offset, length);
          } else {
            // offset should === 0, length should === 1
            retOp.insert = nextOp.insert;
          }
          return retOp;
        }
      } else {
        return { retain: Infinity };
      }
    };

    Iterator.prototype.peek = function () {
      return this.ops[this.index];
    };

    Iterator.prototype.peekLength = function () {
      if (this.ops[this.index]) {
        // Should never return 0 if our index is being managed correctly
        return lib.length(this.ops[this.index]) - this.offset;
      } else {
        return Infinity;
      }
    };

    Iterator.prototype.peekType = function () {
      if (this.ops[this.index]) {
        if (typeof this.ops[this.index]['delete'] === 'number') {
          return 'delete';
        } else if (typeof this.ops[this.index].retain === 'number') {
          return 'retain';
        } else {
          return 'insert';
        }
      }
      return 'retain';
    };

    Iterator.prototype.rest = function () {
      if (!this.hasNext()) {
        return [];
      } else if (this.offset === 0) {
        return this.ops.slice(this.index);
      } else {
        var offset = this.offset;
        var index = this.index;
        var next = this.next();
        var rest = this.ops.slice(this.index);
        this.offset = offset;
        this.index = index;
        return [next].concat(rest);
      }
    };


    module.exports = lib;


    /***/ }),
    /* 21 */
    /***/ (function(module, exports) {

    var clone = (function() {

    function _instanceof(obj, type) {
      return type != null && obj instanceof type;
    }

    var nativeMap;
    try {
      nativeMap = Map;
    } catch(_) {
      // maybe a reference error because no `Map`. Give it a dummy value that no
      // value will ever be an instanceof.
      nativeMap = function() {};
    }

    var nativeSet;
    try {
      nativeSet = Set;
    } catch(_) {
      nativeSet = function() {};
    }

    var nativePromise;
    try {
      nativePromise = Promise;
    } catch(_) {
      nativePromise = function() {};
    }

    /**
     * Clones (copies) an Object using deep copying.
     *
     * This function supports circular references by default, but if you are certain
     * there are no circular references in your object, you can save some CPU time
     * by calling clone(obj, false).
     *
     * Caution: if `circular` is false and `parent` contains circular references,
     * your program may enter an infinite loop and crash.
     *
     * @param `parent` - the object to be cloned
     * @param `circular` - set to true if the object to be cloned may contain
     *    circular references. (optional - true by default)
     * @param `depth` - set to a number if the object is only to be cloned to
     *    a particular depth. (optional - defaults to Infinity)
     * @param `prototype` - sets the prototype to be used when cloning an object.
     *    (optional - defaults to parent prototype).
     * @param `includeNonEnumerable` - set to true if the non-enumerable properties
     *    should be cloned as well. Non-enumerable properties on the prototype
     *    chain will be ignored. (optional - false by default)
    */
    function clone(parent, circular, depth, prototype, includeNonEnumerable) {
      if (typeof circular === 'object') {
        depth = circular.depth;
        prototype = circular.prototype;
        includeNonEnumerable = circular.includeNonEnumerable;
        circular = circular.circular;
      }
      // maintain two arrays for circular references, where corresponding parents
      // and children have the same index
      var allParents = [];
      var allChildren = [];

      var useBuffer = typeof Buffer != 'undefined';

      if (typeof circular == 'undefined')
        circular = true;

      if (typeof depth == 'undefined')
        depth = Infinity;

      // recurse this function so we don't reset allParents and allChildren
      function _clone(parent, depth) {
        // cloning null always returns null
        if (parent === null)
          return null;

        if (depth === 0)
          return parent;

        var child;
        var proto;
        if (typeof parent != 'object') {
          return parent;
        }

        if (_instanceof(parent, nativeMap)) {
          child = new nativeMap();
        } else if (_instanceof(parent, nativeSet)) {
          child = new nativeSet();
        } else if (_instanceof(parent, nativePromise)) {
          child = new nativePromise(function (resolve, reject) {
            parent.then(function(value) {
              resolve(_clone(value, depth - 1));
            }, function(err) {
              reject(_clone(err, depth - 1));
            });
          });
        } else if (clone.__isArray(parent)) {
          child = [];
        } else if (clone.__isRegExp(parent)) {
          child = new RegExp(parent.source, __getRegExpFlags(parent));
          if (parent.lastIndex) child.lastIndex = parent.lastIndex;
        } else if (clone.__isDate(parent)) {
          child = new Date(parent.getTime());
        } else if (useBuffer && Buffer.isBuffer(parent)) {
          if (Buffer.allocUnsafe) {
            // Node.js >= 4.5.0
            child = Buffer.allocUnsafe(parent.length);
          } else {
            // Older Node.js versions
            child = new Buffer(parent.length);
          }
          parent.copy(child);
          return child;
        } else if (_instanceof(parent, Error)) {
          child = Object.create(parent);
        } else {
          if (typeof prototype == 'undefined') {
            proto = Object.getPrototypeOf(parent);
            child = Object.create(proto);
          }
          else {
            child = Object.create(prototype);
            proto = prototype;
          }
        }

        if (circular) {
          var index = allParents.indexOf(parent);

          if (index != -1) {
            return allChildren[index];
          }
          allParents.push(parent);
          allChildren.push(child);
        }

        if (_instanceof(parent, nativeMap)) {
          parent.forEach(function(value, key) {
            var keyChild = _clone(key, depth - 1);
            var valueChild = _clone(value, depth - 1);
            child.set(keyChild, valueChild);
          });
        }
        if (_instanceof(parent, nativeSet)) {
          parent.forEach(function(value) {
            var entryChild = _clone(value, depth - 1);
            child.add(entryChild);
          });
        }

        for (var i in parent) {
          var attrs;
          if (proto) {
            attrs = Object.getOwnPropertyDescriptor(proto, i);
          }

          if (attrs && attrs.set == null) {
            continue;
          }
          child[i] = _clone(parent[i], depth - 1);
        }

        if (Object.getOwnPropertySymbols) {
          var symbols = Object.getOwnPropertySymbols(parent);
          for (var i = 0; i < symbols.length; i++) {
            // Don't need to worry about cloning a symbol because it is a primitive,
            // like a number or string.
            var symbol = symbols[i];
            var descriptor = Object.getOwnPropertyDescriptor(parent, symbol);
            if (descriptor && !descriptor.enumerable && !includeNonEnumerable) {
              continue;
            }
            child[symbol] = _clone(parent[symbol], depth - 1);
            if (!descriptor.enumerable) {
              Object.defineProperty(child, symbol, {
                enumerable: false
              });
            }
          }
        }

        if (includeNonEnumerable) {
          var allPropertyNames = Object.getOwnPropertyNames(parent);
          for (var i = 0; i < allPropertyNames.length; i++) {
            var propertyName = allPropertyNames[i];
            var descriptor = Object.getOwnPropertyDescriptor(parent, propertyName);
            if (descriptor && descriptor.enumerable) {
              continue;
            }
            child[propertyName] = _clone(parent[propertyName], depth - 1);
            Object.defineProperty(child, propertyName, {
              enumerable: false
            });
          }
        }

        return child;
      }

      return _clone(parent, depth);
    }

    /**
     * Simple flat clone using prototype, accepts only objects, usefull for property
     * override on FLAT configuration object (no nested props).
     *
     * USE WITH CAUTION! This may not behave as you wish if you do not know how this
     * works.
     */
    clone.clonePrototype = function clonePrototype(parent) {
      if (parent === null)
        return null;

      var c = function () {};
      c.prototype = parent;
      return new c();
    };

    // private utility functions

    function __objToStr(o) {
      return Object.prototype.toString.call(o);
    }
    clone.__objToStr = __objToStr;

    function __isDate(o) {
      return typeof o === 'object' && __objToStr(o) === '[object Date]';
    }
    clone.__isDate = __isDate;

    function __isArray(o) {
      return typeof o === 'object' && __objToStr(o) === '[object Array]';
    }
    clone.__isArray = __isArray;

    function __isRegExp(o) {
      return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
    }
    clone.__isRegExp = __isRegExp;

    function __getRegExpFlags(re) {
      var flags = '';
      if (re.global) flags += 'g';
      if (re.ignoreCase) flags += 'i';
      if (re.multiline) flags += 'm';
      return flags;
    }
    clone.__getRegExpFlags = __getRegExpFlags;

    return clone;
    })();

    if (typeof module === 'object' && module.exports) {
      module.exports = clone;
    }


    /***/ }),
    /* 22 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _emitter = __webpack_require__(8);

    var _emitter2 = _interopRequireDefault(_emitter);

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    var _break = __webpack_require__(16);

    var _break2 = _interopRequireDefault(_break);

    var _code = __webpack_require__(13);

    var _code2 = _interopRequireDefault(_code);

    var _container = __webpack_require__(25);

    var _container2 = _interopRequireDefault(_container);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    function isLine(blot) {
      return blot instanceof _block2.default || blot instanceof _block.BlockEmbed;
    }

    var Scroll = function (_Parchment$Scroll) {
      _inherits(Scroll, _Parchment$Scroll);

      function Scroll(domNode, config) {
        _classCallCheck(this, Scroll);

        var _this = _possibleConstructorReturn(this, (Scroll.__proto__ || Object.getPrototypeOf(Scroll)).call(this, domNode));

        _this.emitter = config.emitter;
        if (Array.isArray(config.whitelist)) {
          _this.whitelist = config.whitelist.reduce(function (whitelist, format) {
            whitelist[format] = true;
            return whitelist;
          }, {});
        }
        // Some reason fixes composition issues with character languages in Windows/Chrome, Safari
        _this.domNode.addEventListener('DOMNodeInserted', function () {});
        _this.optimize();
        _this.enable();
        return _this;
      }

      _createClass(Scroll, [{
        key: 'batchStart',
        value: function batchStart() {
          this.batch = true;
        }
      }, {
        key: 'batchEnd',
        value: function batchEnd() {
          this.batch = false;
          this.optimize();
        }
      }, {
        key: 'deleteAt',
        value: function deleteAt(index, length) {
          var _line = this.line(index),
              _line2 = _slicedToArray(_line, 2),
              first = _line2[0],
              offset = _line2[1];

          var _line3 = this.line(index + length),
              _line4 = _slicedToArray(_line3, 1),
              last = _line4[0];

          _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'deleteAt', this).call(this, index, length);
          if (last != null && first !== last && offset > 0) {
            if (first instanceof _block.BlockEmbed || last instanceof _block.BlockEmbed) {
              this.optimize();
              return;
            }
            if (first instanceof _code2.default) {
              var newlineIndex = first.newlineIndex(first.length(), true);
              if (newlineIndex > -1) {
                first = first.split(newlineIndex + 1);
                if (first === last) {
                  this.optimize();
                  return;
                }
              }
            } else if (last instanceof _code2.default) {
              var _newlineIndex = last.newlineIndex(0);
              if (_newlineIndex > -1) {
                last.split(_newlineIndex + 1);
              }
            }
            var ref = last.children.head instanceof _break2.default ? null : last.children.head;
            first.moveChildren(last, ref);
            first.remove();
          }
          this.optimize();
        }
      }, {
        key: 'enable',
        value: function enable() {
          var enabled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

          this.domNode.setAttribute('contenteditable', enabled);
        }
      }, {
        key: 'formatAt',
        value: function formatAt(index, length, format, value) {
          if (this.whitelist != null && !this.whitelist[format]) return;
          _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'formatAt', this).call(this, index, length, format, value);
          this.optimize();
        }
      }, {
        key: 'insertAt',
        value: function insertAt(index, value, def) {
          if (def != null && this.whitelist != null && !this.whitelist[value]) return;
          if (index >= this.length()) {
            if (def == null || _parchment2.default.query(value, _parchment2.default.Scope.BLOCK) == null) {
              var blot = _parchment2.default.create(this.statics.defaultChild);
              this.appendChild(blot);
              if (def == null && value.endsWith('\n')) {
                value = value.slice(0, -1);
              }
              blot.insertAt(0, value, def);
            } else {
              var embed = _parchment2.default.create(value, def);
              this.appendChild(embed);
            }
          } else {
            _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'insertAt', this).call(this, index, value, def);
          }
          this.optimize();
        }
      }, {
        key: 'insertBefore',
        value: function insertBefore(blot, ref) {
          if (blot.statics.scope === _parchment2.default.Scope.INLINE_BLOT) {
            var wrapper = _parchment2.default.create(this.statics.defaultChild);
            wrapper.appendChild(blot);
            blot = wrapper;
          }
          _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'insertBefore', this).call(this, blot, ref);
        }
      }, {
        key: 'leaf',
        value: function leaf(index) {
          return this.path(index).pop() || [null, -1];
        }
      }, {
        key: 'line',
        value: function line(index) {
          if (index === this.length()) {
            return this.line(index - 1);
          }
          return this.descendant(isLine, index);
        }
      }, {
        key: 'lines',
        value: function lines() {
          var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var length = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Number.MAX_VALUE;

          var getLines = function getLines(blot, index, length) {
            var lines = [],
                lengthLeft = length;
            blot.children.forEachAt(index, length, function (child, index, length) {
              if (isLine(child)) {
                lines.push(child);
              } else if (child instanceof _parchment2.default.Container) {
                lines = lines.concat(getLines(child, index, lengthLeft));
              }
              lengthLeft -= length;
            });
            return lines;
          };
          return getLines(this, index, length);
        }
      }, {
        key: 'optimize',
        value: function optimize() {
          var mutations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
          var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

          if (this.batch === true) return;
          _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'optimize', this).call(this, mutations, context);
          if (mutations.length > 0) {
            this.emitter.emit(_emitter2.default.events.SCROLL_OPTIMIZE, mutations, context);
          }
        }
      }, {
        key: 'path',
        value: function path(index) {
          return _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'path', this).call(this, index).slice(1); // Exclude self
        }
      }, {
        key: 'update',
        value: function update(mutations) {
          if (this.batch === true) return;
          var source = _emitter2.default.sources.USER;
          if (typeof mutations === 'string') {
            source = mutations;
          }
          if (!Array.isArray(mutations)) {
            mutations = this.observer.takeRecords();
          }
          if (mutations.length > 0) {
            this.emitter.emit(_emitter2.default.events.SCROLL_BEFORE_UPDATE, source, mutations);
          }
          _get(Scroll.prototype.__proto__ || Object.getPrototypeOf(Scroll.prototype), 'update', this).call(this, mutations.concat([])); // pass copy
          if (mutations.length > 0) {
            this.emitter.emit(_emitter2.default.events.SCROLL_UPDATE, source, mutations);
          }
        }
      }]);

      return Scroll;
    }(_parchment2.default.Scroll);

    Scroll.blotName = 'scroll';
    Scroll.className = 'ql-editor';
    Scroll.tagName = 'DIV';
    Scroll.defaultChild = 'block';
    Scroll.allowedChildren = [_block2.default, _block.BlockEmbed, _container2.default];

    exports.default = Scroll;

    /***/ }),
    /* 23 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SHORTKEY = exports.default = undefined;

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _clone = __webpack_require__(21);

    var _clone2 = _interopRequireDefault(_clone);

    var _deepEqual = __webpack_require__(11);

    var _deepEqual2 = _interopRequireDefault(_deepEqual);

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _op = __webpack_require__(20);

    var _op2 = _interopRequireDefault(_op);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _logger = __webpack_require__(10);

    var _logger2 = _interopRequireDefault(_logger);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var debug = (0, _logger2.default)('quill:keyboard');

    var SHORTKEY = /Mac/i.test(navigator.platform) ? 'metaKey' : 'ctrlKey';

    var Keyboard = function (_Module) {
      _inherits(Keyboard, _Module);

      _createClass(Keyboard, null, [{
        key: 'match',
        value: function match(evt, binding) {
          binding = normalize(binding);
          if (['altKey', 'ctrlKey', 'metaKey', 'shiftKey'].some(function (key) {
            return !!binding[key] !== evt[key] && binding[key] !== null;
          })) {
            return false;
          }
          return binding.key === (evt.which || evt.keyCode);
        }
      }]);

      function Keyboard(quill, options) {
        _classCallCheck(this, Keyboard);

        var _this = _possibleConstructorReturn(this, (Keyboard.__proto__ || Object.getPrototypeOf(Keyboard)).call(this, quill, options));

        _this.bindings = {};
        Object.keys(_this.options.bindings).forEach(function (name) {
          if (name === 'list autofill' && quill.scroll.whitelist != null && !quill.scroll.whitelist['list']) {
            return;
          }
          if (_this.options.bindings[name]) {
            _this.addBinding(_this.options.bindings[name]);
          }
        });
        _this.addBinding({ key: Keyboard.keys.ENTER, shiftKey: null }, handleEnter);
        _this.addBinding({ key: Keyboard.keys.ENTER, metaKey: null, ctrlKey: null, altKey: null }, function () {});
        if (/Firefox/i.test(navigator.userAgent)) {
          // Need to handle delete and backspace for Firefox in the general case #1171
          _this.addBinding({ key: Keyboard.keys.BACKSPACE }, { collapsed: true }, handleBackspace);
          _this.addBinding({ key: Keyboard.keys.DELETE }, { collapsed: true }, handleDelete);
        } else {
          _this.addBinding({ key: Keyboard.keys.BACKSPACE }, { collapsed: true, prefix: /^.?$/ }, handleBackspace);
          _this.addBinding({ key: Keyboard.keys.DELETE }, { collapsed: true, suffix: /^.?$/ }, handleDelete);
        }
        _this.addBinding({ key: Keyboard.keys.BACKSPACE }, { collapsed: false }, handleDeleteRange);
        _this.addBinding({ key: Keyboard.keys.DELETE }, { collapsed: false }, handleDeleteRange);
        _this.addBinding({ key: Keyboard.keys.BACKSPACE, altKey: null, ctrlKey: null, metaKey: null, shiftKey: null }, { collapsed: true, offset: 0 }, handleBackspace);
        _this.listen();
        return _this;
      }

      _createClass(Keyboard, [{
        key: 'addBinding',
        value: function addBinding(key) {
          var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          var handler = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

          var binding = normalize(key);
          if (binding == null || binding.key == null) {
            return debug.warn('Attempted to add invalid keyboard binding', binding);
          }
          if (typeof context === 'function') {
            context = { handler: context };
          }
          if (typeof handler === 'function') {
            handler = { handler: handler };
          }
          binding = (0, _extend2.default)(binding, context, handler);
          this.bindings[binding.key] = this.bindings[binding.key] || [];
          this.bindings[binding.key].push(binding);
        }
      }, {
        key: 'listen',
        value: function listen() {
          var _this2 = this;

          this.quill.root.addEventListener('keydown', function (evt) {
            if (evt.defaultPrevented) return;
            var which = evt.which || evt.keyCode;
            var bindings = (_this2.bindings[which] || []).filter(function (binding) {
              return Keyboard.match(evt, binding);
            });
            if (bindings.length === 0) return;
            var range = _this2.quill.getSelection();
            if (range == null || !_this2.quill.hasFocus()) return;

            var _quill$getLine = _this2.quill.getLine(range.index),
                _quill$getLine2 = _slicedToArray(_quill$getLine, 2),
                line = _quill$getLine2[0],
                offset = _quill$getLine2[1];

            var _quill$getLeaf = _this2.quill.getLeaf(range.index),
                _quill$getLeaf2 = _slicedToArray(_quill$getLeaf, 2),
                leafStart = _quill$getLeaf2[0],
                offsetStart = _quill$getLeaf2[1];

            var _ref = range.length === 0 ? [leafStart, offsetStart] : _this2.quill.getLeaf(range.index + range.length),
                _ref2 = _slicedToArray(_ref, 2),
                leafEnd = _ref2[0],
                offsetEnd = _ref2[1];

            var prefixText = leafStart instanceof _parchment2.default.Text ? leafStart.value().slice(0, offsetStart) : '';
            var suffixText = leafEnd instanceof _parchment2.default.Text ? leafEnd.value().slice(offsetEnd) : '';
            var curContext = {
              collapsed: range.length === 0,
              empty: range.length === 0 && line.length() <= 1,
              format: _this2.quill.getFormat(range),
              offset: offset,
              prefix: prefixText,
              suffix: suffixText
            };
            var prevented = bindings.some(function (binding) {
              if (binding.collapsed != null && binding.collapsed !== curContext.collapsed) return false;
              if (binding.empty != null && binding.empty !== curContext.empty) return false;
              if (binding.offset != null && binding.offset !== curContext.offset) return false;
              if (Array.isArray(binding.format)) {
                // any format is present
                if (binding.format.every(function (name) {
                  return curContext.format[name] == null;
                })) {
                  return false;
                }
              } else if (_typeof(binding.format) === 'object') {
                // all formats must match
                if (!Object.keys(binding.format).every(function (name) {
                  if (binding.format[name] === true) return curContext.format[name] != null;
                  if (binding.format[name] === false) return curContext.format[name] == null;
                  return (0, _deepEqual2.default)(binding.format[name], curContext.format[name]);
                })) {
                  return false;
                }
              }
              if (binding.prefix != null && !binding.prefix.test(curContext.prefix)) return false;
              if (binding.suffix != null && !binding.suffix.test(curContext.suffix)) return false;
              return binding.handler.call(_this2, range, curContext) !== true;
            });
            if (prevented) {
              evt.preventDefault();
            }
          });
        }
      }]);

      return Keyboard;
    }(_module2.default);

    Keyboard.keys = {
      BACKSPACE: 8,
      TAB: 9,
      ENTER: 13,
      ESCAPE: 27,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      DELETE: 46
    };

    Keyboard.DEFAULTS = {
      bindings: {
        'bold': makeFormatHandler('bold'),
        'italic': makeFormatHandler('italic'),
        'underline': makeFormatHandler('underline'),
        'indent': {
          // highlight tab or tab at beginning of list, indent or blockquote
          key: Keyboard.keys.TAB,
          format: ['blockquote', 'indent', 'list'],
          handler: function handler(range, context) {
            if (context.collapsed && context.offset !== 0) return true;
            this.quill.format('indent', '+1', _quill2.default.sources.USER);
          }
        },
        'outdent': {
          key: Keyboard.keys.TAB,
          shiftKey: true,
          format: ['blockquote', 'indent', 'list'],
          // highlight tab or tab at beginning of list, indent or blockquote
          handler: function handler(range, context) {
            if (context.collapsed && context.offset !== 0) return true;
            this.quill.format('indent', '-1', _quill2.default.sources.USER);
          }
        },
        'outdent backspace': {
          key: Keyboard.keys.BACKSPACE,
          collapsed: true,
          shiftKey: null,
          metaKey: null,
          ctrlKey: null,
          altKey: null,
          format: ['indent', 'list'],
          offset: 0,
          handler: function handler(range, context) {
            if (context.format.indent != null) {
              this.quill.format('indent', '-1', _quill2.default.sources.USER);
            } else if (context.format.list != null) {
              this.quill.format('list', false, _quill2.default.sources.USER);
            }
          }
        },
        'indent code-block': makeCodeBlockHandler(true),
        'outdent code-block': makeCodeBlockHandler(false),
        'remove tab': {
          key: Keyboard.keys.TAB,
          shiftKey: true,
          collapsed: true,
          prefix: /\t$/,
          handler: function handler(range) {
            this.quill.deleteText(range.index - 1, 1, _quill2.default.sources.USER);
          }
        },
        'tab': {
          key: Keyboard.keys.TAB,
          handler: function handler(range) {
            this.quill.history.cutoff();
            var delta = new _quillDelta2.default().retain(range.index).delete(range.length).insert('\t');
            this.quill.updateContents(delta, _quill2.default.sources.USER);
            this.quill.history.cutoff();
            this.quill.setSelection(range.index + 1, _quill2.default.sources.SILENT);
          }
        },
        'list empty enter': {
          key: Keyboard.keys.ENTER,
          collapsed: true,
          format: ['list'],
          empty: true,
          handler: function handler(range, context) {
            this.quill.format('list', false, _quill2.default.sources.USER);
            if (context.format.indent) {
              this.quill.format('indent', false, _quill2.default.sources.USER);
            }
          }
        },
        'checklist enter': {
          key: Keyboard.keys.ENTER,
          collapsed: true,
          format: { list: 'checked' },
          handler: function handler(range) {
            var _quill$getLine3 = this.quill.getLine(range.index),
                _quill$getLine4 = _slicedToArray(_quill$getLine3, 2),
                line = _quill$getLine4[0],
                offset = _quill$getLine4[1];

            var formats = (0, _extend2.default)({}, line.formats(), { list: 'checked' });
            var delta = new _quillDelta2.default().retain(range.index).insert('\n', formats).retain(line.length() - offset - 1).retain(1, { list: 'unchecked' });
            this.quill.updateContents(delta, _quill2.default.sources.USER);
            this.quill.setSelection(range.index + 1, _quill2.default.sources.SILENT);
            this.quill.scrollIntoView();
          }
        },
        'header enter': {
          key: Keyboard.keys.ENTER,
          collapsed: true,
          format: ['header'],
          suffix: /^$/,
          handler: function handler(range, context) {
            var _quill$getLine5 = this.quill.getLine(range.index),
                _quill$getLine6 = _slicedToArray(_quill$getLine5, 2),
                line = _quill$getLine6[0],
                offset = _quill$getLine6[1];

            var delta = new _quillDelta2.default().retain(range.index).insert('\n', context.format).retain(line.length() - offset - 1).retain(1, { header: null });
            this.quill.updateContents(delta, _quill2.default.sources.USER);
            this.quill.setSelection(range.index + 1, _quill2.default.sources.SILENT);
            this.quill.scrollIntoView();
          }
        },
        'list autofill': {
          key: ' ',
          collapsed: true,
          format: { list: false },
          prefix: /^\s*?(\d+\.|-|\*|\[ ?\]|\[x\])$/,
          handler: function handler(range, context) {
            var length = context.prefix.length;

            var _quill$getLine7 = this.quill.getLine(range.index),
                _quill$getLine8 = _slicedToArray(_quill$getLine7, 2),
                line = _quill$getLine8[0],
                offset = _quill$getLine8[1];

            if (offset > length) return true;
            var value = void 0;
            switch (context.prefix.trim()) {
              case '[]':case '[ ]':
                value = 'unchecked';
                break;
              case '[x]':
                value = 'checked';
                break;
              case '-':case '*':
                value = 'bullet';
                break;
              default:
                value = 'ordered';
            }
            this.quill.insertText(range.index, ' ', _quill2.default.sources.USER);
            this.quill.history.cutoff();
            var delta = new _quillDelta2.default().retain(range.index - offset).delete(length + 1).retain(line.length() - 2 - offset).retain(1, { list: value });
            this.quill.updateContents(delta, _quill2.default.sources.USER);
            this.quill.history.cutoff();
            this.quill.setSelection(range.index - length, _quill2.default.sources.SILENT);
          }
        },
        'code exit': {
          key: Keyboard.keys.ENTER,
          collapsed: true,
          format: ['code-block'],
          prefix: /\n\n$/,
          suffix: /^\s+$/,
          handler: function handler(range) {
            var _quill$getLine9 = this.quill.getLine(range.index),
                _quill$getLine10 = _slicedToArray(_quill$getLine9, 2),
                line = _quill$getLine10[0],
                offset = _quill$getLine10[1];

            var delta = new _quillDelta2.default().retain(range.index + line.length() - offset - 2).retain(1, { 'code-block': null }).delete(1);
            this.quill.updateContents(delta, _quill2.default.sources.USER);
          }
        },
        'embed left': makeEmbedArrowHandler(Keyboard.keys.LEFT, false),
        'embed left shift': makeEmbedArrowHandler(Keyboard.keys.LEFT, true),
        'embed right': makeEmbedArrowHandler(Keyboard.keys.RIGHT, false),
        'embed right shift': makeEmbedArrowHandler(Keyboard.keys.RIGHT, true)
      }
    };

    function makeEmbedArrowHandler(key, shiftKey) {
      var _ref3;

      var where = key === Keyboard.keys.LEFT ? 'prefix' : 'suffix';
      return _ref3 = {
        key: key,
        shiftKey: shiftKey,
        altKey: null
      }, _defineProperty(_ref3, where, /^$/), _defineProperty(_ref3, 'handler', function handler(range) {
        var index = range.index;
        if (key === Keyboard.keys.RIGHT) {
          index += range.length + 1;
        }

        var _quill$getLeaf3 = this.quill.getLeaf(index),
            _quill$getLeaf4 = _slicedToArray(_quill$getLeaf3, 1),
            leaf = _quill$getLeaf4[0];

        if (!(leaf instanceof _parchment2.default.Embed)) return true;
        if (key === Keyboard.keys.LEFT) {
          if (shiftKey) {
            this.quill.setSelection(range.index - 1, range.length + 1, _quill2.default.sources.USER);
          } else {
            this.quill.setSelection(range.index - 1, _quill2.default.sources.USER);
          }
        } else {
          if (shiftKey) {
            this.quill.setSelection(range.index, range.length + 1, _quill2.default.sources.USER);
          } else {
            this.quill.setSelection(range.index + range.length + 1, _quill2.default.sources.USER);
          }
        }
        return false;
      }), _ref3;
    }

    function handleBackspace(range, context) {
      if (range.index === 0 || this.quill.getLength() <= 1) return;

      var _quill$getLine11 = this.quill.getLine(range.index),
          _quill$getLine12 = _slicedToArray(_quill$getLine11, 1),
          line = _quill$getLine12[0];

      var formats = {};
      if (context.offset === 0) {
        var _quill$getLine13 = this.quill.getLine(range.index - 1),
            _quill$getLine14 = _slicedToArray(_quill$getLine13, 1),
            prev = _quill$getLine14[0];

        if (prev != null && prev.length() > 1) {
          var curFormats = line.formats();
          var prevFormats = this.quill.getFormat(range.index - 1, 1);
          formats = _op2.default.attributes.diff(curFormats, prevFormats) || {};
        }
      }
      // Check for astral symbols
      var length = /[\uD800-\uDBFF][\uDC00-\uDFFF]$/.test(context.prefix) ? 2 : 1;
      this.quill.deleteText(range.index - length, length, _quill2.default.sources.USER);
      if (Object.keys(formats).length > 0) {
        this.quill.formatLine(range.index - length, length, formats, _quill2.default.sources.USER);
      }
      this.quill.focus();
    }

    function handleDelete(range, context) {
      // Check for astral symbols
      var length = /^[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(context.suffix) ? 2 : 1;
      if (range.index >= this.quill.getLength() - length) return;
      var formats = {},
          nextLength = 0;

      var _quill$getLine15 = this.quill.getLine(range.index),
          _quill$getLine16 = _slicedToArray(_quill$getLine15, 1),
          line = _quill$getLine16[0];

      if (context.offset >= line.length() - 1) {
        var _quill$getLine17 = this.quill.getLine(range.index + 1),
            _quill$getLine18 = _slicedToArray(_quill$getLine17, 1),
            next = _quill$getLine18[0];

        if (next) {
          var curFormats = line.formats();
          var nextFormats = this.quill.getFormat(range.index, 1);
          formats = _op2.default.attributes.diff(curFormats, nextFormats) || {};
          nextLength = next.length();
        }
      }
      this.quill.deleteText(range.index, length, _quill2.default.sources.USER);
      if (Object.keys(formats).length > 0) {
        this.quill.formatLine(range.index + nextLength - 1, length, formats, _quill2.default.sources.USER);
      }
    }

    function handleDeleteRange(range) {
      var lines = this.quill.getLines(range);
      var formats = {};
      if (lines.length > 1) {
        var firstFormats = lines[0].formats();
        var lastFormats = lines[lines.length - 1].formats();
        formats = _op2.default.attributes.diff(lastFormats, firstFormats) || {};
      }
      this.quill.deleteText(range, _quill2.default.sources.USER);
      if (Object.keys(formats).length > 0) {
        this.quill.formatLine(range.index, 1, formats, _quill2.default.sources.USER);
      }
      this.quill.setSelection(range.index, _quill2.default.sources.SILENT);
      this.quill.focus();
    }

    function handleEnter(range, context) {
      var _this3 = this;

      if (range.length > 0) {
        this.quill.scroll.deleteAt(range.index, range.length); // So we do not trigger text-change
      }
      var lineFormats = Object.keys(context.format).reduce(function (lineFormats, format) {
        if (_parchment2.default.query(format, _parchment2.default.Scope.BLOCK) && !Array.isArray(context.format[format])) {
          lineFormats[format] = context.format[format];
        }
        return lineFormats;
      }, {});
      this.quill.insertText(range.index, '\n', lineFormats, _quill2.default.sources.USER);
      // Earlier scroll.deleteAt might have messed up our selection,
      // so insertText's built in selection preservation is not reliable
      this.quill.setSelection(range.index + 1, _quill2.default.sources.SILENT);
      this.quill.focus();
      Object.keys(context.format).forEach(function (name) {
        if (lineFormats[name] != null) return;
        if (Array.isArray(context.format[name])) return;
        if (name === 'link') return;
        _this3.quill.format(name, context.format[name], _quill2.default.sources.USER);
      });
    }

    function makeCodeBlockHandler(indent) {
      return {
        key: Keyboard.keys.TAB,
        shiftKey: !indent,
        format: { 'code-block': true },
        handler: function handler(range) {
          var CodeBlock = _parchment2.default.query('code-block');
          var index = range.index,
              length = range.length;

          var _quill$scroll$descend = this.quill.scroll.descendant(CodeBlock, index),
              _quill$scroll$descend2 = _slicedToArray(_quill$scroll$descend, 2),
              block = _quill$scroll$descend2[0],
              offset = _quill$scroll$descend2[1];

          if (block == null) return;
          var scrollIndex = this.quill.getIndex(block);
          var start = block.newlineIndex(offset, true) + 1;
          var end = block.newlineIndex(scrollIndex + offset + length);
          var lines = block.domNode.textContent.slice(start, end).split('\n');
          offset = 0;
          lines.forEach(function (line, i) {
            if (indent) {
              block.insertAt(start + offset, CodeBlock.TAB);
              offset += CodeBlock.TAB.length;
              if (i === 0) {
                index += CodeBlock.TAB.length;
              } else {
                length += CodeBlock.TAB.length;
              }
            } else if (line.startsWith(CodeBlock.TAB)) {
              block.deleteAt(start + offset, CodeBlock.TAB.length);
              offset -= CodeBlock.TAB.length;
              if (i === 0) {
                index -= CodeBlock.TAB.length;
              } else {
                length -= CodeBlock.TAB.length;
              }
            }
            offset += line.length + 1;
          });
          this.quill.update(_quill2.default.sources.USER);
          this.quill.setSelection(index, length, _quill2.default.sources.SILENT);
        }
      };
    }

    function makeFormatHandler(format) {
      return {
        key: format[0].toUpperCase(),
        shortKey: true,
        handler: function handler(range, context) {
          this.quill.format(format, !context.format[format], _quill2.default.sources.USER);
        }
      };
    }

    function normalize(binding) {
      if (typeof binding === 'string' || typeof binding === 'number') {
        return normalize({ key: binding });
      }
      if ((typeof binding === 'undefined' ? 'undefined' : _typeof(binding)) === 'object') {
        binding = (0, _clone2.default)(binding, false);
      }
      if (typeof binding.key === 'string') {
        if (Keyboard.keys[binding.key.toUpperCase()] != null) {
          binding.key = Keyboard.keys[binding.key.toUpperCase()];
        } else if (binding.key.length === 1) {
          binding.key = binding.key.toUpperCase().charCodeAt(0);
        } else {
          return null;
        }
      }
      if (binding.shortKey) {
        binding[SHORTKEY] = binding.shortKey;
        delete binding.shortKey;
      }
      return binding;
    }

    exports.default = Keyboard;
    exports.SHORTKEY = SHORTKEY;

    /***/ }),
    /* 24 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _text = __webpack_require__(7);

    var _text2 = _interopRequireDefault(_text);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Cursor = function (_Parchment$Embed) {
      _inherits(Cursor, _Parchment$Embed);

      _createClass(Cursor, null, [{
        key: 'value',
        value: function value() {
          return undefined;
        }
      }]);

      function Cursor(domNode, selection) {
        _classCallCheck(this, Cursor);

        var _this = _possibleConstructorReturn(this, (Cursor.__proto__ || Object.getPrototypeOf(Cursor)).call(this, domNode));

        _this.selection = selection;
        _this.textNode = document.createTextNode(Cursor.CONTENTS);
        _this.domNode.appendChild(_this.textNode);
        _this._length = 0;
        return _this;
      }

      _createClass(Cursor, [{
        key: 'detach',
        value: function detach() {
          // super.detach() will also clear domNode.__blot
          if (this.parent != null) this.parent.removeChild(this);
        }
      }, {
        key: 'format',
        value: function format(name, value) {
          if (this._length !== 0) {
            return _get(Cursor.prototype.__proto__ || Object.getPrototypeOf(Cursor.prototype), 'format', this).call(this, name, value);
          }
          var target = this,
              index = 0;
          while (target != null && target.statics.scope !== _parchment2.default.Scope.BLOCK_BLOT) {
            index += target.offset(target.parent);
            target = target.parent;
          }
          if (target != null) {
            this._length = Cursor.CONTENTS.length;
            target.optimize();
            target.formatAt(index, Cursor.CONTENTS.length, name, value);
            this._length = 0;
          }
        }
      }, {
        key: 'index',
        value: function index(node, offset) {
          if (node === this.textNode) return 0;
          return _get(Cursor.prototype.__proto__ || Object.getPrototypeOf(Cursor.prototype), 'index', this).call(this, node, offset);
        }
      }, {
        key: 'length',
        value: function length() {
          return this._length;
        }
      }, {
        key: 'position',
        value: function position() {
          return [this.textNode, this.textNode.data.length];
        }
      }, {
        key: 'remove',
        value: function remove() {
          _get(Cursor.prototype.__proto__ || Object.getPrototypeOf(Cursor.prototype), 'remove', this).call(this);
          this.parent = null;
        }
      }, {
        key: 'restore',
        value: function restore() {
          if (this.selection.composing || this.parent == null) return;
          var textNode = this.textNode;
          var range = this.selection.getNativeRange();
          var restoreText = void 0,
              start = void 0,
              end = void 0;
          if (range != null && range.start.node === textNode && range.end.node === textNode) {
            var _ref = [textNode, range.start.offset, range.end.offset];
            restoreText = _ref[0];
            start = _ref[1];
            end = _ref[2];
          }
          // Link format will insert text outside of anchor tag
          while (this.domNode.lastChild != null && this.domNode.lastChild !== this.textNode) {
            this.domNode.parentNode.insertBefore(this.domNode.lastChild, this.domNode);
          }
          if (this.textNode.data !== Cursor.CONTENTS) {
            var text = this.textNode.data.split(Cursor.CONTENTS).join('');
            if (this.next instanceof _text2.default) {
              restoreText = this.next.domNode;
              this.next.insertAt(0, text);
              this.textNode.data = Cursor.CONTENTS;
            } else {
              this.textNode.data = text;
              this.parent.insertBefore(_parchment2.default.create(this.textNode), this);
              this.textNode = document.createTextNode(Cursor.CONTENTS);
              this.domNode.appendChild(this.textNode);
            }
          }
          this.remove();
          if (start != null) {
            var _map = [start, end].map(function (offset) {
              return Math.max(0, Math.min(restoreText.data.length, offset - 1));
            });

            var _map2 = _slicedToArray(_map, 2);

            start = _map2[0];
            end = _map2[1];

            return {
              startNode: restoreText,
              startOffset: start,
              endNode: restoreText,
              endOffset: end
            };
          }
        }
      }, {
        key: 'update',
        value: function update(mutations, context) {
          var _this2 = this;

          if (mutations.some(function (mutation) {
            return mutation.type === 'characterData' && mutation.target === _this2.textNode;
          })) {
            var range = this.restore();
            if (range) context.range = range;
          }
        }
      }, {
        key: 'value',
        value: function value() {
          return '';
        }
      }]);

      return Cursor;
    }(_parchment2.default.Embed);

    Cursor.blotName = 'cursor';
    Cursor.className = 'ql-cursor';
    Cursor.tagName = 'span';
    Cursor.CONTENTS = '\uFEFF'; // Zero width no break space


    exports.default = Cursor;

    /***/ }),
    /* 25 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Container = function (_Parchment$Container) {
      _inherits(Container, _Parchment$Container);

      function Container() {
        _classCallCheck(this, Container);

        return _possibleConstructorReturn(this, (Container.__proto__ || Object.getPrototypeOf(Container)).apply(this, arguments));
      }

      return Container;
    }(_parchment2.default.Container);

    Container.allowedChildren = [_block2.default, _block.BlockEmbed, Container];

    exports.default = Container;

    /***/ }),
    /* 26 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ColorStyle = exports.ColorClass = exports.ColorAttributor = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ColorAttributor = function (_Parchment$Attributor) {
      _inherits(ColorAttributor, _Parchment$Attributor);

      function ColorAttributor() {
        _classCallCheck(this, ColorAttributor);

        return _possibleConstructorReturn(this, (ColorAttributor.__proto__ || Object.getPrototypeOf(ColorAttributor)).apply(this, arguments));
      }

      _createClass(ColorAttributor, [{
        key: 'value',
        value: function value(domNode) {
          var value = _get(ColorAttributor.prototype.__proto__ || Object.getPrototypeOf(ColorAttributor.prototype), 'value', this).call(this, domNode);
          if (!value.startsWith('rgb(')) return value;
          value = value.replace(/^[^\d]+/, '').replace(/[^\d]+$/, '');
          return '#' + value.split(',').map(function (component) {
            return ('00' + parseInt(component).toString(16)).slice(-2);
          }).join('');
        }
      }]);

      return ColorAttributor;
    }(_parchment2.default.Attributor.Style);

    var ColorClass = new _parchment2.default.Attributor.Class('color', 'ql-color', {
      scope: _parchment2.default.Scope.INLINE
    });
    var ColorStyle = new ColorAttributor('color', 'color', {
      scope: _parchment2.default.Scope.INLINE
    });

    exports.ColorAttributor = ColorAttributor;
    exports.ColorClass = ColorClass;
    exports.ColorStyle = ColorStyle;

    /***/ }),
    /* 27 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.sanitize = exports.default = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Link = function (_Inline) {
      _inherits(Link, _Inline);

      function Link() {
        _classCallCheck(this, Link);

        return _possibleConstructorReturn(this, (Link.__proto__ || Object.getPrototypeOf(Link)).apply(this, arguments));
      }

      _createClass(Link, [{
        key: 'format',
        value: function format(name, value) {
          if (name !== this.statics.blotName || !value) return _get(Link.prototype.__proto__ || Object.getPrototypeOf(Link.prototype), 'format', this).call(this, name, value);
          value = this.constructor.sanitize(value);
          this.domNode.setAttribute('href', value);
        }
      }], [{
        key: 'create',
        value: function create(value) {
          var node = _get(Link.__proto__ || Object.getPrototypeOf(Link), 'create', this).call(this, value);
          value = this.sanitize(value);
          node.setAttribute('href', value);
          node.setAttribute('rel', 'noopener noreferrer');
          node.setAttribute('target', '_blank');
          return node;
        }
      }, {
        key: 'formats',
        value: function formats(domNode) {
          return domNode.getAttribute('href');
        }
      }, {
        key: 'sanitize',
        value: function sanitize(url) {
          return _sanitize(url, this.PROTOCOL_WHITELIST) ? url : this.SANITIZED_URL;
        }
      }]);

      return Link;
    }(_inline2.default);

    Link.blotName = 'link';
    Link.tagName = 'A';
    Link.SANITIZED_URL = 'about:blank';
    Link.PROTOCOL_WHITELIST = ['http', 'https', 'mailto', 'tel'];

    function _sanitize(url, protocols) {
      var anchor = document.createElement('a');
      anchor.href = url;
      var protocol = anchor.href.slice(0, anchor.href.indexOf(':'));
      return protocols.indexOf(protocol) > -1;
    }

    exports.default = Link;
    exports.sanitize = _sanitize;

    /***/ }),
    /* 28 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _keyboard = __webpack_require__(23);

    var _keyboard2 = _interopRequireDefault(_keyboard);

    var _dropdown = __webpack_require__(107);

    var _dropdown2 = _interopRequireDefault(_dropdown);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var optionsCounter = 0;

    function toggleAriaAttribute(element, attribute) {
      element.setAttribute(attribute, !(element.getAttribute(attribute) === 'true'));
    }

    var Picker = function () {
      function Picker(select) {
        var _this = this;

        _classCallCheck(this, Picker);

        this.select = select;
        this.container = document.createElement('span');
        this.buildPicker();
        this.select.style.display = 'none';
        this.select.parentNode.insertBefore(this.container, this.select);

        this.label.addEventListener('mousedown', function () {
          _this.togglePicker();
        });
        this.label.addEventListener('keydown', function (event) {
          switch (event.keyCode) {
            // Allows the "Enter" key to open the picker
            case _keyboard2.default.keys.ENTER:
              _this.togglePicker();
              break;

            // Allows the "Escape" key to close the picker
            case _keyboard2.default.keys.ESCAPE:
              _this.escape();
              event.preventDefault();
              break;
          }
        });
        this.select.addEventListener('change', this.update.bind(this));
      }

      _createClass(Picker, [{
        key: 'togglePicker',
        value: function togglePicker() {
          this.container.classList.toggle('ql-expanded');
          // Toggle aria-expanded and aria-hidden to make the picker accessible
          toggleAriaAttribute(this.label, 'aria-expanded');
          toggleAriaAttribute(this.options, 'aria-hidden');
        }
      }, {
        key: 'buildItem',
        value: function buildItem(option) {
          var _this2 = this;

          var item = document.createElement('span');
          item.tabIndex = '0';
          item.setAttribute('role', 'button');

          item.classList.add('ql-picker-item');
          if (option.hasAttribute('value')) {
            item.setAttribute('data-value', option.getAttribute('value'));
          }
          if (option.textContent) {
            item.setAttribute('data-label', option.textContent);
          }
          item.addEventListener('click', function () {
            _this2.selectItem(item, true);
          });
          item.addEventListener('keydown', function (event) {
            switch (event.keyCode) {
              // Allows the "Enter" key to select an item
              case _keyboard2.default.keys.ENTER:
                _this2.selectItem(item, true);
                event.preventDefault();
                break;

              // Allows the "Escape" key to close the picker
              case _keyboard2.default.keys.ESCAPE:
                _this2.escape();
                event.preventDefault();
                break;
            }
          });

          return item;
        }
      }, {
        key: 'buildLabel',
        value: function buildLabel() {
          var label = document.createElement('span');
          label.classList.add('ql-picker-label');
          label.innerHTML = _dropdown2.default;
          label.tabIndex = '0';
          label.setAttribute('role', 'button');
          label.setAttribute('aria-expanded', 'false');
          this.container.appendChild(label);
          return label;
        }
      }, {
        key: 'buildOptions',
        value: function buildOptions() {
          var _this3 = this;

          var options = document.createElement('span');
          options.classList.add('ql-picker-options');

          // Don't want screen readers to read this until options are visible
          options.setAttribute('aria-hidden', 'true');
          options.tabIndex = '-1';

          // Need a unique id for aria-controls
          options.id = 'ql-picker-options-' + optionsCounter;
          optionsCounter += 1;
          this.label.setAttribute('aria-controls', options.id);

          this.options = options;

          [].slice.call(this.select.options).forEach(function (option) {
            var item = _this3.buildItem(option);
            options.appendChild(item);
            if (option.selected === true) {
              _this3.selectItem(item);
            }
          });
          this.container.appendChild(options);
        }
      }, {
        key: 'buildPicker',
        value: function buildPicker() {
          var _this4 = this;

          [].slice.call(this.select.attributes).forEach(function (item) {
            _this4.container.setAttribute(item.name, item.value);
          });
          this.container.classList.add('ql-picker');
          this.label = this.buildLabel();
          this.buildOptions();
        }
      }, {
        key: 'escape',
        value: function escape() {
          var _this5 = this;

          // Close menu and return focus to trigger label
          this.close();
          // Need setTimeout for accessibility to ensure that the browser executes
          // focus on the next process thread and after any DOM content changes
          setTimeout(function () {
            return _this5.label.focus();
          }, 1);
        }
      }, {
        key: 'close',
        value: function close() {
          this.container.classList.remove('ql-expanded');
          this.label.setAttribute('aria-expanded', 'false');
          this.options.setAttribute('aria-hidden', 'true');
        }
      }, {
        key: 'selectItem',
        value: function selectItem(item) {
          var trigger = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

          var selected = this.container.querySelector('.ql-selected');
          if (item === selected) return;
          if (selected != null) {
            selected.classList.remove('ql-selected');
          }
          if (item == null) return;
          item.classList.add('ql-selected');
          this.select.selectedIndex = [].indexOf.call(item.parentNode.children, item);
          if (item.hasAttribute('data-value')) {
            this.label.setAttribute('data-value', item.getAttribute('data-value'));
          } else {
            this.label.removeAttribute('data-value');
          }
          if (item.hasAttribute('data-label')) {
            this.label.setAttribute('data-label', item.getAttribute('data-label'));
          } else {
            this.label.removeAttribute('data-label');
          }
          if (trigger) {
            if (typeof Event === 'function') {
              this.select.dispatchEvent(new Event('change'));
            } else if ((typeof Event === 'undefined' ? 'undefined' : _typeof(Event)) === 'object') {
              // IE11
              var event = document.createEvent('Event');
              event.initEvent('change', true, true);
              this.select.dispatchEvent(event);
            }
            this.close();
          }
        }
      }, {
        key: 'update',
        value: function update() {
          var option = void 0;
          if (this.select.selectedIndex > -1) {
            var item = this.container.querySelector('.ql-picker-options').children[this.select.selectedIndex];
            option = this.select.options[this.select.selectedIndex];
            this.selectItem(item);
          } else {
            this.selectItem(null);
          }
          var isActive = option != null && option !== this.select.querySelector('option[selected]');
          this.label.classList.toggle('ql-active', isActive);
        }
      }]);

      return Picker;
    }();

    exports.default = Picker;

    /***/ }),
    /* 29 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    var _break = __webpack_require__(16);

    var _break2 = _interopRequireDefault(_break);

    var _container = __webpack_require__(25);

    var _container2 = _interopRequireDefault(_container);

    var _cursor = __webpack_require__(24);

    var _cursor2 = _interopRequireDefault(_cursor);

    var _embed = __webpack_require__(35);

    var _embed2 = _interopRequireDefault(_embed);

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    var _scroll = __webpack_require__(22);

    var _scroll2 = _interopRequireDefault(_scroll);

    var _text = __webpack_require__(7);

    var _text2 = _interopRequireDefault(_text);

    var _clipboard = __webpack_require__(55);

    var _clipboard2 = _interopRequireDefault(_clipboard);

    var _history = __webpack_require__(42);

    var _history2 = _interopRequireDefault(_history);

    var _keyboard = __webpack_require__(23);

    var _keyboard2 = _interopRequireDefault(_keyboard);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    _quill2.default.register({
      'blots/block': _block2.default,
      'blots/block/embed': _block.BlockEmbed,
      'blots/break': _break2.default,
      'blots/container': _container2.default,
      'blots/cursor': _cursor2.default,
      'blots/embed': _embed2.default,
      'blots/inline': _inline2.default,
      'blots/scroll': _scroll2.default,
      'blots/text': _text2.default,

      'modules/clipboard': _clipboard2.default,
      'modules/history': _history2.default,
      'modules/keyboard': _keyboard2.default
    });

    _parchment2.default.register(_block2.default, _break2.default, _cursor2.default, _inline2.default, _scroll2.default, _text2.default);

    exports.default = _quill2.default;

    /***/ }),
    /* 30 */
    /***/ (function(module, exports, __webpack_require__) {

    Object.defineProperty(exports, "__esModule", { value: true });
    var Registry = __webpack_require__(1);
    var ShadowBlot = /** @class */ (function () {
        function ShadowBlot(domNode) {
            this.domNode = domNode;
            // @ts-ignore
            this.domNode[Registry.DATA_KEY] = { blot: this };
        }
        Object.defineProperty(ShadowBlot.prototype, "statics", {
            // Hack for accessing inherited static methods
            get: function () {
                return this.constructor;
            },
            enumerable: true,
            configurable: true
        });
        ShadowBlot.create = function (value) {
            if (this.tagName == null) {
                throw new Registry.ParchmentError('Blot definition missing tagName');
            }
            var node;
            if (Array.isArray(this.tagName)) {
                if (typeof value === 'string') {
                    value = value.toUpperCase();
                    if (parseInt(value).toString() === value) {
                        value = parseInt(value);
                    }
                }
                if (typeof value === 'number') {
                    node = document.createElement(this.tagName[value - 1]);
                }
                else if (this.tagName.indexOf(value) > -1) {
                    node = document.createElement(value);
                }
                else {
                    node = document.createElement(this.tagName[0]);
                }
            }
            else {
                node = document.createElement(this.tagName);
            }
            if (this.className) {
                node.classList.add(this.className);
            }
            return node;
        };
        ShadowBlot.prototype.attach = function () {
            if (this.parent != null) {
                this.scroll = this.parent.scroll;
            }
        };
        ShadowBlot.prototype.clone = function () {
            var domNode = this.domNode.cloneNode(false);
            return Registry.create(domNode);
        };
        ShadowBlot.prototype.detach = function () {
            if (this.parent != null)
                this.parent.removeChild(this);
            // @ts-ignore
            delete this.domNode[Registry.DATA_KEY];
        };
        ShadowBlot.prototype.deleteAt = function (index, length) {
            var blot = this.isolate(index, length);
            blot.remove();
        };
        ShadowBlot.prototype.formatAt = function (index, length, name, value) {
            var blot = this.isolate(index, length);
            if (Registry.query(name, Registry.Scope.BLOT) != null && value) {
                blot.wrap(name, value);
            }
            else if (Registry.query(name, Registry.Scope.ATTRIBUTE) != null) {
                var parent = Registry.create(this.statics.scope);
                blot.wrap(parent);
                parent.format(name, value);
            }
        };
        ShadowBlot.prototype.insertAt = function (index, value, def) {
            var blot = def == null ? Registry.create('text', value) : Registry.create(value, def);
            var ref = this.split(index);
            this.parent.insertBefore(blot, ref);
        };
        ShadowBlot.prototype.insertInto = function (parentBlot, refBlot) {
            if (refBlot === void 0) { refBlot = null; }
            if (this.parent != null) {
                this.parent.children.remove(this);
            }
            var refDomNode = null;
            parentBlot.children.insertBefore(this, refBlot);
            if (refBlot != null) {
                refDomNode = refBlot.domNode;
            }
            if (this.domNode.parentNode != parentBlot.domNode ||
                this.domNode.nextSibling != refDomNode) {
                parentBlot.domNode.insertBefore(this.domNode, refDomNode);
            }
            this.parent = parentBlot;
            this.attach();
        };
        ShadowBlot.prototype.isolate = function (index, length) {
            var target = this.split(index);
            target.split(length);
            return target;
        };
        ShadowBlot.prototype.length = function () {
            return 1;
        };
        ShadowBlot.prototype.offset = function (root) {
            if (root === void 0) { root = this.parent; }
            if (this.parent == null || this == root)
                return 0;
            return this.parent.children.offset(this) + this.parent.offset(root);
        };
        ShadowBlot.prototype.optimize = function (context) {
            // TODO clean up once we use WeakMap
            // @ts-ignore
            if (this.domNode[Registry.DATA_KEY] != null) {
                // @ts-ignore
                delete this.domNode[Registry.DATA_KEY].mutations;
            }
        };
        ShadowBlot.prototype.remove = function () {
            if (this.domNode.parentNode != null) {
                this.domNode.parentNode.removeChild(this.domNode);
            }
            this.detach();
        };
        ShadowBlot.prototype.replace = function (target) {
            if (target.parent == null)
                return;
            target.parent.insertBefore(this, target.next);
            target.remove();
        };
        ShadowBlot.prototype.replaceWith = function (name, value) {
            var replacement = typeof name === 'string' ? Registry.create(name, value) : name;
            replacement.replace(this);
            return replacement;
        };
        ShadowBlot.prototype.split = function (index, force) {
            return index === 0 ? this : this.next;
        };
        ShadowBlot.prototype.update = function (mutations, context) {
            // Nothing to do by default
        };
        ShadowBlot.prototype.wrap = function (name, value) {
            var wrapper = typeof name === 'string' ? Registry.create(name, value) : name;
            if (this.parent != null) {
                this.parent.insertBefore(wrapper, this.next);
            }
            wrapper.appendChild(this);
            return wrapper;
        };
        ShadowBlot.blotName = 'abstract';
        return ShadowBlot;
    }());
    exports.default = ShadowBlot;


    /***/ }),
    /* 31 */
    /***/ (function(module, exports, __webpack_require__) {

    Object.defineProperty(exports, "__esModule", { value: true });
    var attributor_1 = __webpack_require__(12);
    var class_1 = __webpack_require__(32);
    var style_1 = __webpack_require__(33);
    var Registry = __webpack_require__(1);
    var AttributorStore = /** @class */ (function () {
        function AttributorStore(domNode) {
            this.attributes = {};
            this.domNode = domNode;
            this.build();
        }
        AttributorStore.prototype.attribute = function (attribute, value) {
            // verb
            if (value) {
                if (attribute.add(this.domNode, value)) {
                    if (attribute.value(this.domNode) != null) {
                        this.attributes[attribute.attrName] = attribute;
                    }
                    else {
                        delete this.attributes[attribute.attrName];
                    }
                }
            }
            else {
                attribute.remove(this.domNode);
                delete this.attributes[attribute.attrName];
            }
        };
        AttributorStore.prototype.build = function () {
            var _this = this;
            this.attributes = {};
            var attributes = attributor_1.default.keys(this.domNode);
            var classes = class_1.default.keys(this.domNode);
            var styles = style_1.default.keys(this.domNode);
            attributes
                .concat(classes)
                .concat(styles)
                .forEach(function (name) {
                var attr = Registry.query(name, Registry.Scope.ATTRIBUTE);
                if (attr instanceof attributor_1.default) {
                    _this.attributes[attr.attrName] = attr;
                }
            });
        };
        AttributorStore.prototype.copy = function (target) {
            var _this = this;
            Object.keys(this.attributes).forEach(function (key) {
                var value = _this.attributes[key].value(_this.domNode);
                target.format(key, value);
            });
        };
        AttributorStore.prototype.move = function (target) {
            var _this = this;
            this.copy(target);
            Object.keys(this.attributes).forEach(function (key) {
                _this.attributes[key].remove(_this.domNode);
            });
            this.attributes = {};
        };
        AttributorStore.prototype.values = function () {
            var _this = this;
            return Object.keys(this.attributes).reduce(function (attributes, name) {
                attributes[name] = _this.attributes[name].value(_this.domNode);
                return attributes;
            }, {});
        };
        return AttributorStore;
    }());
    exports.default = AttributorStore;


    /***/ }),
    /* 32 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var attributor_1 = __webpack_require__(12);
    function match(node, prefix) {
        var className = node.getAttribute('class') || '';
        return className.split(/\s+/).filter(function (name) {
            return name.indexOf(prefix + "-") === 0;
        });
    }
    var ClassAttributor = /** @class */ (function (_super) {
        __extends(ClassAttributor, _super);
        function ClassAttributor() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ClassAttributor.keys = function (node) {
            return (node.getAttribute('class') || '').split(/\s+/).map(function (name) {
                return name
                    .split('-')
                    .slice(0, -1)
                    .join('-');
            });
        };
        ClassAttributor.prototype.add = function (node, value) {
            if (!this.canAdd(node, value))
                return false;
            this.remove(node);
            node.classList.add(this.keyName + "-" + value);
            return true;
        };
        ClassAttributor.prototype.remove = function (node) {
            var matches = match(node, this.keyName);
            matches.forEach(function (name) {
                node.classList.remove(name);
            });
            if (node.classList.length === 0) {
                node.removeAttribute('class');
            }
        };
        ClassAttributor.prototype.value = function (node) {
            var result = match(node, this.keyName)[0] || '';
            var value = result.slice(this.keyName.length + 1); // +1 for hyphen
            return this.canAdd(node, value) ? value : '';
        };
        return ClassAttributor;
    }(attributor_1.default));
    exports.default = ClassAttributor;


    /***/ }),
    /* 33 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var attributor_1 = __webpack_require__(12);
    function camelize(name) {
        var parts = name.split('-');
        var rest = parts
            .slice(1)
            .map(function (part) {
            return part[0].toUpperCase() + part.slice(1);
        })
            .join('');
        return parts[0] + rest;
    }
    var StyleAttributor = /** @class */ (function (_super) {
        __extends(StyleAttributor, _super);
        function StyleAttributor() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        StyleAttributor.keys = function (node) {
            return (node.getAttribute('style') || '').split(';').map(function (value) {
                var arr = value.split(':');
                return arr[0].trim();
            });
        };
        StyleAttributor.prototype.add = function (node, value) {
            if (!this.canAdd(node, value))
                return false;
            // @ts-ignore
            node.style[camelize(this.keyName)] = value;
            return true;
        };
        StyleAttributor.prototype.remove = function (node) {
            // @ts-ignore
            node.style[camelize(this.keyName)] = '';
            if (!node.getAttribute('style')) {
                node.removeAttribute('style');
            }
        };
        StyleAttributor.prototype.value = function (node) {
            // @ts-ignore
            var value = node.style[camelize(this.keyName)];
            return this.canAdd(node, value) ? value : '';
        };
        return StyleAttributor;
    }(attributor_1.default));
    exports.default = StyleAttributor;


    /***/ }),
    /* 34 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Theme = function () {
      function Theme(quill, options) {
        _classCallCheck(this, Theme);

        this.quill = quill;
        this.options = options;
        this.modules = {};
      }

      _createClass(Theme, [{
        key: 'init',
        value: function init() {
          var _this = this;

          Object.keys(this.options.modules).forEach(function (name) {
            if (_this.modules[name] == null) {
              _this.addModule(name);
            }
          });
        }
      }, {
        key: 'addModule',
        value: function addModule(name) {
          var moduleClass = this.quill.constructor.import('modules/' + name);
          this.modules[name] = new moduleClass(this.quill, this.options.modules[name] || {});
          return this.modules[name];
        }
      }]);

      return Theme;
    }();

    Theme.DEFAULTS = {
      modules: {}
    };
    Theme.themes = {
      'default': Theme
    };

    exports.default = Theme;

    /***/ }),
    /* 35 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _text = __webpack_require__(7);

    var _text2 = _interopRequireDefault(_text);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var GUARD_TEXT = '\uFEFF';

    var Embed = function (_Parchment$Embed) {
      _inherits(Embed, _Parchment$Embed);

      function Embed(node) {
        _classCallCheck(this, Embed);

        var _this = _possibleConstructorReturn(this, (Embed.__proto__ || Object.getPrototypeOf(Embed)).call(this, node));

        _this.contentNode = document.createElement('span');
        _this.contentNode.setAttribute('contenteditable', false);
        [].slice.call(_this.domNode.childNodes).forEach(function (childNode) {
          _this.contentNode.appendChild(childNode);
        });
        _this.leftGuard = document.createTextNode(GUARD_TEXT);
        _this.rightGuard = document.createTextNode(GUARD_TEXT);
        _this.domNode.appendChild(_this.leftGuard);
        _this.domNode.appendChild(_this.contentNode);
        _this.domNode.appendChild(_this.rightGuard);
        return _this;
      }

      _createClass(Embed, [{
        key: 'index',
        value: function index(node, offset) {
          if (node === this.leftGuard) return 0;
          if (node === this.rightGuard) return 1;
          return _get(Embed.prototype.__proto__ || Object.getPrototypeOf(Embed.prototype), 'index', this).call(this, node, offset);
        }
      }, {
        key: 'restore',
        value: function restore(node) {
          var range = void 0,
              textNode = void 0;
          var text = node.data.split(GUARD_TEXT).join('');
          if (node === this.leftGuard) {
            if (this.prev instanceof _text2.default) {
              var prevLength = this.prev.length();
              this.prev.insertAt(prevLength, text);
              range = {
                startNode: this.prev.domNode,
                startOffset: prevLength + text.length
              };
            } else {
              textNode = document.createTextNode(text);
              this.parent.insertBefore(_parchment2.default.create(textNode), this);
              range = {
                startNode: textNode,
                startOffset: text.length
              };
            }
          } else if (node === this.rightGuard) {
            if (this.next instanceof _text2.default) {
              this.next.insertAt(0, text);
              range = {
                startNode: this.next.domNode,
                startOffset: text.length
              };
            } else {
              textNode = document.createTextNode(text);
              this.parent.insertBefore(_parchment2.default.create(textNode), this.next);
              range = {
                startNode: textNode,
                startOffset: text.length
              };
            }
          }
          node.data = GUARD_TEXT;
          return range;
        }
      }, {
        key: 'update',
        value: function update(mutations, context) {
          var _this2 = this;

          mutations.forEach(function (mutation) {
            if (mutation.type === 'characterData' && (mutation.target === _this2.leftGuard || mutation.target === _this2.rightGuard)) {
              var range = _this2.restore(mutation.target);
              if (range) context.range = range;
            }
          });
        }
      }]);

      return Embed;
    }(_parchment2.default.Embed);

    exports.default = Embed;

    /***/ }),
    /* 36 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.AlignStyle = exports.AlignClass = exports.AlignAttribute = undefined;

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var config = {
      scope: _parchment2.default.Scope.BLOCK,
      whitelist: ['right', 'center', 'justify']
    };

    var AlignAttribute = new _parchment2.default.Attributor.Attribute('align', 'align', config);
    var AlignClass = new _parchment2.default.Attributor.Class('align', 'ql-align', config);
    var AlignStyle = new _parchment2.default.Attributor.Style('align', 'text-align', config);

    exports.AlignAttribute = AlignAttribute;
    exports.AlignClass = AlignClass;
    exports.AlignStyle = AlignStyle;

    /***/ }),
    /* 37 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.BackgroundStyle = exports.BackgroundClass = undefined;

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _color = __webpack_require__(26);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var BackgroundClass = new _parchment2.default.Attributor.Class('background', 'ql-bg', {
      scope: _parchment2.default.Scope.INLINE
    });
    var BackgroundStyle = new _color.ColorAttributor('background', 'background-color', {
      scope: _parchment2.default.Scope.INLINE
    });

    exports.BackgroundClass = BackgroundClass;
    exports.BackgroundStyle = BackgroundStyle;

    /***/ }),
    /* 38 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.DirectionStyle = exports.DirectionClass = exports.DirectionAttribute = undefined;

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var config = {
      scope: _parchment2.default.Scope.BLOCK,
      whitelist: ['rtl']
    };

    var DirectionAttribute = new _parchment2.default.Attributor.Attribute('direction', 'dir', config);
    var DirectionClass = new _parchment2.default.Attributor.Class('direction', 'ql-direction', config);
    var DirectionStyle = new _parchment2.default.Attributor.Style('direction', 'direction', config);

    exports.DirectionAttribute = DirectionAttribute;
    exports.DirectionClass = DirectionClass;
    exports.DirectionStyle = DirectionStyle;

    /***/ }),
    /* 39 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.FontClass = exports.FontStyle = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var config = {
      scope: _parchment2.default.Scope.INLINE,
      whitelist: ['serif', 'monospace']
    };

    var FontClass = new _parchment2.default.Attributor.Class('font', 'ql-font', config);

    var FontStyleAttributor = function (_Parchment$Attributor) {
      _inherits(FontStyleAttributor, _Parchment$Attributor);

      function FontStyleAttributor() {
        _classCallCheck(this, FontStyleAttributor);

        return _possibleConstructorReturn(this, (FontStyleAttributor.__proto__ || Object.getPrototypeOf(FontStyleAttributor)).apply(this, arguments));
      }

      _createClass(FontStyleAttributor, [{
        key: 'value',
        value: function value(node) {
          return _get(FontStyleAttributor.prototype.__proto__ || Object.getPrototypeOf(FontStyleAttributor.prototype), 'value', this).call(this, node).replace(/["']/g, '');
        }
      }]);

      return FontStyleAttributor;
    }(_parchment2.default.Attributor.Style);

    var FontStyle = new FontStyleAttributor('font', 'font-family', config);

    exports.FontStyle = FontStyle;
    exports.FontClass = FontClass;

    /***/ }),
    /* 40 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SizeStyle = exports.SizeClass = undefined;

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var SizeClass = new _parchment2.default.Attributor.Class('size', 'ql-size', {
      scope: _parchment2.default.Scope.INLINE,
      whitelist: ['small', 'large', 'huge']
    });
    var SizeStyle = new _parchment2.default.Attributor.Style('size', 'font-size', {
      scope: _parchment2.default.Scope.INLINE,
      whitelist: ['10px', '18px', '32px']
    });

    exports.SizeClass = SizeClass;
    exports.SizeStyle = SizeStyle;

    /***/ }),
    /* 41 */
    /***/ (function(module, exports, __webpack_require__) {


    module.exports = {
      'align': {
        '': __webpack_require__(76),
        'center': __webpack_require__(77),
        'right': __webpack_require__(78),
        'justify': __webpack_require__(79)
      },
      'background': __webpack_require__(80),
      'blockquote': __webpack_require__(81),
      'bold': __webpack_require__(82),
      'clean': __webpack_require__(83),
      'code': __webpack_require__(58),
      'code-block': __webpack_require__(58),
      'color': __webpack_require__(84),
      'direction': {
        '': __webpack_require__(85),
        'rtl': __webpack_require__(86)
      },
      'float': {
        'center': __webpack_require__(87),
        'full': __webpack_require__(88),
        'left': __webpack_require__(89),
        'right': __webpack_require__(90)
      },
      'formula': __webpack_require__(91),
      'header': {
        '1': __webpack_require__(92),
        '2': __webpack_require__(93)
      },
      'italic': __webpack_require__(94),
      'image': __webpack_require__(95),
      'indent': {
        '+1': __webpack_require__(96),
        '-1': __webpack_require__(97)
      },
      'link': __webpack_require__(98),
      'list': {
        'ordered': __webpack_require__(99),
        'bullet': __webpack_require__(100),
        'check': __webpack_require__(101)
      },
      'script': {
        'sub': __webpack_require__(102),
        'super': __webpack_require__(103)
      },
      'strike': __webpack_require__(104),
      'underline': __webpack_require__(105),
      'video': __webpack_require__(106)
    };

    /***/ }),
    /* 42 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.getLastChangeIndex = exports.default = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var History = function (_Module) {
      _inherits(History, _Module);

      function History(quill, options) {
        _classCallCheck(this, History);

        var _this = _possibleConstructorReturn(this, (History.__proto__ || Object.getPrototypeOf(History)).call(this, quill, options));

        _this.lastRecorded = 0;
        _this.ignoreChange = false;
        _this.clear();
        _this.quill.on(_quill2.default.events.EDITOR_CHANGE, function (eventName, delta, oldDelta, source) {
          if (eventName !== _quill2.default.events.TEXT_CHANGE || _this.ignoreChange) return;
          if (!_this.options.userOnly || source === _quill2.default.sources.USER) {
            _this.record(delta, oldDelta);
          } else {
            _this.transform(delta);
          }
        });
        _this.quill.keyboard.addBinding({ key: 'Z', shortKey: true }, _this.undo.bind(_this));
        _this.quill.keyboard.addBinding({ key: 'Z', shortKey: true, shiftKey: true }, _this.redo.bind(_this));
        if (/Win/i.test(navigator.platform)) {
          _this.quill.keyboard.addBinding({ key: 'Y', shortKey: true }, _this.redo.bind(_this));
        }
        return _this;
      }

      _createClass(History, [{
        key: 'change',
        value: function change(source, dest) {
          if (this.stack[source].length === 0) return;
          var delta = this.stack[source].pop();
          this.stack[dest].push(delta);
          this.lastRecorded = 0;
          this.ignoreChange = true;
          this.quill.updateContents(delta[source], _quill2.default.sources.USER);
          this.ignoreChange = false;
          var index = getLastChangeIndex(delta[source]);
          this.quill.setSelection(index);
        }
      }, {
        key: 'clear',
        value: function clear() {
          this.stack = { undo: [], redo: [] };
        }
      }, {
        key: 'cutoff',
        value: function cutoff() {
          this.lastRecorded = 0;
        }
      }, {
        key: 'record',
        value: function record(changeDelta, oldDelta) {
          if (changeDelta.ops.length === 0) return;
          this.stack.redo = [];
          var undoDelta = this.quill.getContents().diff(oldDelta);
          var timestamp = Date.now();
          if (this.lastRecorded + this.options.delay > timestamp && this.stack.undo.length > 0) {
            var delta = this.stack.undo.pop();
            undoDelta = undoDelta.compose(delta.undo);
            changeDelta = delta.redo.compose(changeDelta);
          } else {
            this.lastRecorded = timestamp;
          }
          this.stack.undo.push({
            redo: changeDelta,
            undo: undoDelta
          });
          if (this.stack.undo.length > this.options.maxStack) {
            this.stack.undo.shift();
          }
        }
      }, {
        key: 'redo',
        value: function redo() {
          this.change('redo', 'undo');
        }
      }, {
        key: 'transform',
        value: function transform(delta) {
          this.stack.undo.forEach(function (change) {
            change.undo = delta.transform(change.undo, true);
            change.redo = delta.transform(change.redo, true);
          });
          this.stack.redo.forEach(function (change) {
            change.undo = delta.transform(change.undo, true);
            change.redo = delta.transform(change.redo, true);
          });
        }
      }, {
        key: 'undo',
        value: function undo() {
          this.change('undo', 'redo');
        }
      }]);

      return History;
    }(_module2.default);

    History.DEFAULTS = {
      delay: 1000,
      maxStack: 100,
      userOnly: false
    };

    function endsWithNewlineChange(delta) {
      var lastOp = delta.ops[delta.ops.length - 1];
      if (lastOp == null) return false;
      if (lastOp.insert != null) {
        return typeof lastOp.insert === 'string' && lastOp.insert.endsWith('\n');
      }
      if (lastOp.attributes != null) {
        return Object.keys(lastOp.attributes).some(function (attr) {
          return _parchment2.default.query(attr, _parchment2.default.Scope.BLOCK) != null;
        });
      }
      return false;
    }

    function getLastChangeIndex(delta) {
      var deleteLength = delta.reduce(function (length, op) {
        length += op.delete || 0;
        return length;
      }, 0);
      var changeIndex = delta.length() - deleteLength;
      if (endsWithNewlineChange(delta)) {
        changeIndex -= 1;
      }
      return changeIndex;
    }

    exports.default = History;
    exports.getLastChangeIndex = getLastChangeIndex;

    /***/ }),
    /* 43 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.BaseTooltip = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _emitter = __webpack_require__(8);

    var _emitter2 = _interopRequireDefault(_emitter);

    var _keyboard = __webpack_require__(23);

    var _keyboard2 = _interopRequireDefault(_keyboard);

    var _theme = __webpack_require__(34);

    var _theme2 = _interopRequireDefault(_theme);

    var _colorPicker = __webpack_require__(59);

    var _colorPicker2 = _interopRequireDefault(_colorPicker);

    var _iconPicker = __webpack_require__(60);

    var _iconPicker2 = _interopRequireDefault(_iconPicker);

    var _picker = __webpack_require__(28);

    var _picker2 = _interopRequireDefault(_picker);

    var _tooltip = __webpack_require__(61);

    var _tooltip2 = _interopRequireDefault(_tooltip);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ALIGNS = [false, 'center', 'right', 'justify'];

    var COLORS = ["#000000", "#e60000", "#ff9900", "#ffff00", "#008a00", "#0066cc", "#9933ff", "#ffffff", "#facccc", "#ffebcc", "#ffffcc", "#cce8cc", "#cce0f5", "#ebd6ff", "#bbbbbb", "#f06666", "#ffc266", "#ffff66", "#66b966", "#66a3e0", "#c285ff", "#888888", "#a10000", "#b26b00", "#b2b200", "#006100", "#0047b2", "#6b24b2", "#444444", "#5c0000", "#663d00", "#666600", "#003700", "#002966", "#3d1466"];

    var FONTS = [false, 'serif', 'monospace'];

    var HEADERS = ['1', '2', '3', false];

    var SIZES = ['small', false, 'large', 'huge'];

    var BaseTheme = function (_Theme) {
      _inherits(BaseTheme, _Theme);

      function BaseTheme(quill, options) {
        _classCallCheck(this, BaseTheme);

        var _this = _possibleConstructorReturn(this, (BaseTheme.__proto__ || Object.getPrototypeOf(BaseTheme)).call(this, quill, options));

        var listener = function listener(e) {
          if (!document.body.contains(quill.root)) {
            return document.body.removeEventListener('click', listener);
          }
          if (_this.tooltip != null && !_this.tooltip.root.contains(e.target) && document.activeElement !== _this.tooltip.textbox && !_this.quill.hasFocus()) {
            _this.tooltip.hide();
          }
          if (_this.pickers != null) {
            _this.pickers.forEach(function (picker) {
              if (!picker.container.contains(e.target)) {
                picker.close();
              }
            });
          }
        };
        quill.emitter.listenDOM('click', document.body, listener);
        return _this;
      }

      _createClass(BaseTheme, [{
        key: 'addModule',
        value: function addModule(name) {
          var module = _get(BaseTheme.prototype.__proto__ || Object.getPrototypeOf(BaseTheme.prototype), 'addModule', this).call(this, name);
          if (name === 'toolbar') {
            this.extendToolbar(module);
          }
          return module;
        }
      }, {
        key: 'buildButtons',
        value: function buildButtons(buttons, icons) {
          buttons.forEach(function (button) {
            var className = button.getAttribute('class') || '';
            className.split(/\s+/).forEach(function (name) {
              if (!name.startsWith('ql-')) return;
              name = name.slice('ql-'.length);
              if (icons[name] == null) return;
              if (name === 'direction') {
                button.innerHTML = icons[name][''] + icons[name]['rtl'];
              } else if (typeof icons[name] === 'string') {
                button.innerHTML = icons[name];
              } else {
                var value = button.value || '';
                if (value != null && icons[name][value]) {
                  button.innerHTML = icons[name][value];
                }
              }
            });
          });
        }
      }, {
        key: 'buildPickers',
        value: function buildPickers(selects, icons) {
          var _this2 = this;

          this.pickers = selects.map(function (select) {
            if (select.classList.contains('ql-align')) {
              if (select.querySelector('option') == null) {
                fillSelect(select, ALIGNS);
              }
              return new _iconPicker2.default(select, icons.align);
            } else if (select.classList.contains('ql-background') || select.classList.contains('ql-color')) {
              var format = select.classList.contains('ql-background') ? 'background' : 'color';
              if (select.querySelector('option') == null) {
                fillSelect(select, COLORS, format === 'background' ? '#ffffff' : '#000000');
              }
              return new _colorPicker2.default(select, icons[format]);
            } else {
              if (select.querySelector('option') == null) {
                if (select.classList.contains('ql-font')) {
                  fillSelect(select, FONTS);
                } else if (select.classList.contains('ql-header')) {
                  fillSelect(select, HEADERS);
                } else if (select.classList.contains('ql-size')) {
                  fillSelect(select, SIZES);
                }
              }
              return new _picker2.default(select);
            }
          });
          var update = function update() {
            _this2.pickers.forEach(function (picker) {
              picker.update();
            });
          };
          this.quill.on(_emitter2.default.events.EDITOR_CHANGE, update);
        }
      }]);

      return BaseTheme;
    }(_theme2.default);

    BaseTheme.DEFAULTS = (0, _extend2.default)(true, {}, _theme2.default.DEFAULTS, {
      modules: {
        toolbar: {
          handlers: {
            formula: function formula() {
              this.quill.theme.tooltip.edit('formula');
            },
            image: function image() {
              var _this3 = this;

              var fileInput = this.container.querySelector('input.ql-image[type=file]');
              if (fileInput == null) {
                fileInput = document.createElement('input');
                fileInput.setAttribute('type', 'file');
                fileInput.setAttribute('accept', 'image/png, image/gif, image/jpeg, image/bmp, image/x-icon');
                fileInput.classList.add('ql-image');
                fileInput.addEventListener('change', function () {
                  if (fileInput.files != null && fileInput.files[0] != null) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                      var range = _this3.quill.getSelection(true);
                      _this3.quill.updateContents(new _quillDelta2.default().retain(range.index).delete(range.length).insert({ image: e.target.result }), _emitter2.default.sources.USER);
                      _this3.quill.setSelection(range.index + 1, _emitter2.default.sources.SILENT);
                      fileInput.value = "";
                    };
                    reader.readAsDataURL(fileInput.files[0]);
                  }
                });
                this.container.appendChild(fileInput);
              }
              fileInput.click();
            },
            video: function video() {
              this.quill.theme.tooltip.edit('video');
            }
          }
        }
      }
    });

    var BaseTooltip = function (_Tooltip) {
      _inherits(BaseTooltip, _Tooltip);

      function BaseTooltip(quill, boundsContainer) {
        _classCallCheck(this, BaseTooltip);

        var _this4 = _possibleConstructorReturn(this, (BaseTooltip.__proto__ || Object.getPrototypeOf(BaseTooltip)).call(this, quill, boundsContainer));

        _this4.textbox = _this4.root.querySelector('input[type="text"]');
        _this4.listen();
        return _this4;
      }

      _createClass(BaseTooltip, [{
        key: 'listen',
        value: function listen() {
          var _this5 = this;

          this.textbox.addEventListener('keydown', function (event) {
            if (_keyboard2.default.match(event, 'enter')) {
              _this5.save();
              event.preventDefault();
            } else if (_keyboard2.default.match(event, 'escape')) {
              _this5.cancel();
              event.preventDefault();
            }
          });
        }
      }, {
        key: 'cancel',
        value: function cancel() {
          this.hide();
        }
      }, {
        key: 'edit',
        value: function edit() {
          var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'link';
          var preview = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

          this.root.classList.remove('ql-hidden');
          this.root.classList.add('ql-editing');
          if (preview != null) {
            this.textbox.value = preview;
          } else if (mode !== this.root.getAttribute('data-mode')) {
            this.textbox.value = '';
          }
          this.position(this.quill.getBounds(this.quill.selection.savedRange));
          this.textbox.select();
          this.textbox.setAttribute('placeholder', this.textbox.getAttribute('data-' + mode) || '');
          this.root.setAttribute('data-mode', mode);
        }
      }, {
        key: 'restoreFocus',
        value: function restoreFocus() {
          var scrollTop = this.quill.scrollingContainer.scrollTop;
          this.quill.focus();
          this.quill.scrollingContainer.scrollTop = scrollTop;
        }
      }, {
        key: 'save',
        value: function save() {
          var value = this.textbox.value;
          switch (this.root.getAttribute('data-mode')) {
            case 'link':
              {
                var scrollTop = this.quill.root.scrollTop;
                if (this.linkRange) {
                  this.quill.formatText(this.linkRange, 'link', value, _emitter2.default.sources.USER);
                  delete this.linkRange;
                } else {
                  this.restoreFocus();
                  this.quill.format('link', value, _emitter2.default.sources.USER);
                }
                this.quill.root.scrollTop = scrollTop;
                break;
              }
            case 'video':
              {
                value = extractVideoUrl(value);
              } // eslint-disable-next-line no-fallthrough
            case 'formula':
              {
                if (!value) break;
                var range = this.quill.getSelection(true);
                if (range != null) {
                  var index = range.index + range.length;
                  this.quill.insertEmbed(index, this.root.getAttribute('data-mode'), value, _emitter2.default.sources.USER);
                  if (this.root.getAttribute('data-mode') === 'formula') {
                    this.quill.insertText(index + 1, ' ', _emitter2.default.sources.USER);
                  }
                  this.quill.setSelection(index + 2, _emitter2.default.sources.USER);
                }
                break;
              }
          }
          this.textbox.value = '';
          this.hide();
        }
      }]);

      return BaseTooltip;
    }(_tooltip2.default);

    function extractVideoUrl(url) {
      var match = url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/) || url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (match) {
        return (match[1] || 'https') + '://www.youtube.com/embed/' + match[2] + '?showinfo=0';
      }
      if (match = url.match(/^(?:(https?):\/\/)?(?:www\.)?vimeo\.com\/(\d+)/)) {
        // eslint-disable-line no-cond-assign
        return (match[1] || 'https') + '://player.vimeo.com/video/' + match[2] + '/';
      }
      return url;
    }

    function fillSelect(select, values) {
      var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      values.forEach(function (value) {
        var option = document.createElement('option');
        if (value === defaultValue) {
          option.setAttribute('selected', 'selected');
        } else {
          option.setAttribute('value', value);
        }
        select.appendChild(option);
      });
    }

    exports.BaseTooltip = BaseTooltip;
    exports.default = BaseTheme;

    /***/ }),
    /* 44 */
    /***/ (function(module, exports, __webpack_require__) {

    Object.defineProperty(exports, "__esModule", { value: true });
    var LinkedList = /** @class */ (function () {
        function LinkedList() {
            this.head = this.tail = null;
            this.length = 0;
        }
        LinkedList.prototype.append = function () {
            var nodes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                nodes[_i] = arguments[_i];
            }
            this.insertBefore(nodes[0], null);
            if (nodes.length > 1) {
                this.append.apply(this, nodes.slice(1));
            }
        };
        LinkedList.prototype.contains = function (node) {
            var cur, next = this.iterator();
            while ((cur = next())) {
                if (cur === node)
                    return true;
            }
            return false;
        };
        LinkedList.prototype.insertBefore = function (node, refNode) {
            if (!node)
                return;
            node.next = refNode;
            if (refNode != null) {
                node.prev = refNode.prev;
                if (refNode.prev != null) {
                    refNode.prev.next = node;
                }
                refNode.prev = node;
                if (refNode === this.head) {
                    this.head = node;
                }
            }
            else if (this.tail != null) {
                this.tail.next = node;
                node.prev = this.tail;
                this.tail = node;
            }
            else {
                node.prev = null;
                this.head = this.tail = node;
            }
            this.length += 1;
        };
        LinkedList.prototype.offset = function (target) {
            var index = 0, cur = this.head;
            while (cur != null) {
                if (cur === target)
                    return index;
                index += cur.length();
                cur = cur.next;
            }
            return -1;
        };
        LinkedList.prototype.remove = function (node) {
            if (!this.contains(node))
                return;
            if (node.prev != null)
                node.prev.next = node.next;
            if (node.next != null)
                node.next.prev = node.prev;
            if (node === this.head)
                this.head = node.next;
            if (node === this.tail)
                this.tail = node.prev;
            this.length -= 1;
        };
        LinkedList.prototype.iterator = function (curNode) {
            if (curNode === void 0) { curNode = this.head; }
            // TODO use yield when we can
            return function () {
                var ret = curNode;
                if (curNode != null)
                    curNode = curNode.next;
                return ret;
            };
        };
        LinkedList.prototype.find = function (index, inclusive) {
            if (inclusive === void 0) { inclusive = false; }
            var cur, next = this.iterator();
            while ((cur = next())) {
                var length = cur.length();
                if (index < length ||
                    (inclusive && index === length && (cur.next == null || cur.next.length() !== 0))) {
                    return [cur, index];
                }
                index -= length;
            }
            return [null, 0];
        };
        LinkedList.prototype.forEach = function (callback) {
            var cur, next = this.iterator();
            while ((cur = next())) {
                callback(cur);
            }
        };
        LinkedList.prototype.forEachAt = function (index, length, callback) {
            if (length <= 0)
                return;
            var _a = this.find(index), startNode = _a[0], offset = _a[1];
            var cur, curIndex = index - offset, next = this.iterator(startNode);
            while ((cur = next()) && curIndex < index + length) {
                var curLength = cur.length();
                if (index > curIndex) {
                    callback(cur, index - curIndex, Math.min(length, curIndex + curLength - index));
                }
                else {
                    callback(cur, 0, Math.min(curLength, index + length - curIndex));
                }
                curIndex += curLength;
            }
        };
        LinkedList.prototype.map = function (callback) {
            return this.reduce(function (memo, cur) {
                memo.push(callback(cur));
                return memo;
            }, []);
        };
        LinkedList.prototype.reduce = function (callback, memo) {
            var cur, next = this.iterator();
            while ((cur = next())) {
                memo = callback(memo, cur);
            }
            return memo;
        };
        return LinkedList;
    }());
    exports.default = LinkedList;


    /***/ }),
    /* 45 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var container_1 = __webpack_require__(17);
    var Registry = __webpack_require__(1);
    var OBSERVER_CONFIG = {
        attributes: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true,
    };
    var MAX_OPTIMIZE_ITERATIONS = 100;
    var ScrollBlot = /** @class */ (function (_super) {
        __extends(ScrollBlot, _super);
        function ScrollBlot(node) {
            var _this = _super.call(this, node) || this;
            _this.scroll = _this;
            _this.observer = new MutationObserver(function (mutations) {
                _this.update(mutations);
            });
            _this.observer.observe(_this.domNode, OBSERVER_CONFIG);
            _this.attach();
            return _this;
        }
        ScrollBlot.prototype.detach = function () {
            _super.prototype.detach.call(this);
            this.observer.disconnect();
        };
        ScrollBlot.prototype.deleteAt = function (index, length) {
            this.update();
            if (index === 0 && length === this.length()) {
                this.children.forEach(function (child) {
                    child.remove();
                });
            }
            else {
                _super.prototype.deleteAt.call(this, index, length);
            }
        };
        ScrollBlot.prototype.formatAt = function (index, length, name, value) {
            this.update();
            _super.prototype.formatAt.call(this, index, length, name, value);
        };
        ScrollBlot.prototype.insertAt = function (index, value, def) {
            this.update();
            _super.prototype.insertAt.call(this, index, value, def);
        };
        ScrollBlot.prototype.optimize = function (mutations, context) {
            var _this = this;
            if (mutations === void 0) { mutations = []; }
            if (context === void 0) { context = {}; }
            _super.prototype.optimize.call(this, context);
            // We must modify mutations directly, cannot make copy and then modify
            var records = [].slice.call(this.observer.takeRecords());
            // Array.push currently seems to be implemented by a non-tail recursive function
            // so we cannot just mutations.push.apply(mutations, this.observer.takeRecords());
            while (records.length > 0)
                mutations.push(records.pop());
            // TODO use WeakMap
            var mark = function (blot, markParent) {
                if (markParent === void 0) { markParent = true; }
                if (blot == null || blot === _this)
                    return;
                if (blot.domNode.parentNode == null)
                    return;
                // @ts-ignore
                if (blot.domNode[Registry.DATA_KEY].mutations == null) {
                    // @ts-ignore
                    blot.domNode[Registry.DATA_KEY].mutations = [];
                }
                if (markParent)
                    mark(blot.parent);
            };
            var optimize = function (blot) {
                // Post-order traversal
                if (
                // @ts-ignore
                blot.domNode[Registry.DATA_KEY] == null ||
                    // @ts-ignore
                    blot.domNode[Registry.DATA_KEY].mutations == null) {
                    return;
                }
                if (blot instanceof container_1.default) {
                    blot.children.forEach(optimize);
                }
                blot.optimize(context);
            };
            var remaining = mutations;
            for (var i = 0; remaining.length > 0; i += 1) {
                if (i >= MAX_OPTIMIZE_ITERATIONS) {
                    throw new Error('[Parchment] Maximum optimize iterations reached');
                }
                remaining.forEach(function (mutation) {
                    var blot = Registry.find(mutation.target, true);
                    if (blot == null)
                        return;
                    if (blot.domNode === mutation.target) {
                        if (mutation.type === 'childList') {
                            mark(Registry.find(mutation.previousSibling, false));
                            [].forEach.call(mutation.addedNodes, function (node) {
                                var child = Registry.find(node, false);
                                mark(child, false);
                                if (child instanceof container_1.default) {
                                    child.children.forEach(function (grandChild) {
                                        mark(grandChild, false);
                                    });
                                }
                            });
                        }
                        else if (mutation.type === 'attributes') {
                            mark(blot.prev);
                        }
                    }
                    mark(blot);
                });
                this.children.forEach(optimize);
                remaining = [].slice.call(this.observer.takeRecords());
                records = remaining.slice();
                while (records.length > 0)
                    mutations.push(records.pop());
            }
        };
        ScrollBlot.prototype.update = function (mutations, context) {
            var _this = this;
            if (context === void 0) { context = {}; }
            mutations = mutations || this.observer.takeRecords();
            // TODO use WeakMap
            mutations
                .map(function (mutation) {
                var blot = Registry.find(mutation.target, true);
                if (blot == null)
                    return null;
                // @ts-ignore
                if (blot.domNode[Registry.DATA_KEY].mutations == null) {
                    // @ts-ignore
                    blot.domNode[Registry.DATA_KEY].mutations = [mutation];
                    return blot;
                }
                else {
                    // @ts-ignore
                    blot.domNode[Registry.DATA_KEY].mutations.push(mutation);
                    return null;
                }
            })
                .forEach(function (blot) {
                if (blot == null ||
                    blot === _this ||
                    //@ts-ignore
                    blot.domNode[Registry.DATA_KEY] == null)
                    return;
                // @ts-ignore
                blot.update(blot.domNode[Registry.DATA_KEY].mutations || [], context);
            });
            // @ts-ignore
            if (this.domNode[Registry.DATA_KEY].mutations != null) {
                // @ts-ignore
                _super.prototype.update.call(this, this.domNode[Registry.DATA_KEY].mutations, context);
            }
            this.optimize(mutations, context);
        };
        ScrollBlot.blotName = 'scroll';
        ScrollBlot.defaultChild = 'block';
        ScrollBlot.scope = Registry.Scope.BLOCK_BLOT;
        ScrollBlot.tagName = 'DIV';
        return ScrollBlot;
    }(container_1.default));
    exports.default = ScrollBlot;


    /***/ }),
    /* 46 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var format_1 = __webpack_require__(18);
    var Registry = __webpack_require__(1);
    // Shallow object comparison
    function isEqual(obj1, obj2) {
        if (Object.keys(obj1).length !== Object.keys(obj2).length)
            return false;
        // @ts-ignore
        for (var prop in obj1) {
            // @ts-ignore
            if (obj1[prop] !== obj2[prop])
                return false;
        }
        return true;
    }
    var InlineBlot = /** @class */ (function (_super) {
        __extends(InlineBlot, _super);
        function InlineBlot() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        InlineBlot.formats = function (domNode) {
            if (domNode.tagName === InlineBlot.tagName)
                return undefined;
            return _super.formats.call(this, domNode);
        };
        InlineBlot.prototype.format = function (name, value) {
            var _this = this;
            if (name === this.statics.blotName && !value) {
                this.children.forEach(function (child) {
                    if (!(child instanceof format_1.default)) {
                        child = child.wrap(InlineBlot.blotName, true);
                    }
                    _this.attributes.copy(child);
                });
                this.unwrap();
            }
            else {
                _super.prototype.format.call(this, name, value);
            }
        };
        InlineBlot.prototype.formatAt = function (index, length, name, value) {
            if (this.formats()[name] != null || Registry.query(name, Registry.Scope.ATTRIBUTE)) {
                var blot = this.isolate(index, length);
                blot.format(name, value);
            }
            else {
                _super.prototype.formatAt.call(this, index, length, name, value);
            }
        };
        InlineBlot.prototype.optimize = function (context) {
            _super.prototype.optimize.call(this, context);
            var formats = this.formats();
            if (Object.keys(formats).length === 0) {
                return this.unwrap(); // unformatted span
            }
            var next = this.next;
            if (next instanceof InlineBlot && next.prev === this && isEqual(formats, next.formats())) {
                next.moveChildren(this);
                next.remove();
            }
        };
        InlineBlot.blotName = 'inline';
        InlineBlot.scope = Registry.Scope.INLINE_BLOT;
        InlineBlot.tagName = 'SPAN';
        return InlineBlot;
    }(format_1.default));
    exports.default = InlineBlot;


    /***/ }),
    /* 47 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var format_1 = __webpack_require__(18);
    var Registry = __webpack_require__(1);
    var BlockBlot = /** @class */ (function (_super) {
        __extends(BlockBlot, _super);
        function BlockBlot() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        BlockBlot.formats = function (domNode) {
            var tagName = Registry.query(BlockBlot.blotName).tagName;
            if (domNode.tagName === tagName)
                return undefined;
            return _super.formats.call(this, domNode);
        };
        BlockBlot.prototype.format = function (name, value) {
            if (Registry.query(name, Registry.Scope.BLOCK) == null) {
                return;
            }
            else if (name === this.statics.blotName && !value) {
                this.replaceWith(BlockBlot.blotName);
            }
            else {
                _super.prototype.format.call(this, name, value);
            }
        };
        BlockBlot.prototype.formatAt = function (index, length, name, value) {
            if (Registry.query(name, Registry.Scope.BLOCK) != null) {
                this.format(name, value);
            }
            else {
                _super.prototype.formatAt.call(this, index, length, name, value);
            }
        };
        BlockBlot.prototype.insertAt = function (index, value, def) {
            if (def == null || Registry.query(value, Registry.Scope.INLINE) != null) {
                // Insert text or inline
                _super.prototype.insertAt.call(this, index, value, def);
            }
            else {
                var after = this.split(index);
                var blot = Registry.create(value, def);
                after.parent.insertBefore(blot, after);
            }
        };
        BlockBlot.prototype.update = function (mutations, context) {
            if (navigator.userAgent.match(/Trident/)) {
                this.build();
            }
            else {
                _super.prototype.update.call(this, mutations, context);
            }
        };
        BlockBlot.blotName = 'block';
        BlockBlot.scope = Registry.Scope.BLOCK_BLOT;
        BlockBlot.tagName = 'P';
        return BlockBlot;
    }(format_1.default));
    exports.default = BlockBlot;


    /***/ }),
    /* 48 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var leaf_1 = __webpack_require__(19);
    var EmbedBlot = /** @class */ (function (_super) {
        __extends(EmbedBlot, _super);
        function EmbedBlot() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EmbedBlot.formats = function (domNode) {
            return undefined;
        };
        EmbedBlot.prototype.format = function (name, value) {
            // super.formatAt wraps, which is what we want in general,
            // but this allows subclasses to overwrite for formats
            // that just apply to particular embeds
            _super.prototype.formatAt.call(this, 0, this.length(), name, value);
        };
        EmbedBlot.prototype.formatAt = function (index, length, name, value) {
            if (index === 0 && length === this.length()) {
                this.format(name, value);
            }
            else {
                _super.prototype.formatAt.call(this, index, length, name, value);
            }
        };
        EmbedBlot.prototype.formats = function () {
            return this.statics.formats(this.domNode);
        };
        return EmbedBlot;
    }(leaf_1.default));
    exports.default = EmbedBlot;


    /***/ }),
    /* 49 */
    /***/ (function(module, exports, __webpack_require__) {

    var __extends = (this && this.__extends) || (function () {
        var extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    var leaf_1 = __webpack_require__(19);
    var Registry = __webpack_require__(1);
    var TextBlot = /** @class */ (function (_super) {
        __extends(TextBlot, _super);
        function TextBlot(node) {
            var _this = _super.call(this, node) || this;
            _this.text = _this.statics.value(_this.domNode);
            return _this;
        }
        TextBlot.create = function (value) {
            return document.createTextNode(value);
        };
        TextBlot.value = function (domNode) {
            var text = domNode.data;
            // @ts-ignore
            if (text['normalize'])
                text = text['normalize']();
            return text;
        };
        TextBlot.prototype.deleteAt = function (index, length) {
            this.domNode.data = this.text = this.text.slice(0, index) + this.text.slice(index + length);
        };
        TextBlot.prototype.index = function (node, offset) {
            if (this.domNode === node) {
                return offset;
            }
            return -1;
        };
        TextBlot.prototype.insertAt = function (index, value, def) {
            if (def == null) {
                this.text = this.text.slice(0, index) + value + this.text.slice(index);
                this.domNode.data = this.text;
            }
            else {
                _super.prototype.insertAt.call(this, index, value, def);
            }
        };
        TextBlot.prototype.length = function () {
            return this.text.length;
        };
        TextBlot.prototype.optimize = function (context) {
            _super.prototype.optimize.call(this, context);
            this.text = this.statics.value(this.domNode);
            if (this.text.length === 0) {
                this.remove();
            }
            else if (this.next instanceof TextBlot && this.next.prev === this) {
                this.insertAt(this.length(), this.next.value());
                this.next.remove();
            }
        };
        TextBlot.prototype.position = function (index, inclusive) {
            return [this.domNode, index];
        };
        TextBlot.prototype.split = function (index, force) {
            if (force === void 0) { force = false; }
            if (!force) {
                if (index === 0)
                    return this;
                if (index === this.length())
                    return this.next;
            }
            var after = Registry.create(this.domNode.splitText(index));
            this.parent.insertBefore(after, this.next);
            this.text = this.statics.value(this.domNode);
            return after;
        };
        TextBlot.prototype.update = function (mutations, context) {
            var _this = this;
            if (mutations.some(function (mutation) {
                return mutation.type === 'characterData' && mutation.target === _this.domNode;
            })) {
                this.text = this.statics.value(this.domNode);
            }
        };
        TextBlot.prototype.value = function () {
            return this.text;
        };
        TextBlot.blotName = 'text';
        TextBlot.scope = Registry.Scope.INLINE_BLOT;
        return TextBlot;
    }(leaf_1.default));
    exports.default = TextBlot;


    /***/ }),
    /* 50 */
    /***/ (function(module, exports, __webpack_require__) {


    var elem = document.createElement('div');
    elem.classList.toggle('test-class', false);
    if (elem.classList.contains('test-class')) {
      var _toggle = DOMTokenList.prototype.toggle;
      DOMTokenList.prototype.toggle = function (token, force) {
        if (arguments.length > 1 && !this.contains(token) === !force) {
          return force;
        } else {
          return _toggle.call(this, token);
        }
      };
    }

    if (!String.prototype.startsWith) {
      String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
      };
    }

    if (!String.prototype.endsWith) {
      String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
          position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
      };
    }

    if (!Array.prototype.find) {
      Object.defineProperty(Array.prototype, "find", {
        value: function value(predicate) {
          if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
          }
          if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
          }
          var list = Object(this);
          var length = list.length >>> 0;
          var thisArg = arguments[1];
          var value;

          for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
              return value;
            }
          }
          return undefined;
        }
      });
    }

    document.addEventListener("DOMContentLoaded", function () {
      // Disable resizing in Firefox
      document.execCommand("enableObjectResizing", false, false);
      // Disable automatic linkifying in IE11
      document.execCommand("autoUrlDetect", false, false);
    });

    /***/ }),
    /* 51 */
    /***/ (function(module, exports) {

    /**
     * This library modifies the diff-patch-match library by Neil Fraser
     * by removing the patch and match functionality and certain advanced
     * options in the diff function. The original license is as follows:
     *
     * ===
     *
     * Diff Match and Patch
     *
     * Copyright 2006 Google Inc.
     * http://code.google.com/p/google-diff-match-patch/
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */


    /**
     * The data structure representing a diff is an array of tuples:
     * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
     * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
     */
    var DIFF_DELETE = -1;
    var DIFF_INSERT = 1;
    var DIFF_EQUAL = 0;


    /**
     * Find the differences between two texts.  Simplifies the problem by stripping
     * any common prefix or suffix off the texts before diffing.
     * @param {string} text1 Old string to be diffed.
     * @param {string} text2 New string to be diffed.
     * @param {Int} cursor_pos Expected edit position in text1 (optional)
     * @return {Array} Array of diff tuples.
     */
    function diff_main(text1, text2, cursor_pos) {
      // Check for equality (speedup).
      if (text1 == text2) {
        if (text1) {
          return [[DIFF_EQUAL, text1]];
        }
        return [];
      }

      // Check cursor_pos within bounds
      if (cursor_pos < 0 || text1.length < cursor_pos) {
        cursor_pos = null;
      }

      // Trim off common prefix (speedup).
      var commonlength = diff_commonPrefix(text1, text2);
      var commonprefix = text1.substring(0, commonlength);
      text1 = text1.substring(commonlength);
      text2 = text2.substring(commonlength);

      // Trim off common suffix (speedup).
      commonlength = diff_commonSuffix(text1, text2);
      var commonsuffix = text1.substring(text1.length - commonlength);
      text1 = text1.substring(0, text1.length - commonlength);
      text2 = text2.substring(0, text2.length - commonlength);

      // Compute the diff on the middle block.
      var diffs = diff_compute_(text1, text2);

      // Restore the prefix and suffix.
      if (commonprefix) {
        diffs.unshift([DIFF_EQUAL, commonprefix]);
      }
      if (commonsuffix) {
        diffs.push([DIFF_EQUAL, commonsuffix]);
      }
      diff_cleanupMerge(diffs);
      if (cursor_pos != null) {
        diffs = fix_cursor(diffs, cursor_pos);
      }
      diffs = fix_emoji(diffs);
      return diffs;
    }

    /**
     * Find the differences between two texts.  Assumes that the texts do not
     * have any common prefix or suffix.
     * @param {string} text1 Old string to be diffed.
     * @param {string} text2 New string to be diffed.
     * @return {Array} Array of diff tuples.
     */
    function diff_compute_(text1, text2) {
      var diffs;

      if (!text1) {
        // Just add some text (speedup).
        return [[DIFF_INSERT, text2]];
      }

      if (!text2) {
        // Just delete some text (speedup).
        return [[DIFF_DELETE, text1]];
      }

      var longtext = text1.length > text2.length ? text1 : text2;
      var shorttext = text1.length > text2.length ? text2 : text1;
      var i = longtext.indexOf(shorttext);
      if (i != -1) {
        // Shorter text is inside the longer text (speedup).
        diffs = [[DIFF_INSERT, longtext.substring(0, i)],
                 [DIFF_EQUAL, shorttext],
                 [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
        // Swap insertions for deletions if diff is reversed.
        if (text1.length > text2.length) {
          diffs[0][0] = diffs[2][0] = DIFF_DELETE;
        }
        return diffs;
      }

      if (shorttext.length == 1) {
        // Single character string.
        // After the previous speedup, the character can't be an equality.
        return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
      }

      // Check to see if the problem can be split in two.
      var hm = diff_halfMatch_(text1, text2);
      if (hm) {
        // A half-match was found, sort out the return data.
        var text1_a = hm[0];
        var text1_b = hm[1];
        var text2_a = hm[2];
        var text2_b = hm[3];
        var mid_common = hm[4];
        // Send both pairs off for separate processing.
        var diffs_a = diff_main(text1_a, text2_a);
        var diffs_b = diff_main(text1_b, text2_b);
        // Merge the results.
        return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
      }

      return diff_bisect_(text1, text2);
    }

    /**
     * Find the 'middle snake' of a diff, split the problem in two
     * and return the recursively constructed diff.
     * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
     * @param {string} text1 Old string to be diffed.
     * @param {string} text2 New string to be diffed.
     * @return {Array} Array of diff tuples.
     * @private
     */
    function diff_bisect_(text1, text2) {
      // Cache the text lengths to prevent multiple calls.
      var text1_length = text1.length;
      var text2_length = text2.length;
      var max_d = Math.ceil((text1_length + text2_length) / 2);
      var v_offset = max_d;
      var v_length = 2 * max_d;
      var v1 = new Array(v_length);
      var v2 = new Array(v_length);
      // Setting all elements to -1 is faster in Chrome & Firefox than mixing
      // integers and undefined.
      for (var x = 0; x < v_length; x++) {
        v1[x] = -1;
        v2[x] = -1;
      }
      v1[v_offset + 1] = 0;
      v2[v_offset + 1] = 0;
      var delta = text1_length - text2_length;
      // If the total number of characters is odd, then the front path will collide
      // with the reverse path.
      var front = (delta % 2 != 0);
      // Offsets for start and end of k loop.
      // Prevents mapping of space beyond the grid.
      var k1start = 0;
      var k1end = 0;
      var k2start = 0;
      var k2end = 0;
      for (var d = 0; d < max_d; d++) {
        // Walk the front path one step.
        for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
          var k1_offset = v_offset + k1;
          var x1;
          if (k1 == -d || (k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
            x1 = v1[k1_offset + 1];
          } else {
            x1 = v1[k1_offset - 1] + 1;
          }
          var y1 = x1 - k1;
          while (x1 < text1_length && y1 < text2_length &&
                 text1.charAt(x1) == text2.charAt(y1)) {
            x1++;
            y1++;
          }
          v1[k1_offset] = x1;
          if (x1 > text1_length) {
            // Ran off the right of the graph.
            k1end += 2;
          } else if (y1 > text2_length) {
            // Ran off the bottom of the graph.
            k1start += 2;
          } else if (front) {
            var k2_offset = v_offset + delta - k1;
            if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] != -1) {
              // Mirror x2 onto top-left coordinate system.
              var x2 = text1_length - v2[k2_offset];
              if (x1 >= x2) {
                // Overlap detected.
                return diff_bisectSplit_(text1, text2, x1, y1);
              }
            }
          }
        }

        // Walk the reverse path one step.
        for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
          var k2_offset = v_offset + k2;
          var x2;
          if (k2 == -d || (k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
            x2 = v2[k2_offset + 1];
          } else {
            x2 = v2[k2_offset - 1] + 1;
          }
          var y2 = x2 - k2;
          while (x2 < text1_length && y2 < text2_length &&
                 text1.charAt(text1_length - x2 - 1) ==
                 text2.charAt(text2_length - y2 - 1)) {
            x2++;
            y2++;
          }
          v2[k2_offset] = x2;
          if (x2 > text1_length) {
            // Ran off the left of the graph.
            k2end += 2;
          } else if (y2 > text2_length) {
            // Ran off the top of the graph.
            k2start += 2;
          } else if (!front) {
            var k1_offset = v_offset + delta - k2;
            if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] != -1) {
              var x1 = v1[k1_offset];
              var y1 = v_offset + x1 - k1_offset;
              // Mirror x2 onto top-left coordinate system.
              x2 = text1_length - x2;
              if (x1 >= x2) {
                // Overlap detected.
                return diff_bisectSplit_(text1, text2, x1, y1);
              }
            }
          }
        }
      }
      // Diff took too long and hit the deadline or
      // number of diffs equals number of characters, no commonality at all.
      return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
    }

    /**
     * Given the location of the 'middle snake', split the diff in two parts
     * and recurse.
     * @param {string} text1 Old string to be diffed.
     * @param {string} text2 New string to be diffed.
     * @param {number} x Index of split point in text1.
     * @param {number} y Index of split point in text2.
     * @return {Array} Array of diff tuples.
     */
    function diff_bisectSplit_(text1, text2, x, y) {
      var text1a = text1.substring(0, x);
      var text2a = text2.substring(0, y);
      var text1b = text1.substring(x);
      var text2b = text2.substring(y);

      // Compute both diffs serially.
      var diffs = diff_main(text1a, text2a);
      var diffsb = diff_main(text1b, text2b);

      return diffs.concat(diffsb);
    }

    /**
     * Determine the common prefix of two strings.
     * @param {string} text1 First string.
     * @param {string} text2 Second string.
     * @return {number} The number of characters common to the start of each
     *     string.
     */
    function diff_commonPrefix(text1, text2) {
      // Quick check for common null cases.
      if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
        return 0;
      }
      // Binary search.
      // Performance analysis: http://neil.fraser.name/news/2007/10/09/
      var pointermin = 0;
      var pointermax = Math.min(text1.length, text2.length);
      var pointermid = pointermax;
      var pointerstart = 0;
      while (pointermin < pointermid) {
        if (text1.substring(pointerstart, pointermid) ==
            text2.substring(pointerstart, pointermid)) {
          pointermin = pointermid;
          pointerstart = pointermin;
        } else {
          pointermax = pointermid;
        }
        pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
      }
      return pointermid;
    }

    /**
     * Determine the common suffix of two strings.
     * @param {string} text1 First string.
     * @param {string} text2 Second string.
     * @return {number} The number of characters common to the end of each string.
     */
    function diff_commonSuffix(text1, text2) {
      // Quick check for common null cases.
      if (!text1 || !text2 ||
          text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
        return 0;
      }
      // Binary search.
      // Performance analysis: http://neil.fraser.name/news/2007/10/09/
      var pointermin = 0;
      var pointermax = Math.min(text1.length, text2.length);
      var pointermid = pointermax;
      var pointerend = 0;
      while (pointermin < pointermid) {
        if (text1.substring(text1.length - pointermid, text1.length - pointerend) ==
            text2.substring(text2.length - pointermid, text2.length - pointerend)) {
          pointermin = pointermid;
          pointerend = pointermin;
        } else {
          pointermax = pointermid;
        }
        pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
      }
      return pointermid;
    }

    /**
     * Do the two texts share a substring which is at least half the length of the
     * longer text?
     * This speedup can produce non-minimal diffs.
     * @param {string} text1 First string.
     * @param {string} text2 Second string.
     * @return {Array.<string>} Five element Array, containing the prefix of
     *     text1, the suffix of text1, the prefix of text2, the suffix of
     *     text2 and the common middle.  Or null if there was no match.
     */
    function diff_halfMatch_(text1, text2) {
      var longtext = text1.length > text2.length ? text1 : text2;
      var shorttext = text1.length > text2.length ? text2 : text1;
      if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
        return null;  // Pointless.
      }

      /**
       * Does a substring of shorttext exist within longtext such that the substring
       * is at least half the length of longtext?
       * Closure, but does not reference any external variables.
       * @param {string} longtext Longer string.
       * @param {string} shorttext Shorter string.
       * @param {number} i Start index of quarter length substring within longtext.
       * @return {Array.<string>} Five element Array, containing the prefix of
       *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
       *     of shorttext and the common middle.  Or null if there was no match.
       * @private
       */
      function diff_halfMatchI_(longtext, shorttext, i) {
        // Start with a 1/4 length substring at position i as a seed.
        var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
        var j = -1;
        var best_common = '';
        var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
        while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
          var prefixLength = diff_commonPrefix(longtext.substring(i),
                                               shorttext.substring(j));
          var suffixLength = diff_commonSuffix(longtext.substring(0, i),
                                               shorttext.substring(0, j));
          if (best_common.length < suffixLength + prefixLength) {
            best_common = shorttext.substring(j - suffixLength, j) +
                shorttext.substring(j, j + prefixLength);
            best_longtext_a = longtext.substring(0, i - suffixLength);
            best_longtext_b = longtext.substring(i + prefixLength);
            best_shorttext_a = shorttext.substring(0, j - suffixLength);
            best_shorttext_b = shorttext.substring(j + prefixLength);
          }
        }
        if (best_common.length * 2 >= longtext.length) {
          return [best_longtext_a, best_longtext_b,
                  best_shorttext_a, best_shorttext_b, best_common];
        } else {
          return null;
        }
      }

      // First check if the second quarter is the seed for a half-match.
      var hm1 = diff_halfMatchI_(longtext, shorttext,
                                 Math.ceil(longtext.length / 4));
      // Check again based on the third quarter.
      var hm2 = diff_halfMatchI_(longtext, shorttext,
                                 Math.ceil(longtext.length / 2));
      var hm;
      if (!hm1 && !hm2) {
        return null;
      } else if (!hm2) {
        hm = hm1;
      } else if (!hm1) {
        hm = hm2;
      } else {
        // Both matched.  Select the longest.
        hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
      }

      // A half-match was found, sort out the return data.
      var text1_a, text1_b, text2_a, text2_b;
      if (text1.length > text2.length) {
        text1_a = hm[0];
        text1_b = hm[1];
        text2_a = hm[2];
        text2_b = hm[3];
      } else {
        text2_a = hm[0];
        text2_b = hm[1];
        text1_a = hm[2];
        text1_b = hm[3];
      }
      var mid_common = hm[4];
      return [text1_a, text1_b, text2_a, text2_b, mid_common];
    }

    /**
     * Reorder and merge like edit sections.  Merge equalities.
     * Any edit section can move as long as it doesn't cross an equality.
     * @param {Array} diffs Array of diff tuples.
     */
    function diff_cleanupMerge(diffs) {
      diffs.push([DIFF_EQUAL, '']);  // Add a dummy entry at the end.
      var pointer = 0;
      var count_delete = 0;
      var count_insert = 0;
      var text_delete = '';
      var text_insert = '';
      var commonlength;
      while (pointer < diffs.length) {
        switch (diffs[pointer][0]) {
          case DIFF_INSERT:
            count_insert++;
            text_insert += diffs[pointer][1];
            pointer++;
            break;
          case DIFF_DELETE:
            count_delete++;
            text_delete += diffs[pointer][1];
            pointer++;
            break;
          case DIFF_EQUAL:
            // Upon reaching an equality, check for prior redundancies.
            if (count_delete + count_insert > 1) {
              if (count_delete !== 0 && count_insert !== 0) {
                // Factor out any common prefixies.
                commonlength = diff_commonPrefix(text_insert, text_delete);
                if (commonlength !== 0) {
                  if ((pointer - count_delete - count_insert) > 0 &&
                      diffs[pointer - count_delete - count_insert - 1][0] ==
                      DIFF_EQUAL) {
                    diffs[pointer - count_delete - count_insert - 1][1] +=
                        text_insert.substring(0, commonlength);
                  } else {
                    diffs.splice(0, 0, [DIFF_EQUAL,
                                        text_insert.substring(0, commonlength)]);
                    pointer++;
                  }
                  text_insert = text_insert.substring(commonlength);
                  text_delete = text_delete.substring(commonlength);
                }
                // Factor out any common suffixies.
                commonlength = diff_commonSuffix(text_insert, text_delete);
                if (commonlength !== 0) {
                  diffs[pointer][1] = text_insert.substring(text_insert.length -
                      commonlength) + diffs[pointer][1];
                  text_insert = text_insert.substring(0, text_insert.length -
                      commonlength);
                  text_delete = text_delete.substring(0, text_delete.length -
                      commonlength);
                }
              }
              // Delete the offending records and add the merged ones.
              if (count_delete === 0) {
                diffs.splice(pointer - count_insert,
                    count_delete + count_insert, [DIFF_INSERT, text_insert]);
              } else if (count_insert === 0) {
                diffs.splice(pointer - count_delete,
                    count_delete + count_insert, [DIFF_DELETE, text_delete]);
              } else {
                diffs.splice(pointer - count_delete - count_insert,
                    count_delete + count_insert, [DIFF_DELETE, text_delete],
                    [DIFF_INSERT, text_insert]);
              }
              pointer = pointer - count_delete - count_insert +
                        (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
            } else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
              // Merge this equality with the previous one.
              diffs[pointer - 1][1] += diffs[pointer][1];
              diffs.splice(pointer, 1);
            } else {
              pointer++;
            }
            count_insert = 0;
            count_delete = 0;
            text_delete = '';
            text_insert = '';
            break;
        }
      }
      if (diffs[diffs.length - 1][1] === '') {
        diffs.pop();  // Remove the dummy entry at the end.
      }

      // Second pass: look for single edits surrounded on both sides by equalities
      // which can be shifted sideways to eliminate an equality.
      // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
      var changes = false;
      pointer = 1;
      // Intentionally ignore the first and last element (don't need checking).
      while (pointer < diffs.length - 1) {
        if (diffs[pointer - 1][0] == DIFF_EQUAL &&
            diffs[pointer + 1][0] == DIFF_EQUAL) {
          // This is a single edit surrounded by equalities.
          if (diffs[pointer][1].substring(diffs[pointer][1].length -
              diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
            // Shift the edit over the previous equality.
            diffs[pointer][1] = diffs[pointer - 1][1] +
                diffs[pointer][1].substring(0, diffs[pointer][1].length -
                                            diffs[pointer - 1][1].length);
            diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
            diffs.splice(pointer - 1, 1);
            changes = true;
          } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
              diffs[pointer + 1][1]) {
            // Shift the edit over the next equality.
            diffs[pointer - 1][1] += diffs[pointer + 1][1];
            diffs[pointer][1] =
                diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
                diffs[pointer + 1][1];
            diffs.splice(pointer + 1, 1);
            changes = true;
          }
        }
        pointer++;
      }
      // If shifts were made, the diff needs reordering and another shift sweep.
      if (changes) {
        diff_cleanupMerge(diffs);
      }
    }

    var diff = diff_main;
    diff.INSERT = DIFF_INSERT;
    diff.DELETE = DIFF_DELETE;
    diff.EQUAL = DIFF_EQUAL;

    module.exports = diff;

    /*
     * Modify a diff such that the cursor position points to the start of a change:
     * E.g.
     *   cursor_normalize_diff([[DIFF_EQUAL, 'abc']], 1)
     *     => [1, [[DIFF_EQUAL, 'a'], [DIFF_EQUAL, 'bc']]]
     *   cursor_normalize_diff([[DIFF_INSERT, 'new'], [DIFF_DELETE, 'xyz']], 2)
     *     => [2, [[DIFF_INSERT, 'new'], [DIFF_DELETE, 'xy'], [DIFF_DELETE, 'z']]]
     *
     * @param {Array} diffs Array of diff tuples
     * @param {Int} cursor_pos Suggested edit position. Must not be out of bounds!
     * @return {Array} A tuple [cursor location in the modified diff, modified diff]
     */
    function cursor_normalize_diff (diffs, cursor_pos) {
      if (cursor_pos === 0) {
        return [DIFF_EQUAL, diffs];
      }
      for (var current_pos = 0, i = 0; i < diffs.length; i++) {
        var d = diffs[i];
        if (d[0] === DIFF_DELETE || d[0] === DIFF_EQUAL) {
          var next_pos = current_pos + d[1].length;
          if (cursor_pos === next_pos) {
            return [i + 1, diffs];
          } else if (cursor_pos < next_pos) {
            // copy to prevent side effects
            diffs = diffs.slice();
            // split d into two diff changes
            var split_pos = cursor_pos - current_pos;
            var d_left = [d[0], d[1].slice(0, split_pos)];
            var d_right = [d[0], d[1].slice(split_pos)];
            diffs.splice(i, 1, d_left, d_right);
            return [i + 1, diffs];
          } else {
            current_pos = next_pos;
          }
        }
      }
      throw new Error('cursor_pos is out of bounds!')
    }

    /*
     * Modify a diff such that the edit position is "shifted" to the proposed edit location (cursor_position).
     *
     * Case 1)
     *   Check if a naive shift is possible:
     *     [0, X], [ 1, Y] -> [ 1, Y], [0, X]    (if X + Y === Y + X)
     *     [0, X], [-1, Y] -> [-1, Y], [0, X]    (if X + Y === Y + X) - holds same result
     * Case 2)
     *   Check if the following shifts are possible:
     *     [0, 'pre'], [ 1, 'prefix'] -> [ 1, 'pre'], [0, 'pre'], [ 1, 'fix']
     *     [0, 'pre'], [-1, 'prefix'] -> [-1, 'pre'], [0, 'pre'], [-1, 'fix']
     *         ^            ^
     *         d          d_next
     *
     * @param {Array} diffs Array of diff tuples
     * @param {Int} cursor_pos Suggested edit position. Must not be out of bounds!
     * @return {Array} Array of diff tuples
     */
    function fix_cursor (diffs, cursor_pos) {
      var norm = cursor_normalize_diff(diffs, cursor_pos);
      var ndiffs = norm[1];
      var cursor_pointer = norm[0];
      var d = ndiffs[cursor_pointer];
      var d_next = ndiffs[cursor_pointer + 1];

      if (d == null) {
        // Text was deleted from end of original string,
        // cursor is now out of bounds in new string
        return diffs;
      } else if (d[0] !== DIFF_EQUAL) {
        // A modification happened at the cursor location.
        // This is the expected outcome, so we can return the original diff.
        return diffs;
      } else {
        if (d_next != null && d[1] + d_next[1] === d_next[1] + d[1]) {
          // Case 1)
          // It is possible to perform a naive shift
          ndiffs.splice(cursor_pointer, 2, d_next, d);
          return merge_tuples(ndiffs, cursor_pointer, 2)
        } else if (d_next != null && d_next[1].indexOf(d[1]) === 0) {
          // Case 2)
          // d[1] is a prefix of d_next[1]
          // We can assume that d_next[0] !== 0, since d[0] === 0
          // Shift edit locations..
          ndiffs.splice(cursor_pointer, 2, [d_next[0], d[1]], [0, d[1]]);
          var suffix = d_next[1].slice(d[1].length);
          if (suffix.length > 0) {
            ndiffs.splice(cursor_pointer + 2, 0, [d_next[0], suffix]);
          }
          return merge_tuples(ndiffs, cursor_pointer, 3)
        } else {
          // Not possible to perform any modification
          return diffs;
        }
      }
    }

    /*
     * Check diff did not split surrogate pairs.
     * Ex. [0, '\uD83D'], [-1, '\uDC36'], [1, '\uDC2F'] -> [-1, '\uD83D\uDC36'], [1, '\uD83D\uDC2F']
     *     '\uD83D\uDC36' === '🐶', '\uD83D\uDC2F' === '🐯'
     *
     * @param {Array} diffs Array of diff tuples
     * @return {Array} Array of diff tuples
     */
    function fix_emoji (diffs) {
      var compact = false;
      var starts_with_pair_end = function(str) {
        return str.charCodeAt(0) >= 0xDC00 && str.charCodeAt(0) <= 0xDFFF;
      };
      var ends_with_pair_start = function(str) {
        return str.charCodeAt(str.length-1) >= 0xD800 && str.charCodeAt(str.length-1) <= 0xDBFF;
      };
      for (var i = 2; i < diffs.length; i += 1) {
        if (diffs[i-2][0] === DIFF_EQUAL && ends_with_pair_start(diffs[i-2][1]) &&
            diffs[i-1][0] === DIFF_DELETE && starts_with_pair_end(diffs[i-1][1]) &&
            diffs[i][0] === DIFF_INSERT && starts_with_pair_end(diffs[i][1])) {
          compact = true;

          diffs[i-1][1] = diffs[i-2][1].slice(-1) + diffs[i-1][1];
          diffs[i][1] = diffs[i-2][1].slice(-1) + diffs[i][1];

          diffs[i-2][1] = diffs[i-2][1].slice(0, -1);
        }
      }
      if (!compact) {
        return diffs;
      }
      var fixed_diffs = [];
      for (var i = 0; i < diffs.length; i += 1) {
        if (diffs[i][1].length > 0) {
          fixed_diffs.push(diffs[i]);
        }
      }
      return fixed_diffs;
    }

    /*
     * Try to merge tuples with their neigbors in a given range.
     * E.g. [0, 'a'], [0, 'b'] -> [0, 'ab']
     *
     * @param {Array} diffs Array of diff tuples.
     * @param {Int} start Position of the first element to merge (diffs[start] is also merged with diffs[start - 1]).
     * @param {Int} length Number of consecutive elements to check.
     * @return {Array} Array of merged diff tuples.
     */
    function merge_tuples (diffs, start, length) {
      // Check from (start-1) to (start+length).
      for (var i = start + length - 1; i >= 0 && i >= start - 1; i--) {
        if (i + 1 < diffs.length) {
          var left_d = diffs[i];
          var right_d = diffs[i+1];
          if (left_d[0] === right_d[1]) {
            diffs.splice(i, 2, [left_d[0], left_d[1] + right_d[1]]);
          }
        }
      }
      return diffs;
    }


    /***/ }),
    /* 52 */
    /***/ (function(module, exports) {

    exports = module.exports = typeof Object.keys === 'function'
      ? Object.keys : shim;

    exports.shim = shim;
    function shim (obj) {
      var keys = [];
      for (var key in obj) keys.push(key);
      return keys;
    }


    /***/ }),
    /* 53 */
    /***/ (function(module, exports) {

    var supportsArgumentsClass = (function(){
      return Object.prototype.toString.call(arguments)
    })() == '[object Arguments]';

    exports = module.exports = supportsArgumentsClass ? supported : unsupported;

    exports.supported = supported;
    function supported(object) {
      return Object.prototype.toString.call(object) == '[object Arguments]';
    }
    exports.unsupported = unsupported;
    function unsupported(object){
      return object &&
        typeof object == 'object' &&
        typeof object.length == 'number' &&
        Object.prototype.hasOwnProperty.call(object, 'callee') &&
        !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
        false;
    }

    /***/ }),
    /* 54 */
    /***/ (function(module, exports) {

    var has = Object.prototype.hasOwnProperty
      , prefix = '~';

    /**
     * Constructor to create a storage for our `EE` objects.
     * An `Events` instance is a plain object whose properties are event names.
     *
     * @constructor
     * @api private
     */
    function Events() {}

    //
    // We try to not inherit from `Object.prototype`. In some engines creating an
    // instance in this way is faster than calling `Object.create(null)` directly.
    // If `Object.create(null)` is not supported we prefix the event names with a
    // character to make sure that the built-in object properties are not
    // overridden or used as an attack vector.
    //
    if (Object.create) {
      Events.prototype = Object.create(null);

      //
      // This hack is needed because the `__proto__` property is still inherited in
      // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
      //
      if (!new Events().__proto__) prefix = false;
    }

    /**
     * Representation of a single event listener.
     *
     * @param {Function} fn The listener function.
     * @param {Mixed} context The context to invoke the listener with.
     * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
     * @constructor
     * @api private
     */
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }

    /**
     * Minimal `EventEmitter` interface that is molded against the Node.js
     * `EventEmitter` interface.
     *
     * @constructor
     * @api public
     */
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }

    /**
     * Return an array listing the events for which the emitter has registered
     * listeners.
     *
     * @returns {Array}
     * @api public
     */
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = []
        , events
        , name;

      if (this._eventsCount === 0) return names;

      for (name in (events = this._events)) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }

      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }

      return names;
    };

    /**
     * Return the listeners registered for a given event.
     *
     * @param {String|Symbol} event The event name.
     * @param {Boolean} exists Only check if there are listeners.
     * @returns {Array|Boolean}
     * @api public
     */
    EventEmitter.prototype.listeners = function listeners(event, exists) {
      var evt = prefix ? prefix + event : event
        , available = this._events[evt];

      if (exists) return !!available;
      if (!available) return [];
      if (available.fn) return [available.fn];

      for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
        ee[i] = available[i].fn;
      }

      return ee;
    };

    /**
     * Calls each of the listeners registered for a given event.
     *
     * @param {String|Symbol} event The event name.
     * @returns {Boolean} `true` if the event had listeners, else `false`.
     * @api public
     */
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return false;

      var listeners = this._events[evt]
        , len = arguments.length
        , args
        , i;

      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

        switch (len) {
          case 1: return listeners.fn.call(listeners.context), true;
          case 2: return listeners.fn.call(listeners.context, a1), true;
          case 3: return listeners.fn.call(listeners.context, a1, a2), true;
          case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }

        for (i = 1, args = new Array(len -1); i < len; i++) {
          args[i - 1] = arguments[i];
        }

        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length
          , j;

        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

          switch (len) {
            case 1: listeners[i].fn.call(listeners[i].context); break;
            case 2: listeners[i].fn.call(listeners[i].context, a1); break;
            case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
            case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
            default:
              if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
                args[j - 1] = arguments[j];
              }

              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }

      return true;
    };

    /**
     * Add a listener for a given event.
     *
     * @param {String|Symbol} event The event name.
     * @param {Function} fn The listener function.
     * @param {Mixed} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @api public
     */
    EventEmitter.prototype.on = function on(event, fn, context) {
      var listener = new EE(fn, context || this)
        , evt = prefix ? prefix + event : event;

      if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
      else if (!this._events[evt].fn) this._events[evt].push(listener);
      else this._events[evt] = [this._events[evt], listener];

      return this;
    };

    /**
     * Add a one-time listener for a given event.
     *
     * @param {String|Symbol} event The event name.
     * @param {Function} fn The listener function.
     * @param {Mixed} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @api public
     */
    EventEmitter.prototype.once = function once(event, fn, context) {
      var listener = new EE(fn, context || this, true)
        , evt = prefix ? prefix + event : event;

      if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
      else if (!this._events[evt].fn) this._events[evt].push(listener);
      else this._events[evt] = [this._events[evt], listener];

      return this;
    };

    /**
     * Remove the listeners of a given event.
     *
     * @param {String|Symbol} event The event name.
     * @param {Function} fn Only remove the listeners that match this function.
     * @param {Mixed} context Only remove the listeners that have this context.
     * @param {Boolean} once Only remove one-time listeners.
     * @returns {EventEmitter} `this`.
     * @api public
     */
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return this;
      if (!fn) {
        if (--this._eventsCount === 0) this._events = new Events();
        else delete this._events[evt];
        return this;
      }

      var listeners = this._events[evt];

      if (listeners.fn) {
        if (
             listeners.fn === fn
          && (!once || listeners.once)
          && (!context || listeners.context === context)
        ) {
          if (--this._eventsCount === 0) this._events = new Events();
          else delete this._events[evt];
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (
               listeners[i].fn !== fn
            || (once && !listeners[i].once)
            || (context && listeners[i].context !== context)
          ) {
            events.push(listeners[i]);
          }
        }

        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else if (--this._eventsCount === 0) this._events = new Events();
        else delete this._events[evt];
      }

      return this;
    };

    /**
     * Remove all listeners, or those of the specified event.
     *
     * @param {String|Symbol} [event] The event name.
     * @returns {EventEmitter} `this`.
     * @api public
     */
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;

      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) {
          if (--this._eventsCount === 0) this._events = new Events();
          else delete this._events[evt];
        }
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }

      return this;
    };

    //
    // Alias methods names because people roll like that.
    //
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;

    //
    // This function doesn't apply anymore.
    //
    EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
      return this;
    };

    //
    // Expose the prefix.
    //
    EventEmitter.prefixed = prefix;

    //
    // Allow `EventEmitter` to be imported as module namespace.
    //
    EventEmitter.EventEmitter = EventEmitter;

    //
    // Expose the module.
    //
    if ('undefined' !== typeof module) {
      module.exports = EventEmitter;
    }


    /***/ }),
    /* 55 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.matchText = exports.matchSpacing = exports.matchNewline = exports.matchBlot = exports.matchAttributor = exports.default = undefined;

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _extend2 = __webpack_require__(3);

    var _extend3 = _interopRequireDefault(_extend2);

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _logger = __webpack_require__(10);

    var _logger2 = _interopRequireDefault(_logger);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    var _align = __webpack_require__(36);

    var _background = __webpack_require__(37);

    var _code = __webpack_require__(13);

    var _code2 = _interopRequireDefault(_code);

    var _color = __webpack_require__(26);

    var _direction = __webpack_require__(38);

    var _font = __webpack_require__(39);

    var _size = __webpack_require__(40);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var debug = (0, _logger2.default)('quill:clipboard');

    var DOM_KEY = '__ql-matcher';

    var CLIPBOARD_CONFIG = [[Node.TEXT_NODE, matchText], [Node.TEXT_NODE, matchNewline], ['br', matchBreak], [Node.ELEMENT_NODE, matchNewline], [Node.ELEMENT_NODE, matchBlot], [Node.ELEMENT_NODE, matchSpacing], [Node.ELEMENT_NODE, matchAttributor], [Node.ELEMENT_NODE, matchStyles], ['li', matchIndent], ['b', matchAlias.bind(matchAlias, 'bold')], ['i', matchAlias.bind(matchAlias, 'italic')], ['style', matchIgnore]];

    var ATTRIBUTE_ATTRIBUTORS = [_align.AlignAttribute, _direction.DirectionAttribute].reduce(function (memo, attr) {
      memo[attr.keyName] = attr;
      return memo;
    }, {});

    var STYLE_ATTRIBUTORS = [_align.AlignStyle, _background.BackgroundStyle, _color.ColorStyle, _direction.DirectionStyle, _font.FontStyle, _size.SizeStyle].reduce(function (memo, attr) {
      memo[attr.keyName] = attr;
      return memo;
    }, {});

    var Clipboard = function (_Module) {
      _inherits(Clipboard, _Module);

      function Clipboard(quill, options) {
        _classCallCheck(this, Clipboard);

        var _this = _possibleConstructorReturn(this, (Clipboard.__proto__ || Object.getPrototypeOf(Clipboard)).call(this, quill, options));

        _this.quill.root.addEventListener('paste', _this.onPaste.bind(_this));
        _this.container = _this.quill.addContainer('ql-clipboard');
        _this.container.setAttribute('contenteditable', true);
        _this.container.setAttribute('tabindex', -1);
        _this.matchers = [];
        CLIPBOARD_CONFIG.concat(_this.options.matchers).forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              selector = _ref2[0],
              matcher = _ref2[1];

          if (!options.matchVisual && matcher === matchSpacing) return;
          _this.addMatcher(selector, matcher);
        });
        return _this;
      }

      _createClass(Clipboard, [{
        key: 'addMatcher',
        value: function addMatcher(selector, matcher) {
          this.matchers.push([selector, matcher]);
        }
      }, {
        key: 'convert',
        value: function convert(html) {
          if (typeof html === 'string') {
            this.container.innerHTML = html.replace(/\>\r?\n +\</g, '><'); // Remove spaces between tags
            return this.convert();
          }
          var formats = this.quill.getFormat(this.quill.selection.savedRange.index);
          if (formats[_code2.default.blotName]) {
            var text = this.container.innerText;
            this.container.innerHTML = '';
            return new _quillDelta2.default().insert(text, _defineProperty({}, _code2.default.blotName, formats[_code2.default.blotName]));
          }

          var _prepareMatching = this.prepareMatching(),
              _prepareMatching2 = _slicedToArray(_prepareMatching, 2),
              elementMatchers = _prepareMatching2[0],
              textMatchers = _prepareMatching2[1];

          var delta = traverse(this.container, elementMatchers, textMatchers);
          // Remove trailing newline
          if (deltaEndsWith(delta, '\n') && delta.ops[delta.ops.length - 1].attributes == null) {
            delta = delta.compose(new _quillDelta2.default().retain(delta.length() - 1).delete(1));
          }
          debug.log('convert', this.container.innerHTML, delta);
          this.container.innerHTML = '';
          return delta;
        }
      }, {
        key: 'dangerouslyPasteHTML',
        value: function dangerouslyPasteHTML(index, html) {
          var source = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _quill2.default.sources.API;

          if (typeof index === 'string') {
            this.quill.setContents(this.convert(index), html);
            this.quill.setSelection(0, _quill2.default.sources.SILENT);
          } else {
            var paste = this.convert(html);
            this.quill.updateContents(new _quillDelta2.default().retain(index).concat(paste), source);
            this.quill.setSelection(index + paste.length(), _quill2.default.sources.SILENT);
          }
        }
      }, {
        key: 'onPaste',
        value: function onPaste(e) {
          var _this2 = this;

          if (e.defaultPrevented || !this.quill.isEnabled()) return;
          var range = this.quill.getSelection();
          var delta = new _quillDelta2.default().retain(range.index);
          var scrollTop = this.quill.scrollingContainer.scrollTop;
          this.container.focus();
          this.quill.selection.update(_quill2.default.sources.SILENT);
          setTimeout(function () {
            delta = delta.concat(_this2.convert()).delete(range.length);
            _this2.quill.updateContents(delta, _quill2.default.sources.USER);
            // range.length contributes to delta.length()
            _this2.quill.setSelection(delta.length() - range.length, _quill2.default.sources.SILENT);
            _this2.quill.scrollingContainer.scrollTop = scrollTop;
            _this2.quill.focus();
          }, 1);
        }
      }, {
        key: 'prepareMatching',
        value: function prepareMatching() {
          var _this3 = this;

          var elementMatchers = [],
              textMatchers = [];
          this.matchers.forEach(function (pair) {
            var _pair = _slicedToArray(pair, 2),
                selector = _pair[0],
                matcher = _pair[1];

            switch (selector) {
              case Node.TEXT_NODE:
                textMatchers.push(matcher);
                break;
              case Node.ELEMENT_NODE:
                elementMatchers.push(matcher);
                break;
              default:
                [].forEach.call(_this3.container.querySelectorAll(selector), function (node) {
                  // TODO use weakmap
                  node[DOM_KEY] = node[DOM_KEY] || [];
                  node[DOM_KEY].push(matcher);
                });
                break;
            }
          });
          return [elementMatchers, textMatchers];
        }
      }]);

      return Clipboard;
    }(_module2.default);

    Clipboard.DEFAULTS = {
      matchers: [],
      matchVisual: true
    };

    function applyFormat(delta, format, value) {
      if ((typeof format === 'undefined' ? 'undefined' : _typeof(format)) === 'object') {
        return Object.keys(format).reduce(function (delta, key) {
          return applyFormat(delta, key, format[key]);
        }, delta);
      } else {
        return delta.reduce(function (delta, op) {
          if (op.attributes && op.attributes[format]) {
            return delta.push(op);
          } else {
            return delta.insert(op.insert, (0, _extend3.default)({}, _defineProperty({}, format, value), op.attributes));
          }
        }, new _quillDelta2.default());
      }
    }

    function computeStyle(node) {
      if (node.nodeType !== Node.ELEMENT_NODE) return {};
      var DOM_KEY = '__ql-computed-style';
      return node[DOM_KEY] || (node[DOM_KEY] = window.getComputedStyle(node));
    }

    function deltaEndsWith(delta, text) {
      var endText = "";
      for (var i = delta.ops.length - 1; i >= 0 && endText.length < text.length; --i) {
        var op = delta.ops[i];
        if (typeof op.insert !== 'string') break;
        endText = op.insert + endText;
      }
      return endText.slice(-1 * text.length) === text;
    }

    function isLine(node) {
      if (node.childNodes.length === 0) return false; // Exclude embed blocks
      var style = computeStyle(node);
      return ['block', 'list-item'].indexOf(style.display) > -1;
    }

    function traverse(node, elementMatchers, textMatchers) {
      // Post-order
      if (node.nodeType === node.TEXT_NODE) {
        return textMatchers.reduce(function (delta, matcher) {
          return matcher(node, delta);
        }, new _quillDelta2.default());
      } else if (node.nodeType === node.ELEMENT_NODE) {
        return [].reduce.call(node.childNodes || [], function (delta, childNode) {
          var childrenDelta = traverse(childNode, elementMatchers, textMatchers);
          if (childNode.nodeType === node.ELEMENT_NODE) {
            childrenDelta = elementMatchers.reduce(function (childrenDelta, matcher) {
              return matcher(childNode, childrenDelta);
            }, childrenDelta);
            childrenDelta = (childNode[DOM_KEY] || []).reduce(function (childrenDelta, matcher) {
              return matcher(childNode, childrenDelta);
            }, childrenDelta);
          }
          return delta.concat(childrenDelta);
        }, new _quillDelta2.default());
      } else {
        return new _quillDelta2.default();
      }
    }

    function matchAlias(format, node, delta) {
      return applyFormat(delta, format, true);
    }

    function matchAttributor(node, delta) {
      var attributes = _parchment2.default.Attributor.Attribute.keys(node);
      var classes = _parchment2.default.Attributor.Class.keys(node);
      var styles = _parchment2.default.Attributor.Style.keys(node);
      var formats = {};
      attributes.concat(classes).concat(styles).forEach(function (name) {
        var attr = _parchment2.default.query(name, _parchment2.default.Scope.ATTRIBUTE);
        if (attr != null) {
          formats[attr.attrName] = attr.value(node);
          if (formats[attr.attrName]) return;
        }
        attr = ATTRIBUTE_ATTRIBUTORS[name];
        if (attr != null && (attr.attrName === name || attr.keyName === name)) {
          formats[attr.attrName] = attr.value(node) || undefined;
        }
        attr = STYLE_ATTRIBUTORS[name];
        if (attr != null && (attr.attrName === name || attr.keyName === name)) {
          attr = STYLE_ATTRIBUTORS[name];
          formats[attr.attrName] = attr.value(node) || undefined;
        }
      });
      if (Object.keys(formats).length > 0) {
        delta = applyFormat(delta, formats);
      }
      return delta;
    }

    function matchBlot(node, delta) {
      var match = _parchment2.default.query(node);
      if (match == null) return delta;
      if (match.prototype instanceof _parchment2.default.Embed) {
        var embed = {};
        var value = match.value(node);
        if (value != null) {
          embed[match.blotName] = value;
          delta = new _quillDelta2.default().insert(embed, match.formats(node));
        }
      } else if (typeof match.formats === 'function') {
        delta = applyFormat(delta, match.blotName, match.formats(node));
      }
      return delta;
    }

    function matchBreak(node, delta) {
      if (!deltaEndsWith(delta, '\n')) {
        delta.insert('\n');
      }
      return delta;
    }

    function matchIgnore() {
      return new _quillDelta2.default();
    }

    function matchIndent(node, delta) {
      var match = _parchment2.default.query(node);
      if (match == null || match.blotName !== 'list-item' || !deltaEndsWith(delta, '\n')) {
        return delta;
      }
      var indent = -1,
          parent = node.parentNode;
      while (!parent.classList.contains('ql-clipboard')) {
        if ((_parchment2.default.query(parent) || {}).blotName === 'list') {
          indent += 1;
        }
        parent = parent.parentNode;
      }
      if (indent <= 0) return delta;
      return delta.compose(new _quillDelta2.default().retain(delta.length() - 1).retain(1, { indent: indent }));
    }

    function matchNewline(node, delta) {
      if (!deltaEndsWith(delta, '\n')) {
        if (isLine(node) || delta.length() > 0 && node.nextSibling && isLine(node.nextSibling)) {
          delta.insert('\n');
        }
      }
      return delta;
    }

    function matchSpacing(node, delta) {
      if (isLine(node) && node.nextElementSibling != null && !deltaEndsWith(delta, '\n\n')) {
        var nodeHeight = node.offsetHeight + parseFloat(computeStyle(node).marginTop) + parseFloat(computeStyle(node).marginBottom);
        if (node.nextElementSibling.offsetTop > node.offsetTop + nodeHeight * 1.5) {
          delta.insert('\n');
        }
      }
      return delta;
    }

    function matchStyles(node, delta) {
      var formats = {};
      var style = node.style || {};
      if (style.fontStyle && computeStyle(node).fontStyle === 'italic') {
        formats.italic = true;
      }
      if (style.fontWeight && (computeStyle(node).fontWeight.startsWith('bold') || parseInt(computeStyle(node).fontWeight) >= 700)) {
        formats.bold = true;
      }
      if (Object.keys(formats).length > 0) {
        delta = applyFormat(delta, formats);
      }
      if (parseFloat(style.textIndent || 0) > 0) {
        // Could be 0.5in
        delta = new _quillDelta2.default().insert('\t').concat(delta);
      }
      return delta;
    }

    function matchText(node, delta) {
      var text = node.data;
      // Word represents empty line with <o:p>&nbsp;</o:p>
      if (node.parentNode.tagName === 'O:P') {
        return delta.insert(text.trim());
      }
      if (text.trim().length === 0 && node.parentNode.classList.contains('ql-clipboard')) {
        return delta;
      }
      if (!computeStyle(node.parentNode).whiteSpace.startsWith('pre')) {
        // eslint-disable-next-line func-style
        var replacer = function replacer(collapse, match) {
          match = match.replace(/[^\u00a0]/g, ''); // \u00a0 is nbsp;
          return match.length < 1 && collapse ? ' ' : match;
        };
        text = text.replace(/\r\n/g, ' ').replace(/\n/g, ' ');
        text = text.replace(/\s\s+/g, replacer.bind(replacer, true)); // collapse whitespace
        if (node.previousSibling == null && isLine(node.parentNode) || node.previousSibling != null && isLine(node.previousSibling)) {
          text = text.replace(/^\s+/, replacer.bind(replacer, false));
        }
        if (node.nextSibling == null && isLine(node.parentNode) || node.nextSibling != null && isLine(node.nextSibling)) {
          text = text.replace(/\s+$/, replacer.bind(replacer, false));
        }
      }
      return delta.insert(text);
    }

    exports.default = Clipboard;
    exports.matchAttributor = matchAttributor;
    exports.matchBlot = matchBlot;
    exports.matchNewline = matchNewline;
    exports.matchSpacing = matchSpacing;
    exports.matchText = matchText;

    /***/ }),
    /* 56 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Bold = function (_Inline) {
      _inherits(Bold, _Inline);

      function Bold() {
        _classCallCheck(this, Bold);

        return _possibleConstructorReturn(this, (Bold.__proto__ || Object.getPrototypeOf(Bold)).apply(this, arguments));
      }

      _createClass(Bold, [{
        key: 'optimize',
        value: function optimize(context) {
          _get(Bold.prototype.__proto__ || Object.getPrototypeOf(Bold.prototype), 'optimize', this).call(this, context);
          if (this.domNode.tagName !== this.statics.tagName[0]) {
            this.replaceWith(this.statics.blotName);
          }
        }
      }], [{
        key: 'create',
        value: function create() {
          return _get(Bold.__proto__ || Object.getPrototypeOf(Bold), 'create', this).call(this);
        }
      }, {
        key: 'formats',
        value: function formats() {
          return true;
        }
      }]);

      return Bold;
    }(_inline2.default);

    Bold.blotName = 'bold';
    Bold.tagName = ['STRONG', 'B'];

    exports.default = Bold;

    /***/ }),
    /* 57 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.addControls = exports.default = undefined;

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _quillDelta = __webpack_require__(2);

    var _quillDelta2 = _interopRequireDefault(_quillDelta);

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _logger = __webpack_require__(10);

    var _logger2 = _interopRequireDefault(_logger);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var debug = (0, _logger2.default)('quill:toolbar');

    var Toolbar = function (_Module) {
      _inherits(Toolbar, _Module);

      function Toolbar(quill, options) {
        _classCallCheck(this, Toolbar);

        var _this = _possibleConstructorReturn(this, (Toolbar.__proto__ || Object.getPrototypeOf(Toolbar)).call(this, quill, options));

        if (Array.isArray(_this.options.container)) {
          var container = document.createElement('div');
          addControls(container, _this.options.container);
          quill.container.parentNode.insertBefore(container, quill.container);
          _this.container = container;
        } else if (typeof _this.options.container === 'string') {
          _this.container = document.querySelector(_this.options.container);
        } else {
          _this.container = _this.options.container;
        }
        if (!(_this.container instanceof HTMLElement)) {
          var _ret;

          return _ret = debug.error('Container required for toolbar', _this.options), _possibleConstructorReturn(_this, _ret);
        }
        _this.container.classList.add('ql-toolbar');
        _this.controls = [];
        _this.handlers = {};
        Object.keys(_this.options.handlers).forEach(function (format) {
          _this.addHandler(format, _this.options.handlers[format]);
        });
        [].forEach.call(_this.container.querySelectorAll('button, select'), function (input) {
          _this.attach(input);
        });
        _this.quill.on(_quill2.default.events.EDITOR_CHANGE, function (type, range) {
          if (type === _quill2.default.events.SELECTION_CHANGE) {
            _this.update(range);
          }
        });
        _this.quill.on(_quill2.default.events.SCROLL_OPTIMIZE, function () {
          var _this$quill$selection = _this.quill.selection.getRange(),
              _this$quill$selection2 = _slicedToArray(_this$quill$selection, 1),
              range = _this$quill$selection2[0]; // quill.getSelection triggers update


          _this.update(range);
        });
        return _this;
      }

      _createClass(Toolbar, [{
        key: 'addHandler',
        value: function addHandler(format, handler) {
          this.handlers[format] = handler;
        }
      }, {
        key: 'attach',
        value: function attach(input) {
          var _this2 = this;

          var format = [].find.call(input.classList, function (className) {
            return className.indexOf('ql-') === 0;
          });
          if (!format) return;
          format = format.slice('ql-'.length);
          if (input.tagName === 'BUTTON') {
            input.setAttribute('type', 'button');
          }
          if (this.handlers[format] == null) {
            if (this.quill.scroll.whitelist != null && this.quill.scroll.whitelist[format] == null) {
              debug.warn('ignoring attaching to disabled format', format, input);
              return;
            }
            if (_parchment2.default.query(format) == null) {
              debug.warn('ignoring attaching to nonexistent format', format, input);
              return;
            }
          }
          var eventName = input.tagName === 'SELECT' ? 'change' : 'click';
          input.addEventListener(eventName, function (e) {
            var value = void 0;
            if (input.tagName === 'SELECT') {
              if (input.selectedIndex < 0) return;
              var selected = input.options[input.selectedIndex];
              if (selected.hasAttribute('selected')) {
                value = false;
              } else {
                value = selected.value || false;
              }
            } else {
              if (input.classList.contains('ql-active')) {
                value = false;
              } else {
                value = input.value || !input.hasAttribute('value');
              }
              e.preventDefault();
            }
            _this2.quill.focus();

            var _quill$selection$getR = _this2.quill.selection.getRange(),
                _quill$selection$getR2 = _slicedToArray(_quill$selection$getR, 1),
                range = _quill$selection$getR2[0];

            if (_this2.handlers[format] != null) {
              _this2.handlers[format].call(_this2, value);
            } else if (_parchment2.default.query(format).prototype instanceof _parchment2.default.Embed) {
              value = prompt('Enter ' + format);
              if (!value) return;
              _this2.quill.updateContents(new _quillDelta2.default().retain(range.index).delete(range.length).insert(_defineProperty({}, format, value)), _quill2.default.sources.USER);
            } else {
              _this2.quill.format(format, value, _quill2.default.sources.USER);
            }
            _this2.update(range);
          });
          // TODO use weakmap
          this.controls.push([format, input]);
        }
      }, {
        key: 'update',
        value: function update(range) {
          var formats = range == null ? {} : this.quill.getFormat(range);
          this.controls.forEach(function (pair) {
            var _pair = _slicedToArray(pair, 2),
                format = _pair[0],
                input = _pair[1];

            if (input.tagName === 'SELECT') {
              var option = void 0;
              if (range == null) {
                option = null;
              } else if (formats[format] == null) {
                option = input.querySelector('option[selected]');
              } else if (!Array.isArray(formats[format])) {
                var value = formats[format];
                if (typeof value === 'string') {
                  value = value.replace(/\"/g, '\\"');
                }
                option = input.querySelector('option[value="' + value + '"]');
              }
              if (option == null) {
                input.value = ''; // TODO make configurable?
                input.selectedIndex = -1;
              } else {
                option.selected = true;
              }
            } else {
              if (range == null) {
                input.classList.remove('ql-active');
              } else if (input.hasAttribute('value')) {
                // both being null should match (default values)
                // '1' should match with 1 (headers)
                var isActive = formats[format] === input.getAttribute('value') || formats[format] != null && formats[format].toString() === input.getAttribute('value') || formats[format] == null && !input.getAttribute('value');
                input.classList.toggle('ql-active', isActive);
              } else {
                input.classList.toggle('ql-active', formats[format] != null);
              }
            }
          });
        }
      }]);

      return Toolbar;
    }(_module2.default);

    Toolbar.DEFAULTS = {};

    function addButton(container, format, value) {
      var input = document.createElement('button');
      input.setAttribute('type', 'button');
      input.classList.add('ql-' + format);
      if (value != null) {
        input.value = value;
      }
      container.appendChild(input);
    }

    function addControls(container, groups) {
      if (!Array.isArray(groups[0])) {
        groups = [groups];
      }
      groups.forEach(function (controls) {
        var group = document.createElement('span');
        group.classList.add('ql-formats');
        controls.forEach(function (control) {
          if (typeof control === 'string') {
            addButton(group, control);
          } else {
            var format = Object.keys(control)[0];
            var value = control[format];
            if (Array.isArray(value)) {
              addSelect(group, format, value);
            } else {
              addButton(group, format, value);
            }
          }
        });
        container.appendChild(group);
      });
    }

    function addSelect(container, format, values) {
      var input = document.createElement('select');
      input.classList.add('ql-' + format);
      values.forEach(function (value) {
        var option = document.createElement('option');
        if (value !== false) {
          option.setAttribute('value', value);
        } else {
          option.setAttribute('selected', 'selected');
        }
        input.appendChild(option);
      });
      container.appendChild(input);
    }

    Toolbar.DEFAULTS = {
      container: null,
      handlers: {
        clean: function clean() {
          var _this3 = this;

          var range = this.quill.getSelection();
          if (range == null) return;
          if (range.length == 0) {
            var formats = this.quill.getFormat();
            Object.keys(formats).forEach(function (name) {
              // Clean functionality in existing apps only clean inline formats
              if (_parchment2.default.query(name, _parchment2.default.Scope.INLINE) != null) {
                _this3.quill.format(name, false);
              }
            });
          } else {
            this.quill.removeFormat(range, _quill2.default.sources.USER);
          }
        },
        direction: function direction(value) {
          var align = this.quill.getFormat()['align'];
          if (value === 'rtl' && align == null) {
            this.quill.format('align', 'right', _quill2.default.sources.USER);
          } else if (!value && align === 'right') {
            this.quill.format('align', false, _quill2.default.sources.USER);
          }
          this.quill.format('direction', value, _quill2.default.sources.USER);
        },
        indent: function indent(value) {
          var range = this.quill.getSelection();
          var formats = this.quill.getFormat(range);
          var indent = parseInt(formats.indent || 0);
          if (value === '+1' || value === '-1') {
            var modifier = value === '+1' ? 1 : -1;
            if (formats.direction === 'rtl') modifier *= -1;
            this.quill.format('indent', indent + modifier, _quill2.default.sources.USER);
          }
        },
        link: function link(value) {
          if (value === true) {
            value = prompt('Enter link URL:');
          }
          this.quill.format('link', value, _quill2.default.sources.USER);
        },
        list: function list(value) {
          var range = this.quill.getSelection();
          var formats = this.quill.getFormat(range);
          if (value === 'check') {
            if (formats['list'] === 'checked' || formats['list'] === 'unchecked') {
              this.quill.format('list', false, _quill2.default.sources.USER);
            } else {
              this.quill.format('list', 'unchecked', _quill2.default.sources.USER);
            }
          } else {
            this.quill.format('list', value, _quill2.default.sources.USER);
          }
        }
      }
    };

    exports.default = Toolbar;
    exports.addControls = addControls;

    /***/ }),
    /* 58 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <polyline class=\"ql-even ql-stroke\" points=\"5 7 3 9 5 11\"></polyline> <polyline class=\"ql-even ql-stroke\" points=\"13 7 15 9 13 11\"></polyline> <line class=ql-stroke x1=10 x2=8 y1=5 y2=13></line> </svg>";

    /***/ }),
    /* 59 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _picker = __webpack_require__(28);

    var _picker2 = _interopRequireDefault(_picker);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ColorPicker = function (_Picker) {
      _inherits(ColorPicker, _Picker);

      function ColorPicker(select, label) {
        _classCallCheck(this, ColorPicker);

        var _this = _possibleConstructorReturn(this, (ColorPicker.__proto__ || Object.getPrototypeOf(ColorPicker)).call(this, select));

        _this.label.innerHTML = label;
        _this.container.classList.add('ql-color-picker');
        [].slice.call(_this.container.querySelectorAll('.ql-picker-item'), 0, 7).forEach(function (item) {
          item.classList.add('ql-primary');
        });
        return _this;
      }

      _createClass(ColorPicker, [{
        key: 'buildItem',
        value: function buildItem(option) {
          var item = _get(ColorPicker.prototype.__proto__ || Object.getPrototypeOf(ColorPicker.prototype), 'buildItem', this).call(this, option);
          item.style.backgroundColor = option.getAttribute('value') || '';
          return item;
        }
      }, {
        key: 'selectItem',
        value: function selectItem(item, trigger) {
          _get(ColorPicker.prototype.__proto__ || Object.getPrototypeOf(ColorPicker.prototype), 'selectItem', this).call(this, item, trigger);
          var colorLabel = this.label.querySelector('.ql-color-label');
          var value = item ? item.getAttribute('data-value') || '' : '';
          if (colorLabel) {
            if (colorLabel.tagName === 'line') {
              colorLabel.style.stroke = value;
            } else {
              colorLabel.style.fill = value;
            }
          }
        }
      }]);

      return ColorPicker;
    }(_picker2.default);

    exports.default = ColorPicker;

    /***/ }),
    /* 60 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _picker = __webpack_require__(28);

    var _picker2 = _interopRequireDefault(_picker);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var IconPicker = function (_Picker) {
      _inherits(IconPicker, _Picker);

      function IconPicker(select, icons) {
        _classCallCheck(this, IconPicker);

        var _this = _possibleConstructorReturn(this, (IconPicker.__proto__ || Object.getPrototypeOf(IconPicker)).call(this, select));

        _this.container.classList.add('ql-icon-picker');
        [].forEach.call(_this.container.querySelectorAll('.ql-picker-item'), function (item) {
          item.innerHTML = icons[item.getAttribute('data-value') || ''];
        });
        _this.defaultItem = _this.container.querySelector('.ql-selected');
        _this.selectItem(_this.defaultItem);
        return _this;
      }

      _createClass(IconPicker, [{
        key: 'selectItem',
        value: function selectItem(item, trigger) {
          _get(IconPicker.prototype.__proto__ || Object.getPrototypeOf(IconPicker.prototype), 'selectItem', this).call(this, item, trigger);
          item = item || this.defaultItem;
          this.label.innerHTML = item.innerHTML;
        }
      }]);

      return IconPicker;
    }(_picker2.default);

    exports.default = IconPicker;

    /***/ }),
    /* 61 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Tooltip = function () {
      function Tooltip(quill, boundsContainer) {
        var _this = this;

        _classCallCheck(this, Tooltip);

        this.quill = quill;
        this.boundsContainer = boundsContainer || document.body;
        this.root = quill.addContainer('ql-tooltip');
        this.root.innerHTML = this.constructor.TEMPLATE;
        if (this.quill.root === this.quill.scrollingContainer) {
          this.quill.root.addEventListener('scroll', function () {
            _this.root.style.marginTop = -1 * _this.quill.root.scrollTop + 'px';
          });
        }
        this.hide();
      }

      _createClass(Tooltip, [{
        key: 'hide',
        value: function hide() {
          this.root.classList.add('ql-hidden');
        }
      }, {
        key: 'position',
        value: function position(reference) {
          var left = reference.left + reference.width / 2 - this.root.offsetWidth / 2;
          // root.scrollTop should be 0 if scrollContainer !== root
          var top = reference.bottom + this.quill.root.scrollTop;
          this.root.style.left = left + 'px';
          this.root.style.top = top + 'px';
          this.root.classList.remove('ql-flip');
          var containerBounds = this.boundsContainer.getBoundingClientRect();
          var rootBounds = this.root.getBoundingClientRect();
          var shift = 0;
          if (rootBounds.right > containerBounds.right) {
            shift = containerBounds.right - rootBounds.right;
            this.root.style.left = left + shift + 'px';
          }
          if (rootBounds.left < containerBounds.left) {
            shift = containerBounds.left - rootBounds.left;
            this.root.style.left = left + shift + 'px';
          }
          if (rootBounds.bottom > containerBounds.bottom) {
            var height = rootBounds.bottom - rootBounds.top;
            var verticalShift = reference.bottom - reference.top + height;
            this.root.style.top = top - verticalShift + 'px';
            this.root.classList.add('ql-flip');
          }
          return shift;
        }
      }, {
        key: 'show',
        value: function show() {
          this.root.classList.remove('ql-editing');
          this.root.classList.remove('ql-hidden');
        }
      }]);

      return Tooltip;
    }();

    exports.default = Tooltip;

    /***/ }),
    /* 62 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    var _emitter = __webpack_require__(8);

    var _emitter2 = _interopRequireDefault(_emitter);

    var _base = __webpack_require__(43);

    var _base2 = _interopRequireDefault(_base);

    var _link = __webpack_require__(27);

    var _link2 = _interopRequireDefault(_link);

    var _selection = __webpack_require__(15);

    var _icons = __webpack_require__(41);

    var _icons2 = _interopRequireDefault(_icons);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var TOOLBAR_CONFIG = [[{ header: ['1', '2', '3', false] }], ['bold', 'italic', 'underline', 'link'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']];

    var SnowTheme = function (_BaseTheme) {
      _inherits(SnowTheme, _BaseTheme);

      function SnowTheme(quill, options) {
        _classCallCheck(this, SnowTheme);

        if (options.modules.toolbar != null && options.modules.toolbar.container == null) {
          options.modules.toolbar.container = TOOLBAR_CONFIG;
        }

        var _this = _possibleConstructorReturn(this, (SnowTheme.__proto__ || Object.getPrototypeOf(SnowTheme)).call(this, quill, options));

        _this.quill.container.classList.add('ql-snow');
        return _this;
      }

      _createClass(SnowTheme, [{
        key: 'extendToolbar',
        value: function extendToolbar(toolbar) {
          toolbar.container.classList.add('ql-snow');
          this.buildButtons([].slice.call(toolbar.container.querySelectorAll('button')), _icons2.default);
          this.buildPickers([].slice.call(toolbar.container.querySelectorAll('select')), _icons2.default);
          this.tooltip = new SnowTooltip(this.quill, this.options.bounds);
          if (toolbar.container.querySelector('.ql-link')) {
            this.quill.keyboard.addBinding({ key: 'K', shortKey: true }, function (range, context) {
              toolbar.handlers['link'].call(toolbar, !context.format.link);
            });
          }
        }
      }]);

      return SnowTheme;
    }(_base2.default);

    SnowTheme.DEFAULTS = (0, _extend2.default)(true, {}, _base2.default.DEFAULTS, {
      modules: {
        toolbar: {
          handlers: {
            link: function link(value) {
              if (value) {
                var range = this.quill.getSelection();
                if (range == null || range.length == 0) return;
                var preview = this.quill.getText(range);
                if (/^\S+@\S+\.\S+$/.test(preview) && preview.indexOf('mailto:') !== 0) {
                  preview = 'mailto:' + preview;
                }
                var tooltip = this.quill.theme.tooltip;
                tooltip.edit('link', preview);
              } else {
                this.quill.format('link', false);
              }
            }
          }
        }
      }
    });

    var SnowTooltip = function (_BaseTooltip) {
      _inherits(SnowTooltip, _BaseTooltip);

      function SnowTooltip(quill, bounds) {
        _classCallCheck(this, SnowTooltip);

        var _this2 = _possibleConstructorReturn(this, (SnowTooltip.__proto__ || Object.getPrototypeOf(SnowTooltip)).call(this, quill, bounds));

        _this2.preview = _this2.root.querySelector('a.ql-preview');
        return _this2;
      }

      _createClass(SnowTooltip, [{
        key: 'listen',
        value: function listen() {
          var _this3 = this;

          _get(SnowTooltip.prototype.__proto__ || Object.getPrototypeOf(SnowTooltip.prototype), 'listen', this).call(this);
          this.root.querySelector('a.ql-action').addEventListener('click', function (event) {
            if (_this3.root.classList.contains('ql-editing')) {
              _this3.save();
            } else {
              _this3.edit('link', _this3.preview.textContent);
            }
            event.preventDefault();
          });
          this.root.querySelector('a.ql-remove').addEventListener('click', function (event) {
            if (_this3.linkRange != null) {
              var range = _this3.linkRange;
              _this3.restoreFocus();
              _this3.quill.formatText(range, 'link', false, _emitter2.default.sources.USER);
              delete _this3.linkRange;
            }
            event.preventDefault();
            _this3.hide();
          });
          this.quill.on(_emitter2.default.events.SELECTION_CHANGE, function (range, oldRange, source) {
            if (range == null) return;
            if (range.length === 0 && source === _emitter2.default.sources.USER) {
              var _quill$scroll$descend = _this3.quill.scroll.descendant(_link2.default, range.index),
                  _quill$scroll$descend2 = _slicedToArray(_quill$scroll$descend, 2),
                  link = _quill$scroll$descend2[0],
                  offset = _quill$scroll$descend2[1];

              if (link != null) {
                _this3.linkRange = new _selection.Range(range.index - offset, link.length());
                var preview = _link2.default.formats(link.domNode);
                _this3.preview.textContent = preview;
                _this3.preview.setAttribute('href', preview);
                _this3.show();
                _this3.position(_this3.quill.getBounds(_this3.linkRange));
                return;
              }
            } else {
              delete _this3.linkRange;
            }
            _this3.hide();
          });
        }
      }, {
        key: 'show',
        value: function show() {
          _get(SnowTooltip.prototype.__proto__ || Object.getPrototypeOf(SnowTooltip.prototype), 'show', this).call(this);
          this.root.removeAttribute('data-mode');
        }
      }]);

      return SnowTooltip;
    }(_base.BaseTooltip);

    SnowTooltip.TEMPLATE = ['<a class="ql-preview" rel="noopener noreferrer" target="_blank" href="about:blank"></a>', '<input type="text" data-formula="e=mc^2" data-link="https://quilljs.com" data-video="Embed URL">', '<a class="ql-action"></a>', '<a class="ql-remove"></a>'].join('');

    exports.default = SnowTheme;

    /***/ }),
    /* 63 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _core = __webpack_require__(29);

    var _core2 = _interopRequireDefault(_core);

    var _align = __webpack_require__(36);

    var _direction = __webpack_require__(38);

    var _indent = __webpack_require__(64);

    var _blockquote = __webpack_require__(65);

    var _blockquote2 = _interopRequireDefault(_blockquote);

    var _header = __webpack_require__(66);

    var _header2 = _interopRequireDefault(_header);

    var _list = __webpack_require__(67);

    var _list2 = _interopRequireDefault(_list);

    var _background = __webpack_require__(37);

    var _color = __webpack_require__(26);

    var _font = __webpack_require__(39);

    var _size = __webpack_require__(40);

    var _bold = __webpack_require__(56);

    var _bold2 = _interopRequireDefault(_bold);

    var _italic = __webpack_require__(68);

    var _italic2 = _interopRequireDefault(_italic);

    var _link = __webpack_require__(27);

    var _link2 = _interopRequireDefault(_link);

    var _script = __webpack_require__(69);

    var _script2 = _interopRequireDefault(_script);

    var _strike = __webpack_require__(70);

    var _strike2 = _interopRequireDefault(_strike);

    var _underline = __webpack_require__(71);

    var _underline2 = _interopRequireDefault(_underline);

    var _image = __webpack_require__(72);

    var _image2 = _interopRequireDefault(_image);

    var _video = __webpack_require__(73);

    var _video2 = _interopRequireDefault(_video);

    var _code = __webpack_require__(13);

    var _code2 = _interopRequireDefault(_code);

    var _formula = __webpack_require__(74);

    var _formula2 = _interopRequireDefault(_formula);

    var _syntax = __webpack_require__(75);

    var _syntax2 = _interopRequireDefault(_syntax);

    var _toolbar = __webpack_require__(57);

    var _toolbar2 = _interopRequireDefault(_toolbar);

    var _icons = __webpack_require__(41);

    var _icons2 = _interopRequireDefault(_icons);

    var _picker = __webpack_require__(28);

    var _picker2 = _interopRequireDefault(_picker);

    var _colorPicker = __webpack_require__(59);

    var _colorPicker2 = _interopRequireDefault(_colorPicker);

    var _iconPicker = __webpack_require__(60);

    var _iconPicker2 = _interopRequireDefault(_iconPicker);

    var _tooltip = __webpack_require__(61);

    var _tooltip2 = _interopRequireDefault(_tooltip);

    var _bubble = __webpack_require__(108);

    var _bubble2 = _interopRequireDefault(_bubble);

    var _snow = __webpack_require__(62);

    var _snow2 = _interopRequireDefault(_snow);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    _core2.default.register({
      'attributors/attribute/direction': _direction.DirectionAttribute,

      'attributors/class/align': _align.AlignClass,
      'attributors/class/background': _background.BackgroundClass,
      'attributors/class/color': _color.ColorClass,
      'attributors/class/direction': _direction.DirectionClass,
      'attributors/class/font': _font.FontClass,
      'attributors/class/size': _size.SizeClass,

      'attributors/style/align': _align.AlignStyle,
      'attributors/style/background': _background.BackgroundStyle,
      'attributors/style/color': _color.ColorStyle,
      'attributors/style/direction': _direction.DirectionStyle,
      'attributors/style/font': _font.FontStyle,
      'attributors/style/size': _size.SizeStyle
    }, true);

    _core2.default.register({
      'formats/align': _align.AlignClass,
      'formats/direction': _direction.DirectionClass,
      'formats/indent': _indent.IndentClass,

      'formats/background': _background.BackgroundStyle,
      'formats/color': _color.ColorStyle,
      'formats/font': _font.FontClass,
      'formats/size': _size.SizeClass,

      'formats/blockquote': _blockquote2.default,
      'formats/code-block': _code2.default,
      'formats/header': _header2.default,
      'formats/list': _list2.default,

      'formats/bold': _bold2.default,
      'formats/code': _code.Code,
      'formats/italic': _italic2.default,
      'formats/link': _link2.default,
      'formats/script': _script2.default,
      'formats/strike': _strike2.default,
      'formats/underline': _underline2.default,

      'formats/image': _image2.default,
      'formats/video': _video2.default,

      'formats/list/item': _list.ListItem,

      'modules/formula': _formula2.default,
      'modules/syntax': _syntax2.default,
      'modules/toolbar': _toolbar2.default,

      'themes/bubble': _bubble2.default,
      'themes/snow': _snow2.default,

      'ui/icons': _icons2.default,
      'ui/picker': _picker2.default,
      'ui/icon-picker': _iconPicker2.default,
      'ui/color-picker': _colorPicker2.default,
      'ui/tooltip': _tooltip2.default
    }, true);

    exports.default = _core2.default;

    /***/ }),
    /* 64 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.IndentClass = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var IdentAttributor = function (_Parchment$Attributor) {
      _inherits(IdentAttributor, _Parchment$Attributor);

      function IdentAttributor() {
        _classCallCheck(this, IdentAttributor);

        return _possibleConstructorReturn(this, (IdentAttributor.__proto__ || Object.getPrototypeOf(IdentAttributor)).apply(this, arguments));
      }

      _createClass(IdentAttributor, [{
        key: 'add',
        value: function add(node, value) {
          if (value === '+1' || value === '-1') {
            var indent = this.value(node) || 0;
            value = value === '+1' ? indent + 1 : indent - 1;
          }
          if (value === 0) {
            this.remove(node);
            return true;
          } else {
            return _get(IdentAttributor.prototype.__proto__ || Object.getPrototypeOf(IdentAttributor.prototype), 'add', this).call(this, node, value);
          }
        }
      }, {
        key: 'canAdd',
        value: function canAdd(node, value) {
          return _get(IdentAttributor.prototype.__proto__ || Object.getPrototypeOf(IdentAttributor.prototype), 'canAdd', this).call(this, node, value) || _get(IdentAttributor.prototype.__proto__ || Object.getPrototypeOf(IdentAttributor.prototype), 'canAdd', this).call(this, node, parseInt(value));
        }
      }, {
        key: 'value',
        value: function value(node) {
          return parseInt(_get(IdentAttributor.prototype.__proto__ || Object.getPrototypeOf(IdentAttributor.prototype), 'value', this).call(this, node)) || undefined; // Don't return NaN
        }
      }]);

      return IdentAttributor;
    }(_parchment2.default.Attributor.Class);

    var IndentClass = new IdentAttributor('indent', 'ql-indent', {
      scope: _parchment2.default.Scope.BLOCK,
      whitelist: [1, 2, 3, 4, 5, 6, 7, 8]
    });

    exports.IndentClass = IndentClass;

    /***/ }),
    /* 65 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Blockquote = function (_Block) {
      _inherits(Blockquote, _Block);

      function Blockquote() {
        _classCallCheck(this, Blockquote);

        return _possibleConstructorReturn(this, (Blockquote.__proto__ || Object.getPrototypeOf(Blockquote)).apply(this, arguments));
      }

      return Blockquote;
    }(_block2.default);

    Blockquote.blotName = 'blockquote';
    Blockquote.tagName = 'blockquote';

    exports.default = Blockquote;

    /***/ }),
    /* 66 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Header = function (_Block) {
      _inherits(Header, _Block);

      function Header() {
        _classCallCheck(this, Header);

        return _possibleConstructorReturn(this, (Header.__proto__ || Object.getPrototypeOf(Header)).apply(this, arguments));
      }

      _createClass(Header, null, [{
        key: 'formats',
        value: function formats(domNode) {
          return this.tagName.indexOf(domNode.tagName) + 1;
        }
      }]);

      return Header;
    }(_block2.default);

    Header.blotName = 'header';
    Header.tagName = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

    exports.default = Header;

    /***/ }),
    /* 67 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.ListItem = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _block = __webpack_require__(4);

    var _block2 = _interopRequireDefault(_block);

    var _container = __webpack_require__(25);

    var _container2 = _interopRequireDefault(_container);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ListItem = function (_Block) {
      _inherits(ListItem, _Block);

      function ListItem() {
        _classCallCheck(this, ListItem);

        return _possibleConstructorReturn(this, (ListItem.__proto__ || Object.getPrototypeOf(ListItem)).apply(this, arguments));
      }

      _createClass(ListItem, [{
        key: 'format',
        value: function format(name, value) {
          if (name === List.blotName && !value) {
            this.replaceWith(_parchment2.default.create(this.statics.scope));
          } else {
            _get(ListItem.prototype.__proto__ || Object.getPrototypeOf(ListItem.prototype), 'format', this).call(this, name, value);
          }
        }
      }, {
        key: 'remove',
        value: function remove() {
          if (this.prev == null && this.next == null) {
            this.parent.remove();
          } else {
            _get(ListItem.prototype.__proto__ || Object.getPrototypeOf(ListItem.prototype), 'remove', this).call(this);
          }
        }
      }, {
        key: 'replaceWith',
        value: function replaceWith(name, value) {
          this.parent.isolate(this.offset(this.parent), this.length());
          if (name === this.parent.statics.blotName) {
            this.parent.replaceWith(name, value);
            return this;
          } else {
            this.parent.unwrap();
            return _get(ListItem.prototype.__proto__ || Object.getPrototypeOf(ListItem.prototype), 'replaceWith', this).call(this, name, value);
          }
        }
      }], [{
        key: 'formats',
        value: function formats(domNode) {
          return domNode.tagName === this.tagName ? undefined : _get(ListItem.__proto__ || Object.getPrototypeOf(ListItem), 'formats', this).call(this, domNode);
        }
      }]);

      return ListItem;
    }(_block2.default);

    ListItem.blotName = 'list-item';
    ListItem.tagName = 'LI';

    var List = function (_Container) {
      _inherits(List, _Container);

      _createClass(List, null, [{
        key: 'create',
        value: function create(value) {
          var tagName = value === 'ordered' ? 'OL' : 'UL';
          var node = _get(List.__proto__ || Object.getPrototypeOf(List), 'create', this).call(this, tagName);
          if (value === 'checked' || value === 'unchecked') {
            node.setAttribute('data-checked', value === 'checked');
          }
          return node;
        }
      }, {
        key: 'formats',
        value: function formats(domNode) {
          if (domNode.tagName === 'OL') return 'ordered';
          if (domNode.tagName === 'UL') {
            if (domNode.hasAttribute('data-checked')) {
              return domNode.getAttribute('data-checked') === 'true' ? 'checked' : 'unchecked';
            } else {
              return 'bullet';
            }
          }
          return undefined;
        }
      }]);

      function List(domNode) {
        _classCallCheck(this, List);

        var _this2 = _possibleConstructorReturn(this, (List.__proto__ || Object.getPrototypeOf(List)).call(this, domNode));

        var listEventHandler = function listEventHandler(e) {
          if (e.target.parentNode !== domNode) return;
          var format = _this2.statics.formats(domNode);
          var blot = _parchment2.default.find(e.target);
          if (format === 'checked') {
            blot.format('list', 'unchecked');
          } else if (format === 'unchecked') {
            blot.format('list', 'checked');
          }
        };

        domNode.addEventListener('touchstart', listEventHandler);
        domNode.addEventListener('mousedown', listEventHandler);
        return _this2;
      }

      _createClass(List, [{
        key: 'format',
        value: function format(name, value) {
          if (this.children.length > 0) {
            this.children.tail.format(name, value);
          }
        }
      }, {
        key: 'formats',
        value: function formats() {
          // We don't inherit from FormatBlot
          return _defineProperty({}, this.statics.blotName, this.statics.formats(this.domNode));
        }
      }, {
        key: 'insertBefore',
        value: function insertBefore(blot, ref) {
          if (blot instanceof ListItem) {
            _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'insertBefore', this).call(this, blot, ref);
          } else {
            var index = ref == null ? this.length() : ref.offset(this);
            var after = this.split(index);
            after.parent.insertBefore(blot, after);
          }
        }
      }, {
        key: 'optimize',
        value: function optimize(context) {
          _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'optimize', this).call(this, context);
          var next = this.next;
          if (next != null && next.prev === this && next.statics.blotName === this.statics.blotName && next.domNode.tagName === this.domNode.tagName && next.domNode.getAttribute('data-checked') === this.domNode.getAttribute('data-checked')) {
            next.moveChildren(this);
            next.remove();
          }
        }
      }, {
        key: 'replace',
        value: function replace(target) {
          if (target.statics.blotName !== this.statics.blotName) {
            var item = _parchment2.default.create(this.statics.defaultChild);
            target.moveChildren(item);
            this.appendChild(item);
          }
          _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'replace', this).call(this, target);
        }
      }]);

      return List;
    }(_container2.default);

    List.blotName = 'list';
    List.scope = _parchment2.default.Scope.BLOCK_BLOT;
    List.tagName = ['OL', 'UL'];
    List.defaultChild = 'list-item';
    List.allowedChildren = [ListItem];

    exports.ListItem = ListItem;
    exports.default = List;

    /***/ }),
    /* 68 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _bold = __webpack_require__(56);

    var _bold2 = _interopRequireDefault(_bold);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Italic = function (_Bold) {
      _inherits(Italic, _Bold);

      function Italic() {
        _classCallCheck(this, Italic);

        return _possibleConstructorReturn(this, (Italic.__proto__ || Object.getPrototypeOf(Italic)).apply(this, arguments));
      }

      return Italic;
    }(_bold2.default);

    Italic.blotName = 'italic';
    Italic.tagName = ['EM', 'I'];

    exports.default = Italic;

    /***/ }),
    /* 69 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Script = function (_Inline) {
      _inherits(Script, _Inline);

      function Script() {
        _classCallCheck(this, Script);

        return _possibleConstructorReturn(this, (Script.__proto__ || Object.getPrototypeOf(Script)).apply(this, arguments));
      }

      _createClass(Script, null, [{
        key: 'create',
        value: function create(value) {
          if (value === 'super') {
            return document.createElement('sup');
          } else if (value === 'sub') {
            return document.createElement('sub');
          } else {
            return _get(Script.__proto__ || Object.getPrototypeOf(Script), 'create', this).call(this, value);
          }
        }
      }, {
        key: 'formats',
        value: function formats(domNode) {
          if (domNode.tagName === 'SUB') return 'sub';
          if (domNode.tagName === 'SUP') return 'super';
          return undefined;
        }
      }]);

      return Script;
    }(_inline2.default);

    Script.blotName = 'script';
    Script.tagName = ['SUB', 'SUP'];

    exports.default = Script;

    /***/ }),
    /* 70 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Strike = function (_Inline) {
      _inherits(Strike, _Inline);

      function Strike() {
        _classCallCheck(this, Strike);

        return _possibleConstructorReturn(this, (Strike.__proto__ || Object.getPrototypeOf(Strike)).apply(this, arguments));
      }

      return Strike;
    }(_inline2.default);

    Strike.blotName = 'strike';
    Strike.tagName = 'S';

    exports.default = Strike;

    /***/ }),
    /* 71 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _inline = __webpack_require__(6);

    var _inline2 = _interopRequireDefault(_inline);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var Underline = function (_Inline) {
      _inherits(Underline, _Inline);

      function Underline() {
        _classCallCheck(this, Underline);

        return _possibleConstructorReturn(this, (Underline.__proto__ || Object.getPrototypeOf(Underline)).apply(this, arguments));
      }

      return Underline;
    }(_inline2.default);

    Underline.blotName = 'underline';
    Underline.tagName = 'U';

    exports.default = Underline;

    /***/ }),
    /* 72 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _link = __webpack_require__(27);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ATTRIBUTES = ['alt', 'height', 'width'];

    var Image = function (_Parchment$Embed) {
      _inherits(Image, _Parchment$Embed);

      function Image() {
        _classCallCheck(this, Image);

        return _possibleConstructorReturn(this, (Image.__proto__ || Object.getPrototypeOf(Image)).apply(this, arguments));
      }

      _createClass(Image, [{
        key: 'format',
        value: function format(name, value) {
          if (ATTRIBUTES.indexOf(name) > -1) {
            if (value) {
              this.domNode.setAttribute(name, value);
            } else {
              this.domNode.removeAttribute(name);
            }
          } else {
            _get(Image.prototype.__proto__ || Object.getPrototypeOf(Image.prototype), 'format', this).call(this, name, value);
          }
        }
      }], [{
        key: 'create',
        value: function create(value) {
          var node = _get(Image.__proto__ || Object.getPrototypeOf(Image), 'create', this).call(this, value);
          if (typeof value === 'string') {
            node.setAttribute('src', this.sanitize(value));
          }
          return node;
        }
      }, {
        key: 'formats',
        value: function formats(domNode) {
          return ATTRIBUTES.reduce(function (formats, attribute) {
            if (domNode.hasAttribute(attribute)) {
              formats[attribute] = domNode.getAttribute(attribute);
            }
            return formats;
          }, {});
        }
      }, {
        key: 'match',
        value: function match(url) {
          return (/\.(jpe?g|gif|png)$/.test(url) || /^data:image\/.+;base64/.test(url)
          );
        }
      }, {
        key: 'sanitize',
        value: function sanitize(url) {
          return (0, _link.sanitize)(url, ['http', 'https', 'data']) ? url : '//:0';
        }
      }, {
        key: 'value',
        value: function value(domNode) {
          return domNode.getAttribute('src');
        }
      }]);

      return Image;
    }(_parchment2.default.Embed);

    Image.blotName = 'image';
    Image.tagName = 'IMG';

    exports.default = Image;

    /***/ }),
    /* 73 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _block = __webpack_require__(4);

    var _link = __webpack_require__(27);

    var _link2 = _interopRequireDefault(_link);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var ATTRIBUTES = ['height', 'width'];

    var Video = function (_BlockEmbed) {
      _inherits(Video, _BlockEmbed);

      function Video() {
        _classCallCheck(this, Video);

        return _possibleConstructorReturn(this, (Video.__proto__ || Object.getPrototypeOf(Video)).apply(this, arguments));
      }

      _createClass(Video, [{
        key: 'format',
        value: function format(name, value) {
          if (ATTRIBUTES.indexOf(name) > -1) {
            if (value) {
              this.domNode.setAttribute(name, value);
            } else {
              this.domNode.removeAttribute(name);
            }
          } else {
            _get(Video.prototype.__proto__ || Object.getPrototypeOf(Video.prototype), 'format', this).call(this, name, value);
          }
        }
      }], [{
        key: 'create',
        value: function create(value) {
          var node = _get(Video.__proto__ || Object.getPrototypeOf(Video), 'create', this).call(this, value);
          node.setAttribute('frameborder', '0');
          node.setAttribute('allowfullscreen', true);
          node.setAttribute('src', this.sanitize(value));
          return node;
        }
      }, {
        key: 'formats',
        value: function formats(domNode) {
          return ATTRIBUTES.reduce(function (formats, attribute) {
            if (domNode.hasAttribute(attribute)) {
              formats[attribute] = domNode.getAttribute(attribute);
            }
            return formats;
          }, {});
        }
      }, {
        key: 'sanitize',
        value: function sanitize(url) {
          return _link2.default.sanitize(url);
        }
      }, {
        key: 'value',
        value: function value(domNode) {
          return domNode.getAttribute('src');
        }
      }]);

      return Video;
    }(_block.BlockEmbed);

    Video.blotName = 'video';
    Video.className = 'ql-video';
    Video.tagName = 'IFRAME';

    exports.default = Video;

    /***/ }),
    /* 74 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.FormulaBlot = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _embed = __webpack_require__(35);

    var _embed2 = _interopRequireDefault(_embed);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var FormulaBlot = function (_Embed) {
      _inherits(FormulaBlot, _Embed);

      function FormulaBlot() {
        _classCallCheck(this, FormulaBlot);

        return _possibleConstructorReturn(this, (FormulaBlot.__proto__ || Object.getPrototypeOf(FormulaBlot)).apply(this, arguments));
      }

      _createClass(FormulaBlot, null, [{
        key: 'create',
        value: function create(value) {
          var node = _get(FormulaBlot.__proto__ || Object.getPrototypeOf(FormulaBlot), 'create', this).call(this, value);
          if (typeof value === 'string') {
            window.katex.render(value, node, {
              throwOnError: false,
              errorColor: '#f00'
            });
            node.setAttribute('data-value', value);
          }
          return node;
        }
      }, {
        key: 'value',
        value: function value(domNode) {
          return domNode.getAttribute('data-value');
        }
      }]);

      return FormulaBlot;
    }(_embed2.default);

    FormulaBlot.blotName = 'formula';
    FormulaBlot.className = 'ql-formula';
    FormulaBlot.tagName = 'SPAN';

    var Formula = function (_Module) {
      _inherits(Formula, _Module);

      _createClass(Formula, null, [{
        key: 'register',
        value: function register() {
          _quill2.default.register(FormulaBlot, true);
        }
      }]);

      function Formula() {
        _classCallCheck(this, Formula);

        var _this2 = _possibleConstructorReturn(this, (Formula.__proto__ || Object.getPrototypeOf(Formula)).call(this));

        if (window.katex == null) {
          throw new Error('Formula module requires KaTeX.');
        }
        return _this2;
      }

      return Formula;
    }(_module2.default);

    exports.FormulaBlot = FormulaBlot;
    exports.default = Formula;

    /***/ }),
    /* 75 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.CodeToken = exports.CodeBlock = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _parchment = __webpack_require__(0);

    var _parchment2 = _interopRequireDefault(_parchment);

    var _quill = __webpack_require__(5);

    var _quill2 = _interopRequireDefault(_quill);

    var _module = __webpack_require__(9);

    var _module2 = _interopRequireDefault(_module);

    var _code = __webpack_require__(13);

    var _code2 = _interopRequireDefault(_code);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var SyntaxCodeBlock = function (_CodeBlock) {
      _inherits(SyntaxCodeBlock, _CodeBlock);

      function SyntaxCodeBlock() {
        _classCallCheck(this, SyntaxCodeBlock);

        return _possibleConstructorReturn(this, (SyntaxCodeBlock.__proto__ || Object.getPrototypeOf(SyntaxCodeBlock)).apply(this, arguments));
      }

      _createClass(SyntaxCodeBlock, [{
        key: 'replaceWith',
        value: function replaceWith(block) {
          this.domNode.textContent = this.domNode.textContent;
          this.attach();
          _get(SyntaxCodeBlock.prototype.__proto__ || Object.getPrototypeOf(SyntaxCodeBlock.prototype), 'replaceWith', this).call(this, block);
        }
      }, {
        key: 'highlight',
        value: function highlight(_highlight) {
          var text = this.domNode.textContent;
          if (this.cachedText !== text) {
            if (text.trim().length > 0 || this.cachedText == null) {
              this.domNode.innerHTML = _highlight(text);
              this.domNode.normalize();
              this.attach();
            }
            this.cachedText = text;
          }
        }
      }]);

      return SyntaxCodeBlock;
    }(_code2.default);

    SyntaxCodeBlock.className = 'ql-syntax';

    var CodeToken = new _parchment2.default.Attributor.Class('token', 'hljs', {
      scope: _parchment2.default.Scope.INLINE
    });

    var Syntax = function (_Module) {
      _inherits(Syntax, _Module);

      _createClass(Syntax, null, [{
        key: 'register',
        value: function register() {
          _quill2.default.register(CodeToken, true);
          _quill2.default.register(SyntaxCodeBlock, true);
        }
      }]);

      function Syntax(quill, options) {
        _classCallCheck(this, Syntax);

        var _this2 = _possibleConstructorReturn(this, (Syntax.__proto__ || Object.getPrototypeOf(Syntax)).call(this, quill, options));

        if (typeof _this2.options.highlight !== 'function') {
          throw new Error('Syntax module requires highlight.js. Please include the library on the page before Quill.');
        }
        var timer = null;
        _this2.quill.on(_quill2.default.events.SCROLL_OPTIMIZE, function () {
          clearTimeout(timer);
          timer = setTimeout(function () {
            _this2.highlight();
            timer = null;
          }, _this2.options.interval);
        });
        _this2.highlight();
        return _this2;
      }

      _createClass(Syntax, [{
        key: 'highlight',
        value: function highlight() {
          var _this3 = this;

          if (this.quill.selection.composing) return;
          this.quill.update(_quill2.default.sources.USER);
          var range = this.quill.getSelection();
          this.quill.scroll.descendants(SyntaxCodeBlock).forEach(function (code) {
            code.highlight(_this3.options.highlight);
          });
          this.quill.update(_quill2.default.sources.SILENT);
          if (range != null) {
            this.quill.setSelection(range, _quill2.default.sources.SILENT);
          }
        }
      }]);

      return Syntax;
    }(_module2.default);

    Syntax.DEFAULTS = {
      highlight: function () {
        if (window.hljs == null) return null;
        return function (text) {
          var result = window.hljs.highlightAuto(text);
          return result.value;
        };
      }(),
      interval: 1000
    };

    exports.CodeBlock = SyntaxCodeBlock;
    exports.CodeToken = CodeToken;
    exports.default = Syntax;

    /***/ }),
    /* 76 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=15 y1=9 y2=9></line> <line class=ql-stroke x1=3 x2=13 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=9 y1=4 y2=4></line> </svg>";

    /***/ }),
    /* 77 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=15 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=14 x2=4 y1=14 y2=14></line> <line class=ql-stroke x1=12 x2=6 y1=4 y2=4></line> </svg>";

    /***/ }),
    /* 78 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=15 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=15 x2=5 y1=14 y2=14></line> <line class=ql-stroke x1=15 x2=9 y1=4 y2=4></line> </svg>";

    /***/ }),
    /* 79 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=15 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=15 x2=3 y1=14 y2=14></line> <line class=ql-stroke x1=15 x2=3 y1=4 y2=4></line> </svg>";

    /***/ }),
    /* 80 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <g class=\"ql-fill ql-color-label\"> <polygon points=\"6 6.868 6 6 5 6 5 7 5.942 7 6 6.868\"></polygon> <rect height=1 width=1 x=4 y=4></rect> <polygon points=\"6.817 5 6 5 6 6 6.38 6 6.817 5\"></polygon> <rect height=1 width=1 x=2 y=6></rect> <rect height=1 width=1 x=3 y=5></rect> <rect height=1 width=1 x=4 y=7></rect> <polygon points=\"4 11.439 4 11 3 11 3 12 3.755 12 4 11.439\"></polygon> <rect height=1 width=1 x=2 y=12></rect> <rect height=1 width=1 x=2 y=9></rect> <rect height=1 width=1 x=2 y=15></rect> <polygon points=\"4.63 10 4 10 4 11 4.192 11 4.63 10\"></polygon> <rect height=1 width=1 x=3 y=8></rect> <path d=M10.832,4.2L11,4.582V4H10.708A1.948,1.948,0,0,1,10.832,4.2Z></path> <path d=M7,4.582L7.168,4.2A1.929,1.929,0,0,1,7.292,4H7V4.582Z></path> <path d=M8,13H7.683l-0.351.8a1.933,1.933,0,0,1-.124.2H8V13Z></path> <rect height=1 width=1 x=12 y=2></rect> <rect height=1 width=1 x=11 y=3></rect> <path d=M9,3H8V3.282A1.985,1.985,0,0,1,9,3Z></path> <rect height=1 width=1 x=2 y=3></rect> <rect height=1 width=1 x=6 y=2></rect> <rect height=1 width=1 x=3 y=2></rect> <rect height=1 width=1 x=5 y=3></rect> <rect height=1 width=1 x=9 y=2></rect> <rect height=1 width=1 x=15 y=14></rect> <polygon points=\"13.447 10.174 13.469 10.225 13.472 10.232 13.808 11 14 11 14 10 13.37 10 13.447 10.174\"></polygon> <rect height=1 width=1 x=13 y=7></rect> <rect height=1 width=1 x=15 y=5></rect> <rect height=1 width=1 x=14 y=6></rect> <rect height=1 width=1 x=15 y=8></rect> <rect height=1 width=1 x=14 y=9></rect> <path d=M3.775,14H3v1H4V14.314A1.97,1.97,0,0,1,3.775,14Z></path> <rect height=1 width=1 x=14 y=3></rect> <polygon points=\"12 6.868 12 6 11.62 6 12 6.868\"></polygon> <rect height=1 width=1 x=15 y=2></rect> <rect height=1 width=1 x=12 y=5></rect> <rect height=1 width=1 x=13 y=4></rect> <polygon points=\"12.933 9 13 9 13 8 12.495 8 12.933 9\"></polygon> <rect height=1 width=1 x=9 y=14></rect> <rect height=1 width=1 x=8 y=15></rect> <path d=M6,14.926V15H7V14.316A1.993,1.993,0,0,1,6,14.926Z></path> <rect height=1 width=1 x=5 y=15></rect> <path d=M10.668,13.8L10.317,13H10v1h0.792A1.947,1.947,0,0,1,10.668,13.8Z></path> <rect height=1 width=1 x=11 y=15></rect> <path d=M14.332,12.2a1.99,1.99,0,0,1,.166.8H15V12H14.245Z></path> <rect height=1 width=1 x=14 y=15></rect> <rect height=1 width=1 x=15 y=11></rect> </g> <polyline class=ql-stroke points=\"5.5 13 9 5 12.5 13\"></polyline> <line class=ql-stroke x1=11.63 x2=6.38 y1=11 y2=11></line> </svg>";

    /***/ }),
    /* 81 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <rect class=\"ql-fill ql-stroke\" height=3 width=3 x=4 y=5></rect> <rect class=\"ql-fill ql-stroke\" height=3 width=3 x=11 y=5></rect> <path class=\"ql-even ql-fill ql-stroke\" d=M7,8c0,4.031-3,5-3,5></path> <path class=\"ql-even ql-fill ql-stroke\" d=M14,8c0,4.031-3,5-3,5></path> </svg>";

    /***/ }),
    /* 82 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-stroke d=M5,4H9.5A2.5,2.5,0,0,1,12,6.5v0A2.5,2.5,0,0,1,9.5,9H5A0,0,0,0,1,5,9V4A0,0,0,0,1,5,4Z></path> <path class=ql-stroke d=M5,9h5.5A2.5,2.5,0,0,1,13,11.5v0A2.5,2.5,0,0,1,10.5,14H5a0,0,0,0,1,0,0V9A0,0,0,0,1,5,9Z></path> </svg>";

    /***/ }),
    /* 83 */
    /***/ (function(module, exports) {

    module.exports = "<svg class=\"\" viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=5 x2=13 y1=3 y2=3></line> <line class=ql-stroke x1=6 x2=9.35 y1=12 y2=3></line> <line class=ql-stroke x1=11 x2=15 y1=11 y2=15></line> <line class=ql-stroke x1=15 x2=11 y1=11 y2=15></line> <rect class=ql-fill height=1 rx=0.5 ry=0.5 width=7 x=2 y=14></rect> </svg>";

    /***/ }),
    /* 84 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=\"ql-color-label ql-stroke ql-transparent\" x1=3 x2=15 y1=15 y2=15></line> <polyline class=ql-stroke points=\"5.5 11 9 3 12.5 11\"></polyline> <line class=ql-stroke x1=11.63 x2=6.38 y1=9 y2=9></line> </svg>";

    /***/ }),
    /* 85 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <polygon class=\"ql-stroke ql-fill\" points=\"3 11 5 9 3 7 3 11\"></polygon> <line class=\"ql-stroke ql-fill\" x1=15 x2=11 y1=4 y2=4></line> <path class=ql-fill d=M11,3a3,3,0,0,0,0,6h1V3H11Z></path> <rect class=ql-fill height=11 width=1 x=11 y=4></rect> <rect class=ql-fill height=11 width=1 x=13 y=4></rect> </svg>";

    /***/ }),
    /* 86 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <polygon class=\"ql-stroke ql-fill\" points=\"15 12 13 10 15 8 15 12\"></polygon> <line class=\"ql-stroke ql-fill\" x1=9 x2=5 y1=4 y2=4></line> <path class=ql-fill d=M5,3A3,3,0,0,0,5,9H6V3H5Z></path> <rect class=ql-fill height=11 width=1 x=5 y=4></rect> <rect class=ql-fill height=11 width=1 x=7 y=4></rect> </svg>";

    /***/ }),
    /* 87 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M14,16H4a1,1,0,0,1,0-2H14A1,1,0,0,1,14,16Z /> <path class=ql-fill d=M14,4H4A1,1,0,0,1,4,2H14A1,1,0,0,1,14,4Z /> <rect class=ql-fill x=3 y=6 width=12 height=6 rx=1 ry=1 /> </svg>";

    /***/ }),
    /* 88 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M13,16H5a1,1,0,0,1,0-2h8A1,1,0,0,1,13,16Z /> <path class=ql-fill d=M13,4H5A1,1,0,0,1,5,2h8A1,1,0,0,1,13,4Z /> <rect class=ql-fill x=2 y=6 width=14 height=6 rx=1 ry=1 /> </svg>";

    /***/ }),
    /* 89 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M15,8H13a1,1,0,0,1,0-2h2A1,1,0,0,1,15,8Z /> <path class=ql-fill d=M15,12H13a1,1,0,0,1,0-2h2A1,1,0,0,1,15,12Z /> <path class=ql-fill d=M15,16H5a1,1,0,0,1,0-2H15A1,1,0,0,1,15,16Z /> <path class=ql-fill d=M15,4H5A1,1,0,0,1,5,2H15A1,1,0,0,1,15,4Z /> <rect class=ql-fill x=2 y=6 width=8 height=6 rx=1 ry=1 /> </svg>";

    /***/ }),
    /* 90 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M5,8H3A1,1,0,0,1,3,6H5A1,1,0,0,1,5,8Z /> <path class=ql-fill d=M5,12H3a1,1,0,0,1,0-2H5A1,1,0,0,1,5,12Z /> <path class=ql-fill d=M13,16H3a1,1,0,0,1,0-2H13A1,1,0,0,1,13,16Z /> <path class=ql-fill d=M13,4H3A1,1,0,0,1,3,2H13A1,1,0,0,1,13,4Z /> <rect class=ql-fill x=8 y=6 width=8 height=6 rx=1 ry=1 transform=\"translate(24 18) rotate(-180)\"/> </svg>";

    /***/ }),
    /* 91 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M11.759,2.482a2.561,2.561,0,0,0-3.53.607A7.656,7.656,0,0,0,6.8,6.2C6.109,9.188,5.275,14.677,4.15,14.927a1.545,1.545,0,0,0-1.3-.933A0.922,0.922,0,0,0,2,15.036S1.954,16,4.119,16s3.091-2.691,3.7-5.553c0.177-.826.36-1.726,0.554-2.6L8.775,6.2c0.381-1.421.807-2.521,1.306-2.676a1.014,1.014,0,0,0,1.02.56A0.966,0.966,0,0,0,11.759,2.482Z></path> <rect class=ql-fill height=1.6 rx=0.8 ry=0.8 width=5 x=5.15 y=6.2></rect> <path class=ql-fill d=M13.663,12.027a1.662,1.662,0,0,1,.266-0.276q0.193,0.069.456,0.138a2.1,2.1,0,0,0,.535.069,1.075,1.075,0,0,0,.767-0.3,1.044,1.044,0,0,0,.314-0.8,0.84,0.84,0,0,0-.238-0.619,0.8,0.8,0,0,0-.594-0.239,1.154,1.154,0,0,0-.781.3,4.607,4.607,0,0,0-.781,1q-0.091.15-.218,0.346l-0.246.38c-0.068-.288-0.137-0.582-0.212-0.885-0.459-1.847-2.494-.984-2.941-0.8-0.482.2-.353,0.647-0.094,0.529a0.869,0.869,0,0,1,1.281.585c0.217,0.751.377,1.436,0.527,2.038a5.688,5.688,0,0,1-.362.467,2.69,2.69,0,0,1-.264.271q-0.221-.08-0.471-0.147a2.029,2.029,0,0,0-.522-0.066,1.079,1.079,0,0,0-.768.3A1.058,1.058,0,0,0,9,15.131a0.82,0.82,0,0,0,.832.852,1.134,1.134,0,0,0,.787-0.3,5.11,5.11,0,0,0,.776-0.993q0.141-.219.215-0.34c0.046-.076.122-0.194,0.223-0.346a2.786,2.786,0,0,0,.918,1.726,2.582,2.582,0,0,0,2.376-.185c0.317-.181.212-0.565,0-0.494A0.807,0.807,0,0,1,14.176,15a5.159,5.159,0,0,1-.913-2.446l0,0Q13.487,12.24,13.663,12.027Z></path> </svg>";

    /***/ }),
    /* 92 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewBox=\"0 0 18 18\"> <path class=ql-fill d=M10,4V14a1,1,0,0,1-2,0V10H3v4a1,1,0,0,1-2,0V4A1,1,0,0,1,3,4V8H8V4a1,1,0,0,1,2,0Zm6.06787,9.209H14.98975V7.59863a.54085.54085,0,0,0-.605-.60547h-.62744a1.01119,1.01119,0,0,0-.748.29688L11.645,8.56641a.5435.5435,0,0,0-.022.8584l.28613.30762a.53861.53861,0,0,0,.84717.0332l.09912-.08789a1.2137,1.2137,0,0,0,.2417-.35254h.02246s-.01123.30859-.01123.60547V13.209H12.041a.54085.54085,0,0,0-.605.60547v.43945a.54085.54085,0,0,0,.605.60547h4.02686a.54085.54085,0,0,0,.605-.60547v-.43945A.54085.54085,0,0,0,16.06787,13.209Z /> </svg>";

    /***/ }),
    /* 93 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewBox=\"0 0 18 18\"> <path class=ql-fill d=M16.73975,13.81445v.43945a.54085.54085,0,0,1-.605.60547H11.855a.58392.58392,0,0,1-.64893-.60547V14.0127c0-2.90527,3.39941-3.42187,3.39941-4.55469a.77675.77675,0,0,0-.84717-.78125,1.17684,1.17684,0,0,0-.83594.38477c-.2749.26367-.561.374-.85791.13184l-.4292-.34082c-.30811-.24219-.38525-.51758-.1543-.81445a2.97155,2.97155,0,0,1,2.45361-1.17676,2.45393,2.45393,0,0,1,2.68408,2.40918c0,2.45312-3.1792,2.92676-3.27832,3.93848h2.79443A.54085.54085,0,0,1,16.73975,13.81445ZM9,3A.99974.99974,0,0,0,8,4V8H3V4A1,1,0,0,0,1,4V14a1,1,0,0,0,2,0V10H8v4a1,1,0,0,0,2,0V4A.99974.99974,0,0,0,9,3Z /> </svg>";

    /***/ }),
    /* 94 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=7 x2=13 y1=4 y2=4></line> <line class=ql-stroke x1=5 x2=11 y1=14 y2=14></line> <line class=ql-stroke x1=8 x2=10 y1=14 y2=4></line> </svg>";

    /***/ }),
    /* 95 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <rect class=ql-stroke height=10 width=12 x=3 y=4></rect> <circle class=ql-fill cx=6 cy=7 r=1></circle> <polyline class=\"ql-even ql-fill\" points=\"5 12 5 11 7 9 8 10 11 7 13 9 13 12 5 12\"></polyline> </svg>";

    /***/ }),
    /* 96 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=15 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=9 x2=15 y1=9 y2=9></line> <polyline class=\"ql-fill ql-stroke\" points=\"3 7 3 11 5 9 3 7\"></polyline> </svg>";

    /***/ }),
    /* 97 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=15 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=9 x2=15 y1=9 y2=9></line> <polyline class=ql-stroke points=\"5 7 5 11 3 9 5 7\"></polyline> </svg>";

    /***/ }),
    /* 98 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=7 x2=11 y1=7 y2=11></line> <path class=\"ql-even ql-stroke\" d=M8.9,4.577a3.476,3.476,0,0,1,.36,4.679A3.476,3.476,0,0,1,4.577,8.9C3.185,7.5,2.035,6.4,4.217,4.217S7.5,3.185,8.9,4.577Z></path> <path class=\"ql-even ql-stroke\" d=M13.423,9.1a3.476,3.476,0,0,0-4.679-.36,3.476,3.476,0,0,0,.36,4.679c1.392,1.392,2.5,2.542,4.679.36S14.815,10.5,13.423,9.1Z></path> </svg>";

    /***/ }),
    /* 99 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=7 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=7 x2=15 y1=9 y2=9></line> <line class=ql-stroke x1=7 x2=15 y1=14 y2=14></line> <line class=\"ql-stroke ql-thin\" x1=2.5 x2=4.5 y1=5.5 y2=5.5></line> <path class=ql-fill d=M3.5,6A0.5,0.5,0,0,1,3,5.5V3.085l-0.276.138A0.5,0.5,0,0,1,2.053,3c-0.124-.247-0.023-0.324.224-0.447l1-.5A0.5,0.5,0,0,1,4,2.5v3A0.5,0.5,0,0,1,3.5,6Z></path> <path class=\"ql-stroke ql-thin\" d=M4.5,10.5h-2c0-.234,1.85-1.076,1.85-2.234A0.959,0.959,0,0,0,2.5,8.156></path> <path class=\"ql-stroke ql-thin\" d=M2.5,14.846a0.959,0.959,0,0,0,1.85-.109A0.7,0.7,0,0,0,3.75,14a0.688,0.688,0,0,0,.6-0.736,0.959,0.959,0,0,0-1.85-.109></path> </svg>";

    /***/ }),
    /* 100 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=6 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=6 x2=15 y1=9 y2=9></line> <line class=ql-stroke x1=6 x2=15 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=3 y1=4 y2=4></line> <line class=ql-stroke x1=3 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=3 x2=3 y1=14 y2=14></line> </svg>";

    /***/ }),
    /* 101 */
    /***/ (function(module, exports) {

    module.exports = "<svg class=\"\" viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=9 x2=15 y1=4 y2=4></line> <polyline class=ql-stroke points=\"3 4 4 5 6 3\"></polyline> <line class=ql-stroke x1=9 x2=15 y1=14 y2=14></line> <polyline class=ql-stroke points=\"3 14 4 15 6 13\"></polyline> <line class=ql-stroke x1=9 x2=15 y1=9 y2=9></line> <polyline class=ql-stroke points=\"3 9 4 10 6 8\"></polyline> </svg>";

    /***/ }),
    /* 102 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M15.5,15H13.861a3.858,3.858,0,0,0,1.914-2.975,1.8,1.8,0,0,0-1.6-1.751A1.921,1.921,0,0,0,12.021,11.7a0.50013,0.50013,0,1,0,.957.291h0a0.914,0.914,0,0,1,1.053-.725,0.81,0.81,0,0,1,.744.762c0,1.076-1.16971,1.86982-1.93971,2.43082A1.45639,1.45639,0,0,0,12,15.5a0.5,0.5,0,0,0,.5.5h3A0.5,0.5,0,0,0,15.5,15Z /> <path class=ql-fill d=M9.65,5.241a1,1,0,0,0-1.409.108L6,7.964,3.759,5.349A1,1,0,0,0,2.192,6.59178Q2.21541,6.6213,2.241,6.649L4.684,9.5,2.241,12.35A1,1,0,0,0,3.71,13.70722q0.02557-.02768.049-0.05722L6,11.036,8.241,13.65a1,1,0,1,0,1.567-1.24277Q9.78459,12.3777,9.759,12.35L7.316,9.5,9.759,6.651A1,1,0,0,0,9.65,5.241Z /> </svg>";

    /***/ }),
    /* 103 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M15.5,7H13.861a4.015,4.015,0,0,0,1.914-2.975,1.8,1.8,0,0,0-1.6-1.751A1.922,1.922,0,0,0,12.021,3.7a0.5,0.5,0,1,0,.957.291,0.917,0.917,0,0,1,1.053-.725,0.81,0.81,0,0,1,.744.762c0,1.077-1.164,1.925-1.934,2.486A1.423,1.423,0,0,0,12,7.5a0.5,0.5,0,0,0,.5.5h3A0.5,0.5,0,0,0,15.5,7Z /> <path class=ql-fill d=M9.651,5.241a1,1,0,0,0-1.41.108L6,7.964,3.759,5.349a1,1,0,1,0-1.519,1.3L4.683,9.5,2.241,12.35a1,1,0,1,0,1.519,1.3L6,11.036,8.241,13.65a1,1,0,0,0,1.519-1.3L7.317,9.5,9.759,6.651A1,1,0,0,0,9.651,5.241Z /> </svg>";

    /***/ }),
    /* 104 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <line class=\"ql-stroke ql-thin\" x1=15.5 x2=2.5 y1=8.5 y2=9.5></line> <path class=ql-fill d=M9.007,8C6.542,7.791,6,7.519,6,6.5,6,5.792,7.283,5,9,5c1.571,0,2.765.679,2.969,1.309a1,1,0,0,0,1.9-.617C13.356,4.106,11.354,3,9,3,6.2,3,4,4.538,4,6.5a3.2,3.2,0,0,0,.5,1.843Z></path> <path class=ql-fill d=M8.984,10C11.457,10.208,12,10.479,12,11.5c0,0.708-1.283,1.5-3,1.5-1.571,0-2.765-.679-2.969-1.309a1,1,0,1,0-1.9.617C4.644,13.894,6.646,15,9,15c2.8,0,5-1.538,5-3.5a3.2,3.2,0,0,0-.5-1.843Z></path> </svg>";

    /***/ }),
    /* 105 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <path class=ql-stroke d=M5,3V9a4.012,4.012,0,0,0,4,4H9a4.012,4.012,0,0,0,4-4V3></path> <rect class=ql-fill height=1 rx=0.5 ry=0.5 width=12 x=3 y=15></rect> </svg>";

    /***/ }),
    /* 106 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <rect class=ql-stroke height=12 width=12 x=3 y=3></rect> <rect class=ql-fill height=12 width=1 x=5 y=3></rect> <rect class=ql-fill height=12 width=1 x=12 y=3></rect> <rect class=ql-fill height=2 width=8 x=5 y=8></rect> <rect class=ql-fill height=1 width=3 x=3 y=5></rect> <rect class=ql-fill height=1 width=3 x=3 y=7></rect> <rect class=ql-fill height=1 width=3 x=3 y=10></rect> <rect class=ql-fill height=1 width=3 x=3 y=12></rect> <rect class=ql-fill height=1 width=3 x=12 y=5></rect> <rect class=ql-fill height=1 width=3 x=12 y=7></rect> <rect class=ql-fill height=1 width=3 x=12 y=10></rect> <rect class=ql-fill height=1 width=3 x=12 y=12></rect> </svg>";

    /***/ }),
    /* 107 */
    /***/ (function(module, exports) {

    module.exports = "<svg viewbox=\"0 0 18 18\"> <polygon class=ql-stroke points=\"7 11 9 13 11 11 7 11\"></polygon> <polygon class=ql-stroke points=\"7 7 9 5 11 7 7 7\"></polygon> </svg>";

    /***/ }),
    /* 108 */
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = exports.BubbleTooltip = undefined;

    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _extend = __webpack_require__(3);

    var _extend2 = _interopRequireDefault(_extend);

    var _emitter = __webpack_require__(8);

    var _emitter2 = _interopRequireDefault(_emitter);

    var _base = __webpack_require__(43);

    var _base2 = _interopRequireDefault(_base);

    var _selection = __webpack_require__(15);

    var _icons = __webpack_require__(41);

    var _icons2 = _interopRequireDefault(_icons);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var TOOLBAR_CONFIG = [['bold', 'italic', 'link'], [{ header: 1 }, { header: 2 }, 'blockquote']];

    var BubbleTheme = function (_BaseTheme) {
      _inherits(BubbleTheme, _BaseTheme);

      function BubbleTheme(quill, options) {
        _classCallCheck(this, BubbleTheme);

        if (options.modules.toolbar != null && options.modules.toolbar.container == null) {
          options.modules.toolbar.container = TOOLBAR_CONFIG;
        }

        var _this = _possibleConstructorReturn(this, (BubbleTheme.__proto__ || Object.getPrototypeOf(BubbleTheme)).call(this, quill, options));

        _this.quill.container.classList.add('ql-bubble');
        return _this;
      }

      _createClass(BubbleTheme, [{
        key: 'extendToolbar',
        value: function extendToolbar(toolbar) {
          this.tooltip = new BubbleTooltip(this.quill, this.options.bounds);
          this.tooltip.root.appendChild(toolbar.container);
          this.buildButtons([].slice.call(toolbar.container.querySelectorAll('button')), _icons2.default);
          this.buildPickers([].slice.call(toolbar.container.querySelectorAll('select')), _icons2.default);
        }
      }]);

      return BubbleTheme;
    }(_base2.default);

    BubbleTheme.DEFAULTS = (0, _extend2.default)(true, {}, _base2.default.DEFAULTS, {
      modules: {
        toolbar: {
          handlers: {
            link: function link(value) {
              if (!value) {
                this.quill.format('link', false);
              } else {
                this.quill.theme.tooltip.edit();
              }
            }
          }
        }
      }
    });

    var BubbleTooltip = function (_BaseTooltip) {
      _inherits(BubbleTooltip, _BaseTooltip);

      function BubbleTooltip(quill, bounds) {
        _classCallCheck(this, BubbleTooltip);

        var _this2 = _possibleConstructorReturn(this, (BubbleTooltip.__proto__ || Object.getPrototypeOf(BubbleTooltip)).call(this, quill, bounds));

        _this2.quill.on(_emitter2.default.events.EDITOR_CHANGE, function (type, range, oldRange, source) {
          if (type !== _emitter2.default.events.SELECTION_CHANGE) return;
          if (range != null && range.length > 0 && source === _emitter2.default.sources.USER) {
            _this2.show();
            // Lock our width so we will expand beyond our offsetParent boundaries
            _this2.root.style.left = '0px';
            _this2.root.style.width = '';
            _this2.root.style.width = _this2.root.offsetWidth + 'px';
            var lines = _this2.quill.getLines(range.index, range.length);
            if (lines.length === 1) {
              _this2.position(_this2.quill.getBounds(range));
            } else {
              var lastLine = lines[lines.length - 1];
              var index = _this2.quill.getIndex(lastLine);
              var length = Math.min(lastLine.length() - 1, range.index + range.length - index);
              var _bounds = _this2.quill.getBounds(new _selection.Range(index, length));
              _this2.position(_bounds);
            }
          } else if (document.activeElement !== _this2.textbox && _this2.quill.hasFocus()) {
            _this2.hide();
          }
        });
        return _this2;
      }

      _createClass(BubbleTooltip, [{
        key: 'listen',
        value: function listen() {
          var _this3 = this;

          _get(BubbleTooltip.prototype.__proto__ || Object.getPrototypeOf(BubbleTooltip.prototype), 'listen', this).call(this);
          this.root.querySelector('.ql-close').addEventListener('click', function () {
            _this3.root.classList.remove('ql-editing');
          });
          this.quill.on(_emitter2.default.events.SCROLL_OPTIMIZE, function () {
            // Let selection be restored by toolbar handlers before repositioning
            setTimeout(function () {
              if (_this3.root.classList.contains('ql-hidden')) return;
              var range = _this3.quill.getSelection();
              if (range != null) {
                _this3.position(_this3.quill.getBounds(range));
              }
            }, 1);
          });
        }
      }, {
        key: 'cancel',
        value: function cancel() {
          this.show();
        }
      }, {
        key: 'position',
        value: function position(reference) {
          var shift = _get(BubbleTooltip.prototype.__proto__ || Object.getPrototypeOf(BubbleTooltip.prototype), 'position', this).call(this, reference);
          var arrow = this.root.querySelector('.ql-tooltip-arrow');
          arrow.style.marginLeft = '';
          if (shift === 0) return shift;
          arrow.style.marginLeft = -1 * shift - arrow.offsetWidth / 2 + 'px';
        }
      }]);

      return BubbleTooltip;
    }(_base.BaseTooltip);

    BubbleTooltip.TEMPLATE = ['<span class="ql-tooltip-arrow"></span>', '<div class="ql-tooltip-editor">', '<input type="text" data-formula="e=mc^2" data-link="https://quilljs.com" data-video="Embed URL">', '<a class="ql-close"></a>', '</div>'].join('');

    exports.BubbleTooltip = BubbleTooltip;
    exports.default = BubbleTheme;

    /***/ }),
    /* 109 */
    /***/ (function(module, exports, __webpack_require__) {

    module.exports = __webpack_require__(63);


    /***/ })
    /******/ ])["default"];
    });
    });

    var Quill = /*@__PURE__*/getDefaultExportFromCjs(quill);

    /* src\Editor.svelte generated by Svelte v3.31.0 */
    const file$a = "src\\Editor.svelte";

    function create_fragment$a(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			add_location(div0, file$a, 35, 4, 976);
    			attr_dev(div1, "class", "editor-wrapper");
    			add_location(div1, file$a, 34, 4, 942);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			/*div0_binding*/ ctx[6](div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*div0_binding*/ ctx[6](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $content,
    		$$unsubscribe_content = noop,
    		$$subscribe_content = () => ($$unsubscribe_content(), $$unsubscribe_content = subscribe(content, $$value => $$invalidate(7, $content = $$value)), content);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_content());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Editor", slots, []);
    	let editor;

    	let { content } = $$props,
    		{ placeholder } = $$props,
    		{ part = "x" } = $$props,
    		{ type } = $$props,
    		{ subPart } = $$props;

    	validate_store(content, "content");
    	$$subscribe_content();

    	onMount(async () => {
    		let quill = new Quill(editor,
    		{
    				modules: {
    					toolbar: [
    						[{ header: [1, 2, 3, false] }],
    						["bold", "italic", "underline", "strike"],
    						["link"],
    						[{ "list": "ordered" }, { "list": "bullet" }]
    					]
    				},
    				theme: "snow",
    				placeholder
    			});

    		if (type == "section") {
    			quill.root.innerHTML = $content.sections[part][subPart];
    		} else quill.root.innerHTML = $content[part];

    		quill.on("text-change", function (delta, oldDelta, source) {
    			let newHTML = editor.getElementsByClassName("ql-editor")[0].innerHTML;

    			if (type == "section") {
    				set_store_value(content, $content.sections[part][subPart] = newHTML, $content);
    			} else {
    				set_store_value(content, $content[part] = newHTML, $content);
    			}
    		});
    	});

    	const writable_props = ["content", "placeholder", "part", "type", "subPart"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			editor = $$value;
    			$$invalidate(1, editor);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("content" in $$props) $$subscribe_content($$invalidate(0, content = $$props.content));
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("part" in $$props) $$invalidate(3, part = $$props.part);
    		if ("type" in $$props) $$invalidate(4, type = $$props.type);
    		if ("subPart" in $$props) $$invalidate(5, subPart = $$props.subPart);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Quill,
    		editor,
    		content,
    		placeholder,
    		part,
    		type,
    		subPart,
    		$content
    	});

    	$$self.$inject_state = $$props => {
    		if ("editor" in $$props) $$invalidate(1, editor = $$props.editor);
    		if ("content" in $$props) $$subscribe_content($$invalidate(0, content = $$props.content));
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("part" in $$props) $$invalidate(3, part = $$props.part);
    		if ("type" in $$props) $$invalidate(4, type = $$props.type);
    		if ("subPart" in $$props) $$invalidate(5, subPart = $$props.subPart);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [content, editor, placeholder, part, type, subPart, div0_binding];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			content: 0,
    			placeholder: 2,
    			part: 3,
    			type: 4,
    			subPart: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*content*/ ctx[0] === undefined && !("content" in props)) {
    			console.warn("<Editor> was created without expected prop 'content'");
    		}

    		if (/*placeholder*/ ctx[2] === undefined && !("placeholder" in props)) {
    			console.warn("<Editor> was created without expected prop 'placeholder'");
    		}

    		if (/*type*/ ctx[4] === undefined && !("type" in props)) {
    			console.warn("<Editor> was created without expected prop 'type'");
    		}

    		if (/*subPart*/ ctx[5] === undefined && !("subPart" in props)) {
    			console.warn("<Editor> was created without expected prop 'subPart'");
    		}
    	}

    	get content() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get part() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set part(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subPart() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subPart(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Slider.svelte generated by Svelte v3.31.0 */

    const file$9 = "src\\Slider.svelte";

    function create_fragment$9(ctx) {
    	let label;
    	let input;
    	let t;
    	let span;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t = space();
    			span = element("span");
    			attr_dev(input, "type", "checkbox");
    			input.checked = true;
    			attr_dev(input, "class", "svelte-1nw8w6f");
    			add_location(input, file$9, 5, 2, 68);
    			attr_dev(span, "class", "slider round svelte-1nw8w6f");
    			add_location(span, file$9, 6, 2, 103);
    			attr_dev(label, "class", "switch svelte-1nw8w6f");
    			add_location(label, file$9, 4, 0, 42);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t);
    			append_dev(label, span);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Slider", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Slider> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Slider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\Sec.svelte generated by Svelte v3.31.0 */

    const { console: console_1$1 } = globals;
    const file$8 = "src\\Sec.svelte";

    // (15:0) {#if $content.sections[index]}
    function create_if_block$3(ctx) {
    	let p0;
    	let t0_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][0] + "";
    	let t0;
    	let t1;
    	let textarea0;
    	let t2;
    	let p1;
    	let t3_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][1] + "";
    	let t3;
    	let t4;
    	let input0;
    	let input0_placeholder_value;
    	let slider0;
    	let t5;
    	let p2;
    	let t6_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][2] + "";
    	let t6;
    	let t7;
    	let editor;
    	let t8;
    	let p3;
    	let t9_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][3] + "";
    	let t9;
    	let t10;
    	let textarea1;
    	let textarea1_placeholder_value;
    	let t11;
    	let p4;
    	let t12_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][4] + "";
    	let t12;
    	let t13;
    	let input1;
    	let input1_placeholder_value;
    	let t14;
    	let slider1;
    	let t15;
    	let br;
    	let current;
    	let mounted;
    	let dispose;
    	slider0 = new Slider({ $$inline: true });

    	editor = new Editor({
    			props: {
    				content: /*content*/ ctx[2],
    				placeholder: /*lab*/ ctx[4][/*lang*/ ctx[0]][2],
    				type: "section",
    				part: /*index*/ ctx[1],
    				subPart: "text"
    			},
    			$$inline: true
    		});

    	slider1 = new Slider({ $$inline: true });

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			textarea0 = element("textarea");
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			input0 = element("input");
    			create_component(slider0.$$.fragment);
    			t5 = space();
    			p2 = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			create_component(editor.$$.fragment);
    			t8 = space();
    			p3 = element("p");
    			t9 = text(t9_value);
    			t10 = space();
    			textarea1 = element("textarea");
    			t11 = space();
    			p4 = element("p");
    			t12 = text(t12_value);
    			t13 = space();
    			input1 = element("input");
    			t14 = space();
    			create_component(slider1.$$.fragment);
    			t15 = space();
    			br = element("br");
    			attr_dev(p0, "class", "full inputlabel");
    			add_location(p0, file$8, 15, 0, 814);
    			attr_dev(textarea0, "type", "textarea");
    			attr_dev(textarea0, "class", "full inputlabel");
    			add_location(textarea0, file$8, 17, 1, 864);
    			attr_dev(p1, "class", "full inputlabel");
    			add_location(p1, file$8, 18, 1, 966);
    			attr_dev(input0, "class", "half");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", input0_placeholder_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][1]);
    			add_location(input0, file$8, 20, 1, 1016);
    			attr_dev(p2, "class", "full inputlabel");
    			add_location(p2, file$8, 21, 1, 1136);
    			attr_dev(p3, "class", "full inputlabel");
    			add_location(p3, file$8, 24, 1, 1427);
    			attr_dev(textarea1, "class", "full inputlabel");
    			attr_dev(textarea1, "type", "textarea");
    			attr_dev(textarea1, "style:width", "100%");
    			attr_dev(textarea1, "placeholder", textarea1_placeholder_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][3]);
    			add_location(textarea1, file$8, 25, 1, 1476);
    			attr_dev(p4, "class", "full inputlabel");
    			add_location(p4, file$8, 26, 1, 1620);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "half");
    			attr_dev(input1, "placeholder", input1_placeholder_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][4]);
    			add_location(input1, file$8, 27, 1, 1669);
    			add_location(br, file$8, 30, 1, 1794);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, textarea0, anchor);
    			set_input_value(textarea0, /*$content*/ ctx[3].sections[/*index*/ ctx[1]].subtitle);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*$content*/ ctx[3].sections[/*index*/ ctx[1]].graphic);
    			mount_component(slider0, target, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t6);
    			insert_dev(target, t7, anchor);
    			mount_component(editor, target, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, textarea1, anchor);
    			set_input_value(textarea1, /*$content*/ ctx[3].sections[/*index*/ ctx[1]].embed);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t12);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*$content*/ ctx[3].sections[/*index*/ ctx[1]].download);
    			insert_dev(target, t14, anchor);
    			mount_component(slider1, target, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, br, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[5]),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*lang*/ 1) && t0_value !== (t0_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][0] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$content, index*/ 10) {
    				set_input_value(textarea0, /*$content*/ ctx[3].sections[/*index*/ ctx[1]].subtitle);
    			}

    			if ((!current || dirty & /*lang*/ 1) && t3_value !== (t3_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][1] + "")) set_data_dev(t3, t3_value);

    			if (!current || dirty & /*lang*/ 1 && input0_placeholder_value !== (input0_placeholder_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][1])) {
    				attr_dev(input0, "placeholder", input0_placeholder_value);
    			}

    			if (dirty & /*$content, index*/ 10 && input0.value !== /*$content*/ ctx[3].sections[/*index*/ ctx[1]].graphic) {
    				set_input_value(input0, /*$content*/ ctx[3].sections[/*index*/ ctx[1]].graphic);
    			}

    			if ((!current || dirty & /*lang*/ 1) && t6_value !== (t6_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][2] + "")) set_data_dev(t6, t6_value);
    			const editor_changes = {};
    			if (dirty & /*content*/ 4) editor_changes.content = /*content*/ ctx[2];
    			if (dirty & /*lang*/ 1) editor_changes.placeholder = /*lab*/ ctx[4][/*lang*/ ctx[0]][2];
    			if (dirty & /*index*/ 2) editor_changes.part = /*index*/ ctx[1];
    			editor.$set(editor_changes);
    			if ((!current || dirty & /*lang*/ 1) && t9_value !== (t9_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][3] + "")) set_data_dev(t9, t9_value);

    			if (!current || dirty & /*lang*/ 1 && textarea1_placeholder_value !== (textarea1_placeholder_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][3])) {
    				attr_dev(textarea1, "placeholder", textarea1_placeholder_value);
    			}

    			if (dirty & /*$content, index*/ 10) {
    				set_input_value(textarea1, /*$content*/ ctx[3].sections[/*index*/ ctx[1]].embed);
    			}

    			if ((!current || dirty & /*lang*/ 1) && t12_value !== (t12_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][4] + "")) set_data_dev(t12, t12_value);

    			if (!current || dirty & /*lang*/ 1 && input1_placeholder_value !== (input1_placeholder_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][4])) {
    				attr_dev(input1, "placeholder", input1_placeholder_value);
    			}

    			if (dirty & /*$content, index*/ 10 && input1.value !== /*$content*/ ctx[3].sections[/*index*/ ctx[1]].download) {
    				set_input_value(input1, /*$content*/ ctx[3].sections[/*index*/ ctx[1]].download);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(slider0.$$.fragment, local);
    			transition_in(editor.$$.fragment, local);
    			transition_in(slider1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slider0.$$.fragment, local);
    			transition_out(editor.$$.fragment, local);
    			transition_out(slider1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(textarea0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(input0);
    			destroy_component(slider0, detaching);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t7);
    			destroy_component(editor, detaching);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(textarea1);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t14);
    			destroy_component(slider1, detaching);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(br);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(15:0) {#if $content.sections[index]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$content*/ ctx[3].sections[/*index*/ ctx[1]] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$content*/ ctx[3].sections[/*index*/ ctx[1]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$content, index*/ 10) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $content,
    		$$unsubscribe_content = noop,
    		$$subscribe_content = () => ($$unsubscribe_content(), $$unsubscribe_content = subscribe(content, $$value => $$invalidate(3, $content = $$value)), content);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_content());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sec", slots, []);
    	let { lang } = $$props, { index } = $$props, { content } = $$props;
    	validate_store(content, "content");
    	$$subscribe_content();

    	let lab = {
    		E: [
    			"subtitle",
    			"optional decorative graphic",
    			"text content",
    			"embed code for chart or table",
    			"URL for data download"
    		],
    		F: [
    			"sous-titre",
    			"graphique décoratif facultatif",
    			"contenu textuel",
    			"code d'intégration pour le graphique ou le tableau",
    			"URL de téléchargement des données"
    		],
    		P: [
    			"legenda",
    			"gráfico decorativo opcional",
    			"conteúdo de texto",
    			"código incorporado para gráfico ou tabela",
    			"URL para download de dados"
    		],
    		S: [
    			"subtítulo",
    			"gráfico decorativo opcional",
    			"contenido de texto",
    			"código incrustado para gráfico o tabla",
    			"URL para descarga de datos"
    		]
    	};

    	console.log("content", $content, "index", index);
    	const writable_props = ["lang", "index", "content"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Sec> was created with unknown prop '${key}'`);
    	});

    	function textarea0_input_handler() {
    		$content.sections[index].subtitle = this.value;
    		content.set($content);
    		$$invalidate(1, index);
    	}

    	function input0_input_handler() {
    		$content.sections[index].graphic = this.value;
    		content.set($content);
    		$$invalidate(1, index);
    	}

    	function textarea1_input_handler() {
    		$content.sections[index].embed = this.value;
    		content.set($content);
    		$$invalidate(1, index);
    	}

    	function input1_input_handler() {
    		$content.sections[index].download = this.value;
    		content.set($content);
    		$$invalidate(1, index);
    	}

    	$$self.$$set = $$props => {
    		if ("lang" in $$props) $$invalidate(0, lang = $$props.lang);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    		if ("content" in $$props) $$subscribe_content($$invalidate(2, content = $$props.content));
    	};

    	$$self.$capture_state = () => ({
    		Editor,
    		Slider,
    		lang,
    		index,
    		content,
    		lab,
    		$content
    	});

    	$$self.$inject_state = $$props => {
    		if ("lang" in $$props) $$invalidate(0, lang = $$props.lang);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    		if ("content" in $$props) $$subscribe_content($$invalidate(2, content = $$props.content));
    		if ("lab" in $$props) $$invalidate(4, lab = $$props.lab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		lang,
    		index,
    		content,
    		$content,
    		lab,
    		textarea0_input_handler,
    		input0_input_handler,
    		textarea1_input_handler,
    		input1_input_handler
    	];
    }

    class Sec extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { lang: 0, index: 1, content: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sec",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*lang*/ ctx[0] === undefined && !("lang" in props)) {
    			console_1$1.warn("<Sec> was created without expected prop 'lang'");
    		}

    		if (/*index*/ ctx[1] === undefined && !("index" in props)) {
    			console_1$1.warn("<Sec> was created without expected prop 'index'");
    		}

    		if (/*content*/ ctx[2] === undefined && !("content" in props)) {
    			console_1$1.warn("<Sec> was created without expected prop 'content'");
    		}
    	}

    	get lang() {
    		throw new Error("<Sec>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lang(value) {
    		throw new Error("<Sec>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Sec>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Sec>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get content() {
    		throw new Error("<Sec>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<Sec>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Box.svelte generated by Svelte v3.31.0 */

    const file$7 = "src\\Box.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let t;
    	let br;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			br = element("br");
    			attr_dev(div, "class", "svelte-ckbgro");
    			add_location(div, file$7, 0, 0, 0);
    			add_location(br, file$7, 3, 0, 31);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, br, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Box", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Box> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Box extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Box",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\Brain.svelte generated by Svelte v3.31.0 */

    const file$6 = "src\\Brain.svelte";

    function create_fragment$6(ctx) {
    	let svg;
    	let style;
    	let t;
    	let g;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			style = svg_element("style");
    			t = text(".st0{fill:#FFFFFF;}\r\n\tpath{fill:gold}\r\n");
    			g = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			attr_dev(style, "type", "text/css");
    			add_location(style, file$6, 1, 0, 71);
    			attr_dev(path0, "class", "st0");
    			attr_dev(path0, "d", "M494,538c-164.7,0-329.3,0-494,0C0,358.7,0,179.3,0,0c164.7,0,329.3,0,494,0C494,179.3,494,358.7,494,538z\r\n\t\t M85.8,361.3c1.1-0.1,2.2-0.2,3.4-0.3c5.4-0.7,8.7-4.9,8.3-10.3c-0.5-5.2-4.6-8.7-9.9-8.5c-0.9,0-1.8,0-2.7,0\r\n\t\tc-9.6-0.9-18.8-3.5-27.8-6.9c-3.9-1.5-7.6-3.3-11.2-5.4c-3.5-2.1-4-3.3-2.3-7c2.4-5.3,5-10.5,8-15.5c9.3-15.3,18.9-30.4,28.2-45.7\r\n\t\tc3.9-6.5,7-13.5,8.3-21c0.9-4.9,0.3-9.5-2.3-13.7c-1.8-2.9-3.8-5.7-6-8.2c-7.9-9.2-10.1-19.6-7.5-31.3c3.1-13.7,7.5-26.9,13.2-39.8\r\n\t\tc10.5-23.6,25-44.4,44.9-61C157.5,63.9,189.3,53,224.1,50c20.3-1.8,40.6-1,60.9,1.5c28.3,3.4,55.6,10.7,81.2,23.5\r\n\t\tc26.9,13.4,49.7,31.5,66.8,56.5c12.5,18.2,20.6,38.1,22.4,60.2c2.2,26.8-1.8,52.7-12.2,77.5c-15.9,37.8-43.2,65.2-78.9,84.5\r\n\t\tc-4.6,2.5-6.7,5.8-6.6,11c0.4,27,4.2,53.6,10.7,79.8c3.9,15.6,8.8,30.9,15.8,45.5c1.3,2.7,3,4.8,6,5.6c4.1,1.1,7.6-0.1,10.4-3.2\r\n\t\tc2.7-3,2.7-6.4,1.2-10c-3.3-8-6.9-15.9-9.6-24.1c-9.3-28.4-14-57.6-15.4-87.3c-0.1-1.7,0.5-2.5,1.9-3.3\r\n\t\tc13.9-7.8,26.6-17.1,38.1-28.1c30.2-28.8,48.8-63.8,55.6-105c3.8-22.7,4-45.3-2.2-67.6c-8.2-29.5-24.2-54.1-46.3-74.9\r\n\t\tc-23-21.7-50.1-36.6-79.9-46.6c-26.5-8.9-53.8-13.4-81.6-14.7c-21.4-1-42.6-0.2-63.7,4c-30.4,6.1-57.9,18.3-81.4,38.8\r\n\t\tc-34.5,30-54.4,68.6-64.1,112.7c-3.6,16.2,0.1,30.9,11,43.7c1.2,1.5,2.3,3.1,3.5,4.5c1.5,1.8,1.9,3.7,0.9,5.8\r\n\t\tc-2.9,6.2-5.3,12.6-8.8,18.4C52.2,271,43.9,283.5,36,296.1c-4.4,7.1-8.6,14.3-10.8,22.4C21.8,330.3,25,339,35,345.9\r\n\t\tc1.7,1.2,3.5,2.4,5.4,3.2c6.8,2.7,13.6,5.3,20.6,7.6c5.5,1.8,5.8,1.6,5,7.2c-1.1,8-2.2,16-4.1,23.8c-1.9,7.6-1,10.8,5.9,14.5\r\n\t\tc2.5,1.4,5,2.8,7.4,4.2c-2.1,3.2-4.2,5.9-5.8,8.9c-2.5,4.7-1.9,8,1.9,11.8c1.4,1.4,2.9,2.8,4.4,4.1c5.8,5,8.2,11.4,8.4,19\r\n\t\tc0.2,5.3,0.8,10.7,2.2,15.8c3.9,14.7,14.9,22.9,30.1,22.8c30.6-0.3,61.1-2.3,91.4-6.5c10-1.4,19.8-3.4,28.6-9\r\n\t\tc10.5-6.7,18.1-15.9,24.3-26.4c8.2-14,13.5-29.1,18.3-44.5c2.3-7.3,4.4-14.7,6.3-22.1c1.2-4.8-1.7-9.2-6.5-10.6\r\n\t\tc-5.1-1.5-9.6,0.6-11.5,5.3c-0.4,1-0.7,2.1-1,3.1c-3.1,10-5.9,20.1-9.2,30.1c-4,12.2-8.9,24.1-16.3,34.7\r\n\t\tc-7.7,11.1-17.8,18.5-31.7,20c-6.4,0.7-12.7,1.8-19.1,2.5c-24.7,2.8-49.5,4.3-74.3,4.5c-5.1,0-8.8-2.3-10.4-7\r\n\t\tc-1.2-3.6-2.1-7.6-2.1-11.4c-0.1-12-3.9-22.4-11.8-31.3c-0.9-1-1-1.8,0.1-2.7c2-1.7,4-3.5,6-5.3c4.8-4.1,4.8-11.3-0.2-14.9\r\n\t\tc-2.2-1.6-4.7-2.9-7-4.2c-2.4-1.4-4.9-2.6-7.2-4c-0.6-0.3-1.3-1.3-1.2-1.8C83,378.5,84.4,370.1,85.8,361.3z M244.4,259.8\r\n\t\tc-0.1,0.9,0,1.5-0.1,2c-4.5,26.7,15,50,42.1,50.5c11.6,0.2,21,8.2,22.7,19.6c1.6,10.5,2.9,21.1,4.4,31.7c0.8,5.7,5.2,9,10.8,8.2\r\n\t\tc5.6-0.8,8.9-5.3,8-11.2c-0.5-3.5-0.9-7.1-1.4-10.6c-1.2-8.3-1.9-16.8-3.8-24.9c-4.3-18.6-21-31.3-40.5-31.7\r\n\t\tc-13.4-0.3-23.6-10.4-24-23.5c-0.4-11.1,10-24,22.8-23.9c7.6,0,15.2-0.4,22.7-0.4c15.1,0,30.2,0.1,45.2,0.2c4.9,0,8.7,2.6,10.1,6.7\r\n\t\tc2.2,6.6-2.6,13.1-9.8,13.1c-14,0-28,0-42,0c-6.3,0-10.1,3.7-10.1,9.6c0,5.8,3.8,9.4,10,9.4c14.2,0,28.5,0.1,42.7,0\r\n\t\tc18.4-0.1,32-17.1,28-35.1c-0.5-2.3-0.1-3.1,2-4.1c14.8-7.3,23.2-19.3,24.4-35.7c1.2-16.7-5.2-30.1-19.2-39.5\r\n\t\tc-1.8-1.2-3.7-2.2-5.6-3.3c0.2-0.9,0.3-1.7,0.5-2.5c6.6-29.8-19.7-57.1-49.8-51.7c-1.8,0.3-2.6-0.1-3.4-1.8\r\n\t\tc-7.8-15.9-24.8-25.4-42.4-23.9c-6.2,0.5-12,2.4-17.6,5.3c-0.6-0.8-1.2-1.5-1.8-2.2c-3.4-4.3-7.5-7.8-12.3-10.4\r\n\t\tc-20.7-11.3-45.7-4.8-58.1,15.3c-1,1.6-1.9,1.6-3.6,1.5c-5.4-0.4-10.9-1.2-16.1-0.3c-22.9,3.8-38.2,24.1-36,47.2\r\n\t\tc0.2,1.9-0.4,2.7-2.1,3.5c-8.8,3.9-15.9,9.9-20.1,18.7c-7.6,15.6-6,31,2.7,45.6c8.5,14.3,21.3,21.6,38.1,21.4\r\n\t\tc9.5-0.1,19,0.2,28.5-0.1c4.2-0.1,7.3,0.5,8.2,5.1c0,0.2,0.1,0.3,0.2,0.4c7.9,13.9,19.7,21.4,35.7,22\r\n\t\tC237.7,259.9,241,259.8,244.4,259.8z");
    			add_location(path0, file$6, 6, 1, 152);
    			attr_dev(path1, "d", "M85.8,361.3c-1.4,8.8-2.8,17.2-4.1,25.7c-0.1,0.6,0.6,1.5,1.2,1.8c2.4,1.4,4.8,2.6,7.2,4c2.4,1.3,4.8,2.6,7,4.2\r\n\t\tc5,3.6,5,10.8,0.2,14.9c-2,1.7-4,3.5-6,5.3c-1.1,0.9-1,1.7-0.1,2.7c7.9,8.9,11.7,19.3,11.8,31.3c0,3.8,0.9,7.8,2.1,11.4\r\n\t\tc1.6,4.7,5.2,7.1,10.4,7c24.8-0.2,49.6-1.7,74.3-4.5c6.4-0.7,12.7-1.8,19.1-2.5c13.9-1.5,23.9-8.9,31.7-20\r\n\t\tc7.4-10.6,12.3-22.5,16.3-34.7c3.3-10,6.2-20.1,9.2-30.1c0.3-1,0.6-2.1,1-3.1c1.9-4.7,6.4-6.7,11.5-5.3c4.8,1.4,7.7,5.7,6.5,10.6\r\n\t\tc-1.9,7.4-4.1,14.8-6.3,22.1c-4.8,15.4-10.1,30.5-18.3,44.5c-6.2,10.5-13.8,19.8-24.3,26.4c-8.8,5.6-18.6,7.6-28.6,9\r\n\t\tc-30.3,4.2-60.8,6.3-91.4,6.5c-15.2,0.1-26.2-8.1-30.1-22.8c-1.4-5.1-2-10.5-2.2-15.8c-0.2-7.6-2.7-14-8.4-19\r\n\t\tc-1.5-1.3-3-2.7-4.4-4.1c-3.7-3.8-4.4-7-1.9-11.8c1.6-3,3.7-5.7,5.8-8.9c-2.4-1.3-4.9-2.8-7.4-4.2c-6.9-3.7-7.8-6.9-5.9-14.5\r\n\t\tc1.9-7.8,3-15.9,4.1-23.8c0.8-5.6,0.5-5.4-5-7.2c-6.9-2.3-13.8-4.9-20.6-7.6c-1.9-0.7-3.7-2-5.4-3.2c-10-6.9-13.2-15.6-9.9-27.4\r\n\t\tc2.3-8.1,6.4-15.4,10.8-22.4c7.9-12.6,16.2-25.1,23.9-37.8c3.5-5.8,5.9-12.3,8.8-18.4c1-2.1,0.6-4-0.9-5.8\r\n\t\tc-1.2-1.5-2.3-3.1-3.5-4.5c-10.9-12.7-14.6-27.5-11-43.7c9.7-44.1,29.6-82.7,64.1-112.7c23.5-20.4,51-32.7,81.4-38.8\r\n\t\tc21.1-4.2,42.3-5,63.7-4c27.9,1.3,55.1,5.8,81.6,14.7c29.8,10.1,56.8,25,79.9,46.6c22.1,20.8,38.1,45.5,46.3,74.9\r\n\t\tc6.2,22.4,6,45,2.2,67.6c-6.9,41.1-25.5,76.1-55.6,105c-11.5,11-24.3,20.3-38.1,28.1c-1.4,0.8-2,1.6-1.9,3.3\r\n\t\tc1.3,29.8,6.1,59,15.4,87.3c2.7,8.2,6.3,16.1,9.6,24.1c1.5,3.6,1.5,7-1.2,10c-2.8,3.1-6.2,4.4-10.4,3.2c-3-0.8-4.7-3-6-5.6\r\n\t\tc-7-14.5-11.9-29.8-15.8-45.5c-6.5-26.2-10.3-52.8-10.7-79.8c-0.1-5.2,2-8.5,6.6-11c35.7-19.3,63-46.7,78.9-84.5\r\n\t\tc10.4-24.8,14.4-50.8,12.2-77.5c-1.8-22.1-9.9-42-22.4-60.2c-17.1-24.9-40-43.1-66.8-56.5c-25.6-12.8-52.9-20.1-81.2-23.5\r\n\t\tc-20.2-2.4-40.5-3.3-60.9-1.5c-34.8,3.1-66.6,13.9-93.7,36.6c-19.9,16.7-34.4,37.4-44.9,61c-5.7,12.8-10.1,26.1-13.2,39.8\r\n\t\tc-2.7,11.7-0.4,22.1,7.5,31.3c2.2,2.6,4.2,5.4,6,8.2c2.6,4.2,3.2,8.8,2.3,13.7c-1.4,7.6-4.4,14.5-8.3,21\r\n\t\tc-9.2,15.3-18.9,30.4-28.2,45.7c-3,5-5.6,10.2-8,15.5c-1.7,3.7-1.3,5,2.3,7c3.6,2.1,7.3,3.9,11.2,5.4c9,3.4,18.2,6,27.8,6.9\r\n\t\tc0.9,0.1,1.8,0.1,2.7,0c5.3-0.2,9.4,3.3,9.9,8.5c0.5,5.4-2.8,9.6-8.3,10.3C88,361.2,86.9,361.2,85.8,361.3z");
    			add_location(path1, file$6, 37, 1, 3661);
    			attr_dev(path2, "d", "M244.4,259.8c-3.5,0-6.8,0.1-10.1,0c-16-0.6-27.8-8.1-35.7-22c-0.1-0.1-0.2-0.3-0.2-0.4c-0.9-4.6-4-5.2-8.2-5.1\r\n\t\tc-9.5,0.3-19,0-28.5,0.1c-16.8,0.1-29.6-7.2-38.1-21.4c-8.7-14.6-10.3-30-2.7-45.6c4.2-8.8,11.3-14.7,20.1-18.7\r\n\t\tc1.7-0.8,2.3-1.6,2.1-3.5c-2.2-23.1,13.1-43.4,36-47.2c5.2-0.9,10.8,0,16.1,0.3c1.7,0.1,2.6,0.1,3.6-1.5\r\n\t\tc12.5-20,37.5-26.6,58.1-15.3c4.8,2.6,8.9,6.1,12.3,10.4c0.6,0.7,1.2,1.4,1.8,2.2c5.6-2.9,11.4-4.8,17.6-5.3\r\n\t\tc17.6-1.4,34.6,8,42.4,23.9c0.8,1.7,1.6,2.1,3.4,1.8c30.1-5.4,56.3,21.9,49.8,51.7c-0.2,0.8-0.3,1.6-0.5,2.5\r\n\t\tc1.9,1.1,3.8,2.1,5.6,3.3c14,9.5,20.4,22.8,19.2,39.5c-1.2,16.5-9.6,28.4-24.4,35.7c-2,1-2.5,1.8-2,4.1c4,17.9-9.6,35-28,35.1\r\n\t\tc-14.2,0.1-28.5,0-42.7,0c-6.1,0-9.9-3.6-10-9.4c0-5.9,3.8-9.5,10.1-9.6c14,0,28,0,42,0c7.3,0,12.1-6.5,9.8-13.1\r\n\t\tc-1.4-4.1-5.2-6.7-10.1-6.7c-15.1-0.1-30.2-0.2-45.2-0.2c-7.6,0-15.2,0.5-22.7,0.4c-12.7-0.1-23.2,12.9-22.8,23.9\r\n\t\tc0.5,13.1,10.6,23.2,24,23.5c19.5,0.4,36.2,13.1,40.5,31.7c1.9,8.2,2.6,16.6,3.8,24.9c0.5,3.5,0.9,7.1,1.4,10.6\r\n\t\tc0.9,5.9-2.3,10.4-8,11.2c-5.6,0.8-10-2.5-10.8-8.2c-1.5-10.6-2.8-21.1-4.4-31.7c-1.7-11.4-11.1-19.4-22.7-19.6\r\n\t\tc-27.1-0.4-46.6-23.8-42.1-50.5C244.4,261.3,244.4,260.7,244.4,259.8z M268.8,196.9c-11.2,0-22.3-0.1-33.5,0\r\n\t\tc-8.4,0.1-15,3.7-19.3,10.9c-8.6,14.7,1.9,32.6,19.3,32.9c5.5,0.1,11,0,16.5,0.1c1.9,0,3.3-0.5,4.6-1.9c4.5-4.9,9.9-8.5,16.4-10\r\n\t\tc5.3-1.2,10.7-2.3,16-2.3c21.9-0.2,43.8-0.2,65.7,0.1c4,0.1,8,1.8,12,2.8c1,0.2,2.1,0.6,3.1,0.5c10.8-1.5,18.7-10,19.9-21.3\r\n\t\tc1.2-11.1-5.3-21.6-15.7-25.1c-3.3-1.1-6.8-1.5-10.2-2.2c-4.4-0.8-6.3-4.7-4.1-8.6c1.1-2,2.4-3.8,3.5-5.8\r\n\t\tc5.4-9.4,3.9-20.9-3.8-28.8c-7.7-7.9-18.8-9.8-28.4-4.7c-1.8,0.9-3.5,1.9-5.3,2.8c-3.9,2-7.7,0-8.4-4.3c-0.3-1.6-0.4-3.3-0.7-5\r\n\t\tc-1.5-9.8-6.8-16.7-16-20c-9.1-3.2-17.6-1.5-24.8,5.2c-1.8,1.7-3.5,3.6-5.2,5.4c-3.4,3.5-8.1,2.5-9.7-2.1c-0.8-2.1-1.3-4.3-2.2-6.4\r\n\t\tc-3.7-9.4-10.5-15-20.5-16.1c-9.9-1.1-17.4,3.4-22.3,11.7c-2.1,3.6-3.4,7.7-4.9,11.7c-1.4,3.8-4.8,5.3-8.4,3.4\r\n\t\tc-1.6-0.9-3.2-1.8-4.8-2.7c-9.1-5-19.9-3.8-27.7,3.1c-7.9,7-10.4,17.6-6.5,27.3c0.8,1.8,1.6,3.7,2.4,5.5c1.5,3.8-0.4,7.1-4.4,7.8\r\n\t\tc-1.2,0.2-2.5,0.3-3.7,0.5c-17.3,2.3-26.9,17.7-21,33.8c3.8,10.2,13.5,17.9,23.1,18c10.7,0.1,21.5,0,32.2,0.1c1.6,0,2.1-0.5,2.4-2\r\n\t\tc4.4-20.6,20.4-33.5,41.4-33.5c21.6,0,43.2,0,64.7,0c1.7,0,2.9-0.5,4.1-1.8c3.1-3.6,5-7.6,6-12.2c0.9-4.4,4.1-7.1,8.3-7.4\r\n\t\tc4.3-0.3,8.4,2,9.5,6.1c0.7,2.3,0.8,5,0.5,7.4c-0.6,5-3,9.3-5.9,13.3c-1.3,1.7-1.1,2.7,0.5,4.1c3.7,3.5,7,7.4,8.3,12.6\r\n\t\tc1.3,5.3-0.8,9.7-5.4,11.5c-4.7,1.8-9.3-0.1-12.1-4.6c-1.8-2.8-4-5.3-6.2-7.7c-1.6-1.7-3.6-2.3-6.1-2.3\r\n\t\tC291.1,197,280,196.9,268.8,196.9z");
    			add_location(path2, file$6, 56, 1, 5865);
    			attr_dev(path3, "class", "st0");
    			attr_dev(path3, "d", "M268.8,196.9c11.2,0,22.3,0.1,33.5-0.1c2.4,0,4.5,0.5,6.1,2.3c2.2,2.5,4.5,4.9,6.2,7.7\r\n\t\tc2.9,4.5,7.4,6.4,12.1,4.6c4.6-1.8,6.7-6.2,5.4-11.5c-1.3-5.1-4.5-9.1-8.3-12.6c-1.5-1.4-1.7-2.4-0.5-4.1c2.9-4,5.3-8.4,5.9-13.3\r\n\t\tc0.3-2.4,0.2-5-0.5-7.4c-1.2-4.1-5.2-6.4-9.5-6.1c-4.2,0.3-7.4,3-8.3,7.4c-1,4.6-2.9,8.7-6,12.2c-1.1,1.3-2.3,1.8-4.1,1.8\r\n\t\tc-21.6-0.1-43.2,0-64.7,0c-21,0-37,12.9-41.4,33.5c-0.3,1.5-0.9,2-2.4,2c-10.7-0.1-21.5,0-32.2-0.1c-9.6-0.1-19.3-7.8-23.1-18\r\n\t\tc-6-16,3.6-31.5,21-33.8c1.2-0.2,2.5-0.2,3.7-0.5c4-0.7,5.9-4.1,4.4-7.8c-0.7-1.9-1.6-3.7-2.4-5.5c-4-9.7-1.5-20.3,6.5-27.3\r\n\t\tc7.8-6.9,18.6-8.1,27.7-3.1c1.6,0.9,3.2,1.8,4.8,2.7c3.6,1.9,7,0.4,8.4-3.4c1.5-4,2.8-8.1,4.9-11.7c5-8.3,12.5-12.8,22.3-11.7\r\n\t\tc10,1.1,16.8,6.7,20.5,16.1c0.8,2.1,1.4,4.3,2.2,6.4c1.6,4.6,6.3,5.5,9.7,2.1c1.8-1.8,3.4-3.7,5.2-5.4c7.2-6.7,15.7-8.5,24.8-5.2\r\n\t\tc9.2,3.3,14.5,10.2,16,20c0.2,1.6,0.4,3.3,0.7,5c0.7,4.3,4.5,6.2,8.4,4.3c1.8-0.9,3.5-1.9,5.3-2.8c9.6-5.1,20.7-3.2,28.4,4.7\r\n\t\tc7.7,7.9,9.2,19.4,3.8,28.8c-1.1,2-2.4,3.8-3.5,5.8c-2.2,3.9-0.3,7.8,4.1,8.6c3.4,0.6,6.9,1.1,10.2,2.2c10.4,3.5,16.9,14,15.7,25.1\r\n\t\tc-1.2,11.3-9.1,19.8-19.9,21.3c-1,0.1-2.1-0.2-3.1-0.5c-4-1-8-2.7-12-2.8c-21.9-0.3-43.8-0.3-65.7-0.1c-5.4,0.1-10.8,1.2-16,2.3\r\n\t\tc-6.5,1.5-11.9,5.1-16.4,10c-1.3,1.4-2.7,1.9-4.6,1.9c-5.5-0.1-11,0.1-16.5-0.1c-17.4-0.4-27.9-18.2-19.3-32.9\r\n\t\tc4.2-7.3,10.8-10.9,19.3-10.9C246.5,196.9,257.6,196.9,268.8,196.9z M245.1,151.8c8.4,3.9,17.9,5,27.6,3.2c5.7-1.1,11.1-3,15.3-7.4\r\n\t\tc3.6-3.9,3.8-8.4,0.7-12.2c-3-3.7-7.9-4.5-12.4-2.1c-10.8,5.9-20.5,4.8-29.6-3.3c-1.2-1.1-2.3-2.2-3.6-3.1\r\n\t\tc-3.1-2.5-7.1-1.6-8.7,2.1c-0.7,1.4-1.2,2.9-1.7,4.4c-5.8,15.2-22.1,20.9-36.1,12.7c-1.8-1-3.5-2.2-5.4-3.2c-3.8-2-7.8,0.1-8.3,4.4\r\n\t\tc-0.2,1.9-0.2,3.8-0.3,5.7c-0.4,7.1-2.8,13.3-8.4,18.1c-0.9,0.8-1.7,1.9-2.3,2.9c-2.1,3.7-1.5,8,1.5,11.1c2.7,2.9,7.2,3.7,10.8,1.8\r\n\t\tc1.6-0.8,3.1-2,4.4-3.2c4.2-3.9,7.2-8.7,9.4-14c0.7-1.6,1.4-2,3.2-1.7c11.1,2.2,21.6,0.4,31.1-5.8\r\n\t\tC236.8,159.4,240.6,155.5,245.1,151.8z");
    			add_location(path3, file$6, 79, 1, 8455);
    			attr_dev(path4, "d", "M245.1,151.8c-4.4,3.7-8.3,7.6-12.8,10.5c-9.5,6.2-20,7.9-31.1,5.8c-1.7-0.3-2.5,0-3.2,1.7c-2.2,5.3-5.2,10.1-9.4,14\r\n\t\tc-1.3,1.2-2.8,2.4-4.4,3.2c-3.6,1.9-8,1.1-10.8-1.8c-2.9-3.1-3.6-7.4-1.5-11.1c0.6-1.1,1.4-2.1,2.3-2.9c5.5-4.8,8-10.9,8.4-18.1\r\n\t\tc0.1-1.9,0.1-3.8,0.3-5.7c0.5-4.3,4.4-6.4,8.3-4.4c1.8,1,3.6,2.2,5.4,3.2c14,8.2,30.3,2.4,36.1-12.7c0.6-1.5,1.1-3,1.7-4.4\r\n\t\tc1.7-3.6,5.6-4.5,8.7-2.1c1.2,1,2.4,2.1,3.6,3.1c9.2,8.1,18.8,9.2,29.6,3.3c4.5-2.5,9.4-1.6,12.4,2.1c3.1,3.8,3,8.4-0.7,12.2\r\n\t\tc-4.1,4.4-9.5,6.3-15.3,7.4C263,156.8,253.5,155.7,245.1,151.8z");
    			add_location(path4, file$6, 96, 1, 10441);
    			add_location(g, file$6, 5, 0, 146);
    			attr_dev(svg, "viewBox", "0 0 494 538");
    			attr_dev(svg, "style:max-height", "100px");
    			attr_dev(svg, "style:float", "left");
    			add_location(svg, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, style);
    			append_dev(style, t);
    			append_dev(svg, g);
    			append_dev(g, path0);
    			append_dev(g, path1);
    			append_dev(g, path2);
    			append_dev(g, path3);
    			append_dev(g, path4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Brain", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Brain> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Brain extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Brain",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Title.svelte generated by Svelte v3.31.0 */

    const file$5 = "src\\Title.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-1hruz61");
    			add_location(div, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Title", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\ButtonArray.svelte generated by Svelte v3.31.0 */

    const { console: console_1 } = globals;
    const file$4 = "src\\ButtonArray.svelte";

    // (42:1) {#if ind>0}
    function create_if_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "⇪";
    			attr_dev(button, "class", "svelte-m0juyy");
    			add_location(button, file$4, 41, 13, 807);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*shiftUp*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(42:1) {#if ind>0}",
    		ctx
    	});

    	return block;
    }

    // (43:1) {#if ind< $content.sections.length-1}
    function create_if_block$2(ctx) {
    	let button;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			span.textContent = "⇪";
    			set_style(span, "transform", "rotate(180deg)");
    			set_style(span, "display", "inline-block");
    			set_style(span, "vertical-align", "middle");
    			add_location(span, file$4, 44, 4, 928);
    			attr_dev(button, "class", "svelte-m0juyy");
    			add_location(button, file$4, 43, 1, 893);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*shiftDown*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(43:1) {#if ind< $content.sections.length-1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let span;
    	let button;
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;
    	let if_block0 = /*ind*/ ctx[1] > 0 && create_if_block_1(ctx);
    	let if_block1 = /*ind*/ ctx[1] < /*$content*/ ctx[2].sections.length - 1 && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			button = element("button");
    			button.textContent = "✖";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(button, "class", "svelte-m0juyy");
    			add_location(button, file$4, 40, 2, 759);
    			attr_dev(span, "class", "section-controls svelte-m0juyy");
    			add_location(span, file$4, 39, 0, 724);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, button);
    			append_dev(span, t1);
    			if (if_block0) if_block0.m(span, null);
    			append_dev(span, t2);
    			if (if_block1) if_block1.m(span, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*del*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*ind*/ ctx[1] > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(span, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*ind*/ ctx[1] < /*$content*/ ctx[2].sections.length - 1) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(span, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $content,
    		$$unsubscribe_content = noop,
    		$$subscribe_content = () => ($$unsubscribe_content(), $$unsubscribe_content = subscribe(content, $$value => $$invalidate(2, $content = $$value)), content);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_content());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ButtonArray", slots, []);
    	let { content } = $$props, { ind } = $$props;
    	validate_store(content, "content");
    	$$subscribe_content();

    	let shiftUp = () => {
    		let arr = $content.sections;

    		if (arr) {
    			[arr[ind], arr[ind - 1]] = [arr[ind - 1], arr[ind]];
    			set_store_value(content, $content.sections = arr, $content);
    			console.log($content.sections);
    		}
    	};

    	let shiftDown = () => {
    		let arr = $content.sections;

    		if (arr) {
    			[arr[ind], arr[ind + 1]] = [arr[ind + 1], arr[ind]];
    			set_store_value(content, $content.sections = arr, $content);
    			console.log($content.sections);
    		}
    	};

    	let del = () => {
    		let arr = $content.sections;

    		if (arr) {
    			arr.splice(ind, 1);
    			set_store_value(content, $content.sections = arr, $content);
    			console.log($content.sections);
    		}
    	};

    	const writable_props = ["content", "ind"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<ButtonArray> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("content" in $$props) $$subscribe_content($$invalidate(0, content = $$props.content));
    		if ("ind" in $$props) $$invalidate(1, ind = $$props.ind);
    	};

    	$$self.$capture_state = () => ({
    		content,
    		ind,
    		shiftUp,
    		shiftDown,
    		del,
    		$content
    	});

    	$$self.$inject_state = $$props => {
    		if ("content" in $$props) $$subscribe_content($$invalidate(0, content = $$props.content));
    		if ("ind" in $$props) $$invalidate(1, ind = $$props.ind);
    		if ("shiftUp" in $$props) $$invalidate(3, shiftUp = $$props.shiftUp);
    		if ("shiftDown" in $$props) $$invalidate(4, shiftDown = $$props.shiftDown);
    		if ("del" in $$props) $$invalidate(5, del = $$props.del);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [content, ind, $content, shiftUp, shiftDown, del];
    }

    class ButtonArray extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { content: 0, ind: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ButtonArray",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*content*/ ctx[0] === undefined && !("content" in props)) {
    			console_1.warn("<ButtonArray> was created without expected prop 'content'");
    		}

    		if (/*ind*/ ctx[1] === undefined && !("ind" in props)) {
    			console_1.warn("<ButtonArray> was created without expected prop 'ind'");
    		}
    	}

    	get content() {
    		throw new Error("<ButtonArray>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<ButtonArray>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ind() {
    		throw new Error("<ButtonArray>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ind(value) {
    		throw new Error("<ButtonArray>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\OutputTitle.svelte generated by Svelte v3.31.0 */

    const file$3 = "src\\OutputTitle.svelte";

    function create_fragment$3(ctx) {
    	let div4;
    	let h1;
    	let raw_value = /*$content*/ ctx[1].title + "";
    	let t0;
    	let div3;
    	let div0;
    	let b0;
    	let br0;
    	let t2;
    	let a;
    	let t3_value = /*$content*/ ctx[1].name + "";
    	let t3;
    	let a_href_value;
    	let t4;
    	let div1;
    	let b1;
    	let br1;
    	let t6;
    	let t7_value = /*$content*/ ctx[1].date + "";
    	let t7;
    	let t8;
    	let div2;
    	let b2;
    	let br2;
    	let t10;
    	let t11_value = /*$content*/ ctx[1].next + "";
    	let t11;
    	let t12;
    	let br3;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div3 = element("div");
    			div0 = element("div");
    			b0 = element("b");
    			b0.textContent = "Contact:";
    			br0 = element("br");
    			t2 = space();
    			a = element("a");
    			t3 = text(t3_value);
    			t4 = space();
    			div1 = element("div");
    			b1 = element("b");
    			b1.textContent = "Date of publication:";
    			br1 = element("br");
    			t6 = space();
    			t7 = text(t7_value);
    			t8 = space();
    			div2 = element("div");
    			b2 = element("b");
    			b2.textContent = "Next release:";
    			br2 = element("br");
    			t10 = space();
    			t11 = text(t11_value);
    			t12 = space();
    			br3 = element("br");
    			attr_dev(h1, "class", "svelte-1xrkgn4");
    			add_location(h1, file$3, 7, 0, 74);
    			add_location(b0, file$3, 15, 0, 161);
    			add_location(br0, file$3, 15, 15, 176);
    			attr_dev(a, "href", a_href_value = "mailto:" + /*$content*/ ctx[1].email);
    			attr_dev(a, "class", "svelte-1xrkgn4");
    			add_location(a, file$3, 16, 0, 182);
    			attr_dev(div0, "class", "block svelte-1xrkgn4");
    			add_location(div0, file$3, 14, 0, 142);
    			add_location(b1, file$3, 20, 0, 268);
    			add_location(br1, file$3, 20, 27, 295);
    			attr_dev(div1, "class", "block svelte-1xrkgn4");
    			add_location(div1, file$3, 19, 0, 249);
    			add_location(b2, file$3, 24, 0, 345);
    			add_location(br2, file$3, 24, 20, 365);
    			attr_dev(div2, "class", "block svelte-1xrkgn4");
    			add_location(div2, file$3, 23, 0, 326);
    			attr_dev(div3, "class", "details svelte-1xrkgn4");
    			add_location(div3, file$3, 12, 0, 117);
    			attr_dev(div4, "class", "background svelte-1xrkgn4");
    			add_location(div4, file$3, 4, 0, 43);
    			add_location(br3, file$3, 28, 0, 410);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h1);
    			h1.innerHTML = raw_value;
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, b0);
    			append_dev(div0, br0);
    			append_dev(div0, t2);
    			append_dev(div0, a);
    			append_dev(a, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			append_dev(div1, b1);
    			append_dev(div1, br1);
    			append_dev(div1, t6);
    			append_dev(div1, t7);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, b2);
    			append_dev(div2, br2);
    			append_dev(div2, t10);
    			append_dev(div2, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, br3, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$content*/ 2 && raw_value !== (raw_value = /*$content*/ ctx[1].title + "")) h1.innerHTML = raw_value;			if (dirty & /*$content*/ 2 && t3_value !== (t3_value = /*$content*/ ctx[1].name + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*$content*/ 2 && a_href_value !== (a_href_value = "mailto:" + /*$content*/ ctx[1].email)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*$content*/ 2 && t7_value !== (t7_value = /*$content*/ ctx[1].date + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*$content*/ 2 && t11_value !== (t11_value = /*$content*/ ctx[1].next + "")) set_data_dev(t11, t11_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(br3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $content,
    		$$unsubscribe_content = noop,
    		$$subscribe_content = () => ($$unsubscribe_content(), $$unsubscribe_content = subscribe(content, $$value => $$invalidate(1, $content = $$value)), content);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_content());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("OutputTitle", slots, []);
    	let { content } = $$props;
    	validate_store(content, "content");
    	$$subscribe_content();
    	const writable_props = ["content"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OutputTitle> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("content" in $$props) $$subscribe_content($$invalidate(0, content = $$props.content));
    	};

    	$$self.$capture_state = () => ({ content, $content });

    	$$self.$inject_state = $$props => {
    		if ("content" in $$props) $$subscribe_content($$invalidate(0, content = $$props.content));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [content, $content];
    }

    class OutputTitle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { content: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OutputTitle",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*content*/ ctx[0] === undefined && !("content" in props)) {
    			console.warn("<OutputTitle> was created without expected prop 'content'");
    		}
    	}

    	get content() {
    		throw new Error("<OutputTitle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<OutputTitle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\OutputSummary.svelte generated by Svelte v3.31.0 */

    const file$2 = "src\\OutputSummary.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let raw_value = /*$content*/ ctx[1].summary + "";

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "summary svelte-anxcnq");
    			add_location(div, file$2, 5, 0, 47);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$content*/ 2 && raw_value !== (raw_value = /*$content*/ ctx[1].summary + "")) div.innerHTML = raw_value;		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $content,
    		$$unsubscribe_content = noop,
    		$$subscribe_content = () => ($$unsubscribe_content(), $$unsubscribe_content = subscribe(content, $$value => $$invalidate(1, $content = $$value)), content);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_content());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("OutputSummary", slots, []);
    	let { content } = $$props;
    	validate_store(content, "content");
    	$$subscribe_content();
    	const writable_props = ["content"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OutputSummary> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("content" in $$props) $$subscribe_content($$invalidate(0, content = $$props.content));
    	};

    	$$self.$capture_state = () => ({ content, $content });

    	$$self.$inject_state = $$props => {
    		if ("content" in $$props) $$subscribe_content($$invalidate(0, content = $$props.content));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [content, $content];
    }

    class OutputSummary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { content: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OutputSummary",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*content*/ ctx[0] === undefined && !("content" in props)) {
    			console.warn("<OutputSummary> was created without expected prop 'content'");
    		}
    	}

    	get content() {
    		throw new Error("<OutputSummary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<OutputSummary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\OutputSection.svelte generated by Svelte v3.31.0 */

    const file$1 = "src\\OutputSection.svelte";

    // (8:4) {#if content.sections[index].graphic}
    function create_if_block$1(ctx) {
    	let img;
    	let img_src_value;
    	let br0;
    	let br1;

    	const block = {
    		c: function create() {
    			img = element("img");
    			br0 = element("br");
    			br1 = element("br");
    			attr_dev(img, "class", "pic svelte-bu9v45");
    			if (img.src !== (img_src_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].graphic)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 8, 4, 208);
    			add_location(br0, file$1, 8, 69, 273);
    			add_location(br1, file$1, 8, 73, 277);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*content, index*/ 3 && img.src !== (img_src_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].graphic)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(8:4) {#if content.sections[index].graphic}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let h2;
    	let t0_value = /*index*/ ctx[1] + 1 + "";
    	let t0;
    	let t1;
    	let t2_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].subtitle + "";
    	let t2;
    	let t3;
    	let div0;
    	let t4;
    	let html_tag;
    	let raw0_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].text + "";
    	let t5;
    	let html_tag_1;
    	let raw1_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].embed + "";
    	let div1_id_value;
    	let if_block = /*content*/ ctx[0].sections[/*index*/ ctx[1]].graphic && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text(". ");
    			t2 = text(t2_value);
    			t3 = space();
    			div0 = element("div");
    			if (if_block) if_block.c();
    			t4 = space();
    			t5 = space();
    			add_location(h2, file$1, 4, 0, 96);
    			html_tag = new HtmlTag(null);
    			add_location(div0, file$1, 6, 0, 154);
    			html_tag_1 = new HtmlTag(null);
    			attr_dev(div1, "id", div1_id_value = "section" + /*index*/ ctx[1]);
    			attr_dev(div1, "class", "section svelte-bu9v45");
    			add_location(div1, file$1, 3, 0, 52);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div0, t4);
    			html_tag.m(raw0_value, div0);
    			append_dev(div1, t5);
    			html_tag_1.m(raw1_value, div1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*index*/ 2 && t0_value !== (t0_value = /*index*/ ctx[1] + 1 + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*content, index*/ 3 && t2_value !== (t2_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].subtitle + "")) set_data_dev(t2, t2_value);

    			if (/*content*/ ctx[0].sections[/*index*/ ctx[1]].graphic) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div0, t4);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*content, index*/ 3 && raw0_value !== (raw0_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].text + "")) html_tag.p(raw0_value);
    			if (dirty & /*content, index*/ 3 && raw1_value !== (raw1_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].embed + "")) html_tag_1.p(raw1_value);

    			if (dirty & /*index*/ 2 && div1_id_value !== (div1_id_value = "section" + /*index*/ ctx[1])) {
    				attr_dev(div1, "id", div1_id_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("OutputSection", slots, []);
    	let { content } = $$props, { index } = $$props;
    	const writable_props = ["content", "index"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OutputSection> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("content" in $$props) $$invalidate(0, content = $$props.content);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({ content, index });

    	$$self.$inject_state = $$props => {
    		if ("content" in $$props) $$invalidate(0, content = $$props.content);
    		if ("index" in $$props) $$invalidate(1, index = $$props.index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [content, index];
    }

    class OutputSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { content: 0, index: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OutputSection",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*content*/ ctx[0] === undefined && !("content" in props)) {
    			console.warn("<OutputSection> was created without expected prop 'content'");
    		}

    		if (/*index*/ ctx[1] === undefined && !("index" in props)) {
    			console.warn("<OutputSection> was created without expected prop 'index'");
    		}
    	}

    	get content() {
    		throw new Error("<OutputSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<OutputSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<OutputSection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<OutputSection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var placeholders = [
      ['First findings', 'For sale: baby shoes. Never worn'],
      ['Terror', 'Gigantic baby terrorizes Greenville. Townspeople helpless.'],
      ['Intreague', 'Dick Prowdy reporting live: Baby Situation.'],
      ['Thrill', 'Cooing baby loves the ticklish tasers.'],
      ['Growth', 'Oh, God. Oh, God. He’s growing.'],
      ['Threat', 'Hostage taken. Baby on the move.'],
      ['Choppers', 'Playful baby delighted by military helicopters.'],
      ['News response', 'America transfixed by Greenville Baby Terror.'],
      ['Deceleration', 'Wait, what’s happening? Baby slowing down.'],
      ['Heavy sleep', 'Nap time. Reclining baby crushes Winnebago.'],
      ['Net relief', 'Sleepy baby trapped in net. Hooray!'],
      ['Police action', 'National Guard drags snuggly baby home.'],
      ['Normalisation', 'Now everything is back to normal.'],
      ['Permanent change', 'Everything except for the house-sized baby.'],
    ];

    var demoArticle = {"title":"<p>ONS-UNECA web page maker: a tool that <em>might </em>help some NSOs to publish census results in a more timely and accessible manner</p>","name":"Tim Kershaw","email":"tim.kershaw@ons.gov.uk","date":"2023-04-27","next":"2024-04-27","summary":"<p>On 26/01/2023 a meeting was convened between <a href=\"https://www.ons.gov.uk/\" rel=\"noopener noreferrer\" target=\"_blank\">the ONS</a> and <a href=\"https://www.uneca.org/\" rel=\"noopener noreferrer\" target=\"_blank\">UNECA </a>where a potential product was demonstrated.</p><p>What you see on the screen in front of you is a prototype version of that product that might work well enough to get started. It's still <em>buggy</em> and requires a lot of <strong>fine tuning</strong> and additional features, however those features would be better if proposed by trial users like yourselves.</p>","sections":[{"subtitle":"How it started","graphic":"https://uksa.statisticsauthority.gov.uk/wp-content/uploads/2022/12/Full-room-view-of-workshop-being-delivered--e1671027272478.jpg","text":"<p>Prior to the Côte d'Ivoire meeting in November '22 an objective was set for the <em>Making Digital Products</em> workshop of facilitating participants to produce some digital content they could take home. This would be a mixture of well-considered text and charts combined into an online article</p><p>The creation of an online article is a challenge for a number of reasons. Firstly, participants are familiar tools aimed at the production of paper outputs, such as Word and Excel. Secondly, they hold positions of responsibility for quality and accuracy of outputs, so they have little time to learn about the use of complex new tools.</p>","embed":"","download":""},{"subtitle":"Findings from the workshop","graphic":"","text":"<p>Participants were generally enthusiastic about making professional looking charts in DataWrapper. Some also experimented with the tool for making maps and tables for digital publication.</p><p>The crude tool for making publishable web content (Figure 1) that can be found <a href=\"https://svelte.dev/repl/af52904cc76a473abb5ce3dfe6f25841?version=3.55.1\" rel=\"noopener noreferrer\" target=\"_blank\">here</a> had a number of shortcomings.</p><p><img src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABmQAAAMFCAYAAABqF5l1AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAP+lSURBVHhe7N0LQFRV/gfwb6CAAoqC8hATxBSMVBIskkpMTYtyLXU12bZw3dLV9M+q22rUlmKm5Wq6autKbYtpPjMpTQ00H5hgCJH4QkSRh4IiD3kJ/e+dOQPzhIEZEO372Z28j5k755577r3D+d1zzn2/PoFfQYYdZPYQERER0d3r9df/jrVpi8XcPYy/24mIiIiIqJWzEP8SERERERERERERERFRM7nv+vXrfJSMiIiIiOge9fe/L8H7788Vc0RERERERHSn3HerspoBGSIiIiKiVqiqrERMNd3cue9j7dr3xRwRERERERHdKeyyjIiIiIiIiIiIiIiIqJkxIENERERERERERERERNTMGJAhIiIiIiIiIiIiIiJqZgzIEBERERERERERERERNTMGZIiIiIiIiIiIiIiIiJoZAzJERERERERERERERETNjAEZIiIiIqK71Ndffy2miIiIiIiIqLW771Zl9a9imoiIiIiIWpGqshIxpUs9GPP888+LKV1z576PtWvfF3O6LAP9xRQRERERERGZQ3V8opjSxBYyxsj4FIlhbyG9WMwTEREREd1B2i1j2FKGiIiIiIio9TNLQOZ2dTVOZ+Tg++OnkF9490Qtsra8iMTZytfxMB8cn6GaX4tL1eJNMvsuaOvujrZtxbyGIlz65gtcYrCGiIiIiFqAoeALgzJEREREREStm8ldluXfKMYvF66gnZUVyiqq8GAvNzg52Iu1rU9RxjZcq34RXr3EAoV8nHn3cVS9mAZfX7HIaPJn5wN/+QR9nMQiIiIiIiIzqK/LMmOxyzIiIiIiIqKW1WxdlnW0b4+Avp546AF3WNSztZqaGsVLnb5lzaW6+BTOrHwRpz+9BksHsbBB+UiXPqNqQZOaKhYLN354S1r3Gm5m/oibkcr3Jf+QL9ZKznyKxP97HMc/S0KJNJ00Q5oOew1nVG+pLkLWttdwfMoj0utxJG07BdP/5CYiIiIiIiIiIiIiotbG5IBM2zaWaN/OWswZdu7MaaSmJIs5oLq6GslJJ3Ap86JY0kyqi5C99y0khUeg0v8T+L33OjyMbsniBK8Z2+D/4Sfo2EMsUtPpiYVi3SPoOF9+3zb0f0Jt431ehf/8WbD8aSHOxHnBY/kOje0UfD8HudfD4L32Rwxa+w06XZ+L9CNFYi0REREREREREREREd0rWmxQf68HeqOs7BZysrMV83k5OYrWMff38FDMN498nPtwOLLP+MFt2TY8FOgEvcPANLcb3dBhwhPoZGmPzuNmomsneWEW8n/Ih92oR9DBUpq17ACPwCdQkXwSZfJqIiIiIiIiIiIiIiK6Z7RYQKZNmzbo3ccbFy+cR+GN67iUmYHe3j6wqK+fM5NZoW0Xd9Rcu4bKCrHoTuj1JDorukmzRpe+fdFJDsDgGqoyT6Ho7z44/gfx+uBTafE13JJXExERERERERERERHRPaPFAjKyTp0d4dSlK36MPwoXt26wt+8g1jSXDvAI2wbvCdYo+PsjOLHhR9yoFqvuuC5o26MvOryfhkH/U3u98yIcxTuIiIiIiIiIiIiIiOje0KIBGVmv3n0wZOgw9PDwFEuaX4e+r2Lg2m/giDU4N/stnMkwb3MZC8sLqLqqnK6ull7KyQa4w+kJJ5Ts/hFF4gNV+em4WqqcJiIiIiJSOXnyZKNfRERERERE1LqYHJC5UVSKQz+dxbGf01FWUYXks5dxJOkcyssrxTs03XfffbC2sVH826IsneAx6TP4zX8Rtu2txcKGJOHU7BeROPs13MwEbn0iT7+F9BtitYIT3F95HVWrBuD4lEdwYtYCXCwUq858isTI5ajOXI4MaTunzojlguNTS+HSeQPOvv6I4rPJ6/bhlv5sIyIiIiIiIiIiIiKiu9h9tyqrfxXTRERERETUilSVlSj+bUqLlwEDBij+nTv3faxd+75iWh/LQH8xRUREREREROZQHZ8opjS1eJdlREREREREREREREREvzUMyBARERERERERERERETUzBmSIiIiIiIiIiIiIiIiaGQMyREREREREREREREREzYwBGSIiIiIiIiIiIiIiombGgAwREREREREREREREVEzY0CGiIiIiIiIiIiIiIiomTEgQ0RERERERERERERE1MwYkCEiIiIiIiIiIiIiImpmDMgQERERERERERERERE1MwZkiIiIiIiIiIiIiIiImhkDMs3sxr7Z2LgmBjdOrsHGxWuQLpYbLx3xy8dgT3ypmL8H3EzB8ZhE3BSz5peC2MXPIvZkLhLXPItd+3LF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uxhkuw3fyt2GLRmDbV8fwI0y5XsVA+p/NhknMoG8WCmNn+3FTbFGoboUBfF/x7Yl47FZ+uy38ZXo+fwEdBer62cF72Fz0PaXMGz8MBRb//0lLB9+Ge1PxSBdERzqhE6OKcjP9oKTB2Dn3hcVuUdh7Wjc1omIiIiIiIiIiIiI7oT7blVW/yqmiYiIiIioFakqUzZRPnnypOLfxhgwYIDi37lz38fate8rpvWxDPQXU0RERERERGQO1fGJYkpT62gKQkREREREREREREREdA9jQIaIiIiIiIiIiIiIiKiZMSBDRERERERERERERETUzBiQISIiIiIiIiIiIiIiamYMyBARERERERERERERETUzBmSIiIiIiIiIiIiIiIiaGQMyREREREREREREREREzYwBGSIiIiIiIiIiIiIiombGgAwREREREREREREREVEzY0CGiIiIiIiIiIiIiIiomTEgQ0RERERERERERERE1MwYkDGH84l4afFhHLgp5hWu48Cn3+OV5XsRsngPVp4UixslBbGLn0XsyVwkrnkWu/bliuWNcP5zbF0SiV800maqG0j5bDLiT4nZFpZ3ZAVSzosZah2u7cWejz/HRTGrz419s7FxTQxunFyDjYvXIF0sJyIiIiIiIiIiIvotMDkgc7PkFo6cPIf9P57C99Lr1IVsVNf8Ktb+RtjaoLetFZysxbxCZwx59Sl8Nssfr9mLRU1gYeGFDl3tYWUF2HToLJaqlCJ9z3ak1xdssXOBna0LbDXSZqoKVJbloqxSzLawkqy9yC8RM2ZWknkA8Z++js1LxmPzh2OwcdnfcSDphlhLBlVXoupWKarFrD4WbaT/OLigk40VLNt3hp1yMREREREREREREdFvgskBmVtllfBy74phj/RFkN8DuFFUisu5BWLtb4SrL/4xYxB8bcS82XSFnb2VdJRsYWsHWFpL0xqKcSPjKG6UiVl9XEZg5F8mw8PsabsHXduLw3vS4fT0xxg/dzPGz96B8a++iJqDM3Ag9Q5Fn+pTU4nyrBScy2iFadOjYycvqSxLZdjBGe3a2kK7NBMRERERERERERHdy+67VVlt1uYspy8qu9Xy9nBR/HvH1ZQg9esEvHm6ApWwwEPe3nj/d/crKoOv743DhpouKEjNwlFbVyzyuol//HQLTj298e/xHrCqzMK2T0/hU7kFSk0N0NEJ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MCBDRERERERERERERETUzBiQISIiIiIiIiIiIiIiamYMyBARERERERERERERETUzBmSIiIiIiIiIiIiIiIiaGQMyREREREREREREREREzYwBGSIiIiIiIiIiIiIiombGgAwREREREREREREREVEzY0CGiIiIiIiIiIiIiIiomZkckMm5Voi4hLTa1/fHT+HIyfOovF0t3kFERERERERERERERPTbZnJAxrWLA4IDfGpf97s4wq6dNazaWIp3EBERERERERERERER/baZtcuy8vJKXC0oQjdnB7GEiIiIiIiIiIiIiIiIzBqQyb1eBGurtujcwU4sISIiIiIiIiIiIiIiIrMFZG5XVyM3/ybcujrAwuI+sZSIiIiIiIiIiIiIiIjMFpC5dr0I1TW/wsmBrWOIiIiIiIiIiIiIiIjUmSUgU1PzK7KuFqJrZ3tYtW0jlhIREREREREREREREZHMLAGZm6W3UFl1G+5dO4klREREREREREREREREpGKWgEz21UJ06mCLdjZWYgkRERERERERERERERGpmCUg86BXN/Tt6SbmiIiIiIiIiIiIiIiISJ3ZBvUnIiIiIiIiIiIiIiIi/RiQISIiIiIiIiIiIiIiamYMyBARERERERERERERETUzBmSIiIiIiIiIiIiIiIiaGQMyREREREREREREREREzYwBGSIiIiIiIiIiIiIiombGgAwREREREREREREREVEzY0CGiIiIiIiIiIiIiIiomTEgQ0REREREd4cJa1AQn4hqrVfqfLGeiIiIiIioFWNAhoiIiIiIWr11mxJRPTMADmK+JYSvilMGfTZFiCXmEoFURTApDvsniEVERERERHTPY0CGiIiIiIhaNTkwEtZDzJQkYE6gPyxVr5gMscLcQvFMH3sxbWbz+8FHTBIRERER0W/Hfbcqq38V03QvKT6Fgz+Uof+zA014irAIJz59C3FO/4fZz3mKZZKzW7B8ZzJQXYbSdk/jtZkj4CRW6XX9GL7ZUwX/lx6Hs1h0p6Tvegu7TgO3bxXB/ol5eC3YRaxpAY3NN2qaO1reCnBy51eo9p+Mgd3Eolag8Kf1+GzXKVTIIfguT+OV10e0UN4YuIY0qwKc+O8/cegqUFFSBK8JH2NsY2q8mvs8lbcf74JX/vh4PdfmO5FvpipC+v7vUPbwOPh2FovICMw3alhVWYmYarq5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SrdlMO2aTCxDxnFMVxYQEREREdH10qSkrPKamL4lyWPGnOjzd0wQj4vJ8z/6voFnR/ipC7QK47Dpk2/g9vj7eLiLNH9iNRYf64HX/jLYQjdjCdi08Ch6RU6DtreymsqRs3cJ/nFuOGY/M9zYCoeIiIiIqBbluhpPAtXZvHnvYuXKd8VcTfL4I0REREREROQ48kNT5tzyAZm0zS8h2n8RnrnHE6jIxP7//QCneusDMjpkJmeiddeuaClHXKoHZMoSsOnDHWj717m4T+62rKoAOVnl8O3gLX+1YCEgczEJKeiK4HZyl2cMyBARERFR3TAgU/sfMuQYV8vK0PK+e8QcERERERE5wm0bkMHF3VgT9QOuOLWAS+tQ9PFNwkn3Z9WATFUB0vasxveHMyH/qVsBTwQNexKPjgiEq/ppVGTtw6b1O5Ahv6GpJzpp11+OwbrV25FZUAEnTzf4D38ZUwYbgzUVWTHYum070nIqpG1Jf+z698dDkyajp5d4AxERERGRBQzIEBERERER3Xxu34AMEREREdFNigEZIiIiIiKim09tAZnbfFB/IiIiIiIiIiIiIiKihseADBERERERERERERERUQNjQIaIiIiIiIiIiIiIiKiBMSBDRERERERERERERETUwBiQISIiIiIiIiIiIiIiamAMyBARERERERERERERETUwBmSIiIiIiIiIiIiIiIgaGAMyREREREREREREREREDYwBGSIiIiIiIiIiIiIiogbGgAwREREREREREREREVEDY0CGiIiIiIiIiIiIiIiogTEgQ0RERERERERERERE1MDsDshUVl1D4pnz+OGXJOw5dBJHEs9Cd7VMrCUiIiIiIiIiIiIiIiK7AzLnzudCd7UU9w0Ixsi7e6B582Y4nZEj1hIREREREREREREREZFdAZnKyipculIAX+9WcHZyQpMmQHsfLxTprqK0tFy8i4iIiIiIiIiIiIiI6PZmV0Dm2jWgqkr6j8Y16X9VVVWoklcSERERERERERERERGRfQEZZ+emaOPljktXClFRWYmy8gqcO5+HykoGY4iIiIiIiIiIiIiIiPTsHkMmKKAtXJydEH3kFA4dT0PLFs3Q3NUFTtIyIiIiIiIiIiIiIiIickBARg7G9O7WEaMG98C9/YOV1jEeLd3QjAEZIiIiIiIiIiIiIiIihd0BGT15yJjTGdnI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b4MA3zZiqZHuahmOJkl/xNzZHj5eHmIpERERERHVV7muSEzV37x572LlynfFXE3yeCNERERERETkOPIDR+awTQsREREREREREREREVEDY0CGiIiIiIiIiIiIiIiogTEgQ0RERERERERERERE1MAYkCEiIiIiIiIiIiIiImpgVgMyV6+W4WB8qvQ6jWLdVaScy0bMr6dxpaBYWS//K88fOpEGXWk5Ek7/rrxf/hwREREREREREREREREBTUrKKq+JaSIiIiIiakTKdUViqv7mzXsXK1e+K+ZqchoyQEwRERERERGRI1TGHhVTpthlGRERERERERERERERUQNjQIaIiIiIiIiIiIiIiKiBMSBDRERERERERERERETUwBiQISIiIiIiIiIiIiIiamAMyBARERERERERERERETUwBmSIiIiIiIiIiIiIiIgaGAMyREREREREREREREREDYwBGSIiIiIiIiIiIiIiogbGgAwREREREREREREREVEDY0CGiIiIiIiIiIiIiIiogTEgQ0RERERERERERERE1MAYkCEiIiIiIiIiIiIiImpgNgVkrl0Dzp3Pw95fkpCZc1ksVf1RVIKDx1KVdT9Ir5Rz2aiskj5wE7kY+wHiX7wbh58fLr0mI2HzL7hSKVbaLRNpX+3BRTFHRERERERERERERES3H6sBmSJdKX5OSEVW7hW4ODmJpSo5UPN79hUEdvDByLtDMbRPF1y6UiAtyxPvaHwK0jcj7YyYkVza/SzO/RAA33d+waBPYzDok7+jdUgHeJoeqh0uQbc7HlfF3HVzNR6pu5NQ4LDAEhERERERERERERER1ZfVgIybazP06dYR/UM7w9nZNErRpAnQs0sHtG/bWplv3ryZ8v6rZRXKvFZVVZXy0jK3rKFUFiYh5ZPxOPXFJTh5iYVXf0H2Ble0njkZ7T3EMicf3BEaAP2RFqV8gfjn5dYz0mteJNJyxApZ7mbELdqMcz9FIu7l4TgcMRzxP2RCHwPJ3DgeR19diBJsxsVX5enxSEoRK2WVBcjc/CwOT5e+e7r02c1JKBKrpC9HylvPIiVhO078z3hpfV8c/nA7Lum/XN72W5thCH3J83/5AL+JWbh0hMulD3Dq1QVISS8w7BMREREREREREREREV1/VgMyTk2bwL1FczX6YkVFZSXKKyrRvJmzWGKUmnIKiccTxBxQ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3gu07j8BroejcEYMhl+UuBlFZePh5YhdLy9EZbkPXPw9lRY45bnxuJqTi2sOan3jFDwKLRLXIUPfRVllAS5m5hqCS7rM7Uh4Vd+d23r07Fe9OzciIiIiIiIiIiIiInIUqwGZq1fLcDA+VXqdRrHuKlLOZSPm19O4UiAGWqmjJk2awLV5c+Xf60pu/TLlS/SbPx4tW6jjvrh4hsAlcyVOv3g3Dr84HIdnvISSTp8jaFyQsh5eoxD48mCUvCWtf344ktaVovX8GWhv7MOs/prfi/Yz2qJgXl9p2+Nx/N+u8B7fAQV71e7SZJkbx+Poq+ORvvUX4OBCZTrhp1x15ZU9SHh1IUqwGRe1y/Wa90PwwkdQ/nfpuKbLxzcDOUl/QCdWu7UOQeuX9qCftO325mNnRERERERERERERETkIE1KyiqviWkiIiIiImpEynVFYqr+5s17FytXvivmanIaMkBMERERERERkSNUxh4VU6YackR9IiIiIiIiIiIiIiIikjAgQ0RERERERERERERE1MAYkCEiIiIiIiIiIiIiImpgDMgQERERERERERERERE1MAZkiIiIiIiIiIiIiIiIGhgDMkRERERERERERERERA2MARkiIiIiIiIiIiIiIqIGxoAMERERERERERERERFRA2NAhoiIiIiIiIiIiIiIqIExIENERERERERERERERNTAGJAhIiIiIiIiIiIiIiJqYAzIEBERERERERERERERNTCbAjLXrgHnzudh7y9JyMy5LJaqdFfLsP9oCqKPJBtep85li7VERERERERERERERERkNSBTpCvFzwmpyMq9AhcnJ7HUlLOzEwb3CsKIgSHKq3tnP7GGiIiIiIiIiIiIiIiIrAZk3FyboU+3jugf2lkJvBAREREREREREREREVHdWA3IODVtAvcWzYEmTcSSmioqK3DoRBp2xybi4LEzKNGVijVERERERERERERERERk96D+zV2bYXDPINzbvztGDe6J1p4tcPLsBVRVXRPvICIiIiIiIiIiIiIiur3ZHZCRG864urooLWnkad82nigtK1deRERERERERERERERE5ICATHWVlZXKv00tdHFGRERERERERERERER0O7E7IJOT9wfO51zGtWvyWDKVOH/xD3i0dFNazRAREREREREREREREZENAZmrV8twMD5Vep1Gse4qUs5lI+bX07hSUKysb+nmit9zrmDvLyfx45FTaOrUBKF3tlfWEREREREREREREREREdCkpKySo+8TERERETVC5boiMVV/8+a9i5Ur3xVzNTkNGSCmiIiIiIiIyBEqY4+KKVMOH0OGiIiIiIiIiIiIiIiITDEgQ0RERERERERERERE1MAYkCEiIiIiIiIiIiIiImpgDMgQERERERERERERERE1MAZkiIiIiIiIiIiIiIiIGhgDMkRERERERERERERERA2MARkiIiIiIiIiIiIiIqIGxoAMERERERERERERERFRA2NAhoiIiIiIiIiIiIiIqIExIENERERERERERERERNTAGJAhIiIiIiIiIiIiIiJqYAzIEBERERERERERERERNbAmJWWV18T0bagAaXt3QXfXRPRsIxaZk7ERH0ZlY8SrL6K/h1jWyKV9twDfnQIqSgrgce8beHaEn1hjm5zDq5HuOw2DO4kF19P5GGxKD8CEYYFiwa0qD8e2bUXlgGno30EscgRdOn74agWO5kjTVc7oPmERxvZwUdddL5cPYcf35RgweTh8xSKyoDGXMVVSPv3mY+xK0Smz3ve/jGfuC1CmG41bLr8VIO6LBYj2eRmvPnL9y8Hiw59g2T4/PPX6RDSyM92wbsJ7PQqTsP8nHfo83B9eYhHVwc1QvknKdUViqv7mzXsXK1e+K+aIiIiIiIjoRrGphcy1a8C583nY+0sSMnMui6VGRSVXcfBYKnbHJmLf4WRk5/4h1txY+Yc+wbIlC5TXh2+9hMWR6vSyJR/jUK78jhJknUxFfpXy9tq19EbbNt7wchXzjnQ+BtsOZ4oZxwl6ZBFmz12ER4LFgjrKP5uAzBIxc70VnEZKZoGYuZWVo+hcAtIdfKhp36/EmS5z8drCj6TXIjwccp2DMbKqAmQmn0a+mG38MhG3OQZyDMvx5MDvdqQVillzGrKMsVPxodXYW/UoZr8p5ac338PTQxthFf0tl9/c4NXGD21bu4n568u1lTd8fLzRXMzfKopTtmN/ioUCtxFfh7UqzcSpM3moELONjw3lnx2snlMrboryjYiIiIiIiG4pVgMyRbpS/JyQiqzcK3BxchJLjUrLypFw+ncEtGuDB4f0xP0DuqNtG0+x9sbyGvyiEpTQByZ8hs0U8y9jsI94ky18wvDUrMkIaibmHangNBLP5okZIntlI+s3Hbz9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ZbBBhoiIiIiIiG4Ifn3DkLhwPT6bMRQd5TIiIiIioiuFg/oTEREREbVRHNSfiIiIiIjo+sE3ZIiIiIiIiIiIiIiIiFoZG2SIiIiIiIiIiIiIiIhaGRtkiIiIiIiIiIiIiIiIWhkbZIiIiIiIiIiIiIiIiFoZG2SIiIiIiIiIiIiIiIhaGRtkiIiIiIiIiIiIiIiIWpndBpma2joUlhrx2Zd78Nn2b1C871tcvFQv12ou1ddjr/EE/rVjD05XVculREREREREREREREREpLDbIHP8uyr43NoZvxg5GI+OGIQLdRex78hJuRY4/UM18nfvx5mzNWh3s4dcSkRERERERERERERERCZ2G2T639kdd915B266CWjn4YGunTuh9kKdXAvc2qUTRgz2w70D++BmdoBGRERERERERERERETUiNNNKBcuXETHDp5yDmjfzgOdvDrIOSIiIiIiIiIiIiIiImrIqQaZqurzOHPuPHp395ZLiIiIiIiIiIiIiIiIyB6HG2SUsWOUgfv79rwD3l06yaVERERERERERERERERkj0MNMnUXL6Fo73/R4/au+FnP2+VSIiIiIiIiIiIiIiIicoTdBhnlzZivyo6gZzdv+PW5Qy4lIiIiIiIiIiIiIiIiR9ltkDEer0T1+VocOnYKuYVl6t/Obw7j0qXL6vofzpzD51/tw/avD6LmwkUU7/sW+UX7UVtbp64nIiIiIiIiIiIiIiK60d10vq7+JzlNRERERERtyMWas3LKdXPmvIJVq16Rc0RERERERHS1ODyoPxEREREREREREREREbmGDTJEREREREREREREREStjA0yRERERERERERERERErYwNMkRERERERERERERERK2MDTJEREREREREREREREStjA0yRERERERERERERERErYwNMkRERERERERERERERK2MDTJEREREREREREREREStjA0yRERERERERERERERErYwNMkRERERERERERERERK2MDTJEREREREREREREREStjA0yRERERERERERERERErcxug0xNbR0KS4347Ms9+Gz7Nyje9y0uXqqXa4Efz55H/u796vp/ib/ywxWov/yTXEtERERERHQllSBl+HAM/2MmKuUSR5X8RXxveBwyT8kFbVDdwc1ImT0GDynH+PM52OzsQRIRERER0VVjt0Hm+HdV8Lm1M34x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\"></p><p><em>Figure 1: The first prototype</em></p><p>Shortcomings:</p><ul><li>The text input panel appears very technical as it uses a markup language to provide structure</li><li>A typing error might remove a vital \"&gt;\" character and leave the user unaware of what has broken</li></ul><p>Advantages:</p><ul><li>The ability to embed charts, tables and maps alongside text content allowed the user to create web content</li><li>The download facility allowed the user to generate sharable web content in a single html file</li></ul><p><br></p><p>Here is an example of an embedded interactive: </p>","embed":"<iframe height=\"570px\" width=\"100%\" src=\"https://www.ons.gov.uk/census/maps/choropleth/population/country-of-birth/country-of-birth-12a/europe-united-kingdom?embed=true&embedInteractive=true&embedAreaSearch=true&embedCategorySelection=true&embedView=geography\"></iframe>","download":""},{"subtitle":"What to do next","graphic":"","text":"<p>You should experiment with this tool, and note down any problems you encounter when you are using it. Also note any ideas you have as to how it might be more useful or easier to use. If you find anything difficult to use due to poor visibility or difficult navigation of the article on the device you are using, that is especially important to us.</p>","embed":"","download":""}],"links":[],"downloads":[]};

    /* src\App.svelte generated by Svelte v3.31.0 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	child_ctx[30] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    // (222:4) {#if $sections && $content.title}
    function create_if_block(ctx) {
    	let box0;
    	let t0;
    	let box1;
    	let t1;
    	let i;
    	let t2;
    	let t3_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][6] + "";
    	let t3;
    	let t4;
    	let t5;
    	let br0;
    	let t6;
    	let br1;
    	let t7;
    	let each_1_anchor;
    	let current;

    	box0 = new Box({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	box1 = new Box({
    			props: {
    				content: /*content*/ ctx[11],
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value_2 = Array(/*$sections*/ ctx[1]);
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			create_component(box0.$$.fragment);
    			t0 = space();
    			create_component(box1.$$.fragment);
    			t1 = space();
    			i = element("i");
    			t2 = text("---");
    			t3 = text(t3_value);
    			t4 = text("---");
    			t5 = space();
    			br0 = element("br");
    			t6 = space();
    			br1 = element("br");
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(i, "style:color", "#999");
    			add_location(i, file, 286, 6, 9695);
    			add_location(br0, file, 287, 6, 9749);
    			add_location(br1, file, 288, 6, 9763);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(box1, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, i, anchor);
    			append_dev(i, t2);
    			append_dev(i, t3);
    			append_dev(i, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t7, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const box0_changes = {};

    			if (dirty[0] & /*$content, lang*/ 9 | dirty[1] & /*$$scope*/ 16) {
    				box0_changes.$$scope = { dirty, ctx };
    			}

    			box0.$set(box0_changes);
    			const box1_changes = {};

    			if (dirty[0] & /*lang*/ 8 | dirty[1] & /*$$scope*/ 16) {
    				box1_changes.$$scope = { dirty, ctx };
    			}

    			box1.$set(box1_changes);
    			if ((!current || dirty[0] & /*lang*/ 8) && t3_value !== (t3_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][6] + "")) set_data_dev(t3, t3_value);

    			if (dirty[0] & /*lang, $sections, content, demo, lab*/ 2442) {
    				each_value_2 = Array(/*$sections*/ ctx[1]);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box0.$$.fragment, local);
    			transition_in(box1.$$.fragment, local);

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box0.$$.fragment, local);
    			transition_out(box1.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(box1, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t7);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(222:4) {#if $sections && $content.title}",
    		ctx
    	});

    	return block;
    }

    // (223:6) <Box>
    function create_default_slot_4(ctx) {
    	let editor;
    	let t0;
    	let br0;
    	let t1;
    	let input0;
    	let input0_placeholder_value;
    	let t2;
    	let label0;
    	let input1;
    	let t3;
    	let span0;
    	let t4;
    	let br1;
    	let t5;
    	let input2;
    	let input2_placeholder_value;
    	let t6;
    	let label1;
    	let input3;
    	let t7;
    	let span1;
    	let t8;
    	let br2;
    	let t9;
    	let label2;
    	let t10_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][3] + "";
    	let t10;
    	let t11;
    	let t12;
    	let input4;
    	let t13;
    	let label3;
    	let input5;
    	let t14;
    	let span2;
    	let t15;
    	let br3;
    	let t16;
    	let label4;
    	let t17_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][4] + "";
    	let t17;
    	let t18;
    	let input6;
    	let t19;
    	let label5;
    	let input7;
    	let t20;
    	let span3;
    	let current;
    	let mounted;
    	let dispose;

    	editor = new Editor({
    			props: {
    				content: /*content*/ ctx[11],
    				placeholder: /*lab*/ ctx[8][/*lang*/ ctx[3]][0],
    				part: "title"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(editor.$$.fragment);
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			label0 = element("label");
    			input1 = element("input");
    			t3 = space();
    			span0 = element("span");
    			t4 = space();
    			br1 = element("br");
    			t5 = space();
    			input2 = element("input");
    			t6 = space();
    			label1 = element("label");
    			input3 = element("input");
    			t7 = space();
    			span1 = element("span");
    			t8 = space();
    			br2 = element("br");
    			t9 = space();
    			label2 = element("label");
    			t10 = text(t10_value);
    			t11 = text("*");
    			t12 = space();
    			input4 = element("input");
    			t13 = space();
    			label3 = element("label");
    			input5 = element("input");
    			t14 = space();
    			span2 = element("span");
    			t15 = space();
    			br3 = element("br");
    			t16 = space();
    			label4 = element("label");
    			t17 = text(t17_value);
    			t18 = space();
    			input6 = element("input");
    			t19 = space();
    			label5 = element("label");
    			input7 = element("input");
    			t20 = space();
    			span3 = element("span");
    			add_location(br0, file, 229, 8, 8036);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "half");
    			attr_dev(input0, "placeholder", input0_placeholder_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][1]);
    			add_location(input0, file, 230, 8, 8052);
    			attr_dev(input1, "type", "checkbox");
    			input1.checked = true;
    			attr_dev(input1, "class", "svelte-125zpsz");
    			add_location(input1, file, 236, 10, 8228);
    			attr_dev(span0, "class", "slider round svelte-125zpsz");
    			add_location(span0, file, 237, 10, 8273);
    			attr_dev(label0, "class", "switch svelte-125zpsz");
    			add_location(label0, file, 235, 8, 8194);
    			add_location(br1, file, 239, 8, 8330);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "half");
    			attr_dev(input2, "placeholder", input2_placeholder_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][2]);
    			add_location(input2, file, 241, 8, 8348);
    			attr_dev(input3, "type", "checkbox");
    			input3.checked = true;
    			attr_dev(input3, "class", "svelte-125zpsz");
    			add_location(input3, file, 247, 10, 8525);
    			attr_dev(span1, "class", "slider round svelte-125zpsz");
    			add_location(span1, file, 248, 10, 8570);
    			attr_dev(label1, "class", "switch svelte-125zpsz");
    			add_location(label1, file, 246, 8, 8491);
    			add_location(br2, file, 250, 8, 8627);
    			attr_dev(label2, "for", "date");
    			attr_dev(label2, "class", "svelte-125zpsz");
    			add_location(label2, file, 251, 8, 8643);
    			attr_dev(input4, "type", "date");
    			attr_dev(input4, "id", "date");
    			attr_dev(input4, "class", "half");
    			attr_dev(input4, "placeholder", "date");
    			add_location(input4, file, 252, 8, 8694);
    			attr_dev(input5, "type", "checkbox");
    			input5.checked = true;
    			attr_dev(input5, "class", "svelte-125zpsz");
    			add_location(input5, file, 259, 10, 8883);
    			attr_dev(span2, "class", "slider round svelte-125zpsz");
    			add_location(span2, file, 260, 10, 8928);
    			attr_dev(label3, "class", "switch svelte-125zpsz");
    			add_location(label3, file, 258, 8, 8849);
    			add_location(br3, file, 262, 8, 8985);
    			attr_dev(label4, "for", "next");
    			attr_dev(label4, "class", "svelte-125zpsz");
    			add_location(label4, file, 263, 8, 9001);
    			attr_dev(input6, "type", "date");
    			attr_dev(input6, "id", "next");
    			attr_dev(input6, "class", "half");
    			attr_dev(input6, "placeholder", "date");
    			add_location(input6, file, 264, 8, 9051);
    			attr_dev(input7, "type", "checkbox");
    			input7.checked = true;
    			attr_dev(input7, "class", "svelte-125zpsz");
    			add_location(input7, file, 271, 10, 9240);
    			attr_dev(span3, "class", "slider round svelte-125zpsz");
    			add_location(span3, file, 272, 10, 9285);
    			attr_dev(label5, "class", "switch svelte-125zpsz");
    			add_location(label5, file, 270, 8, 9206);
    		},
    		m: function mount(target, anchor) {
    			mount_component(editor, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*$content*/ ctx[0].name);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, label0, anchor);
    			append_dev(label0, input1);
    			append_dev(label0, t3);
    			append_dev(label0, span0);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, input2, anchor);
    			set_input_value(input2, /*$content*/ ctx[0].email);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, label1, anchor);
    			append_dev(label1, input3);
    			append_dev(label1, t7);
    			append_dev(label1, span1);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, label2, anchor);
    			append_dev(label2, t10);
    			append_dev(label2, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, input4, anchor);
    			set_input_value(input4, /*$content*/ ctx[0].date);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, label3, anchor);
    			append_dev(label3, input5);
    			append_dev(label3, t14);
    			append_dev(label3, span2);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, label4, anchor);
    			append_dev(label4, t17);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, input6, anchor);
    			set_input_value(input6, /*$content*/ ctx[0].next);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, label5, anchor);
    			append_dev(label5, input7);
    			append_dev(label5, t20);
    			append_dev(label5, span3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[18]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[19]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[20]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[21])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const editor_changes = {};
    			if (dirty[0] & /*lang*/ 8) editor_changes.placeholder = /*lab*/ ctx[8][/*lang*/ ctx[3]][0];
    			editor.$set(editor_changes);

    			if (!current || dirty[0] & /*lang*/ 8 && input0_placeholder_value !== (input0_placeholder_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][1])) {
    				attr_dev(input0, "placeholder", input0_placeholder_value);
    			}

    			if (dirty[0] & /*$content*/ 1 && input0.value !== /*$content*/ ctx[0].name) {
    				set_input_value(input0, /*$content*/ ctx[0].name);
    			}

    			if (!current || dirty[0] & /*lang*/ 8 && input2_placeholder_value !== (input2_placeholder_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][2])) {
    				attr_dev(input2, "placeholder", input2_placeholder_value);
    			}

    			if (dirty[0] & /*$content*/ 1 && input2.value !== /*$content*/ ctx[0].email) {
    				set_input_value(input2, /*$content*/ ctx[0].email);
    			}

    			if ((!current || dirty[0] & /*lang*/ 8) && t10_value !== (t10_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][3] + "")) set_data_dev(t10, t10_value);

    			if (dirty[0] & /*$content*/ 1) {
    				set_input_value(input4, /*$content*/ ctx[0].date);
    			}

    			if ((!current || dirty[0] & /*lang*/ 8) && t17_value !== (t17_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][4] + "")) set_data_dev(t17, t17_value);

    			if (dirty[0] & /*$content*/ 1) {
    				set_input_value(input6, /*$content*/ ctx[0].next);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(editor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(editor, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(label0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(input2);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(label1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(label2);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(input4);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(label3);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(label4);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(input6);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(label5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(223:6) <Box>",
    		ctx
    	});

    	return block;
    }

    // (277:8) <Title>
    function create_default_slot_3(ctx) {
    	let t_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][5] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*lang*/ 8 && t_value !== (t_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][5] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(277:8) <Title>",
    		ctx
    	});

    	return block;
    }

    // (276:6) <Box {content}>
    function create_default_slot_2(ctx) {
    	let title;
    	let t;
    	let div;
    	let editor;
    	let current;

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	editor = new Editor({
    			props: {
    				content: /*content*/ ctx[11],
    				placeholder: /*lab*/ ctx[8][/*lang*/ ctx[3]][5],
    				part: "summary"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t = space();
    			div = element("div");
    			create_component(editor.$$.fragment);
    			attr_dev(div, "style:display", "block");
    			add_location(div, file, 277, 2, 9412);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(editor, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty[0] & /*lang*/ 8 | dirty[1] & /*$$scope*/ 16) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const editor_changes = {};
    			if (dirty[0] & /*lang*/ 8) editor_changes.placeholder = /*lab*/ ctx[8][/*lang*/ ctx[3]][5];
    			editor.$set(editor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(editor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(editor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_component(editor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(276:6) <Box {content}>",
    		ctx
    	});

    	return block;
    }

    // (292:10) <Title {content}>
    function create_default_slot_1(ctx) {
    	let t0_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][7] + "";
    	let t0;
    	let t1;
    	let t2_value = /*i*/ ctx[32] + 1 + "";
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*lang*/ 8 && t0_value !== (t0_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][7] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(292:10) <Title {content}>",
    		ctx
    	});

    	return block;
    }

    // (291:8) <Box>
    function create_default_slot(ctx) {
    	let title;
    	let t0;
    	let buttonarray;
    	let t1;
    	let sec;
    	let t2;
    	let current;

    	title = new Title({
    			props: {
    				content: /*content*/ ctx[11],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	buttonarray = new ButtonArray({
    			props: {
    				content: /*content*/ ctx[11],
    				ind: /*i*/ ctx[32]
    			},
    			$$inline: true
    		});

    	sec = new Sec({
    			props: {
    				lang: /*lang*/ ctx[3],
    				sec: /*sec*/ ctx[33],
    				content: /*content*/ ctx[11],
    				placeholders,
    				demo: /*demo*/ ctx[7],
    				index: /*i*/ ctx[32]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			create_component(buttonarray.$$.fragment);
    			t1 = space();
    			create_component(sec.$$.fragment);
    			t2 = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(buttonarray, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(sec, target, anchor);
    			insert_dev(target, t2, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty[0] & /*lang*/ 8 | dirty[1] & /*$$scope*/ 16) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const sec_changes = {};
    			if (dirty[0] & /*lang*/ 8) sec_changes.lang = /*lang*/ ctx[3];
    			if (dirty[0] & /*$sections*/ 2) sec_changes.sec = /*sec*/ ctx[33];
    			sec.$set(sec_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(buttonarray.$$.fragment, local);
    			transition_in(sec.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(buttonarray.$$.fragment, local);
    			transition_out(sec.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(buttonarray, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(sec, detaching);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(291:8) <Box>",
    		ctx
    	});

    	return block;
    }

    // (290:6) {#each Array($sections) as sec, i}
    function create_each_block_2(ctx) {
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(box.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const box_changes = {};

    			if (dirty[0] & /*lang, $sections*/ 10 | dirty[1] & /*$$scope*/ 16) {
    				box_changes.$$scope = { dirty, ctx };
    			}

    			box.$set(box_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(290:6) {#each Array($sections) as sec, i}",
    		ctx
    	});

    	return block;
    }

    // (307:8) {#each Array($sections) as section, i}
    function create_each_block_1(ctx) {
    	let li;
    	let a;
    	let t0_value = /*$content*/ ctx[0].sections[/*i*/ ctx[32]].subtitle + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", "#section" + /*i*/ ctx[32]);
    			add_location(a, file, 308, 12, 10389);
    			attr_dev(li, "class", "bold svelte-125zpsz");
    			add_location(li, file, 307, 10, 10358);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$content*/ 1 && t0_value !== (t0_value = /*$content*/ ctx[0].sections[/*i*/ ctx[32]].subtitle + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(307:8) {#each Array($sections) as section, i}",
    		ctx
    	});

    	return block;
    }

    // (314:1) {#each Array($sections) as section, index}
    function create_each_block(ctx) {
    	let outputsection;
    	let t;
    	let current;

    	outputsection = new OutputSection({
    			props: {
    				content: /*$content*/ ctx[0],
    				index: /*index*/ ctx[30]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(outputsection.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(outputsection, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const outputsection_changes = {};
    			if (dirty[0] & /*$content*/ 1) outputsection_changes.content = /*$content*/ ctx[0];
    			outputsection.$set(outputsection_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(outputsection.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(outputsection.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(outputsection, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(314:1) {#each Array($sections) as section, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div7;
    	let div0;
    	let h1;
    	let raw0_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][11] + "";
    	let t0;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let label;
    	let input;
    	let t5;
    	let t6;
    	let button2;
    	let t8;
    	let button3;
    	let t10;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let t15;
    	let br0;
    	let t16;
    	let a;
    	let t18;
    	let div6;
    	let div2;
    	let div1;
    	let brain;
    	let t19;
    	let p;
    	let raw1_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][8] + "";
    	let t20;
    	let br1;
    	let t21;
    	let t22;
    	let button4;
    	let t23_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][10] + "";
    	let t23;
    	let t24;
    	let div5;
    	let outputtitle;
    	let t25;
    	let outputsummary;
    	let t26;
    	let div3;
    	let h3;
    	let t27_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][6] + "";
    	let t27;
    	let t28;
    	let ol;
    	let t29;
    	let hr;
    	let t30;
    	let br2;
    	let br3;
    	let br4;
    	let br5;
    	let br6;
    	let br7;
    	let t31;
    	let textarea;
    	let t32;
    	let div4;
    	let current;
    	let mounted;
    	let dispose;
    	brain = new Brain({ $$inline: true });
    	let if_block = /*$sections*/ ctx[1] && /*$content*/ ctx[0].title && create_if_block(ctx);

    	outputtitle = new OutputTitle({
    			props: { content: /*content*/ ctx[11] },
    			$$inline: true
    		});

    	outputsummary = new OutputSummary({
    			props: { content: /*content*/ ctx[11] },
    			$$inline: true
    		});

    	let each_value_1 = Array(/*$sections*/ ctx[1]);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = Array(/*$sections*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "Clear all content";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "See demo";
    			t4 = space();
    			label = element("label");
    			input = element("input");
    			t5 = text("\r\nupload previous work");
    			t6 = space();
    			button2 = element("button");
    			button2.textContent = "Save changes for later";
    			t8 = space();
    			button3 = element("button");
    			button3.textContent = "Download your web page";
    			t10 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "🗨 ENGLISH";
    			option1 = element("option");
    			option1.textContent = "🗨 FRANÇAIS";
    			option2 = element("option");
    			option2.textContent = "🗨 PORTUGUÊS";
    			option3 = element("option");
    			option3.textContent = "🗨 ESPAÑOL";
    			t15 = space();
    			br0 = element("br");
    			t16 = space();
    			a = element("a");
    			a.textContent = "feedback here please";
    			t18 = space();
    			div6 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			create_component(brain.$$.fragment);
    			t19 = space();
    			p = element("p");
    			t20 = space();
    			br1 = element("br");
    			t21 = space();
    			if (if_block) if_block.c();
    			t22 = space();
    			button4 = element("button");
    			t23 = text(t23_value);
    			t24 = space();
    			div5 = element("div");
    			create_component(outputtitle.$$.fragment);
    			t25 = space();
    			create_component(outputsummary.$$.fragment);
    			t26 = space();
    			div3 = element("div");
    			h3 = element("h3");
    			t27 = text(t27_value);
    			t28 = space();
    			ol = element("ol");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t29 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			hr = element("hr");
    			t30 = space();
    			br2 = element("br");
    			br3 = element("br");
    			br4 = element("br");
    			br5 = element("br");
    			br6 = element("br");
    			br7 = element("br");
    			t31 = space();
    			textarea = element("textarea");
    			t32 = space();
    			div4 = element("div");
    			div4.textContent = "End";
    			attr_dev(h1, "style:float", "left");
    			attr_dev(h1, "style:max-width", "100%");
    			add_location(h1, file, 178, 0, 5532);
    			set_style(button0, "height", "fit-content");
    			set_style(button0, "padding", "6px");
    			set_style(button0, "margin-top", "20px");
    			set_style(button0, "margin-right", "5px");
    			set_style(button0, "border-color", "grey");
    			attr_dev(button0, "class", "svelte-125zpsz");
    			add_location(button0, file, 182, 0, 5613);
    			set_style(button1, "height", "fit-content");
    			set_style(button1, "padding", "6px");
    			set_style(button1, "margin-top", "20px");
    			set_style(button1, "margin-right", "5px");
    			set_style(button1, "border-color", "grey");
    			attr_dev(button1, "class", "svelte-125zpsz");
    			add_location(button1, file, 185, 2, 5842);
    			attr_dev(input, "type", "file");
    			attr_dev(input, "accept", ".uneca");
    			set_style(input, "height", "fit-content");
    			set_style(input, "padding", "6px");
    			set_style(input, "margin-top", "20px");
    			attr_dev(input, "placeholder", "upload previous work");
    			attr_dev(input, "class", "svelte-125zpsz");
    			add_location(input, file, 189, 0, 6101);
    			attr_dev(label, "class", "custom-file-upload svelte-125zpsz");
    			add_location(label, file, 188, 0, 6065);
    			set_style(button2, "height", "fit-content");
    			set_style(button2, "padding", "6px");
    			set_style(button2, "margin-top", "20px");
    			set_style(button2, "margin-right", "5px");
    			set_style(button2, "border-color", "grey");
    			attr_dev(button2, "class", "svelte-125zpsz");
    			add_location(button2, file, 192, 0, 6301);
    			set_style(button3, "height", "fit-content");
    			set_style(button3, "padding", "6px");
    			set_style(button3, "margin-top", "20px");
    			set_style(button3, "margin-right", "5px");
    			set_style(button3, "border-color", "#ff7d00");
    			attr_dev(button3, "class", "svelte-125zpsz");
    			add_location(button3, file, 195, 2, 6692);
    			option0.__value = "E";
    			option0.value = option0.__value;
    			add_location(option0, file, 204, 2, 7171);
    			option1.__value = "F";
    			option1.value = option1.__value;
    			add_location(option1, file, 205, 2, 7212);
    			option2.__value = "P";
    			option2.value = option2.__value;
    			add_location(option2, file, 206, 2, 7254);
    			option3.__value = "S";
    			option3.value = option3.__value;
    			add_location(option3, file, 207, 2, 7297);
    			set_style(select, "height", "fit-content");
    			set_style(select, "margin-top", "25px");
    			attr_dev(select, "name", "lang");
    			if (/*lang*/ ctx[3] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[17].call(select));
    			add_location(select, file, 199, 0, 7075);
    			attr_dev(div0, "class", "top svelte-125zpsz");
    			add_location(div0, file, 177, 2, 5513);
    			set_style(br0, "clear", "both");
    			add_location(br0, file, 209, 0, 7353);
    			set_style(a, "font-size", "1.5em");
    			set_style(a, "margin-top", "-30px");
    			attr_dev(a, "href", "https://docs.google.com/spreadsheets/d/1VfPFMfAeJh9rW6N1xqVC_TUZQshiEK02sOCwVYMijTc/edit#gid=0");
    			add_location(a, file, 210, 0, 7380);
    			attr_dev(p, "style:padding-left", "10px");
    			add_location(p, file, 215, 6, 7660);
    			attr_dev(div1, "class", "shaded svelte-125zpsz");
    			add_location(div1, file, 213, 4, 7615);
    			add_location(br1, file, 219, 4, 7749);
    			attr_dev(button4, "class", "svelte-125zpsz");
    			add_location(button4, file, 297, 4, 10049);
    			attr_dev(div2, "class", "half_content svelte-125zpsz");
    			add_location(div2, file, 212, 2, 7583);
    			add_location(h3, file, 304, 6, 10263);
    			add_location(ol, file, 305, 6, 10294);
    			attr_dev(div3, "class", "toc svelte-125zpsz");
    			add_location(div3, file, 302, 4, 10236);
    			add_location(hr, file, 315, 8, 10606);
    			add_location(br2, file, 316, 1, 10613);
    			add_location(br3, file, 316, 5, 10617);
    			add_location(br4, file, 316, 9, 10621);
    			add_location(br5, file, 316, 13, 10625);
    			add_location(br6, file, 316, 17, 10629);
    			add_location(br7, file, 316, 21, 10633);
    			attr_dev(textarea, "id", "download");
    			add_location(textarea, file, 318, 4, 10646);
    			attr_dev(div4, "style:height", "300px");
    			add_location(div4, file, 319, 2, 10686);
    			attr_dev(div5, "id", "outputFrame");
    			attr_dev(div5, "class", "half_content right svelte-125zpsz");
    			add_location(div5, file, 299, 2, 10117);
    			attr_dev(div6, "class", "full_content svelte-125zpsz");
    			add_location(div6, file, 211, 0, 7553);
    			attr_dev(div7, "class", "page svelte-125zpsz");
    			add_location(div7, file, 176, 0, 5493);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div0, h1);
    			h1.innerHTML = raw0_value;
    			append_dev(div0, t0);
    			append_dev(div0, button0);
    			append_dev(div0, t2);
    			append_dev(div0, button1);
    			append_dev(div0, t4);
    			append_dev(div0, label);
    			append_dev(label, input);
    			append_dev(label, t5);
    			append_dev(div0, t6);
    			append_dev(div0, button2);
    			append_dev(div0, t8);
    			append_dev(div0, button3);
    			append_dev(div0, t10);
    			append_dev(div0, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			select_option(select, /*lang*/ ctx[3]);
    			append_dev(div7, t15);
    			append_dev(div7, br0);
    			append_dev(div7, t16);
    			append_dev(div7, a);
    			append_dev(div7, t18);
    			append_dev(div7, div6);
    			append_dev(div6, div2);
    			append_dev(div2, div1);
    			mount_component(brain, div1, null);
    			append_dev(div1, t19);
    			append_dev(div1, p);
    			p.innerHTML = raw1_value;
    			append_dev(div2, t20);
    			append_dev(div2, br1);
    			append_dev(div2, t21);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t22);
    			append_dev(div2, button4);
    			append_dev(button4, t23);
    			append_dev(div6, t24);
    			append_dev(div6, div5);
    			mount_component(outputtitle, div5, null);
    			append_dev(div5, t25);
    			mount_component(outputsummary, div5, null);
    			append_dev(div5, t26);
    			append_dev(div5, div3);
    			append_dev(div3, h3);
    			append_dev(h3, t27);
    			append_dev(div3, t28);
    			append_dev(div3, ol);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ol, null);
    			}

    			append_dev(div5, t29);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			append_dev(div5, hr);
    			append_dev(div5, t30);
    			append_dev(div5, br2);
    			append_dev(div5, br3);
    			append_dev(div5, br4);
    			append_dev(div5, br5);
    			append_dev(div5, br6);
    			append_dev(div5, br7);
    			append_dev(div5, t31);
    			append_dev(div5, textarea);
    			append_dev(div5, t32);
    			append_dev(div5, div4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[13], false, false, false),
    					listen_dev(input, "change", /*input_change_handler*/ ctx[14]),
    					listen_dev(input, "change", previewFile, false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[15], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[16], false, false, false),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[17]),
    					listen_dev(button4, "click", /*addSection*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*lang*/ 8) && raw0_value !== (raw0_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][11] + "")) h1.innerHTML = raw0_value;
    			if (dirty[0] & /*lang*/ 8) {
    				select_option(select, /*lang*/ ctx[3]);
    			}

    			if ((!current || dirty[0] & /*lang*/ 8) && raw1_value !== (raw1_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][8] + "")) p.innerHTML = raw1_value;
    			if (/*$sections*/ ctx[1] && /*$content*/ ctx[0].title) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$sections, $content*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, t22);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty[0] & /*lang*/ 8) && t23_value !== (t23_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][10] + "")) set_data_dev(t23, t23_value);
    			if ((!current || dirty[0] & /*lang*/ 8) && t27_value !== (t27_value = /*lab*/ ctx[8][/*lang*/ ctx[3]][6] + "")) set_data_dev(t27, t27_value);

    			if (dirty[0] & /*$content, $sections*/ 3) {
    				each_value_1 = Array(/*$sections*/ ctx[1]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ol, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*$content, $sections*/ 3) {
    				each_value = Array(/*$sections*/ ctx[1]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div5, hr);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(brain.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(outputtitle.$$.fragment, local);
    			transition_in(outputsummary.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(brain.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(outputtitle.$$.fragment, local);
    			transition_out(outputsummary.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(brain);
    			if (if_block) if_block.d();
    			destroy_component(outputtitle);
    			destroy_component(outputsummary);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function download(filename, text) {
    	var element = document.createElement("a");
    	element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    	element.setAttribute("download", filename);
    	element.style.display = "none";
    	document.body.appendChild(element);
    	element.click();
    	document.body.removeChild(element);
    }

    function previewFile() {
    	let file = document.querySelector("input[type=file]").files[0];
    	const reader = new FileReader();

    	reader.addEventListener(
    		"load",
    		() => {
    			// this will then display a text file
    			localStorage.content = reader.result;

    			location.reload();
    		},
    		false
    	);

    	if (file) {
    		reader.readAsText(file);
    	}
    }

    function instance($$self, $$props, $$invalidate) {
    	let $content;
    	let $sections;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const route = document.URL; //"https://fa1rvwwsxx343.ons.statistics.gov.uk/TimK/UNECA/"

    	let cleanSheet = {
    		"title": "Title*",
    		"name": "Author",
    		"email": "",
    		"date": "TBC",
    		"next": "TBC",
    		"summary": "Brief summary here",
    		"sections": [
    			{
    				"subtitle": "First section",
    				"graphic": "",
    				"text": "Text content",
    				"embed": "",
    				"download": ""
    			}
    		],
    		"links": [],
    		"downloads": []
    	};

    	let start = "<!DOCTYPE html><html lang='en'><meta name='viewport' content='width=device-width, initial-scale=1' /><head>";

    	fetch(route + "build/bundle.js").then(res => res.text()).then(text => {
    		$$invalidate(2, start += "<script>" + text + "<" + "/script>");
    	});

    	// console.log(CSS)
    	let getCSS = () => {
    		let str = "";
    		for (let i = 0; i < document.styleSheets.length; i++) for (let ii = 0; ii < document.styleSheets[i].cssRules.length; ii++) str += document.styleSheets[i].cssRules[ii].cssText;
    		return "<style>" + str + "</style>";
    	};

    	let demo = true;

    	let makeSection = () => {
    		$content.sections.push({
    			subtitle: "Section " + ($content.sections.length + 1),
    			graphic: "",
    			text: "",
    			embed: "",
    			download: ""
    		});

    		sections.set($sections + 1);
    	};

    	let lab = {
    		E: [
    			"title",
    			"author",
    			"contact email",
    			"publication date",
    			"next release",
    			"Summary",
    			"Table of contents",
    			"Section",
    			"<b>People have given us their data, it is our duty to give it back.</b><br><br>Your publication might change people's lives for the better - think about how to communicate the information clearly, concisely, directly and accurately.",
    			"page header",
    			"➕ add a section",
    			"ONS-UNECA web page maker"
    		],
    		F: [
    			"titre",
    			"auteur",
    			"e-mail de contact",
    			"date de publication",
    			"prochaine version",
    			"Résumé",
    			"Table des matières",
    			"Section",
    			"<b>Des personnes ont donné nous leurs données, il est de notre devoir de les rendre.</b><br><br>Votre publication pourrait changer la vie des gens pour le mieux - réfléchissez à la façon de communiquer les informations de manière claire, concise, directe et précise.",
    			"en-tête de page",
    			"➕ ajouter une section",
    			"Créateur de pages Web ONS-CEA"
    		],
    		P: [
    			"título",
    			"autor",
    			"e-mail de contato",
    			"data de publicação",
    			"próximo lançamento",
    			"Resumo",
    			"Tabela de conteúdos",
    			"Seção",
    			"<b>Pessoas deram nos seus dados, é nosso dever devolvê-los.</b><br><br>Sua publicação pode mudar a vida das pessoas para melhor - pense em como comunicar as informações de forma clara, concisa, direta e precisa.",
    			"cabeçalho da página",
    			"➕ adicionar uma seção",
    			"Criador de página da Web ONS-UNECA"
    		],
    		S: [
    			"título",
    			"autor",
    			"correo electrónico de contacto",
    			"fecha de publicación",
    			"próximo lanzamiento",
    			"Resumen",
    			"Tabla de contenido",
    			"Sección",
    			"<b>La gente ha dado nosotros sus datos, es nuestro deber devolvérselo.</b><br><br>Tu publicación podría mejorar la vida de las personas. Piensa en cómo comunicar la información de manera clara, concisa, directa y precisa",
    			"encabezado de página",
    			"➕ agregar una sección",
    			"Creador de páginas web ONS-UNECA"
    		]
    	};

    	let lang = "E";
    	let sections = writable();
    	validate_store(sections, "sections");
    	component_subscribe($$self, sections, value => $$invalidate(1, $sections = value));

    	let addSection = () => {
    		makeSection();
    	};

    	let content = writable();
    	validate_store(content, "content");
    	component_subscribe($$self, content, value => $$invalidate(0, $content = value));

    	if (localStorage.content) content.set(JSON.parse(localStorage.getItem("content"))); else {
    		content.set(demoArticle);
    		localStorage.setItem("content", JSON.stringify($content));
    	}

    	let update = what => sections[what];

    	let shiftUp = ind => {
    		let current = JSON.stringify($content.sections[ind]);
    		$content.sections.splice(ind, 1);
    		$content.sections.splice(ind + 1, 0, JSON.parse(current));
    	};

    	let shiftDown = s => s;
    	let deleteS = s => s;
    	let files;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		localStorage.content = JSON.stringify(cleanSheet);
    		location.reload();
    	};

    	const click_handler_1 = () => {
    		localStorage.content = JSON.stringify(demoArticle);
    		location.reload();
    	};

    	function input_change_handler() {
    		files = this.files;
    		$$invalidate(4, files);
    	}

    	const click_handler_2 = () => {
    		start + getCSS() + "</head><body style='height:initial; overflow-y:visible'>" + document.getElementById("outputFrame").innerHTML.split("<hr>")[0] + "<br><br></body>";
    		download("latest.uneca", localStorage.content);
    	};

    	const click_handler_3 = () => {
    		let text = start + getCSS() + "</head><body style='height:initial; overflow-y:visible'>" + document.getElementById("outputFrame").innerHTML.split("<hr>")[0] + "<br><br></body>";
    		download("index.html", text);
    	};

    	function select_change_handler() {
    		lang = select_value(this);
    		$$invalidate(3, lang);
    	}

    	function input0_input_handler() {
    		$content.name = this.value;
    		content.set($content);
    	}

    	function input2_input_handler() {
    		$content.email = this.value;
    		content.set($content);
    	}

    	function input4_input_handler() {
    		$content.date = this.value;
    		content.set($content);
    	}

    	function input6_input_handler() {
    		$content.next = this.value;
    		content.set($content);
    	}

    	$$self.$capture_state = () => ({
    		writable,
    		Sec,
    		Box,
    		Brain,
    		Title,
    		ButtonArray,
    		OutputTitle,
    		OutputSummary,
    		OutputSection,
    		placeholders,
    		Editor,
    		route,
    		demoArticle,
    		cleanSheet,
    		download,
    		start,
    		getCSS,
    		demo,
    		makeSection,
    		lab,
    		lang,
    		sections,
    		addSection,
    		content,
    		update,
    		shiftUp,
    		shiftDown,
    		deleteS,
    		files,
    		previewFile,
    		$content,
    		$sections
    	});

    	$$self.$inject_state = $$props => {
    		if ("cleanSheet" in $$props) $$invalidate(5, cleanSheet = $$props.cleanSheet);
    		if ("start" in $$props) $$invalidate(2, start = $$props.start);
    		if ("getCSS" in $$props) $$invalidate(6, getCSS = $$props.getCSS);
    		if ("demo" in $$props) $$invalidate(7, demo = $$props.demo);
    		if ("makeSection" in $$props) makeSection = $$props.makeSection;
    		if ("lab" in $$props) $$invalidate(8, lab = $$props.lab);
    		if ("lang" in $$props) $$invalidate(3, lang = $$props.lang);
    		if ("sections" in $$props) $$invalidate(9, sections = $$props.sections);
    		if ("addSection" in $$props) $$invalidate(10, addSection = $$props.addSection);
    		if ("content" in $$props) $$invalidate(11, content = $$props.content);
    		if ("update" in $$props) update = $$props.update;
    		if ("shiftUp" in $$props) shiftUp = $$props.shiftUp;
    		if ("shiftDown" in $$props) shiftDown = $$props.shiftDown;
    		if ("deleteS" in $$props) deleteS = $$props.deleteS;
    		if ("files" in $$props) $$invalidate(4, files = $$props.files);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$content*/ 1) {
    			sections.set($content.sections.length);
    		}

    		if ($$self.$$.dirty[0] & /*$sections, $content*/ 3) {
    			$sections && $content && localStorage.setItem("content", JSON.stringify($content));
    		}
    	};

    	return [
    		$content,
    		$sections,
    		start,
    		lang,
    		files,
    		cleanSheet,
    		getCSS,
    		demo,
    		lab,
    		sections,
    		addSection,
    		content,
    		click_handler,
    		click_handler_1,
    		input_change_handler,
    		click_handler_2,
    		click_handler_3,
    		select_change_handler,
    		input0_input_handler,
    		input2_input_handler,
    		input4_input_handler,
    		input6_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
