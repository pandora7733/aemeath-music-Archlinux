import { useParams } from "react-router-dom";

export default function PlaylistDetailPage() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">플레이리스트</h1>
      <p className="mt-2 text-secondary">플레이리스트 ID: {id}</p>
    </div>
  );
}
