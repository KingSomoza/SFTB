/**
 * ============================================================
 * START FROM THE BOTTOM — Authentication & Session Manager
 * Milky Way Idle Guild
 * Cloudflare Pages + Google Apps Script Integration
 * ============================================================
 */

 (function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURATION
    // ============================================================

    const SESSION_KEY = 'sftb_session';
    const REDIRECT_AFTER_LOGIN = 'index.html';
    const REDIRECT_AFTER_LOGOUT = 'index.html';
    const ADMIN_REDIRECT = 'index.html';
    const LOGIN_PAGE = 'login.html';

    // Admin/Management ranks (case-insensitive)
    const ADMIN_RANKS = ['starbound', 'voyager', 'officer', 'admin', 'manager'];

    // ============================================================
    // 2. SESSION STORAGE HELPERS
    // ============================================================

    /**
     * Save session data to sessionStorage
     * @param {Object} sessionData - User session data
     */
    function saveSession(sessionData) {
        try {
            const serialized = JSON.stringify(sessionData);
            sessionStorage.setItem(SESSION_KEY, serialized);
        } catch (error) {
            console.error('[Auth] Failed to save session:', error);
        }
    }

    /**
     * Get session data from sessionStorage
     * @returns {Object|null} - Session data or null if not found
     */
    function getSession() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (error) {
            console.error('[Auth] Failed to read session:', error);
            return null;
        }
    }

    /**
     * Clear session data from sessionStorage
     */
    function clearSession() {
        try {
            sessionStorage.removeItem(SESSION_KEY);
        } catch (error) {
            console.error('[Auth] Failed to clear session:', error);
        }
    }

    /**
     * Check if session is valid (exists and has required fields)
     * @param {Object} session - Session object
     * @returns {boolean} - True if valid
     */
    function isValidSession(session) {
        if (!session) return false;
        if (!session.memberId && !session.username) return false;
        if (!session.rank) return false;
        // Optional: check expiry
        if (session.expiry && new Date(session.expiry) < new Date()) {
            return false;
        }
        return true;
    }

    // ============================================================
    // 3. PUBLIC AUTH FUNCTIONS
    // ============================================================

    /**
     * Login a member using the API
     * @param {string} username - Member username
     * @param {string} password - Member password
     * @returns {Promise<Object>} - { success: boolean, user: {...}, error: string? }
     */
    async function login(username, password) {
        try {
            // Call the API login function (from api.js)
            if (typeof loginMember !== 'function') {
                throw new Error('loginMember() not available. Make sure api.js is loaded.');
            }

            const result = await loginMember(username, password);

            if (result.success && result.user) {
                // Store session data
                const sessionData = {
                    memberId: result.user.id || result.user.memberId || result.user.username,
                    username: result.user.username || result.user.ign || username,
                    ign: result.user.ign || result.user.username || username,
                    rank: result.user.rank || 'Recruit',
                    email: result.user.email || '',
                    discord: result.user.discord || '',
                    token: result.token || result.sessionId || '',
                    loginTime: new Date().toISOString(),
                    expiry: result.expiry || null
                };

                saveSession(sessionData);

                return {
                    success: true,
                    user: sessionData
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Login failed'
                };
            }
        } catch (error) {
            console.error('[Auth] Login error:', error);
            return {
                success: false,
                error: error.message || 'An unexpected error occurred during login'
            };
        }
    }

    /**
     * Check if the current user is authenticated
     * @param {boolean} redirectOnFail - Whether to redirect to login page if not authenticated
     * @returns {Object|null} - Session data if authenticated, null otherwise
     */
    function checkAuth(redirectOnFail = true) {
        const session = getSession();

        if (isValidSession(session)) {
            return session;
        }

        // Session invalid or expired
        clearSession();

        if (redirectOnFail) {
            // Redirect to login page
            const currentPath = window.location.pathname;
            const loginUrl = `${LOGIN_PAGE}?redirect=${encodeURIComponent(currentPath)}`;
            window.location.href = loginUrl;
        }

        return null;
    }

    /**
     * Check if the current user is an admin/officer
     * @param {boolean} redirectOnFail - Whether to redirect if not authorized
     * @returns {Object|null} - Session data if authorized, null otherwise
     */
    function checkAdminAuth(redirectOnFail = true) {
        const session = checkAuth(redirectOnFail);

        if (!session) {
            return null;
        }

        // Check if rank is in admin list (case-insensitive)
        const userRank = session.rank ? session.rank.toLowerCase() : '';
        const isAdmin = ADMIN_RANKS.some(rank => userRank.includes(rank.toLowerCase()));

        if (isAdmin) {
            return session;
        }

        // Not authorized
        if (redirectOnFail) {
            // Redirect to home page with error message
            if (typeof showToast === 'function') {
                showToast('You do not have permission to access this page.', 'error');
            }
            window.location.href = REDIRECT_AFTER_LOGOUT;
        }

        return null;
    }

    /**
     * Logout the current user
     * @param {boolean} redirect - Whether to redirect after logout
     * @returns {Promise<Object>} - { success: boolean, error: string? }
     */
    async function logout(redirect = true) {
        try {
            // Call API logout if available
            if (typeof logoutMember === 'function') {
                await logoutMember();
            }
        } catch (error) {
            console.warn('[Auth] Logout API call failed:', error);
        }

        // Clear local session
        clearSession();

        if (redirect) {
            window.location.href = REDIRECT_AFTER_LOGOUT;
        }

        return { success: true };
    }

    /**
     * Get the current authenticated member's data
     * @returns {Object|null} - Member data or null if not authenticated
     */
    function getCurrentMember() {
        const session = getSession();
        if (isValidSession(session)) {
            return session;
        }
        return null;
    }

    /**
     * Get the current member's rank
     * @returns {string|null} - Rank string or null if not authenticated
     */
    function getCurrentRank() {
        const member = getCurrentMember();
        return member ? member.rank : null;
    }

    /**
     * Check if the current user has a specific rank (or higher)
     * @param {string|string[]} requiredRank - Rank or array of ranks required
     * @returns {boolean} - True if user has the required rank
     */
    function hasRank(requiredRank) {
        const member = getCurrentMember();
        if (!member) return false;

        const userRank = member.rank ? member.rank.toLowerCase() : '';
        
        if (Array.isArray(requiredRank)) {
            return requiredRank.some(rank => userRank.includes(rank.toLowerCase()));
        }
        
        return userRank.includes(requiredRank.toLowerCase());
    }

    /**
     * Check if the current user is an admin/officer
     * @returns {boolean} - True if user has admin privileges
     */
    function isAdmin() {
        const member = getCurrentMember();
        if (!member) return false;

        const userRank = member.rank ? member.rank.toLowerCase() : '';
        return ADMIN_RANKS.some(rank => userRank.includes(rank.toLowerCase()));
    }

    /**
     * Verify session with the server (optional, for extra security)
     * @returns {Promise<Object>} - { valid: boolean, user: {...}?, error: string? }
     */
    async function verifySession() {
        try {
            const session = getCurrentMember();
            if (!session) {
                return { valid: false, error: 'No session found' };
            }

            // Call API to verify session
            if (typeof getMemberSession === 'function') {
                const result = await getMemberSession();
                if (result.success && result.user) {
                    // Update session with latest data
                    const updatedSession = {
                        ...session,
                        username: result.user.username || session.username,
                        ign: result.user.ign || session.ign,
                        rank: result.user.rank || session.rank,
                        email: result.user.email || session.email,
                        discord: result.user.discord || session.discord
                    };
                    saveSession(updatedSession);
                    return { valid: true, user: updatedSession };
                } else {
                    // Session invalid on server
                    clearSession();
                    return { valid: false, error: result.error || 'Session invalid' };
                }
            }

            // If API not available, trust local session
            return { valid: true, user: session };
        } catch (error) {
            console.error('[Auth] Session verification error:', error);
            return { valid: false, error: error.message };
        }
    }

    // ============================================================
    // 4. EXPOSE PUBLIC FUNCTIONS
    // ============================================================

    // Attach to window for global access
    window.SFTB_AUTH = {
        login,
        logout,
        checkAuth,
        checkAdminAuth,
        getCurrentMember,
        getCurrentRank,
        hasRank,
        isAdmin,
        verifySession,
        getSession, // exposed for debugging
        clearSession,
        ADMIN_RANKS
    };

    // Also expose individual functions for convenience
    window.login = login;
    window.logout = logout;
    window.checkAuth = checkAuth;
    window.checkAdminAuth = checkAdminAuth;
    window.getCurrentMember = getCurrentMember;
    window.getCurrentRank = getCurrentRank;
    window.hasRank = hasRank;
    window.isAdmin = isAdmin;
    window.verifySession = verifySession;

    // ============================================================
    // 5. AUTO-CHECK (optional) - protected pages can call checkAuth()
    // ============================================================

    // Auto-check for pages that have data-protected attribute
    document.addEventListener('DOMContentLoaded', function() {
        const body = document.body;
        if (body.hasAttribute('data-protected')) {
            const requireAdmin = body.getAttribute('data-protected') === 'admin';
            if (requireAdmin) {
                checkAdminAuth(true);
            } else {
                checkAuth(true);
            }
        }
    });

    console.log('🔐 SFTB Auth Module initialized');
    console.log(`📋 Admin ranks: ${ADMIN_RANKS.join(', ')}`);

})();