// Prevent default behavior for disabled links
document.querySelectorAll('.disabled').forEach(link => {
    link.addEventListener('click', e => e.preventDefault());
});

// Sidebar toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const isExpanded = !sidebar.classList.contains('collapsed');
            sidebarToggle.setAttribute('aria-expanded', isExpanded);
        });
    }
});