
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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

    const { console: console_1$2 } = globals;
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
    	let textarea1;
    	let textarea1_placeholder_value;
    	let t8;
    	let p3;
    	let t9_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][3] + "";
    	let t9;
    	let t10;
    	let textarea2;
    	let textarea2_placeholder_value;
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
    			textarea1 = element("textarea");
    			t8 = space();
    			p3 = element("p");
    			t9 = text(t9_value);
    			t10 = space();
    			textarea2 = element("textarea");
    			t11 = space();
    			p4 = element("p");
    			t12 = text(t12_value);
    			t13 = space();
    			input1 = element("input");
    			t14 = space();
    			create_component(slider1.$$.fragment);
    			t15 = space();
    			br = element("br");
    			attr_dev(p0, "class", "full svelte-1ma6bb3");
    			add_location(p0, file$8, 15, 0, 777);
    			attr_dev(textarea0, "type", "textarea");
    			attr_dev(textarea0, "class", "full");
    			add_location(textarea0, file$8, 16, 1, 814);
    			attr_dev(p1, "class", "full svelte-1ma6bb3");
    			add_location(p1, file$8, 17, 1, 905);
    			attr_dev(input0, "class", "half");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", input0_placeholder_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][1]);
    			add_location(input0, file$8, 19, 1, 945);
    			attr_dev(p2, "class", "full svelte-1ma6bb3");
    			add_location(p2, file$8, 20, 1, 1065);
    			attr_dev(textarea1, "class", "full");
    			attr_dev(textarea1, "type", "textarea");
    			attr_dev(textarea1, "style:width", "100%");
    			attr_dev(textarea1, "placeholder", textarea1_placeholder_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][2]);
    			add_location(textarea1, file$8, 21, 1, 1103);
    			attr_dev(p3, "class", "full svelte-1ma6bb3");
    			add_location(p3, file$8, 22, 1, 1235);
    			attr_dev(textarea2, "class", "full");
    			attr_dev(textarea2, "type", "textarea");
    			attr_dev(textarea2, "style:width", "100%");
    			attr_dev(textarea2, "placeholder", textarea2_placeholder_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][3]);
    			add_location(textarea2, file$8, 23, 1, 1273);
    			attr_dev(p4, "class", "full svelte-1ma6bb3");
    			add_location(p4, file$8, 24, 1, 1406);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "half");
    			attr_dev(input1, "placeholder", input1_placeholder_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][4]);
    			add_location(input1, file$8, 25, 1, 1444);
    			add_location(br, file$8, 28, 1, 1569);
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
    			insert_dev(target, textarea1, anchor);
    			set_input_value(textarea1, /*$content*/ ctx[3].sections[/*index*/ ctx[1]].text);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, textarea2, anchor);
    			set_input_value(textarea2, /*$content*/ ctx[3].sections[/*index*/ ctx[1]].embed);
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
    					listen_dev(textarea2, "input", /*textarea2_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9])
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

    			if (!current || dirty & /*lang*/ 1 && textarea1_placeholder_value !== (textarea1_placeholder_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][2])) {
    				attr_dev(textarea1, "placeholder", textarea1_placeholder_value);
    			}

    			if (dirty & /*$content, index*/ 10) {
    				set_input_value(textarea1, /*$content*/ ctx[3].sections[/*index*/ ctx[1]].text);
    			}

    			if ((!current || dirty & /*lang*/ 1) && t9_value !== (t9_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][3] + "")) set_data_dev(t9, t9_value);

    			if (!current || dirty & /*lang*/ 1 && textarea2_placeholder_value !== (textarea2_placeholder_value = /*lab*/ ctx[4][/*lang*/ ctx[0]][3])) {
    				attr_dev(textarea2, "placeholder", textarea2_placeholder_value);
    			}

    			if (dirty & /*$content, index*/ 10) {
    				set_input_value(textarea2, /*$content*/ ctx[3].sections[/*index*/ ctx[1]].embed);
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
    			transition_in(slider1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slider0.$$.fragment, local);
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
    			if (detaching) detach_dev(textarea1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(textarea2);
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Sec> was created with unknown prop '${key}'`);
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
    		$content.sections[index].text = this.value;
    		content.set($content);
    		$$invalidate(1, index);
    	}

    	function textarea2_input_handler() {
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
    		textarea2_input_handler,
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
    			console_1$2.warn("<Sec> was created without expected prop 'lang'");
    		}

    		if (/*index*/ ctx[1] === undefined && !("index" in props)) {
    			console_1$2.warn("<Sec> was created without expected prop 'index'");
    		}

    		if (/*content*/ ctx[2] === undefined && !("content" in props)) {
    			console_1$2.warn("<Sec> was created without expected prop 'content'");
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

    const { console: console_1$1 } = globals;
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<ButtonArray> was created with unknown prop '${key}'`);
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
    			console_1$1.warn("<ButtonArray> was created without expected prop 'content'");
    		}

    		if (/*ind*/ ctx[1] === undefined && !("ind" in props)) {
    			console_1$1.warn("<ButtonArray> was created without expected prop 'ind'");
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
    	let div1;
    	let h1;
    	let t0_value = /*$content*/ ctx[1].title + "";
    	let t0;
    	let t1;
    	let br0;
    	let t2;
    	let div0;
    	let b0;
    	let br1;
    	let t4;
    	let a;
    	let t5_value = /*$content*/ ctx[1].name + "";
    	let t5;
    	let a_href_value;
    	let br2;
    	let br3;
    	let t6;
    	let b1;
    	let br4;
    	let t8;
    	let t9_value = /*$content*/ ctx[1].date + "";
    	let t9;
    	let br5;
    	let br6;
    	let t10;
    	let b2;
    	let br7;
    	let t12;
    	let t13_value = /*$content*/ ctx[1].next + "";
    	let t13;
    	let t14;
    	let br8;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			div0 = element("div");
    			b0 = element("b");
    			b0.textContent = "Contact:";
    			br1 = element("br");
    			t4 = space();
    			a = element("a");
    			t5 = text(t5_value);
    			br2 = element("br");
    			br3 = element("br");
    			t6 = space();
    			b1 = element("b");
    			b1.textContent = "Date of publication:";
    			br4 = element("br");
    			t8 = space();
    			t9 = text(t9_value);
    			br5 = element("br");
    			br6 = element("br");
    			t10 = space();
    			b2 = element("b");
    			b2.textContent = "Next release:";
    			br7 = element("br");
    			t12 = space();
    			t13 = text(t13_value);
    			t14 = space();
    			br8 = element("br");
    			attr_dev(h1, "class", "svelte-33qg6e");
    			add_location(h1, file$3, 7, 0, 74);
    			add_location(br0, file$3, 11, 5, 108);
    			add_location(b0, file$3, 14, 0, 139);
    			add_location(br1, file$3, 14, 15, 154);
    			attr_dev(a, "href", a_href_value = "mailto:" + /*$content*/ ctx[1].email);
    			attr_dev(a, "class", "svelte-33qg6e");
    			add_location(a, file$3, 15, 0, 160);
    			add_location(br2, file$3, 15, 55, 215);
    			add_location(br3, file$3, 15, 59, 219);
    			add_location(b1, file$3, 16, 0, 225);
    			add_location(br4, file$3, 16, 27, 252);
    			add_location(br5, file$3, 17, 15, 273);
    			add_location(br6, file$3, 17, 19, 277);
    			add_location(b2, file$3, 18, 0, 283);
    			add_location(br7, file$3, 18, 20, 303);
    			attr_dev(div0, "class", "details svelte-33qg6e");
    			add_location(div0, file$3, 12, 0, 114);
    			attr_dev(div1, "class", "background svelte-33qg6e");
    			add_location(div1, file$3, 4, 0, 43);
    			add_location(br8, file$3, 22, 0, 342);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(div1, br0);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, b0);
    			append_dev(div0, br1);
    			append_dev(div0, t4);
    			append_dev(div0, a);
    			append_dev(a, t5);
    			append_dev(div0, br2);
    			append_dev(div0, br3);
    			append_dev(div0, t6);
    			append_dev(div0, b1);
    			append_dev(div0, br4);
    			append_dev(div0, t8);
    			append_dev(div0, t9);
    			append_dev(div0, br5);
    			append_dev(div0, br6);
    			append_dev(div0, t10);
    			append_dev(div0, b2);
    			append_dev(div0, br7);
    			append_dev(div0, t12);
    			append_dev(div0, t13);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, br8, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$content*/ 2 && t0_value !== (t0_value = /*$content*/ ctx[1].title + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$content*/ 2 && t5_value !== (t5_value = /*$content*/ ctx[1].name + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*$content*/ 2 && a_href_value !== (a_href_value = "mailto:" + /*$content*/ ctx[1].email)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*$content*/ 2 && t9_value !== (t9_value = /*$content*/ ctx[1].date + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*$content*/ 2 && t13_value !== (t13_value = /*$content*/ ctx[1].next + "")) set_data_dev(t13, t13_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(br8);
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
    	let t_value = /*$content*/ ctx[1].summary + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "summary svelte-anxcnq");
    			add_location(div, file$2, 5, 0, 47);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$content*/ 2 && t_value !== (t_value = /*$content*/ ctx[1].summary + "")) set_data_dev(t, t_value);
    		},
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
    			attr_dev(img, "alt", "classic baby shoes");
    			add_location(img, file$1, 8, 4, 197);
    			add_location(br0, file$1, 8, 87, 280);
    			add_location(br1, file$1, 8, 91, 284);
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
    	let t0_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].subtitle + "";
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let t3_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].text + "";
    	let t3;
    	let t4;
    	let html_tag;
    	let raw_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].embed + "";
    	let div1_id_value;
    	let if_block = /*content*/ ctx[0].sections[/*index*/ ctx[1]].graphic && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			if (if_block) if_block.c();
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			add_location(h2, file$1, 4, 0, 96);
    			add_location(div0, file$1, 6, 0, 143);
    			html_tag = new HtmlTag(null);
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
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div1, t4);
    			html_tag.m(raw_value, div1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*content, index*/ 3 && t0_value !== (t0_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].subtitle + "")) set_data_dev(t0, t0_value);

    			if (/*content*/ ctx[0].sections[/*index*/ ctx[1]].graphic) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div0, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*content, index*/ 3 && t3_value !== (t3_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].text + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*content, index*/ 3 && raw_value !== (raw_value = /*content*/ ctx[0].sections[/*index*/ ctx[1]].embed + "")) html_tag.p(raw_value);

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

    /* src\App.svelte generated by Svelte v3.31.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (185:4) {#if $sections && $content.title}
    function create_if_block(ctx) {
    	let box0;
    	let t0;
    	let box1;
    	let t1;
    	let i;
    	let t2;
    	let t3_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][6] + "";
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
    				content: /*content*/ ctx[9],
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
    			add_location(i, file, 250, 6, 7676);
    			add_location(br0, file, 251, 6, 7730);
    			add_location(br1, file, 252, 6, 7744);
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

    			if (dirty & /*$$scope, $content, lang*/ 1073741833) {
    				box0_changes.$$scope = { dirty, ctx };
    			}

    			box0.$set(box0_changes);
    			const box1_changes = {};

    			if (dirty & /*$$scope, lang, $content*/ 1073741833) {
    				box1_changes.$$scope = { dirty, ctx };
    			}

    			box1.$set(box1_changes);
    			if ((!current || dirty & /*lang*/ 8) && t3_value !== (t3_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][6] + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*lang, Array, $sections, content, placeholders, demo, lab*/ 618) {
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
    		source: "(185:4) {#if $sections && $content.title}",
    		ctx
    	});

    	return block;
    }

    // (186:6) <Box>
    function create_default_slot_4(ctx) {
    	let textarea;
    	let textarea_placeholder_value;
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
    	let t10_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][3] + "";
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
    	let t17_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][4] + "";
    	let t17;
    	let t18;
    	let input6;
    	let t19;
    	let label5;
    	let input7;
    	let t20;
    	let span3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
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
    			attr_dev(textarea, "class", "full");
    			attr_dev(textarea, "type", "textarea");
    			attr_dev(textarea, "placeholder", textarea_placeholder_value = "" + (/*lab*/ ctx[6][/*lang*/ ctx[3]][0] + "*"));
    			add_location(textarea, file, 187, 8, 5932);
    			add_location(br0, file, 193, 8, 6089);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "half");
    			attr_dev(input0, "placeholder", input0_placeholder_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][1]);
    			add_location(input0, file, 194, 8, 6105);
    			attr_dev(input1, "type", "checkbox");
    			input1.checked = true;
    			attr_dev(input1, "class", "svelte-i80pqg");
    			add_location(input1, file, 200, 10, 6281);
    			attr_dev(span0, "class", "slider round svelte-i80pqg");
    			add_location(span0, file, 201, 10, 6326);
    			attr_dev(label0, "class", "switch svelte-i80pqg");
    			add_location(label0, file, 199, 8, 6247);
    			add_location(br1, file, 203, 8, 6383);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "half");
    			attr_dev(input2, "placeholder", input2_placeholder_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][2]);
    			add_location(input2, file, 205, 8, 6401);
    			attr_dev(input3, "type", "checkbox");
    			input3.checked = true;
    			attr_dev(input3, "class", "svelte-i80pqg");
    			add_location(input3, file, 211, 10, 6578);
    			attr_dev(span1, "class", "slider round svelte-i80pqg");
    			add_location(span1, file, 212, 10, 6623);
    			attr_dev(label1, "class", "switch svelte-i80pqg");
    			add_location(label1, file, 210, 8, 6544);
    			add_location(br2, file, 214, 8, 6680);
    			attr_dev(label2, "for", "date");
    			attr_dev(label2, "class", "svelte-i80pqg");
    			add_location(label2, file, 215, 8, 6696);
    			attr_dev(input4, "type", "date");
    			attr_dev(input4, "id", "date");
    			attr_dev(input4, "class", "half");
    			attr_dev(input4, "placeholder", "date");
    			add_location(input4, file, 216, 8, 6747);
    			attr_dev(input5, "type", "checkbox");
    			input5.checked = true;
    			attr_dev(input5, "class", "svelte-i80pqg");
    			add_location(input5, file, 223, 10, 6936);
    			attr_dev(span2, "class", "slider round svelte-i80pqg");
    			add_location(span2, file, 224, 10, 6981);
    			attr_dev(label3, "class", "switch svelte-i80pqg");
    			add_location(label3, file, 222, 8, 6902);
    			add_location(br3, file, 226, 8, 7038);
    			attr_dev(label4, "for", "next");
    			attr_dev(label4, "class", "svelte-i80pqg");
    			add_location(label4, file, 227, 8, 7054);
    			attr_dev(input6, "type", "date");
    			attr_dev(input6, "id", "next");
    			attr_dev(input6, "class", "half");
    			attr_dev(input6, "placeholder", "date");
    			add_location(input6, file, 228, 8, 7104);
    			attr_dev(input7, "type", "checkbox");
    			input7.checked = true;
    			attr_dev(input7, "class", "svelte-i80pqg");
    			add_location(input7, file, 235, 10, 7293);
    			attr_dev(span3, "class", "slider round svelte-i80pqg");
    			add_location(span3, file, 236, 10, 7338);
    			attr_dev(label5, "class", "switch svelte-i80pqg");
    			add_location(label5, file, 234, 8, 7259);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*$content*/ ctx[0].title);
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

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[11]),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[12]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[13]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[14]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[15])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*lang*/ 8 && textarea_placeholder_value !== (textarea_placeholder_value = "" + (/*lab*/ ctx[6][/*lang*/ ctx[3]][0] + "*"))) {
    				attr_dev(textarea, "placeholder", textarea_placeholder_value);
    			}

    			if (dirty & /*$content*/ 1) {
    				set_input_value(textarea, /*$content*/ ctx[0].title);
    			}

    			if (dirty & /*lang*/ 8 && input0_placeholder_value !== (input0_placeholder_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][1])) {
    				attr_dev(input0, "placeholder", input0_placeholder_value);
    			}

    			if (dirty & /*$content*/ 1 && input0.value !== /*$content*/ ctx[0].name) {
    				set_input_value(input0, /*$content*/ ctx[0].name);
    			}

    			if (dirty & /*lang*/ 8 && input2_placeholder_value !== (input2_placeholder_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][2])) {
    				attr_dev(input2, "placeholder", input2_placeholder_value);
    			}

    			if (dirty & /*$content*/ 1 && input2.value !== /*$content*/ ctx[0].email) {
    				set_input_value(input2, /*$content*/ ctx[0].email);
    			}

    			if (dirty & /*lang*/ 8 && t10_value !== (t10_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][3] + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*$content*/ 1) {
    				set_input_value(input4, /*$content*/ ctx[0].date);
    			}

    			if (dirty & /*lang*/ 8 && t17_value !== (t17_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][4] + "")) set_data_dev(t17, t17_value);

    			if (dirty & /*$content*/ 1) {
    				set_input_value(input6, /*$content*/ ctx[0].next);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
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
    		source: "(186:6) <Box>",
    		ctx
    	});

    	return block;
    }

    // (241:8) <Title>
    function create_default_slot_3(ctx) {
    	let t_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][5] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*lang*/ 8 && t_value !== (t_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][5] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(241:8) <Title>",
    		ctx
    	});

    	return block;
    }

    // (240:6) <Box {content}>
    function create_default_slot_2(ctx) {
    	let title;
    	let t;
    	let div;
    	let textarea;
    	let textarea_placeholder_value;
    	let current;
    	let mounted;
    	let dispose;

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t = space();
    			div = element("div");
    			textarea = element("textarea");
    			attr_dev(textarea, "type", "textarea");
    			attr_dev(textarea, "class", "full");
    			attr_dev(textarea, "placeholder", textarea_placeholder_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][5]);
    			add_location(textarea, file, 244, 8, 7512);
    			attr_dev(div, "style:display", "block");
    			add_location(div, file, 241, 2, 7465);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, textarea);
    			set_input_value(textarea, /*$content*/ ctx[0].summary);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(textarea, "input", /*textarea_input_handler_1*/ ctx[16]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope, lang*/ 1073741832) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);

    			if (!current || dirty & /*lang*/ 8 && textarea_placeholder_value !== (textarea_placeholder_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][5])) {
    				attr_dev(textarea, "placeholder", textarea_placeholder_value);
    			}

    			if (dirty & /*$content*/ 1) {
    				set_input_value(textarea, /*$content*/ ctx[0].summary);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(240:6) <Box {content}>",
    		ctx
    	});

    	return block;
    }

    // (256:10) <Title {content}>
    function create_default_slot_1(ctx) {
    	let t0_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][7] + "";
    	let t0;
    	let t1;
    	let t2_value = /*i*/ ctx[27] + 1 + "";
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
    			if (dirty & /*lang*/ 8 && t0_value !== (t0_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][7] + "")) set_data_dev(t0, t0_value);
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
    		source: "(256:10) <Title {content}>",
    		ctx
    	});

    	return block;
    }

    // (255:8) <Box>
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
    				content: /*content*/ ctx[9],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	buttonarray = new ButtonArray({
    			props: {
    				content: /*content*/ ctx[9],
    				ind: /*i*/ ctx[27]
    			},
    			$$inline: true
    		});

    	sec = new Sec({
    			props: {
    				lang: /*lang*/ ctx[3],
    				sec: /*sec*/ ctx[28],
    				content: /*content*/ ctx[9],
    				placeholders,
    				demo: /*demo*/ ctx[5],
    				index: /*i*/ ctx[27]
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

    			if (dirty & /*$$scope, lang*/ 1073741832) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const sec_changes = {};
    			if (dirty & /*lang*/ 8) sec_changes.lang = /*lang*/ ctx[3];
    			if (dirty & /*$sections*/ 2) sec_changes.sec = /*sec*/ ctx[28];
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
    		source: "(255:8) <Box>",
    		ctx
    	});

    	return block;
    }

    // (254:6) {#each Array($sections) as sec, i}
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

    			if (dirty & /*$$scope, lang, $sections*/ 1073741834) {
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
    		source: "(254:6) {#each Array($sections) as sec, i}",
    		ctx
    	});

    	return block;
    }

    // (271:8) {#each Array($sections) as section, i}
    function create_each_block_1(ctx) {
    	let li;
    	let a;
    	let t0_value = /*$content*/ ctx[0].sections[/*i*/ ctx[27]].subtitle + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", "#section" + /*i*/ ctx[27]);
    			add_location(a, file, 272, 12, 8370);
    			attr_dev(li, "class", "bold svelte-i80pqg");
    			add_location(li, file, 271, 10, 8339);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$content*/ 1 && t0_value !== (t0_value = /*$content*/ ctx[0].sections[/*i*/ ctx[27]].subtitle + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(271:8) {#each Array($sections) as section, i}",
    		ctx
    	});

    	return block;
    }

    // (278:1) {#each Array($sections) as section, index}
    function create_each_block(ctx) {
    	let outputsection;
    	let t;
    	let current;

    	outputsection = new OutputSection({
    			props: {
    				content: /*$content*/ ctx[0],
    				index: /*index*/ ctx[25]
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
    			if (dirty & /*$content*/ 1) outputsection_changes.content = /*$content*/ ctx[0];
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
    		source: "(278:1) {#each Array($sections) as section, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div7;
    	let div0;
    	let h1;
    	let raw0_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][11] + "";
    	let t0;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let t5;
    	let br0;
    	let t6;
    	let div6;
    	let div2;
    	let div1;
    	let brain;
    	let t7;
    	let p;
    	let raw1_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][8] + "";
    	let t8;
    	let br1;
    	let t9;
    	let t10;
    	let button0;
    	let t11_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][10] + "";
    	let t11;
    	let t12;
    	let div5;
    	let outputtitle;
    	let t13;
    	let outputsummary;
    	let t14;
    	let div3;
    	let h3;
    	let t15_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][6] + "";
    	let t15;
    	let t16;
    	let ol;
    	let t17;
    	let hr;
    	let t18;
    	let br2;
    	let br3;
    	let br4;
    	let br5;
    	let br6;
    	let br7;
    	let t19;
    	let button1;
    	let t21;
    	let textarea;
    	let t22;
    	let div4;
    	let current;
    	let mounted;
    	let dispose;
    	brain = new Brain({ $$inline: true });
    	let if_block = /*$sections*/ ctx[1] && /*$content*/ ctx[0].title && create_if_block(ctx);

    	outputtitle = new OutputTitle({
    			props: { content: /*content*/ ctx[9] },
    			$$inline: true
    		});

    	outputsummary = new OutputSummary({
    			props: { content: /*content*/ ctx[9] },
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
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "🗨 ENGLISH";
    			option1 = element("option");
    			option1.textContent = "🗨 FRANÇAIS";
    			option2 = element("option");
    			option2.textContent = "🗨 PORTUGUÊS";
    			option3 = element("option");
    			option3.textContent = "🗨 ESPAÑOL";
    			t5 = space();
    			br0 = element("br");
    			t6 = space();
    			div6 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			create_component(brain.$$.fragment);
    			t7 = space();
    			p = element("p");
    			t8 = space();
    			br1 = element("br");
    			t9 = space();
    			if (if_block) if_block.c();
    			t10 = space();
    			button0 = element("button");
    			t11 = text(t11_value);
    			t12 = space();
    			div5 = element("div");
    			create_component(outputtitle.$$.fragment);
    			t13 = space();
    			create_component(outputsummary.$$.fragment);
    			t14 = space();
    			div3 = element("div");
    			h3 = element("h3");
    			t15 = text(t15_value);
    			t16 = space();
    			ol = element("ol");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t17 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			hr = element("hr");
    			t18 = space();
    			br2 = element("br");
    			br3 = element("br");
    			br4 = element("br");
    			br5 = element("br");
    			br6 = element("br");
    			br7 = element("br");
    			t19 = space();
    			button1 = element("button");
    			button1.textContent = "Obtenir le code HTML de votre page";
    			t21 = space();
    			textarea = element("textarea");
    			t22 = space();
    			div4 = element("div");
    			div4.textContent = "End";
    			attr_dev(h1, "style:float", "left");
    			attr_dev(h1, "style:max-width", "100%");
    			add_location(h1, file, 160, 0, 5281);
    			option0.__value = "E";
    			option0.value = option0.__value;
    			add_location(option0, file, 168, 2, 5455);
    			option1.__value = "F";
    			option1.value = option1.__value;
    			add_location(option1, file, 169, 2, 5496);
    			option2.__value = "P";
    			option2.value = option2.__value;
    			add_location(option2, file, 170, 2, 5538);
    			option3.__value = "S";
    			option3.value = option3.__value;
    			add_location(option3, file, 171, 2, 5581);
    			set_style(select, "height", "fit-content");
    			set_style(select, "margin-top", "25px");
    			attr_dev(select, "name", "lang");
    			if (/*lang*/ ctx[3] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[10].call(select));
    			add_location(select, file, 163, 0, 5359);
    			attr_dev(div0, "class", "top svelte-i80pqg");
    			add_location(div0, file, 159, 2, 5262);
    			set_style(br0, "clear", "both");
    			add_location(br0, file, 173, 0, 5637);
    			attr_dev(p, "style:padding-left", "10px");
    			add_location(p, file, 178, 6, 5771);
    			attr_dev(div1, "class", "shaded svelte-i80pqg");
    			add_location(div1, file, 176, 4, 5726);
    			add_location(br1, file, 182, 4, 5860);
    			attr_dev(button0, "class", "svelte-i80pqg");
    			add_location(button0, file, 261, 4, 8030);
    			attr_dev(div2, "class", "half_content svelte-i80pqg");
    			add_location(div2, file, 175, 2, 5694);
    			add_location(h3, file, 268, 6, 8244);
    			add_location(ol, file, 269, 6, 8275);
    			attr_dev(div3, "class", "toc svelte-i80pqg");
    			add_location(div3, file, 266, 4, 8217);
    			add_location(hr, file, 279, 8, 8587);
    			add_location(br2, file, 280, 1, 8594);
    			add_location(br3, file, 280, 5, 8598);
    			add_location(br4, file, 280, 9, 8602);
    			add_location(br5, file, 280, 13, 8606);
    			add_location(br6, file, 280, 17, 8610);
    			add_location(br7, file, 280, 21, 8614);
    			attr_dev(button1, "style:background-color", "green");
    			attr_dev(button1, "style:color", "white");
    			attr_dev(button1, "class", "svelte-i80pqg");
    			add_location(button1, file, 281, 2, 8622);
    			attr_dev(textarea, "id", "download");
    			add_location(textarea, file, 284, 4, 9682);
    			attr_dev(div4, "style:height", "300px");
    			add_location(div4, file, 285, 2, 9722);
    			attr_dev(div5, "id", "outputFrame");
    			attr_dev(div5, "class", "half_content right svelte-i80pqg");
    			add_location(div5, file, 263, 2, 8098);
    			attr_dev(div6, "class", "full_content svelte-i80pqg");
    			add_location(div6, file, 174, 0, 5664);
    			attr_dev(div7, "class", "page svelte-i80pqg");
    			add_location(div7, file, 158, 0, 5242);
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
    			append_dev(div0, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			select_option(select, /*lang*/ ctx[3]);
    			append_dev(div7, t5);
    			append_dev(div7, br0);
    			append_dev(div7, t6);
    			append_dev(div7, div6);
    			append_dev(div6, div2);
    			append_dev(div2, div1);
    			mount_component(brain, div1, null);
    			append_dev(div1, t7);
    			append_dev(div1, p);
    			p.innerHTML = raw1_value;
    			append_dev(div2, t8);
    			append_dev(div2, br1);
    			append_dev(div2, t9);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t10);
    			append_dev(div2, button0);
    			append_dev(button0, t11);
    			append_dev(div6, t12);
    			append_dev(div6, div5);
    			mount_component(outputtitle, div5, null);
    			append_dev(div5, t13);
    			mount_component(outputsummary, div5, null);
    			append_dev(div5, t14);
    			append_dev(div5, div3);
    			append_dev(div3, h3);
    			append_dev(h3, t15);
    			append_dev(div3, t16);
    			append_dev(div3, ol);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ol, null);
    			}

    			append_dev(div5, t17);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			append_dev(div5, hr);
    			append_dev(div5, t18);
    			append_dev(div5, br2);
    			append_dev(div5, br3);
    			append_dev(div5, br4);
    			append_dev(div5, br5);
    			append_dev(div5, br6);
    			append_dev(div5, br7);
    			append_dev(div5, t19);
    			append_dev(div5, button1);
    			append_dev(div5, t21);
    			append_dev(div5, textarea);
    			append_dev(div5, t22);
    			append_dev(div5, div4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[10]),
    					listen_dev(button0, "click", /*addSection*/ ctx[8], false, false, false),
    					listen_dev(button1, "click", /*click_handler*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*lang*/ 8) && raw0_value !== (raw0_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][11] + "")) h1.innerHTML = raw0_value;
    			if (dirty & /*lang*/ 8) {
    				select_option(select, /*lang*/ ctx[3]);
    			}

    			if ((!current || dirty & /*lang*/ 8) && raw1_value !== (raw1_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][8] + "")) p.innerHTML = raw1_value;
    			if (/*$sections*/ ctx[1] && /*$content*/ ctx[0].title) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$sections, $content*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, t10);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*lang*/ 8) && t11_value !== (t11_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][10] + "")) set_data_dev(t11, t11_value);
    			if ((!current || dirty & /*lang*/ 8) && t15_value !== (t15_value = /*lab*/ ctx[6][/*lang*/ ctx[3]][6] + "")) set_data_dev(t15, t15_value);

    			if (dirty & /*$content, $sections*/ 3) {
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

    			if (dirty & /*$content, $sections*/ 3) {
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

    const route = "https://fa1rvwwsxx343.ons.statistics.gov.uk/TimK/UNECA/";

    function download(filename, text) {
    	var element = document.createElement("a");
    	element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    	element.setAttribute("download", filename);
    	element.style.display = "none";
    	document.body.appendChild(element);
    	element.click();
    	document.body.removeChild(element);
    }

    function instance($$self, $$props, $$invalidate) {
    	let $content;
    	let $sections;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let start = "<!DOCTYPE html><html lang='en'><meta name='viewport' content='width=device-width, initial-scale=1' /><head>";

    	fetch(route + "build/bundle.js").then(res => res.text()).then(text => {
    		$$invalidate(2, start += "<script>" + text + "<" + "/script>");
    		console.log(start);
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
    			"UNECA census topic web page maker"
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
    			"Créateur de pages Web sur le sujet du recensement de la CEA"
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
    			"Criador de página da Web do tópico do censo da UNECA"
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
    			"Creador de páginas web de temas del censo de la UNECA"
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
    		content.set({
    			title: lab[lang][0] + "*",
    			name: "name",
    			email: "email",
    			date: new Date().toISOString().split("T")[0],
    			next: "to be announced",
    			summary: lab[lang][5] + "*",
    			sections: [
    				{
    					subtitle: "Mystery",
    					graphic: "https://upload.wikimedia.org/wikipedia/commons/5/54/Classic_baby_shoes.jpg",
    					text: "For sale: baby shoes. Never worn.",
    					embed: "",
    					download: ""
    				}
    			],
    			links: [],
    			downloads: []
    		});

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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		lang = select_value(this);
    		$$invalidate(3, lang);
    	}

    	function textarea_input_handler() {
    		$content.title = this.value;
    		content.set($content);
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

    	function textarea_input_handler_1() {
    		$content.summary = this.value;
    		content.set($content);
    	}

    	const click_handler = () => {
    		let text = start + getCSS() + "</head><body style='height:initial; overflow-y:visible'>" + document.getElementById("outputFrame").innerHTML.split("<hr>")[0] + "<br><br></body>";
    		(download("index.html", text), document.getElementById("download").innerHTML = text);
    		console.log(text);
    		document.getElementById("download").style.visibility = "visible";
    		navigator.clipboard.writeText(text);
    		alert("Le code HTML a été copié dans votre presse-papiers. Collez-le dans un simple éditeur de texte comme MS Bloc-notes (Notepad) et enregistrez-le sous 'index.html' \nLorsque vous cliquez sur l'icône de votre nouveau fichier, il devrait ouvrir la page Web que vous avez créée dans un navigateur. \n \nThe HTML code has been copied to your clipboard. Paste it into a simple text editor like MS Notepad and save it as 'index.html' \nWhen you click on the icon for your new file, it should open the web page you have created in a browser.");
    	};

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
    		route,
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
    		$content,
    		$sections
    	});

    	$$self.$inject_state = $$props => {
    		if ("start" in $$props) $$invalidate(2, start = $$props.start);
    		if ("getCSS" in $$props) $$invalidate(4, getCSS = $$props.getCSS);
    		if ("demo" in $$props) $$invalidate(5, demo = $$props.demo);
    		if ("makeSection" in $$props) makeSection = $$props.makeSection;
    		if ("lab" in $$props) $$invalidate(6, lab = $$props.lab);
    		if ("lang" in $$props) $$invalidate(3, lang = $$props.lang);
    		if ("sections" in $$props) $$invalidate(7, sections = $$props.sections);
    		if ("addSection" in $$props) $$invalidate(8, addSection = $$props.addSection);
    		if ("content" in $$props) $$invalidate(9, content = $$props.content);
    		if ("update" in $$props) update = $$props.update;
    		if ("shiftUp" in $$props) shiftUp = $$props.shiftUp;
    		if ("shiftDown" in $$props) shiftDown = $$props.shiftDown;
    		if ("deleteS" in $$props) deleteS = $$props.deleteS;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$content*/ 1) {
    			sections.set($content.sections.length);
    		}

    		if ($$self.$$.dirty & /*$sections, $content*/ 3) {
    			$sections && $content && localStorage.setItem("content", JSON.stringify($content));
    		}
    	};

    	return [
    		$content,
    		$sections,
    		start,
    		lang,
    		getCSS,
    		demo,
    		lab,
    		sections,
    		addSection,
    		content,
    		select_change_handler,
    		textarea_input_handler,
    		input0_input_handler,
    		input2_input_handler,
    		input4_input_handler,
    		input6_input_handler,
    		textarea_input_handler_1,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

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
