import { useEffect, useState } from "react";
import {
  clearStoredAdminSession,
  createAdminProject,
  fetchAdminProjects,
  getStoredAdminSession,
  loginAdmin,
  reorderAdminProjects,
  updateAdminProject,
  deleteAdminProject,
} from "../services/adminApi";

const DEFAULT_FORM_STATE = {
  videoUrl: "",
  title: "",
  thumbnailUrl: "",
  order: "",
  gridStyle: "full",
  isAi: false,
};

const GRID_STYLE_OPTIONS = [
  { value: "full", label: "Full frame" },
  { value: "half-top", label: "Half top" },
  { value: "half-bottom", label: "Half bottom" },
];

const EMPTY_SESSION = {
  token: "",
  name: "Admin",
};

const sortProjects = (items = []) =>
  [...items].sort((left, right) => {
    const leftOrder = Number.isInteger(left?.order)
      ? left.order
      : Number.MAX_SAFE_INTEGER;
    const rightOrder = Number.isInteger(right?.order)
      ? right.order
      : Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return (
      new Date(left?.createdAt || 0).getTime() -
      new Date(right?.createdAt || 0).getTime()
    );
  });

const createLayoutSignature = (items = []) =>
  JSON.stringify(
    items.map((project, index) => ({
      id: project._id,
      order: index + 1,
      gridStyle: project.gridStyle || "full",
    })),
  );

const isAuthError = (message = "") =>
  /authentication is required|session is invalid|session is no longer valid|expired/i.test(
    message,
  );

const buildCreatePayload = (formState) => {
  const payload = {
    videoUrl: formState.videoUrl.trim(),
    gridStyle: formState.gridStyle,
    isAi: formState.isAi,
  };

  if (formState.title.trim()) {
    payload.title = formState.title.trim();
  }

  if (formState.thumbnailUrl.trim()) {
    payload.thumbnailUrl = formState.thumbnailUrl.trim();
  }

  if (formState.order.trim()) {
    payload.order = Number(formState.order);
  }

  return payload;
};

function AdminPage() {
  const [session, setSession] = useState(() => getStoredAdminSession());
  const [password, setPassword] = useState("");
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);
  const [projects, setProjects] = useState([]);
  const [savedLayoutSignature, setSavedLayoutSignature] = useState(
    createLayoutSignature(),
  );
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(
    Boolean(getStoredAdminSession().token),
  );
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);

  const hasLayoutChanges =
    createLayoutSignature(projects) !== savedLayoutSignature;

  useEffect(() => {
    if (!session.token) {
      setProjects([]);
      setSavedLayoutSignature(createLayoutSignature());
      setIsLoadingProjects(false);
      return undefined;
    }

    let isCancelled = false;

    const loadProjects = async () => {
      setIsLoadingProjects(true);
      setErrorMessage("");

      try {
        const nextProjects = sortProjects(
          await fetchAdminProjects(session.token),
        );

        if (isCancelled) {
          return;
        }

        setProjects(nextProjects);
        setSavedLayoutSignature(createLayoutSignature(nextProjects));
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (isAuthError(error.message)) {
          clearStoredAdminSession();
          setSession(EMPTY_SESSION);
          setErrorMessage("Your admin session expired. Sign in again.");
          return;
        }

        setErrorMessage(error.message);
      } finally {
        if (!isCancelled) {
          setIsLoadingProjects(false);
        }
      }
    };

    loadProjects();

    return () => {
      isCancelled = true;
    };
  }, [session.token]);

  const handleLogout = () => {
    clearStoredAdminSession();
    setSession(EMPTY_SESSION);
    setPassword("");
    setNotice("Signed out.");
    setErrorMessage("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setErrorMessage("");
    setNotice("");

    try {
      const nextSession = await loginAdmin(password);
      setSession(nextSession);
      setPassword("");
      setNotice("Admin session ready.");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFormChange = (field) => (event) => {
    setFormState((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();

    if (!session.token) {
      return;
    }

    setIsSubmittingProject(true);
    setErrorMessage("");
    setNotice("");

    try {
      if (editingProjectId) {
        await updateAdminProject(
          session.token,
          editingProjectId,
          buildCreatePayload(formState),
        );
        setNotice("Project updated.");
        setEditingProjectId(null);
      } else {
        await createAdminProject(session.token, buildCreatePayload(formState));
        setNotice("Project added.");
      }

      const nextProjects = sortProjects(
        await fetchAdminProjects(session.token),
      );
      setProjects(nextProjects);
      setSavedLayoutSignature(createLayoutSignature(nextProjects));
      setFormState(DEFAULT_FORM_STATE);
    } catch (error) {
      if (isAuthError(error.message)) {
        handleLogout();
        setErrorMessage("Your admin session expired. Sign in again.");
      } else {
        setErrorMessage(error.message);
      }
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleEditProject = (project) => {
    setEditingProjectId(project._id);
    setFormState({
      videoUrl: project.videoUrl || "",
      title: project.title || "",
      thumbnailUrl: project.thumbnailUrl || "",
      order: project.order ? String(project.order) : "",
      gridStyle: project.gridStyle || "full",
      isAi: project.isAi || false,
    });
    setNotice("");
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setFormState(DEFAULT_FORM_STATE);
  };

  const handleDeleteProject = async (projectId) => {
    if (!session.token) return;

    if (!window.confirm("Delete this project? This cannot be undone.")) return;

    setErrorMessage("");
    setNotice("");

    try {
      await deleteAdminProject(session.token, projectId);
      const nextProjects = sortProjects(
        await fetchAdminProjects(session.token),
      );
      setProjects(nextProjects);
      setSavedLayoutSignature(createLayoutSignature(nextProjects));
      setNotice("Project deleted.");
    } catch (error) {
      if (isAuthError(error.message)) {
        handleLogout();
        setErrorMessage("Your admin session expired. Sign in again.");
      } else {
        setErrorMessage(error.message);
      }
    }
  };

  const handleRefreshProjects = async () => {
    if (!session.token) {
      return;
    }

    setIsLoadingProjects(true);
    setErrorMessage("");
    setNotice("");

    try {
      const nextProjects = sortProjects(
        await fetchAdminProjects(session.token),
      );
      setProjects(nextProjects);
      setSavedLayoutSignature(createLayoutSignature(nextProjects));
    } catch (error) {
      if (isAuthError(error.message)) {
        handleLogout();
        setErrorMessage("Your admin session expired. Sign in again.");
      } else {
        setErrorMessage(error.message);
      }
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const moveProject = (index, direction) => {
    setProjects((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const nextProjects = [...current];
      const [selectedProject] = nextProjects.splice(index, 1);
      nextProjects.splice(targetIndex, 0, selectedProject);
      return nextProjects;
    });
    setNotice("");
  };

  const updateProjectGridStyle = (projectId, nextGridStyle) => {
    setProjects((current) =>
      current.map((project) =>
        project._id === projectId
          ? {
              ...project,
              gridStyle: nextGridStyle,
            }
          : project,
      ),
    );
    setNotice("");
  };

  const handleSaveLayout = async () => {
    if (!session.token || !hasLayoutChanges) {
      return;
    }

    setIsSavingLayout(true);
    setErrorMessage("");
    setNotice("");

    try {
      const nextProjects = sortProjects(
        await reorderAdminProjects(
          session.token,
          projects.map((project) => ({
            id: project._id,
            gridStyle: project.gridStyle || "full",
          })),
        ),
      );
      setProjects(nextProjects);
      setSavedLayoutSignature(createLayoutSignature(nextProjects));
      setNotice("Project layout saved.");
    } catch (error) {
      if (isAuthError(error.message)) {
        handleLogout();
        setErrorMessage("Your admin session expired. Sign in again.");
      } else {
        setErrorMessage(error.message);
      }
    } finally {
      setIsSavingLayout(false);
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Private panel</p>
          <h1 className="admin-title">Admin</h1>
        </div>

        <div className="admin-header-actions">
          <a className="admin-link" href="/">
            View site
          </a>

          {session.token ? (
            <button
              className="admin-button admin-button-muted"
              onClick={handleLogout}
              type="button"
            >
              Log out
            </button>
          ) : null}
        </div>
      </header>

      <main className="admin-main">
        {!session.token ? (
          <section className="admin-card admin-auth-card">
            <p className="admin-eyebrow">
              Enter the admin password to manage projects.
            </p>
            <form className="admin-auth-form" onSubmit={handleLogin}>
              <label className="admin-field">
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Admin password"
                  type="password"
                  value={password}
                />
              </label>

              <button
                className="admin-button"
                disabled={isLoggingIn || !password.trim()}
                type="submit"
              >
                {isLoggingIn ? "Signing in..." : "Unlock admin"}
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="admin-grid">
              <article className="admin-card admin-card-form">
                <div className="admin-section-heading">
                  <div>
                    <p className="admin-eyebrow">Add project</p>
                    <h2>Any URL works</h2>
                  </div>
                  <p className="admin-caption">Signed in as {session.name}</p>
                </div>

                <form className="admin-form" onSubmit={handleCreateProject}>
                  <label className="admin-field admin-field-wide">
                    <span>Media URL</span>
                    <input
                      onChange={handleFormChange("videoUrl")}
                      placeholder="https://example.com/your-video-or-embed"
                      required
                      type="url"
                      value={formState.videoUrl}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Title</span>
                    <input
                      onChange={handleFormChange("title")}
                      placeholder="Optional title override"
                      type="text"
                      value={formState.title}
                    />
                  </label>

                  <label className="admin-field">
                    <span>Order</span>
                    <input
                      min="1"
                      onChange={handleFormChange("order")}
                      placeholder="Auto"
                      type="number"
                      value={formState.order}
                    />
                  </label>

                  <label className="admin-field admin-field-wide">
                    <span>Thumbnail URL</span>
                    <input
                      onChange={handleFormChange("thumbnailUrl")}
                      placeholder="Optional image URL"
                      type="url"
                      value={formState.thumbnailUrl}
                    />
                  </label>

                  <label className="admin-field admin-field-wide">
                    <span>Grid style</span>
                    <select
                      onChange={handleFormChange("gridStyle")}
                      value={formState.gridStyle}
                    >
                      {GRID_STYLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-field admin-field-wide admin-checkbox-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formState.isAi}
                      onChange={(event) => setFormState((current) => ({ ...current, isAi: event.target.checked }))}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: '#f4efe6' }}>AI Video Portfolio Item</span>
                  </label>

                  <button
                    className="admin-button admin-field-wide"
                    disabled={isSubmittingProject}
                    type="submit"
                  >
                    {isSubmittingProject
                      ? editingProjectId
                        ? "Updating..."
                        : "Adding project..."
                      : editingProjectId
                        ? "Update project"
                        : "Add project"}
                  </button>
                  {editingProjectId ? (
                    <button
                      className="admin-button admin-button-muted admin-field-wide"
                      onClick={handleCancelEdit}
                      type="button"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </form>
              </article>

              <article className="admin-card admin-card-list">
                <div className="admin-section-heading">
                  <div>
                    <p className="admin-eyebrow">Project queue</p>
                    <h2>Reorder and tune layout</h2>
                  </div>

                  <div className="admin-inline-actions">
                    <button
                      className="admin-button admin-button-muted"
                      onClick={handleRefreshProjects}
                      type="button"
                    >
                      {isLoadingProjects ? "Refreshing..." : "Refresh"}
                    </button>
                    <button
                      className="admin-button"
                      disabled={isSavingLayout || !hasLayoutChanges}
                      onClick={handleSaveLayout}
                      type="button"
                    >
                      {isSavingLayout ? "Saving..." : "Save layout"}
                    </button>
                  </div>
                </div>

                <div className="admin-project-list">
                  {projects.length ? (
                    projects.map((project, index) => (
                      <article className="admin-project-row" key={project._id}>
                        <div className="admin-project-copy">
                          <p className="admin-project-order">#{index + 1}</p>
                          <h3>{project.title}</h3>
                          <p>{project.sourceType || "external"} source {project.isAi ? " • AI Video" : ""}</p>
                          <a
                            href={project.videoUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Open media source
                          </a>
                        </div>

                        <div className="admin-project-controls">
                          <label className="admin-field admin-field-compact">
                            <span>Grid style</span>
                            <select
                              onChange={(event) =>
                                updateProjectGridStyle(
                                  project._id,
                                  event.target.value,
                                )
                              }
                              value={project.gridStyle || "full"}
                            >
                              {GRID_STYLE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <div className="admin-order-actions">
                            <button
                              className="admin-button admin-button-small admin-button-muted"
                              disabled={index === 0}
                              onClick={() => moveProject(index, -1)}
                              type="button"
                            >
                              Up
                            </button>
                            <button
                              className="admin-button admin-button-small admin-button-muted"
                              disabled={index === projects.length - 1}
                              onClick={() => moveProject(index, 1)}
                              type="button"
                            >
                              Down
                            </button>
                          </div>
                          <div className="admin-row-actions">
                            <button
                              className="admin-button admin-button-small"
                              onClick={() => handleEditProject(project)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="admin-button admin-button-small admin-button-muted"
                              onClick={() => handleDeleteProject(project._id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="admin-empty-state">
                      {isLoadingProjects
                        ? "Loading projects..."
                        : "No projects in the portfolio yet."}
                    </div>
                  )}
                </div>
              </article>
            </section>
          </>
        )}

        {notice ? (
          <p className="admin-feedback admin-feedback-success">{notice}</p>
        ) : null}
        {errorMessage ? (
          <p className="admin-feedback admin-feedback-error">{errorMessage}</p>
        ) : null}
      </main>
    </div>
  );
}

export default AdminPage;
