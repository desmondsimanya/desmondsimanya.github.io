const projectGrid = document.querySelector("#portfolio-grid");
const portfolioStatus = document.querySelector("#portfolio-status");
const config = window.portfolioSupabaseConfig;

const categoryLabels = {
  branding: "Branding",
  "graphic-design": "Graphic design",
  websites: "Websites",
  "ui-ux": "UI/UX & Apps",
  other: "Other"
};

async function loadPublishedProjects() {
  if (!window.supabase?.createClient || !config?.url || !config?.publishableKey) {
    portfolioStatus.textContent = "Could not connect to the portfolio service.";
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey);

  const { data: projects, error } = await client
    .from("portfolio_projects")
    .select("id, title, category, image_path, alt_text")
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

    const { data } = client.storage
      .from("portfolio-images")
      .getPublicUrl(project.image_path);

    const card = document.createElement("article");
    card.className = "portfolio-card";
    card.dataset.category = project.category;

    const image = document.createElement("img");
    image.className = "portfolio-art";
    image.src = data.publicUrl;
    image.alt = project.alt_text;
    image.loading = "lazy";

    const title = document.createElement("h2");
    title.textContent = project.title;

    const category = document.createElement("p");
    category.textContent = categoryLabel;

    card.append(image, title, category);
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