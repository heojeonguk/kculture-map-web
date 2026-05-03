'use client'

export default function BannerAd() {
  return (
    <div className="w-full flex justify-center my-4">
      <script src="https://ads-partners.coupang.com/g.js"></script>
      <script dangerouslySetInnerHTML={{__html: `
        new PartnersCoupang.G({"id":985823,"template":"carousel","trackingCode":"AF8718289","width":"680","height":"140","tsource":""});
      `}} />
    </div>
  )
}
