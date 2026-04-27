interface SidebarProps {
  position: 'left' | 'right'
}

export default function Sidebar({ position }: SidebarProps) {
  return (
    <aside className="flex flex-col gap-4">
      {/* 광고 배너 임시 숨김 (애드센스 승인 전)
      <div className="w-[160px] h-[600px] bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-xs text-gray-400 rotate-90 whitespace-nowrap">
          광고 160×600
        </span>
      </div>
      */}
    </aside>
  )
}
