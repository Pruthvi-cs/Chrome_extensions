
(() => {
    "use strict";

    const BUTTON_CLASS = "mailshield-analyze-button";
    const PANEL_ID = "mailshield-report-panel";

    console.log("MAILSHIELD_STEP_7 loaded");

    // ============================================================
    // 1. URL ANALYSIS — local rules only; never follows redirects.
    // ============================================================

    function checkUrlRisk(rawUrl, displayedText = "") {
        const findings = [];

        let url;

        try {
            url = new URL(rawUrl);
        } catch {
            return {
                level: "REVIEW",
                category: "Unrecognized URL",
                destinationStatus: "Destination could not be parsed.",
                findings: ["The link destination is not a valid URL."]
            };
        }

        if (!["http:", "https:"].includes(url.protocol)) {
            return {
                level: "REVIEW",
                category: "Non-web link",
                destinationStatus: "Not assessed by web URL checks.",
                findings: [
                    `The link uses the ${url.protocol} protocol, which this web URL checker does not assess.`
                ]
            };
        }

        const hostname = url.hostname.toLowerCase();

        // Check for unencrypted HTTP.
        if (url.protocol === "http:") {
            findings.push(
                "Uses HTTP rather than HTTPS; the connection is not protected by HTTPS."
            );
        }

        // Check actual URL credentials, not every @ in the URL.
        if (url.username || url.password) {
            findings.push(
                "Contains URL user information before the hostname, which can be misleading."
            );
        }

        // Detect IPv4 or bracketed IPv6 hostnames.
        const isIPv4 =
            /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

        const isIPv6 =
            hostname.startsWith("[") &&
            hostname.endsWith("]");

        if (isIPv4 || isIPv6) {
            findings.push(
                "Uses an IP address instead of a conventional domain name."
            );
        }

        // Detect internationalized domain labels encoded as punycode.
        if (
            hostname.split(".").some(label =>
                label.startsWith("xn--")
            )
        ) {
            findings.push(
                "Contains an internationalized domain label (punycode); inspect the domain carefully."
            );
        }

        // Compare actual hostname with displayed text when it is a URL.
        const visibleText = displayedText.trim();
        let visibleUrl = null;

        try {
            if (/^https?:\/\//i.test(visibleText)) {
                visibleUrl = new URL(visibleText);
            } else if (/^www\./i.test(visibleText)) {
                visibleUrl = new URL(`https://${visibleText}`);
            }
        } catch {
            visibleUrl = null;
        }

        if (
            visibleUrl &&
            visibleUrl.hostname.toLowerCase() !== hostname
        ) {
            findings.push(
                "The URL shown in the email has a different hostname from the actual link destination."
            );
        }

        // Identify possible tracking and redirect patterns.
        const trackingSignals = [];

        const trackingHostPatterns = [
            /(^|[.-])click([.-]|$)/i,
            /(^|[.-])track(ing)?([.-]|$)/i,
            /(^|[.-])redirect([.-]|$)/i,
            /(^|[.-])emailclick([.-]|$)/i,
            /(^|[.-])linktrack([.-]|$)/i
        ];

        if (
            trackingHostPatterns.some(pattern =>
                pattern.test(hostname)
            )
        ) {
            trackingSignals.push(
                "Hostname contains a common click-tracking or redirect pattern."
            );
        }

        const path = url.pathname.toLowerCase();

        if (
            /\/(emailclick|clicktrack|click|redirect|track|tracking)(\/|$)/i.test(path)
        ) {
            trackingSignals.push(
                "URL path contains a common click-tracking or redirect pattern."
            );
        }

        // A few known marketing platforms commonly use tracked links.
        // Their presence does NOT mean a link is malicious.
        const knownMarketingHosts = [
            "moengage.com",
            "sendgrid.net",
            "mailchimp.com",
            "list-manage.com",
            "mailgun.org"
        ];

        const isMarketingHost = knownMarketingHosts.some(domain =>
            hostname === domain || hostname.endsWith(`.${domain}`)
        );

        if (isMarketingHost) {
            trackingSignals.push(
                "Host belongs to a domain commonly used for email or marketing services."
            );
        }

        // Long opaque query parameters can be tracking tokens.
        // This is supporting evidence only, not proof.
        const queryLooksOpaque = [...url.searchParams.values()].some(
            value => value.length >= 100
        );

        if (
            queryLooksOpaque &&
            trackingSignals.length > 0
        ) {
            trackingSignals.push(
                "Contains a long query parameter that may carry a tracking token."
            );
        }

        const possibleTracking = trackingSignals.length > 0;

        findings.push(...trackingSignals);

        // Use transparent labels rather than claiming a link is safe.
        let level = "NO OBVIOUS FLAGS";

        if (findings.length >= 3) {
            level = "HIGHER CONCERN";
        } else if (findings.length > 0) {
            level = "REVIEW";
        }

        return {
            level,
            category: possibleTracking
                ? "Possible tracking/redirect"
                : "No obvious tracking indicators",
            destinationStatus: possibleTracking
                ? "Final destination unverified; redirect was not followed."
                : "Initial destination identified; any subsequent redirect is unverified.",
            findings
        };
    }

    // ============================================================
    // 2. EXTRACT VISIBLE INFORMATION FROM THE OPEN GMAIL MESSAGE.
    // ============================================================

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
        ].map(link => ({
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

    // ============================================================
    // 3. DISPLAY THE REPORT.
    // Email data is rendered with textContent, not as HTML.
    // ============================================================

    function showReport(email) {
        document.getElementById(PANEL_ID)?.remove();

        const host = document.createElement("div");
        host.id = PANEL_ID;

        Object.assign(host.style, {
            position: "fixed",
            top: "80px",
            right: "24px",
            width: "min(440px, calc(100vw - 40px))",
            height: "min(760px, calc(100vh - 110px))",
            zIndex: "2147483647"
        });

        const shadow = host.attachShadow({ mode: "open" });

        shadow.innerHTML = `
            <style>
                * {
                    box-sizing: border-box;
                }

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
                    gap: 10px;
                    padding: 14px;
                    background: #172554;
                    border-bottom: 1px solid #334155;
                }

                h2 {
                    margin: 0;
                    font-size: 17px;
                }

                button {
                    cursor: pointer;
                    border: 1px solid #64748b;
                    border-radius: 6px;
                    padding: 6px 10px;
                    color: white;
                    background: #334155;
                }

                main {
                    padding: 14px;
                    overflow: auto;
                }

                .field {
                    margin-bottom: 14px;
                }

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

                .notice {
                    color: #94a3b8;
                    font-size: 12px;
                }

                .link-card {
                    margin: 10px 0;
                    padding: 10px;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    background: #111c30;
                }

                .link-text {
                    font-weight: 600;
                    margin-bottom: 5px;
                    overflow-wrap: anywhere;
                }

                .url {
                    overflow-wrap: anywhere;
                    color: #7dd3fc;
                    margin-bottom: 8px;
                }

                .category {
                    font-weight: bold;
                    margin-bottom: 4px;
                }

                .status {
                    color: #cbd5e1;
                    font-size: 12px;
                    margin-bottom: 6px;
                }

                .findings {
                    padding-left: 18px;
                    margin: 6px 0;
                }

                .findings li {
                    margin-bottom: 5px;
                }

                .safe-note {
                    color: #94a3b8;
                    font-size: 12px;
                    margin-top: 10px;
                }
            </style>

            <section class="panel">
                <header>
                    <h2>🛡 Mailshield Report</h2>
                    <button id="close" type="button">Close ✕</button>
                </header>

                <main>
                    <p class="notice">
                        Local inspection only. This is a preliminary
                        indicator report, not a security verdict.
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
                        <div id="links"></div>
                        <p class="safe-note">
                            Mailshield does not follow links or verify
                            their final destinations in this version.
                            No warning does not mean a link is safe.
                        </p>
                    </div>
                </main>
            </section>
        `;

        shadow.getElementById("subject").textContent =
            email.subject;

        shadow.getElementById("senderName").textContent =
            email.senderName;

        shadow.getElementById("senderEmail").textContent =
            email.senderEmail;

        shadow.getElementById("body").textContent =
            email.bodyText;

        shadow.getElementById("linkCount").textContent =
            `Links found: ${email.links.length}`;

        const linksContainer = shadow.getElementById("links");

        if (email.links.length === 0) {
            const empty = document.createElement("p");
            empty.textContent = "No links found in the message body.";
            linksContainer.appendChild(empty);
        }

        email.links.forEach(link => {
            const result = checkUrlRisk(link.url, link.text);

            const card = document.createElement("section");
            card.className = "link-card";

            const text = document.createElement("div");
            text.className = "link-text";
            text.textContent = link.text;

            const url = document.createElement("div");
            url.className = "url";
            url.textContent = link.url;

            const category = document.createElement("div");
            category.className = "category";
            category.textContent =
                `${result.level} · ${result.category}`;

            category.style.color =
                result.level === "HIGHER CONCERN" ? "#f87171" :
                result.level === "REVIEW" ? "#fbbf24" :
                "#86efac";

            const status = document.createElement("div");
            status.className = "status";
            status.textContent = result.destinationStatus;

            const findings = document.createElement("ul");
            findings.className = "findings";

            if (result.findings.length === 0) {
                const item = document.createElement("li");
                item.textContent =
                    "No obvious warning indicators detected by current rules.";
                findings.appendChild(item);
            } else {
                result.findings.forEach(finding => {
                    const item = document.createElement("li");
                    item.textContent = finding;
                    findings.appendChild(item);
                });
            }

            card.append(
                text,
                url,
                category,
                status,
                findings
            );

            linksContainer.appendChild(card);
        });

        shadow.getElementById("close").addEventListener("click", () => {
            host.remove();
        });

        document.body.appendChild(host);

        console.log("Mailshield: local report generated.", {
            subject: email.subject,
            linkCount: email.links.length
        });
    }

    // ============================================================
    // 4. ADD THE ANALYZE BUTTON TO VISIBLE EMAIL BODIES.
    // ============================================================

    function addButtons() {
        document.querySelectorAll(".a3s").forEach(body => {
            if (!body.isConnected || !body.parentElement) {
                return;
            }

            const rect = body.getBoundingClientRect();

            if (rect.width === 0 || rect.height === 0) {
                return;
            }

            const parent = body.parentElement;

            if (parent.querySelector(`.${BUTTON_CLASS}`)) {
                return;
            }

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
                } catch (error) {
                    console.error(
                        "Mailshield analysis error:",
                        error
                    );

                    button.textContent = "Analysis failed — try again";
                }
            });

            parent.appendChild(button);
        });
    }

    // Gmail updates its interface dynamically.
    const observer = new MutationObserver(addButtons);

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        addButtons();
    }
})();
