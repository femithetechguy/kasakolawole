/**
 * URL Router for Clean URLs
 * Handles client-side routing for GitHub Pages
 */

(function() {
    'use strict';

    const router = {
        // Route definitions
        routes: {
            '/': { file: 'index.html', title: 'Login - Kasa Kolawole' },
            '/home': { file: 'home/home.html', title: 'Dashboard - Kasa Kolawole' },
            '/bills': { file: 'bill/bill.html', title: 'Bills - Kasa Kolawole' },
            '/debt': { file: 'debt/debt.html', title: 'Debt - Kasa Kolawole' }
        },

        /**
         * Initialize router
         */
        init: function() {
            // Handle initial load
            this.handleRoute();

            // Handle browser back/forward
            window.addEventListener('popstate', () => this.handleRoute());
        },

        /**
         * Navigate to a route
         */
        navigate: function(path) {
            if (path !== window.location.pathname) {
                window.history.pushState({}, '', path);
                this.handleRoute();
            }
        },

        /**
         * Handle current route
         */
        handleRoute: function() {
            const path = window.location.pathname;
            const route = this.routes[path];

            if (route) {
                document.title = route.title;
                // For login page, don't reload
                if (path === '/' && window.location.pathname === '/') {
                    return;
                }
                // For other pages, load content if needed
                if (path !== '/' && window.location.pathname !== '/index.html') {
                    this.loadPage(route.file);
                }
            }
        },

        /**
         * Load page content
         */
        loadPage: function(file) {
            // For now, just redirect (will be replaced with SPA logic if needed)
            if (window.location.pathname !== `/${file}`) {
                window.location.href = `/${file}`;
            }
        }
    };

    // Export router
    window.KasaRouter = router;

    // Auto-initialize if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => router.init());
    } else {
        router.init();
    }
})();
