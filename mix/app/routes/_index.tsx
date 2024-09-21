import type { MetaFunction } from "@remix-run/node";
import DealGrid from "~/components/DealGrid";

export const meta: MetaFunction = () => {
  return [
    { title: "Best Deals Online" },
    { name: "description", content: "Find the best deals online!" },
  ];
};

export default function Index() {
  return (
    <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 min-h-screen text-white overflow-auto">
      <main className="container mx-auto px-4 py-8">
        <DealGrid />
      </main>
    </div>
  );
}
