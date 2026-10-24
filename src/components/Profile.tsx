import { useState } from "react";
import { UserRound, Check } from "lucide-react";
export const PROFILE_KEY = "starry-local-profile";
export default function Profile({
  t,
  onNotice,
}: {
  t: (s: string) => string;
  onNotice: (message: string) => void;
}) {
  const [profile, setProfile] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
      return {
        name: typeof p.name === "string" ? p.name : "",
        bio: typeof p.bio === "string" ? p.bio : "",
      };
    } catch {
      return { name: "", bio: "" };
    }
  });
  return (
    <section className="panel profile-page">
      <div className="page-intro">
        <span className="profile-avatar">
          <UserRound size={30} />
        </span>
        <h1>{t("Your profile")}</h1>
        <p>{t("A little about you. Only on this device.")}</p>
      </div>
      <form
        className="settings-card"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
            onNotice(t("Profile saved on this device."));
          } catch {
            onNotice(
              t(
                "Could not save your profile. Browser storage may be unavailable.",
              ),
            );
          }
        }}
      >
        <label>
          {t("Display name")}
          <input
            maxLength={100}
            autoComplete="nickname"
            value={profile.name}
            onChange={(e) =>
              setProfile((v) => ({ ...v, name: e.target.value }))
            }
          />
        </label>
        <label>
          {t("About you")}
          <textarea
            maxLength={500}
            value={profile.bio}
            onChange={(e) => setProfile((v) => ({ ...v, bio: e.target.value }))}
          />
        </label>
        <button className="primary" type="submit">
          <Check size={17} />
          {t("Save profile")}
        </button>
      </form>
      <p className="profile-note">
        {t(
          "No account or login. This profile does not sync and is not included in contact backups. Clearing local data removes it.",
        )}
      </p>
    </section>
  );
}
