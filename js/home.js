const homeProjectGrid = document.querySelector("#home-projects");
const homeProjectStatus = document.querySelector("#home-projects-status");
const homeSupabaseConfig = window.portfolioSupabaseConfig;

const homeCategoryLabels = {
  branding: "Branding",
  "graphic-design": "Graphic design",
  websites: "Websites",
  "ui-ux": "UI/UX & Apps",
  other: "Other"
};

async function loadHomeProjects() {
  if (
    !window.supabase?.createClient ||
    !homeSupabaseConfig?.url ||
    !homeSupabaseConfig?.publishableKey
  ) {
    homeProjectStatus.textContent = "Could not connect to the portfolio service.";
    return;
  }

  const client = window.supabase.createClient(
    homeSupabaseConfig.url,
    homeSupabaseConfig.publishableKey
  );

  const { data: projects, error } = await client
    .from("portfolio_projects")
    .select("id, title, category, image_path, alt_text, project_url")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    homeProjectStatus.textContent = `Could not load projects: ${error.message}`;
    return;
  }

  homeProjectGrid.replaceChildren();

  for (const project of projects) {
    const categoryLabel = homeCategoryLabels[project.category];

    if (!categoryLabel) continue;
    if (project.category === "websites" && !project.project_url) continue;

    const card = document.createElement("a");
    card.className = "work-card";
    card.href =
      project.category === "websites" && project.project_url
        ? project.project_url
        : "work.html";
    if (project.category === "websites" && project.project_url) {
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }

    const title = document.createElement("h3");
    title.textContent = project.title;

    const category = document.createElement("p");
    category.textContent = categoryLabel;

    if (project.category === "websites" && project.project_url) {
      const websiteLinkLabel = document.createElement("span");
      websiteLinkLabel.className = "website-project-link";
      websiteLinkLabel.textContent = "Visit website ↗";
      card.append(websiteLinkLabel, title, category);
    } else if (project.image_path) {
      const { data } = client.storage
        .from("portfolio-images")
        .getPublicUrl(project.image_path);

      const image = document.createElement("img");
      image.className = "portfolio-art";
      image.src = data.publicUrl;
      image.alt = project.alt_text || project.title;
      image.loading = "lazy";
      card.append(image, title, category);
    } else {
      continue;
    }

    homeProjectGrid.append(card);
  }

  if (homeProjectGrid.children.length === 0) {
    homeProjectStatus.textContent =
      "No published projects yet. New work will appear here as it’s published.";
    homeProjectStatus.hidden = false;
  } else {
    homeProjectStatus.hidden = true;
  }
}

loadHomeProjects();
