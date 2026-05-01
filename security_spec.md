# V-Vault Security Specification

## Data Invariants
- A video must belong to a valid user.
- A user can only edit their own profile and videos.
- Interactions (likes/unlikes) are unique per user per video.
- Earnings can only be modified by the system or via verified payout actions.
- Monetization status is immutable by creators once approved (simplified for MVP).
- All 18+ content must be flagged.

## The Dirty Dozen Payloads (Rejection Targets)
1. User sets another user's UID as their own.
2. User tries to update their totalEarned balance directly.
3. User tries to delete someone else's video.
4. User tries to like a video multiple times (if we enforced it at rules level, though usually handled by map unique IDs).
5. User tries to create a video without `ownerId` matching `auth.uid`.
6. User tries to inject a 1MB string into the `title` field.
7. User tries to use a non-alphanumeric string as a video ID to poison paths.
8. User tries to set `is18Plus` to `false` on a video they don't own (bypass restriction).
9. User tries to read private user data (if any was specified, but we'll stick to public/private isolation).
10. Anonymous user tries to upload a video.
11. User tries to change someone else's username.
12. User tries to set `monetized: true` without being a creator.

## Test Runner (Mock)
- `test('Users cannot update earnings', ...)`
- `test('Users cannot delete other videos', ...)`
- `test('Video titles must be < 100 chars', ...)`
