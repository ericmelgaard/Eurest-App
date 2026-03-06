// Nutrition overlay logic and event handlers
function removeNutritionOverlay() {
    var $overlay = $('.nutrition-label-overlay');
    if ($overlay.length) {
        $overlay.fadeOut(200, function () {
            $(this).remove();
        });
    }
    if (window.nutritionLabelTimeout) {
        clearTimeout(window.nutritionLabelTimeout);
        window.nutritionLabelTimeout = null;
    }
}

function setupNutritionOverlayHandlers(nutritionLabelTemplate) {
    // Attach overlay open/close/hover handlers
    $(document).off('click.menuNutritionGlobal').on('click.menuNutritionGlobal', '.item-wrapper', function (e) {
        e.stopPropagation();
        removeNutritionOverlay();
        var nutritionData = $(this).data('nutrition');
        var labelHtml = Mustache.render(nutritionLabelTemplate, nutritionData);
        $('body').append(labelHtml);
        var $overlay = $('.nutrition-label-overlay');
        var x = 0, y = 0;
        if (e && e.pageX && e.pageY) {
            x = e.pageX;
            y = e.pageY;
        } else {
            var offset = $(this).offset();
            x = offset.left + $(this).outerWidth();
            y = offset.top;
        }
        var overlayWidth = $overlay.outerWidth();
        var overlayHeight = $overlay.outerHeight();
        var winWidth = $(window).width();
        var winHeight = $(window).height();
        // Adjust for body scale transform
        var scale = 1;
        var transform = document.body.style.transform;
        if (transform && transform.startsWith('scale(')) {
            scale = parseFloat(transform.replace('scale(', '').replace(')', '')) || 1;
        }
        x = x / scale;
        y = y / scale;
        overlayWidth = overlayWidth / scale;
        overlayHeight = overlayHeight / scale;
        winWidth = winWidth / scale;
        winHeight = winHeight / scale;
        if (x + overlayWidth > winWidth) x = winWidth - overlayWidth - 10;
        if (y + overlayHeight > winHeight) y = winHeight - overlayHeight - 10;
        $overlay.css({ position: 'absolute', left: x + 'px', top: y + 'px', zIndex: 9999, cursor: 'move' });
        // Make overlay draggable
        var isDragging = false;
        var dragOffsetX = 0, dragOffsetY = 0;
        $overlay.on('mousedown', function(e) {
            // Prevent drag if starting on the close button or its children
            if ($(e.target).closest('.close-nutrition-label').length) return;
            e.stopPropagation();
            isDragging = true;
            var offset = $overlay.offset();
            dragOffsetX = e.pageX - offset.left;
            dragOffsetY = e.pageY - offset.top;
            // Remove any previous handlers to avoid duplicates
            $(document).off('mousemove.nutritionDrag');
            // Mousemove handler (jQuery)
            $(document).on('mousemove.nutritionDrag', function(e2) {
                if (isDragging) {
                    var scale = 1;
                    var transform = document.body.style.transform;
                    if (transform && transform.startsWith('scale(')) {
                        scale = parseFloat(transform.replace('scale(', '').replace(')', '')) || 1;
                    }
                    var newX = (e2.pageX - dragOffsetX) / scale;
                    var newY = (e2.pageY - dragOffsetY) / scale;
                    $overlay.css({ left: newX + 'px', top: newY + 'px' });
                }
            });
            // Mouseup handler (native, always fires)
            function nutritionDragMouseUp(e2) {
                if (isDragging) {
                    isDragging = false;
                    $(document).off('mousemove.nutritionDrag');
                    window.removeEventListener('mouseup', nutritionDragMouseUp, true);
                }
            }
            window.addEventListener('mouseup', nutritionDragMouseUp, true);
        });

        // Touch support for draggable overlay
        $overlay.on('touchstart', function(e) {
            if (!e.originalEvent || !e.originalEvent.touches || e.originalEvent.touches.length !== 1) return;
            // Prevent drag if starting on the close button or its children
            if ($(e.target).closest('.close-nutrition-label').length) return;
            e.stopPropagation();
            isDragging = true;
            var touch = e.originalEvent.touches[0];
            var offset = $overlay.offset();
            dragOffsetX = touch.pageX - offset.left;
            dragOffsetY = touch.pageY - offset.top;
            // Remove any previous handlers to avoid duplicates
            $(document).off('touchmove.nutritionDrag');
            // Touchmove handler
            $(document).on('touchmove.nutritionDrag', function(e2) {
                if (isDragging && e2.originalEvent && e2.originalEvent.touches && e2.originalEvent.touches.length === 1) {
                    var scale = 1;
                    var transform = document.body.style.transform;
                    if (transform && transform.startsWith('scale(')) {
                        scale = parseFloat(transform.replace('scale(', '').replace(')', '')) || 1;
                    }
                    var touchMove = e2.originalEvent.touches[0];
                    var newX = (touchMove.pageX - dragOffsetX) / scale;
                    var newY = (touchMove.pageY - dragOffsetY) / scale;
                    $overlay.css({ left: newX + 'px', top: newY + 'px' });
                    // Prevent scrolling while dragging
                    e2.preventDefault();
                }
            });
            // Touchend handler (native, always fires)
            function nutritionDragTouchEnd(e2) {
                if (isDragging) {
                    isDragging = false;
                    $(document).off('touchmove.nutritionDrag');
                    window.removeEventListener('touchend', nutritionDragTouchEnd, true);
                }
            }
            window.addEventListener('touchend', nutritionDragTouchEnd, true);
        });
        // Prevent click-off from removing overlay when interacting with overlay
        $overlay.on('mousedown mouseup click', function(e) {
            e.stopPropagation();
        });
        if (window.nutritionLabelTimeout) {
            clearTimeout(window.nutritionLabelTimeout);
        }
        window.nutritionLabelTimeout = setTimeout(removeNutritionOverlay, 10000);
    });
    $(document).off('click.nutritionOff').on('click.nutritionOff', function (e) {
        // Prevent click-off if clicking inside overlay
        if (!$(e.target).closest('.nutrition-label-overlay, .nutrition-label').length) {
            removeNutritionOverlay();
        }
    });
    $(document).off('click.nutritionClose').on('click.nutritionClose', '.close-nutrition-label', function (e) {
        e.stopPropagation();
        removeNutritionOverlay();
    });
    $(document).off('mouseenter.nutritionLabel mouseleave.nutritionLabel').on('mouseenter.nutritionLabel', '.nutrition-label-overlay', function () {
        clearTimeout(window.nutritionLabelTimeout);
    }).on('mouseleave.nutritionLabel', '.nutrition-label-overlay', function () {
        window.nutritionLabelTimeout = setTimeout(removeNutritionOverlay, 10000);
    });
}
"use strict";
//***wandLib.js***
//Date: 05.30.2025
//Version: 60
//compare strings for match in percent
//stringSimilarity.compareTwoStrings({string}, {string}) >= .725
// rotate one or ore elements with settings
//rotate(ele, { delay: 100, cycle: 8000, fill: 'packed', transition: 'fade'});
//filling elements should be done with code like this$('.items-wrapper[dynamicFill="true"]') 
//  <div class="items-wrapper" dynamic-fill="true"></div>
//scale or expand asset on double click events.
//animateObserver()
//trm playing observer to send messages to trmAnimate in menulayout
//fit text space allowed
//textFit({string}) >> must be visable when called to calculate width/height
//polyfil includes() ++ > any more methods just ask
//document.clearAssetStorage
//document.refreshAsset
//clear storage and refresh asset
//resetSync()
//clear sync epochs on exit to allow fresh api calls in CF and dev
//releaseVideos()
//clear video tags on unload events so webos doesn't blow up..
//TRM playing observer
//Observer V2.0 
//Mine
// Options menu functionality
$(document).ready(function () {
    var cursorIdleTimeout;
    var cursorIdleDelay = 2000; // ms
    function showCursor() {
        document.body.style.cursor = '';
        clearTimeout(cursorIdleTimeout);
        cursorIdleTimeout = setTimeout(function () {
            document.body.style.cursor = 'none';
        }, cursorIdleDelay);
    }
    window.addEventListener('mousemove', showCursor);
    showCursor();
});
function setupOptionsMenu() {
    // Create dropdown menu
    var dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'options-dropdown';
    dropdownMenu.style.position = 'relative';
    if (!client) {
        dropdownMenu.innerHTML = "\n    <div class=\"dropdown-item\" data-action=\"refresh\">\n      <svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />\n      </svg>\n      <span>Refresh</span>\n    </div>\n    <div class=\"dropdown-item\" data-action=\"reset\">\n      <svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />\n      </svg>\n      <span>Reset</span>\n    </div>\n    <div class=\"dropdown-item\" data-action=\"rotate\">\n      <svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4\" />\n      </svg>\n      <span>Rotate</span>\n    </div>\n    <div class=\"dropdown-item\" data-action=\"expand\">\n      <svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5\" />\n      </svg>\n      <span>Expand</span>\n    </div>\n  ";
    }
    else {
        dropdownMenu.innerHTML = "\n    <div class=\"dropdown-item\" data-action=\"refresh\">\n      <svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />\n      </svg>\n      <span>Refresh</span>\n    </div>\n    <div class=\"dropdown-item\" data-action=\"reset\">\n      <svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />\n      </svg>\n      <span>Reset</span>\n    </div>\n  ";
    }
    // Create container for the options menu
    var optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container options-hidden';
    optionsContainer.appendChild(dropdownMenu);
    // Add to document
    document.body.appendChild(optionsContainer);
    // Track if custom menu is open
    var customMenuOpen = false;
    // Show custom menu at mouse position (viewport coordinates, unaffected by scale)
    function showCustomMenu(x, y) {
        // Get current scale from body transform
        var scale = 1;
        var transform = document.body.style.transform;
        if (transform && transform.startsWith('scale(')) {
            scale = parseFloat(transform.replace('scale(', '').replace(')', '')) || 1;
        }
        // Adjust coordinates for scale
        var left = x / scale;
        var top = y / scale;
        var menuWidth = optionsContainer.offsetWidth;
        var menuHeight = optionsContainer.offsetHeight;
        var viewportWidth = window.innerWidth / scale;
        var viewportHeight = window.innerHeight / scale;
        if (left + menuWidth > viewportWidth) {
            left = Math.max(viewportWidth - menuWidth, 0);
        }
        if (top + menuHeight > viewportHeight) {
            top = Math.max(viewportHeight - menuHeight, 0);
        }
        optionsContainer.style.position = 'fixed';
        optionsContainer.classList.remove('options-hidden');
        dropdownMenu.classList.add('show');
        optionsContainer.style.left = left + 'px';
        optionsContainer.style.top = top + 'px';
        customMenuOpen = true;
        document.body.style.cursor = '';
    }
    // Hide custom menu
    function hideCustomMenu() {
        optionsContainer.classList.add('options-hidden');
        dropdownMenu.classList.remove('show');
        customMenuOpen = false;
        document.body.style.cursor = '';
    }
    // Listen for right-click (contextmenu)
    document.addEventListener('contextmenu', function (e) {
        if (!customMenuOpen) {
            e.preventDefault();
            showCustomMenu(e.clientX, e.clientY);
        }
        else {
            // Hide custom menu and allow default context menu
            hideCustomMenu();
            // Let browser show default menu
        }
    });
    // Hide custom menu on click elsewhere
    document.addEventListener('click', function (e) {
        if (customMenuOpen && !optionsContainer.contains(e.target)) {
            hideCustomMenu();
        }
    });
    // Handle dropdown item clicks
    dropdownMenu.addEventListener('click', function (e) {
        var item = e.target.closest('.dropdown-item');
        if (!item)
            return;
        e.stopPropagation();
        var action = item.getAttribute('data-action');
        var windowToggleScale = new CustomEvent('windowToggleScale');
        switch (action) {
            case 'refresh':
                document.refreshAsset();
                break;
            case 'reset':
                document.clearAssetStorage();
                break;
            case 'rotate':
                assetRotation = assetRotation === 270 ? 0 : 270;
                rotateAsset('.asset-wrapper', assetRotation);
                break;
            case 'expand':
                window.dispatchEvent(windowToggleScale);
                break;
        }
        hideCustomMenu();
    });
    return {
        optionsContainer: optionsContainer,
        dropdownMenu: dropdownMenu
    };
}

function animateObserver() {
    if (!menuLayout.trmAnimate) {
        return;
    }
    if (!client) {
        //exit it not in client
        menuLayout.trmAnimate(true, true);
        document.isPlaying = function (playing) {
            menuLayout.trmAnimate(playing);
            return "Simulate playing(" + playing + ") event..";
        };
        return;
    }
    //allow client to start animations
    if (platform === "windows" || isCF) {
        var trmConfig = {
            attributes: true
        };
        var trmPlaying = "";
        var trmCallBack = function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === "attributes" && mutation.attributeName === "trm-playing") {
                    if (trmPlaying.getAttribute("trm-playing") === "false") {
                        menuLayout.trmAnimate(false);
                    }
                    if (trmPlaying.getAttribute("trm-playing") === "true") {
                        menuLayout.trmAnimate(true);
                    }
                }
            });
        };
        if (window.frameElement) {
            trmPlaying = (".zone-wrapper", self.frameElement.parentElement);
            //setup observer
            try {
                var trmObserver = new MutationObserver(trmCallBack);
                trmObserver.observe(trmPlaying, trmConfig);
            }
            catch (err) {
                console.log(err);
            }
        }
        //start initial animation
        menuLayout.trmAnimate(true, true);
        return;
    }
    if (platform === "webos" || platform === "chrome" || platform === "electron") {
        document.isPlaying = function (playing) {
            menuLayout.trmAnimate(playing);
        };
        //start initial animation
        menuLayout.trmAnimate(true, true);
    }
}
//scale to window size
var scale = 1; // Initial scale
var isScaled = true;
$(document).ready(function () {
    var outer = $("body");
    var wrapper = $("html");
    var maxWidth = $("body").width();
    var maxHeight = $("body").height();
    window.addEventListener("resize", resize);
    window.addEventListener("windowToggleScale", toggleScale);
    resize();
    function toggleScale(event) {
        if (isScaled) {
            window.removeEventListener("resize", resize);
            $("body").css("transform", "");
            scale = 1;
            isScaled = false;
            $("body").css("overflow", "visible");
        }
        else {
            window.addEventListener("resize", resize);
            resize();
            isScaled = true;
            $("body").css("overflow", "hidden");
        }
    }
    function resize() {
        outer = $("body");
        wrapper = $("html");
        maxWidth = $("body").width();
        maxHeight = $("body").height();
        var width = window.innerWidth;
        var height = window.innerHeight;
        scale = Math.min(width / maxWidth, height / maxHeight); // Update scale
        $(outer)[0].style.transform = 'scale(' + scale + ')';
    }
});
function rotateAsset(elm, deg) {
    // Get the computed style of the body
    var forceResize = new CustomEvent('resize');
    var bodyStyle = window.getComputedStyle(document.body);
    var bodyWidth = bodyStyle.width;
    var bodyHeight = bodyStyle.height;
    // Swap body height and width
    document.body.style.width = bodyHeight;
    document.body.style.height = bodyWidth;
    $(elm).css('margin-left', 0).css('margin-top', 0);
    $(".fallback-wrapper").css('margin-left', 0).css('margin-top', 0);
    //
    if (deg === 0 && isScaled) {
        $(elm).css('transform', 'rotate(' + deg + 'deg)');
        $(".fallback-wrapper").css('transform', 'rotate(' + deg + 'deg)');
        window.dispatchEvent(forceResize);
        return;
    }
    //    $(elm).css('transform', 'rotate('+ deg +'deg)');
    var offsetContLeft, offsetContTop, offsetLeft, offsetTop, newLeft, newTop;
    $(elm).css('transform', 'rotate(' + deg + 'deg)');
    $(".fallback-wrapper").css('transform', 'rotate(' + deg + 'deg)');
    // Get the container offset
    offsetContLeft = $(elm).parent().offset().left;
    offsetContTop = $(elm).parent().offset().top;
    // get the new rotated offset
    offsetLeft = $(elm).offset().left;
    offsetTop = $(elm).offset().top;
    // Subtract the two offsets.
    newLeft = (offsetContLeft - offsetLeft) / scale;
    newTop = (offsetContTop - offsetTop) / scale;
    // Apply the new offsets to the margin of the element.
    $(elm).css('margin-left', newLeft).css('margin-top', newTop);
    $(".fallback-wrapper").css('margin-left', newLeft).css('margin-top', newTop);
    window.dispatchEvent(forceResize);
}
//get Current Time
function currentTime() {
    if (isCF) {
        return CFTime.split("T")[0] + "T00:00:00";
    }
    else {
        if (!development || dateToRequest === "") {
            var tzoffset = new Date().getTimezoneOffset() * 60000;
            var localISOTime = new Date(Date.now() - tzoffset + (timeZoneOffset * 60000))
                .toISOString()
                .slice(0, -1);
            localISOTime = localISOTime.split("T")[0] + "T00:00:00";
        }
        else {
            localISOTime = dateToRequest + "T00:00:00";
        }
        return localISOTime;
    }
}
// Standalone menu rotation function
// target: selector for station wrappers (e.g., '.station-wrapper')
// duration: fade duration in ms
// delay: display duration in ms
// transition: (unused for now)
// Global menu rotation state

// MenuRotator: private scoped menu rotation logic
var MenuRotator = (function() {
    var menuRotationInterval = null;
    var menuRotationConfig = {
        target: '.station-wrapper',
        fadeDuration: 800,
        displayDuration: 6000,
        nextStationFn: null
    };
    function rotateMenus(target, duration, delay, transition) {
        var $stations = $(target);
        if ($stations.length <= 1) return;
        var currentIdx = 0;
        var fadeDuration = duration || 800;
        var displayDuration = delay || 6000;
        // Hide all except the first
        $stations.css({ opacity: 0, visibility: 'hidden', position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 1 });
        $stations.eq(0).css({ opacity: 1, visibility: 'visible', position: 'relative', zIndex: 2 });
        function nextStation() {
            var prevIdx = currentIdx;
            currentIdx = (currentIdx + 1) % $stations.length;
            $stations.eq(currentIdx)
                .css({ position: 'relative', visibility: 'visible', zIndex: 3 })
                .stop(true, true)
                .animate({ opacity: 1 }, fadeDuration);
            $stations.eq(prevIdx)
                .css({ zIndex: 2 })
                .stop(true, true)
                .animate({ opacity: 0 }, fadeDuration, function () {
                    $(this).css({ visibility: 'hidden', position: 'absolute', zIndex: 1 });
                });
        }
        // Store config for pause/resume
        menuRotationConfig = {
            target: target,
            fadeDuration: fadeDuration,
            displayDuration: displayDuration,
            nextStationFn: nextStation
        };
        if (menuRotationInterval) {
            clearInterval(menuRotationInterval);
        }
        menuRotationInterval = setInterval(nextStation, displayDuration + fadeDuration);
    }
    function pauseMenuRotation() {
        if (menuRotationInterval) {
            clearInterval(menuRotationInterval);
            menuRotationInterval = null;
        }
    }
    function resumeMenuRotation() {
        pauseMenuRotation();
        var cfg = menuRotationConfig;
        if (cfg && typeof cfg.nextStationFn === 'function') {
            setTimeout(function() {
                if (!menuRotationInterval) {
                    menuRotationInterval = setInterval(cfg.nextStationFn, (cfg.displayDuration || 6000) + (cfg.fadeDuration || 800));
                }
            }, 300);
        }
    }
    return {
        rotateMenus: rotateMenus,
        pauseMenuRotation: pauseMenuRotation,
        resumeMenuRotation: resumeMenuRotation
    };
})();
;
function resetSync() {
    return new Promise(function (resolve, reject) {
        try {
            if (leader) {
                // clear syncs
                var anchors = JSON.parse(self.localStorage.getItem(AssetConfiguration.SKey + "_anchors(" + version + ")"));
                for (var key in anchors) {
                    if (anchors[key].hasOwnProperty('lastSync')) {
                        delete anchors[key].lastSync; // or set it to null: parsedData[key].lastSync = null;
                    }
                }
                localStorage.setItem(AssetConfiguration.SKey + "_anchors(" + version + ")", JSON.stringify(anchors));
                resolve("Anchors cleared and reloaded.");
            }
        }
        catch (error) {
            reject("An error occurred: " + error);
        }
    });
}
function releaseVideos() {
    $('video').each(function () {
        $(this).attr('src', '');
        $(this).find('source').attr('src', ''); //catch nested sources
        this.load(); // Reload the video element to apply the changes
    });
}
document.refreshAsset = function () {
    if (leader) {
        $("body").toggleClass("blink");
        integration.cached_start();
        setTimeout(function () {
            $("body").toggleClass("blink");
        }, 1000);
    }
    else {
        $("body").toggleClass("blink");
        setTimeout(function () {
            $("body").toggleClass("blink");
        }, 1000);
    }
    return "Simualte refreshAsset() event";
};
//future add to digital to clear remotely
//switched to synthetic reload
document.clearAssetStorage = function () {
    if (leader) {
        new Promise(function (resolve, reject) {
            clearDatabases()
                .then(resolve)
                .catch(reject);
        }).then(function () {
            integration.init(leader, isUsingIndexedDB);
        });
    }
    else {
        integration.init(leader, isUsingIndexedDB);
    }
    return "Simulate clearAssetStorage() event";
};
//function used by asset to clear storage and ignore TRM or client dependencies
function clearDatabases() {
    console.log("Database maintenance start..");
    var ignoreList = ["Dig", "deviceAuth", "DeviceData"];
    return new Promise(function (resolve, reject) {
        if (isUsingIndexedDB) {
            Dexie.getDatabaseNames().then(function (dataBases) {
                var deletionPromises = [];
                dataBases.forEach(function (each) {
                    // Check if DB name contains any ignore key
                    var shouldIgnore = ignoreList.some(function (ignoreKey) {
                        return each.indexOf(ignoreKey) > -1;
                    });
                    if (isCF || development) {
                        // In CF or development: delete unless in ignoreList
                        if (!shouldIgnore) {
                            console.log("Deleting.. " + each);
                            deletionPromises.push(Dexie.delete(each).catch(function (err) {
                                console.error("Error deleting database:", err);
                                reject(err);
                            }));
                        }
                        else {
                            console.log("Ignoring.. " + each);
                        }
                    }
                    else {
                        // In client: only delete if matches version
                        if (each.indexOf("(" + version + ")") > -1) {
                            console.log("Deleting.. " + each);
                            deletionPromises.push(Dexie.delete(each).catch(function (err) {
                                console.error("Error deleting database:", err);
                                reject(err);
                            }));
                        }
                        else {
                            console.log("Ignoring.. " + each);
                        }
                    }
                });
                // Wait for all deletions to complete
                Promise.all(deletionPromises)
                    .then(function () {
                    console.log("DB maintenance complete");
                    // Proceed with localStorage maintenance
                    clearLocalStorage(resolve);
                })
                    .catch(reject);
            }).catch(reject);
        }
        else {
            clearLocalStorage(resolve);
        }
    });
}
function clearLocalStorage(resolve) {
    var ignoreList = [
        "Dig", "deviceAuth", "DeviceData", "MostRecentCCGS", "SessionLastRefresh", "SessionTimeOut",
        "TrmClientConfig", "WeatherUpdate", "ccgsItems", "deviceIdentityInfo", "isCcgsOpen", "isNavOpen",
        "userId", "navItems", "weatherLocation"
    ];
    var LSlength = self.localStorage.length;
    var keys = [];
    for (var i = 0; i < LSlength; i++) {
        keys.push(self.localStorage.key(i));
    }
    keys.forEach(function (each) {
        var shouldIgnore = ignoreList.some(function (ignoreKey) {
            return each.indexOf(ignoreKey) > -1;
        });
        if (isCF || development) {
            // In CF or development: delete unless in ignoreList
            if (!shouldIgnore) {
                console.log("Deleting.. " + each);
                self.localStorage.removeItem(each);
            }
            else {
                console.log("Ignoring.. " + each);
            }
        }
        else {
            // In client: only delete if matches version
            if (each.indexOf("(" + version + ")") > -1) {
                console.log("Deleting.. " + each);
                self.localStorage.removeItem(each);
            }
            else {
                console.log("Ignoring.. " + each);
            }
        }
    });
    console.log("Local Storage maintenance complete");
    resolve();
}
//clean up on exits or closes so new leader can be elected.
//should I do something more in content forecaster..
window.addEventListener('beforeunload', function (event) {
    // Perform actions before the page unloads
    if (platform === "webos") {
        releaseVideos();
    }
    if (leader) {
        self.localStorage.removeItem(heartbeatKey);
    }
});
window.addEventListener('unload', function (event) {
    // Perform actions before iframe is closed or leader exits.
    if (platform === "webos") {
        releaseVideos();
    }
    if (leader) {
        self.localStorage.removeItem(heartbeatKey);
    }
});
function hide() {
    $(".fallback-wrapper").hide();
}
//Rotate V5.1
//Mine
//rotate element code on overflow
var config = {
    attributes: false,
    childList: true,
    subtree: true
};
var observerObj = [];
var queued = [];
var callback = function (event, observer) {
    var unique = [];
    event.forEach(function (each) {
        var divId = $(each.target).attr("data-rotate-id");
        if (divId && !unique[divId]) {
            unique[divId] = true;
            if (observerObj[divId].isRotating) {
                observerObj[divId].shouldReset = true;
            }
            else {
                //stay in sync if adding new rotation
                if ($(".rotation-wrapper").length > 0) {
                    queued.push({
                        id: divId,
                        target: each.target,
                    });
                }
                else {
                    observerObj[divId].rotate($(each.target), observerObj[divId].configs, observerObj[divId].data);
                }
            }
        }
    });
};
var rotateObserver = new MutationObserver(callback);
//global call function 1 or many
var rotate = function (node, options) {
    // Default settings
    var settings = $.extend({
        delay: 0,
        cycle: 8000,
        fill: 'packed',
        transition: 'fade'
    }, options);
    $(node).css("overflow", "hidden");
    setTimeout(function () {
        $(node).get().forEach(function (each, idx) {
            if ($(each).attr("data-rotate-id") !== undefined || $(each).attr("dynamic-fill") === "false") {
                return;
            }
            $("body").css("transform", "");
            var rotateId = makeid(8);
            $(each).attr("data-rotate-id", rotateId);
            if (!observerObj[rotateId]) {
                observerObj[rotateId] = new Rotate();
                observerObj[rotateId].configs = settings;
                observerObj[rotateId].data = rotateId;
                observerObj[rotateId].rotate($(each), settings, rotateId);
                rotateObserver.observe(each, config);
            }
        });
    }, settings.delay);
};
function clearQueue() {
    queued.forEach(function (each) {
        observerObj[each.id].rotate($(each.target), observerObj[each.id].configs, observerObj[each.id].data);
    });
    if (queued.length > 0) {
        console.log("queue cleared");
        queued = [];
    }
}
function makeid(length) {
    var result = "";
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    var counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
var Rotate = /** @class */ (function () {
    function Rotate() {
        this.delay = null;
        this.cycle = null;
        this.fill = null;
        this.ele = null;
        this.data = [];
        this.transition = null;
        this.timeOut = [];
        this.hidden = false;
        this.zone = null;
        this.shouldReset = false;
        this.pass = 0;
        this.originalLength = 0;
        this.isRotating = false;
    }
    Rotate.prototype.rotate = function (ele, obj, id) {
        this.originalHeight = ele[0].clientHeight;
        this.ele = ele;
        if (!document.body.contains($(ele)[0])) {
            var forceResize = new CustomEvent('resize');
            window.dispatchEvent(forceResize);
            return;
        }
        this.delay = obj.delay ? obj.delay * 1000 : 0;
        this.cycle = obj.cycle * 1000;
        this.fill = obj.fill ? obj.fill : "packed";
        this.transition = obj.transition ? obj.transition : "fade";
        this.id = id;
        this.build();
    };
    Rotate.prototype.build = function () {
        var _this = this;
        this.zoneToRotate = this.ele[0];
        this.instanceID = this.id;
        $("#" + this.instanceID).empty().remove();
        if (this.zoneToRotate) {
            this.settings = [];
            this.hiddenDiv = [];
            this.itemProperties = [];
            this.groupProperties = [];
            this.zoneProperties = [];
            this.zoneProperties.overflowingHeight = false;
            this.zoneProperties.overflowingWidth = false;
            this.settings.delay = this.delay ? this.delay : 0;
            this.settings.cycle = this.cycle ? this.cycle : 0;
            this.settings.fill = this.fill ? this.fill : "";
            this.settings.transition = this.transition ? this.transition : "fade";
            this.zoneProperties.left = $(this.zoneToRotate)[0].offsetLeft;
            this.zoneProperties.top = $(this.zoneToRotate)[0].offsetTop;
            this.zoneProperties.width = $(this.zoneToRotate)[0].offsetWidth;
            this.zoneProperties.height = $(this.zoneToRotate)[0].offsetHeight;
            this.originalHeight = this.originalHeight ? this.originalHeight : $(this.zoneToRotate).height();
            this.zoneProperties.actualWidth = $(this.zoneToRotate)[0].scrollWidth;
            this.zoneProperties.actualHeight = $(this.zoneToRotate)[0].scrollHeight;
            if (this.zoneProperties.actualHeight > this.zoneProperties.height) {
                this.zoneProperties.overflowingHeight = true;
            }
            if (this.zoneProperties.actualWidth > this.zoneProperties.width) {
                this.zoneProperties.overflowingWidth = true;
            }
            if (this.zoneProperties.overflowingWidth && this.zoneProperties.overflowingHeight) {
                if ((this.zoneProperties.actualWidth - this.zoneProperties.width) > (this.zoneProperties.actualHeight - this.zoneProperties.height)) {
                    this.zoneProperties.overflowingWidth = true;
                    this.zoneProperties.overflowingHeight = false;
                }
                else {
                    this.zoneProperties.overflowingWidth = false;
                    this.zoneProperties.overflowingHeight = true;
                }
            }
            if (!this.zoneProperties.overflowingWidth && !this.zoneProperties.overflowingHeight) {
                $("[dynamic-fill=true]").css("opacity", "");
                var forceResize_1 = new CustomEvent('resize');
                window.dispatchEvent(forceResize_1);
                return;
            }
            function isElementAbsolutelyPositioned(element) {
                // Get the computed style of the element
                var computedStyle = window.getComputedStyle(element);
                // Check if the position property is 'absolute'
                return computedStyle.position === 'absolute';
            }
            if (isElementAbsolutelyPositioned(this.zoneToRotate)) {
                var zoneWrapper = document.createElement('div');
                $(zoneWrapper).addClass("rotation-wrapper");
                $(zoneWrapper).css("top", "0px").css("height", this.originalHeight).css("width", this.originalWidth).css("position", "absolute").attr("data-rotate-id", _this.instanceID);
                zoneWrapper.id = this.id;
                $(this.zoneToRotate).parent().append(zoneWrapper);
                $(this.zoneToRotate).css("visibility", "hidden");
            }
            else {
                //create rotations wrapper
                var zoneWrapper = document.createElement('div');
                $(zoneWrapper).addClass("rotation-wrapper");
                $(zoneWrapper).css("top", this.zoneProperties.top).css("left", this.zoneProperties.left).css("height", this.originalHeight).css("width", this.originalWidth).css("position", "absolute").attr("data-rotate-id", _this.instanceID);
                zoneWrapper.id = this.id;
                $(this.zoneToRotate).parent().append(zoneWrapper);
                $(this.zoneToRotate).css("visibility", "hidden");
            }
            this.items = $(this.zoneToRotate).children().toArray();
            $(this.zoneToRotate).attr("isRotating", "true");
            this.page = -1;
            this.items.forEach(function (eachItem) {
                _this.pageCalc = _this.zoneProperties.overflowingHeight ? Math.floor(($(eachItem).position().top - _this.zoneProperties.top + $(eachItem).height()) / _this.zoneProperties.height) : Math.floor((eachItem.offsetLeft - _this.zoneProperties.left) / eachItem.offsetWidth);
                if (_this.pageCalc > _this.page) {
                    _this.page = _this.pageCalc;
                    _this.groupProperties.push(createDiv());
                }
                function cloneComputedStyleAndPosition(sourceElement, targetElement) {
                    // Create a temporary element of the same type
                    var tempElement = document.createElement(sourceElement.tagName);
                    document.body.appendChild(tempElement); // Append it to the body to ensure styles are applied
                    // Get computed styles of the source and temporary elements
                    var computedStyle = window.getComputedStyle(sourceElement);
                    var defaultComputedStyle = window.getComputedStyle(tempElement);
                    // Object to hold non-default styles
                    var nonDefaultStyles = {};
                    // Compare the computed styles and store the non-default ones
                    for (var i = 0; i < computedStyle.length; i++) {
                        var property = computedStyle[i];
                        var value = computedStyle.getPropertyValue(property);
                        var defaultValue = defaultComputedStyle.getPropertyValue(property);
                        if (value !== defaultValue) {
                            nonDefaultStyles[property] = value;
                        }
                    }
                    // Apply non-default styles to the target element
                    for (var property in nonDefaultStyles) {
                        targetElement.style[property] = nonDefaultStyles[property];
                    }
                    // Remove the temporary element
                    tempElement.remove();
                    // Calculate position relative to the viewport
                    var rect = sourceElement.getBoundingClientRect();
                    // Apply position properties to the target element
                    targetElement.style.position = 'absolute'; // Ensures the cloned element is positioned absolutely
                    targetElement.style.top = rect.top + 'px';
                    targetElement.style.left = rect.left + 'px';
                    targetElement.style.width = computedStyle.width;
                    targetElement.style.height = computedStyle.height;
                    // Optional: Clone margin and padding for more precise positioning
                    targetElement.style.margin = computedStyle.margin;
                    targetElement.style.padding = computedStyle.padding;
                }
                //create cloned zone
                function createDiv() {
                    var div = document.createElement('div');
                    //cloneComputedStyleAndPosition(_this.zoneToRotate, div);
                    div.id = "RG-" + _this.page + "-" + _this.instanceID;
                    div.classList.add("cloned-element");
                    $(div).css("visibility", "");
                    $(div).addClass($(_this.zoneToRotate).attr("class")).css("position", "absolute").css("visibility", "").css("height", "100%");
                    $(div).attr("dynamic-fill", false);
                    if (_this.page > 0) {
                        $(div).css("opacity", "0");
                        _this.hiddenDiv.push(div);
                    }
                    return div;
                }
                _this.itemProperties.push({
                    "page": _this.page,
                    "width": eachItem.offsetWidth,
                    "height": eachItem.offsetHeight,
                    "ele": (function () {
                        var clone = eachItem.cloneNode(true);
                        clone.data = eachItem.data ? eachItem.data : []; // Reattach custom data
                        return clone;
                    })()
                });
            });
            //add items
            this.itemProperties.forEach(function (eachItem) {
                $(eachItem.ele).addClass("cloned-element");
                $(_this.groupProperties[eachItem.page]).append(eachItem.ele);
            });
            //even out items
            if (this.settings.fill === "even" && _this.pass < 25) {
                if (_this.pass === 0) {
                    _this.originalLength = this.groupProperties.length;
                    _this.originalHeight = $(this.ele).height();
                    _this.originalWidth = $(this.ele).width();
                }
                _this.pass++;
                var averageFill = Math.floor(this.itemProperties.length / this.groupProperties.length);
                if (this.zoneProperties.overflowingWidth) {
                    if (this.groupProperties.length > _this.originalLength + 1) {
                        $(this.ele).css("height", this.zoneProperties.actualHeight * 1.08);
                        _this.pass = 10000;
                        this.build(this.ele);
                        return;
                    }
                    if (this.groupProperties[this.groupProperties.length - 1].children.length < averageFill && this.ele[0].clientHeight > _this.originalHeight * .6 && this.groupProperties.length <= _this.originalLength + 1) {
                        $(this.ele).css("height", this.zoneProperties.height * .98);
                        this.build(this.ele);
                        return;
                    }
                }
                else {
                    if (this.groupProperties.length > _this.originalLength + 1) {
                        $(this.ele).css("width", this.zoneProperties.actualWidth * 1.08);
                        _this.pass = 10000;
                        this.build(this.ele);
                        return;
                    }
                    if (this.groupProperties[this.groupProperties.length - 1].children.length < averageFill && this.ele[0].clientWidth > _this.originalWidth * .6 && this.groupProperties.length <= _this.originalLength + 1) {
                        $(this.ele).css("width", this.zoneProperties.width * .98);
                        this.build(this.ele);
                        return;
                    }
                }
            }
            $(this.ele).css("height", "");
            $(this.ele).css("width", "");
            // use TRM duration if 0 duration and possibl   
            if (this.settings.cycle === 0) {
                this.settings.TRMDuration = AssetConfiguration.Duration ? AssetConfiguration.Duration : null;
                this.settings.TRMDuration = this.settings.TRMDuration && this.settings.TRMDuration != 0 ? this.settings.TRMDuration / this.groupProperties.length : 8000;
                this.settings.cycle = this.settings.TRMDuration > 4000 ? this.settings.TRMDuration : 8000;
            }
            _this.groupProperties.forEach(function (eachDiv, idx) {
                //handle last zone for flex containers
                if (idx === _this.groupProperties.length - 1) {
                    if (_this.fill != "even") {
                        $(eachDiv).css("justify-content", "normal");
                    }
                }
                $(eachDiv).attr("Duration", _this.settings.cycle / 1000);
                if (idx === 0) {
                    $(eachDiv).attr("playing", "true");
                }
                else {
                    $(eachDiv).attr("playing", "false");
                }
                $(zoneWrapper).append(eachDiv);
            });
            var forceResize = new CustomEvent('resize');
            window.dispatchEvent(forceResize);
            setTimeout(function () {
                _this.animate($(zoneWrapper), _this.settings.cycle, _this.settings.transition, _this.settings.delay, false);
            }, _this.settings.cycle + _this.settings.delay);
            _this.watch(zoneWrapper, _this.settings);
        }
        this.isRotating = true;
    };
    Rotate.prototype.watch = function (zoneWrapper, settings) {
        var _this = this;
        try {
            var config = {
                attributes: true
            };
            var playing = (".zone-wrapper", self.frameElement.parentElement);
            var mutationCallBack = function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.type === "attributes" && mutation.attributeName === "trm-playing") {
                        if (playing.getAttribute("trm-playing") === "false" && _this.hidden === false) {
                            _this.hidden = true;
                            _this.timeOut.forEach(function (each) {
                                clearTimeout(each);
                            });
                            _this.timeOut = [];
                        }
                        if (playing.getAttribute("trm-playing") === "true" && _this.hidden === true) {
                            observer.disconnect();
                            _this.hidden = false;
                            _this.animate(_this.zone, _this.settings.cycle, _this.settings.transition, _this.delay, true);
                            observer.observe(playing, config);
                        }
                    }
                });
            };
            var observer = new MutationObserver(mutationCallBack);
            observer.observe(playing, config);
        }
        catch (err) {
            function stop() {
                if (document.hidden && _this.hidden != true) {
                    _this.hidden = true;
                    _this.timeOut.forEach(function (each) {
                        clearTimeout(each);
                    });
                    _this.timeOut = [];
                    console.log("hidden");
                }
                if (document.hidden === false && _this.hidden != false) {
                    _this.hidden = false;
                    _this.animate(_this.zone, _this.settings.cycle, _this.settings.transition, _this.delay, true);
                    console.log("showing");
                }
            }
            document.addEventListener("visibilitychange", stop);
        }
    };
    Rotate.prototype.animate = function (zone, cycle, transition, delay, restart) {
        var _this = this;
        var menus = $(zone).find("[dynamic-fill='false']");
        var length = menus.length;
        var menuTransitionIndex = -1;
        var queueDelayCalc = delay > 0 ? ((cycle * length) - delay) : 0;
        _this.zone = zone;
        $(menus).hide();
        $(menus[0]).show();
        $(menus).css("opacity", "");
        if (length === 1) {
            return;
        }
        function crossFade(transition) {
            if (_this.shouldReset && menuTransitionIndex === -1) {
                _this.shouldReset = false;
                console.log("rebuilt" + "-" + _this.instanceID);
                _this.delay = 0;
                _this.pass = 0;
                _this.build();
                return;
            }
            if (_this.hidden === true) {
                $(menus).get().forEach(function (each) {
                    $(each).stop();
                });
                return;
            }
            menuTransitionIndex++;
            $(menus[menuTransitionIndex]).fadeOut("slow");
            $(menus[menuTransitionIndex]).attr("playing", "false");
            var next = menuTransitionIndex + 1;
            if (menuTransitionIndex >= length - 1) {
                menuTransitionIndex = -1;
                setTimeout(function () {
                    clearQueue();
                }, queueDelayCalc);
                $(menus.get(0)).fadeIn("slow");
                $(menus.get(0)).attr("playing", "true");
            }
            else {
                $(menus.get(next)).fadeIn("slow");
                $(menus.get(next)).attr("playing", "true");
            }
            _this.timeOut.push(setTimeout(function () {
                crossFade(transition);
            }, cycle));
        }
        if (restart) {
            (setTimeout(function () {
                crossFade(transition);
            }, _this.delay + cycle));
        }
        else {
            crossFade(transition);
        }
    };
    return Rotate;
}());
//includes() polyfill
//V1.0
//objectValues()
if (!Object.values) {
    Object.values = function (obj) {
        return Object.keys(obj).map(function (key) {
            return obj[key];
        });
    };
}
//Mine
if (!Array.prototype.includes) {
    Array.prototype.includes = function (valueToFind, fromIndex) {
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        var o = Object(this);
        var len = o.length >>> 0;
        if (len === 0) {
            return false;
        }
        var n = fromIndex | 0;
        var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
            if (o[k] === valueToFind || (typeof o[k] === 'number' && typeof valueToFind === 'number' && isNaN(o[k]) && isNaN(valueToFind))) {
                return true;
            }
            k++;
        }
        return false;
    };
}
/**
 * textFit v2.3.1
 * Previously known as jQuery.textFit
 * 11/2014 by STRML (strml.github.com)
 * MIT License
 *
 * To use: textFit(document.getElementById('target-div'), options);
 *
 * Will make the *text* content inside a container scale to fit the container
 * The container is required to have a set width and height
 * Uses binary search to fit text with minimal layout calls.
 * Version 2.0 does not use jQuery.
 */
/*global define:true, document:true, window:true, HTMLElement:true*/
(function (root, factory) {
    "use strict";
    // UMD shim
    if (typeof define === "function" && define.amd) {
        // AMD
        define([], factory);
    }
    else if (typeof exports === "object") {
        // Node/CommonJS
        module.exports = factory();
    }
    else {
        // Browser
        root.textFit = factory();
    }
}(typeof global === "object" ? global : this, function () {
    "use strict";
    var defaultSettings = {
        alignVert: false, // if true, textFit will align vertically using css tables
        alignHoriz: false, // if true, textFit will set text-align: center
        multiLine: true, // if true, textFit will not set white-space: no-wrap
        detectMultiLine: true, // disable to turn off automatic multi-line sensing
        minFontSize: 28,
        maxFontSize: 50,
        reProcess: false, // if true, textFit will re-process already-fit nodes. Set to 'false' for better performance
        widthOnly: true, // if true, textFit will fit text to element width, regardless of text height
        alignVertWithFlexbox: true, // if true, textFit will use flexbox for vertical alignment
    };
    return function textFit(els, options) {
        if (!options)
            options = {};
        // Extend options.
        var settings = {};
        for (var key in defaultSettings) {
            if (options.hasOwnProperty(key)) {
                settings[key] = options[key];
            }
            else {
                settings[key] = defaultSettings[key];
            }
        }
        // Convert jQuery objects into arrays
        if (typeof els.toArray === "function") {
            els = els.toArray();
        }
        // Support passing a single el
        var elType = Object.prototype.toString.call(els);
        if (elType !== '[object Array]' && elType !== '[object NodeList]' &&
            elType !== '[object HTMLCollection]') {
            els = [els];
        }
        // Process each el we've passed.
        for (var i = 0; i < els.length; i++) {
            processItem(els[i], settings);
        }
    };
    /**
     * The meat. Given an el, make the text inside it fit its parent.
     * @param  {DOMElement} el       Child el.
     * @param  {Object} settings     Options for fit.
     */
    function processItem(el, settings) {
        if (!isElement(el) || (!settings.reProcess && el.getAttribute('textFitted'))) {
            return false;
        }
        // Set textFitted attribute so we know this was processed.
        if (!settings.reProcess) {
            el.setAttribute('textFitted', 1);
        }
        var innerSpan, originalHeight, originalHTML, originalWidth;
        var low, mid, high;
        // Get element data.
        originalHTML = el.innerHTML;
        originalWidth = innerWidth(el);
        originalHeight = innerHeight(el);
        // Don't process if we can't find box dimensions
        if (!originalWidth || (!settings.widthOnly && !originalHeight)) {
            if (!settings.widthOnly)
                throw new Error('Set a static height and width on the target element ' + el.outerHTML +
                    ' before using textFit!');
            else
                throw new Error('Set a static width on the target element ' + el.outerHTML +
                    ' before using textFit!');
        }
        // Add textFitted span inside this container.
        if (originalHTML.indexOf('textFitted') === -1) {
            innerSpan = document.createElement('span');
            innerSpan.className = 'textFitted';
            // Inline block ensure it takes on the size of its contents, even if they are enclosed
            // in other tags like <p>
            innerSpan.style['display'] = 'inline-block';
            innerSpan.innerHTML = originalHTML;
            el.innerHTML = '';
            el.appendChild(innerSpan);
        }
        else {
            // Reprocessing.
            innerSpan = el.querySelector('span.textFitted');
            // Remove vertical align if we're reprocessing.
            if (hasClass(innerSpan, 'textFitAlignVert')) {
                innerSpan.className = innerSpan.className.replace('textFitAlignVert', '');
                innerSpan.style['height'] = '';
                el.className.replace('textFitAlignVertFlex', '');
            }
        }
        // Prepare & set alignment
        if (settings.alignHoriz) {
            el.style['text-align'] = 'center';
            innerSpan.style['text-align'] = 'center';
        }
        // Check if this string is multiple lines
        // Not guaranteed to always work if you use wonky line-heights
        var multiLine = settings.multiLine;
        if (settings.detectMultiLine && !multiLine &&
            innerSpan.getBoundingClientRect().height >= parseInt(window.getComputedStyle(innerSpan)['font-size'], 10) * 2) {
            multiLine = true;
        }
        // If we're not treating this as a multiline string, don't let it wrap.
        if (!multiLine) {
            el.style['white-space'] = 'nowrap';
        }
        low = settings.minFontSize;
        high = settings.maxFontSize;
        // Binary search for highest best fit
        var size = low;
        while (low <= high) {
            mid = (high + low) >> 1;
            innerSpan.style.fontSize = mid + 'px';
            var innerSpanBoundingClientRect = innerSpan.getBoundingClientRect();
            if (innerSpanBoundingClientRect.width <= originalWidth &&
                (settings.widthOnly || innerSpanBoundingClientRect.height <= originalHeight)) {
                size = mid;
                low = mid + 1;
            }
            else {
                high = mid - 1;
            }
            // await injection point
        }
        // found, updating font if differs:
        if (innerSpan.style.fontSize != size + 'px')
            innerSpan.style.fontSize = size + 'px';
        // Our height is finalized. If we are aligning vertically, set that up.
        if (settings.alignVert) {
            addStyleSheet();
            var height = innerSpan.scrollHeight;
            if (window.getComputedStyle(el)['position'] === "static") {
                el.style['position'] = 'relative';
            }
            if (!hasClass(innerSpan, "textFitAlignVert")) {
                innerSpan.className = innerSpan.className + " textFitAlignVert";
            }
            innerSpan.style['height'] = height + "px";
            if (settings.alignVertWithFlexbox && !hasClass(el, "textFitAlignVertFlex")) {
                el.className = el.className + " textFitAlignVertFlex";
            }
        }
    }
    // Calculate height without padding.
    function innerHeight(el) {
        var style = window.getComputedStyle(el, null);
        return el.getBoundingClientRect().height -
            parseInt(style.getPropertyValue('padding-top'), 10) -
            parseInt(style.getPropertyValue('padding-bottom'), 10);
    }
    // Calculate width without padding.
    function innerWidth(el) {
        var style = window.getComputedStyle(el, null);
        return el.getBoundingClientRect().width -
            parseInt(style.getPropertyValue('padding-left'), 10) -
            parseInt(style.getPropertyValue('padding-right'), 10);
    }
    //Returns true if it is a DOM element
    function isElement(o) {
        return (typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string");
    }
    function hasClass(element, cls) {
        return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
    }
    // Better than a stylesheet dependency
    function addStyleSheet() {
        if (document.getElementById("textFitStyleSheet"))
            return;
        var style = [
            ".textFitAlignVert{",
            "position: absolute;",
            "top: 0; right: 0; bottom: 0; left: 0;",
            "margin: auto;",
            "display: flex;",
            "justify-content: center;",
            "flex-direction: column;",
            "}",
            ".textFitAlignVertFlex{",
            "display: flex;",
            "}",
            ".textFitAlignVertFlex .textFitAlignVert{",
            "position: static;",
            "}",
        ].join("");
        var css = document.createElement("style");
        css.type = "text/css";
        css.id = "textFitStyleSheet";
        css.innerHTML = style;
        document.body.appendChild(css);
    }
}));
!function (t, e) {
    "object" == typeof exports && "object" == typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define([], e) : "object" == typeof exports ? exports.stringSimilarity = e() : t.stringSimilarity = e();
}(self, (function () {
    return t = {
        138: function (t) {
            function e(t, e) {
                if ((t = t.replace(/\s+/g, "")) === (e = e.replace(/\s+/g, "")))
                    return 1;
                if (t.length < 2 || e.length < 2)
                    return 0;
                var r = new Map;
                for (var e_1 = 0; e_1 < t.length - 1; e_1++) {
                    var n_1 = t.substring(e_1, e_1 + 2), o = r.has(n_1) ? r.get(n_1) + 1 : 1;
                    r.set(n_1, o);
                }
                var n = 0;
                for (var t_1 = 0; t_1 < e.length - 1; t_1++) {
                    var o = e.substring(t_1, t_1 + 2), s = r.has(o) ? r.get(o) : 0;
                    s > 0 && (r.set(o, s - 1), n++);
                }
                return 2 * n / (t.length + e.length - 2);
            }
            t.exports = {
                compareTwoStrings: e,
                findBestMatch: function (t, r) {
                    if (!function (t, e) {
                        return "string" == typeof t && !!Array.isArray(e) && !!e.length && !e.find((function (t) {
                            return "string" != typeof t;
                        }));
                    }(t, r))
                        throw new Error("Bad arguments: First argument should be a string, second should be an array of strings");
                    var n = [];
                    var o = 0;
                    for (var s = 0; s < r.length; s++) {
                        var i = r[s], f = e(t, i);
                        n.push({
                            target: i,
                            rating: f
                        }), f > n[o].rating && (o = s);
                    }
                    return {
                        ratings: n,
                        bestMatch: n[o],
                        bestMatchIndex: o
                    };
                }
            };
        }
    }, e = {},
        function r(n) {
            if (e[n])
                return e[n].exports;
            var o = e[n] = {
                exports: {}
            };
            return t[n](o, o.exports, r), o.exports;
        }(138);
    var t, e;
}));

var nutritionLabelTemplate = `
    <div class="nutrition-label-overlay">
        <div class="nutritional-lable">
            <div class="button-wrapper-NL">
                <button class="close-nutrition-label material-icons" aria-label="Close" type="button" style="background:none;border:none;cursor:pointer;" tabindex="0" role="button" onclick="removeNutritionOverlay()">close</button>
            </div
            <div class="name-wrapper-NL">
                <div class="name-NL">{{name}}</div>
            </div>
        <div class="serving wrapper">
            <div class="name-NL">Serving Size</div>
            <div class="value">{{portion}}</div>
        </div>
        <div class="calories wrapper">
            <div class="label-NL">Amount per serving</div>
            <div class="flex-row">
                <div class="name-NL">Calories</div>
                <div class="value">{{calories}}</div>
            </div>
        </div>
        <div class="row">
            <div class="name-NS">Total Fat</div>
            <div class="value">{{nutrition.fat.displayValue}}</div>
        </div>
        <div class="row">
            <div class="name-NS">Total Carbohydrates</div>
            <div class="value">{{nutrition.carbohydrates.displayValue}}</div>
        </div>
            <div class="row">
            <div class="name-NS">Protein</div>
            <div class="value">{{nutrition.protein.displayValue}}</div>
        </div>
        </div>
        <div class="close"></div>
    </div>`;