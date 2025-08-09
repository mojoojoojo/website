// Default users
const defaultData = {
    users: [
        { id: "admin", password: "admin-0101", role: "admin" },
        { id: "12-1234-567", password: "12-1234-567-0531", role: "student", name: "Juan Dela Cruz", image: "" }
    ],
    students: [],
    attendance: [],
    grades: [],
    schedule: []
};

if (!localStorage.getItem("studentSystem")) {
    localStorage.setItem("studentSystem", JSON.stringify(defaultData));
}

function login() {
    const id = document.getElementById("loginId").value.trim();
    const pass = document.getElementById("loginPassword").value.trim();
    const data = JSON.parse(localStorage.getItem("studentSystem"));

    const user = data.users.find(u => u.id === id && u.password === pass);
    if (user) {
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        if (user.role === "admin") {
            document.getElementById("loginPage").classList.remove("active");
            document.getElementById("adminPanel").classList.add("active");
            showAdminSection('home');
        } else {
            document.getElementById("loginPage").classList.remove("active");
            document.getElementById("studentPanel").classList.add("active");
            document.getElementById("studentContent").innerHTML = `<h3>Welcome, ${user.name}</h3>`;
        }
    } else {
        alert("Invalid credentials!");
    }
}

function logout() {
    localStorage.removeItem("loggedInUser");
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById("loginPage").classList.add("active");
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

// Restore theme on load
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

function showAdminSection(section) {
    const content = document.getElementById("adminContent");
    if (section === "home") {
        content.innerHTML = "<h3>Admin Home</h3><p>Welcome to the admin panel.</p>";
    }
    if (section === "students") {
        renderStudents(content);
    }
}

function renderStudents(content) {
    const data = JSON.parse(localStorage.getItem("studentSystem"));
    content.innerHTML = `<h3>Manage Students</h3>`;
    data.students.forEach(s => {
        content.innerHTML += `
        <div>
            <img src="${s.image || 'https://via.placeholder.com/100'}" class="student-image">
            <p>${s.name}</p>
        </div>`;
    });
}
