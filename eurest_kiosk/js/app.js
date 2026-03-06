"use strict";

var IMSintegration;
(function (wandDigital) {
    var App = (function () {
        function App() {
            this.db = null;
            this.store = "";
            this.API = "";
            this.stations = [];
            this.selectedItem = null;

            this.elements = {
                itemModal: document.getElementById('item-modal'),
                modalClose: document.getElementById('modal-close'),
                timeoutWarning: document.getElementById('timeout-warning'),
                timeoutContinue: document.getElementById('timeout-continue'),
                timeoutHome: document.getElementById('timeout-home'),
                timeoutSeconds: document.getElementById('timeout-seconds'),
                timeoutCountdown: document.getElementById('timeout-countdown'),
                errorBanner: document.getElementById('error-message'),
                errorText: document.getElementById('error-text'),
                errorClose: document.getElementById('error-close')
            };

            this.inactivityManager = null;
            this.countdownInterval = null;
        }

        App.prototype.init = function (API, isFullStart) {
            var _this = this;
            this.API = API;

            if (window.integration) {
                this.db = window.integration.db;
                this.store = window.integration.store;
            }

            this.setupEventListeners();

            if (isFullStart) {
                this.setupInactivityTimer();
            }

            window.addEventListener('dbChangeEvent', function(event) {
                _this.handleDatabaseChange(event.detail);
            });

            window.addEventListener('storage', function(event) {
                if (event.key === _this.store + '_dbChangeEvent' + "(" + version + ")") {
                    try {
                        var detail = JSON.parse(event.newValue);
                        _this.handleDatabaseChange(detail);
                    } catch (e) {
                        console.error('Error parsing storage event:', e);
                    }
                }
            });

            if (isFullStart) {
                setTimeout(function() {
                    _this.readDatabase();
                }, 1000);
            } else {
                _this.readDatabase();
            }
        };

        App.prototype.setupInactivityTimer = function () {
            var _this = this;
            if (typeof InactivityManager !== 'undefined') {
                this.inactivityManager = new InactivityManager(
                    function() { _this.handleTimeout(); },
                    function(seconds) { _this.showTimeoutWarning(seconds); }
                );
            }
        };

        App.prototype.setupEventListeners = function () {
            var _this = this;

            if (this.elements.modalClose) {
                this.elements.modalClose.addEventListener('click', function() {
                    _this.closeModal();
                });
            }

            if (this.elements.errorClose) {
                this.elements.errorClose.addEventListener('click', function() {
                    _this.hideError();
                });
            }

            if (this.elements.timeoutContinue) {
                this.elements.timeoutContinue.addEventListener('click', function() {
                    _this.dismissTimeoutWarning();
                });
            }

            if (this.elements.timeoutHome) {
                this.elements.timeoutHome.addEventListener('click', function() {
                    _this.returnHome();
                });
            }

            if (this.elements.itemModal) {
                this.elements.itemModal.addEventListener('click', function(e) {
                    if (e.target === _this.elements.itemModal || e.target.classList.contains('modal-overlay')) {
                        _this.closeModal();
                    }
                });
            }

            if (this.elements.timeoutWarning) {
                this.elements.timeoutWarning.addEventListener('click', function(e) {
                    if (e.target === _this.elements.timeoutWarning || e.target.classList.contains('timeout-overlay')) {
                        _this.dismissTimeoutWarning();
                    }
                });
            }

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    if (_this.elements.timeoutWarning && !_this.elements.timeoutWarning.hidden) {
                        _this.dismissTimeoutWarning();
                    } else if (_this.elements.itemModal && !_this.elements.itemModal.hidden) {
                        _this.closeModal();
                    }
                }
            });

            $(document).on('click', '.item-wrapper', function() {
                var itemData = $(this).data('nutrition');
                if (itemData) {
                    _this.showItemModal(itemData);
                }
            });
        };

        App.prototype.handleDatabaseChange = function (detail) {
            if (detail && detail.table === 'integration_products') {
                this.readDatabase();
            }
        };

        App.prototype.readDatabase = function () {
            var _this = this;

            if (isUsingIndexedDB && this.db) {
                this.db.integration_products.toArray().then(function(items) {
                    _this.processMenuItems(items);
                }).catch(function(error) {
                    console.error('Error reading from IndexedDB:', error);
                });
            } else {
                var items = JSON.parse(localStorage.getItem(_this.store + "_integration_products(" + version + ")")) || [];
                _this.processMenuItems(items);
            }
        };

        App.prototype.processMenuItems = function (items) {
            var _this = this;

            if (!items || items.length === 0) {
                console.log('No menu items available');
                return;
            }

            var stationsMap = {};

            items.forEach(function(item) {
                var stationName = item.mealStation || item.category || 'Uncategorized';

                if (!stationsMap[stationName]) {
                    stationsMap[stationName] = {
                        station: stationName,
                        items: [],
                        stationId: _this.sanitizeId(stationName)
                    };
                }

                if (item.icons && Array.isArray(item.icons)) {
                    item.icons = item.icons.map(function(icon) {
                        if (typeof icon === 'string') {
                            var iconName = icon.toLowerCase().replace(/\s+/g, '');
                            return {
                                name: icon,
                                fileName: 'media/icon_' + iconName + '.png'
                            };
                        } else if (icon && !icon.fileName && icon.name) {
                            var iconName = icon.name.toLowerCase().replace(/\s+/g, '');
                            return {
                                name: icon.name,
                                fileName: 'media/icon_' + iconName + '.png'
                            };
                        }
                        return icon;
                    });
                }

                stationsMap[stationName].items.push(item);
            });

            this.stations = Object.values(stationsMap);

            var integrationItems = {
                stations: this.stations,
                iconLabels: {
                    spicy: "Spicy",
                    dairy: "Made without dairy",
                    gluten: "Made without gluten",
                    halal: "Halal",
                    vegetarian: "Vegetarian",
                    vegan: "Vegan"
                }
            };

            if (menuLayout) {
                menuLayout.init(null, null, null, integrationItems, this.API);
            }
        };

        App.prototype.sanitizeId = function(str) {
            if (!str) return '';
            return str
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9\-_]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        };

        App.prototype.showItemModal = function (item) {
            var _this = this;
            this.selectedItem = item;

            if (!item) return;

            document.getElementById('modal-title').textContent = item.name || '';

            var priceText = item.price ? ('$' + parseFloat(item.price).toFixed(2)) : '';
            document.getElementById('modal-price').textContent = priceText;

            var caloriesText = item.calories ? (item.calories + ' calories') : '';
            document.getElementById('modal-calories').textContent = caloriesText;

            var servingText = item.portion || item.serving_size || '';
            document.getElementById('modal-serving').textContent = servingText;

            var descriptionText = item.enticingDescription || item.description || '';
            document.getElementById('modal-description').textContent = descriptionText;

            var ingredientsText = 'No ingredients information available.';
            if (item.ingredients && Array.isArray(item.ingredients) && item.ingredients.length > 0) {
                if (typeof item.ingredients[0] === 'object' && item.ingredients[0].name) {
                    ingredientsText = item.ingredients.map(function(ing) { return ing.name; }).join(', ');
                } else if (typeof item.ingredients[0] === 'string') {
                    ingredientsText = item.ingredients.join(', ');
                }
            } else if (typeof item.ingredients === 'string' && item.ingredients.trim()) {
                ingredientsText = item.ingredients;
            }
            document.getElementById('modal-ingredients').textContent = ingredientsText;

            var allergensText = 'No allergen information available.';
            var allergensSection = document.getElementById('allergens-section');
            if (item.allergens && Array.isArray(item.allergens) && item.allergens.length > 0) {
                if (typeof item.allergens[0] === 'object' && item.allergens[0].name) {
                    allergensText = item.allergens.map(function(allergen) { return allergen.name; }).join(', ');
                } else if (typeof item.allergens[0] === 'string') {
                    allergensText = item.allergens.join(', ');
                }
                allergensSection.style.display = 'block';
            } else if (typeof item.allergens === 'string' && item.allergens.trim()) {
                allergensText = item.allergens;
                allergensSection.style.display = 'block';
            } else {
                allergensSection.style.display = 'none';
            }
            document.getElementById('modal-allergens').textContent = allergensText;

            var iconsHtml = '';
            if (item.icons && item.icons.length > 0) {
                iconsHtml = item.icons.map(function(icon) {
                    return '<div class="dietary-icon-item">' +
                        '<img src="' + icon.fileName + '" alt="' + icon.name + '" class="dietary-icon-large">' +
                        '<span class="dietary-icon-label">' + icon.name + '</span>' +
                        '</div>';
                }).join('');
            }
            document.getElementById('modal-icons').innerHTML = iconsHtml;

            if (item.nutrition) {
                this.renderNutritionFacts(item.nutrition, servingText);
            }

            this.elements.itemModal.hidden = false;
            if (this.elements.modalClose) {
                this.elements.modalClose.focus();
            }

            if (this.inactivityManager) {
                this.inactivityManager.pause();
            }
        };

        App.prototype.renderNutritionFacts = function (nutrition, servingSize) {
            var nutritionLabel = document.querySelector('.nutrition-label');
            if (!nutritionLabel) return;

            var hasData = nutrition && Object.keys(nutrition).length > 1;

            if (!hasData) {
                nutritionLabel.innerHTML =
                    '<div class="nutrition-header">' +
                    '<div class="nutrition-title-group">' +
                    '<h4 class="nutrition-title">Nutrition Facts</h4>' +
                    '</div>' +
                    '</div>' +
                    '<div class="nutrition-divider thick"></div>' +
                    '<p style="padding: 20px; color: #666; text-align: center;">Nutrition information not available for this item.</p>';
                return;
            }

            document.getElementById('nutrition-serving').textContent = servingSize || 'Per serving';
            document.getElementById('nutrition-calories').textContent = nutrition.calories || 0;

            var updateNutrientRow = function(elementId, value, dvElementId, dailyValuePercent) {
                var element = document.getElementById(elementId);
                var parentRow = element ? element.closest('.nutrition-row') : null;

                if (value === undefined || value === null || value === 0) {
                    if (parentRow) parentRow.style.display = 'none';
                    var divider = parentRow ? parentRow.previousElementSibling : null;
                    if (divider && divider.classList.contains('nutrition-divider')) {
                        divider.style.display = 'none';
                    }
                    return;
                }

                if (parentRow) parentRow.style.display = '';
                var divider = parentRow ? parentRow.previousElementSibling : null;
                if (divider && divider.classList.contains('nutrition-divider')) {
                    divider.style.display = '';
                }

                if (element) element.textContent = Math.round(value * 100) / 100;

                if (dvElementId && dailyValuePercent !== undefined && dailyValuePercent !== null) {
                    var dvElement = document.getElementById(dvElementId);
                    if (dvElement) {
                        dvElement.textContent = Math.round(dailyValuePercent);
                    }
                }
            };

            var calcDV = function(nutrient, value) {
                var dailyValues = {
                    total_fat_g: 78,
                    saturated_fat_g: 20,
                    cholesterol_mg: 300,
                    sodium_mg: 2300,
                    total_carbs_g: 275,
                    dietary_fiber_g: 28,
                    vitamin_d_mcg: 20,
                    calcium_mg: 1300,
                    iron_mg: 18,
                    potassium_mg: 4700
                };

                if (!dailyValues[nutrient] || !value) return 0;
                return Math.round((value / dailyValues[nutrient]) * 100);
            };

            updateNutrientRow('nutrition-fat', nutrition.total_fat_g, 'nutrition-fat-dv', calcDV('total_fat_g', nutrition.total_fat_g));
            updateNutrientRow('nutrition-sat-fat', nutrition.saturated_fat_g, 'nutrition-sat-fat-dv', calcDV('saturated_fat_g', nutrition.saturated_fat_g));
            updateNutrientRow('nutrition-trans-fat', nutrition.trans_fat_g);
            updateNutrientRow('nutrition-cholesterol', nutrition.cholesterol_mg, 'nutrition-cholesterol-dv', calcDV('cholesterol_mg', nutrition.cholesterol_mg));
            updateNutrientRow('nutrition-sodium', nutrition.sodium_mg, 'nutrition-sodium-dv', calcDV('sodium_mg', nutrition.sodium_mg));
            updateNutrientRow('nutrition-carbs', nutrition.total_carbs_g, 'nutrition-carbs-dv', calcDV('total_carbs_g', nutrition.total_carbs_g));
            updateNutrientRow('nutrition-fiber', nutrition.dietary_fiber_g, 'nutrition-fiber-dv', calcDV('dietary_fiber_g', nutrition.dietary_fiber_g));
            updateNutrientRow('nutrition-sugars', nutrition.total_sugars_g);
            updateNutrientRow('nutrition-protein', nutrition.protein_g);
            updateNutrientRow('nutrition-vitamin-d', nutrition.vitamin_d_mcg, 'nutrition-vitamin-d-dv', calcDV('vitamin_d_mcg', nutrition.vitamin_d_mcg));
            updateNutrientRow('nutrition-calcium', nutrition.calcium_mg, 'nutrition-calcium-dv', calcDV('calcium_mg', nutrition.calcium_mg));
            updateNutrientRow('nutrition-iron', nutrition.iron_mg, 'nutrition-iron-dv', calcDV('iron_mg', nutrition.iron_mg));
            updateNutrientRow('nutrition-potassium', nutrition.potassium_mg, 'nutrition-potassium-dv', calcDV('potassium_mg', nutrition.potassium_mg));
        };

        App.prototype.closeModal = function () {
            this.elements.itemModal.hidden = true;
            this.selectedItem = null;

            if (this.inactivityManager) {
                this.inactivityManager.resume();
            }
        };

        App.prototype.returnHome = function () {
            this.closeModal();
            this.dismissTimeoutWarning();
        };

        App.prototype.handleTimeout = function () {
            this.returnHome();
        };

        App.prototype.showTimeoutWarning = function (seconds) {
            this.elements.timeoutWarning.hidden = false;
            this.startCountdown(seconds);
        };

        App.prototype.dismissTimeoutWarning = function () {
            this.elements.timeoutWarning.hidden = true;
            this.stopCountdown();

            if (this.inactivityManager) {
                this.inactivityManager.resetTimer();
            }
        };

        App.prototype.startCountdown = function (totalSeconds) {
            var _this = this;
            var remaining = totalSeconds;
            this.updateCountdownDisplay(remaining);

            this.countdownInterval = setInterval(function() {
                remaining--;
                _this.updateCountdownDisplay(remaining);

                if (remaining <= 0) {
                    _this.stopCountdown();
                }
            }, 1000);
        };

        App.prototype.stopCountdown = function () {
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
        };

        App.prototype.updateCountdownDisplay = function (seconds) {
            this.elements.timeoutSeconds.textContent = seconds;
            this.elements.timeoutCountdown.textContent = seconds;

            var circle = document.querySelector('.timeout-circle-progress');
            if (circle) {
                var circumference = 339.292;
                var progress = (seconds / 10) * circumference;
                circle.style.strokeDashoffset = circumference - progress;
            }
        };

        App.prototype.showError = function (message) {
            var _this = this;
            this.elements.errorText.textContent = message;
            this.elements.errorBanner.hidden = false;

            setTimeout(function() {
                _this.hideError();
            }, 5000);
        };

        App.prototype.hideError = function () {
            this.elements.errorBanner.hidden = true;
        };

        return App;
    })();
    IMSintegration.App = App;
})(IMSintegration || (IMSintegration = {}));
