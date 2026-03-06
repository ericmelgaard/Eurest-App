"use strict";
//Publisher: Wand Digital
//Date: 05.30.2025
//Version: 60.0
var IMSintegration;
(function (wandDigital) {
    var MenuLayout = (function () {
        function MenuLayout() {
            this.timeOuts = [];
            this.playlist = false;
            this.isRotating = false;
            this.rotationInterval = null;
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
            //zone rotation or menu rotation
            try {
                this.rotateEles();
            } catch (e) {
                console.error("Error in MenuLayout rotateEles: ", e);
                IMSintegration.Integration.prototype.showConnect(true, "Red", "rotateEles", e, "error");
            }
            //nutrtion overlay handlers
            try {
                setupNutritionOverlayHandlers(nutritionLabelTemplate);
            } catch (e) {
                console.error("Error in MenuLayout setupNutritionOverlayHandlers: ", e);
            }
        };
        MenuLayout.prototype.handleSettings = function (IMSSettings) {
            var _this = this;
            if (!IMSSettings || IMSSettings.length === 0) {
                return;
            }
        };
        MenuLayout.prototype.handleLayout = function (IMSSettings) {
            var _this = this;
        };
        MenuLayout.prototype.handleProducts = function (IMSProducts) {
            var _this = this;
            if (!IMSProducts || IMSProducts.length === 0) {
                return;
            }
        };
        MenuLayout.prototype.rotateEles = function () {
            var _this = this;
            
            // Debug: Check if setupRotation exists
            if (typeof setupRotation === 'undefined') {
                console.error('setupRotation is not defined!');
                return;
            }
            
            console.log('Setting up rotation...');
            
            // Setup rotation for all .items-wrapper elements with customizable options
            try {
                setupRotation('.items-wrapper', {
                    evenDistribution: true,          // distribute items evenly across groups
                    cycle: 4000,                     // Faster cycle for demo - 4 seconds
                    delay: 1000,                     // 1 second delay between zones
                    animation: 'fade',               // 'fade', 'slide', 'slideVertical', 'scale', 'flip', 'none'
                    animationDuration: 800,          // animation length in milliseconds
                    pauseOnHover: true,              // pause rotation when hovering
                    pauseWhenHidden: true,           // pause when element not visible
                    respondToTrmPlaying: true        // respond to TRM playing state changes
                });
                console.log('Rotation setup completed');
            } catch (error) {
                console.error('Error setting up rotation:', error);
            }
        };

        //Date: 02.01.2025 adjusted for new trm playing logic
        MenuLayout.prototype.trmAnimate = function (playing, firstRun) {
            //called with playing each time asset plays in digital client. _this is accessible
            var _this = this;
            
            // Notify rotation controllers of TRM playing state change
            $('.items-wrapper').each(function() {
                var controller = $(this).data('rotationController');
                if (controller) {
                    controller.trmPlaying = playing;
                    controller.updatePlayState();
                }
            });
            
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
        MenuLayout.prototype.fillDynamic = function (IMSItems, integrationItems) {
            var _this = this;

            _this.clearMenuItems(".asset-wrapper");

            if (!integrationItems || !integrationItems.stations || integrationItems.stations.length === 0) {
                console.log('No integration items provided');
                return;
            }

            integrationItems.stations.forEach(function(stationData) {
                var allItems = stationData.items || [];

                allItems.forEach(function (each, idx) {
                    if (allItems.length <= 5) {
                        each.fontSize = "74px"
                    }
                    if (allItems.length === 6) {
                        each.fontSize = "66px"
                    }
                    if (allItems.length === 7) {
                        each.fontSize = "50px"
                    }
                    if (allItems.length >= 8) {
                        each.fontSize = "40px"
                    }

                    each.name = each.name || "";

                    var nameWords = (each.name || "").split(" ");
                    var maxChars;
                    if (each.fontSize === "74px") {
                        maxChars = 45;
                    } else if (each.fontSize === "66px") {
                        maxChars = 50;
                    } else if (each.fontSize === "50px") {
                        maxChars = 65;
                    } else if (each.fontSize === "40px") {
                        maxChars = 75;
                    } else {
                        maxChars = 30;
                    }
                    var nameJoined = nameWords.join(" ");
                    if (nameJoined.length > maxChars) {
                        var truncated = nameJoined.slice(0, maxChars - 3);
                        var lastSpace = truncated.lastIndexOf(" ");
                        if (lastSpace > 0) {
                            truncated = truncated.slice(0, lastSpace);
                        }
                        truncated = truncated.replace(/\s+$/, "");
                        var truncatedWords = truncated.split(" ");
                        if (truncatedWords.length > 1) {
                            each.nameFirst = truncatedWords.slice(0, -1).join(" ");
                            each.nameLast = truncatedWords[truncatedWords.length - 1] + "...";
                            each.nameSpace = " ";
                        } else if (nameWords.length > 1) {
                            each.nameFirst = nameWords.slice(0, -1).join(" ");
                            each.nameLast = nameWords[nameWords.length - 1];
                            each.nameSpace = " ";
                        } else {
                            each.nameFirst = "";
                            each.nameLast = truncatedWords[0] + "...";
                            each.nameSpace = "";
                        }
                    } else if (nameWords.length > 1) {
                        each.nameFirst = nameWords.slice(0, -1).join(" ");
                        each.nameLast = nameWords[nameWords.length - 1];
                        each.nameSpace = " ";
                    } else {
                        each.nameFirst = "";
                        each.nameLast = each.name;
                        each.nameSpace = "";
                    }

                    each.nutritionObj = each;
                    each.nutritionJson = JSON.stringify(each);
                });

                var formattedStationData = {
                    station: stationData.station,
                    items: allItems,
                    stationId: stationData.stationId || _this.sanitizeId(stationData.station),
                    iconLabels: integrationItems.iconLabels || {
                        spicy: "Spicy",
                        dairy: "Made without dairy",
                        gluten: "Made without gluten",
                        halal: "Halal",
                        vegetarian: "Vegetarian",
                        vegan: "Vegan"
                    }
                };

                var page = Mustache.render(MenuLayout.stationWrapper, formattedStationData);
                var $page = $(page);

                $page.find('.item-wrapper').each(function (i) {
                    if (formattedStationData.items && formattedStationData.items[i] && formattedStationData.items[i].nutritionObj) {
                        $(this).data('nutrition', formattedStationData.items[i].nutritionObj);
                    }
                });

                $(".asset-wrapper").append($page);
            });
        };
        

        MenuLayout.prototype.clearMenuItems = function (zone) {
            var containers = $(zone).get();
            containers.forEach(function (container) {
                while (container.hasChildNodes()) {
                    container.removeChild(container.lastChild);
                }
            });
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

        MenuLayout.prototype.handleIMSMenu = function (menuItems, station = AssetConfiguration.Display, period = AssetConfiguration.Daypart, zone) {

            // Check for no data
            if (!menuItems) {
                return {
                    error: "no data",
                    zone: zone,
                    station: station,
                    items: []
                };
            }

            const currentDay = currentTime();

            // Validate dates
            const dateValidated = menuItems.filter(each => each.date === currentDay);
            if (dateValidated.length === 0 && menuItems.length > 0) {
                return {
                    error: "date",
                    zone: zone,
                    station: station,
                    items: []
                };
            }

            // Filter for station and period
            const filteredItems = dateValidated.filter(each => {
                return stringSimilarity.compareTwoStrings(each.imsDaypartName.toLowerCase(), period.toLowerCase()) >= 0.855 &&
                    stringSimilarity.compareTwoStrings(each.menuZoneName.toLowerCase(), station.toLowerCase()) >= 0.855;
            });

            if (filteredItems.length === 0) {
                return {
                    error: "mealstation",
                    zone: zone,
                    station: station,
                    items: []
                };
            }

            return {
                items: filteredItems,
                zone: zone
            };
        };



        MenuLayout.prototype.handleWebtrition = function (webtrition, station, period = AssetConfiguration.Daypart, zone) {

            // Check for no data
            if (!webtrition && !ele.IMS_Data) {
                return {
                    error: "no data",
                    zone: zone,
                    station: station,
                    items: []
                };
            }

            //allow TRM to control Daypart
            period = period || AssetConfiguration.Daypart;

            const currentDay = currentTime();

            // Validate dates
            const dateValidated = webtrition.filter(each => each.date === currentDay || each.date === "0001-01-01T00:00:00");
            if (dateValidated.length === 0 && webtrition.length > 0) {
                return {
                    error: "date",
                    zone: zone,
                    station: station,
                    items: []
                };
            }

            // Filter for station and period
            const filteredItems = dateValidated.filter(each => {
                return stringSimilarity.compareTwoStrings(each.mealPeriod.toLowerCase(), period.toLowerCase()) >= 0.855;
            });
            if (filteredItems.length === 0) {
                return {
                    error: "mealstation",
                    zone: zone,
                    station: station,
                    items: []
                };
            }

            // Remove icons
            const ignoreList = ignoreIcon.replace(/\s+/g, '').toLowerCase().split(",");
            const formattedItems = filteredItems.map(item => {
                if (item && item.icons) {
                    item.icons = item.icons.filter(icon => !ignoreList.includes(icon.name.replace(/\s+/g, '').toLowerCase()));
                }
                return item;
            });

            // Format icons
            formattedItems.forEach(each => {
                let vegetarian = false;
                let vegan = false;

                const removeVege = icon => icon.name.toLowerCase() !== "vegetarian";
                if (each.portion) {
                    each.portion = each.portion.replace("portion", "")
                        .replace("ounce", "oz")
                        .replace("serving(s)", "serve")
                        .replace("1 ladle-4oz", "4oz")
                        .replace("1 ladle-8oz", "8oz")
                        .replace("1 ladle-6oz", "6oz")
                        .replace("1 ladle-1oz", "1oz")
                        .replace("sandwich", "sand")
                        .replace("1-1/2", "1½")
                        .replace("serving", "serv")
                        .replace("1/2", "½")
                        .replace("1/4", "¼")
                        .replace("1/8", "⅛")
                        .replace("3/4", "¾")
                        .replace("1/3", "⅓")
                        .replace("oz meat", "oz")
                        .replace("Scoop", "scp")
                        .replace("wedge", "wdg");
                }
                if (each.nutrition && each.nutrition.protein.displayValue === "less than 1 gram") {
                    each.nutrition.protein.displayValue = "<1 gram";
                }

                if (each.enticingDescription) {
                    each.description = each.enticingDescription;
                }

                each.price = "$" + each.price;

                each.showPrice = (each.price === "0.00" || !showPrice) ? "hide" : each.showPrice;
                each.showPortion = !showPortions ? "hide" : each.showPortion;
                each.showProtein = !showProtein ? "hide" : each.showProtein;
                each.showDescription = !showDescription ? "hide" : each.showDescription;

                if (each.icons) {
                    each.icons.forEach(eachIcon => {
                        if (eachIcon.name.includes("Vegetarian")) vegetarian = true;
                        if (eachIcon.name.includes("Vegan")) vegan = true;
                        eachIcon.fileName = `media/icon_${eachIcon.name.replace(/\s+/g, '').toLowerCase()}.png`;
                        eachIcon.name = eachIcon.name.replace(/\s+/g, '').toLowerCase();
                    });

                    each.icons.forEach((eachIcon, idx) => {
                        if (eachIcon.fileName === "media/icon_howgoodfriendly.png") {
                            each.climateIcon = "show";
                            each.icons.splice(idx, 1);
                        }
                    });

                    if (vegan && vegetarian) {
                        each.icons = each.icons.filter(removeVege);
                    }
                }
            });
            return {
                items: formattedItems,
                zone: zone
            };
        };

        MenuLayout.prototype.sanitizeId = function(str) {
            return str
                .normalize('NFD') // Decompose accented characters
                .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
                .replace(/[^a-zA-Z0-9\-_]/g, '-') // Replace non-alphanumeric with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
        };

        MenuLayout.prototype.generateDirectories = function(stationArr) {
            // Generate English directory
            var englishButtons = stationArr.map(station => 
                `<div class="station-button" onclick="showStation('${station.station}', 'en')">${station.station}</div>`
            ).join('');
            
            $('#directory-english .station-list').html(englishButtons);
            
            // Empty French directory for demo
            $('#directory-french .station-list').html('<div class="station-button">No French stations in demo</div>');
        };

        MenuLayout.COST = '{{dollars}}<span class="cents ">{{cents}}</span>';
        MenuLayout.error = '<span class="material-icons ">error</span>';

        MenuLayout.itemWrapper = `            
    <div class="item-wrapper" title="PID: {{mappingId}}">
        <span class="name-wrapper">
            <span class="name-icons" style="white-space:normal;">
                <span style="font-size:{{fontSize}};" class="name">{{nameFirst}}{{nameSpace}}<span class="last" style="white-space:nowrap;">{{nameLast}}&nbsp;<span class="nutrition">{{#icons}}<img title="{{name}}" class="icon" src="./{{fileName}}">{{/icons}}</span></span></span>
            </span>
        </span>
    </div>`;

        MenuLayout.stationWrapper = `
    <div class="station-wrapper" style="display:block;" id="{{stationId}}">
        <div class="station">
            <div class="station-header">{{station}}</div>
        </div>

        <div id="{{station}}" class="items-wrapper">
            {{#items}}
            <div class="item-wrapper" title="PID: {{mappingId}}" data-nutrition='{{&nutritionJson}}'>
                <span class="name-wrapper">
                    <span class="name-icons" style="white-space:normal;">
                        <span style="font-size:{{fontSize}};" class="name">{{nameFirst}}{{nameSpace}}<span class="last" style="white-space:nowrap;">{{nameLast}}&nbsp;<span class="nutrition">{{#icons}}<img title="{{name}}" class="icon" src="./{{fileName}}">{{/icons}}</span></span></span>
                    </span>
                </span>
            </div>
            {{/items}}
        </div>

        <div class="icons-wrapper">
            <div class="icon-wrapper">
                <img class="icon" src="media//icon_vegetarian.png" />
                <span id="vegetarian" class="Text Text-XXXX">{{iconLabels.vegetarian}}</span>
            </div>
            <div class="icon-wrapper">
                <img class="icon" src="media/icon_vegan.png" alt="Save Icon" />
                <span id="vegan" class="Text Text-XXXX">{{iconLabels.vegan}}</span>
            </div>
            <div class="icon-wrapper">
                <img class="icon" src="media/icon_halal.png" alt="Cancel Icon" />
                <span id="halal" class="Text Text-XXXX">{{iconLabels.halal}}</span>
            </div>
            <div class="icon-wrapper">
                <img class="icon" src="media/icon_withoutgluten.png" alt="Cancel Icon" />
                <span id="gluten" class="Text Text-XXXX">{{iconLabels.gluten}}</span>
            </div>
            <div class="icon-wrapper">
                <img class="icon" src="media/icon_withoutdairy.png" alt="Cancel Icon" />
                <span id="dairy" class="Text Text-XXXX">{{iconLabels.dairy}}</span>
            </div>
            <div class="icon-wrapper">
                <img class="icon" src="media/icon_spicy.png" alt="Cancel Icon" />
                <span id="spicy" class="Text Text-XXXX">{{iconLabels.spicy}}</span>
            </div>
        </div>
    </div>`;

        return MenuLayout;
    })();
    IMSintegration.MenuLayout = MenuLayout;
})(IMSintegration || (IMSintegration = {}));