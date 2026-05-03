'use client'
import Script from 'next/script'

export default function BannerAd() {
  return (
    <div className="w-full flex justify-center my-4">
      <div id="coupang-banner" />
      <Script
        src="https://ads-partners.coupang.com/g.js"
        onLoad={() => {
          new (window as any).PartnersCoupang.G({
            id: 985823,
            template: 'carousel',
            trackingCode: 'AF8718289',
            width: '680',
            height: '140',
            tsource: ''
          })
        }}
      />
    </div>
  )
}
