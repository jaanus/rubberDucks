$(function() {
    // Document is ready
    // State machine
    // 0 - no finger
    // 1 - moving, not locked to target bar
    // 2 - locked to target bar, initial delay
    // 3 - locked to target bar, transfer in progress
    var state = 0;

    // Index to dynamically insert keyframe specs in stylesheet for dynamic animations.
    var keyframeStyleIndex = 0;

    // Start and end touch locations.
    var startX,
    startY,
    endX,
    endY;

    // Data source indexes to get/set correct duck balances.
    var sourceIndex,
    targetIndex;

    var maxDucksInBox = 100;

    // Timers to start the function
    var timerDelayer;

    // Data source, duck balances per box.
    var ducks = [{
        'ducks': 70,
    },
    {
        'ducks': 30,
    },
    {
        'ducks': 80,
    }];

    // Set correct balance text and width for each bar. The widths change smoothly due to a CSS transition being set on the bar.
    function renderDucks() {
        for (var i = 0; i < ducks.length; i++) {
            $(".duck" + i + " .balance").text(ducks[i].ducks);

            var ratio = ducks[i].ducks / maxDucksInBox;
            var intPercent = parseInt(ratio * 100);
            if (intPercent > 100) {
                intPercent = 100;
            }

            $(".duck" + i + " .bar").css("width", intPercent + "%");

        }
    }

    // If timeout was reached while finger was sitting in a box for 200ms, start the transfer.
    function startTransfer() {
        if (state == 2) {
            state = 3;
            timerDelayer = setTimeout(runTransfer, 50);
        }
    }

    function runTransfer() {

        // If the balances are OK, run one iteration.
        if ((ducks[sourceIndex].ducks > 0) && (ducks[targetIndex].ducks < maxDucksInBox)) {
            ducks[sourceIndex].ducks -= 1;
            ducks[targetIndex].ducks += 1;

            // Render new balances and bar widths.
            renderDucks();

            // Create a new image element, put it in DOM, get the calculated size.
            var img = $('<img src="rubberDuck.png" alt="rubber duck" class="rubberDuck"></img>');
            $(".container").append(img);
            var imgWidth = img.width();
            var imgHeight = img.height();

            // Insert a new animation at end of stylesheet. This looks like the most straightforward way of implementing dynamic keyframes.
            // I found the technique in http://stackoverflow.com/questions/2495829/dynamically-modify-webkit-animation-with-javascript
            // This thread contains a link to a Webkit commit that seems to be about dynamically editing keyframes, but the code looks messy.
            var lastSheet = document.styleSheets[document.styleSheets.length - 1];
            newName = "duckMoverKeyframes" + keyframeStyleIndex;
            keyframeStyleIndex++;

            // Insert keyframes to move the duck around, and fade it out at the end of the transition.
            lastSheet.insertRule("@-webkit-keyframes " + newName + " { from { top: " + (startY - imgHeight) + "px; left: " + (startX - imgWidth) + "px; opacity:0; } " +
            "5% { top: " + (startY - imgHeight) + "px; left: " + (startX - imgWidth) + "px; opacity:1; } " +
            "80% { top: " + (endY - 80 - imgHeight) + "px; left: " + (endX - imgWidth - 80) + "px; opacity:1; } " +
            " to {top: " + (endY - imgHeight) + "px; left: " + (endX - imgWidth) + "px; opacity:0;} }", lastSheet.cssRules.length);

            // Add the animation style and class. Together, these start the animation.
            img[0].style.webkitAnimationName = newName;
            img.addClass("duckMover");

            // If we are still in the transfer state, schedule another iteration of the transfer.
            if (state == 3) {
                timerDelayer = setTimeout(runTransfer, 50);
            }
        }

    }

    // Attach gesture recognizer to each bar container for scaling and rotation.
    $(".barContainer").each(function() {

        // Should properly capture start scale and rotation, currently these resets with each gesture.
        this.addEventListener('gesturechange',
        function(e) {
            e.preventDefault();
            
            // Only change the style if the target element is the bar container. This means that at least one of your fingers must be on the white background part of the bar container that’s not covered by
            // the green bar, to activate the gesture.
            if ($(e.target).hasClass("barContainer")) {
                e.target.style.webkitTransform = 'scale(' + e.scale + ') rotate(' + e.rotation + 'deg)';
            }
        });
    });

    $(".bar").each(function() {

        // Do event binding through the DOM API. jQuery binding does not seem to carry through the touch properties of the event.
        this.addEventListener('touchstart', function(e) {

            if (e.touches.length == 1) {
                
                // Reset the styles of the bars when starting a touch.
                $(".bar").removeClass("sourceBarEnd targetBarEnd");
                $(this).removeClass("sourceBarEnd").addClass("sourceBar");
                state = 1;

                // Remember event location, so we could use these in animation during the transfer.
                startX = e.touches[0].pageX;
                startY = e.touches[0].pageY;

                // Remember which bar was tapped on.
                for (var i = 0; i < ducks.length; i++) {
                    if ($(this).parent().hasClass("duck" + i)) {
                        sourceIndex = i;
                    }
                }

                e.preventDefault();

            }

        });


        this.addEventListener('touchend', function(e) {

            $(this).removeClass("sourceBar").addClass("sourceBarEnd");
            $(".targetBar").removeClass("targetBar").addClass("targetBarEnd");

            state = 0;
            clearTimeout(timerDelayer);

            e.preventDefault();


        });

    });

    // Add listener to container DOM node. We will use elementFromPoint to figure out the element that the finger is currently over.
    $(".container")[0].addEventListener('touchmove', function(e) {

        if (e.touches.length == 1) {

            // Remember coordinates for animation.
            endX = e.touches[0].pageX;
            endY = e.touches[0].pageY;
            
            var el = $(document.elementFromPoint(endX, endY));
            
            // Since elementFromPoint only returns the topmost element, we must do this sort of test/remapping, so if we happen to be over the text element in the box,
            // we still pretend that we’re interacting with the box.
            if (el.hasClass("balance")) {
                trueEl = el.parent();
            } else {
                trueEl = el;
            }

            // If we are over a bar…
            if (trueEl.hasClass("bar")) {
                
                // … and it is not already configured as the target bar, neither is it where we started …
                if (!trueEl.hasClass("targetBar") && !trueEl.hasClass("sourceBar")) {
                    
                    // … then, set the current bar to be the target bar.
                    trueEl.removeClass("targetBarEnd").addClass("targetBar");
                    
                    // If we were in the state of waiting to transfer… 
                    if (state == 1) {
                        
                        // … then, set the state machine into a "locked to target bar" state.
                        state = 2;
                        
                        // Since finger may be hovering over intermediate boxes to reach the target box,
                        // we use a 200ms delay from locking to actually start the transfer.
                        timerDelayer = setTimeout(startTransfer, 200);

                        // Remember the data source index that matches the currently selected box.
                        for (var i = 0; i < ducks.length; i++) {
                            if (trueEl.parent().hasClass("duck" + i)) {
                                targetIndex = i;
                            }
                        }

                    }
                }
                
            // If we are not over a target bar, it may mean we may have animated away from a target bar. Run the "target bar end" animation if there were any target bars.
            } else {
                $(".targetBar").removeClass("targetBar").addClass("targetBarEnd");
                state = 1;
                clearTimeout(timerDelayer);
            }

            e.preventDefault();

        }

    });

    // Render the duck bars once at the start of the app.
    renderDucks();

});