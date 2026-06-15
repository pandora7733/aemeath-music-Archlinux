import { useSearchParams } from "react-router-dom";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">검색</h1>
      <p className="mt-2 text-secondary">
        {query ? `"${query}" 검색 결과` : "검색어를 입력하세요."}
      </p>
    </div>
  );
}
