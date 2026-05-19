import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">페이지를 찾을 수 없습니다</h2>
      <p className="text-gray-500 mb-8">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      <Link
        to="/"
        className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors no-underline"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
