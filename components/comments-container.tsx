import CommentViewer from "../islands/comment-viewer.tsx";
import { RankedComment } from "~/jobs/comment/queries.ts";

interface CommentsContainerProps {
  comments: RankedComment[];
  newsId: number;
}

export default function CommentsContainer({ comments, newsId }: CommentsContainerProps) {
  const renderComment = (comment: RankedComment, depth: number = 0) => {
    return (
      <div key={comment.id} style={{ paddingLeft: `${depth === 0 ? 0 : 1.5}rem` }}>
        <CommentViewer
          comment={comment}
          newsId={newsId}
          isRoot={depth === 0}
        />
        {comment.children.map((child) => renderComment(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="mt-8">
      {comments.map((comment, index) => (
        <div key={comment.id}>
          {renderComment(comment)}
          {index < comments.length - 1 && <hr className="my-4 mx-1 border-gray-200" />}
        </div>
      ))}
    </div>
  );
}
