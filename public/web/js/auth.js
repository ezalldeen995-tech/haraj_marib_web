/**
 * Haraj-Maareb - Authentication Logic (auth.js)
 * ================================================
 * Handles Login, Register (multi-step with OTP), and Password Reset flows.
 * API endpoints are documented in auth.md.
 *
 * Dependencies: app.js must be loaded before this file.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // LOGIN PAGE HANDLER
    // See auth.md - Section 2: POST /login
    // ============================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            UI.clearAlert('alertContainer');

            const phone = document.getElementById('loginPhone').value.trim();
            const password = document.getElementById('loginPassword').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // Basic validation
            if (!phone || !password) {
                UI.showAlert('alertContainer', 'يرجى إدخال رقم الجوال وكلمة المرور.', 'danger');
                return;
            }

            UI.toggleBtnLoading(submitBtn, true);

            // POST /login - auth.md Section 2
            const result = await API.post('/login', { phone, password });

            UI.toggleBtnLoading(submitBtn, false);

            if (result.success && result.data && result.data.token) {
                // Save token and redirect to homepage
                AUTH.saveSession(result.data.token);
                UI.showAlert('alertContainer', 'تم تسجيل الدخول بنجاح! جاري التحويل...', 'success');
                setTimeout(() => {
                    window.location.href = '/web/index.html';
                }, 1000);
            } else {
                // Show error - auth.md Section 2 (Error 401)
                const msg = getErrorMessage(result.message);
                UI.showAlert('alertContainer', msg, 'danger');
            }
        });
    }

    // ============================================
    // REGISTER PAGE HANDLER (Multi-Step with OTP)
    // See auth.md - Section 1: POST /register
    //              Section 4: POST /otp/verify
    // ============================================
    const registerForm = document.getElementById('registerForm');
    const otpForm = document.getElementById('otpForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            UI.clearAlert('alertContainer');

            const name = document.getElementById('regName').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const password = document.getElementById('regPassword').value;
            const password_confirmation = document.getElementById('regPasswordConfirm').value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            // Validation
            if (!name || !phone || !password || !password_confirmation) {
                UI.showAlert('alertContainer', 'يرجى تعبئة جميع الحقول المطلوبة.', 'danger');
                return;
            }

            if (password !== password_confirmation) {
                UI.showAlert('alertContainer', 'كلمة المرور وتأكيدها غير متطابقين.', 'danger');
                return;
            }

            if (password.length < 6) {
                UI.showAlert('alertContainer', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.', 'danger');
                return;
            }

            UI.toggleBtnLoading(submitBtn, true);

            // POST /register - auth.md Section 1
            const result = await API.post('/register', { name, phone, password, password_confirmation });

            UI.toggleBtnLoading(submitBtn, false);

            if (result.success) {
                // Save token from registration
                if (result.data && result.data.token) {
                    AUTH.saveSession(result.data.token);
                }

                // Store phone for OTP step
                sessionStorage.setItem('otpPhone', phone);

                // Move to Step 2 (OTP Verification)
                goToStep(2);
                UI.showAlert('alertContainer', getErrorMessage('otp_sent'), 'success');
                
                // For local development testing
                if (result.data && result.data.otp_code) {
                    alert(`Your verification code is: ${result.data.otp_code}`);
                }
            } else {
                // Handle validation errors
                if (result.errors) {
                    const firstError = Object.values(result.errors)[0];
                    UI.showAlert('alertContainer', Array.isArray(firstError) ? firstError[0] : firstError, 'danger');
                } else {
                    UI.showAlert('alertContainer', getErrorMessage(result.message), 'danger');
                }
            }
        });
    }

    // OTP Verification Form
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            UI.clearAlert('alertContainer');

            const phone = sessionStorage.getItem('otpPhone');
            const code = document.getElementById('otpCode').value.trim();
            const submitBtn = otpForm.querySelector('button[type="submit"]');

            if (!code) {
                UI.showAlert('alertContainer', 'يرجى إدخال كود التفعيل.', 'danger');
                return;
            }

            UI.toggleBtnLoading(submitBtn, true);

            // POST /otp/verify - auth.md Section 4
            const result = await API.post('/otp/verify', { phone, code });

            UI.toggleBtnLoading(submitBtn, false);

            if (result.success) {
                UI.showAlert('alertContainer', getErrorMessage('phone_verified'), 'success');
                setTimeout(() => {
                    window.location.href = '/web/index.html';
                }, 1500);
            } else {
                UI.showAlert('alertContainer', 'كود التفعيل غير صحيح. حاول مرة أخرى.', 'danger');
            }
        });

        // Resend OTP button
        const resendBtn = document.getElementById('resendOtp');
        if (resendBtn) {
            resendBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const phone = sessionStorage.getItem('otpPhone');
                if (!phone) return;

                // POST /otp/request - auth.md Section 3
                const result = await API.post('/otp/request', { phone });

                if (result.success) {
                    UI.showAlert('alertContainer', getErrorMessage('otp_sent'), 'success');
                    // Disable resend for 60 seconds
                    startResendCountdown(resendBtn);

                    // For local development testing
                    if (result.data && result.data.otp_code) {
                        alert(`Your verification code is: ${result.data.otp_code}`);
                    }
                } else {
                    UI.showAlert('alertContainer', getErrorMessage(result.message), 'danger');
                }
            });
        }
    }

    // ============================================
    // FORGOT PASSWORD HANDLER
    // See auth.md - Section 5: POST /password/forgot
    //              Section 6: POST /password/reset
    // ============================================
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            UI.clearAlert('alertContainer');

            const phone = document.getElementById('forgotPhone').value.trim();
            const submitBtn = forgotForm.querySelector('button[type="submit"]');

            if (!phone) {
                UI.showAlert('alertContainer', 'يرجى إدخال رقم الجوال.', 'danger');
                return;
            }

            UI.toggleBtnLoading(submitBtn, true);

            // POST /password/forgot - auth.md Section 5
            const result = await API.post('/password/forgot', { phone });

            UI.toggleBtnLoading(submitBtn, false);

            if (result.success) {
                sessionStorage.setItem('resetPhone', phone);
                UI.showAlert('alertContainer', getErrorMessage('otp_sent'), 'success');
                // Show reset form
                if (document.getElementById('forgotStep')) {
                    document.getElementById('forgotStep').style.display = 'none';
                }
                if (document.getElementById('resetStep')) {
                    document.getElementById('resetStep').style.display = 'block';
                }

                // For local development testing
                if (result.data && result.data.otp_code) {
                    alert(`Your verification code is: ${result.data.otp_code}`);
                }
            } else {
                UI.showAlert('alertContainer', getErrorMessage(result.message), 'danger');
            }
        });
    }

    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            UI.clearAlert('alertContainer');

            const phone = sessionStorage.getItem('resetPhone');
            const otp = document.getElementById('resetOtp').value.trim();
            const new_password = document.getElementById('resetPassword').value;
            const new_password_confirmation = document.getElementById('resetPasswordConfirm').value;
            const submitBtn = resetForm.querySelector('button[type="submit"]');

            if (!otp || !new_password || !new_password_confirmation) {
                UI.showAlert('alertContainer', 'يرجى تعبئة جميع الحقول.', 'danger');
                return;
            }

            if (new_password !== new_password_confirmation) {
                UI.showAlert('alertContainer', 'كلمتا المرور غير متطابقتين.', 'danger');
                return;
            }

            UI.toggleBtnLoading(submitBtn, true);

            // POST /password/reset - auth.md Section 6
            const result = await API.post('/password/reset', {
                phone, otp, new_password, new_password_confirmation
            });

            UI.toggleBtnLoading(submitBtn, false);

            if (result.success) {
                UI.showAlert('alertContainer', getErrorMessage('password_reset_success'), 'success');
                setTimeout(() => {
                    window.location.href = '/web/login.html';
                }, 2000);
            } else {
                UI.showAlert('alertContainer', getErrorMessage(result.message), 'danger');
            }
        });
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Switch to a specific registration step.
 * @param {number} step - Step number (1 or 2)
 */
function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.reg-step').forEach(el => {
        el.style.display = 'none';
    });

    // Show target step
    const targetStep = document.getElementById(`step${step}`);
    if (targetStep) {
        targetStep.style.display = 'block';
    }

    // Update progress indicators
    document.querySelectorAll('.step-progress .step').forEach((el, index) => {
        el.classList.remove('active', 'done');
        if (index + 1 < step) {
            el.classList.add('done');
        } else if (index + 1 === step) {
            el.classList.add('active');
        }
    });

    document.querySelectorAll('.step-progress .step-line').forEach((el, index) => {
        el.classList.toggle('active', index + 1 < step);
    });
}

/**
 * Start a countdown timer for the resend OTP button.
 * @param {HTMLElement} btn - The resend button element
 */
function startResendCountdown(btn) {
    let seconds = 60;
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.5';

    const interval = setInterval(() => {
        seconds--;
        btn.textContent = `إعادة الإرسال (${seconds})`;

        if (seconds <= 0) {
            clearInterval(interval);
            btn.textContent = 'إعادة إرسال الكود';
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
        }
    }, 1000);
}
