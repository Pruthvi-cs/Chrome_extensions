
(() => {
    "use strict";

    const BUTTON_CLASS = "mailshield-analyze-button";
    const PANEL_ID = "mailshield-report-panel";

    console.log("MAILSHIELD_STEP_7 loaded");

    // ============================================================
    // 1. URL ANALYSIS — local rules only; never follows redirects.
    // ============================================================

function checkUrlRisk(rawUrl, displayedText = "") {
    const securityFindings = [];
    const trackingSignals = [];

    let url;

    try {
        url = new URL(rawUrl);
    } catch {
        return {
            level: "REVIEW",
            category: "Unrecognized URL",
            destinationStatus: "Destination could not be parsed.",
            findings: ["The link destination is not a valid URL."],
            trackingSignals: []
        };
    }

    if (!["http:", "https:"].includes(url.protocol)) {
        return {
            level: "REVIEW",
            category: "Non-web link",
            destinationStatus: "Not assessed by web URL checks.",
            findings: [
                `Uses the ${url.protocol} protocol, which this checker does not assess.`
            ],
            trackingSignals: []
        };
    }

    const hostname = url.hostname.toLowerCase();

    // Security indicators
    if (url.protocol === "http:") {
        securityFindings.push(
            "Uses HTTP instead of HTTPS."
        );
    }

    if (url.username || url.password) {
        securityFindings.push(
            "Contains URL credentials that could be misleading."
        );
    }

    const isIPv4 =
        /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

    const isIPv6 =
        hostname.startsWith("[") &&
        hostname.endsWith("]");

    if (isIPv4 || isIPv6) {
        securityFindings.push(
            "Uses an IP address instead of a conventional domain name."
        );
    }

    if (
        hostname.split(".").some(label =>
            label.startsWith("xn--")
        )
    ) {
        securityFindings.push(
            "Contains a punycode domain label; inspect the domain carefully."
        );
    }

    // Compare the visible URL with the actual hostname.
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
        securityFindings.push(
            "Displayed URL hostname differs from the actual destination hostname."
        );
    }

    // Link-behavior indicators: not proof of malicious activity.
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
            "Hostname resembles a click-tracking or redirect service."
        );
    }

    const path = url.pathname.toLowerCase();

    if (
        /\/(emailclick|clicktrack|click|redirect|track|tracking)(\/|$)/i.test(path)
    ) {
        trackingSignals.push(
            "URL path resembles a click-tracking or redirect endpoint."
        );
    }

    const marketingHosts = [
        "moengage.com",
        "sendgrid.net",
        "mailchimp.com",
        "list-manage.com",
        "mailgun.org"
    ];

    const isMarketingHost = marketingHosts.some(domain =>
        hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (isMarketingHost) {
        trackingSignals.push(
            "Uses a domain commonly associated with email or marketing services."
        );
    }

    const hasLongQueryValue =
        [...url.searchParams.values()].some(
            value => value.length >= 100
        );

    if (
        hasLongQueryValue &&
        trackingSignals.length > 0
    ) {
        trackingSignals.push(
            "Contains a long query parameter that may be a tracking token."
        );
    }

    // Tracking indicators do NOT increase the security warning level.
    let level = "NO OBVIOUS FLAGS";

    if (securityFindings.length >= 2) {
        level = "HIGHER CONCERN";
    } else if (securityFindings.length === 1) {
        level = "REVIEW";
    }

    return {
        level,
        category: trackingSignals.length > 0
            ? "Possible tracking/redirect behavior"
            : "No obvious tracking indicators",
        destinationStatus:
            "Final destination unverified; Mailshield did not follow redirects.",
        findings: securityFindings,
        trackingSignals
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

            function addSection(title, items, emptyMessage) {
                const section = document.createElement("div");

                const heading = document.createElement("div");
                heading.className = "label";
                heading.textContent = title;
                section.appendChild(heading);

                const list = document.createElement("ul");
                list.className = "findings";

                const entries = items.length ? items : [emptyMessage];

                entries.forEach(message => {
                    const item = document.createElement("li");
                    item.textContent = message;
                    list.appendChild(item);
                });

                section.appendChild(list);
                return section;
            }

            card.appendChild(
                addSection(
                    "Security indicators",
                    result.findings,
                    "No obvious security indicators detected by current rules."
                )
            );

            card.appendChild(
                addSection(
                    "Link behavior indicators",
                    result.trackingSignals,
                    "No obvious tracking indicators detected."
                )
            );

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
