// Mobile nav toggle. Keeps aria-expanded in sync with the visible state so
// screen readers announce open/closed correctly.
(function () {
  var btn = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();
