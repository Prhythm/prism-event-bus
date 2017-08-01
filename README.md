# \<prism-event-bus\>

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/Prhythm/prism-event-bus)

`<prism-event-bus>` is a [Polymer 2](http://polymer-project.org/) element provides compact event bus that simplifies communication between elements.

# Usage

Register element

```javascript
// Register element with all event types
PrismEventBus.register(this);
// Register element with scoped types
PrismEventBus.register(this, ['talk', 'walk']);

// Unregister element if destroied or something
PrismEventBus.unregister(this);
// Remove registered event type
PrismEventBus.unregister(this, ['walk']);
```

Then post event anywhere

```html
// Post immediately
PrismEventBus.post(new CustomEvent('talk', {
    bubbles: false,
    composed: true,
    detail: {
        text: `Hello, World`
    }
}));

// Or post if element will be registered later
PrismEventBus.postDelayed(new CustomEvent('talk', {
    bubbles: false,
    composed: true,
    detail: {
        text: `Hello, World`
    }
}));
```

# Licence

MIT Licence