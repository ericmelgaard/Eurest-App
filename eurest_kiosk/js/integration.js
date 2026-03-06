"use strict";
//Publisher: Wand Digital
//Date: 05.30.2025
//Version: 60.0
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var IMSintegration;
(function (wandDigital) {
    var Integration = (function () {
        function Integration(isLeader, isUsingIndexedDB) {
            this.TABLE_NAME = "";
            this.apiKey = "";
            this.lastSync;
            this.minUpdate = 900000; //15 min
            this.maxUpdate = 3600000; //60 nin
            this.integrationUpdateInterval = this.maxUpdate;
            this.settingsMinUpdate = 900000; //15 min
            this.settingsMaxUpdate = 3600000; //60 nin
            this.IMSminUpdate = 3600000; //60 min
            this.IMSmaxUpdate = 7200000; //120 min
            this.fallbackInterval = 2000;
            this.IMS_TimeOuts = [];
            this.Integration_TimeOuts = [];
            this.setting_TimeOuts = [];
            this.IMSUpdateCount = 0; //update que counter
            this.app = app;
            this.websocket = null;
            this.updateQueue = null;
            this.settings = [];
            this.brand = "";
            this.establishment = "";
            this.trmStoreId = "";
            this.store = "";
            this.API = "";
            this.business_unit = "";
            this.location = "";
            this.imsItemsUpdateInterval =
                Math.floor(Math.random() * (this.IMSmaxUpdate - this.IMSminUpdate + 1)) + this.IMSminUpdate;
            this.imsSettingsUpdateInterval =
                Math.floor(Math.random() * (this.settingsMaxUpdate - this.settingsMinUpdate + 1)) + this.settingsMinUpdate;
            this.db = null;
            this.attempts = 0; // exponential retries limit since expectin 204s
            this.settingsRetries = 2; // hard limit
            this.imsRetries = 3; // hard limit
            //          //***QA Environment***
            //          this.orderStatus = "orderstatus-qa.wanddigital.com";
            //          this.IMSwand = "https://api-qa.wanddigital.com";
            // this.wand = "api-qa.wanddigital.com";
            //***Production Environment***
            this.orderStatus = "orderstatus-prod.wanddigital.com";
            this.IMSwand = "https://api.wanddigital.com";
            this.wand = "api.wanddigital.com";
            this.init(isLeader, isUsingIndexedDB);
        }
        Integration.prototype.init = function (isLeader, isUsingIndexedDB) {
            var _this = this;
            if ($(".loading").length === 0) {
                var loading = Mustache.to_html(Integration.loading);
                $("body").append(loading);
            }
            else {
                $(".loading").remove();
                var loading = Mustache.to_html(Integration.loading);
                $("body").append(loading);
            }
            //inform.. no action
            if (development && !isPreview) {
                _this.showConnect(true, "black", "devmode", "Development Mode", "error_outline");
            }
            //possible future action with dummy data
            if (isPreview) { }
            //confirm whitelisting in place
            if (isLeader) {
                this.checkConnections();
            }
            //store key must exist
            _this.getKeys().then(function () {
                _this.TABLE_NAME = "IMS_" + _this.store + "(" + version + ")";
                _this.getStartMethod(isLeader, isUsingIndexedDB);
            });
        };
        Integration.prototype.getKeys = function () {
            var _this = this;
            var attempts = 0;
            //windows forces complexity and promise use..
            return new Promise(function (resolve, reject) {
                function queryKeys() {
                    if (!development && !isPreview) {
                        _this.store = AssetConfiguration.SKey || $("#storeKey").text().trim().toLowerCase();
                        _this.apiKey = $("#apiKey").text().trim().toLowerCase() || settingKey;
                    }
                    else {
                        _this.store = Store_Key || AssetConfiguration.SKey || $("#storeKey").text().trim().toLowerCase();
                        _this.apiKey = apiKey || settingKey || $("#apiKey").text().trim().toLowerCase();
                    }
                    if ((_this.apiKey.length === 0 && isUsingSettings) || !_this.store) {
                        if (!_this.store) {
                            if (!attempts) {
                                console.warn("Looking for store key...");
                                _this.showConnect(true, "darkgrey", "initStore", "Store key is missing", "error");
                            }
                        }
                        else {
                            _this.showConnect(false, "darkgrey", "initStore");
                        }
                        if (_this.apiKey.length === 0 && isUsingSettings) {
                            if (!attempts) {
                                console.warn("Looking for API key...");
                                _this.showConnect(true, "grey", "initAPI", "API key is missing", "error");
                            }
                        }
                        else {
                            _this.showConnect(false, "grey", "initAPI");
                        }
                        attempts++;
                        setTimeout(queryKeys, 250);
                    }
                    else {
                        _this.showConnect(false, "darkgrey", "initStore");
                        _this.showConnect(false, "grey", "initAPI");
                        resolve();
                    }
                }
                queryKeys();
            });
        };
        Integration.prototype.getStartMethod = function (isLeader, isUsingIndexedDB) {
            var _this = this;
            var trmAnchors = JSON.parse(self.localStorage.getItem(_this.store + "_" + "anchors" + "(" + version + ")")) || null;
            var trmConfigs = JSON.parse(self.localStorage.getItem(_this.store + "_" + "store_context" + "(" + version + ")")) || null;
            if (trmConfigs && trmConfigs.indexedDB !== isUsingIndexedDB) {
                //off chance a device upgrades version past threshold of v70
                trmConfigs = null;
            }
            if (trmConfigs) {
                //make cached values avialable for cached start
                this.setconfigs(trmConfigs);
            }
            if (trmAnchors && Object.keys(trmAnchors).length > 1) {
                if (trmAnchors.IMS) {
                    //IMS and Settings: should load menu - cached start
                    $(".loading").remove();
                    $(".asset-wrapper").removeClass("blur");
                    trmAnchors = true;
                }
                else {
                    //Settings and API: should not load - but still cached start since API update isn't enough alone for full start
                    trmAnchors = true;
                }
            }
            else if (trmAnchors && Object.keys(trmAnchors).length === 1) {
                //Settings only: should not load and go full start
                trmAnchors = null;
            }
            if (isUsingIndexedDB) {
                _this.openDatabase().then(function () {
                    if (trmAnchors && trmConfigs) {
                        if (isLeader) {
                            _this.cached_start(isUsingIndexedDB);
                        }
                        else {
                            _this.observer_cachedStart(isUsingIndexedDB);
                        }
                    }
                    else {
                        if (isLeader) {
                            _this.full_start(isUsingIndexedDB);
                        }
                        else {
                            _this.observer_fullstart(isUsingIndexedDB);
                        }
                    }
                    //dont stack instances on each other!
                    if (!_this.websocket) {
                        _this.websocket = _this.connectWebsocket();
                    }
                    if (!_this.updateQueue) {
                        _this.updateQueue = _this.IMSUpdateQueue();
                    }
                }).catch(function (error) {
                    console.error("Failed to open database:", error);
                });
            }
            else {
                if (isLeader) {
                    if (trmAnchors && trmConfigs) {
                        _this.cached_start(isUsingIndexedDB);
                    }
                    else {
                        _this.full_start(isUsingIndexedDB);
                    }
                    if (!_this.websocket) {
                        _this.websocket = _this.connectWebsocket();
                    }
                    if (!_this.updateQueue) {
                        _this.updateQueue = _this.IMSUpdateQueue();
                    }
                }
                else {
                    if (trmAnchors && trmConfigs) {
                        _this.observer_cachedStart(isUsingIndexedDB);
                    }
                    else {
                        _this.observer_fullstart(isUsingIndexedDB);
                    }
                }
            }
        };
        Integration.prototype.checkConnections = function () {
            var _this = this;
            //          //Status Checks
            function checkConnection(url, source, color) {
                fetch(url)
                    .then(function (response) {
                    if (response.ok) {
                        if ($(".connectError." + source).length > 0) {
                            var obj = {
                                "response": "Resolved :",
                                "source": source,
                                "url": url.split(".com/")[0] + ".com/",
                            };
                            var connect = Mustache.to_html(Integration.pingSuccess, obj);
                            $(".connectError." + source).replaceWith(connect);
                            if (leader) {
                                setTimeout(function () {
                                    self.localStorage.removeItem(heartbeatKey);
                                    location.reload();
                                }, 5000);
                            }
                        }
                        var obj = {
                            "response": response.status,
                            "source": source,
                            "url": url.split(".com/")[0] + ".com/",
                        };
                        _this.showConnect(false, "black", obj.source);
                    }
                    else {
                        if ($(".connectError." + source).length > 0) {
                            //retry don't add more
                            setTimeout(function () {
                                checkConnection(url, source);
                            }, 30000);
                            return;
                        }
                        var obj = {
                            "response": response.status,
                            "source": source,
                            "url": url.split(".com/")[0] + ".com/",
                        };
                        _this.showConnect(true, color, obj.source, url.split(".com/")[0] + ".com/" + " is not accessible", "warning");
                        var connect = Mustache.to_html(Integration.pingError, obj);
                        $(".loading-wrapper .spinner").remove();
                        $(".loading-wrapper").append(connect);
                        //retry
                        setTimeout(function () {
                            checkConnection(url, source);
                        }, 30000);
                    }
                })
                    .catch(function (error) {
                    if ($(".connectError." + source).length > 0) {
                        //retry don't add more
                        setTimeout(function () {
                            checkConnection(url, source);
                        }, 30000);
                        return;
                    }
                    var obj = {
                        "response": "CONNECTION ERROR :",
                        "source": source,
                        "url": url.split(".com/")[0] + ".com/",
                    };
                    _this.showConnect(true, color, obj.source, url.split(".com/")[0].toLowerCase() + ".com/" + " is not accessible", "warning");
                    var connect = Mustache.to_html(Integration.pingError, obj);
                    $(".loading-wrapper .spinner").remove();
                    $(".loading-wrapper").append(connect);
                    //retry
                    setTimeout(function () {
                        checkConnection(url, source);
                    }, 30000);
                });
            }
            checkConnection('https://trm-client01.wandcorp.com/Trm.Api.Webservices.1412/json/reply/DefaultRequest', "wand", "#f8b02d");
            checkConnection('https://api.wanddigital.com/defaultrequest', "wanddigital", "#b12228");
        };
        Integration.prototype.removeDuplicates = function (originalArray, objKey) {
            //for Qu basically.. would like to address API side.
            var trimmedArray = [];
            var values = {};
            for (var i = 0; i < originalArray.length; i++) {
                var value = originalArray[i][objKey];
                var price = originalArray[i].price;
                if (values[value] !== undefined) {
                    // Remove the previously seen item
                    trimmedArray = trimmedArray.filter(function (item) { return item[objKey] !== value; });
                    // If the current item has a price of 0, skip adding it
                    if (price === 0) {
                        continue;
                    }
                }
                // If the current item does not have a price of 0, remove the previously added item with price 0
                if (price !== 0 && values[value] === 0) {
                    trimmedArray = trimmedArray.filter(function (item) { return item[objKey] !== value || item.price !== 0; });
                }
                trimmedArray.push(originalArray[i]);
                values[value] = price;
            }
            return trimmedArray;
        };
        Integration.prototype.updateConfigs = function (settings) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                try {
                    var configsObj = {};
                    settings.forEach(function (each) {
                        if (settingId_PartnerAPI.indexOf(each.settingID) > -1) {
                            configsObj.API = each.value.trim().toLowerCase();
                        }
                        if (settingId_PartnerSite.indexOf(each.settingID) > -1) {
                            configsObj.siteId = each.value.trim().toLowerCase();
                        }
                        if (settingsId_Brand.indexOf(each.settingID) > -1) {
                            configsObj.brand = each.value.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
                        }
                    });
                    if (development || isPreview) {
                        configsObj.API = Partner_API ? Partner_API.toLowerCase() : configsObj.API;
                        configsObj.siteId = Establishment ? Establishment.toLowerCase() : configsObj.siteId;
                        configsObj.brand = Brand ? Brand.toLowerCase() : configsObj.brand;
                    }
                    //catch no settings values
                    if (!configsObj.API) {
                        configsObj.API = "ims";
                    }
                    configsObj.indexedDB = isUsingIndexedDB ? true : false;
                    _this.setconfigs(configsObj);
                    // Check for integration updates
                    var previous = self.localStorage.getItem(_this.store + "_" + "store_context" + "(" + version + ")") || null;
                    if (previous !== JSON.stringify(configsObj)) {
                        // Important
                        if (previous) {
                            console.log("Integration change detected...");
                            _this.deleteAnchors();
                            _this.getIntegrationData("update");
                        }
                        else {
                            //first run
                        }
                    }
                    self.localStorage.setItem(_this.store + "_" + "store_context" + "(" + version + ")", JSON.stringify(configsObj));
                    resolve(configsObj);
                }
                catch (error) {
                    reject(error);
                }
            });
        };
        Integration.prototype.setconfigs = function (configsObj) {
            var _this = this;
            if (!configsObj) {
                return;
            }
            this.brand = configsObj.brand;
            this.establishment = configsObj.siteId;
            this.API = configsObj.API;
            //webt support 04.04.2025
            _this.business_unit = _this.business_unit ? _this.business_unit : this.brand;
            _this.location = _this.location ? _this.location : this.establishment;
            // No change for dev
            this.trmStoreId = AssetConfiguration.SId;
        };
        Integration.prototype.cached_start = function () {
            var _this = this;
            if (isUsingIndexedDB) {
                _this.app.db = _this.db;
            }
            _this.app.store = _this.store;
            _this.app.init(_this.API, false);
            _this.getSettings();
            _this.getIMSData();
            if (_this.API != "ims" || _this.API != "trm") {
                _this.getIntegrationData("patch");
            }
        };
        Integration.prototype.observer_fullstart = function () {
            var _this = this;
            //start but do not get data
            if (isUsingIndexedDB) {
                _this.app.db = _this.db;
            }
            _this.app.store = _this.store;
            _this.app.init(_this.API, true);
        };
        Integration.prototype.observer_cachedStart = function () {
            var _this = this;
            //start but do not get data
            if (isUsingIndexedDB) {
                _this.app.db = _this.db;
            }
            _this.app.store = _this.store;
            _this.app.init(_this.API, false);
        };
        Integration.prototype.full_start = function () {
            var _this = this;
            // Start with empty or changed databases
            _this.getSettings().then(function () {
                if (isUsingIndexedDB) {
                    _this.app.db = _this.db;
                }
                _this.app.store = _this.store;
                _this.app.init(_this.API, true);
                _this.getIMSData();
                if (_this.API != "ims" && _this.API != "trm") {
                    _this.getIntegrationData("update");
                }
            }).catch(function (error) {
                console.error("Failed to sync settings:", error);
                setTimeout(function () {
                    _this.full_start();
                }, _this.imsSettingsUpdateInterval);
            });
        };
        Integration.prototype.new_leader = function () {
            var _this = this;
            //new leader established, assume fresh calls are needed
            _this.getSettings();
            _this.getIMSData();
            if (_this.API != "ims" && _this.API != "trm") {
                _this.getIntegrationData("patch");
            }
            if (!_this.websocket) {
                _this.websocket = _this.connectWebsocket();
            }
            if (!_this.updateQueue) {
                _this.updateQueue = _this.IMSUpdateQueue();
            }
        };
        Integration.prototype.openDatabase = function () {
            var _this = this;
            if (!_this.db) {
                _this.db = new Dexie(_this.TABLE_NAME);
            }
            // Function to initialize database.. 
            function initializeDatabase() {
                var db = _this.db;
                // Define schema and versions as per your control
                _this.db.version(version).stores({
                    IMS_settings: "settingID, setting, value",
                    IMS_products: "productId, productName, externalId, categoryId, subCategoryId, price",
                    IMS_menuItems: "menuItemId, menuZoneName, imsDaypartName, day",
                    integration_products: "mappingId, name, category, price",
                    integration_modifiers: "mappingId, name, category, price",
                    integration_discounts: "mappingId, name, price",
                    trm_menu_items: "id, name, mealStation, date, locationId, businessUnitId",
                    trm_stations: "name, locationId, date",
                });
                return db.open().then(function () {
                    //no message
                }).catch(function (error) {
                    if (error.name === 'NotFoundError' || error.name === 'VersionError') {
                        console.warn('Upgrade error detected. Needs upgrade.');
                        throw error; // Rethrow to handle in the outer Promise
                    }
                    else {
                        console.error('Error opening database:', error.message);
                        throw error; // Rethrow to handle in the outer Promise
                    }
                });
            }
            //handle a close.. not sure where it come from
            _this.db.on("close", function () {
                _this.openDatabase().then(function () {
                    _this.app.db = _this.db;
                });
            });
            return initializeDatabase().then(function () {
                //no action
            }).catch(function (error) {
                console.error('Failed to initialize and upgrade database:', error);
                isUsingIndexedDB = false;
                _this.init(true, false);
                console.warn("IndexedDB is not available, switching to localStorage.");
            });
        };
        Integration.prototype.getSettings = function () {
            var _this = this;
            if (!leader) {
                return;
            }
            _this.setting_TimeOuts.forEach(function (each) {
                clearTimeout(each);
            });
            // Return a promise
            return new Promise(function (resolve, reject) {
                if (!isUsingSettings) {
                    resolve();
                    return;
                }
                function fetchSettings(retries) {
                    var url = "https://trm-client01.wandcorp.com/trmws.digitalproxyws/json/reply/StoreSettingsRequest?apiKey=".concat(_this.apiKey, "&deviceNumber=&storeKey=").concat(_this.store);
                    $.get(url)
                        .done(function (data) {
                        _this.addSettings(data).then(function () {
                            resolve();
                            _this.setSync("settings");
                            _this.showConnect(false, "steelblue", "settings");
                            _this.setting_TimeOuts.push(setTimeout(function () {
                                _this.getSettings();
                            }, _this.imsSettingsUpdateInterval));
                        }).catch(function (error) {
                            console.error("Error in addSettings:", error);
                            reject(error);
                        });
                    })
                        .fail(function () {
                        console.warn("Could not load settings data!");
                        if (retries > 0) {
                            console.log("Retrying... Remaining retries:", retries);
                            setTimeout(function () {
                                fetchSettings(retries - 1);
                            }, 30000);
                        }
                        else {
                            _this.setting_TimeOuts.push(setTimeout(function () {
                                _this.getSettings();
                            }, _this.imsSettingsUpdateInterval));
                            _this.showConnect(true, "steelblue", "settings", "Failed to sync settings", "error");
                            reject(new Error("Failed to load settings data after retries."));
                        }
                    });
                }
                fetchSettings(_this.settingsRetries);
            });
        };
        Integration.prototype.getIMSData = function () {
            var _this = this;
            if (!leader) {
                return;
            }
            _this.IMS_TimeOuts.forEach(function (each) {
                clearTimeout(each);
            });
            var url = _this.IMSwand + "/services/ims/client/menusystem?" + "StoreKey=" + _this.store + "&Date=" + currentTime().split("T")[0];
            $.get(url, function (menuItems) {
                _this.addIMSData(menuItems);
            })
                .done(function () {
                _this.showConnect(false, "blueviolet", "IMS");
                _this.setSync("IMS");
                _this.IMS_TimeOuts.push(setTimeout(function () {
                    _this.getIMSData();
                }, _this.imsItemsUpdateInterval));
            })
                .fail(function () {
                console.warn("Could not load ims data!");
                _this.showConnect(true, "blueviolet", "IMS", "Failed to sync IMS data", "error");
                if (_this.imsRetries > 0) {
                    _this.imsRetries = _this.imsRetries - 1;
                    _this.IMS_TimeOuts.push(setTimeout(function () {
                        _this.getIMSData();
                    }, 30000));
                }
                else {
                    _this.IMS_TimeOuts.push(setTimeout(function () {
                        _this.imsRetries = 1;
                        _this.getIMSData();
                    }, _this.imsItemsUpdateInterval));
                }
            });
        };
        Integration.prototype.addIMSData = function (data) {
            //format to store in indexedDB
            var _this = this;
            var menuItems = data.value.response.menuItems ? data.value.response.menuItems : [];
            var products = data.value.response.products ? data.value.response.products : [];
            products.forEach(function (each) {
                //rich text editor support
                each.menuDescription = each.menuDescription ? each.menuDescription.replace("<span>", "").replace("</span>", "") : "";
                each.displayName = each.displayName ? each.displayName.replace("<span>", "").replace("</span>", "") : "";
                each.menuDescription = each.menuDescription.replace("<p><br></p>", "").replace(/<\/p><p>/g, '<br>').replace(/<p>/, "").replace(/<\/p>/, "");
                each.displayName = each.displayName.replace("<p><br></p>", "").replace(/<\/p><p>/g, '<br>').replace(/<p>/, "").replace(/<\/p>/, "");
                //legacy menuItem request support
                each.menuItemName = each.productName ? each.productName : "";
                each.menuItemId = each.productId ? each.productId : "";
            });
            if (data.isSuccess) {
                if (menuItems.length > 0) {
                    _this.addItems(menuItems, "update", "IMS_menuItems", "menuItemId");
                }
                if (products.length > 0) {
                    _this.addItems(products, "patch", "IMS_products", "productId");
                }
                else {
                    console.warn("IMS products not found or empty!");
                    this.app.IMSUpdate = true;
                }
            }
            try {
            }
            catch (err) {
                console.error("this.app does not exist yet...");
            }
        };
        Integration.prototype.addSettings = function (data) {
            var _this_1 = this;
            //format to store in indexedDB
            var _this = this;
            return new Promise(function (resolve, reject) {
                try {
                    var settings = data.settings;
                    var setting;
                    var setting;
                    var value;
                    var settingID;
                    var groupID;
                    settings.forEach(function (each, idx) {
                        setting = each[0];
                        value = each[1];
                        settingID = each[2];
                        groupID = each[3];
                        settings[idx] = {
                            setting: setting,
                            value: value,
                            settingID: settingID,
                            groupID: groupID,
                        };
                        // Add an id so the template works
                        settings[idx].id = settingID;
                    });
                    _this.updateConfigs(settings).then(resolve());
                    if (settings.length > 0) {
                        _this.addItems(settings, "update", "IMS_settings", "settingID");
                    }
                    else {
                        console.warn("No settings found in the response.");
                        _this_1.app.settingsUpdate = true;
                    }
                }
                catch (error) {
                    reject(error);
                }
            });
        };
        Integration.prototype.getIntegrationData = function (action) {
            var _this = this;
            if (!_this.API || !leader) {
                return;
            }
            _this.Integration_TimeOuts.forEach(function (each) {
                clearTimeout(each);
            });
            var key = _this.store + "_" + "anchors" + "(" + version + ")";
            var anchors = JSON.parse(self.localStorage.getItem(key)) || {};
            var modifiedDate = anchors[_this.API] ? anchors[_this.API].date.split("T")[0] : "";
            _this.integrationUpdateInterval = Math.floor(Math.random() * (_this.maxUpdate - _this.minUpdate + 1)) + _this.minUpdate;
            _this.fallbackInterval = _this.attempts === 0 ? 2500 : _this.fallbackInterval * 5;
            _this.attempts++;
            if (_this.fallbackInterval > _this.integrationUpdateInterval) {
                _this.fallbackInterval = _this.integrationUpdateInterval;
            }
            var url = "";
            if (_this.API === "revel") {
                _this.maxUpdate = 9000000;
                _this.minUpdate = 18000000;
                _this.integrationUpdateInterval = Math.floor(Math.random() * (_this.maxUpdate - _this.minUpdate + 1)) + _this.minUpdate;
                url = "https://revel-" + _this.wand + "/integration?client=" + _this.brand + "&id=" + _this.establishment + "&date=" + modifiedDate + "&storeId=" + _this.store;
            }
            if (_this.API === "qu") {
                var timeOfDay = new Date().toTimeString().split(" ")[0];
                modifiedDate = anchors[_this.API] ? anchors[_this.API].date.split("T")[0] : currentTime().split("T")[0];
                url = "https://qubeyond-" + _this.wand + "/integration?id=" + _this.establishment + "&concept=" + _this.brand + "&date=" + modifiedDate + "&time=" + timeOfDay;
            }
            if (_this.API === "par") {
                url = "https://" + _this.wand + "/integrations/parbrink/v1" + "?concept=" + _this.brand + "&id=" + _this.establishment;
            }
            if (_this.API === "toast") {
                var apiEndpoint = "https://" + _this.wand + "/services/toast/client/menu/";
                url = {
                    url: apiEndpoint,
                    headers: {
                        Authorization: _this.trmStoreId,
                    },
                };
            }
            if (_this.API === "shift4") {
                url = "https://shift4-" + "api.wanddigital.com" + "/integration" + "?id=" + _this.establishment;
            }
            if (_this.API === "simphony") {
                url = "https://simphony-" + "api.wanddigital.com" + "/integration" + "?concept=" + _this.brand + "&id=" + _this.establishment;
            }
            if (_this.API === "transact") {
                url = "https://transact-" + "api.wanddigital.com" + "/integration" + "?concept=" + _this.brand;
            }
            if (_this.API === "webtrition") {
                var url = "https://" +
                    _this.wand +
                    "/services/webtrition/client/wds" +
                    "?SapCode=" +
                    _this.brand +
                    "&Venue=" +
                    _this.establishment +
                    "&mealPeriod=" +
                    "&MenuDate=" +
                    currentTime() +
                    "&SourceSystem=1" +
                    "&Days=2&IncludeNutrition=true&IncludeAllergens=true&IncludeIngredients=true" +
                    "&IncludeRecipe=" + includeRecipes;
            }
            if (url === "") {
                console.warn("No integration API configured for " + _this.API);
                return;
            }
            $.get(url, function (data, status, xhr) {
                var statusCode = xhr.status;
                var message = data;
                if (statusCode === 204) {
                    _this.integrationUpdateInterval = _this.fallbackInterval;
                    integration.showConnect(true, "forestgreen", _this.API, "Failed to sync Integration data", "error");
                }
                if (statusCode === 200) {
                    integration.showConnect(false, "forestgreen", _this.API);
                    _this.setSync(_this.API);
                    _this.addIntegrationData(message, action);
                    _this.attempts = 0;
                }
                _this.Integration_TimeOuts.push(setTimeout(function () {
                    _this.getIntegrationData();
                }, _this.integrationUpdateInterval));
            })
                .fail(function () {
                console.warn("Could not load integration data!");
                _this.integrationUpdateInterval = _this.attempts > 1 ? _this.integrationUpdateInterval : _this.fallbackInterval;
                integration.showConnect(true, "forestgreen", _this.API, "Failed to sync Integration data", "error");
                if (_this.attempts === 2) {
                    try {
                        _this.app.readDatabase();
                    }
                    catch (err) {
                        console.error("configuration for " + _this.API + " is incorrect");
                        _this.attempts = 0;
                    }
                }
                _this.Integration_TimeOuts.push(setTimeout(function () {
                    _this.getIntegrationData();
                }, _this.integrationUpdateInterval));
            });
        };
        Integration.prototype.addIntegrationData = function (data, action) {
            //format to store in indexedDB
            var _this = this;
            if (!data) {
                return;
            }
            var products;
            var modifiers;
            var discounts;
            if (_this.API === "qu") {
                products = data.menuItems ? _this.formatQu(data.menuItems) : {};
                modifiers = data.modifiers ? _this.formatQu(data.modifiers) : {};
                discounts = data.discounts ? _this.formatQu(data.discounts) : {};
            }
            if (_this.API === "revel") {
                products = data.products ? _this.formatRevel(data.products) : {};
                modifiers = data.modifiers ? _this.formatRevel(data.modifiers) : {};
            }
            if (_this.API === "toast") {
                //gets full return, delete items not present
                action = "update";
                products = data ? _this.formatToast(data) : {};
            }
            if (_this.API === "par") {
                //gets full return, delete items not present
                action = "update";
                products = data.items ? _this.formatPar(data.items, false) : {};
                modifiers = data.modifier_groups ? _this.formatPar(data.modifier_groups, true) : {};
            }
            if (_this.API === "shift4") {
                //gets full return, delete items not present
                action = "update";
                shiftData = data.items ? _this.formatShift(data) : {};
                products = shiftData.items ? shiftData.items : {};
                modifiers = shiftData.modifiers ? shiftData.modifiers : {};
            }
            if (_this.API === "simphony") {
                simphonyData = data.data ? _this.formatSimphony(data.data) : {};
                products = simphonyData.items ? simphonyData.items : {};
                modifiers = simphonyData.modifiers ? simphonyData.modifiers : {};
            }
            if (_this.API === "transact") {
                products = data.data ? _this.formatTransact(data.data) : {};
            }
            if (_this.API === "webtrition") {
                action = "update";
                products = data.menuItems ? _this.formatWebtrition(data.menuItems) : {};
            }
            if (products && products.length > 0) {
                _this.addItems(products, action, "integration_products", "mappingId");
            }
            if (modifiers && modifiers.length > 0) {
                _this.addItems(modifiers, action, "integration_modifiers", "mappingId");
            }
            if (discounts && discounts.length > 0) {
                discounts.forEach(function (item, idx) {
                    if (_this.API === "qu") {
                        discounts[idx].mappingId = item.id.toString();
                        discounts[idx].price = item.discountAmount;
                    }
                });
                _this.addItems(discounts, action, "integration_discounts", "mappingId");
            }
        };
        Integration.prototype.addItems = function (items_1) {
            return __awaiter(this, arguments, void 0, function (items, action, table, id) {
                var _this, handleDatabaseChangeEvent, handleIndexedDB, handleLocalStorage, error_1;
                var _this_1 = this;
                if (action === void 0) { action = "patch"; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _this = this;
                            handleDatabaseChangeEvent = function (table, item, action) {
                                window.dispatchEvent(new CustomEvent('dbChangeEvent', {
                                    detail: {
                                        table: table,
                                        item: item,
                                        action: action
                                    }
                                }));
                                localStorage.setItem(_this.store + '_dbChangeEvent' + "(" + version + ")", JSON.stringify({
                                    table: table,
                                    item: item,
                                    action: action
                                }));
                            };
                            handleIndexedDB = function () { return __awaiter(_this_1, void 0, void 0, function () {
                                var _this_1 = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, _this.db.transaction('rw', _this.db[table], function () { return __awaiter(_this_1, void 0, void 0, function () {
                                                var allItems, newIds, _i, items_2, item, existingItem, _a, allItems_1, item, _b, items_3, item, existingItem;
                                                return __generator(this, function (_c) {
                                                    switch (_c.label) {
                                                        case 0: return [4 /*yield*/, _this.db[table].toArray()];
                                                        case 1:
                                                            allItems = _c.sent();
                                                            newIds = items.map(function (item) { return item[id]; });
                                                            if (!(action === 'patch' || action === 'update')) return [3 /*break*/, 14];
                                                            _i = 0, items_2 = items;
                                                            _c.label = 2;
                                                        case 2:
                                                            if (!(_i < items_2.length)) return [3 /*break*/, 9];
                                                            item = items_2[_i];
                                                            return [4 /*yield*/, _this.db[table].get(item[id])];
                                                        case 3:
                                                            existingItem = _c.sent();
                                                            if (!existingItem) return [3 /*break*/, 6];
                                                            if (!!_.isEqual(existingItem, item)) return [3 /*break*/, 5];
                                                            return [4 /*yield*/, _this.db[table].put(item)];
                                                        case 4:
                                                            _c.sent();
                                                            handleDatabaseChangeEvent(table, item, 'updated');
                                                            _c.label = 5;
                                                        case 5: return [3 /*break*/, 8];
                                                        case 6: return [4 /*yield*/, _this.db[table].add(item)];
                                                        case 7:
                                                            _c.sent();
                                                            handleDatabaseChangeEvent(table, item, 'added');
                                                            _c.label = 8;
                                                        case 8:
                                                            _i++;
                                                            return [3 /*break*/, 2];
                                                        case 9:
                                                            if (!(action === 'update')) return [3 /*break*/, 13];
                                                            _a = 0, allItems_1 = allItems;
                                                            _c.label = 10;
                                                        case 10:
                                                            if (!(_a < allItems_1.length)) return [3 /*break*/, 13];
                                                            item = allItems_1[_a];
                                                            if (!!newIds.includes(item[id])) return [3 /*break*/, 12];
                                                            return [4 /*yield*/, _this.db[table].delete(item[id])];
                                                        case 11:
                                                            _c.sent();
                                                            handleDatabaseChangeEvent(table, item, 'deleted');
                                                            _c.label = 12;
                                                        case 12:
                                                            _a++;
                                                            return [3 /*break*/, 10];
                                                        case 13: return [3 /*break*/, 19];
                                                        case 14:
                                                            if (!(action === 'delete')) return [3 /*break*/, 19];
                                                            _b = 0, items_3 = items;
                                                            _c.label = 15;
                                                        case 15:
                                                            if (!(_b < items_3.length)) return [3 /*break*/, 19];
                                                            item = items_3[_b];
                                                            return [4 /*yield*/, _this.db[table].get(item[id])];
                                                        case 16:
                                                            existingItem = _c.sent();
                                                            if (!existingItem) return [3 /*break*/, 18];
                                                            return [4 /*yield*/, _this.db[table].delete(item[id])];
                                                        case 17:
                                                            _c.sent();
                                                            handleDatabaseChangeEvent(table, item, 'deleted');
                                                            _c.label = 18;
                                                        case 18:
                                                            _b++;
                                                            return [3 /*break*/, 15];
                                                        case 19: return [2 /*return*/];
                                                    }
                                                });
                                            }); })];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); };
                            handleLocalStorage = function () {
                                var oldValue = JSON.parse(localStorage.getItem(_this.store + "_" + table + "(" + version + ")")) || [];
                                var newProductMap = new Map(items.map(function (product) { return [product[id], product]; }));
                                if (action === 'patch' || action === 'update') {
                                    oldValue = oldValue.filter(function (existingProduct) {
                                        if (!Array.from(newProductMap.keys()).includes(existingProduct[id]) && action === 'update') {
                                            handleDatabaseChangeEvent(table, existingProduct, 'delete');
                                            return false;
                                        }
                                        return true;
                                    });
                                    items.forEach(function (newProduct) {
                                        var existingProduct = oldValue.find(function (product) { return product[id] === newProduct[id]; });
                                        if (existingProduct) {
                                            if (!_.isEqual(existingProduct, newProduct)) {
                                                oldValue = oldValue.map(function (product) { return product[id] === newProduct[id] ? newProduct : product; });
                                                handleDatabaseChangeEvent(table, newProduct, 'updated');
                                            }
                                        }
                                        else {
                                            oldValue.push(newProduct);
                                            handleDatabaseChangeEvent(table, newProduct, 'added');
                                        }
                                    });
                                    if (action === 'update') {
                                        var currentIds_1 = Array.from(newProductMap.keys());
                                        oldValue = oldValue.filter(function (existingProduct) {
                                            if (!currentIds_1.includes(existingProduct[id])) {
                                                handleDatabaseChangeEvent(table, existingProduct, 'delete');
                                                return false;
                                            }
                                            return true;
                                        });
                                    }
                                }
                                else if (action === 'delete') {
                                    oldValue = oldValue.filter(function (product) {
                                        if (items.find(function (newProduct) { return newProduct[id] === product[id]; })) {
                                            handleDatabaseChangeEvent(table, product, 'delete');
                                            return false;
                                        }
                                        return true;
                                    });
                                }
                                localStorage.setItem(_this.store + "_" + table + "(" + version + ")", JSON.stringify(oldValue));
                            };
                            if (!isUsingIndexedDB) return [3 /*break*/, 5];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, handleIndexedDB()];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            error_1 = _a.sent();
                            if (error_1.name === "DatabaseClosedError") {
                                _this.openDatabase().then(function () {
                                    _this.app.db = _this.db;
                                    _this.app.fullStart = true;
                                    _this.full_start();
                                });
                            }
                            return [3 /*break*/, 4];
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            handleLocalStorage();
                            _a.label = 6;
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        Integration.prototype.setUpdatedDate = function (anchor) {
            var _this = this;
            var key = _this.store + "_" + "anchors" + "(" + version + ")";
            // Retrieve existing anchors from local storage
            var anchors = JSON.parse(self.localStorage.getItem(key)) || {};
            // Update the specific anchor with new data
            anchors[anchor] = {
                date: currentTime(),
                lastSync: Date.now(),
            };
            // Save the updated anchors back to local storage
            self.localStorage.setItem(key, JSON.stringify(anchors));
        };
        Integration.prototype.deleteAnchors = function () {
            var _this = this;
            var key = _this.store + "_" + "anchors" + "(" + version + ")";
            // Remove the anchors key from local storage
            self.localStorage.removeItem(key);
        };
        Integration.prototype.setSync = function (anchor) {
            var _this = this;
            var key = _this.store + "_" + "anchors" + "(" + version + ")";
            // Retrieve existing anchors from local storage
            var anchors = JSON.parse(self.localStorage.getItem(key)) || {};
            // Retrieve the modifiedTime of the specific anchor
            var modifiedTime = anchors[anchor] ? anchors[anchor].date : "";
            // Update the specific anchor's lastSync value
            anchors[anchor] = {
                date: modifiedTime,
                lastSync: Date.now(),
            };
            // Save the updated anchors back to local storage
            self.localStorage.setItem(key, JSON.stringify(anchors));
        };
        Integration.prototype.showConnect = function (toggle, color, source, issue, error) {
            //set up errors and display
            //needs future work for more verbose hover states
            if (toggle && $(".status-wrapper").length === 0) {
                var statusWrapper = document.createElement("div");
                $(statusWrapper).addClass("status-wrapper");
                $("body").append(statusWrapper);
            }
            var obj = {
                "color": color,
                "source": source,
                "issue": issue,
                "error": error
            };
            if ($(".connect" + "." + source).length === 0 && toggle) {
                var connect = Mustache.to_html(Integration.connect, obj);
                $(".status-wrapper").append(connect);
            }
            if (!toggle) {
                $(".connect" + "." + source).remove();
            }
        };
        Integration.prototype.connectWebsocket = function () {
            var _this = this;
            // Base delay for throttling (in milliseconds)
            var baseDelay = 1000; // 1 second
            var maxDelay = 30000; // 30 seconds
            var delay = baseDelay;
            function connect(reload) {
                try {
                    var url = "wss://" +
                        _this.orderStatus +
                        "/?device=IMS_MENUUPDATE_" +
                        _this.store;
                    var ws = new WebSocket(url);
                    ws.onopen = function () {
                        _this.showConnect(false, "yellow", "websocket");
                        delay = baseDelay; // Reset the delay on successful connection
                    };
                    ws.onmessage = function (e) {
                        var data = JSON.parse(e.data);
                        if (data.eventType === "heartbeat") {
                            return;
                        }
                        if (data.eventType === "PRODUCT_UPDATE" || data.eventType === "IMS_BRANDMENU_UPDATE") {
                            if (_this.IMSUpdateCount === 0) {
                                _this.getIMSData();
                                _this.IMSUpdateCount++;
                            }
                            else {
                                _this.IMSUpdateCount++;
                            }
                        }
                        if (data.eventType === "INTEGRATION_UPDATE") {
                            _this.getIntegrationData("patch");
                        }
                    };
                    ws.onclose = function (e) {
                        if (!leader) {
                            return;
                        }
                        setTimeout(function () {
                            // Increase the delay with exponential backoff, but cap it at maxDelay
                            delay = Math.min(delay * 2, maxDelay);
                            connect(true);
                        }, delay);
                    };
                    ws.onerror = function (err) {
                        console.error("Message:", "Socket encountered error: ", err.message, "Closing socket");
                        _this.showConnect(true, "yellow", "websocket", "Instant updated failed to connect", "warning");
                        ws.close();
                    };
                }
                catch (error) {
                    console.error(error);
                }
            }
            connect(); // Initial connection attempt
            return true;
        };
        Integration.prototype.IMSUpdateQueue = function () {
            var _this = this;
            //clear queue
            setTimeout(function () {
                //needs to process 
                if (_this.IMSUpdateCount > 1) {
                    _this.getIMSData();
                    _this.IMSUpdateCount = 0;
                }
                //already processed
                if (_this.IMSUpdateCount === 1) {
                    _this.IMSUpdateCount = 0;
                }
                _this.IMSUpdateQueue();
            }, 60000);
            return true;
        };
        Integration.prototype.formatPar = function (data, modifier) {
            var products = [];
            if (modifier) {
                data.forEach(function (each, idx) {
                    each.items.forEach(function (item) {
                        item.category = each.displayName;
                        item.subCategory = each.description;
                        item.mappingId = each.id + "-" + item.itemId;
                        if (item.category.toLowerCase().indexOf("olo") > -1 || item.price === "0") {
                            return;
                        }
                        products.push(item);
                    });
                });
            }
            if (!modifier) {
                data.forEach(function (each, idx) {
                    try {
                        each.mappingId = each.id ? each.id.toString() : null;
                    }
                    catch (err) { }
                    if (each.price === "0") {
                        return;
                    }
                    products.push(each);
                });
            }
            return products;
        };
        Integration.prototype.formatQu = function (data) {
            var _this = this;
            var products = [];
            data.forEach(function (eachItem) {
                if (eachItem.menuCategory) {
                    eachItem.category = eachItem.menuCategory.name;
                    eachItem.categoryId = eachItem.menuCategory.id;
                }
                if (eachItem.modifierGroup) {
                    eachItem.category = eachItem.modifierGroup.name;
                    eachItem.categoryId = eachItem.modifierGroup.id;
                }
                try {
                    eachItem.price = eachItem.discountAmount ? eachItem.discountAmount : eachItem.prices.prices[0].price;
                }
                catch (err) {
                    eachItem.price = "";
                }
                //line 1140 * allow focus brands to use ID since pathID is not in use there.
                try {
                    //here to make choice of API mapping id - could use automation
                    eachItem.mappingId = eachItem.pathId && _this.brand != "focus" ? eachItem.pathId.toString() : eachItem.id.toString();
                }
                catch (err) {
                    eachItem.mappingId = null;
                }
                //is the below even necessary..should move to larger mapping IDs I think.
                delete eachItem.prices;
                delete eachItem.displayAttribute;
                products.push(eachItem);
            });
            //required and in a beta state.. removes duplicates with same pathID, and attempts to keep the ones that price is not 0. Qu is a pita and we attempt somethign API side.
            products = _this.removeDuplicates(products, "mappingId");
            return products;
        };
        Integration.prototype.formatToast = function (data) {
            data.modifierGroupReferences = Object.values(data.modifierGroupReferences);
            data.modifierOptionReferences = Object.values(data.modifierOptionReferences);
            var menuItems = [];
            var menuGroups = [];
            function flat(array) {
                var result = [];
                array.forEach(function (a) {
                    a.menuGroups.forEach(function (each) {
                        each.menu = a.name;
                        each.menuId = a.masterId;
                    });
                    result.push(a);
                    if (Array.isArray(a.menuGroups)) {
                        result = result.concat(flat(a.menuGroups));
                    }
                });
                return result;
            }
            var groups = flat(data.menus);
            groups.forEach(function (group, idxCat) {
                if (!group.menuItems) {
                    return;
                }
                menuGroups.push({
                    name: group.name,
                    multiLocationId: group.multiLocationId,
                });
                group.menuItems.forEach(function (item) {
                    item.category = group.name;
                    item.menu = group.menu;
                    item.menuId = group.menuId;
                    item.groupId = group.multiLocationId;
                    item.mappingId = item.multiLocationId;
                    item.active = true;
                    item.modifiers = [];
                    item.price = item.price ? parseFloat(item.price).toFixed(2) : "";
                    try {
                        item.modifierGroupReferences.forEach(function (modGroup, idx) {
                            data.modifierGroupReferences.forEach(function (modRef) {
                                if (modGroup === modRef.referenceId) {
                                    item.modifiers.push({
                                        modifierType: modRef.name,
                                        masterId: modRef.masterId,
                                        options: [],
                                    });
                                    data.modifierOptionReferences.forEach(function (modRefOpt) {
                                        modRef.modifierOptionReferences.forEach(function (modOptRef) {
                                            if (modOptRef === modRefOpt.referenceId) {
                                                item.modifiers[idx].options.push({
                                                    name: modRefOpt.name,
                                                    price: parseFloat(modRefOpt.price).toFixed(2),
                                                    masterId: modRefOpt.masterId,
                                                    calories: modRefOpt.calories,
                                                    description: modRefOpt.description,
                                                });
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    }
                    catch (err) {
                        menuItems.push(item);
                        return;
                    }
                    menuItems.push(item);
                });
            });
            return menuItems;
        };
        Integration.prototype.formatRevel = function (data) {
            var products = [];
            data.forEach(function (each, idx) {
                if (!each.barcode) {
                    return;
                }
                try {
                    each.mappingId = each.barcode;
                }
                catch (err) { }
                try {
                    each.category = each.category ? each.category.name : each.modifierClass.name;
                }
                catch (err) { }
                products.push(each);
            });
            return products;
        };
        Integration.prototype.formatTransact = function (data) {
            var products = [];
            data.forEach(function (each, idx) {
                var item = {};
                try {
                    item.mappingId = each["Item Number"];
                }
                catch (err) { }
                try {
                    item.category = each["Class"];
                    item.name = each["Label"];
                    if (each["Price"] !== undefined && each["Price"] !== null && each["Price"] !== "") {
                        var priceVal = each["Price"];
                        if (typeof priceVal === "number") {
                            item.price = priceVal.toFixed(2);
                        }
                        else if (typeof priceVal === "string") {
                            // Remove all non-numeric except . and -
                            var cleaned = priceVal.replace(/[^0-9.-]+/g, "");
                            if (cleaned !== "" && !isNaN(cleaned)) {
                                item.price = parseFloat(cleaned).toFixed(2);
                            }
                            else {
                                item.price = priceVal;
                            }
                        }
                        else {
                            item.price = priceVal;
                        }
                    }
                    else {
                        item.price = "";
                    }
                }
                catch (err) { }
                products.push(item);
            });
            return products;
        };
        Integration.prototype.formatShift = function (data) {
            var shiftData = {};
            shiftData.modifiers = [];
            // Attach modifiers to groups
            data.items.forEach(function (each) {
                each.mappingId = each.id.split("-")[0];
                each.category = each.categoryName;
                if (each.modifierCategories.length > 0) {
                    each.modifiers = [];
                    data.modifiers.forEach(function (eachMod) {
                        if (each.modifierCategories.includes(eachMod.modifierCategoryId)) {
                            each.modifiers.push({
                                name: eachMod.name,
                                price: eachMod.price,
                                active: each.active,
                                description: eachMod.description,
                                defaultPrice: eachMod.defaultPrice,
                                mappingId: eachMod.uniqueId.split("-")[0] + "-" + eachMod.uniqueId.split("-")[5]
                            });
                            shiftData.modifiers.push({
                                fullName: eachMod.modifierCategoryName + " (" + eachMod.name + ")",
                                name: eachMod.name,
                                price: eachMod.price,
                                category: eachMod.modifierCategoryName,
                                active: each.active,
                                description: eachMod.description,
                                defaultPrice: eachMod.defaultPrice,
                                mappingId: eachMod.uniqueId.split("-")[0] + "-" + eachMod.uniqueId.split("-")[5]
                            });
                        }
                    });
                }
            });
            shiftData.items = data.items;
            return shiftData;
        };
        Integration.prototype.formatSimphony = function (data) {
            try {
                var menuItems = data.menuItems || [];
                var condimentGroups = data.condimentGroups || [];
                var products = {
                    items: [],
                    modifiers: []
                };
                menuItems.forEach(function (each) {
                    try {
                        var item = {
                            mappingId: each.menuItemId ? each.menuItemId.toString() : null,
                            category: (each.familyGroup && each.familyGroup.name && each.familyGroup.name["en-US"]) || null,
                            name: (each.name && each.name["en-US"]) || null,
                            price: (each.price && each.price.price) || null,
                            modifiers: []
                        };
                        if (Array.isArray(each.condiments)) {
                            var modifiers = [];
                            each.condiments.forEach(function (condiment) {
                                try {
                                    var modifier = {
                                        name: (condiment.name && condiment.name["en-US"]) || null,
                                        price: (function () {
                                            // Find the first non-zero price
                                            var def = condiment.definitions.find(function (def) {
                                                return def.prices && def.prices[0] && def.prices[0].price && def.prices[0].price > 0;
                                            });
                                            return def ? def.prices[0].price : null;
                                        })(),
                                        category: item.name || null,
                                        group: condiment.familyGroupRef || null
                                    };
                                    modifiers.push(modifier);
                                }
                                catch (modErr) {
                                    // Optionally log or handle modifier errors
                                }
                            });
                            // Sort modifiers by name, placing null names at the end
                            modifiers.sort(function (a, b) {
                                if (a.name === b.name)
                                    return 0;
                                if (a.name === null)
                                    return 1;
                                if (b.name === null)
                                    return -1;
                                return a.name.localeCompare(b.name);
                            });
                            item.modifiers = modifiers;
                        }
                        products.items.push(item);
                    }
                    catch (itemErr) {
                        // Optionally log or handle item errors
                    }
                });
                // Group condimentItems by condimentId and collect all categories for each
                var condimentMap = {};
                condimentGroups.forEach(function (each) {
                    if (Array.isArray(each.condimentItems)) {
                        each.condimentItems.forEach(function (condimentItem) {
                            try {
                                var condimentId = condimentItem.condimentId;
                                if (!condimentId)
                                    return;
                                var category = (each.name && each.name["en-US"]) || null;
                                if (!condimentMap[condimentId]) {
                                    condimentMap[condimentId] = {
                                        mappingId: condimentId.toString(),
                                        categories: [], // collect all categories here
                                        name: (condimentItem.name && condimentItem.name["en-US"]) || null,
                                        price: (function () {
                                            // Find the first non-zero price
                                            var def = condimentItem.definitions.find(function (def) {
                                                return def.prices && def.prices[0] && def.prices[0].price && def.prices[0].price > 0;
                                            });
                                            return def ? def.prices[0].price : null;
                                        })()
                                    };
                                }
                                // Add the category if not already present
                                if (category && !condimentMap[condimentId].categories.includes(category)) {
                                    condimentMap[condimentId].categories.push(category);
                                }
                            }
                            catch (condErr) {
                                // Optionally log or handle condiment errors
                            }
                        });
                    }
                });
                // Push all grouped modifiers to products.modifiers
                Object.values(condimentMap).forEach(function (modifier) {
                    // Sort categories alphabetically, nulls last
                    modifier.categories.sort(function (a, b) {
                        if (a === b)
                            return 0;
                        if (a === null)
                            return 1;
                        if (b === null)
                            return -1;
                        return a.localeCompare(b);
                    });
                    // Concatenate categories into a comma-delimited string (excluding nulls)
                    modifier.category = modifier.categories.filter(function (c) { return c !== null; }).join(", ");
                    products.modifiers.push(modifier);
                });
                return products;
            }
            catch (err) {
                // Optionally log or handle top-level errors
                return { items: [], modifiers: [] };
            }
        };
        Integration.prototype.formatWebtrition = function (webtrition) {
            var _this = this;
            //align to DB
            webtrition.forEach(function (each) {
                each.category = each.mealStation;
                each.mappingId = each.id.toString();
            });
            function handleComboItems(items) {
                var comboItems = {};
                var nonComboItems = [];
                items.forEach(function (each) {
                    var stop = false;
                    if (each.comboOrder > 0) {
                        if (!comboItems[each.id]) {
                            comboItems[each.id] = {
                                id: "0",
                                stringId: "0",
                                mappingId: each.id.toString(),
                                mrn: 0,
                                combo: true,
                                calories: "0",
                                description: "",
                                date: each.date,
                                comboItemNames: "",
                                comboName: each.comboName,
                                icons: each.icons,
                                mealPeriod: each.mealPeriod,
                                mealStation: each.mealStation,
                                price: each.price,
                                items: []
                            };
                        }
                        comboItems[each.id].items.forEach(function (item) {
                            if (item.comboOrder === each.comboOrder) {
                                stop = true;
                            }
                        });
                        if (stop) {
                            return;
                        }
                        comboItems[each.id].id = each.comboOrder === 1 ? each.id : comboItems[each.id].id;
                        comboItems[each.id].stringId = comboItems[each.id].id.toString();
                        comboItems[each.id].mrn = parseFloat(each.mrn) + parseFloat(comboItems[each.id].mrn);
                        comboItems[each.id].comboItemNames = comboItems[each.id].comboItemNames ? comboItems[each.id].comboItemNames + ", " + each.name : each.name;
                        comboItems[each.id].calories = parseFloat(each.calories) + parseFloat(comboItems[each.id].calories);
                        comboItems[each.id].items.push(each);
                    }
                    else {
                        nonComboItems.push(each);
                    }
                });
                // Add newly created combo items to nonComboItems
                for (var _i = 0, _a = Object.values(comboItems); _i < _a.length; _i++) {
                    var combo = _a[_i];
                    nonComboItems.push(combo);
                }
                return nonComboItems;
            }
            webtrition = handleComboItems(webtrition);
            //return formatted items
            return webtrition;
        };
        Integration.pingError = "\n     <div class=\"connectError {{source}}\">\n        <div class=\"message\">\n            <span class=\"material-icons\">error</span>\n            <span class=\"error-desc\">{{response}}</span>\n            <span class=\"url\">{{url}}</span>\n        </div>\n    </div>\n        ";
        Integration.pingSuccess = "\n     <div class=\"connectError success {{source}}\">\n        <div class=\"message\">\n            <span class=\"material-icons\">check_circle</span>\n            <span class=\"error-desc\">{{response}}</span>\n            <span class=\"url\">{{url}}</span>\n        </div>\n    </div>\n        ";
        Integration.loading = "\n    <div class=\"loading\">\n        <div class=\"spin\"></div>\n        <img src=\"resources/icon.png\">\n        <div class=\"loading-wrapper\">\n            <div class=\"spinner\">\n                <span class=\"loading-message\">Loading menu data</span> \n                <div class=\"bounce1\">.</div>\n                <div class=\"bounce2\">.</div>\n                <div class=\"bounce3\">.</div>\n            </div>\n        </div>\n    </div>\n";
        Integration.connect = "\n    <div title=\"{{issue}}\" data-tooltip=\"{{source}} Connectivity\" class=\"material-icons connect {{source}}\" style=\"color: {{color}}\">{{error}}</div>\n";
        return Integration;
    })();
    IMSintegration.Integration = Integration;
})(IMSintegration || (IMSintegration = {}));
