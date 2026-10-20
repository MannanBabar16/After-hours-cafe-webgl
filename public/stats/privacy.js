const button = document.getElementById("toggle"),
  status = document.getElementById("status");
function render() {
  try {
    const off = localStorage.getItem("ahc-analytics-optout") === "1";
    button.textContent = off
      ? "Allow anonymous analytics"
      : "Turn off analytics";
    status.textContent = off
      ? "Analytics is off in this browser. Your game save is unchanged."
      : "Analytics is allowed unless your browser sends Do Not Track or Global Privacy Control.";
  } catch {
    button.disabled = true;
    status.textContent =
      "Browser storage is blocked. Use your browser’s Do Not Track setting or open the game with ?analytics=off to disable tracking.";
  }
}
button.addEventListener("click", () => {
  try {
    localStorage.setItem(
      "ahc-analytics-optout",
      localStorage.getItem("ahc-analytics-optout") === "1" ? "0" : "1",
    );
    render();
  } catch {
    render();
  }
});
render();
