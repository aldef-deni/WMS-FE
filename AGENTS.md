# Git identity required by repository owner

- Every Git commit and push must use author and committer `Deni Afrizal <deniafrizal2904@gmail.com>`.
- Never add `Co-authored-by` trailers or attribute commits to another contributor.
- The primary branch is `Main` (case-sensitive).
- Keep credentials, `.env` files, runtime data, dependency folders, build output and backup archives out of Git. Only a secret-free `.env.example` may be committed.
- This checkout enables `.githooks` through local `core.hooksPath`. After cloning, set `git config --local user.name "Deni Afrizal"`, `git config --local user.email "deniafrizal2904@gmail.com"`, `git config --local user.useConfigOnly true`, and `git config --local core.hooksPath .githooks`.
