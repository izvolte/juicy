(function(window, undefined) {
    'use strict';

    if (!window) return; // Server side

    var $ = window.$;
    var _baron = baron; // Stored baron value for noConflict usage
    var pos = ['left', 'top', 'right', 'bottom', 'width', 'height'];
    // Global store for all baron instances (to be able to dispose them on html-nodes)
    var instances = [];
    var origin = {
        v: { // Vertical
            x: 'Y', pos: pos[1], oppos: pos[3], crossPos: pos[0], crossOpPos: pos[2],
            size: pos[5],
            crossSize: pos[4], crossMinSize: 'min-' + pos[4], crossMaxSize: 'max-' + pos[4],
            client: 'clientHeight', crossClient: 'clientWidth',
            scrollEdge: 'scrollLeft',
            offset: 'offsetHeight', crossOffset: 'offsetWidth', offsetPos: 'offsetTop',
            scroll: 'scrollTop', scrollSize: 'scrollHeight'
        },
        h: { // Horizontal
            x: 'X', pos: pos[0], oppos: pos[2], crossPos: pos[1], crossOpPos: pos[3],
            size: pos[4],
            crossSize: pos[5], crossMinSize: 'min-' + pos[5], crossMaxSize: 'max-' + pos[5],
            client: 'clientWidth', crossClient: 'clientHeight',
            scrollEdge: 'scrollTop',
            offset: 'offsetWidth', crossOffset: 'offsetHeight', offsetPos: 'offsetLeft',
            scroll: 'scrollLeft', scrollSize: 'scrollWidth'
        }
    };

    // window.baron and jQuery.fn.baron points to this function
    function baron(params) {
        var jQueryMode;
        var roots;
        var empty = !params;
        var defaultParams = {
            $: window.jQuery,
            direction: 'v',
            barOnCls: '_scrollbar',
            resizeDebounce: 0,
            event: function(elem, event, func, mode) {
                params.$(elem)[mode || 'on'](event, func);
            },
            cssGuru: false
        };

        params = params || {};

        // Extending default params by user-defined params
        for (var key in defaultParams) {
            if (params[key] === undefined) {
                params[key] = defaultParams[key];
            }
        };

        jQueryMode = this instanceof params.$;  // this - global context or jQuery instance

        if (jQueryMode) {
            params.root = roots = this;
        } else {
            roots = params.$(params.root || params.scroller);
        }

        var instance = new baron.fn.constructor(roots, params, empty);

        if (instance.autoUpdate && !empty) {
            instance.autoUpdate();
        }

        return instance;
    }

    function arrayEach(obj, iterator) {
        var i = 0;

        if (obj.length === undefined || obj === window) obj = [obj];

        while (obj[i]) {
            iterator.call(this, obj[i], i);
            i++;
        }
    }

    // shortcut for getTime
    function getTime() {
        return new Date().getTime();
    }

    baron._instances = instances; // for debug

    baron.fn = {
        constructor: function(roots, totalParams, noUserParams) {
            var params = clone(totalParams);

            // Intrinsic params.event is not the same as totalParams.event
            params.event = function(elems, e, func, mode) {
                arrayEach(elems, function(elem) {
                    totalParams.event(elem, e, func, mode);
                });
            };

            this.length = 0;

            arrayEach.call(this, roots, function(root, i) {
                var attr = manageAttr(root, params.direction);
                var id = +attr; // Could be NaN

                // baron() without params can return existing instances,
                // but baron(params) will throw an Error as a second initialization
                if (id == id && attr != undefined && instances[id] && noUserParams) {
                    this[i] = instances[id];
                } else {
                    var perInstanceParams = clone(params);

                    // root and scroller can be different nodes
                    if (params.root && params.scroller) {
                        perInstanceParams.scroller = params.$(params.scroller, root);
                        if (!perInstanceParams.scroller.length) {
                            perInstanceParams.scroller = root;
                        }
                    } else {
                        perInstanceParams.scroller = root;
                    }

                    perInstanceParams.root = root;
                    this[i] = init(perInstanceParams);
                }

                this.length = i + 1;
            });

            this.params = params;
        },

        dispose: function() {
            var params = this.params;

            arrayEach(this, function(item) {
                item.dispose(params);
            });

            this.params = null;
        },

        update: function() {
            var i = 0;

            while (this[i]) {
                this[i].update.apply(this[i], arguments);
                i++;
            }
        },

        baron: function(params) {
            params.root = [];
            params.scroller = this.params.scroller;

            arrayEach.call(this, this, function(elem) {
                params.root.push(elem.root);
            });
            params.direction = (this.params.direction == 'v') ? 'h' : 'v';
            params._chain = true;

            return baron(params);
        }
    };

    function manageEvents(item, eventManager, mode) {
        // Creating new functions for one baron item only one time
        item._eventHandlers = item._eventHandlers || [
            {
                // onScroll:
                element: item.scroller,

                handler: function(e) {
                    item.scroll(e);
                },

                type: 'scroll'
            }, {
                // css transitions & animations
                element: item.root,

                handler: function() {
                    item.update();
                },

                type: 'transitionend animationend'
            }, {
                // onKeyup (textarea):
                element: item.scroller,

                handler: function() {
                    item.update();
                },

                type: 'keyup'
            }, {
                // onMouseDown:
                element: item.bar,

                handler: function(e) {
                    e.preventDefault(); // Text selection disabling in Opera
                    item.selection(); // Disable text selection in ie8
                    item.drag.now = 1; // Save private byte
                    if (item.draggingCls) {
                        $(item.bar).addClass(item.draggingCls);
                    }
                },

                type: 'touchstart mousedown'
            }, {
                // onMouseUp:
                element: document,

                handler: function() {
                    item.selection(1); // Enable text selection
                    item.drag.now = 0;
                    if (item.draggingCls) {
                        $(item.bar).removeClass(item.draggingCls);
                    }
                },

                type: 'mouseup blur touchend'
            }, {
                // onCoordinateReset:
                element: document,

                handler: function(e) {
                    if (e.button != 2) { // Not RM
                        item._pos0(e);
                    }
                },

                type: 'touchstart mousedown'
            }, {
                // onMouseMove:
                element: document,

                handler: function(e) {
                    if (item.drag.now) {
                        item.drag(e);
                    }
                },

                type: 'mousemove touchmove'
            }, {
                // onResize:
                element: window,

                handler: function() {
                    item.update();
                },

                type: 'resize'
            }, {
                // sizeChange:
                element: item.root,

                handler: function() {
                    item.update();
                },

                type: 'sizeChange'
            }, {
                // Clipper onScroll bug https://github.com/Diokuz/baron/issues/116
                element: item.clipper,

                handler: function() {
                    item.clipperOnScroll();
                },

                type: 'scroll'
            }
        ];

        arrayEach(item._eventHandlers, function(event) {
            if (event.element) {
                eventManager(event.element, event.type, event.handler, mode);
            }
        });

        // if (item.scroller) {
        //     event(item.scroller, 'scroll', item._eventHandlers.onScroll, mode);
        // }
        // if (item.bar) {
        //     event(item.bar, 'touchstart mousedown', item._eventHandlers.onMouseDown, mode);
        // }
        // event(document, 'mouseup blur touchend', item._eventHandlers.onMouseUp, mode);
        // event(document, 'touchstart mousedown', item._eventHandlers.onCoordinateReset, mode);
        // event(document, 'mousemove touchmove', item._eventHandlers.onMouseMove, mode);
        // event(window, 'resize', item._eventHandlers.onResize, mode);
        // if (item.root) {
        //     event(item.root, 'sizeChange', item._eventHandlers.onResize, mode);
        //     // Custon event for alternate baron update mechanism
        // }
    }

    // set, remove or read baron-specific id-attribute
    // @returns {String|undefined} - id node value, or undefined, if there is no attr
    function manageAttr(node, direction, mode, id) {
        var attrName = 'data-baron-' + direction + '-id';

        if (mode == 'on') {
            node.setAttribute(attrName, id);
        } else if (mode == 'off') {
            node.removeAttribute(attrName);
        } else {
            return node.getAttribute(attrName);
        }
    }

    function init(params) {
        if (manageAttr(params.root, params.direction)) {
            console.log('Error! Baron for this node already initialized', params.root);
        }

        // __proto__ of returning object is baron.prototype
        var out = new item.prototype.constructor(params);

        manageEvents(out, params.event, 'on');

        manageAttr(out.root, params.direction, 'on', instances.length);
        instances.push(out);

        out.update();

        out.scrollEdge = 0;
        if (params.rtl) {
            out.scrollEdge = out.clipper[out.origin.scrollEdge]; // initial position
        }

        return out;
    }

    function clone(input) {
        var output = {};

        input = input || {};

        for (var key in input) {
            if (input.hasOwnProperty(key)) {
                output[key] = input[key];
            }
        }

        return output;
    }

    function validate(input) {
        var output = clone(input);

        output.event = function(elems, e, func, mode) {
            arrayEach(elems, function(elem) {
                input.event(elem, e, func, mode);
            });
        };

        return output;
    }

    function fire(eventName) {
        /* jshint validthis:true */
        if (this.events && this.events[eventName]) {
            for (var i = 0 ; i < this.events[eventName].length ; i++) {
                var args = Array.prototype.slice.call( arguments, 1 );

                this.events[eventName][i].apply(this, args);
            }
        }
    }

    var item = {};

    item.prototype = {
        // underscore.js realization
        // used in autoUpdate plugin
        _debounce: function(func, wait) {
            var self = this,
                timeout,
                // args, // right now there is no need for arguments
                // context, // and for context
                timestamp;
            // result; // and for result

            var later = function() {
                if (self._disposed) {
                    clearTimeout(timeout);
                    timeout = self = null;
                    return;
                }

                var last = getTime() - timestamp;

                if (last < wait && last >= 0) {
                    timeout = setTimeout(later, wait - last);
                } else {
                    timeout = null;
                    // result = func.apply(context, args);
                    func();
                    // context = args = null;
                }
            };

            return function() {
                // context = this;
                // args = arguments;
                timestamp = getTime();

                if (!timeout) {
                    timeout = setTimeout(later, wait);
                }

                // return result;
            };
        },

        constructor: function(params) {
            var $,
                barPos,
                scrollerPos0,
                track,
                resizePauseTimer,
                scrollingTimer,
                scrollLastFire,
                resizeLastFire,
                oldBarSize;

            resizeLastFire = scrollLastFire = getTime();

            $ = this.$ = params.$;
            this.event = params.event;
            this.events = {};

            function getNode(sel, context) {
                return $(sel, context)[0]; // Can be undefined
            }

            // DOM elements
            this.root = params.root; // Always html node, not just selector
            this.scroller = getNode(params.scroller);
            this.bar = getNode(params.bar, this.root);
            track = this.track = getNode(params.track, this.root);
            if (!this.track && this.bar) {
                track = this.bar.parentNode;
            }
            this.clipper = this.scroller.parentNode;

            // Parameters
            this.direction = params.direction;
            this.origin = origin[this.direction];
            this.barOnCls = params.barOnCls || '_baron';
            this.scrollingCls = params.scrollingCls;
            this.draggingCls = params.draggingCls;
            this.impact = params.impact;
            this.barTopLimit = 0;
            this.resizeDebounce = params.resizeDebounce;

            // Updating height or width of bar
            function setBarSize(size) {
                /* jshint validthis:true */
                var barMinSize = this.barMinSize || 20;

                if (size > 0 && size < barMinSize) {
                    size = barMinSize;
                }

                if (this.bar) {
                    $(this.bar).css(this.origin.size, parseInt(size, 10) + 'px');
                }
            }

            // Updating top or left bar position
            function posBar(pos) {
                /* jshint validthis:true */
                if (this.bar) {
                    var was = $(this.bar).css(this.origin.pos),
                        will = +pos + 'px';

                    if (will && will != was) {
                        $(this.bar).css(this.origin.pos, will);
                    }
                }
            }

            // Free path for bar
            function k() {
                /* jshint validthis:true */
                return track[this.origin.client] - this.barTopLimit - this.bar[this.origin.offset];
            }

            // Relative content top position to bar top position
            function relToPos(r) {
                /* jshint validthis:true */
                return r * k.call(this) + this.barTopLimit;
            }

            // Bar position to relative content position
            function posToRel(t) {
                /* jshint validthis:true */
                return (t - this.barTopLimit) / k.call(this);
            }

            // Cursor position in main direction in px // Now with iOs support
            this.cursor = function(e) {
                return e['client' + this.origin.x] ||
                    (((e.originalEvent || e).touches || {})[0] || {})['page' + this.origin.x];
            };

            // Text selection pos preventing
            function dontPosSelect() {
                return false;
            }

            this.pos = function(x) { // Absolute scroller position in px
                var ie = 'page' + this.origin.x + 'Offset',
                    key = (this.scroller[ie]) ? ie : this.origin.scroll;

                if (x !== undefined) this.scroller[key] = x;

                return this.scroller[key];
            };

            this.rpos = function(r) { // Relative scroller position (0..1)
                var free = this.scroller[this.origin.scrollSize] - this.scroller[this.origin.client],
                    x;

                if (r) {
                    x = this.pos(r * free);
                } else {
                    x = this.pos();
                }

                return x / (free || 1);
            };

            // Switch on the bar by adding user-defined CSS classname to scroller
            this.barOn = function(dispose) {
                if (this.barOnCls) {
                    if (dispose ||
                        this.scroller[this.origin.client] >= this.scroller[this.origin.scrollSize])
                    {
                        if ($(this.root).hasClass(this.barOnCls)) {
                            $(this.root).removeClass(this.barOnCls);
                        }
                    } else {
                        if (!$(this.root).hasClass(this.barOnCls)) {
                            $(this.root).addClass(this.barOnCls);
                        }
                    }
                }
            };

            this._pos0 = function(e) {
                scrollerPos0 = this.cursor(e) - barPos;
            };

            this.drag = function(e) {
                var rel = posToRel.call(this, this.cursor(e) - scrollerPos0);
                var k = (this.scroller[this.origin.scrollSize] - this.scroller[this.origin.client]);
                this.scroller[this.origin.scroll] = rel * k;
            };

            // Text selection preventing on drag
            this.selection = function(enable) {
                this.event(document, 'selectpos selectstart', dontPosSelect, enable ? 'off' : 'on');
            };

            // onResize & DOM modified handler
            // also fires on init
            this.resize = function() {
                var self = this;
                var minPeriod = (self.resizeDebounce === undefined) ? 300 : self.resizeDebounce;
                var delay = 0;

                if (getTime() - resizeLastFire < minPeriod) {
                    clearTimeout(resizePauseTimer);
                    delay = minPeriod;
                }

                function upd() {
                    var was;
                    var will;
                    var offset = self.scroller[self.origin.crossOffset];
                    var client = self.scroller[self.origin.crossClient];

                    // Opera 12 bug https://github.com/Diokuz/baron/issues/105
                    if (client > 0 && offset === 0) {
                        // Only Opera 12 in some rare nested flexbox cases goes here
                        // Sorry guys for magic,
                        // but I dont want to create temporary html-nodes set
                        // just for measuring scrollbar size in Opera 12.
                        // 17px for Windows XP-8.1, 15px for Mac (really rare).
                        offset = client + 17;
                    }

                    if (offset) { // if there is no size, css should not be set
                        self.barOn();
                        client = self.scroller[self.origin.crossClient];

                        // Two different appropches
                        var fixScroller = self.impact ?
                            (self.impact == 'scroller') :
                            (self.direction == 'v');

                        if (fixScroller) { // scroller
                            var delta = offset - client;

                            was = $(self.clipper).css(self.origin.crossSize);
                            will = self.clipper[self.origin.crossClient] + delta + 'px';

                            if (was != will) {
                                self._setCrossSizes(self.scroller, will);
                            }
                        } else { // clipper
                            was = $(self.clipper).css(self.origin.crossSize);
                            will = client + 'px';

                            if (was != will) {
                                self._setCrossSizes(self.clipper, will);
                            }
                        }
                    }

                    Array.prototype.unshift.call(arguments, 'resize');
                    fire.apply(self, arguments);

                    resizeLastFire = getTime();
                }

                if (delay) {
                    resizePauseTimer = setTimeout(upd, delay);
                } else {
                    upd();
                }
            };

            this.updatePositions = function() {
                var newBarSize,
                    self = this;

                if (self.bar) {
                    newBarSize = (track[self.origin.client] - self.barTopLimit) *
                        self.scroller[self.origin.client] / self.scroller[self.origin.scrollSize];

                    // Positioning bar
                    if (parseInt(oldBarSize, 10) != parseInt(newBarSize, 10)) {
                        setBarSize.call(self, newBarSize);
                        oldBarSize = newBarSize;
                    }

                    barPos = relToPos.call(self, self.rpos());

                    posBar.call(self, barPos);
                }

                Array.prototype.unshift.call( arguments, 'scroll' );
                fire.apply(self, arguments);

                scrollLastFire = getTime();
            };

            // onScroll handler
            this.scroll = function() {
                var self = this;

                self.updatePositions();

                if (self.scrollingCls) {
                    if (!scrollingTimer) {
                        self.$(self.root).addClass(self.scrollingCls);
                    }
                    clearTimeout(scrollingTimer);
                    scrollingTimer = setTimeout(function() {
                        self.$(self.root).removeClass(self.scrollingCls);
                        scrollingTimer = undefined;
                    }, 300);
                }

            };

            // https://github.com/Diokuz/baron/issues/116
            this.clipperOnScroll = function() {
                if (this.direction == 'h') return;

                // clipper.scrollLeft = initial scroll position (0 for ltr, 17 for rtl)
                this.clipper[this.origin.scrollEdge] = this.scrollEdge;
            };

            // Flexbox `align-items: stretch` (default) requires to set min-width for vertical
            // and max-height for horizontal scroll. Just set them all.
            // http://www.w3.org/TR/css-flexbox-1/#valdef-align-items-stretch
            this._setCrossSizes = function(node, size) {
                var css = {};

                css[this.origin.crossSize] = size;
                css[this.origin.crossMinSize] = size;
                css[this.origin.crossMaxSize] = size;

                this.$(node).css(css);
            };

            // Set most common css rules
            this._dumbCss = function(on) {
                if (params.cssGuru) return;

                var overflow = on ? 'hidden' : null;
                var msOverflowStyle = on ? 'none' : null;

                this.$(this.clipper).css({
                    overflow: overflow,
                    msOverflowStyle: msOverflowStyle
                });

                var scroll = on ? 'scroll' : null;
                var axis = this.direction == 'v' ? 'y' : 'x';
                var scrollerCss = {};

                scrollerCss['overflow-' + axis] = scroll;
                scrollerCss['box-sizing'] = 'border-box';
                scrollerCss.margin = '0';
                scrollerCss.border = '0';
                this.$(this.scroller).css(scrollerCss);
            };

            return this;
        },

        // fires on any update and on init
        update: function(params) {
            fire.call(this, 'upd', params); // Update all plugins' params

            this._dumbCss(true);
            this.resize(1);
            this.updatePositions();

            return this;
        },

        // One instance
        dispose: function(params) {
            manageEvents(this, this.event, 'off');
            manageAttr(this.root, params.direction, 'off');
            if (params.direction == 'v') {
                this._setCrossSizes(this.scroller, '');
            } else {
                this._setCrossSizes(this.clipper, '');
            }
            this._dumbCss(false);
            this.barOn(true);
            fire.call(this, 'dispose');
            this._disposed = true;
        },

        on: function(eventName, func, arg) {
            var names = eventName.split(' ');

            for (var i = 0 ; i < names.length ; i++) {
                if (names[i] == 'init') {
                    func.call(this, arg);
                } else {
                    this.events[names[i]] = this.events[names[i]] || [];

                    this.events[names[i]].push(function(userArg) {
                        func.call(this, userArg || arg);
                    });
                }
            }
        }
    };

    baron.fn.constructor.prototype = baron.fn;
    item.prototype.constructor.prototype = item.prototype;

    // Use when you need "baron" global var for another purposes
    baron.noConflict = function() {
        window.baron = _baron; // Restoring original value of "baron" global var

        return baron;
    };

    baron.version = '1.2.1';

    if ($ && $.fn) { // Adding baron to jQuery as plugin
        $.fn.baron = baron;
    }

    window.baron = baron; // Use noConflict method if you need window.baron var for another purposes
    if (typeof module != 'undefined') {
        module.exports = baron.noConflict();
    }
})(window);

/* Fixable elements plugin for baron 0.6+ */
(function(window, undefined) {
    var fix = function(userParams) {
        var elements, viewPortSize,
            params = { // Default params
                outside: '',
                inside: '',
                before: '',
                after: '',
                past: '',
                future: '',
                radius: 0,
                minView: 0
            },
            topFixHeights = [], // inline style for element
            topRealHeights = [], // ? something related to negative margins for fixable elements
            headerTops = [], // offset positions when not fixed
            scroller = this.scroller,
            eventManager = this.event,
            $ = this.$,
            self = this;

        // i - number of fixing element, pos - fix-position in px, flag - 1: top, 2: bottom
        // Invocation only in case when fix-state changed
        function fixElement(i, pos, flag) {
            var ori = flag == 1 ? 'pos' : 'oppos';

            if (viewPortSize < (params.minView || 0)) { // No headers fixing when no enought space for viewport
                pos = undefined;
            }

            // Removing all fixing stuff - we can do this because fixElement triggers only when fixState really changed
            this.$(elements[i]).css(this.origin.pos, '').css(this.origin.oppos, '').removeClass(params.outside);

            // Fixing if needed
            if (pos !== undefined) {
                pos += 'px';
                this.$(elements[i]).css(this.origin[ori], pos).addClass(params.outside);
            }
        }

        function bubbleWheel(e) {
            try {
                i = document.createEvent('WheelEvent'); // i - for extra byte
                // evt.initWebKitWheelEvent(deltaX, deltaY, window, screenX, screenY, clientX, clientY, ctrlKey, altKey, shiftKey, metaKey);
                i.initWebKitWheelEvent(e.originalEvent.wheelDeltaX, e.originalEvent.wheelDeltaY);
                scroller.dispatchEvent(i);
                e.preventDefault();
            } catch (e) {}
        }

        function init(_params) {
            var pos;

            for (var key in _params) {
                params[key] = _params[key];
            }

            elements = this.$(params.elements, this.scroller);

            if (elements) {
                viewPortSize = this.scroller[this.origin.client];
                for (var i = 0 ; i < elements.length ; i++) {
                    // Variable header heights
                    pos = {};
                    pos[this.origin.size] = elements[i][this.origin.offset];
                    if (elements[i].parentNode !== this.scroller) {
                        this.$(elements[i].parentNode).css(pos);
                    }
                    pos = {};
                    pos[this.origin.crossSize] = elements[i].parentNode[this.origin.crossClient];
                    this.$(elements[i]).css(pos);

                    // Between fixed headers
                    viewPortSize -= elements[i][this.origin.offset];

                    headerTops[i] = elements[i].parentNode[this.origin.offsetPos]; // No paddings for parentNode

                    // Summary elements height above current
                    topFixHeights[i] = (topFixHeights[i - 1] || 0); // Not zero because of negative margins
                    topRealHeights[i] = (topRealHeights[i - 1] || Math.min(headerTops[i], 0));

                    if (elements[i - 1]) {
                        topFixHeights[i] += elements[i - 1][this.origin.offset];
                        topRealHeights[i] += elements[i - 1][this.origin.offset];
                    }

                    if ( !(i == 0 && headerTops[i] == 0)/* && force */) {
                        this.event(elements[i], 'mousewheel', bubbleWheel, 'off');
                        this.event(elements[i], 'mousewheel', bubbleWheel);
                    }
                }

                if (params.limiter && elements[0]) { // Bottom edge of first header as top limit for track
                    if (this.track && this.track != this.scroller) {
                        pos = {};
                        pos[this.origin.pos] = elements[0].parentNode[this.origin.offset];
                        this.$(this.track).css(pos);
                    } else {
                        this.barTopLimit = elements[0].parentNode[this.origin.offset];
                    }
                    // this.barTopLimit = elements[0].parentNode[this.origin.offset];
                    this.scroll();
                }

                if (params.limiter === false) { // undefined (in second fix instance) should have no influence on bar limit
                    this.barTopLimit = 0;
                }
            }

            var event = {
                element: elements,

                handler: function() {
                    var parent = $(this)[0].parentNode,
                        top = parent.offsetTop,
                        num;

                    // finding num -> elements[num] === this
                    for (var i = 0 ; i < elements.length ; i++ ) {
                        if (elements[i] === this) num = i;
                    }

                    var pos = top - topFixHeights[num];

                    if (params.scroll) { // User defined callback
                        params.scroll({
                            x1: self.scroller.scrollTop,
                            x2: pos
                        });
                    } else {
                        self.scroller.scrollTop = pos;
                    }
                },

                type: 'click'
            };

            if (params.clickable) {
                this._eventHandlers.push(event); // For auto-dispose
                // eventManager(event.element, event.type, event.handler, 'off');
                eventManager(event.element, event.type, event.handler, 'on');
            }
        }

        this.on('init', init, userParams);

        var fixFlag = [], // 1 - past, 2 - future, 3 - current (not fixed)
            gradFlag = [];
        this.on('init scroll', function() {
            var fixState, hTop, gradState;

            if (elements) {
                var change;

                // fixFlag update
                for (var i = 0 ; i < elements.length ; i++) {
                    fixState = 0;
                    if (headerTops[i] - this.pos() < topRealHeights[i] + params.radius) {
                        // Header trying to go up
                        fixState = 1;
                        hTop = topFixHeights[i];
                    } else if (headerTops[i] - this.pos() > topRealHeights[i] + viewPortSize - params.radius) {
                        // Header trying to go down
                        fixState = 2;
                        // console.log('topFixHeights[i] + viewPortSize + topRealHeights[i]', topFixHeights[i], this.scroller[this.origin.client], topRealHeights[i]);
                        hTop = this.scroller[this.origin.client] - elements[i][this.origin.offset] - topFixHeights[i] - viewPortSize;
                        // console.log('hTop', hTop, viewPortSize, elements[this.origin.offset], topFixHeights[i]);
                        //(topFixHeights[i] + viewPortSize + elements[this.origin.offset]) - this.scroller[this.origin.client];
                    } else {
                        // Header in viewport
                        fixState = 3;
                        hTop = undefined;
                    }

                    gradState = false;
                    if (headerTops[i] - this.pos() < topRealHeights[i] || headerTops[i] - this.pos() > topRealHeights[i] + viewPortSize) {
                        gradState = true;
                    }

                    if (fixState != fixFlag[i] || gradState != gradFlag[i]) {
                        fixElement.call(this, i, hTop, fixState);
                        fixFlag[i] = fixState;
                        gradFlag[i] = gradState;
                        change = true;
                    }
                }

                // Adding positioning classes (on last top and first bottom header)
                if (change) { // At leats one change in elements flag structure occured
                    for (i = 0 ; i < elements.length ; i++) {
                        if (fixFlag[i] == 1 && params.past) {
                            this.$(elements[i]).addClass(params.past).removeClass(params.future);
                        }

                        if (fixFlag[i] == 2 && params.future) {
                            this.$(elements[i]).addClass(params.future).removeClass(params.past);
                        }

                        if (fixFlag[i] == 3) {
                            if (params.future || params.past) this.$(elements[i]).removeClass(params.past).removeClass(params.future);
                            if (params.inside) this.$(elements[i]).addClass(params.inside);
                        } else if (params.inside) {
                            this.$(elements[i]).removeClass(params.inside);
                        }

                        if (fixFlag[i] != fixFlag[i + 1] && fixFlag[i] == 1 && params.before) {
                            this.$(elements[i]).addClass(params.before).removeClass(params.after); // Last top fixed header
                        } else if (fixFlag[i] != fixFlag[i - 1] && fixFlag[i] == 2 && params.after) {
                            this.$(elements[i]).addClass(params.after).removeClass(params.before); // First bottom fixed header
                        } else {
                            this.$(elements[i]).removeClass(params.before).removeClass(params.after);
                        }

                        if (params.grad) {
                            if (gradFlag[i]) {
                                this.$(elements[i]).addClass(params.grad);
                            } else {
                                this.$(elements[i]).removeClass(params.grad);
                            }
                        }
                    }
                }
            }
        });

        this.on('resize upd', function(updParams) {
            init.call(this, updParams && updParams.fix);
        });
    };

    baron.fn.fix = function(params) {
        var i = 0;

        while (this[i]) {
            fix.call(this[i], params);
            i++;
        }

        return this;
    };
})(window);
/* Autoupdate plugin for baron 0.6+ */
(function(window) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || null;

    var autoUpdate = function() {
        var self = this;
        var watcher;

        function actualizeWatcher() {
            if (!self.root[self.origin.offset]) {
                startWatch();
            } else {
                stopWatch();
            }
        }

        // Set interval timeout for watching when root node will be visible
        function startWatch() {
            if (watcher) return;

            watcher = setInterval(function() {
                if (self.root[self.origin.offset]) {
                    stopWatch();
                    self.update();
                }
            }, 300); // is it good enought for you?)
        }

        function stopWatch() {
            clearInterval(watcher);
            watcher = null;
        }

        var debouncedUpdater = self._debounce(function() {
            self.update();
        }, 300);

        this._observer = new MutationObserver(function() {
            actualizeWatcher();
            self.update();
            debouncedUpdater();
        });

        this.on('init', function() {
            self._observer.observe(self.root, {
                childList: true,
                subtree: true,
                characterData: true
                // attributes: true
                // No reasons to set attributes to true
                // The case when root/child node with already properly inited baron toggled to hidden and then back to visible,
                // and the size of parent was changed during that hidden state, is very rare
                // Other cases are covered by watcher, and you still can do .update by yourself
            });

            actualizeWatcher();
        });

        this.on('dispose', function() {
            self._observer.disconnect();
            stopWatch();
            delete self._observer;
        });
    };

    baron.fn.autoUpdate = function(params) {
        if (!MutationObserver) return this;

        var i = 0;

        while (this[i]) {
            autoUpdate.call(this[i], params);
            i++;
        }

        return this;
    };
})(window);

/* Controls plugin for baron 0.6+ */
(function(window, undefined) {
    var controls = function(params) {
        var forward, backward, track, screen,
            self = this, // AAAAAA!!!!!11
            event;

        screen = params.screen || 0.9;

        if (params.forward) {
            forward = this.$(params.forward, this.clipper);

            event = {
                element: forward,

                handler: function() {
                    var y = self.pos() + (params.delta || 30);

                    self.pos(y);
                },

                type: 'click'
            };

            this._eventHandlers.push(event); // For auto-dispose
            this.event(event.element, event.type, event.handler, 'on');
        }

        if (params.backward) {
            backward = this.$(params.backward, this.clipper);

            event = {
                element: backward,

                handler: function() {
                    var y = self.pos() - (params.delta || 30);

                    self.pos(y);
                },

                type: 'click'
            };

            this._eventHandlers.push(event); // For auto-dispose
            this.event(event.element, event.type, event.handler, 'on');
        }

        if (params.track) {
            if (params.track === true) {
                track = this.track;
            } else {
                track = this.$(params.track, this.clipper)[0];
            }

            if (track) {
                event = {
                    element: track,

                    handler: function(e) {
                        // https://github.com/Diokuz/baron/issues/121
                        if (e.target != track) return;

                        var x = e['offset' + self.origin.x],
                            xBar = self.bar[self.origin.offsetPos],
                            sign = 0;

                        if (x < xBar) {
                            sign = -1;
                        } else if (x > xBar + self.bar[self.origin.offset]) {
                            sign = 1;
                        }

                        var y = self.pos() + sign * screen * self.scroller[self.origin.client];
                        self.pos(y);
                    },

                    type: 'mousedown'
                };

                this._eventHandlers.push(event); // For auto-dispose
                this.event(event.element, event.type, event.handler, 'on');
            }
        }
    };

    baron.fn.controls = function(params) {
        var i = 0;

        while (this[i]) {
            controls.call(this[i], params);
            i++;
        }

        return this;
    };
})(window);
/* Pull to load plugin for baron 0.6+ */
(function(window, undefined) {
    var pull = function(params) {
        var block = this.$(params.block),
            size = params.size || this.origin.size,
            limit = params.limit || 80,
            onExpand = params.onExpand,
            elements = params.elements || [],
            inProgress = params.inProgress || '',
            self = this,
            _insistence = 0,
            _zeroXCount = 0,
            _interval,
            _timer,
            _x = 0,
            _onExpandCalled,
            _waiting = params.waiting || 500,
            _on;

        function getSize() {
            return self.scroller[self.origin.scroll] + self.scroller[self.origin.offset];
        }

        // Scroller content height
        function getContentSize() {
            return self.scroller[self.origin.scrollSize];
        }

        // Scroller height
        function getScrollerSize() {
            return self.scroller[self.origin.client];
        }

        function step(x, force) {
            var k = x * 0.0005;

            return Math.floor(force - k * (x + 550));
        }

        function toggle(on) {
            _on = on;

            if (on) {
                update(); // First time with no delay
                _interval = setInterval(update, 200);
            } else {
                clearInterval(_interval);
            }
        }

        function update() {
            var pos = {},
                height = getSize(),
                scrollHeight = getContentSize(),
                dx,
                op4,
                scrollInProgress = _insistence == 1;

            op4 = 0; // Возвращающая сила
            if (_insistence > 0) {
                op4 = 40;
            }
            //if (_insistence > -1) {
            dx = step(_x, op4);
            if (height >= scrollHeight - _x && _insistence > -1) {
                if (scrollInProgress) {
                    _x += dx;
                }
            } else {
                _x = 0;
            }

            if (_x < 0) _x = 0;

            pos[size] = _x + 'px';
            if (getScrollerSize() <= getContentSize()) {
                self.$(block).css(pos);
                for (var i = 0 ; i < elements.length ; i++) {
                    self.$(elements[i].self).css(elements[i].property, Math.min(_x / limit * 100, 100) + '%');
                }
            }

            if (inProgress && _x) {
                self.$(self.root).addClass(inProgress);
            }

            if (_x == 0) {
                if (params.onCollapse) {
                    params.onCollapse();
                }
            }

            _insistence = 0;
            _timer = setTimeout(function() {
                _insistence = -1;
            }, _waiting);
            //}

            if (onExpand && _x > limit && !_onExpandCalled) {
                onExpand();
                _onExpandCalled = true;
            }

            if (_x == 0) {
                _zeroXCount++;
            } else {
                _zeroXCount = 0;
            }
            if (_zeroXCount > 1) {
                toggle(false);
                _onExpandCalled = false;
                if (inProgress) {
                    self.$(self.root).removeClass(inProgress);
                }
            }
        }

        this.on('init', function() {
            toggle(true);
        });

        this.on('dispose', function() {
            toggle(false);
        });

        this.event(this.scroller, 'mousewheel DOMMouseScroll', function(e) {
            var down = e.wheelDelta < 0 || (e.originalEvent && e.originalEvent.wheelDelta < 0) || e.detail > 0;

            if (down) {
                _insistence = 1;
                clearTimeout(_timer);
                if (!_on && getSize() >= getContentSize()) {
                    toggle(true);
                }
            }
            //  else {
            //     toggle(false);
            // }
        });
    };

    baron.fn.pull = function(params) {
        var i = 0;

        while (this[i]) {
            pull.call(this[i], params);
            i++;
        }

        return this;
    };
})(window);