import { RoutePlaceholder } from "@/components/foundation/route-placeholder";

export default function LoginPage() {
  return (
    <RoutePlaceholder
      title="Login route"
      summary="This route exists so auth/session work lands on top of the real framework boundary instead of the retired placeholder page."
      implementedNow={[
        "Stable /login route in the public route group",
        "Server-rendered page shell and metadata inheritance",
        "Foundation copy explaining the deferred auth contract",
      ]}
      deferredWork={[
        "Credential form and validation",
        "Session bootstrap and redirect rules",
        "OAuth provider wiring and error states",
      ]}
    />
  );
}

