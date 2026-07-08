import { useSearchParams } from "react-router-dom";
import DiscoveryGrid from "../components/discovery/DiscoveryGrid";
import { useDiscoverySearch } from "../hooks/useDiscovery";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const { tracks, loading, error } = useDiscoverySearch(query);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-primary">검색</h1>
      <p className="mb-4 text-sm text-secondary">
        {query ? `"${query}" 온라인 검색 결과` : "검색어를 입력하세요."}
      </p>

      {loading && (
        <p className="py-8 text-center text-sm text-tertiary">검색 중...</p>
      )}

      {error && (
        <div className="rounded-lg border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-primary">
          검색에 실패했습니다: {error}
        </div>
      )}

      {!loading && !error && query && <DiscoveryGrid tracks={tracks} />}
    </div>
  );
}
