export function Logo({ className }: { className?: string }) {
 return (
  <svg width="100%" viewBox="0 0 680 260" xmlns="http://www.w3.org/2000/svg" role="img" className={className}>
   <title>ChayanJobs logo</title>
   <desc>A logo mark for ChayanJobs featuring a brick-red rounded square containing a checkmark, next to the wordmark ChayanJobs.</desc>
   <defs>
    <clipPath id="badgeClip"><rect x="60" y="80" width="120" height="120" rx="26"/></clipPath>
   </defs>
   <rect x="60" y="80" width="120" height="120" rx="26" fill="var(--color-brick)" />
   <g clipPath="url(#badgeClip)">
    <path d="M92 148 L118 174 L172 108" fill="none" stroke="var(--color-brick-ink)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
   </g>
   <text x="212" y="160" fontFamily="var(--font-display)" fontSize="68" fontWeight="700" letterSpacing="-1">
    <tspan fill="currentColor">Chayan</tspan><tspan fill="var(--color-brick)">Jobs</tspan>
   </text>
   <text x="214" y="193" fontFamily="var(--font-body)" fontSize="19" fontWeight="400" fill="currentColor" opacity="0.4" letterSpacing="1.5">select right. serve right.</text>
  </svg>
 )
}
