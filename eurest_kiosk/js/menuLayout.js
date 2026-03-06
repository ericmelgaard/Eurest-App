"use strict";
//Publisher: Wand Digital
//Date: 09.09.2025
//Version: 60.1
var IMSintegration;
(function (wandDigital) {
    var MenuLayout = (function () {
        function MenuLayout() {
            this.timeOuts = [];
            this.playlist = false;
            this.isRotating = false;
        }
        MenuLayout.prototype.init = function (IMSItems, IMSProducts, IMSSettings, integrationItems, API) {
            if (!API) {
                return;
            }
            try {
                this.handleSettings(IMSSettings);
            } catch (e) {
                console.error("Error in MenuLayout handleSettings: ", e);
                IMSintegration.Integration.prototype.showConnect(true, "Red", "handleSettings", e, "error");
            }
            try {
                this.injectPricing(IMSProducts);
            } catch (e) {
                console.error("Error in MenuLayout injectPricing: ", e);
                IMSintegration.Integration.prototype.showConnect(true, "Red", "injectPricing", e, "error");
            }
            try {
                this.handleProducts(IMSProducts);
            } catch (e) {
                console.error("Error in MenuLayout handleProducts: ", e);
                IMSintegration.Integration.prototype.showConnect(true, "Red", "handleProducts", e, "error");
            }
            try {
                this.handleLayout(IMSSettings);
            } catch (e) {
                console.error("Error in MenuLayout handleLayout: ", e);
                IMSintegration.Integration.prototype.showConnect(true, "Red", "handleLayout", e, "error");
            }
            try {
                this.fillDynamic(IMSItems, integrationItems);
            } catch (e) {
                console.error("Error in MenuLayout fillDynamic: ", e);
                IMSintegration.Integration.prototype.showConnect(true, "Red", "fillDynamic", e, "error");
            }

            //optional starts
            try {
                this.rotateEles();
            } catch (e) {
                console.error("Error in MenuLayout rotateEles: ", e);
                IMSintegration.Integration.prototype.showConnect(true, "Red", "rotateEles", e, "error");
            }
            //nutrtion overlay handlers
            //requires adding data objects to each item with nutritionLabelTemplate
            // try {
            //     setupNutritionOverlayHandlers(nutritionLabelTemplate);
            // } catch (e) {
            //     console.error("Error in MenuLayout setupNutritionOverlayHandlers: ", e);
            // }
        };
        MenuLayout.prototype.handleSettings = function (IMSSettings) {
            var _this = this;
            if (!IMSSettings || IMSSettings.length === 0) {
                return;
            }
        };
        MenuLayout.prototype.handleLayout = function (IMSSettings) {
            var _this = this;
            return "did not implement handleLayout";
        };
        MenuLayout.prototype.handleProducts = function (IMSProducts) {
            var _this = this;
            if (!IMSProducts || IMSProducts.length === 0) {
                return;
            }
        };
        MenuLayout.prototype.fillDynamic = function (IMSItems, integrationItems) {
            var _this = this;
            var items = integrationItems.filter(function (item) {return !item.hidden;});

            var itemsByCategory = {};
            items.forEach(function(item) {
                if (!itemsByCategory[item.category]) {
                    itemsByCategory[item.category] = [];
                }
                itemsByCategory[item.category].push(item);
            });

            _this.itemsByCategory = itemsByCategory;
            _this.renderStationGrid();
            _this.setupEventHandlers();

            return true;
        };

        MenuLayout.prototype.renderStationGrid = function() {
            var _this = this;
            var $wrapper = $(".asset-wrapper");
            $wrapper.removeClass('blur');
            $wrapper.empty();

            var stationsHTML = '<div class="kiosk-container">';
            stationsHTML += '<div class="kiosk-header">';
            stationsHTML += '<h1 class="kiosk-title">Explore Our Stations</h1>';
            stationsHTML += '<p class="kiosk-subtitle">Choose a station to view available menu items</p>';
            stationsHTML += '</div>';
            stationsHTML += '<div class="stations-grid">';

            Object.keys(_this.itemsByCategory).forEach(function(category) {
                stationsHTML += '<div class="station-card" data-category="' + category + '">';
                stationsHTML += '<h2 class="station-name">' + category + '</h2>';
                stationsHTML += '</div>';
            });

            stationsHTML += '</div></div>';
            $wrapper.html(stationsHTML);
        };

        MenuLayout.prototype.renderStationItems = function(category) {
            var _this = this;
            var $wrapper = $(".asset-wrapper");
            $wrapper.empty();

            var items = _this.itemsByCategory[category] || [];

            var itemsHTML = '<div class="kiosk-container">';
            itemsHTML += '<div class="kiosk-header with-back">';
            itemsHTML += '<button class="back-button" id="back-to-stations">';
            itemsHTML += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
            itemsHTML += '<path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
            itemsHTML += '</button>';
            itemsHTML += '<h1 class="kiosk-title">' + category + '</h1>';
            itemsHTML += '</div>';
            itemsHTML += '<div class="items-grid">';

            items.forEach(function(item) {
                itemsHTML += '<div class="menu-item-card" data-item-id="' + (item.id || item.name) + '">';
                itemsHTML += '<div class="item-header">';
                itemsHTML += '<h3 class="item-name">' + item.name + '</h3>';
                itemsHTML += '<span class="item-price">' + (item.price || '$0.00') + '</span>';
                itemsHTML += '</div>';

                if (item.description) {
                    itemsHTML += '<p class="item-desc">' + item.description + '</p>';
                }

                itemsHTML += '<div class="item-footer">';

                if (item.calories) {
                    itemsHTML += '<span class="item-cal">';
                    itemsHTML += '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>';
                    itemsHTML += item.calories + ' cal';
                    itemsHTML += '</span>';
                }

                if (item.serving_size) {
                    itemsHTML += '<span class="item-serving">' + item.serving_size + '</span>';
                }

                if (item.dietary_icons && item.dietary_icons.length > 0) {
                    itemsHTML += '<div class="dietary-icons">';
                    item.dietary_icons.forEach(function(icon) {
                        itemsHTML += '<img src="media/icon_' + icon + '.png" alt="' + icon + '" class="dietary-icon">';
                    });
                    itemsHTML += '</div>';
                }

                itemsHTML += '</div></div>';
            });

            itemsHTML += '</div></div>';
            $wrapper.html(itemsHTML);

            _this.setupItemClickHandlers(items);
        };

        MenuLayout.prototype.setupEventHandlers = function() {
            var _this = this;

            $(document).off('click', '.station-card').on('click', '.station-card', function() {
                var category = $(this).data('category');
                _this.renderStationItems(category);
            });

            $(document).off('click', '#back-to-stations').on('click', '#back-to-stations', function() {
                _this.renderStationGrid();
            });
        };

        MenuLayout.prototype.setupItemClickHandlers = function(items) {
            var itemsMap = {};
            items.forEach(function(item) {
                itemsMap[item.id || item.name] = item;
            });

            $(document).off('click', '.menu-item-card').on('click', '.menu-item-card', function() {
                var itemId = $(this).data('item-id');
                var item = itemsMap[itemId];
                if (item) {
                    showNutritionModal(item);
                }
            });
        };

        function showNutritionModal(item) {
            var $modal = $('#item-modal');

            $('#modal-title').text(item.name);
            $('#modal-price').text(item.price || '$0.00');
            $('#modal-calories').text(item.calories ? item.calories + ' calories' : '');
            $('#modal-serving').text(item.serving_size || '');
            $('#modal-description').text(item.description || '');

            var iconsHTML = '';
            if (item.dietary_icons && item.dietary_icons.length > 0) {
                item.dietary_icons.forEach(function(icon) {
                    iconsHTML += '<img src="media/icon_' + icon + '.png" alt="' + icon + '" class="dietary-icon">';
                });
            }
            $('#modal-icons').html(iconsHTML);

            $('#modal-ingredients').text(item.ingredients || 'Not available');

            if (item.allergens && item.allergens.length > 0) {
                $('#allergens-section').show();
                $('#modal-allergens').text(item.allergens.join(', '));
            } else {
                $('#allergens-section').hide();
            }

            if (item.nutrition) {
                var n = item.nutrition;
                $('#nutrition-serving').text('Serving Size ' + (item.serving_size || '1 serving'));
                $('#nutrition-calories').text(n.calories || '0');
                $('#nutrition-fat').text(n.total_fat || '0');
                $('#nutrition-fat-dv').text(n.total_fat_dv || '0');
                $('#nutrition-sat-fat').text(n.saturated_fat || '0');
                $('#nutrition-sat-fat-dv').text(n.saturated_fat_dv || '0');
                $('#nutrition-trans-fat').text(n.trans_fat || '0');
                $('#nutrition-cholesterol').text(n.cholesterol || '0');
                $('#nutrition-cholesterol-dv').text(n.cholesterol_dv || '0');
                $('#nutrition-sodium').text(n.sodium || '0');
                $('#nutrition-sodium-dv').text(n.sodium_dv || '0');
                $('#nutrition-carbs').text(n.total_carbohydrate || '0');
                $('#nutrition-carbs-dv').text(n.total_carbohydrate_dv || '0');
                $('#nutrition-fiber').text(n.dietary_fiber || '0');
                $('#nutrition-fiber-dv').text(n.dietary_fiber_dv || '0');
                $('#nutrition-sugars').text(n.total_sugars || '0');
                $('#nutrition-protein').text(n.protein || '0');
                $('#nutrition-vitamin-d').text(n.vitamin_d || '0');
                $('#nutrition-vitamin-d-dv').text(n.vitamin_d_dv || '0');
                $('#nutrition-calcium').text(n.calcium || '0');
                $('#nutrition-calcium-dv').text(n.calcium_dv || '0');
                $('#nutrition-iron').text(n.iron || '0');
                $('#nutrition-iron-dv').text(n.iron_dv || '0');
                $('#nutrition-potassium').text(n.potassium || '0');
                $('#nutrition-potassium-dv').text(n.potassium_dv || '0');
            }

            $modal.removeAttr('hidden');

            $('#modal-close').off('click').on('click', function() {
                $modal.attr('hidden', true);
            });

            $('.modal-overlay').off('click').on('click', function() {
                $modal.attr('hidden', true);
            });
        }
        MenuLayout.prototype.clearMenuItems = function (zone) {
            var containers = $(zone).get();
            containers.forEach(function (container) {
                while (container.hasChildNodes()) {
                    container.removeChild(container.lastChild);
                }
            });
        };
        MenuLayout.prototype.rotateEles = function () {
            if (this.isRotating) {return;}

            //**rotate menu zones*/
            // rotateZones($("#zone_one"), {
            //     delay: 1,
            //     cycle: 8,
            //     fill: 'packed',
            //     transition: 'fade'
            // });

            //**rotate entire menu section - full screen */
            // rotateMenus("#zone_one", {
            //     delay:0,
            //     cycle: 8,
            //     transition: 'fade'
            // });

            this.isRotating = true;
            return;
        };
        //Date: 02.01.2025 adjusted for new trm playing logic
        MenuLayout.prototype.trmAnimate = function (playing, firstRun) {
            //called with playing each time asset plays in digital client. _this is accessible
            var _this = this;
            //handle first run tasks and non-playlist observer actions
            if (firstRun) {
                //setup observer
                animate();
                $("video").on("ended", animate);
                if (isCF || platform === "windows") {
                    document.reloadAsset = function () { animate(); };
                }
                return;
            }
            //handle playing messages

            if (playing && _this.playlist) {
                //add observer back if removed so video can loop if duration is > video length
                $("video").on("ended", animate)
                animate();
            }
            if (!playing) {
                //clear any observers if asset in a playlist
                $("video").off("ended")
                _this.playlist = true;

                //exiting actions
            }
            //set up aniumation functions
            function clearAllTimeouts() {
                _this.timeOuts.forEach(function (timeout) {
                    clearTimeout(timeout);
                });
            }

            function animate() {
                //simulate video loop
                $('video').each(function () {
                    this.play();
                });

                //playing actions
            }
        };
        MenuLayout.prototype.injectPricing = function (IMSProducts, IMSSettings) {
            var _this = this;
            if (!IMSProducts || IMSProducts.length === 0) {
                return;
            }
            IMSProducts.forEach(function (each) {
                if (each.productId && each.price && each.active) {
                    $(".Cost-" + each.productId).html(each.price);
                    $(".Cost-" + each.productId).attr("title", "PID: " + each.productId);
                    $(".Cost-" + each.productId).addClass(each.ApiSource);
                } else {
                    var error = Mustache.to_html(MenuLayout.error, each);
                    $(".Cost-" + each.productId).html(error);
                    $(".Cost-" + each.productId + " .material-icons").attr("title", "PID: " + each.productId).css("cursor", "wait");
                }
                if (each.productId && each.calorie) {
                    $(".Calories-" + each.productId).html(each.calorie);
                    $(".Calories-" + each.productId).addClass("ims");
                    $(".Calories-" + each.productId).attr("title", "PID: " + each.productId);
                } else {
                    var error = Mustache.to_html(MenuLayout.error, each);
                    $(".Calories-" + each.productId).html(error);
                    $(".Calories-" + each.productId + " .material-icons").attr("title", "PID: " + each.productId).css("cursor", "wait");
                }
                if (each.productId && each.displayName) {
                    $(".Name-" + each.productId).html(each.displayName);
                } else {
                    var error = Mustache.to_html(MenuLayout.error, each);
                    $(".Name-" + each.productId).html(error);
                }
                if (each.productId && each.menuDescription) {
                    $(".Desc-" + each.productId).html(each.menuDescription);
                } else {
                    //do nothing
                }
                if (each.productId && !each.enabled && each.ApiSource) {
                    $(".Cost-" + each.productId).attr("active", "false");
                    $(".Item-" + each.productId).hide();
                } else {
                    $(".Cost-" + each.productId).attr("active", "true");
                    $(".Item-" + each.productId).show();
                }
                if (each.productId && each.outOfStock) {
                    $(".ItemOOS-" + each.productId).css("opacity", "0");
                } else {
                    $(".ItemOOS-" + each.productId).css("opacity", "");
                }
            });
        };
        MenuLayout.COST = '{{dollars}}<span class="cents ">{{cents}}</span>';
        MenuLayout.error = '<span class="material-icons ">error</span>';
        MenuLayout.zoneError = '<div title="{{station}} {{message}}" class="error-wrapper"><svg xmlns="http://www.w3.org/2000/svg" height="{{height}}px" viewBox="0 -960 960 960" width="{{width}}px" fill="{{color}}"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg></div>';
        MenuLayout.itemWrapper = `
        <div class="item-wrapper">
            <div class="menu-item-price-name-wrapper">
                <div class="-menuitem-wrapper">
                    <div class="menu-item-name">
                        <span class="name">{{name}}{{comboName}}{{menuItemName}}
                        {{#icons}}
                            <img src="./{{fileName}}" class="nutrition-icon vegetarian"
                                  onerror="this.onerror=null;this.remove();">
                        {{/icons}}
                        </span>
                    </div>
                </div>
            </div>
            <div class="menu-item-descr {{showDescription}}">{{description}}{{comboItemNames}}{{menuDescription}}</div>
            <div class="price-wrapper">
                <div class="menu-item-portions {{showPortion}}">{{portion}}</div>
                <div class="menu-item-calories">{{calories}} cal</div>
                <div class="menu-item-price {{showPrice}}">{{price}}</div>
            </div>
        </div>`;
        return MenuLayout;
    })();
    IMSintegration.MenuLayout = MenuLayout;
})(IMSintegration || (IMSintegration = {}));
