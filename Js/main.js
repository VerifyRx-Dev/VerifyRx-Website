// --- 1. THEME ENGINE ---
(function initTheme() {
    const saved = localStorage.getItem('verifyRx_theme') || 'light';
    if (saved === 'dark') document.documentElement.classList.add('dark');
})();

// --- 2. CORE UTILITIES ---
function getInitials(name) {
    if (!name) return "CO";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function generatePIN() {
    const p1 = Math.random().toString(36).substring(2, 8).toUpperCase();
    const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${p1}-${p2}`;
}

function signOut() {
    localStorage.removeItem('verifyRx_user');
    window.location.href = 'index.html';
}

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('sidebar-hidden');
    sidebar.classList.toggle('translate-x-0');
    overlay.classList.toggle('hidden');
}

function toggleProfileMenu() {
    const menu = document.getElementById('profileDropdown');
    if (menu) menu.classList.toggle('hidden');
}

// --- 3. MODAL LOGIC ---
function openManageModal(drugName, batchNo, totalCodes, pin) {
    document.getElementById('modalDrugName').innerText = drugName;
    document.getElementById('modalBatchID').innerText = "BATCH ID: " + batchNo;
    document.getElementById('modalQty').innerText = parseInt(totalCodes).toLocaleString();
    document.getElementById('modalSamplePin').innerText = pin;
    
    const qrEl = document.getElementById('modalQrContainer');
    if (qrEl && typeof QRCode !== "undefined") {
        qrEl.innerHTML = "";
        new QRCode(qrEl, { text: pin, width: 140, height: 140 });
    }
    document.getElementById('manageModal').classList.remove('hidden');
}

// --- 4. PAGE LOAD LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    // A. VERIFICATION SHIELD
    const profile = JSON.parse(localStorage.getItem('verifyRx_user_profile'));
    const statusLabel = document.getElementById('verificationStatus');

    if (profile && profile.isVerified) {
        if (statusLabel) {
            statusLabel.innerHTML = "✅ Verified Account";
            statusLabel.className = "flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100";
        }
    }

    // B. USER SETUP
    const userName = localStorage.getItem('verifyRx_user') || 'Pharmaceuticals Co.';
    const initials = getInitials(userName);
    document.querySelectorAll('.user-name-display').forEach(el => el.innerText = userName);
    document.querySelectorAll('.user-initials-display').forEach(el => el.innerText = initials);

    const batches = JSON.parse(localStorage.getItem('verifyRx_batches')) || [];

    // C. DASHBOARD UPDATES
    const counter = document.getElementById('total-codes-counter');
    if (counter) {
        const total = batches.reduce((sum, b) => sum + (parseInt(b.totalCodes) || 0), 0);
        counter.innerText = (48200 + total).toLocaleString();
    }

    const dashTable = document.getElementById('dashboard-table-body');
    if (dashTable) {
        dashTable.innerHTML = "";
        if (batches.length === 0) dashTable.innerHTML = "<tr><td colspan='3' class='py-8 text-center text-slate-400 italic'>No Production History</td></tr>";
        else {
            batches.slice().reverse().slice(0, 5).forEach(b => {
                dashTable.innerHTML += `
                    <tr class="border-b border-slate-50 transition hover:bg-slate-50/50">
                        <td class="py-5 font-bold text-slate-900">${b.drugName}</td>
                        <td class="py-5 text-center text-slate-500 font-medium">${parseInt(b.totalCodes).toLocaleString()}</td>
                        <td class="py-5 text-right"><span class="text-[9px] font-black text-green-500 uppercase">● Live</span></td>
                    </tr>`;
            });
        }
    }

    // D. INVENTORY TABLE (Batches Page)
    const invTable = document.getElementById('batches-table-body');
    if (invTable) {
        invTable.innerHTML = "";
        if (batches.length === 0) invTable.innerHTML = "<tr><td colspan='5' class='p-12 text-center text-slate-400'>Inventory Empty</td></tr>";
        else {
            batches.slice().reverse().forEach(b => {
                const pin = b.pins && b.pins[0] ? b.pins[0] : generatePIN();
                invTable.innerHTML += `
                    <tr class="hover:bg-slate-50/50 transition border-b border-slate-50">
                        <td class="p-6 font-bold text-slate-900">${b.drugName}</td>
                        <td class="p-6"><span class="font-mono text-[10px] text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">${b.batchNo}</span></td>
                        <td class="p-6 font-medium text-slate-700">${parseInt(b.totalCodes).toLocaleString()}</td>
                        <td class="p-6 text-slate-400 text-xs">${b.date || new Date().toLocaleDateString()}</td>
                        <td class="p-6 text-right">
                            <button onclick="openManageModal('${b.drugName}', '${b.batchNo}', '${b.totalCodes}', '${pin}')" class="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition shadow-lg">Manage</button>
                        </td>
                    </tr>`;
            });
        }
    }

    // E. GENERATE BATCH
    const genBtn = document.querySelector('#batchModal button.bg-blue-600');
    if (genBtn) {
        genBtn.addEventListener('click', () => {
            const modal = document.getElementById('batchModal');
            const inps = modal.querySelectorAll('input');
            const name = inps[0].value;
            const bno = inps[1].value;
            const qty = inps[2].value;

            if (!name || !bno || !qty) return alert("All fields required for production.");

            const newBatch = { drugName: name, batchNo: bno, totalCodes: qty, pins: [generatePIN()], date: new Date().toLocaleDateString() };
            const current = JSON.parse(localStorage.getItem('verifyRx_batches')) || [];
            current.push(newBatch);
            localStorage.setItem('verifyRx_batches', JSON.stringify(current));

            const pinDisplay = document.getElementById('samplePinDisplay');
            const qrBox = document.getElementById('qrContainer');
            if (pinDisplay) pinDisplay.innerText = newBatch.pins[0];
            if (qrBox) {
                qrBox.innerHTML = "";
                new QRCode(qrBox, { text: newBatch.pins[0], width: 140, height: 140 });
            }

            modal.classList.add('hidden');
            document.getElementById('successModal').classList.remove('hidden');
        });
    }
});