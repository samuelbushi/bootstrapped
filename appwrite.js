// Appwrite Bootstrapped Script
// v0.4.0

let isUserAuthenticated = false;

const client = new Appwrite.Client()
.setEndpoint('https://s.samuelbushi.com/v1')
.setProject('boot');
const PROJECT_DOMAIN = 'https://bootstrapped.samuelbushi.com'
const PROJECT_NAME = 'Bootstrapped';
const AUTHENTICATION_REQUIRED = false;
const SETUP_REQUIRED = false; // not done 
const FULL_LOADING_SCREEN = true;


const databases = new Appwrite.Databases(client);
const account = new Appwrite.Account(client);
const storage = new Appwrite.Storage(client);
const functions = new Appwrite.Functions(client);
const locale = new Appwrite.Locale(client);
const teams = new Appwrite.Teams(client);
const avatars = new Appwrite.Avatars(client);

let userDocument;



/**
 * Fetches authenticated user's document with 15-min cache strategy.
 * @returns {Promise<Object|null>} User document if found, null otherwise
 * @throws {Error} If database operation fails
 */

async function checkUser() {
    try {
        const accountResponse = await account.get();
        isUserAuthenticated = true; // Set auth state if account.get() succeeds
        
        const storedData = JSON.parse(sessionStorage.getItem('userData'));
        
        if (storedData?.userId === accountResponse.$id && 
            (new Date() - new Date(storedData.timestamp)) < 900000) { // 15 minutes in milliseconds
            userDocument = storedData.document || null;
            updateUI();  // Update UI
            return storedData.document;
        }

        let attempts = 0;
        const maxAttempts = 5;
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        while (attempts < maxAttempts) {
            console.log('Fetching user data.. ' + attempts);
            try {
                userDocument = await databases.getDocument('userDB', 'userData', accountResponse.$id);
                break; // Exit loop if successful
            } catch (error) {
                attempts++;
                if (attempts >= maxAttempts) {
                    throw error; // Rethrow error after max attempts
                }
                await delay(2000); // Wait 1 second before retrying
            }
        }

        sessionStorage.setItem('userData', JSON.stringify({
            document: userDocument,
            timestamp: new Date().toISOString(),
            userId: accountResponse.$id
        }));

        updateUI();  // Update UI
        return userDocument;
    } catch (error) {
        isUserAuthenticated = false; // Reset auth state on error
        sessionStorage.removeItem('userData');
        if (error.response?.code === 401) {
            showToast({ message: 'No User Logged In' });

            if(AUTHENTICATION_REQUIRED && !window.location.pathname.includes('/auth')){
                window.location.href = '/auth/index.html';
            }
        } else {
            console.error('Error fetching user data:', error);
        }
        return null;
    } finally {
        updateUI(); // Always update UI
        if (FULL_LOADING_SCREEN) {
            document.getElementById('loadingDiv').setAttribute('style', 'display: none !important;');
        }
    }
}
checkUser();


/**
 * Updates UI elements with matching class names using values from a user document.
 * Handles text elements, inputs, images, and avatar generation.
 * User data object containing fields like userFullName, email, etc.
 */
function updateUI() {
    // Handle authentication-based visibility
    const nonAuthElements = document.getElementsByClassName('nonAuthOnly');
    Array.from(nonAuthElements).forEach(element => {
        // Set display through CSS class instead
        if (isUserAuthenticated) {
            element.classList.add('force-hide');
            element.classList.remove('force-show');
        } else {
            element.classList.add('force-show');
            element.classList.remove('force-hide');
        }
    });
    
    const authElements = document.getElementsByClassName('authOnly');
    Array.from(authElements).forEach(element => {
        if (isUserAuthenticated) {
            element.classList.add('force-show');
            element.classList.remove('force-hide');
        } else {
            element.classList.add('force-hide');
            element.classList.remove('force-show');
        }
    });

    // Only update user data if authenticated and userDocument exists
    if (isUserAuthenticated && userDocument) {
        const uiMapping = {
            '.user-name': userDocument.userFullName || userDocument.email || '',
            '.user-email': userDocument.email || '',
            '.user-phone': userDocument.phone || '',
        };

        Object.entries(uiMapping).forEach(([className, value]) => {
            const elements = document.getElementsByClassName(className.replace('.', ''));
            Array.from(elements).forEach(element => {
                if (element.tagName === 'INPUT') {
                    element.value = value;
                } else if (element.tagName === 'IMG') {
                    element.src = value;
                } else {
                    element.textContent = value;
                }
            });
        });

        // Handle avatar
        if (userDocument.userFullName || userDocument.email) {
            const avatarName = userDocument.userFullName || userDocument.email;
            const result = avatars.getInitials(avatarName, 80, 80, '3b3b3b');
            
            const avatarElements = document.getElementsByClassName('user-avatar');
            Array.from(avatarElements).forEach(element => {
                element.src = result;
            });
        }
    }
}


/**
 * Signs in with an OAuth provider.
 * 
 */
async function oAuth(authProvider, scopes = []) {
    try {
        account.createOAuth2Session(
            authProvider, // provider
            PROJECT_DOMAIN + '?authWith='+authProvider, // success (optional)
            PROJECT_DOMAIN + '/auth/api/error.html', // failure (optional)
            scopes // scopes (optional)
        );

    } catch (error) {
        console.error(`${authProvider} Authentication Error: ${error.message}`);
        showToast({ title: `${authProvider} Authentication Error`, message: error.message});
    }

}

/**
 * Closes the current session.
 */
async function logout() {
    showLoadingToast('logOutToast', {
        loadingHeading: 'Closing Session..',
        loadingMessage: 'Removing the current session.'
    });

    try {
        sessionStorage.clear(); 
        await account.deleteSession('current');
        updateLoadingToast('logOutToast', 'success', { 
            heading: 'Logged Out Successfully',
            message: 'The current session has been closed.'
        });
    } catch (error) {
        //console.error('Logout failed:', error.message); // Some Error Tracking Service for this, maybe PostHog
        updateLoadingToast('logOutToast', 'error', { 
            heading: 'Something Went Wrong',
            message: 'Session could not be closed.'
        });
        throw error;
    } finally {
                // Close the Bootstrap modal with id 'signOutModal'
                const signOutModal = bootstrap.Modal.getInstance(document.getElementById('logOutModal'));
                if (signOutModal) {
                    signOutModal.hide();
                }
                // Wait for x seconds before refreshing the page
                setTimeout(() => {
                    window.location.reload();
                }, 1500);  // 1500 milliseconds = 1.5 seconds
            }
}



/** EMAIL OTP AUTH *//**
 *  OTP Authentication with Email - Simplified Version
 */

let emailAuthOtpField = document.getElementById('authEmailOTP-EmailInput');
if(emailAuthOtpField){
    emailAuthOtpField.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            authAccountEmailOTP();
        }
    });
}

async function authAccountEmailOTP() {
    const email = document.getElementById('authEmailOTP-EmailInput').value;
    document.getElementById('otpEmailPreviewText').innerText = email;

    if (!email) {
        showToast({
            heading: 'Email is required',
            message: 'Please enter a valid email address.',
            iconSrc: '/assets/img/bootstrapped/toast/redError.svg',
            duration: 2000
        });
        document.getElementById('authEmailOTP-EmailInput').focus();
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast({
            heading: 'Invalid Email',
            message: 'Please enter a valid email address.',
            iconSrc: '/assets/img/bootstrapped/toast/redError.svg',
            duration: 2000
        });
        document.getElementById('authEmailOTP-EmailInput').focus();
        return;
    }

    try {
        document.getElementById('emailOtpButton').disabled = true;
        // Send OTP to the email
        const result = await account.createEmailToken(
            Appwrite.ID.unique(),
            email,
            false
        );

        // Hide email input and show OTP input field
        document.getElementById('emailOtpContainer-Email').style.display = 'none';
        document.getElementById('emailOtpContainer-Otp').style.display = 'block';
        document.getElementById('otpInput').focus();

        // Clear any pre-filled input
        const otpInput = document.getElementById('otpInput');
        otpInput.value = '';

        // Add event listener for OTP submission
        otpInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && otpInput.value.length === 6) {
                createSessionFromOTP(result.userId, otpInput.value);
            }
        });
        
        // Add event listener for button click
        document.getElementById('emailOtpConfirmButton').addEventListener('click', () => {
            if (otpInput.value.length === 6) {
                createSessionFromOTP(result.userId, otpInput.value);
            }
        });

    } catch (error) {
        document.getElementById('emailOtpButton').disabled = false;
        console.error('Error sending OTP:', error);
        showToast({
            heading: 'Error',
            message: 'Failed to send OTP. Please try again.',
            iconSrc: '/assets/img/bootstrapped/toast/redError.svg',
            duration: 3000
        });
    }

    // Simplified session creation function
    async function createSessionFromOTP(userID, otpCode) {

        if(!otpCode){
            showToast({
                heading: 'Code is required',
                iconSrc: '/assets/img/bootstrapped/toast/redError.svg',
                duration: 2000
            });
            document.getElementById('otpInput').focus();
            return;
        }
        try {
            const sessionResult = await account.createSession(userID, otpCode);
            console.log('Session created:', sessionResult);

            showToast({
                heading: 'Success',
                message: 'You are now logged in!',
                duration: 2000
            });

            // Hide OTP input field
            document.getElementById('emailOtpContainer-Otp').style.display = 'none';
            checkUser();

        } catch (error) {
            console.error('Error creating session:', error);
            showToast({
                heading: error.message,
                //message: 'Incorrect OTP. Please try again.',
                iconSrc: '/assets/img/bootstrapped/toast/redError.svg',
                duration: 3000
            });

            // Clear OTP input field
            document.getElementById('otpInput').value = '';
        }
    }
}



/** EMAIL PASSWORD AUTH */


// Toggles the display of sign-up and log-in elements based on the 'auth' URL parameter or current display state.
document.addEventListener('DOMContentLoaded', () => {
    toggleAuthDisplay(new URLSearchParams(window.location.search).get('auth'));
});

function toggleAuthDisplay(auth) {
    const signUp = document.getElementById('authPasswordSignUp');
    const logIn = document.getElementById('authPasswordLogIn');
    if (signUp && logIn) {
        [signUp.style.display, logIn.style.display] = auth === 'signup' ? ['block', 'none'] : ['none', 'block'];
    }
}

function switchAuthPasswordType() {
    const signUp = document.getElementById('authPasswordSignUp');
    if (signUp) {
        toggleAuthDisplay(signUp.style.display === 'none' ? 'signup' : 'login');
    }
}

function showAuthPasswordForm() {
    const authPassword = document.getElementById('authPassword');
    const emailAuthSimpleButton = document.getElementById('emailAuthSimpleButton');
    if (authPassword && emailAuthSimpleButton) {
        authPassword.style.display = 'block';
        emailAuthSimpleButton.style.display = 'none';
    }
}

/**
 * Creates an account with email and password.
 * @returns {Promise<void>}
 */
function validateEmailAndShowPassword() {
    const emailInput = document.getElementById('createEmailPassword-EmailInput');
    if (!emailInput) return;

    const email = emailInput.value.trim();

    if (!email) {
        showToast({
            heading: 'Validation Failed',
            message: 'Email is required.',
            duration: 3000
        });
        emailInput.focus();
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast({
            heading: 'Validation Failed',
            message: 'Please enter a valid email address.',
            duration: 3000
        });
        emailInput.focus();
        return;
    }

    const passwordContainer = document.getElementById('createEmailPassword-PasswordContainer');
    if (passwordContainer) {
        passwordContainer.style.display = 'block';
        document.getElementById('createEmailPassword-PasswordInput').focus();
    }
}

async function createEmailPassAuth() {
    const emailInput = document.getElementById('createEmailPassword-EmailInput');
    const passwordInput = document.getElementById('createEmailPassword-PasswordInput');
    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
        showToast({
            heading: 'Validation Failed',
            message: 'Email is required.',
            duration: 3000
        });
        emailInput.focus();
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast({
            heading: 'Validation Failed',
            message: 'Please enter a valid email address.',
            duration: 3000
        });
        emailInput.focus();
        return;
    }

    if (!password) {
        const passwordContainer = document.getElementById('createEmailPassword-PasswordContainer');
        if (passwordContainer) {
            passwordContainer.style.display = 'block';
            passwordInput.focus();
        }
        return;
    }

    showLoadingToast('createAccountEmailPassword', {
        loadingHeading: 'Creating Account..',
        loadingMessage: 'Please wait while we create your account.'
    });

    try {
        const result = await account.create(Appwrite.ID.unique(), email, password);
        console.log(result);

        updateLoadingToast('createAccountEmailPassword', 'success', {
            heading: 'Account Created Successfully',
            message: 'Successfully Signed Up to your account.'
        });

        const sessionResult = await account.createEmailPasswordSession(email, password);
        console.log(sessionResult);
        sendEmailVerificationLink();
        checkUser();
    } catch (error) {
        updateLoadingToast('createAccountEmailPassword', 'error', {
            heading: 'Account Creation Failed',
            message: error.message
        });
    }
}

const emailInput = document.getElementById('createEmailPassword-EmailInput');
if (emailInput) {
    emailInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') validateEmailAndShowPassword();
    });
}

const passwordInput = document.getElementById('createEmailPassword-PasswordInput');
if (passwordInput) {
    passwordInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') createEmailPassAuth();
    });
}

const createEmailPassAuthButton = document.getElementById('createEmailPassAuthButton');
if (createEmailPassAuthButton) {
    createEmailPassAuthButton.addEventListener('click', createEmailPassAuth);
}

///////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', () => {
    toggleAuthDisplay(new URLSearchParams(window.location.search).get('auth'));
});

function toggleAuthDisplay(auth) {
    const signUp = document.getElementById('authPasswordSignUp');
    const logIn = document.getElementById('authPasswordLogIn');
    if (signUp && logIn) {
        [signUp.style.display, logIn.style.display] = auth === 'signup' ? ['block', 'none'] : ['none', 'block'];
    }
}

function switchAuthPasswordType() {
    const signUp = document.getElementById('authPasswordSignUp');
    if (signUp) {
        toggleAuthDisplay(signUp.style.display === 'none' ? 'signup' : 'login');
    }
}

function validateEmailAndShowPasswordForLogin() {
    const emailInput = document.getElementById('authEmailPassword-EmailInput');
    if (!emailInput) return false;

    const email = emailInput.value.trim();

    if (!email) {
        showToast({
            heading: 'Validation Failed',
            message: 'Email is required.',
            duration: 3000
        });
        emailInput.focus();
        return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast({
            heading: 'Validation Failed',
            message: 'Please enter a valid email address.',
            duration: 3000
        });
        emailInput.focus();
        return false;
    }

    const passwordContainer = document.getElementById('authEmailPassword-PasswordContainer');
    if (passwordContainer) {
        passwordContainer.style.display = 'block';
        document.getElementById('authEmailPassword-PasswordInput').focus();
    }
    return true;
}

async function authEmailPassword() {
    const emailInput = document.getElementById('authEmailPassword-EmailInput');
    const passwordInput = document.getElementById('authEmailPassword-PasswordInput');
    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!validateEmailAndShowPasswordForLogin()) {
        return;
    }

    if (!password) {
        const passwordContainer = document.getElementById('authEmailPassword-PasswordContainer');
        if (passwordContainer) {
            passwordContainer.style.display = 'block';
            passwordInput.focus();
        }
        return;
    }

    showLoadingToast('authEmailPasswordToast', {
        loadingHeading: 'Logging In..',
        loadingMessage: 'Please wait while we log you in.'
    });

    try {
        const result = await account.createEmailPasswordSession(email, password);
        console.log(result);

        updateLoadingToast('authEmailPasswordToast', 'success', {
            heading: 'Session Created',
            message: 'Successfully Signed In to your account.'
        });
        checkUser();
    } catch (error) {
        updateLoadingToast('authEmailPasswordToast', 'error', {
            heading: 'Sign In Failed',
            message: error.message
        });
    }
}

const authEmailPasswordEmailInput = document.getElementById('authEmailPassword-EmailInput');
if (authEmailPasswordEmailInput) {
    authEmailPasswordEmailInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') validateEmailAndShowPasswordForLogin();
    });
}

const authEmailPasswordPasswordInput = document.getElementById('authEmailPassword-PasswordInput');
if (authEmailPasswordPasswordInput) {
    authEmailPasswordPasswordInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') authEmailPassword();
    });
}

const authPasswordLogInButton = document.querySelector('#authPasswordLogIn button.btn-primary');
if (authPasswordLogInButton) {
    authPasswordLogInButton.addEventListener('click', authEmailPassword);
}



async function sendEmailVerificationLink() {
    try {
        const result = await account.createVerification(
            PROJECT_DOMAIN + '/auth/api/verify.html' // url
        );
        console.log(result);
        showToast({ heading: 'Verification email sent', message: 'Check your email to verify your account.', duration: 2000 });

    } catch (error) {
        showToast({ heading: 'Verification email failed.', message: error.message, duration: 3000 });
    }
}

// Email Verification using link
if (window.location.pathname.includes('/auth/api/verify')) {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const secret = urlParams.get('secret');

    if (userId && secret) {
        (async () => {
            try {
                const result = await account.updateVerification(userId, secret);
                console.log('Account verified successfully:', result);
                // Handle success (e.g., redirect to a success page or show a success message);
                const emailVerificationTitle = document.getElementById('emailVerificationTitle');
                const emailVerificationBody = document.getElementById('emailVerificationBody');
                if (emailVerificationTitle && emailVerificationBody) {
                    emailVerificationTitle.innerText = 'Account Verified!';
                    emailVerificationBody.innerText = '';
                }
            } catch (error) {
                console.error('Error verifying account:', error);
                const emailVerificationTitle = document.getElementById('emailVerificationTitle');
                const emailVerificationBody = document.getElementById('emailVerificationBody');
                if (emailVerificationTitle && emailVerificationBody) {
                    emailVerificationTitle.innerText = 'Verification Failed!';
                    emailVerificationBody.innerText = error.message;
                }
                // Handle error (e.g., show an error message)
            }
        })();
    } else {
        console.error('Missing userId or secret in the URL');
        const emailVerificationTitle = document.getElementById('emailVerificationTitle');
        const emailVerificationBody = document.getElementById('emailVerificationBody');
        if (emailVerificationTitle && emailVerificationBody) {
            emailVerificationTitle.innerText = 'Verification Failed!';
            emailVerificationBody.innerText = 'Missing userId or secret in the URL';
        }
        // Handle missing parameters (e.g., show an error message or redirect)
    }
}

async function resetPasswordRequest(emailInput) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    try {
        if (!emailInput) return;

        const result = await account.createRecovery(
            emailInput,
            PROJECT_DOMAIN + '/auth/api/reset-password.html'
        );
        console.log(result);
        showToast({ heading: 'Recovery email sent.', message: 'Check your email to reset your password.', iconSrc: '/bootstrapped/toast/greenSuccess.svg', duration: 5500 });
        await delay(1000);

        const resetPasswordModalHeader = document.getElementById('inputRequestTitle');
        const resetPasswordModalParagraph = document.getElementById('inputRequestDescription');
        const resetPasswordModalButton = document.getElementById('inputRequestButton');
        if (resetPasswordModalHeader && resetPasswordModalParagraph && resetPasswordModalButton) {
            resetPasswordModalHeader.innerText = 'Recovery Email Sent';
            resetPasswordModalParagraph.innerText = 'Check your email to reset your password.';
            //emailInput.disabled = true;
            resetPasswordModalButton.disabled = true;
            resetPasswordModalButton.innerText = 'Email Sent';
        }
    } catch (error) {
        showToast({ heading: 'Recovery email failed.', message: error.message, duration: 3000 });
        await delay(4000);
        window.location.href = '/';
    }
}

function confirmPasswordRecovery() {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const secret = urlParams.get('secret');

        if (userId && secret) {
            (async () => {
                try {
                    const passwordInput = document.getElementById('password');
                    if (!passwordInput) return;

                    const result = await account.updateRecovery(
                        userId, // userId
                        secret, // secret
                        passwordInput.value // password
                    );
                    console.log(result);
                    showToast({ heading: 'Password Changed', message: 'Successfully changed the account password', iconSrc: '/assets/img/bootstrapped/toast/greenSuccess.svg', duration: 3000 });
                    // Handle success (e.g., redirect to a success page or show a success message)
                } catch (error) {
                    console.error('Error verifying account:', error);
                    showToast({ heading: 'Password Change Failed', message: error.message, iconSrc: '/assets/img/bootstrapped/toast/redError.svg', duration: 3000 });
                    // Handle error (e.g., show an error message)
                }
            })();
        } else {
            console.error('Missing userId or secret in the URL');
            // Handle missing parameters (e.g., show an error message or redirect)
        }
}








//////////////////////////////////////////////////////////
/**
 * 
 * USER SETTINGS
 * 
 * 
 */




// Email Settings
