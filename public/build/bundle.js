
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.43.1' }, detail), true));
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

    /* src\App.svelte generated by Svelte v3.43.1 */

    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let input;
    	let t4;
    	let button0;
    	let t6;
    	let p1;
    	let t7;
    	let t8_value = /*picked*/ ctx[1].length + "";
    	let t8;
    	let t9;
    	let t10;
    	let p2;
    	let t11;
    	let t12_value = /*bonusList*/ ctx[2].length + "";
    	let t12;
    	let t13;
    	let div0;
    	let t14;
    	let button1;
    	let t16;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Is It A Color?";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Type a color below to check!";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			button0 = element("button");
    			button0.textContent = "Hint";
    			t6 = space();
    			p1 = element("p");
    			t7 = text("Score: ");
    			t8 = text(t8_value);
    			t9 = text(" / 148");
    			t10 = space();
    			p2 = element("p");
    			t11 = text("BONUS POINTS: ");
    			t12 = text(t12_value);
    			t13 = space();
    			div0 = element("div");
    			t14 = space();
    			button1 = element("button");
    			button1.textContent = "Reveal More";
    			t16 = space();
    			div1 = element("div");
    			attr_dev(h1, "class", "svelte-8b0u9i");
    			add_location(h1, file, 243, 2, 5391);
    			attr_dev(p0, "class", "svelte-8b0u9i");
    			add_location(p0, file, 244, 2, 5417);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "input");
    			add_location(input, file, 246, 2, 5456);
    			add_location(button0, file, 247, 2, 5515);
    			attr_dev(p1, "class", "svelte-8b0u9i");
    			add_location(p1, file, 249, 2, 5559);
    			attr_dev(p2, "id", "bonusCounter");
    			attr_dev(p2, "class", "svelte-8b0u9i");
    			add_location(p2, file, 250, 2, 5597);
    			attr_dev(div0, "id", "hint");
    			attr_dev(div0, "class", "svelte-8b0u9i");
    			add_location(div0, file, 252, 2, 5659);
    			attr_dev(button1, "id", "reveal");
    			attr_dev(button1, "class", "svelte-8b0u9i");
    			add_location(button1, file, 253, 2, 5679);
    			attr_dev(div1, "id", "list");
    			attr_dev(div1, "class", "svelte-8b0u9i");
    			add_location(div1, file, 254, 2, 5744);
    			set_style(main, "background", /*guess*/ ctx[0]);
    			attr_dev(main, "class", "svelte-8b0u9i");
    			add_location(main, file, 242, 0, 5353);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, p0);
    			append_dev(main, t3);
    			append_dev(main, input);
    			append_dev(main, t4);
    			append_dev(main, button0);
    			append_dev(main, t6);
    			append_dev(main, p1);
    			append_dev(p1, t7);
    			append_dev(p1, t8);
    			append_dev(p1, t9);
    			append_dev(main, t10);
    			append_dev(main, p2);
    			append_dev(p2, t11);
    			append_dev(p2, t12);
    			append_dev(main, t13);
    			append_dev(main, div0);
    			append_dev(main, t14);
    			append_dev(main, button1);
    			append_dev(main, t16);
    			append_dev(main, div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*handleInput*/ ctx[3], false, false, false),
    					listen_dev(button0, "click", /*getHint*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*revealMore*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*picked*/ 2 && t8_value !== (t8_value = /*picked*/ ctx[1].length + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*bonusList*/ 4 && t12_value !== (t12_value = /*bonusList*/ ctx[2].length + "")) set_data_dev(t12, t12_value);

    			if (dirty & /*guess*/ 1) {
    				set_style(main, "background", /*guess*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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

    function isValidColor(strColor) {
    	let s = new Option().style;
    	s.color = strColor;
    	return s.color == strColor.toLowerCase();
    }

    function addColorBlock(strColor) {
    	const newDiv = document.createElement("div");
    	const newContent = document.createTextNode('"' + strColor + '"');
    	newDiv.appendChild(newContent);
    	newDiv.classList.add("colorBlock");
    	newDiv.style.backgroundColor = strColor;
    	newDiv.style.height = "100px";
    	newDiv.style.width = "200px";
    	newDiv.style.border = "1px solid black";
    	newDiv.style.margin = "20px";
    	newDiv.style.borderRadius = "50px";
    	newDiv.style.lineHeight = "90px";
    	newDiv.style.fontSize = "20px";
    	document.getElementById("list").appendChild(newDiv);
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const allColors = [
    		"AliceBlue",
    		"AntiqueWhite",
    		"Aqua",
    		"Aquamarine",
    		"Azure",
    		"Beige",
    		"Bisque",
    		"Black",
    		"BlanchedAlmond",
    		"Blue",
    		"BlueViolet",
    		"Brown",
    		"BurlyWood",
    		"CadetBlue",
    		"Chartreuse",
    		"Chocolate",
    		"Coral",
    		"CornflowerBlue",
    		"Cornsilk",
    		"Crimson",
    		"Cyan",
    		"DarkBlue",
    		"DarkCyan",
    		"DarkGoldenRod",
    		"DarkGray",
    		"DarkGrey",
    		"DarkGreen",
    		"DarkKhaki",
    		"DarkMagenta",
    		"DarkOliveGreen",
    		"DarkOrange",
    		"DarkOrchid",
    		"DarkRed",
    		"DarkSalmon",
    		"DarkSeaGreen",
    		"DarkSlateBlue",
    		"DarkSlateGray",
    		"DarkSlateGrey",
    		"DarkTurquoise",
    		"DarkViolet",
    		"DeepPink",
    		"DeepSkyBlue",
    		"DimGray",
    		"DimGrey",
    		"DodgerBlue",
    		"FireBrick",
    		"FloralWhite",
    		"ForestGreen",
    		"Fuchsia",
    		"Gainsboro",
    		"GhostWhite",
    		"Gold",
    		"GoldenRod",
    		"Gray",
    		"Grey",
    		"Green",
    		"GreenYellow",
    		"HoneyDew",
    		"HotPink",
    		"IndianRed",
    		"Indigo",
    		"Ivory",
    		"Khaki",
    		"Lavender",
    		"LavenderBlush",
    		"LawnGreen",
    		"LemonChiffon",
    		"LightBlue",
    		"LightCoral",
    		"LightCyan",
    		"LightGoldenRodYellow",
    		"LightGray",
    		"LightGrey",
    		"LightGreen",
    		"LightPink",
    		"LightSalmon",
    		"LightSeaGreen",
    		"LightSkyBlue",
    		"LightSlateGray",
    		"LightSlateGrey",
    		"LightSteelBlue",
    		"LightYellow",
    		"Lime",
    		"LimeGreen",
    		"Linen",
    		"Magenta",
    		"Maroon",
    		"MediumAquaMarine",
    		"MediumBlue",
    		"MediumOrchid",
    		"MediumPurple",
    		"MediumSeaGreen",
    		"MediumSlateBlue",
    		"MediumSpringGreen",
    		"MediumTurquoise",
    		"MediumVioletRed",
    		"MidnightBlue",
    		"MintCream",
    		"MistyRose",
    		"Moccasin",
    		"NavajoWhite",
    		"Navy",
    		"OldLace",
    		"Olive",
    		"OliveDrab",
    		"Orange",
    		"OrangeRed",
    		"Orchid",
    		"PaleGoldenRod",
    		"PaleGreen",
    		"PaleTurquoise",
    		"PaleVioletRed",
    		"PapayaWhip",
    		"PeachPuff",
    		"Peru",
    		"Pink",
    		"Plum",
    		"PowderBlue",
    		"Purple",
    		"RebeccaPurple",
    		"Red",
    		"RosyBrown",
    		"RoyalBlue",
    		"SaddleBrown",
    		"Salmon",
    		"SandyBrown",
    		"SeaGreen",
    		"SeaShell",
    		"Sienna",
    		"Silver",
    		"SkyBlue",
    		"SlateBlue",
    		"SlateGray",
    		"SlateGrey",
    		"Snow",
    		"SpringGreen",
    		"SteelBlue",
    		"Tan",
    		"Teal",
    		"Thistle",
    		"Tomato",
    		"Turquoise",
    		"Violet",
    		"Wheat",
    		"White",
    		"WhiteSmoke",
    		"Yellow",
    		"YellowGreen"
    	];

    	let guess;
    	let picked = [];
    	let unpicked = allColors;
    	let allColorsLower = allColors.map(v => v.toLowerCase());
    	let unpickedLower = allColorsLower;
    	let randomUnpickedColor = unpicked[Math.floor(Math.random() * unpicked.length)];
    	let bonusList = [];

    	function handleInput(e) {
    		let colorGuess = e.target.value.toLowerCase();

    		if (isValidColor(colorGuess) && !picked.includes(colorGuess) && !bonusList.includes(colorGuess)) {
    			addColorBlock(colorGuess);

    			if (allColorsLower.includes(colorGuess)) {
    				updateLists(colorGuess);
    			} else {
    				$$invalidate(2, bonusList = [...bonusList, colorGuess]);
    				document.getElementById("bonusCounter").style.display = "block";
    			}

    			e.target.value = "";
    			$$invalidate(0, guess = colorGuess);

    			if (colorGuess == randomUnpickedColor.toLowerCase()) {
    				document.getElementById("hint").style.display = "none";
    				document.getElementById("reveal").style.display = "none";
    			}
    		}
    	}

    	function updateLists(strColor) {
    		unpickedLower = unpickedLower.filter(color => color !== strColor);
    		$$invalidate(1, picked = [...picked, strColor]);
    	}

    	let reveal = 3;

    	function getHint() {
    		randomUnpickedColor = unpickedLower[Math.floor(Math.random() * unpickedLower.length)];
    		document.getElementById("hint").style.display = "block";
    		document.getElementById("hint").innerHTML = "Hint:" + randomUnpickedColor[0] + randomUnpickedColor[1] + "..." + randomUnpickedColor[randomUnpickedColor.length - 1];
    		document.getElementById("hint").style.border = "5px solid " + randomUnpickedColor;
    		document.getElementById("reveal").style.display = "block";
    		reveal = 3;
    		document.getElementById("input").focus();
    	}

    	function revealMore() {
    		let length = randomUnpickedColor.length;
    		let newHint = "";

    		for (let i = 0; i < length; i++) {
    			if (i < reveal || i > length - reveal) {
    				newHint += randomUnpickedColor[i];
    			} else {
    				newHint += ".";
    			}
    		}

    		document.getElementById("hint").innerHTML = "Hint:" + newHint;
    		reveal++;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		allColors,
    		guess,
    		picked,
    		unpicked,
    		allColorsLower,
    		unpickedLower,
    		randomUnpickedColor,
    		bonusList,
    		isValidColor,
    		handleInput,
    		updateLists,
    		addColorBlock,
    		reveal,
    		getHint,
    		revealMore
    	});

    	$$self.$inject_state = $$props => {
    		if ('guess' in $$props) $$invalidate(0, guess = $$props.guess);
    		if ('picked' in $$props) $$invalidate(1, picked = $$props.picked);
    		if ('unpicked' in $$props) unpicked = $$props.unpicked;
    		if ('allColorsLower' in $$props) allColorsLower = $$props.allColorsLower;
    		if ('unpickedLower' in $$props) unpickedLower = $$props.unpickedLower;
    		if ('randomUnpickedColor' in $$props) randomUnpickedColor = $$props.randomUnpickedColor;
    		if ('bonusList' in $$props) $$invalidate(2, bonusList = $$props.bonusList);
    		if ('reveal' in $$props) reveal = $$props.reveal;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [guess, picked, bonusList, handleInput, getHint, revealMore];
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

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
