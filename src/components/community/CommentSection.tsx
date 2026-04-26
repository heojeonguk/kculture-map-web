interface Comment {
  id: string
  content: string
  user_name?: string
  nation?: string
  created_at: string
  user_level_emoji?: string
}

interface CommentSectionProps {
  comments: Comment[]
  postId: string
  locale: string
}

export default function CommentSection({ comments, postId, locale }: CommentSectionProps) {
  const isKo = locale === 'ko'

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-gray-800 mb-4">
        💬 {isKo ? `댓글 ${comments.length}개` : `${comments.length} Comments`}
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          {isKo ? '첫 댓글을 남겨보세요!' : 'Be the first to comment!'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sm shrink-0">
                {comment.user_level_emoji ?? '👤'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    {comment.nation ?? ''} {comment.user_name ?? (isKo ? '익명' : 'Anonymous')}
                  </span>
                  <span className="text-[10px] text-gray-300">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 댓글 입력 — 로그인 필요 안내 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">
            {isKo
              ? '댓글을 작성하려면 로그인이 필요합니다'
              : 'Please log in to write a comment'}
          </p>
        </div>
      </div>
    </div>
  )
}
