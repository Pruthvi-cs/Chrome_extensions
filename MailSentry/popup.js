
const analyzeBtn = document.getElementById("analyzeBtn");
const emailHeaders = document.getElementById("emailHeaders");
const results = document.getElementById("results");

analyzeBtn.addEventListener("click", () => {
    const headers = emailHeaders.value.trim();

    if (!headers) {
        results.textContent = "Please paste email headers first.";
        return;
    }

    results.textContent =
        "Headers received. The analysis engine is coming next!";
});
