    const btn = document.querySelector("#btn");
    const sidebar = document.querySelector(".sidebar");

    btn.addEventListener("click", () => {
      sidebar.classList.toggle("open");

      if (sidebar.classList.contains("open")) {
        btn.classList.remove("bx-menu");
        btn.classList.add("bx-x");
      } else {
        btn.classList.remove("bx-x");
        btn.classList.add("bx-menu");
      }
    })