export const getImageFromCdn = (url: string) => {
  // https://game-news.r2.dev/thumbnails/article-104-1742639645960.jpg
  if (!url || !url.startsWith("https://game-news.r2.dev")) return url;
  const u = new URL(url);
  const pathname = u.pathname.slice(1);
  const worker = "https://game-news-cf-worker.ahiou2ahiou.workers.dev";
  const cdnUrl = `${worker}/images/${pathname}`; // FIXME: 이미지 변형 쿼리 파라미터가 동작하지 않음.
  return cdnUrl;
};
