import type { Metadata } from "next";
import { Suspense } from "react";
import EmbedClient from "./EmbedClient";

export const metadata: Metadata = {
  title: "UpFlow Widget Embed",
  description: "UpFlow widget embed page (loaded inside an iframe).",
};

export default function EmbedPage() {
  return (
    <Suspense fallback={null}>
      <EmbedClient />
    </Suspense>
  );
}
