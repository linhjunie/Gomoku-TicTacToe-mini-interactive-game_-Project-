<script>
    document.getElementById("menu-toggle").addEventListener("click", function () {
        let sidebar = document.getElementById("sidebar");
        let button = document.getElementById("menu-toggle");

        if (sidebar.classList.contains("hidden")) {
            sidebar.classList.remove("hidden");
            button.innerText = "☰ Cacher Menu"; // Đổi chữ thành "Cacher Menu"
        } else {
            sidebar.classList.add("hidden");
            button.innerText = "☰ Afficher Menu"; // Khi menu ẩn, đổi chữ thành "Afficher Menu"
        }
    });
</script>
