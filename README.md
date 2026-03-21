# website

COP290 Assignment 2
Keshav Navandar 2024CS10441 and Arin Chandurkar 2024CS50002.

Make 2 Terminal shells for website directory.

In the first shell:-
cd Backend
npm install
npm start

In the second shell:-
cd Frontend
npm install
npm run dev

Go to http://localhost:5173/

---

## DESIGN DECISIONS - WORKSPACE PROJECT

**1) System Bootstrap & Global Admin**
- **Automatic Seeding:** On server start, the system automatically checks for the 'admin@workspace.com' user. If missing, it seeds a "Global Admin" account.
- **Credentials:** Email: admin@workspace.com | Password: admin123 (or 12345678, user-configurable).
- **Restricted Capabilities:** Only the Global Admin has permission to 'CREATE' and 'DELETE' entire projects. This prevents regular users from causing catastrophic data loss.

**2) Technology Stack & Data**
- **Backend:** Built with Node.js and TypeScript for type safety across all controllers.
- **Database:** Uses MySQL as the relational backbone.
- **Schema:** Strict foreign key constraints with ON DELETE CASCADE to ensure no orphaned tasks or comments left behind.
- **Payload Handling:** Backend limits for JSON/URL-encoded data were specifically increased to 1MB to support direct Base64 script injection for profile photos.

**3) Workflow & Column WIP Limits**
- **Status columns are dynamic:** Instead of a hardcoded status field, we use a 'columns' table.
- **Default WIP Limits:** When a new board is created, 'In Progress' is set to 3 and 'In Review' to 1 by default. 
- **Global Defaults:** Any new column created manually by a user defaults to a WIP limit of 3.
- **Enforced Logic:** The system checks the task count of the target column before allowing a 'Move' or 'Create' operation. You cannot overfill a status stage.

**4) Transitions & Allowed Workflows**
- **Logic:** By default, the system allows moving between adjacent columns (distance = 1). 
- **Custom Rules:** To move "forward" across multiple stages or to move "backwards" to a previous stage, a rule must be explicitly added to the 'allowed_workflows' table.
- **Validation:** Every 'moveTask' operation queries these rules to ensure the board flow is respected.

**5) Story & Sub-task Architecture**
- **Hierarchy:** 'Story' is a parent-type task. 'Task' and 'Bug' types can be linked to a Story as children.
- **Story Status Logic:** The status (column) of a Story is automatically derived from its children. It takes the "Minimum Task Precedence"—meaning the Story sits in whichever column its most 'behind' child task is currently located. 
- **Cleanup:** If all children of a story are deleted, the story becomes 'Unplaced'.

**6) RBAC (Role Based Access Control)**
- **Project Roles:** Project Admin, Project Member, Project Viewer.
- **Assignment restriction:** Project Members are strictly prohibited from assigning tasks to others or changing existing assignments. This is a design decision to ensure only Admins handle team allocation.
- **UI Deactivation:** The frontend proactively disables assignee selection for 'Project Members' with clear tooltip feedback to prevent API errors.

**7) Immutable Audit Logs**
- **Snapshots:** Instead of joining with the live 'tasks' table, the audit log captures a hard snapshot of 'is_closed' and 'is_resolved' at the exact moment of every event.
- **Anti-Cascading:** This prevents the "Cascading YES" issue where closing a task would retroactively change the historical logs of previous weeks. History remains static and accurate.

**8) Profile & Avatar Storage**
- **Raw Base64:** Based on the low expected user count (<5), we use a Direct Storage model. We store the entire Base64 script directly in a LONGTEXT database column.
- **Reasoning:** This removes the complexity of managing an external file server or S3 bucket, making the entire application self-contained within the database.

**9) Security & Authentication**
- **JWT Strategy:** Uses a dual token system. 15-minute Access Tokens for security and 7-day Refresh Tokens stored in a specialized table for persistent sessions.
- **XSS Protection:** Both tokens are stored in 'httpOnly: True' cookies. This prevents any malicious JavaScript from stealing your session cookies.
- **Password Hashing:** Uses bcrypt with a salt factor of 10 for all password storage.

**10) JWT Refresh Token Interceptors (Silent Auth)**
- **Interceptor Pattern:** The `apiRequest` utility wrapper in the frontend automatically intercepts `401 Unauthorized` API responses.
- **Silent Renewal:** Before throwing an error to the user, it transparently triggers a request to `/auth/refresh` to grab a fresh access token, then immediately retries the failed original request to provide a frictionless UX.

**11) Soft and Hard Deletion Synergy**
- **Archival State:** Projects support an "Archived" state which uses a fast, lightweight boolean toggle (`is_archived`). This soft-delete mechanism hides the project while preserving valuable historical audit trails and references.
- **Permanent Destruction:** User-triggered "Delete Project" events execute a hard `DELETE` leveraging MySQL's native cascading `ON DELETE CASCADE`, reliably wiping out all associated task data, comments, and memberships cleanly in one sweep.

**12) Real-Time Synchronization via Polling**
- **Simplified Real-time UX:** Instead of utilizing WebSockets or Server-Sent Events (SSE) which inflate backend infrastructure complexity, the application leverages lightweight short polling (e.g. `setInterval` for 30 seconds for notifications) on the frontend. 
- **Robust Consistency:** This approach ensures that users promptly see updates while preventing connection-drop complications associated with persistent sockets. 

**13) Graceful UI Degradation (Vanilla CSS Styling)**
- **Aesthetic Direction:** Purposeful use of standard, vanilla CSS techniques (e.g., standard Flexbox, predefined hex colors) deliberately rejecting heavily abstracted UI frameworks or utility-class heavy approaches.
- **Modular Styling Strategy:** The frontend strictly separates globally applicable app-wide layouts inside `DashBoard.css` from component-specific encapsulated styling via CSS Modules (`*.module.css`), ensuring absolute zero class-name collisions without compiler overhead.

**14) Stable Sequential Execution**
- **Predictable API Behaviors:** In places requiring multiple fetch calls, the frontend deliberately implements sequential `await` operations instead of concurrent `Promise.all` patterns. This prevents database bottlenecking and guarantees a reliable loading waterfall mechanism.
