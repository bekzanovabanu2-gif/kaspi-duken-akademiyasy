# Kaspi Duken Akademiyasy

Build a polished, responsive Kazakh-language training portal for teaching people how to launch and manage a Kaspi Магазин. Working title: "Kaspi Academy — Banu". This is an independent educational site, not an official Kaspi product; do not use Kaspi's official logo or imply affiliation.

The user will add all lesson content and data themselves. Deliver the finished visual design and functional content-management scaffolding with attractive empty states and editable sample placeholders, not a filled-out course. Make it mobile-first and excellent on Android phones.

Visual direction: premium modern EdTech dashboard, warm ivory background, deep burgundy/plum accents, muted blush, subtle gold details, clean typography, rounded cards, restrained shadows, clear icons, generous spacing. Elegant, professional, feminine but not childish. All UI copy in natural Kazakh (with familiar Kaspi terms where appropriate).

Pages/sections:
1. Login-free welcome/dashboard with greeting, course progress (starts at 0), continue-learning card, announcements, quick links.
2. Sidebar/bottom navigation: Басты бет, Сабақтар, Модульдер, Практика, Материалдар, Менің нәтижем, Баптаулар.
3. Lessons area with module/category filters, search, lesson cards, status (басталмады/оқуда/аяқталды), duration, editable content area supporting formatted text, links, images/video URL, downloadable resources. Start with tasteful empty states and a few clearly marked editable demo placeholders.
4. Admin/content editor accessible through a clear "Контентті басқару" toggle/section. CRUD for modules, lessons, materials, quizzes and announcements. Add/edit/delete, reorder modules and lessons, set title/description/category/duration, upload or select cover image if supported, add video URL, rich text content, attachments/links, publish/unpublish. Provide preview before publish.
5. Practice/quiz builder with multiple choice questions and explanations; empty state until user adds questions. Learner can take quiz and see score.
6. Materials library with categories, search, links and files.
7. Progress page with completion stats and recent activity.
8. Settings for course title, instructor display name, accent theme, and reset demo content.

Important: Make all buttons and navigation work. Persist user-created content and progress in browser localStorage so it remains after refresh; do not require Supabase or external credentials. Use sensible typed data models and reusable components. Include confirmation before destructive deletes and clear success/error feedback. Add responsive admin forms with validation. Ensure no fake student data or fabricated course content. Put only a couple of clearly labeled sample items as optional examples that can be edited/deleted; otherwise show useful empty states. Add a prominent note that the site is independent and not affiliated with Kaspi.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kaspi-duken-akademiyasy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5096ff46-7bad-4b8d-b5fa-fc5ba5b45bbb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
