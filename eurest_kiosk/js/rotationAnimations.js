"use strict";

// Animation registry - stores all available animation types
var RotationAnimations = {
    animations: {},
    
    // Register a new animation type
    register: function(name, animationFunction) {
        this.animations[name] = animationFunction;
    },
    
    // Get an animation by name
    get: function(name) {
        return this.animations[name] || this.animations['fade']; // Default to fade
    },
    
    // List all available animations
    list: function() {
        return Object.keys(this.animations);
    }
};

// Default animation implementations
RotationAnimations.register('fade', function(container, currentGroup, nextGroup, duration, callback) {
    var $container = $(container);
    var $current = $(currentGroup);
    var $next = $(nextGroup);
    
    // Hide next group initially
    $next.css({ opacity: 0, display: 'block' });
    
    // Fade out current, fade in next
    $current.animate({ opacity: 0 }, duration / 2, function() {
        $current.hide();
        $next.animate({ opacity: 1 }, duration / 2, function() {
            if (callback) callback();
        });
    });
});

RotationAnimations.register('slide', function(container, currentGroup, nextGroup, duration, callback) {
    var $container = $(container);
    var $current = $(currentGroup);
    var $next = $(nextGroup);
    var containerWidth = container.clientWidth;
    
    // Position next group off-screen to the right
    $next.css({
        display: 'block',
        position: 'relative',
        left: containerWidth + 'px'
    });
    
    // Slide current out to left, next in from right
    $current.animate({ left: -containerWidth + 'px' }, duration, function() {
        $current.hide().css({ left: 0 });
    });
    
    $next.animate({ left: 0 }, duration, function() {
        if (callback) callback();
    });
});

RotationAnimations.register('slideVertical', function(container, currentGroup, nextGroup, duration, callback) {
    var $container = $(container);
    var $current = $(currentGroup);
    var $next = $(nextGroup);
    var containerHeight = container.clientHeight;
    
    // Position next group off-screen below
    $next.css({
        display: 'block',
        position: 'relative',
        top: containerHeight + 'px'
    });
    
    // Slide current up, next up from bottom
    $current.animate({ top: -containerHeight + 'px' }, duration, function() {
        $current.hide().css({ top: 0 });
    });
    
    $next.animate({ top: 0 }, duration, function() {
        if (callback) callback();
    });
});

RotationAnimations.register('scale', function(container, currentGroup, nextGroup, duration, callback) {
    var $container = $(container);
    var $current = $(currentGroup);
    var $next = $(nextGroup);
    
    // Hide and scale down next group initially
    $next.css({
        display: 'block',
        opacity: 0,
        transform: 'scale(0.8)'
    });
    
    // Scale down and fade out current
    $current.animate({
        opacity: 0
    }, {
        duration: duration / 2,
        step: function(now, fx) {
            if (fx.prop === 'opacity') {
                $(this).css('transform', 'scale(' + (0.8 + (now * 0.2)) + ')');
            }
        },
        complete: function() {
            $current.hide().css({ transform: 'scale(1)' });
            
            // Scale up and fade in next
            $next.animate({
                opacity: 1
            }, {
                duration: duration / 2,
                step: function(now, fx) {
                    if (fx.prop === 'opacity') {
                        $(this).css('transform', 'scale(' + (0.8 + (now * 0.2)) + ')');
                    }
                },
                complete: function() {
                    $(this).css('transform', 'scale(1)');
                    if (callback) callback();
                }
            });
        }
    });
});

RotationAnimations.register('flip', function(container, currentGroup, nextGroup, duration, callback) {
    var $container = $(container);
    var $current = $(currentGroup);
    var $next = $(nextGroup);
    
    // Set up 3D flip
    $container.css({
        perspective: '1000px',
        'transform-style': 'preserve-3d'
    });
    
    $next.css({
        display: 'block',
        opacity: 0,
        transform: 'rotateY(-90deg)'
    });
    
    // Flip current out
    $current.animate({
        opacity: 0
    }, {
        duration: duration / 2,
        step: function(now, fx) {
            if (fx.prop === 'opacity') {
                var rotation = (1 - now) * 90;
                $(this).css('transform', 'rotateY(' + rotation + 'deg)');
            }
        },
        complete: function() {
            $current.hide().css({ transform: 'rotateY(0deg)' });
            
            // Flip next in
            $next.animate({
                opacity: 1
            }, {
                duration: duration / 2,
                step: function(now, fx) {
                    if (fx.prop === 'opacity') {
                        var rotation = -90 + (now * 90);
                        $(this).css('transform', 'rotateY(' + rotation + 'deg)');
                    }
                },
                complete: function() {
                    $(this).css('transform', 'rotateY(0deg)');
                    if (callback) callback();
                }
            });
        }
    });
});

RotationAnimations.register('none', function(container, currentGroup, nextGroup, duration, callback) {
    // Instant switch - no animation
    $(currentGroup).hide();
    $(nextGroup).show();
    if (callback) callback();
});

// Overflow detection functions
function getContainerInfo(container) {
    var computedStyle = window.getComputedStyle ? window.getComputedStyle(container) : container.currentStyle;
    var position = computedStyle.position;
    
    return {
        position: position,
        isAbsolute: position === 'absolute' || position === 'fixed',
        isRelative: position === 'relative',
        isStatic: position === 'static' || !position
    };
}

function detectOverflow(container, direction) {
    var containerInfo = getContainerInfo(container);
    
    console.log('=== OVERFLOW DETECTION DEBUG ===');
    console.log('Container:', container);
    console.log('Container class/id:', container.className, container.id);
    console.log('Container clientWidth:', container.clientWidth);
    console.log('Container clientHeight:', container.clientHeight);
    console.log('Container scrollWidth:', container.scrollWidth);
    console.log('Container scrollHeight:', container.scrollHeight);
    console.log('Container offsetWidth:', container.offsetWidth);
    console.log('Container offsetHeight:', container.offsetHeight);
    
    // Check computed styles
    var computedStyle = window.getComputedStyle(container);
    console.log('Container overflow-x:', computedStyle.overflowX);
    console.log('Container overflow-y:', computedStyle.overflowY);
    console.log('Container position:', computedStyle.position);
    console.log('Container display:', computedStyle.display);
    console.log('Container flex-direction:', computedStyle.flexDirection);
    console.log('Container flex-wrap:', computedStyle.flexWrap);
    
    // Check children
    var children = container.children;
    console.log('Number of children:', children.length);
    
    var totalChildWidth = 0;
    var totalChildHeight = 0;
    var maxChildRight = 0;
    var maxChildBottom = 0;
    
    if (children.length > 0) {
        var containerRect = container.getBoundingClientRect();
        console.log('Container rect:', containerRect);
        
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var childRect = child.getBoundingClientRect();
            var childComputedStyle = window.getComputedStyle(child);
            
            console.log('Child', i, ':', {
                offsetWidth: child.offsetWidth,
                offsetHeight: child.offsetHeight,
                offsetLeft: child.offsetLeft,
                offsetTop: child.offsetTop,
                rect: childRect,
                position: childComputedStyle.position,
                display: childComputedStyle.display
            });
            
            // Calculate relative to container
            var relativeRight = childRect.right - containerRect.left;
            var relativeBottom = childRect.bottom - containerRect.top;
            
            maxChildRight = Math.max(maxChildRight, relativeRight);
            maxChildBottom = Math.max(maxChildBottom, relativeBottom);
            
            // For flex/flow layouts, sum up widths/heights
            if (computedStyle.display === 'flex') {
                if (computedStyle.flexDirection === 'row' || !computedStyle.flexDirection || computedStyle.flexDirection === 'row-reverse') {
                    totalChildWidth += child.offsetWidth;
                } else {
                    totalChildHeight += child.offsetHeight;
                }
            } else {
                totalChildWidth += child.offsetWidth;
                totalChildHeight += child.offsetHeight;
            }
        }
        
        console.log('Total child width (sum):', totalChildWidth);
        console.log('Total child height (sum):', totalChildHeight);
        console.log('Max child right edge:', maxChildRight);
        console.log('Max child bottom edge:', maxChildBottom);
    }
    
    // Calculate overflow amounts
    var horizontalOverflow = Math.max(0, container.scrollWidth - container.clientWidth);
    var verticalOverflow = Math.max(0, container.scrollHeight - container.clientHeight);
    
    console.log('CALCULATED Horizontal overflow:', horizontalOverflow, 'px');
    console.log('CALCULATED Vertical overflow:', verticalOverflow, 'px');
    
    // Alternative calculation methods
    var altHorizontalOverflow = Math.max(0, maxChildRight - container.clientWidth);
    var altVerticalOverflow = Math.max(0, maxChildBottom - container.clientHeight);
    console.log('RECT-BASED Horizontal overflow:', altHorizontalOverflow, 'px');
    console.log('RECT-BASED Vertical overflow:', altVerticalOverflow, 'px');
    
    // Sum-based calculation (for flex layouts)
    var sumHorizontalOverflow = Math.max(0, totalChildWidth - container.clientWidth);
    var sumVerticalOverflow = Math.max(0, totalChildHeight - container.clientHeight);
    console.log('SUM-BASED Horizontal overflow:', sumHorizontalOverflow, 'px');
    console.log('SUM-BASED Vertical overflow:', sumVerticalOverflow, 'px');
    
    // Always auto-detect the primary overflow direction
    var finalHorizontalOverflow = Math.max(horizontalOverflow, altHorizontalOverflow, sumHorizontalOverflow);
    var finalVerticalOverflow = Math.max(verticalOverflow, altVerticalOverflow, sumVerticalOverflow);
    
    console.log('FINAL Horizontal overflow:', finalHorizontalOverflow, 'px');
    console.log('FINAL Vertical overflow:', finalVerticalOverflow, 'px');
    
    // Simple check - if scrollWidth > clientWidth, we have horizontal overflow
    if (container.scrollWidth > container.clientWidth) {
        console.log('SIMPLE CHECK: Horizontal overflow detected via scrollWidth');
        console.log('=== END OVERFLOW DETECTION DEBUG ===');
        return 'horizontal';
    }
    
    if (container.scrollHeight > container.clientHeight) {
        console.log('SIMPLE CHECK: Vertical overflow detected via scrollHeight');
        console.log('=== END OVERFLOW DETECTION DEBUG ===');
        return 'vertical';
    }

    console.log('No overflow detected via simple check');
    console.log('=== END OVERFLOW DETECTION DEBUG ===');
    return false;
}

function detectFlowOverflow(container) {
    var hasOverflow = false;
    
    console.log('=== SIMPLE OVERFLOW CHECK ===');
    console.log('scrollWidth:', container.scrollWidth, 'clientWidth:', container.clientWidth);
    console.log('scrollHeight:', container.scrollHeight, 'clientHeight:', container.clientHeight);
    
    // IMMEDIATE CHECK - this should catch your case
    if (container.scrollWidth > container.clientWidth) {
        console.log('HORIZONTAL OVERFLOW DETECTED - returning horizontal');
        return 'horizontal';
    }
    
    if (container.scrollHeight > container.clientHeight) {
        console.log('VERTICAL OVERFLOW DETECTED - returning vertical');
        return 'vertical';
    }
    
    console.log('NO OVERFLOW DETECTED - returning false');
    return false;
    
    if (container.scrollWidth > container.clientWidth) {
        hasOverflow = 'horizontal';
        console.log('Horizontal overflow detected:', container.scrollWidth, '>', container.clientWidth);
    }
    
    if (container.scrollHeight > container.clientHeight) {
        hasOverflow = hasOverflow ? 'both' : 'vertical';
        console.log('Vertical overflow detected:', container.scrollHeight, '>', container.clientHeight);
    }
    
    if (!hasOverflow) {
        console.log('No overflow detected');
    }
    
    return hasOverflow;
}

function detectAbsoluteOverflow(container) {
    var children = $(container).children().get();
    var containerRect = container.getBoundingClientRect();
    var hasHorizontalOverflow = false;
    var hasVerticalOverflow = false;
    
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var childRect = child.getBoundingClientRect();
        
        // Always check both types of overflow
        if (childRect.right > containerRect.right || childRect.left < containerRect.left) {
            hasHorizontalOverflow = true;
        }
        
        if (childRect.bottom > containerRect.bottom || childRect.top < containerRect.top) {
            hasVerticalOverflow = true;
        }
    }
    
    // Return the detected overflow type
    if (hasHorizontalOverflow && hasVerticalOverflow) return 'both';
    if (hasHorizontalOverflow) return 'horizontal';
    if (hasVerticalOverflow) return 'vertical';
    
    return false;
}

function measureElements(container) {
    var containerInfo = getContainerInfo(container);
    var children = $(container).children().get();
    var measurements = [];
    
    console.log('=== MEASURING ELEMENTS ===');
    console.log('Container:', container);
    console.log('Number of children:', children.length);
    
    // Check for scaling transforms
    var scaleFactor = 1;
    var element = container;
    while (element && element !== document.body.parentNode) {
        var computedStyle = window.getComputedStyle(element);
        var transform = computedStyle.transform;
        console.log('Element transform:', element.tagName, element.className, 'transform:', transform);
        
        if (transform && transform !== 'none') {
            // Parse scale from transform matrix
            var matrix = transform.match(/matrix\(([^)]+)\)/);
            if (matrix) {
                var values = matrix[1].split(',').map(parseFloat);
                var scaleX = values[0];
                var scaleY = values[3];
                console.log('Found transform matrix - scaleX:', scaleX, 'scaleY:', scaleY);
                scaleFactor *= scaleY; // Use Y scale for height calculations
            }
        }
        element = element.parentElement;
    }
    
    console.log('Final scale factor:', scaleFactor);
    
    if (containerInfo.isAbsolute) {
        var containerRect = container.getBoundingClientRect();
        
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var childRect = child.getBoundingClientRect();
            
            // Use unscaled measurements for absolute positioned elements
            var unscaledWidth = childRect.width / scaleFactor;
            var unscaledHeight = childRect.height / scaleFactor;
            measurements.push({
                element: child,
                width: unscaledWidth,
                height: unscaledHeight,
                left: childRect.left - containerRect.left,
                top: childRect.top - containerRect.top,
                right: (childRect.right - containerRect.left) / scaleFactor,
                bottom: (childRect.bottom - containerRect.top) / scaleFactor
            });
        }
    } else {
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            
            // Get all possible height measurements
            var offsetHeight = child.offsetHeight;
            var clientHeight = child.clientHeight;
            var scrollHeight = child.scrollHeight;
            var boundingHeight = child.getBoundingClientRect().height;
            var computedStyle = window.getComputedStyle(child);
            var computedHeight = parseFloat(computedStyle.height);
            
            // Use unscaled measurements - divide by scale factor to get original size
            var unscaledOffsetHeight = offsetHeight / scaleFactor;
            var unscaledBoundingHeight = boundingHeight / scaleFactor;
            var unscaledOffsetWidth = child.offsetWidth / scaleFactor;
            
            console.log('Child', i, 'height measurements:', {
                offsetHeight: offsetHeight,
                unscaledOffsetHeight: unscaledOffsetHeight,
                clientHeight: clientHeight,
                scrollHeight: scrollHeight,
                boundingHeight: boundingHeight,
                unscaledBoundingHeight: unscaledBoundingHeight,
                computedHeight: computedHeight,
                marginTop: computedStyle.marginTop,
                marginBottom: computedStyle.marginBottom,
                paddingTop: computedStyle.paddingTop,
                paddingBottom: computedStyle.paddingBottom,
                scaleFactor: scaleFactor
            });
            
            // Use unscaled measurements for grouping calculations
            var finalHeight = unscaledOffsetHeight;
            var finalWidth = unscaledOffsetWidth;
            
            measurements.push({
                element: child,
                width: finalWidth,
                height: finalHeight,
                left: child.offsetLeft,
                top: child.offsetTop,
                right: child.offsetLeft + finalWidth,
                bottom: child.offsetTop + finalHeight
            });
        }
    }
    
    console.log('Final measurements:', measurements);
    console.log('=== END MEASURING ELEMENTS ===');
    return measurements;
}

function getVisibleItemsStandard(measurements, containerWidth, containerHeight, overflowDirection) {
    var groups = [];
    var currentGroup = [];
    var currentGroupHeight = 0;
    
    console.log('getVisibleItemsStandard called with:', measurements.length, 'items');
    console.log('Container dimensions:', containerWidth, 'x', containerHeight, 'Direction:', overflowDirection);
    
    for (var i = 0; i < measurements.length; i++) {
        var item = measurements[i];
        console.log('Processing item', i, 'width:', item.width, 'height:', item.height);
        
        // Since items are flowing top-to-bottom, we add heights and check against container height
        var wouldFit = (currentGroupHeight + item.height <= containerHeight);
        
        console.log('Current group height:', currentGroupHeight, 
                   'Item size:', item.width, 'x', item.height, 'Would fit:', wouldFit);
        
        if (wouldFit) {
            currentGroup.push(item.element);
            currentGroupHeight += item.height;
            console.log('Added to current group. New group height:', currentGroupHeight);
        } else {
            // Current item doesn't fit, finalize current group and start new one
            if (currentGroup.length > 0) {
                groups.push(currentGroup);
                console.log('Finalized group with', currentGroup.length, 'items');
            }
            currentGroup = [item.element];
            currentGroupHeight = item.height;
            console.log('Started new group with item', i);
        }
    }
    
    // Add the last group
    if (currentGroup.length > 0) {
        groups.push(currentGroup);
        console.log('Added final group with', currentGroup.length, 'items');
    }
    
    console.log('Total groups created:', groups.length);
    return groups;
}

function getVisibleItemsEvenDistribution(measurements, containerWidth, containerHeight, overflowDirection) {
    var standardGroups = getVisibleItemsStandard(measurements, containerWidth, containerHeight, overflowDirection);
    
    if (standardGroups.length <= 1) {
        return standardGroups;
    }
    
    var totalItems = measurements.length;
    var numGroups = standardGroups.length;
    var itemsPerGroup = Math.ceil(totalItems / numGroups);
    
    var evenGroups = [];
    var currentIndex = 0;
    
    for (var groupIndex = 0; groupIndex < numGroups && currentIndex < totalItems; groupIndex++) {
        var group = [];
        var groupHeight = 0;
        var itemsInGroup = 0;
        
        while (currentIndex < totalItems && itemsInGroup < itemsPerGroup) {
            var item = measurements[currentIndex];
            
            // Since items flow top-to-bottom, check if adding this item's height would exceed container height
            var wouldFit = (groupHeight + item.height <= containerHeight);
            
            if (wouldFit) {
                group.push(item.element);
                groupHeight += item.height;
                itemsInGroup++;
                currentIndex++;
            } else {
                if (itemsInGroup === 0) {
                    group.push(item.element);
                    itemsInGroup++;
                    currentIndex++;
                }
                break;
            }
        }
        
        if (group.length > 0) {
            evenGroups.push(group);
        }
    }
    
    if (currentIndex < totalItems) {
        var remainingGroup = [];
        for (var i = currentIndex; i < totalItems; i++) {
            remainingGroup.push(measurements[i].element);
        }
        if (remainingGroup.length > 0) {
            evenGroups.push(remainingGroup);
        }
    }
    
    return evenGroups;
}

// Global rotation function - can be called from anywhere
function setupRotation(targetZones, options) {
    var settings = $.extend({
        evenDistribution: true,
        cycle: 8000,
        delay: 0,
        animation: 'fade',
        animationDuration: 800,
        pauseOnHover: true,
        pauseWhenHidden: true,
        respondToTrmPlaying: true
    }, options);
    
    // Clean up existing rotation controllers for these zones
    $(targetZones).each(function() {
        var existingController = $(this).data('rotationController');
        if (existingController) {
            existingController.destroy();
            $(this).removeData('rotationController');
        }
    });
    
    // Setup rotation for each target zone
    $(targetZones).each(function(index) {
        var $container = $(this);
        
        // Check if this container has overflow and needs rotation - BEFORE any styling changes
        var overflowType = detectOverflow(this); // Auto-detect overflow direction
        
        console.log('Overflow check result for', $container.attr('id') || $container.attr('class'), ':', overflowType);
        
        if (overflowType) {
            // Calculate delay for this zone (index-based offset)
            var zoneSettings = $.extend({}, settings);
            zoneSettings.delay = settings.delay * index;
            
            console.log('Creating rotation controller with delay:', zoneSettings.delay);
            
            // Create individual rotation controller for this zone
            var rotationController = new RotationController(this, zoneSettings);
            
            // Store controller and state on the element for debugging
            $container.data('rotationController', rotationController);
            $container.attr('data-rotation-active', 'true');
            $container.attr('data-rotation-direction', 'none');
            $container.attr('data-rotation-animation', settings.animation);
            $container.attr('data-rotation-cycle', settings.cycle);
            $container.attr('data-rotation-delay', zoneSettings.delay);
            
            console.log('Rotation setup for zone:', $container.attr('id') || $container.attr('class'));
        } else {
            // Mark as no rotation needed
            $container.attr('data-rotation-active', 'false');
            $container.attr('data-rotation-reason', 'no-overflow');
            console.log('No rotation needed for:', $container.attr('id') || $container.attr('class'));
        }
    });
}

function createRotationPlan(container, evenDistribution) {
    // Don't detect overflow here - it should already be detected before any styling changes
    // Just use the stored overflow type from the container
    var overflowType = detectOverflow(container);
    
    if (!overflowType) {
        var allChildren = $(container).children().get();
        return [allChildren];
    }
    
    var measurements = measureElements(container);
    var containerWidth = container.clientWidth;
    var containerHeight = container.clientHeight;
    
    if (evenDistribution) {
        return getVisibleItemsEvenDistribution(measurements, containerWidth, containerHeight, overflowType);
    } else {
        return getVisibleItemsStandard(measurements, containerWidth, containerHeight, overflowType);
    }
}

// Main rotation controller
function RotationController(container, options) {
    var settings = $.extend({
        evenDistribution: false,
        cycle: 8000,
        delay: 0,
        animation: 'fade',
        animationDuration: 800,
        pauseOnHover: true,
        pauseWhenHidden: true,
        respondToTrmPlaying: true
    }, options);
    
    this.container = container;
    this.settings = settings;
    this.rotationGroups = [];
    this.groupWrappers = [];
    this.currentGroupIndex = 0;
    this.isAnimating = false;
    this.intervalId = null;
    this.delayTimeoutId = null;
    this.isPaused = false;
    this.isHidden = false;
    this.trmPlaying = true;
    this.mutationObserver = null;
    this.intersectionObserver = null;
    this.originalChildren = [];
    
    this.init();
}

RotationController.prototype.init = function() {
    var $container = $(this.container);
    
    // Add debug attributes
    $container.attr('data-rotation-state', 'initializing');
    
    // Store the detected overflow type for later use
    var overflowType = detectOverflow(this.container);
    $container.attr('data-detected-overflow', overflowType || 'none');
    
    this.storeOriginalChildren();
    this.recalculateGroups();
    
    if (this.rotationGroups.length > 1) {
        $container.attr('data-rotation-groups', this.rotationGroups.length);
        this.createGroupWrappers();
        this.setupInitialState();
        this.setupHoverPause();
        this.setupVisibilityObserver();
        this.setupMutationObserver();
        this.setupTrmPlayingListener();
        $container.attr('data-rotation-state', 'active');
        this.start();
    } else {
        $container.attr('data-rotation-state', 'single-group');
        $container.attr('data-rotation-groups', this.rotationGroups.length);
    }
};

RotationController.prototype.storeOriginalChildren = function() {
    this.originalChildren = $(this.container).children().get();
};

RotationController.prototype.restoreOriginalChildren = function() {
    var self = this;
    var $container = $(this.container);
    
    // Move all children back to original container before clearing wrappers
    this.groupWrappers.forEach(function(wrapper) {
        while (wrapper.firstChild) {
            self.container.appendChild(wrapper.firstChild);
        }
    });
};

RotationController.prototype.createGroupWrappers = function() {
    var self = this;
    var $container = $(this.container);
    
    // Clear existing wrappers
    this.destroyGroupWrappers();
    
    // Get computed styles from container to inherit
    var containerStyles = window.getComputedStyle(this.container);
    var inheritableStyles = {
        'display': containerStyles.display === 'flex' ? 'flex' : containerStyles.display,
        'flex-direction': containerStyles.flexDirection,
        'flex-wrap': containerStyles.flexWrap,
        'justify-content': containerStyles.justifyContent,
        'align-items': containerStyles.alignItems,
        'align-content': containerStyles.alignContent,
        'gap': containerStyles.gap,
        'grid-template-columns': containerStyles.gridTemplateColumns,
        'grid-template-rows': containerStyles.gridTemplateRows,
        'grid-gap': containerStyles.gridGap
    };
    
    // Create wrapper for each rotation group
    this.rotationGroups.forEach(function(group, index) {
        var wrapper = document.createElement('div');
        wrapper.className = 'rotation-group-wrapper';
        wrapper.setAttribute('data-group-index', index);
        
        // Apply inherited styles
        Object.keys(inheritableStyles).forEach(function(property) {
            var value = inheritableStyles[property];
            if (value && value !== 'none' && value !== 'normal') {
                wrapper.style[property] = value;
            }
        });
        
        // Additional wrapper styles
        wrapper.style.position = 'absolute';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        // Don't set overflow hidden on wrappers - let content flow naturally
        // wrapper.style.overflow = 'hidden';
        
        // Move group items into wrapper
        group.forEach(function(item) {
            wrapper.appendChild(item);
        });
        
        self.groupWrappers.push(wrapper);
        $container.append(wrapper);
    });
    
    // Make container relative if it's not positioned
    var containerPosition = containerStyles.position;
    if (containerPosition === 'static' || !containerPosition) {
        this.container.style.position = 'relative';
    }
    
    // Only set overflow hidden on the main container AFTER we've created all wrappers
    this.container.style.overflow = 'hidden';
};

RotationController.prototype.destroyGroupWrappers = function() {
    var self = this;
    
    // Move all children back to original container
    this.groupWrappers.forEach(function(wrapper) {
        while (wrapper.firstChild) {
            self.container.appendChild(wrapper.firstChild);
        }
        if (wrapper.parentNode) {
            wrapper.parentNode.removeChild(wrapper);
        }
    });
    
    this.groupWrappers = [];
};

RotationController.prototype.recalculateGroups = function() {
    var oldGroupsLength = this.rotationGroups.length;
    this.rotationGroups = createRotationPlan(this.container, this.settings.evenDistribution);
    
    if (oldGroupsLength !== this.rotationGroups.length) {
        this.currentGroupIndex = 0;
    }
    
    if (this.rotationGroups.length <= 1) {
        this.stop();
        this.destroyGroupWrappers();
        this.showAllItems();
    } else if (oldGroupsLength <= 1 && this.rotationGroups.length > 1) {
        this.createGroupWrappers();
        this.setupInitialState();
        this.start();
    } else {
        this.createGroupWrappers();
        this.setupInitialState();
    }
};

RotationController.prototype.setupMutationObserver = function() {
    var self = this;
    
    if (window.MutationObserver) {
        this.mutationObserver = new MutationObserver(function(mutations) {
            var shouldRecalculate = false;
            var hasChildListChanges = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    hasChildListChanges = true;
                    shouldRecalculate = true;
                } else if (
                    (mutation.type === 'attributes' && 
                     (mutation.attributeName === 'style' || mutation.attributeName === 'class'))) {
                    shouldRecalculate = true;
                }
            });
            
            if (shouldRecalculate) {
                // If children were added/removed, we need to handle it specially
                if (hasChildListChanges) {
                    self.handleContentChange();
                } else {
                    // Just style changes, simple recalculation
                    self.recalculateGroups();
                }
            }
        });
        
        this.mutationObserver.observe(this.container, {
            childList: true,
            attributes: true,
            subtree: false, // Only watch direct children changes
            attributeFilter: ['style', 'class']
        });
    }
};

RotationController.prototype.handleContentChange = function() {
    var self = this;
    
    // Clear any pending recalculation
    clearTimeout(this.recalculateTimeout);
    
    this.recalculateTimeout = setTimeout(function() {
        // Check if container still has children
        var currentChildren = $(self.container).children().not('.rotation-group-wrapper').get();
        
        if (currentChildren.length === 0) {
            // Content was cleared - stop rotation and clean up
            self.stop();
            self.destroyGroupWrappers();
            return;
        }
        
        // Content was updated - recalculate with new children
        self.storeOriginalChildren();
        self.recalculateGroups();
    }, 50); // Short delay to handle rapid DOM changes
};

RotationController.prototype.recalculateGroups = function() {
    var oldGroupsLength = this.rotationGroups.length;
    var wasRotating = this.intervalId !== null;
    
    // Get current children (excluding our wrappers)
    var currentChildren = $(this.container).children().not('.rotation-group-wrapper').get();
    
    if (currentChildren.length === 0) {
        this.rotationGroups = [];
        this.stop();
        this.destroyGroupWrappers();
        return;
    }
    
    // Temporarily restore children to container for measurement
    this.restoreOriginalChildren();
    
    // Recalculate groups with current children
    this.rotationGroups = createRotationPlan(this.container, this.settings.evenDistribution);
    
    if (oldGroupsLength !== this.rotationGroups.length) {
        this.currentGroupIndex = 0;
    }
    
    if (this.rotationGroups.length <= 1) {
        this.stop();
        this.destroyGroupWrappers();
        this.showAllItems();
    } else if (oldGroupsLength <= 1 && this.rotationGroups.length > 1) {
        this.createGroupWrappers();
        this.setupInitialState();
        if (wasRotating) {
            this.start();
        }
    } else {
        this.createGroupWrappers();
        this.setupInitialState();
    }
    
    // Handle window resize with debouncing
    var self = this;
    $(window).off('resize.rotationController').on('resize.rotationController', function() {
        clearTimeout(self.recalculateTimeout);
        self.recalculateTimeout = setTimeout(function() {
            self.recalculateGroups();
        }, 100);
    });
};

RotationController.prototype.setupVisibilityObserver = function() {
    var self = this;
    
    if (!this.settings.pauseWhenHidden) return;
    
    console.log('Setting up visibility event listener');
    
    // Use the browser's built-in visibility change event
    this.visibilityChangeHandler = function() {
        var wasHidden = self.isHidden;
        self.isHidden = document.hidden;
        
        console.log('Visibility changed - document.hidden:', document.hidden, 'isHidden:', self.isHidden);
        
        if (wasHidden !== self.isHidden) {
            console.log('Visibility state changed, updating play state');
            self.updatePlayState();
        }
    };
    
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    
    // Set initial state
    this.isHidden = document.hidden;
    console.log('Initial visibility state - isHidden:', this.isHidden);
};

RotationController.prototype.setupTrmPlayingListener = function() {
    var self = this;
    
    if (!this.settings.respondToTrmPlaying) return;
    
    window.addEventListener('trmPlayingChanged', function(event) {
        self.trmPlaying = event.detail.playing;
        self.updatePlayState();
    });
};

RotationController.prototype.isElementVisible = function() {
    var rect = this.container.getBoundingClientRect();
    var isVisible = rect.width > 0 && rect.height > 0 && 
           rect.bottom > 0 && rect.right > 0 && 
           rect.top < window.innerHeight && rect.left < window.innerWidth;
    
    console.log('isElementVisible check:', {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        windowHeight: window.innerHeight,
        windowWidth: window.innerWidth,
        isVisible: isVisible
    });
    
    return isVisible;
};

RotationController.prototype.updatePlayState = function() {
    var shouldPlay = this.trmPlaying && !this.isHidden && !this.isPaused;
    
    console.log('updatePlayState - trmPlaying:', this.trmPlaying, 'isHidden:', this.isHidden, 'isPaused:', this.isPaused, 'shouldPlay:', shouldPlay);
    
    if (shouldPlay && !this.intervalId) {
        console.log('Starting rotation due to play state change');
        this.start();
    } else if (!shouldPlay && (this.intervalId || this.delayTimeoutId)) {
        console.log('Stopping rotation due to play state change');
        this.stop();
    }
};

RotationController.prototype.showAllItems = function() {
    $(this.container).children().show().css({
        opacity: '',
        transform: '',
        position: '',
        left: '',
        top: ''
    });
};

RotationController.prototype.setupInitialState = function() {
    this.groupWrappers.forEach(function(wrapper, index) {
        if (index === 0) {
            $(wrapper).show();
        } else {
            $(wrapper).hide();
        }
    });
};

RotationController.prototype.setupHoverPause = function() {
    var self = this;
    
    if (this.settings.pauseOnHover) {
        $(this.container).on('mouseenter', function() {
            self.pause();
        }).on('mouseleave', function() {
            self.resume();
        });
    }
};

RotationController.prototype.start = function() {
    var self = this;
    var $container = $(this.container);
    
    if (this.intervalId) {
        clearInterval(this.intervalId);
    }
    
    if (this.delayTimeoutId) {
        clearTimeout(this.delayTimeoutId);
    }
    
    $container.attr('data-rotation-timer', 'running');
    
    // Start with delay if specified
    if (this.settings.delay > 0) {
        $container.attr('data-rotation-timer', 'delayed');
        this.delayTimeoutId = setTimeout(function() {
            self.delayTimeoutId = null;
            $container.attr('data-rotation-timer', 'running');
            
            // Start the regular interval after delay
            self.intervalId = setInterval(function() {
                if (!self.isPaused && !self.isAnimating && !self.isHidden && self.trmPlaying) {
                    self.rotateToNext();
                }
            }, self.settings.cycle);
        }, this.settings.delay);
    } else {
        // Start immediately if no delay
        this.intervalId = setInterval(function() {
            if (!self.isPaused && !self.isAnimating && !self.isHidden && self.trmPlaying) {
                self.rotateToNext();
            }
        }, this.settings.cycle);
    }
};

RotationController.prototype.stop = function() {
    var $container = $(this.container);
    
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
    
    if (this.delayTimeoutId) {
        clearTimeout(this.delayTimeoutId);
        this.delayTimeoutId = null;
    }
    
    $container.attr('data-rotation-timer', 'stopped');
};

RotationController.prototype.pause = function() {
    var $container = $(this.container);
    
    if (!this.isPaused) {
        this.isPaused = true;
        $container.attr('data-rotation-paused', 'true');
    }
};

RotationController.prototype.resume = function() {
    var $container = $(this.container);
    
    if (this.isPaused) {
        this.isPaused = false;
        $container.attr('data-rotation-paused', 'false');
        this.updatePlayState();
    }
};

RotationController.prototype.rotateToNext = function() {
    if (this.isAnimating || this.groupWrappers.length <= 1) {
        return;
    }
    
    var $container = $(this.container);
    this.isAnimating = true;
    $container.attr('data-rotation-animating', 'true');
    
    var currentWrapper = this.groupWrappers[this.currentGroupIndex];
    var nextIndex = (this.currentGroupIndex + 1) % this.groupWrappers.length;
    var nextWrapper = this.groupWrappers[nextIndex];
    
    $container.attr('data-rotation-current-group', this.currentGroupIndex);
    $container.attr('data-rotation-next-group', nextIndex);
    
    var animation = RotationAnimations.get(this.settings.animation);
    var self = this;
    
    animation(this.container, currentWrapper, nextWrapper, this.settings.animationDuration, function() {
        self.currentGroupIndex = nextIndex;
        $container.attr('data-rotation-current-group', nextIndex);
        $container.attr('data-rotation-animating', 'false');
        self.isAnimating = false;
    });
};

RotationController.prototype.rotateTo = function(groupIndex) {
    if (this.isAnimating || groupIndex < 0 || groupIndex >= this.groupWrappers.length) {
        return;
    }
    
    if (groupIndex === this.currentGroupIndex) {
        return;
    }
    
    this.isAnimating = true;
    
    var currentWrapper = this.groupWrappers[this.currentGroupIndex];
    var targetWrapper = this.groupWrappers[groupIndex];
    
    var animation = RotationAnimations.get(this.settings.animation);
    var self = this;
    
    animation(this.container, currentWrapper, targetWrapper, this.settings.animationDuration, function() {
        self.currentGroupIndex = groupIndex;
        self.isAnimating = false;
    });
};

RotationController.prototype.destroy = function() {
    var $container = $(this.container);
    
    this.stop();
    
    // Restore original children before cleanup
    this.restoreOriginalChildren();
    
    if (this.mutationObserver) {
        this.mutationObserver.disconnect();
    }
    
    if (this.visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
    
    if (this.visibilityCheckInterval) {
        clearInterval(this.visibilityCheckInterval);
    }
    
    if (this.recalculateTimeout) {
        clearTimeout(this.recalculateTimeout);
    }
    
    $(this.container).off('mouseenter mouseleave');
    $(window).off('resize.rotationController');
    
    this.destroyGroupWrappers();
    this.showAllItems();
    
    // Clean up debug attributes
    $container.removeAttr('data-rotation-active data-rotation-state data-rotation-groups data-rotation-timer data-rotation-paused data-rotation-animating data-rotation-current-group data-rotation-next-group data-rotation-direction data-rotation-animation data-rotation-cycle data-rotation-delay data-rotation-reason');
};