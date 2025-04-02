export default function Home() {
  return (
    <div>
      <div className="px-4 mb-4 break-keep max-w-screen-sm text-left mx-auto">
        <div className="px-4">
          <div className="mb-8">
            <a
              href={`/news`}
              className="hover:underline underline-offset-4 text-2xl text-gray-900"
            >
              Everyone knows all the apps on your phone
            </a>
            <a
              href=""
              className="hover:underline text-gray-400 underline-offset-4 text-xs ml-1"
            >
              (peabee.substack.com)
            </a>
            <div className="flex text-xs items-center text-gray-300 gap-1">
              <button
                className="hover:underline underline-offset-4"
                type="button"
              >
                upvote
              </button>
              <span>|</span>
              <a href="" className="hover:underline underline-offset-4">
                article link
              </a>
              <span>|</span>
              <span>1 hour ago</span>
              <span>
                by
              </span>
              <a href="" className="hover:underline underline-offset-4">
                jamigo
              </a>
            </div>
          </div>

          <div className="mb-16">
            <ul className="text-sm text-gray-500 list-[circle] [&>li]:mb-4 list-outside ml-4">
              <li>Absent from that link but important context.</li>
              <li>
                That's a strong exaggeration; it's millions of km across in
                three dimensions.
              </li>
              <li>
                Weird, I checked the link but there's no mention of time travel.
              </li>
              <li>
                Don't anthropomorphize machines. They hate it when you do that.
              </li>
            </ul>
          </div>

          <div className="mb-16">
            <form action="comment" method="post" id="comment">
              <textarea
                name="text"
                wrap="virtual"
                rows={6}
                className="w-full p-2 border-none rounded-none font-mono text-gray-900 placeholder:text-gray-400 bg-[#ebeef0] outline-[#bdbbbb]"
                placeholder="What do you think?"
              >
              </textarea>
            </form>
            <button
              type="submit"
              form="comment"
              className="mt-4 text-medium text-blue-900 underline"
            >
              add comment
            </button>
          </div>

          <div>
            <div>
              <a href="">amigdima</a>
              <span>15 minutes ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
