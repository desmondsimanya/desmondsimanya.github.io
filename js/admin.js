const statusMessage = document.querySelector("#admin-status");
const loginPanel = document.querySelector("#login-panel");
const uploadPanel = document.querySelector("#upload-panel");
const projectsPanel = document.querySelector("#projects-panel");
const projectsStatus = document.querySelector("#projects-status");
const projectList = document.querySelector("#admin-project-list");
const loginForm = document.querySelector("#login-form");
const uploadForm = document.querySelector("#upload-form");
const signOutButton = document.querySelector("#sign-out");
const projectCategoryInput = document.querySelector("#project-category");
const projectImageFields = document.querySelector("#project-image-fields");
const projectWebsiteFields = document.querySelector("#project-website-fields");
const projectAltInput = document.querySelector("#project-alt");
const projectImageInput = document.querySelector("#project-image");
const projectUrlInput = document.querySelector("#project-url");
const projectSubmitButton = document.querySelector("#project-submit");
const config = window.portfolioSupabaseConfig;

const categoryLabels = {
  branding: "Branding",
  "graphic-design": "Graphic design",
  websites: "Websites",
  "ui-ux": "UI/UX & Apps",
  other: "Other"
};

if (
  !statusMessage ||
  !loginPanel ||
  !uploadPanel ||
  !projectsPanel ||
  !projectsStatus ||
  !projectList ||
  !loginForm ||
  !uploadForm ||
  !signOutButton ||
  !projectCategoryInput ||
  !projectImageFields ||
  !projectWebsiteFields ||
  !projectAltInput ||
  !projectImageInput ||
  !projectUrlInput ||
  !projectSubmitButton
) {
  console.error("Admin page is missing required elements.");
} else if (
  !window.supabase?.createClient ||
  !config?.url ||
  !config?.publishableKey
) {
  statusMessage.textContent =
    "Could not connect to Supabase. Check that the Supabase library and config loaded.";
} else {
  const supabaseClient = window.supabase.createClient(
    config.url,
    config.publishableKey
  );

  function setStatus(message) {
    statusMessage.textContent = message;
  }

  function showSession(session) {
    loginPanel.hidden = Boolean(session);
    uploadPanel.hidden = !session;
    projectsPanel.hidden = !session;

    if (session) {
      loadProjects();
    } else {
      projectList.replaceChildren();
    }
  }

  async function loadProjects() {
    projectsStatus.textContent = "Loading projects…";
    projectsStatus.hidden = false;
    projectList.replaceChildren();

    const { data: projects, error } = await supabaseClient
      .from("portfolio_projects")
      .select("id, title, category, image_path, project_url, is_published")
      .order("created_at", { ascending: false });

    if (error) {
      projectsStatus.textContent = `Could not load projects: ${error.message}`;
      return;
    }

    if (projects.length === 0) {
      projectsStatus.textContent = "You haven’t uploaded any projects yet.";
      return;
    }

    projectsStatus.hidden = true;

    for (const project of projects) {
      const item = document.createElement("article");
      item.className = "admin-project-item";

      const details = document.createElement("div");
      details.className = "admin-project-details";

      const title = document.createElement("h3");
      title.textContent = project.title;

      const category = document.createElement("p");
      category.textContent =
        categoryLabels[project.category] || project.category;

      if (project.category === "websites" && project.project_url) {
        const websiteLink = document.createElement("a");
        websiteLink.href = project.project_url;
        websiteLink.target = "_blank";
        websiteLink.rel = "noopener noreferrer";
        websiteLink.textContent = "Open website";
        details.append(websiteLink);
      }

      const publication = document.createElement("p");
      publication.textContent = project.is_published ? "Published" : "Unpublished";
      publication.className = project.is_published
        ? "admin-project-published"
        : "admin-project-unpublished";

      const actions = document.createElement("div");
      actions.className = "admin-project-actions";

      const publishButton = document.createElement("button");
      publishButton.type = "button";
      publishButton.className = "button button-small";
      publishButton.textContent = project.is_published
        ? "Unpublish"
        : "Publish";
      publishButton.addEventListener("click", () => {
        updateProjectPublication(project.id, !project.is_published);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "admin-delete-button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        deleteProject(project);
      });

      details.append(title, category, publication);
      actions.append(publishButton, deleteButton);
      item.append(details, actions);
      projectList.append(item);
    }
  }

  async function updateProjectPublication(projectId, isPublished) {
    projectsStatus.textContent = "Updating project…";
    projectsStatus.hidden = false;

    const { error } = await supabaseClient
      .from("portfolio_projects")
      .update({ is_published: isPublished })
      .eq("id", projectId);

    if (error) {
      projectsStatus.textContent = `Could not update project: ${error.message}`;
      return;
    }

    projectsStatus.textContent = isPublished
      ? "Project published."
      : "Project unpublished.";

    await loadProjects();
  }

  async function deleteProject(project) {
    const confirmed = window.confirm(
      `Delete "${project.title}"? This removes it from your portfolio.`
    );

    if (!confirmed) return;

    projectsStatus.textContent = "Deleting project…";
    projectsStatus.hidden = false;

    const { error: deleteRowError } = await supabaseClient
      .from("portfolio_projects")
      .delete()
      .eq("id", project.id);

    if (deleteRowError) {
      projectsStatus.textContent =
        `Could not delete project: ${deleteRowError.message}`;
      return;
    }

    if (!project.image_path) {
      projectsStatus.textContent = "Project deleted.";
      await loadProjects();
      return;
    }

    const { error: deleteImageError } = await supabaseClient.storage
      .from("portfolio-images")
      .remove([project.image_path]);

    if (deleteImageError) {
      projectsStatus.textContent =
        `Project removed, but its image could not be deleted: ${deleteImageError.message}`;
      await loadProjects();
      return;
    }

    projectsStatus.textContent = "Project deleted.";
    await loadProjects();
  }

  async function checkSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      setStatus(`Could not check sign-in status: ${error.message}`);
      return;
    }

    showSession(data.session);
  }

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    showSession(session);
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Signing in…");

    const formData = new FormData(loginForm);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: formData.get("email"),
      password: formData.get("password")
    });

    if (error) {
      setStatus(`Sign-in failed: ${error.message}`);
      return;
    }

    showSession(data.session);
    setStatus("Signed in.");
  });

  signOutButton.addEventListener("click", async () => {
    setStatus("Signing out…");

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      setStatus(`Sign-out failed: ${error.message}`);
      return;
    }

    showSession(null);
    setStatus("You are signed out.");
  });

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(uploadForm);
    const isWebsite = formData.get("category") === "websites";
    const image = formData.get("image");
    const allowedTypes = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };
    const maxFileSize = 5 * 1024 * 1024;
    let websiteUrl = "";

    if (isWebsite) {
      try {
        const parsedUrl = new URL(String(formData.get("project_url")));

        if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
          throw new Error("Use an http or https website link.");
        }

        websiteUrl = parsedUrl.href;
      } catch {
        setStatus("Enter a valid website link starting with https://.");
        return;
      }
    } else {
      if (!(image instanceof File) || image.size === 0) {
        setStatus("Choose an image to upload.");
        return;
      }

      if (!allowedTypes[image.type]) {
        setStatus("Choose a JPG, PNG, or WebP image.");
        return;
      }

      if (image.size > maxFileSize) {
        setStatus("That image is larger than 5 MB. Choose a smaller file.");
        return;
      }
    }

    setStatus(isWebsite ? "Saving your website project…" : "Uploading your project…");

    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
      setStatus("Your session has expired. Sign in again before uploading.");
      showSession(null);
      return;
    }

    let imagePath = "";

    if (!isWebsite) {
      imagePath =
        `${userData.user.id}/${crypto.randomUUID()}.${allowedTypes[image.type]}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("portfolio-images")
        .upload(imagePath, image, {
          contentType: image.type,
          upsert: false
        });

      if (uploadError) {
        setStatus(`Image upload failed: ${uploadError.message}`);
        return;
      }
    }

    const { error: projectError } = await supabaseClient
      .from("portfolio_projects")
      .insert({
        title: formData.get("title"),
        category: formData.get("category"),
        image_path: imagePath,
        alt_text: isWebsite ? "" : formData.get("alt_text"),
        project_url: isWebsite ? websiteUrl : null,
        is_published: formData.get("is_published") === "on"
      });

    if (projectError) {
      if (isWebsite) {
        setStatus(
          `Website project could not be saved: ${projectError.message}. ` +
          `Confirm the project_url column exists in portfolio_projects.`
        );
        return;
      }

      const { error: cleanupError } = await supabaseClient.storage
        .from("portfolio-images")
        .remove([imagePath]);

      if (cleanupError) {
        setStatus(
          `Project could not be saved: ${projectError.message}. ` +
          `The uploaded image could not be removed: ${cleanupError.message}`
        );
        return;
      }

      setStatus(`Project could not be saved: ${projectError.message}`);
      return;
    }

    uploadForm.reset();
    updateProjectFields();
    setStatus("Project uploaded successfully.");
    await loadProjects();
  });

  function updateProjectFields() {
    const isWebsite = projectCategoryInput.value === "websites";

    projectImageFields.hidden = isWebsite;
    projectWebsiteFields.hidden = !isWebsite;
    projectAltInput.required = !isWebsite;
    projectImageInput.required = !isWebsite;
    projectUrlInput.required = isWebsite;
    projectSubmitButton.textContent = isWebsite
      ? "Add website link"
      : "Upload project";
  }

  projectCategoryInput.addEventListener("change", updateProjectFields);
  updateProjectFields();

  checkSession();
}
