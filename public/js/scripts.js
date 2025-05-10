/*!
* Start Bootstrap - Clean Blog v6.0.9 (https://startbootstrap.com/theme/clean-blog)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-clean-blog/blob/master/LICENSE)
*/
window.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll behavior
    let scrollPos = 0;
    const mainNav = document.getElementById('mainNav');
    if (mainNav) {
        const headerHeight = mainNav.clientHeight;
        window.addEventListener('scroll', function() {
            const currentTop = document.body.getBoundingClientRect().top * -1;
            if (currentTop < scrollPos) {
                // Scrolling Up
                if (currentTop > 0 && mainNav.classList.contains('is-fixed')) {
                    mainNav.classList.add('is-visible');
                } else {
                    console.log(123);
                    mainNav.classList.remove('is-visible', 'is-fixed');
                }
            } else {
                // Scrolling Down
                mainNav.classList.remove(['is-visible']);
                if (currentTop > headerHeight && !mainNav.classList.contains('is-fixed')) {
                    mainNav.classList.add('is-fixed');
                }
            }
            scrollPos = currentTop;
        });
    }

    // Form validation (moved from inline script)
    function validateForm() {
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        if (!username || !password || !confirmPassword) return true; 
        
        // Username validation
        const usernameRegex = /^[a-zA-Z0-9]{3,}$/;
        if (!usernameRegex.test(username)) {
            alert('Username must be at least 3 characters and contain only letters and numbers');
            return false;
        }
        
        // Check for special characters in username
        const specialChars = /[@#$%&*[]{}"'()]/;
        if (specialChars.test(username)) {
            alert('Username cannot contain special characters (@#$%&*)');
            return false;
        }
        
        // Password length check
        if (password.length < 3) {
            alert('Password must be at least 3 characters long');
            return false;
        }
        
        // Password match check
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return false;
        }
        
        return true;
    }

    // Attach validation to form if it exists
    const signupForm = document.querySelector('form[action="/signup"]');
    if (signupForm) {
        signupForm.onsubmit = validateForm;
    }
});