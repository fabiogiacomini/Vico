# Vico — Mobile Group Coordination Implementation Plan

Version 0.3 · 26 October 2026 · Implementation baseline; native feasibility still open

Build a free, open source Android and iOS app that helps small groups prepare an outing, share their location privately, follow a route and agree where to meet. Add weather and crowd information when suitable data exists. The app must explain missing, old or uncertain information instead of inventing coverage.

This plan covers the mobile product, its supporting services and maintenance after launch. Highway analytics, desktop applications and the business signals website are outside its scope. Confirmed product principles are separated from proposed release defaults and engineering decisions that need evidence before implementation.

## 1 Product principles

The following principles reflect the agreed product direction.

- Release the app free of charge for Android and iOS.
- Publish Vico original application and supporting service code in a public GitHub repository under the MIT License, selected by the owner. Preserve third-party notices and verify dependency compatibility.
- Write repository documentation, contribution guidance and technical decisions in clear English. Prepare the interface for translation from the start.
- Start with small outdoor groups, while keeping basic group coordination useful in towns and other settings.
- Make private communication, shared routes and meeting points useful independently of crowd data coverage.
- Use real data with an identifiable source and suitable reuse rights. Never turn missing data into a low crowd estimate, a safe route or a clear weather forecast.
- Protect messages, locations and private outing content with end-to-end encryption. Use established protocols and reviewed implementations.
- Support downloaded information and local navigation aids when Internet access is unavailable. Explain which functions need a connection.
- Maintain the source catalog and its integrations after release. Data coverage is expected to grow over time.

Worldwide usability means that the core workflow is not restricted to a pilot city. It does not mean universal map detail, route coverage, mobile reception or crowd measurements. Even without a usable basemap, the app should still expose available coordinates, saved content and connection status. Initial group admission and delivery of new group information require connectivity in the first release.

## 2 Users and proposed release defaults

The initial audience is a small group of friends, walkers or hikers with mixed Android and iOS phones. One person organizes the outing; every participant controls their own location sharing. The organizer can manage membership and the agreed route, but cannot silently enable another person's tracking.

The following are working defaults for planning, not additional user decisions.

| Area | Proposed first release default |
| --- | --- |
| Group size | Up to 20 participants per outing, subject to cross-platform field validation |
| Identity | A device identity and a chosen display name; no mandatory phone number or address book upload |
| Devices | One active device per participant; device replacement requires a visible identity change and re-admission |
| Location sharing | Off until the participant starts it for a specific outing; always has an expiry |
| Group lifetime | A planned start and end, with an explicit extension workflow |
| Languages | English-only interface, confirmed by the owner; English is the canonical repository language |
| History | Temporary outing history; no permanent location timeline by default |
| Public discovery | No directory of nearby people or public live group map |
| Crowd contribution | Manual reports to one's private group in the first release; no automatic public location collection |

A persistent group directory, multiple devices, identity recovery and public community reporting are later features. Losing a device must not imply that the operator can recover encrypted history.

## 3 Release scope

Release 1 is a complete group outing workflow with private messaging, maps, route following, offline preparation, weather context and honest handling of optional crowd sources. At least one crowd source should complete a bounded pilot before public launch; its absence elsewhere must not block the app.

The first release includes simple online walking route calculation where a configured provider supports it. Downloaded GPX following is available independently. Full offline route calculation, a public route marketplace, public crowd reports, automatic crowd statistics, voice and video calls, satellite integrations, Bluetooth mesh and automatic rescue dispatch are outside Release 1.

The app supports coordination and orientation. It must not describe a suggested path as guaranteed safe or present a group message as a confirmed emergency service request.

## 4 Main user journeys

### Prepare an outing

The organizer creates an outing, selects an end time, imports a GPX file or selects a supported walking route, and sets a meeting point. Participants join through an expiring invitation and confirm membership. Each phone downloads the selected map area and route, checks permissions and storage, and displays weather and crowd coverage where available.

### Travel together

Participants start their own location sharing. The map shows the agreed route, meeting point and authorized members. Each member marker includes the observation time and available location accuracy. Short status messages reduce typing: "I am OK", "I am stopping here", "Wait for me" and "I am going back".

### Rejoin the group

A participant selects the agreed meeting point or proposes another one. The app shows a saved route segment or requests a supported walking route. If neither is available, it shows the point and available distance information without drawing an invented walkable path. A moving person's last known position is not automatically treated as a fixed destination.

### Continue without Internet

The phone displays the downloaded map, route, own available satellite position, saved meeting point and received content. Other members remain visible only at their last received positions, with their age shown. New messages stay visibly queued. Weather and crowd information is labelled as cached and dated.

### Understand an unfamiliar place

The user opens the context panel for an area. The app shows available weather, crowd metrics, historical patterns and private group reports separately. Where no approved source covers the area, it says so and allows the user to suggest a source. Core navigation and group functions remain accessible.

### End an outing

Sharing stops at the locally stored expiry even without connectivity. Ending an outing online informs other devices; an organizer's offline action cannot instantly stop remote devices. Participants see the retention deadline and can remove their local outing data. The app does not promise deletion of copies another participant already saved.

## 5 Release 1 feature catalog

Each requirement below belongs to Release 1. IDs provide a stable reference for future issues and acceptance tests; they are not implementation task numbers.

### Membership and outing controls

| ID | Feature | Required behavior |
| --- | --- | --- |
| G01 | Create an outing | Set title, schedule, expiry and optional route; store private details encrypted |
| G02 | Invite participants | Share an expiring link or QR code; require admission confirmation; let the organizer revoke unused invites |
| G03 | Membership list | Show current authorized members and distinguish organizer, participant and pending admission |
| G04 | Leave or remove | Stop future authorized delivery after membership reconciliation and key updates; do not claim to retract received content |
| G05 | Sharing controls | Start, pause and stop own location sharing; show recipients and end time on the active outing screen |
| G06 | Preparation check | Check map and route availability, storage, permissions, battery indication and meeting point; identify gaps without preventing local viewing |
| G07 | End and extend | Stop sharing on expiry; extensions require each participant to opt into additional sharing time |
| G08 | Identity verification | Offer a device verification code or QR; make identity changes visible before further sensitive sharing |

### Maps and routes

| ID | Feature | Required behavior |
| --- | --- | --- |
| M01 | Map and own location | Show available map data, own position, accuracy and a location unavailable state |
| M02 | Group positions | Display authorized positions with observation age; never label a cached marker as live |
| M03 | Point selection | Select a destination on the map or enter coordinates; offer online place search only through an approved provider |
| M04 | GPX import | Validate the file, preserve segment boundaries and gaps, show the trace and source details, and reject malformed or excessive files safely |
| M05 | Route following | Show progress and distance from the saved trace where GPS quality permits; do not infer turn instructions from an arbitrary line |
| M06 | Online walking route | Calculate only where an approved service supports the area and mode; show limitations and save the accepted result |
| M07 | Meeting points | Propose a point, confirm the active point and show who has acknowledged it; synchronize changes as encrypted versioned events |
| M08 | Offline packs | Download a bounded area with permitted map resources, route, meeting point and dated context; show size, progress, completeness and removal controls |
| M09 | Route changes and alerts | Version route changes; show the latest received version; use persistent deviation and GPS accuracy to avoid single-fix off-route alarms |
| M10 | Personal route recording | Optional local recording and GPX export controlled by the user; keep it separate from public crowd contribution and warn that exported files contain location history |

Distance, direction, elevation and estimated walking time must be labelled according to their source. A straight-line distance is not a walking distance. Shared route updates are authored by the organizer in Release 1; participants can propose changes through a message. Acknowledgment means receipt and explicit confirmation, not proof that someone followed the route.

### Private communication

| ID | Feature | Required behavior |
| --- | --- | --- |
| C01 | Group text | End-to-end encrypted text and private outing events; no plaintext message content in server storage or push payloads |
| C02 | Quick status | Send a short status, optionally attached to the sender's explicitly selected location |
| C03 | Location notes | Attach private notes such as "unclear junction" to a point, with author, observation time and expiry |
| C04 | Delivery state | Distinguish queued, sent to relay, delivered to a device and failed; never equate sending with reading or assistance arriving |
| C05 | Reconnection | Retry safely without duplicates, reconcile membership and expiry first, and preserve the original observation time |
| C06 | Route sharing | Transfer validated GPX or normalized route data as encrypted outing content; general photos, audio and other attachments follow later |
| C07 | Permanent chat deletion | Remove app-managed local history, its dedicated key, pending transmissions and private cache copies; distinguish local completion from pending and confirmed deletion requests on other devices |

### Weather

| ID | Feature | Required behavior |
| --- | --- | --- |
| W01 | Weather context | Show supported forecasts for the current area, destination and selected points along a route |
| W02 | Map layer | Show forecast markers or route segments for a chosen time; distinguish a forecast from a measurement and avoid inventing fine spatial detail |
| W03 | Route time | Show weather at estimated passage times using an explicit pace assumption that the user can change |
| W04 | Weather freshness | Show provider, forecast issue time when supplied, valid time, retrieval time and offline or expired status; do not invent a missing issue time |

Initial variables are precipitation probability or amount, temperature, wind and gusts where supported. A continuous animated weather overlay is a later improvement. Official warning feeds are a separate integration; model output must not be relabelled as an official warning.

### Crowding and evidence

| ID | Feature | Required behavior |
| --- | --- | --- |
| D01 | Coverage lookup | Match an area against approved source coverage and show the actual measured area or sensor location |
| D02 | Metric display | Preserve whether the source counts people present, passages, detected devices or a relative index |
| D03 | Historical patterns | Show typical time-of-day activity separately from recent observations, with the period and sample coverage used |
| D04 | Missing data states | Distinguish valid zero, no coverage, not checked, insufficient samples, old data and provider failure |
| D05 | Private crowd reports | Allow participants to report crowd conditions to their own group, with observation time and expiry; identify them as user reports |
| D06 | Source detail | Show attribution, metric explanation, coverage, update cycle and known limitations; offer a source suggestion or problem report |

Release 1 does not convert detected devices or app participants into total people. It does not average unrelated metrics into a universal crowd score. Historical estimates require sufficient observations and a documented method; otherwise show the available series or no estimate.

### Accessibility and personal controls

| ID | Feature | Required behavior |
| --- | --- | --- |
| U01 | Accessible interaction | Support screen readers, larger text, clear contrast and touch targets; pair map colors with text or symbols |
| U02 | Language and units | Offer translated strings, local time presentation and metric or imperial units without changing stored measurement meaning |
| U03 | Data controls | Explain sharing, retention, export and deletion; allow removal of locally saved outings and offline packs |
| U04 | Battery and connectivity | Show paused tracking, missing permissions and unavailable connectivity; offer a lower update mode with an explicit freshness tradeoff |
| U05 | Help and diagnostics | Explain offline limits and failed delivery; collect redacted diagnostics only through a deliberate user action |

## 6 Screen structure

Use six primary destinations: outings, active outing map, group conversation, route and meeting details, offline downloads, and settings. Weather, crowd evidence, source details and member details open as panels from the map. Preparation is a short checklist before an outing starts.

The active outing screen must keep three facts visible: whether the user's location is being shared, whether the device is connected, and how recent another member's position is. Source and precision details should be available without overwhelming the map.

Suggested English states include "No crowd data for this area", "Last updated 18 minutes ago", "Historical pattern", "Reported by a group member", "Queued until connected" and "Location sharing paused". Do not use "Nobody here" for a missing response.

## 7 Offline and synchronization behavior

| Capability | Connected | Disconnected after preparation |
| --- | --- | --- |
| Own position | Available if positioning succeeds | Available if positioning succeeds |
| Basemap | Available where the provider supports it | Downloaded complete areas only |
| GPX and meeting point | Current received version | Saved version with version and timestamp |
| New walking route | Where the provider supports it | Unavailable in Release 1 |
| Other participants | Latest authorized received positions | Last received positions, visibly dated |
| Messages | Delivered subject to connectivity and device state | Queued locally; previous content remains available within retention |
| Weather and crowd data | Fetch eligible observations | Cached data, with age and expiry |
| Join or change membership | Supported | Wait for authenticated reconciliation |
| Stop own sharing | Immediate local stop | Immediate local stop |

After reconnection, validate group membership, identity changes, the participant's current sharing state, expiry and route versions before releasing queued content. Expired outing messages must not be sent. Location updates are coalesced: send the newest eligible location rather than replaying a trail of old coordinates. Chat messages retain their original creation time. Device clocks and out-of-order observations must not make old information appear new.

Pausing, stopping, leaving or reaching the sharing expiry must also discard pending location transmissions and prevent them from being sent on reconnection. Resuming sharing requires a new eligible observation. Previously delivered locations cannot be retracted from another participant's copies.

An offline pack is ready only after its required resources pass completeness checks. Verify it again before departure, after an interrupted download and when storage pressure may have removed resources. Existing downloaded data must not disappear merely because a source endpoint is temporarily unavailable.

Android and iOS require specific background location handling and can suspend or terminate applications. Release claims must reflect physical-device tests, not simulator success. See [Apple background location](https://developer.apple.com/documentation/corelocation/handling-location-updates-in-the-background) and [Android background location limits](https://developer.android.com/about/versions/oreo/background-location-limits).

## 8 Data sources and continuous maintenance

### Source registry

Maintain a versioned public registry alongside the code. A source record contains provider and documentation links, geographic coverage, supported features, metric definition and units, spatial resolution, time zone, observation interval, expected publication delay, expiry policy, license, attribution, access method, quotas, operating costs, maintainer, last validation and lifecycle state. Keep credentials outside the public registry.

Store observation time, publication time and retrieval time separately when supplied. For forecasts, also store the issue time and valid time. Retain quality flags, known gaps and the original source identifier so a displayed value can be traced to its evidence.

Source states are candidate, pilot, active, degraded and retired. Data states are independent: a source can be active while a particular place has no observations.

### Adding a source

1. Accept a proposal from a maintainer, a public catalog, a partner or a community issue.
2. Verify reuse rights, allowed caching, attribution and cost. A public dashboard is not sufficient permission to reuse its data.
3. Confirm metric meaning, geographic coverage, actual recent records, timestamps, update cadence and known sensor limitations.
4. Implement or configure an adapter and check duplicates, missing values, units and invalid observations.
5. Run a bounded pilot. Compare declared update intervals with observed deliveries and record interruptions.
6. Activate the source through a reviewed registry change and retain an easy rollback path.

Automated discovery may suggest candidates. It must not activate unreviewed sources, change licensing assumptions or grant new permissions on users' phones.

### Updating sources after launch

Separate three activities: refreshing observations from approved sources, maintaining existing integrations, and discovering new sources. Poll each feed at a cadence justified by its publication schedule and quota; a daily dataset must not be queried every minute.

Use an authenticated, versioned configuration manifest with integrity verification, compatible app versions and rollback. Supported changes include coverage, endpoints, attribution, expiry policies and disabling a failing source. Changes to data collection purposes or device permissions require an explicit product update and appropriate user choice.

| Change | Delivery path |
| --- | --- |
| New observations | Normal provider refresh; no app update |
| Another source supported by an existing adapter | Reviewed registry and configuration update |
| New provider format processed on the server | Reviewed connector code and server deployment; no app update if the client data contract stays compatible |
| New on-device parsing, screen behavior or permission | Reviewed mobile release |
| Source outage or license withdrawal | Disable affected refresh or use, show its status, and apply the documented caching rules |

Configuration must never download arbitrary executable code into the app. Retain the last valid configuration during temporary update failures, with an expiry and emergency disable policy. Provider input is untrusted and must be validated before storage or display.

### Operating responsibilities

Assign a data maintainer and backup for each production source. Check parsing, freshness and error rates on each refresh; review degraded sources weekly; review discovery proposals monthly; review licensing, coverage and costs quarterly and after announced changes. Record operational incidents without publishing credentials or personal locations.

These are requirements for the future service. They do not create scheduled jobs or ongoing monitoring from this planning document.

## 9 Initial source candidates

These candidates establish feasibility and pilot scope. Activation depends on the registry checks above, including an actual recent-record test.

| Candidate | Planned role | Conditions |
| --- | --- | --- |
| OpenStreetMap derived maps with MapLibre | Basemap and downloadable areas | Select a provider or deployment that permits offline distribution. Standard OSM raster tile servers prohibit offline bulk download. See [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) and [MapLibre](https://maplibre.org/) |
| Open walking routing service | Online routes between selected points | Select after checking geographical coverage, pedestrian profile, reuse terms, quotas and privacy; keep GPX following independent |
| Open-Meteo | Forecast values for area and route points | Distinguish open data licensing from hosted API access conditions. Confirm the deployment's permitted usage, attribution and funding. See [documentation](https://open-meteo.com/en/docs) and [terms](https://open-meteo.com/en/terms) |
| BolognaWifi Affollamento | Initial crowd adapter and urban data pilot | Hourly aggregates of devices in monitored Wi-Fi areas; catalog declares daily updates and CC BY 4.0. This is not a total people count or guaranteed live feed. See [official catalog](https://www.dati.gov.it/node/view-dataset/dataset?id=a44eec7e-5b6e-4a81-9e33-0355cf5f9c66) |
| Melbourne pedestrian counters | Optional second adapter to test international reuse | Directional passages, not simultaneous occupancy. Published service describes minute observations and 15 minute updates; verify operating sensors and current delivery. See [official catalog](https://discover.data.vic.gov.au/en_AU/dataset/pedestrian-counting-system-past-hour-counts-per-minute) |

Run the source pilot in a covered area and the outing pilot on a selected walking route. Also test an area with no crowd source. A successful urban data pilot is not proof of coverage on hiking trails.

## 10 Security and privacy requirements

End-to-end encryption covers messages, positions, route files, meeting points, private reports and private outing details. The relay transports ciphertext and must not hold the keys needed to decrypt that content. Transport encryption remains necessary as well.

Use established Signal protocol specifications as the starting point for security evaluation. The Double Ratchet is a component of secure messaging, not a complete group application. The selected design must also handle authenticated membership, admission and removal, identity verification, asynchronous delivery and device replacement. It must define forward secrecy and recovery after compromise for the actual group design and evaluate current post-quantum options without promising permanent immunity. See [Signal specifications](https://signal.org/docs/specifications/doubleratchet/).

The official libsignal repository uses AGPL-3.0 and states that external use is unsupported and APIs may change. Treat licensing, maintenance and mobile integration as an engineering decision before adopting it; do not assume it is a supported plug-in SDK. See [libsignal](https://github.com/signalapp/libsignal).

Required security work includes:

- Write a threat model covering network interception, service compromise, malicious invitees, stolen devices, metadata and third-party data requests.
- Use reviewed cryptographic implementations; do not implement a new protocol from published equations.
- Authenticate invitations and membership changes. Rotate or replace relevant keys before future content is sent after removal. Offline queues must be reconciled before transmission.
- Store sensitive local content encrypted and protect key access with platform facilities. Design behavior while the device is locked and after reinstall or replacement.
- Exclude secrets and private location data from logs, analytics, crash reports and push notification payloads.
- Keep plaintext cloud backups disabled in Release 1. Do not promise server-assisted recovery of encrypted history.
- Review all mapping, geocoding, routing and weather requests: they may disclose an area of interest even when group messages are encrypted. Prefer area caching and local processing where practical; document remaining provider and transport metadata.
- Obtain an independent security review before public release and address release-blocking findings.

Private group sharing must never imply consent to public crowd statistics. Future automatic crowd contributions require a separate opt-in, an evaluated aggregation method and explicit protection for sparse locations. Removing names alone is insufficient anonymization. See [EDPB guidance on anonymization and pseudonymization](https://www.edpb.europa.eu/topics/ai-and-technology/anonymisation-pseudonymisation_en).

### Permanent chat deletion

The owner requires deletion of app-managed chat content to be effective and irreversible within Vico. Removing a list entry is insufficient. Erase the dedicated history key and all controlled copies, queues, caches and previews. Persist deletion intent first, resume interrupted cleanup and reject delayed writes or replays that could resurrect old content. Keep history keys separate from active identity, membership and protocol state.

Distinguish deletion on this device from requests sent to other authorized devices. An offline peer stays pending until it processes and confirms deletion. Relay acceptance is not proof of remote completion. Screenshots, exports and copies outside Vico are outside scope, as explicitly agreed by the owner. Verify platform backups and snapshots before making release claims. See the implementation repository's `docs/deletion.md` for the current design and evidence requirements.

### Proposed retention defaults

| Data | Default for the implementation baseline |
| --- | --- |
| Live location delivery | Coalesce to the latest update; expire undelivered updates after 10 minutes or outing expiry, whichever is earlier |
| Received member positions | Keep the last received position for the active outing; remove during outing cleanup |
| Queued text and outing content | Expire at outing end plus 24 hours at the latest; never send new content after the outing has expired |
| Local outing history | Expire 24 hours after the outing ends, with a visible earlier deletion control and cleanup at the next permitted execution |
| Personal recording | Persist only if the user explicitly chooses to save it; manage separately from group history |
| Service backups | Back up configuration and non-sensitive operations data; exclude private message queues and private content in Release 1 |

Outing cleanup applies to private copies in offline packs, caches, previews, search indexes and temporary files, including member positions, shared routes, meeting points and notes. Check expiry before opening, displaying or processing content. Expired content must no longer be available through the app when execution resumes; physical cleanup runs when the operating system permits. Do not promise an exact physical wipe while a device is powered off. Public basemap resources may remain under their own storage rules. Keeping a personal route requires a deliberate save or export action with a clear retention choice; it must not silently preserve private group data.

Recipients may retain exports or screenshots. Forward secrecy and message expiry do not delete such copies. Logs containing operational metadata need a justified maximum retention period and deletion policy before the pilot; public release requires a reviewed data inventory.

## 11 Technical structure and engineering decisions

Use four components with clear responsibilities.

| Component | Responsibility |
| --- | --- |
| Mobile client | Interface, positioning, encrypted local storage, encryption and decryption, route following, offline packs and synchronization |
| Private relay | Authenticated delivery of encrypted content, membership transport, short-lived queues and notification wakeups |
| Context data service | Fetch approved public weather and crowd sources, normalize observations and serve cacheable area data without access to private group content |
| Source registry | Coverage, contracts, licenses, freshness rules, compatible adapters, operational status and versioned configuration |

The context service must not obtain private group coordinates by reading relay data. Any area request from the client should minimize precision and linkage where practical. A proxy changes who sees a request; it does not automatically make it anonymous.

Prefer shared mobile application code with native integration where background location, secure storage or mapping requires it. Select the framework only after a small Android and iOS prototype proves those integrations. MapLibre is a candidate renderer; a renderer does not itself supply maps or route calculation.

Record the following engineering decisions before building their dependent features: mobile framework and supported OS versions; map storage and offline provider; routing provider; messaging protocol and library; identity and membership scheme; repository license compatibility; hosting and notification services; data retention and operational logs. Assign an owner and a decision deadline within the relevant milestone.

Core data entities are outing, membership, encrypted event, position observation, route version, meeting point, offline pack, source record, external observation and private report. External observations include metric, units, spatial footprint, applicable interval, source timestamps and quality state. Keep private entities separate from the public source catalog.

## 12 Implementation sequence

| Milestone | Deliverable | Exit condition |
| --- | --- | --- |
| A Feasibility | Physical Android and iOS prototypes for map downloads, background positioning, encrypted exchange and one context source | Demonstrate screen-locked operation, disconnect and reconnect, expiry and data provenance; resolve stack and license choices |
| B Local outing | Map, own position, GPX, meeting point, offline preparation and accessible screen structure | A prepared phone completes the saved route workflow in airplane mode without requiring a crowd feed |
| C Private group | Admission, encrypted group events, position sharing, chat, route versions and membership changes | Mixed-platform group passes identity, delivery and offline reconciliation tests |
| D Context sources | Weather, crowd evidence panel, registry, one approved crowd adapter and configuration updates | Correct source meaning, coverage, stale states, outage behavior and rollback demonstrated |
| E Field pilot | Small groups on real routes plus a two-week source observation period | Required scenarios pass; battery and delivery results are documented; participants understand data age and absence |
| F Public release | Security review, resolved critical issues, documentation, deployment guides and release packages | Release checklist passes and named maintainers can operate the service |

Use functional issues linked to the catalog IDs and acceptance scenarios. Estimate effort and calendar dates after Milestone A establishes the integration risks, team capacity and operating budget.

## 13 Acceptance and release evidence

The following scenarios are required. Test on physical Android and iOS devices, including at least one lower-performance supported device and one long outing with the screen usually locked.

| Test | Passing outcome |
| --- | --- |
| A01 No crowd coverage | Group and route workflows remain usable; the crowd panel says no coverage and never displays a fabricated zero |
| A02 Offline preparation | Complete packs open after restart in airplane mode; interrupted or missing packs are not marked ready |
| A03 Last known position | After a member loses connectivity, the marker retains its original observation time and cannot appear current |
| A04 Offline messages | Queued messages remain visibly queued; eligible messages reconcile without duplicates after reconnect; expired ones are not sent |
| A05 Membership changes | A removed member cannot decrypt new content after the change is applied; returning senders reconcile membership before releasing queued content |
| A06 Stop and expiry | Pause, local stop, leaving and locally stored expiry stop new location collection for sharing and discard pending transmissions even without Internet; reconnection sends no old queued position |
| A07 Route integrity | GPX gaps stay gaps, malformed input is handled safely, and a new route version cannot silently overwrite a newer accepted version |
| A08 Navigation limits | No routing coverage or weak positioning results in an explicit limitation; no straight line is presented as a walkable route |
| A09 Source semantics | Device counts, pedestrian passages, historical patterns and user reports remain distinguishable with source and time |
| A10 Data state handling | Valid zero, empty response, provider failure, stale value and insufficient samples produce their intended distinct states |
| A11 Source maintenance | A compatible source can be activated, disabled and rolled back without reinstalling; an invalid manifest is rejected |
| A12 Weather time | Forecast valid time is preserved; changing walking pace updates the requested passage time; old cached forecasts remain clearly dated |
| A13 Privacy | Private content is absent from server plaintext, pushes, logs and diagnostics; group sharing sends no public crowd contribution |
| A14 Identity and invitations | Expired or revoked invites fail; membership needs confirmation; changed device identity is visible |
| A15 Accessibility | Key workflows work with a screen reader, larger text and without relying only on color |
| A16 Battery and recovery | Record battery use, location gaps, storage and reconnect behavior during an eight-hour prepared outing; meet the device-specific budget fixed at Milestone A |
| A17 User comprehension | Pilot participants can distinguish live or recent data, old data, estimates, reports and missing coverage without coaching |
| A18 Cleanup | Retention jobs and client cleanup remove eligible content including private copies inside offline packs and caches; exported user files and the limits of remote deletion are explained |
| A19 Permanent deletion | Local key and managed-content deletion survives restart and interruption without resurrection; remote requests distinguish pending, failed and confirmed devices; external copies remain explicitly outside scope |

Suggested performance targets for Milestone A are a cached outing opening within three seconds and connected updates appearing within 15 seconds after receipt by the relay under the agreed test network. These are test targets, not guarantees during operating system suspension or weak connectivity. Fix the supported-device battery budget and location update policy before the field pilot rather than choosing an unsupported battery claim.

## 14 Repository and sustainable operation

Publish the mobile app, service code, source registry, test fixtures and deployment instructions. Use synthetic or appropriately licensed public data in examples; never publish private group histories or credentials.

The repository should include a concise README, this implementation plan, an architecture overview, protocol and privacy decisions, a source contribution guide, a threat model, a security reporting policy, contributing instructions, license and attribution notices, translation guidance, tests and release notes. Keep English sentences short and define specialist terms.

Separate open source software licensing, open data licensing, hosted service access and free distribution to users. Maintain an inventory of dependencies and license obligations. Android and iOS operating systems, app distribution and notification services may introduce platform dependencies even when the project's own code is open.

Before launch, identify who funds hosting, map storage and bandwidth, monitoring, security review and maintenance. Sponsorship or institutional support may fund free access; selling private locations is incompatible with the product principles. Provide a documented deployment path so the project does not depend on a single operator.

## 15 Later releases

Prioritize these after the core workflow passes its field pilot:

1. More approved crowd and weather sources, with community-maintained adapters and a public coverage view.
2. Public manual reports with moderation, rate limits, expiry and abuse handling.
3. Optional privacy-preserving statistical contributions, after calibration and a separate privacy review; label samples as participating devices until a validated population estimate exists.
4. Better route-time weather comparisons and source-supported alternatives for less busy paths.
5. Full offline walking route calculation for downloaded areas.
6. Photos and audio notes with end-to-end encryption, storage limits and metadata handling.
7. Persistent groups, multi-device use and carefully designed encrypted recovery.
8. Additional languages and accessibility improvements informed by real users.

Nearby device communication and external satellite hardware remain research items. They require separate compatibility, range, power and delivery tests and must not be assumed to work between arbitrary phones.

## 16 Decisions to close during preparation

The product is defined enough to begin Milestone A. The remaining choices are bounded and do not require reopening the concept.

| Decision | Responsible role | Required before |
| --- | --- | --- |
| Product name, repository owner and license | Product owner with engineering and license review | Public repository setup |
| Mobile framework and minimum OS versions | Mobile lead | Feature implementation |
| Cryptographic library, membership and device identity design | Security and mobile leads | Private group implementation |
| Map and routing providers, offline rights and capacity | Data and mobile leads | Offline pack and routing implementation |
| Pilot route, group size limit and language defaults | Product and field test leads | Pilot recruitment |
| Retention, privacy notices and source request handling | Product and security leads | External pilot |
| Hosting, source maintenance and funding | Project maintainers | Public release |

The next implementation task is a narrow technical prototype: two physical phones on different platforms, one private outing, one downloaded map and route, one encrypted exchange, an offline interval and an honest no-crowd-data state. Its results determine the stack and the first development estimates.

## Implementation decisions recorded on 26 October 2026

The owner selected Vico and English-only UI. The owner selected MIT for Vico original code; cryptographic-library compatibility remains to be verified before integration. React Native/Expo is a provisional prototype choice pending physical-device evidence. A local prototype implements a bounded subset; see `docs/implementation-status.md` rather than interpreting this complete Release 1 plan as delivered functionality.
