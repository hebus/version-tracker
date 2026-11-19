/**
 * Synchronise la classe `.dark` de <html> avec `prefers-color-scheme`.
 * Le variant Tailwind `dark` de shadcn est basé sur cette classe.
 */
export function initTheme(): void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () =>
    document.documentElement.classList.toggle("dark", media.matches);

  apply();
  media.addEventListener("change", apply);
}
