const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#primary-navigation");

if (menuToggle && siteNav) {
  function closeMenu() {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    siteNav.classList.remove("is-open");
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation" : "Close navigation"
    );
    siteNav.classList.toggle("is-open", !isOpen);
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 700) {
      closeMenu();
    }
  });
}

const portfolioFilters = document.querySelector(".portfolio-filters");
const portfolioGrid = document.querySelector("#portfolio-grid");
const filterStatusMessage = document.querySelector("#portfolio-status");

if (portfolioFilters && portfolioGrid && filterStatusMessage) {
  function applyPortfolioFilter(button) {
    const selectedCategory = button.dataset.filter;
    const cards = portfolioGrid.querySelectorAll(".portfolio-card");
    let visibleCount = 0;

    portfolioFilters.querySelectorAll("[data-filter]").forEach((filterButton) => {
      filterButton.setAttribute(
        "aria-pressed",
        String(filterButton === button)
      );
    });

    cards.forEach((card) => {
      const matches =
        selectedCategory === "all" ||
        card.dataset.category === selectedCategory;

      card.hidden = !matches;

      if (matches) {
        visibleCount += 1;
      }
    });

    if (visibleCount > 0) {
      filterStatusMessage.hidden = true;
    } else {
      filterStatusMessage.textContent =
        selectedCategory === "all"
          ? "No published projects yet. New work will appear here as it is published."
          : "No projects in this category yet. New work will appear here as I create it.";
      filterStatusMessage.hidden = false;
    }
  }

  portfolioFilters.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest("[data-filter]");
    if (!button || !portfolioFilters.contains(button)) return;

    applyPortfolioFilter(button);
  });

  const cardsObserver = new MutationObserver(() => {
    const selectedButton = portfolioFilters.querySelector(
      '[aria-pressed="true"]'
    );

    if (selectedButton && portfolioGrid.querySelector(".portfolio-card")) {
      applyPortfolioFilter(selectedButton);
    }
  });

  cardsObserver.observe(portfolioGrid, { childList: true });
}