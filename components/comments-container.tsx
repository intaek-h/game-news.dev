import { comments } from "~/db/migrations/schema.ts";
import CommentViewer from "../islands/comment-viewer.tsx";

interface Comment {
  id: number;
  content: string;
  userId: string;
  username: string;
  createdAt: typeof comments.$inferSelect["createdAt"];
  parentId: number | null;
  hasUpvoted: boolean;
}

interface CommentsContainerProps {
  comments: Comment[];
  newsId: number;
}

export default function CommentsContainer({ comments, newsId }: CommentsContainerProps) {
  // Sort comments by creation date, newest first
  const sortedComments = [...comments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Create a map of parent comments to their children
  const commentMap = new Map<number, Comment[]>();
  const topLevelComments: Comment[] = [];

  sortedComments.forEach((comment) => {
    if (comment.parentId) {
      if (!commentMap.has(comment.parentId)) {
        commentMap.set(comment.parentId, []);
      }
      commentMap.get(comment.parentId)!.push(comment);
    } else {
      topLevelComments.push(comment);
    }
  });

  const renderComment = (comment: Comment, depth: number = 0) => {
    const children = commentMap.get(comment.id) || [];

    return (
      <div key={comment.id} style={{ paddingLeft: `${depth * 1}rem` }}>
        <CommentViewer
          comment={comment}
          newsId={newsId}
        />
        {children.map((child) => renderComment(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="mt-8">
      {topLevelComments.map((comment) => renderComment(comment))}
    </div>
  );
}
