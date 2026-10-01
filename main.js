/*
    Portico Employee — Annual Enrollment — SAC Custom Widget (MOCKUP)

    A single consolidated dashboard for Portico's own ~200 employees, for
    HR. Proposed 2026-10-01 after Blair pointed out that mirroring the full
    3-widget suite (Snap/Operational/Detail) is overkill for a population
    this small -- one focused widget covering headline stats + a full
    member table is more appropriate than three separate ones.

    ONE binding, to the ALREADY-EXISTING AM_MEMBER_ENROLLMENT_DETAIL (same
    model sac-member-detail-widget uses) -- no new Datasphere objects
    needed. Filtered to Is_Portico_Employee = 'Yes' (opposite of the main
    suite's exclusion). At ~200 rows, headline stats and the status
    breakdown are computed client-side from the row-level data -- no
    separate aggregate cube needed the way the general member population
    needs one.

    MOCKUP STATUS: built for Blair to react to, not yet wired to real data
    or pushed to a repo. Same dimension/measure shape as
    sac-member-detail-widget's memberDetail binding, plus Is_Portico_
    Employee.

    Shows every employee directly in one table (no Input-Control-driven
    single-record toggle -- population is small enough that there's no
    need for the "needs attention list vs. single detail card" mechanism
    the general-population Detail widget needs), sorted by status
    priority (least-complete first) so HR sees who needs follow-up first.
*/
(function () {
    "use strict";

    const STATUS_PRIORITY = {
        "Not Started": 1, "In Progress": 2, "Needs Follow-up": 3, "Abandoned": 4, "Success": 5,
    };
    const STATUS_LABELS = { "Success": "Completed", "Abandoned": "Started, Not Completed", "Not Started": "Not Started", "In Progress": "In Progress", "Needs Follow-up": "Needs Follow-up" };

    function row(dims, measures) {
        const out = {};
        dims.forEach((d, i) => { out["dimensions_" + i] = { id: d, label: d }; });
        measures.forEach((m, i) => { out["measures_" + i] = { raw: m, formatted: m == null ? "" : String(m) }; });
        return out;
    }

    // Illustrative mock -- same shape as sac-member-detail-widget's
    // memberDetail binding (Member/Wave/Enrollment_Status/Defaulted/
    // Defaulted_Timing/Membership_Type/Member_Health_Coverage/Vision_Plan/
    // Set_Up_Date/Completed_Date/Abandoned_Date/Is_Portico_Employee), all
    // "Yes" on the last dimension since this widget shows ONLY Portico
    // employees. A real bind would return ~200 rows; this mock has 14 to
    // keep the preview readable while still exercising every status.
    // measures_9/10 (Eligible_Count/Health_Covered_Count) are illustrative
    // here only -- in real Gold they're still NULL placeholders pending
    // BR-29 (the same vDimMember fan-out gate from earlier in this build).
    // Wired up now anyway so nothing needs to change once that's fixed.
    const MOCK_PORTICO_DETAIL = { data: [
        row(["40001", "Wave 1", "Success", "No", "N/A", "Other", "silver", "silver", "2026-10-19", "2026-10-22", "", "Yes"], [1, 500, 250, 0, 25, 0, 0, 88, 0, 2, 2]),
        row(["40002", "Wave 1", "Success", "No", "N/A", "Other", "gold", "gold", "2026-10-20", "2026-10-25", "", "Yes"], [1, 1000, 0, 0, 20, 10, 0, 0, 145, 4, 4]),
        row(["40003", "Wave 1", "Abandoned", "Yes", "Before PSP", "Other", "waived", "", "2026-10-19", "", "2026-10-30", "Yes"], [2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
        row(["40004", "Wave 1", "Success", "No", "N/A", "Other", "silver", "", "2026-10-21", "2026-10-24", "", "Yes"], [1, 500, 0, 0, 0, 0, 0, 65, 0, 1, 1]),
        row(["40005", "Wave 1", "Needs Follow-up", "No", "N/A", "Other", "", "", "2026-10-19", "", "", "Yes"], [3, 0, 0, 0, 10, 0, 0, 0, 0, 3, 0]),
        row(["40006", "Wave 2a", "Success", "No", "N/A", "Other", "gold", "gold", "2026-11-09", "2026-11-12", "", "Yes"], [1, 1000, 500, 0, 0, 0, 0, 0, 120, 3, 3]),
        row(["40007", "Wave 2a", "In Progress", "No", "N/A", "Other", "", "", "2026-11-10", "", "", "Yes"], [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
        row(["40008", "Wave 2a", "Not Started", "No", "N/A", "Other", "", "", "", "", "", "Yes"], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
        row(["40009", "Wave 1", "Success", "No", "N/A", "Other", "silver", "", "2026-10-22", "2026-10-27", "", "Yes"], [1, 500, 250, 0, 0, 0, 0, 0, 0, 2, 2]),
        row(["40010", "Wave 1", "Abandoned", "Yes", "After PSP", "Other", "waived", "", "2026-10-19", "", "2026-11-05", "Yes"], [2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
        row(["40011", "Wave 2b", "Success", "No", "N/A", "Other", "gold", "gold", "2026-11-09", "2026-11-14", "", "Yes"], [1, 1000, 0, 0, 25, 0, 0, 0, 0, 5, 5]),
        row(["40012", "Wave 1", "Not Started", "No", "N/A", "Other", "", "", "", "", "", "Yes"], [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
        row(["40013", "Wave 1", "Success", "No", "N/A", "Other", "silver", "silver", "2026-10-23", "2026-10-28", "", "Yes"], [1, 500, 0, 0, 0, 0, 0, 88, 0, 2, 2]),
        row(["40014", "Wave 2a", "Needs Follow-up", "No", "N/A", "Other", "", "", "2026-11-09", "", "", "Yes"], [2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]),
    ] };

    const template = document.createElement("template");
    template.innerHTML = `
        <style>
            :host {
                display: block;
                box-sizing: border-box;
                font-family: "72", "Segoe UI", Arial, sans-serif;
                /* Same glassmorphism system as the rest of the suite. */
                --mesh-1: rgba(106, 92, 240, 0.16);
                --mesh-2: rgba(47, 111, 224, 0.12);
                --mesh-3: rgba(20, 151, 111, 0.10);
                --surface: rgba(255, 255, 255, 0.58);
                --surface-2: rgba(23, 26, 35, 0.055);
                --border: rgba(255, 255, 255, 0.65);
                --text: #171a23;
                --text-soft: #5b6072;
                --accent: #6a5cf0;
                --accent-bg: rgba(106, 92, 240, 0.14);
                --success: #14976f;
                --success-bg: rgba(20, 151, 111, 0.14);
                --warning: #a5700c;
                --warning-bg: rgba(165, 112, 12, 0.14);
                --danger: #c94b4b;
                --danger-bg: rgba(201, 75, 75, 0.14);
                --glass-blur: blur(20px) saturate(180%);
                --shadow-card: 0 1px 1px rgba(23,26,35,0.03), 0 4px 12px -2px rgba(23,26,35,0.07), 0 14px 28px -10px rgba(23,26,35,0.10);
            }
            * { box-sizing: border-box; }
            .dashboard {
                width: 100%; height: 100%; overflow: auto;
                background:
                    radial-gradient(at 12% 8%, var(--mesh-1) 0%, transparent 45%),
                    radial-gradient(at 88% 14%, var(--mesh-2) 0%, transparent 45%),
                    radial-gradient(at 50% 100%, var(--mesh-3) 0%, transparent 50%),
                    #f4f5fa;
                color: var(--text); border-radius: 18px; padding: 18px;
            }
            .eyebrow { font-size: 10.5px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-soft); margin-bottom: 4px; }
            .titlewrap { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 2px; }
            h1 { font-size: 18px; font-weight: 700; margin: 0; }
            .badge { font-size: 10.5px; font-weight: 600; padding: 3px 9px; border-radius: 100px; border: 1px solid; }
            .badge.accent { color: var(--accent); border-color: rgba(106,92,240,0.35); background: var(--accent-bg); }
            .asof { font-size: 10.5px; color: var(--text-soft); margin-bottom: 14px; }

            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 18px; }
            .tile { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px; box-shadow: var(--shadow-card); }
            .tile .label { font-size: 9.5px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase; color: var(--text-soft); }
            .tile .value { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; margin-top: 2px; }
            .tile .sub { font-size: 10px; color: var(--text-soft); }

            .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; box-shadow: var(--shadow-card); overflow: hidden; }
            .section-title { font-size: 11px; font-weight: 700; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 14px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            thead th { text-align: left; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-soft); padding: 10px 12px 6px; border-bottom: 1px solid var(--border); }
            tbody td { padding: 7px 12px; border-bottom: 1px solid var(--surface-2); white-space: nowrap; }
            tbody tr:last-child td { border-bottom: none; }
            .status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; }
            .num { text-align: right; font-variant-numeric: tabular-nums; }
            .defaulted-tag { font-size: 10px; color: var(--danger); }
        </style>
        <div class="dashboard">
            <div class="eyebrow">2026 Annual Enrollment — Portico Employees</div>
            <div class="titlewrap">
                <h1>Portico Employee Enrollment</h1>
                <span class="badge accent" id="dataBadge">Mock Data — Preview</span>
            </div>
            <div class="asof" id="asof"></div>

            <div class="grid" id="tiles"></div>

            <div class="panel">
                <div class="section-title">All Employees (sorted by status)</div>
                <table>
                    <thead><tr>
                        <th>Member</th><th>Status</th><th>Health Plan</th>
                        <th class="num">HSA</th><th class="num">Pretax</th><th class="num">Roth</th>
                        <th class="num">Supplemental Life</th><th>Vision</th>
                        <th class="num">Eligible</th><th class="num">Covered</th><th>Defaulted</th>
                    </tr></thead>
                    <tbody id="memberRows"></tbody>
                </table>
            </div>
        </div>
    `;

    class MemberPortico extends HTMLElement {
        constructor() {
            super();
            this._shadowRoot = this.attachShadow({ mode: "open" });
            this._shadowRoot.appendChild(template.content.cloneNode(true));
            this._props = { width: 820, height: 560 };
            this._memberDetail = MOCK_PORTICO_DETAIL;
            this._usingMockData = true;
        }

        connectedCallback() { this._render(); }
        onCustomWidgetBeforeUpdate(changedProperties) { this._props = Object.assign({}, this._props, changedProperties); }
        onCustomWidgetAfterUpdate(changedProperties) {
            if ("width" in changedProperties) this.style.width = changedProperties.width + "px";
            if ("height" in changedProperties) this.style.height = changedProperties.height + "px";
            if ("memberDetail" in changedProperties) { this._memberDetail = changedProperties.memberDetail; this._usingMockData = false; }
            this._render();
        }
        onCustomWidgetDestroy() {}
        refresh() { this._render(); }

        _dim(r, i) {
            const d = r["dimensions_" + i];
            if (!d) return "";
            if (d.id === "@NullMember" || d.label === "(Null)" || d.label === "(No Value)") return "";
            return d.label;
        }
        _measure(r, i) {
            const m = r["measures_" + i];
            if (!m) return 0;
            const n = Number(m.raw);
            return Number.isFinite(n) ? n : 0;
        }
        _parseRow(r) {
            return {
                member: this._dim(r, 0),
                enrollmentStatus: this._dim(r, 2),
                defaulted: this._dim(r, 3),
                defaultedTiming: this._dim(r, 4),
                healthPlan: this._dim(r, 6),
                visionPlan: this._dim(r, 7),
                isPorticoEmployee: this._dim(r, 11),
                hsaAmount: this._measure(r, 1),
                suppLifeAmount: this._measure(r, 4) + this._measure(r, 5) + this._measure(r, 6),
                retirementPretaxAmount: this._measure(r, 7),
                retirementRothAmount: this._measure(r, 8),
                eligibleCount: this._measure(r, 9),
                coveredCount: this._measure(r, 10),
            };
        }
        _statusPriority(status) { return STATUS_PRIORITY[status] || 99; }
        _statusLabel(status) { return STATUS_LABELS[status] || status || "—"; }
        _statusColor(status) {
            if (status === "Success") return "var(--success)";
            if (status === "Abandoned") return "var(--danger)";
            return "var(--warning)";
        }
        _money(v) { return v ? "$" + Number(v).toLocaleString() : "—"; }

        _render() {
            const root = this._shadowRoot;
            root.getElementById("asof").textContent = "As of: " + new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
            root.getElementById("dataBadge").textContent = this._usingMockData ? "Mock Data — Preview" : "Live";

            // Only Is_Portico_Employee = "Yes" -- opposite of the main
            // suite's exclusion filter, same model/binding shape.
            const rawRows = (this._memberDetail && this._memberDetail.data) || [];
            const rows = rawRows.map((r) => this._parseRow(r)).filter((m) => m.isPorticoEmployee === "Yes");

            const totalSetUp = rows.length;
            const completed = rows.filter((m) => m.enrollmentStatus === "Success").length;
            const startedNotCompleted = rows.filter((m) => m.enrollmentStatus === "Abandoned").length;
            const notStarted = rows.filter((m) => m.enrollmentStatus === "Not Started").length;
            const pct = totalSetUp ? Math.round((completed / totalSetUp) * 100) : 0;

            root.getElementById("tiles").innerHTML = [
                ["Total Employees", totalSetUp, ""],
                ["Completed", completed, pct + "% of total"],
                ["Started, Not Completed", startedNotCompleted, ""],
                ["Not Started", notStarted, ""],
            ].map(([label, value, sub]) => `
                <div class="tile">
                    <div class="label">${label}</div>
                    <div class="value">${value.toLocaleString()}</div>
                    <div class="sub">${sub}</div>
                </div>`).join("");

            const sorted = rows.slice().sort((a, b) => {
                const diff = this._statusPriority(a.enrollmentStatus) - this._statusPriority(b.enrollmentStatus);
                return diff !== 0 ? diff : (a.member || "").localeCompare(b.member || "");
            });

            root.getElementById("memberRows").innerHTML = sorted.map((m) => `
                <tr>
                    <td>${m.member}</td>
                    <td><span class="status-dot" style="background:${this._statusColor(m.enrollmentStatus)};"></span>${this._statusLabel(m.enrollmentStatus)}</td>
                    <td>${m.healthPlan || "—"}</td>
                    <td class="num">${this._money(m.hsaAmount)}</td>
                    <td class="num">${this._money(m.retirementPretaxAmount)}</td>
                    <td class="num">${this._money(m.retirementRothAmount)}</td>
                    <td class="num">${this._money(m.suppLifeAmount)}</td>
                    <td>${m.visionPlan || "—"}</td>
                    <td class="num">${m.eligibleCount || "—"}</td>
                    <td class="num">${m.coveredCount || "—"}</td>
                    <td>${m.defaulted === "Yes" ? `<span class="defaulted-tag">${m.defaultedTiming}</span>` : "—"}</td>
                </tr>`).join("");
        }
    }

    customElements.define("com-porticobenefits-memberportico", MemberPortico);
})();
