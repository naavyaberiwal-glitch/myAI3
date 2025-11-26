export async function supplierSearch(query: string) {
  try {
    const params = new URLSearchParams({
      q: query,
      num: "5",
      key: process.env.GOOGLE_API_KEY || "",
      cx: process.env.GOOGLE_CX || "",
    });

    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`
    );

    if (!res.ok) {
      throw new Error("Supplier search failed");
    }

    const data = await res.json();

    return {
      results: (data.items || []).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      })),
    };
  } catch (error) {
    return {
      results: [],
      error: "Could not fetch supplier information.",
    };
  }
}
