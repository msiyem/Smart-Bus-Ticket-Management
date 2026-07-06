import { BusTicketSearchPage } from "@/components/buy-ticket/bus-ticket-search-page";
import { getUser } from "@/lib/auth/getUser";

type SearchParams = Record<string, string | string[] | undefined>;

function getSearchValue(searchParams: SearchParams, key: string) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function BusTicketSearchRoute({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getUser();

  const params = await searchParams;

  return (
    <BusTicketSearchPage
      isAuthenticated={!!user}
      initialSearch={{
        source: getSearchValue(params, "fromcity"),
        destination: getSearchValue(params, "tocity"),
        date: getSearchValue(params, "doj"),
      }}
    />
  );
}