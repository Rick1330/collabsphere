import { Input } from "@collabsphere/ui/components/input";

import { SettingsSection } from "./settings-section";

const placeholderProfile = {
  name: "CollabSphere Member",
  email: "current-user@pending.example",
  bio: "Current-user profile wiring will attach here once the account API is exposed to the web shell.",
};

export function ProfilePanel() {
  return (
    <SettingsSection
      title="Profile"
      description="The shell is ready for editable profile data. This surface keeps the final structure stable while account data wiring lands."
    >
      <div className="grid gap-5">
        <div className="flex items-center gap-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
            CM
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">Avatar</p>
            <p className="text-sm text-stone-500">Avatar upload connects once profile mutations are available.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="profile-name">
              Full name
            </label>
            <Input id="profile-name" defaultValue={placeholderProfile.name} readOnly className="h-11 rounded-xl border-stone-200 bg-stone-50" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="profile-email">
              Email
            </label>
            <Input id="profile-email" defaultValue={placeholderProfile.email} readOnly className="h-11 rounded-xl border-stone-200 bg-stone-50" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">Bio</p>
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
            {placeholderProfile.bio}
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

