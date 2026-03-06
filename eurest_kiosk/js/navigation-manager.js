import { trmApiService } from './trm-api-service.js';

export class NavigationManager {
  constructor(onNavigationChange) {
    this.state = {
      selectedSapCode: null,
      selectedVenue: null,
      sapCodes: [],
      venues: [],
      isLoading: false
    };

    this.onNavigationChange = onNavigationChange;
    this.elements = {};
    this.init();
  }

  async init() {
    this.setupElements();
    this.setupEventListeners();
    await this.loadSapCodes();
    this.loadPersistedSelection();
  }

  setupElements() {
    this.elements = {
      navContainer: document.getElementById('nav-container'),
      quickVenueDropdown: document.getElementById('quick-venue-dropdown'),
      venueButton: document.getElementById('venue-button'),
      venueButtonText: document.getElementById('venue-button-text'),
      venueDropdownList: document.getElementById('venue-dropdown-list'),
      navModalIcon: document.getElementById('nav-modal-icon'),
      navModal: document.getElementById('nav-modal'),
      navModalClose: document.getElementById('nav-modal-close'),
      navModalOverlay: document.getElementById('nav-modal-overlay'),
      sapCodesList: document.getElementById('sap-codes-list'),
      venuesList: document.getElementById('venues-list'),
      sapCodeSearch: document.getElementById('sap-code-search'),
      venueSearch: document.getElementById('venue-search'),
      selectedSapCodeDisplay: document.getElementById('selected-sap-code-display'),
      selectedVenueDisplay: document.getElementById('selected-venue-display'),
      businessUnitName: document.getElementById('business-unit-name')
    };
  }

  setupEventListeners() {
    this.elements.venueButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.state.selectedSapCode) {
        this.openFullNavModal();
      } else {
        this.toggleQuickDropdown();
      }
    });

    this.elements.navModalIcon?.addEventListener('click', () => {
      this.openFullNavModal();
    });

    this.elements.navModalClose?.addEventListener('click', () => {
      this.closeFullNavModal();
    });

    this.elements.navModalOverlay?.addEventListener('click', () => {
      this.closeFullNavModal();
    });

    this.elements.sapCodeSearch?.addEventListener('input', (e) => {
      this.filterSapCodes(e.target.value);
    });

    this.elements.venueSearch?.addEventListener('input', (e) => {
      this.filterVenues(e.target.value);
    });

    document.addEventListener('click', (e) => {
      if (!this.elements.quickVenueDropdown?.contains(e.target)) {
        this.closeQuickDropdown();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeFullNavModal();
        this.closeQuickDropdown();
      }
    });
  }

  async loadSapCodes() {
    try {
      this.state.isLoading = true;
      const response = await trmApiService.fetchSapCodes();
      console.log('Navigation Manager received SAP codes:', response);

      if (response && response.sapCodes) {
        this.state.sapCodes = response.sapCodes;
        console.log('Set sapCodes in state:', this.state.sapCodes.length, 'items');
        this.renderSapCodes();
      } else if (Array.isArray(response)) {
        this.state.sapCodes = response;
        console.log('Set sapCodes in state (array):', this.state.sapCodes.length, 'items');
        this.renderSapCodes();
      } else {
        console.warn('Unexpected SAP codes response structure:', response);
      }
    } catch (error) {
      console.error('Failed to load SAP codes:', error);
      this.showError('Failed to load business units');
    } finally {
      this.state.isLoading = false;
    }
  }

  async loadVenues(sapCode) {
    try {
      this.state.isLoading = true;
      const response = await trmApiService.fetchVenuesBySapCode(sapCode);

      if (response && response.venues) {
        this.state.venues = response.venues;
        this.renderVenues();
        this.renderQuickVenueDropdown();
      }
    } catch (error) {
      console.error('Failed to load venues:', error);
      this.showError('Failed to load venues');
    } finally {
      this.state.isLoading = false;
    }
  }

  renderSapCodes(filter = '') {
    if (!this.elements.sapCodesList) {
      console.warn('sapCodesList element not found');
      return;
    }

    console.log('Rendering SAP codes. Total:', this.state.sapCodes.length, 'Filter:', filter);

    const filteredSapCodes = this.state.sapCodes.filter(sapCode => {
      if (!sapCode || !sapCode.businessUnitId) {
        console.warn('Invalid sapCode:', sapCode);
        return false;
      }
      if (!filter) return true;
      const searchText = filter.toLowerCase();
      return sapCode.businessUnitId.toLowerCase().includes(searchText) ||
             (sapCode.name && sapCode.name.toLowerCase().includes(searchText));
    });

    console.log('Filtered SAP codes:', filteredSapCodes.length);

    if (filteredSapCodes.length === 0) {
      this.elements.sapCodesList.innerHTML = `
        <div class="nav-empty-state">
          <p>No business units found</p>
        </div>
      `;
      return;
    }

    this.elements.sapCodesList.innerHTML = filteredSapCodes.map(sapCode => `
      <div class="nav-list-item ${this.state.selectedSapCode?.businessUnitId === sapCode.businessUnitId ? 'selected' : ''}"
           data-sap-code="${sapCode.businessUnitId}">
        <div class="nav-item-code">${sapCode.businessUnitId}</div>
        <div class="nav-item-name">${sapCode.name || sapCode.businessUnitId}</div>
      </div>
    `).join('');

    console.log('Rendered', filteredSapCodes.length, 'SAP code items to DOM');

    this.elements.sapCodesList.querySelectorAll('.nav-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const sapCode = this.state.sapCodes.find(sc => sc.businessUnitId === item.dataset.sapCode);
        if (sapCode) {
          this.selectSapCode(sapCode);
        }
      });
    });
  }

  renderVenues(filter = '') {
    if (!this.elements.venuesList) return;

    if (!this.state.selectedSapCode) {
      this.elements.venuesList.innerHTML = `
        <div class="nav-empty-state">
          <p>Please select a business unit first</p>
        </div>
      `;
      return;
    }

    if (this.state.venues.length === 0) {
      this.elements.venuesList.innerHTML = `
        <div class="nav-empty-state">
          <p>No venues available</p>
        </div>
      `;
      return;
    }

    const filteredVenues = this.state.venues.filter(venue => {
      if (!filter) return true;
      const searchText = filter.toLowerCase();
      return venue.name?.toLowerCase().includes(searchText) ||
             venue.locationId?.toString().includes(searchText);
    });

    if (filteredVenues.length === 0) {
      this.elements.venuesList.innerHTML = `
        <div class="nav-empty-state">
          <p>No venues match your search</p>
        </div>
      `;
      return;
    }

    this.elements.venuesList.innerHTML = filteredVenues.map(venue => `
      <div class="nav-list-item ${this.state.selectedVenue?.locationId === venue.locationId ? 'selected' : ''}"
           data-location-id="${venue.locationId}">
        <div class="nav-item-name">${venue.name || 'Unknown Venue'}</div>
        ${venue.address ? `<div class="nav-item-address">${venue.address}</div>` : ''}
      </div>
    `).join('');

    this.elements.venuesList.querySelectorAll('.nav-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const venue = this.state.venues.find(v => v.locationId === parseInt(item.dataset.locationId));
        this.selectVenue(venue);
      });
    });
  }

  renderQuickVenueDropdown() {
    if (!this.elements.venueDropdownList) return;

    this.elements.venueDropdownList.innerHTML = this.state.venues.map(venue => `
      <div class="venue-dropdown-item ${this.state.selectedVenue?.locationId === venue.locationId ? 'selected' : ''}"
           data-location-id="${venue.locationId}">
        ${venue.name || 'Unknown Venue'}
      </div>
    `).join('');

    this.elements.venueDropdownList.querySelectorAll('.venue-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const venue = this.state.venues.find(v => v.locationId === parseInt(item.dataset.locationId));
        this.selectVenue(venue);
        this.closeQuickDropdown();
      });
    });
  }

  async selectSapCode(sapCode) {
    console.log('Selecting SAP code:', sapCode);
    this.state.selectedSapCode = sapCode;
    this.state.selectedVenue = null;
    this.state.venues = [];
    this.persistSelection();
    this.updateDisplay();
    this.renderVenues();
    this.renderQuickVenueDropdown();
    this.renderSapCodes();
    await this.loadVenues(sapCode.businessUnitId);
  }

  selectVenue(venue) {
    console.log('Venue selected:', venue);
    console.log('Venue ID:', venue.locationId);
    this.state.selectedVenue = venue;
    this.persistSelection();
    this.updateDisplay();
    this.renderVenues();
    this.renderQuickVenueDropdown();
    this.closeFullNavModal();

    if (this.onNavigationChange) {
      this.onNavigationChange({
        businessUnit: this.state.selectedSapCode,
        venue: this.state.selectedVenue
      });
    }
  }

  updateDisplay() {
    if (this.elements.businessUnitName) {
      if (this.state.selectedSapCode) {
        this.elements.businessUnitName.textContent = this.state.selectedSapCode.name;
      } else {
        this.elements.businessUnitName.textContent = 'Not Selected';
      }
    }

    if (this.elements.venueButtonText) {
      if (!this.state.selectedSapCode) {
        this.elements.venueButtonText.textContent = 'Select Business Unit';
      } else if (this.state.selectedVenue) {
        this.elements.venueButtonText.textContent = this.state.selectedVenue.name;
      } else {
        this.elements.venueButtonText.textContent = 'Select Venue';
      }
    }

    if (this.elements.venueSearch) {
      this.elements.venueSearch.disabled = !this.state.selectedSapCode;
    }

    if (this.elements.selectedSapCodeDisplay) {
      this.elements.selectedSapCodeDisplay.textContent =
        this.state.selectedSapCode ?
        `${this.state.selectedSapCode.businessUnitId} - ${this.state.selectedSapCode.name}` :
        'No Business Unit Selected';
    }

    if (this.elements.selectedVenueDisplay) {
      if (this.state.selectedVenue) {
        this.elements.selectedVenueDisplay.textContent =
          `${this.state.selectedVenue.name} (ID: ${this.state.selectedVenue.locationId})`;
      } else {
        this.elements.selectedVenueDisplay.textContent = 'No Venue Selected';
      }
    }
  }

  toggleQuickDropdown() {
    this.elements.quickVenueDropdown?.classList.toggle('open');
  }

  closeQuickDropdown() {
    this.elements.quickVenueDropdown?.classList.remove('open');
  }

  openFullNavModal() {
    this.elements.navModal?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeFullNavModal() {
    this.elements.navModal?.classList.remove('open');
    document.body.style.overflow = '';
  }

  filterSapCodes(searchText) {
    this.renderSapCodes(searchText);
  }

  filterVenues(searchText) {
    this.renderVenues(searchText);
  }

  persistSelection() {
    if (this.state.selectedSapCode) {
      localStorage.setItem('selectedSapCode', JSON.stringify(this.state.selectedSapCode));
    } else {
      localStorage.removeItem('selectedSapCode');
    }

    if (this.state.selectedVenue) {
      localStorage.setItem('selectedVenue', JSON.stringify(this.state.selectedVenue));
    } else {
      localStorage.removeItem('selectedVenue');
    }
  }

  async loadPersistedSelection() {
    try {
      const savedSapCode = localStorage.getItem('selectedSapCode');
      const savedVenue = localStorage.getItem('selectedVenue');

      console.log('Loading persisted selection:', { savedSapCode, savedVenue });

      if (savedSapCode && savedSapCode !== 'undefined' && savedSapCode !== 'null') {
        try {
          this.state.selectedSapCode = JSON.parse(savedSapCode);
          console.log('Parsed SAP code:', this.state.selectedSapCode);
          if (this.state.selectedSapCode?.businessUnitId) {
            await this.loadVenues(this.state.selectedSapCode.businessUnitId);
          }
        } catch (e) {
          console.error('Failed to parse saved SAP code:', e);
          localStorage.removeItem('selectedSapCode');
          this.state.selectedSapCode = null;
        }
      }

      if (savedVenue && savedVenue !== 'undefined' && savedVenue !== 'null') {
        try {
          this.state.selectedVenue = JSON.parse(savedVenue);
          console.log('Parsed venue:', this.state.selectedVenue);
        } catch (e) {
          console.error('Failed to parse saved venue:', e);
          localStorage.removeItem('selectedVenue');
          this.state.selectedVenue = null;
        }
      }

      this.updateDisplay();
      this.renderSapCodes();
      this.renderVenues();
      this.renderQuickVenueDropdown();

      if (this.state.selectedSapCode && this.state.selectedVenue && this.onNavigationChange) {
        console.log('Triggering navigation change with persisted data');
        this.onNavigationChange({
          businessUnit: this.state.selectedSapCode,
          venue: this.state.selectedVenue
        });
      }
    } catch (error) {
      console.error('Failed to load persisted selection:', error);
    }
  }

  showError(message) {
    console.error(message);
  }

  getSelectedContext() {
    return {
      sapCode: this.state.selectedSapCode,
      venue: this.state.selectedVenue
    };
  }
}
