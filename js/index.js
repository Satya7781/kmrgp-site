/* ==========================================================================
   APPLICATION LOGIC FOR KSHATRIYA MEWADA RAJPUT PARIVAR - PUBLIC WEBSITE
   ========================================================================== */

// Global State
let currentLang = sessionStorage.getItem('preferredLang') || 'en';
let isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

// Mock Preview Dataset for Homepage Featured Section
const featuredMatches = [
    {
        id: 108,
        name: { en: "Animesh Mewada", hi: "अनिमेष मेवाड़ा" },
        shortName: { en: "Animesh M.", hi: "अनिमेष एम." },
        gender: "Groom",
        gotraSelf: { en: "Sisodiya", hi: "सिसोदिया" },
        gotraMother: { en: "Bordiya", hi: "बोरदिया" },
        age: 21,
        height: "5'11\"",
        education: { en: "B.Com (Computer), DCA, MBA (Pursuing)", hi: "बी.कॉम (कंप्यूटर), डीसीए, एमबीए (प्रगति पर)" },
        profession: { en: "Private Job", hi: "प्राइवेट जॉब" },
        district: { en: "Bhopal", hi: "भोपाल" },
        community: "Mewada",
        verified: true,
        image: "images/animesh.jpeg"
    },
    {
        id: 102,
        name: { en: "Sarvesh Rajput", hi: "सर्वेश राजपूत" },
        shortName: { en: "Sarvesh R.", hi: "सर्वेश आर." },
        gender: "Groom",
        gotraSelf: { en: "Dod", hi: "डोड" },
        gotraMother: { en: "Rathore", hi: "राठौड़" },
        age: 23,
        height: "5'7\"",
        education: { en: "Second Year", hi: "द्वितीय वर्ष" },
        profession: { en: "Bajaj Collection Agent", hi: "बजाज कलेक्शन एजेंट" },
        district: { en: "Bhopal", hi: "भोपाल" },
        community: "Rajput",
        verified: true,
        image: "images/sarvesh.jpeg"
    },
    {
        id: 109,
        name: { en: "Rohit Mewada", hi: "रोहित मेवाड़ा" },
        shortName: { en: "Rohit M.", hi: "रोहित एम." },
        gender: "Groom",
        gotraSelf: { en: "Pathariya", hi: "पथरिया" },
        gotraMother: { en: "Sisodiya", hi: "सिसोदिया" },
        age: 22,
        height: "5'10\"",
        education: { en: "Competitive Exam Aspirant", hi: "प्रतियोगी परीक्षा आकांक्षी" },
        profession: { en: "Student", hi: "छात्र" },
        district: { en: "Bhopal", hi: "भोपाल" },
        community: "Mewada",
        verified: true,
        image: "images/rohit.jpeg"
    }
];

// Initialize Elements on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    // Initialise Lucide icons
    lucide.createIcons();

    // Trigger Count Up Animation for Hero Section Stats
    animateCountValue("count-profiles", 0, 8500, 1500, "+");
    animateCountValue("count-unions", 0, 1200, 1500, "+");
    animateCountValue("count-families", 0, 10000, 1500, "+");

    // Align header items based on login state
    applySessionStateUI();

    // Apply language on load
    applyLanguage(currentLang, false);
});

// ============================================
// SESSION STATE LAYOUT TOGGLING
// ============================================
function applySessionStateUI() {
    isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    const guestActions = document.getElementById("guest-actions");
    const userActions = document.getElementById("user-actions");
    const navDashboard = document.getElementById("nav-dashboard-item");
    const footerDashboard = document.getElementById("footer-dashboard-item");
    
    const mobileGuest = document.getElementById("mobile-guest-actions");
    const mobileUser = document.getElementById("mobile-user-actions");
    const mobileNavDashboard = document.getElementById("mobile-nav-dashboard");

    if (isLoggedIn) {
        if (guestActions) guestActions.style.display = "none";
        if (userActions) userActions.style.display = "flex";
        if (navDashboard) navDashboard.style.display = "block";
        if (footerDashboard) footerDashboard.style.display = "block";

        if (mobileGuest) mobileGuest.style.display = "none";
        if (mobileUser) mobileUser.style.display = "block";
        if (mobileNavDashboard) mobileNavDashboard.style.display = "block";

        // Update header names & avatars dynamically
        const currentUserStr = sessionStorage.getItem('currentUser');
        if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const dispName = currentUser.name[currentLang] || currentUser.name['en'] || "Kunwar Arjun Mewada";
            const dispImage = currentUser.image || "https://picsum.photos/seed/arjun-singh/100/100.jpg";
            
            document.querySelectorAll(".user-chip-avatar").forEach(img => {
                img.src = dispImage;
            });
            document.querySelectorAll(".user-chip-name").forEach(span => {
                span.innerText = dispName;
                span.setAttribute('data-en', currentUser.name['en']);
                span.setAttribute('data-hi', currentUser.name['hi'] || currentUser.name['en']);
            });
        }
    } else {
        if (guestActions) guestActions.style.display = "flex";
        if (userActions) userActions.style.display = "none";
        if (navDashboard) navDashboard.style.display = "none";
        if (footerDashboard) footerDashboard.style.display = "none";

        if (mobileGuest) mobileGuest.style.display = "block";
        if (mobileUser) mobileUser.style.display = "none";
        if (mobileNavDashboard) mobileNavDashboard.style.display = "none";
    }
}

// ============================================
// GLOBAL LANGUAGE TOGGLE ENGINE
// ============================================
function applyLanguage(lang, showToastNotification = true) {
    currentLang = lang;
    sessionStorage.setItem('preferredLang', lang);

    // Toggle active class on header buttons
    const enBtn = document.getElementById("lang-en-btn");
    const hiBtn = document.getElementById("lang-hi-btn");
    if (enBtn && hiBtn) {
        if (lang === 'hi') {
            enBtn.classList.remove("active");
            hiBtn.classList.add("active");
            document.body.classList.add("lang-hi");
        } else {
            hiBtn.classList.remove("active");
            enBtn.classList.add("active");
            document.body.classList.remove("lang-hi");
        }
    }

    // Translate marked static text tags
    document.querySelectorAll('[data-en]').forEach(el => {
        const textEn = el.getAttribute('data-en');
        const textHi = el.getAttribute('data-hi');
        el.innerText = lang === 'hi' ? textHi : textEn;
    });

    // Translate input placeholders
    document.querySelectorAll('[data-placeholder-en]').forEach(el => {
        const placeholderEn = el.getAttribute('data-placeholder-en');
        const placeholderHi = el.getAttribute('data-placeholder-hi');
        el.placeholder = lang === 'hi' ? placeholderHi : placeholderEn;
    });

    // Render/Refresh Featured Matches in the selected language
    renderFeaturedMatches();

    // Trigger toast notification
    if (showToastNotification) {
        const toastMsg = lang === 'hi' ? 'भाषा बदलकर हिंदी कर दी गई है।' : 'Language switched to English.';
        showToast(toastMsg, 'info');
    }
}

function toggleLanguage(lang) {
    applyLanguage(lang, true);
}

// ============================================
// COUNTER ANIMATION
// ============================================
function animateCountValue(id, start, end, duration, suffix = "") {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        obj.innerHTML = currentValue.toLocaleString() + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// ============================================
// MOBILE NAVIGATION DRAWER
// ============================================
function toggleMobileMenu() {
    const drawer = document.getElementById("mobile-drawer");
    if (drawer) {
        drawer.classList.toggle("active");
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';

    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons({ attrs: { class: 'toast-icon' } });

    setTimeout(() => {
        toast.style.animation = 'toast-slide-in 0.3s ease-out reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3200);
}

// ============================================
// POPUP AUTH MODAL ACTIONS (LOGIN & REGISTER)
// ============================================
function openAuthModal(tab = 'login') {
    const modal = document.getElementById("auth-modal");
    if (modal) {
        modal.classList.add("active");
        toggleModalTab(tab);
    }
}

function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) {
        modal.classList.remove("active");
    }
}

function toggleModalTab(tab) {
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const formLogin = document.getElementById("form-login-content");
    const formRegister = document.getElementById("form-register-content");

    if (tab === 'login') {
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        formLogin.style.display = "flex";
        formRegister.style.display = "none";
    } else {
        tabRegister.classList.add("active");
        tabLogin.classList.remove("active");
        formRegister.style.display = "flex";
        formLogin.style.display = "none";
    }
}

// Submit mock auth handlers
let registerPhotoData = "";

function handleRegisterPhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        registerPhotoData = e.target.result;
        const preview = document.getElementById("register-photo-preview");
        if (preview) {
            preview.src = registerPhotoData;
            preview.style.display = "block";
        }
    };
    reader.readAsDataURL(file);
}

function submitMockLogin() {
    const number = document.getElementById("login-phone").value.trim();
    const pass = document.getElementById("login-password").value.trim();
    
    if (!number) {
        showToast(currentLang === 'hi' ? 'कृपया मोबाइल नंबर दर्ज करें।' : 'Please enter your mobile number.', 'error');
        return;
    }

    showToast(currentLang === 'hi' ? 'क्रेडेंशियल सत्यापित हो रहे हैं...' : 'Verifying family credentials...', 'info');

    fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phone: number,
            password: pass
        })
    })
    .then(res => {
        if (res.status === 200) {
            return res.json();
        } else {
            return res.json().then(err => { throw new Error(err.message || 'Login failed'); });
        }
    })
    .then(data => {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('token', data.access_token);
        sessionStorage.setItem('refresh_token', data.refresh_token);
        sessionStorage.setItem('role', data.role);
        sessionStorage.setItem('username', data.username);
        
        return fetch('/api/profile/me', {
            headers: { 'Authorization': 'Bearer ' + data.access_token }
        });
    })
    .then(res => {
        if (res && res.status === 200) {
            return res.json();
        } else if (res) {
            return res.json().then(err => { throw new Error(err.message || 'Failed to load profile'); });
        }
    })
    .then(profile => {
        if (profile) {
            const userObj = {
                name: { en: profile.username, hi: profile.username },
                shortName: { en: profile.username.split(" ")[0], hi: profile.username.split(" ")[0] },
                phone: profile.phone,
                gender: profile.type === 'BRIDE' ? 'Bride' : 'Groom',
                dob: { en: profile.dob || "-", hi: profile.dob || "-" },
                district: { en: profile.district || "Bhopal", hi: profile.district || "भोपाल" },
                gotraSelf: { en: profile.gotra_self || "-", hi: profile.gotra_self || "-" },
                gotraMother: { en: profile.gotra_mother || "-", hi: profile.gotra_mother || "-" },
                education: { en: profile.education || "-", hi: profile.education || "-" },
                profession: { en: profile.profession || "-", hi: profile.profession || "-" },
                address: { en: profile.address || "-", hi: profile.address || "-" },
                fatherName: { en: profile.father_name || "-", hi: profile.father_name || "-" },
                motherName: { en: profile.mother_name || "-", hi: profile.mother_name || "-" },
                image: profile.image_url || "",
                approval_status: profile.approval_status,
                is_approved: profile.visible,
                role: sessionStorage.getItem('role')
            };
            sessionStorage.setItem('currentUser', JSON.stringify(userObj));
        }

        closeAuthModal();
        applySessionStateUI();
        
        showToast(currentLang === 'hi' ? 'सत्यापन सफल! प्रवेश किया जा रहा है...' : 'Verification successful! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);
    })
    .catch(err => {
        showToast(err.message, 'error');
    });
}

function submitMockRegister() {
    const name = document.getElementById("register-name").value.trim();
    const phone = document.getElementById("register-phone").value.trim();
    const password = document.getElementById("register-password").value.trim();
    const gotraSelf = document.getElementById("register-gotra-self").value.trim();
    const gotraMother = document.getElementById("register-gotra-mother").value.trim();
    const gender = document.getElementById("register-gender").value;
    const dob = document.getElementById("register-dob").value;
    const district = document.getElementById("register-district").value;
    const education = document.getElementById("register-education").value.trim();
    const profession = document.getElementById("register-profession").value.trim();

    if (!name || !phone || !password || !gotraSelf) {
        showToast(currentLang === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड (नाम, फोन, पासवर्ड, स्वयं गोत्र) भरें।' : 'Please fill all required fields (Name, Phone, Password, Self Gotra).', 'error');
        return;
    }
    if (phone.length < 10) {
        showToast(currentLang === 'hi' ? 'कृपया एक वैध १०-अंकीय मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.', 'error');
        return;
    }
    if (password.length < 6) {
        showToast(currentLang === 'hi' ? 'पासवर्ड कम से कम ६ अंकों का होना चाहिए।' : 'Password must be at least 6 characters.', 'error');
        return;
    }

    showToast(currentLang === 'hi' ? 'खाता बनाया जा रहा है...' : 'Creating account...', 'info');

    fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: name,
            phone: phone,
            password: password,
            profile_type: gender === 'Bride' ? 'BRIDE' : 'GROOM',
            gotra_self: gotraSelf,
            gotra_mother: gotraMother,
            dob: dob,
            district: district,
            education: education,
            profession: profession,
            photo_base64: registerPhotoData || ""
        })
    })
    .then(res => {
        if (res.status === 201) {
            return res.json();
        } else {
            return res.json().then(err => { throw new Error(err.message || 'Registration failed'); });
        }
    })
    .then(data => {
        showToast(currentLang === 'hi' ? 'सफलतापूर्वक पंजीकृत! अपने क्रेडेंशियल के साथ लॉगिन करें।' : 'Registered successfully! Please login with your credentials.', 'success');
        
        // Autofill login phone
        const loginPhoneInput = document.getElementById("login-phone");
        if (loginPhoneInput) {
            loginPhoneInput.value = phone;
        }
        
        setTimeout(() => {
            toggleModalTab('login');
        }, 1000);
    })
    .catch(err => {
        showToast(err.message, 'error');
    });
}

function handleLogout() {
    sessionStorage.removeItem('isLoggedIn');
    applySessionStateUI();
    renderFeaturedMatches();
    showToast(currentLang === 'hi' ? 'लॉग आउट किया गया।' : 'Logged out successfully.', 'info');
}

// ============================================
// DYNAMIC FEATURED MATCHES RENDERER
// ============================================
function renderFeaturedMatches() {
    const container = document.getElementById("featured-profiles-grid");
    if (!container) return;

    let html = "";
    featuredMatches.forEach(profile => {
        // Resolve display values based on session status (redacted for guests)
        const nameVal = isLoggedIn 
            ? (profile.name[currentLang] || profile.name['en'])
            : (profile.shortName[currentLang] || profile.shortName['en']);

        const gotraSelfVal = isLoggedIn
            ? (profile.gotraSelf[currentLang] || profile.gotraSelf['en'])
            : (currentLang === 'hi' ? '🔒 सत्यापित' : '🔒 Verified');

        const gotraMotherVal = isLoggedIn
            ? (profile.gotraMother[currentLang] || profile.gotraMother['en'])
            : (currentLang === 'hi' ? '🔒 सत्यापित' : '🔒 Verified');

        const eduVal = profile.education[currentLang] || profile.education['en'];
        const distVal = profile.district[currentLang] || profile.district['en'];

        // Labels
        const ageLabel = currentLang === 'hi' ? 'आयु' : 'Age';
        const heightLabel = currentLang === 'hi' ? 'ऊंचाई' : 'Height';
        const gotraSelfLabel = currentLang === 'hi' ? 'गोत्र (स्वयं)' : 'Gotra (Self)';
        const gotraMotherLabel = currentLang === 'hi' ? 'गोत्र (माता)' : 'Gotra (Mother)';
        const eduLabel = currentLang === 'hi' ? 'शिक्षा' : 'Education';
        const distLabel = currentLang === 'hi' ? 'जिला' : 'District';

        // CTA Label
        const ctaText = isLoggedIn
            ? (currentLang === 'hi' ? 'रुचि भेजें' : 'Send Interest')
            : (currentLang === 'hi' ? 'विवरण अनलॉक करें' : 'Unlock Details');

        // Privacy Warning Subtext for guest view
        const subtext = isLoggedIn 
            ? "" 
            : `<p style="font-size: 11px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 12px; text-align: center; font-style: italic;">
                 ${currentLang === 'hi' ? '🔒 गोत्र और परिवार विवरण छिपे हैं।' : '🔒 Gotra & family charts are hidden.'}
               </p>`;

        // Click actions
        const clickAction = isLoggedIn
            ? `handleSendInterestFeatured(this, ${profile.id}, '${nameVal}')`
            : `openAuthModal('login')`;

        html += `
            <div class="profile-card">
                <div class="profile-image-container">
                    <img src="${profile.image}" class="profile-image" alt="${nameVal}">
                    <div class="profile-badge">${currentLang === 'hi' ? (profile.gender === 'Bride' ? 'वधू (लड़की)' : 'वर (लड़का)') : profile.gender}</div>
                    ${profile.verified ? `<div class="profile-verified-badge"><i data-lucide="shield-check" style="width: 16px; height: 16px;"></i><span>${currentLang === 'hi' ? 'सत्यापित' : 'Verified'}</span></div>` : ''}
                </div>
                <div class="profile-info">
                    <h3 class="profile-name">${nameVal}</h3>
                    <table class="profile-details-table">
                        <tr>
                            <td class="label-td">${ageLabel} / ${heightLabel}</td>
                            <td class="val-td">${profile.age} yrs, ${profile.height}</td>
                        </tr>
                        <tr>
                            <td class="label-td">${gotraSelfLabel}</td>
                            <td class="val-td" style="color: ${isLoggedIn ? 'var(--color-text-dark)' : 'var(--color-saffron)'};">${gotraSelfVal}</td>
                        </tr>
                        <tr>
                            <td class="label-td">${gotraMotherLabel}</td>
                            <td class="val-td" style="color: ${isLoggedIn ? 'var(--color-text-dark)' : 'var(--color-saffron)'};">${gotraMotherVal}</td>
                        </tr>
                        <tr>
                            <td class="label-td">${eduLabel}</td>
                            <td class="val-td">${eduVal}</td>
                        </tr>
                        <tr>
                            <td class="label-td">${distLabel}</td>
                            <td class="val-td">${distVal}</td>
                        </tr>
                    </table>
                    ${subtext}
                    <button class="btn-large btn-primary ${isLoggedIn ? 'pulse-interest' : ''}" style="width: 100%;" onclick="${clickAction}">
                        <i data-lucide="${isLoggedIn ? 'heart' : 'lock'}"></i>
                        <span>${ctaText}</span>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    lucide.createIcons();
}

function handleSendInterestFeatured(btn, profileId, name) {
    if (btn.classList.contains("btn-secondary")) return;

    btn.className = "btn-large btn-secondary";
    btn.classList.remove("pulse-interest");
    btn.innerHTML = `<i data-lucide="check"></i> <span>${currentLang === 'hi' ? 'रुचि भेजी गई ✓' : 'Interest Sent ✓'}</span>`;
    lucide.createIcons();

    // Increment interests received locally in sessionStorage for dashboard
    let received = parseInt(sessionStorage.getItem('interestsCount')) || 28;
    sessionStorage.setItem('interestsCount', received + 1);

    const msg = currentLang === 'hi' 
        ? `${name} के परिवार को विवाह संबंध की रुचि भेजी गई।` 
        : `Marriage interest request sent to the family of ${name}.`;
    showToast(msg, 'success');
}
