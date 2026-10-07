<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Firebase (Firestore + Auth) is the data layer; all DB access goes through src/services/*, auth only via src/services/auth.service.ts + useAuth(). Why: viva-explainable layering, swappable config.
- Seat double-booking is prevented by deterministic seatLocks/{scheduleId}_{seatId} docs created in a Firestore transaction. Why: atomic and enforceable in rules.
