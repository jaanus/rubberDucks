A simple CSS3/Webkit + touch events demo that uses the following techniques:

* Touch events for starting/stopping actions
* Gesture events for rotating/scaling elements
* Delayed activation of an action to let the user drag through intermediate elements to reach the desired target element
* A simple state machine to manage the app state
* Detecting/remapping the desired target element from a touch location with getElementFromPoint DOM API
* Webkit transitions with simple CSS rules
* Webkit animation with CSS keyframes
* Dynamic CSS animation keyframe insertion
* Programmatically inserting DOM elements and applying CSS animations to them at runtime

It has been tested on iOS on iPhone and iPad with iOS 4. It may work on other Webkit devices (Android), though I’m not sure if they implement all the touch/gesture events which may be Safari-specific. It does not work on mouse+computer.

See <http://jaanus.com> for more info.