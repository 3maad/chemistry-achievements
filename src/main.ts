import './index.css';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, onValue } from "firebase/database";
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://abimxtosjaedzwvwfybo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qtnCopGdW8fRbxKmmYi_SQ_IjBVn0Ab';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Firebase Configuration provided by user
const firebaseConfig = {
    apiKey: "AIzaSyAhVMS23BCzAiMyNmnsnYHMNTh2oxzKFQM",
    authDomain: "smarttaskpro-ab1dd.firebaseapp.com",
    projectId: "smarttaskpro-ab1dd",
    databaseURL: "https://smarttaskpro-ab1dd-default-rtdb.asia-southeast1.firebasedatabase.app", 
    storageBucket: "smarttaskpro-ab1dd.firebasestorage.app",
    messagingSenderId: "418925158801",
    appId: "1:418925158801:web:7d77344abce4d6338bfa30"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const filesList = document.getElementById("filesList");
const searchInput = document.getElementById("searchInput") as HTMLInputElement;
const toast = document.getElementById("toast");
const emptyState = document.getElementById("emptyState");
const fileTemplate = document.getElementById('file-card-template') as HTMLTemplateElement;

// Mobile Drawer Elements
const menuToggle = document.getElementById('menu-toggle');
const mobileDrawer = document.getElementById('mobile-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');

function setupMobileMenu() {
    if (!menuToggle || !mobileDrawer || !drawerOverlay) return;

    const closeDrawerBtn = document.getElementById('close-drawer');
    
    const toggle = (show: boolean) => {
        mobileDrawer.classList.toggle('open', show);
        drawerOverlay.classList.toggle('active', show);
        document.body.style.overflow = show ? 'hidden' : '';
    };

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle(true);
    });

    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', () => toggle(false));
    }

    drawerOverlay.addEventListener('click', () => toggle(false));

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggle(false);
    });

    // Close on link click
    const links = mobileDrawer.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => toggle(false));
    });

    // Close when clicking outside the drawer content
    document.addEventListener('click', (e) => {
        if (mobileDrawer.classList.contains('open')) {
            const target = e.target as HTMLElement;
            if (!mobileDrawer.contains(target) && !menuToggle.contains(target)) {
                toggle(false);
            }
        }
    });
}
setupMobileMenu();

let allFilesData: any[] = [];

// --- 1. Supabase Storage Uploader ---
function initializeUploader() {
    const clickArea = document.getElementById('uploadButtonClick');
    let fileInput = document.getElementById('fileInput') as HTMLInputElement;

    // Create the input dynamically if it doesn't exist (e.g. on files.html)
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'fileInput';
        fileInput.accept = 'application/pdf';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }

    if (!clickArea) return;

    console.log("🧪 Achievement Lab: Supabase Storage System Online");

    clickArea.style.cursor = 'pointer';
    clickArea.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    };

    fileInput.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('يرجى اختيار ملف PDF فقط');
            return;
        }

        const statusToast = document.getElementById('toast');
        try {
            if (statusToast) {
                statusToast.innerText = "جاري التفاعل الكيميائي ورقع الملف...";
                statusToast.classList.remove('hidden');
            }

            // Generate unique name: timestamp + random string
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

            // Upload to Supabase
            const { data, error } = await supabase.storage
                .from('pdfs')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'application/pdf'
                });

            if (error) {
                console.error("Supabase Storage Upload Detail:", error);
                throw error;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('pdfs')
                .getPublicUrl(fileName);

            if (statusToast) {
                statusToast.innerText = "جاري تفعيل العنصر في قاعدة البيانات...";
            }

            // Save to Firebase
            const dbRef = ref(db, 'achievements');
            const fileId = "EL-" + Math.floor(Math.random() * 899 + 100);
            await set(push(dbRef), {
                id: fileId,
                fileName: file.name, // Original name for display
                url: publicUrl,
                date: new Date().toLocaleDateString('ar-SA')
            });

            if (statusToast) {
                statusToast.innerText = "✅ تمت عملية الاستخلاص بنجاح!";
                setTimeout(() => statusToast.classList.add('hidden'), 3000);
            }
        } catch (error: any) {
            console.error("Critical Process Error:", error);
            if (statusToast) {
                // Show more specific message if possible
                const errorMsg = error.message || error.error_description || "حدث خطأ أثناء المعالجة";
                statusToast.innerText = `❌ ${errorMsg}`;
                setTimeout(() => statusToast.classList.add('hidden'), 5000);
            }
        } finally {
            // Reset input so the same file can be uploaded again if needed
            target.value = '';
        }
    };
}
initializeUploader();

// --- 2. Display Logic ---
function displayFiles(dataArray: any[]) {
    if (!filesList || !fileTemplate) return;
    filesList.innerHTML = ""; 

    if (dataArray.length > 0) {
        if (emptyState) emptyState.classList.add('hidden');
        
        dataArray.forEach((file, index) => {
            const clone = fileTemplate.content.cloneNode(true) as HTMLElement;
            const card = clone.querySelector('.element-card') as HTMLElement;
            
            // Add staggered animation delay
            if (card) {
                card.style.animationDelay = `${index * 0.1}s`;
                card.classList.add('animate-in');
            }

            const ext = (file.fileName || '').split('.').pop() || '??';
            const elName = clone.querySelector('.element-name');
            const viewLink = clone.querySelector('.view-link') as HTMLAnchorElement;
            const viewLinkFront = clone.querySelector('.view-link-front') as HTMLAnchorElement;

            if (elName) elName.textContent = file.fileName;
            if (viewLink) viewLink.href = file.url;
            if (viewLinkFront) viewLinkFront.href = file.url;

            // QR Code generation handles the "Data Sync" feel
            const qrContainer = clone.querySelector('.item-main-qr') as HTMLElement;
            if (qrContainer) {
                const tryGenerateQR = () => {
                    const qrUtils = (window as any).QRCode;
                    if (qrUtils) {
                        qrContainer.innerHTML = "";
                        // Add inner white box for better QR readability
                        const qrBox = document.createElement('div');
                        qrBox.className = 'w-full h-full bg-white p-2.5 rounded-2xl flex items-center justify-center group-hover:scale-95 transition-transform duration-500';
                        qrContainer.appendChild(qrBox);

                        new qrUtils(qrBox, {
                            text: file.url || window.location.href,
                            width: 140,
                            height: 140,
                            colorDark : "#000000",
                            colorLight : "#ffffff",
                            correctLevel : (window as any).QRCode.CorrectLevel.H
                        });
                    } else {
                        setTimeout(tryGenerateQR, 500);
                    }
                };
                tryGenerateQR();
            }

            filesList.appendChild(clone);
        });
    } else {
        if (emptyState) emptyState.classList.remove('hidden');
    }
}

// --- 3. Main Site QR & Share ---
function setupMainQR() {
    const mainQRContainer = document.getElementById('mainSiteQR');
    const shareBtn = document.getElementById('shareBtn');

    if (mainQRContainer) {
        const generateMainQR = () => {
            const qrUtils = (window as any).QRCode;
            if (qrUtils) {
                new qrUtils(mainQRContainer, {
                    text: window.location.origin,
                    width: 160,
                    height: 160,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                });
            } else {
                setTimeout(generateMainQR, 500);
            }
        };
        generateMainQR();
    }

    if (shareBtn) {
        shareBtn.onclick = async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'مختبر الإنجاز الكيميائي',
                        text: 'تفضل بزيارة مختبر الإنجاز الكيميائي لاستعراض أعمال الطلاب وتوزيع المنهج.',
                        url: window.location.href,
                    });
                } catch (err) {
                    console.error('Share failed:', err);
                }
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(window.location.href);
                alert('تم نسخ رابط المختبر إلى الحافظة!');
            }
        };
    }
}

setupMainQR();

const FALLBACK_DATA = [
    { id: "EL-101", fileName: "تقرير استخلاص النحاس.pdf", url: "#", date: "١٤٤٥/٠٨/١٠" },
    { id: "EL-102", fileName: "بحث الهيدروكربونات العطرية.pdf", url: "#", date: "١٤٤٥/٠٨/١٢" },
    { id: "EL-103", fileName: "تفاعل الصوديوم مع الماء.pdf", url: "#", date: "١٤٤٥/٠٨/١٥" },
    { id: "EL-104", fileName: "تجارب الأحماض والقواعد.pdf", url: "#", date: "١٤٤٥/٠٨/١٨" }
];

// --- 3. Data Fetching ---
function setupDataFetching() {
    onValue(ref(db, 'achievements'), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            allFilesData = Object.values(data).reverse();
            refreshDisplay();
        } else {
            console.log("No data in DB, showing fallbacks.");
            allFilesData = FALLBACK_DATA;
            refreshDisplay();
        }
    }, (error) => {
        console.error("Firebase Read Error:", error);
    });
}

function refreshDisplay() {
    const isHome = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
    if (isHome) {
      displayFiles(allFilesData.slice(0, 12));
    } else {
      displayFiles(allFilesData);
    }
}

setupDataFetching();

// Search Logic
if (searchInput) {
    searchInput.addEventListener("input", (e: any) => {
        const term = e.target.value.toLowerCase().trim();
        if (!term) {
            refreshDisplay();
            return;
        }

        const filtered = allFilesData.filter(file => 
            (file.fileName && file.fileName.toLowerCase().includes(term)) ||
            (file.id && file.id.toLowerCase().includes(term)) ||
            (file.date && file.date.toLowerCase().includes(term))
        );
        displayFiles(filtered);
    });
}

// System Status Simulation
function updateSystemStatus() {
    const statusEls = document.querySelectorAll('#system-status');
    if (statusEls.length === 0) return;
    
    const statuses = [
        "Status: Analysis in Progress...",
        "Status: Molecular Stability 98.2%",
        "Status: Syncing with Global Database",
        "Status: Lab Environment Optimized",
        "Status: Ready for Synthesis",
        "Status: Atomic Structure Verified",
        "Status: 100% Signal Integrity"
    ];
    let i = 0;
    setInterval(() => {
        statusEls.forEach(el => {
            (el as HTMLElement).innerText = statuses[i];
            el.classList.add('animate-pulse');
            setTimeout(() => el.classList.remove('animate-pulse'), 1000);
        });
        i = (i + 1) % statuses.length;
    }, 4000);
}

// --- High-End Lab Effects (Particles) ---
function createLabEffects() {
  const container = document.getElementById('atoms-container');
  if (!container) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const atoms: { el: HTMLElement, x: number, y: number, vx: number, vy: number }[] = [];

  for (let i = 0; i < 30; i++) {
    const atom = document.createElement('div');
    atom.className = 'molecule';
    const size = Math.random() * 6 + 2;
    atom.style.width = `${size}px`;
    atom.style.height = `${size}px`;
    atom.style.opacity = (Math.random() * 0.3 + 0.1).toString();
    const x = Math.random() * width;
    const y = Math.random() * height;
    
    container.appendChild(atom);
    atoms.push({
        el: atom,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
    });
  }

  function animate() {
    atoms.forEach(atom => {
        atom.x += atom.vx;
        atom.y += atom.vy;

        if (atom.x < 0) atom.x = window.innerWidth;
        if (atom.x > window.innerWidth) atom.x = 0;
        if (atom.y < 0) atom.y = window.innerHeight;
        if (atom.y > window.innerHeight) atom.y = 0;

        atom.el.style.transform = `translate(${atom.x}px, ${atom.y}px)`;
    });
    requestAnimationFrame(animate);
  }
  animate();

  const bubbleContainer = document.querySelector('.bubbles-container');
  if (bubbleContainer) {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const bSize = Math.random() * 10 + 5;
        bubble.style.width = `${bSize}px`;
        bubble.style.height = `${bSize}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${Math.random() * 6 + 6}s`;
        bubbleContainer.appendChild(bubble);
      }, i * 500);
    }
  }
}

createLabEffects();
updateSystemStatus();
