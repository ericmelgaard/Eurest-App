import {
  getAllStations,
  getStationWithItems,
  getItemWithNutrition,
  getAllDietaryIcons,
  calculateDailyValue,
  fetchAndStoreMenuItems
} from './data-service.js';
import { InactivityManager } from './inactivity-manager.js';
import { kioskConfig, isKioskMode } from './kiosk-config.js';
import { NavigationManager } from './navigation-manager.js';

class MenuApp {
  constructor() {
    this.state = {
      currentView: 'landing',
      selectedStation: null,
      selectedItem: null,
      stations: [],
      dietaryIcons: [],
      navigationContext: null,
      selectedDate: new Date().toISOString().split('T')[0]
    };

    this.elements = {
      landingView: document.getElementById('landing-view'),
      stationView: document.getElementById('station-view'),
      stationsGrid: document.getElementById('stations-grid'),
      menuItemsGrid: document.getElementById('menu-items-grid'),
      stationTitle: document.getElementById('station-title'),
      stationDescription: document.getElementById('station-description'),
      backToStations: document.getElementById('back-to-stations'),
      scrollToTop: document.getElementById('scroll-to-top'),
      itemModal: document.getElementById('item-modal'),
      modalClose: document.getElementById('modal-close'),
      timeoutWarning: document.getElementById('timeout-warning'),
      timeoutContinue: document.getElementById('timeout-continue'),
      timeoutHome: document.getElementById('timeout-home'),
      timeoutSeconds: document.getElementById('timeout-seconds'),
      timeoutCountdown: document.getElementById('timeout-countdown'),
      errorBanner: document.getElementById('error-message'),
      errorText: document.getElementById('error-text'),
      errorClose: document.getElementById('error-close'),
      menuDatePicker: document.getElementById('menu-date-picker')
    };

    this.inactivityManager = null;
    this.countdownInterval = null;
    this.navigationManager = null;

    this.init();
  }

  async init() {
    this.setupKioskMode();
    this.setupEventListeners();
    this.setupInactivityTimer();
    this.setupScrollHandling();
    this.setupNavigation();
    this.setupDatePicker();
    await this.loadInitialData();
  }

  setupNavigation() {
    this.navigationManager = new NavigationManager((context) => {
      this.state.navigationContext = context;
      this.handleNavigationChange(context);
    });
  }

  setupDatePicker() {
    const dateDropdown = document.getElementById('quick-date-dropdown');
    const dateButton = document.getElementById('date-button');
    const dateButtonText = document.getElementById('date-button-text');
    const dateDropdownList = document.getElementById('date-dropdown-list');
    const dateQuickOptions = document.querySelector('.date-quick-options');
    const menuDatePicker = this.elements.menuDatePicker;

    if (!dateButton || !menuDatePicker) return;

    // Generate quick date options (today, tomorrow, next 3 days)
    const generateQuickDates = () => {
      const dates = [];
      const today = new Date();

      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        let label = '';
        if (i === 0) label = 'Today';
        else if (i === 1) label = 'Tomorrow';
        else {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          label = days[date.getDay()];
        }

        dates.push({
          label,
          value: date.toISOString().split('T')[0],
          fullLabel: `${label} (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
        });
      }

      return dates;
    };

    const renderQuickOptions = () => {
      const dates = generateQuickDates();
      dateQuickOptions.innerHTML = dates.map(date => `
        <div class="date-option ${date.value === this.state.selectedDate ? 'selected' : ''}"
             data-date="${date.value}"
             tabindex="0"
             role="option">
          ${date.fullLabel}
        </div>
      `).join('');

      // Add click handlers
      dateQuickOptions.querySelectorAll('.date-option').forEach(option => {
        option.addEventListener('click', async (e) => {
          const selectedDate = e.currentTarget.dataset.date;
          await this.handleDateChange(selectedDate);
          dateDropdown.classList.remove('open');
        });
      });
    };

    // Toggle dropdown
    dateButton.addEventListener('click', (e) => {
      e.stopPropagation();
      dateDropdown.classList.toggle('open');
      if (dateDropdown.classList.contains('open')) {
        renderQuickOptions();
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dateDropdown.contains(e.target)) {
        dateDropdown.classList.remove('open');
      }
    });

    // Calendar picker change
    menuDatePicker.value = this.state.selectedDate;
    menuDatePicker.addEventListener('change', async (e) => {
      await this.handleDateChange(e.target.value);
      dateDropdown.classList.remove('open');
    });

    // Update button text based on selected date
    this.updateDateButtonText = (date) => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      if (date === today) {
        dateButtonText.textContent = 'Today';
      } else if (date === tomorrowStr) {
        dateButtonText.textContent = 'Tomorrow';
      } else {
        const selectedDate = new Date(date + 'T00:00:00');
        dateButtonText.textContent = selectedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
    };

    this.updateDateButtonText(this.state.selectedDate);
  }

  async handleDateChange(newDate) {
    this.state.selectedDate = newDate;
    this.elements.menuDatePicker.value = newDate;
    this.updateDateButtonText(newDate);
    console.log('Date changed to:', newDate);

    if (this.state.navigationContext?.businessUnit && this.state.navigationContext?.venue) {
      // Return to stations view before refreshing
      this.showLandingView();
      await this.fetchMenuData();
    }
  }

  async handleNavigationChange(context) {
    console.log('Navigation changed:', context);

    if (context.businessUnit && context.venue) {
      await this.fetchMenuData();
    } else {
      this.loadInitialData();
    }
  }

  async fetchMenuData() {
    try {
      const context = this.state.navigationContext;

      if (!context?.businessUnit || !context?.venue) {
        console.warn('Business unit or venue not selected');
        return;
      }

      // Show skeleton loading cards
      this.elements.stationsGrid.innerHTML = Array(6).fill(0).map(() => `
        <div class="station-card skeleton">
          <div class="skeleton-title"></div>
          <div class="skeleton-description"></div>
          <div class="skeleton-description short"></div>
        </div>
      `).join('');

      await fetchAndStoreMenuItems(
        context.businessUnit.businessUnitId,
        context.venue.locationId,
        this.state.selectedDate
      );

      await this.loadInitialData();
    } catch (error) {
      console.error('Error fetching menu data:', error);
      this.showError(error.message || 'Failed to load menu data. Please try again.');

      this.elements.stationsGrid.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>No Menu Data Available</h3>
          <p>${error.message || 'Could not load menu items for the selected date and location.'}</p>
        </div>
      `;
    }
  }

  setupKioskMode() {
    if (isKioskMode()) {
      document.body.classList.add('kiosk-mode');

      if (kioskConfig.preventContextMenu) {
        document.addEventListener('contextmenu', (e) => e.preventDefault());
      }

      if (kioskConfig.preventZoom) {
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());
      }
    }
  }

  setupInactivityTimer() {
    if (isKioskMode()) {
      this.inactivityManager = new InactivityManager(
        () => this.handleTimeout(),
        (seconds) => this.showTimeoutWarning(seconds)
      );
    }
  }

  setupScrollHandling() {
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (window.scrollY > kioskConfig.scrollToTopThreshold) {
          this.elements.scrollToTop.hidden = false;
        } else {
          this.elements.scrollToTop.hidden = true;
        }
      }, 100);
    }, { passive: true });

    this.elements.scrollToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  setupEventListeners() {
    this.elements.backToStations.addEventListener('click', () => this.showLandingView());
    this.elements.modalClose.addEventListener('click', () => this.closeModal());
    this.elements.errorClose.addEventListener('click', () => this.hideError());

    this.elements.timeoutContinue.addEventListener('click', () => this.dismissTimeoutWarning());
    this.elements.timeoutHome.addEventListener('click', () => this.returnHome());

    this.elements.itemModal.addEventListener('click', (e) => {
      if (e.target === this.elements.itemModal || e.target.classList.contains('modal-overlay')) {
        this.closeModal();
      }
    });

    this.elements.timeoutWarning.addEventListener('click', (e) => {
      if (e.target === this.elements.timeoutWarning || e.target.classList.contains('timeout-overlay')) {
        this.dismissTimeoutWarning();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.elements.timeoutWarning.hidden) {
          this.dismissTimeoutWarning();
        } else if (!this.elements.itemModal.hidden) {
          this.closeModal();
        }
      }
    });
  }

  async loadInitialData() {
    try {
      const [stations, icons] = await Promise.all([
        getAllStations(),
        getAllDietaryIcons()
      ]);

      this.state.stations = stations;
      this.state.dietaryIcons = icons;

      this.renderStations();
    } catch (error) {
      this.showError(error.message);
    }
  }

  renderStations() {
    const html = this.state.stations.map(station => `
      <div class="station-card" role="button" tabindex="0" data-station-id="${station.id}">
        <h3 class="station-card-title">${this.escapeHtml(station.name)}</h3>
        <p class="station-card-description">${this.escapeHtml(station.description)}</p>
      </div>
    `).join('');

    this.elements.stationsGrid.innerHTML = html;

    this.elements.stationsGrid.querySelectorAll('.station-card').forEach(card => {
      card.addEventListener('click', () => {
        const stationId = card.getAttribute('data-station-id');
        this.showStationView(stationId);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const stationId = card.getAttribute('data-station-id');
          this.showStationView(stationId);
        }
      });
    });
  }

  async showStationView(stationId) {
    try {
      this.elements.menuItemsGrid.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading Menu Items</div>
          <div class="loading-subtext">Preparing delicious options...</div>
          <div class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </div>
        </div>
      `;

      const station = await getStationWithItems(stationId);
      this.state.selectedStation = station;

      this.elements.stationTitle.textContent = station.name;
      this.elements.stationDescription.textContent = station.description;

      this.renderMenuItems(station.items);

      this.elements.landingView.classList.remove('active');
      this.elements.stationView.classList.add('active');
      this.elements.backToStations.style.display = 'flex';
      this.state.currentView = 'station';

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      this.showError(error.message);
    }
  }

  renderMenuItems(items) {
    const html = items.map(item => {
      // Use enticingDescription if available, otherwise fall back to description
      const displayDescription = item.enticingDescription || item.description || '';
      // Truncate if too long (150 chars is a good limit for readability)
      const truncatedDescription = displayDescription.length > 150
        ? displayDescription.substring(0, 147) + '...'
        : displayDescription;

      return `
        <div class="menu-item-card" role="button" tabindex="0" data-item-id="${item.id}">
          <div class="menu-item-header">
            <h4 class="menu-item-title">${this.escapeHtml(item.name)}</h4>
            <span class="menu-item-price">$${item.price.toFixed(2)}</span>
          </div>
          <p class="menu-item-description">${this.escapeHtml(truncatedDescription)}</p>
          <div class="menu-item-meta">
            <span class="menu-item-calories">${item.calories} cal</span>
            ${item.icons && item.icons.length > 0 ? `
              <div class="item-icons">
                ${item.icons.map(icon => this.renderIconBadge(icon)).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    this.elements.menuItemsGrid.innerHTML = html;

    this.elements.menuItemsGrid.querySelectorAll('.menu-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const itemId = card.getAttribute('data-item-id');
        this.showItemModal(itemId);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const itemId = card.getAttribute('data-item-id');
          this.showItemModal(itemId);
        }
      });
    });
  }

  async showItemModal(itemId) {
    try {
      const item = await getItemWithNutrition(itemId);
      this.state.selectedItem = item;

      document.getElementById('modal-title').textContent = item.name;
      document.getElementById('modal-price').textContent = `$${item.price.toFixed(2)}`;
      document.getElementById('modal-calories').textContent = `${item.calories} calories`;
      document.getElementById('modal-serving').textContent = item.serving_size;
      document.getElementById('modal-description').textContent = item.description;

      // Handle ingredients - convert array to readable string
      let ingredientsText = 'No ingredients information available.';
      if (item.ingredients && Array.isArray(item.ingredients) && item.ingredients.length > 0) {
        // Check if ingredients are objects with name property or just strings
        if (typeof item.ingredients[0] === 'object' && item.ingredients[0].name) {
          ingredientsText = item.ingredients.map(ing => ing.name).join(', ');
        } else if (typeof item.ingredients[0] === 'string') {
          ingredientsText = item.ingredients.join(', ');
        }
      } else if (typeof item.ingredients === 'string' && item.ingredients.trim()) {
        ingredientsText = item.ingredients;
      }
      document.getElementById('modal-ingredients').textContent = ingredientsText;

      // Handle allergens - convert array to readable string
      let allergensText = 'No allergen information available.';
      const allergensSection = document.getElementById('allergens-section');
      if (item.allergens && Array.isArray(item.allergens) && item.allergens.length > 0) {
        // Check if allergens are objects with name property or just strings
        if (typeof item.allergens[0] === 'object' && item.allergens[0].name) {
          allergensText = item.allergens.map(allergen => allergen.name).join(', ');
        } else if (typeof item.allergens[0] === 'string') {
          allergensText = item.allergens.join(', ');
        }
        allergensSection.style.display = 'block';
      } else if (typeof item.allergens === 'string' && item.allergens.trim()) {
        allergensText = item.allergens;
        allergensSection.style.display = 'block';
      } else {
        // Hide the allergens section if there are no allergens
        allergensSection.style.display = 'none';
      }
      document.getElementById('modal-allergens').textContent = allergensText;

      const iconsHtml = item.icons && item.icons.length > 0
        ? item.icons.map(icon => this.renderModalIconBadge(icon)).join('')
        : '';
      document.getElementById('modal-icons').innerHTML = iconsHtml;

      if (item.nutrition) {
        this.renderNutritionFacts(item.nutrition, item.serving_size);
      }

      this.elements.itemModal.hidden = false;
      this.elements.modalClose.focus();

      if (this.inactivityManager) {
        this.inactivityManager.pause();
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  renderNutritionFacts(nutrition, servingSize) {
    const nutritionLabel = document.querySelector('.nutrition-label');
    if (!nutritionLabel) return;

    const hasData = nutrition && Object.keys(nutrition).length > 1;

    if (!hasData) {
      nutritionLabel.innerHTML = `
        <div class="nutrition-header">
          <div class="nutrition-title-group">
            <h4 class="nutrition-title">Nutrition Facts</h4>
          </div>
        </div>
        <div class="nutrition-divider thick"></div>
        <p style="padding: 20px; color: #666; text-align: center;">Nutrition information not available for this item.</p>
      `;
      return;
    }

    document.getElementById('nutrition-serving').textContent = servingSize || 'Per serving';
    document.getElementById('nutrition-calories').textContent = nutrition.calories || 0;

    const updateNutrientRow = (elementId, value, dvElementId = null, nutrientKey = null) => {
      const element = document.getElementById(elementId);
      const parentRow = element?.closest('.nutrition-row');

      if (value === undefined || value === null || value === 0) {
        if (parentRow) parentRow.style.display = 'none';
        const divider = parentRow?.previousElementSibling;
        if (divider && divider.classList.contains('nutrition-divider')) {
          divider.style.display = 'none';
        }
        return;
      }

      if (parentRow) parentRow.style.display = '';
      const divider = parentRow?.previousElementSibling;
      if (divider && divider.classList.contains('nutrition-divider')) {
        divider.style.display = '';
      }

      if (element) element.textContent = Math.round(value * 100) / 100;

      if (dvElementId && nutrientKey) {
        const dvElement = document.getElementById(dvElementId);
        if (dvElement) {
          dvElement.textContent = calculateDailyValue(nutrientKey, value);
        }
      }
    };

    updateNutrientRow('nutrition-fat', nutrition.total_fat_g, 'nutrition-fat-dv', 'total_fat_g');
    updateNutrientRow('nutrition-sat-fat', nutrition.saturated_fat_g, 'nutrition-sat-fat-dv', 'saturated_fat_g');
    updateNutrientRow('nutrition-trans-fat', nutrition.trans_fat_g);
    updateNutrientRow('nutrition-cholesterol', nutrition.cholesterol_mg, 'nutrition-cholesterol-dv', 'cholesterol_mg');
    updateNutrientRow('nutrition-sodium', nutrition.sodium_mg, 'nutrition-sodium-dv', 'sodium_mg');
    updateNutrientRow('nutrition-carbs', nutrition.total_carbs_g, 'nutrition-carbs-dv', 'total_carbs_g');
    updateNutrientRow('nutrition-fiber', nutrition.dietary_fiber_g, 'nutrition-fiber-dv', 'dietary_fiber_g');
    updateNutrientRow('nutrition-sugars', nutrition.total_sugars_g);
    updateNutrientRow('nutrition-protein', nutrition.protein_g);
    updateNutrientRow('nutrition-vitamin-d', nutrition.vitamin_d_mcg, 'nutrition-vitamin-d-dv', 'vitamin_d_mcg');
    updateNutrientRow('nutrition-calcium', nutrition.calcium_mg, 'nutrition-calcium-dv', 'calcium_mg');
    updateNutrientRow('nutrition-iron', nutrition.iron_mg, 'nutrition-iron-dv', 'iron_mg');
    updateNutrientRow('nutrition-potassium', nutrition.potassium_mg, 'nutrition-potassium-dv', 'potassium_mg');
  }

  closeModal() {
    this.elements.itemModal.hidden = true;
    this.state.selectedItem = null;

    if (this.inactivityManager) {
      this.inactivityManager.resume();
    }
  }

  showLandingView() {
    this.elements.stationView.classList.remove('active');
    this.elements.landingView.classList.add('active');
    this.elements.backToStations.style.display = 'none';
    this.state.currentView = 'landing';
    this.state.selectedStation = null;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  returnHome() {
    this.closeModal();
    this.showLandingView();
    this.dismissTimeoutWarning();
  }

  handleTimeout() {
    this.returnHome();
  }

  showTimeoutWarning(seconds) {
    this.elements.timeoutWarning.hidden = false;
    this.startCountdown(seconds);
  }

  dismissTimeoutWarning() {
    this.elements.timeoutWarning.hidden = true;
    this.stopCountdown();

    if (this.inactivityManager) {
      this.inactivityManager.resetTimer();
    }
  }

  startCountdown(totalSeconds) {
    let remaining = totalSeconds;
    this.updateCountdownDisplay(remaining);

    this.countdownInterval = setInterval(() => {
      remaining--;
      this.updateCountdownDisplay(remaining);

      if (remaining <= 0) {
        this.stopCountdown();
      }
    }, 1000);
  }

  stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  updateCountdownDisplay(seconds) {
    this.elements.timeoutSeconds.textContent = seconds;
    this.elements.timeoutCountdown.textContent = seconds;

    const circle = document.querySelector('.timeout-circle-progress');
    const circumference = 339.292;
    const progress = (seconds / 10) * circumference;
    circle.style.strokeDashoffset = circumference - progress;
  }

  showError(message) {
    this.elements.errorText.textContent = message;
    this.elements.errorBanner.hidden = false;

    setTimeout(() => {
      this.hideError();
    }, 5000);
  }

  hideError() {
    this.elements.errorBanner.hidden = true;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getIconInitials(name) {
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  hasIconImage(iconName) {
    const knownIcons = ['vegan', 'vegetarian', 'withoutgluten', 'withoutdairy', 'halal', 'spicy'];
    const normalizedName = iconName.replace(/\s+/g, '').toLowerCase();
    return knownIcons.includes(normalizedName);
  }

  renderIconBadge(icon) {
    const iconName = icon.name || '';
    if (this.hasIconImage(iconName)) {
      return `<img src="${icon.file_path}" alt="${icon.display_name}" class="dietary-icon-small" title="${this.escapeHtml(icon.display_name)}">`;
    } else if (icon.icon_url) {
      return `<img src="${icon.icon_url}" alt="${icon.display_name}" class="dietary-icon-small dietary-icon-remote" title="${this.escapeHtml(icon.display_name)}">`;
    } else {
      const initials = this.getIconInitials(iconName);
      return `<span class="dietary-icon-badge" title="${this.escapeHtml(iconName)}">${initials}</span>`;
    }
  }

  renderModalIconBadge(icon) {
    const iconName = icon.name || '';
    if (this.hasIconImage(iconName)) {
      return `
        <div class="dietary-icon-item">
          <img src="${icon.file_path}" alt="${icon.display_name}" class="dietary-icon-large">
          <span class="dietary-icon-label">${this.escapeHtml(icon.display_name)}</span>
        </div>
      `;
    } else if (icon.icon_url) {
      return `
        <div class="dietary-icon-item">
          <img src="${icon.icon_url}" alt="${icon.display_name}" class="dietary-icon-large dietary-icon-remote">
          <span class="dietary-icon-label">${this.escapeHtml(icon.display_name)}</span>
        </div>
      `;
    } else {
      const initials = this.getIconInitials(iconName);
      return `
        <div class="dietary-icon-item">
          <span class="dietary-icon-badge dietary-icon-badge-large">${initials}</span>
          <span class="dietary-icon-label">${this.escapeHtml(iconName)}</span>
        </div>
      `;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MenuApp();
});
