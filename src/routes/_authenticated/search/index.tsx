import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/rail/bits";
import { SearchForm } from "@/components/rail/SearchForm";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/search/")({
  head: () => pageHead("Search trains", "Search trains between stations by date and class."),
  component: () => (
    <div>
      <PageHeader title="Search trains" subtitle="Results come straight from the database: routes, schedules and live seat counts." />
      <Card><SearchForm /></Card>
    </div>
  ),
});
