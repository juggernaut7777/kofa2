/**
 * Loading skeleton components for KOFA.
 * Show animated placeholders while data loads.
 *
 * Usage:
 *   <SkeletonCard />          — Card-shaped skeleton
 *   <SkeletonRow count={5} /> — Table row skeletons
 *   <SkeletonText lines={3} /> — Text block skeleton
 */

const pulse = {
  animation: 'skeletonPulse 1.5s ease-in-out infinite',
  background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
  backgroundSize: '200% 100%',
  borderRadius: '0.5rem',
}

export function SkeletonCard({ height = 120 }) {
  return (
    <div style={{ ...pulse, height, width: '100%', borderRadius: '0.75rem' }} />
  )
}

export function SkeletonRow({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ ...pulse, width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ ...pulse, height: 14, width: `${60 + Math.random() * 30}%` }} />
            <div style={{ ...pulse, height: 10, width: `${40 + Math.random() * 20}%` }} />
          </div>
          <div style={{ ...pulse, width: 60, height: 24 }} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{ ...pulse, height: 12, width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonGrid({ count = 6, cardHeight = 160 }) {
  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} height={cardHeight} />
        ))}
      </div>
      <style>{`
        @keyframes skeletonPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  )
}

export function SkeletonDashboard() {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} height={100} />
        ))}
      </div>
      {/* Chart placeholder */}
      <SkeletonCard height={250} />
      {/* Table rows */}
      <SkeletonRow count={5} />
      <style>{`
        @keyframes skeletonPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

export default SkeletonDashboard
