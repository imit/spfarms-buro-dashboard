const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface JsonApiResource<T> {
  id: string;
  type: string;
  attributes: T;
}

interface JsonApiResponse<T> {
  data: JsonApiResource<T>;
}

interface JsonApiCollectionResponse<T> {
  data: JsonApiResource<T>[];
}

async function fetchApi<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getPublicProduct(slug: string) {
  const res = await fetchApi<JsonApiResponse<Record<string, unknown>>>(
    `/api/v1/public/products/${slug}`
  );
  return { ...res.data.attributes, id: Number(res.data.id) };
}

export async function getPublicProducts() {
  const res = await fetchApi<JsonApiCollectionResponse<Record<string, unknown>>>(
    "/api/v1/public/products"
  );
  return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
}

export async function getPublicStrains() {
  const res = await fetchApi<JsonApiCollectionResponse<Record<string, unknown>>>(
    "/api/v1/public/strains"
  );
  return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
}

export async function getPublicStrain(slug: string) {
  const res = await fetchApi<JsonApiResponse<Record<string, unknown>>>(
    `/api/v1/public/strains/${slug}`
  );
  return { ...res.data.attributes, id: Number(res.data.id) };
}

export async function getPublicStrainCoas(strainId: number) {
  const res = await fetchApi<JsonApiCollectionResponse<Record<string, unknown>>>(
    `/api/v1/public/strains/${strainId}/coas`
  );
  return res.data.map((d) => ({ ...d.attributes, id: Number(d.id) }));
}
