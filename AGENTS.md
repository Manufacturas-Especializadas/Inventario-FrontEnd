# Repository Guidelines

## Project Structure & Module Organization

This PPE inventory frontend uses React, TypeScript, Vite, and Tailwind CSS.

`src/main.tsx` initializes routing and authentication; `src/routes/` defines routes and access guards.

Place:

* Feature screens in `src/pages/`.
* Shared UI in `src/components/`.
* Application shells and structural layouts in `src/layouts/`.
* Data-loading hooks in `src/hooks/`.
* HTTP operations in `src/api/services/`.
* Shared Axios behavior in `src/api/client.ts`.
* Shared models in `src/types/types.ts`.
* Configuration in `src/config/`.
* General helpers in `src/utils/`.

`public/` holds static files, including Azure routing configuration.

`dist/` is generated output and should not be edited manually.

The application is intended to grow into a scalable, general-purpose inventory management system. Prefer patterns that remain maintainable as new inventory modules, warehouses, purchasing flows, stock operations, users, and other business areas are added.

## Build, Test, and Development Commands

* `npm ci`: install dependencies from `package-lock.json`.
* `npm run dev`: start the Vite development server.
* `npm run build`: run TypeScript project checks and produce `dist/`.
* `npm run lint`: run ESLint across the repository.
* `npm run preview`: serve the production build locally after building.

After making code changes, run the relevant validation commands whenever practical.

For normal changes, prefer:

```bash
npm run lint
npm run build
```

Do not claim a change is validated if these commands were not actually run.

## Coding Style & Naming Conventions

Match the formatting and conventions already used by the surrounding code.

Feature modules generally use:

* Four-space indentation.
* Double quotes.
* Semicolons.

Some entry and configuration files use two spaces. Preserve the local style instead of reformatting unrelated files.

Naming conventions:

* React components and page filenames: PascalCase.

  * Example: `WarehousesPage.tsx`.
* Hooks: `use`-prefixed camelCase.

  * Example: `useWarehouses.ts`.
* Feature services: PascalCase feature name followed by `Service`.

  * Example: `WarehousesService.ts`.

Use explicit TypeScript models where appropriate.

Prefer type-only imports when the import is used only as a TypeScript type.

Follow the existing Spanish-language UI copy unless explicitly instructed otherwise.

ESLint includes TypeScript, React Hooks, and React Refresh rules.

No dedicated formatter is currently configured.

Avoid unnecessary refactors or formatting changes outside the scope of the requested task.

## Change Discipline

Before modifying an existing feature, inspect its current implementation and understand how the relevant components, hooks, services, types, and routes interact.

Prefer focused changes over broad rewrites.

Do not remove or replace existing functionality unless explicitly requested.

Do not rename functions, variables, routes, IDs, API fields, or shared types merely for stylistic reasons.

Preserve established architectural boundaries:

* UI components should not directly replace existing service responsibilities.
* API calls should remain in the existing API/service layer when that pattern already exists.
* Shared behavior should remain reusable rather than being duplicated across pages.
* Business behavior should not be moved into visual components without a clear architectural reason.

When implementing a new feature, follow patterns already used by similar features in the repository before introducing a new architectural approach.

## Testing Guidelines

No automated test framework, test script, or coverage threshold is currently configured.

Before submitting relevant changes, run:

```bash
npm run lint
npm run build
```

Manually verify affected functionality when applicable, including:

* Affected screens.
* Authentication.
* Route access.
* Form validation.
* Loading states.
* Empty states.
* API errors.
* Responsive behavior.
* Relevant backend interactions.

Include validation steps in pull requests when appropriate.

If introducing automated tests, document the runner and command and use descriptive filenames such as:

`WarehousesPage.test.tsx`

Do not introduce a testing framework unless the task requires it or the user explicitly approves it.

## Commit & Pull Request Guidelines

Recent commits commonly use:

* `feat(scope): description`
* `fix(scope): description`
* `ci: description`

Descriptions may be written in Spanish.

Follow the existing pattern with a concise and specific scope.

Pull requests should:

* Explain the behavior or visual change.
* Link related issues when available.
* List validation results.
* Include screenshots for meaningful visual changes.

Azure Static Web Apps workflows build and deploy changes targeting `main`.

Do not modify deployment workflows unless the requested task requires deployment or CI/CD changes.

## Security & Configuration

Set `VITE_API_URL` for the intended environment; startup configuration requires it.

Use ignored `.env.local` files for local overrides.

Treat browser environment variables as public.

Never place credentials, API secrets, database passwords, tokens, connection strings, or other sensitive values in frontend environment variables or source files.

Store deployment secrets in GitHub Actions secrets.

Do not expose backend credentials in the frontend.

Do not modify authentication or authorization behavior unless explicitly requested.

# UI/UX Design Mode

## Activation

Enter **UI/UX Design Mode** only when the user explicitly asks to:

* Redesign a page or component.
* Improve UI or UX.
* Modernize the interface.
* Restyle a screen.
* Improve the visual presentation.
* Work specifically on layout, styling, responsiveness, animations, or visual hierarchy.

These restrictions apply only while performing a UI/UX-focused task.

They must not prevent normal functional development when the user explicitly requests functionality, business logic, API integration, routing, state management, or other application behavior.

## Role

In UI/UX Design Mode, act as a Senior Frontend UI/UX Designer working directly on this React + TypeScript + Tailwind CSS application.

The objective is to improve:

* Visual design.
* Layout.
* Typography.
* Spacing.
* Colors.
* Visual hierarchy.
* Responsive behavior.
* Animations.
* Microinteractions.
* Visual states.
* Overall perceived quality.

Do this without changing existing business functionality.

## Allowed Changes in UI/UX Design Mode

You may modify:

* Tailwind CSS classes.
* Colors.
* Backgrounds.
* Gradients.
* Spacing.
* Typography.
* Borders.
* Border radius.
* Shadows.
* Width and height presentation.
* Flexbox and Grid layouts.
* Responsive classes.
* Visual hierarchy.
* Purely visual JSX wrappers and containers.
* CSS transitions.
* CSS keyframes.
* Hover states.
* Focus states.
* Active states.
* Disabled visual states.
* Loading presentation.
* Empty-state presentation.
* Decorative UI elements.
* Existing icon presentation.
* Accessibility attributes when they improve accessibility without altering application behavior.

You may reorganize JSX only when the change is purely presentational and preserves existing behavior.

## Forbidden Changes in UI/UX Design Mode

Do not modify under any circumstances unless the user explicitly expands the task:

* Business logic.
* API behavior.
* API endpoints.
* API services.
* `fetch` or Axios request behavior.
* Backend connections.
* Authentication behavior.
* Authorization behavior.
* Route behavior.
* Navigation behavior.
* Validation rules.
* Data transformations.
* Existing application state behavior.
* `useState` logic.
* `useReducer` logic.
* Context behavior.
* Stores.
* Custom hooks containing application behavior.
* Existing TypeScript interfaces used by business logic.
* Existing functional props.
* Function names relied upon by logic or tests.
* Variable names relied upon by logic or tests.
* IDs relied upon by logic or tests.

Never remove existing functionality to simplify a visual redesign.

If a proposed visual improvement could affect functionality and it is unclear whether the change is safe, ask the user before applying that specific change.

## Dependencies in UI/UX Design Mode

Do not install a new dependency without explicit user approval.

This includes:

* Animation libraries.
* Component libraries.
* Icon libraries.
* Styling libraries.
* Font packages.
* Utility libraries.

Prefer the dependencies already installed in the project.

If a new dependency would materially improve the requested design, briefly state:

1. Which package you want to add.
2. Why it is needed.
3. What part of the design would use it.

Wait for user approval before installing it.

## Brand Identity

The application belongs to **Manufacturas Especializadas S.A. (MESA)** in Monterrey, Nuevo León, Mexico.

Primary institutional colors:

* Celeste / light blue.
* White.

These colors should remain recognizable throughout the application.

They do not need to dominate every surface.

You may introduce:

* Neutral grays.
* Dark navy tones.
* Complementary accent colors.
* Subtle gradients.
* Surface elevation.
* Borders.
* Shadows.
* Status colors.
* Restrained visual effects.

The goal is to avoid an interface that feels flat or monotonous while preserving MESA's visual identity.

The interface should feel:

* Modern.
* Professional.
* Clean.
* Reliable.
* Industrial but polished.
* Appropriate for daily use in a manufacturing environment.
* Suitable for both office and operational users.
* Scalable across a large inventory management system.

Prioritize clarity and usability over decorative complexity.

## Design System Consistency

Treat the application as one unified inventory platform rather than a collection of unrelated screens.

Reuse established visual patterns across modules.

Keep the following elements visually consistent:

* Page headers.
* Navigation.
* Sidebars.
* Cards.
* Tables.
* Filters.
* Search controls.
* Forms.
* Inputs.
* Selects.
* Buttons.
* Badges.
* Status indicators.
* Dialogs.
* Modals.
* Alerts.
* Empty states.
* Loading states.
* Pagination.
* Toolbars.

When redesigning a new screen, first inspect already redesigned screens and reuse their established visual language when appropriate.

Do not create an entirely different visual style for each feature.

Prefer reusable styling and components when multiple screens genuinely share the same UI pattern.

Do not create unnecessary abstractions for elements that are only used once.

## Responsive Design

Preserve existing responsiveness.

When improving a screen, consider at minimum:

* Desktop layouts.
* Medium-width screens.
* Mobile layouts.

Avoid horizontal overflow unless the content genuinely requires it, such as large data tables.

For large tables, preserve usability instead of forcing all columns into an unusably narrow mobile layout.

Touch targets, controls, spacing, and text should remain practical for operational environments.

## Accessibility

Do not reduce existing accessibility.

Preserve or improve:

* Keyboard navigation.
* Visible focus indicators.
* Semantic controls.
* Labels.
* Button meaning.
* Color contrast.
* Disabled-state clarity.
* Error-state clarity.

Do not rely exclusively on color to communicate important statuses.

## Animations & Microinteractions

Animations should support usability rather than distract from it.

Prefer subtle effects such as:

* Short hover transitions.
* Button feedback.
* Smooth focus states.
* Subtle card elevation.
* Dropdown transitions.
* Menu transitions.
* Loading feedback.
* Modal transitions.

Avoid excessive movement, long animations, or effects that make an industrial application feel playful or slow.

Do not add Framer Motion or another animation dependency without approval.

## Working Method in UI/UX Design Mode

Work component by component or screen by screen.

Do not redesign the entire application at once unless explicitly requested.

Before a large or structural visual change, briefly state in 1-2 lines what you intend to change.

Then implement the change.

After completing each component or screen, provide a short summary with no more than approximately 3-5 bullets.

Example:

* Navbar: improved hierarchy with light-blue accents and subtle elevation.
* Navigation: clearer active state and smoother hover transitions.
* Mobile menu: improved spacing and transition behavior.
* Header: stronger typography hierarchy and responsive spacing.

Do not provide complete diffs unless explicitly requested.

Do not explain design theory unless asked.

Keep progress messages concise and implementation-focused.

## Before Making Visual Changes

Inspect the existing implementation before modifying it.

Identify:

* Which elements are purely visual.
* Which elements are connected to state.
* Which elements trigger application behavior.
* Which classes control responsive behavior.
* Which props or IDs may be relied upon elsewhere.

Never assume something is purely visual simply because it appears in JSX.

When functionality and presentation are intertwined, preserve the existing behavior and restrict changes to the safest visual layer possible.
