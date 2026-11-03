const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#primary-navigation");

if (
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
  );

  function observeRevealElements(root) {
    if (root instanceof Element && root.matches(".portfolio-card")) {
      root.classList.add("reveal-on-scroll");
      revealObserver.observe(root);
    }

    root.querySelectorAll?.(
      "main > section, .portfolio-card, .service-card, .contact-card"
    ).forEach((element) => {
      element.classList.add("reveal-on-scroll");
      revealObserver.observe(element);
    });
  }

  document.documentElement.classList.add("motion-ready");
  observeRevealElements(document);

  const contentObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          observeRevealElements(node);
        }
      });
    });
  });

  contentObserver.observe(document.querySelector("main"), {
    childList: true,
    subtree: true
  });
}

if (siteNav) {
  const sectionLinks = Array.from(
    siteNav.querySelectorAll('a[href^="#"]')
  ).filter((link) => document.querySelector(link.getAttribute("href")));

  function setActiveSection(link) {
    sectionLinks.forEach((sectionLink) => {
      if (sectionLink === link) {
        sectionLink.setAttribute("aria-current", "location");
      } else {
        sectionLink.removeAttribute("aria-current");
      }
    });
  }

  function updateActiveSection() {
    const activationPoint =
      window.scrollY + (document.querySelector(".site-header")?.offsetHeight || 0) + 40;
    let activeLink = sectionLinks[0];

    sectionLinks.forEach((link) => {
      const section = document.querySelector(link.getAttribute("href"));

      if (section && section.offsetTop <= activationPoint) {
        activeLink = link;
      }
    });

    if (activeLink) {
      setActiveSection(activeLink);
    }
  }

  siteNav.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const link = event.target.closest('a[href^="#"]');
    if (link && sectionLinks.includes(link)) {
      setActiveSection(link);
    }
  });

  let activeSectionFrame = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (activeSectionFrame) return;

      activeSectionFrame = window.requestAnimationFrame(() => {
        updateActiveSection();
        activeSectionFrame = 0;
      });
    },
    { passive: true }
  );

  window.addEventListener("resize", updateActiveSection);
  updateActiveSection();
}

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
