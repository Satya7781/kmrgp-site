/* ==========================================================================
   APPLICATION LOGIC FOR KSHATRIYA MEWADA RAJPUT PARIVAR - USER DASHBOARD
   ========================================================================== */

// Global State
let currentLang = sessionStorage.getItem('preferredLang') || 'en';
let isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
let pendingRequests = [];

// Mock Interests Dataset
const mockInterests = [
    {
        id: 1,
        name: { en: "Baisa Priya Singh", hi: "बाइसा प्रिया सिंह" },
        age: 23,
        gotraSelf: { en: "Rathore", hi: "राठौड़" },
        gotraMother: { en: "Sehore", hi: "सीहोर" },
        district: { en: "Indore", hi: "इंदौर" },
        image: "https://picsum.photos/seed/priya/100/100.jpg"
    },
    {
        id: 2,
        name: { en: "Baisa Meera Mewada", hi: "बाइसा मीरा मेवाड़ा" },
        age: 22,
        gotraSelf: { en: "Sisodiya", hi: "सिसोदिया" },
        gotraMother: { en: "Dod", hi: "डोड" },
        district: { en: "Bhopal", hi: "भोपाल" },
        image: "https://picsum.photos/seed/meera/100/100.jpg"
    },
    {
        id: 3,
        name: { en: "Baisa Pooja Rajput", hi: "बाइसा पूजा राजपूत" },
        age: 24,
        gotraSelf: { en: "Chouhan", hi: "चौहान" },
        gotraMother: { en: "Parmar", hi: "परमार" },
        district: { en: "Rajgarh", hi: "राजगढ़" },
        image: "https://picsum.photos/seed/pooja/100/100.jpg"
    }
];

// Initial Load Handler
document.addEventListener("DOMContentLoaded", () => {
    // 1. Session Auth Guard check
    if (!isLoggedIn) {
        const guard = document.getElementById("guard-overlay");
        if (guard) {
            guard.style.display = "flex";
        }
        return; // Prevent running other animations / scripts if blocked
    }

    // 2. Initialise Lucide Icons
    lucide.createIcons();

    // 3. Routing based on role
    const role = sessionStorage.getItem('role');
    if (role === 'ADMIN') {
        initAdminPanel();
    } else if (role === 'SUPER_ADMIN') {
        initSuperAdminPanel();
    } else {
        initUserPanel();
    }

    // 4. Apply language settings
    applyLanguage(currentLang, false);
});

// ============================================
// PANEL INITIALIZERS & ROUTERS
// ============================================
function initUserPanel() {
    const userPanel = document.getElementById("user-panel");
    const adminPanel = document.getElementById("admin-panel");
    const superadminPanel = document.getElementById("superadmin-panel");

    if (userPanel) userPanel.style.display = "block";
    if (adminPanel) adminPanel.style.display = "none";
    if (superadminPanel) superadminPanel.style.display = "none";

    let interestsCountVal = parseInt(sessionStorage.getItem('interestsCount')) || 28;
    const countValElement = document.getElementById("interests-count-val");
    if (countValElement) {
        countValElement.innerText = interestsCountVal;
    }

    fetchUserProfile();
    renderInterests();
    initDragAndDrop();
}

function fetchUserProfile() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    fetch('/api/profile/me', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => {
        if (res.status === 200) {
            return res.json();
        } else if (res.status === 401) {
            sessionStorage.clear();
            window.location.href = "index.html";
            throw new Error("Session expired");
        } else {
            throw new Error("Failed to fetch profile");
        }
    })
    .then(profile => {
        // Save to sessionStorage
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

        // Populate Form & Update Preview
        populateFormFromSession();
        updateBioDataPreview();
        updateStatusBanner(profile.approval_status, profile.visible);
    })
    .catch(err => {
        console.error(err);
    });
}

function updateStatusBanner(status, is_approved) {
    const banner = document.getElementById("profile-status-banner");
    const icon = document.getElementById("status-icon");
    const text = document.getElementById("status-text");
    const btn = document.getElementById("request-approval-btn");

    if (!banner) return;

    // Reset status fields
    banner.style.background = "var(--color-white)";
    banner.style.borderColor = "var(--color-gold-light)";
    btn.style.display = "none";
    icon.style.color = "var(--color-gold)";
    icon.setAttribute('data-lucide', 'info');

    // Disable profile edit inputs if approved or pending
    const disableInputs = (disable) => {
        const inputs = [
            "bio-fullname", "bio-dob", "bio-height", "bio-gender", "bio-district", 
            "bio-gotra-self", "bio-gotra-mother", "bio-education", "bio-profession", 
            "bio-village", "bio-contact"
        ];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = disable;
        });
        // Disable save button too
        const saveBtn = document.querySelector('button[onclick="saveProfileChanges()"]');
        if (saveBtn) saveBtn.disabled = disable;
        const uploadZone = document.getElementById("dashboard-photo-zone");
        if (uploadZone) {
            if (disable) {
                uploadZone.style.pointerEvents = "none";
                uploadZone.style.opacity = "0.6";
            } else {
                uploadZone.style.pointerEvents = "auto";
                uploadZone.style.opacity = "1";
            }
        }
    };

    const role = sessionStorage.getItem('role');
    const isAdminOrSuperAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    if (isAdminOrSuperAdmin) {
        banner.style.background = "#e6f4ea"; // light green
        banner.style.borderColor = "#34a853";
        icon.style.color = "#34a853";
        icon.setAttribute('data-lucide', 'shield-check');
        text.innerText = currentLang === 'hi' ? 'प्रशासक खाता (प्रोफ़ाइल सेटिंग्स सक्रिय)' : '✓ Administrator Account (Profile Settings Active)';
        disableInputs(false);
    } else if (is_approved || status === 'APPROVED') {
        banner.style.background = "#e6f4ea"; // light green
        banner.style.borderColor = "#34a853";
        icon.style.color = "#34a853";
        icon.setAttribute('data-lucide', 'shield-check');
        text.innerText = currentLang === 'hi' ? 'सत्यापित प्रोफ़ाइल (विवरण लॉक हैं)' : '✓ Profile Verified & Active (Details Locked)';
        disableInputs(true);
    } else if (status === 'PENDING') {
        banner.style.background = "#fef7e0"; // light yellow
        banner.style.borderColor = "#fbbc05";
        icon.style.color = "#fbbc05";
        icon.setAttribute('data-lucide', 'clock');
        text.innerText = currentLang === 'hi' ? 'सत्यापन लंबित (प्रशासक समीक्षा की प्रतीक्षा है)' : 'Verification Pending (Awaiting Admin Review)';
        disableInputs(true);
    } else if (status === 'REJECTED') {
        banner.style.background = "#fce8e6"; // light red
        banner.style.borderColor = "#ea4335";
        icon.style.color = "#ea4335";
        icon.setAttribute('data-lucide', 'alert-triangle');
        text.innerText = currentLang === 'hi' ? 'प्रोफ़ाइल अस्वीकृत (कृपया विवरण सुधारें और पुनः भेजें)' : 'Profile Rejected (Please correct details & re-submit)';
        btn.style.display = "block";
        disableInputs(false);
    } else { // 'SENT' or draft state
        banner.style.background = "var(--color-cream)";
        banner.style.borderColor = "var(--color-gold)";
        icon.style.color = "var(--color-gold)";
        icon.setAttribute('data-lucide', 'edit');
        text.innerText = currentLang === 'hi' ? 'प्रारूप प्रोफ़ाइल (सत्यापन के लिए भेजें)' : 'Profile Draft (Submit for Admin Verification)';
        btn.style.display = "block";
        disableInputs(false);
    }

    lucide.createIcons();
}

function requestApprovalFromAdmin() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    showToast(currentLang === 'hi' ? 'सत्यापन अनुरोध भेजा जा रहा है...' : 'Submitting verification request...', 'info');

    fetch('/api/profile/request_approval', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
    .then(res => {
        if (res.status === 200) {
            return res.json();
        } else {
            return res.json().then(err => { throw new Error(err.message || 'Failed to submit request'); });
        }
    })
    .then(data => {
        showToast(currentLang === 'hi' ? 'अनुरोध सफलतापूर्वक भेजा गया!' : 'Request submitted successfully!', 'success');
        fetchUserProfile(); // Reload profile details
    })
    .catch(err => {
        showToast(err.message, 'error');
    });
}

// ============================================
// PROFILE FORM & BIO-DATA PREVIEWER
// ============================================
function populateFormFromSession() {
    const currentUserStr = sessionStorage.getItem('currentUser');
    if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        
        const getVal = (field) => {
            if (!field) return "";
            if (typeof field === 'object') {
                return field[currentLang] || field['en'] || "";
            }
            return field;
        };

        if (document.getElementById("bio-fullname")) {
            document.getElementById("bio-fullname").value = getVal(currentUser.name);
        }
        if (document.getElementById("bio-dob")) {
            let dobVal = currentUser.dob;
            if (dobVal && typeof dobVal === 'object') {
                dobVal = dobVal.en;
            }
            document.getElementById("bio-dob").value = dobVal || "";
        }
        if (document.getElementById("bio-height") && currentUser.height) {
            document.getElementById("bio-height").value = currentUser.height;
        }
        if (document.getElementById("bio-gender") && currentUser.gender) {
            document.getElementById("bio-gender").value = currentUser.gender;
        }
        if (document.getElementById("bio-district") && currentUser.district) {
            document.getElementById("bio-district").value = getVal(currentUser.district);
        }
        if (document.getElementById("bio-gotra-self") && currentUser.gotraSelf) {
            document.getElementById("bio-gotra-self").value = getVal(currentUser.gotraSelf);
        }
        if (document.getElementById("bio-gotra-mother") && currentUser.gotraMother) {
            document.getElementById("bio-gotra-mother").value = getVal(currentUser.gotraMother);
        }
        if (document.getElementById("bio-education") && currentUser.education) {
            document.getElementById("bio-education").value = getVal(currentUser.education);
        }
        if (document.getElementById("bio-profession") && currentUser.profession) {
            document.getElementById("bio-profession").value = getVal(currentUser.profession);
        }
        if (document.getElementById("bio-village")) {
            const villageVal = currentUser.address ? getVal(currentUser.address) : (currentUser.village || "");
            document.getElementById("bio-village").value = villageVal;
        }
        if (document.getElementById("bio-contact")) {
            document.getElementById("bio-contact").value = currentUser.phone || currentUser.contact || "";
        }
        
        // Sync header name & avatar
        const dispName = getVal(currentUser.name);
        const dispImage = currentUser.image || "https://picsum.photos/seed/arjun-singh/100/100.jpg";
        
        document.querySelectorAll(".user-chip-avatar").forEach(img => {
            img.src = dispImage;
        });
        document.querySelectorAll(".user-chip-name").forEach(span => {
            span.innerText = dispName;
            span.setAttribute('data-en', currentUser.name['en'] || dispName);
            span.setAttribute('data-hi', currentUser.name['hi'] || dispName);
        });
        
        const previewAvatar = document.getElementById("preview-avatar");
        if (previewAvatar && currentUser.image) {
            previewAvatar.src = currentUser.image;
        }
    }
}

function updateBioDataPreview() {
    if (!isLoggedIn) return;

    // Collect Inputs
    const fullName = document.getElementById("bio-fullname").value || "Kunwar Arjun Mewada";
    const dob = document.getElementById("bio-dob").value;
    const height = document.getElementById("bio-height").value;
    const gotraSelf = document.getElementById("bio-gotra-self").value || "Mewada";
    const gotraMother = document.getElementById("bio-gotra-mother").value || "Rathore";
    const education = document.getElementById("bio-education").value || "B.Tech Computer Science";
    const profession = document.getElementById("bio-profession").value || "Software Engineer";
    const village = document.getElementById("bio-village").value || "Gogunda, Udaipur";
    const contact = document.getElementById("bio-contact").value || "+91 98765 43210";

    // Format Date of Birth nicely
    let formattedDob = dob;
    if (dob) {
        const dateObj = new Date(dob);
        if (!isNaN(dateObj.getTime())) {
            const day = dateObj.getDate();
            const year = dateObj.getFullYear();
            
            const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthsHi = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];
            
            const monthText = currentLang === 'hi' ? monthsHi[dateObj.getMonth()] : monthsEn[dateObj.getMonth()];
            formattedDob = `${day} ${monthText} ${year}`;
        }
    } else {
        formattedDob = currentLang === 'hi' ? "12 अप्रैल 1999" : "12 April 1999";
    }

    // Update preview card text nodes
    document.getElementById("prev-name").innerText = fullName;
    document.getElementById("prev-dob").innerText = formattedDob;
    document.getElementById("prev-height").innerText = height;
    document.getElementById("prev-gotra-self").innerText = gotraSelf;
    document.getElementById("prev-gotra-mother").innerText = gotraMother;
    document.getElementById("prev-education").innerText = education;
    document.getElementById("prev-profession").innerText = profession;
    document.getElementById("prev-village").innerText = village;
    document.getElementById("prev-contact").innerText = contact;

    // Check gender/image
    const previewAvatar = document.getElementById("preview-avatar");
    if (previewAvatar) {
        const currentUserStr = sessionStorage.getItem('currentUser');
        if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            if (currentUser.image) {
                previewAvatar.src = currentUser.image;
                return;
            }
        }
        if (fullName.includes("Baisa") || fullName.includes("Priya") || fullName.includes("Sunita") || fullName.includes("Meera")) {
            previewAvatar.src = "https://picsum.photos/seed/bride-avatar/200/200.jpg";
        } else {
            previewAvatar.src = "https://picsum.photos/seed/arjun-singh/200/200.jpg";
        }
    }
}

function saveProfileChanges() {
    if (!isLoggedIn) return;
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const fullName = document.getElementById("bio-fullname").value.trim();
    const dob = document.getElementById("bio-dob").value;
    const height = document.getElementById("bio-height").value;
    const gender = document.getElementById("bio-gender").value;
    const district = document.getElementById("bio-district").value;
    const gotraSelf = document.getElementById("bio-gotra-self").value.trim();
    const gotraMother = document.getElementById("bio-gotra-mother").value.trim();
    const education = document.getElementById("bio-education").value.trim();
    const profession = document.getElementById("bio-profession").value.trim();
    const village = document.getElementById("bio-village").value.trim();
    const contact = document.getElementById("bio-contact").value.trim();

    if (!fullName || !gotraSelf) {
        showToast(currentLang === 'hi' ? 'कृपया नाम और स्वयं गोत्र भरें।' : 'Please fill Name and Self Gotra.', 'error');
        return;
    }

    showToast(currentLang === 'hi' ? 'परिवर्तन सहेजे जा रहे हैं...' : 'Saving profile details...', 'info');

    fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            username: fullName,
            dob: dob,
            height: height,
            type: gender === 'Bride' ? 'BRIDE' : 'GROOM',
            district: district,
            gotra_self: gotraSelf,
            gotra_mother: gotraMother,
            education: education,
            profession: profession,
            address: village,
            contact: contact
        })
    })
    .then(res => {
        if (res.status === 200) {
            return res.json();
        } else {
            return res.json().then(err => { throw new Error(err.message || 'Failed to save profile changes'); });
        }
    })
    .then(data => {
        showToast(currentLang === 'hi' ? 'परिवर्तन सफलतापूर्वक सहेजे गए!' : 'Profile details saved successfully!', 'success');
        fetchUserProfile(); // Reload profile details
    })
    .catch(err => {
        showToast(err.message, 'error');
    });
}

function printBioData() {
    showToast(currentLang === 'hi' ? 'बायो-डेटा प्रिंट संवाद खोला जा रहा है...' : 'Opening Bio-Data print dialogue...', 'success');
    setTimeout(() => {
        window.print();
    }, 500);
}

// ============================================
// PROFILE PHOTO UPLOADER (DRAG & DROP)
// ============================================
function initDragAndDrop() {
    const dropZone = document.getElementById("dashboard-photo-zone");
    if (!dropZone) return;

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            const input = document.getElementById("dashboard-photo");
            if (input) {
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
            }
            handlePhotoFile(file);
        }
    });
}

function handleDashboardPhotoSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handlePhotoFile(file);
    }
}

function handlePhotoFile(file) {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    // Validate size (30MB limit)
    const maxSize = 30 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast(currentLang === 'hi' ? 'फ़ाइल का आकार 30 एमबी से अधिक नहीं होना चाहिए।' : 'File size must be under 30 MB.', 'error');
        return;
    }

    showToast(currentLang === 'hi' ? 'फोटो अपलोड हो रही है...' : 'Uploading photo...', 'info');

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/profile/upload_image', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        body: formData
    })
    .then(res => {
        if (res.status === 201) {
            return res.json();
        } else {
            return res.json().then(err => { throw new Error(err.message || 'Upload failed'); });
        }
    })
    .then(data => {
        showToast(currentLang === 'hi' ? 'प्रोफ़ाइल फोटो सफलतापूर्वक अपलोड की गई!' : 'Profile photo uploaded successfully!', 'success');
        
        // Load the base64 locally for immediate UI feedback
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoData = e.target.result;
            
            const previewAvatar = document.getElementById("preview-avatar");
            if (previewAvatar) {
                previewAvatar.src = photoData;
            }
            
            document.querySelectorAll(".user-chip-avatar").forEach(img => {
                img.src = photoData;
            });

            const currentUserStr = sessionStorage.getItem('currentUser');
            if (currentUserStr) {
                const currentUser = JSON.parse(currentUserStr);
                currentUser.image = photoData;
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
        };
        reader.readAsDataURL(file);
    })
    .catch(err => {
        showToast(err.message, 'error');
    });
}

// ============================================
// ADMIN PANEL LOGIC
// ============================================
function initAdminPanel() {
    const userPanel = document.getElementById("user-panel");
    const adminPanel = document.getElementById("admin-panel");
    const superadminPanel = document.getElementById("superadmin-panel");
    const adminTabs = document.getElementById("admin-tabs");

    if (userPanel) userPanel.style.display = "none";
    if (adminPanel) adminPanel.style.display = "block";
    if (superadminPanel) superadminPanel.style.display = "none";
    if (adminTabs) adminTabs.style.display = "flex";

    fetchUserProfile(); // Load own profile for settings tab
    fetchAdminData();
}

function fetchAdminData() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    // 1. Fetch pending Requests
    fetch('/api/admin/requests', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => {
        if (res.status === 200) return res.json();
        throw new Error('Failed to load pending requests');
    })
    .then(data => {
        const pending = data.pending || [];
        pendingRequests = pending;
        const tbody = document.getElementById("pending-requests-tbody");
        document.getElementById("admin-pending-count").innerText = pending.length;

        if (pending.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 24px; text-align: center; color: var(--color-text-muted);" data-en="No pending requests." data-hi="कोई लंबित अनुरोध नहीं।">No pending requests.</td>
                </tr>
            `;
        } else {
            let html = "";
            pending.forEach(p => {
                html += `
                    <tr style="border-bottom: 1px solid var(--color-gold-light);">
                        <td style="padding: 12px 16px; font-weight:600;">${p.username} (${p.type})</td>
                        <td style="padding: 12px 16px;">${p.phone || '-'}</td>
                        <td style="padding: 12px 16px;">Self: ${p.gotra_self || '-'} / Mother: ${p.gotra_mother || '-'}</td>
                        <td style="padding: 12px 16px;">${p.district || '-'}</td>
                        <td style="padding: 12px 16px; text-align: center; display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap;">
                            <button class="btn-large btn-primary" style="padding: 4px 12px; min-height: 32px; font-size: 12px; background:var(--color-gold); border-color:var(--color-gold); color:var(--color-maroon); width:auto;" onclick="showProfileReviewDetails(${p.user_id})">
                                <i data-lucide="eye"></i> Review Details
                            </button>
                            <button class="btn-large btn-primary" style="padding: 4px 12px; min-height: 32px; font-size: 12px; background:#34a853; border-color:#34a853; width:auto;" onclick="adminApproveUser(${p.user_id})">
                                <i data-lucide="shield-check"></i> Approve
                            </button>
                            <button class="btn-large btn-secondary" style="padding: 4px 12px; min-height: 32px; font-size: 12px; background:#ea4335; color:#fff; width:auto;" onclick="adminRejectUser(${p.user_id})">
                                <i data-lucide="alert-triangle"></i> Reject
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
        lucide.createIcons();

        // 2. Fetch all approved profiles to complete user management listing
        return fetch('/api/profiles', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
    })
    .then(res => {
        if (!res) return;
        if (res.status === 200) return res.json();
        throw new Error('Failed to load approved profiles');
    })
    .then(data => {
        if (!data) return;
        const approved = data.profiles || [];
        const tbody = document.getElementById("all-users-tbody");
        
        // Update Total count: pending + approved
        const pendingCount = parseInt(document.getElementById("admin-pending-count").innerText) || 0;
        document.getElementById("admin-total-users").innerText = pendingCount + approved.length;

        if (approved.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 16px; text-align: center; color: var(--color-text-muted);" data-en="No approved members." data-hi="कोई स्वीकृत सदस्य नहीं।">No approved members.</td>
                </tr>
            `;
            return;
        }

        let html = "";
        approved.forEach(p => {
            html += `
                <tr style="border-bottom: 1px solid var(--color-gold-light);">
                    <td style="padding: 12px 16px; font-weight:600;">${p.username} (${p.type})</td>
                    <td style="padding: 12px 16px;">${p.phone || p.contact || "-"}</td>
                    <td style="padding: 12px 16px;"><span style="color:#b58900; font-weight:700;">USER</span></td>
                    <td style="padding: 12px 16px;"><span style="color:#34a853; font-weight:700;">APPROVED</span></td>
                    <td style="padding: 12px 16px; text-align: center;">
                        <button class="btn-large btn-secondary" style="padding: 4px 12px; min-height: 32px; font-size: 12px; background:#ea4335; color:#fff; width:auto; margin:0 auto;" onclick="adminDeleteUser(${p.user_id})">
                            <i data-lucide="trash-2"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        lucide.createIcons();
    })
    .catch(err => {
        console.error(err);
    });
}

function adminApproveUser(userId) {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    if (!confirm('Are you sure you want to APPROVE this user?')) return;

    fetch(`/api/admin/approve/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => {
        if (res.status === 200) {
            showToast('User approved successfully.', 'success');
            fetchAdminData();
        } else {
            showToast('Failed to approve user.', 'error');
        }
    })
    .catch(err => {
        showToast('Error: ' + err.message, 'error');
    });
}

function adminRejectUser(userId) {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    if (!confirm('Are you sure you want to REJECT this user?')) return;

    fetch(`/api/admin/reject/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => {
        if (res.status === 200) {
            showToast('User rejected successfully.', 'success');
            fetchAdminData();
        } else {
            showToast('Failed to reject user.', 'error');
        }
    })
    .catch(err => {
        showToast('Error: ' + err.message, 'error');
    });
}

function adminDeleteUser(userId) {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    if (!confirm('WARNING: Are you sure you want to permanently DELETE this user account? This action is irreversible.')) return;

    fetch(`/api/admin/delete_user/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => {
        if (res.status === 200) {
            showToast('User deleted successfully.', 'success');
            fetchAdminData();
        } else {
            showToast('Failed to delete user.', 'error');
        }
    })
    .catch(err => {
        showToast('Error: ' + err.message, 'error');
    });
}

// ============================================
// SUPER ADMIN PANEL LOGIC
// ============================================
function initSuperAdminPanel() {
    const userPanel = document.getElementById("user-panel");
    const adminPanel = document.getElementById("admin-panel");
    const superadminPanel = document.getElementById("superadmin-panel");
    const adminTabs = document.getElementById("admin-tabs");

    if (userPanel) userPanel.style.display = "none";
    if (adminPanel) adminPanel.style.display = "none";
    if (superadminPanel) superadminPanel.style.display = "block";
    if (adminTabs) adminTabs.style.display = "flex";

    fetchUserProfile(); // Load own profile for settings tab
    fetchSuperAdminData();
}

function fetchSuperAdminData() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    // 1. Fetch statistics & action logs
    fetch('/api/superadmin/stats', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => {
        if (res.status === 200) return res.json();
        throw new Error('Failed to load system stats');
    })
    .then(data => {
        document.getElementById("super-total-users").innerText = data.total_users || 0;
        document.getElementById("super-total-admins").innerText = data.total_admins || 0;
        document.getElementById("super-approved-count").innerText = data.total_approved || 0;
        
        // Render logs
        const logs = data.admin_actions || [];
        const tbody = document.getElementById("audit-logs-tbody");
        if (logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="padding: 16px; text-align: center; color: var(--color-text-muted);">No action logs found.</td>
                </tr>
            `;
            return;
        }
        let html = "";
        logs.forEach(l => {
            html += `
                <tr style="border-bottom: 1px solid var(--color-gold-light);">
                    <td style="padding: 10px 16px;">Admin ID: ${l.admin_id}</td>
                    <td style="padding: 10px 16px; font-weight:700; color: ${l.action_type === 'APPROVE' ? '#34a853' : l.action_type === 'REJECT' ? '#fbbc05' : '#ea4335'};">${l.action_type}</td>
                    <td style="padding: 10px 16px;">User ID: ${l.target_user_id}</td>
                    <td style="padding: 10px 16px;">${new Date(l.timestamp).toLocaleString()}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    })
    .catch(err => {
        console.error(err);
    });

    // 2. Fetch admins list
    fetch('/api/superadmin/admins', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => {
        if (res.status === 200) return res.json();
        throw new Error('Failed to load admins');
    })
    .then(data => {
        const admins = data.admins || [];
        const tbody = document.getElementById("admins-list-tbody");
        if (admins.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="padding: 16px; text-align: center; color: var(--color-text-muted);">No administrators registered.</td>
                </tr>
            `;
            return;
        }
        let html = "";
        admins.forEach(a => {
            html += `
                <tr style="border-bottom: 1px solid var(--color-gold-light);">
                    <td style="padding: 8px; font-weight:600;">${a.username}</td>
                    <td style="padding: 8px;">${a.phone || "-"}</td>
                    <td style="padding: 8px; text-align: center;">
                        <button class="btn-large btn-secondary" style="padding: 2px 10px; min-height: 28px; font-size: 11px; background:#fbbc05; color:#000; width:auto; margin:0 auto;" onclick="demoteAdmin(${a.id})">
                            Demote
                        </button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    })
    .catch(err => {
        console.error(err);
    });
}

function submitCreateAdmin() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const name = document.getElementById("super-admin-name").value.trim();
    const phone = document.getElementById("super-admin-phone").value.trim();
    const password = document.getElementById("super-admin-password").value.trim();

    if (!name || !phone || !password) {
        showToast("Please fill all fields.", "error");
        return;
    }
    if (phone.length < 10) {
        showToast("Phone number must be at least 10 digits.", "error");
        return;
    }
    if (password.length < 6) {
        showToast("Password must be at least 6 characters.", "error");
        return;
    }

    showToast("Creating administrator account...", "info");

    fetch('/api/superadmin/create_admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            username: name,
            phone: phone,
            password: password
        })
    })
    .then(res => {
        if (res.status === 201) {
            showToast("Administrator created successfully!", "success");
            document.getElementById("super-admin-name").value = "";
            document.getElementById("super-admin-phone").value = "";
            document.getElementById("super-admin-password").value = "";
            fetchSuperAdminData();
        } else {
            return res.json().then(err => { throw new Error(err.message || 'Failed to create admin'); });
        }
    })
    .catch(err => {
        showToast(err.message, "error");
    });
}

function demoteAdmin(adminId) {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    if (!confirm('Are you sure you want to DEMOTE this administrator? they will lose admin access.')) return;

    fetch(`/api/superadmin/change_admin_role/${adminId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            role: 'USER'
        })
    })
    .then(res => {
        if (res.status === 200) {
            showToast('Admin demoted successfully.', 'success');
            fetchSuperAdminData();
        } else {
            showToast('Failed to demote admin.', 'error');
        }
    })
    .catch(err => {
        showToast('Error: ' + err.message, 'error');
    });
}

// ============================================
// RECEIVED INTERESTS MANAGEMENT
// ============================================
function renderInterests() {
    const container = document.getElementById("interests-container-list");
    if (!container) return;

    if (mockInterests.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 32px; background: var(--color-white); border: 1.5px solid var(--color-gold-light); border-radius: var(--border-radius-md); font-weight: 600; color: var(--color-text-muted);">
                <i data-lucide="heart-off" style="width: 36px; height: 36px; color: var(--color-gold); margin-bottom: 12px; display: inline-block;"></i>
                <p data-en="No pending interests received." data-hi="कोई लंबित रुचि प्राप्त नहीं हुई है।">No pending interests received.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    let html = "";
    mockInterests.forEach(item => {
        const nameVal = item.name[currentLang] || item.name['en'];
        const gotraSelfVal = item.gotraSelf[currentLang] || item.gotraSelf['en'];
        const gotraMotherVal = item.gotraMother[currentLang] || item.gotraMother['en'];
        const districtVal = item.district[currentLang] || item.district['en'];

        const detailsText = currentLang === 'hi'
            ? `${item.age} वर्ष · गोत्र: ${gotraSelfVal} (माता: ${gotraMotherVal}) · जिला: ${districtVal}`
            : `${item.age} Yrs · Gotra: ${gotraSelfVal} (Mother: ${gotraMotherVal}) · Dist: ${districtVal}`;

        html += `
            <div class="interest-item-card" id="interest-card-${item.id}" style="transition: all 0.3s ease;">
                <div style="display: flex; align-items: center; gap: 16px; text-align: left;">
                    <img src="${item.image}" alt="${nameVal}" style="width: 56px; height: 56px; border-radius: 50%; border: 2px solid var(--color-gold); object-fit: cover; flex-shrink: 0;">
                    <div class="interest-user-info">
                        <span class="interest-username">${nameVal}</span>
                        <div class="interest-details">${detailsText}</div>
                    </div>
                </div>
                <div class="interest-actions" id="interest-actions-${item.id}">
                    <button class="btn-interest btn-interest-decline" onclick="declineInterest(${item.id})">
                        <i data-lucide="x"></i>
                        <span data-en="Decline" data-hi="अस्वीकार">Decline</span>
                    </button>
                    <button class="btn-interest btn-interest-accept" onclick="acceptInterest(${item.id}, '${nameVal.replace(/'/g, "\\'")}')">
                        <i data-lucide="heart"></i>
                        <span data-en="Accept" data-hi="स्वीकार">Accept</span>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    lucide.createIcons();
}

function acceptInterest(id, name) {
    const msg = currentLang === 'hi'
        ? `${name} की रुचि स्वीकार की गई! परिवार का संपर्क विवरण साझा किया गया।`
        : `Interest accepted from ${name}! Family contact details shared.`;
    showToast(msg, 'success');

    const actionsDiv = document.getElementById(`interest-actions-${id}`);
    if (actionsDiv) {
        actionsDiv.innerHTML = `
            <button class="btn-interest btn-interest-connected">
                <i data-lucide="check-circle-2"></i>
                <span data-en="Connected" data-hi="जुड़ गए">Connected</span>
            </button>
        `;
        lucide.createIcons();
    }

    let countVal = parseInt(sessionStorage.getItem('interestsCount')) || 28;
    countVal += 1;
    sessionStorage.setItem('interestsCount', countVal);
    const countValElement = document.getElementById("interests-count-val");
    if (countValElement) {
        countValElement.innerText = countVal;
    }
}

function declineInterest(id) {
    const card = document.getElementById(`interest-card-${id}`);
    if (card) {
        card.style.opacity = "0";
        card.style.transform = "scale(0.95)";
        
        const index = mockInterests.findIndex(item => item.id === id);
        if (index > -1) {
            mockInterests.splice(index, 1);
        }

        setTimeout(() => {
            card.remove();
            if (mockInterests.length === 0) {
                renderInterests();
            }
        }, 300);

        showToast(currentLang === 'hi' ? 'अनुरोध अस्वीकार कर दिया गया।' : 'Interest request declined.', 'info');
    }
}

// ============================================
// BILINGUAL LANGUAGE SWITCHER
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

    // Translate standard static texts
    document.querySelectorAll('[data-en]').forEach(el => {
        const textEn = el.getAttribute('data-en');
        const textHi = el.getAttribute('data-hi');
        el.innerText = lang === 'hi' ? textHi : textEn;
    });

    // Re-render Bio-Data Preview for Date formatting update
    const role = sessionStorage.getItem('role');
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        updateBioDataPreview();
    }

    // Re-render Received Interests
    renderInterests();

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
// AUTH ACTIONS
// ============================================
function handleLogout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.clear();
    showToast(currentLang === 'hi' ? 'लॉग आउट किया जा रहा है...' : 'Logging out...', 'info');
    setTimeout(() => {
        window.location.href = "index.html";
    }, 800);
}

// ============================================
// ADMIN DETAIL MODAL ACTIONS
// ============================================
function showProfileReviewDetails(userId) {
    const p = pendingRequests.find(req => req.user_id === userId);
    if (!p) return;

    const modal = document.getElementById("admin-detail-modal");
    const content = document.getElementById("admin-detail-content");
    const footer = document.getElementById("admin-detail-footer");

    if (!modal || !content || !footer) return;

    const imgUrl = p.image_url || "images/default-avatar.png";

    content.innerHTML = `
        <div style="display: flex; flex-direction: row; gap: 20px; align-items: center; flex-wrap: wrap; background: var(--color-white); padding: 16px; border-radius: var(--border-radius-md); border: 1px solid var(--color-gold-light);">
            <img src="${imgUrl}" style="width: 110px; height: 110px; border-radius: 50%; object-fit: cover; border: 3px solid var(--color-gold); box-shadow: var(--box-shadow-sm);" alt="${p.username}" onerror="this.src='https://picsum.photos/seed/default/150/150.jpg'">
            <div style="flex-grow: 1;">
                <h4 style="font-size: 20px; color: var(--color-maroon); margin: 0 0 4px; font-weight: 700; font-family: 'Playfair Display', serif;">${p.username}</h4>
                <p style="font-size: 14px; font-weight: 600; color: var(--color-saffron); margin: 0 0 8px;">Profile Type: ${p.type === 'BRIDE' ? 'Bride (वधू)' : 'Groom (वर)'}</p>
                <p style="font-size: 13px; font-style: italic; color: var(--color-text-muted); margin: 0; background: var(--color-cream); padding: 8px 12px; border-radius: var(--border-radius-sm); border-left: 3px solid var(--color-maroon);">
                    "${p.bio || 'No bio provided.'}"
                </p>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
            <div style="background: var(--color-white); padding: 16px; border-radius: var(--border-radius-md); border: 1px solid var(--color-gold-light); box-shadow: var(--box-shadow-sm);">
                <h5 style="color: var(--color-maroon); font-size: 15px; border-bottom: 2px solid var(--color-gold-light); padding-bottom: 6px; margin: 0 0 12px; font-weight: 700; font-family: 'Playfair Display', serif;">
                    Personal Attributes
                </h5>
                <table style="width: 100%; font-size: 13px; line-height: 2.0; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; width: 45%; color: var(--color-text-muted);">Date of Birth:</td><td style="color: var(--color-text-dark);">${p.dob || '-'}</td></tr>
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; color: var(--color-text-muted);">Height:</td><td style="color: var(--color-text-dark);">${p.height || '-'}</td></tr>
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; color: var(--color-text-muted);">Gotra (Self):</td><td style="color: var(--color-text-dark);">${p.gotra_self || '-'}</td></tr>
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; color: var(--color-text-muted);">Gotra (Mother):</td><td style="color: var(--color-text-dark);">${p.gotra_mother || '-'}</td></tr>
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; color: var(--color-text-muted);">Education:</td><td style="color: var(--color-text-dark);">${p.education || '-'}</td></tr>
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; color: var(--color-text-muted);">Profession:</td><td style="color: var(--color-text-dark);">${p.profession || '-'}</td></tr>
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; color: var(--color-text-muted);">District:</td><td style="color: var(--color-text-dark);">${p.district || '-'}</td></tr>
                    <tr><td style="font-weight: 600; color: var(--color-text-muted);">Community:</td><td style="color: var(--color-text-dark);">${p.community || 'Mewada'}</td></tr>
                </table>
            </div>

            <div style="background: var(--color-white); padding: 16px; border-radius: var(--border-radius-md); border: 1px solid var(--color-gold-light); box-shadow: var(--box-shadow-sm);">
                <h5 style="color: var(--color-maroon); font-size: 15px; border-bottom: 2px solid var(--color-gold-light); padding-bottom: 6px; margin: 0 0 12px; font-weight: 700; font-family: 'Playfair Display', serif;">
                    Family & Contact Info
                </h5>
                <table style="width: 100%; font-size: 13px; line-height: 2.0; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; width: 45%; color: var(--color-text-muted);">Father Name:</td><td style="color: var(--color-text-dark);">${p.father_name || '-'}</td></tr>
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; color: var(--color-text-muted);">Mother Name:</td><td style="color: var(--color-text-dark);">${p.mother_name || '-'}</td></tr>
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; color: var(--color-text-muted);">Parents Job:</td><td style="color: var(--color-text-dark);">${p.parents_occupation || '-'}</td></tr>
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; color: var(--color-text-muted);">Family Type:</td><td style="color: var(--color-text-dark);">${p.family_type || '-'}</td></tr>
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; color: var(--color-text-muted);">Brothers:</td><td style="color: var(--color-text-dark);">${p.brothers || '-'}</td></tr>
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; color: var(--color-text-muted);">Sisters:</td><td style="color: var(--color-text-dark);">${p.sisters || '-'}</td></tr>
                    <tr style="border-bottom: 1px solid #f9f9f9;"><td style="font-weight: 600; color: var(--color-text-muted);">Contact/Phone:</td><td style="color: var(--color-text-dark);">${p.contact || p.phone || '-'}</td></tr>
                    <tr><td style="font-weight: 600; color: var(--color-text-muted);">Address:</td><td style="color: var(--color-text-dark); word-break: break-all;">${p.address || '-'}</td></tr>
                </table>
            </div>
        </div>
    `;

    footer.innerHTML = `
        <button class="btn-large" style="padding: 6px 16px; min-height: 38px; font-size: 13px; background:var(--color-white); color:var(--color-maroon); border: 1px solid var(--color-gold); width:auto; font-weight:600;" onclick="closeAdminDetailModal()">
            Close
        </button>
        <button class="btn-large" style="padding: 6px 16px; min-height: 38px; font-size: 13px; background:#ea4335; border-color:#ea4335; color:#fff; width:auto; font-weight:600;" onclick="adminRejectUser(${p.user_id}); closeAdminDetailModal();">
            <i data-lucide="alert-triangle"></i> Reject
        </button>
        <button class="btn-large" style="padding: 6px 16px; min-height: 38px; font-size: 13px; background:#34a853; border-color:#34a853; color:#fff; width:auto; font-weight:600;" onclick="adminApproveUser(${p.user_id}); closeAdminDetailModal();">
            <i data-lucide="shield-check"></i> Approve Profile
        </button>
    `;

    modal.style.display = "flex";
    lucide.createIcons();
}

function closeAdminDetailModal() {
    const modal = document.getElementById("admin-detail-modal");
    if (modal) {
        modal.style.display = "none";
    }
}

function switchDashboardTab(tabName) {
    const userPanel = document.getElementById("user-panel");
    const adminPanel = document.getElementById("admin-panel");
    const superadminPanel = document.getElementById("superadmin-panel");
    const btnAdmin = document.getElementById("tab-btn-admin");
    const btnProfile = document.getElementById("tab-btn-profile");

    const role = sessionStorage.getItem('role');

    if (tabName === 'admin') {
        if (userPanel) userPanel.style.display = "none";
        if (role === 'SUPER_ADMIN') {
            if (superadminPanel) superadminPanel.style.display = "block";
            if (adminPanel) adminPanel.style.display = "none";
        } else {
            if (adminPanel) adminPanel.style.display = "block";
            if (superadminPanel) superadminPanel.style.display = "none";
        }
        if (btnAdmin) {
            btnAdmin.className = "btn-large btn-primary";
            btnAdmin.style.background = "";
            btnAdmin.style.color = "";
        }
        if (btnProfile) {
            btnProfile.className = "btn-large btn-outline";
            btnProfile.style.color = "var(--color-maroon)";
            btnProfile.style.borderColor = "var(--color-gold)";
        }
    } else {
        if (userPanel) userPanel.style.display = "block";
        if (adminPanel) adminPanel.style.display = "none";
        if (superadminPanel) superadminPanel.style.display = "none";
        
        if (btnAdmin) {
            btnAdmin.className = "btn-large btn-outline";
            btnAdmin.style.color = "var(--color-maroon)";
            btnAdmin.style.borderColor = "var(--color-gold)";
        }
        if (btnProfile) {
            btnProfile.className = "btn-large btn-primary";
            btnProfile.style.background = "";
            btnProfile.style.color = "";
        }
    }
}
