// Select elements
let sidebar = document.querySelector(".sidebar");
let closeBtn = document.querySelector("#btn"); // Matches the ID in HTML

// Toggle sidebar on hamburger click
closeBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    menuBtnChange(); // Update hamburger icon
});

// Function to change hamburger icon
function menuBtnChange() {
    if (sidebar.classList.contains("open")) {
        closeBtn.textContent = "close"; // Change to close icon
    } else {
        closeBtn.textContent = "menu"; // Change back to menu icon
    }
}