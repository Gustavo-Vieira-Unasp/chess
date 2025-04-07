// Sidebar toggle functionality
const btn = document.querySelector("#btn");
const sidebar = document.querySelector(".sidebar");

btn.addEventListener("click", () => {
  // Toggle the 'open' class on the sidebar
  sidebar.classList.toggle("open");

  // Update the button icon based on the sidebar state
  const isSidebarOpen = sidebar.classList.contains("open");
  btn.setAttribute("aria-expanded", isSidebarOpen);

  if (isSidebarOpen) {
    btn.classList.remove("bx-menu");
    btn.classList.add("bx-x"); // Change to close icon
  } else {
    btn.classList.remove("bx-x");
    btn.classList.add("bx-menu"); // Change back to menu icon
  }
});