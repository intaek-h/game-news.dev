export default function Home() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <a
            href="/admin/entity-images"
            className="text-sm py-1 px-3 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
          >
            View Entity Images
          </a>
        </div>
      </div>
    </div>
  );
}
