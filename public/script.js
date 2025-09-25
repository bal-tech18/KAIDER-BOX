// 🔥 Firebase Initialization
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

// 🧑‍💻 Google Sign-In Logic
document.getElementById('googleSignIn').addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      document.getElementById('userInfo').innerHTML = `
        <p><strong>Name:</strong> ${user.displayName}</p>
        <p><strong>Email:</strong> ${user.email}</p>
      `;
      // Optional: redirect to dashboard
      // window.location.href = '/dashboard.html';
    })
    .catch(error => {
      console.error(error);
      alert('Sign-in failed');
    });
});

// 📤 File Upload
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    alert("Please choose a file before uploading.");
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    const msg = await res.text();
    alert(msg);
    fileInput.value = '';
    loadFiles();
    updateStorageUsage();
  } catch (err) {
    alert('Upload failed');
  }
});

// 📁 Load Files
async function loadFiles() {
  const list = document.getElementById('fileList');
  list.innerHTML = '';

  try {
    const res = await fetch('/files');
    const files = await res.json();

    files.forEach(file => {
      const li = document.createElement('li');
      li.innerHTML = `
        ${file.name} (${(file.size / (1024 ** 2)).toFixed(2)} MB)
        <a href="/download/${encodeURIComponent(file.name)}" target="_blank">Download</a>
        <button onclick="deleteFile('${encodeURIComponent(file.name)}')">Delete</button>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    list.innerHTML = '<li>Error loading files</li>';
  }
}

// ❌ Delete File
async function deleteFile(filename) {
  if (!confirm(`Delete ${decodeURIComponent(filename)}?`)) return;

  try {
    const res = await fetch(`/delete/${filename}`, { method: 'DELETE' });
    const msg = await res.text();
    alert(msg);
    loadFiles();
    updateStorageUsage();
  } catch (err) {
    alert('Failed to delete file');
  }
}

// 📊 Update Storage Usage
async function updateStorageUsage() {
  try {
    const res = await fetch('/storage-usage');
    const { used, max } = await res.json();

    const percent = ((used / max) * 100).toFixed(2);
    document.getElementById('progressCircle').textContent = `${percent}%`;
    document.querySelector('.circle').style.background = `conic-gradient(#7a5cf2 0% ${percent}%, #eee ${percent}% 100%)`;
    document.getElementById('freeSpace').textContent = `${((max - used) / (1024 ** 3)).toFixed(2)} GB free`;
    document.getElementById('usedSpace').textContent = `${(used / (1024 ** 3)).toFixed(2)} GB used`;
  } catch (err) {
    console.error('Failed to fetch storage usage');
  }
}

// 🚀 Initialize UI
loadFiles();
updateStorageUsage();
import { auth, provider, signInWithPopup, signOut, onAuthStateChanged } from './firebase.js';

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

loginBtn.onclick = () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      console.log("Signed in as:", user.displayName);
      loginBtn.style.display = "none";
      logoutBtn.style.display = "block";
      // Show upload UI
    })
    .catch((error) => {
      console.error("Login failed:", error);
    });
};

logoutBtn.onclick = () => {
  signOut(auth).then(() => {
    console.log("Signed out");
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
    // Hide upload UI
  });
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
    // Enable file upload
  } else {
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
    // Disable file upload
  }
});
