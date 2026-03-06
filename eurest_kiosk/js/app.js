//Publisher: Wand Digital
//Date: 01.29.2026
//Version: 62.0
var IMSintegration;
(function (wandDigital) {
    var App = (function () {
        function App() {
            this.db = null;
            this.store = "";
            this.API = "";
            this.BRAND = "";
            this.settingsUpdate = false;
            this.integrationUpdate = false;
            this.IMSUpdate = false;
            this.fullStart = false;
            this.observerInstance = null;
            this.dayWatcher = null;
        }
        App.prototype.init = function (API, fullStart) {
            var _this = this;
            if (!_this.observerInstance) {
                _this.observerInstance = _this.observer();
            }
            _this.getAPI().then(function () {
                _this.fullStart = fullStart;
                if (fullStart) {
                    return;
                }
                _this.readDatabase();
            });
        };
        App.prototype.getAPI = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                function retry() {
                    var API = self.localStorage.getItem(_this.store + "_store_context" + "(" + version + ")") && JSON.parse(self.localStorage.getItem(_this.store + "_store_context" + "(" + version + ")")).API ? JSON.parse(self.localStorage.getItem(_this.store + "_store_context" + "(" + version + ")")).API : null;
                    var BRAND = self.localStorage.getItem(_this.store + "_store_context" + "(" + version + ")") && JSON.parse(self.localStorage.getItem(_this.store + "_store_context" + "(" + version + ")")).brand ? JSON.parse(self.localStorage.getItem(_this.store + "_store_context" + "(" + version + ")")).brand : null;
                    if (API && BRAND) {
                        _this.API = API;
                        _this.BRAND = BRAND;
                        resolve(API);
                    }
                    else {
                        setTimeout(retry, 2000);
                    }
                }
                retry();
            });
        };
        App.prototype.observer = function () {
            var _this = this;
            const handleDbChange = _.debounce((changes) => {
                // Ensure changes is an array
                if (!Array.isArray(changes)) {
                    changes = [changes];
                }
                const groupedChanges = {};
                changes.forEach(function (change) {
                    if (!change || !change.table) return;
                    let changeTable = "";
                    if (change.table === "anchors") return;
                    if (change.table.indexOf("IMS_products") > -1) {
                        changeTable = "IMS_products";
                        _this.IMSUpdate = true; // Track IMS updates
                    } else if (change.table.indexOf("IMS_menuItems") > -1) {
                        changeTable = "IMS_menuItems";
                        _this.IMSUpdate = true; // Track IMS updates
                    } else if (change.table.indexOf("integration") > -1) {
                        changeTable = (_this.API).toUpperCase() + " Item";
                        _this.integrationUpdate = true; // Track integration updates
                    } else if (change.table.indexOf("IMS_settings") > -1) {
                        changeTable = "setting";
                        _this.settingsUpdate = true; // Track settings updates
                    } else {
                        return;
                    }
                    if (!groupedChanges[changeTable]) groupedChanges[changeTable] = [];
                    groupedChanges[changeTable].push(change);
                });

                // Now process each group
                Object.keys(groupedChanges).forEach(function (changeTable) {
                    const group = groupedChanges[changeTable];
                    group.forEach(function (change, idx) {
                        // Only log first 6 changes per group if leader
                        if (idx > 5 || !leader) return;
                        switch (change.action) {
                            case 'added':
                                console.log(changeTable + ' added:', change.item);
                                break;
                            case 'updated':
                                console.log(changeTable + ' updated:', change.item);
                                break;
                            case 'deleted':
                                console.log(changeTable + ' deleted:', change.item);
                                break;
                            default:
                                break;
                        }
                    });
                    // If more than 6 changes in this group, log the rest as a table
                    if (group.length > 6 && leader) {
                        var logs = [];
                        group.forEach(function (each) {
                            each.item.action = each.action;
                            logs.push(each.item);
                        });
                        console.groupCollapsed("...and an additional " + (group.length - 6) + " " + changeTable + " changes");
                        console.table(logs.slice(6));
                        console.groupEnd();
                    }
                });
                if (_this.settingsUpdate === true && leader) {
                    integration.setUpdatedDate("settings");
                }
                if (_this.integrationUpdate === true && leader) {
                    integration.setUpdatedDate(_this.API);
                }
                if (_this.IMSUpdate === true && leader) {
                    integration.setUpdatedDate("IMS");
                }
                if (!_this.fullStart && (_this.integrationUpdate || _this.settingsUpdate || _this.IMSUpdate)) {
                    if (_this.API) {
                        _this.readDatabase();
                    } else {
                        _this.getAPI().then(function (api) {
                            _this.readDatabase();
                        });
                    }
                    _this.settingsUpdate = false;
                    _this.integrationUpdate = false;
                    _this.IMSUpdate = false;
                    _this.fullStart = false;
                }
                if (_this.fullStart && (_this.integrationUpdate || _this.API === "ims" || _this.API === "trm") && (_this.IMSUpdate || _this.API === "trm")) {
                    if (_this.API) {
                        _this.readDatabase();
                    } else {
                        _this.getAPI().then(function (api) {
                            _this.readDatabase();
                        });
                    }
                    _this.settingsUpdate = false;
                    _this.integrationUpdate = false;
                    _this.IMSUpdate = false;
                    _this.fullStart = false;
                }
                changesQueue.length = 0;
            }, 50);
            const changesQueue = [];
            window.addEventListener('dbChangeEvent', (event) => {
                changesQueue.push(event.detail);
                handleDbChange(changesQueue);
            });
            window.addEventListener('storage', function (event) {
                if (event.key === _this.store + '_dbChangeEvent' + "(" + version + ")") {
                    var changes = JSON.parse(event.newValue);
                    if (Array.isArray(changes)) {
                        changesQueue.push.apply(changesQueue, changes); // Using spread operator to push all changes
                    } else {
                        changesQueue.push(changes);
                    }
                    handleDbChange(changesQueue);
                }
            });

            //watch for day change
            if (_this.dayWatcher) {
                clearInterval(_this.dayWatcher);
            }
            var savedDay = new Date(currentTime()).getDay()
            _this.dayWatcher = setInterval(function () {
                const momentDay = new Date(currentTime()).getDay()

                if (momentDay != savedDay) {
                    _this.readDatabase();
                    savedDay = momentDay;
                    console.log("Day changed...")
                }
            }, 30000)
            return true;
        };
        App.prototype.validateIMS = function (IMSProducts, IMSItems) {
            var _this = this;
            var date = new Date(currentTime());

            //handle products
            if (!IMSProducts) {
                return;
            }
            IMSProducts.forEach(function (each) {
                var termDate = null;
                if (each.terminateDate) {
                    termDate = new Date(each.terminateDate);
                }
                var startDate = new Date(each.effectiveDate);
                if ((each.terminateDate && termDate < date) || (each.effectiveDate && startDate > date)) {
                    each.enabled = false;
                }
            });

            //handle menu items 03.20.2025
            if (!IMSItems) {
                return;
            }

            //filter for correct date on the full week request / fallback to correct day only if offline
            const currentDate = currentTime();
            const currentDay = date.getDay();
            // Validate dates
            const dayMatch = IMSItems.filter(each => each.dayOfTheWeek === currentDay || each.dayOfTheWeek === -1);
            const dateValidated = IMSItems.filter(each => each.date === currentDate || each.dayOfTheWeek === -1);

            _this.IMSItems = window.allowMenusOffline ? dayMatch : dateValidated;

        };
        App.prototype.priceSchedule = function (menuItems) {
            const currentDate = new Date(currentTime());
            if (!menuItems) {
                return;
            }
            const processScheduledPrices = (item) => {
                if (item.scheduledPrices && item.scheduledPrices.length > 0) {
                    item.scheduledPrices = item.scheduledPrices.sort((a, b) => new Date(a.date) - new Date(b.date));
                    item.scheduledPrices.forEach((eachPrice) => {
                        eachPrice.date = new Date(eachPrice.date);
                        if (eachPrice.date <= currentDate) {
                            item.price = eachPrice.price;
                            item.calorie = eachPrice.calorie || item.calorie;
                        }
                    });
                }
            };
            menuItems.forEach((menuItem) => {
                processScheduledPrices(menuItem);
                if (menuItem.modifiers && menuItem.modifiers.length > 0) {
                    menuItem.modifiers.forEach((modifier) => {
                        processScheduledPrices(modifier);
                    });
                }
            });
        };
        App.prototype.calculatePrice = function (apiItems, eachIMS, apiMods, apiDiscounts) {
            var _this = this;
            var extractFormula = function (IMSmappingId) {
                var first = IMSmappingId.indexOf("(") + 1;
                var last = IMSmappingId.lastIndexOf(")");
                return IMSmappingId.substring(first, last);
            };
            var collectAllItems = function (apiItems, apiMods, apiDiscounts) {
                var allItems = [];
                if (apiItems)
                    allItems.push.apply(allItems, apiItems);
                if (apiMods)
                    allItems.push.apply(allItems, apiMods);
                if (apiDiscounts)
                    allItems.push.apply(allItems, apiDiscounts);
                return allItems;
            };
            var findPlaceholders = function (priceCalculation) {
                // Regular expression to match placeholders (sequences of digits at least 5 characters long)
                return priceCalculation.match(/\b\d{5,}\b/g) || [];
            };
            var replacePlaceholders = function (priceCalculation, allItems) {
                var matches = 0;
                var escapeRegExp = function (str) { return (str || "").replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'); };
                allItems.forEach(function (item) {
                    // replace standard mapping ids
                    if (item && item.mappingId && typeof item.mappingId === "string" && priceCalculation.includes(item.mappingId)) {
                        var num = parseFloat(item.price);
                        if (!isNaN(num)) {
                            matches++;
                            priceCalculation = priceCalculation.replace(new RegExp(escapeRegExp(item.mappingId), "g"), num);
                            return;
                        }
                    }
                    //check for missed matches that do not include "-"
                    if (_this.API === "qu" && _this.BRAND === "focus") {
                        var softMatch = (item && typeof item.mappingId === "string" && item.mappingId.includes("-")) ? item.mappingId.split("-")[1] : null;
                        if (softMatch && /\d+/.test(softMatch)) {
                            // Replace exact numeric token occurrences only (word boundaries)
                            var num_1 = parseFloat(item.price);
                            if (!isNaN(num_1)) {
                                var re = new RegExp("\\b" + escapeRegExp(softMatch) + "\\b", "g");
                                if (re.test(priceCalculation)) {
                                    matches++;
                                    priceCalculation = priceCalculation.replace(re, num_1);
                                }
                            }
                        }
                    }
                });
                var updatedPrice = priceCalculation;
                return {
                    matches: matches,
                    updatedPrice: updatedPrice
                };
            };
            var priceCalculation = extractFormula(eachIMS.IMSmappingId);
            var allItems = collectAllItems(apiItems, apiMods, apiDiscounts);
            var placeholders = findPlaceholders(priceCalculation);
            var _a = replacePlaceholders(priceCalculation, allItems), matches = _a.matches, updatedPrice = _a.updatedPrice;
            // Replace all # characters with 0 (or another appropriate value)
            priceCalculation = updatedPrice.replace(/#/g, "");
            try {
                priceCalculation = math.evaluate(priceCalculation).toFixed(2).toString();
            }
            catch (err) {
                priceCalculation = "";
            }
            // Show error if match not found
            if (matches !== placeholders.length) {
                priceCalculation = "";
            }
            // Remove leading 0s
            if (priceCalculation.startsWith("0")) {
                priceCalculation = priceCalculation.replace(/^0+/, "");
            }
            return priceCalculation;
        };
        App.prototype.formatWebtrition = function (webtritionItems) {
            var _this = this;
            if (!webtritionItems) {
                return;
            }
            // Remove icons
            const ignoreList = ignoreIcon.replace(/\s+/g, '').toLowerCase().split(",");
            const formattedItems = webtritionItems.map(item => {
                if (item && item.icons) {
                    item.icons = item.icons.filter(icon => !ignoreList.includes(icon.name.replace(/\s+/g, '').toLowerCase()));
                }
                return item;
            });
            // Format items
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
                each.showPrice = (each.price === "0.00" || !showPrice) ? "hide" : each.showPrice;
                if (each.price && typeof each.price === "string" && each.price.trim() !== "") {
                    each.price = each.price.trim();
                    if (!each.price.startsWith("$")) {
                        each.price = "$" + each.price;
                    }
                }
                each.showPortion = !showPortions ? "hide" : each.showPortion;
                each.showProtein = !showProtein ? "hide" : each.showProtein;
                each.showDescription = !showDescription ? "hide" : each.showDescription;
                if (each.icons) {
                    each.icons.forEach(eachIcon => {
                        if (eachIcon.name.includes("Vegetarian"))
                            vegetarian = true;
                        if (eachIcon.name.includes("Vegan"))
                            vegan = true;
                        eachIcon.fileName = `media/icon_${eachIcon.name.replace(/\s+/g, '').toLowerCase()}.png`;
                        eachIcon.name = eachIcon.name.replace(/\s+/g, '').toLowerCase();
                    });
                    if (vegan && vegetarian) {
                        each.icons = each.icons.filter(removeVege);
                    }
                }
            });
            formattedItems.sort(function (a, b) { return a.sortOrder - b.sortOrder; });
            return formattedItems;
        };
        App.prototype.formatIMS = function (IMSItems) {
            var _this = this;
            if (!IMSItems) {
                return;
            }
            //make IMS mods accessible
            IMSItems.forEach(function (eachIMS) {
                eachIMS.IMSmappingId = _this.getBestMappingId(eachIMS);
                eachIMS.ApiSource = "ims";
                eachIMS.ApiSynced = false;

                if (eachIMS.modifiers) {
                    eachIMS.modifiers.forEach(function (eachMod) {
                        eachMod.productId = eachIMS.productId + "_" + eachMod.productModifierId;
                        eachMod.categoryId = null;
                        eachMod.subCategoryId = null;
                        eachMod.ApiSource = "ims";
                        eachMod.ApiSynced = false;
                        eachMod.IMSmappingId = _this.getBestMappingId(eachMod);
                        if (eachMod.price && !eachMod.IMSmappingId) {
                            eachIMS["Price_" + eachMod.productModifierId] = eachMod.price;
                        }
                        IMSItems.push(eachMod);
                    });
                }
            });
            //new 01.29.2026 - prices and priceParts
            IMSItems.forEach(function (eachIMS) {
                eachIMS.prices = [];
                eachIMS.priceParts = [];
                eachIMS.prices.push({ source: "IMS", price: eachIMS.price});
                // update priceParts using current formatted IMSProduct.price
                if (!Array.isArray(eachIMS.priceParts)) {
                    eachIMS.priceParts = [];
                }
                (function () {
                    var priceStr = (eachIMS.price != null) ? eachIMS.price.toString() : "";
                    var dollars = "0";
                    var cents = "00";
                    if (priceStr.indexOf(".") > -1) {
                        var parts = priceStr.split(".");
                        dollars = (parts[0] || "0");
                        cents = (parts[1] || "00");
                    }
                    else if (priceStr.trim() !== "") {
                        dollars = priceStr;
                    }
                    if (cents.length < 2) {
                        cents = (cents + "00").slice(0, 2);
                    }
                    eachIMS.priceParts.dollars = dollars;
                    eachIMS.priceParts.cents = cents;
                })();
                eachIMS.price = eachIMS.price || null;
            });
        };
        App.prototype.alignItems = function (apiItems, apiMods, apiDiscounts, IMSProducts) {
            var _this = this;
            if (!IMSProducts.length || !apiItems.length || _this.API === "ims") {
                _this.formatIMS(_this.IMSProducts)
                return;
            }
            // Make IMS mods accessible
            IMSProducts.forEach(function (IMSProduct) {
                if (IMSProduct.modifiers) {
                    IMSProduct.modifiers.forEach(function (modifier) {
                        modifier.productId = "".concat(IMSProduct.productId, "_").concat(modifier.productModifierId);
                        modifier.categoryId = null;
                        modifier.subCategoryId = null;
                        modifier.IMSmappingId = _this.getBestMappingId(modifier);
                        if (modifier.price && !modifier.IMSmappingId) {
                            IMSProduct["Price_".concat(modifier.productModifierId)] = modifier.price;
                        }
                        if (modifier.IMSmappingId.includes("calc(") && modifier.IMSmappingId.includes(")")) {
                            modifier.price = _this.calculatePrice(apiItems, modifier, apiMods);
                            IMSProduct["Price_".concat(modifier.productModifierId)] = modifier.price;
                        }
                        if (modifier.externalId && modifier.IMSmappingId) {
                            apiItems.forEach(function (apiItem) {
                                if (modifier.IMSmappingId === apiItem.mappingId) {
                                    IMSProduct["Price_".concat(modifier.productModifierId)] = apiItem.price;
                                }
                            });
                        }
                        IMSProducts.push(modifier);
                    });
                }
                // Make choice of IMS Mapping ID - could use automation
                IMSProduct.IMSmappingId = _this.getBestMappingId(IMSProduct);
            });
            // Align products
            IMSProducts.forEach(function (IMSProduct) {
                IMSProduct.ApiSynced = false;
                IMSProduct.APIActive = false;
                IMSProduct.ApiSource = "ims";
                IMSProduct.prices = [];
                IMSProduct.priceParts = [];
                IMSProduct.prices.push({ source: "IMS", price: IMSProduct.price});
                // update priceParts using current formatted IMSProduct.price
                if (!Array.isArray(IMSProduct.priceParts)) {
                    IMSProduct.priceParts = [];
                }
                (function () {
                    var priceStr = (IMSProduct.price != null) ? IMSProduct.price.toString() : "";
                    var dollars = "0";
                    var cents = "00";
                    if (priceStr.indexOf(".") > -1) {
                        var parts = priceStr.split(".");
                        dollars = (parts[0] || "0");
                        cents = (parts[1] || "00");
                    }
                    else if (priceStr.trim() !== "") {
                        dollars = priceStr;
                    }
                    if (cents.length < 2) {
                        cents = (cents + "00").slice(0, 2);
                    }
                    IMSProduct.priceParts.dollars = dollars;
                    IMSProduct.priceParts.cents = cents;
                })();
                IMSProduct.price = IMSProduct.price || null;
                if (IMSProduct.IMSmappingId.includes("calc(") && IMSProduct.IMSmappingId.includes(")")) {
                    IMSProduct.price = _this.calculatePrice(apiItems, IMSProduct, apiMods, apiDiscounts);
                    IMSProduct.ApiSynced = IMSProduct.price ? true : false;
                    IMSProduct.APIActive = IMSProduct.price ? true : false;
                }
                //Align mods - lowest priority
                apiMods.forEach(function (apiMod) {
                    // Use exact match for all APIs except "qu"
                    if ((_this.BRAND === "focus" && _this.API === "qu" && apiMod.mappingId && IMSProduct.IMSmappingId && apiMod.mappingId.includes(IMSProduct.IMSmappingId)) ||
                        (apiMod.mappingId === IMSProduct.IMSmappingId && IMSProduct.IMSmappingId)) {
                        IMSProduct.price = apiMod.price ? parseFloat(apiMod.price).toFixed(2) : IMSProduct.price;
                        IMSProduct.outOfStock = apiMod.isOutOfStock || IMSProduct.outOfStock;
                        IMSProduct.ApiSynced = true;
                        //move API price to a number so it can be tested for 0.
                        apiMod.price = apiMod.price ? parseFloat(apiMod.price) || 0 : 0;
                        // record prices from IMS and current API
                        IMSProduct.prices.push({ source: _this.API, price: apiMod.price });
                        // update priceParts using current formatted IMSProduct.price
                        if (!Array.isArray(IMSProduct.priceParts)) {
                            IMSProduct.priceParts = [];
                        }
                        (function () {
                            var priceStr = (IMSProduct.price != null) ? IMSProduct.price.toString() : "";
                            var dollars = "0";
                            var cents = "00";
                            if (priceStr.indexOf(".") > -1) {
                                var parts = priceStr.split(".");
                                dollars = (parts[0] || "0");
                                cents = (parts[1] || "00");
                            }
                            else if (priceStr.trim() !== "") {
                                dollars = priceStr;
                            }
                            if (cents.length < 2) {
                                cents = (cents + "00").slice(0, 2);
                            }
                            IMSProduct.priceParts.dollars = dollars;
                            IMSProduct.priceParts.cents = cents;
                        })();

                        IMSProduct.ApiSource = apiMod.price ? _this.API : IMSProduct.price ? "ims" : _this.API;
                        IMSProduct.APIActive = apiMod.active || true;
                        Object.assign(apiMod, {
                            IMSproductId: IMSProduct.productId,
                            IMSdisplayName: IMSProduct.displayName,
                            IMSmenuDescription: IMSProduct.menuDescription,
                            IMSenabled: IMSProduct.enabled,
                            IMSoutOfStock: IMSProduct.outOfStock
                        });
                    }
                });
                //Align Items - highest priority
                apiItems.forEach(function (apiItem) {
                    if ((_this.BRAND === "focus" && _this.API === "qu" && apiItem.mappingId && IMSProduct.IMSmappingId && apiItem.mappingId.includes(IMSProduct.IMSmappingId)) ||
                        (apiItem.mappingId === IMSProduct.IMSmappingId && IMSProduct.IMSmappingId)) {
                        IMSProduct.price = apiItem.price ? parseFloat(apiItem.price).toFixed(2) : IMSProduct.price;
                        IMSProduct.outOfStock = apiItem.isOutOfStock || IMSProduct.outOfStock;
                        IMSProduct.ApiSynced = true;

                        //move API price to a number so it can be tested for 0.
                        apiItem.price = apiItem.price ? parseFloat(apiItem.price) || 0 : 0;
                        // record prices from IMS and current API
                        IMSProduct.prices.push({ source: _this.API, price: apiItem.price });
                        // update priceParts using current formatted IMSProduct.price
                        if (!Array.isArray(IMSProduct.priceParts)) {
                            IMSProduct.priceParts = [];
                        }
                        (function () {
                            var priceStr = (IMSProduct.price != null) ? IMSProduct.price.toString() : "";
                            var dollars = "0";
                            var cents = "00";
                            if (priceStr.indexOf(".") > -1) {
                                var parts = priceStr.split(".");
                                dollars = (parts[0] || "0");
                                cents = (parts[1] || "00");
                            }
                            else if (priceStr.trim() !== "") {
                                dollars = priceStr;
                            }
                            if (cents.length < 2) {
                                cents = (cents + "00").slice(0, 2);
                            }
                            IMSProduct.priceParts.dollars = dollars;
                            IMSProduct.priceParts.cents = cents;
                        })();

                        IMSProduct.ApiSource = apiItem.price ? _this.API : IMSProduct.price ? "ims" : _this.API;
                        IMSProduct.APIActive = apiItem.active || true;
                        Object.assign(apiItem, {
                            IMSproductId: IMSProduct.productId,
                            IMSdisplayName: IMSProduct.displayName,
                            IMSmenuDescription: IMSProduct.menuDescription,
                            IMSenabled: IMSProduct.enabled,
                            IMSoutOfStock: IMSProduct.outOfStock
                        });
                    }
                });
            });
            _this.IMSProducts = IMSProducts;
            _this.integrationItems = apiItems;
            _this.integrationModifiers = apiMods;
        };
        App.prototype.getBestMappingId = function (item) {
            const _this = this;
            let mappingIdValue = "";

            switch (_this.API) {
                case "qu":
                    mappingIdValue = item.quBeyondId || item.secondaryExternalId || item.externalId || "";
                    break;
                case "revel":
                    mappingIdValue = item.revelId || item.externalId || item.secondaryExternalId || "";
                    break;
                case "toast":
                    mappingIdValue = item.toastId || item.externalId || item.secondaryExternalId || "";
                    break;
                case "par":
                    mappingIdValue = item.parBrinkId || item.externalId || item.secondaryExternalId || "";
                    break;
                case "clover":
                    mappingIdValue = item.cloverId || item.externalId || item.secondaryExternalId || "";
                    break;
                case "shift4":
                    mappingIdValue = item.shift4Id || item.externalId || item.secondaryExternalId || "";
                    break;
                case "simphony":
                    mappingIdValue = item.simphonyId || item.externalId || item.secondaryExternalId || "";
                    break;
                case "transact":
                    mappingIdValue = item.transactID || item.externalId || item.secondaryExternalId || "";
                    break;
                case "centricos":
                    mappingIdValue = item.centricOS || item.externalId || item.secondaryExternalId || "";
                    break;
            }

            return mappingIdValue;
        }

        App.prototype.mergeIMS = function (IMSProducts, IMSItems) {
            var _this = this;
            if (!IMSItems || !IMSItems.length) {
                return [];
            }
            IMSItems.forEach(function (eachItem) {
                IMSProducts.forEach(function (eachProduct) {
                    if (eachProduct.productId === eachItem.productId) {
                        eachItem = Object.assign(eachItem, eachProduct);
                    }
                });
            });
            IMSItems = IMSItems.sort(function (a, b) {
                return a.sortOrder - b.sortOrder;
            });
            return IMSItems;
        };
        App.prototype.readDatabase = function () {
            var _this = this;
            if (!_this.API) {
                return;
            }
            if (isUsingIndexedDB) {
                try {
                    _this.db.integration_products
                        .toArray(function (result) {
                            _this.integrationItems = result;
                        })
                        .then(function () {
                            return _this.db.integration_modifiers.toArray(function (result) {
                                _this.integrationMods = result;
                            });
                        })
                        .then(function () {
                            return _this.db.IMS_menuItems.toArray(function (result) {
                                _this.IMSItems = result;
                            });
                        })
                        .then(function () {
                            return _this.db.integration_discounts.toArray(function (result) {
                                _this.integrationDiscounts = result;
                            });
                        })
                        .then(function () {
                            return _this.db.IMS_products.toArray(function (result) {
                                _this.IMSProducts = result;
                            });
                        })
                        .then(function () {
                            return _this.db.IMS_settings.toArray(function (result) {
                                _this.IMSSettings = result;
                            });
                        })
                        .then(function () {
                            _this.priceSchedule(_this.IMSProducts);
                            _this.validateIMS(_this.IMSProducts, _this.IMSItems);
                            try {
                                _this.alignItems(_this.integrationItems, _this.integrationMods, _this.integrationDiscounts, _this.IMSProducts);
                            } catch (err) {
                                // move on...
                            }
                            if (_this.API === "trm" || _this.API === "ims") { _this.formatIMS(_this.IMSProducts); }
                            if (_this.API === "webtrition") { _this.integrationItems = _this.formatWebtrition(_this.integrationItems); }
                            _this.IMSItems = _this.mergeIMS(_this.IMSProducts, _this.IMSItems);
                            menuLayout.init(_this.IMSItems, _this.IMSProducts, _this.IMSSettings, _this.integrationItems, _this.API);

                            $(".loading").hide();
                            $(".asset-wrapper").removeClass("blur");
                        })
                        .catch(function (error) {
                            //catch database clear event and reopen
                            if (error.name === "DatabaseClosedError") {
                                //wait for previous leader 
                                _this.fullStart = true;
                                integration.openDatabase().then(function () {
                                    _this.db = integration.db;
                                })
                            }
                        });
                } catch (err) {
                    console.error(err)
                }
            }
            if (!isUsingIndexedDB) {
                //local Storage
                try {
                    _this.integrationItems = JSON.parse(self.localStorage.getItem(_this.store + "_" + "integration_products" + "(" + version + ")")) || [];
                }
                catch (err) {
                    _this.integrationItems = [];
                }
                try {
                    _this.integrationMods = JSON.parse(self.localStorage.getItem(_this.store + "_" + "integration_modifiers" + "(" + version + ")")) || [];
                }
                catch (err) {
                    _this.integrationMods = [];
                }
                try {
                    _this.integrationDiscounts = JSON.parse(self.localStorage.getItem(_this.store + "_" + "integration_discounts" + "(" + version + ")")) || [];
                }
                catch (err) {
                    _this.integrationDiscounts = [];
                }
                try {
                    _this.IMSProducts = JSON.parse(self.localStorage.getItem(_this.store + "_" + "IMS_products" + "(" + version + ")")) || [];
                }
                catch (err) {
                    _this.IMSProducts = [];
                }
                try {
                    _this.IMSItems = JSON.parse(self.localStorage.getItem(_this.store + "_" + "IMS_menuItems" + "(" + version + ")")) || [];
                }
                catch (err) {
                    _this.IMSItems = [];
                }
                try {
                    _this.IMSSettings = JSON.parse(self.localStorage.getItem(_this.store + "_" + "IMS_settings" + "(" + version + ")")) || [];
                }
                catch (err) {
                    _this.IMSSettings = [];
                }
                _this.priceSchedule(_this.IMSProducts);
                _this.validateIMS(_this.IMSProducts, _this.IMSItems);
                try {
                    _this.alignItems(_this.integrationItems, _this.integrationMods, _this.integrationDiscounts, _this.IMSProducts);
                }
                catch (err) { }
                if (_this.API === "trm" || _this.API === "ims") { _this.formatIMS(_this.IMSProducts); }
                if (_this.API === "webtrition") { _this.integrationItems = _this.formatWebtrition(_this.integrationItems); }
                $(".loading").hide();
                _this.IMSItems = _this.mergeIMS(_this.IMSProducts, _this.IMSItems);
                menuLayout.init(_this.IMSItems, _this.IMSProducts, _this.IMSSettings, _this.integrationItems, _this.API);
            }
        };
        return App;
    })();
    IMSintegration.App = App;
})(IMSintegration || (IMSintegration = {}));

//helper functions
var validateItems = function (items, station, period, type) {
    var currentDay = currentTime();
    station = station || mealStation || AssetConfiguration.Display || "undefined";
    period = period || mealPeriod || AssetConfiguration.Daypart || "undefined";
    type = type || menuType || "undefined";
    // Validate dates
    items.forEach(function (each) {
        // mealTracker || webtrition || IMS || bonAppetit
        each.period = each.period || each.mealPeriod || each.imsDaypartName || each.daypart_label || "undefined";
        each.station = each.category || each.mealStation || each.menuZoneId || each.station || "undefined";
        //meal tracker
        each.type = each.type || "undefined";
    });
    var dateValidated = items.filter(function (each) { return new Date(each.date).toDateString() === new Date(currentDay).toDateString(); });
    if (!dateValidated.length) {
        IMSintegration.Integration.prototype.showConnect(true, "forestgreen", "integration", station + " not serving", "error");
        //full screen error
        var obj = {
            "issue": "No Menu Items Available",
            "source": source,
            "detail": "There are no menu items available for " + station + " on " + new Date(currentDay).toLocaleDateString() + "."
        };
        if($(".full-screen-error-wrapper").length){
            return;
        }
        var connect = Mustache.to_html(FULLSCREENERROR, obj);
        $("body").append(connect);
        return [];
    }
    var typeValidated = dateValidated.filter(function (each) { return normalize(each.type) === normalize(type); });
    if (!typeValidated.length) {
        IMSintegration.Integration.prototype.showConnect(true, "forestgreen", "integration", station + " not serving", "error");
        return [];
    }

    var schedulerValidated = typeValidated.filter(function (each) {
        each.engaged = each.hasOwnProperty('engaged') ? each.engaged : true;
        each.active = each.hasOwnProperty('active') ? each.active : true;
        each.enabled = each.hasOwnProperty('enabled') ? each.enabled : true;
        return (each.active && each.engaged && each.enabled);
    });
    if (!schedulerValidated.length) {
        IMSintegration.Integration.prototype.showConnect(true, "forestgreen", "integration", station + " not serving", "error");
        return [];
    }
    // Normalize period (letters only) and station (letters and numbers)
    function normalize(str) {
        return String(str || "").replace(/[^a-zA-Z]/g, "").toLowerCase();
    }
    function normalizeStation(str) {
        return String(str || "")
            .normalize("NFD") // 1. Decompose accents
            .replace(/[\u0300-\u036f]/g, "") // 2. Remove the accent marks (compatible with older browsers)
            .replace(/[^a-zA-Z0-9]/g, "") // 3. Remove everything else
            .toLowerCase(); // 4. Convert to lowercase
    }
 
    var filteredItems = schedulerValidated.filter(function (each) {
        return normalize(each.period) === normalize(period) &&
            normalizeStation(each.station) === normalizeStation(station);
    });
    if (!filteredItems.length) {
        IMSintegration.Integration.prototype.showConnect(true, "forestgreen", "integration", station + " not serving", "error");
        var obj = {
            "issue": "Station Not Serving",
            "source": "validate",
            "detail": "This screen has no menu Items published and is looking for the Station  " + `"` + station + `"` + "."
        };
        if($(".full-screen-error-wrapper").length){
            return;
        }
        var connect = Mustache.to_html(FULLSCREENERROR, obj);
        $("body").append(connect);
        return [];
    }
    IMSintegration.Integration.prototype.showConnect(false, "forestgreen", "integration");
    return filteredItems;
};