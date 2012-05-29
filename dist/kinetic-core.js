/**
 * KineticJS JavaScript Library core
 * http://www.kineticjs.com/
 * Copyright 2012, Eric Rowell
 * Licensed under the MIT or GPL Version 2 licenses.
 * Date: May 28 2012
 *
 * Copyright (C) 2011 - 2012 by Eric Rowell
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

///////////////////////////////////////////////////////////////////////
//  Global Object
///////////////////////////////////////////////////////////////////////
/**
 * Kinetic Namespace
 * @namespace
 */
var Kinetic = {};
/**
 * Kinetic Global Object
 * @property {Object} GlobalObjet
 */
Kinetic.GlobalObject = {
    stages: [],
    idCounter: 0,
    tempNodes: [],
    animations: [],
    animIdCounter: 0,
    animRunning: false,
    maxDragTimeInterval: 20,
    frame: {
        time: 0,
        timeDiff: 0,
        lastTime: 0
    },
    drag: {
        moving: false,
        node: undefined,
        offset: {
            x: 0,
            y: 0
        },
        lastDrawTime: 0
    },
    extend: function(obj1, obj2) {
        for(var key in obj2.prototype) {
            if(obj2.prototype.hasOwnProperty(key) && obj1.prototype[key] === undefined) {
                obj1.prototype[key] = obj2.prototype[key];
            }
        }
    },
    _pullNodes: function(stage) {
        var tempNodes = this.tempNodes;
        for(var n = 0; n < tempNodes.length; n++) {
            var node = tempNodes[n];
            if(node.getStage() !== undefined && node.getStage()._id === stage._id) {
                stage._addId(node);
                stage._addName(node);
                this.tempNodes.splice(n, 1);
                n -= 1;
            }
        }
    },
    /*
     * animation support
     */
    _addAnimation: function(anim) {
        anim.id = this.animIdCounter++;
        this.animations.push(anim);
    },
    _removeAnimation: function(anim) {
        var id = anim.id;
        var animations = this.animations;
        for(var n = 0; n < animations.length; n++) {
            if(animations[n].id === id) {
                this.animations.splice(n, 1);
                return false;
            }
        }
    },
    _runFrames: function() {
        var nodes = {};
        for(var n = 0; n < this.animations.length; n++) {
            var anim = this.animations[n];
            if(anim.node && anim.node._id !== undefined) {
                nodes[anim.node._id] = anim.node;
            }
            anim.func(this.frame);
        }

        for(var key in nodes) {
            nodes[key].draw();
        }
    },
    _updateFrameObject: function() {
        var date = new Date();
        var time = date.getTime();
        if(this.frame.lastTime === 0) {
            this.frame.lastTime = time;
        }
        else {
            this.frame.timeDiff = time - this.frame.lastTime;
            this.frame.lastTime = time;
            this.frame.time += this.frame.timeDiff;
        }
    },
    _animationLoop: function() {
        if(this.animations.length > 0) {
            this._updateFrameObject();
            this._runFrames();
            var that = this;
            requestAnimFrame(function() {
                that._animationLoop();
            });
        }
        else {
            this.animRunning = false;
            this.frame.lastTime = 0;
        }
    },
    _handleAnimation: function() {
        var that = this;
        if(!this.animRunning) {
            this.animRunning = true;
            that._animationLoop();
        }
        else {
            this.frame.lastTime = 0;
        }
    },
    /*
     * cherry-picked and modified utilities from underscore.js
     */
    _isElement: function(obj) {
        return !!(obj && obj.nodeType == 1);
    },
    _isFunction: function(obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    },
    _isArray: function(obj) {
        return obj.length !== undefined;
        //return Object.prototype.toString.call(obj) == '[object Array]';
    },
    _isObject: function(obj) {
        return obj === Object(obj);
    },
    _isNumber: function(obj) {
        return Object.prototype.toString.call(obj) == '[object Number]';
    },
    _hasMethods: function(obj) {
        var names = [];
        for(var key in obj) {
            if(this._isFunction(obj[key]))
                names.push(key);
        }
        return names.length > 0;
    },
    /*
     * The argument can be:
     * - an integer (will be applied to both x and y)
     * - an array of one integer (will be applied to both x and y)
     * - an array of two integers (contains x and y)
     * - an array of four integers (contains x, y, width, and height)
     * - an object with x and y properties
     * - an array of one element which is an array of integers
     * - an array of one element of an object
     */
    _getXY: function(arg) {
        if(this._isNumber(arg)) {
            return {
                x: arg,
                y: arg
            };
        }
        else if(this._isArray(arg)) {
            // if arg is an array of one element
            if(arg.length === 1) {
                var val = arg[0];
                // if arg is an array of one element which is a number
                if(this._isNumber(val)) {
                    return {
                        x: val,
                        y: val
                    };
                }
                // if arg is an array of one element which is an array
                else if(this._isArray(val)) {
                    return {
                        x: val[0],
                        y: val[1]
                    };
                }
                // if arg is an array of one element which is an object
                else if(this._isObject(val)) {
                    return val;
                }
            }
            // if arg is an array of two or more elements
            else if(arg.length >= 2) {
                return {
                    x: arg[0],
                    y: arg[1]
                };
            }
        }
        // if arg is an object return the object
        else if(this._isObject(arg)) {
            return arg;
        }

        // default
        return {
            x: 0,
            y: 0
        };
    },
    /*
     * The argument can be:
     * - an integer (will be applied to both width and height)
     * - an array of one integer (will be applied to both width and height)
     * - an array of two integers (contains width and height)
     * - an array of four integers (contains x, y, width, and height)
     * - an object with width and height properties
     * - an array of one element which is an array of integers
     * - an array of one element of an object
     */
    _getSize: function(arg) {
        if(this._isNumber(arg)) {
            return {
                width: arg,
                height: arg
            };
        }
        else if(this._isArray(arg)) {
            // if arg is an array of one element
            if(arg.length === 1) {
                var val = arg[0];
                // if arg is an array of one element which is a number
                if(this._isNumber(val)) {
                    return {
                        width: val,
                        height: val
                    };
                }
                // if arg is an array of one element which is an array
                else if(this._isArray(val)) {
                    /*
                     * if arg is an array of one element which is an
                     * array of four elements
                     */
                    if(val.length >= 4) {
                        return {
                            width: val[2],
                            height: val[3]
                        };
                    }
                    /*
                     * if arg is an array of one element which is an
                     * array of two elements
                     */
                    else if(val.length >= 2) {
                        return {
                            width: val[0],
                            height: val[1]
                        };
                    }
                }
                // if arg is an array of one element which is an object
                else if(this._isObject(val)) {
                    return val;
                }
            }
            // if arg is an array of four elements
            else if(arg.length >= 4) {
                return {
                    width: arg[2],
                    height: arg[3]
                };
            }
            // if arg is an array of two elements
            else if(arg.length >= 2) {
                return {
                    width: arg[0],
                    height: arg[1]
                };
            }
        }
        // if arg is an object return the object
        else if(this._isObject(arg)) {
            return arg;
        }

        // default
        return {
            width: 0,
            height: 0
        };
    },
    /*
     * arg will be an array of numbers or
     *  an array of point objects
     */
    _getPoints: function(arg) {
        if(arg === undefined) {
            return [];
        }

        // an array of objects
        if(this._isObject(arg[0])) {
            return arg;
        }
        // an array of integers
        else {
            /*
             * convert array of numbers into an array
             * of objects containing x, y
             */
            var arr = [];
            for(var n = 0; n < arg.length; n += 2) {
                arr.push({
                    x: arg[n],
                    y: arg[n + 1]
                });
            }

            return arr;
        }
    },
    /*
     * set attr
     */
    _setAttr: function(obj, attr, val) {
        if(val !== undefined) {
            obj[attr] = val;
        }
    }
};

window.requestAnimFrame = (function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

///////////////////////////////////////////////////////////////////////
//  Node
///////////////////////////////////////////////////////////////////////
/**
 * Node constructor.&nbsp; Nodes are entities that can be transformed, layered,
 * and have events bound to them.  They are the building blocks of a KineticJS
 * application
 * @constructor
 * @param {Object} config
 */
Kinetic.Node = function(config) {
    this.defaultNodeAttrs = {
        visible: true,
        listening: true,
        name: undefined,
        alpha: 1,
        x: 0,
        y: 0,
        scale: {
            x: 1,
            y: 1
        },
        rotation: 0,
        centerOffset: {
            x: 0,
            y: 0
        },
        dragConstraint: 'none',
        dragBounds: {},
        draggable: false
    };

    this.setDefaultAttrs(this.defaultNodeAttrs);
    this.eventListeners = {};
    this.setAttrs(config);
};
/*
 * Node methods
 */
Kinetic.Node.prototype = {
    /**
     * bind events to the node.  KineticJS supports mouseover, mousemove,
     * mouseout, mousedown, mouseup, click, dblclick, touchstart, touchmove,
     * touchend, dbltap, dragstart, dragmove, and dragend.  Pass in a string
     * of event types delimmited by a space to bind multiple events at once
     * such as 'mousedown mouseup mousemove'. include a namespace to bind an
     * event by name such as 'click.foobar'.
     * @param {String} typesStr
     * @param {Function} handler
     */
    on: function(typesStr, handler) {
        var types = typesStr.split(' ');
        /*
         * loop through types and attach event listeners to
         * each one.  eg. 'click mouseover.namespace mouseout'
         * will create three event bindings
         */
        for(var n = 0; n < types.length; n++) {
            var type = types[n];
            var event = (type.indexOf('touch') === -1) ? 'on' + type : type;
            var parts = event.split('.');
            var baseEvent = parts[0];
            var name = parts.length > 1 ? parts[1] : '';

            if(!this.eventListeners[baseEvent]) {
                this.eventListeners[baseEvent] = [];
            }

            this.eventListeners[baseEvent].push({
                name: name,
                handler: handler
            });
        }
    },
    /**
     * remove event bindings from the node.  Pass in a string of
     * event types delimmited by a space to remove multiple event
     * bindings at once such as 'mousedown mouseup mousemove'.
     * include a namespace to remove an event binding by name
     * such as 'click.foobar'.
     * @param {String} typesStr
     */
    off: function(typesStr) {
        var types = typesStr.split(' ');

        for(var n = 0; n < types.length; n++) {
            var type = types[n];
            var event = (type.indexOf('touch') === -1) ? 'on' + type : type;
            var parts = event.split('.');
            var baseEvent = parts[0];

            if(this.eventListeners[baseEvent] && parts.length > 1) {
                var name = parts[1];

                for(var i = 0; i < this.eventListeners[baseEvent].length; i++) {
                    if(this.eventListeners[baseEvent][i].name === name) {
                        this.eventListeners[baseEvent].splice(i, 1);
                        if(this.eventListeners[baseEvent].length === 0) {
                            this.eventListeners[baseEvent] = undefined;
                        }
                        break;
                    }
                }
            }
            else {
                this.eventListeners[baseEvent] = undefined;
            }
        }
    },
    /**
     * get attrs
     */
    getAttrs: function() {
        return this.attrs;
    },
    /**
     * set default attrs
     * @param {Object} confic
     */
    setDefaultAttrs: function(config) {
        // create attrs object if undefined
        if(this.attrs === undefined) {
            this.attrs = {};
        }

        if(config) {
            for(var key in config) {
                /*
                 * only set the attr if it's undefined in case
                 * a developer writes a custom class that extends
                 * a Kinetic Class such that their default property
                 * isn't overwritten by the Kinetic Class default
                 * property
                 */
                if(this.attrs[key] === undefined) {
                    this.attrs[key] = config[key];
                }
            }
        }
    },
    /**
     * set attrs
     * @param {Object} config
     */
    setAttrs: function(config) {
        var go = Kinetic.GlobalObject;
        var that = this;

        // set properties from config
        if(config !== undefined) {
            function setAttrs(obj, c) {
                for(var key in c) {
                    var val = c[key];

                    // if obj doesn't have the val property, then create it
                    if(obj[key] === undefined) {
                        obj[key] = {};
                    }

                    /*
                     * if property is a pure object (no methods), then add an empty object
                     * to the node and then traverse
                     */
                    if(go._isObject(val) && !go._isArray(val) && !go._isElement(val) && !go._hasMethods(val)) {
                        if(obj[key] === undefined) {
                            obj[key] = {};
                        }
                        setAttrs(obj[key], val);
                    }
                    /*
                     * add all other object types to attrs object
                     */
                    else {
                        // handle special keys
                        switch (key) {
                            /*
                             * config properties that require a method
                             */
                            case 'draggable':
                                that.draggable(c[key]);
                                break;
                            case 'listening':
                                that.listen(c[key]);
                                break;
                            case 'rotationDeg':
                                obj.rotation = c[key] * Math.PI / 180;
                                break;
                            /*
                             * config objects
                             */
                            case 'centerOffset':
                                var pos = go._getXY(val);
                                go._setAttr(obj[key], 'x', pos.x);
                                go._setAttr(obj[key], 'y', pos.y);
                                break;
                            /*
                             * includes:
                             * - fill pattern offset
                             * - shadow offset
                             */
                            case 'offset':
                                var pos = go._getXY(val);
                                go._setAttr(obj[key], 'x', pos.x);
                                go._setAttr(obj[key], 'y', pos.y);
                                break;
                            case 'scale':
                                var pos = go._getXY(val);
                                go._setAttr(obj[key], 'x', pos.x);
                                go._setAttr(obj[key], 'y', pos.y);
                                break;
                            case 'points':
                                obj[key] = go._getPoints(val);
                                break;
                            case 'crop':
                                var pos = go._getXY(val);
                                var size = go._getSize(val);

                                go._setAttr(obj[key], 'x', pos.x);
                                go._setAttr(obj[key], 'y', pos.y);
                                go._setAttr(obj[key], 'width', size.width);
                                go._setAttr(obj[key], 'height', size.height);
                                break;
                            default:
                                obj[key] = c[key];
                                break;
                        }
                    }
                }
            }
            setAttrs(this.attrs, config);
        }
    },
    /**
     * determine if shape is visible or not
     */
    isVisible: function() {
        return this.attrs.visible;
    },
    /**
     * show node
     */
    show: function() {
        this.attrs.visible = true;
    },
    /**
     * hide node
     */
    hide: function() {
        this.attrs.visible = false;
    },
    /**
     * get zIndex
     */
    getZIndex: function() {
        return this.index;
    },
    /**
     * get absolute z-index by taking into account
     * all parent and sibling indices
     */
    getAbsoluteZIndex: function() {
        var level = this.getLevel();
        var stage = this.getStage();
        var that = this;
        var index = 0;
        function addChildren(children) {
            var nodes = [];
            for(var n = 0; n < children.length; n++) {
                var child = children[n];
                index++;

                if(child.nodeType !== 'Shape') {
                    nodes = nodes.concat(child.getChildren());
                }

                if(child._id === that._id) {
                    n = children.length;
                }
            }

            if(nodes.length > 0 && nodes[0].getLevel() <= level) {
                addChildren(nodes);
            }
        }
        if(that.nodeType !== 'Stage') {
            addChildren(that.getStage().getChildren());
        }

        return index;
    },
    /**
     * get node level in node tree
     */
    getLevel: function() {
        var level = 0;
        var parent = this.parent;
        while(parent) {
            level++;
            parent = parent.parent;
        }
        return level;
    },
    /**
     * set node scale.
     * @param arg
     */
    setScale: function() {
        this.setAttrs({
            scale: arguments
        });
    },
    /**
     * get scale
     */
    getScale: function() {
        return this.attrs.scale;
    },
    /**
     * set node position
     * @param {Object} point
     */
    setPosition: function() {
        var pos = Kinetic.GlobalObject._getXY(arguments);
        this.setAttrs(pos);
    },
    /**
     * set node x position
     * @param {Number} x
     */
    setX: function(x) {
        this.attrs.x = x;
    },
    /**
     * set node y position
     * @param {Number} y
     */
    setY: function(y) {
        this.attrs.y = y;
    },
    /**
     * get node x position
     */
    getX: function() {
        return this.attrs.x;
    },
    /**
     * get node y position
     */
    getY: function() {
        return this.attrs.y;
    },
    /**
     * set detection type
     * @param {String} type can be "path" or "pixel"
     */
    setDetectionType: function(type) {
        this.attrs.detectionType = type;
    },
    /**
     * get detection type
     */
    getDetectionType: function() {
        return this.attrs.detectionType;
    },
    /**
     * get node position relative to container
     */
    getPosition: function() {
        return {
            x: this.attrs.x,
            y: this.attrs.y
        };
    },
    /**
     * get absolute position relative to stage
     */
    getAbsolutePosition: function() {
        return this.getAbsoluteTransform().getTranslation();
    },
    /**
     * set absolute position relative to stage
     * @param {Object} pos object containing an x and
     *  y property
     */
    setAbsolutePosition: function() {
        var pos = Kinetic.GlobalObject._getXY(arguments);
        /*
         * save rotation and scale and
         * then remove them from the transform
         */
        var rot = this.attrs.rotation;
        var scale = {
            x: this.attrs.scale.x,
            y: this.attrs.scale.y
        };
        var centerOffset = {
            x: this.attrs.centerOffset.x,
            y: this.attrs.centerOffset.y
        };

        this.attrs.rotation = 0;
        this.attrs.scale = {
            x: 1,
            y: 1
        };

        // unravel transform
        var it = this.getAbsoluteTransform();
        it.invert();
        it.translate(pos.x, pos.y);
        pos = {
            x: this.attrs.x + it.getTranslation().x,
            y: this.attrs.y + it.getTranslation().y
        };

        this.setPosition(pos.x, pos.y);

        // restore rotation and scale
        this.rotate(rot);
        this.attrs.scale = {
            x: scale.x,
            y: scale.y
        };
    },
    /**
     * move node by an amount
     * @param {Number} x
     * @param {Number} y
     */
    move: function(x, y) {
        this.attrs.x += x;
        this.attrs.y += y;
    },
    /**
     * set node rotation in radians
     * @param {Number} theta
     */
    setRotation: function(theta) {
        this.attrs.rotation = theta;
    },
    /**
     * set node rotation in degrees
     * @param {Number} deg
     */
    setRotationDeg: function(deg) {
        this.attrs.rotation = (deg * Math.PI / 180);
    },
    /**
     * get rotation in radians
     */
    getRotation: function() {
        return this.attrs.rotation;
    },
    /**
     * get rotation in degrees
     */
    getRotationDeg: function() {
        return this.attrs.rotation * 180 / Math.PI;
    },
    /**
     * rotate node by an amount in radians
     * @param {Number} theta
     */
    rotate: function(theta) {
        this.attrs.rotation += theta;
    },
    /**
     * rotate node by an amount in degrees
     * @param {Number} deg
     */
    rotateDeg: function(deg) {
        this.attrs.rotation += (deg * Math.PI / 180);
    },
    /**
     * listen or don't listen to events
     * @param {Boolean} listening
     */
    listen: function(listening) {
        this.attrs.listening = listening;
    },
    /**
     * move node to top
     */
    moveToTop: function() {
        var index = this.index;
        this.parent.children.splice(index, 1);
        this.parent.children.push(this);
        this.parent._setChildrenIndices();
    },
    /**
     * move node up
     */
    moveUp: function() {
        var index = this.index;
        this.parent.children.splice(index, 1);
        this.parent.children.splice(index + 1, 0, this);
        this.parent._setChildrenIndices();
    },
    /**
     * move node down
     */
    moveDown: function() {
        var index = this.index;
        if(index > 0) {
            this.parent.children.splice(index, 1);
            this.parent.children.splice(index - 1, 0, this);
            this.parent._setChildrenIndices();
        }
    },
    /**
     * move node to bottom
     */
    moveToBottom: function() {
        var index = this.index;
        this.parent.children.splice(index, 1);
        this.parent.children.unshift(this);
        this.parent._setChildrenIndices();
    },
    /**
     * set zIndex
     * @param {int} zIndex
     */
    setZIndex: function(zIndex) {
        var index = this.index;
        this.parent.children.splice(index, 1);
        this.parent.children.splice(zIndex, 0, this);
        this.parent._setChildrenIndices();
    },
    /**
     * set alpha.  Alpha values range from 0 to 1.
     * A node with an alpha of 0 is fully transparent, and a node
     * with an alpha of 1 is fully opaque
     * @param {Object} alpha
     */
    setAlpha: function(alpha) {
        this.attrs.alpha = alpha;
    },
    /**
     * get alpha.  Alpha values range from 0 to 1.
     * A node with an alpha of 0 is fully transparent, and a node
     * with an alpha of 1 is fully opaque
     */
    getAlpha: function() {
        return this.attrs.alpha;
    },
    /**
     * get absolute alpha
     */
    getAbsoluteAlpha: function() {
        var absAlpha = 1;
        var node = this;
        // traverse upwards
        while(node.nodeType !== 'Stage') {
            absAlpha *= node.attrs.alpha;
            node = node.parent;
        }
        return absAlpha;
    },
    /**
     * enable or disable drag and drop
     * @param {Boolean} isDraggable
     */
    draggable: function(isDraggable) {
        if(this.attrs.draggable !== isDraggable) {
            if(isDraggable) {
                this._listenDrag();
            }
            else {
                this._dragCleanup();
            }
            this.attrs.draggable = isDraggable;
        }
    },
    /**
     * determine if node is currently in drag and drop mode
     */
    isDragging: function() {
        var go = Kinetic.GlobalObject;
        return go.drag.node !== undefined && go.drag.node._id === this._id && go.drag.moving;
    },
    /**
     * move node to another container
     * @param {Container} newContainer
     */
    moveTo: function(newContainer) {
        var parent = this.parent;
        // remove from parent's children
        parent.children.splice(this.index, 1);
        parent._setChildrenIndices();

        // add to new parent
        newContainer.children.push(this);
        this.index = newContainer.children.length - 1;
        this.parent = newContainer;
        newContainer._setChildrenIndices();
    },
    /**
     * get parent container
     */
    getParent: function() {
        return this.parent;
    },
    /**
     * get layer associated to node
     */
    getLayer: function() {
        if(this.nodeType === 'Layer') {
            return this;
        }
        else {
            return this.getParent().getLayer();
        }
    },
    /**
     * get stage associated to node
     */
    getStage: function() {
        if(this.nodeType === 'Stage') {
            return this;
        }
        else {
            if(this.getParent() === undefined) {
                return undefined;
            }
            else {
                return this.getParent().getStage();
            }
        }
    },
    /**
     * get name
     */
    getName: function() {
        return this.attrs.name;
    },
    /**
     * set center offset
     * @param {Number} x
     * @param {Number} y
     */
    setCenterOffset: function() {
        this.setAttrs({
            centerOffset: arguments
        });
    },
    /**
     * get center offset
     */
    getCenterOffset: function() {
        return this.attrs.centerOffset;
    },
    /**
     * transition node to another state.  Any property that can accept a real
     *  number can be transitioned, including x, y, rotation, alpha, strokeWidth,
     *  radius, scale.x, scale.y, centerOffset.x, centerOffset.y, etc.
     * @param {Object} config
     * @config {Number} [duration] duration that the transition runs in seconds
     * @config {String} [easing] easing function.  can be linear, ease-in, ease-out, ease-in-out,
     *  back-ease-in, back-ease-out, back-ease-in-out, elastic-ease-in, elastic-ease-out,
     *  elastic-ease-in-out, bounce-ease-out, bounce-ease-in, bounce-ease-in-out,
     *  strong-ease-in, strong-ease-out, or strong-ease-in-out
     *  linear is the default
     * @config {Function} [callback] callback function to be executed when
     *  transition completes
     */
    transitionTo: function(config) {
        var go = Kinetic.GlobalObject;

        /*
         * clear transition if one is currently running for this
         * node
         */
        if(this.transAnim !== undefined) {
            go._removeAnimation(this.transAnim);
            this.transAnim = undefined;
        }

        /*
         * create new transition
         */
        var node = this.nodeType === 'Stage' ? this : this.getLayer();
        var that = this;
        var trans = new Kinetic.Transition(this, config);
        var anim = {
            func: function() {
                trans.onEnterFrame();
            },
            node: node
        };

        // store reference to transition animation
        this.transAnim = anim;

        /*
         * adding the animation with the addAnimation
         * method auto generates an id
         */
        go._addAnimation(anim);

        // subscribe to onFinished for first tween
        trans.onFinished = function() {
            // remove animation
            go._removeAnimation(anim);
            that.transAnim = undefined;

            // callback
            if(config.callback !== undefined) {
                config.callback();
            }

            anim.node.draw();
        };
        // auto start
        trans.start();

        go._handleAnimation();

        return trans;
    },
    /**
     * set drag constraint
     * @param {String} constraint
     */
    setDragConstraint: function(constraint) {
        this.attrs.dragConstraint = constraint;
    },
    /**
     * get drag constraint
     */
    getDragConstraint: function() {
        return this.attrs.dragConstraint;
    },
    /**
     * set drag bounds
     * @param {Object} bounds
     * @config {Number} [left] left bounds position
     * @config {Number} [top] top bounds position
     * @config {Number} [right] right bounds position
     * @config {Number} [bottom] bottom bounds position
     */
    setDragBounds: function(bounds) {
        this.attrs.dragBounds = bounds;
    },
    /**
     * get drag bounds
     */
    getDragBounds: function() {
        return this.attrs.dragBounds;
    },
    /**
     * get transform of the node while taking into
     * account the transforms of its parents
     */
    getAbsoluteTransform: function() {
        // absolute transform
        var am = new Kinetic.Transform();

        var family = [];
        var parent = this.parent;

        family.unshift(this);
        while(parent) {
            family.unshift(parent);
            parent = parent.parent;
        }

        for(var n = 0; n < family.length; n++) {
            var node = family[n];
            var m = node.getTransform();

            am.multiply(m);
        }

        return am;
    },
    /**
     * get transform of the node while not taking
     * into account the transforms of its parents
     */
    getTransform: function() {
        var m = new Kinetic.Transform();

        if(this.attrs.x !== 0 || this.attrs.y !== 0) {
            m.translate(this.attrs.x, this.attrs.y);
        }
        if(this.attrs.rotation !== 0) {
            m.rotate(this.attrs.rotation);
        }
        if(this.attrs.scale.x !== 1 || this.attrs.scale.y !== 1) {
            m.scale(this.attrs.scale.x, this.attrs.scale.y);
        }

        return m;
    },
    _listenDrag: function() {
        this._dragCleanup();
        var go = Kinetic.GlobalObject;
        var that = this;
        this.on('mousedown.initdrag touchstart.initdrag', function(evt) {
			that._initDrag();
        });
    },
    _initDrag: function() {
    	var go = Kinetic.GlobalObject;
        var stage = this.getStage();
        var pos = stage.getUserPosition();

        if(pos) {
            var m = this.getTransform().getTranslation();
            var am = this.getAbsoluteTransform().getTranslation();
            go.drag.node = this;
            go.drag.offset.x = pos.x - this.getAbsoluteTransform().getTranslation().x;
            go.drag.offset.y = pos.y - this.getAbsoluteTransform().getTranslation().y;
        }
    },
    /**
     * remove drag and drop event listener
     */
    _dragCleanup: function() {
        this.off('mousedown.initdrag');
        this.off('touchstart.initdrag');
    },
    /**
     * handle node events
     * @param {String} eventType
     * @param {Event} evt
     */
    _handleEvents: function(eventType, evt) {
        if(this.nodeType === 'Shape') {
            evt.shape = this;
        }
        var stage = this.getStage();
        this._handleEvent(this, stage.mouseoverShape, stage.mouseoutShape, eventType, evt);
    },
    /**
     * handle node event
     */
    _handleEvent: function(node, mouseoverNode, mouseoutNode, eventType, evt) {
        var el = node.eventListeners;
        var okayToRun = true;

        /*
         * determine if event handler should be skipped by comparing
         * parent nodes
         */
        if(eventType === 'onmouseover' && mouseoutNode && mouseoutNode._id === node._id) {
            okayToRun = false;
        }
        else if(eventType === 'onmouseout' && mouseoverNode && mouseoverNode._id === node._id) {
            okayToRun = false;
        }

        if(el[eventType] && okayToRun) {
            var events = el[eventType];
            for(var i = 0; i < events.length; i++) {
                events[i].handler.apply(node, [evt]);
            }
        }

        var mouseoverParent = mouseoverNode ? mouseoverNode.parent : undefined;
        var mouseoutParent = mouseoutNode ? mouseoutNode.parent : undefined;

        // simulate event bubbling
        if(!evt.cancelBubble && node.parent && node.parent.nodeType !== 'Stage') {
            this._handleEvent(node.parent, mouseoverParent, mouseoutParent, eventType, evt);
        }
    }
};

///////////////////////////////////////////////////////////////////////
//  Container
///////////////////////////////////////////////////////////////////////

/**
 * Container constructor.&nbsp; Containers are used to contain nodes or other containers
 * @constructor
 */
Kinetic.Container = function() {
    this.children = [];
};
/*
 * Container methods
 */
Kinetic.Container.prototype = {
    /**
     * get children
     */
    getChildren: function() {
        return this.children;
    },
    /**
     * remove all children
     */
    removeChildren: function() {
        while(this.children.length > 0) {
            this.remove(this.children[0]);
        }
    },
    /**
     * add node to container
     * @param {Node} child
     */
    add: function(child) {
        child._id = Kinetic.GlobalObject.idCounter++;
        child.index = this.children.length;
        child.parent = this;

        this.children.push(child);

        var stage = child.getStage();
        if(stage === undefined) {
            var go = Kinetic.GlobalObject;
            go.tempNodes.push(child);
        }
        else {
            stage._addId(child);
            stage._addName(child);

            /*
             * pull in other nodes that are now linked
             * to a stage
             */
            var go = Kinetic.GlobalObject;
            go._pullNodes(stage);
        }

        // do extra stuff if needed
        if(this._add !== undefined) {
            this._add(child);
        }

        // chainable
        return this;
    },
    /**
     * remove child from container
     * @param {Node} child
     */
    remove: function(child) {
        if(child.index !== undefined && this.children[child.index]._id == child._id) {
            var stage = this.getStage();
            if(stage !== undefined) {
                stage._removeId(child);
                stage._removeName(child);
            }

            var go = Kinetic.GlobalObject;
            for(var n = 0; n < go.tempNodes.length; n++) {
                var node = go.tempNodes[n];
                if(node._id === child._id) {
                    go.tempNodes.splice(n, 1);
                    n = go.tempNodes.length;
                }
            }

            this.children.splice(child.index, 1);
            this._setChildrenIndices();
            child = undefined;
        }

        // do extra stuff if needed
        if(this._remove !== undefined) {
            this._remove(child);
        }

        // chainable
        return this;
    },
    /**
     * return an array of nodes that match the selector.  Use '#' for id selections
     * and '.' for name selections
     * ex:
     * var node = stage.get('#foo'); // selects node with id foo
     * var nodes = layer.get('.bar'); // selects nodes with name bar inside layer
     * @param {String} selector
     */
    get: function(selector) {
        var stage = this.getStage();
        var arr;
        var key = selector.slice(1);
        if(selector.charAt(0) === '#') {
            arr = stage.ids[key] !== undefined ? [stage.ids[key]] : [];
        }
        else if(selector.charAt(0) === '.') {
            arr = stage.names[key] !== undefined ? stage.names[key] : [];
        }
        else if(selector === 'Shape' || selector === 'Group' || selector === 'Layer') {
            return this._getNodes(selector);
        }
        else {
            return false;
        }

        var retArr = [];
        for(var n = 0; n < arr.length; n++) {
            var node = arr[n];
            if(this.isAncestorOf(node)) {
                retArr.push(node);
            }
        }

        return retArr;
    },
    /**
     * determine if node is an ancestor
     * of descendant
     * @param {Kinetic.Node} node
     */
    isAncestorOf: function(node) {
        if(this.nodeType === 'Stage') {
            return true;
        }

        var parent = node.getParent();
        while(parent) {
            if(parent._id === this._id) {
                return true;
            }
            parent = parent.getParent();
        }

        return false;
    },
    /**
     * get all shapes inside container
     */
    _getNodes: function(sel) {
        var arr = [];
        function traverse(cont) {
            var children = cont.getChildren();
            for(var n = 0; n < children.length; n++) {
                var child = children[n];
                if(child.nodeType === sel) {
                    arr.push(child);
                }
                else if(child.nodeType !== 'Shape') {
                    traverse(child);
                }
            }
        }
        traverse(this);

        return arr;
    },
    /**
     * draw children
     */
    _drawChildren: function() {
        var stage = this.getStage();
        var children = this.children;
        for(var n = 0; n < children.length; n++) {
            var child = children[n];
            if(child.nodeType === 'Shape') {
                if(child.isVisible() && stage.isVisible()) {
                    child._draw(child.getLayer());
                }
            }
            else {
                child.draw();
            }
        }
    },
    /**
     * set children indices
     */
    _setChildrenIndices: function() {
        /*
         * if reordering Layers, remove all canvas elements
         * from the container except the buffer and backstage canvases
         * and then readd all the layers
         */
        if(this.nodeType === 'Stage') {
            var canvases = this.content.children;
            var bufferCanvas = canvases[0];
            var backstageCanvas = canvases[1];

            this.content.innerHTML = '';
            this.content.appendChild(bufferCanvas);
            this.content.appendChild(backstageCanvas);
        }

        for(var n = 0; n < this.children.length; n++) {
            this.children[n].index = n;

            if(this.nodeType === 'Stage') {
                this.content.appendChild(this.children[n].canvas);
            }
        }
    }
};

///////////////////////////////////////////////////////////////////////
//  Stage
///////////////////////////////////////////////////////////////////////
/**
 * Stage constructor.  A stage is used to contain multiple layers and handle
 * animations
 * @constructor
 * @augments Kinetic.Container
 * @augments Kinetic.Node
 * @param {String|DomElement} cont Container id or DOM element
 * @param {int} width
 * @param {int} height
 */
Kinetic.Stage = function(config) {
    this.setDefaultAttrs({
        width: 400,
        height: 200,
        throttle: 80
    });

    this.nodeType = 'Stage';
    this.lastEventTime = 0;

    /*
     * if container is a string, assume it's an id for
     * a DOM element
     */
    if( typeof config.container === 'string') {
        config.container = document.getElementById(config.container);
    }

    // call super constructors
    Kinetic.Container.apply(this, []);
    Kinetic.Node.apply(this, [config]);

    this.content = document.createElement('div');
    this.dblClickWindow = 400;

    this._setStageDefaultProperties();

    // set stage id
    this._id = Kinetic.GlobalObject.idCounter++;

    this._buildDOM();
    this._listen();
    this._prepareDrag();

    var go = Kinetic.GlobalObject;
    go.stages.push(this);
    this._addId(this);
    this._addName(this);
};
/*
 * Stage methods
 */
Kinetic.Stage.prototype = {
    /**
     * sets onFrameFunc for animation
     * @param {function} func
     */
    onFrame: function(func) {
        var go = Kinetic.GlobalObject;
        this.anim = {
            func: func
        };
    },
    /**
     * start animation
     */
    start: function() {
        if(!this.animRunning) {
            var go = Kinetic.GlobalObject;
            go._addAnimation(this.anim);
            go._handleAnimation();
            this.animRunning = true;
        }
    },
    /**
     * stop animation
     */
    stop: function() {
        var go = Kinetic.GlobalObject;
        go._removeAnimation(this.anim);
        this.animRunning = false;
    },
    /**
     * draw children
     */
    draw: function() {
        this._drawChildren();
    },
    /**
     * set stage size
     * @param {int} width
     * @param {int} height
     */
    setSize: function(width, height) {
        // set stage dimensions
        this.attrs.width = width;
        this.attrs.height = height;

        // set content dimensions
        this.content.style.width = this.attrs.width + 'px';
        this.content.style.height = this.attrs.height + 'px';

        // set buffer layer and path layer sizes
        this.bufferLayer.getCanvas().width = width;
        this.bufferLayer.getCanvas().height = height;
        this.pathLayer.getCanvas().width = width;
        this.pathLayer.getCanvas().height = height;

        // set user defined layer dimensions
        var layers = this.children;
        for(var n = 0; n < layers.length; n++) {
            var layer = layers[n];
            layer.getCanvas().width = width;
            layer.getCanvas().height = height;
            layer.draw();
        }
    },
    /**
     * return stage size
     */
    getSize: function() {
        return {
            width: this.attrs.width,
            height: this.attrs.height
        };
    },
    /**
     * clear all layers
     */
    clear: function() {
        var layers = this.children;
        for(var n = 0; n < layers.length; n++) {
            layers[n].clear();
        }
    },
    /**
     * Creates a composite data URL and passes it to a callback. If MIME type is not
     * specified, then "image/png" will result. For "image/jpeg", specify a quality
     * level as quality (range 0.0 - 1.0)
     * @param {function} callback
     * @param {String} mimeType (optional)
     * @param {Number} quality (optional)
     */
    toDataURL: function(callback, mimeType, quality) {
        var bufferLayer = this.bufferLayer;
        var bufferContext = bufferLayer.getContext();
        var layers = this.children;
        var that = this;

        function addLayer(n) {
            var dataURL = layers[n].getCanvas().toDataURL();
            var imageObj = new Image();
            imageObj.onload = function() {
                bufferContext.drawImage(this, 0, 0);
                n++;
                if(n < layers.length) {
                    addLayer(n);
                }
                else {
                    try {
                        // If this call fails (due to browser bug, like in Firefox 3.6),
                        // then revert to previous no-parameter image/png behavior
                        callback(bufferLayer.getCanvas().toDataURL(mimeType, quality));
                    }
                    catch(exception) {
                        callback(bufferLayer.getCanvas().toDataURL());
                    }
                }
            };
            imageObj.src = dataURL;
        }

        bufferLayer.clear();
        addLayer(0);
    },
    /**
     * serialize stage and children as a JSON object
     */
    toJSON: function() {
        var go = Kinetic.GlobalObject;

        function addNode(node) {
            var obj = {};

            var cleanAttrs = node.attrs;

            // remove function, image, DOM, and objects with methods
            for(var key in cleanAttrs) {
                var val = cleanAttrs[key];
                if(go._isFunction(val) || go._isElement(val) || go._hasMethods(val)) {
                    cleanAttrs[key] = undefined;
                }
            }

            obj.attrs = cleanAttrs;

            obj.nodeType = node.nodeType;
            obj.shapeType = node.shapeType;

            if(node.nodeType !== 'Shape') {
                obj.children = [];

                var children = node.getChildren();
                for(var n = 0; n < children.length; n++) {
                    var child = children[n];
                    obj.children.push(addNode(child));
                }
            }

            return obj;
        }
        return JSON.stringify(addNode(this));
    },
    /**
     * reset stage to default state
     */
    reset: function() {
        // remove children
        this.removeChildren();

        // defaults
        this._setStageDefaultProperties();
        this.setAttrs(this.defaultNodeAttrs);
    },
    /**
     * load stage with JSON string.  De-serializtion does not generate custom
     *  shape drawing functions, images, or event handlers (this would make the
     * 	serialized object huge).  If your app uses custom shapes, images, and
     *  event handlers (it probably does), then you need to select the appropriate
     *  shapes after loading the stage and set these properties via on(), setDrawFunc(),
     *  and setImage()
     * @param {String} JSON string
     */
    load: function(json) {
        this.reset();

        function loadNode(node, obj) {
            var children = obj.children;
            if(children !== undefined) {
                for(var n = 0; n < children.length; n++) {
                    var child = children[n];
                    var type;

                    // determine type
                    if(child.nodeType === 'Shape') {
                        // add custom shape
                        if(child.shapeType === undefined) {
                            type = 'Shape';
                        }
                        // add standard shape
                        else {
                            type = child.shapeType;
                        }
                    }
                    else {
                        type = child.nodeType;
                    }

                    var no = new Kinetic[type](child.attrs);
                    node.add(no);
                    loadNode(no, child);
                }
            }
        }
        var obj = JSON.parse(json);

        // copy over stage properties
        this.attrs = obj.attrs;

        loadNode(this, obj);
        this.draw();
    },
    /**
     * get mouse position for desktop apps
     * @param {Event} evt
     */
    getMousePosition: function(evt) {
        return this.mousePos;
    },
    /**
     * get touch position for mobile apps
     * @param {Event} evt
     */
    getTouchPosition: function(evt) {
        return this.touchPos;
    },
    /**
     * get user position (mouse position or touch position)
     * @param {Event} evt
     */
    getUserPosition: function(evt) {
        return this.getTouchPosition() || this.getMousePosition();
    },
    /**
     * get container DOM element
     */
    getContainer: function() {
        return this.attrs.container;
    },
    /**
     * get content DOM element
     */
    getContent: function() {
        return this.content;
    },
    /**
     * get stage
     */
    getStage: function() {
        return this;
    },
    /**
     * get width
     */
    getWidth: function() {
        return this.attrs.width;
    },
    /**
     * get height
     */
    getHeight: function() {
        return this.attrs.height;
    },
    /**
     * get shapes that intersect a point
     * @param {Object} point
     */
    getIntersections: function() {
        var pos = Kinetic.GlobalObject._getXY(arguments);
        var arr = [];
        var shapes = this.get('Shape');

        for(var n = 0; n < shapes.length; n++) {
            var shape = shapes[n];
            if(shape.intersects(pos)) {
                arr.push(shape);
            }
        }

        return arr;
    },
    /**
     * get stage DOM node, which is a div element
     * with the class name "kineticjs-content"
     */
    getDOM: function() {
        return this.content;
    },
    /**
     * remove layer from stage
     * @param {Layer} layer
     */
    _remove: function(layer) {
        /*
         * remove canvas DOM from the document if
         * it exists
         */
        try {
            this.content.removeChild(layer.canvas);
        }
        catch(e) {
        }
    },
    /**
     * add layer to stage
     * @param {Layer} layer
     */
    _add: function(layer) {
        layer.canvas.width = this.attrs.width;
        layer.canvas.height = this.attrs.height;

        // draw layer and append canvas to container
        layer.draw();
        this.content.appendChild(layer.canvas);

        /*
         * set layer last draw time to zero
         * so that throttling doesn't take into account
         * the layer draws associated with adding a node
         */
        layer.lastDrawTime = 0;
    },
    /**
     * detect event
     * @param {Shape} shape
     */
    _detectEvent: function(shape, evt) {
        var isDragging = Kinetic.GlobalObject.drag.moving;
        var go = Kinetic.GlobalObject;
        var pos = this.getUserPosition();
        var el = shape.eventListeners;

        if(this.targetShape && shape._id === this.targetShape._id) {
            this.targetFound = true;
        }

        if(shape.attrs.visible && pos !== undefined && shape.intersects(pos)) {
            // handle onmousedown
            if(!isDragging && this.mouseDown) {
                this.mouseDown = false;
                this.clickStart = true;
                shape._handleEvents('onmousedown', evt);
                return true;
            }
            // handle onmouseup & onclick
            else if(this.mouseUp) {
                this.mouseUp = false;
                shape._handleEvents('onmouseup', evt);

                // detect if click or double click occurred
                if(this.clickStart) {
                    /*
                     * if dragging and dropping, don't fire click or dbl click
                     * event
                     */
                    if((!go.drag.moving) || !go.drag.node) {
                        shape._handleEvents('onclick', evt);

                        if(shape.inDoubleClickWindow) {
                            shape._handleEvents('ondblclick', evt);
                        }
                        shape.inDoubleClickWindow = true;
                        setTimeout(function() {
                            shape.inDoubleClickWindow = false;
                        }, this.dblClickWindow);
                    }
                }
                return true;
            }

            // handle touchstart
            else if(this.touchStart) {
                this.touchStart = false;
                shape._handleEvents('touchstart', evt);

                if(el.ondbltap && shape.inDoubleClickWindow) {
                    var events = el.ondbltap;
                    for(var i = 0; i < events.length; i++) {
                        events[i].handler.apply(shape, [evt]);
                    }
                }

                shape.inDoubleClickWindow = true;

                setTimeout(function() {
                    shape.inDoubleClickWindow = false;
                }, this.dblClickWindow);
                return true;
            }

            // handle touchend
            else if(this.touchEnd) {
                this.touchEnd = false;
                shape._handleEvents('touchend', evt);
                return true;
            }

            /*
            * NOTE: these event handlers require target shape
            * handling
            */

            // handle onmouseover
            else if(!isDragging && this._isNewTarget(shape, evt)) {
                /*
                 * check to see if there are stored mouseout events first.
                 * if there are, run those before running the onmouseover
                 * events
                 */
                if(this.mouseoutShape) {
                    this.mouseoverShape = shape;
                    this.mouseoutShape._handleEvents('onmouseout', evt);
                    this.mouseoverShape = undefined;
                }

                shape._handleEvents('onmouseover', evt);
                this._setTarget(shape);
                return true;
            }

            // handle mousemove and touchmove
            else if(!isDragging) {
                shape._handleEvents('onmousemove', evt);
                shape._handleEvents('touchmove', evt);
                return true;
            }
        }
        // handle mouseout condition
        else if(!isDragging && this.targetShape && this.targetShape._id === shape._id) {
            this._setTarget(undefined);
            this.mouseoutShape = shape;
            return true;
        }

        return false;
    },
    /**
     * set new target
     */
    _setTarget: function(shape) {
        this.targetShape = shape;
        this.targetFound = true;
    },
    /**
     * check if shape should be a new target
     */
    _isNewTarget: function(shape, evt) {
        if(!this.targetShape || (!this.targetFound && shape._id !== this.targetShape._id)) {
            /*
             * check if old target has an onmouseout event listener
             */
            if(this.targetShape) {
                var oldEl = this.targetShape.eventListeners;
                if(oldEl) {
                    this.mouseoutShape = this.targetShape;
                }
            }
            return true;
        }
        else {
            return false;
        }
    },
    /**
     * traverse container children
     * @param {Container} obj
     */
    _traverseChildren: function(obj, evt) {
        var children = obj.children;
        // propapgate backwards through children
        for(var i = children.length - 1; i >= 0; i--) {
            var child = children[i];
            if(child.attrs.listening) {
                if(child.nodeType === 'Shape') {
                    var exit = this._detectEvent(child, evt);
                    if(exit) {
                        return true;
                    }
                }
                else {
                    var exit = this._traverseChildren(child, evt);
                    if(exit) {
                        return true;
                    }
                }
            }
        }

        return false;
    },
    /**
     * handle incoming event
     * @param {Event} evt
     */
    _handleStageEvent: function(evt) {
        var date = new Date();
        var time = date.getTime();
        this.lastEventTime = time;

        var go = Kinetic.GlobalObject;
        if(!evt) {
            evt = window.event;
        }

        this._setMousePosition(evt);
        this._setTouchPosition(evt);
        this.pathLayer.clear();

        /*
         * loop through layers.  If at any point an event
         * is triggered, n is set to -1 which will break out of the
         * three nested loops
         */
        this.targetFound = false;
        var shapeDetected = false;
        for(var n = this.children.length - 1; n >= 0; n--) {
            var layer = this.children[n];
            if(layer.attrs.visible && n >= 0 && layer.attrs.listening) {
                if(this._traverseChildren(layer, evt)) {
                    n = -1;
                    shapeDetected = true;
                }
            }
        }

        /*
         * if no shape was detected and a mouseout shape has been stored,
         * then run the onmouseout event handlers
         */
        if(!shapeDetected && this.mouseoutShape) {
            this.mouseoutShape._handleEvents('onmouseout', evt);
            this.mouseoutShape = undefined;
        }
    },
    /**
     * begin listening for events by adding event handlers
     * to the container
     */
    _listen: function() {
        var go = Kinetic.GlobalObject;
        var that = this;

        // desktop events
        this.content.addEventListener('mousedown', function(evt) {
            that.mouseDown = true;

            /*
             * init stage drag and drop
             */
            if(that.attrs.draggable) {
                that._initDrag();
            }

            that._handleStageEvent(evt);
        }, false);

        this.content.addEventListener('mousemove', function(evt) {
        	/*
        	 * throttle mousemove
        	 */
            var throttle = that.attrs.throttle;
            var date = new Date();
            var time = date.getTime();
            var timeDiff = time - that.lastEventTime;
            var tt = 1000 / throttle;

            if(timeDiff >= tt) {
                that.mouseUp = false;
                that.mouseDown = false;
                that._handleStageEvent(evt);
            }
        }, false);

        this.content.addEventListener('mouseup', function(evt) {
            that.mouseUp = true;
            that.mouseDown = false;
            that._handleStageEvent(evt);
            that.clickStart = false;
        }, false);

        this.content.addEventListener('mouseover', function(evt) {
            that._handleStageEvent(evt);
        }, false);

        this.content.addEventListener('mouseout', function(evt) {
            // if there's a current target shape, run mouseout handlers
            var targetShape = that.targetShape;
            if(targetShape) {
                targetShape._handleEvents('onmouseout', evt);
                that.targetShape = undefined;
            }
            that.mousePos = undefined;
        }, false);
        // mobile events
        this.content.addEventListener('touchstart', function(evt) {
            evt.preventDefault();
            that.touchStart = true;

            /*
             * init stage drag and drop
             */
            if(that.attrs.draggable) {
                that._initDrag();
            }

            that._handleStageEvent(evt);
        }, false);

        this.content.addEventListener('touchmove', function(evt) {
        	/*
        	 * throttle touchmove
        	 */
            var throttle = that.attrs.throttle;
            var date = new Date();
            var time = date.getTime();
            var timeDiff = time - that.lastEventTime;
            var tt = 1000 / throttle;

            if(timeDiff >= tt) {
                evt.preventDefault();
                that._handleStageEvent(evt);
            }
        }, false);

        this.content.addEventListener('touchend', function(evt) {
            evt.preventDefault();
            that.touchEnd = true;
            that._handleStageEvent(evt);
        }, false);
    },
    /**
     * set mouse positon for desktop apps
     * @param {Event} evt
     */
    _setMousePosition: function(evt) {
        var mouseX = evt.offsetX || (evt.clientX - this._getContentPosition().left + window.pageXOffset);
        var mouseY = evt.offsetY || (evt.clientY - this._getContentPosition().top + window.pageYOffset);
        this.mousePos = {
            x: mouseX,
            y: mouseY
        };
    },
    /**
     * set touch position for mobile apps
     * @param {Event} evt
     */
    _setTouchPosition: function(evt) {
        if(evt.touches !== undefined && evt.touches.length === 1) {// Only deal with
            // one finger
            var touch = evt.touches[0];
            // Get the information for finger #1
            var touchX = touch.clientX - this._getContentPosition().left + window.pageXOffset;
            var touchY = touch.clientY - this._getContentPosition().top + window.pageYOffset;

            this.touchPos = {
                x: touchX,
                y: touchY
            };
        }
    },
    /**
     * get container position
     */
    _getContentPosition: function() {
        var obj = this.content;
        var top = 0;
        var left = 0;
        while(obj && obj.tagName !== 'BODY') {
            top += obj.offsetTop - obj.scrollTop;
            left += obj.offsetLeft - obj.scrollLeft;
            obj = obj.offsetParent;
        }
        return {
            top: top,
            left: left
        };
    },
    /**
     * modify path context
     * @param {CanvasContext} context
     */
    _modifyPathContext: function(context) {
        context.stroke = function() {
        };
        context.fill = function() {
        };
        context.fillRect = function(x, y, width, height) {
            context.rect(x, y, width, height);
        };
        context.strokeRect = function(x, y, width, height) {
            context.rect(x, y, width, height);
        };
        context.drawImage = function() {
        };
        context.fillText = function() {
        };
        context.strokeText = function() {
        };
    },
    /**
     * end drag and drop
     */
    _endDrag: function(evt) {
        var go = Kinetic.GlobalObject;
        if(go.drag.node) {
            if(go.drag.moving) {
                go.drag.moving = false;
                go.drag.node._handleEvents('ondragend', evt);
            }
        }
        go.drag.node = undefined;
    },
    /**
     * prepare drag and drop
     */
    _prepareDrag: function() {
        var that = this;

        this._onContent('mousemove touchmove', function(evt) {
            var go = Kinetic.GlobalObject;
            var node = go.drag.node;
            if(node) {
                var pos = that.getUserPosition();
                var dc = node.attrs.dragConstraint;
                var db = node.attrs.dragBounds;
                var lastNodePos = {
                    x: node.attrs.x,
                    y: node.attrs.y
                };

                // default
                var newNodePos = {
                    x: pos.x - go.drag.offset.x,
                    y: pos.y - go.drag.offset.y
                };

                // bounds overrides
                if(db.left !== undefined && newNodePos.x < db.left) {
                    newNodePos.x = db.left;
                }
                if(db.right !== undefined && newNodePos.x > db.right) {
                    newNodePos.x = db.right;
                }
                if(db.top !== undefined && newNodePos.y < db.top) {
                    newNodePos.y = db.top;
                }
                if(db.bottom !== undefined && newNodePos.y > db.bottom) {
                    newNodePos.y = db.bottom;
                }

                node.setAbsolutePosition(newNodePos);

                // constraint overrides
                if(dc === 'horizontal') {
                    node.attrs.y = lastNodePos.y;
                }
                else if(dc === 'vertical') {
                    node.attrs.x = lastNodePos.x;
                }

                /*
                 * if dragging and dropping the stage,
                 * draw all of the layers
                 */
                if(go.drag.node.nodeType === 'Stage') {
                    go.drag.node.draw();
                }

                else {
                    go.drag.node.getLayer().draw();
                }

                if(!go.drag.moving) {
                    go.drag.moving = true;
                    // execute dragstart events if defined
                    go.drag.node._handleEvents('ondragstart', evt);
                }

                // execute user defined ondragmove if defined
                go.drag.node._handleEvents('ondragmove', evt);
            }
        }, false);

        this._onContent('mouseup touchend mouseout', function(evt) {
            that._endDrag(evt);
        });
    },
    /**
     * build dom
     */
    _buildDOM: function() {
        // content
        this.content.style.position = 'relative';
        this.content.style.display = 'inline-block';
        this.content.className = 'kineticjs-content';
        this.attrs.container.appendChild(this.content);

        // default layers
        this.bufferLayer = new Kinetic.Layer({
            name: 'bufferLayer'
        });
        this.pathLayer = new Kinetic.Layer({
            name: 'pathLayer'
        });

        // set parents
        this.bufferLayer.parent = this;
        this.pathLayer.parent = this;

        // customize back stage context
        this._modifyPathContext(this.pathLayer.context);

        // hide canvases
        this.bufferLayer.getCanvas().style.display = 'none';
        this.pathLayer.getCanvas().style.display = 'none';

        // add buffer layer
        this.bufferLayer.canvas.className = 'kineticjs-buffer-layer';
        this.content.appendChild(this.bufferLayer.canvas);

        // add path layer
        this.pathLayer.canvas.className = 'kineticjs-path-layer';
        this.content.appendChild(this.pathLayer.canvas);

        this.setSize(this.attrs.width, this.attrs.height);
    },
    _addId: function(node) {
        if(node.attrs.id !== undefined) {
            this.ids[node.attrs.id] = node;
        }
    },
    _removeId: function(node) {
        if(node.attrs.id !== undefined) {
            this.ids[node.attrs.id] = undefined;
        }
    },
    _addName: function(node) {
        var name = node.attrs.name;
        if(name !== undefined) {
            if(this.names[name] === undefined) {
                this.names[name] = [];
            }
            this.names[name].push(node);
        }
    },
    _removeName: function(node) {
        if(node.attrs.name !== undefined) {
            var nodes = this.names[node.attrs.name];
            if(nodes !== undefined) {
                for(var n = 0; n < nodes.length; n++) {
                    var no = nodes[n];
                    if(no._id === node._id) {
                        nodes.splice(n, 1);
                    }
                }
            }
        }
    },
    /**
     * bind event listener to container DOM element
     * @param {String} typesStr
     * @param {function} handler
     */
    _onContent: function(typesStr, handler) {
        var types = typesStr.split(' ');
        for(var n = 0; n < types.length; n++) {
            var baseEvent = types[n];
            this.content.addEventListener(baseEvent, handler, false);
        }
    },
    /**
     * set defaults
     */
    _setStageDefaultProperties: function() {
        this.clickStart = false;
        this.targetShape = undefined;
        this.targetFound = false;
        this.mouseoverShape = undefined;
        this.mouseoutShape = undefined;

        // desktop flags
        this.mousePos = undefined;
        this.mouseDown = false;
        this.mouseUp = false;

        // mobile flags
        this.touchPos = undefined;
        this.touchStart = false;
        this.touchEnd = false;

        this.ids = {};
        this.names = {};
        this.anim = undefined;
        this.animRunning = false;
    }
};
// Extend Container and Node
Kinetic.GlobalObject.extend(Kinetic.Stage, Kinetic.Container);
Kinetic.GlobalObject.extend(Kinetic.Stage, Kinetic.Node);

///////////////////////////////////////////////////////////////////////
//  Layer
///////////////////////////////////////////////////////////////////////
/**
 * Layer constructor.  Layers are tied to their own canvas element and are used
 * to contain groups or shapes
 * @constructor
 * @augments Kinetic.Container
 * @augments Kinetic.Node
 * @param {Object} config
 */
Kinetic.Layer = function(config) {
    this.setDefaultAttrs({
        throttle: 80
    });

    this.nodeType = 'Layer';
    this.lastDrawTime = 0;
    this.beforeDrawFunc = undefined;
    this.afterDrawFunc = undefined;

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.style.position = 'absolute';

    // call super constructors
    Kinetic.Container.apply(this, []);
    Kinetic.Node.apply(this, [config]);
};
/*
 * Layer methods
 */
Kinetic.Layer.prototype = {
    /**
     * draw children nodes.  this includes any groups
     *  or shapes
     */
    draw: function() {
        var throttle = this.attrs.throttle;
        var date = new Date();
        var time = date.getTime();
        var timeDiff = time - this.lastDrawTime;
        var tt = 1000 / throttle;

        if(timeDiff >= tt) {
            this._draw();

            if(this.drawTimeout !== undefined) {
                clearTimeout(this.drawTimeout);
                this.drawTimeout = undefined;
            }
        }
        /*
         * if we cannot draw the layer due to throttling,
         * try to redraw the layer in the near future
         */
        else if(this.drawTimeout === undefined) {
            var that = this;
            /*
             * wait 17ms before trying again (60fps)
             */
            this.drawTimeout = setTimeout(function() {
                that.draw();
            }, 17);
        }
    },
    /**
     * set throttle
     * @param {Number} throttle in ms
     */
    setThrottle: function(throttle) {
        this.attrs.throttle = throttle;
    },
    /**
     * get throttle
     */
    getThrottle: function() {
        return this.attrs.throttle;
    },
    /**
     * set before draw function handler
     */
    beforeDraw: function(func) {
        this.beforeDrawFunc = func;
    },
    /**
     * set after draw function handler
     */
    afterDraw: function(func) {
        this.afterDrawFunc = func;
    },
    /**
     * clears the canvas context tied to the layer.  Clearing
     *  a layer does not remove its children.  The nodes within
     *  the layer will be redrawn whenever the .draw() method
     *  is used again.
     */
    clear: function() {
        var context = this.getContext();
        var canvas = this.getCanvas();
        context.clearRect(0, 0, canvas.width, canvas.height);
    },
    /**
     * get layer canvas
     */
    getCanvas: function() {
        return this.canvas;
    },
    /**
     * get layer context
     */
    getContext: function() {
        return this.context;
    },
    /**
     * private draw children
     */
    _draw: function() {
        var date = new Date();
        var time = date.getTime();
        this.lastDrawTime = time;

        // before draw  handler
        if(this.beforeDrawFunc !== undefined) {
            this.beforeDrawFunc.call(this);
        }

        this.clear();
        if(this.attrs.visible) {
            // draw custom func
            if(this.attrs.drawFunc !== undefined) {
                this.attrs.drawFunc.call(this);
            }

            // draw children
            this._drawChildren();
        }

        // after draw  handler
        if(this.afterDrawFunc !== undefined) {
            this.afterDrawFunc.call(this);
        }
    }
};
// Extend Container and Node
Kinetic.GlobalObject.extend(Kinetic.Layer, Kinetic.Container);
Kinetic.GlobalObject.extend(Kinetic.Layer, Kinetic.Node);

///////////////////////////////////////////////////////////////////////
//  Group
///////////////////////////////////////////////////////////////////////

/**
 * Group constructor.  Groups are used to contain shapes or other groups.
 * @constructor
 * @augments Kinetic.Container
 * @augments Kinetic.Node
 * @param {Object} config
 */
Kinetic.Group = function(config) {
    this.nodeType = 'Group';;
    
    // call super constructors
    Kinetic.Container.apply(this, []);
    Kinetic.Node.apply(this, [config]);
};
/* 
 * Group methods
 */
Kinetic.Group.prototype = {
    draw: function() {
        if(this.attrs.visible) {
            this._drawChildren();
        }
    }
};

// Extend Container and Node
Kinetic.GlobalObject.extend(Kinetic.Group, Kinetic.Container);
Kinetic.GlobalObject.extend(Kinetic.Group, Kinetic.Node);

///////////////////////////////////////////////////////////////////////
//  Shape
///////////////////////////////////////////////////////////////////////
/**
 * Shape constructor.  Shapes are used to objectify drawing bits of a KineticJS
 * application
 * @constructor
 * @augments Kinetic.Node
 * @param {Object} config
 * @config {String|Object} [fill] can be a string color, a linear gradient object, a radial
 *  gradient object, or a pattern object.
 * @config {String} [stroke] stroke color
 * @config {Number} [strokeWidth] stroke width
 * @config {String} [lineJoin] line join can be "miter", "round", or "bevel".  The default
 *  is "miter"
 * @config {Object} [shadow] shadow object
 * @config {String} [detectionType] shape detection type.  Can be "path" or "pixel".
 *  The default is "path" because it performs better
 */
Kinetic.Shape = function(config) {
    this.setDefaultAttrs({
        fill: undefined,
        stroke: undefined,
        strokeWidth: undefined,
        lineJoin: undefined,
        detectionType: 'path',
        shadow: {
            blur: 10,
            alpha: 1,
            offset: {
                x: 0,
                y: 0
            }
        }
    });

    this.data = [];
    this.nodeType = 'Shape';
    this.appliedShadow = false;

    // call super constructor
    Kinetic.Node.apply(this, [config]);
};
/*
 * Shape methods
 */
Kinetic.Shape.prototype = {
    /**
     * get layer context where the shape is being drawn.  When
     * the shape is being rendered, .getContext() returns the context of the
     * user created layer that contains the shape.  When the event detection
     * engine is determining whether or not an event has occured on that shape,
     * .getContext() returns the context of the invisible path layer.
     */
    getContext: function() {
        if(this.tempLayer === undefined) {
            return null;
        }
        else {
            return this.tempLayer.getContext();
        }
    },
    /**
     * get shape temp layer canvas
     */
    getCanvas: function() {
        return this.tempLayer.getCanvas();
    },
    /**
     * helper method to stroke the shape and apply
     * shadows if needed
     */
    stroke: function() {
        var appliedShadow = false;
        var context = this.getContext();
        context.save();

        if(!!this.attrs.stroke || !!this.attrs.strokeWidth) {
            if(!this.appliedShadow) {
                appliedShadow = this._applyShadow();
            }

            var stroke = !!this.attrs.stroke ? this.attrs.stroke : 'black';
            var strokeWidth = !!this.attrs.strokeWidth ? this.attrs.strokeWidth : 2;

            context.lineWidth = strokeWidth;
            context.strokeStyle = stroke;
            context.stroke();
        }

        context.restore();

        if(appliedShadow) {
            this.stroke();
        }
    },
    /**
     * helper method to fill the shape with a color, linear gradient,
     * radial gradient, or pattern, and also apply shadows if needed
     * */
    fill: function() {
        var appliedShadow = false;
        var context = this.getContext();
        context.save();

        var fill = this.attrs.fill;
        if(!!fill) {
            if(!this.appliedShadow) {
                appliedShadow = this._applyShadow();
            }

            var s = fill.start;
            var e = fill.end;
            var f = null;

            // color fill
            if( typeof fill == 'string') {
                f = this.attrs.fill;
                context.fillStyle = f;
                context.fill();
            }
            // pattern
            else if(fill.image !== undefined) {
                var repeat = fill.repeat === undefined ? 'repeat' : fill.repeat;
                f = context.createPattern(fill.image, repeat);

                context.save();

                if(fill.offset !== undefined) {
                    context.translate(fill.offset.x, fill.offset.y);
                }

                context.fillStyle = f;
                context.fill();
                context.restore();
            }
            // linear gradient
            else if(s.radius === undefined && e.radius === undefined) {
                var context = this.getContext();
                var grd = context.createLinearGradient(s.x, s.y, e.x, e.y);
                var colorStops = fill.colorStops;

                // build color stops
                for(var n = 0; n < colorStops.length; n += 2) {
                    grd.addColorStop(colorStops[n], colorStops[n + 1]);
                }
                f = grd;
                context.fillStyle = f;
                context.fill();
            }
            // radial gradient
            else if(s.radius !== undefined && e.radius !== undefined) {
                var context = this.getContext();
                var grd = context.createRadialGradient(s.x, s.y, s.radius, e.x, e.y, e.radius);
                var colorStops = fill.colorStops;

                // build color stops
                for(var n = 0; n < colorStops.length; n += 2) {
                    grd.addColorStop(colorStops[n], colorStops[n + 1]);
                }
                f = grd;
                context.fillStyle = f;
                context.fill();
            }
            else {
                f = 'black';
                context.fillStyle = f;
                context.fill();
            }
        }
        context.restore();

        if(appliedShadow) {
            this.fill();
        }
    },
    /**
     * helper method to fill text and appy shadows if needed
     */
    fillText: function(text, x, y) {
        var appliedShadow = false;
        var context = this.getContext();
        context.save();
        if(this.attrs.textFill !== undefined) {
            if(!this.appliedShadow) {
                appliedShadow = this._applyShadow();
            }
            context.fillStyle = this.attrs.textFill;
            context.fillText(text, x, y);
        }
        context.restore();

        if(appliedShadow) {
            this.fillText(text, x, y);
        }
    },
    /**
     * helper method to stroke text and apply shadows
     * if needed
     */
    strokeText: function(text, x, y) {
        var appliedShadow = false;
        var context = this.getContext();
        context.save();
        if(this.attrs.textStroke !== undefined || this.attrs.textStrokeWidth !== undefined) {
            if(!this.appliedShadow) {
                appliedShadow = this._applyShadow();
            }

            // defaults
            if(this.attrs.textStroke === undefined) {
                this.attrs.textStroke = 'black';
            }
            else if(this.attrs.textStrokeWidth === undefined) {
                this.attrs.textStrokeWidth = 2;
            }
            context.lineWidth = this.attrs.textStrokeWidth;
            context.strokeStyle = this.attrs.textStroke;
            context.strokeText(text, x, y);
        }
        context.restore();

        if(appliedShadow) {
            this.strokeText(text, x, y);
        }
    },
    /**
     * helper method to draw an image and apply
     * a shadow if neede
     */
    drawImage: function() {
        var appliedShadow = false;
        var context = this.getContext();
        context.save();
        var a = arguments;

        if(a.length === 5 || a.length === 9) {
            if(!this.appliedShadow) {
                appliedShadow = this._applyShadow();
            }
            switch(a.length) {
                case 5:
                    context.drawImage(a[0], a[1], a[2], a[3], a[4]);
                    break;
                case 9:
                    context.drawImage(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
                    break;
            }
        }

        context.restore();

        if(appliedShadow) {
            this.drawImage.apply(this, arguments);
        }
    },
    /**
     * helper method to set the line join of a shape
     * based on the lineJoin property
     */
    applyLineJoin: function() {
        var context = this.getContext();
        if(this.attrs.lineJoin !== undefined) {
            context.lineJoin = this.attrs.lineJoin;
        }
    },
    _applyShadow: function() {
        var context = this.getContext();
        var s = this.attrs.shadow;
        var aa = this.getAbsoluteAlpha();
        var sa = this.attrs.shadow.alpha;

        if(s.color !== undefined) {
            context.globalAlpha = sa * aa;
            context.shadowColor = s.color;
            context.shadowBlur = s.blur;
            context.shadowOffsetX = s.offset.x;
            context.shadowOffsetY = s.offset.y;
            this.appliedShadow = true;
            return true;
        }

        return false;
    },
    /**
     * set fill which can be a color, linear gradient object,
     *  radial gradient object, or pattern object
     * @param {String|Object} fill
     */
    setFill: function(config) {
        this.setAttrs({
            fill: config
        });
    },
    /**
     * get fill
     */
    getFill: function() {
        return this.attrs.fill;
    },
    /**
     * set stroke color
     * @param {String} stroke
     */
    setStroke: function(stroke) {
        this.attrs.stroke = stroke;
    },
    /**
     * get stroke color
     */
    getStroke: function() {
        return this.attrs.stroke;
    },
    /**
     * set line join
     * @param {String} lineJoin.  Can be miter, round, or bevel.  The
     *  default is miter
     */
    setLineJoin: function(lineJoin) {
        this.attrs.lineJoin = lineJoin;
    },
    /**
     * get line join
     */
    getLineJoin: function() {
        return this.attrs.lineJoin;
    },
    /**
     * set stroke width
     * @param {Number} strokeWidth
     */
    setStrokeWidth: function(strokeWidth) {
        this.attrs.strokeWidth = strokeWidth;
    },
    /**
     * get stroke width
     */
    getStrokeWidth: function() {
        return this.attrs.strokeWidth;
    },
    /**
     * set shadow object
     * @param {Object} config
     */
    setShadow: function(config) {
        this.setAttrs({
            shadow: config
        });
    },
    /**
     * get shadow object
     */
    getShadow: function() {
        return this.attrs.shadow;
    },
    /**
     * set draw function
     * @param {Function} func drawing function
     */
    setDrawFunc: function(func) {
        this.attrs.drawFunc = func;
    },
    /**
     * save shape data when using pixel detection.
     */
    saveData: function() {
        var stage = this.getStage();
        var w = stage.attrs.width;
        var h = stage.attrs.height;

        var bufferLayer = stage.bufferLayer;
        var bufferLayerContext = bufferLayer.getContext();

        bufferLayer.clear();
        this._draw(bufferLayer);

        var imageData = bufferLayerContext.getImageData(0, 0, w, h);
        this.data = imageData.data;
    },
    /**
     * clear shape data
     */
    clearData: function() {
        this.data = [];
    },
    /**
     * determines if point is in the shape
     */
    intersects: function() {
        var pos = Kinetic.GlobalObject._getXY(arguments);
        var stage = this.getStage();

        if(this.attrs.detectionType === 'path') {
            var pathLayer = stage.pathLayer;
            var pathLayerContext = pathLayer.getContext();

            this._draw(pathLayer);

            return pathLayerContext.isPointInPath(pos.x, pos.y);
        }
        else {
            var w = stage.attrs.width;
            var alpha = this.data[((w * pos.y) + pos.x) * 4 + 3];
            return (alpha !== undefined && alpha !== 0);
        }
    },
    _draw: function(layer) {
        if(layer !== undefined && this.attrs.drawFunc !== undefined) {
            var stage = layer.getStage();
            var context = layer.getContext();
            var family = [];
            var parent = this.parent;

            family.unshift(this);
            while(parent) {
                family.unshift(parent);
                parent = parent.parent;
            }

            context.save();
            for(var n = 0; n < family.length; n++) {
                var node = family[n];
                var t = node.getTransform();

                // center offset
                if(node.attrs.centerOffset.x !== 0 || node.attrs.centerOffset.y !== 0) {
                    t.translate(-1 * node.attrs.centerOffset.x, -1 * node.attrs.centerOffset.y);
                }

                var m = t.getMatrix();
                context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
            }

            this.tempLayer = layer;

            /*
             * pre styles include alpha, linejoin, and line cap
             */
            if(this.getAbsoluteAlpha() !== 1) {
                context.globalAlpha = this.getAbsoluteAlpha();
            }
            this.applyLineJoin();

            // draw the shape
            this.appliedShadow = false;
            this.attrs.drawFunc.call(this);
            context.restore();
        }
    }
};
// extend Node
Kinetic.GlobalObject.extend(Kinetic.Shape, Kinetic.Node);

///////////////////////////////////////////////////////////////////////
//  Rect
///////////////////////////////////////////////////////////////////////
/**
 * Rect constructor
 * @constructor
 * @augments Kinetic.Shape
 * @param {Object} config
 */
Kinetic.Rect = function(config) {
    this.setDefaultAttrs({
        width: 0,
        height: 0,
        cornerRadius: 0
    });

    this.shapeType = "Rect";

    config.drawFunc = function() {
        var context = this.getContext();
        context.beginPath();
        if(this.attrs.cornerRadius === 0) {
            // simple rect - don't bother doing all that complicated maths stuff.
            context.rect(0, 0, this.attrs.width, this.attrs.height);
        }
        else {
            // arcTo would be nicer, but browser support is patchy (Opera)
            context.moveTo(this.attrs.cornerRadius, 0);
            context.lineTo(this.attrs.width - this.attrs.cornerRadius, 0);
            context.arc(this.attrs.width - this.attrs.cornerRadius, this.attrs.cornerRadius, this.attrs.cornerRadius, Math.PI * 3 / 2, 0, false);
            context.lineTo(this.attrs.width, this.attrs.height - this.attrs.cornerRadius);
            context.arc(this.attrs.width - this.attrs.cornerRadius, this.attrs.height - this.attrs.cornerRadius, this.attrs.cornerRadius, 0, Math.PI / 2, false);
            context.lineTo(this.attrs.cornerRadius, this.attrs.height);
            context.arc(this.attrs.cornerRadius, this.attrs.height - this.attrs.cornerRadius, this.attrs.cornerRadius, Math.PI / 2, Math.PI, false);
            context.lineTo(0, this.attrs.cornerRadius);
            context.arc(this.attrs.cornerRadius, this.attrs.cornerRadius, this.attrs.cornerRadius, Math.PI, Math.PI * 3 / 2, false);
        }
        context.closePath();
        
        this.fill();
        this.stroke();
    };
    // call super constructor
    Kinetic.Shape.apply(this, [config]);
};
/*
 * Rect methods
 */
Kinetic.Rect.prototype = {
    /**
     * set width
     * @param {Number} width
     */
    setWidth: function(width) {
        this.attrs.width = width;
    },
    /**
     * get width
     */
    getWidth: function() {
        return this.attrs.width;
    },
    /**
     * set height
     * @param {Number} height
     */
    setHeight: function(height) {
        this.attrs.height = height;
    },
    /**
     * get height
     */
    getHeight: function() {
        return this.attrs.height;
    },
    /**
     * set width and height
     */
    setSize: function() {
        var size = Kinetic.GlobalObject._getSize(arguments);
        this.setAttrs(size);
    },
    /**
     * return rect size
     */
    getSize: function() {
        return {
            width: this.attrs.width,
            height: this.attrs.height
        };
    },
    /**
     * set corner radius
     * @param {Number} radius
     */
    setCornerRadius: function(radius) {
        this.attrs.cornerRadius = radius;
    },
    /**
     * get corner radius
     */
    getCornerRadius: function() {
        return this.attrs.cornerRadius;
    },
};

// extend Shape
Kinetic.GlobalObject.extend(Kinetic.Rect, Kinetic.Shape);

///////////////////////////////////////////////////////////////////////
//  Circle
///////////////////////////////////////////////////////////////////////
/**
 * Circle constructor
 * @constructor
 * @augments Kinetic.Shape
 * @param {Object} config
 */
Kinetic.Circle = function(config) {
    this.setDefaultAttrs({
        radius: 0
    });

    this.shapeType = "Circle";

    config.drawFunc = function() {
        var canvas = this.getCanvas();
        var context = this.getContext();
        context.beginPath();
        context.arc(0, 0, this.attrs.radius, 0, Math.PI * 2, true);
        context.closePath();
        this.fill();
        this.stroke();
    };
    // call super constructor
    Kinetic.Shape.apply(this, [config]);
};
/*
 * Circle methods
 */
Kinetic.Circle.prototype = {
    /**
     * set radius
     * @param {Number} radius
     */
    setRadius: function(radius) {
        this.attrs.radius = radius;
    },
    /**
     * get radius
     */
    getRadius: function() {
        return this.attrs.radius;
    }
};

// extend Shape
Kinetic.GlobalObject.extend(Kinetic.Circle, Kinetic.Shape);

///////////////////////////////////////////////////////////////////////
//  Image
///////////////////////////////////////////////////////////////////////
/**
 * Image constructor
 * @constructor
 * @augments Kinetic.Shape
 * @param {Object} config
 */
Kinetic.Image = function(config) {
    this.setDefaultAttrs({
        crop: {
            x: 0,
            y: 0,
            width: undefined,
            height: undefined
        }
    });

    this.shapeType = "Image";
    config.drawFunc = function() {
        if(this.attrs.image !== undefined) {
            var width = this.attrs.width !== undefined ? this.attrs.width : this.attrs.image.width;
            var height = this.attrs.height !== undefined ? this.attrs.height : this.attrs.image.height;
            var cropX = this.attrs.crop.x;
            var cropY = this.attrs.crop.y;
            var cropWidth = this.attrs.crop.width;
            var cropHeight = this.attrs.crop.height;
            var canvas = this.getCanvas();
            var context = this.getContext();

            context.beginPath();
            context.rect(0, 0, width, height);
            context.closePath();
            this.fill();
            this.stroke();

            // if cropping
            if(cropWidth !== undefined && cropHeight !== undefined) {
                this.drawImage(this.attrs.image, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height);
            }
            // no cropping
            else {
                this.drawImage(this.attrs.image, 0, 0, width, height);
            }
        }
    };
    // call super constructor
    Kinetic.Shape.apply(this, [config]);
};
/*
 * Image methods
 */
Kinetic.Image.prototype = {
    /**
     * set image
     * @param {ImageObject} image
     */
    setImage: function(image) {
        this.attrs.image = image;
    },
    /**
     * get image
     */
    getImage: function() {
        return this.attrs.image;
    },
    /**
     * set width
     * @param {Number} width
     */
    setWidth: function(width) {
        this.attrs.width = width;
    },
    /**
     * get width
     */
    getWidth: function() {
        return this.attrs.width;
    },
    /**
     * set height
     * @param {Number} height
     */
    setHeight: function(height) {
        this.attrs.height = height;
    },
    /**
     * get height
     */
    getHeight: function() {
        return this.attrs.height;
    },
    /**
     * set width and height
     */
    setSize: function() {
        var size = Kinetic.GlobalObject._getSize(arguments);
        this.setAttrs(size);
    },
    /**
     * return image size
     */
    getSize: function() {
        return {
            width: this.attrs.width,
            height: this.attrs.height
        };
    },
    /**
     * return cropping
     */
    getCrop: function() {
        return this.attrs.crop;
    },
    /**
     * set cropping
     */
    setCrop: function() {
        this.setAttrs({
            crop: arguments
        });
    }
};
// extend Shape
Kinetic.GlobalObject.extend(Kinetic.Image, Kinetic.Shape);

///////////////////////////////////////////////////////////////////////
//  Sprite
///////////////////////////////////////////////////////////////////////
/**
 * Sprite constructor
 * @constructor
 * @augments Kinetic.Shape
 * @param {Object} config
 */
Kinetic.Sprite = function(config) {
    this.setDefaultAttrs({
        index: 0,
        frameRate: 17
    });

    config.drawFunc = function() {
        if(this.attrs.image !== undefined) {
            var context = this.getContext();
            var anim = this.attrs.animation;
            var index = this.attrs.index;
            var f = this.attrs.animations[anim][index];

            context.beginPath();
            context.rect(0, 0, f.width, f.height);
            context.closePath();
            
            this.drawImage(this.attrs.image, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
        }
    };
    // call super constructor
    Kinetic.Shape.apply(this, [config]);
};
/*
 * Sprite methods
 */
Kinetic.Sprite.prototype = {
    /**
     * start sprite animation
     */
    start: function() {
        var that = this;
        var layer = this.getLayer();
        this.interval = setInterval(function() {
            that._updateIndex();
            layer.draw();
            if(that.afterFrameFunc && that.attrs.index === that.afterFrameIndex) {
                that.afterFrameFunc();
            }
        }, 1000 / this.attrs.frameRate)
    },
    /**
     * stop sprite animation
     */
    stop: function() {
        clearInterval(this.interval);
    },
    /**
     * set after frame event handler
     * @param {Integer} index frame index
     * @param {Function} func function to be executed after frame has been drawn
     */
    afterFrame: function(index, func) {
        this.afterFrameIndex = index;
        this.afterFrameFunc = func;
    },
    /**
     * set animation key
     * @param {String} anim animation key
     */
    setAnimation: function(anim) {
        this.attrs.animation = anim;
    },
    /**
     * set animations obect
     * @param {Object} animations
     */
    setAnimations: function(animations) {
        this.attrs.animations = animations;
    },
    /**
     * get animations object
     */
    getAnimations: function() {
        return this.attrs.animations;
    },
    /**
     * get animation key
     */
    getAnimation: function() {
        return this.attrs.animation;
    },
    /**
     * set animation frame index
     * @param {Integer} index frame index
     */
    setIndex: function(index) {
        this.attrs.index = index;
    },
    _updateIndex: function() {
        var i = this.attrs.index;
        var a = this.attrs.animation;
        if(i < this.attrs.animations[a].length - 1) {
            this.attrs.index++;
        }
        else {
            this.attrs.index = 0;
        }
    }
};
// extend Shape
Kinetic.GlobalObject.extend(Kinetic.Sprite, Kinetic.Shape);

///////////////////////////////////////////////////////////////////////
//  Polygon
///////////////////////////////////////////////////////////////////////
/**
 * Polygon constructor.&nbsp; Polygons are defined by an array of points
 * @constructor
 * @augments Kinetic.Shape
 * @param {Object} config
 */
Kinetic.Polygon = function(config) {
    this.setDefaultAttrs({
        points: []
    });

    this.shapeType = "Polygon";
    config.drawFunc = function() {
        var context = this.getContext();
        context.beginPath();
        context.moveTo(this.attrs.points[0].x, this.attrs.points[0].y);
        for(var n = 1; n < this.attrs.points.length; n++) {
            context.lineTo(this.attrs.points[n].x, this.attrs.points[n].y);
        }
        context.closePath();
        this.fill();
        this.stroke();
    };
    // call super constructor
    Kinetic.Shape.apply(this, [config]);
};
/*
 * Polygon methods
 */
Kinetic.Polygon.prototype = {
    /**
     * set points array
     * @param {Array} can be an array of point objects or an array
     *  of Numbers.  e.g. [{x:1,y:2},{x:3,y:4}] or [1,2,3,4]
     */
    setPoints: function(points) {
        this.setAttrs({
            points: points
        });
    },
    /**
     * get points array
     */
    getPoints: function() {
        return this.attrs.points;
    }
};

// extend Shape
Kinetic.GlobalObject.extend(Kinetic.Polygon, Kinetic.Shape);

///////////////////////////////////////////////////////////////////////
//  RegularPolygon
///////////////////////////////////////////////////////////////////////
/**
 * RegularPolygon constructor.&nbsp; Examples include triangles, squares, pentagons, hexagons, etc.
 * @constructor
 * @augments Kinetic.Shape
 * @param {Object} config
 */
Kinetic.RegularPolygon = function(config) {
    this.setDefaultAttrs({
        radius: 0,
        sides: 0
    });

    this.shapeType = "RegularPolygon";
    config.drawFunc = function() {
        var context = this.getContext();
        context.beginPath();
        context.moveTo(0, 0 - this.attrs.radius);

        for(var n = 1; n < this.attrs.sides; n++) {
            var x = this.attrs.radius * Math.sin(n * 2 * Math.PI / this.attrs.sides);
            var y = -1 * this.attrs.radius * Math.cos(n * 2 * Math.PI / this.attrs.sides);
            context.lineTo(x, y);
        }
        context.closePath();
        this.fill();
        this.stroke();
    };
    // call super constructor
    Kinetic.Shape.apply(this, [config]);
};
/*
 * RegularPolygon methods
 */
Kinetic.RegularPolygon.prototype = {
    /**
     * set radius
     * @param {Number} radius
     */
    setRadius: function(radius) {
        this.attrs.radius = radius;
    },
    /**
     * get radius
     */
    getRadius: function() {
        return this.attrs.radius;
    },
    /**
     * set number of sides
     * @param {int} sides
     */
    setSides: function(sides) {
        this.attrs.sides = sides;
    },
    /**
     * get number of sides
     */
    getSides: function() {
        return this.attrs.sides;
    }
};

// extend Shape
Kinetic.GlobalObject.extend(Kinetic.RegularPolygon, Kinetic.Shape);

///////////////////////////////////////////////////////////////////////
//  Star
///////////////////////////////////////////////////////////////////////
/**
 * Star constructor
 * @constructor
 * @augments Kinetic.Shape
 * @param {Object} config
 */
Kinetic.Star = function(config) {
    this.setDefaultAttrs({
        numPoints: 0,
        innerRadius: 0,
        outerRadius: 0
    });

    this.shapeType = "Star";
    config.drawFunc = function() {
        var context = this.getContext();
        context.beginPath();
        context.moveTo(0, 0 - this.attrs.outerRadius);

        for(var n = 1; n < this.attrs.numPoints * 2; n++) {
            var radius = n % 2 === 0 ? this.attrs.outerRadius : this.attrs.innerRadius;
            var x = radius * Math.sin(n * Math.PI / this.attrs.numPoints);
            var y = -1 * radius * Math.cos(n * Math.PI / this.attrs.numPoints);
            context.lineTo(x, y);
        }
        context.closePath();
        
        this.fill();
        this.stroke();
    };
    // call super constructor
    Kinetic.Shape.apply(this, [config]);
};
/*
 * Star methods
 */
Kinetic.Star.prototype = {
    /**
     * set number of points
     * @param {Integer} points
     */
    setNumPoints: function(numPoints) {
        this.attrs.numPoints = numPoints;
    },
    /**
     * get number of points
     */
    getNumPoints: function() {
        return this.attrs.numPoints;
    },
    /**
     * set outer radius
     * @param {Number} radius
     */
    setOuterRadius: function(radius) {
        this.attrs.outerRadius = radius;
    },
    /**
     * get outer radius
     */
    getOuterRadius: function() {
        return this.attrs.outerRadius;
    },
    /**
     * set inner radius
     * @param {Number} radius
     */
    setInnerRadius: function(radius) {
        this.attrs.innerRadius = radius;
    },
    /**
     * get inner radius
     */
    getInnerRadius: function() {
        return this.attrs.innerRadius;
    }
};
// extend Shape
Kinetic.GlobalObject.extend(Kinetic.Star, Kinetic.Shape);

///////////////////////////////////////////////////////////////////////
//  Text
///////////////////////////////////////////////////////////////////////
/**
 * Text constructor
 * @constructor
 * @augments Kinetic.Shape
 * @param {Object} config
 */
Kinetic.Text = function(config) {
    this.setDefaultAttrs({
        fontFamily: 'Calibri',
        text: '',
        fontSize: 12,
        align: 'left',
        verticalAlign: 'top',
        padding: 0,
        fontStyle: 'normal',
        width: 'auto'
    });

    this.shapeType = "Text";

    config.drawFunc = function() {
        var context = this.getContext();
        context.font = this.attrs.fontStyle + ' ' + this.attrs.fontSize + 'pt ' + this.attrs.fontFamily;
        context.textBaseline = 'middle';
        var textHeight = this.getTextHeight();
        var textWidth = this.attrs.width === 'auto' ? this.getTextWidth() : this.attrs.width;
        var p = this.attrs.padding;
        var x = 0;
        var y = 0;
        var that = this;

        switch (this.attrs.align) {
            case 'center':
                x = textWidth / -2 - p;
                break;
            case 'right':
                x = -1 * textWidth - p;
                break;
        }

        switch (this.attrs.verticalAlign) {
            case 'middle':
                y = textHeight / -2 - p;
                break;
            case 'bottom':
                y = -1 * textHeight - p;
                break;
        }

        // draw path
        context.save();
        context.beginPath();
        context.rect(x, y, textWidth + p * 2, textHeight + p * 2);
        context.closePath();

        this.fill();
        this.stroke();

        context.restore();

        var tx = p + x;
        var ty = textHeight / 2 + p + y;

        // clipping region for max width
        context.save();
        if(this.attrs.width !== 'auto') {
            context.beginPath();
            context.rect(x, y, textWidth + p, textHeight + p * 2);
            context.closePath();
            context.clip();
        }

        // draw text
        this.fillText(this.attrs.text, tx, ty);
		this.strokeText(this.attrs.text, tx, ty);
		
        context.restore();
    };
    // call super constructor
    Kinetic.Shape.apply(this, [config]);
};
/*
 * Text methods
 */
Kinetic.Text.prototype = {
    /**
     * set font family
     * @param {String} fontFamily
     */
    setFontFamily: function(fontFamily) {
        this.attrs.fontFamily = fontFamily;
    },
    /**
     * get font family
     */
    getFontFamily: function() {
        return this.attrs.fontFamily;
    },
    /**
     * set font size
     * @param {int} fontSize
     */
    setFontSize: function(fontSize) {
        this.attrs.fontSize = fontSize;
    },
    /**
     * get font size
     */
    getFontSize: function() {
        return this.attrs.fontSize;
    },
    /**
     * set font style.  Can be "normal", "italic", or "bold".  "normal" is the default.
     * @param {String} fontStyle
     */
    setFontStyle: function(fontStyle) {
        this.attrs.fontStyle = fontStyle;
    },
    /**
     * get font style
     */
    getFontStyle: function() {
        return this.attrs.fontStyle;
    },
    /**
     * set text fill color
     * @param {String} textFill
     */
    setTextFill: function(textFill) {
        this.attrs.textFill = textFill;
    },
    /**
     * get text fill color
     */
    getTextFill: function() {
        return this.attrs.textFill;
    },
    /**
     * set text stroke color
     * @param {String} textStroke
     */
    setTextStroke: function(textStroke) {
        this.attrs.textStroke = textStroke;
    },
    /**
     * get text stroke color
     */
    getTextStroke: function() {
        return this.attrs.textStroke;
    },
    /**
     * set text stroke width
     * @param {int} textStrokeWidth
     */
    setTextStrokeWidth: function(textStrokeWidth) {
        this.attrs.textStrokeWidth = textStrokeWidth;
    },
    /**
     * get text stroke width
     */
    getTextStrokeWidth: function() {
        return this.attrs.textStrokeWidth;
    },
    /**
     * set padding
     * @param {int} padding
     */
    setPadding: function(padding) {
        this.attrs.padding = padding;
    },
    /**
     * get padding
     */
    getPadding: function() {
        return this.attrs.padding;
    },
    /**
     * set horizontal align of text
     * @param {String} align align can be 'left', 'center', or 'right'
     */
    setAlign: function(align) {
        this.attrs.align = align;
    },
    /**
     * get horizontal align
     */
    getAlign: function() {
        return this.attrs.align;
    },
    /**
     * set vertical align of text
     * @param {String} verticalAlign verticalAlign can be "top", "middle", or "bottom"
     */
    setVerticalAlign: function(verticalAlign) {
        this.attrs.verticalAlign = verticalAlign;
    },
    /**
     * get vertical align
     */
    getVerticalAlign: function() {
        return this.attrs.verticalAlign;
    },
    /**
     * set text
     * @param {String} text
     */
    setText: function(text) {
        this.attrs.text = text;
    },
    /**
     * get text
     */
    getText: function() {
        return this.attrs.text;
    },
    /**
     * get text width in pixels
     */
    getTextWidth: function() {
        return this.getTextSize().width;
    },
    /**
     * get text height in pixels
     */
    getTextHeight: function() {
        return this.getTextSize().height;
    },
    /**
     * get text size in pixels
     */
    getTextSize: function() {
        var context = this.getContext();

        /**
         * if the text hasn't been added a layer yet there
         * will be no associated context.  Will have to create
         * a dummy context
         */
        if(!context) {
            var dummyCanvas = document.createElement('canvas');
            context = dummyCanvas.getContext('2d');
        }

        context.save();
        context.font = this.attrs.fontStyle + ' ' + this.attrs.fontSize + 'pt ' + this.attrs.fontFamily;
        var metrics = context.measureText(this.attrs.text);
        context.restore();
        return {
            width: metrics.width,
            height: parseInt(this.attrs.fontSize, 10)
        };
    },
    /**
     * get width in pixels
     */
    getWidth: function() {
        return this.attrs.width;
    },
    /**
     * set width
     * @param {Number} width
     */
    setWidth: function(width) {
        this.attrs.width = width;
    }
};
// extend Shape
Kinetic.GlobalObject.extend(Kinetic.Text, Kinetic.Shape);

///////////////////////////////////////////////////////////////////////
//  Line
///////////////////////////////////////////////////////////////////////
/**
 * Line constructor.&nbsp; Lines are defined by an array of points
 * @constructor
 * @augments Kinetic.Shape
 * @param {Object} config
 */
Kinetic.Line = function(config) {
    this.setDefaultAttrs({
        points: [],
        lineCap: 'butt',
        dashArray: [],
        detectionType: 'pixel'
    });

    this.shapeType = "Line";
    config.drawFunc = function() {
        var context = this.getContext();
        var lastPos = {};
        context.beginPath();

        context.moveTo(this.attrs.points[0].x, this.attrs.points[0].y);

        for(var n = 1; n < this.attrs.points.length; n++) {
            var x = this.attrs.points[n].x;
            var y = this.attrs.points[n].y;
            if(this.attrs.dashArray.length > 0) {
                // draw dashed line
                var lastX = this.attrs.points[n - 1].x;
                var lastY = this.attrs.points[n - 1].y;
                this._dashedLine(lastX, lastY, x, y, this.attrs.dashArray);
            }
            else {
                // draw normal line
                context.lineTo(x, y);
            }
        }

        if(!!this.attrs.lineCap) {
            context.lineCap = this.attrs.lineCap;
        }

        this.stroke();
    };
    // call super constructor
    Kinetic.Shape.apply(this, [config]);
};
/*
 * Line methods
 */
Kinetic.Line.prototype = {
    /**
     * set points array
     * @param {Array} can be an array of point objects or an array
     *  of Numbers.  e.g. [{x:1,y:2},{x:3,y:4}] or [1,2,3,4]
     */
    setPoints: function(points) {
        this.setAttrs({
            points: points
        });
    },
    /**
     * get points array
     */
    getPoints: function() {
        return this.attrs.points;
    },
    /**
     * set line cap.  Can be butt, round, or square
     * @param {String} lineCap
     */
    setLineCap: function(lineCap) {
        this.attrs.lineCap = lineCap;
    },
    /**
     * get line cap
     */
    getLineCap: function() {
        return this.attrs.lineCap;
    },
    /**
     * set dash array.
     * @param {Array} dashArray
     *  examples:<br>
     *  [10, 5] dashes are 10px long and 5 pixels apart
     *  [10, 20, 0, 20] if using a round lineCap, the line will
     *  be made up of alternating dashed lines that are 10px long
     *  and 20px apart, and dots that have a radius of 5 and are 20px
     *  apart
     */
    setDashArray: function(dashArray) {
        this.attrs.dashArray = dashArray;
    },
    /**
     * get dash array
     */
    getDashArray: function() {
        return this.attrs.dashArray;
    },
    /**
     * draw dashed line.  Written by Phrogz
     */
    _dashedLine: function(x, y, x2, y2, dashArray) {
        var context = this.getContext();
        var dashCount = dashArray.length;

        var dx = (x2 - x), dy = (y2 - y);
        var xSlope = dx > dy;
        var slope = (xSlope) ? dy / dx : dx / dy;

        /*
         * gaurd against slopes of infinity
         */
        if(slope > 9999) {
            slope = 9999;
        }
        else if(slope < -9999) {
            slope = -9999;
        }

        var distRemaining = Math.sqrt(dx * dx + dy * dy);
        var dashIndex = 0, draw = true;
        while(distRemaining >= 0.1 && dashIndex < 10000) {
            var dashLength = dashArray[dashIndex++ % dashCount];
            if(dashLength === 0) {
                dashLength = 0.001;
            }
            if(dashLength > distRemaining) {
                dashLength = distRemaining;
            }
            var step = Math.sqrt(dashLength * dashLength / (1 + slope * slope));
            if(xSlope) {
                x += dx < 0 && dy < 0 ? step * -1 : step;
                y += dx < 0 && dy < 0 ? slope * step * -1 : slope * step;
            }
            else {
                x += dx < 0 && dy < 0 ? slope * step * -1 : slope * step;
                y += dx < 0 && dy < 0 ? step * -1 : step;
            }
            context[draw ? 'lineTo' : 'moveTo'](x, y);
            distRemaining -= dashLength;
            draw = !draw;
        }

        context.moveTo(x2, y2)
    }
};

// extend Shape
Kinetic.GlobalObject.extend(Kinetic.Line, Kinetic.Shape);

///////////////////////////////////////////////////////////////////////
//  SVG Path
///////////////////////////////////////////////////////////////////////
/**
 * Path constructor.  This shape was inspired by jfollas's
 *  SVG Path plugin
 * @constructor
 * @augments Kinetic.Shape
 * @param {Object} config
 */
Kinetic.Path = function(config) {
    this.shapeType = "Path";
    this.commandsArray = [];

    config.drawFunc = function() {
        var context = this.getContext();
        var ca = this.commandsArray;
        // context position
        context.beginPath();
        for(var n = 0; n < ca.length; n++) {
            var c = ca[n].command;
            var p = ca[n].points;
            switch(c) {
                case 'L':
                    context.lineTo(p[0], p[1]);
                    break;
                case 'M':
                    context.moveTo(p[0], p[1]);
                    break;
                case 'z':
                    context.closePath();
                    break;
            }
        }
        this.fill();
        this.stroke();
    };
    // call super constructor
    Kinetic.Shape.apply(this, [config]);

    this.commandsArray = this.getCommandsArray();
};
/*
 * Path methods
 */
Kinetic.Path.prototype = {
    /**
     * get parsed commands array from the commands
     *  string.  V, v, H, h, and l commands are converted to
     *  L commands for the purpose of high performance Path
     *  rendering
     */
    getCommandsArray: function() {
        // command string
        var cs = this.attrs.commands;
        // command chars
        var cc = ['M', 'l', 'L', 'v', 'V', 'h', 'H', 'z'];
        // convert white spaces to commas
        cs = cs.replace(new RegExp(' ', 'g'), ',');
        // create pipes so that we can split the commands
        for(var n = 0; n < cc.length; n++) {
            cs = cs.replace(new RegExp(cc[n], 'g'), '|' + cc[n]);
        }
        // create array
        var arr = cs.split('|');
        var ca = [];
        // init context point
        var cpx = 0;
        var cpy = 0;
        for(var n = 1; n < arr.length; n++) {
            var str = arr[n];
            var c = str.charAt(0);
            str = str.slice(1);
            // remove ,- for consistency
            str = str.replace(new RegExp(',-', 'g'), '-');
            // add commas so that it's easy to split
            str = str.replace(new RegExp('-', 'g'), ',-');
            var p = str.split(',');
            if(p.length > 0 && p[0] === '') {
                p.shift();
            }
            // convert strings to floats
            for(var i = 0; i < p.length; i++) {
                p[i] = parseFloat(p[i]);
            }
            // convert l, H, h, V, and v to L
            switch(c) {
                case 'M':
                    cpx = p[0];
                    cpy = p[1];
                    break;
                case 'l':
                    cpx += p[0];
                    cpy += p[1];
                    break;
                case 'L':
                    cpx = p[0];
                    cpy = p[1];
                    break;
                case 'h':
                    cpx += p[0];
                    break;
                case 'H':
                    cpx = p[0];
                    break;
                case 'v':
                    cpy += p[0];
                    break;
                case 'V':
                    cpy = p[0];
                    break;
            }
            // reassign command
            if(c == 'l' || c == 'V' || c == 'v' || c == 'H' || c == 'h') {
                c = 'L';
                p[0] = cpx;
                p[1] = cpy;
            }
            ca.push({
                command: c,
                points: p
            });
        }
        return ca;
    },
    /**
     * get SVG path commands string
     */
    getCommands: function() {
        return this.attrs.commands;
    },
    /**
     * set SVG path commands string.  This method
     *  also automatically parses the commands string
     *  into a commands array.  Currently supported SVG commands:
     *  M, L, l, H, h, V, v, z
     * @param {String} SVG path command string
     */
    setCommands: function(commands) {
        this.attrs.commands = commands;
        this.commandsArray = this.getCommandsArray();
    }
};

// extend Shape
Kinetic.GlobalObject.extend(Kinetic.Path, Kinetic.Shape);

/*
* Last updated November 2011
* By Simon Sarris
* www.simonsarris.com
* sarris@acm.org
*
* Free to use and distribute at will
* So long as you are nice to people, etc
*/

/*
* The usage of this class was inspired by some of the work done by a forked
* project, KineticJS-Ext by Wappworks, which is based on Simon's Transform
* class.
*/

/**
 * Matrix object
 */
Kinetic.Transform = function() {
    this.m = [1, 0, 0, 1, 0, 0];
}

Kinetic.Transform.prototype = {
    /**
     * Apply translation
     * @param {Number} x
     * @param {Number} y
     */
    translate: function(x, y) {
        this.m[4] += this.m[0] * x + this.m[2] * y;
        this.m[5] += this.m[1] * x + this.m[3] * y;
    },
    /**
     * Apply scale
     * @param {Number} sx
     * @param {Number} sy
     */
    scale: function(sx, sy) {
        this.m[0] *= sx;
        this.m[1] *= sx;
        this.m[2] *= sy;
        this.m[3] *= sy;
    },
    /**
     * Apply rotation
     * @param {Number} rad  Angle in radians
     */
    rotate: function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        var m11 = this.m[0] * c + this.m[2] * s;
        var m12 = this.m[1] * c + this.m[3] * s;
        var m21 = this.m[0] * -s + this.m[2] * c;
        var m22 = this.m[1] * -s + this.m[3] * c;
        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
    },
    /**
     * Returns the translation
     * @returns {Object} 2D point(x, y)
     */
    getTranslation: function() {
        return {
            x: this.m[4],
            y: this.m[5]
        };
    },
    /**
     * Transform multiplication
     * @param {Kinetic.Transform} matrix
     */
    multiply: function(matrix) {
        var m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
        var m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];

        var m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
        var m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

        var dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
        var dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];

        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
        this.m[4] = dx;
        this.m[5] = dy;
    },
    /**
     * Invert the matrix
     */
    invert: function() {
        var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
        var m0 = this.m[3] * d;
        var m1 = -this.m[1] * d;
        var m2 = -this.m[2] * d;
        var m3 = this.m[0] * d;
        var m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
        var m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
        this.m[0] = m0;
        this.m[1] = m1;
        this.m[2] = m2;
        this.m[3] = m3;
        this.m[4] = m4;
        this.m[5] = m5;
    },
    /**
     * return matrix
     */
    getMatrix: function() {
        return this.m;
    }
};

/*
* The Tween class was ported from an Adobe Flash Tween library
* to JavaScript by Xaric.  In the context of KineticJS, a Tween is
* an animation of a single Node property.  A Transition is a set of
* multiple tweens
*/

/**
 * Transition constructor.  KineticJS transitions contain
 * multiple Tweens
 */
Kinetic.Transition = function(node, config) {
    this.node = node;
    this.config = config;
    this.tweens = [];
    var that = this;

    // add tween for each property
    function addTween(c, attrs) {
        for(var key in c) {
            if(key !== 'duration' && key !== 'easing' && key !== 'callback') {
                // if val is an object then traverse
                if(Kinetic.GlobalObject._isObject(c[key])) {
                   addTween(c[key], attrs[key]); 
                }
                else {
                    that.add(that._getTween(attrs, key, c[key]));
                }
            }
        }
    }
    
    addTween(config, node.attrs);
    
    var finishedTweens = 0;
    var that = this;
    for(var n = 0; n < this.tweens.length; n++) {
        var tween = this.tweens[n];
        tween.onFinished = function() {
            finishedTweens++;
            if(finishedTweens >= that.tweens.length) {
                that.onFinished();
            }
        };
    }
};
/*
 * Transition methods
 */
Kinetic.Transition.prototype = {
    /**
     * add tween to tweens array
     * @param {Kinetic.Tween} tween
     */
    add: function(tween) {
        this.tweens.push(tween);
    },
    /**
     * start transition
     */
    start: function() {
        for(var n = 0; n < this.tweens.length; n++) {
            this.tweens[n].start();
        }
    },
    /**
     * onEnterFrame
     */
    onEnterFrame: function() {
        for(var n = 0; n < this.tweens.length; n++) {
            this.tweens[n].onEnterFrame();
        }
    },
    /**
     * stop transition
     */
    stop: function() {
        for(var n = 0; n < this.tweens.length; n++) {
            this.tweens[n].stop();
        }
    },
    /**
     * resume transition
     */
    resume: function() {
        for(var n = 0; n < this.tweens.length; n++) {
            this.tweens[n].resume();
        }
    },
    _getTween: function(key, prop, val) {
        var config = this.config;
        var node = this.node;
        var easing = config.easing;
        if(easing === undefined) {
            easing = 'linear';
        }

        var tween = new Kinetic.Tween(node, function(i) {
            key[prop] = i;
        }, Kinetic.Tweens[easing], key[prop], val, config.duration);

        return tween;
    }
};

/**
 * Tween constructor
 */
Kinetic.Tween = function(obj, propFunc, func, begin, finish, duration) {
    this._listeners = [];
    this.addListener(this);
    this.obj = obj;
    this.propFunc = propFunc;
    this.begin = begin;
    this._pos = begin;
    this.setDuration(duration);
    this.isPlaying = false;
    this._change = 0;
    this.prevTime = 0;
    this.prevPos = 0;
    this.looping = false;
    this._time = 0;
    this._position = 0;
    this._startTime = 0;
    this._finish = 0;
    this.name = '';
    this.func = func;
    this.setFinish(finish);
};
/*
 * Tween methods
 */
Kinetic.Tween.prototype = {
    setTime: function(t) {
        this.prevTime = this._time;
        if(t > this.getDuration()) {
            if(this.looping) {
                this.rewind(t - this._duration);
                this.update();
                this.broadcastMessage('onLooped', {
                    target: this,
                    type: 'onLooped'
                });
            }
            else {
                this._time = this._duration;
                this.update();
                this.stop();
                this.broadcastMessage('onFinished', {
                    target: this,
                    type: 'onFinished'
                });
            }
        }
        else if(t < 0) {
            this.rewind();
            this.update();
        }
        else {
            this._time = t;
            this.update();
        }
    },
    getTime: function() {
        return this._time;
    },
    setDuration: function(d) {
        this._duration = (d === null || d <= 0) ? 100000 : d;
    },
    getDuration: function() {
        return this._duration;
    },
    setPosition: function(p) {
        this.prevPos = this._pos;
        //var a = this.suffixe != '' ? this.suffixe : '';
        this.propFunc(p);
        //+ a;
        //this.obj(Math.round(p));
        this._pos = p;
        this.broadcastMessage('onChanged', {
            target: this,
            type: 'onChanged'
        });
    },
    getPosition: function(t) {
        if(t === undefined) {
            t = this._time;
        }
        return this.func(t, this.begin, this._change, this._duration);
    },
    setFinish: function(f) {
        this._change = f - this.begin;
    },
    getFinish: function() {
        return this.begin + this._change;
    },
    start: function() {
        this.rewind();
        this.startEnterFrame();
        this.broadcastMessage('onStarted', {
            target: this,
            type: 'onStarted'
        });
    },
    rewind: function(t) {
        this.stop();
        this._time = (t === undefined) ? 0 : t;
        this.fixTime();
        this.update();
    },
    fforward: function() {
        this._time = this._duration;
        this.fixTime();
        this.update();
    },
    update: function() {
        this.setPosition(this.getPosition(this._time));
    },
    startEnterFrame: function() {
        this.stopEnterFrame();
        this.isPlaying = true;
        this.onEnterFrame();
    },
    onEnterFrame: function() {
        if(this.isPlaying) {
            this.nextFrame();
        }
    },
    nextFrame: function() {
        this.setTime((this.getTimer() - this._startTime) / 1000);
    },
    stop: function() {
        this.stopEnterFrame();
        this.broadcastMessage('onStopped', {
            target: this,
            type: 'onStopped'
        });
    },
    stopEnterFrame: function() {
        this.isPlaying = false;
    },
    continueTo: function(finish, duration) {
        this.begin = this._pos;
        this.setFinish(finish);
        if(this._duration != undefined)
            this.setDuration(duration);
        this.start();
    },
    resume: function() {
        this.fixTime();
        this.startEnterFrame();
        this.broadcastMessage('onResumed', {
            target: this,
            type: 'onResumed'
        });
    },
    yoyo: function() {
        this.continueTo(this.begin, this._time);
    },
    addListener: function(o) {
        this.removeListener(o);
        return this._listeners.push(o);
    },
    removeListener: function(o) {
        var a = this._listeners;
        var i = a.length;
        while(i--) {
            if(a[i] == o) {
                a.splice(i, 1);
                return true;
            }
        }
        return false;
    },
    broadcastMessage: function() {
        var arr = [];
        for(var i = 0; i < arguments.length; i++) {
            arr.push(arguments[i]);
        }
        var e = arr.shift();
        var a = this._listeners;
        var l = a.length;
        for(var i = 0; i < l; i++) {
            if(a[i][e]) {
                a[i][e].apply(a[i], arr);
            }
        }
    },
    fixTime: function() {
        this._startTime = this.getTimer() - this._time * 1000;
    },
    getTimer: function() {
        return new Date().getTime() - this._time;
    }
};

Kinetic.Tweens = {
    'back-ease-in': function(t, b, c, d, a, p) {
        var s = 1.70158;
        return c * (t /= d) * t * ((s + 1) * t - s) + b;
    },
    'back-ease-out': function(t, b, c, d, a, p) {
        var s = 1.70158;
        return c * (( t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    },
    'back-ease-in-out': function(t, b, c, d, a, p) {
        var s = 1.70158;
        if((t /= d / 2) < 1) {
            return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
        }
        return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
    },
    'elastic-ease-in': function(t, b, c, d, a, p) {
        // added s = 0
        var s = 0;
        if(t === 0) {
            return b;
        }
        if((t /= d) == 1) {
            return b + c;
        }
        if(!p) {
            p = d * 0.3;
        }
        if(!a || a < Math.abs(c)) {
            a = c;
            s = p / 4;
        }
        else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    },
    'elastic-ease-out': function(t, b, c, d, a, p) {
        // added s = 0
        var s = 0;
        if(t === 0) {
            return b;
        }
        if((t /= d) == 1) {
            return b + c;
        }
        if(!p) {
            p = d * 0.3;
        }
        if(!a || a < Math.abs(c)) {
            a = c;
            s = p / 4;
        }
        else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
    },
    'elastic-ease-in-out': function(t, b, c, d, a, p) {
        // added s = 0
        var s = 0;
        if(t === 0) {
            return b;
        }
        if((t /= d / 2) == 2) {
            return b + c;
        }
        if(!p) {
            p = d * (0.3 * 1.5);
        }
        if(!a || a < Math.abs(c)) {
            a = c;
            s = p / 4;
        }
        else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        if(t < 1) {
            return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        }
        return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
    },
    'bounce-ease-out': function(t, b, c, d) {
        if((t /= d) < (1 / 2.75)) {
            return c * (7.5625 * t * t) + b;
        }
        else if(t < (2 / 2.75)) {
            return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;
        }
        else if(t < (2.5 / 2.75)) {
            return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;
        }
        else {
            return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b;
        }
    },
    'bounce-ease-in': function(t, b, c, d) {
        return c - Kinetic.Tweens['bounce-ease-out'](d - t, 0, c, d) + b;
    },
    'bounce-ease-in-out': function(t, b, c, d) {
        if(t < d / 2) {
            return Kinetic.Tweens['bounce-ease-in'](t * 2, 0, c, d) * 0.5 + b;
        }
        else {
            return Kinetic.Tweens['bounce-ease-out'](t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
        }
    },
    // duplicate
    /*
     strongEaseInOut: function(t, b, c, d) {
     return c * (t /= d) * t * t * t * t + b;
     },
     */
    'ease-in': function(t, b, c, d) {
        return c * (t /= d) * t + b;
    },
    'ease-out': function(t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    },
    'ease-in-out': function(t, b, c, d) {
        if((t /= d / 2) < 1) {
            return c / 2 * t * t + b;
        }
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    },
    'strong-ease-in': function(t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b;
    },
    'strong-ease-out': function(t, b, c, d) {
        return c * (( t = t / d - 1) * t * t * t * t + 1) + b;
    },
    'strong-ease-in-out': function(t, b, c, d) {
        if((t /= d / 2) < 1) {
            return c / 2 * t * t * t * t * t + b;
        }
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    },
    'linear': function(t, b, c, d) {
        return c * t / d + b;
    },
};

