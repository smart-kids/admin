/**
 * Centralized utility to dynamically update the browser tab title,
 * favicon, apple-touch-icon (for iOS PWA), theme-color, and PWA manifest
 * to match the selected school's branding.
 */
export const applySchoolBranding = (school) => {
  if (!school) return;

  try {
    const appName = school.name || "Shule Plus";
    const activeLogo = school.logoUrl || school.logo || "/logo192.png";
    const themeColor = school.theme_color || school.themeColor || "#1cac81";

    // 1. Update browser tab title
    document.title = `${appName} | Shule Plus`;

    // 2. Update standard Favicon (target id="favicon" first, then fallback to shortcut/standard icon links)
    const favicon = document.getElementById("favicon") || 
                    document.querySelector("link[rel='shortcut icon']") || 
                    document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href = activeLogo;
    }

    // 3. Update Apple Touch Icon for iOS PWA Homescreen installations
    const appleIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (appleIcon) {
      appleIcon.href = activeLogo;
    }

    // 4. Update dynamic layout theme color
    const themeColorMeta = document.getElementById("theme-color-meta") || document.querySelector("meta[name='theme-color']");
    if (themeColorMeta) {
      themeColorMeta.content = themeColor;
    }

    // 5. Generate and inject Dynamic PWA Manifest for Custom App Name & Homescreen Icon
    const manifestLink = document.querySelector("link[rel='manifest']");
    if (manifestLink) {
      const manifestObj = {
        "short_name": appName,
        "name": appName,
        "icons": [
          {
            "src": activeLogo,
            "sizes": "64x64 32x32 24x24 16x16",
            "type": "image/png"
          },
          {
            "src": activeLogo,
            "type": "image/png",
            "sizes": "192x192",
            "purpose": "any maskable"
          },
          {
            "src": activeLogo,
            "type": "image/png",
            "sizes": "512x512",
            "purpose": "any maskable"
          }
        ],
        "start_url": ".",
        "display": "standalone",
        "theme_color": themeColor,
        "background_color": "#ffffff"
      };

      const stringManifest = JSON.stringify(manifestObj);
      const blob = new Blob([stringManifest], { type: 'application/json' });
      const manifestURL = URL.createObjectURL(blob);
      manifestLink.setAttribute('href', manifestURL);
    }
  } catch (err) {
    console.warn("Failed to apply dynamic school branding:", err);
  }
};
