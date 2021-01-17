import { PolymerElement } from '@polymer/polymer/polymer-element.js';
/**
 * `<prism-event-bus>` is a [Polymer 2](http://polymer-project.org/) element provides compact event bus that simplifies communication between elements.
 * 
 * # Usage
 * 
 * Register element
 *
 * ```javascript
 * // Register element with all event types
 * PrismEventBus.register(this);
 * // Register element with scoped types
 * PrismEventBus.register(this, ['talk', 'walk']);
 * ```
 *
 * Then post event anywhere
 *
 * ```html
 * PrismEventBus.post(new CustomEvent('talk', {
 *     bubbles: false,
 *     composed: true,
 *     detail: {
 *         text: `Hello, World`
 *     }
 * }));
 * ```
 *
 * @memberof Prhythm
 * @element prism-event-bus
 * @customElement
 * @polymer
 * @demo demo/index.html Demo
 */
export class PrismEventBus extends PolymerElement {

    static get is() { return 'prism-event-bus'; }

    static get properties() {
        return {
            /**
             * Name of event bus
             */
            name: {
                type: String,
                reflectToAttribute: true
            },

            /**
             * Registered subscribers
             */
            subscribers: {
                type: Array,
                value: () => { return []; }
            }
        };
    }

    /**
     * Dispatch event to registered subscribers
     * 
     * @param {Event} event Event
     * @param {String} name Name of bus instance
     * @return {Void}
     */
    static post(event, name) {
        if (name) {
            let bus = PrismEventBus.getInstance(name);
            if (bus) {
                bus.emit(event);
            } else {
                console.debug(`[${PrismEventBus.is}] instance '${name}' not found`);
            }
        } else {
            Array.prototype.forEach.call(document.querySelectorAll(PrismEventBus.is), bus => {
                bus.emit(event);
            })
        }
    }

    /**
     * Dispatch event to registered subscribers, only allowed when event scope is sepecified
     * 
     * @param {Event} event Event
     * @param {String} name Name of bus instance
     * @return {Void}
     */
    static postDelayed(event, name) {
        if (name) {
            let bus = PrismEventBus.getInstance(name, true);
            if (bus) {
                bus.queue(event);
            }
        } else {
            // Create default if not exists
            PrismEventBus.getInstance('default', true);
            Array.prototype.forEach.call(document.querySelectorAll(PrismEventBus.is), bus => {
                bus.queue(event);
            })
        }
    }

    /**
     * Register an element as subscriber
     *
     * @param {HTMLElement} element Subscriber
     * @param {Array} types Available event types
     * @param {String} name Event bus target, 'default' if not sepecified
     * @return {Void}
     */
    static register(element, types, name = 'default') {
        if (!element || !element.dispatchEvent) return;
        if (!types || types.constructor !== Array) types = [];

        // Get bus instance or create if not exists
        let bus = PrismEventBus.getInstance(name, true);

        bus.addSubscriber(element, types);
    }

    /**
     * Unregister a subscriber
     *
     * @param {HTMLElement} element
     * @param {Array} types Types to be remove
     * @param {String} name Event bus target, 'default' if not sepecified
     * @return {Void}
     */
    static unregister(element, types, name = 'default') {
        if (!element || !element.dispatchEvent) return;
        if (!types || types.constructor !== Array) types = [];

        // Get bus instance or create if not exists
        let bus = PrismEventBus.getInstance(name);

        if (bus) {
            bus.removeSubcriber(element, types);
        }
    }

    /**
     * Get bus instance or create if not exists
     * 
     * @param {String} name Event bus target, 'default' if not sepecified
     * @param {Boolean} init Create instance when not exists
     * @return {HTMLElement} PrismEventBus instance
     */
    static getInstance(name = 'default', init = false) {
        let bus = document.querySelector(`${PrismEventBus.is}[name=${name}]`);
        if (!bus && init) {
            bus = document.createElement(PrismEventBus.is);
            bus.name = name;
            document.body.appendChild(bus);
        }
        return bus;
    }

    /**
     * Add subscriber or append event types
     *
     * @param {HTMLElement} element Subscriber
     * @param {Array} types Available event type
     * @return {Void}
     */
    addSubscriber(element, types) {
        if (!element || !element.dispatchEvent) return;
        if (!types || types.constructor !== Array) types = [];

        // Find registered subscriber
        let subscriber = this.subscribers.find(item => item.target === element);
        if (subscriber) {
            let union = this._union(subscriber.types, types);
            if (union.length > subscriber.types.length) {
                // Append new event type if types is added
                subscriber.types = union;
                console.debug(`[${PrismEventBus.is}] event ${types} of ${element.tagName} is registered`);
                // poll event queue for new event types
                this._poll(element, types)
            }
        } else {
            // No registered subscriber found, register new one
            this.set('subscribers', [{ target: element, types: types }].concat(this.subscribers));
            console.debug(`[${PrismEventBus.is}] event ${types} of ${element.tagName} is registered`);
            // poll event queue for new subscriber
            this._poll(element, types);
        }
    }

    /**
     * Remove subscriber or remove event types
     *
     * @param {HTMLElement} element Subscriber
     * @param {Array} types Types to be remove
     * @return {Void}
     */
    removeSubcriber(element, types) {
        if (!element || !element.dispatchEvent) return;
        if (!types || types.constructor !== Array) types = [];

        // Find registered subscriber
        let subscriber = this.subscribers.find(item => item.target === element);
        if (subscriber) {
            if (types.length === 0) {
                // Remove subscriber when types is empty
                this.set('subscribers', Array.from(this.subscribers.filter(item => {
                    return item.target !== element;
                })));
                console.debug(`[${PrismEventBus.is}] ${element.tagName} is unregistered`)

                // Remove instance if no subscribers
                if (this.subscribers.length === 0) {
                    this.parentElement.removeChild(this);
                    console.debug(`[${PrismEventBus.is}] instance '${this.name}' is destroyed`)
                }
            } else {
                // Remove event types
                let difference = this._difference(subscriber.types, types);
                if (subscriber.types.length > 0 && difference.length === 0) {
                    // No active event type, also remove subscriber
                    this.removeSubcriber(element);
                } else {
                    // Unregister types
                    subscriber.types = difference;
                    console.debug(`[${PrismEventBus.is}] event ${types} of ${element.tagName} is unregistered`)
                }
            }
        }
    }

    /**
     * Merge as set
     *
     * @param {Array} sources
     * @param {Array} targets
     * @return {Array} 
     */
    _union(sources = [], targets = []) {
        let temp = {};
        sources.forEach(item => {
            temp[item] = true;
        });
        targets.forEach(item => {
            temp[item] = true;
        });
        return Object.keys(temp);
    }

    /**
     * Difference values
     *
     * @param {Array} sources
     * @param {Array} targets
     * @return {Array} 
     */
    _difference(sources = [], targets = []) {
        let temp = {};
        sources.forEach(item => {
            temp[item] = true;
        });
        targets.forEach(item => {
            if (item in temp) {
                delete temp[item];
            }
        });
        return Object.keys(temp);
    }

    /**
     * Dequeue events and dispatch if type is matched
     *
     * @param {HTMLElement} element Subscriber
     * @param {Array} types Types
     * @return {Void}
     */
    _poll(element, types) {
        types.forEach(type => {
            let queuedEvents = this._dequeue(type);
            queuedEvents.forEach(event => {
                console.debug(`[${PrismEventBus.is}] dispatch '${event.type}' event via ${element.tagName}`);
                element.dispatchEvent(event);
            });
        });
    }

    /**
     * Enueue event if no subscriber is matched
     *
     * @param {Event} event Post event
     * @return {Void}
     */
    queue(event) {
        // Emit firstly
        if (this.emit(event, true) === 0) {
            // Enqueue if no dispatched
            this._enqueue(event);
        }
    }

    /**
     * Enqueue new event
     *
     * @param {Event} event Post event
     * @return {Void}
     */
    _enqueue(event) {
        let buffer = this.buffer || {};
        let items = buffer[event.type] || []
        items.push(event);
        buffer[event.type] = items;
        this.buffer = buffer;
    }

    /**
     * Dequeue events of type
     *
     * @param {String} type Event type
     * @return {Array} Events
     */
    _dequeue(type) {
        let buffer = this.buffer || {}
        if (type in buffer) {
            let items = buffer[type] || [];
            delete buffer[type];
            return items;
        }
        return [];
    }

    /**
     * Dispatch event to registered subscribers
     * 
     * @param {Event} event Event
     * @param {Boolean} restricted Allows only if types is defined
     * @return {Number} Dispatched counts
     */
    emit(event, restricted = false) {
        let count = 0;
        this.subscribers.forEach(item => {
            let types = item.types;
            // Restricted only event type is defined
            if ((!restricted && (!types || types.length === 0)) || types.indexOf(event.type) > -1) {
                console.debug(`[${PrismEventBus.is}] dispatch '${event.type}' event via ${item.target.tagName}`);
                item.target.dispatchEvent(event);
                count++;
            }
        });
        return count;
    }
}

customElements.define(PrismEventBus.is, PrismEventBus);
//export PrismEventBus