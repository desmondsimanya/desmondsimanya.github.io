const projectGrid = document.querySelector("#portfolio-grid");
const portfolioStatus = document.querySelector("#portfolio-status");
const projectPreview = document.querySelector("#project-preview");
const projectPreviewImage = document.querySelector("#project-preview-image");
const projectPreviewCaption = document.querySelector("#project-preview-caption");
const projectPreviewClose = document.querySelector(".project-preview-close");
const config = window.portfolioSupabaseConfig;

const categoryLabels = {
  branding: "Branding",
  "graphic-design": "Graphic design",
  websites: "Websites",
  "ui-ux": "UI/UX & Apps",
  other: "Other"
};

function showProjectPreview(project, imageUrl, trigger) {
  if (
    !projectPreview ||
    !projectPreviewImage ||
    !projectPreviewCaption ||
    typeof projectPreview.showModal !== "function"
  ) {
    window.open(imageUrl, "_blank", "noopener,noreferrer");
    return;
  }

  projectPreviewImage.src = imageUrl;
  projectPreviewImage.alt = project.alt_text || project.title;
  projectPreviewCaption.textContent = project.title;
  projectPreview.showModal();
  projectPreviewClose?.focus();

  projectPreview.addEventListener(
    "close",
    () => {
      trigger.focus();
      projectPreviewImage.removeAttribute("src");
    },
    { once: true }
  );
}

if (projectPreview && projectPreviewClose) {
  projectPreviewClose.addEventListener("click", () => projectPreview.close());

  projectPreview.addEventListener("click", (event) => {
    if (event.target === projectPreview) {
      projectPreview.close();
    }
  });
}

async function loadPublishedProjects() {
  if (!window.supabase?.createClient || !config?.url || !config?.publishableKey) {
    portfolioStatus.textContent = "Could not connect to the portfolio service.";
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey);

  const { data: projects, error } = await client
    .from("portfolio_projects")
    .select("id, title, category, image_path, alt_text, project_url")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    portfolioStatus.textContent = `Could not load projects: ${error.message}`;
    return;
  }

  projectGrid.replaceChildren();

  for (const project of projects) {
    const categoryLabel = categoryLabels[project.category];

    if (!categoryLabel) continue;

    const card = document.createElement("article");
    card.className = "portfolio-card";
    card.dataset.category = project.category;

    const title = document.createElement("h2");
    title.textContent = project.title;

    const category = document.createElement("p");
    category.textContent = categoryLabel;

    if (project.category === "websites") {
      if (project.project_url) {
        const websiteLink = document.createElement("a");
        websiteLink.className = "website-project-link";
        websiteLink.href = project.project_url;
        websiteLink.target = "_blank";
        websiteLink.rel = "noopener noreferrer";
        websiteLink.setAttribute("aria-label", `Visit ${project.title}`);

        const websiteIcon = document.createElement("span");
        websiteIcon.className = "website-project-icon";
        websiteIcon.setAttribute("aria-hidden", "true");
        websiteIcon.textContent = "↗";

        const visitLabel = document.createElement("span");
        visitLabel.textContent = "Visit website";

        websiteLink.append(websiteIcon, visitLabel);
        card.append(websiteLink, title, category);
      } else {
        const missingLink = document.createElement("div");
        missingLink.className = "website-project-link website-project-unavailable";
        missingLink.textContent = "Website link not added yet";
        card.append(missingLink, title, category);
      }
    } else if (project.image_path) {
      const { data } = client.storage
        .from("portfolio-images")
        .getPublicUrl(project.image_path);

      const imageButton = document.createElement("button");
      imageButton.className = "portfolio-image-button";
      imageButton.type = "button";
      imageButton.setAttribute(
        "aria-label",
        `View larger image: ${project.title}`
      );

      const image = document.createElement("img");
      image.className = "portfolio-art";
      image.src = data.publicUrl;
      image.alt = project.alt_text || project.title;
      image.loading = "lazy";

      imageButton.append(image);
      imageButton.addEventListener("click", () => {
        showProjectPreview(project, data.publicUrl, imageButton);
      });

      card.append(imageButton, title, category);
    } else {
      continue;
    }

    projectGrid.append(card);
  }

  if (projectGrid.children.length === 0) {
    portfolioStatus.textContent =
      "No published projects yet. Publish a project from the admin page.";
    portfolioStatus.hidden = false;
  } else {
    portfolioStatus.hidden = true;
  }
}

loadPublishedProjects();
