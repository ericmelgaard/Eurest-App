//Publisher: Wand Digital
//Date: 01.29.2026
//Version: 62.0

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

            //			//***QA Environment***
            //			this.orderStatus = "orderstatus-qa.wanddigital.com";
            //			this.IMSwand = "https://api-qa.wanddigital.com";
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
            } else {
                $(".loading").remove()
                var loading = Mustache.to_html(Integration.loading);
                $("body").append(loading);
            }

            //inform.. no action
            if (development && !isPreview) {
                _this.showConnect(true, "black", "devmode", "Development Mode", "error_outline");
            }
            //future action with dummy data
            if (isPreview) { }

            //confirm whitelisting in place
            if (isLeader) {
                this.checkConnections();
                //future action to warn offline and menus not up to date    
            }

            //store key must exist
            _this.getKeys().then(function () {
                _this.TABLE_NAME = "IMS_" + _this.store + "(" + version + ")"
                _this.getStartMethod(isLeader, isUsingIndexedDB);
            });

        };

        Integration.prototype.getKeys = function () {
            var _this = this;
            var attempts = 0;
            //windows forces complexity and promise use..
            return new Promise((resolve, reject) => {
                function queryKeys() {
                    if (!development && !isPreview) {
                        _this.store = AssetConfiguration.SKey || $("#storeKey").text().trim().toLowerCase();
                        _this.apiKey = $("#apiKey").text().trim().toLowerCase() || settingKey;
                        //remove after windows dies
                        if (devSiteKeys.includes(_this.store)) {
                            AssetConfiguration.Daypart = Daypart_Name || AssetConfiguration.Daypart;
                            _this.store = Store_Key || AssetConfiguration.SKey;
                        } else {
                            var trmEle = $(window.frameElement.parentElement).parent()
                            var trmDaypart = $(trmEle).attr("trm-daypart");
                            AssetConfiguration.Daypart = AssetConfiguration.Daypart || trmDaypart;
                        }
                    } else {
                        _this.store = Store_Key || AssetConfiguration.SKey || $("#storeKey").text().trim().toLowerCase();
                        _this.apiKey = apiKey || settingKey || $("#apiKey").text().trim().toLowerCase();
                    }
                    if ((_this.apiKey.length === 0 && isUsingSettings) || !_this.store) {
                        if (!_this.store) {
                            if (!attempts) {
                                console.warn("Looking for store key...");
                                _this.showConnect(true, "darkgrey", "initStore", "Store key is missing", "error");
                            }
                        } else {
                            _this.showConnect(false, "darkgrey", "initStore");
                        }
                        if (_this.apiKey.length === 0 && isUsingSettings) {
                            if (!attempts) {
                                console.warn("Looking for API key...");
                                _this.showConnect(true, "grey", "initAPI", "API key is missing", "error");
                            }
                        } else {
                            _this.showConnect(false, "grey", "initAPI");
                        }
                        attempts++;
                        setTimeout(queryKeys, 250);
                    } else {
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
                } else {
                    //Settings and API: should not load - but still cached start since API update isn't enough alone for full start
                    trmAnchors = true;
                }
            } else if (trmAnchors && Object.keys(trmAnchors).length === 1) {
                //Settings only: should not load and go full start
                trmAnchors = null;
            }

            if (isUsingIndexedDB) {
                _this.openDatabase().then(function () {
                    if (trmAnchors && trmConfigs) {
                        if (isLeader) {
                            _this.cached_start(isUsingIndexedDB);
                        } else {
                            _this.observer_cachedStart(isUsingIndexedDB);
                        }
                    } else {
                        if (isLeader) {
                            _this.full_start(isUsingIndexedDB);
                        } else {
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
            } else {
                if (isLeader) {
                    if (trmAnchors && trmConfigs) {
                        _this.cached_start(isUsingIndexedDB);
                    } else {
                        _this.full_start(isUsingIndexedDB);
                    }
                    if (!_this.websocket) {
                        _this.websocket = _this.connectWebsocket();
                    }
                    if (!_this.updateQueue) {
                        _this.updateQueue = _this.IMSUpdateQueue();
                    }
                } else {
                    if (trmAnchors && trmConfigs) {
                        _this.observer_cachedStart(isUsingIndexedDB);
                    } else {
                        _this.observer_fullstart(isUsingIndexedDB);
                    }
                }
            }
        };


        Integration.prototype.checkConnections = function () {
            var _this = this;
            //Status Checks
            function checkConnection(url, source, color) {
                fetch(url)
                    .then(response => {
                        if (response.ok) {
                            // Connection restored - remove error if present
                            if ($(".full-screen-error-wrapper." + source).length > 0) {
                                var obj = {
                                    "issue": "Connection Restored",
                                    "source": source,
                                    "detail": "Connectivity to " + "https://" + source + ".com" + " has been restored."
                                };
                                var connect = Mustache.to_html(FULLSCREENERROR, obj);
                                $(".full-screen-error-wrapper." + source).replaceWith(connect);
                                if (leader) {
                                    setTimeout(function () {
                                        self.localStorage.removeItem(heartbeatKey);
                                        location.reload();
                                    }, 5000);
                                }
                            }
                            _this.showConnect(false, "black", source);
                        } else {
                            handleConnectionError(url, source, color);
                        }
                    })
                    .catch(error => {
                        handleConnectionError(url, source, color);
                    });
            }

            function handleConnectionError(url, source, color) {
                // Check if error already displayed to avoid duplicates
                if ($(".full-screen-error-wrapper." + source).length > 0) {
                    // Already showing error, just retry
                    setTimeout(function () {
                        checkConnection(url, source, color);
                    }, 30000);
                    return;
                }

                var obj = {
                    "issue": "Connection Issue",
                    "source": source,
                    "detail": "https://" + source + ".com" + " is not responding"
                };
                _this.showConnect(true, color, source, url.split(".com/")[0] + ".com/ is not accessible", "warning");
                var connect = Mustache.to_html(FULLSCREENERROR, obj);
                $(".loading").replaceWith(connect);

                // Retry after 30 seconds
                setTimeout(function () {
                    checkConnection(url, source, color);
                }, 30000);
            }

            checkConnection('https://trm-client01.wandcorp.com/Trm.Api.Webservices.1412/json/reply/DefaultRequest', "wandcorp", "#f8b02d");
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
                    trimmedArray = trimmedArray.filter(item => item[objKey] !== value);

                    // If the current item has a price of 0, skip adding it
                    if (price === 0) {
                        continue;
                    }
                }

                // If the current item does not have a price of 0, remove the previously added item with price 0
                if (price !== 0 && values[value] === 0) {
                    trimmedArray = trimmedArray.filter(item => item[objKey] !== value || item.price !== 0);
                }

                trimmedArray.push(originalArray[i]);
                values[value] = price;
            }
            return trimmedArray;
        }

        Integration.prototype.updateConfigs = function (settings) {
            var _this = this;

            return new Promise((resolve, reject) => {
                try {
                    var configsObj = {};
                    settings.forEach(function (each) {
                        if (typeof settingId_PartnerAPI === "string") {
                            // If it's a string, use it directly as the API value
                            configsObj.API = settingId_PartnerAPI.trim().toLowerCase();
                        } else if (Array.isArray(settingId_PartnerAPI) && settingId_PartnerAPI.indexOf(each.settingID) > -1) {
                            // If it's an array (object), match to setting value
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

                    //catch no settings values and set defaults
                    if (!configsObj.API) { configsObj.API = "ims"; }
                    //allow webt business_unit and location override if no settings exist.
                    if (!configsObj.brand && configsObj.API) { configsObj.brand = staticBusinessUnit; }
                    if (!configsObj.siteId && configsObj.API) { configsObj.siteId = staticLocation; }

                    // watch for webos versions upgrades and changing of database use
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
                        } else {
                            //first run
                        }
                    }

                    self.localStorage.setItem(_this.store + "_" + "store_context" + "(" + version + ")", JSON.stringify(configsObj));

                    resolve(configsObj);
                } catch (error) {
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
        }


        Integration.prototype.cached_start = function () {
            var _this = this;
            if (isUsingIndexedDB) {
                _this.app.db = _this.db;
            }
            _this.app.store = _this.store;
            _this.app.init(_this.API, false);
            _this.getSettings();
            _this.getIMSData(false);
            if (_this.API != "ims" || _this.API != "trm") {
                _this.getIntegrationData("patch");
            }
        }
        Integration.prototype.observer_fullstart = function () {
            var _this = this;
            //start but do not get data
            if (isUsingIndexedDB) {
                _this.app.db = _this.db;
            }
            _this.app.store = _this.store;

            _this.app.init(_this.API, true);
        }
        Integration.prototype.observer_cachedStart = function () {
            var _this = this;
            //start but do not get data

            if (isUsingIndexedDB) {
                _this.app.db = _this.db;
            }
            _this.app.store = _this.store;
            _this.app.init(_this.API, false);
        }

        Integration.prototype.full_start = function () {
            var _this = this;
            // Start with empty or changed databases
            _this.getSettings().then(function () {
                if (isUsingIndexedDB) {
                    _this.app.db = _this.db;
                }
                _this.app.store = _this.store;
                _this.app.init(_this.API, true);
                _this.getIMSData(true);
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
            _this.getIMSData(true);
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
                const db = _this.db;

                // Define schema and versions as per your control
                _this.db.version(version).stores({
                    IMS_settings: "settingID, setting, value",
                    IMS_products: "productId, productName, externalId, categoryId, subCategoryId, price",
                    IMS_menuItems: "menuItemId, menuZoneName, imsDaypartName, day",
                    integration_products: "mappingId, name, category, price",
                    integration_modifiers: "mappingId, name, category, price",
                    integration_discounts: "mappingId, name, price",
                });

                return db.open().then(() => {
                    //no message
                }).catch(error => {
                    if (error.name === 'NotFoundError' || error.name === 'VersionError') {
                        console.warn('Upgrade error detected. Needs upgrade.');
                        throw error; // Rethrow to handle in the outer Promise
                    } else {
                        console.error('Error opening database:', error.message);
                        throw error; // Rethrow to handle in the outer Promise
                    }
                });
            }

            //handle a close.. not sure where it come from
            _this.db.on("close", function () {
                _this.openDatabase().then(function () {
                    _this.app.db = _this.db;
                })
            })

            return initializeDatabase().then(() => {
                //no action
            }).catch(error => {
                console.error('Failed to initialize and upgrade database:', error);
                isUsingIndexedDB = false;
                _this.init(true, false)
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
            return new Promise((resolve, reject) => {
                if (!isUsingSettings) {
                    resolve();
                    return;
                }

                function fetchSettings(retries) {
                    var url = `https://trm-client01.wandcorp.com/trmws.digitalproxyws/json/reply/StoreSettingsRequest?apiKey=${_this.apiKey}&deviceNumber=&storeKey=${_this.store}`;

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
                            } else {
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
        Integration.prototype.forceIMSUpdate = function (table, item, action) {
            var _this = this;
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
        }
        Integration.prototype.getIMSData = function (fullStart) {
            var _this = this;
            if (!leader) {
                return;
            }
            _this.IMS_TimeOuts.forEach(function (each) {
                clearTimeout(each);
            });
            var url = _this.IMSwand + "/services/ims/client/V3/menusystem?" + "StoreKey=" + _this.store + "&Date=" + currentTime().split("T")[0];
            $.get(url, function (data) {
                if (fullStart && data && !data.error.code && data.value.response.products.length === 0) {
                    _this.forceIMSUpdate("IMS_menuItems", "forceUpdate", "update");
                    console.warn("IMS not in use for this location");
                    return;
                }
                _this.addIMSData(data);
            })
                .done(function () {
                    _this.showConnect(false, "blueviolet", "IMS")
                    _this.setSync("IMS")
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
                    } else {
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
            })


            if (data.isSuccess) {
                if (menuItems.length > 0) {
                    _this.addItems(menuItems, "update", "IMS_menuItems", "menuItemId");
                }

                if (products.length > 0) {
                    _this.addItems(products, "patch", "IMS_products", "productId");
                } else {
                    console.warn("IMS products not found or empty!");
                    this.app.IMSUpdate = true;
                }
            }

            try {

            } catch (err) {
                console.error("this.app does not exist yet...")
            }

        };

        Integration.prototype.addSettings = function (data) {
            //format to store in indexedDB
            var _this = this;

            return new Promise((resolve, reject) => {
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

                    _this.updateConfigs(settings).then(
                        resolve()
                    );

                    if (settings.length > 0) {
                        _this.addItems(settings, "update", "IMS_settings", "settingID");
                    } else {
                        console.warn("No settings found in the response.");
                        this.app.settingsUpdate = true;
                    }
                } catch (error) {
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
            var currentDateLocal = currentTime().split("T")[0];
            _this.integrationUpdateInterval = Math.floor(Math.random() * (_this.maxUpdate - _this.minUpdate + 1)) + _this.minUpdate;

            _this.fallbackInterval = _this.attempts === 0 ? 30000 : _this.fallbackInterval + 30000;

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
                //Qu should use current day instead of date modified so scheudled pricing works correctly
                url = "https://qubeyond-" + _this.wand + "/integration?id=" + _this.establishment + "&concept=" + _this.brand + "&date=" + currentDateLocal + "&time=" + timeOfDay;
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
                url = "https://shift4-" + _this.wand + "/integration" + "?id=" + _this.establishment;
            }
            if (_this.API === "simphony") {
                url = "https://simphony-" + _this.wand + "/integration" + "?concept=" + _this.brand + "&id=" + _this.establishment;
            }
            if (_this.API === "transact") {
                url = "https://transact-" + _this.wand + "/integration" + "?concept=" + _this.brand;
            }
            if (_this.API === "clover") {
                url = "https://" + _this.wand + "/integrations/" + _this.API + "/v1/" + _this.brand + "?merchantId=" + _this.establishment;
            }
            if (_this.API === "mealtracker") {
                var startDate = currentTime().split("T")[0];
                url = "https://appjel-" + _this.wand + "/integration" + "?id=" + _this.establishment + "&startDate=" + startDate;
            }
            if (_this.API === "venuenext") {
                url = "https://venuenext-" + _this.wand + "/integration" + "?id=" + _this.establishment + "&org=" + _this.brand
            }
            if (_this.API === "bepoz") {
                url = "https://bepoz-" + _this.wand + "/integration" + "?concept=" + _this.brand;
            }
            if (_this.API === "centricos") {
                //https://centric-api.wanddigital.com/integration?id=kkqaRjy5Qlc1pXakLJmWfj4Jjdo5DgiGXvy23Be0Hqe8Z73Dr6SWevARJK7lFzkzmBv
                url = "https://centric-" + _this.wand + "/integration" + "?id=" + menuKey;
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
                    "&Days=3&IncludeNutrition=true&IncludeIcons=false&IncludeAllergens=true&IncludeIngredients=true" +
                    "&IncludeRecipe=" + includeRecipes;
            }

            if (_this.API === "bonappetit") {
                url = "https://" + _this.wand + "/integrations/" + _this.API + "?campus=" + _this.brand + "&cafe=" + _this.establishment + "&menuDate=" + currentTime();
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
                    _this.setSync(_this.API)
                    _this.addIntegrationData(message, action);
                    _this.attempts = 0;
                }
                _this.Integration_TimeOuts.push(
                    setTimeout(function () {
                        _this.getIntegrationData();
                    }, _this.integrationUpdateInterval)
                );
            })
                .fail(function () {
                    console.warn("Could not load integration data!");
                    _this.integrationUpdateInterval = _this.attempts > 4 ? _this.integrationUpdateInterval : _this.fallbackInterval;
                    integration.showConnect(true, "forestgreen", _this.API, "Failed to sync Integration data", "error");
                    if (_this.attempts === 4) {
                        try {
                            _this.app.readDatabase();
                        } catch (err) {
                            console.error("configuration for " + _this.API + " is incorrect");
                            _this.attempts = 0;
                        }
                    }
                    _this.Integration_TimeOuts.push(
                        setTimeout(function () {
                            _this.getIntegrationData();
                        }, _this.integrationUpdateInterval)
                    );
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
                action = "update";
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
                let shiftData = data.items ? _this.formatShift(data) : {};
                products = shiftData.items ? shiftData.items : {};
                modifiers = shiftData.modifiers ? shiftData.modifiers : {};
            }

            if (_this.API === "simphony") {
                let simphonyData = data.data ? _this.formatSimphony(data.data) : {};
                products = simphonyData.items ? simphonyData.items : {};
                modifiers = simphonyData.modifiers ? simphonyData.modifiers : {};
            }

            if (_this.API === "transact") {
                products = data.data ? _this.formatTransact(data.data) : {};
            }

            if (_this.API === "clover") {
                products = data.menu ? _this.formatClover(data, "products") : {};
                modifiers = data.mods ? _this.formatClover(data, "modifiers") : {};
            }

            if (_this.API === "mealtracker") {
                action = "update";
                products = data.data ? _this.formatMealtracker(data.data, "products") : {};
            }

            if (_this.API === "webtrition") {
                action = "update";
                products = data.menuItems ? _this.formatWebtrition(data.menuItems) : {};
            }

            if (_this.API === "venuenext") {
                action = "update";
                products = data ? _this.formatVenueNext(data) : {};
            }

            if (_this.API === "bonappetit") {
                action = "update";
                products = data.menuItems ? _this.formatBonappetit(data.menuItems) : {};
            }

            if (_this.API === "bepoz") {
                action = "update";
                products = data.data ? _this.formatBepoz(data.data) : {};
            }

            if (_this.API === "centricos") {
                action = "update";
                let centricData = data.data ? _this.formatcentric(data.data) : {};
                products = centricData.products ? centricData.products : {};
                modifiers = centricData.modifiers ? centricData.modifiers : {};
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

        Integration.prototype.addItems = async function (items, action = "patch", table, id) {
            //update / patch / delete handler
            const _this = this;

            const handleDatabaseChangeEvent = (table, item, action) => {
                window.dispatchEvent(new CustomEvent('dbChangeEvent', {
                    detail: {
                        table,
                        item,
                        action
                    }
                }));
                localStorage.setItem(_this.store + '_dbChangeEvent' + "(" + version + ")", JSON.stringify({
                    table,
                    item,
                    action
                }));
            };

            const handleIndexedDB = async () => {
                await _this.db.transaction('rw', _this.db[table], async () => {
                    const allItems = await _this.db[table].toArray();
                    const newIds = items.map(item => item[id]);

                    if (action === 'patch' || action === 'update') {
                        for (const item of items) {
                            const existingItem = await _this.db[table].get(item[id]);
                            if (existingItem) {
                                if (!_.isEqual(existingItem, item)) {
                                    await _this.db[table].put(item);
                                    handleDatabaseChangeEvent(table, item, 'updated');
                                }
                            } else {
                                await _this.db[table].add(item);
                                handleDatabaseChangeEvent(table, item, 'added');
                            }
                        }

                        if (action === 'update') {
                            for (const item of allItems) {
                                if (!newIds.includes(item[id])) {
                                    await _this.db[table].delete(item[id]);
                                    handleDatabaseChangeEvent(table, item, 'deleted');
                                }
                            }
                        }
                    } else if (action === 'delete') {
                        for (const item of items) {
                            const existingItem = await _this.db[table].get(item[id]);
                            if (existingItem) {
                                await _this.db[table].delete(item[id]);
                                handleDatabaseChangeEvent(table, item, 'deleted');
                            }
                        }
                    }
                });
            };

            const handleLocalStorage = () => {
                let oldValue = JSON.parse(localStorage.getItem(_this.store + "_" + table + "(" + version + ")")) || [];
                const newProductMap = new Map(items.map(product => [product[id], product]));

                if (action === 'patch' || action === 'update') {
                    oldValue = oldValue.filter(existingProduct => {
                        if (!Array.from(newProductMap.keys()).includes(existingProduct[id]) && action === 'update') {
                            handleDatabaseChangeEvent(table, existingProduct, 'delete');
                            return false;
                        }
                        return true;
                    });

                    items.forEach(newProduct => {
                        const existingProduct = oldValue.find(product => product[id] === newProduct[id]);
                        if (existingProduct) {
                            if (!_.isEqual(existingProduct, newProduct)) {
                                oldValue = oldValue.map(product => product[id] === newProduct[id] ? newProduct : product);
                                handleDatabaseChangeEvent(table, newProduct, 'updated');
                            }
                        } else {
                            oldValue.push(newProduct);
                            handleDatabaseChangeEvent(table, newProduct, 'added');
                        }
                    });

                    if (action === 'update') {
                        const currentIds = Array.from(newProductMap.keys());
                        oldValue = oldValue.filter(existingProduct => {
                            if (!currentIds.includes(existingProduct[id])) {
                                handleDatabaseChangeEvent(table, existingProduct, 'delete');
                                return false;
                            }
                            return true;
                        });
                    }
                } else if (action === 'delete') {
                    oldValue = oldValue.filter(product => {
                        if (items.find(newProduct => newProduct[id] === product[id])) {
                            handleDatabaseChangeEvent(table, product, 'delete');
                            return false;
                        }
                        return true;
                    });
                }

                localStorage.setItem(_this.store + "_" + table + "(" + version + ")", JSON.stringify(oldValue));
            };

            if (isUsingIndexedDB) {
                try {
                    await handleIndexedDB();
                } catch (error) {
                    if (error.name === "DatabaseClosedError") {
                        _this.openDatabase().then(function () {
                            _this.app.db = _this.db;
                            _this.app.fullStart = true;
                            _this.full_start()
                        });
                    }
                }

            } else {
                handleLocalStorage();
            }
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


        Integration.prototype.showConnect = function (toggle, color, source, issue, error, lineNumber, errorDetails) {
            //added full screen error alert for development mode
            //set up errors and display with centered alert for errors
            if (toggle && $(".status-wrapper").length === 0) {
                var statusWrapper = document.createElement("div");
                $(statusWrapper).addClass("status-wrapper");
                $("body").append(statusWrapper);
            }

            // Show centered alert for errors, otherwise show status icon
            if (toggle && typeof issue === "object" && development) {
                // Extract line number from stack trace if not provided
                if (!lineNumber && errorDetails && errorDetails.stack) {
                    // Try to match various patterns: integration.js:123, at integration.js:123, (integration.js:123:45)
                    // Also handle query parameters like integration.js?v=1:123
                    var stackMatch = errorDetails.stack.match(/integration\.js.*?:(\d+)/i);

                    // Fallback 1: Look for any .js file match if integration.js wasn't found
                    if (!stackMatch) {
                        stackMatch = errorDetails.stack.match(/\.js.*?:(\d+)/i);
                    }

                    // Fallback 2: Look for generic :line:column pattern (e.g. :123:45)
                    if (!stackMatch) {
                        stackMatch = errorDetails.stack.match(/:(\d+):\d+/);
                    }

                    if (stackMatch && stackMatch[1]) {
                        lineNumber = stackMatch[1];
                    } else {
                        // Try to match from Error().stack pattern
                        var currentStack = new Error().stack;
                        if (currentStack) {
                            var currentMatch = currentStack.match(/integration\.js.*?:(\d+)/i);
                            if (currentMatch && currentMatch[1]) {
                                lineNumber = currentMatch[1];
                            }
                        }
                    }
                }

                // Create centered error alert
                if ($(".error-alert-overlay").length === 0) {
                    var issueMessage = issue;
                    var issueStack = null;
                    if (typeof issue === "object") {
                        issueMessage = issue.message || issue.toString();
                        if (issue.stack) {
                            issueStack = issue.stack.replace(/\n/g, "<br>");
                        }
                    }

                    var obj = {
                        color: color,
                        source: source,
                        issue: issueMessage || "Connection Error",
                        issueStack: issueStack,
                        error: error,
                        lineNumber: lineNumber || "N/A",
                        errorMessage: errorDetails && errorDetails.message ? errorDetails.message : "No error message available",
                        errorStack: errorDetails && errorDetails.stack ? errorDetails.stack.replace(/\n/g, "<br>") : "No stack trace available",
                    };
                    var alert = Mustache.to_html(Integration.errorAlert, obj);
                    $("body").append(alert);

                    // Add click handler to dismiss
                    $(".error-alert-overlay, .error-alert-close").on("click", function () {
                        $(".error-alert-overlay").remove();
                    });

                    // Prevent click on alert content from closing
                    $(".error-alert-content").on("click", function (e) {
                        e.stopPropagation();
                    });
                }
            } else {
                // Show status icon for non-error states
                var obj = {
                    color: color,
                    source: source,
                    issue: issue,
                    error: error,
                };
                if ($(".connect" + "." + source).length === 0 && toggle) {
                    var connect = Mustache.to_html(Integration.connect, obj);
                    $(".status-wrapper").append(connect);
                }
                if (!toggle) {
                    $(".connect" + "." + source).remove();
                    $(".error-alert-overlay." + source).remove();
                }
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
                    var url =
                        "wss://" +
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
                            } else {
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
                        console.error(
                            "Message:",
                            "Socket encountered error: ",
                            err.message,
                            "Closing socket"
                        );
                        _this.showConnect(true, "yellow", "websocket", "Instant updated failed to connect", "warning");
                        ws.close();
                    };
                } catch (error) {
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
                    _this.getIMSData()
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
                    })
                });
            }

            if (!modifier) {
                data.forEach(function (each, idx) {
                    try {
                        each.mappingId = each.id ? each.id.toString() : null;
                    } catch (err) { }

                    if (each.price === "0") {
                        return;
                    }

                    products.push(each);
                });
            }

            return products;
        }

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
                // Ignore 3rd party delivery items
                if (typeof eachItem.category === "string") {
                    if (eachItem.category.includes("OLO") || eachItem.category.includes("3PD") || eachItem.category.includes("3PO") || eachItem.category.includes("All Items")) {
                        return;
                    }
                }
                try {
                    eachItem.price = eachItem.discountAmount ? eachItem.discountAmount : eachItem.prices.prices[0].price;
                } catch (err) {
                    eachItem.price = "";
                }
                //line 1140 * allow focus brands to use ID since pathID is not in use there.
                try {
                    //here to make choice of API mapping id - could use automation
                    eachItem.mappingId = eachItem.pathId || eachItem.id || "";
                    eachItem.mappingId = eachItem.mappingId.toString();
                } catch (err) {
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
                    } catch (err) {
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
                } catch (err) { }

                try {
                    each.category = each.category ? each.category.name : each.modifierClass.name;
                } catch (err) { }

                if (typeof each.category === "string") {
                    if (each.category.includes("OLO") || each.category.includes("3PD") || each.category.includes("3PO")) {
                        return
                    }
                }
                products.push(each);
            });
            return products;
        };

        Integration.prototype.formatClover = function (data, type) {
            var products = [];
            var modifiers = [];
            if (type && type === "products") {
                data.menu.forEach(menu => {
                    if (menu.items && Array.isArray(menu.items)) {
                        menu.items.forEach(item => {
                            products.push({
                                mappingId: menu.id + "-" + item.id,
                                name: item.name,
                                category: menu.name,
                                price: typeof item.price === "number" ? (item.price / 100).toFixed(2) : "",
                                available: item.available,
                                alternateName: item.alternateName || "",
                                hidden: item.hidden,
                                priceType: item.priceType,
                                sku: item.sku
                            });
                        });
                    }
                });
                return products;
            }
            if (type && type === "modifiers") {
                data.mods.forEach(modGroup => {
                    if (modGroup.modifiers && Array.isArray(modGroup.modifiers)) {
                        modGroup.modifiers.forEach(mod => {
                            modifiers.push({
                                mappingId: modGroup.id + "-" + mod.id,
                                name: mod.name,
                                category: modGroup.name,
                                price: typeof mod.price === "number" ? (mod.price / 100).toFixed(2) : "",
                                available: mod.available
                            });
                        });
                    }
                });
                return modifiers;
            }
        };

        Integration.prototype.formatTransact = function (data) {
            var products = [];
            if (!data.length) { return products; }
            data.forEach(function (each, idx) {
                var item = {}
                try {
                    item.mappingId = each["Item Number"];
                } catch (err) { }

                try {
                    item.category = each["Class"];
                    item.name = each["Label"];
                    if (each["Price"] !== undefined && each["Price"] !== null && each["Price"] !== "") {
                        let priceVal = each["Price"];
                        if (typeof priceVal === "number") {
                            item.price = priceVal.toFixed(2);
                        } else if (typeof priceVal === "string") {
                            // Remove all non-numeric except . and -
                            let cleaned = priceVal.replace(/[^0-9.-]+/g, "");
                            if (cleaned !== "" && !isNaN(cleaned)) {
                                item.price = parseFloat(cleaned).toFixed(2);
                            } else {
                                item.price = priceVal;
                            }
                        } else {
                            item.price = priceVal;
                        }
                    } else {
                        item.price = "";
                    }
                } catch (err) { }

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

        Integration.prototype.formatMealtracker = function (data) {
            var products = [];
            if (!data.length) { return products; }
            data.forEach(function (eachDay) {
                eachDay.menu.forEach(function (eachMenu) {
                    eachMenu.meals.forEach(function (eachMeals) {
                        eachMeals.menu.forEach(function (eachProduct) {
                            eachProduct.mappingId = eachProduct.id.toString();
                            eachProduct.day = eachDay.day;
                            eachProduct.date = eachDay.date + "T00:00:00";
                            eachProduct.menuName = eachMenu.name;
                            eachProduct.type = eachMenu.menu_category;
                            eachProduct.period = eachMeals.name;
                            eachProduct.category = eachProduct.category_name.replace(/\s+/g, ' ').replace(/\s*BLD$/, '').trim();
                            products.push(eachProduct);
                        });
                    });
                });
            });
            return products;
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
                                        price: (() => {
                                            // Find the first non-zero price
                                            var def = condiment.definitions.find(def =>
                                                def.prices && def.prices[0] && def.prices[0].price && def.prices[0].price > 0
                                            );
                                            return def ? def.prices[0].price : null;
                                        })(),
                                        category: item.name || null,
                                        group: condiment.familyGroupRef || null
                                    };
                                    modifiers.push(modifier);
                                } catch (modErr) {
                                    // Optionally log or handle modifier errors
                                }
                            });
                            // Sort modifiers by name, placing null names at the end
                            modifiers.sort(function (a, b) {
                                if (a.name === b.name) return 0;
                                if (a.name === null) return 1;
                                if (b.name === null) return -1;
                                return a.name.localeCompare(b.name);
                            });
                            item.modifiers = modifiers;
                        }

                        products.items.push(item);
                    } catch (itemErr) {
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
                                if (!condimentId) return;

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
                        if (a === b) return 0;
                        if (a === null) return 1;
                        if (b === null) return -1;
                        return a.localeCompare(b);
                    });
                    // Concatenate categories into a comma-delimited string (excluding nulls)
                    modifier.category = modifier.categories.filter(function (c) { return c !== null; }).join(", ");
                    products.modifiers.push(modifier);
                });

                return products;
            } catch (err) {
                // Optionally log or handle top-level errors
                return { items: [], modifiers: [] };
            }
        };

        Integration.prototype.formatVenueNext = function (venueNext) {
            //align to DB
            //needs review..
            venueNext.forEach(function (each) {
                each.category = each.category_name;
                each.mappingId = each.product_sku.toString();
                each.type = each.stand_display_name || "";
                each.price = each.price_in_cents / 100 || "0.00";
                each.enabled = each.available;
            })
            return venueNext;
        };

        Integration.prototype.formatWebtrition = function (webtrition) {
            var _this = this;

            //align to DB
            webtrition.forEach(function (each) {
                each.category = each.mealStation;
                each.mappingId = each.id.toString();
            })

            function handleComboItems(items) {
                let comboItems = {};
                let nonComboItems = [];
                items.forEach(function (each) {
                    let stop = false;
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
                                category: each.mealStation,
                                mealStation: each.mealStation,
                                price: each.price,
                                items: []
                            };
                        }
                        comboItems[each.id].items.forEach(function (item) {
                            if (item.comboOrder === each.comboOrder) { stop = true }
                        });
                        if (stop) { return; }
                        comboItems[each.id].id = each.comboOrder === 1 ? each.id : comboItems[each.id].id
                        comboItems[each.id].stringId = comboItems[each.id].id.toString()
                        comboItems[each.id].mrn = parseFloat(each.mrn) + parseFloat(comboItems[each.id].mrn)
                        comboItems[each.id].comboItemNames = comboItems[each.id].comboItemNames ? comboItems[each.id].comboItemNames + ", " + each.name : each.name;
                        comboItems[each.id].calories = parseFloat(each.calories) + parseFloat(comboItems[each.id].calories);
                        comboItems[each.id].items.push(each);
                    } else {
                        nonComboItems.push(each);
                    }
                });

                // Add newly created combo items to nonComboItems
                for (let combo of Object.values(comboItems)) {
                    nonComboItems.push(combo);
                }

                return nonComboItems;
            }

            webtrition = handleComboItems(webtrition);

            //return formatted items
            return webtrition;
        }

        Integration.prototype.formatBonappetit = function (data) {
            var products = [];


            //align to DB
            data.forEach(function (each) {
                each.category = each.station;
                each.mappingId = each.id.toString() + "-" + each.daypart_id.toString() + "-" + each.station_id.toString();
                each.name = each.label;
                each.date = currentTime();
                products.push(each);
            });
            return products;
        };

        Integration.prototype.formatBepoz = function (data) {
            var products = [];

            // Helper to normalize id-like values to a non-empty string; preserves 0, avoids null/undefined
            var toIdString = function (v) {
                if (v === null || v === undefined) return "0";
                var s = String(v);
                return s.trim() === "" ? "0" : s;
            };

            //align to DB
            data.forEach(function (each) {
                each.category = each.categoryName;
                each.name = each.menuItemName;
                each.sortOrder = each.ItemOrder || 0;

                each.mappingId = toIdString(each.menuItemid);
                each.categoryId = toIdString(each.categoryID);
                each.subCategoryId = toIdString(each.subCategoryID);
                each.brandId = toIdString(each.Brandid);
                each.calories = (each.Calorie !== null && each.Calorie !== undefined && String(each.Calorie).trim() !== "")
                    ? String(each.Calorie)
                    : "0";

                if (typeof each.Allergens === "string") {
                    // Split on newlines, commas, semicolons, pipes, or slashes and trim
                    each.allergens = each.Allergens.split(/[\r\n;,/|]+/).map(function (item) { return item.trim(); }).filter(Boolean);
                } else {
                    each.allergens = each.Allergens;
                }

                if (typeof each.Active === "string") {
                    var vA = each.Active.trim().toLowerCase();
                    each.active = (vA === "true" || vA === "1" || vA === "yes");
                } else {
                    each.active = Boolean(each.Active);
                }

                if (typeof each.outOfStock === "string") {
                    var vO = each.outOfStock.trim().toLowerCase();
                    each.outOfStock = (vO === "true" || vO === "1" || vO === "yes");
                } else {
                    each.outOfStock = Boolean(each.outOfStock);
                }

                // Normalize modifiers
                if (Array.isArray(each.modifiers)) {
                    // keep as-is
                } else if (typeof each.modifiers === "string") {
                    var parsed = [];
                    try {
                        var tmp = JSON.parse(each.modifiers);
                        if (Array.isArray(tmp)) parsed = tmp;
                    } catch (e) {
                        parsed = each.modifiers.split(/[\r\n;,/|]+/).map(function (s) { return s.trim(); }).filter(Boolean);
                    }
                    each.modifiers = parsed;
                } else {
                    each.modifiers = [];
                }

                //remove old values
                delete each.Active;
                delete each.Allergens;
                delete each.Calorie;
                delete each.productid;
                delete each.categoryID;
                delete each.subCategoryID;
                delete each.menuItemName;
                delete each.menuItemid;
                delete each.categoryName;
                delete each.ItemOrder;
                delete each.Brandid;

                products.push(each);
            });
            return products;
        };

        Integration.prototype.formatcentric = function (data) {
            var products = [];
            var modifiers = [];

            //align to DB
            data.data.groups.forEach(function (group) {
                group.items.forEach(function (each) {
                    each.category = group.name;
                    each.mappingId = each.meta.unique_id.toString();
                    each.name = each.name;
                    each.description = each.description.en || "";
                    each.price = each.price.amount ? parseFloat(each.price.amount).toFixed(2) : "";
                    each.calories = each.nutrition.calories ? each.nutrition.calories.amount : "";
                    each.sortOrder = each.meta.menu_sort_number || 0;
                    each.out_of_stock = each.is.out_of_stock || false;
                    each.featured = each.is.featured || false;
                    each.hidden = each.is.hidden || false;
                    each.tags = each.reporting.category || [];
                    //clean up products
                    delete each.id;
                    delete each.meta;
                    delete each.is;
                    delete each.nutrition;
                    delete each.reporting;
                    delete each.weight;
                    delete each.label;
                    delete each.menu_labels;

                    products.push(each);

                    let productOptions = [];
                    each.options.forEach(function (eachOpt) {
                        eachOpt.items.forEach(function (eachOptItem) {
                            eachOptItem.mappingId = eachOptItem.meta.unique_id.toString();
                            eachOptItem.name = eachOptItem.name;
                            eachOptItem.description = eachOptItem.description.en || "";
                            eachOptItem.price = eachOptItem.price.amount ? parseFloat(eachOptItem.price.amount).toFixed(2) : "";
                            eachOptItem.calories = eachOptItem.nutrition.calories ? eachOptItem.nutrition.calories.amount : "";
                            eachOptItem.out_of_stock = eachOptItem.is.out_of_stock || false;
                            eachOptItem.featured = eachOptItem.is.featured || false;
                            eachOptItem.hidden = eachOptItem.is.hidden || false;
                            //clean up products
                            delete eachOptItem.id;
                            delete eachOptItem.meta;
                            delete eachOptItem.is;
                            delete eachOptItem.nutrition;
                            delete eachOptItem.reporting;
                            delete eachOptItem.weight;
                            delete eachOptItem.label;
                            delete eachOptItem.menu_labels;
                            delete eachOptItem.parent_id;

                            modifiers.push(eachOptItem);
                            if (eachOptItem.price) {
                                // eachOptItem.sortOrder = eachOptItem.meta.menu_sort_number || 0;
                                productOptions.push(eachOptItem);
                            }
                        });
                    });
                    each.options = productOptions || [];
                });
            });
            return { products: products, modifiers: modifiers };
        }

        Integration.pingError = `
     <div class="connectError {{source}}">
        <div class="message">
            <span class="material-icons">error</span>
            <span class="error-desc">{{response}}</span>
            <span class="url">{{url}}</span>
        </div>
    </div>
        `;
        Integration.pingSuccess = `
     <div class="connectError success {{source}}">
        <div class="message">
            <span class="material-icons">check_circle</span>
            <span class="error-desc">{{response}}</span>
            <span class="url">{{url}}</span>
        </div>
    </div>
        `;
        Integration.loading = `
    <div class="loading">
        <div class="spin"></div>
        <img src="resources/icon.png">
        <div class="loading-wrapper">
            <div class="spinner">
                <span class="loading-message">Loading menu data</span> 
                <div class="bounce1">.</div>
                <div class="bounce2">.</div>
                <div class="bounce3">.</div>
            </div>
        </div>
    </div>
`;
        Integration.connect = `
    <div title="{{issue}}" data-tooltip="{{source}} Connectivity" class="material-icons connect {{source}}" style="color: {{color}}">{{error}}</div>
`;
        // Template for a small top drop-down banner used in development mode
        Integration.DEV_BANNER = `
        <div class="dev-banner" id="dev-banner">
            <div class="dev-banner-inner">
                <span class="material-icons" style="margin-right: 5px">error_outline</span>
                <span class="dev-flag">Development</span>
            </div>
        </div>
`;
        Integration.errorAlert =
            `    <div class="error-alert-overlay {{source}}"> <div class="error-alert-content"
            style="max-height: 90vh; display: flex; flex-direction: column;"> <div class="error-alert-header"> <span
                    class="material-icons error-alert-icon" style="color: {{color}}">error</span> <h2
                    class="error-alert-title">Exception Detected</h2> <span
                    class="material-icons error-alert-close">close</span> </div> <div class="error-alert-body"
                style="flex: 1; overflow: hidden; display: flex; flex-direction: column;"> <div
                    class="error-alert-source"> <strong>Source:</strong> <span
                        class="error-alert-source-value">{{source}}</span> </div> <div class="error-alert-issue">
                    <strong>Issue:</strong> <span class="error-alert-issue-value">{{issue}}</span> </div>
                {{#issueStack}} <div class="error-alert-stack"
                    style="flex: 1; display: flex; flex-direction: column; min-height: 0; margin-bottom: 10px;">
                    <strong>Issue Stack:</strong> <div class="error-alert-stack-value"
                        style="flex: 1; overflow: auto; max-height: none;">{{{issueStack}}}</div> </div>
                {{/issueStack}} </div> <div
    </div>`
        return Integration;
    })();
    IMSintegration.Integration = Integration;
})(IMSintegration || (IMSintegration = {}));
