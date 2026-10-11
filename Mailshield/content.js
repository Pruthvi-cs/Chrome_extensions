
(() => {
    "use strict";

    const BUTTON_CLASS = "mailshield-analyze-button";
    const PANEL_ID = "mailshield-report-panel";

    console.log("MAILSHIELD_STEP_6 loaded");

    // Find the currently visible email information.
    function extractEmail(bodyElement) {
        const subjectElement =
            document.querySelector("h2.hP") ||
            document.querySelector("[data-thread-perm-id] h2");

        const messageContainer =
            bodyElement.closest(".adn") ||
            bodyElement.parentElement;

        const senderElement =
            messageContainer?.querySelector(".gD");

        const subject =
            subjectElement?.innerText?.trim() ||
            "Subject not found";

        const senderName =
            senderElement?.getAttribute("name") ||
            senderElement?.innerText?.trim() ||
            "Sender name not found";

        const senderEmail =
            senderElement?.getAttribute("email") ||
            "Sender email not available";

        const bodyText =
            bodyElement.innerText?.trim() ||
            "Email body is empty";

        const links = [
            ...bodyElement.querySelectorAll("a[href]")
        ].map((link) => ({
            text: link.innerText.trim() || "(no link text)",
            url: link.href
        }));

        return {
            subject,
            senderName,
            senderEmail,
            bodyText,
            links
        };
    }

    // Step 7: Explainable, local URL risk checks.
    function checkUrlRisk(rawUrl, displayedText = "") {
        const findings = [];

        let url;

        try {
            url = new URL(rawUrl);
        } catch {
            return {
                level: "REVIEW",
                findings: ["The link destination could not be parsed."]
            };
        }

        const hostname = url.hostname.toLowerCase();
        const visibleText = displayedText.trim().toLowerCase();

        // HTTP does not encrypt the connection.
        if (url.protocol === "http:") {
            findings.push("Uses HTTP rather than HTTPS.");
        }

        // User information before @ can disguise the actual host.
        if (url.username || url.password || rawUrl.includes("@")) {
            findings.push("Contains an @ character or URL user information.");
        }

        // IP-address hosts deserve closer inspection.
        const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
        const isBracketedIPv6 = hostname.startsWith("[") &&
                                hostname.endsWith("]");

        if (isIPv4 || isBracketedIPv6) {
            findings.push("Uses an IP address instead of a domain name.");
        }

        // Internationalized domains can contain lookalike characters.
        if (hostname.startsWith("xn--") ||
            hostname.split(".").some(part => part.startsWith("xn--"))) {
            findings.push("Contains an internationalized domain label (punycode).");
        }

        // Compare a displayed URL with its actual destination when possible.
        let displayedUrl;

        try {
            displayedUrl = new URL(displayedText);
        } catch {
            displayedUrl = null;
        }

        if (
            displayedUrl &&
            displayedUrl.hostname.toLowerCase() !== hostname
        ) {
            findings.push(
                "The displayed URL hostname differs from the actual destination."
            );
        }

        // Flag a few common deceptive hostname patterns for review.
        if (
            hostname.includes("xn--") ||
            /\d{4,}/.test(hostname.split(".")[0]) ||
            hostname.split(".").length >= 5
        ) {
            findings.push(
                "The hostname has a pattern that may warrant closer inspection."
            );
        }

        let level = "NO OBVIOUS FLAGS";

        if (findings.length >= 3) {
            level = "HIGHER CONCERN";
        } else if (findings.length > 0) {
            level = "REVIEW";
        }
        console.log("[Mailshield URL Test]", {
            url: rawUrl,
            level,
            findings
        });

        return { level, findings };
    }
        console.log(
            "[Mailshield Test] HTTP:",
            checkUrlRisk("http://example.com")
        );

        console.log(
            "[Mailshield Test] HTTPS:",
            checkUrlRisk("https://example.com")
        );
    // Display a report without inserting email content as HTML.
    function showReport(email) {
        document.getElementById(PANEL_ID)?.remove();

        const host = document.createElement("div");
        host.id = PANEL_ID;

        Object.assign(host.style, {
            position: "fixed",
            top: "80px",
            right: "24px",
            width: "min(420px, calc(100vw - 40px))",
            height: "min(720px, calc(100vh - 110px))",
            zIndex: "2147483647"
        });

        const shadow = host.attachShadow({ mode: "open" });

        shadow.innerHTML = `
            <style>
                * { box-sizing: border-box; }
                .panel {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: #0f172a;
                    color: #e2e8f0;
                    border: 1px solid #334155;
                    border-radius: 14px;
                    box-shadow: 0 12px 40px #0005;
                    font: 13px/1.5 Arial, sans-serif;
                    overflow: hidden;
                }
                header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px;
                    background: #172554;
                    border-bottom: 1px solid #334155;
                }
                h2 { margin: 0; font-size: 17px; }
                button {
                    cursor: pointer;
                    border: 1px solid #64748b;
                    border-radius: 6px;
                    padding: 6px 10px;
                    color: white;
                    background: #334155;
                }
                main { padding: 14px; overflow: auto; }
                .field { margin-bottom: 12px; }
                .label {
                    color: #93c5fd;
                    font-weight: bold;
                    margin-bottom: 3px;
                }
                .value {
                    overflow-wrap: anywhere;
                    white-space: pre-wrap;
                }
                .body {
                    max-height: 160px;
                    overflow: auto;
                    padding: 8px;
                    background: #1e293b;
                    border-radius: 6px;
                }
                .links { padding-left: 20px; }
                .links li { margin-bottom: 10px; }
                .url { overflow-wrap: anywhere; color: #7dd3fc; }
                .notice { color: #94a3b8; font-size: 12px; }
            </style>

            <section class="panel">
                <header>
                    <h2>🛡 Mailshield Report</h2>
                    <button id="close" type="button">Close ✕</button>
                </header>
                <main>
                    <p class="notice">
                        Local inspection only. This is data extraction,
                        not a security verdict.
                    </p>

                    <div class="field">
                        <div class="label">Subject</div>
                        <div class="value" id="subject"></div>
                    </div>

                    <div class="field">
                        <div class="label">Sender name</div>
                        <div class="value" id="senderName"></div>
                    </div>

                    <div class="field">
                        <div class="label">Sender email</div>
                        <div class="value" id="senderEmail"></div>
                    </div>

                    <div class="field">
                        <div class="label">Email body</div>
                        <div class="value body" id="body"></div>
                    </div>

                    <div class="field">
                        <div class="label" id="linkCount">Links</div>
                        <ul class="links" id="links"></ul>
                    </div>
                </main>
            </section>
        `;

        // Use textContent for email data; never interpret it as HTML.
        shadow.getElementById("subject").textContent = email.subject;
        shadow.getElementById("senderName").textContent =
            email.senderName;
        shadow.getElementById("senderEmail").textContent =
            email.senderEmail;
        shadow.getElementById("body").textContent = email.bodyText;

        shadow.getElementById("linkCount").textContent =
            `Links found: ${email.links.length}`;

        const list = shadow.getElementById("links");

        if (email.links.length === 0) {
            const item = document.createElement("li");
            item.textContent = "No links found in the message body.";
            list.appendChild(item);
        } else {
            email.links.forEach((link) => {
                const item = document.createElement("li");
                const text = document.createElement("div");
                const url = document.createElement("div");

                text.textContent = link.text;
                url.className = "url";
                url.textContent = link.url;

                item.append(text, url);
                list.appendChild(item);
            });
        }

        shadow.getElementById("close").addEventListener("click", () => {
            host.remove();
        });

        document.body.appendChild(host);
    }

    // Add one analysis button to each visible message body.
    function addButtons() {
        document.querySelectorAll(".a3s").forEach((body) => {
            if (!body.isConnected || !body.parentElement) return;

            const rect = body.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const parent = body.parentElement;

            if (parent.querySelector(`.${BUTTON_CLASS}`)) return;

            const button = document.createElement("button");
            button.className = BUTTON_CLASS;
            button.type = "button";
            button.textContent = "🛡 Analyze with Mailshield";

            Object.assign(button.style, {
                display: "block",
                padding: "10px 16px",
                margin: "14px 0",
                border: "1px solid #475569",
                borderRadius: "8px",
                background: "#172554",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
            });

            button.addEventListener("click", () => {
                try {
                    const email = extractEmail(body);
                    showReport(email);
                    console.log("Mailshield: email data extracted.", {
                        subject: email.subject,
                        senderEmail: email.senderEmail,
                        linkCount: email.links.length
                    });
                } catch (error) {
                    console.error("Mailshield analysis error:", error);
                    button.textContent = "Analysis failed — try again";
                }
            });

            parent.appendChild(button);
        });
    }

    const observer = new MutationObserver(addButtons);

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        addButtons();
    }
})();
