// OZS Studio kapalı beta formları → Google Sheet (Google Apps Script web uygulaması)
// Apps Script'i yayınladıktan sonra aldığın "Web uygulaması URL'sini" aşağıya yapıştır.
var BETA_ENDPOINT = "";

(function () {
  var q = new URLSearchParams(location.search);

  document.querySelectorAll("form.beta-form").forEach(function (form) {
    var box = form.closest(".beta");
    var btn = form.querySelector("button");
    var formErr = form.querySelector(".formerr");

    // Reklam linkindeki UTM bilgileri (hangi reklamdan geldiğini Sheet'te görmek için)
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(function (k) {
      if (form.elements[k]) form.elements[k].value = (q.get(k) || "").slice(0, 100);
    });
    if (form.elements.ref) form.elements.ref.value = (document.referrer || "").slice(0, 200);

    function setErr(name, on) {
      var el = form.elements[name];
      var b = el && (el.closest(".f") || el.closest(".chk"));
      if (b) b.classList.toggle("err", on);
    }
    form.addEventListener("input", function (e) { if (e.target.name) setErr(e.target.name, false); });
    form.addEventListener("change", function (e) { if (e.target.name) setErr(e.target.name, false); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      formErr.style.display = "none";
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim().toLowerCase();
      form.elements.email.value = email;
      var ok = true;
      if (name.length < 2) { setErr("name", true); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setErr("email", true); ok = false; }
      if (!form.elements.android.checked) { setErr("android", true); ok = false; }
      if (!form.elements.consent.checked) { setErr("consent", true); ok = false; }
      if (!ok) return;

      if (!BETA_ENDPOINT) {
        formErr.textContent = "Form henüz bağlanmadı. Lütfen biraz sonra tekrar dene.";
        formErr.style.display = "block";
        return;
      }

      var data = new URLSearchParams(new FormData(form));
      data.set("page", location.pathname + location.hash);
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = "Gönderiliyor…";

      function success() { box.classList.add("sent"); }
      function fail() {
        btn.disabled = false;
        btn.textContent = label;
        formErr.textContent = "Bir sorun oldu, bağlantını kontrol edip tekrar dener misin?";
        formErr.style.display = "block";
      }

      fetch(BETA_ENDPOINT, { method: "POST", body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.ok) success();
          else if (res && res.error === "email") { btn.disabled = false; btn.textContent = label; setErr("email", true); }
          else fail();
        })
        .catch(function () {
          // Google'ın yönlendirmesi okunamazsa kaydı yine gönder (Sheet aynı Gmail'i ikinci kez eklemez).
          fetch(BETA_ENDPOINT, { method: "POST", body: data, mode: "no-cors" }).then(success, fail);
        });
    });
  });
})();
