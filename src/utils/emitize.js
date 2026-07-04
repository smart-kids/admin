export default function emitize(obj, eventName) {
    let _subscriptions = new Set();
    Object.defineProperty(obj, eventName, {
        set(func) {
            _subscriptions.add(func);
        },
        get() {
            var emit = (...args) => {
                _subscriptions.forEach(f => f(...args));
            };

            Object.defineProperty(emit, "off", {
                set(func) {
                    _subscriptions.delete(func);
                },
                get() {
                    _subscriptions = new Set();
                    return true;
                }
            });

            return emit;
        }
    });
}