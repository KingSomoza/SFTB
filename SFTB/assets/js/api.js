/**
 * ============================================================
 * START FROM THE BOTTOM — API Client
 * Milky Way Idle Guild
 * Google Apps Script Web App Integration
 * ============================================================
 */

 (function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURATION
    // ============================================================
    
    /**
     * ⚠️ IMPORTANT: Replace this URL with your Google Apps Script
     * Web App deployment URL (e.g., 
     * https://script.google.com/macros/s/XXXX/exec)
     * 
     * DO NOT commit API keys or secrets in this file.
     */
    const API_URL = 'https://script.google.com/macros/s/AKfycby2ISALiylcGSjNy98BmBRVGk5IZZ0hKR9B67emwUGz5xOJI3krRxXKiTKZqqlnJfszSw/exec'; 

    // ============================================================
    // 2. CORE API FUNCTIONS
    // ============================================================

    /**
     * Send a GET request to the Web App
     * @param {string} action - The action/endpoint name
     * @param {Object} params - Query parameters (key-value)
     * @returns {Promise<Object>} - Response data or error object
     */
    async function apiGet(action, params = {}) {
        try {
            if (!API_URL) {
                throw new Error('API_URL is not configured. Please set your Google Apps Script URL.');
            }

            // Build URL with query parameters
            const url = new URL(API_URL);
            url.searchParams.append('action', action);
            
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                // Allow credentials if needed for session cookies
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('[apiGet] Error:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch data from server'
            };
        }
    }

    /**
     * Send a POST request to the Web App
     * @param {string} action - The action/endpoint name
     * @param {Object} data - Data to send in the request body
     * @returns {Promise<Object>} - Response data or error object
     */
    async function apiPost(action, data = {}) {
        try {
            if (!API_URL) {
                throw new Error('API_URL is not configured. Please set your Google Apps Script URL.');
            }

            // Build URL with action parameter
            const url = new URL(API_URL);
            url.searchParams.append('action', action);

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseData = await response.json();
            return responseData;

        } catch (error) {
            console.error('[apiPost] Error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send data to server'
            };
        }
    }

    // ============================================================
    // 3. PUBLIC API FUNCTIONS
    // ============================================================

    /**
     * Fetch the list of guild members
     * @param {Object} options - Optional filters (e.g., { limit: 50, offset: 0 })
     * @returns {Promise<Object>} - { success, members: [...], error? }
     */
    async function getMembers(options = {}) {
        return await apiGet('getMembers', options);
    }

    /**
     * Fetch guild statistics (member count, combined level, active, founded, etc.)
     * @returns {Promise<Object>} - { success, stats: {...}, error? }
     */
    async function getMemberStats() {
        return await apiGet('getStats');
    }

    /**
     * Submit a new guild application
     * @param {Object} formData - Application data
     *   Expected fields: 
     *   - { string } ign - In-game name
     *   - { string } level - Current level
     *   - { string } discord - Discord username (optional)
     *   - { string } message - Additional notes (optional)
     *   - { string } email - Contact email (optional)
     * @returns {Promise<Object>} - { success, applicationId?, error? }
     */
    async function submitApplication(formData) {
        // Validate required fields
        if (!formData.ign || !formData.ign.trim()) {
            return {
                success: false,
                error: 'In-game name is required'
            };
        }
        if (!formData.level) {
            return {
                success: false,
                error: 'Level is required'
            };
        }

        // Clean up data
        const cleanedData = {
            ign: formData.ign.trim(),
            level: String(formData.level).trim(),
            discord: formData.discord ? formData.discord.trim() : '',
            message: formData.message ? formData.message.trim() : '',
            email: formData.email ? formData.email.trim() : '',
            timestamp: new Date().toISOString()
        };

        return await apiPost('submitApplication', cleanedData);
    }

    /**
     * Login a member
     * @param {string} username - Member username or ign
     * @param {string} password - Member password
     * @returns {Promise<Object>} - { success, user: {...}, token?, error? }
     */
    async function loginMember(username, password) {
        if (!username || !username.trim()) {
            return {
                success: false,
                error: 'Username is required'
            };
        }
        if (!password || !password.trim()) {
            return {
                success: false,
                error: 'Password is required'
            };
        }

        return await apiPost('login', {
            username: username.trim(),
            password: password.trim()
        });
    }

    /**
     * Check the current session status
     * @returns {Promise<Object>} - { success, user: {...}?, error? }
     */
    async function getMemberSession() {
        return await apiGet('getSession');
    }

    /**
     * Logout the current user (invalidate session)
     * @returns {Promise<Object>} - { success, error? }
     */
    async function logoutMember() {
        return await apiPost('logout', {});
    }

    /**
     * Update a member's rank (officer/admin only)
     * @param {string} memberId - The member's ID or username
     * @param {string} newRank - The new rank (e.g., 'Recruit', 'Digger', etc.)
     * @param {string} reason - Optional reason for the change
     * @returns {Promise<Object>} - { success, error? }
     */
    async function updateMemberRank(memberId, newRank, reason = '') {
        if (!memberId || !memberId.trim()) {
            return {
                success: false,
                error: 'Member ID is required'
            };
        }
        if (!newRank || !newRank.trim()) {
            return {
                success: false,
                error: 'New rank is required'
            };
        }

        return await apiPost('updateRank', {
            memberId: memberId.trim(),
            newRank: newRank.trim(),
            reason: reason.trim()
        });
    }

    /**
     * Get a specific member's details
     * @param {string} memberId - The member's ID or username
     * @returns {Promise<Object>} - { success, member: {...}?, error? }
     */
    async function getMemberDetails(memberId) {
        if (!memberId || !memberId.trim()) {
            return {
                success: false,
                error: 'Member ID is required'
            };
        }
        return await apiGet('getMember', { memberId: memberId.trim() });
    }

    /**
     * Submit a member activity report (daily/weekly check-in)
     * @param {Object} activityData - Activity data
     * @returns {Promise<Object>} - { success, error? }
     */
    async function submitActivity(activityData) {
        return await apiPost('submitActivity', activityData);
    }

    // ============================================================
    // 4. EXPOSE PUBLIC FUNCTIONS
    // ============================================================

    // Attach to window for global access
    window.SFTB_API = {
        // Core (if needed directly)
        apiGet,
        apiPost,

        // Public endpoints
        getMembers,
        getMemberStats,
        submitApplication,
        loginMember,
        getMemberSession,
        logoutMember,
        updateMemberRank,
        getMemberDetails,
        submitActivity,

        // Config (read-only)
        getApiUrl: function() { return API_URL; },
        isConfigured: function() { return API_URL && API_URL.length > 0; }
    };

    // Also expose individual functions for convenience
    window.getMembers = getMembers;
    window.getMemberStats = getMemberStats;
    window.submitApplication = submitApplication;
    window.loginMember = loginMember;
    window.getMemberSession = getMemberSession;
    window.logoutMember = logoutMember;
    window.updateMemberRank = updateMemberRank;
    window.getMemberDetails = getMemberDetails;
    window.submitActivity = submitActivity;

    // ============================================================
    // 5. INITIALIZATION CHECK
    // ============================================================

    // Warn if API_URL is not configured
    if (!API_URL) {
        console.warn(
            '⚠️ SFTB API: API_URL is not configured. ' +
            'Please set your Google Apps Script Web App URL in api.js'
        );
    } else {
        console.log('🌌 SFTB API Client initialized');
        console.log(`📡 API Endpoint: ${API_URL}`);
    }

})();